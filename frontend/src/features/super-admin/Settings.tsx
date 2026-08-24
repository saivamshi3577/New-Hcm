import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { ShieldCheck, Server, BellRing, Link as LinkIcon, Save, Activity, RefreshCw, Lock, Globe, Radio } from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'

const Switch = ({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={cn(
      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
      checked ? "bg-indigo-600" : "bg-slate-200"
    )}
  >
    <span
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
        checked ? "translate-x-5" : "translate-x-0"
      )}
    />
  </button>
)

export default function Settings() {
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)

  const [settings, setSettings] = useState({
    enforceMfa: true,
    passwordExpiry: '90',
    sessionTimeout: '30',
    orgName: 'FusionTech Global Systems',
    supportEmail: 'support@fusionhrms.com',
    maxUploadSize: '50',
    maintenanceMode: false,
    emailNotifications: true,
    slackIntegration: false,
    webhookUrl: '',
    liveActivitySync: true,
    chatServer: true,
  })

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        let data: any = null
        try {
          const res: any = await api.get('/system_settings?id=global_config&_single=true')
          data = res?.data || res
        } catch (error) { throw error }
        
        if (data && data.settings) {
          setSettings(data.settings as any)
        }
      } catch (err) {
        console.error('Error fetching system settings:', err)
      }
    }
    fetchSettings()
  }, [])

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSave = async (section: string) => {
    setIsSaving(true)
    try {
      await api.put('/system_settings/global_config', { settings })

      toast({
        title: "Settings Saved",
        description: `${section} configuration updated across the platform.`,
      })
    } catch (err: any) {
      console.error('Error saving settings:', err)
      toast({
        title: "Error Saving Settings",
        description: err.message || 'Failed to update system config.',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 text-foreground pb-8">
      {/* ── Header Section ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Platform <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">Settings</span>
          </h2>
          <p className="text-slate-500 text-sm mt-0.5 font-medium">
            Configure global system behavior, multi-tenant security policies, and integrations.
          </p>
        </div>
      </div>

      <Tabs defaultValue="security" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-5 bg-slate-100/90 p-1 rounded-2xl h-auto border border-slate-200/70">
          <TabsTrigger value="security" className="gap-2 text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-700 rounded-xl py-2.5">
            <ShieldCheck className="h-4 w-4" /> Security & Access
          </TabsTrigger>
          <TabsTrigger value="system" className="gap-2 text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-700 rounded-xl py-2.5">
            <Server className="h-4 w-4" /> Global Config
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2 text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-700 rounded-xl py-2.5">
            <BellRing className="h-4 w-4" /> Broadcasting
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2 text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-700 rounded-xl py-2.5">
            <LinkIcon className="h-4 w-4" /> Integrations
          </TabsTrigger>
        </TabsList>

        {/* ── Security Tab ──────────────────────────────────────────── */}
        <TabsContent value="security" className="space-y-4">
          <Card className="bg-white/85 backdrop-blur-xl border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
            <CardHeader className="pb-4 pt-5 px-5 border-b border-slate-100">
              <CardTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-600" />
                <span>Authentication & Session Governance</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Manage how administrators and organization employees authenticate and access the system
              </CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-5 space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50/80 rounded-xl border border-slate-200/70">
                <div>
                  <p className="text-sm font-bold text-slate-900">Enforce Multi-Factor Authentication (MFA)</p>
                  <p className="text-xs text-slate-500 mt-0.5">Require all Super Admins and Company Admins to authenticate via TOTP</p>
                </div>
                <Switch checked={settings.enforceMfa} onChange={() => handleToggle('enforceMfa')} />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="passwordExpiry" className="text-xs font-bold text-slate-700">Password Expiry Cycle (Days)</Label>
                  <Input id="passwordExpiry" name="passwordExpiry" type="number" value={settings.passwordExpiry} onChange={handleChange} className="h-9 text-xs rounded-xl" />
                  <p className="text-[10px] text-slate-400">Force credentials reset after this period.</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sessionTimeout" className="text-xs font-bold text-slate-700">Idle Session Inactivity Timeout (Minutes)</Label>
                  <Input id="sessionTimeout" name="sessionTimeout" type="number" value={settings.sessionTimeout} onChange={handleChange} className="h-9 text-xs rounded-xl" />
                  <p className="text-[10px] text-slate-400">Automatically logout inactive users to preserve security.</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end">
            <Button onClick={() => handleSave('Security')} disabled={isSaving} className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs h-9 px-5 rounded-xl shadow-md shadow-indigo-500/20">
              {isSaving ? <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
              Save Security Policies
            </Button>
          </div>
        </TabsContent>

        {/* ── Global Config Tab ─────────────────────────────────────── */}
        <TabsContent value="system" className="space-y-4">
          <Card className="bg-white/85 backdrop-blur-xl border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
            <CardHeader className="pb-4 pt-5 px-5 border-b border-slate-100">
              <CardTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-600" />
                <span>Global Platform Metadata & Storage Limits</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Configure platform branding, contact gateways, and tenant limits
              </CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="orgName" className="text-xs font-bold text-slate-700">Platform Brand Title</Label>
                  <Input id="orgName" name="orgName" value={settings.orgName} onChange={handleChange} className="h-9 text-xs rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="supportEmail" className="text-xs font-bold text-slate-700">Global Executive Support Email</Label>
                  <Input id="supportEmail" name="supportEmail" type="email" value={settings.supportEmail} onChange={handleChange} className="h-9 text-xs rounded-xl" />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="maxUploadSize" className="text-xs font-bold text-slate-700">Max Document Upload Threshold (MB)</Label>
                <Input id="maxUploadSize" name="maxUploadSize" type="number" value={settings.maxUploadSize} onChange={handleChange} className="max-w-xs h-9 text-xs rounded-xl" />
              </div>

              <div className="flex items-center justify-between p-4 bg-amber-50/60 rounded-xl border border-amber-200/80">
                <div>
                  <p className="text-sm font-bold text-amber-900">Platform Maintenance Mode</p>
                  <p className="text-xs text-amber-700 mt-0.5">Prevent non-admin employee logins during global database updates</p>
                </div>
                <Switch checked={settings.maintenanceMode} onChange={() => handleToggle('maintenanceMode')} />
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end">
            <Button onClick={() => handleSave('System')} disabled={isSaving} className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs h-9 px-5 rounded-xl shadow-md shadow-indigo-500/20">
              {isSaving ? <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
              Save Global Configuration
            </Button>
          </div>
        </TabsContent>

        {/* ── Notifications Tab ─────────────────────────────────────── */}
        <TabsContent value="notifications" className="space-y-4">
          <Card className="bg-white/85 backdrop-blur-xl border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
            <CardHeader className="pb-4 pt-5 px-5 border-b border-slate-100">
              <CardTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Radio className="w-4 h-4 text-indigo-600" />
                <span>Real-Time Broadcasts & Notification Gateways</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Configure real-time event broadcasting and email notification engines
              </CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-5 space-y-3.5">
              <div className="flex items-center justify-between p-4 bg-slate-50/80 rounded-xl border border-slate-200/70">
                <div>
                  <p className="text-sm font-bold text-slate-900">Automated Email Notification Delivery</p>
                  <p className="text-xs text-slate-500 mt-0.5">Send transaction and leave notification emails across all workspaces</p>
                </div>
                <Switch checked={settings.emailNotifications} onChange={() => handleToggle('emailNotifications')} />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50/80 rounded-xl border border-slate-200/70">
                <div>
                  <p className="text-sm font-bold text-slate-900">Live Activity & Kanban Sync</p>
                  <p className="text-xs text-slate-500 mt-0.5">Synchronize Kanban sprint board states in real-time across connected clients</p>
                </div>
                <Switch checked={settings.liveActivitySync} onChange={() => handleToggle('liveActivitySync')} />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-slate-50/80 rounded-xl border border-slate-200/70">
                <div>
                  <p className="text-sm font-bold text-slate-900">Chat Server Sockets</p>
                  <p className="text-xs text-slate-500 mt-0.5">Enable inter-team messaging websocket connections</p>
                </div>
                <Switch checked={settings.chatServer} onChange={() => handleToggle('chatServer')} />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-600 animate-pulse" />
                  <span className="text-xs font-bold">Broadcasting Service: Online & Operational</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end">
            <Button onClick={() => handleSave('Notifications')} disabled={isSaving} className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs h-9 px-5 rounded-xl shadow-md shadow-indigo-500/20">
              {isSaving ? <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
              Save Broadcasting Settings
            </Button>
          </div>
        </TabsContent>

        {/* ── Integrations Tab ──────────────────────────────────────── */}
        <TabsContent value="integrations" className="space-y-4">
          <Card className="bg-white/85 backdrop-blur-xl border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
            <CardHeader className="pb-4 pt-5 px-5 border-b border-slate-100">
              <CardTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-indigo-600" />
                <span>External Integrations & Webhooks</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Connect external enterprise services, messaging channels, and audit webhooks
              </CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-5 space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50/80 rounded-xl border border-slate-200/70">
                <div>
                  <p className="text-sm font-bold text-slate-900">Slack Workspace Channel Sync</p>
                  <p className="text-xs text-slate-500 mt-0.5">Allow organizations to map internal squads to Slack notification channels</p>
                </div>
                <Switch checked={settings.slackIntegration} onChange={() => handleToggle('slackIntegration')} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="webhookUrl" className="text-xs font-bold text-slate-700">Global Audit Webhook POST Endpoint</Label>
                <Input 
                  id="webhookUrl" 
                  name="webhookUrl" 
                  placeholder="https://api.yourdomain.com/webhooks/audit"
                  value={settings.webhookUrl} 
                  onChange={handleChange}
                  className="h-9 text-xs rounded-xl"
                />
                <p className="text-[10px] text-slate-400">Stream platform-wide audit log events to this HTTP endpoint in JSON format.</p>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end">
            <Button onClick={() => handleSave('Integrations')} disabled={isSaving} className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs h-9 px-5 rounded-xl shadow-md shadow-indigo-500/20">
              {isSaving ? <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
              Save Integration Settings
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
