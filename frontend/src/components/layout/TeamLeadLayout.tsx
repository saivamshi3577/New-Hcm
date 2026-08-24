import React from 'react'
import { RoleSidebar } from './shared/RoleSidebar'
import { RoleHeader } from './shared/RoleHeader'

interface LayoutProps {
  children: React.ReactNode
}

export function TeamLeadLayout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen bg-[#f8fafc] w-full overflow-hidden text-slate-800 relative">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0 opacity-60" />
      <div className="absolute top-[-10%] left-[-15%] w-[45%] h-[45%] rounded-full bg-teal-500/[0.04] blur-[100px] pointer-events-none z-0" />
      
      <RoleSidebar role="team_lead" className="hidden md:flex w-64 flex-shrink-0 z-10" />
      <div className="flex flex-col flex-1 w-full overflow-hidden z-10 relative">
        <RoleHeader role="team_lead" />
        <main className="flex-1 overflow-auto p-3 sm:p-4 lg:p-5 bg-transparent">
          <div className="mx-auto max-w-7xl h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
