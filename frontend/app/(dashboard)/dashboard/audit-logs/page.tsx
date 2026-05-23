'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { Search, Download, List, Calendar, ShieldCheck, ShieldAlert, Cpu } from 'lucide-react'

export default function AuditLogsPage() {
  const [viewTab, setViewTab] = useState<'timeline' | 'ai-decisions'>('timeline')
  const [searchQuery, setSearchQuery] = useState('')
  const [severityFilter, setSeverityFilter] = useState('all')

  const filteredLogs = MOCK_AUDIT_LOGS.filter(log => {
    const matchesSeverity = severityFilter === 'all' || log.severity.toLowerCase() === severityFilter.toLowerCase()
    const matchesSearch = 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resource_type.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSeverity && matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex gap-1.5 p-1 bg-white/5 rounded-xl border border-white/5 w-full sm:w-auto">
          <button
            onClick={() => setViewTab('timeline')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              viewTab === 'timeline'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-transparent text-slate-400 hover:text-white'
            }`}
          >
            <List className="h-4 w-4" />
            System Audit Log
          </button>
          <button
            onClick={() => setViewTab('ai-decisions')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              viewTab === 'ai-decisions'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Cpu className="h-4 w-4" />
            AI Decision Log
          </button>
        </div>

        <button className="w-full sm:w-auto px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5">
          <Download className="h-4 w-4" />
          Export CSV Log
        </button>
      </div>

      {viewTab === 'timeline' ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main timeline pane */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardContent className="p-6 space-y-6">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row items-center gap-4 border-b border-white/5 pb-4">
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search action, user, or resource..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto overflow-x-auto">
                    {['all', 'info', 'warning', 'error', 'critical'].map(sev => (
                      <button
                        key={sev}
                        onClick={() => setSeverityFilter(sev)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                          severityFilter === sev
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {sev}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Timeline display */}
                <div className="relative border-l border-white/10 pl-6 ml-4 space-y-8">
                  {filteredLogs.map((log) => (
                    <div key={log.id} className="relative group">
                      {/* Left timeline dot indicator */}
                      <span className={`absolute -left-[31px] top-1 p-1 rounded-full border border-slate-900 ${
                        log.severity === 'critical'
                          ? 'bg-red-500 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                          : log.severity === 'error'
                          ? 'bg-rose-500 text-rose-500'
                          : log.severity === 'warning'
                          ? 'bg-amber-500 text-amber-500'
                          : 'bg-blue-500 text-blue-500'
                      }`}>
                        <div className="h-1.5 w-1.5 rounded-full bg-current" />
                      </span>

                      <div className="flex items-center justify-between">
                        <p className="text-white text-sm font-semibold">
                          {log.action}
                        </p>
                        <span className="text-[10px] text-slate-500">{formatDate(log.created_at)}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Triggered on {log.resource_type} • User: {log.user_name} • IP: {log.ip_address || '127.0.0.1'}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Severity distribution card */}
          <div>
            <Card variant="glow">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-white font-bold text-sm">Security & Events</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2 text-xs">
                    <span className="text-slate-400">Total Incidents</span>
                    <span className="text-white font-bold">142</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/5 pb-2 text-xs">
                    <span className="text-slate-400">Critical Threats</span>
                    <span className="text-red-400 font-bold">2</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/5 pb-2 text-xs">
                    <span className="text-slate-400">Warning Incidents</span>
                    <span className="text-amber-400 font-bold">8</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/5 pb-2 text-xs">
                    <span className="text-slate-400">Standard Operations</span>
                    <span className="text-blue-400 font-bold">132</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="text-white font-bold text-sm flex items-center gap-2">
              <Cpu className="h-4 w-4 text-indigo-400 animate-pulse" />
              Smart Fraud Analysis Audit Log
            </h3>
            <p className="text-xs text-slate-400">
              Complete ledger trace of AI decision pipelines, OCR confidence benchmarks, and flagging thresholds.
            </p>

            <div className="overflow-x-auto border-t border-white/5 pt-4">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-slate-400 text-xs font-semibold uppercase">
                    <th className="py-3 px-4">Receipt ID</th>
                    <th className="py-3 px-4">AI Score</th>
                    <th className="py-3 px-4">Classification</th>
                    <th className="py-3 px-4">OCR Confidence</th>
                    <th className="py-3 px-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_AI_DECISIONS.map((row, idx) => (
                    <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-4 px-4 font-mono text-slate-300">{row.receiptId}</td>
                      <td className="py-4 px-4 font-bold text-white">{row.score}%</td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          row.decision === 'flagged' ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'
                        }`}>
                          {row.decision}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-300 font-mono">{row.ocrConfidence}%</td>
                      <td className="py-4 px-4 text-slate-400">{formatDate(row.timestamp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

const MOCK_AUDIT_LOGS = [
  { id: '1', action: 'EXPENSE_APPROVED', resource_type: 'ExpenseClaim', user_name: 'Rahul Mehta', created_at: '2026-05-22T14:30:00Z', severity: 'info', ip_address: '103.24.12.98' },
  { id: '2', action: 'FRAUD_FLAGGED', resource_type: 'FraudReport', user_name: 'AI System', created_at: '2026-05-22T10:15:00Z', severity: 'critical', ip_address: 'System' },
  { id: '3', action: 'EXPENSE_SUBMITTED', resource_type: 'ExpenseClaim', user_name: 'Priya Sharma', created_at: '2026-05-22T09:22:00Z', severity: 'info', ip_address: '103.24.12.44' },
  { id: '4', action: 'VENDOR_BLACKLISTED', resource_type: 'Vendor', user_name: 'Rahul Mehta', created_at: '2026-05-21T16:45:00Z', severity: 'warning', ip_address: '103.24.12.98' }
]

const MOCK_AI_DECISIONS = [
  { receiptId: 'rcpt-9283-8472', score: 95, decision: 'flagged', ocrConfidence: 98.4, timestamp: '2026-05-22T10:15:00Z' },
  { receiptId: 'rcpt-1293-9483', score: 14, decision: 'approved', ocrConfidence: 94.2, timestamp: '2026-05-22T09:25:00Z' },
  { receiptId: 'rcpt-4829-9238', score: 23, decision: 'approved', ocrConfidence: 97.0, timestamp: '2026-05-22T08:10:00Z' }
]
