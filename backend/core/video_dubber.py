import os
from .transcription import transcribe_video
from .translation import translate_segments
from .audio_merger import create_dubbed_audio, merge_audio_with_video
from .thumbnail_generator import generate_thumbnail

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
        segments, audio_path = transcribe_video(video_path)
        
        if not segments:
            raise Exception("No speech found in video to translate.")
            
        # Phase 2: Translate
        if status_callback: status_callback(f"Translating to {target_language.capitalize()}...", 30)
        segments = translate_segments(segments, target_language=target_language)
            
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
            
        # Phase 5: Thumbnail Generation
        if status_callback: status_callback("Generating attractive thumbnail...", 90)
        # Assuming the first segment might have a good title idea, or just a generic title
        title = segments[0]['text'][:30] if segments else f"{target_language.capitalize()} Dub"
        thumb_dir = os.path.join(output_dir, "thumbnails")
        thumbnail_path = generate_thumbnail(dubbed_video_path, title, logo_path, branding_config, thumb_dir)
        
        if status_callback: status_callback("Dubbing pipeline complete!", 100)
        return dubbed_video_path, thumbnail_path
        
    except Exception as e:
        print(f"Dubbing Pipeline Error: {e}")
        raise e
