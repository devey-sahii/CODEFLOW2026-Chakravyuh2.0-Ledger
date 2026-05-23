"""
Mock OCR service for the Smart Expense Auditor platform.

Simulates AI-based receipt parsing with realistic Indian vendor data,
GST numbers, invoice amounts, and auto-detected expense categories.
No external API calls — all data is generated deterministically from
file content hash to ensure reproducibility.
"""

from __future__ import annotations

import hashlib
import random
import time
from dataclasses import dataclass, field
from datetime import date, timedelta
from typing import Any

from loguru import logger


# ─── Static data pools ───────────────────────────────────────────────────────

_VENDORS = [
    {"name": "Infosys BPM Ltd", "category": "IT Services", "state_code": "29", "pan": "AABCI1681M"},
    {"name": "Tata Consultancy Services", "category": "IT Services", "state_code": "27", "pan": "AABCT1332L"},
    {"name": "Wipro Technologies", "category": "IT Services", "state_code": "29", "pan": "AABCW0303M"},
    {"name": "HCL Technologies Ltd", "category": "IT Services", "state_code": "06", "pan": "AABCH0474F"},
    {"name": "Mahindra & Mahindra Ltd", "category": "Automotive", "state_code": "27", "pan": "AABCM4191P"},
    {"name": "Reliance Industries Ltd", "category": "Fuel & Energy", "state_code": "27", "pan": "AAACR5055K"},
    {"name": "HDFC Bank Ltd", "category": "Banking & Finance", "state_code": "27", "pan": "AADCH0227C"},
    {"name": "Indian Oil Corporation", "category": "Fuel & Energy", "state_code": "07", "pan": "AAACI1681L"},
    {"name": "Larsen & Toubro Ltd", "category": "Construction", "state_code": "27", "pan": "AAACL0579C"},
    {"name": "Maruti Suzuki India Ltd", "category": "Automotive", "state_code": "06", "pan": "AAACM3372P"},
    {"name": "Flipkart Internet Pvt Ltd", "category": "E-Commerce", "state_code": "29", "pan": "AABCF7609A"},
    {"name": "Amazon Seller Services Pvt Ltd", "category": "E-Commerce", "state_code": "29", "pan": "AABCA1234B"},
    {"name": "Zomato Ltd", "category": "Food & Beverage", "state_code": "07", "pan": "AABCZ0741D"},
    {"name": "Swiggy (Bundl Technologies)", "category": "Food & Beverage", "state_code": "29", "pan": "AABCB2341F"},
    {"name": "MakeMyTrip India Pvt Ltd", "category": "Travel & Accommodation", "state_code": "07", "pan": "AABCM1234G"},
    {"name": "Ola Electric Mobility", "category": "Travel & Transportation", "state_code": "29", "pan": "AABCO5678H"},
    {"name": "Oyo Rooms (Oravel Stays)", "category": "Travel & Accommodation", "state_code": "07", "pan": "AAACO4321J"},
    {"name": "Byju's (Think & Learn Pvt Ltd)", "category": "Education & Training", "state_code": "29", "pan": "AABCT7890K"},
    {"name": "Myntra Designs Pvt Ltd", "category": "Retail & Shopping", "state_code": "29", "pan": "AABCM4567L"},
    {"name": "Nykaa (FSN E-Commerce)", "category": "Retail & Shopping", "state_code": "27", "pan": "AABCF9012M"},
    {"name": "ICICI Bank Ltd", "category": "Banking & Finance", "state_code": "27", "pan": "AAACI1234N"},
    {"name": "Axis Bank Ltd", "category": "Banking & Finance", "state_code": "27", "pan": "AAACA5678P"},
    {"name": "Bajaj Auto Ltd", "category": "Automotive", "state_code": "27", "pan": "AAACB3456Q"},
    {"name": "Sun Pharmaceutical Industries", "category": "Healthcare & Medical", "state_code": "24", "pan": "AAACS4321R"},
    {"name": "Dr. Reddy's Laboratories", "category": "Healthcare & Medical", "state_code": "36", "pan": "AAACD2345S"},
]

_GST_RATES = [0.05, 0.12, 0.18, 0.28]
_GST_RATE_WEIGHTS = [0.10, 0.20, 0.50, 0.20]  # 18% most common

_CATEGORY_RANGES: dict[str, tuple[float, float]] = {
    "IT Services": (5_000.0, 2_00_000.0),
    "Automotive": (500.0, 80_000.0),
    "Fuel & Energy": (500.0, 15_000.0),
    "Banking & Finance": (200.0, 10_000.0),
    "Construction": (10_000.0, 2_00_000.0),
    "E-Commerce": (300.0, 50_000.0),
    "Food & Beverage": (150.0, 5_000.0),
    "Travel & Accommodation": (1_000.0, 75_000.0),
    "Travel & Transportation": (200.0, 20_000.0),
    "Education & Training": (2_000.0, 50_000.0),
    "Retail & Shopping": (300.0, 30_000.0),
    "Healthcare & Medical": (500.0, 25_000.0),
}

