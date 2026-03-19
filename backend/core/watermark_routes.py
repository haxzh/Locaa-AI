"""
Custom Watermark Routes for Locaa AI
"""
from flask import Blueprint, request, jsonify
import os
from datetime import datetime
from database.models import db, CustomWatermark
from utils.auth import get_current_user, user_required, subscription_required
from utils.logger import log

watermark_bp = Blueprint('watermarks', __name__, url_prefix='/api/watermarks')

UPLOAD_DIR = 'backend/uploads/watermarks'


def ensure_upload_dir():
    """Ensure upload directory exists"""
    os.makedirs(UPLOAD_DIR, exist_ok=True)


@watermark_bp.route('/upload', methods=['POST'])
@user_required
@subscription_required('pro')
def upload_watermark():
    """Upload custom watermark"""
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        # Validate file type
        allowed_extensions = {'png', 'jpg', 'jpeg', 'gif'}
        if not ('.' in file.filename and file.filename.rsplit('.', 1)[1].lower() in allowed_extensions):
            return jsonify({"error": "Only image files allowed (PNG, JPG, GIF)"}), 400
        
        user = get_current_user()
        ensure_upload_dir()
        
        # Save file
        filename = f"{user.id}_{int(datetime.utcnow().timestamp())}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        file.save(file_path)
        
        # Create watermark record
        watermark = CustomWatermark(
            user_id=user.id,
            name=request.form.get('name', 'Custom Watermark'),
            file_path=file_path,
            position=request.form.get('position', 'bottom-right'),
            opacity=float(request.form.get('opacity', 0.8)),
            scale=float(request.form.get('scale', 1.0)),
            is_default=request.form.get('is_default', 'false').lower() == 'true'
        )
        
        db.session.add(watermark)
        db.session.commit()
        
        log(f"Watermark uploaded by user {user.id}")
        
        return jsonify({
            'id': watermark.id,
            'name': watermark.name,
            'position': watermark.position,
            'opacity': watermark.opacity,
            'scale': watermark.scale,
            'is_default': watermark.is_default,
            'created_at': watermark.created_at.isoformat()
        }), 201
    except Exception as e:
        log(f"Error uploading watermark: {str(e)}", level='error')
        return jsonify({"error": str(e)}), 500


@watermark_bp.route('/list', methods=['GET'])
@user_required
def list_watermarks():
    """List all watermarks for user"""
    try:
        user = get_current_user()
        
        watermarks = CustomWatermark.query.filter_by(
            user_id=user.id,
            is_active=True
        ).all()
        
        return jsonify([{
            'id': w.id,
            'name': w.name,
            'position': w.position,
            'opacity': w.opacity,
            'scale': w.scale,
            'is_default': w.is_default,
            'created_at': w.created_at.isoformat()
        } for w in watermarks]), 200
    except Exception as e:
        log(f"Error listing watermarks: {str(e)}", level='error')
        return jsonify({"error": str(e)}), 500


@watermark_bp.route('/<int:watermark_id>', methods=['GET'])
@user_required
def get_watermark(watermark_id):
    """Get watermark details"""
    try:
        user = get_current_user()
        
        watermark = CustomWatermark.query.filter_by(
            id=watermark_id,
            user_id=user.id
        ).first()
        
        if not watermark:
            return jsonify({"error": "Watermark not found"}), 404
        
        return jsonify({
            'id': watermark.id,
            'name': watermark.name,
            'position': watermark.position,
            'opacity': watermark.opacity,
            'scale': watermark.scale,
            'is_default': watermark.is_default,
            'is_active': watermark.is_active,
            'created_at': watermark.created_at.isoformat()
        }), 200
    except Exception as e:
        log(f"Error fetching watermark: {str(e)}", level='error')
        return jsonify({"error": str(e)}), 500


@watermark_bp.route('/<int:watermark_id>/update', methods=['PUT'])
@user_required
def update_watermark(watermark_id):
    """Update watermark settings"""
    try:
        data = request.get_json()
        user = get_current_user()
        
        watermark = CustomWatermark.query.filter_by(
            id=watermark_id,
            user_id=user.id
        ).first()
        
        if not watermark:
            return jsonify({"error": "Watermark not found"}), 404
        
        # Update fields
        if 'name' in data:
            watermark.name = data['name']
        if 'position' in data:
            watermark.position = data['position']
        if 'opacity' in data:
            watermark.opacity = float(data['opacity'])
        if 'scale' in data:
            watermark.scale = float(data['scale'])
        if 'is_default' in data:
            watermark.is_default = data['is_default']
        
        watermark.updated_at = datetime.utcnow()
        db.session.commit()
        
        log(f"Watermark updated: {watermark_id}")
        
        return jsonify({
            'id': watermark.id,
            'name': watermark.name,
            'updated_at': watermark.updated_at.isoformat()
        }), 200
    except Exception as e:
        log(f"Error updating watermark: {str(e)}", level='error')
        return jsonify({"error": str(e)}), 500


@watermark_bp.route('/<int:watermark_id>/set-default', methods=['POST'])
@user_required
def set_default_watermark(watermark_id):
    """Set watermark as default"""
    try:
        user = get_current_user()
        
        # Remove default from other watermarks
        CustomWatermark.query.filter_by(
            user_id=user.id,
            is_default=True
        ).update({'is_default': False})
        
        # Set as default
        watermark = CustomWatermark.query.filter_by(
            id=watermark_id,
            user_id=user.id
        ).first()
        
        if not watermark:
            return jsonify({"error": "Watermark not found"}), 404
        
        watermark.is_default = True
        db.session.commit()
        
        log(f"Default watermark set: {watermark_id}")
        
        return jsonify({
            'id': watermark.id,
            'is_default': True
        }), 200
    except Exception as e:
        log(f"Error setting default watermark: {str(e)}", level='error')
        return jsonify({"error": str(e)}), 500


@watermark_bp.route('/<int:watermark_id>/delete', methods=['DELETE'])
@user_required
def delete_watermark(watermark_id):
    """Delete watermark"""
    try:
        user = get_current_user()
        
        watermark = CustomWatermark.query.filter_by(
            id=watermark_id,
            user_id=user.id
        ).first()
        
        if not watermark:
            return jsonify({"error": "Watermark not found"}), 404
        
        # Delete file if exists
        if os.path.exists(watermark.file_path):
            os.remove(watermark.file_path)
        
        db.session.delete(watermark)
        db.session.commit()
        
        log(f"Watermark deleted: {watermark_id}")
        
        return jsonify({
            'success': True,
            'message': 'Watermark deleted'
        }), 200
    except Exception as e:
        log(f"Error deleting watermark: {str(e)}", level='error')
        return jsonify({"error": str(e)}), 500


@watermark_bp.route('/default', methods=['GET'])
@user_required
def get_default_watermark():
    """Get user's default watermark"""
    try:
        user = get_current_user()
        
        watermark = CustomWatermark.query.filter_by(
            user_id=user.id,
            is_default=True,
            is_active=True
        ).first()
        
        if not watermark:
            return jsonify({"watermark": None}), 200
        
        return jsonify({
            'id': watermark.id,
            'name': watermark.name,
            'position': watermark.position,
            'opacity': watermark.opacity,
            'scale': watermark.scale,
            'file_path': watermark.file_path
        }), 200
    except Exception as e:
        log(f"Error fetching default watermark: {str(e)}", level='error')
        return jsonify({"error": str(e)}), 500
