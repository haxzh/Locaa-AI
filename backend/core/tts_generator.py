"""
Advanced TTS Generator for Locaa AI
Supports OpenAI TTS (premium) and Edge TTS (fallback)
"""
import os
import asyncio
import random
import edge_tts
from pathlib import Path
from typing import Optional
from utils.logger import log
import gtts

# Try to import OpenAI
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    log("OpenAI not available. Install with: pip install openai")


# ==================== OPENAI TTS (PREMIUM QUALITY) ====================

class OpenAITTSGenerator:
    """OpenAI TTS Generator - Premium quality voices"""
    
    # OpenAI voice models (best quality)
    OPENAI_VOICES = {
        'english': 'nova',  # Natural, friendly
        'hindi': 'shimmer',  # Warm, expressive
        'spanish': 'alloy',  # Neutral, balanced
        'french': 'echo',  # Clear, professional
        'german': 'fable',  # Engaging, storytelling
        'japanese': 'onyx',  # Deep, authoritative
        'korean': 'nova',  # Natural
        'portuguese': 'shimmer',
        'italian': 'alloy',
        'russian': 'echo',
        'chinese': 'fable',
        'arabic': 'shimmer',
        'default': 'nova'
    }
    OPENAI_GENDER_VOICES = {
        'female': {
            'english': 'nova',
            'hindi': 'shimmer',
            'spanish': 'nova',
            'french': 'shimmer',
            'default': 'nova',
        },
        'male': {
            'english': 'onyx',
            'hindi': 'echo',
            'spanish': 'fable',
            'french': 'onyx',
            'default': 'onyx',
        },
        'neutral': {
            'english': 'alloy',
            'hindi': 'alloy',
            'spanish': 'alloy',
            'french': 'alloy',
            'default': 'alloy',
        }
    }
    
    def __init__(self, api_key: str, model: str = 'tts-1-hd'):
        """
        Initialize OpenAI TTS
        
        Args:
            api_key: OpenAI API key
            model: 'tts-1' (faster) or 'tts-1-hd' (higher quality)
        """
        if not OPENAI_AVAILABLE:
            raise ImportError("OpenAI library not installed")
        
        self.client = OpenAI(api_key=api_key)
        self.model = model
    
    def generate(self, text: str, output_path: str, language: str = 'english',
                 voice: Optional[str] = None, speed: float = 1.0,
                 gender: str = 'neutral', voice_profile: Optional[str] = None) -> bool:
        """
        Generate speech using OpenAI TTS
        
        Args:
            text: Text to convert to speech
            output_path: Output file path (.mp3)
            language: Target language
            voice: Specific voice name (or auto-select by language)
            speed: Speech speed (0.25 to 4.0)
        
        Returns:
            True if successful
        """
        try:
            # Select voice
            if voice is None:
                if voice_profile:
                    voice = voice_profile
                else:
                    gender_map = self.OPENAI_GENDER_VOICES.get(gender, self.OPENAI_GENDER_VOICES['neutral'])
                    voice = gender_map.get(language.lower(), gender_map.get('default', 'alloy'))
            
            log(f"Generating OpenAI TTS: {text[:50]}... [voice: {voice}, speed: {speed}]")
            
            # Generate speech
            response = self.client.audio.speech.create(
                model=self.model,
                voice=voice,
                input=text,
                speed=speed
            )
            
            # Save to file
            response.stream_to_file(output_path)
            
            log(f"✓ OpenAI TTS generated: {output_path}")
            return True
            
        except Exception as e:
            log(f"✗ OpenAI TTS failed: {str(e)}")
            return False


# ==================== EDGE TTS (FREE FALLBACK) ====================

