
# app.py - Locaa AI SaaS Backend v2.5
import os
import uuid
import json
import threading
import time
import random
import secrets
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required
from dotenv import load_dotenv

# Import models and auth
from database.models import db, User, Job, SubscriptionPlan, APIUsage, AuditLog, UserBrandingConfig
from core.auth_routes import auth_bp
from core.payment_routes import payment_bp
from core.scheduled_routes import scheduled_bp
from core.batch_routes import batch_bp
from core.admin_routes import admin_bp
from core.invite_routes import invite_bp
from core.watermark_routes import watermark_bp
from core.integrations_routes import integrations_bp
from core.oauth_routes import oauth_bp
from core.branding_routes import branding_bp
from core.publishing_routes import publishing_bp  # NEW: Multi-platform publishing
from core.analytics_routes import analytics_bp
from core.notifications_routes import notifications_bp
from core.ai_routes import ai_bp
from utils.auth import get_current_user, user_required, check_subscription_limit
from utils.auth import track_api_usage
from utils.notifications import create_notification
from utils.logger import log
from utils.youtube import extract_youtube_video_id, normalize_youtube_url
from core.email_handler import init_mail, send_otp_email

# Import core modules
from core.video_watcher import check_new_video
from core.youtube_uploader import upload_short
from core.clip_generator import generate_ai_clips
from core.video_downloader import download_video
from utils.text_utils import generate_title, generate_description

load_dotenv()

# Initialize Flask app
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///locaa_ai.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'super-secret-key-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

# Initialize extensions
db.init_app(app)
jwt = JWTManager(app)

cors_origins_env = os.getenv('CORS_ORIGINS') or os.getenv('FRONTEND_URL') or '*'
if cors_origins_env.strip() == '*':
    cors_origins = '*'
else:
    cors_origins = [origin.strip() for origin in cors_origins_env.split(',') if origin.strip()]

CORS(app, resources={r"/api/*": {"origins": cors_origins}}, supports_credentials=False)

# Initialize email
init_mail(app)

# Register blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(payment_bp)
app.register_blueprint(scheduled_bp)
app.register_blueprint(batch_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(invite_bp)
app.register_blueprint(watermark_bp)
app.register_blueprint(integrations_bp)
app.register_blueprint(oauth_bp)
app.register_blueprint(branding_bp)
app.register_blueprint(publishing_bp)  # NEW: Multi-platform publishing
app.register_blueprint(analytics_bp)
app.register_blueprint(notifications_bp)
app.register_blueprint(ai_bp)

# Create tables
with app.app_context():
    db.create_all()
    
    # Ensure video directories exist
    base_dir = os.path.dirname(os.path.dirname(__file__))
    video_dirs = [
        os.path.join(base_dir, "videos", "full_videos"),
        os.path.join(base_dir, "videos", "clips"),
        os.path.join(base_dir, "videos", "temp"),
        os.path.join(base_dir, "backend", "uploads")
    ]
    for dir_path in video_dirs:
        os.makedirs(dir_path, exist_ok=True)
    
    log("Database tables and video directories initialized")


# ==================== API USAGE TRACKING ====================

@app.before_request
def _record_request_start():
    """Stamp request start time for response-time calculation."""
    import time
    from flask import g
    g._request_start = time.monotonic()


@app.after_request
def _track_api_key_usage(response):
    """Log API usage when the caller authenticated via X-API-Key."""
    import time
    from flask import g
    try:
        # Only track if request came in with an API key header
        api_key_header = request.headers.get('X-API-Key') or request.args.get('api_key')
        if api_key_header and hasattr(g, 'current_user') and g.current_user:
            elapsed_ms = round((time.monotonic() - getattr(g, '_request_start', time.monotonic())) * 1000, 2)
            track_api_usage(
                user_id=g.current_user.id,
                endpoint=request.path,
                method=request.method,
                status_code=response.status_code,
                response_time_ms=elapsed_ms,
            )
    except Exception:
        pass  # never break the response
    return response


# ==================== HEALTH & INFO ====================

@app.route("/", methods=["GET"])
def home():
    """Home endpoint"""
    return jsonify({
        "product": "Locaa AI",
        "status": "API running 🚀",
        "version": "2.0.0",
        "type": "SaaS Backend"
    })


@app.route("/api/health", methods=["GET"])
def health():
    """Health check endpoint"""
    dubbing_ready = True
    try:
        import whisper  # noqa: F401
    except Exception:
        dubbing_ready = False
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "database": "connected",
        "dubbing_ready": dubbing_ready
    })


@app.route("/api/plans", methods=["GET"])
def get_subscription_plans():
    """Get available subscription plans"""
    plans = SubscriptionPlan.query.filter_by(is_active=True).all()
    
    return jsonify([{
        'id': plan.id,
        'name': plan.name,
        'price_monthly': plan.price_monthly,
        'price_yearly': plan.price_yearly,
        'videos_per_month': plan.videos_per_month,
        'clips_per_video': plan.clips_per_video,
        'api_access': plan.api_access,
        'priority_support': plan.priority_support,
        'custom_branding': plan.custom_branding,
        'description': plan.description
    } for plan in plans]), 200


