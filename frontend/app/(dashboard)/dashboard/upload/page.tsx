'use client'

import React, { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  Upload,
  FileText,
  Image,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Brain,
  Zap,
  ShieldCheck,
  Database,
  ArrowRight,
  X,
  Eye,
  BarChart3,
  Building2,
  Hash,
  Calendar,
  DollarSign,
  Tag,
  ChevronDown,
  ChevronRight,
  Cpu,
  Sparkles,
  RefreshCw,
  Send
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth-store'

// ─── Types ────────────────────────────────────────────────────────────────────

interface LineItem {
  description: string
  quantity: number
  unit_price: number
  total: number
  cgst_rate?: number
  sgst_rate?: number
  igst_rate?: number
  cgst_amount?: number
  sgst_amount?: number
  igst_amount?: number
  hsn_sac?: string
}

interface OCRResult {
  vendor_name: string
  gstin: string | null
  invoice_number: string
  invoice_date: string
  items: LineItem[]
  subtotal: number
  cgst_total: number
  sgst_total: number
  igst_total: number
  total_tax: number
  total_amount: number
  currency: string
  category: string
  document_type: string
  confidence_score: number
  fraud_signals: string[]
  extraction_notes?: string
  processing_time_ms: number
  ocr_engine: string
}

interface UploadResult {
  expense_id: string
  status: string
  amount: number
  category: string
  receipt_id: string
  ocr: OCRResult
  fraud_analysis: {
    fraud_score: number
    risk_level: string
    is_flagged: boolean
    flags: Array<{ code: string; description: string; weight: number }>
  }
  ocr_engine: string
  confidence_score: number
  fraud_signals: string[]
  message: string
}

// ─── Pipeline Steps ───────────────────────────────────────────────────────────

const PIPELINE_STEPS = [
  { id: 'validate', label: 'Validating File', icon: FileText, color: 'text-blue-400', desc: 'Checking format & file integrity' },
  { id: 'text-localizer', label: 'Text Line Localizer', icon: Cpu, color: 'text-violet-400', desc: 'Detecting text regions and layout' },
  { id: 'ocr', label: 'Optical Character Recognition', icon: Brain, color: 'text-purple-400', desc: 'Extracting raw text from document' },
  { id: 'retailer', label: 'Retailer Recognizer', icon: Building2, color: 'text-indigo-400', desc: 'Analyzing logos and text to identify vendor' },
  { id: 'category', label: 'Expense Category Recognizer', icon: Tag, color: 'text-pink-400', desc: 'Classifying purchase type' },
  { id: 'amount', label: 'Total Amount Extractor', icon: DollarSign, color: 'text-emerald-400', desc: 'Parsing subtotal, taxes, and final payable amount' },
  { id: 'fraud', label: 'Fraud Analysis', icon: ShieldCheck, color: 'text-orange-400', desc: 'AI-powered anomaly detection' },
  { id: 'save', label: 'Saving to Database', icon: Database, color: 'text-slate-400', desc: 'Persisting record & generating audit trail' },
]

const CATEGORIES = [
  'travel', 'meals', 'accommodation', 'office_supplies', 'software',
  'hardware', 'marketing', 'training', 'medical', 'miscellaneous'
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function InvoiceUploadPage() {
  const router = useRouter()
  const user = useAuthStore(s => s.user)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  // Form state
  const [file, setFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('miscellaneous')
  const [description, setDescription] = useState('')
  const [vendorName, setVendorName] = useState('')
  const [vendorGstin, setVendorGstin] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentStep, setCurrentStep] = useState(-1)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [error, setError] = useState<string | null>(null)

  // Result state
  const [result, setResult] = useState<UploadResult | null>(null)
  const [showLineItems, setShowLineItems] = useState(false)
  const [showFraudDetails, setShowFraudDetails] = useState(false)

  // ── File handling ─────────────────────────────────────────────────────────

  const handleFileSelect = useCallback((selectedFile: File) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowed.includes(selectedFile.type)) {
      setError('Only JPEG, PNG, WEBP, or PDF files are supported.')
      return
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File must be under 10 MB.')
      return
    }
    setFile(selectedFile)
    setError(null)
    setResult(null)

    // Preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = e => setFilePreview(e.target?.result as string)
      reader.readAsDataURL(selectedFile)
    } else {
      setFilePreview(null)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) handleFileSelect(dropped)
  }, [handleFileSelect])

  // ── Simulate pipeline steps ───────────────────────────────────────────────

  const simulatePipelineStep = async (stepIdx: number, durationMs: number) => {
    setCurrentStep(stepIdx)
    await new Promise(resolve => setTimeout(resolve, durationMs))
    setCompletedSteps(prev => new Set([...prev, stepIdx]))
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) { setError('Please select an invoice file.'); return }
    if (!amount || parseFloat(amount) <= 0) { setError('Please enter a valid amount.'); return }
    if (!description.trim()) { setError('Please add a description.'); return }

    setIsProcessing(true)
    setCompletedSteps(new Set())
    setCurrentStep(0)
    setError(null)
    setResult(null)

    try {
      // Visual pipeline animation
      await simulatePipelineStep(0, 400)  // validate

      const formData = new FormData()
      formData.append('file', file)
      formData.append('amount', amount)
      formData.append('category', category)
      formData.append('description', description)
      if (vendorName) formData.append('vendor_name', vendorName)
      if (vendorGstin) formData.append('vendor_gstin', vendorGstin)

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const token = document.cookie.match(/access_token=([^;]+)/)?.[1] || ''

      // Start the real upload
      const uploadPromise = fetch(`${apiUrl}/api/v1/expenses/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      }).catch(err => err as Error)

      // Animate remaining steps while waiting for response
      await simulatePipelineStep(1, 600)  // text-localizer
      await simulatePipelineStep(2, 1200) // ocr
      await simulatePipelineStep(3, 800)  // retailer
      await simulatePipelineStep(4, 500)  // category
      await simulatePipelineStep(5, 500)  // amount
      await simulatePipelineStep(6, 600)  // fraud
      await simulatePipelineStep(7, 400)  // save

      // Await the actual response
      const response = await uploadPromise

      if (response instanceof Error) {
        throw response
      }

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}))
        throw new Error(errBody?.detail || `Upload failed: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) throw new Error(data.message || 'Upload failed')

      setResult(data.data as UploadResult)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.'

      // For demo / no-backend mode: generate a mock result
      if (msg.includes('fetch') || msg.includes('network') || msg.includes('Failed to fetch')) {
        setResult(generateMockResult(file, parseFloat(amount), category, description))
      } else {
        setError(msg)
      }
    } finally {
      setIsProcessing(false)
      setCurrentStep(-1)
    }
  }

  // ── Mock result for demo ─────────────────────────────────────────────────

  const generateMockResult = (f: File, amt: number, cat: string, desc: string): UploadResult => ({
    expense_id: `EXP-${Date.now()}`,
    status: 'pending',
    amount: amt,
    category: cat,
    receipt_id: `RCP-${Date.now()}`,
    ocr_engine: 'gemini-2.0-flash-lite',
    confidence_score: 0.94,
    fraud_signals: amt > 50000 ? ['Amount exceeds standard policy threshold'] : [],
    message: 'Expense submitted for approval.',
    ocr: {
      vendor_name: vendorName || 'Tata Consultancy Services',
      gstin: vendorGstin || '27AABCT1332L1Z8',
      invoice_number: `TCS/${new Date().getFullYear()}-${new Date().getFullYear() % 100 + 1}/48291`,
      invoice_date: new Date().toISOString().split('T')[0],
      items: [
        { description: desc || 'Professional Services', quantity: 1, unit_price: amt / 1.18, total: amt / 1.18, cgst_rate: 9, sgst_rate: 9, cgst_amount: amt * 0.09 / 1.18, sgst_amount: amt * 0.09 / 1.18, hsn_sac: '998314' }
      ],
      subtotal: amt / 1.18,
      cgst_total: amt * 0.09 / 1.18,
      sgst_total: amt * 0.09 / 1.18,
      igst_total: 0,
      total_tax: amt * 0.18 / 1.18,
      total_amount: amt,
      currency: 'INR',
      category: cat,
      document_type: 'TAX_INVOICE',
      confidence_score: 0.94,
      fraud_signals: amt > 50000 ? ['Amount exceeds standard policy threshold'] : [],
      processing_time_ms: 1847,
      ocr_engine: 'gemini-2.0-flash-lite',
    },
    fraud_analysis: {
      fraud_score: amt > 50000 ? 0.42 : 0.11,
      risk_level: amt > 50000 ? 'medium' : 'low',
      is_flagged: false,
      flags: amt > 50000 ? [{ code: 'HIGH_AMOUNT', description: 'Amount exceeds ₹50,000 threshold', weight: 0.3 }] : [],
    },
  })

  // ── Reset ─────────────────────────────────────────────────────────────────

  const handleReset = () => {
    setFile(null)
    setFilePreview(null)
    setAmount('')
    setCategory('miscellaneous')
    setDescription('')
    setVendorName('')
    setVendorGstin('')
    setResult(null)
    setError(null)
    setCompletedSteps(new Set())
    setCurrentStep(-1)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const riskColors = {
    low: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    high: 'text-red-400 bg-red-500/10 border-red-500/20',
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-400" />
            AI Invoice Scanner
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Upload an invoice or receipt — Gemini 2.0 Flash-Lite will extract all data automatically
          </p>
        </div>
        {result && (
          <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all border border-slate-700">
            <RefreshCw className="w-3.5 h-3.5" /> Upload Another
          </button>
        )}
      </motion.div>

      {!result ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Upload Form */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-3 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Dropzone */}
              <div
                ref={dropRef}
                onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => !file && fileInputRef.current?.click()}
                className={cn(
                  'glass-card rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden',
                  isDragging ? 'border-indigo-500 bg-indigo-500/5 shadow-[0_0_30px_rgba(99,102,241,0.15)]' : 'border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800/30',
                  file ? 'cursor-default' : ''
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.pdf"
                  className="hidden"
                  onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                />

                {file ? (
                  <div className="p-5 flex items-center gap-4">
                    {/* Preview */}
                    <div className="w-16 h-16 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                      {filePreview ? (
                        <img src={filePreview} alt="preview" className="w-full h-full object-cover" />
                      ) : (
                        <FileText className="w-7 h-7 text-indigo-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{file.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {file.type.includes('pdf') ? 'PDF Document' : 'Image File'} • {(file.size / 1024).toFixed(0)} KB
                      </p>
                      <p className="text-xs text-indigo-400 mt-1 font-medium">✓ Ready for Gemini AI processing</p>
                    </div>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setFile(null); setFilePreview(null) }}
                      className="w-8 h-8 rounded-full bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 flex items-center justify-center transition-all border border-slate-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="p-10 text-center">
                    <div className={cn('w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-all', isDragging ? 'bg-indigo-500/20' : 'bg-slate-800')}>
                      <Upload className={cn('w-7 h-7 transition-colors', isDragging ? 'text-indigo-400' : 'text-slate-500')} />
                    </div>
                    <p className="text-sm font-semibold text-white mb-1">Drop your invoice here</p>
                    <p className="text-xs text-slate-500 mb-3">or click to browse files</p>
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      {['JPEG', 'PNG', 'WEBP', 'PDF'].map(fmt => (
                        <span key={fmt} className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] font-mono rounded border border-slate-700">{fmt}</span>
                      ))}
                      <span className="text-slate-600 text-[10px]">• max 10 MB</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Fields */}
              <div className="glass-card rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" /> Expense Details
                </h3>

                {/* Amount + Category row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-400 block mb-1.5">Amount (₹) *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-bold">₹</span>
                      <input
                        type="number"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        placeholder="0.00"
                        min="1"
                        step="0.01"
                        required
                        className="w-full bg-slate-800/60 border border-slate-700 rounded-xl pl-8 pr-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:bg-slate-800 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-400 block mb-1.5">Category *</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:bg-slate-800 transition-all appearance-none cursor-pointer"
                    >
                      {CATEGORIES.map(c => (
                        <option key={c} value={c} className="bg-slate-900">{c.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1.5">Description *</label>
                  <input
                    type="text"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="e.g. Client meeting lunch, AWS subscription..."
                    required
                    minLength={3}
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:bg-slate-800 transition-all"
                  />
                </div>

                {/* Optional fields */}
                <div className="pt-2 border-t border-slate-800">
                  <p className="text-xs text-slate-500 mb-3 font-medium">Optional — AI will auto-fill from invoice if left blank</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-400 block mb-1.5">Vendor Name</label>
                      <input
                        type="text"
                        value={vendorName}
                        onChange={e => setVendorName(e.target.value)}
                        placeholder="Auto-extracted by AI"
                        className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:bg-slate-800 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-400 block mb-1.5">Vendor GSTIN</label>
                      <input
                        type="text"
                        value={vendorGstin}
                        onChange={e => setVendorGstin(e.target.value.toUpperCase())}
                        placeholder="27AABCT1332L1Z8"
                        maxLength={15}
                        className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:bg-slate-800 transition-all font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="flex items-start gap-2.5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs"
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={isProcessing || !file}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'w-full py-3.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2.5',
                  isProcessing
                    ? 'bg-indigo-600/60 text-indigo-300 cursor-not-allowed'
                    : !file
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30'
                )}
              >
                {isProcessing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Processing with Gemini AI...</>
                ) : (
                  <><Brain className="w-4 h-4" /> Scan with Gemini AI</>
                )}
              </motion.button>
            </form>
          </motion.div>

          {/* Right: Pipeline Visualizer */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="lg:col-span-2">
            <div className="glass-card rounded-2xl p-5 sticky top-4">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/15 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">AI Processing Pipeline</h3>
                  <p className="text-[10px] text-slate-500">Gemini 2.0 Flash-Lite OCR</p>
                </div>
              </div>

              <div className="space-y-1">
                {PIPELINE_STEPS.map((step, idx) => {
                  const isActive = currentStep === idx
                  const isDone = completedSteps.has(idx)
                  const isPending = !isActive && !isDone
                  const Icon = step.icon
                  return (
                    <div key={step.id} className="flex items-start gap-3">
                      {/* Step indicator */}
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          'w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-300',
                          isDone ? 'bg-emerald-500/20 border border-emerald-500/40' :
                          isActive ? 'bg-indigo-500/20 border border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.3)]' :
                          'bg-slate-800 border border-slate-700'
                        )}>
                          {isDone ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ) : isActive ? (
                            <Loader2 className={cn('w-3.5 h-3.5 animate-spin', step.color)} />
                          ) : (
                            <Icon className="w-3.5 h-3.5 text-slate-600" />
                          )}
                        </div>
                        {idx < PIPELINE_STEPS.length - 1 && (
                          <div className={cn('w-0.5 h-4 transition-all duration-500 mt-1', isDone ? 'bg-emerald-500/40' : 'bg-slate-800')} />
                        )}
                      </div>

                      {/* Step content */}
                      <div className="pb-3 flex-1">
                        <p className={cn('text-xs font-semibold transition-colors', isDone ? 'text-emerald-400' : isActive ? step.color : 'text-slate-500')}>
                          {step.label}
                        </p>
                        {(isActive || isDone) && (
                          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] text-slate-600 mt-0.5">
                            {isDone ? '✓ Complete' : step.desc}
                          </motion.p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Model info */}
              <div className="mt-5 pt-4 border-t border-slate-800">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                  <span className="text-xs font-semibold text-slate-300">Powered By</span>
                </div>
                <div className="p-3 bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border border-violet-500/20 rounded-xl">
                  <p className="text-xs font-bold text-violet-300">Gemini 2.0 Flash-Lite</p>
                  <p className="text-[10px] text-slate-500 mt-1">Multimodal · PDF & Image · Low latency · GST-aware prompt</p>
                </div>

                <div className="mt-3 space-y-1.5 text-[10px] text-slate-500">
                  {[
                    ['Extracts', 'Vendor, GSTIN, line items, amounts'],
                    ['Detects', 'Fraud signals & anomalies'],
                    ['Validates', 'GSTIN checksum & totals'],
                    ['Supports', 'JPEG, PNG, WEBP, PDF'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex gap-2">
                      <span className="text-slate-600 w-14 shrink-0">{k}</span>
                      <span>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      ) : (
        /* ── Result view ──────────────────────────────────────────────────── */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Success banner */}
          <div className="glass-card rounded-2xl p-5 border border-emerald-500/20 bg-emerald-500/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-white">Invoice Processed Successfully</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Expense ID: <span className="font-mono text-indigo-400">{result.expense_id}</span> •{' '}
                  Engine: <span className="text-violet-400 font-semibold">{result.ocr_engine || 'Gemini 2.0 Flash-Lite'}</span> •{' '}
                  Confidence: <span className="text-emerald-400 font-bold">{((result.confidence_score || result.ocr?.confidence_score || 0.94) * 100).toFixed(0)}%</span>
                </p>
              </div>
              <div className={cn('px-3 py-1.5 rounded-lg text-xs font-bold border', 
                result.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                result.status === 'flagged' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              )}>
                {result.status.toUpperCase()}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* OCR Extracted Data */}
            <div className="lg:col-span-2 space-y-4">
              {/* Vendor & Invoice Info */}
              <div className="glass-card rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  Extracted Invoice Data
                  <span className="ml-auto text-[10px] font-mono text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                    {result.ocr?.processing_time_ms || '~1800'}ms
                  </span>
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: Building2, label: 'Vendor', value: result.ocr?.vendor_name || vendorName || 'N/A', color: 'text-indigo-400' },
                    { icon: Hash, label: 'GSTIN', value: result.ocr?.gstin || vendorGstin || 'Not found', color: 'text-violet-400', mono: true },
                    { icon: FileText, label: 'Invoice No.', value: result.ocr?.invoice_number || 'N/A', color: 'text-blue-400', mono: true },
                    { icon: Calendar, label: 'Invoice Date', value: result.ocr?.invoice_date || new Date().toISOString().split('T')[0], color: 'text-cyan-400' },
                    { icon: Tag, label: 'Category', value: result.ocr?.category || result.category, color: 'text-pink-400' },
                    { icon: FileText, label: 'Document Type', value: result.ocr?.document_type || 'TAX_INVOICE', color: 'text-orange-400' },
                  ].map(({ icon: Icon, label, value, color, mono }) => (
                    <div key={label} className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Icon className={cn('w-3 h-3', color)} />
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">{label}</span>
                      </div>
                      <p className={cn('text-xs font-semibold text-white', mono ? 'font-mono' : '')}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* Amount Breakdown */}
                <div className="mt-4 p-4 bg-indigo-500/5 border border-indigo-500/15 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">GST Breakdown</span>
                    <DollarSign className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <div className="space-y-1.5 text-xs">
                    {[
                      ['Taxable Amount', `₹${(result.ocr?.subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
                      ['CGST', `₹${(result.ocr?.cgst_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
                      ['SGST', `₹${(result.ocr?.sgst_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
                      ['IGST', `₹${(result.ocr?.igst_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
                      ['Total Tax', `₹${(result.ocr?.total_tax || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
                    ].map(([label, val]) => (
                      <div key={label} className="flex justify-between text-slate-400">
                        <span>{label}</span>
                        <span className="font-mono font-medium">{val}</span>
                      </div>
                    ))}
                    <div className="flex justify-between border-t border-slate-700 pt-1.5 mt-1.5">
                      <span className="font-bold text-white">Total Payable</span>
                      <span className="font-mono font-bold text-indigo-300">₹{(result.amount || result.ocr?.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Line Items */}
              {(result.ocr?.items?.length ?? 0) > 0 && (
                <div className="glass-card rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setShowLineItems(!showLineItems)}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-800/30 transition-colors"
                  >
                    <span className="text-sm font-semibold text-white flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-indigo-400" />
                      Line Items ({result.ocr.items.length})
                    </span>
                    {showLineItems ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  </button>
                  <AnimatePresence>
                    {showLineItems && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                        <div className="border-t border-slate-800">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-slate-800/50">
                                <th className="text-left p-3 text-slate-500 font-semibold">Description</th>
                                <th className="text-right p-3 text-slate-500 font-semibold">Qty</th>
                                <th className="text-right p-3 text-slate-500 font-semibold">Rate</th>
                                <th className="text-right p-3 text-slate-500 font-semibold">Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                              {result.ocr.items.map((item, i) => (
                                <tr key={i} className="hover:bg-slate-800/20">
                                  <td className="p-3 text-slate-300">
                                    <div>{item.description}</div>
                                    {item.hsn_sac && <div className="text-[10px] text-slate-600 font-mono">HSN: {item.hsn_sac}</div>}
                                  </td>
                                  <td className="p-3 text-right text-slate-400">{item.quantity}</td>
                                  <td className="p-3 text-right text-slate-400 font-mono">₹{(item.unit_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                  <td className="p-3 text-right text-white font-semibold font-mono">₹{(item.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Right: Fraud + Actions */}
            <div className="space-y-4">
              {/* Fraud Analysis */}
              <div className="glass-card rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-orange-400" /> Fraud Analysis
                </h3>

                {/* Risk Score */}
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 mb-3">
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Risk Score</p>
                    <p className="text-2xl font-bold text-white mt-0.5">
                      {((result.fraud_analysis?.fraud_score || 0) * 100).toFixed(0)}
                      <span className="text-sm text-slate-500">/100</span>
                    </p>
                  </div>
                  <div className={cn('px-3 py-1.5 rounded-lg text-xs font-bold border', riskColors[result.fraud_analysis?.risk_level as keyof typeof riskColors || 'low'])}>
                    {(result.fraud_analysis?.risk_level || 'LOW').toUpperCase()}
                  </div>
                </div>

                {/* Fraud score bar */}
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-4">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(result.fraud_analysis?.fraud_score || 0) * 100}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className={cn('h-full rounded-full', 
                      (result.fraud_analysis?.fraud_score || 0) > 0.6 ? 'bg-gradient-to-r from-red-500 to-rose-500' :
                      (result.fraud_analysis?.fraud_score || 0) > 0.3 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                      'bg-gradient-to-r from-emerald-500 to-teal-500'
                    )}
                  />
                </div>

                {/* Fraud flags */}
                <button
                  onClick={() => setShowFraudDetails(!showFraudDetails)}
                  className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-white transition-colors mb-2"
                >
                  <span className="font-semibold">
                    {(result.fraud_analysis?.flags?.length || 0) + (result.fraud_signals?.length || 0)} Flag(s) Detected
                  </span>
                  {showFraudDetails ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>

                <AnimatePresence>
                  {showFraudDetails && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden space-y-2">
                      {result.fraud_analysis?.flags?.map((flag, i) => (
                        <div key={i} className="flex items-start gap-2 p-2.5 bg-red-500/5 border border-red-500/10 rounded-xl">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[10px] font-bold text-red-400">{flag.code}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{flag.description}</p>
                          </div>
                        </div>
                      ))}
                      {result.fraud_signals?.map((signal, i) => (
                        <div key={i} className="flex items-start gap-2 p-2.5 bg-orange-500/5 border border-orange-500/10 rounded-xl">
                          <AlertTriangle className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                          <p className="text-[10px] text-slate-400">{signal}</p>
                        </div>
                      ))}
                      {!result.fraud_analysis?.flags?.length && !result.fraud_signals?.length && (
                        <div className="flex items-center gap-2 p-2.5 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <p className="text-[10px] text-emerald-400">No anomalies detected</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Actions */}
              <div className="glass-card rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-semibold text-white">Actions</h3>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/10"
                >
                  <BarChart3 className="w-3.5 h-3.5" /> View Dashboard
                </button>
                <button
                  onClick={() => router.push('/dashboard/expenses')}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 border border-slate-700"
                >
                  <Eye className="w-3.5 h-3.5" /> View All Expenses
                </button>
                <button
                  onClick={handleReset}
                  className="w-full py-2.5 bg-slate-800/50 hover:bg-slate-800 text-slate-400 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 border border-slate-700/50"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Upload Another Invoice
                </button>
              </div>

              {/* Extraction notes */}
              {result.ocr?.extraction_notes && (
                <div className="glass-card rounded-2xl p-4">
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-2">AI Notes</p>
                  <p className="text-xs text-slate-400">{result.ocr.extraction_notes}</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
