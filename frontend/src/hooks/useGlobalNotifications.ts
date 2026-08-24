import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { sendNativeNotification, requestNotificationPermission } from '@/utils/notifications'
import { useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'

/**
 * useGlobalNotifications
 * 
 * Previously used Supabase Realtime (postgres_changes) to listen for live
 * notifications, announcements, and break status changes.
 
 * This hook now uses polling as a temporary replacement.

 */

export function useGlobalNotifications() {
  const { user, role } = useAuthStore()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  useEffect(() => {
    if (!user) return

    // Request notification permission on mount
    requestNotificationPermission()

    // Poll for new notifications every 30 seconds
    const pollInterval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['employee-announcements'] })
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
      if (role === 'super_admin') {
        queryClient.invalidateQueries({ queryKey: ['employees-full'] })
      }
    }, 30_000)

    return () => {
      clearInterval(pollInterval)
    }
  }, [user, role, queryClient, toast])
}
