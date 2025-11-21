"""
Test script for multiple file formats and assignment types
Tests the AI completion system with various assignment formats
"""
import asyncio
import os
import re
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.services.gpt_file_completion_service import GPTFileCompletionService
from app.services.ai_solving_engine import AISolvingEngine


async def test_file_completion(file_path, file_type, description):
    """Test completion of a specific file"""
    print(f"\n{'='*70}")
    print(f"Testing: {description}")
    print(f"File: {file_path}")
    print(f"Type: {file_type}")
    print(f"{'='*70}")
    
    try:
        # Read the file
        with open(file_path, 'r', encoding='utf-8') as f:
            content = {'text': f.read()}
        
        print(f"\n📄 Original Content (first 500 chars):")
        print(content['text'][:500] + "..." if len(content['text']) > 500 else content['text'])
        
        # Initialize service
        service = GPTFileCompletionService(None)
        
        # Mock get_user_plan
        async def mock_get_user_plan(user_id):
            return "free"
        service.ai_service.get_user_plan = mock_get_user_plan
        
        print(f"\n🔄 Processing...")
        result = await service._complete_document(
            file_content=content,
            file_type=file_type,
            model='gpt-4o-mini',
            user_id=1
        )
        
        completed_text = result['text']
        
        print(f"\n✅ Completed Content (first 800 chars):")
        print(completed_text[:800] + "..." if len(completed_text) > 800 else completed_text)
        
        # Verification
        print(f"\n{'='*70}")
        print("Verification Results:")
        print(f"{'='*70}")
        
        # Check for various answer patterns (including essay prompts)
        question_pattern = r'Q\d+\)|Question\s+\d+[:)]|Problem\s+\d+[:)]|^\d+\.|PROMPT:|Essay|Your Essay'
        questions = re.findall(question_pattern, completed_text, re.IGNORECASE | re.MULTILINE)
        
        # Also check for essay prompts
        essay_indicators = ['essay', 'prompt', 'write', 'discuss', 'analyze']
        has_essay_prompt = any(indicator in completed_text.lower() for indicator in essay_indicators)
        
        answer_patterns = [
            r'A\d+\)',
            r'Answer\s*\d*[:)]',
            r'Solution\s*\d*[:)]',
        ]
        
        answer_count = 0
        for pattern in answer_patterns:
            matches = re.findall(pattern, completed_text, re.IGNORECASE | re.MULTILINE)
            answer_count = max(answer_count, len(matches))
        
        # Check for content after questions
        has_substantial_content = len(completed_text) > len(content['text']) + 100
        
        # Check for blanks, but ignore common form fields (Name, Date, Course, etc.)
        form_field_patterns = [
            r'Name:\s*_{5,}',
            r'Date:\s*_{5,}',
            r'Course:\s*_{5,}',
            r'Student Name:\s*_{5,}',
        ]
        
        # Count non-form-field blanks
        all_blanks = re.findall(r'_{5,}', completed_text)
        form_field_blanks = 0
        for pattern in form_field_patterns:
            form_field_blanks += len(re.findall(pattern, completed_text, re.IGNORECASE))
        
        # Only count blanks that aren't form fields
        meaningful_blanks = len(all_blanks) - form_field_blanks
        
        # For essay assignments, check if essay content was written
        essay_content_written = False
        if has_essay_prompt:
            # Look for substantial content after essay indicators
            essay_pattern = r'(Your Essay|Essay:|PROMPT:).*?$'
            essay_matches = list(re.finditer(essay_pattern, completed_text, re.IGNORECASE | re.MULTILINE | re.DOTALL))
            if essay_matches:
                # Get content after the last essay indicator
                last_match = essay_matches[-1]
                essay_content = completed_text[last_match.end():].strip()
                # Remove form fields and check for substantial content
                essay_content_clean = re.sub(r'Name:.*?Date:.*?', '', essay_content, flags=re.DOTALL)
                essay_content_clean = re.sub(r'_{5,}', '', essay_content_clean)
                essay_content_written = len(essay_content_clean) > 200  # At least 200 chars of essay content
        
        checks = {
            "Questions/Prompts found": len(questions) > 0 or has_essay_prompt,
            "Answers/Essay provided": answer_count > 0 or has_substantial_content or essay_content_written,
            "Content expanded": len(completed_text) > len(content['text']) * 1.2,  # At least 20% more content
            "No assignment blanks remaining": meaningful_blanks == 0,  # Ignore form fields
        }
        
        for check, passed in checks.items():
            status = "✅ PASS" if passed else "❌ FAIL"
            print(f"{status}: {check}")
        
        all_passed = all(checks.values())
        print(f"\n{'✅ Test PASSED!' if all_passed else '❌ Test FAILED'}")
        
        return all_passed
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


