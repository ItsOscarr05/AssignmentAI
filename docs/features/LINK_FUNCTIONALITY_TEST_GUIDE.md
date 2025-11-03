# Link Functionality Testing Guide

## Overview
This guide will help you test the link processing functionality in AssignmentAI.

## Prerequisites
1. Ensure backend server is running: `cd backend && python -m uvicorn app.main:app --reload`
2. Ensure frontend is running: `cd frontend && npm run dev`
3. Have a user account with sufficient tokens
4. Have test URLs ready (see Test URLs section below)

## Test URLs

### 1. Google Docs (Public)
- Create a test Google Doc
- Set sharing to "Anyone with the link can view"
- Copy the share link
- Format: `https://docs.google.com/document/d/[DOC_ID]/edit`

### 2. Public Webpage
- Example: `https://en.wikipedia.org/wiki/Artificial_intelligence`
- Example: `https://www.bbc.com/news` (any news article)

### 3. Plain Text File
- Host a .txt file publicly or use a GitHub raw URL
- Example: `https://raw.githubusercontent.com/username/repo/main/README.md`

## Test Scenarios

### Test 1: Basic Link Submission via Assignment Input

**Steps:**
1. Navigate to the Assignments page
2. Click "Create New Assignment" or use the Assignment Input Hub
3. Select the "Link Submission" tab (3rd tab)
4. Paste a URL into the input field
5. Click "Add" button

**Expected Results:**
- ✓ Link status changes to "processing"
- ✓ After a few seconds, status changes to "completed"
- ✓ Link title is extracted and displayed
- ✓ Content preview is shown in the link card
- ✓ Copy button appears to copy extracted content
- ✓ No errors in browser console

**Success Criteria:**
- Link is successfully processed
- Extracted content is visible
- User can interact with the link (copy, remove)

---

### Test 2: Workshop Link Processing

**Steps:**
1. Navigate to the Workshop page (`/workshop`)
2. Click on the "Link" tab (2nd or 3rd tab in upload section)
3. Paste a URL into the input field
4. Click "Process Link" or similar button
5. Wait for processing to complete

**Expected Results:**
- ✓ Link is sent to backend
- ✓ Analysis popup opens showing:
  - Link title
  - Extracted content
  - AI analysis results
- ✓ Link appears in the files/links list
- ✓ Success message appears

**Success Criteria:**
- Link appears in workshop history
- Can view extracted content
- Can use the link content for further operations

---

### Test 3: Enhanced Link Analysis

**Steps:**
1. Follow Test 2 to add a link in Workshop
2. Click on the processed link in the list
3. View the Enhanced Link Processing Interface

**Expected Results:**
- ✓ Comprehensive analysis popup opens
- ✓ Analysis includes:
  - Summary (2-3 paragraphs)
  - Key Points (5-7 bullet points)
  - Content Type (e.g., "Academic Paper", "News Article")
  - Credibility Score (1-10)
  - Reading Time estimate
  - Word Count
  - Related Topics (5-8 tags)
  - Sentiment (positive/negative/neutral)
  - Suggested Actions (4-6 recommendations)
- ✓ Chat interface is available at the bottom
- ✓ Can ask questions about the link content

**Success Criteria:**
- All analysis fields are populated
- Analysis makes sense for the content
- Can chat about the link content

---

### Test 4: Link-to-Assignment Flow

**Steps:**
1. Upload a link via Assignment Input Hub
2. Extract content from the link
3. Use the extracted content to generate an assignment
4. Process the assignment with AI

**Expected Results:**
- ✓ Link content is extracted
- ✓ Can use extracted content as assignment input
- ✓ AI processes the content correctly
- ✓ Assignment is created with link content
- ✓ File upload record is created (file_type: 'link')

**Success Criteria:**
- Seamless flow from link to assignment
- Content is preserved throughout the process
- Assignment reflects the link content

---

### Test 5: Error Handling

**Test Invalid URLs:**

**Steps:**
1. Try submitting invalid URLs:
   - `not-a-url`
   - `http://` (incomplete)
   - `https://private-google-doc-link` (not publicly accessible)
   - `https://example.com/nonexistent-page` (404)

**Expected Results:**
- ✓ Validation error for invalid format
- ✓ Clear error message for inaccessible links
- ✓ Link status shows "error"
- ✓ User can remove failed link
- ✓ No crashes or console errors

**Success Criteria:**
- Graceful error handling
- User-friendly error messages
- Can recover and try another link

---

### Test 6: Token Limit Validation

**Steps:**
1. Use an account with low token balance
2. Try to submit a link
3. Observe behavior

**Expected Results:**
- ✓ Warning message about insufficient tokens
- ✓ Link submission button is disabled
- ✓ Clear message about upgrading plan
- ✓ No backend call is made

**Success Criteria:**
- Token limits are enforced
- User is informed before action
- Cannot bypass token limits

---

### Test 7: Link Storage and Retrieval

**Steps:**
1. Submit a link via Workshop
2. Check backend database for FileUpload record
3. Verify link is stored with correct metadata

**Database Query:**
```sql
SELECT * FROM file_uploads WHERE file_type = 'link' ORDER BY created_at DESC LIMIT 10;
```

**Expected Results:**
- ✓ FileUpload record exists
- ✓ `is_link` = true
- ✓ `link_url` contains the URL
- ✓ `link_title` contains extracted title
- ✓ `extracted_content` contains page content
- ✓ `ai_analysis` contains analysis results
- ✓ `processing_status` = 'completed'

**Success Criteria:**
- Data is persisted correctly
- All link-specific fields are populated
- Can retrieve and display stored links

---

### Test 8: Multiple Link Types

**Test each supported link type:**

**Google Docs:**
1. Submit a public Google Doc
2. Verify content is extracted as plain text

**PDF (if accessible publicly):**
1. Submit a public PDF URL
2. Check if PDF content extraction works or appropriate message is shown

**Plain Text:**
1. Submit a .txt file URL
2. Verify text content is extracted

**Webpage:**
1. Submit a regular webpage
2. Verify main content is extracted (not navigation/ads)

**Expected Results:**
- ✓ Each link type is correctly identified
- ✓ Appropriate extraction method is used
- ✓ Content quality is good for each type

**Success Criteria:**
- All supported link types work
- Content extraction is accurate
- Type detection is correct

---

## API Testing with cURL/Postman

### Test Link Extraction API

```bash
# Get auth token first
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=your_email@example.com&password=your_password"

# Extract from link
curl -X POST "http://localhost:8000/api/v1/assignment-input/extract-from-link" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://en.wikipedia.org/wiki/Artificial_intelligence"}'
```

### Test Workshop Link Processing

```bash
curl -X POST "http://localhost:8000/api/v1/workshop/links" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://en.wikipedia.org/wiki/Artificial_intelligence"}'
```

### Test Link Analysis

```bash
curl -X POST "http://localhost:8000/api/v1/workshop/analyze-link" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "link_id": "some-id",
    "url": "https://example.com",
    "content": "Your extracted content here..."
  }'
```

## Browser Developer Tools Testing

### Check Network Requests

1. Open DevTools (F12)
2. Go to Network tab
3. Submit a link
4. Verify:
   - POST request to `/api/v1/workshop/links` or `/api/v1/assignment-input/extract-from-link`
   - Status 200 response
   - Response contains title, content, analysis

### Check Console for Errors

1. Open Console tab
2. Submit a link
3. Verify:
   - No JavaScript errors
   - Appropriate log messages
   - No CORS errors

### Check Application State

1. Open React DevTools (if installed)
2. Inspect Workshop or Assignment components
3. Verify:
   - Link is added to state
   - Processing status updates correctly
   - Error states are handled

## Common Issues and Troubleshooting

### Issue: "Failed to extract content"
**Possible causes:**
- URL is not publicly accessible
- Website blocks scrapers
- Invalid URL format

**Solution:**
- Verify URL is public
- Try a different URL
- Check backend logs for detailed error

### Issue: "Insufficient tokens"
**Possible causes:**
- User has reached token limit
- Token calculation is incorrect

**Solution:**
- Check user's token balance
- Verify token deduction logic
- Upgrade subscription if needed

### Issue: Google Docs not loading
**Possible causes:**
- Document is not shared publicly
- Google is blocking the request

**Solution:**
- Ensure "Anyone with the link" sharing is enabled
- Try using a different Google Doc
- Check if Google Docs export URL is accessible

### Issue: Analysis not showing
**Possible causes:**
- AI service error
- Analysis request timeout
- Insufficient content

**Solution:**
- Check backend logs for AI errors
- Verify OpenAI API key is valid
- Ensure content was extracted properly

## Success Checklist

- [ ] Can submit Google Docs links
- [ ] Can submit public webpage links
- [ ] Can submit document file links
- [ ] Content extraction works for all types
- [ ] AI analysis is comprehensive and accurate
- [ ] Can chat with link content
- [ ] Error handling works properly
- [ ] Token limits are enforced
- [ ] Links are stored in database
- [ ] Can retrieve and view stored links
- [ ] UI is responsive and intuitive
- [ ] No console errors
- [ ] Performance is acceptable (< 10s for processing)

## Performance Benchmarks

- Link validation: < 2 seconds
- Content extraction: < 5 seconds
- AI analysis: < 10 seconds
- Total processing time: < 15 seconds

## Next Steps

After testing, document:
1. Which link types work best
2. Any edge cases or bugs found
3. Performance bottlenecks
4. User experience improvements needed
5. Feature requests from testing

