import { useState } from 'react'
import { ChevronDown, HelpCircle } from 'lucide-react'

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const faqs = [
    {
      q: 'Why is FusionHRMS so budget-friendly compared to traditional HR tools?',
      a: 'We believe core workforce and payroll tools should be accessible to all businesses. By engineering a high-efficiency serverless architecture and eliminating bloated corporate markup, we pass up to 70% cost savings directly to Indian businesses.',
    },
    {
      q: 'Is the Payroll module 100% compliant with Indian Statutory Laws?',
      a: 'Yes! FusionHRMS automatically calculates Provident Fund (EPF/EPS), Employee State Insurance (ESI), Professional Tax (PT across all Indian states), and TDS (Income Tax deductions). It also exports digital payslips and bank transfer files in 1 click.',
    },
    {
      q: 'Can we upgrade our subscription from 50 to 100 or 200 members as our company grows?',
      a: 'Absolutely. You can scale your plan anytime with 1-click upgrade. Prorated adjustments are applied automatically in Indian Rupees (₹).',
    },
    {
      q: 'Are Task Management & Kanban Boards included in all plans?',
      a: 'Yes! Every subscription plan (50, 100, 200 Members) includes our complete Task Management System (TMS) with Kanban views, sub-task tree, role-based assignments, and activity tracking.',
    },
    {
      q: 'How fast can we onboard our company and employees onto FusionHRMS?',
      a: 'Most companies complete setup within 10 to 15 minutes! You can upload employee records and salary structures in bulk using standard Excel / CSV templates.',
    },
    {
      q: 'Do you provide GST tax invoices for Indian companies?',
      a: 'Yes, full 18% GST tax invoices with input tax credit (ITC) eligibility are generated automatically for every subscription billing cycle.',
    },
  ]

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section id="faq" className="py-14 md:py-16 bg-slate-50/70 text-slate-900 border-b border-slate-200">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-teal-200 text-teal-800 text-xs font-bold uppercase tracking-wider mb-3 shadow-2xs">
            <HelpCircle className="w-3.5 h-3.5 text-teal-600" /> Frequently Asked Questions
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            Got Questions? We Have Answers.
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Everything you need to know about FusionHRMS subscription plans, modules, and setup in India.
          </p>
        </div>

        <div className="space-y-2.5">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx
            return (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 text-left flex items-center justify-between font-bold text-xs sm:text-sm text-slate-900 hover:text-teal-700 focus:outline-none"
                >
                  <span className="pr-3">{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-teal-600' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-2.5">
                    {faq.a}
                  </div>
                )}
              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
