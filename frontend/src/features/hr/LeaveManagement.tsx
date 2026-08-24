import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  CalendarCheck2, Clock, CheckCircle2, XCircle, Search,
  Filter, Loader2, AlertCircle, CalendarDays, Users
} from 'lucide-react'
import { api, safeArray } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { useAuthStore } from '@/store/authStore'

interface LeaveRequest {
  id: string
  userId: string
  user_id: string
  leaveType: string
  leave_type: string
  startDate: string
  start_date: string
  endDate: string
  end_date: string
  reason: string
  status: string
  createdAt: string
  user?: {
    id: string
    fullName?: string
    full_name?: string
    email: string
    department?: string
    designation?: string
  }
}

export default function LeaveManagement() {
  const { toast } = useToast()
  const { role } = useAuthStore()
  const [leaves, setLeaves] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')

  const fetchLeaves = async () => {
    setLoading(true)
    try {
      const res: any = await api.get('/employee/leaves/all')
      const data = safeArray(res, 'leaves')
      setLeaves(data)
    } catch (err: any) {
      console.error('Error fetching leaves:', err)
      toast({ title: 'Error', description: 'Failed to load leave requests', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLeaves() }, [])

  const handleUpdateStatus = async (leaveId: string, status: string) => {
    setActionLoading(leaveId)
    try {
      await api.put(`/employee/leaves/${leaveId}/status`, { status })
      toast({
        title: status === 'APPROVED' ? '✅ Leave Approved' : '❌ Leave Rejected',
        description: `Leave request has been ${status.toLowerCase()}.`,
      })
      await fetchLeaves()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to update', variant: 'destructive' })
    } finally {
      setActionLoading(null)
    }
  }

  const getLeaveTypeBadge = (type: string) => {
    const t = (type || '').toUpperCase()
    switch (t) {
      case 'SICK': return <Badge className="bg-rose-100 text-rose-700 border-0 text-[10px] font-bold">Sick</Badge>
      case 'CASUAL': return <Badge className="bg-blue-100 text-blue-700 border-0 text-[10px] font-bold">Casual</Badge>
      case 'EARNED': return <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px] font-bold">Earned</Badge>
      case 'MATERNITY': return <Badge className="bg-pink-100 text-pink-700 border-0 text-[10px] font-bold">Maternity</Badge>
      case 'PATERNITY': return <Badge className="bg-indigo-100 text-indigo-700 border-0 text-[10px] font-bold">Paternity</Badge>
      default: return <Badge className="bg-slate-100 text-slate-700 border-0 text-[10px] font-bold">{type}</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px] font-bold">Pending</Badge>
      case 'APPROVED': return <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px] font-bold">Approved</Badge>
      case 'REJECTED': return <Badge className="bg-rose-100 text-rose-700 border-0 text-[10px] font-bold">Rejected</Badge>
      default: return <Badge className="bg-slate-100 text-slate-600 border-0 text-[10px] font-bold">{status}</Badge>
    }
  }

  const filteredLeaves = leaves.filter(l => {
    const name = l.user?.full_name || l.user?.fullName || l.user?.email || ''
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.reason || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || l.status === statusFilter
    const matchesType = typeFilter === 'ALL' || (l.leave_type || l.leaveType || '').toUpperCase() === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const pendingCount = leaves.filter(l => l.status === 'PENDING').length
  const approvedCount = leaves.filter(l => l.status === 'APPROVED').length
  const rejectedCount = leaves.filter(l => l.status === 'REJECTED').length

  const isHr = role === 'hr'
  const themeAccent = isHr ? 'amber' : 'cyan'

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className={`h-8 w-8 animate-spin text-${themeAccent}-600`} />
          <p className="text-sm font-medium text-slate-500">Loading leave requests...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 fade-in duration-500 text-slate-800">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">Leave Management</h1>
        <p className="text-slate-500 mt-1 text-sm">Review, approve, or reject employee leave requests.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-white border-slate-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('ALL')}>
          <CardContent className="flex items-center gap-3 py-4 px-5">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center">
              <CalendarDays className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-950">{leaves.length}</p>
              <p className="text-[11px] text-slate-500 font-medium">Total Requests</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('PENDING')}>
          <CardContent className="flex items-center gap-3 py-4 px-5">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Clock className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-950">{pendingCount}</p>
              <p className="text-[11px] text-amber-600 font-semibold">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('APPROVED')}>
          <CardContent className="flex items-center gap-3 py-4 px-5">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <CheckCircle2 className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-950">{approvedCount}</p>
              <p className="text-[11px] text-emerald-600 font-semibold">Approved</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('REJECTED')}>
          <CardContent className="flex items-center gap-3 py-4 px-5">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center">
              <XCircle className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-950">{rejectedCount}</p>
              <p className="text-[11px] text-rose-600 font-semibold">Rejected</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardContent className="py-3 px-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 min-w-0 w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name or reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm bg-slate-50 border-slate-200"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-4 w-4 text-slate-400 shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg px-3 py-2 font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg px-3 py-2 font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="ALL">All Types</option>
                <option value="SICK">Sick</option>
                <option value="CASUAL">Casual</option>
                <option value="EARNED">Earned</option>
                <option value="MATERNITY">Maternity</option>
                <option value="PATERNITY">Paternity</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leave Requests Table */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold">Leave Requests ({filteredLeaves.length})</CardTitle>
          <CardDescription className="text-xs">
            {statusFilter !== 'ALL' ? `Showing ${statusFilter.toLowerCase()} requests` : 'All leave requests across the organization'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredLeaves.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CalendarCheck2 className="h-12 w-12 text-slate-300 mb-3" />
              <p className="text-sm font-semibold text-slate-500">No leave requests found</p>
              <p className="text-xs text-slate-400 mt-1">
                {searchQuery || statusFilter !== 'ALL' ? 'Try adjusting your filters' : 'No leave requests have been submitted yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredLeaves.map((leave) => {
                const name = leave.user?.full_name || leave.user?.fullName || leave.user?.email || 'Employee'
                const department = leave.user?.department || '—'
                const type = leave.leave_type || leave.leaveType || 'CASUAL'
                const startDate = leave.start_date || leave.startDate
                const endDate = leave.end_date || leave.endDate
                const isPending = leave.status === 'PENDING'

                // Calculate days
                let days = 1
                if (startDate && endDate) {
                  const diff = new Date(endDate).getTime() - new Date(startDate).getTime()
                  days = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1)
                }

                return (
                  <div
                    key={leave.id}
                    className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                      isPending
                        ? 'bg-amber-50/30 border-amber-100 hover:bg-amber-50/50'
                        : 'bg-slate-50/40 border-slate-100 hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-sm font-bold text-amber-700">{name[0]}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-slate-900">{name}</p>
                          {getLeaveTypeBadge(type)}
                          {getStatusBadge(leave.status)}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                          {department} · {startDate ? new Date(startDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'} → {endDate ? new Date(endDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'} · {days} day{days > 1 ? 's' : ''}
                        </p>
                        {leave.reason && (
                          <p className="text-[11px] text-slate-400 mt-1 italic truncate max-w-md">
                            "{leave.reason}"
                          </p>
                        )}
                      </div>
                    </div>

                    {isPending && (
                      <div className="flex items-center gap-2 mt-3 sm:mt-0 shrink-0">
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-8 px-4"
                          disabled={actionLoading === leave.id}
                          onClick={() => handleUpdateStatus(leave.id, 'APPROVED')}
                        >
                          {actionLoading === leave.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold h-8 px-4"
                          disabled={actionLoading === leave.id}
                          onClick={() => handleUpdateStatus(leave.id, 'REJECTED')}
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
