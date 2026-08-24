import { DollarSign, CheckCircle2, ShieldCheck, Download, FileText, ArrowRight, Building, Sparkles } from 'lucide-react'

export function StatutoryPayrollSection() {
  const compliancePoints = [
    { title: 'Employee Provident Fund (EPF & EPS)', desc: 'Automated 12% calculation with employer contribution split and ECR file generation.' },
    { title: 'Employee State Insurance (ESI)', desc: 'Instant 3.25% employer and 0.75% employee contribution mapping for all eligible staff.' },
    { title: 'State-wise Professional Tax (PT)', desc: 'Built-in PT slabs for Karnataka, Maharashtra, Telangana, Tamil Nadu, and all Indian states.' },
    { title: 'Income Tax & TDS Deduction (Form 16)', desc: 'Auto TDS calculation based on Old & New tax regimes with quarterly Form 24Q reports.' },
    { title: '1-Click Digital PDF Payslips', desc: 'Customizable PDF payslips emailed automatically to employees with digital signature.' },
    { title: 'Direct Bank Transfer File (NEFT/RTGS)', desc: 'Export bank-ready batch payout files formatted for HDFC, ICICI, SBI, and Axis Bank.' },
  ]

  return (
    <section id="payroll-vault" className="py-14 md:py-16 bg-white text-slate-900 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-3 shadow-2xs">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Statutory Payroll & Compliance Engine
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            100% Indian Statutory Payroll — Zero Manual Calculations
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            Process monthly salaries in minutes while ensuring full compliance with Indian Labor & Income Tax laws in Indian Rupees (₹).
          </p>
        </div>

        {/* Feature Grid & Sample Payslip Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Grid: 6 Statutory Compliance Pillars */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {compliancePoints.map((item, idx) => (
              <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5 shadow-2xs hover:border-emerald-300 transition-all">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{item.title}</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed pl-6">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Right Showcase Box: Live Mock Payslip Card */}
          <div className="lg:col-span-5">
            <div className="bg-white border-2 border-emerald-500/60 rounded-2xl p-5 shadow-md space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                    PS
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900">Digital Payslip Preview</span>
                    <p className="text-[10px] text-slate-500">Employee: Ananya Sharma (EMP-104)</p>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-extrabold">
                  July 2026
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between p-2 bg-slate-50 rounded border border-slate-200">
                  <span className="text-slate-600">Basic Salary</span>
                  <span className="font-bold text-slate-900">₹35,000</span>
                </div>
                <div className="flex justify-between p-2 bg-slate-50 rounded border border-slate-200">
                  <span className="text-slate-600">HRA & Special Allowance</span>
                  <span className="font-bold text-slate-900">₹25,000</span>
                </div>
                <div className="flex justify-between p-2 bg-rose-50/70 rounded border border-rose-200 text-rose-800">
                  <span>Deductions (EPF + PT + TDS)</span>
                  <span className="font-bold">- ₹2,000</span>
                </div>
                <div className="flex justify-between p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 font-black text-emerald-900 text-sm">
                  <span>Net Salary Take-Home</span>
                  <span>₹58,000</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Bank Batch Ready
                </span>
                <a
                  href="#pricing"
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" /> Sample Payslip
                </a>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  )
}
