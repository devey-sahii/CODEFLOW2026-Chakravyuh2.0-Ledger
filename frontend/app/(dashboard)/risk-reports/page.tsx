'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'
import { AlertTriangle, TrendingUp, ShieldAlert, CheckCircle, Cpu, FileText } from 'lucide-react'

export default function RiskReportsPage() {
  const [selectedEntity, setSelectedEntity] = useState('organization')

  return (
    <div className="space-y-6">
      {/* Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-white font-bold text-lg flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-indigo-400" />
          AI Risk Profiler
        </h2>
        <div className="flex gap-1.5 p-1 bg-white/5 rounded-xl border border-white/5">
          {['organization', 'employee', 'vendor'].map(type => (
            <button
              key={type}
              onClick={() => setSelectedEntity(type)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                selectedEntity === type
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-transparent text-slate-400 hover:text-white'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main report body */}
        <div className="lg:col-span-2 space-y-6">
          <Card variant="glow">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h3 className="text-white font-bold text-sm">Risk Matrix Details</h3>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Live Audit</span>
              </div>

              {selectedEntity === 'organization' && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Overall organization risk is classified as **LOW**. No compliance alerts found.
                  </p>
                  <div className="grid gap-4 sm:grid-cols-3 text-xs">
                    <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
                      <p className="text-slate-400 font-semibold uppercase">Filing Score</p>
                      <p className="text-white font-bold text-lg mt-0.5">98.5%</p>
                    </div>
                    <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
                      <p className="text-slate-400 font-semibold uppercase">Audit Frequency</p>
                      <p className="text-white font-bold text-lg mt-0.5">Continuous</p>
                    </div>
                    <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
                      <p className="text-slate-400 font-semibold uppercase">Policy Leakage</p>
                      <p className="text-white font-bold text-lg mt-0.5">₹4,200</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedEntity === 'employee' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400">Top anomalous employee accounts ranked by flags:</p>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                      <span className="text-white font-bold">Arjun Nair (Marketing)</span>
                      <span className="text-red-400 font-bold">75 Risk Score</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                      <span className="text-white font-bold">Priya Sharma (Sales)</span>
                      <span className="text-emerald-400 font-bold">15 Risk Score</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedEntity === 'vendor' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400">Top high-risk merchant accounts ranked by flags:</p>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                      <span className="text-white font-bold">Ghost Tech Logistics</span>
                      <span className="text-red-400 font-bold">95 Risk Score</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* AI Recommendations */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="text-white font-bold text-sm flex items-center gap-2">
              <Cpu className="h-4 w-4 text-indigo-400" />
              AI Risk Recommendations
            </h3>
            <div className="space-y-3 text-xs leading-relaxed">
              <div className="flex gap-2">
                <CheckCircle className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-slate-300">Set threshold triggers below ₹500 for automatic OCR scans.</p>
              </div>
              <div className="flex gap-2">
                <CheckCircle className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-slate-300">Conduct manual review audits for weekend lodging claims.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
