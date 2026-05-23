'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Link2, Link2Off, MessageSquare, Briefcase, Play, Terminal } from 'lucide-react'

export default function IntegrationsPage() {
  const [connections, setConnections] = useState<Record<string, boolean>>({
    slack: true,
    whatsapp: false,
    zoho: false,
    tally: false
  })

  const toggleConnection = (id: string) => {
    setConnections(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="space-y-6">
      <h2 className="text-white font-bold text-lg flex items-center gap-2">
        <Link2 className="h-5 w-5 text-indigo-400" />
        ERP & Workspace Integrations
      </h2>

      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
        {/* Tally */}
        <Card>
          <CardContent className="p-6 space-y-4 flex flex-col justify-between h-full">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold text-sm">Tally Prime</h3>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  connections.tally ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-slate-400'
                }`}>
                  {connections.tally ? 'Connected' : 'Available'}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sync audited expense claims directly into Tally Prime vouchers for simple ledger accounting.
              </p>
            </div>
            <button
              onClick={() => toggleConnection('tally')}
              className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 mt-4"
            >
              {connections.tally ? <Link2Off className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
              {connections.tally ? 'Disconnect' : 'Connect Integration'}
            </button>
          </CardContent>
        </Card>

        {/* Zoho Books */}
        <Card>
          <CardContent className="p-6 space-y-4 flex flex-col justify-between h-full">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold text-sm">Zoho Books</h3>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  connections.zoho ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-slate-400'
                }`}>
                  {connections.zoho ? 'Connected' : 'Available'}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sync category expense claims and GST validation tax inputs directly into Zoho accounts.
              </p>
            </div>
            <button
              onClick={() => toggleConnection('zoho')}
              className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 mt-4"
            >
              {connections.zoho ? <Link2Off className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
              {connections.zoho ? 'Disconnect' : 'Connect Integration'}
            </button>
          </CardContent>
        </Card>

        {/* Slack */}
        <Card variant="glow">
          <CardContent className="p-6 space-y-4 flex flex-col justify-between h-full">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold text-sm flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4 text-indigo-400" />
                  Slack
                </h3>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  connections.slack ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-slate-400'
                }`}>
                  {connections.slack ? 'Connected' : 'Available'}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Push instant Slack alerts to managers for pending approvals and critical AI fraud logs.
              </p>
            </div>
            <button
              onClick={() => toggleConnection('slack')}
              className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 mt-4"
            >
              {connections.slack ? <Link2Off className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
              {connections.slack ? 'Disconnect' : 'Connect Integration'}
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
