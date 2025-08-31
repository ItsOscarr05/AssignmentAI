import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.models.user import User
from app.models.subscription import Subscription, SubscriptionStatus
from app.core.config import settings
from app.services.smart_summarization_service import SmartSummarizationService
from app.services.research_assistant_service import ResearchAssistantService
from app.services.content_optimization_service import ContentOptimizationService

client = TestClient(app)

@pytest.fixture
def mock_user():
    return User(
        id=1,
        email="test@example.com",
        username="testuser",
        is_active=True
    )

@pytest.fixture
def mock_plus_subscription():
    return Subscription(
        id=1,
        user_id=1,
        plan_id=settings.STRIPE_PRICE_PLUS,
        status=SubscriptionStatus.ACTIVE
    )

@pytest.fixture
def mock_pro_subscription():
    return Subscription(
        id=1,
        user_id=1,
        plan_id=settings.STRIPE_PRICE_PRO,
        status=SubscriptionStatus.ACTIVE
    )

@pytest.fixture
def mock_max_subscription():
    return Subscription(
        id=1,
        user_id=1,
        plan_id=settings.STRIPE_PRICE_MAX,
        status=SubscriptionStatus.ACTIVE
    )

@pytest.fixture
def mock_free_user_db(mock_user):
    with patch('app.core.deps.get_current_user', return_value=mock_user), \
         patch('app.core.deps.get_db') as mock_db:
        mock_db.return_value.query.return_value.filter.return_value.first.return_value = None
        yield mock_db

@pytest.fixture
def mock_plus_user_db(mock_user, mock_plus_subscription):
    with patch('app.core.deps.get_current_user', return_value=mock_user), \
         patch('app.core.deps.get_db') as mock_db:
        mock_db.return_value.query.return_value.filter.return_value.first.return_value = mock_plus_subscription
        yield mock_db

@pytest.fixture
def mock_pro_user_db(mock_user, mock_pro_subscription):
    with patch('app.core.deps.get_current_user', return_value=mock_user), \
         patch('app.core.deps.get_db') as mock_db:
        mock_db.return_value.query.return_value.filter.return_value.first.return_value = mock_pro_subscription
        yield mock_db

@pytest.fixture
def mock_max_user_db(mock_user, mock_max_subscription):
    with patch('app.core.deps.get_current_user', return_value=mock_user), \
         patch('app.core.deps.get_db') as mock_db:
        mock_db.return_value.query.return_value.filter.return_value.first.return_value = mock_max_subscription
        yield mock_db

class TestSmartSummarizationService:
    """Test Smart Content Summarization Service"""
    
    @pytest.mark.asyncio
    async def test_summarize_content(self):
        """Test basic content summarization"""
        service = SmartSummarizationService()
        
        with patch.object(service.client.chat.completions, 'create') as mock_create:
            mock_create.return_value.choices = [MagicMock(message=MagicMock(content="Test summary"))]
            
            result = await service.summarize_content(
                content="This is a test content for summarization.",
                summary_type="comprehensive",
                include_insights=True
            )
            
            assert result["summary"] == "Test summary"
            assert result["summary_type"] == "comprehensive"
            assert "insights" in result
            assert "metrics" in result
    
    @pytest.mark.asyncio
    async def test_summarize_content_without_insights(self):
        """Test content summarization without insights"""
        service = SmartSummarizationService()
        
        with patch.object(service.client.chat.completions, 'create') as mock_create:
            mock_create.return_value.choices = [MagicMock(message=MagicMock(content="Test summary"))]
            
            result = await service.summarize_content(
                content="This is a test content for summarization.",
                summary_type="executive",
                include_insights=False
            )
            
            assert result["summary"] == "Test summary"
            assert result["summary_type"] == "executive"
            assert len(result["insights"]) == 0
    
    @pytest.mark.asyncio
    async def test_summarize_multiple_documents(self):
        """Test multi-document summarization"""
        service = SmartSummarizationService()
        
        documents = [
            {"title": "Doc 1", "content": "Content 1"},
            {"title": "Doc 2", "content": "Content 2"}
        ]
        
        with patch.object(service.client.chat.completions, 'create') as mock_create:
            mock_create.return_value.choices = [MagicMock(message=MagicMock(content="Test summary"))]
            
            result = await service.summarize_multiple_documents(documents, "comprehensive")
            
            assert "individual_summaries" in result
            assert "comparative_analysis" in result
            assert result["total_documents"] == 2
    
    def test_calculate_summary_metrics(self):
        """Test summary metrics calculation"""
        service = SmartSummarizationService()
        
        original_content = "This is a test content with multiple sentences. It has several words."
        summary = "This is a summary."
        
        metrics = service._calculate_summary_metrics(original_content, summary)
        
        assert "original_words" in metrics
        assert "summary_words" in metrics
        assert "compression_ratio" in metrics
        assert "readability_score" in metrics
    
    def test_smart_summarization_model(self):
        """Test that smart summarization uses the correct model"""
        service = SmartSummarizationService()
        assert service.model == "gpt-4-turbo-preview"