async def test_code_completion(file_path, description):
    """Test code file completion"""
    print(f"\n{'='*70}")
    print(f"Testing: {description}")
    print(f"File: {file_path}")
    print(f"{'='*70}")
    
    try:
        # Read the file
        with open(file_path, 'r', encoding='utf-8') as f:
            code_content = f.read()
        
        print(f"\n📄 Original Code:")
        print(code_content)
        
        # Initialize service
        service = GPTFileCompletionService(None)
        
        # Mock get_user_plan
        async def mock_get_user_plan(user_id):
            return "free"
        service.ai_service.get_user_plan = mock_get_user_plan
        
        print(f"\n🔄 Processing...")
        result = await service._complete_code(
            file_content={'code': code_content, 'text': code_content},
            file_type='py',
            model='gpt-4o-mini',
            user_id=1
        )
        
        completed_code = result['code']
        
        print(f"\n✅ Completed Code:")
        print(completed_code)
        
        # Verification
        print(f"\n{'='*70}")
        print("Verification Results:")
        print(f"{'='*70}")
        
        # Check if code was actually completed (has implementations)
        has_implementations = any(keyword in completed_code for keyword in ['return', 'if', 'for', 'while', '='])
        
        checks = {
            "No TODO comments": "TODO" not in completed_code.upper(),
            "No pass statements": "pass" not in completed_code or completed_code.count("pass") < code_content.count("pass"),
            "Functions implemented": "def " in completed_code and has_implementations,
            "Code has logic": has_implementations and ("return" in completed_code or any(op in completed_code for op in ['=', 'if', 'for'])),
        }
        
        for check, passed in checks.items():
            status = "✅ PASS" if passed else "❌ FAIL"
            print(f"{status}: {check}")
        
        all_passed = all(checks.values())
        print(f"\n{'✅ Test PASSED!' if all_passed else '❌ Test FAILED'}")
        
        return all_passed
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


async def main():
    """Run all format tests"""
    print("\n🚀 Starting Multi-Format Completion Tests\n")
    
    # Check if OpenAI API key is set
    if not os.getenv('OPENAI_API_KEY'):
        print("⚠️  Warning: OPENAI_API_KEY not set. Tests may fail.")
        print("   Set it in your .env file or environment variables.\n")
    
    test_files_dir = Path(__file__).parent / "tests" / "test_files"
    results = []
    
    # Test different assignment formats
    test_cases = [
        {
            "file": test_files_dir / "sample_essay_assignment.txt",
            "type": "txt",
            "description": "Essay Assignment (500 words)",
            "test_func": test_file_completion
        },
        {
            "file": test_files_dir / "sample_math_assignment.txt",
            "type": "txt",
            "description": "Math Assignment (Algebra & Geometry)",
            "test_func": test_file_completion
        },
        {
            "file": test_files_dir / "sample_science_quiz.txt",
            "type": "txt",
            "description": "Science Quiz (Multiple Choice & Short Answer)",
            "test_func": test_file_completion
        },
        {
            "file": test_files_dir / "sample_history_assignment.txt",
            "type": "txt",
            "description": "History Assignment (Short Answer & Essay)",
            "test_func": test_file_completion
        },
        {
            "file": test_files_dir / "sample_language_assignment.txt",
            "type": "txt",
            "description": "Language Arts (Reading Comprehension)",
            "test_func": test_file_completion
        },
        {
            "file": test_files_dir / "sample_code_assignment.py",
            "type": "py",
            "description": "Python Code Assignment (Function Implementation)",
            "test_func": test_code_completion
        },
    ]
    
    for test_case in test_cases:
        if test_case["file"].exists():
            if test_case["type"] == "py":
                result = await test_case["test_func"](
                    test_case["file"],
                    test_case["description"]
                )
            else:
                result = await test_case["test_func"](
                    test_case["file"],
                    test_case["type"],
                    test_case["description"]
                )
            results.append((test_case["description"], result))
        else:
            print(f"\n⚠️  File not found: {test_case['file']}")
            results.append((test_case["description"], False))
    
    # Summary
    print("\n" + "="*70)
    print("TEST SUMMARY")
    print("="*70)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for description, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {description}")
    
    print(f"\n{'='*70}")
    print(f"Total: {passed}/{total} tests passed")
    print(f"{'='*70}")
    
    if passed == total:
        print("\n🎉 All tests passed!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed.")
        return 1


if __name__ == '__main__':
    exit_code = asyncio.run(main())
    sys.exit(exit_code)

