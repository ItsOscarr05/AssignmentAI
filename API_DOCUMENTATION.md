# AssignmentAI API Documentation

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Base URL and Headers](#base-url-and-headers)
4. [Error Handling](#error-handling)
5. [Authentication Endpoints](#authentication-endpoints)
6. [Two-Factor Authentication](#two-factor-authentication)
7. [Session Management](#session-management)
8. [User Management](#user-management)
9. [Rate Limiting](#rate-limiting)
10. [Webhooks](#webhooks)

## Overview

The AssignmentAI API provides secure authentication and user management capabilities. All endpoints return JSON responses and use standard HTTP status codes.

### API Version

- **Current Version**: v1
- **Base URL**: `https://api.assignmentai.com/api/v1`
- **Content Type**: `application/json`

### Authentication Methods

- **Bearer Token**: JWT tokens for authenticated requests
- **API Key**: For service-to-service communication
- **Session Token**: For web-based authentication

## Authentication

### JWT Token Authentication

Most endpoints require authentication using JWT Bearer tokens.

```http
Authorization: Bearer <access_token>
```

### Token Types

- **Access Token**: Short-lived (15 minutes) for API requests
- **Refresh Token**: Long-lived (7 days) for token renewal
- **Session Token**: For web session management

### Token Refresh

When access tokens expire, use the refresh token to get a new one:

```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refresh_token": "your-refresh-token"
}
```

## Base URL and Headers

### Base URL

```
https://api.assignmentai.com/api/v1
```

### Required Headers

```http
Content-Type: application/json
Accept: application/json
User-Agent: AssignmentAI-Client/1.0
```

### Optional Headers

```http
X-Request-ID: unique-request-id
X-Client-Version: 1.0.0
X-Device-ID: device-identifier
```

## Error Handling

### Error Response Format

All errors follow a consistent format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional error details"
    },
    "timestamp": "2024-12-01T10:30:00Z",
    "request_id": "req_123456789"
  }
}
```

### HTTP Status Codes

- **200**: Success
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **422**: Validation Error
- **429**: Rate Limited
- **500**: Internal Server Error

### Common Error Codes

```json
{
  "AUTH_INVALID_CREDENTIALS": "Invalid email or password",
  "AUTH_ACCOUNT_LOCKED": "Account temporarily locked",
  "AUTH_TOKEN_EXPIRED": "Access token has expired",
  "AUTH_TOKEN_INVALID": "Invalid or malformed token",
  "AUTH_2FA_REQUIRED": "Two-factor authentication required",
  "AUTH_2FA_INVALID": "Invalid 2FA code",
  "RATE_LIMIT_EXCEEDED": "Too many requests",
  "VALIDATION_ERROR": "Request validation failed",
  "PERMISSION_DENIED": "Insufficient permissions"
}
```

## Authentication Endpoints

### Login

#### POST /auth/login

Authenticate a user with email and password.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "device_info": {
    "user_agent": "Mozilla/5.0...",
    "ip_address": "192.168.1.1",
    "device_type": "desktop"
  }
}
```

**Response (No 2FA):**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 900,
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "is_verified": true,
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z"
  },
  "requires_2fa": false
}
```

**Response (2FA Required):**

```json
{
  "requires_2fa": true,
  "temp_token": "temp_token_for_2fa_verification",
  "message": "Two-factor authentication required"
}
```

### Register

#### POST /auth/register

Register a new user account.

**Request:**

```json
{
  "email": "newuser@example.com",
  "password": "SecurePassword123!",
  "name": "New User",
  "accept_terms": true,
  "device_info": {
    "user_agent": "Mozilla/5.0...",
    "ip_address": "192.168.1.1"
  }
}
```

**Response:**

```json
{
  "message": "Registration successful. Please verify your email.",
  "user_id": "user_456",
  "verification_required": true
}
```

### Logout

#### POST /auth/logout

Logout the current user and invalidate the session.

**Request:**

```json
{
  "session_id": "session_789"
}
```

**Response:**

```json
{
  "message": "Successfully logged out",
  "session_revoked": true
}
```

### Logout All Sessions

#### POST /auth/logout-all

Logout from all active sessions except the current one.

**Response:**

```json
{
  "message": "Successfully logged out from all sessions",
  "sessions_revoked": 3,
  "current_session_id": "session_789"
}
```

### Refresh Token

#### POST /auth/refresh

Refresh an expired access token.

**Request:**

```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 900
}
```

### Forgot Password

#### POST /auth/forgot-password

Request a password reset email.

**Request:**

```json
{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "message": "Password reset email sent",
  "email_sent": true
}
```

### Reset Password

#### POST /auth/reset-password

Reset password using a reset token.

**Request:**

```json
{
  "token": "reset_token_123",
  "new_password": "NewSecurePassword123!"
}
```

**Response:**

```json
{
  "message": "Password successfully reset",
  "password_changed": true
}
```

## Two-Factor Authentication

### Setup 2FA

#### POST /auth/2fa/setup

Initialize two-factor authentication setup.

**Response:**

```json
{
  "qr_code": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "secret": "JBSWY3DPEHPK3PXP",
  "backup_codes": ["ABC12345", "DEF67890", "GHI11111", "JKL22222", "MNO33333"],
  "setup_complete": false
}
```

### Verify 2FA Setup

#### POST /auth/2fa/verify-setup

Verify 2FA setup with a test code.

**Request:**

```json
{
  "code": "123456"
}
```

**Response:**

```json
{
  "message": "2FA setup verified successfully",
  "setup_complete": true,
  "backup_codes": ["ABC12345", "DEF67890", "GHI11111", "JKL22222", "MNO33333"]
}
```

### Verify 2FA Code

#### POST /auth/verify-2fa

Verify 2FA code during login.

**Request:**

```json
{
  "code": "123456",
  "temp_token": "temp_token_from_login",
  "is_backup_code": false
}
```

**Response:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 900,
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "is_verified": true,
    "is_active": true
  }
}
```

### Get 2FA Status

#### GET /auth/2fa/status

Get current 2FA status for the user.

**Response:**

```json
{
  "enabled": true,
  "setup_date": "2024-01-01T00:00:00Z",
  "last_used": "2024-12-01T10:30:00Z",
  "backup_codes_remaining": 5
}
```

### Disable 2FA

#### POST /auth/2fa/disable

Disable two-factor authentication.

**Request:**

```json
{
  "password": "current_password"
}
```

**Response:**

```json
{
  "message": "2FA disabled successfully",
  "disabled": true
}
```

### Regenerate Backup Codes

#### POST /auth/2fa/regenerate-backup-codes

Generate new backup codes.

**Response:**

```json
{
  "message": "Backup codes regenerated",
  "backup_codes": ["XYZ11111", "ABC22222", "DEF33333", "GHI44444", "JKL55555"]
}
```

## Session Management

### Get Active Sessions

#### GET /auth/sessions

Get all active sessions for the current user.

**Response:**

```json
{
  "sessions": [
    {
      "id": "session_123",
      "device_info": {
        "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "ip_address": "192.168.1.1",
        "device_type": "desktop",
        "browser": "Chrome",
        "os": "Windows"
      },
      "created_at": "2024-12-01T09:00:00Z",
      "last_accessed": "2024-12-01T10:30:00Z",
      "expires_at": "2024-12-08T09:00:00Z",
      "is_current": true,
      "location": {
        "country": "United States",
        "city": "New York",
        "ip": "192.168.1.1"
      }
    }
  ],
  "total_sessions": 1,
  "max_sessions": 5
}
```

### Revoke Session

#### DELETE /auth/sessions/{session_id}

Revoke a specific session.

**Response:**

```json
{
  "message": "Session revoked successfully",
  "session_id": "session_123",
  "revoked": true
}
```

### Get Session Analytics

#### GET /auth/sessions/analytics

Get analytics for user sessions.

**Response:**

```json
{
  "total_sessions": 15,
  "active_sessions": 3,
  "sessions_by_device": {
    "desktop": 8,
    "mobile": 5,
    "tablet": 2
  },
  "sessions_by_location": {
    "United States": 10,
    "Canada": 3,
    "United Kingdom": 2
  },
  "average_session_duration": 3600,
  "last_30_days": {
    "new_sessions": 5,
    "revoked_sessions": 2
  }
}
```

### Track Session Activity

#### POST /auth/sessions/{session_id}/activity

Track activity for a specific session.

**Request:**

```json
{
  "activity_type": "page_view",
  "page": "/dashboard",
  "timestamp": "2024-12-01T10:30:00Z"
}
```

**Response:**

```json
{
  "message": "Activity tracked",
  "session_id": "session_123",
  "activity_recorded": true
}
```

## User Management

### Get Current User

#### GET /auth/me

Get current user information.

**Response:**

```json
{
  "id": "user_123",
  "email": "user@example.com",
  "name": "John Doe",
  "is_verified": true,
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-12-01T10:30:00Z",
  "last_login": "2024-12-01T10:30:00Z",
  "preferences": {
    "timezone": "America/New_York",
    "language": "en",
    "notifications": {
      "email": true,
      "push": false
    }
  }
}
```

### Update User Profile

#### PUT /auth/me

Update current user profile.

**Request:**

```json
{
  "name": "John Smith",
  "preferences": {
    "timezone": "America/Los_Angeles",
    "language": "es"
  }
}
```

**Response:**

```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Smith",
    "updated_at": "2024-12-01T10:35:00Z"
  }
}
```

### Change Password

#### POST /auth/change-password

Change user password.

**Request:**

```json
{
  "current_password": "OldPassword123!",
  "new_password": "NewPassword456!"
}
```

**Response:**

```json
{
  "message": "Password changed successfully",
  "password_changed": true,
  "sessions_revoked": 2
}
```

### Delete Account

#### DELETE /auth/me

Delete current user account.

**Request:**

```json
{
  "password": "current_password",
  "confirmation": "DELETE"
}
```

**Response:**

```json
{
  "message": "Account deleted successfully",
  "account_deleted": true
}
```

## Rate Limiting

### Rate Limit Headers

All API responses include rate limit headers:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
X-RateLimit-Window: 60
```

### Rate Limit Rules

- **General Endpoints**: 100 requests per minute
- **Authentication Endpoints**: 5 requests per 15 minutes
- **File Upload**: 10 requests per hour
- **2FA Endpoints**: 10 requests per 5 minutes

### Rate Limit Exceeded Response

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 60 seconds.",
    "details": {
      "retry_after": 60,
      "limit": 100,
      "window": 60
    }
  }
}
```

## Webhooks

### Webhook Events

The API can send webhooks for various events:

```json
{
  "event": "user.login",
  "timestamp": "2024-12-01T10:30:00Z",
  "data": {
    "user_id": "user_123",
    "email": "user@example.com",
    "ip_address": "192.168.1.1",
    "device_info": {
      "user_agent": "Mozilla/5.0...",
      "device_type": "desktop"
    }
  }
}
```

### Available Events

- `user.registered`: New user registration
- `user.login`: User login
- `user.logout`: User logout
- `user.password_changed`: Password change
- `user.2fa_enabled`: 2FA enabled
- `user.2fa_disabled`: 2FA disabled
- `session.created`: New session created
- `session.revoked`: Session revoked
- `security.alert`: Security alert triggered

### Webhook Configuration

```json
{
  "url": "https://your-app.com/webhooks",
  "events": ["user.login", "user.logout"],
  "secret": "webhook_secret_key",
  "active": true
}
```

---

**Last Updated**: December 2024
**Version**: 1.0
**Next Review**: March 2025

For API support, contact api@assignmentai.com
