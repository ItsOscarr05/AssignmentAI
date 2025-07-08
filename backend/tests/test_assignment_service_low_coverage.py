import pytest
from unittest.mock import Mock, patch, AsyncMock
from sqlalchemy.orm import Session
from app.services.assignment import AssignmentService, assignment_service
from app.schemas.assignment import AssignmentCreate
from app.models.assignment import Assignment
from app.models.user import User
from app.models.class_model import Class
from datetime import datetime, timedelta

class TestAssignmentService:
    """Test assignment service functionality"""

    @pytest.fixture
    def mock_db(self):
        """Create a mock database session"""
        return Mock(spec=Session)

    @pytest.fixture
    def mock_user(self):
        """Create a mock user"""
        user = Mock(spec=User)
        user.id = 1
        user.email = "test@example.com"
        return user

    @pytest.fixture
    def mock_class(self):
        """Create a mock class"""
        class_obj = Mock(spec=Class)
        class_obj.id = 1
        class_obj.name = "Test Class"
        class_obj.teacher_id = 1
        return class_obj

    @pytest.fixture
    def assignment_data(self):
        """Create sample assignment data"""
        return AssignmentCreate(
            title="Test Assignment",
            description="Test description",
            assignment_type="essay",
            subject="English",
            grade_level="10th",
            topic="Shakespeare",
            difficulty="medium",
            estimated_time=60,
            content="Initial content",
            due_date=datetime.now() + timedelta(days=7),
            max_score=100,
            class_id=1
        )

    @patch('app.services.assignment.AssignmentService.generate_content', new_callable=AsyncMock)
    async def test_generate_content_success(self, mock_generate_content, assignment_data):
        mock_generate_content.return_value = "Generated assignment content"
        result = await assignment_service.generate_content(assignment_data)
        assert result == "Generated assignment content"
        mock_generate_content.assert_awaited_once()

    @patch('app.services.assignment.AssignmentService.generate_content', new_callable=AsyncMock)
    async def test_generate_content_failure(self, mock_generate_content, assignment_data):
        mock_generate_content.side_effect = Exception("API Error")
        with pytest.raises(Exception) as exc_info:
            await assignment_service.generate_content(assignment_data)
        assert "API Error" in str(exc_info.value)

    def test_create_prompt(self, assignment_data):
        result = assignment_service._create_prompt(assignment_data)
        assert "Test Assignment" in result
        assert "essay" in result
        assert "English" in result
        assert "10th" in result
        assert "Shakespeare" in result
        assert "medium" in result
        assert "60" in result

    def test_create_prompt_without_additional_requirements(self):
        assignment_data = AssignmentCreate(
            title="Test Assignment",
            description="Test description",
            assignment_type="essay",
            subject="English",
            grade_level="10th",
            topic="Shakespeare",
            difficulty="medium",
            estimated_time=60,
            content="Initial content",
            due_date=datetime.now() + timedelta(days=7),
            max_score=100,
            class_id=1
        )
        result = assignment_service._create_prompt(assignment_data)
        assert "Test Assignment" in result

    @patch('app.services.assignment.assignment.create_with_user')
    @patch('app.services.assignment.AssignmentService.generate_content', new_callable=AsyncMock)
    async def test_create_assignment_success(
        self, 
        mock_generate_content, 
        mock_create_with_user,
        mock_db,
        assignment_data
    ):
        mock_generate_content.return_value = "Generated content"
        mock_assignment = Mock(spec=Assignment)
        mock_assignment.id = 1
        mock_assignment.title = "Test Assignment"
        mock_create_with_user.side_effect = AsyncMock(return_value=mock_assignment)
        result = await assignment_service.create_assignment(
            db=mock_db,
            obj_in=assignment_data,
            user_id=1
        )
        assert result == mock_assignment
        mock_generate_content.assert_awaited_once_with(assignment_data)
        # The service now includes content in obj_in, so we need to check the actual call
        mock_create_with_user.assert_called_once()
        call_args = mock_create_with_user.call_args
        assert call_args[1]['user_id'] == 1
        # Check that the obj_in has the generated content
        obj_in = call_args[1]['obj_in']
        assert obj_in.content == "Generated content"

    @patch('app.services.assignment.AssignmentService.generate_content', new_callable=AsyncMock)
    async def test_create_assignment_generation_failure(
        self, 
        mock_generate_content,
        mock_db,
        assignment_data
    ):
        mock_generate_content.side_effect = Exception("Generation failed")
        with pytest.raises(Exception) as exc_info:
            await assignment_service.create_assignment(
                db=mock_db,
                obj_in=assignment_data,
                user_id=1
            )
        assert "Generation failed" in str(exc_info.value)

    def test_create_prompt_with_all_fields(self):
        assignment_data = AssignmentCreate(
            title="Comprehensive Assignment",
            description="A comprehensive test assignment",
            assignment_type="research_paper",
            subject="History",
            grade_level="12th",
            topic="World War II",
            difficulty="hard",
            estimated_time=120,
            content="Initial content",
            due_date=datetime.now() + timedelta(days=14),
            max_score=100,
            class_id=1
        )
        result = assignment_service._create_prompt(assignment_data)
        assert "Comprehensive Assignment" in result
        assert "research_paper" in result
        assert "History" in result
        assert "12th" in result
        assert "World War II" in result
        assert "hard" in result
        assert "120" in result

    def test_create_prompt_with_empty_string_requirements(self):
        assignment_data = AssignmentCreate(
            title="Test Assignment",
            description="Test description",
            assignment_type="essay",
            subject="English",
            grade_level="10th",
            topic="Shakespeare",
            difficulty="medium",
            estimated_time=60,
            content="Initial content",
            due_date=datetime.now() + timedelta(days=7),
            max_score=100,
            class_id=1
        )
        result = assignment_service._create_prompt(assignment_data)
        assert "Test Assignment" in result

    @patch('app.services.assignment.AssignmentService.generate_content', new_callable=AsyncMock)
    async def test_generate_content_with_different_assignment_types(self, mock_generate_content):
        mock_generate_content.return_value = "Generated content"
        assignment_types = ["essay", "research_paper", "presentation", "quiz", "project"]
        for assignment_type in assignment_types:
            assignment_data = AssignmentCreate(
                title=f"Test {assignment_type}",
                description="Test description",
                assignment_type=assignment_type,
                subject="English",
                grade_level="10th",
                topic="Test Topic",
                difficulty="medium",
                estimated_time=60,
                content="Initial content",
                due_date=datetime.now() + timedelta(days=7),
                max_score=100,
                class_id=1
            )
            result = await assignment_service.generate_content(assignment_data)
            assert result == "Generated content"
            assert assignment_type in assignment_service._create_prompt(assignment_data)

    @patch('app.services.assignment.AssignmentService.generate_content', new_callable=AsyncMock)
    async def test_generate_content_with_different_difficulties(self, mock_generate_content):
        mock_generate_content.return_value = "Generated content"
        difficulties = ["easy", "medium", "hard"]
        for difficulty in difficulties:
            assignment_data = AssignmentCreate(
                title=f"Test {difficulty} assignment",
                description="Test description",
                assignment_type="essay",
                subject="English",
                grade_level="10th",
                topic="Test Topic",
                difficulty=difficulty,
                estimated_time=60,
                content="Initial content",
                due_date=datetime.now() + timedelta(days=7),
                max_score=100,
                class_id=1
            )
            result = await assignment_service.generate_content(assignment_data)
            assert result == "Generated content"
            assert difficulty in assignment_service._create_prompt(assignment_data)

    @patch('app.services.assignment.AssignmentService.generate_content', new_callable=AsyncMock)
    async def test_generate_content_with_different_subjects(self, mock_generate_content):
        mock_generate_content.return_value = "Generated content"
        subjects = ["English", "Math", "Science", "History", "Art"]
        for subject in subjects:
            assignment_data = AssignmentCreate(
                title=f"Test {subject} assignment",
                description="Test description",
                assignment_type="essay",
                subject=subject,
                grade_level="10th",
                topic="Test Topic",
                difficulty="medium",
                estimated_time=60,
                content="Initial content",
                due_date=datetime.now() + timedelta(days=7),
                max_score=100,
                class_id=1
            )
            result = await assignment_service.generate_content(assignment_data)
            assert result == "Generated content"
            assert subject in assignment_service._create_prompt(assignment_data)

    @patch('app.services.assignment.AssignmentService.generate_content', new_callable=AsyncMock)
    async def test_generate_content_with_different_grade_levels(self, mock_generate_content):
        mock_generate_content.return_value = "Generated content"
        grade_levels = ["9th", "10th", "11th", "12th", "college"]
        for grade_level in grade_levels:
            assignment_data = AssignmentCreate(
                title=f"Test {grade_level} assignment",
                description="Test description",
                assignment_type="essay",
                subject="English",
                grade_level=grade_level,
                topic="Test Topic",
                difficulty="medium",
                estimated_time=60,
                content="Initial content",
                due_date=datetime.now() + timedelta(days=7),
                max_score=100,
                class_id=1
            )
            result = await assignment_service.generate_content(assignment_data)
            assert result == "Generated content"
            assert grade_level in assignment_service._create_prompt(assignment_data)

    def test_service_initialization(self):
        assert assignment_service is not None
        assert isinstance(assignment_service, AssignmentService)
        assert hasattr(assignment_service, 'generate_content')
        assert hasattr(assignment_service, '_create_prompt')
        assert hasattr(assignment_service, 'create_assignment') 