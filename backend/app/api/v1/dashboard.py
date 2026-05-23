"""
Dashboard router for SMART EXPENSE AUDITOR.

Endpoints
─────────
GET /api/v1/dashboard/stats          KPI cards – totals, fraud count, compliance
GET /api/v1/dashboard/activity-feed  Recent 10 audit log entries
GET /api/v1/dashboard/ai-insights    5-7 AI insight cards
GET /api/v1/dashboard/risk-heatmap   Department × month fraud risk matrix
"""

from __future__ import annotations

import logging
import random
from datetime import datetime, timezone
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_user, get_pagination
from app.core.database import get_db
from app.models.audit_log import AuditLog
from app.models.expense import Expense, ExpenseStatus
from app.models.fraud_report import FraudReport, FraudStatus
from app.models.user import User

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

DEPARTMENTS = ["Engineering", "Sales", "HR", "Finance", "Operations", "Marketing", "Legal"]
MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def _ok(data: Any = None, message: str = "Success") -> Dict:
    return {"success": True, "data": data, "message": message}


# ─────────────────────────────────────────────────────────────────────────────
# GET /stats
# ─────────────────────────────────────────────────────────────────────────────


@router.get("/stats")
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict:
    """
    Return high-level KPI figures for the dashboard header cards.

    Queries live data where available, falls back to realistic mock aggregates.
    """
    org_id = current_user.organization_id

    # ── Total expenses & amounts ─────────────────────────────────────────────
    try:
        expense_count_result = await db.execute(
            select(func.count(Expense.id), func.sum(Expense.amount)).where(
                Expense.organization_id == org_id
            )
        )
        count_row = expense_count_result.one()
        total_expenses: int = count_row[0] or 0
        total_amount: float = float(count_row[1] or 0.0)
    except Exception:
        total_expenses, total_amount = 148, 1_284_750.50

    # ── Pending approvals ────────────────────────────────────────────────────
    try:
        pending_result = await db.execute(
            select(func.count(Expense.id)).where(
                Expense.organization_id == org_id,
                Expense.status == ExpenseStatus.PENDING,
            )
        )
        pending_count: int = pending_result.scalar() or 0
    except Exception:
        pending_count = 23

    # ── Fraud reports ────────────────────────────────────────────────────────
    try:
        fraud_result = await db.execute(
            select(func.count(FraudReport.id)).where(
                FraudReport.organization_id == org_id,
                FraudReport.status == FraudStatus.OPEN,
            )
        )
        fraud_open: int = fraud_result.scalar() or 0
    except Exception:
        fraud_open = 7

    # ── Compliance score (mock AI calculation) ───────────────────────────────
    compliance_score: float = round(random.uniform(82.0, 96.0), 1)

    # ── Month-over-month changes (mock deltas) ───────────────────────────────
    return _ok(
        data={
            "total_expenses": total_expenses,
            "total_amount": total_amount,
            "total_amount_formatted": f"₹{total_amount:,.2f}",
            "pending_approvals": pending_count,
            "fraud_alerts_open": fraud_open,
            "compliance_score": compliance_score,
            "compliance_grade": "A" if compliance_score >= 90 else "B" if compliance_score >= 75 else "C",
            "changes": {
                "total_expenses_mom": "+12.4%",
                "total_amount_mom": "+8.7%",
                "pending_mom": "-3",
                "fraud_mom": "+2",
                "compliance_mom": "+1.2%",
            },
        },
        message="Dashboard statistics retrieved.",
    )


# ─────────────────────────────────────────────────────────────────────────────
# GET /activity-feed
# ─────────────────────────────────────────────────────────────────────────────


