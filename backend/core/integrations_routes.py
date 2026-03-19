"""Integration connection routes (YouTube, Instagram, TikTok, etc.)"""
from datetime import datetime

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from database.models import db, UserIntegration
from utils.auth import get_current_user

integrations_bp = Blueprint('integrations', __name__, url_prefix='/api/integrations')

SUPPORTED_PROVIDERS = {
    'youtube': {
        'label': 'YouTube API',
        'required_fields': ['client_id', 'client_secret'],
    },
    'instagram': {
        'label': 'Instagram',
        'required_fields': ['app_id', 'app_secret', 'access_token'],
    },
    'tiktok': {
        'label': 'TikTok',
        'required_fields': ['client_key', 'client_secret', 'access_token'],
    },
    'google_drive': {
        'label': 'Google Drive',
        'required_fields': ['client_id', 'client_secret'],
    },
    'dropbox': {
        'label': 'Dropbox',
        'required_fields': ['access_token'],
    },
    'vimeo': {
        'label': 'Vimeo',
        'required_fields': ['api_key'],
    },
    'slack': {
        'label': 'Slack',
        'required_fields': ['bot_token'],
    },
    'aws_s3': {
        'label': 'AWS S3',
        'required_fields': ['access_key_id', 'secret_access_key', 'bucket_name', 'region'],
    },
}


def _is_connected(provider, config):
    provider_meta = SUPPORTED_PROVIDERS.get(provider)
    if not provider_meta:
        return False

    required_fields = provider_meta.get('required_fields', [])
    for field in required_fields:
        value = config.get(field)
        if value is None:
            return False
        if isinstance(value, str) and not value.strip():
            return False
    return True


@integrations_bp.route('', methods=['GET'])
@jwt_required()
def list_integrations():
    """Get all provider statuses for current user."""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    rows = UserIntegration.query.filter_by(user_id=user.id).all()
    by_provider = {row.provider: row for row in rows}

    payload = []
    for provider, meta in SUPPORTED_PROVIDERS.items():
        row = by_provider.get(provider)
        if row:
            entry = row.to_dict()
        else:
            entry = {
                'provider': provider,
                'is_connected': False,
                'config_masked': {},
                'config_editable': {},
                'last_connected_at': None,
                'updated_at': None,
            }

        entry['label'] = meta['label']
        entry['required_fields'] = meta['required_fields']
        payload.append(entry)

    return jsonify(payload), 200


@integrations_bp.route('/<provider>', methods=['PUT'])
@jwt_required()
def save_integration(provider):
    """Save/update integration credentials for provider."""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    if provider not in SUPPORTED_PROVIDERS:
        return jsonify({'error': f'Unsupported provider: {provider}'}), 400

    data = request.get_json(silent=True) or {}
    incoming_config = data.get('config') or {}
    if not isinstance(incoming_config, dict):
        return jsonify({'error': 'config must be an object'}), 400

    row = UserIntegration.query.filter_by(user_id=user.id, provider=provider).first()
    if not row:
        row = UserIntegration(user_id=user.id, provider=provider)
        db.session.add(row)

    # Merge config and preserve existing secrets if user leaves fields blank.
    merged = row.get_config()
    for key, value in incoming_config.items():
        if value is None:
            continue
        if isinstance(value, str):
            stripped = value.strip()
            if not stripped:
                continue
            merged[key] = stripped
        else:
            merged[key] = value

    row.set_config(merged)
    row.is_connected = _is_connected(provider, merged)
    if row.is_connected:
        row.last_connected_at = datetime.utcnow()

    db.session.commit()

    return jsonify({
        'message': f"{SUPPORTED_PROVIDERS[provider]['label']} settings saved",
        'integration': row.to_dict(),
    }), 200


@integrations_bp.route('/<provider>/disconnect', methods=['POST'])
@jwt_required()
def disconnect_integration(provider):
    """Disconnect provider for current user."""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    row = UserIntegration.query.filter_by(user_id=user.id, provider=provider).first()
    if not row:
        return jsonify({'message': 'Already disconnected'}), 200

    row.set_config({})
    row.is_connected = False
    row.last_connected_at = None
    db.session.commit()

    return jsonify({'message': f'{provider} disconnected'}), 200