class TestResearchAssistantService:
    """Test Advanced Research Assistant Service"""
    
    @pytest.mark.asyncio
    async def test_research_topic(self):
        """Test basic topic research"""
        service = ResearchAssistantService()
        
        with patch.object(service.client.chat.completions, 'create') as mock_create:
            mock_create.return_value.choices = [MagicMock(message=MagicMock(content="Research plan"))]
            
            result = await service.research_topic(
                topic="Artificial Intelligence",
                research_depth="comprehensive",
                include_sources=True,
                fact_check=True
            )
            
            assert result["topic"] == "Artificial Intelligence"
            assert result["research_depth"] == "comprehensive"
            assert "executive_summary" in result
            assert "research_results" in result
            assert "fact_check_results" in result
            assert "sources" in result
    
    @pytest.mark.asyncio
    async def test_research_topic_without_fact_check(self):
        """Test topic research without fact-checking"""
        service = ResearchAssistantService()
        
        with patch.object(service.client.chat.completions, 'create') as mock_create:
            mock_create.return_value.choices = [MagicMock(message=MagicMock(content="Research plan"))]
            
            result = await service.research_topic(
                topic="Machine Learning",
                research_depth="basic",
                include_sources=False,
                fact_check=False
            )
            
            assert result["topic"] == "Machine Learning"
            assert result["research_depth"] == "basic"
            assert len(result["fact_check_results"]) == 0
            assert len(result["sources"]) == 0
    
    @pytest.mark.asyncio
    async def test_compare_research_sources(self):
        """Test source comparison"""
        service = ResearchAssistantService()
        
        sources = ["https://example1.com", "https://example2.com"]
        
        with patch.object(service.client.chat.completions, 'create') as mock_create:
            mock_create.return_value.choices = [MagicMock(message=MagicMock(content="Source analysis"))]
            
            result = await service.compare_research_sources(sources, "AI Ethics")
            
            assert result["topic"] == "AI Ethics"
            assert "sources" in result
            assert "comparative_analysis" in result
            assert len(result["sources"]) == 2
    
    def test_parse_research_plan(self):
        """Test research plan parsing"""
        service = ResearchAssistantService()
        
        plan_text = """
        1. Key Research Questions
        What are the main questions?
        
        2. Main Subtopics
        Important subtopics to explore
        """
        
        sections = service._parse_research_plan(plan_text)
        
        assert len(sections) == 2
        assert sections[0]["title"] == "Key Research Questions"
        assert sections[1]["title"] == "Main Subtopics"
    
    def test_research_assistant_model(self):
        """Test that research assistant uses the correct model"""
        service = ResearchAssistantService()
        assert service.model == "gpt-4-turbo-preview"

