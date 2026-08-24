import { useState, useMemo, useEffect } from 'react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useToast } from '@/hooks/use-toast'
import { UserPlus, Edit2, Search, Trash2, Loader2, Cake, Calendar, Coffee } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, safeArray } from '@/lib/api'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import AttendanceViewDialog from '@/components/AttendanceViewDialog'
import BreakLogsDialog from '@/components/BreakLogsDialog'

const formSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  phone: z.string().optional(),
  departmentId: z.string().min(1, 'Please select a department.'),
  designation: z.string().optional(),
  role: z.string().optional(),
  teamLeadId: z.string().optional(),
  birthday: z.string().optional(),
  joiningDate: z.string().optional(),
  baseSalary: z.string().optional(),
  panNumber: z.string().optional(),
  uanNumber: z.string().optional(),
  esicNumber: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

const editFormSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters.'),
  departmentId: z.string().min(1, 'Please select a department.'),
  teamLeadId: z.string().optional(),
  birthday: z.string().optional(),
  joiningDate: z.string().optional(),
  baseSalary: z.string().optional(),
  panNumber: z.string().optional(),
  uanNumber: z.string().optional(),
  esicNumber: z.string().optional(),
})

type EditFormValues = z.infer<typeof editFormSchema>

const formatDbDate = (val?: string | null) => {
  if (!val || val.trim() === '') return null
  return val
}

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

const isGenericDomain = (domain?: string | null) => {
  if (!domain) return true
  const d = domain.toLowerCase().trim()
  const genericList = [
    'gmail.com', 'googlemail.com', 'yahoo.com', 'ymail.com', 'hotmail.com',
    'outlook.com', 'live.com', 'msn.com', 'icloud.com', 'me.com', 'aol.com',
    'zoho.com', 'proton.me', 'protonmail.com', 'mail.com', 'gmx.com', 'yandex.com',
    'example.com', 'test.com', 'evalx.com'
  ]
  return genericList.includes(d)
}

const belongsToCurrentAdmin = (u: any, adminEmail: string, adminId: string, verifiedCompanyDomain: string | null) => {
  const uCreatedBy = String(u.created_by_admin || u.createdByAdmin || u.employeeProfile?.createdByAdmin || '').toLowerCase().trim()
  const uMgrId = String(u.manager_id || u.managerId || u.teamLeadId || u.employeeProfile?.teamLeadId || '').trim()
  const uMgrEmail = String(u.manager_email || u.teamLeadEmail || u.employeeProfile?.teamLeadEmail || u.manager?.email || '').toLowerCase().trim()

  // 1. Direct created by this admin
  if (uCreatedBy && (uCreatedBy === adminEmail || uCreatedBy === adminId)) return true

  // 2. Direct manager ID or manager email
  if (uMgrId && uMgrId === adminId) return true
  if (uMgrEmail && uMgrEmail === adminEmail) return true

  // 3. If the user is the admin himself
  if (u.id === adminId || (u.email && u.email.toLowerCase().trim() === adminEmail)) return true

  // 4. Local created list for this admin
  try {
    const localEmps = JSON.parse(localStorage.getItem(`st_emps_${adminEmail}`) || '[]')
    if (localEmps.some((le: any) => (le.email && le.email.toLowerCase() === (u.email || '').toLowerCase()) || le.id === u.id)) {
      return true
    }
  } catch(e) {}

  // 5. Custom verified company domain match (ONLY if NOT a generic email domain like gmail/yahoo)
  if (verifiedCompanyDomain && !isGenericDomain(verifiedCompanyDomain)) {
    const empEmail = (u.email || '').toLowerCase().trim()
    const empDomain = empEmail.includes('@') ? empEmail.split('@')[1] : ''
    if (empDomain === verifiedCompanyDomain) return true
  }

  return false
}

import { useAuthStore } from '@/store/authStore'

