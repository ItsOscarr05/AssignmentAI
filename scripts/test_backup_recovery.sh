#!/bin/bash

# Test backup and recovery script for AssignmentAI
# This script tests the backup and recovery process for both database and file storage

# Set error handling
set -e
trap 'echo "Error: $? at line $LINENO"' ERR

# Load environment variables
source .env

# Configuration
BACKUP_DIR="/backup"
TEST_DIR="/tmp/backup_test"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="assignmentai"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"

# Create test directory
mkdir -p $TEST_DIR

echo "Starting backup and recovery test..."

# 1. Database Backup Test
echo "Testing database backup..."

# Create test data
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << EOF
CREATE TABLE IF NOT EXISTS backup_test (
    id SERIAL PRIMARY KEY,
    test_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO backup_test (test_data) VALUES ('Test data for backup');
EOF

# Perform backup
echo "Creating database backup..."
pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME > $BACKUP_DIR/db_backup_$TIMESTAMP.sql

# Verify backup file exists
if [ ! -f $BACKUP_DIR/db_backup_$TIMESTAMP.sql ]; then
    echo "Error: Database backup file not created"
    exit 1
fi

echo "Database backup created successfully"

# 2. File Storage Backup Test
echo "Testing file storage backup..."

# Create test files
mkdir -p $TEST_DIR/test_files
echo "Test file content" > $TEST_DIR/test_files/test1.txt
echo "Another test file" > $TEST_DIR/test_files/test2.txt

# Perform backup
echo "Creating file storage backup..."
tar -czf $BACKUP_DIR/files_backup_$TIMESTAMP.tar.gz -C $TEST_DIR test_files

# Verify backup file exists
if [ ! -f $BACKUP_DIR/files_backup_$TIMESTAMP.tar.gz ]; then
    echo "Error: File storage backup not created"
    exit 1
fi

echo "File storage backup created successfully"

# 3. Recovery Test
echo "Testing recovery process..."

# Create recovery test directory
mkdir -p $TEST_DIR/recovery_test

# Database Recovery Test
echo "Testing database recovery..."

# Drop test table
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << EOF
DROP TABLE IF EXISTS backup_test;
EOF

# Restore from backup
echo "Restoring database from backup..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME < $BACKUP_DIR/db_backup_$TIMESTAMP.sql

# Verify recovery
RECOVERY_CHECK=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM backup_test;")
if [ "$RECOVERY_CHECK" -eq 0 ]; then
    echo "Error: Database recovery failed"
    exit 1
fi

echo "Database recovery successful"

# File Storage Recovery Test
echo "Testing file storage recovery..."

# Remove test files
rm -rf $TEST_DIR/test_files

# Restore from backup
echo "Restoring files from backup..."
tar -xzf $BACKUP_DIR/files_backup_$TIMESTAMP.tar.gz -C $TEST_DIR

# Verify recovery
if [ ! -f $TEST_DIR/test_files/test1.txt ] || [ ! -f $TEST_DIR/test_files/test2.txt ]; then
    echo "Error: File storage recovery failed"
    exit 1
fi

echo "File storage recovery successful"

# 4. Cleanup
echo "Cleaning up test data..."

# Remove test table
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << EOF
DROP TABLE IF EXISTS backup_test;
EOF

# Remove test files
rm -rf $TEST_DIR

echo "Backup and recovery test completed successfully" 