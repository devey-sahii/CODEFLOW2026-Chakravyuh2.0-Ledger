"""
Audit Log, Fraud Report, and GST Validation SQLAlchemy models
for SMART EXPENSE AUDITOR.

These three tables together form the compliance and forensics layer
of the platform.
"""

from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Index,
    String,
    Text,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


# ── Enums ────────────────────────────────────────────────────────────────────

class AuditSeverity(str, enum.Enum):
    """Severity levels for audit log entries."""

    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


class FraudReportStatus(str, enum.Enum):
    """Investigation lifecycle for fraud reports."""

    OPEN = "OPEN"
    INVESTIGATING = "INVESTIGATING"
    CONFIRMED = "CONFIRMED"
    DISMISSED = "DISMISSED"


# ── Models ───────────────────────────────────────────────────────────────────

class AuditLog(Base):
    """
    Immutable audit trail for every significant action on the platform.

    Records who did what, when, on which resource, from which IP.
    Old/new value snapshots enable full before-and-after diffs.
    No rows are ever deleted from this table.
    """

    __tablename__ = "audit_logs"


    # ── Primary Key ──────────────────────────────────────────────────────────
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )

    # ── Scope FK ─────────────────────────────────────────────────────────────
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="Null for system-generated entries",
    )

    # ── Event Details ─────────────────────────────────────────────────────────
    action: Mapped[str] = mapped_column(
        String(128),
        nullable=False,
        index=True,
        comment="e.g. EXPENSE_SUBMITTED, USER_LOGGED_IN, FRAUD_FLAGGED",
    )
    resource_type: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        index=True,
        comment="e.g. ExpenseClaim, Receipt, User",
    )
    resource_id: Mapped[str | None] = mapped_column(
        String(128),
        nullable=True,
        index=True,
        comment="UUID or other identifier of the affected resource",
    )

    # ── Change Snapshot ───────────────────────────────────────────────────────
    old_values: Mapped[dict | None] = mapped_column(
        JSON, nullable=True, comment="State before the action"
    )
    new_values: Mapped[dict | None] = mapped_column(
        JSON, nullable=True, comment="State after the action"
    )

    # ── Request Context ───────────────────────────────────────────────────────
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(512), nullable=True)

    # ── Severity ─────────────────────────────────────────────────────────────
    severity: Mapped[AuditSeverity] = mapped_column(
        Enum(AuditSeverity, name="auditseverity"),
        nullable=False,
        default=AuditSeverity.INFO,
        server_default=AuditSeverity.INFO.value,
        index=True,
    )

    # ── Timestamp ────────────────────────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
    )

    # ── Relationships ─────────────────────────────────────────────────────────
    organization: Mapped["Organization"] = relationship(  # noqa: F821
        "Organization", back_populates="audit_logs", lazy="select"
    )
    user: Mapped["User | None"] = relationship(  # noqa: F821
        "User", back_populates="audit_logs", lazy="select"
    )

    def __repr__(self) -> str:
        return (
            f"<AuditLog id={self.id!r} action={self.action!r} "
            f"severity={self.severity.value!r}>"
        )


class FraudReport(Base):
    """
    AI-generated fraud detection report for a specific receipt / claim.

    Generated automatically by the fraud detection pipeline. Finance
    managers or auditors can confirm, dismiss, or escalate a report.
    """

    __tablename__ = "fraud_reports"
    __table_args__ = (
        Index("ix_fraud_reports_fraud_score", "fraud_score"),
    )

    # ── Primary Key ──────────────────────────────────────────────────────────
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )

    # ── Foreign Keys ─────────────────────────────────────────────────────────
    receipt_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("receipts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    expense_claim_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("expense_claims.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ── AI Scores ────────────────────────────────────────────────────────────
    fraud_score: Mapped[float] = mapped_column(
        Float, nullable=False, comment="AI fraud probability [0.0, 1.0]"
    )
    confidence: Mapped[float] = mapped_column(
        Float, nullable=False, comment="Model confidence in the fraud_score [0.0, 1.0]"
    )

    # ── Fraud Details ─────────────────────────────────────────────────────────
    fraud_types: Mapped[list | None] = mapped_column(
        JSON,
        nullable=True,
        comment="Array of fraud type strings e.g. ['duplicate_receipt', 'inflated_amount']",
    )
    ai_reasoning: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="Natural language explanation from the AI model"
    )

    # ── Review Outcome ────────────────────────────────────────────────────────
    is_confirmed: Mapped[bool | None] = mapped_column(
        Boolean,
        nullable=True,
        comment="Null = pending review; True = confirmed fraud; False = false positive",
    )
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    status: Mapped[FraudReportStatus] = mapped_column(
        Enum(FraudReportStatus, name="fraudreportstatus"),
        nullable=False,
        default=FraudReportStatus.OPEN,
        server_default=FraudReportStatus.OPEN.value,
        index=True,
    )

    # ── Timestamp ────────────────────────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    # ── Relationships ─────────────────────────────────────────────────────────
    receipt: Mapped["Receipt"] = relationship(  # noqa: F821
        "Receipt", back_populates="fraud_reports", lazy="select"
    )
    expense_claim: Mapped["ExpenseClaim"] = relationship(  # noqa: F821
        "ExpenseClaim", back_populates="fraud_reports", lazy="select"
    )
    organization: Mapped["Organization"] = relationship(  # noqa: F821
        "Organization", back_populates="fraud_reports", lazy="select"
    )

    def __repr__(self) -> str:
        return (
            f"<FraudReport id={self.id!r} fraud_score={self.fraud_score!r} "
            f"status={self.status.value!r}>"
        )


class GSTValidation(Base):
    """
    GST Identification Number (GSTIN) validation cache.

    Results are cached per GSTIN per organization to avoid redundant
    government API calls. The `last_validated` timestamp drives cache
    invalidation. `validation_data` holds the raw government API response.
    """

    __tablename__ = "gst_validations"


    # ── Primary Key ──────────────────────────────────────────────────────────
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )

    # ── GSTIN ─────────────────────────────────────────────────────────────────
    gstin: Mapped[str] = mapped_column(
        String(15),
        nullable=False,
        index=True,
        comment="15-character GSTIN as per Indian GST Act",
    )

    # ── Scope ─────────────────────────────────────────────────────────────────
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ── Validation Result ─────────────────────────────────────────────────────
    is_valid: Mapped[bool] = mapped_column(
        Boolean, nullable=False, index=True
    )
    business_name: Mapped[str | None] = mapped_column(String(512), nullable=True)
    state_code: Mapped[str | None] = mapped_column(
        String(2), nullable=True, comment="2-digit GST state code"
    )
    registration_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    compliance_score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
        comment="Derived compliance score based on filing history [0.0, 100.0]",
    )
    last_validated: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        comment="Timestamp of the most recent validation API call",
    )
    validation_data: Mapped[dict | None] = mapped_column(
        JSON, nullable=True, comment="Raw payload from the government GST API"
    )

    # ── Relationships ─────────────────────────────────────────────────────────
    organization: Mapped["Organization"] = relationship(  # noqa: F821
        "Organization", back_populates="gst_validations", lazy="select"
    )

    def __repr__(self) -> str:
        return (
            f"<GSTValidation gstin={self.gstin!r} valid={self.is_valid!r} "
            f"business={self.business_name!r}>"
        )
