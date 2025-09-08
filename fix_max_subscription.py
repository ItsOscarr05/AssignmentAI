#!/usr/bin/env python3
"""
Fix script to correct Max subscription token limits
"""
import requests
import json

def fix_max_subscription():
    """Fix the Max subscription to have correct token limits"""
    base_url = "http://localhost:8000"
    
    print("🔧 Fixing Max subscription token limits...")
    print("=" * 50)
    
    try:
        # Fix the subscription to Max plan with correct tokens
        response = requests.post(
            f"{base_url}/api/v1/payments/fix-subscription-tokens",
            json={"plan": "max"},
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Response status: {response.status_code}")
        print(f"Response body: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success: {data.get('message', 'No message')}")
            print(f"📊 Old tokens: {data.get('old_tokens', 0):,}")
            print(f"📊 New tokens: {data.get('new_tokens', 0):,}")
            print(f"📋 Plan: {data.get('plan_name', 'Unknown')}")
        else:
            print(f"❌ Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Exception: {e}")

def check_current_subscription():
    """Check current subscription status"""
    base_url = "http://localhost:8000"
    
    print("\n🔍 Checking current subscription status...")
    
    try:
        response = requests.get(f"{base_url}/api/v1/payments/subscriptions/current/test")
        
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Current subscription:")
            print(f"   Plan ID: {data.get('plan_id', 'Unknown')}")
            print(f"   Tokens: {data.get('token_limit', 0):,}")
            print(f"   AI Model: {data.get('ai_model', 'Unknown')}")
        else:
            print(f"❌ Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Exception: {e}")

if __name__ == "__main__":
    print("🔧 MAX SUBSCRIPTION TOKEN FIX")
    print("=" * 50)
    
    # Check current status first
    check_current_subscription()
    
    # Fix the subscription
    fix_max_subscription()
    
    # Check status after fix
    print("\n" + "=" * 50)
    print("After fix:")
    check_current_subscription()
    
    print("\n" + "=" * 50)
    print("Fix completed!")
