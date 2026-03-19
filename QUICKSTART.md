# 🚀 QUICKSTART GUIDE - Locaa AI

Get your AI video dubbing platform up and running in **10 minutes**!

---

## 📋 Prerequisites Check

Before you start, make sure you have:

- [x] **Python 3.10+** installed
  ```bash
  python --version
  ```

- [x] **Node.js 18+** installed
  ```bash
  node --version
  ```

- [x] **FFmpeg** installed and in PATH
  ```bash
  ffmpeg -version
  ```

- [x] **Git** installed
  ```bash
  git --version
  ```

---

## ⚡ Quick Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/ai-clipper.git
cd ai-clipper
```

### Step 2: Backend Setup (5 minutes)

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment configuration
copy .env.example .env  # Windows
# cp .env.example .env  # Mac/Linux
```

### Step 3: Configure Environment

Edit `backend/.env` with your API keys:

```env
# Minimal Configuration (for quick start)
FLASK_ENV=development
JWT_SECRET_KEY=your-random-secret-key-here

# OpenAI (REQUIRED for best quality dubbing)
OPENAI_API_KEY=sk-your-openai-api-key

# YouTube (OPTIONAL - for video publishing)
YOUTUBE_API_KEY=your-youtube-api-key

# Payment (OPTIONAL - can skip for testing)
STRIPE_SECRET_KEY=sk_test_your_stripe_key
```

**Getting OpenAI API Key:**
1. Visit: https://platform.openai.com/api-keys
2. Sign up/Login
3. Create new API key
4. Copy and paste into `.env`

### Step 4: Initialize Database

```bash
# While in backend directory with virtual environment activated
python
>>> from app import app, db
>>> with app.app_context():
...     db.create_all()
...     print("Database created!")
>>> exit()
```

### Step 5: Start Backend Server

```bash
# Make sure you're in backend directory
python app.py
```

You should see:
```
 * Running on http://127.0.0.1:5000
```

✅ **Backend is running!**

### Step 6: Frontend Setup (2 minutes)

**Open a NEW terminal window:**

```bash
# Navigate to frontend from project root
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

You should see:
```
  VITE ready in X ms
  ➜  Local:   http://localhost:5173/
```

✅ **Frontend is running!**

---

## 🎯 First Time Usage

### 1. Register Your Account

1. Open browser: http://localhost:5173
2. Click "Register"
3. Fill in:
   - Username: `testuser`
   - Email: `test@example.com`
   - Password: `Test123!`
4. Click "Create Account"

### 2. Login

1. Use the credentials you just created
2. Click "Login"
3. You'll be redirected to Dashboard

### 3. Create Your First Video

1. Click "**Create New Video**" button
2. Enter a YouTube URL:
   ```
   https://www.youtube.com/watch?v=dQw4w9WgXcQ
   ```
3. Select target language: **Hindi** or **English**
4. Choose platforms: **YouTube** (default)
5. Click "**Create AI Video**"

### 4. Monitor Progress

Watch real-time progress on your dashboard:
- ⬇️ Downloading video...
- 🎤 Transcribing audio...
- 🌍 Translating to target language...
- 🤖 Generating AI voiceover...
- 🎬 Creating final video...
- ✅ Complete!

### 5. Download Your Video

Once complete, click "**Download**" to get your dubbed video!

---

## 🔥 Testing Features

### Test AI Dubbing

**Simple Test:**
```python
cd backend
python

# In Python shell:
from core.tts_generator import TTSGenerator
import os

# Create instance
tts = TTSGenerator(openai_api_key=os.getenv('OPENAI_API_KEY'))

# Generate test audio
success = tts.generate(
    text="Hello, this is a test of AI dubbing!",
    output_path="test_audio.mp3",
    language="english"
)

print("Success!" if success else "Failed")
```

### Test Multi-Platform Publishing

**Via API:**
```bash
# First, get your JWT token after login
# Then test platform list:

curl http://localhost:5000/api/publish/platforms \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📱 API Quick Reference

### Authentication

