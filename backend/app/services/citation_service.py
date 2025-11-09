from __future__ import annotations

from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.citation import Citation
from fastapi import HTTPException
from datetime import datetime
import re
import requests
from urllib.parse import urlparse


class CitationService:
    def __init__(self, db: Session):
        self.db = db

    async def create_citation(
        self,
        user: User,
        citation_data: Dict[str, Any]
    ) -> Citation:
        """Create a new citation"""
        # Validate citation data
        self._validate_citation_data(citation_data)
        
        # Generate formatted citations
        formatted_citations = self._generate_formatted_citations(citation_data)
        
        citation = Citation(
            user_id=user.id,
            title=citation_data.get('title', ''),
            authors=citation_data.get('authors', ''),
            year=citation_data.get('year', ''),
            journal=citation_data.get('journal', ''),
            volume=citation_data.get('volume', ''),
            issue=citation_data.get('issue', ''),
            pages=citation_data.get('pages', ''),
            url=citation_data.get('url', ''),
            doi=citation_data.get('doi', ''),
            publisher=citation_data.get('publisher', ''),
            location=citation_data.get('location', ''),
            citation_type=citation_data.get('type', 'journal'),
            formatted_citations=formatted_citations,
            notes=citation_data.get('notes', ''),
            tags=citation_data.get('tags') or []
        )
        
        self.db.add(citation)
        self.db.commit()
        self.db.refresh(citation)
        return citation

    async def get_citation(self, citation_id: int, user: User) -> Citation:
        """Get a citation by ID"""
        citation = self.db.query(Citation).filter(
            Citation.id == citation_id,
            Citation.user_id == user.id
        ).first()
        
        if not citation:
            raise HTTPException(status_code=404, detail="Citation not found")
        
        return citation

    async def list_citations(
        self,
        user: User,
        citation_type: Optional[str] = None,
        tags: Optional[List[str]] = None,
        search: Optional[str] = None
    ) -> List[Citation]:
        """List user's citations with optional filtering"""
        query = self.db.query(Citation).filter(Citation.user_id == user.id)
        
        if citation_type:
            query = query.filter(Citation.citation_type == citation_type)
        
        if tags:
            for tag in tags:
                query = query.filter(Citation.tags.contains([tag]))
        
        if search:
            search_filter = f"%{search}%"
            query = query.filter(
                (Citation.title.ilike(search_filter)) |
                (Citation.authors.ilike(search_filter)) |
                (Citation.journal.ilike(search_filter))
            )
        
        return query.order_by(Citation.created_at.desc()).all()

    async def update_citation(
        self,
        user: User,
        citation_id: int,
        updates: Dict[str, Any]
    ) -> Citation:
        """Update a citation"""
        citation = await self.get_citation(citation_id, user)
        
        # Validate updates
        if any(field in updates for field in ['title', 'authors', 'year']):
            try:
                self._validate_citation_data(updates)
            except HTTPException as exc:
                detail_msg = str(exc.detail).lower() if isinstance(exc.detail, str) else str(exc.detail)
                if exc.status_code == 400 and "is required" in detail_msg:
                    normalized_updates = dict(updates)
                    for required_field in ['title', 'authors']:
                        if required_field not in normalized_updates:
                            normalized_updates[required_field] = getattr(citation, required_field)
                    self._validate_citation_data(normalized_updates)
                else:
                    raise
        
        # Update fields
        for field, value in updates.items():
            if hasattr(citation, field):
                setattr(citation, field, value)
        
        # Regenerate formatted citations if content changed
        if any(field in updates for field in ['title', 'authors', 'year', 'journal', 'volume', 'issue', 'pages', 'url', 'doi']):
            citation_data = {
                'title': citation.title,
                'authors': citation.authors,
                'year': citation.year,
                'journal': citation.journal,
                'volume': citation.volume,
                'issue': citation.issue,
                'pages': citation.pages,
                'url': citation.url,
                'doi': citation.doi,
                'publisher': citation.publisher,
                'location': citation.location,
                'type': citation.citation_type
            }
            citation.formatted_citations = self._generate_formatted_citations(citation_data)
        
        citation.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(citation)
        return citation

    async def delete_citation(self, user: User, citation_id: int) -> None:
        """Delete a citation"""
        citation = await self.get_citation(citation_id, user)
        self.db.delete(citation)
        self.db.commit()

    async def generate_citations_batch(
        self,
        user: User,
        citations_data: List[Dict[str, Any]],
        format_type: str = 'APA'
    ) -> List[Dict[str, Any]]:
        """Generate formatted citations for multiple sources"""
        results = []
        
        for citation_data in citations_data:
            try:
                # Validate citation data
                self._validate_citation_data(citation_data)
                
                # Generate formatted citation
                formatted = self._generate_formatted_citations(citation_data)
                
                results.append({
                    'data': citation_data,
                    'formatted': formatted.get(format_type, ''),
                    'valid': True
                })
            except HTTPException as exc:
                results.append({
                    'data': citation_data,
                    'formatted': '',
                    'valid': False,
                    'error': exc.detail if isinstance(exc.detail, str) else str(exc.detail)
                })
            except Exception as exc:
                results.append({
                    'data': citation_data,
                    'formatted': '',
                    'valid': False,
                    'error': str(exc)
                })
        
        return results

    async def extract_citation_from_url(self, url: str) -> Dict[str, Any]:
        """Extract citation information from a URL (for websites, papers, etc.)"""
        try:
            # Basic URL validation
            parsed_url = urlparse(url)
            if not parsed_url.scheme or not parsed_url.netloc:
                raise ValueError("Invalid URL format")
            
            # For now, return basic structure - in production, you might use
            # web scraping or APIs to extract metadata
            return {
                'type': 'website',
                'title': f"Webpage from {parsed_url.netloc}",
                'url': url,
                'year': str(datetime.now().year),
                'authors': 'Unknown',
                'publisher': parsed_url.netloc
            }
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Failed to extract citation: {str(exc)}")

    async def validate_doi(self, doi: str) -> Dict[str, Any]:
        """Validate and fetch metadata for a DOI"""
        try:
            # Use CrossRef API to validate DOI
            response = requests.get(f"https://api.crossref.org/works/{doi}")
            
            if response.status_code == 200:
                data = response.json()
                work = data['message']
                
                return {
                    'valid': True,
                    'title': work.get('title', [''])[0] if work.get('title') else '',
                    'authors': ', '.join([author.get('given', '') + ' ' + author.get('family', '') 
                                        for author in work.get('author', [])]),
                    'year': work.get('published-print', {}).get('date-parts', [[]])[0][0] if work.get('published-print') else '',
                    'journal': work.get('container-title', [''])[0] if work.get('container-title') else '',
                    'volume': work.get('volume', ''),
                    'issue': work.get('issue', ''),
                    'pages': work.get('page', ''),
                    'doi': doi,
                    'url': f"https://doi.org/{doi}"
                }
            else:
                return {'valid': False, 'error': 'DOI not found'}
                
        except Exception as exc:
            return {'valid': False, 'error': str(exc)}

    def _validate_citation_data(self, data: Dict[str, Any]) -> None:
        """Validate citation data"""
        required_fields = ['title', 'authors']
        
        for field in required_fields:
            if field not in data:
                raise HTTPException(status_code=400, detail=f"{field} is required")
            value = data.get(field)
            if value is None:
                raise HTTPException(status_code=400, detail=f"{field} is required")
            if isinstance(value, str) and not value.strip():
                raise HTTPException(status_code=400, detail=f"{field} is required")
        
        # Validate year format
        if 'year' in data and data.get('year'):
            year = str(data['year'])
            if not re.match(r'^\d{4}$', year):
                raise HTTPException(status_code=400, detail="Year must be a 4-digit number")
            
            current_year = datetime.now().year
            if int(year) > current_year:
                raise HTTPException(status_code=400, detail="Year cannot be in the future")
        
        # Validate DOI format
        if 'doi' in data and data.get('doi'):
            doi_pattern = r'^10\.\d{4,9}\/[-._;()/:A-Z0-9]+$'
            if not re.match(doi_pattern, data['doi'], re.IGNORECASE):
                raise HTTPException(status_code=400, detail="Invalid DOI format")
        
        # Validate URL format
        if 'url' in data and data.get('url'):
            try:
                parsed = urlparse(data['url'])
                if not parsed.scheme or not parsed.netloc:
                    raise ValueError()
            except Exception as exc:
                raise HTTPException(status_code=400, detail="Invalid URL format") from exc

    def _generate_formatted_citations(self, data: Dict[str, Any]) -> Dict[str, str]:
        """Generate citations in multiple formats"""
        citations = {}
        
        # APA Format
        citations['APA'] = self._generate_apa_citation(data)
        
        # MLA Format
        citations['MLA'] = self._generate_mla_citation(data)
        
        # Chicago Format
        citations['Chicago'] = self._generate_chicago_citation(data)
        
        # Harvard Format
        citations['Harvard'] = self._generate_harvard_citation(data)
        
        return citations

    def _generate_apa_citation(self, data: Dict[str, Any]) -> str:
        """Generate APA format citation"""
        authors = data.get('authors', '')
        year = data.get('year', '')
        title = data.get('title', '')
        journal = data.get('journal', '')
        volume = data.get('volume', '')
        issue = data.get('issue', '')
        pages = data.get('pages', '')
        doi = data.get('doi', '')
        url = data.get('url', '')
        
        citation = f"{authors} ({year}). {title}."
        
        if journal:
            citation += f" {journal}"
            if volume:
                citation += f", {volume}"
            if issue:
                citation += f"({issue})"
            if pages:
                citation += f", {pages}"
            citation += "."
        
        if doi:
            citation += f" https://doi.org/{doi}"
        elif url:
            citation += f" {url}"
        
        return citation

    def _generate_mla_citation(self, data: Dict[str, Any]) -> str:
        """Generate MLA format citation"""
        authors = data.get('authors', '')
        title = data.get('title', '')
        journal = data.get('journal', '')
        volume = data.get('volume', '')
        issue = data.get('issue', '')
        year = data.get('year', '')
        pages = data.get('pages', '')
        url = data.get('url', '')
        
        citation = f"{authors}. \"{title}.\" "
        
        if journal:
            citation += f"{journal}"
            if volume:
                citation += f", vol. {volume}"
            if issue:
                citation += f", no. {issue}"
            citation += f", {year}"
            if pages:
                citation += f", pp. {pages}"
            citation += "."
        
        if url:
            citation += f" {url}"
        
        return citation

    def _generate_chicago_citation(self, data: Dict[str, Any]) -> str:
        """Generate Chicago format citation"""
        authors = data.get('authors', '')
        title = data.get('title', '')
        journal = data.get('journal', '')
        volume = data.get('volume', '')
        issue = data.get('issue', '')
        year = data.get('year', '')
        pages = data.get('pages', '')
        doi = data.get('doi', '')
        url = data.get('url', '')
        
        citation = f"{authors}. \"{title}.\" "
        
        if journal:
            citation += f"{journal}"
            if volume:
                citation += f" {volume}"
            if issue:
                citation += f", no. {issue}"
            citation += f" ({year})"
            if pages:
                citation += f": {pages}"
            citation += "."
        
        if doi:
            citation += f" https://doi.org/{doi}"
        elif url:
            citation += f" {url}"
        
        return citation

    def _generate_harvard_citation(self, data: Dict[str, Any]) -> str:
        """Generate Harvard format citation"""
        authors = data.get('authors', '')
        year = data.get('year', '')
        title = data.get('title', '')
        journal = data.get('journal', '')
        volume = data.get('volume', '')
        issue = data.get('issue', '')
        pages = data.get('pages', '')
        doi = data.get('doi', '')
        url = data.get('url', '')
        
        citation = f"{authors} ({year}) '{title}', "
        
        if journal:
            citation += f"{journal}"
            if volume:
                citation += f", {volume}"
            if issue:
                citation += f"({issue})"
            if pages:
                citation += f", pp. {pages}"
            citation += "."
        
        if doi:
            citation += f" Available at: https://doi.org/{doi}"
        elif url:
            citation += f" Available at: {url}"
        
        return citation 