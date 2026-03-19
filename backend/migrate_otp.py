"""
Database Migration: Add OTPVerification Table
"""
from app import app
from database.models import db, OTPVerification
from utils.logger import log


def migrate_otp_table():
    """Create OTPVerification table if it doesn't exist"""
    with app.app_context():
        try:
            # Check if table exists
            inspector = db.inspect(db.engine)
            tables = inspector.get_table_names()
            
            if 'otp_verification' not in tables:
                # Create table
                db.create_all()
                log("✅ OTPVerification table created successfully")
            else:
                log("✅ OTPVerification table already exists")
                
            log("✅ Migration completed successfully")
            return True
            
        except Exception as e:
            log(f"❌ Error during OTP table migration: {str(e)}", level='error')
            return False


if __name__ == '__main__':
    print("Starting OTP Table Migration...")
    success = migrate_otp_table()
    if success:
        print("✅ Migration completed successfully!")
    else:
        print("❌ Migration failed. Check logs for details.")
