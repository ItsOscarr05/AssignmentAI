import logging
from sqlalchemy import text
from app.database import SessionLocal

logger = logging.getLogger(__name__)

def check_postgres_health():
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        logger.info("Postgres health check successful")
        return {"status": "healthy", "message": "Database is responding"}
    except Exception as e:
        logger.error(f"Postgres health check failed: {e}")
        return {"status": "unhealthy", "message": str(e)} 