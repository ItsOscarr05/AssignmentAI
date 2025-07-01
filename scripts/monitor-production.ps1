# =============================================================================
# AssignmentAI Production Monitoring Script
# =============================================================================
# This script monitors the production environment and sends alerts if issues are detected

param(
    [string]$ConfigFile = ".env.production",
    [switch]$Silent,
    [switch]$EmailAlerts
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

# Configuration
$FRONTEND_URL = "https://assignmentai.app"
$API_URL = "https://api.assignmentai.app"
$MONITORING_URL = "https://monitoring.assignmentai.app"
$ALERT_EMAIL = $env:ALERT_EMAIL
$SMTP_SERVER = $env:SMTP_HOST
$SMTP_PORT = $env:SMTP_PORT
$SMTP_USER = $env:SMTP_USER
$SMTP_PASSWORD = $env:SMTP_PASSWORD

# Thresholds
$CPU_THRESHOLD = 80
$MEMORY_THRESHOLD = 85
$DISK_THRESHOLD = 90
$RESPONSE_TIME_THRESHOLD = 5000  # 5 seconds

function Write-Status {
    param([string]$Message, [string]$Color = "White")
    if (-not $Silent) {
        Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Message" -ForegroundColor $Color
    }
}

function Write-Error {
    param([string]$Message)
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ERROR: $Message" -ForegroundColor Red
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] WARNING: $Message" -ForegroundColor Yellow
}

function Send-EmailAlert {
    param([string]$Subject, [string]$Body)
    
    if (-not $EmailAlerts -or -not $ALERT_EMAIL) {
        return
    }
    
    try {
        $smtp = New-Object System.Net.Mail.SmtpClient($SMTP_SERVER, $SMTP_PORT)
        $smtp.EnableSsl = $true
        $smtp.Credentials = New-Object System.Net.NetworkCredential($SMTP_USER, $SMTP_PASSWORD)
        
        $mail = New-Object System.Net.Mail.MailMessage
        $mail.From = $SMTP_USER
        $mail.To.Add($ALERT_EMAIL)
        $mail.Subject = "AssignmentAI Alert: $Subject"
        $mail.Body = $Body
        $mail.IsBodyHtml = $true
        
        $smtp.Send($mail)
        Write-Status "Alert email sent to $ALERT_EMAIL" "Green"
    }
    catch {
        Write-Error "Failed to send alert email: $($_.Exception.Message)"
    }
}

function Test-HealthEndpoint {
    param([string]$Url, [string]$ServiceName)
    
    try {
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        $response = Invoke-WebRequest -Uri "$Url/health" -TimeoutSec 10 -UseBasicParsing
        $stopwatch.Stop()
        
        if ($response.StatusCode -eq 200) {
            $responseTime = $stopwatch.ElapsedMilliseconds
            Write-Status "$ServiceName is healthy (${responseTime}ms)" "Green"
            
            if ($responseTime -gt $RESPONSE_TIME_THRESHOLD) {
                Write-Warning "$ServiceName response time is slow: ${responseTime}ms"
                Send-EmailAlert "Slow Response Time" "$ServiceName is responding slowly (${responseTime}ms)"
            }
            
            return $true
        } else {
            Write-Error "$ServiceName returned status code: $($response.StatusCode)"
            Send-EmailAlert "Service Unhealthy" "$ServiceName returned status code: $($response.StatusCode)"
            return $false
        }
    }
    catch {
        Write-Error "$ServiceName is unreachable: $($_.Exception.Message)"
        Send-EmailAlert "Service Unreachable" "$ServiceName is unreachable: $($_.Exception.Message)"
        return $false
    }
}

function Test-DockerServices {
    try {
        $services = docker-compose -f docker-compose.prod.yml ps --format json | ConvertFrom-Json
        
        $unhealthyServices = @()
        foreach ($service in $services) {
            if ($service.State -ne "Up") {
                $unhealthyServices += $service.Name
                Write-Error "Service $($service.Name) is not running (State: $($service.State))"
            }
        }
        
        if ($unhealthyServices.Count -gt 0) {
            Send-EmailAlert "Docker Services Down" "The following services are not running: $($unhealthyServices -join ', ')"
            return $false
        } else {
            Write-Status "All Docker services are running" "Green"
            return $true
        }
    }
    catch {
        Write-Error "Failed to check Docker services: $($_.Exception.Message)"
        return $false
    }
}

