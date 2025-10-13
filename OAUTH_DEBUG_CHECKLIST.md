# OAuth 400 Bad Request - Debug Checklist

## Quick Debug Steps

### 1. Check Your Environment Variables
Open your `backend/.env` file and verify:

```bash
# These MUST be set with real values from Google Cloud Console
GOOGLE_CLIENT_ID=123456789-abcdefghijk.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijk123456789
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
```

**Common Issues:**
- ❌ Missing quotes around values
- ❌ Extra spaces or characters
- ❌ Using placeholder text instead of real credentials
- ❌ Wrong Client ID format (must end with `.apps.googleusercontent.com`)

### 2. Verify Google Cloud Console Setup

Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials):

#### A. OAuth Consent Screen
1. Go to **APIs & Services** > **OAuth consent screen**
2. Make sure it's configured with:
   - **App name**: AssignmentAI
   - **Scopes**: `openid`, `email`, `profile`
   - **Test users**: Add your email address
3. Status should be "Testing" (not "Published" yet)

#### B. OAuth Client Credentials
1. Go to **APIs & Services** > **Credentials**
2. Click on your OAuth 2.0 Client ID
3. Verify **Authorized redirect URIs** includes:
   ```
   http://localhost:8000/api/v1/auth/oauth/google/callback
   ```
4. Verify **Authorized JavaScript origins** includes:
   ```
   http://localhost:8000
   http://localhost:3000
   ```

### 3. Test the OAuth URL Generation

Let's check what URL is being generated. Add some debug logging:
