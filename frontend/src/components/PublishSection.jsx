import React, { useState } from 'react'
import { FaYoutube, FaInstagram, FaUpload, FaPaperclip } from 'react-icons/fa'

export default function PublishSection({ job, onPublish, loading }) {
  const [title, setTitle] = useState(`AI Generated Short - ${new Date().toLocaleDateString()}`)
  const [description, setDescription] = useState('Auto-generated short video using AI Clipper technology')
  const [clipPath, setClipPath] = useState('')

  const handlePublish = async (e) => {
    e.preventDefault()

    if (!clipPath) {
      alert('❌ Please specify the clip path')
      return
    }

    onPublish(job.id, clipPath, title, description)
  }

  return (
    <div style={{
      background: '#f9f9f9',
      padding: '20px',
      borderRadius: '8px',
      marginTop: '20px',
      borderLeft: '4px solid #667eea'
    }}>
      <h3 style={{ marginBottom: '15px', color: '#333' }}>📤 Publishing Options</h3>

      {job.status === 'ready_for_publishing' || job.status === 'generating_clips' ? (
        <form onSubmit={handlePublish}>
          <div className="form-group">
            <label>Video Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength="100"
            />
            <small style={{ color: '#666' }}>
              {title.length}/100 characters
            </small>
          </div>

          <div className="form-group">
            <label>Video Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
              maxLength="5000"
              placeholder="Add an engaging description..."
            ></textarea>
            <small style={{ color: '#666' }}>
              {description.length}/5000 characters
            </small>
          </div>

          <div className="form-group">
            <label>Clip File Path</label>
            <input
              type="text"
              value={clipPath}
              onChange={(e) => setClipPath(e.target.value)}
              placeholder="e.g., /path/to/clip_1.mp4"
            />
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            marginTop: '15px'
          }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              onClick={(e) => {
                e.preventDefault()
                handlePublish(e)
              }}
            >
              {loading ? <>Loading...</> : <>
                <FaYoutube /> Publish to YouTube
              </>}
            </button>

            <button
              type="button"
              className="btn btn-primary"
              disabled={loading}
              style={{ opacity: 0.7 }}
            >
              <FaInstagram /> Publish to Instagram
            </button>
          </div>
        </form>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '20px',
          color: '#999'
        }}>
          <p>⏳ Job Status: <strong>{job.status}</strong></p>
          <p style={{ fontSize: '0.9em', marginTop: '10px' }}>
            Publishing options will be available once processing is complete
          </p>
        </div>
      )}
    </div>
  )
}
