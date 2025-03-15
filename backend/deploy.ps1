# Deployment script for Windows environments
[CmdletBinding()]
param(
    [ValidateSet("development", "staging", "production")]
    [string]$Environment = "development",
    [switch]$SkipTests,
    [switch]$SkipBuild,
    [switch]$Force
)

# Configuration
$ErrorActionPreference = "Stop"
$deploymentLog = Join-Path $PSScriptRoot "logs/deployment_$(Get-Date -Format 'yyyyMMdd_HHmmss').log"

# Ensure logs directory exists
$logsDir = Join-Path $PSScriptRoot "logs"
if (-not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir | Out-Null
}

function Write-Log {
    param(
        [Parameter(Mandatory=$true)]
        [string]$Message,
        [ValidateSet("Info", "Warning", "Error")]
        [string]$Level = "Info"
    )
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "$timestamp [$Level] - $Message"
    $logMessage | Tee-Object -FilePath $deploymentLog -Append
    
    # Also write to console with color
    switch ($Level) {
        "Warning" { Write-Host $logMessage -ForegroundColor Yellow }
        "Error" { Write-Host $logMessage -ForegroundColor Red }
        default { Write-Host $logMessage }
    }
}

function Test-Prerequisites {
    Write-Log "Checking prerequisites..."
    
    # Check Node.js
    try {
        $nodeVersion = (node -v).Trim()
        if ([version]($nodeVersion -replace 'v','') -lt [version]"14.0.0") {
            throw "Node.js version 14.0.0 or higher is required"
        }
        Write-Log "Node.js version: $nodeVersion"
    }
    catch {
        Write-Log "Node.js check failed: $_" -Level "Error"
        throw "Node.js is not installed or not in PATH"
    }

    # Check npm
    try {
        $npmVersion = (npm -v).Trim()
        Write-Log "npm version: $npmVersion"
    }
    catch {
        Write-Log "npm check failed: $_" -Level "Error"
        throw "npm is not installed or not in PATH"
    }

    # Check TypeScript
    try {
        $tsVersion = (npx tsc -v).Trim()
        Write-Log "TypeScript version: $tsVersion"
    }
    catch {
        Write-Log "TypeScript check failed: $_" -Level "Error"
        throw "TypeScript is not installed. Run: npm install -g typescript"
    }

    # Check environment file
    $envFile = ".env.$Environment"
    if (-not (Test-Path $envFile)) {
        Write-Log "Environment file $envFile not found" -Level "Warning"
        if (-not $Force) {
            throw "Environment file not found. Use -Force to continue anyway."
        }
    }
}

function Backup-Database {
    Write-Log "Creating database backup..."
    try {
        $backupDir = Join-Path $PSScriptRoot "backups"
        if (-not (Test-Path $backupDir)) {
            New-Item -ItemType Directory -Path $backupDir | Out-Null
        }

        $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
        $backupFileName = "backup_{0}_{1}.sql" -f $Environment, $timestamp
        $backupFile = Join-Path $backupDir $backupFileName

        # Get database credentials from environment file
        $envContent = Get-Content ".env.$Environment" -ErrorAction SilentlyContinue
        $dbUser = ($envContent | Where-Object { $_ -match "^DB_USER=" }) -replace "^DB_USER=",""
        $dbName = ($envContent | Where-Object { $_ -match "^DB_NAME=" }) -replace "^DB_NAME=",""

        if ($dbUser -and $dbName) {
            # Create backup
            $pgDumpPath = "pg_dump"
            & $pgDumpPath -U $dbUser -F c -b -v -f $backupFile $dbName
            if ($LASTEXITCODE -ne 0) {
                throw "pg_dump exited with code $LASTEXITCODE"
            }

            # Calculate checksum for integrity
            $hash = Get-FileHash -Path $backupFile -Algorithm SHA256
            $hash.Hash | Set-Content "$backupFile.sha256"

            # Encrypt backup in production
            if ($Environment -eq "production") {
                $keyPath = Join-Path $PSScriptRoot "keys/backup.key"
                Protect-Secrets -FilePath $backupFile -KeyPath $keyPath
            }

            Write-Log "Database backup created successfully at: $backupFile"
        }
        else {
            Write-Log "Database credentials not found in environment file" -Level "Warning"
            if (-not $Force) {
                throw "Database credentials not found. Use -Force to continue anyway."
            }
        }
    }
    catch {
        Write-Log "Database backup failed: $_" -Level "Error"
        throw
    }
}

function Install-Dependencies {
    Write-Log "Installing dependencies..."
    try {
        # Clean npm cache and node_modules
        if (Test-Path "node_modules") {
            Remove-Item -Recurse -Force "node_modules"
        }
        npm cache clean --force

        # Install dependencies
        npm ci --no-audit --no-fund
        if ($LASTEXITCODE -ne 0) {
            throw "npm ci failed with exit code $LASTEXITCODE"
        }
    }
    catch {
        Write-Log "Failed to install dependencies: $_" -Level "Error"
        throw
    }
}

function Invoke-Build {
    if (-not $SkipBuild) {
        Write-Log "Building project..."
        try {
            # Clean previous build
            if (Test-Path "dist") {
                Remove-Item -Recurse -Force "dist"
            }

            # Run build
            npm run build
            if ($LASTEXITCODE -ne 0) {
                throw "Build failed with exit code $LASTEXITCODE"
            }
        }
        catch {
            Write-Log "Build failed: $_" -Level "Error"
            throw
        }
    }
    else {
        Write-Log "Skipping build step..." -Level "Warning"
    }
}

function Invoke-Tests {
    if (-not $SkipTests) {
        Write-Log "Running tests..."
        try {
            npm test
            if ($LASTEXITCODE -ne 0) {
                throw "Tests failed with exit code $LASTEXITCODE"
            }
        }
        catch {
            Write-Log "Tests failed: $_" -Level "Error"
            throw
        }
    }
    else {
        Write-Log "Skipping tests..." -Level "Warning"
    }
}

function Update-Environment {
    Write-Log "Updating environment configuration..."
    
    $envFile = ".env.$Environment"
    if (Test-Path $envFile) {
        try {
            $envContent = Get-Content $envFile
            foreach ($line in $envContent) {
                if ($line -match '^([^=]+)=(.*)$') {
                    $key = $matches[1]
                    $value = $matches[2]
                    [Environment]::SetEnvironmentVariable($key, $value, "Process")
                    Write-Log "Set environment variable: $key"
                }
            }
        }
        catch {
            Write-Log "Failed to update environment variables: $_" -Level "Error"
            throw
        }
    }
    else {
        Write-Log "Environment file $envFile not found" -Level "Warning"
        if (-not $Force) {
            throw "Environment file not found. Use -Force to continue anyway."
        }
    }
}

function Invoke-Migrations {
    Write-Log "Running database migrations..."
    try {
        npm run migration:run
        if ($LASTEXITCODE -ne 0) {
            throw "Database migration failed with exit code $LASTEXITCODE"
        }
    }
    catch {
        Write-Log "Database migration failed: $_" -Level "Error"
        throw
    }
}

function Start-Application {
    Write-Log "Starting application..."
    try {
        $processName = "node"
        $existingProcess = Get-Process $processName -ErrorAction SilentlyContinue
        if ($existingProcess) {
            Write-Log "Stopping existing Node.js process..." -Level "Warning"
            Stop-Process -Name $processName -Force
            Start-Sleep -Seconds 2
        }

        npm run start:prod
        if ($LASTEXITCODE -ne 0) {
            throw "Application failed to start with exit code $LASTEXITCODE"
        }
    }
    catch {
        Write-Log "Failed to start application: $_" -Level "Error"
        throw
    }
}

function Start-Rollback {
    param(
        [string]$FailedStep
    )
    Write-Log "Starting rollback process due to failure in step: $FailedStep" -Level "Warning"
    
    switch ($FailedStep) {
        "Migration" {
            Write-Log "Rolling back database migration..."
            try {
                npm run migration:revert
            }
            catch {
                Write-Log "Failed to rollback migration: $_" -Level "Error"
            }
        }
        "Build" {
            Write-Log "Cleaning build artifacts..."
            if (Test-Path "dist") {
                Remove-Item -Recurse -Force "dist"
            }
        }
        default {
            Write-Log "No specific rollback action for step: $FailedStep" -Level "Warning"
        }
    }
}

function Test-ApplicationHealth {
    param(
        [int]$RetryCount = 5,
        [int]$RetryInterval = 10
    )
    Write-Log "Verifying application health..."
    
    for ($i = 1; $i -le $RetryCount; $i++) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -Method GET -TimeoutSec 30
            if ($response.StatusCode -eq 200) {
                Write-Log "Application health check passed"
                return $true
            }
        }
        catch {
            Write-Log "Health check attempt $i of $RetryCount failed: $_" -Level "Warning"
            if ($i -lt $RetryCount) {
                Write-Log "Waiting $RetryInterval seconds before next attempt..."
                Start-Sleep -Seconds $RetryInterval
            }
        }
    }
    
    throw "Application health check failed after $RetryCount attempts"
}

function Send-DeploymentNotification {
    param(
        [Parameter(Mandatory=$true)]
        [string]$Status,
        [string]$Details = "",
        [ValidateSet("Success", "Warning", "Error")]
        [string]$Level = "Success"
    )
    
    Write-Log "Sending deployment notification..."
    try {
        $webhookUrl = [Environment]::GetEnvironmentVariable("TEAMS_WEBHOOK_URL")
        if (-not $webhookUrl) {
            Write-Log "Teams webhook URL not configured, skipping notification" -Level "Warning"
            return
        }

        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        $color = switch ($Level) {
            "Success" { "00ff00" }
            "Warning" { "ffff00" }
            "Error" { "ff0000" }
        }

        $body = @{
            "@type" = "MessageCard"
            "@context" = "http://schema.org/extensions"
            "summary" = "Deployment Notification"
            "themeColor" = $color
            "title" = "Deployment Status: $Status"
            "sections" = @(
                @{
                    "facts" = @(
                        @{
                            "name" = "Environment"
                            "value" = $Environment
                        },
                        @{
                            "name" = "Status"
                            "value" = $Status
                        },
                        @{
                            "name" = "Timestamp"
                            "value" = $timestamp
                        }
                    )
                    "text" = $Details
                }
            )
        } | ConvertTo-Json -Depth 10

        Invoke-RestMethod -Uri $webhookUrl -Method Post -Body $body -ContentType "application/json"
        Write-Log "Deployment notification sent successfully"
    }
    catch {
        Write-Log "Failed to send deployment notification: $_" -Level "Warning"
    }
}

function Test-Configuration {
    Write-Log "Validating deployment configuration..."
    
    # Required environment variables
    $requiredEnvVars = @(
        @{Name = "NODE_ENV"; Value = $Environment},
        @{Name = "PORT"; Default = "3000"},
        @{Name = "DB_HOST"; Required = $true},
        @{Name = "DB_PORT"; Default = "5432"},
        @{Name = "DB_USER"; Required = $true},
        @{Name = "DB_PASSWORD"; Required = $true},
        @{Name = "DB_NAME"; Required = $true},
        @{Name = "JWT_SECRET"; Required = $true},
        @{Name = "STORAGE_TYPE"; Default = "local"}
    )

    $envFile = ".env.$Environment"
    $missingVars = @()
    $warnings = @()

    if (Test-Path $envFile) {
        $envContent = Get-Content $envFile
        $envHash = @{}
        foreach ($line in $envContent) {
            if ($line -match '^([^=]+)=(.*)$') {
                $envHash[$matches[1]] = $matches[2]
            }
        }

        foreach ($var in $requiredEnvVars) {
            if (-not $envHash.ContainsKey($var.Name)) {
                if ($var.Required) {
                    $missingVars += $var.Name
                } elseif ($var.Default) {
                    $warnings += "Variable $($var.Name) not set, using default value: $($var.Default)"
                }
            }
        }
    } else {
        throw "Environment file $envFile not found"
    }

    # Check for sensitive information in environment files
    $sensitivePatterns = @(
        'password=.+',
        'secret=.+',
        'key=.+'
    )
    
    $envFiles = Get-ChildItem -Path "." -Filter ".env.*"
    foreach ($file in $envFiles) {
        $fileContent = Get-Content $file
        foreach ($pattern in $sensitivePatterns) {
            $sensitiveMatches = $fileContent | Select-String -Pattern $pattern
            if ($sensitiveMatches) {
                $warnings += "Warning: Possible sensitive information found in $($file.Name)"
                break
            }
        }
    }

    # Validate port availability
    $port = if ($envHash.ContainsKey("PORT")) { $envHash["PORT"] } else { "3000" }
    $portInUse = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | 
                 Where-Object LocalPort -eq $port
    if ($portInUse) {
        $warnings += "Port $port is already in use"
    }

    # Check disk space
    $drive = (Get-Item -Path $PSScriptRoot).PSDrive
    $freeSpaceGB = [math]::Round(($drive.Free / 1GB), 2)
    if ($freeSpaceGB -lt 1) {
        $warnings += "Low disk space warning: $freeSpaceGB GB remaining"
    }

    # Report findings
    if ($missingVars.Count -gt 0) {
        throw "Missing required environment variables: $($missingVars -join ', ')"
    }

    foreach ($warning in $warnings) {
        Write-Log $warning -Level "Warning"
    }

    Write-Log "Configuration validation completed"
    return $true
}

function Write-DeploymentMetrics {
    param(
        [string]$Step,
        [DateTime]$StartTime,
        [DateTime]$EndTime,
        [bool]$Success,
        [string]$ErrorMessage = ""
    )
    
    $duration = ($EndTime - $StartTime).TotalSeconds
    $metricsDir = Join-Path $PSScriptRoot "metrics"
    $metricsFile = Join-Path $metricsDir "deployment_metrics.csv"
    
    if (-not (Test-Path $metricsDir)) {
        New-Item -ItemType Directory -Path $metricsDir | Out-Null
    }
    
    if (-not (Test-Path $metricsFile)) {
        "Timestamp,Environment,Step,Duration,Success,ErrorMessage" | Out-File -FilePath $metricsFile
    }
    
    $metrics = [PSCustomObject]@{
        Timestamp = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
        Environment = $Environment
        Step = $Step
        Duration = [math]::Round($duration, 2)
        Success = $Success
        ErrorMessage = $ErrorMessage
    }
    
    "$($metrics.Timestamp),$($metrics.Environment),$($metrics.Step),$($metrics.Duration),$($metrics.Success),$($metrics.ErrorMessage)" |
    Out-File -FilePath $metricsFile -Append
}

function Get-DeploymentStats {
    $metricsFile = Join-Path $PSScriptRoot "metrics/deployment_metrics.csv"
    if (-not (Test-Path $metricsFile)) {
        Write-Log "No deployment metrics found" -Level "Warning"
        return
    }

    $metrics = Import-Csv $metricsFile
    $recentDeployments = $metrics | Where-Object { 
        [DateTime]::ParseExact($_.Timestamp, "yyyy-MM-dd HH:mm:ss", $null) -gt (Get-Date).AddDays(-30)
    }

    $stats = @{
        TotalDeployments = $recentDeployments.Count
        SuccessfulDeployments = ($recentDeployments | Where-Object Success -eq $true).Count
        FailedDeployments = ($recentDeployments | Where-Object Success -eq $false).Count
        AverageDuration = [math]::Round(($recentDeployments | Measure-Object -Property Duration -Average).Average, 2)
        CommonErrors = $recentDeployments | Where-Object Success -eq $false | Group-Object ErrorMessage | 
                      Sort-Object Count -Descending | Select-Object -First 3
    }

    Write-Log "=== Deployment Statistics (Last 30 Days) ==="
    Write-Log "Total Deployments: $($stats.TotalDeployments)"
    Write-Log "Successful Deployments: $($stats.SuccessfulDeployments)"
    Write-Log "Failed Deployments: $($stats.FailedDeployments)"
    Write-Log "Average Duration: $($stats.AverageDuration) seconds"
    
    if ($stats.CommonErrors) {
        Write-Log "Most Common Errors:"
        foreach ($error in $stats.CommonErrors) {
            Write-Log "- $($error.Name) (Count: $($error.Count))" -Level "Warning"
        }
    }
}

function Invoke-Maintenance {
    param(
        [int]$RetentionDays = 30,
        [int]$LogRetentionDays = 30,
        [int]$MetricsRetentionDays = 90,
        [int]$BackupRetentionDays = 30,
        [long]$MinimumFreeSpaceGB = 10
    )
    
    Write-Log "Starting maintenance tasks..."
    $maintenanceErrors = @()
    
    try {
        # Cleanup old log files
        $logsDir = Join-Path $PSScriptRoot "logs"
        if (Test-Path $logsDir) {
            Get-ChildItem -Path $logsDir -Filter "deployment_*.log" | 
            Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$LogRetentionDays) } |
            ForEach-Object {
                try {
                    Remove-Item $_.FullName -Force
                    Write-Log "Removed old log file: $($_.Name)"
                }
                catch {
                    $maintenanceErrors += "Failed to remove log file $($_.Name): $_"
                }
            }
        }

        # Cleanup old metrics
        $metricsDir = Join-Path $PSScriptRoot "metrics"
        if (Test-Path $metricsDir) {
            $metricsFile = Join-Path $metricsDir "deployment_metrics.csv"
            if (Test-Path $metricsFile) {
                try {
                    $metrics = Import-Csv $metricsFile
                    $recentMetrics = $metrics | Where-Object { 
                        [DateTime]::ParseExact($_.Timestamp, "yyyy-MM-dd HH:mm:ss", $null) -gt (Get-Date).AddDays(-$MetricsRetentionDays)
                    }
                    $recentMetrics | Export-Csv $metricsFile -NoTypeInformation -Force
                    Write-Log "Cleaned up metrics older than $MetricsRetentionDays days"
                }
                catch {
                    $maintenanceErrors += "Failed to clean up old metrics: $_"
                }
            }
        }

        # Cleanup old backups
        $backupDir = Join-Path $PSScriptRoot "backups"
        if (Test-Path $backupDir) {
            Get-ChildItem -Path $backupDir -Filter "backup_*.sql" | 
            Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$BackupRetentionDays) } |
            ForEach-Object {
                try {
                    Remove-Item $_.FullName -Force
                    Write-Log "Removed old backup: $($_.Name)"
                }
                catch {
                    $maintenanceErrors += "Failed to remove backup $($_.Name): $_"
                }
            }
        }

        # Check and clean build artifacts
        $distDir = Join-Path $PSScriptRoot "dist"
        $nodeModulesDir = Join-Path $PSScriptRoot "node_modules"
        
        # Only clean build artifacts if they're older than 30 days and not from today's deployment
        $today = (Get-Date).Date
        if (Test-Path $distDir) {
            $distLastWrite = (Get-Item $distDir).LastWriteTime
            if ($distLastWrite.Date -lt $today.AddDays(-30)) {
                Remove-Item $distDir -Recurse -Force
                Write-Log "Cleaned old build artifacts from dist directory"
            }
        }

        # Clean node_modules if they haven't been used recently
        if (Test-Path $nodeModulesDir) {
            $nodeModulesLastWrite = (Get-Item $nodeModulesDir).LastWriteTime
            if ($nodeModulesLastWrite.Date -lt $today.AddDays(-90)) {
                try {
                    Remove-Item $nodeModulesDir -Recurse -Force
                    Write-Log "Cleaned unused node_modules directory"
                }
                catch {
                    $maintenanceErrors += "Failed to clean node_modules directory: $_"
                }
            }
        }

        # Compress logs older than 2 days
        Get-ChildItem -Path $logsDir -Filter "deployment_*.log" | 
        Where-Object { -not $_.PSIsContainer -and $_.LastWriteTime -lt (Get-Date).AddDays(-2) -and -not $_.Name.EndsWith('.gz') } | 
        ForEach-Object {
            try {
                $gzipPath = "$($_.FullName).gz"
                Compress-Archive -Path $_.FullName -DestinationPath $gzipPath -Force
                Remove-Item $_.FullName -Force
                Write-Log "Compressed log file: $($_.Name)"
            }
            catch {
                $maintenanceErrors += "Failed to compress log file $($_.Name): $_"
            }
        }

        # Check disk space and alert if below threshold
        $drive = (Get-Item -Path $PSScriptRoot).PSDrive
        $freeSpaceGB = [math]::Round(($drive.Free / 1GB), 2)
        if ($freeSpaceGB -lt $MinimumFreeSpaceGB) {
            $message = "Low disk space warning: $freeSpaceGB GB remaining (Threshold: $MinimumFreeSpaceGB GB)"
            Write-Log $message -Level "Warning"
            Send-DeploymentNotification -Status "Warning" -Details $message -Level "Warning"
        }

        # Report maintenance results
        if ($maintenanceErrors.Count -gt 0) {
            $errorMessage = "Maintenance completed with errors:`n" + ($maintenanceErrors -join "`n")
            Write-Log $errorMessage -Level "Warning"
        }
        else {
            Write-Log "Maintenance tasks completed successfully"
        }
    }
    catch {
        Write-Log "Maintenance failed: $_" -Level "Error"
        throw
    }
}

function Protect-Secrets {
    param(
        [Parameter(Mandatory=$true)]
        [string]$FilePath,
        [Parameter(Mandatory=$true)]
        [string]$KeyPath
    )
    
    Write-Log "Encrypting sensitive file: $FilePath"
    try {
        # Generate a secure key if it doesn't exist
        if (-not (Test-Path $KeyPath)) {
            $key = New-Object byte[] 32
            [Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($key)
            $key | Set-Content $KeyPath -Encoding Byte
            Write-Log "Generated new encryption key"
        }
        
        $key = Get-Content $KeyPath -Encoding Byte
        $content = Get-Content $FilePath -Raw
        $secureString = ConvertTo-SecureString -String $content -AsPlainText -Force
        $encrypted = ConvertFrom-SecureString -SecureString $secureString -Key $key
        
        $encryptedPath = "$FilePath.enc"
        $encrypted | Set-Content $encryptedPath
        Write-Log "File encrypted successfully: $encryptedPath"
        
        # Securely delete original file
        $content = Get-Content $FilePath -Raw
        $zeros = "0" * $content.Length
        $zeros | Set-Content $FilePath
        Remove-Item $FilePath -Force
    }
    catch {
        Write-Log "Encryption failed: $_" -Level "Error"
        throw
    }
}

function Unprotect-Secrets {
    param(
        [Parameter(Mandatory=$true)]
        [string]$EncryptedPath,
        [Parameter(Mandatory=$true)]
        [string]$KeyPath
    )
    
    Write-Log "Decrypting file: $EncryptedPath"
    try {
        if (-not (Test-Path $KeyPath)) {
            throw "Encryption key not found"
        }
        
        $key = Get-Content $KeyPath -Encoding Byte
        $encrypted = Get-Content $EncryptedPath
        $secureString = ConvertTo-SecureString -String $encrypted -Key $key
        $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureString)
        $decrypted = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
        
        $decryptedPath = $EncryptedPath -replace '\.enc$', ''
        $decrypted | Set-Content $decryptedPath
        Write-Log "File decrypted successfully: $decryptedPath"
    }
    catch {
        Write-Log "Decryption failed: $_" -Level "Error"
        throw
    }
}

function Test-FilePermissions {
    param(
        [string]$Path,
        [bool]$RequireStrictPerms = $false
    )
    
    try {
        $acl = Get-Acl $Path
        $restrictedGroups = @('Everyone', 'BUILTIN\Users', 'NT AUTHORITY\Authenticated Users')
        $hasRestrictedAccess = $false
        
        foreach ($access in $acl.Access) {
            if ($restrictedGroups -contains $access.IdentityReference.Value -and 
                $access.FileSystemRights -match "(Modify|FullControl)") {
                $hasRestrictedAccess = $true
                Write-Log "Warning: $Path has overly permissive permissions for $($access.IdentityReference.Value)" -Level "Warning"
            }
        }
        
        return -not $hasRestrictedAccess
    }
    catch {
        Write-Log "Failed to check file permissions: $_" -Level "Error"
        return $false
    }
}

function Test-NetworkSecurity {
    param(
        [string]$Environment,
        [int[]]$RequiredPorts = @(80, 443, 3000)
    )
    
    Write-Log "Checking network security configuration..."
    $issues = @()
    
    try {
        # Check firewall rules
        $rules = Get-NetFirewallRule | Where-Object { 
            $_.Enabled -eq $true -and $_.Direction -eq "Inbound"
        }
        
        foreach ($rule in $rules) {
            $ports = $rule | Get-NetFirewallPortFilter
            if ($ports.LocalPort -eq "Any") {
                $issues += "Overly permissive firewall rule detected: $($rule.Name)"
            }
        }
        
        # Verify required ports
        $openPorts = Get-NetTCPConnection -State Listen |
                    Select-Object -ExpandProperty LocalPort
        foreach ($port in $RequiredPorts) {
            if ($port -notin $openPorts) {
                $issues += "Required port $port is not open"
            }
        }
        
        # Check for unauthorized listening ports
        $suspiciousPorts = @(21, 23, 445, 3389) # FTP, Telnet, SMB, RDP
        foreach ($port in $openPorts) {
            if ($port -in $suspiciousPorts) {
                $issues += "Suspicious port $port is open"
            }
        }
        
        # Check network adapter settings
        $adapters = Get-NetAdapter | Where-Object Status -eq "Up"
        foreach ($adapter in $adapters) {
            # Check for promiscuous mode
            if ($adapter.PromiscuousMode) {
                $issues += "Network adapter in promiscuous mode: $($adapter.Name)"
            }
            
            # Verify IPv6 privacy
            $ipv6 = Get-NetIPv6Protocol
            if ($ipv6.RandomizeIdentifiers -eq "Disabled") {
                $issues += "IPv6 privacy extensions disabled"
            }
        }
        
        # Check DNS security
        $dnsServers = Get-DnsClientServerAddress
        foreach ($server in $dnsServers) {
            if ($server.ServerAddresses -contains "8.8.8.8") {
                $issues += "Using public DNS servers in production"
            }
        }
        
        # Verify network encryption
        $tlsSettings = Get-TlsCipherSuite
        if ($tlsSettings | Where-Object { $_.Name -match "TLS_1.0|TLS_1.1" }) {
            $issues += "Weak TLS versions enabled"
        }
    }
    catch {
        Write-Log "Network security check failed: $_" -Level "Error"
        $issues += "Failed to verify network security: $_"
    }
    
    return $issues
}

function Test-ContainerSecurity {
    param(
        [string]$Environment
    )
    
    Write-Log "Checking container security configuration..."
    $issues = @()
    
    try {
        # Check if Docker is installed
        if (Get-Command "docker" -ErrorAction SilentlyContinue) {
            # Check Docker daemon configuration
            $daemonConfig = Get-Content "/etc/docker/daemon.json" -ErrorAction SilentlyContinue | ConvertFrom-Json
            if ($daemonConfig) {
                if (-not $daemonConfig.LiveRestore) {
                    $issues += "Docker live restore not enabled"
                }
                if (-not $daemonConfig.InterContainerCommunication) {
                    $issues += "Inter-container communication not restricted"
                }
            }
            
            # Check running containers
            $containers = docker ps --format "{{.Names}}" 2>$null
            foreach ($container in $containers) {
                # Check container user
                $user = docker inspect --format '{{.Config.User}}' $container
                if (-not $user -or $user -eq "root") {
                    $issues += "Container running as root: $container"
                }
                
                # Check container capabilities
                $caps = docker inspect --format '{{.HostConfig.CapAdd}}' $container
                if ($caps -match "ALL") {
                    $issues += "Container has excessive capabilities: $container"
                }
                
                # Check mount points
                $mounts = docker inspect --format '{{range .Mounts}}{{.Source}}:{{.Destination}} {{end}}' $container
                if ($mounts -match "/etc|/var/run/docker.sock") {
                    $issues += "Sensitive mount points detected in container: $container"
                }
            }
            
            # Check image security
            $images = docker images --format "{{.Repository}}:{{.Tag}}" 2>$null
            foreach ($image in $images) {
                # Check for latest tag
                if ($image -match ":latest$") {
                    $issues += "Container using latest tag: $image"
                }
                
                # Check image vulnerabilities if Trivy is available
                if (Get-Command "trivy" -ErrorAction SilentlyContinue) {
                    $vulns = trivy image $image --severity HIGH,CRITICAL --quiet 2>$null
                    if ($vulns) {
                        $issues += "High/Critical vulnerabilities found in image: $image"
                    }
                }
            }
        }
    }
    catch {
        Write-Log "Container security check failed: $_" -Level "Error"
        $issues += "Failed to verify container security: $_"
    }
    
    return $issues
}

function Test-HardwareSecurity {
    param(
        [string]$Environment
    )
    
    Write-Log "Checking hardware security features..."
    $issues = @()
    
    try {
        # Check TPM status
        $tpm = Get-Tpm
        if (-not $tpm.TpmPresent) {
            $issues += "TPM not available"
        }
        elseif (-not $tpm.TpmReady) {
            $issues += "TPM not ready"
        }
        
        # Check Secure Boot
        $secureBootStatus = Confirm-SecureBootUEFI -ErrorAction SilentlyContinue
        if (-not $secureBootStatus) {
            $issues += "Secure Boot not enabled"
        }
        
        # Check BitLocker status
        $systemDrive = $env:SystemDrive
        $bitlockerVolume = Get-BitLockerVolume -MountPoint $systemDrive -ErrorAction SilentlyContinue
        if (-not $bitlockerVolume -or $bitlockerVolume.ProtectionStatus -ne "On") {
            $issues += "BitLocker not enabled on system drive"
        }
        
        # Check for virtualization-based security
        $vbs = Get-CimInstance -ClassName Win32_DeviceGuard -Namespace root\Microsoft\Windows\DeviceGuard
        if (-not $vbs.VirtualizationBasedSecurityStatus) {
            $issues += "Virtualization-based security not enabled"
        }
        
        # Check memory protection
        $memoryProtection = Get-ProcessMitigation -System
        if (-not $memoryProtection.DEP.Enable) {
            $issues += "DEP not enabled system-wide"
        }
        if (-not $memoryProtection.ASLR.ForceRelocateImages) {
            $issues += "ASLR not fully enabled"
        }
        
        # Check for suspicious hardware
        $usbDevices = Get-PnpDevice -Class USB -ErrorAction SilentlyContinue
        foreach ($device in $usbDevices) {
            if ($device.Status -eq "OK" -and $Environment -eq "production") {
                $issues += "USB device detected in production: $($device.FriendlyName)"
            }
        }
    }
    catch {
        Write-Log "Hardware security check failed: $_" -Level "Error"
        $issues += "Failed to verify hardware security: $_"
    }
    
    return $issues
}

function Test-ComplianceRequirements {
    param(
        [string]$Environment,
        [string[]]$ComplianceFrameworks = @("PCI-DSS", "HIPAA", "GDPR")
    )
    
    Write-Log "Checking compliance requirements..."
    $issues = @()
    
    try {
        foreach ($framework in $ComplianceFrameworks) {
            switch ($framework) {
                "PCI-DSS" {
                    # Check PCI-DSS requirements
                    
                    # Requirement 2: Do not use vendor-supplied defaults
                    $defaultAccounts = Get-LocalUser | Where-Object {
                        $_.Name -in @("Administrator", "Guest") -and $_.Enabled
                    }
                    if ($defaultAccounts) {
                        $issues += "PCI-DSS 2.1: Default accounts still enabled"
                    }
                    
                    # Requirement 3: Protect stored cardholder data
                    $sensitiveFiles = Get-ChildItem -Path $PSScriptRoot -Recurse |
                                    Where-Object { $_.Name -match "(card|ccnum|pan)" }
                    if ($sensitiveFiles) {
                        $issues += "PCI-DSS 3.1: Possible unencrypted card data"
                    }
                    
                    # Requirement 8: Identify and authenticate access
                    $passwordPolicy = Get-LocalSecurityPolicy
                    if ($passwordPolicy.PasswordComplexity -eq 0) {
                        $issues += "PCI-DSS 8.2: Weak password policy"
                    }
                }
                
                "HIPAA" {
                    # Check HIPAA requirements
                    
                    # Access Controls
                    $auditPolicy = auditpol /get /category:"Object Access" | Out-String
                    if ($auditPolicy -notmatch "Success and Failure") {
                        $issues += "HIPAA 164.312(b): Insufficient audit controls"
                    }
                    
                    # Encryption
                    if ($Environment -eq "production") {
                        $tlsVersion = [Net.ServicePointManager]::SecurityProtocol
                        if ($tlsVersion -lt [Net.SecurityProtocolType]::Tls12) {
                            $issues += "HIPAA 164.312(e)(1): Weak transport encryption"
                        }
                    }
                }
                
                "GDPR" {
                    # Check GDPR requirements
                    
                    # Data Protection
                    $backupEncryption = Get-ItemProperty -Path "HKLM:\System\CurrentControlSet\Control\BitLocker" -ErrorAction SilentlyContinue
                    if (-not $backupEncryption) {
                        $issues += "GDPR Article 32: Backup encryption not configured"
                    }
                    
                    # Data Access Logging
                    $logConfig = Get-LogProperties -ErrorAction SilentlyContinue
                    if (-not $logConfig.Retention) {
                        $issues += "GDPR Article 30: Access logging retention not configured"
                    }
                }
            }
        }
        
        # Check for compliance-specific configurations
        if ($Environment -eq "production") {
            # Check for data classification
            $files = Get-ChildItem -Path $PSScriptRoot -Recurse -File
            foreach ($file in $files) {
                $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
                if ($content -match "(SSN|credit.?card|\b\d{9}\b)") {
                    $issues += "Unclassified sensitive data found in: $($file.Name)"
                }
            }
            
            # Check for proper data handling
            $dataHandlingConfig = Get-Content (Join-Path $PSScriptRoot "config/data-handling.json") -ErrorAction SilentlyContinue | ConvertFrom-Json
            if (-not $dataHandlingConfig.dataRetentionPeriod) {
                $issues += "Data retention period not configured"
            }
            
            # Verify audit logging
            $auditConfig = Get-Content (Join-Path $PSScriptRoot "config/audit.json") -ErrorAction SilentlyContinue | ConvertFrom-Json
            if (-not $auditConfig.enabledEvents.userAccess) {
                $issues += "User access auditing not configured"
            }
        }
    }
    catch {
        Write-Log "Compliance check failed: $_" -Level "Error"
        $issues += "Failed to verify compliance requirements: $_"
    }
    
    return $issues
}

function Test-ApiSecurity {
    param(
        [string]$Environment,
        [int]$MaxRateLimit = 100,
        [int]$MaxTokenExpiry = 3600
    )
    
    Write-Log "Checking API security configuration..."
    $issues = @()
    
    try {
        # Check API configuration files
        $apiConfigPath = Join-Path $PSScriptRoot "config/api.json"
        if (Test-Path $apiConfigPath) {
            $apiConfig = Get-Content $apiConfigPath -Raw | ConvertFrom-Json
            
            # Rate limiting checks
            if (-not $apiConfig.rateLimit -or $apiConfig.rateLimit.requestsPerMinute -gt $MaxRateLimit) {
                $issues += "API rate limiting not properly configured"
            }
            
            # API versioning
            if (-not $apiConfig.versioning -or -not $apiConfig.versioning.enabled) {
                $issues += "API versioning not enabled"
            }
            
            # JWT configuration
            if ($apiConfig.jwt) {
                if ($apiConfig.jwt.expiresIn -gt $MaxTokenExpiry) {
                    $issues += "JWT token expiry too long: $($apiConfig.jwt.expiresIn) seconds"
                }
                if (-not $apiConfig.jwt.refreshToken -or -not $apiConfig.jwt.refreshToken.rotation) {
                    $issues += "JWT refresh token rotation not enabled"
                }
            }
            
            # CORS configuration
            if ($apiConfig.cors) {
                if ($apiConfig.cors.allowedOrigins -contains "*") {
                    $issues += "Overly permissive CORS configuration"
                }
                if (-not $apiConfig.cors.credentials) {
                    $issues += "CORS credentials mode not enabled"
                }
            }
        }
        
        # Check API endpoints for security headers
        $routes = Get-ChildItem -Path (Join-Path $PSScriptRoot "src/routes") -Filter "*.ts" -Recurse
        foreach ($route in $routes) {
            $content = Get-Content $route.FullName -Raw
            
            # Check for security middleware
            if (-not ($content -match "helmet|rateLimit|sanitize")) {
                $issues += "Missing security middleware in route: $($route.Name)"
            }
            
            # Check for input validation
            if (-not ($content -match "validate|sanitize|escape")) {
                $issues += "Missing input validation in route: $($route.Name)"
            }
            
            # Check for error handling
            if (-not ($content -match "try\s*{.*}\s*catch")) {
                $issues += "Missing error handling in route: $($route.Name)"
            }
        }
        
        # Check API documentation for security endpoints
        $swaggerPath = Join-Path $PSScriptRoot "swagger.json"
        if (Test-Path $swaggerPath) {
            $swagger = Get-Content $swaggerPath -Raw | ConvertFrom-Json
            
            # Check security definitions
            if (-not $swagger.securityDefinitions -or -not $swagger.securityDefinitions.Bearer) {
                $issues += "Missing API authentication documentation"
            }
            
            # Check security schemes
            if (-not $swagger.security -or $swagger.security.Count -eq 0) {
                $issues += "No global security scheme defined in API documentation"
            }
        }
        
        # Check for API monitoring
        $monitoringConfig = Join-Path $PSScriptRoot "config/monitoring.json"
        if (Test-Path $monitoringConfig) {
            $config = Get-Content $monitoringConfig -Raw | ConvertFrom-Json
            if (-not $config.apiMetrics -or -not $config.apiMetrics.enabled) {
                $issues += "API monitoring not enabled"
            }
        }
        
        # Check for API gateway configuration (if applicable)
        $gatewayConfig = Join-Path $PSScriptRoot "config/gateway.json"
        if (Test-Path $gatewayConfig) {
            $config = Get-Content $gatewayConfig -Raw | ConvertFrom-Json
            if (-not $config.throttling -or -not $config.throttling.enabled) {
                $issues += "API gateway throttling not configured"
            }
        }
    }
    catch {
        Write-Log "API security check failed: $_" -Level "Error"
        $issues += "Failed to verify API security: $_"
    }
    
    return $issues
}

function Test-MfaConfiguration {
    param(
        [string]$Environment
    )
    
    Write-Log "Checking MFA configuration..."
    $issues = @()
    
    try {
        # Check authentication configuration
        $authConfigPath = Join-Path $PSScriptRoot "config/auth.json"
        if (Test-Path $authConfigPath) {
            $authConfig = Get-Content $authConfigPath -Raw | ConvertFrom-Json
            
            # MFA enforcement
            if ($Environment -eq "production") {
                if (-not $authConfig.mfa -or -not $authConfig.mfa.enabled) {
                    $issues += "MFA not enabled in production environment"
                }
                
                # Check MFA methods
                if ($authConfig.mfa.methods.Count -lt 2) {
                    $issues += "Insufficient MFA methods configured (minimum 2 required)"
                }
                
                # Check backup codes
                if (-not $authConfig.mfa.backupCodes -or -not $authConfig.mfa.backupCodes.enabled) {
                    $issues += "MFA backup codes not configured"
                }
            }
            
            # TOTP configuration
            if ($authConfig.mfa.totp) {
                if ($authConfig.mfa.totp.digits -lt 6) {
                    $issues += "TOTP code length too short"
                }
                if ($authConfig.mfa.totp.step -gt 30) {
                    $issues += "TOTP time step too long"
                }
            }
            
            # Recovery options
            if (-not $authConfig.mfa.recovery -or -not $authConfig.mfa.recovery.enabled) {
                $issues += "MFA recovery options not configured"
            }
            
            # Session handling
            if ($authConfig.session) {
                if ($authConfig.session.mfaRememberDuration -gt 30) {
                    $issues += "MFA remember-me duration too long"
                }
                if (-not $authConfig.session.requireMfaOnNewDevice) {
                    $issues += "MFA not required for new devices"
                }
            }
        }
        
        # Check user roles configuration
        $rolesConfig = Join-Path $PSScriptRoot "config/roles.json"
        if (Test-Path $rolesConfig) {
            $roles = Get-Content $rolesConfig -Raw | ConvertFrom-Json
            
            # Check admin MFA requirement
            $adminRole = $roles.roles | Where-Object { $_.name -eq "admin" }
            if ($adminRole -and -not $adminRole.requireMfa) {
                $issues += "MFA not required for admin role"
            }
        }
        
        # Check MFA enrollment status
        if ($Environment -eq "production") {
            $userConfig = Join-Path $PSScriptRoot "config/users.json"
            if (Test-Path $userConfig) {
                $users = Get-Content $userConfig -Raw | ConvertFrom-Json
                $adminUsers = $users.users | Where-Object { $_.role -eq "admin" }
                
                foreach ($admin in $adminUsers) {
                    if (-not $admin.mfaEnabled) {
                        $issues += "Admin user without MFA: $($admin.username)"
                    }
                }
            }
        }
        
        # Check MFA audit logging
        $auditConfig = Join-Path $PSScriptRoot "config/audit.json"
        if (Test-Path $auditConfig) {
            $audit = Get-Content $auditConfig -Raw | ConvertFrom-Json
            if (-not $audit.mfa -or -not $audit.mfa.logFailedAttempts) {
                $issues += "MFA failure logging not enabled"
            }
        }
    }
    catch {
        Write-Log "MFA configuration check failed: $_" -Level "Error"
        $issues += "Failed to verify MFA configuration: $_"
    }
    
    return $issues
}

function Test-MemoryProtection {
    param(
        [string]$Environment
    )
    
    Write-Log "Checking memory protection features..."
    $issues = @()
    
    try {
        # Check ASLR configuration
        $aslrConfig = Get-ProcessMitigation -System
        if (-not $aslrConfig.ASLR.ForceRelocateImages) {
            $issues += "ASLR not enforced system-wide"
        }
        
        # Check DEP configuration
        if (-not $aslrConfig.DEP.Enable) {
            $issues += "DEP not enabled system-wide"
        }
        
        # Check Control Flow Guard
        $cfgStatus = Get-ProcessMitigation -System | Select-Object -ExpandProperty CFG
        if (-not $cfgStatus.Enable) {
            $issues += "Control Flow Guard not enabled"
        }
        
        # Check for secure memory allocation
        $heapConfig = Get-ProcessMitigation -System | Select-Object -ExpandProperty Heap
        if (-not $heapConfig.TerminateOnError) {
            $issues += "Heap termination on error not enabled"
        }
    }
    catch {
        Write-Log "Memory protection check failed: $_" -Level "Error"
        $issues += "Failed to verify memory protection: $_"
    }
    
    return $issues
}

function Test-RuntimeSecurity {
    param(
        [string]$Environment
    )
    
    Write-Log "Checking runtime security..."
    $issues = @()
    
    try {
        # Check process isolation
        $processIsolation = Get-ProcessMitigation -System | Select-Object -ExpandProperty SEHOP
        if (-not $processIsolation.Enable) {
            $issues += "Process isolation not properly configured"
        }
        
        # Check JIT compilation security
        if ($Environment -eq "production") {
            $nodeConfig = node --v8-options | Select-String "jitless"
            if (-not $nodeConfig) {
                $issues += "JIT hardening not enabled in production"
            }
        }
        
        # Verify stack protection
        $stackConfig = Get-ProcessMitigation -System | Select-Object -ExpandProperty StrictHandle
        if (-not $stackConfig.Enable) {
            $issues += "Stack protection not enabled"
        }
    }
    catch {
        Write-Log "Runtime security check failed: $_" -Level "Error"
        $issues += "Failed to verify runtime security: $_"
    }
    
    return $issues
}

function Test-SecureLogging {
    param(
        [string]$Environment
    )
    
    Write-Log "Checking secure logging configuration..."
    $issues = @()
    
    try {
        # Check log encryption
        $logsPath = Join-Path $PSScriptRoot "logs"
        $logFiles = Get-ChildItem -Path $logsPath -Filter "*.log"
        foreach ($logFile in $logFiles) {
            if (-not (Test-FilePermissions -Path $logFile.FullName -RequireStrictPerms)) {
                $issues += "Insecure log file permissions: $($logFile.Name)"
            }
        }
        
        # Verify log integrity
        $logConfig = Get-Content (Join-Path $PSScriptRoot "config/logging.json") -ErrorAction SilentlyContinue | ConvertFrom-Json
        if (-not $logConfig.signLogs) {
            $issues += "Log signing not enabled"
        }
        
        # Check log rotation
        if (-not $logConfig.rotation -or $logConfig.rotation.maxSize -gt 100MB) {
            $issues += "Log rotation not properly configured"
        }
    }
    catch {
        Write-Log "Secure logging check failed: $_" -Level "Error"
        $issues += "Failed to verify secure logging: $_"
    }
    
    return $issues
}

function Test-CryptographicSecurity {
    param(
        [string]$Environment
    )
    
    Write-Log "Checking cryptographic security..."
    $issues = @()
    
    try {
        # Check TLS configuration
        $tlsConfig = [Net.ServicePointManager]::SecurityProtocol
        if (-not ($tlsConfig -band [Net.SecurityProtocolType]::Tls13)) {
            $issues += "TLS 1.3 not enabled"
        }
        
        # Verify key strength
        $keyConfig = Get-Content (Join-Path $PSScriptRoot "config/crypto.json") -ErrorAction SilentlyContinue | ConvertFrom-Json
        if ($keyConfig.keySize -lt 4096) {
            $issues += "Insufficient key size for cryptographic operations"
        }
        
        # Check for quantum-safe algorithms
        if (-not $keyConfig.quantumSafe) {
            $issues += "Quantum-safe cryptography not configured"
        }
        
        # Verify key rotation
        if (-not $keyConfig.autoRotate -or $keyConfig.rotationPeriod -gt 90) {
            $issues += "Key rotation policy not properly configured"
        }
    }
    catch {
        Write-Log "Cryptographic security check failed: $_" -Level "Error"
        $issues += "Failed to verify cryptographic security: $_"
    }
    
    return $issues
}

function Test-EnhancedAccessControl {
    param(
        [string]$Environment
    )
    
    Write-Log "Checking enhanced access control..."
    $issues = @()
    
    try {
        # Check RBAC configuration
        $rbacConfig = Get-Content (Join-Path $PSScriptRoot "config/rbac.json") -ErrorAction SilentlyContinue | ConvertFrom-Json
        if (-not $rbacConfig.enforceStrictRBAC) {
            $issues += "Strict RBAC not enabled"
        }
        
        # Verify privilege separation
        if (-not $rbacConfig.privilegeSeparation) {
            $issues += "Privilege separation not configured"
        }
        
        # Check for least privilege enforcement
        if (-not $rbacConfig.enforceLeastPrivilege) {
            $issues += "Least privilege principle not enforced"
        }
        
        # Verify session management
        $sessionConfig = Get-Content (Join-Path $PSScriptRoot "config/session.json") -ErrorAction SilentlyContinue | ConvertFrom-Json
        if ($sessionConfig.maxDuration -gt 3600) {
            $issues += "Session duration too long"
        }
    }
    catch {
        Write-Log "Enhanced access control check failed: $_" -Level "Error"
        $issues += "Failed to verify access control: $_"
    }
    
    return $issues
}

function Test-ThreatDetection {
    param(
        [string]$Environment
    )
    
    Write-Log "Checking threat detection capabilities..."
    $issues = @()
    
    try {
        # Check IDS/IPS configuration
        $idsConfig = Get-Content (Join-Path $PSScriptRoot "config/ids.json") -ErrorAction SilentlyContinue | ConvertFrom-Json
        if (-not $idsConfig.enabled) {
            $issues += "Intrusion detection not enabled"
        }
        
        # Verify anomaly detection
        if (-not $idsConfig.anomalyDetection) {
            $issues += "Anomaly detection not configured"
        }
        
        # Check WAF rules
        $wafConfig = Get-Content (Join-Path $PSScriptRoot "config/waf.json") -ErrorAction SilentlyContinue | ConvertFrom-Json
        if (-not $wafConfig.enabled) {
            $issues += "Web Application Firewall not enabled"
        }
        
        # Verify threat intelligence integration
        if (-not $idsConfig.threatIntel -or -not $idsConfig.threatIntel.enabled) {
            $issues += "Threat intelligence integration not configured"
        }
    }
    catch {
        Write-Log "Threat detection check failed: $_" -Level "Error"
        $issues += "Failed to verify threat detection: $_"
    }
    
    return $issues
}

