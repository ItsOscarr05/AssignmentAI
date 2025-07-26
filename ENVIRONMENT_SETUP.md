# AssignmentAI Environment Setup Guide

## Table of Contents

1. [Overview](#overview)
2. [Environment Variables](#environment-variables)
3. [Security Configuration](#security-configuration)
4. [Database Configuration](#database-configuration)
5. [API Configuration](#api-configuration)
6. [Frontend Configuration](#frontend-configuration)
7. [Deployment Configuration](#deployment-configuration)
8. [Development Setup](#development-setup)
9. [Production Setup](#production-setup)
10. [Troubleshooting](#troubleshooting)

## Overview

This guide provides comprehensive instructions for configuring the AssignmentAI environment, including security settings, database connections, API endpoints, and deployment configurations.

### Prerequisites

- **Python 3.8+**: For backend services
- **Node.js 16+**: For frontend development
- **PostgreSQL 12+**: For database
- **Redis 6+**: For caching and sessions
- **Docker**: For containerized deployment (optional)

## Environment Variables

### Backend Environment Variables

#### Core Configuration

```bash
# Application Settings
APP_NAME=AssignmentAI
APP_VERSION=1.0.0
DEBUG=False
ENVIRONMENT=production
LOG_LEVEL=INFO

# Server Configuration
HOST=0.0.0.0
PORT=8000
WORKERS=4
RELOAD=False
```

#### Database Configuration

```bash
# PostgreSQL Database
DATABASE_URL=postgresql://username:password@localhost:5432/assignmentai
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=30
DATABASE_POOL_TIMEOUT=30
DATABASE_POOL_RECYCLE=3600

# Redis Configuration
REDIS_URL=redis://localhost:6379/0
REDIS_PASSWORD=your-redis-password
REDIS_DB=0
REDIS_MAX_CONNECTIONS=20
```

#### JWT Configuration

```bash
# JWT Settings
JWT_SECRET_KEY=your-super-secret-jwt-key-here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
JWT_ISSUER=assignmentai.com
JWT_AUDIENCE=assignmentai-users
```

#### Security Configuration

```bash
# Authentication Security
MAX_LOGIN_ATTEMPTS=5
LOGIN_ATTEMPT_WINDOW_MINUTES=15
ACCOUNT_LOCKOUT_DURATION_HOURS=24
PASSWORD_MIN_LENGTH=8
PASSWORD_REQUIRE_UPPERCASE=true
PASSWORD_REQUIRE_LOWERCASE=true
PASSWORD_REQUIRE_NUMBERS=true
PASSWORD_REQUIRE_SPECIAL_CHARS=true

# Session Management
SESSION_EXPIRE_DAYS=7
SESSION_CLEANUP_INTERVAL_HOURS=24
MAX_CONCURRENT_SESSIONS=5
SESSION_ACTIVITY_TIMEOUT_MINUTES=30

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW_MINUTES=1
RATE_LIMIT_BURST=10
```

#### 2FA Configuration

```bash
# Two-Factor Authentication
TOTP_DIGITS=6
TOTP_PERIOD=30
TOTP_WINDOW=1
BACKUP_CODES_COUNT=5
BACKUP_CODE_LENGTH=8
```

#### Email Configuration

```bash
# SMTP Settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_USE_TLS=true
SMTP_USE_SSL=false

# Email Templates
EMAIL_FROM=noreply@assignmentai.com
EMAIL_FROM_NAME=AssignmentAI
VERIFICATION_EMAIL_TEMPLATE=email_verification.html
PASSWORD_RESET_TEMPLATE=password_reset.html
```

#### File Upload Configuration

```bash
# File Upload Settings
MAX_FILE_SIZE_MB=10
UPLOAD_DIR=./uploads
ALLOWED_FILE_TYPES=image/jpeg,image/png,application/pdf,text/plain
ENABLE_FILE_SCANNING=true
VIRUS_SCAN_ENDPOINT=http://localhost:8080/scan
```

### Frontend Environment Variables

#### API Configuration

```bash
# API Endpoints
REACT_APP_API_BASE_URL=http://localhost:8000/api/v1
REACT_APP_API_TIMEOUT=30000
REACT_APP_API_RETRY_ATTEMPTS=3

# Authentication
REACT_APP_AUTH_ENDPOINT=/auth
REACT_APP_REFRESH_ENDPOINT=/auth/refresh
REACT_APP_LOGOUT_ENDPOINT=/auth/logout
```

#### Security Configuration

```bash
# Security Settings
REACT_APP_ENABLE_CSRF=true
REACT_APP_CSRF_ENDPOINT=/auth/csrf-token
REACT_APP_ENABLE_RATE_LIMITING=true
REACT_APP_MAX_LOGIN_ATTEMPTS=5

# Token Management
REACT_APP_TOKEN_REFRESH_THRESHOLD=300000
REACT_APP_TOKEN_STORAGE_KEY=access_token
REACT_APP_REFRESH_TOKEN_KEY=refresh_token
```

#### Feature Flags

```bash
# Feature Configuration
REACT_APP_ENABLE_2FA=true
REACT_APP_ENABLE_SESSION_MANAGEMENT=true
REACT_APP_ENABLE_SECURITY_MONITORING=true
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_DEBUG_MODE=false
```

## Security Configuration

### CORS Configuration

```python
# Backend CORS Settings
CORS_ORIGINS=[
    "http://localhost:3000",
    "https://assignmentai.com",
    "https://www.assignmentai.com"
]
CORS_ALLOW_CREDENTIALS=true
CORS_ALLOW_METHODS=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
CORS_ALLOW_HEADERS=["*"]
CORS_EXPOSE_HEADERS=["X-Total-Count"]
```

### Security Headers

```python
# Security Headers Configuration
SECURITY_HEADERS={
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()"
}
```

### Content Security Policy

```javascript
// Frontend CSP Configuration
const cspConfig = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'https:'],
  'font-src': ["'self'", 'https:'],
  'connect-src': ["'self'", 'https:'],
  'frame-src': ["'none'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
};
```

## Database Configuration

### PostgreSQL Setup

```sql
-- Database Creation
CREATE DATABASE assignmentai;
CREATE USER assignmentai_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE assignmentai TO assignmentai_user;

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### Database Migrations

```bash
# Run migrations
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "description"

# Rollback migration
alembic downgrade -1
```

### Redis Configuration

```bash
# Redis Configuration File (redis.conf)
bind 127.0.0.1
port 6379
requirepass your-redis-password
maxmemory 256mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

## API Configuration

### Endpoint Configuration

```python
# API Routes Configuration
API_V1_STR="/api/v1"
PROJECT_NAME="AssignmentAI"
VERSION="1.0.0"
DESCRIPTION="AssignmentAI API Documentation"

# Rate Limiting
RATE_LIMIT_DEFAULT="100/minute"
RATE_LIMIT_AUTH="5/15minutes"
RATE_LIMIT_UPLOAD="10/hour"
```

### Authentication Endpoints

```python
# Auth Endpoints
AUTH_ENDPOINTS={
    "login": "/auth/login",
    "register": "/auth/register",
    "logout": "/auth/logout",
    "refresh": "/auth/refresh",
    "verify_email": "/auth/verify-email",
    "forgot_password": "/auth/forgot-password",
    "reset_password": "/auth/reset-password",
    "2fa_setup": "/auth/2fa/setup",
    "2fa_verify": "/auth/2fa/verify",
    "2fa_disable": "/auth/2fa/disable",
    "sessions": "/auth/sessions",
    "logout_all": "/auth/logout-all"
}
```

## Frontend Configuration

### Build Configuration

```javascript
// webpack.config.js
module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: '[name].[contenthash].js',
    publicPath: '/',
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  },
};
```

### Environment-Specific Configs

```javascript
// config/environment.ts
const environments = {
  development: {
    apiUrl: 'http://localhost:8000/api/v1',
    enableDebug: true,
    enableMockApi: true,
  },
  staging: {
    apiUrl: 'https://staging-api.assignmentai.com/api/v1',
    enableDebug: false,
    enableMockApi: false,
  },
  production: {
    apiUrl: 'https://api.assignmentai.com/api/v1',
    enableDebug: false,
    enableMockApi: false,
  },
};
```

## Deployment Configuration

### Docker Configuration

```dockerfile
# Backend Dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```dockerfile
# Frontend Dockerfile
FROM node:16-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - '8000:8000'
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/assignmentai
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis

  frontend:
    build: ./frontend
    ports:
      - '3000:80'
    depends_on:
      - backend

  db:
    image: postgres:13
    environment:
      - POSTGRES_DB=assignmentai
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:6-alpine
    command: redis-server --requirepass your-redis-password
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Nginx Configuration

```nginx
# nginx.conf
server {
    listen 80;
    server_name assignmentai.com;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;

    # Frontend
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Development Setup

### Local Development Environment

```bash
# Clone repository
git clone https://github.com/your-org/assignmentai.git
cd assignmentai

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Database setup
createdb assignmentai_dev
alembic upgrade head

# Frontend setup
cd ../frontend
npm install
npm start
```

### Environment Files

```bash
# .env.development
DEBUG=True
DATABASE_URL=postgresql://localhost:5432/assignmentai_dev
REDIS_URL=redis://localhost:6379/1
JWT_SECRET_KEY=dev-secret-key
ENABLE_MOCK_API=true
```

### Development Tools

```json
// package.json scripts
{
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "cd backend && uvicorn app.main:app --reload",
    "dev:frontend": "react-scripts start",
    "test": "npm run test:backend && npm run test:frontend",
    "test:backend": "cd backend && pytest",
    "test:frontend": "react-scripts test",
    "build": "react-scripts build",
    "lint": "eslint src --ext .ts,.tsx",
    "format": "prettier --write src/**/*.{ts,tsx}"
  }
}
```

## Production Setup

### Production Environment

```bash
# .env.production
DEBUG=False
DATABASE_URL=postgresql://prod_user:secure_pass@prod-db:5432/assignmentai
REDIS_URL=redis://prod-redis:6379/0
JWT_SECRET_KEY=your-super-secure-production-key
ENABLE_MOCK_API=false
LOG_LEVEL=WARNING
```

### SSL/TLS Configuration

```nginx
# SSL configuration
server {
    listen 443 ssl http2;
    server_name assignmentai.com;

    ssl_certificate /etc/ssl/certs/assignmentai.crt;
    ssl_certificate_key /etc/ssl/private/assignmentai.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}
```

### Monitoring Configuration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'assignmentai-backend'
    static_configs:
      - targets: ['localhost:8000']
    metrics_path: '/metrics'

  - job_name: 'assignmentai-frontend'
    static_configs:
      - targets: ['localhost:3000']
```

## Troubleshooting

### Common Issues

#### Database Connection Issues

```bash
# Check database connectivity
psql -h localhost -U username -d assignmentai

# Check connection pool
SELECT * FROM pg_stat_activity WHERE datname = 'assignmentai';

# Reset connection pool
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'assignmentai';
```

#### Redis Connection Issues

```bash
# Test Redis connection
redis-cli ping

# Check Redis memory usage
redis-cli info memory

# Clear Redis cache
redis-cli flushall
```

#### JWT Token Issues

```bash
# Verify JWT secret
echo $JWT_SECRET_KEY

# Check token expiration
jwt decode <token>

# Regenerate JWT secret
openssl rand -hex 32
```

#### Rate Limiting Issues

```bash
# Check rate limit status
curl -H "X-RateLimit-Remaining: 0" http://localhost:8000/api/v1/auth/login

# Reset rate limits (Redis)
redis-cli del "rate_limit:login:127.0.0.1"
```

### Log Analysis

```bash
# Backend logs
tail -f logs/backend.log | grep ERROR

# Frontend logs
tail -f logs/frontend.log | grep "Failed to fetch"

# Database logs
tail -f /var/log/postgresql/postgresql-13-main.log
```

### Performance Monitoring

```bash
# Check API response times
curl -w "@curl-format.txt" -o /dev/null -s "http://localhost:8000/api/v1/health"

# Monitor database performance
SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;

# Check memory usage
free -h
htop
```

---

**Last Updated**: December 2024
**Version**: 1.0
**Next Review**: March 2025

For additional support, contact the development team at dev@assignmentai.com
