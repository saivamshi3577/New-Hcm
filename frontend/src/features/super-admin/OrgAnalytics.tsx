import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useQuery } from '@tanstack/react-query'
import { api, safeArray } from '@/lib/api'
import { format } from 'date-fns'

const tooltipStyle = {
  backgroundColor: 'rgba(255,255,255,0.95)',
  borderRadius: '10px',
  border: '1px solid rgba(226,232,240,0.8)',
  boxShadow: '0 8px 24px rgba(0,0,0,0.08), 0 2px 8px rgba(99,102,241,0.06)',
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
        // Velocity calculation based on evaluated points first, then planning points, fallback to priority weights
        const taskPoints = t.evaluated_points !== null && t.evaluated_points !== undefined && t.evaluated_points > 0
          ? t.evaluated_points
          : (t.points > 0 ? t.points : (
              t.priority === 'Critical' ? 5 :
              t.priority === 'High' ? 3 :
              t.priority === 'Medium' ? 2 : 1
            ));
        velocity += taskPoints;

        // SLA Compliance calculation
        if (!t.due_date) {
          compliantTasks++ // If no due date, assume compliant
        } else {
          const dueDate = new Date(t.due_date)
          const updatedDate = new Date(t.updated_at)
          // set hours to 0 for pure date comparison just in case
          dueDate.setHours(23, 59, 59, 999)
          if (updatedDate <= dueDate) {
            compliantTasks++
          }
        }
      })

      const compliance = completedThisMonth.length > 0 
        ? Math.round((compliantTasks / completedThisMonth.length) * 100) 
        : 100 // Default to 100% if no tasks completed, meaning no SLA breaches

      monthlyMetrics.push({ month: monthLabel, velocity, compliance })
    }

    // Department Workload Distribution (Active Tasks Points sum)
    const activeTasks = tasks.filter((t: any) => t.status !== 'Completed')
    const deptWorkloadMap: Record<string, number> = {}
    
    activeTasks.forEach((t: any) => {
      const taskWeight = t.evaluated_points !== null && t.evaluated_points !== undefined && t.evaluated_points > 0
        ? t.evaluated_points
        : (t.points > 0 ? t.points : 1);
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

    // Task Pipeline Health (Status Distribution)
    const statusCountMap: Record<string, number> = {}
    tasks.forEach((t: any) => {
      const status = t.status || 'Todo'
      statusCountMap[status] = (statusCountMap[status] || 0) + 1
    })

    const statusDistributionData = Object.entries(statusCountMap)
      .map(([name, value]) => ({ name, value, fill: STATUS_COLORS[name] || '#94a3b8' }))
      .sort((a, b) => b.value - a.value)

    return {
      monthlyMetrics,
      deptWorkloadData,
      statusDistributionData
    }
  }, [rawTasks, rawUsers])

  const isLoading = loadingTasks || loadingUsers

  return (
    <div className="space-y-5 sa-page-enter text-slate-800">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight sa-gradient-text">Organization Analytics</h2>
          <p className="text-slate-400 mt-0.5 text-sm">Configure, audit, and export company-wide productivity audits and resource analytics.</p>
        </div>
        <Button className="sa-btn-primary h-9 px-4">
          <Download className="mr-2 h-4 w-4" />
          Export CSV Report
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-7 w-7 animate-spin text-indigo-500" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="sa-card sa-gradient-border overflow-hidden">
            <div className="p-4 pb-2">
              <h3 className="text-sm font-bold text-slate-800">Sprint Velocity Index</h3>
              <p className="text-xs text-slate-400 mt-0.5">Aggregated task resolution weight over time</p>
            </div>
            <div className="px-4 pb-4 h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics?.monthlyMetrics}>
                  <defs>
                    <linearGradient id="saVelocityG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="velocity" fill="url(#saVelocityG)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="sa-card sa-gradient-border overflow-hidden">
            <div className="p-4 pb-2">
              <h3 className="text-sm font-bold text-slate-800">SLA & Scope Compliance</h3>
              <p className="text-xs text-slate-400 mt-0.5">Percentage of tasks resolved before the due date threshold</p>
            </div>
            <div className="px-4 pb-4 h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics?.monthlyMetrics}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="compliance" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="sa-card sa-gradient-border overflow-hidden">
            <div className="p-4 pb-2">
              <h3 className="text-sm font-bold text-slate-800">Department Workload Distribution</h3>
              <p className="text-xs text-slate-400 mt-0.5">Sum of active task sprint points assigned per department</p>
            </div>
            <div className="px-4 pb-4 h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics?.deptWorkloadData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {metrics?.deptWorkloadData?.map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#64748b' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="sa-card sa-gradient-border overflow-hidden">
            <div className="p-4 pb-2">
              <h3 className="text-sm font-bold text-slate-800">Task Pipeline Health</h3>
              <p className="text-xs text-slate-400 mt-0.5">Distribution of all tasks by current status</p>
            </div>
            <div className="px-4 pb-4 h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics?.statusDistributionData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} width={80} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{fill: 'rgba(241, 245, 249, 0.5)'}} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {metrics?.statusDistributionData?.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
        </div>
      )}
    </div>
  )
}
