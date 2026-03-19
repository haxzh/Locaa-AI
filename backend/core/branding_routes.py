"""Branding configuration routes."""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from database.models import db, UserBrandingConfig
from utils.auth import get_current_user

branding_bp = Blueprint('branding', __name__, url_prefix='/api/branding-config')

ALLOWED_PROJECT_TYPES = {'clips', 'full_video'}

DEFAULT_CONFIG = {
    'aspect_ratio': '16:9',
    'summary_length': 'Short/Detailed',
    'text_overlay_font': 'Font',
    'text_style_primary': 'Modern/Classic',
    'text_style_secondary': 'Modern/Classic/Glow',
    'transition_style': 'Fade/Zoom/Slide',
    'logo_placement': 'Top-Left',
    'logo_opacity': 70,
    'ai_clip_sensitivity': 80,
    'noise_reduction': True,
    'logo_path': '',
    'brand_label': 'Locaa AI',
}

PROJECT_PRESETS = {
    'Podcast': {
        'summary_length': 'Long',
        'text_style_primary': 'Modern/Classic',
        'text_style_secondary': 'Minimal/Simple',
        'transition_style': 'Cut/Fade',
        'logo_placement': 'Bottom-Right',
        'logo_opacity': 58,
        'ai_clip_sensitivity': 55,
        'noise_reduction': True,
        'brand_label': 'Podcast Highlight',
    },
    'Vlog': {
        'summary_length': 'Short/Detailed',
        'text_style_primary': 'Bold/Shadowed',
        'text_style_secondary': 'Modern/Classic/Glow',
        'transition_style': 'Fade/Zoom/Slide',
        'logo_placement': 'Top-Left',
        'logo_opacity': 72,
        'ai_clip_sensitivity': 86,
        'noise_reduction': False,
        'brand_label': 'Vlog Moment',
    },
    'Course': {
        'summary_length': 'Detailed',
        'text_style_primary': 'Modern/Classic',
        'text_style_secondary': 'Minimal/Clean',
        'transition_style': 'Cut/Fade',
        'logo_placement': 'Top-Right',
        'logo_opacity': 65,
        'ai_clip_sensitivity': 68,
        'noise_reduction': True,
        'brand_label': 'Course Clip',
    },
}


@branding_bp.route('', methods=['GET'])
@jwt_required()
def get_branding_config():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    project_type = request.args.get('project_type', 'clips')
    if project_type not in ALLOWED_PROJECT_TYPES:
        return jsonify({'error': 'Invalid project_type'}), 400

    row = UserBrandingConfig.query.filter_by(user_id=user.id, project_type=project_type).first()
    if not row:
        return jsonify({'project_type': project_type, 'config': DEFAULT_CONFIG, 'updated_at': None}), 200

    merged = {**DEFAULT_CONFIG, **row.get_config()}
    return jsonify({'project_type': project_type, 'config': merged, 'updated_at': row.updated_at.isoformat() if row.updated_at else None}), 200


@branding_bp.route('/presets', methods=['GET'])
@jwt_required()
def get_branding_presets():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    project_type = request.args.get('project_type', 'clips')
    if project_type not in ALLOWED_PROJECT_TYPES:
        return jsonify({'error': 'Invalid project_type'}), 400

    presets = []
    for name, patch in PROJECT_PRESETS.items():
        config = {**DEFAULT_CONFIG, **patch}
        if project_type == 'full_video':
            config['ai_clip_sensitivity'] = 0
            config['transition_style'] = 'Cut/Fade'
        presets.append({'name': name, 'project_type': project_type, 'config': config})

    return jsonify(presets), 200


@branding_bp.route('', methods=['PUT'])
@jwt_required()
def save_branding_config():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json(silent=True) or {}
    project_type = data.get('project_type', 'clips')
    config = data.get('config') or {}

    if project_type not in ALLOWED_PROJECT_TYPES:
        return jsonify({'error': 'Invalid project_type'}), 400

    if not isinstance(config, dict):
        return jsonify({'error': 'config must be an object'}), 400

    row = UserBrandingConfig.query.filter_by(user_id=user.id, project_type=project_type).first()
    if not row:
        row = UserBrandingConfig(user_id=user.id, project_type=project_type)
        db.session.add(row)

    safe = {**DEFAULT_CONFIG, **config}

    # Basic normalization
    try:
        safe['logo_opacity'] = max(0, min(100, int(safe.get('logo_opacity', 70))))
    except Exception:
        safe['logo_opacity'] = 70

    try:
        safe['ai_clip_sensitivity'] = max(0, min(100, int(safe.get('ai_clip_sensitivity', 80))))
    except Exception:
        safe['ai_clip_sensitivity'] = 80

    safe['noise_reduction'] = bool(safe.get('noise_reduction', True))

    row.set_config(safe)
    db.session.commit()

    return jsonify({'message': 'Branding settings saved', 'project_type': project_type, 'config': safe}), 200


@branding_bp.route('/apply-preset', methods=['POST'])
@jwt_required()
def apply_branding_preset():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json(silent=True) or {}
    project_type = data.get('project_type', 'clips')
    preset_name = data.get('preset_name')

    if project_type not in ALLOWED_PROJECT_TYPES:
        return jsonify({'error': 'Invalid project_type'}), 400

    if preset_name not in PROJECT_PRESETS:
        return jsonify({'error': 'Invalid preset_name'}), 400

    row = UserBrandingConfig.query.filter_by(user_id=user.id, project_type=project_type).first()
    if not row:
        row = UserBrandingConfig(user_id=user.id, project_type=project_type)
        db.session.add(row)

    config = {**DEFAULT_CONFIG, **PROJECT_PRESETS[preset_name]}
    if project_type == 'full_video':
        config['ai_clip_sensitivity'] = 0
        config['transition_style'] = 'Cut/Fade'

    row.set_config(config)
    db.session.commit()

    return jsonify({
        'message': f'{preset_name} preset applied',
        'project_type': project_type,
        'preset_name': preset_name,
        'config': config,
    }), 200