_LINE_ITEM_NAMES: dict[str, list[str]] = {
    "IT Services": ["Cloud Hosting", "Software License", "Technical Support", "API Credits", "SaaS Subscription"],
    "Automotive": ["Vehicle Service", "Spare Parts", "Insurance Premium", "Fuel", "Tyre Replacement"],
    "Fuel & Energy": ["Petrol", "Diesel", "CNG", "LPG Cylinder", "Electricity Bill"],
    "Food & Beverage": ["Business Lunch", "Team Dinner", "Coffee & Snacks", "Catering Service", "Client Meal"],
    "Travel & Accommodation": ["Hotel Stay", "Room Charges", "Conference Room Booking", "Airport Transfer", "Flight Ticket"],
    "Travel & Transportation": ["Cab Booking", "Intercity Bus", "Train Ticket", "Parking Charges", "Toll Fees"],
    "Education & Training": ["Workshop Fee", "Online Course", "Certification Exam", "Training Material", "Seminar Registration"],
    "Retail & Shopping": ["Office Supplies", "Stationery", "Electronics", "Furniture", "Uniform"],
    "Healthcare & Medical": ["Medical Consultation", "Lab Tests", "Medicine", "Health Checkup", "Physiotherapy"],
    "Banking & Finance": ["Processing Fee", "Annual Charges", "Demand Draft", "Forex Conversion", "Insurance Premium"],
    "E-Commerce": ["Product Purchase", "Express Delivery", "Extended Warranty", "Gift Packaging", "Installation Service"],
    "Construction": ["Raw Materials", "Labour Charges", "Equipment Rental", "Site Survey", "Safety Equipment"],
}


# ─── Data classes ─────────────────────────────────────────────────────────────


@dataclass
class LineItem:
    description: str
    quantity: int
    unit_price: float
    total: float


@dataclass
class OCRResult:
    vendor_name: str
    gstin: str
    invoice_number: str
    invoice_date: str
    items: list[dict[str, Any]]
    subtotal: float
    tax_rate: float
    tax_amount: float
    total_amount: float
    currency: str
    category: str
    processing_time_ms: int
    confidence_score: float
    raw_text_preview: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "vendor_name": self.vendor_name,
            "gstin": self.gstin,
            "invoice_number": self.invoice_number,
            "invoice_date": self.invoice_date,
            "items": self.items,
            "subtotal": round(self.subtotal, 2),
            "tax_rate": self.tax_rate,
            "tax_amount": round(self.tax_amount, 2),
            "total_amount": round(self.total_amount, 2),
            "currency": self.currency,
            "category": self.category,
            "processing_time_ms": self.processing_time_ms,
            "confidence_score": self.confidence_score,
            "raw_text_preview": self.raw_text_preview,
        }


# ─── OCR Service ──────────────────────────────────────────────────────────────


