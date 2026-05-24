'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import {
  Settings,
  Building2,
  Cpu,
  Bell,
  Link2,
  Shield,
  Save,
  CheckCircle2,
  Sliders,
  DollarSign,
  Calendar,
  AlertTriangle
} from 'lucide-react'

type TabType = 'organization' | 'ai-policy' | 'notifications' | 'integrations'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('organization')
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccessAlert, setShowSuccessAlert] = useState(false)

  // Form states
  const [orgData, setOrgData] = useState({
    name: 'LEDGER Technologies Pvt Ltd',
    domain: 'ledger.ai',
    currency: 'INR',
    gstin: '27AAACT1679M1ZD',
    billingEmail: 'finance@ledger.ai'
  })

  const [aiPolicy, setAiPolicy] = useState({
    riskThreshold: 65,
    duplicateWindow: 90,
    allowWeekendSubmissions: false,
    autoApproveBelow: 1000,
    categoryLimits: {
      Travel: 25000,
      Meals: 8000,
      Software: 15000,
      Office: 5000
    }
  })

  const [notifications, setNotifications] = useState({
    emailOnHighRisk: true,
    weeklyReport: true,
    dailySummary: false,
    slackInstantAlerts: true
  })

  const [integrations, setIntegrations] = useState({
    slackWebhook: 'SLACK_WEBHOOK_PLACEHOLDER',
    tallyEndpoint: 'http://localhost:9000/tally-api',
    zohoAuthToken: 'ZOHO_AUTH_TOKEN_PLACEHOLDER'
  })

  const handleSave = () => {
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      setShowSuccessAlert(true)
      setTimeout(() => setShowSuccessAlert(false), 3000)
    }, 1000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <Settings className="h-5 w-5 text-indigo-400" />
            System Settings
          </h2>
          <p className="text-slate-400 text-xs mt-1">Configure company profiles, autonomous AI thresholds, notification channels, and ERP pipelines.</p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/20 active:translate-y-0.5"
        >
          {isSaving ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isSaving ? 'Saving Configurations...' : 'Save All Settings'}
        </button>
      </div>

      {/* Success Banner */}
      <AnimatePresence>
        {showSuccessAlert && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl flex items-center gap-3 text-emerald-400 text-xs font-semibold"
          >
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>Success! All ledger profiles and threshold triggers have been stored correctly on the cloud.</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Navigation Sidebar */}
        <div className="flex flex-col gap-2">
          {[
            { id: 'organization', label: 'Organization Profile', icon: Building2 },
            { id: 'ai-policy', label: 'AI Policy Limits', icon: Cpu },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'integrations', label: 'ERP & Integrations', icon: Link2 },
          ].map(tab => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs font-bold uppercase tracking-wider transition-all border-2 ${
                  active
                    ? 'bg-indigo-600 border-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    : 'bg-white/5 border-transparent text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Configurations Forms Pane */}
        <div className="lg:col-span-3">
          <Card variant="glow">
            <CardContent className="p-6">
              <AnimatePresence mode="wait">
                {activeTab === 'organization' && (
                  <motion.div
                    key="org"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-4"
                  >
                    <div className="border-b border-white/5 pb-3">
                      <h3 className="text-white font-bold text-sm">Organization Details</h3>
                      <p className="text-slate-400 text-[11px] mt-0.5">Define your company profile metadata used for tax and invoice generation.</p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-xs text-slate-500 mb-1.5 block font-semibold">Corporate Legal Name</label>
                        <input
                          type="text"
                          value={orgData.name}
                          onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500/50"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 mb-1.5 block font-semibold">Primary Workspace Domain</label>
                        <input
                          type="text"
                          value={orgData.domain}
                          onChange={(e) => setOrgData({ ...orgData, domain: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500/50"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 mb-1.5 block font-semibold">Operating Currency</label>
                        <select
                          value={orgData.currency}
                          onChange={(e) => setOrgData({ ...orgData, currency: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500/50"
                        >
                          <option value="INR">INR (₹) - Indian Rupee</option>
                          <option value="USD">USD ($) - US Dollar</option>
                          <option value="EUR">EUR (€) - Euro</option>
                          <option value="GBP">GBP (£) - British Pound</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 mb-1.5 block font-semibold">Corporate GSTIN Number</label>
                        <input
                          type="text"
                          value={orgData.gstin}
                          onChange={(e) => setOrgData({ ...orgData, gstin: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-mono uppercase focus:outline-none focus:border-indigo-500/50"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-xs text-slate-500 mb-1.5 block font-semibold">Billing/Finance Notification Email</label>
                        <input
                          type="email"
                          value={orgData.billingEmail}
                          onChange={(e) => setOrgData({ ...orgData, billingEmail: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500/50"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'ai-policy' && (
                  <motion.div
                    key="ai"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-6"
                  >
                    <div className="border-b border-white/5 pb-3">
                      <h3 className="text-white font-bold text-sm flex items-center gap-1.5">
                        <Shield className="h-4 w-4 text-indigo-400" />
                        AI Ingestion & Policy Limits
                      </h3>
                      <p className="text-slate-400 text-[11px] mt-0.5">Control autonomous approval thresholds, duplicate invoice detection scopes, and category limits.</p>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                      {/* Risk Score Sliders */}
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between text-xs mb-2">
                            <span className="text-slate-300 font-semibold flex items-center gap-1">
                              <Sliders className="h-3.5 w-3.5 text-indigo-400" />
                              AI Risk Threshold Score
                            </span>
                            <span className="text-indigo-400 font-bold font-mono text-sm">{aiPolicy.riskThreshold}%</span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="90"
                            value={aiPolicy.riskThreshold}
                            onChange={(e) => setAiPolicy({ ...aiPolicy, riskThreshold: parseInt(e.target.value) })}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                          />
                          <p className="text-[10px] text-slate-500 mt-1.5">Claims scoring above this threshold will require manual auditing review prior to reimbursement.</p>
                        </div>

                        <div>
                          <label className="text-xs text-slate-300 mb-1.5 block font-semibold flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                            Duplicate Invoice Verification Window
                          </label>
                          <select
                            value={aiPolicy.duplicateWindow}
                            onChange={(e) => setAiPolicy({ ...aiPolicy, duplicateWindow: parseInt(e.target.value) })}
                            className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none"
                          >
                            <option value="30">Last 30 Days Scope</option>
                            <option value="60">Last 60 Days Scope</option>
                            <option value="90">Last 90 Days Scope (Recommended)</option>
                            <option value="180">Last 180 Days Scope</option>
                          </select>
                        </div>
                      </div>

                      {/* Threshold Triggers */}
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs text-slate-300 mb-1.5 block font-semibold flex items-center gap-1">
                            <DollarSign className="h-3.5 w-3.5 text-indigo-400" />
                            Autonomous Auto-Approve Cap (₹)
                          </label>
                          <input
                            type="number"
                            value={aiPolicy.autoApproveBelow}
                            onChange={(e) => setAiPolicy({ ...aiPolicy, autoApproveBelow: parseInt(e.target.value) })}
                            className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500/50"
                          />
                          <p className="text-[10px] text-slate-500 mt-1.5">Low-risk claims with amounts less than this limit will automatically bypass audits and queue for payout.</p>
                        </div>

                        <div className="flex items-center justify-between p-3.5 bg-white/5 border border-white/5 rounded-xl">
                          <div>
                            <p className="text-xs text-white font-semibold">Flag Weekend Submissions</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">Triggers high-risk warning flags on weekend bills.</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setAiPolicy({ ...aiPolicy, allowWeekendSubmissions: !aiPolicy.allowWeekendSubmissions })}
                            className={`w-9 h-5 rounded-full p-0.5 transition-all duration-200 focus:outline-none ${
                              aiPolicy.allowWeekendSubmissions ? 'bg-indigo-600' : 'bg-slate-800'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded-full bg-white transition-all transform ${
                              aiPolicy.allowWeekendSubmissions ? 'translate-x-4' : 'translate-x-0'
                            }`} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Category Caps */}
                    <div className="border-t border-white/5 pt-4 space-y-3">
                      <h4 className="text-white font-bold text-xs">Monthly Category Policy Budget Limits</h4>
                      <div className="grid gap-3 sm:grid-cols-4">
                        {Object.entries(aiPolicy.categoryLimits).map(([cat, val]) => (
                          <div key={cat} className="p-3 bg-white/5 border border-white/5 rounded-xl">
                            <p className="text-[10px] text-slate-500 font-bold uppercase">{cat} Limit</p>
                            <input
                              type="number"
                              value={val}
                              onChange={(e) => setAiPolicy({
                                ...aiPolicy,
                                categoryLimits: {
                                  ...aiPolicy.categoryLimits,
                                  [cat]: parseInt(e.target.value)
                                }
                              })}
                              className="w-full mt-1.5 bg-transparent border-b border-white/10 text-white font-mono text-xs focus:outline-none focus:border-indigo-500 pb-1"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'notifications' && (
                  <motion.div
                    key="notif"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-4"
                  >
                    <div className="border-b border-white/5 pb-3">
                      <h3 className="text-white font-bold text-sm">Notification Channels</h3>
                      <p className="text-slate-400 text-[11px] mt-0.5">Decide how and when your finance team is alerted to anomalous telemetry events.</p>
                    </div>

                    <div className="space-y-3">
                      {[
                        { key: 'emailOnHighRisk', title: 'Critical Risk Email Alerts', desc: 'Notify finance team immediately upon discovery of fraud anomalies.' },
                        { key: 'weeklyReport', title: 'Weekly PDF Audit Log Exports', desc: 'Compile a weekly summary PDF matching all OCR records and compliance scores.' },
                        { key: 'dailySummary', title: 'Daily Aggregated Slack Reports', desc: 'Push daily transaction summaries showing auto-approved lists and compliance rates.' },
                        { key: 'slackInstantAlerts', title: 'Slack Instant Warning Alerts', desc: 'Sync live alerts directly to the designated #ledger-alerts channel.' }
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between p-3.5 bg-white/5 border border-white/5 rounded-xl">
                          <div>
                            <p className="text-xs text-white font-semibold">{item.title}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{item.desc}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setNotifications({
                              ...notifications,
                              [item.key]: !notifications[item.key as keyof typeof notifications]
                            })}
                            className={`w-9 h-5 rounded-full p-0.5 transition-all duration-200 focus:outline-none ${
                              notifications[item.key as keyof typeof notifications] ? 'bg-indigo-600' : 'bg-slate-800'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded-full bg-white transition-all transform ${
                              notifications[item.key as keyof typeof notifications] ? 'translate-x-4' : 'translate-x-0'
                            }`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'integrations' && (
                  <motion.div
                    key="integ"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-4"
                  >
                    <div className="border-b border-white/5 pb-3">
                      <h3 className="text-white font-bold text-sm">ERP Pipelines & Connections</h3>
                      <p className="text-slate-400 text-[11px] mt-0.5">Securely manage credentials connecting LEDGER to external accounting systems.</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-xs text-slate-500 mb-1.5 block font-semibold flex items-center gap-1">
                          Slack Channel Webhook Url
                        </label>
                        <input
                          type="password"
                          value={integrations.slackWebhook}
                          onChange={(e) => setIntegrations({ ...integrations, slackWebhook: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-indigo-500/50"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-slate-500 mb-1.5 block font-semibold flex items-center gap-1">
                          Tally XML Server Endpoint
                        </label>
                        <input
                          type="text"
                          value={integrations.tallyEndpoint}
                          onChange={(e) => setIntegrations({ ...integrations, tallyEndpoint: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-indigo-500/50"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-slate-500 mb-1.5 block font-semibold flex items-center gap-1">
                          Zoho Books Access Token
                        </label>
                        <input
                          type="password"
                          value={integrations.zohoAuthToken}
                          onChange={(e) => setIntegrations({ ...integrations, zohoAuthToken: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-indigo-500/50"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
