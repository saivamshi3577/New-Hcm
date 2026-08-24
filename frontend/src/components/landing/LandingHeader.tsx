import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, LogIn, Calendar, Sparkles, LayoutDashboard } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import logoImg from '@/assets/logo.png'

interface LandingHeaderProps {
  onOpenPricingModal?: () => void
}

export function LandingHeader({}: LandingHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const { user, role } = useAuthStore()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { name: 'Home', href: '/home' },
    { name: 'Modules', href: '/modules' },
    { name: 'Pricing & Plans', href: '/pricing' },
    { name: 'About Us', href: '/about' },
    { name: 'Contact Us', href: '/contact' },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs py-2.5'
          : 'bg-white/90 backdrop-blur-sm py-3 border-b border-slate-200/50'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to="/home" className="flex items-center space-x-2 shrink-0">
          <img src={logoImg} alt="Logo" className="h-10 w-auto max-w-[160px] object-contain" />
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2 bg-slate-100/70 p-1.5 rounded-2xl border border-slate-200/60 shadow-2xs">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
                isActive(link.href)
                  ? 'bg-white text-teal-800 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Action Buttons */}
        <div className="hidden lg:flex items-center space-x-3">
          <Link
            to="/book-demo"
            className="inline-flex items-center space-x-1.5 text-xs font-extrabold text-teal-900 bg-teal-50 hover:bg-teal-100/80 border border-teal-200 px-3.5 py-1.5 rounded-xl transition-all shadow-2xs"
          >
            <Calendar className="w-3.5 h-3.5 text-teal-600" />
            <span>Book a Demo</span>
          </Link>

          <Link
            to="/demo"
            className="inline-flex items-center space-x-1.5 text-xs font-extrabold text-amber-900 bg-gradient-to-r from-amber-100 via-orange-100 to-amber-200 hover:from-amber-200 hover:to-orange-200 border border-amber-300 px-3.5 py-1.5 rounded-xl transition-all shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            <span>Interactive Demo</span>
          </Link>

          {user && role ? (
            <Link
              to="/"
              className="inline-flex items-center space-x-1.5 text-xs font-extrabold text-white bg-teal-700 hover:bg-teal-800 border border-teal-800 px-4 py-1.5 rounded-xl transition-all shadow-sm"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Go to Dashboard</span>
            </Link>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center space-x-1.5 text-xs font-extrabold text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 px-4 py-1.5 rounded-xl transition-all shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login</span>
            </Link>
          )}
        </div>

        {/* Mobile Menu Trigger */}
        <div className="flex lg:hidden items-center space-x-2">
          <Link
            to="/book-demo"
            className="text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1"
          >
            <Calendar className="w-3 h-3 text-teal-600" /> Demo
          </Link>
          {user && role ? (
            <Link
              to="/"
              className="text-xs font-bold text-white bg-teal-700 px-2.5 py-1.5 rounded-lg flex items-center gap-1"
            >
              <LayoutDashboard className="w-3 h-3" /> Dashboard
            </Link>
          ) : (
            <Link
              to="/login"
              className="text-xs font-bold text-white bg-slate-900 px-2.5 py-1.5 rounded-lg flex items-center gap-1"
            >
              <LogIn className="w-3 h-3" /> Login
            </Link>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg bg-slate-100 border border-slate-200 focus:outline-none"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 space-y-2 animate-in slide-in-from-top duration-150 shadow-lg">
          <div className="grid grid-cols-2 gap-2 text-xs font-bold">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`p-2.5 rounded-xl border transition-all ${
                  isActive(link.href)
                    ? 'bg-teal-50 text-teal-800 border-teal-300'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                }`}
              >
                {link.name}
              </Link>
            ))}
            <Link
              to="/book-demo"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-xl bg-teal-50 text-teal-800 border border-teal-300 font-bold col-span-2 flex items-center justify-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-teal-600" /> Book a Live Demo
            </Link>
            <Link
              to="/demo"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-300 font-bold col-span-2 flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-700" /> Launch Interactive Demo Sandbox
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