# ==================== OTP & EMAIL VERIFICATION ====================

# In-memory OTP storage (replace with Redis in production)
otp_storage = {}

@app.route("/api/send-otp", methods=["POST"])
def send_otp():
    """Send OTP to email for verification"""
    data = request.get_json()
    email = data.get('email')
    
    if not email:
        return jsonify({'error': 'Email is required'}), 400
    
    # Validate email format
    import re
    if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
        return jsonify({'error': 'Invalid email format'}), 400
    
    try:
        # Generate 6-digit OTP
        otp_code = str(random.randint(100000, 999999))
        
        # Store OTP with expiration (10 minutes)
        otp_storage[email] = {
            'code': otp_code,
            'expires_at': datetime.utcnow() + timedelta(minutes=10),
            'attempts': 0
        }
        
        # Send OTP via email
        email_sent = send_otp_email(email, otp_code)
        if not email_sent:
            log(f"Failed to send OTP email to {email}, but logging OTP: {otp_code}", level='warning')
        else:
            log(f"OTP email sent successfully to {email}")
        
        # Development mode: Log OTP for testing
        log(f"[DEV MODE] OTP Code for {email}: {otp_code}", level='info')
        
        return jsonify({
            'message': 'OTP sent to your email',
            'email': email,
            'expires_in': 600  # seconds
        }), 200
        
    except Exception as e:
        log(f"Error sending OTP: {str(e)}", level='error')
        return jsonify({'error': 'Failed to send OTP'}), 500


@app.route("/api/verify-otp", methods=["POST"])
def verify_otp():
    """Verify OTP sent to email"""
    data = request.get_json()
    email = data.get('email')
    otp = data.get('otp')
    
    if not email or not otp:
        return jsonify({'error': 'Email and OTP are required'}), 400
    
    try:
        if email not in otp_storage:
            return jsonify({'error': 'No OTP request found for this email'}), 400
        
        otp_data = otp_storage[email]
        
        # Check if OTP expired
        if datetime.utcnow() > otp_data['expires_at']:
            del otp_storage[email]
            return jsonify({'error': 'OTP has expired'}), 400
        
        # Check attempts
        if otp_data['attempts'] >= 5:
            del otp_storage[email]
            return jsonify({'error': 'Too many failed attempts'}), 429
        
        # Verify OTP
        if otp != otp_data['code']:
            otp_data['attempts'] += 1
            return jsonify({'error': 'Invalid OTP'}), 400
        
        # OTP verified successfully
        del otp_storage[email]
        
        return jsonify({
            'message': 'OTP verified successfully',
            'email': email,
            'verified': True
        }), 200
        
    except Exception as e:
        log(f"Error verifying OTP: {str(e)}", level='error')
        return jsonify({'error': 'Failed to verify OTP'}), 500



# ==================== BACKGROUND PROCESSING ====================

