"""
GPT File Completion Service for AssignmentAI
Simplified approach that uses GPT directly to complete any file type
Uses the user's subscription model (gpt-5-nano, gpt-4.1-mini, gpt-4-turbo, or gpt-5)
"""
import base64
from typing import Dict, Any, Optional, List
from pathlib import Path
import json
from openai import AsyncOpenAI
from app.core.config import settings
from app.core.logger import logger
from app.services.ai_service import AIService


class GPTFileCompletionService:
    """
    Unified service that uses GPT to complete files of any type
    Replaces complex multi-step processing with direct GPT completion
    """
    
    def __init__(self, db_session):
        self.db = db_session
        self.ai_service = AIService(db_session)
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    
    async def complete_file(
        self, 
        file_content: Dict[str, Any], 
        file_type: str, 
        user_id: int,
        file_path: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Complete any file type using GPT
        
        Args:
            file_content: Extracted content from the file
            file_type: File extension (pdf, docx, xlsx, png, etc.)
            user_id: User ID to determine which model to use
            file_path: Optional path to original file (needed for images)
        
        Returns:
            Dictionary with completed content
        """
        try:
            # Get user's subscription model
            model = await self.ai_service.get_user_model(user_id)
            logger.info(f"Completing {file_type} file for user {user_id} using model {model}")
            
            # Route to appropriate completion method
            if file_type in ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff', 'webp']:
                return await self._complete_image_file(file_path, model, user_id)
            elif file_type in ['xlsx', 'xls', 'csv']:
                return await self._complete_spreadsheet(file_content, file_type, model, user_id)
            elif file_type in ['docx', 'doc', 'txt', 'rtf', 'pdf']:
                return await self._complete_document(file_content, file_type, model, user_id)
            elif file_type in ['py', 'js', 'java', 'cpp', 'c', 'html', 'css']:
                return await self._complete_code(file_content, file_type, model, user_id)
            elif file_type in ['json', 'xml']:
                return await self._complete_data_file(file_content, file_type, model, user_id)
            else:
                raise ValueError(f"Unsupported file type: {file_type}")
        
        except Exception as e:
            logger.error(f"Error completing file: {str(e)}")
            raise
    
    async def _complete_image_file(
        self, 
        file_path: str, 
        model: str, 
        user_id: int
    ) -> Dict[str, Any]:
        """
        Complete image files using GPT-4 Vision
        """
        try:
            # Check if model supports vision
            vision_supported_models = ['gpt-4o', 'gpt-4-turbo', 'gpt-4o-mini', 'gpt-5']
            
            if not any(vm in model.lower() for vm in ['gpt-4', 'gpt-5']):
                logger.warning(f"Model {model} may not support vision, upgrading to gpt-4o-mini")
                model = "gpt-4o-mini"
            
            # Read and encode image
            with open(file_path, 'rb') as image_file:
                image_data = base64.b64encode(image_file.read()).decode('utf-8')
            
            # Determine image format
            file_extension = Path(file_path).suffix[1:].lower()
            mime_type = f"image/{file_extension}" if file_extension != 'jpg' else "image/jpeg"
            
            # Create vision prompt
            prompt = """Analyze this image carefully. It appears to be an assignment or document that needs to be completed.

Please:
1. Identify any blank spaces, questions, or incomplete sections
2. Provide appropriate answers or completions for each section
3. Maintain the context and style of the document
4. If it's a worksheet, answer all questions
5. If it's a form, fill in appropriate information
6. If it's a diagram, provide labels or descriptions

Return your response as a structured JSON with:
- "identified_sections": List of sections/questions found
- "completions": Dictionary mapping section/question to answer
- "full_completion": Complete text of all answers in order"""

            messages = [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": prompt
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{mime_type};base64,{image_data}"
                            }
                        }
                    ]
                }
            ]
            
            # Call GPT with vision
            response = await self.client.chat.completions.create(
                model=model,
                messages=messages,
                max_completion_tokens=4000
            )
            
            completion_text = response.choices[0].message.content
            
            # Try to parse as JSON, fallback to raw text
            try:
                completion_data = json.loads(completion_text)
            except json.JSONDecodeError:
                completion_data = {
                    "full_completion": completion_text,
                    "identified_sections": ["Image analysis"],
                    "completions": {"image_content": completion_text}
                }
            
            # Track token usage
            await self.ai_service.track_token_usage(
                user_id=user_id,
                feature='file_completion',
                action='complete_image',
                tokens_used=response.usage.total_tokens if response.usage else 0,
                metadata={'file_type': 'image', 'model': model}
            )
            
            return {
                'type': 'image',
                'completed': True,
                'completion_data': completion_data,
                'model_used': model,
                'raw_response': completion_text
            }
        
        except Exception as e:
            logger.error(f"Error completing image file: {str(e)}")
            raise
    
    async def _complete_document(
        self, 
        file_content: Dict[str, Any], 
        file_type: str, 
        model: str, 
        user_id: int
    ) -> Dict[str, Any]:
        """
        Complete document files (docx, doc, txt, rtf, pdf)
        """
        try:
            # Extract text content
            if isinstance(file_content, dict):
                text_content = file_content.get('text', '') or file_content.get('content', '')
            else:
                text_content = str(file_content)
            
            # Create completion prompt
            prompt = f"""You are completing an assignment document. Below is the content with blank spaces, incomplete sections, or questions that need to be filled in.

INSTRUCTIONS:
1. Carefully read through the entire document
2. Identify all blank spaces (indicated by underscores, brackets, or "TODO" markers)
3. Complete each section with appropriate, detailed content
4. Maintain the document's tone, style, and formatting
5. Keep your answers relevant and contextual
6. Return the COMPLETE document with all sections filled in

ORIGINAL DOCUMENT:
{text_content}

COMPLETED DOCUMENT (return the full document with all blanks filled):"""

            # Get user's AI settings for token limits
            user_plan = await self.ai_service.get_user_plan(user_id)
            from app.core.validation import get_subscription_token_limit
            max_tokens = min(get_subscription_token_limit(user_plan), 16000)  # Cap at 16K for response
            
            # Call GPT
            response = await self.client.chat.completions.create(
                model=model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful AI assistant that completes assignments and documents. Always provide complete, detailed, and contextually appropriate content."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_completion_tokens=max_tokens,
                temperature=0.7
            )
            
            completed_text = response.choices[0].message.content
            
            # Track token usage
            await self.ai_service.track_token_usage(
                user_id=user_id,
                feature='file_completion',
                action='complete_document',
                tokens_used=response.usage.total_tokens if response.usage else 0,
                metadata={'file_type': file_type, 'model': model}
            )
            
            return {
                'type': 'document',
                'completed': True,
                'text': completed_text,
                'original_text': text_content,
                'model_used': model,
                'file_type': file_type
            }
        
        except Exception as e:
            logger.error(f"Error completing document: {str(e)}")
            raise
    
    async def _complete_spreadsheet(
        self, 
        file_content: Dict[str, Any], 
        file_type: str, 
        model: str, 
        user_id: int
    ) -> Dict[str, Any]:
        """
        Complete spreadsheet files (xlsx, xls, csv)
        """
        try:
            # Convert spreadsheet content to readable format
            if isinstance(file_content, dict):
                data = file_content.get('data', []) or file_content.get('rows', [])
                sheets = file_content.get('sheets', {})
                formulas = file_content.get('formulas', [])
            else:
                data = file_content
                sheets = {}
                formulas = []
            
            # Create a text representation of the spreadsheet
            spreadsheet_text = self._format_spreadsheet_for_gpt(data, sheets, formulas)
            
            # Create completion prompt
            prompt = f"""You are completing a spreadsheet/data assignment. Below is the content with empty cells, incomplete calculations, or formulas that need values.

INSTRUCTIONS:
1. Analyze the spreadsheet structure and identify empty cells or incomplete data
2. Calculate any formulas and provide the results
3. Fill in missing data based on patterns or context
4. Complete any calculations or statistical analysis
5. Return the completed data in the same structure

ORIGINAL SPREADSHEET:
{spreadsheet_text}

COMPLETED SPREADSHEET (provide filled data, calculated values, and any analyses):"""

            # Get token limit
            user_plan = await self.ai_service.get_user_plan(user_id)
            from app.core.validation import get_subscription_token_limit
            max_tokens = min(get_subscription_token_limit(user_plan), 16000)
            
            # Call GPT
            response = await self.client.chat.completions.create(
                model=model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful AI assistant specialized in spreadsheet analysis and data completion. Always provide accurate calculations and complete all missing data."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_completion_tokens=max_tokens,
                temperature=0.5  # Lower temperature for more accurate calculations
            )
            
            completed_text = response.choices[0].message.content
            
            # Track token usage
            await self.ai_service.track_token_usage(
                user_id=user_id,
                feature='file_completion',
                action='complete_spreadsheet',
                tokens_used=response.usage.total_tokens if response.usage else 0,
                metadata={'file_type': file_type, 'model': model}
            )
            
            return {
                'type': 'spreadsheet',
                'completed': True,
                'completion_text': completed_text,
                'original_data': data,
                'model_used': model,
                'file_type': file_type
            }
        
        except Exception as e:
            logger.error(f"Error completing spreadsheet: {str(e)}")
            raise
    
    async def _complete_code(
        self, 
        file_content: Dict[str, Any], 
        file_type: str, 
        model: str, 
        user_id: int
    ) -> Dict[str, Any]:
        """
        Complete code files (py, js, java, cpp, c, html, css)
        """
        try:
            # Extract code content
            if isinstance(file_content, dict):
                code_content = file_content.get('code', '') or file_content.get('content', '')
            else:
                code_content = str(file_content)
            
            # Determine language
            language_map = {
                'py': 'Python',
                'js': 'JavaScript',
                'java': 'Java',
                'cpp': 'C++',
                'c': 'C',
                'html': 'HTML',
                'css': 'CSS'
            }
            language = language_map.get(file_type, file_type.upper())
            
            # Create completion prompt
            prompt = f"""You are completing a {language} code assignment. Below is code with TODO comments, incomplete functions, or missing implementations.

INSTRUCTIONS:
1. Identify all TODO comments, empty function bodies, or incomplete code
2. Implement all missing functionality
3. Ensure code is syntactically correct and functional
4. Add helpful comments where appropriate
5. Follow best practices for {language}
6. Return ONLY the complete, working code

ORIGINAL CODE:
```{file_type}
{code_content}
```

COMPLETED CODE (return only the code, no explanations):"""

            # Get token limit
            user_plan = await self.ai_service.get_user_plan(user_id)
            from app.core.validation import get_subscription_token_limit
            max_tokens = min(get_subscription_token_limit(user_plan), 16000)
            
            # Call GPT
            response = await self.client.chat.completions.create(
                model=model,
                messages=[
                    {
                        "role": "system",
                        "content": f"You are an expert {language} programmer. Complete code assignments with clean, functional, well-documented code. Never provide explanations, only code."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_completion_tokens=max_tokens,
                temperature=0.3  # Lower temperature for more precise code
            )
            
            completed_code = response.choices[0].message.content
            
            # Extract code from markdown blocks if present
            if '```' in completed_code:
                import re
                code_blocks = re.findall(r'```(?:\w+)?\n(.*?)\n```', completed_code, re.DOTALL)
                if code_blocks:
                    completed_code = code_blocks[0]
            
            # Track token usage
            await self.ai_service.track_token_usage(
                user_id=user_id,
                feature='file_completion',
                action='complete_code',
                tokens_used=response.usage.total_tokens if response.usage else 0,
                metadata={'file_type': file_type, 'language': language, 'model': model}
            )
            
            return {
                'type': 'code',
                'completed': True,
                'code': completed_code,
                'original_code': code_content,
                'language': language,
                'model_used': model,
                'file_type': file_type
            }
        
        except Exception as e:
            logger.error(f"Error completing code file: {str(e)}")
            raise
    
    async def _complete_data_file(
        self, 
        file_content: Dict[str, Any], 
        file_type: str, 
        model: str, 
        user_id: int
    ) -> Dict[str, Any]:
        """
        Complete data files (json, xml)
        """
        try:
            # Convert to string representation
            if isinstance(file_content, dict):
                data_text = json.dumps(file_content, indent=2)
            else:
                data_text = str(file_content)
            
            # Create completion prompt
            prompt = f"""You are completing a {file_type.upper()} data file. Below is the content with missing values, incomplete structures, or placeholder data.

INSTRUCTIONS:
1. Identify all missing or placeholder values
2. Fill in appropriate data based on the structure and context
3. Ensure the data is valid {file_type.upper()}
4. Maintain consistency with existing data patterns
5. Return the complete, valid {file_type.upper()} structure

ORIGINAL DATA:
{data_text}

COMPLETED DATA (return valid {file_type.upper()}):"""

            # Get token limit
            user_plan = await self.ai_service.get_user_plan(user_id)
            from app.core.validation import get_subscription_token_limit
            max_tokens = min(get_subscription_token_limit(user_plan), 16000)
            
            # Call GPT
            response = await self.client.chat.completions.create(
                model=model,
                messages=[
                    {
                        "role": "system",
                        "content": f"You are a data specialist. Complete {file_type.upper()} data structures with appropriate values. Always return valid, well-formed data."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_completion_tokens=max_tokens,
                temperature=0.4
            )
            
            completed_text = response.choices[0].message.content
            
            # Track token usage
            await self.ai_service.track_token_usage(
                user_id=user_id,
                feature='file_completion',
                action='complete_data',
                tokens_used=response.usage.total_tokens if response.usage else 0,
                metadata={'file_type': file_type, 'model': model}
            )
            
            return {
                'type': 'data',
                'completed': True,
                'data_text': completed_text,
                'original_data': data_text,
                'model_used': model,
                'file_type': file_type
            }
        
        except Exception as e:
            logger.error(f"Error completing data file: {str(e)}")
            raise
    
    def _format_spreadsheet_for_gpt(
        self, 
        data: List[List[Any]], 
        sheets: Dict[str, Any], 
        formulas: List[Dict[str, Any]]
    ) -> str:
        """
        Format spreadsheet data into a readable text format for GPT
        """
        result = []
        
        # Format main data
        if data:
            result.append("SPREADSHEET DATA:")
            result.append("-" * 80)
            
            # Add column headers if available
            if len(data) > 0:
                headers = data[0]
                result.append(" | ".join(str(h) for h in headers))
                result.append("-" * 80)
                
                # Add data rows
                for row in data[1:]:
                    result.append(" | ".join(str(cell) if cell else "[EMPTY]" for cell in row))
        
        # Add formula information
        if formulas:
            result.append("\n\nFORMULAS:")
            result.append("-" * 80)
            for formula in formulas:
                cell = formula.get('cell', 'Unknown')
                formula_text = formula.get('formula', '')
                value = formula.get('value', 'Not calculated')
                result.append(f"{cell}: {formula_text} = {value}")
        
        # Add sheet information
        if sheets:
            result.append("\n\nADDITIONAL SHEETS:")
            result.append("-" * 80)
            for sheet_name, sheet_data in sheets.items():
                result.append(f"\nSheet: {sheet_name}")
                if isinstance(sheet_data, list) and sheet_data:
                    for row in sheet_data[:5]:  # First 5 rows
                        result.append(" | ".join(str(cell) if cell else "[EMPTY]" for cell in row))
        
        return "\n".join(result)

