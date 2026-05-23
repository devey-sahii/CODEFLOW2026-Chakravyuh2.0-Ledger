'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  TrendingUp,
  ShieldAlert,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Brain,
  Zap,
  Clock,
  ChevronRight,
  X,
  ShieldCheck,
  Check,
  Ban,
  Cpu
} from 'lucide-react'
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  CartesianGrid,
  XAxis,
  YAxis
} from 'recharts'
import { cn } from '@/lib/utils'
import { RiskMeter } from '@/components/ui/risk-meter'
import { Card, CardContent } from '@/components/ui/card'

const initialStats = [
  { label: 'Total Spend', value: '₹24.8L', change: '+12.5%', up: true, icon: TrendingUp, color: 'indigo', href: '/dashboard/expenses' },
  { label: 'Fraud Detected', value: '₹3.2L', change: '-8.3%', up: false, icon: ShieldAlert, color: 'red', href: '/dashboard/fraud' },
  { label: 'Claims Pending', value: '47', change: '+5', up: true, icon: Clock, color: 'yellow', href: '/dashboard/expenses' },
  { label: 'Compliance Score', value: '91.4%', change: '+2.1%', up: true, icon: CheckCircle2, color: 'emerald', href: '/dashboard/gst' },
]

const monthlyData = [
  { month: 'Nov', spend: 18.2, fraud: 1.2, approved: 16.1 },
  { month: 'Dec', spend: 22.4, fraud: 2.1, approved: 19.8 },
  { month: 'Jan', spend: 19.8, fraud: 0.9, approved: 18.2 },
  { month: 'Feb', spend: 21.3, fraud: 1.8, approved: 18.9 },
  { month: 'Mar', spend: 24.1, fraud: 2.4, approved: 21.0 },
  { month: 'Apr', spend: 23.7, fraud: 1.6, approved: 21.5 },
  { month: 'May', spend: 24.8, fraud: 3.2, approved: 20.9 },
]

const categoryData = [
  { name: 'Travel', value: 38, color: '#6366f1' },
  { name: 'Meals', value: 22, color: '#3b82f6' },
  { name: 'Software', value: 18, color: '#8b5cf6' },
  { name: 'Office', value: 12, color: '#06b6d4' },
  { name: 'Other', value: 10, color: '#475569' },
]

