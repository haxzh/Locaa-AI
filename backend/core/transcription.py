import whisper
import os
from utils.ffmpeg_utils import extract_audio

# Lazy load whisper model
_model = None

def get_whisper_model():
    global _model
    if _model is None:
        model_name = os.getenv("WHISPER_MODEL", "medium")
        try:
            _model = whisper.load_model(model_name)
        except Exception:
            # Safe fallback in constrained environments
            _model = whisper.load_model("base")
    return _model

def transcribe_video(video_path):
    """
    Extracts audio from video and transcribes it, returning segments with timestamps
    and detected source language.
    """
    base = os.path.splitext(os.path.basename(video_path))[0]
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    TEMP_DIR = os.path.join(BASE_DIR, "videos", "temp")
    os.makedirs(TEMP_DIR, exist_ok=True)
    
    audio_path = os.path.join(TEMP_DIR, f"{base}_full.mp3")
    
    # Extract audio if not already extracted
    if not os.path.exists(audio_path):
        extract_audio(video_path, audio_path)
        
    model = get_whisper_model()
    result = model.transcribe(
        audio_path,
        word_timestamps=False,
        condition_on_previous_text=True,
        temperature=0,
        no_speech_threshold=0.45,
        compression_ratio_threshold=2.2
    )

    detected_language = (result.get("language") or "unknown").lower()
    return result.get("segments", []), audio_path, detected_language