def process_video_background(job_id):
    """
    Background worker to actually download and process videos
    Runs in a separate thread to avoid blocking API responses
    """
    with app.app_context():
        try:
            job = Job.query.get(job_id)
            if not job:
                log(f"Job {job_id} not found for processing", level='error')
                return
            
            log(f"Starting background processing for job {job_id} in '{job.processing_type}' mode")
            
            # Phase 1: Download video (Skip if local upload)
            if not job.video_id.startswith('local_'):
                job.current_step = "Initializing download from YouTube..."
                job.status = "downloading"
                db.session.commit()
                
                last_update_percent = [-10] # Using list for closure mutation
                def update_download_progress(percent):
                    """Callback to update download progress"""
                    try:
                        # Throttle updates to every 5%
                        if percent < 100 and percent - last_update_percent[0] < 5:
                            return
                        last_update_percent[0] = percent
                        
                        # Check if job was cancelled during download
                        job_check = Job.query.get(job_id)
                        if job_check and job_check.status == "cancelled":
                            log(f"Job {job_id} cancelled during download")
                            return False  # Signal to stop download
                        
                        job.download_progress = int(percent)
                        job.current_step = f"Downloading video... {int(percent)}%"
                        job.progress = int(percent * 0.5)  # Download is 50% of total
                        db.session.commit()
                    except Exception as e:
                        log(f"Error updating download progress: {e}", level='error')
                
                # Actually download the video and capture real error
                success, download_error = download_video(
                    job.video_id,
                    progress_callback=update_download_progress,
                    return_details=True,
                )
                
                # Check if cancelled after download attempt
                job = Job.query.get(job_id)
                if job.status == "cancelled":
                    log(f"Job {job_id} was cancelled during download")
                    return
                
                if not success:
                    job.status = "failed"
                    job.error_message = download_error or "Failed to download video from YouTube"
                    job.current_step = "Download failed"
                    db.session.commit()
                    log(f"Job {job_id} failed: {job.error_message}", level='error')
                    return
            
            job.download_progress = 100
            job.current_step = "Download complete! Processing video..."
            job.progress = 50
            db.session.commit()
            time.sleep(1)
            
            # Check if cancelled before processing
            job = Job.query.get(job_id)
            if job.status == "cancelled":
                log(f"Job {job_id} was cancelled before processing")
                return
            
            # Resolve source video for this specific job only (avoid cross-job file mixups).
            video_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "videos", "full_videos")
            if job.video_id.startswith('local_'):
                video_path = os.path.join(video_dir, f"{job.video_id}.mp4")
            else:
                candidates = [
                    f for f in os.listdir(video_dir)
                    if f.lower().endswith('.mp4') and (f.startswith(f"{job.video_id}__") or job.video_id in f)
                ]

                if not candidates:
                    job.status = "failed"
                    job.error_message = "Downloaded file for this video was not found"
                    job.current_step = "Download file missing"
                    db.session.commit()
                    return

                candidates.sort(key=lambda x: os.path.getmtime(os.path.join(video_dir, x)), reverse=True)
                video_path = os.path.join(video_dir, candidates[0])

            if not os.path.exists(video_path):
                job.status = "failed"
                job.error_message = "Video file not found after download"
                job.current_step = "Download file missing"
                db.session.commit()
                return
            
            log(f"Processing video: {video_path} (mode: {job.processing_type})")
            
            # Phase 2: Process based on type
            extra_config = job.get_clips_data() if job.get_clips_data() else {}
            target_language = extra_config.get('target_language')
            
            if job.processing_type == 'full_video':
                if target_language:
                    # AI Dubbing Pipeline
                    job.status = "processing"
                    job.current_step = f"Starting AI Dubbing to {target_language}..."
                    job.progress = 60
                    db.session.commit()
                    
                    from core.video_dubber import process_dubbing_pipeline
                    
                    def dubbing_status_callback(msg, progress_val):
                        current_prog = 60 + int((progress_val / 100) * 35)
                        try:
                            # Re-fetch job to avoid stale session
                            j = Job.query.get(job_id)
                            if j and j.status != "cancelled":
                                j.current_step = msg
                                j.progress = current_prog
                                db.session.commit()
                        except:
                            pass
                            
                    base_dir = os.path.dirname(os.path.dirname(__file__))
                    temp_dir = os.path.join(base_dir, "videos", "temp")
                    output_dir = os.path.join(base_dir, "videos", "full_videos")
                    
                    try:
                        branding_row = UserBrandingConfig.query.filter_by(
                            user_id=job.user_id,
                            project_type='full_video'
                        ).first()
                        branding_config = branding_row.get_config() if branding_row else {}
                        overrides = extra_config.get('branding_overrides') if isinstance(extra_config, dict) else {}
                        if isinstance(overrides, dict):
                            branding_config.update(overrides)
                        
                        dubbed_vid, thumb = process_dubbing_pipeline(
                            video_path=video_path,
                            target_language=target_language,
                            temp_dir=temp_dir,
                            output_dir=output_dir,
                            logo_path=job.logo_path,
                            branding_config=branding_config,
                            status_callback=dubbing_status_callback
                        )
                        
                        job = Job.query.get(job_id)
                        if job.status == "cancelled": return
                        
                        job.clips_generated = 1
                        job.total_clips = 1
                        job.thumbnail_url = os.path.basename(thumb) if thumb else None
                        
                        # Store the downloaded dubbed video path for publishing
                        extra_config['dubbed_video_path'] = dubbed_vid
                        job.set_clips_data(extra_config)
                        
                        job.progress = 100
                        job.status = "completed"
                        job.current_step = "AI Dubbing complete! Ready for publishing."
                        job.completed_at = datetime.utcnow()
                        db.session.commit()

                        create_notification(
                            user_id=job.user_id,
                            notif_type='success',
                            source='jobs',
                            title='Dubbing Completed',
                            message=f"Your dubbed video is ready in {target_language.capitalize()}.",
                            meta={'job_id': job.id, 'status': 'completed'}
                        )
                        
                        log(f"Job {job_id} completed AI Dubbing successfully to {target_language}")
                    except Exception as e:
                        job = Job.query.get(job_id)
                        job.status = "failed"
                        job.error_message = f"AI Dubbing failed: {str(e)}"
                        job.current_step = "Dubbing failed"
                        db.session.commit()
                        create_notification(
                            user_id=job.user_id,
                            notif_type='error',
                            source='jobs',
                            title='Dubbing Failed',
                            message=f"Job {job.id} failed during dubbing. {str(e)[:140]}",
                            meta={'job_id': job.id, 'status': 'failed'}
                        )
                        log(f"Job {job_id} AI Dubbing failed: {e}", level='error')
                        return
                        
                else:
                    # Full video upload mode - skip clip generation
                    job.status = "processing"
                    job.current_step = "Preparing full video for upload..."
                    job.progress = 75
                    db.session.commit()
                    time.sleep(1)
                    
                    # Check if cancelled
                    job = Job.query.get(job_id)
                    if job.status == "cancelled":
                        log(f"Job {job_id} cancelled before full video upload")
                        return
                    
                    job.clips_generated = 0
                    job.total_clips = 0
                    job.progress = 100
                    job.status = "completed"
                    job.current_step = "Full video ready for publishing!"
                    job.completed_at = datetime.utcnow()
                    db.session.commit()

                    create_notification(
                        user_id=job.user_id,
                        notif_type='success',
                        source='jobs',
                        title='Processing Completed',
                        message='Your full video is ready for publishing.',
                        meta={'job_id': job.id, 'status': 'completed'}
                    )
                    
                    log(f"Job {job_id} completed in full_video mode")
                
            else:
                # Clips mode - generate AI clips
                job.status = "processing"
                job.current_step = "Analyzing video content..."
                job.total_clips = 5  # Default, will be updated by clip generator
                db.session.commit()
                
                # Check if cancelled
                job = Job.query.get(job_id)
                if job.status == "cancelled":
                    log(f"Job {job_id} cancelled before clip generation")
                    return
                
                try:
                    job.current_step = "Generating AI clips..."
                    db.session.commit()

                    branding_row = UserBrandingConfig.query.filter_by(
                        user_id=job.user_id,
                        project_type='clips'
                    ).first()
                    branding_config = branding_row.get_config() if branding_row else {}
                    overrides = extra_config.get('branding_overrides') if isinstance(extra_config, dict) else {}
                    if isinstance(overrides, dict):
                        branding_config.update(overrides)

                    # Request-level logo_path should override saved branding when provided.
                    if job.logo_path:
                        branding_config['logo_path'] = job.logo_path
                    
                    clips = generate_ai_clips(video_path, branding_config=branding_config)
                    
                    # Check if cancelled after clip generation
                    job = Job.query.get(job_id)
                    if job.status == "cancelled":
                        log(f"Job {job_id} cancelled after clip generation")
                        return
                    
                    job.clips_generated = len(clips) if clips else 0
                    job.clips_completed = job.clips_generated
                    job.total_clips = job.clips_generated
                    
                    # --- AUTO-PUBLISH LOGIC ---
                    auto_publish = extra_config.get("publish_platforms", [])
                    if auto_publish and clips:
                        job.current_step = "Auto-publishing clips..."
                        db.session.commit()
                        try:
                            if 'youtube' in auto_publish:
                                from core.youtube_uploader import upload_short
                                title = f"{job.title[:60] if job.title else 'AI Generated Clip'} #shorts"
                                desc = "Generated via Locaa AI\n#shorts #viral #ai"
                                upload_short(clips[0], title, desc)
                                job.youtube_uploaded = True
                                log(f"Job {job_id} auto-published to YouTube successfully")
                        except Exception as e:
                            create_notification(
                                user_id=job.user_id,
                                notif_type='warning',
                                source='jobs',
                                title='Auto-Publish Failed',
                                message=f"Processing finished but auto-publish failed: {str(e)[:140]}",
                                meta={'job_id': job.id, 'stage': 'auto-publish'}
                            )
                            log(f"Auto-publish failed for job {job_id}: {e}", level='error')
                    
                    job.progress = 100
                    job.status = "completed"
                    job.current_step = "Processing complete!"
                    job.completed_at = datetime.utcnow()
                    db.session.commit()

                    create_notification(
                        user_id=job.user_id,
                        notif_type='success',
                        source='jobs',
                        title='Clips Ready',
                        message=f"Your job is complete with {job.clips_generated} clips generated.",
                        meta={'job_id': job.id, 'clips_generated': job.clips_generated}
                    )
                    
                    log(f"Job {job_id} completed successfully with {job.clips_generated} clips")
                    
                except Exception as e:
                    job.status = "failed"
                    job.error_message = f"Clip generation failed: {str(e)}"
                    job.current_step = "Clip generation failed"
                    db.session.commit()
                    create_notification(
                        user_id=job.user_id,
                        notif_type='error',
                        source='jobs',
                        title='Clip Generation Failed',
                        message=f"Job {job.id} failed while generating clips. {str(e)[:140]}",
                        meta={'job_id': job.id, 'status': 'failed'}
                    )
                    log(f"Job {job_id} clip generation failed: {e}", level='error')
                
        except Exception as e:
            log(f"Critical error in background processing for job {job_id}: {e}", level='error')
            try:
                job = Job.query.get(job_id)
                if job:
                    job.status = "failed"
                    job.error_message = str(e)
                    job.current_step = "Processing failed"
                    db.session.commit()
                    create_notification(
                        user_id=job.user_id,
                        notif_type='error',
                        source='jobs',
                        title='Processing Failed',
                        message=f"Job {job.id} encountered a critical error. {str(e)[:140]}",
                        meta={'job_id': job.id, 'status': 'failed'}
                    )
            except:
                pass


