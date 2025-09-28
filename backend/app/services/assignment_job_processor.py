"""
Assignment Job Processor for AssignmentAI
Processes assignment completion jobs from the queue system
"""
import os
import tempfile
import re
from typing import Dict, Any
from pathlib import Path
import logging

from app.services.file_processing_service import FileProcessingService
from app.services.ai_solving_engine import AISolvingEngine
from app.services.file_write_back_service import FileWriteBackService
from app.core.logger import logger

async def process_assignment_job(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process an assignment completion job
    This function is called by the job queue system
    """
    try:
        file_path = payload.get('file_path')
        user_id = payload.get('user_id')
        subscription_tier = payload.get('subscription_tier', 'free')
        processing_type = payload.get('processing_type', 'full_assignment_processing')
        
        logger.info(f"Processing assignment job for user {user_id}, file: {file_path}")
        
        # Initialize services
        file_service = FileProcessingService(None)  # No DB session needed for this processor
        ai_engine = AISolvingEngine(None)
        write_back_service = FileWriteBackService()
        
        # Step 1: Analyze the file
        logger.info("Step 1: Analyzing file content...")
        file_extension = Path(file_path).suffix[1:].lower()
        content = await file_service.supported_formats[file_extension](file_path)
        analysis_result = await file_service._analyze_file_content(content, file_extension, user_id)
        
        # Step 2: Fill the content using AI solving engine
        logger.info("Step 2: Filling content with AI...")
        filled_content = await file_service._fill_file_content(content, file_extension, user_id)
        
        # Step 3: Validate answers using specialized engines
        logger.info("Step 3: Validating answers...")
        validation_results = await _validate_all_answers(filled_content, ai_engine)
        
        # Step 4: Write back to original format
        logger.info("Step 4: Writing back to original format...")
        output_dir = tempfile.mkdtemp()
        output_filename = f"completed_{Path(file_path).name}"
        output_path = os.path.join(output_dir, output_filename)
        
        watermark = subscription_tier == "free"
        final_file_path = await write_back_service.write_back_answers(
            original_file_path=file_path,
            filled_content=filled_content,
            output_path=output_path,
            watermark=watermark,
            subscription_tier=subscription_tier
        )
        
        # Step 5: Generate result summary
        result = {
            'status': 'completed',
            'original_file': file_path,
            'completed_file': final_file_path,
            'file_type': file_extension,
            'subscription_tier': subscription_tier,
            'watermark_applied': watermark,
            'sections_processed': len(filled_content.get('fillable_sections', [])),
            'validation_results': validation_results,
            'processing_metadata': {
                'analysis_completed': bool(analysis_result),
                'content_filled': bool(filled_content),
                'write_back_completed': bool(final_file_path),
                'file_size_bytes': os.path.getsize(final_file_path) if os.path.exists(final_file_path) else 0
            }
        }
        
        logger.info(f"Assignment processing completed for user {user_id}")
        return result
        
    except Exception as e:
        logger.error(f"Error processing assignment job: {str(e)}")
        raise

async def _validate_all_answers(
    filled_content: Dict[str, Any], 
    ai_engine: AISolvingEngine
) -> Dict[str, Any]:
    """
    Validate all answers using specialized AI engines
    """
    validation_results = {
        'total_sections': 0,
        'validated_sections': 0,
        'high_confidence_sections': 0,
        'medium_confidence_sections': 0,
        'low_confidence_sections': 0,
        'section_details': []
    }
    
    try:
        fillable_sections = filled_content.get('fillable_sections', [])
        validation_results['total_sections'] = len(fillable_sections)
        
        for idx, section in enumerate(fillable_sections):
            section_type = section.get('type', 'unknown')
            filled_text = section.get('filled_text', section.get('text', ''))
            
            if not filled_text.strip():
                continue
            
            # Determine content type for validation
            content_type = _determine_content_type(section_type, filled_text)
            
            try:
                # Validate using appropriate engine
                validation = await ai_engine.solve_assignment(
                    content_type=content_type,
                    question=section.get('text', ''),
                    context=section.get('context', ''),
                    word_bank=section.get('word_bank', [])
                )
                
                confidence = validation.get('validation', {}).get('confidence', 0.0)
                
                section_detail = {
                    'section_id': idx,
                    'section_type': section_type,
                    'content_type': content_type,
                    'confidence': confidence,
                    'is_valid': validation.get('validation', {}).get('is_valid', False),
                    'validation_details': validation.get('validation', {}).get('verification_details', {})
                }
                
                validation_results['section_details'].append(section_detail)
                validation_results['validated_sections'] += 1
                
                if confidence >= 0.8:
                    validation_results['high_confidence_sections'] += 1
                elif confidence >= 0.6:
                    validation_results['medium_confidence_sections'] += 1
                else:
                    validation_results['low_confidence_sections'] += 1
                    
            except Exception as e:
                logger.warning(f"Validation failed for section {idx}: {str(e)}")
                section_detail = {
                    'section_id': idx,
                    'section_type': section_type,
                    'content_type': content_type,
                    'confidence': 0.0,
                    'is_valid': False,
                    'validation_error': str(e)
                }
                validation_results['section_details'].append(section_detail)
        
        # Calculate overall confidence
        if validation_results['validated_sections'] > 0:
            total_confidence = sum(
                detail.get('confidence', 0) 
                for detail in validation_results['section_details']
            )
            validation_results['overall_confidence'] = total_confidence / validation_results['validated_sections']
        else:
            validation_results['overall_confidence'] = 0.0
        
        return validation_results
        
    except Exception as e:
        logger.error(f"Error in validation process: {str(e)}")
        validation_results['validation_error'] = str(e)
        return validation_results

def _determine_content_type(section_type: str, filled_text: str) -> str:
    """
    Determine the content type for validation based on section type and text content
    """
    # Check for mathematical expressions
    if any(char in filled_text for char in ['=', '+', '-', '*', '/', '(', ')', 'x', 'y', 'z']):
        if any(word in filled_text.lower() for word in ['solve', 'calculate', 'equation', 'formula']):
            return 'math'
    
    # Check for code patterns
    if any(pattern in filled_text for pattern in ['def ', 'function ', 'class ', 'import ', 'public class']):
        return 'code'
    
    # Check for spreadsheet formulas
    if any(pattern in filled_text for pattern in ['=SUM(', '=AVERAGE(', '=COUNT(', '=IF(']):
        return 'spreadsheet'
    
    # Check for multiple choice
    if re.match(r'^[A-Z]\.?\s+', filled_text.strip()):
        return 'multiple_choice'
    
    # Check for fill-in-blank patterns
    if section_type in ['underline_blank', 'table_blank', 'complex_placeholder']:
        return 'fill_in_blank'
    
    # Check for essay/long text
    if len(filled_text.split()) > 50:
        return 'text'
    
    # Default to short answer
    return 'short_answer'

# Note: Registration is done in main.py to avoid circular imports
