import sys
import os

# Add backend directory to Python path
sys.path.append(os.path.dirname(__file__))

from core.video_downloader import download_video

def progress(p):
    print(f"Progress: {p}%")

if __name__ == "__main__":
    # A short YouTube video ID (e.g. YouTube's short intro video)
    test_id = "jNQXAC9IVRw" # "Me at the zoo"
    print(f"Testing download for video {test_id}...")
    success = download_video(test_id, progress_callback=progress)
    print("Download Success:", success)
