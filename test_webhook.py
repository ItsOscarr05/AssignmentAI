#!/usr/bin/env python3
"""
Test webhook with proper subscription payment data
"""
import requests
import json

def test_webhook():
    webhook_url = "http://localhost:8000/api/v1/payments/stripe/webhook"
    
    # Test webhook payload for subscription payment
    payload = {
        "id": "evt_test_webhook",
        "object": "event",
        "type": "payment_intent.succeeded",
        "data": {
            "object": {
                "id": "pi_test_subscription_123",
                "object": "payment_intent",
                "amount": 499,  # $4.99 for Plus plan
                "currency": "usd",
                "status": "succeeded",
                "metadata": {
                    "type": "subscription",
                    "user_id": "1",
                    "price_id": "price_1Rss0zBXiGe9D9aVp4AYKAWV",
                    "plan_name": "Plus",
                    "is_upgrade": "false"
                }
            }
        }
    }
    
    headers = {
        "Content-Type": "application/json",
        "Stripe-Signature": "test_signature"  # This will trigger dev mode
    }
    
    print("🧪 Testing webhook with subscription payment data...")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.post(webhook_url, headers=headers, json=payload)
        print(f"Response status: {response.status_code}")
        print(f"Response body: {response.text}")
        
        if response.status_code == 200:
            print("✅ Webhook processed successfully!")
        else:
            print("❌ Webhook failed")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_webhook()
