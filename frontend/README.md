# AI Clipper - React Frontend

A beautiful React frontend for the AI Auto Clipper application.

## 🚀 Features

- ✅ Paste YouTube links directly
- ✅ Upload your custom logo
- ✅ Real-time processing status tracking
- ✅ Auto-publish to YouTube Shorts
- ✅ Auto-publish to Instagram (coming soon)
- ✅ Professional UI with animations

## 🛠️ Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

The frontend runs on `http://localhost:3000` and communicates with the Flask backend on `http://localhost:5000`.

## 📁 Project Structure

```
src/
├── components/
│   ├── InputForm.jsx      # YouTube URL input component
│   ├── LogoUpload.jsx     # Logo upload component
│   ├── PublishSection.jsx # Publishing options
│   └── StatusTracker.jsx  # Job status display
├── App.jsx                # Main app component
├── main.jsx               # React entry point
└── index.css              # Global styles

```

## 🔧 Configuration

Edit `vite.config.js` to change the backend API URL:

```javascript
proxy: {
  '/api': {
    target: 'http://localhost:5000', // Change this if backend is on different port
    changeOrigin: true,
  }
}
```

## 📡 API Endpoints Used

- `POST /api/process-video` - Start video processing
- `GET /api/status/{job_id}` - Get job status
- `POST /api/upload-logo` - Upload logo
- `POST /api/publish` - Publish video
- `GET /api/jobs` - Get all jobs

## 📝 License

MIT