EDGE_VOICE_MAP = {
    'hindi': {
        'female': ['hi-IN-SwaraNeural'],
        'male': ['hi-IN-MadhurNeural'],
        'neutral': ['hi-IN-SwaraNeural']
    },
    'english': {
        'female': ['en-US-JennyNeural', 'en-US-AriaNeural'],
        'male': ['en-US-GuyNeural', 'en-US-DavisNeural'],
        'neutral': ['en-US-JennyNeural']
    },
    'spanish': {
        'female': ['es-ES-ElviraNeural'],
        'male': ['es-ES-AlvaroNeural'],
        'neutral': ['es-ES-ElviraNeural']
    },
    'french': {
        'female': ['fr-FR-DeniseNeural'],
        'male': ['fr-FR-HenriNeural'],
        'neutral': ['fr-FR-DeniseNeural']
    },
    'german': {
        'female': ['de-DE-KatjaNeural'],
        'male': ['de-DE-ConradNeural'],
        'neutral': ['de-DE-KatjaNeural']
    },
    'japanese': {
        'female': ['ja-JP-NanamiNeural'],
        'male': ['ja-JP-KeitaNeural'],
        'neutral': ['ja-JP-NanamiNeural']
    },
    'korean': {
        'female': ['ko-KR-SunHiNeural'],
        'male': ['ko-KR-InJoonNeural'],
        'neutral': ['ko-KR-SunHiNeural']
    },
    'portuguese': {
        'female': ['pt-BR-FranciscaNeural'],
        'male': ['pt-BR-AntonioNeural'],
        'neutral': ['pt-BR-FranciscaNeural']
    },
    'italian': {
        'female': ['it-IT-ElsaNeural'],
        'male': ['it-IT-DiegoNeural'],
        'neutral': ['it-IT-ElsaNeural']
    },
    'russian': {
        'female': ['ru-RU-SvetlanaNeural'],
        'male': ['ru-RU-DmitryNeural'],
        'neutral': ['ru-RU-SvetlanaNeural']
    },
    'chinese': {
        'female': ['zh-CN-XiaoxiaoNeural'],
        'male': ['zh-CN-YunxiNeural'],
        'neutral': ['zh-CN-XiaoxiaoNeural']
    },
    'arabic': {
        'female': ['ar-SA-ZariyahNeural'],
        'male': ['ar-SA-HamedNeural'],
        'neutral': ['ar-SA-ZariyahNeural']
    },
    'tamil': {
        'female': ['ta-IN-PallaviNeural'],
        'male': ['ta-IN-ValluvarNeural'],
        'neutral': ['ta-IN-PallaviNeural']
    },
    'telugu': {
        'female': ['te-IN-ShrutiNeural'],
        'male': ['te-IN-MohanNeural'],
        'neutral': ['te-IN-ShrutiNeural']
    },
    'bengali': {
        'female': ['bn-IN-TanishaaNeural'],
        'male': ['bn-IN-BashkarNeural'],
        'neutral': ['bn-IN-TanishaaNeural']
    },
    'marathi': {
        'female': ['mr-IN-AarohiNeural'],
        'male': ['mr-IN-ManoharNeural'],
        'neutral': ['mr-IN-AarohiNeural']
    },
    'gujarati': {
        'female': ['gu-IN-DhwaniNeural'],
        'male': ['gu-IN-NiranjanNeural'],
        'neutral': ['gu-IN-DhwaniNeural']
    },
}


def _resolve_edge_voice(target_language: str, gender: str = 'neutral', voice_profile: Optional[str] = None) -> str:
    if voice_profile:
        return voice_profile

    lang = (target_language or 'english').lower()
    gender = (gender or 'neutral').lower()
    voice_config = EDGE_VOICE_MAP.get(lang, EDGE_VOICE_MAP.get('english'))
    candidates = voice_config.get(gender) or voice_config.get('neutral') or ['en-US-JennyNeural']
    return random.choice(candidates)


def _clamp(value, min_v, max_v):
    return max(min_v, min(max_v, value))


def _rate_to_edge_percent(speaking_rate):
    # speaking_rate: 1.0 is default
    if speaking_rate is None:
        return "+0%"
    delta = int((_clamp(speaking_rate, 0.8, 1.35) - 1.0) * 100)
    return f"{delta:+d}%"


def _pitch_from_gender(gender: str):
    if gender == 'female':
        return "+2Hz"
    if gender == 'male':
        return "-2Hz"
    return "+0Hz"


async def _generate_edge_tts_async(text, output_file_path, voice_model, rate="+0%", pitch="+0Hz", volume="+0%"):
    """Async function to generate TTS using Edge TTS"""
    communicate = edge_tts.Communicate(text, voice_model, rate=rate, pitch=pitch, volume=volume)
    await communicate.save(output_file_path)


def generate_edge_tts(text: str, output_file_path: str, target_language: str = "hindi",
                      gender: str = 'neutral', voice_profile: Optional[str] = None,
                      speaking_rate: float = 1.0) -> bool:
    """
    Generate TTS using Microsoft Edge (free)
    
    Args:
        text: Text to convert to speech
        output_file_path: Output file path
        target_language: Target language
    
    Returns:
        True if successful
    """
    voice_model = _resolve_edge_voice(target_language, gender=gender, voice_profile=voice_profile)
    
    try:
        log(f"Generating Edge TTS: {text[:50]}...")
        edge_rate = _rate_to_edge_percent(speaking_rate)
        edge_pitch = _pitch_from_gender(gender)
        asyncio.run(_generate_edge_tts_async(text, output_file_path, voice_model, rate=edge_rate, pitch=edge_pitch))
        log(f"✓ Edge TTS generated: {output_file_path}")
        return True
    except Exception as e:
        log(f"⚠ Edge TTS failed: {str(e)}. Falling back to gTTS...")
        try:
            # Fallback to gTTS (Google TTS) which is highly reliable.
            # Using 'en' or 'hi' basic mappings
            lang_code = 'en'
            if 'hi' in target_language.lower() or 'hindi' in target_language.lower():
                lang_code = 'hi'
            elif 'es' in target_language.lower() or 'spanish' in target_language.lower():
                lang_code = 'es'
            elif 'fr' in target_language.lower() or 'french' in target_language.lower():
                lang_code = 'fr'
            
            tts = gtts.gTTS(text=text, lang=lang_code, slow=False)
            tts.save(output_file_path)
            log(f"✓ gTTS generated fallback successfully: {output_file_path}")
            return True
        except Exception as gtts_e:
            log(f"✗ gTTS also failed: {str(gtts_e)}")
            return False


