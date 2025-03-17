"""
Script to run load tests and analyze results.
"""

import subprocess
import json
import sys
import os
from datetime import datetime
import pandas as pd
import matplotlib.pyplot as plt
from pathlib import Path

def run_load_test(
    host: str = "http://localhost:8000",
    users: int = 50,
    spawn_rate: int = 5,
    run_time: str = "10m",
    output_dir: str = "load_test_results"
):
    """Run load test and save results."""
    # Create output directory
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    
    # Generate output filenames
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    csv_file = f"{output_dir}/results_{timestamp}.csv"
    report_file = f"{output_dir}/report_{timestamp}.html"
    
    try:
        # Run locust in headless mode
        cmd = [
            "locust",
            "-f", "backend/tests/load/locustfile.py",
            "--host", host,
            "--users", str(users),
            "--spawn-rate", str(spawn_rate),
            "--run-time", run_time,
            "--headless",
            "--csv", csv_file,
            "--html", report_file
        ]
        
        subprocess.run(cmd, check=True)
        
        # Analyze results
        analyze_results(csv_file, report_file, output_dir)
        
        return True
    except subprocess.CalledProcessError as e:
        print(f"Load test failed: {e}")
        return False

def analyze_results(
    csv_file: str,
    report_file: str,
    output_dir: str
):
    """Analyze load test results and generate visualizations."""
    # Read results
    results = pd.read_csv(f"{csv_file}_stats.csv")
    
    # Calculate key metrics
    total_requests = results["Request Count"].sum()
    avg_response_time = results["Average Response Time"].mean()
    error_rate = (results["Failure Count"].sum() / total_requests) * 100
    
    # Generate visualizations
    plt.figure(figsize=(12, 8))
    
    # Response time distribution
    plt.subplot(2, 2, 1)
    plt.hist(results["Average Response Time"], bins=20)
    plt.title("Response Time Distribution")
    plt.xlabel("Response Time (ms)")
    plt.ylabel("Frequency")
    
    # Requests per second
    plt.subplot(2, 2, 2)
    plt.plot(results["Request Count"] / results["Total Time"])
    plt.title("Requests per Second")
    plt.xlabel("Time")
    plt.ylabel("RPS")
    
    # Error rate over time
    plt.subplot(2, 2, 3)
    error_rates = (results["Failure Count"] / results["Request Count"]) * 100
    plt.plot(error_rates)
    plt.title("Error Rate Over Time")
    plt.xlabel("Time")
    plt.ylabel("Error Rate (%)")
    
    # Response time by endpoint
    plt.subplot(2, 2, 4)
    plt.boxplot([
        results[results["Name"] == endpoint]["Average Response Time"]
        for endpoint in results["Name"].unique()
    ], labels=results["Name"].unique())
    plt.xticks(rotation=45)
    plt.title("Response Time by Endpoint")
    plt.ylabel("Response Time (ms)")
    
    # Save plot
    plot_file = os.path.join(output_dir, "load_test_analysis.png")
    plt.tight_layout()
    plt.savefig(plot_file)
    
    # Generate summary report
    summary = {
        "total_requests": int(total_requests),
        "avg_response_time": float(avg_response_time),
        "error_rate": float(error_rate),
        "percentiles": {
            "50th": float(results["50%"].mean()),
            "90th": float(results["90%"].mean()),
            "95th": float(results["95%"].mean()),
            "99th": float(results["99%"].mean())
        },
        "endpoints": {
            endpoint: {
                "avg_response_time": float(group["Average Response Time"].mean()),
                "error_rate": float((group["Failure Count"].sum() / group["Request Count"].sum()) * 100)
            }
            for endpoint, group in results.groupby("Name")
        }
    }
    
    # Save summary
    summary_file = os.path.join(output_dir, "summary.json")
    with open(summary_file, "w") as f:
        json.dump(summary, f, indent=2)
    
    return summary

def main():
    """Run load tests with default configuration."""
    host = os.getenv("TEST_HOST", "http://localhost:8000")
    users = int(os.getenv("TEST_USERS", "50"))
    spawn_rate = int(os.getenv("TEST_SPAWN_RATE", "5"))
    run_time = os.getenv("TEST_RUN_TIME", "10m")
    output_dir = os.getenv("TEST_OUTPUT_DIR", "load_test_results")
    
    success = run_load_test(
        host=host,
        users=users,
        spawn_rate=spawn_rate,
        run_time=run_time,
        output_dir=output_dir
    )
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main() 