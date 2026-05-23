"""
Analytics & dashboard Pydantic v2 schemas for SMART EXPENSE AUDITOR.

Provides strongly-typed contracts for the dashboard KPI cards, chart
datasets, and trend time-series used by the frontend.
"""

from __future__ import annotations

from datetime import date, datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


# ── Primitive Chart Building Blocks ───────────────────────────────────────────

class ChartDataPoint(BaseModel):
    """A single labelled value in a chart series."""

    label: str = Field(..., description="X-axis label or category name")
    value: float = Field(..., description="Numeric value for this data point")
    date: Optional[date] = Field(
        None, description="ISO date for time-series charts"
    )
    metadata: Optional[dict[str, Any]] = Field(
        None, description="Optional extra context (color, tooltip text, etc.)"
    )

    model_config = {
        "json_schema_extra": {
            "example": {"label": "May 2026", "value": 124500.0, "date": "2026-05-01"}
        }
    }


class ChartDataset(BaseModel):
    """A named series / dataset suitable for Chart.js or Recharts."""

    name: str = Field(..., description="Series name shown in the chart legend")
    data: list[ChartDataPoint]
    color: Optional[str] = Field(
        None, description="Hex color for this series, e.g. '#4F46E5'"
    )


class TrendData(BaseModel):
    """
    Multi-series time-series data for trend charts.

    `labels` is the shared X-axis (dates or category names).
    Each dataset in `datasets` carries aligned Y-values.
    """

    labels: list[str] = Field(
        ..., description="Shared X-axis labels (same order for all datasets)"
    )
    datasets: list[ChartDataset]

    model_config = {
        "json_schema_extra": {
            "example": {
                "labels": ["Jan", "Feb", "Mar", "Apr", "May"],
                "datasets": [
                    {
                        "name": "Approved",
                        "data": [
                            {"label": "Jan", "value": 85000},
                            {"label": "Feb", "value": 92000},
                            {"label": "Mar", "value": 78000},
                            {"label": "Apr", "value": 105000},
                            {"label": "May", "value": 124500},
                        ],
                        "color": "#10B981",
                    },
                    {
                        "name": "Flagged",
                        "data": [
                            {"label": "Jan", "value": 12000},
                            {"label": "Feb", "value": 8500},
                            {"label": "Mar", "value": 21000},
                            {"label": "Apr", "value": 6000},
                            {"label": "May", "value": 15000},
                        ],
                        "color": "#EF4444",
                    },
                ],
            }
        }
    }


# ── KPI / Dashboard Statistics ────────────────────────────────────────────────

class DashboardStats(BaseModel):
    """
    Top-level KPI cards for the main analytics dashboard.

    All monetary values are in INR unless otherwise noted.
    Rates and scores are percentages [0.0, 100.0].
    """

    # Expense overview
    total_expenses: float = Field(
        ..., description="Total claimed amount across the reporting period (INR)"
    )
    total_expense_count: int = Field(
        ..., description="Number of expense claims in the reporting period"
    )
    pending_reviews: int = Field(
        ..., description="Claims awaiting finance manager action"
    )
    approved_this_month: float = Field(
        ..., description="Amount approved in the current calendar month (INR)"
    )

    # Fraud & risk
    fraud_detected: int = Field(
        ..., description="Number of fraud reports generated in the reporting period"
    )
    fraud_amount_at_risk: float = Field(
        ..., description="Cumulative amount linked to open fraud reports (INR)"
    )
    amount_saved: float = Field(
        ..., description="Amount saved by rejecting confirmed fraudulent claims (INR)"
    )

    # Compliance
    compliance_score: float = Field(
        ..., ge=0.0, le=100.0, description="Org-level GST compliance score"
    )
    approval_rate: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Percentage of submitted claims that were approved",
    )
    fraud_rate: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Percentage of claims that were flagged or confirmed as fraudulent",
    )

    # Spend breakdown
    monthly_spend: float = Field(
        ..., description="Total spend in the current calendar month (INR)"
    )
    avg_claim_amount: float = Field(
        ..., description="Average expense claim amount (INR)"
    )

    # Time-series trends (optional — populated on full dashboard load)
    fraud_trend: Optional[TrendData] = Field(
        None, description="Fraud score trend over time (weekly / monthly)"
    )
    expense_trend: Optional[TrendData] = Field(
        None, description="Expense volume/amount trend over time"
    )

    # Category breakdown
    spend_by_category: Optional[list[ChartDataPoint]] = Field(
        None, description="Expense amount per category (pie / donut chart)"
    )

    # Metadata
    reporting_period_start: Optional[date] = None
    reporting_period_end: Optional[date] = None
    generated_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="UTC timestamp when this snapshot was computed",
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "total_expenses": 2847500.0,
                "total_expense_count": 312,
                "pending_reviews": 28,
                "approved_this_month": 485000.0,
                "fraud_detected": 47,
                "fraud_amount_at_risk": 342800.0,
                "amount_saved": 89500.0,
                "compliance_score": 87.4,
                "approval_rate": 76.3,
                "fraud_rate": 15.1,
                "monthly_spend": 624000.0,
                "avg_claim_amount": 9126.6,
                "reporting_period_start": "2026-01-01",
                "reporting_period_end": "2026-05-23",
            }
        }
    }


# ── Department / Employee Analytics ──────────────────────────────────────────

class DepartmentBreakdown(BaseModel):
    """Per-department expense & fraud breakdown."""

    department: str
    total_amount: float
    expense_count: int
    fraud_count: int
    fraud_rate: float
    avg_claim_amount: float
    top_category: Optional[str] = None


class EmployeeRiskProfile(BaseModel):
    """Risk profile for an individual employee (used in audit views)."""

    employee_id: str
    full_name: str
    department: Optional[str] = None
    total_claimed: float
    claim_count: int
    fraud_score_avg: float
    flagged_count: int
    risk_level: str


# ── Time Range Filter ─────────────────────────────────────────────────────────

class AnalyticsFilter(BaseModel):
    """Query parameters for analytics endpoints."""

    start_date: Optional[date] = Field(
        None, description="Inclusive start date for the reporting period"
    )
    end_date: Optional[date] = Field(
        None, description="Inclusive end date for the reporting period"
    )
    department: Optional[str] = Field(None, description="Filter to a specific department")
    category: Optional[str] = Field(None, description="Filter to a specific expense category")
    granularity: str = Field(
        default="monthly",
        description="Time-series granularity: 'daily', 'weekly', or 'monthly'",
        pattern=r"^(daily|weekly|monthly)$",
    )
