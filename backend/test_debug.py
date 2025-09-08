#!/usr/bin/env python3
"""
Simple debug script to test price IDs
"""
import requests
import json

def test_price_ids():
    """Test the actual price IDs being used"""
    try:
        print("🔍 Testing actual price IDs...")
        
        # Get plans
        response = requests.get('http://localhost:8000/api/v1/payments/plans')
        if response.status_code == 200:
            plans = response.json()
            print("\n=== ALL PLANS ===")
            for i, plan in enumerate(plans):
                print(f"{i+1}. {plan['name']}: {plan['priceId']} - ${plan['price']}")
        else:
            print(f"❌ Plans endpoint failed: {response.status_code}")
            
        # Test subscription status
        print("\n🔍 Testing subscription status...")
        response = requests.get('http://localhost:8000/api/v1/payments/subscriptions/current/test')
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Current plan: {data.get('plan_id', 'Unknown')}")
            print(f"Token limit: {data.get('token_limit', 0):,}")
        else:
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_price_ids()
