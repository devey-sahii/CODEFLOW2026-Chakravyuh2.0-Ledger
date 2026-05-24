"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, HelpCircle, ArrowRight, Zap, Flame, Building2, Calculator, Percent, Sparkles, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const pricingTiers = [
  {
    name: "Starter",
    price: "₹2,999",
    period: "month",
    description: "Ideal for growing startups and small enterprises",
    features: [
      "Up to 250 receipts processed/mo",
      "AI OCR extraction (99.4% accuracy)",
      "Basic duplicate invoice check",
      "GSTIN format validation",
      "Email and Slack notifications",
      "Standard audit trail logs (3 years)",
    ],
    cta: "Start 14-Day Trial",
    href: "/signup?plan=starter",
    popular: false,
    color: "indigo",
  },
  {
    name: "Professional",
    price: "₹7,999",
    period: "month",
    description: "Most popular for mid-sized corporate teams",
    features: [
      "Up to 1,500 receipts processed/mo",
      "Full ML fraud detection (40+ signals)",
      "Auto GSTIN verification & GSTR-2B sync",
      "Input Tax Credit (ITC) eligibility checking",
      "Zustand multi-user dashboard integration",
      "WhatsApp & Email receipt ingestion",
      "Extended audit trail logs (7 years)",
      "Priority customer support (under 4h)",
    ],
    cta: "Start 14-Day Trial",
    href: "/signup?plan=professional",
    popular: true,
    color: "blue",
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Complete compliance suite for global corporations",
    features: [
      "Unlimited receipts processed/mo",
      "Custom ML rules & policy enforcement",
      "Real-time ERP integrations (SAP, Oracle)",
      "Dedicated account manager",
      "RBI & MCA audit readiness reporting",
      "Cryptographic SHA-256 ledger signing",
      "SLA guarantee: 99.99% uptime",
      "Self-hosted / Private cloud deploy option",
    ],
    cta: "Contact Sales",
    href: "/contact",
    popular: false,
    color: "purple",
  },
];

const faqs = [
  {
    q: "How does the 14-day free trial work?",
    a: "You can sign up without a credit card and get immediate access to all features of the Starter or Professional plans. You'll be limited to 50 test receipts during the trial period.",
  },
  {
    q: "What is Input Tax Credit (ITC) reclamation?",
    a: "Under Indian GST, companies can deduct tax paid on business purchases (receipts) from tax owed on sales. Ledger AI auto-reconciles your employee receipts against GSTR-2B to ensure you never miss claiming these refunds, which average 18% of business expenditures.",
  },
  {
    q: "How secure is our financial data?",
    a: "We use bank-grade AES-256 encryption at rest and TLS 1.3 in transit. We are fully SOC 2 Type II compliant, RBI-ready, and never store raw passwords or unmasked vendor credit card details.",
  },
  {
    q: "Can we change plans or cancel at any time?",
    a: "Yes, you can upgrade, downgrade, or cancel your subscription directly from your organization settings page. Downgrades take effect at the end of the current billing cycle.",
  },
  {
    q: "Is there a limit on users or employees?",
    a: "No, all plans support unlimited employees who can submit receipts via the web dashboard or WhatsApp. Pricing is purely transactional based on the number of processed receipts.",
  },
];

