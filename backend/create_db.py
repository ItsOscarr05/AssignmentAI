#!/usr/bin/env python3
"""
Simple database initialization script for current schema
"""
import os
import sys

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import Base, engine
# Import all models to ensure they're registered with Base
from app.models import *

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

if __name__ == "__main__":
    create_tables() 