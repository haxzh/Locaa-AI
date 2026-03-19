import os
import subprocess
from PIL import Image, ImageDraw, ImageFont

def extract_frame(video_path, output_path, timestamp="00:00:03"):
    """
    Extracts a single frame from the video at the given timestamp.
    """
    command = [
        "ffmpeg",
        "-y",
        "-ss", timestamp,
        "-i", video_path,
        "-vframes", "1",
        "-q:v", "2",
        output_path
    ]
    try:
        subprocess.run(command, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error extracting frame: {e.stderr.decode() if e.stderr else str(e)}")
        return False

def generate_thumbnail(video_path, title, logo_path=None, branding_config=None, output_dir=None):
    """
    Generates a thumbnail by extracting a frame and overlaying text and logo.
    """
    if branding_config is None:
        branding_config = {}
    base = os.path.splitext(os.path.basename(video_path))[0]
    if not output_dir:
        output_dir = os.path.join(os.path.dirname(video_path), "thumbnails")
    os.makedirs(output_dir, exist_ok=True)
    
    frame_path = os.path.join(output_dir, f"{base}_frame.jpg")
    final_path = os.path.join(output_dir, f"{base}_thumb.jpg")
    
    if not extract_frame(video_path, frame_path):
        return None
        
    try:
        img = Image.open(frame_path)
        draw = ImageDraw.Draw(img)
        
        width, height = img.size
        
        # Draw dark gradient or semi-transparent overlay at the bottom for text readability
        overlay = Image.new('RGBA', img.size, (0,0,0,0))
        overlay_draw = ImageDraw.Draw(overlay)
        overlay_draw.rectangle([0, int(height*0.7), width, height], fill=(0,0,0,180))
        img = Image.alpha_composite(img.convert('RGBA'), overlay).convert('RGB')
        draw = ImageDraw.Draw(img)
        
        # Try to load a font, otherwise use default
        try:
            # Need a large font
            font = ImageFont.truetype("arial.ttf", int(height * 0.08))
        except IOError:
            font = ImageFont.load_default()
            
        # Draw text at bottom center
        text = title if title else "Amazing Video"
        
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        
        x = (width - text_width) / 2
        y = height - text_height - int(height * 0.05)
        
        # Text with shadow/outline
        shadowcolor = "black"
        for dx, dy in [(-2,-2), (2,-2), (-2,2), (2,2)]:
            draw.text((x+dx, y+dy), text, font=font, fill=shadowcolor)
        draw.text((x, y), text, font=font, fill="white")
        
        # Add logo if provided
        if logo_path and os.path.exists(logo_path):
            logo = Image.open(logo_path).convert("RGBA")
            # Resize logo to max 15% of width or height
            logo_max_size = min(int(width * 0.15), int(height * 0.15))
            logo.thumbnail((logo_max_size, logo_max_size))
            img.paste(logo, (20, 20), logo)
            
        img.save(final_path, quality=90)
        return final_path
        
    except Exception as e:
        print(f"Error generating thumbnail: {e}")
        return frame_path # Return at least the bare frame
