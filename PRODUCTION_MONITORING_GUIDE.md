# AssignmentAI Production Monitoring & Emergency Response Guide

## Overview

This comprehensive guide covers production monitoring, emergency response systems, and authentication deployment for AssignmentAI. These tools help ensure your production environment remains healthy and provide quick response capabilities during incidents.

## Table of Contents

1. [Production Monitoring](#production-monitoring)
2. [Emergency Response](#emergency-response)
3. [Authentication Deployment](#authentication-deployment)
4. [Quick Reference](#quick-reference)
5. [Troubleshooting](#troubleshooting)

## Production Monitoring

### Monitoring Script: `scripts/monitor-production.ps1`

The production monitoring script provides comprehensive health checks and automated alerting for your AssignmentAI deployment.

#### Features

- **Health Endpoint Monitoring**: Checks frontend, API, and monitoring dashboards
- **Docker Service Status**: Verifies all containers are running
- **System Resource Monitoring**: CPU, memory, and disk usage
- **Database Backup Verification**: Ensures backups are recent
- **SSL Certificate Monitoring**: Checks certificate expiration
- **Email Alerts**: Sends alerts for critical issues

#### Usage

```powershell
# Basic monitoring
.\scripts\monitor-production.ps1

# Silent mode (no console output, only alerts)
.\scripts\monitor-production.ps1 -Silent

# With email alerts
.\scripts\monitor-production.ps1 -EmailAlerts

# Custom config file
.\scripts\monitor-production.ps1 -ConfigFile ".env.production"
```

#### Configuration

Add these environment variables to your `.env.production`:

```bash
# Alert email configuration
ALERT_EMAIL=admin@assignmentai.app
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@assignmentai.app
SMTP_PASSWORD=your-smtp-password
```

#### Monitoring Thresholds

The script uses these default thresholds (configurable in the script):

- **CPU Usage**: 80%
- **Memory Usage**: 85%
- **Disk Usage**: 90%
- **Response Time**: 5 seconds

#### Automated Monitoring Setup

**Windows Task Scheduler:**

```powershell
# Create scheduled task to run every 5 minutes
schtasks /create /tn "AssignmentAI-Monitoring" /tr "powershell -File 'C:\path\to\scripts\monitor-production.ps1 -Silent -EmailAlerts'" /sc minute /mo 5 /ru "SYSTEM"

# Create scheduled task to run every hour
schtasks /create /tn "AssignmentAI-Monitoring-Hourly" /tr "powershell -File 'C:\path\to\scripts\monitor-production.ps1 -EmailAlerts'" /sc hourly /ru "SYSTEM"
```

**Linux Cron (if using WSL):**

```bash
# Add to crontab -e
*/5 * * * * /usr/bin/powershell -File /path/to/scripts/monitor-production.ps1 -Silent -EmailAlerts
0 * * * * /usr/bin/powershell -File /path/to/scripts/monitor-production.ps1 -EmailAlerts
```

#### Sample Output

```
[2024-01-15 14:30:00] Starting AssignmentAI production monitoring...
[2024-01-15 14:30:01] Testing health endpoints...
[2024-01-15 14:30:02] Frontend is healthy (245ms)
[2024-01-15 14:30:03] API is healthy (189ms)
[2024-01-15 14:30:04] Monitoring is healthy (156ms)
[2024-01-15 14:30:05] Checking Docker services...
[2024-01-15 14:30:06] All Docker services are running
[2024-01-15 14:30:07] Checking system resources...
[2024-01-15 14:30:08] CPU Usage: 23.45%
[2024-01-15 14:30:09] Memory Usage: 67.89%
[2024-01-15 14:30:10] Disk Usage: 45.67%
[2024-01-15 14:30:11] Checking database backup...
[2024-01-15 14:30:12] Database backup is recent (2.3 hours ago)
[2024-01-15 14:30:13] Checking SSL certificates...
[2024-01-15 14:30:14] SSL Certificate expires in 45 days
[2024-01-15 14:30:15] Monitoring completed at 2024-01-15 14:30:15
[2024-01-15 14:30:16] All checks passed - system is healthy
```

## Emergency Response

### Emergency Commands (Copy & Paste)

#### Quick Health Check

```powershell
# Check all services
docker-compose -f docker-compose.prod.yml ps

# Test health endpoints
curl https://assignmentai.app/health
curl https://api.assignmentai.app/health
```

#### Emergency Actions

```powershell
# Enable maintenance mode
.\scripts\emergency-response.ps1 -Action maintenance

# Create emergency backup
.\scripts\emergency-response.ps1 -Action backup

# Restart all services
.\scripts\emergency-response.ps1 -Action restart

# Rollback deployment
.\scripts\emergency-response.ps1 -Action rollback

# Handle security incident
.\scripts\emergency-response.ps1 -Action security
```

### Incident Response Steps

1. **Assess the Situation**

   - Run quick health check: `.\scripts\monitor-production.ps1`
   - Identify affected services
   - Determine severity level

2. **Immediate Actions**

   - Enable maintenance mode if needed
   - Create emergency backup
   - Notify stakeholders

3. **Investigation**

   - Check service logs
   - Review monitoring data
   - Identify root cause

4. **Resolution**

   - Apply fixes
   - Restart services if needed
   - Verify recovery

5. **Post-Incident**
   - Document incident
   - Update procedures
   - Schedule review meeting

## Authentication Deployment

### Pre-Deployment Checklist

#### Backend Configuration

- [ ] **API Endpoints**: All authentication endpoints are implemented and working

  - [ ] `/api/v1/auth/login` - User login with rate limiting
  - [ ] `/api/v1/auth/register` - User registration with email verification
  - [ ] `/api/v1/auth/forgot-password` - Password reset request
  - [ ] `/api/v1/auth/reset-password` - Password reset confirmation
  - [ ] `/api/v1/auth/logout` - User logout with session management
  - [ ] `/api/v1/auth/me` - Get current user information

- [ ] **Security Features**: All security measures are in place

  - [ ] Password hashing with bcrypt
  - [ ] JWT token management
  - [ ] Rate limiting on login attempts
  - [ ] Session management
  - [ ] CSRF protection
  - [ ] Input validation and sanitization

- [ ] **Email Service**: Email functionality is configured

  - [ ] Password reset emails (currently logging for development)
  - [ ] Email verification (currently logging for development)
  - [ ] Production email service configured (SMTP, SendGrid, etc.)

- [ ] **Database**: Database is properly configured
  - [ ] User table with all required fields
  - [ ] Session table for session management
  - [ ] Database migrations applied
  - [ ] Database connection string configured

#### Frontend Configuration

- [ ] **API Integration**: All API calls are properly configured

  - [ ] Standardized API base URL: `http://localhost:8000` (dev) / `https://api.assignmentai.app` (prod)
  - [ ] All auth endpoints use correct paths (`/api/v1/auth/*`)
  - [ ] Error handling implemented for all API calls
  - [ ] Token management (storage, refresh, cleanup)

- [ ] **Components**: All authentication components are implemented

  - [ ] Login page with form validation
  - [ ] Register page with comprehensive validation
  - [ ] Forgot password page with email validation
  - [ ] Reset password page with token validation
  - [ ] Error handling and user feedback

- [ ] **Routing**: All routes are properly configured
  - [ ] `/login` - Login page
  - [ ] `/register` - Registration page
  - [ ] `/forgot-password` - Forgot password page
  - [ ] `/reset-password` - Reset password page
  - [ ] Protected routes redirect to login when not authenticated

#### Environment Configuration

- [ ] **Development Environment**:

  - [ ] `VITE_API_URL=http://localhost:8000` in `.env`
  - [ ] Backend running on port 8000
  - [ ] Database connection configured

- [ ] **Production Environment**:
  - [ ] `VITE_API_URL=https://api.assignmentai.app` in `.env.production`
  - [ ] SSL certificates configured
  - [ ] Domain and DNS configured
  - [ ] CDN configured (if applicable)

#### Testing

- [ ] **Manual Testing**:

  - [ ] User registration flow
  - [ ] User login flow
  - [ ] Password reset flow
  - [ ] Logout functionality
  - [ ] Session management
  - [ ] Error handling

- [ ] **Automated Testing**:
  - [ ] Run authentication test script: `node scripts/test-auth.js`
  - [ ] All tests pass
  - [ ] Frontend unit tests pass
  - [ ] Backend unit tests pass

### Deployment Steps

#### 1. Backend Deployment

```bash
# 1. Set up production environment
cp backend/.env.example backend/.env.production
# Edit backend/.env.production with production values

# 2. Run database migrations
cd backend
alembic upgrade head

# 3. Test authentication endpoints
curl -X POST https://api.assignmentai.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpassword123"}'
```

#### 2. Frontend Deployment

```bash
# 1. Set up production environment
cp frontend/.env.example frontend/.env.production
# Edit frontend/.env.production with production values

# 2. Build frontend
cd frontend
npm run build

# 3. Deploy to production server
# (Use your deployment script or manual deployment)
```

## Quick Reference

### Health Check URLs

| Service    | URL                                   | Expected Response                          |
| ---------- | ------------------------------------- | ------------------------------------------ |
| Frontend   | `https://assignmentai.app/health`     | `{"status": "healthy"}`                    |
| API        | `https://api.assignmentai.app/health` | `{"status": "healthy", "services": {...}}` |
| Monitoring | `https://monitoring.assignmentai.app` | Grafana dashboard                          |

### Emergency Contacts

- **Technical Lead**: [Your Contact]
- **Security Team**: [Security Contact]
- **Hosting Provider**: [Provider Contact]

## Troubleshooting

### Service Issues

```powershell
# Check service logs
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend

# Restart specific service
docker-compose -f docker-compose.prod.yml restart backend
```

### Database Issues

```powershell
# Check database connectivity
docker-compose -f docker-compose.prod.yml exec db pg_isready -U $env:POSTGRES_USER

# Create manual backup
docker-compose -f docker-compose.prod.yml exec db pg_dump -U $env:POSTGRES_USER $env:POSTGRES_DB > emergency_backup.sql
```

### System Resources

```powershell
# Check CPU/Memory
Get-Counter "\Processor(_Total)\% Processor Time"
Get-Counter "\Memory\% Committed Bytes In Use"

# Check disk space
Get-WmiObject -Class Win32_LogicalDisk | Select-Object DeviceID, @{Name="FreeGB";Expression={[math]::Round($_.FreeSpace/1GB,2)}}, @{Name="TotalGB";Expression={[math]::Round($_.Size/1GB,2)}}
```

### Common Issues

1. **SSL Certificate Issues**

   - Check Let's Encrypt logs
   - Verify domain DNS configuration
   - Check firewall settings

2. **Database Connection Issues**

   - Verify database credentials
   - Check network connectivity
   - Verify connection pool settings

3. **Service Startup Issues**

   - Check Docker logs
   - Verify environment variables
   - Check port availability

4. **Performance Issues**
   - Monitor resource usage
   - Check database query performance
   - Verify caching configuration

### Support Resources

- **Logs**: Check application and system logs
- **Monitoring**: Use Grafana dashboards
- **Documentation**: Refer to API documentation
- **Community**: Check GitHub issues and discussions

---

**Note**: This guide consolidates information from multiple monitoring and authentication documentation files. For specific implementation details, refer to the individual service configurations and scripts.
