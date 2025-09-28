"""
Preview and Edit Service for AssignmentAI
Implements web preview and inline editing functionality before export per PRD requirements
"""
import json
import tempfile
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime
import logging

from app.core.logger import logger

@dataclass
class EditableSection:
    id: str
    original_text: str
    filled_text: str
    section_type: str  # 'question', 'blank', 'table_cell', 'code_block', etc.
    position: Dict[str, Any]  # Line number, paragraph index, etc.
    metadata: Dict[str, Any]  # Additional context
    is_editable: bool = True
    confidence: float = 1.0

@dataclass
class PreviewData:
    file_type: str
    file_name: str
    original_content: str
    filled_content: str
    editable_sections: List[EditableSection]
    metadata: Dict[str, Any]
    preview_html: str
    total_sections: int
    completed_sections: int
    created_at: datetime

class PreviewEditService:
    """
    Service for previewing and editing filled content before export
    Implements PRD requirements for web preview and inline editing
    """
    
    def __init__(self):
        self.preview_cache: Dict[str, PreviewData] = {}
        self.edit_history: Dict[str, List[Dict[str, Any]]] = {}
    
    async def create_preview(
        self, 
        file_path: str, 
        filled_content: Dict[str, Any], 
        file_type: str,
        user_id: int
    ) -> str:
        """
        Create a preview of the filled content with editable sections
        Returns a preview ID for accessing the preview
        """
        try:
            preview_id = f"preview_{user_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
            
            # Extract editable sections from filled content
            editable_sections = self._extract_editable_sections(filled_content, file_type)
            
            # Generate preview HTML
            preview_html = self._generate_preview_html(filled_content, editable_sections, file_type)
            
            # Create preview data
            preview_data = PreviewData(
                file_type=file_type,
                file_name=file_path.split('/')[-1],
                original_content=filled_content.get('original_content', ''),
                filled_content=filled_content.get('text', ''),
                editable_sections=editable_sections,
                metadata=filled_content.get('metadata', {}),
                preview_html=preview_html,
                total_sections=len(editable_sections),
                completed_sections=len([s for s in editable_sections if s.filled_text.strip()]),
                created_at=datetime.utcnow()
            )
            
            # Cache the preview
            self.preview_cache[preview_id] = preview_data
            
            logger.info(f"Created preview {preview_id} with {len(editable_sections)} editable sections")
            return preview_id
            
        except Exception as e:
            logger.error(f"Error creating preview: {str(e)}")
            raise
    
    async def get_preview(self, preview_id: str) -> Optional[PreviewData]:
        """Get preview data by ID"""
        return self.preview_cache.get(preview_id)
    
    async def edit_section(
        self, 
        preview_id: str, 
        section_id: str, 
        new_text: str,
        user_id: int
    ) -> bool:
        """
        Edit a specific section in the preview
        Returns True if successful
        """
        try:
            preview_data = self.preview_cache.get(preview_id)
            if not preview_data:
                return False
            
            # Find the section to edit
            section = None
            for s in preview_data.editable_sections:
                if s.id == section_id:
                    section = s
                    break
            
            if not section or not section.is_editable:
                return False
            
            # Record edit in history
            if preview_id not in self.edit_history:
                self.edit_history[preview_id] = []
            
            edit_record = {
                'timestamp': datetime.utcnow().isoformat(),
                'section_id': section_id,
                'old_text': section.filled_text,
                'new_text': new_text,
                'user_id': user_id
            }
            self.edit_history[preview_id].append(edit_record)
            
            # Update the section
            section.filled_text = new_text
            
            # Update preview HTML
            preview_data.preview_html = self._generate_preview_html(
                {'text': preview_data.filled_content, 'sections': preview_data.editable_sections},
                preview_data.editable_sections,
                preview_data.file_type
            )
            
            # Update completion count
            preview_data.completed_sections = len([s for s in preview_data.editable_sections if s.filled_text.strip()])
            
            logger.info(f"Edited section {section_id} in preview {preview_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error editing section: {str(e)}")
            return False
    
    async def get_edit_history(self, preview_id: str) -> List[Dict[str, Any]]:
        """Get edit history for a preview"""
        return self.edit_history.get(preview_id, [])
    
    async def undo_edit(self, preview_id: str, user_id: int) -> bool:
        """Undo the last edit for a preview"""
        try:
            history = self.edit_history.get(preview_id, [])
            if not history:
                return False
            
            # Find the last edit by this user
            last_edit = None
            for edit in reversed(history):
                if edit['user_id'] == user_id:
                    last_edit = edit
                    break
            
            if not last_edit:
                return False
            
            # Undo the edit
            preview_data = self.preview_cache.get(preview_id)
            if not preview_data:
                return False
            
            # Find and revert the section
            for section in preview_data.editable_sections:
                if section.id == last_edit['section_id']:
                    section.filled_text = last_edit['old_text']
                    break
            
            # Remove the edit from history
            history.remove(last_edit)
            
            # Update preview HTML
            preview_data.preview_html = self._generate_preview_html(
                {'text': preview_data.filled_content, 'sections': preview_data.editable_sections},
                preview_data.editable_sections,
                preview_data.file_type
            )
            
            logger.info(f"Undid edit for preview {preview_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error undoing edit: {str(e)}")
            return False
    
    async def export_preview(
        self, 
        preview_id: str, 
        output_format: str = "original",
        include_metadata: bool = True
    ) -> Dict[str, Any]:
        """
        Export the preview content in the specified format
        Returns the exported content and metadata
        """
        try:
            preview_data = self.preview_cache.get(preview_id)
            if not preview_data:
                raise ValueError(f"Preview {preview_id} not found")
            
            # Build the final content from editable sections
            final_content = self._build_final_content(preview_data)
            
            export_data = {
                'content': final_content,
                'format': output_format,
                'file_type': preview_data.file_type,
                'file_name': preview_data.file_name,
                'sections_edited': len([h for h in self.edit_history.get(preview_id, [])]),
                'total_sections': preview_data.total_sections,
                'completed_sections': preview_data.completed_sections,
                'exported_at': datetime.utcnow().isoformat()
            }
            
            if include_metadata:
                export_data['metadata'] = {
                    'edit_history': self.edit_history.get(preview_id, []),
                    'original_preview_id': preview_id,
                    'file_metadata': preview_data.metadata
                }
            
            logger.info(f"Exported preview {preview_id} in {output_format} format")
            return export_data
            
        except Exception as e:
            logger.error(f"Error exporting preview: {str(e)}")
            raise
    
    async def delete_preview(self, preview_id: str, user_id: int) -> bool:
        """Delete a preview and clean up associated data"""
        try:
            if preview_id in self.preview_cache:
                del self.preview_cache[preview_id]
            
            if preview_id in self.edit_history:
                del self.edit_history[preview_id]
            
            logger.info(f"Deleted preview {preview_id} for user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting preview: {str(e)}")
            return False
    
    def _extract_editable_sections(
        self, 
        filled_content: Dict[str, Any], 
        file_type: str
    ) -> List[EditableSection]:
        """Extract editable sections from filled content"""
        sections = []
        
        # Extract from fillable sections
        fillable_sections = filled_content.get('fillable_sections', [])
        for idx, section in enumerate(fillable_sections):
            editable_section = EditableSection(
                id=f"section_{idx}",
                original_text=section.get('text', ''),
                filled_text=section.get('filled_text', ''),
                section_type=section.get('type', 'unknown'),
                position={'index': idx, 'type': section.get('type', 'unknown')},
                metadata=section.get('metadata', {}),
                is_editable=True,
                confidence=section.get('confidence', 1.0)
            )
            sections.append(editable_section)
        
        # Extract from filled content text
        filled_text = filled_content.get('text', '')
        if filled_text:
            lines = filled_text.split('\n')
            for idx, line in enumerate(lines):
                if line.strip() and not any(s.original_text == line for s in sections):
                    editable_section = EditableSection(
                        id=f"line_{idx}",
                        original_text="",
                        filled_text=line,
                        section_type='text_line',
                        position={'line': idx},
                        metadata={},
                        is_editable=True,
                        confidence=1.0
                    )
                    sections.append(editable_section)
        
        return sections
    
    def _generate_preview_html(
        self, 
        filled_content: Dict[str, Any], 
        editable_sections: List[EditableSection],
        file_type: str
    ) -> str:
        """Generate HTML preview with editable sections"""
        
        html = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>AssignmentAI Preview - {file_type.upper()}</title>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                    line-height: 1.6;
                }}
                .section {{
                    margin: 15px 0;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    background: #f9f9f9;
                }}
                .section.editable {{
                    border-color: #007bff;
                    background: #f0f8ff;
                }}
                .section-header {{
                    font-weight: bold;
                    color: #333;
                    margin-bottom: 5px;
                }}
                .section-content {{
                    margin: 5px 0;
                }}
                .section-type {{
                    font-size: 0.8em;
                    color: #666;
                    text-transform: uppercase;
                }}
                .confidence {{
                    font-size: 0.8em;
                    color: #28a745;
                }}
                .confidence.low {{
                    color: #ffc107;
                }}
                .confidence.very-low {{
                    color: #dc3545;
                }}
                .edit-button {{
                    background: #007bff;
                    color: white;
                    border: none;
                    padding: 5px 10px;
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 0.8em;
                }}
                .edit-button:hover {{
                    background: #0056b3;
                }}
                .file-info {{
                    background: #e9ecef;
                    padding: 15px;
                    border-radius: 5px;
                    margin-bottom: 20px;
                }}
                .file-type {{
                    font-weight: bold;
                    color: #495057;
                }}
                .question {{
                    margin: 10px 0 5px 0;
                    padding: 8px;
                    background: #e9ecef;
                    border-left: 4px solid #007bff;
                    border-radius: 3px;
                }}
                .answer {{
                    margin: 5px 0 15px 0;
                    padding: 8px;
                    background: #f8f9fa;
                    border-left: 4px solid #28a745;
                    border-radius: 3px;
                }}
            </style>
        </head>
        <body>
            <div class="file-info">
                <h2>AssignmentAI Preview</h2>
                <p class="file-type">File Type: {file_type.upper()}</p>
                <p>Total Sections: {len(editable_sections)}</p>
                <p>Completed Sections: {len([s for s in editable_sections if s.filled_text.strip()])}</p>
            </div>
        """
        
        # Add each editable section
        for section in editable_sections:
            confidence_class = ""
            if section.confidence < 0.7:
                confidence_class = "low"
            if section.confidence < 0.5:
                confidence_class = "very-low"
            
            section_class = "section editable" if section.is_editable else "section"
            
            # Generate edit button HTML separately to avoid f-string issues
            edit_button = ""
            if section.is_editable:
                edit_button = f'<button class="edit-button" onclick="editSection(\'{section.id}\')">Edit</button>'
            
            # Format the content based on section type
            if section.section_type in ['underline_blank', 'table_blank', 'complex_placeholder']:
                # Show as question with answer below
                html += f"""
                <div class="{section_class}" data-section-id="{section.id}">
                    <div class="question">
                        <strong>{section.original_text or 'N/A'}</strong>
                    </div>
                    <div class="answer">
                        <strong>Answer:</strong> {section.filled_text}
                        {edit_button}
                    </div>
                </div>
                """
            else:
                # Show as general content section
                html += f"""
                <div class="{section_class}" data-section-id="{section.id}">
                    <div class="section-header">
                        Section {section.id.replace('_', ' ').title()}
                        <span class="section-type">({section.section_type})</span>
                        <span class="confidence {confidence_class}">
                            Confidence: {section.confidence:.1%}
                        </span>
                    </div>
                    <div class="section-content">
                        <strong>Original:</strong> {section.original_text or 'N/A'}<br>
                        <strong>Filled:</strong> {section.filled_text}<br>
                        {edit_button}
                    </div>
                </div>
                """
        
        # Add JavaScript for editing functionality
        html += """
            <script>
                function editSection(sectionId) {
                    const section = document.querySelector(`[data-section-id="${sectionId}"]`);
                    const contentDiv = section.querySelector('.section-content');
                    const currentText = contentDiv.querySelector('strong:last-of-type').nextSibling.textContent.trim();
                    
                    const newText = prompt('Edit the filled text:', currentText);
                    if (newText !== null && newText !== currentText) {
                        // Here you would make an API call to update the section
                        fetch(`/api/v1/preview/edit/${sectionId}`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                preview_id: window.previewId,
                                section_id: sectionId,
                                new_text: newText
                            })
                        })
                        .then(response => response.json())
                        .then(data => {
                            if (data.success) {
                                contentDiv.querySelector('strong:last-of-type').nextSibling.textContent = ' ' + newText;
                                alert('Section updated successfully!');
                            } else {
                                alert('Error updating section: ' + data.error);
                            }
                        })
                        .catch(error => {
                            console.error('Error:', error);
                            alert('Error updating section');
                        });
                    }
                }
                
                // Set the preview ID (this would be injected by the server)
                window.previewId = 'PREVIEW_ID_PLACEHOLDER';
            </script>
        </body>
        </html>
        """
        
        return html
    
    def _build_final_content(self, preview_data: PreviewData) -> str:
        """Build final content from editable sections"""
        sections = preview_data.editable_sections
        
        # Sort sections by position
        sections.sort(key=lambda s: s.position.get('index', 0))
        
        # Build content
        content_parts = []
        for section in sections:
            if section.filled_text.strip():
                content_parts.append(section.filled_text)
        
        return '\n'.join(content_parts)
    
    def cleanup_old_previews(self, max_age_hours: int = 24):
        """Clean up old previews to prevent memory leaks"""
        cutoff_time = datetime.utcnow().timestamp() - (max_age_hours * 3600)
        
        to_remove = []
        for preview_id, preview_data in self.preview_cache.items():
            if preview_data.created_at.timestamp() < cutoff_time:
                to_remove.append(preview_id)
        
        for preview_id in to_remove:
            if preview_id in self.preview_cache:
                del self.preview_cache[preview_id]
            if preview_id in self.edit_history:
                del self.edit_history[preview_id]
        
        if to_remove:
            logger.info(f"Cleaned up {len(to_remove)} old previews")

# Global preview service instance
preview_edit_service = PreviewEditService()
