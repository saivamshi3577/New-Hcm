import { Navigate, Outlet } from 'react-router-dom'
import { usePermissions } from '@/hooks/usePermissions'
import type { Role } from '@/types/user'
import { useAuthStore } from '@/store/authStore'

interface RoleGuardProps {
  allowedRoles: Role[]
  children?: React.ReactNode
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { user, role, isLoading } = useAuthStore()
  const { hasRole } = usePermissions()

  if (isLoading || (user && !role)) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-indigo-600 border-t-transparent" />
          </div>
          <p className="text-sm font-medium text-slate-500">Verifying credentials...</p>
        </div>
      </div>
    )
  }

  if (!role) {
    return <Navigate to="/login" replace />
  }

  if (!hasRole(allowedRoles)) {
    // Redirect unauthorized user to 403 page
    return <Navigate to="/forbidden" replace />
  }

  return children ? <>{children}</> : <Outlet />
}
