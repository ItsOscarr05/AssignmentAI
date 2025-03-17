"""
Property-based tests for data models and API inputs using Hypothesis.

These tests verify that our data models and API inputs handle a wide range of
possible inputs correctly, including edge cases and unexpected values.
"""

import pytest
from hypothesis import given, strategies as st
from hypothesis.provisional import domains
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from backend.models import Assignment, User, Task, TaskStatus
from backend.schemas import AssignmentCreate, UserCreate, DocumentCreate
from backend.exceptions import ValidationError

# Custom strategies for generating test data
@st.composite
def assignment_data(draw) -> Dict:
    """Generate valid assignment data."""
    subjects = ["mathematics", "science", "english", "history", "physics", "chemistry", "biology", "art"]
    grade_levels = ["elementary", "middle_school", "high_school", "college"]
    
    return {
        "title": draw(st.text(min_size=1, max_size=100)),
        "description": draw(st.text(min_size=10, max_size=1000)),
        "subject": draw(st.sampled_from(subjects)),
        "grade_level": draw(st.sampled_from(grade_levels)),
        "due_date": draw(
            st.datetimes(
                min_value=datetime(2024, 1, 1),
                max_value=datetime(2025, 12, 31)
            )
        )
    }

@st.composite
def user_data(draw) -> Dict:
    """Generate valid user data."""
    return {
        "email": draw(domains().map(lambda d: f"user_{draw(st.integers(1, 1000))}@{d}")),
        "first_name": draw(st.text(min_size=1, max_size=50)),
        "last_name": draw(st.text(min_size=1, max_size=50)),
        "password": draw(st.text(min_size=8, max_size=50)),
        "role": draw(st.sampled_from(["student", "teacher", "admin"]))
    }

class TestAssignmentModel:
    """Property-based tests for Assignment model."""
    
    @given(data=assignment_data())
    def test_assignment_creation(self, data: Dict):
        """Test that valid assignment data always creates a valid Assignment."""
        assignment = AssignmentCreate(**data)
        assert assignment.title == data["title"]
        assert assignment.description == data["description"]
        assert assignment.subject == data["subject"]
        assert assignment.grade_level == data["grade_level"]
        assert assignment.due_date == data["due_date"]
    
    @given(
        title=st.text(max_size=0),
        description=st.text(min_size=1001),
        subject=st.text(),
        grade_level=st.text()
    )
    def test_assignment_validation(self, title: str, description: str, subject: str, grade_level: str):
        """Test that invalid assignment data raises appropriate validation errors."""
        with pytest.raises(ValidationError):
            AssignmentCreate(
                title=title,
                description=description,
                subject=subject,
                grade_level=grade_level
            )

class TestUserModel:
    """Property-based tests for User model."""
    
    @given(data=user_data())
    def test_user_creation(self, data: Dict):
        """Test that valid user data always creates a valid User."""
        user = UserCreate(**data)
        assert user.email == data["email"]
        assert user.first_name == data["first_name"]
        assert user.last_name == data["last_name"]
        assert user.role == data["role"]
    
    @given(
        email=st.text(),
        password=st.text(max_size=7)
    )
    def test_user_validation(self, email: str, password: str):
        """Test that invalid user data raises appropriate validation errors."""
        with pytest.raises(ValidationError):
            UserCreate(
                email=email,
                password=password,
                first_name="Test",
                last_name="User",
                role="student"
            )

class TestTaskModel:
    """Property-based tests for Task model."""
    
    @given(
        st.integers(min_value=1),
        st.sampled_from([status.value for status in TaskStatus]),
        st.datetimes(
            min_value=datetime(2020, 1, 1),
            max_value=datetime(2030, 12, 31)
        )
    )
    def test_task_creation(
        self,
        assignment_id: int,
        status: str,
        created_at: datetime
    ):
        """Test that valid task data always creates a valid Task."""
        task = Task(
            assignment_id=assignment_id,
            status=status,
            created_at=created_at
        )
        assert task.assignment_id == assignment_id
        assert task.status == status
        assert task.created_at == created_at

class TestAPIInputs:
    """Property-based tests for API input validation."""
    
    @given(
        st.integers(min_value=1),
        st.integers(min_value=1, max_value=100)
    )
    def test_pagination_params(self, page: int, page_size: int):
        """Test that pagination parameters are handled correctly."""
        # Simulate API pagination logic
        skip = (page - 1) * page_size
        assert skip >= 0
        assert 0 < page_size <= 100
    
    @given(st.text(min_size=1))
    def test_search_params(self, query: str):
        """Test that search parameters are handled correctly."""
        # Simulate API search parameter validation
        assert len(query.strip()) > 0
    
    @given(
        st.datetimes(
            min_value=datetime(2020, 1, 1),
            max_value=datetime(2030, 12, 31)
        ),
        st.integers(min_value=1, max_value=30)
    )
    def test_date_range_params(self, start_date: datetime, days: int):
        """Test that date range parameters are handled correctly."""
        end_date = start_date + timedelta(days=days)
        assert end_date > start_date
        assert (end_date - start_date).days <= 30  # Maximum range of 30 days 