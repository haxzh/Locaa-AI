"""
Database Models for Locaa AI SaaS Platform
"""
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import bcrypt
import json
import os

db = SQLAlchemy()


class User(db.Model):
    """User model for Locaa AI"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    
    # Profile
    first_name = db.Column(db.String(50))
    last_name = db.Column(db.String(50))
    avatar_url = db.Column(db.String(255))
    
    # Subscription
    subscription_tier = db.Column(db.String(20), default='free')  # free, pro, business
    subscription_status = db.Column(db.String(20), default='active')  # active, expired, cancelled
    subscription_start_date = db.Column(db.DateTime, default=datetime.utcnow)
    subscription_end_date = db.Column(db.DateTime)
    billing_cycle = db.Column(db.String(10), default='monthly')  # monthly, quarterly, yearly
    
    # Usage tracking
    videos_processed = db.Column(db.Integer, default=0)
    clips_generated = db.Column(db.Integer, default=0)
    uploads_published = db.Column(db.Integer, default=0)
    
    # API Keys
    api_key = db.Column(db.String(100), unique=True)
    
    # Account info
    youtube_channel_id = db.Column(db.String(100))
    instagram_username = db.Column(db.String(50))
    
    is_email_verified = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    jobs = db.relationship('Job', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    def verify_password(self, password):
        """Verify password"""
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))
    
    def to_dict(self):
        """Return user data as dictionary"""
        return {
            'id': self.id,
            'email': self.email,
            'username': self.username,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'avatar_url': self.avatar_url,
            'subscription_tier': self.subscription_tier,
            'subscription_status': self.subscription_status,
            'videos_processed': self.videos_processed,
            'clips_generated': self.clips_generated,
            'uploads_published': self.uploads_published,
            'youtube_channel_id': self.youtube_channel_id,
            'instagram_username': self.instagram_username,
            'is_email_verified': self.is_email_verified,
            'created_at': self.created_at.isoformat(),
            'subscription_start_date': self.subscription_start_date.isoformat(),
            'subscription_end_date': self.subscription_end_date.isoformat() if self.subscription_end_date else None
        }
    
    def get_plan_info(self):
        """Get plan details based on subscription tier"""
        plans = {
            'free': {
                'videos_per_month': int(os.getenv('FREE_TIER_VIDEOS_PER_MONTH', '20')),
                'clips_per_video': int(os.getenv('FREE_TIER_CLIPS_PER_VIDEO', '3')),
                'max_video_length': int(os.getenv('FREE_TIER_MAX_VIDEO_LENGTH', '3600')),
            },
            'pro': {
                'videos_per_month': int(os.getenv('PRO_TIER_VIDEOS_PER_MONTH', '30')),
                'clips_per_video': int(os.getenv('PRO_TIER_CLIPS_PER_VIDEO', '10')),
                'max_video_length': int(os.getenv('PRO_TIER_MAX_VIDEO_LENGTH', '3600')),
            },
            'business': {
                'videos_per_month': int(os.getenv('BUSINESS_TIER_VIDEOS_PER_MONTH', '999')),
                'clips_per_video': int(os.getenv('BUSINESS_TIER_CLIPS_PER_VIDEO', '999')),
                'max_video_length': int(os.getenv('BUSINESS_TIER_MAX_VIDEO_LENGTH', '3600')),
            }
        }
        return plans.get(self.subscription_tier, plans['free'])


class Job(db.Model):
    """Video processing job"""
    __tablename__ = 'jobs'
    
    id = db.Column(db.String(20), primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    video_id = db.Column(db.String(20), nullable=False)  # YouTube video ID
    youtube_url = db.Column(db.String(500), nullable=False)
    
    status = db.Column(db.String(50), default='downloading')  # downloading, processing, completed, failed
    progress = db.Column(db.Integer, default=0)  # 0-100
    error_message = db.Column(db.Text)
    
    # Detailed progress tracking
    current_step = db.Column(db.String(100))  # "Downloading video", "Generating clips", etc.
    download_progress = db.Column(db.Integer, default=0)  # 0-100
    clips_completed = db.Column(db.Integer, default=0)
    total_clips = db.Column(db.Integer, default=0)
    
    # Video info
    title = db.Column(db.String(255))
    description = db.Column(db.Text)
    duration = db.Column(db.Integer)  # seconds
    thumbnail_url = db.Column(db.String(500))
    
    # Processing details
    logo_path = db.Column(db.String(255))
    processing_type = db.Column(db.String(20), default='clips')  # 'clips' or 'full_video'
    clips_generated = db.Column(db.Integer, default=0)
    clips_published = db.Column(db.Integer, default=0)
    
    # Clips data (JSON)
    clips_data = db.Column(db.Text)  # JSON array of clips
    
    # Publishing info
    youtube_uploaded = db.Column(db.Boolean, default=False)
    instagram_uploaded = db.Column(db.Boolean, default=False)
    last_published_at = db.Column(db.DateTime)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    
    def to_dict(self):
        """Return job data as dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'video_id': self.video_id,
            'youtube_url': self.youtube_url,
            'status': self.status,
            'progress': self.progress,
            'current_step': self.current_step,
            'download_progress': self.download_progress,
            'clips_completed': self.clips_completed,
            'total_clips': self.total_clips,
            'processing_type': self.processing_type,
            'error_message': self.error_message,
            'title': self.title,
            'description': self.description,
            'duration': self.duration,
            'thumbnail_url': self.thumbnail_url,
            'clips_generated': self.clips_generated,
            'clips_published': self.clips_published,
            'youtube_uploaded': self.youtube_uploaded,
            'instagram_uploaded': self.instagram_uploaded,
            'last_published_at': self.last_published_at.isoformat() if self.last_published_at else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }
    
    def get_clips_data(self):
        """Get clips data as list"""
        if self.clips_data:
            return json.loads(self.clips_data)
        return []
    
    def set_clips_data(self, clips):
        """Set clips data from list"""
        self.clips_data = json.dumps(clips)