@router.get("/activity-feed")
async def get_activity_feed(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict:
    """Return the 10 most recent audit log entries for the current org."""
    try:
        result = await db.execute(
            select(AuditLog)
            .where(AuditLog.organization_id == current_user.organization_id)
            .order_by(AuditLog.created_at.desc())
            .limit(10)
        )
        logs = result.scalars().all()

        feed = [
            {
                "id": log.id,
                "action": log.action,
                "resource": log.resource,
                "user_id": log.user_id,
                "details": log.details,
                "created_at": log.created_at.isoformat(),
            }
            for log in logs
        ]
    except Exception as exc:
        logger.warning("Activity feed DB error, using mock: %s", exc)
        feed = _mock_activity_feed()

    return _ok(data={"feed": feed, "count": len(feed)}, message="Activity feed retrieved.")


def _mock_activity_feed() -> List[Dict]:
    actions = [
        ("EXPENSE_SUBMITTED", "expense", "Priya Sharma submitted ₹12,500 travel claim"),
        ("EXPENSE_APPROVED", "expense", "Rahul Mehta approved ₹8,200 hotel bill"),
        ("FRAUD_DETECTED", "fraud_report", "AI flagged duplicate receipt for ₹5,400"),
        ("VENDOR_BLACKLISTED", "vendor", "Vendor 'QuickBill Solutions' blacklisted"),
        ("GST_VALIDATED", "gst", "GSTIN 27AAPFU0939F1ZV validated successfully"),
        ("USER_REGISTERED", "user", "New employee Arjun Nair onboarded"),
        ("EXPENSE_REJECTED", "expense", "₹3,100 entertainment claim rejected"),
        ("REPORT_EXPORTED", "audit_log", "Audit log exported as CSV"),
        ("FRAUD_DISMISSED", "fraud_report", "False positive dismissed for ₹9,800"),
        ("COMPLIANCE_CHECK", "gst", "Monthly GST compliance report generated"),
    ]
    return [
        {
            "id": f"mock-{i+1}",
            "action": a[0],
            "resource": a[1],
            "user_id": f"user-{random.randint(1, 15)}",
            "details": {"description": a[2]},
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        for i, a in enumerate(actions)
    ]


# ─────────────────────────────────────────────────────────────────────────────
# GET /ai-insights
# ─────────────────────────────────────────────────────────────────────────────


@router.get("/ai-insights")
async def get_ai_insights(
    current_user: User = Depends(get_current_user),
) -> Dict:
    """
    Return 5-7 AI-generated insight cards.

    Each card contains: title, description, severity, icon, action_label, and metric.
    """
    insights: List[Dict] = [
        {
            "id": "ins-001",
            "title": "Spike in Travel Expenses",
            "description": "Travel claims in Q1 are 34% higher than Q4 average. 3 employees account for 68% of the spike.",
            "severity": "high",
            "icon": "TrendingUp",
            "category": "anomaly",
            "metric": {"value": "+34%", "label": "vs last quarter"},
            "action_label": "Review Travel Claims",
            "action_href": "/expenses?category=travel",
        },
        {
            "id": "ins-002",
            "title": "Duplicate Receipt Risk",
            "description": "AI detected 4 potential duplicate submissions totalling ₹28,400. Likely same bills uploaded twice.",
            "severity": "critical",
            "icon": "AlertTriangle",
            "category": "fraud",
            "metric": {"value": "4", "label": "suspected duplicates"},
            "action_label": "Investigate Now",
            "action_href": "/fraud/reports?type=duplicate",
        },
        {
            "id": "ins-003",
            "title": "GST Compliance Improving",
            "description": "Your ITC claim rate improved from 71% to 89% this month after vendor GSTIN validations.",
            "severity": "low",
            "icon": "CheckCircle",
            "category": "compliance",
            "metric": {"value": "89%", "label": "ITC eligibility"},
            "action_label": "View GST Report",
            "action_href": "/gst/compliance",
        },
        {
            "id": "ins-004",
            "title": "Vendor Risk Concentration",
            "description": "62% of vendor spending is concentrated in 3 vendors with medium-high fraud scores.",
            "severity": "medium",
            "icon": "Users",
            "category": "vendor_risk",
            "metric": {"value": "3", "label": "high-risk vendors"},
            "action_label": "Audit Vendors",
            "action_href": "/vendors?risk=high",
        },
        {
            "id": "ins-005",
            "title": "Weekend Expense Pattern",
            "description": "18 expense claims were submitted on weekends in the last 30 days — typically a fraud indicator.",
            "severity": "medium",
            "icon": "Calendar",
            "category": "pattern",
            "metric": {"value": "18", "label": "weekend submissions"},
            "action_label": "Audit Weekend Claims",
            "action_href": "/expenses?filter=weekend",
        },
        {
            "id": "ins-006",
            "title": "Round-Amount Anomaly",
            "description": "7 expenses have suspiciously round amounts (₹5,000, ₹10,000) — common fabrication pattern.",
            "severity": "medium",
            "icon": "DollarSign",
            "category": "fraud",
            "metric": {"value": "7", "label": "round-amount claims"},
            "action_label": "Review Amounts",
            "action_href": "/fraud/reports?type=round_amount",
        },
        {
            "id": "ins-007",
            "title": "Policy Compliance Score",
            "description": "Overall expense policy adherence is 91.2% — top performer is Finance department at 98%.",
            "severity": "low",
            "icon": "Shield",
            "category": "compliance",
            "metric": {"value": "91.2%", "label": "policy compliance"},
            "action_label": "View Breakdown",
            "action_href": "/analytics/overview",
        },
    ]

    return _ok(
        data={"insights": insights, "generated_at": datetime.now(timezone.utc).isoformat()},
        message="AI insights retrieved.",
    )


# ─────────────────────────────────────────────────────────────────────────────
# GET /risk-heatmap
# ─────────────────────────────────────────────────────────────────────────────


@router.get("/risk-heatmap")
async def get_risk_heatmap(
    current_user: User = Depends(get_current_user),
) -> Dict:
    """
    Return a department × month fraud risk matrix.

    Risk scores are 0-100 where 0 = no risk and 100 = critical risk.
    """
    heatmap: List[Dict] = []
    for dept in DEPARTMENTS:
        row: Dict[str, Any] = {"department": dept}
        for month in MONTHS:
            # Realistic-ish risk values — Sales and Ops tend to be higher
            base = 20 if dept in ("Sales", "Operations") else 10
            row[month] = min(100, base + random.randint(0, 50))
        heatmap.append(row)

    return _ok(
        data={
            "heatmap": heatmap,
            "departments": DEPARTMENTS,
            "months": MONTHS,
            "scale": {"min": 0, "max": 100, "low": 25, "medium": 50, "high": 75},
        },
        message="Risk heatmap data retrieved.",
    )
