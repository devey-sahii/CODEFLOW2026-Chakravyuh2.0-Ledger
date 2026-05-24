'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck,
  BarChart3,
  Users,
  FileText,
  ChevronRight,
  Sparkles,
  Shield,
  Brain,
  Building2,
  ScrollText,
  Receipt,
  Upload,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'

// ─── Role Definitions ─────────────────────────────────────────────────────────

const roles = [
  {
    id: 'employee',
    label: 'Employee',
    subtitle: 'Individual Contributor',
    description:
      'Submit and track your own expense claims, upload receipts, and monitor the status of your reimbursements in real-time.',
    icon: FileText,
    gradient: 'from-sky-500 via-blue-600 to-indigo-700',
    glow: 'shadow-sky-500/30',
    border: 'border-sky-500/30 hover:border-sky-400/60',
    activeBorder: 'border-sky-400',
    dot: 'bg-sky-400',
    badge: 'Sky Access',
    badgeCls: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    features: [
      { icon: Upload, text: 'Upload receipts & invoices' },
      { icon: FileText, text: 'View your expense claims' },
      { icon: ShieldCheck, text: 'Track approval status' },
    ],
    dashboardTitle: 'Employee Workstation',
  },
  {
    id: 'finance_manager',
    label: 'Finance Manager',
    subtitle: 'Finance Operations',
    description:
      'Oversee all expense claims, approve or reject submissions, manage vendor relationships, and generate financial reports.',
    icon: BarChart3,
    gradient: 'from-violet-500 via-purple-600 to-indigo-700',
    glow: 'shadow-purple-500/30',
    border: 'border-purple-500/30 hover:border-purple-400/60',
    activeBorder: 'border-purple-400',
    dot: 'bg-purple-400',
    badge: 'Full Finance',
    badgeCls: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    features: [
      { icon: Receipt, text: 'Approve / reject claims' },
      { icon: Building2, text: 'Vendor & employee management' },
      { icon: BarChart3, text: 'Financial analytics & reports' },
    ],
    dashboardTitle: 'Finance Manager Board',
  },
  {
    id: 'auditor',
    label: 'Auditor',
    subtitle: 'Compliance & Risk',
    description:
      'Review audit trails, investigate fraud alerts, validate GST compliance, and generate risk assessment reports with full AI insights.',
    icon: Shield,
    gradient: 'from-amber-500 via-orange-600 to-rose-600',
    glow: 'shadow-orange-500/30',
    border: 'border-orange-500/30 hover:border-orange-400/60',
    activeBorder: 'border-orange-400',
    dot: 'bg-orange-400',
    badge: 'Audit Access',
    badgeCls: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
    features: [
      { icon: ScrollText, text: 'Full audit log access' },
      { icon: Brain, text: 'AI fraud detection alerts' },
      { icon: Receipt, text: 'GST compliance review' },
    ],
    dashboardTitle: 'Auditor Control Panel',
  },
  {
    id: 'admin',
    label: 'Administrator',
    subtitle: 'System Control',
    description:
      'Full system access — manage users, configure AI policies, monitor all dashboards, integrations, and system-level settings.',
    icon: ShieldCheck,
    gradient: 'from-emerald-500 via-teal-600 to-cyan-700',
    glow: 'shadow-emerald-500/30',
    border: 'border-emerald-500/30 hover:border-emerald-400/60',
    activeBorder: 'border-emerald-400',
    dot: 'bg-emerald-400',
    badge: 'Full Admin',
    badgeCls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    features: [
      { icon: Users, text: 'User & role management' },
      { icon: Brain, text: 'AI policy configuration' },
      { icon: ShieldCheck, text: 'Full system oversight' },
    ],
    dashboardTitle: 'Administrator Control Center',
  },
]

// ─── Animated Particle Background ────────────────────────────────────────────