class SubscriptionPlan(db.Model):
    """Subscription plan details"""
    __tablename__ = 'subscription_plans'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False, unique=True)  # free, pro, business
    price_monthly = db.Column(db.Float, default=0)
    price_yearly = db.Column(db.Float, default=0)
    
    videos_per_month = db.Column(db.Integer)
    clips_per_video = db.Column(db.Integer)
    api_access = db.Column(db.Boolean, default=False)
    priority_support = db.Column(db.Boolean, default=False)
    custom_branding = db.Column(db.Boolean, default=False)
    
    description = db.Column(db.Text)
    features = db.Column(db.Text)  # JSON array of features
    
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class APIUsage(db.Model):
    """Track API usage for rate limiting"""
    __tablename__ = 'api_usage'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    endpoint = db.Column(db.String(100))
    method = db.Column(db.String(10))
    status_code = db.Column(db.Integer)
    response_time = db.Column(db.Float)  # milliseconds
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Notification(db.Model):
    """User notifications for billing, processing, and system events."""
    __tablename__ = 'notifications'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)

    type = db.Column(db.String(30), default='info')  # success, warning, error, info
    title = db.Column(db.String(180), nullable=False)
    message = db.Column(db.Text, nullable=False)
    source = db.Column(db.String(60), default='system')  # payment, jobs, system
    meta_json = db.Column(db.Text)

    is_read = db.Column(db.Boolean, default=False, index=True)
    read_at = db.Column(db.DateTime)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def to_dict(self):
        try:
            meta = json.loads(self.meta_json) if self.meta_json else {}
        except Exception:
            meta = {}

        return {
            'id': self.id,
            'user_id': self.user_id,
            'type': self.type,
            'title': self.title,
            'message': self.message,
            'source': self.source,
            'meta': meta,
            'is_read': self.is_read,
            'read_at': self.read_at.isoformat() if self.read_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class AuditLog(db.Model):
    """Audit log for tracking user actions"""
    __tablename__ = 'audit_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    action = db.Column(db.String(100))
    resource = db.Column(db.String(100))
    details = db.Column(db.Text)  # JSON data
    
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.String(255))
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


# ==================== PAYMENT & BILLING ====================

