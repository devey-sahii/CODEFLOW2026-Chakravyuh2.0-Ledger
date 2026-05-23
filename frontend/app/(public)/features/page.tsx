"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import {
  ScanLine,
  ShieldAlert,
  FileCheck2,
  Brain,
  ScrollText,
  Upload,
  CheckCircle2,
  ArrowRight,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCheck,
  Smartphone,
  Mail,
  Globe,
} from "lucide-react";
import type { Metadata } from "next";

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

const fadeInLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

const fadeInRight = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

// Feature Section component
function FeatureSection({
  index,
  icon: Icon,
  eyebrow,
  title,
  description,
  bullets,
  visual,
}: {
  index: number;
  icon: React.ElementType;
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  visual: React.ReactNode;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const isEven = index % 2 === 0;

  return (
    <section ref={ref} className="py-24 relative overflow-hidden">
      {/* Background accent */}
      <div
        className={`absolute ${isEven ? "left-0" : "right-0"} top-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none`}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`grid grid-cols-1 lg:grid-cols-2 gap-16 items-center ${
            isEven ? "" : "lg:flex-row-reverse"
          }`}
        >
          {/* Text side */}
          <motion.div
            variants={isEven ? fadeInLeft : fadeInRight}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            className={isEven ? "order-1" : "order-1 lg:order-2"}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20 border border-indigo-500/30 flex items-center justify-center">
                <Icon className="w-5 h-5 text-indigo-400" />
              </div>
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">
                {eyebrow}
              </span>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-4">
              {title}
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed mb-8">
              {description}
            </p>

            <motion.ul variants={stagger} initial="hidden" animate={isInView ? "visible" : "hidden"} className="space-y-3">
              {bullets.map((bullet, i) => (
                <motion.li key={i} variants={fadeInUp} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300 text-sm leading-relaxed">{bullet}</span>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>

          {/* Visual side */}
          <motion.div
            variants={isEven ? fadeInRight : fadeInLeft}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            className={isEven ? "order-2" : "order-2 lg:order-1"}
          >
            {visual}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Mock Screenshot: AI Receipt OCR
function OcrVisual() {
  return (
    <div className="relative">
      <div className="glass-card rounded-3xl p-6 shadow-2xl shadow-black/50 relative overflow-hidden">
        {/* Scan line animation */}
        <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-400/80 to-transparent animate-scan-line z-10" />

        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
            <ScanLine className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Receipt Scanner</p>
            <p className="text-xs text-slate-500">Processing...</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-xs text-indigo-400">AI Active</span>
          </div>
        </div>

        {/* Receipt mock */}
        <div className="bg-slate-900/80 rounded-2xl p-4 border border-white/5 mb-4">
          <div className="text-center mb-3">
            <div className="h-3 bg-slate-700 rounded w-32 mx-auto mb-1" />
            <div className="h-2 bg-slate-800 rounded w-20 mx-auto" />
          </div>
          {[
            { label: "Vendor", value: "Swiggy Business" },
            { label: "Amount", value: "₹2,450.00" },
            { label: "GST No.", value: "27AAECS1234F1Z5" },
            { label: "Date", value: "21 May 2025" },
          ].map((row, i) => (
            <div key={i} className="flex justify-between items-center py-1.5 border-b border-white/5 last:border-0">
              <span className="text-xs text-slate-500">{row.label}</span>
              <span className="text-xs font-mono text-emerald-400">{row.value}</span>
            </div>
          ))}
        </div>

        {/* Extracted data */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Vendor", confidence: "98%", color: "emerald" },
            { label: "Amount", confidence: "100%", color: "emerald" },
            { label: "GST", confidence: "95%", color: "indigo" },
          ].map((field) => (
            <div key={field.label} className="bg-slate-900 rounded-xl p-2.5 text-center border border-white/5">
              <div className="text-xs text-slate-500 mb-1">{field.label}</div>
              <div className={`text-sm font-bold text-${field.color}-400`}>{field.confidence}</div>
              <div className="text-xs text-slate-600">confidence</div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <CheckCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-xs text-emerald-300 font-medium">Receipt extracted successfully in 1.2s</span>
        </div>
      </div>

      {/* Floating badge */}
      <div className="absolute -top-4 -right-4 glass-card rounded-2xl px-4 py-2 border border-indigo-500/30 shadow-lg">
        <div className="text-xs text-slate-400">Accuracy Rate</div>
        <div className="text-xl font-bold gradient-text">99.4%</div>
      </div>
    </div>
  );
}

// Mock Screenshot: Fraud Detection
function FraudVisual() {
  const fraudItems = [
    { id: "EXP-1042", vendor: "Zomato Corporate", amount: "₹3,200", risk: 92, status: "FLAGGED" },
    { id: "EXP-1041", vendor: "Uber Business", amount: "₹850", risk: 12, status: "CLEAN" },
    { id: "EXP-1040", vendor: "Unknown Vendor", amount: "₹18,500", risk: 87, status: "REVIEW" },
    { id: "EXP-1039", vendor: "Amazon Business", amount: "₹4,100", risk: 8, status: "CLEAN" },
  ];

  return (
    <div className="relative">
      <div className="glass-card rounded-3xl p-6 shadow-2xl shadow-black/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Fraud Detection Engine</p>
            <p className="text-xs text-slate-500">Real-time monitoring active</p>
          </div>
        </div>

        <div className="space-y-3">
          {fraudItems.map((item) => (
            <div key={item.id} className="flex items-center gap-3 p-3 bg-slate-900/60 rounded-xl border border-white/5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-slate-500 font-mono">{item.id}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                      item.status === "FLAGGED"
                        ? "bg-red-500/20 text-red-400"
                        : item.status === "REVIEW"
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-emerald-500/20 text-emerald-400"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                <div className="text-sm font-medium text-white truncate">{item.vendor}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-mono text-white">{item.amount}</div>
                <div className="flex items-center gap-1 justify-end mt-1">
                  <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        item.risk > 70 ? "bg-red-500" : item.risk > 40 ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${item.risk}%` }}
                    />
                  </div>
                  <span className={`text-xs font-bold ${item.risk > 70 ? "text-red-400" : item.risk > 40 ? "text-amber-400" : "text-emerald-400"}`}>
                    {item.risk}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { label: "Flagged", value: "3", color: "red" },
            { label: "Saved", value: "₹21.7L", color: "emerald" },
            { label: "Accuracy", value: "99.4%", color: "indigo" },
          ].map((stat) => (
            <div key={stat.label} className="text-center p-2 bg-slate-900 rounded-xl border border-white/5">
              <div className={`text-lg font-bold text-${stat.color}-400`}>{stat.value}</div>
              <div className="text-xs text-slate-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Mock Screenshot: GST Compliance
function GSTVisual() {
  return (
    <div className="relative">
      <div className="glass-card rounded-3xl p-6 shadow-2xl shadow-black/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <FileCheck2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">GST Compliance Dashboard</p>
            <p className="text-xs text-slate-500">May 2025 — Auto-reconciled</p>
          </div>
        </div>

        {/* GST Summary */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { label: "Input Tax Credit", value: "₹4,82,400", pct: "+100%", good: true },
            { label: "ITC Mismatches", value: "₹12,300", pct: "-67%", good: true },
            { label: "GSTIN Verified", value: "247 / 250", pct: "98.8%", good: true },
            { label: "GSTR-2B Ready", value: "YES", pct: "On time", good: true },
          ].map((item) => (
            <div key={item.label} className="p-3 bg-slate-900 rounded-xl border border-white/5">
              <div className="text-xs text-slate-500 mb-1">{item.label}</div>
              <div className="text-base font-bold text-white">{item.value}</div>
              <div className="text-xs text-emerald-400 font-medium">{item.pct}</div>
            </div>
          ))}
        </div>

        {/* Reconciliation status */}
        <div className="space-y-2">
          {["GSTR-1 Filed", "GSTR-2B Matched", "GSTR-3B Computed", "GSTN Synced"].map((item) => (
            <div key={item} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="text-sm text-slate-300">{item}</span>
              <span className="ml-auto text-xs text-emerald-400 font-medium">Done</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Mock Screenshot: Risk Scoring
function RiskVisual() {
  return (
    <div className="relative">
      <div className="glass-card rounded-3xl p-6 shadow-2xl shadow-black/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
            <Brain className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">AI Risk Scoring</p>
            <p className="text-xs text-slate-500">Powered by ML models</p>
          </div>
        </div>

        {/* Risk score meter */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative w-36 h-36">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(99,102,241,0.1)" strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="url(#riskGrad)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray="251.2"
                strokeDashoffset="62.8"
              />
              <defs>
                <linearGradient id="riskGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-white">75</span>
              <span className="text-xs text-slate-500">Risk Score</span>
            </div>
          </div>
        </div>

        {/* Risk factors */}
        <div className="space-y-2.5">
          {[
            { factor: "Duplicate submission", score: 90, weight: "High" },
            { factor: "Weekend expense", score: 55, weight: "Med" },
            { factor: "Above policy limit", score: 70, weight: "High" },
            { factor: "Missing category", score: 40, weight: "Low" },
          ].map((item) => (
            <div key={item.factor} className="flex items-center gap-3">
              <span className="text-xs text-slate-400 w-36 truncate">{item.factor}</span>
              <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                  style={{ width: `${item.score}%` }}
                />
              </div>
              <span className={`text-xs font-semibold w-8 text-right ${item.score > 70 ? "text-red-400" : item.score > 50 ? "text-amber-400" : "text-emerald-400"}`}>
                {item.score}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Mock Screenshot: Audit Trail
function AuditVisual() {
  const events = [
    { time: "09:42 AM", action: "Receipt uploaded", user: "Priya S.", type: "upload" },
    { time: "09:43 AM", action: "AI scan complete", user: "System", type: "ai" },
    { time: "09:45 AM", action: "Fraud flag raised", user: "AI Engine", type: "alert" },
    { time: "10:12 AM", action: "Manager reviewed", user: "Rohan K.", type: "review" },
    { time: "10:15 AM", action: "Expense rejected", user: "Rohan K.", type: "reject" },
  ];

  return (
    <div className="relative">
      <div className="glass-card rounded-3xl p-6 shadow-2xl shadow-black/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
            <ScrollText className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Enterprise Audit Trail</p>
            <p className="text-xs text-slate-500">Immutable event log</p>
          </div>
        </div>

        <div className="relative pl-4">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-indigo-500/50 via-indigo-500/20 to-transparent" />
          <div className="space-y-4">
            {events.map((event, i) => (
              <div key={i} className="relative flex items-start gap-4 pl-6">
                <div className="absolute left-0 top-1 w-2 h-2 rounded-full bg-indigo-500 border-2 border-[#0a0b0f] -translate-x-1" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-white">{event.action}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                        event.type === "alert" || event.type === "reject"
                          ? "bg-red-500/15 text-red-400"
                          : event.type === "ai"
                          ? "bg-indigo-500/15 text-indigo-400"
                          : "bg-slate-700 text-slate-400"
                      }`}
                    >
                      {event.user}
                    </span>
                  </div>
                  <span className="text-xs text-slate-600 font-mono">{event.time} · Cryptographically signed</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Mock Screenshot: Multi-channel Upload
function UploadVisual() {
  const channels = [
    { name: "WhatsApp", icon: Smartphone, color: "emerald", count: "1,204 receipts" },
    { name: "Email", icon: Mail, color: "blue", count: "3,891 receipts" },
    { name: "Web Portal", icon: Globe, color: "indigo", count: "7,442 receipts" },
  ];

  return (
    <div className="relative">
      <div className="glass-card rounded-3xl p-6 shadow-2xl shadow-black/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Upload className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Multi-channel Ingestion</p>
            <p className="text-xs text-slate-500">All channels, one platform</p>
          </div>
        </div>

        <div className="space-y-4">
          {channels.map((ch) => (
            <div key={ch.name} className="flex items-center gap-4 p-4 bg-slate-900/60 rounded-2xl border border-white/5">
              <div className={`w-12 h-12 rounded-xl bg-${ch.color}-500/20 border border-${ch.color}-500/30 flex items-center justify-center`}>
                <ch.icon className={`w-5 h-5 text-${ch.color}-400`} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-white">{ch.name}</div>
                <div className="text-xs text-slate-500">{ch.count} this month</div>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          ))}
        </div>

        <div className="mt-4 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-white">12,537</div>
            <div className="text-xs text-slate-400">Total receipts processed</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-emerald-400">99.8%</div>
            <div className="text-xs text-slate-400">Processing success</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const features = [
  {
    icon: ScanLine,
    eyebrow: "AI Receipt OCR",
    title: "Instant Receipt Scanning with 99.4% Accuracy",
    description:
      "Our advanced AI extracts vendor names, amounts, GSTIN, dates, and line items from any receipt format — paper, PDF, or photo — in under 2 seconds.",
    bullets: [
      "Supports 50+ receipt formats including handwritten bills",
      "Auto-extracts GSTIN and validates against GSTN portal",
      "Handles blurry, skewed, or low-quality scans with confidence scoring",
      "Batch processing for up to 10,000 receipts simultaneously",
    ],
    visual: <OcrVisual />,
  },
  {
    icon: ShieldAlert,
    eyebrow: "Fraud Detection",
    title: "Real-time Fraud Detection Before Approval",
    description:
      "Our ML engine scores every expense against 40+ fraud signals — from duplicates to policy violations — flagging suspicious claims before they're approved.",
    bullets: [
      "Detects duplicate receipts across all employees and time periods",
      "Identifies round-number anomalies and split transaction patterns",
      "Flags out-of-policy submissions based on your custom rules",
      "Reduces fraudulent payouts by 87% on average within 90 days",
    ],
    visual: <FraudVisual />,
  },
  {
    icon: FileCheck2,
    eyebrow: "GST Compliance",
    title: "Automated GST Reconciliation & ITC Claims",
    description:
      "Eliminate manual GST reconciliation. Auto-validate every GSTIN, match ITC with GSTR-2B, and generate GSTR-3B ready reports with one click.",
    bullets: [
      "Real-time GSTIN validation against government database",
      "Automatic GSTR-2B reconciliation and ITC computation",
      "One-click GSTR-3B report generation for your CA",
      "Instant alerts on ITC mismatches before filing deadlines",
    ],
    visual: <GSTVisual />,
  },
  {
    icon: Brain,
    eyebrow: "Risk Intelligence",
    title: "Intelligent Risk Scoring for Every Expense",
    description:
      "Each expense gets a risk score from 0–100 based on ML analysis of vendor patterns, employee history, category norms, and temporal signals.",
    bullets: [
      "40+ risk signals evaluated in real-time per expense",
      "Learns your company's spending norms to reduce false positives",
      "Priority queue routes high-risk items to senior approvers",
      "Risk trend analytics to identify department-level patterns",
    ],
    visual: <RiskVisual />,
  },
  {
    icon: ScrollText,
    eyebrow: "Audit Trails",
    title: "Tamper-proof Enterprise Audit Trails",
    description:
      "Every action — upload, review, approval, rejection — is cryptographically signed and immutably logged, ready for your next audit or regulatory inspection.",
    bullets: [
      "SHA-256 signed event log with timestamp and user attribution",
      "Exportable to PDF/Excel for external auditor submission",
      "Integrated with SEBI, MCA, and RBI compliance frameworks",
      "7-year retention with instant retrieval by expense ID or date range",
    ],
    visual: <AuditVisual />,
  },
  {
    icon: Upload,
    eyebrow: "Omni-channel Upload",
    title: "Upload Receipts via WhatsApp, Email, or Web",
    description:
      "Meet employees where they are. Send a WhatsApp message, forward an email, or drag-and-drop on the web — every channel routes to the same smart pipeline.",
    bullets: [
      "WhatsApp Business API integration — snap and send receipts",
      "Email forwarding inbox processes PDF and image attachments",
      "Drag-and-drop web uploader with real-time progress tracking",
      "Mobile apps for iOS and Android with camera capture",
    ],
    visual: <UploadVisual />,
  },
];

export default function FeaturesPage() {
  return (
    <div className="bg-[#0a0b0f] min-h-screen">
      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-mesh opacity-50" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(99,102,241,1) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,1) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-widest mb-6"
          >
            <Zap className="w-3.5 h-3.5" />
            Platform Features
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6"
          >
            Every Feature You Need to{" "}
            <span className="gradient-text">Stop Expense Fraud</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto mb-10"
          >
            From AI-powered OCR to tamper-proof audit trails — LEDGER AI gives
            your finance team every tool to audit expenses with surgical
            precision.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/auth/register"
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold hover:from-indigo-500 hover:to-blue-500 shadow-lg shadow-indigo-500/30 transition-all duration-200"
            >
              Start Free Trial
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/pricing"
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl border border-white/10 text-slate-300 font-semibold hover:bg-white/5 hover:text-white transition-all duration-200"
            >
              View Pricing
            </Link>
          </motion.div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 p-6 glass-card rounded-3xl"
          >
            {[
              { value: "99.4%", label: "OCR Accuracy" },
              { value: "87%", label: "Fraud Reduction" },
              { value: "2s", label: "Processing Time" },
              { value: "40+", label: "Risk Signals" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold gradient-text">{stat.value}</div>
                <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Feature sections */}
      <div className="divide-y divide-white/5">
        {features.map((feature, index) => (
          <FeatureSection key={feature.eyebrow} index={index} {...feature} />
        ))}
      </div>

      {/* Bottom CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-950/20 to-transparent" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass-card rounded-3xl p-12 border border-indigo-500/20"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-widest mb-6">
              <TrendingUp className="w-3.5 h-3.5" />
              Get Started Today
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Audit Smarter?
            </h2>
            <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
              Join 500+ enterprises already saving crores with AI-powered expense
              intelligence. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/auth/register"
                className="flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold text-lg hover:from-indigo-500 hover:to-blue-500 shadow-lg shadow-indigo-500/30 transition-all duration-200"
              >
                Start 14-Day Free Trial
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/contact"
                className="flex items-center gap-2 px-8 py-4 rounded-xl border border-white/10 text-slate-300 font-semibold text-lg hover:bg-white/5 hover:text-white transition-all duration-200"
              >
                Talk to Sales
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
