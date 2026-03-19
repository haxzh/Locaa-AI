import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import {
  FaBell, FaChartLine, FaCloudUploadAlt, FaCog, FaFileUpload,
  FaFolder, FaKey, FaPause, FaPlay, FaQuestionCircle,
  FaSearch, FaSignOutAlt, FaStepBackward, FaStepForward,
  FaLayerGroup, FaUpload, FaGlobe, FaPaintBrush, FaSpinner
} from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { PremiumDevicePreview, SignalPill } from './PremiumVisuals'
import '../index.css'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

const defaultSettings = {
  aspect_ratio: '16:9',
  summary_length: 'Short/Detailed',
  text_overlay_font: 'Font',
  text_style_primary: 'Modern/Classic',
  text_style_secondary: 'Modern/Classic/Glow',
  transition_style: 'Fade/Zoom/Slide',
  logo_placement: 'Top-Left',
  logo_opacity: 70,
  ai_clip_sensitivity: 80,
  noise_reduction: true,
  logo_path: '',
  brand_label: 'Locaa AI',
}

function BrandingStudio() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const fileInputRef = useRef(null)

  const [settings, setSettings] = useState(defaultSettings)
  const [jobs, setJobs] = useState([])
  const [activeProjectId, setActiveProjectId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [presetLoading, setPresetLoading] = useState(false)
  const [presets, setPresets] = useState([])
  const [message, setMessage] = useState(null)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const sidePrimaryItems = [
    { label: 'Dashboard', icon: '▦', path: '/dashboard' },
    { label: 'My Projects', icon: '◫', path: '/settings' },
    // { label: 'Clip Maker', icon: '✂', path: '/settings' },
    { label: 'Logo & Branding', icon: '✎', path: '/branding', active: true },
    // { label: 'Upload Manager', icon: '⤴', path: '/dashboard' },
    { label: 'Team Collab', icon: '⎈', path: '/team-collaboration' },
    { label: 'Integrations', icon: '◌', path: '/integrations' },
  ]

  const sideSecondaryItems = [
    { label: 'Analytics', icon: <FaChartLine />, path: '/analytics' },
    { label: 'Pricing & Plan', icon: <FaFolder />, path: '/pricing' },
    { label: 'Profile Settings', icon: <FaCog />, path: '/profile' },
    { label: 'Support & Docs', icon: <FaQuestionCircle />, path: '/support-docs' },
    { label: 'API Access', icon: <FaKey />, meta: 'For devs', path: '/profile?tab=security' },
  ]

  const teamMembers = [
    { name: 'Admin', email: 'admin@locaa.ai', role: 'Admin', avatar: 'A' },
    { name: 'Editor', role: 'Editor', avatar: 'E' },
  ]

  const activeProject = useMemo(
    () => jobs.find((job) => String(job.id) === String(activeProjectId)) || null,
    [jobs, activeProjectId]
  )

  const projectType = activeProject?.processing_type === 'full_video' ? 'full_video' : 'clips'
  const clipControlsDisabled = projectType === 'full_video'

  const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('access_token')}` })

  const loadJobs = async () => {
    const response = await axios.get(`${API_BASE}/api/jobs`, { headers: authHeaders() })
    const list = Array.isArray(response.data) ? response.data : []
    setJobs(list)
    if (!activeProjectId && list.length > 0) {
      setActiveProjectId(list[0].id)
    }
  }

  const loadSettings = async (nextProjectType) => {
    const response = await axios.get(`${API_BASE}/api/branding-config`, {
      headers: authHeaders(),
      params: { project_type: nextProjectType },
    })
    setSettings({ ...defaultSettings, ...(response.data?.config || {}) })
  }

  const loadPresets = async (nextProjectType) => {
    const response = await axios.get(`${API_BASE}/api/branding-config/presets`, {
      headers: authHeaders(),
      params: { project_type: nextProjectType },
    })
    setPresets(Array.isArray(response.data) ? response.data : [])
  }

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true)
        await loadJobs()
      } catch (error) {
        setMessage({ type: 'error', text: error?.response?.data?.error || 'Failed to load projects.' })
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  useEffect(() => {
    if (!localStorage.getItem('access_token')) {
      return
    }

    const syncSettings = async () => {
      try {
        await Promise.all([loadSettings(projectType), loadPresets(projectType)])
      } catch (error) {
        setMessage({ type: 'error', text: error?.response?.data?.error || 'Failed to load branding settings.' })
      }
    }

    syncSettings()
  }, [projectType])

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const saveSettings = async () => {
    try {
      setSaving(true)
      setMessage(null)
      await axios.put(
        `${API_BASE}/api/branding-config`,
        {
          project_type: projectType,
          config: settings,
        },
        { headers: authHeaders() }
      )
      setMessage({ type: 'success', text: `Settings saved for ${projectType} projects.` })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage({ type: 'error', text: error?.response?.data?.error || 'Failed to save settings.' })
    } finally {
      setSaving(false)
    }
  }

  const applyPreset = async (presetName) => {
    try {
      setPresetLoading(true)
      setMessage(null)
      const response = await axios.post(
        `${API_BASE}/api/branding-config/apply-preset`,
        {
          project_type: projectType,
          preset_name: presetName,
        },
        { headers: authHeaders() }
      )
      const nextConfig = response.data?.config || defaultSettings
      setSettings({ ...defaultSettings, ...nextConfig })
      setMessage({ type: 'success', text: `${presetName} preset applied to ${projectType}.` })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage({ type: 'error', text: error?.response?.data?.error || 'Failed to apply preset.' })
    } finally {
      setPresetLoading(false)
    }
  }

  const uploadLogo = async (file) => {
    const formData = new FormData()
    formData.append('file', file)

    try {
      setMessage(null)
      const response = await axios.post(`${API_BASE}/api/upload-logo`, formData, {
        headers: {
          ...authHeaders(),
          'Content-Type': 'multipart/form-data',
        },
      })
      updateSetting('logo_path', response.data?.logo_path || '')
      setMessage({ type: 'success', text: 'Logo uploaded successfully. Save settings to apply globally.' })
      setTimeout(() => setMessage(null), 4000)
    } catch (error) {
      setMessage({ type: 'error', text: error?.response?.data?.error || 'Logo upload failed.' })
    }
  }

  const onLogoFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file.' })
      return
    }
    uploadLogo(file)
  }

  const SidebarItem = ({ item }) => {
    const isActive = location.pathname === item.path || item.active
    return (
      <button
        onClick={() => navigate(item.path)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${isActive
          ? 'bg-gradient-to-r from-primary-500/20 to-blue-500/10 text-primary-400 font-semibold border border-primary-500/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]'
          : 'text-dark-400 hover:text-dark-50 hover:bg-white/5 border border-transparent'
          }`}
      >
        <span className={`text-lg ${isActive ? 'text-primary-400' : 'text-dark-500'}`}>{item.icon}</span>
        <span>{item.label}</span>
      </button>
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  }
  const brandingSignals = ['Brand consistency', 'Preset-driven output', 'Team-ready visual system']

  return (
    <div className="min-h-screen flex bg-dark-900 text-dark-50 font-sans overflow-hidden">
      {/* Sidebar background effects */}
      <div className="fixed top-0 left-0 w-64 h-full bg-dark-900 border-r border-white/10 z-20 flex flex-col hidden lg:flex">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary-900/10 to-transparent pointer-events-none"></div>

        <div className="p-6 flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary-500/30 ring-2 ring-white/10">
            L
          </div>
          <span className="text-2xl font-display font-bold text-white tracking-wide">Locaa AI</span>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1 relative z-10 custom-scrollbar">
          <div className="text-xs font-semibold text-dark-500 uppercase tracking-wider mb-2 px-4 mt-4">Menu</div>
          {sidePrimaryItems.map((item, idx) => <SidebarItem key={idx} item={item} />)}

          <div className="mt-8 mb-2">
            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent w-full"></div>
          </div>

          <div className="text-xs font-semibold text-dark-500 uppercase tracking-wider mb-2 px-4 mt-6">Settings</div>
          {sideSecondaryItems.map((item, idx) => <SidebarItem key={idx} item={item} />)}
        </div>

        <div className="p-6 relative z-10">
          <div className="glass-panel p-4 bg-dark-800/50 border border-primary-500/20 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-primary-500/20 blur-xl rounded-full"></div>
            <h4 className="text-white font-semibold mb-1 relative z-10">Pro Plan</h4>
            <p className="text-dark-400 text-xs mb-3 relative z-10">5/20 Videos this month</p>
            <div className="w-full bg-dark-900 rounded-full h-2 mb-3 border border-white/5">
              <div className="bg-gradient-to-r from-primary-500 to-blue-500 h-2 rounded-full" style={{ width: '25%' }}></div>
            </div>
            <button className="w-full py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-colors border border-white/10">
              Upgrade Now
            </button>
          </div>
        </div>
      </div>

      <main className="flex-1 lg:ml-64 flex flex-col h-screen relative">
        {/* Main Background Ambient */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-500/5 rounded-full mix-blend-screen filter blur-[150px] pointer-events-none" />

        {/* Header */}
        <header className="h-20 border-b border-white/10 flex items-center justify-between px-8 bg-dark-900/80 backdrop-blur-xl sticky top-0 z-10">
          <h1 className="text-2xl font-display font-bold text-white">Advanced Branding Studio</h1>

          <div className="flex items-center gap-6">
            <div className="relative group hidden md:block">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-500 group-focus-within:text-primary-400 transition-colors" />
              <input
                type="text"
                placeholder="Search..."
                className="w-64 bg-dark-800/50 border border-white/10 rounded-full py-2.5 pl-11 pr-4 text-sm text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
              />
            </div>

            <button className="w-10 h-10 rounded-full bg-dark-800/50 border border-white/10 flex items-center justify-center text-dark-400 hover:text-white hover:bg-white/5 transition-all relative">
              <FaBell />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            <div className="h-8 w-px bg-white/10"></div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-white leading-tight">{user?.username || 'Amit Mishra'}</p>
                <p className="text-xs text-primary-400">Pro Creator</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-600 to-blue-600 flex items-center justify-center text-white font-bold ring-2 ring-white/10 cursor-pointer overflow-hidden">
                {user?.username?.[0] || 'A'}
              </div>
              <button
                onClick={handleLogout}
                className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center text-dark-500 hover:text-red-400 hover:bg-dark-800 transition-all ml-1"
                title="Logout"
              >
                <FaSignOutAlt />
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative z-0">
          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium shadow-lg max-w-5xl mx-auto ${message.type === 'error'
                  ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                  : 'bg-green-500/10 border border-green-500/20 text-green-400'
                  }`}
              >
                {message.type === 'error' ? '⚠️' : '✅'} {message.text}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="max-w-5xl mx-auto space-y-8"
          >
            {/* Header Row */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 xl:grid-cols-[1.05fr_0.95fr] gap-6 items-center">
              <div className="rounded-[2rem] border border-white/10 bg-dark-800/25 p-8 backdrop-blur-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-52 h-52 bg-indigo-500/10 rounded-full blur-[80px]" />
                <div className="relative z-10">
                  <div className="flex flex-wrap gap-2 mb-5">
                    {brandingSignals.map((item, index) => <SignalPill key={item} tone={index === 0 ? 'primary' : index === 1 ? 'blue' : 'default'}>{item}</SignalPill>)}
                  </div>
                  <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-3">Advanced branding system for every generated asset</h2>
                  <p className="text-dark-400 leading-relaxed max-w-2xl mb-6">Control how your clips, full-video dubs, overlays, logos, and presets appear across every output so the entire startup brand looks intentional.</p>
                  <div className="flex items-center gap-3 bg-dark-900 w-fit px-4 py-2 rounded-xl border border-white/10">
                    <span className="text-sm font-medium text-dark-400">Active Project:</span>
                    <select
                      className="bg-transparent text-white text-sm font-semibold focus:outline-none appearance-none cursor-pointer pr-4"
                      value={activeProjectId}
                      onChange={(e) => setActiveProjectId(e.target.value)}
                      disabled={loading || jobs.length === 0}
                    >
                      {jobs.length === 0 ? <option value="">No jobs yet</option> : null}
                      {jobs.map((job) => (
                        <option key={job.id} value={job.id} className="bg-dark-900">
                          {job.title || `Job #${job.id}`} ({job.processing_type || 'clips'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <PremiumDevicePreview
                title="Brand Preview"
                subtitle="Overlay and motion styling"
                accent="violet"
                items={[
                  { label: 'Logo placement', value: settings.logo_placement || 'Top-Left', progress: '78%' },
                  { label: 'Overlay style', value: settings.text_style_primary || 'Modern', progress: '62%' },
                  { label: 'Clip sensitivity', value: `${settings.ai_clip_sensitivity}%`, progress: `${settings.ai_clip_sensitivity}%` },
                ]}
              />
            </motion.div>

            {/* Presets Row */}
            <motion.div variants={itemVariants} className="glass-panel p-6 bg-dark-800/40 border border-white/5 rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-lg font-display font-bold text-white mb-1">One-Click Project Presets</h3>
                <p className="text-sm text-dark-400">Current mode: <span className="font-semibold text-primary-400">{projectType === 'full_video' ? 'Full Video' : 'Clips'}</span></p>
              </div>
              <div className="flex flex-wrap gap-3">
                {presets.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    disabled={presetLoading}
                    onClick={() => applyPreset(preset.name)}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-dark-800 to-dark-900 border border-white/10 hover:border-primary-500/50 text-white font-medium text-sm transition-all shadow-[0_4px_10px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_15px_rgba(14,165,164,0.2)]"
                  >
                    {preset.name}
                  </button>
                ))}
                {presets.length === 0 && <span className="text-sm text-dark-500 italic">No presets available</span>}
              </div>
            </motion.div>

            {/* Main Settings Grid */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-8">
                {/* Brand Logo Upload */}
                <div className="glass-panel p-6 bg-dark-800/40 border border-white/5 rounded-2xl shadow-xl">
                  <h3 className="text-lg font-display font-bold text-white mb-6 flex items-center gap-2">
                    Default Brand Logo
                  </h3>

                  <button
                    type="button"
                    className="w-full flex justify-between items-center bg-dark-900 border-2 border-dashed border-white/10 hover:border-primary-500/50 hover:bg-white/5 rounded-xl p-6 transition-all group"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary-500/10 flex items-center justify-center text-primary-400 group-hover:scale-110 transition-transform">
                        <FaCloudUploadAlt className="text-2xl" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-white">{settings.logo_path ? 'Logo Uploaded ✅' : 'Drag & Drop Logo'}</p>
                        <p className="text-xs text-dark-400">SVG, PNG, JPG (Max 5MB)</p>
                      </div>
                    </div>
                    <div className="text-primary-400 text-sm font-semibold px-4 py-2 rounded-lg bg-primary-500/10 border border-primary-500/20">
                      Browse
                    </div>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={onLogoFileChange}
                  />

                  <div className="mt-8 space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-2">Logo Placement</label>
                      <select
                        className="w-full bg-dark-900 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary-500 transition-all outline-none"
                        value={settings.logo_placement}
                        onChange={(e) => updateSetting('logo_placement', e.target.value)}
                      >
                        <option>Top-Left</option>
                        <option>Top-Right</option>
                        <option>Bottom-Left</option>
                        <option>Bottom-Right</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-dark-300">Logo Opacity</label>
                        <span className="text-xs font-bold text-primary-400">{settings.logo_opacity}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={settings.logo_opacity}
                        onChange={(e) => updateSetting('logo_opacity', Number(e.target.value))}
                        className="w-full h-2 bg-dark-900 rounded-lg appearance-none cursor-pointer accent-primary-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                {/* Styling & Layout */}
                <div className="glass-panel p-6 bg-dark-800/40 border border-white/5 rounded-2xl shadow-xl">
                  <h3 className="text-lg font-display font-bold text-white mb-6">Styling & Layout</h3>

                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-dark-300 mb-2">Aspect Ratio</label>
                        <select
                          className="w-full bg-dark-900 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-primary-500/50"
                          value={settings.aspect_ratio}
                          onChange={(e) => updateSetting('aspect_ratio', e.target.value)}
                        >
                          <option>16:9</option>
                          <option>9:16</option>
                          <option>1:1</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-dark-300 mb-2">AI Summary Length</label>
                        <select
                          className="w-full bg-dark-900 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-primary-500/50"
                          value={settings.summary_length}
                          onChange={(e) => updateSetting('summary_length', e.target.value)}
                        >
                          <option>Short/Detailed</option>
                          <option>Medium</option>
                          <option>Long</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-dark-300 mb-2">Primary Text Style</label>
                        <select
                          className="w-full bg-dark-900 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-primary-500/50"
                          value={settings.text_style_primary}
                          onChange={(e) => updateSetting('text_style_primary', e.target.value)}
                        >
                          <option>Modern/Classic</option>
                          <option>Bold/Shadowed</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-dark-300 mb-2">Secondary Text Style</label>
                        <select
                          className="w-full bg-dark-900 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-primary-500/50"
                          value={settings.text_style_secondary}
                          onChange={(e) => updateSetting('text_style_secondary', e.target.value)}
                        >
                          <option>Minimal/Clean</option>
                          <option>Modern/Classic/Glow</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-2">Overlay Font</label>
                      <select
                        className="w-full bg-dark-900 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-primary-500/50"
                        value={settings.text_overlay_font}
                        onChange={(e) => updateSetting('text_overlay_font', e.target.value)}
                      >
                        <option>Font</option>
                        <option>Classic Sans</option>
                        <option>Bold Sans</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-2">Brand Label (Overlay Text)</label>
                      <input
                        type="text"
                        value={settings.brand_label || ''}
                        maxLength={40}
                        onChange={(e) => updateSetting('brand_label', e.target.value)}
                        placeholder="Enter brand text"
                        className="w-full bg-dark-900 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary-500 transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div className="mt-8">
                    <button
                      type="button"
                      className="btn-primary w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(14,165,164,0.3)] hover:shadow-[0_0_30px_rgba(14,165,164,0.5)] transition-shadow"
                      onClick={saveSettings}
                      disabled={saving}
                    >
                      {saving ? <><FaSpinner className="animate-spin" /> Saving...</> : `Save ${projectType === 'full_video' ? 'Full Video' : 'Clip'} Details`}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Advanced Editing Controls */}
            <motion.div variants={itemVariants} className="glass-panel p-6 bg-dark-800/40 border border-white/5 rounded-2xl shadow-xl">
              <h3 className="text-lg font-display font-bold text-white mb-6">Advanced Editing Suite</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Preview Section Placeholder */}
                <div className="bg-dark-900 rounded-xl border border-white/10 aspect-video flex flex-col items-center justify-center relative shadow-inner overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button className="w-16 h-16 rounded-full bg-primary-500/80 text-white flex items-center justify-center text-xl shadow-[0_0_30px_rgba(14,165,164,0.5)] hover:bg-primary-500 transition-colors backdrop-blur-sm z-10 pl-1">
                      <FaPlay />
                    </button>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-dark-900 to-transparent"></div>
                  <div className="w-full h-12 bg-dark-800/80 absolute bottom-0 left-0 flex items-center px-4 gap-2 border-t border-white/10">
                    {/* Filmstrip mock */}
                    <div className="h-8 flex-1 bg-dark-700/50 rounded flex gap-1 overflow-hidden p-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className="flex-1 bg-dark-600/50 rounded-sm"></div>)}
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="space-y-6 flex flex-col justify-center">
                  {clipControlsDisabled && <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 p-3 rounded-lg text-sm mb-2">ℹ️ Clip editing limited in Full Video mode</div>}

                  <div className="p-5 bg-dark-900/50 rounded-xl border border-white/5">
                    <label className="block text-sm font-medium text-dark-300 mb-4">Clip In/Out Setup</label>
                    <div className="flex justify-center gap-4">
                      <button type="button" disabled={clipControlsDisabled} className="w-12 h-12 rounded-full bg-dark-800 border border-white/10 flex items-center justify-center hover:bg-white/5 disabled:opacity-50 transition-colors cursor-pointer">
                        <FaStepBackward />
                      </button>
                      <button type="button" disabled={clipControlsDisabled} className="w-12 h-12 rounded-full bg-dark-800 border border-white/10 flex items-center justify-center hover:bg-white/5 disabled:opacity-50 transition-colors cursor-pointer">
                        <FaPause />
                      </button>
                      <button type="button" disabled={clipControlsDisabled} className="w-12 h-12 rounded-full bg-dark-800 border border-white/10 flex items-center justify-center hover:bg-white/5 disabled:opacity-50 transition-colors cursor-pointer">
                        <FaStepForward />
                      </button>
                    </div>
                  </div>

                  <div className="p-5 bg-dark-900/50 rounded-xl border border-white/5">
                    <label className="block text-sm font-medium text-dark-300 mb-2">Transition Setup</label>
                    <select
                      value={settings.transition_style}
                      onChange={(e) => updateSetting('transition_style', e.target.value)}
                      disabled={clipControlsDisabled}
                      className="w-full bg-dark-800 border border-white/10 rounded-lg px-4 py-3 text-sm text-white disabled:opacity-50 outline-none focus:border-primary-500"
                    >
                      <option>Fade/Zoom/Slide</option>
                      <option>Cut/Fade</option>
                    </select>
                  </div>

                  <div className="p-5 bg-dark-900/50 rounded-xl border border-white/5">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-dark-300">AI Clip Sensitivity</label>
                      <span className="text-xs font-bold text-primary-400">{settings.ai_clip_sensitivity}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.ai_clip_sensitivity}
                      onChange={(e) => updateSetting('ai_clip_sensitivity', Number(e.target.value))}
                      disabled={clipControlsDisabled}
                      className="w-full h-2 bg-dark-800 rounded-lg appearance-none cursor-pointer accent-primary-500 mb-4 disabled:opacity-50"
                    />

                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <div>
                        <h4 className="text-white font-medium text-sm">Background Noise Reduction</h4>
                        <p className="text-xs text-dark-500">Filter audio hum and hiss</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={settings.noise_reduction} onChange={(e) => updateSetting('noise_reduction', e.target.checked)} />
                        <div className="w-11 h-6 bg-dark-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500 peer-focus:ring-2 peer-focus:ring-primary-500/50"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Footer spacer */}
            <div className="h-10"></div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}

export default BrandingStudio
