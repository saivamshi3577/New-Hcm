import { useState, useEffect } from 'react'
import { LandingHeader } from '@/components/landing/LandingHeader'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { SubscriptionRequestModal } from '@/components/subscription/SubscriptionRequestModal'
import { Link } from 'react-router-dom'
import {
  CheckSquare,
  DollarSign,
  Users,
  GraduationCap,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Zap,
  Calendar,
  Layers
} from 'lucide-react'

export default function ModulesPage() {
  const [activeModule, setActiveModule] = useState<'tms' | 'payroll' | 'ems' | 'skill' | 'analytics'>('tms')
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false)
  const [selectedPlan] = useState('100 Members (₹2,699/mo)')

  // Interactive Tax Calculator State for Modules Page
  const [basicSalary, setBasicSalary] = useState<number>(45000)

  useEffect(() => {
    document.title = "FusionHRMS Modules — Task Management, Statutory Payroll, EMS & Skill Track"
  }, [])

  // Calculations for Statutory Live Tax Engine Preview
  const epfEmployee = Math.round(basicSalary * 0.12)
  const epfEmployer = Math.round(basicSalary * 0.12)
  const esiEmployee = basicSalary <= 21000 ? Math.round(basicSalary * 0.0075) : 0
  const esiEmployer = basicSalary <= 21000 ? Math.round(basicSalary * 0.0325) : 0
  const netTakeHome = basicSalary - epfEmployee - esiEmployee - 200

  const modules = [
    {
      id: 'tms',
      name: 'Task Management (TMS)',
      subtitle: 'Sprint Kanban, Sub-Tasks & Workload Analytics',
      icon: CheckSquare,
      color: 'from-indigo-600 to-indigo-700',
      badgeBg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      description: 'Streamline team workflows with visual Kanban sprint boards, automated priority tagging, sub-task checklists, and 60-point monthly evaluation scoring.',
      features: [
        'Visual Sprint Kanban & Todo/In-Progress/Completed Columns',
        'Sub-Task Checklists with Drag & Drop Ordering',
        'Priority Tagging (Urgent, High, Medium, Low)',
        'Monthly 60-Point Max Evaluation Guardrail',
        'Direct Task Comments & Activity Audit Trail'
      ],
      image: '/white_hrms_dashboard.jpg'
    },
    {
      id: 'payroll',
      name: 'Statutory Payroll (PMS)',
      subtitle: '100% Indian EPF, ESI, PT & TDS Compliance',
      icon: DollarSign,
      color: 'from-emerald-600 to-teal-700',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      description: 'Automate salary calculation for Indian workforces. Calculate Employee Provident Fund (EPF 12%), ESI (3.25%), Professional Tax (PT), and TDS Form 16 withholding with 1-click downloadable PDF payslips.',
      features: [
        'Automated EPF (12%), ESI (3.25%) & PT Calculation',
        'Downloadable PDF Payslips for All Staff',
        'Direct Bank Payout NEFT/RTGS File Generator',
        'Form 16 Annual Tax Summary Reports',
        'Overtime & Variable Incentive Multipliers'
      ],
      image: '/hrms_dashboard_hero.jpg'
    },
    {
      id: 'ems',
      name: 'Employee Directory (EMS)',
      subtitle: '360° Staff Profiles & Encrypted Vault',
      icon: Users,
      color: 'from-teal-600 to-emerald-700',
      badgeBg: 'bg-teal-50 text-teal-800 border-teal-200',
      description: 'Centralize employee master data, emergency contacts, bank accounts, Aadhaar/PAN compliance documents, and departmental reporting structures.',
      features: [
        'Verified Aadhaar, PAN & Bank Account Vault',
        'Department & Multi-Branch Hierarchy',
        'Self-Service Employee Profile Portal',
        'Role-Based Access Control (Super Admin, Admin, Member)',
        'Bulk Employee CSV Import & Export'
      ],
      image: '/hrms_modules_showcase.jpg'
    },
    {
      id: 'skill',
      name: 'Skill Track & Appraisals',
      subtitle: 'MCQ Competency Exams & Scorecard',
      icon: GraduationCap,
      color: 'from-purple-600 to-violet-700',
      badgeBg: 'bg-purple-50 text-purple-800 border-purple-200',
      description: 'Measure workforce technical competency with monthly timed MCQ skill exams, scorecard ratings, manager appraisal reviews, and automated leaderboard rankings.',
      features: [
        'Timed MCQ Skill Assessments with Random Question Pools',
        'Monthly Leaderboard Ranking Reset (Current Month View)',
        'Manager Performance Appraisal Scorecard (1 to 5 Stars)',
        'Skill Gap Analysis & Training Recommendations',
        'Historical Month Skill Report Filter'
      ],
      image: '/white_hrms_dashboard.jpg'
    },
    {
      id: 'analytics',
      name: 'Organization Analytics',
      subtitle: 'Executive KPIs & Audit Security Logs',
      icon: TrendingUp,
      color: 'from-orange-500 to-amber-600',
      badgeBg: 'bg-orange-50 text-orange-800 border-orange-200',
      description: 'Gain complete visibility into enterprise performance, attendance rates, payroll disbursement totals, and encrypted security audit logs.',
      features: [
        'Real-Time MRR & Payroll Disbursement Breakdown',
        '98.2% Organization Attendance Analytics',
        'Immutable Encrypted Security Audit Trail',
        'Exportable Executive Reports (PDF, Excel, CSV)',
        'Live Subscription Lead Requests Dashboard'
      ],
      image: '/hrms_dashboard_hero.jpg'
    }
  ]

  const currentMod = modules.find(m => m.id === activeModule) || modules[0]

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900 flex flex-col justify-between">
      <div>
        <LandingHeader />

        {/* Shiny Hero Banner */}
        <section className="pt-28 pb-14 bg-gradient-to-b from-white via-teal-50/40 to-slate-50 border-b border-slate-200 relative overflow-hidden">
          
          {/* Ambient Glow & Grid Overlay */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-teal-400/15 via-emerald-300/20 to-indigo-400/15 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f080_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f080_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 relative z-10">
            
            <div className="inline-block p-[1px] rounded-full bg-gradient-to-r from-teal-500 via-emerald-500 to-indigo-500 shadow-[0_4px_20px_rgba(20,184,166,0.2)]">
              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white text-slate-900 text-xs font-bold">
                <Layers className="w-3.5 h-3.5 text-teal-600" />
                <span className="bg-gradient-to-r from-teal-700 to-emerald-800 bg-clip-text text-transparent font-extrabold">Enterprise HRMS & TMS Module Suite</span>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-950 tracking-tight max-w-4xl mx-auto leading-tight">
              All-in-One Workforce Suite <br />
              <span className="bg-gradient-to-r from-teal-600 via-emerald-600 to-indigo-600 bg-clip-text text-transparent">
                Built for Indian Operations
              </span>
            </h1>

            <p className="text-slate-600 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
              Explore the core modules powering FusionHRMS — Task Management (TMS), Indian Statutory Payroll (PMS), Employee Records (EMS), Skill Track Appraisals, and Organization Analytics.
            </p>

            <div className="pt-2 flex flex-wrap justify-center gap-3.5 text-xs">
              <Link
                to="/book-demo"
                className="px-6 py-3 bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 hover:from-teal-700 hover:to-emerald-700 text-white font-extrabold rounded-2xl shadow-[0_6px_25px_rgba(20,184,166,0.35)] flex items-center gap-2 border border-teal-500/20"
              >
                <Calendar className="w-4 h-4" /> Book a Live Product Walkthrough
              </Link>
              <Link
                to="/demo"
                className="px-5 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-extrabold rounded-2xl shadow-sm flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-500" /> Launch Interactive Sandbox
              </Link>
            </div>

          </div>
        </section>

        {/* Interactive Module Tabs Section */}
        <section className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Module Selector Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-8">
            {modules.map((m) => {
              const Icon = m.icon
              const isSelected = m.id === activeModule
              return (
                <button
                  key={m.id}
                  onClick={() => setActiveModule(m.id as any)}
                  className={`p-4 rounded-2xl text-left border transition-all duration-300 flex flex-col justify-between space-y-3 cursor-pointer ${
                    isSelected
                      ? 'bg-white border-teal-500 shadow-lg ring-4 ring-teal-500/10'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md bg-gradient-to-r ${m.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`font-extrabold text-xs ${isSelected ? 'text-slate-950' : 'text-slate-800'}`}>
                      {m.name}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">{m.subtitle}</p>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Active Module Detailed Card View */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-6 space-y-5">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${currentMod.badgeBg}`}>
                {currentMod.name}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {currentMod.subtitle}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {currentMod.description}
              </p>

              <div className="space-y-2.5 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Key Features & Capabilities:</h4>
                <div className="space-y-2 text-xs">
                  {currentMod.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-slate-700 font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex items-center gap-3">
                <button
                  onClick={() => setIsSubscribeModalOpen(true)}
                  className="px-6 py-3 bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 hover:from-teal-700 hover:to-emerald-700 text-white font-extrabold text-xs rounded-2xl shadow-[0_6px_20px_rgba(20,184,166,0.3)] flex items-center gap-1.5"
                >
                  <DollarSign className="w-4 h-4 text-amber-300" /> Activate {currentMod.name}
                </button>
                <Link
                  to="/demo"
                  className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-2xl border border-slate-200"
                >
                  Try in Sandbox
                </Link>
              </div>
            </div>

            {/* Module Mockup Preview */}
            <div className="lg:col-span-6 bg-slate-100 rounded-2xl p-2 border border-slate-200 shadow-inner">
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-white aspect-video relative group shadow-sm">
                <img
                  src={currentMod.image}
                  alt={currentMod.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent flex items-end p-4">
                  <span className="text-white text-xs font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-teal-400" /> Enterprise Live UI View ({currentMod.name})
                  </span>
                </div>
              </div>
            </div>

          </div>

        </section>

        {/* Live Interactive Statutory Tax Calculation Engine */}
        <section className="py-14 bg-white border-t border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">Statutory Payroll Engine</span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Try the Live Indian Payroll Calculation Engine</h2>
              <p className="text-xs text-slate-500 max-w-xl mx-auto">Adjust basic salary below to test real-time EPF, ESI, Professional Tax, and net take-home calculations.</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-4xl mx-auto shadow-sm grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-6 space-y-4">
                <div className="flex justify-between items-center text-xs font-extrabold text-slate-900">
                  <span>Monthly Basic Salary Input:</span>
                  <span className="text-teal-700 font-mono text-sm">₹{basicSalary.toLocaleString('en-IN')}</span>
                </div>
                <input
                  type="range"
                  min="15000"
                  max="150000"
                  step="5000"
                  value={basicSalary}
                  onChange={(e) => setBasicSalary(Number(e.target.value))}
                  className="w-full accent-teal-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                />
                <p className="text-[11px] text-slate-500">Includes Statutory PF 12% cap, ESI eligibility rule under ₹21,000, and PT deduction ₹200.</p>
              </div>

              <div className="md:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 space-y-2.5 text-xs shadow-2xs">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">EPF Employee Deduction (12%):</span>
                  <span className="font-bold text-slate-900">₹{epfEmployee.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">EPF Employer Contribution (12%):</span>
                  <span className="font-bold text-slate-900">₹{epfEmployer.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">ESI Employee Deduction (0.75%):</span>
                  <span className="font-bold text-slate-900">₹{esiEmployee.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">Professional Tax (PT):</span>
                  <span className="font-bold text-slate-900">₹200</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="font-extrabold text-slate-900">Estimated Net Take Home:</span>
                  <span className="font-mono font-black text-teal-700 text-sm">₹{netTakeHome.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* Subscription Request Modal */}
      <SubscriptionRequestModal
        open={isSubscribeModalOpen}
        onOpenChange={setIsSubscribeModalOpen}
        defaultPlan={selectedPlan}
      />

      <LandingFooter />
    </div>
  )
}
