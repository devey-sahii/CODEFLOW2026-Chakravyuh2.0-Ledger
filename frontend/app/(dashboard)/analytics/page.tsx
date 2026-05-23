'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts'
import { Calendar, BrainCircuit, TrendingDown, ShieldAlert, FileLineChart } from 'lucide-react'

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('30D')

  return (
    <div className="space-y-6">
      {/* Header filter */}
      <div className="flex items-center justify-between">
        <h2 className="text-white font-bold text-lg flex items-center gap-2">
          <FileLineChart className="h-5 w-5 text-indigo-400" />
          Advanced AI Telemetry
        </h2>
        <div className="flex gap-1.5 p-1 bg-white/5 rounded-xl border border-white/5">
          {['7D', '30D', '90D', '1Y'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                timeRange === range
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-transparent text-slate-400 hover:text-white'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Row 1 — Trend Charts (2 col) */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card variant="glow">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-white font-bold text-sm">Total Spending Trend</h3>
            <div className="h-72 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={SPEND_TREND_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} labelStyle={{ color: '#fff' }} />
                  <Area type="monotone" dataKey="spend" stroke="#6366f1" fillOpacity={1} fill="url(#colorSpend)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="text-white font-bold text-sm">Fraud Detection Over Time</h3>
            <div className="h-72 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={SPEND_TREND_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                  <Bar dataKey="fraud" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2 — Breakdown (3 col) */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* By Category (Pie) */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="text-white font-bold text-sm">By Category</h3>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={CATEGORY_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {CATEGORY_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center text-[10px]">
              {CATEGORY_DATA.map((entry, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-slate-400">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span>{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* By Department (Pie) */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="text-white font-bold text-sm">By Department</h3>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={DEPT_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {DEPT_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center text-[10px]">
              {DEPT_DATA.map((entry, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-slate-400">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span>{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Forecast */}
        <Card variant="glow">
          <CardContent className="p-6 space-y-4 flex flex-col justify-between h-full">
            <div className="space-y-4">
              <h3 className="text-white font-bold text-sm flex items-center gap-2">
                <BrainCircuit className="h-4 w-4 text-indigo-400" />
                AI Smart Predictions
              </h3>
              <div className="space-y-3">
                <div className="flex gap-3 p-3 bg-white/5 border border-white/5 rounded-xl">
                  <TrendingDown className="h-5 w-5 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-white text-xs font-bold">15% Drop in Travel Spend</p>
                    <p className="text-slate-400 text-[10px] mt-0.5">Based on client pitch cycle completion predictions.</p>
                  </div>
                </div>
                <div className="flex gap-3 p-3 bg-white/5 border border-white/5 rounded-xl">
                  <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0" />
                  <div>
                    <p className="text-white text-xs font-bold">GST Compliance Risk Warning</p>
                    <p className="text-slate-400 text-[10px] mt-0.5">Filing lag from 2 vendors may affect ITC eligibility next week.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-center text-xs text-indigo-300">
              Q3 forecasts expect ₹1.2Cr cumulative savings.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3 — Department Table */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="text-white font-bold text-sm">Department Overview</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/5 text-slate-400 text-xs font-semibold uppercase">
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Total Spend</th>
                  <th className="py-3 px-4">Avg Claim Amount</th>
                  <th className="py-3 px-4">Fraud Cases Flagged</th>
                  <th className="py-3 px-4">GST Compliance Score</th>
                </tr>
              </thead>
              <tbody>
                {DEPT_TABLE.map((row, idx) => (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4 text-white font-semibold">{row.dept}</td>
                    <td className="py-4 px-4 text-white font-mono">{row.spend}</td>
                    <td className="py-4 px-4 text-slate-300 font-mono">{row.avg}</td>
                    <td className="py-4 px-4 text-slate-300">{row.fraudCases}</td>
                    <td className="py-4 px-4 font-semibold text-emerald-400">{row.compliance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6']

const SPEND_TREND_DATA = [
  { month: 'Jan', spend: 240000, fraud: 1 },
  { month: 'Feb', spend: 320000, fraud: 2 },
  { month: 'Mar', spend: 280000, fraud: 1 },
  { month: 'Apr', spend: 450000, fraud: 3 },
  { month: 'May', spend: 390000, fraud: 0 },
  { month: 'Jun', spend: 480000, fraud: 2 }
]

const CATEGORY_DATA = [
  { name: 'Travel', value: 45000 },
  { name: 'Accommodation', value: 33000 },
  { name: 'Meals', value: 16000 },
  { name: 'Office Supplies', value: 12000 },
  { name: 'Other', value: 8000 }
]

const DEPT_DATA = [
  { name: 'Engineering', value: 65000 },
  { name: 'Sales', value: 42000 },
  { name: 'HR', value: 15000 },
  { name: 'Operations', value: 24000 },
  { name: 'Marketing', value: 18000 }
]

const DEPT_TABLE = [
  { dept: 'Engineering', spend: '₹4,85,300', avg: '₹24,500', fraudCases: 1, compliance: '96.4%' },
  { dept: 'Sales', spend: '₹3,42,800', avg: '₹14,200', fraudCases: 4, compliance: '89.2%' },
  { dept: 'Operations', spend: '₹2,12,000', avg: '₹18,300', fraudCases: 2, compliance: '91.8%' },
  { dept: 'Marketing', spend: '₹1,54,300', avg: '₹12,400', fraudCases: 0, compliance: '95.0%' }
]
