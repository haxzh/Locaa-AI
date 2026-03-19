import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FaUser, FaEnvelope, FaLock, FaSpinner, FaGoogle, FaEye, FaEyeSlash } from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google'
import '../index.css'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"

const Register = () => {
    const navigate = useNavigate()
    const { register, registerOtp, loginGoogle } = useAuth()
    const hasGoogleClientId = GOOGLE_CLIENT_ID && !GOOGLE_CLIENT_ID.includes('YOUR_GOOGLE_CLIENT_ID')
    const onboardingHighlights = [
        { icon: '🚀', title: 'Launch Faster', desc: 'Create and publish more short-form content with less effort', color: 'text-primary-400', bg: 'bg-primary-500/10 border-primary-500/10' },
        { icon: '💎', title: 'Premium Output', desc: 'Studio-style subtitles, dubbing and branded templates', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/10' },
        { icon: '📈', title: 'Startup Growth', desc: 'Built for creators, agencies and founder-led marketing teams', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/10' },
        { icon: '⚙️', title: 'Everything in One Stack', desc: 'Clip, dub, translate, brand and publish from one dashboard', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/10' },
    ]
    const signupTrust = ['Free plan available', 'No card required', 'Publish-ready in minutes']

    // UI State
    const [signupMethod, setSignupMethod] = useState('password'); // 'password' or 'otp'
    const [otpSent, setOtpSent] = useState(false);

    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [localError, setLocalError] = useState(null)
    const [successMessage, setSuccessMessage] = useState(null)

    const [formData, setFormData] = useState({
        name: '', // Display name (first/last)
        username: '', // Unique username
        email: '',
        password: '',
        confirmPassword: '',
        otp: ''
    })

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        setLocalError(null)
    }

    const validateBaseForm = () => {
        if (!formData.name || !formData.email || !formData.username) {
            setLocalError('Name, username, and email are required')
            return false
        }
        return true
    }

    const validatePasswordForm = () => {
        if (!validateBaseForm()) return false;
        if (!formData.password || !formData.confirmPassword) {
            setLocalError('All fields are required')
            return false
        }
        if (formData.password.length < 6) {
            setLocalError('Password must be at least 6 characters')
            return false
        }
        if (formData.password !== formData.confirmPassword) {
            setLocalError('Passwords do not match')
            return false
        }
        return true
    }

    // --- 1. Password Registration ---
    const handleRegister = async (e) => {
        e.preventDefault()
        setLocalError(null)
        setLoading(true)

        if (!validatePasswordForm()) {
            setLoading(false)
            return
        }

        // Split name into first/last roughly
        const nameParts = formData.name.trim().split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

        const result = await register(
            formData.email,
            formData.username,
            formData.password,
            firstName,
            lastName
        )

        if (result.success) {
            navigate('/dashboard')
        } else {
            setLocalError(result.error || 'Registration failed')
        }
        setLoading(false)
    }

    // --- 2. OTP Request ---
    const handleSendOtp = async (e) => {
        e.preventDefault()
        setLocalError(null)
        setLoading(true)

        if (!validateBaseForm()) {
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email, type: 'signup' })
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

    // --- 3. OTP Registration Submission ---
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
            // Validate OTP
            const otpResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email, otp_code: formData.otp })
            });
            const otpData = await otpResponse.json();

            if (!otpResponse.ok) {
                setLocalError(otpData.error || 'Invalid OTP code')
                setLoading(false)
                return
            }

            // Execute OTP Registration
            const nameParts = formData.name.trim().split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

            const regResult = await registerOtp(
                formData.email,
                formData.username,
                firstName,
                lastName
            );

            if (regResult.success) {
                navigate('/dashboard')
            } else {
                setLocalError(regResult.error || 'Failed to register account via OTP.')
            }

        } catch (err) {
            setLocalError('Network error processing registration.')
        } finally {
            setLoading(false)
        }
    }

    // --- 4. Google OAuth Callback ---
    const handleGoogleSuccess = async (credentialResponse) => {
        setLoading(true)
        setLocalError(null)

        try {
            const result = await loginGoogle(credentialResponse.credential)
            if (result.success) {
                // loginGoogle doubles as register in backend
                navigate('/dashboard')
            } else {
                setLocalError(result.error || 'Google Authentication Failed.')
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

    const pageVariants = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
        exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
    };

    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <motion.div
                className="min-h-screen flex items-center justify-center p-4 md:p-6 bg-dark-900 relative overflow-hidden"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
            >
                {/* Ambient Background Elements */}
                <div className="absolute top-0 right-0 w-[680px] h-[680px] bg-primary-500/10 rounded-full filter blur-[140px] animate-blob pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[560px] h-[560px] bg-blue-500/10 rounded-full filter blur-[130px] animate-blob pointer-events-none" style={{ animationDelay: '2s' }} />
                <div className="absolute inset-0 bg-grid-dots opacity-20 pointer-events-none" />

                <div className="glass-panel flex flex-col md:flex-row w-full max-w-5xl overflow-hidden relative z-10">
                    {/* Left Section - Graphic/Brand */}
                    <div className="hidden md:flex md:w-[48%] flex-col justify-between relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0d1424 0%, #0B0F19 60%, #0d1424 100%)' }}>
                        <div className="absolute top-0 left-0 w-64 h-64 bg-primary-500/15 rounded-full filter blur-[60px] pointer-events-none" />
                        <div className="absolute bottom-0 right-0 w-48 h-48 bg-blue-500/15 rounded-full filter blur-[60px] pointer-events-none" />
                        <div className="absolute inset-0 border-r border-white/5 pointer-events-none" />
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="relative z-10 p-10 flex flex-col h-full justify-between"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-8">
                                    <Link to="/" className="flex items-center gap-2.5 group">
                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-primary-500/40 group-hover:shadow-primary-500/60 transition-shadow">L</div>
                                        <span className="text-lg font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-blue-400">Locaa AI</span>
                                    </Link>
                                    <Link to="/" className="text-xs text-dark-500 hover:text-dark-300 transition-colors flex items-center gap-1">
                                        ← Home
                                    </Link>
                                </div>

                                <p className="text-xs font-semibold tracking-widest text-primary-400 uppercase mb-4">Start your creator stack</p>
                                <h1 className="text-4xl font-display font-bold leading-tight mb-3">
                                    Build your <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-400 via-teal-300 to-blue-400">content engine</span>
                                    <br />
                                    before your competitors do
                                </h1>
                                <p className="text-sm text-dark-400 mb-8 leading-relaxed">
                                    Create an account to turn one video into dozens of short-form assets with AI clipping, dubbing, subtitles and fast publishing.
                                </p>

                                <div className="space-y-3">
                                    {onboardingHighlights.map((feat, i) => (
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
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { val: '12K+', label: 'users' },
                                        { val: '50K+', label: 'clips' },
                                        { val: '4.9/5', label: 'rating' },
                                    ].map((stat) => (
                                        <div key={stat.label} className="text-center bg-dark-800/40 border border-white/5 rounded-xl py-2.5">
                                            <p className="text-base font-bold font-display text-white">{stat.val}</p>
                                            <p className="text-xs text-dark-500">{stat.label}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="bg-dark-800/30 border border-white/5 rounded-xl p-4">
                                    <div className="flex gap-0.5 mb-2">
                                        {[...Array(5)].map((_, i) => <span key={i} className="text-yellow-400 text-xs">★</span>)}
                                    </div>
                                    <p className="text-xs text-dark-400 italic leading-relaxed mb-2">&ldquo;It feels like hiring an editor, translator and publisher in one product. Perfect for a startup team.&rdquo;</p>
                                    <p className="text-xs text-dark-600">Founder-led growth team</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Section - Form */}
                    <div className="w-full md:w-[52%] p-6 sm:p-8 md:p-10 bg-dark-900/40 backdrop-blur-xl flex flex-col justify-center">
                        <div className="mb-6">
                            <span className="inline-flex items-center gap-2 rounded-full border border-primary-500/20 bg-primary-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary-300">
                                <span className="h-2 w-2 rounded-full bg-primary-400 animate-pulse" />
                                Free Signup
                            </span>
                        </div>

                        <div className="mb-8 rounded-2xl border border-white/10 bg-dark-900/30 p-6 shadow-xl shadow-black/10">
                            <div className="mb-5 flex flex-wrap gap-2">
                                {signupTrust.map((item) => (
                                    <span key={item} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-dark-300">
                                        {item}
                                    </span>
                                ))}
                            </div>
                            <h2 className="text-3xl font-display font-bold text-white mb-2">Create your account</h2>
                            <p className="text-dark-400 leading-relaxed">Get your startup content workflow live with AI clips, subtitles, dubbing and multi-platform publishing.</p>
                        </div>

                        {/* Sign-Up Method Toggle */}
                        <div className="flex bg-dark-800/80 p-1 rounded-xl mb-6 border border-white/5">
                            <button
                                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${signupMethod === 'password' ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'text-dark-400 hover:text-white'}`}
                                onClick={() => { setSignupMethod('password'); setLocalError(null); setSuccessMessage(null); }}
                            >
                                Use Password
                            </button>
                            <button
                                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${signupMethod === 'otp' ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'text-dark-400 hover:text-white'}`}
                                onClick={() => { setSignupMethod('otp'); setLocalError(null); setSuccessMessage(null); }}
                            >
                                Sign Up with OTP
                            </button>
                        </div>

                        {/* Alerts */}
                        <AnimatePresence>
                            {(localError) && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-6 flex items-center gap-2 text-sm"
                                >
                                    <span>⚠️</span> {localError}
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

                        {/* ==================== PASSWORD REGISTRATION ==================== */}
                        {signupMethod === 'password' && (
                            <form onSubmit={handleRegister} className="space-y-4 rounded-2xl border border-white/5 bg-dark-800/20 p-5 sm:p-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-dark-50 ml-1">Full Name</label>
                                        <div className="relative">
                                            <FaUser className="absolute top-1/2 left-4 -translate-y-1/2 text-dark-400" />
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                placeholder="John Doe"
                                                disabled={loading}
                                                className="input-premium pl-11"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-dark-50 ml-1">Username</label>
                                        <div className="relative">
                                            <FaUser className="absolute top-1/2 left-4 -translate-y-1/2 text-dark-400" />
                                            <input
                                                type="text"
                                                name="username"
                                                value={formData.username}
                                                onChange={handleChange}
                                                placeholder="johndoe99"
                                                disabled={loading}
                                                className="input-premium pl-11"
                                            />
                                        </div>
                                    </div>
                                </div>

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

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-dark-50 ml-1">Confirm</label>
                                        <div className="relative">
                                            <FaLock className="absolute top-1/2 left-4 -translate-y-1/2 text-dark-400" />
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                name="confirmPassword"
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                                placeholder="••••••••"
                                                disabled={loading}
                                                className="input-premium pl-11 pr-11"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-1">
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="flex items-center gap-1.5 text-sm text-dark-400 hover:text-white transition-colors"
                                    >
                                        {showPassword ? <><FaEyeSlash /> Hide Passwords</> : <><FaEye /> Show Passwords</>}
                                    </button>
                                </div>

                                <button
                                    type="submit"
                                    className="btn-primary w-full flex justify-center items-center gap-2 mt-2 shadow-primary"
                                    disabled={loading}
                                >
                                    {loading ? <><FaSpinner className="animate-spin" /> Creating Account...</> : 'Create Account'}
                                </button>

                                <p className="text-center text-xs leading-relaxed text-dark-500">
                                    By continuing, you agree to use Locaa AI to create branded content workflows for your startup, team or creator business.
                                </p>
                            </form>
                        )}

                        {/* ==================== OTP REGISTRATION ==================== */}
                        {signupMethod === 'otp' && (
                            <div className="space-y-4 rounded-2xl border border-white/5 bg-dark-800/20 p-5 sm:p-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-dark-50 ml-1">Full Name</label>
                                        <div className="relative">
                                            <FaUser className="absolute top-1/2 left-4 -translate-y-1/2 text-dark-400" />
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                placeholder="John Doe"
                                                disabled={loading || otpSent}
                                                className="input-premium pl-11"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-dark-50 ml-1">Username</label>
                                        <div className="relative">
                                            <FaUser className="absolute top-1/2 left-4 -translate-y-1/2 text-dark-400" />
                                            <input
                                                type="text"
                                                name="username"
                                                value={formData.username}
                                                onChange={handleChange}
                                                placeholder="johndoe99"
                                                disabled={loading || otpSent}
                                                className="input-premium pl-11"
                                            />
                                        </div>
                                    </div>
                                </div>

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
                                        disabled={loading || !formData.email || !formData.username}
                                    >
                                        {loading ? <><FaSpinner className="animate-spin" /> Sending Code...</> : 'Get Verification Code'}
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
                                            {loading ? <><FaSpinner className="animate-spin" /> Creating Account...</> : 'Verify & Setup Account'}
                                        </button>

                                        <p className="text-center text-sm text-dark-400 mt-4">
                                            Didn&apos;t receive it? <button type="button" onClick={handleSendOtp} className="text-primary-400 font-semibold hover:text-primary-300">Resend Code</button>
                                            <br />
                                            <button type="button" onClick={() => setOtpSent(false)} className="text-sm mt-3 hover:text-white">Edit Details</button>
                                        </p>
                                    </form>
                                )}
                            </div>
                        )}

                        <div className="my-8 flex items-center">
                            <div className="flex-1 h-px bg-white/10"></div>
                            <span className="px-4 text-sm text-dark-400 font-medium">OR</span>
                            <div className="flex-1 h-px bg-white/10"></div>
                        </div>

                        {/* Google OAuth Component */}
                        <div className="flex justify-center w-full">
                            <div className="w-full relative shadow-lg rounded-xl overflow-hidden hover:opacity-90 transition-opacity">
                                {hasGoogleClientId ? (
                                    <GoogleLogin
                                        onSuccess={handleGoogleSuccess}
                                        onError={handleGoogleFailure}
                                        theme="filled_black"
                                        size="large"
                                        width="100%"
                                        text="signup_with"
                                        shape="rectangular"
                                    />
                                ) : (
                                    <button
                                        type="button"
                                        disabled
                                        className="w-full py-3 rounded-xl border border-white/10 text-dark-400 bg-dark-800/60"
                                    >
                                        Add VITE_GOOGLE_CLIENT_ID to enable Google Signup
                                    </button>
                                )}
                            </div>
                        </div>

                        <p className="text-center mt-8 text-dark-400 text-sm">
                            Already have an account?{' '}
                            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-semibold transition-colors">
                                Sign in
                            </Link>
                        </p>

                        <p className="mt-4 text-center text-xs text-dark-600">
                            Built for founder-led growth, agency workflows and modern creator teams.
                        </p>
                    </div>
                </div>
            </motion.div>
        </GoogleOAuthProvider>
    )
}

export default Register
