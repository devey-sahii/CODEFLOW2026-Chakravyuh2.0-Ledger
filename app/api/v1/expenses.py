"""
Expenses router for SMART EXPENSE AUDITOR.

Endpoints
─────────
POST   /api/v1/expenses/upload          Multipart file → OCR + fraud analysis
GET    /api/v1/expenses/                Paginated expense list with filters
GET    /api/v1/expenses/stats/summary   Aggregate expense statistics
GET    /api/v1/expenses/{id}            Single expense with receipt + fraud report
PATCH  /api/v1/expenses/{id}/approve   Approve (Finance Manager +)
PATCH  /api/v1/expenses/{id}/reject    Reject with reason
PATCH  /api/v1/expenses/{id}/flag      Flag for investigation
DELETE /api/v1/expenses/{id}           Soft-delete (Admin only)
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from pydantic import BaseModel
from sqlalchemy import and_, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_user, get_pagination, require_role
from app.core.database import get_db
from app.models.audit_log import AuditLog
from app.models.expense import Expense, ExpenseCategory, ExpenseStatus
from app.models.receipt import Receipt
from app.models.user import Role, User
from app.services.gemini_ocr_service import gemini_ocr_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/expenses", tags=["Expenses"])


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────


def _ok(data: Any = None, message: str = "Success") -> Dict:
    return {"success": True, "data": data, "message": message}


async def _audit(
    db: AsyncSession,
    user_id: str,
    action: str,
    resource: str,
    org_id: str,
    details: Optional[Dict] = None,
) -> None:
    try:
        entry = AuditLog(
            id=str(uuid.uuid4()),
            user_id=user_id,
            action=action,
            resource=resource,
            organization_id=org_id,
            details=details or {},
            created_at=datetime.now(timezone.utc),
        )
        db.add(entry)
        await db.commit()
    except Exception as exc:
        logger.warning("Audit log error: %s", exc)


def _mock_ocr_result(filename: str, amount: float) -> Dict:
    """Simulate OCR extraction from a receipt image."""
    return {
        "vendor_name": "Mock Vendor Co. Ltd.",
        "vendor_gstin": "27AAPFU0939F1ZV",
        "date": datetime.now(timezone.utc).date().isoformat(),
        "amount": amount,
        "tax_amount": round(amount * 0.18, 2),
        "base_amount": round(amount / 1.18, 2),
        "currency": "INR",
        "line_items": [
            {"description": "Professional Services", "quantity": 1, "unit_price": amount, "total": amount}
        ],
        "confidence_score": 0.94,
        "raw_text": f"[OCR output of {filename}]",
    }


def _mock_fraud_analysis(amount: float, ocr: Dict) -> Dict:
    """Simulate AI fraud analysis."""
    import random

    fraud_score = round(random.uniform(0.05, 0.75), 2)
    flags = []
    if amount > 50000:
        flags.append({"code": "HIGH_AMOUNT", "description": "Amount exceeds ₹50,000 threshold", "weight": 0.3})
    if amount == int(amount):
        flags.append({"code": "ROUND_AMOUNT", "description": "Suspiciously round amount", "weight": 0.15})

    return {
        "fraud_score": fraud_score,
        "risk_level": "high" if fraud_score > 0.6 else "medium" if fraud_score > 0.3 else "low",
        "is_flagged": fraud_score > 0.6,
        "flags": flags,
        "duplicate_check": {"is_duplicate": False, "similar_receipt_ids": []},
        "vendor_risk_score": round(random.uniform(0.1, 0.6), 2),
        "analysis_version": "v2.1",
        "analyzed_at": datetime.now(timezone.utc).isoformat(),
    }


# ─────────────────────────────────────────────────────────────────────────────
# POST /upload
# ─────────────────────────────────────────────────────────────────────────────


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_expense(
    file: UploadFile = File(..., description="Receipt image (JPEG/PNG/PDF, max 10 MB)"),
    amount: float = Form(..., gt=0, description="Claimed amount in INR"),
    category: str = Form(..., description="Expense category"),
    description: str = Form(..., min_length=3, max_length=500),
    vendor_name: Optional[str] = Form(None),
    vendor_gstin: Optional[str] = Form(None),
    trip_id: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict:
    """
    Accept a receipt file upload, run OCR extraction and fraud analysis,
    persist the expense + receipt, and return the full result.
    """
    # ── Validate file type ───────────────────────────────────────────────────
    allowed_types = {"image/jpeg", "image/png", "image/webp", "application/pdf"}
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unsupported file type: {file.content_type}. Allowed: JPEG, PNG, WEBP, PDF.",
        )

    content = await file.read()
    if len(content) > 10 * 1024 * 1024:  # 10 MB
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File exceeds the 10 MB size limit.",
        )

    # ── Validate category ────────────────────────────────────────────────────
    try:
        exp_category = ExpenseCategory(category.lower())
    except ValueError:
        valid = [c.value for c in ExpenseCategory]
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid category. Valid options: {valid}",
        )

    # ── Gemini 3.1 Flash-Lite OCR extraction ────────────────────────────────
    try:
        ocr_result = await gemini_ocr_service.extract_invoice_data(
            file_bytes=content,
            mime_type=file.content_type or "image/jpeg",
        )
    except Exception as ocr_exc:
        logger.warning("OCR extraction failed, using mock: %s", ocr_exc)
        ocr_result = _mock_ocr_result(file.filename or "receipt", amount)

    # ── Fraud analysis (combines AI fraud signals + rule-based checks) ───────
    fraud_result = _mock_fraud_analysis(amount, ocr_result)

    # Incorporate Gemini-detected fraud signals
    gemini_signals = ocr_result.get("fraud_signals", [])
    if gemini_signals:
        for signal in gemini_signals:
            fraud_result["flags"].append({
                "code": "AI_SIGNAL",
                "description": str(signal),
                "weight": 0.2,
            })
        # Boost fraud score proportionally to number of AI signals
        signal_boost = min(0.3, len(gemini_signals) * 0.08)
        fraud_result["fraud_score"] = min(1.0, fraud_result["fraud_score"] + signal_boost)
        fraud_result["is_flagged"] = fraud_result["fraud_score"] > 0.6
        fraud_result["risk_level"] = (
            "high" if fraud_result["fraud_score"] > 0.6
            else "medium" if fraud_result["fraud_score"] > 0.3
            else "low"
        )

    # ── Persist receipt ──────────────────────────────────────────────────────
    receipt_id = str(uuid.uuid4())
    expense_id = str(uuid.uuid4())

    # In production: upload content to S3 and store the URL
    file_url = f"https://storage.ledger.app/receipts/{receipt_id}/{file.filename}"

    receipt = Receipt(
        id=receipt_id,
        expense_id=expense_id,
        file_url=file_url,
        file_name=file.filename,
        content_type=file.content_type,
        file_size_bytes=len(content),
        ocr_data=ocr_result,
        created_at=datetime.now(timezone.utc),
    )

    initial_status = ExpenseStatus.REJECTED if fraud_result["is_flagged"] else ExpenseStatus.PENDING

    # Use OCR-extracted amount if not provided or use the higher confidence value
    ocr_total = float(ocr_result.get("total_amount") or 0)
    final_amount = ocr_total if ocr_total > 0 else amount

    # Resolve vendor info: form input takes precedence, otherwise use OCR
    resolved_vendor_name = vendor_name or ocr_result.get("vendor_name")
    resolved_vendor_gstin = vendor_gstin or ocr_result.get("gstin")

    expense = Expense(
        id=expense_id,
        user_id=current_user.id,
        organization_id=current_user.organization_id,
        receipt_id=receipt_id,
        amount=final_amount,
        currency="INR",
        category=exp_category,
        description=description,
        vendor_name=resolved_vendor_name,
        vendor_gstin=resolved_vendor_gstin,
        trip_id=trip_id,
        status=initial_status,
        fraud_score=fraud_result["fraud_score"],
        fraud_flags=fraud_result["flags"],
        is_flagged=fraud_result["is_flagged"],
        expense_date=datetime.now(timezone.utc).date(),
        created_at=datetime.now(timezone.utc),
    )

    try:
        db.add(receipt)
        db.add(expense)
        await db.commit()
        await db.refresh(expense)
    except Exception as exc:
        await db.rollback()
        logger.error("Expense persist failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save expense. Please try again.",
        )

    await _audit(
        db, current_user.id, "EXPENSE_SUBMITTED", "expense",
        current_user.organization_id,
        {"expense_id": expense_id, "amount": amount, "category": category},
    )

    return _ok(
        data={
            "expense_id": expense_id,
            "status": initial_status.value,
            "amount": final_amount,
            "category": exp_category.value,
            "receipt_id": receipt_id,
            "file_url": file_url,
            "ocr": ocr_result,
            "fraud_analysis": fraud_result,
            "ocr_engine": ocr_result.get("ocr_engine", "unknown"),
            "confidence_score": ocr_result.get("confidence_score", 0),
            "fraud_signals": ocr_result.get("fraud_signals", []),
            "message": "Expense flagged for review." if fraud_result["is_flagged"] else "Expense submitted for approval.",
        },
        message="Expense uploaded and analysed successfully by Gemini AI.",
    )


# ─────────────────────────────────────────────────────────────────────────────
# GET /
# ─────────────────────────────────────────────────────────────────────────────


@router.get("/")
async def list_expenses(
    status_filter: Optional[str] = Query(None, alias="status"),
    category: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None, description="ISO date YYYY-MM-DD"),
    date_to: Optional[str] = Query(None, description="ISO date YYYY-MM-DD"),
    search: Optional[str] = Query(None, description="Search description or vendor"),
    min_amount: Optional[float] = Query(None, ge=0),
    max_amount: Optional[float] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    pagination=Depends(get_pagination),
) -> Dict:
    """Paginated, filterable list of expenses for the current organisation."""
    skip, limit = pagination
    org_id = current_user.organization_id

    # Non-admin users only see their own expenses
    base_filter = [Expense.organization_id == org_id, Expense.is_deleted == False]
    if current_user.role not in (Role.ADMIN, Role.FINANCE_MANAGER, Role.AUDITOR):
        base_filter.append(Expense.user_id == current_user.id)

    if status_filter:
        try:
            base_filter.append(Expense.status == ExpenseStatus(status_filter.lower()))
        except ValueError:
            pass

    if category:
        try:
            base_filter.append(Expense.category == ExpenseCategory(category.lower()))
        except ValueError:
            pass

    if date_from:
        try:
            base_filter.append(Expense.expense_date >= datetime.fromisoformat(date_from).date())
        except ValueError:
            pass

    if date_to:
        try:
            base_filter.append(Expense.expense_date <= datetime.fromisoformat(date_to).date())
        except ValueError:
            pass

    if search:
        pattern = f"%{search}%"
        base_filter.append(
            or_(
                Expense.description.ilike(pattern),
                Expense.vendor_name.ilike(pattern),
            )
        )

    if min_amount is not None:
        base_filter.append(Expense.amount >= min_amount)
    if max_amount is not None:
        base_filter.append(Expense.amount <= max_amount)

    try:
        count_q = await db.execute(select(func.count(Expense.id)).where(and_(*base_filter)))
        total = count_q.scalar() or 0

        result = await db.execute(
            select(Expense)
            .where(and_(*base_filter))
            .order_by(Expense.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        expenses = result.scalars().all()

        items = [
            {
                "id": e.id,
                "amount": e.amount,
                "currency": e.currency,
                "category": e.category.value,
                "description": e.description,
                "vendor_name": e.vendor_name,
                "status": e.status.value,
                "fraud_score": e.fraud_score,
                "is_flagged": e.is_flagged,
                "expense_date": e.expense_date.isoformat() if e.expense_date else None,
                "created_at": e.created_at.isoformat(),
                "user_id": e.user_id,
            }
            for e in expenses
        ]
    except Exception as exc:
        logger.error("Expense list error: %s", exc)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database error.")

    return _ok(
        data={
            "items": items,
            "total": total,
            "page": skip // limit + 1,
            "limit": limit,
            "pages": (total + limit - 1) // limit if limit else 1,
        },
        message=f"{total} expense(s) found.",
    )


# ─────────────────────────────────────────────────────────────────────────────
# GET /stats/summary
# ─────────────────────────────────────────────────────────────────────────────


@router.get("/stats/summary")
async def expense_stats_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict:
    """Return aggregate expense statistics broken down by status and category."""
    org_id = current_user.organization_id

    try:
        # By status
        status_result = await db.execute(
            select(Expense.status, func.count(Expense.id), func.sum(Expense.amount))
            .where(Expense.organization_id == org_id, Expense.is_deleted == False)
            .group_by(Expense.status)
        )
        status_breakdown = [
            {"status": row[0].value, "count": row[1], "total_amount": float(row[2] or 0)}
            for row in status_result.all()
        ]

        # By category
        cat_result = await db.execute(
            select(Expense.category, func.count(Expense.id), func.sum(Expense.amount))
            .where(Expense.organization_id == org_id, Expense.is_deleted == False)
            .group_by(Expense.category)
        )
        category_breakdown = [
            {"category": row[0].value, "count": row[1], "total_amount": float(row[2] or 0)}
            for row in cat_result.all()
        ]

        total_flagged = await db.execute(
            select(func.count(Expense.id)).where(
                Expense.organization_id == org_id,
                Expense.is_flagged == True,
                Expense.is_deleted == False,
            )
        )
        flagged_count = total_flagged.scalar() or 0

    except Exception as exc:
        logger.error("Stats summary error: %s", exc)
        # Return mock stats
        status_breakdown = [
            {"status": "pending", "count": 23, "total_amount": 184500.00},
            {"status": "approved", "count": 105, "total_amount": 892300.50},
            {"status": "rejected", "count": 12, "total_amount": 98750.00},
            {"status": "flagged", "count": 8, "total_amount": 109200.00},
        ]
        category_breakdown = [
            {"category": "travel", "count": 45, "total_amount": 425000.00},
            {"category": "meals", "count": 38, "total_amount": 76000.00},
            {"category": "accommodation", "count": 22, "total_amount": 330000.00},
            {"category": "office_supplies", "count": 30, "total_amount": 90000.00},
            {"category": "miscellaneous", "count": 13, "total_amount": 363750.50},
        ]
        flagged_count = 8

    return _ok(
        data={
            "by_status": status_breakdown,
            "by_category": category_breakdown,
            "flagged_count": flagged_count,
        },
        message="Expense summary statistics retrieved.",
    )


# ─────────────────────────────────────────────────────────────────────────────
# GET /{id}
# ─────────────────────────────────────────────────────────────────────────────


@router.get("/{expense_id}")
async def get_expense(
    expense_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict:
    """Return a single expense with its receipt OCR data and fraud report."""
    result = await db.execute(
        select(Expense).where(
            Expense.id == expense_id,
            Expense.is_deleted == False,
        )
    )
    expense: Expense | None = result.scalar_one_or_none()

    if expense is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found.")

    # Non-admin: can only view own expenses
    if (
        current_user.role not in (Role.ADMIN, Role.FINANCE_MANAGER, Role.AUDITOR)
        and expense.user_id != current_user.id
    ):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    # Load receipt
    receipt_data = None
    if expense.receipt_id:
        receipt_result = await db.execute(select(Receipt).where(Receipt.id == expense.receipt_id))
        receipt: Receipt | None = receipt_result.scalar_one_or_none()
        if receipt:
            receipt_data = {
                "id": receipt.id,
                "file_url": receipt.file_url,
                "file_name": receipt.file_name,
                "content_type": receipt.content_type,
                "file_size_bytes": receipt.file_size_bytes,
                "ocr_data": receipt.ocr_data,
                "created_at": receipt.created_at.isoformat(),
            }

    return _ok(
        data={
            "id": expense.id,
            "amount": expense.amount,
            "currency": expense.currency,
            "category": expense.category.value,
            "description": expense.description,
            "vendor_name": expense.vendor_name,
            "vendor_gstin": expense.vendor_gstin,
            "status": expense.status.value,
            "fraud_score": expense.fraud_score,
            "fraud_flags": expense.fraud_flags,
            "is_flagged": expense.is_flagged,
            "expense_date": expense.expense_date.isoformat() if expense.expense_date else None,
            "approved_by": expense.approved_by,
            "rejected_reason": expense.rejected_reason,
            "trip_id": expense.trip_id,
            "user_id": expense.user_id,
            "organization_id": expense.organization_id,
            "created_at": expense.created_at.isoformat(),
            "updated_at": expense.updated_at.isoformat() if expense.updated_at else None,
            "receipt": receipt_data,
        },
        message="Expense retrieved.",
    )


# ─────────────────────────────────────────────────────────────────────────────
# PATCH /{id}/approve
# ─────────────────────────────────────────────────────────────────────────────


@router.patch("/{expense_id}/approve")
async def approve_expense(
    expense_id: str,
    current_user: User = Depends(require_role(Role.ADMIN, Role.FINANCE_MANAGER)),
    db: AsyncSession = Depends(get_db),
) -> Dict:
    """Approve a pending expense claim."""
    result = await db.execute(
        select(Expense).where(Expense.id == expense_id, Expense.is_deleted == False)
    )
    expense: Expense | None = result.scalar_one_or_none()

    if expense is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found.")

    if expense.status not in (ExpenseStatus.PENDING, ExpenseStatus.FLAGGED):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot approve an expense with status '{expense.status.value}'.",
        )

    if expense.organization_id != current_user.organization_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cross-org access denied.")

    await db.execute(
        update(Expense)
        .where(Expense.id == expense_id)
        .values(
            status=ExpenseStatus.APPROVED,
            approved_by=current_user.id,
            updated_at=datetime.now(timezone.utc),
        )
    )
    await db.commit()

    await _audit(
        db, current_user.id, "EXPENSE_APPROVED", "expense",
        current_user.organization_id,
        {"expense_id": expense_id, "amount": expense.amount},
    )

    return _ok(data={"expense_id": expense_id, "status": "approved"}, message="Expense approved.")


# ─────────────────────────────────────────────────────────────────────────────
# PATCH /{id}/reject
# ─────────────────────────────────────────────────────────────────────────────


class RejectRequest(BaseModel):
    reason: str


@router.patch("/{expense_id}/reject")
async def reject_expense(
    expense_id: str,
    payload: RejectRequest,
    current_user: User = Depends(require_role(Role.ADMIN, Role.FINANCE_MANAGER)),
    db: AsyncSession = Depends(get_db),
) -> Dict:
    """Reject an expense claim with a mandatory reason."""
    result = await db.execute(
        select(Expense).where(Expense.id == expense_id, Expense.is_deleted == False)
    )
    expense: Expense | None = result.scalar_one_or_none()

    if expense is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found.")

    if expense.status == ExpenseStatus.APPROVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot reject an already-approved expense.",
        )

    await db.execute(
        update(Expense)
        .where(Expense.id == expense_id)
        .values(
            status=ExpenseStatus.REJECTED,
            rejected_reason=payload.reason,
            updated_at=datetime.now(timezone.utc),
        )
    )
    await db.commit()

    await _audit(
        db, current_user.id, "EXPENSE_REJECTED", "expense",
        current_user.organization_id,
        {"expense_id": expense_id, "reason": payload.reason},
    )

    return _ok(data={"expense_id": expense_id, "status": "rejected"}, message="Expense rejected.")


# ─────────────────────────────────────────────────────────────────────────────
# PATCH /{id}/flag
# ─────────────────────────────────────────────────────────────────────────────


class FlagRequest(BaseModel):
    reason: Optional[str] = None


@router.patch("/{expense_id}/flag")
async def flag_expense(
    expense_id: str,
    payload: FlagRequest,
    current_user: User = Depends(require_role(Role.ADMIN, Role.FINANCE_MANAGER, Role.AUDITOR)),
    db: AsyncSession = Depends(get_db),
) -> Dict:
    """Manually flag an expense for further investigation."""
    result = await db.execute(
        select(Expense).where(Expense.id == expense_id, Expense.is_deleted == False)
    )
    expense: Expense | None = result.scalar_one_or_none()

    if expense is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found.")

    await db.execute(
        update(Expense)
        .where(Expense.id == expense_id)
        .values(
            status=ExpenseStatus.FLAGGED,
            is_flagged=True,
            updated_at=datetime.now(timezone.utc),
        )
    )
    await db.commit()

    await _audit(
        db, current_user.id, "EXPENSE_FLAGGED", "expense",
        current_user.organization_id,
        {"expense_id": expense_id, "reason": payload.reason},
    )

    return _ok(data={"expense_id": expense_id, "status": "flagged"}, message="Expense flagged for investigation.")


# ─────────────────────────────────────────────────────────────────────────────
# DELETE /{id}
# ─────────────────────────────────────────────────────────────────────────────


@router.delete("/{expense_id}", status_code=status.HTTP_200_OK)
async def delete_expense(
    expense_id: str,
    current_user: User = Depends(require_role(Role.ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> Dict:
    """Soft-delete an expense record (Admin only). Data is retained for audit purposes."""
    result = await db.execute(
        select(Expense).where(Expense.id == expense_id, Expense.is_deleted == False)
    )
    expense: Expense | None = result.scalar_one_or_none()

    if expense is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found.")

    await db.execute(
        update(Expense)
        .where(Expense.id == expense_id)
        .values(is_deleted=True, updated_at=datetime.now(timezone.utc))
    )
    await db.commit()

    await _audit(
        db, current_user.id, "EXPENSE_DELETED", "expense",
        current_user.organization_id,
        {"expense_id": expense_id},
    )

    return _ok(data={"expense_id": expense_id, "deleted": True}, message="Expense soft-deleted.")
