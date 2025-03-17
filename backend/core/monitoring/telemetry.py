from typing import Dict, List, Optional, Any
import time
from datetime import datetime
import uuid
from prometheus_client import Counter, Histogram, Gauge
import logging
import json
from backend.config import settings
from opentelemetry import trace
from opentelemetry.trace import Status, StatusCode
from functools import wraps
import asyncio
from collections import defaultdict
from contextlib import asynccontextmanager

logger = logging.getLogger(__name__)

class MetricsCollector:
    def __init__(self):
        # Request metrics
        self.request_counter = Counter(
            'http_requests_total',
            'Total HTTP requests',
            ['method', 'endpoint', 'status']
        )
        self.request_latency = Histogram(
            'http_request_duration_seconds',
            'HTTP request latency',
            ['method', 'endpoint']
        )
        
        # Business metrics
        self.assignments_created = Counter(
            'assignments_created_total',
            'Total assignments created'
        )
        self.assignments_completed = Counter(
            'assignments_completed_total',
            'Total assignments completed'
        )
        self.active_users = Gauge(
            'active_users',
            'Number of active users'
        )
        
        # System metrics
        self.memory_usage = Gauge(
            'memory_usage_bytes',
            'Memory usage in bytes'
        )
        self.cpu_usage = Gauge(
            'cpu_usage_percent',
            'CPU usage percentage'
        )
        
        # Cache metrics
        self.cache_hits = Counter(
            'cache_hits_total',
            'Total cache hits',
            ['cache_level']
        )
        self.cache_misses = Counter(
            'cache_misses_total',
            'Total cache misses',
            ['cache_level']
        )

class Span:
    def __init__(self, name: str, parent_id: Optional[str] = None):
        self.id = str(uuid.uuid4())
        self.name = name
        self.parent_id = parent_id
        self.start_time = time.time()
        self.end_time: Optional[float] = None
        self.attributes: Dict[str, Any] = {}
        self.events: List[Dict] = []
        self.status: Optional[Status] = None

class TracingSystem:
    def __init__(self):
        self.tracer = trace.get_tracer(__name__)
        self._active_spans: Dict[str, Span] = {}
        self._completed_spans: List[Span] = []
        self._trace_context = {}

    @asynccontextmanager
    async def start_span(self, name: str, parent_id: Optional[str] = None):
        """Start a new span with async context manager"""
        span = Span(name, parent_id)
        self._active_spans[span.id] = span
        try:
            yield span
        finally:
            await self.end_span(span.id)

    async def end_span(self, span_id: str, status: Optional[Status] = None):
        """End a span with the given status"""
        if span_id in self._active_spans:
            span = self._active_spans[span_id]
            span.end_time = time.time()
            span.status = status
            self._completed_spans.append(span)
            del self._active_spans[span_id]

    async def add_event(self, span_id: str, name: str, attributes: Optional[Dict] = None):
        """Add an event to a span"""
        if span_id in self._active_spans:
            event = {
                "name": name,
                "timestamp": time.time(),
                "attributes": attributes or {}
            }
            self._active_spans[span_id].events.append(event)

    async def set_attribute(self, span_id: str, key: str, value: Any):
        """Set an attribute on a span"""
        if span_id in self._active_spans:
            self._active_spans[span_id].attributes[key] = value

class StructuredLogger:
    def __init__(self):
        self.logger = logging.getLogger("AssignmentAI")
        self._configure_logger()
        self._log_buffer: List[Dict] = []
        self._buffer_size = 100
        self._last_flush = time.time()
        self._flush_lock = asyncio.Lock()

    def _configure_logger(self):
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)
        self.logger.setLevel(logging.INFO)

    async def log_event(
        self,
        level: str,
        event_type: str,
        message: str,
        context: Optional[Dict] = None
    ):
        """Log an event with buffering"""
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": level,
            "event_type": event_type,
            "message": message,
            "context": context or {},
            "environment": settings.ENVIRONMENT
        }
        
        self._log_buffer.append(log_entry)
        
        # Log immediately for high-priority events
        if level in ["ERROR", "CRITICAL"]:
            await self._flush_logs()
        # Regular flush check
        elif len(self._log_buffer) >= self._buffer_size or \
             time.time() - self._last_flush > 60:
            await self._flush_logs()

    async def _flush_logs(self):
        """Flush buffered logs with locking"""
        if not self._log_buffer:
            return
            
        async with self._flush_lock:
            try:
                # Group logs by level for batch processing
                logs_by_level = defaultdict(list)
                for log in self._log_buffer:
                    logs_by_level[log["level"]].append(log)
                    
                # Process each level
                for level, logs in logs_by_level.items():
                    log_method = getattr(self.logger, level.lower())
                    for log in logs:
                        log_method(json.dumps(log))
                    
                self._log_buffer.clear()
                self._last_flush = time.time()
            except Exception as e:
                logger.error(f"Error flushing logs: {str(e)}")

class Telemetry:
    def __init__(self):
        self.metrics = MetricsCollector()
        self.tracing = TracingSystem()
        self.logger = StructuredLogger()
        
    @asynccontextmanager
    async def monitor_request(self, request, call_next):
        """Middleware to monitor HTTP requests with async context manager"""
        start_time = time.time()
        
        # Start span for request
        async with self.tracing.start_span("http_request") as span:
            await self.tracing.set_attribute(span.id, "http.method", request.method)
            await self.tracing.set_attribute(span.id, "http.url", str(request.url))
            
            try:
                response = await call_next(request)
                
                # Record metrics
                duration = time.time() - start_time
                self.metrics.request_counter.labels(
                    method=request.method,
                    endpoint=request.url.path,
                    status=response.status_code
                ).inc()
                self.metrics.request_latency.labels(
                    method=request.method,
                    endpoint=request.url.path
                ).observe(duration)
                
                # Complete span
                await self.tracing.set_attribute(span.id, "http.status_code", response.status_code)
                
                yield response
                
            except Exception as e:
                # Record error
                self.metrics.request_counter.labels(
                    method=request.method,
                    endpoint=request.url.path,
                    status=500
                ).inc()
                
                # Log error
                await self.logger.log_event(
                    "ERROR",
                    "request_failed",
                    str(e),
                    {
                        "method": request.method,
                        "url": str(request.url),
                        "trace_id": span.id
                    }
                )
                
                # End span with error
                await self.tracing.set_attribute(span.id, "error", str(e))
                raise

def monitor(name: Optional[str] = None):
    """Decorator to monitor function execution"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            span_name = name or func.__name__
            
            async with telemetry.tracing.start_span(span_name) as span:
                try:
                    result = await func(*args, **kwargs)
                    return result
                except Exception as e:
                    await telemetry.tracing.set_attribute(span.id, "error", str(e))
                    raise
                    
        return wrapper
    return decorator

# Global instance
telemetry = Telemetry() 