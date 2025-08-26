#!/usr/bin/env python3
"""
Test script to verify session deduplication logic
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

async def test_session_deduplication():
    """Test that sessions from the same device are deduplicated"""
    
    # Get database session
    db = next(get_db())
    
    try:
        session_service = get_session_service(db)
        
        # Test user ID (you may need to change this to an existing user)
        test_user_id = 1
        
        print(f"Testing session deduplication for user {test_user_id}")
        print("=" * 50)
        
        # Simulate device info for the same device
        device_info_1 = {
            "ip_address": "192.168.1.100",
            "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "device_fingerprint": "test_device_123"
        }
        
        device_info_2 = {
            "ip_address": "192.168.1.100",  # Same IP
            "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",  # Same user agent
            "device_fingerprint": "test_device_123"  # Same fingerprint
        }
        
        # Different device info
        device_info_3 = {
            "ip_address": "192.168.1.101",  # Different IP
            "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            "device_fingerprint": "test_device_456"
        }
        
        print("1. Creating first session...")
        session_id_1 = await session_service.create_session(test_user_id, device_info_1)
        print(f"   Created session: {session_id_1}")
        
        print("\n2. Creating second session with same device info...")
        session_id_2 = await session_service.create_session(test_user_id, device_info_2)
        print(f"   Result: {session_id_2}")
        
        if session_id_1 == session_id_2:
            print("   ✅ SUCCESS: Same device created same session (deduplication working)")
        else:
            print("   ❌ FAILED: Same device created different session")
        
        print("\n3. Creating third session with different device info...")
        session_id_3 = await session_service.create_session(test_user_id, device_info_3)
        print(f"   Created session: {session_id_3}")
        
        if session_id_3 != session_id_1:
            print("   ✅ SUCCESS: Different device created different session")
        else:
            print("   ❌ FAILED: Different device created same session")
        
        print("\n4. Checking active session count...")
        active_count = await session_service.get_active_session_count(test_user_id)
        print(f"   Active sessions: {active_count}")
        
        if active_count == 2:
            print("   ✅ SUCCESS: Correct count (1 per device)")
        else:
            print(f"   ❌ FAILED: Expected 2, got {active_count}")
        
        print("\n5. Getting user sessions...")
        sessions = await session_service.get_user_sessions(test_user_id)
        print(f"   Total sessions returned: {len(sessions)}")
        
        for i, session in enumerate(sessions, 1):
            print(f"   Session {i}: {session['id']} (Device: {session['device_key'][:8]}...)")
        
        print("\n6. Testing session validation...")
        valid_session = await session_service.validate_session(session_id_1)
        if valid_session:
            print("   ✅ SUCCESS: Session validation working")
        else:
            print("   ❌ FAILED: Session validation failed")
        
        print("\n7. Testing session invalidation...")
        success = await session_service.invalidate_session(session_id_1)
        if success:
            print("   ✅ SUCCESS: Session invalidation working")
        else:
            print("   ❌ FAILED: Session invalidation failed")
        
        print("\n8. Checking count after invalidation...")
        active_count_after = await session_service.get_active_session_count(test_user_id)
        print(f"   Active sessions after invalidation: {active_count_after}")
        
        print("\n" + "=" * 50)
        print("Session deduplication test completed!")
        
    except Exception as e:
        print(f"Error during testing: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(test_session_deduplication())
