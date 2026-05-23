"""
Expense & Receipt Pydantic v2 schemas for SMART EXPENSE AUDITOR.

Covers claim creation/update, full public representations, paginated
list responses, and summary statistics.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field, model_validator

from app.models.expense import ExpenseCategory, ExpenseStatus, ReceiptProcessingStatus, RiskLevel


# ── Receipt Schemas ───────────────────────────────────────────────────────────

class ReceiptPublic(BaseModel):
    """Full public representation of an uploaded receipt with OCR data."""

    id: uuid.UUID
    expense_claim_id: uuid.UUID

    # File metadata
    file_url: str
    file_name: str
    file_type: str

    # OCR extracted fields
    ocr_extracted_data: Optional[dict[str, Any]] = None
    vendor_name: Optional[str] = None
    gstin: Optional[str] = None
    invoice_number: Optional[str] = None
    invoice_date: Optional[datetime] = None
    tax_amount: Optional[float] = None
    total_amount: Optional[float] = None

    # Pipeline state
    processing_status: ReceiptProcessingStatus

    # AI output
    ai_analysis: Optional[dict[str, Any]] = None

    created_at: datetime

    model_config = {"from_attributes": True}


# ── Expense Claim Schemas ─────────────────────────────────────────────────────

class ExpenseCreate(BaseModel):
    """Payload for submitting a new expense claim."""

    title: str = Field(
        ..., min_length=3, max_length=512, description="Short descriptive title"
    )
    description: Optional[str] = Field(
        None, max_length=4096, description="Detailed description of the expense"
    )
    amount: float = Field(
        ..., gt=0, description="Total claimed amount in the specified currency"
    )
    currency: str = Field(
        default="INR",
        min_length=3,
        max_length=3,
        description="ISO 4217 currency code",
        pattern=r"^[A-Z]{3}$",
    )
    category: ExpenseCategory = Field(
        default=ExpenseCategory.OTHER, description="Business expense category"
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "title": "Flight to Bengaluru — Q2 Sales Review",
                "description": "Return flight for client meeting on 2026-05-25",
                "amount": 8500.00,
                "currency": "INR",
                "category": "TRAVEL",
            }
        }
    }


class ExpenseUpdate(BaseModel):
    """Partial update payload for an expense claim (all fields optional)."""

    title: Optional[str] = Field(None, min_length=3, max_length=512)
    description: Optional[str] = Field(None, max_length=4096)
    amount: Optional[float] = Field(None, gt=0)
    currency: Optional[str] = Field(None, min_length=3, max_length=3, pattern=r"^[A-Z]{3}$")
    category: Optional[ExpenseCategory] = None
    notes: Optional[str] = Field(
        None, max_length=2048, description="Reviewer notes (finance manager / auditor)"
    )

    @model_validator(mode="after")
    def at_least_one_field(self) -> "ExpenseUpdate":
        if all(
            v is None
            for v in [
                self.title,
                self.description,
                self.amount,
                self.currency,
                self.category,
                self.notes,
            ]
        ):
            raise ValueError("At least one field must be provided for update.")
        return self


class ExpenseReview(BaseModel):
    """Payload for a finance manager approving or rejecting a claim."""

    status: ExpenseStatus = Field(
        ..., description="New status — must be APPROVED or REJECTED"
    )
    notes: Optional[str] = Field(None, max_length=2048, description="Review notes")

    @model_validator(mode="after")
    def status_must_be_reviewable(self) -> "ExpenseReview":
        if self.status not in (ExpenseStatus.APPROVED, ExpenseStatus.REJECTED):
            raise ValueError("Review status must be APPROVED or REJECTED.")
        return self


class ExpensePublic(BaseModel):
    """Full public representation of an expense claim with receipts."""

    id: uuid.UUID
    title: str
    description: Optional[str] = None
    amount: float
    currency: str
    category: ExpenseCategory
    status: ExpenseStatus

    employee_id: uuid.UUID
    organization_id: uuid.UUID
    reviewed_by: Optional[uuid.UUID] = None

    fraud_score: Optional[float] = None
    risk_level: RiskLevel
    notes: Optional[str] = None

    submitted_at: datetime
    reviewed_at: Optional[datetime] = None

    # Nested receipts (populated on detail endpoints)
    receipts: list[ReceiptPublic] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class ExpenseListItem(BaseModel):
    """Lightweight representation used in paginated list responses."""

    id: uuid.UUID
    title: str
    amount: float
    currency: str
    category: ExpenseCategory
    status: ExpenseStatus
    risk_level: RiskLevel
    fraud_score: Optional[float] = None
    submitted_at: datetime
    employee_id: uuid.UUID
    receipt_count: int = Field(default=0, description="Number of attached receipts")

    model_config = {"from_attributes": True}


class ExpenseListResponse(BaseModel):
    """Paginated list of expense claims."""

    items: list[ExpenseListItem]
    total: int = Field(..., description="Total matching records (unpaginated)")
    page: int = Field(..., ge=1)
    page_size: int = Field(..., ge=1, le=100)
    total_pages: int

    @model_validator(mode="after")
    def compute_total_pages(self) -> "ExpenseListResponse":
        if self.page_size > 0:
            import math
            object.__setattr__(
                self, "total_pages", math.ceil(self.total / self.page_size)
            )
        return self

    model_config = {"from_attributes": True}


# ── Expense Statistics ────────────────────────────────────────────────────────

class ExpenseStats(BaseModel):
    """Aggregate statistics for a set of expense claims (scoped by org / date range)."""

    total_amount: float = Field(..., description="Sum of all claimed amounts (INR)")
    total_count: int = Field(..., description="Total number of expense claims")
    pending_count: int
    approved_count: int
    rejected_count: int
    flagged_count: int
    average_amount: float = Field(
        ..., description="Average claim amount across all statuses"
    )
    fraud_score_avg: Optional[float] = Field(
        None, description="Mean AI fraud score across claims that have been assessed"
    )
    high_risk_count: int = Field(
        default=0, description="Claims with risk_level HIGH or CRITICAL"
    )

    model_config = {"from_attributes": True}
