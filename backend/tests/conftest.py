import pytest
from typing import Generator, Dict, Any
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings
from app.db.base import Base
from app.main import app
from app.db.session import get_db
from app.models.user import User
from app.models.assignment import Assignment
from app.models.submission import Submission
from app.models.ai_assignment import AIAssignment
from app.models.feedback import Feedback
from app.core.security import create_access_token
from app.schemas.user import UserCreate
from app.schemas.assignment import AssignmentCreate
from app.schemas.submission import SubmissionCreate
from app.schemas.ai_assignment import AIAssignmentCreate
from app.schemas.feedback import FeedbackCreate

# Test database URL
TEST_SQLALCHEMY_DATABASE_URI = "sqlite:///./test.db"

# Override settings for testing
settings.SQLALCHEMY_DATABASE_URI = TEST_SQLALCHEMY_DATABASE_URI
settings.ENVIRONMENT = "test"
settings.CACHE_ENABLED = False
settings.QUERY_OPTIMIZATION_ENABLED = False

@pytest.fixture(scope="session")
def engine():
    """Create test database engine"""
    engine = create_engine(TEST_SQLALCHEMY_DATABASE_URI)
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def db(engine) -> Generator[Session, None, None]:
    """Create test database session"""
    connection = engine.connect()
    transaction = connection.begin()
    session = sessionmaker(bind=connection)()
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture(scope="function")
def client(db: Session) -> Generator[TestClient, None, None]:
    """Create test client"""
    def override_get_db():
        try:
            yield db
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()

# Mock data fixtures
@pytest.fixture
def mock_user_data() -> Dict[str, Any]:
    return {
        "email": "test@example.com",
        "password": "testpassword123",
        "full_name": "Test User",
        "role": "teacher"
    }

@pytest.fixture
def mock_assignment_data() -> Dict[str, Any]:
    return {
        "title": "Test Assignment",
        "description": "Test Description",
        "due_date": "2024-12-31T23:59:59",
        "grade_level": "9-12",
        "subject": "Mathematics",
        "difficulty": "medium"
    }

@pytest.fixture
def mock_submission_data() -> Dict[str, Any]:
    return {
        "content": "Test submission content",
        "file_path": "test_file.pdf",
        "submitted_at": "2024-01-01T12:00:00"
    }

@pytest.fixture
def mock_ai_assignment_data() -> Dict[str, Any]:
    return {
        "title": "AI Generated Assignment",
        "description": "AI generated description",
        "prompt": "Generate a math assignment",
        "generated_content": "Generated content here",
        "confidence_score": 0.95
    }

@pytest.fixture
def mock_feedback_data() -> Dict[str, Any]:
    return {
        "content": "Test feedback content",
        "feedback_type": "general",
        "confidence_score": 0.9
    }

# Token generation fixtures
@pytest.fixture
def teacher_token(mock_user_data: Dict[str, Any]) -> str:
    return create_access_token(
        data={"sub": mock_user_data["email"], "role": "teacher"}
    )

@pytest.fixture
def student_token(mock_user_data: Dict[str, Any]) -> str:
    return create_access_token(
        data={"sub": mock_user_data["email"], "role": "student"}
    )

# Database object fixtures
@pytest.fixture
def test_user(db: Session, mock_user_data: Dict[str, Any]) -> User:
    user = UserCreate(**mock_user_data)
    db_user = User(
        email=user.email,
        hashed_password=user.password,  # In real app, this would be hashed
        full_name=user.full_name,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@pytest.fixture
def test_assignment(db: Session, test_user: User, mock_assignment_data: Dict[str, Any]) -> Assignment:
    assignment = AssignmentCreate(**mock_assignment_data)
    db_assignment = Assignment(
        **assignment.dict(),
        teacher_id=test_user.id
    )
    db.add(db_assignment)
    db.commit()
    db.refresh(db_assignment)
    return db_assignment

@pytest.fixture
def test_submission(db: Session, test_user: User, test_assignment: Assignment, mock_submission_data: Dict[str, Any]) -> Submission:
    submission = SubmissionCreate(**mock_submission_data)
    db_submission = Submission(
        **submission.dict(),
        student_id=test_user.id,
        assignment_id=test_assignment.id
    )
    db.add(db_submission)
    db.commit()
    db.refresh(db_submission)
    return db_submission

@pytest.fixture
def test_ai_assignment(db: Session, test_user: User, mock_ai_assignment_data: Dict[str, Any]) -> AIAssignment:
    ai_assignment = AIAssignmentCreate(**mock_ai_assignment_data)
    db_ai_assignment = AIAssignment(
        **ai_assignment.dict(),
        teacher_id=test_user.id
    )
    db.add(db_ai_assignment)
    db.commit()
    db.refresh(db_ai_assignment)
    return db_ai_assignment

@pytest.fixture
def test_feedback(db: Session, test_user: User, test_submission: Submission, mock_feedback_data: Dict[str, Any]) -> Feedback:
    feedback = FeedbackCreate(**mock_feedback_data)
    db_feedback = Feedback(
        **feedback.dict(),
        teacher_id=test_user.id,
        submission_id=test_submission.id
    )
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)
    return db_feedback 