#!/usr/bin/env python3
"""
Simple database creation script that includes the file_uploads table.
"""

import os
import sys
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine, text
from app.db.base_class import Base
from app.models import *  # Import all models

def create_database():
    """Create the database with all tables including file_uploads."""
    
    # Database URL
    database_url = "sqlite:///./app.db"
    
    # Create engine
    engine = create_engine(database_url, echo=True)
    
    try:
        # Create all tables
        print("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        
        # Set the alembic version to the latest migration
        with engine.connect() as conn:
            # Insert the current migration version
            conn.execute(text("DELETE FROM alembic_version"))
            conn.execute(text("INSERT INTO alembic_version (version_num) VALUES ('ee821189a449')"))
            conn.commit()
        
        print("Database created successfully!")
        print("All tables including file_uploads have been created.")
        
    except Exception as e:
        print(f"Error creating database: {e}")
        return False
    
    return True

if __name__ == "__main__":
    create_database()
