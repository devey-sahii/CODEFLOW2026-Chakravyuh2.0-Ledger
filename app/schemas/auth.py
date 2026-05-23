"""
Authentication & user Pydantic v2 schemas for SMART EXPENSE AUDITOR.

Covers registration, login, token exchange, OTP verification,
password reset, and public user representation.
"""

from __future__ import annotations

import uuid
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.user import Role


# ── Registration ─────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    """Payload for new user self-registration."""

    email: EmailStr = Field(..., description="User's email address (must be unique)")
    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="Plain-text password — hashed before storage",
    )
    full_name: str = Field(..., min_length=2, max_length=255, description="Display name")
    organization_name: str = Field(
        ...,
        min_length=2,
        max_length=255,
        description="Name of the organization to create or join",
    )
    role: Role = Field(
        default=Role.EMPLOYEE,
        description="Requested role — subject to admin approval",
    )

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        """Ensure password contains at least one digit and one special character."""
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit.")
        if not any(c in "!@#$%^&*()_+-=[]{}|;':\",./<>?" for c in v):
            raise ValueError("Password must contain at least one special character.")
        return v

    model_config = {
        "json_schema_extra": {
            "example": {
                "email": "priya.sharma@techcorp.in",
                "password": "Secure@123",
                "full_name": "Priya Sharma",
                "organization_name": "TechCorp India Pvt Ltd",
                "role": "EMPLOYEE",
            }
        }
    }


# ── Login ─────────────────────────────────────────────────────────────────────

class UserLogin(BaseModel):
    """Credentials for email + password authentication."""

    email: EmailStr = Field(..., description="Registered email address")
    password: str = Field(..., description="Plain-text password")

    model_config = {
        "json_schema_extra": {
            "example": {
                "email": "priya.sharma@techcorp.in",
                "password": "Secure@123",
            }
        }
    }


# ── Public User Representation ────────────────────────────────────────────────

class UserPublic(BaseModel):
    """Safe, serializable representation of a user (no sensitive fields)."""

    id: uuid.UUID
    email: EmailStr
    full_name: str
    role: Role
    is_active: bool
    is_verified: bool
    organization_id: Optional[uuid.UUID] = None
    avatar_url: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None

    model_config = {"from_attributes": True}


# ── Token Exchange ────────────────────────────────────────────────────────────

class TokenResponse(BaseModel):
    """JWT access + refresh token pair returned after successful authentication."""

    access_token: str = Field(..., description="Short-lived JWT access token (15 min)")
    refresh_token: str = Field(..., description="Long-lived refresh token (7 days)")
    token_type: str = Field(default="bearer")
    user: UserPublic = Field(..., description="Authenticated user's public profile")

    model_config = {
        "json_schema_extra": {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "user": {
                    "id": "550e8400-e29b-41d4-a716-446655440000",
                    "email": "priya.sharma@techcorp.in",
                    "full_name": "Priya Sharma",
                    "role": "EMPLOYEE",
                    "is_active": True,
                    "is_verified": True,
                    "organization_id": "660e8400-e29b-41d4-a716-446655440000",
                },
            }
        }
    }


class RefreshToken(BaseModel):
    """Payload for rotating a refresh token."""

    refresh_token: str = Field(..., description="Valid refresh token to exchange")


# ── OTP / 2FA ─────────────────────────────────────────────────────────────────

class OTPVerify(BaseModel):
    """OTP submission for email verification or 2FA challenge."""

    email: EmailStr = Field(..., description="Email address associated with the OTP")
    otp: str = Field(
        ...,
        min_length=6,
        max_length=8,
        pattern=r"^\d+$",
        description="Numeric OTP code",
    )

    model_config = {
        "json_schema_extra": {
            "example": {"email": "priya.sharma@techcorp.in", "otp": "482910"}
        }
    }


# ── Password Reset Flow ───────────────────────────────────────────────────────

class ForgotPassword(BaseModel):
    """Initiates the password reset flow by sending an email link."""

    email: EmailStr = Field(
        ..., description="Email associated with the account to reset"
    )

    model_config = {
        "json_schema_extra": {
            "example": {"email": "priya.sharma@techcorp.in"}
        }
    }


class ResetPassword(BaseModel):
    """Completes the password reset using the emailed token."""

    token: str = Field(..., description="Password reset token from the email link")
    new_password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="New plain-text password — will be hashed before storage",
    )

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit.")
        if not any(c in "!@#$%^&*()_+-=[]{}|;':\",./<>?" for c in v):
            raise ValueError("Password must contain at least one special character.")
        return v

    model_config = {
        "json_schema_extra": {
            "example": {
                "token": "abc123resettoken",
                "new_password": "NewSecure@456",
            }
        }
    }


# ── Generic Response ──────────────────────────────────────────────────────────

class MessageResponse(BaseModel):
    """Generic success/info response wrapper."""

    message: str
    success: bool = True
