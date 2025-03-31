from prometheus_client import Counter, Histogram, Gauge, start_http_server
from prometheus_fastapi_instrumentator import Instrumentator
from fastapi import FastAPI
import time
from typing import Optional
import psutil
import os
from app.core.config import settings

class MonitoringService:
    def __init__(self):
        # HTTP metrics
        self.http_requests_total = Counter(
            "http_requests_total",
            "Total number of HTTP requests",
            ["method", "endpoint", "status"]
        )
        self.http_request_duration = Histogram(
            "http_request_duration_seconds",
            "HTTP request duration in seconds",
            ["method", "endpoint"]
        )
        
        # AI service metrics
        self.ai_requests_total = Counter(
            "ai_requests_total",
            "Total number of AI service requests",
            ["operation"]
        )
        self.ai_request_duration = Histogram(
            "ai_request_duration_seconds",
            "AI service request duration in seconds",
            ["operation"]
        )
        
        # Database metrics
        self.db_queries_total = Counter(
            "db_queries_total",
            "Total number of database queries",
            ["operation"]
        )
        self.db_query_duration = Histogram(
            "db_query_duration_seconds",
            "Database query duration in seconds",
            ["operation"]
        )
        
        # Cache metrics
        self.cache_hits_total = Counter(
            "cache_hits_total",
            "Total number of cache hits",
            ["cache_type"]
        )
        self.cache_misses_total = Counter(
            "cache_misses_total",
            "Total number of cache misses",
            ["cache_type"]
        )
        
        # System metrics
        self.cpu_usage = Gauge(
            "cpu_usage_percent",
            "CPU usage percentage"
        )
        self.memory_usage = Gauge(
            "memory_usage_bytes",
            "Memory usage in bytes"
        )
        self.disk_usage = Gauge(
            "disk_usage_bytes",
            "Disk usage in bytes"
        )
        
        # Application metrics
        self.active_users = Gauge(
            "active_users",
            "Number of active users"
        )
        self.active_assignments = Gauge(
            "active_assignments",
            "Number of active assignments"
        )
        self.pending_submissions = Gauge(
            "pending_submissions",
            "Number of pending submissions"
        )
        
        # Error metrics
        self.error_total = Counter(
            "error_total",
            "Total number of errors",
            ["type"]
        )
        
        self._start_time = time.time()
        self._is_running = False

    def setup_monitoring(self, app: FastAPI):
        """Setup monitoring for the FastAPI application"""
        # Start Prometheus HTTP server
        start_http_server(settings.METRICS_PORT)
        
        # Instrument FastAPI app
        Instrumentator().instrument(app).expose(app)
        
        # Start system metrics collection
        self._start_system_metrics_collection()
        
        # Add startup event handler
        @app.on_event("startup")
        async def startup_event():
            self._is_running = True
        
        # Add shutdown event handler
        @app.on_event("shutdown")
        async def shutdown_event():
            self._is_running = False

    def _start_system_metrics_collection(self):
        """Start collecting system metrics"""
        import asyncio
        
        async def collect_system_metrics():
            while self._is_running:
                # CPU usage
                self.cpu_usage.set(psutil.cpu_percent())
                
                # Memory usage
                memory = psutil.virtual_memory()
                self.memory_usage.set(memory.used)
                
                # Disk usage
                disk = psutil.disk_usage('/')
                self.disk_usage.set(disk.used)
                
                await asyncio.sleep(15)  # Collect every 15 seconds
        
        asyncio.create_task(collect_system_metrics())

    def track_request(self, method: str, endpoint: str, status: int, duration: float):
        """Track HTTP request metrics"""
        self.http_requests_total.labels(
            method=method,
            endpoint=endpoint,
            status=status
        ).inc()
        self.http_request_duration.labels(
            method=method,
            endpoint=endpoint
        ).observe(duration)

    def track_ai_request(self, operation: str, duration: float):
        """Track AI service request metrics"""
        self.ai_requests_total.labels(operation=operation).inc()
        self.ai_request_duration.labels(operation=operation).observe(duration)

    def track_db_query(self, operation: str, duration: float):
        """Track database query metrics"""
        self.db_queries_total.labels(operation=operation).inc()
        self.db_query_duration.labels(operation=operation).observe(duration)

    def track_cache(self, cache_type: str, hit: bool):
        """Track cache metrics"""
        if hit:
            self.cache_hits_total.labels(cache_type=cache_type).inc()
        else:
            self.cache_misses_total.labels(cache_type=cache_type).inc()

    def update_application_metrics(
        self,
        active_users: Optional[int] = None,
        active_assignments: Optional[int] = None,
        pending_submissions: Optional[int] = None
    ):
        """Update application-specific metrics"""
        if active_users is not None:
            self.active_users.set(active_users)
        if active_assignments is not None:
            self.active_assignments.set(active_assignments)
        if pending_submissions is not None:
            self.pending_submissions.set(pending_submissions)

    def track_error(self, error_type: str):
        """Track error metrics"""
        self.error_total.labels(type=error_type).inc()

# Create global monitoring service instance
monitoring_service = MonitoringService() 