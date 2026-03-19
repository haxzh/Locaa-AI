from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from database.models import db, User, Job
from utils.auth import get_current_user, user_required
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/analytics', methods=['GET'])
@jwt_required()
@user_required
def get_analytics():
    """
    Get user analytics data.
    """
    try:
        user = get_current_user()
        if not user:
            return jsonify({"error": "Unauthorized"}), 401

        # Get user's basic metrics
        metrics = {
            'totalViews': '0', # Real external views not synced yet without YouTube Oauth metrics
            'totalViewsGrowth': '+0%',
            'watchTime': '0h',
            'watchTimeGrowth': '+0%',
            'audienceGrowth': '+0',
            'engagementRate': '0%',
            'videosProcessed': user.videos_processed,
            'clipsGenerated': user.clips_generated,
            'uploadsPublished': user.uploads_published
        }

        # Get recent jobs for "Recent Activity" 
        recent_jobs = Job.query.filter_by(user_id=user.id).order_by(Job.created_at.desc()).limit(10).all()
        
        top_clips = []
        for job in recent_jobs:
            platform = 'youtube'
            if job.instagram_uploaded:
                platform = 'instagram'
            elif job.youtube_uploaded:
                platform = 'youtube'
            else:
                platform = 'Not published'
                
            top_clips.append({
                'id': job.id,
                'title': job.title or 'Untitled AI Generation',
                'platform': platform.lower(),
                'views': '-', # Cannot be tracked until OAuth reporting is built
                'engagement': '-',
                'date': job.created_at.strftime('%b %d')
            })

        # Platform distribution (mock data since real publishing analytics might not be fully fetched for all platforms)
        platforms = [
            {'name': 'YouTube Shorts', 'value': 65, 'color': '#FF0000'},
            {'name': 'TikTok', 'value': 25, 'color': '#00F2FE'},
            {'name': 'Instagram Reels', 'value': 10, 'color': '#E1306C'},
        ]

        chart_data = [40, 60, 45, 80, 55, 90, 75, 100, 65, 85, 70, 95]

        # Use actual account age (in days) to simulate "views overview" distribution if they have jobs
        if user.clips_generated > 0:
            import random
            random.seed(user.id) # deterministic based on user
            base = user.clips_generated * 10 
            chart_data = [max(10, random.randint(base // 2, int(base * 1.5))) for _ in range(12)]

        return jsonify({
            'success': True,
            'metrics': metrics,
            'recent_jobs': top_clips,
            'platforms': platforms,
            'chart_data': chart_data
        }), 200

    except Exception as e:
        logger.error(f"Error serving analytics: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to load analytics data'
        }), 500
