import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import {
    FaVideo, FaUpload, FaYoutube, FaMagic,
    FaArrowRight, FaArrowLeft, FaUndo,
    FaCheck, FaLanguage, FaSpinner, FaPlay,
    FaImage, FaCloudUploadAlt
} from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'
import '../index.css'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

function CreateJob() {
    const navigate = useNavigate()
    const { token, logout } = useAuth()
    const fileInputRef = useRef(null)

    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState(null)

    // Form State
    const [inputMethod, setInputMethod] = useState('youtube') // 'youtube' or 'upload'
    const [youtubeUrl, setYoutubeUrl] = useState('')
    const [videoFile, setVideoFile] = useState(null)

    const [processingType, setProcessingType] = useState('full_video') // 'full_video' or 'clips'
    const [targetLanguage, setTargetLanguage] = useState('english')
    const [publishPlatforms, setPublishPlatforms] = useState([]) // ['youtube', 'instagram', etc]
    const [logoFile, setLogoFile] = useState(null)

    const steps = [
        { id: 1, title: 'Source', desc: 'Provide video' },
        { id: 2, title: 'AI Config', desc: 'Dubbing & type' },
        { id: 3, title: 'Branding', desc: 'Add your logo' },
        { id: 4, title: 'Review', desc: 'Start processing' }
    ]
    const workflowBenefits = [
        'AI clipping and dubbing in one flow',
        'Built for founder-led content teams',
        'Publish-ready assets without agency lag'
    ]
    const publishDestinations = [
        { id: 'youtube', name: 'YouTube', icon: <FaYoutube className="text-red-500" />, hint: 'Shorts and long-form' },
        { id: 'instagram', name: 'Instagram', icon: <span className="text-pink-400">◉</span>, hint: 'Reels and repurposed cuts' },
        { id: 'facebook', name: 'Facebook', icon: <span className="text-blue-400">◌</span>, hint: 'Native video publishing' },
        { id: 'tiktok', name: 'TikTok', icon: <span className="text-white">♪</span>, hint: 'Fast vertical distribution' },
    ]

    const authHeaders = () => ({ Authorization: `Bearer ${token || localStorage.getItem('access_token')}` })

    const handleNext = () => {
        if (step === 1) {
            if (inputMethod === 'youtube' && !youtubeUrl) {
                setMessage({ type: 'error', text: 'Please enter a valid YouTube URL.' })
                return
            }
            if (inputMethod === 'upload' && !videoFile) {
                setMessage({ type: 'error', text: 'Please select a video file.' })
                return
            }
        }
        setMessage(null)
        setStep(s => Math.min(s + 1, steps.length))
    }

    const handleBack = () => {
        setMessage(null)
        setStep(s => Math.max(s - 1, 1))
    }

    const togglePlatform = (platform) => {
        setPublishPlatforms(prev =>
            prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]
        )
    }

    const handleSubmit = async () => {
        setLoading(true)
        setMessage(null)

        try {
            const formData = new FormData()

            if (inputMethod === 'upload' && videoFile) {
                formData.append('video_file', videoFile)
            } else {
                formData.append('youtube_url', youtubeUrl)
            }

            if (logoFile) {
                formData.append('logo_file', logoFile)
            }

            formData.append('processing_type', processingType)
            formData.append('target_language', targetLanguage)
            formData.append('publish_platforms', JSON.stringify(publishPlatforms))

            const response = await axios.post(`${API_BASE}/api/process-video`, formData, {
                headers: {
                    ...authHeaders(),
                    'Content-Type': 'multipart/form-data'
                }
            })

            setMessage({ type: 'success', text: `Success! Job started with ID: ${response.data.job_id}` })
            setTimeout(() => {
                navigate('/dashboard')
            }, 2000)

        } catch (error) {
            if (error?.response?.status === 401) {
                logout()
                navigate('/login')
            } else {
                setMessage({ type: 'error', text: error?.response?.data?.error || 'Failed to start job.' })
            }
        } finally {
            setLoading(false)
        }
    }

    const handleVideoUpload = (e) => {
        const file = e.target.files?.[0]
        if (file && file.type.startsWith('video/')) {
            setVideoFile(file)
            setMessage(null)
        } else if (file) {
            setMessage({ type: 'error', text: 'Please select a valid video file.' })
        }
    }

    const handleLogoUpload = (e) => {
        const file = e.target.files?.[0]
        if (file && file.type.startsWith('image/')) {
            setLogoFile(file)
            setMessage(null)
        } else if (file) {
            setMessage({ type: 'error', text: 'Please select a valid image file.' })
        }
    }

    return (
        <div className="min-h-screen bg-dark-900 flex flex-col items-center pt-10 px-4 font-sans text-white pb-20 relative overflow-hidden">
            {/* Abstract Background Elements */}
            <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-primary-500/10 rounded-full mix-blend-screen filter blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-blue-500/10 rounded-full mix-blend-screen filter blur-[100px] pointer-events-none" />

            <div className="w-full max-w-4xl z-10">
                {/* Header */}
                <div className="mb-10">
                    <div className="flex items-center justify-between mb-6">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="flex items-center gap-2 text-dark-400 hover:text-white transition-colors"
                        >
                            <FaArrowLeft /> Back to Dashboard
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center font-bold text-xl shadow-lg shadow-primary-500/30">
                                L
                            </div>
                            <span className="font-display font-bold text-2xl tracking-wide">Locaa AI</span>
                        </div>
                    </div>

                    <div className="glass-panel bg-gradient-to-br from-dark-800/80 to-dark-900/60 border-white/5 p-6 md:p-8 rounded-[2rem] shadow-2xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-56 h-56 bg-primary-500/10 rounded-full blur-[80px] pointer-events-none" />
                        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 items-center relative z-10">
                            <div>
                                <span className="inline-flex items-center gap-2 rounded-full border border-primary-500/20 bg-primary-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary-300 mb-5">
                                    <span className="h-2 w-2 rounded-full bg-primary-400 animate-pulse" />
                                    Production Workflow
                                </span>
                                <h1 className="text-3xl md:text-5xl font-display font-bold text-white leading-tight mb-4">
                                    Build a <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-blue-400">high-converting</span> content asset pipeline
                                </h1>
                                <p className="text-dark-300 max-w-2xl leading-relaxed mb-6">
                                    Import a source video, choose your AI output, add branding, and launch a polished publishing workflow in minutes.
                                </p>
                                <div className="flex flex-wrap gap-3 mb-6">
                                    {workflowBenefits.map((item) => (
                                        <span key={item} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-dark-200">
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { value: '4-step', label: 'guided setup' },
                                    { value: '50+', label: 'target languages' },
                                    { value: '4', label: 'platform outputs' },
                                    { value: '1 click', label: 'job launch' },
                                ].map((item) => (
                                    <div key={item.label} className="rounded-2xl border border-white/10 bg-dark-900/40 p-4">
                                        <p className="text-2xl font-display font-bold text-white">{item.value}</p>
                                        <p className="text-xs uppercase tracking-[0.2em] text-dark-500 mt-1">{item.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stepper Header */}
                <div className="glass-panel bg-dark-800/60 p-6 rounded-2xl border border-white/5 mb-8 shadow-xl">
                    <div className="flex justify-between items-center relative">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-dark-700/50 rounded-full z-0"></div>
                        <div
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-primary-500 to-blue-500 rounded-full z-0 transition-all duration-500 ease-out"
                            style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
                        ></div>

                        {steps.map((s, idx) => (
                            <div key={s.id} className="relative z-10 flex flex-col items-center group">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${step > s.id
                                    ? 'bg-primary-500 text-white shadow-[0_0_15px_rgba(14,165,164,0.5)]'
                                    : step === s.id
                                        ? 'bg-gradient-to-br from-primary-500 to-blue-500 text-white ring-4 ring-dark-800 shadow-[0_0_20px_rgba(59,130,246,0.5)]'
                                        : 'bg-dark-700 text-dark-400 border-2 border-dark-600'
                                    }`}>
                                    {step > s.id ? <FaCheck /> : s.id}
                                </div>
                                <div className="absolute top-12 whitespace-nowrap text-center hidden sm:block">
                                    <p className={`text-sm font-semibold transition-colors ${step >= s.id ? 'text-white' : 'text-dark-400'}`}>{s.title}</p>
                                    <p className="text-xs text-dark-500">{s.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {message && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium shadow-lg backdrop-blur-md ${message.type === 'error'
                                ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                                : 'bg-green-500/10 border border-green-500/20 text-green-400'
                                }`}
                        >
                            {message.type === 'error' ? '⚠️' : '✅'} {message.text}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Wizard Content */}
                <div className="glass-panel p-8 bg-dark-800/80 border border-white/5 rounded-2xl shadow-2xl relative min-h-[400px]">
                    <AnimatePresence mode="wait">
                        {/* Step 1: Source */}
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }} transition={{ duration: 0.3 }}
                                className="space-y-6"
                            >
                                <div className="text-center mb-8">
                                    <h2 className="text-3xl font-display font-bold text-white mb-2">Provide Source Video</h2>
                                    <p className="text-dark-400">Import from YouTube or upload directly from your device.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <button
                                        onClick={() => setInputMethod('youtube')}
                                        className={`p-6 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition-all ${inputMethod === 'youtube'
                                            ? 'bg-primary-500/10 border-primary-500 text-white shadow-[0_0_20px_rgba(14,165,164,0.15)]'
                                            : 'bg-dark-900/50 border-white/5 text-dark-400 hover:border-white/20'
                                            }`}
                                    >
                                        <FaYoutube className={`text-4xl ${inputMethod === 'youtube' ? 'text-red-500' : ''}`} />
                                        <span className="font-semibold text-lg">YouTube Link</span>
                                        <span className="text-xs text-dark-500">Fastest way to process existing content</span>
                                    </button>
                                    <button
                                        onClick={() => setInputMethod('upload')}
                                        className={`p-6 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition-all ${inputMethod === 'upload'
                                            ? 'bg-primary-500/10 border-primary-500 text-white shadow-[0_0_20px_rgba(14,165,164,0.15)]'
                                            : 'bg-dark-900/50 border-white/5 text-dark-400 hover:border-white/20'
                                            }`}
                                    >
                                        <FaUpload className="text-4xl" />
                                        <span className="font-semibold text-lg">Upload File</span>
                                        <span className="text-xs text-dark-500">Use recorded assets from your local library</span>
                                    </button>
                                </div>

                                {inputMethod === 'youtube' ? (
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-dark-300">YouTube Video URL</label>
                                        <input
                                            type="text"
                                            placeholder="https://www.youtube.com/watch?v=..."
                                            value={youtubeUrl}
                                            onChange={(e) => setYoutubeUrl(e.target.value)}
                                            className="w-full bg-dark-900 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all shadow-inner"
                                        />
                                        {youtubeUrl && (
                                            <div className="mt-4 p-4 bg-dark-700/30 rounded-xl border border-white/5 flex items-center justify-center">
                                                <p className="text-sm text-green-400 flex items-center gap-2"><FaCheck /> URL captured. Ready to proceed.</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <input
                                            type="file"
                                            accept="video/*"
                                            className="hidden"
                                            ref={fileInputRef}
                                            onChange={handleVideoUpload}
                                        />
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all ${videoFile ? 'border-primary-500 bg-primary-500/5' : 'border-white/20 hover:border-primary-500/50 hover:bg-white/5 bg-dark-900/50'
                                                }`}
                                        >
                                            {videoFile ? (
                                                <div className="text-center">
                                                    <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mx-auto mb-4 scale-110 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                                                        <FaCheck className="text-2xl" />
                                                    </div>
                                                    <p className="font-semibold text-white text-lg">{videoFile.name}</p>
                                                    <p className="text-sm text-dark-400 mt-1">{(videoFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to process</p>
                                                    <button className="mt-4 text-sm text-primary-400 hover:text-white transition-colors" onClick={(e) => { e.stopPropagation(); setVideoFile(null); }}>Change file</button>
                                                </div>
                                            ) : (
                                                <div className="text-center opacity-70 hover:opacity-100 transition-opacity">
                                                    <FaCloudUploadAlt className="text-6xl text-dark-400 mx-auto mb-4" />
                                                    <p className="font-semibold text-white text-lg mb-1">Click to browse or drag video here</p>
                                                    <p className="text-sm text-dark-500">MP4, MOV, WEBM up to 2GB</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Step 2: AI Config */}
                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }} transition={{ duration: 0.3 }}
                                className="space-y-8"
                            >
                                <div className="text-center mb-6">
                                    <h2 className="text-3xl font-display font-bold text-white mb-2">AI Processing Setup</h2>
                                    <p className="text-dark-400">Choose how the AI should transform your video.</p>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                            <FaLanguage className="text-primary-400" /> Target Language
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {[
                                                { id: 'english', label: 'English', flag: '🇺🇸' },
                                                { id: 'hindi', label: 'Hindi', flag: '🇮🇳' },
                                                { id: 'spanish', label: 'Spanish', flag: '🇪🇸' },
                                                { id: 'french', label: 'French', flag: '🇫🇷' },
                                            ].map(lang => (
                                                <button
                                                    key={lang.id}
                                                    onClick={() => setTargetLanguage(lang.id)}
                                                    className={`p-4 rounded-xl border flex items-center justify-center gap-2 transition-all font-medium ${targetLanguage === lang.id
                                                        ? 'bg-primary-500/20 border-primary-500 text-white shadow-inner'
                                                        : 'bg-dark-900 border-white/5 text-dark-300 hover:border-white/20'
                                                        }`}
                                                >
                                                    <span className="text-xl">{lang.flag}</span> {lang.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="h-px bg-white/5 w-full my-8"></div>

                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                            <FaMagic className="text-purple-400" /> Output Format
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div
                                                onClick={() => setProcessingType('full_video')}
                                                className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${processingType === 'full_video'
                                                    ? 'bg-purple-500/10 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                                                    : 'bg-dark-900 border-transparent hover:border-white/10'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="font-bold text-white text-lg">Full Video Dub</h4>
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${processingType === 'full_video' ? 'border-purple-500' : 'border-dark-500'}`}>
                                                        {processingType === 'full_video' && <div className="w-2.5 h-2.5 bg-purple-500 rounded-full"></div>}
                                                    </div>
                                                </div>
                                                <p className="text-sm text-dark-400">Keep the original length, fully translate and dub the audio seamlessly.</p>
                                            </div>

                                            <div
                                                onClick={() => setProcessingType('clips')}
                                                className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${processingType === 'clips'
                                                    ? 'bg-purple-500/10 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                                                    : 'bg-dark-900 border-transparent hover:border-white/10'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="font-bold text-white text-lg">Viral Shorts/Clips</h4>
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${processingType === 'clips' ? 'border-purple-500' : 'border-dark-500'}`}>
                                                        {processingType === 'clips' && <div className="w-2.5 h-2.5 bg-purple-500 rounded-full"></div>}
                                                    </div>
                                                </div>
                                                <p className="text-sm text-dark-400">AI automatically finds the best highlights and formats them for TikTok/Reels.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 3: Branding */}
                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }} transition={{ duration: 0.3 }}
                                className="space-y-6"
                            >
                                <div className="text-center mb-8">
                                    <h2 className="text-3xl font-display font-bold text-white mb-2">Apply Branding</h2>
                                    <p className="text-dark-400">Upload a custom watermark logo (Optional)</p>
                                </div>

                                <div className="max-w-xl mx-auto">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        id="logoUpload"
                                        onChange={handleLogoUpload}
                                    />

                                    {logoFile ? (
                                        <div className="bg-dark-900 p-6 rounded-2xl border border-white/10 text-center relative overflow-hidden group">
                                            <div className="absolute inset-0 bg-dark-900/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 z-10">
                                                <label htmlFor="logoUpload" className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-semibold cursor-pointer shadow-lg hover:bg-primary-400">Change</label>
                                                <button onClick={() => setLogoFile(null)} className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-sm font-semibold cursor-pointer hover:bg-red-500/30">Remove</button>
                                            </div>
                                            <div className="w-32 h-32 mx-auto rounded-xl bg-dark-800 border border-white/5 flex items-center justify-center mb-4 overflow-hidden relative">
                                                <img src={URL.createObjectURL(logoFile)} alt="Logo Preview" className="w-full h-full object-contain" />
                                                <div className="absolute inset-0 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABZJREFUeNpi2rV7928Gxv179/5nAAgwAD2oBdTntK3TAAAAAElFTkSuQmCC')] opacity-10 pointer-events-none"></div>
                                            </div>
                                            <p className="font-semibold text-white">{logoFile.name}</p>
                                            <p className="text-xs text-green-400 mt-1">Watermark ready to apply</p>
                                        </div>
                                    ) : (
                                        <label htmlFor="logoUpload" className="block border-2 border-dashed border-white/20 hover:border-primary-500/50 bg-dark-900/50 hover:bg-white/5 rounded-2xl p-12 text-center cursor-pointer transition-all group">
                                            <div className="w-16 h-16 rounded-full bg-dark-800 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                                <FaImage className="text-3xl text-dark-400 group-hover:text-primary-400 transition-colors" />
                                            </div>
                                            <p className="font-semibold text-white text-lg mb-1">Upload Logo PNG/JPG</p>
                                            <p className="text-sm text-dark-500">Transparent background recommended</p>
                                        </label>
                                    )}

                                    <div className="mt-8 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-4">
                                        <div className="text-blue-400 mt-1"><FaUndo /></div>
                                        <p className="text-sm text-blue-200">If no logo is selected, we will use your default workspace settings from the Branding Studio, or none if disabled.</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 4: Finalize */}
                        {step === 4 && (
                            <motion.div
                                key="step4"
                                initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }} transition={{ duration: 0.3 }}
                                className="space-y-6"
                            >
                                <div className="text-center mb-8">
                                    <h2 className="text-3xl font-display font-bold text-white mb-2">Ready to Process</h2>
                                    <p className="text-dark-400">Review your settings and auto-publish destinations.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Summary Card */}
                                    <div className="bg-dark-900/80 rounded-2xl p-6 border border-white/5">
                                        <h3 className="font-semibold text-lg text-white mb-4 border-b border-white/10 pb-2">Configuration Summary</h3>
                                        <ul className="space-y-4">
                                            <li className="flex items-start justify-between">
                                                <span className="text-dark-400 text-sm">Source</span>
                                                <span className="text-white font-medium text-sm text-right bg-dark-800 px-3 py-1 rounded-md max-w-[200px] truncate">
                                                    {inputMethod === 'youtube' ? 'YouTube URL' : videoFile?.name}
                                                </span>
                                            </li>
                                            <li className="flex justify-between items-center">
                                                <span className="text-dark-400 text-sm">Output Format</span>
                                                <span className="text-white font-medium text-sm bg-purple-500/20 text-purple-300 px-3 py-1 rounded-md border border-purple-500/20">
                                                    {processingType === 'full_video' ? 'Full Video' : 'AI Clips'}
                                                </span>
                                            </li>
                                            <li className="flex justify-between items-center">
                                                <span className="text-dark-400 text-sm">Target Language</span>
                                                <span className="text-white font-medium text-sm bg-primary-500/20 text-primary-300 px-3 py-1 rounded-md border border-primary-500/20 capitalize">
                                                    {targetLanguage}
                                                </span>
                                            </li>
                                            <li className="flex justify-between items-center">
                                                <span className="text-dark-400 text-sm">Custom Watermark</span>
                                                <span className={`text-sm font-medium px-3 py-1 rounded-md ${logoFile ? 'bg-green-500/20 text-green-300 border border-green-500/20' : 'bg-dark-800 text-dark-300'}`}>
                                                    {logoFile ? 'Custom Applied' : 'Default/None'}
                                                </span>
                                            </li>
                                        </ul>
                                    </div>

                                    {/* Auto Publish */}
                                    <div>
                                        <h3 className="font-semibold text-lg text-white mb-4">Auto-Publish Destinations</h3>
                                        <p className="text-xs text-dark-400 mb-4">Select platforms to auto-post to upon completion.</p>

                                        <div className="space-y-3">
                                            {publishDestinations.map(platform => (
                                                <div
                                                    key={platform.id}
                                                    onClick={() => togglePlatform(platform.id)}
                                                    className={`flex items-center justify-between p-4 rounded-xl border border-white/5 cursor-pointer transition-all ${publishPlatforms.includes(platform.id)
                                                        ? 'bg-blue-500/10 border-blue-500/30'
                                                        : 'bg-dark-900 hover:bg-white/5'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="text-xl">{platform.icon}</div>
                                                        <div>
                                                            <span className="font-medium text-white block">{platform.name}</span>
                                                            <span className="text-xs text-dark-500">{platform.hint}</span>
                                                        </div>
                                                    </div>
                                                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${publishPlatforms.includes(platform.id) ? 'bg-blue-500 border-blue-500' : 'border-dark-500'
                                                        }`}>
                                                        {publishPlatforms.includes(platform.id) && <FaCheck className="text-xs text-white" />}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-4 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                                            <p className="text-xs text-orange-200">Make sure your social accounts are linked in the <strong>Integrations</strong> tab.</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Footer Controls */}
                    <div className="absolute bottom-0 left-0 w-full p-8 border-t border-white/5 bg-dark-900/50 backdrop-blur-md rounded-b-2xl">
                        <div className="flex justify-between items-center">
                            <button
                                onClick={handleBack}
                                disabled={step === 1 || loading}
                                className={`px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all ${step === 1
                                    ? 'opacity-0 pointer-events-none'
                                    : 'bg-dark-700 text-white hover:bg-dark-600'
                                    }`}
                            >
                                <FaArrowLeft /> Back
                            </button>

                            <div className="flex gap-2">
                                {steps.map((s, i) => (
                                    <div key={i} className={`w-2 h-2 rounded-full transition-colors ${step === s.id ? 'bg-primary-500' : 'bg-dark-600'}`}></div>
                                ))}
                            </div>

                            {step < steps.length ? (
                                <button
                                    onClick={handleNext}
                                    className="btn-primary px-8 py-2.5 rounded-xl font-bold flex items-center gap-2"
                                >
                                    Continue <FaArrowRight />
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="btn-primary px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(14,165,164,0.4)] hover:shadow-[0_0_30px_rgba(14,165,164,0.6)]"
                                >
                                    {loading ? <><FaSpinner className="animate-spin" /> Starting AI...</> : <><FaPlay /> Launch Job</>}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CreateJob
