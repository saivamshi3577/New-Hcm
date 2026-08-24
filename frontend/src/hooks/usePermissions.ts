import { useState, useEffect, useMemo } from 'react'
import { useAuthStore } from '@/store/authStore'
import { Permission, ROLE_PERMISSIONS } from '@/config/permissions'
import type { Role } from '@/types/user'
import { getCompanyRolePermissions, getGlobalRolePermissions } from '@/lib/rolePermissions'

export function usePermissions() {
  const { user, profile, role, permissions: storePermissions } = useAuthStore()
  const [updateVersion, setUpdateVersion] = useState(0)

  useEffect(() => {
    const handleUpdate = () => {
      setUpdateVersion(v => v + 1)
    }
    window.addEventListener('permissions-updated', handleUpdate)
    window.addEventListener('storage', handleUpdate)
    return () => {
      window.removeEventListener('permissions-updated', handleUpdate)
      window.removeEventListener('storage', handleUpdate)
    }
  }, [])

  const activePermissions = useMemo<Permission[]>(() => {
    if (!role) return []
    if (role === 'super_admin') {
      return Object.values(Permission)
    }

    let domain = 'default'
    if ((user as any)?.company?.domain) {
      domain = (user as any).company.domain.toLowerCase().trim()
    } else if ((profile as any)?.company?.domain) {
      domain = (profile as any).company.domain.toLowerCase().trim()
    } else if (user?.email && user.email.includes('@')) {
      domain = user.email.split('@')[1].toLowerCase().trim()
    } else if (profile?.email && profile.email.includes('@')) {
      domain = profile.email.split('@')[1].toLowerCase().trim()
    }

    const compId = (user as any)?.company_id || (profile as any)?.company_id || (user as any)?.company?.id

    let companyMatrix = getCompanyRolePermissions(domain)
    if ((!companyMatrix || !companyMatrix[role]) && compId) {
      companyMatrix = getCompanyRolePermissions(compId)
    }

    if (companyMatrix && Array.isArray(companyMatrix[role])) {
      return companyMatrix[role]
    }

    const globalMatrix = getGlobalRolePermissions()
    if (globalMatrix && Array.isArray(globalMatrix[role])) {
      return globalMatrix[role]
    }

    return storePermissions?.length ? storePermissions : (ROLE_PERMISSIONS[role] || [])
  }, [user, profile, role, storePermissions, updateVersion])

  const hasPermission = (permission: Permission): boolean => {
    if (role === 'super_admin') return true
    return activePermissions.includes(permission)
  }

  const hasAnyPermission = (requiredPermissions: Permission[]): boolean => {
    if (role === 'super_admin') return true
    return requiredPermissions.some(perm => activePermissions.includes(perm))
  }

  const hasAllPermissions = (requiredPermissions: Permission[]): boolean => {
    if (role === 'super_admin') return true
    return requiredPermissions.every(perm => activePermissions.includes(perm))
  }

  const hasRole = (allowedRoles: Role[]): boolean => {
    return role ? allowedRoles.includes(role) : false
  }

  return {
    role,
    permissions: activePermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    isSuperAdmin: role === 'super_admin',
    isAdmin: role === 'admin',
    isHR: role === 'hr',
    isTeamLead: role === 'team_lead',
    isEmployee: role === 'employee',
  }
}
