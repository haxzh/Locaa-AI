from datetime import datetime
from flask import Blueprint, jsonify
from database.models import Notification, db
from utils.auth import user_required, get_current_user

notifications_bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')


@notifications_bp.route('', methods=['GET'])
@user_required
def list_notifications():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    rows = Notification.query.filter_by(user_id=user.id).order_by(Notification.created_at.desc()).limit(30).all()
    unread_count = Notification.query.filter_by(user_id=user.id, is_read=False).count()

    return jsonify({
        'notifications': [r.to_dict() for r in rows],
        'unread_count': unread_count,
    }), 200


@notifications_bp.route('/<int:notif_id>/read', methods=['POST'])
@user_required
def mark_notification_read(notif_id):
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    row = Notification.query.filter_by(id=notif_id, user_id=user.id).first()
    if not row:
        return jsonify({'error': 'Notification not found'}), 404

    row.is_read = True
    row.read_at = datetime.utcnow()
    db.session.commit()

    return jsonify({'success': True}), 200


@notifications_bp.route('/read-all', methods=['POST'])
@user_required
def mark_all_read():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    rows = Notification.query.filter_by(user_id=user.id, is_read=False).all()
    now = datetime.utcnow()
    for row in rows:
        row.is_read = True
        row.read_at = now
    db.session.commit()

    return jsonify({'success': True, 'updated': len(rows)}), 200
