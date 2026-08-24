import { useState } from 'react'
import { Calculator, TrendingDown, ArrowRight, Check, Sparkles } from 'lucide-react'

export function RoiCalculatorSection() {
  const [employeeCount, setEmployeeCount] = useState<number>(100)

  // Pricing math in INR ₹
  const legacyPerEmpMonth = 120 // Traditional HRMS average cost per employee per month
  const legacyMonthlyCost = employeeCount * legacyPerEmpMonth
  const legacyAnnualCost = legacyMonthlyCost * 12

  // FusionHRMS tiered pricing estimate
  let fusionMonthlyCost = 2699
  if (employeeCount <= 50) {
    fusionMonthlyCost = 1499
  } else if (employeeCount <= 100) {
    fusionMonthlyCost = 2699
  } else if (employeeCount <= 200) {
    fusionMonthlyCost = 4799
  } else {
    fusionMonthlyCost = 4799 + Math.round((employeeCount - 200) * 22)
  }

  const fusionAnnualCost = fusionMonthlyCost * 12
  const monthlySavings = Math.max(0, legacyMonthlyCost - fusionMonthlyCost)
  const annualSavings = Math.max(0, legacyAnnualCost - fusionAnnualCost)
  const savingsPercent = Math.round((monthlySavings / legacyMonthlyCost) * 100)

  return (
    <section id="roi" className="py-14 md:py-16 bg-white text-slate-900 border-b border-slate-200 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold uppercase tracking-wider mb-3 shadow-2xs">
            <Calculator className="w-3.5 h-3.5 text-teal-600" /> Interactive Cost Savings Calculator
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            Why Pay 4x More for HRMS? Compare & Calculate Your Savings
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            See how much your organization saves every month by switching to FusionHRMS without sacrificing a single enterprise feature.
          </p>
        </div>

        {/* Calculator Card */}
        <div className="max-w-3xl mx-auto bg-slate-50/80 border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="space-y-6">
            
            {/* Interactive Slider */}
            <div>
              <div className="flex justify-between items-center mb-2.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Select Team Size / Employee Count:
                </label>
                <span className="text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-700 via-indigo-700 to-orange-600">
                  {employeeCount} Members
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="500"
                step="5"
                value={employeeCount}
                onChange={(e) => setEmployeeCount(Number(e.target.value))}
                className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
              <div className="flex justify-between text-[11px] text-slate-500 mt-1.5 font-mono">
                <span>10 Members</span>
                <span>50 Members</span>
                <span>100 Members</span>
                <span>200 Members</span>
                <span>500 Members</span>
              </div>
            </div>

            {/* Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              
              {/* Traditional HRMS */}
              <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-4 relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">Traditional HRMS</span>
                  <span className="text-[10px] text-slate-500">Zoho / Keka / Darwinbox</span>
                </div>
                <p className="text-[11px] text-slate-600 mb-1">Estimated Monthly Cost (~₹120/emp):</p>
                <p className="text-xl sm:text-2xl font-extrabold text-rose-700 line-through">
                  ₹{legacyMonthlyCost.toLocaleString('en-IN')}<span className="text-xs text-slate-500 font-normal"> /mo</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Annual Cost: ₹{legacyAnnualCost.toLocaleString('en-IN')} + heavy setup fees
                </p>
              </div>

              {/* FusionHRMS */}
              <div className="bg-teal-50/70 border-2 border-teal-500 rounded-xl p-4 relative shadow-2xs">
                <div className="absolute -top-3 right-4 bg-orange-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                  Lowest Cost Guarantee
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-teal-900 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-teal-600" /> FusionHRMS
                  </span>
                  <span className="text-[10px] text-orange-600 font-bold">Unbeatable Price</span>
                </div>
                <p className="text-[11px] text-teal-900 mb-1">Your Total Monthly Subscription:</p>
                <p className="text-2xl sm:text-3xl font-black text-slate-900">
                  ₹{fusionMonthlyCost.toLocaleString('en-IN')}<span className="text-xs text-teal-800 font-medium"> /mo</span>
                </p>
                <p className="text-[11px] text-teal-800 mt-1 font-medium">
                  Annual Cost: ₹{fusionAnnualCost.toLocaleString('en-IN')} (Zero hidden charges)
                </p>
              </div>

            </div>

            {/* Total Annual Savings Banner */}
            <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-white/20 text-white rounded-xl">
                  <TrendingDown className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-amber-100 uppercase tracking-wider">Your Organization Saves</p>
                  <p className="text-xl sm:text-2xl font-black text-white">
                    Save ₹{annualSavings.toLocaleString('en-IN')} <span className="text-amber-100 text-base font-extrabold">({savingsPercent}% Off)</span>
                  </p>
                  <p className="text-[11px] text-white/90">Every year added back into your company's growth budget</p>
                </div>
              </div>

              <a
                href="#pricing"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition-all shadow-xs text-center flex items-center justify-center gap-1.5 shrink-0"
              >
                <span>Lock In This Rate</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Guarantee points */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-200">
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-teal-600" /> ₹0 Implementation Fee
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-600" /> Free Excel/CSV Data Imports
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-orange-500" /> Cancel or Upgrade Anytime
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  )
}
