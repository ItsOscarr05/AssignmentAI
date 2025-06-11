# Load environment variables
if (Test-Path .env) {
    Get-Content .env | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $name = $matches[1]
            $value = $matches[2]
            Set-Item -Path "env:$name" -Value $value
        }
    }
}

# Create backup directory
$BACKUP_DIR = "backup"
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_PATH = Join-Path $BACKUP_DIR "backup_$TIMESTAMP"

# Create backup directory if it doesn't exist
New-Item -ItemType Directory -Force -Path $BACKUP_PATH | Out-Null

# Database backup
Write-Host "Creating database backup..."
$env:PGPASSWORD = $env:DB_PASSWORD
pg_dump -h $env:DB_HOST -U $env:DB_USER -d $env:DB_NAME | Out-File -FilePath (Join-Path $BACKUP_PATH "database.sql")

# Redis backup
Write-Host "Creating Redis backup..."
redis-cli -h $env:REDIS_HOST -a $env:REDIS_PASSWORD SAVE
Copy-Item "C:\Program Files\Redis\dump.rdb" -Destination (Join-Path $BACKUP_PATH "redis.rdb")

# File storage backup (if using AWS S3)
if ($env:AWS_BUCKET_NAME) {
    Write-Host "Creating S3 backup..."
    aws s3 sync "s3://$env:AWS_BUCKET_NAME" (Join-Path $BACKUP_PATH "s3_backup")
}

# Compress backup
Write-Host "Compressing backup..."
Compress-Archive -Path $BACKUP_PATH -DestinationPath "$BACKUP_PATH.zip"

# Upload to backup storage (if configured)
if ($env:BACKUP_S3_BUCKET) {
    Write-Host "Uploading backup to S3..."
    aws s3 cp "$BACKUP_PATH.zip" "s3://$env:BACKUP_S3_BUCKET/"
}

# Cleanup old backups (keep last 7 days)
Get-ChildItem -Path $BACKUP_DIR -Filter "backup_*.zip" | 
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) } | 
    Remove-Item -Force

Write-Host "Backup completed successfully!" 