






# ffmpeg_utils.py

import subprocess
import os


# =======================
# AUDIO EXTRACT
# =======================
def extract_audio(video_path, audio_path):
    os.makedirs(os.path.dirname(audio_path), exist_ok=True)

    command = [
        "ffmpeg",
        "-y",
        "-i", video_path,
        "-vn",
        "-c:a", "libmp3lame",
        audio_path
    ]
    subprocess.run(command, check=True)


# =======================
# MAKE VERTICAL (9:16)
# =======================
def make_vertical(input_video, output_video):
    os.makedirs(os.path.dirname(output_video), exist_ok=True)

    command = [
        "ffmpeg",
        "-y",
        "-i", input_video,
        "-vf",
        "scale=1080:1920:force_original_aspect_ratio=decrease,"
        "pad=1080:1920:(ow-iw)/2:(oh-ih)/2",
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-movflags", "+faststart",
        output_video
    ]
    subprocess.run(command, check=True)


# =======================
# SLOW ZOOM EFFECT
# =======================
def add_slow_zoom(input_video, output_video):
    os.makedirs(os.path.dirname(output_video), exist_ok=True)

    command = [
        "ffmpeg",
        "-y",
        "-i", input_video,
        "-vf",
        "zoompan=z='min(zoom+0.0008,1.08)':"
        "d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'",
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-movflags", "+faststart",
        output_video
    ]
    subprocess.run(command, check=True)


# =======================
# BURN SRT SUBTITLES (FIXED)
# =======================
def burn_subtitles(input_video, srt_path, output_video):
    os.makedirs(os.path.dirname(output_video), exist_ok=True)

    srt_dir = os.path.dirname(srt_path)
    srt_name = os.path.basename(srt_path)

    command = [
        "ffmpeg",
        "-y",
        "-i", input_video,
        "-vf", f"subtitles={srt_name}",
        "-c:v", "libx264",
        "-c:a", "aac",
        "-movflags", "+faststart",
        output_video
    ]

    # 🔥 THIS IS THE KEY FIX
    subprocess.run(command, check=True, cwd=srt_dir)


# =======================
# BURN ASS SUBTITLES (FIXED 🔥)
# =======================
def burn_ass_subtitles(input_video, ass_path, output_video):
    os.makedirs(os.path.dirname(output_video), exist_ok=True)

    # ✅ Windows + FFmpeg SAFE
    ass_path = ass_path.replace("\\", "/")

    command = [
        "ffmpeg",
        "-y",
        "-i", input_video,
        "-vf", f"ass='{ass_path}'",
        "-c:v", "libx264",
        "-c:a", "aac",
        "-movflags", "+faststart",
        output_video
    ]

    subprocess.run(command, check=True)
