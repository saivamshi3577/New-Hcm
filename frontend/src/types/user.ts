export type Role = 'super_admin' | 'admin' | 'hr' | 'team_lead' | 'employee'

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role_id: string | null
  department_id: string | null
  team_id: string | null
  manager_id?: string | null
  created_at: string
  role?: {
    id: string
    name: Role
    permissions: Record<string, boolean>
  }
  department?: {
    id: string
    name: string
    description: string | null
  }
  team?: {
    id: string
    name: string
    lead_id: string
  }
  joining_date?: string | null
  birthday?: string | null
  on_break?: boolean
}

export interface Department {
  id: string
  name: string
  description: string | null
}

export interface Team {
  id: string
  name: string
  department_id: string | null
  lead_id: string | null
  created_at: string
  lead?: {
    full_name: string | null
    email: string
  }
}

export interface Announcement {
  id: string
  title: string
  content: string
  created_by: string
  is_pinned: boolean
  created_at: string
  creator?: {
    full_name: string | null
    email: string
  }
}
