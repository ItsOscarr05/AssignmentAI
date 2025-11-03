# OAuth Setup Guide - Google Authentication

## Overview

AssignmentAI now supports Google OAuth authentication. This guide will walk you through:

1. Setting up Google OAuth credentials
2. Configuring your application
3. Testing the OAuth flow
4. Troubleshooting common issues

## Prerequisites

- A Google Cloud Platform account
- Backend and Frontend running locally (or deployed)
- Python 3.8+ and Node.js 16+ installed

## Step 1: Create Google OAuth Credentials

### 1.1 Go to Google Cloud Console

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**

### 1.2 Configure OAuth Consent Screen

1. Click on **OAuth consent screen** in the left sidebar
2. Choose **External** user type (unless you have a Google Workspace account)
3. Fill in the required information:
   - **App name**: AssignmentAI
   - **User support email**: Your email
   - **Developer contact information**: Your email
4. Add scopes:
   - `openid`
   - `email`
   - `profile`
5. Add test users (your email addresses for testing)
6. Click **Save and Continue**

### 1.3 Create OAuth Credentials

1. Go back to **Credentials** tab
2. Click **Create Credentials** > **OAuth client ID**
3. Select **Web application**
4. Configure the settings:
   - **Name**: AssignmentAI Web Client
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (for development)
     - `http://localhost:8000` (for development)
     - Add your production domains when deploying
   - **Authorized redirect URIs**:
     - `http://localhost:8000/api/v1/auth/oauth/google/callback` (development)
     - `https://yourdomain.com/api/v1/auth/oauth/google/callback` (production)
5. Click **Create**
6. Copy the **Client ID** and **Client Secret**

## Step 2: Configure Backend Environment

### 2.1 Update Backend .env File

Create or update `backend/.env` with the following:

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here

# Backend URL (must match OAuth redirect URI)
BACKEND_URL=http://localhost:8000

# Frontend URL (for successful login redirects)
FRONTEND_URL=http://localhost:3000

# Redis Configuration (optional - falls back to in-memory storage)
REDIS_URL=redis://localhost:6379/0
```

### 2.2 Install Dependencies

Make sure you have the required dependencies:

```bash
cd backend
pip install authlib redis
```

## Step 3: Start the Application

### 3.1 Start Backend

```bash
cd backend
# Activate your virtual environment if using one
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

You should see:

- ✅ `Successfully connected to Redis` - if Redis is running
- ⚠️ `Using in-memory cache fallback - Redis not available` - if Redis is not running (this is fine for development)

### 3.2 Start Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend should be available at `http://localhost:3000`

## Step 4: Test OAuth Flow

### 4.1 Test Login with Google

1. Open your browser and go to `http://localhost:3000/login`
2. Click the **Google** button
3. You should be redirected to Google's login page
4. Sign in with your Google account (must be a test user you added)
5. Approve the consent screen
6. You should be redirected back to your application and logged in

### 4.2 What Happens Behind the Scenes

1. **User clicks "Google" button**

   - Frontend calls: `GET /api/v1/auth/oauth/google/authorize`
   - Backend generates a secure state token and stores it (Redis or in-memory)
   - Backend returns Google's authorization URL

2. **User authorizes on Google**

   - Google redirects to: `http://localhost:8000/api/v1/auth/oauth/google/callback?code=...&state=...`
   - Backend validates the state token
   - Backend exchanges the code for access tokens
   - Backend fetches user info from Google
   - Backend creates or updates user in database
   - Backend generates JWT token
   - Backend redirects to frontend with token

3. **Frontend receives token**
   - Frontend stores the JWT token
   - User is logged in and redirected to dashboard

## Step 5: Verify OAuth Setup

### 5.1 Check Backend Logs

You should see log messages like:

