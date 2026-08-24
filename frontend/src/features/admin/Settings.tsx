import { Fragment, useState, useEffect, useMemo } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { useAuthStore } from '@/store/authStore'
import { usePermissions } from '@/hooks/usePermissions'
import { getCompanyPolicy, saveCompanyPolicy, type CompanyPolicy } from '@/lib/companyPolicy'
import {
  PERMISSION_CATEGORIES,
  DEFAULT_ROLE_LABELS,
  ADMIN_VISIBLE_ROLES,
  getCompanyRolePermissions,
  saveCompanyRolePermissions,
  getCompanyRoleLabels,
  saveCompanyRoleLabels,
  type RolePermissionsMatrix
} from '@/lib/rolePermissions'
import { Permission } from '@/config/permissions'
import type { Role } from '@/types/user'
import { 
  Clock, MapPin, Award, ShieldCheck, CheckCircle2, Navigation, Sparkles, 
  Sliders, Calendar, CheckSquare, Layers, Lock, AlertTriangle, Users, Pencil, 
  Save, LayoutDashboard, Megaphone, TrendingUp, DollarSign, FileText, Bell,
  Shield, Check, ArrowUpRight, Building2, UserCheck, ShieldAlert
} from 'lucide-react'

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function Settings() {
  const { user, profile } = useAuthStore()
  const { hasPermission } = usePermissions()
  const { toast } = useToast()
  const navigate = useNavigate()

  const companyDomain = useMemoDomain()
  const [policy, setPolicy] = useState<CompanyPolicy>(() => getCompanyPolicy(companyDomain))
  const [compRoleMatrix, setCompRoleMatrix] = useState<RolePermissionsMatrix>(() => getCompanyRolePermissions(companyDomain))
  const [compRoleLabels, setCompRoleLabels] = useState(() => getCompanyRoleLabels(companyDomain))
  const [activeTab, setActiveTab] = useState<'shift' | 'geo' | 'points' | 'modules' | 'roles'>('shift')
  const [isLocating, setIsLocating] = useState(false)

  // Live ticking clock matching Dashboard
  const [currentTime, setCurrentTime] = useState<string>('')
  const [currentDate, setCurrentDate] = useState<string>('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      )
      setCurrentDate(
        now.toLocaleDateString('en-US', {
          weekday: 'long',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      )
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  function useMemoDomain() {
    if (user?.email && user.email.includes('@')) {
      return user.email.split('@')[1]
    }
    return 'default'
  }

  useEffect(() => {
    setPolicy(getCompanyPolicy(companyDomain))
    setCompRoleMatrix(getCompanyRolePermissions(companyDomain))
    setCompRoleLabels(getCompanyRoleLabels(companyDomain))
  }, [companyDomain])

  const handleToggleRolePermission = (role: Role, permKey: Permission) => {
    if (role === 'super_admin' || role === 'admin') return
    setCompRoleMatrix(prev => {
      const currentPerms = prev[role] || []
      const exists = currentPerms.includes(permKey)
      const updated = exists ? currentPerms.filter(p => p !== permKey) : [...currentPerms, permKey]
      return { ...prev, [role]: updated }
    })
  }

  const handleSaveRoleMatrix = () => {
    saveCompanyRolePermissions(companyDomain, compRoleMatrix)
    saveCompanyRoleLabels(companyDomain, compRoleLabels)
    toast({
      title: 'Organization Roles & Permissions Saved',
      description: `Updated role permissions and titles for ${companyDomain}.`,
    })
  }

  const handleSavePolicy = () => {
    saveCompanyPolicy(companyDomain, policy)
    toast({
      title: 'Company SaaS Policy Saved',
      description: `Updated shift times, geofencing, working days, and point quotas for ${companyDomain}.`,
    })
  }

  const handleSaveAll = () => {
    handleSavePolicy()
    handleSaveRoleMatrix()
  }

  // Quick preset working days selection
  const handleSelectPresetDays = (preset: string) => {
    let days: string[] = []
    if (preset === 'Mon to Fri (5 Days)') {
      days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    } else if (preset === 'Mon to Sat (6 Days)') {
      days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    } else if (preset === 'All 7 Days (7 Days)') {
      days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    } else {
      days = policy.workingDays
    }
    setPolicy({ ...policy, workingDaysPreset: preset, workingDays: days })
  }

  // Toggle individual day in checklist
  const handleToggleDay = (day: string) => {
    const isSelected = policy.workingDays.includes(day)
    let updatedDays: string[] = []
    if (isSelected) {
      updatedDays = policy.workingDays.filter(d => d !== day)
    } else {
      updatedDays = [...policy.workingDays, day]
    }
    setPolicy({ ...policy, workingDaysPreset: 'Custom', workingDays: updatedDays })
  }

  // Fetch current browser GPS location for geofencing setup
  const handleFetchCurrentGPS = () => {
    if (!navigator.geolocation) {
      toast({ title: 'Geolocation Not Supported', description: 'Browser does not support GPS location.', variant: 'destructive' })
      return
    }
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Math.round(pos.coords.latitude * 10000) / 10000
        const lng = Math.round(pos.coords.longitude * 10000) / 10000
        setPolicy({
          ...policy,
          officeLatitude: lat,
          officeLongitude: lng,
        })
        setIsLocating(false)
        toast({ title: 'GPS Location Captured', description: `Office coordinates set to ${lat}, ${lng}` })
      },
      (err) => {
        setIsLocating(false)
        toast({ title: 'GPS Access Denied', description: err.message, variant: 'destructive' })
      },
      { enableHighAccuracy: true }
    )
  }

  return (
    <div className="space-y-6 fade-in duration-500 text-slate-800 pb-12">
      {/* ══════════════════════════════════════════════════════════════
          SECONDARY TOP NAVIGATION BAR (Dashboard Style)
      ══════════════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200/80 text-xs font-semibold text-slate-600">
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="py-3 px-2 text-xs font-bold border-b-2 border-transparent text-slate-400 hover:text-slate-900 transition-all whitespace-nowrap flex items-center gap-1.5"
        >
          <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
        </button>

        {hasPermission(Permission.MANAGE_EMPLOYEES) && (
          <button
            onClick={() => navigate('/admin/employees')}
            className="py-3 px-2 text-xs font-bold border-b-2 border-transparent text-slate-400 hover:text-slate-900 transition-all whitespace-nowrap flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5" /> Employees Directory
          </button>
        )}

        {hasPermission(Permission.CREATE_TEAM) && (
          <button
            onClick={() => navigate('/admin/teams')}
            className="py-3 px-2 text-xs font-bold border-b-2 border-transparent text-slate-400 hover:text-slate-900 transition-all whitespace-nowrap flex items-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5" /> Teams & Departments
          </button>
        )}

        {hasPermission(Permission.MANAGE_ANNOUNCEMENTS) && (
          <button
            onClick={() => navigate('/admin/announcements')}
            className="py-3 px-2 text-xs font-bold border-b-2 border-transparent text-slate-400 hover:text-slate-900 transition-all whitespace-nowrap flex items-center gap-1.5"
          >
            <Megaphone className="w-3.5 h-3.5" /> Announcements
          </button>
        )}

        {hasPermission(Permission.VIEW_ORG_ANALYTICS) && (
          <button
            onClick={() => navigate('/admin/analytics')}
            className="py-3 px-2 text-xs font-bold border-b-2 border-transparent text-slate-400 hover:text-slate-900 transition-all whitespace-nowrap flex items-center gap-1.5"
          >
            <TrendingUp className="w-3.5 h-3.5" /> Org Analytics
          </button>
        )}

        {hasPermission(Permission.VIEW_ORG_ANALYTICS) && (
          <button
            onClick={() => navigate('/admin/finance')}
            className="py-3 px-2 text-xs font-bold border-b-2 border-transparent text-slate-400 hover:text-slate-900 transition-all whitespace-nowrap flex items-center gap-1.5"
          >
            <DollarSign className="w-3.5 h-3.5" /> Finance Management
          </button>
        )}

        {hasPermission(Permission.VIEW_ACTIVITY_LOGS) && (
          <button
            onClick={() => navigate('/admin/audit-logs')}
            className="py-3 px-2 text-xs font-bold border-b-2 border-transparent text-slate-400 hover:text-slate-900 transition-all whitespace-nowrap flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" /> Audit Logs
          </button>
        )}

        {hasPermission(Permission.MANAGE_SETTINGS) && (
          <button
            onClick={() => navigate('/admin/settings')}
            className="py-3 px-2 text-xs font-bold border-b-2 border-blue-600 text-blue-700 transition-all whitespace-nowrap flex items-center gap-1.5"
          >
            <Sliders className="w-3.5 h-3.5" /> Company Profile & Settings
          </button>
        )}

        {hasPermission(Permission.VIEW_NOTIFICATIONS) && (
          <button
            onClick={() => navigate('/admin/notifications')}
            className="py-3 px-2 text-xs font-bold border-b-2 border-transparent text-slate-400 hover:text-slate-900 transition-all whitespace-nowrap flex items-center gap-1.5"
          >
            <Bell className="w-3.5 h-3.5" /> Notifications
          </button>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          HERO BANNER (Royal Sapphire & Electric Azure Canvas)
      ══════════════════════════════════════════════════════════════ */}
      <section 
        className="relative overflow-hidden rounded-[26px] p-8 sm:p-10 text-white flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 shadow-[0_14px_34px_rgba(37,99,235,0.25)]"
        style={{
          background: 'radial-gradient(600px 320px at 8% 0%, rgba(255,255,255,0.22), transparent 55%), radial-gradient(500px 400px at 92% 100%, rgba(56,189,248,0.45), transparent 55%), radial-gradient(420px 340px at 78% -10%, rgba(99,102,241,0.38), transparent 55%), linear-gradient(120deg, #1E3A8A 0%, #2563EB 45%, #0284C7 100%)'
        }}
      >
        <div className="absolute w-[90px] h-[90px] top-[18px] right-[230px] rounded-full bg-white/16 blur-[2px] pointer-events-none" />
        <div className="absolute w-[36px] h-[36px] bottom-[26px] right-[340px] rounded-full bg-white/22 blur-[2px] pointer-events-none" />
        <div className="absolute w-[16px] h-[16px] top-[64px] right-[400px] rounded-full bg-[#38BDF8] opacity-90 shadow-[0_0_16px_rgba(56,189,248,0.7)] pointer-events-none" />

        {/* Left Content */}
        <div className="relative z-10 space-y-3.5 max-w-2xl min-w-0">
          <div className="text-xs tracking-[1.4px] uppercase text-[#E0F2FE] font-extrabold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#34D399] shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse" />
            Active Organization Policies · Settings & Governance
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-['Space_Grotesk'] leading-tight">
            Company Settings & Access Control
          </h1>

          <p className="text-sm text-[#E0F2FE] leading-relaxed max-w-xl">
            Govern shift policies, GPS attendance radius, monthly sprint points quota, SaaS modules, and granular permissions for <strong className="text-white font-bold">{companyDomain}</strong>.
          </p>

          {/* Hero Trust Chips */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="flex items-center gap-2 bg-white/14 backdrop-blur-md border border-white/26 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs">
              <Building2 className="w-4 h-4 text-[#DFFFF2]" />
              <span className="font-extrabold text-sm font-['JetBrains_Mono']">{companyDomain}</span>
              <span className="text-[#DBEAFE]">Domain</span>
            </div>

            <div className="flex items-center gap-2 bg-white/14 backdrop-blur-md border border-white/26 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs">
              <Clock className="w-4 h-4 text-[#DFFFF2]" />
              <span className="font-extrabold text-sm font-['JetBrains_Mono']">{policy.loginTime}</span>
              <span className="text-[#DBEAFE]">Shift Start (+{policy.graceTimeMinutes}m)</span>
            </div>

            <div className="flex items-center gap-2 bg-white/14 backdrop-blur-md border border-white/26 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs">
              <ShieldCheck className="w-4 h-4 text-[#DFFFF2]" />
              <span className="font-extrabold text-sm font-['JetBrains_Mono']">3 Roles</span>
              <span className="text-[#DBEAFE]">HR, TL, Employee</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <Button 
              onClick={activeTab === 'roles' ? handleSaveRoleMatrix : handleSavePolicy}
              className="bg-white hover:bg-[#EFF6FF] text-blue-900 font-bold text-xs h-10.5 px-5 rounded-xl shadow-[0_10px_22px_rgba(0,0,0,0.18)] hover:-translate-y-0.5 transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4 text-blue-600" />
              {activeTab === 'roles' ? 'Save Roles & Permissions' : 'Save Company Policies'}
            </Button>

            <Link to="/admin/dashboard">
              <Button variant="ghost" className="bg-white/14 hover:bg-white/22 text-white border border-white/30 backdrop-blur-md font-bold text-xs h-10.5 px-5 rounded-xl hover:-translate-y-0.5 transition-all flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4 text-white" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Right Digital Live Clock Glass Card */}
        <div className="relative z-10 bg-white/14 border border-white/28 backdrop-blur-md rounded-2xl p-6 text-center min-w-[210px] w-full lg:w-auto shadow-lg shrink-0">
          <div className="text-3xl font-bold font-['JetBrains_Mono'] tracking-wide text-white">
            {currentTime || '09:00 AM'}
          </div>
          <div className="text-xs text-[#E0F2FE] mt-1 font-medium">
            {currentDate || 'Today'}
          </div>
          <div className="flex items-center justify-center gap-2 mt-3.5 text-xs font-bold text-[#DFFFF2] bg-white/10 py-1.5 px-3 rounded-full border border-white/10">
            <span className="w-2 h-2 rounded-full bg-[#34D399] shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-ping" />
            Settings Session Active
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SETTINGS TABS BAR (Dashboard Style Segmented Control)
      ══════════════════════════════════════════════════════════════ */}
      <div className="bg-white border border-slate-200/80 rounded-[20px] p-2 shadow-[0_2px_6px_rgba(37,99,235,0.05)] flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('shift')}
          className={`flex-1 min-w-[155px] py-2.5 px-4 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'shift'
              ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-md shadow-blue-500/25'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-bold'
          }`}
        >
          <Clock className="w-4 h-4" /> 1. Work Shift & Hours
        </button>

        <button
          onClick={() => setActiveTab('geo')}
          className={`flex-1 min-w-[155px] py-2.5 px-4 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'geo'
              ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-md shadow-blue-500/25'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-bold'
          }`}
        >
          <MapPin className="w-4 h-4" /> 2. Geolocation Access
        </button>

        <button
          onClick={() => setActiveTab('points')}
          className={`flex-1 min-w-[155px] py-2.5 px-4 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'points'
              ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-md shadow-blue-500/25'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-bold'
          }`}
        >
          <Award className="w-4 h-4" /> 3. Sprint Point Quotas
        </button>

        <button
          onClick={() => setActiveTab('modules')}
          className={`flex-1 min-w-[155px] py-2.5 px-4 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'modules'
              ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-md shadow-blue-500/25'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-bold'
          }`}
        >
          <Layers className="w-4 h-4" /> 4. SaaS Modules Matrix
        </button>

        <button
          onClick={() => setActiveTab('roles')}
          className={`flex-1 min-w-[165px] py-2.5 px-4 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'roles'
              ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-400/40'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-bold'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-blue-500" /> 5. Roles & Permissions
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none text-[10px] font-black px-1.5 py-0 rounded-md">
            Matrix
          </Badge>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          TAB 1: WORK SHIFT & WORKING DAYS
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'shift' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in-50 duration-300">
          <div className="bg-white border border-slate-200/80 rounded-[22px] p-6 shadow-[0_2px_6px_rgba(37,99,235,0.05)] hover:shadow-[0_14px_34px_rgba(37,99,235,0.10)] transition-all duration-300 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-[13px] bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] flex items-center justify-center text-white shadow-[0_8px_16px_rgba(37,99,235,0.3)]">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 font-['Space_Grotesk']">Office Shift Schedule & Grace Period</h3>
                <p className="text-xs text-slate-500 font-medium">Define official clock-in time, grace allowance, and logout hours.</p>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="loginTime" className="text-xs font-bold text-slate-700">Official Login Time *</Label>
                  <Input
                    id="loginTime"
                    type="time"
                    value={policy.loginTime}
                    onChange={e => setPolicy({ ...policy, loginTime: e.target.value })}
                    className="bg-slate-50 border-slate-200 text-xs font-bold h-10 rounded-xl"
                  />
                  <span className="text-[10px] text-slate-400 font-semibold">e.g. 09:00 AM</span>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="graceMins" className="text-xs font-bold text-slate-700">Grace Allowance (Mins) *</Label>
                  <Input
                    id="graceMins"
                    type="number"
                    min={0}
                    max={60}
                    value={policy.graceTimeMinutes}
                    onChange={e => setPolicy({ ...policy, graceTimeMinutes: Number(e.target.value) || 0 })}
                    className="bg-slate-50 border-slate-200 text-xs font-bold h-10 rounded-xl"
                  />
                  <span className="text-[10px] text-slate-400 font-semibold">Late after {policy.loginTime} + {policy.graceTimeMinutes}m</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="logoutTime" className="text-xs font-bold text-slate-700">Official Logout Time *</Label>
                <Input
                  id="logoutTime"
                  type="time"
                  value={policy.logoutTime}
                  onChange={e => setPolicy({ ...policy, logoutTime: e.target.value })}
                  className="bg-slate-50 border-slate-200 text-xs font-bold h-10 rounded-xl"
                />
                <span className="text-[10px] text-slate-400 font-semibold">Shift auto checkout threshold</span>
              </div>

              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50/50 border border-blue-100 rounded-2xl text-xs space-y-1.5 text-slate-700">
                <span className="font-extrabold text-blue-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" /> Active Shift Rule:
                </span>
                <p className="leading-relaxed">
                  Employees clocking in after <strong>{policy.loginTime}</strong> (with <strong>{policy.graceTimeMinutes} mins</strong> grace window) will be automatically designated as <strong className="text-amber-700">LATE</strong> on attendance records.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-[22px] p-6 shadow-[0_2px_6px_rgba(37,99,235,0.05)] hover:shadow-[0_14px_34px_rgba(37,99,235,0.10)] transition-all duration-300 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-[13px] bg-gradient-to-br from-[#6366F1] to-[#4338CA] flex items-center justify-center text-white shadow-[0_8px_16px_rgba(99,102,241,0.3)]">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 font-['Space_Grotesk']">Working Days Schedule & Weekly Off</h3>
                <p className="text-xs text-slate-500 font-medium">Choose preset schedules or check individual working days.</p>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Working Days Preset</Label>
                <Select
                  value={policy.workingDaysPreset}
                  onValueChange={handleSelectPresetDays}
                >
                  <SelectTrigger className="bg-slate-50 border-slate-200 text-xs font-bold h-10 rounded-xl">
                    <SelectValue placeholder="Select preset" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                    <SelectItem value="Mon to Fri (5 Days)">Mon to Fri (5 Days Working)</SelectItem>
                    <SelectItem value="Mon to Sat (6 Days)">Mon to Sat (6 Days Working)</SelectItem>
                    <SelectItem value="All 7 Days (7 Days)">All 7 Days (Continuous Working)</SelectItem>
                    <SelectItem value="Custom">Custom Working Days Checklist</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 pt-1">
                <Label className="text-xs font-bold text-slate-700 block">Weekly Working Days Checklist:</Label>
                <div className="grid grid-cols-2 gap-2.5">
                  {DAYS_OF_WEEK.map(day => {
                    const isChecked = policy.workingDays.includes(day)
                    return (
                      <label
                        key={day}
                        onClick={() => handleToggleDay(day)}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-blue-50 text-blue-900 border-blue-200 shadow-2xs'
                            : 'bg-slate-50 text-slate-400 border-slate-200/80 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                        />
                        <span>{day}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 2: GEOLOCATION ATTENDANCE
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'geo' && (
        <div className="bg-white border border-slate-200/80 rounded-[22px] p-6 shadow-[0_2px_6px_rgba(37,99,235,0.05)] hover:shadow-[0_14px_34px_rgba(37,99,235,0.10)] transition-all duration-300 space-y-6 max-w-4xl animate-in fade-in-50 duration-300">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-[13px] bg-gradient-to-br from-[#10B981] to-[#047857] flex items-center justify-center text-white shadow-[0_8px_16px_rgba(16,185,129,0.3)]">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 font-['Space_Grotesk']">Office Geolocation Access & Geofencing</h3>
                <p className="text-xs text-slate-500 font-medium">Enforce GPS perimeter validation when employees clock in/out.</p>
              </div>
            </div>

            <Badge variant="outline" className={policy.enableGeolocationAttendance ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-extrabold text-xs px-3 py-1' : 'bg-slate-100 text-slate-500 font-extrabold text-xs px-3 py-1'}>
              {policy.enableGeolocationAttendance ? '● Geofencing Active' : '○ Geofencing Disabled'}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div>
              <span className="font-bold text-slate-900 text-sm block">Enable GPS Geolocation Attendance Access</span>
              <span className="text-xs text-slate-500">Require staff to be physically inside office coordinates during clock-in.</span>
            </div>
            <button
              type="button"
              onClick={() => setPolicy({ ...policy, enableGeolocationAttendance: !policy.enableGeolocationAttendance })}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                policy.enableGeolocationAttendance ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                policy.enableGeolocationAttendance ? 'right-0.5' : 'left-0.5'
              }`} />
            </button>
          </div>

          {policy.enableGeolocationAttendance && (
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Office Geofence Coordinates:</span>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleFetchCurrentGPS}
                  disabled={isLocating}
                  className="border-blue-200 text-blue-700 hover:bg-blue-50 h-9 text-xs font-bold rounded-xl"
                >
                  <Navigation className={`w-3.5 h-3.5 mr-1.5 ${isLocating ? 'animate-spin' : ''}`} />
                  {isLocating ? 'Locating GPS...' : 'Capture Current GPS Location'}
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="officeLat" className="text-xs font-bold text-slate-700">Office Latitude *</Label>
                  <Input
                    id="officeLat"
                    type="number"
                    step="any"
                    value={policy.officeLatitude}
                    onChange={e => setPolicy({ ...policy, officeLatitude: Number(e.target.value) || 0 })}
                    className="bg-slate-50 border-slate-200 text-xs font-mono font-bold h-10 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="officeLng" className="text-xs font-bold text-slate-700">Office Longitude *</Label>
                  <Input
                    id="officeLng"
                    type="number"
                    step="any"
                    value={policy.officeLongitude}
                    onChange={e => setPolicy({ ...policy, officeLongitude: Number(e.target.value) || 0 })}
                    className="bg-slate-50 border-slate-200 text-xs font-mono font-bold h-10 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="radiusMeters" className="text-xs font-bold text-slate-700">Geofence Radius (Meters) *</Label>
                  <Input
                    id="radiusMeters"
                    type="number"
                    value={policy.allowedRadiusMeters}
                    onChange={e => setPolicy({ ...policy, allowedRadiusMeters: Number(e.target.value) || 100 })}
                    className="bg-slate-50 border-slate-200 text-xs font-bold h-10 rounded-xl"
                  />
                </div>
              </div>

              <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl text-xs space-y-1.5">
                <span className="font-extrabold text-emerald-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Geofence Rule Enforced:
                </span>
                <p className="text-slate-700 leading-relaxed">
                  Employees attempting to clock in outside <strong>{policy.allowedRadiusMeters} meters</strong> of Lat: <code>{policy.officeLatitude}</code>, Long: <code>{policy.officeLongitude}</code> will receive a location warning alert.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 3: MONTHLY SPRINT POINTS QUOTA
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'points' && (
        <div className="bg-white border border-slate-200/80 rounded-[22px] p-6 shadow-[0_2px_6px_rgba(37,99,235,0.05)] hover:shadow-[0_14px_34px_rgba(37,99,235,0.10)] transition-all duration-300 space-y-6 max-w-3xl animate-in fade-in-50 duration-300">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-[13px] bg-gradient-to-br from-[#F59E0B] to-[#D97706] flex items-center justify-center text-white shadow-[0_8px_16px_rgba(245,158,11,0.3)]">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 font-['Space_Grotesk']">Monthly Sprint Points Quota & Student Allocation</h3>
                <p className="text-xs text-slate-500 font-medium">Configure the monthly points budget allocated to team members.</p>
              </div>
            </div>

            <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 font-extrabold text-xs px-3 py-1">
              Monthly Cycle
            </Badge>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="sprintQuota" className="text-xs font-bold text-slate-700 block">
                Monthly Sprint Points Quota per Member (Input Points Amount) *
              </Label>
              <Input
                id="sprintQuota"
                type="number"
                min={1}
                max={1000}
                value={policy.sprintPointQuota}
                onChange={e => setPolicy({ ...policy, sprintPointQuota: Number(e.target.value) || 60, sprintPointPeriod: 'Monthly' })}
                className="bg-slate-50 border-amber-300 text-sm font-extrabold text-amber-900 h-11 max-w-md rounded-xl"
                placeholder="e.g. 60 or 50 points"
              />
              <span className="text-[11px] text-slate-500 block font-medium">Input the total sprint points allocated to each member/student per month.</span>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <Label htmlFor="maxTaskPoints" className="text-xs font-bold text-slate-700">Max Story Points Per Single Task *</Label>
              <Input
                id="maxTaskPoints"
                type="number"
                min={1}
                max={50}
                value={policy.maxTaskPoints}
                onChange={e => setPolicy({ ...policy, maxTaskPoints: Number(e.target.value) || 10 })}
                className="bg-slate-50 border-slate-200 text-xs font-bold h-10 max-w-xs rounded-xl"
              />
              <span className="text-[10px] text-slate-400 block font-medium">Prevents assigning abnormally high points to a single task item.</span>
            </div>

            <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-2 text-xs">
              <span className="font-extrabold text-amber-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" /> Active Quota Policy Rule:
              </span>
              <p className="text-slate-700 leading-relaxed">
                Each team member under <strong>{companyDomain}</strong> is allocated a maximum of <strong>{policy.sprintPointQuota} story points</strong> per <strong>{policy.sprintPointPeriod.toLowerCase()}</strong> cycle. Task evaluation scores awarded by Team Leads will be capped at <strong>{policy.sprintPointQuota} points</strong> per member.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 4: SAAS MODULES MATRIX
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'modules' && (
        <div className="bg-white border border-slate-200/80 rounded-[22px] p-6 shadow-[0_2px_6px_rgba(37,99,235,0.05)] hover:shadow-[0_14px_34px_rgba(37,99,235,0.10)] transition-all duration-300 space-y-5 max-w-3xl animate-in fade-in-50 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-[13px] bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] flex items-center justify-center text-white shadow-[0_8px_16px_rgba(139,92,246,0.3)]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 font-['Space_Grotesk']">SaaS Feature Modules & Access Matrix</h3>
              <p className="text-xs text-slate-500 font-medium">Enable or disable specific product modules for your organization.</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {[
              { key: 'taskManagement', title: 'Task Management & Kanban Board', desc: 'Deliverable creation, sprint story points, and Kanban workflow tracking' },
              { key: 'geolocationAttendance', title: 'GPS Geolocation Attendance & Clock In/Out', desc: 'Real-time location checking and shift time attendance tracking' },
              { key: 'skillTrack', title: 'Skill Track & Learning Portal', desc: 'Skill growth tracks, courses, assessments, and certifications' },
              { key: 'performanceAppraisals', title: 'Performance Appraisals & Monthly Points', desc: 'Evaluation scores, leaderboard rankings, and performance appraisals' },
              { key: 'payroll', title: 'Payroll & Payslip Generator', desc: 'Salary breakdowns, LOP deductions, tax deductions, and downloadable payslips' },
              { key: 'teamChat', title: 'Team Chat & Announcement Board', desc: 'Direct chat messaging, group channels, and corporate announcements' },
            ].map(mod => {
              const isEnabled = (policy.enabledModules as any)[mod.key]
              return (
                <div key={mod.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/80 hover:bg-slate-100/60 transition-colors">
                  <div>
                    <span className="font-extrabold text-slate-900 text-xs block">{mod.title}</span>
                    <span className="text-[11px] text-slate-500 font-medium">{mod.desc}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPolicy({
                      ...policy,
                      enabledModules: {
                        ...policy.enabledModules,
                        [mod.key]: !isEnabled
                      }
                    })}
                    className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                      isEnabled ? 'bg-blue-600' : 'bg-slate-300'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                      isEnabled ? 'right-0.5' : 'left-0.5'
                    }`} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 5: ORGANIZATION ROLES & PERMISSIONS MATRIX (Dashboard Style)
          Exclusively shows: HR Manager, Team Lead, Employee (NO Super Admin, NO Admin)
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'roles' && (
        <div className="space-y-6 animate-in fade-in-50 duration-300">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 rounded-[22px] shadow-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
                <h3 className="font-extrabold text-lg text-white font-['Space_Grotesk']">Organization Roles & Permissions Matrix</h3>
              </div>
              <p className="text-xs text-blue-200">
                Configure granular permissions and role display titles for <strong>HR Managers</strong>, <strong>Team Leads</strong>, and <strong>Employees / Students</strong> under {companyDomain}.
              </p>
            </div>

            <Button onClick={handleSaveRoleMatrix} className="bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs h-10 px-5 rounded-xl shadow-md flex items-center gap-2 shrink-0">
              <Save className="w-4 h-4" /> Save Roles & Permissions
            </Button>
          </div>

          {/* Custom Role Labels Customization Cards (HR, Team Lead, Employee) */}
          <div className="bg-white border border-slate-200/80 rounded-[22px] p-6 shadow-[0_2px_6px_rgba(37,99,235,0.05)] space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Pencil className="w-4 h-4 text-blue-600" /> Personalize Organization Role Display Titles & Descriptions
              </h4>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-bold">
                3 Configurable Roles
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {ADMIN_VISIBLE_ROLES.map((r) => {
                const label = compRoleLabels[r] || DEFAULT_ROLE_LABELS[r]
                const colorScheme = r === 'hr' 
                  ? 'border-blue-200 bg-gradient-to-b from-blue-50/50 to-white text-blue-900' 
                  : r === 'team_lead' 
                  ? 'border-teal-200 bg-gradient-to-b from-teal-50/50 to-white text-teal-900' 
                  : 'border-violet-200 bg-gradient-to-b from-violet-50/50 to-white text-violet-900'

                const icon = r === 'hr' 
                  ? <UserCheck className="w-4 h-4 text-blue-600" /> 
                  : r === 'team_lead' 
                  ? <Award className="w-4 h-4 text-teal-600" /> 
                  : <Users className="w-4 h-4 text-violet-600" />

                return (
                  <div key={r} className={`p-4 rounded-2xl border ${colorScheme} space-y-2.5 shadow-2xs`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black tracking-wider uppercase flex items-center gap-1.5">
                        {icon} {r.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold font-mono">ROLE ID: {r.toUpperCase()}</span>
                    </div>

                    <Input
                      value={label?.title || ''}
                      onChange={(e) => setCompRoleLabels(prev => ({
                        ...prev,
                        [r]: { ...(prev[r] || DEFAULT_ROLE_LABELS[r]), title: e.target.value }
                      }))}
                      className="h-9 text-xs font-extrabold border-slate-200 bg-white shadow-2xs rounded-xl"
                      placeholder="Display title..."
                    />
                    <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">{label?.description || ''}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Interactive Roles & Permission Matrix Table */}
          <div className="border border-slate-200/80 rounded-[22px] overflow-hidden shadow-[0_4px_16px_rgba(37,99,235,0.06)] bg-white">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-900 hover:bg-slate-900 text-white border-none">
                  <TableHead className="font-extrabold text-slate-200 text-xs w-[360px] py-3.5 pl-5">Feature & Security Permission Capability</TableHead>
                  {ADMIN_VISIBLE_ROLES.map(r => (
                    <TableHead key={r} className="font-extrabold text-slate-200 text-xs text-center py-3.5">
                      <div className="flex items-center justify-center gap-1.5">
                        {r === 'hr' && <span className="w-2 h-2 rounded-full bg-blue-400" />}
                        {r === 'team_lead' && <span className="w-2 h-2 rounded-full bg-teal-400" />}
                        {r === 'employee' && <span className="w-2 h-2 rounded-full bg-violet-400" />}
                        {(compRoleLabels[r]?.title || r.replace('_', ' ').toUpperCase())}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {PERMISSION_CATEGORIES.map((cat) => (
                  <Fragment key={cat.id}>
                    <TableRow className="bg-slate-100/90 hover:bg-slate-100/90 border-b border-slate-200">
                      <TableCell colSpan={4} className="font-extrabold text-xs text-blue-950 py-3 pl-5">
                        <span className="uppercase tracking-wider text-[11px] font-black text-blue-900">{cat.name}</span>
                        <span className="text-slate-500 font-normal ml-2 text-[11px]">— {cat.description}</span>
                      </TableCell>
                    </TableRow>

                    {cat.permissions.map((perm) => (
                      <TableRow key={perm.key} className="hover:bg-blue-50/40 border-b border-slate-100 transition-colors">
                        <TableCell className="py-3 pl-5">
                          <div className="font-bold text-slate-900 text-xs">{perm.label}</div>
                          <div className="text-[11px] text-slate-500 leading-snug">{perm.description}</div>
                        </TableCell>

                        {ADMIN_VISIBLE_ROLES.map((roleKey) => {
                          const isChecked = (compRoleMatrix[roleKey] || []).includes(perm.key)
                          return (
                            <TableCell key={roleKey} className="text-center align-middle py-3">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleRolePermission(roleKey, perm.key)}
                                className="w-4.5 h-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
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

          <div className="flex justify-end pt-2">
            <Button onClick={handleSaveRoleMatrix} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 px-6 rounded-xl shadow-md flex items-center gap-2">
              <Save className="w-4 h-4" /> Save Roles & Permissions Matrix
            </Button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          STICKY SAVE ACTION BAR
      ══════════════════════════════════════════════════════════════ */}
      <div className="bg-white border border-slate-200/80 rounded-[20px] p-4 shadow-[0_4px_16px_rgba(37,99,235,0.08)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Policies and permission matrix will be applied across all users under <strong>{companyDomain}</strong>.</span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <Button 
            onClick={handleSaveAll}
            className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-bold h-10 px-6 rounded-xl shadow-md shadow-blue-500/25 flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            Save All Settings & Permissions
          </Button>
        </div>
      </div>
    </div>
  )
}
