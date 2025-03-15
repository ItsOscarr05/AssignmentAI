"""
Document routes for AssignmentAI.
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from typing import List, Optional
from database.models import Document
from database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from security import get_current_user
from schemas import DocumentCreate, DocumentUpdate, DocumentResponse

router = APIRouter()

@router.post("/documents/", response_model=DocumentResponse)
async def create_document(
    document: DocumentCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new document."""
    db_document = Document(
        assignment_id=document.assignment_id,
        filename=document.filename,
        file_type=document.file_type,
        content=document.content,
        file_metadata=document.file_metadata
    )
    db.add(db_document)
    await db.commit()
    await db.refresh(db_document)
    return db_document

@router.get("/documents/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get a document by ID."""
    document = await db.get(Document, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document

@router.put("/documents/{document_id}", response_model=DocumentResponse)
async def update_document(
    document_id: int,
    document_update: DocumentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update a document."""
    document = await db.get(Document, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    for field, value in document_update.dict(exclude_unset=True).items():
        setattr(document, field, value)
    
    await db.commit()
    await db.refresh(document)
    return document

@router.delete("/documents/{document_id}")
async def delete_document(
    document_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete a document."""
    document = await db.get(Document, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    await db.delete(document)
    await db.commit()
    return {"message": "Document deleted"} 