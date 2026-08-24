import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { ShieldCheck, User, Settings, AlertTriangle, Loader2, Activity, Zap, Trash2, AlertCircle, Search, Filter, RefreshCw, FileText, Lock } from 'lucide-react'
import { api, safeArray } from '@/lib/api'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
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
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')

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
      case 'Security': return 'text-emerald-700 bg-emerald-50 border-emerald-200'
      case 'Access': return 'text-indigo-700 bg-indigo-50 border-indigo-200'
      case 'Project': return 'text-blue-700 bg-blue-50 border-blue-200'
      default: return 'text-amber-700 bg-amber-50 border-amber-200'
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
        const userData = Array.isArray(l.user) ? l.user[0] : l.user
        const roleData = userData?.role
        const roleName = Array.isArray(roleData) ? roleData[0]?.name : roleData?.name
        
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
    refetchInterval: 15000
  })

  const filteredLogs = useMemo(() => {
    if (!logs) return []
    return logs.filter(l => {
      const matchCat = categoryFilter === 'All' || l.category.toLowerCase() === categoryFilter.toLowerCase()
      const matchSearch = 
        !searchTerm || 
        l.user.toLowerCase().includes(searchTerm.toLowerCase()) || 
        l.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
        l.details.toLowerCase().includes(searchTerm.toLowerCase())
      return matchCat && matchSearch
    })
  }, [logs, categoryFilter, searchTerm])

  const renderDynamicAction = (log: ActivityLog) => {
    return (
      <div className="flex flex-col gap-0.5">
        <div className="text-xs leading-relaxed flex items-center flex-wrap gap-1.5">
          <span className="font-extrabold text-slate-900">{log.user}</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
            {log.role}
          </span>
          <span className="text-slate-600 font-medium">
            {log.details ? log.details : `performed action: ${log.action.toLowerCase()}`}
          </span>
        </div>
        <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
          <Zap className="h-3 w-3 text-indigo-500" />
          Trigger: <span className="font-semibold text-indigo-700">{log.action}</span>
        </div>
      </div>
    )
  }

  const handleClearLogs = async () => {
    setIsClearing(true)
    try {
      await api.delete('/activity_logs?id_not_null=true')
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
    <div className="space-y-6 text-foreground pb-8">
      {/* ── Header Section ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            System <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">Audit Trail</span>
          </h2>
          <p className="text-slate-500 text-sm mt-0.5 font-medium">
            Immutable governance audit logs tracking state modifications, role changes, and compliance actions.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Dialog open={isClearOpen} onOpenChange={setIsClearOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 bg-white font-bold text-xs h-9 rounded-xl shadow-2xs shrink-0 transition-colors" 
                disabled={!logs || logs.length === 0}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Clear Logs
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-white border-slate-200 rounded-2xl">
              <DialogHeader>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-2 shadow-sm">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <DialogTitle className="text-center text-lg text-slate-900 font-black">Clear Audit Trail?</DialogTitle>
                <DialogDescription className="text-center text-slate-500 pt-1 text-xs">
                  This action cannot be undone. This will permanently delete all activity logs from the audit database.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="sm:justify-center flex-col sm:flex-row gap-2 mt-4 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsClearOpen(false)} className="w-full sm:w-auto border-slate-200 font-bold text-xs rounded-xl" disabled={isClearing}>
                  Cancel
                </Button>
                <Button type="button" variant="destructive" onClick={handleClearLogs} className="w-full sm:w-auto bg-red-600 hover:bg-red-700 shadow-md font-bold text-xs rounded-xl" disabled={isClearing}>
                  {isClearing ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 mr-1.5" />}
                  Yes, clear all logs
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ── Main Activity Stream Card ─────────────────────────────────── */}
      <Card className="bg-white/85 backdrop-blur-xl border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
        <CardHeader className="pb-4 pt-5 px-5 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-600" />
                  <span>Real-time Event Stream</span>
                </CardTitle>
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </div>
              </div>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Real-time activity trail dynamically mapping actors, roles, and event triggers
              </CardDescription>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <Input
                  placeholder="Filter logs by user, action..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-8.5 pl-8 bg-slate-50 border-slate-200 text-xs rounded-xl"
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                {['All', 'Security', 'Access', 'Project'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all ${
                      categoryFilter === cat
                        ? 'bg-white text-indigo-700 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-5 pb-5 pt-4">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-indigo-600 border-t-transparent" />
                <p className="text-xs text-slate-500 font-semibold">Streaming audit events...</p>
              </div>
            </div>
          ) : !filteredLogs || filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="h-12 w-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center mb-3">
                <FileText className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">No matching activity events</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                System activities and administrative actions will stream here in real time.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
              <Table className="text-xs">
                <TableHeader className="bg-slate-50/90 border-b border-slate-200">
                  <TableRow>
                    <TableHead className="w-[48px]"></TableHead>
                    <TableHead className="font-extrabold text-slate-700 uppercase text-[10px] tracking-wider">Activity Event</TableHead>
                    <TableHead className="font-extrabold text-slate-700 uppercase text-[10px] tracking-wider w-[140px]">Timestamp</TableHead>
                    <TableHead className="text-right font-extrabold text-slate-700 uppercase text-[10px] tracking-wider w-[110px]">Category</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100">
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-indigo-50/20 transition-colors group">
                      <TableCell className="align-middle py-3 px-4">
                        <div className="h-8.5 w-8.5 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-2xs group-hover:border-indigo-300 transition-colors">
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
        </CardContent>
      </Card>
    </div>
  )
}
