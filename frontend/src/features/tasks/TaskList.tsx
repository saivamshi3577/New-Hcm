import { useState, useEffect, useRef, useMemo } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Plus, MoreHorizontal, LayoutGrid, List, ShieldAlert, Edit2, Trash2, Search, 
  Filter, Calendar, Sparkles, ChevronDown, TrendingUp, Award, Download, CheckCircle2, 
  AlertCircle, CheckSquare, Star, FileSpreadsheet, ArrowUpRight, UserCheck
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePermissions } from '@/hooks/usePermissions'
import { Permission } from '@/config/permissions'
import { useAuthStore } from '@/store/authStore'
import { api, safeArray } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { useSearchParams } from 'react-router-dom'

interface Task {
  id: string
  title: string
  description?: string
  status: string
  priority: string
  assignee: { id: string; full_name: string } | null
  creator_id: string
  creator?: { id: string; full_name: string } | null
  due_date: string | null
  project: { id: string; name: string } | null
  points: number
  evaluatedPoints?: number
  evaluation_feedback?: string | null
  evaluated_at?: string | null
  created_at?: string
  updated_at?: string
}

const initialFormState = {
  title: '',
  description: '',
  status: 'Todo',
  priority: 'Medium',
  assigneeId: '',
  projectId: '',
  dueDate: '',
  points: 0,
  evaluatedPoints: 0,
  evaluationFeedback: ''
}

const normalizeStatus = (statusStr?: string) => {
  if (!statusStr) return 'Todo'
  const norm = String(statusStr).trim().toLowerCase().replace(/[\s_-]+/g, '')
  if (norm === 'todo') return 'Todo'
  if (norm === 'inprogress' || norm === 'progress' || norm === 'in_progress') return 'In Progress'
  if (norm === 'review' || norm === 'inreview' || norm === 'in_review') return 'Review'
  if (norm === 'completed' || norm === 'done') return 'Completed'
  if (norm === 'blocked') return 'Blocked'
  return statusStr
}

interface FormState {
  title: string
  description: string
  status: string
  priority: string
  assigneeId: string
  projectId: string
  dueDate: string
  points: string | number
  evaluatedPoints: string | number
  evaluationFeedback?: string
}

