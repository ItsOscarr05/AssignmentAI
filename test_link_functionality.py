"""
Test script for Link Functionality
Run this script to test the link processing endpoints

Usage:
    python test_link_functionality.py

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

# Test URLs
TEST_URLS = {
    "wikipedia": "https://en.wikipedia.org/wiki/Artificial_intelligence",
    "simple_webpage": "https://example.com",
    # Add your Google Docs link here (must be public)
    # "google_docs": "https://docs.google.com/document/d/YOUR_DOC_ID/edit",
}

class LinkFunctionalityTester:
    def __init__(self):
        self.token = None
        self.results = []
        
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
    
    def test_link_validation(self, url: str) -> bool:
        """Test 1: Validate URL"""
        print("\n" + "="*60)
        print(f"Test 1: Validating URL")
        print("="*60)
        print(f"URL: {url}")
        
        try:
            response = requests.post(
                f"{BASE_URL}/assignment-input/validate-link",
                headers=self.get_headers(),
                json={"url": url}
            )
            
            if response.status_code == 200:
                data = response.json()
                print("✅ URL validation successful!")
                print(f"Valid: {data.get('valid')}")
                print(f"Accessible: {data.get('accessible')}")
                print(f"URL Type: {data.get('url_type')}")
                return True
            else:
                print(f"❌ Validation failed: {response.status_code}")
                print(f"Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error during validation: {str(e)}")
            return False
    
    def test_content_extraction(self, url: str) -> Dict[str, Any]:
        """Test 2: Extract content from URL"""
        print("\n" + "="*60)
        print(f"Test 2: Extracting Content")
        print("="*60)
        print(f"URL: {url}")
        
        try:
            start_time = time.time()
            response = requests.post(
                f"{BASE_URL}/assignment-input/extract-from-link",
                headers=self.get_headers(),
                json={"url": url}
            )
            elapsed = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Content extraction successful!")
                print(f"Title: {data.get('title')}")
                print(f"Type: {data.get('type')}")
                print(f"Content length: {len(data.get('content', ''))} characters")
                print(f"Status: {data.get('status')}")
                print(f"Time taken: {elapsed:.2f} seconds")
                print(f"\nContent preview (first 200 chars):")
                print(f"{data.get('content', '')[:200]}...")
                return data
            else:
                print(f"❌ Content extraction failed: {response.status_code}")
                print(f"Response: {response.text}")
                return None
                
        except Exception as e:
            print(f"❌ Error during content extraction: {str(e)}")
            return None
    
    def test_workshop_link_processing(self, url: str) -> Dict[str, Any]:
        """Test 3: Process link in workshop"""
        print("\n" + "="*60)
        print(f"Test 3: Processing Link in Workshop")
        print("="*60)
        print(f"URL: {url}")
        
        try:
            start_time = time.time()
            response = requests.post(
                f"{BASE_URL}/workshop/links",
                headers=self.get_headers(),
                json={"url": url}
            )
            elapsed = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Workshop link processing successful!")
                print(f"ID: {data.get('id')}")
                print(f"File Upload ID: {data.get('file_upload_id')}")
                print(f"Title: {data.get('title')}")
                print(f"Type: {data.get('type')}")
                print(f"Has Analysis: {'Yes' if data.get('analysis') else 'No'}")
                print(f"Time taken: {elapsed:.2f} seconds")
                
                if data.get('analysis'):
                    print(f"\nAI Analysis preview (first 300 chars):")
                    print(f"{data.get('analysis')[:300]}...")
                
                return data
            else:
                print(f"❌ Workshop processing failed: {response.status_code}")
                print(f"Response: {response.text}")
                return None
                
        except Exception as e:
            print(f"❌ Error during workshop processing: {str(e)}")
            return None
    
    def test_comprehensive_analysis(self, url: str, content: str) -> Dict[str, Any]:
        """Test 4: Get comprehensive AI analysis"""
        print("\n" + "="*60)
        print(f"Test 4: Comprehensive AI Analysis")
        print("="*60)
        
        try:
            start_time = time.time()
            response = requests.post(
                f"{BASE_URL}/workshop/analyze-link",
                headers=self.get_headers(),
                json={
                    "link_id": "test-id",
                    "url": url,
                    "content": content
                }
            )
            elapsed = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                analysis = data.get('analysis', {})
                
                print("✅ Comprehensive analysis successful!")
                print(f"Time taken: {elapsed:.2f} seconds")
                print("\n📊 Analysis Results:")
                print(f"  Summary: {len(analysis.get('summary', ''))} characters")
                print(f"  Key Points: {len(analysis.get('keyPoints', []))} points")
                print(f"  Content Type: {analysis.get('contentType')}")
                print(f"  Credibility Score: {analysis.get('credibility')}/10")
                print(f"  Sentiment: {analysis.get('sentiment')}")
                print(f"  Reading Time: {analysis.get('readingTime')} minutes")
                print(f"  Word Count: {analysis.get('wordCount')}")
                print(f"  Related Topics: {len(analysis.get('relatedTopics', []))} topics")
                print(f"  Suggested Actions: {len(analysis.get('suggestedActions', []))} actions")
                
                if analysis.get('keyPoints'):
                    print("\n🔑 Key Points:")
                    for i, point in enumerate(analysis.get('keyPoints', [])[:3], 1):
                        print(f"  {i}. {point}")
                
                if analysis.get('relatedTopics'):
                    print(f"\n🏷️  Related Topics: {', '.join(analysis.get('relatedTopics', [])[:5])}")
                
                return analysis
            else:
                print(f"❌ Analysis failed: {response.status_code}")
                print(f"Response: {response.text}")
                return None
                
        except Exception as e:
            print(f"❌ Error during analysis: {str(e)}")
            return None
    
    def run_all_tests(self):
        """Run all tests"""
        print("\n")
        print("╔" + "="*58 + "╗")
        print("║" + " "*15 + "LINK FUNCTIONALITY TESTS" + " "*19 + "║")
        print("╚" + "="*58 + "╝")
        
        # Step 1: Login
        if not self.login():
            print("\n❌ Cannot proceed without authentication")
            return
        
        # Run tests for each URL
        for name, url in TEST_URLS.items():
            print("\n\n")
            print("┌" + "─"*58 + "┐")
            print(f"│ Testing with: {name.upper()}" + " "*(46-len(name)) + "│")
            print("└" + "─"*58 + "┘")
            
            # Test 1: Validation
            validation_passed = self.test_link_validation(url)
            
            if validation_passed:
                # Test 2: Content Extraction
                extracted_data = self.test_content_extraction(url)
                
                if extracted_data:
                    # Test 3: Workshop Processing
                    workshop_data = self.test_workshop_link_processing(url)
                    
                    # Test 4: Comprehensive Analysis
                    if extracted_data.get('content'):
                        self.test_comprehensive_analysis(url, extracted_data['content'])
        
        # Summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n\n")
        print("╔" + "="*58 + "╗")
        print("║" + " "*20 + "TEST SUMMARY" + " "*26 + "║")
        print("╚" + "="*58 + "╝")
        print("\n✅ All tests completed!")
        print("\nNext Steps:")
        print("1. Check if all tests passed")
        print("2. Test the UI by navigating to /workshop")
        print("3. Try submitting links through the interface")
        print("4. Check database for stored link records")
        print("\nFor detailed testing instructions, see:")
        print("  - LINK_FUNCTIONALITY_TEST_GUIDE.md")
        print("  - LINK_FUNCTIONALITY_QUICK_REFERENCE.md")


def main():
    """Main test runner"""
    print("\n🚀 Starting Link Functionality Tests...")
    print(f"📍 Base URL: {BASE_URL}")
    print(f"👤 User: {EMAIL}")
    
    if EMAIL == "test@example.com" or PASSWORD == "your_password":
        print("\n⚠️  WARNING: Please update EMAIL and PASSWORD in the script!")
        response = input("Continue anyway? (y/n): ")
        if response.lower() != 'y':
            return
    
    tester = LinkFunctionalityTester()
    tester.run_all_tests()


if __name__ == "__main__":
    main()

