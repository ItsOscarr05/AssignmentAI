from fastapi import Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ValidationError
from typing import Type, TypeVar, Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

T = TypeVar('T', bound=BaseModel)

class ValidationMiddleware:
    @staticmethod
    async def validate_request_body(
        request: Request,
        model: Type[T]
    ) -> Optional[T]:
        try:
            body = await request.json()
            return model.parse_obj(body)
        except ValidationError as e:
            logger.warning(f"Validation error: {str(e)}")
            return JSONResponse(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                content={
                    "error": "Validation error",
                    "details": e.errors()
                }
            )
        except Exception as e:
            logger.error(f"Request parsing error: {str(e)}")
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={
                    "error": "Invalid request body"
                }
            )

    @staticmethod
    def validate_query_params(
        params: Dict[str, Any],
        model: Type[T]
    ) -> Optional[T]:
        try:
            return model.parse_obj(params)
        except ValidationError as e:
            logger.warning(f"Query parameter validation error: {str(e)}")
            return JSONResponse(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                content={
                    "error": "Invalid query parameters",
                    "details": e.errors()
                }
            )

async def validation_middleware(request: Request, call_next):
    try:
        response = await call_next(request)
        return response
    except ValidationError as e:
        logger.warning(f"Validation error in middleware: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error": "Validation error",
                "details": e.errors()
            }
        ) 