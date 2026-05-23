"""
Analytics aggregation service for the Smart Expense Auditor platform.

Provides dashboard statistics, trend data, and breakdowns for the frontend
charts and reports. Uses Faker with a consistent per-org seed for realistic,
reproducible mock data.
"""

from __future__ import annotations

import random
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from typing import Any

from faker import Faker
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession


# ─── Constants ────────────────────────────────────────────────────────────────

_CATEGORIES = [
    "Travel & Accommodation",
    "Food & Beverage",
    "IT Services",
    "Office Supplies",
    "Healthcare & Medical",
    "Training & Education",
    "Automotive & Fuel",
    "Marketing & Advertising",
    "Utilities & Communication",
    "Miscellaneous",
]

_DEPARTMENTS = [
    "Engineering",
    "Sales & Marketing",
    "Human Resources",
    "Finance & Accounts",
    "Operations",
    "Legal & Compliance",
    "Product Management",
    "Customer Success",
    "Research & Development",
    "Administration",
]

_VENDOR_NAMES = [
    "Tata Consultancy Services", "Infosys BPM Ltd", "Zomato Ltd",
    "MakeMyTrip India", "Indian Oil Corporation", "Wipro Technologies",
    "Flipkart Internet Pvt Ltd", "HDFC Bank Ltd", "Reliance Jio",
    "Amazon Seller Services", "Oyo Rooms", "Swiggy (Bundl Technologies)",
    "Ola Electric Mobility", "Nykaa (FSN E-Commerce)", "Sun Pharma",
]

_RISK_LEVELS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
_RISK_WEIGHTS = [0.55, 0.28, 0.12, 0.05]


# ─── Seed utility ─────────────────────────────────────────────────────────────

def _org_seed(org_id: str) -> int:
    return sum(ord(c) * (i + 1) for i, c in enumerate(str(org_id)))


def _make_faker(org_id: str) -> tuple[Faker, random.Random]:
    seed = _org_seed(org_id)
    fk = Faker("en_IN")
    fk.seed_instance(seed)
    rng = random.Random(seed)
    return fk, rng


# ─── Data classes ─────────────────────────────────────────────────────────────


@dataclass
class DashboardStats:
    total_expenses: int
    total_amount_inr: float
    pending_approvals: int
    flagged_for_fraud: int
    approved_today: int
    rejected_today: int
    avg_processing_days: float
    itc_claimed_inr: float
    itc_potential_inr: float
    gst_compliance_score: float
    fraud_detection_rate: float
    top_category: str
    top_spender_department: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "total_expenses": self.total_expenses,
            "total_amount_inr": round(self.total_amount_inr, 2),
            "pending_approvals": self.pending_approvals,
            "flagged_for_fraud": self.flagged_for_fraud,
            "approved_today": self.approved_today,
            "rejected_today": self.rejected_today,
            "avg_processing_days": self.avg_processing_days,
            "itc_claimed_inr": round(self.itc_claimed_inr, 2),
            "itc_potential_inr": round(self.itc_potential_inr, 2),
            "gst_compliance_score": round(self.gst_compliance_score, 1),
            "fraud_detection_rate": round(self.fraud_detection_rate, 2),
            "top_category": self.top_category,
            "top_spender_department": self.top_spender_department,
        }


# ─── AnalyticsService ─────────────────────────────────────────────────────────


