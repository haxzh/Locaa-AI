"""
Authentication routes for Locaa AI
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database.models import db, User, OTPVerification, APIUsage
from utils.auth import create_user_tokens, generate_api_key, get_current_user
from core.email_handler import send_otp_email
from datetime import datetime, timedelta
import secrets
import random

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    data = request.get_json()
    
    # Validation
    if not data.get('email') or not data.get('password') or not data.get('username'):
        return jsonify({'error': 'Email, username, and password are required'}), 400
    
    # Check if user already exists
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 409
    
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already taken'}), 409
    
    # Create new user
    user = User(
        email=data['email'],
        username=data['username'],
        first_name=data.get('first_name'),
        last_name=data.get('last_name'),
        api_key=generate_api_key()
    )
    
    user.set_password(data['password'])
    user.subscription_tier = 'free'  # Default to free plan
    
    db.session.add(user)
    db.session.commit()
    
    # Generate tokens
    tokens = create_user_tokens(user.id)
    
    return jsonify({
        'message': 'User registered successfully',
        'user': user.to_dict(),
        'tokens': tokens
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user with email and password"""
    data = request.get_json()
    
    if not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password are required'}), 400
    
    user = User.query.filter_by(email=data['email']).first()
    
    if not user or not user.verify_password(data['password']):
        return jsonify({'error': 'Invalid email or password'}), 401
    
    if not user.is_active:
        return jsonify({'error': 'Account is disabled'}), 403
    
    tokens = create_user_tokens(user.id)
    
    return jsonify({
        'message': 'Login successful',
        'user': user.to_dict(),
        'tokens': tokens
    }), 200


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token using refresh token"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    tokens = create_user_tokens(user.id)
    return jsonify(tokens), 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_profile():
    """Get current user profile"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    return jsonify(user.to_dict()), 200


@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update user profile"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json(silent=True) or {}

    username = data.get('username')
    if username is not None:
        username = str(username).strip()
        if len(username) < 3:
            return jsonify({'error': 'Username must be at least 3 characters'}), 400

        existing_username = User.query.filter(
            User.username == username,
            User.id != user.id
        ).first()
        if existing_username:
            return jsonify({'error': 'Username already taken'}), 409

        user.username = username

    email = data.get('email')
    if email is not None:
        email = str(email).strip().lower()
        if '@' not in email or '.' not in email.split('@')[-1]:
            return jsonify({'error': 'Please enter a valid email'}), 400

        existing_email = User.query.filter(
            User.email == email,
            User.id != user.id
        ).first()
        if existing_email:
            return jsonify({'error': 'Email already registered'}), 409

        user.email = email
    
    # Update allowed fields
    allowed_fields = ['first_name', 'last_name', 'avatar_url', 'youtube_channel_id', 'instagram_username']
    
    for field in allowed_fields:
        if field in data:
            value = data[field]
            if isinstance(value, str):
                value = value.strip()
            setattr(user, field, value)

    # Accept full_name from UI and split into first/last name.
    if 'full_name' in data:
        full_name = str(data.get('full_name') or '').strip()
        if full_name:
            parts = full_name.split()
            user.first_name = parts[0]
            user.last_name = ' '.join(parts[1:]) if len(parts) > 1 else ''
        else:
            user.first_name = ''
            user.last_name = ''
    
    db.session.commit()
    
    return jsonify({
        'message': 'Profile updated successfully',
        'user': user.to_dict()
    }), 200


@auth_bp.route('/api-key', methods=['GET'])
@jwt_required()
def get_api_key():
    """Get user's API key"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    plan_api_access = {'free': False, 'pro': True, 'business': True}
    has_access = plan_api_access.get(user.subscription_tier, False)

    return jsonify({
        'api_key': user.api_key if has_access else None,
        'has_access': has_access,
        'plan': user.subscription_tier,
        'message': None if has_access else 'Upgrade to Pro or Business to unlock API access.'
    }), 200


@auth_bp.route('/api-key/regenerate', methods=['POST'])
@jwt_required()
def regenerate_api_key():
    """Generate new API key (Pro/Business only)"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    plan_api_access = {'free': False, 'pro': True, 'business': True}
    if not plan_api_access.get(user.subscription_tier, False):
        return jsonify({
            'error': 'API access requires Pro or Business plan.',
            'upgrade_url': '/pricing'
        }), 403

    new_api_key = generate_api_key()
    user.api_key = new_api_key
    db.session.commit()

    return jsonify({
        'message': 'API key regenerated successfully',
        'api_key': new_api_key
    }), 200


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user"""
    # In JWT-based auth, logout is handled on client side
    # This endpoint could be used to blacklist tokens if needed
    return jsonify({'message': 'Logout successful'}), 200


