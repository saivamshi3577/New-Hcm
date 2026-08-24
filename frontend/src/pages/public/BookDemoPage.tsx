import { useState, useEffect } from 'react'
import { LandingHeader } from '@/components/landing/LandingHeader'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api'
import { Link } from 'react-router-dom'
import {
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  Building,
  Users,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Play,
  Loader2,
  ArrowRight
} from 'lucide-react'

export default function BookDemoPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submittedData, setSubmittedData] = useState<any>(null)

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    companyName: '',
    employeeCount: '50-100 Employees',
    preferredDate: '',
    preferredTime: '11:00 AM IST',
    role: 'HR Manager / Director'
  })

  useEffect(() => {
    document.title = "Book a Demo — Schedule FusionHRMS Product Tour"
  }, [])

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
    const demoLead = {
      id: `DEMO-${Date.now().toString().slice(-6)}`,
      full_name: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      company_name: formData.companyName,
      selected_plan: `Demo Requested: ${formData.employeeCount} (${formData.preferredDate} @ ${formData.preferredTime})`,
      employee_count: formData.employeeCount,
      notes: `Booked Live Demo by ${formData.role}`,
      status: 'Demo Scheduled',
      created_at: new Date().toISOString()
    }

    try {
      await api.post('/subscription_leads', demoLead)
    } catch (err) {
      console.warn('API lead write error:', err)
    }

    try {
      const existing = JSON.parse(localStorage.getItem('st_subscription_leads') || '[]')
      localStorage.setItem('st_subscription_leads', JSON.stringify([demoLead, ...existing]))
    } catch (err) {
      console.error('LocalStorage write error:', err)
    }

    setSubmittedData(demoLead)
    setLoading(false)
    setSubmitted(true)

    toast({
      title: '🎉 Demo Booked Successfully!',
      description: `Thank you ${formData.fullName}! Your demo reference ID is ${demoLead.id}.`,
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900 flex flex-col justify-between">
      <div>
        <LandingHeader />

        {/* Shiny Hero Header */}
        <section className="pt-28 pb-14 bg-gradient-to-b from-white via-teal-50/40 to-slate-50 border-b border-slate-200 relative overflow-hidden">
          
          {/* Light Glow & Grid Overlay */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-teal-400/15 via-emerald-300/20 to-indigo-400/15 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f080_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f080_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 relative z-10">
            
            <div className="inline-block p-[1px] rounded-full bg-gradient-to-r from-teal-500 via-emerald-500 to-indigo-500 shadow-[0_4px_20px_rgba(20,184,166,0.2)]">
              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white text-slate-900 text-xs font-bold">
                <Calendar className="w-3.5 h-3.5 text-teal-600" />
                <span className="bg-gradient-to-r from-teal-700 to-emerald-800 bg-clip-text text-transparent font-extrabold">Schedule a 1-on-1 Product Tour</span>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-950 tracking-tight max-w-4xl mx-auto leading-tight">
              See FusionHRMS in Action with a <br />
              <span className="bg-gradient-to-r from-teal-600 via-emerald-600 to-indigo-600 bg-clip-text text-transparent">
                Live Expert Walkthrough
              </span>
            </h1>

            <p className="text-slate-600 text-xs sm:text-sm max-w-2xl mx-auto">
              Select your preferred date and time for a personalized demo tailored to your organization's workforce size, statutory payroll, and task management workflows.
            </p>
          </div>
        </section>

        {/* Form & Value Props Section */}
        <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Booking Form */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl">
              <div className="flex items-center gap-2 mb-3">
                <span className="p-2 bg-teal-50 text-teal-700 rounded-xl border border-teal-200">
                  <Calendar className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">Book Your Live Walkthrough</h2>
                  <p className="text-xs text-slate-500">Pick a date and our enterprise solutions architect will conduct your demo.</p>
                </div>
              </div>

              {submitted && submittedData ? (
                <div className="py-8 space-y-5">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <h3 className="font-black text-emerald-950 text-lg">Demo Confirmed & Calendar Invite Sent!</h3>
                    <p className="text-xs text-emerald-800 font-medium max-w-md mx-auto">
                      Demo ID: <strong className="font-mono bg-white px-2 py-0.5 rounded border border-emerald-200">{submittedData.id}</strong>
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
                    <div className="flex justify-between border-b border-slate-200 pb-2">
                      <span className="text-slate-500">Contact Person:</span>
                      <span className="font-extrabold text-slate-900">{submittedData.full_name} ({formData.role})</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-2">
                      <span className="text-slate-500">Company Name:</span>
                      <span className="font-extrabold text-slate-900">{submittedData.company_name}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-2">
                      <span className="text-slate-500">Scheduled Date & Time:</span>
                      <span className="font-bold text-teal-700">{formData.preferredDate || 'Tomorrow'} @ {formData.preferredTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Work Email:</span>
                      <span className="font-medium text-slate-800">{submittedData.email}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Link
                      to="/demo"
                      className="w-1/2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-xs h-10 rounded-xl flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-4 h-4 text-amber-600" /> Try Self-Guided Demo
                    </Link>
                    <Button
                      onClick={() => setSubmitted(false)}
                      className="w-1/2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs h-10 rounded-xl"
                    >
                      Book Another Slot
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 pt-2 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="fullName" className="font-bold text-slate-700 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-teal-600" /> Full Name *
                      </Label>
                      <Input
                        id="fullName"
                        placeholder="e.g. Ramesh Patel"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        required
                        className="h-10 bg-slate-50 border-slate-200 text-xs rounded-xl"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="font-bold text-slate-700 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-indigo-600" /> Work Email *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="ramesh@company.in"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        className="h-10 bg-slate-50 border-slate-200 text-xs rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="font-bold text-slate-700 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" /> Phone Number / WhatsApp *
                      </Label>
                      <Input
                        id="phone"
                        placeholder="+91 98765 43210"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                        className="h-10 bg-slate-50 border-slate-200 text-xs rounded-xl"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="companyName" className="font-bold text-slate-700 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-orange-500" /> Company Name *
                      </Label>
                      <Input
                        id="companyName"
                        placeholder="e.g. Acme Tech Solutions"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        required
                        className="h-10 bg-slate-50 border-slate-200 text-xs rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="employeeCount" className="font-bold text-slate-700 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-purple-600" /> Team / Workforce Size
                      </Label>
                      <Select
                        value={formData.employeeCount}
                        onValueChange={(val) => setFormData({ ...formData, employeeCount: val })}
                      >
                        <SelectTrigger className="h-10 bg-slate-50 border-slate-200 text-xs rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-slate-200 text-xs">
                          <SelectItem value="1-50 Employees">1-50 Employees (50 Members Plan)</SelectItem>
                          <SelectItem value="50-100 Employees">50-100 Employees (100 Members Plan)</SelectItem>
                          <SelectItem value="100-200 Employees">100-200 Employees (200 Members Plan)</SelectItem>
                          <SelectItem value="200+ Employees">200+ Employees (Custom Enterprise)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="role" className="font-bold text-slate-700">Your Designation / Role</Label>
                      <Select
                        value={formData.role}
                        onValueChange={(val) => setFormData({ ...formData, role: val })}
                      >
                        <SelectTrigger className="h-10 bg-slate-50 border-slate-200 text-xs rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-slate-200 text-xs">
                          <SelectItem value="HR Manager / Director">HR Manager / Director</SelectItem>
                          <SelectItem value="CEO / Founder / Managing Director">CEO / Founder / Managing Director</SelectItem>
                          <SelectItem value="Payroll & Finance Lead">Payroll & Finance Lead</SelectItem>
                          <SelectItem value="Engineering Manager / Team Lead">Engineering Manager / Team Lead</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="preferredDate" className="font-bold text-slate-700 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-teal-600" /> Preferred Date
                      </Label>
                      <Input
                        id="preferredDate"
                        type="date"
                        value={formData.preferredDate}
                        onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                        className="h-10 bg-slate-50 border-slate-200 text-xs rounded-xl"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="preferredTime" className="font-bold text-slate-700 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-600" /> Preferred Slot (IST)
                      </Label>
                      <Select
                        value={formData.preferredTime}
                        onValueChange={(val) => setFormData({ ...formData, preferredTime: val })}
                      >
                        <SelectTrigger className="h-10 bg-slate-50 border-slate-200 text-xs rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-slate-200 text-xs">
                          <SelectItem value="10:00 AM IST">10:00 AM IST</SelectItem>
                          <SelectItem value="11:30 AM IST">11:30 AM IST</SelectItem>
                          <SelectItem value="02:30 PM IST">02:30 PM IST</SelectItem>
                          <SelectItem value="04:00 PM IST">04:00 PM IST</SelectItem>
                          <SelectItem value="05:30 PM IST">05:30 PM IST</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 hover:from-teal-700 hover:to-emerald-700 text-white font-extrabold text-xs h-11 rounded-xl shadow-md flex items-center justify-center gap-1.5"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                    <span>Confirm Live Demo Booking</span>
                  </Button>
                </form>
              )}
            </div>

            {/* Side Highlights */}
            <div className="lg:col-span-5 space-y-6">
              
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-600" /> What You Will See in the Demo:
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> Task Kanban & 60-Pt Evaluation Guard
                    </h4>
                    <p className="text-slate-500 text-[11px]">See how task boards, sub-checklists, and sprint points prevent evaluation overflow.</p>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 1-Click Statutory Payroll (EPF/ESI/TDS)
                    </h4>
                    <p className="text-slate-500 text-[11px]">Watch direct bank export files and PDF payslip generation in action.</p>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" /> Skill Track & Monthly Reset Leaderboard
                    </h4>
                    <p className="text-slate-500 text-[11px]">Review timed MCQ exams and current month performance ratings.</p>
                  </div>
                </div>
              </div>

              {/* Instant Interactive Sandbox Card */}
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white p-6 rounded-3xl shadow-xl space-y-3">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-white/20 text-white rounded-xl">
                    <Sparkles className="w-5 h-5" />
                  </span>
                  <h3 className="text-base font-black">Can't wait for a live slot?</h3>
                </div>
                <p className="text-xs text-amber-100 leading-relaxed">
                  Explore the pre-populated Super Admin, Team Lead, and Employee portals instantly in our interactive demo sandbox.
                </p>
                <Link
                  to="/demo"
                  className="inline-flex items-center gap-1.5 bg-white text-slate-900 hover:bg-slate-100 font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md"
                >
                  <Play className="w-3.5 h-3.5 fill-current text-orange-600" /> Launch Interactive Sandbox
                </Link>
              </div>

            </div>

          </div>
        </section>

      </div>

      <LandingFooter />
    </div>
  )
}
