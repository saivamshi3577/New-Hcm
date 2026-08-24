import React, { useState, useEffect, useRef } from 'react'
import {
  Award, GraduationCap, Plus, Trash2,
  XCircle, ArrowLeft, UploadCloud, FileText, Check, ChevronRight,
  Calendar, Clock, Sparkles, HelpCircle, RefreshCw, BarChart2, Eye, ShieldAlert, X
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuthStore } from '@/store/authStore'
import { useParams, useNavigate } from 'react-router-dom'
import { useUnreadStore } from '@/store/unreadStore'
import { api, getToken } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import {
  fetchAssessments,
  fetchQuestions,
  createAssessment,
  submitAssessment,
  fetchSubmissions,
  fetchUserSubmission,
  deleteAssessment,
  deleteCandidateAssignment
} from './skillTrackService'
import type { Assessment, Question, Submission } from './skillTrackService'
import { parsePlainText, parseCSVText, parseDocxFile } from './parser'
import type { ParsedQuestion } from './parser'

export default function SkillTrack() {
  const { user, role } = useAuthStore()
  const { toast } = useToast()
  const { assessmentId } = useParams()
  const navigate = useNavigate()

  const isAdmin = role === 'admin' || role === 'super_admin'
  const basePath = role === 'employee' ? '/employee/skill-track' : '/admin/skill-track'

  const themeMap = {
    teal: {
      headerBg: 'bg-gradient-to-r from-teal-50/50 to-white',
      headerBorder: 'border-teal-100/50',
      badgeBg: 'bg-teal-100 border-teal-200 text-teal-800',
      textAccent: 'text-teal-600',
      primaryBg: 'bg-teal-600 hover:bg-teal-700',
      resultsGradient: 'from-teal-500 via-emerald-500 to-green-500',
      resultsIconBg: 'bg-teal-50 border-teal-100 text-teal-600',
      resultsScoreText: 'text-teal-600'
    },
    violet: {
      headerBg: 'bg-gradient-to-r from-violet-50/50 to-white',
      headerBorder: 'border-violet-100/50',
      badgeBg: 'bg-violet-100 border-violet-200 text-violet-800',
      textAccent: 'text-violet-600',
      primaryBg: 'bg-violet-600 hover:bg-violet-700',
      resultsGradient: 'from-violet-500 via-indigo-500 to-purple-500',
      resultsIconBg: 'bg-violet-50 border-violet-100 text-violet-600',
      resultsScoreText: 'text-violet-600'
    }
  }

  const theme = isAdmin ? themeMap.teal : themeMap.violet
  const primaryBg = theme.primaryBg
  const textAccent = theme.textAccent
  const currentMonthKey = new Date().toLocaleString('default', { month: 'short', year: 'numeric' })
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey)
  const [availableSkillTrackMonths, setAvailableSkillTrackMonths] = useState<string[]>([currentMonthKey, 'All Time'])

  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'exam' | 'results' | 'reports'>('list')
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null)
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending')
  const [isTakeModalOpen, setIsTakeModalOpen] = useState(false)
  const [assessmentToTake, setAssessmentToTake] = useState<Assessment | null>(null)

  // ─── ADMIN STATES ──────────────────────────────────────────────────────
  const [employeesList, setEmployeesList] = useState<any[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newDueDate, setNewDueDate] = useState('')
  const [assignedEmployees, setAssignedEmployees] = useState<string[]>([])
  const [creatorQuestions, setCreatorQuestions] = useState<ParsedQuestion[]>([])
  const [bulkInput, setBulkInput] = useState('')
  const [uploadMode, setUploadMode] = useState<'manual' | 'bulk_text' | 'file'>('manual')
  const [reportsSubmissions, setReportsSubmissions] = useState<Submission[]>([])
  const [allSubmissions, setAllSubmissions] = useState<Submission[]>([])
  const [viewingUserSubmission, setViewingUserSubmission] = useState<Submission | null>(null)

  // Delete States
  const [assessmentToDelete, setAssessmentToDelete] = useState<string | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [candidateToDelete, setCandidateToDelete] = useState<string | null>(null)
  const [isCandidateDeleteModalOpen, setIsCandidateDeleteModalOpen] = useState(false)

  // Manual Question Builder State


  
  const [manualQuestion, setManualQuestion] = useState('')
  const [manualOptions, setManualOptions] = useState<string[]>(['', ''])
  const [manualCorrect, setManualCorrect] = useState('')
  const [manualPoints, setManualPoints] = useState(1)

  // ─── EMPLOYEE EXAM STATES ──────────────────────────────────────────────
  const [examQuestions, setExamQuestions] = useState<Question[]>([])
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({})
  const [employeeSubmissions, setEmployeeSubmissions] = useState<Record<string, Submission>>({}) // assessmentId -> Submission
  const [resultsSubmission, setResultsSubmission] = useState<Submission | null>(null)

  // Stable shuffles
  const shuffledQuestionsRef = useRef<Question[]>([])
  const shuffledOptionsRef = useRef<Record<string, string[]>>({}) // questionId -> options

  // Single-question view & Timer states
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [examTimeRemaining, setExamTimeRemaining] = useState<number | null>(null)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [showQuitConfirm, setShowQuitConfirm] = useState(false)

  const isSubmittingRef = useRef(false)
  const isQuittingRef = useRef(false)

  const userAnswersRef = useRef(userAnswers)
  const examQuestionsRef = useRef(examQuestions)
  const selectedAssessmentRef = useRef(selectedAssessment)
  const userRef = useRef(user)

  useEffect(() => {
    userAnswersRef.current = userAnswers
  }, [userAnswers])

  useEffect(() => {
    examQuestionsRef.current = examQuestions
  }, [examQuestions])

  useEffect(() => {
    selectedAssessmentRef.current = selectedAssessment
  }, [selectedAssessment])

  useEffect(() => {
    userRef.current = user
  }, [user])

  const resumeFullscreen = async () => {
    try {
      const elem = document.documentElement
      if (elem.requestFullscreen) {
        await elem.requestFullscreen()
      } else if ((elem as any).webkitRequestFullscreen) {
        await (elem as any).webkitRequestFullscreen()
      } else if ((elem as any).msRequestFullscreen) {
        await (elem as any).msRequestFullscreen()
      }
      
      // Re-lock Escape key to keep browser in fullscreen
      const navAny = navigator as any
      if (navAny.keyboard && typeof navAny.keyboard.lock === 'function') {
        await navAny.keyboard.lock(['Escape'])
      }
      setShowExitConfirm(false)
    } catch (err) {
      console.warn("Fullscreen resume error:", err)
      setShowExitConfirm(false)
    }
  }

  const handleQuitExam = async () => {
    isQuittingRef.current = true
    setShowQuitConfirm(false)
    setShowExitConfirm(false)

    // Unlock keyboard lock if active
    const navAny = navigator as any
    if (navAny.keyboard && typeof navAny.keyboard.unlock === 'function') {
      try {
        navAny.keyboard.unlock()
      } catch (e) {
        console.warn(e)
      }
    }

    // Exit fullscreen if still in it
    try {
      if (
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullscreenElement ||
        (document as any).msFullscreenElement
      ) {
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen()
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen()
        }
      }
    } catch (err) {
      console.warn("Error exiting fullscreen:", err)
    }








    
    // Reset view states
    setCurrentView('list')
    setSelectedAssessment(null)
    setViewingUserSubmission(null)
    setUserAnswers({})
    setExamQuestions([])
    setExamTimeRemaining(null)
    isSubmittingRef.current = false
    isQuittingRef.current = false
    loadInitialData()
  }

  // Intercept Escape key to directly submit exam without warning popup
  useEffect(() => {
    if (currentView !== 'exam') return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        submitExamNow(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [currentView])

  // Manage class on body to hide layout components when in exam
  useEffect(() => {
    if (currentView === 'exam') {
      document.body.classList.add('is-taking-exam')
    } else {
      document.body.classList.remove('is-taking-exam')
    }
    
    return () => {
      document.body.classList.remove('is-taking-exam')
    }
  }, [currentView])

  // Fullscreen exit and visibility/minimize change handler: Auto-submit on violation/minimize
  useEffect(() => {
    if (currentView !== 'exam') return

    const handleFullscreenChange = () => {
      const isFs = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullscreenElement ||
        (document as any).msFullscreenElement
      )

      if (!isFs && currentView === 'exam' && !isSubmittingRef.current && !isQuittingRef.current) {
        submitExamNow(true)
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && currentView === 'exam' && !isSubmittingRef.current && !isQuittingRef.current) {
        submitExamNow(true)
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [currentView])

  // Page unload (refresh, sleep, shutdown) handler to auto-submit
  useEffect(() => {
    const handleUnloadSubmit = () => {
      const isSubmitting = isSubmittingRef.current
      const isQuitting = isQuittingRef.current
      const currentQuestions = examQuestionsRef.current
      const currentAnswers = userAnswersRef.current
      const currentAssessment = selectedAssessmentRef.current
      const currentUser = userRef.current

      if (currentView === 'exam' && currentAssessment && currentUser && !isSubmitting && !isQuitting) {
        isSubmittingRef.current = true

        // Calculate score
        let score = 0
        let totalPoints = 0
        currentQuestions.forEach(q => {
          totalPoints += q.points
          const ans = currentAnswers[q.id]
          if (ans && ans === q.correct_answer) {
            score += q.points
          }
        })

        // Prepare body
        const submissionBody = {
          id: crypto.randomUUID(),
          assessment_id: currentAssessment.id,
          user_id: currentUser.id,
          score,
          total_points: totalPoints,
          answers: currentAnswers
        }

        const url = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api') + '/assessment_submissions'
        fetch(url, {
          method: 'POST',
          keepalive: true,
          headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(submissionBody)
        }).catch(err => console.error("Unload submit failed:", err))
      }
    }

    window.addEventListener('beforeunload', handleUnloadSubmit)
    window.addEventListener('unload', handleUnloadSubmit)
    return () => {
      window.removeEventListener('beforeunload', handleUnloadSubmit)
      window.removeEventListener('unload', handleUnloadSubmit)
    }
  }, [currentView])

  // Timer countdown handler: Auto-submit on expiry
  useEffect(() => {
    if (currentView !== 'exam' || examTimeRemaining === null || examTimeRemaining <= 0) return

    const timerId = setInterval(() => {
      setExamTimeRemaining(prev => {
        if (prev === null) return null
        if (prev <= 1) {
          clearInterval(timerId)
          toast({
            title: "Time expired",
            description: "The exam timer has run out. Your answers were submitted automatically.",
            variant: "destructive"
          })
          submitExamNow(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timerId)
  }, [currentView, examTimeRemaining])

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return '00:00'
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    if (user) {
      loadInitialData()
      if (isAdmin) {
        fetchEmployees()
      } else {
        // Automatically mark all unread exam_assigned notifications as read for this employee
        const markExamNotificationsRead = async () => {
          try {
            let unreadExamNotifs: any = []
            try {
              unreadExamNotifs = await api.get('/notifications?user_id=' + user.id + '&type=exam_assigned&is_read=false&_select=id')
            } catch (e) {}

            if (unreadExamNotifs && unreadExamNotifs.length > 0) {
              const ids = unreadExamNotifs.map((n: any) => n.id)
              try {
                await api.put('/notifications?id_in=' + ids.join(','), { is_read: true })
                await useUnreadStore.getState().fetchCounts(user.id)
              } catch (e) {}
            }
          } catch (err) {
            console.error('Error auto-marking exam notifications as read:', err)
          }
        }
        markExamNotificationsRead()
      }
    }
  }, [user, role])

  useEffect(() => {
    if (assessmentId && assessments.length > 0) {
      const found = assessments.find(a => a.id === assessmentId)
      if (found) {
        handleViewReports(found)
      } else {
        toast({
          title: 'Assessment not found',
          description: 'Could not load reports for the requested assessment.',
          variant: 'destructive'
        })
        navigate(basePath)
      }
    } else if (!assessmentId && currentView === 'reports') {
      setCurrentView('list')
      setSelectedAssessment(null)
    }
  }, [assessmentId, assessments, basePath])

  const loadInitialData = async () => {
    if (!user) return
    const shouldShowLoader = assessments.length === 0
    if (shouldShowLoader) {
      setLoading(true)
    }
    try {
      const list = await fetchAssessments(user.id, role || 'employee')
      setAssessments(list)

      // If employee, prefetch submissions to know completed exams
      if (!isAdmin) {
        const subs: Record<string, Submission> = {}
        for (const ass of list) {
          const sub = await fetchUserSubmission(ass.id, user.id)
          if (sub) {
            subs[ass.id] = sub
          }
        }
        setEmployeeSubmissions(subs)
      }
    } catch (err) {
      console.error('Error loading assessments:', err)
    } finally {
      if (shouldShowLoader) {
        setLoading(false)
      }
    }
  }

  const fetchEmployees = async () => {
    try {
      let members: any = []
      try {
        members = await api.get('/employee?manager_id=' + user?.id + '&_select=id,full_name,email')
      } catch (membersErr) {
        throw membersErr
      }

      if (members && members.length > 0) {
        setEmployeesList(members)
      } else {
        // Fallback: fetch all employees in DB
        try {
          const allUsers: any = await api.get('/employee?_select=id,full_name,email')
          setEmployeesList(allUsers || [])
        } catch (e) {
          setEmployeesList([])
        }
      }
    } catch (err) {
      console.warn('Failed to load employees for assignment list:', err)
      setEmployeesList([])
    }
  }

  // ─── PARSING FILE / PLAIN TEXT ─────────────────────────────────────────
  const handleParseText = () => {
    if (!bulkInput.trim()) return
    const parsed = parsePlainText(bulkInput)
    if (parsed.length === 0) {
      toast({
        title: 'Parsing failed',
        description: 'Could not identify any questions. Check format guidelines.',
        variant: 'destructive'
      })
      return
    }
    setCreatorQuestions([...creatorQuestions, ...parsed])
    setBulkInput('')
    toast({
      title: 'Parsing successful',
      description: `Automatically extracted ${parsed.length} questions from text.`
    })
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      let parsed: ParsedQuestion[] = []
      if (file.name.endsWith('.csv')) {
        const text = await file.text()
        parsed = parseCSVText(text)
      } else if (file.name.endsWith('.docx')) {
        parsed = await parseDocxFile(file)
      } else if (file.name.endsWith('.txt')) {
        const text = await file.text()
        parsed = parsePlainText(text)
      } else {
        toast({
          title: 'Unsupported file type',
          description: 'Please upload a CSV, TXT, or DOCX Word document.',
          variant: 'destructive'
        })
        return
      }

      if (parsed.length === 0) {
        toast({
          title: 'Parsing failed',
          description: 'Could not find any formatted questions in the uploaded file.',
          variant: 'destructive'
        })
        return
      }

      setCreatorQuestions([...creatorQuestions, ...parsed])
      toast({
        title: 'File Parsed Successfully',
        description: `Imported ${parsed.length} questions from ${file.name}.`
      })
    } catch (err) {
      console.error(err)
      toast({
        title: 'File read error',
        description: 'An error occurred while reading the file structure.',
        variant: 'destructive'
      })
    }
  }

  // ─── MANUAL QUESTION CREATION ──────────────────────────────────────────
  const handleAddManualQuestion = () => {
    if (!manualQuestion.trim()) return
    const cleanedOptions = manualOptions.map(o => o.trim()).filter(o => o.length > 0)
    if (cleanedOptions.length < 2) {
      toast({
        title: 'Invalid options',
        description: 'Please enter at least 2 non-empty options.',
        variant: 'destructive'
      })
      return
    }

    const correctAns = manualCorrect || cleanedOptions[0]
    if (!cleanedOptions.includes(correctAns)) {
      toast({
        title: 'Invalid correct answer',
        description: 'The correct answer must match one of the options.',
        variant: 'destructive'
      })
      return
    }

    const newQ: ParsedQuestion = {
      question_text: manualQuestion.trim(),
      options: cleanedOptions,
      correct_answer: correctAns,
      points: manualPoints
    }

    setCreatorQuestions([...creatorQuestions, newQ])
    setManualQuestion('')
    setManualOptions(['', ''])
    setManualCorrect('')
    setManualPoints(1)
  }

  const handleRemoveQuestion = (idx: number) => {
    setCreatorQuestions(creatorQuestions.filter((_, i) => i !== idx))
  }

  const handleSaveAssessment = async () => {
    if (!newTitle.trim()) {
      toast({
        title: 'Validation error',
        description: 'Please enter an assessment title.',
        variant: 'destructive'
      })
      return
    }
    if (creatorQuestions.length === 0) {
      toast({
        title: 'Validation error',
        description: 'Please add at least one question to the assessment.',
        variant: 'destructive'
      })
      return
    }
    if (assignedEmployees.length === 0) {
      toast({
        title: 'Validation error',
        description: 'Please assign this exam to at least one employee.',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    try {
      await createAssessment(
        newTitle.trim(),
        newDescription.trim(),
        newDueDate ? new Date(newDueDate).toISOString() : null,
        user!.id,
        creatorQuestions,
        assignedEmployees
      )

      toast({
        title: 'Assessment published',
        description: `Successfully created and assigned "${newTitle}" to ${assignedEmployees.length} employees.`
      })

      // Reset states
      setNewTitle('')
      setNewDescription('')
      setNewDueDate('')
      setAssignedEmployees([])
      setCreatorQuestions([])
      setCurrentView('list')
      loadInitialData()
    } catch (err) {
      toast({
        title: 'Publish failed',
        description: 'Could not create assessment.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // ─── ADMIN DELETE ASSESSMENT ───────────────────────────────────────────
  const handleDeleteAssessment = async (assessmentId: string) => {
    setLoading(true)
    try {
      await deleteAssessment(assessmentId)
      // Update local state assessments
      setAssessments(prev => prev.filter(a => a.id !== assessmentId))
      
      toast({
        title: 'Assessment Deleted',
        description: 'The test and all candidate evaluation submissions have been removed.',
      })
      
      // If we are currently viewing reports for this assessment, reset view
      if (selectedAssessment?.id === assessmentId) {
        setSelectedAssessment(null)
        setCurrentView('list')
        navigate(basePath)
      }
    } catch (err: any) {
      console.error('Error deleting assessment:', err)
      toast({
        title: 'Error deleting assessment',
        description: err.message || 'Failed to remove the assessment.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // ─── ADMIN DELETE CANDIDATE ASSIGNMENT ──────────────────────────────────
  const handleDeleteCandidateAssignment = async (candidateId: string) => {
    if (!selectedAssessment) return
    setLoading(true)
    try {
      await deleteCandidateAssignment(selectedAssessment.id, candidateId)
      
      // Update local state: selectedAssessment assigned_employees
      setSelectedAssessment(prev => prev ? {
        ...prev,
        assigned_employees: (prev.assigned_employees || []).filter(id => id !== candidateId)
      } : null)

      // Update local state: assessments list
      setAssessments(prev => prev.map(a => a.id === selectedAssessment.id ? {
        ...a,
        assigned_employees: (a.assigned_employees || []).filter(id => id !== candidateId)
      } : a))

      // Update local state: reportsSubmissions
      setReportsSubmissions(prev => prev.filter(s => s.user_id !== candidateId))

      toast({
        title: 'Assignment Removed',
        description: 'Successfully removed the candidate assignment and any attempt for this test.',
      })
    } catch (err) {
      console.error('Error removing candidate assignment:', err)
      toast({
        title: 'Error removing assignment',
        description: 'Could not remove individual candidate assignment.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // ─── ADMIN REPORT VIEW ─────────────────────────────────────────────────
  const handleViewReports = async (assessment: Assessment) => {
    setSelectedAssessment(assessment)
    setLoading(true)
    setCurrentView('reports')
    try {
      const subs = await fetchSubmissions(assessment.id)
      setReportsSubmissions(subs)

      if (subs.length > 0) {
        const userIds = Array.from(new Set(subs.map(s => s.user_id)))
        let allSubs: Submission[] = []
        try {
          const res: any = await api.get('/assessment_submissions?user_id_in=' + userIds.join(','))
          const data = res?.data || res
          if (data) {
            allSubs = data.map((s: any) => ({
              id: s.id,
              assessment_id: s.assessment_id,
              user_id: s.user_id,
              score: s.score,
              total_points: s.total_points,
              answers: s.answers,
              submitted_at: s.submitted_at
            }))
          }
        } catch (dbErr) {
          console.warn('Database error fetching all submissions:', dbErr)
        }
        if (allSubs.length === 0) {
          const stored = JSON.parse(localStorage.getItem('st_submissions') || '[]')
          allSubs = stored.filter((s: any) => userIds.includes(s.user_id))
        }
        setAllSubmissions(allSubs)

        const monthsSet = new Set<string>()
        monthsSet.add(currentMonthKey)
        allSubs.forEach((s: any) => {
          if (s.submitted_at) {
            const d = new Date(s.submitted_at)
            if (!isNaN(d.getTime())) {
              monthsSet.add(d.toLocaleString('default', { month: 'short', year: 'numeric' }))
            }
          }
        })
        const sortedMonths = Array.from(monthsSet).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
        if (!sortedMonths.includes('All Time')) {
          sortedMonths.push('All Time')
        }
        setAvailableSkillTrackMonths(sortedMonths)
      } else {
        setAllSubmissions([])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // ─── EMPLOYEE EXAM PREP & SHUFFLE ──────────────────────────────────────
  const handleStartExam = (assessment: Assessment) => {
    setAssessmentToTake(assessment)
    setIsTakeModalOpen(true)
  }

  const confirmStartExam = async (assessment: Assessment) => {
    setSelectedAssessment(assessment)
    setLoading(true)
    try {
      const list = await fetchQuestions(assessment.id)

      // Shuffle Helper (Fisher-Yates)
      const shuffleArray = <T,>(arr: T[]): T[] => {
        const copy = [...arr]
        for (let i = copy.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [copy[i], copy[j]] = [copy[j], copy[i]]
        }
        return copy
      }

      // Shuffling questions
      const shuffledQuestions = shuffleArray(list)
      shuffledQuestionsRef.current = shuffledQuestions

      // Shuffling options for each question
      const shufOptionsMap: Record<string, string[]> = {}
      shuffledQuestions.forEach(q => {
        shufOptionsMap[q.id] = shuffleArray(q.options)
      })
      shuffledOptionsRef.current = shufOptionsMap

      setExamQuestions(shuffledQuestions)
      setUserAnswers({})
      setCurrentQuestionIndex(0)
      setExamTimeRemaining(shuffledQuestions.length * 30)

      // Enter fullscreen synchronously
      try {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if ((elem as any).webkitRequestFullscreen) {
          await (elem as any).webkitRequestFullscreen();
        } else if ((elem as any).msRequestFullscreen) {
          await (elem as any).msRequestFullscreen();
        }

        // Attempt keyboard lock for Escape key to prevent automatic exit on Esc
        const navAny = navigator as any
        if (navAny.keyboard && typeof navAny.keyboard.lock === 'function') {
          await navAny.keyboard.lock(['Escape']);
        }
      } catch (err) {
        console.warn("Fullscreen/KeyboardLock request error:", err)
      }

      isSubmittingRef.current = false
      isQuittingRef.current = false
      setCurrentView('exam')
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAnswer = (qId: string, optionText: string) => {
    setUserAnswers({
      ...userAnswers,
      [qId]: optionText
    })
  }

  const submitExamNow = async (bypassConfirm: boolean = false) => {
    if (isSubmittingRef.current) return
    isSubmittingRef.current = true

    // Unlock keyboard lock if active
    const navAny = navigator as any
    if (navAny.keyboard && typeof navAny.keyboard.unlock === 'function') {
      navAny.keyboard.unlock()
    }

    // Exit fullscreen if still in it
    try {
      if (
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullscreenElement ||
        (document as any).msFullscreenElement
      ) {
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen()
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen()
        }
      }
    } catch (err) {
      console.warn("Error exiting fullscreen:", err)
    }

    const currentQuestions = examQuestionsRef.current
    const currentAnswers = userAnswersRef.current
    const currentAssessment = selectedAssessmentRef.current
    const currentUser = userRef.current

    if (!bypassConfirm) {
      const unattempted = currentQuestions.filter(q => !currentAnswers[q.id])
      if (unattempted.length > 0) {
        if (!window.confirm(`You have ${unattempted.length} unanswered questions. Submit anyway?`)) {
          isSubmittingRef.current = false
          return
        }
      }
    }

    setLoading(true)
    try {
      let score = 0
      let totalPoints = 0

      currentQuestions.forEach(q => {
        totalPoints += q.points
        const ans = currentAnswers[q.id]
        if (ans && ans === q.correct_answer) {
          score += q.points
        }
      })

      const sub = await submitAssessment(
        currentAssessment!.id,
        currentUser!.id,
        score,
        totalPoints,
        currentAnswers
      )

      setEmployeeSubmissions(prev => ({
        ...prev,
        [currentAssessment!.id]: sub
      }))

      toast({
        title: 'Assessment submitted',
        description: `Successfully completed. Score: ${score}/${totalPoints} points.`
      })

      setResultsSubmission(sub)
      setCurrentView('results')
      if (currentUser) {
        try {
          let notificationsToMark: any = []
          try {
            notificationsToMark = await api.get('/notifications?type=exam_assigned&user_id=' + currentUser.id + '&is_read=false&content_like=' + encodeURIComponent(`"${currentAssessment!.title}"`) + '&_select=id')
          } catch (e) {}

          if (notificationsToMark && notificationsToMark.length > 0) {
            const ids = notificationsToMark.map((n: any) => n.id)
            try {
              await api.put('/notifications?id_in=' + ids.join(','), { is_read: true })
            } catch (e) {}
          }
        } catch (notiErr) {
          console.warn('Could not auto-read exam notification:', notiErr)
        }

        // Now refresh counts globally
        await useUnreadStore.getState().fetchCounts(currentUser.id)
      }
    } catch (err) {
      toast({
        title: 'Submission failed',
        description: 'Could not write submission. Check network connection.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
      isSubmittingRef.current = false
    }
  }

  const handleViewResults = async (assessment: Assessment) => {
    setSelectedAssessment(assessment)
    let sub = employeeSubmissions[assessment.id]
    if (!sub) {
      setLoading(true)
      try {
        const res = await fetchUserSubmission(assessment.id, user!.id)
        if (res) {
          sub = res
          setEmployeeSubmissions({
            ...employeeSubmissions,
            [assessment.id]: res
          })
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    if (sub) {
      // Load questions for detailed view
      setLoading(true)
      try {
        const list = await fetchQuestions(assessment.id)
        setExamQuestions(list)
        setResultsSubmission(sub)
        setCurrentView('results')
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    } else {
      toast({
        title: 'No submission record',
        description: 'You have not submitted an attempt for this assessment.'
      })
    }
  }

  const formatPercentage = (score: number, total: number) => {
    if (total === 0) return 0
    return Math.round((score / total) * 100)
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'No due date'
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="space-y-6 fade-in duration-500 text-slate-800 text-left">
      {/* ── HEADER ───────────────────────────────────────────────────────── */}
      {currentView !== 'exam' && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Skill & Evaluation Matrix
            </h2>
            <p className="text-muted-foreground text-sm mt-0.5">
              {isAdmin
                ? 'Create MCQ exams, parse question pools, and evaluate reporting squad scores.'
                : 'Complete assigned certifications and track your skill evaluation results.'
              }
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* Month Filter Selector */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
              <Calendar className="h-4 w-4 text-violet-600 shrink-0" />
              <span className="text-xs font-bold text-slate-700 whitespace-nowrap">Skill Month:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg px-2 py-1 font-bold focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                {availableSkillTrackMonths.map(m => (
                  <option key={m} value={m}>
                    {m === currentMonthKey ? `${m} (Current Month)` : m}
                  </option>
                ))}
              </select>
            </div>

            <div className={`flex items-center gap-2 text-xs font-semibold px-3.5 py-1.5 rounded-full border ${theme.badgeBg}`}>
              <Sparkles className="h-3.5 w-3.5 mr-0.5" />
              Skill Track Portal
            </div>
            {currentView !== 'list' && (
              <Button
                variant="outline"
                onClick={() => {
                  navigate(basePath)
                  setCurrentView('list')
                  setSelectedAssessment(null)
                  setViewingUserSubmission(null)
                  loadInitialData()
                }}
                className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold h-9 rounded-lg"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to List
              </Button>
            )}
            {isAdmin && currentView === 'list' && (
              <Button
                onClick={() => setCurrentView('create')}
                className={`${primaryBg} text-white font-semibold text-xs h-9 rounded-lg shadow-sm`}
              >
                <Plus className="mr-2 h-4 w-4" />
                New Assessment
              </Button>
            )}
          </div>
        </div>
      )}

      {loading && (
        <div className="h-64 flex items-center justify-center bg-white/50 backdrop-blur-sm rounded-xl border border-slate-100 shadow-sm">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className={`h-8 w-8 animate-spin ${textAccent}`} />
            <p className="text-sm font-medium text-slate-400">Loading data matrix...</p>
          </div>
        </div>
      )}

      {!loading && (
        <>
          {/* ── LIST VIEW ────────────────────────────────────────────────── */}
          {currentView === 'list' && (
            <div className="space-y-4">
              {!isAdmin && (
                <div className="flex border-b border-slate-200">
                  <button
                    onClick={() => setActiveTab('pending')}
                    className={`pb-3 px-4 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'pending' ? 'border-violet-600 text-violet-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                  >
                    Take Assessment
                  </button>
                  <button
                    onClick={() => setActiveTab('completed')}
                    className={`pb-3 px-4 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'completed' ? 'border-violet-600 text-violet-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                  >
                    Completed Reports
                  </button>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                {(() => {
                  let displayAssessments = assessments;
                  if (!isAdmin) {
                    displayAssessments = assessments.filter(item => {
                      const isCompleted = !!employeeSubmissions[item.id];
                      return activeTab === 'completed' ? isCompleted : !isCompleted;
                    });
                  }

                  if (displayAssessments.length === 0) {
                    return (
                      <Card className="col-span-full bg-white border-slate-200 py-8 text-center shadow-sm">
                        <CardContent className="flex flex-col items-center gap-2 pt-6">
                          <div className={`p-3 ${theme.resultsIconBg} rounded-full border`}>
                            <GraduationCap className={`h-6 w-6 ${textAccent}`} />
                          </div>
                          <h3 className="text-base font-bold text-slate-900 mt-2">No Assessments Found</h3>
                          <p className="text-xs text-slate-500 max-w-sm">
                            {isAdmin
                              ? 'Get started by creating your first skill check assessment and assigning it to employees.'
                              : activeTab === 'completed'
                                ? 'You have not completed any assessments yet.'
                                : 'You do not have any pending assessments currently.'
                            }
                          </p>
                          {isAdmin && (
                            <Button
                              onClick={() => setCurrentView('create')}
                              className={`${primaryBg} text-white mt-4 text-xs h-9`}
                            >
                              Create Assessment
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    )
                  }

                  return displayAssessments.map(item => {
                    const isCompleted = !isAdmin && !!employeeSubmissions[item.id]
                    const empSub = !isAdmin ? employeeSubmissions[item.id] : null
                    return (
                      <Card key={item.id} className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden">
                        <div className="p-4 flex gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${isAdmin
                                ? 'bg-teal-50 text-teal-700 border-teal-200'
                                : isCompleted
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>
                                {isAdmin ? 'MANAGED' : isCompleted ? 'COMPLETED' : 'PENDING'}
                              </span>
                              <span className="text-[10px] text-slate-400 flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                {formatDate(item.due_date)}
                              </span>
                            </div>
                            <h3 className="text-base font-bold text-slate-900 truncate">{item.title}</h3>
                            <p className="text-slate-500 text-xs mt-0.5 truncate">{item.description || 'No description provided.'}</p>

                            <div className="flex gap-4 mt-3 text-[10px] text-slate-500 font-semibold">
                              <span className="flex items-center gap-1">
                                <HelpCircle className="w-3 h-3 text-slate-400" /> {item.questions_count} MCQs
                              </span>
                              <span className="flex items-center gap-1">
                                <Award className="w-3 h-3 text-slate-400" /> {item.points_total} Points
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col justify-center items-end shrink-0 border-l border-slate-100 pl-4 min-w-[100px] gap-1.5">
                            {isAdmin ? (
                              <>
                                <Button
                                  variant="outline"
                                  onClick={() => navigate(`${basePath}/reports/${item.id}`)}
                                  className="text-[10px] h-7.5 font-semibold w-full border-slate-200 text-slate-700"
                                >
                                  Reports
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => {
                                    setAssessmentToDelete(item.id)
                                    setIsDeleteModalOpen(true)
                                  }}
                                  className="text-[10px] h-7.5 font-semibold w-full bg-red-50 text-red-600 hover:bg-red-100 border border-red-100"
                                >
                                  Delete
                                </Button>
                              </>
                            ) : (
                              <>
                                {isCompleted && empSub ? (
                                  <div className="text-right w-full flex flex-col items-end">
                                    <p className={`text-sm font-extrabold ${theme.textAccent}`}>
                                      {formatPercentage(empSub.score, empSub.total_points)}%
                                    </p>
                                    <p className="text-[9px] text-slate-400 uppercase font-semibold mb-1">Score</p>
                                    <Button
                                      onClick={() => handleViewResults(item)}
                                      className={`text-[10px] h-7 w-full font-semibold text-white ${theme.primaryBg}`}
                                    >
                                      View
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    onClick={() => handleStartExam(item)}
                                    className={`text-[10px] h-8 w-full font-semibold text-white ${primaryBg}`}
                                  >
                                    Take
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </Card>
                    )
                  })
                })()}
              </div>
            </div>
          )}

          {/* ── CREATE VIEW (ADMIN ONLY) ─────────────────────────────────── */}
          {currentView === 'create' && isAdmin && (
            <div className="grid gap-6 lg:grid-cols-3 items-start text-left">
              {/* Left Column: Metadata & Assignment */}
              <div className="space-y-6 lg:col-span-1">
                <Card className="bg-white border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Assessment Details</CardTitle>
                    <CardDescription>Configure core metadata and assign targets.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Exam Title *</label>
                      <Input
                        placeholder="e.g. React Core Concepts Evaluation"
                        value={newTitle}
                        onChange={e => setNewTitle(e.target.value)}
                        className="bg-slate-50/50"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</label>
                      <textarea
                        placeholder="Provide details or reference resources for this skill evaluation..."
                        value={newDescription}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewDescription(e.target.value)}
                        className="flex min-h-[100px] w-full rounded-md border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-500 placeholder:text-slate-400"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Due Date</label>
                      <Input
                        type="date"
                        value={newDueDate}
                        onChange={e => setNewDueDate(e.target.value)}
                        className="bg-slate-50/50"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Assign Candidates</CardTitle>
                    <CardDescription>Select employees assigned to take this exam.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {employeesList.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No reporting team members found to assign.</p>
                    ) : (
                      <div className="space-y-2 max-h-[220px] overflow-auto pr-2">
                        {employeesList.map(emp => {
                          const checked = assignedEmployees.includes(emp.id)
                          return (
                            <label key={emp.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors border border-slate-100">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => {
                                  if (checked) {
                                    setAssignedEmployees(assignedEmployees.filter(id => id !== emp.id))
                                  } else {
                                    setAssignedEmployees([...assignedEmployees, emp.id])
                                  }
                                }}
                                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                              />
                              <div className="text-left overflow-hidden">
                                <p className="text-xs font-semibold text-slate-800 truncate">{emp.full_name}</p>
                                <p className="text-[10px] text-slate-400 truncate">{emp.email}</p>
                              </div>
                            </label>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Question Builder / Uploader */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="bg-white border-slate-200 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <CardTitle className="text-lg">Assessments Question Pool</CardTitle>
                      <CardDescription>Add questions manually or auto-parse via files/text.</CardDescription>
                    </div>
                    <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-100/50">
                      <Button
                        variant={uploadMode === 'manual' ? 'secondary' : 'ghost'}
                        onClick={() => setUploadMode('manual')}
                        className="text-[10px] h-7 px-3 font-bold uppercase rounded"
                      >
                        Manual
                      </Button>
                      <Button
                        variant={uploadMode === 'bulk_text' ? 'secondary' : 'ghost'}
                        onClick={() => setUploadMode('bulk_text')}
                        className="text-[10px] h-7 px-3 font-bold uppercase rounded"
                      >
                        Text Parse
                      </Button>
                      <Button
                        variant={uploadMode === 'file' ? 'secondary' : 'ghost'}
                        onClick={() => setUploadMode('file')}
                        className="text-[10px] h-7 px-3 font-bold uppercase rounded"
                      >
                        File Parse
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {/* ── MANUAL BUILDER ── */}
                    {uploadMode === 'manual' && (
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Question Text</label>
                          <Input
                            placeholder="e.g. Which hook is used to handle side-effects in React?"
                            value={manualQuestion}
                            onChange={e => setManualQuestion(e.target.value)}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          {manualOptions.map((opt, oIdx) => (
                            <div key={oIdx} className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Option {String.fromCharCode(65 + oIdx)}</label>
                              <div className="flex gap-2">
                                <Input
                                  placeholder={`Option content...`}
                                  value={opt}
                                  onChange={e => {
                                    const nextOpts = [...manualOptions]
                                    nextOpts[oIdx] = e.target.value
                                    setManualOptions(nextOpts)
                                  }}
                                />
                                {manualOptions.length > 2 && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setManualOptions(manualOptions.filter((_, i) => i !== oIdx))}
                                    className="text-red-500 hover:bg-red-50 hover:text-red-600 shrink-0 border border-slate-100"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setManualOptions([...manualOptions, ''])}
                            className="text-xs font-semibold border-slate-200"
                          >
                            + Add Option Slot
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Correct Option Value</label>
                            <select
                              value={manualCorrect}
                              onChange={e => setManualCorrect(e.target.value)}
                              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                            >
                              <option value="">-- Select Correct Option --</option>
                              {manualOptions.filter(o => o.trim().length > 0).map((opt, oIdx) => (
                                <option key={oIdx} value={opt}>{opt}</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Points / Weight</label>
                            <Input
                              type="number"
                              min={1}
                              value={manualPoints}
                              onChange={e => setManualPoints(Math.max(1, parseInt(e.target.value, 10) || 1))}
                            />
                          </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex justify-end">
                          <Button
                            onClick={handleAddManualQuestion}
                            className="bg-slate-900 text-white font-semibold text-xs h-9 rounded-lg"
                          >
                            Add Question to Pool
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* ── BULK TEXT PARSER ── */}
                    {uploadMode === 'bulk_text' && (
                      <div className="space-y-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50 text-xs text-slate-600 leading-relaxed">
                          <p className="font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                            Direct Message / Copy-Paste Format Guide:
                          </p>
                          <p>Paste multiple questions separated by empty lines. Prefix options with letters. Example:</p>
                          <pre className="bg-slate-100 p-2.5 rounded-lg border border-slate-200 mt-2 font-mono text-[10px] select-all overflow-auto">
                            {`1. What is the value of 2 + 2?
A) 3
B) 4
C) 5
Answer: B
Points: 2`}
                          </pre>
                        </div>
                        <textarea
                          placeholder="Paste formatted questions block here..."
                          value={bulkInput}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBulkInput(e.target.value)}
                          className="flex min-h-[200px] w-full rounded-md border border-slate-200 bg-slate-50/50 px-3 py-2 font-mono text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-500 placeholder:text-slate-400"
                        />
                        <div className="flex justify-end pt-2">
                          <Button
                            onClick={handleParseText}
                            className="bg-slate-900 text-white text-xs font-semibold h-9 rounded-lg"
                          >
                            Parse Paste Text
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* ── FILE UPLOADER ── */}
                    {uploadMode === 'file' && (
                      <div className="space-y-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50 text-xs text-slate-600 leading-relaxed">
                          <p className="font-bold text-slate-700 flex items-center gap-1.5 mb-1">
                            <FileText className="w-3.5 h-3.5 text-teal-600" />
                            Supported File Specs:
                          </p>
                          <ul className="list-disc pl-4 space-y-1 mt-1 text-[11px]">
                            <li><strong>Microsoft Word (.docx)</strong>: Mammoth extracts raw text which is parsed using standard blocks format (same syntax as Copy-Paste).</li>
                            <li><strong>CSV Table (.csv)</strong>: Headers must match <code>Question, Option A, Option B, Option C, Option D, Correct Answer, Points</code> (letters like "A" or text can represent correct answer).</li>
                            <li><strong>Text Documents (.txt)</strong>: Raw files matching copy-paste block syntax.</li>
                          </ul>
                        </div>

                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-teal-500 rounded-2xl p-8 bg-slate-50/50 transition-colors relative cursor-pointer group">
                          <input
                            type="file"
                            accept=".csv, .docx, .txt"
                            onChange={handleFileUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                          />
                          <UploadCloud className="w-10 h-10 text-slate-400 group-hover:text-teal-600 transition-colors mb-3" />
                          <p className="text-sm font-semibold text-slate-700">Click to upload or drag & drop</p>
                          <p className="text-xs text-slate-400 mt-1">Microsoft Word (.docx), CSV, or Plain Text (.txt)</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Question list preview table */}
                <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
                  <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row justify-between items-center py-4">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <span>Review Questions</span>
                        <span className="bg-slate-200 text-slate-700 font-bold text-xs px-2 py-0.5 rounded-full">
                          {creatorQuestions.length} Added
                        </span>
                      </CardTitle>
                    </div>
                    {creatorQuestions.length > 0 && (
                      <Button
                        onClick={handleSaveAssessment}
                        className={`${primaryBg} text-white font-semibold text-xs h-9 rounded-lg shadow-sm`}
                      >
                        Publish Assessment
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="p-0">
                    {creatorQuestions.length === 0 ? (
                      <div className="p-12 text-center text-slate-400 text-sm">
                        No questions added yet. Use the question pool workspace above to build your exam.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {creatorQuestions.map((q, idx) => (
                          <div key={idx} className="p-4 flex gap-4 justify-between items-start text-xs hover:bg-slate-50/50 transition-colors">
                            <div className="flex-1 space-y-1.5 overflow-hidden">
                              <p className="font-semibold text-slate-900 text-sm flex gap-1.5 items-start">
                                <span className="text-slate-400 shrink-0 font-mono mt-0.5">{idx + 1}.</span>
                                <span className="line-clamp-2">{q.question_text}</span>
                              </p>
                              <div className="flex flex-wrap gap-2 text-[10px]">
                                {q.options.map((opt, oIdx) => {
                                  const isCorrect = opt === q.correct_answer
                                  return (
                                    <span key={oIdx} className={`px-2 py-0.5 rounded border ${isCorrect
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold'
                                      : 'bg-slate-50 text-slate-600 border-slate-200'
                                      }`}>
                                      {String.fromCharCode(65 + oIdx)}) {opt}
                                    </span>
                                  )
                                })}
                              </div>
                              <div className="flex items-center gap-4 text-[10px] text-slate-400">
                                <span className="font-semibold text-slate-700">Correct: {q.correct_answer}</span>
                                <span>•</span>
                                <span className="font-semibold text-teal-600">{q.points} Points</span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveQuestion(idx)}
                              className="text-red-500 hover:bg-red-50 shrink-0 border border-slate-100 h-8 w-8 rounded-lg"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          {/* ── EXAM TAKING VIEW (EMPLOYEE ONLY) ─────────────────────────── */}
          {currentView === 'exam' && selectedAssessment && (
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] pointer-events-auto">
              <Button
                variant="outline"
                onClick={() => setShowQuitConfirm(true)}
                className="bg-slate-900/90 hover:bg-slate-950 text-white hover:text-white border border-slate-700/50 backdrop-blur-md px-5 py-2.5 rounded-full shadow-xl flex items-center gap-2 transition-all duration-200 hover:scale-105 font-bold text-xs"
              >
                <X className="w-4 h-4 text-red-400 animate-pulse" />
                <span>Quit Exam</span>
              </Button>
            </div>
          )}

          {/* ── EXAM TAKING VIEW (EMPLOYEE ONLY) ─────────────────────────── */}
          {currentView === 'exam' && selectedAssessment && (
            <div className="max-w-6xl mx-auto pt-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
                
                {/* Left Column: Exam Details & Active Question */}
                <div className="lg:col-span-8 space-y-6">
                  
                  {/* Assessment Details Card */}
                  <Card className="bg-white border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-violet-500 via-indigo-500 to-purple-500" />
                    <CardHeader className="pt-8">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold bg-violet-100 text-violet-800 px-2.5 py-0.5 rounded-full border border-violet-200">
                          CERTIFICATION EXAM
                        </span>
                        <div className="flex items-center gap-3">
                          {examTimeRemaining !== null && (
                            <span className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 ${examTimeRemaining <= 30
                              ? 'bg-red-50 text-red-750 border-red-200 animate-pulse'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                              <Clock className="w-3.5 h-3.5" />
                              Time Left: {formatTime(examTimeRemaining)}
                            </span>
                          )}
                          <span className="text-xs text-slate-400 flex items-center">
                            Assigned Exam
                          </span>
                        </div>
                      </div>
                      <CardTitle className="text-2xl">{selectedAssessment.title}</CardTitle>
                      <CardDescription className="text-slate-500 mt-2 text-sm leading-relaxed">{selectedAssessment.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="border-t border-slate-100 bg-slate-50/50 py-4 px-6 flex items-center justify-between text-xs text-slate-500">
                      <div className="flex gap-4">
                        <span>Questions: <strong>{examQuestions.length} MCQs</strong></span>
                        <span>•</span>
                        <span>Total value: <strong>{selectedAssessment.points_total} Points</strong></span>
                      </div>
                      <span className="text-amber-600 font-semibold flex items-center">
                        <HelpCircle className="w-3.5 h-3.5 mr-1" />
                        Shuffle Enforced
                      </span>
                    </CardContent>
                  </Card>

                  {/* Single Shuffled question rendering */}
                  {examQuestions.length > 0 && (() => {
                    const q = examQuestions[currentQuestionIndex]
                    if (!q) return null
                    const selectedOpt = userAnswers[q.id]
                    const options = shuffledOptionsRef.current[q.id] || q.options

                    return (
                      <Card key={q.id} className="bg-white border-slate-200 shadow-sm overflow-hidden text-left">
                        <CardHeader className="bg-slate-50/40 pb-4 border-b border-slate-100 flex flex-row justify-between items-start gap-4">
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Question {currentQuestionIndex + 1} of {examQuestions.length}</span>
                            <h4 className="text-base font-bold text-slate-900 leading-snug">{q.question_text}</h4>
                          </div>
                          <span className="bg-violet-50 text-violet-750 font-semibold text-[10px] uppercase px-2.5 py-1 rounded-full shrink-0 border border-violet-100">
                            {q.points} {q.points === 1 ? 'Point' : 'Points'}
                          </span>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div className="grid gap-3 sm:grid-cols-2">
                            {options.map((opt, oIdx) => {
                              const isSelected = selectedOpt === opt
                              return (
                                <button
                                  key={oIdx}
                                  onClick={() => handleSelectAnswer(q.id, opt)}
                                  className={`flex items-start text-left p-4 rounded-xl border text-sm transition-all duration-200 ${isSelected
                                    ? 'border-violet-600 bg-violet-50/50 shadow-sm ring-1 ring-violet-500/20'
                                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                    }`}
                                >
                                  <span className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 shrink-0 text-xs font-bold ${isSelected
                                    ? 'bg-violet-600 border-violet-600 text-white'
                                    : 'border-slate-300 text-slate-400 bg-white'
                                    }`}>
                                    {String.fromCharCode(65 + oIdx)}
                                  </span>
                                  <span className={`flex-1 ${isSelected ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                                    {opt}
                                  </span>
                                </button>
                              )
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })()}

                  {/* Submit exam footer */}
                  <div className="flex justify-between items-center pt-4">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        disabled={currentQuestionIndex === 0}
                        onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                        className="border-slate-200 text-slate-700 h-10 px-6 rounded-lg font-semibold bg-white"
                      >
                        Previous
                      </Button>

                      {currentQuestionIndex < examQuestions.length - 1 ? (
                        <Button
                          onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                          className={`${primaryBg} text-white font-semibold h-10 px-6 rounded-lg shadow-sm`}
                        >
                          Next Question
                        </Button>
                      ) : (
                        <Button
                          onClick={() => submitExamNow(false)}
                          className={`${primaryBg} text-white font-semibold h-10 px-8 rounded-lg shadow-sm`}
                        >
                          Submit Attempt
                        </Button>
                      )}
                    </div>
                  </div>

                </div>

                {/* Right Column: Question Navigation Grid */}
                <div className="lg:col-span-4 sticky top-20 space-y-4">
                  <Card className="bg-white border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-1 bg-violet-500" />
                    <CardHeader className="pb-3 pt-5">
                      <CardTitle className="text-sm font-bold text-slate-800 flex items-center justify-between">
                        <span>Exam Navigation</span>
                        <span className="text-xs font-normal text-slate-500">
                          {Object.keys(userAnswers).length} of {examQuestions.length} Answered
                        </span>
                      </CardTitle>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                        <div 
                          className="bg-violet-600 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${(Object.keys(userAnswers).length / examQuestions.length) * 100}%` }}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="pb-5">
                      <div className="grid grid-cols-5 gap-2.5">
                        {examQuestions.map((q, idx) => {
                          const isAnswered = !!userAnswers[q.id]
                          const isActive = idx === currentQuestionIndex
                          
                          return (
                            <button
                              key={q.id}
                              onClick={() => setCurrentQuestionIndex(idx)}
                              className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-semibold transition-all duration-200 relative ${
                                isActive
                                  ? 'bg-violet-600 text-white shadow-md ring-2 ring-violet-600 ring-offset-2 scale-105'
                                  : isAnswered
                                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200 border-dashed'
                              }`}
                              title={`Question ${idx + 1}: ${isAnswered ? 'Answered' : 'Unanswered'}`}
                            >
                              {idx + 1}
                              {/* Small status indicator dot */}
                              <span className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${
                                isAnswered ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'
                              }`} />
                            </button>
                          )
                        })}
                      </div>
                      
                      <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col gap-2 text-[11px] text-slate-500">
                        <div className="flex flex-row items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-50 border border-emerald-200 flex shrink-0" />
                          <span>Answered</span>
                        </div>
                        <div className="flex flex-row items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-sm bg-slate-50 border border-slate-200 border-dashed flex shrink-0" />
                          <span>Unanswered (Click to go to question)</span>
                        </div>
                        <div className="flex flex-row items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-sm bg-violet-600 ring-1 ring-violet-600 flex shrink-0" />
                          <span>Current Question</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

              </div>

              {/* Dialogs */}
              {/* Warn Dialog on Quit Request */}
              {showQuitConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 text-left animate-in zoom-in-95 duration-200">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                          <HelpCircle className="h-5 w-5 text-indigo-600 animate-pulse" />
                        </div>
                        <h3 className="text-lg font-extrabold text-slate-900">
                          Quit Exam?
                        </h3>
                      </div>
                      <p className="text-slate-600 text-xs leading-relaxed font-medium">
                        Are you sure you want to quit the exam? Your current progress will be lost and you will exit back to the dashboard.
                      </p>
                      <div className="mt-6 flex flex-col sm:flex-row gap-2.5 justify-end">
                        <Button
                          variant="outline"
                          onClick={handleQuitExam}
                          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold text-xs bg-white"
                        >
                          Yes, Quit Exam
                        </Button>
                        <Button
                          onClick={() => setShowQuitConfirm(false)}
                          className="bg-indigo-600 text-white hover:bg-indigo-700 font-bold text-xs"
                        >
                          Cancel & Continue
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ── VIEW RESULTS / ATTEMPT SCORE ────────────────────────────── */}
          {currentView === 'results' && selectedAssessment && resultsSubmission && (
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Sticky Score Card */}
              <div className="lg:col-span-4 sticky top-6 space-y-6">
                <Card className="bg-white border-slate-200 shadow-sm relative overflow-hidden text-center">
                  <div className={`absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r ${theme.resultsGradient}`} />
                  <CardContent className="pt-8 pb-6 px-6">
                    <div className="flex justify-center mb-4">
                      <div className={`w-16 h-16 rounded-full ${theme.resultsIconBg} flex items-center justify-center shadow-sm`}>
                        <Award className="w-8 h-8" />
                      </div>
                    </div>
                    <h2 className="text-2xl font-extrabold text-slate-900">Assessment Completed</h2>
                    <p className="text-slate-400 text-xs mt-1">Submitted on {new Date(resultsSubmission.submitted_at).toLocaleString()}</p>

                    <div className="max-w-xs mx-auto bg-slate-50 border border-slate-100 rounded-2xl p-4 mt-6 flex justify-around items-center">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Score Received</p>
                        <p className="text-2xl font-black text-slate-900 mt-1">
                          {resultsSubmission.score} <span className="text-slate-400 text-sm font-semibold">/ {resultsSubmission.total_points}</span>
                        </p>
                      </div>
                      <div className="h-8 w-px bg-slate-200" />
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Evaluation Grade</p>
                        <p className={`text-2xl font-black ${theme.resultsScoreText} mt-1`}>
                          {formatPercentage(resultsSubmission.score, resultsSubmission.total_points)}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Button
                  onClick={() => {
                    setCurrentView('list')
                    setSelectedAssessment(null)
                    setResultsSubmission(null)
                    loadInitialData()
                  }}
                  className={`w-full ${primaryBg} text-white font-semibold h-12 rounded-xl shadow-sm`}
                >
                  Return to Dashboard
                </Button>
              </div>

              {/* Right Column: Scrollable Q/A Matrix */}
              <div className="lg:col-span-8 space-y-6 pb-12">
                <h3 className="text-lg font-bold text-slate-800 text-left pt-2">Verify Answer Matrix</h3>

                {examQuestions.map((q, idx) => {
                  const userAns = resultsSubmission.answers[q.id]
                  const isCorrect = userAns && userAns === q.correct_answer

                  return (
                    <Card key={q.id} className={`bg-white border-slate-200 shadow-sm overflow-hidden text-left border-l-4 ${isCorrect ? 'border-l-emerald-500' : 'border-l-red-500'
                      }`}>
                      <CardHeader className="bg-slate-50/30 pb-3 border-b border-slate-100 flex flex-row justify-between items-start gap-4">
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Question {idx + 1}</span>
                          <h4 className="text-base font-bold text-slate-900 leading-snug">{q.question_text}</h4>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${isCorrect ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                            }`}>
                            {isCorrect ? 'Correct' : 'Incorrect'}
                          </span>
                          <p className="text-[11px] text-slate-400 mt-1.5 font-semibold">
                            {isCorrect ? q.points : 0} / {q.points} {q.points === 1 ? 'pt' : 'pts'}
                          </p>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="grid gap-3 sm:grid-cols-2">
                          {q.options.map((opt, oIdx) => {
                            const isCorrectOpt = opt === q.correct_answer
                            const isChosenOpt = userAns === opt

                            let cardStyle = 'border-slate-200 bg-white'
                            let pillStyle = 'border-slate-300 text-slate-400 bg-white'

                            if (isCorrectOpt) {
                              cardStyle = 'border-emerald-500 bg-emerald-50/20 ring-1 ring-emerald-500/20'
                              pillStyle = 'bg-emerald-600 border-emerald-600 text-white'
                            } else if (isChosenOpt && !isCorrectOpt) {
                              cardStyle = 'border-red-500 bg-red-50/20 ring-1 ring-red-500/20'
                              pillStyle = 'bg-red-600 border-red-600 text-white'
                            }

                            return (
                              <div
                                key={oIdx}
                                className={`flex items-start p-4 rounded-xl border text-sm transition-all duration-200 select-none ${cardStyle}`}
                              >
                                <span className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 shrink-0 text-xs font-bold ${pillStyle}`}>
                                  {isChosenOpt ? (
                                    isCorrectOpt ? <Check className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />
                                  ) : (
                                    String.fromCharCode(65 + oIdx)
                                  )}
                                </span>
                                <div className="flex-1">
                                  <span className={`block ${isCorrectOpt
                                    ? 'font-bold text-emerald-950'
                                    : isChosenOpt
                                      ? 'font-semibold text-red-950'
                                      : 'text-slate-650'
                                    }`}>
                                    {opt}
                                  </span>
                                  {isCorrectOpt && (
                                    <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider block mt-0.5">Correct Solution</span>
                                  )}
                                  {isChosenOpt && !isCorrectOpt && (
                                    <span className="text-[9px] text-red-600 font-bold uppercase tracking-wider block mt-0.5">Your Choice</span>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── REPORTS VIEW (ADMIN ONLY) ────────────────────────────────── */}
          {currentView === 'reports' && selectedAssessment && isAdmin && (
            <div className="space-y-6 text-left">
              {/* Reports metadata header */}
              <Card className="bg-white border-slate-200 shadow-sm relative overflow-hidden">
                <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${theme.resultsGradient}`} />
                <CardHeader>
                  <CardTitle className="text-xl flex items-center justify-between">
                    <span>Submission Report: {selectedAssessment.title}</span>
                    <span className="text-xs bg-slate-100 border border-slate-200 text-slate-700 rounded-full px-2.5 py-0.5">
                      {reportsSubmissions.length} Attempted
                    </span>
                  </CardTitle>
                  <CardDescription>{selectedAssessment.description}</CardDescription>
                </CardHeader>
                <CardContent className="border-t border-slate-100 pt-4 text-xs text-slate-500 grid grid-cols-3 gap-4">
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Questions</span>
                    <span className="text-sm font-bold text-slate-900 mt-0.5">{selectedAssessment.questions_count} MCQs</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Points Weight</span>
                    <span className="text-sm font-bold text-slate-900 mt-0.5">{selectedAssessment.points_total} Points</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Average Score</span>
                    <span className="text-sm font-bold text-slate-900 mt-0.5">
                      {reportsSubmissions.length > 0
                        ? `${Math.round(reportsSubmissions.reduce((sum, s) => sum + s.score, 0) / reportsSubmissions.length)} / ${selectedAssessment.points_total} (${Math.round(reportsSubmissions.reduce((sum, s) => sum + formatPercentage(s.score, s.total_points), 0) / reportsSubmissions.length)
                        }%)`
                        : 'No submissions yet'
                      }
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Submissions reports list table */}
              <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100">
                  <CardTitle className="text-base">Candidate Scores Matrix</CardTitle>
                  <CardDescription>Verify the grades and selection breakdown of squad members.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {viewingUserSubmission ? (
                    /* Detailed view of employee's answers */
                    <div className="p-6 space-y-6">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                        <div>
                          <h4 className="text-lg font-bold text-slate-900">
                            Candidate Attempt: {viewingUserSubmission.user?.full_name || 'Squad Member'}
                          </h4>
                          <p className="text-xs text-slate-400">{viewingUserSubmission.user?.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-extrabold text-teal-600">
                            Score: {viewingUserSubmission.score} / {viewingUserSubmission.total_points} ({formatPercentage(viewingUserSubmission.score, viewingUserSubmission.total_points)}%)
                          </p>
                          <Button
                            variant="ghost"
                            onClick={() => setViewingUserSubmission(null)}
                            className="text-xs text-teal-600 hover:text-teal-700 mt-1"
                          >
                            Back to Reports Table
                          </Button>
                        </div>
                      </div>

                      {/* Display questions */}
                      <div className="space-y-4">
                        {examQuestions.map((q, idx) => {
                          const userAns = viewingUserSubmission.answers[q.id]
                          const isCorrect = userAns && userAns === q.correct_answer

                          return (
                            <div key={q.id} className={`p-4 border rounded-xl ${isCorrect ? 'border-emerald-200 bg-emerald-50/5' : 'border-red-200 bg-red-50/5'
                              } text-xs text-left`}>
                              <div className="flex justify-between items-start mb-2 gap-4">
                                <h5 className="font-bold text-slate-800">{idx + 1}. {q.question_text}</h5>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                  {isCorrect ? `+${q.points} pts` : `0 / ${q.points} pts`}
                                </span>
                              </div>
                              <div className="space-y-1 pl-4">
                                <p className="text-slate-500">Correct Answer: <strong className="text-emerald-700">{q.correct_answer}</strong></p>
                                <p className="text-slate-500">Chosen Option: <strong className={isCorrect ? 'text-emerald-700' : 'text-red-700'}>
                                  {userAns || 'Unanswered'}
                                </strong></p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    /* General table view */
                    (() => {
                      const activeMonthSubmissions = selectedMonth === 'All Time'
                        ? reportsSubmissions
                        : reportsSubmissions.filter(s => {
                            if (!s.submitted_at) return false
                            const d = new Date(s.submitted_at)
                            if (isNaN(d.getTime())) return false
                            return d.toLocaleString('default', { month: 'short', year: 'numeric' }) === selectedMonth
                          })

                      const assignedCandidateIds = selectedAssessment.assigned_employees || []
                      const additionalSubmissions = activeMonthSubmissions.filter(sub => !assignedCandidateIds.includes(sub.user_id))
                      const allCandidatesToRender = [
                        ...assignedCandidateIds.map(candidateId => {
                          const submission = activeMonthSubmissions.find(s => s.user_id === candidateId)
                          const employee = employeesList.find(emp => emp.id === candidateId) || (submission ? { id: candidateId, full_name: submission.user?.full_name, email: submission.user?.email } : null)
                          return {
                            candidateId,
                            employee,
                            submission
                          }
                        }),
                        ...additionalSubmissions.map(sub => ({
                          candidateId: sub.user_id,
                          employee: { id: sub.user_id, full_name: sub.user?.full_name, email: sub.user?.email },
                          submission: sub
                        }))
                      ]

                      return allCandidatesToRender.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 text-sm">
                          No candidates assigned to this assessment yet.
                        </div>
                      ) : (
                        <div className="overflow-x-auto w-full">
                          <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                              <tr>
                                <th className="px-6 py-4">Squad Candidate</th>
                                <th className="px-6 py-4">Score</th>
                                <th className="px-6 py-4">Grade</th>
                                <th className="px-6 py-4">Monthly Test Evaluation</th>
                                <th className="px-6 py-4">Submitted At</th>
                                <th className="px-6 py-4 text-right">Details</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {allCandidatesToRender.map(item => {
                                const { candidateId, employee, submission } = item
                                const hasSubmitted = !!submission
                                const pct = submission ? formatPercentage(submission.score, submission.total_points) : 0
                                
                                // Group all submissions for this user by month
                                const candidateSubs = allSubmissions.filter(s => s.user_id === candidateId)
                                const monthlyGroups: Record<string, { totalPct: number; count: number; date: Date }> = {}
                                candidateSubs.forEach((s: any) => {
                                  const date = new Date(s.submitted_at)
                                  if (isNaN(date.getTime())) return
                                  const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' })
                                  const pctVal = s.total_points > 0 ? (s.score / s.total_points) * 100 : 0
                                  if (!monthlyGroups[monthKey]) {
                                    monthlyGroups[monthKey] = { totalPct: 0, count: 0, date }
                                  }
                                  monthlyGroups[monthKey].totalPct += pctVal
                                  monthlyGroups[monthKey].count += 1
                                })

                                const candidateMonthlyEvals = Object.entries(monthlyGroups)
                                  .map(([month, mData]) => ({
                                    month,
                                    avg: Math.round(mData.totalPct / mData.count),
                                    count: mData.count,
                                    date: mData.date
                                  }))
                                  .sort((a, b) => b.date.getTime() - a.date.getTime())

                                return (
                                  <tr key={candidateId} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                      <div>
                                        <p className="font-semibold text-slate-800">{employee?.full_name || 'Squad Member'}</p>
                                        <p className="text-[10px] text-slate-400">{employee?.email || 'No email'}</p>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-700 font-mono font-bold">
                                      {hasSubmitted ? `${submission.score} / ${submission.total_points}` : <span className="text-slate-400 italic font-normal text-xs">Pending / Not Taken</span>}
                                    </td>
                                    <td className="px-6 py-4">
                                      {hasSubmitted ? (
                                        <span className={`font-bold ${pct >= 70 ? 'text-emerald-600' : pct >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                                          {pct}%
                                        </span>
                                      ) : (
                                        <span className="text-slate-300">-</span>
                                      )}
                                    </td>
                                    <td className="px-6 py-4">
                                      {candidateMonthlyEvals.length > 0 ? (
                                        <div className="flex flex-col gap-1 max-w-[170px]">
                                          {candidateMonthlyEvals.map((evalItem) => (
                                            <div key={evalItem.month} className="flex items-center justify-between gap-1.5 text-[11px] bg-slate-50 border border-slate-100 rounded-lg p-1 px-2">
                                              <span className="font-medium text-slate-500 text-[10px]">{evalItem.month}</span>
                                              <div className="flex items-center gap-1">
                                                <span className={`font-bold text-[10px] px-1.5 py-0.5 rounded ${
                                                  evalItem.avg >= 70 
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                                    : evalItem.avg >= 40 
                                                      ? 'bg-amber-50 text-amber-700 border border-amber-100' 
                                                      : 'bg-red-50 text-red-700 border border-red-100'
                                                }`}>
                                                  {evalItem.avg}%
                                                </span>
                                                <span className="text-[9px] text-slate-400 font-semibold">({evalItem.count} {evalItem.count === 1 ? 'test' : 'tests'})</span>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <span className="text-[10px] text-slate-400 italic">No tests taken</span>
                                      )}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 text-xs">
                                      {hasSubmitted ? (
                                        <>
                                          {new Date(submission.submitted_at).toLocaleDateString()} {new Date(submission.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </>
                                      ) : (
                                        <span className="text-slate-300">-</span>
                                      )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                      <div className="flex items-center justify-end gap-3">
                                        {hasSubmitted && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={async () => {
                                              // Load questions to show details
                                              setLoading(true)
                                              try {
                                                const list = await fetchQuestions(submission.assessment_id)
                                                setExamQuestions(list)
                                                setViewingUserSubmission(submission)
                                              } catch (err) {
                                                console.error(err)
                                              } finally {
                                                setLoading(false)
                                              }
                                            }}
                                            className="text-xs text-teal-600 hover:text-teal-700 p-0 font-semibold flex items-center gap-0.5"
                                          >
                                            View Answers
                                            <ChevronRight className="w-3.5 h-3.5" />
                                          </Button>
                                        )}
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => {
                                            setCandidateToDelete(candidateId)
                                            setIsCandidateDeleteModalOpen(true)
                                          }}
                                          className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                                          title="Delete individual candidate assignment"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      )
                    })()
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
      
      <Dialog open={isTakeModalOpen} onOpenChange={setIsTakeModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Take Assessment: {assessmentToTake?.title}</DialogTitle>
            <DialogDescription>
              Are you sure you want to proceed?
            </DialogDescription>
          </DialogHeader>
          <div className="text-sm space-y-3 text-slate-600 mt-2">
            <p><strong className="text-slate-800">1.</strong> The exam will open in <strong className="text-slate-800">FULL-SCREEN mode</strong>.</p>
            <p><strong className="text-slate-800">2.</strong> Exiting full-screen mode before submitting will <strong className="text-red-600">AUTOMATICALLY SUBMIT</strong> your exam.</p>
            <p><strong className="text-slate-800">3.</strong> You will have 30 seconds per question (Total: {(assessmentToTake?.questions_count || 0) * 30} seconds).</p>
            <p><strong className="text-slate-800">4.</strong> Answers are not mandatory to move next, but running out of time auto-submits.</p>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsTakeModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              setIsTakeModalOpen(false);
              if (assessmentToTake) confirmStartExam(assessmentToTake);
            }} className={`${primaryBg} text-white`}>
              Proceed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Assessment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this assessment?
            </DialogDescription>
          </DialogHeader>
          <div className="text-sm text-slate-500 mt-2">
            This will permanently delete all questions and candidate submissions associated with this test. This action cannot be undone.
          </div>
          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" onClick={() => {
              setIsDeleteModalOpen(false)
              setAssessmentToDelete(null)
            }}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                if (assessmentToDelete) {
                  handleDeleteAssessment(assessmentToDelete)
                }
                setIsDeleteModalOpen(false)
                setAssessmentToDelete(null)
              }}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCandidateDeleteModalOpen} onOpenChange={setIsCandidateDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove Candidate Assignment</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this candidate's test assignment?
            </DialogDescription>
          </DialogHeader>
          <div className="text-sm text-slate-500 mt-2">
            This will permanently remove the test assignment for this squad member. If they have already submitted an attempt, their submission score and details will be deleted.
          </div>
          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" onClick={() => {
              setIsCandidateDeleteModalOpen(false)
              setCandidateToDelete(null)
            }}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                if (candidateToDelete) {
                  handleDeleteCandidateAssignment(candidateToDelete)
                }
                setIsCandidateDeleteModalOpen(false)
                setCandidateToDelete(null)
              }}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
