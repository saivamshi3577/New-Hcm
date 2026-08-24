import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, role, isLoading } = useAuthStore()

  if (isLoading || (user && !role)) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-indigo-600 border-t-transparent" />
            <div className="absolute inset-0 h-10 w-10 animate-ping rounded-full border-[3px] border-indigo-600/20" />
          </div>
          <p className="text-sm font-medium text-slate-500 animate-pulse">Loading session...</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}
