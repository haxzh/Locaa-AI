#!/usr/bin/env python
"""
Process stuck jobs that are in 'downloading' status
Run this to manually trigger processing for jobs that got stuck
"""
import sys
from app import app, db
from database.models import Job
from app import process_video_background
import threading

def process_stuck_jobs():
    """Find and process all stuck jobs"""
    with app.app_context():
        # Find all jobs stuck in downloading status
        stuck_jobs = Job.query.filter(Job.status.in_(['downloading', 'pending'])).all()
        
        if not stuck_jobs:
            print("✓ No stuck jobs found!")
            return
        
        print(f"\n🔍 Found {len(stuck_jobs)} stuck job(s):\n")
        
        for job in stuck_jobs:
            print(f"  • Job {job.id}")
            print(f"    Video ID: {job.video_id}")
            print(f"    Status: {job.status}")
            print(f"    Progress: {job.download_progress}%")
            print(f"    Created: {job.created_at}")
            print()
        
        proceed = input("▶️  Process these stuck jobs now? (yes/no): ")
        
        if proceed.lower() in ['yes', 'y']:
            print("\n🚀 Starting background processing...\n")
            
            for job in stuck_jobs:
                print(f"⚙️  Processing Job {job.id}...")
                
                # Reset job status
                job.download_progress = 0
                job.progress = 0
                job.current_step = "Restarting download..."
                db.session.commit()
                
                # Start in background thread
                thread = threading.Thread(target=process_video_background, args=(job.id,))
                thread.daemon = True
                thread.start()
                
                print(f"   ✓ Background thread started for Job {job.id}")
            
            print(f"\n✅ All {len(stuck_jobs)} job(s) queued for processing!")
            print("💡 Monitor progress in your dashboard (refresh the page)")
            print("⏱️  Processing will continue in background...")
            
        else:
            print("❌ Cancelled.")

if __name__ == '__main__':
    try:
        process_stuck_jobs()
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user")
        sys.exit(0)
