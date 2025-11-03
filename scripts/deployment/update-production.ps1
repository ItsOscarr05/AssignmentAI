# Production Update Script for AssignmentAI
# Handles different types of updates efficiently

param(
    [string]$ServerIP = "3.237.95.92",
    [string]$KeyPath = "E:\Computer Science\Projects\AssignmentAI\Protected Keys\AssignmentAI server key pair.pem",
    [string]$UpdateType = "env",
    [string]$Service = ""
)

Write-Host "🚀 AssignmentAI Production Update Tool" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Function to run SSH command
function Invoke-SSH {
    param([string]$Command)
    ssh -i $KeyPath "ubuntu@$ServerIP" $Command
}

# Function to run SCP command
function Invoke-SCP {
    param([string]$Source, [string]$Destination)
    scp -i $KeyPath $Source "ubuntu@$ServerIP`:$Destination"
}

switch ($UpdateType.ToLower()) {
    "env" {
        Write-Host "`n📝 Updating environment variables..." -ForegroundColor Yellow
        
        # Copy env file
        Write-Host "Copying .env.production..." -ForegroundColor Gray
        Invoke-SCP "backend\.env.production" "~/AssignmentAI/backend/.env.production"
        
        # Restart services
        Write-Host "Restarting services..." -ForegroundColor Gray
        Invoke-SSH "cd ~/AssignmentAI && docker-compose -f docker-compose.prod.yml restart backend frontend"
        
        Write-Host "✅ Environment variables updated!" -ForegroundColor Green
    }
    
    "config" {
        Write-Host "`n⚙️  Updating configuration files..." -ForegroundColor Yellow
        
        # Copy config files
        Write-Host "Copying configuration files..." -ForegroundColor Gray
        Invoke-SCP "traefik\traefik.yml" "~/AssignmentAI/traefik/traefik.yml"
        
        # Restart Traefik
        Write-Host "Restarting Traefik..." -ForegroundColor Gray
        Invoke-SSH "cd ~/AssignmentAI && docker-compose -f docker-compose.prod.yml restart traefik"
        
        Write-Host "✅ Configuration updated!" -ForegroundColor Green
    }
    
    "backend" {
        Write-Host "`n🔧 Updating backend code..." -ForegroundColor Yellow
        
        # Copy backend files
        Write-Host "Copying backend files..." -ForegroundColor Gray
        Invoke-SCP "backend\" "~/AssignmentAI/backend/"
        
        # Rebuild and restart backend
        Write-Host "Rebuilding backend..." -ForegroundColor Gray
        Invoke-SSH "cd ~/AssignmentAI && docker-compose -f docker-compose.prod.yml build backend"
        Invoke-SSH "cd ~/AssignmentAI && docker-compose -f docker-compose.prod.yml up -d backend"
        
        Write-Host "✅ Backend updated!" -ForegroundColor Green
    }
    
    "frontend" {
        Write-Host "`n🎨 Updating frontend code..." -ForegroundColor Yellow
        
        # Copy frontend files
        Write-Host "Copying frontend files..." -ForegroundColor Gray
        Invoke-SCP "frontend\" "~/AssignmentAI/frontend/"
        
        # Rebuild and restart frontend
        Write-Host "Rebuilding frontend..." -ForegroundColor Gray
        Invoke-SSH "cd ~/AssignmentAI && docker-compose -f docker-compose.prod.yml build frontend"
        Invoke-SSH "cd ~/AssignmentAI && docker-compose -f docker-compose.prod.yml up -d frontend"
        
        Write-Host "✅ Frontend updated!" -ForegroundColor Green
    }
    
    "full" {
        Write-Host "`n🔄 Full project update..." -ForegroundColor Yellow
        
        # Copy entire project
        Write-Host "Copying project files..." -ForegroundColor Gray
        Invoke-SCP "." "~/AssignmentAI/"
        
        # Full rebuild
        Write-Host "Rebuilding all services..." -ForegroundColor Gray
        Invoke-SSH "cd ~/AssignmentAI && docker-compose -f docker-compose.prod.yml down"
        Invoke-SSH "cd ~/AssignmentAI && docker-compose -f docker-compose.prod.yml build --no-cache"
        Invoke-SSH "cd ~/AssignmentAI && docker-compose -f docker-compose.prod.yml up -d"
        
        Write-Host "✅ Full update completed!" -ForegroundColor Green
    }
    
    "migrate" {
        Write-Host "`n🗄️  Running database migrations..." -ForegroundColor Yellow
        
        Invoke-SSH "cd ~/AssignmentAI && docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head"
        
        Write-Host "✅ Database migrations completed!" -ForegroundColor Green
    }
    
    "logs" {
        Write-Host "`n📋 Showing logs..." -ForegroundColor Yellow
        
        if ($Service) {
            Invoke-SSH "cd ~/AssignmentAI && docker-compose -f docker-compose.prod.yml logs -f $Service"
        } else {
            Invoke-SSH "cd ~/AssignmentAI && docker-compose -f docker-compose.prod.yml logs -f"
        }
    }
    
    default {
        Write-Host "`n❓ Usage examples:" -ForegroundColor Yellow
        Write-Host "  .\update-production.ps1 -UpdateType env" -ForegroundColor Gray
        Write-Host "  .\update-production.ps1 -UpdateType backend" -ForegroundColor Gray
        Write-Host "  .\update-production.ps1 -UpdateType frontend" -ForegroundColor Gray
        Write-Host "  .\update-production.ps1 -UpdateType config" -ForegroundColor Gray
        Write-Host "  .\update-production.ps1 -UpdateType full" -ForegroundColor Gray
        Write-Host "  .\update-production.ps1 -UpdateType migrate" -ForegroundColor Gray
        Write-Host "  .\update-production.ps1 -UpdateType logs -Service traefik" -ForegroundColor Gray
    }
}

Write-Host "`n🎉 Update completed!" -ForegroundColor Green 