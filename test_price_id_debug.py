#!/usr/bin/env python3
"""
Debug script to test price ID mapping
"""
import requests
import json

def test_price_id_mapping():
    """Test the price ID mapping with different price IDs"""
    base_url = "http://localhost:8000"
    
    # Test different price IDs that might be used
    test_price_ids = [
        "price_1Rss0zBXiGe9D9aVp4AYKAWV",  # Example Plus plan
        "price_1Rss0zBXiGe9D9aVp4AYKAWX",  # Example Pro plan  
        "price_1Rss0zBXiGe9D9aVp4AYKAWY",  # Example Max plan
        "price_test_max",  # Test Max plan
        "price_test_pro",  # Test Pro plan
        "price_test_plus", # Test Plus plan
        "price_test_free", # Test Free plan
    ]
    
    print("🧪 Testing price ID mapping...")
    print("=" * 60)
    
    for price_id in test_price_ids:
        print(f"\n🔍 Testing price ID: {price_id}")
        
        try:
            # Test the confirm subscription payment endpoint
            response = requests.post(
                f"{base_url}/api/v1/payments/confirm-subscription-payment",
                json={
                    "price_id": price_id,
                    "plan_name": "Test Plan"
                },
                headers={"Content-Type": "application/json"}
            )
            
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Success: {data.get('message', 'No message')}")
                if 'plan_details' in data:
                    plan = data['plan_details']
                    print(f"   📋 Plan: {plan.get('name', 'Unknown')}")
                    print(f"   💰 Price: ${plan.get('price', 0)}")
                    print(f"   🎯 Tokens: {plan.get('token_limit', 0):,}")
                    print(f"   🤖 AI Model: {plan.get('ai_model', 'Unknown')}")
            else:
                print(f"   ❌ Error: {response.text}")
                
        except Exception as e:
            print(f"   ❌ Exception: {e}")
    
    print("\n" + "=" * 60)
    print("Price ID mapping test completed")

def test_current_subscription():
    """Test getting current subscription status"""
    base_url = "http://localhost:8000"
    
    print("\n🧪 Testing current subscription status...")
    
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
    test_price_id_mapping()
    test_current_subscription()
