import React from 'react'
import { FaCheckCircle, FaClock, FaExclamationCircle, FaSpinner } from 'react-icons/fa'

export default function StatusTracker({ job }) {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'downloading':
        return <FaSpinner className="fa-spin" style={{ color: '#2196F3' }} />
      case 'processing':
      case 'generating_clips':
        return <FaSpinner className="fa-spin" style={{ color: '#9c27b0' }} />
      case 'completed':
      case 'ready_for_publishing':
        return <FaCheckCircle style={{ color: '#4caf50' }} />
      case 'published':
        return <FaCheckCircle style={{ color: '#4caf50' }} />
      case 'failed':
        return <FaExclamationCircle style={{ color: '#f44336' }} />
      default:
        return <FaClock style={{ color: '#ffc107' }} />
    }
  }

  const getStatusMessage = (status, currentStep) => {
    if (currentStep) return currentStep
    
    const messages = {
      'downloading': '⬇️ Downloading video from YouTube...',
      'processing': '⚙️ Processing video...',
      'generating_clips': '✂️ Generating AI clips...',
      'completed': '✅ Processing complete!',
      'ready_for_publishing': '✅ Ready to publish!',
      'published': '🎉 Published successfully!',
      'failed': '❌ Processing failed'
    }
    return messages[status] || status
  }

  if (!job) return null

  const progress = job.download_progress || job.progress || 0
  const showProgressBar = ['downloading', 'processing', 'generating_clips'].includes(job.status)

  return (
    <div style={{
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '20px',
      borderRadius: '12px',
      marginTop: '15px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
        <div style={{ fontSize: '24px' }}>
          {getStatusIcon(job.status)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '16px', color: '#333' }}>
            {getStatusMessage(job.status, job.current_step)}
          </div>
          {job.video_id && (
            <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
              Video ID: <code style={{ 
                background: '#fff', 
                padding: '2px 6px', 
                borderRadius: '4px',
                fontSize: '12px'
              }}>{job.video_id}</code>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {showProgressBar && (
        <div style={{ marginTop: '12px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginBottom: '6px',
            fontSize: '13px',
            color: '#555'
          }}>
            <span>{job.status === 'downloading' ? 'Download Progress' : 'Processing'}</span>
            <span style={{ fontWeight: 600 }}>{progress}%</span>
          </div>
          <div style={{
            width: '100%',
            height: '8px',
            background: '#e0e0e0',
            borderRadius: '10px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: job.status === 'downloading' 
                ? 'linear-gradient(90deg, #2196F3 0%, #21CBF3 100%)'
                : 'linear-gradient(90deg, #9c27b0 0%, #e91e63 100%)',
              transition: 'width 0.3s ease',
              borderRadius: '10px'
            }} />
          </div>
        </div>
      )}

      {/* Clips Progress */}
      {job.total_clips > 0 && (
        <div style={{ 
          marginTop: '12px', 
          padding: '10px', 
          background: 'rgba(255,255,255,0.7)',
          borderRadius: '8px',
          fontSize: '13px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>✂️</span>
            <span style={{ fontWeight: 600 }}>
              Clips: {job.clips_completed}/{job.total_clips}
            </span>
          </div>
          {job.clips_completed < job.total_clips && (
            <div style={{
              width: '100%',
              height: '4px',
              background: '#e0e0e0',
              borderRadius: '4px',
              marginTop: '6px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${(job.clips_completed / job.total_clips) * 100}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #ff6b6b 0%, #feca57 100%)',
                transition: 'width 0.3s ease'
              }} />
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {job.status === 'failed' && job.error_message && (
        <div style={{
          marginTop: '12px',
          padding: '10px',
          background: '#ffebee',
          borderRadius: '8px',
          color: '#c62828',
          fontSize: '13px'
        }}>
          <strong>Error:</strong> {job.error_message}
        </div>
      )}
    </div>
  )
}
