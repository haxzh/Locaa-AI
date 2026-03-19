import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FaBell,
  FaChartLine,
  FaCog,
  FaEnvelope,
  FaFolder,
  FaKey,
  FaQuestionCircle,
  FaSignOutAlt,
  FaLifeRing,
  FaBookOpen,
  FaRocket,
  FaLightbulb,
} from 'react-icons/fa'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { PremiumDevicePreview, SignalPill } from './PremiumVisuals'
import '../index.css'

const SUPPORT_EMAIL = 'harshshakya908431@gmail.com'

function SupportDocs() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const supportSignals = ['Docs that convert confusion into action', 'Troubleshooting without ticket lag', 'Founder-friendly support loop']

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const sidePrimaryItems = [
    { label: 'Dashboard', icon: '▦', path: '/dashboard' },
    { label: 'My Projects', icon: '◫', path: '/settings' },
    // { label: 'Clip Maker', icon: '✂', path: '/create' },
    // { label: 'Logo & Branding', icon: '✎', path: '/branding' },
    // { label: 'Upload Manager', icon: '⤴', path: '/dashboard' },
    { label: 'Team Collab', icon: '⎈', path: '/team-collaboration' },
    { label: 'Integrations', icon: '◌', path: '/integrations' },
  ]

  const sideSecondaryItems = [
    { label: 'Analytics', icon: <FaChartLine />, path: '/analytics' },
    { label: 'Pricing & Plan', icon: <FaFolder />, path: '/pricing' },
    { label: 'Profile Settings', icon: <FaCog />, path: '/profile' },
    { label: 'Support & Docs', icon: <FaQuestionCircle />, path: '/support-docs', active: true },
    // { label: 'API Access', icon: <FaKey />, meta: 'For devs', path: '/profile?tab=security' },
  ]

  return (
    <div className="flex h-screen bg-dark-900 text-dark-50 font-sans overflow-hidden relative">
      {/* Ambient Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-primary-500/10 rounded-full mix-blend-screen filter blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-blue-500/10 rounded-full mix-blend-screen filter blur-[100px] pointer-events-none" />

      {/* Sidebar */}
      <aside className="w-64 bg-dark-900/50 backdrop-blur-xl border-r border-white/5 flex flex-col z-10 hidden md:flex">
        <div className="p-6 flex items-center gap-3 border-b border-white/5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-blue-500 flex items-center justify-center font-display font-bold text-white text-lg shadow-lg shadow-primary-500/30">
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
                {item.meta && (
                  <span className="text-[10px] uppercase tracking-wider bg-dark-800 text-dark-300 px-2 py-0.5 rounded-full border border-white/5">
                    {item.meta}
                  </span>
                )}
              </a>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col z-10 relative h-full overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-dark-900/50 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-8 sticky top-0 z-20">
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-primary-400 text-sm border border-white/10">
              <FaLifeRing />
            </span>
            Support & Docs
          </h1>

          <div className="flex items-center gap-6">
            <button className="relative text-dark-300 hover:text-white transition-colors">
              <FaBell className="text-xl" />
            </button>
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

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-5xl mx-auto space-y-8">

            <div className="grid grid-cols-1 xl:grid-cols-[1.05fr_0.95fr] gap-6 items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-8 bg-dark-800/40 border-white/5 rounded-[2rem] overflow-hidden relative"
              >
                <div className="absolute top-0 right-0 w-52 h-52 bg-primary-500/10 blur-[80px] rounded-full" />
                <div className="relative z-10">
                  <div className="flex flex-wrap gap-2 mb-5">
                    {supportSignals.map((item, index) => <SignalPill key={item} tone={index === 0 ? 'primary' : index === 1 ? 'blue' : 'default'}>{item}</SignalPill>)}
                  </div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-blue-500 flex items-center justify-center text-2xl text-white shadow-lg shadow-primary-500/20">
                      <FaRocket />
                    </div>
                    <h2 className="text-2xl font-display font-bold text-white">Getting Started with Locaa AI</h2>
                  </div>
                  <p className="text-dark-300 text-lg leading-relaxed max-w-3xl mb-4">
                    Locaa AI is your professional video automation assistant. We transform long-form content into highly-engaging short clips tailored for YouTube Shorts, Instagram Reels, and TikTok.
                  </p>
                  <div className="bg-dark-900/50 border border-white/5 rounded-xl p-5 mt-6">
                    <h3 className="text-white font-semibold mb-3">Core Features:</h3>
                    <ul className="space-y-2 text-dark-300">
                      <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary-500" /> <b>Smart Clip Generation:</b> AI automatically finds viral-worthy moments.</li>
                      <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary-500" /> <b>Auto Dubbing:</b> Translate and dub your content into different languages flawlessly.</li>
                      <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary-500" /> <b>Branding Studio:</b> Add custom logos, text overlays, and watermarks to all exported videos.</li>
                      <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary-500" /> <b>Auto Publish:</b> Connect integrations to publish directly to social platforms.</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
              <PremiumDevicePreview
                title="Support Console"
                subtitle="Guides, tickets, workflows"
                accent="blue"
                items={[
                  { label: 'Workflow setup', value: '4 steps', progress: '80%' },
                  { label: 'Issue resolution', value: 'Fast path', progress: '66%' },
                  { label: 'Support access', value: 'Direct email', progress: '92%' },
                ]}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-panel p-8 bg-dark-800/40 border-white/5"
              >
                <div className="flex items-center gap-3 mb-6">
                  <FaBookOpen className="text-xl text-primary-400" />
                  <h3 className="text-xl font-bold text-white">Quick Workflow</h3>
                </div>
                <ul className="space-y-4 text-dark-300">
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded bg-primary-500/20 text-primary-400 flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                    <p>Go to <span className="text-white">Clip Maker</span> and paste a YouTube URL or upload a file.</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded bg-primary-500/20 text-primary-400 flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                    <p>Select your language, mode (Clips vs Full Video), and apply branding presets.</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded bg-primary-500/20 text-primary-400 flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                    <p>Let the AI process your job. Track status on the Dashboard.</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded bg-primary-500/20 text-primary-400 flex items-center justify-center text-sm font-bold flex-shrink-0">4</span>
                    <p>Review the output and click <span className="text-white">Publish</span> using Integrations.</p>
                  </li>
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-panel p-8 bg-dark-800/40 border-white/5"
              >
                <div className="flex items-center gap-3 mb-6">
                  <FaLightbulb className="text-xl text-yellow-400" />
                  <h3 className="text-xl font-bold text-white">Troubleshooting</h3>
                </div>
                <div className="space-y-5">
                  <div>
                    <h4 className="text-white font-medium mb-1">Downloads Failing?</h4>
                    <p className="text-sm text-dark-400">Ensure the YouTube video isn&apos;t private or age-restricted. Extremely long videos (above 2 hours) might fail on Free accounts.</p>
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-1">Watermark not showing?</h4>
                    <p className="text-sm text-dark-400">Apply the watermark preset in the Branding Studio, then select it during the Clip Creation wizard.</p>
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-1">Auto-Publish blocked?</h4>
                    <p className="text-sm text-dark-400">Visit Integrations, Disconnect the provider, and Reconnect it to refresh your OAuth access tokens.</p>
                  </div>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-panel p-8 bg-gradient-to-r from-primary-900/40 to-blue-900/40 border border-primary-500/20 text-center"
            >
              <FaEnvelope className="text-4xl text-primary-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Still Need Help?</h3>
              <p className="text-dark-300 mb-6 max-w-lg mx-auto">We&apos;re here to help you automate your content workflow. Reach out directly to our engineering and support team.</p>

              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="inline-flex items-center gap-2 btn-primary px-8 py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-primary-500/20 transition-all"
              >
                Contact Support
              </a>
              <p className="mt-4 text-xs text-dark-500 font-mono">{SUPPORT_EMAIL}</p>
            </motion.div>

          </div>
        </div>
      </main>
    </div>
  )
}

export default SupportDocs
