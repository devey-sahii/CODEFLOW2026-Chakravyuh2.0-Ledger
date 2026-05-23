'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'
import { RiskMeter } from '@/components/ui/risk-meter'
import { formatCurrency } from '@/lib/utils'
import { Search, UserCheck, AlertTriangle, ArrowRight, UserX } from 'lucide-react'

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>(MOCK_EMPLOYEES)
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const handleDeactivate = (id: string) => {
    setEmployees(prev => prev.map(emp => emp.id === id ? { ...emp, is_active: false } : emp))
    if (selectedEmployee?.id === id) {
      setSelectedEmployee((prev: any) => ({ ...prev, is_active: false }))
    }
  }

  const handleActivate = (id: string) => {
    setEmployees(prev => prev.map(emp => emp.id === id ? { ...emp, is_active: true } : emp))
    if (selectedEmployee?.id === id) {
      setSelectedEmployee((prev: any) => ({ ...prev, is_active: true }))
    }
  }

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    emp.department.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Overview stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <StatCard title="Total Employees" value="15" trend="Active Workforces" trendType="neutral" />
        <StatCard title="Claims Submitted" value="148" trend="Last 30 Days" trendType="neutral" />
        <StatCard title="High Risk Submitters" value="3 staff" trend="Requires auditing" trendType="down" />
        <StatCard title="Audit Suspended" value="0 staff" trend="All clear" trendType="up" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Table List Column */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h3 className="text-white font-bold text-sm">Corporate Directory</h3>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search name or department..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-slate-400 text-xs font-semibold uppercase">
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Claims Count</th>
                      <th className="py-3 px-4">Spend (INR)</th>
                      <th className="py-3 px-4">Risk Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.map((emp) => (
                      <tr
                        key={emp.id}
                        onClick={() => setSelectedEmployee(emp)}
                        className={`border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${
                          selectedEmployee?.id === emp.id ? 'bg-white/5' : ''
                        }`}
                      >
                        <td className="py-4 px-4 text-white font-semibold">{emp.name}</td>
                        <td className="py-4 px-4 text-slate-300">{emp.department}</td>
                        <td className="py-4 px-4 text-slate-300 font-mono">{emp.claims_count}</td>
                        <td className="py-4 px-4 text-white font-mono">{formatCurrency(emp.total_spend, 'INR')}</td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            emp.risk_score < 30
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : emp.risk_score < 70
                              ? 'bg-amber-500/10 text-amber-400'
                              : 'bg-red-500/10 text-red-400'
                          }`}>
                            {emp.risk_score < 30 ? 'Low' : emp.risk_score < 70 ? 'Medium' : 'High'}
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

        {/* Detail Panel Column */}
        <div>
          {selectedEmployee ? (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <Card variant="glow">
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <h3 className="font-bold text-white text-base">Employee Risk Score</h3>
                    <button onClick={() => setSelectedEmployee(null)} className="text-slate-400 hover:text-white text-xs">
                      Close
                    </button>
                  </div>

                  <div className="flex flex-col items-center justify-center py-4 bg-white/5 rounded-2xl border border-white/10">
                    <RiskMeter score={selectedEmployee.risk_score} size={100} strokeWidth={8} />
                  </div>

                  <div className="space-y-4 text-sm">
                    <div>
                      <p className="text-slate-400 text-xs font-semibold uppercase">Full Name</p>
                      <p className="text-white font-semibold mt-0.5">{selectedEmployee.name}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-slate-400 text-xs font-semibold uppercase">Department</p>
                        <p className="text-white font-semibold mt-0.5">{selectedEmployee.department}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs font-semibold uppercase">Total Claims</p>
                        <p className="text-white font-semibold mt-0.5">{selectedEmployee.claims_count}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      {selectedEmployee.is_active ? (
                        <button
                          onClick={() => handleDeactivate(selectedEmployee.id)}
                          className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                        >
                          <UserX className="h-4 w-4" />
                          Deactivate Employee
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivate(selectedEmployee.id)}
                          className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                        >
                          <UserCheck className="h-4 w-4" />
                          Activate Employee
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
                Select an employee from the table directory to load active risk indicators.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

const MOCK_EMPLOYEES = [
  { id: '1', name: 'Priya Sharma', department: 'Sales', claims_count: 24, total_spend: 342000, risk_score: 15, is_active: true },
  { id: '2', name: 'Rahul Mehta', department: 'Engineering', claims_count: 12, total_spend: 145000, risk_score: 22, is_active: true },
  { id: '3', name: 'Arjun Nair', department: 'Marketing', claims_count: 18, total_spend: 184000, risk_score: 75, is_active: true }
]
