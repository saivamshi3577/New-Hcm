import { useState, useMemo } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, safeArray } from '@/lib/api'
import { Calendar, Clock, AlertTriangle, CheckCircle, XCircle, Moon, Edit2, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Timezone-safe local date conversion helpers
const getLocalYYYYMMDD = (date: Date) => {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const parseLocalDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

interface AttendanceViewDialogProps {
  userId: string
  userName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function AttendanceViewDialog({ userId, userName, open, onOpenChange }: AttendanceViewDialogProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const { profile, role } = useAuthStore()
  const isSuperAdmin = role === 'super_admin'
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  const [editingDate, setEditingDate] = useState<string | null>(null)
  const [newStatus, setNewStatus] = useState<string>('')

  // Fetch employee attendance
  const { data: rawAttendanceList } = useQuery({
    queryKey: ['employee-attendance-history', userId],
    enabled: !!userId && open,
    queryFn: async () => {
      try {
        const data: any = await api.get(`/employee/attendance?user_id=${userId}`)
        return safeArray(data, 'attendance')
      } catch (error) {
        return []
      }
    }
  })

  const attendanceList = useMemo(() => safeArray(rawAttendanceList, 'attendance'), [rawAttendanceList])

  // Fetch holidays list
  const { data: rawHolidays } = useQuery({
    queryKey: ['holidays-list'],
    enabled: open,
    queryFn: async () => {
      try {
        const data: any = await api.get('/holidays')
        return safeArray(data)
      } catch (error) {
        return []
      }
    }
  })

  const holidays = useMemo(() => safeArray(rawHolidays), [rawHolidays])

  // Fetch employee details (like joining_date)
  const { data: employeeDetail } = useQuery({
    queryKey: ['employee-detail-joining', userId],
    enabled: !!userId && open,
    queryFn: async () => {
      const data: any = await api.get(`/employee/${userId}`)
      return data?.user || data?.employee || data || null
    }
  })

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    
    const days: (Date | null)[] = []
    const startDayOfWeek = firstDay.getDay()
    
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null)
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i))
    }
    return days
  }

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const rawDays = getDaysInMonth(currentMonth)
    const today = new Date()
    const todayStr = getLocalYYYYMMDD(today)
    
    return rawDays.map((day) => {
      if (!day) return null
      
      const dateStr = getLocalYYYYMMDD(day)
      const holiday = safeArray(holidays).find((h: any) => h.date === dateStr)
      const att = safeArray(attendanceList, 'attendance').find((a: any) => a.date === dateStr)
      
      const isWeekend = day.getDay() === 0 || day.getDay() === 6
      const isFuture = day > today && dateStr !== todayStr
      
      const joinDateStr = employeeDetail?.joining_date
      let isPreJoining = false
      if (joinDateStr) {
        const joinDate = parseLocalDate(joinDateStr)
        const compareDay = new Date(day.getFullYear(), day.getMonth(), day.getDate())
        const compareJoin = new Date(joinDate.getFullYear(), joinDate.getMonth(), joinDate.getDate())
        isPreJoining = compareDay < compareJoin
      }

      let status = 'unmarked'
      if (isFuture) {
        status = 'future'
      } else if (isPreJoining) {
        status = 'unmarked'
      } else if (holiday) {
        status = 'holiday'
      } else if (isWeekend) {
        status = 'weekend'
      } else if (att) {
        status = att.status || 'present'
      } else if (dateStr === todayStr) {
        status = 'pending'
      } else {
        status = 'absent'
      }
      
      return {
        date: day,
        dateStr,
        status,
        holiday,
        record: att || null
      }
    })
  }, [currentMonth, attendanceList, holidays])

  const stats = useMemo(() => {
    const days = calendarDays.filter(d => d !== null) as any[]
    let present = 0
    let late = 0
    let halfDay = 0
    let absent = 0
    
    days.forEach(day => {
      if (day.status === 'present') present++
      else if (day.status === 'late') late++
      else if (day.status === 'half_day') halfDay++
      else if (day.status === 'absent') absent++
    })
    
    const lateAbsents = Math.floor(late / 4)
    const halfDayAbsents = halfDay * 0.5
    const LOP = absent + lateAbsents + halfDayAbsents
    
    return {
      present,
      late,
      halfDay,
      absent,
      LOP
    }
  }, [calendarDays])

  const editingRecord = useMemo(() => {
    return safeArray(attendanceList, 'attendance').find((a: any) => a.date === editingDate)
  }, [attendanceList, editingDate])

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingDate) return

      let attendanceId = editingRecord?.id
      
      if (attendanceId) {
        await api.put(`/employee/attendance/${attendanceId}`, { status: newStatus })
      } else {
        const data: any = await api.post('/employee/attendance', { user_id: userId, date: editingDate, status: newStatus })
        attendanceId = data?.id || data?.attendance?.id || (Array.isArray(data) ? data[0]?.id : null)
      }

      if (profile?.id) {
        await api.post('/activity_logs', {
          user_id: profile.id,
          action: 'Adjusted Attendance',
          entity_type: 'Access',
          details: `changed attendance status for ${userName} on ${editingDate} to ${newStatus.replace('_', ' ')}`
        }).catch(console.error)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-attendance-history', userId] })
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] })
      toast({ title: 'Success', description: 'Attendance adjusted successfully' })
      setEditingDate(null)
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    }
  })

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-white border border-slate-200 p-6 rounded-2xl shadow-2xl text-slate-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-indigo-700">
            <Calendar className="h-5 w-5 text-indigo-600" />
            <span>Attendance Details: {userName}</span>
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Monthly attendance tracking, late logins, half days, and Loss of Pay (LOP) calculations.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
          {/* Left: Monthly Calendar */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
              <Button 
                variant="ghost" 
                size="sm" 
                className="hover:bg-slate-200 text-slate-600 h-8"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
              >
                ← Prev
              </Button>
              <span className="font-bold text-slate-800 text-sm">
                {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="hover:bg-slate-200 text-slate-600 h-8"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
              >
                Next →
              </Button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center font-bold text-slate-400 text-[10px] uppercase py-1 border-b border-slate-100">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.map((day, idx) => {
                if (!day) return <div key={`empty-${idx}`} className="h-12 bg-slate-50/20 rounded-lg" />
                
                let styleClass = 'bg-white border-slate-100 text-slate-700'
                if (day.status === 'present') {
                  styleClass = 'bg-emerald-50/80 border-emerald-200 text-emerald-700'
                } else if (day.status === 'late') {
                  styleClass = 'bg-lime-50/80 border-lime-200 text-lime-800'
                } else if (day.status === 'half_day') {
                  styleClass = 'bg-amber-50/80 border-amber-200 text-amber-700'
                } else if (day.status === 'absent') {
                  styleClass = 'bg-rose-50/85 border-rose-200 text-rose-700'
                } else if (day.status === 'weekend') {
                  styleClass = 'bg-slate-100/50 border-slate-200/50 text-slate-400'
                } else if (day.status === 'holiday') {
                  styleClass = 'bg-yellow-50/80 border-yellow-200 text-yellow-800'
                } else if (day.status === 'pending') {
                  styleClass = 'bg-blue-50/50 border-blue-200 text-blue-600 animate-pulse'
                } else if (day.status === 'unmarked' || day.status === 'future') {
                  styleClass = 'bg-slate-50/40 border-slate-100/60 text-slate-350 opacity-50'
                }
                
                return (
                  <div
                    key={day.dateStr}
                    className={`h-12 p-1 rounded-xl border flex flex-col justify-between transition-all text-left relative overflow-hidden group ${styleClass}`}
                  >
                    <span className="text-[10px] font-bold opacity-60 leading-none">
                      {day.date.getDate()}
                    </span>
                    
                    {isSuperAdmin && day.status !== 'future' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingDate(day.dateStr)
                          setNewStatus(day.status === 'unmarked' ? 'present' : day.status)
                        }}
                        className="absolute top-0 right-0 bg-white/80 p-1 rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm border border-slate-200"
                        title="Adjust Attendance"
                      >
                        <Edit2 className="h-3 w-3 text-slate-500 hover:text-indigo-600" />
                      </button>
                    )}

                    {day.status !== 'future' && day.status !== 'weekend' && day.status !== 'holiday' && day.record && (
                      <span className="text-[8px] font-semibold tracking-tight truncate leading-none mt-auto block text-center">
                        {day.record.work_hours || 0}h
                      </span>
                    )}

                    {day.status === 'holiday' && (
                      <span className="text-[7px] font-extrabold text-yellow-700 truncate w-full text-center leading-none mt-auto" title={day.holiday?.title}>
                        Holiday
                      </span>
                    )}

                    {day.status === 'weekend' && (
                      <span className="text-[7px] font-bold text-slate-400 truncate w-full text-center leading-none mt-auto">
                        Off
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right: Summary Statistics & Rules */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
              <h3 className="font-bold text-sm text-slate-800">Month Summary</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">Presents</span>
                  <span className="text-xl font-extrabold text-emerald-800 mt-0.5">{stats.present} days</span>
                </div>
                
                <div className="bg-lime-50 border border-lime-100 p-3 rounded-xl flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-lime-600 uppercase tracking-wide">Late Logins</span>
                  <span className="text-xl font-extrabold text-lime-800 mt-0.5">{stats.late} days</span>
                </div>

                <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wide">Half Days</span>
                  <span className="text-xl font-extrabold text-amber-800 mt-0.5">{stats.halfDay} days</span>
                </div>

                <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wide">Absents</span>
                  <span className="text-xl font-extrabold text-rose-800 mt-0.5">{stats.absent} days</span>
                </div>
              </div>

              <div className="bg-indigo-50 border border-indigo-150 p-4 rounded-xl flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide">LOP Days (Loss of Pay)</span>
                  <p className="text-[9px] text-indigo-400 mt-0.5 leading-tight">Unpaid absences calculated dynamically</p>
                </div>
                <span className="text-2xl font-extrabold text-indigo-850">{stats.LOP} days</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {isSuperAdmin && (
      <Dialog open={!!editingDate} onOpenChange={(open) => !open && setEditingDate(null)}>
        <DialogContent className="max-w-xs p-6 bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-indigo-700">Adjust Attendance</DialogTitle>
            <DialogDescription className="text-slate-500">
              Updating status for <span className="font-bold text-slate-700">{editingDate}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="half_day">Half Day</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="unmarked">Unmarked (Clear)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setEditingDate(null)} disabled={updateMutation.isPending} className="rounded-lg h-9 text-xs w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg h-9 text-xs w-full sm:w-auto shadow-md">
              {updateMutation.isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )}
    </>
  )
}