def _resolve_publish_video_path(job, preferred_path=None):
    """Resolve a video file path for publishing based on job type."""
    if preferred_path and os.path.exists(preferred_path):
        return preferred_path

    extra_config = job.get_clips_data() if job.get_clips_data() else {}
    dubbed_path = extra_config.get('dubbed_video_path')
    if job.processing_type == "full_video" and dubbed_path and os.path.exists(dubbed_path):
        return dubbed_path

    base_dir = os.path.dirname(os.path.dirname(__file__))
    target_dir = "full_videos" if job.processing_type == "full_video" else "clips"
    video_dir = os.path.join(base_dir, "videos", target_dir)

    if not os.path.isdir(video_dir):
        return None

    candidates = [
        os.path.join(video_dir, f)
        for f in os.listdir(video_dir)
        if f.lower().endswith(".mp4")
    ]

    if not candidates:
        return None

    # Prefer filenames containing the source video id for better match.
    id_matches = [p for p in candidates if job.video_id and job.video_id in os.path.basename(p)]
    selected = id_matches if id_matches else candidates
    selected.sort(key=os.path.getmtime, reverse=True)
    return selected[0]


# ==================== VIDEO PROCESSING API ====================

@app.route("/api/process-video", methods=["POST"])
@jwt_required()
def process_video():
    """
    Process YouTube video - Extract clips, add logo, prepare for publishing
    """
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    
    # Check subscription limits
    can_process, message = check_subscription_limit(user, 'videos')
    if not can_process:
        return jsonify({"error": message}), 403
    
    try:
        is_multipart = request.content_type and request.content_type.startswith('multipart/form-data')
        
        if is_multipart:
            data = request.form.to_dict()
            video_file = request.files.get("video_file")
            youtube_url = data.get("youtube_url", "").strip()
            publish_platforms_str = data.get("publish_platforms")
            if publish_platforms_str:
                try:
                    publish_platforms = json.loads(publish_platforms_str)
                except:
                    publish_platforms = []
            else:
                publish_platforms = []
        else:
            data = request.get_json(silent=True) or {}
            youtube_url = (data.get("youtube_url") or "").strip()
            video_file = None
            publish_platforms = data.get("publish_platforms", [])
            
        logo_path = data.get("logo_path")
        processing_type = data.get("processing_type", "clips")  # 'clips' or 'full_video'
        target_language = data.get("target_language") # Optional, for dubbing
        branding_overrides_raw = data.get("branding_overrides")

        branding_overrides = {}
        if branding_overrides_raw:
            if isinstance(branding_overrides_raw, str):
                try:
                    branding_overrides = json.loads(branding_overrides_raw)
                except Exception:
                    branding_overrides = {}
            elif isinstance(branding_overrides_raw, dict):
                branding_overrides = branding_overrides_raw
        
        if not youtube_url and not video_file:
            return jsonify({"error": "youtube_url or video_file is required"}), 400
        
        if processing_type not in ['clips', 'full_video']:
            return jsonify({"error": "Invalid processing_type. Must be 'clips' or 'full_video'"}), 400
        
        job_id = str(uuid.uuid4())[:8]
        
        if video_file:
            video_id = f"local_{job_id}"
            canonical_url = f"local://{video_id}"
            # Ensure dir exists and save
            video_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "videos", "full_videos")
            os.makedirs(video_dir, exist_ok=True)
            video_file.save(os.path.join(video_dir, f"{video_id}.mp4"))
        else:
            video_id = extract_youtube_video_id(youtube_url)
            if not video_id:
                return jsonify({
                    "error": "Invalid YouTube URL. Supported: watch, shorts, youtu.be, embed, or raw 11-char video ID"
                }), 400
            canonical_url = normalize_youtube_url(video_id)
        
        # Create job in database
        job = Job(
            id=job_id,
            user_id=user.id,
            video_id=video_id,
            youtube_url=canonical_url,
            status="downloading",
            progress=0,
            logo_path=logo_path,
            processing_type=processing_type
        )
        
        # Store extra config in clips_data JSON to avoid database migration
        extra_config = {}
        if target_language:
            extra_config['target_language'] = target_language
        if publish_platforms:
            extra_config['publish_platforms'] = publish_platforms
        if branding_overrides:
            extra_config['branding_overrides'] = branding_overrides
        
        if extra_config:
            job.set_clips_data(extra_config)
            
        db.session.add(job)
        user.videos_processed += 1
        db.session.commit()
        
        # Log action
        audit_log = AuditLog(
            user_id=user.id,
            action='video_processing_started',
            resource='Job',
            details=json.dumps({'job_id': job_id, 'video_id': video_id, 'type': processing_type, 'language': target_language})
        )
        db.session.add(audit_log)
        db.session.commit()
        
        # Start background processing in a separate thread
        thread = threading.Thread(target=process_video_background, args=(job_id,))
        thread.daemon = True
        thread.start()
        
        log(f"Job {job_id} created and processing started for user {user.id}")
        
        return jsonify({
            "job_id": job_id,
            "video_id": video_id,
            "youtube_url": canonical_url,
            "processing_type": processing_type,
            "target_language": target_language,
            "status": "processing_started",
            "message": f"Video processing started in '{processing_type}' mode. Check status for updates."
        }), 202
        
    except Exception as e:
        log(f"Error processing video: {str(e)}", level="error")
        return jsonify({"error": str(e)}), 500


