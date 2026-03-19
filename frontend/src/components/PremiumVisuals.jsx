import React from 'react'
import { motion } from 'framer-motion'

export function SignalPill({ children, tone = 'default' }) {
  const toneClass = {
    default: 'border-white/10 bg-white/5 text-dark-200',
    primary: 'border-primary-500/20 bg-primary-500/10 text-primary-300',
    blue: 'border-blue-500/20 bg-blue-500/10 text-blue-300',
    green: 'border-green-500/20 bg-green-500/10 text-green-300',
  }[tone]

  return (
    <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${toneClass}`}>
      {children}
    </span>
  )
}

export function PremiumDevicePreview({ title, subtitle, items = [], accent = 'primary' }) {
  const accentClass = {
    primary: 'from-primary-500/20 to-blue-500/10 border-primary-500/20',
    blue: 'from-blue-500/20 to-cyan-500/10 border-blue-500/20',
    violet: 'from-violet-500/20 to-pink-500/10 border-violet-500/20',
  }[accent]

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`relative overflow-hidden rounded-[2rem] border bg-gradient-to-br ${accentClass} p-3 shadow-2xl`}
    >
      <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-white/10 blur-3xl" />
      <div className="rounded-[1.5rem] border border-white/10 bg-dark-900/80 p-4 backdrop-blur-xl">
        <div className="mb-4 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
          <div className="ml-3 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-dark-400">
            {title}
          </div>
        </div>
        <div className="rounded-[1.25rem] border border-white/5 bg-dark-800/70 p-4">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-white">{title}</p>
              <p className="text-xs text-dark-400">{subtitle}</p>
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-primary-300">
              Live
            </div>
          </div>
          <div className="space-y-3">
            {items.map((item, index) => (
              <motion.div
                key={`${item.label}-${index}`}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.12 + index * 0.08 }}
                className="rounded-2xl border border-white/5 bg-dark-900/60 p-3"
              >
                <div className="mb-1 flex items-center justify-between gap-3">
                  <p className="text-xs font-medium text-dark-300">{item.label}</p>
                  <p className="text-xs font-semibold text-white">{item.value}</p>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-dark-700">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: item.progress || '70%' }}
                    transition={{ delay: 0.2 + index * 0.08, duration: 0.8 }}
                    className="h-full rounded-full bg-gradient-to-r from-primary-500 to-blue-500"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function OrbIllustration({ badge = 'Premium', title, description, stats = [] }) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-dark-900/40 p-8 backdrop-blur-xl">
      <div className="absolute left-0 top-0 h-40 w-40 rounded-full bg-primary-500/15 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-40 w-40 rounded-full bg-blue-500/15 blur-3xl" />
      <motion.div
        animate={{ y: [0, -8, 0], rotate: [0, 2, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute right-10 top-10 h-24 w-24 rounded-[2rem] border border-white/10 bg-gradient-to-br from-primary-500/20 to-blue-500/10 shadow-2xl"
      />
      <motion.div
        animate={{ y: [0, 10, 0], x: [0, -6, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-10 left-10 h-16 w-16 rounded-full border border-white/10 bg-white/5"
      />
      <div className="relative z-10 max-w-md">
        <SignalPill tone="primary">{badge}</SignalPill>
        <h3 className="mt-5 text-3xl font-display font-bold text-white leading-tight">{title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-dark-300">{description}</p>
        <div className="mt-6 grid grid-cols-3 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-white/10 bg-black/20 p-3 text-center">
              <p className="text-2xl font-display font-bold text-white">{stat.value}</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-dark-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
