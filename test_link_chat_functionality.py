"""
Test script for the new Link Chat Modal functionality
This tests the chat-with-link endpoint specifically

Usage:
    python test_link_chat_functionality.py

Make sure:
1. Backend is running (python -m uvicorn app.main:app --reload)
2. You have a valid user account
3. Update EMAIL and PASSWORD variables below
"""

import requests
import json
import time
from typing import Dict, Any

# Configuration
BASE_URL = "http://localhost:8000/api/v1"
EMAIL = "test@example.com"  # UPDATE THIS
PASSWORD = "your_password"   # UPDATE THIS

class LinkChatTester:
    def __init__(self):
        self.token = None
        self.link_data = None
        
    def login(self) -> bool:
        """Authenticate and get token"""
        print("\n" + "="*60)
        print("Step 1: Authenticating...")
        print("="*60)
        
        try:
            response = requests.post(
                f"{BASE_URL}/auth/login",
                data={
                    "username": EMAIL,
                    "password": PASSWORD
                }
            )
            
            if response.status_code == 200:
                self.token = response.json()["access_token"]
                print("✅ Authentication successful!")
                print(f"Token: {self.token[:20]}...")
                return True
            else:
                print(f"❌ Authentication failed: {response.status_code}")
                print(f"Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error during authentication: {str(e)}")
            return False
    
    def get_headers(self) -> Dict[str, str]:
        """Get headers with auth token"""
        return {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
    
    def process_link(self, url: str) -> Dict[str, Any]:
        """Process a link to get link data"""
        print("\n" + "="*60)
        print("Step 2: Processing Link")
        print("="*60)
        print(f"URL: {url}")
        
        try:
            response = requests.post(
                f"{BASE_URL}/workshop/links",
                headers=self.get_headers(),
                json={"url": url}
            )
            
            if response.status_code == 200:
                self.link_data = response.json()
                print("✅ Link processed successfully!")
                print(f"ID: {self.link_data.get('id')}")
                print(f"Title: {self.link_data.get('title')}")
                print(f"Type: {self.link_data.get('type')}")
                print(f"Content length: {len(self.link_data.get('content', ''))}")
                return self.link_data
            else:
                print(f"❌ Link processing failed: {response.status_code}")
                print(f"Response: {response.text}")
                return None
                
        except Exception as e:
            print(f"❌ Error processing link: {str(e)}")
            return None
    
    def test_chat_message(self, message: str) -> bool:
        """Test sending a chat message about the link"""
        print(f"\n💬 Testing chat message: '{message}'")
        
        if not self.link_data:
            print("❌ No link data available")
            return False
        
        try:
            response = requests.post(
                f"{BASE_URL}/workshop/chat-with-link",
                headers=self.get_headers(),
                json={
                    "link_id": self.link_data.get('id'),
                    "message": message,
                    "content": self.link_data.get('content', ''),
                    "chat_history": []  # Empty for first message
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Chat message successful!")
                print(f"Response: {data.get('response', '')[:200]}...")
                print(f"Timestamp: {data.get('timestamp')}")
                return True
            else:
                print(f"❌ Chat message failed: {response.status_code}")
                print(f"Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error sending chat message: {str(e)}")
            return False
    
    def run_chat_tests(self):
        """Run comprehensive chat tests"""
        print("\n")
        print("╔" + "="*58 + "╗")
        print("║" + " "*15 + "LINK CHAT FUNCTIONALITY TESTS" + " "*16 + "║")
        print("╚" + "="*58 + "╝")
        
        # Step 1: Login
        if not self.login():
            print("\n❌ Cannot proceed without authentication")
            return
        
        # Step 2: Process a link
        link_data = self.process_link("https://en.wikipedia.org/wiki/Artificial_intelligence")
        if not link_data:
            print("\n❌ Cannot proceed without processed link")
            return
        
        # Step 3: Test various chat messages
        test_messages = [
            "What are the main points of this article?",
            "Summarize this content in 3 key points",
            "Create an assignment based on this content",
            "What is the credibility of this source?",
            "Explain this content in simpler terms",
            "What are the implications of this information?"
        ]
        
        print("\n" + "="*60)
        print("Step 3: Testing Chat Messages")
        print("="*60)
        
        success_count = 0
        for i, message in enumerate(test_messages, 1):
            print(f"\n--- Test {i}/{len(test_messages)} ---")
            if self.test_chat_message(message):
                success_count += 1
            time.sleep(1)  # Brief pause between messages
        
        # Summary
        print("\n\n" + "="*60)
        print("TEST SUMMARY")
        print("="*60)
        print(f"✅ Successful chat messages: {success_count}/{len(test_messages)}")
        print(f"📊 Success rate: {(success_count/len(test_messages)*100):.1f}%")
        
        if success_count == len(test_messages):
            print("\n🎉 All chat tests passed! The new Link Chat Modal should work perfectly.")
        else:
            print(f"\n⚠️  {len(test_messages) - success_count} tests failed. Check the errors above.")
        
        print("\nNext Steps:")
        print("1. Test the UI by navigating to /workshop")
        print("2. Submit a link and verify the chat modal opens")
        print("3. Try the quick action chips (summarize, create assignment, etc.)")
        print("4. Test the side-by-side layout (content left, chat right)")


def main():
    """Main test runner"""
    print("\n🚀 Starting Link Chat Functionality Tests...")
    print(f"📍 Base URL: {BASE_URL}")
    print(f"👤 User: {EMAIL}")
    
    if EMAIL == "test@example.com" or PASSWORD == "your_password":
        print("\n⚠️  WARNING: Please update EMAIL and PASSWORD in the script!")
        response = input("Continue anyway? (y/n): ")
        if response.lower() != 'y':
            return
    
    tester = LinkChatTester()
    tester.run_chat_tests()


if __name__ == "__main__":
    main()
