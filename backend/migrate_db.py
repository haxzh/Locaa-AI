#!/usr/bin/env python
"""
Database Migration Script
Adds new columns to existing jobs table without losing data
"""
import sqlite3
import os
from app import app

def migrate_database():
    """Add new columns to jobs table"""
    
    db_path = os.path.join('instance', 'locaa_ai.db')
    
    if not os.path.exists(db_path):
        print(f"❌ Database not found at: {db_path}")
        print("💡 Run the Flask app first to create the database.")
        return False
    
    print(f"📂 Database location: {db_path}")
    
    # Connect to SQLite database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Get existing columns
    cursor.execute("PRAGMA table_info(jobs)")
    existing_columns = [row[1] for row in cursor.fetchall()]
    
    print("\n📊 Existing columns in 'jobs' table:")
    for col in existing_columns:
        print(f"  • {col}")
    
    # Columns to add
    new_columns = {
        'current_step': 'VARCHAR(100)',
        'download_progress': 'INTEGER DEFAULT 0',
        'clips_completed': 'INTEGER DEFAULT 0',
        'total_clips': 'INTEGER DEFAULT 0'
    }
    
    print("\n🔧 Adding new columns...")
    columns_added = 0
    
    for col_name, col_type in new_columns.items():
        if col_name not in existing_columns:
            try:
                cursor.execute(f"ALTER TABLE jobs ADD COLUMN {col_name} {col_type}")
                print(f"  ✅ Added: {col_name}")
                columns_added += 1
            except sqlite3.OperationalError as e:
                print(f"  ⚠️  {col_name}: {e}")
        else:
            print(f"  ⏭️  {col_name} already exists")
    
    conn.commit()
    
    # Verify changes
    cursor.execute("PRAGMA table_info(jobs)")
    updated_columns = [row[1] for row in cursor.fetchall()]
    
    print("\n✅ Updated columns in 'jobs' table:")
    for col in updated_columns:
        print(f"  • {col}")
    
    conn.close()
    
    if columns_added > 0:
        print(f"\n🎉 Successfully added {columns_added} new column(s)!")
    else:
        print("\n✅ All columns already exist. No changes needed.")
    
    print("\n✅ Migration complete! You can now restart your Flask server.")
    return True

if __name__ == '__main__':
    print("=" * 60)
    print("DATABASE MIGRATION SCRIPT")
    print("=" * 60)
    print("\n📝 This script will ADD new columns to the jobs table")
    print("   without deleting existing data.")
    print("\n⚠️  Make sure the Flask server is NOT running!")
    
    confirm = input("\n▶️  Continue? (yes/no): ")
    
    if confirm.lower() in ['yes', 'y']:
        migrate_database()
    else:
        print("\n❌ Cancelled.")
