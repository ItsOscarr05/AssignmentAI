import os
import json
from datetime import datetime
from pathlib import Path

class UATTracker:
    def __init__(self):
        self.results_file = Path("uat_results.json")
        self.results = self.load_results()

    def load_results(self):
        """Load existing test results"""
        if self.results_file.exists():
            with open(self.results_file, 'r') as f:
                return json.load(f)
        return {
            "test_cases": {},
            "defects": [],
            "execution_date": datetime.now().isoformat(),
            "status": "in_progress"
        }

    def save_results(self):
        """Save test results to file"""
        with open(self.results_file, 'w') as f:
            json.dump(self.results, f, indent=2)

    def record_test_case(self, test_id, name, status, notes=""):
        """Record a test case result"""
        self.results["test_cases"][test_id] = {
            "name": name,
            "status": status,
            "notes": notes,
            "executed_at": datetime.now().isoformat()
        }
        self.save_results()

    def record_defect(self, test_id, description, severity, steps_to_reproduce):
        """Record a defect"""
        defect = {
            "id": len(self.results["defects"]) + 1,
            "test_id": test_id,
            "description": description,
            "severity": severity,
            "steps_to_reproduce": steps_to_reproduce,
            "status": "open",
            "reported_at": datetime.now().isoformat()
        }
        self.results["defects"].append(defect)
        self.save_results()

    def update_defect_status(self, defect_id, status, resolution=""):
        """Update defect status"""
        for defect in self.results["defects"]:
            if defect["id"] == defect_id:
                defect["status"] = status
                defect["resolution"] = resolution
                defect["resolved_at"] = datetime.now().isoformat()
                break
        self.save_results()

    def generate_report(self):
        """Generate UAT report"""
        total_cases = len(self.results["test_cases"])
        passed_cases = sum(1 for case in self.results["test_cases"].values() if case["status"] == "passed")
        failed_cases = sum(1 for case in self.results["test_cases"].values() if case["status"] == "failed")
        open_defects = sum(1 for defect in self.results["defects"] if defect["status"] == "open")

        report = f"""
UAT Progress Report
==================
Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

Test Cases:
- Total: {total_cases}
- Passed: {passed_cases}
- Failed: {failed_cases}
- Pass Rate: {(passed_cases/total_cases*100 if total_cases > 0 else 0):.1f}%

Defects:
- Total: {len(self.results["defects"])}
- Open: {open_defects}
- Resolved: {len(self.results["defects"]) - open_defects}

Status: {self.results["status"]}
"""
        return report

def main():
    tracker = UATTracker()
    
    # Example usage
    print("UAT Test Case Tracker")
    print("====================")
    
    while True:
        print("\nOptions:")
        print("1. Record test case result")
        print("2. Record defect")
        print("3. Update defect status")
        print("4. Generate report")
        print("5. Exit")
        
        choice = input("\nEnter your choice (1-5): ")
        
        if choice == "1":
            test_id = input("Enter test case ID: ")
            name = input("Enter test case name: ")
            status = input("Enter status (passed/failed): ")
            notes = input("Enter notes (optional): ")
            tracker.record_test_case(test_id, name, status, notes)
            print("Test case recorded successfully")
            
        elif choice == "2":
            test_id = input("Enter test case ID: ")
            description = input("Enter defect description: ")
            severity = input("Enter severity (high/medium/low): ")
            steps = input("Enter steps to reproduce: ")
            tracker.record_defect(test_id, description, severity, steps)
            print("Defect recorded successfully")
            
        elif choice == "3":
            defect_id = int(input("Enter defect ID: "))
            status = input("Enter new status (open/in_progress/resolved): ")
            resolution = input("Enter resolution (optional): ")
            tracker.update_defect_status(defect_id, status, resolution)
            print("Defect status updated successfully")
            
        elif choice == "4":
            report = tracker.generate_report()
            print(report)
            
        elif choice == "5":
            print("Exiting...")
            break
            
        else:
            print("Invalid choice. Please try again.")

if __name__ == "__main__":
    main() 