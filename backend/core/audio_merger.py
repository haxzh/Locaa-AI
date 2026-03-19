import os
from pydub import AudioSegment
import subprocess
import numpy as np
from core.tts_generator import generate_tts_sync


def _estimate_pitch_hz(audio_segment):
    """Estimate dominant pitch frequency for a speech segment."""
    try:
        if len(audio_segment) < 120:
            return None

        segment = audio_segment.set_channels(1)
        samples = np.array(segment.get_array_of_samples(), dtype=np.float32)
        if samples.size < 512:
            return None

        samples = samples - np.mean(samples)
        if np.max(np.abs(samples)) == 0:
            return None

        samples = samples / (np.max(np.abs(samples)) + 1e-9)
        window = np.hamming(len(samples))
        spectrum = np.fft.rfft(samples * window)
        freqs = np.fft.rfftfreq(len(samples), d=1.0 / segment.frame_rate)
        magnitudes = np.abs(spectrum)

        valid = (freqs >= 70) & (freqs <= 320)
        if not np.any(valid):
            return None

        band_freqs = freqs[valid]
        band_mags = magnitudes[valid]
        if band_mags.size == 0:
            return None

        return float(band_freqs[np.argmax(band_mags)])
    except Exception:
        return None


def _detect_gender_from_pitch(pitch_hz):
    """Rough pitch-based gender inference with neutral fallback."""
    if pitch_hz is None:
        return 'neutral'
    if pitch_hz >= 165:
        return 'female'
    if pitch_hz <= 145:
        return 'male'
    return 'neutral'


def _speed_change(audio, speed=1.0):
    if speed <= 0:
        return audio
    altered = audio._spawn(audio.raw_data, overrides={"frame_rate": int(audio.frame_rate * speed)})
    return altered.set_frame_rate(audio.frame_rate)


def _fit_clip_to_duration(tts_clip, target_duration_ms):
    """Fit clip length close to source segment duration while preserving natural tone."""
    if target_duration_ms <= 0 or len(tts_clip) <= 0:
        return tts_clip

    ratio = len(tts_clip) / float(target_duration_ms)

    # Keep the speech natural; avoid extreme warping.
    if ratio > 1.08:
        speed = min(1.35, ratio)
        return _speed_change(tts_clip, speed)
    if ratio < 0.92:
        speed = max(0.80, ratio)
        return _speed_change(tts_clip, speed)
    return tts_clip


def _target_speaking_rate(source_segment_ms: int, text: str):
    """Estimate comfortable speech rate from segment duration and text length."""
    if source_segment_ms <= 0:
        return 1.0

    chars = max(len((text or '').strip()), 1)
    cps = chars / max(source_segment_ms / 1000.0, 0.25)

    # Around 13-16 cps usually feels natural for dubbed speech.
    if cps > 18:
        return 1.2
    if cps > 15.5:
        return 1.1
    if cps < 10:
        return 0.92
    return 1.0


def enrich_segments_with_voice_profiles(segments, source_audio_path):
    """Annotate segments with detected pitch/gender and stable speaker profiles."""
    if not segments or not source_audio_path or not os.path.exists(source_audio_path):
        return segments

    try:
        source_audio = AudioSegment.from_file(source_audio_path).set_channels(1)
    except Exception:
        return segments

    speaker_clusters = []
    next_speaker_id = 1

    for seg in segments:
        start_ms = max(0, int(seg.get('start', 0) * 1000))
        end_ms = max(start_ms + 50, int(seg.get('end', 0) * 1000))
        clip = source_audio[start_ms:end_ms]

        pitch_hz = _estimate_pitch_hz(clip)
        detected_gender = _detect_gender_from_pitch(pitch_hz)

        assigned = None
        if pitch_hz is not None:
            for cluster in speaker_clusters:
                if cluster['gender'] != detected_gender:
                    continue
                if abs(cluster['pitch'] - pitch_hz) <= 18:
                    assigned = cluster
                    break

        if assigned is None:
            assigned = {
                'id': f"speaker_{next_speaker_id}",
                'pitch': pitch_hz if pitch_hz is not None else 0,
                'gender': detected_gender,
                'seed': next_speaker_id,
            }
            speaker_clusters.append(assigned)
            next_speaker_id += 1

        seg['detected_pitch_hz'] = pitch_hz
        seg['detected_gender'] = detected_gender
        seg['speaker_id'] = assigned['id']
        seg['voice_profile'] = f"{assigned['id']}::{detected_gender}::{assigned['seed']}"

    return segments

def create_dubbed_audio(segments, target_language, temp_dir, total_duration_ms=None, source_audio_path=None):
    """
    Generates TTS for each segment and places it at the correct timestamp.
    segments: list of dicts with 'start', 'end', 'text' (translated text)
    temp_dir: directory to save intermediate TTS audio files
    """
    # Find the end time of the last segment if total_duration_ms is not provided
    if not total_duration_ms:
        if segments:
            total_duration_ms = int(max(s['end'] for s in segments) * 1000) + 5000 # Add 5s buffer
        else:
            total_duration_ms = 10000

    # Try to enrich speaker profiles for character-consistent voices.
    segments = enrich_segments_with_voice_profiles(segments, source_audio_path)

    # Create an empty silent audio track
    final_audio = AudioSegment.silent(duration=total_duration_ms)
    
    for i, seg in enumerate(segments):
        start_ms = int(seg['start'] * 1000)
        text = seg['text']
        if not text.strip(): continue
        
        tts_path = os.path.join(temp_dir, f"tts_{i}.mp3")
        
        # Generate TTS with per-segment voice hints
        segment_duration_ms = int(max(100, (seg.get('end', 0) - seg.get('start', 0)) * 1000))
        speaking_rate = _target_speaking_rate(segment_duration_ms, text)

        success = generate_tts_sync(
            text,
            tts_path,
            target_language,
            gender=seg.get('detected_gender', 'neutral'),
            voice_profile=seg.get('voice_profile'),
            speaking_rate=speaking_rate
        )
        
        if success and os.path.exists(tts_path):
            try:
                tts_clip = AudioSegment.from_file(tts_path)
                tts_clip = _fit_clip_to_duration(tts_clip, segment_duration_ms)
                final_audio = final_audio.overlay(tts_clip, position=start_ms)
            except Exception as e:
                print(f"Error processing TTS clip {i}: {e}")
                
    # Save the final combined audio
    final_audio_path = os.path.join(temp_dir, "final_dubbed_audio.mp3")
    final_audio.export(final_audio_path, format="mp3")
    return final_audio_path

def merge_audio_with_video(video_path, new_audio_path, output_path):
    """
    Replaces the audio of the video with the new_audio_path using ffmpeg.
    """
    command = [
        "ffmpeg",
        "-y",
        "-i", video_path,
        "-i", new_audio_path,
        "-c:v", "copy",
        "-c:a", "aac",
        "-map", "0:v:0",
        "-map", "1:a:0",
        "-shortest",
        output_path
    ]
    try:
        subprocess.run(command, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error merging audio and video: {e.stderr.decode() if e.stderr else str(e)}")
        return False
