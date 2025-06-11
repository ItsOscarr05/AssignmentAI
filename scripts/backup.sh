#!/bin/bash

# Configuration
BACKUP_DIR="/backups"
MONGODB_URI="mongodb://localhost:27017"
S3_BUCKET="assignmentai-backups"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/var/log/backup.log"

# Log function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a $LOG_FILE
}

# Error handling
set -e
trap 'log "Error occurred on line $LINENO. Exit code: $?"' ERR

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Backup MongoDB
log "Starting MongoDB backup..."
mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR/mongodb_$DATE"
log "MongoDB backup completed"

# Backup uploaded files
log "Starting file backup..."
tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" /uploads
log "File backup completed"

# Backup configuration files
log "Starting configuration backup..."
tar -czf "$BACKUP_DIR/config_$DATE.tar.gz" /etc/assignmentai
log "Configuration backup completed"

# Upload to S3
log "Uploading backups to S3..."
aws s3 sync "$BACKUP_DIR" "s3://$S3_BUCKET/backups/$DATE" --delete
log "S3 upload completed"

# Clean up old backups
log "Cleaning up old backups..."
find $BACKUP_DIR -type f -mtime +$RETENTION_DAYS -delete
aws s3 ls "s3://$S3_BUCKET/backups/" | while read -r line; do
    createDate=$(echo $line | awk {'print $1" "$2'})
    createDate=$(date -d "$createDate" +%s)
    olderThan=$(date -d "-$RETENTION_DAYS days" +%s)
    if [[ $createDate -lt $olderThan ]]; then
        fileName=$(echo $line | awk {'print $4'})
        aws s3 rm "s3://$S3_BUCKET/backups/$fileName"
    fi
done
log "Cleanup completed"

# Verify backup integrity
log "Verifying backup integrity..."
for file in $BACKUP_DIR/*; do
    if [[ $file == *.gz ]]; then
        if ! gunzip -t "$file"; then
            log "ERROR: Backup file $file is corrupted!"
            exit 1
        fi
    fi
done
log "Backup verification completed"

# Send notification
if [ -n "$SLACK_WEBHOOK_URL" ]; then
    curl -X POST -H 'Content-type: application/json' \
    --data "{\"text\":\"✅ Backup completed successfully at $(date)\"}" \
    $SLACK_WEBHOOK_URL
fi

log "Backup process completed successfully" 