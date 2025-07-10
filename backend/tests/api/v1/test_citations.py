import pytest
from fastapi import status
from unittest.mock import patch, MagicMock, AsyncMock
from app.models.citation import Citation
from app.models.user import User
from datetime import datetime

def test_create_citation_success(client, test_user, test_token):
    """Test successful citation creation"""
    mock_citation = {
        "id": 1,
        "title": "Test Research Paper",
        "authors": "John Doe",
        "year": "2023",
        "journal": "Test Journal",
        "volume": "1",
        "issue": "1",
        "pages": "1-10",
        "url": "http://example.com",
        "doi": "10.1234/test.2023.001",
        "publisher": "Test Publisher",
        "location": "Test Location",
        "citation_type": "journal",
        "formatted_citations": {"APA": "APA format"},
        "notes": "Test notes",
        "tags": ["tag1"],
        "created_at": "2023-01-01T00:00:00",
        "updated_at": "2023-01-01T00:00:00"
    }
    
    with patch('app.api.v1.endpoints.citations.CitationService') as MockService:
        mock_service = MockService.return_value
        mock_service.create_citation = AsyncMock(return_value=mock_citation)
        
        response = client.post(
            "/api/v1/citations/",
            json={
                "title": "Test Research Paper",
                "authors": "John Doe",
                "year": "2023",
                "journal": "Test Journal"
            },
            headers={"Authorization": f"Bearer {test_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Test Research Paper"
        assert isinstance(data["created_at"], str)
        assert isinstance(data["updated_at"], str)

def test_get_citation_success(client, test_user, test_token):
    """Test successful citation retrieval"""
    mock_citation = {
        "id": 1,
        "title": "Test Research Paper",
        "authors": "John Doe",
        "year": "2023",
        "journal": "Test Journal",
        "volume": "1",
        "issue": "1",
        "pages": "1-10",
        "url": "http://example.com",
        "doi": "10.1234/test.2023.001",
        "publisher": "Test Publisher",
        "location": "Test Location",
        "citation_type": "journal",
        "formatted_citations": {"APA": "APA format"},
        "notes": "Test notes",
        "tags": ["tag1"],
        "created_at": "2023-01-01T00:00:00",
        "updated_at": "2023-01-01T00:00:00"
    }
    
    with patch('app.api.v1.endpoints.citations.CitationService') as MockService:
        mock_service = MockService.return_value
        mock_service.get_citation = AsyncMock(return_value=mock_citation)
        
        response = client.get("/api/v1/citations/1", headers={"Authorization": f"Bearer {test_token}"})
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Test Research Paper"
        assert isinstance(data["created_at"], str)
        assert isinstance(data["updated_at"], str)

def test_list_citations_with_tags(client, test_user, test_token):
    """Test listing citations with tag filter"""
    mock_citations = [
        {
            "id": 1,
            "title": "Test Research Paper",
            "authors": "John Doe",
            "year": "2023",
            "journal": "Test Journal",
            "volume": "1",
            "issue": "1",
            "pages": "1-10",
            "url": "http://example.com",
            "doi": "10.1234/test.2023.001",
            "publisher": "Test Publisher",
            "location": "Test Location",
            "citation_type": "journal",
            "formatted_citations": {"APA": "APA format"},
            "notes": "Test notes",
            "tags": ["tag1"],
            "created_at": "2023-01-01T00:00:00",
            "updated_at": "2023-01-01T00:00:00"
        }
    ]
    
    with patch('app.api.v1.endpoints.citations.CitationService') as MockService:
        mock_service = MockService.return_value
        mock_service.list_citations = AsyncMock(return_value=mock_citations)
        
        response = client.get("/api/v1/citations/?tags=tag1", headers={"Authorization": f"Bearer {test_token}"})
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["title"] == "Test Research Paper"
        assert isinstance(data[0]["created_at"], str)
        assert isinstance(data[0]["updated_at"], str)

def test_update_citation_success(client, test_user, test_token):
    """Test successful citation update"""
    mock_citation = {
        "id": 1,
        "title": "Updated Research Paper",
        "authors": "John Doe",
        "year": "2024",
        "journal": "Updated Journal",
        "volume": "2",
        "issue": "2",
        "pages": "11-20",
        "url": "http://example.com",
        "doi": "10.1234/test.2024.001",
        "publisher": "Updated Publisher",
        "location": "Updated Location",
        "citation_type": "journal",
        "formatted_citations": {"APA": "Updated APA format"},
        "notes": "Updated notes",
        "tags": ["updated_tag"],
        "created_at": "2023-01-01T00:00:00",
        "updated_at": "2024-01-01T00:00:00"
    }
    
    with patch('app.api.v1.endpoints.citations.CitationService') as MockService:
        mock_service = MockService.return_value
        mock_service.update_citation = AsyncMock(return_value=mock_citation)
        
        response = client.put(
            "/api/v1/citations/1",
            json={"title": "Updated Research Paper", "year": "2024"},
            headers={"Authorization": f"Bearer {test_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Research Paper"
        assert isinstance(data["created_at"], str)
        assert isinstance(data["updated_at"], str)

def test_delete_citation_success(client, test_user, test_token):
    """Test successful citation deletion"""
    with patch('app.api.v1.endpoints.citations.CitationService') as mock_service_class:
        mock_service = AsyncMock()
        mock_service.delete_citation.return_value = None
        mock_service_class.return_value = mock_service
        
        response = client.delete(
            "/api/v1/citations/1",
            headers={"Authorization": f"Bearer {test_token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["message"] == "Citation deleted successfully"

def test_generate_citations_batch_success(client, test_user, test_token):
    """Test successful batch citation generation"""
    citations_data = [
        {
            "title": "First Research Paper",
            "authors": "John Doe",
            "year": "2023",
            "type": "journal"
        },
        {
            "title": "Second Research Paper",
            "authors": "Jane Smith",
            "year": "2024",
            "type": "journal"
        }
    ]
    
    mock_result = {
        "formatted_citations": {
            "APA": [
                "Doe, J. (2023). First Research Paper.",
                "Smith, J. (2024). Second Research Paper."
            ],
            "MLA": [
                "Doe, J. \"First Research Paper.\"",
                "Smith, J. \"Second Research Paper.\""
            ]
        }
    }
    
    with patch('app.api.v1.endpoints.citations.CitationService') as mock_service_class:
        mock_service = AsyncMock()
        mock_service.generate_citations_batch.return_value = mock_result
        mock_service_class.return_value = mock_service
        
        response = client.post(
            "/api/v1/citations/batch?format_type=APA",
            json=citations_data,
            headers={"Authorization": f"Bearer {test_token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "formatted_citations" in data

def test_extract_citation_from_url_success(client, test_user, test_token):
    """Test successful citation extraction from URL"""
    mock_result = {
        "title": "Extracted Research Paper",
        "authors": "John Doe",
        "year": "2023",
        "journal": "Journal of Testing",
        "doi": "10.1234/test.2023.001"
    }
    
    with patch('app.api.v1.endpoints.citations.CitationService') as mock_service_class:
        mock_service = AsyncMock()
        mock_service.extract_citation_from_url.return_value = mock_result
        mock_service_class.return_value = mock_service
        
        response = client.post(
            "/api/v1/citations/extract-from-url?url=https://example.com/paper",
            headers={"Authorization": f"Bearer {test_token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["title"] == "Extracted Research Paper"

def test_validate_doi_success(client, test_user, test_token):
    """Test successful DOI validation"""
    mock_response = {
        "doi": "10.1234/test.2023.001",
        "valid": True,
        "title": "Valid Research Paper",
        "authors": "John Doe",
        "year": "2023",
        "metadata": {}
    }
    
    with patch('app.api.v1.endpoints.citations.CitationService') as MockService:
        mock_service = MockService.return_value
        mock_service.validate_doi = AsyncMock(return_value=mock_response)
        
        response = client.get(
            "/api/v1/citations/validate-doi/10.1234/test.2023.001",
            headers={"Authorization": f"Bearer {test_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["doi"] == "10.1234/test.2023.001"
        assert data["valid"] is True

def test_get_citation_formats_success(client, test_user, test_token):
    """Test successful citation formats retrieval"""
    mock_citation = MagicMock()
    mock_citation.formatted_citations = {
        'APA': 'Doe, J., Smith, J. (2023). Test Research Paper.',
        'MLA': 'Doe, J., Smith, J. "Test Research Paper."',
        'Chicago': 'Doe, J., Smith, J. "Test Research Paper."',
        'Harvard': 'Doe, J., Smith, J. (2023) \'Test Research Paper\','
    }
    
    with patch('app.api.v1.endpoints.citations.CitationService') as mock_service_class:
        mock_service = AsyncMock()
        mock_service.get_citation.return_value = mock_citation
        mock_service_class.return_value = mock_service
        
        response = client.get(
            "/api/v1/citations/formats/1",
            headers={"Authorization": f"Bearer {test_token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "APA" in data
        assert "MLA" in data
        assert "Chicago" in data
        assert "Harvard" in data

def test_duplicate_citation_success(client, test_user, test_token):
    """Test successful citation duplication"""
    # Create a mock object with attributes instead of a dict
    original_citation = MagicMock()
    original_citation.title = "Original Research Paper"
    original_citation.authors = "Author Name"
    original_citation.year = "2023"
    original_citation.journal = "Journal Name"
    original_citation.volume = "1"
    original_citation.issue = "1"
    original_citation.pages = "1-10"
    original_citation.url = "http://example.com"
    original_citation.doi = "10.1234/test.2023.001"
    original_citation.publisher = "Test Publisher"
    original_citation.location = "Test Location"
    original_citation.citation_type = "journal"
    original_citation.formatted_citations = {"APA": "APA format"}
    original_citation.notes = "Test notes"
    original_citation.tags = ["tag1"]
    original_citation.created_at = "2023-01-01T00:00:00"
    original_citation.updated_at = "2023-01-01T00:00:00"
    
    duplicated_citation = {
        "id": 2,
        "title": "Original Research Paper",
        "authors": "Author Name",
        "year": "2023",
        "journal": "Journal Name",
        "volume": "1",
        "issue": "1",
        "pages": "1-10",
        "url": "http://example.com",
        "doi": "10.1234/test.2023.001",
        "publisher": "Test Publisher",
        "location": "Test Location",
        "citation_type": "journal",
        "formatted_citations": {"APA": "APA format"},
        "notes": "Test notes",
        "tags": ["tag1"],
        "created_at": "2023-01-01T00:00:00",
        "updated_at": "2023-01-01T00:00:00"
    }
    
    with patch('app.api.v1.endpoints.citations.CitationService') as MockService:
        mock_service = MockService.return_value
        mock_service.get_citation = AsyncMock(return_value=original_citation)
        mock_service.create_citation = AsyncMock(return_value=duplicated_citation)
        
        response = client.post("/api/v1/citations/1/duplicate", headers={"Authorization": f"Bearer {test_token}"})
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Original Research Paper"
        assert data["id"] == 2  # New ID for duplicated citation 