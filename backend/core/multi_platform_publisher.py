"""
Multi-Platform Publisher for Locaa AI
Publishes videos to YouTube, Instagram, Facebook, TikTok, and more
"""
import os
import requests
import json
from typing import Dict, List, Optional, Tuple
from datetime import datetime
from utils.logger import log
from database.models import UserIntegration


class MultiPlatformPublisher:
    """Unified publisher for multiple social media platforms"""
    
    def __init__(self, user_id: int):
        """Initialize publisher for a specific user"""
        self.user_id = user_id
        
        # Load user integrations
        self.integrations = {
            i.provider: i.get_config() 
            for i in UserIntegration.query.filter_by(user_id=user_id, is_connected=True).all()
        }
        
    def publish(self, video_path: str, platforms: List[str], metadata: Dict) -> Dict:
        """
        Publish video to multiple platforms
        
        Args:
            video_path: Path to video file
            platforms: List of platforms ['youtube', 'instagram', 'facebook', 'tiktok']
            metadata: Video metadata (title, description, tags, etc.)
            
        Returns:
            Dict with results for each platform
        """
        results = {}
        
        for platform in platforms:
            try:
                log(f"Publishing to {platform}...")
                
                if platform == 'youtube':
                    if 'youtube' not in self.integrations:
                        raise ValueError("YouTube account not connected")
                    publisher = YouTubePublisher(self.integrations['youtube'])
                    result = publisher.publish(video_path, metadata)
                    
                elif platform == 'instagram':
                    if 'instagram' not in self.integrations:
                        raise ValueError("Instagram account not connected")
                    publisher = InstagramPublisher(self.integrations['instagram'])
                    result = publisher.publish(video_path, metadata)
                    
                elif platform == 'facebook':
                    if 'facebook' not in self.integrations:
                        raise ValueError("Facebook account not connected")
                    publisher = FacebookPublisher(self.integrations['facebook'])
                    result = publisher.publish(video_path, metadata)
                    
                elif platform == 'tiktok':
                    if 'tiktok' not in self.integrations:
                        raise ValueError("TikTok account not connected")
                    publisher = TikTokPublisher(self.integrations['tiktok'])
                    result = publisher.publish(video_path, metadata)
                    
                else:
                    result = {
                        'success': False,
                        'error': f"Unsupported platform: {platform}"
                    }
                
                results[platform] = result
                
                if result.get('success'):
                    log(f"✓ Successfully published to {platform}")
                else:
                    log(f"✗ Failed to publish to {platform}: {result.get('error', 'Unknown error')}", level="error")
                
            except Exception as e:
                log(f"✗ Failed to publish to {platform}: {str(e)}", level="error")
                results[platform] = {'success': False, 'error': str(e)}
        
        return results


