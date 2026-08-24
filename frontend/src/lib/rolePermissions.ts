import { Permission, ROLE_PERMISSIONS } from '@/config/permissions'
import type { Role } from '@/types/user'

export interface PermissionCategory {
  id: string
  name: string
  description: string
  permissions: {
    key: Permission
    label: string
    description: string
  }[]
}

export const PERMISSION_CATEGORIES: PermissionCategory[] = [
  {
    id: 'governance',
    name: 'SaaS Platform Governance',
    description: 'System administration, multi-tenant setup, and settings.',
    permissions: [
      { key: Permission.MANAGE_ADMINS, label: 'Manage Tenant Admins', description: 'Provision and configure company admin accounts.' },
      { key: Permission.MANAGE_ROLES, label: 'Manage Roles & Permissions', description: 'Customize global and tenant role permission matrix.' },
      { key: Permission.MANAGE_SETTINGS, label: 'System Policy & Settings', description: 'Configure shift times, grace minutes, and geofencing.' },
    ]
  },
  {
    id: 'staff_hrms',
    name: 'Employee & HRMS Operations',
    description: 'Staff directory, departments, teams, and user onboarding.',
    permissions: [
      { key: Permission.MANAGE_EMPLOYEES, label: 'Manage Employee Directory', description: 'Add, edit, or terminate employee profiles.' },
      { key: Permission.VIEW_ALL_USERS, label: 'View All Users & Directory', description: 'Access full staff list across departments.' },
      { key: Permission.CREATE_DEPARTMENT, label: 'Create & Manage Departments', description: 'Configure organizational department structure.' },
      { key: Permission.CREATE_TEAM, label: 'Create & Assign Teams', description: 'Build project teams and assign team leads.' },
      { key: Permission.ASSIGN_TEAM_MEMBERS, label: 'Assign Team Members', description: 'Add or remove members from team rosters.' },
    ]
  },
  {
    id: 'tasks_sprints',
    name: 'Tasks & Monthly Sprint Engine',
    description: 'Task creation, assignment, approval, and evaluation points.',
    permissions: [
      { key: Permission.CREATE_TASKS, label: 'Create Tasks', description: 'Create and assign tasks to members or leads.' },
      { key: Permission.ASSIGN_TASKS, label: 'Assign Tasks to Staff', description: 'Delegate task ownership within the team.' },
      { key: Permission.VIEW_ALL_TASKS, label: 'View All Tasks', description: 'Monitor board and task progress across organization.' },
      { key: Permission.UPDATE_TASK_STATUS, label: 'Update Task Progress', description: 'Move tasks across Kanban columns.' },
      { key: Permission.APPROVE_TASKS, label: 'Evaluate & Approve Tasks', description: 'Evaluate sprint points and sign off completed tasks.' },
      { key: Permission.DELETE_TASKS, label: 'Delete Tasks', description: 'Remove invalid tasks or backlog items.' },
    ]
  },
  {
    id: 'analytics',
    name: 'Analytics & Reporting',
    description: 'Organizational insights, productivity stats, and exports.',
    permissions: [
      { key: Permission.VIEW_ORG_ANALYTICS, label: 'View Executive Analytics', description: 'Access top-level organization metric dashboards.' },
      { key: Permission.VIEW_TEAM_ANALYTICS, label: 'View Team Analytics', description: 'Monitor team productivity performance stats.' },
      { key: Permission.COMPARE_TEAMS, label: 'Compare Team Performance', description: 'Cross-compare performance scores between teams.' },
      { key: Permission.EXPORT_REPORTS, label: 'Export Reports (CSV/PDF)', description: 'Download attendance and sprint point reports.' },
    ]
  },
  {
    id: 'audit_logs',
    name: 'System Logs & Announcements',
    description: 'Activity history, notices, and personal workspace.',
    permissions: [
      { key: Permission.VIEW_ACTIVITY_LOGS, label: 'View Audit Logs', description: 'Inspect security events and operational logs.' },
      { key: Permission.MANAGE_ANNOUNCEMENTS, label: 'Broadcast Announcements', description: 'Post company-wide notices and news.' },
      { key: Permission.VIEW_NOTIFICATIONS, label: 'Receive System Alerts', description: 'Get notifications for approvals and task updates.' },
    ]
  }
]

