"""
Gemini OCR + Fraud Detection service for the LEDGER platform.

Phase 1 ── Document Gate
  Sends the image to Gemini and asks: "Is this a legitimate invoice/receipt?"
  If the answer is NO, raises NotAnInvoiceError immediately — the upload
  is hard-rejected before any data is extracted.

Phase 2 ── Extraction + Fraud Analysis
  Full structured extraction of all invoice fields AND a deep fraud-score
  computed entirely by Gemini, not by a random number generator.
  Fraud signals, tampering indicators, and a definitive is_fraud boolean
  are all returned and honoured by the upload endpoint.
"""

from __future__ import annotations

import base64
import json
import re
import time
from datetime import date
from typing import Any

import httpx
from loguru import logger

from app.core.config import settings


# ─── Custom exception ─────────────────────────────────────────────────────────

class NotAnInvoiceError(Exception):
    """Raised when the uploaded image is not a valid invoice or receipt."""
    def __init__(self, reason: str = "Not an invoice"):
        self.reason = reason
        super().__init__(reason)


class FraudulentInvoiceError(Exception):
    """Raised when Gemini conclusively identifies the document as fraudulent."""
    def __init__(self, reason: str, fraud_score: float, signals: list[str]):
        self.reason = reason
        self.fraud_score = fraud_score
        self.signals = signals
        super().__init__(reason)


# ─── Gemini API Constants ──────────────────────────────────────────────────────

GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta"
GEMINI_MODEL = "gemini-2.0-flash-lite"
GEMINI_TIMEOUT_SECS = 90


# ─── Phase 1: Document Gate Prompt ────────────────────────────────────────────

GATE_PROMPT = """You are a strict document classifier for a financial auditing system.

Your ONLY job right now is to decide: Is this image a genuine business invoice, tax invoice, receipt, bill, or similar financial document?

Answer with ONLY valid JSON, no markdown, no explanation:
{
  "is_invoice": true or false,
  "document_type": "TAX_INVOICE | RECEIPT | BILL | PROFORMA | CREDIT_NOTE | NOT_AN_INVOICE | UNCLEAR",
  "confidence": 0.0 to 1.0,
  "rejection_reason": "Reason if not an invoice, else null"
}

Rules:
- Return is_invoice: true ONLY if you can clearly see a business financial document (invoice, bill, receipt, GST invoice, etc.)
- Return is_invoice: false for: selfies, random photos, screenshots of unrelated content, memes, blank paper, handwritten personal notes with no financial context, or anything that is clearly NOT a financial document.
- If the image is blurry/unclear but appears to be an invoice, return is_invoice: true with low confidence.
- Be STRICT. When in doubt about non-financial documents, return false.
"""

# ─── Phase 2: Full Extraction + Fraud Analysis Prompt ────────────────────────

