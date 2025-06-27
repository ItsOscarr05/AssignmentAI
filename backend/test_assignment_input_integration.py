#!/usr/bin/env python3
"""
Integration test for Assignment Input functionality
"""
import asyncio
import aiohttp
import json
from typing import Dict, Any

BASE_URL = "http://localhost:8000"

async def test_assignment_input_endpoints():
    """Test the assignment input endpoints"""
    
    async with aiohttp.ClientSession() as session:
        print("🧪 Testing Assignment Input Integration...")
        
        # Test 1: Link validation
        print("\n1. Testing link validation...")
        try:
            async with session.post(
                f"{BASE_URL}/api/v1/assignment-input/validate-link",
                json={"url": "https://docs.google.com/document/d/test"}
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    print(f"✅ Link validation successful: {data}")
                else:
                    print(f"❌ Link validation failed: {response.status}")
        except Exception as e:
            print(f"❌ Link validation error: {e}")
        
        # Test 2: Chat generation
        print("\n2. Testing chat generation...")
        try:
            async with session.post(
                f"{BASE_URL}/api/v1/assignment-input/chat/generate",
                json={
                    "message": "Create a simple math assignment for 5th grade students",
                    "context": "Mathematics, basic arithmetic"
                }
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    print(f"✅ Chat generation successful: {data.get('response', '')[:100]}...")
                else:
                    print(f"❌ Chat generation failed: {response.status}")
        except Exception as e:
            print(f"❌ Chat generation error: {e}")
        
        # Test 3: Export formats
        print("\n3. Testing export formats...")
        try:
            async with session.get(f"{BASE_URL}/api/v1/assignment-input/export/formats") as response:
                if response.status == 200:
                    data = await response.json()
                    print(f"✅ Export formats successful: {data}")
                else:
                    print(f"❌ Export formats failed: {response.status}")
        except Exception as e:
            print(f"❌ Export formats error: {e}")
        
        # Test 4: Multiple inputs processing
        print("\n4. Testing multiple inputs processing...")
        try:
            form_data = aiohttp.FormData()
            form_data.add_field('chat_prompt', 'Create a science experiment assignment')
            form_data.add_field('links', 'https://example.com')
            
            async with session.post(
                f"{BASE_URL}/api/v1/assignment-input/process-multiple-inputs",
                data=form_data
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    print(f"✅ Multiple inputs processing successful: {data}")
                else:
                    print(f"❌ Multiple inputs processing failed: {response.status}")
        except Exception as e:
            print(f"❌ Multiple inputs processing error: {e}")
        
        print("\n🎉 Integration test completed!")

if __name__ == "__main__":
    asyncio.run(test_assignment_input_endpoints()) 