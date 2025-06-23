# AssignmentAI Production Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying AssignmentAI to AWS production environment with specific configurations, commands, and cost estimates.

**Estimated Monthly Cost:** $50-150 (depending on traffic and instance sizes)

## Prerequisites

- AWS Account with billing alerts configured
- Domain name (e.g., assignmentai.com)
- Stripe account with live keys
- GitHub repository with your code
- Local application fully tested and working

## Phase 1: AWS Account Setup & Security

### 1.1 Configure AWS Billing Alerts (CRITICAL - Do First!)

```bash
# Set up billing alerts via AWS CLI or Console
aws budgets create-budget \
  --account-id YOUR_ACCOUNT_ID \
  --budget '{
    "BudgetName": "Monthly Budget",
    "BudgetLimit": {
      "Amount": "100",
      "Unit": "USD"
    },
    "TimeUnit": "MONTHLY",
    "BudgetType": "COST"
  }'

# Create billing alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "BillingAlarm" \
  --alarm-description "Alert when monthly bill exceeds $100" \
  --metric-name "EstimatedCharges" \
  --namespace "AWS/Billing" \
  --statistic "Maximum" \
  --period 86400 \
  --threshold 100 \
  --comparison-operator "GreaterThanThreshold" \
  --evaluation-periods 1 \
  --alarm-actions "arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:billing-alerts"
```

### 1.2 Create IAM Users and Roles

```bash
# Create deployment user
aws iam create-user --user-name assignmentai-deploy

# Create deployment policy
aws iam create-policy \
  --policy-name AssignmentAIDeploymentPolicy \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "ec2:*",
          "rds:*",
          "s3:*",
          "cloudfront:*",
          "route53:*",
          "acm:*",
          "elasticbeanstalk:*",
          "cloudwatch:*",
          "logs:*"
        ],
        "Resource": "*"
      }
    ]
  }'

# Attach policy to user
aws iam attach-user-policy \
  --user-name assignmentai-deploy \
  --policy-arn arn:aws:iam::YOUR_ACCOUNT_ID:policy/AssignmentAIDeploymentPolicy
```

### 1.3 Set Up VPC and Security Groups

```bash
# Create VPC
aws ec2 create-vpc \
  --cidr-block 10.0.0.0/16 \
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=assignmentai-vpc}]'

# Create subnets (2 public, 2 private for high availability)
aws ec2 create-subnet \
  --vpc-id vpc-xxxxxxxxx \
  --cidr-block 10.0.1.0/24 \
  --availability-zone us-east-1a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=assignmentai-public-1a}]'

aws ec2 create-subnet \
  --vpc-id vpc-xxxxxxxxx \
  --cidr-block 10.0.2.0/24 \
  --availability-zone us-east-1b \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=assignmentai-public-1b}]'

# Create security groups
aws ec2 create-security-group \
  --group-name assignmentai-backend-sg \
  --description "Security group for AssignmentAI backend" \
  --vpc-id vpc-xxxxxxxxx

# Allow HTTP/HTTPS traffic
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxxx \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxxx \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxxx \
  --protocol tcp \
  --port 8000 \
  --cidr 0.0.0.0/0
```

## Phase 2: Database Setup

### 2.1 Create RDS PostgreSQL Instance

```bash
# Create RDS subnet group
aws rds create-db-subnet-group \
  --db-subnet-group-name assignmentai-subnet-group \
  --db-subnet-group-description "Subnet group for AssignmentAI RDS" \
  --subnet-ids subnet-xxxxxxxxx subnet-yyyyyyyyy

# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier assignmentai-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.4 \
  --master-username dbadmin \
  --master-user-password "YOUR_SECURE_PASSWORD" \
  --allocated-storage 20 \
  --storage-type gp2 \
  --db-subnet-group-name assignmentai-subnet-group \
  --vpc-security-group-ids sg-xxxxxxxxx \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "sun:04:00-sun:05:00" \
  --storage-encrypted \
  --deletion-protection \
  --tags 'Key=Name,Value=assignmentai-database'
```

**Cost:** ~$15/month for db.t3.micro

### 2.2 Configure Database Environment Variables

