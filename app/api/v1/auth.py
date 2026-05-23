"""
Authentication & profile router for SMART EXPENSE AUDITOR.

Endpoints
─────────
POST   /api/v1/auth/register        Register a new user and organisation
POST   /api/v1/auth/login           Exchange credentials for tokens
POST   /api/v1/auth/refresh         Rotate access token using refresh token
POST   /api/v1/auth/send-otp        Send OTP to user e-mail
POST   /api/v1/auth/verify-otp      Verify OTP code
POST   /api/v1/auth/forgot-password Send password-reset link
GET    /api/v1/auth/me              Return current user profile
PATCH  /api/v1/auth/me              Update current user profile
POST   /api/v1/auth/logout          Blacklist current token in Redis
"""

from __future__ import annotations

import logging
import random
import string
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_user, get_pagination
from app.core.database import get_db, get_redis
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from app.models.audit_log import AuditLog
from app.models.organization import Organization
from app.models.user import Role, User

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication"])

# ─────────────────────────────────────────────────────────────────────────────
# Pydantic schemas (inline – production would import from app/schemas)
# ─────────────────────────────────────────────────────────────────────────────


class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(..., min_length=8)
    organization_name: str = Field(..., min_length=2, max_length=200)
    gstin: Optional[str] = Field(None, pattern=r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$")
    phone: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class OTPRequest(BaseModel):
    email: EmailStr


class OTPVerifyRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=120)
    phone: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    avatar_url: Optional[str] = None


# ─────────────────────────────────────────────────────────────────────────────
# Helper
# ─────────────────────────────────────────────────────────────────────────────


def _ok(data: Any = None, message: str = "Success") -> Dict:
    return {"success": True, "data": data, "message": message}


def _generate_otp(length: int = 6) -> str:
    return "".join(random.choices(string.digits, k=length))


async def _log_action(
    db: AsyncSession,
    user_id: Optional[str],
    action: str,
    resource: str,
    details: Optional[Dict] = None,
) -> None:
    """Persist an audit log entry (fire-and-forget style)."""
    try:
        entry = AuditLog(
            id=str(uuid.uuid4()),
            user_id=user_id,
            action=action,
            resource=resource,
            details=details or {},
            created_at=datetime.now(timezone.utc),
        )
        db.add(entry)
        await db.commit()
    except Exception as exc:
        logger.warning("Audit log write failed: %s", exc)


# ─────────────────────────────────────────────────────────────────────────────
# POST /register
# ─────────────────────────────────────────────────────────────────────────────


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(
    payload: RegisterRequest,
    db: AsyncSession = Depends(get_db),
) -> Dict:
    """
    Register a brand-new user and create their organisation.

    Returns access + refresh tokens so the user is immediately logged in.
    """
    # 1. Duplicate email check
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this e-mail already exists.",
        )

    # 2. Create organization
    org = Organization(
        id=str(uuid.uuid4()),
        name=payload.organization_name,
        gstin=payload.gstin,
        created_at=datetime.now(timezone.utc),
    )
    db.add(org)

    # 3. Create admin user
    user = User(
        id=str(uuid.uuid4()),
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        phone=payload.phone,
        role=Role.ADMIN,
        organization_id=org.id,
        is_active=True,
        created_at=datetime.now(timezone.utc),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # 4. Issue tokens
    access_token = create_access_token({"sub": user.id, "role": user.role.value})
    refresh_token = create_refresh_token({"sub": user.id})

    await _log_action(db, user.id, "REGISTER", "user", {"email": user.email})

    return _ok(
        data={
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "role": user.role.value,
                "organization_id": org.id,
                "organization_name": org.name,
            },
        },
        message="Registration successful. Welcome to LEDGER!",
    )


# ─────────────────────────────────────────────────────────────────────────────
# POST /login
# ─────────────────────────────────────────────────────────────────────────────


@router.post("/login")
async def login(
    payload: LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> Dict:
    """Authenticate with email + password and receive JWT tokens."""
    result = await db.execute(select(User).where(User.email == payload.email))
    user: User | None = result.scalar_one_or_none()

    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account suspended. Contact your administrator.",
        )

    access_token = create_access_token({"sub": user.id, "role": user.role.value})
    refresh_token = create_refresh_token({"sub": user.id})

    # Update last login
    await db.execute(
        update(User).where(User.id == user.id).values(last_login=datetime.now(timezone.utc))
    )
    await db.commit()

    await _log_action(db, user.id, "LOGIN", "session", {"email": user.email})

    return _ok(
        data={
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "role": user.role.value,
                "organization_id": user.organization_id,
            },
        },
        message="Login successful.",
    )


# ─────────────────────────────────────────────────────────────────────────────
# POST /refresh
# ─────────────────────────────────────────────────────────────────────────────


@router.post("/refresh")
async def refresh_token(
    payload: RefreshRequest,
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis),
) -> Dict:
    """Rotate the access token using a valid refresh token."""
    token_payload = decode_token(payload.refresh_token)
    if token_payload is None or token_payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token.",
        )

    # Check blacklist
    blacklisted = await redis.get(f"blacklist:{payload.refresh_token}")
    if blacklisted:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has been revoked.",
        )

    user_id = token_payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id))
    user: User | None = result.scalar_one_or_none()

    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive.")

    new_access = create_access_token({"sub": user.id, "role": user.role.value})

    return _ok(
        data={"access_token": new_access, "token_type": "bearer"},
        message="Access token refreshed.",
    )


