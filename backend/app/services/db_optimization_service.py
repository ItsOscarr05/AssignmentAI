from typing import Optional, Dict, Any, List
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
from sqlalchemy.exc import SQLAlchemyError
from app.core.config import settings
from app.services.logging_service import logger

class DatabaseOptimizationService:
    def __init__(self):
        self.engine = create_engine(
            settings.SQLALCHEMY_DATABASE_URI,
            poolclass=QueuePool,
            pool_size=20,
            max_overflow=10,
            pool_timeout=30,
            pool_recycle=1800,  # Recycle connections after 30 minutes
            pool_pre_ping=True,  # Enable connection health checks
            echo=settings.SQL_DEBUG
        )
        
        # Set up session factory with optimized settings
        self.SessionLocal = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=self.engine
        )
        
        # Set up event listeners for query optimization
        self._setup_event_listeners()
    
    def _setup_event_listeners(self):
        """Set up event listeners for query optimization and monitoring"""
        
        @event.listens_for(Session, 'after_cursor_execute')
        def after_cursor_execute(session, cursor, statement, parameters, context, executemany):
            """Log slow queries and optimize them"""
            total = context.get_connection().dialect.dbapi.total
            if total > 1.0:  # Log queries taking more than 1 second
                logger.warning(
                    "Slow query detected",
                    extra={
                        "statement": statement,
                        "parameters": parameters,
                        "execution_time": total
                    }
                )
        
        @event.listens_for(self.engine, 'connect')
        def set_sqlite_pragma(dbapi_connection, connection_record):
            """Set SQLite pragmas for better performance"""
            if settings.DB_TYPE == "sqlite":
                cursor = dbapi_connection.cursor()
                cursor.execute("PRAGMA journal_mode=WAL")
                cursor.execute("PRAGMA synchronous=NORMAL")
                cursor.execute("PRAGMA temp_store=MEMORY")
                cursor.execute("PRAGMA mmap_size=30000000000")
                cursor.execute("PRAGMA page_size=4096")
                cursor.close()
    
    def get_session(self) -> Session:
        """Get a database session with optimized settings"""
        return self.SessionLocal()
    
    def optimize_query(self, query: str, params: Optional[Dict[str, Any]] = None) -> str:
        """Optimize SQL query based on best practices"""
        # Add query optimization logic here
        # This is a placeholder for actual query optimization
        return query
    
    def analyze_query_performance(self, query: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Analyze query performance and suggest optimizations"""
        try:
            session = self.get_session()
            result = session.execute(query, params or {})
            execution_time = result.execution_options.get('execution_time', 0)
            
            return {
                "execution_time": execution_time,
                "row_count": result.rowcount,
                "suggestions": self._generate_optimization_suggestions(query, execution_time)
            }
        except SQLAlchemyError as e:
            logger.error("Error analyzing query performance", error=e)
            return {"error": str(e)}
        finally:
            session.close()
    
    def _generate_optimization_suggestions(self, query: str, execution_time: float) -> List[str]:
        """Generate optimization suggestions based on query analysis"""
        suggestions = []
        
        # Add index suggestions
        if "WHERE" in query.upper() and execution_time > 0.1:
            suggestions.append("Consider adding an index on the WHERE clause columns")
        
        # Add JOIN optimization suggestions
        if "JOIN" in query.upper() and execution_time > 0.5:
            suggestions.append("Consider optimizing JOIN order or using materialized views")
        
        # Add LIMIT suggestions
        if "LIMIT" not in query.upper() and execution_time > 0.3:
            suggestions.append("Consider adding LIMIT to prevent large result sets")
        
        return suggestions
    
    def get_connection_pool_status(self) -> Dict[str, Any]:
        """Get current connection pool status"""
        return {
            "pool_size": self.engine.pool.size(),
            "checkedin": self.engine.pool.checkedin(),
            "overflow": self.engine.pool.overflow(),
            "checkedout": self.engine.pool.checkedout(),
            "recycle": self.engine.pool._recycle
        }

# Create global instance
db_optimizer = DatabaseOptimizationService() 