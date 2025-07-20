import pytest
import json
from unittest.mock import Mock, patch, MagicMock, AsyncMock
from io import BytesIO
import base64

from app.services.diagram_service import DiagramService


class TestDiagramService:
    """Test cases for DiagramService class"""

    @pytest.fixture
    def diagram_service(self):
        """Create a DiagramService instance for testing"""
        return DiagramService()

    @pytest.fixture
    def mock_openai_response(self):
        """Mock OpenAI API response"""
        return {
            "choices": [{
                "message": {
                    "content": "bar_chart"
                }
            }]
        }

    def test_init(self, diagram_service):
        """Test DiagramService initialization"""
        assert diagram_service is not None
        assert hasattr(diagram_service, 'client')
        assert hasattr(diagram_service, 'supported_types')
        assert isinstance(diagram_service.supported_types, list)

    @pytest.mark.asyncio
    async def test_generate_diagram_success(self, diagram_service):
        """Test successful diagram generation"""
        # Mock the entire client and its methods
        with patch.object(diagram_service, 'client') as mock_client:
            # Create AsyncMock for the chat completions
            mock_chat = AsyncMock()
            mock_completions = AsyncMock()
            mock_create = AsyncMock()
            
            mock_client.chat = mock_chat
            mock_chat.completions = mock_completions
            mock_completions.create = mock_create
            
            mock_create.return_value = MagicMock(
                choices=[MagicMock(message=MagicMock(content='{"labels": ["A", "B"], "values": [10, 20]}'))]
            )
            
            # Mock matplotlib if available
            with patch('app.services.diagram_service.MATPLOTLIB_AVAILABLE', True):
                with patch('app.services.diagram_service.plt') as mock_plt:
                    with patch('app.services.diagram_service.BytesIO') as mock_bytesio:
                        mock_fig = MagicMock()
                        mock_ax = MagicMock()
                        mock_plt.subplots.return_value = (mock_fig, mock_ax)
                        mock_buffer = MagicMock()
                        mock_bytesio.return_value = mock_buffer
                        mock_buffer.getvalue.return_value = b"fake_image_data"
                        
                        result = await diagram_service.generate_diagram(
                            description="Create a bar chart",
                            diagram_type="bar_chart"
                        )
        
        assert result is not None
        assert "type" in result
        assert result["type"] == "bar_chart"

    @pytest.mark.asyncio
    async def test_generate_diagram_api_error(self, diagram_service):
        """Test diagram generation with API error (should use fallback data)"""
        # Mock the client to raise an exception
        with patch.object(diagram_service, 'client') as mock_client:
            # Create AsyncMock for the chat completions
            mock_chat = AsyncMock()
            mock_completions = AsyncMock()
            mock_create = AsyncMock()
            
            mock_client.chat = mock_chat
            mock_chat.completions = mock_completions
            mock_completions.create = mock_create
            
            mock_create.side_effect = Exception("API Error")
            
            with patch('app.services.diagram_service.MATPLOTLIB_AVAILABLE', True):
                with patch('app.services.diagram_service.plt') as mock_plt:
                    with patch('app.services.diagram_service.BytesIO') as mock_bytesio:
                        mock_fig = MagicMock()
                        mock_ax = MagicMock()
                        mock_plt.subplots.return_value = (mock_fig, mock_ax)
                        mock_buffer = MagicMock()
                        mock_bytesio.return_value = mock_buffer
                        mock_buffer.getvalue.return_value = b"fake_image_data"
                        result = await diagram_service.generate_diagram(
                            description="Create a bar chart",
                            diagram_type="bar_chart"
                        )
            assert result is not None
            assert "data" in result
            # Fallback data for bar_chart should have 'labels' and 'values'
            assert "labels" in result["data"]
            assert "values" in result["data"]

    @pytest.mark.asyncio
    async def test_generate_diagram_invalid_type(self, diagram_service):
        """Test diagram generation with invalid diagram type"""
        with pytest.raises(ValueError, match="Unsupported diagram type"):
            await diagram_service.generate_diagram(
                description="Create a chart",
                diagram_type="invalid_type"
            )

    @pytest.mark.asyncio
    async def test_detect_diagram_type_success(self, diagram_service):
        """Test successful diagram type detection"""
        # Mock the client
        with patch.object(diagram_service, 'client') as mock_client:
            # Create AsyncMock for the chat completions
            mock_chat = AsyncMock()
            mock_completions = AsyncMock()
            mock_create = AsyncMock()
            
            mock_client.chat = mock_chat
            mock_chat.completions = mock_completions
            mock_completions.create = mock_create
            
            mock_create.return_value = MagicMock(
                choices=[MagicMock(message=MagicMock(content="bar_chart"))]
            )
            
            result = await diagram_service._detect_diagram_type("Show me sales data")
            
            assert result == "bar_chart"

    @pytest.mark.asyncio
    async def test_detect_diagram_type_fallback(self, diagram_service):
        """Test diagram type detection with fallback to infographic"""
        # Mock the client
        with patch.object(diagram_service, 'client') as mock_client:
            # Create AsyncMock for the chat completions
            mock_chat = AsyncMock()
            mock_completions = AsyncMock()
            mock_create = AsyncMock()
            
            mock_client.chat = mock_chat
            mock_chat.completions = mock_completions
            mock_completions.create = mock_create
            
            mock_create.return_value = MagicMock(
                choices=[MagicMock(message=MagicMock(content="invalid_type"))]
            )
            
            result = await diagram_service._detect_diagram_type("Show me sales data")
            
            assert result == "infographic"

    @pytest.mark.asyncio
    async def test_generate_sample_data_success(self, diagram_service):
        """Test successful sample data generation"""
        # Mock the client
        with patch.object(diagram_service, 'client') as mock_client:
            # Create AsyncMock for the chat completions
            mock_chat = AsyncMock()
            mock_completions = AsyncMock()
            mock_create = AsyncMock()
            
            mock_client.chat = mock_chat
            mock_chat.completions = mock_completions
            mock_completions.create = mock_create
            
            mock_create.return_value = MagicMock(
                choices=[MagicMock(message=MagicMock(content='{"labels": ["A", "B"], "values": [10, 20]}'))]
            )
            
            result = await diagram_service._generate_sample_data("Test data", "bar_chart")
            
            assert "labels" in result
            assert "values" in result

    def test_get_fallback_data(self, diagram_service):
        """Test fallback data generation"""
        # Test bar chart fallback
        result = diagram_service._get_fallback_data("bar_chart")
        assert "labels" in result
        assert "values" in result
        
        # Test pie chart fallback
        result = diagram_service._get_fallback_data("pie_chart")
        assert "labels" in result
        assert "sizes" in result
        
        # Test scatter plot fallback
        result = diagram_service._get_fallback_data("scatter_plot")
        assert "x" in result
        assert "y" in result

    def test_safe_json_parse(self, diagram_service):
        """Test safe JSON parsing"""
        # Test valid JSON
        result = diagram_service._safe_json_parse('{"test": "value"}', {"fallback": "data"})
        assert result["test"] == "value"
        
        # Test None input
        result = diagram_service._safe_json_parse(None, {"fallback": "data"})
        assert result["fallback"] == "data"
        
        # Test invalid JSON
        result = diagram_service._safe_json_parse("invalid json", {"fallback": "data"})
        assert result["fallback"] == "data"

    @pytest.mark.asyncio
    @patch('app.services.diagram_service.MATPLOTLIB_AVAILABLE', False)
    async def test_generate_diagram_no_matplotlib(self, diagram_service):
        """Test diagram generation when matplotlib is not available"""
        result = await diagram_service._generate_data_visualization(
            "Create a bar chart",
            "bar_chart",
            None,
            "modern"
        )
        
        assert "error" in result
        assert "Matplotlib is not available" in result["error"]

    @pytest.mark.asyncio
    @patch('app.services.diagram_service.MATPLOTLIB_AVAILABLE', True)
    async def test_create_bar_chart(self, diagram_service):
        """Test bar chart creation"""
        mock_ax = MagicMock()
        data = {"labels": ["A", "B"], "values": [10, 20]}
        
        # Mock plt to avoid NoneType errors
        with patch('app.services.diagram_service.plt') as mock_plt:
            diagram_service._create_bar_chart(mock_ax, data)
            
            # Verify bar method was called
            mock_ax.bar.assert_called_once()

    @pytest.mark.asyncio
    @patch('app.services.diagram_service.MATPLOTLIB_AVAILABLE', True)
    async def test_create_line_chart(self, diagram_service):
        """Test line chart creation"""
        mock_ax = MagicMock()
        data = {"labels": ["A", "B"], "values": [10, 20]}
        
        # Mock plt to avoid NoneType errors
        with patch('app.services.diagram_service.plt') as mock_plt:
            diagram_service._create_line_chart(mock_ax, data)
            
            # Verify plot method was called
            mock_ax.plot.assert_called_once()

    @pytest.mark.asyncio
    @patch('app.services.diagram_service.MATPLOTLIB_AVAILABLE', True)
    async def test_create_pie_chart(self, diagram_service):
        """Test pie chart creation"""
        mock_ax = MagicMock()
        data = {"labels": ["A", "B"], "sizes": [10, 20]}
        
        diagram_service._create_pie_chart(mock_ax, data)
        
        # Verify pie method was called
        mock_ax.pie.assert_called_once()

    @pytest.mark.asyncio
    @patch('app.services.diagram_service.MATPLOTLIB_AVAILABLE', True)
    async def test_create_scatter_plot(self, diagram_service):
        """Test scatter plot creation"""
        mock_ax = MagicMock()
        data = {"x": [1, 2], "y": [10, 20]}
        
        diagram_service._create_scatter_plot(mock_ax, data)
        
        # Verify scatter method was called
        mock_ax.scatter.assert_called_once()


