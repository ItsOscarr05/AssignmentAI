import pytest
import time
import asyncio
from concurrent.futures import ThreadPoolExecutor
from typing import List
import statistics

@pytest.mark.performance
async def test_api_response_time(client, test_user_token):
    """Test API endpoint response times"""
    headers = {"Authorization": f"Bearer {test_user_token}"}
    response_times = []
    
    # Test endpoint response times
    for _ in range(10):  # Run 10 times for average
        start_time = time.time()
        response = client.get("/api/health", headers=headers)
        end_time = time.time()
        
        assert response.status_code == 200
        response_times.append(end_time - start_time)
    
    avg_response_time = statistics.mean(response_times)
    p95_response_time = statistics.quantiles(response_times, n=20)[18]  # 95th percentile
    
    # Assert performance requirements
    assert avg_response_time < 0.1  # Average response time under 100ms
    assert p95_response_time < 0.2  # 95th percentile under 200ms

@pytest.mark.performance
async def test_cache_performance(mock_redis):
    """Test cache operation performance"""
    test_key = "perf_test_key"
    test_value = "x" * 1000  # 1KB of data
    iterations = 100
    
    # Test write performance
    write_times = []
    for _ in range(iterations):
        start_time = time.time()
        await mock_redis.set(test_key, test_value)
        write_times.append(time.time() - start_time)
    
    # Test read performance
    read_times = []
    for _ in range(iterations):
        start_time = time.time()
        await mock_redis.get(test_key)
        read_times.append(time.time() - start_time)
    
    avg_write_time = statistics.mean(write_times)
    avg_read_time = statistics.mean(read_times)
    
    # Assert cache performance requirements
    assert avg_write_time < 0.005  # Write operations under 5ms
    assert avg_read_time < 0.002   # Read operations under 2ms

@pytest.mark.performance
@pytest.mark.slow
async def test_concurrent_requests(client, test_user_token):
    """Test handling of concurrent requests"""
    headers = {"Authorization": f"Bearer {test_user_token}"}
    num_requests = 50
    
    async def make_request():
        response = client.get("/api/health", headers=headers)
        return response.status_code
    
    # Execute requests concurrently
    with ThreadPoolExecutor(max_workers=10) as executor:
        loop = asyncio.get_event_loop()
        tasks = [loop.run_in_executor(executor, make_request) for _ in range(num_requests)]
        results = await asyncio.gather(*tasks)
    
    # Verify all requests succeeded
    assert all(status == 200 for status in results)

@pytest.mark.performance
@pytest.mark.slow
async def test_memory_usage():
    """Test memory usage during operations"""
    import psutil
    import os
    
    process = psutil.Process(os.getpid())
    initial_memory = process.memory_info().rss / 1024 / 1024  # Convert to MB
    
    # Perform memory-intensive operations
    large_data = ["x" * 1000 for _ in range(1000)]  # Create some data
    
    final_memory = process.memory_info().rss / 1024 / 1024
    memory_increase = final_memory - initial_memory
    
    # Assert reasonable memory usage
    assert memory_increase < 50  # Memory increase should be less than 50MB

@pytest.mark.performance
async def test_database_connection_pool(client):
    """Test database connection pool performance"""
    from backend.database import get_db
    
    async def measure_connection_time():
        start_time = time.time()
        async with get_db() as db:
            await db.execute("SELECT 1")
        return time.time() - start_time
    
    # Measure connection times
    connection_times = []
    for _ in range(20):
        time_taken = await measure_connection_time()
        connection_times.append(time_taken)
    
    avg_connection_time = statistics.mean(connection_times)
    assert avg_connection_time < 0.01  # Connection time under 10ms 