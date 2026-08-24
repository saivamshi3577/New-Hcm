import { motion } from 'framer-motion'
import { LayoutDashboard, Users, Bell, MessageSquare, CheckSquare } from 'lucide-react'

export function ParticleLayer() {
  const particles = [
    { icon: LayoutDashboard, top: '15%', left: '10%', delay: 0 },
    { icon: Users, top: '25%', left: '75%', delay: 1.5 },
    { icon: Bell, top: '65%', left: '15%', delay: 3 },
    { icon: MessageSquare, top: '75%', left: '80%', delay: 4.5 },
    { icon: CheckSquare, top: '45%', left: '85%', delay: 2 },
  ]

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10 hidden md:block">
      {particles.map((particle, idx) => {
        const Icon = particle.icon
        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: [0.4, 0.8, 0.4],
              y: [0, -20, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: particle.delay,
            }}
            style={{ top: particle.top, left: particle.left }}
            className="absolute p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-xl"
          >
            <Icon className="w-8 h-8 text-white/50" />
          </motion.div>
        )
      })}
    </div>
  )
}
