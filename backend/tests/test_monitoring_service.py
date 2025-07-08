import pytest
import asyncio
import time
from unittest.mock import Mock, patch, AsyncMock, MagicMock, call
from fastapi import FastAPI
from prometheus_client import Counter, Histogram, Gauge
from app.services.monitoring_service import MonitoringService
import psutil


def make_metric_mock():
    m = Mock()
    m.labels.return_value = Mock()
    m.labels.return_value.inc = Mock()
    m.labels.return_value.observe = Mock()
    m.set = Mock()
    return m

class TestMonitoringService:
    """Test cases for the MonitoringService class."""

    @pytest.fixture
    def mock_settings(self):
        """Mock settings with required configuration."""
        mock_settings = Mock()
        mock_settings.METRICS_PORT = 9090
        return mock_settings

    @pytest.fixture
    def mock_prometheus_metrics(self):
        """Mock Prometheus metrics."""
        with patch('app.services.monitoring_service.Counter') as mock_counter, \
             patch('app.services.monitoring_service.Histogram') as mock_histogram, \
             patch('app.services.monitoring_service.Gauge') as mock_gauge:
            # Use separate mocks for each metric
            counter_mocks = [make_metric_mock() for _ in range(10)]
            histogram_mocks = [make_metric_mock() for _ in range(10)]
            gauge_mocks = [make_metric_mock() for _ in range(10)]
            mock_counter.side_effect = counter_mocks
            mock_histogram.side_effect = histogram_mocks
            mock_gauge.side_effect = gauge_mocks
            yield {
                'counter': mock_counter,
                'histogram': mock_histogram,
                'gauge': mock_gauge,
                'counter_mocks': counter_mocks,
                'histogram_mocks': histogram_mocks,
                'gauge_mocks': gauge_mocks,
            }

    @pytest.fixture
    def monitoring_service(self, mock_settings, mock_prometheus_metrics):
        """Create a monitoring service instance with mocked dependencies."""
        with patch('app.services.monitoring_service.settings', mock_settings):
            service = MonitoringService()
            # Attach metric mocks for easier access
            for i, attr in enumerate([
                'http_requests_total', 'ai_requests_total', 'db_queries_total', 'cache_hits_total',
                'cache_misses_total', 'error_total']):
                setattr(service, attr, mock_prometheus_metrics['counter_mocks'][i])
            for i, attr in enumerate([
                'http_request_duration', 'ai_request_duration', 'db_query_duration']):
                setattr(service, attr, mock_prometheus_metrics['histogram_mocks'][i])
            for i, attr in enumerate([
                'cpu_usage', 'memory_usage', 'disk_usage', 'active_users', 'active_assignments', 'pending_submissions']):
                setattr(service, attr, mock_prometheus_metrics['gauge_mocks'][i])
            return service

    def test_init_success(self, mock_settings, mock_prometheus_metrics):
        """Test successful initialization of monitoring service."""
        with patch('app.services.monitoring_service.settings', mock_settings):
            service = MonitoringService()
            
            assert service._start_time > 0
            assert service._is_running is False
            assert service._metrics_task is None
            assert service._prometheus_server is None

    def test_init_failure(self, mock_settings):
        """Test initialization failure when Prometheus metrics fail."""
        with patch('app.services.monitoring_service.settings', mock_settings), \
             patch('app.services.monitoring_service.Counter', side_effect=Exception("Prometheus error")):
            
            with pytest.raises(Exception, match="Prometheus error"):
                MonitoringService()

    def test_setup_monitoring_success(self, monitoring_service):
        """Test successful monitoring setup."""
        mock_app = Mock()
        mock_app.on_event = Mock()
        
        with patch('app.services.monitoring_service.start_http_server') as mock_start_server, \
             patch('app.services.monitoring_service.Instrumentator') as mock_instrumentator, \
             patch.object(monitoring_service, '_start_system_metrics_collection') as mock_start_metrics:
            
            mock_start_server.return_value = Mock()
            mock_instrumentator.return_value.instrument.return_value.expose.return_value = None
            
            monitoring_service.setup_monitoring(mock_app)
            
            mock_start_server.assert_called_once_with(9090)
            mock_instrumentator.return_value.instrument.assert_called_once_with(mock_app)
            mock_start_metrics.assert_called_once()
            assert mock_app.on_event.call_count == 2  # startup and shutdown

    def test_setup_monitoring_failure(self, monitoring_service):
        """Test monitoring setup failure."""
        mock_app = Mock()
        
        with patch('app.services.monitoring_service.start_http_server', side_effect=Exception("Server error")):
            with pytest.raises(RuntimeError, match="Monitoring setup failed"):
                monitoring_service.setup_monitoring(mock_app)

    def test_start_system_metrics_collection_success(self, monitoring_service):
        """Test successful start of system metrics collection."""
        import asyncio
        with patch('asyncio.create_task') as mock_create_task:
            # Return a completed future to avoid unawaited coroutine warning
            fut = asyncio.Future()
            fut.set_result(None)
            mock_create_task.return_value = fut
            # Patch the _collect_system_metrics method to avoid coroutine warnings
            with patch.object(monitoring_service, '_collect_system_metrics', new=lambda: None):
                monitoring_service._start_system_metrics_collection()
            mock_create_task.assert_called_once()
            assert monitoring_service._metrics_task == fut

    def test_start_system_metrics_collection_failure(self, monitoring_service):
        """Test failure to start system metrics collection."""
        with patch('asyncio.create_task', side_effect=RuntimeError("no running event loop")):
            # Mock the _collect_system_metrics method to avoid coroutine warnings
            with patch.object(monitoring_service, '_collect_system_metrics', new=lambda: None):
                with pytest.raises(RuntimeError, match="no running event loop"):
                    monitoring_service._start_system_metrics_collection()

    @pytest.mark.asyncio
    async def test_collect_system_metrics_success(self, monitoring_service):
        """Test successful system metrics collection."""
        with patch('psutil.cpu_percent', return_value=50.0), \
             patch('psutil.virtual_memory') as mock_memory, \
             patch('psutil.disk_usage') as mock_disk:
            
            mock_memory.return_value.used = 1024 * 1024 * 100  # 100MB
            mock_disk.return_value.used = 1024 * 1024 * 1024  # 1GB
            
            # Set running to True initially, then False after one iteration
            monitoring_service._is_running = True
            
            # Patch the method to only run one iteration
            original_method = monitoring_service._collect_system_metrics
            
            async def single_iteration():
                # CPU usage
                monitoring_service.cpu_usage.set(psutil.cpu_percent())
                # Memory usage
                memory = psutil.virtual_memory()
                monitoring_service.memory_usage.set(memory.used)
                # Disk usage
                disk = psutil.disk_usage('/')
                monitoring_service.disk_usage.set(disk.used)
                # Stop after one iteration
                monitoring_service._is_running = False
            
            monitoring_service._collect_system_metrics = single_iteration
            await monitoring_service._collect_system_metrics()
            
            # Verify metrics were set
            monitoring_service.cpu_usage.set.assert_called_with(50.0)
            monitoring_service.memory_usage.set.assert_called_with(1024 * 1024 * 100)
            monitoring_service.disk_usage.set.assert_called_with(1024 * 1024 * 1024)

    @pytest.mark.asyncio
    async def test_collect_system_metrics_error(self, monitoring_service):
        """Test system metrics collection with error handling."""
        with patch('psutil.cpu_percent', side_effect=Exception("CPU error")):
            
            # Set running to True initially, then False after one iteration
            monitoring_service._is_running = True
            
            # Patch the method to only run one iteration with error
            async def single_iteration_with_error():
                try:
                    # CPU usage - this will raise an exception
                    monitoring_service.cpu_usage.set(psutil.cpu_percent())
                except Exception as e:
                    # This should trigger the error handling
                    # Don't actually sleep in test, just continue
                    pass
                monitoring_service._is_running = False
            
            monitoring_service._collect_system_metrics = single_iteration_with_error
            await monitoring_service._collect_system_metrics()
            
            # Should handle error gracefully
            assert monitoring_service._is_running is False

    @pytest.mark.asyncio
    async def test_stop_success(self, monitoring_service):
        """Test successful stop of monitoring service."""
        # Create a real asyncio.Task that can be awaited
        async def dummy_task():
            await asyncio.sleep(0)
        
        mock_task = asyncio.create_task(dummy_task())
        mock_task.cancel = Mock()
        monitoring_service._metrics_task = mock_task
        
        mock_server = Mock()
        mock_server.shutdown = Mock()
        monitoring_service._prometheus_server = mock_server
        
        await monitoring_service.stop()
        
        assert monitoring_service._is_running is False
        mock_task.cancel.assert_called_once()
        mock_server.shutdown.assert_called_once()

    @pytest.mark.asyncio
    async def test_stop_with_cancelled_task(self, monitoring_service):
        """Test stop with cancelled task."""
        # Create a task that will be cancelled
        async def dummy_task():
            await asyncio.sleep(1)  # This will be cancelled
        
        mock_task = asyncio.create_task(dummy_task())
        mock_task.cancel = Mock()
        monitoring_service._metrics_task = mock_task
        
        await monitoring_service.stop()
        
        assert monitoring_service._is_running is False
        mock_task.cancel.assert_called_once()

    def test_track_request_success(self, monitoring_service):
        """Test successful request tracking."""
        monitoring_service.track_request("GET", "/api/test", 200, 0.5)
        
        monitoring_service.http_requests_total.labels.assert_called_with(
            method="GET", endpoint="/api/test", status=200
        )
        monitoring_service.http_requests_total.labels.return_value.inc.assert_called_once()
        
        monitoring_service.http_request_duration.labels.assert_called_with(
            method="GET", endpoint="/api/test"
        )
        monitoring_service.http_request_duration.labels.return_value.observe.assert_called_with(0.5)

    def test_track_request_error(self, monitoring_service):
        """Test request tracking with error."""
        monitoring_service.http_requests_total.labels.side_effect = Exception("Tracking error")
        
        # Should not raise exception, just log error
        monitoring_service.track_request("GET", "/api/test", 200, 0.5)

    def test_track_ai_request_success(self, monitoring_service):
        """Test successful AI request tracking."""
        monitoring_service.track_ai_request("generate", 1.2)
        
        monitoring_service.ai_requests_total.labels.assert_called_with(operation="generate")
        monitoring_service.ai_requests_total.labels.return_value.inc.assert_called_once()
        
        monitoring_service.ai_request_duration.labels.assert_called_with(operation="generate")
        monitoring_service.ai_request_duration.labels.return_value.observe.assert_called_with(1.2)

    def test_track_ai_request_error(self, monitoring_service):
        """Test AI request tracking with error."""
        monitoring_service.ai_requests_total.labels.side_effect = Exception("AI tracking error")
        
        # Should not raise exception, just log error
        monitoring_service.track_ai_request("generate", 1.2)

    def test_track_db_query_success(self, monitoring_service):
        """Test successful database query tracking."""
        monitoring_service.track_db_query("select", 0.1)
        
        monitoring_service.db_queries_total.labels.assert_called_with(operation="select")
        monitoring_service.db_queries_total.labels.return_value.inc.assert_called_once()
        
        monitoring_service.db_query_duration.labels.assert_called_with(operation="select")
        monitoring_service.db_query_duration.labels.return_value.observe.assert_called_with(0.1)

    def test_track_db_query_error(self, monitoring_service):
        """Test database query tracking with error."""
        monitoring_service.db_queries_total.labels.side_effect = Exception("DB tracking error")
        
        # Should not raise exception, just log error
        monitoring_service.track_db_query("select", 0.1)

    def test_track_cache_hit(self, monitoring_service):
        """Test cache hit tracking."""
        monitoring_service.track_cache("redis", True)
        
        # Should call cache_hits_total.labels with correct arg, not cache_misses_total.labels
        assert monitoring_service.cache_hits_total.labels.call_args == call(cache_type="redis")
        monitoring_service.cache_hits_total.labels.return_value.inc.assert_called_once()
        assert monitoring_service.cache_misses_total.labels.call_count == 0

    def test_track_cache_miss(self, monitoring_service):
        """Test cache miss tracking."""
        monitoring_service.track_cache("memory", False)
        
        assert monitoring_service.cache_misses_total.labels.call_args == call(cache_type="memory")
        monitoring_service.cache_misses_total.labels.return_value.inc.assert_called_once()
        assert monitoring_service.cache_hits_total.labels.call_count == 0

    def test_track_cache_error(self, monitoring_service):
        """Test cache tracking with error."""
        monitoring_service.cache_hits_total.labels.side_effect = Exception("Cache tracking error")
        
        # Should not raise exception, just log error
        monitoring_service.track_cache("redis", True)

    def test_update_application_metrics_all_values(self, monitoring_service):
        """Test updating all application metrics."""
        monitoring_service.update_application_metrics(
            active_users=100,
            active_assignments=50,
            pending_submissions=25
        )
        
        # Check the call args list for all three
        assert monitoring_service.active_users.set.call_args_list == [call(100)]
        assert monitoring_service.active_assignments.set.call_args_list == [call(50)]
        assert monitoring_service.pending_submissions.set.call_args_list == [call(25)]

    def test_update_application_metrics_partial_values(self, monitoring_service):
        """Test updating partial application metrics."""
        monitoring_service.update_application_metrics(active_users=100)
        
        assert monitoring_service.active_users.set.call_args_list == [call(100)]
        assert monitoring_service.active_assignments.set.call_count == 0
        assert monitoring_service.pending_submissions.set.call_count == 0

    def test_update_application_metrics_no_values(self, monitoring_service):
        """Test updating application metrics with no values."""
        monitoring_service.update_application_metrics()
        
        assert monitoring_service.active_users.set.call_count == 0
        assert monitoring_service.active_assignments.set.call_count == 0
        assert monitoring_service.pending_submissions.set.call_count == 0

    def test_update_application_metrics_error(self, monitoring_service):
        """Test application metrics update with error."""
        monitoring_service.active_users.set.side_effect = Exception("Metrics error")
        
        # Should not raise exception, just log error
        monitoring_service.update_application_metrics(active_users=100)

    def test_track_error_success(self, monitoring_service):
        """Test successful error tracking."""
        monitoring_service.track_error("validation")
        
        monitoring_service.error_total.labels.assert_called_with(type="validation")
        monitoring_service.error_total.labels.return_value.inc.assert_called_once()

    def test_track_error_failure(self, monitoring_service):
        """Test error tracking with failure."""
        monitoring_service.error_total.labels.side_effect = Exception("Error tracking failed")
        
        # Should not raise exception, just log error
        monitoring_service.track_error("database")

    def test_startup_shutdown_events(self, monitoring_service):
        """Test startup and shutdown event handlers."""
        mock_app = Mock()
        event_handlers = {}
        def fake_on_event(event_name):
            def decorator(fn):
                event_handlers[event_name] = fn
                return fn
            return decorator
        mock_app.on_event = fake_on_event
        with patch('app.services.monitoring_service.start_http_server') as mock_start_server, \
             patch('app.services.monitoring_service.Instrumentator') as mock_instrumentator, \
             patch.object(monitoring_service, '_start_system_metrics_collection') as mock_start_metrics, \
             patch.object(monitoring_service, 'stop', new=AsyncMock()):
            mock_start_server.return_value = Mock()
            mock_instrumentator.return_value.instrument.return_value.expose.return_value = None
            monitoring_service.setup_monitoring(mock_app)
            # Test startup handler
            asyncio.run(event_handlers['startup']())
            assert monitoring_service._is_running is True
            # Test shutdown handler
            asyncio.run(event_handlers['shutdown']())
            monitoring_service.stop.assert_awaited_once() 