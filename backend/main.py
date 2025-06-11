from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.api.v1.api import api_router
from app.core.config import settings
from app.core.cache import init_cache
from app.core.rate_limit import rate_limit_middleware
import os
from app.db.session import init_db

# Load environment variables
load_dotenv()

app = FastAPI(
    title="AssignmentAI API",
    description="API for the AssignmentAI platform",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=settings.CORS_CREDENTIALS,
    allow_methods=settings.CORS_METHODS,
    allow_headers=settings.CORS_HEADERS,
    expose_headers=settings.CORS_EXPOSE_HEADERS,
    max_age=settings.CORS_MAX_AGE,
)

# Add rate limiting middleware
app.middleware("http")(rate_limit_middleware)

# Include all API routes
app.include_router(api_router, prefix="/api/v1")

@app.on_event("startup")
async def startup_event():
    await init_db()
    await init_cache()

@app.get("/")
async def root():
    return {"message": "Welcome to AssignmentAI API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 