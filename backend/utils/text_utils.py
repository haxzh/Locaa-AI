import os

def generate_title(video_file):
    base = os.path.splitext(os.path.basename(video_file))[0]
    return f"🔥 {base[:70]} #Shorts"

def generate_description():
    return (
        "Watch till the end 👀🔥\n\n"
        "#shorts #viral #ai #automation"
    )
