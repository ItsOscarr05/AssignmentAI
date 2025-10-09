#!/usr/bin/env python3
"""
Test script to verify the download functionality for filled Excel files.
This script tests the complete workflow from file processing to download.
"""

import requests
import json
import os
import time
from pathlib import Path

# Configuration
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api/v1"

def test_download_functionality():
    """Test the complete download functionality"""
    
    print("🧪 Testing Download Functionality for Filled Excel Files")
    print("=" * 60)
    
    # Step 1: Test authentication (you'll need to replace with actual credentials)
    print("\n1. Testing authentication...")
    auth_data = {
        "username": "test@example.com",  # Replace with actual test user
        "password": "testpassword"       # Replace with actual test password
    }
    
    try:
        auth_response = requests.post(f"{API_BASE}/auth/login", data=auth_data)
        if auth_response.status_code == 200:
            auth_result = auth_response.json()
            access_token = auth_result.get("access_token")
            print("✅ Authentication successful")
        else:
            print(f"❌ Authentication failed: {auth_response.status_code}")
            print("Please update the test credentials in the script")
            return False
    except Exception as e:
        print(f"❌ Authentication error: {e}")
        print("Please ensure the backend server is running")
        return False
    
    # Step 2: Test file upload and processing
    print("\n2. Testing file upload and processing...")
    
    # Create a test Excel file
    test_file_content = """Name,Age,Department,Salary
John Doe,30,Engineering,75000
Jane Smith,25,Marketing,60000
Bob Johnson,35,Sales,80000"""
    
    test_filename = "test_employees.csv"
    with open(test_filename, 'w') as f:
        f.write(test_file_content)
    
    try:
        # Upload the test file
        with open(test_filename, 'rb') as f:
            files = {'file': (test_filename, f, 'text/csv')}
            headers = {'Authorization': f'Bearer {access_token}'}
            
            upload_response = requests.post(
                f"{API_BASE}/workshop/files",
                files=files,
                headers=headers
            )
        
        if upload_response.status_code == 200:
            upload_result = upload_response.json()
            file_id = upload_result.get("id")
            print(f"✅ File uploaded successfully, ID: {file_id}")
        else:
            print(f"❌ File upload failed: {upload_response.status_code}")
            print(f"Response: {upload_response.text}")
            return False
            
    except Exception as e:
        print(f"❌ File upload error: {e}")
        return False
    
    # Step 3: Test file processing (fill)
    print("\n3. Testing file processing (fill)...")
    
    try:
        fill_data = {
            "file_id": file_id,
            "action": "fill"
        }
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        fill_response = requests.post(
            f"{API_BASE}/file-processing/process-existing",
            json=fill_data,
            headers=headers
        )
        
        if fill_response.status_code == 200:
            fill_result = fill_response.json()
            filled_file_id = fill_result.get("file_id")
            filled_file_name = fill_result.get("filled_file_name")
            download_url = fill_result.get("download_url")
            print(f"✅ File processed successfully")
            print(f"   Filled file ID: {filled_file_id}")
            print(f"   Filled file name: {filled_file_name}")
            print(f"   Download URL: {download_url}")
        else:
            print(f"❌ File processing failed: {fill_response.status_code}")
            print(f"Response: {fill_response.text}")
            return False
            
    except Exception as e:
        print(f"❌ File processing error: {e}")
        return False
    
    # Step 4: Test file download
    print("\n4. Testing file download...")
    
    try:
        headers = {'Authorization': f'Bearer {access_token}'}
        download_response = requests.get(
            f"{API_BASE}/file-processing/download/{filled_file_id}",
            headers=headers
        )
        
        if download_response.status_code == 200:
            # Save the downloaded file
            downloaded_filename = f"downloaded_{filled_file_name}"
            with open(downloaded_filename, 'wb') as f:
                f.write(download_response.content)
            
            print(f"✅ File downloaded successfully")
            print(f"   Downloaded file: {downloaded_filename}")
            print(f"   File size: {len(download_response.content)} bytes")
            print(f"   Content type: {download_response.headers.get('content-type')}")
            
            # Verify the file exists and has content
            if os.path.exists(downloaded_filename) and os.path.getsize(downloaded_filename) > 0:
                print("✅ Downloaded file exists and has content")
            else:
                print("❌ Downloaded file is empty or doesn't exist")
                return False
                
        else:
            print(f"❌ File download failed: {download_response.status_code}")
            print(f"Response: {download_response.text}")
            return False
            
    except Exception as e:
        print(f"❌ File download error: {e}")
        return False
    
    # Step 5: Cleanup
    print("\n5. Cleaning up test files...")
    
    try:
        if os.path.exists(test_filename):
            os.remove(test_filename)
            print(f"✅ Removed test file: {test_filename}")
        
        if os.path.exists(downloaded_filename):
            print(f"✅ Downloaded file available for inspection: {downloaded_filename}")
            # Optionally remove: os.remove(downloaded_filename)
            
    except Exception as e:
        print(f"⚠️ Cleanup warning: {e}")
    
    print("\n" + "=" * 60)
    print("🎉 Download functionality test completed successfully!")
    print("✅ All steps passed - the download system is working correctly")
    print("\nTo test in the frontend:")
    print("1. Upload an Excel file through the workshop interface")
    print("2. Fill the file with AI")
    print("3. Click the download button")
    print("4. The file should download and open in Excel")
    
    return True

if __name__ == "__main__":
    success = test_download_functionality()
    exit(0 if success else 1)
