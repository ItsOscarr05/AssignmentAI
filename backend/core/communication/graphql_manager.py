from typing import Dict, List, Optional, Any
import strawberry
from strawberry.fastapi import GraphQLRouter
from datetime import datetime
from dataclasses import dataclass
import logging
from backend.core.database.connection_pool import pool
from backend.core.cache.multi_level_cache import cache_instance, cache
from backend.core.monitoring.telemetry import monitor
from backend.core.error_handling.error_manager import error_manager

logger = logging.getLogger(__name__)

@strawberry.type
class Assignment:
    id: int
    title: str
    description: str
    due_date: datetime
    status: str
    created_at: datetime
    updated_at: datetime

@strawberry.type
class User:
    id: int
    username: str
    email: str
    role: str
    created_at: datetime

@strawberry.input
class AssignmentInput:
    title: str
    description: str
    due_date: datetime

@strawberry.type
class Query:
    @strawberry.field
    @monitor("graphql_get_assignment")
    @cache(ttl=300)
    async def assignment(self, id: int) -> Optional[Assignment]:
        try:
            query = "SELECT * FROM assignments WHERE id = $1"
            result = await pool.execute_query(query, (id,), read_only=True)
            if not result:
                return None
            return Assignment(**result[0])
        except Exception as e:
            error_id = await error_manager.handle_error(e)
            logger.error(f"Failed to fetch assignment {id}: {str(e)}, error_id: {error_id}")
            raise

    @strawberry.field
    @monitor("graphql_list_assignments")
    @cache(ttl=300)
    async def assignments(
        self,
        limit: int = 10,
        offset: int = 0,
        status: Optional[str] = None
    ) -> List[Assignment]:
        try:
            query = "SELECT * FROM assignments"
            params = []
            
            if status:
                query += " WHERE status = $1"
                params.append(status)
                
            query += " ORDER BY created_at DESC LIMIT $2 OFFSET $3"
            params.extend([limit, offset])
            
            results = await pool.execute_query(query, tuple(params), read_only=True)
            return [Assignment(**row) for row in results]
        except Exception as e:
            error_id = await error_manager.handle_error(e)
            logger.error(f"Failed to list assignments: {str(e)}, error_id: {error_id}")
            raise

@strawberry.type
class Mutation:
    @strawberry.mutation
    @monitor("graphql_create_assignment")
    async def create_assignment(self, input: AssignmentInput) -> Assignment:
        try:
            query = """
                INSERT INTO assignments (title, description, due_date, status)
                VALUES ($1, $2, $3, 'pending')
                RETURNING *
            """
            result = await pool.execute_query(
                query,
                (input.title, input.description, input.due_date)
            )
            
            # Invalidate cache
            await cache_instance.delete("assignments_list")
            
            return Assignment(**result[0])
        except Exception as e:
            error_id = await error_manager.handle_error(e)
            logger.error(f"Failed to create assignment: {str(e)}, error_id: {error_id}")
            raise

    @strawberry.mutation
    @monitor("graphql_update_assignment")
    async def update_assignment(
        self,
        id: int,
        input: AssignmentInput
    ) -> Optional[Assignment]:
        try:
            query = """
                UPDATE assignments
                SET title = $1, description = $2, due_date = $3, updated_at = NOW()
                WHERE id = $4
                RETURNING *
            """
            result = await pool.execute_query(
                query,
                (input.title, input.description, input.due_date, id)
            )
            
            if not result:
                return None
                
            # Invalidate cache
            await cache_instance.delete(f"assignment:{id}")
            await cache_instance.delete("assignments_list")
            
            return Assignment(**result[0])
        except Exception as e:
            error_id = await error_manager.handle_error(e)
            logger.error(f"Failed to update assignment {id}: {str(e)}, error_id: {error_id}")
            raise

schema = strawberry.Schema(query=Query, mutation=Mutation)
graphql_router = GraphQLRouter(schema)

# Global instance
graphql_manager = graphql_router 