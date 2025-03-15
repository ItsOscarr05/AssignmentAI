# Deployment Guide

This guide explains how to deploy the AssignmentAI application to staging and production environments using AWS ECS.

## Prerequisites

Before deploying, ensure you have the following:

1. AWS CLI installed and configured with appropriate credentials
2. Docker installed and running
3. Sentry CLI installed (for production deployments)
4. Access to the AWS ECR repository
5. Appropriate AWS IAM permissions for ECS, ECR, and CloudWatch

## Environment Setup

The application can be deployed to two environments:

- **Staging**: For testing and validation
- **Production**: For live production use

Each environment has its own:

- ECS Cluster
- ECS Service
- Task Definition
- Load Balancer
- Redis Cache
- Security Groups
- Subnets

## Deployment Scripts

We provide two deployment scripts:

- `scripts/deploy.sh` for Unix-based systems (Linux/macOS)
- `scripts/deploy.ps1` for Windows systems

### Usage

#### Unix Systems

```bash
./scripts/deploy.sh <environment> <version>

# Examples:
./scripts/deploy.sh staging v1.0.0
./scripts/deploy.sh production v1.0.0
```

#### Windows Systems

```powershell
.\scripts\deploy.ps1 -Environment <environment> -Version <version>

# Examples:
.\scripts\deploy.ps1 -Environment staging -Version v1.0.0
.\scripts\deploy.ps1 -Environment production -Version v1.0.0
```

## Deployment Process

The deployment script performs the following steps:

1. **Validation**

   - Checks input parameters
   - Validates environment name
   - Ensures AWS CLI is configured

2. **Build & Push**

   - Builds Docker image using production Dockerfile
   - Tags image with version and latest
   - Pushes images to ECR

3. **Deploy**

   - Updates ECS service with new task definition
   - Forces new deployment
   - Waits for service to stabilize

4. **Verify**

   - Checks if new version is deployed correctly
   - Verifies container image version

5. **Post-Deploy**
   - Creates Sentry release (production only)
   - Runs database migrations
   - Performs health checks

## Monitoring Deployment

You can monitor the deployment through:

1. **AWS Console**

   - ECS Service Events
   - CloudWatch Logs
   - ALB Target Health

2. **Sentry** (Production)

   - Release tracking
   - Error monitoring
   - Performance metrics

3. **Prometheus/Grafana**
   - Application metrics
   - System metrics
   - Custom dashboards

## Rollback Procedure

If issues are detected after deployment:

1. Access the AWS Console or use AWS CLI
2. Navigate to the ECS service
3. Update the service to use the previous task definition
4. Monitor the rollback process
5. Investigate deployment logs for issues

## Troubleshooting

Common issues and solutions:

1. **Service Unstable**

   - Check ECS service events
   - Review container logs in CloudWatch
   - Verify task definition

2. **Image Push Failure**

   - Ensure ECR authentication is current
   - Check Docker build logs
   - Verify AWS credentials

3. **Migration Failures**
   - Check migration logs
   - Verify database connectivity
   - Review migration files

## Security Considerations

1. **Credentials**

   - Never commit AWS credentials
   - Use IAM roles where possible
   - Rotate access keys regularly

2. **Secrets**

   - Use AWS Secrets Manager
   - Encrypt sensitive data
   - Use environment-specific variables

3. **Network**
   - Use private subnets for application
   - Restrict security group access
   - Enable VPC flow logs

## Contact

For deployment issues or questions:

- Create a ticket in the issue tracker
- Contact the DevOps team
- Refer to the internal documentation
