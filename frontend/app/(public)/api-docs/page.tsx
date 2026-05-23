"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Key, Terminal, Code2, AlertCircle, Copy, Check, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const languages = [
  { id: "curl", label: "cURL" },
  { id: "python", label: "Python (requests)" },
  { id: "nodejs", label: "NodeJS (axios)" },
];

const endpoints = [
  {
    method: "POST",
    path: "/api/v1/expenses/upload",
    description: "Upload a receipt image or PDF for OCR extraction and fraud verification.",
    auth: "Bearer Token Required",
    params: [
      { name: "file", type: "file (binary)", required: true, desc: "The image or PDF of the receipt (max 10MB)." },
      { name: "category", type: "string", required: false, desc: "Optional override category for the expense." },
    ],
    code: {
      curl: `curl -X POST "https://api.ledger-ai.in/api/v1/expenses/upload" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file=@/path/to/receipt.jpg"`,
      python: `import requests

url = "https://api.ledger-ai.in/api/v1/expenses/upload"
headers = {"Authorization": "Bearer YOUR_API_KEY"}
files = {"file": open("receipt.jpg", "rb")}

response = requests.post(url, headers=headers, files=files)
print(response.json())`,
      nodejs: `const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const form = new FormData();
form.append('file', fs.createReadStream('receipt.jpg'));

axios.post('https://api.ledger-ai.in/api/v1/expenses/upload', form, {
  headers: {
    ...form.getHeaders(),
    'Authorization': 'Bearer YOUR_API_KEY'
  }
})
.then(response => console.log(response.data))
.catch(error => console.error(error));`,
    },
    response: `{
  "success": true,
  "data": {
    "receipt_id": "rec_8f3d1e4c9a7b2d5",
    "vendor_name": "Swiggy Business",
    "gstin": "27AAECS1234F1Z5",
    "invoice_number": "SW-2025-9843",
    "invoice_date": "2025-05-21",
    "tax_amount": 373.47,
    "total_amount": 2450.00,
    "currency": "INR",
    "processing_status": "COMPLETED",
    "ai_analysis": {
      "fraud_score": 0.08,
      "risk_level": "LOW",
      "fraud_types": [],
      "ai_reasoning": "Receipt matches all validation parameters."
    }
  },
  "message": "Receipt processed successfully"
}`,
  },
  {
    method: "GET",
    path: "/api/v1/gst/validate/{gstin}",
    description: "Validate a company's GSTIN against the government portal registry.",
    auth: "Bearer Token Required",
    params: [
      { name: "gstin", type: "string (path parameter)", required: true, desc: "15-digit Indian GST Identification Number." },
    ],
    code: {
      curl: `curl -X GET "https://api.ledger-ai.in/api/v1/gst/validate/27AAECS1234F1Z5" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
      python: `import requests

url = "https://api.ledger-ai.in/api/v1/gst/validate/27AAECS1234F1Z5"
headers = {"Authorization": "Bearer YOUR_API_KEY"}

response = requests.get(url, headers=headers)
print(response.json())`,
      nodejs: `const axios = require('axios');

axios.get('https://api.ledger-ai.in/api/v1/gst/validate/27AAECS1234F1Z5', {
  headers: { 'Authorization': 'Bearer YOUR_API_KEY' }
})
.then(response => console.log(response.data))
.catch(error => console.error(error));`,
    },
    response: `{
  "success": true,
  "data": {
    "gstin": "27AAECS1234F1Z5",
    "is_valid": true,
    "business_name": "TATA CONSULTANCY SERVICES LTD",
    "state_code": "27",
    "registration_date": "2017-07-01",
    "compliance_score": 98.5,
    "filing_status": "ACTIVE"
  },
  "message": "GSTIN verified successfully"
}`,
  },
];

export default function ApiDocsPage() {
  const [selectedLang, setSelectedLang] = useState("curl");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-[#0a0b0f] min-h-screen text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-white pb-24 overflow-x-hidden">
      {/* Decorative radial glows */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Hero Header */}
      <section className="pt-24 pb-12 text-center max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full text-xs font-semibold uppercase tracking-wider mb-6"
        >
          <Terminal className="w-3.5 h-3.5" />
          Developer Reference
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight"
        >
          Developer API <br />
          <span className="gradient-text">Documentation</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6 text-slate-400 text-lg max-w-2xl mx-auto"
        >
          Integrate our autonomous auditing and OCR pipeline directly into your ERP, mobile applications, or internal HR tools.
        </motion.p>
      </section>

      {/* Core Setup Guide */}
      <section className="max-w-5xl mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xl font-bold text-white">Getting Started</h2>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
            All API access must be authenticated with a Bearer Token. Generate API keys from the settings panel of your organization.
          </p>

          <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex gap-3 text-xs text-slate-400">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white block mb-0.5">Authorization Header:</span>
              <code className="text-amber-300 font-mono">Authorization: Bearer YOUR_API_KEY</code>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <Card variant="default">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Key className="w-5 h-5 text-indigo-400" />
                API Environments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-sm text-slate-400">Sandbox Endpoint:</span>
                  <code className="text-xs font-mono text-slate-200">https://api.sandbox.ledger-ai.in/api/v1</code>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-slate-400">Production Endpoint:</span>
                  <code className="text-xs font-mono text-slate-200">https://api.ledger-ai.in/api/v1</code>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Endpoints Reference */}
      <section className="max-w-5xl mx-auto px-6 mt-20 space-y-16">
        <div className="flex justify-between items-center pb-4 border-b border-white/5">
          <h2 className="text-2xl font-bold text-white">API Reference</h2>
          {/* Language selector */}
          <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
            {languages.map((lang) => (
              <button
                key={lang.id}
                onClick={() => setSelectedLang(lang.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedLang === lang.id
                    ? "bg-indigo-500 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {endpoints.map((ep, epIdx) => (
          <div key={epIdx} className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* API Specs */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-lg text-xs font-bold font-mono ${
                  ep.method === "POST" ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                }`}>
                  {ep.method}
                </span>
                <code className="text-sm font-semibold text-white font-mono">{ep.path}</code>
              </div>

              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">{ep.description}</p>

              {/* Params Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Parameters</h4>
                <div className="border border-white/5 rounded-2xl overflow-hidden bg-slate-950/20">
                  {ep.params.map((param, pIdx) => (
                    <div key={pIdx} className="p-4 border-b border-white/5 last:border-0 text-xs">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="font-semibold text-white font-mono">{param.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-indigo-400 font-semibold uppercase">{param.type}</span>
                          {param.required && (
                            <span className="text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 font-bold px-1.5 py-0.5 rounded">REQUIRED</span>
                          )}
                        </div>
                      </div>
                      <p className="text-slate-500">{param.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Code Snippets & Response */}
            <div className="space-y-4">
              {/* Request Code Block */}
              <div>
                <div className="flex justify-between items-center px-4 py-2 bg-slate-900 border border-slate-800 border-b-0 rounded-t-2xl text-xs text-slate-400 font-mono">
                  <span>REQUEST EXAMPLE</span>
                  <button
                    onClick={() => handleCopy((ep.code as any)[selectedLang], `${epIdx}-req`)}
                    className="hover:text-white flex items-center gap-1 transition-colors"
                  >
                    {copiedId === `${epIdx}-req` ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-5 bg-slate-950 border border-slate-800 rounded-b-2xl overflow-x-auto text-xs text-indigo-300 font-mono max-h-[300px]">
                  <code>{(ep.code as any)[selectedLang]}</code>
                </pre>
              </div>

              {/* Response Block */}
              <div>
                <div className="flex justify-between items-center px-4 py-2 bg-slate-900 border border-slate-800 border-b-0 rounded-t-2xl text-xs text-slate-400 font-mono">
                  <span>RESPONSE EXAMPLE (JSON)</span>
                  <button
                    onClick={() => handleCopy(ep.response, `${epIdx}-resp`)}
                    className="hover:text-white flex items-center gap-1 transition-colors"
                  >
                    {copiedId === `${epIdx}-resp` ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-5 bg-slate-950 border border-slate-800 rounded-b-2xl overflow-x-auto text-xs text-emerald-400/90 font-mono max-h-[300px]">
                  <code>{ep.response}</code>
                </pre>
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