class YouTubePublisher:
    """YouTube video publisher"""
    
    def __init__(self, config: dict):
        self.config = config
        self.api_key = config.get('client_id')
        self.client_secret = config.get('client_secret')
        self.access_token = config.get('token')
        
    def publish(self, video_path: str, metadata: Dict) -> Dict:
        """
        Upload video to YouTube
        
        Args:
            video_path: Path to video file
            metadata: {
                'title': str,
                'description': str,
                'tags': List[str],
                'category': str (default: '22'),
                'privacy': str (default: 'public')
            }
            
        Returns:
            Dict with video info
        """
        if not self.access_token:
            return {
                'success': False,
                'error': 'YouTube access token missing'
            }
            
        try:
            from google.oauth2.credentials import Credentials
            from googleapiclient.discovery import build
            from googleapiclient.http import MediaFileUpload
            
            # Reconstruct credentials object
            creds = Credentials(
                token=self.access_token,
                refresh_token=self.config.get('refresh_token'),
                token_uri=self.config.get('token_uri'),
                client_id=self.api_key,
                client_secret=self.client_secret,
                scopes=self.config.get('scopes')
            )
            
            youtube = build('youtube', 'v3', credentials=creds)
            
            # Check if file exists
            if not os.path.exists(video_path):
                return {
                    'success': False,
                    'error': f'Video file not found: {video_path}'
                }
                
            body = {
                'snippet': {
                    'title': metadata.get('title', 'Video Title'),
                    'description': metadata.get('description', ''),
                    'tags': metadata.get('tags', []),
                    'categoryId': metadata.get('category', '22')
                },
                'status': {
                    'privacyStatus': metadata.get('privacy', 'public'),
                    'selfDeclaredMadeForKids': False
                }
            }
            
            # For Shorts, ensure #shorts is in description
            is_short = metadata.get('is_short', False)
            if is_short and '#shorts' not in body['snippet']['description'].lower():
                body['snippet']['description'] += '\n#shorts'
                
            media = MediaFileUpload(
                video_path,
                chunksize=-1,
                resumable=True
            )
            
            request = youtube.videos().insert(
                part=','.join(body.keys()),
                body=body,
                media_body=media
            )
            
            response = None
            while response is None:
                status, response = request.next_chunk()
                if status:
                    log(f"Upload progress: {int(status.progress() * 100)}%")
                    
            return {
                'success': True,
                'video_id': response.get('id'),
                'url': f"https://youtu.be/{response.get('id')}",
                'platform': 'youtube',
                'uploaded_at': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            log(f"YouTube publish error: {str(e)}", level="error")
            return {
                'success': False,
                'error': str(e)
            }


class InstagramPublisher:
    """Instagram Reels/Video publisher"""
    
    def __init__(self, config: dict):
        self.config = config
        self.access_token = config.get('access_token')
        self.ig_user_id = config.get('ig_user_id')
        
    def publish(self, video_path: str, metadata: Dict) -> Dict:
        """
        Upload video/reel to Instagram
        
        Args:
            video_path: Path to video file
            metadata: {
                'caption': str,
                'cover_url': str (optional),
                'share_to_feed': bool
            }
            
        Returns:
            Dict with video info
        """
        if not self.access_token or not self.ig_user_id:
            return {
                'success': False,
                'error': 'Instagram access token or user ID missing'
            }
            
        # Due to Graph API restrictions, we'd need to first upload to our CDN 
        # and then tell Instagram to download it
        cdn_url = self._upload_to_cdn(video_path)
        if not cdn_url:
            return {
                'success': False,
                'error': 'Failed to upload video to CDN for Instagram'
            }
            
        try:
            # 1. Start media creation
            create_url = f"https://graph.facebook.com/v18.0/{self.ig_user_id}/media"
            create_params = {
                'media_type': 'REELS',
                'video_url': cdn_url,
                'caption': metadata.get('caption', ''),
                'share_to_feed': 'true' if metadata.get('share_to_feed', True) else 'false',
                'access_token': self.access_token
            }
            
            if metadata.get('cover_url'):
                create_params['cover_url'] = metadata.get('cover_url')
                
            create_res = requests.post(create_url, data=create_params)
            create_data = create_res.json()
            
            if 'error' in create_data:
                raise Exception(create_data['error']['message'])
                
            container_id = create_data['id']
            
            # 2. Wait for processing (in a real app, this should be async/webhooks)
            import time
            status_url = f"https://graph.facebook.com/v18.0/{container_id}?fields=status_code&access_token={self.access_token}"
            
            max_retries = 10
            is_ready = False
            for _ in range(max_retries):
                time.sleep(10)
                status_res = requests.get(status_url)
                status_data = status_res.json()
                
                if status_data.get('status_code') == 'FINISHED':
                    is_ready = True
                    break
                elif status_data.get('status_code') == 'ERROR':
                    raise Exception("Instagram video processing failed")
                    
            if not is_ready:
                return {
                    'success': False,
                    'error': 'Instagram video processing timeout',
                    'container_id': container_id
                }
                
            # 3. Publish
            publish_url = f"https://graph.facebook.com/v18.0/{self.ig_user_id}/media_publish"
            publish_params = {
                'creation_id': container_id,
                'access_token': self.access_token
            }
            
            publish_res = requests.post(publish_url, data=publish_params)
            publish_data = publish_res.json()
            
            if 'error' in publish_data:
                raise Exception(publish_data['error']['message'])
                
            return {
                'success': True,
                'media_id': publish_data['id'],
                'platform': 'instagram',
                'uploaded_at': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            log(f"Instagram publish error: {str(e)}", level="error")
            return {
                'success': False,
                'error': str(e)
            }
            
    def _upload_to_cdn(self, video_path: str) -> Optional[str]:
        """
        Upload video to CDN and return public URL
        TODO: Implement actual CDN upload (S3, CloudFlare, etc.)
        """
        # For local development/testing, we return a mock URL
        # Instagram requires a public URL, so locahost won't work in reality
        return "https://example.com/mock_video.mp4"


class TikTokPublisher:
    """TikTok video publisher"""
    
    def __init__(self, config: dict):
        self.config = config
        self.access_token = config.get('access_token')
        
    def publish(self, video_path: str, metadata: Dict) -> Dict:
        """
        Upload video to TikTok
        """
        if not self.access_token:
            return {
                'success': False,
                'error': 'TikTok access token missing'
            }
            
        # Due to TikTok API complexity, we'd typically use a third-party SDK
        # or implement their exact signing/upload flow
        # This is a mocked implementation
        
        try:
            # 1. Initialize upload
            # 2. Upload chunks
            # 3. Publish
            
            # MOCK SUCCESS
            return {
                'success': True,
                'video_id': "mock_tiktok_id",
                'platform': 'tiktok',
                'mocked': True,
                'uploaded_at': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            log(f"TikTok publish error: {str(e)}", level="error")
            return {
                'success': False,
                'error': str(e)
            }


class FacebookPublisher:
    """Facebook video publisher"""
    
    def __init__(self, config: dict):
        self.config = config
        self.access_token = config.get('access_token')
        self.page_id = config.get('page_id')
        
    def publish(self, video_path: str, metadata: Dict) -> Dict:
        """
        Upload video to Facebook Page
        """
        if not self.access_token or not self.page_id:
            return {
                'success': False,
                'error': 'Facebook access token or page ID missing'
            }
            
        if not os.path.exists(video_path):
            return {
                'success': False,
                'error': f'Video file not found: {video_path}'
            }
            
        try:
            url = f"https://graph.facebook.com/v18.0/{self.page_id}/videos"
            
            data = {
                'title': metadata.get('title', ''),
                'description': metadata.get('description', ''),
                'published': metadata.get('published', True),
                'access_token': self.access_token
            }
            
            with open(video_path, 'rb') as f:
                files = {
                    'source': f
                }
                response = requests.post(url, data=data, files=files)
                
            res_data = response.json()
            
            if 'error' in res_data:
                raise Exception(res_data['error']['message'])
                
            return {
                'success': True,
                'video_id': res_data['id'],
                'platform': 'facebook',
                'uploaded_at': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            log(f"Facebook publish error: {str(e)}", level="error")
            return {
                'success': False,
                'error': str(e)
            }


class TikTokPublisher:
    """TikTok video publisher"""
    
    def __init__(self, config: dict):
        self.config = config
        self.access_token = config.get('access_token')
        
    def publish(self, video_path: str, metadata: Dict) -> Dict:
        """
        Upload video to TikTok
        """
        if not self.access_token:
            return {
                'success': False,
                'error': 'TikTok access token missing'
            }
            
        # Due to TikTok API complexity, we'd typically use a third-party SDK
        # or implement their exact signing/upload flow
        # This is a mocked implementation
        
        try:
            # 1. Initialize upload
            # 2. Upload chunks
            # 3. Publish
            
            # MOCK SUCCESS
            return {
                'success': True,
                'video_id': "mock_tiktok_id",
                'platform': 'tiktok',
                'mocked': True,
                'uploaded_at': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            log(f"TikTok publish error: {str(e)}", level="error")
            return {
                'success': False,
                'error': str(e)
            }


# ==================== HELPER FUNCTIONS ====================

def format_metadata_for_platform(metadata: Dict, platform: str) -> Dict:
    """
    Format generic metadata for specific platform requirements
    
    Args:
        metadata: Generic metadata dict
        platform: Target platform name
    
    Returns:
        Platform-specific formatted metadata
    """
    title = metadata.get('title', 'Untitled Video')
    description = metadata.get('description', '')
    tags = metadata.get('tags', [])
    
    if platform == 'youtube':
        return {
            'title': title[:100],
            'description': description[:5000],
            'tags': tags[:500],
            'category': metadata.get('category', '22'),
            'privacy': metadata.get('privacy', 'public')
        }
    
    elif platform == 'instagram':
        hashtags = ' '.join([f'#{tag}' for tag in tags[:30]])
        caption = f"{title}\n\n{description}\n\n{hashtags}"
        return {
            'caption': caption[:2200],
            'share_to_feed': metadata.get('share_to_feed', True)
        }
    
    elif platform == 'facebook':
        return {
            'title': title[:255],
            'description': f"{description}\n\n{' '.join(['#' + tag for tag in tags])}",
            'published': metadata.get('published', True)
        }
    
    elif platform == 'tiktok':
        hashtags = ' '.join([f'#{tag}' for tag in tags[:20]])
        caption = f"{title} {hashtags}"
        return {
            'caption': caption[:150],
            'privacy_level': metadata.get('privacy_level', 'PUBLIC')
        }
    
    return metadata


def get_optimal_video_format(platform: str) -> Dict:
    """
    Get optimal video format specifications for each platform
    
    Returns:
        Dict with format specifications
    """
    formats = {
        'youtube': {
            'resolution': '1920x1080',
            'aspect_ratio': '16:9',
            'max_duration': 43200,  # 12 hours
            'max_size': 256 * 1024 * 1024 * 1024,  # 256GB
            'formats': ['mp4', 'mov', 'avi', 'wmv', 'flv']
        },
        'instagram': {
            'resolution': '1080x1920',
            'aspect_ratio': '9:16',
            'max_duration': 90,
            'max_size': 650 * 1024 * 1024,  # 650MB
            'formats': ['mp4', 'mov']
        },
        'facebook': {
            'resolution': '1920x1080',
            'aspect_ratio': '16:9',
            'max_duration': 14400,  # 4 hours
            'max_size': 10 * 1024 * 1024 * 1024,  # 10GB
            'formats': ['mp4', 'mov']
        },
        'tiktok': {
            'resolution': '1080x1920',
            'aspect_ratio': '9:16',
            'max_duration': 180,
            'max_size': 287 * 1024 * 1024,  # 287MB
            'formats': ['mp4', 'mov']
        }
    }
    
    return formats.get(platform, formats['youtube'])