EXTRACTION_PROMPT = """You are an expert Indian GST invoice forensic auditor integrated into LEDGER, an enterprise expense auditing platform.

Analyze this invoice/receipt with TWO goals:
1. Extract all invoice data accurately.
2. Perform a comprehensive FRAUD ANALYSIS and assign a real fraud score.

Return ONLY valid JSON with no markdown, no code blocks — just raw JSON:

{
  "vendor_name": "Full legal company name as printed",
  "vendor_address": "Full address if visible, else null",
  "gstin": "15-character GSTIN if visible, else null",
  "pan": "PAN number if visible, else null",
  "invoice_number": "Invoice/receipt number",
  "invoice_date": "Date in YYYY-MM-DD format",
  "due_date": "Due date in YYYY-MM-DD format if present, else null",
  "po_number": "Purchase order number if present, else null",
  "items": [
    {
      "description": "Line item description",
      "hsn_sac": "HSN/SAC code if visible, else null",
      "quantity": 1,
      "unit": "nos",
      "unit_price": 0.0,
      "discount": 0.0,
      "taxable_value": 0.0,
      "cgst_rate": 0.0,
      "sgst_rate": 0.0,
      "igst_rate": 0.0,
      "cgst_amount": 0.0,
      "sgst_amount": 0.0,
      "igst_amount": 0.0,
      "total": 0.0
    }
  ],
  "subtotal": 0.0,
  "cgst_total": 0.0,
  "sgst_total": 0.0,
  "igst_total": 0.0,
  "total_tax": 0.0,
  "discount_total": 0.0,
  "round_off": 0.0,
  "total_amount": 0.0,
  "amount_in_words": "Amount in words if printed, else null",
  "currency": "INR",
  "payment_terms": "Payment terms if visible, else null",
  "bank_details": {
    "bank_name": null,
    "account_number": null,
    "ifsc": null
  },
  "category": "One of: IT Services, Automotive, Fuel & Energy, Banking & Finance, Construction, E-Commerce, Food & Beverage, Travel & Accommodation, Travel & Transportation, Education & Training, Retail & Shopping, Healthcare & Medical, Office Supplies, Professional Services, Utilities, Other",
  "document_type": "TAX_INVOICE",
  "confidence_score": 0.0,
  "extraction_notes": "Any observations about quality, missing fields, or anomalies",

  "fraud_analysis": {
    "fraud_score": "Float 0.0 (clean) to 1.0 (definitely fraud) — YOUR HONEST ASSESSMENT",
    "is_fraud": "true if fraud_score >= 0.65, else false",
    "risk_level": "low | medium | high | critical",
    "signals": [
      "List every suspicious indicator you observe. Be thorough and specific."
    ],
    "tampering_detected": "true if you see signs of digital editing, overwriting, or font inconsistencies",
    "gstin_valid_format": "true if GSTIN matches the 15-char Indian format, false if missing or malformed",
    "math_checks_pass": "true if subtotal + tax = total, false if numbers do not add up",
    "vendor_legitimacy": "legitimate | suspicious | unknown",
    "duplicate_risk": "low | medium | high",
    "audit_recommendation": "APPROVE | MANUAL_REVIEW | REJECT"
  }
}

FRAUD DETECTION RULES — check ALL of these and flag any that apply:
1. GSTIN missing or malformed (should be exactly 15 chars: 2 digits + 10 alphanumeric + 1 alpha + 1 alphanumeric + 1 alpha)
2. Math inconsistency: subtotal + CGST + SGST + IGST ≠ total_amount (allow ±1 rounding)
3. Suspiciously round total amounts (e.g., exactly 5000, 10000)
4. Invoice date in the future or more than 1 year in the past
5. Missing vendor address or contact info
6. No line items or extremely vague descriptions like "services", "misc", "work done"
7. Unprofessional formatting — misaligned text, inconsistent fonts, suspicious whitespace
8. Low image quality that could be hiding alterations
9. No official stamp or signature where expected for the document type
10. Handwritten amounts on printed invoice (common tampering method)
11. Amounts in words don't match numeric total
12. Tax calculation errors (CGST should equal SGST for intrastate; IGST used for interstate)
13. Duplicate-looking invoice numbers (sequential or very simple like INV-001)
14. Vendor name appears to be a person's name (not a company) for a B2B tax invoice
15. Invoice number contains suspicious patterns

IMPORTANT: fraud_score must be YOUR REAL ASSESSMENT, not a placeholder. A legitimate, clean, professional invoice from a real company with correct math and GSTIN should score 0.05–0.20. A suspicious invoice should score 0.4–0.6. A clearly fake/tampered/fraudulent invoice should score 0.7–1.0.
"""


# ─── Gemini OCR Service ────────────────────────────────────────────────────────

