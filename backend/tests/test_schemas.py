import pytest
import importlib
from pydantic import ValidationError
from app.schemas.ai import AssignmentGenerationRequest, AssignmentGenerationResponse
from app.schemas.class_schema import ClassBase, ClassCreate, ClassUpdate, ClassInDBBase, Class, ClassInDB, ClassResponse
from app.schemas.user import UserResponse, User
from datetime import datetime

# Import from class.py using importlib since 'class' is a reserved keyword
class_schema = importlib.import_module('app.schemas.class')
ClassPyClassBase = class_schema.ClassBase
ClassPyClassCreate = class_schema.ClassCreate
ClassPyClassUpdate = class_schema.ClassUpdate
ClassPyClassInDBBase = class_schema.ClassInDBBase
ClassPyClass = class_schema.Class
ClassPyClassInDB = class_schema.ClassInDB

class TestAISchemas:
    """Test AI-related schemas"""
    
    def test_assignment_generation_request_valid(self):
        """Test valid AssignmentGenerationRequest"""
        data = {
            "subject": "Mathematics",
            "grade_level": "10th Grade",
            "topic": "Algebraic Equations",
            "difficulty": "Intermediate",
            "requirements": {"word_count": 500, "include_examples": True}
        }
        request = AssignmentGenerationRequest(**data)
        assert request.subject == "Mathematics"
        assert request.grade_level == "10th Grade"
        assert request.topic == "Algebraic Equations"
        assert request.difficulty == "Intermediate"
        assert request.requirements == {"word_count": 500, "include_examples": True}
    
    def test_assignment_generation_request_minimal(self):
        """Test AssignmentGenerationRequest without optional fields"""
        data = {
            "subject": "Science",
            "grade_level": "8th Grade",
            "topic": "Photosynthesis",
            "difficulty": "Beginner"
        }
        request = AssignmentGenerationRequest(**data)
        assert request.subject == "Science"
        assert request.requirements is None
    
    def test_assignment_generation_request_invalid_subject(self):
        """Test AssignmentGenerationRequest with invalid subject length"""
        data = {
            "subject": "",  # Empty string
            "grade_level": "10th Grade",
            "topic": "Algebraic Equations",
            "difficulty": "Intermediate"
        }
        with pytest.raises(ValidationError):
            AssignmentGenerationRequest(**data)
    
    def test_assignment_generation_request_subject_too_long(self):
        """Test AssignmentGenerationRequest with subject too long"""
        data = {
            "subject": "A" * 101,  # 101 characters
            "grade_level": "10th Grade",
            "topic": "Algebraic Equations",
            "difficulty": "Intermediate"
        }
        with pytest.raises(ValidationError):
            AssignmentGenerationRequest(**data)
    
    def test_assignment_generation_response_success(self):
        """Test AssignmentGenerationResponse with success"""
        data = {
            "success": True,
            "assignment": {"title": "Math Assignment", "content": "Solve equations"},
            "error": None
        }
        response = AssignmentGenerationResponse(**data)
        assert response.success is True
        assert response.assignment == {"title": "Math Assignment", "content": "Solve equations"}
        assert response.error is None
    
    def test_assignment_generation_response_error(self):
        """Test AssignmentGenerationResponse with error"""
        data = {
            "success": False,
            "assignment": None,
            "error": "Failed to generate assignment"
        }
        response = AssignmentGenerationResponse(**data)
        assert response.success is False
        assert response.assignment is None
        assert response.error == "Failed to generate assignment"

