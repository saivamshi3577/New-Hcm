import { useNavigate } from 'react-router-dom'
import { ShieldX, ArrowLeft, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/authStore'
import { ROLE_CONFIGS } from '@/config/roleConfig'
import { clearToken } from '@/lib/api'

export default function Forbidden() {
  const navigate = useNavigate()
  const { role, logout } = useAuthStore()

  const handleGoBack = () => {
    if (role && ROLE_CONFIGS[role]) {
      navigate(ROLE_CONFIGS[role].defaultRoute, { replace: true })
    } else {
      navigate('/login', { replace: true })
    }
  }

  const handleSignOut = async () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-red-50/30">
      <div className="text-center max-w-md px-6">
        {/* Animated icon */}
        <div className="relative mx-auto w-24 h-24 mb-8">
          <div className="absolute inset-0 rounded-full bg-red-100 animate-ping opacity-20" />
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-red-50 to-red-100 border border-red-200 flex items-center justify-center shadow-lg shadow-red-100/50">
            <ShieldX className="h-10 w-10 text-red-500" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white border border-red-200 flex items-center justify-center shadow-md">
            <Lock className="h-4 w-4 text-red-400" />
          </div>
        </div>

        {/* Text content */}
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-3">
          Access Denied
        </h1>
        <p className="text-lg text-slate-500 mb-2">
          Error 403 — Forbidden
        </p>
        <p className="text-sm text-slate-400 mb-8 leading-relaxed">
          You don't have the required permissions to access this page.
          This area is restricted to authorized personnel only.
        </p>

        {/* Action button */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Button
            onClick={handleGoBack}
            className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-6 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return to Dashboard
          </Button>
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="border-slate-300 text-slate-700 hover:bg-slate-100 font-medium px-6 py-2.5 rounded-lg transition-all duration-200"
          >
            Sign Out
          </Button>
        </div>

        {/* Decorative footer */}
        <p className="mt-12 text-xs text-slate-300 font-medium">
          FUSION TASK MANAGEMENT • RBAC ENFORCED
        </p>
      </div>
    </div>
  )
}
