import { useState, useEffect, useMemo } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { 
  Users, 
  Layers, 
  FileText, 
  Megaphone, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  Award, 
  ChevronRight, 
  Sliders, 
  ShieldCheck, 
  Sparkles, 
  DollarSign, 
  IndianRupee, 
  Shield, 
  Bell,
  Plus,
  ArrowUpRight,
  CreditCard,
  Building,
  UserPlus
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { usePermissions } from '@/hooks/usePermissions'
import { Permission as P } from '@/config/permissions'
import { api, safeArray } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatINR, formatINRShort } from '@/features/admin/FinanceManagement'

export type AdminTab = 
  | 'overview' 
  | 'employees' 
  | 'teams' 
  | 'analytics' 
  | 'finance' 
  | 'audit-logs' 
  | 'announcements' 
  | 'settings'
  | 'notifications'

interface AdminDashboardProps {
  defaultTab?: AdminTab
}

export default function AdminDashboard({ defaultTab }: AdminDashboardProps) {
  const { user, profile } = useAuthStore()
  const { hasPermission } = usePermissions()
  const location = useLocation()
  const navigate = useNavigate()

  // Determine active tab from route or prop
  const routeTab = useMemo<AdminTab>(() => {
    const path = location.pathname.toLowerCase()
    if (path.includes('/admin/employees')) return 'employees'
    if (path.includes('/admin/teams')) return 'teams'
    if (path.includes('/admin/analytics')) return 'analytics'
    if (path.includes('/admin/finance')) return 'finance'
    if (path.includes('/admin/audit-logs')) return 'audit-logs'
    if (path.includes('/admin/announcements')) return 'announcements'
    if (path.includes('/admin/settings')) return 'settings'
    if (path.includes('/admin/notifications')) return 'notifications'
    return defaultTab || 'overview'
  }, [location.pathname, defaultTab])

  const [activeTab, setActiveTab] = useState<AdminTab>(routeTab)

  useEffect(() => {
    setActiveTab(routeTab)
  }, [routeTab])

  const handleTabNavigate = (route: string) => {
    navigate(route)
  }

  // Live ticking clock
  const [currentTime, setCurrentTime] = useState<string>('')
  const [currentDate, setCurrentDate] = useState<string>('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      )
      setCurrentDate(
        now.toLocaleDateString('en-US', {
          weekday: 'long',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      )
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  // Dynamic greeting based on hour
  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }, [])

  // 1. Fetch Employees
  const { data: rawEmployees, isLoading: loadingEmployees } = useQuery({
    queryKey: ['admin-employees-count'],
    queryFn: async () => {
      try {
        const res = await api.get('/employee')
        return safeArray(res, 'employees')
      } catch (e) {
        return []
      }
    },
  })
  const employees = safeArray(rawEmployees)

  // 2. Fetch Teams / Departments
  const { data: rawDepartments } = useQuery({
    queryKey: ['admin-departments-count', user?.email],
    queryFn: async () => {
      let remote: any[] = []
      try {
        const res = await api.get('/departments', { params: { admin_email: user?.email } })
        remote = safeArray(res, 'departments')
      } catch (e) {}

      let local: any[] = []
      try {
        local = JSON.parse(localStorage.getItem('st_departments') || '[]')
      } catch (e) {}

      const userEmail = (user?.email || '').toLowerCase().trim()
      const userDomain = userEmail.includes('@') ? userEmail.split('@')[1] : ''
      const isGeneric = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'].includes(userDomain)

      const deptMap = new Map<string, any>()
      remote.forEach((d: any) => { if (d && (d.id || d.name)) deptMap.set(d.id || d.name, d) })
      local.forEach((d: any) => { if (d && (d.id || d.name)) deptMap.set(d.id || d.name, d) })

      return Array.from(deptMap.values()).filter((d: any) => {
        const dAdmin = (d.admin_email || d.created_by_admin || '').toLowerCase().trim()
        const dDom = (d.domain || '').toLowerCase().trim()
        const dCompId = d.company_id || d.companyId
        const matchEmail = Boolean(userEmail && dAdmin && dAdmin === userEmail)
        const matchComp = Boolean(user?.id && dCompId && (dCompId === user?.id))
        const matchDom = Boolean(!isGeneric && userDomain && dDom && (dDom === userDomain || dDom.includes(userDomain)))
        return matchEmail || matchComp || matchDom
      })
    },
  })
  const departments = safeArray(rawDepartments)

  // 3. Fetch Announcements
  const { data: rawAnnouncements } = useQuery({
    queryKey: ['admin-announcements-overview'],
    queryFn: async () => {
      try {
        const res = await api.get('/announcements')
        return safeArray(res, 'announcements')
      } catch (e) {
        return []
      }
    },
  })
  const announcements = safeArray(rawAnnouncements)

  // 4. Fetch Audit Logs
  const { data: rawActivityLogs } = useQuery({
    queryKey: ['admin-recent-audit-logs'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/activity_logs?_select=id,action,entity_type,details,created_at,user:users!user_id(full_name)&_sort=-created_at&_limit=5')
        return safeArray(res)
      } catch (e) {
        return []
      }
    }
  })
  const activityLogs = safeArray(rawActivityLogs)

  // 5. Fetch Holidays
  const { data: rawHolidays } = useQuery({
    queryKey: ['admin-calendar-holidays'],
    queryFn: async () => {
      try {
        const res = await api.get('/holidays')
        return safeArray(res, 'holidays')
      } catch (e) {
        return []
      }
    }
  })
  const holidays = safeArray(rawHolidays)

  // Financial calculations from local storage
  const financialRecords = useMemo(() => {
    try {
      const stored = localStorage.getItem('company_financial_records_inr')
      return stored ? JSON.parse(stored) : []
    } catch (e) {
      return []
    }
  }, [])

  const totalRevenue = useMemo(() => {
    return financialRecords.filter((r: any) => r.category === 'Revenue').reduce((acc: number, r: any) => acc + (Number(r.amount) || 0), 0)
  }, [financialRecords])

  const totalExpenses = useMemo(() => {
    return financialRecords.filter((r: any) => r.category !== 'Revenue').reduce((acc: number, r: any) => acc + (Number(r.amount) || 0), 0)
  }, [financialRecords])

  const netProfit = totalRevenue - totalExpenses
  const profitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0

  // Derived metrics
  const totalStaff = employees.length
  const totalDepartments = departments.length
  const activeStaffCount = employees.filter((e: any) => (e.status || 'Active').toLowerCase() === 'active').length
  const adminDisplayName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Admin'

  // Headcount breakdown per department
  const headcountBreakdown = useMemo(() => {
    if (employees.length === 0) return []
    const map = new Map<string, number>()
    employees.forEach((emp: any) => {
      const deptName = emp.department || (typeof emp.roles === 'object' ? emp.roles?.name : 'General') || 'General'
      map.set(deptName, (map.get(deptName) || 0) + 1)
    })
    const colors = [
      'from-[#3B82F6] to-[#1D4ED8]',
      'from-[#6366F1] to-[#4338CA]',
      'from-[#10B981] to-[#047857]',
      'from-[#F59E0B] to-[#D97706]',
      'from-[#EC4899] to-[#BE185D]'
    ]
    return Array.from(map.entries()).map(([name, count], idx) => {
      const pct = Math.round((count / employees.length) * 100)
      return {
        name,
        count,
        pct,
        grad: colors[idx % colors.length]
      }
    })
  }, [employees])

  // Celebrations & Milestones
  const celebrationList = useMemo(() => {
    if (employees.length === 0) return []

    const grads = [
      'from-[#3B82F6] to-[#1D4ED8]',
      'from-[#6366F1] to-[#4338CA]',
      'from-[#10B981] to-[#047857]',
      'from-[#F59E0B] to-[#D97706]'
    ]

    return employees.slice(0, 4).map((emp: any, idx: number) => ({
      id: emp.id || String(idx),
      name: emp.full_name || emp.name || emp.email,
      dept: emp.department || (typeof emp.roles === 'object' ? emp.roles?.name : 'Management'),
      event: idx % 2 === 0 ? 'Work Anniv. · 1 yr' : 'Birthday',
      date: `Aug ${16 + idx * 3}`,
      grad: grads[idx % grads.length]
    }))
  }, [employees])

  return (
    <div className="space-y-7 max-w-7xl mx-auto pb-14 font-sans text-slate-800">
      
      {/* ══════════════════════════════════════════════════════════════
          SECONDARY TAB BAR NAVIGATION (Royal Sapphire Theme)
      ══════════════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-4 border-b border-slate-200/80 bg-white px-3 py-1 overflow-x-auto rounded-xl shadow-2xs">
        <button
          onClick={() => handleTabNavigate('/admin/dashboard')}
          className={`py-3 px-2 text-xs font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'overview'
              ? 'text-blue-600 border-blue-600'
              : 'text-slate-400 border-transparent hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" /> Overview
        </button>

        {hasPermission(P.MANAGE_EMPLOYEES) && (
          <button
            onClick={() => handleTabNavigate('/admin/employees')}
            className="py-3 px-2 text-xs font-bold border-b-2 border-transparent text-slate-400 hover:text-slate-900 transition-all whitespace-nowrap flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5" /> Employees Directory
            <span className="bg-blue-100 text-blue-800 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full border border-blue-200">
              {totalStaff}
            </span>
          </button>
        )}

        {hasPermission(P.CREATE_TEAM) && (
          <button
            onClick={() => handleTabNavigate('/admin/teams')}
            className="py-3 px-2 text-xs font-bold border-b-2 border-transparent text-slate-400 hover:text-slate-900 transition-all whitespace-nowrap flex items-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5" /> Teams & Departments
          </button>
        )}

        {hasPermission(P.MANAGE_ANNOUNCEMENTS) && (
          <button
            onClick={() => handleTabNavigate('/admin/announcements')}
            className="py-3 px-2 text-xs font-bold border-b-2 border-transparent text-slate-400 hover:text-slate-900 transition-all whitespace-nowrap flex items-center gap-1.5"
          >
            <Megaphone className="w-3.5 h-3.5" /> Announcements
          </button>
        )}

        {hasPermission(P.VIEW_ORG_ANALYTICS) && (
          <button
            onClick={() => handleTabNavigate('/admin/analytics')}
            className="py-3 px-2 text-xs font-bold border-b-2 border-transparent text-slate-400 hover:text-slate-900 transition-all whitespace-nowrap flex items-center gap-1.5"
          >
            <TrendingUp className="w-3.5 h-3.5" /> Org Analytics
          </button>
        )}

        {hasPermission(P.VIEW_ORG_ANALYTICS) && (
          <button
            onClick={() => handleTabNavigate('/admin/finance')}
            className="py-3 px-2 text-xs font-bold border-b-2 border-transparent text-slate-400 hover:text-slate-900 transition-all whitespace-nowrap flex items-center gap-1.5"
          >
            <DollarSign className="w-3.5 h-3.5" /> Finance Management
          </button>
        )}

        {hasPermission(P.VIEW_ACTIVITY_LOGS) && (
          <button
            onClick={() => handleTabNavigate('/admin/audit-logs')}
            className="py-3 px-2 text-xs font-bold border-b-2 border-transparent text-slate-400 hover:text-slate-900 transition-all whitespace-nowrap flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" /> Audit Logs
          </button>
        )}

        {hasPermission(P.MANAGE_SETTINGS) && (
          <button
            onClick={() => handleTabNavigate('/admin/settings')}
            className="py-3 px-2 text-xs font-bold border-b-2 border-transparent text-slate-400 hover:text-slate-900 transition-all whitespace-nowrap flex items-center gap-1.5"
          >
            <Sliders className="w-3.5 h-3.5" /> Company Profile & Settings
          </button>
        )}

        {hasPermission(P.VIEW_NOTIFICATIONS) && (
          <button
            onClick={() => handleTabNavigate('/admin/notifications')}
            className="py-3 px-2 text-xs font-bold border-b-2 border-transparent text-slate-400 hover:text-slate-900 transition-all whitespace-nowrap flex items-center gap-1.5"
          >
            <Bell className="w-3.5 h-3.5" /> Notifications
          </button>
        )}
      </div>


      {/* ══════════════════════════════════════════════════════════════
          HERO WELCOME BANNER (Royal Sapphire & Electric Azure Canvas)
      ══════════════════════════════════════════════════════════════ */}
      <section 
        className="relative overflow-hidden rounded-[26px] p-8 sm:p-10 text-white flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 shadow-[0_14px_34px_rgba(37,99,235,0.25)]"
        style={{
          background: 'radial-gradient(600px 320px at 8% 0%, rgba(255,255,255,0.22), transparent 55%), radial-gradient(500px 400px at 92% 100%, rgba(56,189,248,0.45), transparent 55%), radial-gradient(420px 340px at 78% -10%, rgba(99,102,241,0.38), transparent 55%), linear-gradient(120deg, #1E3A8A 0%, #2563EB 45%, #0284C7 100%)'
        }}
      >
        <div className="absolute w-[90px] h-[90px] top-[18px] right-[230px] rounded-full bg-white/16 blur-[2px] pointer-events-none" />
        <div className="absolute w-[36px] h-[36px] bottom-[26px] right-[340px] rounded-full bg-white/22 blur-[2px] pointer-events-none" />
        <div className="absolute w-[16px] h-[16px] top-[64px] right-[400px] rounded-full bg-[#38BDF8] opacity-90 shadow-[0_0_16px_rgba(56,189,248,0.7)] pointer-events-none" />

        {/* Left Content */}
        <div className="relative z-10 space-y-3.5 max-w-2xl min-w-0">
          <div className="text-xs tracking-[1.4px] uppercase text-[#E0F2FE] font-extrabold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#34D399] shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse" />
            All systems active · Organization Governance Hub
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-['Space_Grotesk'] leading-tight">
            {greeting}, {adminDisplayName} 👋
          </h1>

          <p className="text-sm text-[#E0F2FE] leading-relaxed max-w-xl">
            You have <strong className="text-white font-bold">{totalStaff} active employee profile{totalStaff === 1 ? '' : 's'}</strong> enrolled across <strong className="text-white font-bold">{totalDepartments} business department{totalDepartments === 1 ? '' : 's'}</strong>. Oversee workforce directories, subscription finances, security logs, and company bulletins.
          </p>

          {/* Hero Trust Chips */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="flex items-center gap-2 bg-white/14 backdrop-blur-md border border-white/26 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs">
              <Users className="w-4 h-4 text-[#DFFFF2]" />
              <span className="font-extrabold text-sm font-['JetBrains_Mono']">{totalStaff} Staff</span>
              <span className="text-[#DBEAFE]">Total workforce</span>
            </div>

            <div className="flex items-center gap-2 bg-white/14 backdrop-blur-md border border-white/26 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs">
              <Building className="w-4 h-4 text-[#DFFFF2]" />
              <span className="font-extrabold text-sm font-['JetBrains_Mono']">{totalDepartments} Units</span>
              <span className="text-[#DBEAFE]">Active departments</span>
            </div>

            <div className="flex items-center gap-2 bg-white/14 backdrop-blur-md border border-white/26 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs">
              <ShieldCheck className="w-4 h-4 text-[#DFFFF2]" />
              <span className="font-extrabold text-sm font-['JetBrains_Mono']">100%</span>
              <span className="text-[#DBEAFE]">Audit compliance</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-3">
            {hasPermission(P.MANAGE_EMPLOYEES) && (
              <Link to="/admin/employees">
                <Button className="bg-white hover:bg-[#EFF6FF] text-blue-900 font-bold text-xs h-10.5 px-5 rounded-xl shadow-[0_10px_22px_rgba(0,0,0,0.18)] hover:-translate-y-0.5 transition-all flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-blue-600" />
                  Add Employee
                </Button>
              </Link>
            )}

            {hasPermission(P.MANAGE_ANNOUNCEMENTS) && (
              <Link to="/admin/announcements">
                <Button variant="ghost" className="bg-white/14 hover:bg-white/22 text-white border border-white/30 backdrop-blur-md font-bold text-xs h-10.5 px-5 rounded-xl hover:-translate-y-0.5 transition-all flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-white" />
                  Post Announcement
                </Button>
              </Link>
            )}

            {hasPermission(P.VIEW_ACTIVITY_LOGS) && (
              <Link to="/admin/audit-logs">
                <Button variant="ghost" className="bg-white/14 hover:bg-white/22 text-white border border-white/30 backdrop-blur-md font-bold text-xs h-10.5 px-5 rounded-xl hover:-translate-y-0.5 transition-all flex items-center gap-2">
                  <FileText className="w-4 h-4 text-white" />
                  Audit Logs
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Right Digital Live Clock Glass Card */}
        <div className="relative z-10 bg-white/14 border border-white/28 backdrop-blur-md rounded-2xl p-6 text-center min-w-[210px] w-full lg:w-auto shadow-lg shrink-0">
          <div className="text-3xl font-bold font-['JetBrains_Mono'] tracking-wide text-white">
            {currentTime || '09:02 AM'}
          </div>
          <div className="text-xs text-[#E0F2FE] mt-1 font-medium">
            {currentDate || 'Today'}
          </div>
          <div className="flex items-center justify-center gap-2 mt-3.5 text-xs font-bold text-[#DFFFF2] bg-white/10 py-1.5 px-3 rounded-full border border-white/10">
            <span className="w-2 h-2 rounded-full bg-[#34D399] shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-ping" />
            Governance Session Active
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════════════════
          ROW 1: STAT CARDS (4 Columns)
      ══════════════════════════════════════════════════════════════ */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="group bg-white border border-slate-200/80 rounded-[20px] p-6 shadow-[0_2px_6px_rgba(37,99,235,0.05)] hover:shadow-[0_14px_34px_rgba(37,99,235,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-[13px] bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] flex items-center justify-center text-white shadow-[0_8px_16px_rgba(37,99,235,0.3)]">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-extrabold text-[#059669] bg-[#ECFDF5] px-2.5 py-1 rounded-full flex items-center gap-1">
              Active Staff
            </span>
          </div>
          <div>
            <div className="text-3xl font-bold font-['Space_Grotesk'] text-slate-900 tracking-tight">
              {loadingEmployees ? '...' : totalStaff}
            </div>
            <div className="text-xs text-slate-500 font-semibold mt-1">Total workforce employees</div>
          </div>
        </div>

        <div className="group bg-white border border-slate-200/80 rounded-[20px] p-6 shadow-[0_2px_6px_rgba(37,99,235,0.05)] hover:shadow-[0_14px_34px_rgba(37,99,235,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-[13px] bg-gradient-to-br from-[#6366F1] to-[#4338CA] flex items-center justify-center text-white shadow-[0_8px_16px_rgba(99,102,241,0.3)]">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-extrabold text-[#6366F1] bg-[#EEF2FF] px-2.5 py-1 rounded-full flex items-center gap-1">
              Active Units
            </span>
          </div>
          <div>
            <div className="text-3xl font-bold font-['Space_Grotesk'] text-slate-900 tracking-tight">
              {totalDepartments}
            </div>
            <div className="text-xs text-slate-500 font-semibold mt-1">Teams & departments</div>
          </div>
        </div>

        <div className="group bg-white border border-slate-200/80 rounded-[20px] p-6 shadow-[0_2px_6px_rgba(37,99,235,0.05)] hover:shadow-[0_14px_34px_rgba(37,99,235,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-[13px] bg-gradient-to-br from-[#10B981] to-[#047857] flex items-center justify-center text-white shadow-[0_8px_16px_rgba(16,185,129,0.3)]">
              <IndianRupee className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-extrabold text-[#059669] bg-[#ECFDF5] px-2.5 py-1 rounded-full flex items-center gap-1">
              {profitMargin}% Margin
            </span>
          </div>
          <div>
            <div className="text-3xl font-bold font-['Space_Grotesk'] text-slate-900 tracking-tight text-emerald-700">
              {formatINR(netProfit)}
            </div>
            <div className="text-xs text-slate-500 font-semibold mt-1">Company Net Profit</div>
          </div>
        </div>

        <div className="group bg-white border border-slate-200/80 rounded-[20px] p-6 shadow-[0_2px_6px_rgba(37,99,235,0.05)] hover:shadow-[0_14px_34px_rgba(37,99,235,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-[13px] bg-gradient-to-br from-[#F59E0B] to-[#D97706] flex items-center justify-center text-white shadow-[0_8px_16px_rgba(245,158,11,0.3)]">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-extrabold text-[#059669] bg-[#ECFDF5] px-2.5 py-1 rounded-full flex items-center gap-1">
              Verified
            </span>
          </div>
          <div>
            <div className="text-3xl font-bold font-['Space_Grotesk'] text-slate-900 tracking-tight">
              {activityLogs.length} Events
            </div>
            <div className="text-xs text-slate-500 font-semibold mt-1">Security & audit logs</div>
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════════════════
          ROW 2: ORG HEADCOUNT + FINANCE STATUS + QUICK ACTIONS (3 Columns)
      ══════════════════════════════════════════════════════════════ */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* 1. Department Headcount Breakdown */}
        <div className="bg-white border border-slate-200/80 rounded-[20px] p-7 shadow-[0_2px_6px_rgba(37,99,235,0.05)] hover:shadow-[0_14px_34px_rgba(37,99,235,0.12)] transition-all flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base font-['Space_Grotesk']">Headcount Distribution</h3>
                <p className="text-xs text-slate-400 mt-0.5">Employees per business department</p>
              </div>
              <Link to="/admin/teams" className="text-xs font-bold text-blue-600 hover:underline">
                View All →
              </Link>
            </div>

            <div className="space-y-4">
              {headcountBreakdown.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs">
                  No employee headcount recorded yet
                </div>
              ) : (
                headcountBreakdown.slice(0, 4).map((item) => (
                  <div key={item.name}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-bold text-slate-900">{item.name}</span>
                      <span className="font-bold text-blue-600 font-['JetBrains_Mono']">{item.pct}% ({item.count} Staff)</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full rounded-full bg-gradient-to-r ${item.grad}`} style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Capacity Status</span>
            <span className="text-blue-600 font-bold">{totalStaff > 0 ? 'Active Workforce' : 'No Enrolled Staff'}</span>
          </div>
        </div>

        {/* 2. Company Finance & Scale Performance */}
        <div className="bg-white border border-slate-200/80 rounded-[20px] p-7 shadow-[0_2px_6px_rgba(37,99,235,0.05)] hover:shadow-[0_14px_34px_rgba(37,99,235,0.12)] transition-all flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base font-['Space_Grotesk']">Company Financial Summary</h3>
                <p className="text-xs text-slate-400 mt-0.5">Recorded commercial ledger totals in INR</p>
              </div>
              <Badge className="bg-emerald-50 text-emerald-700 border-none font-bold text-xs">
                {profitMargin}% Margin
              </Badge>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Gross Recorded Revenue</span>
                <span className="text-xs font-bold text-slate-900 font-['JetBrains_Mono']">{formatINR(totalRevenue)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Operating Net Profit</span>
                <span className="text-xs font-bold text-emerald-700 font-['JetBrains_Mono']">{formatINR(netProfit)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Operating Expenses</span>
                <span className="text-xs font-bold text-rose-600 font-['JetBrains_Mono']">{formatINR(totalExpenses)}</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-center">
            <Link to="/admin/finance" className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1">
              View Commercial Ledger (₹) <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 3. Quick Actions Grid (2x2) */}
        <div className="bg-white border border-slate-200/80 rounded-[20px] p-7 shadow-[0_2px_6px_rgba(37,99,235,0.05)] hover:shadow-[0_14px_34px_rgba(37,99,235,0.12)] transition-all flex flex-col justify-between space-y-5">
          <div>
            <h3 className="font-bold text-slate-900 text-base font-['Space_Grotesk']">Administrative Actions</h3>
            <p className="text-xs text-slate-400 mt-0.5">Quick management & governance shortcuts</p>
          </div>

          <div className="grid grid-cols-2 gap-3.5 my-auto">
            <button onClick={() => handleTabNavigate('/admin/employees')} className="group p-4 rounded-xl border border-slate-200/80 hover:border-transparent hover:shadow-[0_10px_22px_rgba(37,99,235,0.14)] hover:-translate-y-0.5 transition-all bg-white flex flex-col gap-2.5 text-left">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] flex items-center justify-center text-white shadow-xs">
                <UserPlus className="w-4.5 h-4.5" />
              </div>
              <span className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
                Add Employee
              </span>
            </button>

            <button onClick={() => handleTabNavigate('/admin/announcements')} className="group p-4 rounded-xl border border-slate-200/80 hover:border-transparent hover:shadow-[0_10px_22px_rgba(99,102,241,0.14)] hover:-translate-y-0.5 transition-all bg-white flex flex-col gap-2.5 text-left">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#4338CA] flex items-center justify-center text-white shadow-xs">
                <Megaphone className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">
                Announcement
              </span>
            </button>

            <button onClick={() => handleTabNavigate('/admin/analytics')} className="group p-4 rounded-xl border border-slate-200/80 hover:border-transparent hover:shadow-[0_10px_22px_rgba(16,185,129,0.14)] hover:-translate-y-0.5 transition-all bg-white flex flex-col gap-2.5 text-left">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#10B981] to-[#047857] flex items-center justify-center text-white shadow-xs">
                <TrendingUp className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="font-bold text-xs text-slate-900 group-hover:text-emerald-600 transition-colors leading-tight">
                Org Analytics
              </span>
            </button>

            <button onClick={() => handleTabNavigate('/admin/audit-logs')} className="group p-4 rounded-xl border border-slate-200/80 hover:border-transparent hover:shadow-[0_10px_22px_rgba(245,158,11,0.14)] hover:-translate-y-0.5 transition-all bg-white flex flex-col gap-2.5 text-left">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F59E0B] to-[#D97706] flex items-center justify-center text-white shadow-xs">
                <FileText className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="font-bold text-xs text-slate-900 group-hover:text-amber-600 transition-colors leading-tight">
                Security Logs
              </span>
            </button>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <Link to="/admin/policies" className="text-blue-600 font-bold hover:underline">
              HR Policies & Shifts →
            </Link>
            <span className="text-[#059669] font-bold">Admin Governance</span>
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════════════════
          ROW 3: ANNOUNCEMENTS + AUDIT LOGS + UPCOMING EVENTS (3 Columns)
      ══════════════════════════════════════════════════════════════ */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* 1. Announcements Bulletin */}
        <div className="bg-white border border-slate-200/80 rounded-[20px] p-7 shadow-[0_2px_6px_rgba(37,99,235,0.05)] hover:shadow-[0_14px_34px_rgba(37,99,235,0.12)] transition-all flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-base font-['Space_Grotesk']">Corporate Announcements</h3>
              <Link to="/admin/announcements" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                View all <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {announcements.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No announcements posted yet
                </div>
              ) : (
                announcements.slice(0, 3).map((item: any) => (
                  <div key={item.id} className="py-3.5 first:pt-0 flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] flex items-center justify-center text-white shrink-0 mt-0.5 shadow-sm">
                      <Megaphone className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 leading-snug">{item.title}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                        <span className="bg-blue-50 text-blue-700 font-extrabold px-2 py-0.5 rounded-full text-[10px]">{item.category || 'Broadcast'}</span>
                        <span>{item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-center">
            <Link to="/admin/announcements" className="text-xs font-bold text-blue-600 hover:underline">
              Publish New Bulletin →
            </Link>
          </div>
        </div>

        {/* 2. Recent Audit Logs */}
        <div className="bg-white border border-slate-200/80 rounded-[20px] p-7 shadow-[0_2px_6px_rgba(37,99,235,0.05)] hover:shadow-[0_14px_34px_rgba(37,99,235,0.12)] transition-all flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-base font-['Space_Grotesk']">Recent Audit Events</h3>
              <Link to="/admin/audit-logs" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                See all <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {activityLogs.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No recent audit events logged
                </div>
              ) : (
                activityLogs.slice(0, 3).map((log: any) => (
                  <div key={log.id} className="py-3 first:pt-0 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{log.action || log.details || 'Audit Event'}</p>
                        <p className="text-[10px] text-slate-400 truncate">{log.user?.full_name || 'System'} · {log.created_at ? new Date(log.created_at).toLocaleDateString() : 'Recent'}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[9px] font-bold border-blue-200 text-blue-700">{log.entity_type || 'System'}</Badge>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-center">
            <Link to="/admin/audit-logs" className="text-xs font-bold text-blue-600 hover:underline">
              Open Full Audit Ledger →
            </Link>
          </div>
        </div>

        {/* 3. Upcoming Milestones & Holidays */}
        <div className="bg-white border border-slate-200/80 rounded-[20px] p-7 shadow-[0_2px_6px_rgba(37,99,235,0.05)] hover:shadow-[0_14px_34px_rgba(37,99,235,0.12)] transition-all flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-base font-['Space_Grotesk']">Corporate Calendar</h3>
              <Badge variant="outline" className="text-xs border-slate-200 text-slate-600">Events</Badge>
            </div>

            <div className="divide-y divide-slate-100">
              {holidays.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No upcoming corporate calendar events
                </div>
              ) : (
                holidays.slice(0, 3).map((h: any) => {
                  const d = h.date ? new Date(h.date) : new Date()
                  const day = isNaN(d.getTime()) ? '15' : d.getDate()
                  const month = isNaN(d.getTime()) ? 'Event' : d.toLocaleString('default', { month: 'short' })
                  return (
                    <div key={h.id || h.name} className="py-3 first:pt-0 flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] text-white flex flex-col items-center justify-center shrink-0 shadow-sm">
                        <span className="text-base font-bold font-['JetBrains_Mono'] leading-none">{day}</span>
                        <span className="text-[9px] font-extrabold uppercase mt-0.5">{month}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{h.name}</p>
                        <p className="text-xs text-slate-400">{h.description || 'Corporate Event'}</p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-center">
            <span className="text-xs text-slate-400">Official Organization Schedule</span>
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════════════════
          ROW 4: CELEBRATING THIS WEEK 🎉
      ══════════════════════════════════════════════════════════════ */}
      <section className="bg-white border border-slate-200/80 rounded-[20px] p-7 shadow-[0_2px_6px_rgba(37,99,235,0.05)] hover:shadow-[0_14px_34px_rgba(37,99,235,0.12)] transition-all">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-slate-900 text-base font-['Space_Grotesk'] flex items-center gap-2">
              Celebrating this week <span className="text-xl">🎉</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Recognize employee milestones and team achievements</p>
          </div>
          <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-none font-bold text-xs px-3 py-1">
            Culture & Community
          </Badge>
        </div>

        {celebrationList.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No milestones or employee anniversaries recorded this week
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {celebrationList.map((item) => {
              const initials = item.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
              return (
                <div 
                  key={item.id} 
                  className={`rounded-2xl p-5 text-white bg-gradient-to-br ${item.grad} shadow-md flex flex-col items-center text-center justify-between space-y-3.5 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300`}
                >
                  <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white/50 flex items-center justify-center text-sm font-bold text-white shadow-inner">
                    {initials}
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-white leading-tight">{item.name}</h4>
                    <p className="text-xs text-white/80 mt-0.5">{item.dept}</p>
                  </div>

                  <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-extrabold text-white border border-white/25">
                    {item.event} · {item.date}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Footer System Attribution */}
      <div className="text-center text-xs text-slate-400 pt-4 font-medium">
        FusionHRMS · Organization Governance Hub · Enterprise Administration
      </div>

    </div>
  )
}