class TestClassSchemas:
    """Test Class-related schemas"""
    
    def test_class_base_valid(self):
        """Test valid ClassBase"""
        data = {
            "name": "Advanced Mathematics",
            "code": "MATH101",
            "description": "A course covering advanced mathematical concepts",
            "teacher_id": 1
        }
        class_base = ClassBase(**data)
        assert class_base.name == "Advanced Mathematics"
        assert class_base.code == "MATH101"
        assert class_base.description == "A course covering advanced mathematical concepts"
        assert class_base.teacher_id == 1
    
    def test_class_base_minimal(self):
        """Test ClassBase with minimal data"""
        data = {
            "name": "Basic Science",
            "code": "SCI101",
            "teacher_id": 1
        }
        class_base = ClassBase(**data)
        assert class_base.name == "Basic Science"
        assert class_base.code == "SCI101"
        assert class_base.description is None
        assert class_base.teacher_id == 1
    
    def test_class_create_valid(self):
        """Test valid ClassCreate"""
        data = {
            "name": "English Literature",
            "code": "ENG101",
            "description": "Study of classic literature",
            "teacher_id": 2
        }
        class_create = ClassCreate(**data)
        assert class_create.name == "English Literature"
        assert class_create.code == "ENG101"
        assert class_create.description == "Study of classic literature"
        assert class_create.teacher_id == 2
    
    def test_class_update_valid(self):
        """Test valid ClassUpdate"""
        data = {
            "name": "Updated English Literature",
            "code": "ENG102",
            "description": "Updated description",
            "teacher_id": 3
        }
        class_update = ClassUpdate(**data)
        assert class_update.name == "Updated English Literature"
        assert class_update.code == "ENG102"
        assert class_update.description == "Updated description"
        assert class_update.teacher_id == 3
    
    def test_class_update_partial(self):
        """Test ClassUpdate with partial data"""
        data = {"name": "Only Name Update"}
        class_update = ClassUpdate(**data)
        assert class_update.name == "Only Name Update"
        assert class_update.code is None
        assert class_update.description is None
        assert class_update.teacher_id is None
    
    def test_class_update_description_only(self):
        """Test ClassUpdate with description only"""
        data = {"description": "Only description update"}
        class_update = ClassUpdate(**data)
        assert class_update.name is None
        assert class_update.code is None
        assert class_update.description == "Only description update"
        assert class_update.teacher_id is None
    
    def test_class_in_db_base_valid(self):
        """Test valid ClassInDBBase"""
        data = {
            "id": 1,
            "name": "Test Class",
            "code": "TEST101",
            "description": "Test description",
            "teacher_id": 1
        }
        class_in_db = ClassInDBBase(**data)
        assert class_in_db.id == 1
        assert class_in_db.name == "Test Class"
        assert class_in_db.code == "TEST101"
        assert class_in_db.teacher_id == 1
    
    def test_class_valid(self):
        """Test valid Class"""
        data = {
            "id": 1,
            "name": "Test Class",
            "code": "TEST101",
            "teacher_id": 1,
            "student_ids": [1, 2, 3]
        }
        class_obj = Class(**data)
        assert class_obj.id == 1
        assert class_obj.name == "Test Class"
        assert class_obj.student_ids == [1, 2, 3]
    
    def test_class_no_students(self):
        """Test Class without students"""
        data = {
            "id": 1,
            "name": "Empty Class",
            "code": "EMPTY101",
            "teacher_id": 1
        }
        class_obj = Class(**data)
        assert class_obj.student_ids is None
    
    def test_class_in_db_valid(self):
        """Test valid ClassInDB"""
        data = {
            "id": 1,
            "name": "Test Class",
            "code": "TEST101",
            "teacher_id": 1
        }
        class_in_db = ClassInDB(**data)
        assert class_in_db.id == 1
        assert class_in_db.name == "Test Class"
        assert class_in_db.code == "TEST101"
    
    def test_class_response_valid(self):
        """Test valid ClassResponse"""
        teacher = UserResponse(
            id=1,
            email="teacher@example.com",
            username="teacher",
            full_name="John Teacher",
            is_active=True,
            is_verified=True,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        student = UserResponse(
            id=2,
            email="student@example.com",
            username="student",
            full_name="Jane Student",
            is_active=True,
            is_verified=True,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        data = {
            "id": 1,
            "name": "Test Class",
            "code": "TEST101",
            "description": "Test description",
            "teacher_id": 1,
            "teacher": teacher,
            "students": [student]
        }
        class_response = ClassResponse(**data)
        assert class_response.id == 1
        assert class_response.name == "Test Class"
        assert class_response.teacher == teacher
        assert len(class_response.students) == 1
        assert class_response.students[0] == student
    
    def test_class_response_empty_students(self):
        """Test ClassResponse with empty students list"""
        teacher = UserResponse(
            id=1,
            email="teacher@example.com",
            username="teacher",
            full_name="John Teacher",
            is_active=True,
            is_verified=True,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        data = {
            "id": 1,
            "name": "Empty Class",
            "code": "EMPTY101",
            "teacher_id": 1,
            "teacher": teacher,
            "students": []
        }
        class_response = ClassResponse(**data)
        assert class_response.students == []
    
    def test_class_base_invalid_name_length(self):
        """Test ClassBase with invalid name length"""
        data = {
            "name": "A" * 101,  # 101 characters
            "code": "TEST101",
            "teacher_id": 1
        }
        with pytest.raises(ValidationError):
            ClassBase(**data)
    
    def test_class_base_empty_name(self):
        """Test ClassBase with empty name"""
        data = {
            "name": "",
            "code": "TEST101",
            "teacher_id": 1
        }
        with pytest.raises(ValidationError):
            ClassBase(**data)
    
    def test_class_base_description_too_long(self):
        """Test ClassBase with description too long"""
        data = {
            "name": "Test Class",
            "code": "TEST101",
            "description": "A" * 501,  # 501 characters
            "teacher_id": 1
        }
        with pytest.raises(ValidationError):
            ClassBase(**data)

class TestClassPySchemas:
    """Test Class.py schemas (different from class_schema.py)"""
    
    def test_class_py_base_valid(self):
        """Test valid ClassBase from class.py"""
        data = {
            "name": "Advanced Mathematics",
            "description": "A course covering advanced mathematical concepts"
        }
        class_base = ClassPyClassBase(**data)
        assert class_base.name == "Advanced Mathematics"
        assert class_base.description == "A course covering advanced mathematical concepts"
    
    def test_class_py_base_minimal(self):
        """Test ClassBase from class.py with minimal data"""
        data = {"name": "Basic Science"}
        class_base = ClassPyClassBase(**data)
        assert class_base.name == "Basic Science"
        assert class_base.description is None
    
    def test_class_py_create_valid(self):
        """Test valid ClassCreate from class.py"""
        data = {
            "name": "English Literature",
            "description": "Study of classic literature"
        }
        class_create = ClassPyClassCreate(**data)
        assert class_create.name == "English Literature"
        assert class_create.description == "Study of classic literature"
    
    def test_class_py_update_valid(self):
        """Test valid ClassUpdate from class.py"""
        data = {
            "name": "Updated English Literature",
            "description": "Updated description"
        }
        class_update = ClassPyClassUpdate(**data)
        assert class_update.name == "Updated English Literature"
        assert class_update.description == "Updated description"
    
    def test_class_py_update_partial(self):
        """Test ClassUpdate from class.py with partial data"""
        data = {"name": "Only Name Update"}
        class_update = ClassPyClassUpdate(**data)
        assert class_update.name == "Only Name Update"
        assert class_update.description is None
    
    def test_class_py_update_description_only(self):
        """Test ClassUpdate from class.py with description only"""
        data = {"description": "Only description update"}
        class_update = ClassPyClassUpdate(**data)
        assert class_update.name is None
        assert class_update.description == "Only description update"
    
    def test_class_py_in_db_base_valid(self):
        """Test valid ClassInDBBase from class.py"""
        teacher = User(
            id=1,
            email="teacher@example.com",
            username="teacher",
            full_name="John Teacher",
            is_active=True,
            is_verified=True,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        student = User(
            id=2,
            email="student@example.com",
            username="student",
            full_name="Jane Student",
            is_active=True,
            is_verified=True,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        data = {
            "id": 1,
            "name": "Test Class",
            "description": "Test description",
            "teacher_id": 1,
            "teacher": teacher,
            "students": [student],
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        class_in_db = ClassPyClassInDBBase(**data)
        assert class_in_db.id == 1
        assert class_in_db.name == "Test Class"
        assert class_in_db.teacher_id == 1
        assert class_in_db.teacher == teacher
        assert len(class_in_db.students) == 1
        assert class_in_db.students[0] == student
    
    def test_class_py_in_db_base_empty_students(self):
        """Test ClassInDBBase from class.py with empty students list"""
        teacher = User(
            id=1,
            email="teacher@example.com",
            username="teacher",
            full_name="John Teacher",
            is_active=True,
            is_verified=True,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        data = {
            "id": 1,
            "name": "Empty Class",
            "teacher_id": 1,
            "teacher": teacher,
            "students": [],
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        class_in_db = ClassPyClassInDBBase(**data)
        assert class_in_db.students == []
    
    def test_class_py_valid(self):
        """Test valid Class from class.py"""
        teacher = User(
            id=1,
            email="teacher@example.com",
            username="teacher",
            full_name="John Teacher",
            is_active=True,
            is_verified=True,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        data = {
            "id": 1,
            "name": "Test Class",
            "teacher_id": 1,
            "teacher": teacher,
            "students": [],
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        class_obj = ClassPyClass(**data)
        assert class_obj.id == 1
        assert class_obj.name == "Test Class"
    
    def test_class_py_in_db_valid(self):
        """Test valid ClassInDB from class.py"""
        teacher = User(
            id=1,
            email="teacher@example.com",
            username="teacher",
            full_name="John Teacher",
            is_active=True,
            is_verified=True,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        data = {
            "id": 1,
            "name": "Test Class",
            "teacher_id": 1,
            "teacher": teacher,
            "students": [],
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        class_in_db = ClassPyClassInDB(**data)
        assert class_in_db.id == 1
        assert class_in_db.name == "Test Class" 