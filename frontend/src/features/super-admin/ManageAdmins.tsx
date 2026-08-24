import { useState, useMemo, Fragment } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { 
  Building2, 
  UserPlus, 
  Settings, 
  ShieldAlert, 
  Loader2, 
  Pencil, 
  Globe, 
  Users, 
  Search, 
  Sparkles, 
  ExternalLink,
  ShieldCheck,
  Building,
  KeyRound,
  Mail,
  CheckCircle2,
  Lock,
  Upload,
  Phone,
  MapPin,
  FileText,
  Briefcase,
  Image as ImageIcon,
  Clock,
  Award,
  Sliders,
  Navigation,
  Layers,
  Save,
  CheckSquare,
  Square,
  Shield,
  Trash2,
  RotateCcw,
  Copy,
  Check
} from 'lucide-react'
import {
  PERMISSION_CATEGORIES,
  type RolePermissionsMatrix,
  getGlobalRolePermissions,
  saveGlobalRolePermissions,
  getCompanyRolePermissions,
  saveCompanyRolePermissions,
  getCompanyRoleLabels,
  saveCompanyRoleLabels,
  DEFAULT_ROLE_LABELS
} from '@/lib/rolePermissions'
import { Permission, ROLE_PERMISSIONS } from '@/config/permissions'
import type { Role } from '@/types/user'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, safeArray } from '@/lib/api'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { getCompanyPolicy, saveCompanyPolicy, type CompanyPolicy, DEFAULT_POLICY } from '@/lib/companyPolicy'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

const PRESET_LOGOS = [
  { name: 'Tech / AI', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80' },
  { name: 'Finance / FinTech', url: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=150&auto=format&fit=crop&q=80' },
  { name: 'Healthcare / Bio', url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=150&auto=format&fit=crop&q=80' },
  { name: 'Global Enterprise', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&auto=format&fit=crop&q=80' },
]

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const DEFAULT_SEED_COMPANIES: any[] = []

const companyAdminSchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters.'),
  legalName: z.string().optional(),
  logoUrl: z.string().optional(),
  domain: z.string().min(3, 'Domain must be specified (e.g. acme.com).'),
  industry: z.string().optional(),
  officialEmail: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  taxId: z.string().optional(),
  
  // Work Shift & Geolocation Policy
  loginTime: z.string().optional(),
  graceTimeMinutes: z.union([z.number(), z.string()]).optional(),
  logoutTime: z.string().optional(),
  workingDaysPreset: z.string().optional(),
  workingDays: z.array(z.string()).optional(),
  enableGeolocationAttendance: z.boolean().optional(),
  officeLatitude: z.union([z.number(), z.string()]).optional(),
  officeLongitude: z.union([z.number(), z.string()]).optional(),
  allowedRadiusMeters: z.union([z.number(), z.string()]).optional(),

  // Sprint Points Quota Policy
  sprintPointPeriod: z.string().optional(),
  sprintPointQuota: z.union([z.number(), z.string()]).optional(),
  maxTaskPoints: z.union([z.number(), z.string()]).optional(),

  // Plan & Credentials
  plan: z.string().min(1, 'Please select a subscription tier.'),
  adminName: z.string().min(2, 'Admin name must be at least 2 characters.'),
  adminEmail: z.string().email('Please enter a valid email address.'),
  adminPassword: z.string().min(6, 'Password must be at least 6 characters.'),
  departmentId: z.string().optional(),
})

type FormValues = z.infer<typeof companyAdminSchema>

const editFormSchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters.'),
  logoUrl: z.string().optional(),
  domain: z.string().min(3, 'Domain must be specified.'),
  plan: z.string().min(1, 'Please select a plan.'),
  adminName: z.string().min(2, 'Admin name must be at least 2 characters.'),
  phone: z.string().optional(),
  address: z.string().optional(),
})

type EditFormValues = z.infer<typeof editFormSchema>

