import React, { useState } from 'react';
import { motion } from 'framer-motion';
import './VideoCreator.css';

const VideoCreator = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    youtubeUrl: '',
    targetLanguage: 'english',
    platforms: ['youtube'],
    branding: {
      logoPath: '',
      watermarkText: 'Locaa AI',
      watermarkPosition: 'bottom-right'
    },
    processingType: 'clips',
    title: '',
    description: ''
  });

  const [isProcessing, setIsProcessing] = useState(false);

  const languages = [
    { code: 'english', name: 'English', flag: '🇬🇧' },
    { code: 'hindi', name: 'हिंदी', flag: '🇮🇳' },
    { code: 'spanish', name: 'Español', flag: '🇪🇸' },
    { code: 'french', name: 'Français', flag: '🇫🇷' },
    { code: 'german', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'japanese', name: '日本語', flag: '🇯🇵' },
    { code: 'korean', name: '한국어', flag: '🇰🇷' },
    { code: 'chinese', name: '中文', flag: '🇨🇳' },
    { code: 'arabic', name: 'العربية', flag: '🇸🇦' },
    { code: 'portuguese', name: 'Português', flag: '🇧🇷' }
  ];

  const platforms = [
    { id: 'youtube', name: 'YouTube', icon: '📺', color: '#FF0000' },
    { id: 'instagram', name: 'Instagram', icon: '📸', color: '#E1306C' },
    { id: 'facebook', name: 'Facebook', icon: '👥', color: '#1877F2' },
    { id: 'tiktok', name: 'TikTok', icon: '🎵', color: '#000000' }
  ];

  const handlePlatformToggle = (platformId) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platformId)
        ? prev.platforms.filter(p => p !== platformId)
        : [...prev.platforms, platformId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="video-creator-container">
      <motion.div 
        className="video-creator-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="creator-header">
          <div className="header-content">
            <h1 className="creator-title">
              <span className="gradient-text">Create AI Video</span>
            </h1>
            <p className="creator-subtitle">
              Transform your YouTube videos with AI dubbing and multi-platform publishing
            </p>
          </div>
          <div className="header-decoration">
            <div className="floating-icon">🎬</div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="creator-form">
          {/* Step 1: Video Input */}
          <motion.div 
            className="form-section"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="section-header">
              <span className="step-badge">Step 1</span>
              <h3>Video Source</h3>
            </div>
            
            <div className="input-group">
              <label className="input-label">
                <span className="label-icon">🔗</span>
                YouTube URL
              </label>
              <input
                type="url"
                className="input-field"
                placeholder="https://www.youtube.com/watch?v=..."
                value={formData.youtubeUrl}
                onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">
                <span className="label-icon">⚙️</span>
                Processing Type
              </label>
              <div className="radio-group">
                <label className={`radio-option ${formData.processingType === 'clips' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="processingType"
                    value="clips"
                    checked={formData.processingType === 'clips'}
                    onChange={(e) => setFormData({ ...formData, processingType: e.target.value })}
                  />
                  <div className="radio-content">
                    <span className="radio-icon">✂️</span>
                    <div>
                      <strong>Generate Clips</strong>
                      <p>AI-generated short clips</p>
                    </div>
                  </div>
                </label>
                
                <label className={`radio-option ${formData.processingType === 'full_video' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="processingType"
                    value="full_video"
                    checked={formData.processingType === 'full_video'}
                    onChange={(e) => setFormData({ ...formData, processingType: e.target.value })}
                  />
                  <div className="radio-content">
                    <span className="radio-icon">🎥</span>
                    <div>
                      <strong>Full Video</strong>
                      <p>Complete video dubbing</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </motion.div>

          {/* Step 2: Language */}
          <motion.div 
            className="form-section"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="section-header">
              <span className="step-badge">Step 2</span>
              <h3>Target Language</h3>
            </div>
            
            <div className="language-grid">
              {languages.map((lang) => (
                <label 
                  key={lang.code}
                  className={`language-card ${formData.targetLanguage === lang.code ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="language"
                    value={lang.code}
                    checked={formData.targetLanguage === lang.code}
                    onChange={(e) => setFormData({ ...formData, targetLanguage: e.target.value })}
                  />
                  <span className="language-flag">{lang.flag}</span>
                  <span className="language-name">{lang.name}</span>
                </label>
              ))}
            </div>
          </motion.div>

          {/* Step 3: Platforms */}
          <motion.div 
            className="form-section"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="section-header">
              <span className="step-badge">Step 3</span>
              <h3>Publishing Platforms</h3>
            </div>
            
            <div className="platform-grid">
              {platforms.map((platform) => (
                <button
                  key={platform.id}
                  type="button"
                  className={`platform-card ${formData.platforms.includes(platform.id) ? 'selected' : ''}`}
                  onClick={() => handlePlatformToggle(platform.id)}
                  style={{ '--platform-color': platform.color }}
                >
                  <span className="platform-icon">{platform.icon}</span>
                  <span className="platform-name">{platform.name}</span>
                  {formData.platforms.includes(platform.id) && (
                    <span className="platform-check">✓</span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Step 4: Branding (Optional) */}
          <motion.div 
            className="form-section"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="section-header">
              <span className="step-badge optional">Optional</span>
              <h3>Branding & Customization</h3>
            </div>
            
            <div className="branding-options">
              <div className="input-group">
                <label className="input-label">
                  <span className="label-icon">💧</span>
                  Watermark Text
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Your watermark text"
                  value={formData.branding.watermarkText}
                  onChange={(e) => setFormData({
                    ...formData,
                    branding: { ...formData.branding, watermarkText: e.target.value }
                  })}
                />
              </div>

              <div className="input-group">
                <label className="input-label">
                  <span className="label-icon">📍</span>
                  Watermark Position
                </label>
                <select
                  className="input-field"
                  value={formData.branding.watermarkPosition}
                  onChange={(e) => setFormData({
                    ...formData,
                    branding: { ...formData.branding, watermarkPosition: e.target.value }
                  })}
                >
                  <option value="top-left">Top Left</option>
                  <option value="top-right">Top Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="bottom-right">Bottom Right</option>
                  <option value="center">Center</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Submit Button */}
          <motion.div
            className="form-actions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <button 
              type="submit" 
              className={`submit-button ${isProcessing ? 'processing' : ''}`}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <span className="spinner"></span>
                  Processing...
                </>
              ) : (
                <>
                  <span>🚀</span>
                  Create AI Video
                </>
              )}
            </button>
            
            <p className="form-note">
              Processing time: 5-15 minutes depending on video length
            </p>
          </motion.div>
        </form>
      </motion.div>

      {/* Feature Cards */}
      <div className="feature-cards">
        {[
          { icon: '🤖', title: 'AI-Powered', desc: 'Advanced AI dubbing technology' },
          { icon: '🌍', title: '50+ Languages', desc: 'Support for major world languages' },
          { icon: '⚡', title: 'Fast Processing', desc: 'Quick turnaround time' },
          { icon: '🎨', title: 'Custom Branding', desc: 'Add your logo and watermark' }
        ].map((feature, index) => (
          <motion.div
            key={index}
            className="feature-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + index * 0.1 }}
          >
            <div className="feature-icon">{feature.icon}</div>
            <h4>{feature.title}</h4>
            <p>{feature.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default VideoCreator;