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
  ArrowUpRight, ArrowDownRight, LayoutList, AlertTriangle, Loader2
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api, safeArray } from '@/lib/api'
import { startOfMonth, format, isBefore } from 'date-fns'

export default function SuperAdminDashboard() {
  const currentMonthKey = useMemo(() => new Date().toLocaleString('default', { month: 'short', year: 'numeric' }), [])
  const [selectedLeadId, setSelectedLeadId] = useState<string>('all')
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>(currentMonthKey)

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
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-indigo-500" />
          <p className="text-sm text-slate-400 font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (errorUsers || errorTasks) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center text-center space-y-4 sa-page-enter">
        <div className="h-14 w-14 sa-icon-box-rose rounded-full flex items-center justify-center mb-2">
          <ShieldAlert className="h-7 w-7 text-red-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Failed to load dashboard</h2>
          <p className="text-slate-500 mt-2 max-w-md mx-auto text-sm">
            There was a problem connecting to the database. Please ensure your Supabase instance is running and you have the correct permissions.
          </p>
        </div>
        <div className="text-sm text-slate-400 sa-card p-4 mt-4 max-w-lg text-left overflow-auto">
          <p className="font-mono text-xs text-red-600">
            {errorUsers ? `User fetch error: ${(errorUsers as Error).message}` : ''}
          </p>
          <p className="font-mono text-xs text-red-600 mt-2">
            {errorTasks ? `Task fetch error: ${(errorTasks as Error).message}` : ''}
          </p>
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center text-slate-500 sa-page-enter">
        <h2 className="text-xl font-bold text-slate-900">No Data Available</h2>
        <p className="mt-2">Waiting for data to become available...</p>
      </div>
    )
  }

  const tooltipStyle = {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: '10px',
    border: '1px solid rgba(226,232,240,0.8)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.08), 0 2px 8px rgba(99,102,241,0.06)',
    backdropFilter: 'blur(12px)',
  }

  return (
    <div className="space-y-5 sa-page-enter text-slate-800 pb-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight sa-gradient-text">Executive Control Center</h2>
          <p className="text-slate-400 mt-0.5 text-sm">Real-time enterprise metrics, compliance controls, and organization productivity analytics.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="sa-badge-emerald text-[11px] px-3 py-1.5 flex items-center gap-1.5 font-semibold rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            System: Operational
          </span>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Link to="/super-admin/employees" className="block outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-2xl transition-transform hover:-translate-y-1">
          <div className="sa-kpi-card sa-kpi-indigo p-4 h-full cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Organization Size</p>
              <div className="sa-icon-box">
                <UsersRound className="h-4 w-4 text-indigo-600" />
              </div>
            </div>
            <div className="text-xl font-bold sa-gradient-text kpi-value">{metrics.totalUsers} Users</div>
            <div className="flex items-center text-[11px] text-indigo-600 mt-1.5 font-medium sa-badge w-fit px-1.5 py-0.5">
              <ArrowUpRight className="h-3 w-3 mr-0.5" />
              <span>+{metrics.newUsersThisMonth} this month</span>
            </div>
          </div>
        </Link>

        <Link to="/super-admin/analytics" className="block outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-2xl transition-transform hover:-translate-y-1">
          <div className="sa-kpi-card sa-kpi-emerald p-4 h-full cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Productivity</p>
              <div className="sa-icon-box sa-icon-box-emerald">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
            <div className="text-xl font-bold sa-gradient-text kpi-value">{metrics.avgProductivity.toFixed(1)}%</div>
            <div className="flex items-center text-[11px] text-emerald-600 mt-1.5 font-medium sa-badge-emerald w-fit px-1.5 py-0.5">
              <span>{metrics.completedTasks} completed out of {metrics.totalTasks}</span>
            </div>
          </div>
        </Link>

        <Link to="/super-admin/analytics" className="block outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-2xl transition-transform hover:-translate-y-1">
          <div className="sa-kpi-card sa-kpi-blue p-4 h-full cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Workflows</p>
              <div className="sa-icon-box sa-icon-box-blue">
                <LayoutList className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <div className="text-xl font-bold sa-gradient-text kpi-value">{metrics.totalTasks.toLocaleString()} Tasks</div>
            <div className="flex items-center text-[11px] text-blue-600 mt-1.5 font-medium px-1.5 py-0.5 bg-blue-50/80 rounded-full border border-blue-200/60 w-fit">
              <span>{metrics.activeTasks} active workflows</span>
            </div>
          </div>
        </Link>

        <Link to="/super-admin/analytics" className="block outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded-2xl transition-transform hover:-translate-y-1">
          <div className="sa-kpi-card sa-kpi-rose p-4 h-full cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overdue Risk</p>
              <div className="sa-icon-box sa-icon-box-rose">
                <AlertTriangle className="h-4 w-4 text-rose-500" />
              </div>
            </div>
            <div className="text-xl font-bold sa-gradient-text kpi-value">{metrics.overdueRisk.toFixed(1)}%</div>
            <div className="flex items-center text-[11px] text-rose-500 mt-1.5 font-medium sa-badge-rose w-fit px-1.5 py-0.5">
              <ArrowDownRight className="h-3 w-3 mr-0.5" />
              <span>{metrics.overdueTasks} active tasks past due</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Main Analytics Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Productivity Trends */}
        <div className="col-span-4 sa-card sa-gradient-border overflow-hidden">
          <div className="p-4 pb-2">
            <h3 className="text-sm font-bold text-slate-800">Organization Productivity</h3>
            <p className="text-xs text-slate-400 mt-0.5">Monthly created vs completed tasks (Last 6 Months)</p>
          </div>
          <div className="px-4 pb-4 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.orgProductivityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="saCompletedG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="saCreatedG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} dx={-10} />
                <Tooltip contentStyle={tooltipStyle} itemStyle={{ fontWeight: 600, fontSize: 12 }} />
                <Area type="monotone" dataKey="completed" stroke="#10b981" fillOpacity={1} fill="url(#saCompletedG)" strokeWidth={2.5} name="Completed" />
                <Area type="monotone" dataKey="created" stroke="#6366f1" fillOpacity={1} fill="url(#saCreatedG)" strokeWidth={2.5} name="Created" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task Distribution Donut */}
        <div className="col-span-3 sa-card sa-gradient-border overflow-hidden">
          <div className="p-4 pb-2">
            <h3 className="text-sm font-bold text-slate-800">Workflow Status Distribution</h3>
            <p className="text-xs text-slate-400 mt-0.5">Current active task allocations</p>
          </div>
          <div className="px-4 pb-4 h-[280px] flex items-center justify-center relative">
            {metrics.taskDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics.taskDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={88}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    activeShape={false}
                  >
                    {metrics.taskDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    cursor={false}
                    contentStyle={tooltipStyle}
                    itemStyle={{ fontWeight: 600, color: '#334155', fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-400 text-sm">No task data available</div>
            )}
            
            {metrics.taskDistributionData.length > 0 && (
              <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-extrabold sa-gradient-text">{metrics.totalTasks}</span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Total Tasks</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Workload Distribution Analytics */}
      <div className="sa-card sa-gradient-border overflow-hidden">
        <div className="p-4 pb-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Workload & Completion (Sprint Points)</h3>
            <p className="text-xs text-slate-400 mt-0.5">Comparison of total assigned sprint points against completed/evaluated points per member</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-4 text-[9px] font-extrabold uppercase tracking-wider text-slate-400 bg-slate-50/80 px-2.5 py-1 rounded-lg border border-slate-100">
              <span className="flex items-center gap-1.5 font-bold text-slate-500">
                <span className="h-2 w-2 rounded bg-slate-200 inline-block border border-slate-300/30" /> 
                Assigned
              </span>
              <span className="flex items-center gap-1.5 font-bold text-indigo-650">
                <span className="h-2 w-2 rounded bg-indigo-500 inline-block" /> 
                Evaluated
              </span>
            </div>
            {/* Month Filter Selector */}
            <div className="w-[140px] shrink-0">
              <Select
                value={selectedMonthFilter}
                onValueChange={setSelectedMonthFilter}
              >
                <SelectTrigger className="h-7 text-[10px] bg-slate-50 border-slate-200 text-slate-700 font-bold rounded-lg focus:ring-1 focus:ring-indigo-500">
                  <SelectValue placeholder="Month Filter" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-800 text-[11px] font-medium z-50">
                  {availableMonthsList.map((m: string) => (
                    <SelectItem key={m} value={m} className="cursor-pointer">
                      {m === currentMonthKey ? `${m} (Current)` : m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Team Lead Filter Selector */}
            <div className="w-[140px] shrink-0">
              <Select
                value={selectedLeadId}
                onValueChange={setSelectedLeadId}
              >
                <SelectTrigger className="h-7 text-[10px] bg-slate-50 border-slate-200 text-slate-700 font-bold rounded-lg focus:ring-1 focus:ring-indigo-500">
                  <SelectValue placeholder="Filter by Lead" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-800 text-[11px] font-medium z-50">
                  <SelectItem value="all" className="cursor-pointer">All Leads</SelectItem>
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
        <div className="px-4 pb-4 h-[280px]">
          {metrics.workloadData.length > 0 ? (
            <div 
              className="overflow-x-auto hide-scrollbar w-full h-full" 
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <style>{`
                .hide-scrollbar::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              <div style={{ minWidth: `${Math.max(480, metrics.workloadData.length * 85)}px`, height: '240px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.workloadData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSaAssigned" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#e2e8f0" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#cbd5e1" stopOpacity={0.15}/>
                      </linearGradient>
                      <linearGradient id="colorSaCompleted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.9}/>
                        <stop offset="100%" stopColor="#818cf8" stopOpacity={0.3}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: '700' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip 
                      cursor={false}
                      contentStyle={tooltipStyle} 
                      formatter={(value: any, name?: any) => [
                        `${value} Pts`,
                        name === 'Assigned Points' ? 'Assigned Points' : 'Evaluated Points'
                      ]}
                    />
                    <Bar dataKey="assignedPoints" fill="url(#colorSaAssigned)" radius={[5, 5, 0, 0]} name="Assigned Points" maxBarSize={24} activeBar={false} />
                    <Bar dataKey="completedPoints" fill="url(#colorSaCompleted)" radius={[5, 5, 0, 0]} name="Evaluated Points" maxBarSize={24} activeBar={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">No member workload data to display</div>
          )}
        </div>
      </div>

      {/* Secondary Performance & Leaderboard Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Team Productivity Ratings */}
        <div className="col-span-4 sa-card sa-gradient-border overflow-hidden">
          <div className="p-4 pb-2">
            <h3 className="text-sm font-bold text-slate-800">Department Performance</h3>
            <p className="text-xs text-slate-400 mt-0.5">Completed tasks vs productivity index</p>
          </div>
          <div className="px-4 pb-4 h-[280px]">
            {metrics.teamPerformanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.teamPerformanceData} layout="vertical" margin={{ top: 0, right: 30, left: 30, bottom: 0 }} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 11, fontWeight: 500 }} width={100} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={tooltipStyle} />
                  <Bar dataKey="tasks" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={14} name="Completed" />
                  <Bar dataKey="productivity" fill="#10b981" radius={[0, 4, 4, 0]} barSize={14} name="Productivity %" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">No department data to display</div>
            )}
          </div>
        </div>

        {/* Employee Ranking Leaderboard */}
        <div className="col-span-3 sa-card sa-gradient-border overflow-hidden flex flex-col">
          <div className="p-4 pb-2 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Top Contributing Talent</h3>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">Ranked by completed sprint planning points</p>
            </div>
            <div className="w-[140px] shrink-0">
              <Select
                value={selectedLeadId}
                onValueChange={setSelectedLeadId}
              >
                <SelectTrigger className="h-7 text-[10px] bg-slate-50 border-slate-200 text-slate-700 font-bold rounded-lg focus:ring-1 focus:ring-indigo-500">
                  <SelectValue placeholder="Filter by Lead" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-800 text-[11px] font-medium z-50">
                  <SelectItem value="all" className="cursor-pointer">All</SelectItem>
                  {adminsList.map((lead: any) => (
                    <SelectItem key={lead.id} value={lead.id} className="cursor-pointer">
                      {lead.full_name || 'Unnamed Lead'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="px-4 pb-4 flex-1">
            {metrics.employeeRanking.length > 0 ? (
              <div className="space-y-2">
                {metrics.employeeRanking.map((emp) => (
                  <div key={emp.name + emp.rank} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/60 border border-slate-100/80 hover:border-indigo-200/50 hover:bg-indigo-50/20 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold group-hover:scale-110 transition-transform ${
                        emp.rank === 1 ? 'sa-rank-1' : emp.rank === 2 ? 'sa-rank-2' : emp.rank === 3 ? 'sa-rank-3' : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        {emp.rank}
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-slate-800 leading-tight">{emp.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">{emp.team}</p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <div className="flex items-center gap-1.5 justify-end">
                        <span className="text-[9px] font-bold bg-slate-100 text-slate-550 border border-slate-200/50 rounded px-1.5 py-0.5 leading-none" title="Total Assigned points">
                          {emp.assignedPoints} /
                        </span>
                        <p className="text-[13px] font-bold text-indigo-650 leading-none">{emp.completedPoints} <span className="text-[10px] font-semibold text-indigo-500/80">Pts</span></p>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium mt-1.5">{emp.completed} tasks | {emp.efficiency}% eff</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm min-h-[200px]">No employee tasks recorded</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
