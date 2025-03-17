from typing import Dict, List, Optional
import asyncio
from datetime import datetime, timedelta
import psutil
import aiohttp
from collections import defaultdict
import statistics
from dataclasses import dataclass
import json
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
import pandas as pd
from backend.config import settings
from backend.core.monitoring import telemetry

@dataclass
class RegionMetrics:
    cpu_percent: float
    memory_percent: float
    network_latency: float
    cost_per_hour: float
    instance_count: int
    region: str

@dataclass
class ResourceMetrics:
    cpu_percent: float
    memory_percent: float
    disk_usage_percent: float
    network_io: Dict[str, int]
    timestamp: datetime
    cost_metrics: Optional[Dict[str, float]] = None

class ResourceManager:
    def __init__(self):
        self._metrics_history: List[ResourceMetrics] = []
        self._scaling_thresholds = {
            "cpu_high": 80.0,
            "cpu_low": 20.0,
            "memory_high": 85.0,
            "memory_low": 30.0
        }
        self._worker_pools: Dict[str, List[str]] = defaultdict(list)
        self._active_tasks: Dict[str, Dict] = {}
        self._last_scale_time = datetime.now()
        self._cooldown_period = timedelta(minutes=5)
        self._prediction_model = None
        self._scaler = StandardScaler()
        self._region_metrics: Dict[str, RegionMetrics] = {}
        self._cost_optimization_enabled = True
        
        # Start background tasks
        asyncio.create_task(self._train_prediction_model())
        asyncio.create_task(self._monitor_regions())
        asyncio.create_task(self._optimize_costs())

    async def collect_metrics(self) -> ResourceMetrics:
        """Collect current system metrics with cost tracking"""
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        network = psutil.net_io_counters()._asdict()

        # Calculate cost metrics
        cost_metrics = await self._calculate_cost_metrics()

        metrics = ResourceMetrics(
            cpu_percent=cpu_percent,
            memory_percent=memory.percent,
            disk_usage_percent=disk.percent,
            network_io=network,
            timestamp=datetime.now(),
            cost_metrics=cost_metrics
        )

        self._metrics_history.append(metrics)
        if len(self._metrics_history) > 100:
            self._metrics_history.pop(0)

        return metrics

    async def check_scaling_needs(self) -> Dict[str, bool]:
        """Check if scaling is needed based on current metrics and predictions"""
        if len(self._metrics_history) < 5:
            return {"scale_up": False, "scale_down": False}

        # Get current metrics
        recent_metrics = self._metrics_history[-5:]
        current_load = {
            "cpu": statistics.mean(m.cpu_percent for m in recent_metrics),
            "memory": statistics.mean(m.memory_percent for m in recent_metrics)
        }

        # Predict future load
        predicted_load = await self._predict_resource_usage(
            [m.__dict__ for m in self._metrics_history]
        )

        # Consider both current and predicted load
        scale_up = (
            current_load["cpu"] > self._scaling_thresholds["cpu_high"] or
            current_load["memory"] > self._scaling_thresholds["memory_high"] or
            predicted_load["cpu"] > self._scaling_thresholds["cpu_high"] or
            predicted_load["memory"] > self._scaling_thresholds["memory_high"]
        )

        scale_down = (
            current_load["cpu"] < self._scaling_thresholds["cpu_low"] and
            current_load["memory"] < self._scaling_thresholds["memory_low"] and
            predicted_load["cpu"] < self._scaling_thresholds["cpu_low"] and
            predicted_load["memory"] < self._scaling_thresholds["memory_low"]
        )

        # Check cooldown period
        if datetime.now() - self._last_scale_time < self._cooldown_period:
            return {"scale_up": False, "scale_down": False}

        # Consider cost optimization if enabled
        if self._cost_optimization_enabled:
            cost_metrics = await self._calculate_cost_metrics()
            if scale_up and cost_metrics["projected_cost"] > cost_metrics["budget"]:
                scale_up = False
                await self._log_cost_alert(cost_metrics)

        return {"scale_up": scale_up, "scale_down": scale_down}

    async def scale_resources(self, scale_up: bool):
        """Scale resources with cross-region balancing"""
        if scale_up:
            # Find optimal region for scaling
            target_region = await self._get_optimal_region()
            await self._scale_up(target_region)
        else:
            # Scale down in most expensive region first
            expensive_region = max(
                self._region_metrics.items(),
                key=lambda x: x[1].cost_per_hour
            )[0]
            await self._scale_down(expensive_region)
        
        self._last_scale_time = datetime.now()

    async def _scale_up(self, region: str):
        """Scale up resources in specified region"""
        for pool_name, workers in self._worker_pools.items():
            current_size = len(workers)
            
            # Calculate optimal increase based on load and predictions
            load_increase = await self._calculate_load_increase()
            target_size = current_size + max(1, int(current_size * load_increase))
            
            # Create new workers in optimal region
            for _ in range(current_size, target_size):
                worker_id = f"worker_{pool_name}_{len(workers)}_{region}"
                await self._create_worker(worker_id, pool_name, region)
                workers.append(worker_id)

    async def _scale_down(self, region: str):
        """Scale down resources in specified region"""
        for pool_name, workers in self._worker_pools.items():
            region_workers = [w for w in workers if region in w]
            current_size = len(region_workers)
            
            if current_size <= 1:
                continue
                
            # Calculate optimal decrease based on load and cost
            load_decrease = await self._calculate_load_decrease()
            target_size = max(1, int(current_size * (1 - load_decrease)))
            
            workers_to_remove = region_workers[target_size:]
            
            # Remove workers
            for worker_id in workers_to_remove:
                await self._remove_worker(worker_id, pool_name)
            
            self._worker_pools[pool_name] = [
                w for w in workers if w not in workers_to_remove
            ]

    async def _get_optimal_region(self) -> str:
        """Determine optimal region for scaling based on metrics"""
        best_region = None
        best_score = float('inf')
        
        for region, metrics in self._region_metrics.items():
            # Calculate region score (lower is better)
            score = (
                metrics.cpu_percent * 0.3 +
                metrics.memory_percent * 0.3 +
                metrics.network_latency * 0.2 +
                metrics.cost_per_hour * 0.2
            )
            
            if score < best_score:
                best_score = score
                best_region = region
                
        return best_region or settings.DEFAULT_REGION

    async def _predict_resource_usage(self, metrics_history: List[Dict]) -> Dict:
        """Predict future resource usage using machine learning"""
        if not self._prediction_model or len(metrics_history) < 24:
            return {"cpu": 0, "memory": 0}
            
        # Prepare features
        df = pd.DataFrame(metrics_history)
        features = df[[
            'cpu_percent', 'memory_percent',
            'disk_usage_percent'
        ]].values
        
        # Scale features
        scaled_features = self._scaler.transform(features)
        
        # Predict next hour
        try:
            predictions = self._prediction_model.predict(
                scaled_features[-24:].reshape(1, -1)
            )
            return {
                "cpu": predictions[0][0],
                "memory": predictions[0][1]
            }
        except Exception as e:
            await telemetry.logger.log_event(
                "ERROR",
                "prediction_failed",
                str(e)
            )
            return {"cpu": 0, "memory": 0}

    async def _train_prediction_model(self):
        """Train prediction model for resource usage"""
        while True:
            try:
                if len(self._metrics_history) >= 100:
                    # Prepare training data
                    df = pd.DataFrame([m.__dict__ for m in self._metrics_history])
                    
                    # Create features and targets
                    features = df[[
                        'cpu_percent', 'memory_percent',
                        'disk_usage_percent'
                    ]].values
                    
                    targets = df[[
                        'cpu_percent', 'memory_percent'
                    ]].shift(-1).dropna().values
                    
                    # Scale features
                    scaled_features = self._scaler.fit_transform(features[:-1])
                    
                    # Train model
                    self._prediction_model = LinearRegression()
                    self._prediction_model.fit(scaled_features, targets)
                    
            except Exception as e:
                await telemetry.logger.log_event(
                    "ERROR",
                    "model_training_failed",
                    str(e)
                )
                
            await asyncio.sleep(3600)  # Train every hour

    async def _monitor_regions(self):
        """Monitor metrics across regions"""
        while True:
            try:
                for region in settings.REGIONS:
                    metrics = await self._get_region_metrics(region)
                    self._region_metrics[region] = metrics
                    
                # Log region status
                await telemetry.logger.log_event(
                    "INFO",
                    "region_metrics",
                    {region: metrics.__dict__ 
                     for region, metrics in self._region_metrics.items()}
                )
                
            except Exception as e:
                await telemetry.logger.log_event(
                    "ERROR",
                    "region_monitoring_failed",
                    str(e)
                )
                
            await asyncio.sleep(60)  # Check every minute

    async def _get_region_metrics(self, region: str) -> RegionMetrics:
        """Get metrics for a specific region"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{settings.MONITORING_API}/regions/{region}/metrics"
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        return RegionMetrics(
                            cpu_percent=data["cpu_percent"],
                            memory_percent=data["memory_percent"],
                            network_latency=data["network_latency"],
                            cost_per_hour=data["cost_per_hour"],
                            instance_count=data["instance_count"],
                            region=region
                        )
        except Exception:
            pass
            
        # Return default metrics if API call fails
        return RegionMetrics(
            cpu_percent=0,
            memory_percent=0,
            network_latency=0,
            cost_per_hour=0,
            instance_count=0,
            region=region
        )

    async def _optimize_costs(self):
        """Continuously optimize resource costs"""
        while True:
            try:
                if not self._cost_optimization_enabled:
                    continue
                    
                current_costs = await self._calculate_cost_metrics()
                
                # Check if costs exceed budget
                if current_costs["current_cost"] > current_costs["budget"]:
                    # Find expensive, underutilized resources
                    for region, metrics in self._region_metrics.items():
                        if (metrics.cpu_percent < 50 and 
                            metrics.cost_per_hour > current_costs["average_cost"]):
                            # Scale down expensive region
                            await self._scale_down(region)
                            
                # Log cost metrics
                await telemetry.logger.log_event(
                    "INFO",
                    "cost_metrics",
                    current_costs
                )
                
            except Exception as e:
                await telemetry.logger.log_event(
                    "ERROR",
                    "cost_optimization_failed",
                    str(e)
                )
                
            await asyncio.sleep(300)  # Run every 5 minutes

    async def _calculate_cost_metrics(self) -> Dict[str, float]:
        """Calculate current and projected cost metrics"""
        try:
            total_cost = sum(
                metrics.cost_per_hour * metrics.instance_count
                for metrics in self._region_metrics.values()
            )
            
            return {
                "current_cost": total_cost,
                "projected_cost": total_cost * 24,  # Daily projection
                "budget": settings.DAILY_COST_BUDGET,
                "average_cost": total_cost / max(1, len(self._region_metrics))
            }
        except Exception:
            return {
                "current_cost": 0,
                "projected_cost": 0,
                "budget": settings.DAILY_COST_BUDGET,
                "average_cost": 0
            }

    async def _log_cost_alert(self, cost_metrics: Dict[str, float]):
        """Log cost-related alerts"""
        await telemetry.logger.log_event(
            "WARNING",
            "cost_alert",
            {
                "message": "Cost threshold exceeded",
                "metrics": cost_metrics
            }
        )

    async def _calculate_load_increase(self) -> float:
        """Calculate optimal load increase factor"""
        if not self._prediction_model:
            return 0.5  # Default 50% increase
            
        predicted_load = await self._predict_resource_usage(
            [m.__dict__ for m in self._metrics_history]
        )
        
        # Calculate increase factor based on predicted load
        cpu_factor = max(0, (predicted_load["cpu"] - 50) / 50)
        memory_factor = max(0, (predicted_load["memory"] - 50) / 50)
        
        return max(0.2, min(1.0, (cpu_factor + memory_factor) / 2))

    async def _calculate_load_decrease(self) -> float:
        """Calculate optimal load decrease factor"""
        if not self._prediction_model:
            return 0.2  # Default 20% decrease
            
        predicted_load = await self._predict_resource_usage(
            [m.__dict__ for m in self._metrics_history]
        )
        
        # Calculate decrease factor based on predicted load
        cpu_factor = max(0, (50 - predicted_load["cpu"]) / 50)
        memory_factor = max(0, (50 - predicted_load["memory"]) / 50)
        
        return max(0.1, min(0.5, (cpu_factor + memory_factor) / 2))

    async def _create_worker(self, worker_id: str, pool_name: str, region: str):
        """Create a new worker"""
        # Implementation depends on deployment platform
        try:
            # Example: Create a new container/instance
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{settings.DEPLOYMENT_API}/workers",
                    json={
                        "worker_id": worker_id,
                        "pool_name": pool_name,
                        "region": region,
                        "resources": self._get_worker_resources()
                    }
                ) as response:
                    if response.status != 201:
                        raise Exception(f"Failed to create worker: {await response.text()}")
        except Exception as e:
            await telemetry.logger.log_event(
                "ERROR",
                "worker_creation_failed",
                str(e),
                {"worker_id": worker_id, "pool_name": pool_name, "region": region}
            )
            raise

    async def _remove_worker(self, worker_id: str, pool_name: str):
        """Remove a worker"""
        try:
            # Wait for worker to complete current tasks
            await self._drain_worker(worker_id)
            
            # Remove worker
            async with aiohttp.ClientSession() as session:
                async with session.delete(
                    f"{settings.DEPLOYMENT_API}/workers/{worker_id}"
                ) as response:
                    if response.status != 200:
                        raise Exception(f"Failed to remove worker: {await response.text()}")
        except Exception as e:
            await telemetry.logger.log_event(
                "ERROR",
                "worker_removal_failed",
                str(e),
                {"worker_id": worker_id, "pool_name": pool_name}
            )
            raise

    async def _drain_worker(self, worker_id: str):
        """Wait for worker to complete current tasks"""
        max_wait = 300  # 5 minutes
        wait_start = datetime.now()
        
        while worker_id in self._active_tasks:
            if (datetime.now() - wait_start).total_seconds() > max_wait:
                # Force removal after timeout
                break
            await asyncio.sleep(5)

    def _get_worker_resources(self) -> Dict:
        """Get resource requirements for new worker"""
        return {
            "cpu": "1",
            "memory": "2Gi",
            "disk": "10Gi"
        }

    async def distribute_tasks(self, tasks: List[Dict]):
        """Distribute tasks across worker pools"""
        for task in tasks:
            pool_name = self._get_pool_for_task(task)
            workers = self._worker_pools[pool_name]
            
            if not workers:
                raise Exception(f"No workers available in pool {pool_name}")
            
            # Simple round-robin distribution
            worker_index = len(self._active_tasks) % len(workers)
            worker_id = workers[worker_index]
            
            self._active_tasks[task["id"]] = {
                "worker_id": worker_id,
                "start_time": datetime.now()
            }
            
            await self._assign_task(worker_id, task)

    def _get_pool_for_task(self, task: Dict) -> str:
        """Determine which worker pool should handle the task"""
        # Example: Route based on task type
        task_type = task.get("type", "default")
        return f"pool_{task_type}"

    async def _assign_task(self, worker_id: str, task: Dict):
        """Assign task to worker"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{settings.WORKER_API}/{worker_id}/tasks",
                    json=task
                ) as response:
                    if response.status != 202:
                        raise Exception(f"Failed to assign task: {await response.text()}")
        except Exception as e:
            await telemetry.logger.log_event(
                "ERROR",
                "task_assignment_failed",
                str(e),
                {"worker_id": worker_id, "task_id": task["id"]}
            )
            raise

    async def monitor_resources(self):
        """Continuous resource monitoring and scaling"""
        while True:
            try:
                # Collect metrics
                metrics = await self.collect_metrics()
                
                # Check scaling needs
                scaling_needs = await self.check_scaling_needs()
                
                # Scale if needed
                if scaling_needs["scale_up"] or scaling_needs["scale_down"]:
                    await self.scale_resources(scaling_needs["scale_up"])
                
                # Log metrics
                await telemetry.logger.log_event(
                    "INFO",
                    "resource_metrics",
                    "Resource metrics collected",
                    {
                        "metrics": metrics.__dict__,
                        "scaling_needs": scaling_needs
                    }
                )
                
            except Exception as e:
                await telemetry.logger.log_event(
                    "ERROR",
                    "resource_monitoring_failed",
                    str(e)
                )
                
            await asyncio.sleep(60)  # Check every minute

# Global instance
resource_manager = ResourceManager() 