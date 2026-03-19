"""
Admin Dashboard Routes for Locaa AI
"""
from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from database.models import (
    db, User, Job, Payment, AdminUser, AuditLog, 
    SubscriptionPlan, BatchProcessing
)
from utils.auth import get_current_user, user_required
from utils.logger import log

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')


def check_admin(f):
    """Decorator to check if user is admin"""
    def wrapper(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({"error": "Unauthorized"}), 401
        
        admin = AdminUser.query.filter_by(user_id=user.id).first()
        if not admin:
            return jsonify({"error": "Admin access required"}), 403
        
        return f(*args, **kwargs)
    wrapper.__name__ = f.__name__
    return wrapper


@admin_bp.route('/dashboard', methods=['GET'])
@user_required
@check_admin
def admin_dashboard():
    """Get admin dashboard statistics"""
    try:
        # Calculate stats
        total_users = User.query.count()
        active_users = User.query.filter_by(is_active=True).count()
        total_jobs = Job.query.count()
        completed_jobs = Job.query.filter_by(status='completed').count()
        total_revenue = db.session.query(db.func.sum(Payment.amount)).filter(
            Payment.status == 'succeeded'
        ).scalar() or 0
        
        # Users by subscription tier
        tier_counts = db.session.query(
            User.subscription_tier,
            db.func.count(User.id)
        ).group_by(User.subscription_tier).all()
        
        # Last 7 days revenue
        week_ago = datetime.utcnow() - timedelta(days=7)
        week_revenue = db.session.query(db.func.sum(Payment.amount)).filter(
            Payment.status == 'succeeded',
            Payment.created_at >= week_ago
        ).scalar() or 0
        
        # Jobs per day (last 7 days)
        jobs_per_day = []
        for i in range(6, -1, -1):
            date = datetime.utcnow() - timedelta(days=i)
            start = date.replace(hour=0, minute=0, second=0, microsecond=0)
            end = start + timedelta(days=1)
            count = Job.query.filter(
                Job.created_at >= start,
                Job.created_at < end
            ).count()
            jobs_per_day.append({
                'date': start.isoformat(),
                'count': count
            })
        
        return jsonify({
            'summary': {
                'total_users': total_users,
                'active_users': active_users,
                'total_jobs': total_jobs,
                'completed_jobs': completed_jobs,
                'success_rate': round((completed_jobs / total_jobs * 100) if total_jobs > 0 else 0, 2),
                'total_revenue': round(total_revenue, 2),
                'week_revenue': round(week_revenue, 2)
            },
            'users_by_tier': {tier: count for tier, count in tier_counts},
            'jobs_per_day': jobs_per_day
        }), 200
    except Exception as e:
        log(f"Error fetching admin dashboard: {str(e)}", level='error')
        return jsonify({"error": str(e)}), 500


@admin_bp.route('/users', methods=['GET'])
@user_required
@check_admin
def list_users():
    """List all users"""
    try:
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 50, type=int)
        search = request.args.get('search', '')
        tier = request.args.get('tier')
        
        query = User.query
        
        if search:
            query = query.filter(
                (User.email.ilike(f'%{search}%')) |
                (User.username.ilike(f'%{search}%')) |
                (User.first_name.ilike(f'%{search}%'))
            )
        
        if tier:
            query = query.filter_by(subscription_tier=tier)
        
        users = query.paginate(page=page, per_page=limit)
        
        return jsonify({
            'total': users.total,
            'pages': users.pages,
            'current_page': page,
            'users': [{
                'id': u.id,
                'email': u.email,
                'username': u.username,
                'first_name': u.first_name,
                'subscription_tier': u.subscription_tier,
                'subscription_status': u.subscription_status,
                'is_email_verified': u.is_email_verified,
                'is_active': u.is_active,
                'videos_processed': u.videos_processed,
                'clips_generated': u.clips_generated,
                'created_at': u.created_at.isoformat()
            } for u in users.items]
        }), 200
    except Exception as e:
        log(f"Error listing users: {str(e)}", level='error')
        return jsonify({"error": str(e)}), 500


@admin_bp.route('/users/<int:user_id>', methods=['GET'])
@user_required
@check_admin
def get_user_details(user_id):
    """Get detailed user information"""
    try:
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Get user stats
        job_count = Job.query.filter_by(user_id=user_id).count()
        payment_count = Payment.query.filter_by(user_id=user_id).count()
        total_paid = db.session.query(db.func.sum(Payment.amount)).filter(
            Payment.user_id == user_id,
            Payment.status == 'succeeded'
        ).scalar() or 0
        
        return jsonify({
            'id': user.id,
            'email': user.email,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'subscription_tier': user.subscription_tier,
            'subscription_status': user.subscription_status,
            'is_email_verified': user.is_email_verified,
            'is_active': user.is_active,
            'created_at': user.created_at.isoformat(),
            'stats': {
                'videos_processed': user.videos_processed,
                'clips_generated': user.clips_generated,
                'uploads_published': user.uploads_published,
                'total_jobs': job_count,
                'total_payments': payment_count,
                'total_paid': round(total_paid, 2)
            }
        }), 200
    except Exception as e:
        log(f"Error fetching user details: {str(e)}", level='error')
        return jsonify({"error": str(e)}), 500


