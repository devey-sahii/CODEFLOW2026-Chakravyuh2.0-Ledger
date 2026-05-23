'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  FileImage,
  FileText,
  Camera,
  MessageCircle,
  Check,
  AlertTriangle,
  ChevronRight,
  X,
  RefreshCw,
  Send,
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
  RotateCcw,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Step = 1 | 2 | 3 | 4 | 5

const steps = [
  { id: 1, label: 'Upload' },
  { id: 2, label: 'OCR Scan' },
  { id: 3, label: 'Review' },
  { id: 4, label: 'AI Analysis' },
  { id: 5, label: 'Result' },
]

const mockOCRData = {
  vendor: 'Taj Hotels & Resorts Pvt Ltd',
  gstin: '27AAACT1679M1ZD',
  invoiceNo: 'TH/2024/83921',
  date: '2024-05-18',
  amount: '12400',
  tax: '1862',
  category: 'Accommodation',
}

const fraudChecks = [
  { label: 'Duplicate Invoice Check', status: 'pass', detail: 'No duplicates found in 90-day window' },
  { label: 'GSTIN Verification', status: 'pass', detail: 'Active & compliant — Taj Hotels Pvt Ltd' },
  { label: 'Amount Analysis', status: 'warn', detail: 'Amount 34% above category average' },
  { label: 'Vendor Blacklist', status: 'pass', detail: 'Vendor is verified and trusted' },
  { label: 'Weekend Submission', status: 'pass', detail: 'Submitted on business day' },
]

const riskScore = 23

function StepIndicator({ currentStep }: { currentStep: Step }) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => (
        <div key={step.id} className="flex items-center">
          <div className="flex flex-col items-center">
            <motion.div
              animate={{
                backgroundColor: currentStep > step.id ? '#4f46e5' : currentStep === step.id ? '#6366f1' : 'rgba(51,65,85,0.5)',
                borderColor: currentStep >= step.id ? '#6366f1' : 'rgba(71,85,105,0.5)',
              }}
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all',
                currentStep > step.id ? 'text-white' : currentStep === step.id ? 'text-white' : 'text-slate-600',
              )}
            >
              {currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}
            </motion.div>
            <span className={cn('text-[10px] mt-1 font-medium', currentStep >= step.id ? 'text-indigo-400' : 'text-slate-600')}>
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={cn('w-12 h-0.5 mx-1 mb-4 transition-all duration-500', currentStep > step.id ? 'bg-indigo-500' : 'bg-slate-800')} />
          )}
        </div>
      ))}
    </div>
  )
}

function Step1Upload({ onNext }: { onNext: () => void }) {
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) { setFile(f); setPreview(URL.createObjectURL(f)) }
  }, [])

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) { setFile(f); setPreview(URL.createObjectURL(f)) }
  }

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <motion.div
        animate={{ borderColor: dragging ? '#6366f1' : 'rgba(99,102,241,0.25)' }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !file && inputRef.current?.click()}
        className={cn(
          'relative border-2 border-dashed rounded-2xl transition-all duration-300 overflow-hidden cursor-pointer',
          dragging ? 'bg-indigo-500/10 border-indigo-500' : 'border-indigo-500/25 hover:border-indigo-500/50 hover:bg-indigo-500/5',
        )}
      >
        <input ref={inputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFile} />
        {file && preview ? (
          <div className="relative">
            <img src={preview} alt="preview" className="w-full h-48 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
              <div className="flex items-center gap-3 flex-1">
                <FileImage className="w-5 h-5 text-indigo-400" />
                <div>
                  <p className="text-sm font-medium text-white truncate">{file.name}</p>
                  <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null) }} className="w-7 h-7 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/40 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-10 text-center">
            <motion.div
              animate={dragging ? { scale: 1.1 } : { scale: 1 }}
              className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4"
            >
              <Upload className="w-8 h-8 text-indigo-400" />
            </motion.div>
            <p className="text-white font-semibold text-sm">Drop your receipt here</p>
            <p className="text-slate-500 text-xs mt-1">or click to browse files</p>
            <div className="flex items-center justify-center gap-3 mt-4">
              {['JPG', 'PNG', 'PDF', 'HEIC'].map((t) => (
                <span key={t} className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono">{t}</span>
              ))}
            </div>
            <p className="text-xs text-slate-600 mt-2">Max file size: 10 MB</p>
          </div>
        )}
      </motion.div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-800" />
        <span className="text-xs text-slate-600 font-medium">or use other methods</span>
        <div className="flex-1 h-px bg-slate-800" />
      </div>

      {/* Camera & WhatsApp */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button className="flex items-center gap-3 p-4 rounded-xl border border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/60 hover:border-indigo-500/30 transition-all text-left group">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/20 transition-all">
            <Camera className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-200">Camera Upload</p>
            <p className="text-xs text-slate-500">Take photo with camera</p>
          </div>
        </button>

        {/* WhatsApp Style */}
        <div className="p-4 rounded-xl border border-green-500/20 bg-green-500/5">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-slate-200">WhatsApp Upload</span>
          </div>
          <div className="bg-[#0a1929] rounded-xl p-3 space-y-2">
            {/* Incoming message bubble */}
            <div className="flex justify-start">
              <div className="bg-[#1f2c34] text-xs text-slate-300 px-3 py-2 rounded-2xl rounded-tl-sm max-w-[80%]">
                <p className="font-medium text-green-400 text-[10px] mb-0.5">LEDGER AI Bot</p>
                Send your receipt image or PDF to get instant analysis
              </div>
            </div>
            {/* Outgoing */}
            <div className="flex justify-end">
              <div className="bg-[#005c4b] text-xs text-slate-200 px-3 py-2 rounded-2xl rounded-tr-sm">📎 receipt_hotel.jpg</div>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2 text-center">Send to <span className="text-green-400 font-mono">+91-98765-43210</span></p>
        </div>
      </div>

      <button
        onClick={onNext}
        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition-all"
      >
        Continue to OCR Scan <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}

