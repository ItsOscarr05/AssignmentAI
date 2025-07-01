# AssignmentAI Production Monitoring & Emergency Response

## Overview

This document covers the production monitoring and emergency response systems for AssignmentAI. These tools help ensure your production environment remains healthy and provide quick response capabilities during incidents.

## 📊 Production Monitoring

### Monitoring Script: `scripts/monitor-production.ps1`

The production monitoring script provides comprehensive health checks and automated alerting for your AssignmentAI deployment.

#### Features

- **Health Endpoint Monitoring**: Checks frontend, API, and monitoring dashboards
- **Docker Service Status**: Verifies all containers are running
- **System Resource Monitoring**: CPU, memory, and disk usage
- **Database Backup Verification**: Ensures backups are recent
- **SSL Certificate Monitoring**: Checks certificate expiration
- **Email Alerts**: Sends notifications for critical issues

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

## 🚨 Emergency Response

### Emergency Response Script: `scripts/emergency-response.ps1`

The emergency response script provides quick actions for critical production issues.

#### Available Actions

| Action        | Description                      | Use Case                                 |
| ------------- | -------------------------------- | ---------------------------------------- |
| `maintenance` | Enable/disable maintenance mode  | Planned maintenance, security incidents  |
| `backup`      | Create emergency database backup | Before risky operations, data protection |
| `restart`     | Restart all services             | Service issues, memory leaks             |
| `rollback`    | Rollback to previous deployment  | Failed deployments, critical bugs        |
| `security`    | Handle security incidents        | Security breaches, unauthorized access   |
| `help`        | Show help information            | Get usage information                    |

#### Usage

```powershell
# Show help
.\scripts\emergency-response.ps1 -Action help

# Enable maintenance mode
.\scripts\emergency-response.ps1 -Action maintenance

# Create emergency backup
.\scripts\emergency-response.ps1 -Action backup

# Restart all services
.\scripts\emergency-response.ps1 -Action restart

# Rollback deployment (with confirmation)
.\scripts\emergency-response.ps1 -Action rollback

# Rollback deployment (force, no confirmation)
.\scripts\emergency-response.ps1 -Action rollback -Force

# Handle security incident
.\scripts\emergency-response.ps1 -Action security
```

#### Emergency Procedures

##### 1. Maintenance Mode

**Enable:**

```powershell
.\scripts\emergency-response.ps1 -Action maintenance
# Choose: enable
```

**Disable:**

```powershell
.\scripts\emergency-response.ps1 -Action maintenance
# Choose: disable
```

**What it does:**

- Sets `ENABLE_MAINTENANCE_MODE=True`
- Restarts backend service
- Users see maintenance page

##### 2. Emergency Backup

```powershell
.\scripts\emergency-response.ps1 -Action backup
```

**What it does:**

- Creates timestamped database backup
- Uploads to S3 (if configured)
- Provides backup file location

##### 3. Service Restart

```powershell
.\scripts\emergency-response.ps1 -Action restart
```

**What it does:**

- Stops all Docker services
- Waits 5 seconds
- Starts all services
- Verifies all services are running

##### 4. Deployment Rollback

```powershell
.\scripts\emergency-response.ps1 -Action rollback
```

**What it does:**

- Shows current and previous commit hashes
- Asks for confirmation (unless `-Force`)
- Checks out previous commit
- Rebuilds and restarts services

##### 5. Security Incident Response

```powershell
.\scripts\emergency-response.ps1 -Action security
```

**What it does:**

- Enables maintenance mode
- Creates emergency backup
- Blocks suspicious IPs (placeholder)
- Rotates secrets (placeholder)
- Checks for unauthorized access (placeholder)

## 📈 Health Check Endpoints

### Frontend Health Check

**URL:** `https://assignmentai.app/health`

**Response:**

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "environment": "production",
  "timestamp": "2024-01-15T14:30:00Z"
}
```

### Backend Health Check

**URL:** `https://api.assignmentai.app/health`

**Response:**

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "environment": "production",
  "timestamp": "2024-01-15T14:30:00Z",
  "services": {
    "database": "healthy",
    "redis": "healthy"
  },
  "system": {
    "cpu_percent": 23.45,
    "memory_percent": 67.89,
    "disk_percent": 45.67,
    "uptime": 1705320600
  },
  "uptime": "2024-01-15T10:30:00Z"
}
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Monitoring Script Fails

**Symptoms:** Script exits with error
**Solutions:**

- Check environment variables are set
- Verify Docker services are running
- Check network connectivity

#### 2. Health Checks Fail

**Symptoms:** Health endpoints return errors
**Solutions:**

- Check service logs: `docker-compose -f docker-compose.prod.yml logs`
- Verify database connectivity
- Check Redis connectivity

#### 3. Emergency Script Fails

**Symptoms:** Emergency actions don't work
**Solutions:**

- Check Docker is running
- Verify Git repository is clean
- Check file permissions

### Debug Commands

```powershell
# Check Docker services
docker-compose -f docker-compose.prod.yml ps

# Check service logs
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend

# Check system resources
Get-Counter "\Processor(_Total)\% Processor Time"
Get-Counter "\Memory\% Committed Bytes In Use"

# Test health endpoints manually
Invoke-WebRequest -Uri "https://assignmentai.app/health"
Invoke-WebRequest -Uri "https://api.assignmentai.app/health"
```

## 📞 Emergency Contacts

### Technical Support

- **Primary Contact**: [Your Email]
- **Secondary Contact**: [Backup Email]
- **Emergency Phone**: [Phone Number]

### Service Providers

- **Domain Registrar**: [Provider]
- **Hosting Provider**: [Provider]
- **SSL Certificate**: Let's Encrypt (auto-renewal)
- **Monitoring**: Prometheus/Grafana

### Escalation Procedures

1. **Level 1**: Automated monitoring detects issue
2. **Level 2**: Manual investigation required
3. **Level 3**: Emergency response script execution
4. **Level 4**: Contact technical support
5. **Level 5**: Contact service providers

## 📋 Maintenance Schedule

### Daily

- [ ] Review monitoring alerts
- [ ] Check system resource usage
- [ ] Verify backup completion

### Weekly

- [ ] Review access logs
- [ ] Check for failed login attempts
- [ ] Monitor unusual traffic patterns
- [ ] Verify SSL certificate renewal

### Monthly

- [ ] Update dependencies
- [ ] Review user permissions
- [ ] Performance trend analysis
- [ ] Capacity planning review

### Quarterly

- [ ] Security audit
- [ ] Backup restoration test
- [ ] Disaster recovery drill
- [ ] Documentation review

## 🔐 Security Considerations

### Access Control

- Limit script access to authorized personnel
- Use secure authentication for monitoring
- Regularly rotate access credentials

### Data Protection

- Encrypt sensitive configuration files
- Secure backup storage
- Audit log access

### Incident Response

- Document all incidents
- Follow security procedures
- Notify stakeholders as appropriate

---

**Last Updated:** January 15, 2024  
**Version:** 1.0.0  
**Maintainer:** AssignmentAI Team
