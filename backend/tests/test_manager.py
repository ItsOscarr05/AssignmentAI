from typing import Dict, Any, List, Optional, Callable
import asyncio
import pytest
import logging
import random
import time
from datetime import datetime, timedelta
from dataclasses import dataclass
from prometheus_client import Histogram
from concurrent.futures import ThreadPoolExecutor
from backend.config import settings

logger = logging.getLogger(__name__)

@dataclass
class TestCase:
    name: str
    func: Callable
    category: str
    priority: int
    timeout: int = 30
    retries: int = 3
    dependencies: List[str] = None
    tags: List[str] = None
    expected_performance: Optional[float] = None

@dataclass
class TestResult:
    test_case: TestCase
    success: bool
    duration: float
    error: Optional[Exception] = None
    performance_regression: bool = False
    logs: List[str] = None

class TestManager:
    def __init__(self):
        self.test_cases: Dict[str, TestCase] = {}
        self.test_results: Dict[str, List[TestResult]] = {}
        self.performance_history: Dict[str, List[float]] = {}
        self.execution_time = Histogram(
            'test_execution_seconds',
            'Test execution time in seconds',
            ['test_name', 'category']
        )
        self._setup_default_test_cases()

    def _setup_default_test_cases(self):
        """Register default test cases"""
        # Unit tests
        self.register_test(
            TestCase(
                name="test_database_connection",
                func=self._test_database_connection,
                category="unit",
                priority=1,
                tags=["database", "connection"]
            )
        )
        
        # Integration tests
        self.register_test(
            TestCase(
                name="test_api_endpoints",
                func=self._test_api_endpoints,
                category="integration",
                priority=2,
                tags=["api", "endpoints"]
            )
        )
        
        # Performance tests
        self.register_test(
            TestCase(
                name="test_query_performance",
                func=self._test_query_performance,
                category="performance",
                priority=3,
                expected_performance=0.1,
                tags=["database", "performance"]
            )
        )
        
        # Chaos tests
        self.register_test(
            TestCase(
                name="test_network_failure",
                func=self._test_network_failure,
                category="chaos",
                priority=4,
                tags=["network", "resilience"]
            )
        )

    def register_test(self, test_case: TestCase):
        """Register a new test case"""
        self.test_cases[test_case.name] = test_case
        if test_case.name not in self.performance_history:
            self.performance_history[test_case.name] = []

    async def _test_database_connection(self) -> bool:
        """Test database connection and basic operations"""
        try:
            # Implement database connection test
            await asyncio.sleep(0.1)  # Simulated test
            return True
        except Exception as e:
            logger.error(f"Database connection test failed: {str(e)}")
            raise

    async def _test_api_endpoints(self) -> bool:
        """Test API endpoints for availability and correct responses"""
        try:
            # Implement API endpoint tests
            await asyncio.sleep(0.1)  # Simulated test
            return True
        except Exception as e:
            logger.error(f"API endpoint test failed: {str(e)}")
            raise

    async def _test_query_performance(self) -> bool:
        """Test database query performance"""
        try:
            # Implement query performance test
            await asyncio.sleep(0.1)  # Simulated test
            return True
        except Exception as e:
            logger.error(f"Query performance test failed: {str(e)}")
            raise

    async def _test_network_failure(self) -> bool:
        """Test system behavior under network failure conditions"""
        try:
            # Implement network failure test
            await asyncio.sleep(0.1)  # Simulated test
            return True
        except Exception as e:
            logger.error(f"Network failure test failed: {str(e)}")
            raise

    async def run_test(self, test_case: TestCase) -> TestResult:
        """Run a single test case with retries and timing"""
        logs = []
        start_time = time.time()
        
        for attempt in range(test_case.retries):
            try:
                success = await asyncio.wait_for(
                    test_case.func(),
                    timeout=test_case.timeout
                )
                duration = time.time() - start_time
                
                # Record execution time
                self.execution_time.labels(
                    test_name=test_case.name,
                    category=test_case.category
                ).observe(duration)
                
                # Check for performance regression
                self.performance_history[test_case.name].append(duration)
                performance_regression = self._check_performance_regression(
                    test_case.name,
                    duration,
                    test_case.expected_performance
                )
                
                return TestResult(
                    test_case=test_case,
                    success=success,
                    duration=duration,
                    performance_regression=performance_regression,
                    logs=logs
                )
            
            except asyncio.TimeoutError:
                logs.append(f"Attempt {attempt + 1} timed out")
                if attempt == test_case.retries - 1:
                    raise
            
            except Exception as e:
                logs.append(f"Attempt {attempt + 1} failed: {str(e)}")
                if attempt == test_case.retries - 1:
                    return TestResult(
                        test_case=test_case,
                        success=False,
                        duration=time.time() - start_time,
                        error=e,
                        logs=logs
                    )

    def _check_performance_regression(
        self,
        test_name: str,
        duration: float,
        expected_performance: Optional[float]
    ) -> bool:
        """Check for performance regression using historical data"""
        history = self.performance_history[test_name]
        if len(history) < 5:
            return False
        
        # Calculate baseline from recent history
        recent_avg = sum(history[-5:]) / 5
        
        # Check against expected performance if provided
        if expected_performance and duration > expected_performance * 1.5:
            return True
        
        # Check against historical performance
        return duration > recent_avg * 1.5

    async def run_test_suite(
        self,
        categories: Optional[List[str]] = None,
        tags: Optional[List[str]] = None
    ) -> Dict[str, List[TestResult]]:
        """Run a suite of tests with filtering options"""
        test_cases = self._filter_test_cases(categories, tags)
        results = {}
        
        # Sort test cases by priority
        sorted_cases = sorted(
            test_cases.values(),
            key=lambda x: x.priority
        )
        
        for test_case in sorted_cases:
            # Check dependencies
            if test_case.dependencies:
                for dep in test_case.dependencies:
                    if dep in results and not results[dep][-1].success:
                        logger.warning(
                            f"Skipping {test_case.name} due to failed dependency {dep}"
                        )
                        continue
            
            result = await self.run_test(test_case)
            
            if test_case.name not in results:
                results[test_case.name] = []
            results[test_case.name].append(result)
            
            # Log test results
            self._log_test_result(result)
        
        return results

    def _filter_test_cases(
        self,
        categories: Optional[List[str]] = None,
        tags: Optional[List[str]] = None
    ) -> Dict[str, TestCase]:
        """Filter test cases by categories and tags"""
        if not categories and not tags:
            return self.test_cases
        
        filtered = {}
        for name, case in self.test_cases.items():
            if categories and case.category not in categories:
                continue
            if tags and not any(tag in case.tags for tag in tags):
                continue
            filtered[name] = case
        
        return filtered

    def _log_test_result(self, result: TestResult):
        """Log test result with appropriate level"""
        if result.success and not result.performance_regression:
            logger.info(
                f"Test {result.test_case.name} passed in {result.duration:.2f}s"
            )
        elif result.performance_regression:
            logger.warning(
                f"Test {result.test_case.name} showed performance regression: "
                f"{result.duration:.2f}s"
            )
        else:
            logger.error(
                f"Test {result.test_case.name} failed in {result.duration:.2f}s: "
                f"{str(result.error)}"
            )

    async def run_chaos_tests(self) -> Dict[str, List[TestResult]]:
        """Run chaos testing suite"""
        chaos_tests = self._filter_test_cases(categories=["chaos"])
        return await self.run_test_suite(categories=["chaos"])

    async def run_performance_tests(self) -> Dict[str, List[TestResult]]:
        """Run performance testing suite"""
        return await self.run_test_suite(categories=["performance"])

    async def analyze_test_results(
        self,
        results: Dict[str, List[TestResult]]
    ) -> Dict[str, Any]:
        """Analyze test results and generate report"""
        analysis = {
            "total_tests": 0,
            "passed": 0,
            "failed": 0,
            "performance_regressions": 0,
            "average_duration": 0.0,
            "categories": {},
            "failures": [],
            "regressions": []
        }
        
        total_duration = 0
        for test_name, test_results in results.items():
            for result in test_results:
                analysis["total_tests"] += 1
                total_duration += result.duration
                
                # Update category statistics
                category = result.test_case.category
                if category not in analysis["categories"]:
                    analysis["categories"][category] = {
                        "total": 0,
                        "passed": 0,
                        "failed": 0,
                        "regressions": 0
                    }
                
                analysis["categories"][category]["total"] += 1
                
                if result.success:
                    analysis["passed"] += 1
                    analysis["categories"][category]["passed"] += 1
                else:
                    analysis["failed"] += 1
                    analysis["categories"][category]["failed"] += 1
                    analysis["failures"].append({
                        "test_name": test_name,
                        "error": str(result.error),
                        "duration": result.duration
                    })
                
                if result.performance_regression:
                    analysis["performance_regressions"] += 1
                    analysis["categories"][category]["regressions"] += 1
                    analysis["regressions"].append({
                        "test_name": test_name,
                        "duration": result.duration,
                        "expected": result.test_case.expected_performance
                    })
        
        if analysis["total_tests"] > 0:
            analysis["average_duration"] = total_duration / analysis["total_tests"]
        
        return analysis

    async def generate_test_report(
        self,
        results: Dict[str, List[TestResult]]
    ) -> str:
        """Generate a detailed test report"""
        analysis = await self.analyze_test_results(results)
        
        report = [
            "Test Execution Report",
            "===================",
            f"Total Tests: {analysis['total_tests']}",
            f"Passed: {analysis['passed']}",
            f"Failed: {analysis['failed']}",
            f"Performance Regressions: {analysis['performance_regressions']}",
            f"Average Duration: {analysis['average_duration']:.2f}s",
            "",
            "Category Breakdown",
            "-----------------"
        ]
        
        for category, stats in analysis["categories"].items():
            report.extend([
                f"{category}:",
                f"  Total: {stats['total']}",
                f"  Passed: {stats['passed']}",
                f"  Failed: {stats['failed']}",
                f"  Regressions: {stats['regressions']}"
            ])
        
        if analysis["failures"]:
            report.extend([
                "",
                "Failures",
                "--------"
            ])
            for failure in analysis["failures"]:
                report.extend([
                    f"{failure['test_name']}:",
                    f"  Error: {failure['error']}",
                    f"  Duration: {failure['duration']:.2f}s"
                ])
        
        if analysis["regressions"]:
            report.extend([
                "",
                "Performance Regressions",
                "----------------------"
            ])
            for regression in analysis["regressions"]:
                report.extend([
                    f"{regression['test_name']}:",
                    f"  Duration: {regression['duration']:.2f}s",
                    f"  Expected: {regression['expected']:.2f}s"
                ])
        
        return "\n".join(report)

# Global test manager instance
test_manager = TestManager() 