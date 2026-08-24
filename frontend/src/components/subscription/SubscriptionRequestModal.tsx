import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api'
import { CheckCircle2, ShieldCheck, Sparkles, Building, Mail, Phone, User, Users, DollarSign, Loader2 } from 'lucide-react'

interface SubscriptionRequestModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultPlan?: string
}

export function SubscriptionRequestModal({ open, onOpenChange, defaultPlan = '100 Members (₹2,699/mo)' }: SubscriptionRequestModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submittedData, setSubmittedData] = useState<any>(null)

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    companyName: '',
    plan: defaultPlan,
    employeeCount: '50-100 Employees',
    notes: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.fullName || !formData.email || !formData.phone || !formData.companyName) {
      toast({
        title: 'Missing Required Fields',
        description: 'Please fill in your name, work email, phone, and company name.',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    const newLead = {
      id: `LEAD-${Date.now().toString().slice(-6)}`,
      full_name: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      company_name: formData.companyName,
      selected_plan: formData.plan,
      employee_count: formData.employeeCount,
      notes: formData.notes,
      status: 'New Pending',
      created_at: new Date().toISOString()
    }

    try {
      // 1. Attempt database save to API
      await api.post('/subscription_leads', newLead)
    } catch (err) {
      console.warn('Error saving lead to API, falling back to localStorage:', err)
    }

    // 2. LocalStorage Fallback so Super Admin can always visualize leads instantly
    try {
      const existing = JSON.parse(localStorage.getItem('st_subscription_leads') || '[]')
      localStorage.setItem('st_subscription_leads', JSON.stringify([newLead, ...existing]))
    } catch (err) {
      console.error('LocalStorage write error:', err)
    }

    setSubmittedData(newLead)
    setSubmitted(true)
    setLoading(false)

    toast({
      title: '🎉 Subscription Request Received!',
      description: `Thank you ${formData.fullName}! Your Lead Reference ID is ${newLead.id}.`,
    })
  }

  const handleReset = () => {
    setSubmitted(false)
    setSubmittedData(null)
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      companyName: '',
      plan: defaultPlan,
      employeeCount: '50-100 Employees',
      notes: ''
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white border-slate-200 text-slate-900 rounded-2xl p-6 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-teal-50 text-teal-700 rounded-xl border border-teal-200">
              <Sparkles className="w-4 h-4" />
            </span>
            <DialogTitle className="text-lg font-black text-slate-900 tracking-tight">
              {submitted ? 'Subscription Request Submitted' : 'Subscribe to FusionHRMS'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-500">
            {submitted 
              ? 'Our enterprise onboarding team will contact you within 2 business hours.' 
              : 'Fill out your organization details below to activate your enterprise subscription.'}
          </DialogDescription>
        </DialogHeader>

        {submitted && submittedData ? (
          <div className="space-y-4 pt-2">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-black text-emerald-950 text-sm">Request Verified & Queued!</h4>
              <p className="text-xs text-emerald-800 font-medium">
                Reference ID: <strong className="font-mono bg-white px-2 py-0.5 rounded border border-emerald-200">{submittedData.id}</strong>
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500">Organization:</span>
                <span className="font-bold text-slate-900">{submittedData.company_name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500">Selected Plan:</span>
                <span className="font-bold text-teal-700">{submittedData.selected_plan}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500">Work Email:</span>
                <span className="font-medium text-slate-800">{submittedData.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phone / WhatsApp:</span>
                <span className="font-medium text-slate-800">{submittedData.phone}</span>
              </div>
            </div>

            <Button
              onClick={handleReset}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs h-10 rounded-xl"
            >
              Done & Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 pt-1 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="font-bold text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-teal-600" /> Full Name *
              </Label>
              <Input
                id="fullName"
                placeholder="e.g. Rajesh Kumar"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
                className="h-9 bg-slate-50 border-slate-200 text-xs rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-600" /> Work Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.in"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="h-9 bg-slate-50 border-slate-200 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" /> Phone Number *
                </Label>
                <Input
                  id="phone"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="h-9 bg-slate-50 border-slate-200 text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="companyName" className="font-bold text-slate-700 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-orange-500" /> Company / Organization Name *
              </Label>
              <Input
                id="companyName"
                placeholder="e.g. TechFusion Pvt Ltd"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                required
                className="h-9 bg-slate-50 border-slate-200 text-xs rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="plan" className="font-bold text-slate-700 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-teal-600" /> Selected Subscription Plan
                </Label>
                <Select
                  value={formData.plan}
                  onValueChange={(val) => setFormData({ ...formData, plan: val })}
                >
                  <SelectTrigger className="h-9 bg-slate-50 border-slate-200 text-xs rounded-xl">
                    <SelectValue placeholder="Select Plan" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-900 text-xs">
                    <SelectItem value="50 Members (₹1,499/mo)">50 Members (₹1,499/mo)</SelectItem>
                    <SelectItem value="100 Members (₹2,699/mo)">100 Members (₹2,699/mo)</SelectItem>
                    <SelectItem value="200 Members (₹4,799/mo)">200 Members (₹4,799/mo)</SelectItem>
                    <SelectItem value="Custom Enterprise Plan">Custom Enterprise Plan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="employeeCount" className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-purple-600" /> Team Size
                </Label>
                <Select
                  value={formData.employeeCount}
                  onValueChange={(val) => setFormData({ ...formData, employeeCount: val })}
                >
                  <SelectTrigger className="h-9 bg-slate-50 border-slate-200 text-xs rounded-xl">
                    <SelectValue placeholder="Select Size" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-900 text-xs">
                    <SelectItem value="1-50 Employees">1-50 Employees</SelectItem>
                    <SelectItem value="50-100 Employees">50-100 Employees</SelectItem>
                    <SelectItem value="100-200 Employees">100-200 Employees</SelectItem>
                    <SelectItem value="200+ Employees">200+ Employees</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-1/3 border-slate-200 text-slate-700 text-xs h-10 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="w-2/3 bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 hover:from-teal-700 hover:to-emerald-700 text-white font-extrabold text-xs h-10 rounded-xl shadow-md flex items-center justify-center gap-1.5"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                <span>Submit Subscription Request</span>
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
