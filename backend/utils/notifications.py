import json
from datetime import datetime
from database.models import db, Notification
from utils.logger import log


def create_notification(user_id, title, message, notif_type='info', source='system', meta=None):
    """Create a persistent in-app notification. Best effort; never raises."""
    try:
        row = Notification(
            user_id=user_id,
            type=notif_type,
            title=title,
            message=message,
            source=source,
            meta_json=json.dumps(meta or {}),
            is_read=False,
            created_at=datetime.utcnow(),
        )
        db.session.add(row)
        db.session.commit()
        return row
    except Exception as e:
        db.session.rollback()
        log(f"Failed to create notification for user {user_id}: {e}", level='warning')
        return None