@app.route("/api/jobs", methods=["GET"])
@jwt_required()
def get_jobs():
    """Get all jobs for current user"""
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    
    jobs = Job.query.filter_by(user_id=user.id).order_by(Job.created_at.desc()).all()
    
    return jsonify([job.to_dict() for job in jobs]), 200


@app.route("/api/jobs/<job_id>", methods=["GET"])
@jwt_required()
def get_job(job_id):
    """Get specific job details"""
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    
    job = Job.query.filter_by(id=job_id, user_id=user.id).first()
    
    if not job:
        return jsonify({"error": "Job not found"}), 404
    
    return jsonify(job.to_dict()), 200


@app.route("/api/status/<job_id>", methods=["GET"])
@jwt_required()
def get_status(job_id):
    """Get job processing status"""
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    
    job = Job.query.filter_by(id=job_id, user_id=user.id).first()
    
    if not job:
        return jsonify({"error": "Job not found"}), 404
    
    return jsonify({
        "job_id": job.id,
        "status": job.status,
        "progress": job.progress,
        "clips_generated": job.clips_generated,
        "clips_published": job.clips_published,
        "error_message": job.error_message,
        "title": job.title,
        "description": job.description,
        "duration": job.duration,
        "youtube_uploaded": job.youtube_uploaded,
        "instagram_uploaded": job.instagram_uploaded
    }), 200


