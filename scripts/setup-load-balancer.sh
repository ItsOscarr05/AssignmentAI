#!/bin/bash

# Exit on error
set -e

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | xargs)
fi

# Check required environment variables
required_vars=(
    "AWS_ACCESS_KEY_ID"
    "AWS_SECRET_ACCESS_KEY"
    "AWS_REGION"
    "VPC_ID"
    "DOMAIN_NAME"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "Error: $var is not set"
        exit 1
    fi
done

# Create security group for ALB
echo "Creating security group for ALB..."
SECURITY_GROUP_ID=$(aws ec2 create-security-group \
    --group-name assignmentai-alb-sg \
    --description "Security group for AssignmentAI ALB" \
    --vpc-id $VPC_ID \
    --query 'GroupId' \
    --output text)

# Add inbound rules
aws ec2 authorize-security-group-ingress \
    --group-id $SECURITY_GROUP_ID \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
    --group-id $SECURITY_GROUP_ID \
    --protocol tcp \
    --port 443 \
    --cidr 0.0.0.0/0

# Create target group for backend
echo "Creating target group for backend..."
BACKEND_TARGET_GROUP_ARN=$(aws elbv2 create-target-group \
    --name assignmentai-backend-tg \
    --protocol HTTP \
    --port 3000 \
    --vpc-id $VPC_ID \
    --health-check-path /health \
    --health-check-interval-seconds 30 \
    --health-check-timeout-seconds 5 \
    --healthy-threshold-count 2 \
    --unhealthy-threshold-count 2 \
    --query 'TargetGroups[0].TargetGroupArn' \
    --output text)

# Create target group for frontend
echo "Creating target group for frontend..."
FRONTEND_TARGET_GROUP_ARN=$(aws elbv2 create-target-group \
    --name assignmentai-frontend-tg \
    --protocol HTTP \
    --port 80 \
    --vpc-id $VPC_ID \
    --health-check-path / \
    --health-check-interval-seconds 30 \
    --health-check-timeout-seconds 5 \
    --healthy-threshold-count 2 \
    --unhealthy-threshold-count 2 \
    --query 'TargetGroups[0].TargetGroupArn' \
    --output text)

# Create ALB
echo "Creating Application Load Balancer..."
ALB_ARN=$(aws elbv2 create-load-balancer \
    --name assignmentai-alb \
    --subnets $SUBNET_IDS \
    --security-groups $SECURITY_GROUP_ID \
    --scheme internet-facing \
    --type application \
    --query 'LoadBalancers[0].LoadBalancerArn' \
    --output text)

# Create listener for HTTP
echo "Creating HTTP listener..."
HTTP_LISTENER_ARN=$(aws elbv2 create-listener \
    --load-balancer-arn $ALB_ARN \
    --protocol HTTP \
    --port 80 \
    --default-actions Type=redirect,RedirectConfig='{Protocol=HTTPS,Port=443,Host=#{host},Path=/#{path},Query=#{query},StatusCode=HTTP_301}' \
    --query 'Listeners[0].ListenerArn' \
    --output text)

# Create listener for HTTPS
echo "Creating HTTPS listener..."
HTTPS_LISTENER_ARN=$(aws elbv2 create-listener \
    --load-balancer-arn $ALB_ARN \
    --protocol HTTPS \
    --port 443 \
    --certificates CertificateArn=$ACM_CERTIFICATE_ARN \
    --default-actions Type=fixed-response,FixedResponseConfig='{ContentType=text/plain,MessageBody=Not Found,StatusCode=404}' \
    --query 'Listeners[0].ListenerArn' \
    --output text)

# Create rules for backend
echo "Creating rules for backend..."
aws elbv2 create-rule \
    --listener-arn $HTTPS_LISTENER_ARN \
    --priority 1 \
    --conditions Field=host-header,Values=api.$DOMAIN_NAME \
    --actions Type=forward,TargetGroupArn=$BACKEND_TARGET_GROUP_ARN

# Create rules for frontend
echo "Creating rules for frontend..."
aws elbv2 create-rule \
    --listener-arn $HTTPS_LISTENER_ARN \
    --priority 2 \
    --conditions Field=host-header,Values=$DOMAIN_NAME \
    --actions Type=forward,TargetGroupArn=$FRONTEND_TARGET_GROUP_ARN

# Update environment variables
echo "ALB_ARN=$ALB_ARN" >> .env
echo "BACKEND_TARGET_GROUP_ARN=$BACKEND_TARGET_GROUP_ARN" >> .env
echo "FRONTEND_TARGET_GROUP_ARN=$FRONTEND_TARGET_GROUP_ARN" >> .env

echo "Load balancer setup completed successfully!"
echo "ALB ARN: $ALB_ARN"
echo "Backend Target Group ARN: $BACKEND_TARGET_GROUP_ARN"
echo "Frontend Target Group ARN: $FRONTEND_TARGET_GROUP_ARN" 