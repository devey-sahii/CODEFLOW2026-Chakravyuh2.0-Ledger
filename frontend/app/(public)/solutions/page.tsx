'use client'

import React from 'react'
import { motion } from 'framer-motion'
import Navbar from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight, CheckCircle, Shield, Building2, Users2, Scale } from 'lucide-react'

export default function SolutionsPage() {
  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 flex flex-col font-sans antialiased overflow-x-hidden selection:bg-indigo-500/30 selection:text-white">
      <Navbar />

      <main className="flex-1 py-20 px-6 max-w-7xl mx-auto w-full space-y-24">
        {/* Hero */}
        <section className="text-center max-w-3xl mx-auto space-y-6">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full text-xs font-semibold tracking-wider uppercase block w-fit mx-auto"
          >
            SaaS Solutions
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl font-black text-white leading-tight"
          >
            Autonomous Expense Audit Built for Scale
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-400 text-sm sm:text-base leading-relaxed"
          >
            We optimize reimbursement approvals, validate GST networks, and scan fraud triggers automatically.
          </motion.p>
        </section>

        {/* Categories Grid */}
        <section className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: 'Large Enterprises',
              desc: 'Enforce company expense policies across multiple subsidiaries, automate millions of audits, and secure SOC2 compliance.',
              icon: Building2
            },
            {
              title: 'Finance Teams',
              desc: 'Eliminate receipt review overheads. Auto-approve compliant vouchers, and manually review flagged risks instantly.',
              icon: Users2
            },
            {
              title: 'Compliance & Audit',
              desc: 'Validate GSTINs directly against GST filing databases and maintain digital ledger trails for RBI audits.',
              icon: Scale
            }
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card variant="glow" className="h-full flex flex-col justify-between">
                <CardContent className="p-6 space-y-4">
                  <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl w-fit">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-white font-bold text-lg">{item.title}</h3>
                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">{item.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </section>
      </main>

      <Footer />
    </div>
  )
}