@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Change user password"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json()
    
    if not data.get('old_password') or not data.get('new_password'):
        return jsonify({'error': 'Old and new passwords are required'}), 400
    
    if not user.verify_password(data['old_password']):
        return jsonify({'error': 'Incorrect old password'}), 401
    
    user.set_password(data['new_password'])
    db.session.commit()
    
    return jsonify({'message': 'Password changed successfully'}), 200


@auth_bp.route('/subscription', methods=['GET'])
@jwt_required()
def get_subscription():
    """Get user subscription details"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    return jsonify({
        'subscription_tier': user.subscription_tier,
        'subscription_status': user.subscription_status,
        'subscription_start_date': user.subscription_start_date.isoformat(),
        'subscription_end_date': user.subscription_end_date.isoformat() if user.subscription_end_date else None,
        'plan_details': user.get_plan_info(),
        'usage': {
            'videos_processed': user.videos_processed,
            'clips_generated': user.clips_generated,
            'uploads_published': user.uploads_published
        }
    }), 200

# ==================== OTP AUTH ROUTES ====================

@auth_bp.route('/register-otp', methods=['POST'])
def register_otp():
    """Complete registration using a verified email/OTP without forcing a password immediately."""
    data = request.get_json()
    
    if not data.get('email') or not data.get('username'):
        return jsonify({'error': 'Email and username are required'}), 400
    
    # Check if user already exists
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 409
    
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already taken'}), 409
        
    # Create new user
    user = User(
        email=data['email'],
        username=data['username'],
        first_name=data.get('first_name', ''),
        last_name=data.get('last_name', ''),
        api_key=generate_api_key(),
        is_email_verified=True # Assuming they just verified OTP on frontend before hitting this
    )
    
    # Set a dummy secure password since they used OTP
    user.set_password(secrets.token_urlsafe(16))
    user.subscription_tier = 'free'
    
    db.session.add(user)
    db.session.commit()
    
    # Generate tokens
    tokens = create_user_tokens(user.id)
    
    return jsonify({
        'message': 'User registered successfully via OTP',
        'user': user.to_dict(),
        'tokens': tokens
    }), 201

@auth_bp.route('/login-otp', methods=['POST'])
def login_otp():
    """Login user via verified OTP without password"""
    data = request.get_json()
    
    if not data.get('email'):
        return jsonify({'error': 'Email is required'}), 400
    
    # Assuming the frontend JUST hit /api/verify-otp successfully, 
    # we trust this route to issue the JWT for the email.
    user = User.query.filter_by(email=data['email']).first()
    
    if not user:
        return jsonify({'error': 'No account found for this email. Please sign up.'}), 404
    
    if not user.is_active:
        return jsonify({'error': 'Account is disabled'}), 403
        
    # Mark verified if they weren't somehow
    if not user.is_email_verified:
        user.is_email_verified = True
        db.session.commit()
    
    tokens = create_user_tokens(user.id)
    
    return jsonify({
        'message': 'Login via OTP successful',
        'user': user.to_dict(),
        'tokens': tokens
    }), 200


# ==================== COMPREHENSIVE OTP SYSTEM ====================

@auth_bp.route('/send-otp', methods=['POST'])
def send_otp():
    """Generate and send OTP to email"""
    data = request.get_json()
    email = data.get('email')
    otp_type = data.get('type', 'login')  # login, signup, password_reset
    
    if not email:
        return jsonify({'error': 'Email is required'}), 400
    
    # For signup, check if user exists
    if otp_type == 'signup':
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already registered'}), 409
    
    # For login/password_reset, check if user exists
    if otp_type in ['login', 'password_reset']:
        if not User.query.filter_by(email=email).first():
            return jsonify({'error': 'No account found with this email'}), 404
    
    # Generate 6-digit OTP
    otp_code = f"{random.randint(100000, 999999)}"
    
    # Delete old OTPs for this email/type
    OTPVerification.query.filter_by(email=email, otp_type=otp_type, is_verified=False).delete()
    
    # Create new OTP
    otp_record = OTPVerification(
        email=email,
        otp_code=otp_code,
        otp_type=otp_type,
        expires_at=datetime.utcnow() + timedelta(minutes=10)
    )
    
    db.session.add(otp_record)
    db.session.commit()
    
    # Send email
    if send_otp_email(email, otp_code):
        return jsonify({
            'message': 'OTP sent successfully to your email',
            'expires_in': 600  # 10 minutes in seconds
        }), 200
    else:
        return jsonify({'error': 'Failed to send OTP email'}), 500


@auth_bp.route('/verify-otp', methods=['POST'])
def verify_otp():
    """Verify OTP code"""
    data = request.get_json()
    email = data.get('email')
    otp_code = data.get('otp_code')
    otp_type = data.get('type', 'login')
    
    if not email or not otp_code:
        return jsonify({'error': 'Email and OTP code are required'}), 400
    
    # Find OTP record
    otp_record = OTPVerification.query.filter_by(
        email=email,
        otp_type=otp_type,
        is_verified=False
    ).order_by(OTPVerification.created_at.desc()).first()
    
    if not otp_record:
        return jsonify({'error': 'Invalid or expired OTP'}), 400
    
    # Check expiration
    if otp_record.expires_at < datetime.utcnow():
        return jsonify({'error': 'OTP has expired. Please request a new one'}), 400
    
    # Check attempts
    if otp_record.attempts >= 5:
        return jsonify({'error': 'Too many failed attempts. Please request a new OTP'}), 429
    
    # Verify OTP
    if otp_record.otp_code != otp_code:
        otp_record.attempts += 1
        db.session.commit()
        return jsonify({'error': f'Invalid OTP. {5 - otp_record.attempts} attempts remaining'}), 400
    
    # Mark as verified
    otp_record.is_verified = True
    otp_record.verified_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({
        'message': 'OTP verified successfully',
        'verified': True
    }), 200


@auth_bp.route('/forgot-password-otp', methods=['POST'])
def forgot_password_otp():
    """Request OTP for password reset"""
    data = request.get_json()
    email = data.get('email')
    
    if not email:
        return jsonify({'error': 'Email is required'}), 400
    
    user = User.query.filter_by(email=email).first()
    if not user:
        # Don't reveal if email exists for security
        return jsonify({
            'message': 'If an account exists with this email, an OTP has been sent'
        }), 200
    
    # Generate OTP
    otp_code = f"{random.randint(100000, 999999)}"
    
    # Delete old password reset OTPs
    OTPVerification.query.filter_by(
        email=email,
        otp_type='password_reset',
        is_verified=False
    ).delete()
    
    # Create new OTP
    otp_record = OTPVerification(
        email=email,
        otp_code=otp_code,
        otp_type='password_reset',
        expires_at=datetime.utcnow() + timedelta(minutes=10)
    )
    
    db.session.add(otp_record)
    db.session.commit()
    
    # Send OTP email
    send_otp_email(email, otp_code)
    
    return jsonify({
        'message': 'If an account exists with this email, an OTP has been sent',
        'expires_in': 600
    }), 200


@auth_bp.route('/reset-password-otp', methods=['POST'])
def reset_password_with_otp():
    """Reset password using verified OTP"""
    data = request.get_json()
    email = data.get('email')
    otp_code = data.get('otp_code')
    new_password = data.get('new_password')
    
    if not all([email, otp_code, new_password]):
        return jsonify({'error': 'Email, OTP code, and new password are required'}), 400
    
    # Verify OTP first
    otp_record = OTPVerification.query.filter_by(
        email=email,
        otp_code=otp_code,
        otp_type='password_reset',
        is_verified=False
    ).order_by(OTPVerification.created_at.desc()).first()
    
    if not otp_record:
        return jsonify({'error': 'Invalid or already used OTP'}), 400
    
    if otp_record.expires_at < datetime.utcnow():
        return jsonify({'error': 'OTP has expired'}), 400
    
    # Mark OTP as verified
    otp_record.is_verified = True
    otp_record.verified_at = datetime.utcnow()
    
    # Update password
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    user.set_password(new_password)
    db.session.commit()

    return jsonify({
        'message': 'Password has been reset successfully'
    }), 200


# ==================== API USAGE STATS ====================

@auth_bp.route('/api-usage', methods=['GET'])
@jwt_required()
def get_api_usage():
    """Get API usage statistics for the authenticated user"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    # Last 30 days total
    since = datetime.utcnow() - timedelta(days=30)
    records_30d = APIUsage.query.filter(
        APIUsage.user_id == user.id,
        APIUsage.created_at >= since
    ).all()

    total_requests = len(records_30d)
    successful = sum(1 for r in records_30d if r.status_code and r.status_code < 400)
    failed = total_requests - successful
    avg_response_ms = round(
        sum(r.response_time for r in records_30d if r.response_time) / max(total_requests, 1), 1
    )

    # Per-endpoint breakdown
    endpoint_counts = {}
    for r in records_30d:
        ep = r.endpoint or 'unknown'
        endpoint_counts[ep] = endpoint_counts.get(ep, 0) + 1
    top_endpoints = sorted(endpoint_counts.items(), key=lambda x: x[1], reverse=True)[:5]

    # Daily usage
    daily = {}
    for r in records_30d:
        day = r.created_at.strftime('%Y-%m-%d')
        daily[day] = daily.get(day, 0) + 1

    return jsonify({
        'period': '30d',
        'total_requests': total_requests,
        'successful_requests': successful,
        'failed_requests': failed,
        'avg_response_ms': avg_response_ms,
        'top_endpoints': [{'endpoint': ep, 'count': cnt} for ep, cnt in top_endpoints],
        'daily_usage': [{'date': d, 'count': c} for d, c in sorted(daily.items())]
    }), 200