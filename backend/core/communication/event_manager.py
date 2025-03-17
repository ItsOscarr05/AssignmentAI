from typing import Dict, List, Any, Optional, Callable, Awaitable
import json
from datetime import datetime
import asyncio
from dataclasses import dataclass
import logging
from backend.core.database.connection_pool import pool
from backend.core.cache.multi_level_cache import cache_instance
from backend.core.monitoring.telemetry import monitor
from backend.core.error_handling.error_manager import error_manager

logger = logging.getLogger(__name__)

@dataclass
class Event:
    id: str
    type: str
    aggregate_id: str
    data: Dict[str, Any]
    metadata: Dict[str, Any]
    timestamp: datetime
    version: int

class EventStore:
    def __init__(self):
        self._events: Dict[str, List[Event]] = {}
        self._snapshots: Dict[str, Dict[str, Any]] = {}
        self._handlers: Dict[str, List[Callable[[Event], Awaitable[None]]]] = {}
        self._projections: Dict[str, Dict[str, Any]] = {}
        self._snapshot_frequency = 100
        
        # Start background tasks
        asyncio.create_task(self._persist_events())
        asyncio.create_task(self._cleanup_old_events())

    @monitor("event_store_append")
    async def append(self, event: Event):
        """Append new event to the store"""
        # Store event
        if event.aggregate_id not in self._events:
            self._events[event.aggregate_id] = []
        self._events[event.aggregate_id].append(event)
        
        # Persist event to database
        await self._persist_event(event)
        
        # Update projections
        await self._update_projections(event)
        
        # Create snapshot if needed
        if len(self._events[event.aggregate_id]) % self._snapshot_frequency == 0:
            await self._create_snapshot(event.aggregate_id)
        
        # Notify handlers
        await self._notify_handlers(event)

    async def get_events(
        self,
        aggregate_id: str,
        start_version: Optional[int] = None
    ) -> List[Event]:
        """Get events for an aggregate"""
        events = self._events.get(aggregate_id, [])
        if start_version is not None:
            events = [e for e in events if e.version >= start_version]
        return events

    async def get_snapshot(self, aggregate_id: str) -> Optional[Dict[str, Any]]:
        """Get latest snapshot for an aggregate"""
        return self._snapshots.get(aggregate_id)

    def register_handler(
        self,
        event_type: str,
        handler: Callable[[Event], Awaitable[None]]
    ):
        """Register event handler"""
        if event_type not in self._handlers:
            self._handlers[event_type] = []
        self._handlers[event_type].append(handler)

    async def _persist_event(self, event: Event):
        """Persist event to database"""
        query = """
            INSERT INTO events (
                id, type, aggregate_id, data, metadata,
                timestamp, version
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        """
        try:
            await pool.execute_query(
                query,
                (
                    event.id,
                    event.type,
                    event.aggregate_id,
                    json.dumps(event.data),
                    json.dumps(event.metadata),
                    event.timestamp,
                    event.version
                )
            )
        except Exception as e:
            await error_manager.handle_error(
                e,
                context={"event_id": event.id}
            )
            raise

    async def _create_snapshot(self, aggregate_id: str):
        """Create snapshot of aggregate state"""
        events = self._events[aggregate_id]
        state = await self._rebuild_state(events)
        
        self._snapshots[aggregate_id] = {
            "state": state,
            "version": events[-1].version,
            "timestamp": datetime.now()
        }
        
        # Persist snapshot
        query = """
            INSERT INTO snapshots (
                aggregate_id, state, version, timestamp
            ) VALUES ($1, $2, $3, $4)
            ON CONFLICT (aggregate_id) DO UPDATE
            SET state = $2, version = $3, timestamp = $4
        """
        await pool.execute_query(
            query,
            (
                aggregate_id,
                json.dumps(state),
                events[-1].version,
                datetime.now()
            )
        )

    async def _rebuild_state(self, events: List[Event]) -> Dict[str, Any]:
        """Rebuild aggregate state from events"""
        state = {}
        for event in events:
            state = await self._apply_event(state, event)
        return state

    async def _apply_event(
        self,
        state: Dict[str, Any],
        event: Event
    ) -> Dict[str, Any]:
        """Apply event to state"""
        # Implement event application logic based on event type
        if event.type == "assignment_created":
            state.update(event.data)
        elif event.type == "assignment_updated":
            state.update(event.data)
        elif event.type == "assignment_deleted":
            state = {}
        return state

    async def _notify_handlers(self, event: Event):
        """Notify all registered handlers for an event"""
        handlers = self._handlers.get(event.type, [])
        for handler in handlers:
            try:
                await handler(event)
            except Exception as e:
                await error_manager.handle_error(
                    e,
                    context={
                        "event_id": event.id,
                        "handler": handler.__name__
                    }
                )

    async def _update_projections(self, event: Event):
        """Update projections based on event"""
        if event.type.startswith("assignment_"):
            await self._update_assignment_projections(event)
        elif event.type.startswith("user_"):
            await self._update_user_projections(event)

    async def _update_assignment_projections(self, event: Event):
        """Update assignment-related projections"""
        projection_key = f"assignments:{event.aggregate_id}"
        
        if event.type == "assignment_created":
            self._projections[projection_key] = event.data
        elif event.type == "assignment_updated":
            if projection_key in self._projections:
                self._projections[projection_key].update(event.data)
        elif event.type == "assignment_deleted":
            self._projections.pop(projection_key, None)
            
        # Update cache
        await cache_instance.set(
            projection_key,
            self._projections.get(projection_key),
            ttl=3600
        )

    async def _update_user_projections(self, event: Event):
        """Update user-related projections"""
        projection_key = f"users:{event.aggregate_id}"
        
        if event.type == "user_created":
            self._projections[projection_key] = event.data
        elif event.type == "user_updated":
            if projection_key in self._projections:
                self._projections[projection_key].update(event.data)
        elif event.type == "user_deleted":
            self._projections.pop(projection_key, None)
            
        # Update cache
        await cache_instance.set(
            projection_key,
            self._projections.get(projection_key),
            ttl=3600
        )

    async def _persist_events(self):
        """Periodically ensure all events are persisted"""
        while True:
            try:
                # Implement additional persistence logic if needed
                await asyncio.sleep(60)
            except Exception as e:
                await error_manager.handle_error(e)

    async def _cleanup_old_events(self):
        """Periodically clean up old events"""
        while True:
            try:
                # Keep only recent events in memory, older ones can be
                # retrieved from database if needed
                for aggregate_id in self._events:
                    events = self._events[aggregate_id]
                    if len(events) > self._snapshot_frequency * 2:
                        self._events[aggregate_id] = events[-self._snapshot_frequency:]
                
                await asyncio.sleep(3600)  # Run every hour
                
            except Exception as e:
                await error_manager.handle_error(e)

    async def replay_events(
        self,
        aggregate_id: str,
        target_version: Optional[int] = None
    ) -> Dict[str, Any]:
        """Replay events to rebuild state"""
        events = await self.get_events(aggregate_id)
        if target_version is not None:
            events = [e for e in events if e.version <= target_version]
            
        return await self._rebuild_state(events)

# Global instance
event_store = EventStore() 