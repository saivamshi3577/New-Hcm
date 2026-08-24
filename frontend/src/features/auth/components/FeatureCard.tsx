import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  delay: number
}

export function FeatureCard({ icon: Icon, title, delay }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay }}
      className="flex items-center space-x-3 text-slate-700 bg-white/40 backdrop-blur-md border border-white/60 px-4 py-3 rounded-lg shadow-sm"
    >
      <div className="bg-blue-500/20 p-2 rounded-md">
        <Icon className="w-5 h-5 text-blue-400" />
      </div>
      <span className="font-medium">{title}</span>
    </motion.div>
  )
}
