from app import app
from database.models import UserIntegration

with app.app_context():
    integrations = UserIntegration.query.filter_by(provider='youtube').all()
    for i in integrations:
        cfg = i.get_config()
        print(f"User {i.user_id} YT Config Keys: {list(cfg.keys())}")
        print(f"Has token: {'token' in cfg and bool(cfg['token'])}")
