"""
Vendors router for SMART EXPENSE AUDITOR.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select, and_, or_, func, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_user, get_pagination, require_role
from app.core.database import get_db
from app.models.vendor import Vendor
from app.models.expense import ExpenseClaim, RiskLevel
from app.models.user import Role, User

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/vendors", tags=["Vendors"])


class VendorCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=512)
    gstin: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class VendorUpdateRequest(BaseModel):
    name: Optional[str] = None
    gstin: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class BlacklistRequest(BaseModel):
    reason: str


class RiskScoreRequest(BaseModel):
    gstin: str


def _ok(data: Any = None, message: str = "Success") -> Dict:
    return {"success": True, "data": data, "message": message}


@router.get("/")
async def list_vendors(
    search: Optional[str] = Query(None),
    is_blacklisted: Optional[bool] = Query(None),
    risk_level: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    pagination = Depends(get_pagination),
) -> Dict:
    """List vendors for the current organization with filters."""
    skip, limit = pagination
    org_id = current_user.organization_id

    filters = [Vendor.organization_id == org_id]

    if search:
        pattern = f"%{search}%"
        filters.append(
            or_(
                Vendor.name.ilike(pattern),
                Vendor.gstin.ilike(pattern)
            )
        )

    if is_blacklisted is not None:
        filters.append(Vendor.is_blacklisted == is_blacklisted)

    if risk_level:
        try:
            filters.append(Vendor.risk_level == RiskLevel(risk_level.upper()))
        except ValueError:
            pass

    stmt_count = select(func.count(Vendor.id)).where(and_(*filters))
    count_res = await db.execute(stmt_count)
    total = count_res.scalar() or 0

    stmt = select(Vendor).where(and_(*filters)).order_by(Vendor.name.asc()).offset(skip).limit(limit)
    res = await db.execute(stmt)
    vendors = res.scalars().all()

    items = [
        {
            "id": str(v.id),
            "name": v.name,
            "gstin": v.gstin,
            "email": v.email,
            "phone": v.phone,
            "address": v.address,
            "fraud_score": v.fraud_score,
            "compliance_score": v.compliance_score,
            "risk_level": v.risk_level.value,
            "transaction_count": v.transaction_count,
            "total_amount": v.total_amount,
            "is_verified": v.is_verified,
            "is_blacklisted": v.is_blacklisted,
            "blacklist_reason": getattr(v, "blacklist_reason", None),
            "created_at": v.created_at.isoformat(),
            "updated_at": v.updated_at.isoformat()
        }
        for v in vendors
    ]

    return _ok(
        data={
            "items": items,
            "total": total,
            "page": skip // limit + 1,
            "limit": limit,
            "total_pages": (total + limit - 1) // limit if limit else 1
        },
        message=f"{total} vendor(s) found."
    )


@router.get("/{vendor_id}")
async def get_vendor(
    vendor_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict:
    """Get single vendor details."""
    stmt = select(Vendor).where(
        and_(Vendor.id == uuid.UUID(vendor_id), Vendor.organization_id == current_user.organization_id)
    )
    res = await db.execute(stmt)
    v = res.scalar_one_or_none()

    if not v:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vendor not found.")

    return _ok(
        data={
            "id": str(v.id),
            "name": v.name,
            "gstin": v.gstin,
            "email": v.email,
            "phone": v.phone,
            "address": v.address,
            "fraud_score": v.fraud_score,
            "compliance_score": v.compliance_score,
            "risk_level": v.risk_level.value,
            "transaction_count": v.transaction_count,
            "total_amount": v.total_amount,
            "is_verified": v.is_verified,
            "is_blacklisted": v.is_blacklisted,
            "blacklist_reason": getattr(v, "blacklist_reason", None),
            "created_at": v.created_at.isoformat(),
            "updated_at": v.updated_at.isoformat()
        },
        message="Vendor details retrieved."
    )


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_vendor(
    payload: VendorCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict:
    """Create a new vendor for the organization."""
    org_id = current_user.organization_id

    # Check for duplicate GSTIN in the same org
    if payload.gstin:
        dup = await db.execute(
            select(Vendor).where(
                and_(Vendor.gstin == payload.gstin.upper(), Vendor.organization_id == org_id)
            )
        )
        if dup.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A vendor with this GSTIN already exists."
            )

    vendor = Vendor(
        id=uuid.uuid4(),
        organization_id=org_id,
        name=payload.name,
        gstin=payload.gstin.upper() if payload.gstin else None,
        email=payload.email,
        phone=payload.phone,
        address=payload.address,
        fraud_score=0.0,
        compliance_score=100.0,
        risk_level=RiskLevel.LOW,
        transaction_count=0,
        total_amount=0.0,
        is_verified=True,
        is_blacklisted=False,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )

    db.add(vendor)
    await db.commit()
    await db.refresh(vendor)

    return _ok(
        data={"id": str(vendor.id), "name": vendor.name},
        message="Vendor created successfully."
    )


@router.put("/{vendor_id}")
async def update_vendor(
    vendor_id: str,
    payload: VendorUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict:
    """Update vendor details."""
    stmt = select(Vendor).where(
        and_(Vendor.id == uuid.UUID(vendor_id), Vendor.organization_id == current_user.organization_id)
    )
    res = await db.execute(stmt)
    v = res.scalar_one_or_none()

    if not v:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vendor not found.")

    updates = {k: val for k, val in payload.model_dump(exclude_none=True).items()}
    if "gstin" in updates and updates["gstin"]:
        updates["gstin"] = updates["gstin"].upper()

    if updates:
        await db.execute(
            update(Vendor).where(Vendor.id == v.id).values(**updates, updated_at=datetime.now(timezone.utc))
        )
        await db.commit()

    return _ok(message="Vendor updated successfully.")


@router.post("/{vendor_id}/blacklist")
async def blacklist_vendor(
    vendor_id: str,
    payload: BlacklistRequest,
    current_user: User = Depends(require_role(Role.ADMIN, Role.FINANCE_MANAGER)),
    db: AsyncSession = Depends(get_db),
) -> Dict:
    """Blacklist a vendor."""
    stmt = select(Vendor).where(
        and_(Vendor.id == uuid.UUID(vendor_id), Vendor.organization_id == current_user.organization_id)
    )
    res = await db.execute(stmt)
    v = res.scalar_one_or_none()

    if not v:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vendor not found.")

    v.is_blacklisted = True
    v.risk_level = RiskLevel.CRITICAL
    if hasattr(v, "blacklist_reason"):
        v.blacklist_reason = payload.reason
    await db.commit()

    return _ok(message="Vendor blacklisted successfully.")


@router.post("/{vendor_id}/unblacklist")
async def unblacklist_vendor(
    vendor_id: str,
    current_user: User = Depends(require_role(Role.ADMIN, Role.FINANCE_MANAGER)),
    db: AsyncSession = Depends(get_db),
) -> Dict:
    """Unblacklist a vendor."""
    stmt = select(Vendor).where(
        and_(Vendor.id == uuid.UUID(vendor_id), Vendor.organization_id == current_user.organization_id)
    )
    res = await db.execute(stmt)
    v = res.scalar_one_or_none()

    if not v:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vendor not found.")

    v.is_blacklisted = False
    v.risk_level = RiskLevel.LOW
    if hasattr(v, "blacklist_reason"):
        v.blacklist_reason = None
    await db.commit()

    return _ok(message="Vendor unblacklisted successfully.")


@router.post("/{vendor_id}/verify")
async def verify_vendor(
    vendor_id: str,
    current_user: User = Depends(require_role(Role.ADMIN, Role.FINANCE_MANAGER)),
    db: AsyncSession = Depends(get_db),
) -> Dict:
    """Manually verify a vendor."""
    stmt = select(Vendor).where(
        and_(Vendor.id == uuid.UUID(vendor_id), Vendor.organization_id == current_user.organization_id)
    )
    res = await db.execute(stmt)
    v = res.scalar_one_or_none()

    if not v:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vendor not found.")

    v.is_verified = True
    await db.commit()

    return _ok(message="Vendor verified successfully.")


@router.get("/{vendor_id}/transactions")
async def get_vendor_transactions(
    vendor_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    pagination = Depends(get_pagination),
) -> Dict:
    """Get all expense transactions for a specific vendor."""
    skip, limit = pagination
    org_id = current_user.organization_id

    # Find the vendor legal name or GSTIN
    v_stmt = select(Vendor).where(
        and_(Vendor.id == uuid.UUID(vendor_id), Vendor.organization_id == org_id)
    )
    v_res = await db.execute(v_stmt)
    v = v_res.scalar_one_or_none()

    if not v:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vendor not found.")

    # Match expenses by vendor name or gstin
    stmt = select(ExpenseClaim).where(
        and_(
            ExpenseClaim.organization_id == org_id,
            or_(
                ExpenseClaim.vendor_name.ilike(f"%{v.name}%"),
                and_(ExpenseClaim.vendor_gstin == v.gstin, v.gstin != None)
            )
        )
    ).order_by(ExpenseClaim.submitted_at.desc())

    # Count
    count_res = await db.execute(select(func.count()).select_from(stmt.subquery()))
    total = count_res.scalar() or 0

    # Query items
    res = await db.execute(stmt.offset(skip).limit(limit))
    claims = res.scalars().all()

    items = [
        {
            "id": str(c.id),
            "title": c.title,
            "amount": c.amount,
            "currency": c.currency,
            "category": c.category.value,
            "status": c.status.value,
            "submitted_at": c.submitted_at.isoformat(),
            "fraud_score": c.fraud_score,
            "risk_level": c.risk_level.value
        }
        for c in claims
    ]

    return _ok(
        data={
            "items": items,
            "total": total,
            "page": skip // limit + 1,
            "limit": limit,
            "total_pages": (total + limit - 1) // limit if limit else 1
        },
        message="Transactions retrieved."
    )


@router.post("/risk-score")
async def get_vendor_risk_score(
    payload: RiskScoreRequest,
    current_user: User = Depends(get_current_user),
) -> Dict:
    """Return mock risk analysis score for a GSTIN."""
    import random
    score = round(random.uniform(10.0, 85.0), 1)
    level = "LOW" if score < 30 else "MEDIUM" if score < 60 else "HIGH"
    return _ok(
        data={
            "risk_score": score,
            "risk_level": level,
            "reasons": ["New vendor GSTIN registration", "Recent filing lag of 15 days"] if level != "LOW" else []
        },
        message="Vendor risk score calculated."
    )
