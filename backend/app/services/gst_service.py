"""
GST validation and compliance service for the Smart Expense Auditor platform.

Provides GSTIN format validation, Input Tax Credit (ITC) eligibility checks,
vendor compliance scoring, and filing history — all via intelligent mock data.
No external GST Network (GSTN) API calls are made.
"""

from __future__ import annotations

import re
import uuid
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from typing import Any

from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


# ─── GSTIN regex ─────────────────────────────────────────────────────────────

GSTIN_REGEX = re.compile(
    r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$"
)

# State code → State name mapping
_STATE_CODES: dict[str, str] = {
    "01": "Jammu & Kashmir", "02": "Himachal Pradesh", "03": "Punjab",
    "04": "Chandigarh", "05": "Uttarakhand", "06": "Haryana",
    "07": "Delhi", "08": "Rajasthan", "09": "Uttar Pradesh",
    "10": "Bihar", "11": "Sikkim", "12": "Arunachal Pradesh",
    "13": "Nagaland", "14": "Manipur", "15": "Mizoram",
    "16": "Tripura", "17": "Meghalaya", "18": "Assam",
    "19": "West Bengal", "20": "Jharkhand", "21": "Odisha",
    "22": "Chhattisgarh", "23": "Madhya Pradesh", "24": "Gujarat",
    "26": "Dadra & Nagar Haveli and Daman & Diu", "27": "Maharashtra",
    "28": "Andhra Pradesh", "29": "Karnataka", "30": "Goa",
    "31": "Lakshadweep", "32": "Kerala", "33": "Tamil Nadu",
    "34": "Puducherry", "35": "Andaman & Nicobar Islands",
    "36": "Telangana", "37": "Andhra Pradesh (new)",
}

# Mock business names pool (deterministic from GSTIN hash)
_BUSINESS_NAMES = [
    "Apex Solutions Pvt Ltd", "Vertex Enterprises", "Pinnacle Technologies",
    "Horizon Consulting LLP", "Summit Industries Ltd", "Nexus Digital Pvt Ltd",
    "Orbital Commerce", "Zenith Manufacturing Co", "Alpha Traders",
    "Global Link Services", "Pioneer Exports Pvt Ltd", "Radiant Technologies",
    "Stellar Systems Pvt Ltd", "Crest Innovations", "Prime Ventures LLP",
]

_FILING_STATUSES = ["Regular", "Quarterly", "Composition", "Non-Filer", "Cancelled"]

_ITC_INELIGIBLE_REASONS = [
    "Vendor is a composition scheme taxpayer — ITC not allowed.",
    "Vendor GSTIN is cancelled — transactions post-cancellation are ineligible.",
    "Invoice predates GST registration of vendor.",
    "Blocked credit under Section 17(5) of CGST Act.",
]

_ITC_ELIGIBLE_REASONS = [
    "Vendor is a regular GST taxpayer with active GSTIN.",
    "Invoice is within the eligible input tax credit period.",
    "Vendor has filed GSTR-1 for the relevant period.",
]


# ─── Data classes ─────────────────────────────────────────────────────────────


@dataclass
class GSTINInfo:
    gstin: str
    is_valid: bool
    business_name: str
    state_code: str
    state_name: str
    registration_date: str
    compliance_score: int          # 0–100
    filing_status: str
    pan: str
    taxpayer_type: str
    last_updated: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "gstin": self.gstin,
            "is_valid": self.is_valid,
            "business_name": self.business_name,
            "state_code": self.state_code,
            "state_name": self.state_name,
            "registration_date": self.registration_date,
            "compliance_score": self.compliance_score,
            "filing_status": self.filing_status,
            "pan": self.pan,
            "taxpayer_type": self.taxpayer_type,
            "last_updated": self.last_updated,
        }


