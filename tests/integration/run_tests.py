#!/usr/bin/env python3
import os
import sys
import pytest
import argparse
from datetime import datetime

def run_tests(test_paths=None, verbose=False, coverage=False):
    """Run integration tests with specified options"""
    # Get the directory containing this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Default test paths if none provided
    if not test_paths:
        test_paths = [
            os.path.join(script_dir, "api"),
            os.path.join(script_dir, "e2e")
        ]
    
    # Build pytest arguments
    args = []
    
    if verbose:
        args.append("-v")
    
    if coverage:
        args.extend([
            "--cov=backend",
            "--cov-report=term-missing",
            "--cov-report=html"
        ])
    
    # Add test paths
    args.extend(test_paths)
    
    # Run tests
    start_time = datetime.now()
    result = pytest.main(args)
    end_time = datetime.now()
    
    # Print summary
    duration = end_time - start_time
    print(f"\nTest execution completed in {duration}")
    
    return result

def main():
    """Main entry point for running tests"""
    parser = argparse.ArgumentParser(description="Run integration tests")
    parser.add_argument(
        "-v", "--verbose",
        action="store_true",
        help="Enable verbose output"
    )
    parser.add_argument(
        "-c", "--coverage",
        action="store_true",
        help="Generate coverage report"
    )
    parser.add_argument(
        "test_paths",
        nargs="*",
        help="Specific test paths to run (default: all tests)"
    )
    
    args = parser.parse_args()
    
    # Run tests
    result = run_tests(
        test_paths=args.test_paths,
        verbose=args.verbose,
        coverage=args.coverage
    )
    
    # Exit with appropriate status code
    sys.exit(result)

if __name__ == "__main__":
    main() 