# ==================== UNIFIED TTS GENERATOR ====================

class TTSGenerator:
    """
    Unified TTS Generator
    Tries OpenAI first (premium), falls back to Edge TTS (free)
    """
    
    def __init__(self, openai_api_key: Optional[str] = None, prefer_openai: bool = True):
        """
        Initialize TTS Generator
        
        Args:
            openai_api_key: OpenAI API key (None = use Edge TTS only)
            prefer_openai: Prefer OpenAI over Edge TTS when available
        """
        self.prefer_openai = prefer_openai and OPENAI_AVAILABLE and openai_api_key
        
        if self.prefer_openai:
            try:
                self.openai_tts = OpenAITTSGenerator(openai_api_key, model='tts-1-hd')
                log("✓ OpenAI TTS initialized (premium quality)")
            except Exception as e:
                log(f"⚠ OpenAI TTS init failed, using Edge TTS: {str(e)}")
                self.prefer_openai = False
        else:
            log("⚠ Using Edge TTS (free tier)")
    
    def generate(self, text: str, output_path: str, language: str = 'english',
                 voice: Optional[str] = None, speed: float = 1.0,
                 gender: str = 'neutral', voice_profile: Optional[str] = None) -> bool:
        """
        Generate speech audio
        
        Args:
            text: Text to convert
            output_path: Output file path
            language: Target language
            voice: Specific voice (OpenAI only)
            speed: Speech speed
        
        Returns:
            True if successful
        """
        # Ensure output directory exists
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        
        # Try OpenAI first if available
        if self.prefer_openai:
            success = self.openai_tts.generate(
                text,
                output_path,
                language,
                voice,
                speed,
                gender=gender,
                voice_profile=voice_profile
            )
            if success:
                return True
            log("⚠ OpenAI TTS failed, falling back to Edge TTS...")
        
        # Fallback to Edge TTS
        return generate_edge_tts(
            text,
            output_path,
            language,
            gender=gender,
            voice_profile=voice_profile,
            speaking_rate=speed
        )
    
    def generate_batch(self, segments: list, output_dir: str, language: str = 'english') -> list:
        """
        Generate TTS for multiple text segments
        
        Args:
            segments: List of dicts with 'text' and 'id'
            output_dir: Output directory
            language: Target language
        
        Returns:
            List of output file paths
        """
        os.makedirs(output_dir, exist_ok=True)
        results = []
        
        for i, segment in enumerate(segments):
            text = segment.get('text', '')
            segment_id = segment.get('id', i)
            output_path = os.path.join(output_dir, f"segment_{segment_id}.mp3")
            
            success = self.generate(text, output_path, language)
            if success:
                results.append(output_path)
            else:
                log(f"⚠ Skipping segment {segment_id} due to TTS failure")
        
        return results


# ==================== LEGACY COMPATIBILITY ====================

def generate_tts_sync(text: str, output_file_path: str, target_language: str = "hindi",
                      gender: str = 'neutral', voice_profile: Optional[str] = None,
                      speaking_rate: float = 1.0) -> bool:
    """
    Legacy function for backward compatibility
    Uses Edge TTS by default
    """
    return generate_edge_tts(
        text,
        output_file_path,
        target_language,
        gender=gender,
        voice_profile=voice_profile,
        speaking_rate=speaking_rate
    )


# ==================== HELPER FUNCTIONS ====================

def get_available_voices(language: str = None) -> dict:
    """Get available voices for a language"""
    if language:
        lang = language.lower()
        edge_lang = EDGE_VOICE_MAP.get(lang, EDGE_VOICE_MAP.get('english'))
        return {
            'openai': {
                'female': OpenAITTSGenerator.OPENAI_GENDER_VOICES['female'].get(lang, OpenAITTSGenerator.OPENAI_GENDER_VOICES['female']['default']),
                'male': OpenAITTSGenerator.OPENAI_GENDER_VOICES['male'].get(lang, OpenAITTSGenerator.OPENAI_GENDER_VOICES['male']['default']),
                'neutral': OpenAITTSGenerator.OPENAI_GENDER_VOICES['neutral'].get(lang, OpenAITTSGenerator.OPENAI_GENDER_VOICES['neutral']['default'])
            },
            'edge': edge_lang
        }
    
    return {
        'openai': OpenAITTSGenerator.OPENAI_VOICES,
        'edge': EDGE_VOICE_MAP
    }


def test_tts(api_key: Optional[str] = None):
    """Test TTS generation"""
    tts = TTSGenerator(openai_api_key=api_key)
    
    test_cases = [
        ("Hello, this is a test in English.", "english", "test_en.mp3"),
        ("नमस्ते, यह हिंदी में एक परीक्षण है।", "hindi", "test_hi.mp3"),
    ]
    
    for text, lang, filename in test_cases:
        output = os.path.join("temp", filename)
        success = tts.generate(text, output, lang)
        print(f"{'✓' if success else '✗'} {lang}: {filename}")


if __name__ == "__main__":
    # Test TTS
    import sys
    api_key = sys.argv[1] if len(sys.argv) > 1 else None
    test_tts(api_key)
