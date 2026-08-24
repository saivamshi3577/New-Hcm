import { useState, useMemo } from 'react'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  PieChart as PieChartIcon, 
  Download, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  Layers, 
  Building2, 
  Calendar, 
  Filter, 
  FileSpreadsheet, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  CreditCard,
  Percent,
  Activity,
  BarChart3,
  Wallet,
  IndianRupee,
  FileText
} from 'lucide-react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, Legend, PieChart, Pie, Cell 
} from 'recharts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

interface FinancialRecord {
  id: string
  date: string
  description: string
  department: string
  category: 'Revenue' | 'Expense' | 'Payroll' | 'Infrastructure' | 'Marketing'
  amount: number
  status: 'Completed' | 'Pending' | 'Approved'
  invoiceNo: string
}

// Indian Rupee currency formatter
export const formatINR = (val: number, options?: { showDecimal?: boolean }) => {
  return '₹' + Number(val || 0).toLocaleString('en-IN', {
    maximumFractionDigits: options?.showDecimal ? 2 : 0,
    minimumFractionDigits: options?.showDecimal ? 2 : 0,
  })
}

// Short currency format (e.g. ₹1.92 Cr or ₹89.2 L)
export const formatINRShort = (val: number) => {
  const num = Number(val || 0)
  if (num >= 10000000) {
    return `₹${(num / 10000000).toFixed(2)} Cr`
  }
  if (num >= 100000) {
    return `₹${(num / 100000).toFixed(2)} L`
  }
  if (num >= 1000) {
    return `₹${(num / 1000).toFixed(1)}k`
  }
  return `₹${num}`
}

const INITIAL_RECORDS_INR: FinancialRecord[] = []

