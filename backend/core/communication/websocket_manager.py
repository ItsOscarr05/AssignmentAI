from typing import Dict, Set, Any
from fastapi import WebSocket, WebSocketDisconnect
import json
from datetime import datetime
import asyncio
from backend.core.monitoring.telemetry import monitor
from backend.core.security.security_manager import security_manager

class WebSocketManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self.user_channels: Dict[str, Set[str]] = {}
        self.channel_messages: Dict[str, list] = {}
        self._setup_background_tasks()

    def _setup_background_tasks(self):
        """Setup background tasks for WebSocket management"""
        asyncio.create_task(self._cleanup_inactive_connections())
        asyncio.create_task(self._persist_messages())

    async def connect(self, websocket: WebSocket, channel: str, user_id: str):
        """Connect a client to a channel"""
        await websocket.accept()
        
        if channel not in self.active_connections:
            self.active_connections[channel] = set()
        self.active_connections[channel].add(websocket)
        
        if user_id not in self.user_channels:
            self.user_channels[user_id] = set()
        self.user_channels[user_id].add(channel)
        
        # Send last 50 messages from channel history
        if channel in self.channel_messages:
            for message in self.channel_messages[channel][-50:]:
                await websocket.send_json(message)

    async def disconnect(self, websocket: WebSocket, channel: str, user_id: str):
        """Disconnect a client from a channel"""
        self.active_connections[channel].remove(websocket)
        if not self.active_connections[channel]:
            del self.active_connections[channel]
            
        self.user_channels[user_id].remove(channel)
        if not self.user_channels[user_id]:
            del self.user_channels[user_id]

    @monitor("websocket_broadcast")
    async def broadcast(self, channel: str, message: Dict[str, Any]):
        """Broadcast message to all clients in a channel"""
        if channel not in self.active_connections:
            return
            
        message_data = {
            "channel": channel,
            "content": message,
            "timestamp": datetime.now().isoformat()
        }
        
        # Store message in channel history
        if channel not in self.channel_messages:
            self.channel_messages[channel] = []
        self.channel_messages[channel].append(message_data)
        
        # Trim channel history to last 1000 messages
        if len(self.channel_messages[channel]) > 1000:
            self.channel_messages[channel] = self.channel_messages[channel][-1000:]
        
        # Broadcast to all connected clients
        for connection in self.active_connections[channel].copy():
            try:
                await connection.send_json(message_data)
            except WebSocketDisconnect:
                await self.disconnect(connection, channel, "unknown")

    async def _cleanup_inactive_connections(self):
        """Periodically cleanup inactive connections"""
        while True:
            for channel in list(self.active_connections.keys()):
                for connection in self.active_connections[channel].copy():
                    try:
                        await connection.send_json({"type": "ping"})
                    except Exception:
                        await self.disconnect(connection, channel, "unknown")
            await asyncio.sleep(60)

    async def _persist_messages(self):
        """Periodically persist message history"""
        while True:
            # Implement message persistence logic here
            await asyncio.sleep(300)

    @monitor("websocket_handle_message")
    async def handle_message(
        self,
        websocket: WebSocket,
        channel: str,
        user_id: str,
        message: Dict[str, Any]
    ):
        """Handle incoming WebSocket message"""
        # Validate user permissions for the channel
        if not await self._can_access_channel(user_id, channel):
            await websocket.close(code=4403)
            return
            
        message_type = message.get("type", "message")
        
        if message_type == "message":
            # Regular message
            await self.broadcast(channel, {
                "type": "message",
                "user_id": user_id,
                "content": message.get("content"),
                "timestamp": datetime.now().isoformat()
            })
        elif message_type == "typing":
            # Typing indicator
            await self.broadcast(channel, {
                "type": "typing",
                "user_id": user_id,
                "timestamp": datetime.now().isoformat()
            })

    async def _can_access_channel(self, user_id: str, channel: str) -> bool:
        """Check if user has access to channel"""
        # Implement channel access control logic here
        return True  # Placeholder implementation

    async def get_user_channels(self, user_id: str) -> Set[str]:
        """Get all channels a user is connected to"""
        return self.user_channels.get(user_id, set())

    async def get_channel_users(self, channel: str) -> Set[str]:
        """Get all users connected to a channel"""
        return {
            user_id
            for user_id, channels in self.user_channels.items()
            if channel in channels
        }

# Global instance
websocket_manager = WebSocketManager() 