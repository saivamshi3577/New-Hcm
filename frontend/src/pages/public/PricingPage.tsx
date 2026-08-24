import { useState, useEffect } from 'react'
import { LandingHeader } from '@/components/landing/LandingHeader'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { PricingSection } from '@/components/landing/PricingSection'
import { RoiCalculatorSection } from '@/components/landing/RoiCalculatorSection'
import { SubscriptionRequestModal } from '@/components/subscription/SubscriptionRequestModal'
import { SubscriptionModal } from '@/components/landing/SubscriptionModal'
import { ShieldCheck, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react'

export default function PricingPage() {
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)
  const [isMatrixModalOpen, setIsMatrixModalOpen] = useState(false)
  const [selectedPlanName, setSelectedPlanName] = useState('100 Members (₹2,699/mo)')

  useEffect(() => {
    document.title = "FusionHRMS Pricing — Low Cost HRMS Subscription Plans in Indian Rupees (₹)"
  }, [])

  const handleSelectPlan = (planName: string, price: string, _members?: string) => {
    setSelectedPlanName(`${planName} (${price})`)
    setIsRequestModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900 flex flex-col justify-between">
      <div>
        <LandingHeader />

        {/* Shiny Hero Header Banner */}
        <section className="pt-28 pb-14 bg-gradient-to-b from-white via-teal-50/40 to-slate-50 border-b border-slate-200 relative overflow-hidden">
          
          {/* Light Glow & Grid Overlay */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-teal-400/15 via-emerald-300/20 to-indigo-400/15 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f080_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f080_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 relative z-10">
            
            <div className="inline-block p-[1px] rounded-full bg-gradient-to-r from-teal-500 via-emerald-500 to-indigo-500 shadow-[0_4px_20px_rgba(20,184,166,0.2)]">
              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white text-slate-900 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span className="bg-gradient-to-r from-teal-700 to-emerald-800 bg-clip-text text-transparent font-extrabold">Transparent Subscription Pricing in INR (₹)</span>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-950 tracking-tight max-w-4xl mx-auto leading-tight">
              India's Most Affordable <br />
              <span className="bg-gradient-to-r from-teal-600 via-emerald-600 to-indigo-600 bg-clip-text text-transparent">
                Enterprise HRMS Suite
              </span>
            </h1>

            <p className="text-slate-600 text-xs sm:text-sm max-w-2xl mx-auto">
              No hidden fees, no per-module add-on charges. Choose between 50, 100, or 200 member plans with full access to Task Management, Statutory Payroll, EMS, and Skill Track.
            </p>
          </div>
        </section>

        {/* Pricing Cards Section */}
        <div className="py-8">
          <PricingSection
            onSelectPlan={handleSelectPlan}
            onOpenPricingModal={() => setIsMatrixModalOpen(true)}
          />
        </div>

        {/* ROI Calculator Section */}
        <div className="bg-white py-12 border-t border-b border-slate-200">
          <RoiCalculatorSection />
        </div>

      </div>

      {/* Subscription Lead Purchase Request Modal */}
      <SubscriptionRequestModal
        open={isRequestModalOpen}
        onOpenChange={setIsRequestModalOpen}
        defaultPlan={selectedPlanName}
      />

      {/* Feature Matrix Modal */}
      <SubscriptionModal
        isOpen={isMatrixModalOpen}
        onClose={() => setIsMatrixModalOpen(false)}
        selectedPlanName={selectedPlanName}
      />

      <LandingFooter />
    </div>
  )
}
