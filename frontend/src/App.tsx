import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { useAuthStore } from '@/store/authStore'
import { Toaster } from '@/components/ui/toaster'
import { RoleGuard } from '@/components/guards/RoleGuard'
import { PermissionGuard } from '@/components/guards/PermissionGuard'
import { Permission as P } from '@/config/permissions'
import { ProtectedRoute } from '@/components/guards/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'

// Public Features
import Login from '@/features/auth/Login'
import LandingPage from '@/pages/LandingPage'
import DemoPage from '@/pages/DemoPage'
import Forbidden from '@/pages/Forbidden'
import ModulesPage from '@/pages/public/ModulesPage'
import PricingPage from '@/pages/public/PricingPage'
import AboutUsPage from '@/pages/public/AboutUsPage'
import ContactUsPage from '@/pages/public/ContactUsPage'
import BookDemoPage from '@/pages/public/BookDemoPage'

// Shared Features
import TaskList from '@/features/tasks/TaskList'
import SkillTrack from '@/features/skill-track/SkillTrack'

// Super Admin Features
import SuperAdminDashboard from '@/features/super-admin/Dashboard'
import ManageAdmins from '@/features/super-admin/ManageAdmins'
import OrgAnalytics from '@/features/super-admin/OrgAnalytics'
import ActivityLogs from '@/features/super-admin/ActivityLogs'
import SuperAdminSettings from '@/features/super-admin/Settings'
import ManageSubscriptionLeads from '@/features/super-admin/ManageSubscriptionLeads'

// Admin Features
import AdminDashboard from '@/features/admin/Dashboard'
import Teams from '@/features/super-admin/Teams'
import ManageEmployees from '@/features/super-admin/ManageEmployees'
import FinanceManagement from '@/features/admin/FinanceManagement'
import AdminSettings from '@/features/admin/Settings'

// HR Features
import HrDashboard from '@/features/hr/Dashboard'
import Announcements from '@/features/super-admin/Announcements'
import Payroll from '@/features/hr/Payroll'
import LeaveManagement from '@/features/hr/LeaveManagement'
import AppraisalManagement from '@/features/hr/AppraisalManagement'
import HrPoliciesPage from '@/features/hr/Policies'

// Team Lead Features
import AdminProjects from '@/features/admin/Projects'
import TeamMembers from '@/features/admin/TeamMembers'
import AdminReports from '@/features/admin/Reports'

// Employee Features
import EmployeeDashboard from '@/features/employee/Dashboard'
import EmployeeNotifications from '@/features/employee/Notifications'
import EmployeePerformance from '@/features/employee/Performance'
import Profile from '@/features/employee/Profile'
import Documents from '@/features/employee/Documents'

// ─── Root Redirect ───────────────────────────────────────────────────────────

const RootRedirect = () => {
  const { user, role, isLoading } = useAuthStore()

  if (isLoading || (user && !role)) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-indigo-600 border-t-transparent" />
          </div>
          <p className="text-sm font-medium text-slate-500">Resolving workspace...</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/home" replace />

  switch (role) {
    case 'super_admin':
      return <Navigate to="/super-admin/dashboard" replace />
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />
    case 'hr':
      return <Navigate to="/hr/dashboard" replace />
    case 'team_lead':
      return <Navigate to="/team-lead/dashboard" replace />
    case 'employee':
    default:
      return <Navigate to="/employee/dashboard" replace />
  }
}

