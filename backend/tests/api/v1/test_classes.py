import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from unittest.mock import patch, MagicMock
import uuid
from datetime import datetime

from app.main import app
from app.models.user import User
from app.models.class_model import Class
from app.schemas.class_schema import ClassCreate, ClassUpdate
from tests.conftest import TestingSessionLocal
from app.auth import get_current_user

client = TestClient(app)

@pytest.fixture(autouse=True)
def override_get_current_user(test_user):
    from app.main import app
    app.dependency_overrides[get_current_user] = lambda: test_user
    yield
    app.dependency_overrides.clear()

class TestClassesEndpoints:
    """Test cases for classes endpoints"""
    
    def test_create_class_success(self, db: Session, test_user: User):
        """Test creating a class successfully"""
        # Make user a teacher
        test_user.is_superuser = True
        db.commit()
        
        unique_id = str(uuid.uuid4())[:8]
        class_data = {
            "name": f"Test Class {unique_id}",
            "code": f"TEST{unique_id}",
            "description": "A test class",
            "teacher_id": test_user.id
        }
        
        with patch('app.auth.get_current_user', return_value=test_user):
            response = client.post("/api/v1/classes/", json=class_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == f"Test Class {unique_id}"
        assert data["code"] == f"TEST{unique_id}"
    
    def test_create_class_unauthorized(self, db: Session, test_user: User):
        """Test creating a class without teacher privileges"""
        from app.main import app
        from app.auth import get_current_user
        import uuid
        unique_id = str(uuid.uuid4())[:8]
        non_superuser = User(
            email=f"nonsuperuser-{unique_id}@example.com",
            hashed_password="fakehash",
            name="Non Superuser",
            is_active=True,
            is_verified=True,
            is_superuser=False,
            updated_at=datetime.utcnow()
        )
        db.add(non_superuser)
        db.commit()
        db.refresh(non_superuser)
        app.dependency_overrides[get_current_user] = lambda: non_superuser
        class_data = {
            "name": f"Test Class {unique_id}",
            "code": f"TEST{unique_id}",
            "description": "A test class",
            "teacher_id": non_superuser.id
        }
        response = client.post("/api/v1/classes/", json=class_data)
        app.dependency_overrides.clear()
        assert response.status_code == 403
    
    def test_get_classes_success(self, db: Session, test_user: User):
        """Test getting classes successfully"""
        with patch('app.auth.get_current_user', return_value=test_user):
            response = client.get("/api/v1/classes/")
        
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_get_class_success(self, db: Session, test_user: User):
        """Test getting a specific class successfully"""
        # Create a test class
        unique_id = str(uuid.uuid4())[:8]
        class_ = Class()
        class_.name = f"Test Class {unique_id}"
        class_.code = f"TEST{unique_id}"
        class_.description = "A test class"
        class_.teacher_id = test_user.id
        db.add(class_)
        db.commit()
        db.refresh(class_)
        
        with patch('app.auth.get_current_user', return_value=test_user):
            response = client.get(f"/api/v1/classes/{class_.id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == f"Test Class {unique_id}"
    
    def test_get_class_not_found(self, db: Session, test_user: User):
        """Test getting a non-existent class"""
        from app.services.class_service import ClassService
        with patch.object(ClassService, 'get_class', return_value=None):
            response = client.get("/api/v1/classes/999")
        assert response.status_code == 404
    
    def test_get_class_unauthorized(self, db: Session, test_user: User, test_teacher: User):
        """Test getting a class without authorization"""
        # Create a class with a different teacher
        unique_id = str(uuid.uuid4())[:8]
        class_ = Class()
        class_.name = f"Test Class {unique_id}"
        class_.code = f"TEST{unique_id}"
        class_.description = "A test class"
        class_.teacher_id = test_teacher.id
        db.add(class_)
        db.commit()
        db.refresh(class_)
        
        with patch('app.auth.get_current_user', return_value=test_user):
            response = client.get(f"/api/v1/classes/{class_.id}")
        
        assert response.status_code == 403
    
    def test_update_class_success(self, db: Session, test_user: User):
        """Test updating a class successfully"""
        # Make user a teacher
        test_user.is_superuser = True
        db.commit()
        
        # Create a test class
        unique_id = str(uuid.uuid4())[:8]
        class_ = Class()
        class_.name = f"Test Class {unique_id}"
        class_.code = f"TEST{unique_id}"
        class_.description = "A test class"
        class_.teacher_id = test_user.id
        db.add(class_)
        db.commit()
        db.refresh(class_)
        
        update_data = {
            "name": "Updated Class",
            "description": "Updated description"
        }
        
        with patch('app.auth.get_current_user', return_value=test_user):
            response = client.put(f"/api/v1/classes/{class_.id}", json=update_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Class"
    
    def test_update_class_not_found(self, db: Session, test_user: User):
        """Test updating a non-existent class"""
        from app.services.class_service import ClassService
        update_data = {
            "name": "Updated Class",
            "description": "Updated description"
        }
        with patch.object(ClassService, 'get_class', return_value=None):
            response = client.put("/api/v1/classes/999", json=update_data)
        assert response.status_code == 404
    
    def test_update_class_unauthorized(self, db: Session, test_user: User, test_teacher: User):
        """Test updating a class without authorization"""
        # Create a class with a different teacher
        unique_id = str(uuid.uuid4())[:8]
        class_ = Class()
        class_.name = f"Test Class {unique_id}"
        class_.code = f"TEST{unique_id}"
        class_.description = "A test class"
        class_.teacher_id = test_teacher.id
        db.add(class_)
        db.commit()
        db.refresh(class_)
        
        update_data = {
            "name": "Updated Class",
            "description": "Updated description"
        }
        
        with patch('app.auth.get_current_user', return_value=test_user):
            response = client.put(f"/api/v1/classes/{class_.id}", json=update_data)
        
        assert response.status_code == 403
    
    def test_delete_class_success(self, db: Session, test_user: User):
        """Test deleting a class successfully"""
        # Make user a teacher
        test_user.is_superuser = True
        db.commit()
        
        # Create a test class
        unique_id = str(uuid.uuid4())[:8]
        class_ = Class()
        class_.name = f"Test Class {unique_id}"
        class_.code = f"TEST{unique_id}"
        class_.description = "A test class"
        class_.teacher_id = test_user.id
        db.add(class_)
        db.commit()
        db.refresh(class_)
        
        with patch('app.auth.get_current_user', return_value=test_user):
            response = client.delete(f"/api/v1/classes/{class_.id}")
        
        assert response.status_code == 204
    
    def test_delete_class_not_found(self, db: Session, test_user: User):
        """Test deleting a non-existent class"""
        from app.services.class_service import ClassService
        with patch.object(ClassService, 'get_class', return_value=None):
            response = client.delete("/api/v1/classes/999")
        assert response.status_code == 404
    
    def test_delete_class_unauthorized(self, db: Session, test_user: User, test_teacher: User):
        """Test deleting a class without authorization"""
        # Create a class with a different teacher
        unique_id = str(uuid.uuid4())[:8]
        class_ = Class()
        class_.name = f"Test Class {unique_id}"
        class_.code = f"TEST{unique_id}"
        class_.description = "A test class"
        class_.teacher_id = test_teacher.id
        db.add(class_)
        db.commit()
        db.refresh(class_)
        
        with patch('app.auth.get_current_user', return_value=test_user):
            response = client.delete(f"/api/v1/classes/{class_.id}")
        
        assert response.status_code == 403 
    
    def test_add_student_to_class_success(self, db: Session, test_user: User, test_student: User):
        """Test adding a student to a class successfully"""
        # Make user a teacher
        test_user.is_superuser = True
        db.commit()
        # Create a test class
        unique_id = str(uuid.uuid4())[:8]
        class_ = Class()
        class_.name = f"Test Class {unique_id}"
        class_.code = f"TEST{unique_id}"
        class_.description = "A test class"
        class_.teacher_id = test_user.id
        db.add(class_)
        db.commit()
        db.refresh(class_)
        with patch('app.auth.get_current_user', return_value=test_user):
            response = client.post(f"/api/v1/classes/{class_.id}/students/{test_student.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == class_.id
        assert test_student.id in [s["id"] for s in data.get("students", [])]
    
    def test_add_student_to_class_not_found(self, db: Session, test_user: User, test_student: User):
        """Test adding a student to a non-existent class"""
        from app.services.class_service import ClassService
        with patch.object(ClassService, 'get_class', return_value=None):
            response = client.post(f"/api/v1/classes/999/students/{test_student.id}")
        assert response.status_code == 404
    
    def test_add_student_to_class_unauthorized(self, db: Session, test_user: User, test_teacher: User, test_student: User):
        """Test adding a student to a class without authorization"""
        # Create a class with a different teacher
        unique_id = str(uuid.uuid4())[:8]
        class_ = Class()
        class_.name = f"Test Class {unique_id}"
        class_.code = f"TEST{unique_id}"
        class_.description = "A test class"
        class_.teacher_id = test_teacher.id
        db.add(class_)
        db.commit()
        db.refresh(class_)
        
        with patch('app.auth.get_current_user', return_value=test_user):
            response = client.post(f"/api/v1/classes/{class_.id}/students/{test_student.id}")
        
        assert response.status_code == 403
    
    def test_remove_student_from_class_success(self, db: Session, test_user: User, test_student: User):
        """Test removing a student from a class successfully"""
        # Make user a teacher
        test_user.is_superuser = True
        db.commit()
        
        # Create a test class
        unique_id = str(uuid.uuid4())[:8]
        class_ = Class()
        class_.name = f"Test Class {unique_id}"
        class_.code = f"TEST{unique_id}"
        class_.description = "A test class"
        class_.teacher_id = test_user.id
        db.add(class_)
        db.commit()
        db.refresh(class_)
        
        # Add student to class
        class_.students.append(test_student)
        db.add(class_)
        db.commit()
        db.refresh(class_)
        
        with patch('app.auth.get_current_user', return_value=test_user):
            response = client.delete(f"/api/v1/classes/{class_.id}/students/{test_student.id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == class_.id
        assert test_student.id not in [s["id"] for s in data.get("students", [])]
    
    def test_remove_student_from_class_not_found(self, db: Session, test_user: User, test_student: User):
        """Test removing a student from a non-existent class"""
        from app.services.class_service import ClassService
        with patch.object(ClassService, 'get_class', return_value=None):
            response = client.delete(f"/api/v1/classes/999/students/{test_student.id}")
        assert response.status_code == 404
    
    def test_remove_student_from_class_unauthorized(self, db: Session, test_user: User, test_teacher: User, test_student: User):
        """Test removing a student from a class without authorization"""
        # Create a class with a different teacher
        unique_id = str(uuid.uuid4())[:8]
        class_ = Class()
        class_.name = f"Test Class {unique_id}"
        class_.code = f"TEST{unique_id}"
        class_.description = "A test class"
        class_.teacher_id = test_teacher.id
        db.add(class_)
        db.commit()
        db.refresh(class_)
        
        with patch('app.auth.get_current_user', return_value=test_user):
            response = client.delete(f"/api/v1/classes/{class_.id}/students/{test_student.id}")
        
        assert response.status_code == 403 