import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { ShieldCheck, Server, BellRing, Link as LinkIcon, Save, Activity, RefreshCw } from 'lucide-react'
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
      checked ? "sa-switch-active bg-indigo-600" : "bg-slate-200"
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

  // Form states
  const [settings, setSettings] = useState({
    enforceMfa: true,
    passwordExpiry: '90',
    sessionTimeout: '30',
    orgName: 'FusionTech Inc.',
    supportEmail: 'support@fusiontech.com',
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
      try {
        await api.put('/system_settings/global_config', { settings })
      } catch (error) { throw error }

      toast({
        title: "Settings Saved",
        description: `${section} settings have been successfully updated in database.`,
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
    <div className="space-y-5 sa-page-enter text-slate-800">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight sa-gradient-text">System Settings</h2>
          <p className="text-slate-400 mt-0.5 text-sm">Configure global platform behavior, security policies, and integrations.</p>
        </div>
      </div>

      <Tabs defaultValue="security" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-4 bg-slate-100/80 p-1 rounded-lg h-auto">
          <TabsTrigger value="security" className="gap-1.5 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-700 rounded-md py-2"><ShieldCheck className="h-3.5 w-3.5" /> Security</TabsTrigger>
          <TabsTrigger value="system" className="gap-1.5 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-700 rounded-md py-2"><Server className="h-3.5 w-3.5" /> System</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-700 rounded-md py-2"><BellRing className="h-3.5 w-3.5" /> Notifications</TabsTrigger>
          <TabsTrigger value="integrations" className="gap-1.5 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-700 rounded-md py-2"><LinkIcon className="h-3.5 w-3.5" /> Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="security" className="space-y-4">
          <div className="sa-card sa-gradient-border overflow-hidden">
            <div className="p-4 pb-3">
              <h3 className="text-sm font-bold text-slate-800">Authentication & Access</h3>
              <p className="text-xs text-slate-400 mt-0.5">Manage how users authenticate and access the platform.</p>
            </div>
            <div className="px-4 pb-4 space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50/60 rounded-lg border border-slate-100/80">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Enforce Multi-Factor Authentication</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Require all super-admins and admins to use TOTP.</p>
                </div>
                <Switch checked={settings.enforceMfa} onChange={() => handleToggle('enforceMfa')} />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="passwordExpiry" className="text-xs font-semibold text-slate-700">Password Expiry (Days)</Label>
                  <Input id="passwordExpiry" name="passwordExpiry" type="number" value={settings.passwordExpiry} onChange={handleChange} className="h-9 text-sm" />
                  <p className="text-[10px] text-slate-400">Force password reset after this duration.</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sessionTimeout" className="text-xs font-semibold text-slate-700">Idle Session Timeout (Min)</Label>
                  <Input id="sessionTimeout" name="sessionTimeout" type="number" value={settings.sessionTimeout} onChange={handleChange} className="h-9 text-sm" />
                  <p className="text-[10px] text-slate-400">Log users out automatically when idle.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button onClick={() => handleSave('Security')} disabled={isSaving} className="sa-btn-primary h-9 px-4">
              {isSaving ? <RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-2" />}
              Save Changes
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <div className="sa-card sa-gradient-border overflow-hidden">
            <div className="p-4 pb-3">
              <h3 className="text-sm font-bold text-slate-800">Global Configuration</h3>
              <p className="text-xs text-slate-400 mt-0.5">Configure global platform details and limits.</p>
            </div>
            <div className="px-4 pb-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="orgName" className="text-xs font-semibold text-slate-700">Organization Name</Label>
                  <Input id="orgName" name="orgName" value={settings.orgName} onChange={handleChange} className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="supportEmail" className="text-xs font-semibold text-slate-700">Support Email</Label>
                  <Input id="supportEmail" name="supportEmail" type="email" value={settings.supportEmail} onChange={handleChange} className="h-9 text-sm" />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="maxUploadSize" className="text-xs font-semibold text-slate-700">Max File Upload Size (MB)</Label>
                <Input id="maxUploadSize" name="maxUploadSize" type="number" value={settings.maxUploadSize} onChange={handleChange} className="max-w-xs h-9 text-sm" />
              </div>

              <div className="flex items-center justify-between p-3 bg-amber-50/40 rounded-lg border border-amber-200/60">
                <div>
                  <p className="text-sm font-semibold text-amber-900">Maintenance Mode</p>
                  <p className="text-[11px] text-amber-600 mt-0.5">Prevent non-admin users from logging in during system updates.</p>
                </div>
                <Switch checked={settings.maintenanceMode} onChange={() => handleToggle('maintenanceMode')} />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button onClick={() => handleSave('System')} disabled={isSaving} className="sa-btn-primary h-9 px-4">
              {isSaving ? <RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-2" />}
              Save Changes
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <div className="sa-card sa-gradient-border overflow-hidden">
            <div className="p-4 pb-3">
              <h3 className="text-sm font-bold text-slate-800">Broadcasting & Events</h3>
              <p className="text-xs text-slate-400 mt-0.5">Configure real-time broadcasts and email notification gateways.</p>
            </div>
            <div className="px-4 pb-4 space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50/60 rounded-lg border border-slate-100/80">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Global Email Delivery</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Enable sending automated emails across all portals.</p>
                </div>
                <Switch checked={settings.emailNotifications} onChange={() => handleToggle('emailNotifications')} />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50/60 rounded-lg border border-slate-100/80">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Live Activity Sync</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Synchronize Kanban board states in real-time across connected clients.</p>
                </div>
                <Switch checked={settings.liveActivitySync} onChange={() => handleToggle('liveActivitySync')} />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-slate-50/60 rounded-lg border border-slate-100/80">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Chat Server Connection</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Enable inter-team messaging sockets globally.</p>
                </div>
                <Switch checked={settings.chatServer} onChange={() => handleToggle('chatServer')} />
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg sa-badge-emerald border-0">
                <div className="flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
                  <span className="text-xs font-semibold">Broadcasting Service: Online & Connected</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button onClick={() => handleSave('Notifications')} disabled={isSaving} className="sa-btn-primary h-9 px-4">
              {isSaving ? <RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-2" />}
              Save Changes
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <div className="sa-card sa-gradient-border overflow-hidden">
            <div className="p-4 pb-3">
              <h3 className="text-sm font-bold text-slate-800">External Integrations</h3>
              <p className="text-xs text-slate-400 mt-0.5">Connect third-party apps and webhooks.</p>
            </div>
            <div className="px-4 pb-4 space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50/60 rounded-lg border border-slate-100/80">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Slack Organization Sync</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Allow admins to map internal teams to Slack channels.</p>
                </div>
                <Switch checked={settings.slackIntegration} onChange={() => handleToggle('slackIntegration')} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="webhookUrl" className="text-xs font-semibold text-slate-700">Global Audit Webhook URL</Label>
                <Input 
                  id="webhookUrl" 
                  name="webhookUrl" 
                  placeholder="https://api.yourdomain.com/webhooks/audit"
                  value={settings.webhookUrl} 
                  onChange={handleChange}
                  className="h-9 text-sm"
                />
                <p className="text-[10px] text-slate-400">Send system-wide audit logs to this endpoint via POST.</p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button onClick={() => handleSave('Integrations')} disabled={isSaving} className="sa-btn-primary h-9 px-4">
              {isSaving ? <RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-2" />}
              Save Changes
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