class GeminiOCRService:
    """
    Production OCR + Fraud Detection service powered by Google Gemini.

    Uses a 2-phase pipeline:
      Phase 1 — Gate check: is this actually an invoice? Hard-rejects non-invoices.
      Phase 2 — Extraction + Forensic fraud scoring by Gemini itself.

    Does NOT fall back to mock data for fraud analysis. If Gemini is unavailable,
    the upload is refused rather than silently passing fake bills.
    """

    def __init__(self) -> None:
        self.api_key = getattr(settings, "GEMINI_API_KEY", "")
        self._client: httpx.AsyncClient | None = None

    @property
    def _http(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=GEMINI_TIMEOUT_SECS)
        return self._client

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _encode_file(self, file_bytes: bytes, mime_type: str) -> dict[str, Any]:
        return {
            "inline_data": {
                "mime_type": mime_type,
                "data": base64.b64encode(file_bytes).decode("utf-8"),
            }
        }

    def _build_body(self, prompt: str, file_bytes: bytes, mime_type: str) -> dict[str, Any]:
        return {
            "contents": [
                {
                    "parts": [
                        {"text": prompt},
                        self._encode_file(file_bytes, mime_type),
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.05,
                "topK": 1,
                "topP": 0.95,
                "maxOutputTokens": 6000,
                "responseMimeType": "application/json",
            },
            "safetySettings": [
                {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
            ],
        }

    async def _call_gemini(self, body: dict) -> dict[str, Any]:
        url = f"{GEMINI_API_BASE}/models/{GEMINI_MODEL}:generateContent?key={self.api_key}"
        response = await self._http.post(url, json=body)
        response.raise_for_status()
        resp_json = response.json()

        candidates = resp_json.get("candidates", [])
        if not candidates:
            raise ValueError("No candidates in Gemini response")

        raw_text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
        cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw_text.strip())
        return json.loads(cleaned)

    @staticmethod
    def _normalize_numbers(raw: dict[str, Any]) -> dict[str, Any]:
        """Ensure all numeric invoice fields are proper floats."""
        for field in ("subtotal", "total_tax", "total_amount", "cgst_total",
                      "sgst_total", "igst_total", "discount_total", "round_off"):
            try:
                raw[field] = float(raw.get(field) or 0)
            except (TypeError, ValueError):
                raw[field] = 0.0

        for item in raw.get("items", []):
            if not isinstance(item, dict):
                continue
            for f in ("quantity", "unit_price", "discount", "taxable_value",
                      "cgst_rate", "sgst_rate", "igst_rate",
                      "cgst_amount", "sgst_amount", "igst_amount", "total"):
                try:
                    item[f] = float(item.get(f) or 0)
                except (TypeError, ValueError):
                    item[f] = 0.0

        try:
            raw["confidence_score"] = max(0.0, min(1.0, float(raw.get("confidence_score", 0.5))))
        except (TypeError, ValueError):
            raw["confidence_score"] = 0.5

        return raw

    # ── Phase 1: Gate Check ───────────────────────────────────────────────────

    async def _gate_check(self, file_bytes: bytes, mime_type: str) -> None:
        """
        Phase 1: Ask Gemini if this is actually an invoice/receipt.
        Raises NotAnInvoiceError immediately if not.
        """
        body = self._build_body(GATE_PROMPT, file_bytes, mime_type)
        result = await self._call_gemini(body)

        is_invoice = result.get("is_invoice", False)
        confidence = float(result.get("confidence", 0.0))
        rejection_reason = result.get("rejection_reason", "This does not appear to be a valid invoice or receipt.")

        logger.info(
            f"🔍 Gate check: is_invoice={is_invoice}, "
            f"confidence={confidence:.2f}, doc_type={result.get('document_type')}"
        )

        # Reject if clearly not an invoice, or if AI is unsure (confidence < 0.4)
        if not is_invoice or confidence < 0.4:
            raise NotAnInvoiceError(rejection_reason or "The uploaded image is not a valid invoice or financial document.")

    # ── Phase 2: Extraction + Fraud Analysis ──────────────────────────────────

    async def _extract_and_analyse(
        self,
        file_bytes: bytes,
        mime_type: str,
    ) -> dict[str, Any]:
        """
        Phase 2: Full invoice extraction + AI-powered fraud scoring.
        Returns the structured result. Raises FraudulentInvoiceError if
        Gemini determines the bill is definitively fraudulent (score ≥ 0.75).
        """
        t_start = time.monotonic()
        body = self._build_body(EXTRACTION_PROMPT, file_bytes, mime_type)
        raw = await self._call_gemini(body)

        # Normalize numeric fields
        raw = self._normalize_numbers(raw)

        # If total_amount is 0 but subtotal is set, recompute
        if raw["total_amount"] == 0 and raw["subtotal"] > 0:
            raw["total_amount"] = raw["subtotal"] + raw["total_tax"]

        elapsed_ms = int((time.monotonic() - t_start) * 1000)
        raw["processing_time_ms"] = elapsed_ms
        raw["ocr_engine"] = "gemini-2.0-flash-lite"

        # ── Pull fraud_analysis out of the response ───────────────────────────
        fraud_block = raw.get("fraud_analysis", {})
        if isinstance(fraud_block, dict):
            try:
                fs = float(fraud_block.get("fraud_score", 0.1))
            except (TypeError, ValueError):
                fs = 0.1

            fraud_block["fraud_score"] = round(max(0.0, min(1.0, fs)), 4)

            is_fraud_raw = fraud_block.get("is_fraud", False)
            if isinstance(is_fraud_raw, str):
                is_fraud_raw = is_fraud_raw.lower() == "true"
            fraud_block["is_fraud"] = bool(is_fraud_raw) or fraud_block["fraud_score"] >= 0.65

            signals = fraud_block.get("signals", [])
            if not isinstance(signals, list):
                signals = [str(signals)]
            fraud_block["signals"] = signals

            raw["fraud_analysis"] = fraud_block

            # Surface fraud_signals at the top level for API compatibility
            raw["fraud_signals"] = signals
            raw["is_flagged"] = fraud_block["is_fraud"]

            recommendation = fraud_block.get("audit_recommendation", "MANUAL_REVIEW")

            logger.info(
                f"🛡️ Fraud analysis: score={fraud_block['fraud_score']:.2f}, "
                f"is_fraud={fraud_block['is_fraud']}, "
                f"recommendation={recommendation}, "
                f"signals={len(signals)}"
            )

            # Hard reject truly fraudulent bills (Gemini score ≥ 0.75)
            if fraud_block["fraud_score"] >= 0.75 or recommendation == "REJECT":
                raise FraudulentInvoiceError(
                    reason=(
                        "Gemini AI has conclusively identified this document as "
                        f"fraudulent or fabricated (fraud score: {fraud_block['fraud_score']:.0%}). "
                        "Expense allowance has been denied."
                    ),
                    fraud_score=fraud_block["fraud_score"],
                    signals=signals,
                )

        raw.setdefault("vendor_name", "Unknown Vendor")
        raw.setdefault("gstin", None)
        raw.setdefault("invoice_number", f"INV-{int(time.time())}")
        raw.setdefault("invoice_date", date.today().isoformat())
        raw.setdefault("items", [])
        raw.setdefault("currency", "INR")
        raw.setdefault("category", "Other")
        raw.setdefault("extraction_notes", "")
        raw.setdefault("document_type", "TAX_INVOICE")

        logger.info(
            f"✅ Extraction complete | vendor={raw.get('vendor_name')} | "
            f"total=₹{raw.get('total_amount', 0):,.2f} | "
            f"confidence={raw.get('confidence_score')} | {elapsed_ms}ms"
        )
        return raw

    # ── Main public entry point ───────────────────────────────────────────────

    async def extract_invoice_data(
        self,
        file_bytes: bytes,
        mime_type: str = "image/jpeg",
    ) -> dict[str, Any]:
        """
        Full 2-phase invoice analysis.

        Raises
        ------
        NotAnInvoiceError
            When the uploaded image is not a valid invoice/receipt.
        FraudulentInvoiceError
            When Gemini conclusively determines the bill is fraudulent.
        RuntimeError
            When Gemini API is not configured or unavailable.
        """
        if not self.api_key:
            raise RuntimeError(
                "Gemini AI is not configured (GEMINI_API_KEY missing). "
                "Invoice processing is disabled. Contact your administrator."
            )

        try:
            # Phase 1: Strict document gate
            await self._gate_check(file_bytes, mime_type)

            # Phase 2: Extraction + fraud analysis
            return await self._extract_and_analyse(file_bytes, mime_type)

        except (NotAnInvoiceError, FraudulentInvoiceError):
            raise  # Propagate hard rejections as-is

        except httpx.HTTPStatusError as exc:
            logger.error(f"Gemini API HTTP error {exc.response.status_code}: {exc.response.text[:500]}")
            raise RuntimeError(
                f"Gemini API returned an error ({exc.response.status_code}). "
                "Please try again or contact support."
            ) from exc

        except httpx.RequestError as exc:
            logger.error(f"Gemini API request error: {exc}")
            raise RuntimeError(
                "Unable to reach the Gemini AI service. "
                "Please check your internet connection and try again."
            ) from exc

        except Exception as exc:
            logger.error(f"Unexpected Gemini OCR error: {exc}")
            raise RuntimeError(
                f"AI analysis failed unexpectedly: {exc}. "
                "Invoice cannot be processed without AI verification."
            ) from exc

    async def close(self) -> None:
        if self._client and not self._client.is_closed:
            await self._client.aclose()


# ─── Module-level singleton ───────────────────────────────────────────────────
gemini_ocr_service = GeminiOCRService()
