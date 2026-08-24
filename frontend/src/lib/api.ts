/**
 * api.ts — Centralized Axios API client for the Express + PostgreSQL backend.
 * All HTTP requests are handled via the Axios instance with automated auth headers.
 */

import axios, { type AxiosInstance } from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// ─── Create Axios Instance ──────────────────────────────────────────────────
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach Bearer token from localStorage or sessionStorage to every request
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Standardize response data extraction & error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Request failed'
    const customError = new Error(message) as Error & { status?: number }
    if (error.response?.status) {
      customError.status = error.response.status
    }
    return Promise.reject(customError)
  }
)

// ─── Token Helpers ──────────────────────────────────────────────────────────
export function getToken(): string | null {
  return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
}

export function setToken(token: string, rememberMe: boolean = false) {
  if (rememberMe) {
    localStorage.setItem('auth_token', token)
    sessionStorage.removeItem('auth_token')
  } else {
    sessionStorage.setItem('auth_token', token)
    localStorage.removeItem('auth_token')
  }
}

export function clearToken() {
  localStorage.removeItem('auth_token')
  sessionStorage.removeItem('auth_token')
}

// ─── Safe Array Extractor ──────────────────────────────────────────────────
export function safeArray<T = any>(input: any, primaryKey?: string): T[] {
  if (!input) return []
  if (Array.isArray(input)) return input
  if (primaryKey && Array.isArray(input[primaryKey])) return input[primaryKey]
  if (Array.isArray(input.data)) return input.data
  if (Array.isArray(input.companies)) return input.companies
  if (Array.isArray(input.employees)) return input.employees
  if (Array.isArray(input.attendance)) return input.attendance
  if (Array.isArray(input.tasks)) return input.tasks
  if (Array.isArray(input.leaves)) return input.leaves
  if (Array.isArray(input.projects)) return input.projects
  if (Array.isArray(input.announcements)) return input.announcements
  if (Array.isArray(input.teams)) return input.teams
  if (Array.isArray(input.departments)) return input.departments
  if (Array.isArray(input.sprints)) return input.sprints
  if (Array.isArray(input.payslips)) return input.payslips
  if (Array.isArray(input.appraisals)) return input.appraisals
  if (Array.isArray(input.notifications)) return input.notifications
  if (Array.isArray(input.reactions)) return input.reactions
  if (Array.isArray(input.logs)) return input.logs
  return []
}

// ─── Axios Wrapper Methods ─────────────────────────────────────────────────
export const api = {
  get: async <T = any>(url: string, config?: any): Promise<T> => {
    const response = await apiClient.get<T>(url, config)
    return response.data
  },

  post: async <T = any>(url: string, data?: any, config?: any): Promise<T> => {
    const response = await apiClient.post<T>(url, data, config)
    return response.data
  },

  put: async <T = any>(url: string, data?: any, config?: any): Promise<T> => {
    const response = await apiClient.put<T>(url, data, config)
    return response.data
  },

  patch: async <T = any>(url: string, data?: any, config?: any): Promise<T> => {
    const response = await apiClient.patch<T>(url, data, config)
    return response.data
  },

  delete: async <T = any>(url: string, config?: any): Promise<T> => {
    const response = await apiClient.delete<T>(url, config)
    return response.data
  },
}

// ─── Auth API ───────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ user: any; token: string }>('/auth/login', { email, password }),

  signup: (email: string, password: string, fullName: string, meta?: Record<string, any>) =>
    api.post<{ user: any; token: string }>('/auth/signup', { email, password, fullName, ...meta }),

  logout: () => api.post('/auth/logout'),

  me: () => api.get<{ user: any }>('/auth/me'),
}

// ─── Employee / HRMS API ────────────────────────────────────────────────────
export const employeeApi = {
  getAll: (params?: string) => api.get(`/employee${params ? `?${params}` : ''}`),
  getById: (id: string) => api.get(`/employee/${id}`),
  create: (data: any) => api.post('/employee', data),
  update: (id: string, data: any) => api.put(`/employee/${id}`, data),
  delete: (id: string) => api.delete(`/employee/${id}`),

  // Attendance
  checkIn: (id: string) => api.post(`/employee/${id}/attendance/check-in`),
  checkOut: (id: string) => api.post(`/employee/${id}/attendance/check-out`),
  getAttendance: (id: string, params?: string) =>
    api.get(`/employee/${id}/attendance${params ? `?${params}` : ''}`),

  // Leaves
  applyLeave: (id: string, data: any) => api.post(`/employee/${id}/leaves`, data),
  getLeaves: (id: string) => api.get(`/employee/${id}/leaves`),
  updateLeaveStatus: (leaveId: string, data: any) =>
    api.put(`/employee/leaves/${leaveId}/status`, data),
}

// ─── Task / TMS API ─────────────────────────────────────────────────────────
export const taskApi = {
  getProjects: () => api.get('/task/projects'),
  createProject: (data: any) => api.post('/task/projects', data),
  getSprints: (projectId: string) => api.get(`/task/projects/${projectId}/sprints`),
  createSprint: (projectId: string, data: any) =>
    api.post(`/task/projects/${projectId}/sprints`, data),
  getTasks: (params?: string) => api.get(`/task${params ? `?${params}` : ''}`),
  createTask: (data: any) => api.post('/task', data),
  updateTask: (id: string, data: any) => api.put(`/task/${id}`, data),
  deleteTask: (id: string) => api.delete(`/task/${id}`),
}

// ─── Payroll / PMS API ──────────────────────────────────────────────────────
export const payrollApi = {
  getPayslips: (params?: string) =>
    api.get(`/payroll/payslips${params ? `?${params}` : ''}`),
  generatePayslips: (data: any) => api.post('/payroll/payslips/generate', data),
  downloadPayslip: (id: string) => api.get(`/payroll/payslips/${id}/download`),
  updatePayslipStatus: (id: string, status: string) => 
    api.put(`/payroll/payslips/${id}/status`, { status }),
}

// ─── Performance / Appraisal API ────────────────────────────────────────────
export const performanceApi = {
  getAppraisals: (params?: string) =>
    api.get(`/performance/appraisals${params ? `?${params}` : ''}`),
  createAppraisal: (data: any) => api.post('/performance/appraisals', data),
  getMyReviews: () => api.get('/performance/appraisals/my-reviews'),
  updateAppraisal: (id: string, data: any) =>
    api.put(`/performance/appraisals/${id}`, data),
}

// ─── Document API ───────────────────────────────────────────────────────────
export const documentApi = {
  getAll: (params?: string) =>
    api.get(`/document${params ? `?${params}` : ''}`),
  getById: (id: string) => api.get(`/document/${id}`),
  create: (data: any) => api.post('/document', data),
  delete: (id: string) => api.delete(`/document/${id}`),
}

// ─── Chat API ───────────────────────────────────────────────────────────────
export const chatApi = {
  getRooms: () => api.get('/chat/rooms'),
  createRoom: (data: any) => api.post('/chat/rooms', data),
  getMessages: (roomId: string) => api.get(`/chat/rooms/${roomId}/messages`),
  sendMessage: (roomId: string, data: any) =>
    api.post(`/chat/rooms/${roomId}/messages`, data),
}

export default api
