import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Role, UserProfile } from '@/types/user'
import type { Permission } from '@/config/permissions'
import { ROLE_PERMISSIONS } from '@/config/permissions'
import { clearToken } from '@/lib/api'

// Custom User type replacing Supabase's User
interface AppUser {
  id: string
  email: string
  [key: string]: any
}

// Custom Session type replacing Supabase's Session
interface AppSession {
  access_token: string
  [key: string]: any
}

interface AuthState {
  user: AppUser | null
  session: AppSession | null
  profile: UserProfile | null
  role: Role | null
  permissions: Permission[]
  isLoading: boolean
  setUser: (user: AppUser | null) => void
  setSession: (session: AppSession | null) => void
  setProfile: (profile: UserProfile | null) => void
  setLoading: (isLoading: boolean) => void
  logout: () => void
}

const dynamicAuthStorage = {
  getItem: (name: string): string | null => {
    return localStorage.getItem(name) || sessionStorage.getItem(name)
  },
  setItem: (name: string, value: string): void => {
    if (localStorage.getItem('auth_token')) {
      localStorage.setItem(name, value)
      sessionStorage.removeItem(name)
    } else {
      sessionStorage.setItem(name, value)
      localStorage.removeItem(name)
    }
  },
  removeItem: (name: string): void => {
    localStorage.removeItem(name)
    sessionStorage.removeItem(name)
  },
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      profile: null,
      role: null,
      permissions: [],
      isLoading: false,
      setUser: (user) => {
        if (!user) {
          set({ user: null })
          return
        }
        const uAny = user as any
        const resolvedFullName = uAny?.full_name || uAny?.fullName || uAny?.name || (uAny?.email ? uAny.email.split('@')[0] : null)
        set({
          user: {
            ...user,
            full_name: resolvedFullName,
            fullName: resolvedFullName || uAny?.fullName,
          }
        })
      },
      setSession: (session) => set({ session }),
      setProfile: (profile) => {
        let resolvedRole: Role = 'employee'
        if (profile) {
          const rawRole = typeof profile.role === 'object' ? profile.role?.name : profile.role
          const pAny = profile as any
          const norm = String(rawRole || pAny.role_name || pAny.roleName || pAny.role || '').toLowerCase().replace(/[\s_-]+/g, '')
          if (norm === 'superadmin') resolvedRole = 'super_admin'
          else if (norm === 'admin') resolvedRole = 'admin'
          else if (norm === 'hr' || norm === 'hrmanager' || norm === 'humanresources') resolvedRole = 'hr'
          else if (norm === 'teamlead' || norm === 'tl' || norm === 'manager') resolvedRole = 'team_lead'
          else resolvedRole = 'employee'
        }

        const pAny = profile as any
        const resolvedFullName = pAny?.full_name || pAny?.fullName || pAny?.name || null

        const normalizedProfile = profile ? {
          ...profile,
          full_name: resolvedFullName,
          fullName: resolvedFullName,
          role: typeof profile.role === 'object' && profile.role ? { ...profile.role, name: resolvedRole } : { id: 'default', name: resolvedRole, permissions: {} }
        } : null

        set({ 
          profile: normalizedProfile as unknown as UserProfile, 
          role: resolvedRole,
          permissions: ROLE_PERMISSIONS[resolvedRole] || []
        })
      },
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => {
        clearToken()
        localStorage.removeItem('auth-storage')
        sessionStorage.removeItem('auth-storage')
        set({
          user: null,
          session: null,
          profile: null,
          role: null,
          permissions: [],
          isLoading: false
        })
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => dynamicAuthStorage),
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        profile: state.profile,
        role: state.role,
        permissions: state.permissions,
      })
    }
  )
)
