"""
Rate Limiter for Locaa AI API
"""
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify
from database.models import db, RateLimitTracker, User
from utils.auth import get_current_user
from utils.logger import log


# Default rate limits per user tier (requests per hour)
RATE_LIMITS = {
    'free': 100,
    'pro': 500,
    'business': 5000,
    'admin': 10000
}

# Endpoint-specific limits
ENDPOINT_LIMITS = {
    '/api/process-video': {'free': 5, 'pro': 30, 'business': 200},
    '/api/upload': {'free': 20, 'pro': 100, 'business': 500},
    '/api/publish': {'free': 10, 'pro': 50, 'business': 200},
    '/api/batch': {'free': 0, 'pro': 5, 'business': 50},
}


def get_client_ip():
    """Get client IP address"""
    if request.headers.get('X-Forwarded-For'):
        return request.headers.get('X-Forwarded-For').split(',')[0]
    return request.remote_addr


def check_rate_limit(user_id, endpoint, tier='free'):
    """Check if user has exceeded rate limit"""
    try:
        now = datetime.utcnow()
        one_hour_ago = now - timedelta(hours=1)
        
        # Get or create rate limit tracker
        tracker = RateLimitTracker.query.filter_by(
            user_id=user_id,
            endpoint=endpoint
        ).first()
        
        # Determine limit for this endpoint
        endpoint_limit = ENDPOINT_LIMITS.get(endpoint, {}).get(tier)
        if endpoint_limit is None:
            endpoint_limit = RATE_LIMITS.get(tier, 100)
        
        # Reset if hour has passed
        if tracker and tracker.last_reset < one_hour_ago:
            tracker.request_count = 0
            tracker.last_reset = now
        elif not tracker:
            tracker = RateLimitTracker(
                user_id=user_id,
                endpoint=endpoint,
                request_count=0,
                last_reset=now
            )
            db.session.add(tracker)
        
        # Check if limit exceeded
        if tracker.request_count >= endpoint_limit:
            return False, tracker.request_count, endpoint_limit
        
        # Increment counter
        tracker.request_count += 1
        db.session.commit()
        
        return True, tracker.request_count, endpoint_limit
    except Exception as e:
        log(f"Rate limit check failed: {str(e)}", level='error')
        # Allow request if check fails
        return True, 0, 0


def rate_limit(endpoint=None):
    """Decorator for rate limiting endpoints"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                user = get_current_user()
                if not user:
                    return jsonify({"error": "Unauthorized"}), 401
                
                # Determine endpoint
                limit_endpoint = endpoint or request.path.split('?')[0]
                
                # Check limit
                allowed, current, limit = check_rate_limit(
                    user.id,
                    limit_endpoint,
                    user.subscription_tier
                )
                
                if not allowed:
                    remaining_time = 60 - (datetime.utcnow().minute)
                    return jsonify({
                        "error": "Rate limit exceeded",
                        "limit": limit,
                        "current": current,
                        "reset_in_seconds": remaining_time * 60
                    }), 429
                
                # Add rate limit headers to response
                response = f(*args, **kwargs)
                if isinstance(response, tuple):
                    data, status = response
                    # Headers are lost in tuple response, need to handle differently
                    return data, status
                return response
                
            except Exception as e:
                log(f"Rate limiting error: {str(e)}", level='error')
                return f(*args, **kwargs)  # Allow request on error
        
        return decorated_function
    return decorator


def get_rate_limit_info(user_id, endpoint):
    """Get rate limit info for user"""
    try:
        user = User.query.get(user_id)
        if not user:
            return None
        
        tracker = RateLimitTracker.query.filter_by(
            user_id=user_id,
            endpoint=endpoint
        ).first()
        
        endpoint_limit = ENDPOINT_LIMITS.get(endpoint, {}).get(user.subscription_tier)
        if endpoint_limit is None:
            endpoint_limit = RATE_LIMITS.get(user.subscription_tier, 100)
        
        current_count = tracker.request_count if tracker else 0
        
        return {
            'endpoint': endpoint,
            'limit': endpoint_limit,
            'current': current_count,
            'remaining': max(0, endpoint_limit - current_count),
            'reset_at': tracker.last_reset + timedelta(hours=1) if tracker else None,
            'tier': user.subscription_tier
        }
    except Exception as e:
        log(f"Failed to get rate limit info: {str(e)}", level='error')
        return None


def reset_rate_limits(user_id=None, endpoint=None):
    """Reset rate limits for user or all users"""
    try:
        query = RateLimitTracker.query
        
        if user_id:
            query = query.filter_by(user_id=user_id)
        
        if endpoint:
            query = query.filter_by(endpoint=endpoint)
        
        query.delete()
        db.session.commit()
        
        return True
    except Exception as e:
        log(f"Failed to reset rate limits: {str(e)}", level='error')
        return False
