import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  FaBell,
  FaChartLine,
  FaCog,
  FaFolder,
  FaKey,
  FaQuestionCircle,
  FaSignOutAlt,
  FaUserPlus,
  FaUsers,
  FaShieldAlt,
  FaEllipsisV,
  FaCheckCircle
} from 'react-icons/fa'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import '../index.css'

function TeamCollaboration() {
  const navigate = useNavigate()
  const { user, logout, token } = useAuth()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('Editor')
  const [inviteStatus, setInviteStatus] = useState({ sent: false, error: null })

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

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
    { label: 'Team Collab', icon: '⎈', path: '/team-collaboration', active: true },
    { label: 'Integrations', icon: '◌', path: '/integrations' },
  ]

  const sideSecondaryItems = [
    { label: 'Analytics', icon: <FaChartLine />, path: '/analytics' },
    { label: 'Pricing & Plan', icon: <FaFolder />, path: '/pricing' },
    { label: 'Profile Settings', icon: <FaCog />, path: '/profile' },
    { label: 'Support & Docs', icon: <FaQuestionCircle />, path: '/support-docs' },
    // { label: 'API Access', icon: <FaKey />, meta: 'For devs', path: '/profile?tab=security' },
  ]

  const fetchTeam = async () => {
    try {
      setLoading(true)
      const accessToken = token || localStorage.getItem('access_token')
      const response = await axios.get(`${API_BASE}/api/invites/team`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      setMembers(response.data)
    } catch (err) {
      console.error('Failed to fetch team data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeam()
  }, [])

  const handleInvite = async (e) => {
    e.preventDefault()
    if (!inviteEmail) return

    setInviteStatus({ sent: false, error: null })

    try {
      const accessToken = token || localStorage.getItem('access_token')
      await axios.post(`${API_BASE}/api/invites/send`, {
        invite_email: inviteEmail,
        role: inviteRole.toLowerCase()
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })

      setInviteStatus({ sent: true, error: null })
      setInviteEmail('')
      setInviteRole('Editor')
      fetchTeam() // Refresh list immediately

      setTimeout(() => {
        setInviteStatus({ sent: false, error: null })
      }, 4000)
    } catch (err) {
      console.error('Failed to send invite:', err)
      setInviteStatus({
        sent: false,
        error: err.response?.data?.error || 'Failed to send invite'
      })
    }
  }

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
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col z-10 relative h-full overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-dark-900/50 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-8 sticky top-0 z-20">
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-primary-400 text-sm border border-white/10">
              <FaUsers />
            </span>
            Workspace Team
          </h1>

          <div className="flex items-center gap-6">
            <button className="relative text-dark-300 hover:text-white transition-colors">
              <FaBell className="text-xl" />
            </button>
            <div className="h-8 w-px bg-white/10"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-white leading-none mb-1">
                  {user?.name || user?.email?.split('@')[0] || 'Amit Mishra'}
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
          <div className="max-w-6xl mx-auto space-y-8">

            <div className="flex flex-col md:flex-row gap-8 items-start">

              {/* Members List */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex-1 glass-panel w-full bg-dark-800/40 border-white/5 rounded-2xl overflow-hidden"
              >
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FaShieldAlt className="text-primary-400" />
                    Members Access
                  </h2>
                  <span className="bg-primary-500/10 text-primary-400 text-xs px-3 py-1 rounded-full font-bold">{members.length}/5 Seats Used</span>
                </div>

                <div className="divide-y divide-white/5">
                  {loading ? (
                    <div className="p-8 text-center text-dark-400 text-sm">Loading team...</div>
                  ) : members.length === 0 ? (
                    <div className="p-8 text-center text-dark-400 text-sm">No team members found.</div>
                  ) : (
                    members.map((member) => (
                      <div key={member.id} className="p-4 hover:bg-white/5 transition-colors flex items-center gap-4 group">
                        <div className="w-12 h-12 rounded-full bg-dark-700 flex items-center justify-center font-bold text-white border border-white/10">
                          {member.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white font-semibold flex items-center gap-2">
                            {member.name}
                            {member.role === 'Owner' && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded uppercase font-bold">Owner</span>}
                          </h4>
                          <p className="text-sm text-dark-400">{member.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-white">{member.role}</p>
                          {member.status === 'Active' ? (
                            <p className="text-xs text-green-400">Active</p>
                          ) : (
                            <p className="text-xs text-yellow-500">Pending</p>
                          )}
                        </div>
                        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-dark-500 hover:bg-white/10 hover:text-white transition-all opacity-0 group-hover:opacity-100">
                          <FaEllipsisV />
                        </button>
                      </div>
                    )))}
                </div>
              </motion.div>

              {/* Invite Module */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-full md:w-96 glass-panel p-6 bg-dark-800/40 border-white/5 rounded-2xl flex-shrink-0"
              >
                <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                  <FaUserPlus className="text-blue-400" />
                  Invite Teammate
                </h2>

                <form onSubmit={handleInvite} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1.5">Email Address</label>
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      placeholder="colleague@locaa.ai"
                      className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-dark-600 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1.5">Role</label>
                    <select
                      value={inviteRole}
                      onChange={e => setInviteRole(e.target.value)}
                      className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none transition-all focus:ring-1 focus:ring-primary-500 appearance-none"
                    >
                      <option value="Admin">Admin (Full Access)</option>
                      <option value="Editor">Editor (Can create clips)</option>
                      <option value="Viewer">Viewer (Read-only)</option>
                    </select>
                  </div>
                  <button type="submit" className="w-full btn-primary py-3 rounded-xl font-bold mt-2 shadow-lg hover:shadow-primary-500/20 transition-all">
                    Send Invitation
                  </button>
                </form>

                {inviteStatus.error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400"
                  >
                    {inviteStatus.error}
                  </motion.div>
                )}

                {inviteStatus.sent && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-2 text-sm text-green-400"
                  >
                    <FaCheckCircle /> Invite sent successfully
                  </motion.div>
                )}
              </motion.div>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}

export default TeamCollaboration
