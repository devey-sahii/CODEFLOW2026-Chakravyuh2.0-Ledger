"""
Expense SQLAlchemy models for SMART EXPENSE AUDITOR.

Contains ExpenseClaim (the parent claim record) and Receipt (file +
OCR/AI extraction results). Enums are exported so other modules can
import them without circular dependencies.
"""

from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import (
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

class ExpenseCategory(str, enum.Enum):
    """Business categories for expense classification."""

    TRAVEL = "TRAVEL"
    ACCOMMODATION = "ACCOMMODATION"
    MEALS = "MEALS"
    OFFICE_SUPPLIES = "OFFICE_SUPPLIES"
    SOFTWARE = "SOFTWARE"
    HARDWARE = "HARDWARE"
    MARKETING = "MARKETING"
    TRAINING = "TRAINING"
    MEDICAL = "MEDICAL"
    UTILITIES = "UTILITIES"
    OTHER = "OTHER"


class ExpenseStatus(str, enum.Enum):
    """Lifecycle states of an expense claim."""

    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    FLAGGED = "FLAGGED"


class RiskLevel(str, enum.Enum):
    """Risk classification used by the AI fraud engine."""

    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class ReceiptProcessingStatus(str, enum.Enum):
    """Processing state of a receipt through the OCR / AI pipeline."""

    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


# ── Models ───────────────────────────────────────────────────────────────────

class ExpenseClaim(Base):
    """
    A single expense claim submitted by an employee.

    An expense claim aggregates one or more receipts. The AI pipeline
    evaluates all receipts, assigns a fraud score and risk level, and
    may auto-flag the claim before it reaches a finance manager.
    """

    __tablename__ = "expense_claims"
    __table_args__ = (
        Index("ix_expense_claims_submitted_at", "submitted_at"),
        Index("ix_expense_claims_category", "category"),
    )

    # ── Primary Key ──────────────────────────────────────────────────────────
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )

    # ── Core Fields ──────────────────────────────────────────────────────────
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    amount: Mapped[float] = mapped_column(
        Float, nullable=False, comment="Total claimed amount"
    )
    currency: Mapped[str] = mapped_column(
        String(3),
        nullable=False,
        default="INR",
        server_default="INR",
        comment="ISO 4217 currency code",
    )

    # ── Classification ───────────────────────────────────────────────────────
    category: Mapped[ExpenseCategory] = mapped_column(
        Enum(ExpenseCategory, name="expensecategory"),
        nullable=False,
        default=ExpenseCategory.OTHER,
        server_default=ExpenseCategory.OTHER.value,
    )
    status: Mapped[ExpenseStatus] = mapped_column(
        Enum(ExpenseStatus, name="expensestatus"),
        nullable=False,
        default=ExpenseStatus.PENDING,
        server_default=ExpenseStatus.PENDING.value,
        index=True,
    )

    # ── Foreign Keys ─────────────────────────────────────────────────────────
    employee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    # ── AI Risk Assessment ────────────────────────────────────────────────────
    fraud_score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
        comment="Aggregate AI fraud score across all receipts [0.0, 1.0]",
    )
    risk_level: Mapped[RiskLevel] = mapped_column(
        Enum(RiskLevel, name="risklevel"),
        nullable=False,
        default=RiskLevel.LOW,
        server_default=RiskLevel.LOW.value,
    )

    # ── Notes / Audit Trail ───────────────────────────────────────────────────
    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="Finance manager or auditor review notes",
    )

    # ── Timestamps ───────────────────────────────────────────────────────────
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # ── Relationships ─────────────────────────────────────────────────────────
    employee: Mapped["User"] = relationship(  # noqa: F821
        "User",
        foreign_keys=[employee_id],
        back_populates="expense_claims",
        lazy="select",
    )
    reviewer: Mapped["User | None"] = relationship(  # noqa: F821
        "User",
        foreign_keys=[reviewed_by],
        back_populates="reviewed_claims",
        lazy="select",
    )
    organization: Mapped["Organization"] = relationship(  # noqa: F821
        "Organization", back_populates="expense_claims", lazy="select"
    )
    receipts: Mapped[list["Receipt"]] = relationship(
        "Receipt",
        back_populates="expense_claim",
        cascade="all, delete-orphan",
        lazy="select",
    )
    fraud_reports: Mapped[list["FraudReport"]] = relationship(  # noqa: F821
        "FraudReport",
        back_populates="expense_claim",
        cascade="all, delete-orphan",
        lazy="select",
    )

    def __repr__(self) -> str:
        return (
            f"<ExpenseClaim id={self.id!r} title={self.title!r} "
            f"amount={self.amount!r} status={self.status.value!r}>"
        )


class Receipt(Base):
    """
    An uploaded receipt file attached to an expense claim.

    After upload, the file is processed through an OCR pipeline that
    extracts vendor name, GSTIN, invoice number, amounts, and dates.
    Results are stored in `ocr_extracted_data` (raw) and individual
    typed columns for easy querying. The `ai_analysis` JSON holds the
    full fraud-detection result from the AI service.
    """

    __tablename__ = "receipts"


    # ── Primary Key ──────────────────────────────────────────────────────────
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )

    # ── Parent FK ────────────────────────────────────────────────────────────
    expense_claim_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("expense_claims.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ── File Metadata ─────────────────────────────────────────────────────────
    file_url: Mapped[str] = mapped_column(String(2048), nullable=False)
    file_name: Mapped[str] = mapped_column(String(512), nullable=False)
    file_type: Mapped[str] = mapped_column(
        String(64), nullable=False, comment="MIME type e.g. image/jpeg, application/pdf"
    )

    # ── OCR Raw Output ────────────────────────────────────────────────────────
    ocr_extracted_data: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
        comment="Raw JSON payload returned by the OCR service",
    )

    # ── Extracted Structured Fields ───────────────────────────────────────────
    vendor_name: Mapped[str | None] = mapped_column(
        String(512), nullable=True, index=True
    )
    gstin: Mapped[str | None] = mapped_column(
        String(15), nullable=True, comment="GSTIN extracted from receipt"
    )
    invoice_number: Mapped[str | None] = mapped_column(String(128), nullable=True)
    invoice_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    tax_amount: Mapped[float | None] = mapped_column(Float, nullable=True)
    total_amount: Mapped[float | None] = mapped_column(
        Float, nullable=True, comment="Total amount as printed on the receipt"
    )

    # ── Processing State ──────────────────────────────────────────────────────
    processing_status: Mapped[ReceiptProcessingStatus] = mapped_column(
        Enum(ReceiptProcessingStatus, name="receiptprocessingstatus"),
        nullable=False,
        default=ReceiptProcessingStatus.PROCESSING,
        server_default=ReceiptProcessingStatus.PROCESSING.value,
        index=True,
    )

    # ── AI Analysis ───────────────────────────────────────────────────────────
    ai_analysis: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
        comment="Full fraud-detection / risk-assessment output from AI service",
    )

    # ── Timestamps ───────────────────────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    # ── Relationships ─────────────────────────────────────────────────────────
    expense_claim: Mapped["ExpenseClaim"] = relationship(
        "ExpenseClaim", back_populates="receipts", lazy="select"
    )
    fraud_reports: Mapped[list["FraudReport"]] = relationship(  # noqa: F821
        "FraudReport",
        back_populates="receipt",
        cascade="all, delete-orphan",
        lazy="select",
    )

    def __repr__(self) -> str:
        return (
            f"<Receipt id={self.id!r} file_name={self.file_name!r} "
            f"status={self.processing_status.value!r}>"
        )


Expense = ExpenseClaim

