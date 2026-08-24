import { useMemo, Fragment } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LogOut, Building, ShieldCheck, Sparkles } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api, safeArray, clearToken } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuthStore } from '@/store/authStore'
import { useUnreadStore } from '@/store/unreadStore'
import { usePermissions } from '@/hooks/usePermissions'
import { ROLE_CONFIGS, type NavItem } from '@/config/roleConfig'
import type { Role } from '@/types/user'
import logoImg from '@/assets/logo.png'

interface RoleSidebarProps {
  role: Role
  className?: string
}

export function RoleSidebar({ role, className }: RoleSidebarProps) {
  const location = useLocation()
  const { user, profile, logout } = useAuthStore()
  const { unreadNotificationsCount, unreadExamsCount } = useUnreadStore()
  const { hasPermission } = usePermissions()
  const config = ROLE_CONFIGS[role]
  const isSA = role === 'super_admin'

  const { data: rawCompanies } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      try {
        const res = await api.get('/companies')
        const remote = safeArray(res, 'companies')
        try {
          localStorage.setItem('st_companies', JSON.stringify(remote))
        } catch (e) {}
        return remote
      } catch (e) {
        try {
          return JSON.parse(localStorage.getItem('st_companies') || '[]')
        } catch (err) {}
        return []
      }
    }
  })

  const companyLogo = useMemo<string>(() => {
    // 0. Super Admin portal ALWAYS displays the official Super Admin platform logo
    if (isSA) {
      return logoImg
    }

    try {
      // 1. Direct profile / user metadata company logo
      const prof = profile as any
      if (prof?.company_logo || prof?.company_logo_url || prof?.logo_url) {
        const direct = prof.company_logo || prof.company_logo_url || prof.logo_url
        if (typeof direct === 'string' && direct.trim()) return direct.trim()
      }
      if ((user as any)?.company_logo || (user as any)?.user_metadata?.company_logo) {
        const direct = (user as any).company_logo || (user as any).user_metadata?.company_logo
        if (typeof direct === 'string' && direct.trim()) return direct.trim()
      }

      // 2. Direct email / domain-specific localStorage overrides
      if (user?.email) {
        const emailLower = user.email.toLowerCase().trim()
        const userDomain = emailLower.includes('@') ? emailLower.split('@')[1] : ''
        
        const emailLogo = localStorage.getItem('company_logo_' + emailLower)
        if (emailLogo && typeof emailLogo === 'string' && emailLogo.trim()) return emailLogo.trim()

        if (userDomain) {
          const domainLogo = localStorage.getItem('company_logo_' + userDomain)
          if (domainLogo && typeof domainLogo === 'string' && domainLogo.trim()) return domainLogo.trim()
        }
      }

      // 3. Stored company logo in localStorage
      const directLocalLogo = localStorage.getItem('latest_company_logo') || 
                              localStorage.getItem('company_logo') || 
                              localStorage.getItem('company_logo_url') || 
                              localStorage.getItem('st_company_logo')
      if (directLocalLogo && typeof directLocalLogo === 'string' && directLocalLogo.trim()) {
        return directLocalLogo.trim()
      }

      // 4. Stored companies in localStorage and remote API
      const companies = safeArray(rawCompanies)
      let local: any[] = []
      try {
        local = JSON.parse(localStorage.getItem('st_companies') || '[]')
      } catch (e) {}

      const allCompanies = [...companies, ...local]

      // Filter companies that have a valid uploaded logo
      const companiesWithLogo = allCompanies.filter((c: any) => {
        const l = c?.logo_url || c?.logoUrl || c?.logo || c?.company_logo
        return typeof l === 'string' && l.trim().length > 0
      })

      if (user?.email) {
        const emailLower = user.email.toLowerCase().trim()
        const userDomain = emailLower.includes('@') ? emailLower.split('@')[1] : ''

        // Match by Admin Email or Official Email with a logo
        let found = companiesWithLogo.find((c: any) => 
          (c.admin_email && c.admin_email.toLowerCase().trim() === emailLower) ||
          (c.official_email && c.official_email.toLowerCase().trim() === emailLower)
        )

        // Match by Domain with a logo
        if (!found && userDomain && !['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'].includes(userDomain)) {
          found = companiesWithLogo.find((c: any) => {
            if (!c.domain) return false
            const cDom = c.domain.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].trim()
            return userDomain === cDom || userDomain.includes(cDom) || cDom.includes(userDomain)
          })
        }

        // Match by ID / admin_id / company_id
        if (!found) {
          const userCompanyId = (profile as any)?.company_id || (user as any)?.company_id
          found = companiesWithLogo.find((c: any) => 
            c.id === user.id || 
            c.admin_id === user.id || 
            (userCompanyId && c.id === userCompanyId)
          )
        }

        // Match by Department / Company Name
        if (!found && profile?.department) {
          const deptStr = typeof profile.department === 'string' ? profile.department : (profile.department as any)?.name || ''
          const deptLower = deptStr.toLowerCase()
          if (deptLower) {
            found = companiesWithLogo.find((c: any) => c.name && (deptLower.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(deptLower)))
          }
        }

        if (found) {
          const logo = found.logo_url || found.logoUrl || found.logo || found.company_logo
          if (logo && typeof logo === 'string' && logo.trim()) {
            return logo.trim()
          }
        }
      }

      // Pick the most recent company logo uploaded by Super Admin
      if (companiesWithLogo.length > 0) {
        const chosen = companiesWithLogo[0]
        const logo = chosen.logo_url || chosen.logoUrl || chosen.logo || chosen.company_logo
        if (logo && typeof logo === 'string' && logo.trim()) {
          return logo.trim()
        }
      }
    } catch (e) {}

    return logoImg
  }, [user, profile, isSA, rawCompanies])

  const handleLogout = async () => {
    logout()
    window.location.href = '/login'
  }

  // Filter navigation items based on user permissions
  const visibleNavItems = useMemo(() => {
    return config.navigation.filter((item) => {
      if (!item.requiredPermission) return true
      return hasPermission(item.requiredPermission)
    })
  }, [config.navigation, hasPermission])

  // Group navigation items if 'group' property exists
  const groupedNavItems = useMemo(() => {
    const groups: { name: string; items: NavItem[] }[] = []
    const groupMap = new Map<string, NavItem[]>()

    const hasAnyGroup = visibleNavItems.some(i => i.group)
    if (!hasAnyGroup) {
      return [{ name: 'Navigation', items: visibleNavItems }]
    }

    visibleNavItems.forEach((item) => {
      const gName = item.group || 'General'
      if (!groupMap.has(gName)) {
        groupMap.set(gName, [])
        groups.push({ name: gName, items: groupMap.get(gName)! })
      }
      groupMap.get(gName)!.push(item)
    })

    return groups
  }, [visibleNavItems])

  const userDisplayName = useMemo(() => {
    // 1. Direct name from profile or user state
    const p = profile as any
    const u = user as any
    const candidate = p?.full_name || p?.fullName || p?.name || u?.fullName || u?.full_name || u?.name || u?.user_metadata?.full_name || u?.user_metadata?.name || u?.user_metadata?.fullName
    if (candidate && typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim()
    }

    // 2. Intelligent format from email prefix (e.g. "john.doe@company.com" -> "John Doe")
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

    // 3. Role-based fallback
    if (role === 'super_admin') return 'Super Admin'
    if (role === 'admin') return 'Admin'
    if (role === 'hr') return 'HR Manager'
    if (role === 'team_lead') return 'Team Lead'
    return 'Employee'
  }, [profile, user, role])

  const userInitial = useMemo(() => {
    if (userDisplayName && userDisplayName.length > 0) {
      return userDisplayName.charAt(0).toUpperCase()
    }
    if (user?.email && user.email.length > 0) {
      return user.email.charAt(0).toUpperCase()
    }
    return 'U'
  }, [userDisplayName, user?.email])

  const { sidebarActiveBg, sidebarText, sidebarHoverBg, brandGradient, accentColor } = config.theme

  return (
    <aside 
      className={`flex flex-col h-full border-r border-slate-200/80 bg-white shadow-[2px_0_16px_rgba(0,0,0,0.02)] ${className}`}
    >
      {/* ── Brand Header (Just Logo, No Text/Label Beside) ──────────── */}
      <div className="px-5 pt-5 pb-4 border-b border-slate-100 flex items-center justify-start shrink-0">
        <div className="flex items-center h-10 w-full overflow-hidden">
          <img 
            src={companyLogo || logoImg} 
            alt="Company Logo" 
            onError={(e) => {
              // Seamless fallback to FusionHRMS logo if custom URL fails to load
              (e.target as HTMLImageElement).src = logoImg
            }}
            className="h-9 max-h-10 w-auto max-w-[175px] object-contain transition-all" 
          />
        </div>
      </div>

      {/* ── Grouped Navigation List ─────────────────────────────────── */}
      <ScrollArea className="flex-1 px-3.5 py-4">
        <div className="space-y-4">
          {groupedNavItems.map((group) => (
            <div key={group.name} className="space-y-1">
              {/* Group Label Header */}
              <div className="px-2.5 pb-1.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                {group.name}
              </div>

              {group.items.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <Link key={item.name} to={item.href}>
                    <Button
                      variant="ghost"
                      className={`w-full justify-start h-9.5 text-xs px-3 rounded-xl transition-all duration-200 group relative ${
                        isActive
                          ? `${sidebarActiveBg}`
                          : `${sidebarText} ${sidebarHoverBg}`
                      }`}
                    >
                      <item.icon className={`mr-2.5 h-4 w-4 transition-transform duration-200 group-hover:scale-110 ${
                        isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'
                      }`} />
                      <span className="font-semibold text-left flex-1 truncate">{item.name}</span>

                      {/* Custom item badge (e.g. Leave: 3) */}
                      {item.badge && (
                        <span className={`ml-auto text-[10px] font-extrabold px-2 py-0.5 rounded-full border shadow-2xs ${item.badgeColor || 'bg-teal-100 text-teal-800 border-teal-200'}`}>
                          {item.badge}
                        </span>
                      )}

                      {/* Store-driven notification badge */}
                      {item.name === 'Notifications' && unreadNotificationsCount > 0 && (
                        <span className={`bg-gradient-to-r ${brandGradient} text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs shrink-0`}>
                          {unreadNotificationsCount}
                        </span>
                      )}

                      {/* Store-driven exam badge */}
                      {item.name === 'Skill Track' && unreadExamsCount > 0 && (
                        <span className={`bg-gradient-to-r ${brandGradient} text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs shrink-0`}>
                          {unreadExamsCount}
                        </span>
                      )}
                    </Button>
                  </Link>
                )
              })}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* ── User Profile Footer ─────────────────────────────────────── */}
      <div className="p-3.5 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2.5 mb-3 px-1">
          {profile?.avatar_url || (user as any)?.avatar_url ? (
            <img 
              src={profile?.avatar_url || (user as any)?.avatar_url} 
              alt={userDisplayName} 
              className="w-8 h-8 rounded-full object-cover shadow-sm ring-1 ring-slate-200 shrink-0"
            />
          ) : (
            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${brandGradient} flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0`}>
              {userInitial}
            </div>
          )}
          <div className="overflow-hidden flex-1 min-w-0">
            <p className="text-xs font-bold truncate leading-tight text-slate-900" title={userDisplayName}>
              {userDisplayName}
            </p>
            <p className="text-[10px] font-medium truncate mt-0.5 text-slate-400" title={user?.email}>
              {user?.email}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full justify-start h-8.5 text-xs rounded-xl font-semibold transition-all duration-200 border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50/70 hover:border-rose-200"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          Log out
        </Button>
      </div>
    </aside>
  )
}
