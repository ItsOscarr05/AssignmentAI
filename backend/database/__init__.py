"""
Database package for AssignmentAI.
This package provides database connectivity and ORM functionality.
"""

from .base import Base, engine, get_db, check_database_health, create_indexes
from .connection_pool import pool
from .models import User, Assignment, Document, Feedback
from .migrations import run_migrations

__all__ = [
    'Base',
    'engine',
    'get_db',
    'pool',
    'User',
    'Assignment',
    'Document',
    'Feedback',
    'run_migrations',
    'check_database_health',
    'create_indexes'
] 