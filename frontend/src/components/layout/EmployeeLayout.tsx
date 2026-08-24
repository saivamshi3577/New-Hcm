import React from 'react'
import { RoleSidebar } from './shared/RoleSidebar'
import { RoleHeader } from './shared/RoleHeader'

interface LayoutProps {
  children: React.ReactNode
}

export function EmployeeLayout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden text-foreground bg-gradient-to-br from-violet-50/80 via-indigo-50/30 to-slate-50/90">
      {/* Layered decorative gradients for depth */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Primary radial glow — top-left */}
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-violet-200/20 blur-3xl" />
        {/* Secondary radial glow — bottom-right */}
        <div className="absolute -bottom-48 -right-24 w-[400px] h-[400px] rounded-full bg-indigo-200/15 blur-3xl" />
        {/* Subtle grain texture */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.012] mix-blend-multiply" />
      </div>

      <div className="z-10 flex h-full w-full">
        <RoleSidebar role="employee" className="hidden md:flex w-64 flex-shrink-0" />
        <div className="flex flex-col flex-1 w-full overflow-hidden">
          <RoleHeader role="employee" />
          <main className="flex-1 overflow-auto p-3 sm:p-4 lg:p-6 scroll-smooth">
            <div className="mx-auto max-w-7xl h-full animate-in fade-in slide-in-from-bottom-4 duration-700">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
