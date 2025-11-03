#!/bin/bash

# Memory and disk monitoring script
LOG_FILE="$HOME/AssignmentAI/logs/monitor.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# Create logs directory if it doesn't exist
mkdir -p "$HOME/AssignmentAI/logs"

# Thresholds
THRESHOLD_MEMORY=80
THRESHOLD_DISK=85
THRESHOLD_SWAP=70

# Get current usage
MEMORY_USAGE=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100.0)}')
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
SWAP_USAGE=$(free | grep Swap | awk '{if($2>0) printf("%.0f", $3/$2 * 100.0); else print "0"}')

echo "[$DATE] Memory: ${MEMORY_USAGE}%, Disk: ${DISK_USAGE}%, Swap: ${SWAP_USAGE}%" >> "$LOG_FILE"

# Check memory and restart backend if needed
if [ $MEMORY_USAGE -gt $THRESHOLD_MEMORY ]; then
    echo "[$DATE] WARNING: Memory usage is ${MEMORY_USAGE}% - restarting backend" >> "$LOG_FILE"
    docker restart assignmentai_backend_1 >> "$LOG_FILE" 2>&1
fi

# Check disk and run cleanup if needed
if [ $DISK_USAGE -gt $THRESHOLD_DISK ]; then
    echo "[$DATE] WARNING: Disk usage is ${DISK_USAGE}% - running emergency cleanup" >> "$LOG_FILE"
    ~/AssignmentAI/scripts/cleanup.sh
fi

# Check swap usage
if [ "$SWAP_USAGE" -gt "$THRESHOLD_SWAP" ]; then
    echo "[$DATE] WARNING: Swap usage is ${SWAP_USAGE}%" >> "$LOG_FILE"
fi
