from typing import Any, Dict, List, Optional, Union, Tuple
from datetime import datetime, timedelta
import asyncio
import logging
from dataclasses import dataclass
import hashlib
import json
from enum import Enum
import aioredis
import numpy as np
from collections import defaultdict
import zlib
import lz4.frame
from functools import lru_cache

class CacheStrategy(Enum):
    LRU = "least_recently_used"
    LFU = "least_frequently_used"
    ADAPTIVE = "adaptive"
    PREDICTIVE = "predictive"
    INTELLIGENT = "intelligent"

class CompressionMethod(Enum):
    NONE = "none"
    ZLIB = "zlib"
    LZ4 = "lz4"

class CacheLevel(Enum):
    L1 = "l1"  # Memory cache (fastest)
    L2 = "l2"  # Local disk cache
    L3 = "l3"  # Redis cache (distributed)

@dataclass
class CacheMetrics:
    hits: Dict[CacheLevel, int] = None
    misses: Dict[CacheLevel, int] = None
    latency: Dict[CacheLevel, float] = None
    size: Dict[CacheLevel, int] = None
    evictions: Dict[CacheLevel, int] = None
    prediction_accuracy: float = 0.0
    compression_ratio: float = 1.0

    def __post_init__(self):
        self.hits = defaultdict(int)
        self.misses = defaultdict(int)
        self.latency = defaultdict(float)
        self.size = defaultdict(int)
        self.evictions = defaultdict(int)

@dataclass
class CacheItem:
    key: str
    value: Any
    created_at: datetime
    last_accessed: datetime
    access_count: int
    size_bytes: int
    metadata: Dict[str, Any]
    compression: CompressionMethod
    compressed_size: Optional[int] = None

class PredictiveModel:
    def __init__(self):
        self.access_patterns: Dict[str, List[datetime]] = defaultdict(list)
        self.correlations: Dict[str, Dict[str, float]] = defaultdict(dict)
        self.seasonal_patterns: Dict[str, Dict[str, float]] = defaultdict(dict)
        
    def update(self, key: str, access_time: datetime):
        """Update access patterns and correlations"""
        self.access_patterns[key].append(access_time)
        self._update_correlations(key)
        self._update_seasonal_patterns(key)
        
    def predict_next_access(self, key: str) -> Optional[datetime]:
        """Predict next access time for a key"""
        if key not in self.access_patterns:
            return None
            
        patterns = self.access_patterns[key]
        if len(patterns) < 2:
            return None
            
        # Calculate average time between accesses
        intervals = [(t2 - t1).total_seconds() 
                    for t1, t2 in zip(patterns[:-1], patterns[1:])]
        
        if not intervals:
            return None
            
        # Use weighted average of recent intervals
        weights = np.exp(np.linspace(-1, 0, len(intervals)))
        weighted_interval = np.average(intervals, weights=weights)
        
        # Adjust based on seasonal patterns
        seasonal_adjustment = self._get_seasonal_adjustment(key)
        predicted_interval = weighted_interval * seasonal_adjustment
        
        return patterns[-1] + timedelta(seconds=predicted_interval)
        
    def _update_correlations(self, key: str):
        """Update access pattern correlations between keys"""
        recent_time = datetime.now() - timedelta(hours=1)
        recent_accesses = {
            k: [t for t in times if t > recent_time]
            for k, times in self.access_patterns.items()
        }
        
        for other_key, other_times in recent_accesses.items():
            if other_key == key or not other_times:
                continue
                
            correlation = self._calculate_correlation(
                self.access_patterns[key],
                other_times
            )
            self.correlations[key][other_key] = correlation
            
    def _update_seasonal_patterns(self, key: str):
        """Update seasonal access patterns"""
        accesses = self.access_patterns[key]
        if len(accesses) < 24:  # Need enough data
            return
            
        # Analyze hourly patterns
        hour_counts = defaultdict(int)
        for access in accesses:
            hour_counts[access.hour] += 1
            
        total = sum(hour_counts.values())
        if total == 0:
            return
            
        # Calculate hourly probabilities
        for hour, count in hour_counts.items():
            self.seasonal_patterns[key][f"hour_{hour}"] = count / total
            
    def _calculate_correlation(
        self,
        times1: List[datetime],
        times2: List[datetime]
    ) -> float:
        """Calculate correlation coefficient between two time series"""
        if not times1 or not times2:
            return 0.0
            
        # Convert to seconds since earliest time
        min_time = min(min(times1), min(times2))
        series1 = [(t - min_time).total_seconds() for t in times1]
        series2 = [(t - min_time).total_seconds() for t in times2]
        
        # Calculate correlation coefficient
        try:
            return float(np.corrcoef(series1, series2)[0, 1])
        except:
            return 0.0
            
    def _get_seasonal_adjustment(self, key: str) -> float:
        """Get seasonal adjustment factor"""
        if key not in self.seasonal_patterns:
            return 1.0
            
        current_hour = datetime.now().hour
        hour_probability = self.seasonal_patterns[key].get(f"hour_{current_hour}", 0.0417)  # 1/24 as default
        
        # Normalize: 1.0 means average probability
        return hour_probability * 24