class TestContentOptimizationService:
    """Test Advanced Content Optimization Service"""
    
    @pytest.mark.asyncio
    async def test_optimize_content(self):
        """Test basic content optimization"""
        service = ContentOptimizationService()
        
        with patch.object(service.client.chat.completions, 'create') as mock_create:
            mock_create.return_value.choices = [MagicMock(message=MagicMock(content="Optimized content"))]
            
            result = await service.optimize_content(
                content="This is a test content for optimization.",
                optimization_type="general",
                target_audience="Students",
                content_purpose="inform",
                include_metrics=True
            )
            
            assert result["original_content"] == "This is a test content for optimization."
            assert result["optimized_content"] == "Optimized content"
            assert result["optimization_type"] == "general"
            assert result["target_audience"] == "Students"
            assert result["content_purpose"] == "inform"
            assert "metrics" in result
            assert "improvement_report" in result
    
    @pytest.mark.asyncio
    async def test_optimize_content_without_metrics(self):
        """Test content optimization without metrics"""
        service = ContentOptimizationService()
        
        with patch.object(service.client.chat.completions, 'create') as mock_create:
            mock_create.return_value.choices = [MagicMock(message=MagicMock(content="Optimized content"))]
            
            result = await service.optimize_content(
                content="This is a test content for optimization.",
                optimization_type="academic",
                include_metrics=False
            )
            
            assert result["optimized_content"] == "Optimized content"
            assert result["optimization_type"] == "academic"
            assert len(result["metrics"]) == 0
    
    @pytest.mark.asyncio
    async def test_optimize_for_seo(self):
        """Test SEO optimization"""
        service = ContentOptimizationService()
        
        with patch.object(service.client.chat.completions, 'create') as mock_create:
            mock_create.return_value.choices = [MagicMock(message=MagicMock(content="SEO optimized content"))]
            
            result = await service.optimize_for_seo(
                content="This is a test content for SEO optimization.",
                target_keywords=["AI", "machine learning"],
                content_type="article"
            )
            
            assert result["original_content"] == "This is a test content for SEO optimization."
            assert result["seo_optimized_content"] == "SEO optimized content"
            assert result["target_keywords"] == ["AI", "machine learning"]
            assert result["content_type"] == "article"
            assert "seo_analysis" in result
            assert "seo_suggestions" in result
            assert "seo_metrics" in result
    
    def test_calculate_basic_metrics(self):
        """Test basic metrics calculation"""
        service = ContentOptimizationService()
        
        content = "This is a test content. It has multiple sentences. And paragraphs."
        
        metrics = service._calculate_basic_metrics(content)
        
        assert "word_count" in metrics
        assert "sentence_count" in metrics
        assert "paragraph_count" in metrics
        assert "avg_sentence_length" in metrics
        assert "reading_time_minutes" in metrics
    
    def test_calculate_readability_score(self):
        """Test readability score calculation"""
        service = ContentOptimizationService()
        
        content = "This is a simple test content with basic words and sentences."
        
        score = service._calculate_readability_score(content)
        
        assert isinstance(score, float)
        assert 0 <= score <= 100
    
    def test_calculate_engagement_score(self):
        """Test engagement score calculation"""
        service = ContentOptimizationService()
        
        content = "This is engaging content! It has questions? And lists: - item 1 - item 2"
        
        score = service._calculate_engagement_score(content)
        
        assert isinstance(score, float)
        assert 0 <= score <= 100
    
    def test_content_optimization_model(self):
        """Test that content optimization uses the correct model"""
        service = ContentOptimizationService()
        assert service.model == "gpt-4-turbo-preview"

