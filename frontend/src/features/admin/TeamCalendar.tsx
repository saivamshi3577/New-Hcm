import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Clock, CalendarDays, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api, safeArray } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { format, isSameDay, parseISO } from 'date-fns'

export default function TeamCalendar() {
  const { user } = useAuthStore()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  // 1. Fetch team tasks with due dates
  const { data: rawTasks, isLoading: loadingTasks } = useQuery({
    queryKey: ['team-calendar-tasks', user?.id, user?.email],
    queryFn: async () => {
      try {
        const res: any = await api.get('/task?_select=id,title,status,priority,due_date,assignee_id,created_at')
        return safeArray(res, 'tasks')
      } catch (e) {
        return []
      }
    }
  })

  // 2. Fetch organization holidays
  const { data: rawHolidays, isLoading: loadingHolidays } = useQuery({
    queryKey: ['team-calendar-holidays'],
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

  // Events on the selected calendar date
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

  // Upcoming deadlines (next 5 tasks sorted by due date)
  const upcomingDeadlines = useMemo(() => {
    const now = new Date()
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
    <div className="space-y-6 fade-in duration-500 text-slate-800">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-950">Team Calendar</h2>
        <p className="text-slate-500 mt-1">Audit team schedule commitments, deadlines, and project milestones.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <Card className="col-span-4 bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Schedule Board</CardTitle>
            <CardDescription>Select a date to audit scheduled tasks and project milestones.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border border-slate-200 shadow-sm"
            />
          </CardContent>
        </Card>

        <Card className="col-span-3 bg-white border-slate-200 shadow-sm flex flex-col">
          <CardHeader>
            <CardTitle>
              {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Events & Deadlines'}
            </CardTitle>
            <CardDescription>
              {dateEvents.tasks.length > 0 || dateEvents.holidays.length > 0 
                ? 'Scheduled milestones for selected date' 
                : 'Upcoming team deadlines'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 flex-1 overflow-y-auto max-h-[360px]">
            {isLoading ? (
              <div className="h-40 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
              </div>
            ) : dateEvents.tasks.length > 0 || dateEvents.holidays.length > 0 ? (
              <>
                {dateEvents.holidays.map((h: any) => (
                  <div key={h.id || h.title} className="flex items-center gap-3 p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg">
                    <CalendarDays className="h-5 w-5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{h.title || h.name}</p>
                      <p className="text-xs text-emerald-700 mt-0.5 font-medium">Company Holiday</p>
                    </div>
                  </div>
                ))}

                {dateEvents.tasks.map((t: any) => {
                  const isCritical = t.priority === 'Critical' || t.priority === 'High'
                  return (
                    <div 
                      key={t.id} 
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        t.status === 'Completed'
                          ? 'bg-emerald-50/50 border-emerald-100'
                          : isCritical
                          ? 'bg-red-50/50 border-red-100'
                          : 'bg-slate-50 border-slate-100'
                      }`}
                    >
                      {t.status === 'Completed' ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                      ) : isCritical ? (
                        <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                      ) : (
                        <Clock className="h-5 w-5 text-teal-600 shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 truncate">{t.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Status: <span className="font-medium">{t.status || 'Todo'}</span> • Priority: <span className="font-medium">{t.priority || 'Medium'}</span>
                        </p>
                      </div>
                    </div>
                  )
                })}
              </>
            ) : upcomingDeadlines.length > 0 ? (
              <>
                <p className="text-xs text-slate-400 font-medium mb-2">No specific tasks on selected day. Next upcoming team deliverables:</p>
                {upcomingDeadlines.map((t: any) => {
                  const isCritical = t.priority === 'Critical' || t.priority === 'High'
                  return (
                    <div 
                      key={t.id} 
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        isCritical ? 'bg-red-50/50 border-red-100' : 'bg-teal-50/40 border-teal-100'
                      }`}
                    >
                      <Clock className={`h-5 w-5 shrink-0 ${isCritical ? 'text-red-600' : 'text-teal-600'}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 truncate">{t.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Due {format(t.parsedDate, 'MMM d, yyyy')} • {t.priority || 'Normal'}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </>
            ) : (
              <div className="h-32 flex flex-col items-center justify-center text-slate-400 text-sm">
                <CheckCircle2 className="h-6 w-6 mb-1.5 text-emerald-500" />
                <p>No pending deadlines or events</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
