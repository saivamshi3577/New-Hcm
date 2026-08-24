import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, FolderKanban, Users, Calendar, MoreHorizontal, ShieldAlert, Loader2 } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { api, safeArray } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

interface Project {
  id: string
  name: string
  key?: string
  description: string
  status: string
  priority?: string
  department?: string
  budget?: number
  lead?: string
  startDate?: string
  dueDate?: string
  riskLevel?: string
  privacy?: string
  members: number
  tasks: { total: number; completed: number }
  due: string
}



const initialFormState = {
  name: '',
  key: '',
  description: '',
  priority: 'Medium',
  type: 'Internal',
  startDate: new Date().toISOString().split('T')[0],
  dueDate: '',
  privacy: 'Public',
  riskLevel: 'Low',
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState(initialFormState)
  const [formError, setFormError] = useState<string | null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, profile, role } = useAuthStore()
  const { toast } = useToast()

  const searchQuery = searchParams.get('search') || ''

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.key || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-teal-50 text-teal-700 border-teal-200'
      case 'Completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'Planning': return 'bg-amber-50 text-amber-700 border-amber-200'
      default: return 'bg-slate-50 text-slate-700 border-slate-200'
    }
  }

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'No target date'
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const fetchProjects = async () => {
    if (!user) return
    setLoading(true)
    try {
      let remote: any[] = []
      try {
        const res: any = await api.get('/task/projects?_select=*,project_members(count),tasks(status)&_sort=-created_at')
        remote = safeArray(res, 'projects')
      } catch (e) {}

      let local: any[] = []
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && (key.startsWith('st_projects_') || key === 'st_projects')) {
            const val = JSON.parse(localStorage.getItem(key) || '[]')
            if (Array.isArray(val)) local = local.concat(val)
          }
        }
      } catch (e) {}

      const projMap = new Map<string, any>()
      local.forEach((p: any) => projMap.set(p.id, p))
      remote.forEach((p: any) => projMap.set(p.id, p))

      const allData = Array.from(projMap.values())
      const myEmail = (user.email || '').toLowerCase()
      const myDomain = myEmail.includes('@') ? myEmail.split('@')[1] : ''

      const scopedData = allData.filter((p: any) => {
        if (role === 'super_admin') return true

        const pAdmin = String(p.created_by_admin || p.createdByAdmin || '').toLowerCase()
        const pDomain = String(p.domain || '').toLowerCase()
        const pCreatorId = String(p.created_by_id || p.createdById || p.created_by || '').toLowerCase()
        const pLeadId = String(p.lead_id || p.leadId || '').toLowerCase()

        const isAdminMatch = pAdmin && myEmail && pAdmin === myEmail
        const isDomainMatch = pDomain && myDomain && (pDomain === myDomain || pDomain.includes(myDomain) || myDomain.includes(pDomain))
        const isCreatorMatch = (pCreatorId && user.id && pCreatorId === String(user.id).toLowerCase()) ||
                              (pLeadId && user.id && pLeadId === String(user.id).toLowerCase())

        return isAdminMatch || isDomainMatch || isCreatorMatch
      })

      const mapped: Project[] = scopedData.map((p: any) => {
        const tasksList = p.tasks || []
        const total = tasksList.length
        const completed = tasksList.filter((t: any) => t.status === 'Completed').length
        const membersCount = p.project_members?.[0]?.count || p.members || 1

        return {
          id: p.id,
          name: p.name,
          key: p.key || 'PROJ',
          description: p.description || 'No description provided.',
          status: p.status ? (p.status.charAt(0).toUpperCase() + p.status.slice(1)) : 'Planning',
          priority: p.priority || 'Medium',
          department: p.department || 'General',
          budget: p.budget || 0,
          lead: p.lead || p.lead_name || profile?.full_name || user.fullName || user.email || 'Lead',
          startDate: p.start_date || p.startDate,
          dueDate: p.due_date || p.dueDate,
          riskLevel: p.risk_level || p.riskLevel || 'Low',
          privacy: p.privacy || 'Public',
          members: membersCount,
          tasks: { total, completed },
          due: formatDate(p.due_date || p.dueDate)
        }
      })
      setProjects(mapped)
    } catch (err: any) {
      console.error('Error fetching projects:', err)
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!user) {
      setFormError('You must be logged in to create a project.')
      return
    }
    if (!formData.name.trim()) {
      setFormError('Project Name is required')
      return
    }
    if (!formData.key.trim()) {
      setFormError('Project Code / Key is required')
      return
    }
    if (formData.key.trim().length < 2) {
      setFormError('Project Code / Key must be at least 2 characters')
      return
    }
    if (formData.startDate && formData.dueDate && new Date(formData.startDate) > new Date(formData.dueDate)) {
      setFormError('Target Completion Date cannot be before the Start Date')
      return
    }

    try {
      const dbProject = {
        name: formData.name.trim(),
        key: formData.key.trim().toUpperCase(),
        description: formData.description.trim() || 'No description provided.',
        status: 'Planning',
        priority: formData.priority,
        department: null,
        budget: 0,
        lead: profile?.full_name || user.email || 'Unknown Lead',
        start_date: formData.startDate,
        due_date: formData.dueDate || null,
        risk_level: formData.riskLevel,
        privacy: formData.privacy,
        created_by: user.id
      }

      let data: any = null
      try {
        const res: any = await api.post('/task/projects', dbProject)
        data = res?.data || res
      } catch (error: any) {
        throw error
      }

      if (data) {
        // Try adding the creator as a project member (ignore if fails, not critical)
        try {
          await api.post('/project_members', {
            project_id: data.id,
            user_id: user.id,
            role: 'owner'
          })
        } catch (memberErr) {
          console.warn('Could not add creator as a member in DB:', memberErr)
        }

        // Notify all Admins and Super Admins
        try {
          let roles: any = []
          try {
            roles = await api.get('/roles?_select=id,name')
          } catch (e) {}
          if (roles) {
            const adminRoleIds = roles
              .filter(r => {
                const n = r.name.toLowerCase()
                return n.includes('admin')
              })
              .map(r => r.id)

            if (adminRoleIds.length > 0) {
              let admins: any = []
              try {
                admins = await api.get('/employee?_select=id&role_id_in=' + adminRoleIds.join(','))
              } catch (e) {}

              if (admins && admins.length > 0) {
                // Filter out the current user if they are an admin
                const otherAdmins = admins.filter(a => a.id !== user.id)
                if (otherAdmins.length > 0) {
                  // 3. Insert notifications for them
                  const notifications = otherAdmins.map(admin => ({
                    user_id: admin.id,
                    type: 'project_added',
                    content: `A new project "${data.name}" has been created by ${profile?.full_name || user.email}.`,
                    is_read: false
                  }))

                  try {
                    await api.post('/notifications', notifications)
                  } catch (e) {}
                }
              }
            }
          }
        } catch (notifErr) {
          console.error('Error notifying admins of new project:', notifErr)
        }

        const newProject: Project = {
          id: data.id,
          name: data.name,
          key: data.key,
          description: data.description,
          status: data.status,
          priority: data.priority,
          department: data.department,
          budget: Number(data.budget),
          lead: data.lead,
          startDate: data.start_date,
          dueDate: data.due_date,
          riskLevel: data.risk_level,
          privacy: data.privacy,
          members: 1,
          tasks: { total: 0, completed: 0 },
          due: formatDate(data.due_date)
        }

        setProjects([newProject, ...projects])
        setIsOpen(false)
        setFormData(initialFormState)

        toast({
          title: 'Project Created',
          description: `Project [${newProject.key}] ${newProject.name} has been initialized successfully in database.`,
        })
      }
    } catch (err: any) {
      console.error('Error creating project:', err)

      const isSchemaMismatch = err.message?.includes('column') || err.message?.includes('schema cache')
      const errorMessage = isSchemaMismatch
        ? 'Database schema mismatch: Please run the provided SQL migration in your Supabase SQL Editor to add the enterprise columns.'
        : (err.message || 'An unexpected database error occurred.')

      setFormError(errorMessage)

      toast({
        title: 'Error Creating Project',
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }

  const deleteProject = async (id: string) => {
      try {
        await api.delete('/task/projects/' + id)

      const updated = projects.filter(p => p.id !== id)
      setProjects(updated)
      toast({
        title: 'Project Archived',
        description: 'The project has been archived and removed from the database.',
      })
    } catch (err: any) {
      console.error('Error deleting project:', err)
      toast({
        title: 'Error Archiving Project',
        description: err.message || 'Could not delete project from the database.',
        variant: 'destructive',
      })
    }
  }
  console.log('project', projects);

  return (
    <div className="space-y-6 fade-in duration-500 text-slate-800">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-950">Projects</h2>
          <p className="text-slate-500 mt-1">Manage project milestones, track deliverables, and coordinate team resources.</p>
        </div>

        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open)
          if (!open) {
            setFormError(null)
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-teal-600 hover:bg-teal-700 text-white font-medium shadow-md hover:shadow-teal-600/20 transition-all">
              <Plus className="mr-2 h-4 w-4" />
              Create Project
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-slate-200 text-slate-800 text-left sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-900">Create Enterprise Project</DialogTitle>
              <DialogDescription className="text-slate-500">
                Initialize a new high-scale corporate workspace with proper tracking parameters, ownership, and phase classification.
              </DialogDescription>
            </DialogHeader>

            {formError && (
              <div className="flex items-center gap-2 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded p-3 my-2">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Project Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-700 font-semibold text-xs">Project Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Cloud Migrations 2026"
                    className="bg-slate-50 border-slate-200 text-sm h-10 focus:bg-white"
                  />
                </div>

                {/* Project Key */}
                <div className="space-y-2">
                  <Label htmlFor="key" className="text-slate-700 font-semibold text-xs">Project Key / Code <span className="text-red-500">*</span></Label>
                  <Input
                    id="key"
                    required
                    value={formData.key}
                    onChange={e => setFormData({ ...formData, key: e.target.value.toUpperCase() })}
                    placeholder="e.g. CLD"
                    maxLength={10}
                    className="bg-slate-50 border-slate-200 text-sm h-10 focus:bg-white font-mono"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-slate-700 font-semibold text-xs">Scope Description</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="flex min-h-[70px] w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus:bg-white"
                  placeholder="Outline the core milestones, dependencies, and target objectives..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Priority */}
                <div className="space-y-2">
                  <Label htmlFor="priority" className="text-slate-700 font-semibold text-xs">Priority Index</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={val => setFormData({ ...formData, priority: val })}
                  >
                    <SelectTrigger className="bg-slate-50 border-slate-200 h-10">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 text-slate-800">
                      <SelectItem value="Low">Low Priority</SelectItem>
                      <SelectItem value="Medium">Medium Priority</SelectItem>
                      <SelectItem value="High">High Priority</SelectItem>
                      <SelectItem value="Critical">Critical Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Project Type */}
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-slate-700 font-semibold text-xs">Work Classification</Label>
                  <Select
                    value={formData.type}
                    onValueChange={val => setFormData({ ...formData, type: val })}
                  >
                    <SelectTrigger className="bg-slate-50 border-slate-200 h-10">
                      <SelectValue placeholder="Select classification" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 text-slate-800">
                      <SelectItem value="Internal">Internal Corporate Operation</SelectItem>
                      <SelectItem value="Client">Client Deliverable</SelectItem>
                      <SelectItem value="Regulatory">Compliance / Regulatory</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Start Date */}
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="text-slate-700 font-semibold text-xs">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    className="bg-slate-50 border-slate-200 text-sm h-10 focus:bg-white text-slate-800"
                  />
                </div>

                {/* Target Completion Date */}
                <div className="space-y-2">
                  <Label htmlFor="dueDate" className="text-slate-700 font-semibold text-xs">Target Completion Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                    className="bg-slate-50 border-slate-200 text-sm h-10 focus:bg-white text-slate-800"
                  />
                </div>

                {/* Access Level / Privacy */}
                <div className="space-y-2">
                  <Label htmlFor="privacy" className="text-slate-700 font-semibold text-xs">Access Policy / Privacy</Label>
                  <Select
                    value={formData.privacy}
                    onValueChange={val => setFormData({ ...formData, privacy: val })}
                  >
                    <SelectTrigger className="bg-slate-50 border-slate-200 h-10">
                      <SelectValue placeholder="Select privacy policy" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 text-slate-800">
                      <SelectItem value="Public">Public (All company accounts)</SelectItem>
                      <SelectItem value="Private">Private (Assigned members only)</SelectItem>
                      <SelectItem value="Confidential">Confidential (Executive access only)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Risk Level */}
                <div className="space-y-2">
                  <Label htmlFor="riskLevel" className="text-slate-700 font-semibold text-xs">Project Risk Profile</Label>
                  <Select
                    value={formData.riskLevel}
                    onValueChange={val => setFormData({ ...formData, riskLevel: val })}
                  >
                    <SelectTrigger className="bg-slate-50 border-slate-200 h-10">
                      <SelectValue placeholder="Select risk profile" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 text-slate-800">
                      <SelectItem value="Low">Low Risk Factors</SelectItem>
                      <SelectItem value="Medium">Medium Risk Factors</SelectItem>
                      <SelectItem value="High">High Risk Factors</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter className="pt-4 gap-2 sm:gap-0 border-t border-slate-100 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  className="border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-teal-600 hover:bg-teal-700 text-white font-medium shadow-sm transition-all"
                >
                  Create Project
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            <p className="text-sm font-medium text-slate-500">Retrieving active workspaces...</p>
          </div>
        </div>
      ) : filteredProjects.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50 p-12 text-center flex flex-col items-center justify-center">
          <FolderKanban className="h-12 w-12 text-slate-400 mb-4 stroke-[1.5]" />
          <h3 className="text-lg font-bold text-slate-900 mb-1">No Projects Found</h3>
          <p className="text-slate-500 text-sm max-w-sm mb-6">
            {searchQuery
              ? `No active projects match your search query: "${searchQuery}". Try refining your keywords.`
              : 'Create your first enterprise-level project workspace to start tracking tasks, managing team members, and planning deliverables.'}
          </p>
          {!searchQuery && (
            <Button
              onClick={() => setIsOpen(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white font-medium shadow-md transition-all"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create First Project
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredProjects.map((project) => {
            const progress = project.tasks.total > 0
              ? Math.round((project.tasks.completed / project.tasks.total) * 100)
              : 0

            return (
              <Card key={project.id} className="relative bg-white border border-slate-200/50 hover:border-teal-500/35 shadow-[0_1px_3px_rgba(0,0,0,0.01),0_8px_20px_rgba(0,0,0,0.01)] hover:shadow-[0_10px_25px_-4px_rgba(20,184,166,0.04)] hover:-translate-y-0.5 transition-all duration-300 rounded-xl overflow-hidden group">
                {/* Subtle colored top-border highlight matching status */}
                <div className={`absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r ${project.status === 'Completed' ? 'from-emerald-500 to-teal-400' :
                  project.status === 'In Progress' ? 'from-teal-550 to-cyan-400' :
                    project.status === 'Planning' ? 'from-indigo-500 to-violet-400' :
                      'from-slate-400 to-slate-200'
                  } opacity-70 group-hover:opacity-100 transition-opacity`} />
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2.5 pt-4 text-left">
                  <div className="flex-1 mr-4">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                      <Badge variant="outline" className={`text-[9px] font-extrabold uppercase tracking-wider ${getStatusStyles(project.status)}`}>
                        {project.status}
                      </Badge>
                      {project.priority && (
                        <Badge variant="outline" className={`text-[9px] font-extrabold uppercase tracking-wider ${project.priority === 'Critical' ? 'bg-red-50 text-red-700 border-red-200/60 shadow-[0_1px_2px_rgba(239,68,68,0.03)]' :
                          project.priority === 'High' ? 'bg-orange-50 text-orange-700 border-orange-200/60' :
                            project.priority === 'Medium' ? 'bg-blue-50 text-blue-700 border-blue-200/60' :
                              'bg-slate-50 text-slate-700 border-slate-200/60'
                          }`}>
                          {project.priority} Priority
                        </Badge>
                      )}
                      {project.department && (
                        <Badge variant="outline" className="text-[9px] font-medium bg-slate-50 text-slate-650 border-slate-200/60">
                          {project.department}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-base font-extrabold text-slate-905 group-hover:text-teal-650 transition-colors flex items-center gap-2">
                      {project.key && (
                        <span className="text-[10px] font-mono font-bold bg-teal-50 text-teal-700 border border-teal-200/50 px-1.5 py-0.5 rounded uppercase tracking-wide">
                          {project.key}
                        </span>
                      )}
                      <span>{project.name}</span>
                    </CardTitle>
                    <CardDescription className="text-slate-500 mt-1 text-xs leading-relaxed line-clamp-2">
                      {project.description}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white border-slate-200 text-slate-800">
                      <DropdownMenuItem onSelect={() => setSelectedProject(project)} className="cursor-pointer">View Details</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => navigate(`/admin/tasks?projectId=${project.id}`)} className="cursor-pointer">View Tasks</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-650 cursor-pointer" onSelect={() => deleteProject(project.id)}>
                        Delete Project
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="text-left pt-0 pb-3">
                  {/* Enterprise Details Grid */}
                  <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 mb-3 text-xs border-t border-b border-slate-100 py-2.5 my-2.5">
                    {/* <div className="flex items-center justify-between text-slate-500">
                      <span>Lead:</span>
                      <span className="font-semibold text-slate-700 truncate max-w-[125px]">{project.lead || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Budget:</span>
                      <span className="font-semibold text-slate-700">
                        {project.budget !== undefined && project.budget > 0
                          ? `$${project.budget.toLocaleString()}`
                          : 'Unallocated'}
                      </span>
                    </div> */}
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Risk Level:</span>
                      <span className={`font-semibold ${project.riskLevel === 'High' ? 'text-red-655' :
                        project.riskLevel === 'Medium' ? 'text-amber-650' :
                          'text-emerald-650'
                        }`}>
                        {project.riskLevel || 'Low'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Access Level:</span>
                      <span className="font-semibold text-slate-700">{project.privacy || 'Public'}</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-[11px] text-slate-450 mb-1">
                      <span>{project.tasks.completed} of {project.tasks.total} tasks</span>
                      <span className="font-bold text-slate-750">{progress}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-100/50">
                      <div
                        className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Footer meta */}
                  <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-2.5 mt-2.5">
                    <div className="flex items-center gap-3.5 text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-teal-650" />
                        <span className="text-[11px]">{project.members} members</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <FolderKanban className="h-3.5 w-3.5 text-teal-650" />
                        <span className="text-[11px]">{project.tasks.total} tasks</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                      <Calendar className="h-3.5 w-3.5 text-teal-600" />
                      {project.due}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* View Project Details Modal */}
      <Dialog open={selectedProject !== null} onOpenChange={(open) => {
        if (!open) setSelectedProject(null)
      }}>
        {selectedProject && (
          <DialogContent className="bg-white border-slate-200 text-slate-805 text-left sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono font-bold bg-teal-50 text-teal-700 border border-teal-200 px-1.5 py-0.5 rounded uppercase">
                  {selectedProject.key}
                </span>
                <Badge variant="outline" className={`text-[10px] font-semibold uppercase tracking-wider ${getStatusStyles(selectedProject.status)}`}>
                  {selectedProject.status}
                </Badge>
              </div>
              <DialogTitle className="text-2xl font-bold text-slate-900">{selectedProject.name}</DialogTitle>
              <DialogDescription className="text-slate-500 mt-1">
                Comprehensive workspace blueprint, timelines, and operational parameters.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 pt-4">
              {/* Description */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest text-left">Scope Description</h4>
                <p className="text-slate-655 text-sm leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200/50 text-left">
                  {selectedProject.description}
                </p>
              </div>

              {/* Grid Parameters */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-200/40 text-sm text-left">
                <div>
                  <span className="text-slate-400 text-xs font-semibold block mb-1">Project Sponsor / Lead</span>
                  <span className="font-bold text-slate-800">{selectedProject.lead || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs font-semibold block mb-1">Allocated Budget</span>
                  <span className="font-bold text-slate-800">
                    {selectedProject.budget !== undefined && selectedProject.budget > 0
                      ? `$${selectedProject.budget.toLocaleString()}`
                      : 'Unallocated'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs font-semibold block mb-1">Risk Profile</span>
                  <span className={`font-bold ${selectedProject.riskLevel === 'High' ? 'text-red-655' :
                    selectedProject.riskLevel === 'Medium' ? 'text-amber-655' :
                      'text-emerald-655'
                    }`}>
                    {selectedProject.riskLevel || 'Low'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs font-semibold block mb-1">Access Policy</span>
                  <span className="font-bold text-slate-800">{selectedProject.privacy || 'Public'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs font-semibold block mb-1">Start Date</span>
                  <span className="font-bold text-slate-800">{formatDate(selectedProject.startDate)}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs font-semibold block mb-1">Target Completion Date</span>
                  <span className="font-bold text-slate-800">{selectedProject.due}</span>
                </div>
              </div>

              {/* Tasks Progress */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest text-left">Deliverables Progress</h4>
                <div className="flex items-center justify-between text-sm text-slate-655">
                  <span className="font-medium">{selectedProject.tasks.completed} of {selectedProject.tasks.total} tasks completed</span>
                  <span className="font-bold text-slate-900">
                    {selectedProject.tasks.total > 0
                      ? Math.round((selectedProject.tasks.completed / selectedProject.tasks.total) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full"
                    style={{
                      width: `${selectedProject.tasks.total > 0
                        ? Math.round((selectedProject.tasks.completed / selectedProject.tasks.total) * 100)
                        : 0}%`
                    }}
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-slate-100 mt-6">
              <Button
                onClick={() => setSelectedProject(null)}
                className="bg-slate-900 hover:bg-slate-850 text-white font-medium shadow-sm transition-all"
              >
                Close Details
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}


