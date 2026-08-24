import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { Award, TrendingUp, CheckCircle2, Flame, Target, Calendar } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

export default function Performance() {
  const { profile } = useAuthStore()
  const [userScore, setUserScore] = useState(0)
  const [teamAvg, setTeamAvg] = useState(0)
  const currentMonthKey = new Date().toLocaleString('default', { month: 'short', year: 'numeric' })
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey)
  const [availableMonths, setAvailableMonths] = useState<string[]>([currentMonthKey, 'All Time'])

  const [tasksThisMonth, setTasksThisMonth] = useState(0)
  const [tasksMonthChange, setTasksMonthChange] = useState(0)
  const [earnedPoints, setEarnedPoints] = useState(0)
  
  const [onTimePercentage, setOnTimePercentage] = useState(100)
  const [lateTasksCount, setLateTasksCount] = useState(0)
  
  const [velocityTrend, setVelocityTrend] = useState('Steady')
  const [velocityText, setVelocityText] = useState('Consistent performance')

  const [weeklyChartData, setWeeklyChartData] = useState<any[]>([])
  const [dailyChartData, setDailyChartData] = useState<any[]>([])

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPerformance = async () => {
      if (!profile) return
      setLoading(true)
      try {
        let teamMemberIds = [profile.id]
        if (profile.manager_id) {
          let teamMembers: any = []
          try {
            teamMembers = await api.get('/employee?manager_id=' + profile.manager_id + '&_select=id')
          } catch (e) {}
          if (teamMembers) {
            teamMemberIds = teamMembers.map(m => m.id)
            if (!teamMemberIds.includes(profile.id)) {
              teamMemberIds.push(profile.id)
            }
          }
        }

        let tasks: any = []
        try {
          const res: any = await api.get('/task?_select=id,status,assignee_id,due_date,created_at,updated_at,points,evaluated_points&assignee_id_in=' + teamMemberIds.join(','))
          tasks = res.data || res.tasks || []
        } catch (e) {}

        if (tasks) {
          // Collect all distinct months from task dates
          const monthsSet = new Set<string>()
          monthsSet.add(currentMonthKey)
          tasks.forEach((t: any) => {
            const dateStr = t.updated_at || t.created_at
            if (dateStr) {
              const d = new Date(dateStr)
              if (!isNaN(d.getTime())) {
                monthsSet.add(d.toLocaleString('default', { month: 'short', year: 'numeric' }))
              }
            }
          })
          const sortedMonths = Array.from(monthsSet).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
          if (!sortedMonths.includes('All Time')) {
            sortedMonths.push('All Time')
          }
          setAvailableMonths(sortedMonths)

          // Filter user tasks by selected month
          const userTasks = tasks.filter(t => t.assignee_id === profile.id)
          const isAllTime = selectedMonth === 'All Time'

          const filteredUserTasks = userTasks.filter(t => {
            if (isAllTime) return true
            const dateStr = t.updated_at || t.created_at
            if (!dateStr) return false
            const d = new Date(dateStr)
            if (isNaN(d.getTime())) return false
            return d.toLocaleString('default', { month: 'short', year: 'numeric' }) === selectedMonth
          })

          // Calculate points earned in the selected month (starts at 0 when a new month starts)
          const completedInSelectedMonth = filteredUserTasks.filter(t => t.status === 'Completed')
          const ptsEarned = completedInSelectedMonth.reduce((sum, t) => {
            const rawPts = t.evaluated_points !== null && t.evaluated_points !== undefined && t.evaluated_points > 0
              ? t.evaluated_points
              : (t.points || 0)
            return sum + (Number(rawPts) || 0)
          }, 0)
          setEarnedPoints(ptsEarned)

          const calculateScore = (memberId: string) => {
            const memberTasks = tasks.filter(t => t.assignee_id === memberId)
            const total = memberTasks.length
            const completed = memberTasks.filter(t => t.status === 'Completed').length
            return total > 0 ? Math.round((completed / total) * 100) : 0
          }

          const myScore = calculateScore(profile.id)
          setUserScore(myScore)

          let totalScore = 0
          let validMembers = 0
          teamMemberIds.forEach(id => {
            const memberTasks = tasks.filter(t => t.assignee_id === id)
            if (memberTasks.length > 0) {
              totalScore += calculateScore(id)
              validMembers++
            }
          })
          
          const avg = validMembers > 0 ? Math.round(totalScore / validMembers) : 0
          setTeamAvg(avg)

          // Tasks in Selected Month
          setTasksThisMonth(filteredUserTasks.length)

          // Calculate month-over-month change for comparison
          const now = new Date()
          const currentMonth = now.getMonth()
          const currentYear = now.getFullYear()
          const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
          const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear

          const thisMonthTasks = userTasks.filter(t => {
            if (!t.created_at) return false
            const d = new Date(t.created_at)
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear
          })
          
          const lastMonthTasks = userTasks.filter(t => {
            if (!t.created_at) return false
            const d = new Date(t.created_at)
            return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear
          })

          const mChange = lastMonthTasks.length > 0 
            ? Math.round(((thisMonthTasks.length - lastMonthTasks.length) / lastMonthTasks.length) * 100)
            : thisMonthTasks.length > 0 ? 100 : 0
          setTasksMonthChange(mChange)

          // Calculate On-Time Delivery for selected month tasks
          const lateTasks = filteredUserTasks.filter(t => {
             if (t.status === 'Completed' || !t.due_date) return false
             return new Date(t.due_date) < now
          })
          setLateTasksCount(lateTasks.length)
          const onTimeScore = filteredUserTasks.length > 0 
            ? Math.round(((filteredUserTasks.length - lateTasks.length) / filteredUserTasks.length) * 100)
            : 100
          setOnTimePercentage(onTimeScore)

          // Calculate Velocity Trend
          const thisMonthCompleted = thisMonthTasks.filter(t => t.status === 'Completed').length
          const lastMonthCompleted = lastMonthTasks.filter(t => t.status === 'Completed').length
          
          if (thisMonthCompleted > lastMonthCompleted) {
             setVelocityTrend('Rising')
             setVelocityText('Consistently improving')
          } else if (thisMonthCompleted < lastMonthCompleted) {
             setVelocityTrend('Falling')
             setVelocityText('Needs attention')
          } else {
             setVelocityTrend('Steady')
             setVelocityText('Consistent performance')
          }

          // Calculate Weekly Task Completion (last 6 weeks)
          const weeklyData: any[] = []
          for (let i = 5; i >= 0; i--) {
            const endDate = new Date(now)
            endDate.setDate(now.getDate() - (i * 7))
            const startDate = new Date(endDate)
            startDate.setDate(endDate.getDate() - 7)
            
            const weekTasks = userTasks.filter(t => {
               if (!t.created_at) return false
               const d = new Date(t.created_at)
               return d >= startDate && d <= endDate
            })
            
            const target = weekTasks.length
            const completed = weekTasks.filter(t => t.status === 'Completed').length
            
            weeklyData.push({
                week: `Week ${6 - i}`,
                completed,
                target: Math.max(target, completed + 2)
            })
          }
          setWeeklyChartData(weeklyData)

          // Calculate Daily Performance Trend (last 7 days)
          const dailyData: any[] = []
          for (let i = 6; i >= 0; i--) {
            const dDate = new Date(now)
            dDate.setDate(now.getDate() - i)
            const dayString = dDate.toLocaleDateString('en-US', { weekday: 'short' })
            
            const dTasks = userTasks.filter(t => {
               if (!t.created_at) return false
               const d = new Date(t.created_at)
               return d.toDateString() === dDate.toDateString()
            })
            
            const dCompleted = dTasks.filter(t => t.status === 'Completed').length
            const dScore = dTasks.length > 0 ? Math.round((dCompleted / dTasks.length) * 100) : (i === 0 ? myScore : 75)
            
            dailyData.push({
                day: dayString,
                score: dScore
            })
          }
          setDailyChartData(dailyData)

        }
      } catch (err) {
        console.error('Failed to fetch performance data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchPerformance()
  }, [profile, selectedMonth])

  const diff = userScore - teamAvg

  if (loading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading performance data...</div>
  }

  return (
    <div className="space-y-4 text-slate-800">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">My Performance & Points</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Track your productivity, points earned per month, and task completion trends.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Month Filter Selector for Employee Points */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
            <Calendar className="h-4 w-4 text-violet-600 shrink-0" />
            <span className="text-xs font-bold text-slate-700 whitespace-nowrap">Points Month:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg px-2 py-1 font-bold focus:outline-none focus:ring-1 focus:ring-violet-500"
            >
              {availableMonths.map(m => (
                <option key={m} value={m}>
                  {m === currentMonthKey ? `${m} (Current Month)` : m}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 shimmer-badge text-violet-700 text-xs font-semibold px-3.5 py-1.5 rounded-full border border-violet-200/60">
            <Flame className="h-3.5 w-3.5 text-orange-500" />
            12-day streak!
          </div>
        </div>
      </div>

      {/* Performance KPIs */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 stagger-children">
        <Card className="glass-card hover-lift glow-on-hover border-violet-100/30 group cursor-default">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
            <CardTitle className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Points Earned ({selectedMonth})</CardTitle>
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <Award className="h-3.5 w-3.5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-2xl font-extrabold text-slate-950 kpi-value">{earnedPoints} pts</div>
            <p className="text-[10px] text-violet-600 mt-0.5 font-semibold">
              Resets each month (Past months preserved)
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card hover-lift glow-on-hover border-emerald-100/30 group cursor-default">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
            <CardTitle className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Tasks ({selectedMonth})</CardTitle>
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <CheckCircle2 className="h-3.5 w-3.5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-2xl font-extrabold text-slate-950 kpi-value">{tasksThisMonth} Tasks</div>
            <p className={`text-[10px] mt-0.5 font-semibold ${tasksMonthChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {tasksMonthChange >= 0 ? '+' : ''}{tasksMonthChange}% vs last month
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card hover-lift glow-on-hover border-blue-100/30 group cursor-default">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
            <CardTitle className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">On-Time Delivery</CardTitle>
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <Target className="h-3.5 w-3.5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-2xl font-extrabold text-slate-950 kpi-value">{onTimePercentage}%</div>
            <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">
              {lateTasksCount > 0 ? `${lateTasksCount} late tasks in ${selectedMonth}` : '100% on-time execution'}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card hover-lift glow-on-hover border-amber-100/30 group cursor-default">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
            <CardTitle className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Velocity Trend</CardTitle>
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <TrendingUp className="h-3.5 w-3.5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-2xl font-extrabold text-slate-950 kpi-value">{velocityTrend}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">{velocityText}</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="glass-card border-violet-100/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Weekly Task Output Trend</CardTitle>
            <CardDescription className="text-xs">Completed tasks vs target velocity over the last 6 weeks</CardDescription>
          </CardHeader>
          <CardContent className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="week" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="completed" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Completed" />
                <Bar dataKey="target" fill="#e2e8f0" radius={[4, 4, 0, 0]} name="Target" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card border-violet-100/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Daily Productivity Score</CardTitle>
            <CardDescription className="text-xs">Task execution efficiency over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 4 }} name="Efficiency %" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
