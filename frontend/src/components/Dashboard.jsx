import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  FaBell,
  FaChartLine,
  FaCut,
  FaDeploy,
  FaDownload,
  FaFolder,
  FaKey,
  FaLink,
  FaPlay,
  FaQuestionCircle,
  FaSearch,
  FaSignOutAlt,
  FaUpload,
  FaUsers,
  FaVideo,
} from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'
import { extractYouTubeVideoId, normalizeYouTubeUrl } from '../utils/youtube'
import '../styles/DashboardNew.css'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

function Dashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [jobs, setJobs] = useState([])
  const [selectedJob, setSelectedJob] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [dashboardStats, setDashboardStats] = useState(null)

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
      const token = localStorage.getItem('access_token')
      const response = await axios.get(`${API_BASE}/api/jobs`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setJobs(response.data)
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
    }
  }

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await axios.get(`${API_BASE}/api/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setDashboardStats(response.data)
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
    }
  }

  useEffect(() => {
    fetchJobs()
    fetchDashboardStats()

    const interval = setInterval(() => {
      fetchJobs()
      fetchDashboardStats()
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const handleProcessVideo = async (youtubeUrl, processingType = 'clips') => {
    setLoading(true)
    setMessage(null)

    try {
      const token = localStorage.getItem('access_token')
      const response = await axios.post(`${API_BASE}/api/process-video`, {
        youtube_url: youtubeUrl,
        logo_path: null,
        processing_type: processingType
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      const modeText = processingType === 'clips' ? 'Clips generation' : 'Full video upload'
      setMessage({
        type: 'success',
        text: `✅ ${modeText} started! Job ID: ${response.data.job_id}`
      })

      setSelectedJob(response.data.job_id)
      await fetchJobs()
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

    handleProcessVideo(normalizeYouTubeUrl(videoId), 'clips')
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const currentJob = jobs.find(j => j.id === selectedJob)
  const activeJobs = jobs.filter((job) => !['completed', 'failed', 'cancelled'].includes(job.status))
  const completedJobs = jobs.filter((job) => job.status === 'completed').length
  const processingJobs = jobs.filter((job) => ['processing', 'downloading'].includes(job.status)).length
  const totalTimeSavedHours = (dashboardStats?.stats?.total_clips_generated ?? 0) * 0.55

  const sidePrimaryItems = [
    { label: 'Dashboard', icon: '▦', active: true, path: '/dashboard' },
    { label: 'My Projects', icon: '◫', path: '/settings' },
    { label: 'Clip Maker', icon: '✂', path: '/settings' },
    { label: 'Logo & Branding', icon: '✎', path: '/branding' },
    { label: 'Upload Manager', icon: '⤴', path: '/dashboard' },
    { label: 'Team Collab', icon: '⎈', path: '/team-collaboration' },
    { label: 'Integrations', icon: '◌', path: '/integrations' },
  ]

  const sideSecondaryItems = [
    { label: 'Analytics', icon: <FaChartLine />, path: '/dashboard' },
    { label: 'Pricing & Plan', icon: <FaFolder />, path: '/pricing' },
    { label: 'Profile Settings', icon: <FaBell />, path: '/profile' },
    { label: 'Support & Docs', icon: <FaQuestionCircle />, path: '/support-docs' },
    { label: 'API Access', icon: <FaKey />, meta: 'For devs', path: '/profile?tab=security' },
  ]

  const projectCards = useMemo(() => {
    const mapped = jobs.slice(0, 3).map((job, index) => {
      const progress = Number.isFinite(job.progress) ? Math.max(8, Math.min(100, job.progress)) : 28 + (index * 14)
      const clips = Number.isFinite(job.clips_generated) ? job.clips_generated : 0
      const uploadReady = ['completed', 'ready_for_publishing', 'published'].includes(job.status)

      return {
        id: job.id,
        title: job.status === 'completed' ? 'Ready' : 'Processing',
        progress,
        clipsProgress: Math.min(100, clips > 0 ? 22 + clips * 11 : 16 + index * 12),
        uploadProgress: uploadReady ? 96 : Math.min(92, Math.floor(progress * 0.8)),
        thumbClass: `thumb-${index + 1}`,
      }
    })

    if (mapped.length > 0) {
      return mapped
    }

    return [
      { id: 'sample-1', title: 'Processing', progress: 34, clipsProgress: 18, uploadProgress: 12, thumbClass: 'thumb-1' },
      { id: 'sample-2', title: 'Processing', progress: 48, clipsProgress: 35, uploadProgress: 20, thumbClass: 'thumb-2' },
      { id: 'sample-3', title: 'Processing', progress: 41, clipsProgress: 24, uploadProgress: 15, thumbClass: 'thumb-3' },
    ]
  }, [jobs])

  const metricCards = [
    {
      label: 'Total Videos Processed',
      value: dashboardStats?.stats?.total_videos_processed ?? 0,
      icon: <FaVideo />,
    },
    {
      label: 'Short Clips Created',
      value: dashboardStats?.stats?.total_clips_generated ?? 0,
      icon: <FaCut />,
    },
    {
      label: 'Full Videos with Logo',
      value: completedJobs,
      icon: <FaUpload />,
    },
    {
      label: 'Total Time Saved',
      value: `${Math.max(0, Math.round(totalTimeSavedHours))} Hours`,
      icon: <FaUsers />,
    },
  ]

  const recentActivity = jobs.slice(0, 4).map((job, idx) => {
    const shortId = String(job.id).slice(0, 8)
    const phrases = {
      completed: 'clip ready.',
      processing: 'processing.',
      downloading: 'downloading source.',
      failed: 'failed and needs retry.',
      cancelled: 'was cancelled.',
    }

    const text = phrases[job.status] || 'processing.'
    return `${idx + 1}. "Video ${shortId}" ${text}`
  })

  const displayedActivity = recentActivity.length > 0
    ? recentActivity
    : [
      '1. "How to Bake Bread" clip ready.',
      '2. "SaaS Growth Tips" processing.',
      '3. "Gwalior Fort VLOG" logo applied.',
      '4. "New AI Model" clip 5 generated.',
    ]

  return (
    <div className="dashboard-wrapper">
      <aside className="dashboard-sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">L</div>
          <span>Locaa AI</span>
        </div>

        <nav className="sidebar-nav">
          {sidePrimaryItems.map((item) => (
            <a
              href="#"
              className={`nav-item ${item.active ? 'active' : ''}`}
              key={item.label}
              onClick={(e) => { e.preventDefault(); navigate(item.path); }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.badge && <span className="badge">{item.badge}</span>}
            </a>
          ))}
        </nav>

        <div className="sidebar-social">
          <a href="#" title="YouTube" aria-label="YouTube">
            <span>▶</span>
          </a>
          <a href="#" title="TikTok" aria-label="TikTok">
            <span>♪</span>
          </a>
          <a href="#" title="Instagram" aria-label="Instagram">
            <span>◎</span>
          </a>
          <a href="#" title="Cloud" aria-label="Cloud">
            <span>☁</span>
          </a>
        </div>

        <nav className="sidebar-footer-nav">
          {sideSecondaryItems.map((item) => (
            <a
              href="#"
              className="nav-item"
              key={item.label}
              onClick={(e) => { e.preventDefault(); navigate(item.path); }}
            >
              <span className="nav-icon nav-icon-lib">{item.icon}</span>
              <span>{item.label}</span>
              {item.meta && <span className="badge-small">{item.meta}</span>}
            </a>
          ))}
        </nav>

        <button className="upgrade-btn" type="button">Upgrade Now</button>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-left">
            <h1>Locaa AI - Dashboard</h1>
          </div>
          <div className="header-right">
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input type="text" placeholder="Search" />
            </div>
            <button className="header-icon-btn" type="button" aria-label="Notifications">
              <FaBell />
            </button>
            <div className="user-profile">
              <span className="avatar">{user?.username?.[0] || 'A'}</span>
              <div className="user-details">
                <span className="username">{user?.username || user?.email?.split('@')[0] || 'User'}</span>
                <span className="plan">Free Plan</span>
              </div>
            </div>
            <button className="header-logout" type="button" onClick={handleLogout} aria-label="Logout">
              <FaSignOutAlt />
            </button>
          </div>
        </header>

        <div className="dashboard-content">
          <div className="active-projects-section">
            <h2 className="section-title">Active Projects</h2>
            <div className="projects-strip-grid">
              {projectCards.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className="project-row-card"
                  onClick={() => setSelectedJob(item.id)}
                >
                  <div className={`project-thumb ${item.thumbClass}`}>
                    <span className="play-chip"><FaPlay /></span>
                  </div>
                  <div className="project-meta">
                    <div className="project-status-head">
                      {item.title}
                      {item.isCompleted && (
                        <a
                          href={`${API_BASE}/api/download/all/${item.id}`}
                          className="download-link-btn"
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{ marginLeft: 'auto', fontSize: '0.9rem', color: '#10b981', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}
                        >
                          <FaDownload /> Download
                        </a>
                      )}
                    </div>
                    <div className="project-meter-row">
                      <span>Processing</span>
                      <div className="meter"><div style={{ width: `${item.progress}%` }} /></div>
                    </div>
                    <div className="project-meter-row">
                      <span>Clips Generated</span>
                      <div className="meter"><div style={{ width: `${item.clipsProgress}%` }} /></div>
                    </div>
                    <div className="project-meter-row">
                      <span>Upload Ready</span>
                      <div className="meter"><div style={{ width: `${item.uploadProgress}%` }} /></div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="input-section">
            <form className="quick-form" onSubmit={handleQuickAnalyze}>
              <input
                className="url-input"
                type="text"
                placeholder="Paste YouTube Video Link Here"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                disabled={loading}
              />
              <button className="analyze-btn" type="submit" disabled={loading}>
                {loading ? 'Processing...' : 'Analyze & Process Video'}
              </button>
            </form>
            {message && <p className={`message-pill ${message.type}`}>{message.text}</p>}
          </div>

          <div className="stats-row">
            {metricCards.map((card) => (
              <div className="stat-box" key={card.label}>
                <div className="stat-box-label">
                  <span>{card.icon}</span>
                  {card.label}
                </div>
                <div className="stat-box-value">{card.value}</div>
              </div>
            ))}
          </div>

          <div className="recent-activity">
            <div className="activity-header">
              <h3>Recent Activity</h3>
              <a href="#" className="view-all-link">Views all</a>
            </div>
            <div className="activity-list">
              {displayedActivity.map((line) => (
                <div key={line} className="activity-item">{line}</div>
              ))}
            </div>
          </div>

          <div className="dashboard-bottom-note">
            <FaLink /> {activeJobs.length} active tasks running • {processingJobs} in processing queue • Selected: {currentJob?.id || 'none'}
          </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard
