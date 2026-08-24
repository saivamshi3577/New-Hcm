import { motion } from 'framer-motion'
import { CheckCircle2, TrendingUp, Users, DollarSign, CheckSquare, Shield, Sparkles, Activity, Clock } from 'lucide-react'

export function DashboardMockupPreview() {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="w-full bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xl text-slate-900 text-xs group"
    >
      
      {/* Top Browser Chrome Bar */}
      <div className="px-4 py-3 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-rose-400/90 inline-block shadow-2xs" />
          <span className="w-3 h-3 rounded-full bg-amber-400/90 inline-block shadow-2xs" />
          <span className="w-3 h-3 rounded-full bg-emerald-400/90 inline-block shadow-2xs" />
          <span className="text-[11px] text-slate-500 font-mono ml-3 hidden sm:inline-block bg-white px-2.5 py-0.5 rounded-md border border-slate-200">
            https://fusionhrms.in/super-admin/dashboard
          </span>
        </div>
        <div className="flex items-center space-x-3 text-xs text-slate-600 font-medium">
          <span className="bg-teal-50 text-teal-800 border border-teal-200/80 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 font-bold text-[11px] shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" /> Live Workspace
          </span>
          <span className="text-slate-500 hidden md:inline-block text-[11px]">Org: TechFusion India Ltd</span>
        </div>
      </div>

      {/* Main Inner Dashboard Layout Preview */}
      <div className="p-5 space-y-4 bg-slate-50/60">
        
        {/* Top Header Banner */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 via-indigo-600 to-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
              FH
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900">Executive HR & Task Control Dashboard</h4>
              <p className="text-[11px] text-slate-500 font-medium">100 Active Staff • Statutory Payroll Disbursed in ₹</p>
            </div>
          </div>
          <span className="hidden sm:inline-flex text-[11px] font-extrabold text-teal-800 bg-teal-50 px-3 py-1 rounded-lg border border-teal-200">
            Super Admin View
          </span>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-teal-400/50 transition-all">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[11px] font-semibold text-slate-500">Active Employees</span>
              <div className="p-1.5 bg-teal-50 text-teal-600 rounded-lg">
                <Users className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-slate-900">100 / 100</p>
            <p className="text-[10px] text-emerald-600 font-bold mt-0.5">100% Billed in ₹</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-400/50 transition-all">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[11px] font-semibold text-slate-500">Monthly Payroll</span>
              <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                <DollarSign className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-teal-700">₹42,85,000</p>
            <p className="text-[10px] text-emerald-700 font-bold mt-0.5">PF, ESI, TDS Compliant</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-indigo-400/50 transition-all">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[11px] font-semibold text-slate-500">Task Velocity</span>
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-slate-900">94.8%</p>
            <p className="text-[10px] text-teal-600 font-bold mt-0.5">142 Sprints Completed</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-orange-400/50 transition-all">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[11px] font-semibold text-slate-500">Skill Competency</span>
              <div className="p-1.5 bg-orange-50 text-orange-600 rounded-lg">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-orange-600">88.5 <span className="text-xs text-slate-400 font-normal">/100</span></p>
            <p className="text-[10px] text-slate-500 mt-0.5">Skill Track Active</p>
          </div>
        </div>

        {/* Lower Task Kanban & Payroll Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          
          {/* Sprint Tasks Column */}
          <div className="lg:col-span-7 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-teal-600" /> Active Sprint Task Board
              </span>
              <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                Sprint 14 Active
              </span>
            </div>

            <div className="space-y-2">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-[11px]">
                <div>
                  <span className="font-bold text-slate-900 block">1-Click PDF Payslip Generator</span>
                  <span className="text-slate-500 text-[10px]">Assignee: Ananya Sharma (Sr. Dev)</span>
                </div>
                <span className="bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded text-[10px]">
                  In Progress (80%)
                </span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-[11px]">
                <div>
                  <span className="font-bold text-slate-900 block">EPF Statutory Deduction Engine</span>
                  <span className="text-slate-500 text-[10px]">Assignee: Priya Verma (Lead)</span>
                </div>
                <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                  Completed
                </span>
              </div>
            </div>
          </div>

          {/* Payroll Breakdown Summary Column */}
          <div className="lg:col-span-5 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-indigo-600" /> Statutory Tax Summary
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                July Approved
              </span>
            </div>

            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between p-1.5 bg-slate-50 rounded border border-slate-200">
                <span className="text-slate-600">Employee PF (EPF)</span>
                <span className="font-bold text-slate-900">₹5,14,200</span>
              </div>
              <div className="flex justify-between p-1.5 bg-slate-50 rounded border border-slate-200">
                <span className="text-slate-600">Employee ESI</span>
                <span className="font-bold text-slate-900">₹1,38,600</span>
              </div>
              <div className="flex justify-between p-2 bg-teal-50 rounded-lg border border-teal-200 font-bold text-teal-900">
                <span>Net Salary Take-Home</span>
                <span>₹32,20,200</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </motion.div>
  )
}
