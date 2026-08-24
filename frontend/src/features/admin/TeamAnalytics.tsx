import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Download, Loader2, TrendingUp, CheckCircle2, ListChecks, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useQuery } from '@tanstack/react-query'
import { api, safeArray } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/hooks/use-toast'
import { startOfWeek, addDays, format, isSameDay } from 'date-fns'

const tooltipStyle = {
  backgroundColor: '#fff',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
}

export default function TeamAnalytics() {
  const { user } = useAuthStore()
  const { toast } = useToast()

  const { data: rawTasks, isLoading: loadingTasks } = useQuery({
    queryKey: ['admin-team-analytics-tasks', user?.id, user?.email],
    queryFn: async () => {
      try {
        const res: any = await api.get('/task?_select=id,title,status,priority,due_date,created_at,updated_at,assignee_id,points,evaluated_points')
        return safeArray(res, 'tasks')
      } catch (e) {
        return []
      }
    }
  })

  const { data: rawEmployees, isLoading: loadingEmployees } = useQuery({
    queryKey: ['admin-team-analytics-employees', user?.id, user?.email],
    queryFn: async () => {
      try {
        const res: any = await api.get('/employee?_select=id,full_name,email')
        return safeArray(res, 'employees')
      } catch (e) {
        return []
      }
    }
  })

  const tasks = useMemo(() => safeArray(rawTasks), [rawTasks])
  const employees = useMemo(() => safeArray(rawEmployees), [rawEmployees])

  const weeklyWorkload = useMemo(() => {
    const now = new Date()
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }) // Monday

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    
    return days.map((dayName, index) => {
      const targetDate = addDays(weekStart, index)

      const completedCount = tasks.filter((t: any) => {
        if (t.status !== 'Completed' || !t.updated_at) return false
        const d = new Date(t.updated_at)
        return isSameDay(d, targetDate)
      }).length

      const activeCount = tasks.filter((t: any) => {
        if (t.status === 'Completed' || !t.created_at) return false
        const d = new Date(t.created_at)
        return isSameDay(d, targetDate)
      }).length

      return {
        name: dayName,
        completed: completedCount,
        active: activeCount,
      }
    })
  }, [tasks])

  const totalCompleted = useMemo(() => tasks.filter((t: any) => t.status === 'Completed').length, [tasks])
  const totalActive = useMemo(() => tasks.filter((t: any) => t.status !== 'Completed').length, [tasks])
  const completionRate = useMemo(() => {
    const total = tasks.length
    return total > 0 ? Math.round((totalCompleted / total) * 100) : 0
  }, [tasks, totalCompleted])

  const handleExportCSV = () => {
    try {
      const rows = [
        ['Day', 'Completed Tasks', 'Active Tasks'],
        ...weeklyWorkload.map(d => [d.name, d.completed, d.active]),
        [],
        ['Total Completed', totalCompleted],
        ['Total Active', totalActive],
        ['Completion Rate', `${completionRate}%`],
      ]

      const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n")
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement("a")
      link.setAttribute("href", encodedUri)
      link.setAttribute("download", `Team_Productivity_Report_${format(new Date(), 'yyyy-MM-dd')}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: 'Export Success',
        description: 'Team productivity CSV exported successfully.',
      })
    } catch (err: any) {
      toast({
        title: 'Export Failed',
        description: err.message,
        variant: 'destructive'
      })
    }
  }

  const isLoading = loadingTasks || loadingEmployees

  return (
    <div className="space-y-6 fade-in duration-500 text-slate-800">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-950">Team Productivity Reports</h2>
          <p className="text-slate-500 mt-1">Audit team velocities, workloads, and real-time sprint execution metrics.</p>
        </div>
        <Button onClick={handleExportCSV} className="bg-teal-600 hover:bg-teal-700 text-white font-medium shadow-md">
          <Download className="mr-2 h-4 w-4" />
          Export Team CSV
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completed Tasks</p>
              <div className="text-2xl font-bold text-slate-900 mt-1">{totalCompleted}</div>
            </div>
            <div className="h-10 w-10 rounded-xl bg-teal-50 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-teal-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Workflows</p>
              <div className="text-2xl font-bold text-slate-900 mt-1">{totalActive}</div>
            </div>
            <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <ListChecks className="h-5 w-5 text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Resolution Rate</p>
              <div className="text-2xl font-bold text-slate-900 mt-1">{completionRate}%</div>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Daily Velocity Index</CardTitle>
          <CardDescription>Daily breakdown of completed vs active tasks for the current week</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-teal-600" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyWorkload} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#64748b' }} />
                <Bar dataKey="completed" fill="#0d9488" radius={[4, 4, 0, 0]} name="Completed Tasks" />
                <Bar dataKey="active" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Active / Created" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
