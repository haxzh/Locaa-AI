import React, { useState } from 'react'
import { FaYoutube, FaPlay } from 'react-icons/fa'
import { extractYouTubeVideoId, normalizeYouTubeUrl } from '../utils/youtube'

export default function InputForm({ onSubmit, loading }) {
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [processingType, setProcessingType] = useState('clips')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    const videoId = extractYouTubeVideoId(youtubeUrl)
    if (!videoId) {
      setError('Please enter a valid YouTube URL or 11-character video ID')
      return
    }

    onSubmit(normalizeYouTubeUrl(videoId), processingType)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>
          <FaYoutube style={{ marginRight: '8px' }} />
          YouTube Video URL
        </label>
        <input
          type="text"
          placeholder="Paste youtube.com / youtu.be / shorts link"
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          disabled={loading}
          required
        />
        {error && <div style={{ color: '#b42318', fontSize: '0.92em' }}>{error}</div>}
      </div>

      <div className="form-group" style={{ marginTop: '20px' }}>
        <label style={{ marginBottom: '12px', display: 'block', fontSize: '0.95em', fontWeight: '600' }}>
          ⚙️ Processing Mode
        </label>
        <div style={{ display: 'flex', gap: '15px', flexDirection: 'column' }}>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            padding: '12px 16px', 
            border: `2px solid ${processingType === 'clips' ? '#3182ce' : '#e2e8f0'}`,
            borderRadius: '10px',
            cursor: 'pointer',
            background: processingType === 'clips' ? '#eff6ff' : 'white',
            transition: 'all 0.2s'
          }}>
            <input
              type="radio"
              name="processingType"
              value="clips"
              checked={processingType === 'clips'}
              onChange={(e) => setProcessingType(e.target.value)}
              disabled={loading}
              style={{ marginRight: '10px', cursor: 'pointer', width: '18px', height: '18px' }}
            />
            <div>
              <div style={{ fontWeight: '600', color: '#1f2937' }}>🎬 Create Short Clips (AI)</div>
              <div style={{ fontSize: '0.85em', color: '#6b7280', marginTop: '4px' }}>
                AI analyzes video, detects highlights, and creates multiple short clips
              </div>
            </div>
          </label>

          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            padding: '12px 16px', 
            border: `2px solid ${processingType === 'full_video' ? '#3182ce' : '#e2e8f0'}`,
            borderRadius: '10px',
            cursor: 'pointer',
            background: processingType === 'full_video' ? '#eff6ff' : 'white',
            transition: 'all 0.2s'
          }}>
            <input
              type="radio"
              name="processingType"
              value="full_video"
              checked={processingType === 'full_video'}
              onChange={(e) => setProcessingType(e.target.value)}
              disabled={loading}
              style={{ marginRight: '10px', cursor: 'pointer', width: '18px', height: '18px' }}
            />
            <div>
              <div style={{ fontWeight: '600', color: '#1f2937' }}>📹 Upload Full Video</div>
              <div style={{ fontSize: '0.85em', color: '#6b7280', marginTop: '4px' }}>
                Download and prepare the complete video for publishing
              </div>
            </div>
          </label>
        </div>
      </div>

      <button
        type="submit"
        className="btn btn-primary"
        disabled={loading}
        style={{ marginTop: '15px' }}
      >
        {loading ? (
          <>
            <span className="spinner"></span>
            Processing...
          </>
        ) : (
          <>
            <FaPlay /> Start Processing
          </>
        )}
      </button>

      <div style={{ marginTop: '20px', padding: '15px', background: '#f4f6f8', borderRadius: '10px', fontSize: '0.92em', color: '#1f2937' }}>
        <strong>How it works:</strong>
        <ul style={{ marginTop: '10px', marginLeft: '20px', lineHeight: '1.8' }}>
          <li>🎥 Download full video from YouTube</li>
          <li>✂️ AI detects highlights & cuts clips</li>
          <li>📝 Adds captions automatically</li>
          <li>🎨 Applies your logo</li>
          <li>🚀 Publishes to YouTube & Instagram</li>
        </ul>
      </div>
    </form>
  )
}
