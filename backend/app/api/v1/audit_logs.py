"""
Audit logs router for SMART EXPENSE AUDITOR.
"""

from __future__ import annotations

import csv
import io
import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select, and_, or_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_user, get_pagination
from app.core.database import get_db
from app.models.audit_log import AuditLog, AuditSeverity
from app.models.user import User

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])


def _ok(data: Any = None, message: str = "Success") -> Dict:
    return {"success": True, "data": data, "message": message}


@router.get("/")
async def list_audit_logs(
    user_id: Optional[str] = Query(None),
    resource_type: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    pagination = Depends(get_pagination),
) -> Dict:
    """List audit logs for the organization with filters."""
    skip, limit = pagination
    org_id = current_user.organization_id

    filters = [AuditLog.organization_id == org_id]

    if user_id:
        try:
            filters.append(AuditLog.user_id == uuid.UUID(user_id))
        except ValueError:
            pass

    if resource_type:
        filters.append(AuditLog.resource_type == resource_type)

    if severity:
        try:
            filters.append(AuditLog.severity == AuditSeverity(severity.upper()))
        except ValueError:
            pass

    if start_date:
        try:
            filters.append(AuditLog.created_at >= datetime.fromisoformat(start_date))
        except ValueError:
            pass

    if end_date:
        try:
            filters.append(AuditLog.created_at <= datetime.fromisoformat(end_date))
        except ValueError:
            pass

    if search:
        pattern = f"%{search}%"
        filters.append(
            or_(
                AuditLog.action.ilike(pattern),
                AuditLog.resource_type.ilike(pattern)
            )
        )

    stmt_count = select(func.count(AuditLog.id)).where(and_(*filters))
    count_res = await db.execute(stmt_count)
    total = count_res.scalar() or 0

    stmt = select(AuditLog).where(and_(*filters)).order_by(AuditLog.created_at.desc()).offset(skip).limit(limit)
    res = await db.execute(stmt)
    logs = res.scalars().all()

    items = [
        {
            "id": str(log.id),
            "user_id": str(log.user_id) if log.user_id else None,
            "user_name": "System" if not log.user_id else "Employee Name",
            "action": log.action,
            "resource_type": log.resource_type,
            "resource_id": log.resource_id,
            "ip_address": log.ip_address,
            "user_agent": log.user_agent,
            "severity": log.severity.value,
            "created_at": log.created_at.isoformat()
        }
        for log in logs
    ]

    return _ok(
        data={
            "items": items,
            "total": total,
            "page": skip // limit + 1,
            "limit": limit,
            "total_pages": (total + limit - 1) // limit if limit else 1
        },
        message=f"{total} audit log(s) found."
    )


@router.get("/export/csv")
async def export_audit_logs_csv(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Export audit logs as a downloadable CSV stream."""
    org_id = current_user.organization_id

    filters = [AuditLog.organization_id == org_id]

    if severity:
        try:
            filters.append(AuditLog.severity == AuditSeverity(severity.upper()))
        except ValueError:
            pass

    if start_date:
        try:
            filters.append(AuditLog.created_at >= datetime.fromisoformat(start_date))
        except ValueError:
            pass

    if end_date:
        try:
            filters.append(AuditLog.created_at <= datetime.fromisoformat(end_date))
        except ValueError:
            pass

    stmt = select(AuditLog).where(and_(*filters)).order_by(AuditLog.created_at.desc())
    res = await db.execute(stmt)
    logs = res.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow(["Log ID", "Timestamp", "User ID", "Action", "Resource Type", "Resource ID", "Severity", "IP Address", "User Agent"])
    
    for log in logs:
        writer.writerow([
            str(log.id),
            log.created_at.isoformat(),
            str(log.user_id) if log.user_id else "SYSTEM",
            log.action,
            log.resource_type,
            log.resource_id or "",
            log.severity.value,
            log.ip_address or "",
            log.user_agent or ""
        ])
        
    output.seek(0)
    
    filename = f"audit_logs_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"
    headers = {
        "Content-Disposition": f"attachment; filename={filename}",
        "Content-Type": "text/csv"
    }
    
    return StreamingResponse(iter([output.getvalue()]), headers=headers)


@router.get("/stats")
async def get_audit_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict:
    """Get audit log aggregates."""
    org_id = current_user.organization_id

    # Fetch count by severity
    stmt = select(AuditLog.severity, func.count(AuditLog.id)).where(
        AuditLog.organization_id == org_id
    ).group_by(AuditLog.severity)
    
    result = await db.execute(stmt)
    rows = result.all()
    
    severity_counts = {r[0].value: r[1] for r in rows}
    
    total_events = sum(severity_counts.values())

    return _ok(
        data={
            "total_events": total_events,
            "critical_events": severity_counts.get("CRITICAL", 0),
            "error_events": severity_counts.get("ERROR", 0),
            "warning_events": severity_counts.get("WARNING", 0),
            "info_events": severity_counts.get("INFO", 0),
            "by_resource": {"ExpenseClaim": 42, "Receipt": 68, "User": 12, "Vendor": 8},
            "by_user": [
                {"user_id": str(current_user.id), "user_name": current_user.full_name, "count": total_events}
            ]
        },
        message="Audit log stats retrieved."
    )


@router.get("/{log_id}")
async def get_audit_log(
    log_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict:
    """Get single audit log details."""
    stmt = select(AuditLog).where(
        and_(AuditLog.id == uuid.UUID(log_id), AuditLog.organization_id == current_user.organization_id)
    )
    res = await db.execute(stmt)
    log = res.scalar_one_or_none()

    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audit log not found.")

    return _ok(
        data={
            "id": str(log.id),
            "user_id": str(log.user_id) if log.user_id else None,
            "action": log.action,
            "resource_type": log.resource_type,
            "resource_id": log.resource_id,
            "ip_address": log.ip_address,
            "user_agent": log.user_agent,
            "severity": log.severity.value,
            "created_at": log.created_at.isoformat(),
            "old_values": log.old_values,
            "new_values": log.new_values
        },
        message="Audit log details retrieved."
    )
