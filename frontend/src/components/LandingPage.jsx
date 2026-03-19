import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView, useMotionValue, useSpring, AnimatePresence } from 'framer-motion'

// ─── Animated Counter ─────────────────────────────────────────────────────────
const Counter = ({ target, suffix = '', prefix = '' }) => {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!isInView) return
    let start = 0
    const duration = 2000
    const step = 16
    const increment = (target / (duration / step))
    const timer = setInterval(() => {
      start += increment
      if (start >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, step)
    return () => clearInterval(timer)
  }, [isInView, target])

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>
}

// ─── Floating Particle ────────────────────────────────────────────────────────
const Particle = ({ style }) => (
  <div className="absolute rounded-full pointer-events-none animate-float-particle" style={style} />
)

// ─── Feature Card ─────────────────────────────────────────────────────────────
const FeatureCard = ({ icon, title, desc, gradient, delay }) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className="group relative p-6 rounded-2xl bg-dark-800/50 border border-white/5 hover:border-white/15 transition-all duration-500 hover:-translate-y-1 overflow-hidden cursor-default"
    >
      {/* Glow on hover */}
      <div className={`absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${gradient} blur-sm -z-10`} />
      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 text-2xl ${gradient.replace('bg-gradient-to-br', 'bg-gradient-to-br')} bg-opacity-10`}
        style={{ background: 'rgba(20,184,166,0.08)' }}>
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-primary-300 transition-colors">{title}</h3>
      <p className="text-sm text-dark-400 leading-relaxed">{desc}</p>
    </motion.div>
  )
}

// ─── Step Card ────────────────────────────────────────────────────────────────
const StepCard = ({ number, title, desc, delay }) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      className="flex flex-col items-center text-center"
    >
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-blue-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-primary-500/30 mb-5">
        {number}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-dark-400 leading-relaxed max-w-xs">{desc}</p>
    </motion.div>
  )
}

// ─── Testimonial Card ─────────────────────────────────────────────────────────
const TestimonialCard = ({ quote, name, role, avatar, delay }) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, delay }}
      className="p-6 rounded-2xl bg-dark-800/40 border border-white/5 hover:border-primary-500/20 transition-all duration-300"
    >
      <div className="flex gap-1 mb-4">
        {[...Array(5)].map((_, i) => <span key={i} className="text-yellow-400 text-sm">★</span>)}
      </div>
      <p className="text-dark-300 text-sm leading-relaxed mb-5 italic">&ldquo;{quote}&rdquo;</p>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
          {avatar}
        </div>
        <div>
          <p className="text-white font-semibold text-sm">{name}</p>
          <p className="text-dark-500 text-xs">{role}</p>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main Landing Page ─────────────────────────────────────────────────────────
const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const features = [
    { icon: '🎯', title: 'AI-Powered Clipping', desc: 'Our AI analyzes your entire video and extracts the highest-engagement moments that are proven to go viral.', gradient: 'bg-gradient-to-br from-primary-500/20 to-teal-400/10', delay: 0 },
    { icon: '🌍', title: '50+ Languages', desc: 'Auto-generate subtitles and translate your content in 50+ languages to reach a global audience instantly.', gradient: 'bg-gradient-to-br from-blue-500/20 to-indigo-400/10', delay: 0.05 },
    { icon: '📱', title: 'Multi-Platform Publish', desc: 'Publish directly to YouTube Shorts, Instagram Reels, TikTok & Facebook from a single unified dashboard.', gradient: 'bg-gradient-to-br from-purple-500/20 to-pink-400/10', delay: 0.1 },
    { icon: '🎙️', title: 'AI Video Dubbing', desc: 'Clone any voice and dub your videos into multiple languages while preserving the original energy.', gradient: 'bg-gradient-to-br from-orange-500/20 to-amber-400/10', delay: 0.15 },
    { icon: '🎨', title: 'Brand Studio', desc: 'Apply your logo, colors, custom fonts and watermarks to every clip automatically with Brand Studio.', gradient: 'bg-gradient-to-br from-rose-500/20 to-pink-400/10', delay: 0.2 },
    { icon: '⚡', title: 'Batch Processing', desc: 'Upload multiple videos at once and let Locaa AI process them all in parallel — save hours of editing.', gradient: 'bg-gradient-to-br from-cyan-500/20 to-sky-400/10', delay: 0.25 },
  ]

  const testimonials = [
    { quote: "Locaa AI cut my editing time from 6 hours to 15 minutes. I went from 2k to 80k followers in 3 months just by posting more consistently.", name: "Arjun Sharma", role: "YouTube Creator · 80K followers", avatar: "AS", delay: 0 },
    { quote: "I run a marketing agency. Locaa AI helps us deliver 10x more content for our clients. It's like having a full editing team for $49/month.", name: "Priya Mehta", role: "Agency Owner · Mumbai", avatar: "PM", delay: 0.1 },
    { quote: "The multi-language dubbing feature is insane. My English content now gets huge engagement in Hindi and Spanish markets.", name: "Rahul Nair", role: "Digital Creator · 200K", avatar: "RN", delay: 0.2 },
  ]

  const particles = Array.from({ length: 20 }, (_, i) => ({
    width: `${Math.random() * 4 + 2}px`,
    height: `${Math.random() * 4 + 2}px`,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    background: i % 3 === 0 ? 'rgba(20,184,166,0.6)' : i % 3 === 1 ? 'rgba(56,189,248,0.5)' : 'rgba(168,85,247,0.4)',
    animationDelay: `${Math.random() * 8}s`,
    animationDuration: `${Math.random() * 8 + 6}s`,
  }))

  return (
    <div className="min-h-screen bg-dark-900 text-white overflow-x-hidden">

      {/* ── Navbar ─────────────────────────────────────── */}
      <motion.nav
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-dark-900/90 backdrop-blur-xl border-b border-white/5 shadow-xl' : 'bg-transparent'}`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-primary-500/30">L</div>
            <span className="text-xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-blue-400">Locaa AI</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8 text-sm text-dark-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Reviews</a>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="text-sm text-dark-400 hover:text-white transition-colors px-4 py-2">Log In</Link>
            <Link to="/register" className="text-sm font-semibold bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white px-5 py-2.5 rounded-xl transition-all duration-200 shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:-translate-y-0.5">
              Start Free →
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button className="md:hidden text-white p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <div className={`w-5 h-0.5 bg-white mb-1 transition-all ${mobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
            <div className={`w-5 h-0.5 bg-white mb-1 transition-all ${mobileMenuOpen ? 'opacity-0' : ''}`} />
            <div className={`w-5 h-0.5 bg-white transition-all ${mobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-dark-900/95 backdrop-blur-xl border-t border-white/5 px-6 py-4 flex flex-col gap-4"
            >
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-dark-400 hover:text-white py-2">Features</a>
              <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-dark-400 hover:text-white py-2">How It Works</a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-dark-400 hover:text-white py-2">Pricing</a>
              <div className="flex gap-3 pt-2">
                <Link to="/login" className="flex-1 text-center py-2.5 rounded-xl border border-white/10 text-sm text-white">Log In</Link>
                <Link to="/register" className="flex-1 text-center py-2.5 rounded-xl bg-primary-500 text-sm font-semibold text-white">Start Free</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ── HERO ──────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 pb-16 px-6 overflow-hidden">
        {/* Ambient blobs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary-500/10 rounded-full filter blur-[120px] animate-blob" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full filter blur-[120px] animate-blob" style={{ animationDelay: '3s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-500/8 rounded-full filter blur-[100px] animate-blob" style={{ animationDelay: '6s' }} />
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {particles.map((p, i) => <Particle key={i} style={p} />)}
        </div>

        {/* Grid overlay */}
        <div className="absolute inset-0 bg-grid-dots opacity-30 pointer-events-none" />

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 mb-8"
        >
          <span className="inline-flex items-center gap-2 bg-primary-500/10 text-primary-400 border border-primary-500/20 rounded-full px-4 py-1.5 text-sm font-medium">
            <span className="w-2 h-2 bg-primary-400 rounded-full animate-pulse" />
            AI-Powered Video Repurposing Platform
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 text-5xl md:text-7xl font-display font-bold text-center max-w-5xl leading-tight mb-6"
        >
          Turn{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-400 via-teal-300 to-blue-400 animate-gradient-x">
            Long Videos
          </span>
          <br />
          into Viral{' '}
          <span className="relative inline-block">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 animate-gradient-x" style={{ animationDelay: '0.5s' }}>
              Shorts
            </span>
            <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none">
              <path d="M2 6 Q50 2 100 5 Q150 8 198 4" stroke="url(#underline-grad)" strokeWidth="3" strokeLinecap="round" fill="none" />
              <defs>
                <linearGradient id="underline-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#60a5fa" />
                  <stop offset="100%" stopColor="#c084fc" />
                </linearGradient>
              </defs>
            </svg>
          </span>
          {' '}in Seconds
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="relative z-10 text-lg md:text-xl text-dark-400 text-center max-w-2xl mb-10 leading-relaxed"
        >
          Locaa AI automatically finds viral moments, adds subtitles in 50+ languages,
          dubs voices, applies your branding, and publishes to all platforms — all in one click.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="relative z-10 flex flex-col sm:flex-row items-center gap-4 mb-14"
        >
          <Link
            to="/register"
            className="group relative overflow-hidden bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-300 shadow-xl shadow-primary-500/30 hover:shadow-primary-500/50 hover:-translate-y-1 text-base flex items-center gap-2"
          >
            <span>Start for Free</span>
            <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </Link>
          <a
            href="#how-it-works"
            className="text-dark-300 hover:text-white border border-white/10 hover:border-white/20 font-medium px-8 py-4 rounded-xl transition-all duration-300 text-base flex items-center gap-2 bg-dark-800/40 backdrop-blur-sm"
          >
            <span>▶</span> See How It Works
          </a>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="relative z-10 flex flex-wrap items-center justify-center gap-6 text-xs text-dark-500 mb-16"
        >
          <span className="flex items-center gap-1.5"><span className="text-green-400">✓</span> No credit card required</span>
          <span className="flex items-center gap-1.5"><span className="text-green-400">✓</span> Free tier available</span>
          <span className="flex items-center gap-1.5"><span className="text-green-400">✓</span> Cancel anytime</span>
          <span className="flex items-center gap-1.5"><span className="text-green-400">✓</span> GDPR compliant</span>
        </motion.div>

        {/* App Preview Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-5xl"
        >
          {/* Glow behind mockup */}
          <div className="absolute -inset-4 bg-gradient-to-r from-primary-500/20 via-blue-500/15 to-purple-500/20 rounded-3xl filter blur-2xl" />

          <div className="relative bg-dark-800/70 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            {/* Mockup top bar */}
            <div className="bg-dark-900/80 border-b border-white/5 px-5 py-3 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <div className="w-3 h-3 rounded-full bg-green-500/70" />
              <div className="flex-1 mx-4 bg-dark-700/60 rounded-lg px-4 py-1.5 text-xs text-dark-400 text-center">app.locaaai.com/dashboard</div>
              <div className="flex gap-2">
                <div className="w-5 h-5 rounded bg-dark-700/60" />
                <div className="w-5 h-5 rounded bg-dark-700/60" />
              </div>
            </div>

            {/* Mockup body */}
            <div className="p-6 grid grid-cols-4 gap-4 min-h-[280px]">
              {/* Sidebar */}
              <div className="col-span-1 space-y-3">
                {['Dashboard', 'Create Job', 'My Clips', 'Analytics', 'Publish', 'Branding'].map((item, i) => (
                  <div key={i} className={`px-3 py-2 rounded-lg text-xs flex items-center gap-2 transition-colors ${i === 1 ? 'bg-primary-500/20 text-primary-300 border border-primary-500/20' : 'text-dark-400 hover:bg-dark-700/50'}`}>
                    <div className={`w-5 h-5 rounded flex-shrink-0 ${i === 1 ? 'bg-primary-500/30' : 'bg-dark-700'}`} />
                    {item}
                  </div>
                ))}
              </div>

              {/* Main content */}
              <div className="col-span-3 space-y-4">
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Clips Generated', val: '1,247', color: 'text-primary-400' },
                    { label: 'Total Views', val: '2.4M', color: 'text-blue-400' },
                    { label: 'Time Saved', val: '68 hrs', color: 'text-purple-400' },
                  ].map((s, i) => (
                    <div key={i} className="bg-dark-900/60 border border-white/5 rounded-xl p-3">
                      <p className={`text-lg font-bold ${s.color}`}>{s.val}</p>
                      <p className="text-xs text-dark-500">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Video processing bar */}
                <div className="bg-dark-900/60 border border-white/5 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-white">Processing: video_review_2024.mp4</span>
                    <span className="text-xs text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded-full">AI Clipping • 73%</span>
                  </div>
                  <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-gradient-to-r from-primary-600 to-primary-400 rounded-full animate-progress-shimmer" />
                  </div>
                  <div className="flex gap-2 mt-3">
                    {['🎯 5 viral clips found', '🌍 Hindi • English', '📱 Ready to publish'].map((tag, i) => (
                      <span key={i} className="text-xs bg-dark-800 border border-white/5 text-dark-400 px-2 py-0.5 rounded-full">{tag}</span>
                    ))}
                  </div>
                </div>

                {/* Clips grid */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { dur: '0:42', views: '12.4K', platform: '▶ YT' },
                    { dur: '0:58', views: '8.9K', platform: '📸 IG' },
                    { dur: '0:33', views: '31K', platform: '♪ TT' },
                  ].map((c, i) => (
                    <div key={i} className={`relative aspect-[9/16] max-h-16 rounded-lg overflow-hidden bg-gradient-to-br ${['from-primary-900/60 to-dark-900', 'from-blue-900/60 to-dark-900', 'from-purple-900/60 to-dark-900'][i]} border border-white/5 flex flex-col items-center justify-center`}>
                      <p className="text-xs font-bold text-white">{c.views}</p>
                      <p className="text-xs text-dark-400">{c.platform}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── STATS BAR ─────────────────────────────────── */}
      <section className="py-12 border-y border-white/5 bg-dark-800/30 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { val: 50000, suffix: '+', label: 'Clips Generated', color: 'text-primary-400' },
              { val: 12000, suffix: '+', label: 'Active Creators', color: 'text-blue-400' },
              { val: 50, suffix: '+', label: 'Languages Supported', color: 'text-purple-400' },
              { val: 98, suffix: '%', label: 'Satisfaction Rate', color: 'text-pink-400' },
            ].map((stat, i) => (
              <div key={i} className="space-y-1">
                <p className={`text-4xl font-bold font-display ${stat.color}`}>
                  <Counter target={stat.val} suffix={stat.suffix} />
                </p>
                <p className="text-xs text-dark-500 uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-primary-400 text-sm font-semibold tracking-widest uppercase"
            >
              Everything You Need
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-display font-bold mt-3 mb-4"
            >
              Packed with{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-blue-400">
                Pro Features
              </span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-dark-400 max-w-xl mx-auto"
            >
              From AI clipping to multi-platform publishing — everything a serious creator needs in one place.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => <FeatureCard key={i} {...f} />)}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-6 bg-dark-800/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-blue-400 text-sm font-semibold tracking-widest uppercase"
            >
              Simple 3-Step Process
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-display font-bold mt-3"
            >
              From Long Video to{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                Viral Clip
              </span>
            </motion.h2>
          </div>

          <div className="relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-7 left-[calc(16.66%-1px)] right-[calc(16.66%-1px)] h-0.5 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <StepCard number="1" title="Paste Your Video URL" desc="Drop a YouTube link, upload a file, or connect your Google Drive. Any format, any length." delay={0} />
              <StepCard number="2" title="AI Does the Magic" desc="Our AI transcribes, analyzes engagement signals, and extracts the best 30–90 second moments." delay={0.15} />
              <StepCard number="3" title="Publish Everywhere" desc="Review your clips, apply branding, add subtitles, and publish to all platforms in one click." delay={0.3} />
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING TEASER ────────────────────────────── */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-display font-bold mb-4"
            >
              Simple,{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-teal-300">Transparent</span>
              {' '}Pricing
            </motion.h2>
            <p className="text-dark-400">Start free. Scale when you grow.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Starter', price: '₹0', period: 'forever', color: 'border-white/10',
                features: ['5 clips/month', '720p export', '2 platforms', 'Basic subtitles'],
                cta: 'Start Free', ctaStyle: 'border border-white/15 hover:border-white/30 text-white',
              },
              {
                name: 'Pro', price: '₹1,499', period: '/month', color: 'border-primary-500/50', popular: true,
                features: ['50 clips/month', '4K export', 'All platforms', '50+ language subtitles', 'AI Dubbing', 'Brand Studio'],
                cta: 'Get Pro', ctaStyle: 'bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white shadow-lg shadow-primary-500/25',
              },
              {
                name: 'Business', price: '₹3,999', period: '/month', color: 'border-white/10',
                features: ['Unlimited clips', '4K export', 'All platforms', 'Batch processing', 'Team collaboration', 'Priority support', 'White-label'],
                cta: 'Get Business', ctaStyle: 'border border-white/15 hover:border-white/30 text-white',
              },
            ].map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative p-7 rounded-2xl border ${plan.color} bg-dark-800/40 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 ${plan.popular ? 'ring-1 ring-primary-500/30' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary-600 to-primary-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg shadow-primary-500/30">
                    MOST POPULAR
                  </div>
                )}
                <p className="text-sm font-semibold text-dark-400 mb-1">{plan.name}</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-bold font-display text-white">{plan.price}</span>
                  <span className="text-dark-500 text-sm">{plan.period}</span>
                </div>
                <ul className="space-y-2.5 my-6">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-dark-300">
                      <span className="text-primary-400 text-xs">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className={`block w-full text-center py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${plan.ctaStyle}`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────── */}
      <section id="testimonials" className="py-24 px-6 bg-dark-800/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl font-display font-bold mb-3"
            >
              Loved by{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-400">Creators</span>
            </motion.h2>
            <p className="text-dark-400">Join thousands of creators who save hours every week with Locaa AI.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => <TestimonialCard key={i} {...t} />)}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative p-12 rounded-3xl overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-900/40 via-dark-800/60 to-blue-900/40 rounded-3xl border border-primary-500/20" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-primary-500/15 rounded-full filter blur-[60px]" />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative z-10"
            >
              <h2 className="text-4xl md:text-5xl font-display font-bold mb-5">
                Ready to grow{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-blue-400">10x faster?</span>
              </h2>
              <p className="text-dark-400 mb-8 text-lg max-w-xl mx-auto">
                Join 12,000+ creators already using Locaa AI to repurpose content and grow their audience automatically.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/register"
                  className="group bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-semibold px-10 py-4 rounded-xl transition-all duration-300 shadow-xl shadow-primary-500/30 hover:shadow-primary-500/50 hover:-translate-y-1 text-base inline-flex items-center gap-2 justify-center"
                >
                  Get Started &mdash; It&apos;s Free
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </Link>
                <Link
                  to="/login"
                  className="border border-white/15 hover:border-white/30 text-white font-medium px-10 py-4 rounded-xl transition-all duration-300 text-base bg-dark-800/40"
                >
                  Already have an account? Log in
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">L</div>
                <span className="font-display font-bold text-white">Locaa AI</span>
              </div>
              <p className="text-dark-500 text-sm leading-relaxed">AI-powered video repurposing for modern creators.</p>
            </div>
            {[
              { title: 'Product', links: ['Features', 'Pricing', 'Changelog', 'Roadmap'] },
              { title: 'Resources', links: ['Documentation', 'Blog', 'Tutorials', 'API Docs'] },
              { title: 'Company', links: ['About', 'Careers', 'Privacy Policy', 'Terms of Service'] },
            ].map((col, i) => (
              <div key={i}>
                <p className="text-white font-semibold text-sm mb-3">{col.title}</p>
                <ul className="space-y-2">
                  {col.links.map((link, j) => (
                    <li key={j}><a href="#" className="text-dark-500 text-sm hover:text-white transition-colors">{link}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-dark-600">
            <p>© 2026 Locaa AI. All rights reserved.</p>
            <p>Made with ❤️ for creators worldwide</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
