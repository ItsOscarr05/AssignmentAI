import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from backend.src.main import app
from backend.src.database import Base, get_db
from backend.src.config import settings

# Import all models to ensure they are registered with SQLAlchemy
from backend.src.models.user import User, course_enrollments
from backend.src.models.course import Course
from backend.src.models.assignment import Assignment
from backend.src.models.submission import Submission
from backend.src.models.attachment import Attachment
from backend.src.models.feedback import Feedback, RubricFeedback

from backend.src.services.auth import get_password_hash

# Create test database
TEST_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables
Base.metadata.create_all(bind=engine)

@pytest.fixture(scope="function")
def db():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture(scope="function")
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            db.close()
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture(scope="function")
def test_user(db):
    from backend.src.models.user import User
    from backend.src.services.auth import get_password_hash
    
    user = User(
        email="test@example.com",
        username="testuser",
        hashed_password=get_password_hash("testpassword"),
        full_name="Test User",
        role="student",
        is_active=True,
        is_verified=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@pytest.fixture(scope="function")
def test_teacher(db):
    from backend.src.models.user import User
    from backend.src.services.auth import get_password_hash
    
    teacher = User(
        email="teacher@example.com",
        username="testteacher",
        hashed_password=get_password_hash("testpassword"),
        full_name="Test Teacher",
        role="teacher",
        is_active=True,
        is_verified=True
    )
    db.add(teacher)
    db.commit()
    db.refresh(teacher)
    return teacher

@pytest.fixture(scope="function")
def test_admin(db):
    from backend.src.models.user import User
    from backend.src.services.auth import get_password_hash
    
    admin = User(
        email="admin@example.com",
        username="testadmin",
        hashed_password=get_password_hash("testpassword"),
        full_name="Test Admin",
        role="admin",
        is_active=True,
        is_verified=True
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin

@pytest.fixture(scope="session")
def test_settings():
    """Override settings for testing"""
    settings.TESTING = True
    settings.DATABASE_URL = TEST_DATABASE_URL
    settings.SECRET_KEY = "test-secret-key"
    settings.ACCESS_TOKEN_EXPIRE_MINUTES = 30
    settings.ALGORITHM = "HS256"
    return settings

@pytest.fixture(scope="function")
def mock_email_service(monkeypatch):
    """Mock email service for testing"""
    def mock_send_email(*args, **kwargs):
        return True
    
    monkeypatch.setattr("backend.src.services.email.send_email", mock_send_email)
    return mock_send_email

@pytest.fixture(scope="function")
def mock_file_storage(monkeypatch):
    """Mock file storage service for testing"""
    def mock_upload_file(*args, **kwargs):
        return "mock_file_url"
    
    def mock_delete_file(*args, **kwargs):
        return True
    
    monkeypatch.setattr("backend.src.services.storage.upload_file", mock_upload_file)
    monkeypatch.setattr("backend.src.services.storage.delete_file", mock_delete_file)
    return mock_upload_file, mock_delete_file

@pytest.fixture(scope="function")
def mock_redis(monkeypatch):
    """Mock Redis client for testing"""
    class MockRedis:
        def __init__(self):
            self.data = {}
        
        def set(self, key, value, ex=None):
            self.data[key] = value
            return True
        
        def get(self, key):
            return self.data.get(key)
        
        def delete(self, key):
            if key in self.data:
                del self.data[key]
            return True
    
    mock_redis = MockRedis()
    monkeypatch.setattr("backend.src.services.redis.get_redis", lambda: mock_redis)
    return mock_redis

@pytest.fixture(scope="session")
def test_db():
    """Create a test database session"""
    SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    # Create a test session
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        # Drop all tables after tests
        Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client(test_db):
    """Create a test client with the test database session"""
    def override_get_db():
        try:
            yield test_db
        finally:
            test_db.rollback()
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def test_user(test_db):
    """Create a test user in the database"""
    user = User(
        email="test@example.com",
        username="testuser",
        hashed_password=get_password_hash("testpassword"),
        full_name="Test User",
        role="student",
        is_active=True,
        is_verified=True
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)
    return user

@pytest.fixture
def test_teacher(test_db):
    """Create a test teacher user in the database"""
    user = User(
        email="teacher@example.com",
        username="teacher",
        hashed_password=get_password_hash("teacherpass123"),
        full_name="Test Teacher",
        role="teacher",
        is_active=True,
        is_verified=True
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)
    return user

@pytest.fixture
def test_student(test_db):
    """Create a test student user in the database"""
    user = User(
        email="student@example.com",
        username="student",
        hashed_password=get_password_hash("studentpass123"),
        full_name="Test Student",
        role="student",
        is_active=True,
        is_verified=True
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)
    return user 