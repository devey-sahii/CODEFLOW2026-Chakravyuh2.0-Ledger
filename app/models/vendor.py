"""
Vendor SQLAlchemy model for SMART EXPENSE AUDITOR.

Vendors are third-party entities that employees claim expenses against.
Fraud scores and compliance metrics are updated by the AI pipeline.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.expense import RiskLevel


class Vendor(Base):
    """
    Tracks vendors / merchants associated with expense receipts.

    Fraud scores and compliance scores are continuously updated by the
    AI fraud-detection service whenever a new receipt referencing this
    vendor is processed.
    """

    __tablename__ = "vendors"
    __table_args__ = (
        Index("ix_vendors_is_blacklisted", "is_blacklisted"),
    )

    # ── Primary Key ──────────────────────────────────────────────────────────
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )

    # ── Organization FK ──────────────────────────────────────────────────────
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ── Vendor Identity ──────────────────────────────────────────────────────
    name: Mapped[str] = mapped_column(String(512), nullable=False, index=True)
    gstin: Mapped[str | None] = mapped_column(
        String(15),
        nullable=True,
        index=True,
        comment="GST Identification Number — used for GST compliance validation",
    )
    email: Mapped[str | None] = mapped_column(String(320), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    address: Mapped[str | None] = mapped_column(String(1024), nullable=True)

    # ── Risk / Fraud Scores ───────────────────────────────────────────────────
    fraud_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0.0,
        server_default=text("0.0"),
        comment="AI-derived fraud risk score [0.0, 1.0]",
    )
    compliance_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=100.0,
        server_default=text("100.0"),
        comment="GST/regulatory compliance score [0.0, 100.0]",
    )
    risk_level: Mapped[RiskLevel] = mapped_column(
        Enum(RiskLevel, name="risklevel", create_constraint=False),
        nullable=False,
        default=RiskLevel.LOW,
        server_default=RiskLevel.LOW.value,
    )

    # ── Transaction Aggregates ────────────────────────────────────────────────
    transaction_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default=text("0"),
        comment="Total receipts processed for this vendor",
    )
    total_amount: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0.0,
        server_default=text("0.0"),
        comment="Cumulative transaction value (INR)",
    )

    # ── Flags ─────────────────────────────────────────────────────────────────
    is_verified: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default=text("false"),
        comment="Manually verified by finance team",
    )
    is_blacklisted: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default=text("false"),
        comment="Blacklisted vendors trigger auto-flagging of expenses",
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
    organization: Mapped["Organization"] = relationship(  # noqa: F821
        "Organization", back_populates="vendors", lazy="select"
    )

    def __repr__(self) -> str:
        return (
            f"<Vendor id={self.id!r} name={self.name!r} "
            f"fraud_score={self.fraud_score!r} blacklisted={self.is_blacklisted!r}>"
        )
