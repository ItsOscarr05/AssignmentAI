# AssignmentAI Monitoring & Emergency Response - Quick Reference

## 🚨 Emergency Commands (Copy & Paste)

### Quick Health Check

```powershell
# Check all services
docker-compose -f docker-compose.prod.yml ps

# Test health endpoints
curl https://assignmentai.app/health
curl https://api.assignmentai.app/health
```

### Emergency Actions

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

### Monitoring

```powershell
# Run monitoring
.\scripts\monitor-production.ps1

# Silent monitoring with alerts
.\scripts\monitor-production.ps1 -Silent -EmailAlerts
```

## 📊 Health Check URLs

| Service    | URL                                   | Expected Response                          |
| ---------- | ------------------------------------- | ------------------------------------------ |
| Frontend   | `https://assignmentai.app/health`     | `{"status": "healthy"}`                    |
| API        | `https://api.assignmentai.app/health` | `{"status": "healthy", "services": {...}}` |
| Monitoring | `https://monitoring.assignmentai.app` | Grafana dashboard                          |

## 🔧 Quick Troubleshooting

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

## 📞 Emergency Contacts

- **Technical Lead**: [Your Contact]
- **Security Team**: [Security Contact]
- **Hosting Provider**: [Provider Contact]

## 🚨 Incident Response Steps

### 1. Assess the Situation

```powershell
# Quick health check
.\scripts\monitor-production.ps1
```

### 2. Enable Maintenance Mode (if needed)

```powershell
.\scripts\emergency-response.ps1 -Action maintenance
# Choose: enable
```

### 3. Create Emergency Backup

```powershell
.\scripts\emergency-response.ps1 -Action backup
```

### 4. Take Action

- **Service issues**: `.\scripts\emergency-response.ps1 -Action restart`
- **Deployment issues**: `.\scripts\emergency-response.ps1 -Action rollback`
- **Security issues**: `.\scripts\emergency-response.ps1 -Action security`

### 5. Monitor Recovery

```powershell
# Check health
.\scripts\monitor-production.ps1

# Disable maintenance mode when resolved
.\scripts\emergency-response.ps1 -Action maintenance
# Choose: disable
```

## 📋 Pre-Incident Checklist

- [ ] Monitoring script is running
- [ ] Emergency contacts are updated
- [ ] Backup procedures are tested
- [ ] Rollback procedures are tested
- [ ] Maintenance mode is tested

## 🔐 Security Quick Actions

### If Security Incident Detected:

1. **Immediate**: `.\scripts\emergency-response.ps1 -Action security`
2. **Check logs**: `docker-compose -f docker-compose.prod.yml logs`
3. **Block IPs**: Add to firewall/security group
4. **Rotate secrets**: Update environment variables
5. **Notify team**: Contact security team

### Common Security Checks:

```powershell
# Check for failed logins
docker-compose -f docker-compose.prod.yml logs backend | Select-String "failed login"

# Check for unusual activity
docker-compose -f docker-compose.prod.yml logs backend | Select-String "error"
```

---

**Keep this reference handy for quick access during incidents!** 🎯
