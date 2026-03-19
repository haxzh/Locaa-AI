


# #  reel.generator.py
# import os
# from utils.ffmpeg_utils import (
#     make_vertical,
#     add_slow_zoom,
#     burn_subtitles,
#     burn_ass_subtitles,
#     extract_audio
# )
# from core.clip_generator import transcribe_audio
# from core.subtitle_generator import generate_srt, generate_ass_subtitles


# BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
# VIDEO_DIR = os.path.join(BASE_DIR, "videos")


# # -------- BASIC REEL --------
# def make_reel(clip_path, output_dir):
#     base = os.path.splitext(os.path.basename(clip_path))[0]
#     temp = os.path.join(VIDEO_DIR, "temp_reels")

#     os.makedirs(temp, exist_ok=True)
#     os.makedirs(output_dir, exist_ok=True)

#     mp3 = os.path.join(temp, f"{base}.mp3")
#     srt = os.path.join(temp, f"{base}.srt")

#     vertical = os.path.join(temp, f"{base}_v.mp4")
#     with_subs = os.path.join(temp, f"{base}_subs.mp4")
#     final = os.path.join(output_dir, f"{base}_REEL.mp4")

#     # 1️⃣ audio → whisper
#     extract_audio(clip_path, mp3)
#     result = transcribe_audio(mp3)

#     # 2️⃣ subtitles
#     generate_srt(result["segments"], srt)

#     # 3️⃣ effects
#     make_vertical(clip_path, vertical)
#     burn_subtitles(vertical, srt, with_subs)
#     add_slow_zoom(with_subs, final)

#     return final


# # -------- PRO REEL --------
# def make_pro_reel(clip_path, output_dir):
#     base = os.path.splitext(os.path.basename(clip_path))[0]
#     temp = os.path.join(VIDEO_DIR, "temp_reels")

#     os.makedirs(temp, exist_ok=True)
#     os.makedirs(output_dir, exist_ok=True)

#     mp3 = os.path.join(temp, f"{base}.mp3")
#     ass = os.path.join(temp, f"{base}.ass")

#     vertical = os.path.join(temp, f"{base}_v.mp4")
#     zoomed = os.path.join(temp, f"{base}_z.mp4")
#     final = os.path.join(output_dir, f"{base}_PRO.mp4")

#     # 1️⃣ audio → whisper
#     extract_audio(clip_path, mp3)
#     result = transcribe_audio(mp3)

#     # 2️⃣ ASS subtitles
#     generate_ass_subtitles(result, ass)

#     # 3️⃣ effects
#     make_vertical(clip_path, vertical)
#     add_slow_zoom(vertical, zoomed)
#     burn_ass_subtitles(zoomed, ass, final)

#     return final







# core/reel_generator.py

import os
from utils.ffmpeg_utils import (
    make_vertical,
    add_slow_zoom,
    burn_subtitles,
    extract_audio
)
from core.clip_generator import transcribe_audio
from core.subtitle_generator import generate_srt


BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
VIDEO_DIR = os.path.join(BASE_DIR, "videos")


# ======================================
# BASIC REEL (VERTICAL + SUBS + ZOOM)
# ======================================
def make_reel(clip_path, output_dir):
    base = os.path.splitext(os.path.basename(clip_path))[0]

    temp_dir = os.path.join(VIDEO_DIR, "temp_reels")
    os.makedirs(temp_dir, exist_ok=True)
    os.makedirs(output_dir, exist_ok=True)

    # paths
    mp3 = os.path.join(temp_dir, f"{base}.mp3")
    srt = os.path.join(temp_dir, f"{base}.srt")

    vertical = os.path.join(temp_dir, f"{base}_v.mp4")
    with_subs = os.path.join(temp_dir, f"{base}_subs.mp4")
    final = os.path.join(output_dir, f"{base}_REEL.mp4")

    # 1️⃣ Extract audio
    extract_audio(clip_path, mp3)

    # 2️⃣ Whisper
    result = transcribe_audio(mp3)
    if not result or "segments" not in result:
        print("❌ No subtitles generated")
        return None

    # 3️⃣ Generate SRT
    generate_srt(result["segments"], srt)

    # 4️⃣ Video effects
    make_vertical(clip_path, vertical)
    burn_subtitles(vertical, srt, with_subs)
    add_slow_zoom(with_subs, final)

    return final


# ======================================
# PRO REEL (same but different name)
# ======================================
def make_pro_reel(clip_path, output_dir):
    base = os.path.splitext(os.path.basename(clip_path))[0]

    temp_dir = os.path.join(VIDEO_DIR, "temp_reels")
    os.makedirs(temp_dir, exist_ok=True)
    os.makedirs(output_dir, exist_ok=True)

    # paths
    mp3 = os.path.join(temp_dir, f"{base}.mp3")
    srt = os.path.join(temp_dir, f"{base}.srt")

    vertical = os.path.join(temp_dir, f"{base}_v.mp4")
    zoomed = os.path.join(temp_dir, f"{base}_z.mp4")
    final = os.path.join(output_dir, f"{base}_PRO.mp4")

    # 1️⃣ Extract audio
    extract_audio(clip_path, mp3)

    # 2️⃣ Whisper
    result = transcribe_audio(mp3)
    if not result or "segments" not in result:
        print("❌ No subtitles generated")
        return None

    # 3️⃣ Generate SRT
    generate_srt(result["segments"], srt)

    # 4️⃣ Effects
    make_vertical(clip_path, vertical)
    add_slow_zoom(vertical, zoomed)
    burn_subtitles(zoomed, srt, final)

    return final
