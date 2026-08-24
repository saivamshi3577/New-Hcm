import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  ShieldCheck, 
  Clock, 
  Calendar, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Download, 
  Printer, 
  Settings, 
  Sparkles, 
  Building2, 
  Users, 
  Timer, 
  Home, 
  Award, 
  DollarSign, 
  FileCheck, 
  Check, 
  X, 
  ExternalLink,
  ChevronRight,
  Info,
  RefreshCw,
  Copy,
  BookOpen
} from 'lucide-react'
import { api, safeArray } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { usePermissions } from '@/hooks/usePermissions'
import { Permission as P } from '@/config/permissions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { ROLE_CONFIGS } from '@/config/roleConfig'

export type PolicyCategory = 
  | 'ALL'
  | 'TIMINGS'
  | 'GRACE_PERIOD'
  | 'LEAVE'
  | 'REMOTE_WORK'
  | 'CONDUCT'
  | 'EXPENSES'
  | 'APPRAISAL'
  | 'GENERAL'

interface HrPolicy {
  id: string
  title: string
  category: string
  description?: string
  content: string
  effectiveDate?: string
  version?: string
  status: string
  targetAudience: string
  isMandatory: boolean
  requiresAcknowledgement: boolean
  tags?: string
  authorName?: string
  createdByAdmin?: string
  companyId?: string
  domain?: string
  isAcknowledged?: boolean
  acknowledgedAt?: string
  acknowledgementCount?: number
  createdAt: string
  updatedAt: string
}

interface PolicyConfig {
  companyName: string
  loginTime: string
  logoutTime: string
  lateGracePeriod: number
  breakAllowance: number
  sprintQuota: number
  weekendPolicy: string
}

