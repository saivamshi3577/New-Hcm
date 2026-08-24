export interface CompanyPolicy {
  companyDomain: string
  // 1. Work Shift & Attendance Time Policy
  loginTime: string               // e.g. "09:00" (24hr)
  graceTimeMinutes: number        // e.g. 15 mins
  logoutTime: string              // e.g. "18:00" (24hr)
  workingDaysPreset: string       // "Mon to Fri (5 Days)", "Mon to Sat (6 Days)", "All 7 Days (7 Days)", "Custom"
  workingDays: string[]           // ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  enableGeolocationAttendance: boolean
  officeLatitude: number          // e.g. 12.9716
  officeLongitude: number         // e.g. 77.5946
  allowedRadiusMeters: number     // e.g. 200

  // 2. Sprint & Task Points Quota Policy
  sprintPointPeriod: 'Monthly' | 'Weekly'
  sprintPointQuota: number        // e.g. 60 pts/month or 50 pts/week
  maxTaskPoints: number           // e.g. 10 pts per single task

  // 3. SaaS Feature Modules & Permission Access Matrix
  enabledModules: {
    taskManagement: boolean
    geolocationAttendance: boolean
    skillTrack: boolean
    performanceAppraisals: boolean
    payroll: boolean
    teamChat: boolean
  }
}

export const DEFAULT_POLICY: CompanyPolicy = {
  companyDomain: 'default',
  loginTime: '09:00',
  graceTimeMinutes: 15,
  logoutTime: '18:00',
  workingDaysPreset: 'Mon to Fri (5 Days)',
  workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  enableGeolocationAttendance: true,
  officeLatitude: 12.9716,
  officeLongitude: 77.5946,
  allowedRadiusMeters: 200,
  sprintPointPeriod: 'Monthly',
  sprintPointQuota: 60,
  maxTaskPoints: 10,
  enabledModules: {
    taskManagement: true,
    geolocationAttendance: true,
    skillTrack: true,
    performanceAppraisals: true,
    payroll: true,
    teamChat: true,
  }
}

export function getCompanyPolicy(domain?: string): CompanyPolicy {
  if (!domain) domain = 'default'
  const key = `st_policy_${domain.toLowerCase().trim()}`
  try {
    const raw = localStorage.getItem(key)
    if (raw) {
      const parsed = JSON.parse(raw)
      return { ...DEFAULT_POLICY, ...parsed, companyDomain: domain }
    }
  } catch (e) {}

  return { ...DEFAULT_POLICY, companyDomain: domain }
}

export function saveCompanyPolicy(domain: string, policy: Partial<CompanyPolicy>): CompanyPolicy {
  const normDomain = (domain || 'default').toLowerCase().trim()
  const current = getCompanyPolicy(normDomain)
  const updated = { ...current, ...policy, companyDomain: normDomain }
  try {
    localStorage.setItem(`st_policy_${normDomain}`, JSON.stringify(updated))
  } catch (e) {}
  return updated
}

// Calculate distance in meters using Haversine formula
export function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3 // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c)
}

// Check if a given checkIn Date is late based on policy login time & grace minutes
export function isCheckInLate(checkInDate: Date, policy: CompanyPolicy): boolean {
  const [targetH, targetM] = (policy.loginTime || '09:00').split(':').map(Number)
  const checkInH = checkInDate.getHours()
  const checkInM = checkInDate.getMinutes()

  const targetTotalMins = targetH * 60 + targetM + (policy.graceTimeMinutes || 0)
  const checkInTotalMins = checkInH * 60 + checkInM

  return checkInTotalMins > targetTotalMins
}
