# import whisper
# import subprocess
# import os
# from utils.ffmpeg_utils import extract_audio

# # Load whisper model once
# model = whisper.load_model("base")


# def transcribe_audio(audio_path):
#     result = model.transcribe(audio_path)
#     return result["segments"]


# def get_highlight_segments(segments, min_len=5, max_len=30):
#     highlights = []
#     current_start = None
#     current_end = None

#     for seg in segments:
#         duration = seg["end"] - seg["start"]

#         if duration >= min_len:
#             if current_start is None:
#                 current_start = seg["start"]
#             current_end = seg["end"]

#             if current_end - current_start >= max_len:
#                 highlights.append((current_start, current_end))
#                 current_start = None
#                 current_end = None
#         else:
#             if current_start is not None and current_end is not None:
#                 highlights.append((current_start, current_end))
#             current_start = None
#             current_end = None

#     # ✅ VERY IMPORTANT: last segment add
#     if current_start is not None and current_end is not None:
#         highlights.append((current_start, current_end))

#     return highlights


# def create_clips(video_path, segments, output_dir):
#     os.makedirs(output_dir, exist_ok=True)
#     clips = []

#     for i, (start, end) in enumerate(segments):
#         output = os.path.join(output_dir, f"clip_{i+1}.mp4")

#         command = [
#             "ffmpeg",
#             "-y",
#             "-i", video_path,
#             "-ss", str(start),
#             "-to", str(end),
#             "-c", "copy",
#             output
#         ]

#         subprocess.run(command, check=True)
#         clips.append(output)

#     return clips


# def generate_ai_clips(video_path):
#     base = os.path.splitext(os.path.basename(video_path))[0]

#     BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
#     VIDEO_DIR = os.path.join(BASE_DIR, "videos")

#     CLIPS_DIR = os.path.join(VIDEO_DIR, "clips")
#     TEMP_AUDIO_DIR = os.path.join(VIDEO_DIR, "temp")

#     os.makedirs(CLIPS_DIR, exist_ok=True)
#     os.makedirs(TEMP_AUDIO_DIR, exist_ok=True)

#     audio_path = os.path.join(TEMP_AUDIO_DIR, f"{base}.mp3")

#     extract_audio(video_path, audio_path)

#     segments = transcribe_audio(audio_path)
#     highlights = get_highlight_segments(segments)

#     clips = create_clips(video_path, highlights, CLIPS_DIR)

#     # 🔥 fallback
#     if not highlights:
#         print("No highlights found,creating default clip.")
#         highlights = [(0, min(30, segments[-1]['end']))]

#     return clips






import whisper
import subprocess
import os
from utils.ffmpeg_utils import extract_audio

# Load model once
model = whisper.load_model("base")


def _normalize_placement(raw_value):
    value = (raw_value or 'Top-Left').strip().lower()
    mapping = {
        'top-left': 'top-left',
        'top-right': 'top-right',
        'bottom-left': 'bottom-left',
        'bottom-right': 'bottom-right',
    }
    return mapping.get(value, 'top-left')


def _overlay_coords(placement, margin=16):
    if placement == 'top-right':
        return f"main_w-overlay_w-{margin}", str(margin)
    if placement == 'bottom-left':
        return str(margin), f"main_h-overlay_h-{margin}"
    if placement == 'bottom-right':
        return f"main_w-overlay_w-{margin}", f"main_h-overlay_h-{margin}"
    return str(margin), str(margin)


def _drawtext_coords(placement, margin=24):
    if placement == 'top-right':
        return f"w-tw-{margin}", str(margin)
    if placement == 'bottom-left':
        return str(margin), f"h-th-{margin}"
    if placement == 'bottom-right':
        return f"w-tw-{margin}", f"h-th-{margin}"
    return str(margin), str(margin)


def _escape_drawtext(value):
    text = str(value or '')
    text = text.replace('\\', r'\\')
    text = text.replace(':', r'\:')
    text = text.replace("'", r"\'")
    text = text.replace('%', r'\%')
    return text


# =========================
# TRANSCRIBE (FULL RESULT)
# =========================
def transcribe_audio(audio_path):
    return model.transcribe(
        audio_path,
        word_timestamps=True
    )


# =========================
# SMART HIGHLIGHT LOGIC
# =========================
def get_highlight_segments(
    segments,
    min_len=20,
    max_len=40,
    merge_gap=1.2
):
    highlights = []
    current_start = None
    current_end = None

    for seg in segments:
        start = seg["start"]
        end = seg["end"]

        if current_start is None:
            current_start = start
            current_end = end
            continue

        # merge nearby segments
        if start - current_end <= merge_gap:
            current_end = end
        else:
            duration = current_end - current_start
            if duration >= min_len:
                if duration > max_len:
                    current_end = current_start + max_len
                highlights.append((current_start, current_end))

            current_start = start
            current_end = end

    # last segment
    if current_start is not None:
        duration = current_end - current_start
        if duration >= min_len:
            if duration > max_len:
                current_end = current_start + max_len
            highlights.append((current_start, current_end))

    return highlights


