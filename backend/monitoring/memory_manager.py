import psutil
import gc
import logging
from typing import Dict, List, Optional
from prometheus_client import Gauge, Counter, Histogram
import time
import asyncio
from dataclasses import dataclass
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

# Memory metrics
MEMORY_USAGE = Gauge(
    'memory_usage_bytes',
    'Current memory usage',
    ['type']
)

MEMORY_LIMIT = Gauge(
    'memory_limit_bytes',
    'Memory usage limit',
    ['type']
)

GC_COLLECTIONS = Counter(
    'gc_collections_total',
    'Number of garbage collections',
    ['generation']
)

MEMORY_ALLOCATION = Histogram(
    'memory_allocation_bytes',
    'Memory allocation size',
    ['operation']
)

@dataclass
class MemoryThresholds:
    warning: float = 0.75  # 75% of max memory
    critical: float = 0.90  # 90% of max memory
    gc_trigger: float = 0.80  # Trigger GC at 80%

class MemoryManager:
    def __init__(self, max_memory_mb: int = None):
        self.max_memory = max_memory_mb * 1024 * 1024 if max_memory_mb else None
        self.thresholds = MemoryThresholds()
        self.monitoring = False
        self.memory_history: List[Dict] = []
        self.last_gc = time.time()
        self.gc_interval = 300  # 5 minutes
        
    async def start_monitoring(self):
        """Start memory monitoring"""
        self.monitoring = True
        asyncio.create_task(self._monitor_memory())
        
    async def stop_monitoring(self):
        """Stop memory monitoring"""
        self.monitoring = False
        
    async def _monitor_memory(self):
        """Continuous memory monitoring"""
        while self.monitoring:
            try:
                # Get current memory usage
                memory_info = self._get_memory_info()
                
                # Update metrics
                self._update_metrics(memory_info)
                
                # Check thresholds
                await self._check_thresholds(memory_info)
                
                # Store history
                self.memory_history.append({
                    'timestamp': datetime.now(),
                    'usage': memory_info
                })
                
                # Trim history (keep last 24 hours)
                self._trim_history()
                
                # Sleep for 10 seconds
                await asyncio.sleep(10)
                
            except Exception as e:
                logger.error(f"Memory monitoring error: {str(e)}")
                await asyncio.sleep(30)
    
    def _get_memory_info(self) -> Dict:
        """Get current memory usage information"""
        process = psutil.Process()
        memory_info = process.memory_info()
        
        return {
            'rss': memory_info.rss,  # Resident Set Size
            'vms': memory_info.vms,  # Virtual Memory Size
            'shared': memory_info.shared,  # Shared Memory
            'percent': process.memory_percent(),
            'gc_stats': {
                'collections': [gc.get_count()[i] for i in range(3)],
                'objects': len(gc.get_objects())
            }
        }
    
    def _update_metrics(self, memory_info: Dict):
        """Update Prometheus metrics"""
        MEMORY_USAGE.labels(type='rss').set(memory_info['rss'])
        MEMORY_USAGE.labels(type='vms').set(memory_info['vms'])
        MEMORY_USAGE.labels(type='shared').set(memory_info['shared'])
        
        if self.max_memory:
            MEMORY_LIMIT.labels(type='max').set(self.max_memory)
        
        for i, count in enumerate(memory_info['gc_stats']['collections']):
            GC_COLLECTIONS.labels(generation=f'gen{i}').inc(count)
    
    async def _check_thresholds(self, memory_info: Dict):
        """Check memory thresholds and take action if needed"""
        if not self.max_memory:
            return
            
        memory_percent = memory_info['rss'] / self.max_memory
        
        # Critical threshold - Emergency memory release
        if memory_percent >= self.thresholds.critical:
            logger.warning("Critical memory usage detected!")
            await self._emergency_memory_release()
            
        # Warning threshold - Notify
        elif memory_percent >= self.thresholds.warning:
            logger.warning("High memory usage detected!")
            
        # GC threshold - Run garbage collection
        elif memory_percent >= self.thresholds.gc_trigger:
            current_time = time.time()
            if current_time - self.last_gc >= self.gc_interval:
                await self._run_garbage_collection()
                self.last_gc = current_time
    
    async def _emergency_memory_release(self):
        """Emergency memory release procedures"""
        try:
            # Force garbage collection
            await self._run_garbage_collection()
            
            # Clear internal caches
            self.memory_history.clear()
            
            # Clear any module-specific caches
            self._clear_module_caches()
            
            logger.info("Emergency memory release completed")
            
        except Exception as e:
            logger.error(f"Emergency memory release failed: {str(e)}")
    
    async def _run_garbage_collection(self):
        """Run garbage collection"""
        try:
            start_time = time.time()
            
            # Get memory before GC
            memory_before = psutil.Process().memory_info().rss
            
            # Run garbage collection
            gc.collect()
            
            # Get memory after GC
            memory_after = psutil.Process().memory_info().rss
            
            # Record metrics
            MEMORY_ALLOCATION.labels(
                operation='gc_freed'
            ).observe(memory_before - memory_after)
            
            logger.info(f"Garbage collection freed {memory_before - memory_after} bytes")
            
        except Exception as e:
            logger.error(f"Garbage collection failed: {str(e)}")
    
    def _clear_module_caches(self):
        """Clear module-specific caches"""
        # Implementation depends on which modules are using caches
        pass
    
    def _trim_history(self, max_age_hours: int = 24):
        """Trim memory history to prevent memory growth"""
        if not self.memory_history:
            return
            
        cutoff_time = datetime.now() - timedelta(hours=max_age_hours)
        self.memory_history = [
            entry for entry in self.memory_history
            if entry['timestamp'] >= cutoff_time
        ]
    
    def get_memory_analytics(self) -> Dict:
        """Get memory usage analytics"""
        if not self.memory_history:
            return {}
            
        current = self._get_memory_info()
        history = self.memory_history
        
        return {
            'current': current,
            'peak': max(h['usage']['rss'] for h in history),
            'average': sum(h['usage']['rss'] for h in history) / len(history),
            'trend': self._calculate_memory_trend(),
            'gc_stats': current['gc_stats']
        }
    
    def _calculate_memory_trend(self) -> Optional[float]:
        """Calculate memory usage trend"""
        if len(self.memory_history) < 2:
            return None
            
        recent_entries = self.memory_history[-6:]  # Last minute (10-second intervals)
        if len(recent_entries) < 2:
            return None
            
        # Calculate slope of memory usage
        x = range(len(recent_entries))
        y = [entry['usage']['rss'] for entry in recent_entries]
        
        # Simple linear regression
        n = len(x)
        sum_x = sum(x)
        sum_y = sum(y)
        sum_xy = sum(x[i] * y[i] for i in range(n))
        sum_xx = sum(x[i] * x[i] for i in range(n))
        
        slope = (n * sum_xy - sum_x * sum_y) / (n * sum_xx - sum_x * sum_x)
        return slope

# Initialize memory manager
memory_manager = MemoryManager() 