from prometheus_client import Counter, Histogram, Gauge, start_http_server
# from prometheus_fastapi_instrumentator import Instrumentator  # Commented out - not installed
from fastapi import FastAPI
import time
from typing import Optional, Dict, Any
import psutil
import os
import asyncio
import logging
from app.core.config import settings
import sys

logger = logging.getLogger(__name__)

class MonitoringService:
    """A service for monitoring application metrics and system resources.
    
    This service provides comprehensive monitoring capabilities including:
    - HTTP request tracking
    - AI service metrics
    - Database performance metrics
    - Cache hit/miss tracking
    - System resource monitoring
    - Application-specific metrics
    - Error tracking
    """
    
    def __init__(self) -> None:
        """Initialize the monitoring service with all required metrics."""
        try:
            # HTTP metrics
            self.http_requests_total: Counter = Counter(
                "http_requests_total",
                "Total number of HTTP requests",
                ["method", "endpoint", "status"]
            )
            self.http_request_duration: Histogram = Histogram(
                "http_request_duration_seconds",
                "HTTP request duration in seconds",
                ["method", "endpoint"]
            )
            
            # AI service metrics
            self.ai_requests_total: Counter = Counter(
                "ai_requests_total",
                "Total number of AI service requests",
                ["operation"]
            )
            self.ai_request_duration: Histogram = Histogram(
                "ai_request_duration_seconds",
                "AI service request duration in seconds",
                ["operation"]
            )
            
            # Database metrics
            self.db_queries_total: Counter = Counter(
                "db_queries_total",
                "Total number of database queries",
                ["operation"]
            )
            self.db_query_duration: Histogram = Histogram(
                "db_query_duration_seconds",
                "Database query duration in seconds",
                ["operation"]
            )
            
            # Cache metrics
            self.cache_hits_total: Counter = Counter(
                "cache_hits_total",
                "Total number of cache hits",
                ["cache_type"]
            )
            self.cache_misses_total: Counter = Counter(
                "cache_misses_total",
                "Total number of cache misses",
                ["cache_type"]
            )
            
            # System metrics
            self.cpu_usage: Gauge = Gauge(
                "cpu_usage_percent",
                "CPU usage percentage"
            )
            self.memory_usage: Gauge = Gauge(
                "memory_usage_bytes",
                "Memory usage in bytes"
            )
            self.disk_usage: Gauge = Gauge(
                "disk_usage_bytes",
                "Disk usage in bytes"
            )
            
            # Application metrics
            self.active_users: Gauge = Gauge(
                "active_users",
                "Number of active users"
            )
            self.active_assignments: Gauge = Gauge(
                "active_assignments",
                "Number of active assignments"
            )
            self.pending_submissions: Gauge = Gauge(
                "pending_submissions",
                "Number of pending submissions"
            )
            
            # Error metrics
            self.error_total: Counter = Counter(
                "error_total",
                "Total number of errors",
                ["type"]
            )
            
            self._start_time = time.time()
            self._is_running = False
            self._metrics_task: Optional[asyncio.Task] = None
            self._prometheus_server: Optional[Any] = None
            
        except Exception as e:
            logger.error(f"Failed to initialize monitoring service: {str(e)}")
            raise

    def setup_monitoring(self, app: FastAPI) -> None:
        """Setup monitoring for the FastAPI application.
        
        Args:
            app: The FastAPI application instance
            
        Raises:
            RuntimeError: If monitoring setup fails
        """
        try:
            # Start Prometheus HTTP server
            self._prometheus_server = start_http_server(settings.METRICS_PORT)
            
            # Instrument FastAPI app
            # Instrumentator().instrument(app).expose(app)  # Commented out - not installed
            
            # Start system metrics collection
            self._start_system_metrics_collection()
            
            # Add startup event handler
            @app.on_event("startup")
            async def startup_event():
                self._is_running = True
                logger.info("Monitoring service started")
            
            # Add shutdown event handler
            @app.on_event("shutdown")
            async def shutdown_event():
                await self.stop()
                logger.info("Monitoring service stopped")
                
        except Exception as e:
            logger.error(f"Failed to setup monitoring: {str(e)}")
            raise RuntimeError(f"Monitoring setup failed: {str(e)}")

    def _start_system_metrics_collection(self) -> None:
        """Start collecting system metrics in the background."""
        try:
            self._metrics_task = asyncio.create_task(self._collect_system_metrics())
        except Exception as e:
            logger.error(f"Failed to start system metrics collection: {str(e)}")
            raise

    async def _collect_system_metrics(self) -> None:
        """Collect system metrics periodically."""
        while self._is_running:
            try:
                # CPU usage
                self.cpu_usage.set(psutil.cpu_percent())
                
                # Memory usage
                memory = psutil.virtual_memory()
                self.memory_usage.set(memory.used)
                
                # Disk usage
                disk = psutil.disk_usage('/')
                self.disk_usage.set(disk.used)
                
                await asyncio.sleep(15)  # Collect every 15 seconds
                
            except Exception as e:
                logger.error(f"Error collecting system metrics: {str(e)}")
                await asyncio.sleep(60)  # Wait longer on error

    async def stop(self) -> None:
        """Stop the monitoring service and cleanup resources."""
        self._is_running = False
        if self._metrics_task:
            self._metrics_task.cancel()
            try:
                await self._metrics_task
            except asyncio.CancelledError:
                pass
        if self._prometheus_server:
            self._prometheus_server.shutdown()

    def track_request(self, method: str, endpoint: str, status: int, duration: float) -> None:
        """Track HTTP request metrics.
        
        Args:
            method: HTTP method (GET, POST, etc.)
            endpoint: API endpoint path
            status: HTTP status code
            duration: Request duration in seconds
        """
        try:
            self.http_requests_total.labels(
                method=method,
                endpoint=endpoint,
                status=status
            ).inc()
            self.http_request_duration.labels(
                method=method,
                endpoint=endpoint
            ).observe(duration)
        except Exception as e:
            logger.error(f"Error tracking request metrics: {str(e)}")

    def track_ai_request(self, operation: str, duration: float) -> None:
        """Track AI service request metrics.
        
        Args:
            operation: AI operation type
            duration: Request duration in seconds
        """
        try:
            self.ai_requests_total.labels(operation=operation).inc()
            self.ai_request_duration.labels(operation=operation).observe(duration)
        except Exception as e:
            logger.error(f"Error tracking AI request metrics: {str(e)}")

    def track_db_query(self, operation: str, duration: float) -> None:
        """Track database query metrics.
        
        Args:
            operation: Database operation type
            duration: Query duration in seconds
        """
        try:
            self.db_queries_total.labels(operation=operation).inc()
            self.db_query_duration.labels(operation=operation).observe(duration)
        except Exception as e:
            logger.error(f"Error tracking DB query metrics: {str(e)}")

    def track_cache(self, cache_type: str, hit: bool) -> None:
        """Track cache metrics.
        
        Args:
            cache_type: Type of cache (e.g., 'redis', 'memory')
            hit: Whether the cache hit was successful
        """
        try:
            if hit:
                self.cache_hits_total.labels(cache_type=cache_type).inc()
            else:
                self.cache_misses_total.labels(cache_type=cache_type).inc()
        except Exception as e:
            logger.error(f"Error tracking cache metrics: {str(e)}")

    def update_application_metrics(
        self,
        active_users: Optional[int] = None,
        active_assignments: Optional[int] = None,
        pending_submissions: Optional[int] = None
    ) -> None:
        """Update application-specific metrics.
        
        Args:
            active_users: Number of active users
            active_assignments: Number of active assignments
            pending_submissions: Number of pending submissions
        """
        try:
            if active_users is not None:
                self.active_users.set(active_users)
            if active_assignments is not None:
                self.active_assignments.set(active_assignments)
            if pending_submissions is not None:
                self.pending_submissions.set(pending_submissions)
        except Exception as e:
            logger.error(f"Error updating application metrics: {str(e)}")

    def track_error(self, error_type: str) -> None:
        """Track error metrics.
        
        Args:
            error_type: Type of error (e.g., 'validation', 'database')
        """
        try:
            self.error_total.labels(type=error_type).inc()
        except Exception as e:
            logger.error(f"Error tracking error metrics: {str(e)}")

# Create global monitoring service instance only if not running under pytest
if not any('pytest' in arg for arg in sys.argv):
    monitoring_service = MonitoringService() 