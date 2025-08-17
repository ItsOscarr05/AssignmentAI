# Session Management System

This document describes the production-ready session management system implemented in AssignmentAI.

## Overview

The session management system provides comprehensive tracking and management of user sessions across devices, including:

- Real-time session tracking
- Device fingerprinting
- Session analytics
- Security monitoring
- Session revocation capabilities

## Architecture

### Backend Components

#### 1. Database Model (`backend/app/models/session.py`)
```python
class UserSession(Base):
    __tablename__ = "user_sessions"
    
    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    device_info = Column(JSON, default={})
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_accessed = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    invalidated_at = Column(DateTime, nullable=True)
```

#### 2. CRUD Operations (`backend/app/crud/session.py`)
- `get_active_sessions_by_user()` - Get all active sessions for a user
- `create_session()` - Create a new session
- `invalidate_session()` - Revoke a specific session
- `invalidate_all_user_sessions()` - Revoke all sessions for a user
- `get_session_count_by_user()` - Get active session count
- `get_session_analytics()` - Get comprehensive session analytics

#### 3. API Endpoints (`backend/app/api/v1/endpoints/security.py`)
- `GET /api/v1/security/sessions` - Get user sessions
- `GET /api/v1/security/sessions/count` - Get active session count
- `DELETE /api/v1/security/sessions/{session_id}` - Revoke specific session
- `DELETE /api/v1/security/sessions` - Revoke all sessions
- `GET /api/v1/security/sessions/analytics` - Get session analytics

#### 4. Session Service (`backend/app/services/session_service.py`)
- Session lifecycle management
- Activity tracking
- Analytics collection
- Security monitoring

### Frontend Components

#### 1. Session Service (`frontend/src/services/sessionService.ts`)
```typescript
class SessionService {
  async getUserSessions(): Promise<SessionsResponse>
  async getActiveSessionCount(): Promise<SessionCountResponse>
  async revokeSession(sessionId: string): Promise<{ message: string }>
  async revokeAllSessions(): Promise<{ message: string }>
  async getSessionAnalytics(): Promise<SessionAnalytics>
}
```

#### 2. Settings Integration (`frontend/src/pages/Settings.tsx`)
- Real-time session count display
- Session management UI
- Security settings integration

## Features

### 1. Real-Time Session Tracking
- Automatic session creation on login
- Activity monitoring and last access updates
- Expiration management

### 2. Device Fingerprinting
- Browser detection
- Operating system identification
- Device type classification
- Location tracking (if enabled)

### 3. Security Features
- Session expiration policies
- Automatic cleanup of expired sessions
- Manual session revocation
- Bulk session management

### 4. Analytics
- Total session count
- Active session count
- Recent session activity
- Device type distribution
- Session duration tracking

## Usage

### Backend

#### Creating a Session
```python
from app.crud.session import session

# Create a new session
session_obj = session.create_session(
    db=db,
    user_id=user.id,
    device_info={
        "type": "desktop",
        "browser": "chrome",
        "os": "windows"
    },
    expires_in_days=30
)
```

#### Getting User Sessions
```python
# Get all active sessions for a user
active_sessions = session.get_active_sessions_by_user(db, user.id)

# Get session count
count = session.get_session_count_by_user(db, user.id)

# Get analytics
analytics = session.get_session_analytics(db, user.id)
```

#### Revoking Sessions
```python
# Revoke a specific session
success = session.invalidate_session(db, session_id)

# Revoke all sessions for a user
count = session.invalidate_all_user_sessions(db, user.id)
```

### Frontend

#### Loading Session Data
```typescript
import sessionService from '../services/sessionService';

// Load user sessions
const sessions = await sessionService.getUserSessions();

// Get active session count
const count = await sessionService.getActiveSessionCount();
```

#### Managing Sessions
```typescript
// Revoke a specific session
await sessionService.revokeSession(sessionId);

// Revoke all sessions
await sessionService.revokeAllSessions();
```

## Security Considerations

### 1. Session Expiration
- Sessions automatically expire after configurable time
- Expired sessions are automatically cleaned up
- Users are logged out when sessions expire

### 2. Access Control
- Users can only access their own sessions
- Session revocation requires user authentication
- Admin users can view all sessions (if implemented)

### 3. Data Privacy
- Device information is stored securely
- Session data is encrypted in transit
- Automatic cleanup prevents data accumulation

## Testing

### Backend Tests
```bash
# Run session CRUD tests
py -m pytest tests/test_session_crud.py -v

# Run all tests
py -m pytest tests -v
```

### Manual Testing
```bash
# Test session system manually
cd backend
python scripts/test_sessions.py
```

## Configuration

### Session Expiration
- Default: 30 days
- Configurable per session
- Automatic cleanup of expired sessions

### Device Fingerprinting
- Browser detection
- OS identification
- Device type classification
- Location tracking (optional)

### Analytics Retention
- Session data retained for analysis
- Automatic cleanup of old data
- Configurable retention policies

## Monitoring

### Metrics
- Active session count
- Session creation rate
- Session revocation rate
- Device type distribution

### Alerts
- Unusual session patterns
- Multiple sessions from same device
- Geographic anomalies
- Security violations

## Future Enhancements

### 1. Advanced Device Fingerprinting
- Canvas fingerprinting
- Audio fingerprinting
- Hardware fingerprinting

### 2. Machine Learning
- Anomaly detection
- Risk scoring
- Predictive analytics

### 3. Integration
- SIEM integration
- Security orchestration
- Compliance reporting

## Troubleshooting

### Common Issues

#### 1. Sessions Not Loading
- Check database connectivity
- Verify user authentication
- Check API endpoint availability

#### 2. Session Count Mismatch
- Verify session cleanup is running
- Check for expired sessions
- Validate session state consistency

#### 3. Performance Issues
- Monitor database query performance
- Check session cleanup frequency
- Optimize analytics queries

### Debug Commands
```bash
# Check session table
py -m pytest tests/test_session_crud.py::TestSessionCRUD::test_get_active_sessions_by_user -v

# Test session creation
py -m pytest tests/test_session_crud.py::TestSessionCRUD::test_create_session -v

# Verify cleanup
py -m pytest tests/test_session_crud.py::TestSessionCRUD::test_cleanup_expired_sessions -v
```

## Support

For issues or questions about the session management system:

1. Check the test files for examples
2. Review the API documentation
3. Check the database schema
4. Run the manual test script
5. Review the security logs

## Conclusion

The session management system provides a robust, secure, and scalable solution for tracking user sessions across devices. It integrates seamlessly with the existing security infrastructure and provides comprehensive analytics and management capabilities.
