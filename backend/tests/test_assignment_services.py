import pytest
from unittest.mock import Mock, patch, AsyncMock
from sqlalchemy.orm import Session
from app.services.assignment import AssignmentService as AsyncAssignmentService
from app.services.assignment_service import AssignmentService
from app.schemas.assignment import AssignmentCreate, AssignmentUpdate
from app.models.assignment import Assignment
from app.models.class_model import Class
from app.models.user import User
from datetime import datetime

class TestAsyncAssignmentService:
    """Test the async assignment service (assignment.py)"""
    
    @pytest.fixture
    def assignment_service(self):
        return AsyncAssignmentService()
    
    @pytest.fixture
    def assignment_data(self):
        return AssignmentCreate(
            title="Test Assignment",
            description="Test description",
            subject="Mathematics",
            grade_level="10th Grade",
            topic="Algebra",
            assignment_type="essay",
            difficulty="Intermediate",
            estimated_time=60,
            class_id=1,
            due_date=datetime.now(),
            max_score=100,
            content="Initial content"
        )
    
    @patch('app.services.assignment.openai')
    async def test_generate_content_success(self, mock_openai, assignment_service, assignment_data):
        """Test successful content generation"""
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = "Generated assignment content"
        mock_openai.ChatCompletion.acreate = AsyncMock(return_value=mock_response)
        
        result = await assignment_service.generate_content(assignment_data)
        
        assert result == "Generated assignment content"
        mock_openai.ChatCompletion.acreate.assert_called_once()
        call_args = mock_openai.ChatCompletion.acreate.call_args
        assert call_args[1]['model'] == "gpt-4"
        assert call_args[1]['temperature'] == 0.7
        assert call_args[1]['max_tokens'] == 2000
    
    @patch('app.services.assignment.openai')
    async def test_generate_content_failure(self, mock_openai, assignment_service, assignment_data):
        """Test content generation failure"""
        mock_openai.ChatCompletion.acreate = AsyncMock(side_effect=Exception("API Error"))
        
        with pytest.raises(Exception, match="Failed to generate assignment content: API Error"):
            await assignment_service.generate_content(assignment_data)
    
    def test_create_prompt(self, assignment_service, assignment_data):
        """Test prompt creation"""
        prompt = assignment_service._create_prompt(assignment_data)
        
        assert "essay" in prompt
        assert "10th Grade" in prompt
        assert "Mathematics" in prompt
        assert "Algebra" in prompt
        assert "Intermediate" in prompt
        assert "60" in prompt
        assert "Test Assignment" in prompt
        assert "Clear instructions" in prompt
        assert "Detailed requirements" in prompt
    
    @patch('app.services.assignment.openai')
    @patch('app.crud.assignment.assignment.create_with_user')
    async def test_create_assignment_success(self, mock_create, mock_openai, assignment_service, assignment_data):
        """Test successful assignment creation"""
        # Mock OpenAI response
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = "Generated content"
        mock_openai.ChatCompletion.acreate = AsyncMock(return_value=mock_response)
        
        # Mock database creation
        mock_db = AsyncMock()
        mock_assignment = Mock()
        mock_create.return_value = mock_assignment
        
        result = await assignment_service.create_assignment(mock_db, obj_in=assignment_data, user_id=1)
        
        assert result == mock_assignment
        mock_create.assert_called_once()
        call_args = mock_create.call_args
        assert call_args[1]['user_id'] == 1
        assert call_args[1]['obj_in'].content == "Generated content"
    
    @patch('app.services.assignment.openai')
    async def test_create_assignment_generation_failure(self, mock_openai, assignment_service, assignment_data):
        """Test assignment creation with AI generation failure"""
        mock_openai.ChatCompletion.acreate = AsyncMock(side_effect=Exception("API Error"))
        mock_db = AsyncMock()
        
        with pytest.raises(Exception, match="Failed to generate assignment content: API Error"):
            await assignment_service.create_assignment(mock_db, obj_in=assignment_data, user_id=1)

