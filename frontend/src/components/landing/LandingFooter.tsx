import { Link } from 'react-router-dom'
import { Mail, Phone, MapPin, LogIn, Calendar, Sparkles } from 'lucide-react'
import logoImg from '@/assets/logo.png'

const InstagramIcon = (props: any) => (
  <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
)

const LinkedinIcon = (props: any) => (
  <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
    <rect x="2" y="9" width="4" height="12"></rect>
    <circle cx="4" cy="4" r="2"></circle>
  </svg>
)

export function LandingFooter() {
  return (
    <footer className="bg-slate-50/90 text-slate-600 text-xs border-t border-slate-200 pt-12 pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-200">
          
          {/* Col 1: Brand Info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center space-x-3">
              <div className="bg-white border border-slate-200 p-1.5 rounded-xl shadow-2xs">
                <img src={logoImg} alt="FusionHRMS Logo" className="h-6 w-auto object-contain" />
              </div>
            </div>
            <p className="text-slate-600 text-xs leading-relaxed">
              India's #1 budget-friendly enterprise HR management and task management platform by Fusion EvalX AI. Empowering organizations with automated statutory payroll and sprint Kanban productivity.
            </p>
            <div className="pt-1">
              <span className="text-[10px] bg-teal-50 text-teal-800 border border-teal-200 px-2.5 py-1 rounded-full font-mono font-bold">
                100% Indian Statutory Compliant (EPF/ESI/TDS)
              </span>
            </div>
          </div>

          {/* Col 2: HRMS & TMS Pages */}
          <div>
            <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-3 text-[11px]">Platform Pages</h4>
            <ul className="space-y-2 text-slate-600">
              <li><Link to="/home" className="hover:text-teal-700 transition-colors">Home Showcase</Link></li>
              <li><Link to="/modules" className="hover:text-teal-700 transition-colors">HRMS & TMS Modules Suite</Link></li>
              <li><Link to="/pricing" className="hover:text-teal-700 transition-colors">Subscription Plans & Pricing (₹)</Link></li>
              <li><Link to="/about" className="hover:text-teal-700 transition-colors">About Us & Leadership</Link></li>
              <li><Link to="/contact" className="hover:text-teal-700 transition-colors">Contact Us & Enterprise Support</Link></li>
              <li><Link to="/book-demo" className="hover:text-teal-700 transition-colors font-bold text-teal-800 flex items-center gap-1"><Calendar className="w-3 h-3 text-teal-600" /> Book a Live Demo</Link></li>
            </ul>
          </div>

          {/* Col 3: Subscriptions in INR ₹ */}
          <div>
            <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-3 text-[11px]">Subscriptions in ₹</h4>
            <ul className="space-y-2 text-slate-600">
              <li><Link to="/pricing" className="hover:text-teal-700 transition-colors">50 Members Plan (₹1,499/mo)</Link></li>
              <li><Link to="/pricing" className="hover:text-teal-700 transition-colors">100 Members Plan (₹2,699/mo)</Link></li>
              <li><Link to="/pricing" className="hover:text-teal-700 transition-colors">200 Members Plan (₹4,799/mo)</Link></li>
              <li><Link to="/pricing" className="hover:text-teal-700 transition-colors">200+ Enterprise Custom Quote</Link></li>
              <li>
                <Link to="/demo" className="text-amber-800 font-extrabold hover:underline inline-flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-600" /> Launch Interactive Sandbox
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Support & Official Contact Details */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-3 text-[11px]">Contact Us (Fusion EvalX AI)</h4>
            <p className="flex items-center gap-2 text-slate-700 font-medium">
              <Phone className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <a href="tel:8977721462" className="hover:underline font-mono font-bold text-slate-900">+91 89777 21462</a>
            </p>
            <p className="flex items-center gap-2 text-slate-700 font-medium">
              <Mail className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <a href="mailto:info@fusionevalx.ai" className="hover:underline text-slate-900 font-semibold">info@fusionevalx.ai</a>
            </p>
            <p className="flex items-start gap-2 text-slate-600 text-[11px]">
              <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
              <span>4th Floor, YS Rao Tower, Plot No. 7, Sri Rama Colony, Kavuri Hills, Madhapur, Telangana 500081</span>
            </p>

            <div className="pt-2 flex items-center space-x-3 text-slate-600">
              <a
                href="https://www.instagram.com/fusionevalx?igsh=b2Uxd2x2dnhjOGpz"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-pink-600 flex items-center gap-1 font-semibold text-[11px]"
              >
                <InstagramIcon className="w-3.5 h-3.5 text-pink-600" /> Instagram
              </a>
              <a
                href="https://www.linkedin.com/company/fusioneval-ai"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-600 flex items-center gap-1 font-semibold text-[11px]"
              >
                <LinkedinIcon className="w-3.5 h-3.5 text-blue-600" /> LinkedIn
              </a>
            </div>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-[11px]">
          <p>© {new Date().getFullYear()} Fusion EvalX AI (FusionHRMS). All rights reserved.</p>
          <div className="flex items-center space-x-4">
            <Link to="/contact" className="hover:text-slate-800">Privacy Policy</Link>
            <Link to="/contact" className="hover:text-slate-800">Terms of Service</Link>
            <Link to="/pricing" className="hover:text-slate-800">GST Info</Link>
            <Link to="/login" className="text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1">
              <LogIn className="w-3 h-3" /> Login
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
