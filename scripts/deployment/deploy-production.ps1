# Production Deployment Script for AssignmentAI (PowerShell)
# This script ensures only the production .env file is used

param(
    [string]$EnvFile = ".env"
)

Write-Host "🚀 Starting AssignmentAI Production Deployment..." -ForegroundColor Green

# Check if .env file exists
if (-not (Test-Path $EnvFile)) {
    Write-Host "❌ Error: $EnvFile file not found!" -ForegroundColor Red
    Write-Host "Please create .env file from env.production.template" -ForegroundColor Yellow
    Write-Host "Run: Copy-Item env.production.template .env" -ForegroundColor Yellow
    exit 1
}

# Check if Docker is available
try {
    docker --version | Out-Null
} catch {
    Write-Host "❌ Error: Docker is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Check if Docker Compose is available
try {
    docker compose version | Out-Null
} catch {
    Write-Host "❌ Error: Docker Compose is not available" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker and Docker Compose are available" -ForegroundColor Green

# Stop existing containers
Write-Host "🛑 Stopping existing containers..." -ForegroundColor Yellow
docker compose -f docker-compose.prod.yml down

# Clean up old images to save space
Write-Host "🧹 Cleaning up old Docker images..." -ForegroundColor Yellow
docker system prune -f

# Build and start services with explicit .env file
Write-Host "🔨 Building and starting services..." -ForegroundColor Yellow
docker compose -f docker-compose.prod.yml --env-file $EnvFile up -d --build

# Wait for services to be healthy
Write-Host "⏳ Waiting for services to be healthy..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Check service health
Write-Host "🏥 Checking service health..." -ForegroundColor Yellow
docker compose -f docker-compose.prod.yml ps

Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
Write-Host "🌐 Frontend: https://assignmentai.app" -ForegroundColor Cyan
Write-Host "🔧 API: https://api.assignmentai.app" -ForegroundColor Cyan
Write-Host "📊 Monitoring: https://monitoring.assignmentai.app" -ForegroundColor Cyan 