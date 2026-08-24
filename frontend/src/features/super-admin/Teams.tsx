import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Plus, FolderKanban, Loader2, Edit, Trash2, Calendar, Layers, Users, Building, Sparkles, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, safeArray } from '@/lib/api'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useAuthStore } from '@/store/authStore'

const departmentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  description: z.string().optional(),
})

const teamSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  departmentId: z.string().min(1, 'Please select a department.'),
  leadId: z.string().min(1, 'Please select a team lead.'),
})

type DeptFormValues = z.infer<typeof departmentSchema>
type TeamFormValues = z.infer<typeof teamSchema>

// Timezone-safe local date conversion helpers
const getLocalYYYYMMDD = (date: Date) => {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
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

export default function Teams() {
  const { user, role } = useAuthStore()
  const isSA = role === 'super_admin'

  // Fetch Companies for tenant mapping and Super Admin company selector
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

  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>('all')

  const currentTenant = useMemo(() => {
    if (!user?.email) return null
    const emailLower = user.email.toLowerCase().trim()
    const domainPart = emailLower.includes('@') ? emailLower.split('@')[1] : ''

    const found = companies.find((c: any) => 
      (c.admin_email && c.admin_email.toLowerCase().trim() === emailLower) ||
      (c.id && (c.id === user.id || c.admin_id === user.id)) ||
      (c.domain && domainPart && !isGenericDomain(domainPart) && c.domain.toLowerCase().trim() === domainPart)
    )

    return {
      companyId: found?.id || user.id,
      companyName: found?.name || 'My Organization',
      adminEmail: found?.admin_email || emailLower,
      domain: found?.domain || (!isGenericDomain(domainPart) ? domainPart : ''),
    }
  }, [user, companies])

  const currentAdminDomain = currentTenant?.domain || null

  const [activeTab, setActiveTab] = useState<'teams' | 'departments'>('teams')
  const [searchQuery, setSearchQuery] = useState('')
  const [isDeptOpen, setIsDeptOpen] = useState(false)
  const [editDeptId, setEditDeptId] = useState<string | null>(null)
  
  const [isTeamOpen, setIsTeamOpen] = useState(false)
  const [editTeamId, setEditTeamId] = useState<string | null>(null)
  
  // Holiday states
  const [isHolidayOpen, setIsHolidayOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [holidayTitle, setHolidayTitle] = useState('')
  const [holidayDesc, setHolidayDesc] = useState('')
  const [holidayToEdit, setHolidayToEdit] = useState<any>(null)

  const { toast } = useToast()
  const queryClient = useQueryClient()

  const deptForm = useForm<DeptFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: { name: '', description: '' },
  })

  const editDeptForm = useForm<DeptFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: { name: '', description: '' },
  })

  const teamForm = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: { name: '', departmentId: '', leadId: '' },
  })

  const editTeamForm = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: { name: '', departmentId: '', leadId: '' },
  })

  // 1. Fetch Holidays
  const { data: rawHolidays } = useQuery({
    queryKey: ['holidays'],
    queryFn: async () => {
      try {
        const data = await api.get('/holidays?_sort=date')
        return safeArray(data, 'holidays')
      } catch (e) { return [] }
    }
  })
  const holidays = safeArray(rawHolidays)

  const saveHolidayMutation = useMutation({
    mutationFn: async (payload: { date: string; title: string; description?: string }) => {
      try { await api.post('/holidays', payload) } catch (error) {}
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] })
      setSelectedDate(null)
      setHolidayTitle('')
      setHolidayDesc('')
      setHolidayToEdit(null)
      toast({ title: "Success", description: "Holiday saved successfully." })
    },
    onError: (error: any) => {
      toast({ title: "Failed", description: error.message, variant: "destructive" })
    }
  })

  const deleteHolidayMutation = useMutation({
    mutationFn: async (id: string) => {
      try { await api.delete('/holidays/' + id) } catch (error) {}
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] })
      setSelectedDate(null)
      setHolidayTitle('')
      setHolidayDesc('')
      setHolidayToEdit(null)
      toast({ title: "Deleted", description: "Holiday removed successfully." })
    },
    onError: (error: any) => {
      toast({ title: "Failed", description: error.message, variant: "destructive" })
    }
  })

  // 2. Fetch Departments with Tenant Isolation & Persistence Sync
  const { data: rawDepartments, isLoading: loadingDepts } = useQuery({
    queryKey: ['departments', currentTenant?.adminEmail, currentTenant?.domain, isSA ? selectedCompanyFilter : 'self'],
    queryFn: async () => {
      let remote: any[] = []
      try {
        const params: any = {}
        if (!isSA && currentTenant?.adminEmail) {
          params.admin_email = currentTenant.adminEmail
        }
        if (!isSA && currentTenant?.domain) {
          params.domain = currentTenant.domain
        }
        if (isSA && selectedCompanyFilter !== 'all') {
          const comp = companies.find(c => c.id === selectedCompanyFilter)
          if (comp) {
            params.company_id = comp.id
            if (comp.admin_email) params.admin_email = comp.admin_email
            if (comp.domain) params.domain = comp.domain
          }
        }
        const res = await api.get('/departments', { params })
        remote = safeArray(res, 'departments')
      } catch (e) {}

      let local: any[] = []
      try {
        local = JSON.parse(localStorage.getItem('st_departments') || '[]')
      } catch (e) {}

      const deptMap = new Map<string, any>()
      remote.forEach((d: any) => {
        if (d && (d.id || d.name)) deptMap.set(d.id || d.name, { ...deptMap.get(d.id || d.name), ...d })
      })
      local.forEach((d: any) => {
        if (d && (d.id || d.name)) deptMap.set(d.id || d.name, { ...deptMap.get(d.id || d.name), ...d })
      })

      const allDepts = Array.from(deptMap.values())

      // Tenant isolation filter
      return allDepts.filter((d: any) => {
        if (isSA) {
          if (selectedCompanyFilter === 'all') return true
          const targetComp = companies.find(c => c.id === selectedCompanyFilter)
          if (!targetComp) return true
          const tEmail = (targetComp.admin_email || '').toLowerCase().trim()
          const tDom = (targetComp.domain || '').toLowerCase().trim()
          const tId = targetComp.id
          
          const dAdmin = (d.admin_email || d.created_by_admin || '').toLowerCase().trim()
          const dDom = (d.domain || '').toLowerCase().trim()
          const dCompId = d.company_id || d.companyId
          return (tEmail && dAdmin === tEmail) || (tId && dCompId === tId) || (tDom && dDom === tDom)
        }

        // For Company Admin / HR: strictly isolate to their company
        const dAdmin = (d.admin_email || d.created_by_admin || '').toLowerCase().trim()
        const dDom = (d.domain || '').toLowerCase().trim()
        const dCompId = d.company_id || d.companyId

        const myAdmin = currentTenant?.adminEmail || ''
        const myDom = currentTenant?.domain || ''
        const myCompId = currentTenant?.companyId || ''

        const matchEmail = Boolean(myAdmin && dAdmin && dAdmin === myAdmin)
        const matchComp = Boolean(myCompId && dCompId && (dCompId === myCompId || dCompId === user?.id))
        const matchDom = Boolean(myDom && dDom && !isGenericDomain(myDom) && (dDom === myDom || dDom.includes(myDom)))

        return matchEmail || matchComp || matchDom
      })
    }
  })
  const departments = safeArray(rawDepartments)

  // 3. Fetch Team Leads (Scoped from Database + LocalStorage)
  const { data: rawTeamLeads } = useQuery({
    queryKey: ['team-leads', currentTenant?.adminEmail, currentTenant?.domain],
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      let data: any = []
      try { data = await api.get('/employee') } catch(e) {}
      const rawData = safeArray(data, 'employees')

      let localUsers: any[] = []
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && (key.startsWith('st_emps_') || key === 'st_employees')) {
            const val = JSON.parse(localStorage.getItem(key) || '[]')
            if (Array.isArray(val)) localUsers = localUsers.concat(val)
          }
        }
      } catch (e) {}

      const userMap = new Map<string, any>()
      rawData.forEach((u: any) => userMap.set(u.id || u.email, u))
      localUsers.forEach((u: any) => {
        const idKey = u.id || u.email
        if (idKey) userMap.set(idKey, { ...userMap.get(idKey), ...u })
      })

      const allUsers = Array.from(userMap.values())
      const leads = allUsers
        .filter((u: any) => {
          const r = (u.role || u.roleName || u.role_name || '').toUpperCase().trim()
          return r === 'TEAM_LEAD' || r === 'TEAM LEAD' || r === 'MANAGER' || r === 'ADMIN'
        })
        .map((u: any) => ({ id: u.id || u.email, full_name: u.fullName || u.full_name || u.name || u.email, email: u.email }))

      return leads
    }
  })
  const teamLeads = safeArray(rawTeamLeads)

  // 4. Fetch Teams with Tenant Isolation & Persistence Sync
  const { data: rawTeams, isLoading: loadingTeams } = useQuery({
    queryKey: ['teams', currentTenant?.adminEmail, currentTenant?.domain, isSA ? selectedCompanyFilter : 'self'],
    queryFn: async () => {
      let remote: any[] = []
      try {
        const params: any = {}
        if (!isSA && currentTenant?.adminEmail) {
          params.admin_email = currentTenant.adminEmail
        }
        if (!isSA && currentTenant?.domain) {
          params.domain = currentTenant.domain
        }
        if (isSA && selectedCompanyFilter !== 'all') {
          const comp = companies.find(c => c.id === selectedCompanyFilter)
          if (comp) {
            params.company_id = comp.id
            if (comp.admin_email) params.admin_email = comp.admin_email
            if (comp.domain) params.domain = comp.domain
          }
        }
        const res = await api.get('/teams', { params })
        remote = safeArray(res, 'teams')
      } catch (e) {}

      let local: any[] = []
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && (key.startsWith('st_teams') || key === 'teams')) {
            const val = JSON.parse(localStorage.getItem(key) || '[]')
            if (Array.isArray(val)) local = local.concat(val)
          }
        }
      } catch (e) {}

      const teamMap = new Map<string, any>()
      remote.forEach((t: any) => {
        if (t && (t.id || t.name)) teamMap.set(t.id || t.name, { ...teamMap.get(t.id || t.name), ...t })
      })
      local.forEach((t: any) => {
        if (t && (t.id || t.name)) teamMap.set(t.id || t.name, { ...teamMap.get(t.id || t.name), ...t })
      })

      const allTeams = Array.from(teamMap.values())

      // Filter by tenant
      const filteredTeamsByTenant = allTeams.filter((t: any) => {
        if (isSA) {
          if (selectedCompanyFilter === 'all') return true
          const targetComp = companies.find(c => c.id === selectedCompanyFilter)
          if (!targetComp) return true
          const tEmail = (targetComp.admin_email || '').toLowerCase().trim()
          const tDom = (targetComp.domain || '').toLowerCase().trim()
          const tId = targetComp.id
          
          const teamAdmin = (t.admin_email || t.created_by_admin || '').toLowerCase().trim()
          const teamDom = (t.domain || '').toLowerCase().trim()
          const teamCompId = t.company_id || t.companyId
          return (tEmail && teamAdmin === tEmail) || (tId && teamCompId === tId) || (tDom && teamDom === tDom)
        }

        const teamAdmin = (t.admin_email || t.created_by_admin || '').toLowerCase().trim()
        const teamDom = (t.domain || '').toLowerCase().trim()
        const teamCompId = t.company_id || t.companyId

        const myAdmin = currentTenant?.adminEmail || ''
        const myDom = currentTenant?.domain || ''
        const myCompId = currentTenant?.companyId || ''

        const matchEmail = Boolean(myAdmin && teamAdmin && teamAdmin === myAdmin)
        const matchComp = Boolean(myCompId && teamCompId && (teamCompId === myCompId || teamCompId === user?.id))
        const matchDom = Boolean(myDom && teamDom && !isGenericDomain(myDom) && (teamDom === myDom || teamDom.includes(myDom)))

        return matchEmail || matchComp || matchDom
      })

      let usersData: any = []
      try {
        const res = await api.get('/employee')
        usersData = safeArray(res, 'employees')
      } catch (e) {}

      let localUsers: any[] = []
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && (key.startsWith('st_emps_') || key === 'st_employees')) {
            const val = JSON.parse(localStorage.getItem(key) || '[]')
            if (Array.isArray(val)) {
              localUsers = localUsers.concat(val)
            }
          }
        }
      } catch (e) {}

      const userMap = new Map<string, any>()
      safeArray(usersData, 'employees').forEach((u: any) => userMap.set(u.id || u.email, u))
      localUsers.forEach((u: any) => {
        const idKey = u.id || u.email
        if (idKey) {
          userMap.set(idKey, { ...userMap.get(idKey), ...u })
        }
      })
      const combinedUsers = Array.from(userMap.values())

      return filteredTeamsByTenant.map((team: any) => {
        const leadObj = teamLeads.find((l: any) => l.id === team.lead_id) || combinedUsers.find((u: any) => u.id === team.lead_id || u.email === team.lead_id)
        const leadId = team.lead_id || leadObj?.id || ''
        const leadEmail = leadObj?.email || team.lead_email || ''
        const leadName = leadObj?.full_name || team.lead_name || ''

        const memberCount = combinedUsers.filter((u: any) => {
          const r = (u.role || u.roleName || u.role_name || '').toUpperCase().trim()
          if (r.includes('ADMIN')) return false

          const uMgrId = String(u.manager_id || u.managerId || u.teamLeadId || '').toLowerCase().trim()
          const uMgrEmail = String(u.manager_email || u.teamLeadEmail || '').toLowerCase().trim()
          const uMgrName = String(u.manager?.full_name || u.manager?.fullName || u.manager_name || u.teamLead || '').toLowerCase().trim()

          const lId = String(leadId || '').toLowerCase().trim()
          const lEmail = String(leadEmail || '').toLowerCase().trim()
          const lName = String(leadName || '').toLowerCase().trim()

          const isDirectReport = (uMgrId && lId && uMgrId === lId) || (uMgrId && lEmail && uMgrId === lEmail)
          const isManagerEmail = uMgrEmail && lEmail && uMgrEmail === lEmail
          const isManagerName = uMgrName && lName && (uMgrName.includes(lName) || lName.includes(uMgrName))
          const isTeamMatch = u.team_id && String(u.team_id).toLowerCase() === String(team.id).toLowerCase()

          return isDirectReport || isManagerEmail || isManagerName || isTeamMatch
        }).length

        const deptObj = departments.find((d: any) => d.id === team.department_id || d.name === team.department_name)

        return {
          id: team.id,
          name: team.name,
          department_id: team.department_id,
          lead_id: team.lead_id,
          department: team.department_name || deptObj?.name || 'General',
          lead: team.lead_name || leadObj?.full_name || 'Unassigned',
          size: memberCount || team.size || 0,
          company_id: team.company_id,
          admin_email: team.admin_email,
          domain: team.domain,
        }
      })
    }
  })
  const teams = safeArray(rawTeams)

  // CRUD Mutations for Departments
  const addDeptMutation = useMutation({
    mutationFn: async (values: DeptFormValues) => {
      const deptId = 'd-' + Date.now()
      const newDept = {
        id: deptId,
        name: values.name,
        description: values.description || '',
        company_id: currentTenant?.companyId || user?.id || '',
        companyId: currentTenant?.companyId || user?.id || '',
        admin_email: currentTenant?.adminEmail || user?.email || '',
        domain: currentTenant?.domain || '',
        created_by_admin: user?.email || '',
        created_at: new Date().toISOString()
      }

      try { await api.post('/departments', newDept) } catch (e) {}

      try {
        const local = JSON.parse(localStorage.getItem('st_departments') || '[]')
        localStorage.setItem('st_departments', JSON.stringify([newDept, ...local]))
      } catch (e) {}

      return newDept
    },
    onSuccess: (newDept) => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      setIsDeptOpen(false)
      deptForm.reset()
      toast({ title: "Department Created", description: `${newDept.name} added successfully.` })
    },
    onError: (error: any) => {
      toast({ title: "Failed", description: error.message, variant: "destructive" })
    }
  })

  const updateDeptMutation = useMutation({
    mutationFn: async (values: DeptFormValues & { id: string }) => {
      const updated = {
        id: values.id,
        name: values.name,
        description: values.description || '',
        company_id: currentTenant?.companyId || user?.id || '',
        domain: currentTenant?.domain || '',
        admin_email: currentTenant?.adminEmail || user?.email || '',
      }

      try { await api.put('/departments/' + values.id, updated) } catch (e) {}

      try {
        const local = JSON.parse(localStorage.getItem('st_departments') || '[]')
        const updatedLocal = local.map((d: any) => d.id === values.id ? { ...d, ...updated } : d)
        localStorage.setItem('st_departments', JSON.stringify(updatedLocal))
      } catch (e) {}

      return updated
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      setEditDeptId(null)
      toast({ title: "Department Updated", description: "Successfully updated department." })
    },
    onError: (error: any) => {
      toast({ title: "Failed", description: error.message, variant: "destructive" })
    }
  })

  const deleteDeptMutation = useMutation({
    mutationFn: async (id: string) => {
      try { await api.delete('/departments/' + id) } catch (error) {}
      try {
        const local = JSON.parse(localStorage.getItem('st_departments') || '[]')
        const filtered = local.filter((d: any) => d.id !== id)
        localStorage.setItem('st_departments', JSON.stringify(filtered))
      } catch (error) {}
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      toast({ title: "Department Deleted", description: "Successfully removed department." })
    },
    onError: (error: any) => {
      toast({ title: "Failed", description: error.message, variant: "destructive" })
    }
  })

  // CRUD Mutations for Teams
  const addTeamMutation = useMutation({
    mutationFn: async (values: TeamFormValues) => {
      const teamId = 't-' + Date.now()
      const deptObj = departments.find((d: any) => d.id === values.departmentId)
      const leadObj = teamLeads.find((l: any) => l.id === values.leadId)

      const newTeam = {
        id: teamId,
        name: values.name,
        department_id: values.departmentId,
        department_name: deptObj?.name || 'General',
        lead_id: values.leadId,
        lead_name: leadObj?.full_name || 'Unassigned',
        lead_email: leadObj?.email || '',
        company_id: currentTenant?.companyId || user?.id || '',
        companyId: currentTenant?.companyId || user?.id || '',
        admin_email: currentTenant?.adminEmail || user?.email || '',
        domain: currentTenant?.domain || '',
        created_by_admin: user?.email || '',
        created_at: new Date().toISOString()
      }

      try { await api.post('/teams', newTeam) } catch (e) {}

      try {
        const globalLocal = JSON.parse(localStorage.getItem('st_teams') || '[]')
        localStorage.setItem('st_teams', JSON.stringify([newTeam, ...globalLocal]))

        if (user?.email) {
          const adminKey = `st_teams_${user.email.toLowerCase()}`
          const adminLocal = JSON.parse(localStorage.getItem(adminKey) || '[]')
          localStorage.setItem(adminKey, JSON.stringify([newTeam, ...adminLocal]))
        }
      } catch (e) {}

      return newTeam
    },
    onSuccess: (newTeam) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      setIsTeamOpen(false)
      teamForm.reset()
      toast({ title: "Team Created", description: `${newTeam.name} created successfully.` })
    },
    onError: (error: any) => {
      toast({ title: "Failed", description: error.message, variant: "destructive" })
    }
  })

  const updateTeamMutation = useMutation({
    mutationFn: async (values: TeamFormValues & { id: string }) => {
      const deptObj = departments.find((d: any) => d.id === values.departmentId)
      const leadObj = teamLeads.find((l: any) => l.id === values.leadId)

      const updated = {
        id: values.id,
        name: values.name,
        department_id: values.departmentId,
        department_name: deptObj?.name || 'General',
        lead_id: values.leadId,
        lead_name: leadObj?.full_name || 'Unassigned',
        company_id: currentTenant?.companyId || user?.id || '',
        domain: currentTenant?.domain || '',
        admin_email: currentTenant?.adminEmail || user?.email || '',
      }

      try { await api.put('/teams/' + values.id, updated) } catch (e) {}

      try {
        const local = JSON.parse(localStorage.getItem('st_teams') || '[]')
        const updatedLocal = local.map((t: any) => t.id === values.id ? { ...t, ...updated } : t)
        localStorage.setItem('st_teams', JSON.stringify(updatedLocal))
      } catch (e) {}

      return updated
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      setEditTeamId(null)
      toast({ title: "Team Updated", description: "Successfully updated team details." })
    },
    onError: (error: any) => {
      toast({ title: "Failed", description: error.message, variant: "destructive" })
    }
  })

  const deleteTeamMutation = useMutation({
    mutationFn: async (id: string) => {
      try { await api.delete('/teams/' + id) } catch (error) {}
      try {
        const local = JSON.parse(localStorage.getItem('st_teams') || '[]')
        const filtered = local.filter((t: any) => t.id !== id)
        localStorage.setItem('st_teams', JSON.stringify(filtered))
      } catch (error) {}
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      toast({ title: "Team Deleted", description: "Successfully removed team." })
    },
    onError: (error: any) => {
      toast({ title: "Failed", description: error.message, variant: "destructive" })
    }
  })

  const filteredTeams = teams.filter((t: any) =>
    searchQuery === '' ||
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.department && t.department.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (t.lead && t.lead.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const filteredDepartments = departments.filter((d: any) =>
    searchQuery === '' ||
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.description && d.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="space-y-5 sa-page-enter text-slate-800 pb-8">
      {/* Top Bar Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Teams & <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">Departments</span>
          </h2>
          <p className="text-slate-500 text-sm mt-0.5 font-medium">
            {isSA 
              ? 'Multi-tenant organization governance: manage departments, squads, and leads across tenant companies.' 
              : `Manage organizational structure, departments, teams, and team leads for ${currentTenant?.companyName || 'your company'}.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isSA && companies.length > 0 && (
            <div className="flex items-center gap-1.5 mr-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Company:</span>
              <Select value={selectedCompanyFilter} onValueChange={setSelectedCompanyFilter}>
                <SelectTrigger className="h-8.5 w-[190px] text-xs bg-white border-slate-200 rounded-xl font-bold">
                  <SelectValue placeholder="All Companies" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-xs font-semibold">
                  <SelectItem value="all">🌐 All Tenant Companies</SelectItem>
                  {companies.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name || c.admin_name || 'Organization'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {!isSA && currentTenant && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50/80 border border-indigo-100 rounded-xl text-indigo-700 text-xs font-bold mr-1">
              <Building className="w-3.5 h-3.5" />
              <span>{currentTenant.companyName}</span>
            </div>
          )}

          <Button 
            variant="outline" 
            className="border-slate-200 text-slate-700 hover:bg-slate-50 h-8.5 text-xs rounded-xl shadow-2xs font-bold flex items-center"
            onClick={() => setIsHolidayOpen(true)}
          >
            <Calendar className="mr-1.5 h-3.5 w-3.5 text-indigo-500" />
            Holidays
          </Button>

          <Dialog open={isDeptOpen} onOpenChange={setIsDeptOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-50 h-8.5 text-xs rounded-xl shadow-2xs font-bold flex items-center">
                <Building className="mr-1.5 h-3.5 w-3.5 text-indigo-500" />
                Add Dept
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-white/95 backdrop-blur-xl border-slate-200 rounded-2xl">
              <DialogHeader>
                <DialogTitle className="font-extrabold text-lg text-slate-900">Create Department</DialogTitle>
                <DialogDescription className="text-slate-500 text-xs">Add a new department for your company workspace.</DialogDescription>
              </DialogHeader>
              <Form {...deptForm}>
                <form onSubmit={deptForm.handleSubmit((v) => addDeptMutation.mutate(v))} className="space-y-4 pt-2">
                  <FormField
                    control={deptForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-slate-700">Department Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Engineering & IT" className="h-9 text-xs rounded-xl" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={deptForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-slate-700">Description (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Software development & tech ops" className="h-9 text-xs rounded-xl" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter className="pt-2">
                    <Button type="button" variant="outline" onClick={() => setIsDeptOpen(false)} className="h-8.5 text-xs font-bold border-slate-200 rounded-xl">Cancel</Button>
                    <Button type="submit" disabled={addDeptMutation.isPending} className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs h-8.5 px-4 rounded-xl shadow-md shadow-indigo-500/20">
                      {addDeptMutation.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                      Create Department
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={isTeamOpen} onOpenChange={setIsTeamOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs h-8.5 px-4 rounded-xl shadow-md shadow-indigo-500/20 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer">
                <Plus className="h-3.5 w-3.5" />
                Create Team
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-white/95 backdrop-blur-xl border-slate-200 rounded-2xl">
              <DialogHeader>
                <DialogTitle className="font-extrabold text-lg text-slate-900">Create Team</DialogTitle>
                <DialogDescription className="text-slate-500 text-xs">Create a squad team and assign a Team Lead.</DialogDescription>
              </DialogHeader>
              <Form {...teamForm}>
                <form onSubmit={teamForm.handleSubmit((v) => addTeamMutation.mutate(v))} className="space-y-4 pt-2">
                  <FormField
                    control={teamForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-slate-700">Team Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Frontend Core Squad" className="h-9 text-xs rounded-xl" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={teamForm.control}
                    name="departmentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-slate-700">Associated Department *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger className="h-9 text-xs rounded-xl"><SelectValue placeholder="Select department" /></SelectTrigger></FormControl>
                          <SelectContent className="bg-white border-slate-200 text-xs font-semibold">
                            {departments?.map((dept) => (<SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>))}
                            {departments?.length === 0 && (<SelectItem value="none" disabled>No departments yet. Create one first.</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={teamForm.control}
                    name="leadId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-slate-700">Assigned Team Lead *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger className="h-9 text-xs rounded-xl"><SelectValue placeholder="Select team lead" /></SelectTrigger></FormControl>
                          <SelectContent className="bg-white border-slate-200 text-xs font-semibold">
                            {teamLeads?.map((lead) => (<SelectItem key={lead.id} value={lead.id}>{lead.full_name}</SelectItem>))}
                            {teamLeads?.length === 0 && (<SelectItem value="none" disabled>No team leads found.</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter className="pt-2">
                    <Button type="button" variant="outline" onClick={() => setIsTeamOpen(false)} className="h-8.5 text-xs font-bold border-slate-200 rounded-xl">Cancel</Button>
                    <Button type="submit" disabled={addTeamMutation.isPending} className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs h-8.5 px-4 rounded-xl shadow-md shadow-indigo-500/20">
                      {addTeamMutation.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                      Create Team
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 p-1 bg-slate-100/80 rounded-xl border border-slate-200/60 overflow-x-auto">
            <button
              onClick={() => setActiveTab('teams')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'teams' 
                  ? 'bg-white text-indigo-700 shadow-2xs' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Teams ({filteredTeams.length})
            </button>
            <button
              onClick={() => setActiveTab('departments')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'departments' 
                  ? 'bg-white text-indigo-700 shadow-2xs' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Departments ({filteredDepartments.length})
            </button>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <Input
              placeholder="Search teams or departments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8.5 pl-8 bg-slate-50 border-slate-200 text-xs rounded-xl"
            />
          </div>
        </div>

        {/* TAB 1: TEAMS DIRECTORY */}
        {activeTab === 'teams' && (
          <div className="p-5">
            {loadingTeams ? (
              <div className="flex justify-center p-12"><Loader2 className="h-7 w-7 animate-spin text-indigo-500" /></div>
            ) : filteredTeams.length === 0 ? (
              <div className="text-center p-12 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
                No teams created yet for your company. Click "Create Team" above to add one.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredTeams.map((team: any) => (
                  <div key={team.id} className="sa-card sa-gradient-border p-4 rounded-2xl hover:shadow-md transition-all flex flex-col justify-between space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="sa-badge text-[10px] px-2 py-0.5 font-extrabold rounded-md uppercase tracking-wider">
                          {team.department}
                        </span>
                        <h3 className="text-sm font-extrabold text-slate-900 mt-2">{team.name}</h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">Led by <span className="text-indigo-600 font-bold">{team.lead}</span></p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Edit Team Modal */}
                        <Dialog open={editTeamId === team.id} onOpenChange={(open) => {
                          if (open) {
                            editTeamForm.reset({
                              name: team.name,
                              departmentId: team.department_id,
                              leadId: team.lead_id
                            })
                            setEditTeamId(team.id)
                          } else {
                            setEditTeamId(null)
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px] bg-white/95 backdrop-blur-xl border-slate-200">
                            <DialogHeader>
                              <DialogTitle className="font-bold text-slate-900">Edit Team</DialogTitle>
                              <DialogDescription className="text-slate-500 text-xs">Update team details.</DialogDescription>
                            </DialogHeader>
                            <Form {...editTeamForm}>
                              <form onSubmit={editTeamForm.handleSubmit((v) => updateTeamMutation.mutate({ ...v, id: team.id }))} className="space-y-4 pt-2">
                                <FormField control={editTeamForm.control} name="name" render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs font-semibold text-slate-700">Team Name</FormLabel>
                                    <FormControl><Input placeholder="Frontend Core Squad" className="h-9 text-xs" {...field} /></FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )} />
                                <FormField control={editTeamForm.control} name="departmentId" render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs font-semibold text-slate-700">Department</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select department" /></SelectTrigger></FormControl>
                                      <SelectContent className="bg-white border-slate-200">
                                        {departments?.map((dept) => (<SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )} />
                                <FormField control={editTeamForm.control} name="leadId" render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs font-semibold text-slate-700">Team Lead</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select lead" /></SelectTrigger></FormControl>
                                      <SelectContent className="bg-white border-slate-200">
                                        {teamLeads?.map((lead) => (<SelectItem key={lead.id} value={lead.id}>{lead.full_name}</SelectItem>))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )} />
                                <DialogFooter className="pt-2">
                                  <Button type="button" variant="outline" onClick={() => setEditTeamId(null)} className="h-9 text-xs border-slate-200">Cancel</Button>
                                  <Button type="submit" disabled={updateTeamMutation.isPending} className="sa-btn-primary h-9 px-4 text-xs font-bold">
                                    {updateTeamMutation.isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                                    Save Changes
                                  </Button>
                                </DialogFooter>
                              </form>
                            </Form>
                          </DialogContent>
                        </Dialog>

                        {/* Delete Team Button */}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete "${team.name}"?`)) {
                              deleteTeamMutation.mutate(team.id)
                            }
                          }}
                          disabled={deleteTeamMutation.isPending}
                          className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 text-slate-400 font-medium">
                        <FolderKanban className="h-3.5 w-3.5 text-indigo-500" />
                        <span>Active Projects</span>
                      </div>
                      <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">{team.size} Members</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DEPARTMENTS DIRECTORY */}
        {activeTab === 'departments' && (
          <div className="p-5">
            {loadingDepts ? (
              <div className="flex justify-center p-12"><Loader2 className="h-7 w-7 animate-spin text-indigo-500" /></div>
            ) : filteredDepartments.length === 0 ? (
              <div className="text-center p-12 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
                No departments created yet for your company. Click "Add Department" above to create one.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredDepartments.map((dept: any) => {
                  const deptTeams = teams.filter((t: any) => t.department_id === dept.id)
                  return (
                    <div key={dept.id} className="sa-card sa-gradient-border p-4 rounded-2xl hover:shadow-md transition-all flex flex-col justify-between space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-black text-slate-900 leading-snug">{dept.name}</h3>
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{dept.description || 'No description added'}</p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {/* Edit Dept Modal */}
                          <Dialog open={editDeptId === dept.id} onOpenChange={(open) => {
                            if (open) {
                              editDeptForm.reset({ name: dept.name, description: dept.description || '' })
                              setEditDeptId(dept.id)
                            } else {
                              setEditDeptId(null)
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px] bg-white border-slate-200">
                              <DialogHeader>
                                <DialogTitle className="font-bold text-slate-900">Edit Department</DialogTitle>
                                <DialogDescription className="text-slate-500 text-xs">Update department details.</DialogDescription>
                              </DialogHeader>
                              <Form {...editDeptForm}>
                                <form onSubmit={editDeptForm.handleSubmit((v) => updateDeptMutation.mutate({ ...v, id: dept.id }))} className="space-y-4 pt-2">
                                  <FormField control={editDeptForm.control} name="name" render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-xs font-semibold text-slate-700">Department Name</FormLabel>
                                      <FormControl><Input placeholder="Engineering" className="h-9 text-xs" {...field} /></FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )} />
                                  <FormField control={editDeptForm.control} name="description" render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-xs font-semibold text-slate-700">Description</FormLabel>
                                      <FormControl><Input placeholder="Software & Operations" className="h-9 text-xs" {...field} /></FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )} />
                                  <DialogFooter className="pt-2">
                                    <Button type="button" variant="outline" onClick={() => setEditDeptId(null)} className="h-9 text-xs border-slate-200">Cancel</Button>
                                    <Button type="submit" disabled={updateDeptMutation.isPending} className="sa-btn-primary h-9 px-4 text-xs font-bold">
                                      {updateDeptMutation.isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                                      Save Changes
                                    </Button>
                                  </DialogFooter>
                                </form>
                              </Form>
                            </DialogContent>
                          </Dialog>

                          {/* Delete Department Button */}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete department "${dept.name}"?`)) {
                                deleteDeptMutation.mutate(dept.id)
                              }
                            }}
                            disabled={deleteDeptMutation.isPending}
                            className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600">
                        <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                          <Users className="w-3.5 h-3.5 text-indigo-500" /> Staff
                        </span>
                        <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md text-[11px] font-extrabold">{deptTeams.length} Teams</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Holiday Calendar Modal */}
      <Dialog open={isHolidayOpen} onOpenChange={setIsHolidayOpen}>
        <DialogContent className="max-w-4xl bg-white/95 backdrop-blur-xl border-slate-200 p-6 rounded-2xl shadow-2xl text-slate-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold sa-gradient-text flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-500" />
              Holiday Calendar & List
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Manage company holidays. Click any date on the calendar to add or edit a holiday.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
            <div className="lg:col-span-7 space-y-4">
              <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="hover:bg-slate-200 text-slate-600 rounded-lg h-8 text-xs font-bold"
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                >
                  ← Prev
                </Button>
                <span className="font-bold text-slate-800 text-sm tracking-wide">
                  {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="hover:bg-slate-200 text-slate-600 rounded-lg h-8 text-xs font-bold"
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                >
                  Next →
                </Button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center font-semibold text-slate-500 text-xs tracking-wider uppercase py-1 border-b border-slate-100">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {(() => {
                  const year = currentMonth.getFullYear()
                  const month = currentMonth.getMonth()
                  const firstDay = new Date(year, month, 1)
                  const lastDay = new Date(year, month + 1, 0)
                  
                  const days: (Date | null)[] = []
                  for (let i = 0; i < firstDay.getDay(); i++) days.push(null)
                  for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(year, month, i))

                  return days.map((day, idx) => {
                    if (!day) return <div key={`empty-${idx}`} className="h-14 bg-slate-50/30 rounded-lg" />
                    
                    const dateStr = getLocalYYYYMMDD(day)
                    const holiday = holidays?.find((h: any) => h.date === dateStr)
                    const isSelected = selectedDate && getLocalYYYYMMDD(selectedDate) === dateStr
                    
                    return (
                      <button
                        key={dateStr}
                        onClick={() => {
                          setSelectedDate(day)
                          if (holiday) {
                            setHolidayToEdit(holiday)
                            setHolidayTitle(holiday.title)
                            setHolidayDesc(holiday.description || '')
                          } else {
                            setHolidayToEdit(null)
                            setHolidayTitle('')
                            setHolidayDesc('')
                          }
                        }}
                        className={`h-14 p-1 rounded-xl text-left border flex flex-col justify-between transition-all group relative overflow-hidden ${
                          holiday 
                            ? 'bg-rose-50/80 border-rose-200/80 text-rose-700 hover:bg-rose-100/70' 
                            : 'bg-white border-slate-100 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                        } ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-2 border-indigo-500' : ''}`}
                      >
                        <span className="text-[10px] font-bold opacity-60 leading-none">
                          {day.getDate()}
                        </span>
                        {holiday && (
                          <span className="text-[8px] font-semibold tracking-tight truncate w-full text-center bg-rose-500/10 px-1 py-0.5 rounded text-rose-600 mt-auto leading-tight" title={holiday.title}>
                            {holiday.title}
                          </span>
                        )}
                      </button>
                    )
                  })
                })()}
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col min-h-0 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
              {selectedDate ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-sm text-slate-700 flex items-center gap-1.5">
                      {holidayToEdit ? <Edit className="h-4 w-4 text-indigo-500" /> : <Plus className="h-4 w-4 text-indigo-500" />}
                      <span>{holidayToEdit ? 'Edit Holiday' : 'Add Holiday'}</span>
                    </h3>
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-600 h-6 px-2 text-xs" onClick={() => setSelectedDate(null)}>
                      Back to List
                    </Button>
                  </div>
                  
                  <div className="p-2.5 bg-slate-100 border border-slate-200/50 rounded-xl text-slate-700 text-xs font-semibold flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                    <span>Date: {selectedDate.toLocaleDateString(undefined, { dateStyle: 'full' })}</span>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Holiday Title</label>
                      <Input placeholder="e.g. New Year's Day" value={holidayTitle} onChange={(e) => setHolidayTitle(e.target.value)} className="bg-white border-slate-200 text-slate-800 text-xs h-9" />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Description (Optional)</label>
                      <Input placeholder="e.g. National holiday" value={holidayDesc} onChange={(e) => setHolidayDesc(e.target.value)} className="bg-white border-slate-200 text-slate-800 text-xs h-9" />
                    </div>

                    <div className="pt-2 flex gap-2">
                      <Button 
                        size="sm" 
                        disabled={saveHolidayMutation.isPending}
                        onClick={() => {
                          if (!selectedDate || !holidayTitle.trim()) return
                          saveHolidayMutation.mutate({ date: getLocalYYYYMMDD(selectedDate), title: holidayTitle.trim(), description: holidayDesc.trim() || undefined })
                        }}
                        className="sa-btn-primary flex-1 h-9 text-xs font-bold"
                      >
                        Save Holiday
                      </Button>
                      
                      {holidayToEdit && (
                        <Button 
                          size="sm" 
                          variant="destructive"
                          disabled={deleteHolidayMutation.isPending}
                          onClick={() => deleteHolidayMutation.mutate(holidayToEdit.id)}
                          className="bg-rose-600 hover:bg-rose-700 h-9 text-xs text-white font-bold"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 flex-1 flex flex-col">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Upcoming Holidays</span>
                  <div className="space-y-2 flex-1 overflow-y-auto max-h-[280px]">
                    {holidays?.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-xs">No holidays scheduled. Click a calendar date to add one.</div>
                    ) : (
                      holidays?.map((h: any) => (
                        <div key={h.id} className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <p className="font-bold text-slate-800">{h.title}</p>
                            <p className="text-[10px] text-slate-400">{h.date}</p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => deleteHolidayMutation.mutate(h.id)}
                            className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
