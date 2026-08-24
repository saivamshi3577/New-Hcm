import { useEffect } from 'react'
import { api, authApi, getToken, clearToken } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useUnreadStore } from '@/store/unreadStore'
import type { Role, UserProfile } from '@/types/user'
import { useToast } from '@/hooks/use-toast'

const mapDbRoleToInternalRole = (dbRoleName: string): Role => {
  if (!dbRoleName) return 'employee';
  const norm = dbRoleName.toLowerCase().replace(/[\s_-]+/g, '');
  if (norm === 'superadmin') return 'super_admin'
  if (norm === 'admin') return 'admin'
  if (norm === 'hr' || norm === 'hrmanager' || norm === 'humanresources') return 'hr'
  if (norm === 'teamlead' || norm === 'tl' || norm === 'manager') return 'team_lead'
  return 'employee'
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, setSession, setUser, setProfile, setLoading } = useAuthStore()
  const { toast } = useToast()

  // Check session on mount and resolve profile
  useEffect(() => {
    const resolveProfile = async (userId: string, email: string) => {
      try {
        // Fetch user profile from the Express API
        const { data, error } = await api.get(`/employee/${userId}`)
          .then((d: any) => ({ data: d, error: null }))
          .catch((err: any) => ({ data: null, error: err }))

        if (error) throw error

        if (data) {
          const empData = data.employee || data.user || data
          const rawRole = empData.role?.name || empData.role || ''
          const roleName: Role = mapDbRoleToInternalRole(String(rawRole))
          const resolvedFullName = empData.full_name || empData.fullName || empData.name || (user as any)?.fullName || (user as any)?.full_name || (email ? email.split('@')[0] : null)

          setProfile({
            ...empData,
            full_name: resolvedFullName,
            fullName: resolvedFullName,
            role: {
              ...(typeof empData.role === 'object' ? empData.role : {}),
              id: empData.role?.id || 'role_id',
              name: roleName,
              permissions: empData.role?.permissions || {}
            }
          } as unknown as UserProfile)
        } else {
          // Fallback for users without a profile record in the DB
          const fallbackRole: Role = 'employee'
          const resolvedFullName = (user as any)?.fullName || (user as any)?.full_name || (user as any)?.name || (email ? email.split('@')[0] : 'User')
          const mockProfile: UserProfile = {
            id: userId,
            email,
            full_name: resolvedFullName,
            avatar_url: null,
            role_id: null,
            department_id: null,
            team_id: null,
            created_at: new Date().toISOString(),
            role: {
              id: 'default',
              name: fallbackRole,
              permissions: {}
            }
          }
          setProfile(mockProfile)
        }
      } catch (err) {
        console.error('Error resolving user profile:', err)
        // Fallback to employee role (least privilege) on error
        const resolvedFullName = (user as any)?.fullName || (user as any)?.full_name || (user as any)?.name || (email ? email.split('@')[0] : 'User')
        setProfile({
          id: userId,
          email,
          full_name: resolvedFullName,
          avatar_url: null,
          role_id: null,
          department_id: null,
          team_id: null,
          created_at: new Date().toISOString(),
          role: {
            id: 'default',
            name: 'employee',
            permissions: {}
          }
        })
      }
    }

    // Check if we have a stored token and validate the session
    const initAuth = async () => {
      const token = getToken()
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const result = await authApi.me()
        if (result.user) {
          const userWithFullName = {
            ...result.user,
            full_name: result.user.full_name || result.user.fullName || result.user.name || (result.user.email ? result.user.email.split('@')[0] : 'User'),
            fullName: result.user.fullName || result.user.full_name || result.user.name,
          }
          setUser(userWithFullName)
          setSession({ access_token: token })
          await resolveProfile(result.user.id, result.user.email ?? '')
        }
      } catch (err: any) {
        console.error('Error verifying session:', err)
        const status = err?.status || err?.response?.status
        const isUnauthorized = status === 401 || status === 403 || err?.message?.includes('401') || err?.message?.includes('403') || err?.message?.includes('token')

        if (isUnauthorized || !useAuthStore.getState().user) {
          clearToken()
          setUser(null)
          setSession(null)
          setProfile(null)
        }
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [setSession, setUser, setProfile, setLoading])

  // Fetch unread counts when user is available
  useEffect(() => {
    if (!user) return
    useUnreadStore.getState().fetchCounts(user.id)
  }, [user])

  return <>{children}</>
}
