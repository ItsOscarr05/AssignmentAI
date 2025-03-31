import pytest
from pydantic import ValidationError
from app.schemas.ai_assignment import (
    AssignmentGenerationRequest,
    AssignmentContent,
    GeneratedAssignment
)
from app.schemas.feedback import (
    FeedbackCreate,
    FeedbackUpdate,
    FeedbackBase
)

def test_assignment_generation_request_validation():
    # Valid request
    valid_request = AssignmentGenerationRequest(
        subject="Mathematics",
        grade_level="10",
        topic="Quadratic Equations",
        difficulty="medium"
    )
    assert valid_request.subject == "Mathematics"
    assert valid_request.grade_level == "10"
    assert valid_request.topic == "Quadratic Equations"
    assert valid_request.difficulty == "medium"
    
    # Invalid grade level
    with pytest.raises(ValidationError) as exc_info:
        AssignmentGenerationRequest(
            subject="Mathematics",
            grade_level="invalid",
            topic="Quadratic Equations",
            difficulty="medium"
        )
    assert "grade_level" in str(exc_info.value)
    
    # Invalid difficulty
    with pytest.raises(ValidationError) as exc_info:
        AssignmentGenerationRequest(
            subject="Mathematics",
            grade_level="10",
            topic="Quadratic Equations",
            difficulty="invalid"
        )
    assert "difficulty" in str(exc_info.value)
    
    # Subject too short
    with pytest.raises(ValidationError) as exc_info:
        AssignmentGenerationRequest(
            subject="M",
            grade_level="10",
            topic="Quadratic Equations",
            difficulty="medium"
        )
    assert "subject" in str(exc_info.value)

def test_assignment_content_validation():
    # Valid content
    valid_content = AssignmentContent(
        objectives=["Learn quadratic equations"],
        instructions="Complete the following problems",
        requirements=["Show all work"],
        evaluation_criteria=["Correctness"],
        estimated_duration="2 hours",
        resources=["Textbook"]
    )
    assert len(valid_content.objectives) == 1
    assert valid_content.instructions == "Complete the following problems"
    assert len(valid_content.requirements) == 1
    assert len(valid_content.evaluation_criteria) == 1
    assert valid_content.estimated_duration == "2 hours"
    assert len(valid_content.resources) == 1
    
    # Invalid estimated duration
    with pytest.raises(ValidationError) as exc_info:
        AssignmentContent(
            objectives=["Learn quadratic equations"],
            instructions="Complete the following problems",
            requirements=["Show all work"],
            evaluation_criteria=["Correctness"],
            estimated_duration="invalid",
            resources=["Textbook"]
        )
    assert "estimated_duration" in str(exc_info.value)
    
    # Too many objectives
    with pytest.raises(ValidationError) as exc_info:
        AssignmentContent(
            objectives=["Objective 1", "Objective 2", "Objective 3", "Objective 4", "Objective 5", "Objective 6"],
            instructions="Complete the following problems",
            requirements=["Show all work"],
            evaluation_criteria=["Correctness"],
            estimated_duration="2 hours",
            resources=["Textbook"]
        )
    assert "objectives" in str(exc_info.value)

def test_generated_assignment_validation():
    # Valid assignment
    valid_assignment = GeneratedAssignment(
        title="Understanding Quadratic Equations",
        description="A comprehensive assignment on solving quadratic equations",
        content=AssignmentContent(
            objectives=["Learn quadratic equations"],
            instructions="Complete the following problems",
            requirements=["Show all work"],
            evaluation_criteria=["Correctness"],
            estimated_duration="2 hours",
            resources=["Textbook"]
        )
    )
    assert valid_assignment.title == "Understanding Quadratic Equations"
    assert valid_assignment.description == "A comprehensive assignment on solving quadratic equations"
    
    # Title too short
    with pytest.raises(ValidationError) as exc_info:
        GeneratedAssignment(
            title="T",
            description="A comprehensive assignment on solving quadratic equations",
            content=AssignmentContent(
                objectives=["Learn quadratic equations"],
                instructions="Complete the following problems",
                requirements=["Show all work"],
                evaluation_criteria=["Correctness"],
                estimated_duration="2 hours",
                resources=["Textbook"]
            )
        )
    assert "title" in str(exc_info.value)

