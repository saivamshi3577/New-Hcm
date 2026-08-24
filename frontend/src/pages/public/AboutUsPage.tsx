import { useEffect } from 'react'
import { LandingHeader } from '@/components/landing/LandingHeader'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { Link } from 'react-router-dom'
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Calendar,
  TrendingUp,
  Cpu,
  HeartHandshake
} from 'lucide-react'

export default function AboutUsPage() {
  useEffect(() => {
    document.title = "About Us — FusionHRMS Enterprise Mission, Leadership & Security"
  }, [])

  const companyStats = [
    { label: 'Active Organizations', value: '1,450+', sub: 'Across 18+ Indian States' },
    { label: 'Annual Payroll Processed', value: '₹420Cr+', sub: '100% EPF & ESI Compliant' },
    { label: 'Monthly Active Users', value: '120,000+', sub: 'Employees & Team Leads' },
    { label: 'System SLA Uptime', value: '99.98%', sub: 'Bank-Grade Security Encryption' },
  ]

  const coreValues = [
    {
      title: 'Compliance-First Engineering',
      icon: ShieldCheck,
      color: 'text-teal-700 bg-teal-50 border-teal-200',
      description: 'Built specifically for Indian labor laws, statutory PF deductions, ESI, Professional Tax, and TDS withholding with zero manual calculation errors.'
    },
    {
      title: 'Lowest Total Cost of Ownership (TCO)',
      icon: TrendingUp,
      color: 'text-indigo-700 bg-indigo-50 border-indigo-200',
      description: 'We eliminate expensive per-user pricing gouging. Our transparent 50, 100, and 200 member plans save Indian businesses up to 70% compared to legacy enterprise platforms.'
    },
    {
      title: 'Sprint Task Productivity',
      icon: Cpu,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      description: 'Combining task Kanban sprint management directly with employee appraisal scorecards so leadership evaluates output on concrete deliverables.'
    },
    {
      title: 'Enterprise Data Security & Privacy',
      icon: Lock,
      color: 'text-amber-700 bg-amber-50 border-amber-200',
      description: 'ISO 27001 certified architecture with AES-256 encrypted document storage, multi-tenant database security guards, and immutable audit logs.'
    }
  ]

  const leadershipTeam = [
    {
      name: 'Dr. Rajesh V. Sharma',
      role: 'Chief Executive Officer & Founder',
      exp: 'Ex-VP HRMS Product at Top Indian SaaS Enterprise',
      bio: 'Over 18 years building statutory payroll engines and enterprise workforce software for Indian SMBs and large conglomerates.',
      initials: 'RS'
    },
    {
      name: 'Priya Sundaram',
      role: 'Chief Technology Officer',
      exp: 'Ex-Senior Principal Architect at Global Cloud Infra',
      bio: 'Leads our high-availability microservices architecture, automated database security rules, and real-time sprint Kanban engines.',
      initials: 'PS'
    },
    {
      name: 'Arjun Deshmukh',
      role: 'Head of Product & Statutory Compliance',
      exp: 'Certified Tax & EPF Compliance Practitioner',
      bio: 'Oversees quarterly tax filing engine updates, Form 16 generation, and multi-state Professional Tax calculation rules.',
      initials: 'AD'
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
                <Building2 className="w-3.5 h-3.5 text-teal-600" />
                <span className="bg-gradient-to-r from-teal-700 to-emerald-800 bg-clip-text text-transparent font-extrabold">About FusionHRMS Technologies</span>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-950 tracking-tight max-w-4xl mx-auto leading-tight">
              Empowering Indian Organizations <br />
              <span className="bg-gradient-to-r from-teal-600 via-emerald-600 to-indigo-600 bg-clip-text text-transparent">
                with Modern Workforce Infrastructure
              </span>
            </h1>

            <p className="text-slate-600 text-xs sm:text-sm max-w-3xl mx-auto leading-relaxed">
              FusionHRMS was founded with a singular mission: to provide Indian enterprises and growing SMBs with world-class HR Management, Task Kanban Sprint Tracking, and 100% compliant Statutory Payroll at a fraction of traditional software costs.
            </p>

            <div className="pt-2 flex flex-wrap justify-center gap-3.5 text-xs">
              <Link
                to="/book-demo"
                className="px-6 py-3 bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 hover:from-teal-700 hover:to-emerald-700 text-white font-extrabold rounded-2xl shadow-[0_6px_25px_rgba(20,184,166,0.35)] flex items-center gap-2 border border-teal-500/20"
              >
                <Calendar className="w-4 h-4" /> Book an Enterprise Product Tour
              </Link>
              <Link
                to="/contact"
                className="px-5 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-extrabold rounded-2xl shadow-sm flex items-center gap-2"
              >
                <HeartHandshake className="w-4 h-4 text-teal-600" /> Contact Our Leadership Team
              </Link>
            </div>
          </div>
        </section>

        {/* Company Stats Grid */}
        <section className="py-12 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {companyStats.map((stat, idx) => (
                <div key={idx} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-1 shadow-2xs hover:border-teal-300 transition-all">
                  <p className="text-2xl sm:text-3xl font-black text-slate-900">{stat.value}</p>
                  <p className="text-xs font-extrabold text-teal-800">{stat.label}</p>
                  <p className="text-[10px] text-slate-500 font-medium">{stat.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Core Values Section */}
        <section className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">Our Architectural Pillars</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Why Modern Workforces Trust FusionHRMS</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {coreValues.map((val, idx) => {
              const Icon = val.icon
              return (
                <div key={idx} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md hover:shadow-xl transition-all space-y-3">
                  <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${val.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">{val.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">{val.description}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* Leadership Team Section */}
        <section className="py-14 bg-white border-t border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">Leadership & Engineering</span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Guided by Veteran SaaS Architects</h2>
              <p className="text-xs text-slate-500 max-w-xl mx-auto">Our executive team brings decades of combined experience building secure enterprise platforms.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {leadershipTeam.map((member, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-teal-400 font-extrabold text-base flex items-center justify-center shadow-md">
                      {member.initials}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900">{member.name}</h3>
                      <p className="text-[11px] text-teal-700 font-bold">{member.role}</p>
                    </div>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-500 bg-white p-2 rounded-xl border border-slate-200">
                    {member.exp}
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {member.bio}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Security & ISO Standards Section */}
        <section className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border-2 border-teal-200 rounded-3xl p-8 sm:p-10 shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold">
                <Lock className="w-3.5 h-3.5 text-teal-600" /> Bank-Grade Security & Data Governance
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950">
                ISO 27001 Certified Security & Encrypted Data Storage
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
                Your employee records, salary accounts, PAN/Aadhaar compliance documents, and performance scorecards are protected with AES-256 encryption at rest and TLS 1.3 in transit.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs font-bold text-slate-800">
                <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-teal-600" /> AES-256 Data Vault</div>
                <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-teal-600" /> Role Security Guard</div>
                <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-teal-600" /> Immutable Audit Logs</div>
              </div>
            </div>

            <div className="lg:col-span-4 text-center lg:text-right">
              <Link
                to="/book-demo"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 hover:from-teal-700 hover:to-emerald-700 text-white font-extrabold text-xs px-6 py-3.5 rounded-2xl shadow-[0_6px_20px_rgba(20,184,166,0.3)]"
              >
                <Calendar className="w-4 h-4" /> Book Security Walkthrough
              </Link>
            </div>
          </div>
        </section>

      </div>

      <LandingFooter />
    </div>
  )
}
