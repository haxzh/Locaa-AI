import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { FaArrowLeft, FaEnvelope, FaSpinner, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'
import { OrbIllustration, PremiumDevicePreview, SignalPill } from './PremiumVisuals'
import '../index.css'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

function ForgotPassword() {
  const navigate = useNavigate()

  // State
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')

  const [step, setStep] = useState(1) // 1 = Request OTP, 2 = Verify & Reset
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Step 1: Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')

    try {
      await axios.post(`${API_BASE}/api/auth/forgot-password-otp`, { email })
      setMessage('Password reset code sent. Please check your email.')
      setStep(2)
    } catch (err) {
      setError(err?.response?.data?.error || 'Unable to send reset code.')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Verify OTP and set New Password
  const handleResetPassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.')
      setLoading(false)
      return
    }

    try {
      const response = await axios.post(`${API_BASE}/api/auth/reset-password-otp`, {
        email,
        otp,
        new_password: newPassword
      })

      setMessage(response.data.message || 'Password successfully reset!')

      // Auto redirect to login after short delay
      setTimeout(() => {
        navigate('/login')
      }, 2000)

    } catch (err) {
      setError(err?.response?.data?.error || 'Invalid or expired OTP.')
    } finally {
      setLoading(false)
    }
  }

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
  };
  const trustSignals = ['Secure OTP reset', '2-step verification', 'Recovery in minutes']

  return (
    <motion.div
      className="min-h-screen flex items-center justify-center p-4 md:p-6 bg-dark-900 relative overflow-hidden"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Ambient Background Elements */}
      <div className="absolute top-0 left-0 w-[700px] h-[700px] bg-primary-500/10 rounded-full mix-blend-screen filter blur-[140px] animate-blob" />
      <div className="absolute bottom-0 right-0 w-[640px] h-[640px] bg-blue-500/10 rounded-full mix-blend-screen filter blur-[140px] animate-blob" style={{ animationDelay: '2s' }} />
      <div className="absolute inset-0 bg-grid-dots opacity-20 pointer-events-none" />

      <div className="glass-panel w-full max-w-6xl relative z-10 overflow-hidden shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="hidden lg:block border-r border-white/5 bg-dark-900/40 p-6">
            <OrbIllustration
              badge="Account Recovery"
              title="Bring your workspace back online without friction"
              description="Reset access fast and keep your creator pipeline secure with OTP-based password recovery designed for startup teams."
              stats={[
                { value: '2 min', label: 'reset flow' },
                { value: '100%', label: 'encrypted' },
                { value: '24/7', label: 'self-serve' },
              ]}
            />
            <div className="mt-6">
              <PremiumDevicePreview
                title="Recovery Console"
                subtitle="Secure account handoff"
                accent="blue"
                items={[
                  { label: 'Identity check', value: 'Verified', progress: '96%' },
                  { label: 'OTP delivery', value: 'Live inbox', progress: '82%' },
                  { label: 'Session restore', value: 'Pending', progress: '64%' },
                ]}
              />
            </div>
          </div>

          <div className="p-8 md:p-10">
            <div className="mb-8">
              <div className="flex flex-wrap gap-2 mb-5">
                {trustSignals.map((item) => <SignalPill key={item}>{item}</SignalPill>)}
              </div>
              <h1 className="text-4xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-blue-400 mb-4 inline-block">
                Locaa AI
              </h1>
              <h2 className="text-2xl font-bold text-white mb-2">Password Recovery</h2>
              <p className="text-dark-400 text-sm leading-relaxed max-w-lg">
                {step === 1 ? 'Enter your email and we will send a reset code.' : 'Enter the 6-digit code and your new password.'}
              </p>
            </div>

            <AnimatePresence>
              {message && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, height: 0 }}
                  animate={{ opacity: 1, scale: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2"
                >
                  <span>✉️</span> {message}
                </motion.div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, height: 0 }}
                  animate={{ opacity: 1, scale: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2"
                >
                  <span>⚠️</span> {error}
                </motion.div>
              )}
            </AnimatePresence>

            {step === 1 ? (
              <form onSubmit={handleRequestOtp} className="space-y-6 rounded-2xl border border-white/5 bg-dark-800/20 p-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-dark-50 ml-1">Email Address</label>
              <div className="relative">
                <FaEnvelope className="absolute top-1/2 left-4 -translate-y-1/2 text-dark-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={loading}
                  className="input-premium pl-11"
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary w-full flex justify-center items-center gap-2"
              disabled={loading || !email}
            >
              {loading ? <><FaSpinner className="animate-spin" /> Sending...</> : 'Send Reset Code'}
            </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-6 rounded-2xl border border-white/5 bg-dark-800/20 p-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-dark-50 ml-1">6-Digit Reset Code</label>
              <div className="relative">
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  maxLength="6"
                  required
                  disabled={loading}
                  className="input-premium font-display tracking-[0.5em] text-center text-xl py-3"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-dark-50 ml-1">New Password</label>
              <div className="relative">
                <FaLock className="absolute top-1/2 left-4 -translate-y-1/2 text-dark-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  className="input-premium pl-11 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 right-4 -translate-y-1/2 text-dark-400 hover:text-white transition-colors"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary w-full flex justify-center items-center gap-2"
              disabled={loading || !otp || !newPassword}
            >
              {loading ? <><FaSpinner className="animate-spin" /> Verifying...</> : 'Set New Password'}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => { setStep(1); setOtp(''); setNewPassword(''); setMessage(''); setError(''); }}
                className="text-sm text-dark-400 hover:text-white transition-colors"
              >
                Didn&apos;t receive the code? Try again
              </button>
            </div>
              </form>
            )}

            <div className="mt-8 text-center">
              <Link to="/login" className="inline-flex items-center gap-2 text-dark-400 hover:text-white transition-colors text-sm font-medium">
                <FaArrowLeft /> Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default ForgotPassword
