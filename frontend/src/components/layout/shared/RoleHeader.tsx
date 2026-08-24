import { useMemo } from 'react'
import { Bell, Search, Menu } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { RoleSidebar } from './RoleSidebar'
import type { Role } from '@/types/user'
import { ROLE_CONFIGS } from '@/config/roleConfig'
import { useAuthStore } from '@/store/authStore'
import { useUnreadStore } from '@/store/unreadStore'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'

interface RoleHeaderProps {
  role: Role
}

export function RoleHeader({ role }: RoleHeaderProps) {
  const config = ROLE_CONFIGS[role]
  const { user, profile } = useAuthStore()
  const { unreadNotificationsCount } = useUnreadStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const isSA = role === 'super_admin'

  const userDisplayName = useMemo(() => {
    const p = profile as any
    const u = user as any
    const candidate = p?.full_name || p?.fullName || p?.name || u?.fullName || u?.full_name || u?.name || u?.user_metadata?.full_name || u?.user_metadata?.name || u?.user_metadata?.fullName
    if (candidate && typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim()
    }

    const emailToParse = u?.email || profile?.email || ''
    if (emailToParse && emailToParse.includes('@')) {
      const prefix = emailToParse.split('@')[0].trim()
      if (prefix) {
        const formatted = prefix
          .replace(/[._-]+/g, ' ')
          .split(' ')
          .filter(Boolean)
          .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ')
          .trim()
        if (formatted) return formatted
      }
    }

    if (role === 'super_admin') return 'Super Admin'
    if (role === 'admin') return 'Admin'
    if (role === 'hr') return 'HR Manager'
    if (role === 'team_lead') return 'Team Lead'
    return 'Employee'
  }, [profile, user, role])

  const searchQuery = searchParams.get('search') || ''
  const pathname = location.pathname

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const newParams = new URLSearchParams(searchParams)
    if (value) {
      newParams.set('search', value)
    } else {
      newParams.delete('search')
    }
    setSearchParams(newParams)
  }

  const handleNotificationClick = () => {
    if (role === 'admin') {
      navigate('/admin/notifications')
    } else if (role === 'employee') {
      navigate('/employee/notifications')
    }
  }

  const getSearchPlaceholder = () => {
    if (pathname.includes('/skill-track')) {
      return 'Search skill assessments...'
    }
    if (pathname.includes('/notifications')) {
      return 'Search notifications...'
    }
    if (pathname.includes('/tasks')) {
      return 'Search assigned tasks...'
    }
    if (pathname.includes('/projects')) {
      return 'Search managed projects...'
    }
    if (pathname.includes('/members')) {
      return 'Search squad members...'
    }

    switch (role) {
      case 'super_admin':
        return 'Search employees, admins, or departments...'
      case 'admin':
        return 'Search tasks, projects, or team members...'
      case 'employee':
      default:
        return 'Search my tasks or documents...'
    }
  }

  const roleBadgeColors: Record<Role, string> = {
    super_admin: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    admin: 'bg-blue-50 text-blue-700 border-blue-200',
    hr: 'bg-amber-50 text-amber-700 border-amber-200',
    team_lead: 'bg-teal-50 text-teal-700 border-teal-200',
    employee: 'bg-violet-50 text-violet-700 border-violet-200',
  }

  return (
    <header className={`${isSA ? 'h-[52px]' : 'h-14'} ${isSA ? 'bg-white/70 backdrop-blur-xl border-b border-indigo-100/50' : 'bg-white/80 backdrop-blur-md border-b border-border/60'} flex items-center justify-between px-4 sm:px-6 z-10 sticky top-0`}>
      <div className="flex items-center flex-1">
        {/* Mobile hamburger */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden text-slate-500 hover:text-slate-900">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation Menu</SheetTitle>
            </SheetHeader>
            <RoleSidebar role={role} className="w-full h-full" />
          </SheetContent>
        </Sheet>

        {/* Search bar */}
        <div className="hidden md:flex ml-4 w-full max-w-md relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${isSA ? 'text-indigo-400' : 'text-slate-400'}`} />
          <Input
            type="search"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder={getSearchPlaceholder()}
            className={`w-full pl-9 ${isSA ? 'sa-search-input' : 'bg-muted/50 border-transparent hover:bg-muted focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:bg-transparent focus-visible:border-primary/30'} rounded-lg h-9 text-sm transition-all shadow-none`}
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Role badge */}
        {isSA ? (
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full sa-badge">
            <span className="sa-status-dot" />
            {config.displayName}
          </div>
        ) : (
          <div className={`hidden sm:flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${roleBadgeColors[role]}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              role === 'admin' ? 'bg-blue-600' : 'bg-violet-500'
            }`} />
            {config.displayName}
          </div>
        )}

        {/* Notification bell */}
        {role !== 'super_admin' && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleNotificationClick}
            className="relative text-slate-500 hover:text-slate-900 transition-colors h-9 w-9"
          >
            <Bell className="h-[18px] w-[18px]" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-red-500 border border-white text-[9px] font-bold text-white flex items-center justify-center px-1">
                {unreadNotificationsCount}
              </span>
            )}
          </Button>
        )}

        <div className={`h-6 w-px ${isSA ? 'bg-indigo-200/40' : 'bg-slate-200'} hidden sm:block`} />

        {/* User info */}
        <div className="hidden sm:flex items-center gap-2">
          <div className="text-right">
            <p className="text-xs font-semibold text-slate-900 leading-none" title={userDisplayName}>
              {userDisplayName}
            </p>
            <p className={`text-[10px] ${isSA ? 'text-indigo-400' : 'text-slate-400'} font-medium mt-0.5`}>
              {config.portalLabel}
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
