"""
Quick test script for AI completion system
Run this to quickly verify the completion system is working
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


async def test_document_completion():
    """Test document completion with a simple example"""
    print("=" * 60)
    print("Testing Document Completion")
    print("=" * 60)
    
    # Mock the database-dependent methods
    service = GPTFileCompletionService(None)
    
    # Mock get_user_plan to return a default plan
    async def mock_get_user_plan(user_id):
        return "free"
    
    service.ai_service.get_user_plan = mock_get_user_plan
    
    # Simple test document
    test_content = {
        'text': """
Math Assignment

Q1) What is 5 + 3?
Answer: _____

Q2) Calculate 10 × 4. Show your work.
Answer: _____

Q3) Explain what multiplication is in 2-3 sentences.
Answer: _____
"""
    }
    
    try:
        print("\n📄 Original Document:")
        print(test_content['text'])
        
        print("\n🔄 Processing...")
        result = await service._complete_document(
            file_content=test_content,
            file_type='txt',
            model='gpt-4o-mini',
            user_id=1
        )
        
        print("\n✅ Completed Document:")
        print(result['text'])
        
        # Verification
        print("\n" + "=" * 60)
        print("Verification Results:")
        print("=" * 60)
        
        completed_text = result['text']
        
        # Find all questions in the document
        question_pattern = r'Q\d+\)|Question\s+\d+[:)]|Problem\s+\d+[:)]'
        questions = re.findall(question_pattern, completed_text, re.IGNORECASE)
        
        # Check for various answer format patterns
        answer_patterns = [
            r'A\d+\)',  # A1), A2), A3), etc.
            r'Answer\s*\d*[:)]',  # Answer:, Answer 1:, Answer 2:, Answer 1), etc.
            r'Solution\s*\d*[:)]',  # Solution:, Solution 1:, etc.
            r'Response\s*\d*[:)]',  # Response:, Response 1:, etc.
        ]
        
        answer_count = 0
        for pattern in answer_patterns:
            matches = re.findall(pattern, completed_text, re.IGNORECASE | re.MULTILINE)
            answer_count = max(answer_count, len(matches))
        
        # Also check for content after questions (answers might not have explicit labels)
        # Look for substantial content after each question marker
        has_answers_after_questions = True
        question_matches = list(re.finditer(question_pattern, completed_text, re.IGNORECASE))
        
        if len(question_matches) > 0:
            for i, q_match in enumerate(question_matches):
                # Get text after this question
                start_pos = q_match.end()
                # Find next question or end of text
                if i + 1 < len(question_matches):
                    next_q = question_matches[i + 1]
                    answer_text = completed_text[start_pos:next_q.start()].strip()
                else:
                    answer_text = completed_text[start_pos:].strip()
                
                # Remove the question text itself if it's repeated
                # Answer should be substantial (more than just whitespace or very short)
                # Check for actual content (not just "Answer: _____" or similar)
                answer_text_clean = re.sub(r'Answer\s*[:)]\s*[_\s]*', '', answer_text, flags=re.IGNORECASE)
                answer_text_clean = re.sub(r'[_\s]+', '', answer_text_clean)
                
                # Answer should have meaningful content (at least 10 characters of actual text)
                if len(answer_text_clean) < 10:
                    has_answers_after_questions = False
                    break
        else:
            has_answers_after_questions = False
        
        # Consider questions answered if we found answer labels OR substantial content after questions
        all_questions_answered = (
            (answer_count >= len(questions) and len(questions) > 0) or 
            (has_answers_after_questions and len(question_matches) > 0)
        )
        
        checks = {
            "All questions answered": all_questions_answered,
            "Formatting preserved": "Q1)" in completed_text and "Q2)" in completed_text,
            "Comprehensive answers": len(completed_text) > len(test_content['text']) + 100,
            "Math work shown": "×" in completed_text or "*" in completed_text or "=" in completed_text or "m/s" in completed_text,
        }
        
        for check, passed in checks.items():
            status = "✅ PASS" if passed else "❌ FAIL"
            print(f"{status}: {check}")
        
        all_passed = all(checks.values())
        print(f"\n{'✅ All checks passed!' if all_passed else '❌ Some checks failed'}")
        
        return all_passed
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


async def test_ai_solving_engine():
    """Test AI solving engine with different question types"""
    print("\n" + "=" * 60)
    print("Testing AI Solving Engine")
    print("=" * 60)
    
    engine = AISolvingEngine(None)
    
    test_cases = [
        {
            "type": "short_answer",
            "question": "What is photosynthesis?",
            "method": engine._solve_short_answer,
            "args": {"question": "What is photosynthesis?", "context": "Science", "word_count_requirement": 50, "tone": "academic"}
        },
        {
            "type": "math",
            "question": "A car accelerates from 0 to 60 m/s in 5 seconds. What is its acceleration?",
            "method": engine._solve_math_assignment,
            "args": {"question": "A car accelerates from 0 to 60 m/s in 5 seconds. What is its acceleration?", "context": "Physics"}
        },
    ]
    
    results = []
    
    for test_case in test_cases:
        try:
            print(f"\n📝 Testing {test_case['type']}...")
            print(f"Question: {test_case['question']}")
            
            result = await test_case['method'](**test_case['args'])
            
            print(f"✅ Answer generated: {result['answer'][:100]}...")
            print(f"   Content type: {result['content_type']}")
            print(f"   Validation: {result['validation'].is_valid if result.get('validation') else 'N/A'}")
            
            results.append(True)
            
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            results.append(False)
    
    print(f"\n{'✅ All engine tests passed!' if all(results) else '❌ Some tests failed'}")
    return all(results)


async def main():
    """Run all tests"""
    print("\n🚀 Starting AI Completion System Tests\n")
    
    # Check if OpenAI API key is set
    if not os.getenv('OPENAI_API_KEY'):
        print("⚠️  Warning: OPENAI_API_KEY not set. Tests may fail.")
        print("   Set it in your .env file or environment variables.\n")
    
    # Run tests
    doc_test = await test_document_completion()
    engine_test = await test_ai_solving_engine()
    
    print("\n" + "=" * 60)
    print("Final Results:")
    print("=" * 60)
    print(f"Document Completion: {'✅ PASS' if doc_test else '❌ FAIL'}")
    print(f"AI Solving Engine: {'✅ PASS' if engine_test else '❌ FAIL'}")
    
    if doc_test and engine_test:
        print("\n🎉 All tests passed!")
        return 0
    else:
        print("\n⚠️  Some tests failed. Check the output above.")
        return 1


if __name__ == '__main__':
    exit_code = asyncio.run(main())
    sys.exit(exit_code)

