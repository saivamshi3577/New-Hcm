import {
  LayoutDashboard,
  CheckSquare,
  Users,
  Settings,
  TrendingUp,
  ClipboardList,
  UserCheck,
  FolderKanban,
  FileText,
  Bell,
  Award,
  Megaphone,
  User,
  GraduationCap,
  IndianRupee,
  Briefcase,
  Layers,
  Building2,
  Clock,
  Calendar,
  CreditCard,
  FileCheck,
  FolderOpen,
  CalendarCheck2,
  DollarSign,
  ShieldCheck
} from 'lucide-react'
import type { Role } from '@/types/user'
import type { Permission } from './permissions'
import { Permission as P } from './permissions'

export interface NavItem {
  name: string
  href: string
  icon: any
  requiredPermission?: Permission
  badge?: string | number
  badgeColor?: string
  group?: string
}

export interface RoleConfiguration {
  defaultRoute: string
  displayName: string
  portalLabel: string
  navigation: NavItem[]
  theme: {
    sidebarBg: string
    sidebarActiveBg: string
    sidebarActiveText: string
    sidebarText: string
    sidebarHoverBg: string
    accentColor: string
    accentBg: string
    brandGradient: string
    primaryColor: string
  }
}

export const ROLE_CONFIGS: Record<Role, RoleConfiguration> = {
  // ─── 1. Super Admin Portal (Platform Governance & System) ──────────────────
  super_admin: {
    defaultRoute: '/super-admin/dashboard',
    displayName: 'Super Admin',
    portalLabel: 'Platform Governance',
    navigation: [
      { name: 'Dashboard', href: '/super-admin/dashboard', icon: LayoutDashboard },
      { name: 'Companies & Admins', href: '/super-admin/admins', icon: Building2, requiredPermission: P.MANAGE_ADMINS },
      { name: 'Org Analytics', href: '/super-admin/analytics', icon: TrendingUp, requiredPermission: P.VIEW_ORG_ANALYTICS },
      { name: 'Subscription Leads', href: '/super-admin/subscription-leads', icon: IndianRupee, requiredPermission: P.VIEW_ORG_ANALYTICS },
      { name: 'Audit Logs', href: '/super-admin/audit-logs', icon: FileText, requiredPermission: P.VIEW_ACTIVITY_LOGS },
      { name: 'Settings', href: '/super-admin/settings', icon: Settings, requiredPermission: P.MANAGE_SETTINGS },
      { name: 'Profile', href: '/super-admin/profile', icon: User, requiredPermission: P.MANAGE_OWN_PROFILE },
    ],
    theme: {
      sidebarBg: 'bg-white',
      sidebarActiveBg: 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold shadow-md shadow-indigo-500/25 rounded-xl',
      sidebarActiveText: 'text-white',
      sidebarText: 'text-slate-600 font-medium',
      sidebarHoverBg: 'hover:bg-indigo-50/70 hover:text-indigo-900',
      accentColor: 'text-indigo-600',
      accentBg: 'bg-indigo-50',
      brandGradient: 'from-indigo-600 via-violet-600 to-purple-600',
      primaryColor: 'indigo',
    },
  },

  // ─── 2. Admin Portal (Org Governance, Employees, Finance & Audits) ────────
  admin: {
    defaultRoute: '/admin/dashboard',
    displayName: 'Admin',
    portalLabel: 'Organization Governance Hub',
    navigation: [
      // ── OVERVIEW
      { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, group: 'Overview' },
      { name: 'Notifications', href: '/admin/notifications', icon: Bell, requiredPermission: P.VIEW_NOTIFICATIONS, group: 'Overview' },

      // ── ORGANIZATION
      { name: 'Employees Directory', href: '/admin/employees', icon: Users, requiredPermission: P.MANAGE_EMPLOYEES, group: 'Organization' },
      { name: 'Teams & Departments', href: '/admin/teams', icon: Layers, requiredPermission: P.CREATE_TEAM, group: 'Organization' },
      { name: 'Leave Requests', href: '/admin/leaves', icon: CalendarCheck2, requiredPermission: P.MANAGE_EMPLOYEES, group: 'Organization' },
      { name: 'Appraisals', href: '/admin/appraisals', icon: Award, requiredPermission: P.VIEW_ORG_ANALYTICS, group: 'Organization' },
      { name: 'HR Policies', href: '/admin/policies', icon: ShieldCheck, requiredPermission: P.VIEW_POLICIES, group: 'Organization' },
      { name: 'Announcements', href: '/admin/announcements', icon: Megaphone, requiredPermission: P.MANAGE_ANNOUNCEMENTS, group: 'Organization' },

      // ── GOVERNANCE & FINANCE
      { name: 'Org Analytics', href: '/admin/analytics', icon: TrendingUp, requiredPermission: P.VIEW_ORG_ANALYTICS, group: 'Governance & Finance' },
      { name: 'Finance Management', href: '/admin/finance', icon: DollarSign, requiredPermission: P.VIEW_ORG_ANALYTICS, group: 'Governance & Finance' },
      { name: 'Audit Logs', href: '/admin/audit-logs', icon: FileText, requiredPermission: P.VIEW_ACTIVITY_LOGS, group: 'Governance & Finance' },

      // ── SYSTEM
      { name: 'Company Profile & Settings', href: '/admin/settings', icon: Settings, requiredPermission: P.MANAGE_SETTINGS, group: 'System' },
      { name: 'Profile', href: '/admin/profile', icon: User, requiredPermission: P.MANAGE_OWN_PROFILE, group: 'System' },
    ],
    theme: {
      sidebarBg: 'bg-white',
      sidebarActiveBg: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white font-bold shadow-md shadow-blue-500/25 rounded-xl',
      sidebarActiveText: 'text-white',
      sidebarText: 'text-slate-600 font-medium',
      sidebarHoverBg: 'hover:bg-blue-50/70 hover:text-blue-900',
      accentColor: 'text-blue-600',
      accentBg: 'bg-blue-50',
      brandGradient: 'from-blue-600 via-indigo-600 to-cyan-600',
      primaryColor: 'blue',
    },
  },

  // ─── 3. HR Portal (Human Resources Management) ────────────────────────────
  hr: {
    defaultRoute: '/hr/dashboard',
    displayName: 'HR Manager',
    portalLabel: 'People Operations',
    navigation: [
      // ── OVERVIEW
      { name: 'Dashboard', href: '/hr/dashboard', icon: LayoutDashboard, group: 'Overview' },
      { name: 'Attendance', href: '/hr/attendance', icon: Clock, requiredPermission: P.MANAGE_EMPLOYEES, group: 'Overview' },
      { name: 'Leave', href: '/hr/leave', icon: Calendar, badge: '3', badgeColor: 'bg-pink-100 text-pink-700 border-pink-200', requiredPermission: P.MANAGE_EMPLOYEES, group: 'Overview' },
      { name: 'Payroll', href: '/hr/payroll', icon: IndianRupee, requiredPermission: P.MANAGE_PAYROLL, group: 'Overview' },

      // ── ORGANIZATION
      { name: 'Employees', href: '/hr/employees', icon: Users, requiredPermission: P.MANAGE_EMPLOYEES, group: 'Organization' },
      { name: 'HR Policies', href: '/hr/policies', icon: ShieldCheck, requiredPermission: P.VIEW_POLICIES, group: 'Organization' },
      { name: 'Performance', href: '/hr/performance', icon: TrendingUp, requiredPermission: P.VIEW_ORG_ANALYTICS, group: 'Organization' },
      { name: 'Appraisals', href: '/hr/appraisals', icon: Award, requiredPermission: P.VIEW_ORG_ANALYTICS, group: 'Organization' },
      { name: 'Documents', href: '/hr/documents', icon: FileText, requiredPermission: P.MANAGE_EMPLOYEES, group: 'Organization' },
      { name: 'Teams & Orgs', href: '/hr/teams', icon: Layers, requiredPermission: P.CREATE_TEAM, group: 'Organization' },
      { name: 'Announcements', href: '/hr/announcements', icon: Megaphone, requiredPermission: P.MANAGE_ANNOUNCEMENTS, group: 'Organization' },
      { name: 'Audit Logs', href: '/hr/audit-logs', icon: FileText, requiredPermission: P.VIEW_ACTIVITY_LOGS, group: 'Organization' },

      // ── SYSTEM
      { name: 'Settings', href: '/hr/settings', icon: Settings, requiredPermission: P.MANAGE_SETTINGS, group: 'System' },
      { name: 'Profile', href: '/hr/profile', icon: User, requiredPermission: P.MANAGE_OWN_PROFILE, group: 'System' },
    ],
    theme: {
      sidebarBg: 'bg-white',
      sidebarActiveBg: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-md shadow-indigo-500/25 rounded-xl',
      sidebarActiveText: 'text-white',
      sidebarText: 'text-slate-600 font-medium',
      sidebarHoverBg: 'hover:bg-purple-50/70 hover:text-purple-900',
      accentColor: 'text-purple-600',
      accentBg: 'bg-purple-50',
      brandGradient: 'from-purple-600 via-indigo-600 to-violet-600',
      primaryColor: 'purple',
    },
  },

  // ─── 4. Team Lead Portal (TL Project & Sprint Lead) ───────────────────────
  team_lead: {
    defaultRoute: '/team-lead/dashboard',
    displayName: 'Team Lead',
    portalLabel: 'Sprint & Project Hub',
    navigation: [
      { name: 'Dashboard', href: '/team-lead/dashboard', icon: LayoutDashboard },
      { name: 'Projects', href: '/team-lead/projects', icon: FolderKanban, requiredPermission: P.CREATE_TASKS },
      { name: 'Tasks (Kanban)', href: '/team-lead/tasks', icon: CheckSquare, requiredPermission: P.VIEW_ALL_TASKS },
      { name: 'Team Members', href: '/team-lead/members', icon: Users, requiredPermission: P.ASSIGN_TEAM_MEMBERS },
      { name: 'HR Policies', href: '/team-lead/policies', icon: ShieldCheck, requiredPermission: P.VIEW_POLICIES },
      { name: 'Team Reports', href: '/team-lead/reports', icon: TrendingUp, requiredPermission: P.EXPORT_REPORTS },
      { name: 'Skill Track', href: '/team-lead/skill-track', icon: GraduationCap, requiredPermission: P.VIEW_ALL_TASKS },
      { name: 'Notifications', href: '/team-lead/notifications', icon: Bell, requiredPermission: P.VIEW_NOTIFICATIONS },
      { name: 'Profile', href: '/team-lead/profile', icon: User, requiredPermission: P.MANAGE_OWN_PROFILE },
    ],
    theme: {
      sidebarBg: 'bg-white',
      sidebarActiveBg: 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold shadow-md shadow-teal-500/25 rounded-xl',
      sidebarActiveText: 'text-white',
      sidebarText: 'text-slate-600 font-medium',
      sidebarHoverBg: 'hover:bg-teal-50/70 hover:text-teal-900',
      accentColor: 'text-teal-600',
      accentBg: 'bg-teal-50/40',
      brandGradient: 'from-teal-600 to-emerald-500',
      primaryColor: 'teal',
    },
  },

  // ─── 5. Employee Portal (Individual Workspace) ───────────────────────────
  employee: {
    defaultRoute: '/employee/dashboard',
    displayName: 'Employee',
    portalLabel: 'My Workspace',
    navigation: [
      { name: 'Dashboard', href: '/employee/dashboard', icon: LayoutDashboard },
      { name: 'My Tasks', href: '/employee/tasks', icon: CheckSquare, requiredPermission: P.VIEW_OWN_TASKS },
      { name: 'HR Policies', href: '/employee/policies', icon: ShieldCheck, requiredPermission: P.VIEW_POLICIES },
      { name: 'Notifications', href: '/employee/notifications', icon: Bell, requiredPermission: P.VIEW_NOTIFICATIONS },
      { name: 'Performance', href: '/employee/performance', icon: Award, requiredPermission: P.VIEW_OWN_PERFORMANCE },
      { name: 'Documents', href: '/employee/documents', icon: FolderOpen, requiredPermission: P.MANAGE_OWN_PROFILE },
      { name: 'Skill Track', href: '/employee/skill-track', icon: GraduationCap, requiredPermission: P.VIEW_OWN_TASKS },
      { name: 'Profile', href: '/employee/profile', icon: User, requiredPermission: P.MANAGE_OWN_PROFILE },
    ],
    theme: {
      sidebarBg: 'bg-white',
      sidebarActiveBg: 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold shadow-md shadow-violet-500/25 rounded-xl',
      sidebarActiveText: 'text-white',
      sidebarText: 'text-slate-600 font-medium',
      sidebarHoverBg: 'hover:bg-violet-50/70 hover:text-violet-900',
      accentColor: 'text-violet-600',
      accentBg: 'bg-violet-50',
      brandGradient: 'from-violet-600 to-indigo-600',
      primaryColor: 'violet',
    },
  },
}
