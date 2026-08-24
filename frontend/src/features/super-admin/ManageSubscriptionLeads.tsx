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
  Filter,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  Building,
  Calendar,
  Sparkles,
  RefreshCw,
  PieChart,
  UserCheck,
  XCircle,
  MessageSquare
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
      // 1. Fetch real leads from Supabase table subscription_leads
      const data: any = await api.get('/subscription_leads?_sort=-created_at')
      const realLeads = safeArray(data, 'subscription_leads')

      if (realLeads && realLeads.length > 0) {
        fetched = realLeads
      }
    } catch (err) {
      console.warn('Supabase fetch error for subscription_leads:', err)
    }

    // 2. Combine with LocalStorage leads submitted via public request form
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
      // Search Match
      const matchesSearch = 
        l.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.phone.includes(searchTerm)

      // Plan Match
      const matchesPlan = planFilter === 'All' || l.selected_plan.includes(planFilter)

      // Status Match
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

    // Estimate MRR Pipeline in ₹
    const totalMRR = leads.reduce((sum, l) => {
      if (l.selected_plan.includes('1,499')) return sum + 1499
      if (l.selected_plan.includes('2,699')) return sum + 2699
      if (l.selected_plan.includes('4,799')) return sum + 4799
      if (l.selected_plan.includes('Enterprise')) return sum + 9999
      return sum + 2699
    }, 0)

    // Plan Distribution Map
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

  // Update Lead Status
  const handleUpdateStatus = async (leadId: string, newStatus: string) => {
    try {
      // Update local state
      const updated = leads.map(l => l.id === leadId ? { ...l, status: newStatus } : l)
      setLeads(updated)
      localStorage.setItem('st_subscription_leads', JSON.stringify(updated))

      // Try database update
      await api.put('/subscription_leads/' + leadId, { status: newStatus })

      toast({
        title: 'Status Updated',
        description: `Lead ${leadId} updated to ${newStatus}.`,
      })
    } catch (err) {
      console.warn('Database status update warning:', err)
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Top Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-teal-50 text-teal-700 rounded-xl border border-teal-200">
              <DollarSign className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Subscription Leads & MRR Pipeline
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Real-time visual intelligence of SaaS purchase requests submitted by client organizations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={fetchLeads}
            disabled={loading}
            className="border-slate-200 text-slate-700 text-xs font-bold h-9 rounded-xl flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Leads</span>
          </Button>
        </div>
      </div>

      {/* KPI Visual Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex justify-between items-center text-slate-500 text-xs font-medium">
            <span>Total Lead Requests</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">{metrics.totalRequests}</p>
          <p className="text-[10px] text-indigo-600 font-bold flex items-center gap-1">
            <Clock className="w-3 h-3" /> {metrics.pendingCount} New Pending Review
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex justify-between items-center text-slate-500 text-xs font-medium">
            <span>MRR Pipeline Estimate</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-700">₹{metrics.totalMRR.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-emerald-600 font-bold">Monthly Recurring Value</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex justify-between items-center text-slate-500 text-xs font-medium">
            <span>Closed Won Deals</span>
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-teal-700">{metrics.closedWonCount}</p>
          <p className="text-[10px] text-teal-600 font-bold">Active Subscribed Clients</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex justify-between items-center text-slate-500 text-xs font-medium">
            <span>Conversion Rate</span>
            <TrendingUp className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-orange-600">{metrics.conversionRate}%</p>
          <p className="text-[10px] text-slate-500">Lead-to-Client Efficiency</p>
        </div>

      </div>

      {/* Plan Distribution Visual Progress Bar */}
      <Card className="bg-white border-slate-200 rounded-2xl shadow-2xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-indigo-600" /> Subscription Requests Breakdown per Plan
          </CardTitle>
          <CardDescription className="text-xs">
            Visual distribution of tier choices selected by purchasing organization heads.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {Object.entries(metrics.planCounts).map(([planName, count]) => {
              const pct = metrics.totalRequests > 0 ? Math.round((count / metrics.totalRequests) * 100) : 0
              return (
                <div key={planName} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span className="truncate">{planName}</span>
                    <span className="text-teal-700">{count} Leads ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-teal-600 h-full transition-all duration-300" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Interactive Table & Filter Controls */}
      <Card className="bg-white border-slate-200 rounded-2xl shadow-2xs">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-600" /> Lead Requests Management Table
              </CardTitle>
              <CardDescription className="text-xs">
                Filter and update client onboarding status in real-time.
              </CardDescription>
            </div>

            {/* Filter Inputs */}
            <div className="flex flex-wrap items-center gap-2">
              
              {/* Search Bar */}
              <div className="relative w-full sm:w-48">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <Input
                  placeholder="Search lead, company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-9 pl-8 bg-slate-50 border-slate-200 text-xs rounded-xl"
                />
              </div>

              {/* Plan Filter */}
              <div className="w-36">
                <Select value={planFilter} onValueChange={setPlanFilter}>
                  <SelectTrigger className="h-9 bg-slate-50 border-slate-200 text-xs rounded-xl">
                    <SelectValue placeholder="All Plans" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-900 text-xs">
                    <SelectItem value="All">All Plans</SelectItem>
                    <SelectItem value="50 Members">50 Members</SelectItem>
                    <SelectItem value="100 Members">100 Members</SelectItem>
                    <SelectItem value="200 Members">200 Members</SelectItem>
                    <SelectItem value="Enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="w-36">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 bg-slate-50 border-slate-200 text-xs rounded-xl">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-900 text-xs">
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

        <CardContent>
          {filteredLeads.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-semibold">
              No subscription lead requests match the selected filters.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <Table className="text-xs">
                <TableHeader className="bg-slate-50/80 border-b border-slate-200">
                  <TableRow>
                    <TableHead className="font-extrabold text-slate-700">Lead Ref</TableHead>
                    <TableHead className="font-extrabold text-slate-700">Contact & Company</TableHead>
                    <TableHead className="font-extrabold text-slate-700">Plan Requested</TableHead>
                    <TableHead className="font-extrabold text-slate-700">Team Size</TableHead>
                    <TableHead className="font-extrabold text-slate-700">Status</TableHead>
                    <TableHead className="font-extrabold text-slate-700">Date</TableHead>
                    <TableHead className="font-extrabold text-slate-700 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100">
                  {filteredLeads.map((lead) => (
                    <TableRow key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                      
                      <TableCell className="font-mono font-bold text-slate-900">
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

                      <TableCell className="font-bold text-teal-700">
                        {lead.selected_plan}
                      </TableCell>

                      <TableCell className="text-slate-600 font-medium">
                        {lead.employee_count}
                      </TableCell>

                      <TableCell>
                        <Select
                          value={lead.status}
                          onValueChange={(val) => handleUpdateStatus(lead.id, val)}
                        >
                          <SelectTrigger className="h-7 w-32 border-slate-200 text-[11px] font-bold rounded-lg bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-slate-200 text-xs">
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
                            href={`mailto:${lead.email}?subject=FusionHRMS%20Onboarding%20-%20${lead.selected_plan}`}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200"
                            title="Send Email"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={`tel:${lead.phone}`}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200"
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
