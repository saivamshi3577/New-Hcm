import { api } from '@/lib/api'
import type { ParsedQuestion } from './parser'

export interface Assessment {
  id: string
  title: string
  description: string | null
  created_by: string
  created_at: string
  due_date: string | null
  questions_count?: number
  points_total?: number
  assigned_employees?: string[]
}

export interface Question {
  id: string
  assessment_id: string
  question_text: string
  options: string[]
  correct_answer: string
  points: number
}

export interface Submission {
  id: string
  assessment_id: string
  user_id: string
  score: number
  total_points: number
  answers: Record<string, string>
  submitted_at: string
  user?: {
    full_name: string
    email: string
  }
}

let dbAvailable = true

// Helper to check if database error is due to missing tables
function isMissingTableError(err: any): boolean {
  if (!err) return false
  const msg = err.message || ''
  const code = err.code || ''
  return code === '42P01' || msg.includes('relation') && msg.includes('does not exist')
}

// ─── 1. FETCH ASSESSMENTS ────────────────────────────────────────────────
export async function fetchAssessments(userId: string, role: string): Promise<Assessment[]> {
  if (dbAvailable) {
    try {
      if (role === 'admin' || role === 'super_admin') {
        let data: any = []
        try {
          data = await api.get('/skill_assessments?created_by=' + userId + '&_select=*,assessment_questions(id,points),assessment_assignments(user_id)&_sort=-created_at')
        } catch (error: any) {
          if (isMissingTableError(error)) {
            dbAvailable = false
            throw error
          }
          throw error
        }

        return (data || []).map((item: any) => {
          const questions = item.assessment_questions || []
          const assignments = item.assessment_assignments || []
          return {
            id: item.id,
            title: item.title,
            description: item.description,
            created_by: item.created_by,
            created_at: item.created_at,
            due_date: item.due_date,
            questions_count: questions.length,
            points_total: questions.reduce((sum: number, q: any) => sum + (q.points || 0), 0),
            assigned_employees: assignments.map((a: any) => a.user_id)
          }
        })
      } else {
        // Employee: fetch assigned assessments
        let data: any = []
        try {
          data = await api.get('/assessment_assignments?user_id=' + userId + '&_select=assessment_id,skill_assessments(*,assessment_questions(id,points))')
        } catch (error: any) {
          if (isMissingTableError(error)) {
            dbAvailable = false
            throw error
          }
          throw error
        }

        return (data || [])
          .map((item: any) => {
            const sa = item.skill_assessments
            if (!sa) return null
            const questions = sa.assessment_questions || []
            return {
              id: sa.id,
              title: sa.title,
              description: sa.description,
              created_by: sa.created_by,
              created_at: sa.created_at,
              due_date: sa.due_date,
              questions_count: questions.length,
              points_total: questions.reduce((sum: number, q: any) => sum + (q.points || 0), 0),
              assigned_employees: [userId]
            }
          })
          .filter((item: any) => item !== null) as Assessment[]
      }
    } catch (err) {
      if (isMissingTableError(err)) {
        console.warn('Skill Track tables not found in Supabase. Falling back to localStorage.')
      } else {
        console.error('Error fetching assessments from DB:', err)
      }
    }
  }

  // LocalStorage Fallback
  const storedAssessments: Assessment[] = JSON.parse(localStorage.getItem('st_assessments') || '[]')
  if (role === 'admin' || role === 'super_admin') {
    return storedAssessments.filter(a => a.created_by === userId)
  } else {
    return storedAssessments.filter(a => a.assigned_employees?.includes(userId))
  }
}

// ─── 2. FETCH QUESTIONS ──────────────────────────────────────────────────
export async function fetchQuestions(assessmentId: string): Promise<Question[]> {
  if (dbAvailable) {
    try {
      const data: any = await api.get('/assessment_questions?assessment_id=' + assessmentId)
      return data || []
    } catch (err) {
      console.error('Error fetching questions from DB:', err)
    }
  }

  // LocalStorage Fallback
  const storedQuestions: Question[] = JSON.parse(localStorage.getItem('st_questions') || '[]')
  return storedQuestions.filter(q => q.assessment_id === assessmentId)
}