export default function FinanceManagement() {
  const { toast } = useToast()
  const [records, setRecords] = useState<FinancialRecord[]>(() => {
    try {
      const stored = localStorage.getItem('company_financial_records_inr')
      return stored ? JSON.parse(stored) : INITIAL_RECORDS_INR
    } catch (e) {
      return INITIAL_RECORDS_INR
    }
  })

  const [selectedPeriod, setSelectedPeriod] = useState('YTD 2026')
  const [filterCategory, setFilterCategory] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [isRecordOpen, setIsRecordOpen] = useState(false)

  // New Record Form State
  const [newDesc, setNewDesc] = useState('')
  const [newDept, setNewDept] = useState('Engineering & Tech')
  const [newCat, setNewCat] = useState<'Revenue' | 'Expense' | 'Payroll' | 'Infrastructure' | 'Marketing'>('Revenue')
  const [newAmt, setNewAmt] = useState('')

  // Totals calculations in INR from real records
  const totalRevenue = useMemo(() => {
    return records.filter(r => r.category === 'Revenue').reduce((acc, r) => acc + (Number(r.amount) || 0), 0)
  }, [records])

  const totalExpenses = useMemo(() => {
    return records.filter(r => r.category !== 'Revenue').reduce((acc, r) => acc + (Number(r.amount) || 0), 0)
  }, [records])

  const netProfit = totalRevenue - totalExpenses
  const profitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0
  const scalingGrowthRate = totalRevenue > 0 ? (profitMargin > 0 ? profitMargin : 0) : 0

  // Dynamic monthly aggregation
  const monthlyFinanceData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const currentMonthIdx = new Date().getMonth()
    const displayedMonths = months.slice(0, currentMonthIdx + 1)

    return displayedMonths.map((m, idx) => {
      const monthRecords = records.filter(r => {
        if (!r.date) return false
        const d = new Date(r.date)
        return d.getMonth() === idx
      })
      const rev = monthRecords.filter(r => r.category === 'Revenue').reduce((s, r) => s + (Number(r.amount) || 0), 0)
      const exp = monthRecords.filter(r => r.category !== 'Revenue').reduce((s, r) => s + (Number(r.amount) || 0), 0)
      return {
        month: m,
        revenue: rev,
        expenses: exp,
        profit: rev - exp
      }
    })
  }, [records])

  // Department budgets calculated from records
  const departmentBudgets = useMemo(() => {
    const deptMap = new Map<string, { allocated: number; spent: number }>()
    const colors = ['#2563EB', '#3B82F6', '#60A5FA', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899']

    records.forEach(r => {
      const dName = r.department || 'General'
      if (!deptMap.has(dName)) {
        deptMap.set(dName, { allocated: 0, spent: 0 })
      }
      const item = deptMap.get(dName)!
      const amt = Number(r.amount) || 0
      if (r.category === 'Revenue') {
        item.allocated += amt
      } else {
        item.spent += amt
      }
    })

    return Array.from(deptMap.entries()).map(([name, data], idx) => {
      const allocated = data.allocated || (data.spent * 1.3) || 100000
      const spent = data.spent
      const pct = allocated > 0 ? Math.min(100, Math.round((spent / allocated) * 100)) : 0
      return {
        name,
        allocated,
        spent,
        pct,
        color: colors[idx % colors.length]
      }
    })
  }, [records])

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchCat = filterCategory === 'All' || r.category === filterCategory
      const matchSearch = searchTerm === '' || 
        r.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
        r.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.department.toLowerCase().includes(searchTerm.toLowerCase())
      return matchCat && matchSearch
    })
  }, [records, filterCategory, searchTerm])

  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDesc.trim() || !newAmt || isNaN(Number(newAmt))) {
      toast({ title: "Invalid Input", description: "Please enter a valid description and INR amount.", variant: "destructive" })
      return
    }

    const rec: FinancialRecord = {
      id: String(Date.now()),
      date: new Date().toISOString().split('T')[0],
      description: newDesc.trim(),
      department: newDept,
      category: newCat,
      amount: Number(newAmt),
      status: 'Completed',
      invoiceNo: `FIN-${Date.now().toString().slice(-4)}`
    }

    const updated = [rec, ...records]
    setRecords(updated)
    try {
      localStorage.setItem('company_financial_records_inr', JSON.stringify(updated))
    } catch (e) {}

    setIsRecordOpen(false)
    setNewDesc('')
    setNewAmt('')
    toast({
      title: "Financial Record Added",
      description: `Successfully logged ${rec.category} of ${formatINR(rec.amount)}.`
    })
  }

  const handleExportCSV = () => {
    try {
      if (filteredRecords.length === 0) {
        toast({ title: "No Records", description: "No financial records available to export.", variant: "destructive" })
        return
      }
      const headers = ['Date', 'Invoice/Ref', 'Description', 'Department', 'Category', 'Amount (INR)', 'Status']
      const rows = filteredRecords.map(r => [
        r.date,
        r.invoiceNo,
        `"${r.description}"`,
        `"${r.department}"`,
        r.category,
        r.amount,
        r.status
      ])
      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join("\n")
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement("a")
      link.setAttribute("href", encodedUri)
      link.setAttribute("download", `Company_Financial_Report_INR_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast({ title: "Report Exported", description: "Financial ledger exported in INR as CSV." })
    } catch (err: any) {
      toast({ title: "Export Failed", description: err.message, variant: "destructive" })
    }
  }

  return (
    <div className="space-y-7 max-w-7xl mx-auto pb-14 font-sans text-slate-800">
      
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[22px] border border-slate-200/80 shadow-[0_2px_6px_rgba(37,99,235,0.05)]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-['Space_Grotesk'] text-slate-900 leading-tight">
                Finance & Commercial Ledger (₹ INR)
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Corporate profit and loss, operating revenue, sprint budgets, and transaction accounting
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button 
            onClick={handleExportCSV}
            variant="outline" 
            className="h-10 text-xs font-bold border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" /> Export CSV (₹)
          </Button>

          <Dialog open={isRecordOpen} onOpenChange={setIsRecordOpen}>
            <DialogTrigger asChild>
              <Button className="h-10 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> Log Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px] bg-white rounded-2xl p-6">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold font-['Space_Grotesk'] text-slate-900">
                  Record Commercial Transaction (₹)
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400">
                  Log corporate revenue, payroll disbursement, cloud infra cost, or departmental expenses in Indian Rupees.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleAddRecord} className="space-y-4 pt-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Description / Narration</label>
                  <Input 
                    placeholder="e.g. Enterprise Client Annual Retainer"
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    className="h-10 text-xs border-slate-200 rounded-xl"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Category</label>
                    <select 
                      value={newCat}
                      onChange={(e: any) => setNewCat(e.target.value)}
                      className="w-full h-10 px-3 text-xs border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none"
                    >
                      <option value="Revenue">Revenue (+)</option>
                      <option value="Expense">Expense (-)</option>
                      <option value="Payroll">Payroll / Comp (-)</option>
                      <option value="Infrastructure">Infrastructure (-)</option>
                      <option value="Marketing">Marketing / Ads (-)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Department</label>
                    <Input 
                      placeholder="e.g. Engineering & Tech"
                      value={newDept}
                      onChange={e => setNewDept(e.target.value)}
                      className="h-10 text-xs border-slate-200 rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Amount in INR (₹)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">₹</span>
                    <Input 
                      type="number"
                      placeholder="e.g. 250000"
                      value={newAmt}
                      onChange={e => setNewAmt(e.target.value)}
                      className="h-10 pl-7 text-xs font-bold font-['JetBrains_Mono'] border-slate-200 rounded-xl"
                      required
                    />
                  </div>
                </div>

                <DialogFooter className="pt-2">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setIsRecordOpen(false)}
                    className="h-10 text-xs font-bold rounded-xl text-slate-500"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="h-10 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs"
                  >
                    Save Record (₹)
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>


      {/* ── Row 1: Core Financial KPI Stat Cards (in INR ₹) ────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Gross Revenue */}
        <div className="bg-white border border-slate-200/80 rounded-[20px] p-6 shadow-[0_2px_6px_rgba(37,99,235,0.05)] hover:shadow-[0_14px_34px_rgba(37,99,235,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-[13px] bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] flex items-center justify-center text-white shadow-[0_8px_16px_rgba(37,99,235,0.3)]">
              <IndianRupee className="w-5 h-5" />
            </div>
            <span className="text-xs font-extrabold text-[#059669] bg-[#ECFDF5] px-2.5 py-1 rounded-full flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> Gross
            </span>
          </div>
          <div>
            <div className="text-3xl font-bold font-['Space_Grotesk'] text-slate-900 tracking-tight">
              {formatINR(totalRevenue)}
            </div>
            <div className="text-xs text-slate-500 font-semibold mt-1">Gross Revenue · {formatINRShort(totalRevenue)}</div>
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-white border border-slate-200/80 rounded-[20px] p-6 shadow-[0_2px_6px_rgba(37,99,235,0.05)] hover:shadow-[0_14px_34px_rgba(37,99,235,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-[13px] bg-gradient-to-br from-[#10B981] to-[#047857] flex items-center justify-center text-white shadow-[0_8px_16px_rgba(16,185,129,0.3)]">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-xs font-extrabold text-[#059669] bg-[#ECFDF5] px-2.5 py-1 rounded-full flex items-center gap-1">
              {profitMargin}% Margin
            </span>
          </div>
          <div>
            <div className={`text-3xl font-bold font-['Space_Grotesk'] tracking-tight ${netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
              {formatINR(netProfit)}
            </div>
            <div className="text-xs text-slate-500 font-semibold mt-1">Net Operating Profit · {formatINRShort(netProfit)}</div>
          </div>
        </div>

        {/* Operating Expenses */}
        <div className="bg-white border border-slate-200/80 rounded-[20px] p-6 shadow-[0_2px_6px_rgba(37,99,235,0.05)] hover:shadow-[0_14px_34px_rgba(37,99,235,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-[13px] bg-gradient-to-br from-[#6366F1] to-[#4338CA] flex items-center justify-center text-white shadow-[0_8px_16px_rgba(99,102,241,0.3)]">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="text-xs font-extrabold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-1 rounded-full flex items-center gap-1">
              OpEx
            </span>
          </div>
          <div>
            <div className="text-3xl font-bold font-['Space_Grotesk'] text-slate-900 tracking-tight">
              {formatINR(totalExpenses)}
            </div>
            <div className="text-xs text-slate-500 font-semibold mt-1">Total Expenses · {formatINRShort(totalExpenses)}</div>
          </div>
        </div>

        {/* Total Ledger Transactions */}
        <div className="bg-white border border-slate-200/80 rounded-[20px] p-6 shadow-[0_2px_6px_rgba(37,99,235,0.05)] hover:shadow-[0_14px_34px_rgba(37,99,235,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-[13px] bg-gradient-to-br from-[#0284C7] to-[#0369A1] flex items-center justify-center text-white shadow-[0_8px_16px_rgba(2,132,199,0.3)]">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-xs font-extrabold text-[#059669] bg-[#ECFDF5] px-2.5 py-1 rounded-full flex items-center gap-1">
              {records.length} Records
            </span>
          </div>
          <div>
            <div className="text-3xl font-bold font-['Space_Grotesk'] text-slate-900 tracking-tight text-blue-600">
              {records.length}
            </div>
            <div className="text-xs text-slate-500 font-semibold mt-1">Logged Entries in Ledger</div>
          </div>
        </div>

      </div>


      {/* ── Row 2: Charts (Revenue vs Expenses & Department Budgets in INR) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* Revenue & Profit Growth Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-[20px] p-7 shadow-[0_2px_6px_rgba(37,99,235,0.05)] flex flex-col justify-between space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base font-['Space_Grotesk']">
                Revenue, OpEx & Net Profit Scale (₹ INR)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Monthly fiscal trajectory and bottom-line profit progression in Indian Rupees
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-blue-600" /> Revenue
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Net Profit
              </span>
            </div>
          </div>

          <div className="h-[280px] w-full pt-2">
            {records.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                <IndianRupee className="w-8 h-8 opacity-40" />
                <p className="text-xs font-medium">No financial transactions recorded yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyFinanceData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevINR" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorProfINR" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis 
                    stroke="#94A3B8" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={val => `₹${(val / 100000).toFixed(0)}L`} 
                  />
                  <Tooltip 
                    formatter={(value: any) => [formatINR(Number(value)), '']}
                    contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}
                  />
                  <Area type="monotone" dataKey="revenue" name="Gross Revenue" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevINR)" />
                  <Area type="monotone" dataKey="profit" name="Net Profit" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorProfINR)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Department Budget Allocation (1 col) */}
        <div className="bg-white border border-slate-200/80 rounded-[20px] p-7 shadow-[0_2px_6px_rgba(37,99,235,0.05)] flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base font-['Space_Grotesk']">Department Budgets (₹)</h3>
                <p className="text-xs text-slate-400 mt-0.5">Budget utilization by business unit</p>
              </div>
            </div>

            <div className="space-y-4">
              {departmentBudgets.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No department expense data recorded yet
                </div>
              ) : (
                departmentBudgets.map((dept) => (
                  <div key={dept.name}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-bold text-slate-900 truncate max-w-[140px]">{dept.name}</span>
                      <span className="font-bold text-slate-600 font-['JetBrains_Mono']">
                        {formatINRShort(dept.spent)} / {formatINRShort(dept.allocated)} ({dept.pct}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-700" 
                        style={{ width: `${dept.pct}%`, backgroundColor: dept.color }} 
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Fiscal Cap Status</span>
            <span className="text-emerald-700 font-bold">Within INR Budget Limits</span>
          </div>
        </div>

      </div>


      {/* ── Row 3: Financial Ledger in INR ───────── */}
      <div className="bg-white border border-slate-200/80 rounded-[20px] p-7 shadow-[0_2px_6px_rgba(37,99,235,0.05)] space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base font-['Space_Grotesk']">Recent Financial Ledger</h3>
            <p className="text-xs text-slate-400 mt-0.5">Corporate revenue receipts, payroll, and vendor disbursements in ₹</p>
          </div>

          <div className="flex items-center gap-2">
            <Input 
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="h-8 text-xs border-slate-200 rounded-lg w-40"
            />
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="h-8 px-2.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none"
            >
              <option value="All">All Categories</option>
              <option value="Revenue">Revenue</option>
              <option value="Expense">Expense</option>
              <option value="Payroll">Payroll</option>
              <option value="Infrastructure">Infrastructure</option>
              <option value="Marketing">Marketing</option>
            </select>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/80 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-slate-600 font-bold border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">Ref / Invoice</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Amount (₹)</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    No financial transactions found. Click "Log Transaction" above to add an entry.
                  </td>
                </tr>
              ) : (
                filteredRecords.slice(0, 10).map((item) => (
                  <tr key={item.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3 px-4 font-['JetBrains_Mono'] font-bold text-blue-600">
                      {item.invoiceNo}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{item.description}</p>
                      <p className="text-[10px] text-slate-400">{item.date}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {item.department}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                        item.category === 'Revenue'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : item.category === 'Payroll'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {item.category}
                      </span>
                    </td>
                    <td className={`py-3 px-4 text-right font-['JetBrains_Mono'] font-bold ${
                      item.category === 'Revenue' ? 'text-emerald-700' : 'text-slate-900'
                    }`}>
                      {item.category === 'Revenue' ? '+' : '-'}{formatINR(item.amount)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1 bg-[#ECFDF5] text-[#059669] text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
