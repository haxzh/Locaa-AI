"""
Locaa AI - Comprehensive Configuration Module
Centralized config management for the entire SaaS platform
"""
import os
from dotenv import load_dotenv
from datetime import timedelta

load_dotenv()


class Config:
    """Base configuration class"""
    
    # ==================== FLASK CORE ====================
    SECRET_KEY = os.getenv('SECRET_KEY', 'locaa-ai-super-secret-key-change-in-production')
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    DEBUG = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    
    # ==================== DATABASE ====================
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///locaa_ai.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = DEBUG
    
    # ==================== JWT AUTHENTICATION ====================
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-super-secret-key-change-this')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', '24')))
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    JWT_TOKEN_LOCATION = ['headers']
    JWT_HEADER_NAME = 'Authorization'
    JWT_HEADER_TYPE = 'Bearer'
    
    # ==================== AI & ML SERVICES ====================
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')
    OPENAI_MODEL = os.getenv('OPENAI_MODEL', 'gpt-4-turbo-preview')
    OPENAI_TTS_MODEL = os.getenv('OPENAI_TTS_MODEL', 'tts-1-hd')
    OPENAI_TTS_VOICE = os.getenv('OPENAI_TTS_VOICE', 'nova')  # alloy, echo, fable, onyx, nova, shimmer
    
    # Whisper for transcription
    WHISPER_MODEL = os.getenv('WHISPER_MODEL', 'base')  # tiny, base, small, medium, large
    
    # ==================== VIDEO PROCESSING ====================
    FFMPEG_PATH = os.getenv('FFMPEG_PATH', 'ffmpeg')
    FFPROBE_PATH = os.getenv('FFPROBE_PATH', 'ffprobe')
    
    # Video constraints
    MAX_VIDEO_SIZE = int(os.getenv('MAX_VIDEO_SIZE', str(500 * 1024 * 1024)))  # 500MB default
    MAX_VIDEO_DURATION = int(os.getenv('MAX_VIDEO_DURATION', '3600'))  # 1 hour default
    ALLOWED_VIDEO_EXTENSIONS = ['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv', 'wmv']
    
    # Processing settings
    TARGET_VIDEO_RESOLUTION = os.getenv('TARGET_VIDEO_RESOLUTION', '1920x1080')
    TARGET_VIDEO_BITRATE = os.getenv('TARGET_VIDEO_BITRATE', '5M')
    TARGET_AUDIO_BITRATE = os.getenv('TARGET_AUDIO_BITRATE', '192k')
    
    # ==================== STORAGE & UPLOADS ====================
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'backend', 'uploads')
    VIDEO_FOLDER = os.path.join(BASE_DIR, 'videos')
    FULL_VIDEOS_FOLDER = os.path.join(VIDEO_FOLDER, 'full_videos')
    CLIPS_FOLDER = os.path.join(VIDEO_FOLDER, 'clips')
    REELS_FOLDER = os.path.join(VIDEO_FOLDER, 'reels')
    TEMP_FOLDER = os.path.join(VIDEO_FOLDER, 'temp')
    THUMBNAILS_FOLDER = os.path.join(FULL_VIDEOS_FOLDER, 'thumbnails')
    LOGS_FOLDER = os.path.join(BASE_DIR, 'logs')
    
    # ==================== YOUTUBE API ====================
    YOUTUBE_API_KEY = os.getenv('YOUTUBE_API_KEY', '')
    YOUTUBE_CLIENT_SECRET_FILE = os.path.join(BASE_DIR, 'backend', 'credentials', 'client_secret.json')
    YOUTUBE_OAUTH_SCOPES = ['https://www.googleapis.com/auth/youtube.upload']
    
    # YouTube upload defaults
    YOUTUBE_DEFAULT_CATEGORY = '22'  # People & Blogs
    YOUTUBE_DEFAULT_PRIVACY = 'public'
    
    # ==================== INSTAGRAM INTEGRATION ====================
    INSTAGRAM_ACCESS_TOKEN = os.getenv('INSTAGRAM_ACCESS_TOKEN', '')
    INSTAGRAM_BUSINESS_ACCOUNT_ID = os.getenv('INSTAGRAM_BUSINESS_ACCOUNT_ID', '')
    INSTAGRAM_API_VERSION = os.getenv('INSTAGRAM_API_VERSION', 'v18.0')
    INSTAGRAM_API_BASE = f"https://graph.facebook.com/{INSTAGRAM_API_VERSION}"
    
    # ==================== FACEBOOK INTEGRATION ====================
    FACEBOOK_ACCESS_TOKEN = os.getenv('FACEBOOK_ACCESS_TOKEN', '')
    FACEBOOK_PAGE_ID = os.getenv('FACEBOOK_PAGE_ID', '')
    FACEBOOK_API_VERSION = os.getenv('FACEBOOK_API_VERSION', 'v18.0')
    
    # ==================== TIKTOK INTEGRATION ====================
    TIKTOK_CLIENT_KEY = os.getenv('TIKTOK_CLIENT_KEY', '')
    TIKTOK_CLIENT_SECRET = os.getenv('TIKTOK_CLIENT_SECRET', '')
    TIKTOK_ACCESS_TOKEN = os.getenv('TIKTOK_ACCESS_TOKEN', '')
    TIKTOK_API_BASE = 'https://open-api.tiktok.com'
    
    # ==================== PAYMENT GATEWAYS ====================
    # Stripe
    STRIPE_SECRET_KEY = os.getenv('STRIPE_SECRET_KEY', '')
    STRIPE_PUBLISHABLE_KEY = os.getenv('STRIPE_PUBLISHABLE_KEY', '')
    STRIPE_WEBHOOK_SECRET = os.getenv('STRIPE_WEBHOOK_SECRET', '')
    
    # Razorpay
    RAZORPAY_KEY_ID = os.getenv('RAZORPAY_KEY_ID', '')
    RAZORPAY_KEY_SECRET = os.getenv('RAZORPAY_KEY_SECRET', '')
    RAZORPAY_WEBHOOK_SECRET = os.getenv('RAZORPAY_WEBHOOK_SECRET', '')
    
    # ==================== EMAIL CONFIGURATION ====================
    MAIL_SERVER = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.getenv('MAIL_PORT', '587'))
    MAIL_USE_TLS = os.getenv('MAIL_USE_TLS', 'True').lower() == 'true'
    MAIL_USE_SSL = os.getenv('MAIL_USE_SSL', 'False').lower() == 'true'
    MAIL_USERNAME = os.getenv('MAIL_USERNAME', '')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD', '')
    MAIL_DEFAULT_SENDER = os.getenv('MAIL_DEFAULT_SENDER', 'noreply@locaaai.com')
    
    # Email settings
    EMAIL_VERIFICATION_EXPIRY = int(os.getenv('EMAIL_VERIFICATION_EXPIRY', '86400'))  # 24 hours
    PASSWORD_RESET_EXPIRY = int(os.getenv('PASSWORD_RESET_EXPIRY', '7200'))  # 2 hours
    SEND_WELCOME_EMAIL = os.getenv('SEND_WELCOME_EMAIL', 'True').lower() == 'true'
    SEND_COMPLETION_EMAILS = os.getenv('SEND_COMPLETION_EMAILS', 'True').lower() == 'true'
    
    # ==================== SUBSCRIPTION PLANS ====================
    SUBSCRIPTION_PLANS = {
        'free': {
            'name': 'Free',
            'price_monthly': 0,
            'price_yearly': 0,
            'videos_per_month': 5,
            'clips_per_video': 3,
            'max_video_length': 600,  # 10 minutes
            'api_access': False,
            'priority_support': False,
            'custom_branding': False,
            'platforms': ['youtube'],
            'features': [
                '5 videos per month',
                '3 clips per video',
                'Basic dubbing (Hindi ↔ English)',
                'YouTube publishing',
                'Standard quality',
                'Community support'
            ]
        },
        'pro': {
            'name': 'Pro',
            'price_monthly': 999,
            'price_yearly': 9999,
            'videos_per_month': 50,
            'clips_per_video': 10,
            'max_video_length': 3600,  # 1 hour
            'api_access': True,
            'priority_support': True,
            'custom_branding': True,
            'platforms': ['youtube', 'instagram', 'facebook'],
            'features': [
                '50 videos per month',
                '10 clips per video',
                'Multi-language support (50+ languages)',
                'YouTube, Instagram, Facebook publishing',
                'Custom branding & watermark',
                'HD quality',
                'Priority support',
                'API access',
                'Scheduled publishing'
            ]
        },
        'business': {
            'name': 'Business',
            'price_monthly': 2999,
            'price_yearly': 29999,
            'videos_per_month': 999,
            'clips_per_video': 999,
            'max_video_length': 7200,  # 2 hours
            'api_access': True,
            'priority_support': True,
            'custom_branding': True,
            'platforms': ['youtube', 'instagram', 'facebook', 'tiktok', 'twitter'],
            'features': [
                'Unlimited videos',
                'Unlimited clips',
                'All languages supported',
                'All platforms (YouTube, Instagram, Facebook, TikTok, Twitter)',
                'Advanced branding (intro/outro)',
                '4K quality support',
                'Dedicated support',
                'White-label API',
                'Team collaboration',
                'Advanced analytics',
                'Batch processing'
            ]
        }
    }
    
    # ==================== RATE LIMITING ====================
    RATE_LIMIT_ENABLED = os.getenv('RATE_LIMIT_ENABLED', 'True').lower() == 'true'
    RATE_LIMIT_FREE = '10 per hour'
    RATE_LIMIT_PRO = '100 per hour'
    RATE_LIMIT_BUSINESS = '1000 per hour'
    
    # ==================== SUPPORTED LANGUAGES ====================
    SUPPORTED_LANGUAGES = {
        'en': 'English',
        'hi': 'Hindi',
        'es': 'Spanish',
        'fr': 'French',
        'de': 'German',
        'it': 'Italian',
        'pt': 'Portuguese',
        'ru': 'Russian',
        'ja': 'Japanese',
        'ko': 'Korean',
        'zh': 'Chinese',
        'ar': 'Arabic',
        'tr': 'Turkish',
        'pl': 'Polish',
        'nl': 'Dutch',
        'sv': 'Swedish',
        'da': 'Danish',
        'fi': 'Finnish',
        'no': 'Norwegian',
        'cs': 'Czech',
        'hu': 'Hungarian',
        'ro': 'Romanian',
        'el': 'Greek',
        'th': 'Thai',
        'vi': 'Vietnamese',
        'id': 'Indonesian',
        'ms': 'Malay',
        'fa': 'Persian',
        'he': 'Hebrew',
        'bn': 'Bengali',
        'ta': 'Tamil',
        'te': 'Telugu',
        'mr': 'Marathi',
        'gu': 'Gujarati',
        'kn': 'Kannada',
        'ml': 'Malayalam',
        'pa': 'Punjabi',
        'ur': 'Urdu'
    }
    
    # ==================== DUBBING VOICES ====================
    TTS_VOICES = {
        'en': ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'],
        'hi': ['nova', 'shimmer'],  # OpenAI supports limited voices per language
        'default': ['nova']
    }
    
    # ==================== BRANDING DEFAULTS ====================
    DEFAULT_WATERMARK_OPACITY = 0.7
    DEFAULT_WATERMARK_POSITION = 'bottom-right'
    DEFAULT_LOGO_SIZE = 100
    
    # ==================== BACKGROUND JOB SETTINGS ====================
    CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0')
    CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')
    
    # ==================== LOGGING ====================
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_TO_FILE = os.getenv('LOG_TO_FILE', 'True').lower() == 'true'
    LOG_FILE_MAX_BYTES = int(os.getenv('LOG_FILE_MAX_BYTES', str(10 * 1024 * 1024)))  # 10MB
    LOG_FILE_BACKUP_COUNT = int(os.getenv('LOG_FILE_BACKUP_COUNT', '5'))
    
    # ==================== CORS ====================
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:5173,http://localhost:3000').split(',')
    
    # ==================== FRONTEND URL ====================
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')
    
    # ==================== API SETTINGS ====================
    API_TITLE = 'Locaa AI API'
    API_VERSION = '2.5.0'
    API_DESCRIPTION = 'AI-Powered Video Dubbing & Multi-Platform Publishing SaaS'
    
    # ==================== WEBHOOK URLS ====================
    WEBHOOK_JOB_COMPLETE = os.getenv('WEBHOOK_JOB_COMPLETE', '')
    WEBHOOK_JOB_FAILED = os.getenv('WEBHOOK_JOB_FAILED', '')
    
    # ==================== ANALYTICS ====================
    ENABLE_ANALYTICS = os.getenv('ENABLE_ANALYTICS', 'True').lower() == 'true'
    GOOGLE_ANALYTICS_ID = os.getenv('GOOGLE_ANALYTICS_ID', '')
    
    # ==================== SOCIAL MEDIA DEFAULTS ====================
    DEFAULT_VIDEO_TITLE_TEMPLATE = "{original_title} | AI Dubbed"
    DEFAULT_VIDEO_DESCRIPTION = "🎥 AI-Powered Video Dubbing by Locaa AI\n\n{original_description}\n\n#LocaaAI #AIDubbing #VideoTranslation"
    DEFAULT_HASHTAGS = ['LocaaAI', 'AIDubbing', 'VideoTranslation', 'AITools', 'ContentCreation']
    
    @staticmethod
    def init_app(app):
        """Initialize application with config"""
        # Create necessary directories
        dirs = [
            Config.UPLOAD_FOLDER,
            Config.VIDEO_FOLDER,
            Config.FULL_VIDEOS_FOLDER,
            Config.CLIPS_FOLDER,
            Config.REELS_FOLDER,
            Config.TEMP_FOLDER,
            Config.THUMBNAILS_FOLDER,
            Config.LOGS_FOLDER
        ]
        for dir_path in dirs:
            os.makedirs(dir_path, exist_ok=True)
        
        return True


class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    TESTING = False


class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    TESTING = False
    
    # Override with production-specific settings
    SQLALCHEMY_ECHO = False
    
    @classmethod
    def init_app(cls, app):
        Config.init_app(app)
        
        # Production-specific initialization
        import logging
        from logging.handlers import RotatingFileHandler
        
        if not app.debug:
            file_handler = RotatingFileHandler(
                os.path.join(cls.LOGS_FOLDER, 'locaa_ai.log'),
                maxBytes=cls.LOG_FILE_MAX_BYTES,
                backupCount=cls.LOG_FILE_BACKUP_COUNT
            )
            file_handler.setLevel(logging.INFO)
            file_handler.setFormatter(logging.Formatter(
                '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
            ))
            app.logger.addHandler(file_handler)
            app.logger.setLevel(logging.INFO)
            app.logger.info('Locaa AI startup')


class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False


# Config dictionary
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}


def get_config(env=None):
    """Get configuration based on environment"""
    if env is None:
        env = os.getenv('FLASK_ENV', 'development')
    return config.get(env, config['default'])
