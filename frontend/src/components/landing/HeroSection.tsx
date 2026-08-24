import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, CheckCircle2, ShieldCheck, Play, Sparkles, Zap, Lock } from 'lucide-react'
import { DashboardMockupPreview } from './DashboardMockupPreview'

interface HeroSectionProps {
  onOpenPricingModal: () => void
  onOpenDemoModal?: () => void
}

export function HeroSection({ onOpenPricingModal }: HeroSectionProps) {
  const navigate = useNavigate()

  const stats = [
    { label: 'Starting Price', value: '₹24 /emp/mo', sub: 'Lowest cost HRMS in India', glow: 'bg-teal-50 border-teal-200' },
    { label: 'Active Employees', value: '50,000+', sub: 'Across 450+ companies', glow: 'bg-indigo-50 border-indigo-200' },
    { label: 'Payroll Accuracy', value: '99.99%', sub: 'PF, ESI & TDS automated', glow: 'bg-amber-50 border-amber-200' },
    { label: 'Average ROI', value: '70% Saved', sub: 'Compared to legacy tools', glow: 'bg-emerald-50 border-emerald-200' },
  ]

  return (
    <section id="hero" className="relative pt-28 pb-16 md:pt-32 md:pb-20 overflow-hidden bg-gradient-to-b from-white via-teal-50/30 to-slate-50 text-slate-900 border-b border-slate-200">
      
      {/* Shiny Vibrant Light Glow Backgrounds */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-teal-400/15 via-emerald-300/20 to-indigo-400/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-gradient-to-br from-amber-300/15 to-orange-300/15 rounded-full blur-[100px] pointer-events-none" />

      {/* Light Mesh Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f080_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f080_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          
          {/* Shiny Metallic Pill Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-block p-[1px] rounded-full bg-gradient-to-r from-teal-500 via-emerald-500 to-indigo-500 mb-6 shadow-[0_4px_20px_rgba(20,184,166,0.25)]"
          >
            <button
              onClick={onOpenPricingModal}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/95 backdrop-blur-md text-slate-900 text-xs font-bold transition-all cursor-pointer hover:bg-white"
            >
              <span className="flex h-2 w-2 rounded-full bg-teal-600 animate-pulse" />
              <span className="bg-gradient-to-r from-teal-800 via-emerald-800 to-teal-900 bg-clip-text text-transparent font-extrabold">
                🇮🇳 #1 Indian Workforce & Task Platform
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-700 font-medium">Lowest Cost Guaranteed</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" style={{ animationDuration: '4s' }} />
            </button>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight leading-[1.12] mb-6"
          >
            Full-Featured Enterprise HRMS <br />
            <span className="bg-gradient-to-r from-teal-600 via-emerald-600 to-indigo-600 bg-clip-text text-transparent drop-shadow-xs">
              At 1/4th the Cost of Legacy Software
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed font-normal mb-8 max-w-3xl mx-auto"
          >
            Streamline <strong className="text-slate-900 font-semibold">Task Management</strong>, <strong className="text-slate-900 font-semibold">Automated Indian Payroll</strong> (PF, ESI, TDS), <strong className="text-slate-900 font-semibold">360° Employee Records</strong>, and <strong className="text-slate-900 font-semibold">Skill Appraisals</strong>. Subscriptions tailored for 50, 100 & 200 member teams in Indian Rupees (₹).
          </motion.p>

          {/* Shiny Action CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-12"
          >
            <Link
              to="/pricing"
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 hover:from-teal-700 hover:to-emerald-700 text-white font-extrabold text-xs sm:text-sm shadow-[0_6px_25px_rgba(20,184,166,0.35)] transition-all flex items-center justify-center gap-2 group border border-teal-500/20"
            >
              <span>Explore 50 / 100 / 200 Member Plans</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/book-demo"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-[0_6px_20px_rgba(245,158,11,0.3)] border border-amber-400/20"
            >
              <Zap className="w-4 h-4 fill-current text-white" />
              <span>Book a Live Demo</span>
            </Link>

            <button
              onClick={() => navigate('/demo')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <div className="w-5 h-5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center">
                <Play className="w-3 h-3 fill-current ml-0.5" />
              </div>
              <span>Interactive Sandbox</span>
            </button>
          </motion.div>

          {/* Quick Value Highlights Pill Row */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-700 mb-12">
            <span className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-teal-600" /> 100% Statutory Compliant (EPF/ESI/TDS)
            </span>
            <span className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Sprint Kanban Task Boards
            </span>
            <span className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-indigo-600" /> ISO 27001 Encrypted Storage
            </span>
          </div>

        </div>

        {/* Dashboard Live Preview Mockup Frame */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="relative max-w-5xl mx-auto"
        >
          <div className="absolute -inset-1.5 bg-gradient-to-r from-teal-400 via-emerald-400 to-indigo-400 rounded-3xl blur-xl opacity-30 animate-pulse" style={{ animationDuration: '6s' }} />
          <div className="relative bg-white rounded-2xl border border-slate-200/90 shadow-2xl p-1.5">
            <DashboardMockupPreview />
          </div>
        </motion.div>

        {/* Shiny Light Stats Cards Grid */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((st, idx) => (
            <div
              key={idx}
              className={`p-5 rounded-2xl bg-white border border-slate-200 shadow-md relative overflow-hidden space-y-1 group hover:border-teal-400 hover:shadow-lg transition-all`}
            >
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-teal-100/50 to-emerald-100/50 rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-transform`} />
              <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{st.value}</p>
              <p className="text-xs font-extrabold text-teal-800">{st.label}</p>
              <p className="text-[10px] text-slate-500 font-medium">{st.sub}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
