import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts'
import { Download, Loader2, TrendingUp, CheckCircle2, LayoutList, ShieldCheck, Zap, Activity, ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useQuery } from '@tanstack/react-query'
import { api, safeArray } from '@/lib/api'
import { format } from 'date-fns'

const tooltipStyle = {
  backgroundColor: 'rgba(255,255,255,0.96)',
  borderRadius: '12px',
  border: '1px solid rgba(226,232,240,0.9)',
  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.08), 0 4px 10px -3px rgba(99,102,241,0.05)',
  backdropFilter: 'blur(12px)',
  fontSize: '12px',
  fontWeight: 600
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316', '#3b82f6']

const STATUS_COLORS: Record<string, string> = {
  'Completed': '#10b981',
  'In Progress': '#3b82f6',
  'Review': '#f59e0b',
  'Todo': '#8b5cf6',
  'Blocked': '#ef4444'
}

export default function OrgAnalytics() {
  const { data: rawTasks, isLoading: loadingTasks } = useQuery({
    queryKey: ['org-analytics-tasks'],
    queryFn: async () => {
      let data: any = []
      try {
        const res: any = await api.get('/task?_select=id,status,priority,due_date,updated_at,assignee_id,created_at,points,evaluated_points')
        data = safeArray(res, 'tasks')
      } catch(e) {}
      return data || []
    }
  })

  const { data: rawUsers, isLoading: loadingUsers } = useQuery({
    queryKey: ['org-analytics-users'],
    queryFn: async () => {
      let data: any = []
      try {
        const res: any = await api.get('/employee?_select=id,full_name,departments(name)')
        data = safeArray(res, 'employees')
      } catch(e) {}
      return data || []
    }
  })

  const metrics = useMemo(() => {
    const tasks = safeArray(rawTasks, 'tasks')
    const users = safeArray(rawUsers, 'employees')

    if (!Array.isArray(tasks) || !Array.isArray(users)) return null

    const now = new Date()
    const monthlyMetrics: any[] = []
    
    // Calculate last 6 months for Velocity and SLA
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      const monthLabel = format(d, 'MMM')

      const completedThisMonth = tasks.filter((t: any) => {
        if (t.status !== 'Completed' || !t.updated_at) return false
        const updatedDate = new Date(t.updated_at)
        return updatedDate >= d && updatedDate < nextMonth
      })

      let velocity = 0
      let compliantTasks = 0

      completedThisMonth.forEach((t: any) => {
        const taskPoints = t.evaluated_points !== null && t.evaluated_points !== undefined && t.evaluated_points > 0
          ? t.evaluated_points
          : (t.points > 0 ? t.points : (
              t.priority === 'Critical' ? 5 :
              t.priority === 'High' ? 3 :
              t.priority === 'Medium' ? 2 : 1
            ))
        velocity += taskPoints

        if (!t.due_date) {
          compliantTasks++
        } else {
          const dueDate = new Date(t.due_date)
          const updatedDate = new Date(t.updated_at)
          dueDate.setHours(23, 59, 59, 999)
          if (updatedDate <= dueDate) {
            compliantTasks++
          }
        }
      })

      const compliance = completedThisMonth.length > 0 
        ? Math.round((compliantTasks / completedThisMonth.length) * 100) 
        : 100

      monthlyMetrics.push({ month: monthLabel, velocity, compliance })
    }

    // Department Workload Distribution
    const activeTasks = tasks.filter((t: any) => t.status !== 'Completed')
    const deptWorkloadMap: Record<string, number> = {}
    
    activeTasks.forEach((t: any) => {
      const taskWeight = t.evaluated_points !== null && t.evaluated_points !== undefined && t.evaluated_points > 0
        ? t.evaluated_points
        : (t.points > 0 ? t.points : 1)
      if (!t.assignee_id) {
        deptWorkloadMap['Unassigned'] = (deptWorkloadMap['Unassigned'] || 0) + taskWeight
        return
      }
      const user = users.find((u: any) => u.id === t.assignee_id) as any
      const dept = user?.departments
      const deptName = Array.isArray(dept) ? dept[0]?.name : dept?.name
      if (deptName) {
        deptWorkloadMap[deptName] = (deptWorkloadMap[deptName] || 0) + taskWeight
      } else {
        deptWorkloadMap['Unassigned'] = (deptWorkloadMap['Unassigned'] || 0) + taskWeight
      }
    })

    const deptWorkloadData = Object.entries(deptWorkloadMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    // Task Pipeline Health
    const statusCountMap: Record<string, number> = {}
    tasks.forEach((t: any) => {
      const status = t.status || 'Todo'
      statusCountMap[status] = (statusCountMap[status] || 0) + 1
    })

    const statusDistributionData = Object.entries(statusCountMap)
      .map(([name, value]) => ({ name, value, fill: STATUS_COLORS[name] || '#94a3b8' }))
      .sort((a, b) => b.value - a.value)

    // High level KPI summaries
    const totalVelocity = monthlyMetrics.reduce((sum, m) => sum + m.velocity, 0)
    const avgCompliance = monthlyMetrics.length > 0 ? Math.round(monthlyMetrics.reduce((sum, m) => sum + m.compliance, 0) / monthlyMetrics.length) : 100
    const totalActivePoints = Object.values(deptWorkloadMap).reduce((sum, v) => sum + v, 0)

    return {
      monthlyMetrics,
      deptWorkloadData,
      statusDistributionData,
      totalVelocity,
      avgCompliance,
      totalActivePoints,
      totalTasksCount: tasks.length
    }
  }, [rawTasks, rawUsers])

  const isLoading = loadingTasks || loadingUsers

  const handleExportCSV = () => {
    if (!metrics) return
    const rows = [
      ['Month', 'Sprint Velocity Points', 'SLA Compliance %'],
      ...metrics.monthlyMetrics.map(m => [m.month, m.velocity, `${m.compliance}%`])
    ]
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `org_analytics_${format(new Date(), 'yyyy-MM-dd')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 text-foreground pb-8">
      {/* ── Header Section ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Organization <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">Analytics</span>
          </h2>
          <p className="text-slate-500 text-sm mt-0.5 font-medium">
            Multi-tenant executive reporting, velocity audits, and resource capacity analytics.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleExportCSV}
            disabled={isLoading || !metrics}
            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-md shadow-indigo-500/20 transition-all active:scale-95 flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV Report</span>
          </Button>
        </div>
      </div>

      {/* ── 4 Highlight Metric Cards ─────────────────────────────────── */}
      {metrics && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Total Velocity (6M)</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200/60 flex items-center justify-center text-indigo-600 shadow-2xs">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">{metrics.totalVelocity} <span className="text-xs text-indigo-500 font-bold">Pts</span></p>
            <p className="text-[10px] text-indigo-600 font-bold mt-1">Aggregated Resolution Volume</p>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Average SLA Rate</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-600 shadow-2xs">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">{metrics.avgCompliance}%</p>
            <p className="text-[10px] text-emerald-600 font-bold mt-1">On-Time Target Compliance</p>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Active Workload</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600 shadow-2xs">
                <Zap className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">{metrics.totalActivePoints} <span className="text-xs text-blue-500 font-bold">Pts</span></p>
            <p className="text-[10px] text-blue-600 font-bold mt-1">Pending In-Flight Points</p>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Total Pipeline</span>
              <div className="w-8 h-8 rounded-xl bg-violet-50 border border-violet-200/60 flex items-center justify-center text-violet-600 shadow-2xs">
                <LayoutList className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">{metrics.totalTasksCount}</p>
            <p className="text-[10px] text-violet-600 font-bold mt-1">Total System Workflows</p>
          </div>
        </div>
      )}

      {/* ── Main Charts Grid ─────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-indigo-600 border-t-transparent" />
            <p className="text-sm text-slate-500 font-semibold">Generating organizational analytics...</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {/* Velocity Index */}
          <Card className="bg-white/85 backdrop-blur-xl border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
            <CardHeader className="pb-2 pt-5 px-5">
              <CardTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-indigo-600" />
                <span>Sprint Velocity Index</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Aggregated task resolution points delivered per month
              </CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-2 h-[270px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics?.monthlyMetrics} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="saVelocityG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} dy={5} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(val: any) => [`${val} Points`, 'Velocity']} />
                  <Bar dataKey="velocity" fill="url(#saVelocityG)" radius={[6, 6, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* SLA Compliance */}
          <Card className="bg-white/85 backdrop-blur-xl border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
            <CardHeader className="pb-2 pt-5 px-5">
              <CardTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>SLA & Scope Compliance Rate</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Percentage of tasks resolved prior to scheduled due date
              </CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-2 h-[270px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics?.monthlyMetrics} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} dy={5} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(val: any) => [`${val}%`, 'Compliance']} />
                  <Line 
                    type="monotone" 
                    dataKey="compliance" 
                    stroke="#10b981" 
                    strokeWidth={3} 
                    dot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} 
                    activeDot={{ r: 7, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          {/* Department Workload */}
          <Card className="bg-white/85 backdrop-blur-xl border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
            <CardHeader className="pb-2 pt-5 px-5">
              <CardTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Activity className="h-4 w-4 text-violet-600" />
                <span>Department Workload Capacity</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Sum of active task sprint points assigned across departments
              </CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-2 h-[270px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics?.deptWorkloadData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {metrics?.deptWorkloadData?.map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(val: any) => [`${val} Pts`, 'Assigned Points']} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Task Pipeline Health */}
          <Card className="bg-white/85 backdrop-blur-xl border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
            <CardHeader className="pb-2 pt-5 px-5">
              <CardTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <LayoutList className="h-4 w-4 text-blue-600" />
                <span>Workflow Pipeline Health</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Distribution of all system tasks by current status
              </CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-2 h-[270px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics?.statusDistributionData} layout="vertical" margin={{ top: 5, right: 25, left: 15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#334155', fontSize: 11, fontWeight: 700 }} width={90} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(241, 245, 249, 0.4)' }} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={16}>
                    {metrics?.statusDistributionData?.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
