"""
Gemini 3.1 Flash-Lite OCR service for the LEDGER platform.

Sends invoice/receipt images and PDFs to Google's Gemini 3.1 Flash-Lite model
for structured data extraction. Returns a validated, structured JSON invoice
object including vendor details, GSTIN, line items, amounts, and fraud signals.

Falls back gracefully to the mock OCR service if Gemini API is unavailable.
"""

from __future__ import annotations

import base64
import json
import re
import time
from datetime import date, timedelta
from typing import Any

import httpx
from loguru import logger

from app.core.config import settings


# ─── Gemini API Constants ──────────────────────────────────────────────────────

GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta"
GEMINI_MODEL = "gemini-2.0-flash-lite"
GEMINI_TIMEOUT_SECS = 60


# ─── Extraction Prompt ─────────────────────────────────────────────────────────

INVOICE_EXTRACTION_PROMPT = """You are an expert Indian GST invoice OCR engine integrated into an enterprise expense auditing platform (LEDGER). 

Analyze this invoice/receipt image or PDF and extract ALL available information. Return ONLY valid JSON with no markdown, no explanation, no code blocks — just raw JSON.

Extract the following fields:

{
  "vendor_name": "Full legal company name as printed",
  "vendor_address": "Full address if visible",
  "gstin": "15-character GSTIN if visible, else null",
  "pan": "PAN number if visible, else null",
  "invoice_number": "Invoice/receipt number",
  "invoice_date": "Date in YYYY-MM-DD format",
  "due_date": "Due date in YYYY-MM-DD format if present, else null",
  "po_number": "Purchase order number if present, else null",
  "items": [
    {
      "description": "Line item description",
      "hsn_sac": "HSN/SAC code if visible",
      "quantity": numeric_quantity,
      "unit": "unit of measure",
      "unit_price": numeric_unit_price,
      "discount": numeric_discount_amount_or_0,
      "taxable_value": numeric_taxable_value,
      "cgst_rate": numeric_cgst_percentage_or_0,
      "sgst_rate": numeric_sgst_percentage_or_0,
      "igst_rate": numeric_igst_percentage_or_0,
      "cgst_amount": numeric_or_0,
      "sgst_amount": numeric_or_0,
      "igst_amount": numeric_or_0,
      "total": numeric_line_total
    }
  ],
  "subtotal": numeric_amount_before_tax,
  "cgst_total": numeric_or_0,
  "sgst_total": numeric_or_0,
  "igst_total": numeric_or_0,
  "total_tax": numeric_total_tax_amount,
  "discount_total": numeric_total_discount_or_0,
  "round_off": numeric_rounding_adjustment_or_0,
  "total_amount": numeric_final_payable_amount,
  "amount_in_words": "Amount in words if printed",
  "currency": "INR",
  "payment_terms": "Payment terms if visible",
  "bank_details": {
    "bank_name": "Bank name if visible",
    "account_number": "Account number if visible",
    "ifsc": "IFSC code if visible"
  },
  "category": "One of: IT Services, Automotive, Fuel & Energy, Banking & Finance, Construction, E-Commerce, Food & Beverage, Travel & Accommodation, Travel & Transportation, Education & Training, Retail & Shopping, Healthcare & Medical, Office Supplies, Professional Services, Utilities, Other",
  "document_type": "One of: TAX_INVOICE, PROFORMA_INVOICE, BILL, RECEIPT, CREDIT_NOTE, DEBIT_NOTE",
  "confidence_score": 0.00_to_1.00_float_your_confidence_in_extraction,
  "extraction_notes": "Any important observations, anomalies, or unclear fields",
  "fraud_signals": [
    "List any suspicious observations like: round amounts, missing GSTIN, overwriting, unclear vendor, mismatched totals, etc."
  ]
}

Rules:
- All numeric values must be plain numbers (no currency symbols, no commas)
- If a field is not visible or not applicable, use null for strings and 0 for numbers
- invoice_date must always be in YYYY-MM-DD format
- confidence_score between 0.0 and 1.0 based on image quality and completeness
- For receipts without line items, create a single item with the total as the amount
- Always include fraud_signals array (can be empty [])
- Do not hallucinate data — only extract what is clearly visible
"""


# ─── Gemini OCR Service ────────────────────────────────────────────────────────


