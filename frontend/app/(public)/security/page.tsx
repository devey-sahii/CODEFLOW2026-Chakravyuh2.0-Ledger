"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Lock, Eye, Key, FileCheck, CheckCircle2, Info, ChevronDown, Check, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const securityStandards = [
  {
    title: "Military-Grade Encryption",
    desc: "All files and database values are protected under industrial cryptography.",
    icon: Lock,
    details: [
      "AES-256 symmetric encryption at rest for database tables",
      "TLS 1.3 encryption with Perfect Forward Secrecy in transit",
      "Cryptographic SHA-256 checksums on receipt image binaries",
      "Strict Key Management System (KMS) with automated rotation",
    ],
  },
  {
    title: "RBI Guidelines Compliance",
    desc: "Strict compliance with Reserve Bank of India data localization and credit card processing directives.",
    icon: ShieldCheck,
    details: [
      "100% Indian Data Residency (hosted on AWS Mumbai region)",
      "Strict merchant card tokenization compliant with RBI COFT rules",
      "Multi-factor authentication (MFA) required on all administrative access",
      "Continuous logging & 180-day retention on system access",
    ],
  },
  {
    title: "Role-Based Access Control (RBAC)",
    desc: "Granular access rules separating employees, finance approvers, and auditors.",
    icon: Key,
    details: [
      "Least-privileged access controls mapping directly to employee roles",
      "Temporary role escalation for emergency support (JIT credentials)",
      "Automatic session terminations and OAuth2 JWT refresh timers",
      "Cryptographically signed audit logs for every system event",
    ],
  },
];

const checklistItems = [
  {
    id: "soc2-1",
    title: "Security & Access Controls",
    desc: "Multi-factor authentication, firewalls, and active Intrusion Detection Systems (IDS).",
    status: "Implemented",
  },
  {
    id: "soc2-2",
    title: "Data Confidentiality",
    desc: "Encryption of client databases at rest and TLS transmission channels.",
    status: "Implemented",
  },
  {
    id: "soc2-3",
    title: "System Availability Controls",
    desc: "Multi-zone AWS failovers, automated database backups, and DDoS mitigation.",
    status: "Implemented",
  },
  {
    id: "soc2-4",
    title: "Change Management Procedures",
    desc: "Rigorous CI/CD pipelines, automated testing, and peer-reviewed code policies.",
    status: "Implemented",
  },
  {
    id: "soc2-5",
    title: "Incident Response Framework",
    desc: "24/7 automated monitoring, detailed runbooks, and defined SLA alerts.",
    status: "Implemented",
  },
];

export default function SecurityPage() {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({
    "soc2-1": true,
    "soc2-2": true,
    "soc2-3": true,
  });

  const toggleCheck = (id: string) => {
    setCheckedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const percentageChecked = Math.round(
    (Object.values(checkedItems).filter(Boolean).length / checklistItems.length) * 100
  );

  return (
    <div className="bg-[#0a0b0f] min-h-screen text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-white pb-24 overflow-x-hidden">
      {/* Background radial glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Hero section */}
      <section className="pt-24 pb-12 text-center max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-xs font-semibold uppercase tracking-wider mb-6"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Enterprise Trust Center
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight"
        >
          Bank-Grade Security <br />
          <span className="gradient-text">By Default</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6 text-slate-400 text-lg max-w-2xl mx-auto"
        >
          Your compliance and financial integrity are our top priority. We protect your company with SOC 2 policies and RBI localization protocols.
        </motion.p>
      </section>

      {/* Grid of standards */}
      <section className="max-w-7xl mx-auto px-6 grid gap-8 md:grid-cols-3 mt-12">
        {securityStandards.map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * idx }}
            >
              <Card variant="default" className="h-full flex flex-col justify-between">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
                    <Icon className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-xl font-bold">{item.title}</CardTitle>
                  <CardDescription className="mt-2 text-slate-400 text-xs sm:text-sm">
                    {item.desc}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <ul className="space-y-3">
                    {item.details.map((detail, dIdx) => (
                      <li key={dIdx} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-300 text-xs sm:text-sm">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </section>

      {/* Security Architecture Visualizer */}
      <section className="max-w-4xl mx-auto px-6 mt-28">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card rounded-3xl p-8 border border-indigo-500/20 text-center"
        >
          <div className="flex items-center gap-2 justify-center text-indigo-400 mb-1">
            <Lock className="w-5 h-5 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest">Architectural Flow</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Cryptographic Pipeline Validation</h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto mb-10">
            How Ledger AI ingest, validates, and seals financial records.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-indigo-500/30 via-indigo-500/10 to-indigo-500/30 -translate-y-1/2 z-0" />

            {[
              { label: "1. Receipt Ingestion", desc: "HTTPS / TLS 1.3 channel to API Gateway", sub: "AES-256 encryption at gate" },
              { label: "2. Sandboxed OCR Extraction", desc: "Transient memory parser container", sub: "Data scrubbed post-extraction" },
              { label: "3. ML Fraud Analysis", desc: "Anonymized token data processing", sub: "No PII data shared with models" },
              { label: "4. Immutable Ledger Entry", desc: "Cryptographic SHA signature applied", sub: "Stored in RDS Mumbai" },
            ].map((step, idx) => (
              <div key={idx} className="bg-slate-950 p-5 rounded-2xl border border-white/5 relative z-10 hover:border-indigo-500/30 transition-colors">
                <div className="w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-mono text-xs font-bold mx-auto mb-3">
                  {idx + 1}
                </div>
                <div className="text-sm font-semibold text-white mb-1.5">{step.label}</div>
                <div className="text-xs text-slate-500 leading-relaxed mb-2">{step.desc}</div>
                <div className="text-[10px] text-indigo-400/80 font-medium font-mono">{step.sub}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Interactive SOC 2 Checklist */}
      <section className="max-w-4xl mx-auto px-6 mt-28">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card rounded-3xl p-8 border border-indigo-500/20"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-white/5">
            <div>
              <div className="flex items-center gap-2 text-indigo-400 mb-1">
                <FileCheck className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-widest">Compliance Tracker</span>
              </div>
              <h2 className="text-2xl font-bold text-white">Interactive SOC 2 Security Checklist</h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">Audit our compliance roadmap. Select boxes to verify requirements.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-400 text-xs">Overall Compliance:</span>
              <div className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-300 font-mono text-sm font-bold">
                {percentageChecked}% SECURE
              </div>
            </div>
          </div>

          {/* Checklist Items */}
          <div className="mt-8 space-y-4">
            {checklistItems.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleCheck(item.id)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${
                  checkedItems[item.id]
                    ? "bg-slate-900/60 border-indigo-500/30"
                    : "bg-slate-950/20 border-white/5 opacity-60 hover:opacity-80"
                }`}
              >
                <div className="flex items-start gap-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCheck(item.id);
                    }}
                    className={`w-5 h-5 rounded border flex items-center justify-center mt-0.5 transition-colors ${
                      checkedItems[item.id]
                        ? "bg-indigo-500 border-indigo-400 text-white"
                        : "border-slate-600 group-hover:border-slate-500 text-transparent"
                    }`}
                    aria-label={`Mark ${item.title} as completed`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-white">{item.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    checkedItems[item.id]
                      ? "bg-indigo-500/15 text-indigo-400"
                      : "bg-slate-800 text-slate-400"
                  }`}>
                    {checkedItems[item.id] ? "COMPLIANT" : "PENDING REVIEW"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-start gap-2.5 p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl text-xs text-slate-400">
            <Info className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
            <span>
              All listed checklists reflect real policies running on Ledger AI infrastructure. External audit validations are scheduled semi-annually.
            </span>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
