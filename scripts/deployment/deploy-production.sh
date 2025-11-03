#!/bin/bash

# Production Deployment Script for AssignmentAI
# This script ensures only the production .env file is used

set -e  # Exit on any error

echo "🚀 Starting AssignmentAI Production Deployment..."

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create .env file from env.production.template"
    echo "Run: cp env.production.template .env && nano .env"
    exit 1
fi

# Validate .env file format (check for Windows line endings)
if grep -q $'\r' .env; then
    echo "⚠️  Warning: .env file has Windows line endings. Converting..."
    dos2unix .env
fi

# Check if required environment variables are set
echo "🔍 Validating environment variables..."

# Source the .env file to check variables
set -a
source .env
set +a

# Check critical variables
required_vars=(
    "POSTGRES_USER"
    "POSTGRES_PASSWORD" 
    "POSTGRES_DB"
    "REDIS_PASSWORD"
    "SECRET_KEY"
    "OPENAI_API_KEY"
    "STRIPE_SECRET_KEY"
    "AWS_ACCESS_KEY_ID"
    "AWS_SECRET_ACCESS_KEY"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: Required environment variable $var is not set in .env file"
        exit 1
    fi
done

echo "✅ Environment variables validated"

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker compose -f docker-compose.prod.yml down

# Clean up old images to save space
echo "🧹 Cleaning up old Docker images..."
docker system prune -f

# Build and start services with explicit .env file
echo "🔨 Building and starting services..."
docker compose -f docker-compose.prod.yml --env-file .env up -d --build

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 30

# Check service health
echo "🏥 Checking service health..."
docker compose -f docker-compose.prod.yml ps

echo "✅ Deployment completed successfully!"
echo "🌐 Frontend: https://assignmentai.app"
echo "🔧 API: https://api.assignmentai.app"
echo "📊 Monitoring: https://monitoring.assignmentai.app" 