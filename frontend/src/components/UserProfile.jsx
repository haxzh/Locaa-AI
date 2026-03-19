import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FaUser, FaEnvelope, FaCog, FaChartLine, FaArrowLeft, FaCrown, FaCreditCard, FaSpinner, FaKey, FaShieldAlt, FaBell, FaPalette, FaUserEdit, FaSave, FaTimes, FaLock, FaVideo, FaShareAlt, FaEye, FaEyeSlash, FaCopy, FaSync, FaCheckCircle, FaExclamationTriangle, FaCode, FaTerminal } from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'
import { PremiumDevicePreview, SignalPill } from './PremiumVisuals'
import '../index.css'

const UserProfile = () => {
    const { user, token, updateProfile } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const [editMode, setEditMode] = useState(false)
    const [activeTab, setActiveTab] = useState('overview') // overview, settings, security
    const [editFormData, setEditFormData] = useState({
        name: user?.name || '',
        username: user?.username || '',
        email: user?.email || ''
    })
    const [saveLoading, setSaveLoading] = useState(false)
    const [saveMessage, setSaveMessage] = useState(null)

    // API key management state
    const [apiKey, setApiKey] = useState(null)
    const [apiKeyVisible, setApiKeyVisible] = useState(false)
    const [apiKeyLoading, setApiKeyLoading] = useState(false)
    const [apiKeyHasAccess, setApiKeyHasAccess] = useState(false)
    const [apiKeyMessage, setApiKeyMessage] = useState(null)
    const [copySuccess, setCopySuccess] = useState(false)
    const [regenerateConfirm, setRegenerateConfirm] = useState(false)
    const [regenerateLoading, setRegenerateLoading] = useState(false)
    const [apiUsage, setApiUsage] = useState(null)

    useEffect(() => {
        setEditFormData({
            name: user?.name || '',
            username: user?.username || '',
            email: user?.email || ''
        })
    }, [user])

    useEffect(() => {
        const params = new URLSearchParams(location.search)
        const tab = params.get('tab')
        if (tab === 'security') {
            setActiveTab('security')
        }
    }, [location.search])

    const handleEditChange = (e) => {
        const { name, value } = e.target
        setEditFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSaveProfile = async () => {
        setSaveLoading(true)
        setSaveMessage(null)

        try {
            const result = await updateProfile({
                full_name: editFormData.name,
                username: editFormData.username,
                email: editFormData.email
            })

            if (result.success) {
                setSaveMessage({ type: 'success', text: 'Profile updated successfully!' })
                setEditMode(false)
            } else {
                setSaveMessage({ type: 'error', text: result.error || 'Failed to update profile' })
            }
        } catch (error) {
            setSaveMessage({ type: 'error', text: 'Network error. Please try again.' })
        } finally {
            setSaveLoading(false)
            setTimeout(() => setSaveMessage(null), 3000)
        }
    }

    const handleCancelEdit = () => {
        setEditFormData({
            name: user?.name || '',
            username: user?.username || '',
            email: user?.email || ''
        })
        setEditMode(false)
        setSaveMessage(null)
    }

    useEffect(() => {
        const fetchStats = async () => {
            if (!token) {
                setLoading(false);
                return;
            }
            try {
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/subscription`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                const data = await response.json()

                if (response.ok) {
                    setStats({
                        videosProcessed: data.usage.videos_processed || 0,
                        clipsGenerated: data.usage.clips_generated || 0,
                        uploadsPublished: data.usage.uploads_published || 0,
                        apiRequests: 0,
                        planName: data.plan_details?.name || 'Free Plan',
                        renewalDate: data.subscription_end_date ? new Date(data.subscription_end_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Never expires'
                    })
                }
            } catch (error) {
                console.error('Error fetching stats:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [token])

    // Fetch API key and usage stats
    const fetchApiKey = useCallback(async () => {
        if (!token) return
        setApiKeyLoading(true)
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/api-key`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await res.json()
            if (res.ok) {
                setApiKey(data.api_key)
                setApiKeyHasAccess(data.has_access)
                if (!data.has_access) setApiKeyMessage(data.message)
            }
        } catch (e) {
            console.error('API key fetch error', e)
        } finally {
            setApiKeyLoading(false)
        }
    }, [token])

    const fetchApiUsage = useCallback(async () => {
        if (!token) return
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/api-usage`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setApiUsage(data)
            }
        } catch (e) {
            console.error('API usage fetch error', e)
        }
    }, [token])

    useEffect(() => {
        fetchApiKey()
        fetchApiUsage()
    }, [fetchApiKey, fetchApiUsage])

    const handleCopyKey = async () => {
        if (!apiKey) return
        try {
            await navigator.clipboard.writeText(apiKey)
            setCopySuccess(true)
            setTimeout(() => setCopySuccess(false), 2500)
        } catch (e) {
            // fallback: select text via execCommand (older browsers)
        }
    }

    const handleRegenerateKey = async () => {
        if (!regenerateConfirm) { setRegenerateConfirm(true); return }
        setRegenerateLoading(true)
        setRegenerateConfirm(false)
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/api-key/regenerate`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await res.json()
            if (res.ok) {
                setApiKey(data.api_key)
                setApiKeyVisible(true)
            }
        } catch (e) {
            console.error('Regenerate error', e)
        } finally {
            setRegenerateLoading(false)
        }
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    }

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
    }
    const profileSignals = ['Founder-ready workspace', 'Usage transparency', 'Secure account controls']

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-dark-900">
            <FaSpinner className="animate-spin text-5xl text-primary-500" />
        </div>
    )

    return (
        <div className="min-h-screen p-8 bg-dark-900 text-dark-50 font-sans relative overflow-hidden">
            {/* Ambient Background Elements */}
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary-500/10 rounded-full mix-blend-screen filter blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full mix-blend-screen filter blur-[120px] pointer-events-none" />

            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="max-w-5xl mx-auto relative z-10"
            >
                <motion.div variants={itemVariants} className="mb-8">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 text-dark-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
                    >
                        <FaArrowLeft /> Back to Dashboard
                    </button>
                </motion.div>

                <motion.div variants={itemVariants} className="mb-10 grid grid-cols-1 xl:grid-cols-[1.05fr_0.95fr] gap-6 items-center">
                    <div className="rounded-[2rem] border border-white/10 bg-dark-800/25 p-8 backdrop-blur-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-52 h-52 bg-primary-500/10 rounded-full blur-[80px]" />
                        <div className="relative z-10">
                            <div className="flex flex-wrap gap-2 mb-5">
                                {profileSignals.map((item, index) => <SignalPill key={item} tone={index === 0 ? 'primary' : index === 1 ? 'blue' : 'default'}>{item}</SignalPill>)}
                            </div>
                            <h1 className="text-4xl font-display font-bold text-white mb-2">Your Profile</h1>
                            <p className="text-dark-400 text-lg max-w-2xl leading-relaxed">Manage your account settings, subscription, and the metrics that prove your content system is compounding.</p>
                        </div>
                    </div>
                    <PremiumDevicePreview
                        title="Profile Intelligence"
                        subtitle="Usage and subscription visibility"
                        accent="primary"
                        items={[
                            { label: 'Videos processed', value: `${stats?.videosProcessed || 0}`, progress: '72%' },
                            { label: 'Clips generated', value: `${stats?.clipsGenerated || 0}`, progress: '84%' },
                            { label: 'Plan status', value: stats?.planName || 'Free', progress: '68%' },
                        ]}
                    />
                </motion.div>

                {/* Profile Overview Card (Glassmorphism + Gradient Mesh) */}
                <motion.div variants={itemVariants} className="relative mb-8 rounded-3xl overflow-hidden p-[1px] bg-gradient-to-br from-white/20 via-white/5 to-transparent shadow-2xl">
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-primary-500/30 to-blue-500/10 rounded-full filter blur-[80px] -z-10 translate-x-1/2 -translate-y-1/2" />
                    <div className="bg-dark-900/80 backdrop-blur-2xl rounded-3xl p-8 md:p-10 flex flex-col md:flex-row items-center gap-10">
                        <div className="relative group flex-shrink-0">
                            <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-blue-500 rounded-full blur opacity-40 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
                            <div className="relative w-32 h-32 rounded-full bg-dark-800 flex items-center justify-center text-5xl font-bold text-white border-2 border-white/10 shadow-inner">
                                {user?.name?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                        </div>
                        <div className="flex-1 w-full text-center md:text-left">
                            {!editMode ? (
                                <>
                                    <h2 className="text-4xl font-display font-bold text-white mb-1 tracking-tight">{user?.name || user?.username || 'Locaa Creator'}</h2>
                                    <p className="text-primary-400 font-medium text-lg mb-3">@{user?.username || 'creator'}</p>
                                    <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-4 text-dark-300">
                                        <div className="flex items-center gap-2 bg-dark-800/50 px-4 py-2 rounded-xl border border-white/5">
                                            <FaEnvelope className="text-dark-400" /> {user?.email || 'creator@locaa.ai'}
                                        </div>
                                        <div className="flex items-center gap-2 bg-gradient-to-r from-primary-500/10 to-blue-500/10 px-4 py-2 rounded-xl border border-primary-500/20 text-primary-300 font-bold">
                                            <FaCrown className="text-primary-400" /> {stats?.planName || 'Free Plan'}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-4 w-full md:max-w-md">
                                    <div>
                                        <label className="text-sm font-medium text-dark-300 mb-1 block">Full Name</label>
                                        <input type="text" name="name" value={editFormData.name} onChange={handleEditChange} className="input-premium w-full bg-dark-800/80 focus:bg-dark-800" placeholder="Your name" />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-dark-300 mb-1 block">Username</label>
                                        <input type="text" name="username" value={editFormData.username} onChange={handleEditChange} className="input-premium w-full bg-dark-800/80 focus:bg-dark-800" placeholder="username" />
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3">
                            {!editMode ? (
                                <button onClick={() => setEditMode(true)} className="btn-secondary whitespace-nowrap px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-white/10 transition-colors">
                                    <FaUserEdit /> Edit Profile
                                </button>
                            ) : (
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button onClick={handleSaveProfile} disabled={saveLoading} className="btn-primary whitespace-nowrap px-6 py-3 rounded-xl flex items-center gap-2 justify-center shadow-primary">
                                        {saveLoading ? <FaSpinner className="animate-spin" /> : <FaSave />} {saveLoading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    <button onClick={handleCancelEdit} disabled={saveLoading} className="btn-secondary whitespace-nowrap px-6 py-3 rounded-xl flex items-center gap-2 justify-center hover:bg-white/5">
                                        <FaTimes /> Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Success/Error Message */}
                <AnimatePresence>
                    {saveMessage && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: 'auto' }}
                            exit={{ opacity: 0, y: -10, height: 0 }}
                            className={`mb-6 p-4 rounded-xl border shadow-lg ${saveMessage.type === 'success'
                                    ? 'bg-green-500/10 border-green-500/30 text-green-400'
                                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                                }`}
                        >
                            <span className="flex items-center gap-2 font-medium">
                                {saveMessage.type === 'success' ? '✨' : '⚠️'} {saveMessage.text}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Tabs Navigation */}
                <motion.div variants={itemVariants} className="mb-8">
                    <div className="flex gap-2 bg-dark-800/40 p-1.5 rounded-2xl border border-white/5 backdrop-blur-md">
                        <button onClick={() => setActiveTab('overview')} className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'overview' ? 'bg-gradient-to-r from-dark-700 to-dark-600 text-white shadow-lg border border-white/10' : 'text-dark-400 hover:text-white hover:bg-dark-700/30'}`}>
                            <FaChartLine /> Overview & Usage
                        </button>
                        <button onClick={() => setActiveTab('security')} className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'security' ? 'bg-gradient-to-r from-dark-700 to-dark-600 text-white shadow-lg border border-white/10' : 'text-dark-400 hover:text-white hover:bg-dark-700/30'}`}>
                            <FaShieldAlt /> Security Settings
                        </button>
                    </div>
                </motion.div>

                {/* Tab Content */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Subscription & Billing */}
                        <motion.div variants={itemVariants} className="glass-panel p-8 flex flex-col h-full bg-dark-800/40 border border-white/5 md:col-span-1 shadow-2xl relative overflow-hidden group hover:border-white/10 transition-colors">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-blue-500"></div>
                            <h3 className="text-xl font-display font-bold text-white mb-6 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500/20 to-blue-500/20 flex items-center justify-center text-primary-400 shadow-inner">
                                    <FaCreditCard />
                                </div>
                                Active Plan
                            </h3>

                            <div className="flex flex-col gap-5 flex-1 z-10">
                                <div className="bg-dark-900/60 p-5 rounded-2xl border border-white/5 group-hover:bg-dark-900/80 transition-colors relative overflow-hidden">
                                    <div className="text-sm text-dark-400 mb-1 font-medium">Current Tier</div>
                                    <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-dark-100">{stats?.planName}</div>
                                </div>

                                <div className="bg-dark-900/60 p-5 rounded-2xl border border-white/5 group-hover:bg-dark-900/80 transition-colors">
                                    <div className="text-sm text-dark-400 mb-1 font-medium">Renewal Date</div>
                                    <div className="text-lg text-white font-medium">{stats?.renewalDate}</div>
                                    <div className="text-xs text-dark-500 mt-1">Billed dynamically</div>
                                </div>

                                <div className="mt-auto pt-6 border-t border-white/5">
                                    <Link to="/pricing" className="btn-primary w-full text-center block py-3.5 rounded-xl font-semibold shadow-xl shadow-primary-500/20">
                                        Upgrade Subscription
                                    </Link>
                                </div>
                            </div>
                        </motion.div>

                        {/* Usage Stats (Advanced Layout) */}
                        <motion.div variants={itemVariants} className="glass-panel p-8 bg-dark-800/40 border border-white/5 md:col-span-2 shadow-2xl relative overflow-hidden">
                            <h3 className="text-xl font-display font-bold text-white mb-6 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center text-green-400 shadow-inner">
                                    <FaChartLine />
                                </div>
                                Processing Metrics
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 z-10 relative">
                                <div className="bg-gradient-to-br from-dark-900/80 to-dark-800/60 p-6 rounded-2xl border border-white/5 hover:border-white/10 hover:-translate-y-1 transition-all duration-300">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-dark-700/50 rounded-lg text-dark-300"><FaVideo /></div>
                                        <div className="text-sm text-dark-300 font-medium tracking-wide placeholder-text">Videos Processed</div>
                                    </div>
                                    <div className="text-5xl font-display font-bold text-white tracking-tight">{stats?.videosProcessed || 0}</div>
                                    <div className="text-xs text-dark-500 mt-2 font-medium">Original imports</div>
                                </div>

                                <div className="bg-gradient-to-br from-primary-900/20 to-dark-800/60 p-6 rounded-2xl border border-primary-500/10 hover:border-primary-500/30 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                                    <div className="absolute right-0 top-0 w-32 h-32 bg-primary-500/10 rounded-full filter blur-[40px] translate-x-1/2 -translate-y-1/2" />
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-primary-500/20 rounded-lg text-primary-400"><FaChartLine /></div>
                                        <div className="text-sm text-primary-200/80 font-medium tracking-wide">Clips Generated</div>
                                    </div>
                                    <div className="text-5xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-blue-400 tracking-tight">{stats?.clipsGenerated || 0}</div>
                                    <div className="text-xs text-primary-500/60 mt-2 font-medium">AI-extracted moments</div>
                                </div>

                                <div className="bg-gradient-to-br from-green-900/20 to-dark-800/60 p-6 rounded-2xl border border-green-500/10 hover:border-green-500/30 hover:-translate-y-1 transition-all duration-300">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-green-500/20 rounded-lg text-green-400"><FaShareAlt /></div>
                                        <div className="text-sm text-green-200/80 font-medium tracking-wide">Total Auto-Published</div>
                                    </div>
                                    <div className="text-5xl font-display font-bold text-green-400 tracking-tight">{stats?.uploadsPublished || 0}</div>
                                    <div className="text-xs text-green-500/60 mt-2 font-medium">To YouTube & Instagram</div>
                                </div>

                                <div className="bg-gradient-to-br from-purple-900/20 to-dark-800/60 p-6 rounded-2xl border border-purple-500/10 hover:border-purple-500/30 hover:-translate-y-1 transition-all duration-300">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400"><FaCog /></div>
                                        <div className="text-sm text-purple-200/80 font-medium tracking-wide">API Workloads</div>
                                    </div>
                                    <div className="text-5xl font-display font-bold text-purple-400 tracking-tight">{stats?.apiRequests || 0}</div>
                                    <div className="text-xs text-purple-500/60 mt-2 font-medium">Requests this cycle</div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {activeTab === 'security' && (
                    <motion.div variants={itemVariants} className="glass-panel p-10 bg-dark-800/40 border border-white/5 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-green-500/5 to-transparent rounded-full filter blur-[100px] -z-10" />
                        <h3 className="text-3xl font-display font-bold text-white mb-8 flex items-center gap-3">
                            <FaShieldAlt className="text-green-400" />
                            Account Security
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Change Password */}
                            <div className="bg-dark-900/60 p-8 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                                <h4 className="font-semibold text-white mb-6 flex items-center gap-2 text-lg">
                                    <FaLock className="text-primary-400" />
                                    Update Password
                                </h4>
                                <div className="space-y-5">
                                    <div>
                                        <label className="text-sm text-dark-400 mb-1.5 block font-medium">Current Password</label>
                                        <input type="password" className="input-premium w-full bg-dark-800/50" placeholder="••••••••" />
                                    </div>
                                    <div>
                                        <label className="text-sm text-dark-400 mb-1.5 block font-medium">New Password</label>
                                        <input type="password" className="input-premium w-full bg-dark-800/50" placeholder="••••••••" />
                                    </div>
                                    <div>
                                        <label className="text-sm text-dark-400 mb-1.5 block font-medium">Confirm New Password</label>
                                        <input type="password" className="input-premium w-full bg-dark-800/50" placeholder="••••••••" />
                                    </div>
                                    <button className="btn-primary w-full shadow-primary-500/20 shadow-lg py-3 mt-2 rounded-xl">Save New Password</button>
                                </div>
                            </div>

                            <div className="space-y-8">
                                {/* Developer API Key — full interactive */}
                                <div className="bg-dark-900/60 p-8 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                                    <div className="flex items-center justify-between mb-5">
                                        <div className="flex items-center gap-3">
                                            <FaKey className="text-yellow-400 text-xl" />
                                            <div>
                                                <h4 className="font-bold text-white text-lg">Developer API Key</h4>
                                                <p className="text-xs text-dark-400 mt-0.5">Authenticate programmatic requests via <code className="text-amber-300/70">X-API-Key</code> header</p>
                                            </div>
                                        </div>
                                        {apiKeyHasAccess && (
                                            <span className="px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest bg-green-500/10 text-green-400 border border-green-500/20">
                                                Active
                                            </span>
                                        )}
                                    </div>

                                    {apiKeyLoading ? (
                                        <div className="flex items-center gap-3 py-4 text-dark-400">
                                            <FaSpinner className="animate-spin" /> Loading key...
                                        </div>
                                    ) : !apiKeyHasAccess ? (
                                        <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-5 flex items-start gap-4">
                                            <FaExclamationTriangle className="text-amber-400 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="text-amber-300 font-semibold text-sm">Pro or Business plan required</p>
                                                <p className="text-dark-400 text-xs mt-1">{apiKeyMessage || 'Upgrade to unlock API access and build on top of Locaa.'}</p>
                                                <a href="/pricing" className="inline-block mt-3 px-4 py-1.5 rounded-lg btn-primary text-xs font-semibold">Upgrade Plan</a>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Key display row */}
                                            <div className="bg-dark-800/80 p-1 pl-4 rounded-xl flex items-center gap-2 border border-dark-600 mb-3">
                                                <code className="text-amber-300/80 text-sm flex-1 tracking-wider overflow-hidden text-ellipsis font-mono">
                                                    {apiKeyVisible ? (apiKey || '—') : '●'.repeat(36)}
                                                </code>
                                                <button
                                                    onClick={() => setApiKeyVisible(v => !v)}
                                                    className="btn-secondary py-2 px-3 rounded-lg text-sm"
                                                    title={apiKeyVisible ? 'Hide' : 'Show'}
                                                >
                                                    {apiKeyVisible ? <FaEyeSlash /> : <FaEye />}
                                                </button>
                                                <button
                                                    onClick={handleCopyKey}
                                                    className={`btn-secondary py-2 px-4 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors ${copySuccess ? 'text-green-400 border-green-500/40' : ''}`}
                                                >
                                                    {copySuccess ? <FaCheckCircle /> : <FaCopy />}
                                                    {copySuccess ? 'Copied!' : 'Copy'}
                                                </button>
                                            </div>

                                            {/* Regenerate row */}
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={handleRegenerateKey}
                                                    disabled={regenerateLoading}
                                                    className={`flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg border transition-all duration-200 ${
                                                        regenerateConfirm
                                                            ? 'bg-red-500/10 border-red-500/40 text-red-400 hover:bg-red-500/20'
                                                            : 'btn-secondary'
                                                    }`}
                                                >
                                                    {regenerateLoading ? <FaSpinner className="animate-spin" /> : <FaSync />}
                                                    {regenerateConfirm ? 'Click again to confirm' : 'Regenerate Key'}
                                                </button>
                                                {regenerateConfirm && (
                                                    <button onClick={() => setRegenerateConfirm(false)} className="text-xs text-dark-400 hover:text-white transition-colors">
                                                        Cancel
                                                    </button>
                                                )}
                                                <span className="text-xs text-dark-500">Old key will stop working immediately.</span>
                                            </div>

                                            {/* Usage quick stats */}
                                            {apiUsage && (
                                                <div className="mt-5 pt-5 border-t border-white/5">
                                                    <p className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                        <FaTerminal className="text-primary-400" /> API Usage — Last 30 days
                                                    </p>
                                                    <div className="grid grid-cols-3 gap-3">
                                                        <div className="bg-dark-800/60 rounded-xl p-3 border border-white/5 text-center">
                                                            <p className="text-xl font-bold text-white">{apiUsage.total_requests}</p>
                                                            <p className="text-[10px] text-dark-400 mt-0.5">Total Calls</p>
                                                        </div>
                                                        <div className="bg-dark-800/60 rounded-xl p-3 border border-white/5 text-center">
                                                            <p className="text-xl font-bold text-green-400">{apiUsage.successful_requests}</p>
                                                            <p className="text-[10px] text-dark-400 mt-0.5">Successful</p>
                                                        </div>
                                                        <div className="bg-dark-800/60 rounded-xl p-3 border border-white/5 text-center">
                                                            <p className="text-xl font-bold text-amber-400">{apiUsage.avg_response_ms} ms</p>
                                                            <p className="text-[10px] text-dark-400 mt-0.5">Avg Latency</p>
                                                        </div>
                                                    </div>
                                                    {apiUsage.top_endpoints?.length > 0 && (
                                                        <div className="mt-3 space-y-1.5">
                                                            {apiUsage.top_endpoints.map(ep => (
                                                                <div key={ep.endpoint} className="flex items-center gap-2 text-xs text-dark-400">
                                                                    <FaCode className="text-primary-500/70 flex-shrink-0" />
                                                                    <span className="font-mono text-white/60 flex-1 truncate">{ep.endpoint}</span>
                                                                    <span className="text-primary-400 font-bold">{ep.count}×</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Quick usage example */}
                                            <div className="mt-4 p-4 bg-dark-950/60 rounded-xl border border-white/5 font-mono text-xs overflow-x-auto">
                                                <p className="text-dark-400 mb-1"># Example: use API key in curl</p>
                                                <p className="text-amber-300/80">curl -H <span className="text-green-300">&quot;X-API-Key: {apiKeyVisible && apiKey ? apiKey : '<your-key>'}&quot;</span> \</p>
                                                <p className="text-white/60 pl-4">{import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/jobs</p>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Active Sessions */}
                                <div className="bg-dark-900/60 p-8 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                                    <h4 className="font-bold text-white mb-5 text-lg">Active Sessions</h4>
                                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-dark-800 to-dark-800/50 rounded-xl border border-white/5">
                                        <div>
                                            <p className="text-white font-medium flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                                Current Device
                                            </p>
                                            <p className="text-xs text-dark-400 mt-1">Windows • Chrome • IP Address logged</p>
                                        </div>
                                        <span className="px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest bg-green-500/10 text-green-400 border border-green-500/20">
                                            Active
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Danger Zone */}
                        <div className="mt-8 bg-red-900/5 p-8 rounded-2xl border border-red-500/20 backdrop-blur-sm relative overflow-hidden group hover:bg-red-900/10 transition-all duration-300">
                            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-red-500/5 rounded-full filter blur-[60px] -z-10 group-hover:bg-red-500/10 transition-all duration-500" />
                            <h4 className="font-bold text-red-500 mb-2 text-xl tracking-tight">Danger Zone</h4>
                            <p className="text-sm text-red-400/70 mb-6 font-medium max-w-lg">Once you delete your account, there is no going back. All customized branding, processed videos, and usage metrics will be permanently scrubbed.</p>
                            <button className="btn-secondary bg-red-500/5 border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white px-6 py-2.5 transition-all duration-300 font-semibold shadow-lg shadow-red-500/10 hover:shadow-red-500/20">
                                Delete Account
                            </button>
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </div>
    )
}

export default UserProfile
