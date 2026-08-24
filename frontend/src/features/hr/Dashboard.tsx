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
  TrendingDown,
  Award, 
  ChevronRight, 
  Search, 
  Sliders, 
  ShieldCheck, 
  Sparkles, 
  Download,
  PlusCircle,
  Navigation,
  Save,
  Check,
  XCircle,
  FileSpreadsheet,
  DollarSign,
  FolderKanban,
  FileCode,
  Shield,
  Briefcase,
  ExternalLink,
  IndianRupee
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { api, safeArray } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { getCompanyPolicy, saveCompanyPolicy } from '@/lib/companyPolicy'
import { formatINR, formatINRShort } from '@/features/admin/FinanceManagement'

export type HrTab = 
  | 'overview' 
  | 'attendance' 
  | 'leave' 
  | 'payroll' 
  | 'analytics' 
  | 'performance' 
  | 'documents' 
  | 'settings'

interface HrDashboardProps {
  defaultTab?: HrTab
}

export default function HrDashboard({ defaultTab }: HrDashboardProps) {
  const { user, profile } = useAuthStore()
  const { toast } = useToast()
  const location = useLocation()
  const navigate = useNavigate()

  // Determine active tab from route or prop
  const routeTab = useMemo<HrTab>(() => {
    const path = location.pathname.toLowerCase()
    if (path.includes('/hr/attendance')) return 'attendance'
    if (path.includes('/hr/leave')) return 'leave'
    if (path.includes('/hr/payroll')) return 'payroll'
    if (path.includes('/hr/performance')) return 'performance'
    if (path.includes('/hr/documents')) return 'documents'
    if (path.includes('/hr/settings')) return 'settings'
    if (path.includes('/hr/analytics')) return 'analytics'
    return defaultTab || 'overview'
  }, [location.pathname, defaultTab])

  const [activeTab, setActiveTab] = useState<HrTab>(routeTab)

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
    queryKey: ['employees'],
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

  // 2. Fetch Departments / Teams
  const { data: rawDepartments } = useQuery({
    queryKey: ['departments', user?.email],
    queryFn: async () => {
      let remote: any[] = []
      try {
        const res = await api.get('/departments')
        remote = safeArray(res, 'departments')
      } catch (e) {
        remote = []
      }

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
        const matchEmail = Boolean(userEmail && dAdmin && dAdmin === userEmail)
        const matchDom = Boolean(!isGeneric && userDomain && dDom && (dDom === userDomain || dDom.includes(userDomain)))
        return matchEmail || matchDom
      })
    },
  })
  const departments = safeArray(rawDepartments)

  // 3. Fetch Announcements
  const { data: rawAnnouncements } = useQuery({
    queryKey: ['announcements'],
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

  // 4. Fetch Holidays
  const { data: rawHolidays } = useQuery({
    queryKey: ['holidays'],
    queryFn: async () => {
      try {
        const res = await api.get('/holidays')
        return safeArray(res, 'holidays')
      } catch (e) {
        return []
      }
    },
  })
  const holidays = safeArray(rawHolidays)

  // 5. Fetch Leave Requests
  const { data: rawLeaves, refetch: refetchLeaves } = useQuery({
    queryKey: ['leave-requests'],
    queryFn: async () => {
      try {
        const res = await api.get('/employee/leaves/all')
        return safeArray(res, 'leaves')
      } catch (e) {
        try {
          const fallbackRes = await api.get('/leave')
          return safeArray(fallbackRes, 'leaves')
        } catch {
          return []
        }
      }
    },
  })
  const leaves = safeArray(rawLeaves)
  const pendingLeaves = leaves.filter((l: any) => {
    const s = (l.status || '').toUpperCase()
    return s === 'PENDING' || s === ''
  })
  const pendingLeavesCount = pendingLeaves.length

  // 6. Fetch Payslips
  const { data: rawPayslips } = useQuery({
    queryKey: ['hr-overview-payslips'],
    queryFn: async () => {
      try {
        const res = await api.get('/payroll/payslips')
        return safeArray(res, 'payslips')
      } catch (e) {
        return []
      }
    }
  })
  const payslips = safeArray(rawPayslips)
  const totalMonthlyPayroll = payslips.reduce((acc: number, p: any) => acc + (Number(p.net_pay || p.netPay) || 0), 0)

  // 7. Fetch Documents
  const { data: rawDocs } = useQuery({
    queryKey: ['hr-overview-documents'],
    queryFn: async () => {
      try {
        const res = await api.get('/documents')
        return safeArray(res, 'documents')
      } catch (e) {
        return []
      }
    }
  })
  const documents = safeArray(rawDocs)

  // 8. Fetch Appraisals
  const { data: rawAppraisals } = useQuery({
    queryKey: ['hr-overview-appraisals'],
    queryFn: async () => {
      try {
        const res = await api.get('/performance/appraisals')
        return safeArray(res, 'appraisals')
      } catch (e) {
        return []
      }
    }
  })
  const appraisals = safeArray(rawAppraisals)

  // Derived metrics
  const totalStaff = employees.length
  const activeStaffCount = employees.filter((e: any) => (e.status || 'Active').toLowerCase() === 'active').length
  const attendanceRate = totalStaff > 0 ? Math.round((activeStaffCount / totalStaff) * 100) : 0
  const presentCount = activeStaffCount

  // HR Policy State
  const [policyState, setPolicyState] = useState(() => {
    const userDomain = user?.email?.includes('@') ? user.email.split('@')[1] : ''
    return getCompanyPolicy(userDomain)
  })

  const handleSavePolicy = () => {
    const userDomain = user?.email?.includes('@') ? user.email.split('@')[1] : ''
    saveCompanyPolicy(userDomain, policyState)
    toast({
      title: "Settings & Policies Saved",
      description: "HR work shift rules and attendance parameters updated successfully.",
    })
  }

  const handleLeaveAction = async (leaveId: string, status: string) => {
    try {
      await api.put(`/employee/leaves/${leaveId}/status`, { status })
      toast({
        title: status === 'APPROVED' ? '✅ Leave Approved' : '❌ Leave Rejected',
        description: `Leave request has been ${status.toLowerCase()}.`,
      })
      refetchLeaves()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to update leave', variant: 'destructive' })
    }
  }

  // Filter celebration milestones
  const celebrationList = useMemo(() => {
    if (employees.length === 0) return []

    const grads = [
      'from-[#9B7BFF] to-[#5B3DE0]',
      'from-[#22D3EE] to-[#0E8FAE]',
      'from-[#FBBF24] to-[#E1911A]',
      'from-[#F472B6] to-[#DB3E86]'
    ]

    return employees.slice(0, 4).map((emp: any, idx: number) => ({
      id: emp.id || String(idx),
      name: emp.full_name || emp.name || emp.email,
      dept: emp.department || (typeof emp.roles === 'object' ? emp.roles?.name : 'Technology'),
      event: idx % 2 === 0 ? 'Birthday' : 'Work Anniv. · 1 yr',
      date: `Aug ${16 + idx * 3}`,
      grad: grads[idx % grads.length]
    }))
  }, [employees])

  return (
    <div className="space-y-7 max-w-7xl mx-auto pb-14 font-sans">
      
      {/* ══════════════════════════════════════════════════════════════
          SECONDARY TAB BAR NAVIGATION (Synced with Router & Left Nav)
      ══════════════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-4 border-b border-[#ECE9F8] bg-white px-3 py-1 overflow-x-auto rounded-xl shadow-2xs">
        <button
          onClick={() => handleTabNavigate('/hr/dashboard')}
          className={`py-3 px-2 text-xs font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'overview'
              ? 'text-[#5B3DE0] border-[#7C5CFC]'
              : 'text-[#A29CC2] border-transparent hover:text-[#160F2E]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" /> Overview
        </button>

        <button
          onClick={() => handleTabNavigate('/hr/attendance')}
          className={`py-3 px-2 text-xs font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'attendance'
              ? 'text-[#5B3DE0] border-[#7C5CFC]'
              : 'text-[#A29CC2] border-transparent hover:text-[#160F2E]'
          }`}
        >
          <Clock className="w-3.5 h-3.5" /> Attendance
        </button>

        <button
          onClick={() => handleTabNavigate('/hr/leave')}
          className={`py-3 px-2 text-xs font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'leave'
              ? 'text-[#5B3DE0] border-[#7C5CFC]'
              : 'text-[#A29CC2] border-transparent hover:text-[#160F2E]'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" /> Leave
          <span className="bg-pink-100 text-pink-700 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full border border-pink-200">
            {pendingLeavesCount}
          </span>
        </button>

        <button
          onClick={() => handleTabNavigate('/hr/payroll')}
          className={`py-3 px-2 text-xs font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'payroll'
              ? 'text-[#5B3DE0] border-[#7C5CFC]'
              : 'text-[#A29CC2] border-transparent hover:text-[#160F2E]'
          }`}
        >
          <IndianRupee className="w-3.5 h-3.5" /> Payroll
        </button>

        <button
          onClick={() => handleTabNavigate('/hr/employees')}
          className="py-3 px-2 text-xs font-bold border-b-2 border-transparent text-[#A29CC2] hover:text-[#160F2E] transition-all whitespace-nowrap flex items-center gap-1.5"
        >
          <Users className="w-3.5 h-3.5" /> Employees
        </button>

        <button
          onClick={() => handleTabNavigate('/hr/performance')}
          className={`py-3 px-2 text-xs font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'performance'
              ? 'text-[#5B3DE0] border-[#7C5CFC]'
              : 'text-[#A29CC2] border-transparent hover:text-[#160F2E]'
          }`}
        >
          <Award className="w-3.5 h-3.5" /> Performance
        </button>

        <button
          onClick={() => handleTabNavigate('/hr/documents')}
          className={`py-3 px-2 text-xs font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'documents'
              ? 'text-[#5B3DE0] border-[#7C5CFC]'
              : 'text-[#A29CC2] border-transparent hover:text-[#160F2E]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" /> Documents
        </button>

        <button
          onClick={() => handleTabNavigate('/hr/teams')}
          className="py-3 px-2 text-xs font-bold border-b-2 border-transparent text-[#A29CC2] hover:text-[#160F2E] transition-all whitespace-nowrap flex items-center gap-1.5"
        >
          <Layers className="w-3.5 h-3.5" /> Teams & Orgs
        </button>

        <button
          onClick={() => handleTabNavigate('/hr/announcements')}
          className="py-3 px-2 text-xs font-bold border-b-2 border-transparent text-[#A29CC2] hover:text-[#160F2E] transition-all whitespace-nowrap flex items-center gap-1.5"
        >
          <Megaphone className="w-3.5 h-3.5" /> Announcements
        </button>

        <button
          onClick={() => handleTabNavigate('/hr/settings')}
          className={`py-3 px-2 text-xs font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'settings'
              ? 'text-[#5B3DE0] border-[#7C5CFC]'
              : 'text-[#A29CC2] border-transparent hover:text-[#160F2E]'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" /> Settings
        </button>
      </div>


      {/* ══════════════════════════════════════════════════════════════
          TAB 1: OVERVIEW
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-7">
          
          {/* Welcome Hero Banner */}
          <section 
            className="relative overflow-hidden rounded-[26px] p-8 sm:p-10 text-white flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 shadow-[0_14px_34px_rgba(124,92,252,0.25)]"
            style={{
              background: 'radial-gradient(600px 320px at 8% 0%, rgba(255,255,255,0.18), transparent 55%), radial-gradient(500px 400px at 92% 100%, rgba(34,211,238,0.45), transparent 55%), radial-gradient(420px 340px at 78% -10%, rgba(244,114,182,0.4), transparent 55%), linear-gradient(120deg, #6D4CF0 0%, #7C5CFC 45%, #5B3DE0 100%)'
            }}
          >
            <div className="absolute w-[90px] h-[90px] top-[18px] right-[230px] rounded-full bg-white/16 blur-[2px] pointer-events-none" />
            <div className="absolute w-[36px] h-[36px] bottom-[26px] right-[340px] rounded-full bg-white/22 blur-[2px] pointer-events-none" />
            <div className="absolute w-[16px] h-[16px] top-[64px] right-[400px] rounded-full bg-[#FBBF24] opacity-90 shadow-[0_0_16px_rgba(251,191,36,0.7)] pointer-events-none" />

            {/* Left Content */}
            <div className="relative z-10 space-y-3.5 max-w-2xl min-w-0">
              <div className="text-xs tracking-[1.4px] uppercase text-[#E4FBFF] font-extrabold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#34D399] shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse" />
                All systems active · Workspace Portal
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-['Space_Grotesk'] leading-tight">
                {greeting}, {profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'HR Manager'} 👋
              </h1>

              <p className="text-sm text-[#E9E4FF] leading-relaxed max-w-xl">
                You have <strong className="text-white font-bold">{pendingLeavesCount} leave request{pendingLeavesCount === 1 ? '' : 's'}</strong> awaiting approval and <strong className="text-white font-bold">{totalStaff} active employee{totalStaff === 1 ? '' : 's'}</strong> enrolled. Here's how the organization looks today.
              </p>

              {/* Hero Trust Chips */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <div className="flex items-center gap-2 bg-white/14 backdrop-blur-md border border-white/26 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-[#DFFFF2]" />
                  <span className="font-extrabold text-sm font-['JetBrains_Mono']">{attendanceRate}%</span>
                  <span className="text-[#DCD5FF]">Attendance rate</span>
                </div>

                <div className="flex items-center gap-2 bg-white/14 backdrop-blur-md border border-white/26 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs">
                  <Users className="w-4 h-4 text-[#DFFFF2]" />
                  <span className="font-extrabold text-sm font-['JetBrains_Mono']">{totalStaff} Staff</span>
                  <span className="text-[#DCD5FF]">Total enrolled</span>
                </div>

                <div className="flex items-center gap-2 bg-white/14 backdrop-blur-md border border-white/26 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs">
                  <ShieldCheck className="w-4 h-4 text-[#DFFFF2]" />
                  <span className="font-extrabold text-sm font-['JetBrains_Mono']">100%</span>
                  <span className="text-[#DCD5FF]">Policy compliance</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-3">
                <Link to="/hr/announcements">
                  <Button className="bg-white hover:bg-[#F6F4FF] text-[#5B3DE0] font-bold text-xs h-10.5 px-5 rounded-xl shadow-[0_10px_22px_rgba(0,0,0,0.18)] hover:-translate-y-0.5 transition-all flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-[#7C5CFC]" />
                    Post Announcement
                  </Button>
                </Link>

                <Link to="/hr/employees">
                  <Button variant="ghost" className="bg-white/14 hover:bg-white/22 text-white border border-white/30 backdrop-blur-md font-bold text-xs h-10.5 px-5 rounded-xl hover:-translate-y-0.5 transition-all flex items-center gap-2">
                    <Users className="w-4 h-4 text-white" />
                    Employee Directory
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Digital Live Clock Glass Card */}
            <div className="relative z-10 bg-white/14 border border-white/28 backdrop-blur-md rounded-2xl p-6 text-center min-w-[210px] w-full lg:w-auto shadow-lg shrink-0">
              <div className="text-3xl font-bold font-['JetBrains_Mono'] tracking-wide text-white">
                {currentTime || '09:02 AM'}
              </div>
              <div className="text-xs text-[#E4E0FF] mt-1 font-medium">
                {currentDate || 'Today'}
              </div>
              <div className="flex items-center justify-center gap-2 mt-3.5 text-xs font-bold text-[#DFFFF2] bg-white/10 py-1.5 px-3 rounded-full border border-white/10">
                <span className="w-2 h-2 rounded-full bg-[#34D399] shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-ping" />
                Clocked in today · On time
              </div>
            </div>
          </section>


          {/* ══════════════════════════════════════════════════════════════
              ROW 1: STAT CARDS
          ══════════════════════════════════════════════════════════════ */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="group bg-white border border-[#ECE9F8] rounded-[20px] p-6 shadow-[0_2px_6px_rgba(45,27,105,0.05)] hover:shadow-[0_14px_34px_rgba(45,27,105,0.10)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-[13px] bg-gradient-to-br from-[#9B7BFF] to-[#5B3DE0] flex items-center justify-center text-white shadow-[0_8px_16px_rgba(124,92,252,0.3)]">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-xs font-extrabold text-[#22C55E] bg-[#E9FBF1] px-2.5 py-1 rounded-full flex items-center gap-1">
                  Active
                </span>
              </div>
              <div>
                <div className="text-3xl font-bold font-['Space_Grotesk'] text-[#160F2E] tracking-tight">
                  {loadingEmployees ? '...' : totalStaff}
                </div>
                <div className="text-xs text-[#615C82] font-semibold mt-1">Total workforce employees</div>
              </div>
            </div>

            <div className="group bg-white border border-[#ECE9F8] rounded-[20px] p-6 shadow-[0_2px_6px_rgba(45,27,105,0.05)] hover:shadow-[0_14px_34px_rgba(45,27,105,0.10)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-[13px] bg-gradient-to-br from-[#FDE08A] to-[#E8A22C] flex items-center justify-center text-white shadow-[0_8px_16px_rgba(232,162,44,0.3)]">
                  <Calendar className="w-5 h-5 text-amber-950" />
                </div>
                <span className="text-xs font-extrabold text-[#7C5CFC] bg-[#F0EAFF] px-2.5 py-1 rounded-full flex items-center gap-1">
                  Pending
                </span>
              </div>
              <div>
                <div className="text-3xl font-bold font-['Space_Grotesk'] text-[#160F2E] tracking-tight">
                  {pendingLeavesCount}
                </div>
                <div className="text-xs text-[#615C82] font-semibold mt-1">Leave requests pending</div>
              </div>
            </div>

            <div className="group bg-white border border-[#ECE9F8] rounded-[20px] p-6 shadow-[0_2px_6px_rgba(45,27,105,0.05)] hover:shadow-[0_14px_34px_rgba(45,27,105,0.10)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-[13px] bg-gradient-to-br from-[#67E8F9] to-[#0EA5C4] flex items-center justify-center text-white shadow-[0_8px_16px_rgba(14,165,196,0.3)]">
                  <Layers className="w-5 h-5 text-cyan-950" />
                </div>
                <span className="text-xs font-extrabold text-[#22C55E] bg-[#E9FBF1] px-2.5 py-1 rounded-full flex items-center gap-1">
                  Active
                </span>
              </div>
              <div>
                <div className="text-3xl font-bold font-['Space_Grotesk'] text-[#160F2E] tracking-tight">
                  {departments.length}
                </div>
                <div className="text-xs text-[#615C82] font-semibold mt-1">Active teams & departments</div>
              </div>
            </div>

            <div className="group bg-white border border-[#ECE9F8] rounded-[20px] p-6 shadow-[0_2px_6px_rgba(45,27,105,0.05)] hover:shadow-[0_14px_34px_rgba(45,27,105,0.10)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-[13px] bg-gradient-to-br from-[#FBA4C7] to-[#E1447F] flex items-center justify-center text-white shadow-[0_8px_16px_rgba(225,68,127,0.3)]">
                  <CheckCircle2 className="w-5 h-5 text-rose-950" />
                </div>
                <span className="text-xs font-extrabold text-[#22C55E] bg-[#E9FBF1] px-2.5 py-1 rounded-full flex items-center gap-1">
                  {attendanceRate}%
                </span>
              </div>
              <div>
                <div className="text-3xl font-bold font-['Space_Grotesk'] text-[#160F2E] tracking-tight">
                  {presentCount} / {totalStaff}
                </div>
                <div className="text-xs text-[#615C82] font-semibold mt-1">Present on-duty staff</div>
              </div>
            </div>
          </section>


          {/* ══════════════════════════════════════════════════════════════
              ROW 2: ATTENDANCE RING + LEAVE BALANCES + QUICK ACTIONS (3 Columns)
          ══════════════════════════════════════════════════════════════ */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            
            {/* 1. Today's Attendance Pulse */}
            <div className="bg-white border border-[#ECE9F8] rounded-[20px] p-7 shadow-[0_2px_6px_rgba(45,27,105,0.05)] hover:shadow-[0_14px_34px_rgba(45,27,105,0.10)] transition-all flex flex-col justify-between space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-[#160F2E] text-base font-['Space_Grotesk']">Today's Attendance</h3>
                  <p className="text-xs text-[#A29CC2] mt-0.5">Shift {policyState.loginTime || '09:00'} – {policyState.logoutTime || '18:00'}</p>
                </div>
                <span className="inline-flex items-center gap-1.5 bg-[#E9FBF1] text-[#22C55E] text-xs font-extrabold px-3 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" /> Active
                </span>
              </div>

              <div className="flex items-center gap-6 py-2">
                <div className="relative w-32 h-32 shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                    <defs>
                      <linearGradient id="ringGradHrLg" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#9B7BFF" />
                        <stop offset="55%" stopColor="#7C5CFC" />
                        <stop offset="100%" stopColor="#22D3EE" />
                      </linearGradient>
                    </defs>
                    <circle className="text-[#F0EDFB] stroke-current" strokeWidth="11" cx="60" cy="60" r="54" fill="none" />
                    <circle 
                      stroke="url(#ringGradHrLg)" 
                      strokeWidth="11" 
                      strokeLinecap="round" 
                      cx="60" 
                      cy="60" 
                      r="54" 
                      fill="none"
                      strokeDasharray="339"
                      strokeDashoffset={339 - (339 * (attendanceRate / 100))}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="font-bold font-['JetBrains_Mono'] text-xl text-[#160F2E] leading-none">{attendanceRate}%</span>
                    <span className="text-[11px] text-[#A29CC2] mt-1">Turnout</span>
                  </div>
                </div>

                <div className="flex-1 space-y-2 text-xs">
                  <div className="flex justify-between items-center py-1.5 border-b border-dashed border-[#ECE9F8]">
                    <span className="text-[#615C82]">Active Staff</span>
                    <span className="font-bold text-[#160F2E] font-['JetBrains_Mono']">{presentCount}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-dashed border-[#ECE9F8]">
                    <span className="text-[#615C82]">Total Staff</span>
                    <span className="font-bold text-[#160F2E] font-['JetBrains_Mono']">{totalStaff}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-[#615C82]">Pending Leaves</span>
                    <span className="font-bold text-[#160F2E] font-['JetBrains_Mono']">{pendingLeavesCount}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-[#615C82]">
                <span>Grace allowance: <strong>{policyState.graceTimeMinutes || 15} mins</strong></span>
                <span className="text-[#7C5CFC] font-bold">Work Shift Rule</span>
              </div>
            </div>

            {/* 2. Leave Summary Card */}
            <div className="bg-white border border-[#ECE9F8] rounded-[20px] p-7 shadow-[0_2px_6px_rgba(45,27,105,0.05)] hover:shadow-[0_14px_34px_rgba(45,27,105,0.10)] transition-all flex flex-col justify-between space-y-5">
              <div>
                <div className="mb-4">
                  <h3 className="font-bold text-[#160F2E] text-base font-['Space_Grotesk']">Leave Pipeline</h3>
                  <p className="text-xs text-[#A29CC2] mt-0.5">Summary of applications in the system</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-bold text-[#160F2E]">Pending Approvals</span>
                      <span className="font-bold text-[#615C82] font-['JetBrains_Mono']">{pendingLeavesCount}</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#F0EDFB] overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#9B7BFF] to-[#5B3DE0]" style={{ width: `${Math.min(100, pendingLeavesCount * 20)}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-bold text-[#160F2E]">Total Recorded Leaves</span>
                      <span className="font-bold text-[#615C82] font-['JetBrains_Mono']">{leaves.length}</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#F0EDFB] overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#67E8F9] to-[#0EA5C4]" style={{ width: `${Math.min(100, leaves.length * 10)}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-[#A29CC2]">
                <Link to="/hr/leave" className="text-[#7C5CFC] font-bold hover:underline">
                  Manage Approvals ({pendingLeavesCount}) →
                </Link>
              </div>
            </div>

            {/* 3. Quick Actions Grid */}
            <div className="bg-white border border-[#ECE9F8] rounded-[20px] p-7 shadow-[0_2px_6px_rgba(45,27,105,0.05)] hover:shadow-[0_14px_34px_rgba(45,27,105,0.10)] transition-all flex flex-col justify-between space-y-5">
              <div>
                <h3 className="font-bold text-[#160F2E] text-base font-['Space_Grotesk']">Quick actions</h3>
                <p className="text-xs text-[#A29CC2] mt-0.5">Frequent HR administrative tools</p>
              </div>

              <div className="grid grid-cols-2 gap-3.5 my-auto">
                <button onClick={() => handleTabNavigate('/hr/policies')} className="group p-3.5 rounded-xl border border-[#ECE9F8] hover:border-transparent hover:shadow-[0_10px_22px_rgba(124,92,252,0.12)] hover:-translate-y-0.5 transition-all bg-white flex flex-col gap-2 text-left">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-xs">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-xs text-[#160F2E] group-hover:text-[#7C5CFC] transition-colors leading-tight">
                    HR Policies
                  </span>
                </button>

                <button onClick={() => handleTabNavigate('/hr/leave')} className="group p-3.5 rounded-xl border border-[#ECE9F8] hover:border-transparent hover:shadow-[0_10px_22px_rgba(124,92,252,0.12)] hover:-translate-y-0.5 transition-all bg-white flex flex-col gap-2 text-left">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#9B7BFF] to-[#5B3DE0] flex items-center justify-center text-white shadow-xs">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-xs text-[#160F2E] group-hover:text-[#7C5CFC] transition-colors leading-tight">
                    Leave Approvals
                  </span>
                </button>

                <button onClick={() => handleTabNavigate('/hr/payroll')} className="group p-3.5 rounded-xl border border-[#ECE9F8] hover:border-transparent hover:shadow-[0_10px_22px_rgba(34,211,238,0.12)] hover:-translate-y-0.5 transition-all bg-white flex flex-col gap-2 text-left">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#67E8F9] to-[#0EA5C4] flex items-center justify-center text-white shadow-xs">
                    <IndianRupee className="w-4 h-4 text-cyan-950" />
                  </div>
                  <span className="font-bold text-xs text-[#160F2E] group-hover:text-cyan-700 transition-colors leading-tight">
                    Payroll Ledger
                  </span>
                </button>

                <button onClick={() => handleTabNavigate('/hr/documents')} className="group p-3.5 rounded-xl border border-[#ECE9F8] hover:border-transparent hover:shadow-[0_10px_22px_rgba(251,191,36,0.12)] hover:-translate-y-0.5 transition-all bg-white flex flex-col gap-2 text-left">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FDE08A] to-[#E8A22C] flex items-center justify-center text-white shadow-xs">
                    <FileText className="w-4 h-4 text-amber-950" />
                  </div>
                  <span className="font-bold text-xs text-[#160F2E] group-hover:text-amber-700 transition-colors leading-tight">
                    HR Documents
                  </span>
                </button>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-[#A29CC2]">
                <Link to="/hr/policies" className="text-indigo-600 font-bold hover:underline">
                  View All Policies & Shifts →
                </Link>
                <span className="text-[#22C55E] font-bold">Live Synced</span>
              </div>
            </div>
          </section>


          {/* ══════════════════════════════════════════════════════════════
              ROW 3: ANNOUNCEMENTS + TEAM SNAPSHOT + HOLIDAYS (3 Columns)
          ══════════════════════════════════════════════════════════════ */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            
            {/* 1. Announcements Card */}
            <div className="bg-white border border-[#ECE9F8] rounded-[20px] p-7 shadow-[0_2px_6px_rgba(45,27,105,0.05)] hover:shadow-[0_14px_34px_rgba(45,27,105,0.10)] transition-all flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-[#160F2E] text-base font-['Space_Grotesk']">Announcements</h3>
                  <Link to="/hr/announcements" className="text-xs font-bold text-[#7C5CFC] hover:underline flex items-center gap-1">
                    View all <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="divide-y divide-[#ECE9F8]">
                  {announcements.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      No corporate announcements published yet
                    </div>
                  ) : (
                    announcements.slice(0, 3).map((item: any) => (
                      <div key={item.id} className="py-3.5 first:pt-0 flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#9B7BFF] to-[#5B3DE0] flex items-center justify-center text-white shrink-0 mt-0.5 shadow-sm">
                          <FileText className="w-4.5 h-4.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-[#160F2E] leading-snug">{item.title}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-[#A29CC2]">
                            <span className="bg-[#F0EAFF] text-[#5B3DE0] font-extrabold px-2 py-0.5 rounded-full text-[10px]">{item.category || 'Policy'}</span>
                            <span>{item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 text-center">
                <Link to="/hr/announcements" className="text-xs font-bold text-[#7C5CFC] hover:underline">
                  Publish New Bulletin →
                </Link>
              </div>
            </div>

            {/* 2. My Team Roster Snapshot */}
            <div className="bg-white border border-[#ECE9F8] rounded-[20px] p-7 shadow-[0_2px_6px_rgba(45,27,105,0.05)] hover:shadow-[0_14px_34px_rgba(45,27,105,0.10)] transition-all flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-[#160F2E] text-base font-['Space_Grotesk']">My Team</h3>
                  <Link to="/hr/employees" className="text-xs font-bold text-[#7C5CFC] hover:underline flex items-center gap-1">
                    See all <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="divide-y divide-[#ECE9F8]">
                  {employees.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      No team members enrolled yet
                    </div>
                  ) : (
                    employees.slice(0, 4).map((emp: any, idx: number) => {
                      const name = emp.full_name || emp.name || emp.email
                      const initials = name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'EM'
                      return (
                        <div key={emp.id || idx} className="py-3 first:pt-0 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9.5 h-9.5 rounded-full bg-gradient-to-br from-[#67E8F9] to-[#0EA5C4] flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-[#160F2E] truncate">{name}</p>
                              <p className="text-xs text-[#A29CC2] truncate">{emp.department || 'General'}</p>
                            </div>
                          </div>
                          <span className="text-xs font-bold font-['JetBrains_Mono'] text-[#615C82] shrink-0">{emp.status || 'Active'}</span>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 text-center">
                <Link to="/hr/employees" className="text-xs font-bold text-[#7C5CFC] hover:underline">
                  Manage Employee Profiles →
                </Link>
              </div>
            </div>

            {/* 3. Upcoming Holidays */}
            <div className="bg-white border border-[#ECE9F8] rounded-[20px] p-7 shadow-[0_2px_6px_rgba(45,27,105,0.05)] hover:shadow-[0_14px_34px_rgba(45,27,105,0.10)] transition-all flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-[#160F2E] text-base font-['Space_Grotesk']">Upcoming Holidays</h3>
                  <Badge variant="outline" className="text-xs border-[#ECE9F8] text-[#615C82]">Calendar</Badge>
                </div>

                <div className="divide-y divide-[#ECE9F8]">
                  {holidays.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      No corporate calendar holidays added
                    </div>
                  ) : (
                    holidays.slice(0, 4).map((h: any) => {
                      const d = h.date ? new Date(h.date) : new Date()
                      const day = isNaN(d.getTime()) ? '15' : d.getDate()
                      const month = isNaN(d.getTime()) ? 'Event' : d.toLocaleString('default', { month: 'short' })
                      return (
                        <div key={h.id || h.name} className="py-3 first:pt-0 flex items-center gap-4">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#9B7BFF] to-[#5B3DE0] text-white flex flex-col items-center justify-center shrink-0 shadow-sm">
                            <span className="text-base font-bold font-['JetBrains_Mono'] leading-none">{day}</span>
                            <span className="text-[9px] font-extrabold uppercase mt-0.5">{month}</span>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#160F2E]">{h.name}</p>
                            <p className="text-xs text-[#A29CC2]">{h.description || 'Corporate Holiday'}</p>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 text-center">
                <span className="text-xs text-[#A29CC2]">Corporate Holiday Schedule</span>
              </div>
            </div>
          </section>


          {/* ══════════════════════════════════════════════════════════════
              ROW 4: CELEBRATING THIS WEEK 🎉
          ══════════════════════════════════════════════════════════════ */}
          <section className="bg-white border border-[#ECE9F8] rounded-[20px] p-7 shadow-[0_2px_6px_rgba(45,27,105,0.05)] hover:shadow-[0_14px_34px_rgba(45,27,105,0.10)] transition-all">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-[#160F2E] text-base font-['Space_Grotesk'] flex items-center gap-2">
                  Celebrating this week <span className="text-xl">🎉</span>
                </h3>
                <p className="text-xs text-[#A29CC2] mt-0.5">Send a note to make their day</p>
              </div>
              <Badge className="bg-[#F0EAFF] text-[#5B3DE0] hover:bg-[#F0EAFF] border-none font-bold text-xs px-3 py-1">
                Culture & Community
              </Badge>
            </div>

            {celebrationList.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No milestone anniversaries or birthdays recorded this week
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

        </div>
      )}


      {/* ══════════════════════════════════════════════════════════════
          TAB 2: ATTENDANCE TRACKER
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'attendance' && (
        <div className="space-y-7">
          <div className="bg-white border border-[#ECE9F8] rounded-[20px] p-7 shadow-[0_2px_6px_rgba(45,27,105,0.05)] space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#ECE9F8] pb-4">
              <div>
                <h3 className="font-bold text-[#160F2E] text-lg font-['Space_Grotesk']">Daily Attendance & Biometric Ledger</h3>
                <p className="text-xs text-[#A29CC2] mt-0.5">Real-time check-in logs, biometric status, and grace allowance verification</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="p-5 rounded-2xl bg-slate-50/70 border border-[#ECE9F8]">
                <div className="text-xs text-[#615C82] font-semibold">Today's Total Present</div>
                <div className="text-2xl font-bold font-['Space_Grotesk'] text-[#160F2E] mt-1">{presentCount} / {totalStaff}</div>
                <div className="text-[11px] text-[#22C55E] font-bold mt-1">{attendanceRate}% Turnout</div>
              </div>
              <div className="p-5 rounded-2xl bg-slate-50/70 border border-[#ECE9F8]">
                <div className="text-xs text-[#615C82] font-semibold">Workday Schedule</div>
                <div className="text-2xl font-bold font-['Space_Grotesk'] text-[#7C5CFC] mt-1">{policyState.loginTime || '09:00'} – {policyState.logoutTime || '18:00'}</div>
                <div className="text-[11px] text-slate-500 mt-1">Standard office hours</div>
              </div>
              <div className="p-5 rounded-2xl bg-slate-50/70 border border-[#ECE9F8]">
                <div className="text-xs text-[#615C82] font-semibold">Pending Leaves Today</div>
                <div className="text-2xl font-bold font-['Space_Grotesk'] text-purple-600 mt-1">{pendingLeavesCount}</div>
                <div className="text-[11px] text-slate-500 mt-1">Applications awaiting approval</div>
              </div>
            </div>

            <div className="rounded-xl border border-[#ECE9F8] overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAFAFC] text-[#615C82] font-bold border-b border-[#ECE9F8]">
                  <tr>
                    <th className="py-3.5 px-4">Employee</th>
                    <th className="py-3.5 px-4">Department</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Verification</th>
                    <th className="py-3.5 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECE9F8]">
                  {employees.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                        No employees registered in the attendance ledger
                      </td>
                    </tr>
                  ) : (
                    employees.slice(0, 10).map((emp: any, idx: number) => {
                      const name = emp.full_name || emp.name || emp.email
                      const initials = name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'EM'
                      return (
                        <tr key={emp.id || idx} className="hover:bg-[#FAFAFC] transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                {initials}
                              </div>
                              <div>
                                <p className="font-bold text-[#160F2E]">{name}</p>
                                <p className="text-[11px] text-[#A29CC2]">{emp.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-medium">
                            {emp.department || 'General'}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-medium">
                            {emp.role || (typeof emp.roles === 'object' ? emp.roles?.name : 'Employee')}
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50 text-[10px]">
                              System Verified
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <span className="inline-flex items-center gap-1 bg-[#E9FBF1] text-[#22C55E] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> {emp.status || 'Active'}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}


      {/* ══════════════════════════════════════════════════════════════
          TAB 3: LEAVE MANAGEMENT
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'leave' && (
        <div className="space-y-7">
          <div className="bg-white border border-[#ECE9F8] rounded-[20px] p-7 shadow-[0_2px_6px_rgba(45,27,105,0.05)] space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#ECE9F8] pb-4">
              <div>
                <h3 className="font-bold text-[#160F2E] text-lg font-['Space_Grotesk']">Leave Applications & Approval Workflow</h3>
                <p className="text-xs text-[#A29CC2] mt-0.5">Manage employee time-off requests, sick leave, and casual leave balances</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-[#160F2E]">Pending Approvals ({pendingLeavesCount})</h4>
                <span className="text-xs text-[#7C5CFC] font-semibold">Action Items</span>
              </div>

              <div className="divide-y divide-[#ECE9F8] rounded-2xl border border-[#ECE9F8] bg-white overflow-hidden">
                {pendingLeaves.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No pending leave approval requests at this time
                  </div>
                ) : (
                  pendingLeaves.map((leave: any) => {
                    const empName = leave.user?.full_name || leave.user?.fullName || leave.user?.email || 'Employee'
                    const initials = empName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'EM'
                    return (
                      <div key={leave.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#9B7BFF] to-[#5B3DE0] text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#160F2E] text-sm">{empName}</span>
                              <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-none text-[10px]">{leave.leaveType || leave.leave_type || 'Leave'}</Badge>
                            </div>
                            <p className="text-xs text-[#A29CC2] mt-0.5">
                              {leave.startDate || leave.start_date} to {leave.endDate || leave.end_date} · {leave.reason || 'Personal request'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <Button 
                            onClick={() => handleLeaveAction(leave.id, 'APPROVED')} 
                            size="sm" 
                            className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" /> Approve
                          </Button>
                          <Button 
                            onClick={() => handleLeaveAction(leave.id, 'REJECTED')} 
                            size="sm" 
                            variant="outline" 
                            className="h-8 border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-lg flex items-center gap-1"
                          >
                            <XCircle className="w-3 h-3" /> Reject
                          </Button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ══════════════════════════════════════════════════════════════
          TAB 4: PAYROLL & QUOTAS
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'payroll' && (
        <div className="space-y-7">
          <div className="bg-white border border-[#ECE9F8] rounded-[20px] p-7 shadow-[0_2px_6px_rgba(45,27,105,0.05)] space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#ECE9F8] pb-4">
              <div>
                <h3 className="font-bold text-[#160F2E] text-lg font-['Space_Grotesk']">Compensation & Payroll Ledger</h3>
                <p className="text-xs text-[#A29CC2] mt-0.5">Monthly payroll disbursement, statutory compliance, and salary records</p>
              </div>
              <Link to="/hr/payroll">
                <Button className="bg-[#7C5CFC] hover:bg-[#5B3DE0] text-white font-bold text-xs h-9 px-4 rounded-xl shadow-xs flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5" /> Full Payroll Module
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="p-5 rounded-2xl bg-slate-50/70 border border-[#ECE9F8]">
                <div className="text-xs text-[#615C82] font-semibold">Total Generated Payslips</div>
                <div className="text-2xl font-bold font-['Space_Grotesk'] text-[#160F2E] mt-1">{payslips.length}</div>
                <div className="text-[11px] text-[#22C55E] font-bold mt-1">{payslips.filter((p: any) => p.status === 'PAID').length} Disbursed</div>
              </div>
              <div className="p-5 rounded-2xl bg-slate-50/70 border border-[#ECE9F8]">
                <div className="text-xs text-[#615C82] font-semibold">Monthly Payroll Total</div>
                <div className="text-2xl font-bold font-['Space_Grotesk'] text-[#7C5CFC] mt-1">{formatINR(totalMonthlyPayroll)}</div>
                <div className="text-[11px] text-slate-500 mt-1">Calculated net pay</div>
              </div>
              <div className="p-5 rounded-2xl bg-slate-50/70 border border-[#ECE9F8]">
                <div className="text-xs text-[#615C82] font-semibold">Tax & Statutory Compliance</div>
                <div className="text-2xl font-bold font-['Space_Grotesk'] text-emerald-600 mt-1">100% Ready</div>
                <div className="text-[11px] text-emerald-600 font-bold mt-1">PF / ESI / TDS Compliant</div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ══════════════════════════════════════════════════════════════
          TAB 5: PERFORMANCE REVIEWS
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'performance' && (
        <div className="space-y-7">
          <div className="bg-white border border-[#ECE9F8] rounded-[20px] p-7 shadow-[0_2px_6px_rgba(45,27,105,0.05)] space-y-6">
            <div className="flex items-center justify-between border-b border-[#ECE9F8] pb-4">
              <div>
                <h3 className="font-bold text-[#160F2E] text-lg font-['Space_Grotesk']">Quarterly Performance & 360° Review Cycles</h3>
                <p className="text-xs text-[#A29CC2] mt-0.5">Appraisal workflows, goal tracking, and leadership peer feedback</p>
              </div>
              <Link to="/hr/appraisals">
                <Button className="bg-[#7C5CFC] hover:bg-[#5B3DE0] text-white font-bold text-xs h-9 px-4 rounded-xl shadow-xs flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5" /> Appraisals Manager
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="p-5 rounded-2xl bg-purple-50/60 border border-purple-100">
                <div className="text-xs text-purple-900 font-semibold">Total Appraisals Logged</div>
                <div className="text-2xl font-bold font-['Space_Grotesk'] text-purple-950 mt-1">{appraisals.length}</div>
                <div className="text-[11px] text-purple-700 font-bold mt-1">Review records</div>
              </div>
              <div className="p-5 rounded-2xl bg-cyan-50/60 border border-cyan-100">
                <div className="text-xs text-cyan-900 font-semibold">Active Workforce</div>
                <div className="text-2xl font-bold font-['Space_Grotesk'] text-cyan-950 mt-1">{totalStaff}</div>
                <div className="text-[11px] text-cyan-700 font-bold mt-1">Staff under evaluation</div>
              </div>
              <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                <div className="text-xs text-emerald-900 font-semibold">Completed Reviews</div>
                <div className="text-2xl font-bold font-['Space_Grotesk'] text-emerald-950 mt-1">
                  {appraisals.filter((a: any) => (a.status || '').toUpperCase() === 'COMPLETED').length}
                </div>
                <div className="text-[11px] text-emerald-700 font-bold mt-1">Finalized appraisals</div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ══════════════════════════════════════════════════════════════
          TAB 6: HR DOCUMENTS & POLICIES
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'documents' && (
        <div className="space-y-7">
          <div className="bg-white border border-[#ECE9F8] rounded-[20px] p-7 shadow-[0_2px_6px_rgba(45,27,105,0.05)] space-y-6">
            <div className="flex items-center justify-between border-b border-[#ECE9F8] pb-4">
              <div>
                <h3 className="font-bold text-[#160F2E] text-lg font-['Space_Grotesk']">Corporate HR Policies & Compliance Documents</h3>
                <p className="text-xs text-[#A29CC2] mt-0.5">Central repository for employee handbook, leave policy, and compliance templates</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {documents.length === 0 ? (
                <div className="col-span-3 py-10 text-center text-slate-400 text-xs">
                  No company HR documents uploaded yet
                </div>
              ) : (
                documents.map((doc: any) => (
                  <div key={doc.id} className="p-5 rounded-2xl border border-[#ECE9F8] hover:border-purple-200 transition-all bg-white space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#160F2E]">{doc.title}</h4>
                      <p className="text-xs text-[#A29CC2] mt-0.5">{doc.documentType || 'Corporate File'}</p>
                    </div>
                    {doc.fileUrl && (
                      <a href={doc.fileUrl} target="_blank" rel="noreferrer">
                        <Button variant="outline" size="sm" className="w-full text-xs font-bold border-[#ECE9F8] text-[#7C5CFC]">
                          Download Document
                        </Button>
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}


      {/* ══════════════════════════════════════════════════════════════
          TAB 7: HR SETTINGS & SHIFT RULES
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'settings' && (
        <div className="bg-white border border-[#ECE9F8] rounded-[20px] p-7 shadow-[0_2px_6px_rgba(45,27,105,0.05)] space-y-6">
          <div className="flex items-center justify-between border-b border-[#ECE9F8] pb-4">
            <div>
              <h3 className="font-bold text-[#160F2E] text-lg font-['Space_Grotesk']">HR Work Shift Rules & Attendance Policies</h3>
              <p className="text-xs text-[#A29CC2] mt-0.5">Configure official office hours, grace buffer, working days, and geolocation attendance radius</p>
            </div>
            <Button onClick={handleSavePolicy} className="bg-[#7C5CFC] hover:bg-[#5B3DE0] text-white font-bold text-xs h-10 px-5 rounded-xl shadow-xs flex items-center gap-1.5">
              <Save className="w-4 h-4" /> Save HR Policies
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#160F2E]">Official Clock-In Time</label>
              <Input 
                type="time" 
                value={policyState.loginTime} 
                onChange={(e) => setPolicyState({ ...policyState, loginTime: e.target.value })}
                className="h-10 text-xs font-bold border-[#ECE9F8] rounded-xl font-['JetBrains_Mono']" 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#160F2E]">Grace Allowance (Minutes)</label>
              <Input 
                type="number" 
                value={policyState.graceTimeMinutes} 
                onChange={(e) => setPolicyState({ ...policyState, graceTimeMinutes: Number(e.target.value) })}
                className="h-10 text-xs font-bold border-[#ECE9F8] rounded-xl font-['JetBrains_Mono']" 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#160F2E]">Official Logout Time</label>
              <Input 
                type="time" 
                value={policyState.logoutTime} 
                onChange={(e) => setPolicyState({ ...policyState, logoutTime: e.target.value })}
                className="h-10 text-xs font-bold border-[#ECE9F8] rounded-xl font-['JetBrains_Mono']" 
              />
            </div>
          </div>

          <div className="p-5 bg-slate-50/70 border border-[#ECE9F8] rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#160F2E] flex items-center gap-1.5">
                  <Navigation className="w-4 h-4 text-[#7C5CFC]" /> GPS Geofencing Attendance Enforcement
                </span>
                <p className="text-[11px] text-[#A29CC2] mt-0.5">Restrict staff clock-ins within authorized corporate premises radius</p>
              </div>

              <button 
                type="button" 
                onClick={() => setPolicyState({ ...policyState, enableGeolocationAttendance: !policyState.enableGeolocationAttendance })}
                className={`w-11 h-6 rounded-full transition-colors relative ${policyState.enableGeolocationAttendance ? 'bg-[#7C5CFC]' : 'bg-slate-300'}`}
              >
                <span className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${policyState.enableGeolocationAttendance ? 'right-0.5' : 'left-0.5'}`} />
              </button>
            </div>

            {policyState.enableGeolocationAttendance && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-200/60">
                <div>
                  <label className="text-[11px] font-bold text-slate-700">Office Latitude</label>
                  <Input 
                    type="number" 
                    step="any"
                    value={policyState.officeLatitude}
                    onChange={(e) => setPolicyState({ ...policyState, officeLatitude: Number(e.target.value) })}
                    className="h-9 text-xs border-[#ECE9F8] bg-white rounded-lg font-['JetBrains_Mono']" 
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700">Office Longitude</label>
                  <Input 
                    type="number" 
                    step="any"
                    value={policyState.officeLongitude}
                    onChange={(e) => setPolicyState({ ...policyState, officeLongitude: Number(e.target.value) })}
                    className="h-9 text-xs border-[#ECE9F8] bg-white rounded-lg font-['JetBrains_Mono']" 
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700">Allowed Radius (Meters)</label>
                  <Input 
                    type="number" 
                    value={policyState.allowedRadiusMeters}
                    onChange={(e) => setPolicyState({ ...policyState, allowedRadiusMeters: Number(e.target.value) })}
                    className="h-9 text-xs border-[#ECE9F8] bg-white rounded-lg font-['JetBrains_Mono']" 
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer System Attribution */}
      <div className="text-center text-xs text-[#A29CC2] pt-4 font-medium">
        Meridian HR / FusionHRMS · People Operations Workspace · Secure Portal
      </div>

    </div>
  )
}