class TestDiagramServiceIntegration:
    """Integration tests for DiagramService"""

    @pytest.mark.asyncio
    async def test_full_diagram_generation_workflow(self):
        """Test complete diagram generation workflow"""
        service = DiagramService()
        
        # Mock the client
        with patch.object(service, 'client') as mock_client:
            # Create AsyncMock for the chat completions
            mock_chat = AsyncMock()
            mock_completions = AsyncMock()
            mock_create = AsyncMock()
            
            mock_client.chat = mock_chat
            mock_chat.completions = mock_completions
            mock_completions.create = mock_create
            
            mock_create.return_value = MagicMock(
                choices=[MagicMock(message=MagicMock(content='{"labels": ["A", "B"], "values": [10, 20]}'))]
            )
            
            with patch('app.services.diagram_service.MATPLOTLIB_AVAILABLE', True):
                with patch('app.services.diagram_service.plt') as mock_plt:
                    with patch('app.services.diagram_service.BytesIO') as mock_bytesio:
                        mock_fig = MagicMock()
                        mock_ax = MagicMock()
                        mock_plt.subplots.return_value = (mock_fig, mock_ax)
                        mock_buffer = MagicMock()
                        mock_bytesio.return_value = mock_buffer
                        mock_buffer.getvalue.return_value = b"fake_image_data"
                        
                        result = await service.generate_diagram(
                            description="Create a bar chart showing quarterly sales data",
                            diagram_type="bar_chart"
                        )
        
        assert result is not None
        assert "type" in result
        assert result["type"] == "bar_chart"

    @pytest.mark.asyncio
    async def test_auto_diagram_type_detection(self):
        """Test automatic diagram type detection"""
        service = DiagramService()
        
        # Mock the client
        with patch.object(service, 'client') as mock_client:
            # Create AsyncMock for the chat completions
            mock_chat = AsyncMock()
            mock_completions = AsyncMock()
            mock_create = AsyncMock()
            
            mock_client.chat = mock_chat
            mock_chat.completions = mock_completions
            mock_completions.create = mock_create
            
            # Mock the detection response
            mock_create.return_value = MagicMock(
                choices=[MagicMock(message=MagicMock(content="pie_chart"))]
            )
            
            with patch('app.services.diagram_service.MATPLOTLIB_AVAILABLE', True):
                with patch('app.services.diagram_service.plt') as mock_plt:
                    with patch('app.services.diagram_service.BytesIO') as mock_bytesio:
                        mock_fig = MagicMock()
                        mock_ax = MagicMock()
                        mock_plt.subplots.return_value = (mock_fig, mock_ax)
                        mock_buffer = MagicMock()
                        mock_bytesio.return_value = mock_buffer
                        mock_buffer.getvalue.return_value = b"fake_image_data"
                        
                        result = await service.generate_diagram(
                            description="Show me sales distribution",
                            diagram_type="auto"
                        )
            
            assert result is not None
            assert "type" in result

    def test_supported_diagram_types(self):
        """Test that all supported diagram types are available"""
        service = DiagramService()
        
        expected_types = [
            'bar_chart', 'line_chart', 'pie_chart', 'scatter_plot', 
            'flowchart', 'mind_map', 'venn_diagram', 'process_diagram',
            'org_chart', 'timeline', 'comparison_table', 'infographic'
        ]
        
        for diagram_type in expected_types:
            assert diagram_type in service.supported_types 