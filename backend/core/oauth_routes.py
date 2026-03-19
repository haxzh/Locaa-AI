"""
OAuth Routes for Locaa AI (Google Login)
"""
from flask import Blueprint, request, jsonify
from database.models import db, User
from utils.auth import create_user_tokens, generate_api_key
import requests
import json
import secrets
from utils.logger import log

oauth_bp = Blueprint('oauth', __name__, url_prefix='/api/oauth')

@oauth_bp.route('/google', methods=['POST'])
def google_auth():
    """
    Handle Google OAuth Login/Registration
    Expects a Google ID Token from the frontend.
    """
    data = request.get_json()
    token = data.get('credential')
    
    if not token:
        return jsonify({'error': 'Google ID token required'}), 400
        
    try:
        # Verify the token with Google
        # For production use google-auth registry, but a direct endpoint hit is sufficient for verify
        google_response = requests.get(f'https://oauth2.googleapis.com/tokeninfo?id_token={token}')
        if google_response.status_code != 200:
            return jsonify({'error': 'Invalid Google token'}), 401
            
        google_data = google_response.json()
        email = google_data.get('email')
        
        if not email:
            return jsonify({'error': 'Email not provided by Google'}), 400
            
        # Check if user exists
        user = User.query.filter_by(email=email).first()
        
        if not user:
            # Register new user
            # We derive a username since Google doesn't provide a continuous username string natively
            base_username = google_data.get('given_name', email.split('@')[0]).lower().replace(' ', '')
            username = f"{base_username}_{secrets.token_hex(3)}"
            
            user = User(
                email=email,
                username=username,
                first_name=google_data.get('given_name', ''),
                last_name=google_data.get('family_name', ''),
                avatar_url=google_data.get('picture', ''),
                api_key=generate_api_key(),
                is_email_verified=google_data.get('email_verified', True)
            )
            
            # Set a long random password for OAuth users
            user.set_password(secrets.token_urlsafe(32))
            user.subscription_tier = 'free'
            
            db.session.add(user)
            db.session.commit()
            
            message = 'User registered successfully via Google'
            status_code = 201
        else:
            # Update their picture or name maybe?
            if not user.avatar_url and google_data.get('picture'):
                user.avatar_url = google_data.get('picture')
                db.session.commit()
            
            if not user.is_active:
                return jsonify({'error': 'Account is disabled'}), 403
                
            # If Google login says verified, keep them verified.
            if not user.is_email_verified and google_data.get('email_verified'):
                user.is_email_verified = True
                db.session.commit()
                
            message = 'Login via Google successful'
            status_code = 200

        # Generate tokens
        tokens = create_user_tokens(user.id)
        
        return jsonify({
            'message': message,
            'user': user.to_dict(),
            'tokens': tokens
        }), status_code

    except Exception as e:
        log(f"Error authenticating with Google: {str(e)}", level='error')
        return jsonify({'error': 'Failed to authenticate with Google'}), 500
