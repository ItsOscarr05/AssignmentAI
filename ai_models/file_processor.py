"""File processor module for handling different types of files and extracting content."""

from typing import Dict, List, Optional, Union, BinaryIO
import os
import logging
from pathlib import Path
import magic
import PyPDF2
from PIL import Image
import pytesseract
from docx import Document
import pandas as pd
import json
from bs4 import BeautifulSoup
import re


class FileType:
    """Constants for different file types supported by the processor."""
    
    TEXT = "text"
    PDF = "pdf"
    IMAGE = "image"
    WORD = "word"
    EXCEL = "excel"
    HTML = "html"
    CODE = "code"
    UNKNOWN = "unknown"


class FileProcessor:
    """
    File processor for handling different types of files and extracting their content.
    
    Supports various file types including text, PDF, images (with OCR), Word documents,
    Excel spreadsheets, HTML files, and code files.
    """

    def __init__(self, config_path: str = "ai_models/config/file_config.json") -> None:
        """
        Initialize the file processor with configuration.

        Args:
            config_path: Path to the configuration JSON file.
        """
        self.config = self._load_config(config_path)
        self._initialize_processors()

    def _load_config(self, config_path: str) -> Dict:
        """
        Load configuration from JSON file.

        Args:
            config_path: Path to the configuration file.

        Returns:
            Dict containing configuration settings.
        """
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            # Use default configuration
            return {
                "max_file_size_mb": 50,
                "supported_extensions": {
                    "text": [".txt", ".md", ".log"],
                    "pdf": [".pdf"],
                    "image": [".png", ".jpg", ".jpeg", ".gif", ".bmp"],
                    "word": [".doc", ".docx"],
                    "excel": [".xls", ".xlsx", ".csv"],
                    "html": [".html", ".htm"],
                    "code": [".py", ".js", ".java", ".cpp", ".c", ".cs", ".php", ".rb"]
                },
                "ocr": {
                    "enabled": True,
                    "language": "eng",
                    "psm": 3
                },
                "extraction": {
                    "max_pages": 50,
                    "timeout": 30
                }
            }

    def _initialize_processors(self) -> None:
        """Initialize necessary processors and check dependencies."""
        # Check OCR availability
        if self.config["ocr"]["enabled"]:
            try:
                pytesseract.get_tesseract_version()
            except Exception as e:
                logging.warning(f"Tesseract OCR not available: {e}")
                self.config["ocr"]["enabled"] = False

    async def process_file(
        self,
        file_path: Union[str, Path, BinaryIO],
        file_type: Optional[str] = None
    ) -> Dict:
        """
        Process a file and extract its content with metadata.

        Args:
            file_path: Path to the file or file-like object.
            file_type: Optional file type override.

        Returns:
            Dict containing extracted content and metadata.

        Raises:
            FileNotFoundError: If the file doesn't exist.
            ValueError: If the file size exceeds limits or type is unsupported.
        """
        try:
            # Convert to Path object if string
            if isinstance(file_path, str):
                file_path = Path(file_path)
            
            # Determine file type if not provided
            if not file_type:
                file_type = self._detect_file_type(file_path)
            
            # Validate file
            self._validate_file(file_path)
            
            # Extract content based on file type
            content = await self._extract_content(file_path, file_type)
            
            # Process extracted content
            processed_content = await self._process_content(content, file_type)
            
            return {
                "content": processed_content,
                "metadata": {
                    "file_type": file_type,
                    "file_name": file_path.name if isinstance(file_path, Path) else "stream",
                    "file_size": os.path.getsize(file_path) if isinstance(file_path, Path) else None,
                    "extraction_method": self._get_extraction_method(file_type)
                }
            }
        except Exception as e:
            logging.error(f"Error processing file: {str(e)}")
            raise

    def _detect_file_type(self, file_path: Union[Path, BinaryIO]) -> str:
        """
        Detect the type of file using magic numbers and extension.

        Args:
            file_path: Path to the file or file-like object.

        Returns:
            String indicating the detected file type.
        """
        try:
            # Get mime type
            if isinstance(file_path, Path):
                mime = magic.from_file(str(file_path), mime=True)
                extension = file_path.suffix.lower()
            else:
                # For file-like objects, read the first few bytes
                header = file_path.read(2048)
                file_path.seek(0)  # Reset position
                mime = magic.from_buffer(header, mime=True)
                extension = ""
            
            # Map mime type and extension to file type
            if mime.startswith('text/plain') or any(extension in self.config["supported_extensions"]["text"]):
                return FileType.TEXT
            if mime == 'application/pdf' or extension == '.pdf':
                return FileType.PDF
            if mime.startswith('image/') or any(extension in self.config["supported_extensions"]["image"]):
                return FileType.IMAGE
            if mime.startswith('application/vnd.openxmlformats-officedocument.wordprocessingml') or \
               any(extension in self.config["supported_extensions"]["word"]):
                return FileType.WORD
            if mime.startswith('application/vnd.openxmlformats-officedocument.spreadsheetml') or \
               any(extension in self.config["supported_extensions"]["excel"]):
                return FileType.EXCEL
            if mime.startswith('text/html') or any(extension in self.config["supported_extensions"]["html"]):
                return FileType.HTML
            if any(extension in self.config["supported_extensions"]["code"]):
                return FileType.CODE
            
            return FileType.UNKNOWN
        except Exception as e:
            logging.error(f"Error detecting file type: {str(e)}")
            return FileType.UNKNOWN

    def _validate_file(self, file_path: Union[Path, BinaryIO]) -> None:
        """
        Validate file size and type.

        Args:
            file_path: Path to the file or file-like object.

        Raises:
            FileNotFoundError: If the file doesn't exist.
            ValueError: If the file size exceeds the maximum allowed size.
        """
        if isinstance(file_path, Path):
            # Check if file exists
            if not file_path.exists():
                raise FileNotFoundError(f"File not found: {file_path}")
            
            # Check file size
            file_size_mb = os.path.getsize(file_path) / (1024 * 1024)
            if file_size_mb > self.config["max_file_size_mb"]:
                raise ValueError(
                    f"File size ({file_size_mb:.2f}MB) exceeds maximum allowed size "
                    f"({self.config['max_file_size_mb']}MB)"
                )

    async def _extract_content(
        self,
        file_path: Union[Path, BinaryIO],
        file_type: str
    ) -> Union[str, List[str]]:
        """
        Extract content from file based on its type.

        Args:
            file_path: Path to the file or file-like object.
            file_type: Type of the file.

        Returns:
            Extracted content as string or list of strings.

        Raises:
            ValueError: If the file type is unsupported.
        """
        try:
            if file_type in (FileType.TEXT, FileType.CODE):
                return await self._extract_text(file_path)
            if file_type == FileType.PDF:
                return await self._extract_pdf(file_path)
            if file_type == FileType.IMAGE:
                return await self._extract_image(file_path)
            if file_type == FileType.WORD:
                return await self._extract_word(file_path)
            if file_type == FileType.EXCEL:
                return await self._extract_excel(file_path)
            if file_type == FileType.HTML:
                return await self._extract_html(file_path)
            
            raise ValueError(f"Unsupported file type: {file_type}")
        except Exception as e:
            logging.error(f"Error extracting content: {str(e)}")
            raise

    async def _extract_text(self, file_path: Union[Path, BinaryIO]) -> str:
        """
        Extract content from text files.

        Args:
            file_path: Path to the file or file-like object.

        Returns:
            Extracted text content.

        Raises:
            UnicodeDecodeError: If the file encoding cannot be determined.
        """
        try:
            if isinstance(file_path, Path):
                with open(file_path, 'r', encoding='utf-8') as f:
                    return f.read()
            return file_path.read().decode('utf-8')
        except UnicodeDecodeError:
            # Try different encodings
            encodings = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
            for encoding in encodings:
                try:
                    if isinstance(file_path, Path):
                        with open(file_path, 'r', encoding=encoding) as f:
                            return f.read()
                    file_path.seek(0)
                    return file_path.read().decode(encoding)
                except UnicodeDecodeError:
                    continue
            raise

    async def _extract_pdf(self, file_path: Union[Path, BinaryIO]) -> str:
        """
        Extract content from PDF files.

        Args:
            file_path: Path to the file or file-like object.

        Returns:
            Extracted text content.
        """
        try:
            if isinstance(file_path, Path):
                pdf_file = open(file_path, 'rb')
            else:
                pdf_file = file_path
            
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            text = []
            
            # Extract text from each page
            for page_num in range(min(len(pdf_reader.pages), self.config["extraction"]["max_pages"])):
                page = pdf_reader.pages[page_num]
                text.append(page.extract_text())
            
            if isinstance(file_path, Path):
                pdf_file.close()
            
            return "\n\n".join(text)
        except Exception as e:
            logging.error(f"Error extracting PDF content: {str(e)}")
            raise

    async def _extract_image(self, file_path: Union[Path, BinaryIO]) -> str:
        """
        Extract text from images using OCR.

        Args:
            file_path: Path to the file or file-like object.

        Returns:
            Extracted text content.

        Raises:
            ValueError: If OCR is not enabled or Tesseract is not available.
        """
        if not self.config["ocr"]["enabled"]:
            raise ValueError("OCR is not enabled or Tesseract is not available")
        
        try:
            # Open image
            image = Image.open(file_path)
            
            # Perform OCR
            text = pytesseract.image_to_string(
                image,
                lang=self.config["ocr"]["language"],
                config=f'--psm {self.config["ocr"]["psm"]}'
            )
            
            return text.strip()
        except Exception as e:
            logging.error(f"Error extracting image content: {str(e)}")
            raise

    async def _extract_word(self, file_path: Union[Path, BinaryIO]) -> str:
        """
        Extract content from Word documents.

        Args:
            file_path: Path to the file or file-like object.

        Returns:
            Extracted text content.
        """
        try:
            doc = Document(file_path)
            return "\n".join(paragraph.text for paragraph in doc.paragraphs)
        except Exception as e:
            logging.error(f"Error extracting Word document content: {str(e)}")
            raise

    async def _extract_excel(self, file_path: Union[Path, BinaryIO]) -> str:
        """
        Extract content from Excel files.

        Args:
            file_path: Path to the file or file-like object.

        Returns:
            Extracted text content.
        """
        try:
            df = pd.read_excel(file_path) if str(file_path).endswith(('.xls', '.xlsx')) else pd.read_csv(file_path)
            return df.to_string()
        except Exception as e:
            logging.error(f"Error extracting Excel content: {str(e)}")
            raise

    async def _extract_html(self, file_path: Union[Path, BinaryIO]) -> str:
        """
        Extract content from HTML files.

        Args:
            file_path: Path to the file or file-like object.

        Returns:
            Extracted text content.
        """
        try:
            if isinstance(file_path, Path):
                with open(file_path, 'r', encoding='utf-8') as f:
                    html_content = f.read()
            else:
                html_content = file_path.read().decode('utf-8')
            
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # Remove script and style elements
            for script in soup(["script", "style"]):
                script.decompose()
            
            # Get text
            text = soup.get_text()
            
            # Break into lines and remove leading and trailing space on each
            lines = (line.strip() for line in text.splitlines())
            
            # Break multi-headlines into a line each
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            
            # Drop blank lines
            return '\n'.join(chunk for chunk in chunks if chunk)
        except Exception as e:
            logging.error(f"Error extracting HTML content: {str(e)}")
            raise

    async def _process_content(self, content: Union[str, List[str]], file_type: str) -> str:
        """
        Process and clean extracted content.

        Args:
            content: Raw content as string or list of strings.
            file_type: Type of the file.

        Returns:
            Processed and cleaned content.
        """
        if isinstance(content, list):
            content = '\n'.join(content)
        
        # Remove excessive whitespace
        content = re.sub(r'\s+', ' ', content)
        
        # Remove special characters if needed
        content = re.sub(r'[^\w\s.,!?-]', '', content)
        
        return content.strip()

    def _get_extraction_method(self, file_type: str) -> str:
        """
        Get the method used for content extraction.

        Args:
            file_type: Type of the file.

        Returns:
            String indicating the extraction method used.
        """
        methods = {
            FileType.TEXT: "direct_text_reading",
            FileType.PDF: "pdf_extraction",
            FileType.IMAGE: "ocr",
            FileType.WORD: "docx_parsing",
            FileType.EXCEL: "pandas_reading",
            FileType.HTML: "html_parsing",
            FileType.CODE: "direct_text_reading"
        }
        return methods.get(file_type, "unknown") 