from typing import Dict, Any, Optional
import grpc
from google.protobuf import json_format
import asyncio
from datetime import datetime
import logging
from backend.core.monitoring.telemetry import monitor
from backend.core.error_handling.error_manager import error_manager
from backend.config import settings

# Note: This assumes you have generated gRPC stubs from your .proto files
# Import your generated stubs here
# from backend.protos import your_service_pb2, your_service_pb2_grpc

logger = logging.getLogger(__name__)

class GRPCManager:
    def __init__(self):
        self._channels: Dict[str, grpc.aio.Channel] = {}
        self._stubs: Dict[str, Any] = {}
        self._service_configs: Dict[str, Dict[str, Any]] = {}
        self._health_checks: Dict[str, datetime] = {}
        
        # Start background tasks
        asyncio.create_task(self._monitor_connections())
        asyncio.create_task(self._update_service_registry())

    async def initialize(self):
        """Initialize gRPC connections"""
        # Setup service configurations
        self._service_configs = {
            "assignment_service": {
                "address": f"{settings.GRPC_HOST}:{settings.GRPC_PORT}",
                "timeout": 30,
                "max_retries": 3
            },
            "user_service": {
                "address": f"{settings.GRPC_HOST}:{settings.GRPC_PORT + 1}",
                "timeout": 30,
                "max_retries": 3
            }
        }
        
        # Initialize connections
        for service_name, config in self._service_configs.items():
            await self._create_channel(service_name, config["address"])

    async def _create_channel(self, service_name: str, address: str):
        """Create a gRPC channel for a service"""
        try:
            channel = grpc.aio.insecure_channel(
                address,
                options=[
                    ('grpc.max_send_message_length', 1024 * 1024 * 10),  # 10MB
                    ('grpc.max_receive_message_length', 1024 * 1024 * 10),  # 10MB
                    ('grpc.keepalive_time_ms', 30000),
                    ('grpc.keepalive_timeout_ms', 10000)
                ]
            )
            self._channels[service_name] = channel
            
            # Create service stub (commented out as it depends on your .proto files)
            # if service_name == "assignment_service":
            #     self._stubs[service_name] = your_service_pb2_grpc.YourServiceStub(channel)
            
            logger.info(f"Created gRPC channel for service: {service_name}")
            
        except Exception as e:
            await error_manager.handle_error(
                e,
                context={
                    "service": service_name,
                    "address": address
                }
            )
            raise

    @monitor("grpc_call")
    async def call_service(
        self,
        service_name: str,
        method_name: str,
        request_data: Dict[str, Any],
        timeout: Optional[int] = None
    ) -> Dict[str, Any]:
        """Make a gRPC call to a service"""
        if service_name not in self._stubs:
            raise ValueError(f"Unknown service: {service_name}")
            
        stub = self._stubs[service_name]
        config = self._service_configs[service_name]
        timeout = timeout or config["timeout"]
        
        # Convert dictionary to protobuf message (example)
        # request = your_service_pb2.YourRequest()
        # json_format.Parse(json.dumps(request_data), request)
        
        for attempt in range(config["max_retries"]):
            try:
                # Make the gRPC call (example)
                # method = getattr(stub, method_name)
                # response = await method(request, timeout=timeout)
                # return json_format.MessageToDict(response)
                
                # Placeholder return
                return {"status": "success"}
                
            except grpc.RpcError as e:
                if attempt == config["max_retries"] - 1:
                    await error_manager.handle_error(
                        e,
                        context={
                            "service": service_name,
                            "method": method_name,
                            "attempt": attempt + 1
                        }
                    )
                    raise
                await asyncio.sleep(1 * (attempt + 1))  # Exponential backoff

    async def _monitor_connections(self):
        """Monitor gRPC connections health"""
        while True:
            for service_name, channel in self._channels.items():
                try:
                    # Check channel connectivity
                    state = channel.get_state()
                    if state in [grpc.ChannelConnectivity.TRANSIENT_FAILURE,
                               grpc.ChannelConnectivity.SHUTDOWN]:
                        logger.warning(f"Reconnecting to service: {service_name}")
                        await self._create_channel(
                            service_name,
                            self._service_configs[service_name]["address"]
                        )
                    
                    self._health_checks[service_name] = datetime.now()
                    
                except Exception as e:
                    await error_manager.handle_error(
                        e,
                        context={"service": service_name}
                    )
            
            await asyncio.sleep(30)  # Check every 30 seconds

    async def _update_service_registry(self):
        """Update service registry with latest configurations"""
        while True:
            try:
                # Implement service discovery/registry updates here
                await asyncio.sleep(60)
            except Exception as e:
                await error_manager.handle_error(e)

    async def close(self):
        """Close all gRPC channels"""
        for service_name, channel in self._channels.items():
            try:
                await channel.close()
            except Exception as e:
                logger.error(f"Error closing channel for {service_name}: {str(e)}")

# Global instance
grpc_manager = GRPCManager() 