export default function PricingPage() {
  const [monthlySpend, setMonthlySpend] = useState(500000); // Default 5L INR
  const [isAnnual, setIsAnnual] = useState(false);

  // Compute ROI
  const averageGst = 0.18; // 18% average
  const typicalMissedItc = 0.12; // 12% of GST typically missed in manual auditing
  const fraudRate = 0.024; // 2.4% typical expense fraud rate

  const yearlySpend = monthlySpend * 12;
  const annualGstAmount = yearlySpend * averageGst;
  const annualItcSaved = annualGstAmount * typicalMissedItc;
  const annualFraudSaved = yearlySpend * fraudRate;
  const totalAnnualSavings = annualItcSaved + annualFraudSaved;

  const getPriceMultiplier = (priceStr: string) => {
    if (priceStr === "Custom") return priceStr;
    const numVal = parseInt(priceStr.replace(/[^\d]/g, ""), 10);
    const calculated = isAnnual ? Math.round(numVal * 0.8) : numVal;
    return `₹${calculated.toLocaleString("en-IN")}`;
  };

  return (
    <div className="bg-[#0a0b0f] min-h-screen text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-white pb-24 overflow-x-hidden">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-20 left-1/4 w-[400px] h-[400px] bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Hero section */}
      <section className="relative pt-24 pb-12 text-center max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full text-xs font-semibold uppercase tracking-wider mb-6"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Simple, Transactional Pricing
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight"
        >
          Plans That Scale With <span className="gradient-text">Your Spend</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6 text-slate-400 text-lg max-w-2xl mx-auto"
        >
          Choose a plan based on your monthly auditing needs. Enjoy a 20% discount on yearly subscriptions.
        </motion.p>

        {/* Toggle billing */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-10 flex items-center justify-center gap-4"
        >
          <span className={`text-sm ${!isAnnual ? "text-white font-semibold" : "text-slate-400"}`}>Monthly</span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className="w-12 h-6 rounded-full bg-slate-800 border border-slate-700 p-0.5 transition-colors relative"
            aria-label="Toggle annual billing"
          >
            <div
              className={`w-5 h-5 rounded-full bg-indigo-500 transition-all ${
                isAnnual ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
          <span className={`text-sm flex items-center gap-1.5 ${isAnnual ? "text-white font-semibold" : "text-slate-400"}`}>
            Yearly
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              Save 20%
            </span>
          </span>
        </motion.div>
      </section>

      {/* Pricing Cards Grid */}
      <section className="max-w-7xl mx-auto px-6 grid gap-8 md:grid-cols-3 mt-8">
        {pricingTiers.map((tier, idx) => {
          const priceDisplay = getPriceMultiplier(tier.price);
          return (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * idx }}
              className="relative"
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-indigo-500 text-white text-xs font-bold flex items-center gap-1 shadow-lg shadow-indigo-500/30 z-10 border border-indigo-400">
                  <Flame className="w-3.5 h-3.5 fill-white" />
                  Most Popular
                </div>
              )}

              <Card
                variant={tier.popular ? "glow" : "default"}
                className={`h-full flex flex-col justify-between border-t-2 ${
                  tier.popular ? "border-t-indigo-500" : "border-t-slate-700"
                }`}
              >
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    {tier.name}
                    {tier.name === "Professional" && <Zap className="w-5 h-5 text-indigo-400" />}
                    {tier.name === "Enterprise" && <Building2 className="w-5 h-5 text-purple-400" />}
                  </CardTitle>
                  <CardDescription className="mt-2 text-slate-400 text-sm">
                    {tier.description}
                  </CardDescription>

                  <div className="mt-6 flex items-baseline gap-1.5 text-white">
                    <span className="text-4xl sm:text-5xl font-black">{priceDisplay}</span>
                    {tier.period && (
                      <span className="text-slate-500 text-sm">/ {tier.period}</span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-2 flex-grow">
                  <ul className="space-y-4 mt-4">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-300 text-xs sm:text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="pt-6">
                  <Link href={tier.href} className="w-full">
                    <Button
                      variant={tier.popular ? "primary" : "outline"}
                      fullWidth
                      className="group"
                    >
                      {tier.cta}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </motion.div>
          );
        })}
      </section>

      {/* GST Refund & ROI Calculator */}
      <section className="max-w-4xl mx-auto px-6 mt-28">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card rounded-3xl p-8 border border-indigo-500/20 relative overflow-hidden"
        >
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
              backgroundSize: "20px 20px"
            }}
          />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-white/5">
            <div>
              <div className="flex items-center gap-2 text-indigo-400 mb-1">
                <Calculator className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-widest">Savings ROI Engine</span>
              </div>
              <h2 className="text-2xl font-bold text-white">Interactive GST Refund & ROI Calculator</h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">Estimate the capital saved by reclaiming missed GST Input Tax Credits (ITC).</p>
            </div>
            <div className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-300 font-mono text-sm flex items-center gap-1.5 whitespace-nowrap">
              <TrendingUp className="w-4 h-4" />
              Est. ~12x ROI
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-10 mt-8">
            {/* Input Slider */}
            <div className="space-y-6 flex flex-col justify-center">
              <div>
                <label htmlFor="spend-range" className="text-sm font-semibold text-white flex justify-between mb-2">
                  <span>Monthly Corporate Expense Spend:</span>
                  <span className="font-mono text-indigo-400">₹{monthlySpend.toLocaleString("en-IN")}</span>
                </label>
                <input
                  id="spend-range"
                  type="range"
                  min="50000"
                  max="10000000"
                  step="50000"
                  value={monthlySpend}
                  onChange={(e) => setMonthlySpend(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 border border-slate-700"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-2 font-mono">
                  <span>₹50K</span>
                  <span>₹50L</span>
                  <span>₹1Cr</span>
                </div>
              </div>

              <div className="p-4 bg-slate-900/60 rounded-2xl border border-white/5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">GST Reclamation Accuracy:</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1 font-mono">
                    <Percent className="w-3 h-3" />
                    99.4%
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Standard GST Rate Applied:</span>
                  <span className="text-slate-200 font-mono">18% Average</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Audited Compliance Level:</span>
                  <span className="text-indigo-400 font-semibold font-mono">100% Tax Compliant</span>
                </div>
              </div>
            </div>

            {/* Calculations Result */}
            <div className="space-y-4">
              <div className="p-5 bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 rounded-2xl border border-indigo-500/20">
                <div className="text-slate-400 text-xs uppercase tracking-widest font-semibold">Annual Tax Credits Recaptured</div>
                <div className="text-3xl sm:text-4xl font-black text-white mt-1.5 font-mono">
                  ₹{Math.round(annualItcSaved).toLocaleString("en-IN")}
                </div>
                <div className="text-xs text-indigo-400 mt-1 flex items-center gap-1 font-mono">
                  <span>~12% of total business GST</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-900 rounded-2xl border border-white/5">
                  <div className="text-slate-500 text-xs">Fraud Prevented</div>
                  <div className="text-lg font-bold text-red-400 mt-1 font-mono">
                    ₹{Math.round(annualFraudSaved).toLocaleString("en-IN")}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">2.4% typical losses</div>
                </div>

                <div className="p-4 bg-slate-900 rounded-2xl border border-white/5">
                  <div className="text-slate-500 text-xs">Total Annual Savings</div>
                  <div className="text-lg font-bold text-emerald-400 mt-1 font-mono">
                    ₹{Math.round(totalAnnualSavings).toLocaleString("en-IN")}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">ITC + Fraud Guard</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="max-w-4xl mx-auto px-6 mt-28">
        <h2 className="text-3xl font-bold text-white text-center mb-12">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="p-6 bg-slate-900/40 border border-white/5 rounded-2xl"
            >
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                {faq.q}
              </h3>
              <p className="mt-3 text-slate-400 text-sm leading-relaxed pl-7">{faq.a}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