@app.route("/api/upload-logo", methods=["POST"])
@jwt_required()
def upload_logo():
    """Upload logo for processing"""
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    # Validate file type
    if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif')):
        return jsonify({"error": "Invalid file type. Allowed: PNG, JPG, GIF"}), 400
    
    try:
        # Create uploads directory if it doesn't exist
        upload_dir = os.path.join(os.path.dirname(__file__), 'uploads', str(user.id))
        os.makedirs(upload_dir, exist_ok=True)
        
        # Save file with unique name
        filename = f"logo_{datetime.utcnow().timestamp()}_{file.filename}"
        filepath = os.path.join(upload_dir, filename)
        file.save(filepath)
        
        return jsonify({
            "message": "Logo uploaded successfully",
            "logo_path": filepath,
            "filename": filename
        }), 200
    
    except Exception as e:
        log(f"Error uploading logo: {str(e)}", level="error")
        return jsonify({"error": str(e)}), 500


@app.route("/api/publish/<job_id>", methods=["POST"])
@jwt_required()
def publish_job(job_id):
    """Publish job clips to YouTube/Instagram"""
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    
    job = Job.query.filter_by(id=job_id, user_id=user.id).first()
    
    if not job:
        return jsonify({"error": "Job not found"}), 404
    
    if job.status != "completed":
        return jsonify({"error": "Job must be completed before publishing"}), 400
    
    data = request.json or {}
    publish_to_youtube = data.get('youtube', True)
    publish_to_instagram = data.get('instagram', False)
    title = (data.get('title') or '').strip()
    description = (data.get('description') or '').strip()
    
    try:
        # Publish to YouTube
        if publish_to_youtube:
            video_path = _resolve_publish_video_path(job, preferred_path=data.get('video_path'))
            if not video_path:
                return jsonify({"error": "No processed video found for publishing"}), 400

            if not title:
                title = generate_title(video_path)
            if not description:
                description = generate_description()

            uploaded_video_id = upload_short(video_path, title, description)
            job.youtube_uploaded = bool(uploaded_video_id)
        
        # Publish to Instagram
        if publish_to_instagram:
            # Instagram publishing logic
            job.instagram_uploaded = True
        
        job.last_published_at = datetime.utcnow()
        job.clips_published = job.clips_generated if job.processing_type == 'clips' else int(job.youtube_uploaded)
        user.uploads_published += 1
        
        db.session.commit()
        
        return jsonify({
            "message": "Publishing completed",
            "youtube_uploaded": job.youtube_uploaded,
            "instagram_uploaded": job.instagram_uploaded
        }), 200
    
    except Exception as e:
        log(f"Error publishing job: {str(e)}", level="error")
        return jsonify({"error": str(e)}), 500


@app.route("/api/cancel-job/<job_id>", methods=["POST"])
@jwt_required()
def cancel_job(job_id):
    """Cancel a processing job"""
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    
    job = Job.query.filter_by(id=job_id, user_id=user.id).first()
    
    if not job:
        return jsonify({"error": "Job not found"}), 404
    
    if job.status in ["completed", "cancelled", "failed"]:
        return jsonify({"error": f"Cannot cancel {job.status} job"}), 400
    
    # Mark as cancelled
    job.status = "cancelled"
    job.current_step = "Cancelled by user"
    job.error_message = "Processing cancelled by user"
    db.session.commit()
    
    log(f"Job {job_id} cancelled by user {user.id}")
    
    return jsonify({
        "message": "Job cancelled successfully",
        "job_id": job_id,
        "status": "cancelled"
    }), 200


