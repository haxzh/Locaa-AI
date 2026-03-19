import React from 'react'
import { FaFileUpload, FaImages } from 'react-icons/fa'

export default function LogoUpload({ onUpload, logoPath }) {
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('❌ Please upload an image file')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('❌ File size must be less than 5MB')
        return
      }
      onUpload(file)
    }
  }

  return (
    <div>
      <div className="logo-preview">
        {logoPath ? (
          <>
            <p>Logo uploaded successfully! ✅</p>
            <img
              src={logoPath}
              alt="Uploaded Logo"
              style={{ marginTop: '10px' }}
            />
          </>
        ) : (
          <>
            <FaImages style={{ fontSize: '3em', color: '#ccc', marginBottom: '10px' }} />
            <p style={{ color: '#999', fontSize: '0.9em' }}>
              Upload your logo (PNG/JPG)
              <br />
              This will be added to all generated clips
            </p>
          </>
        )}
      </div>

      <label className="btn btn-secondary" style={{ marginTop: '15px', cursor: 'pointer' }}>
        <FaFileUpload />
        Choose Logo
        <input
          type="file"
          accept="image/png,image/jpeg"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </label>
    </div>
  )
}
