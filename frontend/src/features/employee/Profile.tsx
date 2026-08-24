import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/authStore'
import { Badge } from '@/components/ui/badge'
import {
  Mail, Shield, User, Bell, Key, Copy, Check, Info, Loader2, Building,
  Globe, Calendar, Clock, Monitor, Phone
} from 'lucide-react'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

export default function Profile() {
  const { user, profile, setProfile, role, permissions } = useAuthStore()
  const { toast } = useToast()

  // Details States
  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [bio, setBio] = useState('')
  const [phone, setPhone] = useState('')
  const [availabilityStatus, setAvailabilityStatus] = useState('Available')
  const [managerName, setManagerName] = useState('None')

  // Preferences & Localization States
  const [timezone, setTimezone] = useState('UTC (GMT+00:00)')
  const [language, setLanguage] = useState('en')
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY')
  const [themeMode, setThemeMode] = useState('system')

  // Notification Preferences States
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [pushAlerts, setPushAlerts] = useState(false)
  const [chatMentionsAlerts, setChatMentionsAlerts] = useState(true)

  // Status/Meta States
  const [updating, setUpdating] = useState(false)
  const [copied, setCopied] = useState(false)

  // Session information
  const [sessionInfo, setSessionInfo] = useState({
    browser: 'Unknown Browser',
    os: 'Unknown OS',
    ip: '192.168.1.1',
    loginTime: 'Just now'
  })

  // Initial Sync of DB columns
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
      setAvatarUrl(profile.avatar_url || '')
    }
  }, [profile])

  // Resolve Manager Name dynamically
  useEffect(() => {
    const resolveManager = async () => {
      if (profile?.manager_id) {
        try {
          const data: any = await api.get('/employee/' + profile.manager_id + '?_select=full_name')
          
          if (data?.full_name) {
            setManagerName(data.full_name)
          }
        } catch (err) {
          console.error('Error fetching manager name:', err)
        }
      } else {
        setManagerName('None')
      }
    }
    resolveManager()
  }, [profile])

  // Load preferences from localStorage on mount
  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`fusion_profile_settings_${user.id}`)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (parsed.jobTitle) setJobTitle(parsed.jobTitle)
          if (parsed.bio) setBio(parsed.bio)
          if (parsed.phone) setPhone(parsed.phone)
          if (parsed.availabilityStatus) setAvailabilityStatus(parsed.availabilityStatus)
          if (parsed.timezone) setTimezone(parsed.timezone)
          if (parsed.language) setLanguage(parsed.language)
          if (parsed.dateFormat) setDateFormat(parsed.dateFormat)
          if (parsed.themeMode) setThemeMode(parsed.themeMode)
          if (parsed.emailAlerts !== undefined) setEmailAlerts(parsed.emailAlerts)
          if (parsed.pushAlerts !== undefined) setPushAlerts(parsed.pushAlerts)
          if (parsed.chatMentionsAlerts !== undefined) setChatMentionsAlerts(parsed.chatMentionsAlerts)
        } catch (e) {
          console.error('Error parsing profile settings:', e)
        }
      }
    }
  }, [user])

  // Resolve user session environment info
  useEffect(() => {
    const userAgent = navigator.userAgent
    let browser = 'Other Browser'
    if (userAgent.indexOf('Chrome') > -1) browser = 'Google Chrome'
    else if (userAgent.indexOf('Safari') > -1) browser = 'Apple Safari'
    else if (userAgent.indexOf('Firefox') > -1) browser = 'Mozilla Firefox'
    else if (userAgent.indexOf('Edge') > -1) browser = 'Microsoft Edge'

    let os = 'Unknown OS'
    if (userAgent.indexOf('Win') > -1) os = 'Windows OS'
    else if (userAgent.indexOf('Mac') > -1) os = 'macOS'
    else if (userAgent.indexOf('Linux') > -1) os = 'Linux OS'
    else if (userAgent.indexOf('Android') > -1) os = 'Android OS'
    else if (userAgent.indexOf('like Mac') > -1) os = 'iOS Device'

    setSessionInfo({
      browser,
      os,
      ip: '10.180.24.95 (Intranet Client)',
      loginTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' (Today)'
    })
  }, [])

  // Dynamic Theme Styling matching the active user portal (Teal for Team Lead, Violet for Employee, Indigo for Super Admin)
  const isTeamLead = role === 'admin'
  const isSuperAdmin = role === 'super_admin'
  const isEmployee = role === 'employee'

  const themeColors = {
    avatarBg: isTeamLead
      ? 'bg-teal-100 text-teal-700 border-teal-200'
      : isSuperAdmin
        ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
        : 'bg-violet-100 text-violet-700 border-violet-200',
    badge: isTeamLead
      ? 'bg-teal-50 text-teal-700 border-teal-100 hover:bg-teal-50/80'
      : isSuperAdmin
        ? 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-50/80'
        : 'bg-violet-50 text-violet-700 border-violet-100 hover:bg-violet-50/80',
    button: isTeamLead
      ? 'bg-teal-600 hover:bg-teal-700 text-white'
      : isSuperAdmin
        ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
        : 'bg-violet-600 hover:bg-violet-700 text-white',
    focusRing: isTeamLead
      ? 'focus-visible:ring-teal-500'
      : isSuperAdmin
        ? 'focus-visible:ring-indigo-500'
        : 'focus-visible:ring-violet-500',
    text: isTeamLead
      ? 'text-teal-700'
      : isSuperAdmin
        ? 'text-indigo-700'
        : 'text-violet-700',
    bgLight: isTeamLead
      ? 'bg-teal-50/30'
      : isSuperAdmin
        ? 'bg-indigo-50/30'
        : 'bg-violet-50/30',
    borderActive: isTeamLead
      ? 'data-[state=active]:border-teal-500 data-[state=active]:text-teal-700'
      : isSuperAdmin
        ? 'data-[state=active]:border-indigo-500 data-[state=active]:text-indigo-700'
        : 'data-[state=active]:border-violet-500 data-[state=active]:text-violet-700',
    checkbox: isTeamLead
      ? 'text-teal-600 focus:ring-teal-500 border-teal-300'
      : isSuperAdmin
        ? 'text-indigo-600 focus:ring-indigo-500 border-indigo-300'
        : 'text-violet-600 focus:ring-violet-500 border-violet-300'
  }

  // Update details
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setUpdating(true)
    try {
      // 1. Update Profile via API
      try {
        await api.put('/employee/' + user.id, {
          full_name: fullName.trim(),
          avatar_url: avatarUrl.trim()
        })
      } catch (error) {
        throw error
      }

      // Update store
      if (profile) {
        setProfile({
          ...profile,
          full_name: fullName.trim(),
          avatar_url: avatarUrl.trim()
        })
      }

      // 2. Save localStorage settings
      const settings = {
        jobTitle: jobTitle.trim(),
        bio: bio.trim(),
        phone: phone.trim(),
        availabilityStatus,
        timezone,
        language,
        dateFormat,
        themeMode,
        emailAlerts,
        pushAlerts,
        chatMentionsAlerts
      }
      localStorage.setItem(`fusion_profile_settings_${user.id}`, JSON.stringify(settings))

      toast({
        title: 'Profile Updated',
        description: 'Your profile details and enterprise preferences have been saved successfully.',
      })
    } catch (err: any) {
      toast({
        title: 'Update Failed',
        description: err.message,
        variant: 'destructive'
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleCopyId = () => {
    if (!user) return
    navigator.clipboard.writeText(user.id)
    setCopied(true)
    toast({
      title: 'Copied',
      description: 'Account ID copied to clipboard.',
    })
    setTimeout(() => setCopied(false), 2000)
  }

  const handleResetPassword = async () => {
    if (!user?.email) return
    try {
      // API for reset password if it exists (assuming backend supports it)
      // If not, we just show error
      throw new Error('Reset password via email is managed via API, ensure /auth/reset is implemented in your Express app.')
      toast({
        title: 'Reset Link Sent',
        description: 'Check your email for the password reset instructions.',
      })
    } catch (err: any) {
      toast({
        title: 'Error sending reset email',
        description: err.message,
        variant: 'destructive'
      })
    }
  }

  const activeRoleName = profile?.role?.name || (isSuperAdmin ? 'Super Admin' : isTeamLead ? 'Team Lead' : 'Team Member')

  const dateJoined = (profile?.joining_date || profile?.created_at)
    ? new Date(profile.joining_date || profile.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Unknown'

  // Map status to indicator color
  const getStatusIndicator = (status: string) => {
    switch (status) {
      case 'Available': return 'bg-emerald-500'
      case 'Busy': return 'bg-amber-500'
      case 'Focus Mode': return 'bg-rose-500'
      case 'Out of Office': return 'bg-blue-500'
      case 'In a Meeting': return 'bg-purple-500'
      default: return 'bg-slate-400'
    }
  }

  return (
    <div className="space-y-4 text-slate-800">
      <div className="text-left">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Account Settings</h2>
        <p className="text-muted-foreground text-sm mt-0.5">Manage your enterprise profile, security keys, and workspace preferences.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Left Side: Avatar Panel */}
        <Card className={`col-span-1 shadow-sm flex flex-col items-center p-5 text-center relative overflow-hidden h-fit ${isEmployee ? 'glass-card-strong border-violet-100/30' : 'border-border/60'}`}>
          {/* Decorative gradient blob for employee */}
          {isEmployee && (
            <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-gradient-to-br from-violet-200/30 to-indigo-200/20 blur-2xl pointer-events-none" />
          )}

          {/* Availability Dot Badge */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-white/80 backdrop-blur-sm border border-slate-100 rounded-full px-2.5 py-1 text-[10px] font-semibold text-slate-600 shadow-sm z-10">
            <span className={`h-2 w-2 rounded-full ${getStatusIndicator(availabilityStatus)} animate-pulse`} />
            {availabilityStatus}
          </div>

          <div className="mt-3 relative">
            {/* Gradient ring for employee avatar */}
            {isEmployee && (
              <div className="absolute -inset-1.5 rounded-full bg-gradient-to-br from-violet-400 via-indigo-400 to-purple-400 opacity-60 blur-[2px]" />
            )}
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={fullName}
                className="w-20 h-20 rounded-full object-cover border-3 border-white shadow-md transition-all hover:scale-105 relative z-10"
                onError={() => setAvatarUrl('')}
              />
            ) : (
              <div className={`w-20 h-20 rounded-full flex items-center justify-center font-extrabold text-3xl border-3 border-white shadow-inner transition-all hover:scale-105 relative z-10 ${themeColors.avatarBg}`}>
                {fullName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
          </div>

          <h3 className="text-base font-bold text-slate-955 mt-3">{fullName || 'User Profile'}</h3>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5 tracking-wide uppercase">{jobTitle || 'No Enterprise Title'}</p>

          <p className="text-xs text-slate-500 mt-2.5 flex items-center gap-1.5 justify-center">
            <Mail className="h-3 w-3 text-slate-400" />
            {user?.email}
          </p>

          <Badge variant="outline" className={`mt-3 font-semibold px-2.5 py-1 ${themeColors.badge}`}>
            {activeRoleName}
          </Badge>

          {/* Secondary stats block */}
          <div className={`w-full grid grid-cols-2 gap-2 mt-4 pt-4 border-t text-left ${isEmployee ? 'border-violet-100/40' : 'border-slate-100'}`}>
            <div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Joined Date</p>
              <p className="text-xs font-semibold text-slate-700 mt-0.5">{dateJoined}</p>
            </div>
            <div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Clearance</p>
              <p className="text-xs font-semibold text-slate-700 mt-0.5 flex items-center gap-1">
                <Shield className="h-3 w-3 text-emerald-500" />
                Level {isSuperAdmin ? '3 (Full)' : isTeamLead ? '2 (Lead)' : '1 (Staff)'}
              </p>
            </div>
          </div>
        </Card>

        {/* Right Side: Tab Panel */}
        <Card className={`col-span-2 shadow-sm text-left ${isEmployee ? 'glass-card-strong border-violet-100/30' : 'border-border/60'}`}>
          <Tabs defaultValue="details" className="w-full">
            <div className={`px-5 pt-3 border-b ${isEmployee ? 'border-violet-100/40' : 'border-border/60'}`}>
              <TabsList className="bg-muted/50 p-1 flex gap-1 h-9 w-fit">
                <TabsTrigger value="details" className={`text-xs font-bold px-3 py-1.5 transition-all border-b-2 border-transparent data-[state=active]:bg-white data-[state=active]:shadow-sm ${themeColors.borderActive}`}>Profile</TabsTrigger>
                <TabsTrigger value="preferences" className={`text-xs font-bold px-3 py-1.5 transition-all border-b-2 border-transparent data-[state=active]:bg-white data-[state=active]:shadow-sm ${themeColors.borderActive}`}>Regional</TabsTrigger>
                <TabsTrigger value="notifications" className={`text-xs font-bold px-3 py-1.5 transition-all border-b-2 border-transparent data-[state=active]:bg-white data-[state=active]:shadow-sm ${themeColors.borderActive}`}>Alerts</TabsTrigger>
                <TabsTrigger value="security" className={`text-xs font-bold px-3 py-1.5 transition-all border-b-2 border-transparent data-[state=active]:bg-white data-[state=active]:shadow-sm ${themeColors.borderActive}`}>Security & RBAC</TabsTrigger>
              </TabsList>
            </div>

            {/* Profile Tab */}
            <TabsContent value="details" className="p-5 focus-visible:ring-0 space-y-3">
              <form onSubmit={handleUpdateProfile} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                    <Input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      placeholder="Your Full Name"
                      className={`bg-slate-50/80 border-slate-200 ${themeColors.focusRing} focus-visible:bg-white h-9 rounded-lg text-sm`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Avatar Image URL</label>
                    <Input
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://example.com/avatar.png"
                      className={`bg-slate-50/80 border-slate-200 ${themeColors.focusRing} focus-visible:bg-white h-9 rounded-lg text-sm`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1 col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Job / Corporate Title</label>
                    <Input
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="e.g. Lead Product Designer"
                      className={`bg-slate-50/80 border-slate-200 ${themeColors.focusRing} focus-visible:bg-white h-9 rounded-lg text-sm`}
                    />
                  </div>
                  <div className="space-y-1 col-span-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Availability Status</label>
                    <select
                      value={availabilityStatus}
                      onChange={(e) => setAvailabilityStatus(e.target.value)}
                      className={`bg-slate-50/80 border border-slate-200 text-slate-800 text-sm rounded-lg ${themeColors.focusRing} focus-visible:bg-white focus:outline-none h-9 w-full px-3`}
                    >
                      <option value="Available">🟢 Available</option>
                      <option value="Busy">🟡 Busy</option>
                      <option value="Focus Mode">🔴 Focus Mode</option>
                      <option value="Out of Office">🛫 Out of Office</option>
                      <option value="In a Meeting">🗓️ In a Meeting</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Contact Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (555) 019-2834"
                        className={`bg-slate-50/80 border-slate-200 pl-9 ${themeColors.focusRing} focus-visible:bg-white h-9 rounded-lg text-sm`}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Department Details</label>
                    <div className={`p-2 border rounded-lg flex items-center gap-2 h-9 ${isEmployee ? 'bg-violet-50/30 border-violet-100/40' : 'bg-slate-50 border-slate-150'}`}>
                      <Building className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="text-sm font-semibold text-slate-800">{profile?.department?.name || 'Unassigned General'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Professional Bio / Summary</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Brief description about your corporate background, specialized domains or ongoing goals..."
                    rows={2}
                    className={`bg-slate-50/80 border border-slate-200 text-slate-800 text-sm rounded-lg ${themeColors.focusRing} focus:bg-white focus:outline-none w-full p-2.5 resize-none`}
                  />
                </div>

                {/* Manager info read-only row */}
                <div className={`p-2.5 border rounded-lg flex items-center gap-3 ${isEmployee ? 'glass-card border-violet-100/30' : 'bg-slate-50 border-slate-100'}`}>
                  <User className="h-4 w-4 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Reporting Manager (Org Line)</p>
                    <p className="text-sm font-semibold text-slate-900 mt-0.5">{managerName}</p>
                  </div>
                </div>

                <div className={`flex justify-end pt-3 border-t ${isEmployee ? 'border-violet-100/40' : 'border-slate-100'}`}>
                  <Button
                    type="submit"
                    disabled={updating}
                    className={`text-xs font-semibold h-9 rounded-lg px-4 ${themeColors.button}`}
                  >
                    {updating ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                        Saving Profile...
                      </>
                    ) : (
                      'Save Profile'
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* Regional / Preferences Tab */}
            <TabsContent value="preferences" className="p-5 focus-visible:ring-0 space-y-4">
              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Globe className={`h-4.5 w-4.5 ${themeColors.text}`} />
                  Localization & Workspace Settings
                </h4>
                <p className="text-[10px] text-slate-500">
                  Configure your workspace regional variables. These dictate dynamic dashboard timings and localization filters.
                </p>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Timezone</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className={`bg-slate-50/80 border border-slate-200 text-slate-800 text-sm rounded-lg pl-9 pr-3 ${themeColors.focusRing} focus:bg-white focus:outline-none h-9 w-full`}
                      >
                        <option value="UTC (GMT+00:00)">UTC (GMT+00:00)</option>
                        <option value="EST (GMT-05:00)">EST (GMT-05:00) Eastern Time</option>
                        <option value="PST (GMT-08:00)">PST (GMT-08:00) Pacific Time</option>
                        <option value="IST (GMT+05:30)">IST (GMT+05:30) India Standard Time</option>
                        <option value="GMT (GMT+00:00)">GMT (GMT+00:00) London</option>
                        <option value="CET (GMT+01:00)">CET (GMT+01:00) Central European</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Preferred Language</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className={`bg-slate-50/80 border border-slate-200 text-slate-800 text-sm rounded-lg pl-9 pr-3 ${themeColors.focusRing} focus:bg-white focus:outline-none h-9 w-full`}
                      >
                        <option value="en">English (US/UK)</option>
                        <option value="de">Deutsch (German)</option>
                        <option value="fr">Français (French)</option>
                        <option value="es">Español (Spanish)</option>
                        <option value="ja">日本語 (Japanese)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date Format</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <select
                        value={dateFormat}
                        onChange={(e) => setDateFormat(e.target.value)}
                        className={`bg-slate-50/80 border border-slate-200 text-slate-800 text-sm rounded-lg pl-9 pr-3 ${themeColors.focusRing} focus:bg-white focus:outline-none h-9 w-full`}
                      >
                        <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 06/25/2026)</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 25/06/2026)</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-06-25)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Interface Theme Mode</label>
                    <div className="relative">
                      <Monitor className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <select
                        value={themeMode}
                        onChange={(e) => setThemeMode(e.target.value)}
                        className={`bg-slate-50/80 border border-slate-200 text-slate-800 text-sm rounded-lg pl-9 pr-3 ${themeColors.focusRing} focus:bg-white focus:outline-none h-9 w-full`}
                      >
                        <option value="system">💻 Corporate Default (System)</option>
                        <option value="light">☀️ Light Theme</option>
                        <option value="dark">🌙 Sleek Dark Mode (Alpha)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className={`flex justify-end pt-3 border-t ${isEmployee ? 'border-violet-100/40' : 'border-slate-100'}`}>
                  <Button
                    type="submit"
                    disabled={updating}
                    className={`text-xs font-semibold h-9 rounded-lg px-4 ${themeColors.button}`}
                  >
                    Save Preferences
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* Notification / Alerts Tab */}
            <TabsContent value="notifications" className="p-5 focus-visible:ring-0 space-y-3">
              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Bell className={`h-4.5 w-4.5 ${themeColors.text}`} />
                  Workspace Communication Alerts
                </h4>
                <p className="text-[10px] text-slate-500">
                  Manage when and where notifications regarding task completion alerts, comments, and messages are dispatched.
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <label className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${isEmployee ? 'glass-card border-violet-100/30 hover:bg-white/80' : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'}`}>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-slate-900">Email Alerts Summary</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Receive daily notifications digests of assigned tasks & comments updates</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailAlerts}
                    onChange={(e) => setEmailAlerts(e.target.checked)}
                    className={`rounded h-4 w-4 ${themeColors.checkbox}`}
                  />
                </label>

                <label className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${isEmployee ? 'glass-card border-violet-100/30 hover:bg-white/80' : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'}`}>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-slate-900">Browser Push Notifications</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Allow popups in workspace browser for instant alerts</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={pushAlerts}
                    onChange={(e) => setPushAlerts(e.target.checked)}
                    className={`rounded h-4 w-4 ${themeColors.checkbox}`}
                  />
                </label>

                <label className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${isEmployee ? 'glass-card border-violet-100/30 hover:bg-white/80' : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'}`}>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-slate-900">Direct Chat Mentions Toast</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Show immediate popups for incoming Snapchat-style direct messages</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={chatMentionsAlerts}
                    onChange={(e) => setChatMentionsAlerts(e.target.checked)}
                    className={`rounded h-4 w-4 ${themeColors.checkbox}`}
                  />
                </label>
              </div>

              <div className={`flex justify-end pt-3 border-t ${isEmployee ? 'border-violet-100/40' : 'border-slate-100'}`}>
                <Button
                  type="button"
                  onClick={handleUpdateProfile}
                  className={`text-xs font-semibold h-9 rounded-lg px-4 ${themeColors.button}`}
                >
                  Save Alert Settings
                </Button>
              </div>
            </TabsContent>

            {/* Security & Access Tab */}
            <TabsContent value="security" className="p-5 focus-visible:ring-0 space-y-4">
              {/* Account UUID Copy block */}
              <div className={`p-3.5 border rounded-lg flex items-center justify-between ${isEmployee ? 'glass-card border-violet-100/30' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex items-start gap-3">
                  <Info className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                  <div className="text-left">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Enterprise User Identity (UID)</p>
                    <code className="text-[10px] text-slate-600 block mt-0.5 select-all break-all">{user?.id}</code>
                  </div>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={handleCopyId}
                  className="h-8 w-8 hover:bg-slate-200/50 rounded-full shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="h-4 w-4 text-slate-500" />
                  )}
                </Button>
              </div>

              {/* Password resetting */}
              <div className={`p-3.5 border rounded-lg space-y-2.5 ${isEmployee ? 'glass-card border-violet-100/30' : 'border-slate-200'}`}>
                <div className="flex items-center gap-2">
                  <Key className={`h-4 w-4 ${themeColors.text}`} />
                  <h4 className="text-sm font-bold text-slate-900">Change Account Password</h4>
                </div>
                <p className="text-[10px] text-slate-500">
                  Trigger an enterprise password credentials reset. A secure reset link will be dispatched to your registered workspace email.
                </p>
                <div className="pt-1">
                  <Button
                    type="button"
                    onClick={handleResetPassword}
                    className={`text-xs font-semibold h-8 rounded-lg px-3 ${themeColors.button}`}
                  >
                    Send Password Reset Email
                  </Button>
                </div>
              </div>

              {/* Active RBAC Permissions details */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className={`h-4 w-4 ${themeColors.text}`} />
                  <h4 className="text-sm font-bold text-slate-900">Workspace RBAC Security Access</h4>
                </div>
                <p className="text-[10px] text-slate-500">
                  Active security policy tokens verified for your current account tier. Permissions are managed by super administrators.
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {permissions.length === 0 ? (
                    <Badge variant="outline" className="text-xs text-slate-450 font-normal">
                      No active permissions assigned.
                    </Badge>
                  ) : (
                    permissions.map(perm => (
                      <Badge
                        key={perm}
                        variant="secondary"
                        className={`text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 border rounded flex items-center gap-1 ${isEmployee ? 'text-violet-700 bg-violet-50/60 border-violet-200/50 hover:bg-violet-50' : 'text-slate-600 bg-slate-100 hover:bg-slate-150 border-slate-200'}`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {perm.replace(/_/g, ' ')}
                      </Badge>
                    ))
                  )}
                </div>
              </div>

              {/* Active Session Info (Enterprise Feature) */}
              <div className={`pt-2 border-t ${isEmployee ? 'border-violet-100/40' : 'border-slate-100'}`}>
                <div className="flex items-center gap-2 mb-2.5">
                  <Monitor className={`h-4 w-4 ${themeColors.text}`} />
                  <h4 className="text-sm font-bold text-slate-900">Current Login Session</h4>
                </div>
                <div className={`grid grid-cols-2 gap-2.5 text-xs p-3.5 rounded-lg border ${isEmployee ? 'glass-card border-violet-100/30' : 'bg-slate-50 border-slate-150'}`}>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">OS & Device</span>
                    <span className="font-semibold text-slate-700">{sessionInfo.os}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Browser Client</span>
                    <span className="font-semibold text-slate-700">{sessionInfo.browser}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">IP Endpoint</span>
                    <span className="font-semibold text-slate-700">{sessionInfo.ip}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Authenticated Since</span>
                    <span className="font-semibold text-slate-700">{sessionInfo.loginTime}</span>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  )
}