def test_feedback_validation():
    # Valid feedback
    valid_feedback = FeedbackBase(
        content="This is good work",
        feedback_type="content",
        confidence_score=0.8,
        metadata={"model_version": "1.0"}
    )
    assert valid_feedback.content == "This is good work"
    assert valid_feedback.feedback_type == "content"
    assert valid_feedback.confidence_score == 0.8
    assert valid_feedback.metadata == {"model_version": "1.0"}
    
    # Invalid feedback type
    with pytest.raises(ValidationError) as exc_info:
        FeedbackBase(
            content="This is good work",
            feedback_type="invalid",
            confidence_score=0.8,
            metadata={"model_version": "1.0"}
        )
    assert "feedback_type" in str(exc_info.value)
    
    # Invalid confidence score
    with pytest.raises(ValidationError) as exc_info:
        FeedbackBase(
            content="This is good work",
            feedback_type="content",
            confidence_score=1.5,
            metadata={"model_version": "1.0"}
        )
    assert "confidence_score" in str(exc_info.value)
    
    # Content too short
    with pytest.raises(ValidationError) as exc_info:
        FeedbackBase(
            content="Too short",
            feedback_type="content",
            confidence_score=0.8,
            metadata={"model_version": "1.0"}
        )
    assert "content" in str(exc_info.value)

def test_feedback_create_validation():
    # Valid feedback create
    valid_feedback = FeedbackCreate(
        submission_id=1,
        content="This is good work",
        feedback_type="content",
        confidence_score=0.8,
        metadata={"model_version": "1.0"}
    )
    assert valid_feedback.submission_id == 1
    assert valid_feedback.content == "This is good work"
    
    # Missing submission_id
    with pytest.raises(ValidationError) as exc_info:
        FeedbackCreate(
            content="This is good work",
            feedback_type="content",
            confidence_score=0.8,
            metadata={"model_version": "1.0"}
        )
    assert "submission_id" in str(exc_info.value)

def test_feedback_update_validation():
    # Valid feedback update
    valid_feedback = FeedbackUpdate(
        content="Updated feedback",
        feedback_type="content",
        confidence_score=0.9,
        metadata={"model_version": "1.1"}
    )
    assert valid_feedback.content == "Updated feedback"
    assert valid_feedback.confidence_score == 0.9
    
    # Partial update
    partial_feedback = FeedbackUpdate(
        content="Updated feedback"
    )
    assert partial_feedback.content == "Updated feedback"
    assert partial_feedback.feedback_type is None
    assert partial_feedback.confidence_score is None
    assert partial_feedback.metadata is None

def test_html_sanitization():
    # Test HTML sanitization in content
    feedback_with_html = FeedbackBase(
        content="<script>alert('xss')</script>This is good work",
        feedback_type="content",
        confidence_score=0.8,
        metadata={"model_version": "1.0"}
    )
    assert feedback_with_html.content == "This is good work"
    
    # Test HTML sanitization in metadata
    feedback_with_html_metadata = FeedbackBase(
        content="This is good work",
        feedback_type="content",
        confidence_score=0.8,
        metadata={"model_version": "<script>alert('xss')</script>1.0"}
    )
    assert feedback_with_html_metadata.metadata["model_version"] == "1.0"
    
    # Test HTML sanitization in assignment content
    content_with_html = AssignmentContent(
        objectives=["<script>alert('xss')</script>Learn quadratic equations"],
        instructions="<script>alert('xss')</script>Complete the following problems",
        requirements=["<script>alert('xss')</script>Show all work"],
        evaluation_criteria=["<script>alert('xss')</script>Correctness"],
        estimated_duration="2 hours",
        resources=["<script>alert('xss')</script>Textbook"]
    )
    assert content_with_html.objectives[0] == "Learn quadratic equations"
    assert content_with_html.instructions == "Complete the following problems"
    assert content_with_html.requirements[0] == "Show all work"
    assert content_with_html.evaluation_criteria[0] == "Correctness"
    assert content_with_html.resources[0] == "Textbook" 