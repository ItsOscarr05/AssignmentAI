from typing import Dict, Any, List, Optional
import base64
from io import BytesIO
import json
from PIL import Image

# Handle optional imports with fallbacks
try:
    import pytesseract
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False
    pytesseract = None

try:
    import cv2
    OPENCV_AVAILABLE = True
except ImportError:
    OPENCV_AVAILABLE = False
    cv2 = None

try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    NUMPY_AVAILABLE = False
    np = None

from openai import AsyncOpenAI
from app.core.config import settings
from app.core.logger import logger
import asyncio

class ImageAnalysisService:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.supported_formats = ['jpg', 'jpeg', 'png', 'bmp', 'tiff', 'gif']
        
    async def analyze_image_and_answer(
        self, 
        image_data: bytes, 
        question: Optional[str] = None,
        context: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Analyze an image and provide an answer to a question or problem.
        
        Args:
            image_data: Raw image bytes
            question: Optional specific question about the image
            context: Optional context about what the image contains
            
        Returns:
            Dictionary containing analysis results and answer
        """
        try:
            # Convert image to base64 for OpenAI
            image_base64 = base64.b64encode(image_data).decode('utf-8')
            
            # Extract text from image using OCR
            extracted_text_result = await self._extract_text_from_image(image_data)
            extracted_text = extracted_text_result.get("text", "")
            
            # Analyze image content using OpenAI Vision
            image_analysis = await self._analyze_image_content(image_base64, question, context)
            
            # Generate comprehensive answer
            answer = await self._generate_answer(image_analysis, extracted_text, question, context)
            
            return {
                "answer": answer,
                "extracted_text": extracted_text,
                "image_analysis": image_analysis,
                "confidence": self._calculate_confidence(image_analysis, extracted_text)
            }
            
        except Exception as e:
            logger.error(f"Error analyzing image: {str(e)}")
            raise

    async def _extract_text_from_image(self, image_data: bytes, use_vision_api: bool = False) -> dict:
        """Extract text from image using OCR or Vision API."""
        if use_vision_api:
            try:
                # Convert image to base64 for OpenAI
                image_base64 = base64.b64encode(image_data).decode('utf-8')
                
                response = await self.client.chat.completions.create(
                    model="gpt-4-vision-preview",
                    messages=[
                        {
                            "role": "system",
                            "content": "Extract all text from this image. Return only the extracted text, nothing else."
                        },
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "text",
                                    "text": "Extract all text from this image"
                                },
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:image/jpeg;base64,{image_base64}"
                                    }
                                }
                            ]
                        }
                    ],
                    max_tokens=1000,
                    temperature=0.1
                )
                
                content = response.choices[0].message.content
                return {
                    "text": content or "",
                    "confidence": 0.9,
                    "method": "vision_api"
                }
                
            except Exception as e:
                return {
                    "error": f"Failed to extract text using Vision API: {str(e)}",
                    "text": "",
                    "confidence": 0.0
                }
        
        # Use OCR
        if not TESSERACT_AVAILABLE:
            return {
                "error": "pytesseract not available",
                "text": "",
                "confidence": 0.0
            }
            
        try:
            # Convert bytes to PIL Image
            image = Image.open(BytesIO(image_data))
            
            # Preprocess image for better OCR
            processed_image = self._preprocess_image_for_ocr(image)
            
            # Extract text using pytesseract
            text = pytesseract.image_to_string(processed_image)
            
            # Clean up the extracted text
            cleaned_text = self._clean_ocr_text(text)
            
            return {
                "text": cleaned_text,
                "confidence": 0.8 if cleaned_text else 0.0,
                "method": "ocr"
            }
            
        except Exception as e:
            logger.warning(f"OCR extraction failed: {str(e)}")
            return {
                "error": f"OCR extraction failed: {str(e)}",
                "text": "",
                "confidence": 0.0
            }

    def _preprocess_image_for_ocr(self, image: Image.Image) -> Image.Image:
        """Preprocess image to improve OCR accuracy."""
        if not OPENCV_AVAILABLE or not NUMPY_AVAILABLE:
            logger.warning("OpenCV or NumPy not available, returning original image")
            return image
            
        try:
            # Convert to numpy array
            img_array = np.array(image)
            
            # Convert to grayscale if needed
            if len(img_array.shape) == 3:
                gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
            else:
                gray = img_array
            
            # Apply noise reduction
            denoised = cv2.medianBlur(gray, 3)
            
            # Apply thresholding to get binary image
            _, binary = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            
            # Convert back to PIL Image
            return Image.fromarray(binary)
            
        except Exception as e:
            logger.warning(f"Image preprocessing failed: {str(e)}")
            return image

    def _clean_ocr_text(self, text: str) -> str:
        """Clean and format OCR extracted text."""
        if not text:
            return ""
        
        # Remove extra whitespace and normalize
        lines = text.split('\n')
        cleaned_lines = []
        
        for line in lines:
            line = line.strip()
            if line:  # Only keep non-empty lines
                cleaned_lines.append(line)
        
        return '\n'.join(cleaned_lines)

    async def _analyze_image_content(
        self, 
        image_base64: str, 
        question: Optional[str], 
        context: Optional[str]
    ) -> Dict[str, Any]:
        """Analyze image content using OpenAI Vision API."""
        
        # Construct the prompt based on whether there's a specific question
        if question:
            system_prompt = f"""You are an expert at analyzing images and answering questions about them. 
            The user has provided this context: {context or 'No specific context provided'}
            
            Please analyze the image and answer the question: "{question}"
            
            Provide your response in this JSON format:
            {{
                "content_description": "What you see in the image",
                "answer": "Direct answer to the question",
                "explanation": "Detailed explanation of your reasoning",
                "confidence": "high/medium/low",
                "key_elements": ["list", "of", "important", "elements"],
                "suggestions": ["any", "additional", "suggestions"]
            }}"""
        else:
            system_prompt = """You are an expert at analyzing images and providing comprehensive insights.
            
            Please analyze the image and provide a detailed response in this JSON format:
            {
                "content_description": "What you see in the image",
                "main_subject": "Primary subject or focus",
                "details": "Detailed description of elements",
                "context": "What this image might be about",
                "key_elements": ["list", "of", "important", "elements"],
                "potential_questions": ["questions", "this", "image", "might", "answer"],
                "suggestions": ["any", "relevant", "suggestions"]
            }"""

        try:
            response = await self.client.chat.completions.create(
                model="gpt-4-vision-preview",
                messages=[
                    {
                        "role": "system",
                        "content": system_prompt
                    },
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": question or "Please analyze this image and provide detailed insights."
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_base64}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=1000,
                temperature=0.3
            )
            
            content = response.choices[0].message.content
            
            # Try to parse as JSON, fallback to text if needed
            try:
                if content:
                    return json.loads(content)
                else:
                    return {
                        "content_description": "No content received",
                        "raw_response": ""
                    }
            except json.JSONDecodeError:
                return {
                    "content_description": content or "No content received",
                    "raw_response": content or ""
                }
                
        except Exception as e:
            logger.error(f"OpenAI Vision API error: {str(e)}")
            return {
                "error": "Failed to analyze image content",
                "content_description": "Unable to analyze image"
            }

    async def _generate_answer(
        self, 
        image_analysis: Dict[str, Any], 
        extracted_text: str, 
        question: Optional[str], 
        context: Optional[str]
    ) -> str:
        """Generate a comprehensive answer based on image analysis and OCR text."""
        
        # Combine OCR text and image analysis
        combined_context = f"""
        Image Analysis: {json.dumps(image_analysis, indent=2)}
        
        Extracted Text: {extracted_text}
        
        Question: {question or 'General image analysis requested'}
        
        Context: {context or 'No specific context provided'}
        """
        
        prompt = f"""
        Based on the following information, provide a comprehensive and helpful answer:
        
        {combined_context}
        
        Please provide:
        1. A clear, direct answer to the question or problem
        2. An explanation of your reasoning
        3. Any relevant details from the image
        4. Additional helpful information or suggestions
        
        Format your response in a clear, educational manner that would be helpful for a student.
        """
        
        try:
            response = await self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert educational assistant that helps students understand problems and find solutions."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=800,
                temperature=0.4
            )
            
            content = response.choices[0].message.content
            return content if content else "I'm sorry, I couldn't generate an answer. Please try again."
            
        except Exception as e:
            logger.error(f"Error generating answer: {str(e)}")
            return "I'm sorry, I encountered an error while generating the answer. Please try again."

    def _calculate_confidence(
        self, 
        image_analysis: Dict[str, Any], 
        extracted_text: str
    ) -> str:
        """Calculate confidence level based on analysis quality."""
        confidence_score = 0
        
        # Check if we have good image analysis
        if image_analysis.get("content_description") and len(image_analysis["content_description"]) > 50:
            confidence_score += 30
        
        # Check if we extracted meaningful text
        if extracted_text and len(extracted_text) > 20:
            confidence_score += 25
        
        # Check if we have detailed analysis
        if image_analysis.get("key_elements") and len(image_analysis["key_elements"]) > 2:
            confidence_score += 25
        
        # Check if we have explanations
        if image_analysis.get("explanation") or image_analysis.get("details"):
            confidence_score += 20
        
        # Determine confidence level
        if confidence_score >= 80:
            return "high"
        elif confidence_score >= 50:
            return "medium"
        else:
            return "low"

    async def detect_image_type(self, image_data: bytes) -> str:
        """Detect the type of content in the image."""
        try:
            image_base64 = base64.b64encode(image_data).decode('utf-8')
            
            prompt = """
            Analyze this image and determine what type of content it contains.
            Choose from these categories:
            - math_problem (mathematical equations, problems, calculations)
            - text_document (documents, articles, essays)
            - diagram (charts, graphs, diagrams, flowcharts)
            - handwritten_notes (handwritten text, notes)
            - screenshot (computer screenshots, app interfaces)
            - photo (general photographs)
            - other (anything else)
            
            Respond with only the category name.
            """
            
            response = await self.client.chat.completions.create(
                model="gpt-4-vision-preview",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert at categorizing image content."
                    },
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}
                            }
                        ]
                    }
                ],
                max_tokens=50,
                temperature=0.1
            )
            
            content = response.choices[0].message.content
            if content:
                content_type = content.strip().lower()
                return content_type if content_type in [
                    'math_problem', 'text_document', 'diagram', 'handwritten_notes', 
                    'screenshot', 'photo', 'other'
                ] else 'other'
            else:
                return 'other'
            
        except Exception as e:
            logger.error(f"Error detecting image type: {str(e)}")
            return 'other'

    async def solve_math_problem(self, image_data: bytes) -> Dict[str, Any]:
        """Specialized method for solving math problems from images."""
        try:
            image_base64 = base64.b64encode(image_data).decode('utf-8')
            
            prompt = """
            This image contains a math problem. Please:
            1. Identify the problem clearly
            2. Solve it step by step
            3. Provide the final answer
            4. Explain your solution method
            
            Format your response as JSON:
            {
                "problem": "The math problem as identified",
                "solution_steps": ["step 1", "step 2", "step 3"],
                "answer": "The final answer",
                "explanation": "Detailed explanation of the solution method",
                "difficulty": "easy/medium/hard"
            }
            """
            
            response = await self.client.chat.completions.create(
                model="gpt-4-vision-preview",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert math tutor that solves problems step by step."
                    },
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}
                            }
                        ]
                    }
                ],
                max_tokens=800,
                temperature=0.2
            )
            
            content = response.choices[0].message.content
            
            try:
                if content:
                    return json.loads(content)
                else:
                    return {
                        "problem": "Unable to parse problem",
                        "solution_steps": ["Analysis failed"],
                        "answer": "Unable to determine",
                        "explanation": "No content received",
                        "difficulty": "unknown"
                    }
            except json.JSONDecodeError:
                return {
                    "problem": "Unable to parse problem",
                    "solution_steps": ["Analysis failed"],
                    "answer": "Unable to determine",
                    "explanation": content or "No content received",
                    "difficulty": "unknown"
                }
                
        except Exception as e:
            logger.error(f"Error solving math problem: {str(e)}")
            return {
                "error": "Failed to solve math problem",
                "problem": "Unknown",
                "solution_steps": [],
                "answer": "Unable to solve",
                "explanation": "An error occurred during analysis",
                "difficulty": "unknown"
            }

    async def extract_text_document(self, image_data: bytes) -> Dict[str, Any]:
        """Specialized method for extracting and analyzing text documents."""
        try:
            # Extract text using OCR
            extracted_text = await self._extract_text_from_image(image_data)
            
            # Analyze the extracted text
            analysis_prompt = f"""
            Analyze this extracted text from a document:
            
            {extracted_text}
            
            Provide analysis in JSON format:
            {{
                "document_type": "type of document (essay, article, report, etc.)",
                "main_topic": "main subject or topic",
                "key_points": ["list", "of", "key", "points"],
                "summary": "brief summary of the content",
                "suggestions": ["suggestions", "for", "improvement"],
                "word_count": "estimated word count"
            }}
            """
            
            response = await self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert at analyzing and summarizing text documents."
                    },
                    {
                        "role": "user",
                        "content": analysis_prompt
                    }
                ],
                max_tokens=600,
                temperature=0.3
            )
            
            content = response.choices[0].message.content
            
            try:
                if content:
                    analysis = json.loads(content)
                    analysis["extracted_text"] = extracted_text
                    return analysis
                else:
                    return {
                        "document_type": "unknown",
                        "main_topic": "Unable to determine",
                        "key_points": [],
                        "summary": "No content received",
                        "suggestions": [],
                        "word_count": len(extracted_text.split()),
                        "extracted_text": extracted_text
                    }
            except json.JSONDecodeError:
                return {
                    "document_type": "unknown",
                    "main_topic": "Unable to determine",
                    "key_points": [],
                    "summary": content or "No content received",
                    "suggestions": [],
                    "word_count": len(extracted_text.split()),
                    "extracted_text": extracted_text
                }
                
        except Exception as e:
            logger.error(f"Error extracting text document: {str(e)}")
            return {
                "error": "Failed to extract document",
                "extracted_text": "",
                "document_type": "unknown"
            }

    def get_analysis_types(self) -> list[str]:
        """Get list of available analysis types"""
        return [
            "text_extraction",
            "math_solving", 
            "document_analysis",
            "image_type_detection"
        ]

    def get_supported_formats(self) -> list[str]:
        """Get list of supported image formats"""
        return self.supported_formats

    async def analyze_image(self, image_data: bytes, analysis_type: str = "text_extraction", prompt: str = None) -> dict:
        """
        Asynchronous image analysis method
        """
        try:
            if analysis_type == "text_extraction":
                return await self._extract_text_from_image(image_data)
            elif analysis_type == "math_solving":
                return await self.solve_math_problem(image_data)
            elif analysis_type == "document_analysis":
                return await self.extract_text_document(image_data)
            elif analysis_type == "image_type_detection":
                return await self.detect_image_type(image_data)
            else:
                return {"error": f"Unsupported analysis type: {analysis_type}"}
        except Exception as e:
            return {"error": f"Failed to analyze image: {str(e)}"}

# Create a singleton instance
image_analysis_service = ImageAnalysisService() 