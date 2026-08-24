import { useAuthStore } from '@/store/authStore'
import { SuperAdminLayout } from './SuperAdminLayout'
import { AdminLayout } from './AdminLayout'
import { HrLayout } from './HrLayout'
import { TeamLeadLayout } from './TeamLeadLayout'
import { EmployeeLayout } from './EmployeeLayout'
import { useGlobalNotifications } from '@/hooks/useGlobalNotifications'

export function AppShell({ children }: { children: React.ReactNode }) {
  useGlobalNotifications()
  const { role } = useAuthStore()

  // Fallback to employee layout if role is not loaded yet
  const activeRole = role ?? 'employee'

  if (activeRole === 'super_admin') {
    return <SuperAdminLayout>{children}</SuperAdminLayout>
  }

  if (activeRole === 'admin') {
    return <AdminLayout>{children}</AdminLayout>
  }

  if (activeRole === 'hr') {
    return <HrLayout>{children}</HrLayout>
  }

  if (activeRole === 'team_lead') {
    return <TeamLeadLayout>{children}</TeamLeadLayout>
  }

  return <EmployeeLayout>{children}</EmployeeLayout>
}