# ==================== DOWNLOAD ENDPOINTS ====================

from flask import send_file, send_from_directory
import zipfile
import io

@app.route("/api/download/clip/<job_id>/<int:clip_index>", methods=["GET"])
@jwt_required()
def download_clip(job_id, clip_index):
    """Download a specific clip from a completed job"""
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    
    job = Job.query.filter_by(id=job_id, user_id=user.id).first()
    
    if not job:
        return jsonify({"error": "Job not found"}), 404
    
    if job.status != "completed":
        return jsonify({"error": "Job not completed yet"}), 400
    
    # Find clip file
    base_dir = os.path.dirname(os.path.dirname(__file__))
    clips_dir = os.path.join(base_dir, "videos", "clips")
    
    if not os.path.exists(clips_dir):
        return jsonify({"error": "Clips directory not found"}), 404
    
    # Find clip files for this job
    clip_files = [f for f in os.listdir(clips_dir) if f.endswith('.mp4') and job.video_id in f]
    
    if clip_index >= len(clip_files):
        return jsonify({"error": "Clip index out of range"}), 404
    
    clip_file = clip_files[clip_index]
    clip_path = os.path.join(clips_dir, clip_file)
    
    if not os.path.exists(clip_path):
        return jsonify({"error": "Clip file not found"}), 404
    
    log(f"User {user.id} downloading clip {clip_index} from job {job_id}")
    
    return send_file(
        clip_path,
        as_attachment=True,
        download_name=f"locaa_ai_clip_{clip_index+1}_{job_id}.mp4",
        mimetype='video/mp4'
    )


