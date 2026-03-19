import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  FaChartLine,
  FaCog,
  FaFolder,
  FaQuestionCircle,
  FaSignOutAlt,
  FaImages,
  FaVideo,
  FaDownload,
  FaHistory,
  FaSpinner,
  FaCheck,
  FaTimes,
  FaTrash
} from 'react-icons/fa'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import '../index.css'

function AIGenerator() {
  const navigate = useNavigate()
  const { user, logout, token } = useAuth()
  
  // Tab state
  const [activeTab, setActiveTab] = useState('generate') // 'generate' or 'history'
  
  // Image generation state
  const [imagePrompt, setImagePrompt] = useState('')
  const [imageSize, setImageSize] = useState('1024x1024')
  const [imageQuality, setImageQuality] = useState('auto')
  const [imageLoading, setImageLoading] = useState(false)
  const [generatedImage, setGeneratedImage] = useState(null)
  
  // Video generation state
  const [videoPrompt, setVideoPrompt] = useState('')
  const [videoDuration, setVideoDuration] = useState(4)
  const [videoLoading, setVideoLoading] = useState(false)
  const [generatedVideo, setGeneratedVideo] = useState(null)
  
  // History state
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyFilter, setHistoryFilter] = useState('all') // 'all', 'image', 'video'
  
  // UI state
  const [selectedGenTab, setSelectedGenTab] = useState('image') // 'image' or 'video'
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const sidePrimaryItems = [
    { label: 'Dashboard', icon: '▦', path: '/dashboard' },
    { label: 'My Projects', icon: '◫', path: '/settings' },
    { label: 'AI Generator', icon: '✨', path: '/ai-generator', active: true },
    { label: 'Integrations', icon: '◌', path: '/integrations' },
  ]

  const sideSecondaryItems = [
    { label: 'Analytics', icon: <FaChartLine />, path: '/analytics' },
    { label: 'Pricing & Plan', icon: <FaFolder />, path: '/pricing' },
    { label: 'Profile Settings', icon: <FaCog />, path: '/profile' },
    { label: 'Support & Docs', icon: <FaQuestionCircle />, path: '/support-docs' },
  ]

  // Fetch generation history
  const fetchHistory = async () => {
    try {
      setHistoryLoading(true)
      const accessToken = token || localStorage.getItem('access_token')
      const typeParam = historyFilter !== 'all' ? `?type=${historyFilter}` : ''
      
      const response = await axios.get(`${API_BASE}/api/ai/history${typeParam}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      
      setHistory(response.data.generations || [])
    } catch (err) {
      console.error('Failed to fetch history:', err)
      setErrorMessage('Failed to load generation history')
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory()
    }
  }, [activeTab, historyFilter])

  // Generate image
  const handleGenerateImage = async (e) => {
    e.preventDefault()
    
    if (!imagePrompt.trim()) {
      setErrorMessage('Please enter an image prompt')
      setTimeout(() => setErrorMessage(''), 4000)
      return
    }

    setImageLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const accessToken = token || localStorage.getItem('access_token')
      
      const response = await axios.post(`${API_BASE}/api/ai/generate-image`, {
        prompt: imagePrompt,
        size: imageSize,
        quality: imageQuality
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })

      if (response.data.success) {
        setGeneratedImage(response.data.generation)
        setImagePrompt('')
        setSuccessMessage('Image generated successfully! 🎉')
        setTimeout(() => setSuccessMessage(''), 4000)
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to generate image'
      setErrorMessage(errorMsg)
      console.error('Image generation error:', err)
    } finally {
      setImageLoading(false)
    }
  }

  // Generate video
  const handleGenerateVideo = async (e) => {
    e.preventDefault()
    
    if (!videoPrompt.trim()) {
      setErrorMessage('Please enter a video prompt')
      setTimeout(() => setErrorMessage(''), 4000)
      return
    }

    setVideoLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const accessToken = token || localStorage.getItem('access_token')
      
      const response = await axios.post(`${API_BASE}/api/ai/generate-video`, {
        prompt: videoPrompt,
        duration: parseInt(videoDuration)
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })

      if (response.data.success) {
        setGeneratedVideo(response.data.generation)
        setVideoPrompt('')
        setSuccessMessage('Video generated successfully! 🎉')
        setTimeout(() => setSuccessMessage(''), 4000)
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to generate video'
      setErrorMessage(errorMsg)
      console.error('Video generation error:', err)
    } finally {
      setVideoLoading(false)
    }
  }

  // Download file
  const handleDownload = (url, name) => {
    const link = document.createElement('a')
    link.href = url
    link.target = '_blank'
    link.download = name || 'generated'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Delete generation
  const handleDelete = async (generationId) => {
    if (!window.confirm('Are you sure you want to delete this generation?')) return

    try {
      const accessToken = token || localStorage.getItem('access_token')
      
      await axios.delete(`${API_BASE}/api/ai/${generationId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })

      setHistory(history.filter(h => h.id !== generationId))
      setSuccessMessage('Generation deleted')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      setErrorMessage('Failed to delete generation')
      console.error('Delete error:', err)
    }
  }

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      {/* SIDEBAR */}
      <motion.div
        className="w-64 bg-gray-800 border-r border-gray-700 p-6 flex flex-col overflow-y-auto"
        initial={{ x: -256 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* LOGO & TITLE */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent flex items-center gap-2">
            <span className="text-3xl">✨</span> Locaa AI
          </h1>
          <p className="text-xs text-gray-400 mt-2">AI Generator Studio</p>
        </div>

        {/* USER PROFILE */}
        {user && (
          <div className="bg-gray-700/50 rounded-lg p-4 mb-6 border border-gray-600">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                {user.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user.email}</p>
                <p className="text-xs text-gray-400">{user.subscription_tier || 'Free'}</p>
              </div>
            </div>
          </div>
        )}

        {/* MAIN MENU */}
        <div className="mb-8">
          <p className="text-xs uppercase text-gray-400 font-semibold mb-3 tracking-wider">MAIN MENU</p>
          <nav className="space-y-2">
            {sidePrimaryItems.map((item, i) => (
              <motion.button
                key={i}
                onClick={() => navigate(item.path)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all font-medium text-sm flex items-center gap-3 ${
                  item.active
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-400/30'
                    : 'text-gray-300 hover:bg-gray-700/50'
                }`}
                whileHover={{ x: 4 }}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </motion.button>
            ))}
          </nav>
        </div>

        {/* PREFERENCES */}
        <div className="mb-8">
          <p className="text-xs uppercase text-gray-400 font-semibold mb-3 tracking-wider">PREFERENCES</p>
          <nav className="space-y-2">
            {sideSecondaryItems.map((item, i) => (
              <motion.button
                key={i}
                onClick={() => navigate(item.path)}
                className="w-full text-left px-4 py-2 rounded-lg transition-all text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 flex items-center gap-3 text-sm"
                whileHover={{ x: 4 }}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </motion.button>
            ))}
          </nav>
        </div>

        {/* LOGOUT */}
        <motion.button
          onClick={handleLogout}
          className="w-full mt-auto px-4 py-3 rounded-lg transition-all text-gray-400 hover:text-red-400 hover:bg-red-500/10 flex items-center gap-3 text-sm font-medium border border-gray-600 hover:border-red-400/30"
          whileHover={{ scale: 1.02 }}
        >
          <FaSignOutAlt />
          <span>Logout</span>
        </motion.button>
      </motion.div>

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-6xl mx-auto">
          {/* HEADER */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            <h2 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <FaImages className="text-blue-400" />
              AI Generator Studio
            </h2>
            <p className="text-gray-400">Generate stunning AI images and videos with powerful prompts</p>
          </motion.div>

          {/* TABS */}
          <div className="flex gap-4 mb-8 border-b border-gray-700">
            <motion.button
              onClick={() => setActiveTab('generate')}
              className={`pb-3 px-2 font-semibold transition-all ${
                activeTab === 'generate'
                  ? 'border-b-2 border-blue-400 text-blue-400'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              whileHover={{ y: -2 }}
            >
              ✨ Generate
            </motion.button>
            <motion.button
              onClick={() => setActiveTab('history')}
              className={`pb-3 px-2 font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'history'
                  ? 'border-b-2 border-blue-400 text-blue-400'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              whileHover={{ y: -2 }}
            >
              <FaHistory /> History
            </motion.button>
          </div>

          {/* MESSAGES */}
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-500/20 border border-green-400/30 text-green-400 px-4 py-3 rounded-lg mb-6 flex items-center gap-2"
            >
              <FaCheck /> {successMessage}
            </motion.div>
          )}
          
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/20 border border-red-400/30 text-red-400 px-4 py-3 rounded-lg mb-6 flex items-center gap-2"
            >
              <FaTimes /> {errorMessage}
            </motion.div>
          )}

          {/* GENERATE TAB */}
          {activeTab === 'generate' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              {/* IMAGE GENERATION */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 backdrop-blur">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-700">
                  <FaImages className="text-blue-400 text-2xl" />
                  <h3 className="text-xl font-bold">Generate Image</h3>
                </div>

                <form onSubmit={handleGenerateImage} className="space-y-4">
                  {/* PROMPT */}
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-300">
                      Image Prompt
                    </label>
                    <textarea
                      value={imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
                      placeholder="Describe the image you want to generate... (e.g., 'A futuristic robot painting')"
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 resize-none h-24"
                    />
                    <p className="text-xs text-gray-400 mt-1">{imagePrompt.length}/4000 characters</p>
                  </div>

                  {/* SIZE */}
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-300">
                      Image Size
                    </label>
                    <select
                      value={imageSize}
                      onChange={(e) => setImageSize(e.target.value)}
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-400"
                    >
                      <option value="1024x1024">1024x1024</option>
                      <option value="1792x1024">1792x1024 (Landscape)</option>
                      <option value="1024x1792">1024x1792 (Portrait)</option>
                    </select>
                  </div>

                  {/* QUALITY */}
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-300">
                      Quality
                    </label>
                    <select
                      value={imageQuality}
                      onChange={(e) => setImageQuality(e.target.value)}
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-400"
                    >
                      <option value="auto">Auto</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  {/* SUBMIT */}
                  <motion.button
                    type="submit"
                    disabled={imageLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    {imageLoading ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FaImages /> Generate Image
                      </>
                    )}
                  </motion.button>
                </form>

                {/* GENERATED IMAGE */}
                {generatedImage && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 pt-6 border-t border-gray-700"
                  >
                    <p className="text-sm font-semibold text-gray-300 mb-3">Generated Image</p>
                    <img
                      src={generatedImage.url}
                      alt="Generated"
                      className="w-full rounded-lg border border-gray-600 mb-3 hover:border-blue-400 transition-all"
                    />
                    <p className="text-xs text-gray-400 mb-3">
                      Generated in {generatedImage.generation_time_ms}ms
                    </p>
                    <motion.button
                      onClick={() => handleDownload(generatedImage.url, `image-${generatedImage.id}.png`)}
                      whileHover={{ scale: 1.02 }}
                      className="w-full bg-teal-500/20 hover:bg-teal-500/30 border border-teal-400/30 text-teal-400 font-semibold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                      <FaDownload /> Download Image
                    </motion.button>
                  </motion.div>
                )}
              </div>

              {/* VIDEO GENERATION */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 backdrop-blur">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-700">
                  <FaVideo className="text-purple-400 text-2xl" />
                  <h3 className="text-xl font-bold">Generate Video</h3>
                </div>

                <form onSubmit={handleGenerateVideo} className="space-y-4">
                  {/* PROMPT */}
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-300">
                      Video Prompt
                    </label>
                    <textarea
                      value={videoPrompt}
                      onChange={(e) => setVideoPrompt(e.target.value)}
                      placeholder="Describe the video you want to generate... (e.g., 'A robot dancing in space')"
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 resize-none h-24"
                    />
                    <p className="text-xs text-gray-400 mt-1">{videoPrompt.length}/500 characters</p>
                  </div>

                  {/* DURATION */}
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-300">
                      Duration (Seconds): {videoDuration}s
                    </label>
                    <input
                      type="range"
                      min="4"
                      max="30"
                      value={videoDuration}
                      onChange={(e) => setVideoDuration(e.target.value)}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <p className="text-xs text-gray-400 mt-2">Min: 4s | Max: 30s</p>
                  </div>

                  {/* SUBMIT */}
                  <motion.button
                    type="submit"
                    disabled={videoLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    {videoLoading ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        Generating (this may take a minute)...
                      </>
                    ) : (
                      <>
                        <FaVideo /> Generate Video
                      </>
                    )}
                  </motion.button>
                </form>

                {/* GENERATED VIDEO */}
                {generatedVideo && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 pt-6 border-t border-gray-700"
                  >
                    <p className="text-sm font-semibold text-gray-300 mb-3">Generated Video</p>
                    <video
                      src={generatedVideo.url}
                      controls
                      className="w-full rounded-lg border border-gray-600 mb-3 hover:border-purple-400 transition-all"
                    />
                    <p className="text-xs text-gray-400 mb-3">
                      Generated in {generatedVideo.generation_time_ms}ms
                    </p>
                    <motion.button
                      onClick={() => handleDownload(generatedVideo.url, `video-${generatedVideo.id}.mp4`)}
                      whileHover={{ scale: 1.02 }}
                      className="w-full bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 text-purple-400 font-semibold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                      <FaDownload /> Download Video
                    </motion.button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* HISTORY TAB */}
          {activeTab === 'history' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {/* FILTER */}
              <div className="flex gap-4 mb-6">
                <motion.button
                  onClick={() => setHistoryFilter('all')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    historyFilter === 'all'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  whileHover={{ scale: 1.05 }}
                >
                  All
                </motion.button>
                <motion.button
                  onClick={() => setHistoryFilter('image')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                    historyFilter === 'image'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  whileHover={{ scale: 1.05 }}
                >
                  <FaImages /> Images
                </motion.button>
                <motion.button
                  onClick={() => setHistoryFilter('video')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                    historyFilter === 'video'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  whileHover={{ scale: 1.05 }}
                >
                  <FaVideo /> Videos
                </motion.button>
              </div>

              {/* HISTORY LIST */}
              {historyLoading ? (
                <div className="flex items-center justify-center py-12">
                  <FaSpinner className="animate-spin text-4xl text-blue-400" />
                </div>
              ) : history.length === 0 ? (
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8 text-center">
                  <p className="text-gray-400 text-lg">No generations yet. Start creating! ✨</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {history.map((gen) => (
                    <motion.div
                      key={gen.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 overflow-hidden hover:border-blue-400/50 transition-all"
                    >
                      {/* THUMBNAIL */}
                      {gen.type === 'image' ? (
                        <img
                          src={gen.url}
                          alt={gen.prompt}
                          className="w-full h-32 object-cover rounded-lg mb-3"
                        />
                      ) : (
                        <video
                          src={gen.url}
                          className="w-full h-32 object-cover rounded-lg mb-3"
                        />
                      )}

                      {/* INFO */}
                      <div className="mb-3">
                        <p className="text-xs uppercase font-bold text-gray-400 mb-1">
                          {gen.type === 'image' ? '🖼️ Image' : '🎬 Video'}
                        </p>
                        <p className="text-sm text-gray-300 line-clamp-2">{gen.prompt}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(gen.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      {/* ACTIONS */}
                      <div className="flex gap-2">
                        <motion.button
                          onClick={() => handleDownload(gen.url, `${gen.type}-${gen.id}`)}
                          whileHover={{ scale: 1.05 }}
                          className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 text-blue-400 text-xs font-semibold py-2 rounded-lg transition-all flex items-center justify-center gap-1"
                        >
                          <FaDownload className="text-xs" /> Download
                        </motion.button>
                        <motion.button
                          onClick={() => handleDelete(gen.id)}
                          whileHover={{ scale: 1.05 }}
                          className="flex-1 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 text-red-400 text-xs font-semibold py-2 rounded-lg transition-all flex items-center justify-center gap-1"
                        >
                          <FaTrash className="text-xs" /> Delete
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AIGenerator
