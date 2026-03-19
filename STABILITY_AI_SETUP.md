# ✨ Stability AI Image Generation Setup

## 🎯 Why Stability AI?
- ✅ **100% FREE** - 25 free images per day (no credit card required!)
- ✅ **No Billing Limits** - Unlike OpenAI DALL-E 3
- ✅ **High Quality** - Stable Diffusion v3 with excellent results
- ✅ **Official API** - Reliable and well-documented
- ✅ **Instant Setup** - Just 2 steps!

---

## 🚀 Setup Steps

### Step 1: Get Your FREE API Key
1. Go to [https://platform.stability.ai/account/api-key](https://platform.stability.ai/account/api-key)
2. Click "Create Account" (no credit card required!)
3. Sign up with email or Google
4. Copy your **API Key** (starts with `sk_`)

### Step 2: Add to Your .env
Edit `backend/.env` and add:
```bash
STABILITY_API_KEY=sk_your_actual_key_here
```

That's it! 🎉

---

## 📊 Free Tier Limits
| Feature | Free Tier | Upgrade |
|---------|----------|---------|
| Daily Credits | 25 images/day | Pay as you go |
| Quality | Stable Diffusion v3 | Premium models |
| Response Time | Normal | Priority |
| Support | Community | Email support |

---

## 🔧 Code Changes Made

### Backend (`/backend/core/ai_routes.py`)
- ✅ Replaced `openai` library with `requests` (already installed)
- ✅ Updated `generate_image()` endpoint to call Stability AI API
- ✅ Simplified quality mapping (auto → low → medium → high)
- ✅ Removed dependency on `httpx` version conflicts

### Files Updated
```
✅ backend/core/ai_routes.py     (ai_routes) - API implementation
✅ backend/requirements.txt       - Removed: openai==1.6.1, httpx==0.27.2
✅ backend/.env                  - Changed: OPENAI_API_KEY → STABILITY_API_KEY
✅ backend/.env.example          - Template updated
```

### Frontend (No Changes!)
- ✅ `AIGenerator.jsx` works exactly the same
- ✅ UI already supports quality: [auto, low, medium, high]
- ✅ All image sizes still supported: 1024x1024, 1792x1024, 1024x1792

---

## 🧪 Test It!

```bash
# 1. Ensure .env has STABILITY_API_KEY

# 2. Start backend
cd backend
python app.py

# 3. Go to Frontend
# http://localhost:5173/ai-generator

# 4. Generate an image:
# Prompt: "A futuristic robot painting a masterpiece"
# Size: 1024x1024
# Quality: Medium
```

### Expected Response
```json
{
  "success": true,
  "generation": {
    "id": 42,
    "prompt": "A futuristic robot painting...",
    "type": "image",
    "status": "completed",
    "model_used": "stable-diffusion-v3-medium",
    "generation_time_ms": 3200,
    "created_at": "2026-03-18T10:25:00Z"
  },
  "download_url": "data:image/png;base64,iVBORw0KGgoAAAAN..."
}
```

---

## ❓ FAQ

### Q: Will the 25 free images/day be enough?
**A:** For development & testing, absolutely! For production with many users, you'll need to upgrade ($0.75 per 1000 images).

### Q: Can I switch to something cheaper?
**A:** HuggingFace Inference API (~$0.001/image) or self-hosted Ollama (completely free, local only).

### Q: Does the frontend need changes?
**A:** No! All existing code works as-is.

### Q: What about video generation?
**A:** Still using Replicate API (unchanged).

### Q: How do I upgrade from free tier?
Go to [https://platform.stability.ai/account/billing](https://platform.stability.ai/account/billing) and add payment method.

---

## 🔗 Useful Links
- API Docs: https://platform.stability.ai/docs/api-reference
- Pricing: https://platform.stability.ai/pricing
- Models Available: https://platform.stability.ai/docs/concepts/models
- Community Discord: https://discord.gg/stablediffusion

---

## 📝 Migration Notes

**What was removed:**
- `openai==1.6.1` package (no longer needed)
- `httpx==0.27.2` (was causing version conflicts)
- OpenAI-specific error handling (RateLimitError, APIError)

**What was added:**
- `requests` POST call to Stability AI API
- Global `STABILITY_API_KEY` config
- Base64 image handling (Stability returns b64, not URLs)

**Backward Compatibility:**
- Frontend UI unchanged (same image sizes, quality options)
- Database schema unchanged (still stores base64 images)
- Error responses still use same HTTP status codes (400, 500, etc.)

---

## 🎨 Next Steps
1. ✅ Set `STABILITY_API_KEY` in `.env`
2. ✅ Restart backend: `python app.py`
3. ✅ Test image generation in frontend
4. 🚀 Deploy to production with confidence!

Happy generating! 🎉
