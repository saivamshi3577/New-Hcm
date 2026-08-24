import { useState, useEffect } from 'react'
import { LandingHeader } from '@/components/landing/LandingHeader'
import { HeroSection } from '@/components/landing/HeroSection'
import { ModulesShowcase } from '@/components/landing/ModulesShowcase'
import { StatutoryPayrollSection } from '@/components/landing/StatutoryPayrollSection'
import { SkillTrackWorkforceSection } from '@/components/landing/SkillTrackWorkforceSection'
import { RoiCalculatorSection } from '@/components/landing/RoiCalculatorSection'
import { PricingSection } from '@/components/landing/PricingSection'
import { SubscriptionModal } from '@/components/landing/SubscriptionModal'
import { TestimonialsSection } from '@/components/landing/TestimonialsSection'
import { FaqSection } from '@/components/landing/FaqSection'
import { CtaSection } from '@/components/landing/CtaSection'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Play, CheckCircle2 } from 'lucide-react'

export default function LandingPage() {
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false)
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState({ name: '100 Members Plan', price: '₹2,159/mo', members: '100' })

  // Ensure page title is set appropriately
  useEffect(() => {
    document.title = "FusionHRMS — #1 Budget-Friendly HRMS & Task Management Platform in India"
  }, [])

  const handleSelectPlan = (planName: string, price: string, members: string) => {
    setSelectedPlan({ name: planName, price, members })
    setIsPricingModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-white font-sans antialiased text-slate-900 selection:bg-teal-500 selection:text-white">
      {/* Navigation Header */}
      <LandingHeader onOpenPricingModal={() => setIsPricingModalOpen(true)} />

      {/* Hero Showcase Section with Native UI Dashboard Preview */}
      <HeroSection
        onOpenPricingModal={() => setIsPricingModalOpen(true)}
        onOpenDemoModal={() => setIsDemoModalOpen(true)}
      />

      {/* HRMS Core Modules Showcase (Task Management, Payroll, Employees, HR) */}
      <ModulesShowcase />

      {/* NEW SECTION 1: Indian Statutory Payroll & Tax Compliance Engine */}
      <StatutoryPayrollSection />

      {/* NEW SECTION 2: Skill Track, Appraisals & Performance Matrix */}
      <SkillTrackWorkforceSection />

      {/* Cost Savings & ROI Calculator */}
      <RoiCalculatorSection />

      {/* Subscription Plans (50, 100, 200 Members in INR ₹) */}
      <PricingSection
        onSelectPlan={handleSelectPlan}
        onOpenPricingModal={() => setIsPricingModalOpen(true)}
      />

      {/* Testimonials & Social Proof */}
      <TestimonialsSection />

      {/* FAQ Accordion */}
      <FaqSection />

      {/* High-Converting CTA Banner */}
      <CtaSection onOpenPricingModal={() => setIsPricingModalOpen(true)} />

      {/* Landing Page Footer */}
      <LandingFooter />

      {/* Interactive Subscription Feature Modal */}
      <SubscriptionModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        selectedPlanName={selectedPlan.name}
        selectedPlanPrice={selectedPlan.price}
      />

      {/* Product Tour Modal */}
      <Dialog open={isDemoModalOpen} onOpenChange={setIsDemoModalOpen}>
        <DialogContent className="max-w-3xl bg-white border-slate-200 text-slate-900 p-6 shadow-xl">
          <DialogHeader>
            <div className="flex items-center gap-2 text-teal-700 text-xs font-bold uppercase tracking-wider mb-1">
              <Play className="w-4 h-4 fill-current text-teal-600" /> Interactive Product Tour
            </div>
            <DialogTitle className="text-xl font-bold text-slate-900">
              FusionHRMS Walkthrough & Feature Tour
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600">
              Watch how FusionHRMS handles Task Kanban boards, 1-click Indian payroll, and employee records.
            </DialogDescription>
          </DialogHeader>

          <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video flex items-center justify-center my-3 group">
            <img
              src="/white_hrms_dashboard.jpg"
              alt="White Theme Dashboard Tour Preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-teal-600 to-indigo-600 text-white flex items-center justify-center shadow-lg mb-2.5 group-hover:scale-110 transition-transform">
                <Play className="w-7 h-7 fill-current ml-1" />
              </div>
              <h4 className="text-sm sm:text-base font-extrabold text-white">HR & Task Management Live Platform Tour</h4>
              <p className="text-xs text-slate-200 max-w-md mt-1">
                Explore the clean, intuitive interface that saves Indian organizations hours every week.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 text-xs">
            <span className="text-teal-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-teal-600" /> Ready to try it out?
            </span>
            <button
              onClick={() => {
                setIsDemoModalOpen(false)
                setIsPricingModalOpen(true)
              }}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold rounded-xl transition-all shadow-xs"
            >
              Check Subscription Plans (₹)
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