class Payment(db.Model):
    """Payment records for Stripe and Razorpay integration"""
    __tablename__ = 'payments'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Stripe fields (optional)
    stripe_payment_id = db.Column(db.String(100), unique=True, nullable=True)
    stripe_customer_id = db.Column(db.String(100))
    stripe_subscription_id = db.Column(db.String(100))
    
    # Razorpay fields (optional)
    transaction_id = db.Column(db.String(100), unique=True, nullable=True)  # Razorpay payment ID
    order_id = db.Column(db.String(100), nullable=True)  # Razorpay order ID
    
    amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(3), default='INR')
    status = db.Column(db.String(20), default='pending')  # pending, succeeded, failed, refunded, completed
    payment_method = db.Column(db.String(20), default='stripe')  # stripe, razorpay
    
    plan_name = db.Column(db.String(50))
    plan_id = db.Column(db.String(50))
    billing_cycle = db.Column(db.String(10))  # monthly, quarterly, yearly
    
    # Keep DB column name as 'metadata' but avoid reserved declarative attribute name.
    payment_metadata = db.Column('metadata', db.Text)  # JSON data
    
    paid_at = db.Column(db.DateTime)
    failed_at = db.Column(db.DateTime)
    refunded_at = db.Column(db.DateTime)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class EmailVerificationToken(db.Model):
    """Email verification tokens"""
    __tablename__ = 'email_verification_tokens'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    token = db.Column(db.String(255), unique=True, nullable=False)
    token_type = db.Column(db.String(20), default='email_verification')  # email_verification, password_reset
    
    is_used = db.Column(db.Boolean, default=False)
    used_at = db.Column(db.DateTime)
    
    expires_at = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class OTPVerification(db.Model):
    """OTP verification codes for auth"""
    __tablename__ = 'otp_verifications'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), nullable=False, index=True)
    otp_code = db.Column(db.String(6), nullable=False)
    otp_type = db.Column(db.String(20), default='login')  # login, signup, password_reset
    
    is_verified = db.Column(db.Boolean, default=False)
    attempts = db.Column(db.Integer, default=0)
    verified_at = db.Column(db.DateTime)
    
    expires_at = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


# ==================== SCHEDULING & BATCH ====================

class ScheduledPublish(db.Model):
    """Scheduled publishing for clips"""
    __tablename__ = 'scheduled_publishes'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    job_id = db.Column(db.String(20), db.ForeignKey('jobs.id'))
    
    clip_id = db.Column(db.String(100))
    platforms = db.Column(db.String(100))  # youtube, instagram, tiktok (comma-separated)
    
    title = db.Column(db.String(255))
    description = db.Column(db.Text)
    tags = db.Column(db.String(500))
    
    scheduled_time = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, published, failed, cancelled
    
    published_at = db.Column(db.DateTime)
    error_message = db.Column(db.Text)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class BatchProcessing(db.Model):
    """Batch processing jobs for multiple videos"""
    __tablename__ = 'batch_processing'
    
    id = db.Column(db.String(20), primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    name = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, processing, completed, failed
    
    total_videos = db.Column(db.Integer, default=0)
    processed_videos = db.Column(db.Integer, default=0)
    failed_videos = db.Column(db.Integer, default=0)
    
    video_urls = db.Column(db.Text)  # JSON array of URLs
    job_ids = db.Column(db.Text)  # JSON array of job IDs
    
    settings = db.Column(db.Text)  # JSON - includes clips per video, watermark, etc
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    started_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)


# ==================== CUSTOMIZATION ====================

