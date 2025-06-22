# =============================================================================
# AssignmentAI Production Deployment Script (PowerShell)
# =============================================================================
# This script sets up and deploys AssignmentAI to production on Windows

param(
    [switch]$SkipChecks,
    [switch]$Force
)

# Function to write colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if running as administrator
if (-not $SkipChecks) {
    $isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
    if ($isAdmin) {
        Write-Error "This script should not be run as administrator"
        exit 1
    }
}

# Check if Docker is installed and running
if (-not $SkipChecks) {
    try {
        docker --version | Out-Null
    }
    catch {
        Write-Error "Docker is not installed. Please install Docker Desktop first."
        exit 1
    }

    try {
        docker info | Out-Null
    }
    catch {
        Write-Error "Docker is not running. Please start Docker Desktop first."
        exit 1
    }
}

# Check if Docker Compose is available
if (-not $SkipChecks) {
    try {
        docker-compose --version | Out-Null
    }
    catch {
        Write-Error "Docker Compose is not available. Please ensure Docker Desktop is properly installed."
        exit 1
    }
}

Write-Status "Starting AssignmentAI production deployment..."

# Create necessary directories
Write-Status "Creating necessary directories..."
$directories = @(
    "traefik",
    "prometheus", 
    "grafana/provisioning",
    "backups",
    "ssl",
    "logs"
)

foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Success "Created directory: $dir"
    }
}

# Generate secure secrets if they don't exist
Write-Status "Generating secure secrets..."

# Generate SECRET_KEY if not exists
if (-not $env:SECRET_KEY) {
    $env:SECRET_KEY = -join ((48..57) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    Write-Warning "Generated new SECRET_KEY. Please save this value securely."
}

# Generate database password if not exists
if (-not $env:POSTGRES_PASSWORD) {
    $env:POSTGRES_PASSWORD = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    Write-Warning "Generated new POSTGRES_PASSWORD. Please save this value securely."
}

# Generate Redis password if not exists
if (-not $env:REDIS_PASSWORD) {
    $env:REDIS_PASSWORD = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    Write-Warning "Generated new REDIS_PASSWORD. Please save this value securely."
}

# Generate Grafana password if not exists
if (-not $env:GRAFANA_PASSWORD) {
    $env:GRAFANA_PASSWORD = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 16 | ForEach-Object {[char]$_})
    Write-Warning "Generated new GRAFANA_PASSWORD. Please save this value securely."
}

# Check required environment variables
Write-Status "Checking required environment variables..."

$requiredVars = @(
    "OPENAI_API_KEY",
    "STRIPE_PUBLISHABLE_KEY", 
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "AWS_BUCKET_NAME",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "SMTP_PASSWORD",
    "ACME_EMAIL"
)

$missingVars = @()

foreach ($var in $requiredVars) {
    if (-not (Test-Path "env:$var")) {
        $missingVars += $var
    }
}

if ($missingVars.Count -gt 0) {
    Write-Error "The following required environment variables are missing:"
    foreach ($var in $missingVars) {
        Write-Host "  - $var" -ForegroundColor Red
    }
    Write-Host ""
    Write-Error "Please set these variables before running the deployment script."
    exit 1
}

# Create production environment files
Write-Status "Creating production environment files..."

# Create main production env file
if (-not (Test-Path ".env.production") -or $Force) {
    if (Test-Path "env.production.template") {
        Copy-Item "env.production.template" ".env.production"
        Write-Success "Created .env.production from template"
    } else {
        Write-Warning "env.production.template not found, skipping .env.production creation"
    }
} else {
    Write-Warning ".env.production already exists, skipping creation"
}

# Create backend production env file
if (-not (Test-Path "backend/.env.production") -or $Force) {
    if (Test-Path "backend/env.production.template") {
        Copy-Item "backend/env.production.template" "backend/.env.production"
        Write-Success "Created backend/.env.production from template"
    } else {
        Write-Warning "backend/env.production.template not found, skipping backend/.env.production creation"
    }
} else {
    Write-Warning "backend/.env.production already exists, skipping creation"
}

# Create frontend production env file
if (-not (Test-Path "frontend/.env.production") -or $Force) {
    if (Test-Path "frontend/env.production.template") {
        Copy-Item "frontend/env.production.template" "frontend/.env.production"
        Write-Success "Created frontend/.env.production from template"
    } else {
        Write-Warning "frontend/env.production.template not found, skipping frontend/.env.production creation"
    }
} else {
    Write-Warning "frontend/.env.production already exists, skipping creation"
}

