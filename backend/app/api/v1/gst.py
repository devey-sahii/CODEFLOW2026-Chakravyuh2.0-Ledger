"""
GST Compliance router for SMART EXPENSE AUDITOR.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_user, get_pagination
from app.core.database import get_db
from app.models.audit_log import AuditLog, GSTValidation
from app.models.expense import ExpenseClaim, ExpenseStatus, ExpenseCategory
from app.models.user import Role, User

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/gst", tags=["GST Compliance"])


class GSTValidateRequest(BaseModel):
    gstin: str = Field(..., min_length=15, max_length=15, pattern=r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$")


class GenerateReportRequest(BaseModel):
    start_date: str
    end_date: str


def _ok(data: Any = None, message: str = "Success") -> Dict:
    return {"success": True, "data": data, "message": message}


def _mock_compliance_report(org_id: str, start_date: str, end_date: str) -> Dict:
    return {
        "id": str(uuid.uuid4()),
        "organization_id": org_id,
        "period_start": start_date,
        "period_end": end_date,
        "total_transactions": 128,
        "compliant_transactions": 114,
        "non_compliant_transactions": 14,
        "compliance_score": 89.0,
        "gst_claims_eligible": 42,
        "gst_amount_eligible": 154300.50,
        "issues": [
            {
                "expense_id": str(uuid.uuid4()),
                "receipt_id": str(uuid.uuid4()),
                "issue_type": "invalid_gstin",
                "severity": "error",
                "description": "Vendor GSTIN is inactive or invalid.",
                "recommendation": "Request updated GST invoice from vendor."
            },
            {
                "expense_id": str(uuid.uuid4()),
                "receipt_id": str(uuid.uuid4()),
                "issue_type": "mismatch",
                "severity": "warning",
                "description": "Tax amount on receipt does not match calculated GST rate.",
                "recommendation": "Verify manually and adjust tax claim."
            }
        ],
        "generated_at": datetime.now(timezone.utc).isoformat()
    }


@router.post("/validate")
async def validate_gstin(
    payload: GSTValidateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict:
    """Validate GSTIN format and return mock business data."""
    gstin = payload.gstin.upper()
    org_id = current_user.organization_id

    # Check database cache first
    stmt = select(GSTValidation).where(
        and_(GSTValidation.gstin == gstin, GSTValidation.organization_id == org_id)
    )
    result = await db.execute(stmt)
    validation = result.scalar_one_or_none()

    if not validation:
        # Create mock record
        states = {"27": "Maharashtra", "07": "Delhi", "29": "Karnataka", "33": "Tamil Nadu", "09": "Uttar Pradesh"}
        state_code = gstin[:2]
        state = states.get(state_code, "Other State")
        
        validation = GSTValidation(
            id=uuid.uuid4(),
            gstin=gstin,
            organization_id=org_id,
            is_valid=True,
            business_name=f"Mock business name for {gstin}",
            state_code=state_code,
            registration_date=datetime.now(timezone.utc) - timedelta(days=730),
            compliance_score=95.0,
            last_validated=datetime.now(timezone.utc),
            validation_data={"filing_status": "Active", "taxpayer_type": "Regular", "state": state}
        )
        db.add(validation)
        await db.commit()

    return _ok(
        data={
            "gstin": validation.gstin,
            "is_valid": validation.is_valid,
            "business_name": validation.business_name,
            "state": validation.validation_data.get("state") if validation.validation_data else "Maharashtra",
            "registration_type": "Regular",
            "is_active": True,
            "error": None,
            "validated_at": validation.last_validated.isoformat()
        },
        message="GSTIN validated successfully."
    )


@router.get("/compliance-report")
async def get_compliance_report(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
) -> Dict:
    """Get active GST compliance report summary."""
    org_id = current_user.organization_id
    today = datetime.now(timezone.utc).date()
    start = start_date or (today - timedelta(days=30)).isoformat()
    end = end_date or today.isoformat()
    
    report = _mock_compliance_report(str(org_id), start, end)
    return _ok(data=report, message="GST compliance report retrieved.")


@router.get("/compliance-reports")
async def list_compliance_reports(
    current_user: User = Depends(get_current_user),
    pagination = Depends(get_pagination)
) -> Dict:
    """Get a list of generated compliance reports."""
    skip, limit = pagination
    org_id = current_user.organization_id
    
    today = datetime.now(timezone.utc).date()
    items = []
    for i in range(5):
        start = (today - timedelta(days=30 * (i + 1))).isoformat()
        end = (today - timedelta(days=30 * i)).isoformat()
        items.append(_mock_compliance_report(str(org_id), start, end))
        
    return _ok(
        data={
            "items": items,
            "total": len(items),
            "page": skip // limit + 1,
            "limit": limit,
            "total_pages": 1
        },
        message="Compliance reports list retrieved."
    )


@router.post("/compliance-reports/generate")
async def generate_compliance_report(
    payload: GenerateReportRequest,
    current_user: User = Depends(get_current_user),
) -> Dict:
    """Generate a compliance report for a specific period."""
    org_id = current_user.organization_id
    report = _mock_compliance_report(str(org_id), payload.start_date, payload.end_date)
    return _ok(data=report, message="GST compliance report generated successfully.")


@router.get("/eligible-claims")
async def get_eligible_claims(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict:
    """Get claims that are eligible for GST Input Tax Credit (ITC)."""
    org_id = current_user.organization_id
    
    # Query approved expenses with vendor GSTINs
    stmt = select(ExpenseClaim).where(
        and_(
            ExpenseClaim.organization_id == org_id,
            ExpenseClaim.status == ExpenseStatus.APPROVED,
            ExpenseClaim.vendor_gstin != None
        )
    ).order_by(ExpenseClaim.submitted_at.desc())
    
    result = await db.execute(stmt)
    claims = result.scalars().all()
    
    eligible_amount = sum(c.amount * 0.18 for c in claims)  # Mock 18% GST estimate
    
    claims_list = [
        {
            "id": str(c.id),
            "title": c.title,
            "amount": c.amount,
            "currency": c.currency,
            "category": c.category.value,
            "status": c.status.value,
            "employee_id": str(c.employee_id),
            "submitted_at": c.submitted_at.isoformat(),
            "reviewed_at": c.reviewed_at.isoformat() if c.reviewed_at else None,
            "fraud_score": c.fraud_score,
            "risk_level": c.risk_level.value,
        }
        for c in claims
    ]
    
    return _ok(
        data={
            "total_claims": len(claims_list),
            "eligible_amount": eligible_amount,
            "expenses": claims_list
        },
        message="Eligible ITC claims retrieved."
    )
