from app import app
from database.models import Job

with app.app_context():
    # Check all jobs matching the id partially or fully
    jobs = Job.query.filter(Job.id.like('%3cf8ded3%')).all()
    print(f"Exact match: {bool(jobs)}")
    for j in jobs:
        print(f"Found Job ID: {j.id}, User ID: {j.user_id}, Status: {j.status}")
