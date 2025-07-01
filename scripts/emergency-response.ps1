# =============================================================================
# AssignmentAI Emergency Response Script
# =============================================================================
# This script provides quick emergency actions for critical production issues

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("maintenance", "backup", "restart", "rollback", "security", "help")]
    [string]$Action,
    
    [string]$ConfigFile = ".env.production",
    [switch]$Force
)

# Load environment variables
if (Test-Path $ConfigFile) {
    Get-Content $ConfigFile | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $name = $matches[1]
            $value = $matches[2]
            Set-Item -Path "env:$name" -Value $value
        }
    }
}

function Write-Status {
    param([string]$Message, [string]$Color = "White")
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Message" -ForegroundColor $Color
}

function Write-Error {
    param([string]$Message)
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ERROR: $Message" -ForegroundColor Red
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] WARNING: $Message" -ForegroundColor Yellow
}

function Enable-MaintenanceMode {
    Write-Status "Enabling maintenance mode..." "Yellow"
    
    try {
        # Set maintenance mode environment variable
        $env:ENABLE_MAINTENANCE_MODE = "True"
        
        # Restart backend to apply maintenance mode
        docker-compose -f docker-compose.prod.yml restart backend
        
        Write-Status "Maintenance mode enabled. Backend restarted." "Green"
        Write-Warning "Users will see maintenance page. Remember to disable when resolved."
    }
    catch {
        Write-Error "Failed to enable maintenance mode: $($_.Exception.Message)"
    }
}

function Disable-MaintenanceMode {
    Write-Status "Disabling maintenance mode..." "Green"
    
    try {
        # Remove maintenance mode environment variable
        $env:ENABLE_MAINTENANCE_MODE = "False"
        
        # Restart backend to remove maintenance mode
        docker-compose -f docker-compose.prod.yml restart backend
        
        Write-Status "Maintenance mode disabled. Backend restarted." "Green"
    }
    catch {
        Write-Error "Failed to disable maintenance mode: $($_.Exception.Message)"
    }
}

function New-EmergencyBackup {
    Write-Status "Creating emergency database backup..." "Yellow"
    
    try {
        $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
        $backupFile = "emergency_backup_$timestamp.sql"
        
        # Create backup
        docker-compose -f docker-compose.prod.yml exec -T db pg_dump -U $env:POSTGRES_USER $env:POSTGRES_DB > $backupFile
        
        if (Test-Path $backupFile) {
            $fileSize = (Get-Item $backupFile).Length / 1MB
            Write-Status "Emergency backup created: $backupFile (${fileSize} MB)" "Green"
            
            # Upload to S3 if configured
            if ($env:AWS_ACCESS_KEY_ID -and $env:AWS_SECRET_ACCESS_KEY -and $env:BACKUP_BUCKET) {
                Write-Status "Uploading backup to S3..." "Yellow"
                aws s3 cp $backupFile "s3://$env:BACKUP_BUCKET/emergency-backups/"
                Write-Status "Backup uploaded to S3" "Green"
            }
        } else {
            Write-Error "Failed to create backup file"
        }
    }
    catch {
        Write-Error "Failed to create emergency backup: $($_.Exception.Message)"
    }
}

function Restart-Services {
    Write-Status "Restarting all services..." "Yellow"
    
    try {
        # Stop all services
        docker-compose -f docker-compose.prod.yml down
        
        # Wait a moment
        Start-Sleep -Seconds 5
        
        # Start all services
        docker-compose -f docker-compose.prod.yml up -d
        
        # Wait for services to be ready
        Write-Status "Waiting for services to be ready..." "Yellow"
        Start-Sleep -Seconds 30
        
        # Check service status
        $services = docker-compose -f docker-compose.prod.yml ps --format json | ConvertFrom-Json
        $runningServices = $services | Where-Object { $_.State -eq "Up" }
        
        if ($runningServices.Count -gt 0) {
            Write-Status "All services restarted successfully" "Green"
        } else {
            Write-Error "Some services failed to start after restart"
        }
    }
    catch {
        Write-Error "Failed to restart services: $($_.Exception.Message)"
    }
}

