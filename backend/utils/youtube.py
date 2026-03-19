"""Utilities for validating and normalizing YouTube URLs."""

from urllib.parse import parse_qs, urlparse
import re

VIDEO_ID_RE = re.compile(r"^[A-Za-z0-9_-]{11}$")


def is_valid_youtube_video_id(video_id: str) -> bool:
    """Return True when value looks like a YouTube video id."""
    if not video_id:
        return False
    return bool(VIDEO_ID_RE.fullmatch(video_id.strip()))


def _extract_id_from_path(path: str) -> str | None:
    parts = [segment for segment in path.split('/') if segment]
    if not parts:
        return None

    # /shorts/{id}, /embed/{id}, /live/{id}, /v/{id}
    if parts[0] in {"shorts", "embed", "live", "v"} and len(parts) > 1:
        candidate = parts[1]
        return candidate if is_valid_youtube_video_id(candidate) else None

    # youtu.be/{id}
    candidate = parts[0]
    return candidate if is_valid_youtube_video_id(candidate) else None


def extract_youtube_video_id(value: str) -> str | None:
    """Extract video id from full URL or raw 11-char video id.

    Supported examples:
    - https://www.youtube.com/watch?v=dQw4w9WgXcQ
    - https://youtu.be/dQw4w9WgXcQ?si=abcd
    - https://www.youtube.com/shorts/dQw4w9WgXcQ
    - dQw4w9WgXcQ
    """
    if not value:
        return None

    raw = value.strip()
    if is_valid_youtube_video_id(raw):
        return raw

    if not raw.startswith(("http://", "https://")):
        raw = f"https://{raw}"

    try:
        parsed = urlparse(raw)
    except Exception:
        return None

    host = (parsed.netloc or "").lower().replace("www.", "")
    path = parsed.path or ""
    query = parse_qs(parsed.query or "")

    if host in {"youtube.com", "m.youtube.com", "music.youtube.com", "youtube-nocookie.com"}:
        if path == "/watch":
            candidate = (query.get("v") or [None])[0]
            return candidate if is_valid_youtube_video_id(candidate or "") else None
        return _extract_id_from_path(path)

    if host in {"youtu.be", "m.youtu.be"}:
        return _extract_id_from_path(path)

    return None


def normalize_youtube_url(video_id: str) -> str:
    """Return canonical YouTube watch URL for a video id."""
    return f"https://www.youtube.com/watch?v={video_id}"
