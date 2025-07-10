import pytest
from fastapi import status
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock
from app.core.security import create_access_token
from app.models.user import User
from app.models.security import SecurityAlert, AuditLog
from app.schemas.security import SecurityAlertCreate, SecurityAlertUpdate

class TestSecurityEndpoints:
    """Test cases for security endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self, db: Session, regular_user: User):
        self.db = db
        self.regular_user = regular_user
        self.access_token = create_access_token(regular_user.id)
        self.headers = {"Authorization": f"Bearer {self.access_token}"}
    
    def test_get_security_metrics_superuser(self, client: TestClient, superuser: User):
        """Test getting security metrics as superuser"""
        superuser_token = create_access_token(superuser.id)
        headers = {"Authorization": f"Bearer {superuser_token}"}
        
        with patch('app.api.v1.endpoints.security.security_monitoring') as mock_monitoring:
            mock_monitoring.generate_security_report.return_value = {
                "total_alerts": 10,
                "high_severity": 3,
                "medium_severity": 5,
                "low_severity": 2
            }
            
            response = client.get("/api/v1/security/metrics", headers=headers)
            
            assert response.status_code == 200
            data = response.json()
            assert "total_alerts" in data
            assert "high_severity" in data
            assert "medium_severity" in data
            assert "low_severity" in data
    
    def test_get_security_metrics_unauthorized(self, client: TestClient):
        """Test getting security metrics without superuser privileges"""
        response = client.get("/api/v1/security/metrics", headers=self.headers)
        assert response.status_code == 403
        assert "Not authorized" in response.json()["detail"]
    
    def test_get_security_alerts_superuser(self, client: TestClient, superuser: User):
        """Test getting security alerts as superuser"""
        superuser_token = create_access_token(superuser.id)
        headers = {"Authorization": f"Bearer {superuser_token}"}
        
        # Create test alerts
        alert1 = SecurityAlert()
        setattr(alert1, 'user_id', superuser.id)
        setattr(alert1, 'alert_type', "failed_login")
        setattr(alert1, 'description', "Multiple failed login attempts")
        setattr(alert1, 'severity', "high")
        setattr(alert1, 'timestamp', datetime.utcnow())
        setattr(alert1, 'alert_metadata', {"ip": "192.168.1.1"})
        setattr(alert1, 'resolved', False)
        
        alert2 = SecurityAlert()
        setattr(alert2, 'user_id', superuser.id)
        setattr(alert2, 'alert_type', "suspicious_activity")
        setattr(alert2, 'description', "Unusual access pattern")
        setattr(alert2, 'severity', "medium")
        setattr(alert2, 'timestamp', datetime.utcnow())
        setattr(alert2, 'alert_metadata', {"location": "unknown"})
        setattr(alert2, 'resolved', True)
        
        self.db.add(alert1)
        self.db.add(alert2)
        self.db.commit()
        
        response = client.get("/api/v1/security/alerts", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert any(alert["alert_type"] == "failed_login" for alert in data)
        assert any(alert["alert_type"] == "suspicious_activity" for alert in data)
    
    def test_get_security_alerts_with_filters(self, client: TestClient, superuser: User):
        """Test getting security alerts with filters"""
        superuser_token = create_access_token(superuser.id)
        headers = {"Authorization": f"Bearer {superuser_token}"}
        
        # Create test alerts
        alert1 = SecurityAlert()
        setattr(alert1, 'user_id', superuser.id)
        setattr(alert1, 'alert_type', "failed_login")
        setattr(alert1, 'description', "Multiple failed login attempts")
        setattr(alert1, 'severity', "high")
        setattr(alert1, 'timestamp', datetime.utcnow())
        setattr(alert1, 'alert_metadata', {"ip": "192.168.1.1"})
        setattr(alert1, 'resolved', False)
        
        alert2 = SecurityAlert()
        setattr(alert2, 'user_id', superuser.id)
        setattr(alert2, 'alert_type', "suspicious_activity")
        setattr(alert2, 'description', "Unusual access pattern")
        setattr(alert2, 'severity', "medium")
        setattr(alert2, 'timestamp', datetime.utcnow())
        setattr(alert2, 'alert_metadata', {"location": "unknown"})
        setattr(alert2, 'resolved', True)
        
        self.db.add(alert1)
        self.db.add(alert2)
        self.db.commit()
        
        # Test with severity filter
        response = client.get("/api/v1/security/alerts?severity=high", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["severity"] == "high"
    
    def test_get_security_alerts_unauthorized(self, client: TestClient):
        """Test getting security alerts without superuser privileges"""
        response = client.get("/api/v1/security/alerts", headers=self.headers)
        assert response.status_code == 403
        assert "Not authorized" in response.json()["detail"]
    
    def test_create_security_alert_superuser(self, client: TestClient, superuser: User):
        """Test creating security alert as superuser"""
        superuser_token = create_access_token(superuser.id)
        headers = {"Authorization": f"Bearer {superuser_token}"}
        
        alert_data = {
            "alert_type": "test_alert",
            "description": "Test security alert",
            "severity": "medium",
            "alert_metadata": {"test": "data"}
        }
        
        response = client.post("/api/v1/security/alerts", json=alert_data, headers=headers)
        
        assert response.status_code == 201
        data = response.json()
        assert data["alert_type"] == "test_alert"
        assert data["description"] == "Test security alert"
        assert data["severity"] == "medium"
        assert data["alert_metadata"] == {"test": "data"}
        assert data["resolved"] == False
    
    def test_create_security_alert_unauthorized(self, client: TestClient):
        """Test creating security alert without superuser privileges"""
        alert_data = {
            "alert_type": "test_alert",
            "description": "Test security alert",
            "severity": "medium",
            "alert_metadata": {"test": "data"}
        }
        
        response = client.post("/api/v1/security/alerts", json=alert_data, headers=self.headers)
        assert response.status_code == 403
        assert "Not authorized" in response.json()["detail"]
    
    def test_update_security_alert_superuser(self, client: TestClient, superuser: User):
        """Test updating security alert as superuser"""
        superuser_token = create_access_token(superuser.id)
        headers = {"Authorization": f"Bearer {superuser_token}"}
        
        # Create test alert
        alert = SecurityAlert()
        setattr(alert, 'user_id', superuser.id)
        setattr(alert, 'alert_type', "test_alert")
        setattr(alert, 'description', "Test security alert")
        setattr(alert, 'severity', "medium")
        setattr(alert, 'timestamp', datetime.utcnow())
        setattr(alert, 'alert_metadata', {"test": "data"})
        setattr(alert, 'resolved', False)
        
        self.db.add(alert)
        self.db.commit()
        self.db.refresh(alert)
        
        update_data = {
            "resolved": True,
            "resolution_notes": "Issue has been resolved"
        }
        
        response = client.patch(f"/api/v1/security/alerts/{alert.id}", json=update_data, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["resolved"] == True
        assert data["resolution_notes"] == "Issue has been resolved"
    
    def test_update_security_alert_not_found(self, client: TestClient, superuser: User):
        """Test updating non-existent security alert"""
        superuser_token = create_access_token(superuser.id)
        headers = {"Authorization": f"Bearer {superuser_token}"}
        
        update_data = {
            "resolved": True,
            "resolution_notes": "Issue has been resolved"
        }
        
        response = client.patch("/api/v1/security/alerts/99999", json=update_data, headers=headers)
        
        assert response.status_code == 404
        assert "Security alert not found" in response.json()["detail"]
    
    def test_update_security_alert_unauthorized(self, client: TestClient):
        """Test updating security alert without superuser privileges"""
        update_data = {
            "resolved": True,
            "resolution_notes": "Issue has been resolved"
        }
        
        response = client.patch("/api/v1/security/alerts/1", json=update_data, headers=self.headers)
        assert response.status_code == 403
        assert "Not authorized" in response.json()["detail"]
    
    def test_get_audit_logs_superuser(self, client: TestClient, superuser: User):
        """Test getting audit logs as superuser"""
        superuser_token = create_access_token(superuser.id)
        headers = {"Authorization": f"Bearer {superuser_token}"}
        
        # Create test audit logs
        log1 = AuditLog()
        setattr(log1, 'user_id', superuser.id)
        setattr(log1, 'action', "login_attempt")
        setattr(log1, 'resource_type', "user")
        setattr(log1, 'resource_id', str(superuser.id))
        setattr(log1, 'timestamp', datetime.utcnow())
        setattr(log1, 'details', {"ip": "192.168.1.1"})
        setattr(log1, 'ip_address', "192.168.1.1")
        setattr(log1, 'user_agent', "test-agent")
        
        log2 = AuditLog()
        setattr(log2, 'user_id', superuser.id)
        setattr(log2, 'action', "file_upload")
        setattr(log2, 'resource_type', "file")
        setattr(log2, 'resource_id', "file123")
        setattr(log2, 'timestamp', datetime.utcnow())
        setattr(log2, 'details', {"filename": "test.pdf"})
        setattr(log2, 'ip_address', "192.168.1.1")
        setattr(log2, 'user_agent', "test-agent")
        
        self.db.add(log1)
        self.db.add(log2)
        self.db.commit()
        
        response = client.get("/api/v1/security/audit-logs", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert any(log["action"] == "login_attempt" for log in data)
        assert any(log["action"] == "file_upload" for log in data)
    
    def test_get_audit_logs_with_filters(self, client: TestClient, superuser: User):
        """Test getting audit logs with filters"""
        superuser_token = create_access_token(superuser.id)
        headers = {"Authorization": f"Bearer {superuser_token}"}
        
        # Create test audit logs
        log1 = AuditLog()
        setattr(log1, 'user_id', superuser.id)
        setattr(log1, 'action', "login_attempt")
        setattr(log1, 'resource_type', "user")
        setattr(log1, 'resource_id', str(superuser.id))
        setattr(log1, 'timestamp', datetime.utcnow())
        setattr(log1, 'details', {"ip": "192.168.1.1"})
        setattr(log1, 'ip_address', "192.168.1.1")
        setattr(log1, 'user_agent', "test-agent")
        
        log2 = AuditLog()
        setattr(log2, 'user_id', superuser.id)
        setattr(log2, 'action', "file_upload")
        setattr(log2, 'resource_type', "file")
        setattr(log2, 'resource_id', "file123")
        setattr(log2, 'timestamp', datetime.utcnow())
        setattr(log2, 'details', {"filename": "test.pdf"})
        setattr(log2, 'ip_address', "192.168.1.1")
        setattr(log2, 'user_agent', "test-agent")
        
        self.db.add(log1)
        self.db.add(log2)
        self.db.commit()
        
        # Test with event_type filter
        response = client.get("/api/v1/security/audit-logs?event_type=login_attempt", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["action"] == "login_attempt"
    
    def test_get_audit_logs_unauthorized(self, client: TestClient):
        """Test getting audit logs without superuser privileges"""
        response = client.get("/api/v1/security/audit-logs", headers=self.headers)
        assert response.status_code == 403
        assert "Not authorized" in response.json()["detail"]
    
    def test_generate_security_report_superuser(self, client: TestClient, superuser: User):
        """Test generating security report as superuser"""
        superuser_token = create_access_token(superuser.id)
        headers = {"Authorization": f"Bearer {superuser_token}"}
        
        with patch('app.api.v1.endpoints.security.security_monitoring') as mock_monitoring:
            mock_monitoring.generate_security_report.return_value = {
                "report_type": "full",
                "period": "last_7_days",
                "summary": "Security report summary",
                "details": {"alerts": 10, "logs": 50}
            }
            
            start_date = (datetime.utcnow() - timedelta(days=7)).isoformat()
            end_date = datetime.utcnow().isoformat()
            
            response = client.post(
                f"/api/v1/security/generate-report?start_date={start_date}&end_date={end_date}&report_type=full",
                headers=headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert "report_type" in data
            assert "period" in data
            assert "summary" in data
            assert "details" in data
    
    def test_generate_security_report_unauthorized(self, client: TestClient):
        """Test generating security report without superuser privileges"""
        start_date = (datetime.utcnow() - timedelta(days=7)).isoformat()
        end_date = datetime.utcnow().isoformat()
        
        response = client.post(
            f"/api/v1/security/generate-report?start_date={start_date}&end_date={end_date}&report_type=full",
            headers=self.headers
        )
        assert response.status_code == 403
        assert "Not authorized" in response.json()["detail"]
    
    def test_security_endpoints_without_authentication(self, client: TestClient):
        """Test security endpoints without authentication"""
        endpoints = [
            "/api/v1/security/metrics",
            "/api/v1/security/alerts",
            "/api/v1/security/audit-logs",
            "/api/v1/security/generate-report"
        ]
        
        for endpoint in endpoints:
            response = client.get(endpoint) if endpoint != "/api/v1/security/generate-report" else client.post(endpoint, json={})
            assert response.status_code == 401
    
    def test_security_endpoints_with_invalid_token(self, client: TestClient):
        """Test security endpoints with invalid token"""
        headers = {"Authorization": "Bearer invalid_token"}
        
        response = client.get("/api/v1/security/metrics", headers=headers)
        assert response.status_code == 401 