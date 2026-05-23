'use client'

import { motion } from 'framer-motion'
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
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { cn } from '@/lib/utils'

const stats = [
  { label: 'Total Spend', value: '₹24.8L', change: '+12.5%', up: true, icon: TrendingUp, color: 'indigo' },
  { label: 'Fraud Detected', value: '₹3.2L', change: '-8.3%', up: false, icon: ShieldAlert, color: 'red' },
  { label: 'Claims Pending', value: '47', change: '+5', up: true, icon: Clock, color: 'yellow' },
  { label: 'Compliance Score', value: '91.4%', change: '+2.1%', up: true, icon: CheckCircle2, color: 'emerald' },
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

const recentActivity = [
  { id: 'EXP-2847', employee: 'Priya Sharma', amount: '₹12,400', category: 'Travel', status: 'flagged', risk: 78 },
  { id: 'EXP-2846', employee: 'Rahul Gupta', amount: '₹4,200', category: 'Meals', status: 'approved', risk: 12 },
  { id: 'EXP-2845', employee: 'Meera Joshi', amount: '₹28,500', category: 'Software', status: 'pending', risk: 34 },
  { id: 'EXP-2844', employee: 'Arjun Nair', amount: '₹6,800', category: 'Travel', status: 'approved', risk: 8 },
  { id: 'EXP-2843', employee: 'Kavita Reddy', amount: '₹15,200', category: 'Hardware', status: 'pending', risk: 45 },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const statusConfig: Record<string, { label: string; cls: string }> = {
  flagged: { label: 'Flagged', cls: 'bg-red-500/15 text-red-400 border-red-500/25' },
  approved: { label: 'Approved', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
  pending: { label: 'Pending', cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25' },
  rejected: { label: 'Rejected', cls: 'bg-red-500/15 text-red-400 border-red-500/25' },
}

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">Welcome back, Ankit. Here&apos;s your expense overview.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              AI Scanner Active
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {stats.map((stat, i) => {
            const Icon = stat.icon
            return (
              <motion.div key={i} variants={itemVariants} className="glass-card rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center',
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
                <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
              </motion.div>
            )
          })}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
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
            <ResponsiveContainer width="100%" height={200}>
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
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'rgba(15,17,23,0.95)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, color: '#e2e8f0', fontSize: 12 }} />
                <Area type="monotone" dataKey="spend" stroke="#6366f1" strokeWidth={2} fill="url(#spendGrad)" />
                <Area type="monotone" dataKey="fraud" stroke="#ef4444" strokeWidth={2} fill="url(#fraudGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Category pie */}
          <motion.div variants={itemVariants} className="glass-card rounded-2xl p-5">
            <h3 className="font-semibold text-white text-sm mb-1">By Category</h3>
            <p className="text-xs text-slate-500 mb-4">Expense distribution</p>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" strokeWidth={0}>
                  {categoryData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'rgba(15,17,23,0.95)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, color: '#e2e8f0', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-2">
              {categoryData.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                    <span className="text-slate-400">{cat.name}</span>
                  </div>
                  <span className="text-slate-300 font-medium">{cat.value}%</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Recent Expenses */}
        <motion.div variants={itemVariants} className="glass-card rounded-2xl overflow-hidden mt-4">
          <div className="flex items-center justify-between p-5 border-b border-slate-800">
            <h3 className="font-semibold text-white text-sm">Recent Expense Claims</h3>
            <a href="/expenses" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1">
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
          <div className="divide-y divide-slate-800/60">
            {recentActivity.map((exp) => {
              const sc = statusConfig[exp.status]
              return (
                <div key={exp.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-800/30 transition-colors">
                  <div className="text-xs font-mono text-slate-500 w-20 flex-shrink-0">{exp.id}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-200 truncate">{exp.employee}</div>
                    <div className="text-xs text-slate-500">{exp.category}</div>
                  </div>
                  <div className="text-sm font-semibold text-white">{exp.amount}</div>
                  <div className={cn('text-xs font-medium px-2 py-0.5 rounded-full border', sc.cls)}>{sc.label}</div>
                  <div className="w-24 hidden sm:block">
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full', exp.risk >= 60 ? 'bg-red-500' : exp.risk >= 40 ? 'bg-yellow-500' : 'bg-emerald-500')}
                          style={{ width: `${exp.risk}%` }}
                        />
                      </div>
                      <span className={cn('text-xs font-mono', exp.risk >= 60 ? 'text-red-400' : exp.risk >= 40 ? 'text-yellow-400' : 'text-emerald-400')}>
                        {exp.risk}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <motion.div variants={itemVariants} className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center"><Brain className="w-4.5 h-4.5 text-indigo-400" /></div>
              <div>
                <p className="text-sm font-semibold text-white">AI Processing</p>
                <p className="text-xs text-slate-500">Today&apos;s activity</p>
              </div>
            </div>
            <div className="space-y-2">
              {[['Receipts Scanned', '2,341'], ['Fraud Checks', '2,341'], ['GSTIN Verified', '847'], ['Duplicates Found', '12']].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-slate-500">{k}</span>
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
                <p className="text-xs text-slate-500">Current status</p>
              </div>
            </div>
            <div className="space-y-3">
              {[['GST Filing', 94], ['GSTIN Validity', 88], ['ITC Claims', 76], ['Vendor KYC', 91]].map(([k, v]) => (
                <div key={k}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">{k}</span>
                    <span className="text-white font-medium">{v}%</span>
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
                <p className="text-xs text-slate-500">Requires attention</p>
              </div>
            </div>
            <div className="space-y-2.5">
              {[
                { msg: '3 receipts with GSTIN mismatch', type: 'critical' },
                { msg: '5 duplicate invoice suspects', type: 'high' },
                { msg: '2 blacklisted vendor transactions', type: 'critical' },
                { msg: '8 weekend submissions flagged', type: 'medium' },
              ].map((a, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className={cn('w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0', a.type === 'critical' ? 'bg-red-400' : a.type === 'high' ? 'bg-orange-400' : 'bg-yellow-400')} />
                  <span className="text-xs text-slate-400">{a.msg}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
