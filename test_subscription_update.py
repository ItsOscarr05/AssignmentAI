#!/usr/bin/env python3
"""
Test script to manually trigger subscription update
"""
import requests
import json

# Test the manual subscription update endpoint
def test_subscription_update():
    # First, get an auth token by logging in
    login_url = "http://localhost:8000/api/v1/auth/login"
    login_data = {
        "email": "oscarberrigan@gmail.com",
        "password": "your_password_here"  # Replace with actual password
    }
    
    print("🔐 Attempting to login...")
    try:
        login_response = requests.post(login_url, data=login_data)
        if login_response.status_code == 200:
            token = login_response.json()["access_token"]
            print(f"✅ Login successful, got token: {token[:20]}...")
            
            # Now test the subscription update
            test_url = "http://localhost:8000/api/v1/payments/test/subscription-update"
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            test_data = {
                "price_id": "price_1Rss0zBXiGe9D9aVp4AYKAWV",
                "plan_name": "Plus"
            }
            
            print("🧪 Testing subscription update...")
            response = requests.post(test_url, headers=headers, json=test_data)
            print(f"Response status: {response.status_code}")
            print(f"Response body: {response.text}")
            
        else:
            print(f"❌ Login failed: {login_response.status_code} - {login_response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_subscription_update()
