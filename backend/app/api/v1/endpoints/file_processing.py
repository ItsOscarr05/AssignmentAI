from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Body
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
from pathlib import Path
import json
import uuid
import os
from datetime import datetime
from asyncio import Lock

from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.models.file_upload import FileUpload
from app.services.file_processing_service import FileProcessingService
from app.services.file_service import file_service
from app.core.logger import logger

router = APIRouter()

_recent_response_cache: Dict[str, Dict[str, Any]] = {}
_recent_cache_lock: Lock = Lock()


async def _update_memory_cache(
    key: str,
    response: Dict[str, Any],
    source_mtime: float,
    filled_mtime: Optional[float],
) -> None:
    async with _recent_cache_lock:
        _recent_response_cache[key] = {
            "response": response,
            "source_mtime": source_mtime,
            "filled_mtime": filled_mtime,
        }


async def _remove_memory_cache(key: str) -> None:
    async with _recent_cache_lock:
        _recent_response_cache.pop(key, None)

@router.post("/analyze")
async def analyze_file_for_filling(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Analyze an uploaded file to identify sections that can be filled in.
    This is the first step before actually filling the file.
    """
    try:
        logger.info(f"File analysis request from user {current_user.id} for file {file.filename}")
        
        # Save the uploaded file
        file_path, file_id = await file_service.save_file(file, current_user.id)
        
        # Initialize file processing service
        processing_service = FileProcessingService(db)
        
        # Analyze the file
        analysis_result = await processing_service.process_file(
            file_path=file_path,
            user_id=current_user.id,
            action="analyze"
        )
        
        return {
            "file_id": file_id,
            "file_path": file_path,
            "file_name": file.filename,
            "file_type": analysis_result.get('file_type'),
            "analysis": analysis_result.get('analysis'),
            "fillable_sections": analysis_result.get('fillable_sections', []),
            "processed_at": analysis_result.get('processed_at'),
            "status": "analyzed"
        }
        
    except Exception as e:
        logger.error(f"Error analyzing file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze file: {str(e)}")

@router.post("/fill")
async def fill_file_content(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fill in the identified sections of an uploaded file with AI-generated content.
    This actually modifies the file content.
    """
    try:
        logger.info(f"File filling request from user {current_user.id} for file {file.filename}")
        
        # Save the uploaded file
        file_path, file_id = await file_service.save_file(file, current_user.id)
        
        # Initialize file processing service
        processing_service = FileProcessingService(db)
        
        # Fill the file content
        fill_result = await processing_service.process_file(
            file_path=file_path,
            user_id=current_user.id,
            action="fill"
        )
        
        # Generate the filled file - prevent multiple "filled_" prefixes
        original_filename = file.filename
        if original_filename.startswith('filled_'):
            # Remove existing "filled_" prefix to prevent duplication
            original_filename = original_filename[7:]  # Remove "filled_" (7 characters)
        
        # Create a clean filename for download
        # Since the original filename is already corrupted with timestamps/UUIDs,
        # let's generate a more user-friendly name based on file type
        extension = original_filename.split('.')[-1] if '.' in original_filename else 'docx'
        
        # Generate a clean name based on file type and current timestamp
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y%m%d_%H%M")
        
        if extension.lower() in ['xlsx', 'xls']:
            clean_download_name = f"spreadsheet_filled_{timestamp}.{extension}"
        elif extension.lower() in ['docx', 'doc']:
            clean_download_name = f"document_filled_{timestamp}.{extension}"
        elif extension.lower() == 'pdf':
            clean_download_name = f"document_filled_{timestamp}.{extension}"
        else:
            clean_download_name = f"file_filled_{timestamp}.{extension}"
        
        # Keep the filesystem filename for internal use with file_id for easier lookup
        output_filename = f"filled_{file_id}_{original_filename}"
        output_path = os.path.join(
            os.path.dirname(file_path),
            output_filename
        )
        
        filled_file_path = await processing_service.generate_filled_file(
            original_path=file_path,
            filled_content=fill_result.get('filled_content', {}),
            output_path=output_path
        )
        
        # Store the original filename and clean download name for future downloads
        # We'll store this in a simple text file for now, but ideally this should be in the database
        metadata_file = Path(file_path).parent / f"{file_id}_metadata.txt"
        with open(metadata_file, 'w') as f:
            f.write(f"original_filename:{file.filename}\n")
            f.write(f"clean_download_name:{clean_download_name}\n")

        return {
            "file_id": file_id,
            "original_file_path": file_path,
            "filled_file_path": filled_file_path,
            "file_name": file.filename,
            "filled_file_name": clean_download_name,
            "file_type": fill_result.get('file_type'),
            "sections_filled": fill_result.get('sections_filled', 0),
            "original_content": fill_result.get('original_content'),
            "filled_content": fill_result.get('filled_content'),
            "processed_at": fill_result.get('processed_at'),
            "status": "filled",
            "download_url": f"/api/v1/file-processing/download/{file_id}"
        }
        
    except Exception as e:
        logger.error(f"Error filling file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fill file: {str(e)}")

@router.post("/process-existing")
async def process_existing_file(
    file_id: str = Body(..., embed=True),
    action: str = Body(..., embed=True),  # "analyze" or "fill"
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Process an already uploaded file (by file_id) for analysis or filling.
    """
    try:
        logger.info(f"Processing existing file {file_id} with action {action} for user {current_user.id}")
        
        user_dir = Path(f"uploads/{current_user.id}")
        
        # Find the file with the given ID (look for files that might match)
        # This is a temporary solution - in production you'd have a proper file metadata table
        if not user_dir.exists():
            raise HTTPException(status_code=404, detail="File not found")

        metadata: Dict[str, str] = {}
        metadata_file = user_dir / f"{file_id}_metadata.txt"
        if metadata_file.exists():
            try:
                with open(metadata_file, 'r', encoding='utf-8') as meta_file:
                    for line in meta_file:
                        if ':' in line:
                            key, value = line.split(':', 1)
                            metadata[key.strip()] = value.strip()
            except Exception as meta_error:
                logger.warning(f"Failed to read metadata for {file_id}: {meta_error}")
        
        original_filename = metadata.get('original_filename')
        file_path: Optional[Path] = None
        if original_filename:
            candidate = user_dir / original_filename
            if candidate.exists():
                file_path = candidate
                logger.info(f"Resolved file path from metadata: {candidate.name}")
        
        # Determine cache path early to leverage cached responses without scanning directory
        cache_path = user_dir / f"{file_id}_{action}_cache.json"
        cache_data = None
        if cache_path.exists():
            try:
                with open(cache_path, 'r', encoding='utf-8') as cache_file:
                    cache_data = json.load(cache_file)
            except Exception as cache_error:
                logger.warning(f"Failed to load cache for {file_id}: {cache_error}")
        
        if cache_data and not file_path:
            cached_original = cache_data.get("original_file_path")
            if cached_original:
                candidate = Path(cached_original)
                if candidate.exists():
                    file_path = candidate
        
        # If still unresolved, search for matching file (limited glob)
        if not file_path:
            logger.info(f"Searching for file with ID {file_id}")
            for candidate in user_dir.glob(f"*{file_id}*"):
                if candidate.is_file():
                    file_path = candidate
                    logger.info(f"Found match via search: {candidate.name}")
                    break
        
        if not file_path or not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found")
        
        logger.info(f"Processing file: {file_path.name}")
        
        cache_key = f"{current_user.id}:{file_id}:{action}"
        source_mtime = file_path.stat().st_mtime

        async with _recent_cache_lock:
            memory_entry = _recent_response_cache.get(cache_key)

        if memory_entry:
            entry_response = memory_entry.get("response")
            entry_source_mtime = memory_entry.get("source_mtime", 0.0)
            entry_filled_mtime = memory_entry.get("filled_mtime")
            if entry_response and entry_source_mtime >= source_mtime:
                if action == "fill":
                    filled_path_str = entry_response.get("filled_file_path")
                    if filled_path_str:
                        filled_path = Path(filled_path_str)
                        if filled_path.exists():
                            filled_mtime = filled_path.stat().st_mtime
                            if entry_filled_mtime is None or entry_filled_mtime >= filled_mtime:
                                logger.info(f"Returning filled result for {file_id} from memory cache")
                                return entry_response
                else:
                    logger.info(f"Returning {action} result for {file_id} from memory cache")
                    return entry_response
            await _remove_memory_cache(cache_key)
        
        # Initialize file processing service
        processing_service = FileProcessingService(db)
        
        filled_file_match: Optional[Path] = None
        if cache_data:
            try:
                cache_mtime = cache_path.stat().st_mtime
                source_mtime = file_path.stat().st_mtime
                if cache_mtime >= source_mtime:
                    if action == "fill":
                        filled_path_str = cache_data.get("filled_file_path")
                        if filled_path_str:
                            cached_filled = Path(filled_path_str)
                            if cached_filled.exists():
                                logger.info(f"Using cached filled result for file {file_id}")
                                await _update_memory_cache(
                                    cache_key,
                                    cache_data,
                                    source_mtime,
                                    cached_filled.stat().st_mtime,
                                )
                                return cache_data
                    else:
                        logger.info(f"Using cached {action} result for file {file_id}")
                        await _update_memory_cache(cache_key, cache_data, source_mtime, None)
                        return cache_data
            except Exception as cache_error:
                logger.warning(f"Cache validation failed for {file_id}: {cache_error}")
                cache_data = None

        if action == "fill":
            if metadata.get('filled_file_name'):
                candidate = user_dir / metadata['filled_file_name']
                if candidate.exists():
                    filled_file_match = candidate
            if not filled_file_match:
                filled_candidates = sorted(
                    user_dir.glob(f"filled_{file_id}_*"),
                    key=lambda p: p.stat().st_mtime if p.exists() else 0,
                    reverse=True,
                )
                filled_file_match = filled_candidates[0] if filled_candidates else None

        # If we already have a filled file but no cache, reuse it without reprocessing
        if action == "fill" and filled_file_match and filled_file_match.exists():
            logger.info(f"Reusing existing filled file for {file_id} without reprocessing")
            try:
                file_extension = file_path.suffix[1:].lower()
                original_content = await processing_service.supported_formats[file_extension](str(file_path))
                filled_content = await processing_service.supported_formats[file_extension](
                    str(filled_file_match)
                )
            except Exception as reuse_error:
                logger.warning(
                    f"Failed to reuse existing filled file for {file_id}, falling back to processing: {reuse_error}"
                )
            else:
                clean_download_name = metadata.get('clean_download_name', filled_file_match.name)
                internal_filled_name = metadata.get('filled_file_name', filled_file_match.name)

                if 'filled_file_name' not in metadata:
                    try:
                        with open(metadata_file, 'a', encoding='utf-8') as meta_file:
                            meta_file.write(f"filled_file_name:{filled_file_match.name}\n")
                        metadata['filled_file_name'] = filled_file_match.name
                        internal_filled_name = filled_file_match.name
                    except Exception as meta_error:
                        logger.warning(f"Failed to update metadata for {file_id}: {meta_error}")

                response_data = {
                    "file_id": file_id,
                    "original_file_path": str(file_path),
                    "filled_file_path": str(filled_file_match),
                    "file_name": file_path.name,
                    "filled_file_name": clean_download_name,
                    "filled_internal_file_name": internal_filled_name,
                    "file_type": file_extension,
                    "sections_filled": len(filled_content.get('fillable_sections', [])),
                    "original_content": original_content,
                    "filled_content": filled_content,
                    "fillable_sections": filled_content.get('fillable_sections', []),
                    "text": filled_content.get('text', ''),
                    "processed_at": datetime.fromtimestamp(
                        filled_file_match.stat().st_mtime
                    ).isoformat(),
                    "status": "completed",
                    "download_url": f"/api/v1/file-processing/download/{file_id}",
                }

                try:
                    with open(cache_path, 'w', encoding='utf-8') as cache_file:
                        json.dump(response_data, cache_file, ensure_ascii=False, default=str)
                except Exception as cache_error:
                    logger.warning(f"Failed to cache reused result for {file_id}: {cache_error}")

                await _update_memory_cache(
                    cache_key,
                    response_data,
                    source_mtime,
                    filled_file_match.stat().st_mtime if filled_file_match.exists() else None,
                )

                return response_data

        # Process the file if no valid cache or reusable filled file
        result = await processing_service.process_file(
            file_path=str(file_path),
            user_id=current_user.id,
            action=action
        )
        
        if action == "fill":
            # Generate the actual filled file - prevent multiple "filled_" prefixes
            original_filename = file_path.name
            if original_filename.startswith('filled_'):
                # Remove existing "filled_" prefix to prevent duplication
                original_filename = original_filename[7:]  # Remove "filled_" (7 characters)
            
            # Create a clean filename for download
            # Since the original filename is already corrupted with timestamps/UUIDs,
            # let's generate a more user-friendly name based on file type
            extension = original_filename.split('.')[-1] if '.' in original_filename else 'docx'
            
            # Generate a clean name based on file type and current timestamp
            from datetime import datetime
            timestamp = datetime.now().strftime("%Y%m%d_%H%M")
            
            if extension.lower() in ['xlsx', 'xls']:
                clean_download_name = f"spreadsheet_filled_{timestamp}.{extension}"
            elif extension.lower() in ['docx', 'doc']:
                clean_download_name = f"document_filled_{timestamp}.{extension}"
            elif extension.lower() == 'pdf':
                clean_download_name = f"document_filled_{timestamp}.{extension}"
            else:
                clean_download_name = f"file_filled_{timestamp}.{extension}"
            
            # Keep the filesystem filename for internal use with file_id for easier lookup
            filled_file_name = f"filled_{file_id}_{original_filename}"
            filled_file_path = file_path.parent / filled_file_name
            
            # Generate the filled file
            actual_filled_path = await processing_service.generate_filled_file(
                original_path=str(file_path),
                filled_content=result.get('filled_content', {}),
                output_path=str(filled_file_path)
            )
            
            # Store the original filename and clean download name for future downloads
            metadata_file = file_path.parent / f"{file_id}_metadata.txt"
            with open(metadata_file, 'w', encoding='utf-8') as f:
                f.write(f"original_filename:{file_path.name}\n")
                f.write(f"clean_download_name:{clean_download_name}\n")
                f.write(f"filled_file_name:{filled_file_name}\n")
            
            response_data = {
                "file_id": file_id,
                "original_file_path": str(file_path),
                "filled_file_path": actual_filled_path,
                "file_name": file_path.name,
                "filled_file_name": clean_download_name,
                "filled_internal_file_name": filled_file_name,
                "file_type": result.get('file_type'),
                "sections_filled": result.get('sections_filled', 0),
                "original_content": result.get('original_content'),
                "filled_content": result.get('filled_content'),
                "fillable_sections": result.get('fillable_sections', []),  # Add this for preview
                "text": result.get('text', ''),  # Add this for preview
                "processed_at": result.get('processed_at'),
                "status": "completed",
                "download_url": f"/api/v1/file-processing/download/{file_id}"
            }

            # Cache response for future loads
            try:
                with open(cache_path, 'w', encoding='utf-8') as cache_file:
                    json.dump(response_data, cache_file, ensure_ascii=False, default=str)
            except Exception as cache_error:
                logger.warning(f"Failed to cache filled result for {file_id}: {cache_error}")

            await _update_memory_cache(
                cache_key,
                response_data,
                source_mtime,
                Path(actual_filled_path).stat().st_mtime if Path(actual_filled_path).exists() else None,
            )

            return response_data
        else:  # analyze
            response_data = {
                "file_id": file_id,
                "file_path": str(file_path),
                "file_name": file_path.name,
                "file_type": result.get('file_type'),
                "analysis": result.get('analysis'),
                "fillable_sections": result.get('fillable_sections', []),
                "processed_at": result.get('processed_at'),
                "status": "completed"
            }

            # Cache analysis response
            try:
                with open(cache_path, 'w', encoding='utf-8') as cache_file:
                    json.dump(response_data, cache_file, ensure_ascii=False, default=str)
            except Exception as cache_error:
                logger.warning(f"Failed to cache analysis result for {file_id}: {cache_error}")

            await _update_memory_cache(cache_key, response_data, source_mtime, None)

            return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing existing file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")

@router.get("/download/{file_id}")
async def download_filled_file(
    file_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Download a filled file by file ID.
    """
    try:
        logger.info(f"Download request for file {file_id} from user {current_user.id}")
        
        from fastapi.responses import FileResponse
        import os
        from pathlib import Path
        
        # Look for the filled file in the user's directory
        user_dir = Path(f"uploads/{current_user.id}")
        
        # Try to read the original filename from metadata file
        metadata_file = user_dir / f"{file_id}_metadata.txt"
        original_filename = None
        clean_download_name = None
        
        if metadata_file.exists():
            try:
                with open(metadata_file, 'r') as f:
                    for line in f:
                        if line.startswith('original_filename:'):
                            original_filename = line.split(':', 1)[1].strip()
                        elif line.startswith('clean_download_name:'):
                            clean_download_name = line.split(':', 1)[1].strip()
                logger.info(f"Found metadata - original: {original_filename}, clean: {clean_download_name}")
            except Exception as e:
                logger.warning(f"Could not read metadata file: {e}")
        
        # If we have the clean download name from metadata, use it
        if clean_download_name:
            logger.info(f"Using stored clean download name: {clean_download_name}")
            final_clean_filename = clean_download_name
        else:
            # Fallback to generic name
            logger.info("No metadata found, using generic filename")
            final_clean_filename = "filled_document"
        
        if not user_dir.exists():
            raise HTTPException(status_code=404, detail="User directory not found")
        
        # Find the filled file - look for files that contain the exact file_id
        filled_files = []
        
        # First, try to find a file with the exact file_id in the name (new format)
        exact_match = list(user_dir.glob(f"filled_{file_id}_*"))
        if exact_match:
            filled_files = exact_match
        
        # If no exact match, try the old format
        if not filled_files:
            exact_match = list(user_dir.glob(f"*{file_id}*"))
            if exact_match:
                filled_files = [f for f in exact_match if f.name.startswith('filled_')]
        
        # If still no match, look for any filled files (fallback)
        if not filled_files:
            filled_files = list(user_dir.glob(f"filled_*"))
        
        if not filled_files:
            raise HTTPException(status_code=404, detail="Filled file not found")
        
        # Get the most recent filled file or the one with the exact file_id
        if len(filled_files) == 1:
            filled_file_path = filled_files[0]
        else:
            # Prefer files with the exact file_id, otherwise get the most recent
            exact_id_files = [f for f in filled_files if f"filled_{file_id}_" in f.name]
            if exact_id_files:
                filled_file_path = exact_id_files[0]
            else:
                filled_file_path = max(filled_files, key=lambda f: f.stat().st_mtime)
        
        logger.info(f"Found filled file: {filled_file_path}")
        
        if not filled_file_path.exists():
            raise HTTPException(status_code=404, detail="File not found")
        
        # Use the clean filename we determined earlier
        # If it already has an extension, use it as-is; otherwise add the extension
        if final_clean_filename.endswith(('.xlsx', '.xls', '.csv', '.docx', '.doc', '.pdf', '.txt')):
            clean_filename = final_clean_filename
        else:
            extension = filled_file_path.suffix
            clean_filename = f"{final_clean_filename}{extension}"
        logger.info(f"Final download filename: {clean_filename}")
        
        
        # Determine the correct MIME type based on file extension
        media_type = 'application/octet-stream'
        if filled_file_path.suffix.lower() in ['.xlsx', '.xls']:
            media_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        elif filled_file_path.suffix.lower() == '.xls':
            media_type = 'application/vnd.ms-excel'
        elif filled_file_path.suffix.lower() == '.csv':
            media_type = 'text/csv'
        elif filled_file_path.suffix.lower() in ['.docx', '.doc']:
            media_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        
        logger.info(f"Download filename: {clean_filename}, MIME type: {media_type}")
        
        # Return the file as a download with proper headers
        return FileResponse(
            path=str(filled_file_path),
            filename=clean_filename,
            media_type=media_type,
            headers={
                "Content-Disposition": f"attachment; filename=\"{clean_filename}\"",
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to download file: {str(e)}")

@router.get("/status/{file_id}")
async def get_processing_status(
    file_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get the processing status of a file.
    """
    try:
        logger.info(f"Status request for file {file_id} from user {current_user.id}")
        
        # In a real implementation, you'd check the processing status from the database
        # For now, return a placeholder response
        return {
            "file_id": file_id,
            "status": "completed",
            "processed_at": datetime.utcnow().isoformat(),
            "message": "File processing completed successfully"
        }
        
    except Exception as e:
        logger.error(f"Error getting file status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get file status: {str(e)}")

@router.post("/preview")
async def preview_filled_content(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Preview what the filled file would look like without actually creating it.
    This allows users to see the changes before committing.
    """
    try:
        logger.info(f"File preview request from user {current_user.id} for file {file.filename}")
        
        # Save the uploaded file temporarily
        file_path, file_id = await file_service.save_file(file, current_user.id)
        
        # Initialize file processing service
        processing_service = FileProcessingService(db)
        
        # Analyze the file first
        analysis_result = await processing_service.process_file(
            file_path=file_path,
            user_id=current_user.id,
            action="analyze"
        )
        
        # Get a preview of what would be filled
        fill_result = await processing_service.process_file(
            file_path=file_path,
            user_id=current_user.id,
            action="fill"
        )
        
        return {
            "file_id": file_id,
            "file_name": file.filename,
            "file_type": analysis_result.get('file_type'),
            "fillable_sections": fill_result.get('fillable_sections', []),  # Use filled sections with answers
            "preview_content": fill_result.get('filled_content'),
            "text": fill_result.get('text', ''),  # Add structured text
            "sections_to_fill": fill_result.get('sections_filled', 0),
            "original_content": fill_result.get('original_content'),
            "filled_content": fill_result.get('filled_content'),
            "processed_at": datetime.utcnow().isoformat(),
            "status": "preview_ready"
        }
        
    except Exception as e:
        logger.error(f"Error creating file preview: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create preview: {str(e)}")

@router.get("/supported-formats")
async def get_supported_formats():
    """
    Get list of supported file formats for processing.
    """
    return {
        "supported_formats": [
            # Document formats
            {
                "extension": "pdf",
                "mime_type": "application/pdf",
                "description": "PDF documents",
                "supports_filling": True
            },
            {
                "extension": "docx",
                "mime_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "description": "Microsoft Word documents",
                "supports_filling": True
            },
            {
                "extension": "doc",
                "mime_type": "application/msword",
                "description": "Microsoft Word documents (legacy)",
                "supports_filling": True
            },
            {
                "extension": "txt",
                "mime_type": "text/plain",
                "description": "Plain text files",
                "supports_filling": True
            },
            {
                "extension": "rtf",
                "mime_type": "application/rtf",
                "description": "Rich Text Format documents",
                "supports_filling": True
            },
            # Spreadsheet formats
            {
                "extension": "csv",
                "mime_type": "text/csv",
                "description": "Comma-separated values",
                "supports_filling": True
            },
            {
                "extension": "xlsx",
                "mime_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "description": "Microsoft Excel spreadsheets",
                "supports_filling": True
            },
            {
                "extension": "xls",
                "mime_type": "application/vnd.ms-excel",
                "description": "Microsoft Excel spreadsheets (legacy)",
                "supports_filling": True
            },
            # Data formats
            {
                "extension": "json",
                "mime_type": "application/json",
                "description": "JSON data files",
                "supports_filling": True
            },
            {
                "extension": "xml",
                "mime_type": "application/xml",
                "description": "XML data files",
                "supports_filling": True
            },
            # Code formats
            {
                "extension": "py",
                "mime_type": "text/x-python",
                "description": "Python source code",
                "supports_filling": True
            },
            {
                "extension": "js",
                "mime_type": "text/javascript",
                "description": "JavaScript source code",
                "supports_filling": True
            },
            {
                "extension": "java",
                "mime_type": "text/x-java-source",
                "description": "Java source code",
                "supports_filling": True
            },
            {
                "extension": "cpp",
                "mime_type": "text/x-c++src",
                "description": "C++ source code",
                "supports_filling": True
            },
            {
                "extension": "c",
                "mime_type": "text/x-csrc",
                "description": "C source code",
                "supports_filling": True
            },
            {
                "extension": "html",
                "mime_type": "text/html",
                "description": "HTML documents",
                "supports_filling": True
            },
            {
                "extension": "css",
                "mime_type": "text/css",
                "description": "CSS stylesheets",
                "supports_filling": True
            },
            # Image formats
            {
                "extension": "png",
                "mime_type": "image/png",
                "description": "PNG images (OCR processing)",
                "supports_filling": True
            },
            {
                "extension": "jpg",
                "mime_type": "image/jpeg",
                "description": "JPEG images (OCR processing)",
                "supports_filling": True
            },
            {
                "extension": "gif",
                "mime_type": "image/gif",
                "description": "GIF images (OCR processing)",
                "supports_filling": True
            },
            {
                "extension": "bmp",
                "mime_type": "image/bmp",
                "description": "BMP images (OCR processing)",
                "supports_filling": True
            },
            {
                "extension": "tiff",
                "mime_type": "image/tiff",
                "description": "TIFF images (OCR processing)",
                "supports_filling": True
            },
            {
                "extension": "webp",
                "mime_type": "image/webp",
                "description": "WebP images (OCR processing)",
                "supports_filling": True
            }
        ],
        "max_file_size": "100MB",
        "processing_limits": {
            "free_plan": "5 files per day",
            "plus_plan": "50 files per day",
            "pro_plan": "200 files per day",
            "max_plan": "Unlimited"
        }
    }
