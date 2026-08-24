import { useState, useMemo, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import {
  DollarSign,
  FileText,
  Download,
  Loader2,
  Search,
  Calendar,
  TrendingUp,
  Users,
  IndianRupee,
  Eye,
  Sparkles,
  CheckCircle,
  Building2,
  Shield,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { payrollApi, api, safeArray } from '@/lib/api'
import logoImg from '@/assets/logo.png'

const MONTHS = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
]

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 5 }, (_, i) => ({
  value: String(CURRENT_YEAR - 2 + i),
  label: String(CURRENT_YEAR - 2 + i),
}))

function formatCurrency(amount: number | null | undefined): string {
  if (amount == null || isNaN(amount)) return '₹0.00'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount)
}

function getMonthName(month: number): string {
  return MONTHS.find((m) => m.value === String(month))?.label || String(month)
}

// ─── Printable Payslip Component ─────────────────────────────────────────────
function PrintablePayslip({ payslip, companyLogo }: { payslip: any; companyLogo: string }) {
  const profile = payslip.user?.employeeProfile || {}
  const empName = payslip.user?.full_name || payslip.user?.fullName || 'Employee'
  const empEmail = payslip.user?.email || ''
  const designation = profile.designation || 'Employee'
  const department = profile.department || 'General'
  const panNumber = profile.panNumber || 'N/A'
  const uanNumber = profile.uanNumber || 'N/A'
  const esicNumber = profile.esicNumber || 'N/A'

  const basicPay = payslip.basic_pay ?? payslip.basicPay ?? 0
  const hra = payslip.hra ?? 0
  const specialAllowance = payslip.specialAllowance ?? payslip.special_allowance ?? 0
  const medicalAllowance = payslip.medicalAllowance ?? payslip.medical_allowance ?? 0
  const conveyance = payslip.conveyance ?? 0
  const grossPay = payslip.grossPay ?? payslip.gross_pay ?? (basicPay + hra + specialAllowance + medicalAllowance + conveyance)

  const epf = payslip.epf ?? 0
  const esi = payslip.esi ?? 0
  const tds = payslip.tds ?? 0
  const professionalTax = payslip.professionalTax ?? payslip.professional_tax ?? 0
  const totalDeductions = payslip.totalDeductions ?? payslip.total_deductions ?? (epf + esi + tds + professionalTax)
  const netPay = payslip.net_pay ?? payslip.netPay ?? 0

  const period = `${getMonthName(payslip.month)} ${payslip.year}`
  const generatedDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
  const isPaid = (payslip.status || '').toUpperCase() === 'PAID'

  const accentColor = '#4f46e5' // indigo

  return (
    <div
      id="payslip-printable"
      style={{
        width: '794px',
        backgroundColor: '#ffffff',
        fontFamily: "'Segoe UI', 'Inter', Arial, sans-serif",
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
        border: '1px solid #e2e8f0',
      }}
    >
      {/* Watermark */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%) rotate(-25deg)',
        zIndex: 0, pointerEvents: 'none', opacity: 0.04,
      }}>
        <img src={companyLogo} alt="" style={{ width: '460px', objectFit: 'contain' }} />
      </div>

      {/* All content sits above watermark */}
      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* ── TOP ACCENT BAR */}
        <div style={{ backgroundColor: accentColor, height: '6px', width: '100%' }} />

        {/* ── HEADER: Logo + Period */}
        <div style={{
          padding: '24px 40px 20px',
          borderBottom: '1.5px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#ffffff',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img src={companyLogo} alt="Logo" style={{ height: '46px', objectFit: 'contain' }} />
            <div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b', letterSpacing: '-0.02em' }}>Salary Payslip</div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Human Resources Department</div>
            </div>
          </div>
          <div style={{
            border: `1.5px solid ${accentColor}`,
            borderRadius: '10px',
            padding: '12px 20px',
            textAlign: 'center',
            minWidth: '160px',
          }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Pay Period</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', marginTop: '4px' }}>{period}</div>
            <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>Issued: {generatedDate}</div>
          </div>
        </div>

        {/* ── META: Payslip ID + Status */}
        <div style={{
          backgroundColor: '#f8fafc',
          padding: '10px 40px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            Payslip ID: <span style={{ fontWeight: 700, color: '#334155', fontFamily: 'monospace' }}>
              PS-{payslip.id?.slice(0, 8).toUpperCase() || 'XXXXXXXX'}
            </span>
          </div>
          <div style={{
            fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
            padding: '3px 14px', borderRadius: '20px',
            backgroundColor: isPaid ? '#dcfce7' : '#fef3c7',
            color: isPaid ? '#15803d' : '#92400e',
            border: `1px solid ${isPaid ? '#86efac' : '#fde68a'}`,
          }}>
            {payslip.status || 'GENERATED'}
          </div>
        </div>

        {/* ── EMPLOYEE INFORMATION */}
        <div style={{ padding: '20px 40px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: '14px' }}>
            Employee Information
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px 24px' }}>
            <InfoCell label="Full Name" value={empName} />
            <InfoCell label="Email Address" value={empEmail} />
            <InfoCell label="Designation" value={designation} />
            <InfoCell label="Department" value={department} />
            <InfoCell label="PAN Number" value={panNumber} />
            <InfoCell label="UAN Number" value={uanNumber} />
            <InfoCell label="ESIC Number" value={esicNumber} />
            <InfoCell label="Payment Mode" value="Bank Transfer" />
          </div>
        </div>

        {/* ── SALARY BREAKDOWN TABLE */}
        <div style={{ padding: '20px 40px', backgroundColor: '#ffffff' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: '14px' }}>
            Salary Breakdown
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ backgroundColor: accentColor, color: '#ffffff' }}>
                <th style={{ padding: '9px 16px', textAlign: 'left', fontWeight: 700, letterSpacing: '0.04em', fontSize: '11px' }}>EARNINGS</th>
                <th style={{ padding: '9px 16px', textAlign: 'right', fontWeight: 700, fontSize: '11px', width: '140px' }}>AMOUNT</th>
                <th style={{ padding: '9px 16px', textAlign: 'left', fontWeight: 700, letterSpacing: '0.04em', fontSize: '11px', borderLeft: '1px solid rgba(255,255,255,0.25)' }}>DEDUCTIONS</th>
                <th style={{ padding: '9px 16px', textAlign: 'right', fontWeight: 700, fontSize: '11px', width: '140px' }}>AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              <TableSplitRow eLabel="Basic Pay" eValue={formatCurrency(basicPay)} dLabel="EPF (Employee PF)" dValue={formatCurrency(epf)} isAlt={false} />
              <TableSplitRow eLabel="House Rent Allowance (HRA)" eValue={formatCurrency(hra)} dLabel="ESI Contribution" dValue={formatCurrency(esi)} isAlt />
              <TableSplitRow eLabel="Special Allowance" eValue={specialAllowance > 0 ? formatCurrency(specialAllowance) : '—'} dLabel="TDS (Income Tax)" dValue={formatCurrency(tds)} isAlt={false} />
              <TableSplitRow eLabel="Medical Allowance" eValue={medicalAllowance > 0 ? formatCurrency(medicalAllowance) : '—'} dLabel="Professional Tax" dValue={professionalTax > 0 ? formatCurrency(professionalTax) : '—'} isAlt />
              <TableSplitRow eLabel="Conveyance Allowance" eValue={conveyance > 0 ? formatCurrency(conveyance) : '—'} dLabel="" dValue="" isAlt={false} />
              <tr style={{ borderTop: `2px solid ${accentColor}` }}>
                <td style={{ padding: '10px 16px', fontWeight: 800, fontSize: '12px', color: '#065f46', backgroundColor: '#f0fdf4' }}>Total Gross Earnings</td>
                <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 800, fontSize: '13px', color: '#065f46', backgroundColor: '#f0fdf4' }}>{formatCurrency(grossPay)}</td>
                <td style={{ padding: '10px 16px', fontWeight: 800, fontSize: '12px', color: '#b91c1c', backgroundColor: '#fff1f2', borderLeft: '1px solid #fecaca' }}>Total Deductions</td>
                <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 800, fontSize: '13px', color: '#b91c1c', backgroundColor: '#fff1f2' }}>{formatCurrency(totalDeductions)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── NET PAY */}
        <div style={{
          margin: '4px 40px 24px',
          border: `1.5px solid ${accentColor}`,
          borderRadius: '10px',
          padding: '18px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#eef2ff',
        }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#4338ca', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Net Pay (Take Home)</div>
            <div style={{ fontSize: '11px', color: '#6366f1', marginTop: '4px' }}>
              {formatCurrency(grossPay)} gross &minus; {formatCurrency(totalDeductions)} deductions
            </div>
          </div>
          <div style={{ fontSize: '30px', fontWeight: 900, color: '#312e81', letterSpacing: '-0.03em' }}>
            {formatCurrency(netPay)}
          </div>
        </div>

        {/* ── FOOTER */}
        <div style={{
          margin: '0 40px 28px',
          paddingTop: '16px',
          borderTop: '1px dashed #cbd5e1',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
        }}>
          <div style={{ fontSize: '10px', color: '#94a3b8', lineHeight: 1.7 }}>
            This is a system-generated payslip and does not require a physical signature.<br />
            For any discrepancies, contact HR within 7 working days of receipt.
          </div>
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '28px' }}>Authorised by</div>
            <div style={{ width: '120px', borderTop: '1px solid #94a3b8', paddingTop: '4px', fontSize: '10px', color: '#64748b', textAlign: 'center' }}>HR Manager</div>
          </div>
        </div>

        {/* ── BOTTOM BAR */}
        <div style={{
          backgroundColor: accentColor,
          padding: '8px 40px',
          display: 'flex',
          justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.75)', letterSpacing: '0.05em' }}>CONFIDENTIAL · FOR EMPLOYEE USE ONLY</span>
          <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.75)' }}>Generated by EvalX HCM · {generatedDate}</span>
        </div>
      </div>
    </div>
  )
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: '9px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '3px' }}>{label}</div>
      <div style={{ fontSize: '12px', fontWeight: 600, color: '#1e293b', wordBreak: 'break-all' }}>{value}</div>
    </div>
  )
}