@dataclass
class ITCEligibility:
    is_eligible: bool
    reason: str
    eligible_amount: float
    cgst: float
    sgst: float
    igst: float
    total_itc: float

    def to_dict(self) -> dict[str, Any]:
        return {
            "is_eligible": self.is_eligible,
            "reason": self.reason,
            "eligible_amount": round(self.eligible_amount, 2),
            "cgst": round(self.cgst, 2),
            "sgst": round(self.sgst, 2),
            "igst": round(self.igst, 2),
            "total_itc": round(self.total_itc, 2),
        }


@dataclass
class FilingMonth:
    month: str
    gstr1_filed: bool
    gstr3b_filed: bool
    taxable_turnover: float
    tax_paid: float

    def to_dict(self) -> dict[str, Any]:
        return {
            "month": self.month,
            "gstr1_filed": self.gstr1_filed,
            "gstr3b_filed": self.gstr3b_filed,
            "taxable_turnover": round(self.taxable_turnover, 2),
            "tax_paid": round(self.tax_paid, 2),
        }


# ─── GSTService ───────────────────────────────────────────────────────────────


class GSTService:
    """
    Intelligent mock GST compliance service.

    All returned data is deterministic — same GSTIN always returns the same
    business name, compliance score, and filing history.
    """

    # ── GSTIN checksum ───────────────────────────────────────────────────────

    @staticmethod
    def _validate_checksum(gstin: str) -> bool:
        char_set = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        values = {ch: i for i, ch in enumerate(char_set)}
        partial = gstin[:-1]
        given = gstin[-1]
        total = 0
        for idx, ch in enumerate(partial):
            val = values.get(ch, 0)
            product = val * (2 if idx % 2 == 1 else 1)
            total += product // 36 + product % 36
        expected = char_set[(36 - total % 36) % 36]
        return given == expected

    # ── Deterministic seeding ────────────────────────────────────────────────

    @staticmethod
    def _seed_from_gstin(gstin: str) -> int:
        """Generate an integer seed from GSTIN characters."""
        return sum(ord(c) * (i + 1) for i, c in enumerate(gstin))

    def _pick(self, pool: list, gstin: str, offset: int = 0):
        seed = (self._seed_from_gstin(gstin) + offset) % len(pool)
        return pool[seed]

    def _compliance_score(self, gstin: str) -> int:
        """Return consistent compliance score 30–100 for given GSTIN."""
        base = self._seed_from_gstin(gstin) % 71  # 0–70
        return base + 30  # 30–100

    def _registration_date(self, gstin: str) -> str:
        seed = self._seed_from_gstin(gstin)
        days = seed % (365 * 8)  # up to 8 years ago
        reg_date = date.today() - timedelta(days=days + 30)
        return reg_date.strftime("%Y-%m-%d")

    # ── Public API ───────────────────────────────────────────────────────────

    async def validate_gstin(self, gstin: str) -> GSTINInfo:
        """
        Validate a GSTIN and return mock GSTN-portal business details.

        Parameters
        ----------
        gstin : str
            15-character GSTIN to validate.

        Returns
        -------
        GSTINInfo
            Validation result with business metadata.
        """
        gstin = gstin.upper().strip()

        if not GSTIN_REGEX.match(gstin):
            logger.warning(f"❌ GSTIN format invalid: {gstin}")
            return GSTINInfo(
                gstin=gstin,
                is_valid=False,
                business_name="",
                state_code="",
                state_name="",
                registration_date="",
                compliance_score=0,
                filing_status="Invalid",
                pan="",
                taxpayer_type="",
                last_updated=date.today().isoformat(),
            )

        checksum_ok = self._validate_checksum(gstin)
        state_code = gstin[:2]
        pan = gstin[2:12]
        compliance_score = self._compliance_score(gstin)
        filing_status = self._pick(_FILING_STATUSES[:3 if checksum_ok else 5], gstin, offset=7)
        business_name = self._pick(_BUSINESS_NAMES, gstin, offset=3)
        reg_date = self._registration_date(gstin)
        taxpayer_type = "Regular" if compliance_score >= 60 else "Composition"

        info = GSTINInfo(
            gstin=gstin,
            is_valid=checksum_ok,
            business_name=business_name,
            state_code=state_code,
            state_name=_STATE_CODES.get(state_code, "Unknown State"),
            registration_date=reg_date,
            compliance_score=compliance_score,
            filing_status=filing_status,
            pan=pan,
            taxpayer_type=taxpayer_type,
            last_updated=date.today().isoformat(),
        )

        logger.info(
            f"✅ GSTIN validated: {gstin} | valid={checksum_ok} | "
            f"score={compliance_score} | business={business_name}"
        )
        return info

    async def check_itc_eligibility(
        self,
        gstin: str,
        invoice_data: dict[str, Any],
    ) -> ITCEligibility:
        """
        Determine whether Input Tax Credit can be claimed for this invoice.

        Parameters
        ----------
        gstin : str
            Vendor GSTIN.
        invoice_data : dict
            Invoice data including tax_amount, tax_rate, invoice_date.

        Returns
        -------
        ITCEligibility
        """
        gstin_info = await self.validate_gstin(gstin)
        tax_amount = float(invoice_data.get("tax_amount", 0.0))
        total_amount = float(invoice_data.get("total_amount", 0.0))
        subtotal = float(invoice_data.get("subtotal", total_amount - tax_amount))
        invoice_date_str: str = invoice_data.get("invoice_date", date.today().isoformat())

        # Parse invoice date
        try:
            invoice_date = date.fromisoformat(invoice_date_str)
        except ValueError:
            invoice_date = date.today()

        # Eligibility rules
        if not gstin_info.is_valid:
            return ITCEligibility(
                is_eligible=False,
                reason="Vendor GSTIN is invalid — ITC cannot be claimed.",
                eligible_amount=0.0,
                cgst=0.0,
                sgst=0.0,
                igst=0.0,
                total_itc=0.0,
            )

        if gstin_info.filing_status == "Cancelled":
            return ITCEligibility(
                is_eligible=False,
                reason=_ITC_INELIGIBLE_REASONS[1],
                eligible_amount=0.0,
                cgst=0.0,
                sgst=0.0,
                igst=0.0,
                total_itc=0.0,
            )

        if gstin_info.taxpayer_type == "Composition":
            return ITCEligibility(
                is_eligible=False,
                reason=_ITC_INELIGIBLE_REASONS[0],
                eligible_amount=0.0,
                cgst=0.0,
                sgst=0.0,
                igst=0.0,
                total_itc=0.0,
            )

        # Invoice too old (>3 years) — Section 16(4)
        cutoff = date.today() - timedelta(days=3 * 365)
        if invoice_date < cutoff:
            return ITCEligibility(
                is_eligible=False,
                reason=_ITC_INELIGIBLE_REASONS[2],
                eligible_amount=0.0,
                cgst=0.0,
                sgst=0.0,
                igst=0.0,
                total_itc=0.0,
            )

        # Eligible — split into CGST + SGST (intra-state) or IGST (inter-state)
        state_code_vendor = gstin[:2]
        # Use fixed org state as Maharashtra (27) for mock
        org_state = "27"
        is_inter_state = state_code_vendor != org_state

        if is_inter_state:
            igst = tax_amount
            cgst = sgst = 0.0
        else:
            igst = 0.0
            cgst = round(tax_amount / 2, 2)
            sgst = round(tax_amount / 2, 2)

        reason = self._pick(_ITC_ELIGIBLE_REASONS, gstin, offset=11)

        return ITCEligibility(
            is_eligible=True,
            reason=reason,
            eligible_amount=subtotal,
            cgst=cgst,
            sgst=sgst,
            igst=igst,
            total_itc=round(cgst + sgst + igst, 2),
        )

    async def get_compliance_score(
        self,
        org_id: str,
        db: AsyncSession | None = None,
    ) -> dict[str, Any]:
        """
        Compute aggregate GST compliance score for an organisation.

        Iterates through all vendor GSTINs associated with recent expenses
        and averages their individual compliance scores.

        Parameters
        ----------
        org_id : str
            Organisation UUID.
        db : AsyncSession, optional
            Database session.

        Returns
        -------
        dict
            Compliance summary with overall score and breakdown.
        """
        # Mock: generate deterministic per-org compliance data
        seed_val = sum(ord(c) for c in org_id)
        total_vendors = (seed_val % 20) + 10  # 10–29 vendors
        scores = [
            ((seed_val * (i + 1) * 7) % 71) + 30
            for i in range(total_vendors)
        ]
        avg_score = round(sum(scores) / len(scores), 1)

        compliant_count = sum(1 for s in scores if s >= 70)
        at_risk_count = sum(1 for s in scores if 40 <= s < 70)
        non_compliant_count = sum(1 for s in scores if s < 40)

        grade = (
            "A+" if avg_score >= 90 else
            "A" if avg_score >= 80 else
            "B" if avg_score >= 70 else
            "C" if avg_score >= 60 else
            "D"
        )

        logger.info(f"📊 GST compliance score for org {org_id}: {avg_score} ({grade})")
        return {
            "org_id": org_id,
            "overall_score": avg_score,
            "grade": grade,
            "total_vendors_analysed": total_vendors,
            "compliant_vendors": compliant_count,
            "at_risk_vendors": at_risk_count,
            "non_compliant_vendors": non_compliant_count,
            "calculated_at": date.today().isoformat(),
            "recommendations": [
                f"Review {non_compliant_count} non-compliant vendor(s) and request updated GSTINs.",
                "Ensure all invoices above ₹50,000 have valid GSTINs before processing.",
                "Schedule quarterly GST compliance audit for all active vendors.",
            ] if non_compliant_count > 0 else [
                "All vendor GSTINs are compliant. Continue regular monitoring.",
            ],
        }

    async def get_vendor_gst_history(self, gstin: str) -> dict[str, Any]:
        """
        Return 12 months of mock GST filing history for a vendor.

        Parameters
        ----------
        gstin : str
            Vendor GSTIN.

        Returns
        -------
        dict
            Filing history with monthly breakdown.
        """
        gstin_upper = gstin.upper().strip()
        seed = self._seed_from_gstin(gstin_upper)

        months: list[dict[str, Any]] = []
        today = date.today()

        for i in range(12):
            month_date = today.replace(day=1) - timedelta(days=30 * i)
            month_label = month_date.strftime("%b %Y")

            # Deterministic filing decisions
            month_seed = (seed + i * 13) % 100
            gstr1_filed = month_seed > 15   # 85% filing rate
            gstr3b_filed = month_seed > 20  # 80% filing rate

            turnover = round(((seed * (i + 1) * 3) % 900_000) + 50_000, 2)
            tax_rate = 0.18
            tax_paid = round(turnover * tax_rate, 2) if gstr3b_filed else 0.0

            months.append(
                FilingMonth(
                    month=month_label,
                    gstr1_filed=gstr1_filed,
                    gstr3b_filed=gstr3b_filed,
                    taxable_turnover=turnover,
                    tax_paid=tax_paid,
                ).to_dict()
            )

        total_months = len(months)
        filed_months = sum(1 for m in months if m["gstr3b_filed"])
        filing_rate = round(filed_months / total_months * 100, 1)

        logger.info(f"📋 GST filing history for {gstin}: {filing_rate}% compliance over 12 months")
        return {
            "gstin": gstin_upper,
            "period": "Last 12 months",
            "filing_rate_percent": filing_rate,
            "total_months": total_months,
            "filed_months": filed_months,
            "missed_months": total_months - filed_months,
            "monthly_data": months,
        }


# ─── Module-level singleton ───────────────────────────────────────────────────
gst_service = GSTService()
