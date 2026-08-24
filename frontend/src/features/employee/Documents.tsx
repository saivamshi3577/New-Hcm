import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  FileText, Upload, Trash2, Download, Search, Filter,
  Plus, X, Loader2, File, FileImage, FileCheck, Shield
} from 'lucide-react'
import { api, safeArray } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/hooks/use-toast'


interface DocumentItem {
  id: string
  title: string
  fileUrl: string
  file_url: string
  documentType: string
  document_type: string
  userId: string
  user_id: string
  createdAt: string
  created_at: string
  user?: {
    id: string
    fullName?: string
    full_name?: string
    email?: string
  }
}

const DOCUMENT_TYPES = [
  { value: 'ID_PROOF', label: 'ID Proof', icon: Shield, color: 'bg-blue-100 text-blue-700' },
  { value: 'OFFER_LETTER', label: 'Offer Letter', icon: FileCheck, color: 'bg-emerald-100 text-emerald-700' },
  { value: 'PAY_SLIP', label: 'Pay Slip', icon: FileText, color: 'bg-amber-100 text-amber-700' },
  { value: 'RESUME', label: 'Resume', icon: File, color: 'bg-violet-100 text-violet-700' },
  { value: 'CERTIFICATE', label: 'Certificate', icon: FileCheck, color: 'bg-pink-100 text-pink-700' },
  { value: 'PHOTO', label: 'Photo', icon: FileImage, color: 'bg-indigo-100 text-indigo-700' },
  { value: 'OTHER', label: 'Other', icon: File, color: 'bg-slate-100 text-slate-700' },
]