function Test-SystemResources {
    try {
        # Get CPU usage
        $cpu = Get-Counter "\Processor(_Total)\% Processor Time" | Select-Object -ExpandProperty CounterSamples | Select-Object -ExpandProperty CookedValue
        Write-Status "CPU Usage: $([math]::Round($cpu, 2))%" $(if ($cpu -gt $CPU_THRESHOLD) { "Yellow" } else { "Green" })
        
        # Get memory usage
        $memory = Get-Counter "\Memory\% Committed Bytes In Use" | Select-Object -ExpandProperty CounterSamples | Select-Object -ExpandProperty CookedValue
        Write-Status "Memory Usage: $([math]::Round($memory, 2))%" $(if ($memory -gt $MEMORY_THRESHOLD) { "Yellow" } else { "Green" })
        
        # Get disk usage
        $disk = Get-WmiObject -Class Win32_LogicalDisk -Filter "DeviceID='C:'" | Select-Object -ExpandProperty FreeSpace, Size
        $diskPercent = (($disk.Size - $disk.FreeSpace) / $disk.Size) * 100
        Write-Status "Disk Usage: $([math]::Round($diskPercent, 2))%" $(if ($diskPercent -gt $DISK_THRESHOLD) { "Yellow" } else { "Green" })
        
        # Send alerts if thresholds exceeded
        if ($cpu -gt $CPU_THRESHOLD) {
            Send-EmailAlert "High CPU Usage" "CPU usage is $([math]::Round($cpu, 2))% (threshold: $CPU_THRESHOLD%)"
        }
        
        if ($memory -gt $MEMORY_THRESHOLD) {
            Send-EmailAlert "High Memory Usage" "Memory usage is $([math]::Round($memory, 2))% (threshold: $MEMORY_THRESHOLD%)"
        }
        
        if ($diskPercent -gt $DISK_THRESHOLD) {
            Send-EmailAlert "High Disk Usage" "Disk usage is $([math]::Round($diskPercent, 2))% (threshold: $DISK_THRESHOLD%)"
        }
        
        return $true
    }
    catch {
        Write-Error "Failed to check system resources: $($_.Exception.Message)"
        return $false
    }
}

function Test-DatabaseBackup {
    try {
        # Check if backup was created today
        $backupDir = "./backups"
        if (Test-Path $backupDir) {
            $latestBackup = Get-ChildItem $backupDir -Filter "*.sql" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
            
            if ($latestBackup) {
                $backupAge = (Get-Date) - $latestBackup.LastWriteTime
                if ($backupAge.TotalHours -lt 24) {
                    Write-Status "Database backup is recent ($([math]::Round($backupAge.TotalHours, 1)) hours ago)" "Green"
                    return $true
                } else {
                    Write-Warning "Database backup is old ($([math]::Round($backupAge.TotalHours, 1)) hours ago)"
                    Send-EmailAlert "Old Database Backup" "Last database backup was $([math]::Round($backupAge.TotalHours, 1)) hours ago"
                    return $false
                }
            } else {
                Write-Error "No database backups found"
                Send-EmailAlert "No Database Backup" "No database backup files found in $backupDir"
                return $false
            }
        } else {
            Write-Error "Backup directory not found: $backupDir"
            return $false
        }
    }
    catch {
        Write-Error "Failed to check database backup: $($_.Exception.Message)"
        return $false
    }
}

function Test-SSLCertificates {
    try {
        [System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
        $request = [System.Net.WebRequest]::Create($FRONTEND_URL)
        $null = $request.GetResponse()  # We need to make the request to get the certificate
        $cert = $request.ServicePoint.Certificate
        
        if ($cert) {
            $expiryDate = $cert.GetExpirationDateString()
            $expiry = [DateTime]::Parse($expiryDate)
            $daysUntilExpiry = ($expiry - (Get-Date)).Days
            
            Write-Status "SSL Certificate expires in $daysUntilExpiry days" $(if ($daysUntilExpiry -lt 30) { "Yellow" } else { "Green" })
            
            if ($daysUntilExpiry -lt 7) {
                Send-EmailAlert "SSL Certificate Expiring Soon" "SSL certificate expires in $daysUntilExpiry days"
            }
            
            return $true
        } else {
            Write-Error "Could not retrieve SSL certificate information"
            return $false
        }
    }
    catch {
        Write-Error "Failed to check SSL certificate: $($_.Exception.Message)"
        return $false
    }
}

# Main monitoring execution
Write-Status "Starting AssignmentAI production monitoring..." "Cyan"

$allChecksPassed = $true

# Test health endpoints
Write-Status "Testing health endpoints..." "Cyan"
$allChecksPassed = $allChecksPassed -and (Test-HealthEndpoint $FRONTEND_URL "Frontend")
$allChecksPassed = $allChecksPassed -and (Test-HealthEndpoint $API_URL "API")
$allChecksPassed = $allChecksPassed -and (Test-HealthEndpoint $MONITORING_URL "Monitoring")

# Test Docker services
Write-Status "Checking Docker services..." "Cyan"
$allChecksPassed = $allChecksPassed -and (Test-DockerServices)

# Test system resources
Write-Status "Checking system resources..." "Cyan"
$allChecksPassed = $allChecksPassed -and (Test-SystemResources)

# Test database backup
Write-Status "Checking database backup..." "Cyan"
$allChecksPassed = $allChecksPassed -and (Test-DatabaseBackup)

# Test SSL certificates
Write-Status "Checking SSL certificates..." "Cyan"
$allChecksPassed = $allChecksPassed -and (Test-SSLCertificates)

# Summary
Write-Status "Monitoring completed at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" "Cyan"
if ($allChecksPassed) {
    Write-Status "All checks passed - system is healthy" "Green"
} else {
    Write-Error "Some checks failed - review the issues above"
    exit 1
} 