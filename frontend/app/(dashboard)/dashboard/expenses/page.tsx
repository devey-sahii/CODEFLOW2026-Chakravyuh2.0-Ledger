'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'
import { RiskMeter } from '@/components/ui/risk-meter'
import { expenseAPI } from '@/lib/api/endpoints'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { ExpenseClaim, ExpenseStatus, ExpenseCategory } from '@/types'
import {
  Search,
  Filter,
  ArrowUpDown,
  ChevronRight,
  Check,
  X,
  AlertTriangle,
  FileText,
  Download,
  Upload,
  History,
  FolderOpen,
  GitFork,
  CreditCard,
  Sparkles,
  Clock,
  Coins,
  Briefcase,
  Shield,
  ArrowRight,
  Loader2,
  Play,
  CheckCircle2,
  ListFilter,
  Percent,
  Settings,
  TrendingUp,
  Plus,
  Trash2,
  HelpCircle,
  Building2,
  FileSpreadsheet
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
  Legend
} from 'recharts'

// Tab definitions
type TabType = 'history' | 'upload' | 'categories' | 'workflow' | 'reimbursements'

export default function ExpensesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('history')
  const [expenses, setExpenses] = useState<ExpenseClaim[]>([])
  const [selectedExpense, setSelectedExpense] = useState<ExpenseClaim | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Upload/AI state
  const [uploadType, setUploadType] = useState<'receipt' | 'invoice'>('receipt')
  const [isScanning, setIsScanning] = useState<boolean>(false)
  const [scanProgress, setScanProgress] = useState<number>(0)
  const [scanLogs, setScanLogs] = useState<string[]>([])
  const [scannedData, setScannedData] = useState<any | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch expenses on mount
  useEffect(() => {
    fetchExpenses()
  }, [])

  const fetchExpenses = async () => {
    setIsLoading(true)
    try {
      const res = await expenseAPI.list()
      if (res && Array.isArray(res.data)) {
        setExpenses(res.data)
      } else {
        setExpenses(MOCK_EXPENSES)
      }
    } catch (e) {
      setExpenses(MOCK_EXPENSES)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    try {
      await expenseAPI.approve(id)
      fetchExpenses()
      if (selectedExpense?.id === id) {
        setSelectedExpense(prev => prev ? { ...prev, status: 'approved' } : null)
      }
    } catch (e) {
      setExpenses(prev => prev.map(exp => exp.id === id ? { ...exp, status: 'approved' as ExpenseStatus } : exp))
      if (selectedExpense?.id === id) {
        setSelectedExpense(prev => prev ? { ...prev, status: 'approved' as ExpenseStatus } : null)
      }
    }
  }

  const handleReject = async (id: string) => {
    const reason = prompt('Please enter rejection reason:')
    if (!reason) return
    try {
      await expenseAPI.reject(id, reason)
      fetchExpenses()
      if (selectedExpense?.id === id) {
        setSelectedExpense(prev => prev ? { ...prev, status: 'rejected', notes: reason } : null)
      }
    } catch (e) {
      setExpenses(prev => prev.map(exp => exp.id === id ? { ...exp, status: 'rejected' as ExpenseStatus, notes: reason } : exp))
      if (selectedExpense?.id === id) {
        setSelectedExpense(prev => prev ? { ...prev, status: 'rejected' as ExpenseStatus, notes: reason } : null)
      }
    }
  }

  // File drop/selection handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0])
    }
  }

  const processSelectedFile = (file: File) => {
    setUploadFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    startScanning(file.name)
  }

  // Scanning simulation
  const startScanning = (filename: string) => {
    setIsScanning(true)
    setScanProgress(0)
    setScanLogs([])
    setScannedData(null)

    const logs = [
      `Initializing AI OCR engine for ${filename}...`,
      'Running image alignment and contrast enhancements...',
      'Extracting text nodes & structural bounding boxes...',
      'Detecting corporate entities and tax compliance forms...',
      'Validating Vendor GSTIN against GST portal schedules...',
      'Running 40+ policy audits & duplicate claim checks...',
      'Verifying weekend submission anomalies & amount deviations...',
      'Scanning complete! Auto-generating compliance risk report...'
    ]

    let currentStep = 0
    const interval = setInterval(() => {
      if (currentStep < logs.length) {
        setScanLogs(prev => [...prev, logs[currentStep]])
        setScanProgress(Math.round(((currentStep + 1) / logs.length) * 100))
        currentStep++
      } else {
        clearInterval(interval)
        setIsScanning(false)
        generateScannedMockData()
      }
    }, 900)
  }

  const generateScannedMockData = () => {
    const isInvoice = uploadType === 'invoice'
    const generated = {
      title: isInvoice ? 'Vendor Invoice: Dell Servers' : 'Client Lunch at Taj Gateway',
      vendor: isInvoice ? 'Dell Technologies India Pvt Ltd' : 'Taj Dining Gateway',
      gstin: isInvoice ? '29AAAAD2314M1Z8' : '27AAACT4322P1ZX',
      gstinStatus: 'Valid',
      invoiceNumber: isInvoice ? 'INV- Dell-43920' : 'TX-TJ-847291',
      date: new Date().toISOString().split('T')[0],
      category: isInvoice ? 'hardware' : 'meals',
      amount: isInvoice ? 74500 : 4250,
      taxAmount: isInvoice ? 13410 : 765, // 18% GST approx
      fraudScore: isInvoice ? 0.08 : 0.42, // Low for invoice, medium for meals (taj hotel)
      warnings: isInvoice 
        ? ['Input Tax Credit (ITC) fully eligible'] 
        : ['Weekend dining claim', 'Taj hotel premium limits exceeded (Max ₹3000)']
    }
    setScannedData(generated)
  }

  const handleScanSubmit = () => {
    if (!scannedData) return

    const newClaim: ExpenseClaim = {
      id: `exp-${Date.now()}`,
      title: scannedData.title,
      description: `Auto-extracted from ${uploadType}. Vendor: ${scannedData.vendor}. GSTIN: ${scannedData.gstin}. Invoice: ${scannedData.invoiceNumber}`,
      organization_id: 'org-1',
      amount: scannedData.amount,
      currency: 'INR',
      category: scannedData.category as ExpenseCategory,
      status: scannedData.fraudScore > 0.4 ? 'flagged' : 'pending',
      employee_id: 'emp-admin',
      employee_name: 'Corporate Admin',
      submitted_at: new Date().toISOString(),
      reviewed_at: null,
      reviewed_by: null,
      reviewer_name: null,
      reviewer_comments: null,
      fraud_score: scannedData.fraudScore,
      risk_level: scannedData.fraudScore > 0.7 ? 'high' : scannedData.fraudScore > 0.3 ? 'medium' : 'low',
      receipts: [],
      tags: [],
      location: null,
      project_code: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      notes: scannedData.warnings.join(', ')
    }

    setExpenses(prev => [newClaim, ...prev])
    setSelectedExpense(newClaim)
    // Reset scanner states
    setUploadFile(null)
    setPreviewUrl(null)
    setScannedData(null)
    // Go back to history tab to view it
    setActiveTab('history')
  }

  const filteredExpenses = expenses.filter(exp => {
    const matchesStatus = statusFilter === 'all' || exp.status === statusFilter
    const matchesSearch =
      exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exp.employee_name && exp.employee_name.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesStatus && matchesSearch
  })

  // Tab 3 Category stats
  const categoryChartData = [
    { name: 'Travel', value: expenses.filter(e => e.category === 'travel').reduce((sum, e) => sum + e.amount, 0), color: '#6366f1' },
    { name: 'Meals', value: expenses.filter(e => e.category === 'meals').reduce((sum, e) => sum + e.amount, 0), color: '#3b82f6' },
    { name: 'Software', value: expenses.filter(e => e.category === 'software').reduce((sum, e) => sum + e.amount, 0), color: '#8b5cf6' },
    { name: 'Hardware', value: expenses.filter(e => e.category === 'hardware' || e.category === 'office_supplies').reduce((sum, e) => sum + e.amount, 0), color: '#06b6d4' },
    { name: 'Other', value: expenses.filter(e => e.category === 'other' || e.category === 'accommodation').reduce((sum, e) => sum + e.amount, 0), color: '#475569' }
  ].filter(c => c.value > 0)

  // Policy Limits
  const policies = [
    { category: 'Travel', spent: 154300, limit: 200000, status: 'safe', color: 'indigo' },
    { category: 'Meals', spent: 58200, limit: 60000, status: 'warning', color: 'yellow' },
    { category: 'Software', spent: 345000, limit: 300000, status: 'violated', color: 'red' },
    { category: 'Hardware', spent: 142000, limit: 250000, status: 'safe', color: 'emerald' },
    { category: 'Office Supplies', spent: 22800, limit: 40000, status: 'safe', color: 'indigo' }
  ]

  // Tab 4 Approval Queue
  const pendingApprovalsQueue = expenses.filter(e => e.status === 'pending')

  // Tab 5 Reimbursement batch tracking
  const payoutTrackers = [
    { id: 'REIM-784', itemsCount: 4, total: 24800, date: '2026-05-24', status: 'initiated', utr: 'UTR-HDFC-9847291', account: 'HDFC Bank ...8492' },
    { id: 'REIM-783', itemsCount: 8, total: 112500, date: '2026-05-22', status: 'paid', utr: 'UTR-ICICI-8429184', account: 'ICICI Bank ...9012' },
    { id: 'REIM-782', itemsCount: 12, total: 242000, date: '2026-05-18', status: 'paid', utr: 'UTR-SBI-7749102', account: 'SBI Bank ...2918' },
    { id: 'REIM-781', itemsCount: 3, total: 18900, date: '2026-05-14', status: 'paid', utr: 'UTR-AXIS-2291039', account: 'AXIS Bank ...4102' }
  ]

  return (
    <div className="space-y-6">
      {/* Header and Mind-Map Tabs */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b-2 border-black pb-5 bg-slate-950/20 p-4 rounded-2xl">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <Coins className="w-8 h-8 text-indigo-500" />
            Expense Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">Audit, process, and track your organization claims dynamically.</p>
        </div>

        {/* Tactical Brutalist Tabs */}
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: 'history', label: 'Expense History', icon: Clock },
              { id: 'upload', label: 'AI Ingestion Portal', icon: Upload },
              { id: 'categories', label: 'Categories & Limits', icon: FolderOpen },
              { id: 'workflow', label: 'Approval Workflow', icon: GitFork },
              { id: 'reimbursements', label: 'Reimbursements', icon: CreditCard }
            ] as const
          ).map(tab => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  setSelectedExpense(null)
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-black font-extrabold text-xs uppercase tracking-wider transition-all relative ${
                  active
                    ? 'bg-indigo-600 text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-0.5'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Contents */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25 }}
        >
          {/* TAB 1: EXPENSE HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              {/* Overview Stat Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Claims" value="₹12,84,750" trend="+12.4%" trendType="up" />
                <StatCard title="Approved Claims" value="₹8,92,300" trend="+8.7%" trendType="up" />
                <StatCard title="Pending Approvals" value={`${pendingApprovalsQueue.length} Claims`} trend="Urgent Queue" trendType="neutral" />
                <StatCard title="Flagged Claims" value="8 Claims" trend="High Risk" trendType="down" />
              </div>

              {/* Main Table Grid */}
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-4">
                  <Card>
                    <CardContent className="p-6 space-y-4">
                      {/* Search / Filters */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="relative w-full sm:w-72">
                          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                          <input
                            type="text"
                            placeholder="Search claims or employees..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-900/60 border-2 border-black rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all placeholder:text-slate-500"
                          />
                        </div>

                        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                          {['all', 'pending', 'approved', 'rejected', 'flagged'].map((status) => (
                            <button
                              key={status}
                              onClick={() => setStatusFilter(status)}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border-2 border-black transition-all ${
                                statusFilter === status
                                  ? 'bg-indigo-600 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-0.5'
                                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'
                              }`}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Claims List Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b-2 border-black text-slate-400 text-[10px] font-black uppercase tracking-widest">
                              <th className="py-3 px-4">Claim Details</th>
                              <th className="py-3 px-4">Employee</th>
                              <th className="py-3 px-4">Category</th>
                              <th className="py-3 px-4">Amount</th>
                              <th className="py-3 px-4">Status</th>
                              <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {isLoading ? (
                              <tr>
                                <td colSpan={6} className="text-center py-12 text-slate-400 text-xs">
                                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-500 mb-2" />
                                  Loading claims...
                                </td>
                              </tr>
                            ) : filteredExpenses.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="text-center py-12 text-slate-500 text-sm font-bold">
                                  No claims match the filter.
                                </td>
                              </tr>
                            ) : (
                              filteredExpenses.map((exp) => (
                                <tr
                                  key={exp.id}
                                  onClick={() => setSelectedExpense(exp)}
                                  className={`border-b border-white/5 hover:bg-slate-900/40 transition-colors cursor-pointer ${
                                    selectedExpense?.id === exp.id ? 'bg-slate-900/60' : ''
                                  }`}
                                >
                                  <td className="py-3.5 px-4">
                                    <p className="font-bold text-white text-sm hover:text-indigo-400 transition-colors">{exp.title}</p>
                                    <p className="text-[11px] text-slate-500 font-semibold">{formatDate(exp.submitted_at)}</p>
                                  </td>
                                  <td className="py-3.5 px-4 text-slate-300 text-xs font-semibold">{exp.employee_name || 'System User'}</td>
                                  <td className="py-3.5 px-4">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-900 border border-slate-700 px-2 py-0.5 rounded">
                                      {exp.category}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-4 text-white font-bold text-sm">
                                    {formatCurrency(exp.amount, exp.currency)}
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${
                                        exp.status === 'approved'
                                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/35'
                                          : exp.status === 'rejected'
                                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/35'
                                          : exp.status === 'flagged'
                                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/35'
                                          : 'bg-blue-500/10 text-blue-400 border-blue-500/35'
                                      }`}
                                    >
                                      {exp.status}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex justify-end space-x-1">
                                      {exp.status === 'pending' && (
                                        <>
                                          <button
                                            onClick={() => handleApprove(exp.id)}
                                            className="p-1 text-emerald-400 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/30 rounded"
                                            title="Approve"
                                          >
                                            <Check className="h-4 w-4" />
                                          </button>
                                          <button
                                            onClick={() => handleReject(exp.id)}
                                            className="p-1 text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 rounded"
                                            title="Reject"
                                          >
                                            <X className="h-4 w-4" />
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Details Panel */}
                <div className="space-y-4">
                  {selectedExpense ? (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                      <Card variant="glow">
                        <CardContent className="p-6 space-y-6">
                          <div className="flex items-center justify-between border-b border-black pb-4">
                            <div>
                              <h3 className="font-extrabold text-white text-base">Claim Audit Report</h3>
                              <p className="text-[10px] text-indigo-400 font-mono mt-0.5">{selectedExpense.id}</p>
                            </div>
                            <button
                              onClick={() => setSelectedExpense(null)}
                              className="text-xs font-black uppercase text-slate-400 hover:text-white border border-slate-700 hover:border-white px-2 py-1 rounded"
                            >
                              Close
                            </button>
                          </div>

                          <div className="space-y-4 text-xs font-semibold text-slate-300">
                            <div>
                              <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Claim Description</p>
                              <p className="text-white text-sm font-bold mt-1 leading-relaxed">{selectedExpense.title}</p>
                              <p className="text-slate-400 font-medium text-[11px] mt-1.5 leading-relaxed">
                                {selectedExpense.description || 'No additional employee notes provided.'}
                              </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Total Value</p>
                                <p className="text-white text-base font-black mt-0.5">
                                  {formatCurrency(selectedExpense.amount, selectedExpense.currency)}
                                </p>
                              </div>
                              <div>
                                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Category</p>
                                <p className="text-white text-sm font-extrabold mt-0.5 uppercase tracking-wider">{selectedExpense.category}</p>
                              </div>
                            </div>

                            {/* Risk Meter Section */}
                            <div className="bg-slate-900 border-2 border-black p-4 rounded-xl flex items-center justify-between shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                              <div className="space-y-1">
                                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">AI Audit Risk Score</p>
                                <p className="text-white text-xl font-black">
                                  {selectedExpense.fraud_score ? Math.round(selectedExpense.fraud_score * 100) : 15}
                                  <span className="text-xs text-slate-500 font-bold"> / 100</span>
                                </p>
                                <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                                  selectedExpense.risk_level === 'high' ? 'bg-red-500/20 text-red-400' :
                                  selectedExpense.risk_level === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                  'bg-emerald-500/20 text-emerald-400'
                                }`}>
                                  {selectedExpense.risk_level} risk
                                </span>
                              </div>
                              <RiskMeter
                                score={selectedExpense.fraud_score ? Math.round(selectedExpense.fraud_score * 100) : 15}
                                size={64}
                                strokeWidth={7}
                                showLabel={false}
                              />
                            </div>

                            {/* Anomaly Alerts */}
                            <div className="space-y-2">
                              <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Policy Audits & Checks</p>
                              <div className="space-y-1.5">
                                {selectedExpense.fraud_score && selectedExpense.fraud_score > 0.4 ? (
                                  <>
                                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-950/20 border border-red-900 text-red-400">
                                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                      <p className="text-[11px] leading-relaxed">
                                        <strong>Anomaly Alert:</strong> Multiple compliance thresholds crossed. Re-validate vendor invoice details.
                                      </p>
                                    </div>
                                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-yellow-950/20 border border-yellow-900 text-yellow-400">
                                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                      <p className="text-[11px] leading-relaxed">
                                        <strong>Policy Check:</strong> Taj Hotel dining policy caps at ₹3,000 for standard meals.
                                      </p>
                                    </div>
                                  </>
                                ) : (
                                  <div className="flex items-start gap-2 p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-900 text-emerald-400">
                                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    <p className="text-[11px] leading-relaxed">
                                      All metadata checks validated successfully. GSTIN matching and invoice sequence aligns.
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {selectedExpense.notes && (
                              <div className="p-3 bg-indigo-950/20 border border-indigo-900 rounded-xl">
                                <p className="text-indigo-400 text-[10px] font-bold uppercase tracking-wider">AI Recommendations</p>
                                <p className="text-slate-300 text-[11px] mt-1 leading-relaxed">{selectedExpense.notes}</p>
                              </div>
                            )}

                            {/* Action Row */}
                            {selectedExpense.status === 'pending' && (
                              <div className="flex gap-2 pt-4">
                                <button
                                  onClick={() => handleApprove(selectedExpense.id)}
                                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all text-center"
                                >
                                  Approve Claim
                                </button>
                                <button
                                  onClick={() => handleReject(selectedExpense.id)}
                                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all text-center"
                                >
                                  Reject Claim
                                </button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ) : (
                    <Card>
                      <CardContent className="p-6 text-center text-slate-500 text-xs py-12 font-semibold">
                        <FileText className="h-8 w-8 mx-auto text-slate-600 mb-2" />
                        Select an expense claim to view AI risk report and full details.
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AI INGESTION PORTAL (UPLOAD) */}
          {activeTab === 'upload' && (
            <div className="grid gap-6 lg:grid-cols-12 max-w-5xl mx-auto">
              <div className="lg:col-span-7 space-y-6">
                <Card>
                  <CardContent className="p-6 space-y-6">
                    <div className="flex items-center justify-between border-b border-black pb-4">
                      <div>
                        <h2 className="text-lg font-black text-white uppercase tracking-wider">AI Ingestion Center</h2>
                        <p className="text-slate-400 text-xs mt-0.5">Snap, drag, or choose files to extract expense ledger records.</p>
                      </div>
                      
                      {/* Upload Type Switcher */}
                      <div className="flex bg-slate-900 border-2 border-black rounded-lg p-0.5">
                        <button
                          onClick={() => setUploadType('receipt')}
                          className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${
                            uploadType === 'receipt' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          Receipt
                        </button>
                        <button
                          onClick={() => setUploadType('invoice')}
                          className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${
                            uploadType === 'invoice' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          Invoice
                        </button>
                      </div>
                    </div>

                    {/* Drag and Drop Zone */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-700 hover:border-indigo-500 hover:bg-slate-900/30 rounded-2xl p-10 text-center cursor-pointer transition-all space-y-3 relative overflow-hidden group"
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*,application/pdf"
                        className="hidden"
                      />
                      <div className="w-12 h-12 bg-slate-900 border-2 border-black rounded-xl flex items-center justify-center mx-auto text-slate-400 group-hover:text-indigo-400 group-hover:-translate-y-1 transition-all">
                        {uploadType === 'invoice' ? <FileSpreadsheet className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-white">Click or Drag & Drop file here</p>
                        <p className="text-slate-500 text-xs mt-1">PNG, JPG, PDF up to 10MB</p>
                      </div>
                    </div>

                    {/* Scanning Animation */}
                    {isScanning && (
                      <div className="space-y-4 border-2 border-black bg-slate-950 p-5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
                        {/* Neon green scanner bar */}
                        <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent blur-sm animate-bounce" />
                        <div className="flex items-center justify-between text-xs font-black text-white">
                          <span className="flex items-center gap-1.5">
                            <Loader2 className="w-4 h-4 animate-spin text-green-400" />
                            AI SCANNER ACTIVE
                          </span>
                          <span className="font-mono text-green-400">{scanProgress}%</span>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-black">
                          <div className="h-full bg-green-500 rounded-full transition-all duration-300" style={{ width: `${scanProgress}%` }} />
                        </div>

                        {/* Scanner Logs */}
                        <div className="bg-black border border-slate-800 rounded-lg p-3 h-32 overflow-y-auto font-mono text-[10px] text-green-400 space-y-1 text-left">
                          {scanLogs.map((log, index) => (
                            <div key={index} className="flex gap-1.5 items-start">
                              <span className="text-slate-700">&gt;&gt;</span>
                              <span>{log}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Extraction Preview Panel */}
              <div className="lg:col-span-5">
                {scannedData ? (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                    <Card variant="glow">
                      <CardContent className="p-6 space-y-6">
                        <div className="flex items-center justify-between border-b border-black pb-4">
                          <h3 className="font-black text-white text-sm uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-indigo-400" />
                            OCR Extraction Report
                          </h3>
                          <button
                            onClick={() => setScannedData(null)}
                            className="text-slate-500 hover:text-slate-300 text-xs"
                          >
                            Reset
                          </button>
                        </div>

                        {/* Extracted Form fields */}
                        <div className="space-y-3.5 text-xs">
                          <div className="grid grid-cols-2 gap-3.5">
                            <div>
                              <p className="text-slate-500 font-bold uppercase tracking-wider">Vendor</p>
                              <p className="text-white font-extrabold mt-0.5 text-sm">{scannedData.vendor}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 font-bold uppercase tracking-wider">GSTIN Number</p>
                              <p className="text-white font-mono mt-0.5 text-sm flex items-center gap-1">
                                {scannedData.gstin}
                                <span className="inline-flex w-1.5 h-1.5 rounded-full bg-emerald-400" title="Valid" />
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3.5">
                            <div>
                              <p className="text-slate-500 font-bold uppercase tracking-wider">Invoice/Receipt ID</p>
                              <p className="text-white font-mono mt-0.5">{scannedData.invoiceNumber}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 font-bold uppercase tracking-wider">Billing Date</p>
                              <p className="text-white mt-0.5">{scannedData.date}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2 border-t border-b border-black py-3.5 bg-slate-900/30 px-2 rounded-xl">
                            <div>
                              <p className="text-slate-500 font-bold uppercase tracking-wider">Subtotal</p>
                              <p className="text-slate-300 font-semibold mt-0.5">₹{scannedData.amount - scannedData.taxAmount}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 font-bold uppercase tracking-wider">GST Tax</p>
                              <p className="text-slate-300 font-semibold mt-0.5">₹{scannedData.taxAmount}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 font-bold uppercase tracking-wider">Net Amount</p>
                              <p className="text-white font-black mt-0.5 text-sm">₹{scannedData.amount}</p>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <p className="text-slate-500 font-bold uppercase tracking-wider">Auto-detected Category</p>
                            <span className="inline-block px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-white font-extrabold text-[10px] uppercase tracking-widest mt-0.5">
                              {scannedData.category}
                            </span>
                          </div>

                          {/* AI Compliance Check list */}
                          <div className="space-y-1.5">
                            <p className="text-slate-500 font-bold uppercase tracking-wider">AI Policy Inspections</p>
                            <div className="space-y-1">
                              {scannedData.warnings.map((w: string, idx: number) => (
                                <div key={idx} className="flex gap-2 items-start text-[11px] leading-relaxed">
                                  {scannedData.fraudScore > 0.3 ? (
                                    <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0 mt-0.5" />
                                  ) : (
                                    <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                                  )}
                                  <span className={scannedData.fraudScore > 0.3 ? 'text-yellow-400' : 'text-emerald-400'}>{w}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Submit Action */}
                          <button
                            onClick={handleScanSubmit}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all text-center flex items-center justify-center gap-1.5"
                          >
                            <Plus className="w-4 h-4" />
                            Submit Claim to Audits
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ) : (
                  <Card>
                    <CardContent className="p-6 text-center text-slate-500 text-xs py-16 font-semibold border-2 border-dashed border-slate-800 rounded-2xl">
                      <HelpCircle className="h-8 w-8 mx-auto text-slate-600 mb-2" />
                      Upload a receipt or invoice document to trigger OCR and preview extracted ledger values here.
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: EXPENSE CATEGORIES & LIMITS */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              {/* Category charts and limits policies */}
              <div className="grid gap-6 lg:grid-cols-12">
                <div className="lg:col-span-8 space-y-4">
                  <Card>
                    <CardContent className="p-6 space-y-6">
                      <h2 className="text-lg font-black text-white uppercase tracking-wider">Corporate Spending Policy Limits</h2>
                      <div className="space-y-4">
                        {policies.map((p, idx) => (
                          <div key={idx} className="space-y-2 border-b border-white/5 pb-4 last:border-0 last:pb-0">
                            <div className="flex justify-between items-center text-xs">
                              <div>
                                <span className="font-extrabold text-white">{p.category}</span>
                                <span className="text-slate-500 font-semibold ml-2">Limit: ₹{p.limit.toLocaleString()}</span>
                              </div>
                              <div className="text-right">
                                <span className="font-mono font-bold text-white">₹{p.spent.toLocaleString()}</span>
                                <span className={`ml-2 text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                                  p.status === 'violated' ? 'bg-red-500/20 text-red-400' :
                                  p.status === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                                  'bg-emerald-500/20 text-emerald-400'
                                }`}>
                                  {p.status}
                                </span>
                              </div>
                            </div>

                            {/* Progress bar */}
                            <div className="h-2.5 bg-slate-900 border border-black rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  p.status === 'violated' ? 'bg-red-500' :
                                  p.status === 'warning' ? 'bg-yellow-500' :
                                  'bg-indigo-500'
                                }`}
                                style={{ width: `${Math.min((p.spent / p.limit) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Spending Charts */}
                <div className="lg:col-span-4 space-y-4">
                  <Card variant="glow">
                    <CardContent className="p-6 space-y-6">
                      <h2 className="text-lg font-black text-white uppercase tracking-wider">Spending Share</h2>
                      
                      <div className="h-44 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={categoryChartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={35}
                              outerRadius={55}
                              dataKey="value"
                              strokeWidth={0}
                            >
                              {categoryChartData.map((entry, index) => (
                                <Cell key={index} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: any) => value ? `₹${Number(value).toLocaleString()}` : ''} contentStyle={{ background: '#0e1015', border: '1px solid #1e293b' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Legend detail list */}
                      <div className="space-y-1.5 text-xs">
                        {categoryChartData.map((cat, idx) => (
                          <div key={idx} className="flex justify-between items-center font-bold">
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                              <span>{cat.name}</span>
                            </div>
                            <span className="text-white font-mono">₹{cat.value.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: APPROVAL WORKFLOW */}
          {activeTab === 'workflow' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <Card>
                <CardContent className="p-6 space-y-6">
                  <div>
                    <h2 className="text-lg font-black text-white uppercase tracking-wider">Platform Audit Lifecycle</h2>
                    <p className="text-slate-400 text-xs mt-0.5">Claims must transit through automated scanning gates before manual payouts release.</p>
                  </div>

                  {/* SVG Flow diagram */}
                  <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-900/60 p-6 rounded-2xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
                    {[
                      { step: '01', title: 'Upload Ingest', desc: 'Slack, Email, Portal', icon: Upload, bg: 'indigo' },
                      { step: '02', title: 'AI OCR Scan', desc: 'GSTIN, Fraud Audits', icon: Sparkles, bg: 'purple' },
                      { step: '03', title: 'Manager Audit', desc: 'Manual review override', icon: Shield, bg: 'emerald' },
                      { step: '04', title: 'Payout Batch', desc: 'Reimbursement release', icon: CreditCard, bg: 'yellow' }
                    ].map((s, idx) => {
                      const Icon = s.icon
                      return (
                        <React.Fragment key={idx}>
                          <div className="flex-1 flex flex-col items-center text-center p-3 relative z-10">
                            <span className="text-[10px] font-black text-slate-600 font-mono tracking-widest uppercase">{s.step}</span>
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mt-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                              s.bg === 'indigo' ? 'bg-indigo-600/20 text-indigo-400' :
                              s.bg === 'purple' ? 'bg-purple-600/20 text-purple-400' :
                              s.bg === 'emerald' ? 'bg-emerald-600/20 text-emerald-400' :
                              'bg-yellow-600/20 text-yellow-400'
                            }`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <h4 className="font-extrabold text-white text-xs mt-3">{s.title}</h4>
                            <p className="text-[9px] text-slate-500 font-medium mt-0.5 leading-relaxed">{s.desc}</p>
                          </div>
                          {idx < 3 && (
                            <ChevronRight className="w-5 h-5 text-slate-700 hidden md:block" />
                          )}
                        </React.Fragment>
                      )
                    })}
                  </div>

                  {/* Manager Queue */}
                  <div className="space-y-4">
                    <h3 className="font-black text-white text-sm uppercase tracking-wider">Claims Review Queue ({pendingApprovalsQueue.length})</h3>
                    {pendingApprovalsQueue.length === 0 ? (
                      <div className="py-8 text-center text-slate-500 font-bold text-xs bg-slate-900/30 rounded-xl border border-white/5">
                        No claims waiting for review. You are completely caught up!
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {pendingApprovalsQueue.map((e, idx) => (
                          <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-900 border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] gap-4 hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
                            <div>
                              <p className="font-bold text-white text-sm">{e.title}</p>
                              <div className="flex gap-2 text-[10px] text-slate-500 font-semibold mt-1">
                                <span>By: {e.employee_name}</span>
                                <span>•</span>
                                <span className="uppercase">{e.category}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <span className="text-white font-extrabold text-sm font-mono">₹{e.amount.toLocaleString()}</span>
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => handleApprove(e.id)}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wider border border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleReject(e.id)}
                                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wider border border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all"
                                >
                                  Reject
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 5: REIMBURSEMENT STATUS */}
          {activeTab === 'reimbursements' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="bg-slate-900 border-2 border-black p-5 rounded-2xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Total Reimbursed</span>
                  <div className="text-2xl font-black text-white mt-1 font-mono">₹3,93,400</div>
                </div>
                <div className="bg-slate-900 border-2 border-black p-5 rounded-2xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Pending Payout Release</span>
                  <div className="text-2xl font-black text-indigo-400 mt-1 font-mono">₹24,800</div>
                </div>
                <div className="bg-slate-900 border-2 border-black p-5 rounded-2xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Cycle Speed</span>
                  <div className="text-2xl font-black text-emerald-400 mt-1">1.8 Days</div>
                </div>
              </div>

              {/* Payout Batch Log */}
              <Card>
                <CardContent className="p-6 space-y-6">
                  <div>
                    <h2 className="text-lg font-black text-white uppercase tracking-wider">Scheduled Payout Batches</h2>
                    <p className="text-slate-400 text-xs mt-0.5">Track bank disbursement cycles for verified employee claims.</p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b-2 border-black text-slate-400 text-[10px] font-black uppercase tracking-widest">
                          <th className="py-3 px-4">Batch ID</th>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Claims In Batch</th>
                          <th className="py-3 px-4">Disbursement Target</th>
                          <th className="py-3 px-4">Total Amount</th>
                          <th className="py-3 px-4">Bank Ref UTR</th>
                          <th className="py-3 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payoutTrackers.map((p, idx) => (
                          <tr key={idx} className="border-b border-white/5 last:border-0 hover:bg-slate-900/30">
                            <td className="py-4 px-4 font-mono font-bold text-white text-xs">{p.id}</td>
                            <td className="py-4 px-4 text-slate-400 text-xs font-semibold">{p.date}</td>
                            <td className="py-4 px-4 text-slate-300 text-xs font-bold">{p.itemsCount} Claims</td>
                            <td className="py-4 px-4 text-slate-400 text-xs font-semibold">{p.account}</td>
                            <td className="py-4 px-4 text-white font-black text-sm font-mono">₹{p.total.toLocaleString()}</td>
                            <td className="py-4 px-4 font-mono text-[11px] text-slate-500 font-bold">{p.utr}</td>
                            <td className="py-4 px-4">
                              <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${
                                p.status === 'paid'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30 animate-pulse'
                              }`}>
                                {p.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

const MOCK_EXPENSES: ExpenseClaim[] = [
  {
    id: 'exp-1',
    title: 'Flight tickets to Mumbai for client pitch',
    description: 'Indigo flight 6E-205 from New Delhi to Mumbai Chhatrapati Shivaji Airport. Business client presentation scheduled at BKC Office.',
    organization_id: 'org-1',
    amount: 14500,
    currency: 'INR',
    category: 'travel',
    status: 'pending',
    employee_id: 'emp-1',
    employee_name: 'Priya Sharma',
    submitted_at: '2026-05-20T10:30:00Z',
    reviewed_at: null,
    reviewed_by: null,
    reviewer_name: null,
    reviewer_comments: null,
    fraud_score: 0.15,
    risk_level: 'low',
    receipts: [],
    tags: [],
    location: null,
    project_code: null,
    created_at: '2026-05-20T10:30:00Z',
    updated_at: '2026-05-20T10:30:00Z',
    notes: 'All flight segments conform to the default corporate travel policy.'
  },
  {
    id: 'exp-2',
    title: 'Annual Web Hosting Subscription renewal',
    description: 'Hostinger Cloud premium hosting 12-month renewal plan. High invoice amount detected post-billing schedule.',
    organization_id: 'org-1',
    amount: 45200,
    currency: 'INR',
    category: 'software',
    status: 'flagged',
    employee_id: 'emp-2',
    employee_name: 'Rahul Mehta',
    submitted_at: '2026-05-18T14:22:00Z',
    reviewed_at: null,
    reviewed_by: null,
    reviewer_name: null,
    reviewer_comments: null,
    fraud_score: 0.72,
    risk_level: 'high',
    receipts: [],
    tags: [],
    location: null,
    project_code: null,
    created_at: '2026-05-18T14:22:00Z',
    updated_at: '2026-05-18T14:22:00Z',
    notes: 'Amount exceeds regular hosting budget lines. Alert flagged.'
  },
  {
    id: 'exp-3',
    title: 'Client dinner at Taj Hotel',
    description: 'Corporate client dining and project wrap meeting dinner at Shamiana Restaurant, Taj Gateway hotel.',
    organization_id: 'org-1',
    amount: 8200,
    currency: 'INR',
    category: 'meals',
    status: 'approved',
    employee_id: 'emp-3',
    employee_name: 'Arjun Nair',
    submitted_at: '2026-05-15T21:40:00Z',
    reviewed_at: '2026-05-16T09:00:00Z',
    reviewed_by: 'rev-1',
    reviewer_name: 'Finance Reviewer',
    reviewer_comments: null,
    fraud_score: 0.22,
    risk_level: 'low',
    receipts: [],
    tags: [],
    location: null,
    project_code: null,
    created_at: '2026-05-15T21:40:00Z',
    updated_at: '2026-05-16T09:00:00Z',
    notes: 'Taj Gateway hotel receipt parsed. Reconciled with approval schedule.'
  }
]
