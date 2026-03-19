#!/usr/bin/env python
"""
Database Reset Script
Safely recreates the database with updated schema
"""
import os
from app import app, db
from database.models import User, Job, SubscriptionPlan, APIUsage, AuditLog

def reset_database():
    """Drop all tables and recreate with new schema"""
    with app.app_context():
        print("🗑️  Dropping all tables...")
        db.drop_all()
        
        print("✨ Creating tables with new schema...")
        db.create_all()
        
        print("\n✅ Database reset complete!")
        print("\n📊 Tables created:")
        for table in db.metadata.sorted_tables:
            print(f"  ✓ {table.name}")
        
        # Verify Job table has new columns
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        job_columns = [col['name'] for col in inspector.get_columns('jobs')]
        
        print("\n🔍 Verifying Job table columns:")
        required_columns = ['current_step', 'download_progress', 'clips_completed', 'total_clips']
        for col in required_columns:
            if col in job_columns:
                print(f"  ✅ {col}")
            else:
                print(f"  ❌ {col} - MISSING!")
        
        print("\n✅ All done! You can now start your Flask server.")
        return True

if __name__ == '__main__':
    print("=" * 60)
    print("DATABASE RESET SCRIPT")
    print("=" * 60)
    print("\n⚠️  WARNING: This will delete ALL existing data!")
    print("   - All users will be removed")
    print("   - All jobs will be removed")
    print("   - All payments will be removed")
    
    confirm = input("\n🔴 Are you sure? Type 'yes' to continue: ")
    
    if confirm.lower() == 'yes':
        reset_database()
    else:
        print("\n❌ Cancelled. Database not modified.")
