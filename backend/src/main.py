from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.src.routes import auth
from backend.src.database import engine
from backend.src.models.user import Base
import os

# Create database tables only in production
if not os.getenv("TESTING"):
    Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AssignmentAI API",
    description="API for AssignmentAI - AI-powered assignment management system",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Update with specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["authentication"])

@app.get("/")
async def root():
    return {
        "message": "Welcome to AssignmentAI API",
        "version": "1.0.0",
        "status": "operational"
    } 