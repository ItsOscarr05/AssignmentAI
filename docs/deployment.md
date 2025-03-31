# AssignmentAI Deployment Guide

## Overview
This guide provides detailed instructions for deploying the AssignmentAI application in various environments, including development, staging, and production.

## Deployment Environments

### Development Environment
- Purpose: Local development and testing
- Features: Hot reloading, detailed error messages, development tools
- Database: Local MongoDB and Redis instances
- Security: Basic security measures

### Staging Environment
- Purpose: Testing and validation
- Features: Production-like setup, monitoring, logging
- Database: Staging MongoDB and Redis clusters
- Security: Production-like security measures

### Production Environment
- Purpose: Live user access
- Features: High availability, performance optimization, full monitoring
- Database: Production MongoDB and Redis clusters
- Security: Full security measures, SSL/TLS, firewalls

## Deployment Methods

### 1. Manual Deployment

#### Frontend Deployment
1. Build the application:
```bash
cd frontend
npm install
npm run build
```

2. Deploy to web server:
```bash
# Using nginx
sudo cp -r build/* /var/www/html/

# Using Apache
sudo cp -r build/* /var/www/html/
```

3. Configure web server:

Nginx configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Apache configuration:
```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /var/www/html

    <Directory /var/www/html>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ProxyPass /api http://localhost:3001
    ProxyPassReverse /api http://localhost:3001
</VirtualHost>
```

#### Backend Deployment
1. Build the application:
```bash
cd backend
npm install
npm run build
```

2. Set up environment variables:
```bash
# Create .env file
cat > .env << EOL
PORT=3001
MONGODB_URI=mongodb://your-mongodb-uri
REDIS_URL=redis://your-redis-uri
JWT_SECRET=your-secret
NODE_ENV=production
FRONTEND_URL=https://your-domain.com
EOL
```

3. Start the application:
```bash
# Using PM2
pm2 start dist/server.js --name assignmentai

# Using systemd
sudo systemctl start assignmentai
```

### 2. Docker Deployment

#### Using Docker Compose
1. Create docker-compose.yml:
```yaml
version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/assignmentai
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=your-secret
      - NODE_ENV=production
    depends_on:
      - mongodb
      - redis

  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  redis:
    image: redis:latest
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  mongodb_data:
  redis_data:
```

2. Deploy:
```bash
docker-compose up -d
```

#### Using Kubernetes
1. Create Kubernetes manifests:

Frontend deployment:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: assignmentai-frontend:latest
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: frontend
spec:
  selector:
    app: frontend
  ports:
  - port: 80
    targetPort: 80
  type: LoadBalancer
```

Backend deployment:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: assignmentai-backend:latest
        ports:
        - containerPort: 3001
        env:
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: mongodb-uri
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: redis-url
---
apiVersion: v1
kind: Service
metadata:
  name: backend
spec:
  selector:
    app: backend
  ports:
  - port: 3001
    targetPort: 3001
```

2. Deploy to Kubernetes:
```bash
kubectl apply -f k8s/
```

## Database Deployment

### MongoDB Deployment
1. Set up MongoDB cluster:
```bash
# Using MongoDB Atlas
# Create cluster through Atlas UI

# Using self-hosted
mongod --replSet rs0 --dbpath /data/db
```

2. Configure replication:
```javascript
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongodb0:27017" },
    { _id: 1, host: "mongodb1:27017" },
    { _id: 2, host: "mongodb2:27017" }
  ]
})
```

### Redis Deployment
1. Set up Redis cluster:
```bash
# Using Redis Enterprise
# Create cluster through Redis Enterprise UI

# Using self-hosted
redis-cli --cluster create \
  redis0:6379 redis1:6379 redis2:6379 \
  redis3:6379 redis4:6379 redis5:6379 \
  --cluster-replicas 1
```

## Monitoring and Logging

### Application Monitoring
1. Set up monitoring stack:
```bash
# Using Prometheus and Grafana
docker-compose -f monitoring.yml up -d
```

2. Configure alerts:
```yaml
groups:
- name: assignmentai
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: High error rate detected
```

### Logging
1. Set up logging stack:
```bash
# Using ELK Stack
docker-compose -f logging.yml up -d
```

2. Configure log shipping:
```yaml
input {
  file {
    path => "/var/log/assignmentai/*.log"
    type => "assignmentai"
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "assignmentai-%{+YYYY.MM.dd}"
  }
}
```

## Security Measures

### SSL/TLS Configuration
1. Obtain SSL certificate:
```bash
# Using Let's Encrypt
certbot --nginx -d your-domain.com
```

2. Configure SSL in Nginx:
```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
}
```

### Security Headers
1. Configure security headers in Nginx:
```nginx
add_header X-Frame-Options "SAMEORIGIN";
add_header X-XSS-Protection "1; mode=block";
add_header X-Content-Type-Options "nosniff";
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
```

## Backup and Recovery

### Database Backup
1. MongoDB backup:
```bash
# Create backup
mongodump --uri="mongodb://your-mongodb-uri" --out=/backup

# Restore backup
mongorestore --uri="mongodb://your-mongodb-uri" /backup
```

2. Redis backup:
```bash
# Create backup
redis-cli SAVE

# Restore backup
redis-cli FLUSHALL
redis-cli RESTORE key 0 value
```

### Application Backup
1. Configuration backup:
```bash
# Backup configuration files
tar -czf config-backup.tar.gz /etc/assignmentai/
```

2. Code backup:
```bash
# Backup application code
tar -czf code-backup.tar.gz /var/www/assignmentai/
```

## Scaling

### Horizontal Scaling
1. Add more application instances:
```bash
# Using Docker
docker-compose up -d --scale backend=3

# Using Kubernetes
kubectl scale deployment backend --replicas=3
```

2. Configure load balancer:
```nginx
upstream backend {
    least_conn;
    server backend1:3001;
    server backend2:3001;
    server backend3:3001;
}
```

### Database Scaling
1. Add MongoDB shards:
```javascript
sh.addShard("shard0/mongodb0:27018")
sh.addShard("shard1/mongodb1:27018")
sh.enableSharding("assignmentai")
```

2. Configure Redis cluster:
```bash
redis-cli --cluster add-node redis6:6379 redis0:6379
```

## Maintenance

### Updates
1. Application updates:
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose up -d --build
```

2. Database updates:
```bash
# MongoDB update
mongosh --eval "db.adminCommand({getParameter:1,featureCompatibilityVersion:1})"

# Redis update
redis-cli INFO server
```

### Monitoring
1. Check application health:
```bash
# Check application status
curl http://localhost:3001/health

# Check logs
docker-compose logs -f
```

2. Monitor resources:
```bash
# Check CPU and memory usage
docker stats

# Check disk usage
df -h
```

## Troubleshooting

### Common Issues
1. Application not starting:
```bash
# Check logs
docker-compose logs

# Check configuration
docker-compose config
```

2. Database connection issues:
```bash
# Check MongoDB connection
mongosh --eval "db.serverStatus()"

# Check Redis connection
redis-cli ping
```

### Performance Issues
1. Check application performance:
```bash
# Monitor response times
curl -w "\n%{time_total}\n" http://localhost:3001/api/health

# Check memory usage
docker stats
```

2. Database performance:
```bash
# MongoDB performance
mongosh --eval "db.currentOp()"

# Redis performance
redis-cli info | grep used_memory
```
