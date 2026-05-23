"""
Dependency injection helpers for FastAPI routes.

Provides:
- get_current_user  – extracts and validates the Bearer JWT
- require_role      – factory that returns a dependency enforcing one or more roles
- get_pagination    – extracts page / limit query params and converts to skip/limit
"""

from __future__ import annotations

import logging
from typing import Callable, List, Tuple

from fastapi import Depends, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.database import get_db, get_redis
from app.core.security import decode_token
from app.models.user import Role, User
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Security scheme
# ---------------------------------------------------------------------------

_bearer_scheme = HTTPBearer(auto_error=True)


# ---------------------------------------------------------------------------
# Current-user dependency
# ---------------------------------------------------------------------------


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis),
) -> User:
    """
    Validate the Bearer token and return the authenticated User ORM object.

    Raises 401 if:
      - The token is missing / malformed
      - The token has been blacklisted (logout)
      - The user no longer exists in the database

    Raises 403 if:
      - The user account is inactive / suspended
    """
    token: str = credentials.credentials

    # ── 1. Check token blacklist in Redis ───────────────────────────────────
    try:
        blacklisted = await redis.get(f"blacklist:{token}")
        if blacklisted:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has been revoked. Please log in again.",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("Redis blacklist check failed: %s", exc)
        # Non-fatal – continue without blacklist check

    # ── 2. Decode & validate JWT ────────────────────────────────────────────
    payload = decode_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id: str | None = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload is missing subject claim.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # ── 3. Load user from DB ─────────────────────────────────────────────────
    result = await db.execute(select(User).where(User.id == user_id))
    user: User | None = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # ── 4. Check account status ──────────────────────────────────────────────
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive or suspended. Contact your administrator.",
        )

    return user


# ---------------------------------------------------------------------------
# Role-guard dependency factory
# ---------------------------------------------------------------------------


def require_role(*roles: Role) -> Callable:
    """
    Return a FastAPI dependency that raises 403 unless the current user's
    role is in the *roles* list.

    Usage::

        @router.delete("/{id}", dependencies=[Depends(require_role(Role.ADMIN))])
        async def delete_expense(id: str, ...):
            ...
    """

    async def _role_guard(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            allowed = ", ".join(r.value for r in roles)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role(s): {allowed}.",
            )
        return current_user

    return _role_guard


# ---------------------------------------------------------------------------
# Pagination dependency
# ---------------------------------------------------------------------------


def get_pagination(
    page: int = Query(default=1, ge=1, description="Page number (1-indexed)"),
    limit: int = Query(default=20, ge=1, le=100, description="Items per page (max 100)"),
) -> Tuple[int, int]:
    """
    Convert page / limit query parameters into a (skip, limit) tuple
    compatible with SQLAlchemy's `offset()` / `limit()` methods.

    Returns:
        Tuple[int, int]: (skip, limit)
    """
    skip = (page - 1) * limit
    return skip, limit


# ---------------------------------------------------------------------------
# Optional extras – convenient pre-composed guards
# ---------------------------------------------------------------------------

CurrentUser = Depends(get_current_user)

AdminOnly = Depends(require_role(Role.ADMIN))

FinanceOrAbove = Depends(require_role(Role.ADMIN, Role.FINANCE_MANAGER))