// ─── 3. CREATE ASSESSMENT ────────────────────────────────────────────────
export async function createAssessment(
  title: string,
  description: string,
  dueDate: string | null,
  createdBy: string,
  questions: ParsedQuestion[],
  assignedUserIds: string[]
): Promise<Assessment> {
  const newAssessmentId = crypto.randomUUID()
  const now = new Date().toISOString()

  const assessmentObj: Assessment = {
    id: newAssessmentId,
    title,
    description: description || null,
    created_by: createdBy,
    created_at: now,
    due_date: dueDate || null,
    questions_count: questions.length,
    points_total: questions.reduce((sum, q) => sum + q.points, 0),
    assigned_employees: assignedUserIds
  }

  if (dbAvailable) {
    try {
      // 1. Insert assessment record
      try {
        await api.post('/skill_assessments', {
          id: newAssessmentId,
          title,
          description: description || null,
          created_by: createdBy,
          due_date: dueDate || null
        })
      } catch (saError) {
        throw saError
      }

      // 2. Insert questions
      if (questions.length > 0) {
        const qRows = questions.map(q => ({
          assessment_id: newAssessmentId,
          question_text: q.question_text,
          options: q.options,
          correct_answer: q.correct_answer,
          points: q.points
        }))

        try {
          await api.post('/assessment_questions', qRows)
        } catch (qError) {
          throw qError
        }
      }

      // 3. Insert assignments
      if (assignedUserIds.length > 0) {
        const aRows = assignedUserIds.map(uid => ({
          assessment_id: newAssessmentId,
          user_id: uid
        }))

        try {
          await api.post('/assessment_assignments', aRows)
        } catch (aError) {
          throw aError
        }

        // Insert DB notifications for each candidate assigned to this exam
        try {
          const examNotifs = assignedUserIds.map(uid => ({
            user_id: uid,
            type: 'exam_assigned',
            content: `New skill assessment exam "${assessmentObj.title}" has been assigned to you by the Lead.`,
            is_read: false
          }))
          await api.post('/notifications', examNotifs)
        } catch (notiErr) {
          console.warn('Could not insert exam assignment notifications:', notiErr)
        }
      }

      return assessmentObj
    } catch (err) {
      console.error('Error creating assessment in DB:', err)
    }
  }

  // LocalStorage Fallback
  const storedAssessments: Assessment[] = JSON.parse(localStorage.getItem('st_assessments') || '[]')
  storedAssessments.push(assessmentObj)
  localStorage.setItem('st_assessments', JSON.stringify(storedAssessments))

  const storedQuestions: Question[] = JSON.parse(localStorage.getItem('st_questions') || '[]')
  questions.forEach(q => {
    storedQuestions.push({
      id: crypto.randomUUID(),
      assessment_id: newAssessmentId,
      question_text: q.question_text,
      options: q.options,
      correct_answer: q.correct_answer,
      points: q.points
    })
  })
  localStorage.setItem('st_questions', JSON.stringify(storedQuestions))

  return assessmentObj
}

// ─── 4. SUBMIT ASSESSMENT ────────────────────────────────────────────────
export async function submitAssessment(
  assessmentId: string,
  userId: string,
  score: number,
  totalPoints: number,
  answers: Record<string, string>
): Promise<Submission> {
  const newSubmissionId = crypto.randomUUID()
  const now = new Date().toISOString()

  const submissionObj: Submission = {
    id: newSubmissionId,
    assessment_id: assessmentId,
    user_id: userId,
    score,
    total_points: totalPoints,
    answers,
    submitted_at: now
  }

  if (dbAvailable) {
    try {
      await api.post('/assessment_submissions', {
        id: newSubmissionId,
        assessment_id: assessmentId,
        user_id: userId,
        score,
        total_points: totalPoints,
        answers
      })
      return submissionObj
    } catch (err) {
      console.error('Error submitting assessment in DB:', err)
    }
  }

  // LocalStorage Fallback
  const storedSubmissions: Submission[] = JSON.parse(localStorage.getItem('st_submissions') || '[]')
  // Avoid duplicate submissions
  const index = storedSubmissions.findIndex(s => s.assessment_id === assessmentId && s.user_id === userId)
  if (index !== -1) {
    storedSubmissions[index] = submissionObj
  } else {
    storedSubmissions.push(submissionObj)
  }
  localStorage.setItem('st_submissions', JSON.stringify(storedSubmissions))

  return submissionObj
}

// ─── 5. FETCH SUBMISSIONS (FOR ADMIN) ────────────────────────────────────
export async function fetchSubmissions(assessmentId: string): Promise<Submission[]> {
  if (dbAvailable) {
    try {
      let data: any = []
      try {
        data = await api.get('/assessment_submissions?assessment_id=' + assessmentId + '&_select=*,user:users(full_name,email)')
      } catch (error) { throw error }
      return (data || []).map((s: any) => ({
        id: s.id,
        assessment_id: s.assessment_id,
        user_id: s.user_id,
        score: s.score,
        total_points: s.total_points,
        answers: s.answers,
        submitted_at: s.submitted_at,
        user: s.user ? {
          full_name: s.user.full_name,
          email: s.user.email
        } : undefined
      }))
    } catch (err) {
      console.error('Error fetching submissions from DB:', err)
    }
  }

  // LocalStorage Fallback
  const storedSubmissions: Submission[] = JSON.parse(localStorage.getItem('st_submissions') || '[]')
  const submissions = storedSubmissions.filter(s => s.assessment_id === assessmentId)
  
  // Try to match with local profiles if possible, or load user data
  // We can fetch local users list or store names
  const localUsersListStr = localStorage.getItem('mock_users') || '[]'
  const localUsersList = JSON.parse(localUsersListStr)

  return submissions.map(s => {
    const userMatch = localUsersList.find((u: any) => u.id === s.user_id)
    return {
      ...s,
      user: userMatch ? {
        full_name: userMatch.full_name,
        email: userMatch.email
      } : {
        full_name: 'Squad Member',
        email: 'member@workspace.com'
      }
    }
  })
}