const CATEGORY_META: Record<string, { label: string; icon: any; color: string; badgeBg: string }> = {
  TIMINGS: { label: 'Timings & Shifts', icon: Clock, color: 'text-blue-600', badgeBg: 'bg-blue-50 text-blue-700 border-blue-200' },
  GRACE_PERIOD: { label: 'Grace Period & Attendance', icon: Timer, color: 'text-amber-600', badgeBg: 'bg-amber-50 text-amber-700 border-amber-200' },
  LEAVE: { label: 'Leave & Time-Off', icon: Calendar, color: 'text-emerald-600', badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  REMOTE_WORK: { label: 'Remote & Hybrid (WFH)', icon: Home, color: 'text-indigo-600', badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  CONDUCT: { label: 'Code of Conduct & POSH', icon: ShieldCheck, color: 'text-rose-600', badgeBg: 'bg-rose-50 text-rose-700 border-rose-200' },
  EXPENSES: { label: 'Travel & Reimbursements', icon: DollarSign, color: 'text-teal-600', badgeBg: 'bg-teal-50 text-teal-700 border-teal-200' },
  APPRAISAL: { label: 'Appraisal & KPIs', icon: Award, color: 'text-purple-600', badgeBg: 'bg-purple-50 text-purple-700 border-purple-200' },
  GENERAL: { label: 'General Guidelines', icon: FileText, color: 'text-slate-600', badgeBg: 'bg-slate-100 text-slate-700 border-slate-200' },
}

interface HrPoliciesPageProps {
  mode?: 'manage' | 'view'
}

export default function HrPoliciesPage({ mode }: HrPoliciesPageProps) {
  const { user, role } = useAuthStore()
  const { hasPermission } = usePermissions()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const canManage = useMemo(() => {
    if (mode === 'view') return false
    return hasPermission(P.MANAGE_POLICIES) || ['super_admin', 'admin', 'hr'].includes(role || '')
  }, [hasPermission, role, mode])

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<PolicyCategory>('ALL')
  
  // Selected policy for reading modal
  const [readingPolicy, setReadingPolicy] = useState<HrPolicy | null>(null)
  
  // Create / Edit Policy modal
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<HrPolicy | null>(null)
  const [editorTab, setEditorTab] = useState<'edit' | 'preview'>('edit')

  // Form states
  const [formTitle, setFormTitle] = useState('')
  const [formCategory, setFormCategory] = useState('TIMINGS')
  const [formDescription, setFormDescription] = useState('')
  const [formContent, setFormContent] = useState('')
  const [formVersion, setFormVersion] = useState('1.0')
  const [formStatus, setFormStatus] = useState('PUBLISHED')
  const [formTargetAudience, setFormTargetAudience] = useState('ALL')
  const [formIsMandatory, setFormIsMandatory] = useState(false)
  const [formRequiresAck, setFormRequiresAck] = useState(true)
  const [formEffectiveDate, setFormEffectiveDate] = useState(new Date().toISOString().split('T')[0])
  const [formAuthorName, setFormAuthorName] = useState(user?.fullName || 'HR Operations')

  // Shift & Grace Config modal
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)
  const [configLoginTime, setConfigLoginTime] = useState('09:30')
  const [configLogoutTime, setConfigLogoutTime] = useState('18:30')
  const [configGracePeriod, setConfigGracePeriod] = useState(15)
  const [configBreakAllowance, setConfigBreakAllowance] = useState(60)
  const [configWeekendPolicy, setConfigWeekendPolicy] = useState('ALL_SATURDAYS_OFF')

  // Fetch Policies Query
  const { data: responseData, isLoading, refetch } = useQuery({
    queryKey: ['hr-policies', selectedCategory, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (selectedCategory && selectedCategory !== 'ALL') params.append('category', selectedCategory)
      if (searchQuery) params.append('search', searchQuery)
      const res = await api.get(`/policies?${params.toString()}`)
      return res.data || res
    }
  })

  const policies: HrPolicy[] = useMemo(() => {
    return safeArray(responseData?.policies || responseData)
  }, [responseData])

  const companySettings: PolicyConfig = useMemo(() => {
    return responseData?.companySettings || {
      companyName: 'Company',
      loginTime: '09:30',
      logoutTime: '18:30',
      lateGracePeriod: 15,
      breakAllowance: 60,
      sprintQuota: 40,
      weekendPolicy: 'ALL_SATURDAYS_OFF'
    }
  }, [responseData])

  // Helper formatters
  const format12h = (time24: string) => {
    if (!time24) return '09:30 AM'
    const [hrs, mins] = time24.split(':').map(Number)
    const period = hrs >= 12 ? 'PM' : 'AM'
    const hrs12 = hrs % 12 || 12
    return `${String(hrs12).padStart(2, '0')}:${String(mins).padStart(2, '0')} ${period}`
  }

  // Grace Period Cutoff calculation
  const graceCutoff12h = useMemo(() => {
    const [h, m] = (companySettings.loginTime || '09:30').split(':').map(Number)
    const cutoffMinutes = h * 60 + m + (companySettings.lateGracePeriod ?? 15)
    const cutoffH = Math.floor(cutoffMinutes / 60) % 24
    const cutoffM = cutoffMinutes % 60
    const period = cutoffH >= 12 ? 'PM' : 'AM'
    const hrs12 = cutoffH % 12 || 12
    return `${String(hrs12).padStart(2, '0')}:${String(cutoffM).padStart(2, '0')} ${period}`
  }, [companySettings])

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingPolicy(null)
    setFormTitle('')
    setFormCategory('TIMINGS')
    setFormDescription('')
    setFormContent('')
    setFormVersion('1.0')
    setFormStatus('PUBLISHED')
    setFormTargetAudience('ALL')
    setFormIsMandatory(false)
    setFormRequiresAck(true)
    setFormEffectiveDate(new Date().toISOString().split('T')[0])
    setFormAuthorName(user?.fullName || 'HR Operations')
    setEditorTab('edit')
    setIsEditorOpen(true)
  }

  // Open Edit Modal
  const handleOpenEdit = (policy: HrPolicy) => {
    setEditingPolicy(policy)
    setFormTitle(policy.title)
    setFormCategory(policy.category)
    setFormDescription(policy.description || '')
    setFormContent(policy.content)
    setFormVersion(policy.version || '1.0')
    setFormStatus(policy.status || 'PUBLISHED')
    setFormTargetAudience(policy.targetAudience || 'ALL')
    setFormIsMandatory(Boolean(policy.isMandatory))
    setFormRequiresAck(Boolean(policy.requiresAcknowledgement))
    setFormEffectiveDate(policy.effectiveDate ? new Date(policy.effectiveDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0])
    setFormAuthorName(policy.authorName || user?.fullName || 'HR Operations')
    setEditorTab('edit')
    setIsEditorOpen(true)
  }

  // Load Template helper
  const handleLoadTemplate = (type: string) => {
    if (type === 'TIMINGS') {
      setFormTitle('Work Hours, Standard Shift & Lunch Schedule Policy')
      setFormCategory('TIMINGS')
      setFormDescription(`Official guidelines regarding daily shift (${format12h(companySettings.loginTime)} - ${format12h(companySettings.logoutTime)}), core hours, lunch/break schedules, and minimum working hours.`)
      setFormContent(`### 1. Purpose & Scope\nThis policy defines the standard working hours, daily shift structure, punctuality expectations, and break schedules for all team members.\n\n### 2. Standard Shift Hours\n- **Shift Start Time:** ${format12h(companySettings.loginTime)}\n- **Shift End Time:** ${format12h(companySettings.logoutTime)}\n- **Total Shift Duration:** 9.0 Hours per working day\n- **Core Working Hours:** 10:00 AM to 05:30 PM\n\n### 3. Break Schedules\n- **Lunch Break:** 45 minutes (01:00 PM to 02:30 PM window)\n- **Tea / Short Break:** 15 minutes\n- Total daily break allowance: **${companySettings.breakAllowance} minutes**\n\n### 4. Minimum Working Hours Definition\n- **Full Day Attendance:** Minimum 8.0 Hours of active logged-in time.\n- **Half Day Attendance:** Minimum 4.5 Hours of active logged-in time.`)
    } else if (type === 'GRACE') {
      setFormTitle('Grace Period, Attendance Regularization & Late-In Penalties')
      setFormCategory('GRACE_PERIOD')
      setFormDescription(`Comprehensive rules on the ${companySettings.lateGracePeriod}-minute morning grace period (up to ${graceCutoff12h}), late-in tracking, monthly allowances, and penalty deductions.`)
      setFormContent(`### 1. Daily Morning Grace Period\n- **Shift Start:** ${format12h(companySettings.loginTime)}\n- **Grace Allowance:** ${companySettings.lateGracePeriod} Minutes\n- **Grace Cutoff:** ${graceCutoff12h}\n- Any check-in recorded before **${graceCutoff12h}** is considered **Within Grace Period** with **no salary deduction**.\n\n### 2. Late-In Classification & Limits\n- Any check-in after **${graceCutoff12h}** is marked as **Late In**.\n- Each employee is permitted a maximum of **3 Late-Ins per calendar month** without deduction.\n\n### 3. Penalties for Excessive Late-Ins\n- **4th Late-In:** Automatic deduction of 0.5 (Half Day) leave or Loss of Pay (LOP).\n- **5th Late-In onwards:** 0.5 day deduction per incident and HR review.\n\n### 4. Attendance Regularization\n- Requests for official outdoor meetings must be submitted within 48 hours.`)
    } else if (type === 'LEAVE') {
      setFormTitle('Annual Leave Entitlements & Time-Off Policy')
      setFormCategory('LEAVE')
      setFormDescription('Detailed annual leave entitlements: 12 Casual Leaves, 12 Sick Leaves, 15 Earned Leaves, Maternity/Paternity benefits, and carry-forward rules.')
      setFormContent(`### 1. Annual Paid Leave Entitlements (39 Days Total)\n- **Casual Leave (CL):** 12 Days/Year (1 day accrued monthly) - 24h prior notice required.\n- **Sick Leave (SL):** 12 Days/Year (1 day accrued monthly) - Medical certificate for >2 consecutive days.\n- **Earned Leave (EL):** 15 Days/Year - 7 days advance notice required.\n- **Maternity Leave:** 26 Weeks fully paid leave.\n- **Paternity Leave:** 7 Working Days paid leave.\n- **Bereavement Leave:** Up to 5 Days paid leave.\n\n### 2. Leave Carry Forward\n- Up to 15 unused Earned Leaves (EL) can be carried over to the next financial year.`)
    } else if (type === 'REMOTE') {
      setFormTitle('Work From Home (WFH) & Hybrid Workplace Policy')
      setFormCategory('REMOTE_WORK')
      setFormDescription('Guidelines on remote work allowances, daily check-in protocols, sprint availability, and home office connectivity standards.')
      setFormContent(`### 1. Hybrid Work Policy\n- Full-time team members are eligible for up to **2 WFH days per calendar month**.\n- WFH requests must be submitted at least 24 hours in advance via the HCM portal and approved by the Team Lead.\n\n### 2. Core Expectations\n- Active on Slack/Teams and email during standard shift hours (${format12h(companySettings.loginTime)} - ${format12h(companySettings.logoutTime)}).\n- Attendance in daily morning sprint standups is mandatory.\n- Update task progress on Kanban board in real time.`)
    }
  }

  // Open Shift Config modal
  const handleOpenConfigModal = () => {
    setConfigLoginTime(companySettings.loginTime || '09:30')
    setConfigLogoutTime(companySettings.logoutTime || '18:30')
    setConfigGracePeriod(companySettings.lateGracePeriod ?? 15)
    setConfigBreakAllowance(companySettings.breakAllowance ?? 60)
    setConfigWeekendPolicy(companySettings.weekendPolicy || 'ALL_SATURDAYS_OFF')
    setIsConfigModalOpen(true)
  }

  // Create or Update Mutation
  const savePolicyMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: formTitle,
        category: formCategory,
        description: formDescription,
        content: formContent,
        version: formVersion,
        status: formStatus,
        targetAudience: formTargetAudience,
        isMandatory: formIsMandatory,
        requiresAcknowledgement: formRequiresAck,
        effectiveDate: formEffectiveDate,
        authorName: formAuthorName,
      }

      if (editingPolicy) {
        return await api.put(`/policies/${editingPolicy.id}`, payload)
      } else {
        return await api.post('/policies', payload)
      }
    },
    onSuccess: () => {
      toast({
        title: editingPolicy ? 'Policy Updated' : 'Policy Created',
        description: `Policy "${formTitle}" has been saved successfully.`
      })
      setIsEditorOpen(false)
      queryClient.invalidateQueries({ queryKey: ['hr-policies'] })
    },
    onError: (err: any) => {
      toast({
        title: 'Error Saving Policy',
        description: err?.message || 'Failed to save policy',
        variant: 'destructive'
      })
    }
  })

  // Delete Mutation
  const deletePolicyMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.delete(`/policies/${id}`)
    },
    onSuccess: () => {
      toast({
        title: 'Policy Deleted',
        description: 'The HR policy has been removed.'
      })
      queryClient.invalidateQueries({ queryKey: ['hr-policies'] })
    },
    onError: (err: any) => {
      toast({
        title: 'Delete Failed',
        description: err?.message || 'Failed to delete policy',
        variant: 'destructive'
      })
    }
  })

  // Acknowledge Policy Mutation
  const acknowledgeMutation = useMutation({
    mutationFn: async (policyId: string) => {
      return await api.post(`/policies/${policyId}/acknowledge`, {})
    },
    onSuccess: () => {
      toast({
        title: 'Policy Acknowledged',
        description: 'Thank you! Your acknowledgement has been recorded in compliance records.'
      })
      queryClient.invalidateQueries({ queryKey: ['hr-policies'] })
      if (readingPolicy) {
        setReadingPolicy({
          ...readingPolicy,
          isAcknowledged: true,
          acknowledgedAt: new Date().toISOString()
        })
      }
    },
    onError: (err: any) => {
      toast({
        title: 'Acknowledgement Failed',
        description: err?.message || 'Failed to record acknowledgement',
        variant: 'destructive'
      })
    }
  })

  // Save Shift & Grace Settings Mutation
  const saveConfigMutation = useMutation({
    mutationFn: async () => {
      return await api.put('/policies/config', {
        loginTime: configLoginTime,
        logoutTime: configLogoutTime,
        lateGracePeriod: Number(configGracePeriod),
        breakAllowance: Number(configBreakAllowance),
        weekendPolicy: configWeekendPolicy,
      })
    },
    onSuccess: () => {
      toast({
        title: 'Company Shift & Grace Settings Updated',
        description: `Shift hours set to ${format12h(configLoginTime)} - ${format12h(configLogoutTime)} with ${configGracePeriod} min grace period.`
      })
      setIsConfigModalOpen(false)
      queryClient.invalidateQueries({ queryKey: ['hr-policies'] })
    },
    onError: (err: any) => {
      toast({
        title: 'Settings Update Failed',
        description: err?.message || 'Failed to update company policy settings',
        variant: 'destructive'
      })
    }
  })

  // Seed Default Policies Mutation
  const seedPoliciesMutation = useMutation({
    mutationFn: async () => {
      return await api.post('/policies/seed', {})
    },
    onSuccess: (res: any) => {
      toast({
        title: 'Standard Policies Seeded',
        description: res?.data?.message || 'Default corporate HR policies loaded.'
      })
      queryClient.invalidateQueries({ queryKey: ['hr-policies'] })
    },
    onError: (err: any) => {
      toast({
        title: 'Seeding Failed',
        description: err?.message || 'Failed to seed default policies',
        variant: 'destructive'
      })
    }
  })

  // Print Handbook helper
  const handlePrint = () => {
    window.print()
  }

  // Filtered policies list
  const filteredPolicies = useMemo(() => {
    return policies.filter(p => {
      const matchCategory = selectedCategory === 'ALL' || p.category === selectedCategory
      const matchSearch = !searchQuery || 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        p.content.toLowerCase().includes(searchQuery.toLowerCase())
      return matchCategory && matchSearch
    })
  }, [policies, selectedCategory, searchQuery])

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── Page Header & Action Bar ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-full bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
        
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-400/30 backdrop-blur-md">
              <ShieldCheck className="h-6 w-6 text-indigo-300" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                HR Policies & Company Guidelines
                <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-xs font-semibold px-2 py-0.5">
                  {policies.length} Active Policies
                </Badge>
              </h1>
              <p className="text-sm text-slate-300">
                Official guidelines regarding shift timings, morning grace period, leave allocations, code of conduct, and employee handbooks.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2.5 relative z-10">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white rounded-xl shadow-xs transition-all"
          >
            <Printer className="h-4 w-4 mr-1.5" />
            Print Handbook
          </Button>

          {canManage && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenConfigModal}
                className="bg-indigo-600/30 text-indigo-200 border-indigo-400/40 hover:bg-indigo-600/50 hover:text-white rounded-xl shadow-xs transition-all"
              >
                <Settings className="h-4 w-4 mr-1.5" />
                Shift & Grace Settings
              </Button>

              <Button
                size="sm"
                onClick={handleOpenCreate}
                className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold rounded-xl shadow-md shadow-indigo-500/25 transition-all"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Create New Policy
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── Key Highlights Summary Cards ────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Timings & Shift */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-blue-500 to-indigo-500" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Official Shift Hours</p>
              <h3 className="text-lg font-black text-slate-900 mt-1">
                {format12h(companySettings.loginTime)} – {format12h(companySettings.logoutTime)}
              </h3>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <span className="font-semibold text-blue-600">9.0h Shift</span> • {companySettings.breakAllowance}m Break
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:scale-110 transition-transform">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Core Hours: 10:00 AM – 05:30 PM</span>
            <span className="font-semibold text-slate-700">Mon – Fri</span>
          </div>
        </div>

        {/* Card 2: Grace Period */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-amber-500 to-orange-500" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Morning Grace Period</p>
              <h3 className="text-lg font-black text-slate-900 mt-1">
                {companySettings.lateGracePeriod} Minutes
              </h3>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                Cutoff: <span className="font-bold text-amber-600">{graceCutoff12h}</span>
              </p>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl text-amber-600 group-hover:scale-110 transition-transform">
              <Timer className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Max 3 Late-Ins / month</span>
            <span className="font-semibold text-emerald-600">0 Deduction</span>
          </div>
        </div>

        {/* Card 3: Leave Quotas */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-emerald-500 to-teal-500" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Annual Paid Leaves</p>
              <h3 className="text-lg font-black text-slate-900 mt-1">
                39 Days / Year
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                12 CL • 12 SL • 15 EL
              </p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 group-hover:scale-110 transition-transform">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Maternity: 26 Weeks</span>
            <span className="font-semibold text-teal-600">Carryover: 15 EL</span>
          </div>
        </div>

        {/* Card 4: Hybrid & WFH */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-purple-500 to-indigo-500" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Hybrid & Remote Work</p>
              <h3 className="text-lg font-black text-slate-900 mt-1">
                2 Days WFH / Mo
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Prior TL Approval Required
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl text-purple-600 group-hover:scale-110 transition-transform">
              <Home className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>24h Advance Notice</span>
            <span className="font-semibold text-purple-600">Daily Standups</span>
          </div>
        </div>
      </div>

      {/* ── Search & Category Filter Bar ────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search HR policies by keywords (e.g. grace period, working hours, casual leave, POSH, WFH)..."
              className="pl-9.5 pr-4 h-10 rounded-xl border-slate-200 focus-visible:ring-indigo-500 text-xs w-full"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {canManage && policies.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => seedPoliciesMutation.mutate()}
              disabled={seedPoliciesMutation.isPending}
              className="rounded-xl border-indigo-200 text-indigo-700 hover:bg-indigo-50 shrink-0 text-xs font-semibold"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5 text-indigo-600" />
              {seedPoliciesMutation.isPending ? 'Seeding...' : 'Load Standard HR Policies'}
            </Button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-1">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              selectedCategory === 'ALL'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            All Policies ({policies.length})
          </button>

          {Object.entries(CATEGORY_META).map(([key, meta]) => {
            const count = policies.filter(p => p.category === key).length
            const isSelected = selectedCategory === key
            const Icon = meta.icon
            return (
              <button
                key={key}
                onClick={() => setSelectedCategory(key as PolicyCategory)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/25'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isSelected ? 'text-white' : meta.color}`} />
                {meta.label} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Policy Cards Grid ───────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Loading HR policies...</p>
        </div>
      ) : filteredPolicies.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200/80 shadow-xs text-center space-y-4">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
            <FileText className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">No Policies Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {searchQuery ? `No policies match the search "${searchQuery}". Try a different term or clear filters.` : 'No policies have been published yet.'}
            </p>
          </div>
          {canManage && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                size="sm"
                onClick={() => seedPoliciesMutation.mutate()}
                disabled={seedPoliciesMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                {seedPoliciesMutation.isPending ? 'Seeding...' : 'Load Standard Corporate Policies'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenCreate}
                className="rounded-xl text-xs font-bold"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Create Custom Policy
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredPolicies.map((policy) => {
            const meta = CATEGORY_META[policy.category] || CATEGORY_META.GENERAL
            const Icon = meta.icon

            return (
              <div
                key={policy.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4 group relative overflow-hidden"
              >
                <div className="space-y-3">
                  {/* Category & Status Bar */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-extrabold border ${meta.badgeBg}`}>
                      <Icon className="h-3.5 w-3.5" />
                      {meta.label}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {policy.isMandatory && (
                        <Badge variant="destructive" className="text-[10px] font-bold px-2 py-0.5 rounded-md">
                          Mandatory
                        </Badge>
                      )}
                      {policy.version && (
                        <Badge variant="outline" className="text-[10px] font-semibold text-slate-500 border-slate-200 px-1.5 py-0.5 rounded-md">
                          v{policy.version}
                        </Badge>
                      )}
                      {policy.isAcknowledged ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                          <Check className="h-3 w-3" />
                          Acknowledged
                        </span>
                      ) : policy.requiresAcknowledgement ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                          <AlertCircle className="h-3 w-3" />
                          Pending Read
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 
                      onClick={() => setReadingPolicy(policy)}
                      className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors cursor-pointer leading-snug"
                    >
                      {policy.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                      {policy.description || policy.content.slice(0, 150) + '...'}
                    </p>
                  </div>
                </div>

                {/* Footer Bar */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 text-xs text-slate-400">
                  <div className="flex items-center gap-2 truncate">
                    <span className="truncate font-medium text-slate-600">
                      {policy.authorName || 'HR Operations'}
                    </span>
                    <span>•</span>
                    <span>
                      {policy.effectiveDate ? new Date(policy.effectiveDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Active'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {canManage && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(policy)}
                          className="h-8 w-8 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                          title="Edit Policy"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete policy "${policy.title}"?`)) {
                              deletePolicyMutation.mutate(policy.id)
                            }
                          }}
                          className="h-8 w-8 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                          title="Delete Policy"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}

                    <Button
                      size="sm"
                      onClick={() => setReadingPolicy(policy)}
                      className="bg-slate-900 hover:bg-indigo-600 text-white font-bold h-8 px-3 rounded-xl text-xs shadow-xs transition-all flex items-center gap-1"
                    >
                      Read Policy
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Policy Reader Dialog ────────────────────────────────────────────── */}
      <Dialog open={Boolean(readingPolicy)} onOpenChange={(open) => !open && setReadingPolicy(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 rounded-2xl overflow-hidden shadow-2xl">
          {readingPolicy && (
            <>
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 shrink-0 relative">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5 pr-6">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                        {CATEGORY_META[readingPolicy.category]?.label || readingPolicy.category}
                      </span>
                      {readingPolicy.version && (
                        <span className="text-[11px] font-medium text-slate-300">
                          Version {readingPolicy.version}
                        </span>
                      )}
                      {readingPolicy.isMandatory && (
                        <Badge variant="destructive" className="text-[10px] font-bold py-0">
                          Mandatory
                        </Badge>
                      )}
                    </div>
                    <h2 className="text-xl font-black text-white leading-tight">
                      {readingPolicy.title}
                    </h2>
                    <p className="text-xs text-slate-300 flex items-center gap-3">
                      <span>Author: <strong className="text-white">{readingPolicy.authorName || 'HR Operations'}</strong></span>
                      <span>•</span>
                      <span>Effective: <strong className="text-white">{readingPolicy.effectiveDate ? new Date(readingPolicy.effectiveDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Immediate'}</strong></span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Body / Formatted Markdown Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                {/* TL;DR Summary Box */}
                {readingPolicy.description && (
                  <div className="bg-indigo-50/80 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
                    <Info className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">Policy Highlights (TL;DR)</h4>
                      <p className="text-xs text-indigo-900 mt-1 leading-relaxed">
                        {readingPolicy.description}
                      </p>
                    </div>
                  </div>
                )}

                {/* Formatted Content */}
                <div className="prose prose-slate max-w-none text-xs leading-relaxed space-y-4 bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
                  {readingPolicy.content.split('\n\n').map((block, index) => {
                    if (block.startsWith('### ')) {
                      return (
                        <h3 key={index} className="text-sm font-black text-slate-900 border-b border-slate-100 pb-1.5 mt-4 pt-2">
                          {block.replace('### ', '')}
                        </h3>
                      )
                    }
                    if (block.startsWith('- ')) {
                      const items = block.split('\n').map(item => item.replace(/^- /, ''))
                      return (
                        <ul key={index} className="list-disc pl-5 space-y-1 text-slate-700">
                          {items.map((it, i) => (
                            <li key={i} dangerouslySetInnerHTML={{ 
                              __html: it.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
                            }} />
                          ))}
                        </ul>
                      )
                    }
                    if (block.includes('|')) {
                      // Markdown table rendering
                      const rows = block.split('\n').filter(r => r.trim() && !r.includes(':---'))
                      if (rows.length > 0) {
                        const headerCols = rows[0].split('|').map(c => c.trim()).filter(Boolean)
                        const bodyRows = rows.slice(1).map(r => r.split('|').map(c => c.trim()).filter(Boolean))

                        return (
                          <div key={index} className="overflow-x-auto my-3">
                            <table className="w-full text-xs text-left border-collapse border border-slate-200">
                              <thead>
                                <tr className="bg-slate-100">
                                  {headerCols.map((col, ci) => (
                                    <th key={ci} className="border border-slate-200 p-2 font-bold text-slate-800" dangerouslySetInnerHTML={{
                                      __html: col.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                    }} />
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {bodyRows.map((row, ri) => (
                                  <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                    {row.map((cell, ci) => (
                                      <td key={ci} className="border border-slate-200 p-2 text-slate-700" dangerouslySetInnerHTML={{
                                        __html: cell.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                      }} />
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )
                      }
                    }
                    return (
                      <p key={index} className="text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ 
                        __html: block.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
                      }} />
                    )
                  })}
                </div>

                {/* Acknowledgement Status / Action */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
                  <div className="flex items-center gap-3">
                    {readingPolicy.isAcknowledged ? (
                      <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 shrink-0">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                    ) : (
                      <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600 shrink-0">
                        <AlertCircle className="h-6 w-6" />
                      </div>
                    )}
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        {readingPolicy.isAcknowledged ? 'You Have Acknowledged This Policy' : 'Formal Employee Acknowledgement'}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {readingPolicy.isAcknowledged && readingPolicy.acknowledgedAt
                          ? `Recorded on ${new Date(readingPolicy.acknowledgedAt).toLocaleString('en-US')}`
                          : 'By acknowledging, you confirm you have read, understood, and agreed to abide by these guidelines.'}
                      </p>
                    </div>
                  </div>

                  {!readingPolicy.isAcknowledged && (
                    <Button
                      onClick={() => acknowledgeMutation.mutate(readingPolicy.id)}
                      disabled={acknowledgeMutation.isPending}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 px-4 rounded-xl text-xs shadow-md shadow-emerald-600/20 shrink-0 transition-all"
                    >
                      <Check className="h-4 w-4 mr-1.5" />
                      {acknowledgeMutation.isPending ? 'Recording...' : 'I Acknowledge & Agree'}
                    </Button>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href)
                    toast({ title: 'Link Copied', description: 'Policy link copied to clipboard.' })
                  }}
                  className="text-xs rounded-xl border-slate-200 text-slate-600"
                >
                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                  Copy Link
                </Button>

                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setReadingPolicy(null)}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs"
                >
                  Close Reader
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Create / Edit Policy Modal ──────────────────────────────────────── */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 rounded-2xl overflow-hidden shadow-2xl">
          <DialogHeader className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-lg font-black text-white">
                  {editingPolicy ? 'Edit HR Policy' : 'Create New HR Policy'}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-300 mt-0.5">
                  Draft, update, and publish official company policies and guidelines across all departments.
                </DialogDescription>
              </div>

              {/* Tab Switcher for Editor / Preview */}
              <div className="flex bg-white/10 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setEditorTab('edit')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    editorTab === 'edit' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Editor
                </button>
                <button
                  type="button"
                  onClick={() => setEditorTab('preview')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    editorTab === 'preview' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Live Preview
                </button>
              </div>
            </div>
          </DialogHeader>

          {/* Editor Body */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-4">
            {editorTab === 'edit' ? (
              <div className="space-y-4">
                {/* Template Quick Loader Bar */}
                {!editingPolicy && (
                  <div className="bg-indigo-50/70 border border-indigo-100 p-3 rounded-xl flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 text-indigo-900 text-xs font-bold">
                      <Sparkles className="h-4 w-4 text-indigo-600" />
                      Quick Templates:
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleLoadTemplate('TIMINGS')}
                        className="h-7 text-[11px] rounded-lg border-indigo-200 text-indigo-700 hover:bg-indigo-100 bg-white"
                      >
                        Company Timings
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleLoadTemplate('GRACE')}
                        className="h-7 text-[11px] rounded-lg border-indigo-200 text-indigo-700 hover:bg-indigo-100 bg-white"
                      >
                        Grace Period & Late-In
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleLoadTemplate('LEAVE')}
                        className="h-7 text-[11px] rounded-lg border-indigo-200 text-indigo-700 hover:bg-indigo-100 bg-white"
                      >
                        Leave Entitlements
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleLoadTemplate('REMOTE')}
                        className="h-7 text-[11px] rounded-lg border-indigo-200 text-indigo-700 hover:bg-indigo-100 bg-white"
                      >
                        Remote & WFH
                      </Button>
                    </div>
                  </div>
                )}

                {/* Form Row 1: Title & Category */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Policy Title *</label>
                    <Input
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="e.g. Work Timings & Shift Hours Policy"
                      className="rounded-xl border-slate-200 text-xs bg-white"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Category *</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="TIMINGS">Timings & Shifts</option>
                      <option value="GRACE_PERIOD">Grace Period & Attendance</option>
                      <option value="LEAVE">Leave & Time-Off</option>
                      <option value="REMOTE_WORK">Remote & Hybrid Work (WFH)</option>
                      <option value="CONDUCT">Code of Conduct & POSH</option>
                      <option value="EXPENSES">Travel & Reimbursements</option>
                      <option value="APPRAISAL">Appraisal & KPIs</option>
                      <option value="GENERAL">General Policy</option>
                    </select>
                  </div>
                </div>

                {/* Form Row 2: Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Short Summary / Highlights (TL;DR)</label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Brief 1-2 sentence overview shown in policy cards and reader highlights..."
                    className="w-full h-16 p-3 rounded-xl border border-slate-200 bg-white text-xs font-normal text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Form Row 3: Rich Content */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Full Policy Content (Markdown & Headings) *</label>
                    <span className="text-[11px] text-slate-400">Use ### for Headings, - for bullets, | for tables</span>
                  </div>
                  <textarea
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    placeholder="Enter complete policy clauses, rules, penalties, and tables here..."
                    className="w-full h-52 p-3 font-mono text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                    required
                  />
                </div>

                {/* Form Row 4: Policy Attributes */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">Version</label>
                    <Input
                      value={formVersion}
                      onChange={(e) => setFormVersion(e.target.value)}
                      placeholder="1.0"
                      className="rounded-xl border-slate-200 text-xs bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">Status</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800"
                    >
                      <option value="PUBLISHED">Published</option>
                      <option value="DRAFT">Draft</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">Target Audience</label>
                    <select
                      value={formTargetAudience}
                      onChange={(e) => setFormTargetAudience(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800"
                    >
                      <option value="ALL">All Employees & Leads</option>
                      <option value="EMPLOYEE">Employees Only</option>
                      <option value="TEAM_LEAD">Team Leads Only</option>
                      <option value="HR">HR Only</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">Effective Date</label>
                    <Input
                      type="date"
                      value={formEffectiveDate}
                      onChange={(e) => setFormEffectiveDate(e.target.value)}
                      className="rounded-xl border-slate-200 text-xs bg-white"
                    />
                  </div>
                </div>

                {/* Form Row 5: Flags */}
                <div className="flex items-center gap-6 pt-2 bg-white p-3.5 rounded-xl border border-slate-200">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={formIsMandatory}
                      onChange={(e) => setFormIsMandatory(e.target.checked)}
                      className="rounded text-indigo-600 h-4 w-4"
                    />
                    Mark as Mandatory Policy
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={formRequiresAck}
                      onChange={(e) => setFormRequiresAck(e.target.checked)}
                      className="rounded text-indigo-600 h-4 w-4"
                    />
                    Requires Employee Acknowledgement
                  </label>
                </div>
              </div>
            ) : (
              /* Live Preview */
              <div className="space-y-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
                <div className="border-b border-slate-100 pb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                    {CATEGORY_META[formCategory]?.label || formCategory}
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mt-2">{formTitle || 'Untitled Policy'}</h3>
                  <p className="text-xs text-slate-500 mt-1">{formDescription}</p>
                </div>

                <div className="prose prose-slate max-w-none text-xs leading-relaxed space-y-3">
                  {formContent ? (
                    formContent.split('\n\n').map((block, idx) => (
                      <p key={idx} dangerouslySetInnerHTML={{ 
                        __html: block.replace(/### (.*?)\n/g, '<strong class="text-slate-900 block text-sm my-2">$1</strong>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
                      }} />
                    ))
                  ) : (
                    <p className="text-slate-400 italic">No content typed yet.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Editor Footer */}
          <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditorOpen(false)}
              className="text-xs rounded-xl"
            >
              Cancel
            </Button>

            <Button
              size="sm"
              onClick={() => savePolicyMutation.mutate()}
              disabled={savePolicyMutation.isPending || !formTitle || !formContent}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/25"
            >
              {savePolicyMutation.isPending ? 'Saving...' : editingPolicy ? 'Update Policy' : 'Publish Policy'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Shift & Grace Period Quick Settings Modal ───────────────────────── */}
      <Dialog open={isConfigModalOpen} onOpenChange={setIsConfigModalOpen}>
        <DialogContent className="max-w-lg rounded-2xl overflow-hidden shadow-2xl p-0">
          <DialogHeader className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
            <DialogTitle className="text-base font-black text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-400" />
              Company Shift & Grace Settings
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-300">
              Configure official company check-in timings, grace period thresholds, and weekend policies.
            </DialogDescription>
          </DialogHeader>

          <div className="p-5 bg-slate-50 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Shift Start (Login)</label>
                <Input
                  type="time"
                  value={configLoginTime}
                  onChange={(e) => setConfigLoginTime(e.target.value)}
                  className="rounded-xl bg-white border-slate-200 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Shift End (Logout)</label>
                <Input
                  type="time"
                  value={configLogoutTime}
                  onChange={(e) => setConfigLogoutTime(e.target.value)}
                  className="rounded-xl bg-white border-slate-200 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Grace Period (Minutes)</label>
                <Input
                  type="number"
                  min="0"
                  max="60"
                  value={configGracePeriod}
                  onChange={(e) => setConfigGracePeriod(Number(e.target.value))}
                  className="rounded-xl bg-white border-slate-200 text-xs"
                />
                <p className="text-[10px] text-amber-700 font-semibold">
                  Cutoff: {format12h(configLoginTime)} + {configGracePeriod}m
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Break Allowance (Mins)</label>
                <Input
                  type="number"
                  min="0"
                  max="120"
                  value={configBreakAllowance}
                  onChange={(e) => setConfigBreakAllowance(Number(e.target.value))}
                  className="rounded-xl bg-white border-slate-200 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Weekend Schedule</label>
              <select
                value={configWeekendPolicy}
                onChange={(e) => setConfigWeekendPolicy(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800"
              >
                <option value="ALL_SATURDAYS_OFF">All Saturdays & Sundays Off (5-Day Week)</option>
                <option value="ALTERNATE_SATURDAYS_OFF">Alternate Saturdays Off (2nd & 4th Sat Off)</option>
                <option value="ALL_SATURDAYS_WORKING">All Saturdays Working (6-Day Week)</option>
              </select>
            </div>
          </div>

          <DialogFooter className="p-4 bg-white border-t border-slate-100 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsConfigModalOpen(false)}
              className="text-xs rounded-xl"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => saveConfigMutation.mutate()}
              disabled={saveConfigMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/25"
            >
              {saveConfigMutation.isPending ? 'Saving...' : 'Save & Sync Policies'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
