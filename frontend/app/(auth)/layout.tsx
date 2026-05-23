"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import {
  ShieldCheck,
  Zap,
  TrendingUp,
  Brain,
  ArrowUpRight,
  CheckCircle2,
  Lock,
  BarChart3,
  Activity,
} from "lucide-react";
import { LampContainer } from "@/components/ui/lamp";
import SplashScreen from "@/components/ui/splash-screen";

const trustPoints = [
  {
    icon: <ShieldCheck className="w-5 h-5" />,
    title: "Bank-Grade Security",
    desc: "256-bit AES encryption & SOC 2 Type II certified",
  },
  {
    icon: <Brain className="w-5 h-5" />,
    title: "AI-Powered Fraud Detection",
    desc: "99.4% accuracy with real-time anomaly detection",
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: "Instant GST Reconciliation",
    desc: "Auto-reconcile with GSTN portal in seconds",
  },
];

const floatingMetrics = [
  {
    label: "Expenses Audited",
    value: "₹2.4Cr",
    change: "+12.5%",
    icon: <BarChart3 className="w-4 h-4" />,
    color: "from-indigo-500/20 to-blue-500/20",
    borderColor: "border-indigo-500/30",
    delay: 0,
  },
  {
    label: "Fraud Prevented",
    value: "₹48.2L",
    change: "+8.3%",
    icon: <ShieldCheck className="w-4 h-4" />,
    color: "from-emerald-500/20 to-teal-500/20",
    borderColor: "border-emerald-500/30",
    delay: 0.2,
  },
  {
    label: "AI Risk Score",
    value: "94.2%",
    change: "↑2.1%",
    icon: <Activity className="w-4 h-4" />,
    color: "from-violet-500/20 to-purple-500/20",
    borderColor: "border-violet-500/30",
    delay: 0.4,
  },
  {
    label: "Claims Processed",
    value: "1,247",
    change: "This month",
    icon: <TrendingUp className="w-4 h-4" />,
    color: "from-cyan-500/20 to-blue-500/20",
    borderColor: "border-cyan-500/30",
    delay: 0.6,
  },
];

const floatAnimation = {
  y: [0, -8, 0],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut" as const,
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showSplash, setShowSplash] = useState(true);

  // When splash is true, delay layout animations until splash slides up (approx 2.4s)
  const globalDelay = showSplash ? 2.4 : 0;

  return (
    <>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <div className="min-h-screen flex bg-[#0a0b0f]">
      {/* LEFT BRAND PANEL */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col">
        {/* Background Lamp Effect */}
        <div className="absolute inset-0 overflow-hidden bg-slate-950">
          <LampContainer className="absolute inset-0 z-0 h-full w-full min-h-0 bg-transparent -translate-y-64 scale-110">
             <div className="hidden" />
          </LampContainer>
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.04] z-10 pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(rgba(99,102,241,1) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,1) 1px, transparent 1px)",
              backgroundSize: "50px 50px",
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col h-full p-10 xl:p-14">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: globalDelay }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-white tracking-tight">
                LEDGER
              </span>
              <span className="ml-1 text-xs text-indigo-400 font-medium tracking-widest uppercase">
                AI
              </span>
            </div>
          </motion.div>

          {/* Main headline */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 + globalDelay }}
            className="mt-16 xl:mt-20"
          >
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
              Smart Expense
              <br />
              <span className="gradient-text">Auditing Powered</span>
              <br />
              by Artificial Intelligence
            </h1>
            <p className="mt-4 text-slate-400 text-lg leading-relaxed max-w-md">
              Detect fraud, ensure GST compliance, and get AI-driven insights
              for your enterprise expenses — all in one platform.
            </p>
          </motion.div>

          {/* Floating metrics */}
          <div className="mt-12 grid grid-cols-2 gap-3">
            {floatingMetrics.map((metric, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 + metric.delay + globalDelay }}
              >
                <motion.div
                  animate={floatAnimation}
                  style={{ animationDelay: `${metric.delay}s` }}
                  className={`glass-card rounded-2xl p-4 bg-gradient-to-br ${metric.color} border ${metric.borderColor}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400 text-xs font-medium">
                      {metric.label}
                    </span>
                    <div className="text-indigo-400">{metric.icon}</div>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {metric.value}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400 text-xs font-medium">
                      {metric.change}
                    </span>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>

          {/* Trust points */}
          <div className="mt-10 space-y-4">
            {trustPoints.map((point, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.8 + i * 0.1 + globalDelay }}
                className="flex items-start gap-3"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  {point.icon}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-200">
                    {point.title}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {point.desc}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.2 + globalDelay }}
            className="mt-auto pt-8 flex items-center gap-4 flex-wrap"
          >
            {["SOC 2 Type II", "ISO 27001", "GDPR Ready", "GST Compliant"].map(
              (badge) => (
                <div
                  key={badge}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/60 border border-slate-700/50 text-xs text-slate-400"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  {badge}
                </div>
              )
            )}
          </motion.div>

          {/* Vertical line decoration */}
          <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-indigo-500/20 to-transparent" />
        </div>
      </div>

      {/* RIGHT FORM PANEL */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 lg:px-12 xl:px-16 relative">
        {/* Background */}
        <div className="absolute inset-0 bg-[#0a0b0f]">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-900/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-900/10 rounded-full blur-3xl" />
        </div>

        {/* Mobile logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:hidden flex items-center gap-2 mb-8 relative z-10"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">LEDGER AI</span>
        </motion.div>

        <div className="w-full max-w-md relative z-10">
          <AnimatePresence mode="wait">{children}</AnimatePresence>
        </div>

        {/* Bottom lock indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 + globalDelay }}
          className="mt-8 flex items-center gap-2 text-xs text-slate-600 relative z-10"
        >
          <Lock className="w-3 h-3" />
          <span>Secured with TLS 1.3 encryption</span>
        </motion.div>
      </div>
    </div>
    </>
  );
}
