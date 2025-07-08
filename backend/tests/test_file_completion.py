import pytest
from unittest.mock import Mock, patch, AsyncMock
from app.services.file_completion import FileCompletionService
import types

@pytest.fixture
def mock_settings():
    mock = Mock()
    mock.OPENAI_MODEL = "gpt-4"
    mock.OPENAI_API_KEY = "test-key"
    return mock

@pytest.fixture
def file_completion_service(mock_settings):
    with patch('app.services.file_completion.settings', mock_settings), \
         patch('app.services.file_completion.openai.AsyncOpenAI') as mock_openai:
        mock_openai.return_value = Mock()
        return FileCompletionService()

def test_detect_language(file_completion_service):
    assert file_completion_service._detect_language("foo.py") == "Python"
    assert file_completion_service._detect_language("foo.ts") == "TypeScript"
    assert file_completion_service._detect_language("foo.unknown") == "Unknown"

def test_get_context(file_completion_service):
    content = "a\nb\nc\nd\ne\nf\ng\nh\ni\nj"
    # Cursor at line 5 (after 'e')
    pos = content.find('e') + 1
    ctx = file_completion_service._get_context(content, pos)
    assert 'e' in ctx
    assert ctx.count('\n') <= file_completion_service.max_context_lines

def test_get_imports_python(file_completion_service):
    content = "import os\nfrom sys import path\ndef foo(): pass"
    imports = file_completion_service._get_imports(content, "Python")
    assert "import os" in imports
    assert "from sys import path" in imports

def test_get_imports_js(file_completion_service):
    content = "import x from 'y'\nrequire('z')\nconst a = 1;"
    imports = file_completion_service._get_imports(content, "JavaScript")
    assert "import x from 'y'" in imports
    assert "require('z')" in imports

def test_get_imports_other(file_completion_service):
    content = "something else"
    imports = file_completion_service._get_imports(content, "Go")
    assert imports == []

def test_is_scope_start(file_completion_service):
    assert file_completion_service._is_scope_start("def foo():", "Python")
    assert file_completion_service._is_scope_start("class Bar:", "Python")
    assert not file_completion_service._is_scope_start("print('hi')", "Python")
    assert file_completion_service._is_scope_start("function foo() {", "JavaScript")
    assert file_completion_service._is_scope_start("let x = 1;", "JavaScript")

def test_is_scope_end(file_completion_service):
    assert file_completion_service._is_scope_end("", "Python")
    assert not file_completion_service._is_scope_end("pass", "Python")
    assert file_completion_service._is_scope_end("}", "JavaScript")
    assert not file_completion_service._is_scope_end("{", "JavaScript")

def test_get_scope_context_python(file_completion_service):
    content = "def foo():\n    x = 1\n    y = 2\n\nprint(x)"
    pos = content.find('y = 2') + 1
    scope = file_completion_service._get_scope_context(content, pos, "Python")
    assert "def foo():" in scope
    assert "y = 2" in scope

def test_get_scope_context_js(file_completion_service):
    content = "function foo() {\n  let x = 1;\n}\nconsole.log(x);"
    pos = content.find('let x = 1;') + 1
    scope = file_completion_service._get_scope_context(content, pos, "JavaScript")
    assert "let x = 1;" in scope
    assert "}" in scope

def test_construct_completion_prompt(file_completion_service):
    prompt = file_completion_service._construct_completion_prompt(
        context="ctx", imports=["import os"], scope_context="def foo():", language="Python"
    )
    assert "Python" in prompt
    assert "import os" in prompt
    assert "def foo():" in prompt
    assert "ctx" in prompt

def test_process_completion(file_completion_service):
    context = "    def foo():\n        pass"
    completion = "```python\nprint('hi')\n```"
    processed = file_completion_service._process_completion(completion, context, "Python")
    assert "print('hi')" in processed
    # Should be properly indented
    assert processed.startswith("    ")

def test_calculate_confidence(file_completion_service):
    resp = types.SimpleNamespace()
    resp.finish_reason = 'stop'
    resp.logprobs = None
    conf = file_completion_service._calculate_confidence(resp)
    assert 0.5 < conf <= 1.0
    resp.finish_reason = 'length'
    conf2 = file_completion_service._calculate_confidence(resp)
    assert conf2 < conf
    resp.finish_reason = 'stop'
    class Logprobs:
        token_logprobs = [-0.1, 0.1]
    resp.logprobs = Logprobs()
    conf3 = file_completion_service._calculate_confidence(resp)
    assert 0.0 <= conf3 <= 1.0

def test_get_scope_depth(file_completion_service):
    scope = "function foo() {\n  if (x) {\n    while (y) {\n    }\n  }\n}"
    depth = file_completion_service._get_scope_depth(scope)
    assert depth == 3

def test_get_completion_success(file_completion_service):
    # Patch all private methods and OpenAI client
    with patch.object(file_completion_service, '_detect_language', return_value='Python'), \
         patch.object(file_completion_service, '_get_context', return_value='ctx'), \
         patch.object(file_completion_service, '_get_imports', return_value=['import os']), \
         patch.object(file_completion_service, '_get_scope_context', return_value='def foo(): pass'), \
         patch.object(file_completion_service, '_construct_completion_prompt', return_value='prompt'), \
         patch.object(file_completion_service, '_process_completion', return_value='completed'), \
         patch.object(file_completion_service, '_calculate_confidence', return_value=0.9), \
         patch.object(file_completion_service, '_get_scope_depth', return_value=2), \
         patch('app.services.file_completion.openai.AsyncOpenAI') as mock_openai:
        mock_client = Mock()
        mock_openai.return_value = mock_client
        mock_response = Mock()
        mock_response.choices = [Mock(message=Mock(content='completion'))]
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
        file_completion_service.client = mock_client
        result = asyncio_run(file_completion_service.get_completion(
            file_path="foo.py", cursor_position=0, file_content="", language=None
        ))
        assert result['completion'] == 'completed'
        assert result['language'] == 'Python'
        assert result['confidence'] == 0.9
        assert result['metadata']['scope_depth'] == 2

def test_get_completion_error(file_completion_service):
    with patch.object(file_completion_service, '_detect_language', side_effect=Exception('fail')), \
         patch('app.services.file_completion.logger') as mock_logger:
        import asyncio
        result = asyncio_run(file_completion_service.get_completion(
            file_path="foo.py", cursor_position=0, file_content="", language=None
        ))
        assert 'error' in result
        assert result['completion'] == ''
        assert result['language'] == 'unknown'
        mock_logger.error.assert_called()

# Helper for running async functions in pytest
import asyncio
def asyncio_run(coro):
    return asyncio.get_event_loop().run_until_complete(coro) 