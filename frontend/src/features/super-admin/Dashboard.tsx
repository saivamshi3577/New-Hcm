import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts'
import {
  UsersRound, ShieldAlert, TrendingUp,
  ArrowUpRight, ArrowDownRight, LayoutList, AlertTriangle, Loader2,
  Building2, Sparkles, CheckCircle2, ShieldCheck, Activity, Award,
  ArrowRight, Layers, DollarSign, Clock, Calendar, Zap
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api, safeArray } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { startOfMonth, format, isBefore } from 'date-fns'

export default function SuperAdminDashboard() {
  const { profile, user } = useAuthStore()
  const currentMonthKey = useMemo(() => new Date().toLocaleString('default', { month: 'short', year: 'numeric' }), [])
  const [selectedLeadId, setSelectedLeadId] = useState<string>('all')
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>(currentMonthKey)

  const firstName = useMemo(() => {
    const p = profile as any
    const u = user as any
    const candidate = p?.full_name || p?.fullName || p?.name || u?.fullName || u?.full_name || u?.name
    if (candidate && typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim().split(' ')[0]
    }
    if (user?.email && user.email.includes('@')) {
      const prefix = user.email.split('@')[0]
      return prefix.charAt(0).toUpperCase() + prefix.slice(1)
    }
    return 'Super Admin'
  }, [profile, user])

  // Fetch users
  const { data: users, isLoading: loadingUsers, error: errorUsers } = useQuery({
    queryKey: ['super-admin-users'],
    queryFn: async () => {
      let res: any = {}
      try {
        const data = await api.get('/employee')
        res.data = data
      } catch (e) {}
      const rawData = safeArray(res.data, 'employees')
      return rawData.map((u: any) => ({
        ...u,
        full_name: u.fullName || u.full_name || u.email,
        roles: { name: u.role || 'EMPLOYEE' },
        departments: { name: u.employeeProfile?.department || u.department || 'General' },
        teams: { id: u.team_id || 'general', name: 'General', lead_id: u.manager_id },
      }))
    }
  })

  // Fetch tasks
  const { data: tasks, isLoading: loadingTasks, error: errorTasks } = useQuery({
    queryKey: ['super-admin-tasks'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/task?_select=id,title,status,created_at,updated_at,due_date,assignee_id,points,evaluated_points')
        return safeArray(res, 'tasks')
      } catch (error) { throw error }
    }
  })

  // Aggregations
  const metrics = useMemo(() => {
    const userList = safeArray(users)
    const taskList = safeArray(tasks)
    if (!Array.isArray(userList) || !Array.isArray(taskList)) return null

    // Filter out Admins and Super Admins (Keep employees, staff, members, leads for analytics)
    const nonLeadUsers = userList.filter(u => {
      const r = (u.role || u.roles?.name || '').toUpperCase().trim()
      return !r.includes('ADMIN')
    })
    const nonLeadUserIds = new Set(nonLeadUsers.map(u => u.id))
    
    // Relevant tasks for organization productivity
    const relevantTasks = taskList.filter(t => !t.assignee_id || nonLeadUserIds.has(t.assignee_id))

    const now = new Date()
    const startOfCurrentMonth = startOfMonth(now)

    // User Metrics
    const totalUsers = userList.length
    const newUsersThisMonth = userList.filter(u => new Date(u.created_at) >= startOfCurrentMonth).length

    // Task Metrics
    const totalTasks = taskList.length
    const completedTasks = taskList.filter(t => t.status === 'Completed')
    const activeTasks = taskList.filter(t => t.status !== 'Completed')
    const overdueTasks = activeTasks.filter(t => t.due_date && isBefore(new Date(t.due_date), now))
    const overdueRisk = activeTasks.length > 0 ? (overdueTasks.length / activeTasks.length) * 100 : 0
    
    // Average Productivity Score (Completed / Total Tasks)
    const avgProductivity = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0

    // Organization Productivity by Month (Last 6 Months)
    const orgProductivityData: any[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthLabel = format(d, 'MMM')
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      
      const createdInMonth = relevantTasks.filter(t => {
        const createdDate = new Date(t.created_at)
        return createdDate >= d && createdDate < nextMonth
      }).length

      const completedInMonth = relevantTasks.filter(t => {
        if (t.status !== 'Completed') return false
        const updatedDate = new Date(t.updated_at)
        return updatedDate >= d && updatedDate < nextMonth
      }).length

      orgProductivityData.push({
        month: monthLabel,
        created: createdInMonth,
        completed: completedInMonth
      })
    }

    // Task Distribution
    const statusCounts = relevantTasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const colors: Record<string, string> = {
      'Completed': '#10b981',
      'In Progress': '#6366f1',
      'Todo': '#f59e0b',
      'Blocked': '#ef4444'
    }

    const taskDistributionData = Object.entries(statusCounts).map(([status, count]) => ({
      name: status,
      value: count,
      color: colors[status] || '#94a3b8'
    }))

    // Department & Team Performance
    const departmentStats: Record<string, { tasks: number, completed: number }> = {}
    relevantTasks.forEach(task => {
      if (!task.assignee_id) return
      const user = nonLeadUsers.find(u => u.id === task.assignee_id)
      if (user && user.departments?.name) {
        const deptName = user.departments.name
        if (!departmentStats[deptName]) departmentStats[deptName] = { tasks: 0, completed: 0 }
        departmentStats[deptName].tasks++
        if (task.status === 'Completed') departmentStats[deptName].completed++
      }
    })

    const teamPerformanceData = Object.entries(departmentStats).map(([name, stats]) => ({
      name,
      tasks: stats.completed,
      productivity: stats.tasks > 0 ? Math.round((stats.completed / stats.tasks) * 100) : 0
    })).sort((a, b) => b.tasks - a.tasks).slice(0, 5)

    // Employee Ranking (Filtered by selectedMonthFilter)
    const employeeStats: Record<string, { name: string, team: string, completed: number, completedPoints: number, assignedPoints: number, total: number }> = {}
    relevantTasks.forEach(task => {
      if (!task.assignee_id) return
      const user = nonLeadUsers.find(u => u.id === task.assignee_id)
      if (!user) return

      // Filter by Team Lead / Admin if selected
      if (selectedLeadId !== 'all') {
        const reportsToLead = user.manager_id === selectedLeadId
        const inTeamLedByLead = user.teams?.lead_id === selectedLeadId
        if (!reportsToLead && !inTeamLedByLead) {
          return
        }
      }

      // Filter by selectedMonthFilter if not 'All'
      if (selectedMonthFilter !== 'All') {
        const dateStr = task.updated_at || task.due_date || task.created_at
        if (!dateStr) return
        const d = new Date(dateStr)
        if (isNaN(d.getTime())) return
        const mKey = d.toLocaleString('default', { month: 'short', year: 'numeric' })
        if (mKey !== selectedMonthFilter) return
      }
      
      const userId = user.id
      if (!employeeStats[userId]) {
        employeeStats[userId] = {
          name: user.full_name || 'Unknown User',
          team: user.teams?.name || user.departments?.name || 'Unassigned',
          completed: 0,
          completedPoints: 0,
          assignedPoints: 0,
          total: 0
        }
      }
      employeeStats[userId].total++
      employeeStats[userId].assignedPoints += (task.points || 0)
      if (task.status === 'Completed') {
        employeeStats[userId].completed++
        const taskPoints = task.evaluated_points !== null && task.evaluated_points !== undefined && task.evaluated_points > 0
          ? Number(task.evaluated_points)
          : (task.points || 0)
        employeeStats[userId].completedPoints += taskPoints
      }
    })

    const employeeRanking = Object.values(employeeStats)
      .map(emp => ({
        ...emp,
        efficiency: emp.assignedPoints > 0 ? Math.round((emp.completedPoints / emp.assignedPoints) * 100) : 0
      }))
      .sort((a, b) => b.completedPoints - a.completedPoints || b.completed - a.completed)
      .map((emp, index) => ({ rank: index + 1, ...emp }))
      .slice(0, 5)

    // Map workload distribution per squad member (Filtered by selectedMonthFilter)
    const workloadData = nonLeadUsers
      .filter(u => {
        if (selectedLeadId === 'all') return true
        const reportsToLead = u.manager_id === selectedLeadId
        const inTeamLedByLead = u.teams?.lead_id === selectedLeadId
        return reportsToLead || inTeamLedByLead
      })
      .map(member => {
        const memberTasks = taskList.filter(t => {
          if (t.assignee_id !== member.id) return false
          if (selectedMonthFilter !== 'All') {
            const dateStr = t.updated_at || t.due_date || t.created_at
            if (!dateStr) return false
            const d = new Date(dateStr)
            if (isNaN(d.getTime())) return false
            const mKey = d.toLocaleString('default', { month: 'short', year: 'numeric' })
            if (mKey !== selectedMonthFilter) return false
          }
          return true
        })
        const assignedPoints = memberTasks.reduce((sum, t) => sum + (t.points || 0), 0)
        const completedPoints = memberTasks.filter(t => t.status === 'Completed').reduce((sum, t) => {
          const pts = t.evaluated_points !== null && t.evaluated_points !== undefined && t.evaluated_points > 0
            ? t.evaluated_points
            : (t.points || 0)
          return sum + pts
        }, 0)
        return {
          name: member.full_name ? member.full_name.split(' ')[0] : 'Member',
          fullName: member.full_name || 'Member',
          assignedPoints,
          completedPoints
        }
      })

    return {
      totalUsers,
      newUsersThisMonth,
      totalTasks,
      completedTasks: completedTasks.length,
      activeTasks: activeTasks.length,
      overdueTasks: overdueTasks.length,
      overdueRisk,
      avgProductivity,
      orgProductivityData,
      taskDistributionData,
      teamPerformanceData,
      employeeRanking,
      workloadData,
      statusCounts
    }

  }, [users, tasks, selectedLeadId, selectedMonthFilter])

  const availableMonthsList = useMemo(() => {
    const taskList = safeArray(tasks)
    if (!taskList.length) return [currentMonthKey, 'All']
    const monthsSet = new Set<string>()
    monthsSet.add(currentMonthKey)
    taskList.forEach((t: any) => {
      const dateStr = t.updated_at || t.due_date || t.created_at
      if (dateStr) {
        const d = new Date(dateStr)
        if (!isNaN(d.getTime())) {
          monthsSet.add(d.toLocaleString('default', { month: 'short', year: 'numeric' }))
        }
      }
    })
    const sortedMonths = Array.from(monthsSet).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    if (!sortedMonths.includes('All')) {
      sortedMonths.push('All')
    }
    return sortedMonths
  }, [tasks, currentMonthKey])

  const adminsList = useMemo(() => {
    const userList = safeArray(users)
    if (!userList.length) return []
    return userList.filter((u: any) => {
      const roleName = u.roles?.name || u.role || ''
      const norm = roleName.toLowerCase().replace(/[\s_-]+/g, '')
      return norm === 'admin' || norm === 'teamlead' || norm === 'manager' || norm === 'superadmin' || norm === 'hr'
    })
  }, [users])

  if (loadingUsers || loadingTasks) {
    return (
      <div className="flex h-[75vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="relative flex items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-indigo-600 border-t-transparent" />
            <Sparkles className="h-4 w-4 text-indigo-500 absolute animate-pulse" />
          </div>
          <p className="text-sm text-slate-500 font-semibold">Loading enterprise executive center...</p>
        </div>
      </div>
    )
  }

  if (errorUsers || errorTasks) {
    return (
      <div className="flex h-[75vh] flex-col items-center justify-center text-center space-y-4">
        <div className="h-16 w-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center shadow-sm">
          <ShieldAlert className="h-8 w-8 text-rose-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Failed to connect to executive metrics</h2>
          <p className="text-slate-500 mt-1 max-w-md mx-auto text-sm">
            Could not retrieve data from the server. Please ensure the backend is running.
          </p>
        </div>
        <div className="text-xs text-slate-500 bg-white/80 border border-slate-200 rounded-xl p-4 max-w-lg text-left overflow-auto shadow-sm">
          <p className="font-mono text-rose-600">
            {errorUsers ? `Users: ${(errorUsers as Error).message}` : ''}
          </p>
          <p className="font-mono text-rose-600 mt-1">
            {errorTasks ? `Tasks: ${(errorTasks as Error).message}` : ''}
          </p>
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="flex h-[75vh] flex-col items-center justify-center text-slate-500">
        <h2 className="text-xl font-bold text-slate-900">No Enterprise Data Available</h2>
        <p className="mt-1 text-sm">Waiting for telemetry signals to become available...</p>
      </div>
    )
  }

  const tooltipStyle = {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: '12px',
    border: '1px solid rgba(226,232,240,0.9)',
    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.08), 0 4px 10px -3px rgba(99,102,241,0.05)',
    backdropFilter: 'blur(12px)',
    fontSize: '12px',
    fontWeight: 600
  }

  return (
    <div className="space-y-6 text-foreground pb-8">
      {/* ── Executive Welcome Banner ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Welcome back, <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">{firstName}</span>
          </h2>
          <p className="text-slate-500 text-sm mt-0.5 font-medium">
            Executive Control Center — Multi-tenant governance, organization productivity, and compliance oversight.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50/90 border border-emerald-200 px-3 py-1.5 rounded-full shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Platform: 99.9% Uptime</span>
          </div>

          <Link
            to="/super-admin/admins"
            className="flex items-center gap-1.5 text-indigo-700 bg-indigo-50/85 hover:bg-indigo-100 text-xs font-bold px-3.5 py-1.5 rounded-full border border-indigo-200 shadow-2xs transition-all active:scale-95 cursor-pointer outline-none"
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>Manage Companies</span>
          </Link>

          <Link
            to="/super-admin/subscription-leads"
            className="flex items-center gap-1.5 text-violet-700 bg-violet-50/85 hover:bg-violet-100 text-xs font-bold px-3.5 py-1.5 rounded-full border border-violet-200 shadow-2xs transition-all active:scale-95 cursor-pointer outline-none"
          >
            <DollarSign className="h-3.5 w-3.5" />
            <span>MRR Pipeline</span>
          </Link>
        </div>
      </div>

      {/* ── 4 Executive KPI Stat Cards ────────────────────────────────── */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Org Size */}
        <Link 
          to="/super-admin/admins" 
          className="group bg-white/80 backdrop-blur-xl border border-slate-200/80 hover:border-indigo-300/80 rounded-2xl p-5 shadow-2xs hover:shadow-md hover-lift transition-all relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-violet-500 opacity-80 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Total Workforce</span>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100/70 border border-indigo-200/50 flex items-center justify-center text-indigo-600 shadow-2xs group-hover:scale-110 transition-transform">
              <UsersRound className="h-4.5 w-4.5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight kpi-value">{metrics.totalUsers}</p>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-indigo-600">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200/60 text-[10px]">
              <ArrowUpRight className="h-3 w-3 mr-0.5" /> +{metrics.newUsersThisMonth} new this month
            </span>
          </div>
        </Link>

        {/* Card 2: Productivity Score */}
        <Link 
          to="/super-admin/analytics" 
          className="group bg-white/80 backdrop-blur-xl border border-slate-200/80 hover:border-emerald-300/80 rounded-2xl p-5 shadow-2xs hover:shadow-md hover-lift transition-all relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-80 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Avg Productivity</span>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/70 border border-emerald-200/50 flex items-center justify-center text-emerald-600 shadow-2xs group-hover:scale-110 transition-transform">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight kpi-value">{metrics.avgProductivity.toFixed(1)}%</p>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-emerald-600">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/60 text-[10px]">
              <CheckCircle2 className="h-3 w-3 mr-0.5" /> {metrics.completedTasks} of {metrics.totalTasks} tasks resolved
            </span>
          </div>
        </Link>

        {/* Card 3: Total Workflows */}
        <Link 
          to="/super-admin/analytics" 
          className="group bg-white/80 backdrop-blur-xl border border-slate-200/80 hover:border-blue-300/80 rounded-2xl p-5 shadow-2xs hover:shadow-md hover-lift transition-all relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-80 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Task Pipeline</span>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/70 border border-blue-200/50 flex items-center justify-center text-blue-600 shadow-2xs group-hover:scale-110 transition-transform">
              <LayoutList className="h-4.5 w-4.5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight kpi-value">{metrics.totalTasks.toLocaleString()}</p>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-blue-600">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200/60 text-[10px]">
              <Zap className="h-3 w-3 mr-0.5" /> {metrics.activeTasks} active in-flight
            </span>
          </div>
        </Link>

        {/* Card 4: Overdue Risk */}
        <Link 
          to="/super-admin/analytics" 
          className="group bg-white/80 backdrop-blur-xl border border-slate-200/80 hover:border-rose-300/80 rounded-2xl p-5 shadow-2xs hover:shadow-md hover-lift transition-all relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-amber-500 opacity-80 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">SLA Overdue Risk</span>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-50 to-rose-100/70 border border-rose-200/50 flex items-center justify-center text-rose-600 shadow-2xs group-hover:scale-110 transition-transform">
              <AlertTriangle className="h-4.5 w-4.5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight kpi-value">{metrics.overdueRisk.toFixed(1)}%</p>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-rose-600">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200/60 text-[10px]">
              <Clock className="h-3 w-3 mr-0.5" /> {metrics.overdueTasks} active tasks past due
            </span>
          </div>
        </Link>
      </div>

      {/* ── Main Analytics Row (Area Chart & Donut) ─────────────────── */}
      <div className="grid gap-5 grid-cols-1 lg:grid-cols-7">
        {/* Productivity Trends Area Chart (4 Cols) */}
        <Card className="lg:col-span-4 bg-white/85 backdrop-blur-xl border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
          <CardHeader className="pb-2 pt-5 px-5 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-indigo-600" />
                <span>Organization Productivity Trajectory</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Monthly workflow creation vs completion volume (Last 6 Months)
              </CardDescription>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Completed
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" /> Created
              </span>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-2 h-[290px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.orgProductivityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="saCompletedG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="saCreatedG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} dx={-8} />
                <Tooltip contentStyle={tooltipStyle} itemStyle={{ fontWeight: 700, fontSize: 12 }} />
                <Area type="monotone" dataKey="completed" stroke="#10b981" fillOpacity={1} fill="url(#saCompletedG)" strokeWidth={3} name="Completed Tasks" />
                <Area type="monotone" dataKey="created" stroke="#6366f1" fillOpacity={1} fill="url(#saCreatedG)" strokeWidth={3} name="Created Tasks" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Task Distribution Donut Chart (3 Cols) */}
        <Card className="lg:col-span-3 bg-white/85 backdrop-blur-xl border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden flex flex-col">
          <CardHeader className="pb-2 pt-5 px-5">
            <CardTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Layers className="h-4 w-4 text-violet-600" />
              <span>Workflow State Distribution</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              Live status breakdown of active tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-2 flex-1 flex items-center justify-center relative min-h-[260px]">
            {metrics.taskDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={metrics.taskDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={68}
                    outerRadius={92}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {metrics.taskDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip cursor={false} contentStyle={tooltipStyle} itemStyle={{ fontWeight: 700, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-400 text-sm font-semibold">No task allocation data</div>
            )}
            
            {metrics.taskDistributionData.length > 0 && (
              <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-black bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-800 bg-clip-text text-transparent">
                  {metrics.totalTasks}
                </span>
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mt-0.5">Total Tasks</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Workload & Completion (Sprint Points) ─────────────────────── */}
      <Card className="bg-white/85 backdrop-blur-xl border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
        <CardHeader className="pb-3 pt-5 px-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Award className="h-4 w-4 text-indigo-600" />
                <span>Squad Workload & Point Resolution Index</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Comparison of assigned sprint planning points vs evaluated points delivered per squad member
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex gap-3 text-[10px] font-extrabold uppercase tracking-wider bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs">
                <span className="flex items-center gap-1.5 font-bold text-slate-500">
                  <span className="h-2.5 w-2.5 rounded bg-slate-300 inline-block" /> Assigned
                </span>
                <span className="flex items-center gap-1.5 font-bold text-indigo-700">
                  <span className="h-2.5 w-2.5 rounded bg-indigo-600 inline-block" /> Evaluated
                </span>
              </div>

              {/* Month Filter */}
              <div className="w-[140px] shrink-0">
                <Select value={selectedMonthFilter} onValueChange={setSelectedMonthFilter}>
                  <SelectTrigger className="h-8.5 text-xs bg-slate-50 border-slate-200 text-slate-700 font-bold rounded-xl focus:ring-1 focus:ring-indigo-500">
                    <SelectValue placeholder="Month Filter" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-800 text-xs font-semibold z-50">
                    {availableMonthsList.map((m: string) => (
                      <SelectItem key={m} value={m} className="cursor-pointer">
                        {m === currentMonthKey ? `${m} (Current)` : m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Lead Filter */}
              <div className="w-[150px] shrink-0">
                <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
                  <SelectTrigger className="h-8.5 text-xs bg-slate-50 border-slate-200 text-slate-700 font-bold rounded-xl focus:ring-1 focus:ring-indigo-500">
                    <SelectValue placeholder="Filter by Lead" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-800 text-xs font-semibold z-50">
                    <SelectItem value="all" className="cursor-pointer">All Squad Leads</SelectItem>
                    {adminsList.map((lead: any) => (
                      <SelectItem key={lead.id} value={lead.id} className="cursor-pointer">
                        {lead.full_name || 'Unnamed Lead'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5 pt-2 h-[290px]">
          {metrics.workloadData.length > 0 ? (
            <div 
              className="overflow-x-auto hide-scrollbar w-full h-full" 
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <div style={{ minWidth: `${Math.max(500, metrics.workloadData.length * 90)}px`, height: '260px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.workloadData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSaAssigned" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#e2e8f0" stopOpacity={0.9}/>
                        <stop offset="100%" stopColor="#cbd5e1" stopOpacity={0.4}/>
                      </linearGradient>
                      <linearGradient id="colorSaCompleted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={1}/>
                        <stop offset="100%" stopColor="#818cf8" stopOpacity={0.8}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} dy={5} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
                    <Tooltip 
                      cursor={{ fill: 'rgba(241, 245, 249, 0.4)' }}
                      contentStyle={tooltipStyle} 
                      formatter={(value: any, name?: any) => [
                        `${value} Pts`,
                        name === 'Assigned Points' ? 'Assigned Points' : 'Evaluated Points'
                      ]}
                    />
                    <Bar dataKey="assignedPoints" fill="url(#colorSaAssigned)" radius={[6, 6, 0, 0]} name="Assigned Points" maxBarSize={28} />
                    <Bar dataKey="completedPoints" fill="url(#colorSaCompleted)" radius={[6, 6, 0, 0]} name="Evaluated Points" maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm font-semibold">
              No member workload logs available for the selected range
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Secondary Performance & Leaderboard Row ───────────────────── */}
      <div className="grid gap-5 grid-cols-1 lg:grid-cols-7">
        {/* Department Productivity Horizontal Bar Chart (4 Cols) */}
        <Card className="lg:col-span-4 bg-white/85 backdrop-blur-xl border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
          <CardHeader className="pb-2 pt-5 px-5">
            <CardTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-indigo-600" />
              <span>Department Output & Productivity Index</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              Completed workflow items vs efficiency percentage across departments
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-2 h-[290px]">
            {metrics.teamPerformanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.teamPerformanceData} layout="vertical" margin={{ top: 5, right: 25, left: 35, bottom: 5 }} barGap={6}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#334155', fontSize: 11, fontWeight: 700 }} width={110} />
                  <Tooltip cursor={{ fill: 'rgba(241, 245, 249, 0.4)' }} contentStyle={tooltipStyle} />
                  <Bar dataKey="tasks" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={16} name="Completed Tasks" />
                  <Bar dataKey="productivity" fill="#10b981" radius={[0, 6, 6, 0]} barSize={16} name="Productivity %" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm font-semibold">
                No department telemetry recorded
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Contributing Talent Leaderboard (3 Cols) */}
        <Card className="lg:col-span-3 bg-white/85 backdrop-blur-xl border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden flex flex-col">
          <CardHeader className="pb-3 pt-5 px-5 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-500" />
                <span>Top Contributing Talent</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Ranked by evaluated sprint points
              </CardDescription>
            </div>

            <div className="w-[125px] shrink-0">
              <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
                <SelectTrigger className="h-7.5 text-[11px] bg-slate-50 border-slate-200 text-slate-700 font-bold rounded-xl focus:ring-1 focus:ring-indigo-500">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-800 text-xs font-semibold z-50">
                  <SelectItem value="all" className="cursor-pointer">All Leads</SelectItem>
                  {adminsList.map((lead: any) => (
                    <SelectItem key={lead.id} value={lead.id} className="cursor-pointer">
                      {lead.full_name || 'Lead'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-1 flex-1">
            {metrics.employeeRanking.length > 0 ? (
              <div className="space-y-2.5">
                {metrics.employeeRanking.map((emp) => (
                  <div 
                    key={emp.name + emp.rank} 
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/25 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-7.5 h-7.5 rounded-full text-xs font-black group-hover:scale-110 transition-transform shadow-2xs ${
                        emp.rank === 1 
                          ? 'bg-amber-100 text-amber-900 border border-amber-300 ring-2 ring-amber-300/40' 
                          : emp.rank === 2 
                          ? 'bg-slate-200 text-slate-800 border border-slate-300' 
                          : emp.rank === 3 
                          ? 'bg-orange-100 text-orange-900 border border-orange-300' 
                          : 'bg-white text-slate-600 border border-slate-200'
                      }`}>
                        {emp.rank === 1 ? '🥇' : emp.rank === 2 ? '🥈' : emp.rank === 3 ? '🥉' : emp.rank}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[130px]">{emp.name}</p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5 truncate max-w-[130px]">{emp.team}</p>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end">
                      <div className="flex items-center gap-1.5 justify-end">
                        <span className="text-[9px] font-bold bg-slate-200/70 text-slate-600 border border-slate-300/50 rounded px-1.5 py-0.5 leading-none">
                          {emp.assignedPoints} /
                        </span>
                        <p className="text-xs font-black text-indigo-700 leading-none">
                          {emp.completedPoints} <span className="text-[10px] font-bold text-indigo-500">Pts</span>
                        </p>
                      </div>
                      <p className="text-[10px] text-slate-400 font-semibold mt-1">
                        {emp.completed} resolved • {emp.efficiency}% eff
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs font-semibold min-h-[190px]">
                No talent ranking records recorded
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
