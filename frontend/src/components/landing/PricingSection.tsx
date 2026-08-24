import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Sparkles, ArrowRight, ShieldCheck, Zap, Lock, DollarSign } from 'lucide-react'

interface PricingSectionProps {
  onSelectPlan: (planName: string, price: string, members: string) => void
  onOpenPricingModal: () => void
}

export function PricingSection({ onSelectPlan, onOpenPricingModal }: PricingSectionProps) {
  const [isAnnual, setIsAnnual] = useState(true)

  const plans = [
    {
      id: '50-members',
      name: '50 Members Plan',
      target: 'Startups & Small Offices',
      members: 'Up to 50 Members',
      badge: 'Starter HRMS',
      popular: false,
      monthlyPrice: 1499,
      annualPrice: 1199,
      perEmpCost: '~₹24 /emp/mo',
      description: 'Complete Task Management and Statutory Payroll engine for up to 50 active employees.',
      features: [
        'Up to 50 Active Employee Profiles',
        'Full Task Management & Kanban Boards',
        'Automated Salary & Payslip Generation',
        'Statutory PF, ESI & TDS Calculations',
        'Leave & Attendance Self-Service Portal',
        'Standard Email & Ticket Support',
        'Document Vault (Up to 5GB)',
      ],
      color: 'border-slate-200 bg-white text-slate-900 shadow-sm',
      buttonBg: 'bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold border border-slate-200',
    },
    {
      id: '100-members',
      name: '100 Members Plan',
      target: 'Fast-Growing Companies',
      members: 'Up to 100 Members',
      badge: 'MOST POPULAR CHOICE',
      popular: true,
      monthlyPrice: 2699,
      annualPrice: 2159,
      perEmpCost: '~₹21 /emp/mo',
      description: 'Ideal for scaling Indian SMBs requiring Sprint Kanban, Bank Payout exports, and Skill Track.',
      features: [
        'Up to 100 Active Employee Profiles',
        'Advanced Task Kanban & Sprint Workflows',
        '1-Click Direct Bank Transfer File Export',
        'Statutory PF, ESI, PT & TDS Filing Reports',
        'Skill Track & Performance Appraisals',
        'Company Broadcast & Announcement Board',
        'Priority Phone, Chat & WhatsApp Support',
        'Document Vault (Up to 20GB)',
      ],
      color: 'border-2 border-teal-500 bg-white shadow-xl ring-4 ring-teal-500/10 text-slate-900 relative',
      buttonBg: 'bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 hover:from-teal-700 hover:to-emerald-700 text-white font-extrabold shadow-md',
    },
    {
      id: '200-members',
      name: '200 Members Plan',
      target: 'Mid-Sized Enterprises',
      members: 'Up to 200 Members',
      badge: 'Best Value Scale',
      popular: false,
      monthlyPrice: 4799,
      annualPrice: 3839,
      perEmpCost: '~₹19 /emp/mo',
      description: 'Complete HR automation & task productivity suite built for up to 200 workforce accounts.',
      features: [
        'Up to 200 Active Employee Profiles',
        'Unlimited Task Projects & Sub-Task Tree',
        'Multi-Department & Branch Hierarchy',
        'Complete Audit Log Trail & Security Role Guard',
        'Custom Payslip Templates & Overtime Engine',
        'Custom Data Exports (Excel, CSV, PDF)',
        'Dedicated Customer Success Account Manager',
        'Document Vault (Up to 50GB)',
      ],
      color: 'border-slate-200 bg-white text-slate-900 shadow-sm',
      buttonBg: 'bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold border border-teal-200',
    },
    {
      id: 'custom-enterprise',
      name: '200+ Enterprise Plan',
      target: 'Large Enterprises & Corporates',
      members: '200+ Members',
      badge: 'Custom Suite',
      popular: false,
      monthlyPrice: 'Custom',
      annualPrice: 'Custom',
      perEmpCost: 'Volume Discount',
      description: 'Custom SLAs, dedicated server instances, custom API integrations & unlimited employee seats.',
      features: [
        'Unlimited Employee Accounts',
        'Custom Domain & Brand White-labeling',
        'Single Sign-On (SSO) & Biometric Integration',
        'Dedicated Private Cloud / On-Premise Support',
        'Custom ERP & Tally Integration API',
        'Dedicated 24/7 Phone & On-Site Support',
        'Custom SLA Guarantee & Data Migration',
      ],
      color: 'border-slate-200 bg-white text-slate-900 shadow-sm',
      buttonBg: 'bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold border border-slate-200',
    },
  ]

  return (
    <section id="pricing" className="py-16 md:py-20 bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900 relative overflow-hidden border-b border-slate-200">
      
      {/* Light Glow Background Elements */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-teal-200/20 via-emerald-200/20 to-indigo-200/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold uppercase tracking-wider">
            <DollarSign className="w-3.5 h-3.5 text-teal-600" /> Transparent Subscriptions in Indian Rupees (₹)
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Transparent Flat-Rate Pricing for Every Workforce
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            No per-user penalty pricing. Choose the member plan that matches your workforce size.
          </p>

          {/* Monthly / Annual Billing Toggle Switch */}
          <div className="pt-4 flex items-center justify-center gap-3 text-xs font-bold">
            <span className={!isAnnual ? 'text-slate-900 font-extrabold' : 'text-slate-500'}>Monthly Billing</span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className="w-14 h-7 rounded-full bg-slate-200 border border-slate-300 p-1 transition-colors relative cursor-pointer"
            >
              <motion.div
                animate={{ x: isAnnual ? 26 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="w-5 h-5 rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 shadow-md"
              />
            </button>
            <span className={isAnnual ? 'text-teal-800 font-extrabold' : 'text-slate-500'}>
              Annual Billing <span className="bg-teal-100 text-teal-800 text-[10px] px-2 py-0.5 rounded-full border border-teal-200 font-black">20% OFF</span>
            </span>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {plans.map((p) => {
            const priceDisplay =
              typeof p.annualPrice === 'number'
                ? isAnnual
                  ? `₹${p.annualPrice.toLocaleString('en-IN')}`
                  : `₹${p.monthlyPrice.toLocaleString('en-IN')}`
                : p.annualPrice

            return (
              <div
                key={p.id}
                className={`p-6 rounded-3xl backdrop-blur-md flex flex-col justify-between transition-all duration-300 ${p.color}`}
              >
                {p.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 text-white font-black text-[11px] uppercase tracking-wider px-3.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-300" /> {p.badge}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-500">{p.target}</span>
                    <h3 className="text-xl font-extrabold text-slate-900">{p.name}</h3>
                    <p className="text-xs text-teal-700 font-bold">{p.members}</p>
                  </div>

                  <div className="py-2 border-y border-slate-100 space-y-0.5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900">{priceDisplay}</span>
                      {typeof p.annualPrice === 'number' && (
                        <span className="text-xs text-slate-500">/ month</span>
                      )}
                    </div>
                    <p className="text-[11px] font-bold text-emerald-700">{p.perEmpCost}</p>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-normal">{p.description}</p>

                  <div className="space-y-2 pt-2 text-xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Included Features:</span>
                    {p.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-slate-700">
                        <Check className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    onClick={() =>
                      onSelectPlan(
                        p.name,
                        typeof p.annualPrice === 'number' ? `₹${p.annualPrice}/mo` : 'Custom Quote',
                        p.members
                      )
                    }
                    className={`w-full py-3 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${p.buttonBg}`}
                  >
                    <span>Subscribe to {p.name}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Feature Comparison Matrix CTA Trigger */}
        <div className="mt-12 text-center">
          <button
            onClick={onOpenPricingModal}
            className="inline-flex items-center gap-2 text-xs font-bold text-teal-800 hover:text-teal-950 bg-white border border-slate-200 px-5 py-2.5 rounded-full shadow-sm hover:border-teal-400 transition-all cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Compare Full Feature Matrix & Indian Statutory Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </section>
  )
}
