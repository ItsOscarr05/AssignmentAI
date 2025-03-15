import dataclasses
import yaml
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional, Any, Set
from pathlib import Path
import logging
import time
import threading
import queue
import concurrent.futures
from functools import lru_cache
import psutil
import json
import pickle
import hashlib
import os

logger = logging.getLogger(__name__)

class PerformanceError(Exception):
    """Base exception for performance-related errors."""
    pass

class CacheError(PerformanceError):
    """Exception raised for cache-related errors."""
    pass

class ResourceError(PerformanceError):
    """Exception raised for resource-related errors."""
    pass

@dataclass
class PerformanceConfig:
    """Configuration for performance optimization settings."""
    name: str
    description: str
    created_at: datetime
    updated_at: datetime
    settings: Dict[str, Any]
    caching: Dict[str, Any]
    parallel_processing: Dict[str, Any]
    resource_limits: Dict[str, Any]
    monitoring: Dict[str, Any]
    optimization_rules: List[Dict[str, Any]]

class PerformanceManager:
    """Manages performance configurations and optimizations."""

    def __init__(self, base_dir: Path):
        """
        Initialize the PerformanceManager.

        Args:
            base_dir: Directory containing performance configurations
        """
        self.base_dir = base_dir
        self.config_dir = base_dir / "performance"
        self.cache_dir = base_dir / "cache"
        self.metrics_dir = base_dir / "metrics"
        
        # Create directories
        self.config_dir.mkdir(parents=True, exist_ok=True)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.metrics_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize thread pool
        self.thread_pool = concurrent.futures.ThreadPoolExecutor(
            max_workers=4,
            thread_name_prefix="PerformanceWorker"
        )
        
        # Initialize cache
        self.cache = {}
        self.cache_stats = {
            "hits": 0,
            "misses": 0,
            "evictions": 0
        }
        
        # Initialize metrics
        self.metrics = {
            "operations": {},
            "resources": {},
            "cache": {},
            "errors": {}
        }
        
        # Setup logging
        self.logger = logging.getLogger("performance")
        self.logger.setLevel(logging.INFO)
        
        # Load existing configurations
        self.configs = self._load_configs()
    
    def _load_configs(self) -> Dict[str, PerformanceConfig]:
        """Load all performance configurations."""
        configs = {}
        for config_file in self.config_dir.glob("*.yaml"):
            try:
                with open(config_file, "r") as f:
                    data = yaml.safe_load(f)
                    configs[data["name"]] = PerformanceConfig(**data)
            except Exception as e:
                self.logger.error(f"Error loading config {config_file}: {e}")
        return configs
    
    def create_performance_config(self, name: str, description: str, settings: Dict[str, Any]) -> PerformanceConfig:
        """
        Create a new performance configuration.

        Args:
            name: Name of the configuration
            description: Description of the configuration
            settings: Dictionary of performance settings

        Returns:
            PerformanceConfig object

        Raises:
            PerformanceError: If configuration creation fails
        """
        try:
            config = PerformanceConfig(
                name=name,
                description=description,
                created_at=datetime.now(),
                updated_at=datetime.now(),
                settings=settings,
                caching=settings.get("caching", {}),
                parallel_processing=settings.get("parallel_processing", {}),
                resource_limits=settings.get("resource_limits", {}),
                monitoring=settings.get("monitoring", {}),
                optimization_rules=settings.get("optimization_rules", [])
            )
            
            # Save configuration
            config_file = self.config_dir / f"{name}.yaml"
            with open(config_file, "w") as f:
                yaml.dump(dataclasses.asdict(config), f)
            
            self.configs[name] = config
            return config
        except Exception as e:
            self.logger.error(f"Error creating performance config: {e}")
            raise PerformanceError(f"Failed to create performance config: {e}")
    
    def get_performance_config(self, name: str) -> Optional[PerformanceConfig]:
        """Get a performance configuration by name."""
        return self.configs.get(name)
    
    def update_performance_config(self, name: str, settings: Dict[str, Any]) -> Optional[PerformanceConfig]:
        """Update a performance configuration."""
        if name not in self.configs:
            return None
        
        config = self.configs[name]
        config.settings.update(settings)
        config.caching.update(settings.get("caching", {}))
        config.parallel_processing.update(settings.get("parallel_processing", {}))
        config.resource_limits.update(settings.get("resource_limits", {}))
        config.monitoring.update(settings.get("monitoring", {}))
        config.optimization_rules.update(settings.get("optimization_rules", {}))
        config.updated_at = datetime.now()
        
        # Save updated configuration
        config_file = self.config_dir / f"{name}.yaml"
        with open(config_file, "w") as f:
            yaml.dump(dataclasses.asdict(config), f)
        
        return config
    
    def delete_performance_config(self, name: str) -> bool:
        """Delete a performance configuration."""
        if name not in self.configs:
            return False
        
        config_file = self.config_dir / f"{name}.yaml"
        if config_file.exists():
            config_file.unlink()
        
        del self.configs[name]
        return True
    
    @lru_cache(maxsize=1000)
    def get_cached_value(self, key: str, ttl: int = 3600) -> Optional[Any]:
        """Get a value from cache with TTL."""
        if key in self.cache:
            value, timestamp = self.cache[key]
            if time.time() - timestamp < ttl:
                self.cache_stats["hits"] += 1
                return value
            else:
                del self.cache[key]
                self.cache_stats["evictions"] += 1
        
        self.cache_stats["misses"] += 1
        return None
    
    def set_cached_value(self, key: str, value: Any, ttl: int = 3600) -> None:
        """Set a value in cache with TTL."""
        self.cache[key] = (value, time.time())
        
        # Check cache size limits
        max_size = self.configs.get("default", PerformanceConfig(
            name="default",
            description="Default performance configuration",
            caching={"max_size": 1000}
        )).caching.get("max_size", 1000)
        
        if len(self.cache) > max_size:
            # Remove oldest entries
            sorted_items = sorted(self.cache.items(), key=lambda x: x[1][1])
            for key, _ in sorted_items[:len(self.cache) - max_size]:
                del self.cache[key]
                self.cache_stats["evictions"] += 1
    
    def clear_cache(self) -> None:
        """Clear the cache."""
        self.cache.clear()
        self.cache_stats = {"hits": 0, "misses": 0, "evictions": 0}
    
    def execute_parallel(self, func, items: List[Any], max_workers: Optional[int] = None) -> List[Any]:
        """Execute a function in parallel on a list of items."""
        if max_workers is None:
            max_workers = self.configs.get("default", PerformanceConfig(
                name="default",
                description="Default performance configuration",
                parallel_processing={"max_workers": 4}
            )).parallel_processing.get("max_workers", 4)
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = [executor.submit(func, item) for item in items]
            return [future.result() for future in concurrent.futures.as_completed(futures)]
    
    def check_resource_limits(self) -> bool:
        """Check if current resource usage is within limits."""
        config = self.configs.get("default", PerformanceConfig(
            name="default",
            description="Default performance configuration",
            resource_limits={
                "max_cpu_percent": 80,
                "max_memory_percent": 80,
                "max_disk_percent": 90
            }
        ))
        
        limits = config.resource_limits
        
        # Check CPU usage
        if psutil.cpu_percent() > limits.get("max_cpu_percent", 80):
            return False
        
        # Check memory usage
        if psutil.virtual_memory().percent > limits.get("max_memory_percent", 80):
            return False
        
        # Check disk usage
        if psutil.disk_usage("/").percent > limits.get("max_disk_percent", 90):
            return False
        
        return True
    
    def record_metrics(self, operation: str, duration: float, success: bool = True) -> None:
        """Record performance metrics for an operation."""
        if operation not in self.metrics["operations"]:
            self.metrics["operations"][operation] = {
                "count": 0,
                "total_duration": 0,
                "success_count": 0,
                "error_count": 0
            }
        
        metrics = self.metrics["operations"][operation]
        metrics["count"] += 1
        metrics["total_duration"] += duration
        if success:
            metrics["success_count"] += 1
        else:
            metrics["error_count"] += 1
    
    def record_resource_metrics(self) -> None:
        """Record current resource usage metrics."""
        self.metrics["resources"] = {
            "cpu_percent": psutil.cpu_percent(),
            "memory_percent": psutil.virtual_memory().percent,
            "disk_percent": psutil.disk_usage("/").percent,
            "timestamp": datetime.now().isoformat()
        }
    
    def record_cache_metrics(self) -> None:
        """Record cache performance metrics."""
        self.metrics["cache"] = {
            "size": len(self.cache),
            "hits": self.cache_stats["hits"],
            "misses": self.cache_stats["misses"],
            "evictions": self.cache_stats["evictions"],
            "hit_rate": self.cache_stats["hits"] / (self.cache_stats["hits"] + self.cache_stats["misses"])
            if (self.cache_stats["hits"] + self.cache_stats["misses"]) > 0 else 0,
            "timestamp": datetime.now().isoformat()
        }
    
    def record_error(self, operation: str, error: Exception) -> None:
        """Record error metrics."""
        if operation not in self.metrics["errors"]:
            self.metrics["errors"][operation] = []
        
        self.metrics["errors"][operation].append({
            "error": str(error),
            "timestamp": datetime.now().isoformat()
        })
    
    def get_performance_report(self) -> Dict[str, Any]:
        """Generate a comprehensive performance report."""
        self.record_resource_metrics()
        self.record_cache_metrics()
        
        return {
            "operations": self.metrics["operations"],
            "resources": self.metrics["resources"],
            "cache": self.metrics["cache"],
            "errors": self.metrics["errors"],
            "timestamp": datetime.now().isoformat()
        }
    
    def save_metrics(self) -> None:
        """Save metrics to disk."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        metrics_file = self.metrics_dir / f"metrics_{timestamp}.json"
        
        with open(metrics_file, "w") as f:
            json.dump(self.metrics, f, indent=2)
    
    def optimize_operation(self, operation: str, func: callable) -> callable:
        """Optimize an operation with caching and parallel processing."""
        config = self.configs.get("default", PerformanceConfig(
            name="default",
            description="Default performance configuration",
            optimization_rules={
                "cache_enabled": True,
                "parallel_enabled": False,
                "cache_ttl": 3600
            }
        ))
        
        rules = config.optimization_rules
        
        def optimized_func(*args, **kwargs):
            # Generate cache key
            key_parts = [operation]
            key_parts.extend(str(arg) for arg in args)
            key_parts.extend(f"{k}:{v}" for k, v in sorted(kwargs.items()))
            cache_key = hashlib.md5("|".join(key_parts).encode()).hexdigest()
            
            # Try to get from cache
            if rules.get("cache_enabled", True):
                cached_value = self.get_cached_value(cache_key, rules.get("cache_ttl", 3600))
                if cached_value is not None:
                    return cached_value
            
            # Execute operation
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                success = True
            except Exception as e:
                self.record_error(operation, e)
                success = False
                raise
            finally:
                duration = time.time() - start_time
                self.record_metrics(operation, duration, success)
            
            # Cache result
            if rules.get("cache_enabled", True) and success:
                self.set_cached_value(cache_key, result, rules.get("cache_ttl", 3600))
            
            return result
        
        return optimized_func
    
    def export_performance_config(self, name: str, format: str = "yaml") -> Optional[str]:
        """Export a performance configuration."""
        if name not in self.configs:
            return None
        
        config = self.configs[name]
        data = dataclasses.asdict(config)
        
        if format == "yaml":
            return yaml.dump(data)
        elif format == "json":
            return json.dumps(data, indent=2)
        else:
            raise ValueError(f"Unsupported format: {format}")
    
    def import_performance_config(self, name: str, data: str, format: str = "yaml") -> Optional[PerformanceConfig]:
        """Import a performance configuration."""
        try:
            if format == "yaml":
                config_data = yaml.safe_load(data)
            elif format == "json":
                config_data = json.loads(data)
            else:
                raise ValueError(f"Unsupported format: {format}")
            
            config = PerformanceConfig(**config_data)
            
            # Save configuration
            config_file = self.config_dir / f"{name}.yaml"
            with open(config_file, "w") as f:
                yaml.dump(dataclasses.asdict(config), f)
            
            self.configs[name] = config
            return config
        except Exception as e:
            self.logger.error(f"Error importing config: {e}")
            return None 