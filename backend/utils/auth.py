"""
Authentication utilities for Locaa AI
"""
from flask_jwt_extended import create_access_token, create_refresh_token, get_jwt_identity, verify_jwt_in_request
from functools import wraps
from flask import jsonify, g, request
from datetime import timedelta
import uuid
import time

from datetime import datetime
from database.models import db, User, Job, APIUsage


def create_user_tokens(user_id):
    """Create access and refresh tokens for user"""
    additional_claims = {
        'user_id': user_id,
        'type': 'access'
    }
    
    access_token = create_access_token(
        identity=str(user_id),
        additional_claims=additional_claims,
        expires_delta=timedelta(hours=24)
    )
    
    refresh_token = create_refresh_token(
        identity=str(user_id),
        expires_delta=timedelta(days=30)
    )
    
    return {
        'access_token': access_token,
        'refresh_token': refresh_token,
        'token_type': 'Bearer'
    }


def generate_api_key():
    """Generate a unique API key"""
    return f"locaa_{uuid.uuid4().hex[:24]}"


def get_current_user():
    """Get current authenticated user"""
    try:
        user_id = get_jwt_identity()
        if user_id is None:
            return None
        user_id = int(user_id)
        user = User.query.get(user_id)
        if not user or not user.is_active:
            return None
        return user
    except:
        return None


def user_required(f):
    """Decorator to require user authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            verify_jwt_in_request()
        except Exception as e:
            return jsonify({'error': 'Unauthorized', 'detail': str(e)}), 401

        user = get_current_user()
        if not user:
            return jsonify({'error': 'Unauthorized'}), 401

        g.current_user = user
        return f(*args, **kwargs)
    return decorated_function


def check_subscription_limit(user, resource_type='videos'):
    """Check if user has exceeded subscription limits"""
    plan = user.get_plan_info()
    
    if resource_type == 'videos':
        # Check monthly video limit
        this_month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        videos_this_month = Job.query.filter(
            Job.user_id == user.id,
            Job.created_at >= this_month_start
        ).count()
        
        if videos_this_month >= plan['videos_per_month']:
            return False, 'Monthly video limit reached'
    
    return True, 'OK'


def subscription_required(tier='pro'):
    """Decorator to check subscription tier"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                verify_jwt_in_request()
            except Exception as e:
                return jsonify({'error': 'Unauthorized', 'detail': str(e)}), 401

            user = get_current_user()
            if not user:
                return jsonify({'error': 'Unauthorized'}), 401
            
            tiers = {'free': 0, 'pro': 1, 'business': 2}
            if tiers.get(user.subscription_tier, -1) < tiers.get(tier, 0):
                return jsonify({
                    'error': f'This feature requires {tier} subscription',
                    'required_tier': tier,
                    'current_tier': user.subscription_tier
                }), 403
            
            g.current_user = user
            return f(*args, **kwargs)
        return decorated_function
    return decorator


# ==================== API KEY AUTHENTICATION ====================

def get_user_from_api_key():
    """Resolve user from X-API-Key header. Returns (user, error_response_tuple)."""
    api_key = request.headers.get('X-API-Key') or request.args.get('api_key')
    if not api_key:
        return None, (jsonify({'error': 'API key required. Pass X-API-Key header.'}), 401)

    user = User.query.filter_by(api_key=api_key, is_active=True).first()
    if not user:
        return None, (jsonify({'error': 'Invalid or revoked API key.'}), 401)

    # Check plan allows API access
    plan_api_access = {
        'free': False,
        'pro': True,
        'business': True,
    }
    if not plan_api_access.get(user.subscription_tier, False):
        return None, (jsonify({
            'error': 'API access requires Pro or Business plan.',
            'current_tier': user.subscription_tier,
            'upgrade_url': '/pricing'
        }), 403)

    return user, None


def api_key_required(f):
    """Decorator: authenticates via X-API-Key header only."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user, err = get_user_from_api_key()
        if err:
            return err
        g.current_user = user
        g.auth_method = 'api_key'
        return f(*args, **kwargs)
    return decorated_function


def api_or_jwt_required(f):
    """Decorator: accepts both JWT Bearer token and X-API-Key header."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Try API key first
        api_key = request.headers.get('X-API-Key') or request.args.get('api_key')
        if api_key:
            user, err = get_user_from_api_key()
            if err:
                return err
            g.current_user = user
            g.auth_method = 'api_key'
            return f(*args, **kwargs)

        # Fall back to JWT
        try:
            verify_jwt_in_request()
        except Exception as e:
            return jsonify({'error': 'Unauthorized. Provide a Bearer token or X-API-Key header.', 'detail': str(e)}), 401

        user = get_current_user()
        if not user:
            return jsonify({'error': 'Unauthorized'}), 401
        g.current_user = user
        g.auth_method = 'jwt'
        return f(*args, **kwargs)
    return decorated_function


def track_api_usage(user_id: int, endpoint: str, method: str, status_code: int, response_time_ms: float):
    """Write an APIUsage record (best-effort, never raises)."""
    try:
        record = APIUsage(
            user_id=user_id,
            endpoint=endpoint,
            method=method,
            status_code=status_code,
            response_time=response_time_ms,
        )
        db.session.add(record)
        db.session.commit()
    except Exception:
        db.session.rollback()