class CustomWatermark(db.Model):
    """Custom watermarks for clips"""
    __tablename__ = 'custom_watermarks'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    name = db.Column(db.String(100), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    
    position = db.Column(db.String(20), default='bottom-right')  # top-left, top-right, bottom-left, bottom-right, center
    opacity = db.Column(db.Float, default=0.8)  # 0-1
    scale = db.Column(db.Float, default=1.0)  # relative to video width
    
    is_default = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class UserIntegration(db.Model):
    """Per-user integration credentials and connection state."""
    __tablename__ = 'user_integrations'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    provider = db.Column(db.String(40), nullable=False)  # youtube, instagram, tiktok, etc.

    config_json = db.Column(db.Text, default='{}')
    is_connected = db.Column(db.Boolean, default=False)
    last_connected_at = db.Column(db.DateTime)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (db.UniqueConstraint('user_id', 'provider', name='_unique_user_provider'),)

    @staticmethod
    def _is_secret_key(key):
        lowered = key.lower()
        secret_markers = ['secret', 'token', 'password', 'api_key', 'key']
        return any(marker in lowered for marker in secret_markers)

    @staticmethod
    def _mask_secret(value):
        if value is None:
            return ''
        text = str(value)
        if len(text) <= 4:
            return '****'
        return ('*' * (len(text) - 4)) + text[-4:]

    def get_config(self):
        try:
            return json.loads(self.config_json or '{}')
        except Exception:
            return {}

    def set_config(self, config):
        self.config_json = json.dumps(config or {})

    def to_dict(self):
        raw_config = self.get_config()
        config_masked = {}
        config_editable = {}

        for key, value in raw_config.items():
            if self._is_secret_key(key):
                config_masked[key] = self._mask_secret(value)
            else:
                config_masked[key] = value
                config_editable[key] = value

        return {
            'provider': self.provider,
            'is_connected': self.is_connected,
            'config_masked': config_masked,
            'config_editable': config_editable,
            'last_connected_at': self.last_connected_at.isoformat() if self.last_connected_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class UserBrandingConfig(db.Model):
    """Per-user branding configuration by project type."""
    __tablename__ = 'user_branding_configs'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    project_type = db.Column(db.String(20), nullable=False, default='clips')  # clips, full_video

    config_json = db.Column(db.Text, default='{}')

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (db.UniqueConstraint('user_id', 'project_type', name='_unique_user_branding_project_type'),)

    def get_config(self):
        try:
            return json.loads(self.config_json or '{}')
        except Exception:
            return {}

    def set_config(self, config):
        self.config_json = json.dumps(config or {})

    def to_dict(self):
        return {
            'project_type': self.project_type,
            'config': self.get_config(),
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


# ==================== INVITATIONS & TEAMS ====================

class UserInvite(db.Model):
    """User invitations for team collaboration"""
    __tablename__ = 'user_invites'
    
    id = db.Column(db.Integer, primary_key=True)
    
    inviter_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    invite_email = db.Column(db.String(120), nullable=False)
    invitee_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    
    role = db.Column(db.String(20), default='member')  # admin, editor, viewer
    status = db.Column(db.String(20), default='pending')  # pending, accepted, declined, expired
    
    token = db.Column(db.String(255), unique=True, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    
    accepted_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class AdminUser(db.Model):
    """Admin user permissions"""
    __tablename__ = 'admin_users'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=False)
    
    role = db.Column(db.String(20), default='moderator')  # admin, moderator, support
    
    can_manage_users = db.Column(db.Boolean, default=False)
    can_manage_payments = db.Column(db.Boolean, default=False)
    can_view_analytics = db.Column(db.Boolean, default=True)
    can_send_emails = db.Column(db.Boolean, default=False)
    can_manage_content = db.Column(db.Boolean, default=False)
    
    promoted_by = db.Column(db.Integer, db.ForeignKey('admin_users.id'))
    promoted_at = db.Column(db.DateTime, default=datetime.utcnow)


# ==================== RATE LIMITING ====================

class RateLimitTracker(db.Model):
    """Track API rate limits per user"""
    __tablename__ = 'rate_limit_tracker'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    endpoint = db.Column(db.String(100), nullable=False)
    request_count = db.Column(db.Integer, default=0)
    last_reset = db.Column(db.DateTime, default=datetime.utcnow)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    __table_args__ = (db.UniqueConstraint('user_id', 'endpoint', name='_unique_user_endpoint'),)


# ==================== AI GENERATION ====================

class AIGeneration(db.Model):
    """Track AI-generated images and videos"""
    __tablename__ = 'ai_generations'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    
    # Generation details
    prompt = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(20), nullable=False)  # 'image' or 'video'
    
    # Result
    url = db.Column(db.String(500), nullable=False)  # URL to generated image/video
    
    # Metadata
    status = db.Column(db.String(20), default='completed')  # pending, processing, completed, failed
    error_message = db.Column(db.Text)  # Error details if failed
    generation_time_ms = db.Column(db.Integer)  # Time taken in milliseconds
    
    # Model info
    model_used = db.Column(db.String(100))  # 'dall-e-3', 'replicate-text2video', etc.
    generation_params = db.Column(db.Text)  # JSON: size, quality, duration, etc.
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        try:
            params = json.loads(self.generation_params) if self.generation_params else {}
        except Exception:
            params = {}
        
        return {
            'id': self.id,
            'user_id': self.user_id,
            'prompt': self.prompt,
            'type': self.type,
            'url': self.url,
            'status': self.status,
            'error_message': self.error_message,
            'generation_time_ms': self.generation_time_ms,
            'model_used': self.model_used,
            'generation_params': params,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
        }
