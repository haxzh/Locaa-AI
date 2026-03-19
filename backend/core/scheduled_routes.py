"""
Scheduled Publishing Routes for Locaa AI
"""
from flask import Blueprint, request, jsonify
from datetime import datetime
from database.models import db, ScheduledPublish, Job
from utils.auth import get_current_user, user_required, subscription_required
from core.rate_limiter import rate_limit
from utils.logger import log

scheduled_bp = Blueprint('scheduled', __name__, url_prefix='/api/scheduled')


@scheduled_bp.route('/create', methods=['POST'])
@user_required
@subscription_required('pro')
@rate_limit('/api/scheduled/create')
def create_scheduled_publish():
    """Create scheduled publish for a clip"""
    try:
        data = request.get_json()
        user = get_current_user()
        
        job_id = data.get('job_id')
        clip_id = data.get('clip_id')
        scheduled_time = data.get('scheduled_time')
        platforms = data.get('platforms', 'youtube')  # youtube, instagram, tiktok
        title = data.get('title', '')
        description = data.get('description', '')
        tags = data.get('tags', '')
        
        if not job_id or not clip_id or not scheduled_time:
            return jsonify({"error": "Missing required fields"}), 400
        
        # Verify job belongs to user
        job = Job.query.filter_by(id=job_id, user_id=user.id).first()
        if not job:
            return jsonify({"error": "Job not found"}), 404
        
        # Parse scheduled time
        try:
            scheduled_datetime = datetime.fromisoformat(scheduled_time)
        except:
            return jsonify({"error": "Invalid datetime format"}), 400
        
        if scheduled_datetime < datetime.utcnow():
            return jsonify({"error": "Scheduled time must be in future"}), 400
        
        # Create scheduled publish
        scheduled = ScheduledPublish(
            user_id=user.id,
            job_id=job_id,
            clip_id=clip_id,
            platforms=platforms,
            title=title,
            description=description,
            tags=tags,
            scheduled_time=scheduled_datetime
        )
        
        db.session.add(scheduled)
        db.session.commit()
        
        log(f"Scheduled publish created for user {user.id}: {clip_id}")
        
        return jsonify({
            'id': scheduled.id,
            'status': 'scheduled',
            'scheduled_time': scheduled.scheduled_time.isoformat(),
            'platforms': platforms,
            'clip_id': clip_id
        }), 201
    except Exception as e:
        log(f"Error creating scheduled publish: {str(e)}", level='error')
        return jsonify({"error": str(e)}), 500


@scheduled_bp.route('/list', methods=['GET'])
@user_required
def list_scheduled_publishes():
    """List all scheduled publishes for user"""
    try:
        user = get_current_user()
        
        status = request.args.get('status')  # pending, published, failed
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 20, type=int)
        
        query = ScheduledPublish.query.filter_by(user_id=user.id).order_by(
            ScheduledPublish.scheduled_time.asc()
        )
        
        if status:
            query = query.filter_by(status=status)
        
        publishes = query.paginate(page=page, per_page=limit)
        
        return jsonify({
            'total': publishes.total,
            'pages': publishes.pages,
            'current_page': page,
            'scheduled_publishes': [{
                'id': p.id,
                'job_id': p.job_id,
                'clip_id': p.clip_id,
                'platforms': p.platforms,
                'title': p.title,
                'status': p.status,
                'scheduled_time': p.scheduled_time.isoformat(),
                'published_at': p.published_at.isoformat() if p.published_at else None,
                'created_at': p.created_at.isoformat()
            } for p in publishes.items]
        }), 200
    except Exception as e:
        log(f"Error listing scheduled publishes: {str(e)}", level='error')
        return jsonify({"error": str(e)}), 500


@scheduled_bp.route('/<int:publish_id>', methods=['GET'])
@user_required
def get_scheduled_publish(publish_id):
    """Get scheduled publish details"""
    try:
        user = get_current_user()
        
        scheduled = ScheduledPublish.query.filter_by(
            id=publish_id,
            user_id=user.id
        ).first()
        
        if not scheduled:
            return jsonify({"error": "Scheduled publish not found"}), 404
        
        return jsonify({
            'id': scheduled.id,
            'job_id': scheduled.job_id,
            'clip_id': scheduled.clip_id,
            'platforms': scheduled.platforms,
            'title': scheduled.title,
            'description': scheduled.description,
            'tags': scheduled.tags,
            'status': scheduled.status,
            'scheduled_time': scheduled.scheduled_time.isoformat(),
            'published_at': scheduled.published_at.isoformat() if scheduled.published_at else None,
            'error_message': scheduled.error_message,
            'created_at': scheduled.created_at.isoformat()
        }), 200
    except Exception as e:
        log(f"Error fetching scheduled publish: {str(e)}", level='error')
        return jsonify({"error": str(e)}), 500


@scheduled_bp.route('/<int:publish_id>/update', methods=['PUT'])
@user_required
def update_scheduled_publish(publish_id):
    """Update scheduled publish details"""
    try:
        data = request.get_json()
        user = get_current_user()
        
        scheduled = ScheduledPublish.query.filter_by(
            id=publish_id,
            user_id=user.id
        ).first()
        
        if not scheduled:
            return jsonify({"error": "Scheduled publish not found"}), 404
        
        if scheduled.status != 'pending':
            return jsonify({"error": "Can only edit pending publishes"}), 400
        
        # Update fields
        if 'title' in data:
            scheduled.title = data['title']
        if 'description' in data:
            scheduled.description = data['description']
        if 'tags' in data:
            scheduled.tags = data['tags']
        if 'platforms' in data:
            scheduled.platforms = data['platforms']
        if 'scheduled_time' in data:
            scheduled_datetime = datetime.fromisoformat(data['scheduled_time'])
            if scheduled_datetime < datetime.utcnow():
                return jsonify({"error": "Scheduled time must be in future"}), 400
            scheduled.scheduled_time = scheduled_datetime
        
        db.session.commit()
        
        log(f"Scheduled publish updated: {publish_id}")
        
        return jsonify({
            'id': scheduled.id,
            'status': 'updated',
            'scheduled_time': scheduled.scheduled_time.isoformat()
        }), 200
    except Exception as e:
        log(f"Error updating scheduled publish: {str(e)}", level='error')
        return jsonify({"error": str(e)}), 500


@scheduled_bp.route('/<int:publish_id>/cancel', methods=['POST'])
@user_required
def cancel_scheduled_publish(publish_id):
    """Cancel scheduled publish"""
    try:
        user = get_current_user()
        
        scheduled = ScheduledPublish.query.filter_by(
            id=publish_id,
            user_id=user.id
        ).first()
        
        if not scheduled:
            return jsonify({"error": "Scheduled publish not found"}), 404
        
        if scheduled.status != 'pending':
            return jsonify({"error": "Can only cancel pending publishes"}), 400
        
        scheduled.status = 'cancelled'
        db.session.commit()
        
        log(f"Scheduled publish cancelled: {publish_id}")
        
        return jsonify({
            'id': scheduled.id,
            'status': 'cancelled'
        }), 200
    except Exception as e:
        log(f"Error cancelling scheduled publish: {str(e)}", level='error')
        return jsonify({"error": str(e)}), 500
