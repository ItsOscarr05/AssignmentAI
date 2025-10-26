# Updated Docker Deployment Guide

## Recent Changes (October 2025)

The Docker configuration has been updated to support the latest features and dependencies:

### Backend Dockerfile Updates
- **Multi-stage build**: Smaller final image size and faster builds
- **Image processing support**: Added OpenCV, Tesseract OCR for file processing
- **ML libraries**: Support for PyTorch and transformers
- **Security**: Non-root user for running the application
- **Health checks**: Built-in health monitoring
- **Performance**: 4 Uvicorn workers for better concurrency

### Docker Compose Updates
- **Removed deprecated `version` field**: Now using modern compose syntax
- **Health checks**: All services now have proper health checks
- **Service dependencies**: Services wait for dependencies to be healthy before starting
- **Updated images**:
  - PostgreSQL: 15 → 16
  - Traefik: v2.10 → v3.0
  - Prometheus: latest → v2.50.1 (pinned)
  - Grafana: latest → v10.4.0 (pinned)
- **Persistent volumes**: Added volumes for uploads, logs, and data persistence
- **Resource limits**: Redis configured with memory limits
- **Better networking**: Defined subnet for consistent networking

## Prerequisites

1. **Docker Desktop**: Must be running (Windows/Mac) or Docker Engine (Linux)
2. **Environment files**: Three `.env` files are required:
   - `/.env` (root level - for docker-compose variables)
   - `/backend/.env.production` (backend-specific variables)
   - `/frontend/.env.production` (frontend-specific variables)

## Setup Instructions

### 1. Start Docker Desktop

On Windows, open Docker Desktop from the Start menu and wait for it to fully start.

### 2. Create Root Environment File

Create `/.env` in the project root:

```bash
# Copy the example file
cp .env.example .env

# Edit with your values
POSTGRES_PASSWORD=your_secure_password
GRAFANA_PASSWORD=your_admin_password
ACME_EMAIL=admin@assignmentai.app
```

### 3. Verify Backend and Frontend .env Files

Ensure these files exist and are properly configured:
- `backend/.env.production`
- `frontend/.env.production`

## Deployment Commands

### Windows (PowerShell)

**Full deployment** (stop, remove, rebuild, start):
```powershell
docker compose -f docker-compose.prod.yml down ; docker compose -f docker-compose.prod.yml rm -f ; docker compose -f docker-compose.prod.yml build ; docker compose -f docker-compose.prod.yml up -d
```

**Individual steps**:
```powershell
# Stop containers
docker compose -f docker-compose.prod.yml down

# Remove containers
docker compose -f docker-compose.prod.yml rm -f

# Build images
docker compose -f docker-compose.prod.yml build

# Start services
docker compose -f docker-compose.prod.yml up -d
```

**View logs**:
```powershell
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f backend
```

**Check status**:
```powershell
docker compose -f docker-compose.prod.yml ps
```

**Check health**:
```powershell
docker compose -f docker-compose.prod.yml ps --format json | ConvertFrom-Json | Select-Object Name, State, Health
```

### Linux/Mac (Bash)

**Full deployment**:
```bash
docker compose -f docker-compose.prod.yml down && \
docker compose -f docker-compose.prod.yml rm -f && \
docker compose -f docker-compose.prod.yml build && \
docker compose -f docker-compose.prod.yml up -d
```

## Service Architecture

The production deployment includes:

1. **Frontend** (React/Vite)
   - Nginx serving static files
   - Accessible at: `https://assignmentai.app`

2. **Backend** (FastAPI)
   - Python 3.11 with Uvicorn
   - 4 workers for concurrency
   - Accessible at: `https://api.assignmentai.app`

3. **Database** (PostgreSQL 16)
   - Persistent data storage
   - UTF-8 encoding
   - Health monitoring

4. **Cache** (Redis 7)
   - 256MB memory limit
   - LRU eviction policy
   - Persistent data with AOF

5. **Load Balancer** (Traefik v3)
   - Automatic SSL/TLS with Let's Encrypt
   - HTTP to HTTPS redirect
   - Docker service discovery

6. **Monitoring** (Prometheus + Grafana)
   - Metrics collection (30-day retention)
   - Visualization dashboards
   - Accessible at: `https://monitoring.assignmentai.app`

## Port Mapping

| Service    | Internal | External | Purpose                    |
|------------|----------|----------|----------------------------|
| Traefik    | 80       | 80       | HTTP (redirects to HTTPS)  |
| Traefik    | 443      | 443      | HTTPS                      |
| Traefik    | 8080     | 8080     | Dashboard (optional)       |
| Prometheus | 9090     | 9090     | Metrics                    |
| Grafana    | 3000     | 3000     | Monitoring UI              |

