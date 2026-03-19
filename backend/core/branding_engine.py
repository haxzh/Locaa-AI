"""
Advanced Branding Engine for Locaa AI
Handles logo overlay, watermarks, intro/outro, and custom branding
"""
import os
import subprocess
from typing import Optional, Dict, Tuple
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from utils.logger import log


class BrandingEngine:
    """Advanced video branding and watermarking system"""
    
    def __init__(self, config):
        """Initialize branding engine with config"""
        self.config = config
        self.ffmpeg_path = config.FFMPEG_PATH
    
    def apply_branding(self, video_path: str, output_path: str, branding_config: Dict) -> bool:
        """
        Apply complete branding to video
        
        Args:
            video_path: Input video path
            output_path: Output video path
            branding_config: {
                'logo_path': str,
                'logo_position': str ('top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'),
                'logo_size': int (pixels),
                'logo_opacity': float (0.0-1.0),
                'watermark_text': str,
                'watermark_position': str,
                'intro_video': str (path to intro clip),
                'outro_video': str (path to outro clip)
            }
        
        Returns:
            bool: Success status
        """
        try:
            temp_files = []
            current_input = video_path
            
            # Step 1: Add logo overlay
            if branding_config.get('logo_path'):
                logo_output = output_path.replace('.mp4', '_logo.mp4')
                success = self.add_logo(current_input, logo_output, branding_config)
                if success:
                    temp_files.append(logo_output)
                    current_input = logo_output
                else:
                    log("⚠ Logo overlay failed, continuing...")
            
            # Step 2: Add text watermark
            if branding_config.get('watermark_text'):
                watermark_output = output_path.replace('.mp4', '_watermark.mp4')
                success = self.add_text_watermark(current_input, watermark_output, branding_config)
                if success:
                    temp_files.append(watermark_output)
                    current_input = watermark_output
                else:
                    log("⚠ Watermark failed, continuing...")
            
            # Step 3: Add intro
            if branding_config.get('intro_video') and os.path.exists(branding_config['intro_video']):
                intro_output = output_path.replace('.mp4', '_intro.mp4')
                success = self.add_intro_outro(
                    current_input, intro_output, 
                    intro=branding_config['intro_video']
                )
                if success:
                    temp_files.append(intro_output)
                    current_input = intro_output
            
            # Step 4: Add outro
            if branding_config.get('outro_video') and os.path.exists(branding_config['outro_video']):
                success = self.add_intro_outro(
                    current_input, output_path,
                    outro=branding_config['outro_video']
                )
            else:
                # No outro, just copy/rename final output
                if current_input != output_path:
                    os.rename(current_input, output_path)
                    temp_files.remove(current_input)
            
            # Cleanup temp files
            for temp_file in temp_files:
                try:
                    if os.path.exists(temp_file) and temp_file != output_path:
                        os.remove(temp_file)
                except:
                    pass
            
            log(f"✓ Branding applied successfully: {output_path}")
            return True
            
        except Exception as e:
            log(f"✗ Branding failed: {str(e)}")
            return False
    
    def add_logo(self, video_path: str, output_path: str, config: Dict) -> bool:
        """
        Add logo overlay to video
        
        Args:
            video_path: Input video
            output_path: Output video
            config: Logo configuration
        
        Returns:
            bool: Success status
        """
        try:
            logo_path = config.get('logo_path')
            position = config.get('logo_position', 'top-right')
            size = config.get('logo_size', 100)
            opacity = config.get('logo_opacity', 0.8)
            
            if not os.path.exists(logo_path):
                log(f"⚠ Logo file not found: {logo_path}")
                return False
            
            # Prepare logo with transparency
            processed_logo = self._prepare_logo(logo_path, size, opacity)
            
            # Calculate position
            position_filter = self._get_overlay_position(position, size)
            
            # FFmpeg command to overlay logo
            cmd = [
                self.ffmpeg_path,
                '-i', video_path,
                '-i', processed_logo,
                '-filter_complex', f"[1:v]{position_filter}[logo];[0:v][logo]overlay",
                '-c:a', 'copy',
                '-y',
                output_path
            ]
            
            log(f"Adding logo overlay: {position} @ {size}px, opacity: {opacity}")
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode == 0:
                log(f"✓ Logo added successfully")
                # Cleanup processed logo
                try:
                    os.remove(processed_logo)
                except:
                    pass
                return True
            else:
                log(f"✗ FFmpeg logo overlay failed: {result.stderr}")
                return False
                
        except Exception as e:
            log(f"✗ Logo overlay error: {str(e)}")
            return False
    
    def add_text_watermark(self, video_path: str, output_path: str, config: Dict) -> bool:
        """
        Add text watermark to video
        
        Args:
            video_path: Input video
            output_path: Output video
            config: Watermark configuration
        
        Returns:
            bool: Success status
        """
        try:
            text = config.get('watermark_text', 'Locaa AI')
            position = config.get('watermark_position', 'bottom-center')
            font_size = config.get('watermark_font_size', 24)
            opacity = config.get('watermark_opacity', 0.6)
            
            # Build FFmpeg drawtext filter
            position_coords = self._get_text_position(position)
            
            # Create drawtext filter
            filter_str = (
                f"drawtext=text='{text}':"
                f"fontsize={font_size}:"
                f"fontcolor=white@{opacity}:"
                f"{position_coords}:"
                f"box=1:boxcolor=black@0.3:boxborderw=5"
            )
            
            cmd = [
                self.ffmpeg_path,
                '-i', video_path,
                '-vf', filter_str,
                '-c:a', 'copy',
                '-y',
                output_path
            ]
            
            log(f"Adding text watermark: '{text}' at {position}")
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode == 0:
                log(f"✓ Watermark added successfully")
                return True
            else:
                log(f"✗ FFmpeg watermark failed: {result.stderr}")
                return False
                
        except Exception as e:
            log(f"✗ Watermark error: {str(e)}")
            return False
    
    def add_intro_outro(self, video_path: str, output_path: str, 
                       intro: Optional[str] = None, outro: Optional[str] = None) -> bool:
        """
        Add intro and/or outro clips to video
        
        Args:
            video_path: Main video path
            output_path: Output video path
            intro: Path to intro clip
            outro: Path to outro clip
        
        Returns:
            bool: Success status
        """
        try:
            # Create concat file list
            concat_list = []
            
            if intro and os.path.exists(intro):
                concat_list.append(intro)
            
            concat_list.append(video_path)
            
            if outro and os.path.exists(outro):
                concat_list.append(outro)
            
            if len(concat_list) == 1:
                # No intro/outro, just copy
                os.rename(video_path, output_path)
                return True
            
            # Create temporary concat file
            concat_file = os.path.join(os.path.dirname(output_path), 'concat_list.txt')
            with open(concat_file, 'w') as f:
                for video_file in concat_list:
                    f.write(f"file '{os.path.abspath(video_file)}'\n")
            
            # Concatenate videos
            cmd = [
                self.ffmpeg_path,
                '-f', 'concat',
                '-safe', '0',
                '-i', concat_file,
                '-c', 'copy',
                '-y',
                output_path
            ]
            
            log(f"Concatenating {len(concat_list)} video clips...")
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            # Cleanup
            try:
                os.remove(concat_file)
            except:
                pass
            
            if result.returncode == 0:
                log(f"✓ Intro/outro added successfully")
                return True
            else:
                log(f"✗ FFmpeg concat failed: {result.stderr}")
                return False
                
        except Exception as e:
            log(f"✗ Intro/outro error: {str(e)}")
            return False
    
    def _prepare_logo(self, logo_path: str, size: int, opacity: float) -> str:
        """
        Prepare logo with proper size and opacity
        
        Returns:
            Path to processed logo file
        """
        try:
            img = Image.open(logo_path)
            
            # Resize maintaining aspect ratio
            img.thumbnail((size, size), Image.Resampling.LANCZOS)
            
            # Convert to RGBA if not already
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
            
            # Adjust opacity
            if opacity < 1.0:
                alpha = img.split()[3]
                alpha = alpha.point(lambda p: int(p * opacity))
                img.putalpha(alpha)
            
            # Save processed logo
            output_path = logo_path.replace(os.path.splitext(logo_path)[1], '_processed.png')
            img.save(output_path, 'PNG')
            
            return output_path
            
        except Exception as e:
            log(f"✗ Logo preparation failed: {str(e)}")
            return logo_path
    
    def _get_overlay_position(self, position: str, size: int, padding: int = 10) -> str:
        """Get FFmpeg overlay position filter"""
        positions = {
            'top-left': f"scale={size}:{size}",
            'top-right': f"scale={size}:{size}",
            'bottom-left': f"scale={size}:{size}",
            'bottom-right': f"scale={size}:{size}",
            'center': f"scale={size}:{size}",
        }
        
        return positions.get(position, f"scale={size}:{size}")
    
    def _get_text_position(self, position: str) -> str:
        """Get FFmpeg text position coordinates"""
        positions = {
            'top-left': 'x=10:y=10',
            'top-center': 'x=(w-text_w)/2:y=10',
            'top-right': 'x=w-text_w-10:y=10',
            'center': 'x=(w-text_w)/2:y=(h-text_h)/2',
            'bottom-left': 'x=10:y=h-text_h-10',
            'bottom-center': 'x=(w-text_w)/2:y=h-text_h-10',
            'bottom-right': 'x=w-text_w-10:y=h-text_h-10',
        }
        
        return positions.get(position, 'x=(w-text_w)/2:y=h-text_h-10')
    
    def create_branded_thumbnail(self, video_path: str, output_path: str, 
                                 title: str, logo_path: Optional[str] = None) -> bool:
        """
        Create attractive branded thumbnail for video
        
        Args:
            video_path: Source video
            output_path: Output thumbnail path
            title: Video title text
            logo_path: Optional logo to overlay
        
        Returns:
            bool: Success status
        """
        try:
            # Extract frame from middle of video
            temp_frame = output_path.replace('.jpg', '_temp.jpg')
            
            cmd = [
                self.ffmpeg_path,
                '-i', video_path,
                '-ss', '00:00:02',  # 2 seconds in
                '-vframes', '1',
                '-vf', 'scale=1280:720',
                '-y',
                temp_frame
            ]
            
            result = subprocess.run(cmd, capture_output=True)
            
            if result.returncode != 0:
                log("⚠ Failed to extract video frame")
                return False
            
            # Open image and add branding
            img = Image.open(temp_frame)
            draw = ImageDraw.Draw(img, 'RGBA')
            
            # Add semi-transparent overlay for text readability
            overlay = Image.new('RGBA', img.size, (0, 0, 0, 0))
            overlay_draw = ImageDraw.Draw(overlay)
            
            # Bottom black gradient
            for i in range(200):
                alpha = int((i / 200) * 180)
                overlay_draw.rectangle(
                    [(0, img.height - 200 + i), (img.width, img.height - 199 + i)],
                    fill=(0, 0, 0, alpha)
                )
            
            img = Image.alpha_composite(img.convert('RGBA'), overlay)
            
            # Add title text
            try:
                font = ImageFont.truetype("arial.ttf", 48)
                small_font = ImageFont.truetype("arial.ttf", 24)
            except:
                font = ImageFont.load_default()
                small_font = font
            
            # Draw title
            text_bbox = draw.textbbox((0, 0), title, font=font)
            text_width = text_bbox[2] - text_bbox[0]
            text_x = (img.width - text_width) // 2
            text_y = img.height - 150
            
            # Text with outline
            for offset in [(-2,-2), (-2,2), (2,-2), (2,2)]:
                draw.text((text_x + offset[0], text_y + offset[1]), title, font=font, fill='black')
            draw.text((text_x, text_y), title, font=font, fill='white')
            
            # Add "Powered by Locaa AI" badge
            badge_text = "Powered by Locaa AI"
            badge_bbox = draw.textbbox((0, 0), badge_text, font=small_font)
            badge_x = img.width - (badge_bbox[2] - badge_bbox[0]) - 20
            badge_y = img.height - 40
            draw.text((badge_x, badge_y), badge_text, font=small_font, fill='#00D9FF')
            
            # Add logo if provided
            if logo_path and os.path.exists(logo_path):
                try:
                    logo = Image.open(logo_path)
                    logo.thumbnail((100, 100), Image.Resampling.LANCZOS)
                    logo_x = 20
                    logo_y = img.height - logo.height - 20
                    img.paste(logo, (logo_x, logo_y), logo if logo.mode == 'RGBA' else None)
                except Exception as e:
                    log(f"⚠ Logo overlay on thumbnail failed: {str(e)}")
            
            # Save final thumbnail
            img.convert('RGB').save(output_path, 'JPEG', quality=95)
            
            # Cleanup
            try:
                os.remove(temp_frame)
            except:
                pass
            
            log(f"✓ Branded thumbnail created: {output_path}")
            return True
            
        except Exception as e:
            log(f"✗ Thumbnail creation failed: {str(e)}")
            return False


# ==================== HELPER FUNCTIONS ====================

def apply_quick_watermark(video_path: str, output_path: str, text: str = "Locaa AI") -> bool:
    """Quick watermark application"""
    engine = BrandingEngine(type('Config', (), {
        'FFMPEG_PATH': 'ffmpeg'
    }))
    
    return engine.add_text_watermark(video_path, output_path, {
        'watermark_text': text,
        'watermark_position': 'bottom-right',
        'watermark_opacity': 0.7
    })


def create_simple_thumbnail(video_path: str, output_path: str, title: str) -> bool:
    """Create simple thumbnail from video"""
    engine = BrandingEngine(type('Config', (), {
        'FFMPEG_PATH': 'ffmpeg'
    }))
    
    return engine.create_branded_thumbnail(video_path, output_path, title)


if __name__ == "__main__":
    # Test branding
    print("Branding Engine Ready")
    print("Usage: from core.branding_engine import BrandingEngine")