export type RolePermissionsMatrix = Record<Role, Permission[]>

export const SUPER_ADMIN_VISIBLE_ROLES: Role[] = ['admin', 'hr', 'team_lead', 'employee']
export const ADMIN_VISIBLE_ROLES: Role[] = ['hr', 'team_lead', 'employee']

export const DEFAULT_ROLE_LABELS: Record<Role, { title: string, description: string, color: string }> = {
  super_admin: { title: 'Super Admin', description: 'Full platform governance and tenant provisioning control.', color: 'indigo' },
  admin: { title: 'Company Admin', description: 'Tenant-level administrator managing company policies and staff.', color: 'purple' },
  hr: { title: 'HR Manager', description: 'Handles employee directory, attendance, leaves, and payroll.', color: 'blue' },
  team_lead: { title: 'Team Lead', description: 'Manages project teams, task assignments, and evaluations.', color: 'amber' },
  employee: { title: 'Team Member ', description: 'Standard workspace for completing tasks and tracking attendance.', color: 'emerald' },
}

export function getGlobalRolePermissions(): RolePermissionsMatrix {
  try {
    const stored = localStorage.getItem('st_custom_permissions')
    if (stored) return JSON.parse(stored)
  } catch (e) {}
  return { ...ROLE_PERMISSIONS }
}

export function saveGlobalRolePermissions(matrix: RolePermissionsMatrix) {
  try {
    localStorage.setItem('st_custom_permissions', JSON.stringify(matrix))
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('permissions-updated'))
      window.dispatchEvent(new Event('storage'))
    }
  } catch (e) {}
}

export function getCompanyRolePermissions(identifier?: string): RolePermissionsMatrix {
  if (!identifier || identifier === 'default' || identifier === 'global' || identifier === 'all') {
    return getGlobalRolePermissions()
  }
  const clean = identifier.toLowerCase().trim()
  try {
    const key = `st_comp_permissions_${clean}`
    const stored = localStorage.getItem(key)
    if (stored) return JSON.parse(stored)
  } catch (e) {}
  return getGlobalRolePermissions()
}

export function saveCompanyRolePermissions(identifier: string, matrix: RolePermissionsMatrix) {
  if (!identifier || identifier === 'default' || identifier === 'global' || identifier === 'all') {
    saveGlobalRolePermissions(matrix)
    return
  }
  const clean = identifier.toLowerCase().trim()
  try {
    const key = `st_comp_permissions_${clean}`
    localStorage.setItem(key, JSON.stringify(matrix))
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('permissions-updated'))
      window.dispatchEvent(new Event('storage'))
    }
  } catch (e) {}
}

export function getCompanyRoleLabels(identifier?: string): Record<Role, { title: string, description: string, color: string }> {
  if (!identifier || identifier === 'default' || identifier === 'global' || identifier === 'all') {
    try {
      const stored = localStorage.getItem('st_custom_role_labels')
      if (stored) return JSON.parse(stored)
    } catch (e) {}
    return DEFAULT_ROLE_LABELS
  }
  const clean = identifier.toLowerCase().trim()
  try {
    const key = `st_role_labels_${clean}`
    const stored = localStorage.getItem(key)
    if (stored) return JSON.parse(stored)
  } catch (e) {}
  return DEFAULT_ROLE_LABELS
}

export function saveCompanyRoleLabels(identifier: string, labels: Record<Role, { title: string, description: string, color?: string }>) {
  if (!identifier || identifier === 'default' || identifier === 'global' || identifier === 'all') {
    try {
      localStorage.setItem('st_custom_role_labels', JSON.stringify(labels))
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('permissions-updated'))
        window.dispatchEvent(new Event('storage'))
      }
    } catch (e) {}
    return
  }
  const clean = identifier.toLowerCase().trim()
  try {
    const key = `st_role_labels_${clean}`
    localStorage.setItem(key, JSON.stringify(labels))
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('permissions-updated'))
      window.dispatchEvent(new Event('storage'))
    }
  } catch (e) {}
}
