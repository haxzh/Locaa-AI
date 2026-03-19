"""
Batch Processing Routes for Locaa AI
"""
from flask import Blueprint, request, jsonify
import uuid
import json
from datetime import datetime
from database.models import db, BatchProcessing, Job
from utils.auth import get_current_user, user_required, subscription_required
from core.rate_limiter import rate_limit
from utils.logger import log

batch_bp = Blueprint('batch', __name__, url_prefix='/api/batch')


@batch_bp.route('/create', methods=['POST'])
@user_required
@subscription_required('pro')
@rate_limit('/api/batch/create')
def create_batch_processing():
    """Create batch processing for multiple videos"""
    try:
        data = request.get_json()
        user = get_current_user()
        
        name = data.get('name', 'Batch Processing')
        video_urls = data.get('video_urls', [])
        settings = data.get('settings', {})  # clips_per_video, watermark, publish_platforms, etc
        
        if not video_urls or len(video_urls) == 0:
            return jsonify({"error": "No video URLs provided"}), 400
        
        # Pro: max 10 videos, Business: unlimited
        if user.subscription_tier == 'pro' and len(video_urls) > 10:
            return jsonify({"error": "Pro plan limited to 10 videos per batch"}), 400
        
        batch_id = f"batch_{uuid.uuid4().hex[:8]}"
        
        # Create batch
        batch = BatchProcessing(
            id=batch_id,
            user_id=user.id,
            name=name,
            total_videos=len(video_urls),
            video_urls=json.dumps(video_urls),
            settings=json.dumps(settings),
            status='pending'
        )
        
        db.session.add(batch)
        db.session.commit()
        
        log(f"Batch processing created: {batch_id} with {len(video_urls)} videos")
        
        return jsonify({
            'id': batch_id,
            'name': name,
            'total_videos': len(video_urls),
            'status': 'pending',
            'created_at': batch.created_at.isoformat()
        }), 201
    except Exception as e:
        log(f"Error creating batch: {str(e)}", level='error')
        return jsonify({"error": str(e)}), 500


@batch_bp.route('/list', methods=['GET'])
@user_required
def list_batches():
    """List batch processing jobs"""
    try:
        user = get_current_user()
        
        status = request.args.get('status')  # pending, processing, completed, failed
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 20, type=int)
        
        query = BatchProcessing.query.filter_by(user_id=user.id).order_by(
            BatchProcessing.created_at.desc()
        )
        
        if status:
            query = query.filter_by(status=status)
        
        batches = query.paginate(page=page, per_page=limit)
        
        return jsonify({
            'total': batches.total,
            'pages': batches.pages,
            'current_page': page,
            'batches': [{
                'id': b.id,
                'name': b.name,
                'status': b.status,
                'total_videos': b.total_videos,
                'processed_videos': b.processed_videos,
                'failed_videos': b.failed_videos,
                'progress': round((b.processed_videos / b.total_videos * 100) if b.total_videos > 0 else 0, 2),
                'created_at': b.created_at.isoformat(),
                'completed_at': b.completed_at.isoformat() if b.completed_at else None
            } for b in batches.items]
        }), 200
    except Exception as e:
        log(f"Error listing batches: {str(e)}", level='error')
        return jsonify({"error": str(e)}), 500


@batch_bp.route('/<batch_id>', methods=['GET'])
@user_required
def get_batch_details(batch_id):
    """Get batch processing details"""
    try:
        user = get_current_user()
        
        batch = BatchProcessing.query.filter_by(
            id=batch_id,
            user_id=user.id
        ).first()
        
        if not batch:
            return jsonify({"error": "Batch not found"}), 404
        
        video_urls = json.loads(batch.video_urls) if batch.video_urls else []
        job_ids = json.loads(batch.job_ids) if batch.job_ids else []
        settings = json.loads(batch.settings) if batch.settings else {}
        
        return jsonify({
            'id': batch.id,
            'name': batch.name,
            'status': batch.status,
            'total_videos': batch.total_videos,
            'processed_videos': batch.processed_videos,
            'failed_videos': batch.failed_videos,
            'progress': round((batch.processed_videos / batch.total_videos * 100) if batch.total_videos > 0 else 0, 2),
            'video_urls': video_urls,
            'job_ids': job_ids,
            'settings': settings,
            'created_at': batch.created_at.isoformat(),
            'started_at': batch.started_at.isoformat() if batch.started_at else None,
            'completed_at': batch.completed_at.isoformat() if batch.completed_at else None
        }), 200
    except Exception as e:
        log(f"Error fetching batch: {str(e)}", level='error')
        return jsonify({"error": str(e)}), 500


@batch_bp.route('/<batch_id>/start', methods=['POST'])
@user_required
def start_batch_processing(batch_id):
    """Start batch processing"""
    try:
        user = get_current_user()
        
        batch = BatchProcessing.query.filter_by(
            id=batch_id,
            user_id=user.id
        ).first()
        
        if not batch:
            return jsonify({"error": "Batch not found"}), 404
        
        if batch.status != 'pending':
            return jsonify({"error": "Batch already started"}), 400
        
        batch.status = 'processing'
        batch.started_at = datetime.utcnow()
        db.session.commit()
        
        log(f"Batch processing started: {batch_id}")
        
        # TODO: Queue batch jobs in background task queue
        # This would typically use Celery or similar
        
        return jsonify({
            'id': batch.id,
            'status': 'processing',
            'started_at': batch.started_at.isoformat()
        }), 200
    except Exception as e:
        log(f"Error starting batch: {str(e)}", level='error')
        return jsonify({"error": str(e)}), 500


@batch_bp.route('/<batch_id>/cancel', methods=['POST'])
@user_required
def cancel_batch(batch_id):
    """Cancel batch processing"""
    try:
        user = get_current_user()
        
        batch = BatchProcessing.query.filter_by(
            id=batch_id,
            user_id=user.id
        ).first()
        
        if not batch:
            return jsonify({"error": "Batch not found"}), 404
        
        if batch.status == 'completed' or batch.status == 'failed':
            return jsonify({"error": "Cannot cancel completed batch"}), 400
        
        batch.status = 'cancelled'
        db.session.commit()
        
        log(f"Batch cancelled: {batch_id}")
        
        return jsonify({
            'id': batch.id,
            'status': 'cancelled'
        }), 200
    except Exception as e:
        log(f"Error cancelling batch: {str(e)}", level='error')
        return jsonify({"error": str(e)}), 500


@batch_bp.route('/<batch_id>/results', methods=['GET'])
@user_required
def get_batch_results(batch_id):
    """Get batch processing results"""
    try:
        user = get_current_user()
        
        batch = BatchProcessing.query.filter_by(
            id=batch_id,
            user_id=user.id
        ).first()
        
        if not batch:
            return jsonify({"error": "Batch not found"}), 404
        
        job_ids = json.loads(batch.job_ids) if batch.job_ids else []
        
        jobs = Job.query.filter(Job.id.in_(job_ids)).all()
        
        return jsonify({
            'batch_id': batch.id,
            'status': batch.status,
            'total_videos': batch.total_videos,
            'processed_videos': batch.processed_videos,
            'failed_videos': batch.failed_videos,
            'results': [{
                'job_id': j.id,
                'video_url': j.youtube_url,
                'status': j.status,
                'clips_generated': j.clips_generated,
                'progress': j.progress,
                'error_message': j.error_message
            } for j in jobs]
        }), 200
    except Exception as e:
        log(f"Error fetching batch results: {str(e)}", level='error')
        return jsonify({"error": str(e)}), 500
