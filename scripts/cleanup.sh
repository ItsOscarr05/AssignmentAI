#!/bin/bash

# Automated cleanup script for AssignmentAI
LOG_FILE="$HOME/AssignmentAI/logs/cleanup.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$DATE] Starting automated cleanup..." >> "$LOG_FILE"

# Create logs directory if it doesn't exist
mkdir -p "$HOME/AssignmentAI/logs"

# 1. Clean Docker system
echo "[$DATE] Cleaning Docker system..." >> "$LOG_FILE"
docker system prune -f >> "$LOG_FILE" 2>&1

# 2. Clean old Docker images (older than 7 days)
echo "[$DATE] Cleaning old Docker images..." >> "$LOG_FILE"
docker image prune -a -f --filter "until=168h" >> "$LOG_FILE" 2>&1

# 3. Clean package cache
echo "[$DATE] Cleaning package cache..." >> "$LOG_FILE"
sudo apt clean >> "$LOG_FILE" 2>&1
sudo apt autoremove -y >> "$LOG_FILE" 2>&1

# 4. Clean system logs (keep last 7 days)
echo "[$DATE] Cleaning system logs..." >> "$LOG_FILE"
sudo journalctl --vacuum-time=7d >> "$LOG_FILE" 2>&1

# 5. Clean old log files
echo "[$DATE] Cleaning old log files..." >> "$LOG_FILE"
sudo find /var/log -name "*.log" -mtime +7 -delete >> "$LOG_FILE" 2>&1
sudo find /var/log -name "*.gz" -mtime +7 -delete >> "$LOG_FILE" 2>&1

# 6. Clean old backups (keep last 7 days)
echo "[$DATE] Cleaning old backups..." >> "$LOG_FILE"
find "$HOME/AssignmentAI/backups" -name "*.sql" -mtime +7 -delete >> "$LOG_FILE" 2>&1

# 7. Clean temporary files
echo "[$DATE] Cleaning temporary files..." >> "$LOG_FILE"
sudo rm -rf /tmp/* >> "$LOG_FILE" 2>&1
sudo rm -rf /var/tmp/* >> "$LOG_FILE" 2>&1

# 8. Clean old snap packages
echo "[$DATE] Cleaning old snap packages..." >> "$LOG_FILE"
sudo snap set system refresh.retain=2 >> "$LOG_FILE" 2>&1

# 9. Clean npm cache (if exists)
echo "[$DATE] Cleaning npm cache..." >> "$LOG_FILE"
npm cache clean --force >> "$LOG_FILE" 2>&1 2>/dev/null || true

# 10. Clean pip cache (if exists)
echo "[$DATE] Cleaning pip cache..." >> "$LOG_FILE"
pip cache purge >> "$LOG_FILE" 2>&1 2>/dev/null || true

# Get final disk usage
DISK_USAGE=$(df / | tail -1 | awk '{print $5}')
MEMORY_USAGE=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100.0)}')

echo "[$DATE] Cleanup completed. Disk usage: ${DISK_USAGE}, Memory usage: ${MEMORY_USAGE}%" >> "$LOG_FILE"
echo "[$DATE] Cleanup completed successfully!" >> "$LOG_FILE"