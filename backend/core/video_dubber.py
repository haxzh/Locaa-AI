import os
import subprocess
from .transcription import transcribe_video
from .translation import translate_segments
from .audio_merger import create_dubbed_audio, merge_audio_with_video
from .thumbnail_generator import generate_thumbnail
from .branding_engine import BrandingEngine
from config import Config


def _normalize_aspect_ratio(value):
    ratio = str(value or '16:9').strip()
    if ratio in ('9:16', '16:9', '1:1'):
        return ratio
    return '16:9'


def _apply_aspect_ratio(input_path, output_path, aspect_ratio):
    ratio = _normalize_aspect_ratio(aspect_ratio)
    if ratio == '9:16':
        width, height = 1080, 1920
    elif ratio == '1:1':
        width, height = 1080, 1080
    else:
        width, height = 1920, 1080

    command = [
        'ffmpeg',
        '-y',
        '-i', input_path,
        '-vf', f"scale={width}:{height}:force_original_aspect_ratio=decrease,pad={width}:{height}:(ow-iw)/2:(oh-ih)/2",
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-movflags', '+faststart',
        output_path,
    ]
    result = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    return result.returncode == 0 and os.path.exists(output_path)


def _to_branding_engine_config(branding_config, logo_path=None):
    cfg = dict(branding_config or {})
    if logo_path and not cfg.get('logo_path'):
        cfg['logo_path'] = logo_path

    logo_placement = str(cfg.get('logo_placement', 'Top-Right')).strip().lower().replace(' ', '-')
    logo_position = logo_placement if logo_placement in {
        'top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'
    } else 'top-right'

    try:
        raw_opacity = float(cfg.get('logo_opacity', 70))
    except Exception:
        raw_opacity = 70.0

    if raw_opacity > 1.0:
        logo_opacity = max(0.0, min(1.0, raw_opacity / 100.0))
    else:
        logo_opacity = max(0.0, min(1.0, raw_opacity))

    global_watermark = bool(cfg.get('global_watermark', False))
    watermark_text = str(cfg.get('watermark_text', cfg.get('brand_label', 'Locaa AI'))).strip()

    return {
        'logo_path': cfg.get('logo_path', ''),
        'logo_position': logo_position,
        'logo_size': int(cfg.get('logo_size', 90) or 90),
        'logo_opacity': logo_opacity,
        'watermark_text': watermark_text if global_watermark else '',
        'watermark_position': str(cfg.get('watermark_position', 'bottom-right')).strip().lower(),
        'watermark_opacity': float(cfg.get('watermark_opacity', 0.6) or 0.6),
    }

def process_dubbing_pipeline(video_path, target_language, temp_dir, output_dir, logo_path=None, branding_config=None, status_callback=None):
    """
    Orchestrates the entire AI dubbing pipeline.
    """
    if branding_config is None:
        branding_config = {}
        
    base = os.path.splitext(os.path.basename(video_path))[0]
    os.makedirs(temp_dir, exist_ok=True)
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(output_dir, exist_ok=True)
    
    dubbed_video_path = os.path.join(output_dir, f"{base}_{target_language}_dubbed.mp4")
    thumbnail_path = None
    
    try:
        # Phase 1: Transcribe
        if status_callback: status_callback("Extracting audio and transcribing...", 10)
        segments, audio_path, source_language = transcribe_video(video_path)
        
        if not segments:
            raise Exception("No speech found in video to translate.")
            
        # Phase 2: Translate
        if status_callback: status_callback(f"Translating to {target_language.capitalize()}...", 30)
        segments = translate_segments(
            segments,
            target_language=target_language,
            source_language=source_language,
        )
            
        # Phase 3: Text-to-Speech (TTS)
        if status_callback: status_callback("Generating AI Voiceover...", 50)
        
        # We need total video duration to create the right sized audio file
        import subprocess
        try:
            result = subprocess.run(["ffprobe", "-v", "error", "-show_entries",
                                     "format=duration", "-of",
                                     "default=noprint_wrappers=1:nokey=1", video_path],
                                    stdout=subprocess.PIPE,
                                    stderr=subprocess.STDOUT)
            duration_s = float(result.stdout)
            total_duration_ms = int(duration_s * 1000)
        except Exception:
            # Fallback format
            total_duration_ms = int(max(s['end'] for s in segments) * 1000) + 5000
            
        new_audio_path = create_dubbed_audio(
            segments,
            target_language,
            temp_dir,
            total_duration_ms=total_duration_ms,
            source_audio_path=audio_path
        )
        
        # Phase 4: Merge Audio and Video
        if status_callback: status_callback("Merging AI audio with video...", 80)
        success = merge_audio_with_video(video_path, new_audio_path, dubbed_video_path)
        
        if not success or not os.path.exists(dubbed_video_path):
            raise Exception("Failed to merge new audio with the video.")
            
        # Phase 5: Apply edit/branding preferences
        processed_video_path = dubbed_video_path

        aspect_ratio = (branding_config or {}).get('aspect_ratio')
        if aspect_ratio:
            aspect_path = os.path.join(output_dir, f"{base}_{target_language}_aspect.mp4")
            if _apply_aspect_ratio(processed_video_path, aspect_path, aspect_ratio):
                processed_video_path = aspect_path

        brand_cfg = _to_branding_engine_config(branding_config, logo_path=logo_path)
        if brand_cfg.get('logo_path') or brand_cfg.get('watermark_text'):
            branded_path = os.path.join(output_dir, f"{base}_{target_language}_final.mp4")
            branding_engine = BrandingEngine(Config)
            if branding_engine.apply_branding(processed_video_path, branded_path, brand_cfg):
                processed_video_path = branded_path

        # Phase 6: Thumbnail Generation
        if status_callback: status_callback("Generating attractive thumbnail...", 90)
        # Assuming the first segment might have a good title idea, or just a generic title
        title = segments[0]['text'][:30] if segments else f"{target_language.capitalize()} Dub"
        thumb_dir = os.path.join(output_dir, "thumbnails")
        thumbnail_path = generate_thumbnail(processed_video_path, title, logo_path, branding_config, thumb_dir)
        
        if status_callback: status_callback("Dubbing pipeline complete!", 100)
        return processed_video_path, thumbnail_path
        
    except Exception as e:
        print(f"Dubbing Pipeline Error: {e}")
        raise e
