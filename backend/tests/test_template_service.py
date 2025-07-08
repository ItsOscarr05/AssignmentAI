import pytest
from unittest.mock import MagicMock, AsyncMock, patch
from app.services.template_service import TemplateService
from app.models.template import Template
from app.models.user import User
from fastapi import HTTPException
from datetime import datetime

@pytest.fixture
def mock_db():
    return MagicMock()

@pytest.fixture
def mock_user():
    user = MagicMock(spec=User)
    user.id = 1
    return user

@pytest.fixture
def template_service(mock_db):
    return TemplateService(mock_db)

@pytest.fixture
def mock_template():
    template = MagicMock(spec=Template)
    template.id = 123
    template.created_by = 1
    template.usage_count = 0
    template.content = {"body": "Hello, {{{{ name }}}}!"}
    template.type = "email"
    template.category = "welcome"
    template.is_public = False
    template.metadata = {}
    template.updated_at = datetime.utcnow()
    return template

@pytest.mark.asyncio
async def test_create_template_success(template_service, mock_db, mock_user):
    mock_db.add = MagicMock()
    mock_db.commit = MagicMock()
    mock_db.refresh = MagicMock()
    
    result = await template_service.create_template(
        user=mock_user,
        title="Test Template",
        content={"body": "Hi!"},
        template_type="email",
        description="desc",
        category="cat",
        is_public=True,
        metadata={"foo": "bar"}
    )
    
    mock_db.add.assert_called_once()
    mock_db.commit.assert_called_once()
    mock_db.refresh.assert_called_once()
    assert result.title == "Test Template"
    assert result.type == "email"
    assert result.is_public is True
    assert result.metadata == {"foo": "bar"}

@pytest.mark.asyncio
async def test_get_template_found(template_service, mock_db, mock_template):
    mock_db.query().filter().first.return_value = mock_template
    result = await template_service.get_template(123)
    assert result == mock_template

@pytest.mark.asyncio
async def test_get_template_not_found(template_service, mock_db):
    mock_db.query().filter().first.return_value = None
    with pytest.raises(HTTPException) as exc:
        await template_service.get_template(999)
    assert exc.value.status_code == 404

@pytest.mark.asyncio
async def test_list_templates_include_public(template_service, mock_db, mock_user, mock_template):
    # Patch the .all() method at the end of the filter chain
    mock_all = MagicMock(return_value=[mock_template])
    mock_db.query().filter().filter().filter().all = mock_all
    result = await template_service.list_templates(mock_user, template_type="email", category="welcome", include_public=True)
    assert result == [mock_template]

@pytest.mark.asyncio
async def test_list_templates_private_only(template_service, mock_db, mock_user, mock_template):
    mock_all = MagicMock(return_value=[mock_template])
    mock_db.query().filter().filter().filter().all = mock_all
    result = await template_service.list_templates(mock_user, template_type="email", category="welcome", include_public=False)
    assert result == [mock_template]

@pytest.mark.asyncio
async def test_update_template_success(template_service, mock_db, mock_user, mock_template):
    with patch.object(template_service, 'get_template', return_value=mock_template):
        updates = {"title": "Updated Title", "description": "Updated desc"}
        result = await template_service.update_template(mock_user, 123, updates)
        assert result.title == "Updated Title"
        assert result.description == "Updated desc"
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once()

@pytest.mark.asyncio
async def test_update_template_not_owner(template_service, mock_db, mock_user, mock_template):
    mock_template.created_by = 2  # Not the same as mock_user.id
    with patch.object(template_service, 'get_template', return_value=mock_template):
        with pytest.raises(HTTPException) as exc:
            await template_service.update_template(mock_user, 123, {"title": "fail"})
        assert exc.value.status_code == 403

@pytest.mark.asyncio
async def test_delete_template_success(template_service, mock_db, mock_user, mock_template):
    with patch.object(template_service, 'get_template', return_value=mock_template):
        await template_service.delete_template(mock_user, 123)
        mock_db.delete.assert_called_once_with(mock_template)
        mock_db.commit.assert_called_once()

@pytest.mark.asyncio
async def test_delete_template_not_owner(template_service, mock_db, mock_user, mock_template):
    mock_template.created_by = 2
    with patch.object(template_service, 'get_template', return_value=mock_template):
        with pytest.raises(HTTPException) as exc:
            await template_service.delete_template(mock_user, 123)
        assert exc.value.status_code == 403

@pytest.mark.asyncio
async def test_increment_usage(template_service, mock_db, mock_template):
    with patch.object(template_service, 'get_template', return_value=mock_template):
        await template_service.increment_usage(123)
        assert mock_template.usage_count == 1
        mock_db.commit.assert_called_once()

@pytest.mark.asyncio
async def test_expand_template_success(template_service, mock_db, mock_template):
    # Use '{{ name }}' format to match service logic
    mock_template.content = {"body": "Hello, {{ name }}!"}
    with patch.object(template_service, 'get_template', return_value=mock_template), \
         patch.object(template_service, 'increment_usage', AsyncMock()):
        variables = {"name": "Oscar"}
        expanded = await template_service.expand_template(123, variables)
        assert expanded["body"] == "Hello, Oscar!"

@pytest.mark.asyncio
async def test_expand_content_nested(template_service):
    content = {"greeting": "Hi, {{ name }}", "details": ["Your code: {{ code }}"]}
    variables = {"name": "Alice", "code": 1234}
    expanded = template_service._expand_content(content, variables)
    assert expanded["greeting"] == "Hi, Alice"
    assert expanded["details"][0] == "Your code: 1234"

@pytest.mark.asyncio
async def test_expand_content_no_vars(template_service):
    content = {"msg": "No vars here."}
    variables = {"unused": "value"}
    expanded = template_service._expand_content(content, variables)
    assert expanded["msg"] == "No vars here." 

@pytest.mark.asyncio
async def test_expand_content_non_str_non_dict(template_service):
    # Should just return the value unchanged
    result = template_service._expand_content(42, {})
    assert result == 42
    result_none = template_service._expand_content(None, {})
    assert result_none is None

def test_expand_content_list(template_service):
    """Test expanding content with list content"""
    content = ["Hello {{ name }}", {"message": "Welcome {{ name }}"}]
    variables = {"name": "John"}
    result = template_service._expand_content(content, variables)
    assert result == ["Hello John", {"message": "Welcome John"}]

def test_expand_content_nested_dict(template_service):
    """Test expanding content with nested dictionary"""
    content = {
        "title": "Welcome {{ name }}",
        "details": {
            "message": "Hello {{ name }}",
            "items": ["Item 1", "Item {{ number }}"]
        }
    }
    variables = {"name": "John", "number": "2"}
    result = template_service._expand_content(content, variables)
    assert result["title"] == "Welcome John"
    assert result["details"]["message"] == "Hello John"
    assert result["details"]["items"] == ["Item 1", "Item 2"]

def test_expand_content_no_variables(template_service):
    """Test expanding content with no variables to replace"""
    content = "Hello World"
    variables = {}
    result = template_service._expand_content(content, variables)
    assert result == "Hello World"

def test_expand_content_missing_variable(template_service):
    """Test expanding content with missing variable"""
    content = "Hello {{ name }}"
    variables = {"other": "value"}
    result = template_service._expand_content(content, variables)
    assert result == "Hello {{ name }}" 