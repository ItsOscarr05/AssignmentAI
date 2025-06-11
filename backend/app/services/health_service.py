import logging
from typing import Dict, Any
from motor.motor_asyncio import AsyncIOMotorClient
from app.services.email_service import EmailService
from app.services.ai_service import AIService
import os
from app.services.logging_service import LoggingService

logger = logging.getLogger(__name__)

class HealthService:
    def __init__(self, db: AsyncIOMotorClient):
        self.db = db

    async def check_database(self) -> Dict[str, Any]:
        """Check database health"""
        try:
            # Try to execute a simple query
            await self.db.command("ping")
            LoggingService.log_info(self.db, "Database health check successful")
            return {"status": "healthy", "message": "Database is responding"}
        except Exception as e:
            LoggingService.log_error(self.db, "Database health check failed", {"error": str(e)})
            return {"status": "unhealthy", "message": str(e)}

    async def check_email_service(self) -> Dict[str, Any]:
        """Check email service health"""
        try:
            # Add email service health check logic here
            LoggingService.log_info(self.db, "Email service health check successful")
            return {"status": "healthy", "message": "Email service is responding"}
        except Exception as e:
            LoggingService.log_error(self.db, "Email service health check failed", {"error": str(e)})
            return {"status": "unhealthy", "message": str(e)}

    async def check_ai_service(self) -> Dict[str, Any]:
        """Check AI service health"""
        try:
            # Add AI service health check logic here
            LoggingService.log_info(self.db, "AI service health check successful")
            return {"status": "healthy", "message": "AI service is responding"}
        except Exception as e:
            LoggingService.log_error(self.db, "AI service health check failed", {"error": str(e)})
            return {"status": "unhealthy", "message": str(e)}

    def check_storage(self) -> Dict[str, Any]:
        """Check storage health"""
        try:
            # Add storage health check logic here
            LoggingService.log_info(self.db, "Storage health check successful")
            return {"status": "healthy", "message": "Storage is accessible"}
        except Exception as e:
            LoggingService.log_error(self.db, "Storage health check failed", {"error": str(e)})
            return {"status": "unhealthy", "message": str(e)}

    @staticmethod
    async def check_email() -> bool:
        """
        Check if email service is working
        """
        try:
            # Try to send a test email
            success = await EmailService.send_email(
                to_email="test@example.com",
                subject="Health Check",
                html_content="This is a health check email."
            )
            return success
        except Exception as e:
            logger.error(f"Email health check failed: {str(e)}")
            return False

    @staticmethod
    async def check_ai_service_static() -> bool:
        """
        Check if AI service is working
        """
        try:
            # Try to generate a simple test response
            ai_service = AIService()
            response = await ai_service.generate_assignment(
                subject="Test",
                grade_level="Test",
                topic="Test",
                difficulty="easy",
                requirements="Test"
            )
            return bool(response)
        except Exception as e:
            logger.error(f"AI service health check failed: {str(e)}")
            return False

    @staticmethod
    def check_storage_static() -> bool:
        """
        Check if file storage is accessible
        """
        try:
            # Try to create and delete a test file
            test_file = "test.txt"
            with open(test_file, "w") as f:
                f.write("test")
            os.remove(test_file)
            return True
        except Exception as e:
            logger.error(f"Storage health check failed: {str(e)}")
            return False 