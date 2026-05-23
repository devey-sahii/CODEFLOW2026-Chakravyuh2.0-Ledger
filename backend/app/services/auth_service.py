"""
Authentication service for the Smart Expense Auditor platform.

Handles user registration, login, JWT token management, OTP verification,
and current-user resolution — all backed by PostgreSQL (via SQLAlchemy async)
and Redis for OTP storage.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal, get_redis
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_otp,
    generate_otp_secret,
    get_password_hash,
    verify_otp,
    verify_password,
)

# ── Lazy model imports (avoid circular at module load time) ──────────────────
# Models are imported inside methods to prevent issues when models don't exist yet.
# Replace with top-level imports once all model files are in place.


# ─── Exceptions ──────────────────────────────────────────────────────────────


class AuthError(Exception):
    """Raised for all authentication / authorization failures."""

    def __init__(self, message: str, status_code: int = 401) -> None:
        self.message = message
        self.status_code = status_code
        super().__init__(message)


# ─── AuthService ─────────────────────────────────────────────────────────────


class AuthService:
    """
    Async service encapsulating all authentication operations.

    Usage
    -----
    service = AuthService()
    tokens = await service.register_user(email, password, full_name, org_name, role)
    """

    # ── Internal helpers ─────────────────────────────────────────────────────

    @staticmethod
    def _build_token_payload(user_id: uuid.UUID, email: str, role: str, org_id: uuid.UUID) -> dict[str, Any]:
        """Build the base claims dict used for both access and refresh tokens."""
        return {
            "sub": str(user_id),
            "email": email,
            "role": role,
            "org_id": str(org_id),
        }

    @staticmethod
    def _tokens(payload: dict[str, Any]) -> dict[str, str]:
        """Generate access + refresh token pair from payload."""
        return {
            "access_token": create_access_token(payload),
            "refresh_token": create_refresh_token(payload),
            "token_type": "bearer",
        }

    # ── Public API ───────────────────────────────────────────────────────────

    async def register_user(
        self,
        email: str,
        password: str,
        full_name: str,
        org_name: str,
        role: str = "EMPLOYEE",
    ) -> dict[str, Any]:
        """
        Register a new organization and its first admin user.

        Steps
        -----
        1. Create Organization with FREE subscription.
        2. Create User linked to that org.
        3. Return JWT token pair + basic user info.

        Parameters
        ----------
        email : str
            New user's email address (must be unique).
        password : str
            Plain-text password (will be hashed).
        full_name : str
            Display name.
        org_name : str
            Name of the organization to create.
        role : str
            Role to assign (default: EMPLOYEE; first user is ADMIN).

        Returns
        -------
        dict
            ``{"access_token", "refresh_token", "token_type", "user"}``

        Raises
        ------
        AuthError
            If the email is already registered.
        """
        from app.models.organization import Organization, SubscriptionPlan
        from app.models.user import Role, User

        async with AsyncSessionLocal() as db:
            # Check for duplicate email
            existing = await db.execute(
                select(User).where(User.email == email.lower().strip())
            )
            if existing.scalar_one_or_none():
                raise AuthError("Email already registered", status_code=409)

            # Create organization
            org = Organization(
                id=uuid.uuid4(),
                name=org_name.strip(),
                subscription_plan=SubscriptionPlan.FREE,
                is_active=True,
                created_at=datetime.now(timezone.utc),
            )
            db.add(org)
            await db.flush()  # get org.id without committing

            # Create user
            user = User(
                id=uuid.uuid4(),
                email=email.lower().strip(),
                hashed_password=get_password_hash(password),
                full_name=full_name.strip(),
                role=Role(role) if role in Role._value2member_map_ else Role.EMPLOYEE,
                organization_id=org.id,
                is_active=True,
                is_verified=False,
                created_at=datetime.now(timezone.utc),
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)

        logger.info(f"✅ Registered user {email} for org '{org_name}'")

        payload = self._build_token_payload(user.id, user.email, user.role.value, org.id)
        tokens = self._tokens(payload)
        tokens["user"] = {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role.value,
            "organization_id": str(org.id),
            "is_verified": user.is_verified,
        }
        return tokens

    async def login_user(self, email: str, password: str) -> dict[str, Any]:
        """
        Verify credentials and return JWT token pair.

        Parameters
        ----------
        email : str
            Registered email address.
        password : str
            Plain-text password to verify.

        Returns
        -------
        dict
            ``{"access_token", "refresh_token", "token_type", "user"}``

        Raises
        ------
        AuthError
            If credentials are invalid or account is inactive.
        """
        from app.models.user import User

        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(User).where(User.email == email.lower().strip())
            )
            user: User | None = result.scalar_one_or_none()

        if not user:
            raise AuthError("Invalid email or password")
        if not verify_password(password, user.hashed_password):
            raise AuthError("Invalid email or password")
        if not user.is_active:
            raise AuthError("Account is deactivated. Contact your administrator.", status_code=403)

        logger.info(f"✅ Login successful for {email}")

        payload = self._build_token_payload(user.id, user.email, user.role.value, user.organization_id)
        tokens = self._tokens(payload)
        tokens["user"] = {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role.value,
            "organization_id": str(user.organization_id),
            "is_verified": user.is_verified,
        }
        return tokens

    async def refresh_access_token(self, refresh_token: str) -> dict[str, str]:
        """
        Validate a refresh token and issue a new access token.

        Parameters
        ----------
        refresh_token : str
            Previously issued refresh JWT.

        Returns
        -------
        dict
            ``{"access_token", "token_type"}``

        Raises
        ------
        AuthError
            If the token is invalid, expired, or not a refresh token.
        """
        try:
            payload = decode_token(refresh_token)
        except ValueError as exc:
            raise AuthError(str(exc)) from exc

        if payload.get("type") != "refresh":
            raise AuthError("Not a refresh token")

        # Build new access token with same claims (minus expiry which gets reset)
        new_payload = {k: v for k, v in payload.items() if k not in ("exp", "iat", "type")}
        new_access = create_access_token(new_payload)

        logger.debug(f"♻️  Refreshed access token for user {payload.get('sub')}")
        return {"access_token": new_access, "token_type": "bearer"}

    async def send_otp(self, email: str) -> dict[str, str]:
        """
        Generate a TOTP secret, compute current OTP, store secret in Redis
        with a 5-minute TTL, and return the OTP (in production this would
        be sent via email/SMS — here it's returned for testing).

        Parameters
        ----------
        email : str
            Target user's email address.

        Returns
        -------
        dict
            ``{"message": ..., "otp": ...}``  (otp exposed for dev/mock only)

        Raises
        ------
        AuthError
            If the user is not found.
        """
        from app.models.user import User

        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(User).where(User.email == email.lower().strip())
            )
            user: User | None = result.scalar_one_or_none()

        if not user:
            raise AuthError("User not found", status_code=404)

        secret = generate_otp_secret()
        otp = generate_otp(secret)

        redis = await get_redis()
        redis_key = f"otp:{email.lower().strip()}"
        await redis.setex(redis_key, 300, secret)  # 5-minute TTL

        logger.info(f"📧 OTP sent to {email} (mock — OTP: {otp})")

        return {
            "message": "OTP sent successfully",
            "otp": otp,  # Remove this in production!
            "expires_in_seconds": 300,
        }

    async def verify_user_otp(self, email: str, otp: str) -> dict[str, Any]:
        """
        Retrieve the stored OTP secret from Redis, verify the provided OTP,
        and mark the user as verified in the database.

        Parameters
        ----------
        email : str
            User's email address.
        otp : str
            6-digit OTP supplied by the user.

        Returns
        -------
        dict
            ``{"message": ..., "is_verified": True}``

        Raises
        ------
        AuthError
            If OTP is missing, expired, or incorrect.
        """
        from app.models.user import User

        redis = await get_redis()
        redis_key = f"otp:{email.lower().strip()}"
        secret: str | None = await redis.get(redis_key)

        if not secret:
            raise AuthError("OTP expired or not found. Please request a new one.")

        if not verify_otp(secret, otp):
            raise AuthError("Invalid OTP")

        # Mark user verified
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(User).where(User.email == email.lower().strip())
            )
            user: User | None = result.scalar_one_or_none()
            if not user:
                raise AuthError("User not found", status_code=404)

            user.is_verified = True
            await db.commit()

        # Clean up Redis key
        await redis.delete(redis_key)

        logger.info(f"✅ User {email} verified via OTP")
        return {"message": "Email verified successfully", "is_verified": True}

    async def get_current_user(self, token: str) -> dict[str, Any]:
        """
        Decode a Bearer JWT and return the corresponding user record.

        Parameters
        ----------
        token : str
            Raw JWT access token (without "Bearer " prefix).

        Returns
        -------
        dict
            Serialised user record.

        Raises
        ------
        AuthError
            If the token is invalid, expired, or the user no longer exists.
        """
        from app.models.user import User

        try:
            payload = decode_token(token)
        except ValueError as exc:
            raise AuthError(str(exc)) from exc

        if payload.get("type") != "access":
            raise AuthError("Not an access token")

        user_id_str: str | None = payload.get("sub")
        if not user_id_str:
            raise AuthError("Token missing subject claim")

        try:
            user_id = uuid.UUID(user_id_str)
        except ValueError:
            raise AuthError("Malformed user ID in token")

        async with AsyncSessionLocal() as db:
            result = await db.execute(select(User).where(User.id == user_id))
            user: User | None = result.scalar_one_or_none()

        if not user:
            raise AuthError("User not found", status_code=404)
        if not user.is_active:
            raise AuthError("Account is deactivated", status_code=403)

        return {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role.value,
            "organization_id": str(user.organization_id),
            "is_verified": user.is_verified,
            "is_active": user.is_active,
        }


# ─── Module-level singleton ───────────────────────────────────────────────────
auth_service = AuthService()
