from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError
from pydantic import ValidationError
import logging
from app.services.logging_service import LoggingService

logger = logging.getLogger(__name__)
logging_service = LoggingService()

async def http_exception_handler(request: Request, exc: HTTPException):
    logger.error(f"HTTP Exception: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

async def validation_exception_handler(request: Request, exc: ValidationError):
    logger.error(f"Validation Error: {exc.errors()}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors()}
    )

async def database_error_handler(request: Request, exc: SQLAlchemyError):
    """Handle database errors"""
    extra = {"error": str(exc), "error_type": type(exc).__name__}
    if hasattr(request.state, "db"):
        extra["db"] = request.state.db
    
    logging_service.error(
        f"Database error occurred: {str(exc)}",
        extra=extra
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": f"Database error: {str(exc)}"}
    )

async def validation_error_handler(request: Request, exc: ValueError):
    """Handle validation errors"""
    extra = {"error": str(exc)}
    if hasattr(request.state, "db"):
        extra["db"] = request.state.db
    
    logging_service.warning(
        "Validation error occurred",
        extra=extra
    )
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": str(exc)}
    )

async def request_validation_error_handler(request: Request, exc: RequestValidationError):
    """Handle request validation errors"""
    extra = {"error": str(exc), "errors": exc.errors()}
    if hasattr(request.state, "db"):
        extra["db"] = request.state.db
    
    logging_service.warning(
        "Request validation error occurred",
        extra=extra
    )
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors()}
    )

async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions"""
    extra = {"error": str(exc)}
    if hasattr(request.state, "db"):
        extra["db"] = request.state.db
    
    logging_service.error(
        "Unexpected error occurred",
        extra=extra
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected error occurred"}
    ) 