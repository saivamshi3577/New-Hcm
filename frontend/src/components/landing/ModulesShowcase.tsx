import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckSquare,
  DollarSign,
  Users,
  Award,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Lock,
  Layers
} from 'lucide-react'

export function ModulesShowcase() {
  const [activeTab, setActiveTab] = useState<'tasks' | 'payroll' | 'employees' | 'hr'>('tasks')

  const modules = [
    {
      id: 'tasks',
      name: 'Task Management',
      icon: CheckSquare,
      tagline: 'Streamline Projects, Sprint Kanban & Daily Workflows',
      badge: 'Integrated TMS',
      description:
        'Empower your workforce with visual task boards, milestone tracking, priority queues, automated deadlines, and real-time activity tracking.',
      features: [
        'Interactive Drag-and-Drop Kanban Boards & Lists',
        'Role-Based Task Assignment & Milestone Management',
        'Real-Time Status Alerts & Sub-Task Checklist Breakdowns',
        'Sprint Tracking & Employee Workload Balancing',
        'Automated Overdue Reminders & Progress Analytics',
        'File Attachments & In-Task Activity Comments',
      ],
      badgeBg: 'bg-teal-50 text-teal-800 border-teal-200',
      activeBorder: 'border-teal-500 ring-2 ring-teal-500/20 bg-white shadow-md',
      iconBg: 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white',
      preview: {
        title: 'Task Board Live View',
        items: [
          { title: 'Finalize Q3 Statutory Payroll Run', priority: 'High', status: 'In Progress', assignee: 'Priya S.', progress: 75 },
          { title: 'Employee Performance Appraisal Review', priority: 'Medium', status: 'Review', assignee: 'Rahul M.', progress: 90 },
          { title: 'Update EPF Compliance Declarations', priority: 'Urgent', status: 'To Do', assignee: 'Amit K.', progress: 30 },
        ],
      },
    },
    {
      id: 'payroll',
      name: 'Statutory Payroll',
      icon: DollarSign,
      tagline: '1-Click Automated Statutory Indian Payroll Processing',
      badge: '100% Statutory Compliant',
      description:
        'Eliminate manual Excel calculations. Generate compliant salary structures, PF, ESI, Professional Tax, TDS deductions, and instant downloadable payslips.',
      features: [
        'Automated Monthly Gross-to-Net Salary Calculations',
        'Instant Statutory Filings (EPF, ESI, PT & TDS Breakdown)',
        '1-Click Digital Payslip PDF Generation & Email Delivery',
        'Bank Direct Salary Transfer File (NEFT/RTGS Batch Format)',
        'Custom Allowances, Bonuses & Overtime Rates Engine',
        'Unpaid Leave & Loss of Pay (LOP) Automatic Adjustments',
      ],
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      activeBorder: 'border-emerald-500 ring-2 ring-emerald-500/20 bg-white shadow-md',
      iconBg: 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white',
      preview: {
        title: 'Automated Payslip Engine',
        salaryBreakdown: [
          { item: 'Basic Salary', amount: '₹35,000' },
          { item: 'House Rent Allowance (HRA)', amount: '₹14,000' },
          { item: 'Special Allowance', amount: '₹11,000' },
          { item: 'EPF Deduction (Employee 12%)', amount: '- ₹1,800' },
          { item: 'Professional Tax (PT)', amount: '- ₹200' },
          { item: 'Net Take-Home Salary', amount: '₹58,000', bold: true },
        ],
      },
    },
    {
      id: 'employees',
      name: 'Employee Directory',
      icon: Users,
      tagline: '360° Digital Employee Portal & Encrypted Vault',
      badge: 'Self-Service Portal',
      description:
        'Centralize all workforce records in one secure vault. Manage onboarding, digital documents, org charts, department hierarchy, and leave requests effortlessly.',
      features: [
        'Complete 360° Employee Profiles & Contact Directory',
        'Paperless Digital Onboarding & Offboarding Checklists',
        'Encrypted Employee Document Vault (Aadhaar, PAN, Offer Letters)',
        'Department & Role Hierarchy Organization Charts',
        'Leave & Attendance Self-Service Request & Approval Flow',
        'Shift Scheduling & Shift Swap Request Tracking',
      ],
      badgeBg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      activeBorder: 'border-indigo-500 ring-2 ring-indigo-500/20 bg-white shadow-md',
      iconBg: 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white',
      preview: {
        title: 'Verified Employee Record',
        employee: {
          name: 'Ananya Sharma',
          role: 'Senior Software Engineer',
          dept: 'Engineering & Product',
          docs: 'Aadhaar & PAN Verified',
          leaveBal: '14 Days Paid Leave Remaining',
        },
      },
    },
    {
      id: 'hr',
      name: 'Skill Track & Appraisals',
      icon: Award,
      tagline: '360° Competency Exams & Performance Scorecards',
      badge: 'Monthly Leaderboard',
      description:
        'Conduct MCQ competency tests, track monthly skill ratings, evaluate sprint delivery, and generate automated performance appraisal scorecards.',
      features: [
        'Timed MCQ Skill Exams & Knowledge Verification',
        'Monthly Leaderboard Ranking & High Performer Badges',
        'Manager Appraisal Scorecard (1 to 5 Star Rating)',
        'Sprint Point Velocity & Task Accuracy Analytics',
        'Historical Month Skill Progress Comparison Filter',
        'Custom Skill Assessment Question Pool Builder',
      ],
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
      activeBorder: 'border-amber-500 ring-2 ring-amber-500/20 bg-white shadow-md',
      iconBg: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white',
      preview: {
        title: 'Skill Assessment Competency',
        skills: [
          { skill: 'React & Frontend Architecture', level: '94%' },
          { skill: 'Sprint Task Completion Velocity', level: '88%' },
          { skill: 'Statutory Compliance Audit', level: '98%' },
        ],
      },
    },
  ]

  const currentModule = modules.find((m) => m.id === activeTab) || modules[0]

  return (
    <section id="modules" className="py-16 md:py-20 bg-white text-slate-900 relative overflow-hidden border-b border-slate-200">
      
      {/* Light Background Ambient Glow */}
      <div className="absolute top-1/2 right-10 w-96 h-96 bg-teal-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-indigo-100/40 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Title */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5 text-teal-600" /> Modular Enterprise HRMS Platform
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Integrated HRMS, TMS & Statutory Payroll Modules
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            Select a module below to inspect its live workflow features, statutory compliance rules, and interactive preview cards.
          </p>
        </div>

        {/* Shiny Module Tab Selectors */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-10">
          {modules.map((mod) => {
            const Icon = mod.icon
            const isActive = mod.id === activeTab
            return (
              <button
                key={mod.id}
                onClick={() => setActiveTab(mod.id as any)}
                className={`p-4 rounded-2xl text-left transition-all duration-300 border flex flex-col justify-between space-y-3 relative overflow-hidden group cursor-pointer ${
                  isActive
                    ? mod.activeBorder
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/80'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${mod.iconBg}`}>
                  <Icon className="w-5 h-5" />
                </div>

                <div>
                  <h3 className={`font-extrabold text-sm ${isActive ? 'text-slate-950' : 'text-slate-800 group-hover:text-slate-950'}`}>
                    {mod.name}
                  </h3>
                  <span className={`inline-block px-2 py-0.5 text-[10px] rounded-md font-bold mt-1 border ${mod.badgeBg}`}>
                    {mod.badge}
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Tab Content Display Card */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentModule.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
            >
              
              {/* Left Column: Descriptions & Features List */}
              <div className="lg:col-span-7 space-y-6">
                <div className="space-y-2">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${currentModule.badgeBg}`}>
                    {currentModule.badge}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {currentModule.tagline}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {currentModule.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {currentModule.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-slate-700 font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <a
                    href="#pricing"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 hover:from-teal-700 hover:to-emerald-700 text-white font-extrabold text-xs shadow-md inline-flex items-center gap-1.5"
                  >
                    <span>Activate {currentModule.name}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href="#payroll-vault"
                    className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs border border-slate-200"
                  >
                    View Statutory Rules
                  </a>
                </div>
              </div>

              {/* Right Column: Live Feature Interactive Card */}
              <div className="lg:col-span-5">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-inner space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" /> {currentModule.preview.title}
                    </span>
                    <span className="text-[10px] font-mono bg-teal-100 text-teal-800 px-2 py-0.5 rounded border border-teal-200 font-bold">
                      LIVE STREAM
                    </span>
                  </div>

                  {/* Task Management Preview */}
                  {currentModule.id === 'tasks' && currentModule.preview.items && (
                    <div className="space-y-2.5 text-xs">
                      {currentModule.preview.items.map((task, i) => (
                        <div key={i} className="bg-white p-3 rounded-xl border border-slate-200 space-y-2 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{task.title}</span>
                            <span className={`px-2 py-0.5 text-[10px] rounded font-bold ${
                              task.priority === 'Urgent' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-teal-50 text-teal-800 border border-teal-200'
                            }`}>
                              {task.priority}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span>Assignee: <strong className="text-slate-800">{task.assignee}</strong></span>
                            <span className="text-teal-700 font-semibold">{task.status}</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full rounded-full" style={{ width: `${task.progress}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Payroll Management Preview */}
                  {currentModule.id === 'payroll' && currentModule.preview.salaryBreakdown && (
                    <div className="space-y-2 text-xs">
                      {currentModule.preview.salaryBreakdown.map((row, i) => (
                        <div
                          key={i}
                          className={`flex items-center justify-between p-2.5 rounded-xl ${
                            row.bold
                              ? 'bg-emerald-50 border border-emerald-200 font-bold text-emerald-950 shadow-2xs'
                              : 'bg-white border border-slate-200 text-slate-700'
                          }`}
                        >
                          <span>{row.item}</span>
                          <span className={row.amount.startsWith('-') ? 'text-rose-600 font-bold' : row.bold ? 'text-emerald-800 text-sm font-extrabold' : 'text-slate-900 font-semibold'}>
                            {row.amount}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Employee Directory Preview */}
                  {currentModule.id === 'employees' && currentModule.preview.employee && (
                    <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 text-xs shadow-2xs">
                      <div className="flex items-center space-x-3 pb-3 border-b border-slate-200">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-xs shadow-md">
                          AS
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900 text-sm">{currentModule.preview.employee.name}</p>
                          <p className="text-slate-500 text-[11px]">{currentModule.preview.employee.role}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                          <span className="text-slate-500 block">Department</span>
                          <span className="font-bold text-slate-800">{currentModule.preview.employee.dept}</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                          <span className="text-slate-500 block">Verification</span>
                          <span className="font-bold text-teal-700">{currentModule.preview.employee.docs}</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg col-span-2 border border-slate-200">
                          <span className="text-slate-500 block">Leave Balance Available</span>
                          <span className="font-bold text-indigo-700">{currentModule.preview.employee.leaveBal}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* HR & Skill Analytics Preview */}
                  {currentModule.id === 'hr' && currentModule.preview.skills && (
                    <div className="space-y-3 text-xs">
                      <p className="text-slate-500 text-[11px]">Skill Assessment Competency Radar</p>
                      {currentModule.preview.skills.map((sk, i) => (
                        <div key={i} className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5 shadow-2xs">
                          <div className="flex justify-between font-bold text-slate-800">
                            <span>{sk.skill}</span>
                            <span className="text-amber-600 font-extrabold">{sk.level}</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full" style={{ width: sk.level }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-teal-600" /> ISO 27001 Security</span>
                    <span className="text-teal-800 font-bold">FusionHRMS Engine</span>
                  </div>

                </div>
              </div>

            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </section>
  )
}
