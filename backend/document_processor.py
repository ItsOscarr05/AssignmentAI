import requests
import PyPDF2
import io
import docx
import bs4
from typing import Optional, Tuple
from urllib.parse import urlparse

class DocumentProcessor:
    @staticmethod
    def validate_url(url: str) -> bool:
        try:
            result = urlparse(url)
            return all([result.scheme, result.netloc])
        except:
            return False

    @staticmethod
    def fetch_content(url: str) -> Tuple[str, str, Optional[str]]:
        """
        Fetches content from URL and determines its type.
        Returns: (content_type, content, error_message)
        """
        try:
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            
            content_type = response.headers.get('content-type', '').lower()
            
            if 'pdf' in content_type:
                return DocumentProcessor._process_pdf(response.content)
            elif 'word' in content_type or 'docx' in content_type:
                return DocumentProcessor._process_docx(response.content)
            elif 'text' in content_type or 'html' in content_type:
                return DocumentProcessor._process_webpage(response.content, content_type)
            else:
                return 'unknown', '', f'Unsupported content type: {content_type}'
                
        except requests.RequestException as e:
            return 'error', '', f'Failed to fetch document: {str(e)}'
        except Exception as e:
            return 'error', '', f'Error processing document: {str(e)}'

    @staticmethod
    def _process_pdf(content: bytes) -> Tuple[str, str, Optional[str]]:
        try:
            pdf_file = io.BytesIO(content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            text = ''
            for page in pdf_reader.pages:
                text += page.extract_text() + '\n'
            return 'pdf', text, None
        except Exception as e:
            return 'error', '', f'Error processing PDF: {str(e)}'

    @staticmethod
    def _process_docx(content: bytes) -> Tuple[str, str, Optional[str]]:
        try:
            doc = docx.Document(io.BytesIO(content))
            text = '\n'.join([paragraph.text for paragraph in doc.paragraphs])
            return 'doc', text, None
        except Exception as e:
            return 'error', '', f'Error processing DOCX: {str(e)}'

    @staticmethod
    def _process_webpage(content: bytes, content_type: str) -> Tuple[str, str, Optional[str]]:
        try:
            if 'html' in content_type:
                soup = bs4.BeautifulSoup(content, 'html.parser')
                # Remove script and style elements
                for script in soup(["script", "style"]):
                    script.decompose()
                text = soup.get_text(separator='\n', strip=True)
            else:
                text = content.decode('utf-8')
            return 'text', text, None
        except Exception as e:
            return 'error', '', f'Error processing webpage: {str(e)}'