from typing import Dict, List, Optional, Set, Tuple
from dataclasses import dataclass
from datetime import datetime, timedelta
import logging
import random
from enum import Enum
import asyncio

class BalancingStrategy(Enum):
    ROUND_ROBIN = "round_robin"
    LEAST_CONNECTIONS = "least_connections"
    WEIGHTED_RESPONSE_TIME = "weighted_response_time"
    GEOGRAPHIC = "geographic"
    ADAPTIVE = "adaptive"

@dataclass
class Node:
    id: str
    capacity: float
    current_load: float
    health_score: float
    response_time: float
    location: str
    last_health_check: datetime
    active_connections: int
    total_requests: int
    failed_requests: int
    metrics: Dict[str, float]

@dataclass
class HealthStatus:
    is_healthy: bool
    response_time: float
    error_rate: float
    cpu_usage: float
    memory_usage: float
    timestamp: datetime

class GlobalLoadBalancer:
    def __init__(self):
        self.nodes: Dict[str, Node] = {}
        self.active_nodes: Set[str] = set()
        self.node_health_history: Dict[str, List[HealthStatus]] = {}
        self.strategy = BalancingStrategy.ADAPTIVE
        self.health_check_interval = 30  # seconds
        self.unhealthy_threshold = 0.7
        self.max_retries = 3
        self.geographic_regions = {
            "us-east": [],
            "us-west": [],
            "eu-west": [],
            "ap-east": []
        }
        self.request_history: List[Tuple[str, datetime, float]] = []
        self._last_node_index = 0  # For round-robin
        
    async def add_node(self, node: Node) -> None:
        """Add a new node to the load balancer"""
        self.nodes[node.id] = node
        self.active_nodes.add(node.id)
        self.node_health_history[node.id] = []
        
        # Add to geographic region
        region = self._get_node_region(node)
        if region in self.geographic_regions:
            self.geographic_regions[region].append(node.id)
            
        # Initial health check
        await self._check_node_health(node.id)
        
    async def remove_node(self, node_id: str) -> None:
        """Remove a node from the load balancer"""
        if node_id in self.active_nodes:
            self.active_nodes.remove(node_id)
        if node_id in self.nodes:
            del self.nodes[node_id]
        if node_id in self.node_health_history:
            del self.node_health_history[node_id]
            
        # Remove from geographic regions
        for region in self.geographic_regions.values():
            if node_id in region:
                region.remove(node_id)
                
    async def get_next_node(self, request_context: Dict) -> Optional[Node]:
        """Get the next available node based on the current strategy"""
        try:
            if not self.active_nodes:
                raise Exception("No active nodes available")
                
            # Select nodes based on strategy
            if self.strategy == BalancingStrategy.ROUND_ROBIN:
                return await self._round_robin_select()
            elif self.strategy == BalancingStrategy.LEAST_CONNECTIONS:
                return await self._least_connections_select()
            elif self.strategy == BalancingStrategy.WEIGHTED_RESPONSE_TIME:
                return await self._weighted_response_time_select()
            elif self.strategy == BalancingStrategy.GEOGRAPHIC:
                return await self._geographic_select(request_context.get("region"))
            elif self.strategy == BalancingStrategy.ADAPTIVE:
                return await self._adaptive_select(request_context)
                
        except Exception as e:
            logging.error(f"Node selection failed: {str(e)}")
            return None
            
    async def _round_robin_select(self) -> Optional[Node]:
        """Select next node using round-robin strategy"""
        active_nodes = list(self.active_nodes)
        if not active_nodes:
            return None
            
        self._last_node_index = (self._last_node_index + 1) % len(active_nodes)
        node_id = active_nodes[self._last_node_index]
        return self.nodes[node_id]
        
    async def _least_connections_select(self) -> Optional[Node]:
        """Select node with least active connections"""
        if not self.active_nodes:
            return None
            
        return min(
            [self.nodes[node_id] for node_id in self.active_nodes],
            key=lambda n: n.active_connections
        )
        
    async def _weighted_response_time_select(self) -> Optional[Node]:
        """Select node based on weighted response time"""
        if not self.active_nodes:
            return None
            
        # Calculate weights based on response times
        weights = []
        active_node_list = list(self.active_nodes)
        
        for node_id in active_node_list:
            node = self.nodes[node_id]
            # Lower response time = higher weight
            weight = 1.0 / (node.response_time + 0.1)  # Add 0.1 to avoid division by zero
            weights.append(weight)
            
        # Normalize weights
        total_weight = sum(weights)
        if total_weight == 0:
            return await self._round_robin_select()
            
        normalized_weights = [w/total_weight for w in weights]
        
        # Select node based on weights
        selected_index = random.choices(
            range(len(active_node_list)),
            weights=normalized_weights
        )[0]
        
        return self.nodes[active_node_list[selected_index]]
        
    async def _geographic_select(self, request_region: Optional[str]) -> Optional[Node]:
        """Select node based on geographic proximity"""
        if not request_region or request_region not in self.geographic_regions:
            return await self._round_robin_select()
            
        # Get nodes in the same region
        region_nodes = [
            self.nodes[node_id]
            for node_id in self.geographic_regions[request_region]
            if node_id in self.active_nodes
        ]
        
        if not region_nodes:
            # Fallback to closest region
            closest_region = self._find_closest_region(request_region)
            region_nodes = [
                self.nodes[node_id]
                for node_id in self.geographic_regions[closest_region]
                if node_id in self.active_nodes
            ]
            
        if not region_nodes:
            return await self._round_robin_select()
            
        # Select the node with best health score in the region
        return max(region_nodes, key=lambda n: n.health_score)
        
    async def _adaptive_select(self, request_context: Dict) -> Optional[Node]:
        """Adaptively select best node based on multiple factors"""
        if not self.active_nodes:
            return None
            
        scores = []
        active_node_list = list(self.active_nodes)
        
        for node_id in active_node_list:
            node = self.nodes[node_id]
            
            # Calculate composite score based on multiple factors
            response_time_score = 1.0 / (node.response_time + 0.1)
            load_score = 1.0 - (node.current_load / node.capacity)
            health_score = node.health_score
            connection_score = 1.0 / (node.active_connections + 1)
            
            # Geographic bonus
            geo_bonus = 1.0
            if request_context.get("region") == self._get_node_region(node):
                geo_bonus = 1.2
                
            # Calculate final score with weights
            final_score = (
                0.3 * response_time_score +
                0.25 * load_score +
                0.25 * health_score +
                0.2 * connection_score
            ) * geo_bonus
            
            scores.append(final_score)
            
        # Select node with highest score
        if not scores:
            return await self._round_robin_select()
            
        selected_index = scores.index(max(scores))
        return self.nodes[active_node_list[selected_index]]
        
    async def _check_node_health(self, node_id: str) -> None:
        """Check health status of a node"""
        try:
            node = self.nodes[node_id]
            
            # Simulate health check (replace with actual health check logic)
            health_status = await self._perform_health_check(node)
            
            # Update node metrics
            node.health_score = self._calculate_health_score(health_status)
            node.response_time = health_status.response_time
            node.metrics.update({
                "cpu_usage": health_status.cpu_usage,
                "memory_usage": health_status.memory_usage,
                "error_rate": health_status.error_rate
            })
            
            # Update health history
            self.node_health_history[node_id].append(health_status)
            
            # Trim history to last 24 hours
            cutoff_time = datetime.now() - timedelta(hours=24)
            self.node_health_history[node_id] = [
                status for status in self.node_health_history[node_id]
                if status.timestamp > cutoff_time
            ]
            
            # Update node status
            if node.health_score < self.unhealthy_threshold:
                if node_id in self.active_nodes:
                    self.active_nodes.remove(node_id)
                    logging.warning(f"Node {node_id} marked as unhealthy")
            else:
                if node_id not in self.active_nodes:
                    self.active_nodes.add(node_id)
                    logging.info(f"Node {node_id} marked as healthy")
                    
        except Exception as e:
            logging.error(f"Health check failed for node {node_id}: {str(e)}")
            if node_id in self.active_nodes:
                self.active_nodes.remove(node_id)
                
    async def _perform_health_check(self, node: Node) -> HealthStatus:
        """Perform actual health check on a node"""
        # Implementation would include actual health check logic
        # This is a simulation
        return HealthStatus(
            is_healthy=random.random() > 0.1,
            response_time=random.uniform(0.1, 2.0),
            error_rate=random.uniform(0, 0.1),
            cpu_usage=random.uniform(0.2, 0.8),
            memory_usage=random.uniform(0.3, 0.7),
            timestamp=datetime.now()
        )
        
    def _calculate_health_score(self, status: HealthStatus) -> float:
        """Calculate health score from status"""
        if not status.is_healthy:
            return 0.0
            
        # Weight different factors
        response_time_score = max(0, 1 - (status.response_time / 2.0))  # 2s is max acceptable
        error_rate_score = 1 - min(1, status.error_rate * 10)  # 10% error rate is max acceptable
        resource_score = 1 - max(status.cpu_usage, status.memory_usage)
        
        # Combine scores with weights
        return (
            0.4 * response_time_score +
            0.4 * error_rate_score +
            0.2 * resource_score
        )
        
    def _get_node_region(self, node: Node) -> str:
        """Get the geographic region of a node"""
        return node.location
        
    def _find_closest_region(self, region: str) -> str:
        """Find the closest region to the requested region"""
        # Simple region proximity map
        region_proximity = {
            "us-east": ["us-west", "eu-west", "ap-east"],
            "us-west": ["us-east", "ap-east", "eu-west"],
            "eu-west": ["us-east", "us-west", "ap-east"],
            "ap-east": ["us-west", "us-east", "eu-west"]
        }
        
        for nearby_region in region_proximity.get(region, []):
            if self.geographic_regions[nearby_region]:
                return nearby_region
                
        # Fallback to any region with active nodes
        for r, nodes in self.geographic_regions.items():
            if nodes:
                return r
                
        return region  # Fallback to original region
        
    async def start_health_checks(self):
        """Start periodic health checks"""
        while True:
            try:
                for node_id in list(self.nodes.keys()):
                    await self._check_node_health(node_id)
                await asyncio.sleep(self.health_check_interval)
            except Exception as e:
                logging.error(f"Health check cycle failed: {str(e)}")
                await asyncio.sleep(5)  # Wait before retry
                
    def update_strategy(self, strategy: BalancingStrategy):
        """Update the load balancing strategy"""
        self.strategy = strategy
        logging.info(f"Load balancing strategy updated to {strategy.value}")
        
    async def record_request(self, node_id: str, response_time: float):
        """Record request metrics for a node"""
        if node_id not in self.nodes:
            return
            
        node = self.nodes[node_id]
        node.total_requests += 1
        node.response_time = (node.response_time * 0.9 + response_time * 0.1)  # EMA
        
        # Update request history
        self.request_history.append((node_id, datetime.now(), response_time))
        
        # Trim history to last hour
        cutoff_time = datetime.now() - timedelta(hours=1)
        self.request_history = [
            r for r in self.request_history
            if r[1] > cutoff_time
        ]
        
    async def record_failure(self, node_id: str):
        """Record a request failure for a node"""
        if node_id not in self.nodes:
            return
            
        node = self.nodes[node_id]
        node.failed_requests += 1
        
        # Check if node should be marked as unhealthy
        recent_requests = len([
            r for r in self.request_history
            if r[0] == node_id and r[1] > datetime.now() - timedelta(minutes=5)
        ])
        
        if recent_requests > 0:
            error_rate = node.failed_requests / recent_requests
            if error_rate > 0.5:  # 50% error rate threshold
                await self._check_node_health(node_id) 