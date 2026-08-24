import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Clock, Loader2, Coffee } from 'lucide-react'

interface BreakLogsDialogProps {
  userId: string
  userName: string
  date?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function BreakLogsDialog({ userId, userName, date = new Date().toISOString().split('T')[0], open, onOpenChange }: BreakLogsDialogProps) {
  const [nowTime, setNowTime] = useState(new Date())

  const { data: logs, isLoading } = useQuery({
    queryKey: ['break-logs', userId, date],
    enabled: !!userId && open,
    queryFn: async () => {
      const data: any = await api.get(`/break_logs?user_id=${userId}&date=${date}&_order=started_at:asc`)
      return data || []
    }
  })

  const activeLog = logs?.find(log => !log.ended_at)

  useEffect(() => {
    if (!open || !activeLog) return
    
    // Set initial time
    setNowTime(new Date())
    
    const interval = setInterval(() => {
      setNowTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [open, activeLog])

  const calculateTotalMinutes = () => {
    if (!logs) return 0
    let total = 0
    logs.forEach(log => {
      if (log.started_at && log.ended_at) {
        const start = new Date(log.started_at).getTime()
        const end = new Date(log.ended_at).getTime()
        total += (end - start) / (1000 * 60)
      } else if (log.started_at && !log.ended_at) {
        const start = new Date(log.started_at).getTime()
        const end = nowTime.getTime()
        total += (end - start) / (1000 * 60)
      }
    })
    return Math.round(total)
  }

  const formatTime = (isoString: string | null) => {
    if (!isoString) return 'In Progress'
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDuration = (ms: number) => {
    const secs = Math.floor(ms / 1000)
    const mins = Math.floor(secs / 60)
    const hours = Math.floor(mins / 60)
    const displayMins = mins % 60
    const displaySecs = secs % 60

    if (hours > 0) {
      return `${hours}h ${displayMins}m ${displaySecs}s`
    }
    return `${displayMins}m ${displaySecs}s`
  }

  const getActiveDurationStr = () => {
    if (!activeLog) return null
    const start = new Date(activeLog.started_at).getTime()
    const diff = nowTime.getTime() - start
    return formatDuration(diff)
  }

  const totalMinutes = calculateTotalMinutes()
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-white border border-slate-200 p-5 rounded-2xl shadow-2xl text-slate-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-amber-700">
            <Coffee className="h-5 w-5 text-amber-600" />
            <span>Break Logs: {userName}</span>
          </DialogTitle>
          <DialogDescription className="text-slate-500 text-xs">
            Break activity for {new Date(date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-3 space-y-3">
          <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl flex items-center justify-between shadow-sm">
            <div>
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wide">Total Break Time</span>
            </div>
            <span className="text-xl font-extrabold text-amber-800">
              {hours > 0 ? `${hours}h ` : ''}{mins}m
            </span>
          </div>

          {activeLog && (
            <div className="bg-amber-100/40 border border-amber-200/80 p-3 rounded-xl flex items-center justify-between shadow-sm border-dashed">
              <div>
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wide">Current Break Duration</span>
              </div>
              <span className="text-sm font-extrabold text-amber-850 font-mono text-amber-800 animate-pulse">
                {getActiveDurationStr() || '0m 0s'}
              </span>
            </div>
          )}

          <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
            {isLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
              </div>
            ) : logs && logs.length > 0 ? (
              logs.map((log, index) => (
                <div key={log.id} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                  <div className="flex items-center gap-2.5">
                    <div className="bg-white p-1.5 rounded-full border border-slate-200 shadow-sm">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-slate-700">Session {index + 1}</span>
                      <span className="text-[10px] font-medium text-slate-400">
                        {formatTime(log.started_at)} - {formatTime(log.ended_at)}
                      </span>
                    </div>
                  </div>
                  {log.ended_at ? (
                    <span className="text-[10px] font-bold bg-slate-200/60 text-slate-600 px-2 py-0.5 rounded-full">
                      {Math.round((new Date(log.ended_at).getTime() - new Date(log.started_at).getTime()) / 60000)}m
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full animate-pulse">
                      Active
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-sm text-slate-400 font-medium">
                No break logs found for this day.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