Create `backend/.env.production`:

```env
# Database Configuration
DATABASE_URL=postgresql://dbadmin:YOUR_SECURE_PASSWORD@assignmentai-db.xxxxxxxxx.us-east-1.rds.amazonaws.com:5432/assignmentai
POSTGRES_SERVER=assignmentai-db.xxxxxxxxx.us-east-1.rds.amazonaws.com
POSTGRES_USER=dbadmin
POSTGRES_PASSWORD=YOUR_SECURE_PASSWORD
POSTGRES_DB=assignmentai

# Security
SECRET_KEY=your-production-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Server Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=False
BACKEND_URL=https://api.assignmentai.com

# CORS
FRONTEND_URL=https://app.assignmentai.com
ALLOWED_ORIGINS=https://app.assignmentai.com,https://assignmentai.com
BACKEND_CORS_ORIGINS=https://app.assignmentai.com

# Email Configuration (configure with your email service)
SMTP_TLS=True
SMTP_PORT=587
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAILS_FROM_EMAIL=your-email@gmail.com
EMAILS_FROM_NAME=AssignmentAI
EMAILS_ENABLED=True

# Stripe (LIVE keys)
STRIPE_SECRET_KEY=your-stripe-key-hereYOUR_LIVE_SECRET_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_LIVE_WEBHOOK_SECRET

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# First superuser
FIRST_SUPERUSER=admin@assignmentai.com
FIRST_SUPERUSER_PASSWORD=YOUR_SECURE_ADMIN_PASSWORD
USERS_OPEN_REGISTRATION=True
```

## Phase 3: Backend Deployment

### 3.1 Create Dockerfile for Backend

Create `backend/Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 3.2 Deploy to AWS Elastic Beanstalk

```bash
# Install EB CLI
pip install awsebcli

# Initialize EB application
cd backend
eb init assignmentai-backend \
  --platform python-3.11 \
  --region us-east-1

# Create environment
eb create assignmentai-production \
  --instance-type t3.small \
  --min-instances 1 \
  --max-instances 3 \
  --vpc.id vpc-xxxxxxxxx \
  --vpc.ec2subnets subnet-xxxxxxxxx,subnet-yyyyyyyyy \
  --vpc.elbsubnets subnet-xxxxxxxxx,subnet-yyyyyyyyy \
  --vpc.securitygroups sg-xxxxxxxxx \
  --envvars $(cat .env.production | xargs)

# Deploy
eb deploy
```

**Cost:** ~$25/month for t3.small (1-3 instances)

### 3.3 Set Up Application Load Balancer

```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name assignmentai-alb \
  --subnets subnet-xxxxxxxxx subnet-yyyyyyyyy \
  --security-groups sg-xxxxxxxxx \
  --scheme internet-facing \
  --type application

# Create target group
aws elbv2 create-target-group \
  --name assignmentai-backend-tg \
  --protocol HTTP \
  --port 8000 \
  --vpc-id vpc-xxxxxxxxx \
  --health-check-path /health \
  --health-check-interval-seconds 30 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3
```

## Phase 4: Frontend Deployment

### 4.1 Configure Frontend Environment

Create `frontend/.env.production`:

```env
# API Configuration
VITE_API_URL=https://api.assignmentai.com
VITE_API_TIMEOUT=30000

# Authentication
VITE_AUTH_TOKEN_KEY=auth_token
VITE_REFRESH_TOKEN_KEY=refresh_token

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_TRACKING=true

# Payment Configuration (LIVE key)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_PUBLISHABLE_KEY

# Google API Configuration
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### 4.2 Build and Deploy Frontend

```bash
# Build frontend
cd frontend
npm run build

# Create S3 bucket for static hosting
aws s3 mb s3://assignmentai-frontend

# Enable static website hosting
aws s3 website s3://assignmentai-frontend \
  --index-document index.html \
  --error-document index.html

# Upload built files
aws s3 sync dist/ s3://assignmentai-frontend --delete

# Create bucket policy for public read access
aws s3api put-bucket-policy \
  --bucket assignmentai-frontend \
  --policy '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "PublicReadGetObject",
        "Effect": "Allow",
        "Principal": "*",
        "Action": "s3:GetObject",
        "Resource": "arn:aws:s3:::assignmentai-frontend/*"
      }
    ]
  }'
```