export default function Documents() {
  const { user, role } = useAuthStore()
  const { toast } = useToast()
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [uploading, setUploading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)

  // Upload form state
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadUrl, setUploadUrl] = useState('')
  const [uploadType, setUploadType] = useState('OTHER')

  const accentColor = role === 'team_lead' ? 'teal' : role === 'hr' ? 'amber' : role === 'admin' ? 'cyan' : 'violet'

  const fetchDocuments = async () => {
    setLoading(true)
    try {
      const res: any = await api.get('/document')
      setDocuments(safeArray(res, 'documents'))
    } catch (err: any) {
      console.error('Error fetching documents:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDocuments() }, [])

  const handleUpload = async () => {
    if (!uploadTitle.trim() || !uploadUrl.trim()) {
      toast({ title: 'Missing Fields', description: 'Please fill title and URL', variant: 'destructive' })
      return
    }
    setUploading(true)
    try {
      await api.post('/document', {
        title: uploadTitle.trim(),
        fileUrl: uploadUrl.trim(),
        documentType: uploadType,
      })
      toast({ title: '✅ Document Uploaded', description: `"${uploadTitle}" saved successfully` })
      setShowUploadModal(false)
      setUploadTitle('')
      setUploadUrl('')
      setUploadType('OTHER')
      await fetchDocuments()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Upload failed', variant: 'destructive' })
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (docId: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    setDeleteLoading(docId)
    try {
      await api.delete(`/document/${docId}`)
      toast({ title: 'Deleted', description: `"${title}" removed` })
      await fetchDocuments()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Delete failed', variant: 'destructive' })
    } finally {
      setDeleteLoading(null)
    }
  }

  const getDocTypeMeta = (type: string) => {
    return DOCUMENT_TYPES.find(d => d.value === type) || DOCUMENT_TYPES[DOCUMENT_TYPES.length - 1]
  }

  const filteredDocs = documents.filter(d => {
    const matchSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.user?.full_name || d.user?.fullName || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchType = typeFilter === 'ALL' || (d.document_type || d.documentType) === typeFilter
    return matchSearch && matchType
  })

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className={`h-8 w-8 animate-spin text-${accentColor}-600`} />
          <p className="text-sm font-medium text-slate-500">Loading documents...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 fade-in duration-500 text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-950">My Documents</h1>
          <p className="text-slate-500 mt-0.5 text-sm">Upload and manage your personal documents securely.</p>
        </div>
        <Button
          className={`bg-${accentColor}-600 hover:bg-${accentColor}-700 text-white font-bold text-xs shadow-sm`}
          onClick={() => setShowUploadModal(true)}
        >
          <Upload className="h-3.5 w-3.5 mr-1.5" /> Upload Document
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 md:grid-cols-4">
        {[
          { label: 'Total Documents', value: documents.length, color: 'from-slate-400 to-slate-500' },
          { label: 'ID Proofs', value: documents.filter(d => (d.document_type || d.documentType) === 'ID_PROOF').length, color: 'from-blue-500 to-indigo-500' },
          { label: 'Certificates', value: documents.filter(d => (d.document_type || d.documentType) === 'CERTIFICATE').length, color: 'from-pink-500 to-rose-500' },
          { label: 'Letters', value: documents.filter(d => (d.document_type || d.documentType) === 'OFFER_LETTER').length, color: 'from-emerald-500 to-teal-500' },
        ].map((stat, i) => (
          <Card key={i} className="bg-white border-slate-200 shadow-sm">
            <CardContent className="flex items-center gap-3 py-4 px-5">
              <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                <FileText className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-950">{stat.value}</p>
                <p className="text-[11px] text-slate-500 font-medium">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm bg-white border-slate-200"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className={`bg-white border border-slate-200 text-slate-900 text-xs rounded-lg px-3 py-2 font-semibold focus:outline-none focus:ring-1 focus:ring-${accentColor}-500`}
          >
            <option value="ALL">All Types</option>
            {DOCUMENT_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Documents Grid */}
      {filteredDocs.length === 0 ? (
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-14 w-14 text-slate-300 mb-3" />
            <p className="text-base font-bold text-slate-500">No documents found</p>
            <p className="text-sm text-slate-400 mt-1">
              {searchQuery || typeFilter !== 'ALL' ? 'Try adjusting your filters' : 'Upload your first document to get started'}
            </p>
            <Button
              className={`mt-4 bg-${accentColor}-600 hover:bg-${accentColor}-700 text-white text-xs font-bold`}
              onClick={() => setShowUploadModal(true)}
            >
              <Upload className="h-3.5 w-3.5 mr-1.5" /> Upload Document
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDocs.map((doc) => {
            const docType = doc.document_type || doc.documentType || 'OTHER'
            const meta = getDocTypeMeta(docType)
            const fileUrl = doc.file_url || doc.fileUrl
            const createdAt = doc.created_at || doc.createdAt

            return (
              <Card key={doc.id} className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 group">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`h-11 w-11 rounded-xl ${meta.color.split(' ')[0]} flex items-center justify-center shrink-0`}>
                      <meta.icon className={`h-5 w-5 ${meta.color.split(' ')[1]}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 truncate">{doc.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`${meta.color} border-0 text-[9px] font-bold`}>{meta.label}</Badge>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                        {createdAt ? new Date(createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        {doc.user && ` · ${doc.user.full_name || doc.user.fullName || doc.user.email}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                    {fileUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[10px] font-semibold h-7 flex-1"
                        onClick={() => window.open(fileUrl, '_blank')}
                      >
                        <Download className="h-3 w-3 mr-1" /> View
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-[10px] font-semibold h-7 text-rose-600 border-rose-200 hover:bg-rose-50"
                      disabled={deleteLoading === doc.id}
                      onClick={() => handleDelete(doc.id, doc.title)}
                    >
                      {deleteLoading === doc.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowUploadModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Upload Document</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Document Title *</label>
                <Input
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Aadhar Card, Offer Letter"
                  className="h-10 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">File URL *</label>
                <Input
                  value={uploadUrl}
                  onChange={(e) => setUploadUrl(e.target.value)}
                  placeholder="https://drive.google.com/... or Cloudinary URL"
                  className="h-10 text-sm"
                />
                <p className="text-[10px] text-slate-400 mt-1">Paste a link to a cloud-hosted file (Google Drive, Dropbox, Cloudinary, etc.)</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Document Type</label>
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value)}
                  className={`w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-lg px-3 py-2.5 font-medium focus:outline-none focus:ring-1 focus:ring-${accentColor}-500`}
                >
                  {DOCUMENT_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowUploadModal(false)} className="text-xs font-semibold">
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={uploading || !uploadTitle.trim() || !uploadUrl.trim()}
                className={`bg-${accentColor}-600 hover:bg-${accentColor}-700 text-white text-xs font-bold`}
              >
                {uploading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Upload className="h-3 w-3 mr-1" />}
                Upload
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