export default function ManageEmployees() {
  const { user, role } = useAuthStore()
  const isSA = role === 'super_admin' || role === 'hr'

  const currentAdminDomain = useMemo(() => {
    if (!user?.email || isSA) return null
    const emailLower = user.email.toLowerCase().trim()
    const domainPart = emailLower.includes('@') ? emailLower.split('@')[1] : ''

    try {
      const companies = JSON.parse(localStorage.getItem('st_companies') || '[]')
      const found = companies.find((c: any) => 
        (c.admin_email && c.admin_email.toLowerCase().trim() === emailLower) ||
        (c.domain && domainPart && !isGenericDomain(domainPart) && c.domain.toLowerCase().trim() === domainPart)
      )
      if (found?.domain && !isGenericDomain(found.domain)) {
        return found.domain.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').trim()
      }
    } catch (e) {}

    return !isGenericDomain(domainPart) ? domainPart : null
  }, [user, isSA])

  const [searchQuery, setSearchQuery] = useState('')
  const [companyFilter, setCompanyFilter] = useState<string>('all')
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')
  const [teamLeadFilter, setTeamLeadFilter] = useState<string>('all')
  const [onBreakFilter, setOnBreakFilter] = useState(false)

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
  
  // Attendance tracking states
  const [attendanceUserId, setAttendanceUserId] = useState<string | null>(null)
  const [attendanceUserName, setAttendanceUserName] = useState<string>('')
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false)
  
  // Break logs tracking states
  const [breakLogsUserId, setBreakLogsUserId] = useState<string | null>(null)
  const [breakLogsUserName, setBreakLogsUserName] = useState<string>('')
  const [isBreakLogsOpen, setIsBreakLogsOpen] = useState(false)

  // Tab State
  const [activeTab, setActiveTab] = useState<'directory' | 'attendance' | 'breaks'>('directory')

  // Today's attendance states
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'in' | 'out' | 'late' | 'absent'>('all')
  const [selectedHistoryUser, setSelectedHistoryUser] = useState<any>(null)
  const [historyMonth, setHistoryMonth] = useState<Date>(new Date())

  const { toast } = useToast()
  const queryClient = useQueryClient()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      phone: '',
      departmentId: '',
      designation: '',
      role: 'EMPLOYEE',
      teamLeadId: '',
      birthday: '',
      joiningDate: '',
      baseSalary: '',
      panNumber: '',
      uanNumber: '',
      esicNumber: '',
    },
  })

  const editForm = useForm<EditFormValues>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      fullName: '',
      departmentId: '',
      teamLeadId: '',
      birthday: '',
      joiningDate: '',
      baseSalary: '',
      panNumber: '',
      uanNumber: '',
      esicNumber: '',
    },
  })

  const { data: rawDepartments } = useQuery({
    queryKey: ['departments', currentAdminDomain, user?.email],
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      let remote: any[] = []
      try {
        const data = await api.get('/departments')
        remote = safeArray(data, 'departments')
      } catch(e) {}

      let local: any[] = []
      try {
        local = JSON.parse(localStorage.getItem('st_departments') || '[]')
      } catch (e) {}

      const deptMap = new Map<string, any>()
      local.forEach((d: any) => deptMap.set(d.id, d))
      remote.forEach((d: any) => deptMap.set(d.id, d))

      const allDepts = Array.from(deptMap.values())
      if (!isSA) {
        const emailLower = (user?.email || '').toLowerCase().trim()
        return allDepts.filter((d: any) => {
          const dAdmin = (d.admin_email || d.created_by_admin || '').toLowerCase().trim()
          const dDom = (d.domain || '').toLowerCase().trim()
          const dCompId = d.company_id || d.companyId
          const matchEmail = Boolean(emailLower && dAdmin && dAdmin === emailLower)
          const matchComp = Boolean(user?.id && dCompId && dCompId === user?.id)
          const matchDom = Boolean(currentAdminDomain && !isGenericDomain(currentAdminDomain) && dDom && (dDom === currentAdminDomain || dDom.includes(currentAdminDomain)))
          return matchEmail || matchComp || matchDom
        })
      }
      
      return allDepts
    }
  })

  const { data: rawCompanies } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      try {
        const res = await api.get('/companies')
        const remote = safeArray(res, 'companies')
        try {
          localStorage.setItem('st_companies', JSON.stringify(remote))
        } catch (e) {}
        return remote
      } catch (e) {
        try {
          return JSON.parse(localStorage.getItem('st_companies') || '[]')
        } catch (err) {}
        return []
      }
    }
  })
  const companies = safeArray(rawCompanies)

  const getEmployeeCompany = (emp: any) => {
    const emailLower = (emp?.email || '').toLowerCase().trim()
    const domainPart = emailLower.includes('@') ? emailLower.split('@')[1] : ''
    const foundComp = companies.find((c: any) => 
      (c.domain && domainPart && !isGenericDomain(c.domain) && (c.domain.toLowerCase() === domainPart || c.domain.toLowerCase().includes(domainPart))) ||
      c.id === emp?.manager_id ||
      c.admin_email === emp?.createdByAdmin
    )
    return foundComp?.name || domainPart || 'Global'
  }

  const { data: rawTeams } = useQuery({
    queryKey: ['teams-list', currentAdminDomain, user?.email],
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      let remote: any[] = []
      try {
        const res = await api.get('/teams')
        remote = safeArray(res, 'teams')
      } catch (e) {}

      let local: any[] = []
      try {
        local = JSON.parse(localStorage.getItem('st_teams') || '[]')
      } catch (e) {}

      const teamMap = new Map<string, any>()
      local.forEach((t: any) => teamMap.set(t.id, t))
      remote.forEach((t: any) => teamMap.set(t.id, t))

      const allTeams = Array.from(teamMap.values())
      if (!isSA && currentAdminDomain) {
        return allTeams.filter((t: any) => !t.domain || t.domain.includes(currentAdminDomain) || currentAdminDomain.includes(t.domain))
      }
      return allTeams
    }
  })
  const teamsList = safeArray(rawTeams)

  const { data: rawTeamLeads } = useQuery({
    queryKey: ['team-leads-list', currentAdminDomain, user?.email],
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      let res: any = {}
      try { res.data = await api.get('/employee') } catch(e) {}
      const allUsers = safeArray(res.data, 'employees')
      return allUsers
        .filter((u: any) => {
          const r = (u.role || u.roleName || u.role_name || '').toUpperCase().trim()
          const isLeadRole = r === 'TEAM_LEAD' || r === 'TEAM LEAD' || r === 'MANAGER' || r.includes('LEAD')
          if (!isLeadRole || r.includes('ADMIN')) return false

          if (!isSA && user?.email) {
            const adminEmail = user.email.toLowerCase().trim()
            const adminId = user.id || ''
            return belongsToCurrentAdmin(u, adminEmail, adminId, currentAdminDomain)
          }

          return true
        })
        .map((u: any) => {
          const profile = u.employeeProfile || {}
          const deptVal = profile.department || u.department || u.department_id || u.departmentId || null
          return {
            id: u.id,
            email: u.email,
            full_name: u.fullName || u.full_name || u.email,
            department_id: deptVal,
            department_name: deptVal,
          }
        })
    }
  })

  const { data: rawEmployees, isLoading } = useQuery({
    queryKey: ['employees-full', currentAdminDomain, user?.email],
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      let res: any = {}
      try { res.data = await api.get('/employee') } catch(e) {}
      const rawData = safeArray(res.data, 'employees')

      const employeeUsers = rawData.filter((u: any) => {
        const r = (u.role || u.roleName || u.role_name || '').toUpperCase().trim()
        if (r.includes('ADMIN')) return false
        
        if (!isSA && user?.email) {
          const adminEmail = user.email.toLowerCase().trim()
          const adminId = user.id || ''
          return belongsToCurrentAdmin(u, adminEmail, adminId, currentAdminDomain)
        }

        return true
      })

      let tasks: any = []
      try {
        const tRes = await api.get('/task?_select=assignee_id&status_ne=Completed')
        tasks = safeArray(tRes, 'tasks')
      } catch(e) {}

      return employeeUsers.map((userItem: any) => {
        const activeTasks = tasks.filter((t: any) => t.assignee_id === userItem.id).length
        const profile = userItem.employeeProfile || {}
        return {
          id: userItem.id,
          name: userItem.fullName || userItem.full_name || userItem.email?.split('@')[0] || 'Unknown',
          email: userItem.email,
          department: profile.department || userItem.department || userItem.departments?.name || 'General',
          departmentId: userItem.department_id || profile.department || 'general',
          teamLead: userItem.teamLead || profile.teamLeadName || userItem.manager?.fullName || userItem.manager?.full_name || userItem.manager_name || 'Unassigned',
          teamLeadId: userItem.teamLeadId || profile.teamLeadId || userItem.manager_id || userItem.managerId || null,
          birthday: userItem.birthday || profile.birthday || '',
          joiningDate: userItem.joining_date || profile.dateOfJoining || (userItem.createdAt ? new Date(userItem.createdAt).toISOString().split('T')[0] : ''),
          onBreak: userItem.on_break || false,
          roleName: userItem.role || 'EMPLOYEE',
          activeTasks,
          status: profile.status || userItem.status || 'Active',
        }
      })
    }
  })

  // Attendance queries
  const todayStr = useMemo(() => getLocalYYYYMMDD(new Date()), [])
  
  const { data: rawTodayAttendance, isLoading: loadingAttendance } = useQuery({
    queryKey: ['today-attendance', todayStr, user?.email],
    staleTime: 1000 * 30,
    queryFn: async () => {
      try {
        const data = await api.get('/attendance?date=' + todayStr)
        return safeArray(data, 'attendance')
      } catch(error) { return [] }
    }
  })

  const { data: rawAllUsersForAttendance } = useQuery({
    queryKey: ['users-for-attendance', currentAdminDomain, user?.email],
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      let res: any = {}
      try { res.data = await api.get('/employee') } catch(e) {}
      const rawData = safeArray(res.data, 'employees')
      return rawData.filter((u: any) => {
        const r = (u.role || u.roleName || u.role_name || '').toUpperCase().trim()
        if (r.includes('ADMIN')) return false
        
        if (!isSA && user?.email) {
          const adminEmail = user.email.toLowerCase().trim()
          const adminId = user.id || ''
          return belongsToCurrentAdmin(u, adminEmail, adminId, currentAdminDomain)
        }

        return true
      })
    }
  })

  const { data: rawActiveBreaks, isLoading: loadingBreaks } = useQuery({
    queryKey: ['active-breaks-today', todayStr],
    queryFn: async () => {
      try {
        const data = await api.get('/break_logs?date=' + todayStr)
        return safeArray(data, 'logs')
      } catch(error) { return [] }
    }
  })

  const departments = safeArray(rawDepartments)
  const teamLeads = safeArray(rawTeamLeads)
  const employees = safeArray(rawEmployees)
  const todayAttendance = safeArray(rawTodayAttendance)
  const allUsersForAttendance = safeArray(rawAllUsersForAttendance)
  const activeBreaks = safeArray(rawActiveBreaks)

  const attendanceListWithUsers = useMemo(() => {
    if (!allUsersForAttendance) return []
    const attMap = new Map(todayAttendance?.map((a: any) => [a.user_id || a.userId, a]) || [])
    
    return allUsersForAttendance.map((u: any) => {
      const att: any = attMap.get(u.id)
      return {
        id: u.id,
        name: u.fullName || u.full_name || u.email,
        email: u.email,
        department: u.employeeProfile?.department || u.department || 'General',
        checkIn: att?.check_in || att?.checkIn || null,
        checkOut: att?.check_out || att?.checkOut || null,
        status: att?.status || 'ABSENT',
        recordId: att?.id || null
      }
    })
  }, [allUsersForAttendance, todayAttendance])

  const filteredTodayAttendance = useMemo(() => {
    return attendanceListWithUsers.filter(u => {
      if (attendanceFilter === 'in') return u.checkIn && !u.checkOut
      if (attendanceFilter === 'out') return u.checkOut
      if (attendanceFilter === 'late') return u.status === 'LATE'
      if (attendanceFilter === 'absent') return !u.checkIn
      return true
    })
  }, [attendanceListWithUsers, attendanceFilter])

  const breakLogsListWithUsers = useMemo(() => {
    if (!allUsersForAttendance) return []
    const activeBreaksMap = new Map(activeBreaks?.filter((b: any) => !b.end_time).map((b: any) => [b.user_id, b]) || [])
    
    return allUsersForAttendance.map((u: any) => {
      const currentBreak: any = activeBreaksMap.get(u.id)
      const userBreaks = activeBreaks?.filter((b: any) => b.user_id === u.id) || []
      const totalBreakMinutes = userBreaks.reduce((acc: number, b: any) => {
        if (!b.start_time) return acc
        const start = new Date(b.start_time).getTime()
        const end = b.end_time ? new Date(b.end_time).getTime() : new Date().getTime()
        return acc + Math.floor((end - start) / 60000)
      }, 0)

      return {
        id: u.id,
        name: u.fullName || u.full_name || u.email,
        email: u.email,
        department: u.employeeProfile?.department || u.department || 'General',
        onBreak: !!currentBreak,
        breakStart: currentBreak?.start_time || null,
        totalBreakMinutes,
        breakCount: userBreaks.length
      }
    })
  }, [allUsersForAttendance, activeBreaks])

  const filteredBreakLogs = useMemo(() => {
    if (onBreakFilter) {
      return breakLogsListWithUsers.filter(u => u.onBreak)
    }
    return breakLogsListWithUsers
  }, [breakLogsListWithUsers, onBreakFilter])

  const filteredEmployees = useMemo(() => {
    if (!employees) return []
    return employees.filter(emp => {
      const r = (emp.roleName || emp.role || '').toUpperCase().trim()
      if (r === 'SUPER_ADMIN') return false

      const matchesSearch = searchQuery === '' || 
        (emp.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
        (emp.email || '').toLowerCase().includes(searchQuery.toLowerCase())
      
      // Matching Company Filter (for Super Admin)
      let matchesComp = true
      if (companyFilter !== 'all') {
        const compObj = companies.find((c: any) => c.id === companyFilter || c.domain === companyFilter)
        const compDomain = (compObj?.domain || '').toLowerCase().trim()
        const empDomain = (emp.email || '').toLowerCase().includes('@') ? emp.email.split('@')[1] : ''
        const matchesDom = Boolean(compDomain && empDomain && (empDomain === compDomain || empDomain.includes(compDomain)))
        const matchesMgr = Boolean(emp.manager_id === companyFilter || emp.companyId === companyFilter || emp.createdByAdmin === compObj?.admin_email)
        matchesComp = matchesDom || matchesMgr
      }

      // Matching Department Filter (by ID or Name)
      let matchesDept = true
      if (departmentFilter !== 'all') {
        const filterDeptObj = departments.find((d: any) => d.id === departmentFilter || d.name === departmentFilter)
        const filterDeptId = String(filterDeptObj?.id || departmentFilter).toLowerCase().trim()
        const filterDeptName = String(filterDeptObj?.name || departmentFilter).toLowerCase().trim()

        const empDeptId = String(emp.departmentId || '').toLowerCase().trim()
        const empDeptName = String(emp.department || '').toLowerCase().trim()

        matchesDept = Boolean((empDeptId && (empDeptId === filterDeptId || empDeptId === filterDeptName)) ||
                      (empDeptName && (empDeptName === filterDeptId || empDeptName === filterDeptName || empDeptName.includes(filterDeptName))))
      }

      // Matching Team Lead Filter (by ID, Email, or Name)
      let matchesTL = true
      if (teamLeadFilter !== 'all') {
        const filterTLObj = teamLeads.find((tl: any) => tl.id === teamLeadFilter || tl.full_name === teamLeadFilter)
        const filterTLId = String(filterTLObj?.id || teamLeadFilter).toLowerCase().trim()
        const filterTLEmail = String(filterTLObj?.email || teamLeadFilter).toLowerCase().trim()
        const filterTLName = String(filterTLObj?.full_name || teamLeadFilter).toLowerCase().trim()

        const empTLId = String(emp.teamLeadId || emp.manager_id || emp.managerId || '').toLowerCase().trim()
        const empTLEmail = String(emp.manager_email || emp.teamLeadEmail || '').toLowerCase().trim()
        const empTLName = String(emp.teamLead || emp.manager_name || '').toLowerCase().trim()

        const matchId = Boolean(filterTLId && (empTLId === filterTLId || empTLEmail === filterTLId))
        const matchEmail = Boolean(filterTLEmail && (empTLEmail === filterTLEmail || empTLId === filterTLEmail))
        const matchName = Boolean(filterTLName && (empTLName.includes(filterTLName) || filterTLName.includes(empTLName)))

        matchesTL = matchId || matchEmail || matchName
      }

      const matchesBreak = !onBreakFilter || emp.onBreak

      return matchesSearch && matchesComp && matchesDept && matchesTL && matchesBreak
    })
  }, [employees, searchQuery, companyFilter, departmentFilter, teamLeadFilter, onBreakFilter, departments, teamLeads, companies])

  const selectedDeptId = form.watch('departmentId')
  const selectedDeptObj = useMemo(() => departments.find((d: any) => d.id === selectedDeptId || d.name === selectedDeptId), [departments, selectedDeptId])

  const filteredTeamLeadsByDept = useMemo(() => {
    if (!teamLeads || teamLeads.length === 0) return []
    if (!selectedDeptId) return teamLeads
    
    const selId = String(selectedDeptId || '').toLowerCase().trim()
    const selName = String(selectedDeptObj?.name || selectedDeptId || '').toLowerCase().trim()

    return teamLeads.filter((tl: any) => {
      const tlDeptStr = String(tl.department_name || tl.department_id || '').toLowerCase().trim()
      if (!tlDeptStr) return false

      const deptMatchObj = departments.find((d: any) => String(d.id).toLowerCase().trim() === tlDeptStr || String(d.name).toLowerCase().trim() === tlDeptStr)
      const resolvedTlId = String(deptMatchObj?.id || tlDeptStr).toLowerCase().trim()
      const resolvedTlName = String(deptMatchObj?.name || tlDeptStr).toLowerCase().trim()

      const matchId = selId && (tlDeptStr === selId || resolvedTlId === selId)
      const matchName = selName && (tlDeptStr === selName || resolvedTlName === selName || (tlDeptStr && selName && tlDeptStr.includes(selName)) || (selName && tlDeptStr && selName.includes(tlDeptStr)))

      return matchId || matchName
    })
  }, [teamLeads, selectedDeptId, selectedDeptObj, departments])

  const addMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      let data: any
      const deptObj = departments.find((d: any) => d.id === values.departmentId)
      const selectedManagerId = values.teamLeadId && values.teamLeadId !== 'none' ? values.teamLeadId : null
      const tlObj = teamLeads.find((tl: any) => tl.id === selectedManagerId)

      try {
        data = await api.post('/employee', {
          email: values.email,
          password: values.password,
          fullName: values.fullName,
          full_name: values.fullName,
          phone: values.phone || '',
          designation: values.designation || (values.role === 'TEAM_LEAD' ? 'Team Lead' : values.role === 'HR' ? 'HR Manager' : 'Software Engineer'),
          department: deptObj?.name || values.departmentId,
          department_id: values.departmentId,
          role: values.role || 'EMPLOYEE',
          manager_id: selectedManagerId,
          managerId: selectedManagerId,
          teamLeadId: selectedManagerId,
          teamLeadName: tlObj?.full_name || tlObj?.fullName || null,
          teamLeadEmail: tlObj?.email || null,
          birthday: formatDbDate(values.birthday),
          joining_date: formatDbDate(values.joiningDate),
          dateOfBirth: formatDbDate(values.birthday),
          dateOfJoining: formatDbDate(values.joiningDate),
          baseSalary: values.baseSalary ? parseFloat(values.baseSalary) : null,
          panNumber: values.panNumber || null,
          uanNumber: values.uanNumber || null,
          esicNumber: values.esicNumber || null,
        })

        if (user?.email) {
          const adminKey = `st_emps_${user.email.toLowerCase()}`
          const existing = JSON.parse(localStorage.getItem(adminKey) || '[]')
          const createdEmp = data?.employee || data?.data || { email: values.email, id: 'emp-' + Date.now() }
          const newEmpRecord = {
            ...createdEmp,
            manager_id: selectedManagerId,
            managerId: selectedManagerId,
            teamLeadId: selectedManagerId,
            teamLeadName: tlObj?.full_name || tlObj?.fullName || createdEmp.teamLeadName,
            teamLeadEmail: tlObj?.email || createdEmp.teamLeadEmail,
            manager_email: tlObj?.email || createdEmp.manager_email,
            manager_name: tlObj?.full_name || createdEmp.manager_name,
            teamLead: tlObj?.full_name,
            created_by_admin: user.email,
          }
          localStorage.setItem(adminKey, JSON.stringify([newEmpRecord, ...existing]))
        }
      } catch (e: any) { throw new Error(e.message || 'Failed to create employee') }
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees-full'] })
      queryClient.invalidateQueries({ queryKey: ['users-for-attendance'] })
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      queryClient.invalidateQueries({ queryKey: ['team-leads'] })
      setIsAddOpen(false)
      form.reset()
      toast({ title: 'Success', description: 'Employee added successfully' })
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    }
  })

  const editMutation = useMutation({
    mutationFn: async (values: EditFormValues) => {
      if (!selectedEmployee?.id) return
      const selectedManagerId = values.teamLeadId && values.teamLeadId !== 'none' ? values.teamLeadId : null
      const tlObj = teamLeads.find((tl: any) => tl.id === selectedManagerId)

      try {
        await api.put('/employee/' + selectedEmployee.id, {
          full_name: values.fullName,
          fullName: values.fullName,
          department_id: values.departmentId,
          manager_id: selectedManagerId,
          managerId: selectedManagerId,
          teamLeadId: selectedManagerId,
          teamLeadName: tlObj?.full_name || tlObj?.fullName || null,
          teamLeadEmail: tlObj?.email || null,
          birthday: formatDbDate(values.birthday),
          joining_date: formatDbDate(values.joiningDate),
          baseSalary: values.baseSalary ? parseFloat(values.baseSalary) : null,
          panNumber: values.panNumber || null,
          uanNumber: values.uanNumber || null,
          esicNumber: values.esicNumber || null,
        })
      } catch(e: any) { throw new Error(e.message) }

      if (user?.email) {
        const adminKey = `st_emps_${user.email.toLowerCase()}`
        try {
          const existing = JSON.parse(localStorage.getItem(adminKey) || '[]')
          const updated = existing.map((emp: any) => {
            if (emp.id === selectedEmployee.id || emp.email === selectedEmployee.email) {
              return {
                ...emp,
                full_name: values.fullName,
                department_id: values.departmentId,
                manager_id: selectedManagerId,
                managerId: selectedManagerId,
                teamLeadId: selectedManagerId,
                manager_email: tlObj?.email || emp.manager_email,
                manager_name: tlObj?.full_name || emp.manager_name,
                teamLead: tlObj?.full_name,
              }
            }
            return emp
          })
          localStorage.setItem(adminKey, JSON.stringify(updated))
        } catch(e) {}
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees-full'] })
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      queryClient.invalidateQueries({ queryKey: ['team-leads'] })
      setIsEditOpen(false)
      setSelectedEmployee(null)
      toast({ title: 'Success', description: 'Employee updated successfully' })
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      try { await api.delete('/employee/' + id) } catch (e: any) { throw new Error(e.message) }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees-full'] })
      setIsDeleteOpen(false)
      setSelectedEmployee(null)
      toast({ title: 'Success', description: 'Employee deleted successfully' })
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    }
  })

  const handleEditClick = (emp: any) => {
    setSelectedEmployee(emp)
    editForm.reset({
      fullName: emp.name,
      departmentId: emp.departmentId || '',
      teamLeadId: emp.teamLeadId || '',
      birthday: emp.birthday || '',
      joiningDate: emp.joiningDate || '',
      baseSalary: emp.baseSalary ? String(emp.baseSalary) : '',
      panNumber: emp.panNumber || '',
      uanNumber: emp.uanNumber || '',
      esicNumber: emp.esicNumber || '',
    })
    setIsEditOpen(true)
  }

  const handleDeleteClick = (emp: any) => {
    setSelectedEmployee(emp)
    setIsDeleteOpen(true)
  }

  return (
    <div className="space-y-6 text-foreground pb-8">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Workforce & <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">Employee Directory</span>
          </h2>
          <p className="text-slate-500 text-sm mt-0.5 font-medium">
            Multi-tenant employee governance, live attendance logs, and active squad break telemetry.
          </p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-md shadow-indigo-500/20 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer">
          <UserPlus className="h-3.5 w-3.5" />
          <span>Add Employee</span>
        </Button>
      </div>

      {/* Main Tabs */}
      <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-slate-200/80 p-1.5 shadow-2xs flex gap-2">
        <button
          onClick={() => setActiveTab('directory')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'directory' 
              ? 'bg-white text-indigo-700 shadow-2xs' 
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Employee Directory ({employees?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'attendance' 
              ? 'bg-white text-indigo-700 shadow-2xs' 
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Today's Attendance ({attendanceListWithUsers.length})
        </button>
        <button
          onClick={() => setActiveTab('breaks')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'breaks' 
              ? 'bg-white text-indigo-700 shadow-2xs' 
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Active Breaks ({breakLogsListWithUsers.filter(b => b.onBreak).length})
        </button>
      </div>

      {/* Directory Tab View */}
      {activeTab === 'directory' && (
        <Card className="bg-white/85 backdrop-blur-xl border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
          <CardHeader className="pb-4 pt-5 px-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Search employees by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8.5 bg-slate-50 border-slate-200 text-xs rounded-xl h-8.5"
                />
              </div>
              <div className="flex items-center gap-2.5">
                {isSA && (
                  <Select value={companyFilter} onValueChange={setCompanyFilter}>
                    <SelectTrigger className="w-[180px] bg-slate-50 border-slate-200 text-xs font-bold rounded-xl h-8.5">
                      <SelectValue placeholder="All Companies" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 text-xs font-semibold">
                      <SelectItem value="all">All Companies / Admins</SelectItem>
                      {companies?.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="w-[160px] bg-slate-50 border-slate-200 text-xs font-bold rounded-xl h-8.5">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-xs font-semibold">
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments?.map((d: any) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/70 hover:bg-slate-50/70">
                  <TableHead className="font-semibold text-slate-700">Staff Member</TableHead>
                  <TableHead className="font-semibold text-slate-700">Company & Admin</TableHead>
                  <TableHead className="font-semibold text-slate-700">Department</TableHead>
                  <TableHead className="font-semibold text-slate-700">Role</TableHead>
                  <TableHead className="font-semibold text-slate-700">Status</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-indigo-600 mx-auto mb-2" />
                      <p className="text-xs text-slate-500">Loading directory...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                      No staff members found for selected filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmployees.map((emp) => (
                    <TableRow key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{emp.name}</p>
                          <p className="text-xs text-slate-500">{emp.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-indigo-50/70 text-indigo-700 border-indigo-200 text-[11px] font-bold">
                          {getEmployeeCompany(emp)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                          {emp.department}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const r = (emp.roleName || emp.role || '').toUpperCase()
                          if (r.includes('ADMIN')) {
                            return <Badge className="bg-indigo-100 text-indigo-800 border-indigo-300 font-extrabold text-[10px]">COMPANY ADMIN</Badge>
                          }
                          if (r === 'HR') {
                            return <Badge className="bg-blue-100 text-blue-800 border-blue-300 font-extrabold text-[10px]">HR MANAGER</Badge>
                          }
                          if (r === 'TEAM_LEAD' || r === 'MANAGER') {
                            return <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-extrabold text-[10px]">TEAM LEAD</Badge>
                          }
                          return <Badge className="bg-slate-100 text-slate-700 border-slate-200 font-bold text-[10px]">TEAM MEMBER</Badge>
                        })()}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {emp.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setAttendanceUserId(emp.id)
                              setAttendanceUserName(emp.name)
                              setIsAttendanceOpen(true)
                            }}
                            title="View Attendance"
                          >
                            <Calendar className="h-4 w-4 text-indigo-600" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEditClick(emp)}>
                            <Edit2 className="h-4 w-4 text-slate-600" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(emp)}>
                            <Trash2 className="h-4 w-4 text-rose-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Attendance Tab View */}
      {activeTab === 'attendance' && (
        <Card className="border border-slate-200/80 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Select value={attendanceFilter} onValueChange={(val: any) => setAttendanceFilter(val)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="in">Currently Checked In</SelectItem>
                    <SelectItem value="out">Checked Out</SelectItem>
                    <SelectItem value="late">Late Arrival</SelectItem>
                    <SelectItem value="absent">Absent / Not Checked In</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/70 hover:bg-slate-50/70">
                  <TableHead className="font-semibold text-slate-700">Employee</TableHead>
                  <TableHead className="font-semibold text-slate-700">Department</TableHead>
                  <TableHead className="font-semibold text-slate-700">Check In</TableHead>
                  <TableHead className="font-semibold text-slate-700">Check Out</TableHead>
                  <TableHead className="font-semibold text-slate-700">Status</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTodayAttendance.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                      No attendance records found for this filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTodayAttendance.map((att: any) => (
                    <TableRow key={att.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{att.name}</p>
                          <p className="text-xs text-slate-500">{att.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                          {att.department}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {att.checkIn ? new Date(att.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                      </TableCell>
                      <TableCell>
                        {att.checkOut ? new Date(att.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          att.status === 'ABSENT' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          att.status === 'LATE' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }>
                          {att.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => { 
                            setAttendanceUserId(att.id); 
                            setAttendanceUserName(att.name); 
                            setIsAttendanceOpen(true); 
                          }}
                        >
                          <Calendar className="h-4 w-4 text-indigo-600 mr-2" />
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Breaks Tab View */}
      {activeTab === 'breaks' && (
        <Card className="border border-slate-200/80 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Button 
                  variant={onBreakFilter ? "default" : "outline"} 
                  onClick={() => setOnBreakFilter(!onBreakFilter)}
                  className={onBreakFilter ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "border-slate-200"}
                >
                  <Coffee className="mr-2 h-4 w-4" /> 
                  {onBreakFilter ? "Showing Only Active Breaks" : "Show Only Active Breaks"}
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/70 hover:bg-slate-50/70">
                  <TableHead className="font-semibold text-slate-700">Employee</TableHead>
                  <TableHead className="font-semibold text-slate-700">Department</TableHead>
                  <TableHead className="font-semibold text-slate-700">Status</TableHead>
                  <TableHead className="font-semibold text-slate-700">Total Breaks (Today)</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBreakLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                      No break logs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBreakLogs.map((b: any) => (
                    <TableRow key={b.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{b.name}</p>
                          <p className="text-xs text-slate-500">{b.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                          {b.department}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {b.onBreak ? (
                          <Badge className="bg-amber-50 text-amber-700 border-amber-200 animate-pulse">
                            On Break
                          </Badge>
                        ) : (
                          <Badge className="bg-slate-50 text-slate-600 border-slate-200">
                            Working
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-700">{b.breakCount} breaks</span>
                          <span className="text-xs text-slate-400">({b.totalBreakMinutes} mins)</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => { 
                            setBreakLogsUserId(b.id); 
                            setBreakLogsUserName(b.name); 
                            setIsBreakLogsOpen(true); 
                          }}
                        >
                          View Logs
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Attendance View Modal */}
      {isAttendanceOpen && (
        <AttendanceViewDialog
          userId={attendanceUserId || ''}
          userName={attendanceUserName}
          open={isAttendanceOpen}
          onOpenChange={setIsAttendanceOpen}
        />
      )}

      {/* Break Logs View Modal */}
      {isBreakLogsOpen && (
        <BreakLogsDialog
          userId={breakLogsUserId || ''}
          userName={breakLogsUserName}
          open={isBreakLogsOpen}
          onOpenChange={setIsBreakLogsOpen}
        />
      )}

      {/* Add Employee Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-4xl bg-white border-slate-200 p-6 shadow-xl">
          <DialogHeader className="pb-3 border-b border-slate-100">
            <DialogTitle className="text-slate-900 font-bold text-lg">Add New Employee</DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">Fill in employee details and assign access level.</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => addMutation.mutate(v))} className="space-y-4 pt-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs font-semibold text-slate-700">Full Name *</FormLabel>
                      <FormControl><Input placeholder="John Doe" className="h-9 text-xs border-slate-200 focus:border-indigo-500" {...field} /></FormControl>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs font-semibold text-slate-700">Email Address *</FormLabel>
                      <FormControl><Input placeholder="john@company.com" type="email" className="h-9 text-xs border-slate-200 focus:border-indigo-500" {...field} /></FormControl>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs font-semibold text-slate-700">Password *</FormLabel>
                      <FormControl><Input placeholder="••••••••" type="password" className="h-9 text-xs border-slate-200 focus:border-indigo-500" {...field} /></FormControl>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs font-semibold text-slate-700">Mobile Number</FormLabel>
                      <FormControl><Input placeholder="+1 (555) 000-0000" className="h-9 text-xs border-slate-200 focus:border-indigo-500" {...field} /></FormControl>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs font-semibold text-slate-700">Department *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-9 text-xs border-slate-200 focus:border-indigo-500"><SelectValue placeholder="Select department" /></SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white border-slate-200">
                          {departments?.map((d: any) => (
                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="designation"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs font-semibold text-slate-700">Designation / Job Title</FormLabel>
                      <FormControl><Input placeholder="e.g. Senior Frontend Engineer" className="h-9 text-xs border-slate-200 focus:border-indigo-500" {...field} /></FormControl>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="birthday"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs font-semibold text-slate-700">Date of Birth (DOB)</FormLabel>
                      <FormControl><Input type="date" className="h-9 text-xs border-slate-200 focus:border-indigo-500 text-slate-700" {...field} /></FormControl>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="joiningDate"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs font-semibold text-slate-700">Date of Joining (DOJ)</FormLabel>
                      <FormControl><Input type="date" className="h-9 text-xs border-slate-200 focus:border-indigo-500 text-slate-700" {...field} /></FormControl>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs font-semibold text-slate-700">Role Access Level *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || 'EMPLOYEE'}>
                        <FormControl>
                          <SelectTrigger className="h-9 text-xs border-slate-200 focus:border-indigo-500"><SelectValue placeholder="Select role" /></SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white border-slate-200">
                          <SelectItem value="EMPLOYEE">Employee</SelectItem>
                          <SelectItem value="HR">HR Manager</SelectItem>
                          <SelectItem value="TEAM_LEAD">Team Lead</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />

                {(form.watch('role') === 'EMPLOYEE' || !form.watch('role')) && (
                  <FormField
                    control={form.control}
                    name="teamLeadId"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-xs font-semibold text-slate-700">Department Team Lead (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
                          <FormControl>
                            <SelectTrigger className="h-9 text-xs border-slate-200 focus:border-indigo-500"><SelectValue placeholder="Select Team Lead for this Department (Optional)" /></SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-white border-slate-200">
                            <SelectItem value="none">Unassigned / No Team Lead</SelectItem>
                            {filteredTeamLeadsByDept?.map((tl: any) => (
                              <SelectItem key={tl.id} value={tl.id}>{tl.full_name}</SelectItem>
                            ))}
                            {filteredTeamLeadsByDept?.length === 0 && (
                              <SelectItem value="none_found" disabled>No Team Leads in selected department</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-[11px]" />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="baseSalary"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs font-semibold text-slate-700">Base Salary (Monthly CTC)</FormLabel>
                      <FormControl><Input placeholder="e.g. 50000" type="number" className="h-9 text-xs border-slate-200 focus:border-indigo-500" {...field} /></FormControl>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="panNumber"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs font-semibold text-slate-700">PAN Number</FormLabel>
                      <FormControl><Input placeholder="e.g. ABCDE1234F" className="h-9 text-xs border-slate-200 focus:border-indigo-500 uppercase" {...field} /></FormControl>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="uanNumber"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs font-semibold text-slate-700">UAN Number</FormLabel>
                      <FormControl><Input placeholder="e.g. 100123456789" className="h-9 text-xs border-slate-200 focus:border-indigo-500" {...field} /></FormControl>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="esicNumber"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs font-semibold text-slate-700">ESIC Number</FormLabel>
                      <FormControl><Input placeholder="e.g. 3100123456" className="h-9 text-xs border-slate-200 focus:border-indigo-500" {...field} /></FormControl>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} className="h-9 text-xs border-slate-200">Cancel</Button>
                <Button type="submit" disabled={addMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-9 text-xs px-6">
                  {addMutation.isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />} Save Employee
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-4xl bg-white border-slate-200 p-6 shadow-xl">
          <DialogHeader className="pb-3 border-b border-slate-100">
            <DialogTitle className="text-slate-900 font-bold text-lg">Edit Employee</DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">Update employee details.</DialogDescription>
          </DialogHeader>

          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit((v) => editMutation.mutate(v))} className="space-y-6 pt-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={editForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs font-semibold text-slate-700">Full Name *</FormLabel>
                      <FormControl><Input placeholder="John Doe" className="h-9 text-xs border-slate-200 focus:border-indigo-500" {...field} /></FormControl>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs font-semibold text-slate-700">Department *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-9 text-xs border-slate-200 focus:border-indigo-500"><SelectValue placeholder="Select department" /></SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white border-slate-200">
                          {departments?.map((d: any) => (
                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="teamLeadId"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs font-semibold text-slate-700">Department Team Lead (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || ''} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger className="h-9 text-xs border-slate-200 focus:border-indigo-500"><SelectValue placeholder="Select Team Lead for this Department (Optional)" /></SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white border-slate-200">
                          <SelectItem value="none">Unassigned / No Team Lead</SelectItem>
                          {teamLeads?.map((tl: any) => (
                            <SelectItem key={tl.id} value={tl.id}>{tl.full_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="birthday"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs font-semibold text-slate-700">Date of Birth (DOB)</FormLabel>
                      <FormControl><Input type="date" className="h-9 text-xs border-slate-200 focus:border-indigo-500 text-slate-700" {...field} /></FormControl>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="joiningDate"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs font-semibold text-slate-700">Date of Joining (DOJ)</FormLabel>
                      <FormControl><Input type="date" className="h-9 text-xs border-slate-200 focus:border-indigo-500 text-slate-700" {...field} /></FormControl>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="baseSalary"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs font-semibold text-slate-700">Base Salary (Monthly CTC)</FormLabel>
                      <FormControl><Input placeholder="e.g. 50000" type="number" className="h-9 text-xs border-slate-200 focus:border-indigo-500" {...field} /></FormControl>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="panNumber"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs font-semibold text-slate-700">PAN Number</FormLabel>
                      <FormControl><Input placeholder="e.g. ABCDE1234F" className="h-9 text-xs border-slate-200 focus:border-indigo-500 uppercase" {...field} /></FormControl>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="uanNumber"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs font-semibold text-slate-700">UAN Number</FormLabel>
                      <FormControl><Input placeholder="e.g. 100123456789" className="h-9 text-xs border-slate-200 focus:border-indigo-500" {...field} /></FormControl>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="esicNumber"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs font-semibold text-slate-700">ESIC Number</FormLabel>
                      <FormControl><Input placeholder="e.g. 3100123456" className="h-9 text-xs border-slate-200 focus:border-indigo-500" {...field} /></FormControl>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="h-9 text-xs border-slate-200">Cancel</Button>
                <Button type="submit" disabled={editMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-9 text-xs px-6">
                  {editMutation.isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />} Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
