#!/usr/bin/env python3
"""
Simple database initialization script for current schema
"""
import os
import sys

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import Base, engine
# Import models in the correct order to ensure they're registered with Base
from app.models.user import User
from app.models.assignment import Assignment
from app.models.file_upload import FileUpload
from app.models.submission import Submission
from app.models.feedback import Feedback
from app.models.ai_assignment import AIAssignment
from app.models.class_model import Class
from app.models.security import SecurityAlert, AuditLog, TwoFactorSetup
from app.models.log import SystemLog
from app.models.subscription import Subscription
from app.models.usage import Usage, UsageLimit
from app.models.file import File
from app.models.activity import Activity
from app.models.transaction import Transaction

def create_tables():
    """Create all database tables"""
    print("Creating database tables...")
    
    # Drop all tables first to ensure clean slate
    Base.metadata.drop_all(bind=engine)
    print("Dropped existing tables")
    
    # Create all tables with current schema
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")
    
    # Verify the User table has all required columns
    from sqlalchemy import inspect
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"Created tables: {tables}")
    
    if 'users' in tables:
        columns = inspector.get_columns('users')
        column_names = [col['name'] for col in columns]
        print(f"User table columns: {column_names}")
        
        # Check for required OAuth columns
        required_columns = ['oauth_provider', 'oauth_access_token', 'oauth_refresh_token', 'oauth_token_expires_at']
        missing_columns = [col for col in required_columns if col not in column_names]
        
        if missing_columns:
            print(f"WARNING: Missing columns: {missing_columns}")
        else:
            print("All required columns are present!")
    else:
        print("WARNING: users table was not created!")
    
    # Check for file_uploads table
    if 'file_uploads' in tables:
        columns = inspector.get_columns('file_uploads')
        column_names = [col['name'] for col in columns]
        print(f"FileUpload table columns: {column_names}")
    else:
        print("WARNING: file_uploads table was not created!")

if __name__ == "__main__":
    create_tables() 