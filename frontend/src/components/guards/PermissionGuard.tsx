import React from 'react'
import { Navigate } from 'react-router-dom'
import { usePermissions } from '@/hooks/usePermissions'
import { Permission } from '@/config/permissions'

interface PermissionGuardProps {
  children: React.ReactNode
  requires: Permission | Permission[]
  requireAll?: boolean
  fallback?: React.ReactNode
}

export function PermissionGuard({
  children,
  requires,
  requireAll = false,
  fallback = <Navigate to="/forbidden" replace />,
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions()

  const permissionsToCheck = Array.isArray(requires) ? requires : [requires]

  let isAllowed = false
  if (permissionsToCheck.length === 1) {
    isAllowed = hasPermission(permissionsToCheck[0])
  } else if (requireAll) {
    isAllowed = hasAllPermissions(permissionsToCheck)
  } else {
    isAllowed = hasAnyPermission(permissionsToCheck)
  }

  if (!isAllowed) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