function TableSplitRow({ eLabel, eValue, dLabel, dValue, isAlt }: {
  eLabel: string; eValue: string; dLabel: string; dValue: string; isAlt: boolean
}) {
  const bg = isAlt ? '#f8fafc' : '#ffffff'
  return (
    <tr style={{ backgroundColor: bg }}>
      <td style={{ padding: '9px 16px', color: '#374151', fontSize: '12px', borderBottom: '1px solid #f1f5f9' }}>{eLabel}</td>
      <td style={{ padding: '9px 16px', textAlign: 'right', color: '#111827', fontWeight: 600, fontSize: '12px', borderBottom: '1px solid #f1f5f9' }}>{eValue}</td>
      <td style={{ padding: '9px 16px', color: '#374151', fontSize: '12px', borderBottom: '1px solid #f1f5f9', borderLeft: '1px solid #e2e8f0' }}>{dLabel}</td>
      <td style={{ padding: '9px 16px', textAlign: 'right', color: dValue && dValue !== '—' ? '#dc2626' : '#94a3b8', fontWeight: 600, fontSize: '12px', borderBottom: '1px solid #f1f5f9' }}>{dValue}</td>
    </tr>
  )
}

// ─── Main Payroll Component ───────────────────────────────────────────────────

export default function Payroll() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const payslipRef = useRef<HTMLDivElement>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1))
  const [selectedYear, setSelectedYear] = useState(String(CURRENT_YEAR))
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [genEmployeeId, setGenEmployeeId] = useState<string>('')

  // Fetch payslips
  const { data: rawPayslips, isLoading } = useQuery({
    queryKey: ['payslips', selectedMonth, selectedYear],
    staleTime: 1000 * 30,
    queryFn: async () => {
      const params = `month=${selectedMonth}&year=${selectedYear}`
      const data = await payrollApi.getPayslips(params)
      return safeArray(data, 'payslips')
    },
  })

  // Fetch employees
  const { data: rawEmployees } = useQuery({
    queryKey: ['employees-for-payroll'],
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const data = await api.get('/employee')
      const all = safeArray(data, 'employees')
      return all.filter((u: any) => {
        const r = (u.role || '').toUpperCase()
        return !r.includes('ADMIN') && !r.includes('SUPER')
      })
    },
  })

  const payslips = safeArray(rawPayslips)
  const employees = safeArray(rawEmployees)

  // Generate payslips mutation
  const generateMutation = useMutation({
    mutationFn: async (payload: { month: string; year: string; userId?: string }) => {
      return await payrollApi.generatePayslips({
        month: parseInt(payload.month),
        year: parseInt(payload.year),
        ...(payload.userId && { userId: payload.userId }),
      })
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['payslips'] })
      const count = data?.count || data?.payslips?.length || 0
      toast({ title: 'Payslips Generated', description: `Generated ${count} payslip(s) for ${getMonthName(parseInt(selectedMonth))} ${selectedYear}.` })
      setGenEmployeeId('')
    },
    onError: (err: any) => {
      toast({ title: 'Generation Failed', description: err.message || 'Failed to generate payslips', variant: 'destructive' })
    },
  })

  // Mark as paid mutation
  const markPaidMutation = useMutation({
    mutationFn: async (id: string) => payrollApi.updatePayslipStatus(id, 'PAID'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payslips'] })
      toast({ title: 'Status Updated', description: 'Payslip marked as PAID.' })
    },
    onError: (err: any) => {
      toast({ title: 'Update Failed', description: err.message, variant: 'destructive' })
    },
  })

  // View payslip
  const handleViewPayslip = async (payslip: any) => {
    try {
      const data = await payrollApi.downloadPayslip(payslip.id)
      const detail = data?.payslip || data?.data || payslip
      setSelectedPayslip({ ...payslip, ...detail })
    } catch {
      setSelectedPayslip(payslip)
    }
    setIsViewOpen(true)
  }

  // PDF Download using html2canvas + jsPDF
  const handleDownloadPDF = useCallback(async () => {
    if (!payslipRef.current || !selectedPayslip) return
    setIsDownloading(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const { jsPDF } = await import('jspdf')

      const canvas = await html2canvas(payslipRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      })

      const imgData = canvas.toDataURL('image/png', 1.0)
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)

      const empName = (selectedPayslip.user?.full_name || selectedPayslip.user?.fullName || 'Employee').replace(/\s+/g, '_')
      pdf.save(`Payslip_${empName}_${getMonthName(selectedPayslip.month)}_${selectedPayslip.year}.pdf`)

      toast({ title: 'Downloaded!', description: 'Payslip PDF downloaded successfully.' })
    } catch (e: any) {
      toast({ title: 'Download Failed', description: e.message || 'Could not generate PDF', variant: 'destructive' })
    } finally {
      setIsDownloading(false)
    }
  }, [selectedPayslip, toast])

  // Stats
  const stats = useMemo(() => {
    const totalNet = payslips.reduce((acc: number, p: any) => acc + (p.net_pay || p.netPay || 0), 0)
    const generated = payslips.filter((p: any) => (p.status || '').toUpperCase() === 'GENERATED').length
    const paid = payslips.filter((p: any) => (p.status || '').toUpperCase() === 'PAID').length
    return { totalNet, generated, paid, total: payslips.length }
  }, [payslips])

  // Filtered payslips
  const filteredPayslips = useMemo(() => {
    return payslips.filter((p: any) => {
      const name = p.user?.full_name || p.user?.fullName || ''
      const email = p.user?.email || ''
      const matchesSearch = searchQuery === '' || name.toLowerCase().includes(searchQuery.toLowerCase()) || email.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === 'all' || (p.status || '').toUpperCase() === statusFilter.toUpperCase()
      return matchesSearch && matchesStatus
    })
  }, [payslips, searchQuery, statusFilter])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Payroll Management</h1>
          <p className="text-sm text-slate-500">Generate, review, and download employee payslips with detailed salary breakdowns.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-slate-200/80 shadow-sm bg-gradient-to-br from-white to-amber-50/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Payslips</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
                <p className="text-xs text-slate-400 mt-0.5">{getMonthName(parseInt(selectedMonth))} {selectedYear}</p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-amber-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-slate-200/80 shadow-sm bg-gradient-to-br from-white to-emerald-50/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Net Pay</p>
                <p className="text-2xl font-bold text-emerald-700 mt-1">{formatCurrency(stats.totalNet)}</p>
                <p className="text-xs text-slate-400 mt-0.5">Disbursement amount</p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-emerald-100 flex items-center justify-center">
                <IndianRupee className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-slate-200/80 shadow-sm bg-gradient-to-br from-white to-blue-50/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Generated</p>
                <p className="text-2xl font-bold text-blue-700 mt-1">{stats.generated}</p>
                <p className="text-xs text-slate-400 mt-0.5">Pending disbursement</p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-blue-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-slate-200/80 shadow-sm bg-gradient-to-br from-white to-violet-50/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Paid</p>
                <p className="text-2xl font-bold text-violet-700 mt-1">{stats.paid}</p>
                <p className="text-xs text-slate-400 mt-0.5">Successfully disbursed</p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-violet-100 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generate Section */}
      <Card className="border border-amber-200/60 shadow-sm bg-gradient-to-r from-amber-50/40 via-white to-orange-50/30">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-base font-bold text-slate-900">Generate Payslips</CardTitle>
          </div>
          <CardDescription className="text-xs text-slate-500">
            Select a month and year, then optionally choose a specific employee. Salary is computed from each employee's base salary profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-end gap-3">
            <div className="flex-1 min-w-[140px]">
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Month</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="h-9 text-xs border-slate-200"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                  {MONTHS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[110px]">
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Year</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="h-9 text-xs border-slate-200"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                  {YEARS.map((y) => <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Employee (Optional)</label>
              <Select value={genEmployeeId} onValueChange={setGenEmployeeId}>
                <SelectTrigger className="h-9 text-xs border-slate-200"><SelectValue placeholder="All Employees" /></SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                  <SelectItem value="all">All Employees</SelectItem>
                  {employees.map((emp: any) => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.fullName || emp.full_name || emp.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => generateMutation.mutate({
                month: selectedMonth,
                year: selectedYear,
                ...(genEmployeeId && genEmployeeId !== 'all' && { userId: genEmployeeId }),
              })}
              disabled={generateMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold h-9 text-xs px-5 shadow-sm"
            >
              {generateMutation.isPending ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-2 h-3.5 w-3.5" />}
              Generate Payslips
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payslips Table */}
      <Card className="border border-slate-200/80 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Payslips — {getMonthName(parseInt(selectedMonth))} {selectedYear}
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">{filteredPayslips.length} payslip(s) found</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Search by employee name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-9 text-xs bg-slate-50/50" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px] h-9 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="GENERATED">Generated</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/70 hover:bg-slate-50/70">
                <TableHead className="font-semibold text-slate-700">Employee</TableHead>
                <TableHead className="font-semibold text-slate-700">Period</TableHead>
                <TableHead className="font-semibold text-slate-700 text-right">Basic Pay</TableHead>
                <TableHead className="font-semibold text-slate-700 text-right">HRA</TableHead>
                <TableHead className="font-semibold text-slate-700 text-right">Deductions</TableHead>
                <TableHead className="font-semibold text-slate-700 text-right">Net Pay</TableHead>
                <TableHead className="font-semibold text-slate-700">Status</TableHead>
                <TableHead className="font-semibold text-slate-700 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-amber-600 mx-auto mb-2" />
                    <p className="text-xs text-slate-500">Loading payslips...</p>
                  </TableCell>
                </TableRow>
              ) : filteredPayslips.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-8 w-8 text-slate-300" />
                      <p className="text-sm text-slate-500 font-medium">No payslips found</p>
                      <p className="text-xs text-slate-400">Generate payslips for this period using the controls above.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayslips.map((payslip: any) => {
                  const deductions = (payslip.epf || 0) + (payslip.esi || 0) + (payslip.tds || 0) + (payslip.professionalTax || payslip.professional_tax || 0)
                  return (
                    <TableRow key={payslip.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => handleViewPayslip(payslip)}>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{payslip.user?.full_name || payslip.user?.fullName || 'Unknown'}</p>
                          <p className="text-xs text-slate-500">{payslip.user?.email || ''}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {getMonthName(payslip.month)} {payslip.year}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium text-sm text-slate-700">{formatCurrency(payslip.basic_pay || payslip.basicPay)}</TableCell>
                      <TableCell className="text-right font-medium text-sm text-slate-700">{formatCurrency(payslip.hra)}</TableCell>
                      <TableCell className="text-right font-medium text-sm text-rose-600">-{formatCurrency(deductions)}</TableCell>
                      <TableCell className="text-right">
                        <span className="font-bold text-sm text-emerald-700">{formatCurrency(payslip.net_pay || payslip.netPay)}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={(payslip.status || '').toUpperCase() === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50' : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50'}>
                          {payslip.status || 'GENERATED'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleViewPayslip(payslip) }} title="View Payslip">
                          <Eye className="h-4 w-4 text-amber-600" />
                        </Button>
                        {(payslip.status || '').toUpperCase() !== 'PAID' && (
                          <Button variant="ghost" size="icon" disabled={markPaidMutation.isPending} onClick={(e) => { e.stopPropagation(); markPaidMutation.mutate(payslip.id) }} title="Mark as Paid">
                            <CheckCircle className="h-4 w-4 text-emerald-600" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payslip Detail & Download Modal */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-[860px] bg-slate-100 border-slate-200 p-0 shadow-2xl overflow-hidden">
          <DialogTitle className="sr-only">Payslip Preview</DialogTitle>

          {/* Modal Toolbar */}
          <div className="flex items-center justify-between px-5 py-3.5 bg-white border-b border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Payslip Preview</p>
                <p className="text-xs text-slate-500">
                  {selectedPayslip && `${selectedPayslip.user?.full_name || selectedPayslip.user?.fullName || 'Employee'} · ${getMonthName(selectedPayslip.month)} ${selectedPayslip.year}`}
                </p>
              </div>
            </div>
            <Button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-8 text-xs px-4 gap-2"
            >
              {isDownloading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              {isDownloading ? 'Generating PDF...' : 'Download PDF'}
            </Button>
          </div>

          {/* Payslip Preview */}
          <div className="overflow-auto max-h-[80vh] p-6 flex justify-center">
            {selectedPayslip && (
              <div
                ref={payslipRef}
                className="shadow-2xl rounded-sm overflow-hidden"
                style={{ transform: 'scale(0.95)', transformOrigin: 'top center' }}
              >
                <PrintablePayslip payslip={selectedPayslip} companyLogo={logoImg} />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
