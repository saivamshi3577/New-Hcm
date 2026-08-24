import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Megaphone, Pin, Plus, Edit2, Trash2, Loader2, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, safeArray } from '@/lib/api'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

const toDatetimeLocal = (isoString: string | null | undefined) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  if (isNaN(date.getTime())) return ''
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`
}

const toDateLocal = (isoString: string | null | undefined) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  if (isNaN(date.getTime())) return ''
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const announcementSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  content: z.string().min(10, 'Content must be at least 10 characters.'),
  pinned: z.boolean(),
  event_date: z.string().optional().nullable().or(z.literal('')),
  expiry_date: z.string().optional().nullable().or(z.literal('')),
})

type FormValues = z.infer<typeof announcementSchema>

const EMOJI_LIST = ['👍', '❤️', '😄', '🎉', '💡', '👏', '🙌', '🔥', '🚀', '😢', '😮', '🤝']

export default function Announcements() {
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const form = useForm<FormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: { title: '', content: '', pinned: false, event_date: '', expiry_date: '' },
  })

  const { data: rawAnnouncements, isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      try {
        const data: any = await api.get('/announcements?_sort=-pinned,-created_at')
        return safeArray(data, 'announcements')
      } catch (error) { return [] }
    }
  })

  // Fetch all reactions with user names for super admin dashboard
  const { data: rawReactionsList } = useQuery({
    queryKey: ['announcement-reactions-admin'],
    queryFn: async () => {
      try {
        const data: any = await api.get('/announcement_reactions?_select=id,announcement_id,emoji,user_id,users:user_id(full_name)')
        return safeArray(data, 'reactions')
      } catch (error) { return [] }
    }
  })

  const announcements = safeArray(rawAnnouncements)
  const reactionsList = safeArray(rawReactionsList)

  const saveMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = {
        ...values,
        event_date: values.event_date || null,
        expiry_date: values.expiry_date || null,
      }
      if (editingId) {
        try { await api.put('/announcements/' + editingId, payload) } catch(error) { throw error }
      } else {
        try { await api.post('/announcements', payload) } catch(error) { throw error }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
      setIsOpen(false)
      setEditingId(null)
      form.reset()
      toast({ title: "Success", description: `Announcement ${editingId ? 'updated' : 'created'}.` })
    },
    onError: (error: any) => {
      toast({ title: "Failed", description: error.message, variant: "destructive" })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      try { await api.delete('/announcements/' + id) } catch (error) { throw error }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
      toast({ title: "Deleted", description: "Announcement removed." })
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete", description: error.message, variant: "destructive" })
    }
  })

  const openEdit = (ann: any) => {
    setEditingId(ann.id)
    form.reset({ 
      title: ann.title, 
      content: ann.content, 
      pinned: ann.pinned,
      event_date: toDatetimeLocal(ann.event_date),
      expiry_date: toDateLocal(ann.expiry_date)
    })
    setIsOpen(true)
  }

  const openCreate = () => {
    setEditingId(null)
    form.reset({ 
      title: '', 
      content: '', 
      pinned: false,
      event_date: '',
      expiry_date: ''
    })
    setIsOpen(true)
  }

  return (
    <div className="space-y-5 sa-page-enter text-slate-800">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight sa-gradient-text">Company Announcements</h2>
          <p className="text-slate-400 mt-0.5 text-sm">Broadcast important notifications, compliance updates, and news to the workspace.</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={(val) => {
          setIsOpen(val)
          if (!val) { setEditingId(null); form.reset(); }
        }}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="sa-btn-primary h-9 px-4">
              <Plus className="mr-2 h-4 w-4" />
              Broadcast Announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-white/95 backdrop-blur-xl border-slate-200/80">
            <DialogHeader>
              <DialogTitle className="font-bold">{editingId ? 'Edit Announcement' : 'Broadcast Announcement'}</DialogTitle>
              <DialogDescription>Draft a message to share with all workspace members.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-slate-700">Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Quarterly All-Hands Meeting" className="h-9 text-sm" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-slate-700">Message Content</FormLabel>
                      <FormControl>
                        <textarea 
                          className="flex min-h-[100px] w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="Type your message here..." 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pinned"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border border-slate-200/80 p-3 bg-slate-50/40">
                      <FormControl>
                        <input type="checkbox" checked={field.value} onChange={field.onChange} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                      </FormControl>
                      <div className="space-y-0.5 leading-none">
                        <FormLabel className="text-sm font-medium">Pin to top</FormLabel>
                        <p className="text-xs text-slate-400">Keep this announcement at the top of the dashboard.</p>
                      </div>
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="event_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-slate-700">Event Date & Time (Optional)</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" className="h-9 text-sm" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="expiry_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-slate-700">Expiry Date (Optional)</FormLabel>
                        <FormControl>
                          <Input type="date" className="h-9 text-sm" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={saveMutation.isPending} className="sa-btn-primary h-9 px-4">
                    {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingId ? 'Save Changes' : 'Broadcast'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-7 w-7 animate-spin text-indigo-500" />
          </div>
        ) : !announcements || announcements.length === 0 ? (
          <div className="text-center p-8 sa-card border-dashed text-slate-400 text-sm">
            No announcements yet.
          </div>
        ) : (
          announcements.map((ann) => {
            const reactionsForAnn = reactionsList?.filter((r: any) => r.announcement_id === ann.id) || []
            const groupedReactions = EMOJI_LIST.map(emoji => {
              const reactionsWithEmoji = reactionsForAnn.filter((r: any) => r.emoji === emoji)
              const names = reactionsWithEmoji.map((r: any) => r.users?.full_name || 'Unknown').join(', ')
              return {
                emoji,
                count: reactionsWithEmoji.length,
                names
              }
            }).filter(r => r.count > 0)

            return (
              <div key={ann.id} className={`sa-card transition-all relative hover:z-30 ${ann.pinned ? 'ring-1 ring-indigo-200/50' : ''}`}>
                {ann.pinned && <div className="h-0.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 rounded-t-xl" />}
                <div className="p-4 pb-3 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="sa-icon-box w-7 h-7 rounded-lg">
                        <Megaphone className="h-3.5 w-3.5 text-indigo-600" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-800">{ann.title}</h3>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 ml-9">
                      Posted on {new Date(ann.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2 ml-9">
                      {ann.event_date && (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                          <Calendar className="h-3 w-3 text-emerald-600 animate-pulse" />
                          Event: {new Date(ann.event_date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                      )}
                      {ann.expiry_date && (
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${new Date(ann.expiry_date) < new Date() 
                          ? 'bg-rose-50 text-rose-700 border-rose-200' 
                          : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                          {new Date(ann.expiry_date) < new Date() ? '🔴 Expired' : '⏳ Expires'}: {new Date(ann.expiry_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {ann.pinned && (
                      <span className="sa-badge text-[10px] px-2 py-0.5 flex items-center gap-1">
                        <Pin className="h-2.5 w-2.5" /> Pinned
                      </span>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => openEdit(ann)} className="h-7 w-7 p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => {
                      if(confirm('Are you sure you want to delete this announcement?')) {
                        deleteMutation.mutate(ann.id)
                      }
                    }} className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="px-4 pb-4 ml-9">
                  <p className="text-slate-500 text-sm leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                  
                  {/* Reactions Summary */}
                  {groupedReactions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                      {groupedReactions.map(reaction => {
                        const reactorsList = reaction.names ? reaction.names.split(', ') : []
                        const numColsClass = reactorsList.length > 12 
                          ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4' 
                          : reactorsList.length > 6 
                          ? 'grid-cols-2 sm:grid-cols-3' 
                          : reactorsList.length > 3 
                          ? 'grid-cols-2' 
                          : 'grid-cols-1'

                        return (
                          <div
                            key={reaction.emoji}
                            className="relative group/reactor"
                          >
                            <span
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200/60 text-xs font-extrabold text-slate-700 shadow-sm cursor-pointer hover:bg-indigo-50/50 hover:border-indigo-200 transition-all duration-200"
                            >
                              <span>{reaction.emoji}</span>
                              <span className="text-slate-800">{reaction.count}</span>
                            </span>

                            {/* Premium Hover Card for Reactors (opens below) */}
                            <div className="absolute top-full left-0 mt-2 w-max max-w-[calc(100vw-3rem)] sm:max-w-2xl bg-white border border-slate-200 p-3.5 rounded-2xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_1px_3px_rgba(0,0,0,0.03)] z-50 opacity-0 pointer-events-none group-hover/reactor:opacity-100 group-hover/reactor:pointer-events-auto transition-all duration-200 transform translate-y-1 group-hover/reactor:translate-y-0 text-left">
                              <div className="absolute bottom-full left-4 w-2.5 h-2.5 bg-white border-l border-t border-slate-200 rotate-45 translate-y-[6px]" />
                              <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5 select-none">
                                <span className="text-sm">{reaction.emoji}</span>
                                <span>Reacted By ({reactorsList.length})</span>
                              </div>
                              <div className={`grid ${numColsClass} gap-x-4 gap-y-1.5 max-h-60 overflow-y-auto pr-1`}>
                                {reactorsList.map((name, idx) => (
                                  <div key={idx} className="flex items-center gap-2 py-0.5 px-1 hover:bg-slate-50 rounded-md transition-colors w-36 min-w-0">
                                    <div className="w-5.5 h-5.5 rounded-full bg-gradient-to-br from-indigo-50 to-indigo-100/50 text-indigo-700 flex items-center justify-center text-[10px] font-extrabold border border-indigo-200/30 flex-shrink-0">
                                      {name.charAt(0)}
                                    </div>
                                    <span className="text-xs font-semibold text-slate-700 truncate">{name}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