# ─────────────────────────────────────────────────────────────────────────────
# POST /send-otp
# ─────────────────────────────────────────────────────────────────────────────


@router.post("/send-otp")
async def send_otp(
    payload: OTPRequest,
    redis=Depends(get_redis),
) -> Dict:
    """
    Generate and store a 6-digit OTP in Redis (TTL 10 min).
    In production this triggers an e-mail via SES / SendGrid.
    """
    otp = _generate_otp()
    key = f"otp:{payload.email}"

    await redis.set(key, otp, ex=600)  # 10 minutes TTL

    # TODO: integrate e-mail service
    logger.info("OTP for %s: %s (mock – not sent via email)", payload.email, otp)

    return _ok(
        data={"email": payload.email, "expires_in_seconds": 600},
        message="OTP sent to your e-mail address.",
    )


# ─────────────────────────────────────────────────────────────────────────────
# POST /verify-otp
# ─────────────────────────────────────────────────────────────────────────────


@router.post("/verify-otp")
async def verify_otp(
    payload: OTPVerifyRequest,
    redis=Depends(get_redis),
) -> Dict:
    """Verify the OTP stored in Redis against what the user submitted."""
    key = f"otp:{payload.email}"
    stored_otp: bytes | None = await redis.get(key)

    if stored_otp is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP expired or not found. Please request a new one.",
        )

    if stored_otp.decode() != payload.otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP.",
        )

    await redis.delete(key)

    return _ok(data={"verified": True}, message="OTP verified successfully.")


# ─────────────────────────────────────────────────────────────────────────────
# POST /forgot-password
# ─────────────────────────────────────────────────────────────────────────────


@router.post("/forgot-password")
async def forgot_password(
    payload: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis),
) -> Dict:
    """
    Generate a password-reset token, store it in Redis, and (mock) send an e-mail.
    Always returns 200 to prevent e-mail enumeration.
    """
    result = await db.execute(select(User).where(User.email == payload.email))
    user: User | None = result.scalar_one_or_none()

    if user:
        reset_token = str(uuid.uuid4())
        key = f"pwd_reset:{reset_token}"
        await redis.set(key, user.id, ex=3600)  # 1-hour TTL

        reset_link = f"https://ledger.app/reset-password?token={reset_token}"
        logger.info("Password reset link for %s: %s (mock)", payload.email, reset_link)
        # TODO: send email

    return _ok(
        data={"email": payload.email},
        message="If that e-mail exists in our system, a reset link has been sent.",
    )


# ─────────────────────────────────────────────────────────────────────────────
# GET /me
# ─────────────────────────────────────────────────────────────────────────────


@router.get("/me")
async def get_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict:
    """Return the full profile of the currently authenticated user."""
    # Load organization eagerly for the response
    org_result = await db.execute(
        select(Organization).where(Organization.id == current_user.organization_id)
    )
    org: Organization | None = org_result.scalar_one_or_none()

    return _ok(
        data={
            "id": current_user.id,
            "full_name": current_user.full_name,
            "email": current_user.email,
            "phone": current_user.phone,
            "role": current_user.role.value,
            "department": current_user.department,
            "designation": current_user.designation,
            "avatar_url": current_user.avatar_url,
            "is_active": current_user.is_active,
            "last_login": current_user.last_login.isoformat() if current_user.last_login else None,
            "created_at": current_user.created_at.isoformat(),
            "organization": {
                "id": org.id if org else None,
                "name": org.name if org else None,
                "gstin": org.gstin if org else None,
            },
        },
        message="Profile retrieved.",
    )


# ─────────────────────────────────────────────────────────────────────────────
# PATCH /me
# ─────────────────────────────────────────────────────────────────────────────


@router.patch("/me")
async def update_me(
    payload: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict:
    """Update editable fields on the current user's profile."""
    updates: Dict[str, Any] = {
        k: v for k, v in payload.model_dump(exclude_none=True).items()
    }
    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields provided for update.",
        )

    await db.execute(
        update(User).where(User.id == current_user.id).values(**updates, updated_at=datetime.now(timezone.utc))
    )
    await db.commit()

    await _log_action(db, current_user.id, "UPDATE_PROFILE", "user", {"fields": list(updates.keys())})

    return _ok(data={"updated_fields": list(updates.keys())}, message="Profile updated successfully.")


# ─────────────────────────────────────────────────────────────────────────────
# POST /logout
# ─────────────────────────────────────────────────────────────────────────────


@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis),
    credentials=Depends(__import__("fastapi.security", fromlist=["HTTPBearer"]).HTTPBearer(auto_error=False)),
) -> Dict:
    """
    Blacklist the current access token in Redis until its natural expiry.
    The client should discard both access and refresh tokens.
    """
    token: str | None = credentials.credentials if credentials else None

    if token:
        # Decode to find remaining TTL, default 3600s
        payload = decode_token(token)
        if payload:
            exp = payload.get("exp", 0)
            now_ts = int(datetime.now(timezone.utc).timestamp())
            ttl = max(exp - now_ts, 1)
            await redis.set(f"blacklist:{token}", "1", ex=ttl)

    await _log_action(db, current_user.id, "LOGOUT", "session", {})

    return _ok(data=None, message="Logged out successfully.")
