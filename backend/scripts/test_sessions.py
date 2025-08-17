#!/usr/bin/env python3
"""
Simple test script to verify the session system works
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.crud.session import session
from app.models.user import User
from datetime import datetime, timedelta

def test_session_system():
    """Test the session system manually"""
    db = SessionLocal()
    try:
        print("Testing session system...")
        
        # Create a test user if it doesn't exist
        test_user = db.query(User).filter(User.email == "test@example.com").first()
        if not test_user:
            print("Creating test user...")
            test_user = User(
                email="test@example.com",
                hashed_password="test_password_hash",
                is_active=True
            )
            db.add(test_user)
            db.commit()
            db.refresh(test_user)
            print(f"Created user with ID: {test_user.id}")
        else:
            print(f"Using existing user with ID: {test_user.id}")
        
        # Test creating a session
        print("\nCreating test session...")
        device_info = {
            "type": "desktop",
            "browser": "chrome",
            "os": "windows",
            "location": "test-location"
        }
        
        session_obj = session.create_session(
            db=db,
            user_id=test_user.id,
            device_info=device_info,
            expires_in_days=30
        )
        print(f"Created session: {session_obj.id}")
        print(f"Device info: {session_obj.device_info}")
        print(f"Expires at: {session_obj.expires_at}")
        
        # Test getting active sessions
        print("\nGetting active sessions...")
        active_sessions = session.get_active_sessions_by_user(db, test_user.id)
        print(f"Found {len(active_sessions)} active sessions")
        
        for sess in active_sessions:
            print(f"  - Session {sess.id}: {sess.device_info.get('type', 'unknown')} device")
        
        # Test getting session count
        print("\nGetting session count...")
        count = session.get_session_count_by_user(db, test_user.id)
        print(f"Active session count: {count}")
        
        # Test session analytics
        print("\nGetting session analytics...")
        analytics = session.get_session_analytics(db, test_user.id)
        print(f"Analytics: {analytics}")
        
        print("\nSession system test completed successfully!")
        
    except Exception as e:
        print(f"Error testing session system: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_session_system()
