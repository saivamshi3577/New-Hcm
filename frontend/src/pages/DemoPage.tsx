import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  Users,
  Shield,
  UserCheck,
  CheckSquare,
  BarChart3,
  Clock,
  Briefcase,
  Sliders,
  Sparkles,
  Play,
  LogIn,
  AlertCircle,
  FileText,
  TrendingUp,
  Award,
  Layers,
  Search,
  Bell,
  Settings,
  User,
  PieChart,
  Activity,
  Megaphone,
  ChevronRight,
  Plus,
  Filter,
  DollarSign,
  Download,
  Calendar,
  Lock,
  Building,
  GraduationCap,
  FolderKanban,
  ClipboardList,
  Mail,
  Phone,
  Check,
  Zap,
  Star
} from 'lucide-react'
import logoImg from '@/assets/logo.png'
import ManageSubscriptionLeads from '@/features/super-admin/ManageSubscriptionLeads'

type Role = 'super_admin' | 'admin' | 'hr' | 'team_lead' | 'employee'

export default function DemoPage() {
  const [activeRole, setActiveRole] = useState<Role>('super_admin')
  const [activeNav, setActiveNav] = useState<string>('Dashboard')
  const [demoTaskChecked, setDemoTaskChecked] = useState<Record<number, boolean>>({})

  useEffect(() => {
    document.title = "Interactive Demo — FusionHRMS Portal Showcase"
  }, [])

  const handleRoleChange = (role: Role) => {
    setActiveRole(role)
    setActiveNav('Dashboard')
  }

  // Navigation config matching exact Role Sidebar items
  const navigationConfigs: Record<Role, any> = {
    super_admin: {
      displayName: 'Super Admin',
      portalLabel: 'Executive Platform Portal',
      theme: {
        bg: 'bg-white',
        activeBg: 'bg-indigo-50/80 text-indigo-700 font-bold border-l-4 border-indigo-600',
        activeText: 'text-indigo-600',
        badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        avatarBg: 'from-indigo-600 via-violet-600 to-purple-600',
      },
      items: [
        { name: 'Dashboard', icon: BarChart3 },
        { name: 'Admins', icon: UserCheck },
        { name: 'Org Analytics', icon: TrendingUp },
        { name: 'Subscription Leads', icon: DollarSign },
        { name: 'Audit Logs', icon: FileText },
        { name: 'Settings', icon: Settings },
        { name: 'Profile', icon: User },
      ],
    },
    admin: {
      displayName: 'Admin',
      portalLabel: 'Organization Admin Hub',
      theme: {
        bg: 'bg-white',
        activeBg: 'bg-cyan-50/80 text-cyan-700 font-bold border-l-4 border-cyan-500',
        activeText: 'text-cyan-600',
        badge: 'bg-cyan-50 text-cyan-700 border-cyan-200',
        avatarBg: 'from-cyan-600 to-blue-600',
      },
      items: [
        { name: 'Dashboard', icon: BarChart3 },
        { name: 'Teams & Departments', icon: ClipboardList },
        { name: 'Employees', icon: Users },
        { name: 'Reports & Analytics', icon: TrendingUp },
        { name: 'Announcements', icon: Megaphone },
        { name: 'Profile', icon: User },
      ],
    },
    hr: {
      displayName: 'HR Manager',
      portalLabel: 'Human Resources Portal',
      theme: {
        bg: 'bg-white',
        activeBg: 'bg-amber-50/80 text-amber-800 font-bold border-l-4 border-amber-500',
        activeText: 'text-amber-700',
        badge: 'bg-amber-50 text-amber-800 border-amber-200',
        avatarBg: 'from-amber-500 via-orange-500 to-yellow-500',
      },
      items: [
        { name: 'Dashboard', icon: BarChart3 },
        { name: 'Employee Directory', icon: Users },
        { name: 'Teams & Departments', icon: ClipboardList },
        { name: 'Audit Logs', icon: FileText },
        { name: 'Announcements', icon: Megaphone },
        { name: 'Profile', icon: User },
      ],
    },
    team_lead: {
      displayName: 'Team Lead',
      portalLabel: 'Team Lead Hub',
      theme: {
        bg: 'bg-white',
        activeBg: 'bg-teal-50/80 text-teal-700 font-bold border-l-4 border-teal-500',
        activeText: 'text-teal-600',
        badge: 'bg-teal-50 text-teal-700 border-teal-200',
        avatarBg: 'from-teal-600 to-emerald-500',
      },
      items: [
        { name: 'Dashboard', icon: BarChart3 },
        { name: 'Projects', icon: FolderKanban },
        { name: 'Tasks', icon: CheckSquare },
        { name: 'Team Members', icon: Users },
        { name: 'Reports', icon: TrendingUp },
        { name: 'Skill Track', icon: GraduationCap },
        { name: 'Notifications', icon: Bell },
        { name: 'Profile', icon: User },
      ],
    },
    employee: {
      displayName: 'Employee',
      portalLabel: 'My Workspace',
      theme: {
        bg: 'bg-white',
        activeBg: 'bg-violet-50 text-violet-700 font-bold border-l-4 border-violet-600',
        activeText: 'text-violet-600',
        badge: 'bg-violet-50 text-violet-700 border-violet-200',
        avatarBg: 'from-violet-600 to-indigo-600',
      },
      items: [
        { name: 'Dashboard', icon: BarChart3 },
        { name: 'My Tasks', icon: CheckSquare },
        { name: 'Notifications', icon: Bell },
        { name: 'Performance', icon: Award },
        { name: 'Skill Track', icon: GraduationCap },
        { name: 'Profile', icon: User },
      ],
    },
  }

  const currentRoleConfig = navigationConfigs[activeRole]

  const getProfileUser = () => {
    switch (activeRole) {
      case 'super_admin':
        return { name: 'Super Admin', email: 'superadmin@gmail.com', avatar: 'SA', roleTitle: 'Super Administrator', dept: 'Executive' }
      case 'admin':
        return { name: 'Org Admin', email: 'admin@gmail.com', avatar: 'OA', roleTitle: 'Company Admin', dept: 'Operations' }
      case 'hr':
        return { name: 'HR Manager', email: 'hr@gmail.com', avatar: 'HR', roleTitle: 'Head of HR', dept: 'Human Resources' }
      case 'team_lead':
        return { name: 'Team Lead', email: 'tl@gmail.com', avatar: 'TL', roleTitle: 'Senior Tech Lead', dept: 'Engineering' }
      case 'employee':
        return { name: 'Standard Employee', email: 'employee@gmail.com', avatar: 'SE', roleTitle: 'Software Engineer', dept: 'Frontend Squad' }
    }
  }

  const profileUser = getProfileUser()

  const toggleTaskCheck = (id: number) => {
    setDemoTaskChecked(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans antialiased">
      
      {/* Top Demo Bar - Switch between 5 Roles */}
      <header className="bg-slate-900 text-white border-b border-slate-800 py-2.5 px-4 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Back & Logo */}
          <div className="flex items-center space-x-3">
            <Link
              to="/home"
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>

            <div className="h-4 w-[1px] bg-slate-700 hidden sm:block" />

            <div className="flex items-center space-x-2">
              <img src={logoImg} alt="Logo" className="h-6 w-auto object-contain" />
              <span className="text-xs font-extrabold text-white hidden sm:inline-block">
                Live App UI Demo
              </span>
            </div>
          </div>

          {/* Role Switcher Pills (5 Roles) */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto max-w-full">
            <button
              onClick={() => handleRoleChange('super_admin')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1 shrink-0 ${
                activeRole === 'super_admin'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Super Admin</span>
            </button>

            <button
              onClick={() => handleRoleChange('admin')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1 shrink-0 ${
                activeRole === 'admin'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>

            <button
              onClick={() => handleRoleChange('hr')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1 shrink-0 ${
                activeRole === 'hr'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>HR</span>
            </button>

            <button
              onClick={() => handleRoleChange('team_lead')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1 shrink-0 ${
                activeRole === 'team_lead'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FolderKanban className="w-3.5 h-3.5" />
              <span>TL</span>
            </button>

            <button
              onClick={() => handleRoleChange('employee')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1 shrink-0 ${
                activeRole === 'employee'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Employee</span>
            </button>
          </div>

          {/* Login Link */}
          <div className="hidden lg:flex items-center space-x-2">
            <Link
              to="/login"
              className="text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors flex items-center gap-1"
            >
              <LogIn className="w-3.5 h-3.5" /> Login to Live App
            </Link>
          </div>

        </div>
      </header>

      {/* Main Layout Container matching AppShell */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Exact App Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 shrink-0 hidden md:flex flex-col justify-between p-4 space-y-4 shadow-sm">
          <div className="space-y-4">
            
            {/* Sidebar Logo Header */}
            <div className="px-2 py-2 flex items-center justify-between border-b border-slate-100">
              <img src={logoImg} alt="Logo" className="h-9 w-auto object-contain" />
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${currentRoleConfig.theme.badge}`}>
                {currentRoleConfig.portalLabel}
              </span>
            </div>

            {/* Navigation Items list */}
            <nav className="space-y-1">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2 mb-1">
                {currentRoleConfig.displayName.toUpperCase()} MENU
              </p>
              {currentRoleConfig.items.map((item) => {
                const Icon = item.icon
                const isActive = activeNav === item.name
                return (
                  <button
                    key={item.name}
                    onClick={() => setActiveNav(item.name)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? currentRoleConfig.theme.activeBg
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? currentRoleConfig.theme.activeText : 'text-slate-400'}`} />
                      <span>{item.name}</span>
                    </div>
                    {isActive && <ChevronRight className={`w-3.5 h-3.5 ${currentRoleConfig.theme.activeText}`} />}
                  </button>
                )
              })}
            </nav>

          </div>

          {/* User Profile Footer in Sidebar */}
          <div className="pt-3 border-t border-slate-200 text-xs">
            <div className="flex items-center space-x-3 p-2 rounded-xl bg-slate-50 border border-slate-200">
              <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${currentRoleConfig.theme.avatarBg} text-white font-bold text-xs flex items-center justify-center shrink-0`}>
                {profileUser.avatar}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-extrabold text-slate-900 truncate">{profileUser.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{profileUser.roleTitle}</p>
              </div>
            </div>

            <Link
              to="/home#pricing"
              className="mt-3 w-full py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-extrabold rounded-xl text-xs text-center block shadow-2xs"
            >
              Choose Plan (₹)
            </Link>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-y-auto bg-slate-50">
          
          {/* Exact App Header */}
          <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-20">
            <div className="flex items-center space-x-3">
              <h2 className="text-base font-extrabold text-slate-900">
                {activeNav}
              </h2>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-medium text-slate-500">{currentRoleConfig.displayName} View</span>
            </div>

            <div className="flex items-center space-x-3">
              <div className="relative hidden sm:block">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder={`Search ${activeNav.toLowerCase()}...`}
                  readOnly
                  className="bg-slate-100 border border-slate-200 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-600 focus:outline-none w-48"
                />
              </div>

              <button className="p-1.5 text-slate-500 hover:text-slate-900 bg-slate-100 rounded-lg border border-slate-200 relative">
                <Bell className="w-4 h-4" />
                <span className="w-2 h-2 rounded-full bg-orange-500 absolute top-1 right-1" />
              </button>

              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${currentRoleConfig.theme.badge}`}>
                Demo Portal
              </span>
            </div>
          </div>

          {/* Section Body based on Active Navigation Item */}
          <div className="p-6 space-y-6 max-w-7xl">
            
            {/* =============================================================== */}
            {/* 1. DASHBOARD SECTION                                            */}
            {/* =============================================================== */}
            {activeNav === 'Dashboard' && (
              <div className="space-y-6">
                
                {/* Metric Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                    <p className="text-xs text-slate-500 font-semibold mb-1">
                      {activeRole === 'employee' ? 'Leave Balance' : 'Active Employee Accounts'}
                    </p>
                    <p className="text-2xl font-black text-slate-900">
                      {activeRole === 'employee' ? '18 Days' : '100 / 100'}
                    </p>
                    <p className="text-[10px] text-emerald-600 font-bold mt-1">
                      {activeRole === 'employee' ? 'Casual & Sick Leave Available' : '100% Active Staff'}
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                    <p className="text-xs text-slate-500 font-semibold mb-1">
                      {activeRole === 'employee' ? 'My Open Tasks' : 'Monthly Payroll (PF/ESI/TDS)'}
                    </p>
                    <p className="text-2xl font-black text-teal-700">
                      {activeRole === 'employee' ? '3 Tasks' : '₹42,85,000'}
                    </p>
                    <p className="text-[10px] text-teal-700 font-bold mt-1">
                      {activeRole === 'employee' ? '1 High Priority Due Today' : '100% Statutory Compliant'}
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                    <p className="text-xs text-slate-500 font-semibold mb-1">Sprint Velocity</p>
                    <p className="text-2xl font-black text-slate-900">94.8% <span className="text-xs text-teal-600 font-bold">On Schedule</span></p>
                    <p className="text-[10px] text-slate-400 mt-1">Sprint 14 Active</p>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                    <p className="text-xs text-slate-500 font-semibold mb-1">Skill Competency Score</p>
                    <p className="text-2xl font-black text-orange-600">88.5 <span className="text-xs text-slate-400 font-normal">/100</span></p>
                    <p className="text-[10px] text-slate-400 mt-1">Skill Track Evaluation Active</p>
                  </div>
                </div>

                {/* Dashboard Task Kanban & Work Overview */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-teal-600" /> Active Task Kanban ({currentRoleConfig.displayName})
                    </h3>
                    <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded border border-slate-200">
                      Sprint 14 Board
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                      <span className="font-extrabold text-slate-700 block uppercase tracking-wider text-[10px]">TO DO (2 Tasks)</span>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1 shadow-2xs">
                        <p className="font-bold text-slate-900">Setup ESI Exemption Thresholds</p>
                        <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.2 rounded font-bold inline-block">Urgent</span>
                      </div>
                    </div>

                    <div className="bg-teal-50/50 p-3 rounded-xl border border-teal-200 space-y-2">
                      <span className="font-extrabold text-teal-800 block uppercase tracking-wider text-[10px]">IN PROGRESS (2 Tasks)</span>
                      <div className="bg-white p-2.5 rounded-lg border border-teal-200 space-y-1 shadow-2xs">
                        <p className="font-bold text-slate-900">1-Click PDF Payslip Generator</p>
                        <p className="text-[10px] text-teal-700 font-semibold">Assignee: Ananya Sharma</p>
                        <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                          <div className="bg-teal-600 h-full w-[80%]" />
                        </div>
                      </div>
                    </div>


                    
                    <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-200 space-y-2">
                      <span className="font-extrabold text-emerald-800 block uppercase tracking-wider text-[10px]">DONE (4 Tasks)</span>
                      <div className="bg-white p-2.5 rounded-lg border border-emerald-200 space-y-1 shadow-2xs">
                        <p className="font-bold text-slate-900">PF Statutory Contribution Calculation</p>
                        <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Completed & Verified
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            

            {/* =============================================================== */}
            {/* 2. TASKS / MY TASKS SECTION                                     */}
            {/* =============================================================== */}
            {(activeNav === 'Tasks' || activeNav === 'My Tasks') && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-teal-600" /> {activeNav} Management Queue
                    </h3>
                    <p className="text-xs text-slate-500">Interactive task items — click checkboxes to simulate updating status.</p>
                  </div>
                </div>


                
                <div className="space-y-2.5 text-xs">
                  {[
                    { id: 1, title: 'Implement EPF Statutory Formula Engine', dept: 'Payroll', priority: 'Urgent', status: 'In Progress', due: 'Today' },
                    { id: 2, title: 'Conduct Q3 Performance Appraisals', dept: 'HR Ops', priority: 'High', status: 'Review', due: 'Tomorrow' },
                    { id: 3, title: 'Fix Payslip PDF Download Alignment Issue', dept: 'Engineering', priority: 'Medium', status: 'In Progress', due: 'Today, 5:00 PM' },
                    { id: 4, title: 'Configure Multi-Branch Org Hierarchy', dept: 'Admin', priority: 'Low', status: 'To Do', due: 'In 3 Days' },
                  ].map((t) => {
                    const isChecked = !!demoTaskChecked[t.id]
                    return (
                      <div key={t.id} className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                        isChecked ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200 hover:border-teal-300'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => toggleTaskCheck(t.id)}
                            className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                              isChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white hover:border-teal-500'
                            }`}
                          >
                            {isChecked && <CheckCircle2 className="w-3 h-3" />}
                          </button>
                          <span className={`font-bold ${isChecked ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                            {t.title}
                          </span>
                        </div>


                        
                        <div className="flex items-center space-x-2 text-[11px]">
                          <span className="text-slate-500 font-medium">{t.dept}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            t.priority === 'Urgent' ? 'bg-rose-100 text-rose-800' : t.priority === 'High' ? 'bg-orange-100 text-orange-800' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {t.priority}
                          </span>
                          <span className="text-slate-500 font-mono">{t.due}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* =============================================================== */}
            {/* 3. EMPLOYEES / ADMINS / TEAM MEMBERS SECTION                    */}
            {/* =============================================================== */}
            {(activeNav === 'Employees' || activeNav === 'Admins' || activeNav === 'Team Members') && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-teal-600" /> {activeNav} Directory & Records
                  </h3>
                  <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded border border-slate-200">
                    100 Active Staff Members
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-800 border-b border-slate-200 font-bold">
                      <tr>
                        <th className="p-3">Staff Member</th>
                        <th className="p-3">Designation / Role</th>
                        <th className="p-3">Department</th>
                        <th className="p-3">Current Month Points</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {[
                        { name: 'Rajesh Sharma', title: 'Super Admin / HR Head', dept: 'Executive HR', points: '120 Pts (Aug)', status: 'Active' },
                        { name: 'Priya Verma', title: 'Engineering Team Lead', dept: 'Product Engineering', points: '95 Pts (Aug)', status: 'Active' },
                        { name: 'Ananya Sharma', title: 'Sr. Software Engineer', dept: 'Frontend Squad', points: '85 Pts (Aug)', status: 'Active' },
                        { name: 'Amit Kumar', title: 'System Administrator', dept: 'IT Infrastructure', points: '70 Pts (Aug)', status: 'Active' },
                        { name: 'Rahul Mehta', title: 'Backend Architect', dept: 'API Services', points: '110 Pts (Aug)', status: 'Active' },
                      ].map((emp, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center">
                              {emp.name.split(' ').map(n=>n[0]).join('')}
                            </div>
                            <span>{emp.name}</span>
                          </td>
                          <td className="p-3 text-slate-600 font-medium">{emp.title}</td>
                          <td className="p-3 text-slate-700">{emp.dept}</td>
                          <td className="p-3 font-bold text-teal-700 font-mono">{emp.points}</td>
                          <td className="p-3"><span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">Active</span></td>
                          <td className="p-3 text-right">
                            <button className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded text-[10px] border border-slate-200">
                              View Record
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* =============================================================== */}
            {/* 4. TEAMS & DEPARTMENTS SECTION                                  */}
            {/* =============================================================== */}
            {activeNav === 'Teams & Departments' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-indigo-600" /> Department Hierarchy & Team Squads
                  </h3>
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded border border-indigo-200">
                    4 Active Departments
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {[
                    { name: 'Product Engineering', lead: 'Priya Verma', count: '42 Members', budget: '₹18,50,000 / mo', velocity: '96.2%' },
                    { name: 'HR & People Operations', lead: 'Rajesh Sharma', count: '18 Members', budget: '₹8,20,000 / mo', velocity: '98.5%' },
                    { name: 'Sales & Business Growth', lead: 'Vikram Malhotra', count: '25 Members', budget: '₹12,40,000 / mo', velocity: '91.8%' },
                    { name: 'Finance & Statutory Compliance', lead: 'Neha Gupta', count: '15 Members', budget: '₹6,75,000 / mo', velocity: '100%' },
                  ].map((dept, i) => (
                    <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <span className="font-extrabold text-slate-900 text-sm">{dept.name}</span>
                        <span className="text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded">
                          {dept.count}
                        </span>
                      </div>
                      <div className="space-y-1 text-slate-600">
                        <p><strong className="text-slate-900 font-semibold">Department Head:</strong> {dept.lead}</p>
                        <p><strong className="text-slate-900 font-semibold">Payroll Allocation:</strong> {dept.budget}</p>
                        <p><strong className="text-slate-900 font-semibold">Sprint Velocity:</strong> <span className="text-emerald-600 font-bold">{dept.velocity}</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* =============================================================== */}
            {/* 5. PROJECTS SECTION                                             */}
            {/* =============================================================== */}
            {activeNav === 'Projects' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <FolderKanban className="w-4 h-4 text-teal-600" /> Active Enterprise Projects
                  </h3>
                  <span className="text-[10px] bg-teal-50 text-teal-800 font-bold px-2 py-0.5 rounded border border-teal-200">
                    4 Live Projects
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {[
                    { title: 'FusionHRMS V2.0 Platform Upgrade', lead: 'Priya Verma', progress: 85, status: 'In Progress', due: '15 Aug 2026' },
                    { title: 'Statutory Payroll Engine (PF/ESI/TDS)', lead: 'Rajesh Sharma', progress: 100, status: 'Completed', due: '01 Jul 2026' },
                    { title: 'Mobile Self-Service App (iOS & Android)', lead: 'Ananya Sharma', progress: 60, status: 'In Progress', due: '30 Sep 2026' },
                    { title: 'Skill Track Evaluation & Radar Matrix', lead: 'Rahul Mehta', progress: 90, status: 'Review', due: '10 Aug 2026' },
                  ].map((p, i) => (
                    <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <span className="font-extrabold text-slate-900 text-xs">{p.title}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          p.status === 'Completed' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-teal-50 text-teal-800 border-teal-200'
                        }`}>
                          {p.status}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500">Project Lead: {p.lead}</span>
                          <span className="font-bold text-slate-900">{p.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-teal-600 h-full transition-all" style={{ width: `${p.progress}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* =============================================================== */}
            {/* 6. REPORTS / ORGANIZATION ANALYTICS SECTION                     */}
            {/* =============================================================== */}
            {(activeNav === 'Reports' || activeNav === 'Organization Analytics') && (
              <div className="space-y-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-indigo-600" /> Executive Statutory Payroll & Performance Report
                    </h3>
                    <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200">
                      July 2026 Verified Report
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <p className="text-slate-500 font-medium mb-1">Total Gross Salary Payout</p>
                      <p className="text-xl font-black text-slate-900">₹42,85,000</p>
                      <p className="text-[10px] text-emerald-600 font-bold mt-1">100 Staff Disbursed</p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <p className="text-slate-500 font-medium mb-1">Statutory PF + ESI + TDS Deducted</p>
                      <p className="text-xl font-black text-teal-700">₹10,64,800</p>
                      <p className="text-[10px] text-teal-700 font-bold mt-1">100% Tax Compliant</p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <p className="text-slate-500 font-medium mb-1">Average Organization Attendance</p>
                      <p className="text-xl font-black text-indigo-700">98.2%</p>
                      <p className="text-[10px] text-indigo-700 font-bold mt-1">Full Shift Compliance</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* =============================================================== */}
            {/* SUBSCRIPTION LEADS VISUALIZATION SECTION                        */}
            {/* =============================================================== */}
            {activeNav === 'Subscription Leads' && (
              <ManageSubscriptionLeads />
            )}

            {/* =============================================================== */}
            {/* 7. SKILL TRACK SECTION                                          */}
            {/* =============================================================== */}
            {activeNav === 'Skill Track' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-violet-600" /> Active Skill & Competency Assessments
                  </h3>
                  <span className="text-[10px] bg-violet-50 text-violet-700 font-bold px-2 py-0.5 rounded border border-violet-200">
                    Month: Current (Aug 2026)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {[
                    { title: 'React 19 & TypeScript Frontend Master Test', duration: '30 Mins', questions: 20, avgScore: '88.5%', totalTaken: '24 Staff' },
                    { title: 'Indian Statutory Payroll & Tax Compliance Quiz', duration: '25 Mins', questions: 15, avgScore: '92.0%', totalTaken: '18 Staff' },
                    { title: 'Node.js Microservices & API Architecture', duration: '40 Mins', questions: 25, avgScore: '84.0%', totalTaken: '15 Staff' },
                    { title: 'ISO 27001 Cybersecurity & Data Protection', duration: '20 Mins', questions: 10, avgScore: '96.5%', totalTaken: '40 Staff' },
                  ].map((quiz, i) => (
                    <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-extrabold text-slate-900 text-xs">{quiz.title}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{quiz.questions} MCQ Questions • {quiz.duration}</p>
                        </div>
                        <span className="text-[10px] font-bold bg-violet-50 text-violet-700 px-2 py-0.5 rounded border border-violet-200">
                          {quiz.avgScore} Avg
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-[11px]">
                        <span className="text-slate-500 font-medium">{quiz.totalTaken} Completed</span>
                        <button className="px-3 py-1 bg-violet-600 text-white font-bold rounded-lg text-[10px]">
                          Take Demo Quiz
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* =============================================================== */}
            {/* 8. PERFORMANCE SECTION                                          */}
            {/* =============================================================== */}
            {activeNav === 'Performance' && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Award className="w-4 h-4 text-orange-500" /> Employee Performance Scorecard
                  </h3>
                  <span className="text-[10px] bg-orange-50 text-orange-800 font-bold px-2 py-0.5 rounded border border-orange-200">
                    Q3 Appraisal Active
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                    <p className="text-slate-500 font-medium">Earned Sprint Points</p>
                    <p className="text-2xl font-black text-slate-900 mt-1">420 Pts</p>
                    <p className="text-[10px] text-emerald-600 font-bold mt-1">Rank #1 in Squad</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                    <p className="text-slate-500 font-medium">Task Completion Rate</p>
                    <p className="text-2xl font-black text-teal-700 mt-1">98.5%</p>
                    <p className="text-[10px] text-teal-700 font-bold mt-1">On Time Delivery</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                    <p className="text-slate-500 font-medium">Manager Rating</p>
                    <p className="text-2xl font-black text-orange-600 mt-1 flex items-center justify-center gap-1">
                      <span>4.9</span> <Star className="w-5 h-5 fill-current" />
                    </p>
                    <p className="text-[10px] text-orange-600 font-bold mt-1">Exceeds Expectations</p>
                  </div>
                </div>
              </div>
            )}

            {/* =============================================================== */}
            {/* 9. NOTIFICATIONS SECTION                                        */}
            {/* =============================================================== */}
            {activeNav === 'Notifications' && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-teal-600" /> Activity Alerts & System Feed
                  </h3>
                  <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded border border-slate-200">
                    Live Feed
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  {[
                    { title: 'July 2026 Statutory Payroll Disbursed', desc: 'Net salary transferred to bank account (HDFC Bank Batch NEFT).', time: '10 mins ago', type: 'payroll' },
                    { title: 'New Task Assigned: Sprint 14 PDF Payslip Generator', desc: 'Priya Verma assigned high priority task to your queue.', time: '1 hour ago', type: 'task' },
                    { title: 'Skill Track Quiz Completed', desc: 'Passed React 19 & TypeScript Test with 95% score grade.', time: 'Yesterday', type: 'skill' },
                  ].map((n, i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start space-x-3">
                      <div className="p-1.5 rounded-lg bg-teal-50 text-teal-700 mt-0.5">
                        <Bell className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <p className="font-bold text-slate-900">{n.title}</p>
                          <span className="text-[10px] text-slate-400 font-mono">{n.time}</span>
                        </div>
                        <p className="text-slate-600 text-[11px] mt-0.5">{n.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* =============================================================== */}
            {/* 10. AUDIT LOGS SECTION                                          */}
            {/* =============================================================== */}
            {activeNav === 'Audit Logs' && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-700" /> Security Audit Logs & System Trail
                  </h3>
                  <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded border border-slate-200">
                    Encrypted Logs
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-800 border-b border-slate-200 font-bold">
                      <tr>
                        <th className="p-3">Timestamp</th>
                        <th className="p-3">Actor / User</th>
                        <th className="p-3">Event Action</th>
                        <th className="p-3">IP Address</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                      {[
                        { time: '03 Aug 2026, 11:30 AM', user: 'Rajesh Sharma', action: 'Approved July Payroll Batch', ip: '103.24.12.89', status: 'SUCCESS' },
                        { time: '03 Aug 2026, 10:15 AM', user: 'Ananya Sharma', action: 'Submitted Skill Track Exam', ip: '103.24.12.91', status: 'SUCCESS' },
                        { time: '02 Aug 2026, 05:40 PM', user: 'Priya Verma', action: 'Updated Task #14 Priority to Urgent', ip: '103.24.12.90', status: 'SUCCESS' },
                      ].map((log, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="p-3 text-slate-500">{log.time}</td>
                          <td className="p-3 font-bold text-slate-900 font-sans">{log.user}</td>
                          <td className="p-3 text-slate-700 font-sans">{log.action}</td>
                          <td className="p-3 text-slate-500">{log.ip}</td>
                          <td className="p-3"><span className="text-emerald-700 font-bold">{log.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* =============================================================== */}
            {/* 11. ANNOUNCEMENTS SECTION                                       */}
            {/* =============================================================== */}
            {activeNav === 'Announcements' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-orange-500" /> Company Announcements Board
                  </h3>
                  <span className="text-[10px] bg-orange-50 text-orange-800 font-bold px-2 py-0.5 rounded border border-orange-200">
                    3 Published Notices
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  {[
                    { title: 'July 2026 Payroll Disbursed & Form 16 Available', date: '01 Aug 2026', author: 'HR Dept', body: 'All employee salaries have been credited to bank accounts. Digital PDF payslips and Form 16 files are available in your portal.' },
                    { title: 'Q3 Town Hall & Quarterly Appraisals Meeting', date: '28 Jul 2026', author: 'Rajesh Sharma', body: 'Join us for the quarterly all-hands meeting to review performance metrics and announce team awards.' },
                  ].map((a, i) => (
                    <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <span className="font-extrabold text-slate-900 text-sm">{a.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{a.date} • {a.author}</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed text-xs">{a.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* =============================================================== */}
            {/* 12. SETTINGS SECTION                                            */}
            {/* =============================================================== */}
            {activeNav === 'Settings' && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-slate-700" /> Organization Settings & Statutory Rules
                  </h3>
                  <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded border border-slate-200">
                    System Configuration
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <span className="font-bold text-slate-900 block">Organization Name</span>
                    <input type="text" value="TechFusion India Ltd" readOnly className="w-full bg-white border border-slate-200 p-2 rounded-lg text-slate-800 font-medium" />
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <span className="font-bold text-slate-900 block">Statutory Payroll Engine</span>
                    <input type="text" value="Enabled (EPF 12% + ESI 3.25% + TDS Form 16)" readOnly className="w-full bg-white border border-slate-200 p-2 rounded-lg text-slate-800 font-medium" />
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <span className="font-bold text-slate-900 block">Working Days & Shift Cycle</span>
                    <input type="text" value="5 Days / Week (Monday to Friday, 9:00 AM - 6:00 PM)" readOnly className="w-full bg-white border border-slate-200 p-2 rounded-lg text-slate-800 font-medium" />
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <span className="font-bold text-slate-900 block">Currency & Localization</span>
                    <input type="text" value="Indian Rupee (INR ₹) • IST Timezone" readOnly className="w-full bg-white border border-slate-200 p-2 rounded-lg text-slate-800 font-medium" />
                  </div>
                </div>
              </div>
            )}

            {/* =============================================================== */}
            {/* 13. PROFILE SECTION                                             */}
            {/* =============================================================== */}
            {activeNav === 'Profile' && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-600" /> User Profile & Digital File Vault
                  </h3>
                  <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200">
                    Verified Profile
                  </span>
                </div>

                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 w-full md:w-auto shrink-0">
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-tr ${currentRoleConfig.theme.avatarBg} text-white font-black text-xl flex items-center justify-center shadow-md`}>
                      {profileUser.avatar}
                    </div>
                    <div>
                      <h4 className="text-base font-extrabold text-slate-900">{profileUser.name}</h4>
                      <p className="text-slate-600 font-semibold text-xs">{profileUser.roleTitle}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{profileUser.email}</p>
                    </div>
                  </div>

                  <div className="flex-1 space-y-3 w-full">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-slate-500 font-medium block">Department</span>
                        <span className="font-bold text-slate-900">{profileUser.dept}</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-slate-500 font-medium block">Bank Salary Payout</span>
                        <span className="font-bold text-slate-900">HDFC Bank (IFSC: HDFC0001234)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  )
}
