import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Users, Calendar } from 'lucide-react'
import { api, safeArray } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useNavigate } from 'react-router-dom'
import AttendanceViewDialog from '@/components/AttendanceViewDialog'

interface Member {
  id: string
  name: string
  email: string
  role: string
  active: number
  activePoints: number
  resolved: number
  resolvedPoints: number
  balancePoints: number
  monthlyEvaluations: { month: string; avg: number; count: number }[]
}

export default function TeamMembers() {
  const [members, setMembers] = useState<Member[]>([])
  const [rawUsersData, setRawUsersData] = useState<any[]>([])
  const [rawSubmissions, setRawSubmissions] = useState<any[]>([])
  const [teamNames, setTeamNames] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const { user, profile } = useAuthStore()
  const navigate = useNavigate()
  const { toast } = useToast()

  // Month-based filtering state: Points reset each month (e.g. August starts at 0), while past months (July, June) retain data
  const currentMonthKey = new Date().toLocaleString('default', { month: 'short', year: 'numeric' })
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey)
  const [availableMonths, setAvailableMonths] = useState<string[]>([currentMonthKey, 'All Time'])

  // Attendance tracking states
  const [attendanceUserId, setAttendanceUserId] = useState<string | null>(null)
  const [attendanceUserName, setAttendanceUserName] = useState<string>('')
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false)

  const fetchMembers = async () => {
    if (!user) return
    setLoading(true)
    try {
      // 1. Fetch teams (API + Local Storage) where current user is lead
      let adminTeams: any[] = []
      try {
        const res: any = await api.get('/teams')
        const teamsList = safeArray(res, 'teams')

        let localTeams: any[] = []
        try {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key && (key.startsWith('st_teams') || key === 'st_teams')) {
              const val = JSON.parse(localStorage.getItem(key) || '[]')
              if (Array.isArray(val)) localTeams = localTeams.concat(val)
            }
          }
        } catch (e) {}

        const allTeams = [...teamsList, ...localTeams]
        const myId = String(user.id || profile?.id || '').toLowerCase().trim()
        const myEmail = String(user.email || profile?.email || '').toLowerCase().trim()
        const myName = String(user.fullName || user.full_name || user.name || profile?.full_name || '').toLowerCase().trim()

        adminTeams = allTeams.filter((t: any) => {
          const tLeadId = String(t.lead_id || t.leadId || '').toLowerCase().trim()
          const tLeadName = String(t.lead_name || t.lead || '').toLowerCase().trim()
          const tLeadEmail = String(t.lead_email || t.leadEmail || '').toLowerCase().trim()

          return (
            (tLeadId && myId && tLeadId === myId) ||
            (tLeadId && myEmail && tLeadId === myEmail) ||
            (tLeadEmail && myEmail && tLeadEmail === myEmail) ||
            (tLeadName && myName && (tLeadName.includes(myName) || myName.includes(tLeadName))) ||
            (tLeadName && myEmail && tLeadName.includes(myEmail))
          )
        })
      } catch (err) {
        console.warn('Error fetching teams:', err)
      }

      const teamIds = adminTeams.map((t: any) => String(t.id || ''))
      setTeamNames(adminTeams.map((t: any) => t.name).filter(Boolean))

      // 2. Fetch employees (API + Local Storage) and filter for this Team Lead
      let res: any = {}
      try {
        res = await api.get('/employee')
      } catch (err) {
        console.warn('Error fetching users:', err)
      }

      let localUsers: any[] = []
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && (key.startsWith('st_emps_') || key === 'st_employees' || key === 'mock_users')) {
            const val = JSON.parse(localStorage.getItem(key) || '[]')
            if (Array.isArray(val)) {
              localUsers = localUsers.concat(val)
            }
          }
        }
      } catch (e) {}

      const userMap = new Map<string, any>()
      safeArray(res, 'employees').forEach((u: any) => userMap.set(u.id || u.email, u))
      localUsers.forEach((u: any) => {
        const idKey = u.id || u.email
        if (idKey) {
          userMap.set(idKey, { ...userMap.get(idKey), ...u })
        }
      })

      const allUsers = Array.from(userMap.values())
      const tlRecord = allUsers.find((u: any) => 
        (u.email && user.email && String(u.email).toLowerCase() === String(user.email).toLowerCase()) ||
        (u.id && user.id && String(u.id).toLowerCase() === String(user.id).toLowerCase())
      )

      const tlIds = new Set<string>()
      if (user.id) tlIds.add(String(user.id).toLowerCase())
      if (user.email) tlIds.add(String(user.email).toLowerCase())
      if (profile?.id) tlIds.add(String(profile.id).toLowerCase())
      if (profile?.email) tlIds.add(String(profile.email).toLowerCase())
      if (tlRecord?.id) tlIds.add(String(tlRecord.id).toLowerCase())
      if (tlRecord?.email) tlIds.add(String(tlRecord.email).toLowerCase())

      const tlNames = new Set<string>()
      if (user.fullName) tlNames.add(String(user.fullName).toLowerCase())
      if (user.full_name) tlNames.add(String(user.full_name).toLowerCase())
      if (user.name) tlNames.add(String(user.name).toLowerCase())
      if (profile?.full_name) tlNames.add(String(profile.full_name).toLowerCase())
      if (user.email) {
        const prefix = user.email.split('@')[0].toLowerCase()
        if (prefix && prefix.length >= 2) tlNames.add(prefix)
      }
      if (tlRecord?.fullName) tlNames.add(String(tlRecord.fullName).toLowerCase())
      if (tlRecord?.full_name) tlNames.add(String(tlRecord.full_name).toLowerCase())

      const tlDept = String(tlRecord?.employeeProfile?.department || tlRecord?.department || tlRecord?.department_id || profile?.department || '').toLowerCase().trim()

      const nonAdminUsers = allUsers.filter((u: any) => {
        const rawRole = typeof u.role === 'object' && u.role?.name 
          ? u.role.name 
          : (u.roleName || u.role_name || (typeof u.role === 'string' ? u.role : 'EMPLOYEE'))
        const rUpper = String(rawRole || 'EMPLOYEE').toUpperCase().trim()

        if (rUpper.includes('ADMIN') || rUpper.includes('SUPER') || rUpper === 'HR' || rUpper === 'MANAGER') return false

        const uId = String(u.id || '').toLowerCase().trim()
        const uEmail = String(u.email || '').toLowerCase().trim()
        if (tlIds.has(uId) || tlIds.has(uEmail)) return false

        return true
      })

      // Filter employees assigned strictly to this Team Lead
      const assignedData = nonAdminUsers.filter((u: any) => {
        const uMgrId = String(u.manager_id || u.managerId || u.teamLeadId || u.employeeProfile?.teamLeadId || '').toLowerCase().trim()
        const uMgrEmail = String(u.manager_email || u.teamLeadEmail || u.employeeProfile?.teamLeadEmail || u.manager?.email || '').toLowerCase().trim()
        const uMgrName = String(u.manager?.full_name || u.manager?.fullName || u.manager_name || u.teamLead || u.employeeProfile?.teamLeadName || '').toLowerCase().trim()
        const uCreatedBy = String(u.created_by_admin || u.employeeProfile?.createdByAdmin || '').toLowerCase().trim()
        const uTeamId = String(u.team_id || u.teamId || u.employeeProfile?.teamId || '').toLowerCase().trim()

        const isDirectReport = Boolean(uMgrId && tlIds.has(uMgrId))
        const isManagerEmail = Boolean(uMgrEmail && tlIds.has(uMgrEmail))
        const isCreatedByMe = Boolean(uCreatedBy && tlIds.has(uCreatedBy))
        const isManagerName = Boolean(uMgrName && Array.from(tlNames).some(n => n && n.length >= 2 && (uMgrName.includes(n) || n.includes(uMgrName))))
        const isTeamMatch = Boolean(uTeamId && teamIds.includes(uTeamId))

        return isDirectReport || isManagerEmail || isCreatedByMe || isManagerName || isTeamMatch
      })

      const finalData = assignedData.map((u: any) => ({
        ...u,
        full_name: u.fullName || u.full_name || u.email,
        role: { name: typeof u.role === 'object' && u.role?.name ? u.role.name : (u.role || 'EMPLOYEE') }
      }))

      setRawUsersData(finalData)
      const memberIds = finalData.map((u: any) => u.id)

      let submissions: any[] = []
      if (memberIds.length > 0) {
        try {
          const subsData: any = await api.get(`/assessment_submissions?_select=user_id,score,total_points,submitted_at&user_id_in=${memberIds.join(',')}`)
          if (subsData) {
            submissions = subsData
          }
        } catch (dbErr) {
          console.warn('Database error fetching submissions, falling back to localStorage:', dbErr)
          const stored = JSON.parse(localStorage.getItem('st_submissions') || '[]')
          submissions = stored.filter((s: any) => memberIds.includes(s.user_id))
        }
      }
      setRawSubmissions(submissions)

      // Collect all distinct months from task dates and submissions
      const monthsSet = new Set<string>()
      monthsSet.add(currentMonthKey)

      finalData.forEach((u: any) => {
        (u.tasks || []).forEach((t: any) => {
          const dateStr = t.updated_at || t.created_at
          if (dateStr) {
            const d = new Date(dateStr)
            if (!isNaN(d.getTime())) {
              monthsSet.add(d.toLocaleString('default', { month: 'short', year: 'numeric' }))
            }
          }
        })
      })

      submissions.forEach((s: any) => {
        if (s.submitted_at) {
          const d = new Date(s.submitted_at)
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

    } catch (err) {
      console.error('Error fetching team directory:', err)
    } finally {
      setLoading(false)
    }
  }

  // Recalculate employee points whenever raw data or selectedMonth filter changes
  useEffect(() => {
    if (rawUsersData.length === 0) {
      setMembers([])
      return
    }

    const mapped = rawUsersData
      .filter((u: any) => {
        const rStr = String(u.role?.name || u.roleName || u.role_name || u.role || 'EMPLOYEE').toUpperCase().trim()
        return !rStr.includes('ADMIN') && !rStr.includes('LEAD') && rStr !== 'HR' && rStr !== 'MANAGER'
      })
      .map((u: any) => {
        const tasksList = u.tasks || []

        // Filter tasks by selected month for completed points calculation
        const isAllTime = selectedMonth === 'All Time'
        const monthFilteredTasks = tasksList.filter((t: any) => {
          if (isAllTime) return true
          const dateStr = t.updated_at || t.created_at
          if (!dateStr) return false
          const d = new Date(dateStr)
          if (isNaN(d.getTime())) return false
          const mKey = d.toLocaleString('default', { month: 'short', year: 'numeric' })
          return mKey === selectedMonth
        })

        const active = tasksList.filter((t: any) => t.status !== 'Completed').length
        const activePoints = tasksList.filter((t: any) => t.status !== 'Completed').reduce((sum: number, t: any) => {
          const taskPoints = t.evaluated_points !== null && t.evaluated_points !== undefined && t.evaluated_points > 0
            ? t.evaluated_points
            : (t.points || 0)
          return sum + taskPoints
        }, 0)

        // Points for completed tasks within the selected month (starts at 0 when a new month starts)
        const resolvedTasks = monthFilteredTasks.filter((t: any) => t.status === 'Completed')
        const resolved = resolvedTasks.length
        const resolvedPoints = resolvedTasks.reduce((sum: number, t: any) => {
          const taskPoints = t.evaluated_points !== null && t.evaluated_points !== undefined && t.evaluated_points > 0
            ? t.evaluated_points
            : (t.points || 0)
          return sum + taskPoints
        }, 0)

        const totalPlannedPoints = tasksList.reduce((sum: number, t: any) => sum + (t.points || 0), 0)
        const balancePoints = Math.max(0, 60 - totalPlannedPoints)

        // Group submissions by month
        const userSubs = rawSubmissions.filter((s: any) => s.user_id === u.id)
        const monthlyGroups: Record<string, { totalPct: number; count: number; date: Date }> = {}
        userSubs.forEach((s: any) => {
          const date = new Date(s.submitted_at)
          if (isNaN(date.getTime())) return
          const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' })
          const pct = s.total_points > 0 ? (s.score / s.total_points) * 105 : 0
          const pctVal = Math.min(100, pct / 1.05)
          if (!monthlyGroups[monthKey]) {
            monthlyGroups[monthKey] = { totalPct: 0, count: 0, date }
          }
          monthlyGroups[monthKey].totalPct += pctVal
          monthlyGroups[monthKey].count += 1
        })

        const monthlyEvaluations = Object.entries(monthlyGroups)
          .map(([month, mData]) => ({
            month,
            avg: Math.round(mData.totalPct / mData.count),
            count: mData.count,
            date: mData.date
          }))
          .sort((a, b) => b.date.getTime() - a.date.getTime())

        return {
          id: u.id,
          name: u.full_name || 'Employee Account',
          email: u.email,
          role: u.role?.name || 'Team Member',
          active,
          activePoints,
          resolved,
          resolvedPoints,
          balancePoints,
          monthlyEvaluations
        }
      })

    setMembers(mapped)
  }, [rawUsersData, rawSubmissions, selectedMonth])

  useEffect(() => {
    fetchMembers()
  }, [user])

  return (
    <div className="space-y-4 fade-in duration-500 text-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-905">Team Directory & Member Points</h2>
          <p className="text-slate-500 text-sm mt-0.5">Review monthly performance points, workload, and attendance per employee.</p>
        </div>

        {/* Month Selector Filter for Employee Points */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
          <Calendar className="h-4 w-4 text-teal-600 shrink-0" />
          <span className="text-xs font-bold text-slate-700 whitespace-nowrap">Points Period:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg px-2 py-1 font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            {availableMonths.map(m => (
              <option key={m} value={m}>
                {m === currentMonthKey ? `${m} (Current Month)` : m}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Card className="relative bg-white border border-slate-200/50 hover:border-teal-500/35 shadow-[0_1px_3px_rgba(0,0,0,0.01),0_8px_20px_rgba(0,0,0,0.01)] hover:shadow-[0_10px_25px_-4px_rgba(20,184,166,0.04)] hover:-translate-y-0.5 transition-all duration-300 rounded-xl overflow-hidden group">
        <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-teal-550 to-teal-400 opacity-70 group-hover:opacity-100 transition-opacity" />
        <CardHeader className="pb-3 pt-4 text-left">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-slate-905 text-lg font-bold flex items-center gap-2">
                <Users className="h-5 w-5 text-teal-600" />
                <span>{teamNames.length > 0 ? teamNames.join(', ') : 'Assigned Squad'}</span>
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs mt-0.5">
                Showing employee points for <strong className="text-slate-700 font-bold">{selectedMonth}</strong>. (Points reset each month; past months preserved).
              </CardDescription>
            </div>

            <span className="text-[11px] font-extrabold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
              Filter: {selectedMonth}
            </span>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
            </div>
          ) : members.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">
              No team members registered under your lead directory.
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200/50 overflow-hidden bg-white shadow-sm">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="hover:bg-transparent border-b border-slate-100">
                    <TableHead className="font-extrabold text-[11px] uppercase tracking-wider text-slate-500 h-10">Team Member</TableHead>
                    <TableHead className="font-extrabold text-[11px] uppercase tracking-wider text-slate-500 h-10">Role</TableHead>
                    <TableHead className="font-extrabold text-[11px] uppercase tracking-wider text-slate-500 h-10">Active Workload</TableHead>
                    <TableHead className="font-extrabold text-[11px] uppercase tracking-wider text-slate-500 h-10">
                      Points ({selectedMonth})
                    </TableHead>
                    <TableHead className="font-extrabold text-[11px] uppercase tracking-wider text-slate-500 h-10">Monthly Test Evaluation</TableHead>
                    <TableHead className="font-extrabold text-[11px] uppercase tracking-wider text-slate-500 h-10">Sprint Balance</TableHead>
                    <TableHead className="text-right font-extrabold text-[11px] uppercase tracking-wider text-slate-500 h-10">Direct Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id} className="hover:bg-slate-50/40 border-b border-slate-100/60 text-left transition-colors">
                      <TableCell className="font-semibold text-slate-805 py-2.5">
                        <div>
                          <p className="text-sm font-bold text-slate-800">{member.name}</p>
                          <p className="text-[11px] font-medium text-slate-400 mt-0.5">{member.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-500 font-semibold text-xs py-2.5">{member.role}</TableCell>
                      <TableCell className="py-2.5">
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline" className="bg-teal-50/50 text-teal-700 border-teal-100/40 font-bold text-[10px] w-fit">
                            {member.active} Active Tasks
                          </Badge>
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/50 rounded px-1.5 py-0.5 w-fit">
                            {member.activePoints} pts
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <div className="flex flex-col gap-1">
                          <span className="text-slate-500 font-semibold text-xs">{member.resolved} Tasks Resolved</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded w-fit border ${
                            member.resolvedPoints > 0 
                              ? 'text-indigo-700 bg-indigo-50 border-indigo-200' 
                              : 'text-slate-500 bg-slate-100 border-slate-200'
                          }`}>
                            {member.resolvedPoints} pts ({selectedMonth})
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5">
                        {member.monthlyEvaluations && member.monthlyEvaluations.length > 0 ? (
                          <div className="flex flex-col gap-1 max-w-[170px]">
                            {member.monthlyEvaluations.map((evalItem) => (
                              <div key={evalItem.month} className="flex items-center justify-between gap-1.5 text-[11px] bg-slate-50 border border-slate-100 rounded-lg p-1 px-2">
                                <span className="font-medium text-slate-500 text-[10px]">{evalItem.month}</span>
                                <div className="flex items-center gap-1">
                                  <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 text-[10px] py-0 px-1 font-bold">
                                    {evalItem.avg}%
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-xs">No evaluation yet</span>
                        )}
                      </TableCell>
                      <TableCell className="py-2.5">
                        <span className="text-xs font-semibold text-slate-600">{member.balancePoints} pts free</span>
                      </TableCell>
                      <TableCell className="text-right py-2.5">
                        <div className="flex items-center justify-end space-x-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setAttendanceUserId(member.id)
                              setAttendanceUserName(member.name)
                              setIsAttendanceOpen(true)
                            }}
                            className="h-7 px-2 text-xs font-bold text-teal-700 hover:text-teal-800 hover:bg-teal-50 border border-teal-200/60 rounded-lg flex items-center gap-1"
                          >
                            <Calendar className="h-3.5 w-3.5" />
                            <span>Attendance</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate('/admin/tasks')}
                            className="h-7 px-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-lg"
                          >
                            Manage Tasks
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attendance Dialog Modal */}
      {attendanceUserId && (
        <AttendanceViewDialog
          open={isAttendanceOpen}
          onOpenChange={(open) => {
            setIsAttendanceOpen(open)
            if (!open) setAttendanceUserId(null)
          }}
          userId={attendanceUserId}
          userName={attendanceUserName}
        />
      )}
    </div>
  )
}