# Create Traefik configuration
Write-Status "Creating Traefik configuration..."
$traefikConfig = @"
# Traefik Configuration for AssignmentAI Production
api:
  dashboard: true
  insecure: false

entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entrypoint:
          to: websecure
          scheme: https
          permanent: true
  websecure:
    address: ":443"

providers:
  docker:
    endpoint: "unix:///var/run/docker.sock"
    exposedByDefault: false
    network: app-network

certificatesResolvers:
  myresolver:
    acme:
      email: `$env:ACME_EMAIL
      storage: /etc/traefik/acme.json
      tlsChallenge: {}

log:
  level: INFO
  format: json

accessLog:
  format: json
  fields:
    defaultMode: keep
    headers:
      defaultMode: keep

middlewares:
  security:
    headers:
      frameDeny: true
      sslRedirect: true
      browserXssFilter: true
      contentTypeNosniff: true
      forceSTSHeader: true
      stsIncludeSubdomains: true
      stsPreload: true
      stsSeconds: 31536000
      customFrameOptionsValue: "SAMEORIGIN"
      customRequestHeaders:
        X-Forwarded-Proto: "https"
  rate-limit:
    rateLimit:
      burst: 100
      average: 50
  cors:
    headers:
      accessControlAllowMethods:
        - GET
        - POST
        - PUT
        - DELETE
        - OPTIONS
      accessControlAllowHeaders:
        - Authorization
        - Content-Type
        - X-Requested-With
      accessControlAllowOriginList:
        - "https://assignmentai.app"
        - "https://www.assignmentai.app"
      accessControlMaxAge: 86400
      addVaryHeader: true
"@

Set-Content -Path "traefik/traefik.yml" -Value $traefikConfig

# Create Prometheus configuration
Write-Status "Creating Prometheus configuration..."
$prometheusConfig = @"
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'traefik'
    static_configs:
      - targets: ['traefik:8080']
    metrics_path: /metrics

  - job_name: 'backend'
    static_configs:
      - targets: ['backend:8000']
    metrics_path: /metrics
    scrape_interval: 30s

  - job_name: 'postgres'
    static_configs:
      - targets: ['db:5432']
    metrics_path: /metrics

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']
    metrics_path: /metrics

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['host.docker.internal:9100']

  - job_name: 'docker'
    static_configs:
      - targets: ['host.docker.internal:9323']
"@

Set-Content -Path "prometheus/prometheus.yml" -Value $prometheusConfig

# Pull latest images
Write-Status "Pulling latest Docker images..."
docker-compose -f docker-compose.prod.yml pull

# Start services
Write-Status "Starting production services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
Write-Status "Waiting for services to be ready..."
Start-Sleep -Seconds 30

# Check service health
Write-Status "Checking service health..."
$services = docker-compose -f docker-compose.prod.yml ps --format json | ConvertFrom-Json
$runningServices = $services | Where-Object { $_.State -eq "Up" }

if ($runningServices.Count -gt 0) {
    Write-Success "All services are running!"
} else {
    Write-Error "Some services failed to start. Check logs with: docker-compose -f docker-compose.prod.yml logs"
    exit 1
}

# Run database migrations
Write-Status "Running database migrations..."
docker-compose -f docker-compose.prod.yml exec -T backend alembic upgrade head

Write-Success "Deployment completed successfully!"
Write-Host ""
Write-Status "Your AssignmentAI application is now running at:"
Write-Host "  - Frontend: https://assignmentai.app" -ForegroundColor Cyan
Write-Host "  - API: https://api.assignmentai.app" -ForegroundColor Cyan
Write-Host "  - Monitoring: https://monitoring.assignmentai.app" -ForegroundColor Cyan
Write-Host ""
Write-Warning "Important security notes:"
Write-Host "  - Change the default superuser password immediately"
Write-Host "  - Review and update all environment variables"
Write-Host "  - Set up proper monitoring and alerting"
Write-Host "  - Configure backup schedules"
Write-Host ""
Write-Status "To view logs: docker-compose -f docker-compose.prod.yml logs -f"
Write-Status "To stop services: docker-compose -f docker-compose.prod.yml down" 