'use client'

import React, { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  ShieldCheck,
  ShieldX,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  FileImage,
  Sparkles,
  Brain,
  Eye,
  X,
  ChevronDown,
  ChevronUp,
  Building2,
  Calendar,
  DollarSign,
  Info,
  Zap,
  BadgeCheck,
  ScanLine,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface DetailedFindings {
  print_quality: string
  font_consistency: string
  math_correct: boolean | null
  logo_present: boolean
  official_branding: boolean
  stamps_signatures: string
  date_valid: boolean | null
  amount_format_correct: boolean | null
  contact_info_present: boolean
  tax_info_present: boolean
  handwritten_alterations: boolean
  digital_tampering_signs: boolean
  image_quality: string
  structural_integrity: string
}

interface ReceiptAnalysis {
  is_receipt: boolean
  document_type: string
  verdict: 'GENUINE' | 'SUSPICIOUS' | 'FAKE'
  authenticity_score: number
  confidence: number
  vendor_name: string | null
  total_amount: number | null
  currency: string | null
  date: string | null
  summary: string
  genuine_indicators: string[]
  suspicious_indicators: string[]
  detailed_findings: DetailedFindings
  recommendation: 'ACCEPT' | 'MANUAL_REVIEW' | 'REJECT'
  rejection_reason: string | null
  not_a_receipt_reason: string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const verdictConfig = {
  GENUINE: {
    label: 'Genuine Receipt',
    emoji: '✅',
    color: 'emerald',
    gradient: 'from-emerald-600 to-teal-600',
    bgGlow: 'bg-emerald-500',
    border: 'border-emerald-500/40',
    cardBg: 'bg-emerald-500/5',
    textColor: 'text-emerald-400',
    icon: ShieldCheck,
    desc: 'This receipt appears to be authentic and legitimate.',
  },
  SUSPICIOUS: {
    label: 'Suspicious — Review Needed',
    emoji: '⚠️',
    color: 'amber',
    gradient: 'from-amber-600 to-orange-600',
    bgGlow: 'bg-amber-500',
    border: 'border-amber-500/40',
    cardBg: 'bg-amber-500/5',
    textColor: 'text-amber-400',
    icon: ShieldAlert,
    desc: 'This receipt has suspicious elements that require manual review.',
  },
  FAKE: {
    label: 'Fake / Fraudulent',
    emoji: '🚨',
    color: 'red',
    gradient: 'from-red-600 to-rose-600',
    bgGlow: 'bg-red-500',
    border: 'border-red-500/40',
    cardBg: 'bg-red-500/5',
    textColor: 'text-red-400',
    icon: ShieldX,
    desc: 'AI has detected strong indicators that this document is fake or tampered.',
  },
}

function ScoreRing({ score, verdict }: { score: number; verdict: 'GENUINE' | 'SUSPICIOUS' | 'FAKE' }) {
  const cfg = verdictConfig[verdict]
  const pct = Math.round(score * 100)
  const radius = 52
  const circ = 2 * Math.PI * radius
  const strokeDash = (score * circ).toFixed(2)

  const strokeColor =
    verdict === 'GENUINE' ? '#10b981' : verdict === 'SUSPICIOUS' ? '#f59e0b' : '#ef4444'

  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
        <motion.circle
          cx="60" cy="60" r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${strokeDash} ${circ}`}
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: `${strokeDash} ${circ}` }}
          transition={{ duration: 1.4, ease: 'easeOut', delay: 0.3 }}
          style={{ filter: `drop-shadow(0 0 8px ${strokeColor})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className={cn('text-3xl font-black', cfg.textColor)}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          {pct}
        </motion.span>
        <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">Score</span>
      </div>
    </div>
  )
}

function FindingRow({ label, value }: { label: string; value: boolean | string | null }) {
  if (value === null || value === undefined) return null

  const isGood =
    typeof value === 'boolean'
      ? label.includes('tampering') || label.includes('alteration') || label.includes('digital')
        ? !value
        : value
      : ['professional', 'consistent', 'intact', 'present', 'high', 'acceptable'].includes(
          String(value).toLowerCase()
        )

  const isBad =
    typeof value === 'boolean'
      ? label.includes('tampering') || label.includes('alteration') || label.includes('digital')
        ? value
        : !value
      : ['suspicious', 'major_inconsistencies', 'major_issues', 'poor', 'low'].includes(
          String(value).toLowerCase()
        )

  const displayValue =
    typeof value === 'boolean'
      ? value
        ? 'Yes'
        : 'No'
      : String(value).replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())

  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60 last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span
        className={cn(
          'text-xs font-semibold px-2 py-0.5 rounded-full',
          isGood && !isBad
            ? 'text-emerald-400 bg-emerald-500/10'
            : isBad
            ? 'text-red-400 bg-red-500/10'
            : 'text-slate-400 bg-slate-700/40'
        )}
      >
        {displayValue}
      </span>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReceiptVerifyPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisStep, setAnalysisStep] = useState(0)
  const [result, setResult] = useState<ReceiptAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  const STEPS = [
    { label: 'Uploading image…', icon: Upload },
    { label: 'AI scanning document…', icon: ScanLine },
    { label: 'Running fraud checks…', icon: Brain },
    { label: 'Generating verdict…', icon: BadgeCheck },
  ]

  const handleFileSelect = useCallback((f: File) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowed.includes(f.type)) {
      setError('Please upload a JPEG, PNG, or WEBP image.')
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('Image must be under 10 MB.')
      return
    }
    setFile(f)
    setError(null)
    setResult(null)
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(f)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragging(false)
      if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0])
    },
    [handleFileSelect]
  )

  const handleAnalyze = async () => {
    if (!file) return
    setIsAnalyzing(true)
    setError(null)
    setResult(null)
    setShowDetails(false)

    // Animate steps
    setAnalysisStep(0)
    const stepTimer = setInterval(() => {
      setAnalysisStep((s) => Math.min(s + 1, STEPS.length - 1))
    }, 900)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/verify-receipt', {
        method: 'POST',
        body: formData,
      })

      clearInterval(stepTimer)

      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.error || 'Analysis failed. Please try again.')
        return
      }

      setAnalysisStep(STEPS.length - 1)
      await new Promise((r) => setTimeout(r, 400))
      setResult(data.analysis as ReceiptAnalysis)
    } catch {
      clearInterval(stepTimer)
      setError('Network error — please check your connection and try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setPreview(null)
    setResult(null)
    setError(null)
    setIsAnalyzing(false)
    setAnalysisStep(0)
    setShowDetails(false)
  }

  const cfg = result?.verdict ? verdictConfig[result.verdict] : null
  const VerdictIcon = cfg?.icon

  return (
    <div className="space-y-6 pb-12">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <ShieldCheck className="w-4.5 h-4.5 text-white" />
            </div>
            Receipt Authenticity Checker
          </h1>
          <p className="text-slate-400 text-xs mt-1.5 max-w-xl">
            Upload any receipt or invoice — Gemini AI will forensically analyse it and tell you
            whether it's <span className="text-emerald-400 font-semibold">Genuine</span>,{' '}
            <span className="text-amber-400 font-semibold">Suspicious</span>, or{' '}
            <span className="text-red-400 font-semibold">Fake</span>.
          </p>
        </div>
        {(result || file) && (
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all border border-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Start Over
          </button>
        )}
      </motion.div>

      {!result ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* ── Left: Upload ── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 }}
            className="lg:col-span-3 space-y-4"
          >
            {/* Dropzone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => !file && !isAnalyzing && fileInputRef.current?.click()}
              className={cn(
                'glass-card rounded-2xl border-2 border-dashed transition-all duration-300 overflow-hidden',
                isDragging
                  ? 'border-violet-500 bg-violet-500/5 shadow-[0_0_40px_rgba(139,92,246,0.15)]'
                  : file
                  ? 'border-slate-700 cursor-default'
                  : 'border-slate-700 hover:border-violet-500/60 hover:bg-slate-800/30 cursor-pointer'
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />

              {file && preview ? (
                <div className="relative">
                  {/* Image Preview */}
                  <div className="relative aspect-[4/3] bg-slate-950 overflow-hidden">
                    <img
                      src={preview}
                      alt="Receipt preview"
                      className="w-full h-full object-contain"
                    />
                    {/* Scan line animation while analyzing */}
                    <AnimatePresence>
                      {isAnalyzing && (
                        <motion.div
                          initial={{ top: '-4px' }}
                          animate={{ top: '104%' }}
                          transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                          className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-violet-400 to-transparent shadow-[0_0_20px_rgba(139,92,246,0.8)]"
                          style={{ position: 'absolute' }}
                        />
                      )}
                    </AnimatePresence>
                    {/* Overlay while analyzing */}
                    <AnimatePresence>
                      {isAnalyzing && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center gap-4"
                        >
                          {/* Animated brain icon */}
                          <motion.div
                            animate={{ scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="w-16 h-16 rounded-2xl bg-violet-500/20 border border-violet-500/40 flex items-center justify-center"
                          >
                            <Brain className="w-8 h-8 text-violet-400" />
                          </motion.div>

                          {/* Step indicators */}
                          <div className="space-y-2 w-56">
                            {STEPS.map((step, i) => {
                              const StepIcon = step.icon
                              const active = analysisStep === i
                              const done = analysisStep > i
                              return (
                                <div key={i} className="flex items-center gap-2.5">
                                  <div className={cn(
                                    'w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all',
                                    done ? 'bg-emerald-500/20 border border-emerald-500/40' :
                                    active ? 'bg-violet-500/20 border border-violet-500/40' :
                                    'bg-slate-800 border border-slate-700'
                                  )}>
                                    {done ? (
                                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                    ) : active ? (
                                      <Loader2 className="w-3 h-3 text-violet-400 animate-spin" />
                                    ) : (
                                      <StepIcon className="w-3 h-3 text-slate-600" />
                                    )}
                                  </div>
                                  <span className={cn(
                                    'text-xs transition-colors',
                                    done ? 'text-emerald-400' : active ? 'text-violet-300' : 'text-slate-600'
                                  )}>
                                    {step.label}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* File info bar */}
                  <div className="flex items-center gap-3 px-4 py-3 border-t border-slate-800">
                    <FileImage className="w-4 h-4 text-violet-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{file.name}</p>
                      <p className="text-[10px] text-slate-500">{(file.size / 1024).toFixed(0)} KB</p>
                    </div>
                    {!isAnalyzing && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleReset() }}
                        className="w-6 h-6 rounded-full bg-slate-800 hover:bg-red-500/20 text-slate-500 hover:text-red-400 flex items-center justify-center transition-all border border-slate-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <motion.div
                    animate={isDragging ? { scale: 1.1 } : { scale: 1 }}
                    className={cn(
                      'w-20 h-20 rounded-3xl mx-auto mb-5 flex items-center justify-center transition-all',
                      isDragging ? 'bg-violet-500/20' : 'bg-slate-800'
                    )}
                  >
                    <Upload className={cn('w-9 h-9 transition-colors', isDragging ? 'text-violet-400' : 'text-slate-500')} />
                  </motion.div>
                  <p className="text-base font-bold text-white mb-1.5">Drop your receipt here</p>
                  <p className="text-sm text-slate-500 mb-4">or click to browse your files</p>
                  <div className="flex items-center justify-center gap-2">
                    {['JPEG', 'PNG', 'WEBP'].map((fmt) => (
                      <span key={fmt} className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] font-mono rounded border border-slate-700">
                        {fmt}
                      </span>
                    ))}
                    <span className="text-slate-600 text-[10px]">• max 10 MB</span>
                  </div>
                </div>
              )}
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Analyse Button */}
            <motion.button
              onClick={handleAnalyze}
              disabled={!file || isAnalyzing}
              whileTap={{ scale: 0.97 }}
              className={cn(
                'w-full py-4 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-3',
                !file
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : isAnalyzing
                  ? 'bg-violet-600/50 text-violet-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40'
              )}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Gemini AI is analysing…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Verify Receipt with Gemini AI
                </>
              )}
            </motion.button>
          </motion.div>

          {/* ── Right: Info Panel ── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-4"
          >
            {/* How it works */}
            <div className="glass-card rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-violet-400" /> How It Works
              </h3>
              <div className="space-y-3">
                {[
                  { icon: Upload, color: 'text-blue-400', label: 'Upload', desc: 'Drop any receipt or invoice image' },
                  { icon: Brain, color: 'text-violet-400', label: 'AI Analysis', desc: 'Gemini forensically examines the document' },
                  { icon: Eye, color: 'text-pink-400', label: 'Fraud Checks', desc: '15+ authenticity checks run automatically' },
                  { icon: ShieldCheck, color: 'text-emerald-400', label: 'Verdict', desc: 'Get a clear Genuine / Fake verdict with evidence' },
                ].map((item, i) => {
                  const Icon = item.icon
                  return (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
                        <Icon className={cn('w-3.5 h-3.5', item.color)} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">{item.label}</p>
                        <p className="text-[11px] text-slate-500">{item.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* What we check */}
            <div className="glass-card rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-400" /> What AI Checks
              </h3>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  'Math accuracy', 'Font consistency', 'Digital tampering',
                  'Handwritten edits', 'Logo authenticity', 'Date validity',
                  'Vendor details', 'Tax numbers', 'Amount formatting',
                  'Print quality', 'Official stamps', 'Structural integrity',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <div className="w-1 h-1 rounded-full bg-indigo-500 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Powered by */}
            <div className="p-4 bg-gradient-to-br from-violet-500/10 via-indigo-500/10 to-transparent border border-violet-500/20 rounded-2xl">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span className="text-sm font-bold text-violet-300">Gemini 2.0 Flash-Lite</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Powered by Google's multimodal AI — the same model used for enterprise expense auditing.
              </p>
            </div>
          </motion.div>
        </div>
      ) : (
        /* ── RESULTS ── */
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="space-y-5"
          >
            {/* ── Verdict Hero Card ── */}
            <div className={cn(
              'relative overflow-hidden rounded-3xl border-2 p-8',
              cfg!.border, cfg!.cardBg
            )}>
              {/* Background glow */}
              <div className={cn('absolute inset-0 opacity-[0.07] blur-3xl pointer-events-none', cfg!.bgGlow)} />

              {/* Grid for FAKE */}
              {result.verdict === 'FAKE' && (
                <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
                  backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 24px, rgba(239,68,68,0.5) 24px, rgba(239,68,68,0.5) 25px), repeating-linear-gradient(90deg, transparent, transparent 24px, rgba(239,68,68,0.5) 24px, rgba(239,68,68,0.5) 25px)'
                }} />
              )}

              <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8">
                {/* Score Ring */}
                <div className="shrink-0 flex flex-col items-center gap-3">
                  <ScoreRing score={result.authenticity_score} verdict={result.verdict} />
                  <div className={cn(
                    'px-3 py-1 rounded-full text-[11px] font-bold border',
                    result.verdict === 'GENUINE' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                    result.verdict === 'SUSPICIOUS' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
                    'bg-red-500/15 text-red-400 border-red-500/30'
                  )}>
                    {Math.round(result.confidence * 100)}% Confidence
                  </div>
                </div>

                {/* Main info */}
                <div className="flex-1 text-center lg:text-left">
                  <div className="flex items-center justify-center lg:justify-start gap-3 mb-2">
                    <motion.div
                      animate={result.verdict === 'FAKE' ? { scale: [1, 1.08, 1] } : {}}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className={cn(
                        'w-14 h-14 rounded-2xl flex items-center justify-center border',
                        result.verdict === 'GENUINE' ? 'bg-emerald-500/15 border-emerald-500/30' :
                        result.verdict === 'SUSPICIOUS' ? 'bg-amber-500/15 border-amber-500/30' :
                        'bg-red-500/15 border-red-500/30'
                      )}
                    >
                      {VerdictIcon && <VerdictIcon className={cn('w-7 h-7', cfg!.textColor)} />}
                    </motion.div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">AI Verdict</p>
                      <h2 className={cn('text-2xl font-black', cfg!.textColor)}>
                        {cfg!.emoji} {cfg!.label}
                      </h2>
                    </div>
                  </div>

                  <p className="text-slate-300 text-sm mb-4 max-w-lg">{result.summary}</p>

                  {/* Quick facts */}
                  <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                    {result.vendor_name && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/60 rounded-xl border border-slate-700">
                        <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-xs text-slate-300 font-medium">{result.vendor_name}</span>
                      </div>
                    )}
                    {result.total_amount !== null && result.total_amount !== undefined && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/60 rounded-xl border border-slate-700">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-xs text-slate-300 font-medium">
                          {result.currency || ''} {Number(result.total_amount).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {result.date && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/60 rounded-xl border border-slate-700">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs text-slate-300 font-medium">{result.date}</span>
                      </div>
                    )}
                    <div className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-xl border',
                      result.recommendation === 'ACCEPT' ? 'bg-emerald-500/10 border-emerald-500/20' :
                      result.recommendation === 'MANUAL_REVIEW' ? 'bg-amber-500/10 border-amber-500/20' :
                      'bg-red-500/10 border-red-500/20'
                    )}>
                      <Info className={cn('w-3.5 h-3.5', 
                        result.recommendation === 'ACCEPT' ? 'text-emerald-400' :
                        result.recommendation === 'MANUAL_REVIEW' ? 'text-amber-400' : 'text-red-400'
                      )} />
                      <span className={cn('text-xs font-bold',
                        result.recommendation === 'ACCEPT' ? 'text-emerald-400' :
                        result.recommendation === 'MANUAL_REVIEW' ? 'text-amber-400' : 'text-red-400'
                      )}>
                        {result.recommendation?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Preview thumbnail */}
                {preview && (
                  <div className="shrink-0 w-28 h-36 rounded-xl overflow-hidden border border-slate-700 shadow-lg shadow-black/40">
                    <img src={preview} alt="Receipt" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            {/* ── Indicators Grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Genuine indicators */}
              {result.genuine_indicators.length > 0 && (
                <div className="glass-card rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Authentic Indicators ({result.genuine_indicators.length})
                  </h3>
                  <div className="space-y-2">
                    {result.genuine_indicators.map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-start gap-2.5 p-2.5 bg-emerald-500/5 border border-emerald-500/10 rounded-xl"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-slate-300">{item}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suspicious indicators */}
              {result.suspicious_indicators.length > 0 && (
                <div className="glass-card rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-red-400 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Red Flags ({result.suspicious_indicators.length})
                  </h3>
                  <div className="space-y-2">
                    {result.suspicious_indicators.map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-start gap-2.5 p-2.5 bg-red-500/5 border border-red-500/10 rounded-xl"
                      >
                        <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-slate-300">{item}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Rejection reason */}
            {result.rejection_reason && (
              <div className="p-5 bg-red-500/8 border border-red-500/25 rounded-2xl flex items-start gap-3">
                <ShieldX className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-red-300 mb-1">Why this was flagged</p>
                  <p className="text-xs text-slate-300 leading-relaxed">{result.rejection_reason}</p>
                </div>
              </div>
            )}

            {/* ── Detailed Findings Accordion ── */}
            {result.detailed_findings && (
              <div className="glass-card rounded-2xl overflow-hidden">
                <button
                  onClick={() => setShowDetails((v) => !v)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-800/30 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-indigo-400" />
                    <span className="text-sm font-semibold text-white">Detailed Forensic Findings</span>
                    <span className="text-[10px] text-slate-500 font-mono bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                      14 checks
                    </span>
                  </div>
                  {showDetails ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  )}
                </button>

                <AnimatePresence>
                  {showDetails && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 grid grid-cols-1 lg:grid-cols-2 gap-x-8">
                        <div className="border-t border-slate-800 pt-3">
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-2">Quality & Formatting</p>
                          <FindingRow label="Print Quality" value={result.detailed_findings.print_quality} />
                          <FindingRow label="Font Consistency" value={result.detailed_findings.font_consistency} />
                          <FindingRow label="Image Quality" value={result.detailed_findings.image_quality} />
                          <FindingRow label="Structural Integrity" value={result.detailed_findings.structural_integrity} />
                          <FindingRow label="Amount Format Correct" value={result.detailed_findings.amount_format_correct} />
                          <FindingRow label="Math Correct" value={result.detailed_findings.math_correct} />
                          <FindingRow label="Date Valid" value={result.detailed_findings.date_valid} />
                        </div>
                        <div className="border-t border-slate-800 pt-3 lg:pt-3">
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-2">Authenticity Signals</p>
                          <FindingRow label="Logo Present" value={result.detailed_findings.logo_present} />
                          <FindingRow label="Official Branding" value={result.detailed_findings.official_branding} />
                          <FindingRow label="Stamps / Signatures" value={result.detailed_findings.stamps_signatures} />
                          <FindingRow label="Contact Info Present" value={result.detailed_findings.contact_info_present} />
                          <FindingRow label="Tax Info Present" value={result.detailed_findings.tax_info_present} />
                          <FindingRow label="Handwritten Alterations" value={result.detailed_findings.handwritten_alterations} />
                          <FindingRow label="Digital Tampering Signs" value={result.detailed_findings.digital_tampering_signs} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Try another */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition-all border border-slate-700"
              >
                <RefreshCw className="w-4 h-4" /> Verify Another Receipt
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}