class OCRService:
    """
    Mock OCR engine that extracts realistic receipt/invoice data from
    uploaded file bytes.

    Determinism
    -----------
    The vendor, amounts, and dates are seeded from the SHA-256 hash of the
    file bytes, ensuring identical results for the same file upload.
    """

    # ── GSTIN helpers ────────────────────────────────────────────────────────

    @staticmethod
    def _compute_gstin_checksum(gstin_without_check: str) -> str:
        """
        Compute the GSTN Luhn-like checksum digit.

        The algorithm maps each character to a value in the GSTN character set,
        alternates multipliers, sums, and returns the remainder character.
        """
        char_set = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        values = {ch: i for i, ch in enumerate(char_set)}
        total = 0
        for idx, ch in enumerate(gstin_without_check):
            val = values.get(ch, 0)
            product = val * (2 if idx % 2 == 1 else 1)
            total += product // 36 + product % 36
        remainder = total % 36
        return char_set[(36 - remainder) % 36]

    @classmethod
    def _build_gstin(cls, state_code: str, pan: str) -> str:
        """Construct a valid GSTIN: {state_code}{PAN}1Z{checksum}."""
        partial = f"{state_code}{pan}1Z"
        checksum = cls._compute_gstin_checksum(partial)
        return f"{partial}{checksum}"

    # ── Invoice helpers ──────────────────────────────────────────────────────

    @staticmethod
    def _generate_invoice_number(rng: random.Random, vendor_name: str) -> str:
        prefix = "".join(w[0] for w in vendor_name.split()[:3]).upper()
        year = date.today().year
        seq = rng.randint(10000, 99999)
        return f"{prefix}/{year}-{year % 100 + 1}/{seq:05d}"

    @staticmethod
    def _generate_invoice_date(rng: random.Random) -> str:
        days_back = rng.randint(0, 90)
        inv_date = date.today() - timedelta(days=days_back)
        return inv_date.strftime("%Y-%m-%d")

    # ── Line items ───────────────────────────────────────────────────────────

    @staticmethod
    def _generate_line_items(
        rng: random.Random,
        category: str,
        target_subtotal: float,
    ) -> tuple[list[dict[str, Any]], float]:
        item_names = _LINE_ITEM_NAMES.get(category, ["Service Charge", "Consulting Fee"])
        num_items = rng.randint(1, min(4, len(item_names)))
        selected = rng.sample(item_names, num_items)

        items: list[dict[str, Any]] = []
        total_built = 0.0

        for i, desc in enumerate(selected):
            qty = rng.randint(1, 5)
            if i == len(selected) - 1:
                # Last item: make total add up to target
                remaining = max(target_subtotal - total_built, 10.0)
                unit_price = round(remaining / qty, 2)
            else:
                unit_price = round(rng.uniform(target_subtotal * 0.10, target_subtotal * 0.50) / qty, 2)

            line_total = round(unit_price * qty, 2)
            total_built += line_total
            items.append({
                "description": desc,
                "quantity": qty,
                "unit_price": unit_price,
                "total": line_total,
                "hsn_sac": f"{rng.randint(1000, 9999)}",
            })

        return items, round(total_built, 2)

    # ── Raw text preview ─────────────────────────────────────────────────────

    @staticmethod
    def _build_raw_preview(vendor: dict, gstin: str, inv_no: str, inv_date: str, total: float) -> str:
        return (
            f"TAX INVOICE\n"
            f"{vendor['name']}\n"
            f"GSTIN: {gstin}\n"
            f"Invoice No: {inv_no}\n"
            f"Date: {inv_date}\n"
            f"Amount Payable: INR {total:,.2f}\n"
            f"[Extracted by Mock OCR Engine v3.1]"
        )

    # ── Main extract method ──────────────────────────────────────────────────

    async def extract_receipt_data(
        self,
        file_bytes: bytes,
        file_type: str = "image/jpeg",
    ) -> dict[str, Any]:
        """
        Extract structured receipt data from raw file bytes.

        The output is deterministic: the same file always produces the same
        vendor, amounts, and dates. Processing time is simulated.

        Parameters
        ----------
        file_bytes : bytes
            Raw bytes of the uploaded receipt/invoice image or PDF.
        file_type : str
            MIME type of the uploaded file (e.g. ``"image/jpeg"``).

        Returns
        -------
        dict
            Parsed receipt fields including vendor, GSTIN, line items,
            amounts, and metadata.
        """
        t_start = time.monotonic()

        # Seed RNG from file hash for determinism
        file_hash = hashlib.sha256(file_bytes).hexdigest()
        seed = int(file_hash[:16], 16)
        rng = random.Random(seed)

        # Pick vendor
        vendor = rng.choice(_VENDORS)
        category = vendor["category"]
        gstin = self._build_gstin(vendor["state_code"], vendor["pan"])

        # Amounts
        lo, hi = _CATEGORY_RANGES.get(category, (500.0, 50_000.0))
        # 5% chance of suspiciously round number
        if rng.random() < 0.05:
            subtotal = float(round(rng.uniform(lo, hi) / 100) * 100)
        else:
            subtotal = round(rng.uniform(lo, hi), 2)

        gst_rate = rng.choices(_GST_RATES, weights=_GST_RATE_WEIGHTS, k=1)[0]
        tax_amount = round(subtotal * gst_rate, 2)
        total_amount = round(subtotal + tax_amount, 2)

        # Invoice metadata
        inv_no = self._generate_invoice_number(rng, vendor["name"])
        inv_date = self._generate_invoice_date(rng)
        items, _ = self._generate_line_items(rng, category, subtotal)

        # Confidence: lower for PDFs (mock), higher for clear images
        confidence = round(rng.uniform(0.82, 0.99), 3)

        # Simulate processing delay
        t_elapsed_ms = int((time.monotonic() - t_start) * 1000) + rng.randint(120, 850)

        result = OCRResult(
            vendor_name=vendor["name"],
            gstin=gstin,
            invoice_number=inv_no,
            invoice_date=inv_date,
            items=items,
            subtotal=subtotal,
            tax_rate=gst_rate,
            tax_amount=tax_amount,
            total_amount=total_amount,
            currency="INR",
            category=category,
            processing_time_ms=t_elapsed_ms,
            confidence_score=confidence,
            raw_text_preview=self._build_raw_preview(vendor, gstin, inv_no, inv_date, total_amount),
        )

        logger.info(
            f"📄 OCR complete | vendor={vendor['name']} | "
            f"total=₹{total_amount:,.2f} | confidence={confidence} | {t_elapsed_ms}ms"
        )
        return result.to_dict()


# ─── Module-level singleton ───────────────────────────────────────────────────
ocr_service = OCRService()
