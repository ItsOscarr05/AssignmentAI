from typing import Dict, List, Optional
from pathlib import Path
import yaml
from dataclasses import dataclass
from datetime import datetime, timedelta
import json
import sqlite3
from contextlib import contextmanager

@dataclass
class MigrationRecord:
    name: str
    version: str
    applied_at: str
    status: str
    duration: float
    environment: str
    user: str
    rollback: bool = False
    error: Optional[str] = None
    metadata: Optional[Dict] = None

class MigrationHistory:
    def __init__(self, history_dir: Path):
        self.history_dir = history_dir
        self.history_dir.mkdir(parents=True, exist_ok=True)
        self.db_path = self.history_dir / "migration_history.db"
        self._init_db()

    def _init_db(self):
        """Initialize SQLite database for migration history"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS migrations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    version TEXT NOT NULL,
                    applied_at TEXT NOT NULL,
                    status TEXT NOT NULL,
                    duration REAL NOT NULL,
                    environment TEXT NOT NULL,
                    user TEXT NOT NULL,
                    rollback BOOLEAN DEFAULT 0,
                    error TEXT,
                    metadata TEXT,
                    UNIQUE(name, version, applied_at)
                )
            """)
            
            conn.execute("""
                CREATE TABLE IF NOT EXISTS statistics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    date TEXT NOT NULL,
                    total_migrations INTEGER NOT NULL,
                    successful_migrations INTEGER NOT NULL,
                    failed_migrations INTEGER NOT NULL,
                    average_duration REAL NOT NULL,
                    environment TEXT NOT NULL,
                    UNIQUE(date, environment)
                )
            """)

    @contextmanager
    def get_connection(self):
        """Get a database connection"""
        conn = sqlite3.connect(self.db_path)
        try:
            yield conn
        finally:
            conn.close()

    def record_migration(self, record: MigrationRecord):
        """Record a migration in the history"""
        with self.get_connection() as conn:
            conn.execute("""
                INSERT INTO migrations (
                    name, version, applied_at, status, duration,
                    environment, user, rollback, error, metadata
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                record.name,
                record.version,
                record.applied_at,
                record.status,
                record.duration,
                record.environment,
                record.user,
                record.rollback,
                record.error,
                json.dumps(record.metadata) if record.metadata else None
            ))
            
            # Update statistics
            self._update_statistics(conn, record)

    def _update_statistics(self, conn: sqlite3.Connection, record: MigrationRecord):
        """Update migration statistics"""
        date = datetime.fromisoformat(record.applied_at).date().isoformat()
        
        # Get current statistics
        cursor = conn.execute("""
            SELECT total_migrations, successful_migrations, failed_migrations,
                   average_duration
            FROM statistics
            WHERE date = ? AND environment = ?
        """, (date, record.environment))
        
        row = cursor.fetchone()
        if row:
            total, successful, failed, avg_duration = row
            total += 1
            if record.status == "success":
                successful += 1
            else:
                failed += 1
            avg_duration = (avg_duration * (total - 1) + record.duration) / total
            
            conn.execute("""
                UPDATE statistics
                SET total_migrations = ?,
                    successful_migrations = ?,
                    failed_migrations = ?,
                    average_duration = ?
                WHERE date = ? AND environment = ?
            """, (total, successful, failed, avg_duration, date, record.environment))
        else:
            conn.execute("""
                INSERT INTO statistics (
                    date, total_migrations, successful_migrations,
                    failed_migrations, average_duration, environment
                ) VALUES (?, 1, ?, ?, ?, ?)
            """, (
                date,
                1 if record.status == "success" else 0,
                0 if record.status == "success" else 1,
                record.duration,
                record.environment
            ))

    def get_migration_history(
        self,
        name: Optional[str] = None,
        environment: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict]:
        """Get migration history with filters"""
        query = "SELECT * FROM migrations WHERE 1=1"
        params = []
        
        if name:
            query += " AND name = ?"
            params.append(name)
        if environment:
            query += " AND environment = ?"
            params.append(environment)
        if start_date:
            query += " AND applied_at >= ?"
            params.append(start_date)
        if end_date:
            query += " AND applied_at <= ?"
            params.append(end_date)
        
        query += " ORDER BY applied_at DESC LIMIT ?"
        params.append(limit)
        
        with self.get_connection() as conn:
            cursor = conn.execute(query, params)
            columns = [col[0] for col in cursor.description]
            return [
                {
                    col: row[i]
                    for i, col in enumerate(columns)
                }
                for row in cursor.fetchall()
            ]

    def get_statistics(
        self,
        environment: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> List[Dict]:
        """Get migration statistics"""
        query = "SELECT * FROM statistics WHERE 1=1"
        params = []
        
        if environment:
            query += " AND environment = ?"
            params.append(environment)
        if start_date:
            query += " AND date >= ?"
            params.append(start_date)
        if end_date:
            query += " AND date <= ?"
            params.append(end_date)
        
        query += " ORDER BY date DESC"
        
        with self.get_connection() as conn:
            cursor = conn.execute(query, params)
            columns = [col[0] for col in cursor.description]
            return [
                {
                    col: row[i]
                    for i, col in enumerate(columns)
                }
                for row in cursor.fetchall()
            ]

    def get_migration_timeline(self) -> List[Dict]:
        """Get a timeline of all migrations"""
        with self.get_connection() as conn:
            cursor = conn.execute("""
                SELECT 
                    name,
                    version,
                    applied_at,
                    status,
                    duration,
                    environment,
                    user,
                    rollback,
                    error
                FROM migrations
                ORDER BY applied_at DESC
            """)
            
            columns = [col[0] for col in cursor.description]
            return [
                {
                    col: row[i]
                    for i, col in enumerate(columns)
                }
                for row in cursor.fetchall()
            ]

    def get_rollback_history(self, name: str) -> List[Dict]:
        """Get rollback history for a migration"""
        with self.get_connection() as conn:
            cursor = conn.execute("""
                SELECT 
                    applied_at,
                    status,
                    duration,
                    environment,
                    user,
                    error
                FROM migrations
                WHERE name = ? AND rollback = 1
                ORDER BY applied_at DESC
            """, (name,))
            
            columns = [col[0] for col in cursor.description]
            return [
                {
                    col: row[i]
                    for i, col in enumerate(columns)
                }
                for row in cursor.fetchall()
            ]

    def get_performance_metrics(
        self,
        environment: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> Dict:
        """Get performance metrics for migrations"""
        query = "SELECT * FROM migrations WHERE 1=1"
        params = []
        
        if environment:
            query += " AND environment = ?"
            params.append(environment)
        if start_date:
            query += " AND applied_at >= ?"
            params.append(start_date)
        if end_date:
            query += " AND applied_at <= ?"
            params.append(end_date)
        
        with self.get_connection() as conn:
            cursor = conn.execute(query, params)
            rows = cursor.fetchall()
            
            if not rows:
                return {
                    "total_migrations": 0,
                    "successful_migrations": 0,
                    "failed_migrations": 0,
                    "average_duration": 0,
                    "min_duration": 0,
                    "max_duration": 0,
                    "total_duration": 0
                }
            
            durations = [row[5] for row in rows]  # duration column
            statuses = [row[3] for row in rows]   # status column
            
            return {
                "total_migrations": len(rows),
                "successful_migrations": statuses.count("success"),
                "failed_migrations": statuses.count("failed"),
                "average_duration": sum(durations) / len(durations),
                "min_duration": min(durations),
                "max_duration": max(durations),
                "total_duration": sum(durations)
            }

    def export_history(self, format: str = "json") -> str:
        """Export migration history in specified format"""
        with self.get_connection() as conn:
            cursor = conn.execute("SELECT * FROM migrations ORDER BY applied_at DESC")
            columns = [col[0] for col in cursor.description]
            data = [
                {
                    col: row[i]
                    for i, col in enumerate(columns)
                }
                for row in cursor.fetchall()
            ]
        
        if format == "json":
            return json.dumps(data, indent=2)
        elif format == "yaml":
            return yaml.dump(data, default_flow_style=False)
        else:
            raise ValueError(f"Unsupported format: {format}")

    def cleanup_history(self, days: int = 30):
        """Clean up old migration history"""
        cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()
        
        with self.get_connection() as conn:
            # Archive old records
            conn.execute("""
                INSERT INTO migrations_archive
                SELECT * FROM migrations
                WHERE applied_at < ?
            """, (cutoff_date,))
            
            # Delete old records
            conn.execute("""
                DELETE FROM migrations
                WHERE applied_at < ?
            """, (cutoff_date,))
            
            # Clean up old statistics
            conn.execute("""
                DELETE FROM statistics
                WHERE date < ?
            """, (cutoff_date,)) 