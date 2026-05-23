"""
Organization SQLAlchemy model for SMART EXPENSE AUDITOR.

Represents a tenant/company in the multi-tenant system.
"""

from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, Integer, String, func, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class SubscriptionPlan(str, enum.Enum):
    """Available subscription tiers for organizations."""

    STARTER = "STARTER"
    PROFESSIONAL = "PROFESSIONAL"
    ENTERPRISE = "ENTERPRISE"


class Organization(Base):
    """
    Represents a company/organization that uses the platform.

    This is the top-level tenant entity. All users, expenses, vendors,
    and audit logs are scoped to an organization.
    """

    __tablename__ = "organizations"

    # ── Primary Key ──────────────────────────────────────────────────────────
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
        index=True,
    )

    # ── Core Fields ──────────────────────────────────────────────────────────
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    domain: Mapped[str | None] = mapped_column(
        String(255), nullable=True, unique=True, index=True
    )
    gstin: Mapped[str | None] = mapped_column(
        String(15), nullable=True, unique=True, index=True,
        comment="GST Identification Number (India)"
    )
    logo_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)

    # ── Subscription ─────────────────────────────────────────────────────────
    subscription_plan: Mapped[SubscriptionPlan] = mapped_column(
        Enum(SubscriptionPlan, name="subscriptionplan"),
        nullable=False,
        default=SubscriptionPlan.STARTER,
        server_default=SubscriptionPlan.STARTER.value,
    )
    max_employees: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=50,
        server_default=text("50"),
        comment="Maximum employees allowed under the subscription",
    )

    # ── Status ───────────────────────────────────────────────────────────────
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default=text("true"),
    )

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
    users: Mapped[list["User"]] = relationship(  # noqa: F821
        "User", back_populates="organization", lazy="select"
    )
    expense_claims: Mapped[list["ExpenseClaim"]] = relationship(  # noqa: F821
        "ExpenseClaim", back_populates="organization", lazy="select"
    )
    vendors: Mapped[list["Vendor"]] = relationship(  # noqa: F821
        "Vendor", back_populates="organization", lazy="select"
    )
    audit_logs: Mapped[list["AuditLog"]] = relationship(  # noqa: F821
        "AuditLog", back_populates="organization", lazy="select"
    )
    fraud_reports: Mapped[list["FraudReport"]] = relationship(  # noqa: F821
        "FraudReport", back_populates="organization", lazy="select"
    )
    gst_validations: Mapped[list["GSTValidation"]] = relationship(  # noqa: F821
        "GSTValidation", back_populates="organization", lazy="select"
    )

    def __repr__(self) -> str:
        return f"<Organization id={self.id!r} name={self.name!r} plan={self.subscription_plan.value!r}>"
