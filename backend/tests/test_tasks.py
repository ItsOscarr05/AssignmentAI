import pytest
from unittest.mock import patch, MagicMock
from backend.tasks import generate_assignment, process_document, analyze_performance
from celery.result import AsyncResult

@pytest.fixture
def mock_celery_task():
    with patch('celery.Task.delay') as mock_delay:
        mock_delay.return_value = AsyncResult('mock-task-id')
        yield mock_delay

@pytest.fixture
def mock_openai():
    with patch('openai.ChatCompletion.create') as mock_chat:
        mock_chat.return_value = {
            'choices': [{
                'message': {
                    'content': 'Mocked assignment content'
                }
            }]
        }
        yield mock_chat

@pytest.mark.asyncio
async def test_generate_assignment(mock_celery_task, mock_openai, test_assignment_data):
    """Test assignment generation task"""
    # Test task submission
    task = generate_assignment.delay(test_assignment_data)
    assert isinstance(task, AsyncResult)
    assert task.id == 'mock-task-id'
    
    # Verify OpenAI was called with correct parameters
    mock_openai.assert_called_once()
    call_args = mock_openai.call_args[1]
    assert 'messages' in call_args
    assert any(test_assignment_data['subject'] in str(msg) for msg in call_args['messages'])

@pytest.mark.asyncio
async def test_process_document(mock_celery_task):
    """Test document processing task"""
    test_doc = {
        'file_path': 'test.pdf',
        'file_type': 'pdf',
        'metadata': {'pages': 1}
    }
    
    with patch('backend.tasks.document_processor.process') as mock_process:
        mock_process.return_value = {'status': 'success', 'text': 'Processed content'}
        task = process_document.delay(test_doc)
        
        assert isinstance(task, AsyncResult)
        assert task.id == 'mock-task-id'
        mock_process.assert_called_once_with(test_doc)

@pytest.mark.asyncio
async def test_analyze_performance(mock_celery_task):
    """Test performance analysis task"""
    test_data = {
        'metrics': {'response_time': 100},
        'timestamp': '2024-03-11T12:00:00'
    }
    
    with patch('backend.tasks.performance_analyzer.analyze') as mock_analyze:
        mock_analyze.return_value = {'status': 'success', 'analysis': 'Performance report'}
        task = analyze_performance.delay(test_data)
        
        assert isinstance(task, AsyncResult)
        assert task.id == 'mock-task-id'
        mock_analyze.assert_called_once_with(test_data)

@pytest.mark.integration
@pytest.mark.slow
async def test_task_integration():
    """Integration test for task workflow"""
    # This test runs with actual services
    test_data = {
        'subject': 'mathematics',
        'grade_level': 'high_school',
        'assignment_text': 'Integration test assignment',
        'additional_requirements': ['test requirement']
    }
    
    # Submit task
    task = generate_assignment.delay(test_data)
    assert isinstance(task, AsyncResult)
    
    # Wait for result (with timeout)
    try:
        result = task.get(timeout=10)
        assert result is not None
        assert 'assignment' in result
    except TimeoutError:
        pytest.fail("Task execution timed out") 