@admin_bp.route('/users/<int:user_id>/disable', methods=['POST'])
@user_required
@check_admin
def disable_user(user_id):
    """Disable user account"""
    try:
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        user.is_active = False
        db.session.commit()
        
        log(f"User {user_id} disabled by admin")
        
        return jsonify({
            'success': True,
            'message': f'User {user.email} has been disabled'
        }), 200
    except Exception as e:
        log(f"Error disabling user: {str(e)}", level='error')
        return jsonify({"error": str(e)}), 500


@admin_bp.route('/users/<int:user_id>/promote-admin', methods=['POST'])
@user_required
@check_admin
def promote_to_admin(user_id):
    """Promote user to admin"""
    try:
        admin_user = get_current_user()
        current_admin = AdminUser.query.filter_by(user_id=admin_user.id).first()
        
        if not current_admin or current_admin.role != 'admin':
            return jsonify({"error": "Only admin can promote users"}), 403
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        existing_admin = AdminUser.query.filter_by(user_id=user_id).first()
        if existing_admin:
            return jsonify({"error": "User is already an admin"}), 400
        
        role = request.get_json().get('role', 'moderator')
        
        admin = AdminUser(
            user_id=user_id,
            role=role,
            promoted_by=admin_user.id
        )
        
        db.session.add(admin)
        db.session.commit()
        
        log(f"User {user_id} promoted to {role} admin")
        
        return jsonify({
            'success': True,
            'message': f'User promoted to {role}'
        }), 201
    except Exception as e:
        log(f"Error promoting user: {str(e)}", level='error')
        return jsonify({"error": str(e)}), 500


@admin_bp.route('/audit-logs', methods=['GET'])
@user_required
@check_admin
def get_audit_logs():
    """Get audit logs"""
    try:
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 50, type=int)
        user_id = request.args.get('user_id', type=int)
        
        query = AuditLog.query.order_by(AuditLog.created_at.desc())
        
        if user_id:
            query = query.filter_by(user_id=user_id)
        
        logs = query.paginate(page=page, per_page=limit)
        
        return jsonify({
            'total': logs.total,
            'pages': logs.pages,
            'current_page': page,
            'logs': [{
                'id': log.id,
                'user_id': log.user_id,
                'action': log.action,
                'resource': log.resource,
                'details': log.details,
                'ip_address': log.ip_address,
                'created_at': log.created_at.isoformat()
            } for log in logs.items]
        }), 200
    except Exception as e:
        log(f"Error fetching audit logs: {str(e)}", level='error')
        return jsonify({"error": str(e)}), 500


@admin_bp.route('/payments', methods=['GET'])
@user_required
@check_admin
def get_all_payments():
    """Get all payment records"""
    try:
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 50, type=int)
        status = request.args.get('status')
        
        query = Payment.query.order_by(Payment.created_at.desc())
        
        if status:
            query = query.filter_by(status=status)
        
        payments = query.paginate(page=page, per_page=limit)
        
        return jsonify({
            'total': payments.total,
            'pages': payments.pages,
            'current_page': page,
            'payments': [{
                'id': p.id,
                'user_id': p.user_id,
                'amount': p.amount,
                'currency': p.currency,
                'status': p.status,
                'plan_name': p.plan_name,
                'paid_at': p.paid_at.isoformat() if p.paid_at else None,
                'created_at': p.created_at.isoformat()
            } for p in payments.items]
        }), 200
    except Exception as e:
        log(f"Error fetching payments: {str(e)}", level='error')
        return jsonify({"error": str(e)}), 500


@admin_bp.route('/system-health', methods=['GET'])
@user_required
@check_admin
def system_health():
    """Get system health status"""
    try:
        # Database status
        db_status = 'healthy'
        try:
            db.session.execute('SELECT 1')
        except:
            db_status = 'unhealthy'
        
        # Get queue stats
        pending_jobs = Job.query.filter_by(status='downloading').count()
        processing_jobs = Job.query.filter_by(status='processing').count()
        
        return jsonify({
            'database': db_status,
            'pending_jobs': pending_jobs,
            'processing_jobs': processing_jobs,
            'timestamp': datetime.utcnow().isoformat()
        }), 200
    except Exception as e:
        log(f"Error checking system health: {str(e)}", level='error')
        return jsonify({"error": str(e)}), 500