class TestAssignmentService:
    """Test the sync assignment service (assignment_service.py)"""
    
    @pytest.fixture
    def db_session(self):
        return Mock(spec=Session)
    
    @pytest.fixture
    def assignment_data(self):
        return AssignmentCreate(
            title="Test Assignment",
            description="Test description",
            subject="Mathematics",
            grade_level="10th Grade",
            topic="Algebra",
            assignment_type="essay",
            difficulty="Intermediate",
            estimated_time=60,
            class_id=1,
            due_date=datetime.now(),
            max_score=100,
            content="Initial content"
        )
    
    @pytest.fixture
    def mock_class(self):
        class_obj = Mock(spec=Class)
        class_obj.id = 1
        class_obj.teacher_id = 1
        return class_obj
    
    @pytest.fixture
    def mock_assignment(self):
        assignment = Mock(spec=Assignment)
        assignment.id = 1
        assignment.title = "Test Assignment"
        assignment.teacher_id = 1
        assignment.class_ = Mock(spec=Class)
        assignment.class_.students = []
        return assignment
    
    @pytest.fixture
    def mock_user(self):
        user = Mock(spec=User)
        user.id = 1
        user.email = "test@example.com"
        return user
    
    def test_create_assignment_success(self, db_session, assignment_data, mock_class):
        """Test successful assignment creation"""
        db_session.query.return_value.filter.return_value.first.return_value = mock_class
        
        result = AssignmentService.create_assignment(db_session, assignment_data, 1)
        
        assert result is not None
        db_session.add.assert_called_once()
        db_session.commit.assert_called_once()
        db_session.refresh.assert_called_once()
    
    def test_create_assignment_class_not_found(self, db_session, assignment_data):
        """Test assignment creation with non-existent class"""
        db_session.query.return_value.filter.return_value.first.return_value = None
        
        with pytest.raises(ValueError, match="Class not found"):
            AssignmentService.create_assignment(db_session, assignment_data, 1)
    
    def test_create_assignment_unauthorized(self, db_session, assignment_data, mock_class):
        """Test assignment creation with unauthorized teacher"""
        mock_class.teacher_id = 2  # Different teacher
        db_session.query.return_value.filter.return_value.first.return_value = mock_class
        
        with pytest.raises(ValueError, match="Not enough permissions"):
            AssignmentService.create_assignment(db_session, assignment_data, 1)
    
    def test_get_user_assignments_teacher(self, db_session, mock_user, mock_assignment):
        """Test getting assignments for a teacher"""
        db_session.query.return_value.filter.return_value.first.return_value = mock_user
        db_session.query.return_value.filter.return_value.all.return_value = [mock_assignment]
        
        result = AssignmentService.get_user_assignments(db_session, 1)
        
        assert result == [mock_assignment]
    
    def test_get_user_assignments_student(self, db_session, mock_user):
        """Test getting assignments for a student"""
        db_session.query.return_value.filter.return_value.first.return_value = mock_user
        db_session.query.return_value.filter.return_value.all.return_value = []
        
        # Mock the join query for student assignments
        mock_join_query = Mock()
        db_session.query.return_value.join.return_value.join.return_value.filter.return_value = mock_join_query
        mock_join_query.all.return_value = []
        
        result = AssignmentService.get_user_assignments(db_session, 1)
        
        assert result == []
    
    def test_get_user_assignments_user_not_found(self, db_session):
        """Test getting assignments for non-existent user"""
        db_session.query.return_value.filter.return_value.first.return_value = None
        
        with pytest.raises(ValueError, match="User not found"):
            AssignmentService.get_user_assignments(db_session, 999)
    
    def test_get_assignment_success(self, db_session, mock_assignment):
        """Test getting assignment by ID"""
        db_session.query.return_value.filter.return_value.first.return_value = mock_assignment
        
        result = AssignmentService.get_assignment(db_session, 1)
        
        assert result == mock_assignment
    
    def test_get_assignment_not_found(self, db_session):
        """Test getting non-existent assignment"""
        db_session.query.return_value.filter.return_value.first.return_value = None
        
        result = AssignmentService.get_assignment(db_session, 999)
        
        assert result is None
    
    def test_is_user_in_assignment_class_teacher(self, db_session, mock_assignment, mock_user):
        """Test checking if teacher is in assignment class"""
        AssignmentService.get_assignment = Mock(return_value=mock_assignment)
        db_session.query.return_value.filter.return_value.first.return_value = mock_user
        
        result = AssignmentService.is_user_in_assignment_class(db_session, 1, 1)
        
        assert result is True
    
    def test_is_user_in_assignment_class_student(self, db_session, mock_assignment, mock_user):
        """Test checking if student is in assignment class"""
        mock_assignment.teacher_id = 2  # Different teacher
        mock_assignment.class_.students = [mock_user]
        AssignmentService.get_assignment = Mock(return_value=mock_assignment)
        db_session.query.return_value.filter.return_value.first.return_value = mock_user
        
        result = AssignmentService.is_user_in_assignment_class(db_session, 1, 1)
        
        assert result is True
    
    def test_is_user_in_assignment_class_not_in_class(self, db_session, mock_assignment, mock_user):
        """Test checking if user is not in assignment class"""
        mock_assignment.teacher_id = 2  # Different teacher
        mock_assignment.class_.students = []  # No students
        AssignmentService.get_assignment = Mock(return_value=mock_assignment)
        db_session.query.return_value.filter.return_value.first.return_value = mock_user
        
        result = AssignmentService.is_user_in_assignment_class(db_session, 1, 1)
        
        assert result is False
    
    def test_is_user_in_assignment_class_assignment_not_found(self, db_session):
        """Test checking user in non-existent assignment class"""
        AssignmentService.get_assignment = Mock(return_value=None)
        
        result = AssignmentService.is_user_in_assignment_class(db_session, 999, 1)
        
        assert result is False
    
    def test_is_user_in_assignment_class_user_not_found(self, db_session, mock_assignment):
        """Test checking non-existent user in assignment class"""
        AssignmentService.get_assignment = Mock(return_value=mock_assignment)
        db_session.query.return_value.filter.return_value.first.return_value = None
        
        result = AssignmentService.is_user_in_assignment_class(db_session, 1, 999)
        
        assert result is False
    
    def test_update_assignment_success(self, db_session, mock_assignment):
        """Test successful assignment update"""
        AssignmentService.get_assignment = Mock(return_value=mock_assignment)
        update_data = AssignmentUpdate(
            title="Updated Title",
            description="Updated description",
            subject="Mathematics",
            grade_level="10th Grade",
            max_score=100
        )
        
        result = AssignmentService.update_assignment(db_session, 1, update_data)
        
        assert result == mock_assignment
        db_session.add.assert_called_once_with(mock_assignment)
        db_session.commit.assert_called_once()
        db_session.refresh.assert_called_once_with(mock_assignment)
    
    def test_update_assignment_not_found(self, db_session):
        """Test updating non-existent assignment"""
        AssignmentService.get_assignment = Mock(return_value=None)
        update_data = AssignmentUpdate(
            title="Updated Title",
            description="Updated description",
            subject="Mathematics",
            grade_level="10th Grade",
            max_score=100
        )
        
        result = AssignmentService.update_assignment(db_session, 999, update_data)
        
        assert result is None
    
    def test_delete_assignment_success(self, db_session, mock_assignment):
        """Test successful assignment deletion"""
        AssignmentService.get_assignment = Mock(return_value=mock_assignment)
        
        AssignmentService.delete_assignment(db_session, 1)
        
        db_session.delete.assert_called_once_with(mock_assignment)
        db_session.commit.assert_called_once()
    
    def test_delete_assignment_not_found(self, db_session):
        """Test deleting non-existent assignment"""
        AssignmentService.get_assignment = Mock(return_value=None)
        
        with pytest.raises(ValueError, match="Assignment not found"):
            AssignmentService.delete_assignment(db_session, 999) 