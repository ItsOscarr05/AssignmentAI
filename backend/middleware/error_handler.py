from fastapi import Request, status
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
from typing import Union, Dict, Any
import logging

logger = logging.getLogger(__name__)

class APIError(Exception):
    def __init__(
        self,
        message: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        details: Union[Dict[str, Any], None] = None
    ):
        self.message = message
        self.status_code = status_code
        self.details = details
        super().__init__(message)

async def error_handler_middleware(request: Request, call_next):
    try:
        return await call_next(request)
    except APIError as e:
        logger.warning(f"API Error: {e.message}", exc_info=True)
        return JSONResponse(
            status_code=e.status_code,
            content={
                "error": e.message,
                "details": e.details,
                "path": request.url.path
            }
        )
    except SQLAlchemyError as e:
        logger.error("Database Error", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": "Database error occurred",
                "path": request.url.path
            }
        )
    except Exception as e:
        logger.error("Unhandled Error", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": "An unexpected error occurred",
                "path": request.url.path
            }
        )

class ErrorResponses:
    @staticmethod
    def validation_error(message: str, details: Dict[str, Any] = None) -> APIError:
        return APIError(message, status.HTTP_400_BAD_REQUEST, details)

    @staticmethod
    def unauthorized(message: str = "Unauthorized") -> APIError:
        return APIError(message, status.HTTP_401_UNAUTHORIZED)

    @staticmethod
    def forbidden(message: str = "Forbidden") -> APIError:
        return APIError(message, status.HTTP_403_FORBIDDEN)

    @staticmethod
    def not_found(message: str = "Resource not found") -> APIError:
        return APIError(message, status.HTTP_404_NOT_FOUND)

    @staticmethod
    def conflict(message: str, details: Dict[str, Any] = None) -> APIError:
        return APIError(message, status.HTTP_409_CONFLICT, details)

    @staticmethod
    def server_error(message: str = "Internal server error") -> APIError:
        return APIError(message, status.HTTP_500_INTERNAL_SERVER_ERROR) 