class AnalyticsService:
    """
    Analytics service that produces dashboard stats, trend data, and
    category/vendor/department breakdowns. All data is deterministically
    seeded per org_id for consistent mock responses.
    """

    # ── Dashboard Stats ───────────────────────────────────────────────────────

    async def get_dashboard_stats(
        self,
        org_id: str,
        db: AsyncSession | None = None,
    ) -> dict[str, Any]:
        """
        Return high-level KPI stats for the main dashboard.

        Parameters
        ----------
        org_id : str
            Organisation UUID string.
        db : AsyncSession, optional
            Database session (reserved for real queries).

        Returns
        -------
        dict
            Dashboard KPI dictionary.
        """
        _, rng = _make_faker(org_id)

        total_expenses = rng.randint(200, 5000)
        total_amount = rng.uniform(5_00_000, 5_00_00_000)
        pending = rng.randint(10, min(200, total_expenses))
        flagged = rng.randint(5, min(100, total_expenses))
        approved_today = rng.randint(0, 30)
        rejected_today = rng.randint(0, 10)
        avg_proc_days = round(rng.uniform(1.0, 7.0), 1)
        itc_potential = round(total_amount * 0.18, 2)
        itc_claimed = round(itc_potential * rng.uniform(0.55, 0.92), 2)
        gst_score = round(rng.uniform(55, 98), 1)
        fraud_rate = round((flagged / max(total_expenses, 1)) * 100, 2)
        top_cat = rng.choice(_CATEGORIES)
        top_dept = rng.choice(_DEPARTMENTS)

        stats = DashboardStats(
            total_expenses=total_expenses,
            total_amount_inr=total_amount,
            pending_approvals=pending,
            flagged_for_fraud=flagged,
            approved_today=approved_today,
            rejected_today=rejected_today,
            avg_processing_days=avg_proc_days,
            itc_claimed_inr=itc_claimed,
            itc_potential_inr=itc_potential,
            gst_compliance_score=gst_score,
            fraud_detection_rate=fraud_rate,
            top_category=top_cat,
            top_spender_department=top_dept,
        )

        logger.info(f"📊 Dashboard stats | org={org_id} | total=₹{total_amount:,.0f}")
        return stats.to_dict()

    # ── Expense Trends ────────────────────────────────────────────────────────

    async def get_expense_trends(
        self,
        org_id: str,
        period: str = "monthly",
        db: AsyncSession | None = None,
    ) -> dict[str, Any]:
        """
        Return time-series expense data for line/bar charts.

        Parameters
        ----------
        org_id : str
            Organisation UUID.
        period : str
            ``"monthly"`` (last 12 months) or ``"weekly"`` (last 12 weeks).
        db : AsyncSession, optional
            Database session.

        Returns
        -------
        dict
            ``{"period", "labels", "total_amounts", "expense_counts", "avg_amounts"}``
        """
        _, rng = _make_faker(org_id)
        today = date.today()

        labels: list[str] = []
        total_amounts: list[float] = []
        expense_counts: list[int] = []
        avg_amounts: list[float] = []

        if period == "weekly":
            n = 12
            for i in range(n - 1, -1, -1):
                week_start = today - timedelta(weeks=i)
                labels.append(f"W{week_start.isocalendar()[1]} {week_start.year}")
                count = rng.randint(10, 80)
                amount = rng.uniform(50_000, 20_00_000)
                expense_counts.append(count)
                total_amounts.append(round(amount, 2))
                avg_amounts.append(round(amount / count, 2))
        else:
            # Monthly — last 12 months
            n = 12
            for i in range(n - 1, -1, -1):
                month_date = today.replace(day=1) - timedelta(days=30 * i)
                labels.append(month_date.strftime("%b %Y"))
                count = rng.randint(50, 400)
                amount = rng.uniform(5_00_000, 1_00_00_000)
                expense_counts.append(count)
                total_amounts.append(round(amount, 2))
                avg_amounts.append(round(amount / count, 2))

        logger.info(f"📈 Expense trends ({period}) | org={org_id} | {n} data points")
        return {
            "org_id": org_id,
            "period": period,
            "labels": labels,
            "total_amounts": total_amounts,
            "expense_counts": expense_counts,
            "avg_amounts": avg_amounts,
            "currency": "INR",
        }

    # ── Fraud Trends ──────────────────────────────────────────────────────────

    async def get_fraud_trends(
        self,
        org_id: str,
        period: str = "monthly",
        db: AsyncSession | None = None,
    ) -> dict[str, Any]:
        """
        Return fraud detection trend data for visualisations.

        Parameters
        ----------
        org_id : str
            Organisation UUID.
        period : str
            ``"monthly"`` or ``"weekly"``.
        db : AsyncSession, optional
            Database session.

        Returns
        -------
        dict
            Fraud trend breakdown including risk-level distribution per period.
        """
        _, rng = _make_faker(str(org_id) + "fraud")
        today = date.today()

        labels: list[str] = []
        flagged_counts: list[int] = []
        fraud_amounts: list[float] = []
        risk_distribution: list[dict[str, int]] = []

        n = 12
        for i in range(n - 1, -1, -1):
            if period == "weekly":
                ref = today - timedelta(weeks=i)
                labels.append(f"W{ref.isocalendar()[1]} {ref.year}")
            else:
                ref = today.replace(day=1) - timedelta(days=30 * i)
                labels.append(ref.strftime("%b %Y"))

            flagged = rng.randint(0, 30)
            amount = rng.uniform(0, 5_00_000)
            flagged_counts.append(flagged)
            fraud_amounts.append(round(amount, 2))

            low = rng.randint(0, flagged)
            remaining = flagged - low
            medium = rng.randint(0, remaining)
            remaining -= medium
            high = rng.randint(0, remaining)
            critical = remaining - high

            risk_distribution.append({
                "LOW": low,
                "MEDIUM": medium,
                "HIGH": high,
                "CRITICAL": max(critical, 0),
            })

        logger.info(f"🔍 Fraud trends ({period}) | org={org_id}")
        return {
            "org_id": org_id,
            "period": period,
            "labels": labels,
            "flagged_counts": flagged_counts,
            "fraud_amounts_inr": fraud_amounts,
            "risk_distribution": risk_distribution,
        }

    # ── Department Breakdown ──────────────────────────────────────────────────

    async def get_department_breakdown(
        self,
        org_id: str,
        db: AsyncSession | None = None,
    ) -> dict[str, Any]:
        """
        Return expense totals and fraud rates broken down by department.

        Parameters
        ----------
        org_id : str
            Organisation UUID.
        db : AsyncSession, optional
            Database session.

        Returns
        -------
        dict
            List of departments with spend, count, and fraud metrics.
        """
        _, rng = _make_faker(str(org_id) + "dept")

        departments: list[dict[str, Any]] = []
        for dept in _DEPARTMENTS:
            count = rng.randint(10, 300)
            amount = rng.uniform(50_000, 2_00_00_000)
            flagged = rng.randint(0, max(1, count // 10))
            avg = round(amount / count, 2)
            departments.append({
                "department": dept,
                "expense_count": count,
                "total_amount_inr": round(amount, 2),
                "avg_expense_inr": avg,
                "flagged_count": flagged,
                "fraud_rate_percent": round(flagged / count * 100, 2),
                "risk_level": rng.choices(_RISK_LEVELS, weights=_RISK_WEIGHTS, k=1)[0],
            })

        # Sort by total spend descending
        departments.sort(key=lambda x: x["total_amount_inr"], reverse=True)

        logger.info(f"🏗️  Department breakdown | org={org_id} | {len(departments)} depts")
        return {
            "org_id": org_id,
            "departments": departments,
            "total_departments": len(departments),
            "generated_at": date.today().isoformat(),
        }

    # ── Vendor Analytics ──────────────────────────────────────────────────────

    async def get_vendor_analytics(
        self,
        org_id: str,
        db: AsyncSession | None = None,
    ) -> dict[str, Any]:
        """
        Return top vendors ranked by spend with associated risk scores.

        Parameters
        ----------
        org_id : str
            Organisation UUID.
        db : AsyncSession, optional
            Database session.

        Returns
        -------
        dict
            Top vendor list with spend, count, compliance, and risk data.
        """
        _, rng = _make_faker(str(org_id) + "vendor")

        vendors: list[dict[str, Any]] = []
        for vname in _VENDOR_NAMES:
            count = rng.randint(5, 100)
            amount = rng.uniform(10_000, 5_00_00_000)
            gst_score = rng.randint(30, 100)
            fraud_score = round(rng.uniform(0.0, 1.0), 3)
            risk = rng.choices(_RISK_LEVELS, weights=_RISK_WEIGHTS, k=1)[0]
            vendors.append({
                "vendor_name": vname,
                "transaction_count": count,
                "total_spend_inr": round(amount, 2),
                "avg_invoice_inr": round(amount / count, 2),
                "gst_compliance_score": gst_score,
                "fraud_score": fraud_score,
                "risk_level": risk,
                "itc_eligible_inr": round(amount * 0.18 * rng.uniform(0.5, 1.0), 2),
            })

        vendors.sort(key=lambda x: x["total_spend_inr"], reverse=True)
        top_10 = vendors[:10]

        logger.info(f"🏪 Vendor analytics | org={org_id} | top {len(top_10)} vendors")
        return {
            "org_id": org_id,
            "top_vendors": top_10,
            "total_vendors_analysed": len(vendors),
            "generated_at": date.today().isoformat(),
        }

    # ── Category Breakdown ────────────────────────────────────────────────────

    async def get_category_breakdown(
        self,
        org_id: str,
        db: AsyncSession | None = None,
    ) -> dict[str, Any]:
        """
        Return spending breakdown by expense category for pie/donut charts.

        Parameters
        ----------
        org_id : str
            Organisation UUID.
        db : AsyncSession, optional
            Database session.

        Returns
        -------
        dict
            Category-level spend, count, GST, and trend data.
        """
        _, rng = _make_faker(str(org_id) + "cat")

        categories: list[dict[str, Any]] = []
        grand_total = 0.0

        for cat in _CATEGORIES:
            count = rng.randint(5, 200)
            amount = rng.uniform(10_000, 3_00_00_000)
            gst_rate = rng.choice([0.05, 0.12, 0.18, 0.28])
            gst_amount = round(amount * gst_rate, 2)
            trend_pct = round(rng.uniform(-30.0, 50.0), 1)  # MoM change %
            grand_total += amount
            categories.append({
                "category": cat,
                "expense_count": count,
                "total_amount_inr": round(amount, 2),
                "avg_expense_inr": round(amount / count, 2),
                "gst_rate_percent": round(gst_rate * 100, 0),
                "total_gst_inr": gst_amount,
                "mom_change_percent": trend_pct,
                "percentage_of_total": 0.0,  # filled below
            })

        # Compute percentage share
        for cat in categories:
            cat["percentage_of_total"] = round(cat["total_amount_inr"] / grand_total * 100, 2)

        categories.sort(key=lambda x: x["total_amount_inr"], reverse=True)

        logger.info(f"📦 Category breakdown | org={org_id} | {len(categories)} categories")
        return {
            "org_id": org_id,
            "categories": categories,
            "total_categories": len(categories),
            "grand_total_inr": round(grand_total, 2),
            "generated_at": date.today().isoformat(),
        }


# ─── Module-level singleton ───────────────────────────────────────────────────
analytics_service = AnalyticsService()
