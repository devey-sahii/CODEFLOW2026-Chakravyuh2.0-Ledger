"""
Employees router for SMART EXPENSE AUDITOR.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select, and_, or_, func, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_user, get_pagination, require_role
from app.core.database import get_db
from app.models.user import User, Role
from app.models.expense import ExpenseClaim

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/employees", tags=["Employees"])


class InviteRequest(BaseModel):
    email: EmailStr
    role: str
    department: Optional[str] = None


class EmployeeUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None


def _ok(data: Any = None, message: str = "Success") -> Dict:
    return {"success": True, "data": data, "message": message}


@router.get("/")
async def list_employees(
    department: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    pagination = Depends(get_pagination),
) -> Dict:
    """List employees for the current organization with filters."""
    skip, limit = pagination
    org_id = current_user.organization_id

    filters = [User.organization_id == org_id]

    if department:
        filters.append(User.department == department)

    if role:
        try:
            filters.append(User.role == Role(role.upper()))
        except ValueError:
            pass

    if search:
        pattern = f"%{search}%"
        filters.append(
            or_(
                User.full_name.ilike(pattern),
                User.email.ilike(pattern)
            )
        )

    stmt_count = select(func.count(User.id)).where(and_(*filters))
    count_res = await db.execute(stmt_count)
    total = count_res.scalar() or 0

    stmt = select(User).where(and_(*filters)).order_by(User.full_name.asc()).offset(skip).limit(limit)
    res = await db.execute(stmt)
    employees = res.scalars().all()

    items = [
        {
            "id": str(emp.id),
            "email": emp.email,
            "full_name": emp.full_name,
            "role": emp.role.value,
            "organization_id": str(emp.organization_id),
            "avatar_url": emp.avatar_url,
            "department": emp.department,
            "phone": emp.phone,
            "is_active": emp.is_active,
            "is_verified": emp.is_verified,
            "created_at": emp.created_at.isoformat()
        }
        for emp in employees
    ]

    return _ok(
        data={
            "items": items,
            "total": total,
            "page": skip // limit + 1,
            "limit": limit,
            "total_pages": (total + limit - 1) // limit if limit else 1
        },
        message=f"{total} employee(s) found."
    )


@router.get("/departments")
async def get_departments(
    current_user: User = Depends(get_current_user),
) -> Dict:
    """Get list of active departments in the organization."""
    # Return standard list of departments
    return _ok(
        data=["Engineering", "Sales", "HR", "Finance", "Operations", "Marketing", "Legal"],
        message="Departments retrieved."
    )


@router.get("/{employee_id}")
async def get_employee(
    employee_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict:
    """Get single employee details."""
    stmt = select(User).where(
        and_(User.id == uuid.UUID(employee_id), User.organization_id == current_user.organization_id)
    )
    res = await db.execute(stmt)
    emp = res.scalar_one_or_none()

    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found.")

    return _ok(
        data={
            "id": str(emp.id),
            "email": emp.email,
            "full_name": emp.full_name,
            "role": emp.role.value,
            "organization_id": str(emp.organization_id),
            "avatar_url": emp.avatar_url,
            "department": emp.department,
            "phone": emp.phone,
            "is_active": emp.is_active,
            "is_verified": emp.is_verified,
            "created_at": emp.created_at.isoformat()
        },
        message="Employee details retrieved."
    )


@router.put("/{employee_id}")
async def update_employee(
    employee_id: str,
    payload: EmployeeUpdateRequest,
    current_user: User = Depends(require_role(Role.ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> Dict:
    """Update employee details (Admin only)."""
    stmt = select(User).where(
        and_(User.id == uuid.UUID(employee_id), User.organization_id == current_user.organization_id)
    )
    res = await db.execute(stmt)
    emp = res.scalar_one_or_none()

    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found.")

    updates = {k: val for k, val in payload.model_dump(exclude_none=True).items()}
    if "role" in updates and updates["role"]:
        try:
            updates["role"] = Role(updates["role"].upper())
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid role specified.")

    if updates:
        await db.execute(
            update(User).where(User.id == emp.id).values(**updates, updated_at=datetime.now(timezone.utc))
        )
        await db.commit()

    return _ok(message="Employee updated successfully.")


@router.post("/{employee_id}/deactivate")
async def deactivate_employee(
    employee_id: str,
    current_user: User = Depends(require_role(Role.ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> Dict:
    """Deactivate employee account (Admin only)."""
    if str(current_user.id) == employee_id:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own account.")

    stmt = select(User).where(
        and_(User.id == uuid.UUID(employee_id), User.organization_id == current_user.organization_id)
    )
    res = await db.execute(stmt)
    emp = res.scalar_one_or_none()

    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found.")

    emp.is_active = False
    await db.commit()

    return _ok(message="Employee deactivated successfully.")


@router.post("/{employee_id}/activate")
async def activate_employee(
    employee_id: str,
    current_user: User = Depends(require_role(Role.ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> Dict:
    """Activate employee account (Admin only)."""
    stmt = select(User).where(
        and_(User.id == uuid.UUID(employee_id), User.organization_id == current_user.organization_id)
    )
    res = await db.execute(stmt)
    emp = res.scalar_one_or_none()

    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found.")

    emp.is_active = True
    await db.commit()

    return _ok(message="Employee activated successfully.")


@router.get("/{employee_id}/expenses")
async def get_employee_expenses(
    employee_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    pagination = Depends(get_pagination),
) -> Dict:
    """Get all expense claims for a specific employee."""
    skip, limit = pagination
    org_id = current_user.organization_id

    stmt = select(ExpenseClaim).where(
        and_(ExpenseClaim.organization_id == org_id, ExpenseClaim.employee_id == uuid.UUID(employee_id))
    ).order_by(ExpenseClaim.submitted_at.desc())

    # Count
    count_res = await db.execute(select(func.count()).select_from(stmt.subquery()))
    total = count_res.scalar() or 0

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
        message="Employee expenses retrieved."
    )


@router.post("/invite")
async def invite_employee(
    payload: InviteRequest,
    current_user: User = Depends(require_role(Role.ADMIN, Role.FINANCE_MANAGER)),
) -> Dict:
    """Invite a new employee to join the organization (Admin/Finance Manager only)."""
    # Simply log invite and return success message (mock SMTP pipeline)
    logger.info("Inviting user %s to org %s with role %s in dept %s", 
                payload.email, current_user.organization_id, payload.role, payload.department)
    return _ok(message=f"Invitation sent successfully to {payload.email}.")