class TestSmartFeaturesAPI:
    """Test Smart Features API Endpoints"""
    
    def test_summarize_content_plus_user(self, mock_plus_user_db):
        """Test summarization endpoint for Plus user"""
        with patch('app.services.smart_summarization_service.SmartSummarizationService.summarize_content') as mock_summarize:
            mock_summarize.return_value = {
                "summary": "Test summary",
                "insights": ["Insight 1", "Insight 2"],
                "metrics": {"original_words": 10, "summary_words": 5},
                "summary_type": "comprehensive"
            }
            
            response = client.post(
                "/api/v1/smart-features/summarize",
                json={
                    "content": "This is a test content for summarization.",
                    "summary_type": "comprehensive",
                    "include_insights": True
                },
                headers={"Authorization": "Bearer test-token"}
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["summary"] == "Test summary"
            assert len(data["insights"]) == 2
    
    def test_summarize_content_free_user_denied(self, mock_free_user_db):
        """Test summarization endpoint denies Free user"""
        response = client.post(
            "/api/v1/smart-features/summarize",
            json={
                "content": "This is a test content for summarization.",
                "summary_type": "comprehensive"
            },
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 403
        data = response.json()
        assert "Feature not available" in data["detail"]["error"]
    
    def test_research_topic_pro_user(self, mock_pro_user_db):
        """Test research endpoint for Pro user"""
        with patch('app.services.research_assistant_service.ResearchAssistantService.research_topic') as mock_research:
            mock_research.return_value = {
                "topic": "AI Ethics",
                "executive_summary": "Research summary",
                "research_results": {"section1": {"content": "content"}},
                "fact_check_results": {"overall_confidence": 85},
                "sources": [{"title": "Source 1", "description": "desc"}]
            }
            
            response = client.post(
                "/api/v1/smart-features/research",
                json={
                    "topic": "AI Ethics",
                    "research_depth": "comprehensive",
                    "include_sources": True,
                    "fact_check": True
                },
                headers={"Authorization": "Bearer test-token"}
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["topic"] == "AI Ethics"
            assert "executive_summary" in data
            assert "fact_check_results" in data
    
    def test_research_topic_plus_user_denied(self, mock_plus_user_db):
        """Test research endpoint denies Plus user"""
        response = client.post(
            "/api/v1/smart-features/research",
            json={
                "topic": "AI Ethics",
                "research_depth": "comprehensive"
            },
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 403
        data = response.json()
        assert "Feature not available" in data["detail"]["error"]
    
    def test_optimize_content_max_user(self, mock_max_user_db):
        """Test content optimization endpoint for Max user"""
        with patch('app.services.content_optimization_service.ContentOptimizationService.optimize_content') as mock_optimize:
            mock_optimize.return_value = {
                "original_content": "Original content",
                "optimized_content": "Optimized content",
                "optimization_type": "general",
                "metrics": {"improvements": {"overall_improvement_score": 15}},
                "improvement_report": "Improvement report"
            }
            
            response = client.post(
                "/api/v1/smart-features/optimize-content",
                json={
                    "content": "This is a test content for optimization.",
                    "optimization_type": "general",
                    "target_audience": "Students",
                    "content_purpose": "inform"
                },
                headers={"Authorization": "Bearer test-token"}
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["original_content"] == "Original content"
            assert data["optimized_content"] == "Optimized content"
            assert "metrics" in data
            assert "improvement_report" in data
    
    def test_optimize_content_pro_user_denied(self, mock_pro_user_db):
        """Test content optimization endpoint denies Pro user"""
        response = client.post(
            "/api/v1/smart-features/optimize-content",
            json={
                "content": "This is a test content for optimization.",
                "optimization_type": "general"
            },
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 403
        data = response.json()
        assert "Feature not available" in data["detail"]["error"]
    
    def test_optimize_seo_max_user(self, mock_max_user_db):
        """Test SEO optimization endpoint for Max user"""
        with patch('app.services.content_optimization_service.ContentOptimizationService.optimize_for_seo') as mock_seo:
            mock_seo.return_value = {
                "original_content": "Original content",
                "seo_optimized_content": "SEO optimized content",
                "target_keywords": ["AI", "ML"],
                "seo_metrics": {"seo_score": 85}
            }
            
            response = client.post(
                "/api/v1/smart-features/optimize-seo",
                json={
                    "content": "This is a test content for SEO optimization.",
                    "target_keywords": ["AI", "ML"],
                    "content_type": "article"
                },
                headers={"Authorization": "Bearer test-token"}
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["original_content"] == "Original content"
            assert data["seo_optimized_content"] == "SEO optimized content"
            assert data["target_keywords"] == ["AI", "ML"]
            assert "seo_metrics" in data
    
    def test_feature_info_endpoints(self):
        """Test feature information endpoints"""
        # Test smart summarization info
        response = client.get("/api/v1/smart-features/features/smart-summarization")
        assert response.status_code == 200
        data = response.json()
        assert data["feature"] == "smart_content_summarization"
        assert "capabilities" in data
        assert "use_cases" in data
        
        # Test research assistant info
        response = client.get("/api/v1/smart-features/features/research-assistant")
        assert response.status_code == 200
        data = response.json()
        assert data["feature"] == "advanced_research_assistant"
        assert "capabilities" in data
        assert "use_cases" in data
        
        # Test content optimization info
        response = client.get("/api/v1/smart-features/features/content-optimization")
        assert response.status_code == 200
        data = response.json()
        assert data["feature"] == "advanced_content_optimization"
        assert "capabilities" in data
        assert "use_cases" in data
    
    def test_health_check(self):
        """Test health check endpoint"""
        response = client.get("/api/v1/smart-features/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "services" in data
        assert "smart_summarization" in data["services"]
        assert "research_assistant" in data["services"]
        assert "content_optimization" in data["services"]

class TestErrorHandling:
    """Test error handling in smart features"""
    
    def test_summarize_content_invalid_request(self, mock_plus_user_db):
        """Test summarization with invalid request"""
        response = client.post(
            "/api/v1/smart-features/summarize",
            json={
                "content": "",  # Empty content
                "summary_type": "comprehensive"
            },
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 422  # Validation error
    
    def test_research_topic_invalid_request(self, mock_pro_user_db):
        """Test research with invalid request"""
        response = client.post(
            "/api/v1/smart-features/research",
            json={
                "topic": "A",  # Too short
                "research_depth": "comprehensive"
            },
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 422  # Validation error
    
    def test_optimize_content_invalid_request(self, mock_max_user_db):
        """Test optimization with invalid request"""
        response = client.post(
            "/api/v1/smart-features/optimize-content",
            json={
                "content": "Short",  # Too short
                "optimization_type": "general"
            },
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 422  # Validation error
    
    def test_compare_sources_invalid_request(self, mock_pro_user_db):
        """Test source comparison with invalid request"""
        response = client.post(
            "/api/v1/smart-features/compare-sources",
            json={
                "sources": ["only_one_source"],  # Need at least 2
                "topic": "AI Ethics"
            },
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 422  # Validation error
