import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import {
    FaChartLine,
    FaEye,
    FaClock,
    FaUsers,
    FaFire,
    FaArrowUp,
    FaYoutube,
    FaInstagram,
    FaTiktok,
    FaSignOutAlt,
    FaBell,
    FaSearch,
    FaCrown,
    FaVideo,
    FaPhotoVideo,
    FaUpload
} from 'react-icons/fa';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const Analytics = () => {
    const navigate = useNavigate();
    const { user, logout, token } = useAuth();
    const [loading, setLoading] = useState(true);

    const [metrics, setMetrics] = useState({
        totalViews: '0',
        totalViewsGrowth: '+0%',
        watchTime: '0h',
        watchTimeGrowth: '+0%',
        audienceGrowth: '+0',
        engagementRate: '0%',
        videosProcessed: 0,
        clipsGenerated: 0,
        uploadsPublished: 0
    });

    const [topClips, setTopClips] = useState([]);
    const [platforms, setPlatforms] = useState([]);
    const [chartData, setChartData] = useState([]);

    useEffect(() => {
        let isMounted = true;
        const fetchAnalytics = async () => {
            try {
                const accessToken = token || localStorage.getItem('access_token');
                const response = await axios.get(`${API_BASE}/api/analytics`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });

                if (isMounted && response.data.success) {
                    setMetrics(response.data.metrics);
                    setTopClips(response.data.recent_jobs);
                    setPlatforms(response.data.platforms);
                    setChartData(response.data.chart_data);
                }
            } catch (error) {
                console.error("Failed to fetch analytics:", error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchAnalytics();
        return () => { isMounted = false; };
    }, [token]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Sidebar Configuration
    const sidePrimaryItems = [
        { label: 'Dashboard', icon: '▦', path: '/dashboard' },
        { label: 'My Projects', icon: '◫', path: '/settings' },
        { label: 'Team Collab', icon: '⎈', path: '/team-collaboration' },
        { label: 'Integrations', icon: '◌', path: '/integrations' },
    ];

    const sideSecondaryItems = [
        { label: 'Analytics', icon: '📈', path: '/analytics', active: true },
        { label: 'Pricing & Plan', icon: '🗂', path: '/pricing' },
        { label: 'Profile Settings', icon: '⚙', path: '/profile' },
        { label: 'Support & Docs', icon: '❓', path: '/support-docs' },
        // { label: 'API Access', icon: '🔑', meta: 'For devs', path: '/profile?tab=security' },
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
    };

    // Find max value in chart data to calculate relative heights for CSS bars
    const maxChartVal = chartData.length > 0 ? Math.max(...chartData, 1) : 100;

    return (
        <div className="flex h-screen bg-[#0a0a0c] text-white overflow-hidden font-sans selection:bg-blue-500/30">

            {/* Sidebar (Matching Dashboard Component) */}
            <aside className="w-[280px] bg-[#0f0f13] border-r border-[#1f1f26] flex flex-col justify-between hidden md:flex shrink-0 z-20">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-10 cursor-pointer" onClick={() => navigate('/dashboard')}>
                        <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <span className="font-bold text-xl text-white">L</span>
                        </div>
                        <span className="font-bold text-2xl tracking-tight">Locaa AI</span>
                    </div>

                    <div className="space-y-8">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 mb-4 uppercase tracking-wider">Main Menu</p>
                            <div className="space-y-1">
                                {sidePrimaryItems.map((item, i) => (
                                    <button
                                        key={i}
                                        onClick={() => navigate(item.path)}
                                        className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${item.active
                                                ? 'bg-blue-500/10 text-blue-400 font-medium'
                                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        <span className="text-lg opacity-80">{item.icon}</span>
                                        <span>{item.label}</span>
                                        {item.active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <p className="text-xs font-semibold text-gray-500 mb-4 uppercase tracking-wider">Preferences</p>
                            <div className="space-y-1">
                                {sideSecondaryItems.map((item, i) => (
                                    <button
                                        key={i}
                                        onClick={() => navigate(item.path)}
                                        className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${item.active
                                                ? 'bg-blue-500/10 text-blue-400 font-medium'
                                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        <span className="text-lg opacity-80">{item.icon}</span>
                                        <span>{item.label}</span>
                                        {item.meta && (
                                            <span className="ml-auto text-[10px] uppercase tracking-wider border border-white/10 px-2 py-0.5 rounded-full text-gray-500">
                                                {item.meta}
                                            </span>
                                        )}
                                        {item.active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-[#1f1f26]">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-purple-500 flex items-center justify-center p-0.5 overflow-hidden">
                                <img src={`https://ui-avatars.com/api/?name=${user?.first_name || 'U'}&background=random`} alt="User" className="w-full h-full rounded-full border-2 border-[#0f0f13]" />
                            </div>
                            <div className="flex flex-col text-left">
                                <span className="text-sm font-semibold text-white leading-tight">{user?.first_name || 'Creator'}</span>
                                <span className="text-xs text-blue-400 flex items-center gap-1"><FaCrown className="text-[10px]" /> {user?.subscription_tier || 'Pro'}</span>
                            </div>
                        </div>
                        <button onClick={handleLogout} className="text-gray-500 hover:text-red-400 transition-colors p-2 hover:bg-red-500/10 rounded-lg">
                            <FaSignOutAlt />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Analytics Content */}
            <main className="flex-1 overflow-y-auto relative">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full mix-blend-screen filter blur-[100px] pointer-events-none" />

                <div className="max-w-7xl mx-auto px-8 py-8 relative z-10">

                    {/* Top Nav */}
                    <div className="flex items-center justify-between mb-12">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight mb-1">Performance Analytics</h1>
                            <p className="text-gray-400 text-sm flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Live data for your account
                            </p>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="hidden md:flex items-center bg-[#18181c] border border-white/5 rounded-full px-4 py-2">
                                <FaSearch className="text-gray-500 mr-2" />
                                <input
                                    type="text"
                                    placeholder="Search campaigns..."
                                    className="bg-transparent border-none outline-none text-sm w-48 text-white placeholder-gray-600"
                                />
                            </div>
                            <button className="relative text-gray-400 hover:text-white transition-colors">
                                <FaBell className="text-xl" />
                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0a0a0c]" />
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                        </div>
                    ) : (
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="space-y-8"
                        >

                            {/* KPI Metrics Row based on True DB Data */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                                {/* Metric 1 */}
                                <motion.div variants={itemVariants} className="bg-[#141419] border border-white/5 p-6 rounded-3xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-blue-500/20 transition-all duration-500" />
                                    <div className="flex items-start justify-between mb-4 relative z-10">
                                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 text-xl border border-blue-500/20">
                                            <FaVideo />
                                        </div>
                                        <span className="flex items-center gap-1 text-green-400 text-xs font-bold bg-green-500/10 px-2 py-1 rounded-lg border border-green-500/20">
                                            <FaArrowUp className="text-[10px]" /> Core Metrics
                                        </span>
                                    </div>
                                    <h3 className="text-gray-400 text-sm font-medium mb-1 relative z-10">Videos Processed</h3>
                                    <p className="text-4xl font-extrabold tracking-tight relative z-10">{metrics.videosProcessed}</p>
                                </motion.div>

                                {/* Metric 2 */}
                                <motion.div variants={itemVariants} className="bg-[#141419] border border-white/5 p-6 rounded-3xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-purple-500/20 transition-all duration-500" />
                                    <div className="flex items-start justify-between mb-4 relative z-10">
                                        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 text-xl border border-purple-500/20">
                                            <FaPhotoVideo />
                                        </div>
                                    </div>
                                    <h3 className="text-gray-400 text-sm font-medium mb-1 relative z-10">Clips & Shorts Generated</h3>
                                    <p className="text-4xl font-extrabold tracking-tight relative z-10">{metrics.clipsGenerated}</p>
                                </motion.div>

                                {/* Metric 3 */}
                                <motion.div variants={itemVariants} className="bg-[#141419] border border-white/5 p-6 rounded-3xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-emerald-500/20 transition-all duration-500" />
                                    <div className="flex items-start justify-between mb-4 relative z-10">
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-xl border border-emerald-500/20">
                                            <FaUpload />
                                        </div>
                                    </div>
                                    <h3 className="text-gray-400 text-sm font-medium mb-1 relative z-10">Uploads Published</h3>
                                    <p className="text-4xl font-extrabold tracking-tight relative z-10">{metrics.uploadsPublished}</p>
                                </motion.div>

                                {/* Metric 4 */}
                                <motion.div variants={itemVariants} className="bg-[#141419] border border-white/5 p-6 rounded-3xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-orange-500/20 transition-all duration-500" />
                                    <div className="flex items-start justify-between mb-4 relative z-10">
                                        <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-400 text-xl border border-orange-500/20">
                                            <FaEye />
                                        </div>
                                    </div>
                                    <h3 className="text-gray-400 text-sm font-medium mb-1 relative z-10">Total External Views</h3>
                                    <p className="text-4xl font-extrabold tracking-tight relative z-10">{metrics.totalViews}</p>
                                </motion.div>

                            </div>

                            {/* Charts Section */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                                {/* Main Views Chart (CSS-based responsive chart based on chartData state) */}
                                <motion.div variants={itemVariants} className="lg:col-span-2 bg-[#141419] border border-white/5 rounded-3xl p-6">
                                    <div className="flex items-center justify-between mb-8">
                                        <h2 className="text-lg font-bold">Views Overview</h2>
                                        <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm outline-none cursor-pointer hover:bg-white/10 transition-colors">
                                            <option>Last 30 Days</option>
                                            <option>Last 7 Days</option>
                                            <option>All Time</option>
                                        </select>
                                    </div>

                                    {chartData.length > 0 ? (
                                        <>
                                            <div className="h-64 flex items-end justify-between gap-2 pt-10">
                                                {chartData.map((val, i) => {
                                                    const heightPct = Math.max((val / maxChartVal) * 100, 5); // 5% min height
                                                    return (
                                                        <div key={i} className="relative w-full group flex flex-col items-center justify-end h-full">
                                                            <div
                                                                className="w-full bg-blue-500/20 group-hover:bg-blue-500/40 border border-blue-500/20 group-hover:border-blue-400 rounded-t-lg transition-all duration-300 relative overflow-hidden"
                                                                style={{ height: `${heightPct}%` }}
                                                            >
                                                                <div className="absolute top-0 left-0 w-full h-1 bg-blue-400/50" />
                                                            </div>
                                                            <div className="absolute -top-10 opacity-0 group-hover:opacity-100 bg-[#25252d] text-white text-xs py-1 px-2 rounded shadow-xl transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                                                {val} Views
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                            <div className="flex justify-between mt-4 text-xs text-gray-500 font-medium">
                                                <span>1st</span>
                                                <span>10th</span>
                                                <span>20th</span>
                                                <span>30th</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="h-64 flex items-center justify-center text-gray-500 flex-col">
                                            <FaChartLine className="text-4xl mb-3 opacity-20" />
                                            <p>No traffic data available yet. Keep uploading!</p>
                                        </div>
                                    )}
                                </motion.div>

                                {/* Platform Distribution */}
                                <motion.div variants={itemVariants} className="bg-[#141419] border border-white/5 rounded-3xl p-6">
                                    <h2 className="text-lg font-bold mb-8">Platform Traffic</h2>

                                    {metrics.clipsGenerated > 0 ? (
                                        <>
                                            <div className="space-y-6">
                                                {platforms.map((platform, i) => (
                                                    <div key={i}>
                                                        <div className="flex justify-between items-center mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <span style={{ color: platform.color }}>
                                                                    {platform.name.includes('You') && <FaYoutube />}
                                                                    {platform.name.includes('Tik') && <FaTiktok />}
                                                                    {platform.name.includes('Insta') && <FaInstagram />}
                                                                </span>
                                                                <span className="text-sm font-medium">{platform.name}</span>
                                                            </div>
                                                            <span className="text-sm font-bold">{platform.value}%</span>
                                                        </div>
                                                        <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${platform.value}%` }}
                                                                transition={{ duration: 1, delay: 0.2 + (i * 0.1) }}
                                                                className="h-full rounded-full"
                                                                style={{ backgroundColor: platform.color, boxShadow: `0 0 10px ${platform.color}80` }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="mt-8 p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl border border-blue-500/20">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                                        <FaChartLine />
                                                    </div>
                                                    <h4 className="font-bold text-sm">Growth Insight</h4>
                                                </div>
                                                <p className="text-xs text-gray-400 leading-relaxed">
                                                    Your YouTube Shorts content performs 2.5x better than basic videos. Keep clipping!
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-gray-500 flex-col py-10">
                                            <p className="text-sm text-center">Process your first video to unlock audience distribution insights.</p>
                                            <button onClick={() => navigate('/dashboard')} className="mt-4 text-xs bg-blue-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-600">Start Creating</button>
                                        </div>
                                    )}
                                </motion.div>

                            </div>

                            {/* History Table from Real Database */}
                            <motion.div variants={itemVariants} className="bg-[#141419] border border-white/5 rounded-3xl overflow-hidden">
                                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                    <h2 className="text-lg font-bold">Recent Job History <span className="text-xs font-normal text-gray-500 ml-2">(Last 10 generations)</span></h2>
                                    <button onClick={() => navigate('/dashboard')} className="text-sm text-blue-400 hover:text-blue-300 font-medium">View All Jobs</button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="text-gray-500 bg-[#0f0f13]/50">
                                            <tr>
                                                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Job ID / Title</th>
                                                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs border-l border-white/5">Publish Status</th>
                                                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs border-l border-white/5">DB Views</th>
                                                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs border-l border-white/5">Engagement</th>
                                                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs border-l border-white/5 w-32">Date created</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {topClips.length > 0 ? topClips.map((clip) => (
                                                <tr key={clip.id} className="hover:bg-white/[0.02] transition-colors group cursor-pointer" onClick={() => navigate('/dashboard')}>
                                                    <td className="px-6 py-4 text-white font-medium group-hover:text-blue-400 transition-colors">
                                                        {clip.title} <span className="text-xs text-gray-600 block">#{clip.id}</span>
                                                    </td>
                                                    <td className="px-6 py-4 border-l border-white/5">
                                                        {clip.platform !== 'not published' ? (
                                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${clip.platform === 'youtube' ? 'bg-[#FF0000]/10 text-[#FF0000] border-[#FF0000]/20' :
                                                                    clip.platform === 'tiktok' ? 'bg-[#00F2FE]/10 text-[#00F2FE] border-[#00F2FE]/20' :
                                                                        'bg-[#E1306C]/10 text-[#E1306C] border-[#E1306C]/20'
                                                                }`}>
                                                                {clip.platform === 'youtube' && <FaYoutube />}
                                                                {clip.platform === 'tiktok' && <FaTiktok />}
                                                                {clip.platform === 'instagram' && <FaInstagram />}
                                                                {clip.platform.charAt(0).toUpperCase() + clip.platform.slice(1)}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-500 text-xs font-medium">Local Output Only</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-400 font-medium border-l border-white/5">{clip.views}</td>
                                                    <td className="px-6 py-4 text-gray-400 font-medium border-l border-white/5">{clip.engagement}</td>
                                                    <td className="px-6 py-4 text-gray-500 border-l border-white/5">{clip.date}</td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan="5" className="px-6 py-10 text-center text-gray-500">
                                                        No processing history found in database.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>

                        </motion.div>
                    )}

                </div>
            </main>
        </div>
    );
};

export default Analytics;