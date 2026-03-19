import os
import re
import time
from typing import List, Dict
from deep_translator import GoogleTranslator

try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

# Map normal language names to google translator language codes
LANGUAGE_MAP = {
    'hindi': 'hi',
    'english': 'en',
    'spanish': 'es',
    'french': 'fr',
    'german': 'de',
    'japanese': 'ja',
    'korean': 'ko',
    'chinese': 'zh-CN',
    'arabic': 'ar',
    'russian': 'ru',
    'portuguese': 'pt'
}

LANGUAGE_LABELS = {
    'hindi': 'Hindi',
    'english': 'English',
    'spanish': 'Spanish',
    'french': 'French',
    'german': 'German',
    'japanese': 'Japanese',
    'korean': 'Korean',
    'chinese': 'Chinese',
    'arabic': 'Arabic',
    'russian': 'Russian',
    'portuguese': 'Portuguese'
}

# Brand and product terms to preserve exactly
PROTECTED_TERMS = [
    'Locaa AI',
    'YouTube',
    'Instagram',
    'TikTok',
    'Reels',
    'Shorts'
]


def _protect_terms(text: str):
    mapping = {}
    protected = text
    for i, term in enumerate(PROTECTED_TERMS):
        token = f"__TERM_{i}__"
        mapping[token] = term
        protected = protected.replace(term, token)
    return protected, mapping


def _restore_terms(text: str, mapping: dict):
    restored = text
    for token, term in mapping.items():
        restored = restored.replace(token, term)
    return restored


def _clean_translated_text(text: str):
    if not text:
        return ""
    text = re.sub(r'\s+', ' ', text).strip()
    text = re.sub(r'\s+([,.!?;:])', r'\1', text)
    return text


def _translate_with_google(text: str, target_language: str):
    target_code = LANGUAGE_MAP.get(target_language.lower(), 'en')
    translator = GoogleTranslator(source='auto', target=target_code)
    if len(text) <= 4500:
        return translator.translate(text)

    chunks = [text[i:i + 4500] for i in range(0, len(text), 4500)]
    translated_chunks = [translator.translate(chunk) for chunk in chunks]
    return " ".join(translated_chunks)


def _translate_with_openai(text: str, target_language: str, context: str = ""):
    api_key = os.getenv('OPENAI_API_KEY', '')
    if not api_key or not OPENAI_AVAILABLE:
        return None

    target_label = LANGUAGE_LABELS.get(target_language.lower(), target_language.capitalize())
    client = OpenAI(api_key=api_key)

    system_prompt = (
        f"You are an expert dubbing translator. Translate the user's text to natural, publication-ready {target_label}. "
        "Keep meaning exact, preserve names/brands/platform words, keep emotional tone, do not add extra text. "
        "Output only translated text."
    )
    user_prompt = f"Context: {context}\n\nText: {text}"

    for _ in range(2):
        try:
            response = client.chat.completions.create(
                model=os.getenv('OPENAI_MODEL', 'gpt-4o-mini'),
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.15,
                max_tokens=700,
            )
            translated = (response.choices[0].message.content or '').strip()
            return translated if translated else None
        except Exception:
            time.sleep(0.5)

    return None

def translate_text(text, target_language="hindi"):
    """
    Translates text to the specified target language.
    target_language: e.g. "hindi", "spanish", "english".
    """
    if not text or not text.strip():
        return ""
        
    protected, token_map = _protect_terms(text)

    try:
        # Prefer OpenAI for better context and publishing quality
        openai_translation = _translate_with_openai(protected, target_language)
        translated = openai_translation if openai_translation else _translate_with_google(protected, target_language)
        translated = _restore_terms(translated, token_map)
        return _clean_translated_text(translated)
    except Exception as e:
        print(f"Error translating text: {e}")
        return text


def translate_segments(segments: List[Dict], target_language: str = 'hindi'):
    """Context-aware translation for a sequence of transcript segments."""
    translated = []
    history = []

    for seg in segments:
        source_text = (seg.get('text') or '').strip()
        if not source_text:
            seg['original_text'] = ''
            seg['text'] = ''
            translated.append(seg)
            continue

        context_text = ' | '.join(history[-3:])
        protected, token_map = _protect_terms(source_text)

        try:
            candidate = _translate_with_openai(protected, target_language, context=context_text)
            if not candidate:
                candidate = _translate_with_google(protected, target_language)
            final_text = _clean_translated_text(_restore_terms(candidate, token_map))
        except Exception:
            final_text = source_text

        seg['original_text'] = source_text
        seg['text'] = final_text
        translated.append(seg)
        history.append(source_text)

    return translated