**Cost:** ~$1/month for S3 storage

### 4.3 Set Up CloudFront CDN

```bash
# Create CloudFront distribution
aws cloudfront create-distribution \
  --distribution-config '{
    "CallerReference": "assignmentai-frontend",
    "Origins": {
      "Quantity": 1,
      "Items": [
        {
          "Id": "S3-assignmentai-frontend",
          "DomainName": "assignmentai-frontend.s3-website-us-east-1.amazonaws.com",
          "CustomOriginConfig": {
            "HTTPPort": 80,
            "HTTPSPort": 443,
            "OriginProtocolPolicy": "http-only"
          }
        }
      ]
    },
    "DefaultCacheBehavior": {
      "TargetOriginId": "S3-assignmentai-frontend",
      "ViewerProtocolPolicy": "redirect-to-https",
      "TrustedSigners": {
        "Enabled": false,
        "Quantity": 0
      },
      "ForwardedValues": {
        "QueryString": false,
        "Cookies": {
          "Forward": "none"
        }
      },
      "MinTTL": 0,
      "DefaultTTL": 86400,
      "MaxTTL": 31536000
    },
    "Enabled": true,
    "Comment": "AssignmentAI Frontend CDN"
  }'
```

**Cost:** ~$5/month for CloudFront

## Phase 5: Domain and SSL Configuration

### 5.1 Set Up Route 53

```bash
# Create hosted zone
aws route53 create-hosted-zone \
  --name assignmentai.com \
  --caller-reference $(date +%s)

# Add nameservers to your domain registrar
# (Get nameservers from the hosted zone response)
```

### 5.2 Request SSL Certificate

```bash
# Request certificate
aws acm request-certificate \
  --domain-name assignmentai.com \
  --subject-alternative-names "*.assignmentai.com" \
  --validation-method DNS

# Add DNS validation records to Route 53
# (Follow the validation instructions from ACM)
```

### 5.3 Create DNS Records

```bash
# Create A record for frontend
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890ABC \
  --change-batch '{
    "Changes": [
      {
        "Action": "CREATE",
        "ResourceRecordSet": {
          "Name": "app.assignmentai.com",
          "Type": "A",
          "AliasTarget": {
            "HostedZoneId": "Z2FDTNDATAQYW2",
            "DNSName": "d1234567890abc.cloudfront.net",
            "EvaluateTargetHealth": false
          }
        }
      }
    ]
  }'

# Create A record for API
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890ABC \
  --change-batch '{
    "Changes": [
      {
        "Action": "CREATE",
        "ResourceRecordSet": {
          "Name": "api.assignmentai.com",
          "Type": "A",
          "AliasTarget": {
            "HostedZoneId": "Z35SXDOTRQ7X7K",
            "DNSName": "assignmentai-alb-123456789.us-east-1.elb.amazonaws.com",
            "EvaluateTargetHealth": false
          }
        }
      }
    ]
  }'
```

## Phase 6: Monitoring and Logging

### 6.1 Set Up CloudWatch Logs

```bash
# Create log group
aws logs create-log-group --log-group-name /aws/elasticbeanstalk/assignmentai-backend

# Create log stream
aws logs create-log-stream \
  --log-group-name /aws/elasticbeanstalk/assignmentai-backend \
  --log-stream-name application-logs
```

### 6.2 Create CloudWatch Alarms

```bash
# CPU utilization alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "AssignmentAI-CPU-High" \
  --alarm-description "CPU utilization is high" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions "arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:alerts"

# Memory utilization alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "AssignmentAI-Memory-High" \
  --alarm-description "Memory utilization is high" \
  --metric-name MemoryUtilization \
  --namespace System/Linux \
  --statistic Average \
  --period 300 \
  --threshold 85 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions "arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:alerts"
```

## Phase 7: Final Configuration

### 7.1 Configure Stripe Webhooks

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://api.assignmentai.com/stripe/webhook`
3. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Copy webhook secret to your backend environment variables

