import pytest
from unittest.mock import Mock, patch, MagicMock, AsyncMock
from datetime import datetime
from fastapi import HTTPException
import requests

from app.services.citation_service import CitationService
from app.models.user import User
from app.models.citation import Citation


class TestCitationService:
    @pytest.fixture
    def mock_db(self):
        return Mock()

    @pytest.fixture
    def mock_user(self):
        user = Mock(spec=User)
        user.id = 1
        user.email = "test@example.com"
        return user

    @pytest.fixture
    def citation_service(self, mock_db):
        return CitationService(mock_db)

    @pytest.fixture
    def sample_citation_data(self):
        return {
            'title': 'Test Research Paper',
            'authors': 'John Doe, Jane Smith',
            'year': '2023',
            'journal': 'Journal of Testing',
            'volume': '15',
            'issue': '2',
            'pages': '123-145',
            'doi': '10.1234/test.2023.001',
            'url': 'https://example.com/paper',
            'publisher': 'Test Publisher',
            'location': 'Test City',
            'type': 'journal',
            'notes': 'Important research',
            'tags': ['research', 'testing']
        }

    @pytest.fixture
    def sample_citation(self, sample_citation_data):
        citation = Mock(spec=Citation)
        citation.id = 1
        citation.user_id = 1
        citation.title = sample_citation_data['title']
        citation.authors = sample_citation_data['authors']
        citation.year = sample_citation_data['year']
        citation.journal = sample_citation_data['journal']
        citation.volume = sample_citation_data['volume']
        citation.issue = sample_citation_data['issue']
        citation.pages = sample_citation_data['pages']
        citation.doi = sample_citation_data['doi']
        citation.url = sample_citation_data['url']
        citation.publisher = sample_citation_data['publisher']
        citation.location = sample_citation_data['location']
        citation.citation_type = sample_citation_data['type']
        citation.notes = sample_citation_data['notes']
        citation.tags = sample_citation_data['tags']
        citation.formatted_citations = {
            'APA': 'Doe, J., Smith, J. (2023). Test Research Paper.',
            'MLA': 'Doe, J., Smith, J. "Test Research Paper."',
            'Chicago': 'Doe, J., Smith, J. "Test Research Paper."',
            'Harvard': 'Doe, J., Smith, J. (2023) \'Test Research Paper\','
        }
        citation.created_at = datetime.utcnow()
        citation.updated_at = datetime.utcnow()
        return citation

    @pytest.mark.asyncio
    async def test_create_citation_success(self, citation_service, mock_user, sample_citation_data):
        """Test successful citation creation"""
        with patch.object(citation_service, '_validate_citation_data') as mock_validate, \
             patch.object(citation_service, '_generate_formatted_citations') as mock_generate:
            
            mock_generate.return_value = {
                'APA': 'Doe, J., Smith, J. (2023). Test Research Paper.',
                'MLA': 'Doe, J., Smith, J. "Test Research Paper."',
                'Chicago': 'Doe, J., Smith, J. "Test Research Paper."',
                'Harvard': 'Doe, J., Smith, J. (2023) \'Test Research Paper\','
            }
            
            result = await citation_service.create_citation(mock_user, sample_citation_data)
            
            mock_validate.assert_called_once_with(sample_citation_data)
            mock_generate.assert_called_once_with(sample_citation_data)
            citation_service.db.add.assert_called_once()
            citation_service.db.commit.assert_called_once()
            citation_service.db.refresh.assert_called_once()

    @pytest.mark.asyncio
    async def test_create_citation_validation_error(self, citation_service, mock_user, sample_citation_data):
        """Test citation creation with validation error"""
        with patch.object(citation_service, '_validate_citation_data', side_effect=HTTPException(status_code=400, detail="Title is required")):
            with pytest.raises(HTTPException) as exc_info:
                await citation_service.create_citation(mock_user, sample_citation_data)
            
            assert exc_info.value.status_code == 400
            assert "Title is required" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_get_citation_success(self, citation_service, mock_user, sample_citation):
        """Test successful citation retrieval"""
        citation_service.db.query.return_value.filter.return_value.first.return_value = sample_citation
        
        result = await citation_service.get_citation(1, mock_user)
        
        assert result == sample_citation
        citation_service.db.query.assert_called_once_with(Citation)

    @pytest.mark.asyncio
    async def test_get_citation_not_found(self, citation_service, mock_user):
        """Test citation retrieval when not found"""
        citation_service.db.query.return_value.filter.return_value.first.return_value = None
        
        with pytest.raises(HTTPException) as exc_info:
            await citation_service.get_citation(999, mock_user)
        
        assert exc_info.value.status_code == 404
        assert "Citation not found" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_list_citations_no_filters(self, citation_service, mock_user, sample_citation):
        """Test listing citations without filters"""
        mock_query = Mock()
        citation_service.db.query.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.order_by.return_value.all.return_value = [sample_citation]
        
        result = await citation_service.list_citations(mock_user)
        
        assert result == [sample_citation]
        citation_service.db.query.assert_called_once_with(Citation)

    @pytest.mark.asyncio
    async def test_list_citations_with_type_filter(self, citation_service, mock_user, sample_citation):
        """Test listing citations with type filter"""
        mock_query = Mock()
        citation_service.db.query.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.order_by.return_value.all.return_value = [sample_citation]
        
        result = await citation_service.list_citations(mock_user, citation_type='journal')
        
        assert result == [sample_citation]
        assert mock_query.filter.call_count >= 2  # user_id filter + type filter

    @pytest.mark.asyncio
    async def test_list_citations_with_tags_filter(self, citation_service, mock_user, sample_citation):
        """Test listing citations with tags filter"""
        mock_query = Mock()
        citation_service.db.query.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.order_by.return_value.all.return_value = [sample_citation]
        
        result = await citation_service.list_citations(mock_user, tags=['research'])
        
        assert result == [sample_citation]
        assert mock_query.filter.call_count >= 2  # user_id filter + tags filter

    @pytest.mark.asyncio
    async def test_list_citations_with_search_filter(self, citation_service, mock_user, sample_citation):
        """Test listing citations with search filter"""
        mock_query = Mock()
        citation_service.db.query.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.order_by.return_value.all.return_value = [sample_citation]
        
        result = await citation_service.list_citations(mock_user, search='research')
        
        assert result == [sample_citation]
        assert mock_query.filter.call_count >= 2  # user_id filter + search filter

    @pytest.mark.asyncio
    async def test_update_citation_success(self, citation_service, mock_user, sample_citation):
        """Test successful citation update"""
        with patch.object(citation_service, 'get_citation', return_value=sample_citation) as mock_get, \
             patch.object(citation_service, '_validate_citation_data') as mock_validate, \
             patch.object(citation_service, '_generate_formatted_citations') as mock_generate:
            
            mock_generate.return_value = {
                'APA': 'Updated citation format',
                'MLA': 'Updated citation format',
                'Chicago': 'Updated citation format',
                'Harvard': 'Updated citation format'
            }
            
            updates = {'title': 'Updated Title', 'year': '2024'}
            result = await citation_service.update_citation(mock_user, 1, updates)
            
            mock_get.assert_called_once_with(1, mock_user)
            mock_validate.assert_called_once_with(updates)
            assert sample_citation.title == 'Updated Title'
            assert sample_citation.year == '2024'
            citation_service.db.commit.assert_called_once()
            citation_service.db.refresh.assert_called_once()

    @pytest.mark.asyncio
    async def test_update_citation_regenerates_formatted_citations(self, citation_service, mock_user, sample_citation):
        """Test that citation update regenerates formatted citations when content changes"""
        with patch.object(citation_service, 'get_citation', return_value=sample_citation) as mock_get, \
             patch.object(citation_service, '_validate_citation_data') as mock_validate, \
             patch.object(citation_service, '_generate_formatted_citations') as mock_generate:
            
            mock_generate.return_value = {
                'APA': 'New formatted citation',
                'MLA': 'New formatted citation',
                'Chicago': 'New formatted citation',
                'Harvard': 'New formatted citation'
            }
            
            updates = {'title': 'New Title'}  # Content change
            await citation_service.update_citation(mock_user, 1, updates)
            
            mock_generate.assert_called_once()
            assert sample_citation.formatted_citations == mock_generate.return_value

    @pytest.mark.asyncio
    async def test_delete_citation_success(self, citation_service, mock_user, sample_citation):
        """Test successful citation deletion"""
        with patch.object(citation_service, 'get_citation', return_value=sample_citation) as mock_get:
            await citation_service.delete_citation(mock_user, 1)
            
            mock_get.assert_called_once_with(1, mock_user)
            citation_service.db.delete.assert_called_once_with(sample_citation)
            citation_service.db.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_generate_citations_batch_success(self, citation_service, mock_user):
        """Test successful batch citation generation"""
        citations_data = [
            {'title': 'Paper 1', 'authors': 'Author 1', 'year': '2023'},
            {'title': 'Paper 2', 'authors': 'Author 2', 'year': '2024'}
        ]
        
        with patch.object(citation_service, '_validate_citation_data') as mock_validate, \
             patch.object(citation_service, '_generate_formatted_citations') as mock_generate:
            
            mock_generate.return_value = {'APA': 'Formatted citation'}
            
            result = await citation_service.generate_citations_batch(mock_user, citations_data, 'APA')
            
            assert len(result) == 2
            assert all(item['valid'] for item in result)
            assert all(item['formatted'] == 'Formatted citation' for item in result)
            assert mock_validate.call_count == 2
            assert mock_generate.call_count == 2

    @pytest.mark.asyncio
    async def test_generate_citations_batch_with_errors(self, citation_service, mock_user):
        """Test batch citation generation with some errors"""
        citations_data = [
            {'title': 'Paper 1', 'authors': 'Author 1', 'year': '2023'},
            {'title': '', 'authors': '', 'year': '2024'}  # Invalid data
        ]
        
        with patch.object(citation_service, '_validate_citation_data') as mock_validate, \
             patch.object(citation_service, '_generate_formatted_citations') as mock_generate:
            
            mock_validate.side_effect = [None, HTTPException(status_code=400, detail="Title is required")]
            mock_generate.return_value = {'APA': 'Formatted citation'}
            
            result = await citation_service.generate_citations_batch(mock_user, citations_data, 'APA')
            
            assert len(result) == 2
            assert result[0]['valid'] is True
            assert result[1]['valid'] is False
            assert 'error' in result[1]

    @pytest.mark.asyncio
    async def test_extract_citation_from_url_success(self, citation_service):
        """Test successful citation extraction from URL"""
        url = "https://example.com/research-paper"
        
        result = await citation_service.extract_citation_from_url(url)
        
        assert result['type'] == 'website'
        assert 'example.com' in result['title']
        assert result['url'] == url
        assert result['year'] == str(datetime.now().year)
        assert result['authors'] == 'Unknown'
        assert result['publisher'] == 'example.com'

    @pytest.mark.asyncio
    async def test_extract_citation_from_url_invalid(self, citation_service):
        """Test citation extraction from invalid URL"""
        url = "invalid-url"
        
        with pytest.raises(HTTPException) as exc_info:
            await citation_service.extract_citation_from_url(url)
        
        assert exc_info.value.status_code == 400
        assert "Failed to extract citation" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_validate_doi_success(self, citation_service):
        """Test successful DOI validation"""
        doi = "10.1234/test.2023.001"
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'message': {
                'title': ['Test Paper'],
                'author': [
                    {'given': 'John', 'family': 'Doe'},
                    {'given': 'Jane', 'family': 'Smith'}
                ],
                'published-print': {'date-parts': [[2023]]},
                'container-title': ['Test Journal'],
                'volume': '15',
                'issue': '2',
                'page': '123-145'
            }
        }
        
        with patch('requests.get', return_value=mock_response):
            result = await citation_service.validate_doi(doi)
            
            assert result['valid'] is True
            assert result['title'] == 'Test Paper'
            assert 'John Doe' in result['authors']
            assert 'Jane Smith' in result['authors']
            assert result['year'] == 2023
            assert result['journal'] == 'Test Journal'
            assert result['volume'] == '15'
            assert result['issue'] == '2'
            assert result['pages'] == '123-145'
            assert result['doi'] == doi

    @pytest.mark.asyncio
    async def test_validate_doi_not_found(self, citation_service):
        """Test DOI validation when DOI not found"""
        doi = "10.1234/nonexistent.2023.001"
        mock_response = Mock()
        mock_response.status_code = 404
        
        with patch('requests.get', return_value=mock_response):
            result = await citation_service.validate_doi(doi)
            
            assert result['valid'] is False
            assert result['error'] == 'DOI not found'

    @pytest.mark.asyncio
    async def test_validate_doi_request_error(self, citation_service):
        """Test DOI validation with request error"""
        doi = "10.1234/test.2023.001"
        
        with patch('requests.get', side_effect=requests.RequestException("Network error")):
            result = await citation_service.validate_doi(doi)
            
            assert result['valid'] is False
            assert 'Network error' in result['error']

    def test_validate_citation_data_success(self, citation_service, sample_citation_data):
        """Test successful citation data validation"""
        citation_service._validate_citation_data(sample_citation_data)
        # Should not raise any exception

    def test_validate_citation_data_missing_title(self, citation_service, sample_citation_data):
        """Test citation data validation with missing title"""
        del sample_citation_data['title']
        
        with pytest.raises(HTTPException) as exc_info:
            citation_service._validate_citation_data(sample_citation_data)
        
        assert exc_info.value.status_code == 400
        assert "title is required" in str(exc_info.value.detail).lower()

    def test_validate_citation_data_missing_authors(self, citation_service, sample_citation_data):
        """Test citation data validation with missing authors"""
        del sample_citation_data['authors']
        
        with pytest.raises(HTTPException) as exc_info:
            citation_service._validate_citation_data(sample_citation_data)
        
        assert exc_info.value.status_code == 400
        assert "authors is required" in str(exc_info.value.detail).lower()

    def test_validate_citation_data_invalid_year_format(self, citation_service, sample_citation_data):
        """Test citation data validation with invalid year format"""
        sample_citation_data['year'] = '202'
        
        with pytest.raises(HTTPException) as exc_info:
            citation_service._validate_citation_data(sample_citation_data)
        
        assert exc_info.value.status_code == 400
        assert "Year must be a 4-digit number" in str(exc_info.value.detail)

    def test_validate_citation_data_future_year(self, citation_service, sample_citation_data):
        """Test citation data validation with future year"""
        sample_citation_data['year'] = str(datetime.now().year + 1)
        
        with pytest.raises(HTTPException) as exc_info:
            citation_service._validate_citation_data(sample_citation_data)
        
        assert exc_info.value.status_code == 400
        assert "Year cannot be in the future" in str(exc_info.value.detail)

    def test_validate_citation_data_invalid_doi(self, citation_service, sample_citation_data):
        """Test citation data validation with invalid DOI"""
        sample_citation_data['doi'] = 'invalid-doi'
        
        with pytest.raises(HTTPException) as exc_info:
            citation_service._validate_citation_data(sample_citation_data)
        
        assert exc_info.value.status_code == 400
        assert "Invalid DOI format" in str(exc_info.value.detail)

    def test_validate_citation_data_invalid_url(self, citation_service, sample_citation_data):
        """Test citation data validation with invalid URL"""
        sample_citation_data['url'] = 'invalid-url'
        
        with pytest.raises(HTTPException) as exc_info:
            citation_service._validate_citation_data(sample_citation_data)
        
        assert exc_info.value.status_code == 400
        assert "Invalid URL format" in str(exc_info.value.detail)

    def test_generate_formatted_citations(self, citation_service, sample_citation_data):
        """Test formatted citations generation"""
        with patch.object(citation_service, '_generate_apa_citation') as mock_apa, \
             patch.object(citation_service, '_generate_mla_citation') as mock_mla, \
             patch.object(citation_service, '_generate_chicago_citation') as mock_chicago, \
             patch.object(citation_service, '_generate_harvard_citation') as mock_harvard:
            
            mock_apa.return_value = 'APA citation'
            mock_mla.return_value = 'MLA citation'
            mock_chicago.return_value = 'Chicago citation'
            mock_harvard.return_value = 'Harvard citation'
            
            result = citation_service._generate_formatted_citations(sample_citation_data)
            
            assert result['APA'] == 'APA citation'
            assert result['MLA'] == 'MLA citation'
            assert result['Chicago'] == 'Chicago citation'
            assert result['Harvard'] == 'Harvard citation'

    def test_generate_apa_citation_complete(self, citation_service, sample_citation_data):
        """Test APA citation generation with complete data"""
        result = citation_service._generate_apa_citation(sample_citation_data)
        
        assert 'John Doe, Jane Smith (2023)' in result
        assert 'Test Research Paper' in result
        assert 'Journal of Testing' in result
        assert '15' in result
        assert '2' in result
        assert '123-145' in result
        assert '10.1234/test.2023.001' in result

    def test_generate_apa_citation_minimal(self, citation_service):
        """Test APA citation generation with minimal data"""
        minimal_data = {
            'authors': 'John Doe',
            'year': '2023',
            'title': 'Test Paper'
        }
        
        result = citation_service._generate_apa_citation(minimal_data)
        
        assert 'John Doe (2023)' in result
        assert 'Test Paper' in result
        assert result.endswith('.')

    def test_generate_mla_citation_complete(self, citation_service, sample_citation_data):
        """Test MLA citation generation with complete data"""
        result = citation_service._generate_mla_citation(sample_citation_data)
        
        assert 'John Doe, Jane Smith' in result
        assert 'Test Research Paper' in result
        assert 'Journal of Testing' in result
        assert 'vol. 15' in result
        assert 'no. 2' in result
        assert '2023' in result
        assert 'pp. 123-145' in result

    def test_generate_mla_citation_minimal(self, citation_service):
        """Test MLA citation generation with minimal data"""
        minimal_data = {
            'authors': 'John Doe',
            'title': 'Test Paper',
            'year': '2023'
        }
        
        result = citation_service._generate_mla_citation(minimal_data)
        
        assert 'John Doe' in result
        assert 'Test Paper' in result
        # Year is not included if journal is missing

    def test_generate_chicago_citation_complete(self, citation_service, sample_citation_data):
        """Test Chicago citation generation with complete data"""
        result = citation_service._generate_chicago_citation(sample_citation_data)
        
        assert 'John Doe, Jane Smith' in result
        assert 'Test Research Paper' in result
        assert 'Journal of Testing' in result
        assert '15' in result
        assert 'no. 2' in result
        assert '(2023)' in result
        assert ': 123-145' in result

    def test_generate_chicago_citation_minimal(self, citation_service):
        """Test Chicago citation generation with minimal data"""
        minimal_data = {
            'authors': 'John Doe',
            'title': 'Test Paper',
            'year': '2023'
        }
        
        result = citation_service._generate_chicago_citation(minimal_data)
        
        assert 'John Doe' in result
        assert 'Test Paper' in result
        # Year is not included if journal is missing

    def test_generate_harvard_citation_complete(self, citation_service, sample_citation_data):
        """Test Harvard citation generation with complete data"""
        result = citation_service._generate_harvard_citation(sample_citation_data)
        
        assert 'John Doe, Jane Smith (2023)' in result
        assert "'Test Research Paper'" in result
        assert 'Journal of Testing' in result
        assert '15' in result
        assert '(2)' in result
        assert 'pp. 123-145' in result

    def test_generate_harvard_citation_minimal(self, citation_service):
        """Test Harvard citation generation with minimal data"""
        minimal_data = {
            'authors': 'John Doe',
            'year': '2023',
            'title': 'Test Paper'
        }
        
        result = citation_service._generate_harvard_citation(minimal_data)
        
        assert 'John Doe (2023)' in result
        assert "'Test Paper'" in result

    def test_generate_harvard_citation_with_url(self, citation_service):
        """Test Harvard citation generation with URL instead of DOI"""
        data = {
            'authors': 'John Doe',
            'year': '2023',
            'title': 'Test Paper',
            'url': 'https://example.com/paper'
        }
        
        result = citation_service._generate_harvard_citation(data)
        
        assert 'Available at: https://example.com/paper' in result 