// ─── 6. FETCH SINGLE USER SUBMISSION ─────────────────────────────────────
export async function fetchUserSubmission(assessmentId: string, userId: string): Promise<Submission | null> {
  if (dbAvailable) {
    try {
      let data: any = null
      try {
        const res: any = await api.get('/assessment_submissions?assessment_id=' + assessmentId + '&user_id=' + userId + '&_limit=1&_single=true')
        data = res?.data || res
      } catch (error) { throw error }
      return data || null
    } catch (err) {
      console.error('Error fetching user submission from DB:', err)
    }
  }

  // LocalStorage Fallback
  const storedSubmissions: Submission[] = JSON.parse(localStorage.getItem('st_submissions') || '[]')
  return storedSubmissions.find(s => s.assessment_id === assessmentId && s.user_id === userId) || null
}

// ─── 7. DELETE ASSESSMENT (FOR ADMIN) ─────────────────────────────────────
export async function deleteAssessment(id: string): Promise<boolean> {
  if (dbAvailable) {
    try {
      // Delete related records first to handle potential lack of ON DELETE CASCADE
      try { await api.delete('/assessment_submissions?assessment_id=' + id) } catch (e) {}
      try { await api.delete('/assessment_assignments?assessment_id=' + id) } catch (e) {}
      try { await api.delete('/assessment_questions?assessment_id=' + id) } catch (e) {}

      try {
        await api.delete('/skill_assessments/' + id)
      } catch (error) {
        throw error
      }
    } catch (err) {
      console.error('Error deleting assessment in DB:', err)
      throw err // Rethrow to let the UI know about the failure
    }
  }

  // LocalStorage Cleanup (Cascade-like delete)
  try {
    const storedAssessments: Assessment[] = JSON.parse(localStorage.getItem('st_assessments') || '[]')
    const updatedAssessments = storedAssessments.filter(a => a.id !== id)
    localStorage.setItem('st_assessments', JSON.stringify(updatedAssessments))

    const storedQuestions: any[] = JSON.parse(localStorage.getItem('st_questions') || '[]')
    const updatedQuestions = storedQuestions.filter(q => q.assessment_id !== id)
    localStorage.setItem('st_questions', JSON.stringify(updatedQuestions))

    const storedSubmissions: Submission[] = JSON.parse(localStorage.getItem('st_submissions') || '[]')
    const updatedSubmissions = storedSubmissions.filter(s => s.assessment_id !== id)
    localStorage.setItem('st_submissions', JSON.stringify(updatedSubmissions))
  } catch (e) {
    console.error('Error cleaning up local storage on assessment delete:', e)
  }

  return true
}

// ─── 8. DELETE CANDIDATE ASSIGNMENT (FOR ADMIN) ───────────────────────────
export async function deleteCandidateAssignment(assessmentId: string, userId: string): Promise<boolean> {
  if (dbAvailable) {
    try {
      // 1. Delete submission if exists
      try { await api.delete('/assessment_submissions?assessment_id=' + assessmentId + '&user_id=' + userId) } catch(e) {}

      // 2. Delete assignment
      try {
        await api.delete('/assessment_assignments?assessment_id=' + assessmentId + '&user_id=' + userId)
      } catch (assignErr) {
        throw assignErr
      }
    } catch (err) {
      console.error('Error deleting candidate assignment in DB:', err)
      throw err
    }
  }

  // LocalStorage Fallback
  try {
    const storedAssessments: Assessment[] = JSON.parse(localStorage.getItem('st_assessments') || '[]')
    const index = storedAssessments.findIndex(a => a.id === assessmentId)
    if (index !== -1) {
      const updatedAssigned = (storedAssessments[index].assigned_employees || []).filter(uid => uid !== userId)
      storedAssessments[index].assigned_employees = updatedAssigned
      localStorage.setItem('st_assessments', JSON.stringify(storedAssessments))
    }

    const storedSubmissions: Submission[] = JSON.parse(localStorage.getItem('st_submissions') || '[]')
    const updatedSubmissions = storedSubmissions.filter(s => !(s.assessment_id === assessmentId && s.user_id === userId))
    localStorage.setItem('st_submissions', JSON.stringify(updatedSubmissions))
  } catch (e) {
    console.error('Error cleaning up local storage on candidate delete:', e)
  }

  return true
}

