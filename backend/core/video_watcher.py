import os
from core.youtube_detector import get_latest_video
from core.video_downloader import download_video
from core.clip_generator import generate_ai_clips
from core.reel_generator import make_pro_reel
from core.youtube_uploader import upload_short
from utils.text_utils import generate_title, generate_description
from database.db import load_db, save_db


BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
FULL_VIDEO_DIR = os.path.join(BASE_DIR, "videos", "full_videos")
REELS_DIR = os.path.join(BASE_DIR, "videos", "reels")


def check_new_video(channel_id):
    db = load_db()
    latest = get_latest_video(channel_id)

    if not latest:
        return None

    if db.get(channel_id) == latest["video_id"]:
        return None

    print("🎯 New video detected")

    # 1️⃣ Download
    download_video(latest["video_id"])

    # find downloaded video
    video_path = None
    for f in os.listdir(FULL_VIDEO_DIR):
        if f.lower().endswith(".mp4"):
            video_path = os.path.join(FULL_VIDEO_DIR, f)

    if not video_path:
        print("❌ Video not found")
        return None

    # 2️⃣ AI Clips
    clips = generate_ai_clips(video_path)

    os.makedirs(REELS_DIR, exist_ok=True)

    uploaded = []

    # 3️⃣ Reel + Upload
    for clip in clips[:2]:   # 👈 limit uploads (safe)
        reel = make_pro_reel(clip, REELS_DIR)

        title = generate_title(reel)
        desc = generate_description()

        video_id = upload_short(reel, title, desc)
        uploaded.append(video_id)

        print(f"🚀 Uploaded: {video_id}")

    db[channel_id] = latest["video_id"]
    save_db(db)

    return uploaded
