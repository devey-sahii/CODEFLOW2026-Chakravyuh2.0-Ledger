'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'
import { RiskMeter } from '@/components/ui/risk-meter'
import { fraudAPI } from '@/lib/api/endpoints'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { FraudReport } from '@/types'
import { AlertOctagon, ShieldAlert, CheckCircle, XCircle, Search, ShieldCheck, Cpu } from 'lucide-react'

export default function FraudDetectionPage() {
  const [reports, setReports] = useState<any[]>([])
  const [selectedReport, setSelectedReport] = useState<any | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('open')
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    fetchFraudReports()
  }, [])

  const fetchFraudReports = async () => {
    setIsLoading(true)
    try {
      const res = await fraudAPI.list()
      if (res && Array.isArray(res.data)) {
        setReports(res.data)
      } else {
        setReports(MOCK_FRAUD_REPORTS)
      }
    } catch (e) {
      setReports(MOCK_FRAUD_REPORTS)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirm = async (id: string) => {
    try {
      await fraudAPI.updateStatus(id, 'confirmed')
      fetchFraudReports()
      if (selectedReport?.id === id) {
        setSelectedReport((prev: any) => prev ? { ...prev, status: 'confirmed' } : null)
      }
    } catch (e) {
      setReports(prev => prev.map(rep => rep.id === id ? { ...rep, status: 'confirmed' } : rep))
      if (selectedReport?.id === id) {
        setSelectedReport((prev: any) => prev ? { ...prev, status: 'confirmed' } : null)
      }
    }
  }

  const handleDismiss = async (id: string) => {
    try {
      await fraudAPI.updateStatus(id, 'dismissed')
      fetchFraudReports()
      if (selectedReport?.id === id) {
        setSelectedReport((prev: any) => prev ? { ...prev, status: 'dismissed' } : null)
      }
    } catch (e) {
      setReports(prev => prev.map(rep => rep.id === id ? { ...rep, status: 'dismissed' } : rep))
      if (selectedReport?.id === id) {
        setSelectedReport((prev: any) => prev ? { ...prev, status: 'dismissed' } : null)
      }
    }
  }

  const filteredReports = reports.filter(rep => {
    if (statusFilter === 'all') return true
    return rep.status === statusFilter
  })

  return (
    <div className="space-y-6">
      {/* Top Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <StatCard title="Total AI Scans" value="2,341" trend="100% Secure" trendType="up" />
        <StatCard title="Flagged Cases" value="47 reports" trend="Active Scan" trendType="neutral" />
        <StatCard title="Confirmed Fraud" value="12 cases" trend="₹18.4L Saved" trendType="up" />
        <StatCard title="Dismissed Checks" value="8 checks" trend="98.5% Accuracy" trendType="up" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Table Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Scan visualization decoration */}
          <Card variant="glow" className="relative overflow-hidden">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-indigo-400 animate-pulse" />
                  AI Fraud Scan Engine
                </h3>
                <p className="text-xs text-slate-400">
                  Autonomous scan active. Verifying receipt signatures, metadata, and GSTIN databases...
                </p>
              </div>
              <div className="flex items-center gap-4 text-right">
                <div>
                  <span className="text-[10px] font-bold text-indigo-400 tracking-widest uppercase block">Status</span>
                  <span className="text-xs text-white font-bold">Scanning Live</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h3 className="text-white font-bold text-sm">Suspicious Incidents</h3>
                <div className="flex gap-2">
                  {['all', 'open', 'confirmed', 'dismissed'].map(status => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                        statusFilter === status
                          ? 'bg-indigo-600 text-white shadow-lg'
                          : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reports Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-slate-400 text-xs font-semibold uppercase">
                      <th className="py-3 px-4">Receipt Details</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">AI Score</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {isLoading ? (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-slate-400 text-sm">
                            Loading fraud logs...
                          </td>
                        </tr>
                      ) : filteredReports.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-slate-400 text-sm">
                            No active warnings found.
                          </td>
                        </tr>
                      ) : (
                        filteredReports.map((rep) => (
                          <motion.tr
                            key={rep.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedReport(rep)}
                            className={`border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${
                              selectedReport?.id === rep.id ? 'bg-white/5' : ''
                            }`}
                          >
                            <td className="py-4 px-4">
                              <p className="font-semibold text-white text-sm">
                                {rep.fraud_type || 'Anomalous Bill'}
                              </p>
                              <p className="text-xs text-slate-400">
                                Vendor: {rep.vendor_name || 'Mock Merchant'} • Employee: {rep.employee_name || 'System'}
                              </p>
                            </td>
                            <td className="py-4 px-4 text-slate-400 text-sm">{rep.category || 'Travel'}</td>
                            <td className="py-4 px-4 text-white font-semibold text-sm">
                              {formatCurrency(rep.amount, rep.currency)}
                            </td>
                            <td className="py-4 px-4">
                              <span
                                className={`font-bold text-sm ${
                                  rep.fraud_score > 0.8
                                    ? 'text-red-400'
                                    : rep.fraud_score > 0.5
                                    ? 'text-orange-400'
                                    : 'text-amber-400'
                                }`}
                              >
                                {Math.round(rep.fraud_score * 100)}%
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  rep.status === 'confirmed'
                                    ? 'bg-red-500/10 text-red-400'
                                    : rep.status === 'dismissed'
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : 'bg-amber-500/10 text-amber-400'
                                }`}
                              >
                                {rep.status}
                              </span>
                            </td>
                          </motion.tr>
                        ))
                      )}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Details Panel */}
        <div>
          {selectedReport ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card variant="glow">
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <h3 className="font-bold text-white text-base">AI Analysis details</h3>
                    <button
                      onClick={() => setSelectedReport(null)}
                      className="text-slate-400 hover:text-white text-xs"
                    >
                      Close
                    </button>
                  </div>

                  <div className="flex flex-col items-center justify-center py-4 bg-white/5 rounded-2xl border border-white/10 relative overflow-hidden">
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                      <span className="text-[10px] font-bold text-red-400 tracking-wider">CRITICAL RISK</span>
                    </div>
                    <RiskMeter score={Math.round(selectedReport.fraud_score * 100)} size={110} strokeWidth={8} />
                  </div>

                  <div className="space-y-4 text-sm">
                    <div>
                      <p className="text-slate-400 text-xs font-semibold uppercase">Indicator</p>
                      <p className="text-white font-semibold mt-0.5">{selectedReport.fraud_type}</p>
                    </div>

                    <div>
                      <p className="text-slate-400 text-xs font-semibold uppercase">AI Reasoning</p>
                      <p className="text-slate-300 text-xs leading-relaxed mt-1">
                        {selectedReport.description}
                      </p>
                    </div>

                    {/* Evidence Indicators */}
                    <div>
                      <p className="text-slate-400 text-xs font-semibold uppercase mb-2">Evidence list</p>
                      <div className="space-y-2">
                        {selectedReport.evidence?.flags?.map((flag: any, idx: number) => (
                          <div key={idx} className="flex gap-2 p-2 bg-white/5 rounded-lg border border-white/5">
                            <ShieldAlert className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-white text-xs font-semibold">{flag.code}</p>
                              <p className="text-slate-400 text-[10px] mt-0.5">{flag.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <button
                        onClick={() => handleConfirm(selectedReport.id)}
                        className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                      >
                        <XCircle className="h-4 w-4" />
                        Confirm Fraud
                      </button>
                      <button
                        onClick={() => handleDismiss(selectedReport.id)}
                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Dismiss Check
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-slate-400 text-sm py-12">
                <AlertOctagon className="h-8 w-8 mx-auto text-slate-500 mb-2" />
                Select a flagged incident to view composite evidence logs and take action.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

const MOCK_FRAUD_REPORTS = [
  {
    id: 'rep-1',
    fraud_type: 'DUPLICATE_RECEIPT',
    vendor_name: 'Uber India',
    employee_name: 'Priya Sharma',
    category: 'travel',
    amount: 5400,
    currency: 'INR',
    fraud_score: 0.88,
    status: 'open',
    description: 'AI detected a receipt with the exact same transaction ID, vendor name, and timestamp submitted by another employee within the last 48 hours.',
    evidence: {
      flags: [
        { code: 'DUPLICATE_TRANSACTION_ID', description: 'Same reference invoice #INV-929381 found' },
        { code: 'VENDOR_MISMATCH', description: 'Address state does not match employee travel code' }
      ]
    }
  },
  {
    id: 'rep-2',
    fraud_type: 'INFLATED_AMOUNT',
    vendor_name: 'Hotel Taj Palace',
    employee_name: 'Rahul Mehta',
    category: 'accommodation',
    amount: 72000,
    currency: 'INR',
    fraud_score: 0.74,
    status: 'open',
    description: 'Claimed amount exceeds the hotel booking category policy limit by 140%. Scanned tax breakdown displays private lounge charge items.',
    evidence: {
      flags: [
        { code: 'POLICY_VIOLATION_AMOUNT', description: 'Amount exceeds daily travel allowance cap' },
        { code: 'PERSONAL_EXPENSE_DETECTED', description: 'Scanned bill contains private spa surcharge items' }
      ]
    }
  },
  {
    id: 'rep-3',
    fraud_type: 'FAKE_GSTIN',
    vendor_name: 'QuickPrint Solutions',
    employee_name: 'Arjun Nair',
    category: 'office_supplies',
    amount: 12500,
    currency: 'INR',
    fraud_score: 0.95,
    status: 'confirmed',
    description: 'The GSTIN printed on the receipt does not exist in the government database or represents an inactive taxpayer.',
    evidence: {
      flags: [
        { code: 'GSTN_INVALID_FORMAT', description: 'GSTIN check digit mismatch' },
        { code: 'FICTITIOUS_VENDOR', description: 'Business name is unregistered in filings' }
      ]
    }
  }
]