class GeminiOCRService:
    """
    Production OCR service powered by Google Gemini 3.1 Flash-Lite.

    Supports JPEG, PNG, WEBP, and PDF uploads. Falls back to the
    mock OCR service if the API key is not configured or a call fails.
    """

    def __init__(self) -> None:
        self.api_key = getattr(settings, "GEMINI_API_KEY", "")
        self._client: httpx.AsyncClient | None = None

    @property
    def _http(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=GEMINI_TIMEOUT_SECS)
        return self._client

    # ── Internal helpers ──────────────────────────────────────────────────────

    def _encode_file(self, file_bytes: bytes, mime_type: str) -> dict[str, Any]:
        """Encode file bytes as a Gemini-compatible inline_data part."""
        return {
            "inline_data": {
                "mime_type": mime_type,
                "data": base64.b64encode(file_bytes).decode("utf-8"),
            }
        }

    def _build_request_body(self, file_bytes: bytes, mime_type: str) -> dict[str, Any]:
        """Build the full Gemini generateContent request body."""
        return {
            "contents": [
                {
                    "parts": [
                        {"text": INVOICE_EXTRACTION_PROMPT},
                        self._encode_file(file_bytes, mime_type),
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.1,
                "topK": 1,
                "topP": 0.95,
                "maxOutputTokens": 4096,
                "responseMimeType": "application/json",
            },
            "safetySettings": [
                {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
            ],
        }

    @staticmethod
    def _parse_gemini_response(response_json: dict) -> dict[str, Any]:
        """Extract and parse the structured JSON from a Gemini API response."""
        try:
            candidates = response_json.get("candidates", [])
            if not candidates:
                raise ValueError("No candidates in Gemini response")

            content = candidates[0].get("content", {})
            parts = content.get("parts", [])
            if not parts:
                raise ValueError("No parts in Gemini response content")

            raw_text = parts[0].get("text", "")

            # Strip markdown code fences if present (shouldn't happen with responseMimeType)
            cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw_text.strip())
            return json.loads(cleaned)

        except (json.JSONDecodeError, ValueError, KeyError, IndexError) as exc:
            raise ValueError(f"Failed to parse Gemini response: {exc}") from exc

    @staticmethod
    def _normalize_result(raw: dict[str, Any]) -> dict[str, Any]:
        """Normalize and validate the extracted invoice data."""
        today = date.today().isoformat()

        # Ensure required fields have defaults
        raw.setdefault("vendor_name", "Unknown Vendor")
        raw.setdefault("gstin", None)
        raw.setdefault("invoice_number", f"INV-{int(time.time())}")
        raw.setdefault("invoice_date", today)
        raw.setdefault("items", [])
        raw.setdefault("currency", "INR")
        raw.setdefault("category", "Other")
        raw.setdefault("confidence_score", 0.75)
        raw.setdefault("fraud_signals", [])
        raw.setdefault("extraction_notes", "")
        raw.setdefault("document_type", "TAX_INVOICE")

        # Coerce numeric fields
        for field in ("subtotal", "total_tax", "total_amount", "cgst_total",
                      "sgst_total", "igst_total", "discount_total", "round_off"):
            try:
                raw[field] = float(raw.get(field) or 0)
            except (TypeError, ValueError):
                raw[field] = 0.0

        # If total_amount is 0 but subtotal is set, recompute
        if raw["total_amount"] == 0 and raw["subtotal"] > 0:
            raw["total_amount"] = raw["subtotal"] + raw["total_tax"]

        # Normalize line items
        normalized_items = []
        for item in raw.get("items", []):
            if not isinstance(item, dict):
                continue
            normalized_item = {
                "description": str(item.get("description", "Service")),
                "hsn_sac": str(item.get("hsn_sac", "")),
                "quantity": float(item.get("quantity") or 1),
                "unit": str(item.get("unit", "nos")),
                "unit_price": float(item.get("unit_price") or 0),
                "total": float(item.get("total") or 0),
                "cgst_rate": float(item.get("cgst_rate") or 0),
                "sgst_rate": float(item.get("sgst_rate") or 0),
                "igst_rate": float(item.get("igst_rate") or 0),
                "cgst_amount": float(item.get("cgst_amount") or 0),
                "sgst_amount": float(item.get("sgst_amount") or 0),
                "igst_amount": float(item.get("igst_amount") or 0),
                "taxable_value": float(item.get("taxable_value") or 0),
                "discount": float(item.get("discount") or 0),
            }
            normalized_items.append(normalized_item)

        raw["items"] = normalized_items

        # Clamp confidence score
        try:
            raw["confidence_score"] = max(0.0, min(1.0, float(raw["confidence_score"])))
        except (TypeError, ValueError):
            raw["confidence_score"] = 0.75

        return raw

    # ── Main public method ────────────────────────────────────────────────────

    async def extract_invoice_data(
        self,
        file_bytes: bytes,
        mime_type: str = "image/jpeg",
    ) -> dict[str, Any]:
        """
        Extract structured invoice data using Gemini 3.1 Flash-Lite.

        Parameters
        ----------
        file_bytes : bytes
            Raw bytes of the uploaded receipt/invoice image or PDF.
        mime_type : str
            MIME type of the uploaded file.

        Returns
        -------
        dict
            Structured invoice data including vendor info, GSTIN, line items,
            GST breakdown, totals, and fraud signals.
        """
        if not self.api_key:
            logger.warning("GEMINI_API_KEY not set — falling back to mock OCR")
            return await self._fallback_mock(file_bytes, mime_type)

        t_start = time.monotonic()
        url = f"{GEMINI_API_BASE}/models/{GEMINI_MODEL}:generateContent?key={self.api_key}"
        body = self._build_request_body(file_bytes, mime_type)

        try:
            response = await self._http.post(url, json=body)
            response.raise_for_status()
            resp_json = response.json()

            raw_data = self._parse_gemini_response(resp_json)
            result = self._normalize_result(raw_data)

            elapsed_ms = int((time.monotonic() - t_start) * 1000)
            result["processing_time_ms"] = elapsed_ms
            result["ocr_engine"] = "gemini-2.0-flash-lite"
            result["raw_text_preview"] = (
                f"TAX INVOICE\n"
                f"{result.get('vendor_name', 'Unknown')}\n"
                f"GSTIN: {result.get('gstin', 'N/A')}\n"
                f"Invoice No: {result.get('invoice_number', 'N/A')}\n"
                f"Date: {result.get('invoice_date', 'N/A')}\n"
                f"Amount Payable: INR {result.get('total_amount', 0):,.2f}\n"
                f"[Extracted by Gemini 2.0 Flash-Lite OCR in {elapsed_ms}ms]"
            )

            logger.info(
                f"✅ Gemini OCR complete | vendor={result.get('vendor_name')} | "
                f"total=₹{result.get('total_amount', 0):,.2f} | "
                f"confidence={result.get('confidence_score')} | {elapsed_ms}ms"
            )
            return result

        except httpx.HTTPStatusError as exc:
            logger.error(f"Gemini API HTTP error {exc.response.status_code}: {exc.response.text[:500]}")
            return await self._fallback_mock(file_bytes, mime_type)
        except httpx.RequestError as exc:
            logger.error(f"Gemini API request error: {exc}")
            return await self._fallback_mock(file_bytes, mime_type)
        except ValueError as exc:
            logger.error(f"Gemini response parse error: {exc}")
            return await self._fallback_mock(file_bytes, mime_type)
        except Exception as exc:
            logger.error(f"Unexpected Gemini OCR error: {exc}")
            return await self._fallback_mock(file_bytes, mime_type)

    async def _fallback_mock(self, file_bytes: bytes, mime_type: str) -> dict[str, Any]:
        """Fall back to the deterministic mock OCR when Gemini is unavailable."""
        from app.services.ocr_service import ocr_service as mock_service
        mock_result = await mock_service.extract_receipt_data(file_bytes, mime_type)
        mock_result["ocr_engine"] = "mock-fallback"
        mock_result["fraud_signals"] = []
        mock_result["document_type"] = "TAX_INVOICE"
        mock_result["items"] = mock_result.pop("items", [])
        logger.warning("⚠️  Using mock OCR fallback (Gemini unavailable)")
        return mock_result

    async def close(self) -> None:
        if self._client and not self._client.is_closed:
            await self._client.aclose()


# ─── Module-level singleton ───────────────────────────────────────────────────
gemini_ocr_service = GeminiOCRService()
