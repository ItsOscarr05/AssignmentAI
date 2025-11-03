# AssignmentAI Production Deployment Guide

## Overview

This comprehensive guide provides step-by-step instructions for deploying AssignmentAI to production environment with specific configurations, commands, and cost estimates.

**Estimated Monthly Cost:** $50-150 (depending on traffic and instance sizes)

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Infrastructure Setup](#infrastructure-setup)
4. [Security Configuration](#security-configuration)
5. [Deployment Process](#deployment-process)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

- Production server (VPS/Cloud) with minimum 4GB RAM, 2 vCPUs
- Domain name (e.g., assignmentai.app)
- Stripe account with live keys
- OpenAI API account
- Email service credentials
- Local application fully tested and working

## Pre-Deployment Checklist

### Code Review

- [ ] **Security Review**: All authentication code reviewed by security team
- [ ] **Code Quality**: All linting and formatting checks pass
- [ ] **Dependencies**: All dependencies updated and security vulnerabilities resolved
- [ ] **Documentation**: API documentation updated and accurate
- [ ] **Environment Variables**: All environment variables documented and configured

### Testing Requirements

- [ ] **Unit Tests**: All unit tests passing (coverage > 90%)
- [ ] **Integration Tests**: All integration tests passing
- [ ] **Security Tests**: Security tests completed and passed
- [ ] **Performance Tests**: Load testing completed
- [ ] **Browser Tests**: Cross-browser compatibility verified

### Infrastructure

- [ ] **Database**: Production database configured and migrated
- [ ] **Redis**: Redis instance configured and tested
- [ ] **SSL Certificates**: Valid SSL certificates installed
- [ ] **Domain**: Domain configured and DNS updated
- [ ] **CDN**: Content delivery network configured (if applicable)

## Infrastructure Setup

### 1. Domain and DNS Configuration

- [ ] Domain name registered (assignmentai.app)
- [ ] DNS records configured:
  - [ ] A record for `assignmentai.app` → Server IP
  - [ ] A record for `api.assignmentai.app` → Server IP
  - [ ] A record for `monitoring.assignmentai.app` → Server IP
  - [ ] CNAME record for `www.assignmentai.app` → `assignmentai.app`

### 2. Server Infrastructure

- [ ] Ubuntu 20.04+ installed
- [ ] Docker and Docker Compose installed
- [ ] Firewall configured (ports 80, 443, 22)
- [ ] SSL certificates ready (Let's Encrypt via Traefik)

### 3. Environment Variables Setup

- [ ] All required environment variables set:
  - [ ] `OPENAI_API_KEY` - OpenAI API key
  - [ ] `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
  - [ ] `STRIPE_SECRET_KEY` - Stripe secret key
  - [ ] `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
  - [ ] `AWS_ACCESS_KEY_ID` - AWS access key
  - [ ] `AWS_SECRET_ACCESS_KEY` - AWS secret key
  - [ ] `AWS_BUCKET_NAME` - S3 bucket name
  - [ ] `GOOGLE_CLIENT_ID` - Google OAuth client ID
  - [ ] `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
  - [ ] `SMTP_PASSWORD` - Email service password
  - [ ] `ACME_EMAIL` - Email for SSL certificates
  - [ ] `ALERT_EMAIL` - Email for monitoring alerts

### 4. External Service Configuration

- [ ] **OpenAI API**: Account created and API key generated
- [ ] **Stripe**: Account created and webhook endpoints configured
- [ ] **AWS S3**: Bucket created and CORS configured
- [ ] **Google OAuth**: OAuth credentials configured for production domains
- [ ] **Email Service**: SMTP credentials configured (Gmail, SendGrid, etc.)
- [ ] **Sentry**: Error tracking configured (optional)
- [ ] **Google Analytics**: Tracking ID configured (optional)

## Security Configuration

### Authentication & Authorization

- [ ] JWT secret key generated and secure
- [ ] Password policies enforced
- [ ] Rate limiting configured
- [ ] CORS settings properly configured
- [ ] 2FA enabled for admin accounts (optional)

### Network Security

- [ ] Firewall rules configured
- [ ] Only necessary ports exposed
- [ ] SSH key-based authentication enabled
- [ ] Fail2ban configured (optional)
- [ ] DDoS protection enabled (optional)

### Data Security

- [ ] Database passwords secure and unique
- [ ] Redis password configured (if Redis is used)
- [ ] File uploads restricted to safe types
- [ ] Environment variables not logged
- [ ] Backup encryption enabled

## Deployment Process

### 1. Initial Setup

- [ ] Clone repository to production server
- [ ] Run deployment script: `./scripts/deploy-production.sh` (Linux) or `./scripts/deploy-production.ps1` (Windows)
- [ ] Verify all services start successfully
- [ ] Check SSL certificates are generated

### 2. Database Setup

- [ ] Database migrations run successfully (Alembic)
- [ ] Initial superuser created
- [ ] Database backup configured
- [ ] Connection pool settings optimized

### 3. Service Verification

- [ ] Frontend accessible at https://assignmentai.app
- [ ] API accessible at https://api.assignmentai.app
- [ ] Monitoring accessible at https://monitoring.assignmentai.app
- [ ] All health checks passing
- [ ] SSL certificates valid and auto-renewing

## Deployment Commands

### Initial Deployment

```bash
# Linux/Mac
./scripts/deploy-production.sh

# Windows PowerShell
.\scripts\deploy-production.ps1
```

### Service Management

```bash
# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Stop all services
docker-compose -f docker-compose.prod.yml down

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend

# Restart specific service
docker-compose -f docker-compose.prod.yml restart backend
```

### Database Operations

```bash
# Run migrations
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head

# Create backup
docker-compose -f docker-compose.prod.yml exec db pg_dump -U $POSTGRES_USER $POSTGRES_DB > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
docker-compose -f docker-compose.prod.yml exec -T db psql -U $POSTGRES_USER $POSTGRES_DB < backup_file.sql
```

## URLs and Access

### Application URLs

- **Frontend**: https://assignmentai.app
- **API**: https://api.assignmentai.app
- **Monitoring**: https://monitoring.assignmentai.app

### Admin Access

- **Grafana**: https://monitoring.assignmentai.app/grafana
  - Username: `admin`
  - Password: `$GRAFANA_PASSWORD`

## Post-Deployment Verification

### 1. Application Health

- [ ] All services running and healthy
- [ ] Database connections successful
- [ ] External API integrations working
- [ ] File uploads functioning
- [ ] Email notifications sending

### 2. Performance Testing

- [ ] Load testing completed
- [ ] Response times acceptable
- [ ] Database performance optimized
- [ ] Caching working effectively

### 3. Security Testing

- [ ] SSL certificates valid
- [ ] Authentication working
- [ ] Authorization enforced
- [ ] Rate limiting active
- [ ] CORS properly configured

## Monitoring & Maintenance

### Application Monitoring

- [ ] Health checks configured
- [ ] Error tracking enabled
- [ ] Performance monitoring active
- [ ] Log aggregation working
- [ ] Alerting configured

### Infrastructure Monitoring

- [ ] Server resource monitoring
- [ ] Database performance monitoring
- [ ] Network monitoring
- [ ] SSL certificate monitoring
- [ ] Backup monitoring

### Regular Maintenance

- [ ] Security updates applied
- [ ] Dependencies updated
- [ ] Database backups verified
- [ ] Log rotation configured
- [ ] SSL certificate renewal automated

## Troubleshooting

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

## Rollback Plan

### Quick Rollback

```bash
# Stop current deployment
docker-compose -f docker-compose.prod.yml down

# Restore previous version
git checkout <previous-tag>
docker-compose -f docker-compose.prod.yml up -d

# Verify rollback successful
curl -f https://assignmentai.app/health
```

### Database Rollback

```bash
# Restore database from backup
docker-compose -f docker-compose.prod.yml exec -T db psql -U $POSTGRES_USER $POSTGRES_DB < backup_file.sql

# Verify data integrity
docker-compose -f docker-compose.prod.yml exec backend python -c "from app.database import get_db; print('Database connection successful')"
```

---

**Note**: This guide consolidates information from multiple deployment documentation files. For specific implementation details, refer to the individual service configurations and scripts.