export default function ManageAdmins() {
  const [activeTab, setActiveTab] = useState<'companies' | 'admins' | 'permissions'>('companies')
  const [formSection, setFormSection] = useState<'identity' | 'contact' | 'shift' | 'points' | 'admin'>('identity')
  const [searchQuery, setSearchQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [configOpen, setConfigOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [policyOpen, setPolicyOpen] = useState(false)
  
  const [selectedCompany, setSelectedCompany] = useState<any>(null)
  const [policyCompany, setPolicyCompany] = useState<any>(null)
  const [companyPolicyState, setCompanyPolicyState] = useState<CompanyPolicy>(DEFAULT_POLICY)

  // Roles & Permissions Governance States
  const [selectedPermCompanyId, setSelectedPermCompanyId] = useState<string>('global')
  const [permissionsMatrix, setPermissionsMatrix] = useState<RolePermissionsMatrix>(getGlobalRolePermissions())
  const [customRoleLabels, setCustomRoleLabels] = useState(() => {
    try {
      const stored = localStorage.getItem('st_custom_role_labels')
      if (stored) return JSON.parse(stored)
    } catch (e) {}
    return DEFAULT_ROLE_LABELS
  })
  const [roleModalOpen, setRoleModalOpen] = useState(false)
  const [roleModalCompany, setRoleModalCompany] = useState<any>(null)
  const [compRoleMatrix, setCompRoleMatrix] = useState<RolePermissionsMatrix>(getGlobalRolePermissions())
  const [compRoleLabels, setCompRoleLabels] = useState(DEFAULT_ROLE_LABELS)

  const [activeAdminId, setActiveAdminId] = useState<string | null>(null)
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const form = useForm<FormValues>({
    resolver: zodResolver(companyAdminSchema),
    defaultValues: {
      companyName: '',
      legalName: '',
      logoUrl: PRESET_LOGOS[0].url,
      domain: '',
      industry: 'Technology & Software',
      officialEmail: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      country: 'United States',
      postalCode: '',
      taxId: '',
      
      loginTime: '09:00',
      graceTimeMinutes: 15,
      logoutTime: '18:00',
      workingDaysPreset: 'Mon to Fri (5 Days)',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      enableGeolocationAttendance: true,
      officeLatitude: 12.9716,
      officeLongitude: 77.5946,
      allowedRadiusMeters: 200,

      sprintPointPeriod: 'Monthly',
      sprintPointQuota: 60,
      maxTaskPoints: 10,

      plan: 'Pro (100 Members)',
      adminName: '',
      adminEmail: '',
      adminPassword: '',
      departmentId: '',
    },
  })

  const editForm = useForm<EditFormValues>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      companyName: '',
      logoUrl: '',
      domain: '',
      plan: 'Pro (100 Members)',
      adminName: '',
      phone: '',
      address: '',
    },
  })

  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isUploadingEditLogo, setIsUploadingEditLogo] = useState(false)
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null)
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string>('')
  const [selectedEditLogoFile, setSelectedEditLogoFile] = useState<File | null>(null)
  const [editLogoPreviewUrl, setEditLogoPreviewUrl] = useState<string>('')
  const [companyToDelete, setCompanyToDelete] = useState<any | null>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'File limit exceeded', description: 'Logo image must be under 5MB', variant: 'destructive' })
        return
      }
      setSelectedLogoFile(file)
      const preview = URL.createObjectURL(file)
      setLogoPreviewUrl(preview)
      form.setValue('logoUrl', '')
      toast({ title: 'Logo Staged', description: 'Logo image ready. It will upload to Cloudinary upon final company creation.' })
    }
  }

  const handleEditFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'File limit exceeded', description: 'Logo image must be under 5MB', variant: 'destructive' })
        return
      }
      setSelectedEditLogoFile(file)
      const preview = URL.createObjectURL(file)
      setEditLogoPreviewUrl(preview)
      editForm.setValue('logoUrl', '')
      toast({ title: 'New Logo Staged', description: 'Logo ready. It will upload to Cloudinary upon saving changes.' })
    }
  }

  // Fetch Companies - Remote database is the primary source of truth
  const { data: rawCompanies, isLoading: loadingCompanies } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const isValidCustom = (c: any) => {
        if (!c || typeof c !== 'object') return false
        if (c.id === 'comp-101' || c.id === 'comp-102') return false
        if (c.admin_email === 'admin@acme.com' || c.admin_email === 'admin@apexfin.com') return false
        if (c.name === 'Acme Global Technologies' || c.name === 'Apex Financial Systems') return false
        return true
      }

      try {
        const res = await api.get('/companies')
        const remote = safeArray(res, 'companies').filter(isValidCustom)
        try {
          localStorage.setItem('st_companies', JSON.stringify(remote))
        } catch (e) {}
        return remote
      } catch (e) {
        try {
          const rawLocal = JSON.parse(localStorage.getItem('st_companies') || '[]')
          return (Array.isArray(rawLocal) ? rawLocal : []).filter(isValidCustom)
        } catch (err) {}
        return []
      }
    }
  })
  const companies = safeArray(rawCompanies)

  // Fetch Admins
  const { data: rawTeamLeads, isLoading: loadingAdmins } = useQuery({
    queryKey: ['team-leads'],
    queryFn: async () => {
      let res: any = {}
      try { res.data = await api.get('/employee') } catch (e) {}
      const allUsers = safeArray(res.data, 'employees')
      
      const adminUsers = allUsers.filter((u: any) => {
        const r = (u.role || '').toUpperCase()
        return r === 'ADMIN'
      })

      return adminUsers.map((user: any) => ({
        id: user.id,
        name: user.fullName || user.full_name || user.email,
        email: user.email,
        department: user.employeeProfile?.department || user.department || 'Management',
        status: user.status || 'Active',
        members: allUsers.filter((u: any) => u.manager_id === user.id || u.createdByAdmin === user.email).length
      }))
    }
  })
  const teamLeads = safeArray(rawTeamLeads)

  // Fetch all staff users (HRs, Team Leads, Employees) for tenant breakdown & assignments
  const { data: rawEmployees, isLoading: loadingEmployees } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      let res: any = {}
      try { res.data = await api.get('/employee') } catch (e) {}
      const allUsers = safeArray(res.data, 'employees')
      return allUsers.filter((u: any) => {
        const r = (u.role || '').toUpperCase()
        return r !== 'SUPER_ADMIN'
      })
    }
  })
  const employees = safeArray(rawEmployees)

  // Map staff breakdown by Company Admin (Tenant)
  const companyStaffMap = useMemo(() => {
    const map = new Map<string, { hrs: any[], teamLeads: any[], members: any[], allStaff: any[] }>()

    companies.forEach((comp: any) => {
      const domainKey = (comp.domain || '').toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].trim()
      const adminEmail = (comp.admin_email || comp.official_email || '').toLowerCase().trim()
      const adminId = comp.admin_id || comp.adminId || comp.id
      const compId = comp.id

      const compStaff = employees.filter((emp: any) => {
        const empEmail = (emp.email || '').toLowerCase().trim()
        if (adminEmail && empEmail === adminEmail) return false
        if (adminId && emp.id === adminId) return false

        const empDomain = empEmail.includes('@') ? empEmail.split('@')[1].trim() : ''
        const isGeneric = ['gmail.com', 'googlemail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com', 'icloud.com'].includes(domainKey)
        const matchesDomain = Boolean(
          domainKey && 
          empDomain && 
          !isGeneric &&
          (empDomain === domainKey || empDomain.includes(domainKey) || domainKey.includes(empDomain))
        )

        const empCreatedBy = (emp.created_by_admin || emp.createdByAdmin || '').toLowerCase().trim()
        const matchesCreatedBy = Boolean(
          empCreatedBy && (
            (adminEmail && empCreatedBy === adminEmail) ||
            (adminId && empCreatedBy === adminId) ||
            (compId && empCreatedBy === compId)
          )
        )

        const empMgrId = emp.manager_id || emp.managerId
        const empMgrEmail = (emp.manager_email || emp.manager?.email || '').toLowerCase().trim()
        const matchesManager = Boolean(
          (adminId && empMgrId === adminId) ||
          (compId && empMgrId === compId) ||
          (adminEmail && empMgrEmail === adminEmail)
        )

        return matchesDomain || matchesCreatedBy || matchesManager
      })

      const hrs = compStaff.filter((e: any) => (e.role || '').toUpperCase() === 'HR')
      const teamLeads = compStaff.filter((e: any) => {
        const r = (e.role || '').toUpperCase()
        return r === 'TEAM_LEAD' || r === 'MANAGER'
      })
      const members = compStaff.filter((e: any) => {
        const r = (e.role || '').toUpperCase()
        return r === 'EMPLOYEE' || r === 'MEMBER' || r === ''
      })

      const staffBreakdown = { hrs, teamLeads, members, allStaff: compStaff }
      if (comp.id) map.set(comp.id, staffBreakdown)
      if (comp.admin_id) map.set(comp.admin_id, staffBreakdown)
      if (adminEmail) map.set(adminEmail, staffBreakdown)
    })

    return map
  }, [companies, employees])

  const companyAdmins = useMemo(() => {
    const list: any[] = []
    const seenEmails = new Set<string>()

    companies.forEach((comp: any) => {
      const emailKey = (comp.admin_email || '').toLowerCase().trim()
      if (emailKey && !seenEmails.has(emailKey)) {
        seenEmails.add(emailKey)
        const staffInfo = companyStaffMap.get(comp.id) || companyStaffMap.get(comp.admin_id) || companyStaffMap.get(emailKey)
        const allStaffCount = staffInfo ? staffInfo.allStaff.length : 0
        list.push({
          id: comp.id + '-admin',
          companyId: comp.id,
          companyName: comp.name,
          logoUrl: comp.logo_url,
          name: comp.admin_name || 'Company Admin',
          email: comp.admin_email,
          department: comp.name + ' Governance',
          status: comp.status || 'Active',
          members: allStaffCount,
          hrsCount: staffInfo ? staffInfo.hrs.length : 0,
          leadsCount: staffInfo ? staffInfo.teamLeads.length : 0,
          membersCount: staffInfo ? staffInfo.members.length : 0,
        })
      }
    })

    teamLeads.forEach((user: any) => {
      const emailKey = (user.email || '').toLowerCase().trim()
      if (emailKey && !seenEmails.has(emailKey)) {
        seenEmails.add(emailKey)
        list.push({
          id: user.id,
          companyId: null,
          companyName: user.department || 'Company Admin',
          logoUrl: PRESET_LOGOS[0].url,
          name: user.name,
          email: user.email,
          department: user.department || 'Management',
          status: user.status || 'Active',
          members: user.members || 0,
          hrsCount: 0,
          leadsCount: 0,
          membersCount: user.members || 0,
        })
      }
    })

    return list
  }, [companies, teamLeads, companyStaffMap])

  const assignMutation = useMutation({
    mutationFn: async ({ adminId, memberIds }: { adminId: string, memberIds: string[] }) => {
      try { await api.put('/employee?manager_id=' + adminId, { manager_id: null }) } catch(unassignError) {}
      if (memberIds.length > 0) {
        try { await api.put('/employee?id_in=' + memberIds.join(','), { manager_id: adminId }) } catch(assignError) {}
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-leads'] })
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      setConfigOpen(false)
      toast({ title: "Assignments Updated", description: "Reporting lines updated for this company admin." })
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  })

  const provisionCompanyMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      let finalLogoUrl = values.logoUrl || PRESET_LOGOS[0].url

      // Upload to Cloudinary only during final submission step (with base64 fallback)
      if (selectedLogoFile) {
        setIsUploadingLogo(true)
        try {
          const cloudUrl = await uploadToCloudinary(selectedLogoFile, 'logos')
          if (cloudUrl) finalLogoUrl = cloudUrl
        } catch (uploadErr: any) {
          console.warn('Cloudinary upload error during company creation, using base64 fallback:', uploadErr)
          try {
            const base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader()
              reader.onload = () => resolve(reader.result as string)
              reader.onerror = () => resolve('')
              reader.readAsDataURL(selectedLogoFile)
            })
            if (base64) finalLogoUrl = base64
          } catch (e) {}
        } finally {
          setIsUploadingLogo(false)
        }
      }

      const companyId = 'comp-' + Date.now()
      const newCompany = {
        id: companyId,
        name: values.companyName,
        legal_name: values.legalName || values.companyName,
        logo_url: finalLogoUrl,
        domain: values.domain,
        industry: values.industry || 'Technology',
        official_email: values.officialEmail || values.adminEmail,
        phone: values.phone || '',
        address: values.address || '',
        city: values.city || '',
        state: values.state || '',
        country: values.country || 'United States',
        postal_code: values.postalCode || '',
        tax_id: values.taxId || '',
        plan: values.plan,
        max_seats: values.plan.includes('500') ? 500 : values.plan.includes('200') ? 200 : 100,
        admin_name: values.adminName,
        admin_email: values.adminEmail,
        admin_password: values.adminPassword,
        status: 'Active',
        employee_count: 1,
        created_at: new Date().toISOString(),
      }

      // Save Company Policy (Shift times, Geofencing, Working Days, Points Quota)
      const enableGeo = Boolean(values.enableGeolocationAttendance)
      saveCompanyPolicy(values.domain, {
        loginTime: values.loginTime || '09:00',
        graceTimeMinutes: Number(values.graceTimeMinutes) || 15,
        logoutTime: values.logoutTime || '18:00',
        workingDaysPreset: values.workingDaysPreset || 'Mon to Fri (5 Days)',
        workingDays: values.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        enableGeolocationAttendance: enableGeo,
        officeLatitude: Number(values.officeLatitude) || 12.9716,
        officeLongitude: Number(values.officeLongitude) || 77.5946,
        allowedRadiusMeters: Number(values.allowedRadiusMeters) || 200,
        sprintPointPeriod: (values.sprintPointPeriod as 'Monthly' | 'Weekly') || 'Monthly',
        sprintPointQuota: Number(values.sprintPointQuota) || 60,
        maxTaskPoints: Number(values.maxTaskPoints) || 10,
        enabledModules: {
          taskManagement: true,
          geolocationAttendance: enableGeo,
          skillTrack: true,
          performanceAppraisals: true,
          payroll: true,
          teamChat: true
        }
      })

      // Save Company to backend API & LocalStorage
      try {
        await api.post('/companies', newCompany)
      } catch (e) {}

      try {
        const existingLocal = JSON.parse(localStorage.getItem('st_companies') || '[]')
        localStorage.setItem('st_companies', JSON.stringify([newCompany, ...existingLocal]))
        if (finalLogoUrl) {
          localStorage.setItem('latest_company_logo', finalLogoUrl)
          localStorage.setItem('company_logo', finalLogoUrl)
          localStorage.setItem('company_logo_url', finalLogoUrl)
          if (values.domain) {
            localStorage.setItem('company_logo_' + values.domain.toLowerCase().trim(), finalLogoUrl)
          }
          if (values.adminEmail) {
            localStorage.setItem('company_logo_' + values.adminEmail.toLowerCase().trim(), finalLogoUrl)
          }
        }
      } catch (e) {}

      // Create Admin User Account with explicit uppercase ADMIN role
      try {
        await api.post('/employee', {
          email: values.adminEmail,
          password: values.adminPassword,
          fullName: values.adminName,
          full_name: values.adminName,
          role: 'ADMIN',
          department: values.companyName + ' Management'
        })
      } catch (error) {
        console.error('Error provisioning admin account:', error)
      }

      return newCompany
    },
    onSuccess: (newCompany) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      queryClient.invalidateQueries({ queryKey: ['team-leads'] })
      setIsOpen(false)
      setSelectedLogoFile(null)
      setLogoPreviewUrl('')
      form.reset()
      setFormSection('identity')
      toast({
        title: "Company & SaaS Policies Provisioned",
        description: `${newCompany.name} created. Logo uploaded to Cloudinary.`,
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error Provisioning Company",
        description: error.message || "Failed to provision company account.",
        variant: "destructive"
      })
    }
  })

  const editCompanyMutation = useMutation({
    mutationFn: async (values: EditFormValues) => {
      if (!selectedCompany) return

      let finalLogoUrl = values.logoUrl || selectedCompany.logo_url

      // Upload to Cloudinary only during final submission step (with base64 fallback)
      if (selectedEditLogoFile) {
        setIsUploadingEditLogo(true)
        try {
          const cloudUrl = await uploadToCloudinary(selectedEditLogoFile, 'logos')
          if (cloudUrl) finalLogoUrl = cloudUrl
        } catch (uploadErr: any) {
          console.warn('Cloudinary upload error during company edit, using base64 fallback:', uploadErr)
          try {
            const base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader()
              reader.onload = () => resolve(reader.result as string)
              reader.onerror = () => resolve('')
              reader.readAsDataURL(selectedEditLogoFile)
            })
            if (base64) finalLogoUrl = base64
          } catch (e) {}
        } finally {
          setIsUploadingEditLogo(false)
        }
      }

      const updatedComp = {
        ...selectedCompany,
        name: values.companyName,
        logo_url: finalLogoUrl,
        domain: values.domain,
        plan: values.plan,
        admin_name: values.adminName,
        phone: values.phone || selectedCompany.phone,
        address: values.address || selectedCompany.address,
      }

      try { await api.put('/companies/' + selectedCompany.id, updatedComp) } catch(e) {}
      try {
        const existingLocal = JSON.parse(localStorage.getItem('st_companies') || '[]')
        const updatedLocal = existingLocal.map((c: any) => c.id === selectedCompany.id ? updatedComp : c)
        localStorage.setItem('st_companies', JSON.stringify(updatedLocal))
        if (finalLogoUrl) {
          localStorage.setItem('latest_company_logo', finalLogoUrl)
          localStorage.setItem('company_logo', finalLogoUrl)
          localStorage.setItem('company_logo_url', finalLogoUrl)
          if (values.domain) {
            localStorage.setItem('company_logo_' + values.domain.toLowerCase().trim(), finalLogoUrl)
          }
          if (selectedCompany?.admin_email) {
            localStorage.setItem('company_logo_' + selectedCompany.admin_email.toLowerCase().trim(), finalLogoUrl)
          }
        }
      } catch(e) {}

      return updatedComp
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      setEditOpen(false)
      setSelectedEditLogoFile(null)
      setEditLogoPreviewUrl('')
      setSelectedCompany(null)
      toast({ title: "Company Updated", description: "Company profile details and logo updated in Cloudinary." })
    },
    onError: (error: any) => {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" })
    }
  })

  const deleteCompanyMutation = useMutation({
    mutationFn: async (companyId: string) => {
      try {
        await api.delete('/companies/' + companyId)
      } catch (e) {}

      try {
        const existingLocal = JSON.parse(localStorage.getItem('st_companies') || '[]')
        const updatedLocal = existingLocal.filter((c: any) => c.id !== companyId)
        localStorage.setItem('st_companies', JSON.stringify(updatedLocal))
      } catch (e) {}

      return companyId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      queryClient.invalidateQueries({ queryKey: ['team-leads'] })
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      setCompanyToDelete(null)
      toast({
        title: "Company Deleted",
        description: "Company organization and records deleted successfully.",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete company.",
        variant: "destructive"
      })
    }
  })

  const openPolicyModal = (company: any) => {
    setPolicyCompany(company)
    const existingPolicy = getCompanyPolicy(company.domain)
    setCompanyPolicyState(existingPolicy)
    setPolicyOpen(true)
  }

  const handleSaveCompanyPolicyModal = () => {
    if (!policyCompany) return
    saveCompanyPolicy(policyCompany.domain, companyPolicyState)
    setPolicyOpen(false)
    toast({
      title: "SaaS Policy Updated",
      description: `Updated work shift, geofence, and point quotas for ${policyCompany.name} (${policyCompany.domain}).`,
    })
  }

  const currentPermCompany = useMemo(() => {
    if (selectedPermCompanyId === 'global') return null
    return companies.find((c: any) => c.id === selectedPermCompanyId || c.domain === selectedPermCompanyId) || null
  }, [companies, selectedPermCompanyId])

  const handleSelectPermCompany = (val: string) => {
    setSelectedPermCompanyId(val)
    if (val === 'global') {
      setPermissionsMatrix(getGlobalRolePermissions())
      setCustomRoleLabels(getCompanyRoleLabels('global'))
    } else {
      const comp = companies.find((c: any) => c.id === val || c.domain === val)
      const identifier = comp?.domain || comp?.id || val
      setCompRoleMatrix(getCompanyRolePermissions(identifier))
      setCompRoleLabels(getCompanyRoleLabels(identifier))
    }
  }

  const handleToggleActivePermission = (role: Role, permKey: Permission) => {
    if (role === 'super_admin') return
    if (selectedPermCompanyId === 'global') {
      setPermissionsMatrix(prev => {
        const currentPerms = prev[role] || []
        const exists = currentPerms.includes(permKey)
        const updated = exists ? currentPerms.filter(p => p !== permKey) : [...currentPerms, permKey]
        return { ...prev, [role]: updated }
      })
    } else {
      setCompRoleMatrix(prev => {
        const currentPerms = prev[role] || []
        const exists = currentPerms.includes(permKey)
        const updated = exists ? currentPerms.filter(p => p !== permKey) : [...currentPerms, permKey]
        return { ...prev, [role]: updated }
      })
    }
  }

  const handleActiveRoleLabelChange = (role: Role, title: string) => {
    if (selectedPermCompanyId === 'global') {
      setCustomRoleLabels(prev => ({
        ...prev,
        [role]: { ...prev[role], title }
      }))
    } else {
      setCompRoleLabels(prev => ({
        ...prev,
        [role]: { ...prev[role], title }
      }))
    }
  }

  const handleSaveActivePermissions = () => {
    if (selectedPermCompanyId === 'global') {
      saveGlobalRolePermissions(permissionsMatrix)
      saveCompanyRoleLabels('global', customRoleLabels)
      toast({
        title: "Global Permission Matrix Saved",
        description: "Default platform roles and permissions updated across system roles.",
      })
    } else {
      const comp = currentPermCompany || companies.find((c: any) => c.id === selectedPermCompanyId || c.domain === selectedPermCompanyId)
      const identifier = comp?.domain || comp?.id || selectedPermCompanyId
      saveCompanyRolePermissions(identifier, compRoleMatrix)
      saveCompanyRoleLabels(identifier, compRoleLabels)
      toast({
        title: "Company Roles & Permissions Saved",
        description: `Updated role permissions and titles specifically for ${comp?.name || identifier} (${comp?.domain || identifier}).`,
      })
    }
  }

  const handleCopyFromGlobalTemplate = () => {
    const globalMatrix = getGlobalRolePermissions()
    const globalLabels = getCompanyRoleLabels('global')
    setCompRoleMatrix(globalMatrix)
    setCompRoleLabels(globalLabels)
    toast({
      title: "Global Template Applied",
      description: `Copied global template permissions to ${currentPermCompany?.name || 'selected company'}. Click Save to persist.`,
    })
  }

  const handleResetActivePermissions = () => {
    if (selectedPermCompanyId === 'global') {
      setPermissionsMatrix({ ...ROLE_PERMISSIONS })
      setCustomRoleLabels(DEFAULT_ROLE_LABELS)
      toast({
        title: "Reset to Default Matrix",
        description: "Global matrix restored to default platform template.",
      })
    } else {
      setCompRoleMatrix({ ...ROLE_PERMISSIONS })
      setCompRoleLabels(DEFAULT_ROLE_LABELS)
      toast({
        title: "Reset to Standard Permissions",
        description: `Reset permissions for ${currentPermCompany?.name || 'company'} to default settings. Click Save to persist.`,
      })
    }
  }

  const openTenantRoleModal = (comp: any) => {
    setRoleModalCompany(comp)
    setCompRoleMatrix(getCompanyRolePermissions(comp.domain || comp.id))
    setCompRoleLabels(getCompanyRoleLabels(comp.domain || comp.id))
    setRoleModalOpen(true)
  }

  const handleOpenCompanyPermissionsTab = (comp: any) => {
    handleSelectPermCompany(comp.id || comp.domain)
    setActiveTab('permissions')
  }

  const handleSaveTenantRoleModal = () => {
    if (!roleModalCompany) return
    const identifier = roleModalCompany.domain || roleModalCompany.id
    saveCompanyRolePermissions(identifier, compRoleMatrix)
    saveCompanyRoleLabels(identifier, compRoleLabels)
    setRoleModalOpen(false)
    toast({
      title: "Tenant Role Matrix Saved",
      description: `Updated custom role permissions for ${roleModalCompany.name} (${roleModalCompany.domain || identifier}).`,
    })
  }

  const handleToggleTenantPermission = (role: Role, permKey: Permission) => {
    if (role === 'super_admin') return
    setCompRoleMatrix(prev => {
      const currentPerms = prev[role] || []
      const exists = currentPerms.includes(permKey)
      const updated = exists ? currentPerms.filter(p => p !== permKey) : [...currentPerms, permKey]
      return { ...prev, [role]: updated }
    })
  }

  const filteredCompanies = useMemo(() => {
    return companies.filter(c => {
      if (!c) return false
      if (!searchQuery || searchQuery.trim() === '') return true
      const q = searchQuery.toLowerCase().trim()
      const nameMatch = (c.name || c.companyName || '').toLowerCase().includes(q)
      const domainMatch = (c.domain || '').toLowerCase().includes(q)
      const emailMatch = (c.admin_email || c.official_email || '').toLowerCase().includes(q)
      const adminMatch = (c.admin_name || '').toLowerCase().includes(q)
      const industryMatch = (c.industry || '').toLowerCase().includes(q)
      return nameMatch || domainMatch || emailMatch || adminMatch || industryMatch
    })
  }, [companies, searchQuery])

  const filteredAdmins = useMemo(() => {
    return companyAdmins.filter(a => {
      if (!a) return false
      if (!searchQuery || searchQuery.trim() === '') return true
      const q = searchQuery.toLowerCase().trim()
      const nameMatch = (a.name || '').toLowerCase().includes(q)
      const emailMatch = (a.email || '').toLowerCase().includes(q)
      const compMatch = (a.companyName || a.department || '').toLowerCase().includes(q)
      return nameMatch || emailMatch || compMatch
    })
  }, [companyAdmins, searchQuery])

  const totalSeats = companies.reduce((sum, c) => sum + (c.max_seats || 100), 0)

  return (
    <div className="space-y-6 sa-page-enter text-slate-800 pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-200">
              <Building2 className="w-5 h-5" />
            </span>
            <h2 className="text-2xl font-extrabold tracking-tight sa-gradient-text">Multi-Tenant Company & Policy Setup</h2>
          </div>
          <p className="text-slate-400 mt-1 text-xs sm:text-sm">Provision companies, shift times, grace periods, working days, GPS geofencing, sprint point quotas, and admin credentials.</p>
        </div>
        
        {/* Provision Dialog */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="sa-btn-primary h-10 px-4 rounded-xl font-bold flex items-center shadow-md">
              <Building className="mr-2 h-4 w-4" />
              Provision Company & Admin
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[680px] bg-white/95 backdrop-blur-xl border-slate-200 max-h-[92vh] overflow-y-auto p-6 rounded-2xl">
            <DialogHeader className="pb-2">
              <DialogTitle className="text-slate-900 font-extrabold text-xl flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" /> Provision Company & SaaS Policies
              </DialogTitle>
              <DialogDescription className="text-slate-500 text-xs">
                Setup company identity, shift times, grace periods, GPS geofencing, sprint point quotas (60/50 pts), and admin credentials.
              </DialogDescription>
            </DialogHeader>

            {/* Form Section Navigation Tabs */}
            <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl mb-4 border border-slate-200/60 overflow-x-auto">
              {[
                { id: 'identity', label: '1. Identity', icon: Building2 },
                { id: 'contact', label: '2. Address', icon: MapPin },
                { id: 'shift', label: '3. Work Shift & Geo', icon: Clock },
                { id: 'points', label: '4. Point Quotas', icon: Award },
                { id: 'admin', label: '5. Admin Account', icon: KeyRound },
              ].map(sec => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setFormSection(sec.id as any)}
                  className={`flex-1 py-1.5 px-2 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 shrink-0 ${
                    formSection === sec.id ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <sec.icon className="w-3 h-3" /> {sec.label}
                </button>
              ))}
            </div>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit((v) => provisionCompanyMutation.mutate(v))} className="space-y-4">
                
                {/* SECTION 1: Identity & Logo */}
                {formSection === 'identity' && (
                  <div className="space-y-3.5 sa-page-enter">
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="companyName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700 text-xs font-semibold">Company Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Acme Corp" className="bg-white border-slate-200 h-9 text-xs" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="legalName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700 text-xs font-semibold">Legal Entity Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Acme International Inc." className="bg-white border-slate-200 h-9 text-xs" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="domain"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700 text-xs font-semibold">Company Domain *</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. acme.com" className="bg-white border-slate-200 h-9 text-xs" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="industry"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700 text-xs font-semibold">Industry Sector</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-white border-slate-200 h-9 text-xs">
                                  <SelectValue placeholder="Select industry" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-white border-slate-200">
                                <SelectItem value="Technology & Software">Technology & Software</SelectItem>
                                <SelectItem value="FinTech & Banking">FinTech & Banking</SelectItem>
                                <SelectItem value="Healthcare & Bio">Healthcare & Bio</SelectItem>
                                <SelectItem value="Retail & E-Commerce">Retail & E-Commerce</SelectItem>
                                <SelectItem value="Education & Academy">Education & Academy</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-3">
                      <label className="text-slate-800 text-xs font-extrabold flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5 text-indigo-600" /> Company Branding Logo
                        </span>
                        {form.watch('logoUrl') && (
                          <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Logo Attached ✓
                          </span>
                        )}
                      </label>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                        <div className="p-3 bg-white rounded-lg border border-dashed border-indigo-200 text-center flex flex-col items-center justify-center relative cursor-pointer hover:bg-indigo-50/30 transition-colors">
                          <Upload className="w-4 h-4 text-indigo-500 mb-1" />
                          <span className="text-[11px] font-bold text-slate-700">Choose Logo File</span>
                          <span className="text-[9px] text-slate-400">Uploads to Cloudinary on Submit</span>
                          <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>

                        <div className="flex items-center gap-2">
                          {(logoPreviewUrl || form.watch('logoUrl')) ? (
                            <div className="flex items-center gap-2 p-1.5 bg-white border border-slate-200 rounded-lg w-full">
                              <img src={logoPreviewUrl || form.watch('logoUrl')} alt="Logo preview" className="w-9 h-9 rounded object-contain bg-slate-50 border border-slate-100" />
                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-bold text-slate-700 truncate">
                                  {logoPreviewUrl ? 'Logo Selected (Uploads on Create)' : 'Logo Active'}
                                </p>
                                <p className="text-[9px] text-slate-400 truncate">
                                  {selectedLogoFile ? selectedLogoFile.name : form.watch('logoUrl')}
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 px-1.5 text-[10px] text-slate-400 hover:text-rose-600"
                                onClick={() => {
                                  setSelectedLogoFile(null)
                                  setLogoPreviewUrl('')
                                  form.setValue('logoUrl', '')
                                }}
                              >
                                Clear
                              </Button>
                            </div>
                          ) : (
                            <FormField
                              control={form.control}
                              name="logoUrl"
                              render={({ field }) => (
                                <FormItem className="space-y-1 w-full">
                                  <FormLabel className="text-slate-600 text-[10px] font-bold">Or Logo URL</FormLabel>
                                  <FormControl>
                                    <Input placeholder="https://..." className="bg-white border-slate-200 h-8 text-xs" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <Button type="button" onClick={() => setFormSection('contact')} className="sa-btn-primary h-8 px-4 text-xs font-bold">
                        Next: Address & Contact →
                      </Button>
                    </div>
                  </div>
                )}

                {/* SECTION 2: Contact & Address */}
                {formSection === 'contact' && (
                  <div className="space-y-3.5 sa-page-enter">
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="officialEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700 text-xs font-semibold">Official Corporate Email</FormLabel>
                            <FormControl>
                              <Input placeholder="contact@acme.com" type="email" className="bg-white border-slate-200 h-9 text-xs" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700 text-xs font-semibold">Corporate Phone</FormLabel>
                            <FormControl>
                              <Input placeholder="+1 (555) 234-5678" className="bg-white border-slate-200 h-9 text-xs" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 text-xs font-semibold">Corporate Office Address</FormLabel>
                          <FormControl>
                            <Input placeholder="100 Innovation Way, Suite 400" className="bg-white border-slate-200 h-9 text-xs" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700 text-xs font-semibold">City</FormLabel>
                            <FormControl>
                              <Input placeholder="San Francisco" className="bg-white border-slate-200 h-9 text-xs" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="taxId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700 text-xs font-semibold">Tax ID / Registration</FormLabel>
                            <FormControl>
                              <Input placeholder="US-987654321" className="bg-white border-slate-200 h-9 text-xs" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="pt-2 flex justify-between">
                      <Button type="button" variant="outline" onClick={() => setFormSection('identity')} className="h-8 px-3 text-xs border-slate-200">
                        ← Back
                      </Button>
                      <Button type="button" onClick={() => setFormSection('shift')} className="sa-btn-primary h-8 px-4 text-xs font-bold">
                        Next: Work Shift & Geo Policy →
                      </Button>
                    </div>
                  </div>
                )}

                {/* SECTION 3: Work Shift, Grace Time & Geolocation */}
                {formSection === 'shift' && (
                  <div className="space-y-3.5 sa-page-enter">
                    <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
                      <span className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" /> Work Shift & Grace Period Policy
                      </span>

                      <div className="grid grid-cols-3 gap-2.5">
                        <FormField
                          control={form.control}
                          name="loginTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-700 text-[11px] font-bold">Login Time *</FormLabel>
                              <FormControl>
                                <Input type="time" className="bg-white border-slate-200 h-8 text-xs font-bold" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="graceTimeMinutes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-700 text-[11px] font-bold">Grace (Mins) *</FormLabel>
                              <FormControl>
                                <Input type="number" min={0} max={60} className="bg-white border-slate-200 h-8 text-xs font-bold" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="logoutTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-700 text-[11px] font-bold">Logout Time *</FormLabel>
                              <FormControl>
                                <Input type="time" className="bg-white border-slate-200 h-8 text-xs font-bold" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="workingDaysPreset"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700 text-[11px] font-bold">Working Days Schedule *</FormLabel>
                            <Select onValueChange={(val) => {
                              field.onChange(val)
                              let days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
                              if (val === 'Mon to Sat (6 Days)') days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
                              else if (val === 'All 7 Days (7 Days)') days = DAYS_OF_WEEK
                              form.setValue('workingDays', days)
                            }} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-white border-slate-200 h-8 text-xs font-bold">
                                  <SelectValue placeholder="Select working days" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-white border-slate-200">
                                <SelectItem value="Mon to Fri (5 Days)">Mon to Fri (5 Days)</SelectItem>
                                <SelectItem value="Mon to Sat (6 Days)">Mon to Sat (6 Days)</SelectItem>
                                <SelectItem value="All 7 Days (7 Days)">All 7 Days (7 Days)</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="p-3.5 bg-emerald-50/50 border border-emerald-200/80 rounded-xl space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-extrabold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                          <Navigation className="w-3.5 h-3.5 text-emerald-600" /> GPS Geolocation Attendance Access
                        </span>
                        <FormField
                          control={form.control}
                          name="enableGeolocationAttendance"
                          render={({ field }) => (
                            <button
                              type="button"
                              onClick={() => field.onChange(!field.value)}
                              className={`w-10 h-5 rounded-full transition-colors relative ${field.value ? 'bg-emerald-600' : 'bg-slate-300'}`}
                            >
                              <span className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${field.value ? 'right-0.5' : 'left-0.5'}`} />
                            </button>
                          )}
                        />
                      </div>

                      {form.watch('enableGeolocationAttendance') && (
                        <div className="grid grid-cols-3 gap-2">
                          <FormField
                            control={form.control}
                            name="officeLatitude"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-slate-700 text-[10px] font-bold">Office Latitude</FormLabel>
                                <FormControl>
                                  <Input type="number" step="any" className="bg-white border-slate-200 h-8 text-[11px] font-mono" {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="officeLongitude"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-slate-700 text-[10px] font-bold">Office Longitude</FormLabel>
                                <FormControl>
                                  <Input type="number" step="any" className="bg-white border-slate-200 h-8 text-[11px] font-mono" {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="allowedRadiusMeters"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-slate-700 text-[10px] font-bold">Geofence Radius (Meters)</FormLabel>
                                <FormControl>
                                  <Input type="number" className="bg-white border-slate-200 h-8 text-[11px]" {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>

                    <div className="pt-2 flex justify-between">
                      <Button type="button" variant="outline" onClick={() => setFormSection('contact')} className="h-8 px-3 text-xs border-slate-200">
                        ← Back
                      </Button>
                      <Button type="button" onClick={() => setFormSection('points')} className="sa-btn-primary h-8 px-4 text-xs font-bold">
                        Next: Point Quotas & SaaS Modules →
                      </Button>
                    </div>
                  </div>
                )}

                {/* SECTION 4: Sprint Point Quotas & SaaS Modules */}
                {formSection === 'points' && (
                  <div className="space-y-3.5 sa-page-enter">
                    <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-amber-600" /> Monthly Sprint Points Quota Setup
                        </span>
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-200">
                          Monthly Cycle
                        </span>
                      </div>

                      <FormField
                        control={form.control}
                        name="sprintPointQuota"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-800 text-xs font-bold">Monthly Sprint Points Quota per Member *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min={1} 
                                max={1000} 
                                placeholder="e.g. 60 or 50 points" 
                                className="bg-white border-amber-300 focus:ring-amber-500 h-10 text-sm font-extrabold text-amber-900" 
                                {...field} 
                              />
                            </FormControl>
                            <p className="text-[11px] text-slate-500 mt-1">
                              Input the total sprint points allocated to each member/student per month (e.g. 60 points or 50 points per month).
                            </p>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="pt-2 flex justify-between">
                      <Button type="button" variant="outline" onClick={() => setFormSection('shift')} className="h-8 px-3 text-xs border-slate-200">
                        ← Back
                      </Button>
                      <Button type="button" onClick={() => setFormSection('admin')} className="sa-btn-primary h-8 px-4 text-xs font-bold">
                        Next: Admin Credentials →
                      </Button>
                    </div>
                  </div>
                )}

                {/* SECTION 5: Plan & Admin Credentials */}
                {formSection === 'admin' && (
                  <div className="space-y-3.5 sa-page-enter">
                    <FormField
                      control={form.control}
                      name="plan"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 text-xs font-semibold">Subscription Tier & Capacity Limit *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-white border-slate-200 h-9 text-xs font-semibold">
                                <SelectValue placeholder="Select plan" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-white border-slate-200">
                              <SelectItem value="Starter (50 Members)">Starter Tier (50 Members Max Capacity)</SelectItem>
                              <SelectItem value="Pro (100 Members)">Pro Tier (100 Members Max Capacity)</SelectItem>
                              <SelectItem value="Enterprise (500 Members)">Enterprise Tier (500 Members Max Capacity)</SelectItem>
                              <SelectItem value="Custom Enterprise (1000 Members)">Custom Enterprise (1000 Members Max Capacity)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                      <span className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-indigo-600" /> Designated Company Admin Login Credentials
                      </span>

                      <FormField
                        control={form.control}
                        name="adminName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700 text-xs font-semibold">Admin Full Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Sarah Connor" className="bg-white border-slate-200 h-9 text-xs" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name="adminEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-700 text-xs font-semibold">Admin Login Email *</FormLabel>
                              <FormControl>
                                <Input placeholder="admin@company.com" type="email" className="bg-white border-slate-200 h-9 text-xs" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="adminPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-700 text-xs font-semibold">Initial Password *</FormLabel>
                              <FormControl>
                                <Input placeholder="••••••••" type="password" className="bg-white border-slate-200 h-9 text-xs" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <Button type="button" variant="outline" onClick={() => setFormSection('points')} className="h-8 px-3 text-xs border-slate-200">
                        ← Back
                      </Button>

                      <Button type="submit" disabled={provisionCompanyMutation.isPending} className="sa-btn-primary h-9 px-5 text-xs font-bold shadow-md">
                        {provisionCompanyMutation.isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                        Provision Company & SaaS Policies
                      </Button>
                    </div>
                  </div>
                )}

              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Companies</span>
            <Building2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black sa-gradient-text">{companies.length}</div>
          <p className="text-[11px] text-slate-400 font-medium">Managed company accounts</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Company Admins</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{companyAdmins.length}</div>
          <p className="text-[11px] text-emerald-600 font-medium">Provisioned admin logins</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Total Seat Pool</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-600">{totalSeats.toLocaleString()}</div>
          <p className="text-[11px] text-blue-600 font-medium">Combined member capacity</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>System Status</span>
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-teal-600">Active</div>
          <p className="text-[11px] text-teal-600 font-medium">All tenant nodes online</p>
        </div>
      </div>

      {/* Interactive Tabs Header & Search */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('companies')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'companies' 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Company Directory ({filteredCompanies.length})
            </button>
            <button
              onClick={() => setActiveTab('admins')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'admins' 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Admin Credentials ({filteredAdmins.length})
            </button>
            <button
              onClick={() => setActiveTab('permissions')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'permissions' 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Roles & Permissions Matrix
            </button>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <Input
              placeholder="Search companies, domain, admin..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-8 bg-slate-50 border-slate-200 text-xs rounded-xl"
            />
          </div>
        </div>

        {/* Tab 1: Company Cards Grid */}
        {activeTab === 'companies' && (
          <div className="p-5">
            {loadingCompanies ? (
              <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600" /></div>
            ) : filteredCompanies.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">No company records found. Click "Provision Company & Admin" above to create one.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCompanies.map((comp) => {
                  const compPolicy = getCompanyPolicy(comp.domain)
                  return (
                    <div key={comp.id} className="sa-card sa-gradient-border p-4 rounded-2xl hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                      
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img 
                            src={comp.logo_url || PRESET_LOGOS[0].url} 
                            alt={comp.name} 
                            className="w-11 h-11 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0" 
                          />
                          <div>
                            <h3 className="font-extrabold text-slate-900 text-sm leading-snug">{comp.name}</h3>
                            <span className="text-[11px] text-indigo-600 font-semibold flex items-center gap-1 mt-0.5">
                              <Globe className="w-3 h-3" /> {comp.domain || 'domain.com'}
                            </span>
                          </div>
                        </div>

                        <span className="sa-badge-emerald text-[10px] px-2 py-0.5 font-extrabold rounded-full">
                          {comp.status || 'Active'}
                        </span>
                      </div>

                      <div className="p-3 bg-slate-50/90 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Company Admin</span>
                          <span className="font-extrabold text-slate-800 text-[11px] truncate max-w-[170px]" title={comp.admin_email}>
                            {comp.admin_name || 'Admin'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Shift & Points</span>
                          <span className="font-bold text-slate-700 text-[10px]">
                            {compPolicy.loginTime} | {compPolicy.sprintPointQuota} pts/mo
                          </span>
                        </div>

                        {/* Tenant Staff Hierarchy Breakdown Strip */}
                        {(() => {
                          const staff = companyStaffMap.get(comp.id) || companyStaffMap.get(comp.admin_id) || companyStaffMap.get(comp.admin_email?.toLowerCase())
                          const hrCount = staff?.hrs.length || 0
                          const leadCount = staff?.teamLeads.length || 0
                          const memberCount = staff?.members.length || 0
                          const totalStaff = staff ? staff.allStaff.length : 0
                          return (
                            <>
                              <div className="pt-1.5 border-t border-slate-200/60 grid grid-cols-3 gap-1 text-center">
                                <div className="p-1 bg-blue-50 rounded border border-blue-100">
                                  <span className="text-[9px] font-extrabold text-blue-600 block">HR Managers</span>
                                  <span className="font-black text-xs text-blue-900">{hrCount}</span>
                                </div>
                                <div className="p-1 bg-amber-50 rounded border border-amber-100">
                                  <span className="text-[9px] font-extrabold text-amber-600 block">Team Leads</span>
                                  <span className="font-black text-xs text-amber-900">{leadCount}</span>
                                </div>
                                <div className="p-1 bg-emerald-50 rounded border border-emerald-100">
                                  <span className="text-[9px] font-extrabold text-emerald-600 block">Members</span>
                                  <span className="font-black text-xs text-emerald-900">{memberCount}</span>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <div className="flex justify-between text-[10px] font-bold text-slate-500">
                                  <span>Total Enrolled Staff</span>
                                  <span>{totalStaff} / {comp.max_seats || 100} Seats</span>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                  <div 
                                    className="bg-indigo-600 h-full rounded-full transition-all" 
                                    style={{ width: `${Math.min(100, Math.round((totalStaff / (comp.max_seats || 100)) * 100))}%` }} 
                                  />
                                </div>
                              </div>
                            </>
                          )
                        })()}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openPolicyModal(comp)}
                            className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 text-xs font-bold h-8 px-2 rounded-lg flex items-center gap-1"
                          >
                            <Sliders className="w-3.5 h-3.5" /> Policy
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenCompanyPermissionsTab(comp)}
                            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 text-xs font-bold h-8 px-2 rounded-lg flex items-center gap-1"
                            title={`Configure custom roles & permissions for ${comp.name}`}
                          >
                            <ShieldCheck className="w-3.5 h-3.5" /> Roles
                          </Button>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedCompany(comp)
                              setSelectedEditLogoFile(null)
                              setEditLogoPreviewUrl('')
                              editForm.reset({
                                companyName: comp.name,
                                logoUrl: comp.logo_url,
                                domain: comp.domain,
                                plan: comp.plan,
                                adminName: comp.admin_name,
                                phone: comp.phone || '',
                                address: comp.address || '',
                              })
                              setEditOpen(true)
                            }}
                            className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs h-8 px-2 rounded-lg"
                          >
                            <Pencil className="w-3 h-3 mr-1" /> Edit
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const targetAdminId = comp.admin_id || comp.id
                              setActiveAdminId(targetAdminId)
                              const staff = companyStaffMap.get(comp.id) || companyStaffMap.get(comp.admin_id) || companyStaffMap.get(comp.admin_email?.toLowerCase())
                              const currentMembers = staff?.allStaff?.map((e: any) => e.id) || employees?.filter((e: any) => e.manager_id === targetAdminId || e.manager_id === comp.id).map((e: any) => e.id) || []
                              setSelectedMembers(currentMembers)
                              setConfigOpen(true)
                            }}
                            className="border-slate-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 text-xs h-8 px-2 rounded-lg"
                          >
                            <Settings className="w-3 h-3 mr-1" /> Team
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCompanyToDelete(comp)}
                            className="border-slate-200 text-rose-600 hover:bg-rose-50 hover:border-rose-200 text-xs h-8 px-2 rounded-lg"
                            title="Delete Company"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>

                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Admin Accounts Table */}
        {activeTab === 'admins' && (
          <div className="p-4">
            <div className="rounded-xl border border-slate-200/80 overflow-hidden">
              <Table>
                <TableHeader className="sa-table-header">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold text-slate-500 text-xs uppercase tracking-wider">Company Admin & Email</TableHead>
                    <TableHead className="font-semibold text-slate-500 text-xs uppercase tracking-wider">Company / Department</TableHead>
                    <TableHead className="font-semibold text-slate-500 text-xs uppercase tracking-wider">Status</TableHead>
                    <TableHead className="font-semibold text-slate-500 text-xs uppercase tracking-wider">Managed Staff</TableHead>
                    <TableHead className="text-right font-semibold text-slate-500 text-xs uppercase tracking-wider">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingAdmins ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                        <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-indigo-500" />
                        <span className="text-xs">Loading admin accounts...</span>
                      </TableCell>
                    </TableRow>
                  ) : filteredAdmins.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-slate-400 text-sm">
                        No company admin accounts found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAdmins.map((admin: any) => (
                      <TableRow key={admin.id} className="sa-table-row hover:bg-slate-50/50 transition-colors">
                        <TableCell className="font-semibold text-slate-800 text-sm py-3">
                          <div className="flex items-center gap-2.5">
                            <img src={admin.logoUrl || PRESET_LOGOS[0].url} alt={admin.name} className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0" />
                            <div>
                              <p className="font-bold text-slate-900">{admin.name}</p>
                              <p className="text-[11px] font-normal text-slate-500">{admin.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600 text-xs font-bold">{admin.companyName || admin.department}</TableCell>
                        <TableCell>
                          <span className="sa-badge-emerald text-[11px] px-2 py-0.5 font-bold">
                            {admin.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-slate-600 font-bold text-xs">{admin.members} Staff Members</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1.5">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-slate-200 text-purple-600 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 h-8 text-xs px-2.5 rounded-lg font-semibold"
                              onClick={() => {
                                const matchedComp = companies.find((c: any) => c.id === admin.companyId || c.admin_email === admin.email || c.id === admin.id)
                                if (matchedComp) handleOpenCompanyPermissionsTab(matchedComp)
                              }}
                              title="Configure custom roles & permissions for this company"
                            >
                              <ShieldCheck className="h-3 w-3 mr-1" />
                              Roles
                            </Button>

                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 h-8 text-xs px-2.5 rounded-lg font-semibold"
                              onClick={() => {
                                setActiveAdminId(admin.companyId || admin.id)
                                const currentMembers = employees?.filter((e: any) => e.manager_id === (admin.companyId || admin.id)).map((e: any) => e.id) || []
                                setSelectedMembers(currentMembers)
                                setConfigOpen(true)
                              }}
                            >
                              <Settings className="h-3 w-3 mr-1" />
                              Configure Staff
                            </Button>

                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-slate-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 h-8 text-xs px-2 rounded-lg"
                              onClick={() => {
                                const matchedComp = companies.find((c: any) => c.id === admin.companyId || c.admin_email === admin.email || c.id === admin.id)
                                setCompanyToDelete(matchedComp || { id: admin.companyId || admin.id, name: admin.companyName || admin.name, domain: admin.email })
                              }}
                              title="Delete Company"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Tab 3: Company-Specific & Global Roles & Permissions Governance Matrix */}
        {activeTab === 'permissions' && (
          <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 text-white p-5 rounded-2xl shadow-lg">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-extrabold text-lg text-white">
                    {selectedPermCompanyId === 'global' 
                      ? 'Global SaaS Roles & Permissions Baseline Template'
                      : `${currentPermCompany?.name || 'Company'} — Custom Roles & Permissions Matrix`}
                  </h3>
                </div>
                <p className="text-xs text-indigo-200 mt-1">
                  {selectedPermCompanyId === 'global'
                    ? 'Default baseline role capabilities applied across newly provisioned organizations.'
                    : `Configure isolated, company-specific feature permissions and role titles for ${currentPermCompany?.name || 'this tenant'}.`}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {selectedPermCompanyId !== 'global' && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleCopyFromGlobalTemplate}
                    className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-bold text-xs h-9 px-3 rounded-xl shadow-xs flex items-center gap-1.5"
                    title="Copy permissions from global baseline template"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy Global
                  </Button>
                )}
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleResetActivePermissions}
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-bold text-xs h-9 px-3 rounded-xl shadow-xs flex items-center gap-1.5"
                  title="Reset to standard defaults"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset
                </Button>
                <Button 
                  onClick={handleSaveActivePermissions} 
                  className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs h-9 px-5 rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> Save {selectedPermCompanyId === 'global' ? 'Global Matrix' : 'Company Matrix'}
                </Button>
              </div>
            </div>

            {/* Interactive Target Company Scope Selector Bar */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-indigo-600" /> Target Company Scope
                </Label>
                <p className="text-[11px] text-slate-500">
                  Select a specific company to configure its dedicated role permissions independently, or choose the global template.
                </p>
              </div>

              <div className="w-full md:w-80">
                <Select value={selectedPermCompanyId} onValueChange={handleSelectPermCompany}>
                  <SelectTrigger className="h-10 bg-white border-slate-300 font-bold text-xs rounded-xl shadow-2xs">
                    <SelectValue placeholder="Choose company scope..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 shadow-xl max-h-72">
                    <SelectItem value="global" className="font-extrabold text-indigo-600">
                      🌐 Global Platform Template (Default System Roles)
                    </SelectItem>
                    {companies.map((c: any) => (
                      <SelectItem key={c.id || c.domain} value={c.id || c.domain} className="text-xs font-semibold">
                        🏢 {c.name} — {c.domain || 'no domain'} ({c.plan || 'Active'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Scope Information Strip */}
            {selectedPermCompanyId !== 'global' && currentPermCompany && (
              <div className="p-4 bg-purple-50/70 border border-purple-200/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <img 
                    src={currentPermCompany.logo_url || PRESET_LOGOS[0].url} 
                    alt={currentPermCompany.name} 
                    className="w-10 h-10 rounded-xl object-cover border border-purple-200 shadow-2xs shrink-0" 
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-purple-950 text-sm">{currentPermCompany.name}</span>
                      <span className="bg-purple-200/70 text-purple-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                        {currentPermCompany.plan || 'Enterprise'}
                      </span>
                    </div>
                    <p className="text-[11px] text-purple-700 font-medium mt-0.5">
                      Domain: <span className="font-bold">{currentPermCompany.domain}</span> | Admin: <span className="font-bold">{currentPermCompany.admin_email || currentPermCompany.official_email}</span>
                    </p>
                  </div>
                </div>

                <span className="text-[11px] font-bold text-purple-900 bg-white/90 px-3 py-1.5 rounded-xl border border-purple-200/60 shadow-2xs shrink-0">
                  🔒 Individual Company Role Isolation Active
                </span>
              </div>
            )}

            {/* Custom Role Labels Customization Cards */}
            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Pencil className="w-3.5 h-3.5 text-indigo-600" /> 
                {selectedPermCompanyId === 'global' ? 'Global Role Display Titles' : `Role Display Titles for ${currentPermCompany?.name || 'Company'}`}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {(['admin', 'hr', 'team_lead', 'employee'] as Role[]).map((r) => {
                  const activeLabels = selectedPermCompanyId === 'global' ? customRoleLabels : compRoleLabels
                  const label = activeLabels[r] || DEFAULT_ROLE_LABELS[r]
                  return (
                    <div key={r} className="p-3 bg-white rounded-xl border border-slate-200 space-y-2 text-xs shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">{r.replace('_', ' ')}</span>
                      <Input
                        value={label.title}
                        onChange={(e) => handleActiveRoleLabelChange(r, e.target.value)}
                        className="h-8 text-xs font-extrabold border-slate-200 bg-slate-50/50"
                      />
                      <p className="text-[10px] text-slate-500 leading-tight line-clamp-2">{label.description}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Interactive Roles & Permission Matrix Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs bg-white">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-900 hover:bg-slate-900 text-white border-none">
                    <TableHead className="font-extrabold text-slate-200 text-xs w-[340px]">Feature & Permission Capability</TableHead>
                    {(['admin', 'hr', 'team_lead', 'employee'] as Role[]).map(r => {
                      const activeLabels = selectedPermCompanyId === 'global' ? customRoleLabels : compRoleLabels
                      return (
                        <TableHead key={r} className="font-extrabold text-slate-200 text-xs text-center">
                          {(activeLabels[r]?.title || r.replace('_', ' '))}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {PERMISSION_CATEGORIES.map((cat) => (
                    <Fragment key={cat.id}>
                      <TableRow className="bg-slate-100/80 hover:bg-slate-100/80 border-b border-slate-200">
                        <TableCell colSpan={5} className="font-extrabold text-xs text-indigo-900 py-2.5">
                          <span className="uppercase tracking-wider text-[11px] font-black">{cat.name}</span>
                          <span className="text-slate-500 font-normal ml-2 text-[11px]">— {cat.description}</span>
                        </TableCell>
                      </TableRow>

                      {cat.permissions.map((perm) => (
                        <TableRow key={perm.key} className="hover:bg-slate-50/70 border-b border-slate-100">
                          <TableCell className="py-3">
                            <div className="font-bold text-slate-900 text-xs">{perm.label}</div>
                            <div className="text-[11px] text-slate-500 leading-snug">{perm.description}</div>
                          </TableCell>

                          {(['admin', 'hr', 'team_lead', 'employee'] as Role[]).map((roleKey) => {
                            const activeMatrix = selectedPermCompanyId === 'global' ? permissionsMatrix : compRoleMatrix
                            const isChecked = (activeMatrix[roleKey] || []).includes(perm.key)
                            return (
                              <TableCell key={roleKey} className="text-center align-middle py-3">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleActivePermission(roleKey, perm.key)}
                                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                />
                              </TableCell>
                            )
                          })}
                        </TableRow>
                      ))}
                    </Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <span className="text-xs text-slate-500">
                {selectedPermCompanyId === 'global' 
                  ? 'Changes will be saved as the platform global baseline template.' 
                  : `Changes will be saved specifically for ${currentPermCompany?.name || 'this company'} (${currentPermCompany?.domain || selectedPermCompanyId}).`}
              </span>
              <Button onClick={handleSaveActivePermissions} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-9 px-6 rounded-xl shadow-sm flex items-center gap-1.5">
                <Save className="w-4 h-4" /> Save {selectedPermCompanyId === 'global' ? 'Global Matrix' : 'Company Matrix'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Dedicated Tenant Roles & Access Dialog */}
      {roleModalCompany && (
        <Dialog open={roleModalOpen} onOpenChange={setRoleModalOpen}>
          <DialogContent className="sm:max-w-[720px] bg-white border-slate-200 max-h-[90vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-1">
                <img src={roleModalCompany.logo_url || PRESET_LOGOS[0].url} alt={roleModalCompany.name} className="w-10 h-10 rounded-xl object-cover border border-slate-200" />
                <div>
                  <DialogTitle className="text-lg font-black text-slate-900">{roleModalCompany.name} Roles & Access Setup</DialogTitle>
                  <DialogDescription className="text-xs text-purple-600 font-bold">{roleModalCompany.domain}</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div className="p-3.5 bg-purple-50/70 border border-purple-100 rounded-xl text-xs space-y-1">
                <span className="font-extrabold text-purple-900">Tenant-Specific Custom Permission Matrix</span>
                <p className="text-slate-600">Customize role capabilities specifically for {roleModalCompany.name}. Changes apply instantly to users belonging to {roleModalCompany.domain}.</p>
              </div>

              {/* Custom Role Titles for this Company */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">Role Display Titles</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['admin', 'hr', 'team_lead', 'employee'] as Role[]).map((r) => {
                    const label = compRoleLabels[r] || DEFAULT_ROLE_LABELS[r]
                    return (
                      <div key={r} className="space-y-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">{r.replace('_', ' ')}</span>
                        <Input
                          value={label.title}
                          onChange={(e) => setCompRoleLabels(prev => ({
                            ...prev,
                            [r]: { ...prev[r], title: e.target.value }
                          }))}
                          className="h-7 text-[11px] font-bold bg-white"
                        />
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Roles Matrix for this Tenant */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white text-xs">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-900 text-white">
                      <TableHead className="text-xs font-bold text-white w-[260px]">Capability</TableHead>
                      {(['admin', 'hr', 'team_lead', 'employee'] as Role[]).map(r => (
                        <TableHead key={r} className="text-xs font-bold text-white text-center">
                          {compRoleLabels[r]?.title || r.replace('_', ' ').toUpperCase()}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {PERMISSION_CATEGORIES.map((cat) => (
                      <Fragment key={cat.id}>
                        <TableRow className="bg-slate-100 border-b border-slate-200">
                          <TableCell colSpan={5} className="font-extrabold text-[11px] text-indigo-900 uppercase tracking-wider py-2">
                            {cat.name}
                          </TableCell>
                        </TableRow>
                        {cat.permissions.map((perm) => (
                          <TableRow key={perm.key} className="border-b border-slate-100">
                            <TableCell className="py-2">
                              <div className="font-semibold text-slate-800 text-[11px]">{perm.label}</div>
                            </TableCell>
                            {(['admin', 'hr', 'team_lead', 'employee'] as Role[]).map((roleKey) => {
                              const isChecked = (compRoleMatrix[roleKey] || []).includes(perm.key)
                              return (
                                <TableCell key={roleKey} className="text-center align-middle py-2">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleToggleTenantPermission(roleKey, perm.key)}
                                    className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                                  />
                                </TableCell>
                              )
                            })}
                          </TableRow>
                        ))}
                      </Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setRoleModalOpen(false)} className="h-9 text-xs border-slate-200">
                Cancel
              </Button>
              <Button onClick={handleSaveTenantRoleModal} className="bg-purple-600 hover:bg-purple-700 text-white font-bold h-9 text-xs px-5 shadow-sm flex items-center gap-1.5">
                <Save className="w-3.5 h-3.5" /> Save Tenant Role Matrix
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Dedicated SaaS Policy Dialog */}
      {policyCompany && (
        <Dialog open={policyOpen} onOpenChange={setPolicyOpen}>
          <DialogContent className="sm:max-w-[600px] bg-white border-slate-200 max-h-[90vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-1">
                <img src={policyCompany.logo_url} alt={policyCompany.name} className="w-10 h-10 rounded-xl object-cover border border-slate-200" />
                <div>
                  <DialogTitle className="text-lg font-black text-slate-900">{policyCompany.name} SaaS Policy Setup</DialogTitle>
                  <DialogDescription className="text-xs text-indigo-600 font-bold">{policyCompany.domain}</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              {/* Shift & Grace Policy */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-600" /> Work Shift & Grace Period
                </span>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <Label className="text-[11px] font-bold text-slate-700 block mb-1">Login Time</Label>
                    <Input
                      type="time"
                      value={companyPolicyState.loginTime}
                      onChange={e => setCompanyPolicyState({ ...companyPolicyState, loginTime: e.target.value })}
                      className="bg-white border-slate-200 h-8 font-bold text-xs"
                    />
                  </div>

                  <div>
                    <Label className="text-[11px] font-bold text-slate-700 block mb-1">Grace Mins</Label>
                    <Input
                      type="number"
                      value={companyPolicyState.graceTimeMinutes}
                      onChange={e => setCompanyPolicyState({ ...companyPolicyState, graceTimeMinutes: Number(e.target.value) || 0 })}
                      className="bg-white border-slate-200 h-8 font-bold text-xs"
                    />
                  </div>

                  <div>
                    <Label className="text-[11px] font-bold text-slate-700 block mb-1">Logout Time</Label>
                    <Input
                      type="time"
                      value={companyPolicyState.logoutTime}
                      onChange={e => setCompanyPolicyState({ ...companyPolicyState, logoutTime: e.target.value })}
                      className="bg-white border-slate-200 h-8 font-bold text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Geofence Attendance Policy */}
              <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Navigation className="w-4 h-4 text-emerald-600" /> GPS Geofencing Attendance
                  </span>
                  <button
                    type="button"
                    onClick={() => setCompanyPolicyState({ ...companyPolicyState, enableGeolocationAttendance: !companyPolicyState.enableGeolocationAttendance })}
                    className={`w-10 h-5 rounded-full transition-colors relative ${companyPolicyState.enableGeolocationAttendance ? 'bg-emerald-600' : 'bg-slate-300'}`}
                  >
                    <span className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${companyPolicyState.enableGeolocationAttendance ? 'right-0.5' : 'left-0.5'}`} />
                  </button>
                </div>

                {companyPolicyState.enableGeolocationAttendance && (
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <Label className="text-[10px] font-bold text-slate-700 block mb-1">Latitude</Label>
                      <Input
                        type="number"
                        step="any"
                        value={companyPolicyState.officeLatitude}
                        onChange={e => setCompanyPolicyState({ ...companyPolicyState, officeLatitude: Number(e.target.value) || 0 })}
                        className="bg-white border-slate-200 h-8 text-[11px] font-mono"
                      />
                    </div>

                    <div>
                      <Label className="text-[10px] font-bold text-slate-700 block mb-1">Longitude</Label>
                      <Input
                        type="number"
                        step="any"
                        value={companyPolicyState.officeLongitude}
                        onChange={e => setCompanyPolicyState({ ...companyPolicyState, officeLongitude: Number(e.target.value) || 0 })}
                        className="bg-white border-slate-200 h-8 text-[11px] font-mono"
                      />
                    </div>

                    <div>
                      <Label className="text-[10px] font-bold text-slate-700 block mb-1">Radius (Meters)</Label>
                      <Input
                        type="number"
                        value={companyPolicyState.allowedRadiusMeters}
                        onChange={e => setCompanyPolicyState({ ...companyPolicyState, allowedRadiusMeters: Number(e.target.value) || 100 })}
                        className="bg-white border-slate-200 h-8 text-xs font-bold"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Sprint Points Quota Policy */}
              <div className="p-3.5 bg-amber-50/50 border border-amber-200 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-600" /> Monthly Sprint Points Quota per Member
                  </span>
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">Monthly</span>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-slate-700 block">Monthly Sprint Points Quota (Input Box) *</Label>
                  <Input
                    type="number"
                    min={1}
                    max={1000}
                    value={companyPolicyState.sprintPointQuota}
                    onChange={e => setCompanyPolicyState({ ...companyPolicyState, sprintPointQuota: Number(e.target.value) || 60, sprintPointPeriod: 'Monthly' })}
                    className="bg-white border-amber-300 font-extrabold text-amber-900 h-9 text-xs"
                    placeholder="e.g. 60 or 50 points"
                  />
                  <span className="text-[10px] text-slate-500">Allocated sprint points budget per member/student per month.</span>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-slate-100">
              <Button variant="outline" onClick={() => setPolicyOpen(false)} className="h-9 text-xs border-slate-200">Cancel</Button>
              <Button onClick={handleSaveCompanyPolicyModal} className="sa-btn-primary h-9 px-5 text-xs font-bold">
                Save SaaS Policies
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Company Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[480px] bg-white/95 backdrop-blur-xl border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-slate-900 font-bold">Edit Company Profile</DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              Update corporate details for {selectedCompany?.name}.
            </DialogDescription>
          </DialogHeader>

          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit((d) => editCompanyMutation.mutate(d))} className="space-y-4 pt-2">
              <FormField
                control={editForm.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 text-xs font-semibold">Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Corp" className="border-slate-200 h-9 text-xs" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-3">
                <label className="text-slate-800 text-xs font-extrabold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-600" /> Company Branding Logo
                  </span>
                  {editForm.watch('logoUrl') && (
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Logo Attached ✓
                    </span>
                  )}
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div className="p-3 bg-white rounded-lg border border-dashed border-indigo-200 text-center flex flex-col items-center justify-center relative cursor-pointer hover:bg-indigo-50/30 transition-colors">
                    <Upload className="w-4 h-4 text-indigo-500 mb-1" />
                    <span className="text-[11px] font-bold text-slate-700">Choose New Logo File</span>
                    <span className="text-[9px] text-slate-400">Uploads to Cloudinary on Save</span>
                    <input type="file" accept="image/*" onChange={handleEditFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>

                  <div className="flex items-center gap-2">
                    {(editLogoPreviewUrl || editForm.watch('logoUrl')) ? (
                      <div className="flex items-center gap-2 p-1.5 bg-white border border-slate-200 rounded-lg w-full">
                        <img src={editLogoPreviewUrl || editForm.watch('logoUrl')} alt="Logo preview" className="w-9 h-9 rounded object-contain bg-slate-50 border border-slate-100" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold text-slate-700 truncate">
                            {editLogoPreviewUrl ? 'New Logo Selected' : 'Logo Active'}
                          </p>
                          <p className="text-[9px] text-slate-400 truncate">
                            {selectedEditLogoFile ? selectedEditLogoFile.name : editForm.watch('logoUrl')}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 px-1.5 text-[10px] text-slate-400 hover:text-rose-600"
                          onClick={() => {
                            setSelectedEditLogoFile(null)
                            setEditLogoPreviewUrl('')
                            editForm.setValue('logoUrl', '')
                          }}
                        >
                          Clear
                        </Button>
                      </div>
                    ) : (
                      <FormField
                        control={editForm.control}
                        name="logoUrl"
                        render={({ field }) => (
                          <FormItem className="space-y-1 w-full">
                            <FormLabel className="text-slate-600 text-[10px] font-bold">Or Logo URL</FormLabel>
                            <FormControl>
                              <Input placeholder="https://..." className="bg-white border-slate-200 h-8 text-xs" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={editForm.control}
                  name="domain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 text-xs font-semibold">Domain</FormLabel>
                      <FormControl>
                        <Input placeholder="acme.com" className="border-slate-200 h-9 text-xs" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="adminName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 text-xs font-semibold">Admin Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Sarah Connor" className="border-slate-200 h-9 text-xs" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)} className="border-slate-200 text-slate-600 h-9 text-xs">Cancel</Button>
                <Button type="submit" disabled={editCompanyMutation.isPending} className="sa-btn-primary h-9 px-4 text-xs font-bold">
                  {editCompanyMutation.isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Configure Assignments Dialog */}
      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white/95 backdrop-blur-xl border-slate-200 max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-slate-900 font-bold">Assign Staff Members</DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              Select employees that report to this Company Admin.
            </DialogDescription>
          </DialogHeader>
          <div className="py-3 space-y-2 overflow-y-auto flex-1 pr-1 text-xs">
            {loadingEmployees ? (
              <div className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto text-indigo-500" /></div>
            ) : employees?.filter((e: any) => e.id !== activeAdminId && (e.manager_id === null || e.manager_id === activeAdminId)).length === 0 ? (
               <div className="text-center py-8 text-slate-400 text-xs">No unassigned employees available.</div>
            ) : employees?.filter((e: any) => e.id !== activeAdminId && (e.manager_id === null || e.manager_id === activeAdminId)).map((emp: any) => (
              <label key={emp.id} className="flex items-center space-x-3 p-2.5 border border-slate-200 rounded-xl hover:bg-indigo-50/40 cursor-pointer transition-all">
                <input 
                  type="checkbox" 
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                  checked={selectedMembers.includes(emp.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedMembers(prev => [...prev, emp.id])
                    } else {
                      setSelectedMembers(prev => prev.filter(id => id !== emp.id))
                    }
                  }}
                />
                <div className="flex flex-col">
                  <span className="font-bold text-slate-800">{emp.full_name || emp.email}</span>
                  <span className="text-[10px] text-slate-400">{emp.roles?.name || 'Staff Member'}</span>
                </div>
              </label>
            ))}
          </div>
          <DialogFooter className="pt-2 mt-auto border-t border-slate-100">
            <Button variant="outline" onClick={() => setConfigOpen(false)} className="border-slate-200 text-slate-600 h-9 text-xs">Cancel</Button>
            <Button 
              onClick={() => assignMutation.mutate({ adminId: activeAdminId!, memberIds: selectedMembers })} 
              disabled={assignMutation.isPending || !activeAdminId} 
              className="sa-btn-primary h-9 px-4 text-xs font-bold"
            >
              {assignMutation.isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Save Reporting Staff
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Company Confirmation Dialog */}
      <Dialog open={!!companyToDelete} onOpenChange={(open) => !open && setCompanyToDelete(null)}>
        <DialogContent className="sm:max-w-[420px] bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-slate-900 font-bold flex items-center gap-2 text-rose-600">
              <Trash2 className="w-5 h-5 text-rose-600" /> Delete Company Organization
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs mt-1">
              Are you sure you want to delete <strong className="text-slate-800">{companyToDelete?.name}</strong> ({companyToDelete?.domain || companyToDelete?.admin_email})? All associated company records and credentials will be removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-3">
            <Button
              variant="outline"
              onClick={() => setCompanyToDelete(null)}
              className="border-slate-200 text-slate-600 h-9 text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => companyToDelete && deleteCompanyMutation.mutate(companyToDelete.id)}
              disabled={deleteCompanyMutation.isPending}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold h-9 text-xs"
            >
              {deleteCompanyMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
              Delete Organization
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
