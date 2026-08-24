import React from 'react'
import { RoleSidebar } from './shared/RoleSidebar'
import { RoleHeader } from './shared/RoleHeader'

interface LayoutProps {
  children: React.ReactNode
}

export function SuperAdminLayout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen sa-canvas w-full overflow-hidden text-slate-800">
      <RoleSidebar role="super_admin" className="hidden md:flex w-60 flex-shrink-0" />
      <div className="flex flex-col flex-1 w-full overflow-hidden">
        <RoleHeader role="super_admin" />
        <main className="flex-1 overflow-auto p-4 sm:p-5 lg:p-6">
          <div className="mx-auto max-w-7xl h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
