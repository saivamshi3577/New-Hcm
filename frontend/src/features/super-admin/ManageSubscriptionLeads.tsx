import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api, safeArray } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import {
  DollarSign,
  TrendingUp,
  Users,
  Search,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  Building2,
  Sparkles,
  RefreshCw,
  PieChart,
  ArrowUpRight,
  Zap,
  Layers
} from 'lucide-react'

interface Lead {
  id: string
  full_name: string
  email: string
  phone: string
  company_name: string
  selected_plan: string
  employee_count: string
  notes?: string
  status: string
  created_at: string
}

export default function ManageSubscriptionLeads() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [leads, setLeads] = useState<Lead[]>([])

  // Filters State
  const [searchTerm, setSearchTerm] = useState('')
  const [planFilter, setPlanFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')

  const fetchLeads = async () => {
    setLoading(true)
    let fetched: Lead[] = []

    try {
      const data: any = await api.get('/subscription_leads?_sort=-created_at')
      const realLeads = safeArray(data, 'subscription_leads')

      if (realLeads && realLeads.length > 0) {
        fetched = realLeads
      }
    } catch (err) {
      console.warn('Supabase fetch error for subscription_leads:', err)
    }

    try {
      const local = JSON.parse(localStorage.getItem('st_subscription_leads') || '[]')
      const mergedMap = new Map<string, Lead>()
      
      local.forEach((l: Lead) => mergedMap.set(l.id, l))
      fetched.forEach((l: Lead) => mergedMap.set(l.id, l))

      const allLeads = Array.from(mergedMap.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      setLeads(allLeads)
    } catch (err) {
      setLeads([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeads()
  }, [])

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      const matchesSearch = 
        (l.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.company_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.phone || '').includes(searchTerm)

      const matchesPlan = planFilter === 'All' || (l.selected_plan && l.selected_plan.includes(planFilter))
      const matchesStatus = statusFilter === 'All' || l.status === statusFilter

      return matchesSearch && matchesPlan && matchesStatus
    })
  }, [leads, searchTerm, planFilter, statusFilter])

  // Analytics Metrics Calculations
  const metrics = useMemo(() => {
    const totalRequests = leads.length
    const pendingCount = leads.filter(l => l.status === 'New Pending').length
    const closedWonCount = leads.filter(l => l.status === 'Closed Won').length
    const conversionRate = totalRequests > 0 ? Math.round((closedWonCount / totalRequests) * 100) : 0

    const totalMRR = leads.reduce((sum, l) => {
      const p = l.selected_plan || ''
      if (p.includes('1,499') || p.includes('50')) return sum + 1499
      if (p.includes('2,699') || p.includes('100')) return sum + 2699
      if (p.includes('4,799') || p.includes('200')) return sum + 4799
      if (p.includes('Enterprise') || p.includes('500')) return sum + 9999
      return sum + 2699
    }, 0)

    const planCounts: Record<string, number> = {}
    leads.forEach(l => {
      const planKey = l.selected_plan || '100 Members'
      planCounts[planKey] = (planCounts[planKey] || 0) + 1
    })

    return {
      totalRequests,
      pendingCount,
      closedWonCount,
      conversionRate,
      totalMRR,
      planCounts
    }
  }, [leads])

  const handleUpdateStatus = async (leadId: string, newStatus: string) => {
    try {
      const updated = leads.map(l => l.id === leadId ? { ...l, status: newStatus } : l)
      setLeads(updated)
      localStorage.setItem('st_subscription_leads', JSON.stringify(updated))

      await api.put('/subscription_leads/' + leadId, { status: newStatus })

      toast({
        title: 'Status Updated',
        description: `Lead ${leadId} set to ${newStatus}.`,
      })
    } catch (err) {
      console.warn('Database status update warning:', err)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Closed Won':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'Demo Scheduled':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200'
      case 'Contacted':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'Lost':
        return 'bg-rose-50 text-rose-700 border-rose-200'
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200'
    }
  }

  return (
    <div className="space-y-6 text-foreground pb-8">
      {/* ── Header Section ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Subscription Leads & <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">MRR Pipeline</span>
          </h2>
          <p className="text-slate-500 text-sm mt-0.5 font-medium">
            Real-time pipeline intelligence of inbound SaaS subscription purchases and client requests.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchLeads}
            disabled={loading}
            className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold h-9 rounded-xl shadow-2xs flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Pipeline</span>
          </Button>
        </div>
      </div>

      {/* ── 4 KPI Stat Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-5 shadow-2xs hover-lift transition-all">
          <div className="flex justify-between items-center text-slate-400 text-xs font-extrabold uppercase tracking-wider mb-2">
            <span>Total Requests</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200/60 flex items-center justify-center text-indigo-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{metrics.totalRequests}</p>
          <p className="text-[10px] text-indigo-600 font-bold flex items-center gap-1 mt-1">
            <Clock className="w-3 h-3" /> {metrics.pendingCount} Pending Review
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-5 shadow-2xs hover-lift transition-all">
          <div className="flex justify-between items-center text-slate-400 text-xs font-extrabold uppercase tracking-wider mb-2">
            <span>MRR Pipeline Estimate</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight">₹{metrics.totalMRR.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-emerald-600 font-bold mt-1">Monthly Recurring Value</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-5 shadow-2xs hover-lift transition-all">
          <div className="flex justify-between items-center text-slate-400 text-xs font-extrabold uppercase tracking-wider mb-2">
            <span>Closed Won Deals</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200/60 flex items-center justify-center text-teal-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-teal-700 tracking-tight">{metrics.closedWonCount}</p>
          <p className="text-[10px] text-teal-600 font-bold mt-1">Active Subscribed Clients</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-5 shadow-2xs hover-lift transition-all">
          <div className="flex justify-between items-center text-slate-400 text-xs font-extrabold uppercase tracking-wider mb-2">
            <span>Conversion Rate</span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200/60 flex items-center justify-center text-orange-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-orange-600 tracking-tight">{metrics.conversionRate}%</p>
          <p className="text-[10px] text-slate-500 font-bold mt-1">Lead-to-Client Efficiency</p>
        </div>
      </div>

      {/* ── Tier Breakdown Progress Cards ────────────────────────────── */}
      <Card className="bg-white/85 backdrop-blur-xl border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
        <CardHeader className="pb-3 pt-5 px-5">
          <CardTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-indigo-600" />
            <span>Subscription Requests Breakdown by Tier</span>
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 mt-0.5">
            Distribution of tier selections by purchasing organization heads
          </CardDescription>
        </CardHeader>
        <CardContent className="px-5 pb-5 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(metrics.planCounts).map(([planName, count]) => {
              const pct = metrics.totalRequests > 0 ? Math.round((count / metrics.totalRequests) * 100) : 0
              return (
                <div key={planName} className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/70 space-y-2">
                  <div className="flex justify-between font-extrabold text-xs text-slate-900">
                    <span className="truncate">{planName}</span>
                    <span className="text-indigo-700">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-600 to-violet-600 h-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Main Interactive Table & Filter Controls ─────────────────── */}
      <Card className="bg-white/85 backdrop-blur-xl border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
        <CardHeader className="pb-4 pt-5 px-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-600" />
                <span>Lead Requests Management Table</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Manage inbound client inquiries, schedule demos, and update status in real-time
              </CardDescription>
            </div>

            {/* Filter Inputs */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <Input
                  placeholder="Search lead, company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-8.5 pl-8 bg-slate-50 border-slate-200 text-xs rounded-xl"
                />
              </div>

              <div className="w-36">
                <Select value={planFilter} onValueChange={setPlanFilter}>
                  <SelectTrigger className="h-8.5 bg-slate-50 border-slate-200 text-xs rounded-xl font-bold">
                    <SelectValue placeholder="All Plans" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-900 text-xs font-semibold">
                    <SelectItem value="All">All Plans</SelectItem>
                    <SelectItem value="50 Members">50 Members</SelectItem>
                    <SelectItem value="100 Members">100 Members</SelectItem>
                    <SelectItem value="200 Members">200 Members</SelectItem>
                    <SelectItem value="Enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-36">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8.5 bg-slate-50 border-slate-200 text-xs rounded-xl font-bold">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-900 text-xs font-semibold">
                    <SelectItem value="All">All Statuses</SelectItem>
                    <SelectItem value="New Pending">New Pending</SelectItem>
                    <SelectItem value="Contacted">Contacted</SelectItem>
                    <SelectItem value="Demo Scheduled">Demo Scheduled</SelectItem>
                    <SelectItem value="Closed Won">Closed Won</SelectItem>
                    <SelectItem value="Lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-5 pb-5 pt-0">
          {filteredLeads.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-semibold">
              No subscription lead requests match the selected filters.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
              <Table className="text-xs">
                <TableHeader className="bg-slate-50/90 border-b border-slate-200">
                  <TableRow>
                    <TableHead className="font-extrabold text-slate-700">Lead ID</TableHead>
                    <TableHead className="font-extrabold text-slate-700">Contact & Organization</TableHead>
                    <TableHead className="font-extrabold text-slate-700">Plan Requested</TableHead>
                    <TableHead className="font-extrabold text-slate-700">Team Size</TableHead>
                    <TableHead className="font-extrabold text-slate-700">Status</TableHead>
                    <TableHead className="font-extrabold text-slate-700">Submitted</TableHead>
                    <TableHead className="font-extrabold text-slate-700 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100">
                  {filteredLeads.map((lead) => (
                    <TableRow key={lead.id} className="hover:bg-indigo-50/20 transition-colors">
                      <TableCell className="font-mono font-bold text-slate-800 text-[11px]">
                        {lead.id}
                      </TableCell>

                      <TableCell>
                        <div>
                          <p className="font-extrabold text-slate-900">{lead.full_name}</p>
                          <p className="text-[11px] text-slate-600 font-semibold">{lead.company_name}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                            <span className="flex items-center gap-0.5"><Mail className="w-3 h-3 text-indigo-500" /> {lead.email}</span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5"><Phone className="w-3 h-3 text-emerald-500" /> {lead.phone}</span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="font-bold text-indigo-700">
                        {lead.selected_plan}
                      </TableCell>

                      <TableCell className="text-slate-600 font-semibold">
                        {lead.employee_count}
                      </TableCell>

                      <TableCell>
                        <Select
                          value={lead.status}
                          onValueChange={(val) => handleUpdateStatus(lead.id, val)}
                        >
                          <SelectTrigger className={`h-7 w-32 border text-[11px] font-bold rounded-lg ${getStatusBadge(lead.status)}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-slate-200 text-xs font-semibold">
                            <SelectItem value="New Pending">New Pending</SelectItem>
                            <SelectItem value="Contacted">Contacted</SelectItem>
                            <SelectItem value="Demo Scheduled">Demo Scheduled</SelectItem>
                            <SelectItem value="Closed Won">Closed Won</SelectItem>
                            <SelectItem value="Lost">Lost</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>

                      <TableCell className="text-slate-500 font-mono text-[11px]">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`mailto:${lead.email}?subject=FusionHRMS%20Onboarding%20-%20${encodeURIComponent(lead.selected_plan)}`}
                            className="p-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-lg border border-slate-200 transition-colors shadow-2xs"
                            title="Send Email"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={`tel:${lead.phone}`}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200 transition-colors shadow-2xs"
                            title="Call Lead"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        </div>
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
