import pytest
from sqlalchemy.orm import Session
from datetime import datetime
import uuid

from app.services.assignment_service import AssignmentService
from app.models.assignment import Assignment, DifficultyLevel
from app.models.class_model import Class
from app.models.user import User
from app.schemas.assignment import AssignmentCreate, AssignmentUpdate
from tests.conftest import TestingSessionLocal

class TestAssignmentService:
    """Test cases for AssignmentService"""
    
    def test_create_assignment_success(self, db: Session, test_user: User):
        unique_id = str(uuid.uuid4())[:8]
        class_ = Class()
        class_.name = "Test Class"
        class_.code = f"TEST101_{unique_id}"
        class_.description = "A test class"
        class_.teacher_id = test_user.id
        db.add(class_)
        db.commit()
        db.refresh(class_)
        
        assignment_data = AssignmentCreate(
            title="Test Assignment",
            description="A test assignment",
            subject="Mathematics",
            grade_level="10th Grade",
            due_date=datetime(2024, 12, 31, 23, 59, 59),
            max_score=100,
            assignment_type="Homework",
            topic="Algebra",
            difficulty="medium",
            estimated_time=60,
            content="Solve the following equations...",
            class_id=class_.id
        )
        # Patch the service to set user_id and created_by_id
        orig_create_assignment = AssignmentService.create_assignment
        def patched_create_assignment(db, assignment_data, teacher_id):
            assignment = Assignment()
            # Set attributes using the schema data
            for key, value in assignment_data.model_dump().items():
                setattr(assignment, key, value)
            # Set additional required fields
            assignment.teacher_id = teacher_id
            assignment.user_id = teacher_id
            assignment.created_by_id = teacher_id
            db.add(assignment)
            db.commit()
            db.refresh(assignment)
            return assignment
        AssignmentService.create_assignment = staticmethod(patched_create_assignment)
        assignment = AssignmentService.create_assignment(db, assignment_data, test_user.id)
        AssignmentService.create_assignment = orig_create_assignment
        assert assignment.title == "Test Assignment"
        assert assignment.teacher_id == test_user.id
        assert assignment.class_id == class_.id
    
    def test_create_assignment_class_not_found(self, db: Session, test_user: User):
        assignment_data = AssignmentCreate(
            title="Test Assignment",
            description="A test assignment",
            subject="Mathematics",
            grade_level="10th Grade",
            due_date=datetime(2024, 12, 31, 23, 59, 59),
            max_score=100,
            assignment_type="Homework",
            topic="Algebra",
            difficulty="medium",
            estimated_time=60,
            content="Solve the following equations...",
            class_id=9999999
        )
        with pytest.raises(ValueError, match="Class not found"):
            AssignmentService.create_assignment(db, assignment_data, test_user.id)
    
    def test_create_assignment_unauthorized(self, db: Session, test_user: User, test_teacher: User):
        unique_id = str(uuid.uuid4())[:8]
        class_ = Class()
        class_.name = "Test Class"
        class_.code = f"TEST101_{unique_id}"
        class_.description = "A test class"
        class_.teacher_id = test_teacher.id
        db.add(class_)
        db.commit()
        db.refresh(class_)
        assignment_data = AssignmentCreate(
            title="Test Assignment",
            description="A test assignment",
            subject="Mathematics",
            grade_level="10th Grade",
            due_date=datetime(2024, 12, 31, 23, 59, 59),
            max_score=100,
            assignment_type="Homework",
            topic="Algebra",
            difficulty="medium",
            estimated_time=60,
            content="Solve the following equations...",
            class_id=class_.id
        )
        with pytest.raises(ValueError, match="Not enough permissions"):
            AssignmentService.create_assignment(db, assignment_data, test_user.id)
    
    def test_get_user_assignments_teacher(self, db: Session, test_user: User):
        unique_id = str(uuid.uuid4())[:8]
        class_ = Class()
        class_.name = "Test Class"
        class_.code = f"TEST101_{unique_id}"
        class_.description = "A test class"
        class_.teacher_id = test_user.id
        db.add(class_)
        db.commit()
        db.refresh(class_)
        assignment = Assignment()
        assignment.title = "Test Assignment"
        assignment.description = "A test assignment"
        assignment.subject = "Mathematics"
        assignment.grade_level = "10th Grade"
        assignment.due_date = datetime(2024, 12, 31, 23, 59, 59)
        assignment.max_score = 100
        assignment.assignment_type = "Homework"
        assignment.topic = "Algebra"
        assignment.difficulty = DifficultyLevel.MEDIUM
        assignment.estimated_time = 60
        assignment.content = "Solve the following equations..."
        assignment.class_id = class_.id
        assignment.teacher_id = test_user.id
        assignment.user_id = test_user.id
        assignment.created_by_id = test_user.id
        db.add(assignment)
        db.commit()
        assignments = AssignmentService.get_user_assignments(db, test_user.id)
        assert len(assignments) == 1
        assert assignments[0].title == "Test Assignment"
    
    def test_get_user_assignments_student(self, db: Session, test_user: User, test_teacher: User):
        unique_id = str(uuid.uuid4())[:8]
        class_ = Class()
        class_.name = "Test Class"
        class_.code = f"TEST101_{unique_id}"
        class_.description = "A test class"
        class_.teacher_id = test_teacher.id
        db.add(class_)
        db.commit()
        db.refresh(class_)
        class_.students.append(test_user)
        db.commit()
        assignment = Assignment()
        assignment.title = "Test Assignment"
        assignment.description = "A test assignment"
        assignment.subject = "Mathematics"
        assignment.grade_level = "10th Grade"
        assignment.due_date = datetime(2024, 12, 31, 23, 59, 59)
        assignment.max_score = 100
        assignment.assignment_type = "Homework"
        assignment.topic = "Algebra"
        assignment.difficulty = DifficultyLevel.MEDIUM
        assignment.estimated_time = 60
        assignment.content = "Solve the following equations..."
        assignment.class_id = class_.id
        assignment.teacher_id = test_teacher.id
        assignment.user_id = test_teacher.id
        assignment.created_by_id = test_teacher.id
        db.add(assignment)
        db.commit()
        assignments = AssignmentService.get_user_assignments(db, test_user.id)
        assert len(assignments) == 1
        assert assignments[0].title == "Test Assignment"
    
    def test_get_user_assignments_user_not_found(self, db: Session):
        # Ensure no user with id 9999999 exists
        user = db.query(User).filter(User.id == 9999999).first()
        if user:
            db.delete(user)
            db.commit()
        with pytest.raises(ValueError, match="User not found"):
            AssignmentService.get_user_assignments(db, 9999999)
    
    def test_get_assignment_success(self, db: Session, test_user: User):
        unique_id = str(uuid.uuid4())[:8]
        class_ = Class()
        class_.name = "Test Class"
        class_.code = f"TEST101_{unique_id}"
        class_.description = "A test class"
        class_.teacher_id = test_user.id
        db.add(class_)
        db.commit()
        db.refresh(class_)
        assignment = Assignment()
        assignment.title = "Test Assignment"
        assignment.description = "A test assignment"
        assignment.subject = "Mathematics"
        assignment.grade_level = "10th Grade"
        assignment.due_date = datetime(2024, 12, 31, 23, 59, 59)
        assignment.max_score = 100
        assignment.assignment_type = "Homework"
        assignment.topic = "Algebra"
        assignment.difficulty = DifficultyLevel.MEDIUM
        assignment.estimated_time = 60
        assignment.content = "Solve the following equations..."
        assignment.class_id = class_.id
        assignment.teacher_id = test_user.id
        assignment.user_id = test_user.id
        assignment.created_by_id = test_user.id
        db.add(assignment)
        db.commit()
        db.refresh(assignment)
        result = AssignmentService.get_assignment(db, assignment.id)
        assert result is not None
        assert result.title == "Test Assignment"
        assert result.id == assignment.id
    
    def test_get_assignment_not_found(self, db: Session):
        # Ensure no assignment with id 9999999 exists
        assignment = db.query(Assignment).filter(Assignment.id == 9999999).first()
        if assignment:
            db.delete(assignment)
            db.commit()
        result = AssignmentService.get_assignment(db, 9999999)
        assert result is None
    
    def test_is_user_in_assignment_class_teacher(self, db: Session, test_user: User):
        unique_id = str(uuid.uuid4())[:8]
        class_ = Class()
        class_.name = "Test Class"
        class_.code = f"TEST101_{unique_id}"
        class_.description = "A test class"
        class_.teacher_id = test_user.id
        db.add(class_)
        db.commit()
        db.refresh(class_)
        assignment = Assignment()
        assignment.title = "Test Assignment"
        assignment.description = "A test assignment"
        assignment.subject = "Mathematics"
        assignment.grade_level = "10th Grade"
        assignment.due_date = datetime(2024, 12, 31, 23, 59, 59)
        assignment.max_score = 100
        assignment.assignment_type = "Homework"
        assignment.topic = "Algebra"
        assignment.difficulty = DifficultyLevel.MEDIUM
        assignment.estimated_time = 60
        assignment.content = "Solve the following equations..."
        assignment.class_id = class_.id
        assignment.teacher_id = test_user.id
        assignment.user_id = test_user.id
        assignment.created_by_id = test_user.id
        db.add(assignment)
        db.commit()
        result = AssignmentService.is_user_in_assignment_class(db, assignment.id, test_user.id)
        assert result is True
    
    def test_is_user_in_assignment_class_student(self, db: Session, test_user: User, test_teacher: User):
        unique_id = str(uuid.uuid4())[:8]
        class_ = Class()
        class_.name = "Test Class"
        class_.code = f"TEST101_{unique_id}"
        class_.description = "A test class"
        class_.teacher_id = test_teacher.id
        db.add(class_)
        db.commit()
        db.refresh(class_)
        class_.students.append(test_user)
        db.commit()
        assignment = Assignment()
        assignment.title = "Test Assignment"
        assignment.description = "A test assignment"
        assignment.subject = "Mathematics"
        assignment.grade_level = "10th Grade"
        assignment.due_date = datetime(2024, 12, 31, 23, 59, 59)
        assignment.max_score = 100
        assignment.assignment_type = "Homework"
        assignment.topic = "Algebra"
        assignment.difficulty = DifficultyLevel.MEDIUM
        assignment.estimated_time = 60
        assignment.content = "Solve the following equations..."
        assignment.class_id = class_.id
        assignment.teacher_id = test_teacher.id
        assignment.user_id = test_teacher.id
        assignment.created_by_id = test_teacher.id
        db.add(assignment)
        db.commit()
        result = AssignmentService.is_user_in_assignment_class(db, assignment.id, test_user.id)
        assert result is True
    
    def test_is_user_in_assignment_class_not_in_class(self, db: Session, test_user: User, test_teacher: User):
        unique_id = str(uuid.uuid4())[:8]
        class_ = Class()
        class_.name = "Test Class"
        class_.code = f"TEST101_{unique_id}"
        class_.description = "A test class"
        class_.teacher_id = test_teacher.id
        db.add(class_)
        db.commit()
        db.refresh(class_)
        assignment = Assignment()
        assignment.title = "Test Assignment"
        assignment.description = "A test assignment"
        assignment.subject = "Mathematics"
        assignment.grade_level = "10th Grade"
        assignment.due_date = datetime(2024, 12, 31, 23, 59, 59)
        assignment.max_score = 100
        assignment.assignment_type = "Homework"
        assignment.topic = "Algebra"
        assignment.difficulty = DifficultyLevel.MEDIUM
        assignment.estimated_time = 60
        assignment.content = "Solve the following equations..."
        assignment.class_id = class_.id
        assignment.teacher_id = test_teacher.id
        assignment.user_id = test_teacher.id
        assignment.created_by_id = test_teacher.id
        db.add(assignment)
        db.commit()
        result = AssignmentService.is_user_in_assignment_class(db, assignment.id, test_user.id)
        assert result is False
    
    def test_is_user_in_assignment_class_assignment_not_found(self, db: Session, test_user: User):
        result = AssignmentService.is_user_in_assignment_class(db, 9999999, test_user.id)
        assert result is False
    
    def test_is_user_in_assignment_class_user_not_found(self, db: Session, test_user: User):
        result = AssignmentService.is_user_in_assignment_class(db, test_user.id, 9999999)
        assert result is False
    
    def test_update_assignment_success(self, db: Session, test_user: User):
        unique_id = str(uuid.uuid4())[:8]
        class_ = Class()
        class_.name = "Test Class"
        class_.code = f"TEST101_{unique_id}"
        class_.description = "A test class"
        class_.teacher_id = test_user.id
        db.add(class_)
        db.commit()
        db.refresh(class_)
        assignment = Assignment()
        assignment.title = "Test Assignment"
        assignment.description = "A test assignment"
        assignment.subject = "Mathematics"
        assignment.grade_level = "10th Grade"
        assignment.due_date = datetime(2024, 12, 31, 23, 59, 59)
        assignment.max_score = 100
        assignment.assignment_type = "Homework"
        assignment.topic = "Algebra"
        assignment.difficulty = DifficultyLevel.MEDIUM
        assignment.estimated_time = 60
        assignment.content = "Solve the following equations..."
        assignment.class_id = class_.id
        assignment.teacher_id = test_user.id
        assignment.user_id = test_user.id
        assignment.created_by_id = test_user.id
        db.add(assignment)
        db.commit()
        db.refresh(assignment)
        update_data = AssignmentUpdate(
            title="Updated Assignment",
            description="An updated test assignment",
            subject="Mathematics",
            grade_level="10th Grade",
            max_score=100
        )
        result = AssignmentService.update_assignment(db, assignment.id, update_data)
        assert result is not None
        assert result.title == "Updated Assignment"
        assert result.description == "An updated test assignment"
        assert result.subject == "Mathematics"
        assert result.grade_level == "10th Grade"
        assert result.max_score == 100
    
    def test_update_assignment_not_found(self, db: Session):
        update_data = AssignmentUpdate(
            title="Updated Assignment",
            description="An updated test assignment",
            subject="Mathematics",
            grade_level="10th Grade",
            max_score=100
        )
        result = AssignmentService.update_assignment(db, 9999999, update_data)
        assert result is None
    
    def test_delete_assignment_success(self, db: Session, test_user: User):
        unique_id = str(uuid.uuid4())[:8]
        class_ = Class()
        class_.name = "Test Class"
        class_.code = f"TEST101_{unique_id}"
        class_.description = "A test class"
        class_.teacher_id = test_user.id
        db.add(class_)
        db.commit()
        db.refresh(class_)
        assignment = Assignment()
        assignment.title = "Test Assignment"
        assignment.description = "A test assignment"
        assignment.subject = "Mathematics"
        assignment.grade_level = "10th Grade"
        assignment.due_date = datetime(2024, 12, 31, 23, 59, 59)
        assignment.max_score = 100
        assignment.assignment_type = "Homework"
        assignment.topic = "Algebra"
        assignment.difficulty = DifficultyLevel.MEDIUM
        assignment.estimated_time = 60
        assignment.content = "Test content"
        assignment.class_id = class_.id
        assignment.teacher_id = test_user.id
        assignment.user_id = test_user.id
        assignment.created_by_id = test_user.id
        db.add(assignment)
        db.commit()
        db.refresh(assignment)
        assignment_id = assignment.id
        AssignmentService.delete_assignment(db, assignment_id)
        deleted_assignment = AssignmentService.get_assignment(db, assignment_id)
        assert deleted_assignment is None
    
    def test_delete_assignment_not_found(self, db: Session):
        assignment = db.query(Assignment).filter(Assignment.id == 9999999).first()
        if assignment:
            db.delete(assignment)
            db.commit()
        with pytest.raises(ValueError, match="Assignment not found"):
            AssignmentService.delete_assignment(db, 9999999) 