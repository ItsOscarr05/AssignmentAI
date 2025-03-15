# Deployment script for Windows environments
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("staging", "production")]
    [string]$Environment,
    
    [Parameter(Mandatory=$true)]
    [string]$Version
)

# Configuration
$AWS_REGION = "us-west-2"
$ECR_REPOSITORY = "assignmentai-backend"
$CLUSTER_NAME = "${Environment}-cluster"
$SERVICE_NAME = "${Environment}-backend-service"

# Error handling
$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host "`n$Message" -ForegroundColor Cyan
}

try {
    Write-Step "🚀 Starting deployment to $Environment environment..."

    # Configure AWS CLI
    Write-Step "⚙️ Configuring AWS CLI..."
    aws configure set default.region $AWS_REGION

    # Login to ECR
    Write-Step "🔑 Logging into ECR..."
    aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPOSITORY

    # Build the Docker image
    Write-Step "🏗️ Building Docker image..."
    docker build -t "${ECR_REPOSITORY}:${Version}" -f docker/Dockerfile.prod .

    # Tag the image
    Write-Step "🏷️ Tagging image..."
    docker tag "${ECR_REPOSITORY}:${Version}" "${ECR_REPOSITORY}:latest"

    # Push the images
    Write-Step "⬆️ Pushing images to ECR..."
    docker push "${ECR_REPOSITORY}:${Version}"
    docker push "${ECR_REPOSITORY}:latest"

    # Update ECS service
    Write-Step "🔄 Updating ECS service..."
    aws ecs update-service `
        --cluster $CLUSTER_NAME `
        --service $SERVICE_NAME `
        --force-new-deployment

    # Wait for deployment to complete
    Write-Step "⏳ Waiting for deployment to complete..."
    aws ecs wait services-stable `
        --cluster $CLUSTER_NAME `
        --services $SERVICE_NAME

    # Verify deployment
    Write-Step "✅ Verifying deployment..."
    $TASK_DEF = aws ecs describe-services `
        --cluster $CLUSTER_NAME `
        --services $SERVICE_NAME `
        --query 'services[0].taskDefinition' `
        --output text

    $NEW_IMAGE = aws ecs describe-task-definition `
        --task-definition $TASK_DEF `
        --query 'taskDefinition.containerDefinitions[0].image' `
        --output text

    if ($NEW_IMAGE -like "*$Version*") {
        Write-Host "✅ Deployment successful! New version: $Version" -ForegroundColor Green
    } else {
        throw "Deployment verification failed!"
    }

    # Create Sentry release if in production
    if ($Environment -eq "production") {
        Write-Step "📊 Creating Sentry release..."
        sentry-cli releases new $Version
        sentry-cli releases set-commits $Version --auto
        sentry-cli releases finalize $Version
    }

    # Run database migrations
    Write-Step "🔄 Running database migrations..."
    aws ecs run-task `
        --cluster $CLUSTER_NAME `
        --task-definition $TASK_DEF `
        --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx],securityGroups=[sg-xxxxx]}" `
        --overrides '{"containerOverrides":[{"name":"backend","command":["python","manage.py","migrate"]}]}'

    Write-Host "`n🎉 Deployment completed successfully!" -ForegroundColor Green
} catch {
    Write-Host "`n❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} 