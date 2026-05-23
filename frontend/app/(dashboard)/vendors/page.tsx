'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'
import { RiskMeter } from '@/components/ui/risk-meter'
import { formatCurrency } from '@/lib/utils'
import { Search, ShieldAlert, CheckCircle, Ban, ArrowUpDown, RefreshCw } from 'lucide-react'

export default function VendorsPage() {
  const [vendors, setVendors] = useState<any[]>(MOCK_VENDORS)
  const [selectedVendor, setSelectedVendor] = useState<any | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [riskFilter, setRiskFilter] = useState('all')

  const handleBlacklist = (id: string) => {
    setVendors(prev => prev.map(v => {
      if (v.id === id) {
        return { ...v, is_blacklisted: true, risk_level: 'critical', fraud_score: 0.99 }
      }
      return v
    }))
    if (selectedVendor?.id === id) {
      setSelectedVendor((prev: any) => ({ ...prev, is_blacklisted: true, risk_level: 'critical', fraud_score: 0.99 }))
    }
  }

  const handleVerify = (id: string) => {
    setVendors(prev => prev.map(v => {
      if (v.id === id) {
        return { ...v, is_verified: true, fraud_score: 0.05, risk_level: 'low' }
      }
      return v
    }))
    if (selectedVendor?.id === id) {
      setSelectedVendor((prev: any) => ({ ...prev, is_verified: true, fraud_score: 0.05, risk_level: 'low' }))
    }
  }

  const filteredVendors = vendors.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) || v.gstin.includes(searchQuery.toUpperCase())
    const matchesRisk = riskFilter === 'all' || v.risk_level.toLowerCase() === riskFilter.toLowerCase()
    return matchesSearch && matchesRisk
  })

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <StatCard title="Total Vendors" value="47" trend="Corporate Network" trendType="neutral" />
        <StatCard title="Verified Merchants" value="32" trend="100% Validated" trendType="up" />
        <StatCard title="High Risk Warnings" value="8 Vendors" trend="Needs Audit" trendType="down" />
        <StatCard title="Blacklisted Vendors" value="2 Vendors" trend="Auto-Flag active" trendType="neutral" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search vendor name or GSTIN..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  {['all', 'low', 'medium', 'high', 'critical'].map(risk => (
                    <button
                      key={risk}
                      onClick={() => setRiskFilter(risk)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                        riskFilter === risk
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {risk}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vendors Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-slate-400 text-xs font-semibold uppercase">
                      <th className="py-3 px-4">Vendor</th>
                      <th className="py-3 px-4">GSTIN</th>
                      <th className="py-3 px-4">Spend</th>
                      <th className="py-3 px-4">Risk Level</th>
                      <th className="py-3 px-4">Compliance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVendors.map((v) => (
                      <tr
                        key={v.id}
                        onClick={() => setSelectedVendor(v)}
                        className={`border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${
                          selectedVendor?.id === v.id ? 'bg-white/5' : ''
                        }`}
                      >
                        <td className="py-4 px-4 text-white text-sm font-semibold">{v.name}</td>
                        <td className="py-4 px-4 text-slate-400 text-sm font-mono">{v.gstin}</td>
                        <td className="py-4 px-4 text-white font-mono text-sm">{formatCurrency(v.total_spend, 'INR')}</td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            v.risk_level === 'low'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : v.risk_level === 'medium'
                              ? 'bg-amber-500/10 text-amber-400'
                              : 'bg-red-500/10 text-red-400'
                          }`}>
                            {v.risk_level}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-bold text-white text-sm">{v.compliance_score}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column Details */}
        <div>
          {selectedVendor ? (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <Card variant="glow">
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <h3 className="font-bold text-white text-base">Vendor Profile</h3>
                    <button onClick={() => setSelectedVendor(null)} className="text-slate-400 hover:text-white text-xs">
                      Close
                    </button>
                  </div>

                  <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/10">
                    <div>
                      <p className="text-slate-400 text-xs font-semibold uppercase">Fraud risk score</p>
                      <p className="text-white font-bold text-lg mt-0.5">{Math.round(selectedVendor.fraud_score * 100)}/100</p>
                    </div>
                    <RiskMeter score={Math.round(selectedVendor.fraud_score * 100)} size={60} strokeWidth={6} showLabel={false} />
                  </div>

                  <div className="space-y-4 text-sm">
                    <div>
                      <p className="text-slate-400 text-xs font-semibold uppercase">Legal entity name</p>
                      <p className="text-white font-semibold mt-0.5">{selectedVendor.name}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs font-semibold uppercase">GST Registration (GSTIN)</p>
                      <p className="text-white font-mono mt-0.5">{selectedVendor.gstin}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-slate-400 text-xs font-semibold uppercase">Total Claims</p>
                        <p className="text-white font-semibold mt-0.5">{selectedVendor.transaction_count}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs font-semibold uppercase">Compliance Score</p>
                        <p className="text-white font-semibold mt-0.5">{selectedVendor.compliance_score}%</p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      {!selectedVendor.is_blacklisted && (
                        <button
                          onClick={() => handleBlacklist(selectedVendor.id)}
                          className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Ban className="h-4 w-4" />
                          Blacklist
                        </button>
                      )}
                      {!selectedVendor.is_verified && (
                        <button
                          onClick={() => handleVerify(selectedVendor.id)}
                          className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Verify Merchant
                        </button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-slate-400 text-sm py-12">
                Select a vendor to audit compliance rates and transaction telemetry.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

const MOCK_VENDORS = [
  { id: '1', name: 'Tata Consultancy Services Ltd', gstin: '27AAACT2727Q1ZW', total_spend: 142500, risk_level: 'low', fraud_score: 0.12, compliance_score: 98, transaction_count: 14, is_verified: true, is_blacklisted: false },
  { id: '2', name: 'MakeMyTrip India Pvt Ltd', gstin: '07AAPFM1293K1ZV', total_spend: 852000, risk_level: 'low', fraud_score: 0.08, compliance_score: 96, transaction_count: 42, is_verified: true, is_blacklisted: false },
  { id: '3', name: 'Ghost Tech Logistics', gstin: '27AABCG1293F1ZX', total_spend: 125000, risk_level: 'critical', fraud_score: 0.95, compliance_score: 14, transaction_count: 2, is_verified: false, is_blacklisted: true }
]
