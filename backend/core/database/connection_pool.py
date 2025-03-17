from typing import Dict, List, Optional
from asyncpg import create_pool, Pool
from collections import defaultdict
import asyncio
from datetime import datetime, timedelta
import statistics
from dataclasses import dataclass
from backend.config import settings
from backend.core.cache.multi_level_cache import cache_instance

@dataclass
class ReplicaStats:
    latency: float
    error_rate: float
    load: float
    last_check: datetime

class AdvancedConnectionPool:
    def __init__(self):
        self._main_pool: Optional[Pool] = None
        self._read_replicas: List[Pool] = []
        self._shard_pools: Dict[str, Pool] = {}
        self._replica_stats: Dict[str, ReplicaStats] = {}
        self._schema_version: str = "1.0.0"
        self._query_stats: Dict[str, Dict] = defaultdict(lambda: {
            "execution_time": [],
            "frequency": 0,
            "last_optimized": None
        })

    async def initialize(self):
        # Initialize main pool
        self._main_pool = await create_pool(
            dsn=settings.DATABASE_URL,
            min_size=settings.DB_POOL_MIN_SIZE,
            max_size=settings.DB_POOL_MAX_SIZE,
            command_timeout=settings.DB_COMMAND_TIMEOUT
        )
        
        # Initialize read replicas with health monitoring
        for replica_url in settings.READ_REPLICA_URLS:
            replica = await create_pool(dsn=replica_url)
            self._read_replicas.append(replica)
            self._replica_stats[replica_url] = ReplicaStats(
                latency=0.0,
                error_rate=0.0,
                load=0.0,
                last_check=datetime.now()
            )
            
        # Initialize shards
        for shard_id, shard_url in settings.SHARD_URLS.items():
            self._shard_pools[shard_id] = await create_pool(dsn=shard_url)

        # Start background tasks
        asyncio.create_task(self._monitor_replicas())
        asyncio.create_task(self._optimize_queries())
        await self._check_schema_version()

    async def get_connection(self, read_only: bool = False, shard_key: Optional[str] = None):
        if shard_key:
            return await self._get_shard_connection(shard_key)
        if read_only and self._read_replicas:
            return await self._get_optimal_replica()
        return await self._main_pool.acquire()

    async def _get_optimal_replica(self) -> Pool:
        """Select the best replica based on health metrics"""
        best_replica = None
        best_score = float('inf')
        
        for i, replica in enumerate(self._read_replicas):
            stats = self._replica_stats[settings.READ_REPLICA_URLS[i]]
            
            # Calculate health score (lower is better)
            score = (
                stats.latency * 0.4 +  # 40% weight for latency
                stats.error_rate * 0.3 +  # 30% weight for error rate
                stats.load * 0.3  # 30% weight for load
            )
            
            if score < best_score:
                best_score = score
                best_replica = replica
        
        return await best_replica.acquire()

    async def execute_query(self, query: str, params: tuple = None, read_only: bool = False):
        """Execute query with caching and optimization"""
        cache_key = f"query:{hash(query)}:{hash(str(params))}"
        
        # Try cache for read-only queries
        if read_only:
            cached_result = await cache_instance.get(cache_key)
            if cached_result:
                return cached_result

        # Get connection and execute
        start_time = datetime.now()
        try:
            async with self.get_connection(read_only=read_only) as conn:
                result = await conn.fetch(query, *params) if params else await conn.fetch(query)
                
            # Update query statistics
            execution_time = (datetime.now() - start_time).total_seconds()
            self._update_query_stats(query, execution_time)
            
            # Cache result for read-only queries
            if read_only:
                await cache_instance.set(cache_key, result, ttl=300)
            
            return result
            
        except Exception as e:
            # Update error statistics
            if read_only:
                replica_url = settings.READ_REPLICA_URLS[0]  # Get actual replica URL
                stats = self._replica_stats[replica_url]
                stats.error_rate = (stats.error_rate * 9 + 1) / 10  # Rolling average
            raise

    async def _monitor_replicas(self):
        """Continuously monitor replica health"""
        while True:
            for i, replica in enumerate(self._read_replicas):
                replica_url = settings.READ_REPLICA_URLS[i]
                try:
                    start_time = datetime.now()
                    async with replica.acquire() as conn:
                        await conn.execute('SELECT 1')
                    
                    # Update statistics
                    stats = self._replica_stats[replica_url]
                    stats.latency = (datetime.now() - start_time).total_seconds()
                    stats.error_rate = (stats.error_rate * 9) / 10  # Decrease error rate
                    stats.load = await self._get_replica_load(replica)
                    stats.last_check = datetime.now()
                    
                except Exception:
                    # Update error statistics
                    stats = self._replica_stats[replica_url]
                    stats.error_rate = (stats.error_rate * 9 + 1) / 10
            
            await asyncio.sleep(10)  # Check every 10 seconds

    async def _optimize_queries(self):
        """Periodically optimize frequently executed queries"""
        while True:
            for query, stats in self._query_stats.items():
                if stats["frequency"] > 100 and (
                    not stats["last_optimized"] or 
                    datetime.now() - stats["last_optimized"] > timedelta(hours=1)
                ):
                    await self._analyze_and_optimize_query(query)
            
            await asyncio.sleep(3600)  # Run every hour

    def _update_query_stats(self, query: str, execution_time: float):
        """Update query statistics for optimization"""
        stats = self._query_stats[query]
        stats["execution_time"].append(execution_time)
        stats["frequency"] += 1
        
        # Keep only last 100 execution times
        if len(stats["execution_time"]) > 100:
            stats["execution_time"].pop(0)

    async def _analyze_and_optimize_query(self, query: str):
        """Analyze and optimize a query"""
        stats = self._query_stats[query]
        avg_execution_time = statistics.mean(stats["execution_time"])
        
        async with self._main_pool.acquire() as conn:
            # Get query plan
            plan = await conn.fetch(f"EXPLAIN ANALYZE {query}")
            
            # Analyze plan and create indexes if needed
            if avg_execution_time > 0.1:  # If query takes more than 100ms on average
                await self._create_indexes_for_query(conn, query, plan)
            
        stats["last_optimized"] = datetime.now()

    async def _check_schema_version(self):
        """Check and update schema version"""
        async with self._main_pool.acquire() as conn:
            # Create version table if not exists
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS schema_version (
                    version VARCHAR(50) PRIMARY KEY,
                    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Check current version
            current_version = await conn.fetchval(
                "SELECT version FROM schema_version ORDER BY applied_at DESC LIMIT 1"
            )
            
            if current_version != self._schema_version:
                await self._migrate_schema(current_version)

    async def _migrate_schema(self, current_version: Optional[str]):
        """Handle schema migrations"""
        if not current_version:
            # Initial schema creation
            async with self._main_pool.acquire() as conn:
                await conn.execute("""
                    INSERT INTO schema_version (version) VALUES ($1)
                """, self._schema_version)
        else:
            # Implement migration logic here
            pass

    async def _get_shard_connection(self, shard_key: str):
        shard_id = self._calculate_shard_id(shard_key)
        if shard_id not in self._shard_pools:
            raise ValueError(f"No shard found for key: {shard_key}")
        return await self._shard_pools[shard_id].acquire()

    def _calculate_shard_id(self, shard_key: str) -> str:
        # Simple hash-based sharding
        hash_value = hash(shard_key)
        shard_count = len(self._shard_pools)
        return str(hash_value % shard_count)

    async def health_check(self):
        """Perform health check on all pools"""
        async def check_pool(pool: Pool, pool_name: str):
            try:
                async with pool.acquire() as conn:
                    await conn.execute('SELECT 1')
                self._last_health_check[pool_name] = datetime.now()
                return True
            except Exception as e:
                self._pool_stats[pool_name]["errors"] += 1
                return False

        tasks = []
        # Check main pool
        tasks.append(check_pool(self._main_pool, "main"))
        
        # Check read replicas
        for i, replica in enumerate(self._read_replicas):
            tasks.append(check_pool(replica, f"replica_{i}"))
            
        # Check shards
        for shard_id, pool in self._shard_pools.items():
            tasks.append(check_pool(pool, f"shard_{shard_id}"))

        results = await asyncio.gather(*tasks, return_exceptions=True)
        return all(results)

    async def close(self):
        """Close all connection pools"""
        if self._main_pool:
            await self._main_pool.close()
        
        for replica in self._read_replicas:
            await replica.close()
            
        for pool in self._shard_pools.values():
            await pool.close()

# Global instance
pool = AdvancedConnectionPool() 