import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Award, TrendingUp, Search, Plus, X, Star,
  Loader2, CheckCircle2, Clock, FileText, Users, Filter
} from 'lucide-react'
import { performanceApi, api, safeArray } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/hooks/use-toast'

interface Appraisal {
  id: string
  employeeId: string
  employee_id: string
  reviewerId: string
  reviewer_id: string
  period: string
  score: number
  feedback: string
  status: string
  createdAt: string
  created_at: string
  employee?: {
    id: string
    fullName?: string
    full_name?: string
    email?: string
  }
  reviewer?: {
    id: string
    fullName?: string
    full_name?: string
    email?: string
  }
}

export default function AppraisalManagement() {
  const { user, role } = useAuthStore()
  const { toast } = useToast()
  const [appraisals, setAppraisals] = useState<Appraisal[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Create form state
  const [formEmployeeId, setFormEmployeeId] = useState('')
  const [formPeriod, setFormPeriod] = useState('')
  const [formScore, setFormScore] = useState('3.5')
  const [formFeedback, setFormFeedback] = useState('')

  const isHr = role === 'hr'
  const themeAccent = isHr ? 'amber' : 'cyan'

  const fetchAppraisals = async () => {
    setLoading(true)
    try {
      const res: any = await performanceApi.getAppraisals()
      setAppraisals(safeArray(res, 'appraisals'))
    } catch (err: any) {
      console.error('Error fetching appraisals:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployees = async () => {
    try {
      const res: any = await api.get('/employee')
      setEmployees(safeArray(res, 'employees'))
    } catch (e) {}
  }

  useEffect(() => { fetchAppraisals() }, [])

  const handleCreateAppraisal = async () => {
    if (!formEmployeeId || !formPeriod || !formScore) {
      toast({ title: 'Missing Fields', description: 'Employee, period, and score are required', variant: 'destructive' })
      return
    }
    setCreating(true)
    try {
      await performanceApi.createAppraisal({
        employeeId: formEmployeeId,
        period: formPeriod,
        score: parseFloat(formScore),
        feedback: formFeedback,
      })
      toast({ title: '✅ Appraisal Created', description: `Review for ${formPeriod} submitted` })
      setShowCreateModal(false)
      setFormEmployeeId('')
      setFormPeriod('')
      setFormScore('3.5')
      setFormFeedback('')
      await fetchAppraisals()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to create', variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  const handleApprove = async (id: string) => {
    setActionLoading(id)
    try {
      await performanceApi.updateAppraisal(id, { status: 'APPROVED' })
      toast({ title: '✅ Appraisal Approved' })
      await fetchAppraisals()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT': return <Badge className="bg-slate-100 text-slate-600 border-0 text-[10px] font-bold">Draft</Badge>
      case 'SUBMITTED': return <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px] font-bold">Submitted</Badge>
      case 'APPROVED': return <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px] font-bold">Approved</Badge>
      default: return <Badge className="bg-slate-100 text-slate-600 border-0 text-[10px] font-bold">{status}</Badge>
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-emerald-600'
    if (score >= 3) return 'text-amber-600'
    if (score >= 2) return 'text-orange-600'
    return 'text-rose-600'
  }

  const getScoreBg = (score: number) => {
    if (score >= 4) return 'from-emerald-500 to-teal-500'
    if (score >= 3) return 'from-amber-500 to-orange-500'
    if (score >= 2) return 'from-orange-500 to-red-500'
    return 'from-rose-500 to-pink-500'
  }

  const filteredAppraisals = appraisals.filter(a => {
    const name = a.employee?.full_name || a.employee?.fullName || a.employee?.email || ''
    const matchSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.period.toLowerCase().includes(searchQuery.toLowerCase())
    const matchStatus = statusFilter === 'ALL' || a.status === statusFilter
    return matchSearch && matchStatus
  })

  const draftCount = appraisals.filter(a => a.status === 'DRAFT').length
  const submittedCount = appraisals.filter(a => a.status === 'SUBMITTED').length
  const approvedCount = appraisals.filter(a => a.status === 'APPROVED').length
  const avgScore = appraisals.length > 0
    ? (appraisals.reduce((sum, a) => sum + (a.score || 0), 0) / appraisals.length).toFixed(1)
    : '0.0'

  // Generate period options
  const periodOptions = (() => {
    const now = new Date()
    const year = now.getFullYear()
    return [
      `Q1 ${year}`, `Q2 ${year}`, `Q3 ${year}`, `Q4 ${year}`,
      `H1 ${year}`, `H2 ${year}`,
      `Annual ${year}`,
      `Q1 ${year + 1}`,
    ]
  })()

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className={`h-8 w-8 animate-spin text-${themeAccent}-600`} />
          <p className="text-sm font-medium text-slate-500">Loading appraisals...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 fade-in duration-500 text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">Performance Appraisals</h1>
          <p className="text-slate-500 mt-1 text-sm">Create, review, and approve employee performance evaluations.</p>
        </div>
        <Button
          className={`bg-${themeAccent}-600 hover:bg-${themeAccent}-700 text-white font-bold text-xs shadow-sm`}
          onClick={() => { setShowCreateModal(true); fetchEmployees() }}
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" /> New Appraisal
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="flex items-center gap-3 py-4 px-5">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center">
              <FileText className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-950">{appraisals.length}</p>
              <p className="text-[11px] text-slate-500 font-medium">Total Reviews</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="flex items-center gap-3 py-4 px-5">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Clock className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-950">{submittedCount}</p>
              <p className="text-[11px] text-amber-600 font-semibold">Pending Review</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200 shadow-sm">
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
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="flex items-center gap-3 py-4 px-5">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
              <Star className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-950">{avgScore}</p>
              <p className="text-[11px] text-violet-600 font-semibold">Avg Score (out of 5)</p>
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
                placeholder="Search by name or period..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm bg-slate-50 border-slate-200"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg px-3 py-2 font-semibold focus:outline-none focus:ring-1 focus:ring-${themeAccent}-500`}
              >
                <option value="ALL">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="APPROVED">Approved</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appraisals List */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold">Appraisals ({filteredAppraisals.length})</CardTitle>
          <CardDescription className="text-xs">Employee performance evaluations and scores</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredAppraisals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Award className="h-12 w-12 text-slate-300 mb-3" />
              <p className="text-sm font-semibold text-slate-500">No appraisals found</p>
              <p className="text-xs text-slate-400 mt-1">Create a new appraisal to get started</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredAppraisals.map((appraisal) => {
                const empName = appraisal.employee?.full_name || appraisal.employee?.fullName || appraisal.employee?.email || 'Employee'
                const reviewerName = appraisal.reviewer?.full_name || appraisal.reviewer?.fullName || appraisal.reviewer?.email || 'Reviewer'
                const isSubmitted = appraisal.status === 'SUBMITTED'

                return (
                  <div
                    key={appraisal.id}
                    className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                      isSubmitted
                        ? 'bg-amber-50/30 border-amber-100 hover:bg-amber-50/50'
                        : 'bg-slate-50/40 border-slate-100 hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${getScoreBg(appraisal.score)} flex items-center justify-center shrink-0`}>
                        <span className="text-sm font-extrabold text-white">{appraisal.score?.toFixed(1)}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-slate-900">{empName}</p>
                          {getStatusBadge(appraisal.status)}
                          <Badge variant="outline" className="text-[9px] font-bold border-slate-200">{appraisal.period}</Badge>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                          Reviewed by {reviewerName} · Score: <span className={`font-bold ${getScoreColor(appraisal.score)}`}>{appraisal.score?.toFixed(1)}/5.0</span>
                        </p>
                        {appraisal.feedback && (
                          <p className="text-[11px] text-slate-400 mt-1 italic truncate max-w-lg">
                            "{appraisal.feedback}"
                          </p>
                        )}
                      </div>
                    </div>

                    {isSubmitted && (
                      <div className="flex items-center gap-2 mt-3 sm:mt-0 shrink-0">
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-8 px-4"
                          disabled={actionLoading === appraisal.id}
                          onClick={() => handleApprove(appraisal.id)}
                        >
                          {actionLoading === appraisal.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
                          Approve
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

      {/* Create Appraisal Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">New Performance Appraisal</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Employee *</label>
                <select
                  value={formEmployeeId}
                  onChange={(e) => setFormEmployeeId(e.target.value)}
                  className={`w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-lg px-3 py-2.5 font-medium focus:outline-none focus:ring-1 focus:ring-${themeAccent}-500`}
                >
                  <option value="">Select employee...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName || emp.full_name} ({emp.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Review Period *</label>
                <select
                  value={formPeriod}
                  onChange={(e) => setFormPeriod(e.target.value)}
                  className={`w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-lg px-3 py-2.5 font-medium focus:outline-none focus:ring-1 focus:ring-${themeAccent}-500`}
                >
                  <option value="">Select period...</option>
                  {periodOptions.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">
                  Score * — <span className={`font-bold ${getScoreColor(parseFloat(formScore) || 0)}`}>{formScore}/5.0</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.5"
                  value={formScore}
                  onChange={(e) => setFormScore(e.target.value)}
                  className="w-full h-2 bg-slate-200 rounded-lg accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-slate-400 mt-1 font-medium">
                  <span>0.0 — Needs Improvement</span>
                  <span>5.0 — Outstanding</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Feedback</label>
                <textarea
                  value={formFeedback}
                  onChange={(e) => setFormFeedback(e.target.value)}
                  placeholder="Provide detailed feedback about the employee's performance..."
                  rows={3}
                  className={`w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-${themeAccent}-500 resize-none`}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowCreateModal(false)} className="text-xs font-semibold">
                Cancel
              </Button>
              <Button
                onClick={handleCreateAppraisal}
                disabled={creating || !formEmployeeId || !formPeriod}
                className={`bg-${themeAccent}-600 hover:bg-${themeAccent}-700 text-white text-xs font-bold`}
              >
                {creating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
                Submit Appraisal
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