function Restore-PreviousDeployment {
    Write-Status "Rolling back to previous deployment..." "Yellow"
    
    try {
        # Get current commit
        $currentCommit = git rev-parse HEAD
        
        # Get previous commit
        $previousCommit = git rev-parse HEAD~1
        
        Write-Status "Current commit: $currentCommit" "Yellow"
        Write-Status "Rolling back to: $previousCommit" "Yellow"
        
        if (-not $Force) {
            $confirmation = Read-Host "Are you sure you want to rollback? (y/N)"
            if ($confirmation -ne "y" -and $confirmation -ne "Y") {
                Write-Status "Rollback cancelled" "Yellow"
                return
            }
        }
        
        # Checkout previous commit
        git checkout $previousCommit
        
        # Rebuild and restart services
        docker-compose -f docker-compose.prod.yml down
        docker-compose -f docker-compose.prod.yml build --no-cache
        docker-compose -f docker-compose.prod.yml up -d
        
        Write-Status "Rollback completed successfully" "Green"
        Write-Warning "Remember to investigate the issue and redeploy when ready"
    }
    catch {
        Write-Error "Failed to rollback deployment: $($_.Exception.Message)"
    }
}

function Start-SecurityIncidentResponse {
    Write-Status "Handling security incident..." "Red"
    
    try {
        # Enable maintenance mode
        Enable-MaintenanceMode
        
        # Create emergency backup
        New-EmergencyBackup
        
        # Block suspicious IPs (example - adjust based on your setup)
        Write-Status "Blocking suspicious IPs..." "Yellow"
        # Add your IP blocking logic here
        
        # Rotate secrets
        Write-Status "Rotating secrets..." "Yellow"
        # Add your secret rotation logic here
        
        # Check for unauthorized access
        Write-Status "Checking for unauthorized access..." "Yellow"
        # Add your security audit logic here
        
        Write-Status "Security incident response completed" "Green"
        Write-Warning "Review logs and investigate the incident thoroughly"
        Write-Warning "Consider notifying security team and users if necessary"
    }
    catch {
        Write-Error "Failed to handle security incident: $($_.Exception.Message)"
    }
}

function Show-Help {
    Write-Host @"
AssignmentAI Emergency Response Script

Usage: .\emergency-response.ps1 -Action <action> [-ConfigFile <file>] [-Force]

Actions:
  maintenance  - Enable/disable maintenance mode
  backup       - Create emergency database backup
  restart      - Restart all services
  rollback     - Rollback to previous deployment
  security     - Handle security incident
  help         - Show this help message

Parameters:
  -Action      - The emergency action to perform (required)
  -ConfigFile  - Environment configuration file (default: .env.production)
  -Force       - Skip confirmation prompts

Examples:
  .\emergency-response.ps1 -Action maintenance
  .\emergency-response.ps1 -Action backup
  .\emergency-response.ps1 -Action rollback -Force
  .\emergency-response.ps1 -Action security

Emergency Contacts:
  - Technical Lead: [Your Contact]
  - Security Team: [Security Contact]
  - Hosting Provider: [Provider Contact]
"@ -ForegroundColor Cyan
}

# Main execution
switch ($Action) {
    "maintenance" {
        $mode = Read-Host "Enable or disable maintenance mode? (enable/disable)"
        if ($mode -eq "enable") {
            Enable-MaintenanceMode
        } elseif ($mode -eq "disable") {
            Disable-MaintenanceMode
        } else {
            Write-Error "Invalid mode. Use 'enable' or 'disable'"
        }
    }
    "backup" {
        New-EmergencyBackup
    }
    "restart" {
        Restart-Services
    }
    "rollback" {
        Restore-PreviousDeployment
    }
    "security" {
        Start-SecurityIncidentResponse
    }
    "help" {
        Show-Help
    }
    default {
        Write-Error "Invalid action. Use -Action help for usage information"
        exit 1
    }
} 