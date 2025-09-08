#!/usr/bin/env python3
"""
Test script to verify immediate subscription updates work correctly
"""
import requests
import json
import time

def test_immediate_subscription_update():
    """Test the immediate subscription update endpoint"""
    base_url = "http://localhost:8000"
    
    # Test data
    test_data = {
        "price_id": "price_1Rss0zBXiGe9D9aVp4AYKAWV",  # Plus plan
        "plan_name": "Plus"
    }
    
    print("🧪 Testing immediate subscription update...")
    print(f"Test data: {json.dumps(test_data, indent=2)}")
    
    try:
        # Test the confirm subscription payment endpoint
        response = requests.post(
            f"{base_url}/api/v1/payments/confirm-subscription-payment",
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Response status: {response.status_code}")
        print(f"Response body: {response.text}")
        
        if response.status_code == 200:
            print("✅ Immediate subscription update endpoint is working!")
            return True
        else:
            print("❌ Immediate subscription update failed")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_subscription_status():
    """Test getting current subscription status"""
    base_url = "http://localhost:8000"
    
    print("\n🧪 Testing subscription status endpoint...")
    
    try:
        # Test the subscription status endpoint
        response = requests.get(f"{base_url}/api/v1/payments/subscriptions/current/test")
        
        print(f"Response status: {response.status_code}")
        print(f"Response body: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Current subscription: {data.get('plan_id', 'Unknown')}")
            print(f"✅ Token limit: {data.get('token_limit', 'Unknown')}")
            return True
        else:
            print("❌ Failed to get subscription status")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    print("=" * 60)
    print("TESTING IMMEDIATE SUBSCRIPTION UPDATES")
    print("=" * 60)
    
    # Test subscription status first
    status_ok = test_subscription_status()
    
    if status_ok:
        # Test immediate update
        update_ok = test_immediate_subscription_update()
        
        if update_ok:
            # Test status again to see if it changed
            print("\n🧪 Testing subscription status after update...")
            time.sleep(1)  # Brief delay
            test_subscription_status()
    
    print("\n" + "=" * 60)
    print("TEST COMPLETED")
    print("=" * 60)

if __name__ == "__main__":
    main()
