from typing import Dict, List, Any, Optional
import aiohttp
import asyncio
from datetime import datetime
import logging
from dataclasses import dataclass
import json
from backend.core.monitoring.telemetry import monitor
from backend.core.error_handling.error_manager import error_manager
from backend.config import settings

logger = logging.getLogger(__name__)

@dataclass
class ServiceInstance:
    id: str
    name: str
    version: str
    address: str
    port: int
    health: float = 1.0
    last_check: datetime = None
    metadata: Dict[str, Any] = None

@dataclass
class ServiceRoute:
    service: str
    path: str
    methods: List[str]
    version: str
    timeout: int
    retry_count: int
    circuit_breaker: bool

class ServiceMesh:
    def __init__(self):
        self._services: Dict[str, List[ServiceInstance]] = {}
        self._routes: Dict[str, ServiceRoute] = {}
        self._health_checks: Dict[str, datetime] = {}
        self._circuit_states: Dict[str, bool] = {}
        self._load_balancers: Dict[str, int] = {}
        self._session: Optional[aiohttp.ClientSession] = None
        
        # Start background tasks
        asyncio.create_task(self._health_check_loop())
        asyncio.create_task(self._update_service_registry())

    async def initialize(self):
        """Initialize service mesh"""
        self._session = aiohttp.ClientSession()
        await self._load_service_config()
        await self._register_service()

    async def _load_service_config(self):
        """Load service mesh configuration"""
        # Example configuration
        self._routes = {
            "assignment_service": ServiceRoute(
                service="assignment_service",
                path="/api/v1/assignments",
                methods=["GET", "POST", "PUT", "DELETE"],
                version="1.0",
                timeout=30,
                retry_count=3,
                circuit_breaker=True
            ),
            "user_service": ServiceRoute(
                service="user_service",
                path="/api/v1/users",
                methods=["GET", "POST", "PUT", "DELETE"],
                version="1.0",
                timeout=30,
                retry_count=3,
                circuit_breaker=True
            )
        }

    async def _register_service(self):
        """Register current service with service registry"""
        service = ServiceInstance(
            id=settings.SERVICE_ID,
            name=settings.APP_NAME,
            version=settings.VERSION,
            address=settings.HOST,
            port=settings.PORT,
            metadata={
                "environment": settings.ENVIRONMENT,
                "region": settings.DEFAULT_REGION
            }
        )
        
        try:
            async with self._session.post(
                f"{settings.SERVICE_REGISTRY_URL}/register",
                json=service.__dict__
            ) as response:
                if response.status != 200:
                    raise Exception(f"Service registration failed: {await response.text()}")
                logger.info(f"Service registered: {service.name}")
        except Exception as e:
            await error_manager.handle_error(e)

    @monitor("service_mesh_request")
    async def route_request(
        self,
        service: str,
        method: str,
        path: str,
        data: Optional[Dict] = None,
        headers: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Route request to appropriate service"""
        if service not in self._routes:
            raise ValueError(f"Unknown service: {service}")
            
        route = self._routes[service]
        if method not in route.methods:
            raise ValueError(f"Method {method} not supported for {service}")
            
        # Check circuit breaker
        if route.circuit_breaker and self._circuit_states.get(service, False):
            raise Exception(f"Circuit breaker open for {service}")
            
        # Get service instance using load balancing
        instance = await self._get_service_instance(service)
        if not instance:
            raise Exception(f"No healthy instances available for {service}")
            
        # Prepare request
        url = f"http://{instance.address}:{instance.port}{path}"
        headers = headers or {}
        headers.update({
            "X-Service-Name": settings.APP_NAME,
            "X-Service-Version": settings.VERSION,
            "X-Request-ID": settings.SERVICE_ID
        })
        
        # Execute request with retries
        for attempt in range(route.retry_count):
            try:
                async with self._session.request(
                    method,
                    url,
                    json=data,
                    headers=headers,
                    timeout=route.timeout
                ) as response:
                    if response.status >= 500 and attempt < route.retry_count - 1:
                        await asyncio.sleep(1 * (attempt + 1))  # Exponential backoff
                        continue
                        
                    response_data = await response.json()
                    
                    # Update instance health
                    if response.status < 500:
                        instance.health = min(1.0, instance.health + 0.1)
                    else:
                        instance.health = max(0.0, instance.health - 0.3)
                        if instance.health == 0:
                            await self._handle_instance_failure(service, instance)
                    
                    return response_data
                    
            except Exception as e:
                instance.health = max(0.0, instance.health - 0.3)
                if attempt == route.retry_count - 1:
                    await self._handle_instance_failure(service, instance)
                    raise

    async def _get_service_instance(self, service: str) -> Optional[ServiceInstance]:
        """Get service instance using load balancing"""
        instances = self._services.get(service, [])
        healthy_instances = [i for i in instances if i.health > 0]
        
        if not healthy_instances:
            return None
            
        # Round-robin load balancing
        index = self._load_balancers.get(service, 0)
        instance = healthy_instances[index % len(healthy_instances)]
        self._load_balancers[service] = index + 1
        
        return instance

    async def _handle_instance_failure(
        self,
        service: str,
        instance: ServiceInstance
    ):
        """Handle service instance failure"""
        logger.warning(f"Service instance failed: {service} ({instance.id})")
        
        # Update circuit breaker
        if self._routes[service].circuit_breaker:
            failed_instances = len(
                [i for i in self._services[service] if i.health == 0]
            )
            if failed_instances / len(self._services[service]) > 0.5:
                self._circuit_states[service] = True
                logger.error(f"Circuit breaker opened for {service}")
        
        # Notify monitoring
        await error_manager.handle_error(
            Exception(f"Service instance failed: {service}"),
            context={
                "service": service,
                "instance_id": instance.id,
                "address": instance.address
            }
        )

    async def _health_check_loop(self):
        """Continuously check service health"""
        while True:
            try:
                for service, instances in self._services.items():
                    for instance in instances:
                        try:
                            async with self._session.get(
                                f"http://{instance.address}:{instance.port}/health",
                                timeout=5
                            ) as response:
                                if response.status == 200:
                                    instance.health = min(1.0, instance.health + 0.1)
                                    instance.last_check = datetime.now()
                                    
                                    # Reset circuit breaker if all instances are healthy
                                    if (self._routes[service].circuit_breaker and
                                        self._circuit_states.get(service, False)):
                                        healthy_count = len(
                                            [i for i in instances if i.health > 0.5]
                                        )
                                        if healthy_count / len(instances) > 0.7:
                                            self._circuit_states[service] = False
                                            logger.info(
                                                f"Circuit breaker closed for {service}"
                                            )
                                else:
                                    instance.health = max(0.0, instance.health - 0.3)
                                    
                        except Exception:
                            instance.health = max(0.0, instance.health - 0.3)
                            
            except Exception as e:
                await error_manager.handle_error(e)
                
            await asyncio.sleep(10)  # Check every 10 seconds

    async def _update_service_registry(self):
        """Periodically update service registry"""
        while True:
            try:
                async with self._session.get(
                    f"{settings.SERVICE_REGISTRY_URL}/services"
                ) as response:
                    if response.status == 200:
                        services = await response.json()
                        self._services = {
                            name: [
                                ServiceInstance(**instance)
                                for instance in instances
                            ]
                            for name, instances in services.items()
                        }
            except Exception as e:
                await error_manager.handle_error(e)
                
            await asyncio.sleep(30)  # Update every 30 seconds

    async def close(self):
        """Close service mesh connections"""
        if self._session:
            await self._session.close()

# Global instance
service_mesh = ServiceMesh() 