const initialRecentActivity = [
  { id: 'EXP-2847', employee: 'Priya Sharma', amount: '₹12,400', rawAmount: 12400, category: 'Travel', status: 'flagged', risk: 78, date: 'May 23, 2026', vendor: 'Taj Hotels Pvt Ltd', flags: ['GSTIN Format Error', 'Weekend lodging stay', 'Amount 34% above average'] },
  { id: 'EXP-2846', employee: 'Rahul Gupta', amount: '₹4,200', rawAmount: 4200, category: 'Meals', status: 'approved', risk: 12, date: 'May 22, 2026', vendor: 'SodaBottleOpenerWala', flags: [] },
  { id: 'EXP-2845', employee: 'Meera Joshi', amount: '₹28,500', rawAmount: 28500, category: 'Software', status: 'pending', risk: 34, date: 'May 22, 2026', vendor: 'AWS Cloud Services', flags: ['Subscription mismatch'] },
  { id: 'EXP-2844', employee: 'Arjun Nair', amount: '₹6,800', rawAmount: 6800, category: 'Travel', status: 'approved', risk: 8, date: 'May 21, 2026', vendor: 'Uber India Technologies', flags: [] },
  { id: 'EXP-2843', employee: 'Kavita Reddy', amount: '₹15,200', rawAmount: 15200, category: 'Hardware', status: 'pending', risk: 45, date: 'May 20, 2026', vendor: 'Croma Electronics', flags: ['Standard duplicate candidate'] },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

const statusConfig: Record<string, { label: string; cls: string }> = {
  flagged: { label: 'Flagged', cls: 'bg-red-500/15 text-red-400 border-red-500/25' },
  approved: { label: 'Approved', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
  pending: { label: 'Pending', cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25' },
  rejected: { label: 'Rejected', cls: 'bg-red-500/15 text-red-400 border-red-500/25' },
}

export default function DashboardPage() {
  const router = useRouter()
  const [recentActivity, setRecentActivity] = useState(initialRecentActivity)
  const [selectedClaim, setSelectedClaim] = useState<typeof initialRecentActivity[0] | null>(null)
  
  // Real-time telemetry scanner simulator
  const [scanCount, setScanCount] = useState(2341)
  const [fraudCount, setFraudCount] = useState(12)
  const [activeAlerts, setActiveAlerts] = useState([
    { msg: '3 receipts with GSTIN mismatch', type: 'critical', href: '/dashboard/gst' },
    { msg: '5 duplicate invoice suspects', type: 'high', href: '/dashboard/fraud' },
    { msg: '2 blacklisted vendor transactions', type: 'critical', href: '/dashboard/vendors' },
    { msg: '8 weekend submissions flagged', type: 'medium', href: '/dashboard/fraud' },
  ])

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate passive background OCR receipt checking
      setScanCount(prev => prev + Math.floor(Math.random() * 2) + 1)
      if (Math.random() > 0.95) {
        setFraudCount(prev => prev + 1)
      }
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const handleAction = (id: string, newStatus: 'approved' | 'flagged' | 'rejected') => {
    setRecentActivity(prev =>
      prev.map(item => (item.id === id ? { ...item, status: newStatus } : item))
    )
    if (selectedClaim && selectedClaim.id === id) {
      setSelectedClaim(prev => (prev ? { ...prev, status: newStatus } : null))
    }
  }

  return (
    <div className="space-y-6">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard Overview</h1>
            <p className="text-slate-400 text-xs mt-1">Autonomous ledger telemetry and AI invoice scanning insights.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              AI Core Scanning Live
            </div>
            <Link
              href="/dashboard/upload"
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-indigo-500/10"
            >
              Upload Receipt
            </Link>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {initialStats.map((stat, i) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={i}
                variants={itemVariants}
                onClick={() => router.push(stat.href)}
                className="glass-card rounded-2xl p-5 cursor-pointer hover:border-indigo-500/40 hover:shadow-[4px_4px_0px_0px_#6366f1] transition-all group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105',
                    stat.color === 'indigo' ? 'bg-indigo-500/15 text-indigo-400' :
                    stat.color === 'red' ? 'bg-red-500/15 text-red-400' :
                    stat.color === 'yellow' ? 'bg-yellow-500/15 text-yellow-400' :
                    'bg-emerald-500/15 text-emerald-400'
                  )}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <span className={cn('flex items-center gap-1 text-xs font-medium', stat.up ? 'text-emerald-400' : 'text-red-400')}>
                    {stat.up ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    {stat.change}
                  </span>
                </div>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                  <span>{stat.label}</span>
                  <span className="text-[10px] text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">Explore →</span>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Spend trend */}
          <motion.div variants={itemVariants} className="glass-card rounded-2xl p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-white text-sm">Monthly Spend Trend</h3>
                <p className="text-xs text-slate-500">Last 7 months • in Lakhs (₹)</p>
              </div>
              <div className="flex gap-3 text-xs">
                <span className="flex items-center gap-1 text-indigo-400"><span className="w-2 h-2 rounded bg-indigo-400 inline-block" />Spend</span>
                <span className="flex items-center gap-1 text-red-400"><span className="w-2 h-2 rounded bg-red-400 inline-block" />Fraud</span>
              </div>
            </div>
            <div className="h-[200px] w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="fraudGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" />
                  <XAxis dataKey="month" stroke="#475569" />
                  <YAxis stroke="#475569" />
                  <Tooltip contentStyle={{ background: 'rgba(15,17,23,0.95)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, color: '#e2e8f0', fontSize: 12 }} />
                  <Area type="monotone" dataKey="spend" stroke="#6366f1" strokeWidth={2} fill="url(#spendGrad)" />
                  <Area type="monotone" dataKey="fraud" stroke="#ef4444" strokeWidth={2} fill="url(#fraudGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Category pie */}
          <motion.div variants={itemVariants} className="glass-card rounded-2xl p-5">
            <h3 className="font-semibold text-white text-sm mb-1">By Category</h3>
            <p className="text-xs text-slate-500 mb-4">Expense distribution</p>
            <div className="h-[160px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" strokeWidth={0}>
                    {categoryData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'rgba(15,17,23,0.95)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, color: '#e2e8f0', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5 mt-2">
              {categoryData.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                    <span className="text-slate-400 font-medium">{cat.name}</span>
                  </div>
                  <span className="text-slate-300 font-semibold">{cat.value}%</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Recent Expenses */}
        <motion.div variants={itemVariants} className="glass-card rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-slate-800">
            <div>
              <h3 className="font-semibold text-white text-sm">Recent Expense Claims</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Click any claim row to load dynamic AI risk logs and direct approval controls.</p>
            </div>
            <Link href="/dashboard/expenses" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1">
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-800/60">
            {recentActivity.map((exp) => {
              const sc = statusConfig[exp.status]
              return (
                <div
                  key={exp.id}
                  onClick={() => setSelectedClaim(exp)}
                  className={cn(
                    "flex items-center gap-4 px-5 py-3.5 hover:bg-slate-800/30 transition-colors cursor-pointer",
                    selectedClaim?.id === exp.id ? "bg-slate-800/40" : ""
                  )}
                >
                  <div className="text-xs font-mono text-slate-500 w-20 flex-shrink-0">{exp.id}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-200 truncate">{exp.employee}</div>
                    <div className="text-xs text-slate-500">{exp.category} • {exp.vendor}</div>
                  </div>
                  <div className="text-sm font-bold text-white">{exp.amount}</div>
                  <div className={cn('text-xs font-medium px-2.5 py-0.5 rounded-full border shrink-0', sc.cls)}>{sc.label}</div>
                  <div className="w-24 hidden sm:block">
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full', exp.risk >= 60 ? 'bg-red-500' : exp.risk >= 40 ? 'bg-yellow-500' : 'bg-emerald-500')}
                          style={{ width: `${exp.risk}%` }}
                        />
                      </div>
                      <span className={cn('text-xs font-mono font-bold', exp.risk >= 60 ? 'text-red-400' : exp.risk >= 40 ? 'text-yellow-400' : 'text-emerald-400')}>
                        {exp.risk}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div variants={itemVariants} className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center"><Brain className="w-4.5 h-4.5 text-indigo-400" /></div>
              <div>
                <p className="text-sm font-semibold text-white">AI Processing</p>
                <p className="text-xs text-slate-500">Live Telemetry Metrics</p>
              </div>
            </div>
            <div className="space-y-2">
              {[
                ['Receipts Scanned', scanCount.toLocaleString()],
                ['Fraud Checks Run', scanCount.toLocaleString()],
                ['GSTIN Verified', '847'],
                ['Duplicates Found', '12']
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">{k}</span>
                  <span className="text-white font-semibold">{v}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center"><Zap className="w-4.5 h-4.5 text-emerald-400" /></div>
              <div>
                <p className="text-sm font-semibold text-white">Compliance Health</p>
                <p className="text-xs text-slate-500">Current audit metrics</p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                ['GST Filing Status', 94],
                ['GSTIN Validity Rate', 88],
                ['ITC Credits Claims', 76],
                ['Active Vendor KYC', 91]
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400 font-medium">{k}</span>
                    <span className="text-white font-bold">{v}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" style={{ width: `${v as number}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-red-500/15 flex items-center justify-center"><AlertTriangle className="w-4.5 h-4.5 text-red-400" /></div>
              <div>
                <p className="text-sm font-semibold text-white">Active Alerts</p>
                <p className="text-xs text-slate-500">Action requested</p>
              </div>
            </div>
            <div className="space-y-2.5">
              {activeAlerts.map((a, i) => (
                <Link
                  key={i}
                  href={a.href}
                  className="flex items-start gap-2.5 p-1 rounded hover:bg-white/5 transition-all block group"
                >
                  <span className={cn('w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0', a.type === 'critical' ? 'bg-red-400 animate-ping' : a.type === 'high' ? 'bg-orange-400' : 'bg-yellow-400')} />
                  <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors flex-1">{a.msg}</span>
                  <span className="text-[10px] text-slate-600 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all">Audit →</span>
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Side-Over Review Drawer */}
      <AnimatePresence>
        {selectedClaim && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedClaim(null)}
              className="fixed inset-0 bg-black z-40"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl z-50 p-6 flex flex-col justify-between overflow-y-auto"
            >
              <div className="space-y-6">
                {/* Drawer Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-xs font-mono text-slate-500">{selectedClaim.id}</span>
                    <h3 className="text-white font-bold text-base mt-0.5">Audit Claim Details</h3>
                  </div>
                  <button
                    onClick={() => setSelectedClaim(null)}
                    className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Risk Profiler */}
                <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center">
                  <span className="text-xs font-semibold text-slate-400 mb-3">Composite AI Fraud Risk</span>
                  <RiskMeter score={selectedClaim.risk} size={110} strokeWidth={8} />
                </div>

                {/* Info Fields */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-slate-500 font-bold uppercase">Employee</p>
                    <p className="text-white font-semibold mt-1">{selectedClaim.employee}</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-slate-500 font-bold uppercase">Amount</p>
                    <p className="text-white font-bold mt-1 text-sm">{selectedClaim.amount}</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-slate-500 font-bold uppercase">Category</p>
                    <p className="text-white font-semibold mt-1">{selectedClaim.category}</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-slate-500 font-bold uppercase">Vendor Merchant</p>
                    <p className="text-white font-semibold mt-1 truncate">{selectedClaim.vendor}</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5 col-span-2">
                    <p className="text-slate-500 font-bold uppercase">Submission Date</p>
                    <p className="text-white font-semibold mt-1">{selectedClaim.date}</p>
                  </div>
                </div>

                {/* Flags list */}
                {selectedClaim.flags.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">AI Anomaly Flag Alerts</p>
                    <div className="space-y-1.5">
                      {selectedClaim.flags.map((flag, idx) => (
                        <div key={idx} className="flex gap-2 p-2.5 bg-red-500/5 border border-red-500/10 rounded-xl">
                          <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5 animate-pulse" />
                          <span className="text-xs text-red-300 font-medium">{flag}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Audit Checklist */}
                <div className="space-y-2.5 border-t border-slate-800 pt-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">OCR Validation Integrity Checklist</p>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-300">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>OCR confidence signature matching ({selectedClaim.risk < 50 ? '98.2%' : '84.5%'})</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>Duplicate database search (Clean 90-day scan)</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>GSTIN valid and corporate verified</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons inside drawer */}
              <div className="flex gap-2 border-t border-slate-800 pt-4 mt-6">
                <button
                  onClick={() => handleAction(selectedClaim.id, 'rejected')}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <Ban className="h-4 w-4 shrink-0" />
                  Reject
                </button>
                <button
                  onClick={() => handleAction(selectedClaim.id, 'flagged')}
                  className="flex-1 py-3 bg-orange-600/20 border border-orange-500/30 hover:bg-orange-600/30 text-orange-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  Flag
                </button>
                <button
                  onClick={() => handleAction(selectedClaim.id, 'approved')}
                  className="flex-[2] py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/10"
                >
                  <Check className="h-4 w-4 shrink-0" />
                  Approve Claim
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
