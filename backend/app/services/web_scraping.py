import asyncio
import aiohttp
from bs4 import BeautifulSoup
from urllib.parse import urlparse
from typing import Dict, Any, Optional
import re
from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)

class WebScrapingService:
    def __init__(self):
        self.session = None
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }

    async def __aenter__(self):
        self.session = aiohttp.ClientSession(headers=self.headers)
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    async def extract_content_from_url(self, url: str) -> Dict[str, Any]:
        """
        Extract content from various types of URLs including Google Docs, public documents, and webpages.
        
        Args:
            url: The URL to extract content from
            
        Returns:
            Dictionary containing extracted content, title, and metadata
        """
        try:
            parsed_url = urlparse(url)
            
            # Determine content type and extraction method
            if 'docs.google.com' in parsed_url.netloc:
                return await self._extract_google_docs_content(url)
            elif self._is_document_url(url):
                return await self._extract_document_content(url)
            else:
                return await self._extract_webpage_content(url)
                
        except Exception as e:
            logger.error(f"Error extracting content from {url}: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Failed to extract content: {str(e)}")

    def _is_document_url(self, url: str) -> bool:
        """Check if URL points to a document file."""
        document_extensions = ['.pdf', '.doc', '.docx', '.txt', '.rtf']
        return any(url.lower().endswith(ext) for ext in document_extensions)

    async def _extract_google_docs_content(self, url: str) -> Dict[str, Any]:
        """
        Extract content from Google Docs URLs.
        Note: This requires the document to be publicly accessible or shared.
        """
        try:
            if self.session is None:
                raise HTTPException(status_code=500, detail="Session not initialized")
                
            # Convert Google Docs URL to export format
            if '/document/d/' in url:
                doc_id = re.search(r'/document/d/([a-zA-Z0-9-_]+)', url)
                if doc_id:
                    export_url = f"https://docs.google.com/document/d/{doc_id.group(1)}/export?format=txt"
                    
                    async with self.session.get(export_url) as response:
                        if response.status == 200:
                            content = await response.text()
                            return {
                                'title': 'Google Document',
                                'content': content,
                                'type': 'google-docs',
                                'url': url,
                                'extracted_at': asyncio.get_event_loop().time()
                            }
                        else:
                            raise HTTPException(status_code=403, detail="Google Doc is not publicly accessible")
            
            raise HTTPException(status_code=400, detail="Invalid Google Docs URL")
            
        except Exception as e:
            logger.error(f"Error extracting Google Docs content: {str(e)}")
            raise HTTPException(status_code=400, detail="Failed to extract Google Docs content")

    async def _extract_document_content(self, url: str) -> Dict[str, Any]:
        """
        Extract content from document files (PDF, DOC, DOCX, TXT).
        Note: This is a simplified implementation. In production, you'd use proper document parsing libraries.
        """
        try:
            if self.session is None:
                raise HTTPException(status_code=500, detail="Session not initialized")
                
            async with self.session.get(url) as response:
                if response.status == 200:
                    content_type = response.headers.get('content-type', '')
                    
                    if 'text/plain' in content_type or url.endswith('.txt'):
                        content = await response.text()
                    elif 'application/pdf' in content_type or url.endswith('.pdf'):
                        # For PDFs, you'd use a library like PyPDF2 or pdfplumber
                        content = f"[PDF Content from {url} - Requires PDF parsing library]"
                    elif 'application/msword' in content_type or url.endswith(('.doc', '.docx')):
                        # For Word documents, you'd use a library like python-docx
                        content = f"[Word Document from {url} - Requires DOC parsing library]"
                    else:
                        content = await response.text()
                    
                    filename = url.split('/')[-1]
                    return {
                        'title': filename,
                        'content': content,
                        'type': 'document',
                        'url': url,
                        'extracted_at': asyncio.get_event_loop().time()
                    }
                else:
                    raise HTTPException(status_code=response.status, detail="Failed to access document")
                    
        except Exception as e:
            logger.error(f"Error extracting document content: {str(e)}")
            raise HTTPException(status_code=400, detail="Failed to extract document content")

    async def _extract_webpage_content(self, url: str) -> Dict[str, Any]:
        """
        Extract readable content from webpages.
        """
        try:
            if self.session is None:
                raise HTTPException(status_code=500, detail="Session not initialized")
                
            async with self.session.get(url) as response:
                if response.status == 200:
                    html_content = await response.text()
                    soup = BeautifulSoup(html_content, 'html.parser')
                    
                    # Remove script and style elements
                    for script in soup(["script", "style"]):
                        script.decompose()
                    
                    # Extract title
                    title = soup.find('title')
                    title_text = title.get_text().strip() if title else urlparse(url).netloc
                    
                    # Extract main content
                    # Try to find main content areas
                    main_content = None
                    
                    # Look for common content containers
                    for selector in ['main', 'article', '.content', '#content', '.post', '.entry']:
                        main_content = soup.select_one(selector)
                        if main_content:
                            break
                    
                    # If no main content found, use body
                    if not main_content:
                        main_content = soup.find('body')
                    
                    if main_content:
                        # Extract text content
                        text_content = main_content.get_text()
                        
                        # Clean up the text
                        lines = (line.strip() for line in text_content.splitlines())
                        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
                        text_content = ' '.join(chunk for chunk in chunks if chunk)
                        
                        return {
                            'title': title_text,
                            'content': text_content,
                            'type': 'webpage',
                            'url': url,
                            'extracted_at': asyncio.get_event_loop().time()
                        }
                    else:
                        raise HTTPException(status_code=400, detail="No readable content found on webpage")
                else:
                    raise HTTPException(status_code=response.status, detail="Failed to access webpage")
                    
        except Exception as e:
            logger.error(f"Error extracting webpage content: {str(e)}")
            raise HTTPException(status_code=400, detail="Failed to extract webpage content")

    async def validate_url(self, url: str) -> Dict[str, Any]:
        """
        Validate if a URL is accessible and extract basic metadata.
        """
        try:
            if self.session is None:
                raise HTTPException(status_code=500, detail="Session not initialized")
                
            parsed_url = urlparse(url)
            if not parsed_url.scheme or not parsed_url.netloc:
                return {'valid': False, 'error': 'Invalid URL format'}
            
            async with self.session.head(url) as response:
                if response.status == 200:
                    content_type = response.headers.get('content-type', '')
                    return {
                        'valid': True,
                        'content_type': content_type,
                        'url_type': self._get_url_type(url),
                        'accessible': True
                    }
                else:
                    return {
                        'valid': True,
                        'accessible': False,
                        'error': f'HTTP {response.status}'
                    }
                    
        except Exception as e:
            return {
                'valid': False,
                'error': str(e)
            }

    def _get_url_type(self, url: str) -> str:
        """Determine the type of URL."""
        if 'docs.google.com' in url:
            return 'google-docs'
        elif self._is_document_url(url):
            return 'document'
        else:
            return 'webpage' 