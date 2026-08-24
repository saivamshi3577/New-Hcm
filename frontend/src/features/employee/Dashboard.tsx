import { useState, useEffect, useMemo, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { CheckSquare, AlertCircle, TrendingUp, CheckCircle2, Megaphone, Pin, Loader2, Clock, Calendar, AlertTriangle, Coffee, Cake, PartyPopper, Smile, ShieldCheck } from 'lucide-react'
import { BarChart, Bar, Cell, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { playAnnouncementSound } from '@/utils/audio'
import { requestNotificationPermission, sendNativeNotification } from '@/utils/notifications'
import { api, safeArray } from '@/lib/api'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { getCompanyPolicy, isCheckInLate, calculateDistanceMeters } from '@/lib/companyPolicy'

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

const EMOJI_LIST = ['👍', '❤️', '😄', '🎉', '💡', '👏', '🙌', '🔥', '🚀', '😢', '😮', '🤝']

export default function EmployeeDashboard() {
  const { profile, user } = useAuthStore()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const userDomain = useMemo(() => {
    if (user?.email && user.email.includes('@')) {
      return user.email.split('@')[1]
    }
    return 'default'
  }, [user])

  const companyPolicy = useMemo(() => getCompanyPolicy(userDomain), [userDomain])

  // Attendance states
  // Check on component mount to ask for notification permission
  useEffect(() => {
    requestNotificationPermission()
  }, [])

  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [liveDuration, setLiveDuration] = useState('')
  const [isEmployeeAttendanceOpen, setIsEmployeeAttendanceOpen] = useState(false)
  const [isUpcomingEventsOpen, setIsUpcomingEventsOpen] = useState(false)
  const [birthdayFlipped, setBirthdayFlipped] = useState(false)
  const [isCheckOutDialogOpen, setIsCheckOutDialogOpen] = useState(false)

  const [showCheckInReminder, setShowCheckInReminder] = useState(false)
  const [showCheckOutReminder, setShowCheckOutReminder] = useState(false)

  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null)
  const [isAnnouncementDialogOpen, setIsAnnouncementDialogOpen] = useState(false)
  const [activeEmojiMenuId, setActiveEmojiMenuId] = useState<string | null>(null)

  const timersRef = useRef({
    checkInReminder: false,
    checkOutReminder: false,
    autoCheckOut: false
  })

  // Fetch employee attendance
  const { data: rawAttendanceList } = useQuery({
    queryKey: ['employee-attendance', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      if (!profile?.id) return []
      try {
        const data: any = await api.get('/employee/attendance?user_id=' + profile.id)
        return safeArray(data, 'attendance')
      } catch (error) {
        return []
      }
    }
  })

  const attendanceList = useMemo(() => safeArray(rawAttendanceList, 'attendance'), [rawAttendanceList])

  // Fetch employee break status
  const { data: breakStatus } = useQuery({
    queryKey: ['employee-break-status', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      if (!profile?.id) return false
      try {
        const data: any = await api.get('/employee/' + profile.id)
        return data?.on_break || false
      } catch (error) {
        return false
      }
    }
  })

  // Fetch holidays list
  const { data: rawHolidays } = useQuery({
    queryKey: ['holidays-list'],
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

  // Check In Mutation
  const checkInMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error("User not authenticated")

      // 1. Geolocation Check if enabled by company policy
      if (companyPolicy.enableGeolocationAttendance && navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000, enableHighAccuracy: true })
          })
          const userLat = position.coords.latitude
          const userLng = position.coords.longitude
          const distance = calculateDistanceMeters(
            userLat, userLng, 
            companyPolicy.officeLatitude, companyPolicy.officeLongitude
          )
          if (distance > companyPolicy.allowedRadiusMeters) {
            toast({
              title: "Geofence Location Alert 📍",
              description: `You are ${distance}m away from the office (${companyPolicy.allowedRadiusMeters}m allowed). Clock-in logged with location flag.`,
              variant: "destructive"
            })
          }
        } catch (geoErr) {
          console.warn("GPS location check skipped:", geoErr)
        }
      }

      const todayStr = getLocalYYYYMMDD(new Date())
      const now = new Date().toISOString()

      const nowLocal = new Date()
      const isLate = isCheckInLate(nowLocal, companyPolicy)
      const initialStatus = isLate ? 'late' : 'present'

      try {
        await api.post('/employee/attendance', {
          user_id: profile.id,
          date: todayStr,
          check_in: now,
          status: initialStatus
        })
      } catch (error) {
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-attendance'] })
      toast({ title: "Check-in Successful", description: "Your attendance punch-in has been logged." })
    },
    onError: (error: any) => {
      toast({ title: "Check-in Failed", description: error.message, variant: "destructive" })
    }
  })

  // Check Out Mutation
  const checkOutMutation = useMutation({
    mutationFn: async (todayRecord: any) => {
      if (!profile?.id) throw new Error("User not authenticated")
      const now = new Date().toISOString()
      const checkInTime = new Date(todayRecord.check_in)
      const checkOutTime = new Date()

      const diffMs = checkOutTime.getTime() - checkInTime.getTime()
      const diffHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100

      let finalStatus = todayRecord.status
      if (diffHours < 4) {
        finalStatus = 'absent'
      } else if (diffHours >= 4 && diffHours < 8) {
        finalStatus = 'half_day'
      } else {
        const checkInHour = checkInTime.getHours()
        const checkInMinute = checkInTime.getMinutes()
        const isLate = (checkInHour > 9) || (checkInHour === 9 && checkInMinute > 50)
        finalStatus = isLate ? 'late' : 'present'
      }

      try {
        await api.put('/employee/attendance/' + todayRecord.id, {
          check_out: now,
          work_hours: diffHours,
          status: finalStatus
        })
      } catch (error) {
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-attendance'] })
      toast({ title: "Success", description: "Successfully checked out!" })
    },
    onError: (error: any) => {
      toast({ title: "Check-out Failed", description: error.message, variant: "destructive" })
    }
  })

  // Toggle Break Status Mutation
  const toggleBreakMutation = useMutation({
    mutationFn: async (isGoingOnBreak: boolean) => {
      if (!profile?.id) throw new Error("User not authenticated")
      try {
        await api.put('/employee/' + profile.id, { on_break: isGoingOnBreak })
      } catch (error) {
        throw error
      }

      if (isGoingOnBreak) {
        const todayStr = getLocalYYYYMMDD(new Date())
        try {
          await api.post('/break_logs', {
            user_id: profile.id,
            date: todayStr
          })
        } catch (insertError) {
          throw insertError
        }
      } else {
        let latestBreak: any = null
        try {
          const res: any = await api.get('/break_logs?user_id=' + profile.id + '&ended_at_is=null&_sort=-started_at&_limit=1&_single=true')
          latestBreak = res?.data || res
        } catch (err) {}
        
        if (latestBreak) {
          try {
            await api.put('/break_logs/' + latestBreak.id, { ended_at: new Date().toISOString() })
          } catch (updateError) {
            throw updateError
          }
        }
      }

      return isGoingOnBreak
    },
    onSuccess: (isGoingOnBreak) => {
      queryClient.invalidateQueries({ queryKey: ['employee-break-status'] })
      if (isGoingOnBreak) {
        toast({ title: "On Break", description: "You are now marked as on break." })
      } else {
        toast({ title: "Back to Work", description: "You have returned from break." })
      }
    },
    onError: (error: any) => {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" })
    }
  })

  // Today's record
  const todayStr = useMemo(() => getLocalYYYYMMDD(new Date()), [])
  const todayRecord = useMemo(() => {
    return attendanceList?.find((a: any) => a.date === todayStr)
  }, [attendanceList, todayStr])

  // Live ticking timer for checked in duration
  useEffect(() => {
    if (!todayRecord || !todayRecord.check_in || todayRecord.check_out) {
      setLiveDuration('')
      return
    }

    const updateTimer = () => {
      const checkInTime = new Date(todayRecord.check_in)
      const now = new Date()
      const diffMs = now.getTime() - checkInTime.getTime()

      const secs = Math.floor(diffMs / 1000)
      const mins = Math.floor(secs / 60)
      const hours = Math.floor(mins / 60)

      const displayMins = mins % 60
      const displaySecs = secs % 60

      setLiveDuration(`${hours}h ${displayMins}m ${displaySecs}s`)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [todayRecord])

  // Reminders and Auto Check-out useEffect
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      const hours = now.getHours()
      const minutes = now.getMinutes()

      // Reset flags at midnight (or early morning)
      if (hours === 0) {
        timersRef.current = { checkInReminder: false, checkOutReminder: false, autoCheckOut: false }
      }

      // 9:45 AM Check-in Reminder
      if (hours === 9 && minutes === 45 && !timersRef.current.checkInReminder) {
        if (!todayRecord || !todayRecord.check_in) {
          setShowCheckInReminder(true)
          setTimeout(() => setShowCheckInReminder(false), 5000)
        }
        timersRef.current.checkInReminder = true
      }

      // 6:25 PM Check-out Reminder
      if (hours === 18 && minutes === 25 && !timersRef.current.checkOutReminder) {
        if (todayRecord && !todayRecord.check_out) {
          setShowCheckOutReminder(true)
          setTimeout(() => setShowCheckOutReminder(false), 5000)
        }
        timersRef.current.checkOutReminder = true
      }

      // 7:00 PM Auto Check-out
      if (hours === 19 && minutes === 0 && !timersRef.current.autoCheckOut) {
        if (todayRecord && !todayRecord.check_out && !checkOutMutation.isPending) {
          checkOutMutation.mutate(todayRecord)
          toast({ title: "Auto Check-out", description: "You have been automatically checked out at 7:00 PM." })
        }
        timersRef.current.autoCheckOut = true
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [todayRecord, checkOutMutation, toast])

  // Self-healing: Auto checkout missed past records if browser was closed
  useEffect(() => {
    if (!attendanceList) return

    const now = new Date()
    const todayLocal = getLocalYYYYMMDD(now)

    attendanceList.forEach((record: any) => {
      if (record.check_in && !record.check_out) {
        const recordDateStr = record.date
        const checkInTime = new Date(record.check_in)

        let isPastAutoCheckout = false
        if (recordDateStr < todayLocal) {
          isPastAutoCheckout = true
        } else if (recordDateStr === todayLocal && now.getHours() >= 19 && checkInTime.getHours() < 19) {
          isPastAutoCheckout = true
        }

        if (isPastAutoCheckout) {
          const [year, month, day] = recordDateStr.split('-').map(Number)
          const autoCheckOutTime = new Date(year, month - 1, day, 19, 0, 0)

          const diffMs = autoCheckOutTime.getTime() - checkInTime.getTime()
          const diffHours = Math.max(0, Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100)

          let finalStatus = record.status
          if (diffHours < 4) {
            finalStatus = 'absent'
          } else if (diffHours >= 4 && diffHours < 8) {
            finalStatus = 'half_day'
          } else {
            const checkInHour = checkInTime.getHours()
            const checkInMinute = checkInTime.getMinutes()
            const isLate = (checkInHour > 9) || (checkInHour === 9 && checkInMinute > 50)
            finalStatus = isLate ? 'late' : 'present'
          }

          api.put('/employee/attendance/' + record.id, {
            check_out: autoCheckOutTime.toISOString(),
            work_hours: diffHours,
            status: finalStatus
          }).then(() => {
            queryClient.invalidateQueries({ queryKey: ['employee-attendance'] })
          })
        }
      }
    })
  }, [attendanceList, queryClient])

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
    const todayStrLocal = getLocalYYYYMMDD(today)

    return rawDays.map((day) => {
      if (!day) return null

      const dateStr = getLocalYYYYMMDD(day)
      const holiday = holidays?.find((h: any) => h.date === dateStr)
      const att = attendanceList?.find((a: any) => a.date === dateStr)

      const isWeekend = day.getDay() === 0 || day.getDay() === 6
      const isFuture = day > today && dateStr !== todayStrLocal

      const joinDateStr = profile?.joining_date
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
      } else if (dateStr === todayStrLocal) {
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

  const { data: metrics, isLoading: loadingMetrics } = useQuery({
    queryKey: ['employee-metrics', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      if (!profile?.id) return { dueToday: 0, completedWeek: 0, velocity: 0 }

      let userTasks: any = []
      try {
        const res: any = await api.get('/task?assignee_id=' + profile.id + '&_select=id,status,title,due_date,priority')
        userTasks = res.data || res.tasks || []
      } catch (error) {}

      let totalAssigned = 0
      let totalCompleted = 0
      let totalNotCompleted = 0
      let overdueTasks = 0

      if (userTasks) {
        totalAssigned = userTasks.length
        const now = new Date()

        userTasks.forEach(task => {
          if (task.status === 'Completed') {
            totalCompleted++
          } else {
            totalNotCompleted++
            if (task.due_date && new Date(task.due_date) < now) {
              overdueTasks++
            }
          }
        })
      }

      let velocity = 0
      if (totalAssigned > 0) {
        velocity = Math.round((totalCompleted / totalAssigned) * 100)
      }

      const topActivityTasks = (userTasks || [])
        .filter(t => t.status !== 'Completed')
        .sort((a, b) => {
          const pA = a.priority === 'High' ? 3 : a.priority === 'Medium' ? 2 : 1
          const pB = b.priority === 'High' ? 3 : b.priority === 'Medium' ? 2 : 1
          if (pA !== pB) return pB - pA

          if (!a.due_date) return 1
          if (!b.due_date) return -1
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        })
        .slice(0, 3)

      return {
        tasksDue: totalNotCompleted,
        completedTasks: totalCompleted,
        velocity: velocity,
        overdueTasks: overdueTasks,
        topActivityTasks
      }
    }
  })

  const chartData = [
    { name: 'Due', value: metrics?.tasksDue || 0, fill: '#8b5cf6' },
    { name: 'Completed', value: metrics?.completedTasks || 0, fill: '#10b981' },
    { name: 'Velocity %', value: metrics?.velocity || 0, fill: '#3b82f6' },
    { name: 'Overdue', value: metrics?.overdueTasks || 0, fill: '#ef4444' },
  ]

  const { data: rawAnnouncements, isLoading: loadingAnnouncements } = useQuery({
    queryKey: ['employee-announcements'],
    queryFn: async () => {
      const nowStr = new Date().toISOString()
      try {
        const data: any = await api.get('/announcements?_or=expiry_date.is.null,expiry_date.gt.' + nowStr + '&_sort=-pinned,-created_at&_limit=3')
        return safeArray(data, 'announcements')
      } catch (error) {
        return []
      }
    }
  })

  const announcements = useMemo(() => safeArray(rawAnnouncements, 'announcements'), [rawAnnouncements])

  // Track previous announcements to play sound only on new ones
  const prevAnnouncementsRef = useRef<string[]>([])
  useEffect(() => {
    if (announcements && announcements.length > 0) {
      const currentIds = announcements.map(a => a.id)
      const hasNew = currentIds.some(id => !prevAnnouncementsRef.current.includes(id))

      // Play sound if we have previous announcements recorded and there's a new one
      if (prevAnnouncementsRef.current.length > 0 && hasNew) {
        playAnnouncementSound()

        // Also send a native desktop notification
        const latestAnn = announcements[0]
        if (latestAnn) {
          sendNativeNotification("New Announcement 📣", {
            body: latestAnn.title || "A new company announcement has been posted!"
          })
        }
      }

      prevAnnouncementsRef.current = currentIds
    }
  }, [announcements])

  // Fetch colleague birthdays
  const { data: rawColleagues } = useQuery({
    queryKey: ['colleague-birthdays'],
    queryFn: async () => {
      try {
        const data: any = await api.get('/employee?_select=full_name,birthday')
        return safeArray(data, 'employees')
      } catch (error) {
        return []
      }
    }
  })

  const colleagues = useMemo(() => safeArray(rawColleagues, 'employees'), [rawColleagues])

  // Fetch announcement reactions with user profile information
  const { data: rawReactionsList } = useQuery({
    queryKey: ['announcement-reactions'],
    queryFn: async () => {
      try {
        const data: any = await api.get('/announcement_reactions?_select=id,announcement_id,emoji,user_id,users:user_id(full_name)')
        return safeArray(data)
      } catch (error) {
        return []
      }
    }
  })

  const reactionsList = useMemo(() => safeArray(rawReactionsList), [rawReactionsList])

  // Toggle announcement reaction mutation
  const toggleReactionMutation = useMutation({
    mutationFn: async ({ announcementId, emoji }: { announcementId: string, emoji: string }) => {
      if (!profile?.id) throw new Error("Not authenticated")
      
      let existingReactions: any[] = []
      try {
        const res: any = await api.get('/announcement_reactions?announcement_id=' + announcementId + '&user_id=' + profile.id)
        existingReactions = res?.data || res || []
      } catch (err) {}

      const sameEmojiReaction = existingReactions?.find(r => r.emoji === emoji)

      if (sameEmojiReaction) {
        try {
          await api.delete('/announcement_reactions/' + sameEmojiReaction.id)
        } catch (error) {
          throw error
        }
      } else {
        // If they have any other reaction, delete them first (so they only have one reaction)
        if (existingReactions && existingReactions.length > 0) {
          const ids = existingReactions.map(r => r.id)
          try {
            await api.delete('/announcement_reactions?id_in=' + ids.join(','))
          } catch (deleteError) {
            throw deleteError
          }
        }

        try {
          await api.post('/announcement_reactions', {
            announcement_id: announcementId,
            user_id: profile.id,
            emoji: emoji
          })
        } catch (insertError) {
          throw insertError
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcement-reactions'] })
    }
  })

  // Days until target helper
  const getDaysUntil = (dateStr: string, isBirthday: boolean) => {
    if (!dateStr) return -1
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let targetDate = new Date(dateStr)
    if (isNaN(targetDate.getTime())) {
      const [m, d] = dateStr.split('-').map(Number)
      targetDate = new Date(today.getFullYear(), m - 1, d)
    } else if (isBirthday) {
      targetDate.setFullYear(today.getFullYear())
      if (targetDate < today) {
        targetDate.setFullYear(today.getFullYear() + 1)
      }
    }

    targetDate.setHours(0, 0, 0, 0)
    const diffTime = targetDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Calculate upcoming events (next 4 events)
  const upcomingEvents = useMemo(() => {
    const list: Array<{ type: 'birthday' | 'holiday'; title: string; dateStr: string; daysLeft: number }> = []

    // Process holidays
    safeArray(holidays).forEach((h: any) => {
      const daysLeft = getDaysUntil(h.date, false)
      if (daysLeft >= 0) {
        list.push({
          type: 'holiday',
          title: h.title,
          dateStr: h.date,
          daysLeft
        })
      }
    })

    // Process birthdays
    safeArray(colleagues).forEach((c: any) => {
      if (c.birthday) {
        const daysLeft = getDaysUntil(c.birthday, true)
        if (daysLeft >= 0) {
          list.push({
            type: 'birthday',
            title: `${c.full_name}'s Birthday`,
            dateStr: c.birthday,
            daysLeft
          })
        }
      }
    })

    // Sort ascending by daysLeft
    list.sort((a, b) => a.daysLeft - b.daysLeft)
    return list.slice(0, 4) // Next 3 to 4 events
  }, [holidays, colleagues])

  // Merge dynamic events occurring within 48 hours (<= 2 days) into announcements list
  const processedAnnouncements = useMemo(() => {
    const list = [...(announcements || [])]

    // Check next 48 hours events
    upcomingEvents.forEach((ev, idx) => {
      if (ev.daysLeft >= 0 && ev.daysLeft <= 2) {
        const dateFormatted = new Date(ev.dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        const countdownText = ev.daysLeft === 0 ? 'Today' : ev.daysLeft === 1 ? 'Tomorrow' : `in ${ev.daysLeft} days`

        list.unshift({
          id: `dynamic-${ev.type}-${idx}`,
          title: ev.type === 'birthday' ? `🎉 Colleague Birthday (${countdownText})` : `📅 Upcoming Holiday (${countdownText})`,
          content: ev.type === 'birthday'
            ? `Wishing ${ev.title.split("'s")[0]} a very happy birthday on ${dateFormatted}! Let's celebrate!`
            : `Enjoy the upcoming public holiday: "${ev.title}" on ${dateFormatted}!`,
          pinned: true,
          created_at: new Date().toISOString()
        })
      }
    })

    return list
  }, [announcements, upcomingEvents])

  // Determine today's birthdays from colleagues
  const todaysBirthdays = useMemo(() => {
    if (!colleagues) return []
    const now = new Date()
    const todayMonth = now.getMonth()
    const todayDay = now.getDate()
    return colleagues.filter((c: any) => {
      if (!c.birthday) return false
      const bd = new Date(c.birthday)
      return bd.getMonth() === todayMonth && bd.getDate() === todayDay
    })
  }, [colleagues])

  // Extract first name for a friendly greeting
  const firstName = profile?.full_name?.split(' ')[0] || 'Employee'

  return (
    <div className="space-y-4 text-foreground">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Welcome back, <span className="bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">{firstName}</span>
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">Your workspace is ready. Focus on execution and track your tasks.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/employee/policies"
            className="flex items-center gap-1.5 text-indigo-700 bg-indigo-50/85 hover:bg-indigo-100/90 text-xs font-bold px-3.5 py-1.5 rounded-full border border-indigo-200 shadow-sm transition-all active:scale-95 cursor-pointer outline-none"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>HR Policies</span>
          </Link>
          {(!processedAnnouncements || processedAnnouncements.length === 0) && !loadingAnnouncements && (
            <button
              onClick={() => setIsUpcomingEventsOpen(true)}
              className="flex items-center gap-1.5 text-violet-700 bg-violet-50/85 hover:bg-violet-100/90 text-xs font-bold px-3.5 py-1.5 rounded-full border border-violet-200 shadow-sm transition-all active:scale-95 cursor-pointer outline-none"
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Upcoming Events</span>
            </button>
          )}
          {todayRecord ? (
            todayRecord.check_out ? (
              <button
                onClick={() => setIsEmployeeAttendanceOpen(true)}
                className="flex items-center gap-1.5 text-blue-700 bg-blue-50/85 hover:bg-blue-100/90 text-xs font-bold px-3.5 py-1.5 rounded-full border border-blue-200 shadow-sm transition-all active:scale-95 cursor-pointer outline-none"
              >
                <Clock className="h-3.5 w-3.5" />
                <span>Shift Ended: {todayRecord.work_hours}h</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEmployeeAttendanceOpen(true)}
                  className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50/85 hover:bg-emerald-100/90 text-xs font-bold px-3.5 py-1.5 rounded-full border border-emerald-200 shadow-sm transition-all active:scale-95 cursor-pointer outline-none"
                >
                  <span className="relative flex h-2 w-2 mr-0.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>Working: {liveDuration || '0h 0m 0s'}</span>
                </button>
                {!breakStatus && (
                  <button
                    onClick={() => toggleBreakMutation.mutate(true)}
                    disabled={toggleBreakMutation.isPending}
                    className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-full border shadow-sm transition-all active:scale-95 cursor-pointer outline-none text-slate-600 bg-slate-50/85 hover:bg-slate-100/90 border-slate-200"
                  >
                    {toggleBreakMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Coffee className="h-3.5 w-3.5" />
                    )}
                    <span>Take a Break</span>
                  </button>
                )}
              </div>
            )
          ) : (
            <button
              onClick={() => setIsEmployeeAttendanceOpen(true)}
              className="flex items-center gap-1.5 text-rose-700 bg-rose-50/85 hover:bg-rose-100/90 text-xs font-bold px-3.5 py-1.5 rounded-full border border-rose-200 shadow-sm transition-all active:scale-95 cursor-pointer outline-none"
            >
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse mr-0.5" />
              <span>Not Checked In</span>
            </button>
          )}
        </div>
      </div>

      {/* Announcements with Birthday Flip */}
      {loadingAnnouncements ? (
        <Card className="glass-card border-violet-100/40 flex items-center justify-center p-6">
          <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
        </Card>
      ) : processedAnnouncements && processedAnnouncements.length > 0 ? (
        <div className="birthday-flip-perspective">
          <div className={`birthday-flip-inner${birthdayFlipped ? ' birthday-flipped' : ''}`}>
            {/* ── FRONT: Announcements ── */}
            <div className="birthday-flip-face birthday-flip-front">
              <Card className="glass-card border-violet-100/40 transition-all duration-300 h-full">
                <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
                      <Megaphone className="h-3 w-3 text-white" />
                    </div>
                    Company Announcements
                  </CardTitle>
                  <Button
                    onClick={() => setIsUpcomingEventsOpen(true)}
                    variant="outline"
                    className="h-7 text-[10px] font-bold rounded-lg px-2.5 border-violet-200 text-violet-700 bg-violet-50/50 hover:bg-violet-100/50 transition-all cursor-pointer shadow-sm active:scale-95 outline-none"
                  >
                    <Calendar className="h-3 w-3 mr-1" />
                    Upcoming Events
                  </Button>
                </CardHeader>
                <CardContent className="px-4 pb-4 overflow-visible">
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 stagger-children overflow-visible">
                    {processedAnnouncements.map(ann => {
                      const isBirthdayCard = typeof ann.id === 'string' && ann.id.startsWith('dynamic-birthday-')
                      
                      // Filter reactions for this specific announcement
                      const reactionsForAnn = reactionsList?.filter((r: any) => r.announcement_id === ann.id) || []
                      const myReaction = reactionsForAnn.find((r: any) => r.user_id === profile?.id)
                      
                      // Group reactions by emoji
                      const groupedReactions = EMOJI_LIST.map(emoji => {
                        const reactionsWithEmoji = reactionsForAnn.filter((r: any) => r.emoji === emoji)
                        const userHasReacted = reactionsWithEmoji.some((r: any) => r.user_id === profile?.id)
                        const names = reactionsWithEmoji.map((r: any) => r.users?.full_name || 'Unknown').join(', ')
                        return {
                          emoji,
                          count: reactionsWithEmoji.length,
                          hasReacted: userHasReacted,
                          names
                        }
                      }).filter(r => r.count > 0)

                      return (
                        <div 
                          key={ann.id} 
                          className={`glass-card-strong accent-bar-left p-3.5 rounded-xl hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 cursor-pointer ${
                            activeEmojiMenuId === ann.id ? 'z-40 relative !overflow-visible' : 'z-10 relative'
                          }${isBirthdayCard ? ' relative' : ''}`}
                          onClick={() => {
                            setSelectedAnnouncement(ann)
                            setIsAnnouncementDialogOpen(true)
                          }}
                        >
                          <div className="flex justify-between items-start mb-1.5 pl-1.5">
                            <h4 className="font-bold text-slate-900 leading-tight text-sm">{ann.title}</h4>
                            {ann.pinned && (
                              <Pin className="h-3 w-3 text-violet-500 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 mb-1.5 pl-1.5 font-medium">
                            {new Date(ann.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-slate-600 line-clamp-2 pl-1.5">
                            {ann.content}
                          </p>

                          {/* Reactions Section */}
                          {!isBirthdayCard && (
                            <div className="mt-3 flex flex-wrap items-center gap-2 pl-1.5 z-10 relative">
                              {/* Grouped Reactions Pills */}
                              {groupedReactions.map(reaction => (
                                <button
                                  key={reaction.emoji}
                                  title={reaction.names}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleReactionMutation.mutate({ announcementId: ann.id, emoji: reaction.emoji })
                                  }}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-bold transition-all active:scale-90 hover:bg-slate-100 ${
                                    reaction.hasReacted 
                                      ? 'bg-violet-50 text-violet-700 border-violet-300' 
                                      : 'bg-white text-slate-650 border-slate-200'
                                  }`}
                                >
                                  <span>{reaction.emoji}</span>
                                  <span>{reaction.count}</span>
                                </button>
                              ))}

                              {/* Emoji Picker Trigger */}
                              <div className="relative">
                                <button
                                   onClick={(e) => {
                                     e.stopPropagation()
                                     setActiveEmojiMenuId(activeEmojiMenuId === ann.id ? null : ann.id)
                                   }}
                                   className={`inline-flex items-center justify-center h-6 w-6 rounded-full border transition-all active:scale-90 ${
                                     myReaction 
                                       ? 'bg-violet-50 border-violet-300 text-violet-750' 
                                       : 'bg-white border-dashed border-slate-300 hover:border-violet-500 text-slate-400 hover:text-violet-500 hover:bg-violet-50/50'
                                   }`}
                                 >
                                   {myReaction ? (
                                     <span className="text-xs font-bold">{myReaction.emoji}</span>
                                   ) : (
                                     <Smile className="h-3.5 w-3.5" />
                                   )}
                                 </button>

                                {/* Floating Emoji Menu */}
                                {activeEmojiMenuId === ann.id && (
                                  <>
                                    <div 
                                      className="fixed inset-0 z-40 cursor-default" 
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setActiveEmojiMenuId(null)
                                      }} 
                                    />
                                    <div 
                                      onClick={(e) => e.stopPropagation()}
                                      className="absolute bottom-8 left-0 bg-white/95 backdrop-blur-md border border-slate-200/90 p-2 rounded-2xl shadow-xl z-50 flex gap-1 flex-wrap w-[220px] animate-in fade-in zoom-in-95 duration-150"
                                    >
                                      {EMOJI_LIST.map(emoji => {
                                        const reactionsForThisEmoji = reactionsForAnn.filter((r: any) => r.emoji === emoji)
                                        const userHasReacted = reactionsForThisEmoji.some((r: any) => r.user_id === profile?.id)
                                        return (
                                          <button
                                            key={emoji}
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              toggleReactionMutation.mutate({ announcementId: ann.id, emoji })
                                              setActiveEmojiMenuId(null)
                                            }}
                                            className={`h-8 w-8 flex items-center justify-center text-base rounded-xl transition-all hover:bg-violet-100/60 hover:scale-125 active:scale-95 cursor-pointer ${
                                              userHasReacted ? 'bg-violet-100 border border-violet-300' : ''
                                            }`}
                                          >
                                            <span>{emoji}</span>
                                          </button>
                                        )
                                      })}
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          )}

                          {isBirthdayCard && todaysBirthdays.length > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setBirthdayFlipped(true)
                              }}
                              className="birthday-flip-trigger"
                              title="View today's birthday wishes 🎂"
                            >
                              <Cake className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ── BACK: Birthday Wishes ── */}
            <div className="birthday-flip-face birthday-flip-back">
              <div className="birthday-wishes-card">
                {/* Decorative floating emojis */}
                <div className="birthday-confetti" aria-hidden="true">
                  <span className="birthday-confetti-piece" style={{ left: '5%', animationDelay: '0s' }}>🎉</span>
                  <span className="birthday-confetti-piece" style={{ left: '18%', animationDelay: '0.7s' }}>🎈</span>
                  <span className="birthday-confetti-piece" style={{ left: '35%', animationDelay: '1.1s' }}>✨</span>
                  <span className="birthday-confetti-piece" style={{ left: '52%', animationDelay: '0.3s' }}>🎊</span>
                  <span className="birthday-confetti-piece" style={{ left: '70%', animationDelay: '0.9s' }}>🎁</span>
                  <span className="birthday-confetti-piece" style={{ left: '85%', animationDelay: '0.5s' }}>🥳</span>
                </div>

                {/* Celebration content — vertically centered */}
                <div className="birthday-wishes-content">
                  <h3 className="birthday-wishes-title">Happy Birthday!</h3>

                  {/* Names integrated directly */}
                  <div className="birthday-names-row">
                    {todaysBirthdays.map((person: any, idx: number) => (
                      <span key={idx} className="birthday-person-name-inline">
                        <PartyPopper className="h-3.5 w-3.5 text-amber-400 birthday-party-icon" />
                        {person.full_name}
                      </span>
                    ))}
                  </div>

                  {/* Creative warm wishes note */}
                  <p className="birthday-wishes-note-text">
                    Another year of amazing moments awaits — may your day be as wonderful as the impact you bring to our team every single day! ✨
                  </p>
                </div>

                {/* Flip back button */}
                <button
                  onClick={() => setBirthdayFlipped(false)}
                  className="birthday-flip-back-btn"
                  title="Back to announcements"
                >
                  <Megaphone className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Upcoming Events Modal Dialog */}
      <Dialog open={isUpcomingEventsOpen} onOpenChange={setIsUpcomingEventsOpen}>
        <DialogContent className="max-w-md bg-white border-slate-205 p-6 rounded-2xl shadow-2xl text-slate-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-indigo-750 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-650" />
              <span>Upcoming Holidays & Birthdays</span>
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Stay updated with the next 3 to 4 holidays and colleagues' birthdays.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-4">
            {upcomingEvents.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-6">No upcoming events found.</p>
            ) : (
              upcomingEvents.map((ev, idx) => {
                const dateFormatted = new Date(ev.dateStr).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: ev.type === 'holiday' ? 'numeric' : undefined })
                const isUrgent = ev.daysLeft <= 2

                return (
                  <div
                    key={`upcoming-${idx}`}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${isUrgent
                      ? 'bg-rose-50/70 border-rose-205 shadow-sm'
                      : 'bg-slate-50/60 border-slate-100'
                      }`}
                  >
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${ev.type === 'birthday'
                      ? 'bg-pink-100 text-pink-600 font-bold text-xs'
                      : 'bg-indigo-100 text-indigo-600 font-bold text-xs'
                      }`}>
                      {ev.type === 'birthday' ? '🎉' : '📅'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs text-slate-800 truncate">{ev.title}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">{dateFormatted}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border whitespace-nowrap ${isUrgent
                        ? 'bg-rose-600 text-white border-transparent animate-pulse'
                        : 'bg-slate-200 text-slate-605 text-slate-600 border-slate-300/40'
                        }`}>
                        {ev.daysLeft === 0 ? 'Today' : ev.daysLeft === 1 ? 'Tomorrow' : `in ${ev.daysLeft} days`}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEmployeeAttendanceOpen} onOpenChange={setIsEmployeeAttendanceOpen}>
        <DialogContent className="max-w-4xl bg-white/95 backdrop-blur-xl border-slate-200/80 p-6 rounded-2xl shadow-2xl text-slate-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold sa-gradient-text flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-500" />
              <span>Time Clock & Attendance Dashboard</span>
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Punch in/out, monitor working hours, and track payroll Loss of Pay (LOP) calculations.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 lg:grid-cols-12 mt-4">
            {/* Left Column: Clocking Widget (lg:col-span-4) */}
            <Card className="lg:col-span-4 bg-slate-50/70 border-slate-150 p-0 flex flex-col justify-between shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-indigo-500" />
                  Time Clock
                </CardTitle>
                <CardDescription className="text-[10px] text-muted-foreground">Track login activity for today</CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4 flex flex-col justify-between flex-1 min-h-[220px]">
                <div className="space-y-3">
                  <div className="text-center py-2 bg-white rounded-xl border border-slate-200/50">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Time</span>
                    <p className="text-xl font-extrabold text-slate-800 mt-0.5 font-mono">
                      {new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-[9px] font-semibold text-slate-400 mt-0.5">
                      {new Date().toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </p>
                  </div>

                  {todayRecord ? (
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center text-xs border-b border-slate-100 pb-1.5">
                        <span className="text-slate-405 font-semibold text-slate-500">Check-in time:</span>
                        <span className="text-slate-800 font-bold">
                          {new Date(todayRecord.check_in).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {todayRecord.check_out ? (
                        <>
                          <div className="flex justify-between items-center text-xs border-b border-slate-100 pb-1.5">
                            <span className="text-slate-405 font-semibold text-slate-500">Check-out time:</span>
                            <span className="text-slate-800 font-bold">
                              {new Date(todayRecord.check_out).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-xs pb-0.5">
                            <span className="text-slate-405 font-semibold text-slate-505">Total hours worked:</span>
                            <span className="text-slate-800 font-extrabold text-sm">{todayRecord.work_hours} hrs</span>
                          </div>
                        </>
                      ) : (
                        <div className="bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl text-center">
                          <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wide">Live Shift Hours</span>
                          <p className="text-lg font-extrabold text-emerald-805 mt-0.5 font-mono text-emerald-700">{liveDuration || '0h 0m 0s'}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-xs text-muted-foreground font-medium flex flex-col items-center gap-1">
                      <Coffee className="h-6 w-6 text-slate-300" />
                      <span>Start your day by clocking in below.</span>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  {!todayRecord ? (
                    <Button
                      onClick={() => checkInMutation.mutate()}
                      disabled={checkInMutation.isPending}
                      className="w-full sa-btn-primary h-9 text-xs rounded-xl"
                    >
                      {checkInMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Clock className="h-3.5 w-3.5 mr-1.5" />}
                      Check In
                    </Button>
                  ) : !todayRecord.check_out ? (
                    <Button
                      onClick={() => setIsCheckOutDialogOpen(true)}
                      disabled={checkOutMutation.isPending}
                      className="w-full bg-rose-600 hover:bg-rose-700 text-white h-9 text-xs rounded-xl shadow-md hover:shadow transition-all border-none"
                    >
                      {checkOutMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Clock className="h-3.5 w-3.5 mr-1.5" />}
                      Check Out
                    </Button>
                  ) : (
                    <Button
                      disabled
                      className="w-full bg-slate-100 text-slate-400 border border-slate-200 h-9 text-xs rounded-xl"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                      Shift Completed
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Right Column: Attendance Calendar (lg:col-span-8) */}
            <Card className="lg:col-span-8 bg-white border-slate-150 p-0 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-semibold text-slate-805 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-indigo-500" />
                  <span>Attendance Logs & Payroll</span>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:bg-slate-100 text-slate-500 h-7 px-2 text-xs"
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                  >
                    ← Prev
                  </Button>
                  <span className="font-bold text-slate-800 text-xs tracking-wide">
                    {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:bg-slate-100 text-slate-500 h-7 px-2 text-xs"
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                  >
                    Next →
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                  {/* Calendar Grid */}
                  <div className="md:col-span-8 space-y-2">
                    <div className="grid grid-cols-7 gap-1 text-center font-bold text-slate-400 text-[9px] uppercase py-1 border-b border-slate-100">
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
                        if (!day) return <div key={`empty-${idx}`} className="h-10 bg-slate-50/20 rounded-lg" />

                        let styleClass = 'bg-white border-slate-105 text-slate-700'
                        if (day.status === 'present') {
                          styleClass = 'bg-emerald-50/85 border-emerald-205 text-emerald-700'
                        } else if (day.status === 'late') {
                          styleClass = 'bg-lime-50/85 border-lime-205 text-lime-800'
                        } else if (day.status === 'half_day') {
                          styleClass = 'bg-amber-50/85 border-amber-205 text-amber-700'
                        } else if (day.status === 'absent') {
                          styleClass = 'bg-rose-50/90 border-rose-205 text-rose-700'
                        } else if (day.status === 'weekend') {
                          styleClass = 'bg-slate-100/50 border-slate-200/50 text-slate-400'
                        } else if (day.status === 'holiday') {
                          styleClass = 'bg-yellow-50/85 border-yellow-205 text-yellow-850'
                        } else if (day.status === 'pending') {
                          styleClass = 'bg-blue-50/50 border-blue-205 text-blue-600 animate-pulse'
                        } else if (day.status === 'unmarked' || day.status === 'future') {
                          styleClass = 'bg-slate-50/40 border-slate-100/60 text-slate-350 opacity-50'
                        }

                        return (
                          <div
                            key={day.dateStr}
                            className={`h-10 p-1 rounded-xl border flex flex-col justify-between transition-all text-left relative overflow-hidden group ${styleClass}`}
                            title={day.holiday ? `Holiday: ${day.holiday.title}` : day.record ? `Worked ${day.record.work_hours}h` : ''}
                          >
                            <span className="text-[9px] font-bold opacity-60 leading-none">
                              {day.date.getDate()}
                            </span>

                            {day.status !== 'future' && day.status !== 'weekend' && day.status !== 'holiday' && day.record && (
                              <span className="text-[8px] font-semibold tracking-tight truncate leading-none mt-auto block text-center">
                                {day.record.work_hours || 0}h
                              </span>
                            )}

                            {day.status === 'holiday' && (
                              <span className="text-[7px] font-extrabold text-yellow-750 truncate w-full text-center leading-none mt-auto">
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

                  {/* Stats Summary & Calculations */}
                  <div className="md:col-span-4 space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-semibold">Presents:</span>
                        <span className="font-bold text-slate-800">{stats.present} days</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-semibold">Late Logins:</span>
                        <span className="font-bold text-slate-800">{stats.late} days</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-semibold">Half Days:</span>
                        <span className="font-bold text-slate-800">{stats.halfDay} days</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-semibold">Absents:</span>
                        <span className="font-bold text-slate-800">{stats.absent} days</span>
                      </div>
                    </div>

                    <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                      <span className="text-[9px] font-bold text-indigo-650 uppercase tracking-wide">Dynamic Payroll LOP</span>
                      <div className="flex justify-between items-end mt-1">
                        <span className="text-slate-500 text-[10px] leading-tight max-w-[80px]">Loss of Pay absences</span>
                        <span className="text-lg font-extrabold text-indigo-900 leading-none">{stats.LOP} days</span>
                      </div>
                    </div>

                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* KPI row */}
      <div className="relative z-10 grid gap-3 md:grid-cols-2 lg:grid-cols-4 stagger-children">
        {/* Tasks Due */}
        <Link to="/employee/tasks" className="block outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded-xl">
          <Card className="backdrop-blur-xl border border-violet-200/50 shadow-sm hover-lift glow-on-hover group cursor-pointer h-full" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(99,102,241,0.05) 100%)' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
              <CardTitle className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Tasks Due</CardTitle>
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <CheckSquare className="h-3.5 w-3.5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="text-2xl font-extrabold text-foreground kpi-value">
                {loadingMetrics ? <Loader2 className="h-5 w-5 animate-spin text-violet-500" /> : `${metrics?.tasksDue || 0} Tasks`}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">Total uncompleted tasks</p>
            </CardContent>
          </Card>
        </Link>

        {/* Completed Tasks */}
        <Link to="/employee/tasks" className="block outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl">
          <Card className="backdrop-blur-xl border border-emerald-200/50 shadow-sm hover-lift glow-on-hover group cursor-pointer h-full" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(20,184,166,0.05) 100%)' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
              <CardTitle className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Completed Tasks</CardTitle>
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <CheckCircle2 className="h-3.5 w-3.5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="text-2xl font-extrabold text-foreground kpi-value">
                {loadingMetrics ? <Loader2 className="h-5 w-5 animate-spin text-emerald-500" /> : `${metrics?.completedTasks || 0} Tasks`}
              </div>
              <p className="text-[10px] text-emerald-600 mt-0.5 font-semibold">Total tasks finished</p>
            </CardContent>
          </Card>
        </Link>

        {/* Active Sprint Velocity */}
        <Link to="/employee/performance" className="block outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xl">
          <Card className="backdrop-blur-xl border border-blue-200/50 shadow-sm hover-lift glow-on-hover group cursor-pointer h-full" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(6,182,212,0.05) 100%)' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
              <CardTitle className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Active Sprint Velocity</CardTitle>
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <TrendingUp className="h-3.5 w-3.5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="text-2xl font-extrabold text-foreground kpi-value">
                {loadingMetrics ? <Loader2 className="h-5 w-5 animate-spin text-blue-500" /> : `${metrics?.velocity || 0}%`}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">Completion vs Assigned</p>
            </CardContent>
          </Card>
        </Link>

        {/* Overdue Tasks */}
        <Link to="/employee/tasks" className="block outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded-xl">
          <Card className="backdrop-blur-xl border border-red-200/50 shadow-sm hover-lift glow-on-hover group cursor-pointer h-full" style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(244,63,94,0.05) 100%)' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
              <CardTitle className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Overdue Tasks</CardTitle>
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <AlertCircle className="h-3.5 w-3.5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="text-2xl font-extrabold text-foreground kpi-value">
                {loadingMetrics ? <Loader2 className="h-5 w-5 animate-spin text-red-500" /> : `${metrics?.overdueTasks || 0} Tasks`}
              </div>
              <p className="text-[10px] text-red-600 mt-0.5 font-semibold">Missed deadlines</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Metric Relations — Bar Chart */}
        <Card className="col-span-4 glass-card-strong border-violet-100/30 transition-all duration-300">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-sm font-semibold text-foreground">Task Metrics Analysis</CardTitle>
            <CardDescription className="text-muted-foreground text-[10px]">Graphical relation of your current dashboard metrics</CardDescription>
          </CardHeader>
          <CardContent className="h-[220px] px-4 pb-3">
            {loadingMetrics ? (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 15, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(139, 92, 246, 0.08)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={false}
                    contentStyle={{
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      backdropFilter: 'blur(12px)',
                      borderRadius: '10px',
                      border: '1px solid rgba(139,92,246,0.15)',
                      fontSize: '11px',
                      boxShadow: '0 4px 16px rgba(139,92,246,0.08)'
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent Work Activities — Timeline style */}
        <Card className="col-span-3 glass-card-strong border-violet-100/30 transition-all duration-300">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-sm font-semibold text-foreground">Activity Log</CardTitle>
            <CardDescription className="text-muted-foreground text-[10px]">Realtime changes on your assigned workflows</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="space-y-3">
              {loadingMetrics ? (
                <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-violet-500" /></div>
              ) : metrics?.topActivityTasks?.length ? (
                metrics.topActivityTasks.map((act, index) => (
                  <Link to="/employee/tasks" key={act.id} className="block outline-none">
                    <div
                      className="timeline-item p-3 glass-card rounded-xl transition-all duration-300 hover:shadow-sm hover:-translate-x-0.5 cursor-pointer"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-foreground truncate max-w-[150px]">{act.title}</h4>
                        <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap ${act.priority === 'High' ? 'text-red-600 bg-red-50 border-red-100' :
                          act.priority === 'Medium' ? 'text-amber-600 bg-amber-50 border-amber-100' :
                            'text-emerald-600 bg-emerald-50 border-emerald-100'
                          }`}>
                          {act.priority}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Due: {act.due_date ? new Date(act.due_date).toLocaleDateString() : 'No deadline'}
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-xs text-muted-foreground text-center py-4">No active tasks found.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Check Out Confirmation Dialog */}
      <Dialog open={isCheckOutDialogOpen} onOpenChange={setIsCheckOutDialogOpen}>
        <DialogContent className="max-w-sm border-rose-100 shadow-xl bg-white/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
              Confirm Check Out
            </DialogTitle>
            <DialogDescription className="text-slate-600 mt-2">
              Are you sure you want to check out? <strong className="text-rose-600 font-semibold block mt-1">This action cannot be reverted.</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setIsCheckOutDialogOpen(false)} className="rounded-xl text-xs h-9">
              Cancel
            </Button>
            <Button
              className="bg-rose-600 hover:bg-rose-700 text-white border-none shadow-md rounded-xl text-xs h-9"
              onClick={() => {
                checkOutMutation.mutate(todayRecord)
                setIsCheckOutDialogOpen(false)
              }}
              disabled={checkOutMutation.isPending}
            >
              {checkOutMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirm Check Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 9:45 AM Check-in Reminder Modal */}
      <Dialog open={showCheckInReminder} onOpenChange={setShowCheckInReminder}>
        <DialogContent className="max-w-sm border-amber-200 shadow-xl bg-amber-50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <Clock className="h-5 w-5" />
              Check-in Reminder
            </DialogTitle>
            <DialogDescription className="text-slate-700 font-medium mt-2">
              Please check-in before it's too late or it could be marked as a late login!
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* 6:25 PM Check-out Reminder Modal */}
      <Dialog open={showCheckOutReminder} onOpenChange={setShowCheckOutReminder}>
        <DialogContent className="max-w-sm border-indigo-200 shadow-xl bg-indigo-50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-indigo-600">
              <Clock className="h-5 w-5" />
              Check-out Reminder
            </DialogTitle>
            <DialogDescription className="text-slate-700 font-medium mt-2">
              It's 6:25 PM! Don't forget to check out before you leave.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Break Active Modal */}
      <Dialog open={breakStatus} onOpenChange={() => { }}>
        <DialogContent
          className="max-w-xs bg-white/90 backdrop-blur-2xl border-none p-6 rounded-3xl shadow-2xl text-center flex flex-col items-center justify-center space-y-5 [&>button]:hidden outline-none"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <div className="relative mt-2">
            <div className="absolute inset-0 bg-amber-400 rounded-full blur-lg opacity-40 animate-pulse"></div>
            <div className="relative h-16 w-16 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full flex items-center justify-center shadow-inner border border-amber-300/50">
              <Coffee className="h-8 w-8 text-amber-700 drop-shadow-sm" />
            </div>
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">On a Break</h2>
            <p className="text-slate-500 text-[13px] max-w-[240px] mx-auto font-medium leading-relaxed italic">
              "Great work requires great rest. Disconnect, recharge your mind, and tap below when you're ready to create again."
            </p>
          </div>
          <div className="w-full pt-2">
            <Button
              onClick={() => toggleBreakMutation.mutate(false)}
              disabled={toggleBreakMutation.isPending}
              className="w-full h-11 text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-lg shadow-amber-500/30 transition-all active:scale-95"
            >
              {toggleBreakMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Return to Work
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Announcement Details Modal */}
      <Dialog open={isAnnouncementDialogOpen} onOpenChange={setIsAnnouncementDialogOpen}>
        <DialogContent className="max-w-md bg-white border-slate-205 p-6 rounded-2xl shadow-2xl text-slate-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-indigo-750 flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-indigo-650" />
              <span>{selectedAnnouncement?.title}</span>
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              {selectedAnnouncement && new Date(selectedAnnouncement.created_at).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 text-sm text-slate-600 whitespace-pre-wrap">
            {selectedAnnouncement?.event_date && (
              <div className="mb-3 inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm">
                <Calendar className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
                <span>{new Date(selectedAnnouncement.event_date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
              </div>
            )}
            <div>{selectedAnnouncement?.content}</div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsAnnouncementDialogOpen(false)} className="rounded-xl h-9 text-xs font-semibold">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