### 7.2 Set Up Database Migrations

```bash
# Connect to your production database
psql -h assignmentai-db.xxxxxxxxx.us-east-1.rds.amazonaws.com -U dbadmin -d assignmentai

# Run migrations
cd backend
alembic upgrade head
```

### 7.3 Create Initial Superuser

```bash
# SSH into your EB instance or use EB CLI
eb ssh

# Create superuser
python -c "
from app.crud.user import user
from app.schemas.user import UserCreate
from app.core.config import settings

user_obj = UserCreate(
    email=settings.FIRST_SUPERUSER,
    password=settings.FIRST_SUPERUSER_PASSWORD,
    is_superuser=True
)
user.create(user_obj)
"
```

## Phase 8: Testing and Validation

### 8.1 Health Checks

```bash
# Test frontend
curl -I https://app.assignmentai.com

# Test API
curl -I https://api.assignmentai.com/health

# Test database connection
curl https://api.assignmentai.com/health
```

### 8.2 End-to-End Testing

1. Visit https://app.assignmentai.com
2. Create a new account
3. Verify email (if enabled)
4. Test payment flow with Stripe test card
5. Test core application features
6. Verify webhook delivery in Stripe dashboard

## Cost Breakdown

| Service                       | Monthly Cost | Notes                 |
| ----------------------------- | ------------ | --------------------- |
| RDS PostgreSQL (db.t3.micro)  | $15          | Database              |
| EC2 (t3.small, 1-3 instances) | $25          | Backend application   |
| S3 Storage                    | $1           | Frontend static files |
| CloudFront                    | $5           | CDN for frontend      |
| Route 53                      | $1           | DNS hosting           |
| ACM Certificate               | $0           | SSL certificate       |
| CloudWatch                    | $2           | Monitoring and logs   |
| **Total**                     | **~$49**     | Base cost             |

**Additional costs:**

- Data transfer: $0.09/GB after first GB
- Additional storage: $0.10/GB/month
- Auto-scaling: Additional EC2 instances as needed

## Security Checklist

- [ ] VPC configured with private subnets
- [ ] Security groups restrict access
- [ ] RDS encryption enabled
- [ ] SSL certificates installed
- [ ] IAM roles with minimal permissions
- [ ] Database backups configured
- [ ] Monitoring and alerting set up
- [ ] Secrets stored securely (not in code)
- [ ] Rate limiting configured
- [ ] CORS properly configured

## Rollback Plan

1. **Database rollback:** Use RDS snapshots
2. **Application rollback:** Use EB CLI to deploy previous version
3. **Frontend rollback:** Upload previous build to S3
4. **DNS rollback:** Update Route 53 records

## Maintenance Tasks

### Weekly

- Review CloudWatch logs for errors
- Check billing dashboard
- Monitor application performance

### Monthly

- Review and rotate secrets
- Update dependencies
- Review security groups
- Check backup retention

### Quarterly

- Review and update SSL certificates
- Performance testing
- Security audit
- Cost optimization review

## Troubleshooting

### Common Issues

1. **Database connection errors:**

   - Check security groups allow traffic on port 5432
   - Verify database credentials
   - Check VPC configuration

2. **Frontend not loading:**

   - Verify S3 bucket policy
   - Check CloudFront distribution
   - Validate DNS records

3. **API errors:**

   - Check EB application logs
   - Verify environment variables
   - Check load balancer health

4. **SSL certificate issues:**
   - Verify DNS validation completed
   - Check certificate expiration
   - Validate domain ownership

### Useful Commands

```bash
# Check EB application status
eb status

# View application logs
eb logs

# SSH into EB instance
eb ssh

# Check RDS status
aws rds describe-db-instances --db-instance-identifier assignmentai-db

# Monitor CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/EC2 \
  --metric-name CPUUtilization \
  --dimensions Name=InstanceId,Value=i-1234567890abcdef0 \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-01T23:59:59Z \
  --period 3600 \
  --statistics Average
```

This deployment guide provides a complete, production-ready setup for AssignmentAI on AWS with specific configurations, commands, and cost estimates.