**Register:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test123!"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'
```

Response will contain `access_token` - use this for authenticated requests.

### Create Video Job

```bash
curl -X POST http://localhost:5000/api/jobs/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "youtube_url": "https://youtube.com/watch?v=...",
    "target_language": "hindi",
    "processing_type": "clips",
    "platforms": ["youtube"]
  }'
```

### Check Job Status

```bash
curl http://localhost:5000/api/jobs/JOB_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🛠 Troubleshooting

### Backend won't start

**Error:** `ModuleNotFoundError: No module named 'flask'`
```bash
# Make sure virtual environment is activated
cd backend
venv\Scripts\activate  # Windows
source venv/bin/activate  # Mac/Linux

# Reinstall requirements
pip install -r requirements.txt
```

**Error:** `sqlite3.OperationalError: unable to open database file`
```bash
# Create instance directory
mkdir instance
python app.py
```

### Frontend won't start

**Error:** `npm: command not found`
```bash
# Install Node.js from https://nodejs.org/
# Then retry: npm install
```

**Error:** `EADDRINUSE: address already in use`
```bash
# Port 5173 is in use, kill the process or change port
npx vite --port 3000
```

### FFmpeg not found

**Windows:**
1. Download FFmpeg: https://ffmpeg.org/download.html
2. Extract to `C:\ffmpeg`
3. Add `C:\ffmpeg\bin` to PATH
4. Restart terminal

**Mac:**
```bash
brew install ffmpeg
```

**Linux:**
```bash
sudo apt install ffmpeg  # Ubuntu/Debian
sudo yum install ffmpeg  # CentOS/RHEL
```

### OpenAI API errors

**Error:** `Invalid API key`
- Check `.env` file has correct key starting with `sk-`
- Verify key at https://platform.openai.com/api-keys
- Ensure you have credits in your OpenAI account

**Error:** `Rate limit exceeded`
- You've hit API limits
- Upgrade OpenAI plan or wait
- System will fallback to Edge TTS automatically

---

## 🎓 Next Steps

### Learn More

1. **Read Full Documentation:** See [README.md](README.md)
2. **API Reference:** Check `/api/health` endpoint
3. **Customize Config:** Edit `backend/config.py`

### Add More Features

1. **Payment Integration:**
   - Add Stripe/Razorpay keys to `.env`
   - Test at http://localhost:5173/pricing

2. **Social Media Publishing:**
   - Configure Instagram/Facebook/TikTok tokens
   - Enable in `backend/.env`

3. **Custom Branding:**
   - Upload your logo in Dashboard
   - Configure watermark settings

### Deploy to Production

See [DEPLOYMENT.md](DEPLOYMENT.md) for:
- Docker deployment
- Nginx configuration
- SSL setup
- Database migration
- Production checklist

---

## 🆘 Getting Help

### Common Issues

| Issue | Solution |
|-------|----------|
| Video download fails | Check YouTube URL is valid and accessible |
| Dubbing quality poor | Use OpenAI TTS (add API key) instead of Edge TTS |
| Processing takes too long | Video length + number of clips affects time |
| Database locked error | Close any other processes using the DB |

### Support Channels

- **Documentation:** [/docs](./docs)
- **GitHub Issues:** Report bugs
- **Email:** support@locaaai.com
- **Discord:** Join community (link in README)

---

## ✅ Quick Start Checklist

- [ ] Python 3.10+ installed
- [ ] Node.js 18+ installed
- [ ] FFmpeg installed
- [ ] Repository cloned
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] `.env` file configured
- [ ] OpenAI API key added
- [ ] Database initialized
- [ ] Backend running on port 5000
- [ ] Frontend running on port 5173
- [ ] Test account created
- [ ] First video created successfully

---

## 🎉 You're All Set!

Your Locaa AI platform is now running locally. Start creating AI-dubbed videos!

**Quick Links:**
- 🏠 Dashboard: http://localhost:5173/dashboard
- 🎬 Create Video: http://localhost:5173/create
- 💎 Pricing Plans: http://localhost:5173/pricing
- 📊 API Health: http://localhost:5000/api/health

---

<div align="center">

**Having issues? Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)**

Made with ❤️ by Locaa AI Team

</div>
