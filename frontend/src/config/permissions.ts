import type { Role } from '@/types/user'

export const Permission = {
  // User management
  MANAGE_ADMINS: 'manage_admins',
  MANAGE_EMPLOYEES: 'manage_employees',
  VIEW_ALL_USERS: 'view_all_users',

  // Department & Team
  CREATE_DEPARTMENT: 'create_department',
  CREATE_TEAM: 'create_team',
  ASSIGN_TEAM_MEMBERS: 'assign_team_members',

  // Tasks
  CREATE_TASKS: 'create_tasks',
  ASSIGN_TASKS: 'assign_tasks',
  VIEW_ALL_TASKS: 'view_all_tasks',
  VIEW_OWN_TASKS: 'view_own_tasks',
  UPDATE_TASK_STATUS: 'update_task_status',
  DELETE_TASKS: 'delete_tasks',
  APPROVE_TASKS: 'approve_tasks',

  // Projects
  CREATE_PROJECTS: 'create_projects',
  MANAGE_PROJECTS: 'manage_projects',

  // Analytics & Reports
  VIEW_ORG_ANALYTICS: 'view_org_analytics',
  VIEW_TEAM_ANALYTICS: 'view_team_analytics',
  VIEW_OWN_ANALYTICS: 'view_own_analytics',
  COMPARE_TEAMS: 'compare_teams',
  EXPORT_REPORTS: 'export_reports',

  // Admin & Governance features
  VIEW_ACTIVITY_LOGS: 'view_activity_logs',
  MANAGE_ANNOUNCEMENTS: 'manage_announcements',
  VIEW_ANNOUNCEMENTS: 'view_announcements',
  MANAGE_SETTINGS: 'manage_settings',
  MANAGE_ROLES: 'manage_roles',

  // Employee features
  VIEW_NOTIFICATIONS: 'view_notifications',
  VIEW_OWN_PERFORMANCE: 'view_own_performance',
  MANAGE_OWN_PROFILE: 'manage_own_profile',
  MANAGE_PAYROLL: 'manage_payroll',

  // Policies
  VIEW_POLICIES: 'view_policies',
  MANAGE_POLICIES: 'manage_policies',
} as const

export type Permission = typeof Permission[keyof typeof Permission]

// ─── Permission Matrix (5 Roles) ─────────────────────────────────────────────

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  // 1. Super Admin: Executive Platform Governance & Subscription
  super_admin: [
    Permission.MANAGE_ADMINS,
    Permission.MANAGE_ROLES,
    Permission.MANAGE_SETTINGS,
    Permission.VIEW_ORG_ANALYTICS,
    Permission.VIEW_ACTIVITY_LOGS,
    Permission.MANAGE_ANNOUNCEMENTS,
    Permission.VIEW_NOTIFICATIONS,
    Permission.MANAGE_OWN_PROFILE,
    Permission.VIEW_POLICIES,
    Permission.MANAGE_POLICIES,
  ],

  // 2. Admin: Organization Administration & Department Setup
  admin: [
    Permission.MANAGE_SETTINGS,
    Permission.MANAGE_ROLES,
    Permission.CREATE_DEPARTMENT,
    Permission.CREATE_TEAM,
    Permission.MANAGE_EMPLOYEES,
    Permission.VIEW_ALL_USERS,
    Permission.VIEW_ORG_ANALYTICS,
    Permission.EXPORT_REPORTS,
    Permission.MANAGE_ANNOUNCEMENTS,
    Permission.VIEW_ACTIVITY_LOGS,
    Permission.VIEW_NOTIFICATIONS,
    Permission.MANAGE_OWN_PROFILE,
    Permission.VIEW_POLICIES,
    Permission.MANAGE_POLICIES,
  ],

  // 3. HR: Transferred from Super Admin HR management (Employees, Leaves, Attendance, Payroll, Appraisals, Policies)
  hr: [
    Permission.MANAGE_EMPLOYEES,
    Permission.VIEW_ALL_USERS,
    Permission.CREATE_DEPARTMENT,
    Permission.CREATE_TEAM,
    Permission.VIEW_ACTIVITY_LOGS,
    Permission.MANAGE_ANNOUNCEMENTS,
    Permission.EXPORT_REPORTS,
    Permission.MANAGE_PAYROLL,
    Permission.VIEW_NOTIFICATIONS,
    Permission.VIEW_OWN_PERFORMANCE,
    Permission.MANAGE_OWN_PROFILE,
    Permission.VIEW_POLICIES,
    Permission.MANAGE_POLICIES,
  ],

  // 4. Team Lead (TL): Transferred from Admin TL management (Projects, Sprints, Kanban Tasks, Team Reports, Policies)
  team_lead: [
    Permission.CREATE_PROJECTS,
    Permission.MANAGE_PROJECTS,
    Permission.CREATE_TASKS,
    Permission.ASSIGN_TASKS,
    Permission.VIEW_ALL_TASKS,
    Permission.VIEW_OWN_TASKS,
    Permission.UPDATE_TASK_STATUS,
    Permission.DELETE_TASKS,
    Permission.APPROVE_TASKS,
    Permission.ASSIGN_TEAM_MEMBERS,
    Permission.VIEW_TEAM_ANALYTICS,
    Permission.VIEW_OWN_ANALYTICS,
    Permission.EXPORT_REPORTS,
    Permission.VIEW_NOTIFICATIONS,
    Permission.MANAGE_OWN_PROFILE,
    Permission.VIEW_POLICIES,
  ],

  // 5. Employee: Standard Individual Workspace (Tasks, Performance, Documents, Policies)
  employee: [
    Permission.VIEW_OWN_TASKS,
    Permission.UPDATE_TASK_STATUS,
    Permission.VIEW_OWN_ANALYTICS,
    Permission.VIEW_NOTIFICATIONS,
    Permission.VIEW_OWN_PERFORMANCE,
    Permission.MANAGE_OWN_PROFILE,
    Permission.VIEW_POLICIES,
  ],
}
