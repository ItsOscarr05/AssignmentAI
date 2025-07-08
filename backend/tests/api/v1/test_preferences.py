import pytest
from fastapi import status
from app.models.preference import Preference
from app.schemas.preference import PreferenceUpdate

def test_get_preferences_success(client, test_user, test_token):
    """Test successful retrieval of user preferences"""
    response = client.get(
        "/api/v1/preferences/",
        headers={"Authorization": f"Bearer {test_token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "theme" in data
    assert "language" in data
    assert "email_notifications" in data

def test_update_preferences_success(client, test_user, test_token, db):
    """Test successful update of user preferences"""
    # Ensure preferences exist
    client.get(
        "/api/v1/preferences/",
        headers={"Authorization": f"Bearer {test_token}"}
    )
    update_data = {
        "theme": "light",
        "language": "es",
        "email_notifications": False
    }
    response = client.patch(
        "/api/v1/preferences/",
        headers={"Authorization": f"Bearer {test_token}"},
        json=update_data
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["theme"] == "light"
    assert data["language"] == "es"
    assert data["email_notifications"] is False

def test_update_preferences_not_found(client, test_user, test_token, db):
    """Test update of preferences when they don't exist"""
    # Delete any existing preferences first
    from app.crud import preference as preference_crud
    preference_crud.delete_preference(db, test_user.id)
    
    update_data = {
        "theme": "light",
        "language": "es"
    }
    
    response = client.patch(
        "/api/v1/preferences/",
        headers={"Authorization": f"Bearer {test_token}"},
        json=update_data
    )
    
    assert response.status_code == status.HTTP_404_NOT_FOUND
    data = response.json()
    assert data["detail"] == "Preferences not found"

def test_reset_preferences_success(client, test_user, test_token, db):
    """Test successful reset of user preferences"""
    # Ensure preferences exist
    client.get(
        "/api/v1/preferences/",
        headers={"Authorization": f"Bearer {test_token}"}
    )
    response = client.post(
        "/api/v1/preferences/reset",
        headers={"Authorization": f"Bearer {test_token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "theme" in data
    assert "language" in data

def test_reset_preferences_not_found(client, test_user, test_token, db):
    """Test reset of preferences when they don't exist"""
    # Delete any existing preferences first
    from app.crud import preference as preference_crud
    preference_crud.delete_preference(db, test_user.id)
    
    response = client.post(
        "/api/v1/preferences/reset",
        headers={"Authorization": f"Bearer {test_token}"}
    )
    
    assert response.status_code == status.HTTP_404_NOT_FOUND
    data = response.json()
    assert data["detail"] == "Preferences not found"

def test_delete_preferences_success(client, test_user, test_token, db):
    """Test successful deletion of user preferences"""
    # Ensure preferences exist
    client.get(
        "/api/v1/preferences/",
        headers={"Authorization": f"Bearer {test_token}"}
    )
    response = client.delete(
        "/api/v1/preferences/",
        headers={"Authorization": f"Bearer {test_token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["message"] == "Preferences deleted successfully"

def test_delete_preferences_not_found(client, test_user, test_token, db):
    """Test deletion of preferences when they don't exist"""
    # Delete any existing preferences first
    from app.crud import preference as preference_crud
    preference_crud.delete_preference(db, test_user.id)
    
    response = client.delete(
        "/api/v1/preferences/",
        headers={"Authorization": f"Bearer {test_token}"}
    )
    
    assert response.status_code == status.HTTP_404_NOT_FOUND
    data = response.json()
    assert data["detail"] == "Preferences not found"

def test_get_preferences_creates_new(client, test_user, test_token, db):
    """Test that getting preferences creates new ones if they don't exist"""
    # Delete any existing preferences first
    from app.crud import preference as preference_crud
    preference_crud.delete_preference(db, test_user.id)
    
    response = client.get(
        "/api/v1/preferences/",
        headers={"Authorization": f"Bearer {test_token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "theme" in data
    assert "language" in data
    assert "email_notifications" in data

def test_update_preferences_partial_update(client, test_user, test_token, db):
    """Test partial update of preferences"""
    # Ensure preferences exist
    client.get(
        "/api/v1/preferences/",
        headers={"Authorization": f"Bearer {test_token}"}
    )
    update_data = {
        "theme": "dark"
    }
    
    response = client.patch(
        "/api/v1/preferences/",
        headers={"Authorization": f"Bearer {test_token}"},
        json=update_data
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["theme"] == "dark"

def test_update_preferences_empty_data(client, test_user, test_token, db):
    """Test update with empty data"""
    # Ensure preferences exist
    client.get(
        "/api/v1/preferences/",
        headers={"Authorization": f"Bearer {test_token}"}
    )
    update_data = {}
    
    response = client.patch(
        "/api/v1/preferences/",
        headers={"Authorization": f"Bearer {test_token}"},
        json=update_data
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "theme" in data
    assert "language" in data

def test_get_preferences_unauthorized(client):
    """Test getting preferences without authentication"""
    response = client.get("/api/v1/preferences/")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_update_preferences_unauthorized(client):
    """Test updating preferences without authentication"""
    update_data = {"theme": "dark"}
    response = client.patch("/api/v1/preferences/", json=update_data)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED 