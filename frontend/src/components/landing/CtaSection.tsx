import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles, LogIn, CheckCircle2, ShieldCheck, Zap, Calendar } from 'lucide-react'

interface CtaSectionProps {
  onOpenPricingModal: () => void
}

export function CtaSection({ onOpenPricingModal }: CtaSectionProps) {
  return (
    <section className="py-16 md:py-20 bg-gradient-to-b from-white via-teal-50/30 to-slate-50 text-slate-900 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="bg-white border-2 border-teal-200 rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8 group">
          
          {/* Ambient Light Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-teal-100/50 to-indigo-100/50 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform" />

          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-bold uppercase tracking-wider border border-teal-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Transform Your Workforce Operations
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight leading-snug">
              Ready to Upgrade to India's #1 Budget-Friendly HRMS?
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Get complete Task Management, Automated Indian Payroll, Employee Portals, and Skill Analytics for 50, 100, or 200 member teams starting at just ₹1,199/month.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-700 pt-1 font-semibold">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-teal-600" /> 100% Indian Statutory Compliant</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Free Data Migration Support</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-amber-600" /> GST Tax Invoice Provided</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full sm:w-auto shrink-0">
            <Link
              to="/pricing"
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 hover:from-teal-700 hover:to-emerald-700 text-white font-extrabold text-xs sm:text-sm transition-all shadow-[0_6px_25px_rgba(20,184,166,0.35)] text-center flex items-center justify-center gap-2 group border border-teal-500/20"
            >
              <span>Explore 50 / 100 / 200 Plans (₹)</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/book-demo"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs sm:text-sm transition-all text-center flex items-center justify-center gap-2 shadow-[0_6px_20px_rgba(245,158,11,0.3)] border border-amber-400/20"
            >
              <Calendar className="w-4 h-4" />
              <span>Book a Product Demo</span>
            </Link>

            <button
              onClick={onOpenPricingModal}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold text-xs transition-all text-center flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>Compare All Features</span>
            </button>
          </div>

        </div>
      </div>
    </section>
  )
}
