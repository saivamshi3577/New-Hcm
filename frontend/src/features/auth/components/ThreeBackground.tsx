import { motion } from 'framer-motion'

export function ThreeBackground() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
      {/* Ambient background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30" />

      {/* Bubble 1: Large Liquid Sphere */}
      <motion.div
        className="absolute w-[350px] h-[350px] bg-gradient-to-tr from-indigo-200/50 via-purple-100/60 to-pink-100/40 rounded-[50%] blur-[2px] shadow-[inset_-10px_-10px_30px_rgba(255,255,255,0.6),10px_10px_30px_rgba(168,85,247,0.1),0_0_80px_rgba(168,85,247,0.05)] border border-white/40"
        style={{ top: '10%', left: '5%' }}
        animate={{
          y: [0, -25, 0],
          x: [0, 15, 0],
          rotate: [0, 120, 0],
          borderRadius: [
            "42% 58% 70% 30% / 45% 45% 55% 55%",
            "70% 30% 52% 48% / 60% 40% 60% 40%",
            "34% 66% 40% 60% / 50% 30% 70% 50%",
            "42% 58% 70% 30% / 45% 45% 55% 55%"
          ]
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Bubble 2: Medium Soft Blue Liquid Sphere */}
      <motion.div
        className="absolute w-[280px] h-[280px] bg-gradient-to-tr from-blue-200/50 via-cyan-100/60 to-indigo-100/40 rounded-[50%] blur-[2px] shadow-[inset_-10px_-10px_25px_rgba(255,255,255,0.6),10px_10px_25px_rgba(59,130,246,0.1),0_0_60px_rgba(59,130,246,0.05)] border border-white/40"
        style={{ bottom: '15%', right: '10%' }}
        animate={{
          y: [0, 30, 0],
          x: [0, -20, 0],
          rotate: [0, -180, 0],
          borderRadius: [
            "50% 50% 30% 70% / 50% 60% 40% 50%",
            "30% 70% 70% 30% / 50% 30% 70% 50%",
            "60% 40% 45% 55% / 40% 60% 40% 60%",
            "50% 50% 30% 70% / 50% 60% 40% 50%"
          ]
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
      />

      {/* Bubble 3: Small Pink/Violet Liquid Sphere */}
      <motion.div
        className="absolute w-[220px] h-[220px] bg-gradient-to-tr from-purple-200/40 via-pink-100/50 to-indigo-50/40 rounded-[50%] blur-[1px] shadow-[inset_-8px_-8px_20px_rgba(255,255,255,0.6),8px_8px_20px_rgba(236,72,153,0.08),0_0_50px_rgba(236,72,153,0.05)] border border-white/30"
        style={{ top: '45%', left: '45%' }}
        animate={{
          y: [0, -18, 0],
          x: [0, -15, 0],
          rotate: [0, 90, 0],
          borderRadius: [
            "60% 40% 60% 40% / 40% 60% 40% 60%",
            "40% 60% 30% 70% / 60% 40% 60% 40%",
            "50% 50% 60% 40% / 40% 50% 50% 60%",
            "60% 40% 60% 40% / 40% 60% 40% 60%"
          ]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
      />

      {/* Subtle depth overlay */}
      <div className="absolute inset-0 bg-white/[0.08] backdrop-blur-[1px]" />
    </div>
  )
}