# =========================
# CREATE CLIPS (AUDIO SAFE)
# =========================
def create_clips(video_path, segments, output_dir, branding_config=None, base_name=""):
    os.makedirs(output_dir, exist_ok=True)
    clips = []

    config = branding_config or {}
    placement = _normalize_placement(config.get('logo_placement', 'Top-Left'))
    try:
        opacity_raw = int(config.get('logo_opacity', 70))
    except Exception:
        opacity_raw = 70
    opacity = max(0, min(100, opacity_raw)) / 100.0
    logo_path = config.get('logo_path')
    brand_label = (config.get('brand_label') or '').strip()

    # Resolve any relative path so ffmpeg can read it consistently.
    if logo_path and not os.path.isabs(logo_path):
        backend_root = os.path.dirname(os.path.dirname(__file__))
        logo_path = os.path.abspath(os.path.join(backend_root, logo_path))

    has_logo = bool(logo_path and os.path.exists(logo_path))

    for i, (start, end) in enumerate(segments):
        duration = end - start
        safe_base = base_name if base_name else "clip"
        output = os.path.join(output_dir, f"{safe_base}_{i+1}.mp4")

        command = [
            "ffmpeg",
            "-y",
            "-ss", str(start),
            "-t", str(duration),
            "-i", video_path,

            # Optional branding input.
            *(["-i", logo_path] if has_logo else []),

            # 🎬 VIDEO
            "-c:v", "libx264",
            "-preset", "veryfast",
            "-pix_fmt", "yuv420p",

            # 🔊 AUDIO
            "-c:a", "aac",
            "-b:a", "128k",

            "-movflags", "+faststart",
        ]

        filter_steps = []
        final_video_label = "0:v"

        if has_logo:
            x, y = _overlay_coords(placement)
            filter_steps.append(f"[1:v]format=rgba,colorchannelmixer=aa={opacity:.2f}[wm]")
            filter_steps.append(f"[0:v][wm]overlay={x}:{y}:format=auto[v1]")
            final_video_label = "v1"

        if brand_label:
            text_x, text_y = _drawtext_coords(placement)
            escaped = _escape_drawtext(brand_label)
            filter_steps.append(
                f"[{final_video_label}]drawtext=text='{escaped}':"
                f"x={text_x}:y={text_y}:fontsize=28:fontcolor=white:borderw=2:bordercolor=black@0.55[vout]"
            )
            final_video_label = "vout"

        if filter_steps:
            command.extend(["-filter_complex", ";".join(filter_steps), "-map", f"[{final_video_label}]", "-map", "0:a?"])

        command.append(output)

        subprocess.run(command, check=True)
        clips.append(output)

    return clips


# =========================
# MAIN PIPELINE
# =========================
def generate_ai_clips(video_path, branding_config=None):
    base = os.path.splitext(os.path.basename(video_path))[0]

    BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    VIDEO_DIR = os.path.join(BASE_DIR, "videos")

    CLIPS_DIR = os.path.join(VIDEO_DIR, "clips")
    TEMP_AUDIO_DIR = os.path.join(VIDEO_DIR, "temp")

    os.makedirs(CLIPS_DIR, exist_ok=True)
    os.makedirs(TEMP_AUDIO_DIR, exist_ok=True)

    audio_path = os.path.join(TEMP_AUDIO_DIR, f"{base}.mp3")

    # 1️⃣ extract audio
    extract_audio(video_path, audio_path)

    # 2️⃣ whisper (FULL RESULT)
    result = transcribe_audio(audio_path)

    if not result or "segments" not in result:
        print("❌ No speech detected")
        return []

    segments = result["segments"]

    # 3️⃣ AI highlights
    highlights = get_highlight_segments(segments)

    # 🔥 fallback: guaranteed clip
    if not highlights:
        print("⚠️ No AI highlights found, using default 30 sec")
        end_time = min(30, segments[-1]["end"])
        highlights = [(0, end_time)]

    # 4️⃣ create raw clips
    raw_clips = create_clips(video_path, highlights, CLIPS_DIR, branding_config=branding_config, base_name=base)

    # 5️⃣ Convert to TikTok/Reels format (Vertical + Subs)
    try:
        from core.reel_generator import make_reel
        final_clips = []
        for rc in raw_clips:
            print(f"🎬 Enhancing raw clip into TikTok format: {rc}")
            final = make_reel(rc, CLIPS_DIR)
            if final and os.path.exists(final):
                final_clips.append(final)
                try:
                    os.remove(rc)
                except:
                    pass
            else:
                final_clips.append(rc)
        clips = final_clips
    except Exception as e:
        print(f"⚠️ Error converting to reels format: {e}, falling back to raw clips.")
        clips = raw_clips

    return clips
