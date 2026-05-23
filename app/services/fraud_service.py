"""
Fraud detection service for the Smart Expense Auditor platform.

Uses intelligent rule-based mock logic to detect potential fraud in expense
receipts. Each check contributes a weighted score to a composite fraud score
(0.0 – 1.0). No external AI API calls are made.

Checks implemented
------------------
1. Duplicate invoice number detection
2. Amount anomaly vs. employee/category average
3. GSTIN format & checksum validation
4. Suspiciously round amount
5. Weekend / after-hours submission
6. Vendor risk profile
7. Image metadata anomaly (mock)
"""

from __future__ import annotations

import re
import uuid
from dataclasses import dataclass, field
from datetime import date, datetime, timezone
from typing import Any

from loguru import logger
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession


# ─── Constants ────────────────────────────────────────────────────────────────

GSTIN_REGEX = re.compile(
    r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$"
)

# Weighted contributions to composite fraud score
_WEIGHTS = {
    "duplicate_invoice": 0.35,
    "amount_anomaly": 0.20,
    "gstin_invalid": 0.15,
    "round_number": 0.08,
    "weekend_submission": 0.07,
    "vendor_risk": 0.10,
    "image_metadata": 0.05,
}

# Risk level thresholds
_RISK_THRESHOLDS = {
    "LOW": (0.0, 0.30),
    "MEDIUM": (0.30, 0.60),
    "HIGH": (0.60, 0.80),
    "CRITICAL": (0.80, 1.01),
}

_CATEGORY_BENCHMARKS: dict[str, float] = {
    "IT Services": 25_000.0,
    "Automotive": 12_000.0,
    "Fuel & Energy": 4_000.0,
    "Banking & Finance": 3_000.0,
    "Construction": 60_000.0,
    "E-Commerce": 5_000.0,
    "Food & Beverage": 1_500.0,
    "Travel & Accommodation": 15_000.0,
    "Travel & Transportation": 3_500.0,
    "Education & Training": 10_000.0,
    "Retail & Shopping": 4_000.0,
    "Healthcare & Medical": 5_500.0,
}


# ─── Result dataclass ─────────────────────────────────────────────────────────


@dataclass
class CheckResult:
    name: str
    triggered: bool
    score_contribution: float  # 0.0 – 1.0 contribution to composite
    detail: str


@dataclass
class FraudAnalysisResult:
    fraud_score: float
    risk_level: str
    checks: list[CheckResult]
    ai_reasoning: str
    recommendations: list[str]
    is_flagged: bool
    flagged_at: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "fraud_score": round(self.fraud_score, 4),
            "risk_level": self.risk_level,
            "is_flagged": self.is_flagged,
            "flagged_at": self.flagged_at,
            "ai_reasoning": self.ai_reasoning,
            "recommendations": self.recommendations,
            "checks": [
                {
                    "name": c.name,
                    "triggered": c.triggered,
                    "score_contribution": round(c.score_contribution, 4),
                    "detail": c.detail,
                }
                for c in self.checks
            ],
        }


# ─── FraudDetector ────────────────────────────────────────────────────────────


