import { useState, useEffect } from 'react'
import { LandingHeader } from '@/components/landing/LandingHeader'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api'
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Building,
  Send,
  MessageSquare,
  CheckCircle2,
  HelpCircle,
  Loader2,
  Globe,
  ExternalLink
} from 'lucide-react'

const InstagramIcon = (props: any) => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
)

const LinkedinIcon = (props: any) => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
    <rect x="2" y="9" width="4" height="12"></rect>
    <circle cx="4" cy="4" r="2"></circle>
  </svg>
)

export default function ContactUsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    companyName: '',
    inquiryType: 'Enterprise Sales',
    message: ''
  })

  useEffect(() => {
    document.title = "Contact Us — FusionHRMS Enterprise Sales & Support India"
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.fullName || !formData.email || !formData.phone) {
      toast({
        title: 'Missing Required Fields',
        description: 'Please fill in your name, work email, and phone number.',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    const newContactLead = {
      id: `INQ-${Date.now().toString().slice(-6)}`,
      full_name: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      company_name: formData.companyName || 'N/A',
      selected_plan: `Inquiry: ${formData.inquiryType}`,
      employee_count: 'Contact Form Inquiry',
      notes: formData.message,
      status: 'New Pending',
      created_at: new Date().toISOString()
    }

    try {
      await api.post('/subscription_leads', newContactLead)
    } catch (err) {
      console.warn('API lead write error:', err)
    }

    try {
      const existing = JSON.parse(localStorage.getItem('st_subscription_leads') || '[]')
      localStorage.setItem('st_subscription_leads', JSON.stringify([newContactLead, ...existing]))
    } catch (err) {
      console.error('LocalStorage write error:', err)
    }

    setLoading(false)
    setSubmitted(true)
    toast({
      title: 'Message Sent Successfully!',
      description: `Thank you ${formData.fullName}! Your inquiry reference ID is ${newContactLead.id}.`,
    })
  }

  const headquarters = {
    city: 'Hyderabad Headquarters (Fusion EvalX AI)',
    address: '4th Floor, YS Rao Tower, Plot No. 7, Sri Rama Colony, Kavuri Hills, Madhapur, Telangana 500081',
    phone: '+91 89777 21462',
    phoneRaw: '8977721462',
    email: 'info@fusionevalx.ai',
    instagram: 'https://www.instagram.com/fusionevalx?igsh=b2Uxd2x2dnhjOGpz',
    linkedin: 'https://www.linkedin.com/company/fusioneval-ai'
  }

  const faqs = [
    {
      q: 'How quickly does FusionHRMS respond to sales & deployment inquiries?',
      a: 'Our dedicated enterprise onboarding team contacts every inquiry within 2 business hours between 9:00 AM and 7:00 PM IST.'
    },
    {
      q: 'Can we schedule a custom 1-on-1 demo for our executive board?',
      a: 'Yes! You can either use our Book a Demo page or request a customized product walkthrough tailored to your team size.'
    },
    {
      q: 'Is Indian Statutory Payroll setup supported out of the box?',
      a: 'Yes, FusionHRMS comes with pre-configured rules for EPF, ESI, Professional Tax (PT), and TDS withholding across all Indian states.'
    }
  ]

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900 flex flex-col justify-between">
      <div>
        <LandingHeader />

        {/* Shiny Hero Banner */}
        <section className="pt-28 pb-14 bg-gradient-to-b from-white via-teal-50/40 to-slate-50 border-b border-slate-200 relative overflow-hidden">
          
          {/* Light Glow & Grid Overlay */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-teal-400/15 via-emerald-300/20 to-indigo-400/15 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f080_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f080_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 relative z-10">
            
            <div className="inline-block p-[1px] rounded-full bg-gradient-to-r from-teal-500 via-emerald-500 to-indigo-500 shadow-[0_4px_20px_rgba(20,184,166,0.2)]">
              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white text-slate-900 text-xs font-bold">
                <Phone className="w-3.5 h-3.5 text-teal-600" />
                <span className="bg-gradient-to-r from-teal-700 to-emerald-800 bg-clip-text text-transparent font-extrabold">Enterprise Contact & Onboarding Assistance</span>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-950 tracking-tight max-w-4xl mx-auto leading-tight">
              Get in Touch with <br />
              <span className="bg-gradient-to-r from-teal-600 via-emerald-600 to-indigo-600 bg-clip-text text-transparent">
                FusionHRMS Experts
              </span>
            </h1>

            <p className="text-slate-600 text-xs sm:text-sm max-w-2xl mx-auto">
              Have questions about subscription plans, Indian statutory payroll compliance, or custom migration? Our sales and customer success team is here to assist.
            </p>
          </div>
        </section>

        {/* Main Form & Contact Info Section */}
        <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Contact Form */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="p-2 bg-teal-50 text-teal-700 rounded-xl border border-teal-200">
                  <MessageSquare className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">Send Us a Direct Message</h2>
                  <p className="text-xs text-slate-500">Fill out the form below and we will get back to you promptly.</p>
                </div>
              </div>

              {submitted ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Message Received!</h3>
                  <p className="text-xs text-slate-600 max-w-md mx-auto">
                    Thank you, <strong>{formData.fullName}</strong>. An enterprise onboarding specialist will call or email you shortly.
                  </p>
                  <Button
                    onClick={() => { setSubmitted(false); setFormData({ fullName: '', email: '', phone: '', companyName: '', inquiryType: 'Enterprise Sales', message: '' }) }}
                    className="bg-slate-900 text-white text-xs font-bold px-6 py-2 rounded-xl"
                  >
                    Send Another Inquiry
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 pt-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="fullName" className="font-bold text-slate-700">Full Name *</Label>
                      <Input
                        id="fullName"
                        placeholder="e.g. Ananya Sharma"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        required
                        className="h-10 bg-slate-50 border-slate-200 text-xs rounded-xl"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="font-bold text-slate-700">Work Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="ananya@company.in"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        className="h-10 bg-slate-50 border-slate-200 text-xs rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="font-bold text-slate-700">Phone Number / WhatsApp *</Label>
                      <Input
                        id="phone"
                        placeholder="+91 89777 21462"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                        className="h-10 bg-slate-50 border-slate-200 text-xs rounded-xl"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="companyName" className="font-bold text-slate-700">Company Name</Label>
                      <Input
                        id="companyName"
                        placeholder="e.g. Fusion Dynamics Pvt Ltd"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        className="h-10 bg-slate-50 border-slate-200 text-xs rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="inquiryType" className="font-bold text-slate-700">Inquiry Type</Label>
                    <Select
                      value={formData.inquiryType}
                      onValueChange={(val) => setFormData({ ...formData, inquiryType: val })}
                    >
                      <SelectTrigger className="h-10 bg-slate-50 border-slate-200 text-xs rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 text-xs">
                        <SelectItem value="Enterprise Sales">Enterprise Sales & Subscription Inquiry</SelectItem>
                        <SelectItem value="Indian Statutory Payroll">Indian Statutory Payroll & EPF Compliance</SelectItem>
                        <SelectItem value="Custom Demo Request">Custom Boardroom Demo Request</SelectItem>
                        <SelectItem value="Customer Support">Technical Customer Support</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="message" className="font-bold text-slate-700">Message / Additional Details</Label>
                    <textarea
                      id="message"
                      rows={4}
                      placeholder="Tell us about your workforce size and specific HRMS/TMS requirements..."
                      value={formData.message}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 hover:from-teal-700 hover:to-emerald-700 text-white font-extrabold text-xs h-11 rounded-xl shadow-md flex items-center justify-center gap-1.5"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>Submit Inquiry</span>
                  </Button>
                </form>
              )}
            </div>

            {/* Direct Support Card & Corporate Address */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Direct Support Card */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-3xl shadow-xl space-y-4">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-teal-500/20 text-teal-400 rounded-xl border border-teal-500/30">
                    <Phone className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-extrabold">Enterprise Contact Helpline</h3>
                    <p className="text-[11px] text-slate-300">Fusion EvalX AI Direct Line</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs pt-1">
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-teal-400 shrink-0" />
                    <a href={`tel:${headquarters.phoneRaw}`} className="font-mono font-bold text-sm text-teal-300 hover:underline">
                      {headquarters.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-indigo-400 shrink-0" />
                    <a href={`mailto:${headquarters.email}`} className="font-bold text-slate-100 hover:underline">
                      {headquarters.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-slate-300">Mon - Sat: 9:00 AM - 7:00 PM IST</span>
                  </div>
                </div>

                {/* Official Social Media Links */}
                <div className="pt-3 border-t border-slate-700/60 space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Official Social Media:</span>
                  <div className="flex flex-col gap-2 text-xs">
                    <a
                      href={headquarters.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-slate-200 hover:text-pink-400 transition-colors font-semibold"
                    >
                      <InstagramIcon className="w-4 h-4 text-pink-400" />
                      <span>Instagram: @fusionevalx</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>
                    <a
                      href={headquarters.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-slate-200 hover:text-blue-400 transition-colors font-semibold"
                    >
                      <LinkedinIcon className="w-4 h-4 text-blue-400" />
                      <span>LinkedIn: company/fusioneval-ai</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Corporate Office Address */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md space-y-3">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Building className="w-4 h-4 text-teal-600" /> Corporate Headquarters Address
                </h3>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
                  <h4 className="font-extrabold text-slate-900 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-teal-600 shrink-0" /> {headquarters.city}
                  </h4>
                  <p className="text-slate-600 text-xs leading-relaxed font-medium">
                    {headquarters.address}
                  </p>
                  <div className="pt-1 text-[11px] text-teal-800 font-bold">
                    Phone: <a href={`tel:${headquarters.phoneRaw}`} className="underline">{headquarters.phone}</a> • Email: <a href={`mailto:${headquarters.email}`} className="underline">{headquarters.email}</a>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* FAQ Accordion Section */}
        <section className="py-10 bg-white border-t border-slate-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <h3 className="text-xl font-extrabold text-slate-900 text-center flex items-center justify-center gap-2">
              <HelpCircle className="w-5 h-5 text-teal-600" /> Frequently Asked Contact Questions
            </h3>

            <div className="space-y-3 text-xs">
              {faqs.map((faq, idx) => (
                <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <h4 className="font-extrabold text-slate-900 text-sm">{faq.q}</h4>
                  <p className="text-slate-600 font-medium">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>

      <LandingFooter />
    </div>
  )
}
