import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Download, TrendingUp, CheckCircle2, Clock, Loader2, AlertCircle, ShieldAlert, ListChecks } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

export default function Reports() {
  const { user } = useAuthStore()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    activeProjects: 0,
    completionRate: 0,
    avgCycleTime: '0.0',
    overdueTasks: 0
  })
  
  const [priorities, setPriorities] = useState({ Low: 0, Medium: 0, High: 0, Critical: 0 })
  const [recentCompleted, setRecentCompleted] = useState<any[]>([])
  const [projectProgress, setProjectProgress] = useState<any[]>([])
  const [completionTrend, setCompletionTrend] = useState<any[]>([])
  const [memberWorkload, setMemberWorkload] = useState<any[]>([])

  const fetchReportsData = async () => {
    if (!user) return
    setLoading(true)
    try {
      let adminTeams: any = null
      let teamIds: string[] = []
      try {
        adminTeams = await api.get('/teams?lead_id=' + user.id + '&_select=id')
      } catch (err) {
        console.warn('Error fetching teams:', err)
      }

      if (adminTeams) {
        teamIds = adminTeams?.map((t: any) => t.id) || []
      }

      let queryUrl = '/employee?_select=id,full_name,email,role:roles(name)'
      if (teamIds.length > 0) {
        queryUrl += '&manager_id=' + user.id + '&team_id_in=' + teamIds.join(',')
      } else {
        queryUrl += '&manager_id=' + user.id
      }

      let squadMembers: any = []
      try {
        squadMembers = await api.get(queryUrl)
      } catch (membersErr) {
        throw membersErr
      }

      let targetSquad = (squadMembers || []).filter((u: any) => {
        const roleName = u.role?.name || 'Member'
        const norm = roleName.toLowerCase().replace(/[\s_-]+/g, '')
        return norm === 'employee' || norm === 'member'
      })

      const squadIds = targetSquad.map((m: any) => m.id)

      let managedProjects: any = []
      try {
        managedProjects = await api.get('/task/projects?created_by=' + user.id + '&_select=id,name')
      } catch (projectsErr) {
        throw projectsErr
      }

      let targetProjects = managedProjects || []

      if (targetProjects.length === 0) {
        try {
          targetProjects = await api.get('/task/projects?_select=id,name')
        } catch (allProjectsErr) {
          throw allProjectsErr
        }
      }

      const allTargetProjectIds = targetProjects.map((p: any) => p.id)

      const mappedProjects = targetProjects.map((p: any) => {
        return {
          name: p.name.length > 12 ? p.name.substring(0, 12) + '...' : p.name,
          assigned: 0,
          completed: 0
        }
      }).slice(0, 6)
      setProjectProgress(mappedProjects)

      let allStatsTasks: any[] = []
      let squadTasks: any[] = []
      if (allTargetProjectIds.length > 0) {
        try {
          const res: any = await api.get('/task?_select=id,title,status,priority,due_date,project_id,assignee_id,created_at,updated_at&project_id_in=' + allTargetProjectIds.join(','))
          const fetchedTasks = res.data || res.tasks || []
          allStatsTasks = fetchedTasks
          squadTasks = squadIds.length > 0 ? fetchedTasks.filter((t: any) => squadIds.includes(t.assignee_id)) : fetchedTasks
        } catch (tasksErr) {
          throw tasksErr
        }
      }

      const reportTasks = squadTasks.length > 0 ? squadTasks : allStatsTasks

      const total = reportTasks.length
      const completed = reportTasks.filter(t => t.status === 'Completed').length
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

      let avgDaysStr = '0.0'
      const completedTasks = reportTasks.filter(t => t.status === 'Completed')
      if (completedTasks.length > 0) {
        let totalMs = 0
        completedTasks.forEach(t => {
          const created = new Date(t.created_at).getTime()
          const completed = new Date(t.updated_at).getTime()
          totalMs += Math.max(0, completed - created)
        })
        const avgMs = totalMs / completedTasks.length
        const avgDays = avgMs / (1000 * 60 * 60 * 24)
        avgDaysStr = avgDays.toFixed(1)
      }

      const nowTime = new Date()
      const overdueCount = reportTasks.filter(t => {
        if (t.status === 'Completed') return false
        if (!t.due_date) return false
        return new Date(t.due_date) < nowTime
      }).length

      setStats({
        activeProjects: targetProjects.length,
        completionRate,
        avgCycleTime: avgDaysStr,
        overdueTasks: overdueCount
      })

      const pStats = { Low: 0, Medium: 0, High: 0, Critical: 0 }
      reportTasks.forEach(t => {
        const p = t.priority || 'Medium'
        if (p in pStats) {
          pStats[p as keyof typeof pStats]++
        }
      })
      setPriorities(pStats)

      let recentComp: any = []
      if (squadIds.length > 0) {
        try {
          const res: any = await api.get('/task?_select=id,title,updated_at,assignee:users(full_name),project:projects(name)&status=Completed&assignee_id_in=' + squadIds.join(',') + '&_sort=-updated_at&_limit=5')
          recentComp = res.data || res.tasks || []
        } catch (compErr) {
          throw compErr
        }
      }

      if (recentComp) {
        setRecentCompleted(recentComp)
      }

      const mappedWorkload = targetSquad.map(member => {
        const memberTasks = squadTasks.filter(t => t.assignee_id === member.id)
        return {
          name: member.full_name ? member.full_name.split(' ')[0] : 'Member',
          assigned: memberTasks.length,
          completed: memberTasks.filter(t => t.status === 'Completed').length
        }
      }).slice(0, 6)
      setMemberWorkload(mappedWorkload)

      // 5. Generate Weekly Completion Rate Trend (last 6 weeks)
      // Grouping task completions by calendar weeks
      const now = new Date()
      const weeklyTrendData = Array.from({ length: 6 }).map((_, idx) => {
        const weekNum = 5 - idx
        const endOfWeek = new Date(now.getTime() - weekNum * 7 * 24 * 60 * 60 * 1000)

        // Filter tasks created or completed before/during this week
        const weekTasks = reportTasks.filter(t => {
          const createdDate = new Date(t.created_at)
          return createdDate <= endOfWeek
        })

        const totalTasksInWeek = weekTasks.length
        const completedTasksInWeek = weekTasks.filter(t => {
          if (t.status !== 'Completed') return false
          const completedDate = new Date(t.updated_at)
          return completedDate <= endOfWeek
        }).length

        const rate = totalTasksInWeek > 0 ? Math.round((completedTasksInWeek / totalTasksInWeek) * 100) : 0

        return {
          week: `Wk -${weekNum}`,
          rate: rate
        }
      })
      setCompletionTrend(weeklyTrendData)

    } catch (err: any) {
      console.error('Error loading reports details:', err)
      toast({
        title: 'Error loading workspace reports',
        description: err.message,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReportsData()
  }, [user])

  const handleExportCSV = () => {
    try {
      // Simple export mock of current reports data to CSV
      const rows = [
        ['Metric', 'Value'],
        ['Managed Projects', stats.activeProjects],
        ['Completion Rate', `${stats.completionRate}%`],
        ['Average Task Cycle Time', `${stats.avgCycleTime} Days`],
      ]

      const csvContent = "data:text/csv;charset=utf-8," 
        + rows.map(e => e.join(",")).join("\n")

      const encodedUri = encodeURI(csvContent)
      const link = document.createElement("a")
      link.setAttribute("href", encodedUri)
      link.setAttribute("download", `FusionTMS_Squad_Report_${new Date().toISOString().slice(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: 'Export Success',
        description: 'Squad performance metrics CSV exported successfully.',
      })
    } catch (err: any) {
      toast({
        title: 'Export Failed',
        description: err.message,
        variant: 'destructive'
      })
    }
  }

  if (loading) {
    return (
      <div className="h-[calc(100vh-10rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  return (
    <div className="space-y-4 fade-in duration-500 text-slate-800 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-905">Team Reports</h2>
          <p className="text-slate-500 text-sm mt-0.5">Analyze squad workload distribution, task completion speeds, and project progress.</p>
        </div>
        <Button 
          onClick={handleExportCSV}
          className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold h-10 px-5 rounded-xl shadow-sm hover:scale-[1.01] active:scale-99 transition-all duration-300 cursor-pointer"
        >
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Card 1 */}
        <Card className="relative bg-white border border-slate-200/50 hover:border-teal-500/35 shadow-[0_1px_3px_rgba(0,0,0,0.01),0_8px_20px_rgba(0,0,0,0.01)] hover:shadow-[0_10px_25px_-4px_rgba(20,184,166,0.04)] hover:-translate-y-0.5 transition-all duration-300 rounded-xl overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-teal-550 to-teal-400 opacity-70 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
            <CardTitle className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Managed Projects</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-teal-50/50 flex items-center justify-center border border-teal-100/30">
              <TrendingUp className="h-4 w-4 text-teal-600" />
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="text-2xl font-extrabold text-slate-805 tracking-tight">{stats.activeProjects} Projects</div>
            <p className="text-[11px] text-teal-650 mt-1 font-semibold">Active initiatives in database</p>
          </CardContent>
        </Card>

        {/* Card 2 */}
        <Card className="relative bg-white border border-slate-200/50 hover:border-emerald-500/35 shadow-[0_1px_3px_rgba(0,0,0,0.01),0_8px_20px_rgba(0,0,0,0.01)] hover:shadow-[0_10px_25px_-4px_rgba(16,185,129,0.04)] hover:-translate-y-0.5 transition-all duration-300 rounded-xl overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-emerald-550 to-emerald-400 opacity-70 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
            <CardTitle className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Task Completion Rate</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-50/50 flex items-center justify-center border border-emerald-100/30">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="text-2xl font-extrabold text-slate-805 tracking-tight">{stats.completionRate}%</div>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">Overall ratio of resolved tasks</p>
          </CardContent>
        </Card>

        {/* Card 3 (Overdue Tasks) */}
        <Card className="relative bg-white border border-slate-200/50 hover:border-rose-500/35 shadow-[0_1px_3px_rgba(0,0,0,0.01),0_8px_20px_rgba(0,0,0,0.01)] hover:shadow-[0_10px_25px_-4px_rgba(244,63,94,0.04)] hover:-translate-y-0.5 transition-all duration-300 rounded-xl overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-rose-500 to-rose-400 opacity-70 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
            <CardTitle className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Overdue Tasks</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-rose-50/50 flex items-center justify-center border border-rose-100/30">
              <AlertCircle className="h-4 w-4 text-rose-600" />
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="text-2xl font-extrabold text-slate-805 tracking-tight">{stats.overdueTasks} Tasks</div>
            <p className="text-[11px] text-rose-650 mt-1 font-semibold">Active tasks past due date</p>
          </CardContent>
        </Card>

        {/* Card 4 */}
        <Card className="relative bg-white border border-slate-200/50 hover:border-amber-500/35 shadow-[0_1px_3px_rgba(0,0,0,0.01),0_8px_20px_rgba(0,0,0,0.01)] hover:shadow-[0_10px_25px_-4px_rgba(245,158,11,0.04)] hover:-translate-y-0.5 transition-all duration-300 rounded-xl overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-amber-550 to-amber-400 opacity-70 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
            <CardTitle className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Avg Resolution Speed</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-amber-50/50 flex items-center justify-center border border-amber-100/30">
              <Clock className="h-4 w-4 text-amber-650" />
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="text-2xl font-extrabold text-slate-805 tracking-tight">{stats.avgCycleTime} Days</div>
            <p className="text-[11px] text-amber-600 mt-1 font-semibold">Average task completion cycle</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Chart 1 */}
        <Card className="relative bg-white border border-slate-200/50 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.01),0_12px_24px_rgba(0,0,0,0.015)] hover:border-teal-500/10 transition-colors duration-305 flex flex-col justify-between overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-teal-500 via-cyan-400 to-indigo-400 opacity-70" />
          <CardHeader className="pb-3 pt-4">
            <CardTitle className="text-slate-905 text-base font-bold tracking-tight">Project Completion Distribution</CardTitle>
            <CardDescription className="text-slate-400 text-xs mt-0.5">Comparison of total tasks vs completed tasks per project</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px] pb-4">
            {projectProgress.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm font-semibold">
                No active projects found
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectProgress} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAssigned2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#e2e8f0" stopOpacity={0.8}/>
                      <stop offset="100%" stopColor="#cbd5e1" stopOpacity={0.15}/>
                    </linearGradient>
                    <linearGradient id="colorCompleted2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0d9488" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.3}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: '700' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip 
                    cursor={false}
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      backdropFilter: 'blur(8px)',
                      borderRadius: '12px', 
                      border: '1px solid rgba(226, 232, 240, 0.8)', 
                      fontSize: 11,
                      fontWeight: '600',
                      color: '#1e293b',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)' 
                    }} 
                  />
                  <Bar dataKey="assigned" fill="url(#colorAssigned2)" radius={[5, 5, 0, 0]} name="Assigned" maxBarSize={20} activeBar={false} />
                  <Bar dataKey="completed" fill="url(#colorCompleted2)" radius={[5, 5, 0, 0]} name="Completed" maxBarSize={20} activeBar={false} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Chart 2 */}
        <Card className="relative bg-white border border-slate-200/50 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.01),0_12px_24px_rgba(0,0,0,0.015)] hover:border-indigo-500/10 transition-colors duration-305 flex flex-col justify-between overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-indigo-500 via-purple-400 to-rose-400 opacity-70" />
          <CardHeader className="pb-3 pt-4">
            <CardTitle className="text-slate-905 text-base font-bold tracking-tight">Completion Speed Trend</CardTitle>
            <CardDescription className="text-slate-400 text-xs mt-0.5">Weekly task completion percentage over time</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px] pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={completionTrend} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: '705' }} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip 
                  cursor={false}
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    backdropFilter: 'blur(8px)',
                    borderRadius: '12px', 
                    border: '1px solid rgba(226, 232, 240, 0.8)', 
                    fontSize: 11,
                    fontWeight: '600',
                    color: '#1e293b',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)' 
                  }} 
                />
                <Line type="monotone" dataKey="rate" stroke="#0d9488" strokeWidth={3} dot={{ r: 4.5, fill: '#0d9488', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} name="Completion %" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Member Workload */}
      <Card className="relative bg-white border border-slate-200/50 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.01),0_12px_24px_rgba(0,0,0,0.015)] hover:border-teal-500/10 transition-colors duration-305 flex flex-col justify-between overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-teal-550 to-emerald-450 opacity-70" />
        <CardHeader className="pb-3 pt-4">
          <CardTitle className="text-slate-905 text-base font-bold tracking-tight">Member Workload Distribution</CardTitle>
          <CardDescription className="text-slate-400 text-xs mt-0.5">Task assignment vs completion for each team member</CardDescription>
        </CardHeader>
        <CardContent className="h-[250px] pb-4">
          {memberWorkload.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm font-semibold">
              No active workload data found
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={memberWorkload} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAssigned3" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#e2e8f0" stopOpacity={0.8}/>
                    <stop offset="100%" stopColor="#cbd5e1" stopOpacity={0.15}/>
                  </linearGradient>
                  <linearGradient id="colorCompleted3" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0d9488" stopOpacity={0.9}/>
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.3}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: '700' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip 
                  cursor={false}
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    backdropFilter: 'blur(8px)',
                    borderRadius: '12px', 
                    border: '1px solid rgba(226, 232, 240, 0.8)', 
                    fontSize: 11,
                    fontWeight: '600',
                    color: '#1e293b',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)' 
                  }} 
                />
                <Bar dataKey="assigned" fill="url(#colorAssigned3)" radius={[5, 5, 0, 0]} name="Assigned" maxBarSize={20} activeBar={false} />
                <Bar dataKey="completed" fill="url(#colorCompleted3)" radius={[5, 5, 0, 0]} name="Completed" maxBarSize={20} activeBar={false} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Additional Content: Priority Breakdown & Recent Completed Milestones */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Priority Breakdown */}
        <Card className="relative bg-white border border-slate-200/50 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.01),0_12px_24px_rgba(0,0,0,0.015)] hover:border-teal-500/10 transition-colors duration-305 flex flex-col justify-between overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-sky-500 to-indigo-500 opacity-70" />
          <CardHeader className="pb-3 pt-4 border-b border-slate-50">
            <CardTitle className="text-slate-905 text-base font-bold tracking-tight">Task Priority Breakdown</CardTitle>
            <CardDescription className="text-slate-400 text-xs mt-0.5">Distribution of squad tasks by priority level</CardDescription>
          </CardHeader>
          <CardContent className="pb-6 pt-4 space-y-4 flex-1 flex flex-col justify-center">
            {Object.entries(priorities).map(([priority, count]) => {
              const maxVal = Math.max(...Object.values(priorities), 1)
              const percentage = Math.round((count / maxVal) * 100)
              
              const barColorMap = {
                Low: 'bg-slate-250',
                Medium: 'bg-sky-500',
                High: 'bg-amber-500',
                Critical: 'bg-rose-500'
              }
              const barColor = barColorMap[priority as keyof typeof barColorMap] || 'bg-slate-200'

              return (
                <div key={priority} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-650">
                    <span className="flex items-center space-x-1.5">
                      <span className={`h-2.5 w-2.5 rounded-full ${barColor}`} />
                      <span>{priority}</span>
                    </span>
                    <span className="text-slate-900 font-extrabold">{count} Tasks</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${barColor} transition-all duration-500`} 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Recent Completed Milestones */}
        <Card className="relative bg-white border border-slate-200/50 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.01),0_12px_24px_rgba(0,0,0,0.015)] hover:border-teal-500/10 transition-colors duration-305 flex flex-col justify-between overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-emerald-500 to-teal-500 opacity-70" />
          <CardHeader className="pb-3 pt-4 border-b border-slate-50">
            <CardTitle className="text-slate-905 text-base font-bold tracking-tight">Recent Completed Milestones</CardTitle>
            <CardDescription className="text-slate-400 text-xs mt-0.5">The latest 5 tasks resolved across all projects</CardDescription>
          </CardHeader>
          <CardContent className="pb-6 pt-4 flex-1 flex flex-col justify-center">
            {recentCompleted.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm font-semibold italic">
                No recently completed tasks found
              </div>
            ) : (
              <div className="space-y-3.5">
                {recentCompleted.map((task: any) => (
                  <div key={task.id} className="flex items-start space-x-3 text-left">
                    <div className="mt-0.5 h-6 w-6 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </div>
                    <div className="truncate flex-1">
                      <p className="text-xs font-bold text-slate-800 truncate">{task.title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                        Project: <span className="font-semibold text-slate-500">{task.project?.name || 'Internal'}</span> &bull; Assignee: <span className="font-semibold text-slate-500">{task.assignee?.full_name || 'Unassigned'}</span>
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium shrink-0 pt-0.5">
                      {new Date(task.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
