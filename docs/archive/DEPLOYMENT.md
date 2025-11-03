# AssignmentAI Deployment Guide

This guide provides instructions for deploying the AssignmentAI backend application.

## Prerequisites

- Python 3.8 or higher
- PostgreSQL 13 or higher
- Redis 6 or higher
- SSL certificates (for production)

## Environment Setup

1. Create a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Create a `.env` file with the following variables:

```env
# Project settings
PROJECT_NAME=AssignmentAI
DEBUG=False
ENVIRONMENT=production

# Security
SECRET_KEY=your-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Database
SQLALCHEMY_DATABASE_URI=postgresql://user:password@localhost:5432/assignmentai

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# SSL/TLS (for production)
SSL_ENABLED=True
SSL_KEYFILE=/path/to/private.key
SSL_CERTFILE=/path/to/certificate.crt

# CORS
CORS_ORIGINS=["https://your-frontend-domain.com"]
```

## Database Setup

1. Create the database:

```bash
createdb assignmentai
```

2. Run migrations:

```bash
alembic upgrade head
```

## Redis Setup

1. Install Redis:

```bash
# Ubuntu/Debian
sudo apt-get install redis-server

# macOS
brew install redis

# Windows
# Download from https://redis.io/download
```

2. Configure Redis:

```bash
# Edit redis.conf
bind 127.0.0.1
port 6379
requirepass your-redis-password
```

3. Start Redis:

```bash
# Ubuntu/Debian
sudo systemctl start redis-server

# macOS
brew services start redis

# Windows
redis-server
```

## Production Deployment

1. Set up SSL certificates:

```bash
# Using Let's Encrypt
sudo certbot certonly --standalone -d your-domain.com
```

2. Configure Nginx:

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

3. Start the application:

```bash
# Using Gunicorn
gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

## Monitoring

1. Set up logging:

```bash
# Configure log rotation
sudo nano /etc/logrotate.d/assignmentai
```

Add:

```
/var/log/assignmentai/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0640 www-data www-data
}
```

2. Monitor the application:

```bash
# Check logs
tail -f /var/log/assignmentai/app.log

# Monitor processes
ps aux | grep gunicorn
```

## Backup

1. Database backup:

```bash
# Create backup
pg_dump -U postgres assignmentai > backup.sql

# Restore backup
psql -U postgres assignmentai < backup.sql
```

2. File uploads backup:

```bash
# Create backup
tar -czf uploads_backup.tar.gz uploads/

# Restore backup
tar -xzf uploads_backup.tar.gz
```

## Security Considerations

1. Firewall configuration:

```bash
# Allow only necessary ports
sudo ufw allow 443/tcp
sudo ufw allow 80/tcp
sudo ufw enable
```

2. Regular updates:

```bash
# Update system
sudo apt-get update
sudo apt-get upgrade

# Update Python packages
pip install -r requirements.txt --upgrade
```

3. Monitor security logs:

```bash
# Check auth logs
sudo tail -f /var/log/auth.log

# Check application logs
tail -f /var/log/assignmentai/app.log
```

## Troubleshooting

1. Check application status:

```bash
# Check if application is running
ps aux | grep gunicorn

# Check logs
tail -f /var/log/assignmentai/app.log
```

2. Database issues:

```bash
# Check database connection
psql -U postgres -d assignmentai -c "\dt"

# Check migrations
alembic current
```

3. Redis issues:

```bash
# Check Redis connection
redis-cli ping

# Check Redis memory
redis-cli info memory
```

## Support

For additional support, please refer to:

- [GitHub Issues](https://github.com/yourusername/assignmentai/issues)
- [Documentation](https://your-domain.com/docs)
- [Contact Support](mailto:support@your-domain.com)
