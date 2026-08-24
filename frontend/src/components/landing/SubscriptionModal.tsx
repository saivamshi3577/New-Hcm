import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Sparkles, Check, X, Send, CheckCircle2 } from 'lucide-react'
import { api } from '@/lib/api'

interface SubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  selectedPlanName?: string
  selectedPlanPrice?: string
}

export function SubscriptionModal({
  isOpen,
  onClose,
  selectedPlanName = '100 Members Plan',
  selectedPlanPrice = '₹2,159/mo',
}: SubscriptionModalProps) {
  const [activeTab, setActiveTab] = useState<'matrix' | 'form'>('matrix')
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    employeeCount: '100',
    plan: selectedPlanName,
  })

  const featureMatrix = [
    { feature: 'Maximum Active Employee Seats', p50: '50 Members', p100: '100 Members', p200: '200 Members', pEnt: '200+ Unlimited' },
    { feature: 'Task Kanban & Sprint Boards', p50: true, p100: true, p200: true, pEnt: true },
    { feature: 'Sub-Task Checklists & Dependencies', p50: 'Basic', p100: 'Advanced', p200: 'Unlimited', pEnt: 'Custom' },
    { feature: 'Automated Indian Payroll (PF, ESI, TDS)', p50: true, p100: true, p200: true, pEnt: true },
    { feature: '1-Click Downloadable Payslips (PDF)', p50: true, p100: true, p200: true, pEnt: true },
    { feature: 'Direct Bank Transfer Export (NEFT/RTGS)', p50: false, p100: true, p200: true, pEnt: true },
    { feature: 'Skill Track & Appraisal Matrices', p50: 'Standard', p100: 'Full Suite', p200: 'Full Suite', pEnt: 'Custom Rules' },
    { feature: 'Audit Log Trail & Activity Monitoring', p50: '7 Days', p100: '90 Days', p200: '365 Days', pEnt: 'Unlimited' },
    { feature: 'Encrypted Document Vault Storage', p50: '5 GB', p100: '20 GB', p200: '50 GB', pEnt: 'Custom' },
    { feature: 'Support SLA', p50: 'Email (24h)', p100: 'Phone & Chat (4h)', p200: 'Priority (1h)', pEnt: 'Dedicated Executive' },
    { feature: 'Monthly Price (Billed Annually)', p50: '₹1,199 /mo', p100: '₹2,159 /mo', p200: '₹3,839 /mo', pEnt: 'Custom Quote' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormSubmitted(true)

    const newLead = {
      id: `LEAD-${Date.now().toString().slice(-6)}`,
      full_name: formData.contactName || 'Valued Client',
      email: formData.email,
      phone: formData.phone || '+91 98000 00000',
      company_name: formData.companyName || 'Enterprise Client',
      selected_plan: formData.plan || selectedPlanName,
      employee_count: `${formData.employeeCount} Employees`,
      status: 'New Pending',
      created_at: new Date().toISOString()
    }

    try {
      await api.post('/subscription_leads', newLead)
    } catch (err) {
      console.warn('API insert warning:', err)
    }

    try {
      const existing = JSON.parse(localStorage.getItem('st_subscription_leads') || '[]')
      localStorage.setItem('st_subscription_leads', JSON.stringify([newLead, ...existing]))
    } catch (err) {
      console.error('LocalStorage write error:', err)
    }

    setTimeout(() => {
      setFormSubmitted(false)
      onClose()
    }, 2500)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border-slate-200 text-slate-900 p-6 sm:p-8 shadow-xl">
        <DialogHeader className="pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2 text-teal-700 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-teal-600" /> FusionHRMS Subscription Details & Feature Matrix
          </div>
          <DialogTitle className="text-xl font-extrabold text-slate-900">
            Subscription Features & Enterprise Specifications
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-600">
            Compare plans in detail or request instant workspace activation for {selectedPlanName} ({selectedPlanPrice}) in Indian Rupees (₹).
          </DialogDescription>
        </DialogHeader>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-slate-200 my-3 space-x-4">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`pb-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all ${
              activeTab === 'matrix'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Feature Comparison Matrix
          </button>
          <button
            onClick={() => setActiveTab('form')}
            className={`pb-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all ${
              activeTab === 'form'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Request Instant Setup / Invoice (₹)
          </button>
        </div>

        {/* Tab 1: Side-by-Side Matrix */}
        {activeTab === 'matrix' && (
          <div className="space-y-4">
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-800 border-b border-slate-200">
                  <tr>
                    <th className="p-2.5 font-bold">Feature / Module</th>
                    <th className="p-2.5 font-bold text-slate-800">50 Members</th>
                    <th className="p-2.5 font-bold text-teal-800 bg-teal-50">100 Members ★</th>
                    <th className="p-2.5 font-bold text-slate-800">200 Members</th>
                    <th className="p-2.5 font-bold text-slate-600">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {featureMatrix.map((row, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                      <td className="p-2.5 font-semibold text-slate-800">{row.feature}</td>
                      
                      {/* 50 Members */}
                      <td className="p-2.5 text-slate-700">
                        {typeof row.p50 === 'boolean' ? (
                          row.p50 ? <Check className="w-4 h-4 text-teal-600" /> : <X className="w-4 h-4 text-rose-500" />
                        ) : (
                          row.p50
                        )}
                      </td>

                      {/* 100 Members (Featured) */}
                      <td className="p-2.5 font-bold text-slate-900 bg-teal-50/50">
                        {typeof row.p100 === 'boolean' ? (
                          row.p100 ? <Check className="w-4 h-4 text-teal-600" /> : <X className="w-4 h-4 text-rose-500" />
                        ) : (
                          row.p100
                        )}
                      </td>

                      {/* 200 Members */}
                      <td className="p-2.5 text-slate-700">
                        {typeof row.p200 === 'boolean' ? (
                          row.p200 ? <Check className="w-4 h-4 text-teal-600" /> : <X className="w-4 h-4 text-rose-500" />
                        ) : (
                          row.p200
                        )}
                      </td>

                      {/* Enterprise */}
                      <td className="p-2.5 text-slate-500">
                        {typeof row.pEnt === 'boolean' ? (
                          row.pEnt ? <Check className="w-4 h-4 text-teal-600" /> : <X className="w-4 h-4 text-rose-500" />
                        ) : (
                          row.pEnt
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <p className="text-xs font-bold text-slate-900">Ready to activate your subscription?</p>
                <p className="text-[11px] text-slate-500">Instant setup in INR ₹ with GST invoice provided.</p>
              </div>
              <button
                onClick={() => setActiveTab('form')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs shadow-xs"
              >
                Proceed to Setup Form →
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Subscription Request Form */}
        {activeTab === 'form' && (
          <div className="space-y-4">
            {formSubmitted ? (
              <div className="p-6 text-center bg-teal-50 border border-teal-200 rounded-xl space-y-2">
                <CheckCircle2 className="w-10 h-10 text-teal-600 mx-auto animate-bounce" />
                <h4 className="text-lg font-bold text-slate-900">Subscription Request Submitted!</h4>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Thank you! Our HR Solutions Specialist will reach out to <strong>{formData.email}</strong> within 15 minutes to configure your workspace for {formData.plan}.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Company / Organization Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Acme Technologies India"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">HR / Admin Contact Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rajesh Sharma"
                      value={formData.contactName}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Official Work Email</label>
                    <input
                      type="email"
                      required
                      placeholder="rajesh@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Phone / WhatsApp Number (+91)</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Selected Plan</label>
                    <select
                      value={formData.plan}
                      onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 focus:border-teal-500 focus:outline-none"
                    >
                      <option value="50 Members Plan">50 Members Plan (₹1,499/mo)</option>
                      <option value="100 Members Plan">100 Members Plan (₹2,699/mo)</option>
                      <option value="200 Members Plan">200 Members Plan (₹4,799/mo)</option>
                      <option value="200+ Enterprise Plan">200+ Enterprise Custom Quote</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Approximate Employee Count</label>
                    <input
                      type="number"
                      placeholder="e.g. 45"
                      value={formData.employeeCount}
                      onChange={(e) => setFormData({ ...formData, employeeCount: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600">
                  <span className="text-teal-700 font-bold">🇮🇳 Indian Billing:</span> GST Invoice with 18% ITC claim will be provided upon workspace activation. Payment accepts UPI, NetBanking, Corporate Credit Card, or Bank Transfer.
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold rounded-xl text-xs shadow-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Subscription Setup Request</span>
                </button>
              </form>
            )}
          </div>
        )}

      </DialogContent>
    </Dialog>
  )
}
