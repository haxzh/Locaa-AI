import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { FaBell, FaChartLine, FaFolder, FaKey, FaQuestionCircle, FaSearch, FaSignOutAlt, FaUpload, FaCog, FaDownload, FaVideo, FaCut, FaLanguage, FaMicrophone, FaImage, FaYoutube, FaGlobe, FaSpinner } from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'
import '../styles/DashboardNew.css'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

function ProjectSettings() {
  const navigate = useNavigate()
  const { user, logout, token } = useAuth()
  const [watermarkEnabled, setWatermarkEnabled] = useState(true)
  const [videoType, setVideoType] = useState('full') // 'full' or 'clip'
  const [publishPlatform, setPublishPlatform] = useState('youtube') // 'youtube', 'other', 'all'
  const [targetLanguage, setTargetLanguage] = useState('hindi')
  const [inputMethod, setInputMethod] = useState('youtube') // 'youtube', 'upload'
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [uploadedVideo, setUploadedVideo] = useState(null)
  const [processingState, setProcessingState] = useState({ loading: false, success: false, error: null })
  const [jobs, setJobs] = useState([])
  const [downloadingItems, setDownloadingItems] = useState({})
  const [message, setMessage] = useState(null)

  // Publish Modal State
  const [publishModalJob, setPublishModalJob] = useState(null)
  const [publishMetadata, setPublishMetadata] = useState({ title: '', description: '', tags: '' })
  const [publishing, setPublishing] = useState(false)
  const [generatingAI, setGeneratingAI] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
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

  useEffect(() => {
    fetchJobs()
    const interval = setInterval(() => {
      fetchJobs()
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleDownloadAll = async (jobId) => {
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

  const handlePublishSubmit = async () => {
    if (!publishModalJob) return;
    setPublishing(true);
    try {
      const accessToken = token || localStorage.getItem('access_token');

      const payload = {
        platforms: publishPlatform === 'all' ? ['youtube', 'instagram', 'facebook'] : [publishPlatform],
        metadata: {
          title: publishMetadata.title,
          description: publishMetadata.description,
          tags: publishMetadata.tags.split(',').map(t => t.trim()).filter(Boolean)
        }
      };

      const response = await fetch(`${API_BASE}/api/publish/job/${publishModalJob.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to publish');

      setMessage({ type: 'success', text: 'Video published successfully to selected platforms!' });
      setPublishModalJob(null);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setPublishing(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleGenerateAI = async () => {
    if (!publishModalJob) return;
    setGeneratingAI(true);
    try {
      const accessToken = token || localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE}/api/publish/generate-metadata`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ topic: publishModalJob.title || 'startup viral clip' })
      });
      const data = await response.json();
      if (data.metadata) {
        setPublishMetadata({
          title: data.metadata.title || '',
          description: data.metadata.description || '',
          tags: (data.metadata.tags || []).join(', ')
        });
      }
    } catch (err) {
      console.error("AI Generation failed:", err);
    } finally {
      setGeneratingAI(false);
    }
  };

  const sidePrimaryItems = [
    { label: 'Dashboard', icon: '▦', path: '/dashboard' },
    { label: 'My Projects', icon: '◫', path: '/settings', active: true },
    // { label: 'Clip Maker', icon: '✂', path: '/settings' },
    // { label: 'Logo & Branding', icon: '✎', path: '/branding' },
    // { label: 'Upload Manager', icon: '⤴', path: '/dashboard' },
    { label: 'Team Collab', icon: '⎈', path: '/team-collaboration' },
    { label: 'Integrations', icon: '◌', path: '/integrations' },
  ]

  const sideSecondaryItems = [
    { label: 'Analytics', icon: <FaChartLine />, path: '/analytics' },
    { label: 'Pricing & Plan', icon: <FaFolder />, path: '/pricing' },
    { label: 'Profile Settings', icon: <FaCog />, path: '/profile' },
    { label: 'Support & Docs', icon: <FaQuestionCircle />, path: '/support-docs' },
    // { label: 'API Access', icon: <FaKey />, meta: 'For devs', path: '/profile?tab=security' },
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
              <FaFolder />
            </span>
            My Projects
          </h1>

          <div className="flex items-center gap-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search projects..."
                className="w-64 bg-dark-800/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
              />
              <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 text-sm pointer-events-none" />
            </div>
            <button className="relative text-dark-300 hover:text-white transition-colors" aria-label="Notifications">
              <FaBell className="text-xl" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full ring-2 ring-dark-900"></span>
            </button>
            <div className="flex items-center gap-3 bg-dark-800/50 border border-white/10 rounded-xl px-3 py-2 cursor-pointer hover:border-primary-500/30 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                {user?.username?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-white leading-tight">{user?.username || 'Amit Mishra'}</p>
                <p className="text-xs text-dark-400">Free Plan</p>
              </div>
            </div>
            <button
              className="text-dark-300 hover:text-red-400 transition-colors"
              onClick={handleLogout}
              aria-label="Logout"
            >
              <FaSignOutAlt className="text-xl" />
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-8 space-y-6">
            {message && (
              <p className={`message-pill ${message.type}`} style={{ background: message.type === 'error' ? '#fee2e2' : '#dcfce7', color: message.type === 'error' ? '#991b1b' : '#166534', marginBottom: '16px', padding: '10px 16px', borderRadius: '8px', fontSize: '14px' }}>
                {message.text}
              </p>
            )}

            {/* --- AI VIDEO STUDIO WIZARD --- */}
            <div className="premium-glass-card p-8 mb-8 ai-glow-border">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-accent-2 flex items-center justify-center text-white shadow-[0_0_20px_rgba(0,240,255,0.4)]">
                  <span className="text-2xl">✨</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold animated-gradient-text m-0">Create New Magic Video</h2>
                  <p className="text-sm text-muted mt-1">Transform long videos into viral AI clips or multi-language dubs.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Step 1: Source */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <span className="w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs">1</span>
                    Provide Video Source
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className={`flex-1 py-3 px-4 rounded-xl border transition-all ${inputMethod === 'youtube' ? 'bg-red-500/10 border-red-500 text-red-400' : 'bg-dark-900 border-white/5 text-dark-400 hover:border-white/20'}`}
                      onClick={() => setInputMethod('youtube')}
                    >
                      <FaYoutube className="inline mr-2" /> YouTube Link
                    </button>
                    <button
                      type="button"
                      className={`flex-1 py-3 px-4 rounded-xl border transition-all ${inputMethod === 'upload' ? 'bg-primary-500/10 border-primary-500 text-primary-400' : 'bg-dark-900 border-white/5 text-dark-400 hover:border-white/20'}`}
                      onClick={() => setInputMethod('upload')}
                    >
                      <FaUpload className="inline mr-2" /> Local File
                    </button>
                  </div>

                  {inputMethod === 'youtube' ? (
                    <input
                      type="text"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      className="w-full bg-dark-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-accent/50"
                    />
                  ) : (
                    <div className="w-full border-2 border-dashed border-white/10 rounded-xl p-6 text-center hover:border-accent/40 transition-colors bg-dark-900/30">
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => setUploadedVideo(e.target.files[0])}
                        className="hidden"
                        id="video-upload"
                      />
                      <label htmlFor="video-upload" className="cursor-pointer flex flex-col items-center gap-2">
                        <FaUpload className="text-2xl text-dark-400" />
                        <span className="text-sm font-medium text-dark-300">
                          {uploadedVideo ? uploadedVideo.name : 'Click to browse or drag & drop'}
                        </span>
                      </label>
                    </div>
                  )}
                </div>

                {/* Step 2: Output Type & Language */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <span className="w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs">2</span>
                    Select AI Output
                  </div>
                  <div className="flex gap-2 mb-4">
                    <button
                      type="button"
                      className={`flex-1 py-3 px-4 rounded-xl border transition-all ${videoType === 'clip' ? 'bg-accent-2/10 border-accent-2 text-accent-2' : 'bg-dark-900 border-white/5 text-dark-400 hover:border-white/20'}`}
                      onClick={() => setVideoType('clip')}
                    >
                      <FaCut className="inline mr-2" /> Viral AI Clips
                    </button>
                    <button
                      type="button"
                      className={`flex-1 py-3 px-4 rounded-xl border transition-all ${videoType === 'full' ? 'bg-accent/10 border-accent text-accent' : 'bg-dark-900 border-white/5 text-dark-400 hover:border-white/20'}`}
                      onClick={() => setVideoType('full')}
                    >
                      <FaLanguage className="inline mr-2" /> Dub Translation
                    </button>
                  </div>

                  {videoType === 'full' && (
                    <div className="bg-dark-900/50 border border-white/10 rounded-xl p-4">
                      <label className="block text-xs text-dark-400 font-medium uppercase tracking-wider mb-2">Target Language</label>
                      <select
                        className="w-full bg-dark-800 border-none outline-none text-white font-medium p-2 rounded-lg cursor-pointer"
                        value={targetLanguage}
                        onChange={(e) => setTargetLanguage(e.target.value)}
                      >
                        <option value="hindi">🇮🇳 Hindi</option>
                        <option value="english">🇺🇸 English</option>
                        <option value="spanish">🇪🇸 Spanish</option>
                        <option value="french">🇫🇷 French</option>
                        <option value="german">🇩🇪 German</option>
                        <option value="japanese">🇯🇵 Japanese</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Area */}
              <div className="flex flex-col items-center pt-6 border-t border-white/5">
                {processingState.error && <p className="message-pill error w-full text-center">{processingState.error}</p>}
                {processingState.success && <p className="message-pill success w-full text-center">✨ Magic started! Redirecting to Dashboard...</p>}

                <button
                  className="gradient-btn-primary w-full md:w-auto md:px-12 md:py-4 text-lg mt-4"
                  type="button"
                  disabled={processingState.loading || processingState.success}
                  onClick={async () => {
                    if (inputMethod === 'upload' && !uploadedVideo) {
                      setProcessingState({ loading: false, success: false, error: 'Please upload a video file' }); return;
                    }
                    if (inputMethod === 'youtube' && !youtubeUrl) {
                      setProcessingState({ loading: false, success: false, error: 'Please enter a YouTube URL' }); return;
                    }

                    setProcessingState({ loading: true, success: false, error: null });

                    try {
                      const formData = new FormData();
                      if (inputMethod === 'upload') formData.append('video_file', uploadedVideo);
                      else formData.append('youtube_url', youtubeUrl);

                      formData.append('processing_type', videoType === 'full' ? 'full_video' : 'clips');
                      formData.append('target_language', targetLanguage);

                      const platforms = publishPlatform === 'all' ? ['youtube', 'other'] : [publishPlatform];
                      formData.append('publish_platforms', JSON.stringify(platforms));

                      const response = await fetch(`${API_BASE}/api/process-video`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
                        body: formData
                      });

                      const data = await response.json();
                      if (!response.ok) throw new Error(data.error || 'Failed to start processing');

                      setProcessingState({ loading: false, success: true, error: null });
                      setTimeout(() => navigate('/dashboard'), 2000);
                    } catch (err) {
                      setProcessingState({ loading: false, success: false, error: err.message });
                    }
                  }}
                >
                  {processingState.loading ? (
                    <span className="flex items-center gap-2 justify-center"><FaSpinner className="animate-spin" /> Igniting AI Engine...</span>
                  ) : (
                    <span className="flex items-center gap-2 justify-center"><FaVideo /> Start AI Processing</span>
                  )}
                </button>
              </div>
            </div>

            {/* --- COMPLETED PROJECTS LIBRARY --- */}
            <div className="mt-12 mb-6">
              <h2 className="section-title mb-6">📦 Completed Projects Library</h2>

              {jobs.filter(job => job.status === 'completed').length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {jobs.filter(job => job.status === 'completed').map((job) => (
                    <div key={job.id} className="premium-glass-card p-5 flex flex-col transition-all hover:-translate-y-1 group">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1 pr-4">
                          <h4 className="text-white font-bold text-lg leading-tight mb-1 group-hover:text-accent transition-colors line-clamp-2">
                            {job.title || `Viral Project #${job.id}`}
                          </h4>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-dark-900 border border-white/10 text-xs font-medium text-muted">
                            {job.processing_type === 'clips' ? '✂️ AI Clips' : '🌍 AI Dub'}
                          </span>
                        </div>
                        <div className="w-24 h-16 rounded-lg bg-dark-900 border border-white/5 overflow-hidden flex-shrink-0 relative">
                          {job.thumbnail_url ? (
                            <img src={`${API_BASE}/api/thumbnails/${job.thumbnail_url}`} alt="Thumbnail" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-dark-500 text-2xl">
                              <FaVideo />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                        </div>
                      </div>

                      <div className="mt-auto pt-4 border-t border-white/5 flex gap-3">
                        <button
                          className="flex-1 py-2.5 rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                          type="button"
                          onClick={() => handleDownloadAll(job.id)}
                          disabled={downloadingItems[`${job.id}-all`]}
                        >
                          {downloadingItems[`${job.id}-all`] ? (
                            <><FaSpinner className="animate-spin" /> Downloading...</>
                          ) : (
                            <><FaDownload /> Download {job.processing_type === 'clips' ? 'All' : ''}</>
                          )}
                        </button>

                        <button
                          className="flex-1 py-2.5 rounded-xl border border-pink-500/30 bg-gradient-to-r from-pink-500/10 to-purple-500/10 hover:from-pink-500/20 hover:to-purple-500/20 text-pink-400 font-semibold text-sm transition-all flex items-center justify-center gap-2 group-hover:shadow-[0_0_15px_rgba(236,72,153,0.15)]"
                          type="button"
                          onClick={() => setPublishModalJob(job)}
                        >
                          <FaYoutube /> Publish
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="premium-glass-card p-12 text-center flex flex-col items-center justify-center border-dashed">
                  <div className="w-20 h-20 rounded-2xl bg-dark-900 flex items-center justify-center text-4xl text-dark-500 mb-4 shadow-inner">
                    <FaFolder />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">No Projects Yet</h3>
                  <p className="text-muted max-w-sm mb-6">Your completed magic videos and AI clips will appear here ready to be downloaded and published.</p>
                  <button className="text-accent underline font-medium hover:text-accent-2 transition-colors" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    Start your first project ↑
                  </button>
                </div>
              )}
            </div>

            {/* Edit Options - Brand & Configuration */}
            <div className="premium-glass-card p-8 mb-8">
              <div className="flex items-center gap-3 mb-8 border-b border-white/5 pb-4">
                <FaImage className="text-2xl text-accent-2" />
                <h2 className="text-xl font-bold text-white m-0">Editing & Branding</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Logo Upload */}
                <div>
                  <h3 className="text-sm font-semibold text-dark-300 mb-3 uppercase tracking-wider">Default Brand Logo</h3>
                  <div className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center hover:border-accent-2/40 transition-colors bg-dark-900/40 cursor-pointer flex flex-col items-center justify-center gap-3 h-32">
                    <FaUpload className="text-2xl text-dark-400" />
                    <div>
                      <p className="text-white font-medium text-sm">Drag and Drop</p>
                      <span className="text-dark-500 text-xs">Upload custom brand logo</span>
                    </div>
                  </div>
                </div>

                {/* Settings Grid */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2">Aspect Ratio</label>
                      <select className="w-full bg-dark-900/80 border border-white/5 outline-none text-white text-sm p-3 rounded-lg focus:border-accent/50 transition-colors">
                        <option>9:16 (Reels/Shorts)</option>
                        <option>16:9 (Standard)</option>
                        <option>1:1 (Square)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2">Overlay Style</label>
                      <select className="w-full bg-dark-900/80 border border-white/5 outline-none text-white text-sm p-3 rounded-lg focus:border-accent/50 transition-colors">
                        <option>Modern</option>
                        <option>Classic Bold</option>
                        <option>Minimalist</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2">AI Summary Limit</label>
                      <select className="w-full bg-dark-900/80 border border-white/5 outline-none text-white text-sm p-3 rounded-lg focus:border-accent/50 transition-colors">
                        <option>Short (Quick Hits)</option>
                        <option>Medium (Standard)</option>
                        <option>Detailed (Long)</option>
                      </select>
                    </div>

                    <div className="flex flex-col justify-end pb-1">
                      <div className="flex items-center justify-between bg-dark-900/50 p-3 rounded-lg border border-white/5">
                        <span className="text-sm text-white font-medium">Global Watermark</span>
                        <label className="toggle-switch m-0">
                          <input
                            type="checkbox"
                            checked={watermarkEnabled}
                            onChange={(e) => setWatermarkEnabled(e.target.checked)}
                          />
                          <span className="toggle-slider-switch" />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
                <button className="gradient-btn-primary px-8 py-3 text-sm" type="button">Save Preferences</button>
              </div>
            </div>

            {/* Remove the unused Publish Section card container at the bottom */}
          </div>
        </div>
      </main>

      {/* Publish Modal */}
      {publishModalJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-dark-800 border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-xl font-display font-bold text-white flex items-center gap-2">
                <FaGlobe className="text-primary-500" /> Publish Video
              </h3>
              <button
                onClick={() => setPublishModalJob(null)}
                className="text-dark-400 hover:text-white transition-colors"
                type="button"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar" style={{ maxHeight: '70vh' }}>
              <div>
                <p className="text-sm text-dark-300 mb-2">Selected Video:</p>
                <div className="bg-dark-900/50 p-3 rounded-xl border border-white/5">
                  <p className="text-white font-medium truncate">{publishModalJob.title || `Job #${publishModalJob.id}`}</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-dark-300 font-medium">Select Platforms</p>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setPublishPlatform('youtube')}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${publishPlatform === 'youtube' ? 'bg-red-500/10 border-red-500 text-red-400' : 'bg-dark-900 border-white/5 text-dark-400 hover:border-white/20'}`}
                  >
                    <FaYoutube className="text-2xl mb-2" />
                    <span className="text-xs font-medium">YouTube</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPublishPlatform('instagram')}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${publishPlatform === 'instagram' ? 'bg-pink-500/10 border-pink-500 text-pink-400' : 'bg-dark-900 border-white/5 text-dark-400 hover:border-white/20'}`}
                  >
                    <FaGlobe className="text-2xl mb-2" />
                    <span className="text-xs font-medium">Instagram</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPublishPlatform('all')}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${publishPlatform === 'all' ? 'bg-primary-500/10 border-primary-500 text-primary-400' : 'bg-dark-900 border-white/5 text-dark-400 hover:border-white/20'}`}
                  >
                    <FaGlobe className="text-2xl mb-2" />
                    <span className="text-xs font-medium">All Linked</span>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-sm text-dark-300 font-medium">Video Title</label>
                  <button
                    onClick={handleGenerateAI}
                    disabled={generatingAI}
                    className="text-xs bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white px-3 py-1 rounded-full font-medium transition-all flex items-center gap-1 shadow-lg shadow-purple-500/20 disabled:opacity-50"
                  >
                    {generatingAI ? <FaSpinner className="animate-spin" /> : '✨ Write with AI'}
                  </button>
                </div>
                <div>
                  <input
                    type="text"
                    value={publishMetadata.title}
                    onChange={(e) => setPublishMetadata({ ...publishMetadata, title: e.target.value })}
                    placeholder="Enter an engaging title..."
                    className="w-full bg-dark-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  />
                </div>

                <div>
                  <label className="block text-sm text-dark-300 font-medium mb-1.5">Description</label>
                  <textarea
                    value={publishMetadata.description}
                    onChange={(e) => setPublishMetadata({ ...publishMetadata, description: e.target.value })}
                    placeholder="Tell viewers about your video..."
                    rows={3}
                    className="w-full bg-dark-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-dark-300 font-medium mb-1.5">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={publishMetadata.tags}
                    onChange={(e) => setPublishMetadata({ ...publishMetadata, tags: e.target.value })}
                    placeholder="ai, startup, tech..."
                    className="w-full bg-dark-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-white/5 flex justify-end gap-3 bg-dark-800/80">
              <button
                type="button"
                onClick={() => setPublishModalJob(null)}
                className="px-5 py-2.5 rounded-xl font-medium text-dark-300 hover:bg-white/5 transition-colors"
                disabled={publishing}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePublishSubmit}
                disabled={publishing || !publishMetadata.title}
                className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white rounded-xl font-semibold transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {publishing ? (
                  <><FaSpinner className="animate-spin" /> Publishing...</>
                ) : (
                  <><FaUpload /> Publish Now</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


export default ProjectSettings
