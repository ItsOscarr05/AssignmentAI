# Test backup and recovery script for AssignmentAI
# This script tests the backup and recovery process for both database and file storage

# Set error handling
$ErrorActionPreference = "Stop"

# Configuration
$BACKUP_DIR = "C:\backup"
$TEST_DIR = "C:\temp\backup_test"
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$DB_NAME = "assignmentai"
$DB_USER = "postgres"
$DB_PASSWORD = "postgres"
$DB_HOST = "localhost"
$DB_PORT = "5432"

Write-Host "Starting backup and recovery test..."

# Create necessary directories if they don't exist
if (-not (Test-Path -Path $BACKUP_DIR)) {
    Write-Host "Creating backup directory: $BACKUP_DIR"
    New-Item -ItemType Directory -Path $BACKUP_DIR -Force
}

if (-not (Test-Path -Path $TEST_DIR)) {
    Write-Host "Creating test directory: $TEST_DIR"
    New-Item -ItemType Directory -Path $TEST_DIR -Force
}

# 1. Database Backup Test
Write-Host "Testing database backup..."

# Create test data
$createTableQuery = @"
CREATE TABLE IF NOT EXISTS backup_test (
    id SERIAL PRIMARY KEY,
    test_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO backup_test (test_data) VALUES ('Test data for backup');
"@

$env:PGPASSWORD = $DB_PASSWORD
$createTableQuery | psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME

# Perform backup
Write-Host "Creating database backup..."
pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME > "$BACKUP_DIR\db_backup_$TIMESTAMP.sql"

# Verify backup file exists
if (-not (Test-Path "$BACKUP_DIR\db_backup_$TIMESTAMP.sql")) {
    Write-Error "Error: Database backup file not created"
    exit 1
}

Write-Host "Database backup created successfully"

# 2. File Storage Backup Test
Write-Host "Testing file storage backup..."

# Create test files
$testFilesDir = Join-Path $TEST_DIR "test_files"
New-Item -ItemType Directory -Force -Path $testFilesDir | Out-Null
"Test file content" | Out-File -FilePath (Join-Path $testFilesDir "test1.txt")
"Another test file" | Out-File -FilePath (Join-Path $testFilesDir "test2.txt")

# Perform backup
Write-Host "Creating file storage backup..."
Compress-Archive -Path $testFilesDir -DestinationPath "$BACKUP_DIR\files_backup_$TIMESTAMP.zip" -Force

# Verify backup file exists
if (-not (Test-Path "$BACKUP_DIR\files_backup_$TIMESTAMP.zip")) {
    Write-Error "Error: File storage backup not created"
    exit 1
}

Write-Host "File storage backup created successfully"

# 3. Recovery Test
Write-Host "Testing recovery process..."

# Create recovery test directory
$recoveryTestDir = Join-Path $TEST_DIR "recovery_test"
New-Item -ItemType Directory -Force -Path $recoveryTestDir | Out-Null

# Database Recovery Test
Write-Host "Testing database recovery..."

# Drop test table
$dropTableQuery = "DROP TABLE IF EXISTS backup_test;"
$dropTableQuery | psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME

# Restore from backup
Write-Host "Restoring database from backup..."
Get-Content "$BACKUP_DIR\db_backup_$TIMESTAMP.sql" | psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME

# Verify recovery
$recoveryCheck = "SELECT COUNT(*) FROM backup_test;" | psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t
if ($recoveryCheck -eq 0) {
    Write-Error "Error: Database recovery failed"
    exit 1
}

Write-Host "Database recovery successful"

# File Storage Recovery Test
Write-Host "Testing file storage recovery..."

# Remove test files
Remove-Item -Path $testFilesDir -Recurse -Force

# Restore from backup
Write-Host "Restoring files from backup..."
Expand-Archive -Path "$BACKUP_DIR\files_backup_$TIMESTAMP.zip" -DestinationPath $TEST_DIR -Force

# Verify recovery
if (-not (Test-Path (Join-Path $testFilesDir "test1.txt")) -or -not (Test-Path (Join-Path $testFilesDir "test2.txt"))) {
    Write-Error "Error: File storage recovery failed"
    exit 1
}

Write-Host "File storage recovery successful"

# 4. Cleanup
Write-Host "Cleaning up test data..."

# Remove test table
$dropTableQuery | psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME

# Remove test files
Remove-Item -Path $TEST_DIR -Recurse -Force

Write-Host "Backup and recovery test completed successfully" 