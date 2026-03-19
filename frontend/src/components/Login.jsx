import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FaEnvelope, FaLock, FaSpinner, FaGoogle, FaEye, FaEyeSlash } from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google'
import '../index.css'

// IMPORTANT: Replace this with your actual Google Client ID from Google Cloud Console
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"

const Login = () => {
    const navigate = useNavigate()
    const { login, loginOtp, loginGoogle, error } = useAuth()
    const hasGoogleClientId = GOOGLE_CLIENT_ID && !GOOGLE_CLIENT_ID.includes('YOUR_GOOGLE_CLIENT_ID')
    const productHighlights = [
        { icon: '🎯', title: 'Smart AI Clipping', desc: 'Finds the most viral moments from long-form video', color: 'text-primary-400', bg: 'bg-primary-500/10 border-primary-500/10' },
        { icon: '🌍', title: '50+ Language Reach', desc: 'Translate, dub and subtitle content for global growth', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/10' },
        { icon: '📱', title: 'Publish Everywhere', desc: 'Ship to YouTube, Instagram, TikTok and Facebook fast', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/10' },
        { icon: '⚡', title: 'Creator Speed', desc: 'Replace hours of editing with one streamlined workflow', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/10' },
    ]
    const trustPills = ['12k+ creators', '98% satisfaction', '4-click workflow']

    // UI State Toggles
    const [loginMethod, setLoginMethod] = useState('password'); // 'password' or 'otp'
    const [otpSent, setOtpSent] = useState(false);

    const [showPassword, setShowPassword] = useState(false)
    const [rememberMe, setRememberMe] = useState(false)
    const [loading, setLoading] = useState(false)
    const [localError, setLocalError] = useState(null)
    const [successMessage, setSuccessMessage] = useState(null)

    const [formData, setFormData] = useState({
        email: localStorage.getItem('rememberedEmail') || '',
        password: '',
        otp: ''
    })

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        setLocalError(null)
    }

    // Standard Password Login
    const handleLogin = async (e) => {
        e.preventDefault()
        setLocalError(null)
        setLoading(true)

        if (!formData.email || !formData.password) {
            setLocalError('Please enter email and password')
            setLoading(false)
            return
        }

        const result = await login(formData.email, formData.password)

        if (result.success) {
            handleRememberMe()
            navigate('/dashboard')
        } else {
            setLocalError(result.error || 'Login failed')
        }
        setLoading(false)
    }

    // Request OTP via email for login
    const handleSendOtp = async (e) => {
        e.preventDefault()
        setLocalError(null)
        setLoading(true)

        if (!formData.email) {
            setLocalError('Please enter your email to receive an OTP')
            setLoading(false)
            return
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email, type: 'login' })
            })

            const data = await response.json()

            if (response.ok) {
                setOtpSent(true)
                setSuccessMessage("OTP sent to your email! (Valid for 10 minutes)")
            } else {
                setLocalError(data.error || 'Failed to send OTP')
            }
        } catch (err) {
            setLocalError('Network error connecting to server.')
        } finally {
            setLoading(false)
        }
    }

    // Verify OTP and Authenticate
    const handleVerifyOtp = async (e) => {
        e.preventDefault()
        setLocalError(null)
        setLoading(true)

        if (!formData.otp || formData.otp.length !== 6) {
            setLocalError('Please enter the 6-digit OTP')
            setLoading(false)
            return
        }

        try {
            // Step 1: Verify OTP
            const otpResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email, otp_code: formData.otp })
            })

            const otpData = await otpResponse.json()

            if (!otpResponse.ok) {
                setLocalError(otpData.error || 'Invalid OTP code')
                setLoading(false)
                return
            }

            // Step 2: Actually login using custom AuthContext
            const loginResult = await loginOtp(formData.email)
            if (loginResult.success) {
                handleRememberMe()
                navigate('/dashboard')
            } else {
                setLocalError(loginResult.error || 'Failed to generate sign-in session.')
            }

        } catch (err) {
            setLocalError('Network error during OTP validation.')
        } finally {
            setLoading(false)
        }
    }

    // Google OAuth Callbacks
    const handleGoogleSuccess = async (credentialResponse) => {
        setLoading(true)
        setLocalError(null)

        try {
            // Assume loginGoogle exists in AuthContext which hands off credential to backend /api/oauth/google
            const result = await loginGoogle(credentialResponse.credential)
            if (result.success) {
                navigate('/dashboard')
            } else {
                setLocalError(result.error || 'Google Login Failed on Server.')
            }
        } catch (err) {
            setLocalError('Failed to process Google login.')
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleFailure = () => {
        setLocalError("Google Sign-In was closed or failed.")
    }

    const handleRememberMe = () => {
        if (rememberMe) {
            localStorage.setItem('rememberedEmail', formData.email)
        } else {
            localStorage.removeItem('rememberedEmail')
        }
    }

    const pageVariants = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
        exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
    };

    return (
            <motion.div
                className="min-h-screen flex items-center justify-center p-4 md:p-6 bg-dark-900 relative overflow-hidden"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
            >
                {/* Ambient Background Blobs */}
                <div className="absolute top-0 left-0 w-[700px] h-[700px] bg-primary-500/10 rounded-full filter blur-[140px] animate-blob pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full filter blur-[120px] animate-blob pointer-events-none" style={{ animationDelay: '3s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-500/8 rounded-full filter blur-[100px] animate-blob pointer-events-none" style={{ animationDelay: '6s' }} />
                {/* Grid dots */}
                <div className="absolute inset-0 bg-grid-dots opacity-20 pointer-events-none" />

                <div className="glass-panel flex flex-col md:flex-row w-full max-w-5xl overflow-hidden relative z-10 shadow-2xl">
                    {/* ── Left Section ── Premium Brand Panel */}
                    <div className="hidden md:flex md:w-[48%] flex-col justify-between relative overflow-hidden"
                        style={{ background: 'linear-gradient(135deg, #0d1424 0%, #0B0F19 60%, #0d1424 100%)' }}>
                        {/* Decorative glow top-left */}
                        <div className="absolute top-0 left-0 w-64 h-64 bg-primary-500/15 rounded-full filter blur-[60px] pointer-events-none" />
                        <div className="absolute bottom-0 right-0 w-48 h-48 bg-blue-500/15 rounded-full filter blur-[60px] pointer-events-none" />
                        <div className="absolute inset-0 border-r border-white/5 pointer-events-none" />

                        <div className="relative z-10 p-10 flex flex-col h-full justify-between">
                            {/* Top: Logo + Back link */}
                            <div className="flex items-center justify-between mb-2">
                                <Link to="/" className="flex items-center gap-2.5 group">
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-primary-500/40 group-hover:shadow-primary-500/60 transition-shadow">L</div>
                                    <span className="text-lg font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-blue-400">Locaa AI</span>
                                </Link>
                                <Link to="/" className="text-xs text-dark-500 hover:text-dark-300 transition-colors flex items-center gap-1">
                                    ← Home
                                </Link>
                            </div>

                            {/* Middle: Headline + features */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2, duration: 0.6 }}
                                className="flex-1 flex flex-col justify-center py-8"
                            >
                                <p className="text-xs font-semibold tracking-widest text-primary-400 uppercase mb-4">AI-Powered Video Platform</p>
                                <h1 className="text-4xl font-display font-bold leading-tight mb-3">
                                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-400 via-teal-300 to-blue-400">Turn Videos</span>
                                    <br />
                                    <span className="text-white">into Viral Shorts</span>
                                </h1>
                                <p className="text-sm text-dark-400 mb-8 leading-relaxed">
                                    AI-powered clipping, dubbing, subtitles, and multi-platform publishing — all in one tool.
                                </p>

                                <div className="space-y-3">
                                    {productHighlights.map((feat, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -12 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.3 + i * 0.08 }}
                                            className={`flex items-center gap-3 p-3 rounded-xl border ${feat.bg} backdrop-blur-sm hover:scale-[1.01] transition-transform cursor-default`}
                                        >
                                            <span className="text-lg flex-shrink-0">{feat.icon}</span>
                                            <div>
                                                <p className={`text-sm font-semibold ${feat.color}`}>{feat.title}</p>
                                                <p className="text-xs text-dark-500">{feat.desc}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>

                            {/* Bottom: Stats + testimonial */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 }}
                                className="space-y-4"
                            >
                                {/* Mini stats */}
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { val: '50K+', label: 'Clips' },
                                        { val: '12K+', label: 'Creators' },
                                        { val: '98%', label: 'Satisfaction' },
                                    ].map((s, i) => (
                                        <div key={i} className="text-center bg-dark-800/40 border border-white/5 rounded-xl py-2.5">
                                            <p className="text-base font-bold font-display text-white">{s.val}</p>
                                            <p className="text-xs text-dark-500">{s.label}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Testimonial */}
                                <div className="bg-dark-800/30 border border-white/5 rounded-xl p-4">
                                    <div className="flex gap-0.5 mb-2">
                                        {[...Array(5)].map((_, i) => <span key={i} className="text-yellow-400 text-xs">★</span>)}
                                    </div>
                                    <p className="text-xs text-dark-400 italic leading-relaxed mb-2">&ldquo;Locaa AI cut my editing time from 6 hours to 15 minutes. I grew from 2K to 80K followers in 3 months!&rdquo;</p>
                                    <p className="text-xs text-dark-600">— Arjun S., YouTube Creator</p>
                                </div>
                            </motion.div>
                        </div>
                    </div>

                    {/* Right Section - Form */}
                    <div className="w-full md:w-[52%] p-6 sm:p-8 md:p-10 bg-dark-900/40 backdrop-blur-xl flex flex-col justify-center">
                        <div className="mb-6">
                            <span className="inline-flex items-center gap-2 rounded-full border border-primary-500/20 bg-primary-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary-300">
                                <span className="h-2 w-2 rounded-full bg-primary-400 animate-pulse" />
                                Creator Login
                            </span>
                        </div>

                        <div className="mb-8 rounded-2xl border border-white/10 bg-dark-900/30 p-6 shadow-xl shadow-black/10">
                            <div className="mb-5 flex flex-wrap gap-2">
                                {trustPills.map((pill) => (
                                    <span key={pill} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-dark-300">
                                        {pill}
                                    </span>
                                ))}
                            </div>

                            <h2 className="text-3xl font-display font-bold text-white mb-2">Welcome back</h2>
                            <p className="text-dark-400 leading-relaxed">Sign in to manage clips, publish faster, and keep your startup content engine running.</p>
                        </div>

                        {/* Login Method Toggle */}
                        <div className="flex bg-dark-800/80 p-1 rounded-xl mb-6 border border-white/5">
                            <button
                                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${loginMethod === 'password' ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'text-dark-400 hover:text-white'}`}
                                onClick={() => { setLoginMethod('password'); setLocalError(null); setSuccessMessage(null); }}
                            >
                                Use Password
                            </button>
                            <button
                                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${loginMethod === 'otp' ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'text-dark-400 hover:text-white'}`}
                                onClick={() => { setLoginMethod('otp'); setLocalError(null); setSuccessMessage(null); }}
                            >
                                Login with OTP
                            </button>
                        </div>

                        {/* Alerts */}
                        <AnimatePresence>
                            {(error || localError) && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-6 flex items-center gap-2 text-sm"
                                >
                                    <span>⚠️</span> {error || localError}
                                </motion.div>
                            )}
                            {successMessage && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl mb-6 flex items-center gap-2 text-sm"
                                >
                                    <span>✉️</span> {successMessage}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* ======================= PASSWORD LOGIN FORM ======================= */}
                        {loginMethod === 'password' && (
                            <form onSubmit={handleLogin} className="space-y-5 rounded-2xl border border-white/5 bg-dark-800/20 p-5 sm:p-6">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-dark-50 ml-1">Email Address</label>
                                    <div className="relative">
                                        <FaEnvelope className="absolute top-1/2 left-4 -translate-y-1/2 text-dark-400" />
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="you@example.com"
                                            disabled={loading}
                                            className="input-premium pl-11"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-dark-50 ml-1">Password</label>
                                    <div className="relative">
                                        <FaLock className="absolute top-1/2 left-4 -translate-y-1/2 text-dark-400" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            placeholder="••••••••"
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

                                <div className="flex items-center justify-between text-sm mt-2 mb-2">
                                    <label className="flex items-center gap-2 cursor-pointer text-dark-400 hover:text-dark-50 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={rememberMe}
                                            onChange={(e) => setRememberMe(e.target.checked)}
                                            className="w-4 h-4 rounded border-dark-600 bg-dark-800 text-primary-500 focus:ring-primary-500/50 focus:ring-offset-dark-900"
                                        />
                                        Remember me
                                    </label>
                                    <Link to="/forgot-password" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
                                        Forgot password?
                                    </Link>
                                </div>

                                <button
                                    type="submit"
                                    className="btn-primary w-full flex justify-center items-center gap-2 mt-4 shadow-primary"
                                    disabled={loading}
                                >
                                    {loading ? <><FaSpinner className="animate-spin" /> Signing in...</> : 'Sign In Securely'}
                                </button>

                                <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                                    <div className="rounded-xl border border-white/5 bg-dark-900/30 py-2">
                                        <p className="text-sm font-semibold text-white">2 min</p>
                                        <p className="text-[11px] text-dark-500">setup time</p>
                                    </div>
                                    <div className="rounded-xl border border-white/5 bg-dark-900/30 py-2">
                                        <p className="text-sm font-semibold text-white">1 click</p>
                                        <p className="text-[11px] text-dark-500">publish flow</p>
                                    </div>
                                    <div className="rounded-xl border border-white/5 bg-dark-900/30 py-2">
                                        <p className="text-sm font-semibold text-white">24/7</p>
                                        <p className="text-[11px] text-dark-500">automation</p>
                                    </div>
                                </div>
                            </form>
                        )}

                        {/* ======================= OTP LOGIN FORM ======================= */}
                        {loginMethod === 'otp' && (
                            <div className="space-y-5 rounded-2xl border border-white/5 bg-dark-800/20 p-5 sm:p-6">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-dark-50 ml-1">Email Address</label>
                                    <div className="relative">
                                        <FaEnvelope className="absolute top-1/2 left-4 -translate-y-1/2 text-dark-400" />
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="you@example.com"
                                            disabled={loading || otpSent}
                                            className="input-premium pl-11"
                                        />
                                    </div>
                                </div>

                                {!otpSent ? (
                                    <button
                                        onClick={handleSendOtp}
                                        className="btn-secondary w-full flex justify-center items-center gap-2 mt-4"
                                        disabled={loading || !formData.email}
                                    >
                                        {loading ? <><FaSpinner className="animate-spin" /> Sending Code...</> : 'Send Login Code'}
                                    </button>
                                ) : (
                                    <form onSubmit={handleVerifyOtp} className="space-y-5">
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="space-y-1.5 mt-4"
                                        >
                                            <label className="text-sm font-medium text-dark-50 ml-1">6-Digit OTP</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    name="otp"
                                                    value={formData.otp}
                                                    onChange={handleChange}
                                                    placeholder="123456"
                                                    maxLength="6"
                                                    disabled={loading}
                                                    className="input-premium font-display tracking-[0.5em] text-center text-xl py-3"
                                                />
                                            </div>
                                        </motion.div>

                                        <button
                                            type="submit"
                                            className="btn-primary w-full flex justify-center items-center gap-2 mt-4 shadow-primary"
                                            disabled={loading || formData.otp.length !== 6}
                                        >
                                            {loading ? <><FaSpinner className="animate-spin" /> Verifying...</> : 'Verify & Login'}
                                        </button>

                                        <p className="text-center text-sm text-dark-400 mt-4">
                                            Didn&apos;t receive it? <button type="button" onClick={handleSendOtp} className="text-primary-400 font-semibold hover:text-primary-300">Resend Code</button>
                                            <br />
                                            <button type="button" onClick={() => setOtpSent(false)} className="text-sm mt-3 hover:text-white">Change Email Address</button>
                                        </p>
                                    </form>
                                )}
                            </div>
                        )}

                        {/* Google Login Separator */}
                        <div className="my-8 flex items-center">
                            <div className="flex-1 h-px bg-white/10"></div>
                            <span className="px-4 text-sm text-dark-400 font-medium">OR</span>
                            <div className="flex-1 h-px bg-white/10"></div>
                        </div>

                        {/* Google OAuth Button Element */}
                        <div className="flex justify-center w-full">
                            <div className="w-full relative shadow-lg rounded-xl overflow-hidden hover:opacity-90 transition-opacity">
                                {hasGoogleClientId ? (
                                    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                                        <GoogleLogin
                                            onSuccess={handleGoogleSuccess}
                                            onError={handleGoogleFailure}
                                            theme="filled_black"
                                            size="large"
                                            width="100%"
                                            text="continue_with"
                                            shape="rectangular"
                                        />
                                    </GoogleOAuthProvider>
                                ) : (
                                    <button
                                        type="button"
                                        disabled
                                        className="w-full py-3 rounded-xl border border-white/10 text-dark-400 bg-dark-800/60"
                                    >
                                        Add VITE_GOOGLE_CLIENT_ID to enable Google Login
                                    </button>
                                )}
                            </div>
                        </div>

                        <p className="text-center mt-8 text-dark-400 text-sm">
                            Don&apos;t have an account?{' '}
                            <Link to="/register" className="text-primary-400 hover:text-primary-300 font-semibold transition-colors">
                                Sign up for free
                            </Link>
                        </p>

                        <p className="mt-4 text-center text-xs text-dark-600">
                            Secure login with encrypted sessions and startup-ready access controls.
                        </p>
                    </div>
                </div>
            </motion.div>
    )
}

export default Login
