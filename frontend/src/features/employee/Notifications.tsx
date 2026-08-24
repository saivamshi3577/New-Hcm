import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Bell, CheckCircle2, MessageSquare, ClipboardList,
  CheckCheck, Clock, Users, Briefcase, Loader2
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useUnreadStore } from '@/store/unreadStore'
import { api } from '@/lib/api'
import { useSearchParams, useNavigate } from 'react-router-dom'

interface DBNotification {
  id: string
  user_id: string
  type: string
  content: string
  is_read: boolean
  created_at: string
}

export default function Notifications() {
  const { user, role } = useAuthStore()
  const [notifications, setNotifications] = useState<DBNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const searchQuery = searchParams.get('search') || ''

  const filteredNotifications = notifications.filter(n =>
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const unreadCount = filteredNotifications.filter(n => !n.is_read).length

  const fetchNotifications = async () => {
    if (!user) return
    setLoading(true)
      try {
        const data: any = await api.get('/notifications?user_id=' + user.id + '&_sort=-created_at')
        if (data) {
          setNotifications(data)
        }
      } catch (err: any) {
      console.error('Error fetching notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  // Set up WebSocket / Real-time subscription (Currently polling/static, Socket.io needed later)
  useEffect(() => {
    if (!user) return

    fetchNotifications()
    useUnreadStore.getState().fetchCounts(user.id)

    return () => {}
  }, [user])

  const markAsRead = async (id: string) => {
    try {
      await api.delete('/notifications/' + id)

      // Update local state by removing the notification
      setNotifications(prev => prev.filter(n => n.id !== id))
      if (user) {
        await useUnreadStore.getState().fetchCounts(user.id)
      }
    } catch (err: any) {
      console.error('Error deleting notification:', err)
    }
  }

  const markAllRead = async () => {
    if (!user) return
    try {
      await api.delete('/notifications?user_id=' + user.id)

      setNotifications([])
      if (user) {
        await useUnreadStore.getState().fetchCounts(user.id)
      }
    } catch (err: any) {
      console.error('Error deleting all notifications:', err)
    }
  }

  const getNotificationRedirectPath = (noti: DBNotification) => {
    const portal = role === 'super_admin' ? 'super-admin' : role === 'admin' ? 'admin' : 'employee'
    switch (noti.type) {
      case 'chat_message':
        if (noti.content.includes('[room_id:')) {
          const roomId = noti.content.split('[room_id:')[1].replace(']', '')
          return `/${portal}/chat?room=${roomId}`
        }
        return `/${portal}/chat`
      case 'exam_assigned':
        return `/${portal}/skill-track`
      case 'task_assigned':
      case 'task_updated':
      case 'task_completed':
        return `/${portal}/tasks`
      case 'project_assigned':
        return role === 'admin' ? '/admin/projects' : `/${portal}/dashboard`
      case 'employee_assigned':
        return role === 'admin' ? '/admin/members' : `/${portal}/dashboard`
      default:
        return `/${portal}/dashboard`
    }
  }

  const handleNotificationClick = async (noti: DBNotification) => {
    if (!noti.is_read) {
      await markAsRead(noti.id)
    }

    const portal = role === 'super_admin' ? 'super-admin' : role === 'admin' ? 'admin' : 'employee'

    if (noti.type === 'chat_message') {
      // 1. Try to extract room_id directly
      const match = noti.content.match(/\[room_id:([^\]]+)\]/)
      if (match && match[1]) {
        navigate(`/${portal}/chat?room=${match[1]}`)
        return
      }

      // 2. Fallback: Parse sender name and find the DM room
      // Example content: "New message from John Doe in Direct Message" or "New message from John Doe in #general"
      const fromMatch = noti.content.match(/New message from (.+?) in (Direct Message|#.+?)/)
      if (fromMatch && fromMatch[1]) {
        const senderName = fromMatch[1].trim()
        const isGroup = fromMatch[2].startsWith('#')

        try {
          if (isGroup) {
            const groupName = fromMatch[2].replace('#', '').trim()
            // Find group room by name
            const roomsData: any = await api.get('/chat_rooms?name=' + encodeURIComponent(groupName) + '&type=group&_limit=1')

            if (roomsData && roomsData.length > 0) {
              navigate(`/${portal}/chat?room=${roomsData[0].id}`)
              return
            }
          } else {
            // Find user by full_name
            const usersData: any = await api.get('/employee?full_name=' + encodeURIComponent(senderName) + '&_limit=1')

            if (usersData && usersData.length > 0) {
              const otherUserId = usersData[0].id
              const sortedIds = [user!.id, otherUserId].sort()
              const dmRoomName = `dm-${sortedIds[0]}-${sortedIds[1]}`

              // Find or create DM room
              const roomsData: any = await api.get('/chat_rooms?name=' + encodeURIComponent(dmRoomName) + '&type=direct&_limit=1')

              if (roomsData && roomsData.length > 0) {
                navigate(`/${portal}/chat?room=${roomsData[0].id}`)
                return
              }
            }
          }
        } catch (err) {
          console.error('Error in fallback redirection:', err)
        }
      }

      // Default fallback if parsing fails
      navigate(`/${portal}/chat`)
      return
    }

    const redirectPath = getNotificationRedirectPath(noti)
    navigate(redirectPath)
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'task_assigned': return <ClipboardList className="h-4.5 w-4.5 text-violet-650" />
      case 'task_completed': return <CheckCircle2 className="h-4.5 w-4.5 text-emerald-650" />
      case 'task_updated': return <Clock className="h-4.5 w-4.5 text-amber-650" />
      case 'employee_assigned': return <Users className="h-4.5 w-4.5 text-teal-650" />
      case 'project_assigned': return <Briefcase className="h-4.5 w-4.5 text-indigo-650" />
      case 'chat_message': return <MessageSquare className="h-4.5 w-4.5 text-sky-650" />
      default: return <Bell className="h-4.5 w-4.5 text-slate-500" />
    }
  }

  const getIconBg = (type: string) => {
    switch (type) {
      case 'task_assigned': return 'bg-gradient-to-br from-violet-100 to-violet-50'
      case 'task_completed': return 'bg-gradient-to-br from-emerald-100 to-emerald-50'
      case 'task_updated': return 'bg-gradient-to-br from-amber-100 to-amber-50'
      case 'employee_assigned': return 'bg-gradient-to-br from-teal-100 to-teal-50'
      case 'project_assigned': return 'bg-gradient-to-br from-indigo-100 to-indigo-50'
      case 'chat_message': return 'bg-gradient-to-br from-sky-100 to-sky-50'
      default: return 'bg-gradient-to-br from-slate-100 to-slate-50'
    }
  }

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return 'Yesterday'
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const isTeamLead = role === 'admin'
  const isSuperAdmin = role === 'super_admin'

  const themeColors = {
    badge: isTeamLead
      ? 'bg-teal-50 text-teal-700 border-teal-200'
      : isSuperAdmin
        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
        : 'bg-violet-50 text-violet-700 border-violet-200',
    unreadBg: isTeamLead
      ? 'bg-teal-50/20 border-teal-100 hover:border-teal-200'
      : isSuperAdmin
        ? 'bg-indigo-50/20 border-indigo-100 hover:border-indigo-200'
        : 'bg-violet-50/20 border-violet-100 hover:border-violet-200',
    dot: isTeamLead
      ? 'bg-teal-500'
      : isSuperAdmin
        ? 'bg-indigo-500'
        : 'bg-violet-500',
    buttonOutline: isTeamLead
      ? 'hover:bg-teal-50/50 hover:text-teal-750 border-slate-200 text-slate-650'
      : isSuperAdmin
        ? 'hover:bg-indigo-50/50 hover:text-indigo-750 border-slate-200 text-slate-650'
        : 'hover:bg-violet-50/50 hover:text-violet-755 border-slate-200 text-slate-650'
  }

  // Employee-specific enhanced theme
  const isEmployee = role === 'employee'

  if (loading) {
    return (
      <div className="h-[calc(100vh-10rem)] flex items-center justify-center">
        <Loader2 className={`h-8 w-8 animate-spin ${isTeamLead ? 'text-teal-600' : isSuperAdmin ? 'text-indigo-600' : 'text-violet-600'}`} />
      </div>
    )
  }

  return (
    <div className="space-y-4 text-slate-800 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Notifications</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Stay updated with task assignments, comments, and project milestones.</p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <Badge variant="outline" className={`font-semibold px-2.5 py-1 ${themeColors.badge}`}>
              <Bell className="h-3 w-3 mr-1.5 animate-bounce" />
              {unreadCount} unread
            </Badge>
          )}
          <Button variant="outline" className={`text-xs font-semibold rounded-lg h-9 ${themeColors.buttonOutline}`} onClick={markAllRead}>
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark all read
          </Button>
        </div>
      </div>

      <Card className={`shadow-sm ${isEmployee ? 'glass-card-strong border-violet-100/30' : 'border-border/60'}`}>
        <CardHeader className={isEmployee ? 'pb-2 pt-3 px-4' : ''}>
          <CardTitle className="text-foreground text-base font-bold">Recent Activity</CardTitle>
          <CardDescription className="text-muted-foreground text-[10px] mt-0.5">All notifications from your team and assigned workflows.</CardDescription>
        </CardHeader>
        <CardContent className={`space-y-2 pb-4 ${isEmployee ? 'px-4' : 'pb-6'}`}>
          {filteredNotifications.length === 0 ? (
            <div className={`flex flex-col items-center justify-center text-muted-foreground py-14 text-center ${isEmployee ? 'glass-card rounded-2xl' : ''}`}>
              <div className={`${isEmployee ? 'h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-50 flex items-center justify-center mb-3' : 'mb-2'}`}>
                <Bell className={`${isEmployee ? 'h-6 w-6 text-violet-400' : 'h-10 w-10 text-muted/60 stroke-[1.5]'}`} />
              </div>
              <p className="text-sm font-semibold">No notifications</p>
              <p className="text-xs text-muted-foreground mt-0.5">We will let you know when new events occur or match your search.</p>
            </div>
          ) : (
            <div className={isEmployee ? 'stagger-children space-y-2' : 'space-y-2.5'}>
              {filteredNotifications.map((noti) => (
                <div
                  key={noti.id}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${noti.is_read
                      ? `${isEmployee ? 'glass-card' : 'bg-background'} border-border/40 hover:border-border/80 hover:bg-muted/30`
                      : `${themeColors.unreadBg} ${isEmployee && !noti.is_read ? 'unread-glow' : ''}`
                    } ${isEmployee ? 'hover-lift' : ''}`}
                  onClick={() => handleNotificationClick(noti)}
                >
                  <div className={`p-2 rounded-xl shrink-0 ${getIconBg(noti.type)}`}>
                    {getIcon(noti.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className={`text-sm ${noti.is_read ? 'text-slate-700 font-semibold' : 'text-slate-900 font-extrabold'}`}>
                        {noti.content.includes('[room_id:') ? noti.content.split(' [room_id:')[0] : noti.content}
                      </h4>
                      {!noti.is_read && (
                        <span className={`w-2 h-2 rounded-full shrink-0 ${themeColors.dot} ${isEmployee ? 'animate-pulse' : ''}`} />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1.5 font-semibold">{formatTime(noti.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