class HierarchicalCache:
    def __init__(
        self,
        redis_url: str,
        max_size_mb: Dict[CacheLevel, int],
        strategy: CacheStrategy = CacheStrategy.INTELLIGENT,
        compression_method: CompressionMethod = CompressionMethod.LZ4
    ):
        self.redis = aioredis.from_url(redis_url)
        self.max_size_bytes = {
            level: size * 1024 * 1024 
            for level, size in max_size_mb.items()
        }
        self.strategy = strategy
        self.compression_method = compression_method
        self.current_size_bytes = defaultdict(int)
        self.metrics = CacheMetrics()
        self.items = {
            CacheLevel.L1: {},  # Memory cache
            CacheLevel.L2: {},  # Local disk cache
            CacheLevel.L3: set()  # Redis keys
        }
        self.predictive_model = PredictiveModel()
        self.prefetch_queue = asyncio.Queue()
        self.eviction_policy = self._get_eviction_policy()
        
        # Initialize LRU cache for L1
        self.l1_cache = lru_cache(maxsize=1000)(self._get_l1_value)
        
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache with hierarchical fallback"""
        try:
            start_time = datetime.now()
            
            # Try L1 (Memory) cache first
            value = await self._get_from_l1(key)
            if value is not None:
                self.metrics.hits[CacheLevel.L1] += 1
                return value
            self.metrics.misses[CacheLevel.L1] += 1
            
            # Try L2 (Local disk) cache
            value = await self._get_from_l2(key)
            if value is not None:
                self.metrics.hits[CacheLevel.L2] += 1
                await self._promote_to_l1(key, value)
                return value
            self.metrics.misses[CacheLevel.L2] += 1
            
            # Try L3 (Redis) cache
            value = await self._get_from_l3(key)
            if value is not None:
                self.metrics.hits[CacheLevel.L3] += 1
                await self._promote_to_l2(key, value)
                return value
            self.metrics.misses[CacheLevel.L3] += 1
            
            return None
            
        finally:
            elapsed = (datetime.now() - start_time).total_seconds()
            for level in CacheLevel:
                self.metrics.latency[level] = elapsed
                
    async def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[int] = None,
        metadata: Optional[Dict] = None
    ) -> bool:
        """Set value in cache with intelligent placement"""
        try:
            # Compress value if needed
            compressed_value, compressed_size = self._compress_value(value)
            original_size = len(json.dumps(value).encode('utf-8'))
            
            # Update compression ratio metric
            self.metrics.compression_ratio = original_size / compressed_size if compressed_size > 0 else 1.0
            
            # Create cache item
            item = CacheItem(
                key=key,
                value=value,
                created_at=datetime.now(),
                last_accessed=datetime.now(),
                access_count=1,
                size_bytes=original_size,
                metadata=metadata or {},
                compression=self.compression_method,
                compressed_size=compressed_size
            )
            
            # Determine optimal cache level based on access patterns
            optimal_level = self._determine_optimal_level(key, item)
            
            # Store in appropriate cache level
            if optimal_level == CacheLevel.L1:
                await self._set_in_l1(key, item)
            elif optimal_level == CacheLevel.L2:
                await self._set_in_l2(key, item)
            else:  # L3
                await self._set_in_l3(key, item, ttl)
                
            # Update predictive model
            self.predictive_model.update(key, datetime.now())
            
            # Trigger prefetching for correlated items
            await self._trigger_prefetch(key)
            
            return True
            
        except Exception as e:
            logging.error(f"Cache set failed: {str(e)}")
            return False
            
    def _compress_value(self, value: Any) -> Tuple[bytes, int]:
        """Compress value using selected method"""
        serialized = json.dumps(value).encode('utf-8')
        
        if self.compression_method == CompressionMethod.NONE:
            return serialized, len(serialized)
        elif self.compression_method == CompressionMethod.ZLIB:
            compressed = zlib.compress(serialized)
            return compressed, len(compressed)
        elif self.compression_method == CompressionMethod.LZ4:
            compressed = lz4.frame.compress(serialized)
            return compressed, len(compressed)
            
    def _decompress_value(self, compressed: bytes, method: CompressionMethod) -> Any:
        """Decompress value using specified method"""
        if method == CompressionMethod.NONE:
            decompressed = compressed
        elif method == CompressionMethod.ZLIB:
            decompressed = zlib.decompress(compressed)
        elif method == CompressionMethod.LZ4:
            decompressed = lz4.frame.decompress(compressed)
            
        return json.loads(decompressed.decode('utf-8'))
        
    def _determine_optimal_level(self, key: str, item: CacheItem) -> CacheLevel:
        """Determine optimal cache level based on access patterns"""
        # Check predicted next access
        next_access = self.predictive_model.predict_next_access(key)
        if not next_access:
            return CacheLevel.L3  # Default to Redis for unknown patterns
            
        # Calculate time until next access
        time_until_access = (next_access - datetime.now()).total_seconds()
        
        # Check access frequency
        access_count = item.access_count
        
        # Determine optimal level
        if time_until_access < 60 and access_count > 10:
            return CacheLevel.L1  # Hot data
        elif time_until_access < 3600 and access_count > 5:
            return CacheLevel.L2  # Warm data
        else:
            return CacheLevel.L3  # Cold data
            
    async def _get_from_l1(self, key: str) -> Optional[Any]:
        """Get value from L1 (Memory) cache"""
        if key in self.items[CacheLevel.L1]:
            item = self.items[CacheLevel.L1][key]
            item.last_accessed = datetime.now()
            item.access_count += 1
            return item.value
        return None
        
    async def _get_from_l2(self, key: str) -> Optional[Any]:
        """Get value from L2 (Local disk) cache"""
        if key in self.items[CacheLevel.L2]:
            item = self.items[CacheLevel.L2][key]
            item.last_accessed = datetime.now()
            item.access_count += 1
            return self._decompress_value(item.value, item.compression)
        return None
        
    async def _get_from_l3(self, key: str) -> Optional[Any]:
        """Get value from L3 (Redis) cache"""
        if key in self.items[CacheLevel.L3]:
            value = await self.redis.get(key)
            if value:
                return self._decompress_value(value, self.compression_method)
        return None
        
    async def _promote_to_l1(self, key: str, value: Any):
        """Promote item to L1 cache"""
        await self._ensure_space(CacheLevel.L1, len(json.dumps(value).encode('utf-8')))
        self.items[CacheLevel.L1][key] = CacheItem(
            key=key,
            value=value,
            created_at=datetime.now(),
            last_accessed=datetime.now(),
            access_count=1,
            size_bytes=len(json.dumps(value).encode('utf-8')),
            metadata={},
            compression=CompressionMethod.NONE
        )
        
    async def _promote_to_l2(self, key: str, value: Any):
        """Promote item to L2 cache"""
        compressed_value, compressed_size = self._compress_value(value)
        await self._ensure_space(CacheLevel.L2, compressed_size)
        self.items[CacheLevel.L2][key] = CacheItem(
            key=key,
            value=compressed_value,
            created_at=datetime.now(),
            last_accessed=datetime.now(),
            access_count=1,
            size_bytes=len(json.dumps(value).encode('utf-8')),
            metadata={},
            compression=self.compression_method,
            compressed_size=compressed_size
        )
        
    async def _set_in_l1(self, key: str, item: CacheItem):
        """Set item in L1 cache"""
        await self._ensure_space(CacheLevel.L1, item.size_bytes)
        self.items[CacheLevel.L1][key] = item
        self.current_size_bytes[CacheLevel.L1] += item.size_bytes
        self.metrics.size[CacheLevel.L1] = self.current_size_bytes[CacheLevel.L1]
        
    async def _set_in_l2(self, key: str, item: CacheItem):
        """Set item in L2 cache"""
        compressed_value, compressed_size = self._compress_value(item.value)
        await self._ensure_space(CacheLevel.L2, compressed_size)
        
        item.value = compressed_value
        item.compressed_size = compressed_size
        self.items[CacheLevel.L2][key] = item
        self.current_size_bytes[CacheLevel.L2] += compressed_size
        self.metrics.size[CacheLevel.L2] = self.current_size_bytes[CacheLevel.L2]
        
    async def _set_in_l3(self, key: str, item: CacheItem, ttl: Optional[int]):
        """Set item in L3 cache"""
        compressed_value, _ = self._compress_value(item.value)
        
        if ttl:
            await self.redis.setex(key, ttl, compressed_value)
        else:
            await self.redis.set(key, compressed_value)
            
        self.items[CacheLevel.L3].add(key)
        
    async def _ensure_space(self, level: CacheLevel, required_bytes: int):
        """Ensure enough space is available in cache level"""
        while self.current_size_bytes[level] + required_bytes > self.max_size_bytes[level]:
            if not await self._evict_item(level):
                raise Exception(f"Unable to make space in {level.value} cache")
                
    async def _evict_item(self, level: CacheLevel) -> bool:
        """Evict least valuable item from specified cache level"""
        if level == CacheLevel.L3:
            return True  # Redis handles its own eviction
            
        items = self.items[level]
        if not items:
            return False
            
        # Find item with worst score
        item_to_evict = min(
            items.values(),
            key=self.eviction_policy
        )
        
        # Remove from cache
        del items[item_to_evict.key]
        size_to_subtract = (
            item_to_evict.compressed_size
            if item_to_evict.compressed_size is not None
            else item_to_evict.size_bytes
        )
        self.current_size_bytes[level] -= size_to_subtract
        self.metrics.size[level] = self.current_size_bytes[level]
        self.metrics.evictions[level] += 1
        
        return True
        
    @lru_cache(maxsize=1000)
    def _get_l1_value(self, key: str) -> Optional[Any]:
        """LRU-cached getter for L1 cache"""
        if key in self.items[CacheLevel.L1]:
            return self.items[CacheLevel.L1][key].value
        return None

    def _get_eviction_policy(self):
        """Get the appropriate eviction policy based on strategy"""
        if self.strategy == CacheStrategy.LRU:
            return lambda item: item.last_accessed
        elif self.strategy == CacheStrategy.LFU:
            return lambda item: item.access_count
        elif self.strategy == CacheStrategy.ADAPTIVE:
            return lambda item: (
                item.access_count * 0.4 +
                item.last_accessed.timestamp() * 0.4 +
                item.size_bytes * -0.2
            )
        elif self.strategy == CacheStrategy.PREDICTIVE:
            return lambda item: (
                self.predictive_model.predict_next_access(item.key) or
                datetime.now()
            ).timestamp()
        else:  # INTELLIGENT
            return self._intelligent_eviction_score
            
    def _intelligent_eviction_score(self, item: CacheItem) -> float:
        """Calculate intelligent eviction score"""
        now = datetime.now()
        
        # Base score from access patterns
        recency_score = (now - item.last_accessed).total_seconds()
        frequency_score = item.access_count
        
        # Predictive component
        next_predicted = self.predictive_model.predict_next_access(item.key)
        prediction_score = (
            (next_predicted - now).total_seconds()
            if next_predicted else float('inf')
        )
        
        # Size efficiency
        size_score = item.access_count / (item.size_bytes + 1)
        
        # Combine scores (lower is better for eviction)
        return (
            recency_score * 0.3 +
            -frequency_score * 0.2 +
            prediction_score * 0.3 +
            -size_score * 0.2
        )
        
    async def _trigger_prefetch(self, key: str):
        """Trigger prefetching for correlated items"""
        correlations = self.predictive_model.correlations.get(key, {})
        
        # Get top correlated keys
        correlated_keys = sorted(
            correlations.items(),
            key=lambda x: x[1],
            reverse=True
        )[:5]  # Top 5 correlations
        
        # Add to prefetch queue
        for corr_key, correlation in correlated_keys:
            if correlation > 0.7:  # Only strong correlations
                await self.prefetch_queue.put(corr_key)
                
    async def start_prefetcher(self):
        """Start background prefetcher"""
        while True:
            try:
                key = await self.prefetch_queue.get()
                if key not in self.items:
                    # Implement actual prefetch logic here
                    pass
                await asyncio.sleep(0.1)  # Prevent overwhelming
            except Exception as e:
                logging.error(f"Prefetch error: {str(e)}")
                await asyncio.sleep(1)
                
    async def clear(self):
        """Clear all cache data"""
        self.items.clear()
        self.current_size_bytes = defaultdict(int)
        self.metrics = CacheMetrics()
        await self.redis.flushdb()
        
    def get_metrics(self) -> CacheMetrics:
        """Get current cache metrics"""
        if self.metrics.hits[CacheLevel.L1] + self.metrics.misses[CacheLevel.L1] > 0:
            self.metrics.prediction_accuracy = (
                self.metrics.hits[CacheLevel.L1] /
                (self.metrics.hits[CacheLevel.L1] + self.metrics.misses[CacheLevel.L1])
            )
        return self.metrics 