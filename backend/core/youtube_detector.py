import requests
import os
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("YOUTUBE_API_KEY")

def get_latest_video(channel_id):
    url = "https://www.googleapis.com/youtube/v3/search"
    params = {
        "key": API_KEY,
        "channelId": channel_id,
        "part": "snippet",
        "order": "date",
        "maxResults": 1
    }

    response = requests.get(url, params=params).json()

    if "items" not in response or len(response["items"]) == 0:
        return None

    video = response["items"][0]
    return {
        "video_id": video["id"]["videoId"],
        "title": video["snippet"]["title"]
    }
