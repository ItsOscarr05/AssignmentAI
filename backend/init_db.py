#!/usr/bin/env python3
"""
Initialize SQLite database for local development
"""
import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import Base
from app.models.user import User
from app.models.token import Token
from app.models.assignment import Assignment
from app.models.submission import Submission
from app.models.feedback import Feedback
from app.models.ai_assignment import AIAssignment
from app.models.class_model import Class
from app.models.security import SecurityAlert, AuditLog, TwoFactorSetup
from app.models.log import SystemLog

from app.models.subscription import Subscription
from app.models.usage import Usage, UsageLimit
from app.models.activity import Activity
from app.models.preference import Preference
from app.models.template import Template
from app.models.citation import Citation
from app.models.file import File

def init_db():
    """Initialize the database with all tables"""
    print("Initializing SQLite database for local development...")
    
    # Create SQLite database URL
    database_url = "sqlite:///./assignmentai.db"
    
    # Create engine
    engine = create_engine(database_url, echo=True)
    
    # Create all tables
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)
    
    print("Database initialized successfully!")
    print(f"Database file: {os.path.abspath('./assignmentai.db')}")

if __name__ == "__main__":
    init_db() 