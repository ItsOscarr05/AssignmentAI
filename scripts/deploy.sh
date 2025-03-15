#!/bin/bash

# Exit on error
set -e

# Configuration
ENVIRONMENT=$1
VERSION=$2
AWS_REGION="us-west-2"
ECR_REPOSITORY="assignmentai-backend"
CLUSTER_NAME="${ENVIRONMENT}-cluster"
SERVICE_NAME="${ENVIRONMENT}-backend-service"

# Validate input
if [ -z "$ENVIRONMENT" ] || [ -z "$VERSION" ]; then
    echo "Usage: $0 <environment> <version>"
    echo "Example: $0 staging v1.0.0"
    exit 1
fi

# Validate environment
if [ "$ENVIRONMENT" != "staging" ] && [ "$ENVIRONMENT" != "production" ]; then
    echo "Environment must be 'staging' or 'production'"
    exit 1
fi

echo "🚀 Starting deployment to $ENVIRONMENT environment..."

# Configure AWS CLI
echo "⚙️ Configuring AWS CLI..."
aws configure set default.region $AWS_REGION

# Login to ECR
echo "🔑 Logging into ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPOSITORY

# Build the Docker image
echo "🏗️ Building Docker image..."
docker build -t $ECR_REPOSITORY:$VERSION -f docker/Dockerfile.prod .

# Tag the image
echo "🏷️ Tagging image..."
docker tag $ECR_REPOSITORY:$VERSION $ECR_REPOSITORY:latest

# Push the images
echo "⬆️ Pushing images to ECR..."
docker push $ECR_REPOSITORY:$VERSION
docker push $ECR_REPOSITORY:latest

# Update ECS service
echo "🔄 Updating ECS service..."
aws ecs update-service \
    --cluster $CLUSTER_NAME \
    --service $SERVICE_NAME \
    --force-new-deployment

# Wait for deployment to complete
echo "⏳ Waiting for deployment to complete..."
aws ecs wait services-stable \
    --cluster $CLUSTER_NAME \
    --services $SERVICE_NAME

# Verify deployment
echo "✅ Verifying deployment..."
TASK_DEF=$(aws ecs describe-services \
    --cluster $CLUSTER_NAME \
    --services $SERVICE_NAME \
    --query 'services[0].taskDefinition' \
    --output text)

NEW_IMAGE=$(aws ecs describe-task-definition \
    --task-definition $TASK_DEF \
    --query 'taskDefinition.containerDefinitions[0].image' \
    --output text)

if [[ $NEW_IMAGE == *"$VERSION"* ]]; then
    echo "✅ Deployment successful! New version: $VERSION"
else
    echo "❌ Deployment verification failed!"
    exit 1
fi

# Create Sentry release if in production
if [ "$ENVIRONMENT" == "production" ]; then
    echo "📊 Creating Sentry release..."
    sentry-cli releases new $VERSION
    sentry-cli releases set-commits $VERSION --auto
    sentry-cli releases finalize $VERSION
fi

# Run database migrations
echo "🔄 Running database migrations..."
aws ecs run-task \
    --cluster $CLUSTER_NAME \
    --task-definition $TASK_DEF \
    --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx],securityGroups=[sg-xxxxx]}" \
    --overrides '{"containerOverrides":[{"name":"backend","command":["python","manage.py","migrate"]}]}'

echo "🎉 Deployment completed successfully!" 