// ─── App Router ───────────────────────────────────────────────────────────────

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ── Public Routes ────────────────────────────────────────── */}
          <Route path="/login" element={<Login />} />
          <Route path="/home" element={<LandingPage />} />
          <Route path="/modules" element={<ModulesPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/about" element={<AboutUsPage />} />
          <Route path="/contact" element={<ContactUsPage />} />
          <Route path="/book-demo" element={<BookDemoPage />} />
          <Route path="/demo" element={<DemoPage />} />
          <Route path="/forbidden" element={<Forbidden />} />

          {/* ── Root Redirect ────────────────────────────────────────── */}
          <Route path="/" element={<RootRedirect />} />

          {/* ── 1. Super Admin Portal (/super-admin/*) ───────────────── */}
          <Route
            path="/super-admin"
            element={
              <RoleGuard allowedRoles={['super_admin']}>
                <ProtectedRoute>
                  <AppShell>
                    <Outlet />
                  </AppShell>
                </ProtectedRoute>
              </RoleGuard>
            }
          >
            <Route path="dashboard" element={<SuperAdminDashboard />} />
            <Route path="admins" element={<ManageAdmins />} />
            <Route path="analytics" element={<OrgAnalytics />} />
            <Route path="subscription-leads" element={<ManageSubscriptionLeads />} />
            <Route path="audit-logs" element={<ActivityLogs />} />
            <Route path="settings" element={<SuperAdminSettings />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          {/* ── 2. Admin Portal (/admin/*) ───────────────────────────── */}
          <Route
            path="/admin"
            element={
              <RoleGuard allowedRoles={['admin']}>
                <ProtectedRoute>
                  <AppShell>
                    <Outlet />
                  </AppShell>
                </ProtectedRoute>
              </RoleGuard>
            }
          >
            <Route path="dashboard" element={<AdminDashboard defaultTab="overview" />} />
            <Route path="notifications" element={<PermissionGuard requires={P.VIEW_NOTIFICATIONS}><EmployeeNotifications /></PermissionGuard>} />
            <Route path="employees" element={<PermissionGuard requires={P.MANAGE_EMPLOYEES}><ManageEmployees /></PermissionGuard>} />
            <Route path="teams" element={<PermissionGuard requires={P.CREATE_TEAM}><Teams /></PermissionGuard>} />
            <Route path="announcements" element={<PermissionGuard requires={P.MANAGE_ANNOUNCEMENTS}><Announcements /></PermissionGuard>} />
            <Route path="leaves" element={<PermissionGuard requires={P.MANAGE_EMPLOYEES}><LeaveManagement /></PermissionGuard>} />
            <Route path="appraisals" element={<PermissionGuard requires={P.VIEW_ORG_ANALYTICS}><AppraisalManagement /></PermissionGuard>} />
            <Route path="policies" element={<PermissionGuard requires={P.VIEW_POLICIES}><HrPoliciesPage mode="manage" /></PermissionGuard>} />
            <Route path="analytics" element={<PermissionGuard requires={P.VIEW_ORG_ANALYTICS}><OrgAnalytics /></PermissionGuard>} />
            <Route path="finance" element={<PermissionGuard requires={P.VIEW_ORG_ANALYTICS}><FinanceManagement /></PermissionGuard>} />
            <Route path="audit-logs" element={<PermissionGuard requires={P.VIEW_ACTIVITY_LOGS}><ActivityLogs /></PermissionGuard>} />
            <Route path="settings" element={<PermissionGuard requires={P.MANAGE_SETTINGS}><AdminSettings /></PermissionGuard>} />
            <Route path="profile" element={<PermissionGuard requires={P.MANAGE_OWN_PROFILE}><Profile /></PermissionGuard>} />
          </Route>

          {/* ── 3. HR Portal (/hr/*) ─────────────────────────────────── */}
          <Route
            path="/hr"
            element={
              <RoleGuard allowedRoles={['hr']}>
                <ProtectedRoute>
                  <AppShell>
                    <Outlet />
                  </AppShell>
                </ProtectedRoute>
              </RoleGuard>
            }
          >
            <Route path="dashboard" element={<HrDashboard defaultTab="overview" />} />
            <Route path="attendance" element={<PermissionGuard requires={P.MANAGE_EMPLOYEES}><HrDashboard defaultTab="attendance" /></PermissionGuard>} />
            <Route path="leave" element={<PermissionGuard requires={P.MANAGE_EMPLOYEES}><HrDashboard defaultTab="leave" /></PermissionGuard>} />
            <Route path="leaves" element={<PermissionGuard requires={P.MANAGE_EMPLOYEES}><LeaveManagement /></PermissionGuard>} />
            <Route path="payroll" element={<PermissionGuard requires={P.MANAGE_PAYROLL}><HrDashboard defaultTab="payroll" /></PermissionGuard>} />
            <Route path="employees" element={<PermissionGuard requires={P.MANAGE_EMPLOYEES}><ManageEmployees /></PermissionGuard>} />
            <Route path="policies" element={<PermissionGuard requires={P.VIEW_POLICIES}><HrPoliciesPage mode="manage" /></PermissionGuard>} />
            <Route path="performance" element={<PermissionGuard requires={P.VIEW_ORG_ANALYTICS}><HrDashboard defaultTab="performance" /></PermissionGuard>} />
            <Route path="appraisals" element={<PermissionGuard requires={P.VIEW_ORG_ANALYTICS}><AppraisalManagement /></PermissionGuard>} />
            <Route path="documents" element={<PermissionGuard requires={P.MANAGE_EMPLOYEES}><HrDashboard defaultTab="documents" /></PermissionGuard>} />
            <Route path="teams" element={<PermissionGuard requires={P.CREATE_TEAM}><Teams /></PermissionGuard>} />
            <Route path="audit-logs" element={<PermissionGuard requires={P.VIEW_ACTIVITY_LOGS}><ActivityLogs /></PermissionGuard>} />
            <Route path="announcements" element={<PermissionGuard requires={P.MANAGE_ANNOUNCEMENTS}><Announcements /></PermissionGuard>} />
            <Route path="settings" element={<PermissionGuard requires={P.MANAGE_SETTINGS}><HrDashboard defaultTab="settings" /></PermissionGuard>} />
            <Route path="profile" element={<PermissionGuard requires={P.MANAGE_OWN_PROFILE}><Profile /></PermissionGuard>} />
          </Route>

          {/* ── 4. Team Lead Portal (/team-lead/*) ──────────────────── */}
          <Route
            path="/team-lead"
            element={
              <RoleGuard allowedRoles={['team_lead']}>
                <ProtectedRoute>
                  <AppShell>
                    <Outlet />
                  </AppShell>
                </ProtectedRoute>
              </RoleGuard>
            }
          >
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="projects" element={<PermissionGuard requires={P.CREATE_TASKS}><AdminProjects /></PermissionGuard>} />
            <Route path="tasks" element={<PermissionGuard requires={P.VIEW_ALL_TASKS}><TaskList /></PermissionGuard>} />
            <Route path="members" element={<PermissionGuard requires={P.ASSIGN_TEAM_MEMBERS}><TeamMembers /></PermissionGuard>} />
            <Route path="policies" element={<PermissionGuard requires={P.VIEW_POLICIES}><HrPoliciesPage mode="view" /></PermissionGuard>} />
            <Route path="reports" element={<PermissionGuard requires={P.EXPORT_REPORTS}><AdminReports /></PermissionGuard>} />
            <Route path="skill-track" element={<PermissionGuard requires={P.VIEW_ALL_TASKS}><SkillTrack /></PermissionGuard>} />
            <Route path="notifications" element={<PermissionGuard requires={P.VIEW_NOTIFICATIONS}><EmployeeNotifications /></PermissionGuard>} />
            <Route path="profile" element={<PermissionGuard requires={P.MANAGE_OWN_PROFILE}><Profile /></PermissionGuard>} />
          </Route>

          {/* ── 5. Employee Portal (/employee/*) ────────────────────── */}
          <Route
            path="/employee"
            element={
              <RoleGuard allowedRoles={['employee']}>
                <ProtectedRoute>
                  <AppShell>
                    <Outlet />
                  </AppShell>
                </ProtectedRoute>
              </RoleGuard>
            }
          >
            <Route path="dashboard" element={<EmployeeDashboard />} />
            <Route path="tasks" element={<PermissionGuard requires={P.VIEW_OWN_TASKS}><TaskList /></PermissionGuard>} />
            <Route path="policies" element={<PermissionGuard requires={P.VIEW_POLICIES}><HrPoliciesPage mode="view" /></PermissionGuard>} />
            <Route path="notifications" element={<PermissionGuard requires={P.VIEW_NOTIFICATIONS}><EmployeeNotifications /></PermissionGuard>} />
            <Route path="performance" element={<PermissionGuard requires={P.VIEW_OWN_PERFORMANCE}><EmployeePerformance /></PermissionGuard>} />
            <Route path="documents" element={<PermissionGuard requires={P.MANAGE_OWN_PROFILE}><Documents /></PermissionGuard>} />
            <Route path="profile" element={<PermissionGuard requires={P.MANAGE_OWN_PROFILE}><Profile /></PermissionGuard>} />
            <Route path="skill-track" element={<PermissionGuard requires={P.VIEW_OWN_TASKS}><SkillTrack /></PermissionGuard>} />
          </Route>

          {/* ── Wildcard Fallback ─────────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </AuthProvider>
  )
}
