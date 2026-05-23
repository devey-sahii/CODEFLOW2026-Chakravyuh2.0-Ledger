"""
Composite risk scoring engine for the Smart Expense Auditor platform.

Computes risk scores for employees, vendors, and entire organisations.
Generates AI-style insights and risk reports using intelligent rule-based
mock logic — no external API calls.

Risk Score Scale
----------------
0–25   : LOW
26–50  : MEDIUM
51–75  : HIGH
76–100 : CRITICAL
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta, timezone
from typing import Any

from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession


# ─── Risk level mapping ───────────────────────────────────────────────────────

def _score_to_level(score: float) -> str:
    if score >= 76:
        return "CRITICAL"
    if score >= 51:
        return "HIGH"
    if score >= 26:
        return "MEDIUM"
    return "LOW"


def _level_color(level: str) -> str:
    return {"LOW": "🟢", "MEDIUM": "🟡", "HIGH": "🟠", "CRITICAL": "🔴"}.get(level, "⚪")


# ─── Data classes ─────────────────────────────────────────────────────────────


@dataclass
class RiskFactor:
    name: str
    score: float          # 0–100
    weight: float         # 0.0–1.0
    detail: str


@dataclass
class RiskReport:
    entity_type: str       # employee | vendor | org
    entity_id: str
    risk_score: float      # 0–100
    risk_level: str
    factors: list[RiskFactor]
    summary: str
    recommendations: list[str]
    generated_at: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "entity_type": self.entity_type,
            "entity_id": self.entity_id,
            "risk_score": round(self.risk_score, 2),
            "risk_level": self.risk_level,
            "factors": [
                {
                    "name": f.name,
                    "score": round(f.score, 2),
                    "weight": f.weight,
                    "weighted_contribution": round(f.score * f.weight, 2),
                    "detail": f.detail,
                }
                for f in self.factors
            ],
            "summary": self.summary,
            "recommendations": self.recommendations,
            "generated_at": self.generated_at,
        }


# ─── Deterministic mock helpers ───────────────────────────────────────────────

def _seed(entity_id: str, offset: int = 0) -> int:
    return sum(ord(c) * (i + 1) for i, c in enumerate(entity_id)) + offset


def _pseudo_score(entity_id: str, offset: int = 0, lo: float = 0, hi: float = 100) -> float:
    raw = (_seed(entity_id, offset) % 1000) / 1000  # 0.0–1.0
    return round(lo + raw * (hi - lo), 2)


def _pseudo_int(entity_id: str, offset: int = 0, lo: int = 0, hi: int = 100) -> int:
    return lo + (_seed(entity_id, offset) % (hi - lo + 1))


# ─── RiskEngine ──────────────────────────────────────────────────────────────


class RiskEngine:
    """
    Composite risk scoring engine.

    All scores are deterministic based on entity_id so the same entity
    always receives the same mock score — simulating a trained ML model.
    """

    # ── Employee risk ─────────────────────────────────────────────────────────

    async def compute_employee_risk(
        self,
        employee_id: str,
        db: AsyncSession | None = None,
    ) -> dict[str, Any]:
        """
        Analyse submission patterns, fraud history, and claim frequency
        to produce a 0–100 employee risk score.

        Parameters
        ----------
        employee_id : str
            UUID string of the employee.
        db : AsyncSession, optional
            Database session (used for real data if available).

        Returns
        -------
        dict
            Risk breakdown with score, level, and contributing factors.
        """
        eid = str(employee_id)

        # Simulated metrics (deterministic)
        total_claims = _pseudo_int(eid, 0, lo=5, hi=150)
        flagged_claims = _pseudo_int(eid, 1, lo=0, hi=min(20, total_claims))
        avg_claim_amount = _pseudo_score(eid, 2, lo=500.0, hi=50_000.0)
        days_since_last_claim = _pseudo_int(eid, 3, lo=0, hi=180)
        weekend_submissions = _pseudo_int(eid, 4, lo=0, hi=10)
        duplicate_attempts = _pseudo_int(eid, 5, lo=0, hi=5)

        # Factor scores
        fraud_rate = (flagged_claims / max(total_claims, 1)) * 100
        fraud_factor = RiskFactor(
            name="fraud_history",
            score=min(fraud_rate * 3, 100),
            weight=0.35,
            detail=f"{flagged_claims}/{total_claims} expenses flagged ({fraud_rate:.1f}% flag rate).",
        )

        freq_score = min((total_claims / 100) * 100, 100) if total_claims > 30 else total_claims * 2
        freq_factor = RiskFactor(
            name="claim_frequency",
            score=freq_score,
            weight=0.20,
            detail=f"{total_claims} total claims submitted. High frequency increases scrutiny.",
        )

        amount_score = min(avg_claim_amount / 500, 100)
        amount_factor = RiskFactor(
            name="avg_claim_amount",
            score=amount_score,
            weight=0.20,
            detail=f"Average claim ₹{avg_claim_amount:,.2f}. Higher averages increase risk.",
        )

        weekend_score = min(weekend_submissions * 10, 100)
        weekend_factor = RiskFactor(
            name="weekend_submissions",
            score=weekend_score,
            weight=0.10,
            detail=f"{weekend_submissions} weekend submission(s) detected.",
        )

        dup_score = min(duplicate_attempts * 20, 100)
        dup_factor = RiskFactor(
            name="duplicate_attempts",
            score=dup_score,
            weight=0.15,
            detail=f"{duplicate_attempts} duplicate invoice attempt(s) detected.",
        )

        factors = [fraud_factor, freq_factor, amount_factor, weekend_factor, dup_factor]
        composite = sum(f.score * f.weight for f in factors)
        level = _score_to_level(composite)

        logger.info(f"👤 Employee risk: {eid} | score={composite:.1f} | level={level}")
        return {
            "employee_id": eid,
            "risk_score": round(composite, 2),
            "risk_level": level,
            "icon": _level_color(level),
            "total_claims": total_claims,
            "flagged_claims": flagged_claims,
            "avg_claim_amount": round(avg_claim_amount, 2),
            "factors": [
                {
                    "name": f.name,
                    "score": round(f.score, 2),
                    "weight": f.weight,
                    "detail": f.detail,
                }
                for f in factors
            ],
            "computed_at": datetime.now(timezone.utc).isoformat(),
        }

    # ── Vendor risk ───────────────────────────────────────────────────────────

    async def compute_vendor_risk(
        self,
        vendor_id: str,
        db: AsyncSession | None = None,
    ) -> dict[str, Any]:
        """
        Analyse vendor fraud score, GST compliance, and transaction anomalies.

        Parameters
        ----------
        vendor_id : str
            UUID string of the vendor.
        db : AsyncSession, optional
            Database session.

        Returns
        -------
        dict
            Vendor risk breakdown.
        """
        vid = str(vendor_id)

        fraud_score_raw = _pseudo_score(vid, 10, lo=0, hi=100)
        gst_compliance = _pseudo_score(vid, 11, lo=30, hi=100)
        transaction_count = _pseudo_int(vid, 12, lo=1, hi=500)
        flagged_txns = _pseudo_int(vid, 13, lo=0, hi=min(50, transaction_count))
        avg_invoice_amount = _pseudo_score(vid, 14, lo=1_000.0, hi=2_00_000.0)
        days_registered = _pseudo_int(vid, 15, lo=30, hi=3650)

        fraud_factor = RiskFactor(
            name="fraud_history_score",
            score=fraud_score_raw,
            weight=0.35,
            detail=f"Historical fraud score: {fraud_score_raw:.1f}/100.",
        )

        gst_factor = RiskFactor(
            name="gst_compliance",
            score=100 - gst_compliance,  # Invert: lower compliance = higher risk
            weight=0.25,
            detail=f"GST compliance score: {gst_compliance:.1f}/100.",
        )

        txn_flag_rate = (flagged_txns / max(transaction_count, 1)) * 100
        txn_factor = RiskFactor(
            name="transaction_anomalies",
            score=min(txn_flag_rate * 2, 100),
            weight=0.20,
            detail=f"{flagged_txns}/{transaction_count} transactions flagged ({txn_flag_rate:.1f}%).",
        )

        amount_factor = RiskFactor(
            name="invoice_amount_risk",
            score=min(avg_invoice_amount / 2000, 100),
            weight=0.10,
            detail=f"Average invoice amount: ₹{avg_invoice_amount:,.2f}.",
        )

        age_risk = max(0, 80 - (days_registered / 365) * 10)
        age_factor = RiskFactor(
            name="vendor_tenure",
            score=age_risk,
            weight=0.10,
            detail=f"Vendor registered {days_registered} days ago. Newer vendors carry higher risk.",
        )

        factors = [fraud_factor, gst_factor, txn_factor, amount_factor, age_factor]
        composite = sum(f.score * f.weight for f in factors)
        level = _score_to_level(composite)

        logger.info(f"🏢 Vendor risk: {vid} | score={composite:.1f} | level={level}")
        return {
            "vendor_id": vid,
            "risk_score": round(composite, 2),
            "risk_level": level,
            "icon": _level_color(level),
            "gst_compliance_score": round(gst_compliance, 2),
            "transaction_count": transaction_count,
            "flagged_transactions": flagged_txns,
            "avg_invoice_amount": round(avg_invoice_amount, 2),
            "factors": [
                {"name": f.name, "score": round(f.score, 2), "weight": f.weight, "detail": f.detail}
                for f in factors
            ],
            "computed_at": datetime.now(timezone.utc).isoformat(),
        }

    # ── Org risk ──────────────────────────────────────────────────────────────

    async def compute_org_risk(
        self,
        org_id: str,
        db: AsyncSession | None = None,
    ) -> dict[str, Any]:
        """
        Compute an overall organisation risk score by aggregating employee
        and vendor risk profiles with expense volume and fraud rate.

        Parameters
        ----------
        org_id : str
            Organisation UUID string.
        db : AsyncSession, optional
            Database session.

        Returns
        -------
        dict
            Organisation risk summary.
        """
        oid = str(org_id)

        total_expenses = _pseudo_int(oid, 20, lo=50, hi=5000)
        flagged_expenses = _pseudo_int(oid, 21, lo=0, hi=min(200, total_expenses))
        total_spend = _pseudo_score(oid, 22, lo=1_00_000.0, hi=5_00_00_000.0)
        high_risk_employees = _pseudo_int(oid, 23, lo=0, hi=20)
        high_risk_vendors = _pseudo_int(oid, 24, lo=0, hi=15)
        avg_gst_compliance = _pseudo_score(oid, 25, lo=50, hi=95)
        total_employees = _pseudo_int(oid, 26, lo=10, hi=500)
        total_vendors = _pseudo_int(oid, 27, lo=5, hi=100)

        fraud_rate = (flagged_expenses / max(total_expenses, 1)) * 100
        fraud_risk = RiskFactor(
            name="org_fraud_rate",
            score=min(fraud_rate * 5, 100),
            weight=0.30,
            detail=f"{flagged_expenses}/{total_expenses} expenses flagged ({fraud_rate:.1f}% fraud rate).",
        )

        employee_risk = RiskFactor(
            name="high_risk_employees",
            score=min((high_risk_employees / max(total_employees, 1)) * 1000, 100),
            weight=0.25,
            detail=f"{high_risk_employees}/{total_employees} employees classified HIGH/CRITICAL risk.",
        )

        vendor_risk = RiskFactor(
            name="high_risk_vendors",
            score=min((high_risk_vendors / max(total_vendors, 1)) * 1000, 100),
            weight=0.25,
            detail=f"{high_risk_vendors}/{total_vendors} vendors classified HIGH/CRITICAL risk.",
        )

        gst_risk = RiskFactor(
            name="gst_compliance",
            score=100 - avg_gst_compliance,
            weight=0.20,
            detail=f"Avg GST compliance score: {avg_gst_compliance:.1f}/100.",
        )

        factors = [fraud_risk, employee_risk, vendor_risk, gst_risk]
        composite = sum(f.score * f.weight for f in factors)
        level = _score_to_level(composite)

        logger.info(f"🏦 Org risk: {oid} | score={composite:.1f} | level={level}")
        return {
            "org_id": oid,
            "risk_score": round(composite, 2),
            "risk_level": level,
            "icon": _level_color(level),
            "total_expenses": total_expenses,
            "flagged_expenses": flagged_expenses,
            "total_spend_inr": round(total_spend, 2),
            "high_risk_employees": high_risk_employees,
            "high_risk_vendors": high_risk_vendors,
            "avg_gst_compliance": round(avg_gst_compliance, 2),
            "factors": [
                {"name": f.name, "score": round(f.score, 2), "weight": f.weight, "detail": f.detail}
                for f in factors
            ],
            "computed_at": datetime.now(timezone.utc).isoformat(),
        }

    # ── Full risk report ──────────────────────────────────────────────────────

    async def generate_risk_report(
        self,
        entity_type: str,
        entity_id: str,
        db: AsyncSession | None = None,
    ) -> dict[str, Any]:
        """
        Generate a complete risk report for an employee, vendor, or organisation.

        Parameters
        ----------
        entity_type : str
            One of ``"employee"``, ``"vendor"``, ``"org"``.
        entity_id : str
            UUID string of the entity.
        db : AsyncSession, optional
            Database session.

        Returns
        -------
        dict
            Full risk report with factor breakdown, summary, and recommendations.
        """
        entity_type = entity_type.lower().strip()

        if entity_type == "employee":
            data = await self.compute_employee_risk(entity_id, db)
        elif entity_type == "vendor":
            data = await self.compute_vendor_risk(entity_id, db)
        elif entity_type in ("org", "organization"):
            data = await self.compute_org_risk(entity_id, db)
        else:
            raise ValueError(f"Unknown entity_type: '{entity_type}'. Use 'employee', 'vendor', or 'org'.")

        score = data["risk_score"]
        level = data["risk_level"]
        icon = data["icon"]

        # Build recommendations based on level
        recommendations: list[str] = []
        if level == "CRITICAL":
            recommendations = [
                "🚨 Immediate escalation to CFO / Finance Controller required.",
                "Freeze all pending reimbursements pending investigation.",
                "Commission a formal internal audit within 48 hours.",
                "Engage compliance team to assess regulatory exposure.",
            ]
        elif level == "HIGH":
            recommendations = [
                "⚠️  Request senior manager approval for all new expenses.",
                "Conduct targeted audit of last 90 days of activity.",
                "Implement enhanced document verification for this entity.",
                "Review vendor contracts and employee expense policy acknowledgement.",
            ]
        elif level == "MEDIUM":
            recommendations = [
                "🟡 Schedule routine compliance review within 30 days.",
                "Enable automatic receipt verification for future submissions.",
                "Send policy reminder and best-practices guide.",
            ]
        else:
            recommendations = [
                "✅ Risk profile is within acceptable limits.",
                "Continue standard monitoring cadence.",
            ]

        summary = (
            f"{icon} {entity_type.title()} {entity_id[:8]}… has a composite risk score of "
            f"{score:.1f}/100, classified as {level}. "
            f"{'Immediate action required.' if level == 'CRITICAL' else 'Monitor closely.' if level == 'HIGH' else 'Routine monitoring recommended.' if level == 'MEDIUM' else 'No immediate concerns.'}"
        )

        report = {
            "entity_type": entity_type,
            "entity_id": entity_id,
            "risk_score": score,
            "risk_level": level,
            "summary": summary,
            "recommendations": recommendations,
            "detail": data,
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }

        logger.info(f"📋 Risk report generated | {entity_type}={entity_id} | {level} ({score:.1f})")
        return report

    # ── AI Insights ───────────────────────────────────────────────────────────

    async def get_risk_insights(
        self,
        org_id: str,
        db: AsyncSession | None = None,
    ) -> dict[str, Any]:
        """
        Generate 5–7 AI-style risk insights for an organisation.

        Parameters
        ----------
        org_id : str
            Organisation UUID string.
        db : AsyncSession, optional
            Database session.

        Returns
        -------
        dict
            ``{"insights": [...], "generated_at": ...}``
        """
        oid = str(org_id)
        org_data = await self.compute_org_risk(oid, db)
        score = org_data["risk_score"]
        level = org_data["risk_level"]
        flagged = org_data["flagged_expenses"]
        total = org_data["total_expenses"]
        fraud_rate = (flagged / max(total, 1)) * 100
        gst_score = org_data["avg_gst_compliance"]
        hr_emp = org_data["high_risk_employees"]
        hr_vendor = org_data["high_risk_vendors"]

        insights: list[dict[str, Any]] = [
            {
                "icon": "🔍",
                "category": "Fraud Detection",
                "insight": (
                    f"Your organisation's fraud rate is {fraud_rate:.1f}% "
                    f"({flagged} of {total} expenses flagged). "
                    + ("This exceeds the industry benchmark of 3%. Immediate review recommended."
                       if fraud_rate > 3 else
                       "This is within the industry benchmark of 3%. Well managed.")
                ),
                "priority": "HIGH" if fraud_rate > 3 else "LOW",
            },
            {
                "icon": "👤",
                "category": "Employee Risk",
                "insight": (
                    f"{hr_emp} employee(s) are classified as HIGH or CRITICAL risk. "
                    + ("Consider targeted audits and policy refreshers for these individuals."
                       if hr_emp > 0 else
                       "No high-risk employees detected. Maintain current oversight.")
                ),
                "priority": "HIGH" if hr_emp > 3 else "MEDIUM" if hr_emp > 0 else "LOW",
            },
            {
                "icon": "🏢",
                "category": "Vendor Risk",
                "insight": (
                    f"{hr_vendor} vendor(s) have elevated risk profiles. "
                    "Re-evaluate vendor contracts and consider enhanced verification for flagged vendors."
                ),
                "priority": "HIGH" if hr_vendor > 5 else "MEDIUM" if hr_vendor > 0 else "LOW",
            },
            {
                "icon": "📋",
                "category": "GST Compliance",
                "insight": (
                    f"Average vendor GST compliance score is {gst_score:.1f}/100. "
                    + ("Several vendors may have missed GSTR filings, putting your ITC claims at risk."
                       if gst_score < 70 else
                       "GST compliance is in good standing. Maintain quarterly vendor audits.")
                ),
                "priority": "HIGH" if gst_score < 60 else "MEDIUM" if gst_score < 75 else "LOW",
            },
            {
                "icon": "📈",
                "category": "Spending Trends",
                "insight": (
                    f"Total analysed spend: ₹{org_data['total_spend_inr']:,.0f}. "
                    "AI models detect expense patterns consistent with end-of-quarter submission surges. "
                    "Consider spreading approval deadlines to avoid bottlenecks."
                ),
                "priority": "MEDIUM",
            },
            {
                "icon": "🔐",
                "category": "Duplicate Prevention",
                "insight": (
                    "Enable automatic duplicate invoice detection at the point of submission "
                    "to reduce manual review workload by up to 40%. "
                    "Currently operating in post-submission detection mode."
                ),
                "priority": "MEDIUM",
            },
            {
                "icon": "⚡",
                "category": "Overall Risk",
                "insight": (
                    f"Composite organisational risk score: {score:.1f}/100 ({level}). "
                    + {
                        "CRITICAL": "Immediate governance intervention required.",
                        "HIGH": "Implement enhanced controls in the next 30 days.",
                        "MEDIUM": "Review and tighten expense policies within the quarter.",
                        "LOW": "Risk is well controlled. Continue current practices.",
                    }.get(level, "")
                ),
                "priority": level,
            },
        ]

        logger.info(f"💡 Generated {len(insights)} risk insights for org {oid}")
        return {
            "org_id": oid,
            "risk_score": score,
            "risk_level": level,
            "insights": insights,
            "total_insights": len(insights),
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }


# ─── Module-level singleton ───────────────────────────────────────────────────
risk_engine = RiskEngine()
