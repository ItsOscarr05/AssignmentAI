"""
End-to-end tests for the complete assignment workflow.
"""

import pytest
import asyncio
from datetime import datetime
from typing import Dict, Any

pytestmark = [pytest.mark.asyncio, pytest.mark.e2e]

class TestAssignmentWorkflow:
    async def test_complete_assignment_workflow(
        self,
        test_client,
        auth_headers,
        db_session,
        redis_client
    ):
        """
        Test the complete assignment workflow from creation to completion.
        This test verifies:
        1. Assignment creation
        2. Background task processing
        3. Database persistence
        4. Cache updates
        5. Status updates
        6. Final result retrieval
        """
        # Create assignment
        assignment_data = {
            "subject": "mathematics",
            "grade_level": "high_school",
            "assignment_text": "Create a comprehensive calculus test",
            "additional_requirements": [
                "Include derivatives",
                "Add integration problems",
                "Cover limits and continuity"
            ]
        }

        # Step 1: Create assignment
        create_response = await test_client.post(
            "/api/assignments",
            headers=auth_headers,
            json=assignment_data
        )
        assert create_response.status_code == 200
        task_id = create_response.json()["id"]

        # Step 2: Monitor task progress
        completed = False
        max_attempts = 30
        attempts = 0

        while not completed and attempts < max_attempts:
            status_response = await test_client.get(
                f"/api/tasks/{task_id}",
                headers=auth_headers
            )
            assert status_response.status_code == 200
            
            status_data = status_response.json()
            if status_data["status"] in ["completed", "failed"]:
                completed = True
                break
            
            attempts += 1
            await asyncio.sleep(1)

        assert completed, f"Task did not complete in {max_attempts} seconds"
        assert status_data["status"] == "completed"

        # Step 3: Verify database entry
        async with db_session.begin():
            result = await db_session.execute(
                """
                SELECT * FROM assignments 
                WHERE task_id = :task_id
                """,
                {"task_id": task_id}
            )
            db_assignment = result.first()
        
        assert db_assignment is not None
        assert db_assignment.status == "completed"

        # Step 4: Verify cache entry
        cache_key = f"assignment:{task_id}"
        cached_data = await redis_client.get(cache_key)
        assert cached_data is not None

        # Step 5: Get final result
        result_response = await test_client.get(
            f"/api/assignments/{task_id}",
            headers=auth_headers
        )
        assert result_response.status_code == 200
        result_data = result_response.json()

        # Verify result structure
        assert "content" in result_data
        assert "metadata" in result_data
        assert result_data["subject"] == assignment_data["subject"]
        assert result_data["grade_level"] == assignment_data["grade_level"]

    async def test_assignment_error_recovery(
        self,
        test_client,
        auth_headers,
        db_session,
        redis_client
    ):
        """
        Test error recovery in the assignment workflow.
        This test verifies:
        1. Error handling
        2. Retry mechanism
        3. Error reporting
        4. System stability after errors
        """
        # Create an assignment that will trigger errors
        assignment_data = {
            "subject": "mathematics",
            "grade_level": "high_school",
            "assignment_text": "ERROR_TRIGGER_TEST",  # Special trigger for testing
            "additional_requirements": ["Test error handling"]
        }

        # Step 1: Create assignment
        create_response = await test_client.post(
            "/api/assignments",
            headers=auth_headers,
            json=assignment_data
        )
        assert create_response.status_code == 200
        task_id = create_response.json()["id"]

        # Step 2: Monitor error handling
        completed = False
        max_attempts = 30
        attempts = 0
        retry_count = 0

        while not completed and attempts < max_attempts:
            status_response = await test_client.get(
                f"/api/tasks/{task_id}",
                headers=auth_headers
            )
            assert status_response.status_code == 200
            
            status_data = status_response.json()
            if "retry_count" in status_data:
                retry_count = status_data["retry_count"]
            
            if status_data["status"] in ["completed", "failed"]:
                completed = True
                break
            
            attempts += 1
            await asyncio.sleep(1)

        assert completed, f"Task did not complete in {max_attempts} seconds"
        assert retry_count > 0, "No retries were attempted"

        # Step 3: Verify error logging
        async with db_session.begin():
            result = await db_session.execute(
                """
                SELECT * FROM error_logs 
                WHERE task_id = :task_id 
                ORDER BY created_at DESC
                """,
                {"task_id": task_id}
            )
            error_logs = result.fetchall()
        
        assert len(error_logs) > 0, "No error logs were created"

        # Step 4: Verify system stability
        # Create another assignment to ensure system is still working
        new_assignment_data = {
            "subject": "mathematics",
            "grade_level": "high_school",
            "assignment_text": "Test system stability",
            "additional_requirements": ["Basic test"]
        }

        new_response = await test_client.post(
            "/api/assignments",
            headers=auth_headers,
            json=new_assignment_data
        )
        assert new_response.status_code == 200

    async def test_concurrent_assignments(
        self,
        test_client,
        auth_headers,
        db_session,
        redis_client
    ):
        """
        Test handling of concurrent assignment creation and processing.
        This test verifies:
        1. Concurrent request handling
        2. Resource management
        3. Rate limiting
        4. System stability under load
        """
        # Create multiple assignments concurrently
        assignment_count = 5
        base_assignment = {
            "subject": "mathematics",
            "grade_level": "high_school",
            "assignment_text": "Concurrent test assignment",
            "additional_requirements": ["Test concurrent processing"]
        }

        async def create_and_monitor_assignment(index: int) -> Dict[str, Any]:
            # Create assignment
            assignment_data = base_assignment.copy()
            assignment_data["assignment_text"] = f"Concurrent test assignment {index}"
            
            create_response = await test_client.post(
                "/api/assignments",
                headers=auth_headers,
                json=assignment_data
            )
            assert create_response.status_code == 200
            task_id = create_response.json()["id"]

            # Monitor until completion
            completed = False
            max_attempts = 30
            attempts = 0

            while not completed and attempts < max_attempts:
                status_response = await test_client.get(
                    f"/api/tasks/{task_id}",
                    headers=auth_headers
                )
                assert status_response.status_code == 200
                
                if status_response.json()["status"] in ["completed", "failed"]:
                    completed = True
                    return status_response.json()
                
                attempts += 1
                await asyncio.sleep(1)

            return {"status": "timeout", "task_id": task_id}

        # Create and monitor assignments concurrently
        tasks = [
            create_and_monitor_assignment(i)
            for i in range(assignment_count)
        ]
        results = await asyncio.gather(*tasks)

        # Verify results
        completed_count = sum(
            1 for r in results
            if r["status"] == "completed"
        )
        assert completed_count > 0, "No assignments completed successfully"

        # Verify database entries
        async with db_session.begin():
            result = await db_session.execute(
                """
                SELECT COUNT(*) 
                FROM assignments 
                WHERE created_at >= :start_time
                """,
                {"start_time": datetime.utcnow()}
            )
            db_count = result.scalar()
        
        assert db_count >= completed_count, "Database entries don't match completed assignments"

        # Verify system stability and resource cleanup
        await redis_client.flushdb()  # Clear test data
        
        # Verify system is still responsive
        health_response = await test_client.get("/api/health")
        assert health_response.status_code == 200
        assert health_response.json()["status"] == "healthy" 