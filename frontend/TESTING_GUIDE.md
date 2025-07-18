# Authentication Flow Testing Guide

## Quick Start Testing

### 1. Manual Testing (Recommended for quick verification)

#### Prerequisites

- Backend running on `http://localhost:8000`
- Frontend running on `http://localhost:3000`

#### Test Registration Flow

1. Navigate to `http://localhost:3000/register`
2. Fill out the form:
   - First Name: `Test`
   - Last Name: `User`
   - Email: `test@example.com`
   - Password: `password123`
   - Confirm Password: `password123`
3. Click "Register"
4. **Expected**: Success message appears, redirects to login after 2 seconds

#### Test Login Flow

1. On login page, enter:
   - Email: `test@example.com`
   - Password: `password123`
2. Click "Sign In"
3. **Expected**: Redirects to dashboard

#### Test OAuth Buttons

1. On registration page, click "Google" button
2. **Expected**: Redirects to `https://api.assignmentai.app/api/auth/google/login`
3. Click "GitHub" button
4. **Expected**: Redirects to `https://api.assignmentai.app/api/auth/github/login`

### 2. Browser Developer Tools Testing

#### Check Network Requests

1. Open DevTools (F12) → Network tab
2. Perform registration/login
3. Verify these requests:
   - `POST /api/v1/auth/register` with `{ email, password, full_name }`
   - `POST /api/v1/auth/login` with `{ username: email, password }`
   - `GET /api/v1/auth/me` (after login)

#### Check Local Storage

1. After successful login, check localStorage:
   - `token`: JWT token
   - `user`: User data object
   - `isMockUser`: "false"

### 3. Automated Testing

#### Run Basic Tests (Fast)

```bash
cd frontend
npx vitest run src/__tests__/components/AuthFlowBasic.test.tsx --reporter=verbose
```

#### Run Full Tests (Comprehensive)

```bash
cd frontend
# Windows PowerShell
.\scripts\test-auth.ps1

# Linux/Mac/Node.js
node scripts/test-auth.js
```

#### Run All Tests

```bash
cd frontend
npx vitest run
```

### 4. API Testing with Postman/Insomnia

1. Import collection: `tests/api/auth-tests.json`
2. Set environment variables:
   - `baseUrl`: `http://localhost:8000`
   - `accessToken`: (will be set after login)
3. Run requests in order:
   - Register User
   - Login User (copy token to `accessToken` variable)
   - Get Current User
   - Logout User

### 5. End-to-End Testing with Cypress

```bash
cd frontend

# Run Cypress tests
npx cypress run --spec "cypress/e2e/auth-flow.cy.ts"

# Or open Cypress UI
npx cypress open
```

## Expected Test Results

### ✅ Successful Registration

- Form validation works
- Success message: "Registration successful! Please log in with your credentials."
- Redirects to login page after 2 seconds
- No user state set (security best practice)

### ✅ Successful Login

- Form validation works
- API calls use correct format (`username: email, password`)
- User data fetched after login
- Token stored in localStorage
- Redirects to dashboard

### ✅ OAuth Integration

- Google button redirects to `/api/auth/google/login`
- GitHub button redirects to `/api/auth/github/login`
- Uses correct production URLs in production

### ✅ Error Handling

- Validation errors display properly
- API errors show user-friendly messages
- Network errors handled gracefully

## Troubleshooting

### Tests Failing with "act() is not supported"

This happens when React runs in production mode. Solutions:

1. Ensure `NODE_ENV=development` is set
2. Run tests with the provided scripts
3. Check vitest configuration in `vite.config.ts`

### OAuth Buttons Not Working

1. Check `VITE_API_URL` environment variable
2. Verify backend is running
3. Check browser console for errors

### Login Not Working

1. Verify backend login endpoint expects `username` field (not `email`)
2. Check API format in Network tab
3. Verify token is being stored in localStorage

### Registration Not Working

1. Check backend expects `full_name` field (not `firstName`/`lastName`)
2. Verify API format in Network tab
3. Check for validation errors

## Environment Variables

### Development

```env
VITE_API_URL=http://localhost:8000
NODE_ENV=development
```

### Production

```env
VITE_API_URL=https://api.assignmentai.app
NODE_ENV=production
```

## API Endpoints

### Registration

- **URL**: `POST /api/v1/auth/register`
- **Body**: `{ email, password, full_name }`
- **Response**: `{ message: "User registered successfully" }`

### Login

- **URL**: `POST /api/v1/auth/login`
- **Body**: `{ username: email, password }` (form-encoded)
- **Response**: `{ access_token, token_type, expires_in, requires_2fa }`

### Get Current User

- **URL**: `GET /api/v1/auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ id, email, full_name, role, is_active, is_verified }`

### Logout

- **URL**: `POST /api/v1/auth/logout`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ message: "Successfully logged out" }`

## Common Issues and Solutions

### Issue: "Invalid credentials" on login

**Solution**: Check that the user was registered successfully and the password is correct.

### Issue: "Email already registered" on registration

**Solution**: Use a different email address or delete the existing user from the database.

### Issue: OAuth buttons redirect to localhost

**Solution**: Check that `VITE_API_URL` is set to the production URL in production environment.

### Issue: Tests fail with React production mode errors

**Solution**: Ensure tests run with `NODE_ENV=development` and use the provided test scripts.
