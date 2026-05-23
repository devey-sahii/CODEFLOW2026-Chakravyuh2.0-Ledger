"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import MagicRings from "@/components/ui/magic-rings";
import { LampDemo } from "@/components/ui/lamp";
import {
  ShieldCheck,
  ArrowRight,
  Zap,
  CheckCircle,
  FileSpreadsheet,
  AlertTriangle,
  Play,
  Check,
  TrendingUp,
  Cpu,
  Smartphone,
  Layers,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Company logos for marquee
const trustedCompanies = [
  "Tata Group",
  "Reliance",
  "Infosys",
  "Wipro",
  "HDFC Bank",
  "ICICI Bank",
  "Aditya Birla",
  "Mahindra",
];

const features = [
  {
    icon: Cpu,
    title: "AI OCR Parsing",
    desc: "Extract vendor names, line items, amounts, tax totals, and GSTINs with 99.4% accuracy.",
  },
  {
    icon: ShieldCheck,
    title: "Autonomous Audits",
    desc: "Verify corporate policy limits, duplicate invoices, and temporal anomalies instantly.",
  },
  {
    icon: Layers,
    title: "GST Reconciliation",
    desc: "Match your Input Tax Credit (ITC) with GSTR-2B filing schedules automatically.",
  },
  {
    icon: TrendingUp,
    title: "Risk Engine Scopes",
    desc: "Score claims from 0 to 100 based on employee historical profiles and category baselines.",
  },
  {
    icon: Smartphone,
    title: "WhatsApp Uploads",
    desc: "Let employees submit receipts via WhatsApp. Snap, send, and audit in seconds.",
  },
  {
    icon: Lock,
    title: "Audit Trail Ledgers",
    desc: "Secure compliance histories with cryptographically signed logs for SEBI and RBI audits.",
  },
];

const steps = [
  {
    num: "01",
    title: "Ingest Receipt",
    desc: "Employees submit receipts via Slack, WhatsApp, email attachments, or web dashboard.",
  },
  {
    num: "02",
    title: "AI OCR & Audits",
    desc: "Ledger AI processes the receipt, verifies GST details, and runs 40+ fraud algorithms.",
  },
  {
    num: "03",
    title: "Instant Decision",
    desc: "Claims matching all rules are approved instantly, and risks are routed for review.",
  },
];

const pricingPlans = [
  {
    name: "Starter",
    price: "₹2,999",
    desc: "Best for growing startups",
    features: ["250 receipts/month", "AI OCR extraction", "Basic duplicate checking", "Standard audit logs (3y)"],
    popular: false,
    cta: "Start Free Trial",
  },
  {
    name: "Professional",
    price: "₹7,999",
    desc: "Ideal for mid-market corporate teams",
    features: [
      "1,500 receipts/month",
      "Full ML fraud suite (40+ checks)",
      "GSTR-2B compliance reconciler",
      "WhatsApp & Slack submission channels",
      "Extended audit logs (7y)",
    ],
    popular: true,
    cta: "Start Free Trial",
  },
  {
    name: "Enterprise",
    price: "Custom",
    desc: "Complete corporate governance",
    features: ["Unlimited processing", "Dedicated account managers", "Custom ERP integrations", "Private cloud deployment"],
    popular: false,
    cta: "Contact Sales",
  },
];

const testimonials = [
  {
    quote: "Ledger AI completely restructured our finance controls. We reduced expense auditing lead times from 15 days to under a minute.",
    author: "Sanjay Sen",
    role: "VP of Finance",
    company: "Tata Enterprises",
  },
  {
    quote: "Our monthly tax audits used to miss substantial ITC claims. Ledger AI auto-reconciles GSTR-2B and pays for itself tenfold.",
    author: "Deepika R.",
    role: "Controller",
    company: "Reliance Retail",
  },
  {
    quote: "Detecting duplicate submissions across remote departments was impossible. Ledger's AI catches Split invoices seamlessly.",
    author: "Rohan D'Souza",
    role: "CFO",
    company: "HDFC Digital",
  },
];

const faqs = [
  {
    q: "What makes Ledger AI superior to traditional expense software?",
    a: "Standard software only tracks expenses; Ledger AI actively audits them. We use custom ML models to inspect receipts for duplicate tax invoices, edited images, and GSTIN registry status in under 2 seconds.",
  },
  {
    q: "How does the WhatsApp ingestion channel work?",
    a: "We provide your company with a verified WhatsApp Business number. Employees simply snap a picture of their bill and message it. Our OCR processes the image and posts it to their account automatically.",
  },
  {
    q: "Can we integrate this with SAP or NetSuite?",
    a: "Yes, our Enterprise tier offers bidirectional API sync for SAP, Oracle, NetSuite, Tally, and Zoho, importing verified expense entries directly into your ledger journals.",
  },
  {
    q: "Does it validate GSTIN registrations?",
    a: "Absolutely. Every time a receipt containing a GSTIN is uploaded, Ledger AI checks the Indian GST portal to verify the seller registration status, filing history, and matching tax rates.",
  },
];

export default function LandingPage() {
  const [accuracy, setAccuracy] = useState(90);

  useEffect(() => {
    const interval = setInterval(() => {
      setAccuracy((prev) => (prev < 99.4 ? +(prev + 0.3).toFixed(1) : 99.4));
    }, 40);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#0a0b0f] min-h-screen text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-white pb-24 overflow-x-hidden relative">
      {/* Magic Rings Background */}
      <div className="fixed inset-0 z-[-1] opacity-70">
        <MagicRings followMouse={true} mouseInfluence={0.5} />
      </div>

      <LampDemo />

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-28 pb-16 px-6">
        {/* Animated Gradient Mesh */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-blue-500/10 rounded-full blur-3xl opacity-60" />
          <div className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: "linear-gradient(rgba(99,102,241,1) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,1) 1px, transparent 1px)",
              backgroundSize: "60px 60px"
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto w-full grid lg:grid-cols-12 gap-12 items-center">
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold tracking-wider uppercase mx-auto lg:mx-0"
            >
              <Cpu className="w-3.5 h-3.5 animate-spin-slow" />
              AI-Powered Autonomous Auditing
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-6xl font-black text-white leading-tight tracking-tight"
            >
              Stop Expense Fraud.<br />
              Automate Compliance.<br />
              <span className="gradient-text">Save Millions.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed"
            >
              Verify employee receipts, detect invoice tampering, validate vendor GSTIN filings, and automate claims processing in real time.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4"
            >
              <Link href="/auth/register">
                <Button size="lg" className="w-full sm:w-auto font-semibold flex items-center gap-2">
                  Start 14-Day Free Trial
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline" className="w-full sm:w-auto font-semibold">
                  Calculate ROI
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Hero Right Visuals */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-5 relative"
          >
            {/* Main Mock UI card */}
            <div className="glass-card rounded-3xl p-6 border border-indigo-500/20 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent animate-scan-line" />
              
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="text-xs text-slate-500 font-mono">AUDIT_LOG // ACTIVE</div>
              </div>

              {/* Stats overview */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-slate-950 p-4 rounded-2xl border border-white/5">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Accuracy Meter</span>
                  <div className="text-2xl font-bold text-indigo-400 mt-1 font-mono">{accuracy}%</div>
                </div>
                <div className="bg-slate-950 p-4 rounded-2xl border border-white/5">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Fraud Protected</span>
                  <div className="text-2xl font-bold text-red-400 mt-1 font-mono">₹4,82,400</div>
                </div>
              </div>

              {/* Activity feed list */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between p-3 bg-red-500/5 border border-red-500/10 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span className="text-xs font-semibold text-slate-200">Duplicate invoice detected</span>
                  </div>
                  <span className="text-[10px] font-mono bg-red-500/20 text-red-400 px-2 py-0.5 rounded font-bold">FLAGGED</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-slate-200">GSTIN Verified: Tata Group</span>
                  </div>
                  <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">CLEAN</span>
                </div>
              </div>
            </div>

            {/* Float details */}
            <div className="absolute -top-6 -right-6 glass-card rounded-2xl p-4 border border-indigo-500/30 shadow-lg hidden sm:block">
              <span className="text-[10px] text-slate-500 block">Total Claims Processed</span>
              <span className="text-lg font-bold text-white font-mono">21,43,098</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trusted By Marquee */}
      <section className="py-12 border-y border-white/5 bg-slate-950/20 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-600 mb-6">
            Trusted by 500+ enterprises and growing finance departments
          </p>
          <div className="flex justify-center flex-wrap gap-8 sm:gap-16 items-center opacity-40">
            {trustedCompanies.map((comp) => (
              <span key={comp} className="text-base sm:text-lg font-bold text-white tracking-widest">
                {comp.toUpperCase()}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* AI Features Grid */}
      <section className="py-24 max-w-7xl mx-auto px-6 space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full text-xs font-semibold uppercase tracking-wider">
            Features Toolkit
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Complete Auditing Governance Suite</h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Eliminate operational vulnerabilities, capture missed Input Tax Credits, and expedite approvals.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card variant="default" className="h-full hover:border-indigo-500/30 transition-colors">
                  <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl w-fit mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-white font-bold text-lg">{feat.title}</h3>
                  <p className="text-slate-400 text-xs sm:text-sm mt-2 leading-relaxed">{feat.desc}</p>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* How It Works (Steps) */}
      <section className="py-20 bg-slate-950/40 border-y border-white/5 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full text-xs font-semibold uppercase tracking-wider">
              Step Pipeline
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Three Steps to Total Audits</h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
              How Ledger AI processes expense uploads automatically from ingestion to ERP accounting.
            </p>
          </div>

          <div className="grid gap-10 md:grid-cols-3 relative">
            {steps.map((st, idx) => (
              <div key={st.num} className="relative space-y-4 p-6 bg-slate-900/40 border border-white/5 rounded-2xl">
                <div className="text-3xl font-black text-indigo-500/20 font-mono">{st.num}</div>
                <h3 className="text-lg font-bold text-white">{st.title}</h3>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Counter Section */}
      <section className="py-20 max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 p-8 glass-card rounded-3xl border border-indigo-500/20">
          {[
            { value: "99.4%", label: "OCR Accuracy" },
            { value: "₹2.4 Cr+", label: "Capital Saved" },
            { value: "500+", label: "Active Corporates" },
            { value: "2.1M+", label: "Receipts Audited" },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <div className="text-3xl sm:text-4xl font-black gradient-text font-mono">{item.value}</div>
              <div className="text-xs text-slate-500 uppercase mt-2 tracking-wider font-semibold">{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 max-w-7xl mx-auto px-6 space-y-16">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white">Loved by Enterprise Finance Teams</h2>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((test) => (
            <Card key={test.author} variant="default" className="flex flex-col justify-between p-6">
              <p className="text-slate-300 text-sm italic leading-relaxed">"{test.quote}"</p>
              <div className="mt-6 border-t border-white/5 pt-4 flex justify-between items-center">
                <div>
                  <span className="text-sm font-bold text-white block">{test.author}</span>
                  <span className="text-xs text-slate-500">{test.role}</span>
                </div>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{test.company}</span>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 max-w-7xl mx-auto px-6 space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <h2 className="text-3xl font-bold text-white">Pricing That Fits Your Volume</h2>
          <p className="text-slate-400 text-xs sm:text-sm">Get started in minutes with our transparent plans. No setups required.</p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {pricingPlans.map((plan) => (
            <Card key={plan.name} variant={plan.popular ? "glow" : "default"} className="flex flex-col justify-between relative">
              {plan.popular && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-wider">
                  Popular Plan
                </span>
              )}
              <CardContent className="pt-6 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  <p className="text-slate-500 text-xs mt-1">{plan.desc}</p>
                </div>
                <div className="text-3xl font-black text-white font-mono">{plan.price}</div>
                <ul className="space-y-3">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2 text-xs text-slate-300">
                      <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardContent className="pb-6">
                <Link href="/auth/register">
                  <Button variant={plan.popular ? "primary" : "outline"} fullWidth>
                    {plan.cta}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20 max-w-4xl mx-auto px-6 space-y-12">
        <h2 className="text-3xl font-bold text-white text-center">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="p-6 bg-slate-900/40 border border-white/5 rounded-2xl space-y-2">
              <h3 className="text-base font-bold text-white flex gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-1" />
                {faq.q}
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed pl-6">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 max-w-5xl mx-auto px-6">
        <div className="glass-card rounded-3xl p-12 border border-indigo-500/20 text-center relative overflow-hidden bg-gradient-to-br from-indigo-900/10 via-blue-900/5 to-purple-900/10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
          <h2 className="text-3xl sm:text-4xl font-black text-white">Save Millions in Leakage & Compliance Audits</h2>
          <p className="mt-4 text-slate-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Join hundreds of enterprises optimizing corporate tax and auditing compliance with Ledger AI.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-8">
            <Link href="/auth/register">
              <Button size="lg" className="w-full sm:w-auto font-semibold">
                Start 14-Day Free Trial
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="w-full sm:w-auto font-semibold">
                Schedule Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
