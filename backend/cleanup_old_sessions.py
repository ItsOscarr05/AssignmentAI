#!/usr/bin/env python3
"""
Cleanup script to remove old sessions that don't have device_key field
"""

import asyncio
import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.database import get_db
from app.services.session_service import get_session_service
from app.models.session import UserSession
from sqlalchemy.orm import Session

async def cleanup_old_sessions():
    """Clean up old sessions that don't have device_key field"""
    
    # Get database session
    db = next(get_db())
    
    try:
        print("Cleaning up old sessions without device_key...")
        print("=" * 50)
        
        # Find sessions without device_key
        old_sessions = db.query(UserSession).filter(
            UserSession.device_key.is_(None)
        ).all()
        
        print(f"Found {len(old_sessions)} sessions without device_key")
        
        if old_sessions:
            # Mark them as inactive
            for session in old_sessions:
                session.is_active = False
                session.invalidated_at = session.created_at  # Mark as invalidated from creation
            
            db.commit()
            print(f"Marked {len(old_sessions)} old sessions as inactive")
        else:
            print("No old sessions found to clean up")
        
        # Now check active session count for a test user
        test_user_id = 1  # Change this to your user ID if different
        
        session_service = get_session_service(db)
        active_count = await session_service.get_active_session_count(test_user_id)
        print(f"\nUser {test_user_id} now has {active_count} active sessions")
        
        # Get all sessions for this user to see what's left
        all_sessions = db.query(UserSession).filter(
            UserSession.user_id == test_user_id
        ).all()
        
        print(f"\nTotal sessions in database for user {test_user_id}: {len(all_sessions)}")
        
        active_sessions = [s for s in all_sessions if s.is_active]
        print(f"Active sessions: {len(active_sessions)}")
        
        inactive_sessions = [s for s in all_sessions if not s.is_active]
        print(f"Inactive sessions: {len(inactive_sessions)}")
        
        # Show details of active sessions
        if active_sessions:
            print("\nActive session details:")
            for i, session in enumerate(active_sessions, 1):
                print(f"  {i}. ID: {session.id}")
                print(f"     Device Key: {session.device_key}")
                print(f"     Created: {session.created_at}")
                print(f"     Last Accessed: {session.last_accessed}")
                print(f"     Expires: {session.expires_at}")
                print()
        
        print("=" * 50)
        print("Cleanup completed!")
        
    except Exception as e:
        print(f"Error during cleanup: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(cleanup_old_sessions())
