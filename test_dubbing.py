import os
import sys

# Add backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))

from backend.core.video_dubber import process_dubbing_pipeline

def callback(msg, prog):
    print(f"[{prog}%] {msg}")

video_path = os.path.abspath("videos/full_videos/Rick Astley - Never Gonna Give You Up (Official Video) (4K Remaster).mp4")
temp_dir = os.path.abspath("videos/temp")
out_dir = os.path.abspath("videos/full_videos")

print(f"Testing dubbing on: {video_path}")

try:
    result = process_dubbing_pipeline(
        video_path=video_path,
        target_language="spanish",
        temp_dir=temp_dir,
        output_dir=out_dir,
        status_callback=callback
    )
    print(f"Success! Output: {result}")
except Exception as e:
    print(f"Failed: {e}")
