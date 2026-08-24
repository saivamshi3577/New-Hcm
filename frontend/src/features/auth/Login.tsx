import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Users, Layout, LineChart } from 'lucide-react'

import { useAuthStore } from '@/store/authStore'
import { ThreeBackground } from './components/ThreeBackground'
import { FeatureCard } from './components/FeatureCard'
import { LoginCard } from './components/LoginCard'

import logoImg from '@/assets/logo.png'

export default function Login() {
  const { user, role } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (user && role) {
      navigate('/')
    }
  }, [user, role, navigate])

  return (
    <div className="flex h-screen w-screen bg-white relative overflow-hidden">
      {/* Left Section - Branding and Storytelling (Hidden on Mobile) */}
      <div className="hidden lg:flex w-[52%] relative flex-col justify-between p-8 overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50/50 h-full">
        <ThreeBackground />

        {/* Top Logo */}
        <div className="relative z-20">
          <img src={logoImg} alt="Logo" className="h-10 w-auto max-w-[180px] object-contain" />
        </div>

        {/* Content */}
        <div className="relative z-20 flex-1 flex flex-col justify-center max-w-lg mx-auto w-full py-4">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mb-4 leading-tight">
              Manage Work. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Empower Teams.
              </span> <br />
              Deliver Faster.
            </h1>
            <p className="text-base text-slate-600 leading-relaxed mb-6">
              Fusion Task Management helps teams collaborate, assign work, track progress and achieve goals efficiently.
            </p>
            
            <div className="space-y-3">
              <FeatureCard 
                icon={Users} 
                title="Real-time Collaboration" 
                delay={0.2} 
              />
              <FeatureCard 
                icon={Layout} 
                title="Smart Task Management" 
                delay={0.4} 
              />
              <FeatureCard 
                icon={LineChart} 
                title="Analytics & Productivity Insights" 
                delay={0.6} 
              />
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <div className="relative z-20 mt-auto pt-4 border-t border-slate-200/50">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            <div className="flex items-center space-x-3">
              <img src={logoImg} alt="Logo" className="h-7 w-auto object-contain" />
              <div>
                <p className="text-slate-900 font-bold text-xs leading-tight">Fusion Task Management</p>
                <p className="text-slate-500 text-[10px]">Internal Workspace Platform</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Section - Authentication */}
      <div className="w-full lg:w-[48%] flex items-center justify-center p-4 sm:p-8 relative z-20 bg-white h-full overflow-y-auto lg:overflow-hidden">
        {/* Decorative subtle background for mobile only */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-slate-50 lg:hidden -z-10" />
        
        <LoginCard />
      </div>
    </div>
  )
}
