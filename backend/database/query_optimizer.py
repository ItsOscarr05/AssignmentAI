import re
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any, Optional
import logging
from prometheus_client import Histogram, Counter
import time
import asyncio
from functools import wraps

logger = logging.getLogger(__name__)

# Performance metrics
QUERY_LATENCY = Histogram(
    'query_duration_seconds',
    'Query execution latency',
    ['query_type', 'operation']
)

QUERY_CACHE_HITS = Counter(
    'query_cache_hits_total',
    'Number of query cache hits',
    ['query_type']
)

class QueryOptimizer:
    def __init__(self):
        self.query_stats: Dict[str, Dict[str, float]] = {}
        self.query_cache: Dict[str, Any] = {}
        self.cache_ttl = 300  # 5 minutes default TTL
        
    async def analyze_query(self, session: AsyncSession, query: str) -> Dict[str, Any]:
        """Analyze query performance and suggest optimizations"""
        try:
            # Get query execution plan
            result = await session.execute(
                text(f"EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) {query}")
            )
            plan = result.scalar()
            
            # Analyze the execution plan
            analysis = self._analyze_execution_plan(plan[0])
            
            # Store query statistics
            query_hash = self._compute_query_hash(query)
            self.query_stats[query_hash] = {
                'last_execution_time': time.time(),
                'execution_time': analysis['execution_time'],
                'table_scans': analysis['table_scans'],
                'index_usage': analysis['index_usage']
            }
            
            return analysis
            
        except Exception as e:
            logger.error(f"Query analysis failed: {str(e)}")
            return {}
    
    def _analyze_execution_plan(self, plan: Dict) -> Dict[str, Any]:
        """Analyze query execution plan for optimization opportunities"""
        analysis = {
            'execution_time': plan.get('Execution Time', 0),
            'table_scans': [],
            'index_usage': [],
            'recommendations': []
        }
        
        # Analyze plan nodes
        self._analyze_plan_node(plan['Plan'], analysis)
        
        # Generate recommendations
        if analysis['table_scans']:
            analysis['recommendations'].append(
                f"Consider adding indexes for tables: {', '.join(analysis['table_scans'])}"
            )
        
        return analysis
    
    def _analyze_plan_node(self, node: Dict, analysis: Dict) -> None:
        """Recursively analyze plan nodes"""
        # Check for sequential scans
        if node['Node Type'] == 'Seq Scan':
            analysis['table_scans'].append(node['Relation Name'])
        
        # Check for index usage
        elif 'Index' in node['Node Type']:
            analysis['index_usage'].append({
                'table': node.get('Relation Name'),
                'index': node.get('Index Name')
            })
        
        # Recurse through child nodes
        for child in node.get('Plans', []):
            self._analyze_plan_node(child, analysis)
    
    async def optimize_query(self, session: AsyncSession, query: str) -> str:
        """Optimize query based on analysis"""
        analysis = await self.analyze_query(session, query)
        
        optimized_query = query
        
        # Apply optimizations based on analysis
        if analysis.get('recommendations'):
            for recommendation in analysis['recommendations']:
                if 'indexes' in recommendation.lower():
                    # Extract table and column information
                    table_info = self._extract_table_info(query)
                    if table_info:
                        optimized_query = self._add_index_hints(
                            query, table_info
                        )
        
        return optimized_query
    
    async def batch_queries(
        self,
        session: AsyncSession,
        queries: List[str]
    ) -> List[Any]:
        """Execute multiple queries efficiently"""
        start_time = time.time()
        try:
            # Group similar queries
            query_groups = self._group_similar_queries(queries)
            
            # Execute query groups
            results = []
            for group in query_groups:
                if len(group) == 1:
                    # Single query execution
                    result = await session.execute(text(group[0]))
                    results.extend(result.fetchall())
                else:
                    # Batch similar queries
                    batch_query = self._create_batch_query(group)
                    result = await session.execute(text(batch_query))
                    results.extend(result.fetchall())
            
            return results
            
        finally:
            elapsed = time.time() - start_time
            QUERY_LATENCY.labels(
                query_type='batch',
                operation='execute'
            ).observe(elapsed)
    
    def _group_similar_queries(self, queries: List[str]) -> List[List[str]]:
        """Group similar queries for batch execution"""
        groups: Dict[str, List[str]] = {}
        
        for query in queries:
            # Generate query signature
            signature = self._generate_query_signature(query)
            
            if signature not in groups:
                groups[signature] = []
            groups[signature].append(query)
        
        return list(groups.values())
    
    def _generate_query_signature(self, query: str) -> str:
        """Generate a signature for query grouping"""
        # Remove literals and specific values
        normalized = self._normalize_query(query)
        return normalized
    
    def _normalize_query(self, query: str) -> str:
        """Normalize query for comparison"""
        # Implementation of query normalization
        # This would remove specific values, standardize whitespace, etc.
        return query.strip().lower()
    
    def _create_batch_query(self, queries: List[str]) -> str:
        """Combine similar queries into a batch query"""
        if not queries:
            return ""
            
        # For SELECT queries, use UNION ALL
        if all(q.strip().lower().startswith('select') for q in queries):
            return " UNION ALL ".join(queries)
            
        # For INSERT queries, use bulk insert
        if all(q.strip().lower().startswith('insert') for q in queries):
            return self._create_bulk_insert(queries)
            
        return ";\n".join(queries)
    
    def _create_bulk_insert(self, queries: List[str]) -> str:
        """Create a bulk insert query from multiple insert queries"""
        # Extract table name and columns from first query
        first_query = queries[0]
        table_match = re.match(
            r"insert\s+into\s+(\w+)\s*\((.*?)\)\s*values",
            first_query.lower()
        )
        if not table_match:
            return ";\n".join(queries)
            
        table_name = table_match.group(1)
        columns = table_match.group(2)
        
        # Extract values from all queries
        values_list = []
        for query in queries:
            values_match = re.search(r"values\s*\((.*?)\)", query.lower())
            if values_match:
                values_list.append(f"({values_match.group(1)})")
        
        # Combine into bulk insert
        return f"INSERT INTO {table_name} ({columns}) VALUES {','.join(values_list)}"
    
    def cache_query(self, ttl: int = 300):
        """Decorator for caching query results"""
        def decorator(func):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                # Generate cache key
                cache_key = f"{func.__name__}:{str(args)}:{str(kwargs)}"
                
                # Check cache
                cached_result = self.query_cache.get(cache_key)
                if cached_result and time.time() - cached_result['timestamp'] < ttl:
                    QUERY_CACHE_HITS.labels(
                        query_type=func.__name__
                    ).inc()
                    return cached_result['data']
                
                # Execute query
                result = await func(*args, **kwargs)
                
                # Cache result
                self.query_cache[cache_key] = {
                    'data': result,
                    'timestamp': time.time()
                }
                
                return result
            return wrapper
        return decorator

    async def get_query_stats(self, session: AsyncSession) -> Dict[str, Any]:
        """Get comprehensive query statistics"""
        stats = {
            'query_counts': {},
            'average_latency': {},
            'cache_hits': {},
            'optimization_impact': {}
        }
        
        for query_hash, data in self.query_stats.items():
            query_type = self._get_query_type(query_hash)
            
            # Aggregate statistics by query type
            if query_type not in stats['query_counts']:
                stats['query_counts'][query_type] = 0
                stats['average_latency'][query_type] = 0
                stats['cache_hits'][query_type] = 0
                stats['optimization_impact'][query_type] = 0
            
            stats['query_counts'][query_type] += 1
            stats['average_latency'][query_type] += data['execution_time']
            stats['cache_hits'][query_type] += data.get('cache_hits', 0)
            
            # Calculate optimization impact
            if 'original_time' in data and 'execution_time' in data:
                improvement = (
                    data['original_time'] - data['execution_time']
                ) / data['original_time'] * 100
                stats['optimization_impact'][query_type] += improvement
        
        # Calculate averages
        for query_type in stats['average_latency']:
            count = stats['query_counts'][query_type]
            if count > 0:
                stats['average_latency'][query_type] /= count
                stats['optimization_impact'][query_type] /= count
        
        return stats
    
    async def get_optimization_suggestions(
        self,
        session: AsyncSession
    ) -> List[Dict[str, Any]]:
        """Get suggestions for query optimization"""
        suggestions = []
        
        # Analyze slow queries
        slow_queries = self._identify_slow_queries()
        for query_hash, data in slow_queries.items():
            analysis = await self.analyze_query(session, data['query'])
            
            if analysis.get('recommendations'):
                suggestions.append({
                    'query_type': self._get_query_type(query_hash),
                    'current_latency': data['execution_time'],
                    'recommendations': analysis['recommendations'],
                    'estimated_improvement': self._estimate_improvement(analysis)
                })
        
        # Analyze cache effectiveness
        cache_suggestions = self._analyze_cache_effectiveness()
        suggestions.extend(cache_suggestions)
        
        return suggestions
    
    def _identify_slow_queries(self) -> Dict[str, Dict[str, Any]]:
        """Identify consistently slow queries"""
        slow_queries = {}
        
        for query_hash, data in self.query_stats.items():
            avg_time = data['execution_time']
            if avg_time > 0.1:  # Queries taking more than 100ms
                slow_queries[query_hash] = {
                    'query': data.get('query', ''),
                    'execution_time': avg_time,
                    'frequency': data.get('frequency', 1)
                }
        
        return slow_queries
    
    def _analyze_cache_effectiveness(self) -> List[Dict[str, Any]]:
        """Analyze cache hit rates and suggest improvements"""
        suggestions = []
        
        for query_hash, data in self.query_stats.items():
            cache_hits = data.get('cache_hits', 0)
            total_executions = data.get('frequency', 1)
            
            if total_executions > 10:  # Only analyze frequently executed queries
                hit_rate = cache_hits / total_executions
                
                if hit_rate < 0.5:  # Less than 50% cache hit rate
                    suggestions.append({
                        'query_type': self._get_query_type(query_hash),
                        'current_hit_rate': hit_rate,
                        'recommendation': 'Consider adjusting cache TTL or implementing predictive caching',
                        'estimated_improvement': '30-50% reduction in database load'
                    })
        
        return suggestions
    
    def _estimate_improvement(self, analysis: Dict[str, Any]) -> str:
        """Estimate potential improvement from implementing recommendations"""
        improvement = 0
        
        # Calculate based on different factors
        if analysis.get('table_scans'):
            improvement += 20  # Potential improvement from adding indexes
        
        if analysis.get('index_usage'):
            improvement += 10  # Potential improvement from better index usage
        
        if improvement > 0:
            return f"{improvement}% potential latency reduction"
        return "Minimal improvement expected"
    
    def _get_query_type(self, query_hash: str) -> str:
        """Determine the type of query"""
        query = self.query_stats.get(query_hash, {}).get('query', '').lower()
        
        if 'select' in query:
            return 'SELECT'
        elif 'insert' in query:
            return 'INSERT'
        elif 'update' in query:
            return 'UPDATE'
        elif 'delete' in query:
            return 'DELETE'
        return 'OTHER'

# Initialize query optimizer
query_optimizer = QueryOptimizer() 