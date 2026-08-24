import { create } from 'zustand'
import { api } from '@/lib/api'

interface UnreadState {
  unreadNotificationsCount: number
  unreadMessagesCount: number
  unreadExamsCount: number
  activeChatRoomId: string | null
  
  setUnreadNotificationsCount: (count: number) => void
  setUnreadMessagesCount: (count: number) => void
  setUnreadExamsCount: (count: number) => void
  setActiveChatRoomId: (roomId: string | null) => void
  
  fetchCounts: (userId: string) => Promise<void>
}

export const useUnreadStore = create<UnreadState>((set) => ({
  unreadNotificationsCount: 0,
  unreadMessagesCount: 0,
  unreadExamsCount: 0,
  activeChatRoomId: null,
  
  setUnreadNotificationsCount: (count) => set({ unreadNotificationsCount: count }),
  setUnreadMessagesCount: (count) => set({ unreadMessagesCount: count }),
  setUnreadExamsCount: (count) => set({ unreadExamsCount: count }),
  setActiveChatRoomId: (roomId) => {
    set({ activeChatRoomId: roomId })
  },
  
  fetchCounts: async (userId) => {
    if (!userId) return
    try {
      // Fetch unread counts from Express API
      // TODO: Implement /api/notifications/unread-count and /api/skill-track/unsubmitted-count endpoints
      const counts = await api.get(`/employee/${userId}/unread-counts`).catch(() => ({
        notifications: 0,
        messages: 0,
        exams: 0,
      }))

      set({
        unreadNotificationsCount: counts.notifications || 0,
        unreadMessagesCount: counts.messages || 0,
        unreadExamsCount: counts.exams || 0,
      })
    } catch (err) {
      console.error('Error fetching unread counts in store:', err)
    }
  }
}))
