"""
Vendor Pydantic v2 schemas for SMART EXPENSE AUDITOR.

Covers vendor registration, detailed public view, and paginated list
responses. Fraud/compliance scores are read-only (managed by AI pipeline).
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.expense import RiskLevel


# ── Create ────────────────────────────────────────────────────────────────────

class VendorCreate(BaseModel):
    """Payload for registering a new vendor within an organization."""

    name: str = Field(..., min_length=2, max_length=512, description="Legal vendor name")
    gstin: Optional[str] = Field(
        None,
        min_length=15,
        max_length=15,
        description="15-character GST Identification Number",
    )
    email: Optional[EmailStr] = Field(None, description="Vendor contact email")
    phone: Optional[str] = Field(
        None,
        max_length=20,
        description="Phone number in E.164 or local format",
    )
    address: Optional[str] = Field(None, max_length=1024, description="Postal address")

    @field_validator("gstin")
    @classmethod
    def gstin_format(cls, v: Optional[str]) -> Optional[str]:
        """Validate basic GSTIN format: 15 alphanumeric characters."""
        if v is not None:
            v = v.upper().strip()
            if len(v) != 15:
                raise ValueError("GSTIN must be exactly 15 characters.")
            # Basic regex: state_code(2d) + PAN(10) + entity_num(1) + Z + check(1)
            import re
            pattern = r"^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}$"
            if not re.match(pattern, v):
                raise ValueError("GSTIN format is invalid.")
        return v

    model_config = {
        "json_schema_extra": {
            "example": {
                "name": "Tata Consultancy Services Ltd",
                "gstin": "27AAACT2727Q1ZW",
                "email": "billing@tcs.com",
                "phone": "+91-22-67789999",
                "address": "TCS House, Raveline Street, Fort, Mumbai 400001",
            }
        }
    }


class VendorUpdate(BaseModel):
    """Partial update for vendor details (all fields optional)."""

    name: Optional[str] = Field(None, min_length=2, max_length=512)
    gstin: Optional[str] = Field(None, min_length=15, max_length=15)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = Field(None, max_length=1024)
    is_blacklisted: Optional[bool] = Field(
        None, description="Manually blacklist/un-blacklist the vendor"
    )
    is_verified: Optional[bool] = Field(
        None, description="Mark vendor as manually verified"
    )


# ── Public Representation ─────────────────────────────────────────────────────

class VendorPublic(BaseModel):
    """Full public representation of a vendor with AI-computed scores."""

    id: uuid.UUID
    organization_id: uuid.UUID

    # Identity
    name: str
    gstin: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

    # AI-managed risk metrics
    fraud_score: float = Field(..., description="AI fraud risk score [0.0, 1.0]")
    compliance_score: float = Field(
        ..., description="GST/regulatory compliance score [0.0, 100.0]"
    )
    risk_level: RiskLevel

    # Transaction aggregates
    transaction_count: int
    total_amount: float

    # Flags
    is_verified: bool
    is_blacklisted: bool

    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class VendorListItem(BaseModel):
    """Lightweight vendor representation for list/table views."""

    id: uuid.UUID
    name: str
    gstin: Optional[str] = None
    fraud_score: float
    compliance_score: float
    risk_level: RiskLevel
    is_verified: bool
    is_blacklisted: bool
    transaction_count: int
    total_amount: float

    model_config = {"from_attributes": True}


class VendorListResponse(BaseModel):
    """Paginated list of vendors."""

    items: list[VendorListItem]
    total: int = Field(..., description="Total matching records (unpaginated)")
    page: int = Field(..., ge=1)
    page_size: int = Field(..., ge=1, le=100)
    total_pages: int

    model_config = {"from_attributes": True}
