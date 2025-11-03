import os
import sys
from datetime import datetime, timedelta
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent.parent / 'backend'
sys.path.append(str(backend_dir))

from app.database import SessionLocal
from app.models.user import User
from app.models.assignment import Assignment
from app.models.submission import Submission
from app.core.security import get_password_hash
from app.core.config import settings

def create_test_users():
    """Create test users for UAT"""
    db = SessionLocal()
    try:
        # Create admin user
        admin = User(
            email="admin@test.com",
            hashed_password=get_password_hash("Admin123!"),
            full_name="Admin User",
            is_active=True,
            is_superuser=True,
            role="admin"
        )
        db.add(admin)

        # Create teacher user
        teacher = User(
            email="teacher@test.com",
            hashed_password=get_password_hash("Teacher123!"),
            full_name="Test Teacher",
            is_active=True,
            role="teacher"
        )
        db.add(teacher)

        # Create student users
        for i in range(1, 6):
            student = User(
                email=f"student{i}@test.com",
                hashed_password=get_password_hash(f"Student{i}123!"),
                full_name=f"Test Student {i}",
                is_active=True,
                role="student"
            )
            db.add(student)

        db.commit()
        print("Test users created successfully")
    except Exception as e:
        db.rollback()
        print(f"Error creating test users: {e}")
    finally:
        db.close()

def create_test_assignments():
    """Create test assignments for UAT"""
    db = SessionLocal()
    try:
        # Get teacher user
        teacher = db.query(User).filter(User.email == "teacher@test.com").first()
        if not teacher:
            print("Teacher user not found")
            return

        # Create assignments
        assignments = [
            {
                "title": "Basic Math Assignment",
                "description": "Complete the following math problems",
                "due_date": datetime.now() + timedelta(days=7),
                "subject": "Mathematics",
                "grade_level": "10",
                "difficulty": "easy"
            },
            {
                "title": "Advanced Science Project",
                "description": "Research and present a scientific topic",
                "due_date": datetime.now() + timedelta(days=14),
                "subject": "Science",
                "grade_level": "11",
                "difficulty": "hard"
            },
            {
                "title": "English Essay",
                "description": "Write a 1000-word essay on a given topic",
                "due_date": datetime.now() + timedelta(days=5),
                "subject": "English",
                "grade_level": "9",
                "difficulty": "medium"
            }
        ]

        for assignment_data in assignments:
            assignment = Assignment(
                **assignment_data,
                teacher_id=teacher.id,
                created_at=datetime.now()
            )
            db.add(assignment)

        db.commit()
        print("Test assignments created successfully")
    except Exception as e:
        db.rollback()
        print(f"Error creating test assignments: {e}")
    finally:
        db.close()

def create_test_submissions():
    """Create test submissions for UAT"""
    db = SessionLocal()
    try:
        # Get assignments and students
        assignments = db.query(Assignment).all()
        students = db.query(User).filter(User.role == "student").all()

        if not assignments or not students:
            print("Assignments or students not found")
            return

        # Create submissions
        for assignment in assignments:
            for student in students:
                submission = Submission(
                    assignment_id=assignment.id,
                    student_id=student.id,
                    content="Test submission content",
                    status="submitted",
                    submitted_at=datetime.now(),
                    grade=None,
                    feedback=None
                )
                db.add(submission)

        db.commit()
        print("Test submissions created successfully")
    except Exception as e:
        db.rollback()
        print(f"Error creating test submissions: {e}")
    finally:
        db.close()

def main():
    """Main function to set up all test data"""
    print("Setting up UAT test data...")
    create_test_users()
    create_test_assignments()
    create_test_submissions()
    print("UAT test data setup completed")

if __name__ == "__main__":
    main() 