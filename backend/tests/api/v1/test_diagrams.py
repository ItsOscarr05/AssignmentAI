import pytest
import json
from unittest.mock import Mock, patch, MagicMock, AsyncMock
from fastapi.testclient import TestClient
from io import BytesIO

from app.main import app


class TestDiagramEndpoints:
    """Test cases for diagram API endpoints"""

    @pytest.fixture
    def client(self):
        """Create a test client"""
        return TestClient(app)

    @pytest.fixture
    def mock_diagram_service(self):
        """Mock diagram service"""
        with patch('app.api.v1.endpoints.diagrams.diagram_service') as mock_service:
            yield mock_service

    @pytest.fixture
    def mock_auth_user(self):
        """Mock authenticated user"""
        return {
            "id": 1,
            "email": "test@example.com",
            "is_active": True
        }

    @patch('app.api.v1.endpoints.diagrams.diagram_service')
    def test_generate_diagram_success(self, mock_service, client, test_token):
        """Test successful diagram generation endpoint"""
        # Mock the service with AsyncMock
        mock_service.generate_diagram = AsyncMock(return_value={
            "image_data": "base64_encoded_image",
            "metadata": {
                "title": "Test Chart",
                "type": "bar",
                "generated_at": "2024-01-01T00:00:00Z"
            }
        })
        
        # Test data
        test_data = {
            "description": "Create a bar chart showing sales data",
            "diagram_type": "bar",
            "data": json.dumps([{"x": "Q1", "y": 100}, {"x": "Q2", "y": 150}])
        }
        
        response = client.post(
            "/api/v1/diagrams/generate", 
            data=test_data,
            headers={"Authorization": f"Bearer {test_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "success" in data
        assert "diagram" in data
        assert data["diagram"]["metadata"]["title"] == "Test Chart"

    @patch('app.api.v1.endpoints.diagrams.diagram_service')
    def test_generate_diagram_service_error(self, mock_service, client, test_token):
        """Test diagram generation with service error"""
        # Mock the service with error
        mock_service.generate_diagram = AsyncMock(side_effect=Exception("Failed to generate diagram"))
        
        # Test data
        test_data = {
            "description": "Create a bar chart",
            "diagram_type": "bar",
            "data": None
        }
        
        response = client.post(
            "/api/v1/diagrams/generate", 
            data=test_data,
            headers={"Authorization": f"Bearer {test_token}"}
        )
        
        assert response.status_code == 500
        data = response.json()
        assert "detail" in data
        assert "Failed to generate diagram" in data["detail"]

    def test_generate_diagram_unauthorized(self, client):
        """Test diagram generation without authentication"""
        test_data = {
            "description": "Create a chart",
            "diagram_type": "bar",
            "data": None
        }
        
        response = client.post("/api/v1/diagrams/generate", data=test_data)
        
        assert response.status_code == 401

    def test_generate_diagram_invalid_data(self, client, test_token):
        """Test diagram generation with invalid request data"""
        # Invalid data - missing required fields
        test_data = {
            "diagram_type": "bar"
            # Missing description
        }
        
        response = client.post(
            "/api/v1/diagrams/generate", 
            data=test_data,
            headers={"Authorization": f"Bearer {test_token}"}
        )
        
        assert response.status_code == 422  # Validation error

    @patch('app.api.v1.endpoints.diagrams.diagram_service')
    def test_get_diagram_types(self, mock_service, client, test_token):
        """Test getting available diagram types"""
        # Mock the service
        mock_service.supported_types = [
            "bar", "line", "pie", "scatter", "histogram", 
            "box", "heatmap", "flowchart", "venn"
        ]
        
        response = client.get(
            "/api/v1/diagrams/types",
            headers={"Authorization": f"Bearer {test_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "types" in data
        assert isinstance(data["types"], list)
        assert "bar" in data["types"]
        assert "line" in data["types"]
        assert "pie" in data["types"]

    @patch('app.api.v1.endpoints.diagrams.diagram_service')
    def test_get_diagram_styles(self, mock_service, client, test_token):
        """Test getting available diagram styles"""
        response = client.get(
            "/api/v1/diagrams/styles",
            headers={"Authorization": f"Bearer {test_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "styles" in data
        assert isinstance(data["styles"], list)
        assert "modern" in data["styles"]
        assert "classic" in data["styles"]

    @patch('app.api.v1.endpoints.diagrams.diagram_service')
    def test_detect_diagram_type(self, mock_service, client, test_token):
        """Test diagram type detection"""
        # Mock the service with AsyncMock
        mock_service._detect_diagram_type = AsyncMock(return_value="bar")
        
        test_data = {
            "description": "Show me sales data for different quarters"
        }
        
        response = client.post(
            "/api/v1/diagrams/detect-type", 
            data=test_data,
            headers={"Authorization": f"Bearer {test_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "detected_type" in data
        assert "confidence" in data
        assert "description" in data

    @patch('app.api.v1.endpoints.diagrams.diagram_service')
    def test_generate_bar_chart(self, mock_service, client, test_token):
        """Test specific bar chart generation"""
        # Mock the service with AsyncMock
        mock_service.generate_diagram = AsyncMock(return_value={
            "image_data": "base64_encoded_bar_chart",
            "metadata": {
                "title": "Sales Bar Chart",
                "type": "bar",
                "data_points": 4
            }
        })
        
        test_data = {
            "description": "Create a bar chart showing quarterly sales",
            "diagram_type": "bar",
            "data": json.dumps([{"x": "Q1", "y": 100}, {"x": "Q2", "y": 150}])
        }
        
        response = client.post(
            "/api/v1/diagrams/generate", 
            data=test_data,
            headers={"Authorization": f"Bearer {test_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "success" in data
        assert "diagram" in data
        assert data["diagram"]["metadata"]["type"] == "bar"

    @patch('app.api.v1.endpoints.diagrams.diagram_service')
    def test_generate_line_chart(self, mock_service, client, test_token):
        """Test specific line chart generation"""
        # Mock the service with AsyncMock
        mock_service.generate_diagram = AsyncMock(return_value={
            "image_data": "base64_encoded_line_chart",
            "metadata": {
                "title": "Sales Trend",
                "type": "line",
                "data_points": 6
            }
        })
        
        test_data = {
            "description": "Create a line chart showing sales trends",
            "diagram_type": "line",
            "data": json.dumps([{"x": "Jan", "y": 100}, {"x": "Feb", "y": 120}])
        }
        
        response = client.post(
            "/api/v1/diagrams/generate", 
            data=test_data,
            headers={"Authorization": f"Bearer {test_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "success" in data
        assert "diagram" in data
        assert data["diagram"]["metadata"]["type"] == "line"

    @patch('app.api.v1.endpoints.diagrams.diagram_service')
    def test_generate_pie_chart(self, mock_service, client, test_token):
        """Test specific pie chart generation"""
        # Mock the service with AsyncMock
        mock_service.generate_diagram = AsyncMock(return_value={
            "image_data": "base64_encoded_pie_chart",
            "metadata": {
                "title": "Market Share",
                "type": "pie",
                "slices": 4
            }
        })
        
        test_data = {
            "description": "Create a pie chart showing market share",
            "diagram_type": "pie",
            "data": json.dumps([{"label": "A", "value": 30}, {"label": "B", "value": 25}])
        }
        
        response = client.post(
            "/api/v1/diagrams/generate", 
            data=test_data,
            headers={"Authorization": f"Bearer {test_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "success" in data
        assert "diagram" in data
        assert data["diagram"]["metadata"]["type"] == "pie"

    @patch('app.api.v1.endpoints.diagrams.diagram_service')
    def test_generate_scatter_plot(self, mock_service, client, test_token):
        """Test specific scatter plot generation"""
        # Mock the service with AsyncMock
        mock_service.generate_diagram = AsyncMock(return_value={
            "image_data": "base64_encoded_scatter_plot",
            "metadata": {
                "title": "Correlation Analysis",
                "type": "scatter",
                "data_points": 50
            }
        })
        
        test_data = {
            "description": "Create a scatter plot showing correlation",
            "diagram_type": "scatter",
            "data": json.dumps([{"x": 1, "y": 2}, {"x": 2, "y": 4}])
        }
        
        response = client.post(
            "/api/v1/diagrams/generate", 
            data=test_data,
            headers={"Authorization": f"Bearer {test_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "success" in data
        assert "diagram" in data
        assert data["diagram"]["metadata"]["type"] == "scatter"

    @patch('app.api.v1.endpoints.diagrams.diagram_service')
    def test_generate_histogram(self, mock_service, client, test_token):
        """Test specific histogram generation"""
        # Mock the service with AsyncMock
        mock_service.generate_diagram = AsyncMock(return_value={
            "image_data": "base64_encoded_histogram",
            "metadata": {
                "title": "Distribution Analysis",
                "type": "histogram",
                "bins": 10
            }
        })
        
        test_data = {
            "description": "Create a histogram showing distribution",
            "diagram_type": "histogram",
            "data": json.dumps([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
        }
        
        response = client.post(
            "/api/v1/diagrams/generate", 
            data=test_data,
            headers={"Authorization": f"Bearer {test_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "success" in data
        assert "diagram" in data
        assert data["diagram"]["metadata"]["type"] == "histogram"

    @patch('app.api.v1.endpoints.diagrams.diagram_service')
    def test_generate_box_plot(self, mock_service, client, test_token):
        """Test specific box plot generation"""
        # Mock the service with AsyncMock
        mock_service.generate_diagram = AsyncMock(return_value={
            "image_data": "base64_encoded_box_plot",
            "metadata": {
                "title": "Statistical Summary",
                "type": "box",
                "groups": 3
            }
        })
        
        test_data = {
            "description": "Create a box plot showing statistics",
            "diagram_type": "box",
            "data": json.dumps({"group1": [1, 2, 3], "group2": [4, 5, 6]})
        }
        
        response = client.post(
            "/api/v1/diagrams/generate", 
            data=test_data,
            headers={"Authorization": f"Bearer {test_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "success" in data
        assert "diagram" in data
        assert data["diagram"]["metadata"]["type"] == "box"

    @patch('app.api.v1.endpoints.diagrams.diagram_service')
    def test_generate_heatmap(self, mock_service, client, test_token):
        """Test specific heatmap generation"""
        # Mock the service with AsyncMock
        mock_service.generate_diagram = AsyncMock(return_value={
            "image_data": "base64_encoded_heatmap",
            "metadata": {
                "title": "Correlation Matrix",
                "type": "heatmap",
                "dimensions": "5x5"
            }
        })
        
        test_data = {
            "description": "Create a heatmap showing correlations",
            "diagram_type": "heatmap",
            "data": json.dumps([[1, 0.5, 0.3], [0.5, 1, 0.7], [0.3, 0.7, 1]])
        }
        
        response = client.post(
            "/api/v1/diagrams/generate", 
            data=test_data,
            headers={"Authorization": f"Bearer {test_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "success" in data
        assert "diagram" in data
        assert data["diagram"]["metadata"]["type"] == "heatmap"

    @patch('app.api.v1.endpoints.diagrams.diagram_service')
    def test_generate_flowchart(self, mock_service, client, test_token):
        """Test specific flowchart generation"""
        # Mock the service with AsyncMock
        mock_service.generate_diagram = AsyncMock(return_value={
            "image_data": "base64_encoded_flowchart",
            "metadata": {
                "title": "Process Flow",
                "type": "flowchart",
                "nodes": 5
            }
        })
        
        test_data = {
            "description": "Create a flowchart showing process steps",
            "diagram_type": "flowchart",
            "data": json.dumps({"steps": ["Start", "Process", "Decision", "End"]})
        }
        
        response = client.post(
            "/api/v1/diagrams/generate", 
            data=test_data,
            headers={"Authorization": f"Bearer {test_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "success" in data
        assert "diagram" in data
        assert data["diagram"]["metadata"]["type"] == "flowchart"

    @patch('app.api.v1.endpoints.diagrams.diagram_service')
    def test_generate_venn_diagram(self, mock_service, client, test_token):
        """Test specific Venn diagram generation"""
        # Mock the service with AsyncMock
        mock_service.generate_diagram = AsyncMock(return_value={
            "image_data": "base64_encoded_venn_diagram",
            "metadata": {
                "title": "Set Relationships",
                "type": "venn",
                "circles": 3
            }
        })
        
        test_data = {
            "description": "Create a Venn diagram showing set relationships",
            "diagram_type": "venn",
            "data": json.dumps({"sets": ["A", "B", "C"], "intersections": ["A∩B", "B∩C"]})
        }
        
        response = client.post(
            "/api/v1/diagrams/generate", 
            data=test_data,
            headers={"Authorization": f"Bearer {test_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "success" in data
        assert "diagram" in data
        assert data["diagram"]["metadata"]["type"] == "venn"


class TestDiagramEndpointErrorHandling:
    """Test error handling for diagram endpoints"""

    @pytest.fixture
    def client(self):
        """Create a test client"""
        return TestClient(app)

    def test_missing_authentication(self, client):
        """Test endpoints without authentication"""
        # Test multiple endpoints
        endpoints = [
            "/api/v1/diagrams/generate"
        ]
        
        for endpoint in endpoints:
            if endpoint.endswith("/generate"):
                response = client.post(endpoint, data={})
            else:
                response = client.get(endpoint)
            
            assert response.status_code == 401

    @patch('app.api.v1.endpoints.diagrams.diagram_service')
    def test_service_exception_handling(self, mock_service, client, test_token):
        """Test handling of service exceptions"""
        # Mock the service with exception
        mock_service.generate_diagram = AsyncMock(side_effect=Exception("Service error"))
        
        test_data = {
            "description": "Create a chart",
            "diagram_type": "bar"
        }
        
        response = client.post(
            "/api/v1/diagrams/generate", 
            data=test_data,
            headers={"Authorization": f"Bearer {test_token}"}
        )
        
        assert response.status_code == 500
        data = response.json()
        assert "detail" in data

    def test_validation_errors(self, client, test_token):
        """Test validation error handling"""
        # Invalid data - missing required fields
        invalid_data = {
            "diagram_type": "bar"
            # Missing description
        }
        
        response = client.post(
            "/api/v1/diagrams/generate", 
            data=invalid_data,
            headers={"Authorization": f"Bearer {test_token}"}
        )
        
        assert response.status_code == 422  # Validation error

    def test_missing_required_fields(self, client, test_token):
        """Test missing required fields"""
        # Incomplete data
        incomplete_data = {
            "diagram_type": "bar"
            # Missing description
        }
        
        response = client.post(
            "/api/v1/diagrams/generate", 
            data=incomplete_data,
            headers={"Authorization": f"Bearer {test_token}"}
        )
        
        assert response.status_code == 422  # Validation error 