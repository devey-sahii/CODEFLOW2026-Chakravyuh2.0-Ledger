import { NextRequest, NextResponse } from 'next/server'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const GEMINI_MODEL = 'gemini-2.0-flash-lite'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`

const ANALYSIS_PROMPT = `You are an expert forensic document analyst specialising in receipt and invoice fraud detection.

A user has uploaded an image. Your task is to:

1. First determine if this is a receipt, invoice, or bill at all.
2. If it IS a financial document, perform a comprehensive authenticity analysis.
3. Return a definitive verdict: GENUINE, SUSPICIOUS, or FAKE.

Respond with ONLY raw valid JSON (no markdown, no code blocks):

{
  "is_receipt": true or false,
  "document_type": "RECEIPT | TAX_INVOICE | BILL | HANDWRITTEN_RECEIPT | DIGITAL_RECEIPT | NOT_A_RECEIPT",
  "verdict": "GENUINE | SUSPICIOUS | FAKE",
  "authenticity_score": 0.0 to 1.0 (1.0 = definitely genuine, 0.0 = definitely fake),
  "confidence": 0.0 to 1.0 (how confident you are in your verdict),
  "vendor_name": "Extracted vendor/shop name or null",
  "total_amount": extracted total amount as number or null,
  "currency": "INR | USD | EUR | GBP | etc or null",
  "date": "YYYY-MM-DD or null",
  "summary": "1-2 sentence plain English summary of what this document is",
  "genuine_indicators": [
    "List every indicator that suggests this receipt is genuine"
  ],
  "suspicious_indicators": [
    "List every red flag or suspicious element. Be thorough."
  ],
  "detailed_findings": {
    "print_quality": "professional | acceptable | poor | suspicious",
    "font_consistency": "consistent | minor_inconsistencies | major_inconsistencies",
    "math_correct": true or false or null,
    "logo_present": true or false,
    "official_branding": true or false,
    "stamps_signatures": "present | absent | suspicious",
    "date_valid": true or false or null,
    "amount_format_correct": true or false or null,
    "contact_info_present": true or false,
    "tax_info_present": true or false,
    "handwritten_alterations": true or false,
    "digital_tampering_signs": true or false,
    "image_quality": "high | medium | low",
    "structural_integrity": "intact | minor_issues | major_issues"
  },
  "recommendation": "ACCEPT | MANUAL_REVIEW | REJECT",
  "rejection_reason": "Only if verdict is FAKE or SUSPICIOUS — explain why in plain language. Null if GENUINE.",
  "not_a_receipt_reason": "Only if is_receipt is false — explain what the image actually shows"
}

FRAUD DETECTION CHECKLIST — check ALL of these:
1. Math accuracy: do line items add up to subtotal? subtotal + tax = total?
2. Font inconsistencies: are fonts mixed, varying sizes, or misaligned?
3. Handwritten edits on printed document (classic tampering)
4. Blurry/pixelated areas that could hide edits
5. Unrealistic amounts (e.g., ₹99,999 for groceries)
6. Missing mandatory fields: date, vendor name, amount
7. Round number totals with no line items
8. Professional branding vs obvious amateur design
9. Dates in the future or very far in the past
10. Copy-paste artifacts, inconsistent backgrounds
11. QR codes that don't match printed content (if visible)
12. GST/tax number format validity
13. Generic placeholder text left in the document
14. Logo quality vs rest of document (low-res logo on high-res doc = likely fake)

SCORING GUIDE:
- 0.85–1.0: Clearly genuine professional receipt
- 0.65–0.84: Likely genuine but has minor issues
- 0.40–0.64: Suspicious — needs manual review
- 0.20–0.39: Likely fake/tampered
- 0.0–0.19: Clearly fraudulent`

export async function POST(req: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: 'Gemini API key not configured on the server.' },
      { status: 503 }
    )
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowed.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only JPEG, PNG, WEBP images are supported for receipt verification.' },
        { status: 400 }
      )
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File must be under 10 MB.' }, { status: 400 })
    }

    // Convert to base64
    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')

    const body = {
      contents: [
        {
          parts: [
            { text: ANALYSIS_PROMPT },
            {
              inline_data: {
                mime_type: file.type,
                data: base64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.05,
        topK: 1,
        topP: 0.95,
        maxOutputTokens: 4000,
        responseMimeType: 'application/json',
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ],
    }

    const geminiRes = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!geminiRes.ok) {
      const errText = await geminiRes.text()
      console.error('Gemini API error:', geminiRes.status, errText)
      return NextResponse.json(
        { error: `Gemini API error (${geminiRes.status}). Please try again.` },
        { status: 502 }
      )
    }

    const geminiData = await geminiRes.json()
    const candidates = geminiData?.candidates ?? []
    if (!candidates.length) {
      return NextResponse.json({ error: 'No response from Gemini AI.' }, { status: 502 })
    }

    const rawText: string =
      candidates[0]?.content?.parts?.[0]?.text ?? ''

    // Strip markdown code fences if present
    const cleaned = rawText.replace(/^```(?:json)?\s*/m, '').replace(/\s*```$/m, '').trim()

    let analysis: Record<string, unknown>
    try {
      analysis = JSON.parse(cleaned)
    } catch {
      console.error('Failed to parse Gemini JSON:', rawText)
      return NextResponse.json(
        { error: 'AI returned unexpected format. Please try again.' },
        { status: 502 }
      )
    }

    // Normalise authenticity_score
    const raw = analysis.authenticity_score
    analysis.authenticity_score = Math.max(0, Math.min(1, Number(raw) || 0.5))

    return NextResponse.json({ success: true, analysis })
  } catch (err) {
    console.error('verify-receipt error:', err)
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}
