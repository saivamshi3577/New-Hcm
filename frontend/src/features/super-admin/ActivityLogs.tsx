import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ShieldCheck, User, Settings, AlertTriangle, Loader2, Activity, Zap, Trash2, AlertCircle } from 'lucide-react'
import { api, safeArray } from '@/lib/api'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'

interface ActivityLog {
  id: string
  user: string
  role: string
  action: string
  details: string
  time: string
  category: string
}

export default function ActivityLogs() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [isClearOpen, setIsClearOpen] = useState(false)
  const [isClearing, setIsClearing] = useState(false)

  const getIcon = (category: string) => {
    switch (category) {
      case 'Security': return <ShieldCheck className="h-4 w-4 text-emerald-600" />
      case 'Access': return <User className="h-4 w-4 text-indigo-600" />
      case 'Project': return <Settings className="h-4 w-4 text-blue-600" />
      default: return <AlertTriangle className="h-4 w-4 text-amber-600" />
    }
  }

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Security': return 'text-emerald-700 bg-emerald-50 border-emerald-200/60'
      case 'Access': return 'text-indigo-700 bg-indigo-50 border-indigo-200/60'
      case 'Project': return 'text-blue-700 bg-blue-50 border-blue-200/60'
      default: return 'text-amber-700 bg-amber-50 border-amber-200/60'
    }
  }

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.round(diffMs / (60 * 1000))
    const diffHours = Math.round(diffMs / (60 * 60 * 1000))

    if (diffMins < 60) {
      return `${diffMins <= 0 ? 1 : diffMins} mins ago`
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`
    } else {
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    }
  }

  const { data: logs, isLoading } = useQuery({
    queryKey: ['activity-logs'],
    queryFn: async () => {
      let data: any = []
      try {
        data = await api.get('/activity_logs?_select=id,action,entity_type,details,created_at,user:users(id,full_name,role:roles(name))&_sort=-created_at&_limit=50')
      } catch (error) {
        console.error("Error fetching activity logs:", error)
        return []
      }

      const logsData = safeArray(data, 'logs')
      
      return logsData.map((l: any): ActivityLog => {
        // Supabase might return array or single object depending on relationship setup
        const userData = Array.isArray(l.user) ? l.user[0] : l.user;
        const roleData = userData?.role;
        const roleName = Array.isArray(roleData) ? roleData[0]?.name : roleData?.name;
        
        return {
          id: l.id,
          user: userData?.full_name || 'System / Guest',
          role: roleName || 'System',
          action: l.action || 'System Update',
          details: l.details || '',
          time: formatTime(l.created_at),
          category: l.entity_type || 'General'
        }
      })
    },
    refetchInterval: 15000 // Refetch every 15 seconds for dynamic updates
  })

  // Function to render the dynamic sentence
  const renderDynamicAction = (log: ActivityLog) => {
    return (
      <div className="flex flex-col gap-0.5">
        <div className="text-[13px] leading-relaxed flex items-center flex-wrap gap-1.5">
          <span className="font-extrabold text-slate-800">{log.user}</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100/80 px-1.5 py-0.5 rounded border border-slate-200/60">
            {log.role}
          </span>
          <span className="text-slate-600 font-medium">
            {log.details ? log.details : `performed action: ${log.action.toLowerCase()}`}
          </span>
        </div>
        <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
          <Zap className="h-3 w-3 text-indigo-400" />
          Action Trigger: <span className="font-semibold text-indigo-600/80">{log.action}</span>
        </div>
      </div>
    )
  }

  const handleClearLogs = async () => {
    setIsClearing(true)
    try {
      try {
        await api.delete('/activity_logs?id_not_null=true')
      } catch (error) {
        throw error
      }

      await queryClient.invalidateQueries({ queryKey: ['activity-logs'] })
      
      toast({
        title: 'Audit Trail Cleared',
        description: 'All system activity logs have been permanently deleted.',
      })
      setIsClearOpen(false)
    } catch (err: any) {
      toast({
        title: 'Error clearing logs',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <div className="space-y-5 sa-page-enter text-slate-800">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight sa-gradient-text">System Audit Trail</h2>
          <p className="text-slate-400 mt-0.5 text-sm">Immutable audit logs tracking system state modifications, authentication triggers, and user activity.</p>
        </div>
        
        <Dialog open={isClearOpen} onOpenChange={setIsClearOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 bg-white shadow-sm shrink-0 transition-colors" disabled={!logs || logs.length === 0}>
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Logs
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-white border-slate-200">
            <DialogHeader>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4 shadow-sm">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <DialogTitle className="text-center text-xl text-slate-900 font-extrabold">Clear Audit Trail?</DialogTitle>
              <DialogDescription className="text-center text-slate-500 pt-2 font-medium">
                This action cannot be undone. This will permanently delete all activity logs from the database. Are you absolutely sure you want to proceed?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-center flex-col sm:flex-row gap-2 mt-4 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setIsClearOpen(false)} className="w-full sm:w-auto border-slate-200 font-bold text-slate-700" disabled={isClearing}>
                Cancel
              </Button>
              <Button type="button" variant="destructive" onClick={handleClearLogs} className="w-full sm:w-auto bg-red-600 hover:bg-red-700 shadow-md font-bold" disabled={isClearing}>
                {isClearing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Yes, clear all logs
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="sa-card sa-gradient-border overflow-hidden">
        <div className="p-4 pb-3 flex justify-between items-center bg-slate-50/50 border-b border-slate-100/50">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Real-time Event Stream</h3>
            <p className="text-xs text-slate-400 mt-0.5">Activity trail dynamically mapping users, roles, and targeted entities.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live</span>
          </div>
        </div>
        <div className="px-2 pb-2 pt-2">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
            </div>
          ) : !logs || logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-11 w-11 rounded-full sa-icon-box flex items-center justify-center mb-3">
                <Activity className="h-5 w-5 text-indigo-500" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No Activity Logs</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                There are no audit logs recorded yet. Once users perform actions like creating projects or modifying access, they will appear here.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200/60 overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-slate-50/80 border-b border-slate-200/60">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[48px]"></TableHead>
                    <TableHead className="font-extrabold text-slate-500 text-[10px] uppercase tracking-widest">Activity Event</TableHead>
                    <TableHead className="font-extrabold text-slate-500 text-[10px] uppercase tracking-widest w-[140px]">Timestamp</TableHead>
                    <TableHead className="text-right font-extrabold text-slate-500 text-[10px] uppercase tracking-widest w-[110px]">Context</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100/80">
                  {logs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-slate-50/60 transition-colors group">
                      <TableCell className="align-middle py-3 px-4">
                        <div className="h-9 w-9 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm group-hover:border-indigo-200 transition-colors">
                          {getIcon(log.category)}
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        {renderDynamicAction(log)}
                      </TableCell>
                      <TableCell className="text-slate-500 text-[11px] font-semibold py-3 whitespace-nowrap">
                        {log.time}
                      </TableCell>
                      <TableCell className="text-right py-3 pr-4">
                        <span className={`inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getCategoryBadgeClass(log.category)}`}>
                          {log.category}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
