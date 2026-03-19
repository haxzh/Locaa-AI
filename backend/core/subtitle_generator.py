# import os
# from utils.ffmpeg_utils import make_vertical, burn_subtitles, add_slow_zoom
# from core.clip_generator import transcribe_audio
# from core.subtitle_generator import generate_srt  # same file import safe


# def generate_srt(segments, srt_path):
#     os.makedirs(os.path.dirname(srt_path), exist_ok=True)

#     def fmt(t):
#         h = int(t // 3600)
#         m = int((t % 3600) // 60)
#         s = int(t % 60)
#         ms = int((t - int(t)) * 1000)
#         return f"{h:02}:{m:02}:{s:02},{ms:03}"

#     with open(srt_path, "w", encoding="utf-8") as f:
#         for i, seg in enumerate(segments, 1):
#             f.write(f"{i}\n")
#             f.write(f"{fmt(seg['start'])} --> {fmt(seg['end'])}\n")
#             f.write(seg["text"].strip() + "\n\n")

# import os

# def generate_ass_subtitles(result, ass_path):
#     os.makedirs(os.path.dirname(ass_path), exist_ok=True)

#     header = """[Script Info]
# ScriptType: v4.00+
# PlayResX: 1080
# PlayResY: 1920

# [V4+ Styles]
# Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
# Style: Default,Montserrat,60,&H00FFFFFF,&H0000FFFF,&H00000000,&H64000000,1,0,0,0,100,100,0,0,1,3,0,2,50,50,200,1

# [Events]
# Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
# """

#     def ts(t):
#         h = int(t // 3600)
#         m = int((t % 3600) // 60)
#         s = t % 60
#         return f"{h}:{m:02}:{s:05.2f}"

#     with open(ass_path, "w", encoding="utf-8") as f:
#         f.write(header)

#         for seg in result["segments"]:
#             words = seg.get("words", [])
#             for w in words:
#                 start = ts(w["start"])
#                 end = ts(w["end"])
#                 text = w["word"].replace("{", "").replace("}", "")
#                 line = (
#                     f"Dialogue: 0,{start},{end},Default,,0,0,0,,"
#                     f"{{\\c&H00FFFF&}}{text}"
#                 )
#                 f.write(line + "\n")



# def make_reel(clip_path, output_dir):
#     base = os.path.splitext(os.path.basename(clip_path))[0]

#     BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
#     VIDEO_DIR = os.path.join(BASE_DIR, "videos")

#     temp_dir = os.path.join(VIDEO_DIR, "temp_reels")
#     os.makedirs(temp_dir, exist_ok=True)
#     os.makedirs(output_dir, exist_ok=True)

#     vertical = os.path.join(temp_dir, f"{base}_vertical.mp4")
#     with_subs = os.path.join(temp_dir, f"{base}_subs.mp4")
#     final = os.path.join(output_dir, f"{base}_REEL.mp4")
#     srt = os.path.join(temp_dir, f"{base}.srt")

#     # 1) subtitles
#     segments = transcribe_audio(clip_path.replace(".mp4",".mp3")) if False else None
#     # NOTE: If you already have segments from STEP 4, pass them here directly.
#     # For now, assume you saved segments earlier; else re-transcribe clip audio.

#     # If re-transcribing clip audio:
#     # from utils.ffmpeg_utils import extract_audio
#     # extract_audio(clip_path, clip_mp3)
#     # segments = transcribe_audio(clip_mp3)

#     # Placeholder safety (skip if segments missing)
#     if segments:
#         generate_srt(segments, srt)
#         make_vertical(clip_path, vertical)
#         burn_subtitles(vertical, srt, with_subs)
#         add_slow_zoom(with_subs, final)
#     else:
#         # If no subtitles, at least vertical + zoom
#         make_vertical(clip_path, vertical)
#         add_slow_zoom(vertical, final)

#     return final


# from core.subtitle_generator import generate_ass_subtitles
# from utils.ffmpeg_utils import make_vertical, add_slow_zoom, burn_ass_subtitles
# from utils.ffmpeg_utils import extract_audio

# def make_pro_reel(clip_path, output_dir):
#     base = os.path.splitext(os.path.basename(clip_path))[0]

#     BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
#     VIDEO_DIR = os.path.join(BASE_DIR, "videos")

#     temp = os.path.join(VIDEO_DIR, "temp_reels")
#     os.makedirs(temp, exist_ok=True)
#     os.makedirs(output_dir, exist_ok=True)

#     mp3 = os.path.join(temp, f"{base}.mp3")
#     ass = os.path.join(temp, f"{base}.ass")
#     vertical = os.path.join(temp, f"{base}_v.mp4")
#     zoomed = os.path.join(temp, f"{base}_z.mp4")
#     final = os.path.join(output_dir, f"{base}_PRO.mp4")

#     # audio → whisper
#     extract_audio(clip_path, mp3)
#     result = transcribe_audio(mp3)

#     # subtitles
#     generate_ass_subtitles(result, ass)

#     # effects
#     make_vertical(clip_path, vertical)
#     add_slow_zoom(vertical, zoomed)
#     burn_ass_subtitles(zoomed, ass, final)

#     return final


import os

# -------- BASIC SRT --------
def generate_srt(segments, srt_path):
    os.makedirs(os.path.dirname(srt_path), exist_ok=True)

    def fmt(t):
        h = int(t // 3600)
        m = int((t % 3600) // 60)
        s = int(t % 60)
        ms = int((t - int(t)) * 1000)
        return f"{h:02}:{m:02}:{s:02},{ms:03}"

    with open(srt_path, "w", encoding="utf-8") as f:
        for i, seg in enumerate(segments, 1):
            f.write(f"{i}\n")
            f.write(f"{fmt(seg['start'])} --> {fmt(seg['end'])}\n")
            f.write(seg["text"].strip() + "\n\n")


# -------- PRO ASS (WORD BY WORD) --------
def generate_ass_subtitles(result, ass_path):
    os.makedirs(os.path.dirname(ass_path), exist_ok=True)

    header = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,60,&H00FFFFFF,&H0000FFFF,&H00000000,&H64000000,1,0,0,0,100,100,0,0,1,3,0,2,50,50,200,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

    def ts(t):
        h = int(t // 3600)
        m = int((t % 3600) // 60)
        s = t % 60
        return f"{h}:{m:02}:{s:05.2f}"

    with open(ass_path, "w", encoding="utf-8") as f:
        f.write(header)
        for seg in result["segments"]:
            for w in seg.get("words", []):
                line = (
                    f"Dialogue: 0,{ts(w['start'])},{ts(w['end'])},Default,,0,0,0,,"
                    f"{{\\c&H00FFFF&}}{w['word']}"
                )
                f.write(line + "\n")