function Step2OCR({ onNext }: { onNext: () => void }) {
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)

  useState(() => {
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(timer); setDone(true); return 100 }
        return p + 2
      })
    }, 80)
  })

  return (
    <div className="space-y-6">
      <div className="relative rounded-2xl overflow-hidden border border-indigo-500/20 bg-slate-900/50 h-72 flex items-center justify-center">
        {/* Receipt mockup */}
        <div className="w-48 bg-white/5 border border-white/10 rounded-lg p-4 text-center relative">
          <div className="text-xs text-slate-300 space-y-1.5">
            <div className="font-bold text-sm text-white">TAJ HOTELS</div>
            <div className="text-slate-400">New Delhi, 110001</div>
            <div className="border-t border-dashed border-slate-600 my-2" />
            <div className="flex justify-between"><span>Room Charges</span><span>₹10,538</span></div>
            <div className="flex justify-between"><span>GST @18%</span><span>₹1,862</span></div>
            <div className="border-t border-dashed border-slate-600 my-2" />
            <div className="flex justify-between font-bold text-white"><span>Total</span><span>₹12,400</span></div>
          </div>
        </div>

        {/* Laser scan line */}
        {!done && (
          <motion.div
            animate={{ y: ['-100%', '400%'] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
            className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent shadow-[0_0_12px_4px_rgba(99,102,241,0.5)] z-10"
          />
        )}

        {done && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-emerald-500/10"
          >
            <div className="text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
              <p className="text-emerald-400 font-semibold">Scan Complete!</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Progress */}
      <div>
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Loader2 className={cn('w-3.5 h-3.5', done ? 'hidden' : 'animate-spin text-indigo-400')} />
            {done ? '✓ Extraction complete' : 'Extracting data with AI'}
            {!done && <span className="text-indigo-400 animate-pulse">...</span>}
          </span>
          <span className="text-indigo-400 font-mono font-bold">{progress}%</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            animate={{ width: `${progress}%` }}
            className="h-full bg-gradient-to-r from-indigo-600 to-blue-500 rounded-full"
            transition={{ duration: 0.1 }}
          />
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3">
          {['Text Detection', 'Entity Extraction', 'Validation'].map((step, i) => (
            <div key={step} className={cn('text-center text-xs py-1.5 rounded-lg border transition-all', progress > i * 33 ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400' : 'bg-slate-800/30 border-slate-700/30 text-slate-600')}>
              {step}
            </div>
          ))}
        </div>
      </div>

      <button onClick={onNext} disabled={!done} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
        Review Extracted Data <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}

function Step3Review({ onNext }: { onNext: () => void }) {
  const [data, setData] = useState(mockOCRData)
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Preview */}
      <div>
        <div className="rounded-2xl border border-indigo-500/20 bg-slate-900/50 p-4 h-72 flex items-center justify-center">
          <div className="w-48 bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="text-xs text-slate-300 space-y-1.5 text-center">
              <div className="font-bold text-sm text-white">TAJ HOTELS</div>
              <div className="text-slate-400">New Delhi, 110001</div>
              <div className="border-t border-dashed border-slate-600 my-2" />
              <div className="flex justify-between"><span>Room Charges</span><span>₹10,538</span></div>
              <div className="flex justify-between"><span>GST @18%</span><span>₹1,862</span></div>
              <div className="border-t border-dashed border-slate-600 my-2" />
              <div className="flex justify-between font-bold text-white"><span>Total</span><span>₹12,400</span></div>
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 justify-center">
          <div className="flex items-center gap-1.5 text-xs text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" />OCR Confidence: 98.4%</div>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-slate-300 mb-4">Review & Edit Extracted Data</p>
        {[
          { label: 'Vendor Name', key: 'vendor' as const },
          { label: 'GSTIN', key: 'gstin' as const },
          { label: 'Invoice Number', key: 'invoiceNo' as const },
          { label: 'Date', key: 'date' as const },
          { label: 'Total Amount (₹)', key: 'amount' as const },
          { label: 'Tax Amount (₹)', key: 'tax' as const },
        ].map(({ label, key }) => (
          <div key={key}>
            <label className="text-xs text-slate-500 mb-1 block">{label}</label>
            <input
              value={data[key]}
              onChange={(e) => setData({ ...data, [key]: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl input-dark text-sm"
            />
          </div>
        ))}
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Category</label>
          <select
            value={data.category}
            onChange={(e) => setData({ ...data, category: e.target.value })}
            className="w-full px-3 py-2.5 rounded-xl input-dark text-sm"
          >
            {['Accommodation', 'Travel', 'Meals', 'Software', 'Office Supplies', 'Hardware', 'Training', 'Other'].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <button onClick={onNext} className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition-all">
          Run AI Analysis <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

function Step4Analysis({ onNext }: { onNext: () => void }) {
  const [checks, setChecks] = useState<number[]>([])
  const [rotating, setRotating] = useState(true)

  useState(() => {
    let i = 0
    const timer = setInterval(() => {
      if (i < fraudChecks.length) {
        setChecks((prev) => [...prev, i])
        i++
      } else {
        clearInterval(timer)
        setRotating(false)
      }
    }, 800)
  })

  return (
    <div className="space-y-6">
      {/* Ring animation */}
      <div className="flex items-center justify-center py-6">
        <div className="relative">
          <motion.div
            animate={rotating ? { rotate: 360 } : { rotate: 0 }}
            transition={rotating ? { duration: 2, repeat: Infinity, ease: 'linear' } : {}}
            className="w-24 h-24 rounded-full border-4 border-transparent border-t-indigo-500 border-r-blue-500"
          />
          <div className="absolute inset-2 rounded-full bg-indigo-500/10 flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center"
            >
              {rotating ? (
                <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
              ) : (
                <Check className="w-5 h-5 text-emerald-400" />
              )}
            </motion.div>
          </div>
        </div>
      </div>

      <div className="text-center mb-2">
        <p className="text-white font-semibold">{rotating ? 'AI analyzing patterns...' : 'Analysis Complete!'}</p>
        <p className="text-xs text-slate-500 mt-1">Running {fraudChecks.length} fraud detection checks</p>
      </div>

      {/* Checks */}
      <div className="space-y-3">
        {fraudChecks.map((check, i) => {
          const revealed = checks.includes(i)
          return (
            <AnimatePresence key={i}>
              {revealed && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    'flex items-center gap-3 p-3.5 rounded-xl border',
                    check.status === 'pass' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-yellow-500/5 border-yellow-500/20',
                  )}
                >
                  <div className={cn('w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0', check.status === 'pass' ? 'bg-emerald-500/20' : 'bg-yellow-500/20')}>
                    {check.status === 'pass' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-200">{check.label}</p>
                    <p className="text-xs text-slate-500">{check.detail}</p>
                  </div>
                  <span className={cn('text-xs font-bold', check.status === 'pass' ? 'text-emerald-400' : 'text-yellow-400')}>
                    {check.status === 'pass' ? '✓ PASS' : '⚠ WARN'}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          )
        })}
      </div>

      <button onClick={onNext} disabled={rotating} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
        View Results <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}

function RiskMeter({ score }: { score: number }) {
  const radius = 60
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (score / 100) * circumference
  const color = score < 30 ? '#34d399' : score < 60 ? '#fbbf24' : '#ef4444'

  return (
    <div className="flex flex-col items-center">
      <svg width="160" height="160" viewBox="0 0 160 160" className="-rotate-90">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="rgba(99,102,241,0.1)" strokeWidth="12" />
        <motion.circle
          cx="80" cy="80" r={radius} fill="none"
          stroke={color} strokeWidth="12"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          strokeLinecap="round"
        />
      </svg>
      <div className="text-center -mt-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1 }}
          className="text-4xl font-black"
          style={{ color }}
        >
          {score}
        </motion.div>
        <div className="text-xs text-slate-500 font-medium">/ 100</div>
      </div>
    </div>
  )
}

function Step5Result({ onReset }: { onReset: () => void }) {
  const isLow = riskScore < 30

  return (
    <div className="space-y-5">
      {/* Decision banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          'flex items-center gap-4 p-5 rounded-2xl border',
          isLow ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30',
        )}
      >
        {isLow ? <CheckCircle2 className="w-10 h-10 text-emerald-400 flex-shrink-0" /> : <XCircle className="w-10 h-10 text-red-400 flex-shrink-0" />}
        <div>
          <h3 className={cn('text-lg font-bold', isLow ? 'text-emerald-400' : 'text-red-400')}>
            {isLow ? '✓ LOW RISK — Safe to Submit' : '⚠ HIGH RISK — Manual Review Required'}
          </h3>
          <p className="text-sm text-slate-400 mt-0.5">AI confidence: 96.2% • Processing time: 1.4s</p>
        </div>
      </motion.div>

      {/* Risk meter + breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="glass-card rounded-2xl p-5 flex flex-col items-center">
          <h4 className="text-sm font-semibold text-slate-300 mb-4">Risk Meter</h4>
          <RiskMeter score={riskScore} />
          <div className="mt-2 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-xs font-bold tracking-wide">
            LOW RISK
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <h4 className="text-sm font-semibold text-slate-300 mb-4">Fraud Check Results</h4>
          <div className="space-y-2.5">
            {fraudChecks.map((check) => (
              <div key={check.label} className="flex items-center gap-2.5">
                <div className={cn('w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0', check.status === 'pass' ? 'bg-emerald-500/20' : 'bg-yellow-500/20')}>
                  {check.status === 'pass' ? <Check className="w-3 h-3 text-emerald-400" /> : <AlertTriangle className="w-3 h-3 text-yellow-400" />}
                </div>
                <span className="text-xs text-slate-400 flex-1">{check.label}</span>
                <span className={cn('text-xs font-bold', check.status === 'pass' ? 'text-emerald-400' : 'text-yellow-400')}>
                  {check.status === 'pass' ? 'PASS' : 'WARN'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Receipt meta */}
      <div className="glass-card rounded-2xl p-5">
        <h4 className="text-sm font-semibold text-slate-300 mb-3">Receipt Details</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          {[
            ['Vendor', 'Taj Hotels & Resorts'],
            ['GSTIN', '27AAACT1679M1ZD'],
            ['Invoice No', 'TH/2024/83921'],
            ['Date', '18 May 2024'],
            ['Amount', '₹12,400'],
            ['Category', 'Accommodation'],
          ].map(([k, v]) => (
            <div key={k}>
              <p className="text-slate-500">{k}</p>
              <p className="text-slate-200 font-medium mt-0.5">{v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onReset}
          className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Upload Another
        </button>
        <button className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-all flex items-center justify-center gap-2">
          <Eye className="w-4 h-4" />
          Preview
        </button>
        <button className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition-all">
          <Send className="w-4 h-4" />
          Submit for Approval
        </button>
      </div>
    </div>
  )
}

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
}

export default function UploadPage() {
  const [step, setStep] = useState<Step>(1)
  const [direction, setDirection] = useState(1)

  const goNext = () => {
    setDirection(1)
    setStep((s) => Math.min(s + 1, 5) as Step)
  }
  const goPrev = () => {
    setDirection(-1)
    setStep((s) => Math.max(s - 1, 1) as Step)
  }
  const reset = () => { setDirection(-1); setStep(1) }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Upload Receipt</h1>
        <p className="text-slate-400 text-sm mt-1">AI-powered receipt scanning and fraud detection</p>
      </div>

      {/* Step indicator */}
      <div className="glass-card rounded-2xl p-6 mb-6">
        <div className="flex justify-center mb-6">
          <StepIndicator currentStep={step} />
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            animate={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-gradient-to-r from-indigo-600 to-blue-500 rounded-full"
          />
        </div>
      </div>

      {/* Step content */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">
            Step {step}: {steps[step - 1].label}
          </h2>
          {step > 1 && step < 5 && (
            <button onClick={goPrev} className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors">
              ← Back
            </button>
          )}
        </div>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            {step === 1 && <Step1Upload onNext={goNext} />}
            {step === 2 && <Step2OCR onNext={goNext} />}
            {step === 3 && <Step3Review onNext={goNext} />}
            {step === 4 && <Step4Analysis onNext={goNext} />}
            {step === 5 && <Step5Result onReset={reset} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