## Health Checks

All services include health checks:
- **Backend**: HTTP check on `/health` endpoint every 30s
- **Database**: PostgreSQL `pg_isready` check every 10s
- **Redis**: PING command every 10s
- **Prometheus**: HTTP check on `/-/healthy` every 30s
- **Grafana**: HTTP check on `/api/health` every 30s

Services will restart automatically if health checks fail.

## Volumes

Persistent data is stored in Docker volumes:

- `postgres_data`: Database files
- `redis_data`: Redis persistence
- `grafana_data`: Grafana dashboards and settings
- `prometheus_data`: Metrics data (30-day retention)
- `backend_uploads`: User-uploaded files
- `backend_logs`: Application logs

## Troubleshooting

### Issue: "docker: command not found" or "docker compose: command not found"

**Solution**: Make sure Docker Desktop is running and restart your PowerShell/terminal.

### Issue: Environment variable warnings

**Solution**: Create the `/.env` file in the project root with the required variables.

### Issue: Services not starting

**Check logs**:
```powershell
docker compose -f docker-compose.prod.yml logs
```

**Check individual service**:
```powershell
docker compose -f docker-compose.prod.yml logs backend
```

### Issue: Port already in use

**Solution**: Stop other services using ports 80, 443, 3000, or 9090:
```powershell
# Windows
netstat -ano | findstr :80
netstat -ano | findstr :443

# Then kill the process or change the port in docker-compose.prod.yml
```

### Issue: Build fails on backend

**Solution**: Check if you have enough disk space and memory allocated to Docker Desktop:
- Recommended: 4GB RAM minimum, 8GB+ recommended
- Disk space: 10GB+ free

### Issue: Backend health check failing

**Check backend logs**:
```powershell
docker compose -f docker-compose.prod.yml logs backend
```

Common causes:
- Missing environment variables in `backend/.env.production`
- Database connection issues
- Redis connection issues

### Issue: SSL/TLS certificate issues

**Solution**: Make sure:
1. Your domains point to the server
2. Ports 80 and 443 are accessible
3. The `acme.json` file has correct permissions (600)

```powershell
# Create acme.json if it doesn't exist
New-Item -ItemType File -Path acme.json -Force
```

## Backup

### Database Backup
```powershell
docker compose -f docker-compose.prod.yml exec db pg_dump -U postgres assignmentai > backup.sql
```

### Restore Database
```powershell
Get-Content backup.sql | docker compose -f docker-compose.prod.yml exec -T db psql -U postgres assignmentai
```

### Volume Backup
```powershell
# Backup all volumes
docker compose -f docker-compose.prod.yml down
docker run --rm -v assignmentai_postgres_data:/data -v ${PWD}:/backup alpine tar czf /backup/postgres_backup.tar.gz -C /data .
docker compose -f docker-compose.prod.yml up -d
```

## Monitoring

Access monitoring dashboards:
- **Prometheus**: http://localhost:9090 or https://monitoring.assignmentai.app
- **Grafana**: http://localhost:3000 or https://monitoring.assignmentai.app/grafana
  - Default username: `admin`
  - Password: Value from `GRAFANA_PASSWORD` in `.env`

## Updating

To update to the latest code:

```powershell
# Pull latest code
git pull origin master

# Rebuild and restart
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
```

## Security Notes

1. **Environment files**: Never commit `.env` files to git
2. **Passwords**: Use strong, unique passwords
3. **Traefik dashboard**: Disabled by default in production
4. **Non-root user**: Backend runs as non-root user (UID 1000)
5. **Read-only volumes**: Docker socket and configs mounted read-only
6. **Network isolation**: Services communicate on isolated Docker network

## Performance Tuning

### Backend Workers
Adjust workers in `backend/Dockerfile`:
```dockerfile
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

### Redis Memory
Adjust in `docker-compose.prod.yml`:
```yaml
command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
```

### PostgreSQL
Add to db environment in `docker-compose.prod.yml`:
```yaml
- POSTGRES_SHARED_BUFFERS=256MB
- POSTGRES_WORK_MEM=8MB
```

## Support

For issues or questions:
1. Check logs: `docker compose -f docker-compose.prod.yml logs`
2. Check health: `docker compose -f docker-compose.prod.yml ps`
3. Review this guide
4. Check Docker Desktop status

