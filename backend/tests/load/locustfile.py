"""
Load testing configuration for AssignmentAI using Locust.
"""

import json
import random
from typing import Dict, Any
from locust import HttpUser, task, between
from locust.clients import HttpSession
from datetime import datetime

class AssignmentUser(HttpUser):
    """Simulated user for load testing."""
    
    # Wait between 1 and 5 seconds between tasks
    wait_time = between(1, 5)
    
    def on_start(self):
        """Setup user session."""
        # Login to get auth token
        response = self.client.post(
            "/api/token",
            data={
                "username": "test@example.com",
                "password": "testpassword123"
            }
        )
        
        if response.status_code != 200:
            raise Exception("Failed to authenticate")
        
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def generate_assignment_data(self) -> Dict[str, Any]:
        """Generate random assignment data."""
        subjects = ["mathematics", "science", "english", "history"]
        grade_levels = ["elementary", "middle_school", "high_school", "college"]
        
        return {
            "subject": random.choice(subjects),
            "grade_level": random.choice(grade_levels),
            "assignment_text": f"Load test assignment {datetime.now().isoformat()}",
            "additional_requirements": [
                "Test requirement 1",
                "Test requirement 2"
            ]
        }
    
    @task(3)
    def create_assignment(self):
        """Create new assignment."""
        assignment_data = self.generate_assignment_data()
        
        with self.client.post(
            "/api/assignments",
            json=assignment_data,
            headers=self.headers,
            catch_response=True
        ) as response:
            if response.status_code == 200:
                task_id = response.json()["id"]
                self.task_ids = getattr(self, "task_ids", [])
                self.task_ids.append(task_id)
            else:
                response.failure(f"Failed to create assignment: {response.text}")
    
    @task(2)
    def check_assignment_status(self):
        """Check status of existing assignments."""
        if not hasattr(self, "task_ids") or not self.task_ids:
            return
        
        task_id = random.choice(self.task_ids)
        with self.client.get(
            f"/api/tasks/{task_id}",
            headers=self.headers,
            catch_response=True
        ) as response:
            if response.status_code == 200:
                status = response.json()["status"]
                if status == "failed":
                    response.failure(f"Task failed: {response.text}")
            else:
                response.failure(f"Failed to get task status: {response.text}")
    
    @task(1)
    def get_assignment_result(self):
        """Retrieve completed assignment results."""
        if not hasattr(self, "task_ids") or not self.task_ids:
            return
        
        task_id = random.choice(self.task_ids)
        with self.client.get(
            f"/api/assignments/{task_id}",
            headers=self.headers,
            catch_response=True
        ) as response:
            if response.status_code not in [200, 404]:
                response.failure(f"Failed to get assignment result: {response.text}")
    
    @task(1)
    def check_health(self):
        """Check API health."""
        with self.client.get("/api/health", catch_response=True) as response:
            if response.status_code != 200:
                response.failure(f"Health check failed: {response.text}")
            elif response.json()["status"] != "healthy":
                response.failure("System reported unhealthy state")

class AdminUser(HttpUser):
    """Simulated admin user for testing admin functions."""
    
    wait_time = between(5, 15)
    
    def on_start(self):
        """Setup admin session."""
        response = self.client.post(
            "/api/token",
            data={
                "username": "admin@example.com",
                "password": "adminpassword123"
            }
        )
        
        if response.status_code != 200:
            raise Exception("Failed to authenticate as admin")
        
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    @task
    def check_metrics(self):
        """Check system metrics."""
        with self.client.get(
            "/api/metrics",
            headers=self.headers,
            catch_response=True
        ) as response:
            if response.status_code != 200:
                response.failure(f"Failed to get metrics: {response.text}")
    
    @task
    def check_error_logs(self):
        """Check system error logs."""
        with self.client.get(
            "/api/admin/errors",
            headers=self.headers,
            catch_response=True
        ) as response:
            if response.status_code != 200:
                response.failure(f"Failed to get error logs: {response.text}")

# Configuration for running the load test
class LoadTestConfig:
    """Load test configuration."""
    
    # Test parameters
    USERS = 50
    SPAWN_RATE = 5
    RUN_TIME = "10m"
    
    # Test thresholds
    MAX_RESPONSE_TIME = 500  # milliseconds
    MAX_ERROR_RATE = 1  # percent
    
    # Endpoints to test
    ENDPOINTS = [
        "/api/assignments",
        "/api/tasks/{task_id}",
        "/api/health",
        "/api/metrics"
    ] 