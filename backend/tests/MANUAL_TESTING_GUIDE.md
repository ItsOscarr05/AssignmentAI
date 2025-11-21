# Manual Testing Guide for AI Completion System

This guide provides step-by-step instructions for manually testing the improved AI completion system.

## Prerequisites

1. Backend server running on `http://localhost:8000`
2. Frontend running on `http://localhost:3001`
3. Valid user account with authentication token
4. OpenAI API key configured in backend `.env`

## Test Files

Sample test files are available in `backend/tests/test_files/`:
- `sample_assignment.txt` - Mixed questions (history, science, math, essay)
- `sample_code.py` - Python code with TODO comments

## Testing Methods

### Method 1: Via Frontend UI

1. **Login** to the application
2. Navigate to **Assignments** page
3. Click **Upload Assignment**
4. Select a test file (e.g., `sample_assignment.txt`)
5. Wait for processing to complete
6. **Verify**:
   - All questions are answered
   - Formatting is preserved
   - Answers are comprehensive (not just one word)
   - Original structure is maintained

### Method 2: Via API Endpoint

#### Test Document Completion

```bash
# Upload and process a file
curl -X POST "http://localhost:8000/api/v1/assignment-processing/upload-and-process" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@backend/tests/test_files/sample_assignment.txt" \
  -F "subscription_tier=free"
```

#### Test Code Completion

```bash
curl -X POST "http://localhost:8000/api/v1/assignment-processing/upload-and-process" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@backend/tests/test_files/sample_code.py" \
  -F "subscription_tier=free"
```

### Method 3: Direct Service Testing (Python)

Create a test script `test_completion.py`:

```python
import asyncio
from app.services.gpt_file_completion_service import GPTFileCompletionService
from app.services.ai_solving_engine import AISolvingEngine
from sqlalchemy.orm import Session

async def test_document_completion():
    # Initialize service
    service = GPTFileCompletionService(None)
    
    # Read test file
    with open('backend/tests/test_files/sample_assignment.txt', 'r') as f:
        content = {'text': f.read()}
    
    # Complete the document
    result = await service._complete_document(
        file_content=content,
        file_type='txt',
        model='gpt-4o-mini',
        user_id=1
    )
    
    # Print results
    print("Completed Document:")
    print(result['text'])
    print("\n" + "="*50)
    print("Verification:")
    print(f"- All questions answered: {'A1)' in result['text'] and 'A7)' in result['text']}")
    print(f"- Formatting preserved: {'PART I:' in result['text']}")
    print(f"- Comprehensive answers: {len(result['text']) > 2000}")

if __name__ == '__main__':
    asyncio.run(test_document_completion())
```

Run with:
```bash
cd backend
python -m pytest tests/test_ai_completion_quality.py -v
python test_completion.py  # If using direct service testing
```

## Quality Checklist

When testing, verify:

### ✅ Completeness
- [ ] All questions are answered (no blanks left)
- [ ] All TODO comments are implemented (for code)
- [ ] All fill-in-the-blanks are filled
- [ ] All multiple choice questions have answers

### ✅ Formatting Preservation
- [ ] Original document structure is maintained
- [ ] Question numbers are preserved (Q1, Q2, etc.)
- [ ] Section headers are intact (PART I, PART II, etc.)
- [ ] Spacing and indentation are maintained
- [ ] No new sections were added

### ✅ Answer Quality
- [ ] Answers are comprehensive (not just keywords)
- [ ] Math problems show step-by-step work
- [ ] Essay questions have proper structure (intro, body, conclusion)
- [ ] Answers demonstrate subject knowledge
- [ ] Answers are factually accurate

### ✅ Code Quality (for code files)
- [ ] All functions are fully implemented
- [ ] Code is syntactically correct
- [ ] Error handling is included where appropriate
- [ ] Code follows best practices
- [ ] Comments are helpful and accurate

## Expected Results

### For `sample_assignment.txt`:
- **Q1-Q6**: All should have complete answers
- **Q7**: Should be a 200-word essay with examples
- **Formatting**: Should maintain "PART I", "PART II", "PART III" structure
- **Answers**: Should be substantial (not just "1945" but "World War II ended in 1945")

### For `sample_code.py`:
- All three functions should be fully implemented
- No `pass` statements remaining
- Code should be executable
- Functions should work correctly

## Troubleshooting

### Issue: Answers are too brief
- **Check**: Temperature setting (should be 0.3 for documents)
- **Check**: Prompt includes "comprehensive" requirements
- **Solution**: Verify `gpt_file_completion_service.py` has updated prompts

### Issue: Formatting is lost
- **Check**: Prompt includes "preserve formatting" instructions
- **Check**: Response processing doesn't strip structure
- **Solution**: Verify system prompt emphasizes formatting preservation

### Issue: Some questions not answered
- **Check**: Prompt includes "ALL questions" language
- **Check**: Model has enough tokens (max_completion_tokens)
- **Solution**: Increase token limit or split large documents

## Performance Testing

Test with various file sizes:
- Small: < 1KB (5-10 questions)
- Medium: 1-10KB (20-50 questions)
- Large: 10-50KB (50+ questions)

Monitor:
- Processing time
- Token usage
- Answer quality consistency

## Regression Testing

After changes, verify:
1. Existing functionality still works
2. Quality hasn't degraded
3. No new errors introduced
4. Performance is acceptable