export default function TaskList() {
  const { hasPermission, role } = usePermissions()
  const { user, profile } = useAuthStore()
  const { toast } = useToast()

  const isEvaluator = role === 'team_lead' || role === 'admin' || role === 'super_admin' || role === 'hr'

  // Dynamic theme styling matching the role
  const buttonBgClass = role === 'admin'
    ? 'bg-teal-600 hover:bg-teal-700'
    : role === 'super_admin'
      ? 'bg-indigo-600 hover:bg-indigo-700'
      : role === 'team_lead'
        ? 'bg-emerald-600 hover:bg-emerald-700'
        : 'bg-violet-600 hover:bg-violet-700'

  const textThemeClass = role === 'admin'
    ? 'text-teal-600'
    : role === 'super_admin'
      ? 'text-indigo-600'
      : role === 'team_lead'
        ? 'text-emerald-600'
        : 'text-violet-600'

  const avatarBgClass = role === 'admin'
    ? 'bg-teal-50 border-teal-100 text-teal-700'
    : role === 'super_admin'
      ? 'bg-indigo-50 border-indigo-100 text-indigo-700'
      : role === 'team_lead'
        ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
        : 'bg-violet-50 border-violet-100 text-violet-700'

  const groupHoverTextClass = role === 'admin'
    ? 'group-hover:text-teal-600'
    : role === 'super_admin'
      ? 'group-hover:text-indigo-600'
      : role === 'team_lead'
        ? 'group-hover:text-emerald-600'
        : 'group-hover:text-violet-600'

  const borderThemeClass = role === 'admin'
    ? 'border-teal-100/30'
    : role === 'super_admin'
      ? 'border-indigo-100/30'
      : role === 'team_lead'
        ? 'border-emerald-100/30'
        : 'border-violet-100/30'

  const focusRingThemeClass = role === 'admin'
    ? 'focus-visible:ring-teal-300/50 focus-visible:border-teal-200'
    : role === 'super_admin'
      ? 'focus-visible:ring-indigo-300/50 focus-visible:border-indigo-200'
      : role === 'team_lead'
        ? 'focus-visible:ring-emerald-300/50 focus-visible:border-emerald-200'
        : 'focus-visible:ring-violet-300/50 focus-visible:border-violet-200'

  const gradientThemeClass = role === 'admin'
    ? 'from-teal-500 to-emerald-500'
    : role === 'super_admin'
      ? 'from-indigo-500 to-purple-500'
      : role === 'team_lead'
        ? 'from-emerald-500 to-teal-500'
        : 'from-violet-500 to-fuchsia-500'

  const tabTextThemeClass = role === 'admin'
    ? 'text-teal-700'
    : role === 'super_admin'
      ? 'text-indigo-700'
      : role === 'team_lead'
        ? 'text-emerald-700'
        : 'text-violet-700'

  const slidingIndicatorStyle = useMemo(() => {
    if (role === 'admin') {
      return {
        background: 'linear-gradient(135deg, rgba(13,148,136,0.12) 0%, rgba(16,185,129,0.08) 100%)',
        boxShadow: '0 1px 8px rgba(13, 148, 136, 0.1), inset 0 1px 0 rgba(255,255,255,0.5)',
        border: '1px solid rgba(13, 148, 136, 0.15)',
      }
    }
    if (role === 'super_admin') {
      return {
        background: 'linear-gradient(135deg, rgba(79,70,229,0.12) 0%, rgba(139,92,246,0.08) 100%)',
        boxShadow: '0 1px 8px rgba(79, 70, 229, 0.1), inset 0 1px 0 rgba(255,255,255,0.5)',
        border: '1px solid rgba(79, 70, 229, 0.15)',
      }
    }
    if (role === 'team_lead') {
      return {
        background: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(13,148,136,0.08) 100%)',
        boxShadow: '0 1px 8px rgba(16, 185, 129, 0.1), inset 0 1px 0 rgba(255,255,255,0.5)',
        border: '1px solid rgba(16, 185, 129, 0.15)',
      }
    }
    return {
      background: 'linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(99,102,241,0.08) 100%)',
      boxShadow: '0 1px 8px rgba(139, 92, 246, 0.1), inset 0 1px 0 rgba(255,255,255,0.5)',
      border: '1px solid rgba(139, 92, 246, 0.15)',
    }
  }, [role])

  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [users, setUsers] = useState<{ id: string; full_name: string; email?: string }[]>([])
  const [loading, setLoading] = useState(true)

  const [isOpen, setIsOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [activeTab, setActiveTab] = useState('list')
  const [formData, setFormData] = useState<FormState>(initialFormState)
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([])
  const [editTaskId, setEditTaskId] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [draggedOverCol, setDraggedOverCol] = useState<string | null>(null)

  // Evaluation Dialog State for Team Lead
  const [isEvalOpen, setIsEvalOpen] = useState(false)
  const [evalTask, setEvalTask] = useState<Task | null>(null)
  const [evalPoints, setEvalPoints] = useState<string>('0')
  const [evalFeedback, setEvalFeedback] = useState<string>('')
  const [evalError, setEvalError] = useState<string | null>(null)

  // Enterprise Bulk Actions State
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])

  const getUserBalancePoints = (userId: string) => {
    const userTasks = (Array.isArray(tasks) ? tasks : []).filter(t => t.assignee?.id === userId)
    const totalAssignedPoints = userTasks.reduce((sum, t) => sum + (t.points || 0), 0)
    return Math.max(0, 60 - totalAssignedPoints)
  }

  const [searchParams] = useSearchParams()
  const urlProjectId = searchParams.get('projectId')

  const monthNamesList = useMemo(() => [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ], [])

  const currentMonthName = useMemo(() => monthNamesList[new Date().getMonth()], [monthNamesList])

  // Search & Filter state - Default month filter to Current Month
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [projectFilter, setProjectFilter] = useState(urlProjectId || 'All')
  const [leads, setLeads] = useState<{ id: string; full_name: string }[]>([])
  const [leadFilter, setLeadFilter] = useState('All')
  const [assigneeFilter, setAssigneeFilter] = useState('All')
  const [monthFilter, setMonthFilter] = useState(currentMonthName)
  const [weekFilter, setWeekFilter] = useState('All')

  // Calculate total evaluated points for candidates for the selected month and sort them
  const candidatesSortedByPoints = useMemo(() => {
    const candidatePointsMap: Record<string, number> = {}
    const safeTasksList = safeArray(tasks, 'tasks')
    safeTasksList.forEach(task => {
      if (task.assignee?.id && task.status === 'Completed') {
        if (monthFilter !== 'All') {
          const dateStr = task.updated_at || task.due_date || task.created_at
          if (!dateStr) return
          const tDate = new Date(dateStr)
          if (!tDate || isNaN(tDate.getTime())) return
          const tMonthName = monthNamesList[tDate.getMonth()]
          if (tMonthName !== monthFilter) return
        }

        const pts = task.evaluatedPoints !== null && task.evaluatedPoints !== undefined && task.evaluatedPoints > 0
          ? task.evaluatedPoints
          : (task.points || 0)
        candidatePointsMap[task.assignee.id] = (candidatePointsMap[task.assignee.id] || 0) + pts
      }
    })

    const safeUsersList = safeArray(users, 'employees')
    const mapped = safeUsersList.map(u => ({
      ...u,
      evaluatedPoints: candidatePointsMap[u.id] || 0
    }))

    return mapped.sort((a, b) => b.evaluatedPoints - a.evaluatedPoints)
  }, [users, tasks, monthFilter, monthNamesList])

  const visibleCandidates = useMemo(() => {
    const safeCandidates = safeArray(candidatesSortedByPoints)
    if (leadFilter === 'All') return safeCandidates
    return safeCandidates.filter(cand => (cand as any).manager_id === leadFilter)
  }, [candidatesSortedByPoints, leadFilter])

  const leaderboardCandidates = useMemo(() => {
    const safeCandidates = safeArray(candidatesSortedByPoints)
    if (role === 'super_admin') {
      if (leadFilter === 'All') return safeCandidates
      return safeCandidates.filter(cand => (cand as any).manager_id === leadFilter)
    }
    
    if (role === 'admin' && user) {
      return safeCandidates.filter(cand => (cand as any).manager_id === user.id)
    }

    if (role === 'team_lead' && user) {
      return safeCandidates.filter(cand => (cand as any).manager_id === user.id || (cand as any).team_lead_id === user.id)
    }

    if (role === 'employee' && profile?.manager_id) {
      return safeCandidates.filter(cand => (cand as any).manager_id === profile.manager_id)
    }

    return safeCandidates
  }, [candidatesSortedByPoints, leadFilter, role, user, profile])

  useEffect(() => {
    if (urlProjectId) {
      setProjectFilter(urlProjectId)
    }
  }, [urlProjectId])

  const urlSearch = searchParams.get('search') || ''

  useEffect(() => {
    setSearchTerm(urlSearch)
  }, [urlSearch])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-500/10 text-green-700 border-green-500/20'
      case 'In Progress': return 'bg-blue-500/10 text-blue-700 border-blue-500/20'
      case 'Review': return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20'
      case 'Blocked': return 'bg-red-500/10 text-red-700 border-red-500/20'
      default: return 'bg-muted/50 text-muted-foreground border-border/40'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'text-red-600 font-semibold'
      case 'High': return 'text-orange-600 font-medium'
      case 'Medium': return 'text-blue-600 font-medium'
      default: return 'text-slate-500'
    }
  }

  const fetchTasks = async () => {
    if (!user) return
    setLoading(true)
    try {
      const res: any = await api.get('/task?_select=id,title,description,status,priority,creator_id,creator:users!creator_id(id,full_name),due_date,assignee:users!assignee_id(id,full_name),project:projects(id,name),points,evaluated_points,evaluation_feedback,evaluated_at,created_at&_sort=-created_at')

      const data = safeArray(res, 'tasks')

      if (data && Array.isArray(data)) {
        const mapped: Task[] = data.map((t: any) => {
          const assigneeVal = t.assignee ? (Array.isArray(t.assignee) ? t.assignee[0] : t.assignee) : null
          const creatorVal = t.creator ? (Array.isArray(t.creator) ? t.creator[0] : t.creator) : null
          const projectVal = t.project ? (Array.isArray(t.project) ? t.project[0] : t.project) : null
          return {
            id: t.id,
            title: t.title,
            description: t.description,
            status: normalizeStatus(t.status),
            priority: t.priority || 'Medium',
            creator_id: t.creator_id,
            creator: creatorVal ? { id: creatorVal.id, full_name: creatorVal.full_name } : null,
            due_date: t.due_date,
            assignee: assigneeVal ? { id: assigneeVal.id, full_name: assigneeVal.full_name } : null,
            project: projectVal ? { id: projectVal.id, name: projectVal.name } : null,
            points: Number(t.points) || 0,
            evaluatedPoints: t.evaluated_points !== undefined && t.evaluated_points !== null ? Number(t.evaluated_points) : (t.evaluatedPoints ? Number(t.evaluatedPoints) : 0),
            evaluation_feedback: t.evaluation_feedback || t.evaluationFeedback || null,
            evaluated_at: t.evaluated_at || t.evaluatedAt || null,
            created_at: t.created_at
          }
        })
        setTasks(mapped)
      } else {
        setTasks([])
      }
    } catch (err: any) {
      console.error('Error fetching tasks:', err)
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

  const fetchDropdowns = async () => {
    try {
      let adminTeamIds: string[] = []
      if ((role === 'admin' || role === 'team_lead') && user) {
        let teamsData: any = []
        try { teamsData = await api.get('/teams') } catch(e) {}
        const safeTeams = safeArray(teamsData, 'teams')
        const myId = String(user.id || '').toLowerCase().trim()
        const myEmail = String(user.email || '').toLowerCase().trim()
        const myName = String(user.fullName || user.full_name || user.name || '').toLowerCase().trim()

        adminTeamIds = safeTeams
          .filter((t: any) => {
            const tLeadId = String(t.lead_id || '').toLowerCase().trim()
            const tLeadName = String(t.lead_name || t.lead || '').toLowerCase().trim()
            return (
              (tLeadId && myId && tLeadId === myId) ||
              (tLeadId && myEmail && tLeadId === myEmail) ||
              (tLeadName && myName && (tLeadName.includes(myName) || myName.includes(tLeadName))) ||
              (tLeadName && myEmail && tLeadName.includes(myEmail))
            )
          })
          .map((t: any) => t.id)
      }

      const [projData, userData]: [any, any] = await Promise.all([
        api.get('/task/projects?_select=id,name&_sort=name').catch(() => []),
        api.get('/employee').catch(() => [])
      ])
      
      const safeProj = safeArray(projData, 'projects')
      const safeRemoteUsers = safeArray(userData, 'employees')

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
      safeRemoteUsers.forEach((u: any) => userMap.set(u.id || u.email, u))
      localUsers.forEach((u: any) => {
        const idKey = u.id || u.email
        if (idKey) {
          userMap.set(idKey, { ...userMap.get(idKey), ...u })
        }
      })

      const safeUser = Array.from(userMap.values()).map((u: any) => ({
        ...u,
        full_name: u.fullName || u.full_name || u.email
      }))

      setProjects(safeProj)
      
      const leadsList = safeUser.filter((u: any) => {
        const rStr = (u.role?.name || u.roleName || u.role_name || u.role || '').toUpperCase().trim()
        return rStr.includes('ADMIN') || rStr.includes('LEAD') || rStr === 'HR' || rStr === 'MANAGER'
      })
      setLeads(leadsList)

      const tlIds = new Set<string>()
      if (user?.id) tlIds.add(String(user.id).toLowerCase().trim())
      if (user?.email) tlIds.add(String(user.email).toLowerCase().trim())

      const tlNames = new Set<string>()
      if (user?.fullName) tlNames.add(String(user.fullName).toLowerCase().trim())
      if (user?.full_name) tlNames.add(String(user.full_name).toLowerCase().trim())
      if (user?.name) tlNames.add(String(user.name).toLowerCase().trim())
      if (user?.email) {
        const prefix = user.email.split('@')[0].toLowerCase().trim()
        if (prefix && prefix.length >= 2) tlNames.add(prefix)
      }

      const candidateEmployees = safeUser.filter((u: any) => {
        const rawRole = typeof u.role === 'object' && u.role?.name 
          ? u.role.name 
          : (u.roleName || u.role_name || (typeof u.role === 'string' ? u.role : 'EMPLOYEE'))
        const rStr = String(rawRole || 'EMPLOYEE').toUpperCase().trim()
        const isExcluded = rStr.includes('ADMIN') || rStr.includes('SUPER') || rStr === 'HR' || rStr === 'MANAGER'
        if (isExcluded) return false

        const uId = String(u.id || '').toLowerCase().trim()
        const uEmail = String(u.email || '').toLowerCase().trim()
        if (tlIds.has(uId) || tlIds.has(uEmail)) return false

        return true
      })

      let employeeUsers = candidateEmployees
      if ((role === 'admin' || role === 'team_lead') && user) {
        const matched = candidateEmployees.filter((u: any) => {
          const uMgrId = String(u.manager_id || u.managerId || u.teamLeadId || u.employeeProfile?.teamLeadId || '').toLowerCase().trim()
          const uMgrEmail = String(u.manager_email || u.teamLeadEmail || u.employeeProfile?.teamLeadEmail || u.manager?.email || '').toLowerCase().trim()
          const uCreatedBy = String(u.created_by_admin || u.employeeProfile?.createdByAdmin || '').toLowerCase().trim()
          const uMgrName = String(u.manager?.full_name || u.manager?.fullName || u.manager_name || u.teamLead || u.employeeProfile?.teamLeadName || '').toLowerCase().trim()
          const uTeamId = String(u.team_id || u.teamId || u.employeeProfile?.teamId || '').toLowerCase().trim()

          const isDirectReport = Boolean(uMgrId && tlIds.has(uMgrId))
          const isManagerEmail = Boolean(uMgrEmail && tlIds.has(uMgrEmail))
          const isCreatedByMe = Boolean(uCreatedBy && tlIds.has(uCreatedBy))
          const isManagerName = Boolean(uMgrName && Array.from(tlNames).some(n => n && n.length >= 2 && (uMgrName.includes(n) || n.includes(uMgrName))))
          const isInMyTeam = Boolean(uTeamId && adminTeamIds.includes(uTeamId))

          return isDirectReport || isManagerEmail || isCreatedByMe || isManagerName || isInMyTeam
        })

        employeeUsers = matched
      }

      setUsers(employeeUsers)
    } catch (err) {
      console.error('Error fetching dropdown references:', err)
    }
  }

  useEffect(() => {
    fetchTasks()
    fetchDropdowns()
  }, [user])

  const getCandidateAssignedMonthPoints = (assigneeId: string, currentTaskId?: string, targetDateStr?: string | null) => {
    const tDate = targetDateStr ? new Date(targetDateStr) : new Date()
    const validDate = isNaN(tDate.getTime()) ? new Date() : tDate
    const targetMonthKey = validDate.toLocaleString('default', { month: 'short', year: 'numeric' })

    return tasks.reduce((sum, t) => {
      if (currentTaskId && t.id === currentTaskId) return sum
      if (t.assignee?.id !== assigneeId) return sum
      const dateStr = t.due_date || t.created_at || t.updated_at
      if (!dateStr) return sum
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return sum
      const mKey = d.toLocaleString('default', { month: 'short', year: 'numeric' })
      if (mKey !== targetMonthKey) return sum

      return sum + (Number(t.points) || 0)
    }, 0)
  }

  const getCandidateEvaluatedMonthPoints = (assigneeId: string, currentTaskId?: string, targetDateStr?: string | null) => {
    const tDate = targetDateStr ? new Date(targetDateStr) : new Date()
    const validDate = isNaN(tDate.getTime()) ? new Date() : tDate
    const targetMonthKey = validDate.toLocaleString('default', { month: 'short', year: 'numeric' })

    return tasks.reduce((sum, t) => {
      if (currentTaskId && t.id === currentTaskId) return sum
      if (t.assignee?.id !== assigneeId) return sum
      const dateStr = t.updated_at || t.due_date || t.created_at
      if (!dateStr) return sum
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return sum
      const mKey = d.toLocaleString('default', { month: 'short', year: 'numeric' })
      if (mKey !== targetMonthKey) return sum

      const pts = t.evaluatedPoints !== null && t.evaluatedPoints !== undefined && t.evaluatedPoints > 0
        ? Number(t.evaluatedPoints)
        : (t.status === 'Completed' ? (Number(t.points) || 0) : 0)
      return sum + pts
    }, 0)
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!user) return
    if (!formData.title.trim()) {
      setFormError('Task title is required.')
      return
    }
    if (!formData.projectId) {
      setFormError('You must assign this task to a project.')
      return
    }

    const assignedPointsVal = formData.points ? Number(formData.points) : 0
    if (assignedPointsVal > 0 && selectedAssigneeIds.length > 0) {
      for (const assId of selectedAssigneeIds) {
        if (!assId) continue
        const existingAssigned = getCandidateAssignedMonthPoints(assId, undefined, formData.dueDate)
        if (existingAssigned + assignedPointsVal > 60) {
          toast({
            title: 'Points Limit Exceeded',
            description: "You cannot assign above 60 points per month to a team member.",
            variant: 'destructive'
          })
          return
        }
      }
    }

    try {
      const assigneesToCreate = selectedAssigneeIds.length > 0 ? selectedAssigneeIds : [null]
      
      const dbTasks = assigneesToCreate.map(assId => ({
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        status: formData.status,
        priority: formData.priority,
        project_id: formData.projectId,
        assignee_id: assId,
        due_date: formData.dueDate || null,
        creator_id: user.id,
        points: formData.points ? Number(formData.points) : 0
      }))

      const data: any[] = []
      for (const t of dbTasks) {
        try {
          const res = await api.post('/task', {
            title: t.title,
            description: t.description,
            status: t.status,
            priority: t.priority,
            project_id: t.project_id,
            assignee_id: t.assignee_id,
            due_date: t.due_date,
            points: t.points,
          })
          data.push(res)
        } catch(e) { throw e }
      }

      if (data) {
        const resList = Array.isArray(data) ? data : [data]
        const newTasksList: Task[] = resList.map(resData => {
          const assigneeVal = resData.assignee ? (Array.isArray(resData.assignee) ? resData.assignee[0] : resData.assignee) : null
          const creatorVal = resData.creator ? (Array.isArray(resData.creator) ? resData.creator[0] : resData.creator) : null
          const projectVal = resData.project ? (Array.isArray(resData.project) ? resData.project[0] : resData.project) : null
          return {
            id: resData.id,
            title: resData.title,
            description: resData.description,
            status: resData.status,
            priority: resData.priority,
            creator_id: resData.creator_id,
            creator: creatorVal ? { id: creatorVal.id, full_name: creatorVal.full_name } : null,
            due_date: resData.due_date,
            assignee: assigneeVal ? { id: assigneeVal.id, full_name: assigneeVal.full_name } : null,
            project: projectVal ? { id: projectVal.id, name: projectVal.name } : null,
            points: resData.points || 0,
            evaluatedPoints: resData.evaluated_points || 0,
            created_at: resData.created_at
          }
        })

        setTasks(prev => [...newTasksList, ...prev])
        setIsOpen(false)
        setFormData(initialFormState)
        setSelectedAssigneeIds([])
        
        toast({
          title: newTasksList.length > 1 ? 'Tasks Created' : 'Task Created',
          description: newTasksList.length > 1 
            ? `${newTasksList.length} tasks have been added successfully.`
            : `Task "${newTasksList[0].title}" has been added successfully.`,
        })

        const notificationsToInsert = newTasksList
          .filter(t => t.assignee && t.assignee.id !== user.id)
          .map(t => ({
            user_id: t.assignee!.id,
            type: 'task_assigned',
            content: `You have been assigned a new task: "${t.title}" by ${profile?.full_name || 'a lead'}.`,
            is_read: false
          }))

        if (notificationsToInsert.length > 0) {
          try {
            await Promise.all(notificationsToInsert.map(n => api.post('/notifications', n)))
          } catch (notiErr) {
            console.warn('Could not insert task creation notifications:', notiErr)
          }
        }
      }
    } catch (err: any) {
      console.error('Error creating task:', err)
      setFormError(err.message || 'Failed to create task.')
    }
  }

  const handleEditTask = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!user || !editTaskId) return
    if (!formData.title.trim()) {
      setFormError('Task title is required.')
      return
    }
    if (!formData.projectId) {
      setFormError('You must assign this task to a project.')
      return
    }

    const assignedPointsVal = formData.points ? Number(formData.points) : 0
    const evaluatedPointsVal = (formData.evaluatedPoints !== null && formData.evaluatedPoints !== undefined && formData.evaluatedPoints !== '')
      ? Number(formData.evaluatedPoints)
      : null
    const assigneeId = formData.assigneeId || null

    // Rule 1: Cannot assign above 60 points for candidate in a month
    if (assigneeId && assignedPointsVal > 0) {
      const existingAssigned = getCandidateAssignedMonthPoints(assigneeId, editTaskId, formData.dueDate)
      if (existingAssigned + assignedPointsVal > 60) {
        toast({
          title: 'Points Limit Exceeded',
          description: "You cannot assign above 60 points total per month to a team member.",
          variant: 'destructive'
        })
        return
      }
    }

    // STRICT RULE: Cannot evaluate above assigned points for this task
    if (evaluatedPointsVal !== null && evaluatedPointsVal > assignedPointsVal) {
      setFormError(`Evaluated points (${evaluatedPointsVal}) cannot exceed assigned task points (${assignedPointsVal} pts).`)
      toast({
        title: 'Evaluation Limit Exceeded',
        description: `Evaluated points cannot be more than assigned points (${assignedPointsVal} pts).`,
        variant: 'destructive'
      })
      return
    }

    // Rule 3: Cannot evaluate above 60 points total for candidate in a month
    if (assigneeId && evaluatedPointsVal !== null && evaluatedPointsVal > 0) {
      const existingEvaluated = getCandidateEvaluatedMonthPoints(assigneeId, editTaskId, formData.dueDate)
      if (existingEvaluated + evaluatedPointsVal > 60) {
        toast({
          title: 'Monthly Points Limit Exceeded',
          description: "Evaluating this score exceeds the candidate's monthly maximum limit of 60 points.",
          variant: 'destructive'
        })
        return
      }
    }

    try {
      const dbTask = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        status: formData.status,
        priority: formData.priority,
        project_id: formData.projectId,
        assignee_id: formData.assigneeId || null,
        due_date: formData.dueDate || null,
        points: formData.points ? Number(formData.points) : 0,
        evaluatedPoints: formData.evaluatedPoints !== null && formData.evaluatedPoints !== undefined ? Number(formData.evaluatedPoints) : 0,
        evaluation_feedback: formData.evaluationFeedback || null
      }

      let data: any
      try {
        data = await api.put('/task/' + editTaskId, {
          title: dbTask.title,
          description: dbTask.description,
          status: dbTask.status,
          priority: dbTask.priority,
          project_id: dbTask.project_id,
          assignee_id: dbTask.assignee_id,
          due_date: dbTask.due_date,
          points: dbTask.points,
          evaluated_points: dbTask.evaluatedPoints,
          evaluatedPoints: dbTask.evaluatedPoints,
          evaluation_feedback: dbTask.evaluation_feedback,
        })
      } catch (error) { throw error }

      if (data) {
        const resData = (data?.task || data?.data || data) as any
        const originalTask = tasks.find(t => t.id === editTaskId)
        const assigneeVal = resData.assignee 
          ? (Array.isArray(resData.assignee) ? resData.assignee[0] : resData.assignee) 
          : (dbTask.assignee_id ? (users.find(u => u.id === dbTask.assignee_id) || originalTask?.assignee) : null)
        const projectVal = resData.project 
          ? (Array.isArray(resData.project) ? resData.project[0] : resData.project) 
          : (dbTask.project_id ? (projects.find(p => p.id === dbTask.project_id) || originalTask?.project) : null)
        
        const updated: Task = {
          id: resData.id || editTaskId,
          title: resData.title || dbTask.title,
          description: resData.description || dbTask.description,
          status: resData.status || dbTask.status,
          priority: resData.priority || dbTask.priority,
          creator_id: resData.creator_id || originalTask?.creator_id || user.id,
          creator: originalTask?.creator || null,
          due_date: resData.due_date || dbTask.due_date,
          assignee: assigneeVal ? { id: assigneeVal.id, full_name: assigneeVal.full_name || assigneeVal.fullName } : null,
          project: projectVal ? { id: projectVal.id, name: projectVal.name } : null,
          points: resData.points || dbTask.points || 0,
          evaluatedPoints: resData.evaluated_points !== undefined ? resData.evaluated_points : (dbTask.evaluatedPoints || 0),
          evaluation_feedback: resData.evaluation_feedback || dbTask.evaluation_feedback,
          evaluated_at: resData.evaluated_at || originalTask?.evaluated_at,
          created_at: originalTask?.created_at
        }

        setTasks(prev => prev.map(t => t.id === editTaskId ? updated : t))
        setIsEditOpen(false)
        setEditTaskId(null)
        setFormData(initialFormState)
        toast({
          title: 'Task Updated',
          description: `Task "${updated.title}" has been updated successfully.`,
        })

        if (updated.assignee && updated.assignee.id !== user.id && (!originalTask?.assignee || originalTask.assignee.id !== updated.assignee.id)) {
          try {
            await api.post('/notifications', {
              user_id: updated.assignee.id,
              type: 'task_assigned',
              content: `You have been assigned a task: "${updated.title}" by ${profile?.full_name || 'a lead'}.`,
              is_read: false
            })
          } catch (notiErr) {}
        }
      }
    } catch (err: any) {
      console.error('Error updating task:', err)
      setFormError(err.message || 'Failed to update task.')
    }
  }

  // Open Dedicated Evaluation Modal for Team Lead
  const openEvalDialog = (task: Task) => {
    setEvalTask(task)
    setEvalPoints(String(task.evaluatedPoints || task.points || 0))
    setEvalFeedback(task.evaluation_feedback || '')
    setEvalError(null)
    setIsEvalOpen(true)
  }

  // Handle Team Lead Evaluation Submit
  const handleEvaluateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    setEvalError(null)
    if (!evalTask) return

    const assignedPts = Number(evalTask.points) || 0
    const evalVal = Number(evalPoints)

    if (isNaN(evalVal) || evalVal < 0) {
      setEvalError('Evaluation points must be a non-negative number.')
      return
    }

    // STRICT VALIDATION RULE: Evaluated points must not be more than assigned points
    if (evalVal > assignedPts) {
      setEvalError(`Evaluated points (${evalVal}) cannot exceed assigned task points (${assignedPts} pts).`)
      toast({
        title: 'Evaluation Limit Exceeded',
        description: `Evaluation points cannot be higher than assigned points (${assignedPts} pts).`,
        variant: 'destructive'
      })
      return
    }

    // Candidate monthly total limit check (60 max)
    if (evalTask.assignee?.id && evalVal > 0) {
      const existingEvaluated = getCandidateEvaluatedMonthPoints(evalTask.assignee.id, evalTask.id, evalTask.due_date)
      if (existingEvaluated + evalVal > 60) {
        setEvalError(`Evaluating ${evalVal} pts exceeds candidate's monthly limit of 60 points (currently ${existingEvaluated} evaluated).`)
        toast({
          title: 'Monthly Points Exceeded',
          description: 'Member evaluated points cannot exceed 60 points per month.',
          variant: 'destructive'
        })
        return
      }
    }

    try {
      const newStatus = evalVal > 0 && evalTask.status !== 'Completed' ? 'Completed' : evalTask.status

      await api.put('/task/' + evalTask.id, {
        evaluated_points: evalVal,
        evaluatedPoints: evalVal,
        evaluation_feedback: evalFeedback.trim(),
        evaluationFeedback: evalFeedback.trim(),
        status: newStatus
      })

      const updatedTask: Task = {
        ...evalTask,
        evaluatedPoints: evalVal,
        evaluation_feedback: evalFeedback.trim(),
        evaluated_at: new Date().toISOString(),
        status: newStatus
      }

      setTasks(prev => prev.map(t => t.id === evalTask.id ? updatedTask : t))
      setIsEvalOpen(false)
      setEvalTask(null)

      toast({
        title: 'Task Evaluation Submitted',
        description: `Task "${evalTask.title}" awarded ${evalVal} / ${assignedPts} points.`,
      })

      // Send notification to assigned team member
      if (evalTask.assignee && evalTask.assignee.id !== user?.id) {
        try {
          await api.post('/notifications', {
            user_id: evalTask.assignee.id,
            type: 'task_evaluated',
            content: `Your task "${evalTask.title}" was evaluated by ${profile?.full_name || 'Team Lead'}: ${evalVal}/${assignedPts} Points awarded.${evalFeedback ? ` Feedback: "${evalFeedback}"` : ''}`,
            is_read: false
          })
        } catch (e) {}
      }

      // Log activity
      try {
        await api.post('/activity_logs', {
          user_id: user?.id,
          action: 'Evaluated Task',
          entity_type: 'Project',
          entity_id: evalTask.project?.id || null,
          details: `evaluated task "${evalTask.title}" for ${evalTask.assignee?.full_name || 'assignee'} with ${evalVal}/${assignedPts} points`
        })
      } catch (e) {}

    } catch (err: any) {
      console.error('Error evaluating task:', err)
      setEvalError(err.message || 'Failed to submit evaluation.')
    }
  }

  const updateStatus = async (taskId: string, newStatus: string) => {
    if (!user) return
    try {
      let data: any
      try {
        data = await api.put('/task/' + taskId, { status: newStatus })
      } catch (error) { throw error }

      if (data) {
        const resData = (data?.task || data?.data || data) as any
        const originalTask = tasks.find(t => t.id === taskId)
        const assigneeVal = resData.assignee ? (Array.isArray(resData.assignee) ? resData.assignee[0] : resData.assignee) : originalTask?.assignee
        const projectVal = resData.project ? (Array.isArray(resData.project) ? resData.project[0] : resData.project) : originalTask?.project
        const updated: Task = {
          id: resData.id || taskId,
          title: resData.title || originalTask?.title || 'Task',
          description: resData.description || originalTask?.description,
          status: resData.status || newStatus,
          priority: resData.priority || originalTask?.priority || 'Medium',
          creator_id: resData.creator_id || originalTask?.creator_id || user.id,
          due_date: resData.due_date || originalTask?.due_date || null,
          assignee: assigneeVal ? { id: assigneeVal.id, full_name: assigneeVal.full_name || assigneeVal.fullName } : null,
          project: projectVal ? { id: projectVal.id, name: projectVal.name } : null,
          points: resData.points || originalTask?.points || 0,
          evaluatedPoints: resData.evaluated_points || originalTask?.evaluatedPoints || 0,
          evaluation_feedback: resData.evaluation_feedback || originalTask?.evaluation_feedback,
          evaluated_at: originalTask?.evaluated_at,
          created_at: originalTask?.created_at
        }
        setTasks(prev => prev.map(t => t.id === taskId ? updated : t))
        toast({
          title: 'Status Updated',
          description: `Task status is now "${newStatus}".`,
        })
      }
    } catch (err: any) {
      console.error('Error updating status:', err)
      toast({
        title: 'Error updating status',
        description: err.message,
        variant: 'destructive',
      })
    }
  }

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return

    try {
      await api.delete('/task/' + id)
      setTasks(prev => prev.filter(t => t.id !== id))
      setSelectedTaskIds(prev => prev.filter(tId => tId !== id))
      toast({
        title: 'Task Deleted',
        description: 'Task has been permanently removed.',
      })
    } catch (err: any) {
      console.error('Error deleting task:', err)
      toast({
        title: 'Error deleting task',
        description: err.message,
        variant: 'destructive',
      })
    }
  }

  const openEditDialog = (task: Task) => {
    setEditTaskId(task.id)
    setFormData({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      assigneeId: task.assignee?.id || '',
      projectId: task.project?.id || '',
      dueDate: task.due_date ? task.due_date.split('T')[0] : '',
      points: task.points || 0,
      evaluatedPoints: task.evaluatedPoints !== undefined ? task.evaluatedPoints : 0,
      evaluationFeedback: task.evaluation_feedback || ''
    })
    setFormError(null)
    setIsEditOpen(true)
  }

  const canCreate = role !== 'super_admin' && hasPermission(Permission.CREATE_TASKS)
  const canDelete = role !== 'super_admin' && hasPermission(Permission.DELETE_TASKS)
  const canEdit = role !== 'super_admin' && hasPermission(Permission.CREATE_TASKS)

  // Kanban Columns
  const columns = ['Todo', 'In Progress', 'Review', 'Completed', 'Blocked']

  // Filter & Search Logic
  const filteredTasks = tasks.filter(task => {
    if (role === 'team_lead' && user) {
      const myId = String(user.id || '').toLowerCase().trim()
      const myEmail = String(user.email || '').toLowerCase().trim()
      
      const creatorId = String(task.creator_id || '').toLowerCase().trim()
      const assigneeId = String(task.assignee?.id || '').toLowerCase().trim()
      const assigneeEmail = String((task.assignee as any)?.email || '').toLowerCase().trim()

      const isCreator = creatorId === myId || creatorId === myEmail
      const isAssigneeSelf = assigneeId === myId || assigneeEmail === myEmail
      const isAssigneeUnderLead = users.some(u => {
        const uId = String(u.id || '').toLowerCase().trim()
        const uEmail = String(u.email || '').toLowerCase().trim()
        return (assigneeId && (uId === assigneeId || uEmail === assigneeId)) ||
               (assigneeEmail && (uId === assigneeEmail || uEmail === assigneeEmail))
      })

      if (!isCreator && !isAssigneeSelf && !isAssigneeUnderLead) {
        return false
      }
    }

    if (role === 'admin' && user) {
      const myId = String(user.id || '').toLowerCase().trim()
      const isCreator = String(task.creator_id || '').toLowerCase().trim() === myId
      const isAssigneeUnderAdmin = users.some(u => String(u.id || '').toLowerCase().trim() === String(task.assignee?.id || '').toLowerCase().trim())
      const isMyProject = projects.some(p => String(p.id || '').toLowerCase().trim() === String(task.project?.id || '').toLowerCase().trim())

      if (!isCreator && !isAssigneeUnderAdmin && !isMyProject) {
        return false
      }
    }

    if (role === 'employee' && user) {
      const myId = String(user.id || '').toLowerCase().trim()
      const isAssignee = String(task.assignee?.id || '').toLowerCase().trim() === myId
      const isCreator = String(task.creator_id || '').toLowerCase().trim() === myId
      if (!isAssignee && !isCreator) {
        return false
      }
    }

    const matchesSearch =
      String(task.title || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      String(task.description || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      String(task.project?.name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      String((task.assignee as any)?.full_name || (task.assignee as any)?.fullName || (task.assignee as any)?.name || '').toLowerCase().includes((searchTerm || '').toLowerCase())

    const matchesStatus = statusFilter === 'All' || task.status === statusFilter
    const matchesPriority = priorityFilter === 'All' || task.priority === priorityFilter

    let matchesMonth = true
    if (monthFilter !== 'All') {
      const tDate = task.due_date ? new Date(task.due_date) : (task.created_at ? new Date(task.created_at) : null)
      if (!tDate || isNaN(tDate.getTime())) {
        matchesMonth = false
      } else {
        const monthNames = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ]
        matchesMonth = monthNames[tDate.getMonth()] === monthFilter
      }
    }

    let matchesWeek = true
    if (weekFilter !== 'All') {
      const tDate = task.due_date ? new Date(task.due_date) : (task.created_at ? new Date(task.created_at) : null)
      if (!tDate || isNaN(tDate.getTime())) {
        matchesWeek = false
      } else {
        const day = tDate.getDate()
        if (weekFilter === 'Week 1') {
          matchesWeek = day >= 1 && day <= 7
        } else if (weekFilter === 'Week 2') {
          matchesWeek = day >= 8 && day <= 14
        } else if (weekFilter === 'Week 3') {
          matchesWeek = day >= 15 && day <= 21
        } else if (weekFilter === 'Week 4') {
          matchesWeek = day >= 22 && day <= 28
        } else if (weekFilter === 'Week 5') {
          matchesWeek = day >= 29
        }
      }
    }

    const matchesProject = projectFilter === 'All' || task.project?.id === projectFilter

    let matchesLead = true
    if (leadFilter !== 'All') {
      const assigneeUser = users.find(u => u.id === task.assignee?.id)
      const isDirectReport = assigneeUser && (assigneeUser as any).manager_id === leadFilter
      const isCreatorLead = task.creator_id === leadFilter
      matchesLead = isDirectReport || isCreatorLead
    }

    const matchesAssignee = assigneeFilter === 'All' || task.assignee?.id === assigneeFilter

    return matchesSearch && matchesStatus && matchesPriority && matchesProject && matchesLead && matchesAssignee && matchesMonth && matchesWeek
  })

  // Enterprise KPI Calculated Metrics
  const kpiMetrics = useMemo(() => {
    const total = filteredTasks.length
    const completed = filteredTasks.filter(t => t.status === 'Completed').length
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0
    const totalAssignedPts = filteredTasks.reduce((sum, t) => sum + (t.points || 0), 0)
    const totalEvaluatedPts = filteredTasks.reduce((sum, t) => sum + (t.evaluatedPoints || 0), 0)
    const evalEfficiency = totalAssignedPts > 0 ? Math.round((totalEvaluatedPts / totalAssignedPts) * 100) : 0
    const overdueOrCritical = filteredTasks.filter(t => {
      if (t.priority === 'Critical') return true
      if (t.due_date && t.status !== 'Completed') {
        return new Date(t.due_date) < new Date()
      }
      return false
    }).length

    return {
      total,
      completed,
      completionRate,
      totalAssignedPts,
      totalEvaluatedPts,
      evalEfficiency,
      overdueOrCritical
    }
  }, [filteredTasks])

  // Enterprise CSV Export Handler
  const handleExportCSV = () => {
    const tasksToExport = selectedTaskIds.length > 0
      ? tasks.filter(t => selectedTaskIds.includes(t.id))
      : filteredTasks

    if (tasksToExport.length === 0) {
      toast({ title: 'No tasks available to export', variant: 'destructive' })
      return
    }

    const headers = ['Task ID', 'Title', 'Project', 'Assignee', 'Status', 'Priority', 'Assigned Points', 'Evaluated Points', 'Evaluation Feedback', 'Due Date', 'Created At']
    const rows = tasksToExport.map(t => [
      `"${t.id}"`,
      `"${(t.title || '').replace(/"/g, '""')}"`,
      `"${(t.project?.name || '').replace(/"/g, '""')}"`,
      `"${(t.assignee?.full_name || 'Unassigned').replace(/"/g, '""')}"`,
      `"${t.status}"`,
      `"${t.priority}"`,
      t.points || 0,
      t.evaluatedPoints || 0,
      `"${(t.evaluation_feedback || '').replace(/"/g, '""')}"`,
      `"${t.due_date ? t.due_date.split('T')[0] : ''}"`,
      `"${t.created_at ? t.created_at.split('T')[0] : ''}"`
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Task_Evaluation_Report_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: 'Enterprise Audit CSV Exported',
      description: `Downloaded report for ${tasksToExport.length} task deliverable(s).`,
    })
  }

  // Bulk Select Toggle Handlers
  const isAllSelected = filteredTasks.length > 0 && filteredTasks.every(t => selectedTaskIds.includes(t.id))

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedTaskIds([])
    } else {
      setSelectedTaskIds(filteredTasks.map(t => t.id))
    }
  }

  const handleToggleSelectTask = (id: string) => {
    setSelectedTaskIds(prev => 
      prev.includes(id) ? prev.filter(tId => tId !== id) : [...prev, id]
    )
  }

  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedTaskIds.length === 0) return
    try {
      await Promise.all(selectedTaskIds.map(id => api.put('/task/' + id, { status: newStatus })))
      setTasks(prev => prev.map(t => selectedTaskIds.includes(t.id) ? { ...t, status: newStatus } : t))
      toast({
        title: 'Bulk Status Updated',
        description: `Updated status for ${selectedTaskIds.length} tasks to "${newStatus}".`,
      })
      setSelectedTaskIds([])
    } catch (e: any) {
      toast({ title: 'Bulk Update Error', description: e.message, variant: 'destructive' })
    }
  }

  const handleBulkDelete = async () => {
    if (selectedTaskIds.length === 0) return
    if (!confirm(`Are you sure you want to delete ${selectedTaskIds.length} selected tasks?`)) return
    try {
      await Promise.all(selectedTaskIds.map(id => api.delete('/task/' + id)))
      setTasks(prev => prev.filter(t => !selectedTaskIds.includes(t.id)))
      toast({
        title: 'Bulk Tasks Deleted',
        description: `Successfully deleted ${selectedTaskIds.length} tasks.`,
      })
      setSelectedTaskIds([])
    } catch (e: any) {
      toast({ title: 'Bulk Delete Error', description: e.message, variant: 'destructive' })
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'No due date'
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  // Tab indicator animation refs
  const tabListRef = useRef<HTMLDivElement>(null)
  const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({})

  useEffect(() => {
    if (!tabListRef.current) return
    const activeButton = tabListRef.current.querySelector('[data-active="true"]') as HTMLElement
    if (activeButton) {
      setIndicatorStyle({
        width: activeButton.offsetWidth,
        transform: `translateX(${activeButton.offsetLeft}px)`,
      })
    }
  }, [activeTab])

  return (
    <div className="space-y-5 fade-in duration-500 text-foreground">
      {/* ── Premium Header & Actions ─────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span className="bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">Task & Evaluation</span> Management
            <Badge variant="outline" className="text-[10px] uppercase tracking-wider bg-violet-50 text-violet-700 border-violet-200">
              Enterprise HCM
            </Badge>
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">Assign, evaluate, track story points, and monitor team performance deliverables.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold h-9 shadow-sm"
          >
            <Download className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
            Export CSV
          </Button>

          {canCreate && (
            <Dialog open={isOpen} onOpenChange={(open) => {
              setIsOpen(open)
              if (!open) {
                setFormData(initialFormState)
                setSelectedAssigneeIds([])
                setFormError(null)
              }
            }}>
              <DialogTrigger asChild>
                <Button className={`text-white shadow-md transition-all h-9 ${buttonBgClass}`}>
                  <Plus className="mr-1.5 h-4 w-4" />
                  New Task
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white border-slate-200 text-slate-800 text-left sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-slate-900">Create Task Deliverable</DialogTitle>
                  <DialogDescription className="text-slate-500">
                    Define work item, assign sprint points, and delegate to team members.
                  </DialogDescription>
                </DialogHeader>

                {formError && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded p-3 my-2">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <form onSubmit={handleCreateTask} className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-slate-700 font-semibold text-xs">Task Title *</Label>
                    <Input
                      id="title"
                      required
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Implement authentication middleware"
                      className="bg-slate-50 border-slate-200 focus:bg-white text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-slate-700 font-semibold text-xs">Description</Label>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus:bg-white"
                      placeholder="Detailed acceptance criteria or technical details..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="project" className="text-slate-700 font-semibold text-xs">Associated Project *</Label>
                      <Select
                        value={formData.projectId}
                        onValueChange={val => setFormData({ ...formData, projectId: val })}
                      >
                        <SelectTrigger className="bg-slate-50 border-slate-200">
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-slate-200 text-slate-800">
                          {projects.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="assignee" className="text-slate-700 font-semibold text-xs">Assigned Team Member(s)</Label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="outline" 
                            className="w-full justify-between bg-slate-50 border-slate-200 text-slate-850 font-normal hover:bg-slate-50"
                          >
                            {selectedAssigneeIds.length === 0 ? (
                              <span className="text-slate-500 text-xs">Unassigned</span>
                            ) : selectedAssigneeIds.length === 1 ? (
                              <span className="text-xs">{users.find(u => u.id === selectedAssigneeIds[0])?.full_name}</span>
                            ) : (
                              <span className="text-xs font-semibold text-teal-600">{selectedAssigneeIds.length} members selected</span>
                            )}
                            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[300px] bg-white border border-slate-200 max-h-[300px] overflow-y-auto z-50 p-2 space-y-1">
                          <DropdownMenuLabel className="text-xs text-slate-400 font-bold uppercase tracking-wider px-2 py-1">Select Team Members</DropdownMenuLabel>
                          <div className="border-t border-slate-100 my-1" />
                          {users.map(u => {
                            const isSelected = selectedAssigneeIds.includes(u.id)
                            return (
                              <DropdownMenuCheckboxItem
                                key={u.id}
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedAssigneeIds(prev => [...prev, u.id])
                                  } else {
                                    setSelectedAssigneeIds(prev => prev.filter(id => id !== u.id))
                                  }
                                }}
                                className="text-slate-800 focus:bg-slate-50 cursor-pointer rounded-lg py-2 pl-9 text-xs"
                              >
                                {u.full_name} ({getUserBalancePoints(u.id)} pts balance)
                              </DropdownMenuCheckboxItem>
                            )
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status" className="text-slate-700 font-semibold text-xs">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={val => setFormData({ ...formData, status: val })}
                      >
                        <SelectTrigger className="bg-slate-50 border-slate-200">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-slate-200 text-slate-800">
                          <SelectItem value="Todo">Todo</SelectItem>
                          <SelectItem value="In Progress">In Progress</SelectItem>
                          <SelectItem value="Review">Review</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                          <SelectItem value="Blocked">Blocked</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="priority" className="text-slate-700 font-semibold text-xs">Priority</Label>
                      <Select
                        value={formData.priority}
                        onValueChange={val => setFormData({ ...formData, priority: val })}
                      >
                        <SelectTrigger className="bg-slate-50 border-slate-200">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-slate-200 text-slate-800">
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 col-span-2 md:col-span-1">
                      <Label htmlFor="dueDate" className="text-slate-700 font-semibold text-xs">Due Date</Label>
                      <Input
                        id="dueDate"
                        type="date"
                        value={formData.dueDate}
                        onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                        className="bg-slate-50 border-slate-200 focus:bg-white text-slate-800 text-xs"
                      />
                    </div>

                    <div className="space-y-2 col-span-2 md:col-span-1">
                      <Label htmlFor="points" className="text-slate-700 font-semibold text-xs">Assigned Points (Max Evaluatable) *</Label>
                      <Input
                        id="points"
                        type="text"
                        value={formData.points ?? ''}
                        onChange={e => {
                          const val = e.target.value
                          if (val === '' || /^[0-9]*\.?[0-9]*$/.test(val)) {
                            setFormData({ ...formData, points: val })
                          }
                        }}
                        className="bg-slate-50 border-slate-200 focus:bg-white text-xs text-slate-800 h-9"
                        placeholder="e.g. 5"
                      />
                    </div>
                  </div>

                  <DialogFooter className="pt-4 border-t border-slate-100 mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsOpen(false)}
                      className="border-slate-200 text-slate-600"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className={`text-white font-medium ${buttonBgClass}`}
                    >
                      Create Task
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* ── Enterprise KPI Summary Strip ─────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Active Deliverables</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900">{kpiMetrics.total}</span>
              <span className="text-xs font-semibold text-emerald-600">{kpiMetrics.completed} Done</span>
            </div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-violet-50 text-violet-600 border border-violet-100 flex items-center justify-center">
            <CheckSquare className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Completion Rate</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900">{kpiMetrics.completionRate}%</span>
            </div>
            <div className="w-28 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${kpiMetrics.completionRate}%` }} />
            </div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Point Evaluation Efficiency</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-amber-600">{kpiMetrics.totalEvaluatedPts}</span>
              <span className="text-xs text-slate-400 font-semibold">/ {kpiMetrics.totalAssignedPts} Pts</span>
            </div>
            <span className="text-[10px] font-bold text-slate-500 mt-1 block">{kpiMetrics.evalEfficiency}% points awarded</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
            <Award className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Risk & Overdue Counter</span>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-extrabold ${kpiMetrics.overdueOrCritical > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                {kpiMetrics.overdueOrCritical}
              </span>
              <span className="text-xs text-slate-400">High priority / Overdue</span>
            </div>
          </div>
          <div className={`h-10 w-10 rounded-xl border flex items-center justify-center ${kpiMetrics.overdueOrCritical > 0 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
            <AlertCircle className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* ── Team Lead Evaluation Modal ─────────────────────── */}
      <Dialog open={isEvalOpen} onOpenChange={(open) => {
        setIsEvalOpen(open)
        if (!open) {
          setEvalTask(null)
          setEvalError(null)
        }
      }}>
        {evalTask && (
          <DialogContent className="bg-white border-slate-200 text-slate-800 text-left sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-bold uppercase tracking-wider">
                  Team Lead Evaluation
                </Badge>
                <Badge variant="outline" className={`${getStatusColor(evalTask.status)} text-[10px] font-bold uppercase tracking-wider`}>
                  {evalTask.status}
                </Badge>
              </div>
              <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-500" />
                Evaluate Deliverable & Award Points
              </DialogTitle>
              <DialogDescription className="text-slate-500 text-xs">
                Grade team member work performance. Evaluated points cannot exceed assigned points.
              </DialogDescription>
            </DialogHeader>

            {evalError && (
              <div className="flex items-center gap-2 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl p-3 my-2">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{evalError}</span>
              </div>
            )}

            <div className="space-y-4 pt-2">
              {/* Task Summary Banner */}
              <div className="bg-slate-50 border border-slate-200/70 p-3.5 rounded-xl space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{evalTask.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Project: <span className="font-semibold text-slate-700">{evalTask.project?.name || 'Unassigned'}</span></p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned Points</span>
                    <span className="text-sm font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md inline-block mt-0.5">
                      {evalTask.points} Story Points
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-200/50 text-xs text-slate-600">
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center text-[10px] font-bold ${avatarBgClass}`}>
                    {evalTask.assignee ? evalTask.assignee.full_name.charAt(0) : '?'}
                  </div>
                  <span>Assignee: <strong className="text-slate-800">{evalTask.assignee?.full_name || 'Unassigned'}</strong></span>
                </div>
              </div>

              {/* Evaluation Points Input Box */}
              <form onSubmit={handleEvaluateTask} className="space-y-4">
                <div className="space-y-2 bg-amber-50/40 border border-amber-200/60 p-4 rounded-xl">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="evalPointsInput" className="text-slate-900 font-bold text-xs flex items-center gap-1.5">
                      <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                      Evaluation Points Input Box *
                    </Label>
                    <span className="text-[11px] font-bold text-amber-800">
                      Max Allowed: {evalTask.points} Pts
                    </span>
                  </div>

                  <Input
                    id="evalPointsInput"
                    type="text"
                    required
                    value={evalPoints}
                    onChange={e => {
                      const val = e.target.value
                      if (val === '' || /^[0-9]*\.?[0-9]*$/.test(val)) {
                        setEvalPoints(val)
                        if (Number(val) > (evalTask.points || 0)) {
                          setEvalError(`Evaluated points (${val}) cannot exceed assigned points (${evalTask.points} pts).`)
                        } else {
                          setEvalError(null)
                        }
                      }
                    }}
                    placeholder={`Enter evaluated points (0 - ${evalTask.points})`}
                    className={`bg-white border-amber-300 focus:ring-amber-500 text-sm font-bold text-slate-900 h-10 ${
                      Number(evalPoints) > (evalTask.points || 0) ? 'border-red-500 focus:ring-red-500 text-red-600' : ''
                    }`}
                  />

                  {/* Real-time Validation Message */}
                  {Number(evalPoints) > (evalTask.points || 0) ? (
                    <p className="text-xs font-bold text-red-600 flex items-center gap-1 mt-1">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      Evaluation points cannot be more than the assigned points ({evalTask.points} pts) of this task.
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-500 mt-1">
                      Enter points awarded for task completion (cannot exceed assigned story points of {evalTask.points}).
                    </p>
                  )}

                  {/* Quick Preset Buttons */}
                  <div className="pt-2 flex flex-wrap gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase w-full mb-0.5 block">Quick Preset Grading:</span>
                    {[0, 0.25, 0.5, 0.75, 1.0].map(ratio => {
                      const pts = Math.round((evalTask.points * ratio) * 2) / 2
                      const isSelected = Number(evalPoints) === pts
                      return (
                        <button
                          type="button"
                          key={ratio}
                          onClick={() => {
                            setEvalPoints(String(pts))
                            setEvalError(null)
                          }}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                            isSelected
                              ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {pts} Pts ({ratio * 100}%)
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Feedback Box */}
                <div className="space-y-2">
                  <Label htmlFor="evalFeedback" className="text-slate-700 font-semibold text-xs">Lead Evaluation Feedback & Notes</Label>
                  <textarea
                    id="evalFeedback"
                    value={evalFeedback}
                    onChange={e => setEvalFeedback(e.target.value)}
                    className="flex min-h-[70px] w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs shadow-sm placeholder:text-slate-400 focus:outline-none focus:bg-white"
                    placeholder="Provide constructive feedback or assessment notes for the team member..."
                  />
                </div>

                <DialogFooter className="pt-4 border-t border-slate-100 mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEvalOpen(false)}
                    className="border-slate-200 text-slate-600"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={Number(evalPoints) > (evalTask.points || 0) || Number(evalPoints) < 0}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-md"
                  >
                    <Award className="mr-1.5 h-4 w-4" />
                    Submit Evaluation
                  </Button>
                </DialogFooter>
              </form>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(open) => {
        setIsEditOpen(open)
        if (!open) {
          setEditTaskId(null)
          setFormData(initialFormState)
          setFormError(null)
        }
      }}>
        <DialogContent className="bg-white border-slate-200 text-slate-800 text-left sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">Edit Task Deliverable</DialogTitle>
            <DialogDescription className="text-slate-500">
              Update task attributes, assignment, status, and lead evaluation points.
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="flex items-center gap-2 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded p-3 my-2">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleEditTask} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="edit-title" className="text-slate-700 font-semibold text-xs">Task Title *</Label>
              <Input
                id="edit-title"
                required
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="bg-slate-50 border-slate-200 focus:bg-white text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description" className="text-slate-700 font-semibold text-xs">Description</Label>
              <textarea
                id="edit-description"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-project" className="text-slate-700 font-semibold text-xs">Associated Project *</Label>
                <Select
                  value={formData.projectId}
                  onValueChange={val => setFormData({ ...formData, projectId: val })}
                >
                  <SelectTrigger className="bg-slate-50 border-slate-200">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-800">
                    {safeArray(projects).map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-assignee" className="text-slate-700 font-semibold text-xs">Assigned Team Member</Label>
                <Select
                  value={formData.assigneeId}
                  onValueChange={val => setFormData({ ...formData, assigneeId: val })}
                >
                  <SelectTrigger className="bg-slate-50 border-slate-200">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-800">
                    {safeArray(users).map(u => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.full_name} ({getUserBalancePoints(u.id)} pts balance)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-status" className="text-slate-700 font-semibold text-xs">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={val => setFormData({ ...formData, status: val })}
                >
                  <SelectTrigger className="bg-slate-50 border-slate-200">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-800">
                    <SelectItem value="Todo">Todo</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Review">Review</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-priority" className="text-slate-700 font-semibold text-xs">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={val => setFormData({ ...formData, priority: val })}
                >
                  <SelectTrigger className="bg-slate-50 border-slate-200">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-800">
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 col-span-2 md:col-span-1">
                <Label htmlFor="edit-dueDate" className="text-slate-700 font-semibold text-xs">Due Date</Label>
                <Input
                  id="edit-dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                  className="bg-slate-50 border-slate-200 focus:bg-white text-slate-800 text-xs"
                />
              </div>

              <div className="space-y-2 col-span-2 md:col-span-1">
                <Label htmlFor="edit-points" className="text-slate-700 font-semibold text-xs">Assigned Points</Label>
                <Input
                  id="edit-points"
                  type="text"
                  value={formData.points ?? ''}
                  onChange={e => {
                    const val = e.target.value
                    if (val === '' || /^[0-9]*\.?[0-9]*$/.test(val)) {
                      setFormData({ ...formData, points: val })
                    }
                  }}
                  className="bg-slate-50 border-slate-200 focus:bg-white text-xs text-slate-800 h-9"
                  placeholder="e.g. 5"
                />
              </div>

              {/* Evaluation Input Box for Team Lead / Admin / Evaluators */}
              {isEvaluator && (
                <div className="space-y-2 col-span-2 bg-amber-50/50 border border-amber-200/80 p-3 rounded-xl">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="edit-evaluatedPoints" className="text-amber-800 font-bold text-xs flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                      Evaluated Points Input Box (Team Lead)
                    </Label>
                    <span className="text-[10px] font-bold text-amber-700">
                      Max: {formData.points || 0} Pts
                    </span>
                  </div>
                  <Input
                    id="edit-evaluatedPoints"
                    type="text"
                    value={formData.evaluatedPoints ?? ''}
                    onChange={e => {
                      const val = e.target.value
                      if (val === '' || /^[0-9]*\.?[0-9]*$/.test(val)) {
                        setFormData({ ...formData, evaluatedPoints: val })
                      }
                    }}
                    className={`bg-amber-50/30 border-amber-200 focus:ring-amber-500 text-xs text-slate-800 h-9 focus:bg-white font-bold ${
                      Number(formData.evaluatedPoints) > Number(formData.points) ? 'border-red-500 text-red-600' : ''
                    }`}
                    placeholder={`Enter evaluation score (0 - ${formData.points || 0})`}
                  />
                  {Number(formData.evaluatedPoints) > Number(formData.points) && (
                    <p className="text-[11px] font-bold text-red-600 flex items-center gap-1">
                      <ShieldAlert className="h-3 w-3" />
                      Evaluation points cannot be more than assigned points ({formData.points || 0} pts).
                    </p>
                  )}
                </div>
              )}
            </div>

            <DialogFooter className="pt-4 border-t border-slate-100 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                className="border-slate-200 text-slate-600"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={Number(formData.evaluatedPoints) > Number(formData.points)}
                className={`text-white font-medium ${buttonBgClass}`}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Task Details Modal */}
      <Dialog open={selectedTask !== null} onOpenChange={(open) => {
        if (!open) setSelectedTask(null)
      }}>
        {selectedTask && (
          <DialogContent className="bg-white border-slate-200 text-slate-805 text-left sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className={`text-[10px] font-semibold uppercase tracking-wider ${getStatusColor(selectedTask.status)}`}>
                  {selectedTask.status}
                </Badge>
                <Badge variant="outline" className={`text-[10px] font-semibold uppercase tracking-wider ${
                  selectedTask.priority === 'Critical' ? 'bg-red-50 text-red-700 border-red-200/60' :
                  selectedTask.priority === 'High' ? 'bg-orange-50 text-orange-700 border-orange-200/60' :
                  selectedTask.priority === 'Medium' ? 'bg-blue-50 text-blue-700 border-blue-200/60' :
                  'bg-slate-50 text-slate-700 border-slate-200/60'
                }`}>
                  {selectedTask.priority} Priority
                </Badge>
              </div>
              <DialogTitle className="text-xl font-bold text-slate-900">{selectedTask.title}</DialogTitle>
              <DialogDescription className="text-slate-500 mt-1">
                Detailed parameters, evaluation score, and assignment context.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 pt-4">
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest text-left">Task Description</h4>
                <p className="text-slate-655 text-sm leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200/50 text-left whitespace-pre-wrap">
                  {selectedTask.description || 'No description provided.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-200/40 text-sm text-left">
                <div>
                  <span className="text-slate-400 text-xs font-semibold block mb-1">Associated Project</span>
                  <span className="font-bold text-slate-850">{selectedTask.project?.name || 'Unassigned'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs font-semibold block mb-1">Assignee</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center text-[9px] font-bold ${avatarBgClass}`}>
                      {selectedTask.assignee ? selectedTask.assignee.full_name.charAt(0) : '?'}
                    </div>
                    <span className="font-bold text-slate-800">{selectedTask.assignee?.full_name || 'Unassigned'}</span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-xs font-semibold block mb-1">Task Creator</span>
                  <span className="font-bold text-slate-800">{selectedTask.creator?.full_name || 'System / Lead'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs font-semibold block mb-1">Assigned Points</span>
                  {selectedTask.points ? (
                    <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-xs inline-block mt-0.5">
                      {selectedTask.points} Story Points
                    </span>
                  ) : (
                    <span className="font-medium text-slate-400 italic">No points assigned</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-400 text-xs font-semibold block mb-1">Evaluated Points</span>
                  {selectedTask.evaluatedPoints ? (
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-xs inline-block mt-0.5">
                      {selectedTask.evaluatedPoints} / {selectedTask.points} Story Points
                    </span>
                  ) : (
                    <span className="font-medium text-slate-400 italic">Pending evaluation</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-400 text-xs font-semibold block mb-1">Due Date</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    {formatDate(selectedTask.due_date)}
                  </span>
                </div>
              </div>

              {selectedTask.evaluation_feedback && (
                <div className="bg-amber-50/50 border border-amber-200 p-3.5 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-amber-800 block uppercase tracking-wider text-[10px]">Lead Evaluation Feedback</span>
                  <p className="text-slate-700 italic">"{selectedTask.evaluation_feedback}"</p>
                </div>
              )}
            </div>

            <DialogFooter className="pt-4 border-t border-slate-100 mt-6 flex justify-between items-center">
              {isEvaluator && (
                <Button
                  onClick={() => {
                    const taskToEval = selectedTask
                    setSelectedTask(null)
                    openEvalDialog(taskToEval)
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs shadow-sm"
                >
                  <Award className="mr-1.5 h-3.5 w-3.5" />
                  Evaluate Task
                </Button>
              )}
              <Button
                onClick={() => setSelectedTask(null)}
                className="bg-slate-900 hover:bg-slate-850 text-white font-medium text-xs shadow-sm transition-all"
              >
                Close Details
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* ── Enterprise Filters Bar ─────────────────────── */}
      <div className={`glass-card-strong rounded-2xl p-4 border ${borderThemeClass} glow-on-hover transition-all duration-300`}>
        <div className="flex items-center gap-2 mb-3">
          <div className={`h-6 w-6 rounded-lg bg-gradient-to-br ${gradientThemeClass} flex items-center justify-center`}>
            <Filter className="h-3 w-3 text-white" />
          </div>
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Filters & Enterprise Search</span>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Search by title, project, or assignee..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className={`bg-white/80 border-slate-200 text-sm h-9 pl-9 rounded-xl ${focusRingThemeClass} transition-all`}
              />
            </div>

            <div className="w-full md:w-36">
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger className="bg-white/80 border-slate-200 h-9 rounded-xl text-sm">
                  <SelectValue placeholder="All Months" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-800">
                  <SelectItem value="All">All Months</SelectItem>
                  {monthNamesList.map(m => (
                    <SelectItem key={m} value={m}>
                      {m === currentMonthName ? `${m} (Current)` : m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full md:w-36">
              <Select value={weekFilter} onValueChange={setWeekFilter}>
                <SelectTrigger className="bg-white/80 border-slate-200 h-9 rounded-xl text-sm">
                  <SelectValue placeholder="All Weeks" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-800">
                  <SelectItem value="All">All Weeks</SelectItem>
                  <SelectItem value="Week 1">Week 1 (1-7)</SelectItem>
                  <SelectItem value="Week 2">Week 2 (8-14)</SelectItem>
                  <SelectItem value="Week 3">Week 3 (15-21)</SelectItem>
                  <SelectItem value="Week 4">Week 4 (22-28)</SelectItem>
                  <SelectItem value="Week 5">Week 5 (29+)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full md:w-36">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-white/80 border-slate-200 h-9 rounded-xl text-sm">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-800">
                  <SelectItem value="All">All Statuses</SelectItem>
                  <SelectItem value="Todo">Todo</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Review">Review</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full md:w-36">
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="bg-white/80 border-slate-200 h-9 rounded-xl text-sm">
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-800">
                  <SelectItem value="All">All Priorities</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {(role === 'super_admin' || role === 'admin' || role === 'team_lead') && (
            <div className="flex flex-col md:flex-row gap-3 pt-2 border-t border-slate-100/60 items-start md:items-center">
              {role === 'super_admin' && (
                <div className="w-full md:w-56">
                  <Select value={leadFilter} onValueChange={(val) => {
                    setLeadFilter(val)
                    setAssigneeFilter('All')
                  }}>
                    <SelectTrigger className="bg-white/80 border-slate-200 h-9 rounded-xl text-sm">
                      <SelectValue placeholder="All Leads" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 text-slate-800">
                      <SelectItem value="All">All Leads</SelectItem>
                      {leads.map(lead => (
                        <SelectItem key={lead.id} value={lead.id}>{lead.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="w-full md:w-56">
                <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                  <SelectTrigger className="bg-white/80 border-slate-200 h-9 rounded-xl text-sm">
                    <SelectValue placeholder="All Candidates" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-800">
                    <SelectItem value="All">All Candidates</SelectItem>
                    {visibleCandidates.map(cand => (
                      <SelectItem key={cand.id} value={cand.id}>
                        {cand.full_name} ({cand.evaluatedPoints} Pts)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Enterprise Bulk Selection Floating Bar ─────────────────────── */}
      {selectedTaskIds.length > 0 && (
        <div className="sticky top-4 z-40 bg-slate-900 text-white rounded-2xl p-3.5 shadow-2xl flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-top-4 duration-300 border border-slate-800">
          <div className="flex items-center gap-2">
            <span className="bg-violet-600 text-white font-extrabold text-xs px-2.5 py-1 rounded-lg">
              {selectedTaskIds.length} Selected
            </span>
            <span className="text-xs text-slate-300">Enterprise batch operations</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="secondary" className="h-8 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border-slate-700">
                  Bulk Status
                  <ChevronDown className="ml-1 h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white text-slate-800">
                {columns.map(status => (
                  <DropdownMenuItem key={status} onSelect={() => handleBulkStatusChange(status)} className="text-xs cursor-pointer">
                    Set Status to {status}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button size="sm" variant="secondary" onClick={handleExportCSV} className="h-8 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border-slate-700">
              <Download className="mr-1 h-3.5 w-3.5" />
              Export Selected
            </Button>

            {canDelete && (
              <Button size="sm" variant="destructive" onClick={handleBulkDelete} className="h-8 text-xs font-semibold bg-red-600 hover:bg-red-700">
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                Delete Selected
              </Button>
            )}

            <Button size="sm" variant="ghost" onClick={() => setSelectedTaskIds([])} className="h-8 text-xs text-slate-400 hover:text-white">
              Deselect All
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className={`h-10 w-10 rounded-full border-[3px] border-slate-200 animate-spin`} style={{ borderTopColor: role === 'admin' ? '#0d9488' : role === 'super_admin' ? '#4f46e5' : '#7c3aed' }} />
            </div>
            <p className="text-sm font-medium text-slate-500">Retrieving deliverables database...</p>
          </div>
        </div>
      ) : (
        <>
          {/* ── View Mode Switcher ─────────────────────── */}
          <div className="flex items-center justify-between">
            <div
              ref={tabListRef}
              className={`relative inline-flex items-center p-1 rounded-2xl bg-white/70 backdrop-blur-xl border border-slate-200/50 shadow-sm`}
              style={{ boxShadow: '0 1px 6px rgba(139, 92, 246, 0.06)' }}
            >
              <div
                className="absolute top-1 left-0 h-[calc(100%-8px)] rounded-xl transition-all duration-300 z-0"
                style={{
                  ...indicatorStyle,
                  ...slidingIndicatorStyle,
                }}
              />

              <button
                data-active={activeTab === 'list' ? 'true' : 'false'}
                onClick={() => setActiveTab('list')}
                className={`relative z-10 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'list'
                    ? tabTextThemeClass
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <List className={`h-4 w-4 transition-transform duration-200 ${activeTab === 'list' ? 'scale-110' : ''}`} />
                List View
              </button>
 
              <button
                data-active={activeTab === 'kanban' ? 'true' : 'false'}
                onClick={() => setActiveTab('kanban')}
                className={`relative z-10 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'kanban'
                    ? tabTextThemeClass
                    : 'text-slate-400 hover:text-slate-650'
                }`}
              >
                <LayoutGrid className={`h-4 w-4 transition-transform duration-200 ${activeTab === 'kanban' ? 'scale-110' : ''}`} />
                Kanban Board
              </button>

              {role !== 'employee' && (
                <button
                  data-active={activeTab === 'leaderboard' ? 'true' : 'false'}
                  onClick={() => setActiveTab('leaderboard')}
                  className={`relative z-10 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    activeTab === 'leaderboard'
                      ? tabTextThemeClass
                      : 'text-slate-400 hover:text-slate-650'
                  }`}
                >
                  <TrendingUp className={`h-4 w-4 transition-transform duration-200 ${activeTab === 'leaderboard' ? 'scale-110' : ''}`} />
                  Top Contributions
                </button>
              )}
            </div>
 
            <div className="flex items-center gap-2">
              <div className={`shimmer-badge ${tabTextThemeClass} text-[11px] font-semibold px-3 py-1 rounded-full border ${role === 'admin' ? 'border-teal-200/60' : role === 'super_admin' ? 'border-indigo-200/60' : 'border-violet-200/60'}`}>
                <Sparkles className="inline h-3 w-3 mr-1 -mt-0.5" />
                {filteredTasks.length} tasks
              </div>
            </div>
          </div>

          {/* List View Content */}
          {activeTab === 'list' && (
            <div className={`glass-card-strong rounded-2xl border ${borderThemeClass} overflow-hidden shadow-sm transition-all duration-300 stagger-children`}>
              <Table>
                <TableHeader>
                  <TableRow 
                    className={`border-b ${role === 'admin' ? 'border-teal-100/40' : role === 'super_admin' ? 'border-indigo-100/40' : 'border-violet-100/40'}`} 
                    style={{ 
                      background: role === 'admin' 
                        ? 'linear-gradient(135deg, rgba(13,148,136,0.04) 0%, rgba(16,185,129,0.02) 100%)' 
                        : role === 'super_admin' 
                          ? 'linear-gradient(135deg, rgba(79,70,229,0.04) 0%, rgba(139,92,246,0.02) 100%)' 
                          : 'linear-gradient(135deg, rgba(139,92,246,0.04) 0%, rgba(99,102,241,0.02) 100%)' 
                    }}
                  >
                    <TableHead className="w-[40px] px-3">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={handleToggleSelectAll}
                        className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-4 w-4 cursor-pointer"
                      />
                    </TableHead>
                    <TableHead className="w-[230px] font-bold text-slate-600 text-[11px] uppercase tracking-wider">Task Title</TableHead>
                    <TableHead className="font-bold text-slate-600 text-[11px] uppercase tracking-wider">Project</TableHead>
                    <TableHead className="font-bold text-slate-600 text-[11px] uppercase tracking-wider">Status</TableHead>
                    <TableHead className="font-bold text-slate-600 text-[11px] uppercase tracking-wider">Priority</TableHead>
                    <TableHead className="font-bold text-slate-600 text-[11px] uppercase tracking-wider">Assignee</TableHead>
                    <TableHead className="font-bold text-slate-600 text-[11px] uppercase tracking-wider">Assigned Pts</TableHead>
                    <TableHead className="font-bold text-slate-600 text-[11px] uppercase tracking-wider">Evaluated Pts</TableHead>
                    <TableHead className="font-bold text-slate-600 text-[11px] uppercase tracking-wider">Due Date</TableHead>
                    <TableHead className="text-right font-bold text-slate-600 text-[11px] uppercase tracking-wider">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-16">
                        <div className="flex flex-col items-center gap-2">
                          <div className={`h-10 w-10 rounded-2xl bg-gradient-to-br ${role === 'admin' ? 'from-teal-100 to-emerald-100' : role === 'super_admin' ? 'from-indigo-100 to-purple-100' : 'from-violet-100 to-indigo-100'} flex items-center justify-center`}>
                            <Search className={`h-4 w-4 ${role === 'admin' ? 'text-teal-500' : role === 'super_admin' ? 'text-indigo-500' : 'text-violet-500'}`} />
                          </div>
                          <p className="text-sm font-semibold text-slate-500">No tasks matched</p>
                          <p className="text-xs text-slate-400">Try adjusting your search or filter criteria</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTasks.map((task) => {
                      const isSelected = selectedTaskIds.includes(task.id)
                      return (
                        <TableRow 
                          key={task.id} 
                          onClick={() => setSelectedTask(task)}
                          className={`text-left border-b ${
                            isSelected ? 'bg-violet-50/60 border-violet-200' : 'border-slate-100 hover:bg-slate-50/60'
                          } transition-colors duration-200 group/row cursor-pointer`}
                        >
                          <TableCell className="px-3" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectTask(task.id)}
                              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-4 w-4 cursor-pointer"
                            />
                          </TableCell>
                          <TableCell className="font-medium text-slate-900 py-3.5">
                            <span className={`font-bold text-slate-900 text-[13px] transition-colors ${groupHoverTextClass}`}>{task.title}</span>
                          </TableCell>
                          <TableCell>
                            {task.project ? (
                              <span className={`text-[12px] font-medium px-2.5 py-1 rounded-md border ${
                                role === 'admin' 
                                  ? 'bg-teal-100/50 border-teal-200/50 text-teal-700' 
                                  : role === 'super_admin' 
                                    ? 'bg-indigo-100/50 border-indigo-200/50 text-indigo-700' 
                                    : 'bg-violet-100/50 border-violet-200/50 text-violet-700'
                              }`}>
                                {task.project.name}
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-medium italic">Unassigned</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`${getStatusColor(task.status)} border shadow-sm text-[11px] font-semibold rounded-lg px-2.5 py-0.5`}>
                              {task.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className={`text-xs font-bold uppercase tracking-wide ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className={`w-7 h-7 rounded-lg border flex items-center justify-center text-[10px] font-bold shadow-sm ${avatarBgClass}`}>
                                {task.assignee ? task.assignee.full_name.charAt(0) : '?'}
                              </div>
                              <span className="text-sm text-slate-600 font-medium truncate max-w-[120px]">
                                {task.assignee ? task.assignee.full_name : 'Unassigned'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {task.points ? (
                              <span className="text-xs font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200">
                                {task.points} pts
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400 font-medium italic">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {task.evaluatedPoints ? (
                              <span className="text-xs font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-250/50 flex items-center gap-1 w-max">
                                <Award className="h-3 w-3 text-emerald-600" />
                                {task.evaluatedPoints} / {task.points || 0} pts
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400 font-medium italic">Pending</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-slate-500 text-xs flex items-center gap-1.5">
                              <Calendar className="h-3 w-3 text-slate-400" />
                              {formatDate(task.due_date)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              {isEvaluator && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openEvalDialog(task)}
                                  title="Evaluate Task & Award Points"
                                  className="h-7 px-2 text-xs font-bold text-amber-700 hover:bg-amber-50 hover:text-amber-800 rounded-lg flex items-center gap-1"
                                >
                                  <Award className="h-3.5 w-3.5 text-amber-500" />
                                  Evaluate
                                </Button>
                              )}

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-7 w-7 p-0 rounded-lg hover:bg-slate-100 transition-colors">
                                    <MoreHorizontal className="h-4 w-4 text-slate-400" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-xl border-slate-200 rounded-xl shadow-lg">
                                  <DropdownMenuLabel className="text-[10px] text-slate-400 uppercase tracking-wider">Actions</DropdownMenuLabel>
                                  {isEvaluator && (
                                    <DropdownMenuItem onSelect={() => openEvalDialog(task)} className="flex items-center gap-2 cursor-pointer text-xs rounded-lg text-amber-700 font-semibold">
                                      <Award className="h-3.5 w-3.5 text-amber-500" />
                                      Evaluate Deliverable
                                    </DropdownMenuItem>
                                  )}
                                  {canEdit && (
                                    <DropdownMenuItem onSelect={() => openEditDialog(task)} className="flex items-center gap-2 cursor-pointer text-xs rounded-lg">
                                      <Edit2 className="h-3.5 w-3.5" />
                                      Edit Task
                                    </DropdownMenuItem>
                                  )}

                                  <DropdownMenuLabel className="border-t border-slate-100 mt-1 text-[10px] text-slate-400 uppercase tracking-wider">Quick Status</DropdownMenuLabel>
                                  {columns.map(status => (
                                    <DropdownMenuItem
                                      key={status}
                                      onSelect={() => updateStatus(task.id, status)}
                                      disabled={task.status === status}
                                      className="text-xs cursor-pointer pl-6 rounded-lg"
                                    >
                                      {status}
                                    </DropdownMenuItem>
                                  ))}

                                  {canDelete && (
                                    <DropdownMenuItem
                                      onSelect={() => handleDeleteTask(task.id)}
                                      className="text-red-600 focus:bg-red-50 focus:text-red-700 border-t border-slate-100 mt-1 cursor-pointer flex items-center gap-2 rounded-lg text-xs"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                      Delete Task
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Kanban Board Content */}
          {activeTab === 'kanban' && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 stagger-children">
              {columns.map((col) => {
                const colTasks = filteredTasks.filter(t => normalizeStatus(t.status) === col)
                const columnColorMap: Record<string, { gradient: string; badge: string; dot: string }> = {
                  'Todo': { gradient: 'from-slate-100/80 to-slate-50/50', badge: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
                  'In Progress': { gradient: 'from-blue-50/80 to-blue-25/50', badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
                  'Review': { gradient: 'from-amber-50/80 to-amber-25/50', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
                  'Completed': { gradient: 'from-emerald-50/80 to-emerald-25/50', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
                  'Blocked': { gradient: 'from-red-50/80 to-red-25/50', badge: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
                }
                const colors = columnColorMap[col] || columnColorMap['Todo']

                return (
                  <div key={col}
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.dataTransfer.dropEffect = 'move'
                      if (draggedOverCol !== col) {
                        setDraggedOverCol(col)
                      }
                    }}
                    onDragLeave={() => {
                      setDraggedOverCol(null)
                    }}
                    onDrop={async (e) => {
                      e.preventDefault()
                      setDraggedOverCol(null)
                      const taskId = e.dataTransfer.getData('text/plain')
                      if (taskId) {
                        const taskToMove = tasks.find(t => t.id === taskId)
                        if (taskToMove && normalizeStatus(taskToMove.status) !== col) {
                          await updateStatus(taskId, col)
                        }
                      }
                    }}
                    className={`bg-gradient-to-b ${colors.gradient} rounded-2xl p-3.5 border backdrop-blur-sm flex flex-col min-h-[400px] transition-all duration-200 ${
                      draggedOverCol === col
                        ? 'border-violet-400 border-dashed bg-violet-50/40 ring-4 ring-violet-500/10 scale-[1.01]'
                        : 'border-white/60'
                    }`}
                    style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}
                  >
                    <div className="flex items-center justify-between mb-3 px-1">
                      <h3 className="font-bold text-slate-700 flex items-center gap-2 text-xs uppercase tracking-wider">
                        <span className={`w-2 h-2 rounded-full ${colors.dot}`}></span>
                        {col}
                      </h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colors.badge}`}>
                        {colTasks.length}
                      </span>
                    </div>

                    <div className="space-y-2.5 flex-1 overflow-y-auto">
                      {colTasks.map((task, idx) => (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', task.id)
                            e.dataTransfer.effectAllowed = 'move'
                            const currentTarget = e.currentTarget
                            setTimeout(() => {
                              currentTarget.classList.add('opacity-40')
                            }, 0)
                          }}
                          onDragEnd={(e) => {
                            e.currentTarget.classList.remove('opacity-40')
                            setDraggedOverCol(null)
                          }}
                          onClick={() => setSelectedTask(task)}
                          className="glass-card accent-bar-left p-3.5 rounded-xl hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 group text-left relative cursor-pointer"
                          style={{ animationDelay: `${idx * 0.05}s` }}
                        >
                          <div className="absolute right-2.5 top-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            {isEvaluator && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openEvalDialog(task)}
                                title="Evaluate Task"
                                className="h-6 w-6 p-0 hover:bg-amber-50 rounded-lg text-amber-600"
                              >
                                <Award className="h-3.5 w-3.5" />
                              </Button>
                            )}

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-6 w-6 p-0 hover:bg-slate-100 rounded-lg">
                                  <MoreHorizontal className="h-3.5 w-3.5 text-slate-400" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-xl border-slate-200 rounded-xl shadow-lg">
                                {isEvaluator && (
                                  <DropdownMenuItem onSelect={() => openEvalDialog(task)} className="flex items-center gap-2 cursor-pointer text-xs rounded-lg text-amber-700 font-semibold">
                                    <Award className="h-3.5 w-3.5 text-amber-500" />
                                    Evaluate Task
                                  </DropdownMenuItem>
                                )}
                                {canEdit && (
                                  <DropdownMenuItem onSelect={() => openEditDialog(task)} className="flex items-center gap-2 cursor-pointer text-xs rounded-lg">
                                    <Edit2 className="h-3.5 w-3.5" />
                                    Edit Task
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuLabel className="border-t border-slate-100 mt-1 text-[10px] text-slate-400 uppercase tracking-wider">Move Task</DropdownMenuLabel>
                                {columns.filter(c => c !== col).map(status => (
                                  <DropdownMenuItem
                                    key={status}
                                    onSelect={() => updateStatus(task.id, status)}
                                    className="text-xs cursor-pointer pl-6 rounded-lg"
                                  >
                                    Move to {status}
                                  </DropdownMenuItem>
                                ))}
                                {canDelete && (
                                  <DropdownMenuItem
                                    onSelect={() => handleDeleteTask(task.id)}
                                    className="text-red-600 focus:bg-red-50 focus:text-red-700 border-t border-slate-100 mt-1 cursor-pointer text-xs flex items-center gap-2 rounded-lg"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Delete Task
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <h4 className={`font-bold text-slate-900 text-[13px] leading-snug transition-colors pr-6 pl-1.5 ${groupHoverTextClass}`}>
                            {task.title}
                          </h4>

                          {task.description && (
                            <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-2 leading-relaxed pl-1.5">
                              {task.description}
                            </p>
                          )}

                          {task.project && (
                            <div className="mt-2.5 pl-1.5">
                              <span className="text-[9px] font-bold bg-violet-50 text-violet-600 px-2 py-0.5 rounded-md uppercase tracking-wider border border-violet-100/50">
                                {task.project.name}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100/60 pl-1.5">
                            <span className={`text-[9px] uppercase font-extrabold tracking-wider ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {task.due_date && (
                                <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                                  <Calendar className="h-2.5 w-2.5" />
                                  {formatDate(task.due_date)}
                                </span>
                              )}
                              {task.evaluatedPoints !== undefined && task.evaluatedPoints > 0 ? (
                                <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-250/50" title="Evaluated Points">
                                  {task.evaluatedPoints} / {task.points} eval pts
                                </span>
                              ) : task.points !== undefined && task.points > 0 ? (
                                <span className="text-[9px] font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200" title="Sprint Planning Points">
                                  {task.points} pts
                                </span>
                              ) : null}
                              <div className={`w-5 h-5 rounded-md border flex items-center justify-center text-[9px] font-bold ${avatarBgClass}`} title={task.assignee?.full_name || 'Unassigned'}>
                                {task.assignee ? task.assignee.full_name.charAt(0) : '?'}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Top Contributions Leaderboard Tab */}
          {role !== 'employee' && activeTab === 'leaderboard' && (
            <div className="space-y-4 animate-in fade-in-50 duration-300">
              <div className="glass-card-strong rounded-2xl border border-slate-200/50 p-6 shadow-[0_4px_24px_rgba(0,0,0,0.015)]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-6">
                  <div>
                    <h3 className="text-slate-900 text-lg font-extrabold tracking-tight flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-violet-500" />
                      Top Contributions (Leaderboard)
                    </h3>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Cumulative completed & evaluated story points of candidates under your team lead
                    </p>
                  </div>
                  {role === 'super_admin' && (
                    <div className="text-[10px] bg-slate-50 border border-slate-100 rounded-lg px-3 py-1 font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                      👑 Scoped per selected Team Lead filter
                    </div>
                  )}
                  {(role === 'admin' || role === 'team_lead') && (
                    <div className="text-[10px] bg-teal-50 border border-teal-100/30 rounded-lg px-3 py-1 font-bold text-teal-700 uppercase tracking-wider shrink-0">
                      🏆 Managed Team Candidates
                    </div>
                  )}
                </div>

                {leaderboardCandidates.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 text-sm font-semibold">
                    No completed task points found for members in this team
                  </div>
                ) : (
                  <div className="grid gap-4 max-w-3xl mx-auto">
                    {leaderboardCandidates.map((cand, idx) => {
                      const progressPercent = Math.min(100, Math.round((cand.evaluatedPoints / 60) * 100))
                      
                      let rankBadge: any = null
                      if (idx === 0) rankBadge = <span className="text-xl" title="1st Place (Gold)">🏆</span>
                      else if (idx === 1) rankBadge = <span className="text-xl" title="2nd Place (Silver)">🥈</span>
                      else if (idx === 2) rankBadge = <span className="text-xl" title="3rd Place (Bronze)">🥉</span>
                      else rankBadge = <span className="text-xs font-bold text-slate-400 w-6 text-center">#{idx + 1}</span>

                      const barColor = role === 'admin' ? 'bg-teal-500' : role === 'super_admin' ? 'bg-indigo-500' : role === 'team_lead' ? 'bg-emerald-500' : 'bg-violet-500'

                      return (
                        <div 
                          key={cand.id} 
                          className="flex items-center gap-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-100/85 p-3.5 rounded-xl transition-all duration-200 shadow-sm"
                        >
                          <div className="flex-shrink-0 flex items-center justify-center w-8">
                            {rankBadge}
                          </div>
                          
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 border border-slate-300/30 flex items-center justify-center text-xs font-bold text-slate-600">
                            {cand.full_name.charAt(0)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-1.5">
                              <h4 className="text-xs font-bold text-slate-800 truncate">{cand.full_name}</h4>
                              <span className="text-xs font-extrabold text-slate-900 shrink-0 ml-2">
                                {cand.evaluatedPoints} / 60 Pts
                              </span>
                            </div>
                            <div className="w-full bg-slate-200/50 h-2 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}