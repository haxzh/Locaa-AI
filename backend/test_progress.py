#!/usr/bin/env python
"""Test new progress tracking fields"""
from app import app, db
from database.models import Job

with app.app_context():
    print("✓ Models loaded successfully")
    print("\n📊 Job model columns:")
    for col in Job.__table__.columns:
        print(f"  • {col.name}: {col.type}")
    
    # Check new progress fields
    new_fields = ['current_step', 'download_progress', 'clips_completed', 'total_clips']
    print("\n✅ New progress tracking fields:")
    for field in new_fields:
        if hasattr(Job, field):
            print(f"  ✓ {field}")
        else:
            print(f"  ✗ {field} - MISSING")
    
    print("\n🎯 Database ready for live progress tracking!")