```
INFO:     Generated OAuth state: [random-state] for provider: google
INFO:     Stored OAuth state: [random-state] for provider: google
INFO:     Retrieved and deleted OAuth state: [random-state]
INFO:     127.0.0.1:xxxxx - "GET /api/v1/auth/oauth/google/callback HTTP/1.1" 200 OK
```

### 5.2 Check Database

After successful login, verify:

```sql
SELECT id, email, name, oauth_provider, is_verified
FROM users
WHERE oauth_provider = 'google';
```

You should see:

- User email from Google
- `oauth_provider` = 'google'
- `is_verified` = true

## Troubleshooting

### Error: "Failed to store OAuth state in Redis"

**Solution**: This means Redis is not running. The application will automatically fall back to in-memory storage. This is fine for development but not recommended for production.

To start Redis:

```bash
# Windows (if Redis is installed)
redis-server

# Docker
docker run -d -p 6379:6379 redis:latest

# Linux/Mac
sudo systemctl start redis
```

### Error: "Invalid state parameter"

**Possible causes**:

1. Redis restarted and lost the state token
2. State token expired (10 minutes timeout)
3. Backend restarted while using in-memory storage

**Solution**: Try logging in again. The state token is single-use and short-lived.

### Error: "Redirect URI mismatch"

**Solution**: Make sure the redirect URI in Google Cloud Console exactly matches:

```
http://localhost:8000/api/v1/auth/oauth/google/callback
```

### Error: "Access blocked: This app's request is invalid"

**Causes**:

1. OAuth consent screen not configured
2. Scopes not added
3. Test users not added

**Solution**:

1. Go to Google Cloud Console > OAuth consent screen
2. Add required scopes: `openid`, `email`, `profile`
3. Add your email as a test user

### Error: "OAuth callback failed"

**Check**:

1. Client ID and Secret are correct in `.env`
2. Backend and Frontend URLs are correct
3. Check backend logs for specific error messages

## Production Deployment

### Important Changes for Production

1. **Update OAuth Redirect URIs**:

   ```
   https://yourdomain.com/api/v1/auth/oauth/google/callback
   ```

2. **Update Environment Variables**:

   ```bash
   BACKEND_URL=https://api.yourdomain.com
   FRONTEND_URL=https://yourdomain.com
   ```

3. **Use Redis** (not in-memory cache):

   - Set up Redis server
   - Configure `REDIS_URL` properly
   - In-memory fallback is only for development

4. **Publish OAuth Consent Screen**:

   - Go to Google Cloud Console
   - Publish your app (remove "Testing" status)
   - Complete verification if needed

5. **Add Production Domains**:
   - Add all production domains to "Authorized JavaScript origins"
   - Add production callback URLs to "Authorized redirect URIs"

## Security Best Practices

1. **Never commit credentials**:

   - Keep `.env` files out of git
   - Use `.env.example` as template only

2. **Use HTTPS in production**:

   - OAuth requires HTTPS for security
   - Get SSL certificates (Let's Encrypt is free)

3. **Rotate secrets regularly**:

   - Change OAuth client secrets periodically
   - Update in all environments

4. **Monitor OAuth usage**:
   - Check Google Cloud Console for usage metrics
   - Set up alerts for suspicious activity

## Testing Checklist

- [ ] Google OAuth credentials created
- [ ] Backend `.env` configured with Client ID and Secret
- [ ] Backend running without errors
- [ ] Frontend running without errors
- [ ] "Sign in with Google" button appears on login page
- [ ] Clicking button redirects to Google login
- [ ] After Google login, redirected back to application
- [ ] User is logged in and sees dashboard
- [ ] User data stored in database with `oauth_provider = 'google'`
- [ ] User can logout and login again successfully

## Support

If you continue to have issues:

1. Check backend logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure Google Cloud Console configuration matches exactly
4. Test with a fresh browser/incognito window to avoid cache issues

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Authlib Documentation](https://docs.authlib.org/en/latest/)
- [FastAPI OAuth Guide](https://fastapi.tiangolo.com/advanced/security/)