class FraudDetector:
    """
    Composite fraud analysis engine.

    Usage
    -----
    detector = FraudDetector()
    result = await detector.analyze_receipt(receipt_data, employee_history, vendor_history, db=db)
    """

    # ── Individual checks ─────────────────────────────────────────────────────

    async def _check_duplicate_invoice(
        self,
        invoice_number: str,
        org_id: str,
        db: AsyncSession,
    ) -> CheckResult:
        """Query the database for duplicate invoice numbers within the org."""
        try:
            # Dynamic import to avoid circular deps
            from app.models.expense import Expense  # type: ignore

            result = await db.execute(
                select(func.count()).where(
                    Expense.invoice_number == invoice_number,
                    Expense.organization_id == uuid.UUID(org_id),
                )
            )
            count: int = result.scalar_one()
            triggered = count > 0
            return CheckResult(
                name="duplicate_invoice",
                triggered=triggered,
                score_contribution=1.0 if triggered else 0.0,
                detail=(
                    f"Invoice '{invoice_number}' already exists {count} time(s) in this organization."
                    if triggered
                    else "Invoice number is unique."
                ),
            )
        except Exception as exc:
            logger.warning(f"⚠️  Duplicate invoice check failed: {exc}")
            return CheckResult(
                name="duplicate_invoice",
                triggered=False,
                score_contribution=0.0,
                detail="Could not verify uniqueness (DB error).",
            )

    def _check_amount_anomaly(
        self,
        amount: float,
        category: str,
        employee_avg: float | None,
    ) -> CheckResult:
        """Flag if amount is >3× employee average OR >3× category benchmark."""
        benchmark = _CATEGORY_BENCHMARKS.get(category, 10_000.0)
        reference = employee_avg if (employee_avg and employee_avg > 0) else benchmark

        ratio = amount / reference if reference > 0 else 1.0

        if ratio > 5.0:
            contribution = 1.0
            detail = f"Amount ₹{amount:,.2f} is {ratio:.1f}× the reference (₹{reference:,.2f}). Severe anomaly."
        elif ratio > 3.0:
            contribution = 0.7
            detail = f"Amount ₹{amount:,.2f} is {ratio:.1f}× the reference (₹{reference:,.2f}). Significant anomaly."
        elif ratio > 2.0:
            contribution = 0.4
            detail = f"Amount ₹{amount:,.2f} is {ratio:.1f}× the reference (₹{reference:,.2f}). Moderate anomaly."
        else:
            contribution = 0.0
            detail = f"Amount ₹{amount:,.2f} is within normal range ({ratio:.1f}× reference ₹{reference:,.2f})."

        return CheckResult(
            name="amount_anomaly",
            triggered=contribution > 0,
            score_contribution=contribution,
            detail=detail,
        )

    def _check_gstin_format(self, gstin: str) -> CheckResult:
        """Validate GSTIN against official regex and compute checksum."""
        if not gstin or not GSTIN_REGEX.match(gstin.upper()):
            return CheckResult(
                name="gstin_invalid",
                triggered=True,
                score_contribution=1.0,
                detail=f"GSTIN '{gstin}' does not match required format (state_code + PAN + 1Z + checksum).",
            )

        # Checksum validation
        char_set = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        values = {ch: i for i, ch in enumerate(char_set)}
        gstin_upper = gstin.upper()
        partial = gstin_upper[:-1]
        given_check = gstin_upper[-1]

        total = 0
        for idx, ch in enumerate(partial):
            val = values.get(ch, 0)
            product = val * (2 if idx % 2 == 1 else 1)
            total += product // 36 + product % 36
        expected_check = char_set[(36 - total % 36) % 36]

        if given_check != expected_check:
            return CheckResult(
                name="gstin_invalid",
                triggered=True,
                score_contribution=0.8,
                detail=f"GSTIN checksum mismatch: expected '{expected_check}', got '{given_check}'.",
            )

        return CheckResult(
            name="gstin_invalid",
            triggered=False,
            score_contribution=0.0,
            detail=f"GSTIN '{gstin}' is structurally valid.",
        )

    def _check_round_number(self, amount: float) -> CheckResult:
        """Flag if amount is suspiciously round (divisible by 100 or 500)."""
        is_round_100 = amount % 100 == 0
        is_round_500 = amount % 500 == 0
        is_round_1000 = amount % 1000 == 0

        if is_round_1000 and amount > 1000:
            contribution = 0.6
            detail = f"Amount ₹{amount:,.0f} is an exact multiple of ₹1,000. Possibly fabricated."
        elif is_round_500 and amount > 500:
            contribution = 0.4
            detail = f"Amount ₹{amount:,.0f} is an exact multiple of ₹500. Slightly suspicious."
        elif is_round_100 and amount > 100:
            contribution = 0.2
            detail = f"Amount ₹{amount:,.0f} is an exact multiple of ₹100. Low suspicion."
        else:
            contribution = 0.0
            detail = f"Amount ₹{amount:,.2f} does not appear artificially rounded."

        return CheckResult(
            name="round_number",
            triggered=contribution > 0,
            score_contribution=contribution,
            detail=detail,
        )

    def _check_weekend_submission(self, submission_date: date | str | None) -> CheckResult:
        """Flag expense submissions on weekends (Saturday=5, Sunday=6)."""
        if submission_date is None:
            return CheckResult(
                name="weekend_submission",
                triggered=False,
                score_contribution=0.0,
                detail="Submission date not available.",
            )

        if isinstance(submission_date, str):
            try:
                submission_date = date.fromisoformat(submission_date)
            except ValueError:
                return CheckResult(
                    name="weekend_submission",
                    triggered=False,
                    score_contribution=0.0,
                    detail="Could not parse submission date.",
                )

        weekday = submission_date.weekday()
        is_weekend = weekday >= 5
        day_name = submission_date.strftime("%A")

        return CheckResult(
            name="weekend_submission",
            triggered=is_weekend,
            score_contribution=0.7 if is_weekend else 0.0,
            detail=(
                f"Receipt submitted on {day_name} ({submission_date}). Weekend submissions are atypical."
                if is_weekend
                else f"Receipt submitted on {day_name} ({submission_date}). Normal business day."
            ),
        )

    def _check_vendor_risk(self, vendor_fraud_score: float) -> CheckResult:
        """Assess risk based on vendor's historical fraud score (0.0–1.0)."""
        if vendor_fraud_score >= 0.8:
            contribution = 1.0
            detail = f"Vendor has a critically high fraud history score ({vendor_fraud_score:.2f})."
        elif vendor_fraud_score >= 0.6:
            contribution = 0.7
            detail = f"Vendor has a high fraud history score ({vendor_fraud_score:.2f})."
        elif vendor_fraud_score >= 0.4:
            contribution = 0.4
            detail = f"Vendor has a moderate fraud history score ({vendor_fraud_score:.2f})."
        else:
            contribution = 0.0
            detail = f"Vendor fraud history score is low ({vendor_fraud_score:.2f})."

        return CheckResult(
            name="vendor_risk",
            triggered=contribution > 0.3,
            score_contribution=contribution,
            detail=detail,
        )

    def _check_image_metadata(self, file_bytes: bytes | None) -> CheckResult:
        """
        Mock image metadata check.

        In production this would inspect EXIF data for GPS location, device
        model, timestamps, and look for signs of Photoshop editing. Here we
        simulate based on file size heuristics.
        """
        if file_bytes is None or len(file_bytes) == 0:
            return CheckResult(
                name="image_metadata",
                triggered=True,
                score_contribution=0.5,
                detail="No file bytes provided. Cannot verify image authenticity.",
            )

        size_kb = len(file_bytes) / 1024

        # Very small files are suspicious (possibly cropped/manipulated)
        if size_kb < 5:
            return CheckResult(
                name="image_metadata",
                triggered=True,
                score_contribution=0.8,
                detail=f"Image is unusually small ({size_kb:.1f} KB). Possible manipulation detected.",
            )

        # Files without JPEG/PNG magic bytes (mock check)
        jpeg_magic = file_bytes[:3] == b"\xff\xd8\xff"
        png_magic = file_bytes[:4] == b"\x89PNG"
        pdf_magic = file_bytes[:4] == b"%PDF"

        if not (jpeg_magic or png_magic or pdf_magic):
            return CheckResult(
                name="image_metadata",
                triggered=True,
                score_contribution=0.6,
                detail="File header does not match declared type. Possible file spoofing.",
            )

        return CheckResult(
            name="image_metadata",
            triggered=False,
            score_contribution=0.0,
            detail=f"Image metadata appears normal ({size_kb:.1f} KB, valid file signature).",
        )

    # ── Score aggregation ─────────────────────────────────────────────────────

    @staticmethod
    def _compute_score(checks: list[CheckResult]) -> float:
        """Weighted sum of triggered check contributions, capped at 1.0."""
        score = 0.0
        for check in checks:
            weight = _WEIGHTS.get(check.name, 0.05)
            score += check.score_contribution * weight
        return min(round(score, 4), 1.0)

    @staticmethod
    def _score_to_risk_level(score: float) -> str:
        for level, (lo, hi) in _RISK_THRESHOLDS.items():
            if lo <= score < hi:
                return level
        return "LOW"

    @staticmethod
    def _build_reasoning(
        checks: list[CheckResult],
        score: float,
        risk_level: str,
        vendor_name: str,
        amount: float,
    ) -> str:
        triggered = [c for c in checks if c.triggered]
        if not triggered:
            return (
                f"Analysis of the ₹{amount:,.2f} receipt from {vendor_name} found no significant "
                f"fraud indicators. Composite score: {score:.2f} ({risk_level})."
            )

        issues = "; ".join(c.detail for c in triggered)
        return (
            f"The AI fraud engine analysed the ₹{amount:,.2f} receipt from {vendor_name} "
            f"and identified {len(triggered)} concern(s): {issues} "
            f"Composite fraud score: {score:.2f} — Risk Level: {risk_level}."
        )

    @staticmethod
    def _build_recommendations(checks: list[CheckResult], risk_level: str) -> list[str]:
        recs: list[str] = []
        triggered_names = {c.name for c in checks if c.triggered}

        if "duplicate_invoice" in triggered_names:
            recs.append("🔴 Immediately block duplicate invoice. Request original invoice from vendor.")
        if "amount_anomaly" in triggered_names:
            recs.append("🟠 Request manager approval and supporting documentation for unusually large expense.")
        if "gstin_invalid" in triggered_names:
            recs.append("🔴 Reject ITC claim. Contact vendor to provide a corrected GSTIN.")
        if "round_number" in triggered_names:
            recs.append("🟡 Request itemised bill to verify round-number total is genuine.")
        if "weekend_submission" in triggered_names:
            recs.append("🟡 Verify weekend expense was for a legitimate business purpose.")
        if "vendor_risk" in triggered_names:
            recs.append("🟠 Run enhanced due-diligence on vendor. Consider adding to watchlist.")
        if "image_metadata" in triggered_names:
            recs.append("🔴 Request physical original receipt. Possible document manipulation detected.")

        if risk_level == "CRITICAL":
            recs.insert(0, "🚨 CRITICAL: Escalate to Finance Controller and Legal team immediately.")
        elif risk_level == "HIGH":
            recs.insert(0, "⚠️  HIGH RISK: Require senior manager approval before reimbursement.")

        if not recs:
            recs.append("✅ No immediate action required. Continue standard processing.")

        return recs

    # ── Main API ──────────────────────────────────────────────────────────────

    async def analyze_receipt(
        self,
        receipt_data: dict[str, Any],
        employee_history: dict[str, Any],
        vendor_history: dict[str, Any],
        db: AsyncSession | None = None,
        org_id: str = "",
        submission_date: date | str | None = None,
        file_bytes: bytes | None = None,
    ) -> FraudAnalysisResult:
        """
        Run all fraud checks and return a composite FraudAnalysisResult.

        Parameters
        ----------
        receipt_data : dict
            Parsed receipt fields (from OCRService or direct input).
            Expected keys: vendor_name, gstin, invoice_number, total_amount, category.
        employee_history : dict
            Aggregated stats for the submitting employee.
            Expected keys: avg_expense_amount (float).
        vendor_history : dict
            Vendor profile data.
            Expected keys: fraud_score (float 0-1).
        db : AsyncSession, optional
            Database session for duplicate-invoice lookup.
        org_id : str
            Organisation UUID string for scoping DB queries.
        submission_date : date | str | None
            Date the expense was submitted (defaults to today).
        file_bytes : bytes | None
            Raw file bytes for metadata inspection.

        Returns
        -------
        FraudAnalysisResult
        """
        vendor_name = receipt_data.get("vendor_name", "Unknown Vendor")
        gstin = receipt_data.get("gstin", "")
        invoice_number = receipt_data.get("invoice_number", "")
        amount = float(receipt_data.get("total_amount", 0.0))
        category = receipt_data.get("category", "")
        employee_avg = float(employee_history.get("avg_expense_amount", 0.0))
        vendor_fraud_score = float(vendor_history.get("fraud_score", 0.0))

        if submission_date is None:
            submission_date = date.today()

        logger.info(f"🔍 Analysing receipt | vendor={vendor_name} | amount=₹{amount:,.2f}")

        # Run all checks
        checks: list[CheckResult] = []

        # 1. Duplicate invoice (needs DB)
        if db and org_id:
            checks.append(await self._check_duplicate_invoice(invoice_number, org_id, db))
        else:
            checks.append(CheckResult("duplicate_invoice", False, 0.0, "DB not provided — skipped."))

        # 2. Amount anomaly
        checks.append(self._check_amount_anomaly(amount, category, employee_avg))

        # 3. GSTIN format
        checks.append(self._check_gstin_format(gstin))

        # 4. Round number
        checks.append(self._check_round_number(amount))

        # 5. Weekend submission
        checks.append(self._check_weekend_submission(submission_date))

        # 6. Vendor risk
        checks.append(self._check_vendor_risk(vendor_fraud_score))

        # 7. Image metadata
        checks.append(self._check_image_metadata(file_bytes))

        # Aggregate
        fraud_score = self._compute_score(checks)
        risk_level = self._score_to_risk_level(fraud_score)
        is_flagged = fraud_score >= 0.30

        reasoning = self._build_reasoning(checks, fraud_score, risk_level, vendor_name, amount)
        recommendations = self._build_recommendations(checks, risk_level)

        flagged_at = datetime.now(timezone.utc).isoformat() if is_flagged else None

        result = FraudAnalysisResult(
            fraud_score=fraud_score,
            risk_level=risk_level,
            checks=checks,
            ai_reasoning=reasoning,
            recommendations=recommendations,
            is_flagged=is_flagged,
            flagged_at=flagged_at,
        )

        logger.info(
            f"✅ Fraud analysis done | score={fraud_score:.3f} | "
            f"risk={risk_level} | flagged={is_flagged}"
        )
        return result


# ─── Module-level singleton ───────────────────────────────────────────────────
fraud_detector = FraudDetector()
