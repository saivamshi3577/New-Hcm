import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { CalendarDays, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api, safeArray } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { format, isSameDay, parseISO } from 'date-fns'

export default function PersonalCalendar() {
  const { profile } = useAuthStore()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  // 1. Fetch employee's assigned tasks
  const { data: rawTasks, isLoading: loadingTasks } = useQuery({
    queryKey: ['personal-calendar-tasks', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      if (!profile?.id) return []
      try {
        const res: any = await api.get('/task?assignee_id=' + profile.id + '&_select=id,title,status,priority,due_date,created_at')
        return safeArray(res, 'tasks')
      } catch (e) {
        return []
      }
    }
  })

  const { data: rawHolidays, isLoading: loadingHolidays } = useQuery({
    queryKey: ['personal-calendar-holidays'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/holidays')
        return safeArray(res, 'holidays')
      } catch (e) {
        return []
      }
    }
  })

  const tasks = useMemo(() => safeArray(rawTasks), [rawTasks])
  const holidays = useMemo(() => safeArray(rawHolidays), [rawHolidays])

  const dateEvents = useMemo(() => {
    if (!selectedDate) return { tasks: [], holidays: [] }

    const matchedTasks = tasks.filter((t: any) => {
      if (!t.due_date) return false
      try {
        const d = parseISO(t.due_date)
        return isSameDay(d, selectedDate)
      } catch (e) {
        return false
      }
    })

    const matchedHolidays = holidays.filter((h: any) => {
      if (!h.date) return false
      try {
        const d = parseISO(h.date)
        return isSameDay(d, selectedDate)
      } catch (e) {
        return false
      }
    })

    return { tasks: matchedTasks, holidays: matchedHolidays }
  }, [tasks, holidays, selectedDate])
  const upcomingDeadlines = useMemo(() => {
    return tasks
      .filter((t: any) => t.due_date && t.status !== 'Completed')
      .map((t: any) => {
        try {
          return { ...t, parsedDate: parseISO(t.due_date) }
        } catch (e) {
          return null
        }
      })
      .filter(Boolean)
      .sort((a: any, b: any) => a.parsedDate.getTime() - b.parsedDate.getTime())
      .slice(0, 5)
  }, [tasks])

  const isLoading = loadingTasks || loadingHolidays

  return (
    <div className="space-y-4 text-slate-800">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">My Calendar</h2>
        <p className="text-muted-foreground text-sm mt-0.5">Audit your personal schedule, deadlines, and active sprint slots.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        <Card className="col-span-4 glass-card-strong border-violet-100/30 glow-on-hover transition-all duration-300">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm font-semibold">Schedule Board</CardTitle>
            <CardDescription className="text-[10px]">Select a date to audit scheduled tasks and sprint milestones.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center p-3">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-xl border border-violet-100/40 shadow-sm"
            />
          </CardContent>
        </Card>

        <Card className="col-span-3 glass-card-strong border-violet-100/30 glow-on-hover transition-all duration-300 flex flex-col">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm font-semibold text-slate-900">
              {selectedDate ? format(selectedDate, 'MMM d, yyyy') : 'Task Deadlines'}
            </CardTitle>
            <CardDescription className="text-[10px]">
              {dateEvents.tasks.length > 0 || dateEvents.holidays.length > 0 
                ? 'Scheduled deliverables for this date' 
                : 'Your upcoming task deliverables'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 px-4 pb-4 flex-1 overflow-y-auto max-h-[340px]">
            {isLoading ? (
              <div className="h-32 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
              </div>
            ) : dateEvents.tasks.length > 0 || dateEvents.holidays.length > 0 ? (
              <>
                {dateEvents.holidays.map((h: any) => (
                  <div key={h.id || h.title} className="flex items-center gap-3 p-3 glass-card accent-bar-left rounded-xl hover-lift transition-all duration-300">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-sm ml-1.5 shrink-0">
                      <CalendarDays className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{h.title || h.name}</p>
                      <p className="text-[10px] text-emerald-700 mt-0.5 font-medium">Holiday</p>
                    </div>
                  </div>
                ))}

                {dateEvents.tasks.map((t: any) => {
                  const isCompleted = t.status === 'Completed'
                  return (
                    <div key={t.id} className="flex items-center gap-3 p-3 glass-card accent-bar-left rounded-xl hover-lift transition-all duration-300">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center shadow-sm ml-1.5 shrink-0 ${
                        isCompleted ? 'bg-gradient-to-br from-emerald-500 to-teal-500' : 'bg-gradient-to-br from-violet-500 to-indigo-500'
                      }`}>
                        {isCompleted ? <CheckCircle2 className="h-3.5 w-3.5 text-white" /> : <CalendarDays className="h-3.5 w-3.5 text-white" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 truncate">{t.title}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                          {isCompleted ? 'Completed' : 'Due today'} • Priority: {t.priority || 'Medium'}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </>
            ) : upcomingDeadlines.length > 0 ? (
              <>
                <p className="text-[10px] text-slate-400 font-medium mb-1">Upcoming deliverables assigned to you:</p>
                {upcomingDeadlines.map((t: any) => (
                  <div key={t.id} className="flex items-center gap-3 p-3 glass-card accent-bar-left rounded-xl hover-lift transition-all duration-300">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-sm ml-1.5 shrink-0">
                      <Clock className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 truncate">{t.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                        Due {format(t.parsedDate, 'MMM d, yyyy')} • {t.priority || 'Normal'}
                      </p>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="h-28 flex flex-col items-center justify-center text-slate-400 text-xs">
                <CheckCircle2 className="h-5 w-5 mb-1 text-emerald-500" />
                <p>No pending deadlines for you</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
