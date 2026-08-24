import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Users, IndianRupee, ClipboardList, CalendarCheck2, TrendingUp,
  UserCheck, UserX, Clock, CheckCircle2, XCircle, FileText,
  ArrowRight, Loader2, AlertCircle, Megaphone, Calendar
} from 'lucide-react'
import { api, safeArray } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useNavigate } from 'react-router-dom'

interface DashboardStats {
  totalEmployees: number
  activeEmployees: number
  inactiveEmployees: number
  pendingLeaves: number
  approvedLeaves: number
  rejectedLeaves: number
  todayCheckIns: number
  generatedPayslips: number
  paidPayslips: number
}

export default function HrDashboard() {
  const { profile } = useAuthStore()
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0, activeEmployees: 0, inactiveEmployees: 0,
    pendingLeaves: 0, approvedLeaves: 0, rejectedLeaves: 0,
    todayCheckIns: 0, generatedPayslips: 0, paidPayslips: 0,
  })
  const [recentLeaves, setRecentLeaves] = useState<any[]>([])
  const [recentEmployees, setRecentEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true)
      try {
        // Fetch employees
        const empRes: any = await api.get('/employee')
        const employees = safeArray(empRes, 'employees')
        const active = employees.filter((e: any) => e.employeeProfile?.status !== 'INACTIVE')
        const inactive = employees.filter((e: any) => e.employeeProfile?.status === 'INACTIVE')
        setRecentEmployees(employees.slice(0, 5))

        // Fetch all leaves
        let allLeaves: any[] = []
        try {
          const leavesRes: any = await api.get('/employee/leaves/all')
          allLeaves = safeArray(leavesRes, 'leaves')
        } catch (e) {}
        const pendingLeaves = allLeaves.filter((l: any) => l.status === 'PENDING')
        const approvedLeaves = allLeaves.filter((l: any) => l.status === 'APPROVED')
        const rejectedLeaves = allLeaves.filter((l: any) => l.status === 'REJECTED')
        setRecentLeaves(pendingLeaves.slice(0, 5))

        // Fetch today's attendance
        let todayCheckIns = 0
        try {
          const attRes: any = await api.get('/employee/attendance')
          const attendance = safeArray(attRes, 'attendance')
          const today = new Date().toISOString().split('T')[0]
          todayCheckIns = attendance.filter((a: any) => a.date === today || (a.date && a.date.startsWith(today))).length
        } catch (e) {}

        // Fetch payslips
        let payslips: any[] = []
        try {
          const payRes: any = await api.get('/payroll/payslips')
          payslips = safeArray(payRes, 'payslips')
        } catch (e) {}
        const generatedPayslips = payslips.filter((p: any) => p.status === 'GENERATED').length
        const paidPayslips = payslips.filter((p: any) => p.status === 'PAID').length

        setStats({
          totalEmployees: employees.length,
          activeEmployees: active.length,
          inactiveEmployees: inactive.length,
          pendingLeaves: pendingLeaves.length,
          approvedLeaves: approvedLeaves.length,
          rejectedLeaves: rejectedLeaves.length,
          todayCheckIns,
          generatedPayslips,
          paidPayslips,
        })
      } catch (err) {
        console.error('Dashboard fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
          <p className="text-sm font-medium text-slate-500">Loading HR Dashboard...</p>
        </div>
      </div>
    )
  }

  const kpiCards = [
    {
      title: 'Total Employees',
      value: stats.totalEmployees,
      subtitle: `${stats.activeEmployees} active · ${stats.inactiveEmployees} inactive`,
      icon: Users,
      gradient: 'from-amber-500 to-orange-500',
      borderColor: 'border-amber-100/40',
    },
    {
      title: 'Pending Leave Requests',
      value: stats.pendingLeaves,
      subtitle: `${stats.approvedLeaves} approved · ${stats.rejectedLeaves} rejected`,
      icon: CalendarCheck2,
      gradient: 'from-rose-500 to-pink-500',
      borderColor: 'border-rose-100/40',
    },
    {
      title: "Today's Attendance",
      value: stats.todayCheckIns,
      subtitle: `${stats.totalEmployees > 0 ? Math.round((stats.todayCheckIns / stats.totalEmployees) * 100) : 0}% check-in rate`,
      icon: Clock,
      gradient: 'from-emerald-500 to-teal-500',
      borderColor: 'border-emerald-100/40',
    },
    {
      title: 'Payroll Status',
      value: stats.generatedPayslips + stats.paidPayslips,
      subtitle: `${stats.generatedPayslips} generated · ${stats.paidPayslips} paid`,
      icon: IndianRupee,
      gradient: 'from-blue-500 to-indigo-500',
      borderColor: 'border-blue-100/40',
    },
  ]

  return (
    <div className="space-y-6 fade-in duration-500 text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">
            HR Dashboard
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Welcome back, {profile?.full_name || (profile as any)?.fullName || profile?.email || 'HR Manager'}. Here's your workforce overview.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-bold px-3 py-1">
            <Calendar className="h-3.5 w-3.5 mr-1.5" />
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Badge>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi, i) => (
          <Card key={i} className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 group cursor-default">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 pt-4 px-5">
              <CardTitle className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                {kpi.title}
              </CardTitle>
              <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${kpi.gradient} flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow`}>
                <kpi.icon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <div className="text-3xl font-extrabold text-slate-950">{kpi.value}</div>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">{kpi.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-5 lg:grid-cols-5">
        {/* Pending Leave Requests */}
        <Card className="lg:col-span-3 bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">Pending Leave Requests</CardTitle>
                <CardDescription className="text-xs">Requests awaiting your approval</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-xs font-semibold border-amber-200 text-amber-700 hover:bg-amber-50"
                onClick={() => navigate('/hr/leaves')}
              >
                View All <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {recentLeaves.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-400 mb-2" />
                <p className="text-sm font-semibold text-slate-600">All caught up!</p>
                <p className="text-xs text-slate-400">No pending leave requests</p>
              </div>
            ) : (
              recentLeaves.map((leave: any) => (
                <div key={leave.id} className="flex items-center justify-between p-3 bg-slate-50/60 rounded-xl border border-slate-100 hover:bg-amber-50/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                      <span className="text-xs font-bold text-amber-700">
                        {(leave.user?.full_name || leave.user?.fullName || 'U')[0]}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {leave.user?.full_name || leave.user?.fullName || 'Employee'}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {leave.leave_type || leave.leaveType} · {leave.start_date ? new Date(leave.start_date || leave.startDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'N/A'} → {leave.end_date ? new Date(leave.end_date || leave.endDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-amber-100 text-amber-700 text-[10px] font-bold border-0">
                    PENDING
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Quick Actions & Stats */}
        <Card className="lg:col-span-2 bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">Quick Actions</CardTitle>
            <CardDescription className="text-xs">Navigate to key HR modules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {[
              { label: 'Employee Directory', icon: Users, path: '/hr/employees', color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Payroll Management', icon: IndianRupee, path: '/hr/payroll', color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Leave Approvals', icon: CalendarCheck2, path: '/hr/leaves', color: 'text-rose-600', bg: 'bg-rose-50' },
              { label: 'Appraisals', icon: TrendingUp, path: '/hr/appraisals', color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Teams & Departments', icon: ClipboardList, path: '/hr/teams', color: 'text-violet-600', bg: 'bg-violet-50' },
              { label: 'Announcements', icon: Megaphone, path: '/hr/announcements', color: 'text-orange-600', bg: 'bg-orange-50' },
            ].map((action) => (
              <button
                key={action.path}
                onClick={() => navigate(action.path)}
                className="flex items-center gap-3 w-full p-3 rounded-xl border border-slate-100 bg-slate-50/40 hover:bg-slate-50 hover:border-slate-200 transition-all duration-200 group text-left"
              >
                <div className={`h-9 w-9 rounded-xl ${action.bg} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                  <action.icon className={`h-4 w-4 ${action.color}`} />
                </div>
                <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">{action.label}</span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400 ml-auto group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Employees */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold">Recent Employees</CardTitle>
              <CardDescription className="text-xs">Latest additions to the organization</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-semibold border-amber-200 text-amber-700 hover:bg-amber-50"
              onClick={() => navigate('/hr/employees')}
            >
              View All <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {recentEmployees.map((emp: any) => (
              <div key={emp.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/40">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-amber-700">
                    {(emp.fullName || emp.full_name || 'U')[0]}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {emp.fullName || emp.full_name}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate font-medium">
                    {emp.employeeProfile?.designation || emp.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
