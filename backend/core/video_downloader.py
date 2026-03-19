# import os
# import subprocess

# BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
# VIDEO_DIR = os.path.join(BASE_DIR, "videos", "full_videos")

# def download_video(video_id):
#     video_url = f"https://www.youtube.com/watch?v={video_id}"

#     output_path = os.path.join(
#         VIDEO_DIR,
#         "%(title)s.%(ext)s"
#     )

#     command = [
#         "yt-dlp",
#         "-f", "mp4",
#         "-o", output_path,
#         video_url
#     ]

#     try:
#         subprocess.run(command, check=True)
#         return True
#     except subprocess.CalledProcessError:
#         return False


import os
import re
import sys
import shutil
import subprocess
import threading
import queue
import time
from typing import Callable, Optional, Tuple

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
VIDEO_DIR = os.path.join(BASE_DIR, "videos", "full_videos")

_LAST_DOWNLOAD_ERROR = ""


def _terminate_process(process: subprocess.Popen) -> None:
    """Terminate downloader and child processes reliably."""
    if process.poll() is not None:
        return

    try:
        if os.name == "nt":
            subprocess.run(
                ["taskkill", "/PID", str(process.pid), "/T", "/F"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                check=False,
            )
        else:
            process.kill()
    except Exception:
        pass

    try:
        process.wait(timeout=5)
    except Exception:
        pass


def get_last_download_error() -> str:
    """Return the latest yt-dlp error captured by this module."""
    return _LAST_DOWNLOAD_ERROR


def _set_last_error(message: str) -> None:
    global _LAST_DOWNLOAD_ERROR
    _LAST_DOWNLOAD_ERROR = (message or "").strip()


def _run_yt_dlp(
    command,
    progress_callback: Optional[Callable[[int], bool]] = None,
    download_timeout_seconds: int = 300,
    idle_timeout_seconds: int = 90,
) -> Tuple[bool, str]:
    """Run yt-dlp command and return (success, error_message)."""
    process = subprocess.Popen(
        command,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        encoding="utf-8",
        errors="replace",
        text=True,
        bufsize=1,
    )

    out_log = []
    cancelled = False
    start_time = time.time()
    last_output_time = start_time
    output_queue: "queue.Queue[Optional[str]]" = queue.Queue()

    def _reader_thread() -> None:
        try:
            for raw_line in process.stdout:
                output_queue.put(raw_line)
        finally:
            output_queue.put(None)

    reader = threading.Thread(target=_reader_thread, daemon=True)
    reader.start()

    while True:
        # Enforce maximum overall runtime and output idle timeout.
        now = time.time()
        if now - start_time > download_timeout_seconds:
            _terminate_process(process)
            return False, f"Download timed out after {download_timeout_seconds}s"

        if now - last_output_time > idle_timeout_seconds:
            _terminate_process(process)
            return False, f"Downloader stalled (no output for {idle_timeout_seconds}s)"

        try:
            raw_line = output_queue.get(timeout=1)
        except queue.Empty:
            if process.poll() is not None:
                break
            continue

        if raw_line is None:
            break

        last_output_time = time.time()
        line = raw_line.strip()
        if line:
            out_log.append(line)

        if "[download]" in line and "%" in line and progress_callback:
            match = re.search(r"(\d+(?:\.\d+)?)%", line)
            if match:
                percent = int(float(match.group(1)))
                callback_result = progress_callback(percent)
                if callback_result is False:
                    cancelled = True
                    _terminate_process(process)
                    break

    process.wait()

    if cancelled:
        return False, "Download cancelled"

    if process.returncode == 0:
        return True, ""

    # Keep only useful error lines for UI/debug
    error_lines = [
        ln for ln in out_log
        if ("ERROR:" in ln or "HTTP Error" in ln or "Sign in to confirm" in ln or "Forbidden" in ln)
    ]
    if not error_lines:
        error_lines = out_log[-8:]

    return False, " | ".join(error_lines).strip() or "yt-dlp failed with unknown error"


def download_video(video_id, progress_callback=None, return_details: bool = False):
    """Download YouTube video with progress; optionally return detailed error info.

    Args:
        video_id: 11-char YouTube video id
        progress_callback: callback(percent) -> bool|None (False means cancel)
        return_details: if True returns (success, error_message), else bool
    """
    os.makedirs(VIDEO_DIR, exist_ok=True)
    video_url = f"https://www.youtube.com/watch?v={video_id}"
    # Prefix with source video id so backend can map files to the right job.
    output_path = os.path.join(VIDEO_DIR, "%(id)s__%(title)s.%(ext)s")

    common_args = [
        "-f", "b[ext=mp4]/bv+ba/b",
        "--merge-output-format", "mp4",
        "--socket-timeout", "20",
        "--retries", "2",
        "--fragment-retries", "2",
        "--newline",
        "--progress",
        "--no-warnings",
        "--force-overwrites",
        "-o", output_path,
        video_url,
    ]

    command_candidates = [
        [sys.executable, "-m", "yt_dlp", *common_args],
    ]

    ytdlp_exe = shutil.which("yt-dlp")
    if ytdlp_exe:
        command_candidates.append([ytdlp_exe, *common_args])

    last_error = ""
    for command in command_candidates:
        try:
            success, error_message = _run_yt_dlp(
                command,
                progress_callback=progress_callback,
                download_timeout_seconds=180,
                idle_timeout_seconds=45,
            )
            if success:
                _set_last_error("")
                return (True, "") if return_details else True
            last_error = error_message
        except Exception as exc:
            last_error = f"Downloader execution error: {exc}"

    _set_last_error(last_error)
    return (False, last_error) if return_details else False