function ParticleBg() {
  const [particles, setParticles] = useState<
    { x: number; y: number; size: number; delay: number; dur: number }[]
  >([])

  useEffect(() => {
    setParticles(
      Array.from({ length: 40 }, (_, i) => ({
        x: (i * 37.7) % 100,
        y: (i * 61.8) % 100,
        size: 1 + (i % 3),
        delay: (i * 0.4) % 6,
        dur: 4 + (i % 5),
      }))
    )
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Gradient orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/8 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-violet-600/8 blur-[100px]" />
      <div className="absolute top-[30%] right-[20%] w-[400px] h-[400px] rounded-full bg-cyan-600/6 blur-[90px]" />

      {/* Stars */}
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{ opacity: [0.1, 0.6, 0.1], scale: [1, 1.5, 1] }}
          transition={{
            duration: p.dur,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SelectRolePage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const updateUser = useAuthStore((state) => state.updateUser)

  const [selected, setSelected] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null)

  // If already has role from a previous session, pre-select it
  useEffect(() => {
    if (user?.role) setSelected(user.role)
  }, [user?.role])

  const handleSelect = (roleId: string) => {
    setSelected(roleId)
  }

  const handleConfirm = async () => {
    if (!selected) return
    setConfirming(true)

    // Update the role in the auth store
    updateUser({ role: selected as any })

    // Set role cookie so middleware knows it's been chosen
    document.cookie = `selected_role=${selected}; path=/; max-age=86400`

    await new Promise((r) => setTimeout(r, 900))
    router.replace('/dashboard')
  }

  const selectedRole = roles.find((r) => r.id === selected)

  return (
    <div className="min-h-screen bg-[#060810] flex flex-col items-center justify-center relative overflow-hidden px-4 py-12">
      <ParticleBg />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="text-center mb-12 relative z-10"
      >
        {/* Logo mark */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 border-2 border-white/10 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <motion.div
              className="absolute -inset-1 rounded-2xl border border-indigo-500/40"
              animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold tracking-wider mb-4">
          <Sparkles className="w-3 h-3" />
          LEDGER AI PLATFORM
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-3">
          Select Your{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
            Role
          </span>
        </h1>
        <p className="text-slate-400 text-base max-w-md mx-auto leading-relaxed">
          Welcome back,{' '}
          <span className="text-slate-200 font-semibold">
            {user?.full_name?.split(' ')[0] || 'User'}
          </span>
          . Choose how you'd like to access the platform today.
        </p>
      </motion.div>

      {/* Role Cards Grid */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full max-w-6xl relative z-10"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
        }}
      >
        {roles.map((role) => {
          const Icon = role.icon
          const isSelected = selected === role.id

          return (
            <motion.button
              key={role.id}
              id={`role-card-${role.id}`}
              variants={{
                hidden: { opacity: 0, y: 24, scale: 0.96 },
                visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: 'easeOut' } },
              }}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelect(role.id)}
              className={`relative flex flex-col text-left p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer overflow-hidden
                ${isSelected
                  ? `${role.activeBorder} bg-white/5 shadow-2xl ${role.glow}`
                  : `border-slate-700/60 bg-slate-900/40 hover:bg-white/3 ${role.border}`
                }
              `}
              style={{ backdropFilter: 'blur(12px)' }}
            >
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`absolute inset-0 bg-gradient-to-br ${role.gradient}`}
                    style={{ opacity: 0.07 }}
                  />
                )}
              </AnimatePresence>

              {/* Selected indicator */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute top-4 right-4 w-5 h-5 rounded-full bg-white/20 border-2 border-white/60 flex items-center justify-center"
                  >
                    <div className={`w-2.5 h-2.5 rounded-full ${role.dot}`} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Icon */}
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${role.gradient} flex items-center justify-center mb-4 shadow-lg flex-shrink-0`}
              >
                <Icon className="w-6 h-6 text-white" />
              </div>

              {/* Badge */}
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border tracking-wider mb-3 w-fit ${role.badgeCls}`}
              >
                {role.badge}
              </span>

              {/* Labels */}
              <h3 className="text-white font-bold text-base leading-tight mb-0.5">
                {role.label}
              </h3>
              <p className="text-slate-500 text-[11px] font-semibold mb-3 tracking-wide uppercase">
                {role.subtitle}
              </p>

              {/* Description */}
              <p className="text-slate-400 text-xs leading-relaxed mb-5 flex-1">
                {role.description}
              </p>

              {/* Feature list */}
              <div className="space-y-2 mt-auto">
                {role.features.map((feat, fi) => {
                  const FIcon = feat.icon
                  const key = `${role.id}-${fi}`
                  return (
                    <motion.div
                      key={key}
                      className="flex items-center gap-2"
                      onHoverStart={() => setHoveredFeature(key)}
                      onHoverEnd={() => setHoveredFeature(null)}
                    >
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all ${
                          isSelected
                            ? `bg-gradient-to-br ${role.gradient} text-white`
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        <FIcon className="w-3 h-3" />
                      </div>
                      <span
                        className={`text-[11px] font-medium transition-colors ${
                          isSelected ? 'text-slate-300' : 'text-slate-500'
                        } ${hoveredFeature === key ? 'text-slate-200' : ''}`}
                      >
                        {feat.text}
                      </span>
                    </motion.div>
                  )
                })}
              </div>
            </motion.button>
          )
        })}
      </motion.div>

      {/* Confirmation Panel */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="mt-8 relative z-10 w-full max-w-lg"
          >
            <div
              className="relative rounded-2xl border border-slate-700/60 bg-slate-900/70 p-6 text-center overflow-hidden"
              style={{ backdropFilter: 'blur(20px)' }}
            >
              {selectedRole && (
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${selectedRole.gradient} rounded-2xl`}
                  style={{ opacity: 0.05 }}
                />
              )}

              <div className="relative">
                <p className="text-slate-400 text-sm mb-1">
                  You'll enter the platform as
                </p>
                <h2 className="text-white text-xl font-extrabold mb-0.5">
                  {selectedRole?.dashboardTitle}
                </h2>
                <p className="text-slate-500 text-xs mb-6">
                  Dashboard will be configured for{' '}
                  <span className="text-slate-300 font-semibold">
                    {selectedRole?.label}
                  </span>{' '}
                  access level
                </p>

                <button
                  id="confirm-role-btn"
                  onClick={handleConfirm}
                  disabled={confirming}
                  className={`w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-white text-sm transition-all ${
                    confirming
                      ? 'bg-indigo-700 opacity-70 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:translate-y-0'
                  }`}
                >
                  {confirming ? (
                    <>
                      <motion.div
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                      />
                      Opening Dashboard...
                    </>
                  ) : (
                    <>
                      Enter as {selectedRole?.label}
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer note */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
        className="mt-8 text-slate-600 text-xs text-center relative z-10"
      >
        Role determines your dashboard view and access permissions · Can be changed by Admin
      </motion.p>
    </div>
  )
}
