"""
User SQLAlchemy model for SMART EXPENSE AUDITOR.

Handles authentication, RBAC roles, OTP secrets, and org membership.
"""

from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Index, String, func, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Role(str, enum.Enum):
    """User roles that control access within the platform."""

    EMPLOYEE = "EMPLOYEE"
    FINANCE_MANAGER = "FINANCE_MANAGER"
    AUDITOR = "AUDITOR"
    ADMIN = "ADMIN"


class User(Base):
    """
    Platform user with role-based access control.

    A user always belongs to exactly one organization. Roles determine
    which API endpoints and data the user can access:
      - EMPLOYEE: submit and track own expense claims
      - FINANCE_MANAGER: approve/reject expenses for the org
      - AUDITOR: read-only access to all expenses + fraud reports
      - ADMIN: full org management
    """

    __tablename__ = "users"
    __table_args__ = (
        Index("ix_users_role", "role"),
    )

    # ── Primary Key ──────────────────────────────────────────────────────────
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )

    # ── Identity ─────────────────────────────────────────────────────────────
    email: Mapped[str] = mapped_column(
        String(320),
        nullable=False,
        unique=True,
        index=True,
        comment="RFC 5321 max email length",
    )
    hashed_password: Mapped[str] = mapped_column(
        String(1024), nullable=False, comment="bcrypt hash"
    )
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)

    # ── Role ─────────────────────────────────────────────────────────────────
    role: Mapped[Role] = mapped_column(
        Enum(Role, name="userrole"),
        nullable=False,
        default=Role.EMPLOYEE,
        server_default=Role.EMPLOYEE.value,
    )

    # ── Status & Verification ─────────────────────────────────────────────────
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default=text("true"),
    )
    is_verified: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default=text("false"),
        comment="Email / OTP verification status",
    )

    # ── OTP / 2FA ────────────────────────────────────────────────────────────
    otp_secret: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
        comment="TOTP base32 secret for 2FA",
    )

    # ── Organization FK ──────────────────────────────────────────────────────
    organization_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # ── Profile ──────────────────────────────────────────────────────────────
    avatar_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    department: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # ── Timestamps ───────────────────────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    # ── Relationships ─────────────────────────────────────────────────────────
    organization: Mapped["Organization"] = relationship(  # noqa: F821
        "Organization", back_populates="users", lazy="select"
    )
    expense_claims: Mapped[list["ExpenseClaim"]] = relationship(  # noqa: F821
        "ExpenseClaim",
        foreign_keys="ExpenseClaim.employee_id",
        back_populates="employee",
        lazy="select",
    )
    reviewed_claims: Mapped[list["ExpenseClaim"]] = relationship(  # noqa: F821
        "ExpenseClaim",
        foreign_keys="ExpenseClaim.reviewed_by",
        back_populates="reviewer",
        lazy="select",
    )
    audit_logs: Mapped[list["AuditLog"]] = relationship(  # noqa: F821
        "AuditLog", back_populates="user", lazy="select"
    )

    def __repr__(self) -> str:
        return f"<User id={self.id!r} email={self.email!r} role={self.role.value!r}>"