@app.route("/api/download/all/<job_id>", methods=["GET"])
@jwt_required()
def download_all_clips(job_id):
    """Download all clips from a job as a ZIP file"""
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    
    job = Job.query.filter_by(id=job_id, user_id=user.id).first()
    
    if not job:
        return jsonify({"error": "Job not found"}), 404
    
    if job.status != "completed":
        return jsonify({"error": "Job not completed yet"}), 400
    
    base_dir = os.path.dirname(os.path.dirname(__file__))
    
    if job.processing_type == 'full_video':
        # Return the full video
        video_dir = os.path.join(base_dir, "videos", "full_videos")
        video_files = [f for f in os.listdir(video_dir) if f.endswith('.mp4') and job.video_id in f]
        
        if not video_files:
            video_files = [f for f in os.listdir(video_dir) if f.endswith('.mp4')]
        
        if not video_files:
            return jsonify({"error": "Video file not found"}), 404
        
        video_files.sort(key=lambda x: os.path.getmtime(os.path.join(video_dir, x)), reverse=True)
        video_path = os.path.join(video_dir, video_files[0])
        
        return send_file(
            video_path,
            as_attachment=True,
            download_name=f"locaa_ai_full_video_{job_id}.mp4",
            mimetype='video/mp4'
        )
    
    else:
        # Create ZIP of all clips
        clips_dir = os.path.join(base_dir, "videos", "clips")
        
        if not os.path.exists(clips_dir):
            return jsonify({"error": "Clips directory not found"}), 404
        
        clip_files = [f for f in os.listdir(clips_dir) if f.endswith('.mp4') and job.video_id in f]
        
        if not clip_files:
            return jsonify({"error": "No clips found"}), 404
        
        # Create ZIP in memory
        memory_file = io.BytesIO()
        with zipfile.ZipFile(memory_file, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for idx, clip_file in enumerate(clip_files):
                clip_path = os.path.join(clips_dir, clip_file)
                zipf.write(clip_path, f"clip_{idx+1}_{job_id}.mp4")
        
        memory_file.seek(0)
        
        log(f"User {user.id} downloading all clips from job {job_id} as ZIP")
        
        return send_file(
            memory_file,
            as_attachment=True,
            download_name=f"locaa_ai_clips_{job_id}.zip",
            mimetype='application/zip'
        )


@app.route("/api/clips/<job_id>", methods=["GET"])
@jwt_required()
def get_clips_list(job_id):
    """Get list of all clips for a job with metadata"""
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    
    job = Job.query.filter_by(id=job_id, user_id=user.id).first()
    
    if not job:
        return jsonify({"error": "Job not found"}), 404
    
    base_dir = os.path.dirname(os.path.dirname(__file__))
    clips_dir = os.path.join(base_dir, "videos", "clips")
    
    if not os.path.exists(clips_dir):
        return jsonify({"clips": []}), 200
    
    clip_files = [f for f in os.listdir(clips_dir) if f.endswith('.mp4') and job.video_id in f]
    
    clips_info = []
    for idx, clip_file in enumerate(clip_files):
        clip_path = os.path.join(clips_dir, clip_file)
        file_size = os.path.getsize(clip_path)
        
        clips_info.append({
            "index": idx,
            "filename": clip_file,
            "size": file_size,
            "size_mb": round(file_size / (1024 * 1024), 2),
            "download_url": f"/api/download/clip/{job_id}/{idx}"
        })
    
    return jsonify({
        "job_id": job_id,
        "total_clips": len(clips_info),
        "clips": clips_info
    }), 200


# ==================== ANALYTICS & DASHBOARD ====================

@app.route("/api/dashboard", methods=["GET"])
@jwt_required()
def get_dashboard():
    """Get dashboard data for user"""
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    
    # Get stats for last 30 days
    last_30_days = datetime.utcnow() - timedelta(days=30)
    
    jobs_last_30 = Job.query.filter(
        Job.user_id == user.id,
        Job.created_at >= last_30_days
    ).all()
    
    completed_jobs = [j for j in jobs_last_30 if j.status == "completed"]
    failed_jobs = [j for j in jobs_last_30 if j.status == "failed"]
    
    total_clips = sum(j.clips_generated for j in jobs_last_30)
    total_published = sum(j.clips_published for j in jobs_last_30)
    
    return jsonify({
        "user": user.to_dict(),
        "subscription": {
            "tier": user.subscription_tier,
            "status": user.subscription_status,
            "plan_details": user.get_plan_info()
        },
        "stats": {
            "total_videos_processed": user.videos_processed,
            "total_clips_generated": user.clips_generated,
            "total_published": user.uploads_published,
            "last_30_days": {
                "videos_processed": len(jobs_last_30),
                "completed_jobs": len(completed_jobs),
                "failed_jobs": len(failed_jobs),
                "clips_generated": total_clips,
                "clips_published": total_published
            }
        },
        "recent_jobs": [j.to_dict() for j in sorted(jobs_last_30, key=lambda x: x.created_at, reverse=True)[:10]]
    }), 200


@app.route("/api/analytics", methods=["GET"])
@jwt_required()
def get_analytics():
    """Get detailed analytics for user"""
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    
    # Get all jobs
    all_jobs = Job.query.filter_by(user_id=user.id).all()
    
    # Calculate metrics
    total_duration = sum(j.duration or 0 for j in all_jobs)
    success_rate = len([j for j in all_jobs if j.status == "completed"]) / len(all_jobs) * 100 if all_jobs else 0
    
    return jsonify({
        "total_jobs": len(all_jobs),
        "completed": len([j for j in all_jobs if j.status == "completed"]),
        "failed": len([j for j in all_jobs if j.status == "failed"]),
        "processing": len([j for j in all_jobs if j.status not in ["completed", "failed"]]),
        "total_video_duration": total_duration,
        "total_clips": sum(j.clips_generated for j in all_jobs),
        "success_rate": round(success_rate, 2),
        "avg_clips_per_video": round(sum(j.clips_generated for j in all_jobs) / len(all_jobs), 2) if all_jobs else 0
    }), 200


# ==================== ERROR HANDLERS ====================

@app.errorhandler(401)
def unauthorized(error):
    return jsonify({"error": "Unauthorized access"}), 401


@app.errorhandler(403)
def forbidden(error):
    return jsonify({"error": "Access forbidden"}), 403


@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Resource not found"}), 404


@app.route("/api/delete-job/<job_id>", methods=["DELETE"])
@jwt_required()
def delete_job(job_id):
    """Delete a job (only failed or completed jobs)"""
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    
    job = Job.query.filter_by(id=job_id, user_id=user.id).first()
    
    if not job:
        return jsonify({"error": "Job not found"}), 404
    
    # Only allow deletion of failed or completed jobs
    if job.status not in ["failed", "completed", "cancelled"]:
        return jsonify({"error": f"Cannot delete {job.status} job. Only failed, cancelled or completed jobs can be deleted."}), 400
    
    try:
        # Delete associated video files if they exist
        base_dir = os.path.dirname(os.path.dirname(__file__))
        
        if job.processing_type == 'full_video':
            # Delete full video
            video_dir = os.path.join(base_dir, "videos", "full_videos")
            if os.path.exists(video_dir):
                for f in os.listdir(video_dir):
                    if f.endswith('.mp4') and job.video_id in f:
                        try:
                            os.remove(os.path.join(video_dir, f))
                            log(f"Deleted video file: {f}")
                        except Exception as e:
                            log(f"Error deleting video file {f}: {e}", level="warning")
        
        # Delete job from database
        db.session.delete(job)
        db.session.commit()
        
        log(f"Job {job_id} deleted by user {user.id}")
        
        return jsonify({
            "message": "Job deleted successfully",
            "job_id": job_id
        }), 200
    
    except Exception as e:
        db.session.rollback()
        log(f"Error deleting job {job_id}: {str(e)}", level="error")
        return jsonify({"error": str(e)}), 500


@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500


if __name__ == "__main__":
    app.run(debug=os.getenv('FLASK_DEBUG', False), host='0.0.0.0', port=5000)
