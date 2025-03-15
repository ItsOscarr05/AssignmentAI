# Start Celery worker and Flower monitoring
Write-Host "Starting Celery worker and Flower monitoring..."

# Start Celery worker
Start-Process -NoNewWindow -FilePath "celery" -ArgumentList "-A tasks worker --loglevel=info --pool=solo" -RedirectStandardOutput "celery_worker.log"

# Start Flower monitoring
Start-Process -NoNewWindow -FilePath "celery" -ArgumentList "-A tasks flower --port=5555" -RedirectStandardOutput "flower.log"

Write-Host "Celery worker and Flower monitoring started successfully!"
Write-Host "Worker logs: celery_worker.log"
Write-Host "Flower logs: flower.log"
Write-Host "Flower monitoring interface: http://localhost:5555" 