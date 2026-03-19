# 🚀 Locaa AI - AI-Powered Video Dubbing & Multi-Platform Publishing SaaS

<div align="center">

![Locaa AI Logo](frontend/src/images/logo.png)

**Transform YouTube videos with AI dubbing and publish across multiple platforms**

[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://reactjs.org/)
[![Flask](https://img.shields.io/badge/Flask-3.0+-000000.svg)](https://flask.palletsprojects.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)]()

</div>

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Contributing](#-contributing)

---

## ✨ Features

### 🎯 Core Features

- **🤖 AI-Powered Video Dubbing**
  - Support for 50+ languages (Hindi, English, Spanish, French, German, Japanese, Korean, Chinese, Arabic, and more)
  - OpenAI TTS (Premium HD quality) with fallback to Edge TTS
  - Natural voice synthesis with emotion preservation
  - Multi-speaker detection and voice mapping

- **📺 Multi-Platform Publishing**
  - **YouTube** - Shorts & full videos
  - **Instagram** - Reels & IGTV
  - **Facebook** - Native video posts
  - **TikTok** - Short-form content
  - One-click publish to all platforms

- **🎨 Advanced Branding**
  - Custom logo overlay with position control
  - Text watermarks with opacity settings
  - Intro/outro video insertion
  - Thumbnail generation with branding
  - White-label capabilities

- **💼 SaaS Platform Features**
  - Multi-tier subscriptions (Free, Pro, Business)
  - User authentication & authorization (JWT)
  - Payment integration (Stripe & Razorpay)
  - Usage tracking & analytics
  - API access for Pro+ users
  - Team collaboration (Business plan)

- **⚡ Smart Processing**
  - AI-powered clip generation
  - Automatic scene detection
  - Intelligent subtitle placement
  - Background job queue (Celery + Redis)
  - Real-time progress tracking

### 📊 Subscription Plans

| Feature | Free | Pro | Business |
|---------|------|-----|----------|
| Videos/month | 5 | 50 | Unlimited |
| Clips per video | 3 | 10 | Unlimited |
| Languages | 2 | 50+ | All |
| Platforms | YouTube | YouTube, Instagram, Facebook | All Platforms |
| Custom Branding | ❌ | ✓ | ✓ |
| API Access | ❌ | ✓ | ✓ |
| Priority Support | ❌ | ✓ | ✓ |
| Price | Free | ₹999/mo | ₹2,999/mo |

---

## 🛠 Tech Stack

### Backend
- **Framework**: Flask 3.0+
- **Database**: SQLAlchemy (SQLite/PostgreSQL)
- **Authentication**: JWT (Flask-JWT-Extended)
- **AI/ML**: 
  - OpenAI Whisper (Transcription)
  - OpenAI TTS (Text-to-Speech)
  - Deep Translator (Translation)
- **Video Processing**: FFmpeg, MoviePy, OpenCV
- **Payment**: Stripe, Razorpay
- **Email**: Flask-Mail (SMTP)
- **Background Jobs**: Celery + Redis

### Frontend
- **Framework**: React 18+ with Vite
- **Routing**: React Router v6
- **State Management**: Context API
- **Styling**: CSS3 with custom design system
- **Animations**: Framer Motion
- **HTTP Client**: Axios

### Infrastructure
- **Storage**: Local filesystem (can integrate S3/CloudFlare)
- **Deployment**: Docker, Gunicorn, Nginx
- **CI/CD**: GitHub Actions (recommended)
- **Monitoring**: Custom logging system

---

## 🏗 Architecture

```
ai-clipper/
├── backend/
│   ├── app.py                          # Main Flask application
│   ├── config.py                       # Comprehensive configuration
│   ├── requirements.txt                # Python dependencies
│   ├── core/                           # Core modules
│   │   ├── video_downloader.py         # YouTube video download
│   │   ├── video_dubber.py             # Video dubbing pipeline
│   │   ├── tts_generator.py            # AI Text-to-Speech (OpenAI + Edge)
│   │   ├── transcription.py            # Audio transcription (Whisper)
│   │   ├── translation.py              # Multi-language translation
│   │   ├── clip_generator.py           # AI clip generation
│   │   ├── branding_engine.py          # Logo, watermark, intro/outro
│   │   ├── multi_platform_publisher.py # Multi-platform publishing
│   │   ├── youtube_uploader.py         # YouTube API integration
│   │   ├── auth_routes.py              # Authentication endpoints
│   │   ├── payment_routes.py           # Payment processing
│   │   ├── admin_routes.py             # Admin dashboard
│   │   └── ...
│   ├── database/
│   │   ├── models.py                   # SQLAlchemy models
│   │   └── db.py                       # Database utilities
│   ├── utils/
│   │   ├── auth.py                     # Auth decorators
│   │   ├── logger.py                   # Logging utilities
│   │   └── ...
│   └── credentials/
│       └── client_secret.json          # Google OAuth credentials
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── VideoCreator.jsx        # Modern video creation UI
│   │   │   ├── DashboardAdvanced.jsx   # Main dashboard
│   │   │   ├── Login.jsx               # Authentication
│   │   │   └── ...
│   │   ├── context/
│   │   │   └── AuthContext.jsx         # Global auth state
│   │   ├── App.jsx                     # Main React app
│   │   └── main.jsx                    # Entry point
│   ├── package.json
│   └── vite.config.js
│
├── videos/                             # Video storage
│   ├── full_videos/                    # Downloaded videos
│   ├── clips/                          # Generated clips
│   ├── reels/                          # Short-form content
│   └── temp/                           # Temporary files
│
├── logs/                               # Application logs
└── instance/                           # Instance-specific files
```

---

## 🚀 Installation

### Prerequisites

- Python 3.10+
- Node.js 18+
- FFmpeg installed and in PATH
- Redis (for background jobs)
- PostgreSQL (optional, SQLite works for dev)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ai-clipper.git
   cd ai-clipper
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

4. **Environment Configuration**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your API keys and configuration
   ```

5. **Run the Application**

   **Terminal 1 - Backend:**
   ```bash
   cd backend
   python app.py
   ```

   **Terminal 2 - Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

6. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# ==================== FLASK & DATABASE ====================
FLASK_ENV=development
DATABASE_URL=sqlite:///locaa_ai.db
# DATABASE_URL=postgresql://user:password@localhost:5432/locaa_ai

# ==================== JWT & SECURITY ====================
JWT_SECRET_KEY=your-super-secret-key-change-in-production

# ==================== AI SERVICES ====================
OPENAI_API_KEY=sk-your-openai-api-key-here
YOUTUBE_API_KEY=your-youtube-api-key

# ==================== PAYMENT GATEWAYS ====================
# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key

# Razorpay (for India)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret

# ==================== EMAIL ====================
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_DEFAULT_SENDER=noreply@locaaai.com

# ==================== SOCIAL MEDIA ====================
INSTAGRAM_ACCESS_TOKEN=your_instagram_token
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_business_account
FACEBOOK_ACCESS_TOKEN=your_facebook_token
FACEBOOK_PAGE_ID=your_page_id
TIKTOK_CLIENT_KEY=your_tiktok_key
TIKTOK_CLIENT_SECRET=your_tiktok_secret

# ==================== OPTIONAL ====================
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

### Getting API Keys

1. **OpenAI API Key**
   - Visit: https://platform.openai.com/api-keys
   - Create account and generate API key
   - Add credits for usage

2. **YouTube API**
   - Visit: https://console.cloud.google.com
   - Create project and enable YouTube Data API v3
   - Create credentials (OAuth 2.0 Client ID)
   - Download `client_secret.json` to `backend/credentials/`

3. **Stripe**
   - Visit: https://dashboard.stripe.com/apikeys
   - Get test keys for development
   - Configure webhook for payments

4. **Razorpay** (Optional, for India)
   - Visit: https://dashboard.razorpay.com/app/keys
   - Generate API keys

---

## 📖 Usage

### Creating Your First Video

1. **Register/Login**
   - Navigate to http://localhost:5173/register
   - Create your account
   - Verify email (if configured)

2. **Create Video Job**
   - Go to Dashboard
   - Enter YouTube URL
   - Select target language
   - Choose publishing platforms
   - Add branding (optional)
   - Click "Create AI Video"

3. **Monitor Progress**
   - Real-time progress tracking
   - Download/publish %, stage updates
   - Email notification on completion

4. **Publish**
   - Auto-publish if configured
   - Manual publish option
   - Download dubbed video

### Using the API

**Authentication:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "yourpassword"}'
```

**Create Job:**
```bash
curl -X POST http://localhost:5000/api/jobs/create \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "youtube_url": "https://youtube.com/watch?v=...",
    "target_language": "hindi",
    "platforms": ["youtube", "instagram"],
    "processing_type": "clips"
  }'
```

**Get Job Status:**
```bash
curl -X GET http://localhost:5000/api/jobs/JOB_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/logout` | User logout |
| GET | `/api/auth/me` | Get current user |

### Job Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/jobs/create` | Create new video job |
| GET | `/api/jobs` | List user's jobs |
| GET | `/api/jobs/:id` | Get job details |
| GET | `/api/jobs/:id/progress` | Real-time progress |
| POST | `/api/jobs/:id/publish` | Publish to platforms |
| DELETE | `/api/jobs/:id` | Delete job |

### Payment Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payment/create-checkout` | Create payment session |
| POST | `/api/payment/webhook` | Payment webhook |
| GET | `/api/payment/plans` | Get subscription plans |

---

## 🚢 Deployment

### Docker Deployment

```dockerfile
# Dockerfile example
FROM python:3.10-slim

WORKDIR /app

# Install FFmpeg
RUN apt-get update && apt-get install -y ffmpeg

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY backend/ .

# Run application
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
```

### Production Checklist

- [ ] Set `FLASK_ENV=production`
- [ ] Use PostgreSQL instead of SQLite
- [ ] Configure Redis for Celery
- [ ] Set up SSL/HTTPS
- [ ] Configure CDN for videos (S3/CloudFlare)
- [ ] Set up monitoring (Sentry)
- [ ] Configure backups
- [ ] Set up rate limiting
- [ ] Configure email service
- [ ] Test payment webhooks
- [ ] Set up CI/CD pipeline

---

## 🎯 Roadmap

### Phase 1 (Current)
- [x] AI Video Dubbing
- [x] Multi-platform Publishing
- [x] SaaS Features
- [x] Payment Integration
- [x] Branding System

### Phase 2 (Next)
- [ ] Batch processing
- [ ] Team collaboration
- [ ] Advanced analytics
- [ ] Mobile app (React Native)
- [ ] Voice cloning
- [ ] API webhooks

### Phase 3 (Future)
- [ ] White-label solution
- [ ] Marketplace for templates
- [ ] AI video generation
- [ ] Live streaming dubbing
- [ ] Blockchain integration

---

## 🤝 Contributing

This is a proprietary project. For contributions, please contact the project owner.

---

## 📄 License

Proprietary - All rights reserved © 2025 Locaa AI

---

## 📞 Support

- **Email**: support@locaaai.com
- **Documentation**: https://docs.locaaai.com
- **Website**: https://locaaai.com

---

## 🙏 Acknowledgements

- OpenAI for Whisper and TTS APIs
- Google for YouTube API
- FFmpeg community
- Open-source contributors

---

<div align="center">

**Made with ❤️ by the Locaa AI Team**

[Website](https://locaaai.com) • [Documentation](https://docs.locaaai.com) • [Blog](https://blog.locaaai.com)

</div>
