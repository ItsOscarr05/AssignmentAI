from typing import Dict, Any, Optional, Callable, Awaitable
from dataclasses import dataclass
from datetime import datetime, timedelta
import asyncio
from enum import Enum
import logging
from collections import defaultdict
import traceback
from prometheus_client import Counter, Histogram
from backend.config import settings

logger = logging.getLogger(__name__)

class ErrorSeverity(Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class ErrorCategory(Enum):
    DATABASE = "database"
    CACHE = "cache"
    NETWORK = "network"
    AUTHENTICATION = "authentication"
    AUTHORIZATION = "authorization"
    VALIDATION = "validation"
    EXTERNAL_SERVICE = "external_service"
    RESOURCE = "resource"
    UNKNOWN = "unknown"

@dataclass
class ErrorMetadata:
    timestamp: datetime
    severity: ErrorSeverity
    category: ErrorCategory
    error_message: str
    stack_trace: str
    context: Dict[str, Any]
    recovery_attempts: int = 0
    last_recovery_time: Optional[datetime] = None
    resolved: bool = False

class CircuitBreaker:
    def __init__(
        self,
        failure_threshold: int = 5,
        reset_timeout: int = 60,
        half_open_timeout: int = 30
    ):
        self.failure_threshold = failure_threshold
        self.reset_timeout = reset_timeout
        self.half_open_timeout = half_open_timeout
        self.failures = 0
        self.last_failure_time: Optional[datetime] = None
        self.state = "closed"
        self.last_state_change: datetime = datetime.now()

    async def call(
        self,
        func: Callable[..., Awaitable[Any]],
        *args,
        **kwargs
    ) -> Any:
        if self.state == "open":
            if datetime.now() - self.last_state_change > timedelta(seconds=self.reset_timeout):
                self.state = "half-open"
                self.last_state_change = datetime.now()
            else:
                raise Exception("Circuit breaker is open")

        try:
            result = await func(*args, **kwargs)
            if self.state == "half-open":
                self.state = "closed"
                self.failures = 0
                self.last_state_change = datetime.now()
            return result
        except Exception as e:
            self.failures += 1
            self.last_failure_time = datetime.now()
            if self.failures >= self.failure_threshold:
                self.state = "open"
                self.last_state_change = datetime.now()
            raise e

class ErrorManager:
    def __init__(self):
        self.errors: Dict[str, ErrorMetadata] = {}
        self.circuit_breakers: Dict[str, CircuitBreaker] = {}
        self.recovery_strategies: Dict[ErrorCategory, Callable] = {}
        self.error_counter = Counter(
            'error_total',
            'Total number of errors',
            ['category', 'severity']
        )
        self.recovery_time = Histogram(
            'error_recovery_seconds',
            'Time spent recovering from errors',
            ['category']
        )
        self.error_patterns = defaultdict(int)
        self._setup_recovery_strategies()

    def _setup_recovery_strategies(self):
        self.recovery_strategies = {
            ErrorCategory.DATABASE: self._recover_database,
            ErrorCategory.CACHE: self._recover_cache,
            ErrorCategory.NETWORK: self._recover_network,
            ErrorCategory.EXTERNAL_SERVICE: self._recover_external_service,
            ErrorCategory.RESOURCE: self._recover_resource
        }

    async def _recover_database(self, error_id: str) -> bool:
        error = self.errors[error_id]
        try:
            # Implement database recovery logic
            await asyncio.sleep(1)  # Simulated recovery action
            return True
        except Exception as e:
            logger.error(f"Database recovery failed: {str(e)}")
            return False

    async def _recover_cache(self, error_id: str) -> bool:
        error = self.errors[error_id]
        try:
            # Implement cache recovery logic
            await asyncio.sleep(1)  # Simulated recovery action
            return True
        except Exception as e:
            logger.error(f"Cache recovery failed: {str(e)}")
            return False

    async def _recover_network(self, error_id: str) -> bool:
        error = self.errors[error_id]
        try:
            # Implement network recovery logic
            await asyncio.sleep(1)  # Simulated recovery action
            return True
        except Exception as e:
            logger.error(f"Network recovery failed: {str(e)}")
            return False

    async def _recover_external_service(self, error_id: str) -> bool:
        error = self.errors[error_id]
        try:
            # Implement external service recovery logic
            await asyncio.sleep(1)  # Simulated recovery action
            return True
        except Exception as e:
            logger.error(f"External service recovery failed: {str(e)}")
            return False

    async def _recover_resource(self, error_id: str) -> bool:
        error = self.errors[error_id]
        try:
            # Implement resource recovery logic
            await asyncio.sleep(1)  # Simulated recovery action
            return True
        except Exception as e:
            logger.error(f"Resource recovery failed: {str(e)}")
            return False

    def get_circuit_breaker(self, service_name: str) -> CircuitBreaker:
        if service_name not in self.circuit_breakers:
            self.circuit_breakers[service_name] = CircuitBreaker()
        return self.circuit_breakers[service_name]

    def categorize_error(self, error: Exception) -> ErrorCategory:
        error_type = type(error).__name__
        error_msg = str(error).lower()
        
        if "database" in error_msg or "sql" in error_msg:
            return ErrorCategory.DATABASE
        elif "cache" in error_msg or "redis" in error_msg:
            return ErrorCategory.CACHE
        elif "network" in error_msg or "connection" in error_msg:
            return ErrorCategory.NETWORK
        elif "unauthorized" in error_msg or "unauthenticated" in error_msg:
            return ErrorCategory.AUTHENTICATION
        elif "permission" in error_msg or "forbidden" in error_msg:
            return ErrorCategory.AUTHORIZATION
        elif "validation" in error_msg or "invalid" in error_msg:
            return ErrorCategory.VALIDATION
        elif "service" in error_msg or "api" in error_msg:
            return ErrorCategory.EXTERNAL_SERVICE
        elif "resource" in error_msg or "capacity" in error_msg:
            return ErrorCategory.RESOURCE
        else:
            return ErrorCategory.UNKNOWN

    def determine_severity(self, error: Exception, category: ErrorCategory) -> ErrorSeverity:
        if category in [ErrorCategory.DATABASE, ErrorCategory.AUTHENTICATION]:
            return ErrorSeverity.CRITICAL
        elif category in [ErrorCategory.NETWORK, ErrorCategory.EXTERNAL_SERVICE]:
            return ErrorSeverity.HIGH
        elif category in [ErrorCategory.CACHE, ErrorCategory.RESOURCE]:
            return ErrorSeverity.MEDIUM
        else:
            return ErrorSeverity.LOW

    async def handle_error(
        self,
        error: Exception,
        context: Dict[str, Any] = None
    ) -> str:
        category = self.categorize_error(error)
        severity = self.determine_severity(error, category)
        
        error_id = f"{datetime.now().timestamp()}_{category.value}"
        stack_trace = "".join(traceback.format_tb(error.__traceback__))
        
        self.errors[error_id] = ErrorMetadata(
            timestamp=datetime.now(),
            severity=severity,
            category=category,
            error_message=str(error),
            stack_trace=stack_trace,
            context=context or {}
        )
        
        self.error_counter.labels(
            category=category.value,
            severity=severity.value
        ).inc()
        
        # Log the error
        logger.error(
            f"Error occurred: {str(error)}",
            extra={
                "error_id": error_id,
                "category": category.value,
                "severity": severity.value,
                "context": context
            }
        )
        
        # Attempt recovery if strategy exists
        if category in self.recovery_strategies:
            await self._attempt_recovery(error_id)
        
        return error_id

    async def _attempt_recovery(self, error_id: str) -> bool:
        error = self.errors[error_id]
        if error.recovery_attempts >= 3:
            logger.warning(f"Max recovery attempts reached for error {error_id}")
            return False

        recovery_strategy = self.recovery_strategies.get(error.category)
        if not recovery_strategy:
            return False

        error.recovery_attempts += 1
        error.last_recovery_time = datetime.now()

        with self.recovery_time.labels(category=error.category.value).time():
            success = await recovery_strategy(error_id)

        if success:
            error.resolved = True
            logger.info(f"Successfully recovered from error {error_id}")
        else:
            logger.warning(f"Recovery attempt failed for error {error_id}")

        return success

    def analyze_error_patterns(self) -> Dict[str, Any]:
        patterns = defaultdict(int)
        categories = defaultdict(int)
        severities = defaultdict(int)
        
        for error in self.errors.values():
            if datetime.now() - error.timestamp <= timedelta(hours=24):
                patterns[error.error_message] += 1
                categories[error.category.value] += 1
                severities[error.severity.value] += 1
        
        return {
            "patterns": dict(patterns),
            "categories": dict(categories),
            "severities": dict(severities)
        }

    async def cleanup_resolved_errors(self):
        """Remove resolved errors older than the retention period"""
        retention_days = settings.SECURITY_EVENT_RETENTION_DAYS
        cutoff_time = datetime.now() - timedelta(days=retention_days)
        
        to_remove = [
            error_id
            for error_id, error in self.errors.items()
            if error.resolved and error.timestamp < cutoff_time
        ]
        
        for error_id in to_remove:
            del self.errors[error_id]

# Global error manager instance
error_manager = ErrorManager() 