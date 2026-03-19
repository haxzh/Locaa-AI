import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
    FaBell,
    FaBan,
    FaCheckCircle,
    FaChartLine,
    FaExclamationTriangle,
    FaFolder,
    FaInfoCircle,
    FaKey,
    FaLink,
    FaQuestionCircle,
    FaSignOutAlt,
    FaVideo,
    FaDownload,
    FaSpinner,
    FaTrash,
    FaMagic,
    FaPlay
} from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { extractYouTubeVideoId, normalizeYouTubeUrl } from '../utils/youtube'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

function DashboardAdvanced() {
    const navigate = useNavigate()
    const { user, logout, token } = useAuth()
    const [jobs, setJobs] = useState([])
    const [selectedJob, setSelectedJob] = useState(null)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState(null)
    const [videoUrl, setVideoUrl] = useState('')
    const [dashboardStats, setDashboardStats] = useState(null)
    const [downloadingItems, setDownloadingItems] = useState({})
    const [deletingItems, setDeletingItems] = useState({})
    const [apiHealth, setApiHealth] = useState({ api: null, dubbing: null })
    const [notifications, setNotifications] = useState([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [notifOpen, setNotifOpen] = useState(false)

    const getReadableError = (error) => {
        const status = error?.response?.status
        const backendMsg = error?.response?.data?.error

        if (status === 401 || status === 422) {
            return 'Session expired or invalid. Please login again.'
        }

        return backendMsg || error.message || 'Something went wrong'
    }

    const fetchJobs = async () => {
        try {
            const accessToken = token || localStorage.getItem('access_token')
            const response = await axios.get(`${API_BASE}/api/jobs`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            })
            setJobs(response.data)
        } catch (error) {
            console.error('Failed to fetch jobs:', error)
        }
    }

    const fetchDashboardStats = async () => {
        try {
            const accessToken = token || localStorage.getItem('access_token')
            const response = await axios.get(`${API_BASE}/api/dashboard`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            })
            setDashboardStats(response.data)
        } catch (error) {
            console.error('Failed to fetch dashboard stats:', error)
        }
    }

    const fetchNotifications = async () => {
        try {
            const accessToken = token || localStorage.getItem('access_token')
            if (!accessToken) return
            const response = await axios.get(`${API_BASE}/api/notifications`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            })
            setNotifications(response.data?.notifications || [])
            setUnreadCount(response.data?.unread_count || 0)
        } catch (error) {
            console.error('Failed to fetch notifications:', error)
        }
    }

    const markAllNotificationsRead = async () => {
        try {
            const accessToken = token || localStorage.getItem('access_token')
            if (!accessToken || unreadCount === 0) return
            await axios.post(`${API_BASE}/api/notifications/read-all`, {}, {
                headers: { Authorization: `Bearer ${accessToken}` }
            })
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
            setUnreadCount(0)
        } catch (error) {
            console.error('Failed to mark notifications as read:', error)
        }
    }

    const handleNotifToggle = async () => {
        const next = !notifOpen
        setNotifOpen(next)
        if (next) {
            await fetchNotifications()
            await markAllNotificationsRead()
        }
    }

    const getNotifIcon = (type) => {
        if (type === 'success') return <FaCheckCircle className="text-green-400" />
        if (type === 'error') return <FaExclamationTriangle className="text-red-400" />
        if (type === 'warning') return <FaExclamationTriangle className="text-yellow-400" />
        return <FaInfoCircle className="text-blue-400" />
    }

    useEffect(() => {
        fetchJobs()
        fetchDashboardStats()
        fetchNotifications()
        // Health check once on mount
        const checkHealth = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/health`)
                const data = await res.json()
                setApiHealth({
                    api: res.ok,
                    dubbing: data?.dubbing_ready !== false // defaults to true if key absent
                })
            } catch {
                setApiHealth({ api: false, dubbing: false })
            }
        }
        checkHealth()
    }, [])

    // Smart polling: only keep polling while there are in-progress jobs
    useEffect(() => {
        const hasActive = jobs.some(j => !['completed', 'failed', 'cancelled'].includes(j.status))
        if (!hasActive) return

        const interval = setInterval(() => {
            fetchJobs()
            fetchDashboardStats()
            fetchNotifications()
        }, 3000)
        return () => clearInterval(interval)
    }, [jobs])

    useEffect(() => {
        const onDocClick = (e) => {
            if (!e.target.closest('.notif-panel') && !e.target.closest('.notif-toggle')) {
                setNotifOpen(false)
            }
        }
        document.addEventListener('mousedown', onDocClick)
        return () => document.removeEventListener('mousedown', onDocClick)
    }, [])

    useEffect(() => {
        const interval = setInterval(() => {
            fetchNotifications()
        }, 12000)
        return () => clearInterval(interval)
    }, [token])

    const handleProcessVideo = async (youtubeUrl) => {
        setLoading(true)
        setMessage(null)

        try {
            const accessToken = token || localStorage.getItem('access_token')
            const response = await axios.post(`${API_BASE}/api/process-video`, {
                youtube_url: youtubeUrl,
                logo_path: null,
                processing_type: 'full_video'
            }, {
                headers: { Authorization: `Bearer ${accessToken}` }
            })

            setMessage({
                type: 'success',
                text: `Full video download started. Job ID: ${response.data.job_id}`
            })

            setSelectedJob(response.data.job_id)
            await fetchJobs()
            setVideoUrl('')
        } catch (error) {
            setMessage({
                type: 'error',
                text: `Error: ${getReadableError(error)}`
            })

            if (error?.response?.status === 401 || error?.response?.status === 422) {
                logout()
                navigate('/login')
            }
        } finally {
            setLoading(false)
        }
    }

    const handleQuickAnalyze = (e) => {
        e.preventDefault()
        const videoId = extractYouTubeVideoId(videoUrl)

        if (!videoId) {
            setMessage({
                type: 'error',
                text: 'Please enter a valid YouTube URL or 11-character video ID.'
            })
            return
        }

        handleProcessVideo(normalizeYouTubeUrl(videoId))
    }

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const handleDownloadAll = async (e, jobId) => {
        e.stopPropagation()
        const downloadId = `${jobId}-all`
        setDownloadingItems(prev => ({ ...prev, [downloadId]: true }))

        try {
            const accessToken = token || localStorage.getItem('access_token')
            const response = await fetch(`${API_BASE}/api/download/all/${jobId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error || 'Download failed.')
            }

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.style.display = 'none'
            a.href = url

            const contentDisposition = response.headers.get('Content-Disposition')
            let filename = `locaa_ai_full_video_${jobId}.mp4`
            if (contentDisposition && contentDisposition.indexOf('attachment') !== -1) {
                const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition)
                if (matches != null && matches[1]) {
                    filename = matches[1].replace(/['"]/g, '')
                }
            }

            a.download = filename
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)

            setMessage({ type: 'success', text: `Download started for ${filename}` })
            setTimeout(() => setMessage(null), 3000)
        } catch (err) {
            setMessage({ type: 'error', text: err.message })
            setTimeout(() => setMessage(null), 5000)
        } finally {
            setDownloadingItems(prev => ({ ...prev, [downloadId]: false }))
        }
    }

    const handleCancelJob = async (e, jobId) => {
        e.stopPropagation()
        try {
            const accessToken = token || localStorage.getItem('access_token')
            await axios.post(`${API_BASE}/api/cancel-job/${jobId}`, {}, {
                headers: { Authorization: `Bearer ${accessToken}` }
            })

            setMessage({
                type: 'success',
                text: `Job ${jobId} cancelled successfully.`
            })

            await fetchJobs()
        } catch (error) {
            setMessage({
                type: 'error',
                text: `Cancel failed: ${getReadableError(error)}`
            })
        }
    }

    const handleDeleteJob = async (e, jobId) => {
        e.stopPropagation()
        if (!window.confirm('Are you sure you want to delete this job and its associated files?')) {
            return
        }
        setDeletingItems(prev => ({ ...prev, [jobId]: true }))
        try {
            const accessToken = token || localStorage.getItem('access_token')
            await axios.delete(`${API_BASE}/api/delete-job/${jobId}`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            })

            setMessage({
                type: 'success',
                text: `Job ${jobId} deleted successfully.`
            })

            await fetchJobs()
        } catch (error) {
            setMessage({
                type: 'error',
                text: `Delete failed: ${getReadableError(error)}`
            })
        } finally {
            setDeletingItems(prev => ({ ...prev, [jobId]: false }))
        }
    }

    const activeJobs = jobs.filter((job) => !['completed', 'failed', 'cancelled'].includes(job.status))
    const completedJobs = jobs.filter((job) => job.status === 'completed').length
    const processingJobs = jobs.filter((job) => ['processing', 'downloading'].includes(job.status)).length
    const failedJobs = jobs.filter((job) => job.status === 'failed').length
    const creatorBadges = ['AI clip engine', 'Instant repurposing', 'Multi-platform ready']

    const sidePrimaryItems = [
        { label: 'Dashboard', icon: '▦', active: true, path: '/dashboard' },
        { label: 'My Projects', icon: '◫', path: '/settings' },
        // { label: 'Clip Maker', icon: '✂', path: '/settings' },
        // { label: 'Logo & Branding', icon: '✎', path: '/branding' },
        // { label: 'Upload Manager', icon: '⤴', path: '/dashboard' },
        { label: 'Team Collab', icon: '⎈', path: '/team-collaboration' },
        { label: 'Integrations', icon: '◌', path: '/integrations' },
    ]

    const sideSecondaryItems = [
        { label: 'Analytics', icon: <FaChartLine />, path: '/dashboard' },
        { label: 'Pricing & Plan', icon: <FaFolder />, path: '/pricing' },
        { label: 'Profile Settings', icon: <FaBell />, path: '/profile' },
        { label: 'Support & Docs', icon: <FaQuestionCircle />, path: '/support-docs' },
        // { label: 'API Access', icon: <FaKey />, meta: 'For devs', path: '/profile?tab=security' },
    ]

    const projectCards = jobs.slice(0, 6).map((job, index) => {
        const status = job.status || 'downloading'
        const downloadProgress = Number.isFinite(job.download_progress) ? job.download_progress : 0
        const overallProgress = Number.isFinite(job.progress) ? job.progress : 0
        const progress = status === 'downloading'
            ? Math.max(0, Math.min(100, downloadProgress))
            : Math.max(0, Math.min(100, overallProgress))

        const thumbnailUrl =
            job.thumbnail_url ||
            (job.video_id ? `https://i.ytimg.com/vi/${job.video_id}/hqdefault.jpg` : null)

        const canCancel = ['downloading', 'processing', 'pending'].includes(status)

        return {
            id: job.id,
            title: status === 'completed' ? 'Ready to Download' : (status === 'failed' ? 'Failed' : status === 'cancelled' ? 'Cancelled' : 'Processing'),
            status,
            progress,
            videoId: job.video_id || 'Unknown',
            thumbnailUrl,
            currentStep: job.current_step || (status === 'downloading' ? 'Downloading source...' : 'Processing...'),
            errorMessage: job.error_message || null,
            canCancel
        }
    })

    const metricCards = [
        {
            label: 'Total Requests',
            value: dashboardStats?.stats?.total_videos_processed ?? jobs.length,
            icon: <FaVideo className="text-primary-400" />,
            trend: '+12% this week',
            trendUp: true
        },
        {
            label: 'Ready Downloads',
            value: completedJobs,
            icon: <FaDownload className="text-blue-400" />,
            trend: '+5% this week',
            trendUp: true
        },
        {
            label: 'In Progress',
            value: processingJobs,
            icon: <FaSpinner className="text-yellow-400 animate-spin" />,
            trend: 'Live updates',
            trendUp: true
        },
        {
            label: 'Failed Jobs',
            value: failedJobs,
            icon: <FaBan className="text-red-400" />,
            trend: '-2% this week',
            trendUp: false
        },
    ]

    const displayedActivity = jobs.slice(0, 4).map((job, idx) => {
        const shortId = String(job.id).slice(0, 8)
        const phrases = {
            completed: 'full video is ready for download',
            processing: 'is currently processing',
            downloading: 'is downloading source',
            failed: 'failed and needs retry',
            cancelled: 'was cancelled',
        }
        const text = phrases[job.status] || 'processing'
        return {
            id: job.id,
            icon: job.status === 'completed' ? '✅' : job.status === 'failed' ? '❌' : '⏳',
            text: `Job ${shortId} ${text}`,
            time: 'Just now'
        }
    })

    const finalActivity = displayedActivity.length > 0
        ? displayedActivity
        : [
            { id: 1, icon: '🚀', text: 'Paste your first YouTube link to start download', time: 'Now' },
            { id: 2, icon: '✨', text: 'Your video will appear here once ready', time: 'Pending' },
        ]

    return (
        <div className="flex h-screen bg-dark-900 text-dark-50 font-sans overflow-hidden">
            {/* Ambient Background Elements */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary-500/10 rounded-full mix-blend-screen filter blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full mix-blend-screen filter blur-[120px] pointer-events-none" />

            {/* Sidebar */}
            <aside className="w-64 bg-dark-900/50 backdrop-blur-xl border-r border-white/5 flex flex-col z-10 hidden md:flex">
                <div className="p-6 flex items-center gap-3 border-b border-white/5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-blue-500 flex items-center justify-center font-display font-bold text-white text-lg">
                        L
                    </div>
                    <span className="font-display font-bold text-xl text-white tracking-tight">Locaa AI</span>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8 custom-scrollbar">
                    <nav className="space-y-1">
                        <p className="px-3 text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2">Main Menu</p>
                        {sidePrimaryItems.map((item) => (
                            <a
                                href="#"
                                key={item.label}
                                onClick={(e) => { e.preventDefault(); navigate(item.path); }}
                                className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group ${item.active
                                    ? 'bg-primary-500/10 text-primary-400 font-medium'
                                    : 'text-dark-300 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`text-lg ${item.active ? 'text-primary-400' : 'text-dark-400 group-hover:text-white'}`}>
                                        {item.icon}
                                    </span>
                                    <span>{item.label}</span>
                                </div>
                                {item.active && <div className="w-1.5 h-1.5 rounded-full bg-primary-500 shadow-[0_0_8px_rgba(20,184,166,0.8)]"></div>}
                            </a>
                        ))}
                    </nav>

                    <nav className="space-y-1">
                        <p className="px-3 text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2">Preferences</p>
                        {sideSecondaryItems.map((item) => (
                            <a
                                href="#"
                                key={item.label}
                                onClick={(e) => { e.preventDefault(); navigate(item.path); }}
                                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-dark-300 hover:bg-white/5 hover:text-white transition-all duration-200 group"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-lg text-dark-400 group-hover:text-white transition-colors">
                                        {item.icon}
                                    </span>
                                    <span>{item.label}</span>
                                </div>
                                {item.meta && (
                                    <span className="text-[10px] uppercase tracking-wider bg-dark-800 text-dark-300 px-2 py-0.5 rounded-full border border-white/5">
                                        {item.meta}
                                    </span>
                                )}
                            </a>
                        ))}
                    </nav>
                </div>

                <div className="p-4 border-t border-white/5">
                    <div className="relative overflow-hidden bg-gradient-to-br from-primary-600/20 to-blue-600/20 border border-primary-500/30 rounded-2xl p-4 text-center group">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-primary-500/20 rounded-full blur-xl translate-x-1/2 -translate-y-1/2"></div>
                        <h4 className="text-white font-bold mb-1 group-hover:text-primary-300 transition-colors">Go Premium</h4>
                        <p className="text-xs text-primary-200/70 mb-4">Unlock 4K quality & API</p>
                        <button
                            className="w-full py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-primary-500/25 group-hover:shadow-primary-500/40 transform group-hover:-translate-y-0.5"
                            onClick={() => navigate('/pricing')}
                        >
                            Upgrade Now
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col z-10 relative h-full overflow-hidden">
                {/* Top Header */}
                <header className="h-20 bg-dark-900/50 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-8 sticky top-0 z-20">
                    <h1 className="text-2xl font-display font-bold text-white flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-primary-400 text-sm border border-white/10">
                            <FaVideo />
                        </span>
                        Dashboard
                    </h1>

                    <div className="flex items-center gap-6">
                        <button className="notif-toggle relative text-dark-300 hover:text-white transition-colors" onClick={handleNotifToggle}>
                            <FaBell className="text-xl" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 bg-primary-500 text-white text-[10px] rounded-full border-2 border-dark-900 flex items-center justify-center font-bold">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>

                        {notifOpen && (
                            <div className="notif-panel absolute top-16 right-28 w-[360px] max-h-[420px] overflow-y-auto bg-dark-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-3 z-50">
                                <div className="flex items-center justify-between px-2 py-2 border-b border-white/10 mb-2">
                                    <h4 className="text-sm font-semibold text-white">Notifications</h4>
                                    <span className="text-xs text-dark-400">{unreadCount} unread</span>
                                </div>
                                {notifications.length === 0 ? (
                                    <div className="p-4 text-sm text-dark-400">No notifications yet.</div>
                                ) : (
                                    notifications.map((n) => (
                                        <div key={n.id} className={`p-3 rounded-xl mb-2 border ${n.is_read ? 'border-white/5 bg-dark-800/40' : 'border-primary-500/30 bg-primary-500/5'}`}>
                                            <div className="flex items-start gap-3">
                                                <div className="mt-0.5">{getNotifIcon(n.type)}</div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-white truncate">{n.title}</p>
                                                    <p className="text-xs text-dark-300 mt-1 leading-relaxed">{n.message}</p>
                                                    <p className="text-[10px] text-dark-500 mt-2">{new Date(n.created_at).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        <div className="h-8 w-px bg-white/10"></div>

                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-semibold text-white leading-none mb-1">
                                    {user?.name || user?.email?.split('@')[0] || 'User'}
                                </p>
                                <p className="text-xs text-primary-400 font-medium leading-none">Pro Plan</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-600 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-primary-500/20 ring-2 ring-white/10">
                                {user?.name?.[0] || 'A'}
                            </div>
                            <button
                                className="ml-2 text-dark-400 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-white/5"
                                onClick={handleLogout}
                                title="Sign out"
                            >
                                <FaSignOutAlt />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Dashboard Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">

                    {/* Welcome & Quick Action */}
                    <div className="flex flex-col lg:flex-row gap-8 mb-10">
                        <div className="lg:w-2/3">
                            <div className="glass-panel p-8 bg-gradient-to-br from-dark-800/80 to-dark-900/50 border-white/5 h-full flex flex-col justify-center overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-56 h-56 bg-primary-500/10 rounded-full blur-[80px] pointer-events-none" />
                                <div className="relative z-10">
                                    <div className="flex flex-wrap gap-2 mb-5">
                                        {creatorBadges.map((badge) => (
                                            <span key={badge} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-dark-200">
                                                {badge}
                                            </span>
                                        ))}
                                    </div>
                                    <h2 className="text-3xl font-display font-bold text-white mb-2">
                                        Create new <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-blue-400">Viral Clips</span>
                                    </h2>
                                    <p className="text-dark-300 mb-6 max-w-2xl">Paste a YouTube URL below to instantly launch your content pipeline, turn it into shorts, and keep your startup growth loop active.</p>

                                    <div className="grid grid-cols-3 gap-3 max-w-xl mb-8">
                                        <div className="rounded-2xl border border-white/5 bg-dark-900/30 p-3">
                                            <p className="text-2xl font-display font-bold text-white">{activeJobs.length}</p>
                                            <p className="text-[11px] uppercase tracking-[0.18em] text-dark-500">live jobs</p>
                                        </div>
                                        <div className="rounded-2xl border border-white/5 bg-dark-900/30 p-3">
                                            <p className="text-2xl font-display font-bold text-white">{completedJobs}</p>
                                            <p className="text-[11px] uppercase tracking-[0.18em] text-dark-500">completed</p>
                                        </div>
                                        <div className="rounded-2xl border border-white/5 bg-dark-900/30 p-3">
                                            <p className="text-2xl font-display font-bold text-white">{failedJobs}</p>
                                            <p className="text-[11px] uppercase tracking-[0.18em] text-dark-500">needs review</p>
                                        </div>
                                    </div>
                                </div>

                                <form onSubmit={handleQuickAnalyze} className="relative max-w-2xl">
                                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                        <FaLink className="text-dark-400" />
                                    </div>
                                    <input
                                        className="w-full bg-dark-900 border border-white/10 hover:border-primary-500/50 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-2xl py-4 pl-12 pr-40 text-white placeholder-dark-500 transition-all shadow-inner"
                                        type="text"
                                        placeholder="https://www.youtube.com/watch?v=..."
                                        value={videoUrl}
                                        onChange={(e) => setVideoUrl(e.target.value)}
                                        disabled={loading}
                                    />
                                    <button
                                        className="absolute right-2 top-2 bottom-2 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white rounded-xl px-6 font-semibold shadow-lg shadow-primary-500/25 disabled:opacity-50 transition-all hover:scale-[1.02] flex items-center gap-2"
                                        type="submit"
                                        disabled={loading || !videoUrl}
                                    >
                                        {loading ? <FaSpinner className="animate-spin" /> : <FaMagic />}
                                        <span className="hidden sm:inline">{loading ? 'Starting...' : 'Process Video'}</span>
                                    </button>
                                </form>

                                <AnimatePresence>
                                    {message && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className={`mt-4 w-fit px-4 py-2 rounded-xl text-sm flex items-center gap-2 border ${message.type === 'error'
                                                ? 'bg-red-500/10 border-red-500/20 text-red-400'
                                                : 'bg-green-500/10 border-green-500/20 text-green-400'
                                                }`}
                                        >
                                            {message.type === 'error' ? '⚠️' : '✅'} {message.text}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Quick Stats Grid */}
                        <div className="lg:w-1/3 grid grid-cols-2 gap-4">
                            {metricCards.map((card, idx) => (
                                <div key={idx} className="glass-panel p-5 bg-dark-800/40 border-white/5 flex flex-col justify-between hover:bg-dark-800/60 transition-colors">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl shadow-inner border border-white/5">
                                            {card.icon}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-display font-bold text-white mb-1">{card.value}</h3>
                                        <p className="text-xs text-dark-400 font-medium mb-2">{card.label}</p>
                                        <div className="flex items-center gap-1 text-[10px] font-semibold">
                                            {card.trendUp ? (
                                                <span className="text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded">↑ {card.trend}</span>
                                            ) : (
                                                <span className={card.trend.includes('update') ? 'text-primary-400 bg-primary-400/10 px-1.5 py-0.5 rounded' : 'text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded'}>
                                                    {card.trend.includes('update') ? '⚡' : '↓'} {card.trend}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Jobs Section */}
                    <div className="mb-10">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-display font-bold text-white">Recent Projects</h2>
                            <button className="text-sm font-medium text-primary-400 hover:text-primary-300 transition-colors">View All →</button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {projectCards.length > 0 ? projectCards.map((item) => (
                                <div
                                    key={item.id}
                                    className="glass-panel bg-dark-800/40 hover:bg-dark-800/60 transition-all duration-300 border-white/5 overflow-hidden group flex flex-col"
                                >
                                    {/* Thumbnail Area */}
                                    <div className="relative h-44 bg-dark-900 flex-shrink-0">
                                        {item.thumbnailUrl ? (
                                            <img
                                                src={item.thumbnailUrl}
                                                alt={`Thumbnail for ${item.videoId}`}
                                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                            />
                                        ) : (
                                            <div className="absolute inset-0 bg-gradient-to-tr from-dark-800 to-dark-700 flex items-center justify-center">
                                                <FaVideo className="text-4xl text-dark-500" />
                                            </div>
                                        )}

                                        {/* Status Badge Over Thumbnail */}
                                        <div className="absolute top-3 left-3">
                                            <span className={`px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded-full backdrop-blur-md border ${item.status === 'completed' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                                                item.status === 'failed' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                                                    item.status === 'cancelled' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                                                        'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                                }`}>
                                                {item.status}
                                            </span>
                                        </div>

                                        {/* Gradient Overlay for Text Readability */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-dark-900/90 via-dark-900/20 to-transparent"></div>

                                        {/* ID over thumbnail */}
                                        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                                            <div className="text-white font-medium truncate text-sm">
                                                Job #{String(item.id).slice(0, 8)}
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">
                                                <FaPlay className="text-white text-xs ml-0.5" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content Area */}
                                    <div className="p-5 flex flex-col flex-1 justify-between">
                                        <div className="mb-4">
                                            <div className="flex justify-between items-center mb-1 text-xs text-dark-400">
                                                <span>Progress</span>
                                                <span className="font-semibold text-white">{Math.round(item.progress)}%</span>
                                            </div>
                                            {/* Progress Bar */}
                                            <div className="h-1.5 w-full bg-dark-700 rounded-full overflow-hidden mb-2">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${item.status === 'completed' ? 'bg-green-500' :
                                                        item.status === 'failed' ? 'bg-red-500' :
                                                            item.status === 'cancelled' ? 'bg-yellow-500' :
                                                                'bg-gradient-to-r from-primary-500 to-blue-500'
                                                        }`}
                                                    style={{ width: `${item.progress}%` }}
                                                ></div>
                                            </div>
                                            <p className="text-xs text-dark-400 truncate mt-2">
                                                <span className="text-primary-400 text-xs">●</span> {item.currentStep}
                                            </p>
                                            {/* Show detailed error for failed jobs */}
                                            {item.status === 'failed' && item.errorMessage && (
                                                <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded-md">
                                                    <p className="text-xs text-red-300 leading-snug">
                                                        <strong>Error:</strong> {item.errorMessage}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2 mt-auto">
                                            {item.status === 'completed' && (
                                                <>
                                                    <button
                                                        className="flex-1 bg-primary-500 hover:bg-primary-400 text-white py-2 px-3 rounded-lg text-sm font-semibold transition-colors flex justify-center items-center gap-2"
                                                        onClick={(e) => handleDownloadAll(e, item.id)}
                                                        disabled={downloadingItems[`${item.id}-all`]}
                                                    >
                                                        {downloadingItems[`${item.id}-all`] ? <FaSpinner className="animate-spin" /> : <FaDownload />}
                                                        <span>Save</span>
                                                    </button>
                                                    <button
                                                        className="bg-dark-700 hover:bg-red-500/20 text-dark-300 hover:text-red-400 py-2 px-3 rounded-lg text-sm transition-colors border border-white/5 hover:border-red-500/30"
                                                        onClick={(e) => handleDeleteJob(e, item.id)}
                                                        disabled={deletingItems[item.id]}
                                                        title="Delete Job"
                                                    >
                                                        {deletingItems[item.id] ? <FaSpinner className="animate-spin" /> : <FaTrash />}
                                                    </button>
                                                </>
                                            )}

                                            {item.canCancel && (
                                                <button
                                                    className="w-full bg-dark-700 hover:bg-dark-600 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors border border-white/5 hover:border-white/10 flex justify-center items-center gap-2"
                                                    onClick={(e) => handleCancelJob(e, item.id)}
                                                >
                                                    <FaBan className="text-red-400" /> Cancel Process
                                                </button>
                                            )}

                                            {(item.status === 'failed' || item.status === 'cancelled') && !item.canCancel && (
                                                <button
                                                    className="w-full bg-dark-700 hover:bg-red-500/20 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors border border-white/5 hover:border-red-500/30 flex justify-center items-center gap-2"
                                                    onClick={(e) => handleDeleteJob(e, item.id)}
                                                    disabled={deletingItems[item.id]}
                                                >
                                                    {deletingItems[item.id] ? <FaSpinner className="animate-spin" /> : <FaTrash className="text-red-400" />}
                                                    <span>Remove Job</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="glass-panel border-dashed border-2 border-white/10 bg-dark-800/20 col-span-full py-16 flex flex-col items-center justify-center text-center">
                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                        <FaVideo className="text-2xl text-dark-500" />
                                    </div>
                                    <h3 className="text-xl font-display font-medium text-white mb-2">No projects yet</h3>
                                    <p className="text-dark-400 max-w-sm">Paste a YouTube link above to start generating your first set of viral clips.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Lower Section Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        <div className="lg:col-span-2 glass-panel p-6 bg-dark-800/40 border-white/5">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-display font-bold text-white">System Status</h3>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-dark-900/50 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-2 h-2 rounded-full ${apiHealth.api === null ? 'bg-yellow-400 animate-pulse' : apiHealth.api ? 'bg-green-400 shadow-[0_0_8px_#4ade80]' : 'bg-red-400 shadow-[0_0_8px_#f87171]'}`}></div>
                                        <div>
                                            <p className="text-sm font-medium text-white">Download Engine</p>
                                            <p className="text-xs text-dark-400">yt-dlp v2025.2.19</p>
                                        </div>
                                    </div>
                                    <span className={`text-xs font-semibold px-2 py-1 rounded-md ${apiHealth.api === null ? 'text-yellow-400 bg-yellow-400/10' : apiHealth.api ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>
                                        {apiHealth.api === null ? 'Checking…' : apiHealth.api ? 'Online' : 'Offline'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-dark-900/50 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-2 h-2 rounded-full ${apiHealth.dubbing === null ? 'bg-yellow-400 animate-pulse' : apiHealth.dubbing ? 'bg-green-400 shadow-[0_0_8px_#4ade80]' : 'bg-red-400 shadow-[0_0_8px_#f87171]'}`}></div>
                                        <div>
                                            <p className="text-sm font-medium text-white">AI Dubbing Pipeline</p>
                                            <p className="text-xs text-dark-400">Whisper + Edge-TTS</p>
                                        </div>
                                    </div>
                                    <span className={`text-xs font-semibold px-2 py-1 rounded-md ${apiHealth.dubbing === null ? 'text-yellow-400 bg-yellow-400/10' : apiHealth.dubbing ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>
                                        {apiHealth.dubbing === null ? 'Checking…' : apiHealth.dubbing ? 'Online' : 'Offline'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="glass-panel p-6 bg-dark-800/40 border-white/5">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-display font-bold text-white">Recent Activity</h3>
                            </div>
                            <div className="space-y-6">
                                {finalActivity.map((activity, idx) => (
                                    <div key={idx} className="flex gap-4 relative">
                                        {idx !== finalActivity.length - 1 && (
                                            <div className="absolute top-8 left-3.5 bottom-[-20px] w-px bg-white/10"></div>
                                        )}
                                        <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 text-xs shadow-inner">
                                            {activity.icon}
                                        </div>
                                        <div>
                                            <p className="text-sm text-dark-100">{activity.text}</p>
                                            <p className="text-xs text-dark-500 mt-1">{activity.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default DashboardAdvanced