function Test-SecurityRequirements {
    param(
        [string]$Environment = "development",
        [switch]$Force
    )
    
    Write-Log "Performing comprehensive security checks..."
    $securityWarnings = @()
    
    # Core security checks
    $networkSecurityIssues = Test-NetworkSecurity -Environment $Environment
    $securityWarnings += $networkSecurityIssues
    
    $containerSecurityIssues = Test-ContainerSecurity -Environment $Environment
    $securityWarnings += $containerSecurityIssues
    
    $hardwareSecurityIssues = Test-HardwareSecurity -Environment $Environment
    $securityWarnings += $hardwareSecurityIssues
    
    $complianceIssues = Test-ComplianceRequirements -Environment $Environment
    $securityWarnings += $complianceIssues
    
    $apiSecurityIssues = Test-ApiSecurity -Environment $Environment
    $securityWarnings += $apiSecurityIssues
    
    $mfaConfigurationIssues = Test-MfaConfiguration -Environment $Environment
    $securityWarnings += $mfaConfigurationIssues
    
    # New enhanced security checks
    $memoryProtectionIssues = Test-MemoryProtection -Environment $Environment
    $securityWarnings += $memoryProtectionIssues
    
    $runtimeSecurityIssues = Test-RuntimeSecurity -Environment $Environment
    $securityWarnings += $runtimeSecurityIssues
    
    $secureLoggingIssues = Test-SecureLogging -Environment $Environment
    $securityWarnings += $secureLoggingIssues
    
    $cryptographicSecurityIssues = Test-CryptographicSecurity -Environment $Environment
    $securityWarnings += $cryptographicSecurityIssues
    
    $enhancedAccessControlIssues = Test-EnhancedAccessControl -Environment $Environment
    $securityWarnings += $enhancedAccessControlIssues
    
    $threatDetectionIssues = Test-ThreatDetection -Environment $Environment
    $securityWarnings += $threatDetectionIssues
    
    # Report security warnings
    foreach ($warning in $securityWarnings) {
        Write-Log $warning -Level "Warning"
    }
    
    if ($securityWarnings.Count -gt 0 -and $Environment -eq "production" -and -not $Force) {
        throw "Security requirements not met for production environment"
    }
    
    Write-Log "Security check completed with enhanced protections"
    return $true
}

# Main deployment process
$currentStep = "Initialize"
$stepStartTime = $null
$deploymentStartTime = Get-Date

try {
    Write-Log "Starting deployment process for environment: $Environment"
    Send-DeploymentNotification -Status "Started" -Details "Deployment process initiated for $Environment environment"
    
    # Run maintenance tasks before deployment
    $currentStep = "Maintenance"
    $stepStartTime = Get-Date
    Invoke-Maintenance
    Write-DeploymentMetrics -Step $currentStep -StartTime $stepStartTime -EndTime (Get-Date) -Success $true
    
    Get-DeploymentStats
    
    # Add security checks early in the process
    $currentStep = "Security"
    $stepStartTime = Get-Date
    Test-SecurityRequirements -Environment $Environment -Force:$Force
    Write-DeploymentMetrics -Step $currentStep -StartTime $stepStartTime -EndTime (Get-Date) -Success $true
    
    $currentStep = "Configuration"
    $stepStartTime = Get-Date
    Test-Configuration
    Write-DeploymentMetrics -Step $currentStep -StartTime $stepStartTime -EndTime (Get-Date) -Success $true

    $currentStep = "Prerequisites"
    $stepStartTime = Get-Date
    Test-Prerequisites
    Write-DeploymentMetrics -Step $currentStep -StartTime $stepStartTime -EndTime (Get-Date) -Success $true

    $currentStep = "Backup"
    $stepStartTime = Get-Date
    Backup-Database
    Write-DeploymentMetrics -Step $currentStep -StartTime $stepStartTime -EndTime (Get-Date) -Success $true

    $currentStep = "Dependencies"
    $stepStartTime = Get-Date
    Install-Dependencies
    Write-DeploymentMetrics -Step $currentStep -StartTime $stepStartTime -EndTime (Get-Date) -Success $true

    $currentStep = "Build"
    $stepStartTime = Get-Date
    Invoke-Build
    Write-DeploymentMetrics -Step $currentStep -StartTime $stepStartTime -EndTime (Get-Date) -Success $true

    $currentStep = "Tests"
    $stepStartTime = Get-Date
    Invoke-Tests
    Write-DeploymentMetrics -Step $currentStep -StartTime $stepStartTime -EndTime (Get-Date) -Success $true

    $currentStep = "Environment"
    $stepStartTime = Get-Date
    Update-Environment
    Write-DeploymentMetrics -Step $currentStep -StartTime $stepStartTime -EndTime (Get-Date) -Success $true

    $currentStep = "Migration"
    $stepStartTime = Get-Date
    Invoke-Migrations
    Write-DeploymentMetrics -Step $currentStep -StartTime $stepStartTime -EndTime (Get-Date) -Success $true

    $currentStep = "Start"
    $stepStartTime = Get-Date
    Start-Application
    Write-DeploymentMetrics -Step $currentStep -StartTime $stepStartTime -EndTime (Get-Date) -Success $true
    
    $currentStep = "HealthCheck"
    $stepStartTime = Get-Date
    Test-ApplicationHealth
    Write-DeploymentMetrics -Step $currentStep -StartTime $stepStartTime -EndTime (Get-Date) -Success $true
    
    Write-Log "Deployment completed successfully"
    $deploymentDuration = [math]::Round(((Get-Date) - $deploymentStartTime).TotalMinutes, 2)
    Send-DeploymentNotification -Status "Completed" -Details "Deployment completed successfully in $Environment environment (Duration: $deploymentDuration minutes)" -Level "Success"
}
catch {
    $errorMessage = $_.Exception.Message
    Write-Log "Deployment failed during $currentStep : $errorMessage" -Level "Error"
    if ($stepStartTime) {
        Write-DeploymentMetrics -Step $currentStep -StartTime $stepStartTime -EndTime (Get-Date) -Success $false -ErrorMessage $errorMessage
    }
    Send-DeploymentNotification -Status "Failed" -Details "Deployment failed during $currentStep : $errorMessage" -Level "Error"
    Start-Rollback -FailedStep $currentStep
    throw
}
finally {
    $deploymentDuration = [math]::Round(((Get-Date) - $deploymentStartTime).TotalMinutes, 2)
    Write-Log "Total deployment duration: $deploymentDuration minutes"
}