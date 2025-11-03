# Link Functionality Quick Reference

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────┐  ┌──────────────────────────────────┐ │
│  │ Assignment Input    │  │ Workshop Page                     │ │
│  │ Hub                 │  │                                   │ │
│  │                     │  │  - Link Input Tab                 │ │
│  │  - Link Submission  │  │  - Link Processing Interface      │ │
│  │    Form             │  │  - Enhanced Analysis Popup        │ │
│  └──────────┬──────────┘  └────────────┬─────────────────────┘ │
│             │                           │                        │
│             └───────────────┬───────────┘                        │
│                             ↓                                    │
│                  ┌──────────────────────┐                        │
│                  │ WorkshopService      │                        │
│                  │ assignmentInputService│                       │
│                  └──────────┬───────────┘                        │
└─────────────────────────────┼────────────────────────────────────┘
                              │
                              │ HTTP POST
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  API Endpoints:                                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ POST /assignment-input/extract-from-link                    ││
│  │ POST /assignment-input/validate-link                        ││
│  │ POST /workshop/links                                        ││
│  │ POST /workshop/analyze-link                                 ││
│  │ POST /workshop/chat-with-link                               ││
│  └────────────┬────────────────────────────────────────────────┘│
│               ↓                                                   │
│  Services:                                                        │
│  ┌──────────────────────┐  ┌─────────────────────────────────┐ │
│  │ WebScrapingService   │  │ LinkAnalysisService             │ │
│  │                      │  │                                 │ │
│  │ - Google Docs        │  │ - AI Summarization              │ │
│  │ - Document Files     │→ │ - Key Points Extraction         │ │
│  │ - Webpages           │  │ - Credibility Assessment        │ │
│  │                      │  │ - Sentiment Analysis            │ │
│  └──────────┬───────────┘  └─────────────┬───────────────────┘ │
│             │                             │                      │
│             └─────────────┬───────────────┘                      │
│                           ↓                                      │
│                  ┌────────────────────┐                          │
│                  │ FileUpload Model   │                          │
│                  │ (file_type: 'link')│                          │
│                  └────────────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
```

## Data Model (FileUpload for Links)

```python
FileUpload {
    id: int
    filename: str                  # Link title or URL
    file_type: "link"              # Special type for links
    is_link: true                  # Flag indicating this is a link
    link_url: str                  # Original URL
    link_title: str                # Extracted title
    link_description: str          # Content preview (first 500 chars)
    extracted_content: str         # Full extracted content
    ai_analysis: str               # AI-generated analysis (JSON)
    processing_status: str         # 'pending', 'processing', 'completed', 'failed'
    user_id: int                   # Owner
    assignment_id: int | null      # Optional link to assignment
    created_at: datetime
    updated_at: datetime
}
```

## API Endpoints Reference

### 1. Extract Content from Link
```
POST /api/v1/assignment-input/extract-from-link
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "url": "https://example.com/article"
}

Response:
{
  "id": "12345",
  "url": "https://example.com/article",
  "title": "Article Title",
  "content": "Extracted content...",
  "type": "webpage",
  "status": "completed",
  "extracted_at": 1234567890.0
}
```

### 2. Process Link in Workshop
```
POST /api/v1/workshop/links
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "url": "https://example.com/article"
}

Response:
{
  "id": "uuid-here",
  "file_upload_id": 123,
  "url": "https://example.com/article",
  "title": "Article Title",
  "content": "Extracted content...",
  "type": "webpage",
  "analysis": "AI-generated analysis...",
  "extracted_at": "2024-01-01T00:00:00"
}
```

### 3. Get Comprehensive Analysis
```
POST /api/v1/workshop/analyze-link
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "link_id": "some-id",
  "url": "https://example.com",
  "content": "Content to analyze..."
}

Response:
{
  "analysis": {
    "summary": "2-3 paragraph summary...",
    "keyPoints": ["Point 1", "Point 2", ...],
    "contentType": "Academic Paper",
    "credibility": 8,
    "readingTime": 5,
    "wordCount": 1200,
    "relatedTopics": ["Topic 1", "Topic 2", ...],
    "sentiment": "positive",
    "suggestedActions": ["Action 1", "Action 2", ...],
    "analyzedAt": "2024-01-01T00:00:00"
  }
}
```

### 4. Chat with Link Content
```
POST /api/v1/workshop/chat-with-link
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "link_id": "some-id",
  "message": "What are the main points?",
  "content": "Link content...",
  "chat_history": []
}

Response:
{
  "response": "The main points are...",
  "timestamp": "2024-01-01T00:00:00"
}
```

## Supported Link Types

| Type | Examples | Status | Notes |
|------|----------|--------|-------|
| Google Docs | `https://docs.google.com/document/d/...` | ✅ Working | Must be publicly shared |
| Plain Text | `https://example.com/file.txt` | ✅ Working | Direct text extraction |
| PDF | `https://example.com/document.pdf` | ⚠️ Limited | Requires PDF parsing library |
| Word Docs | `https://example.com/doc.docx` | ⚠️ Limited | Requires DOCX parsing library |
| Webpages | `https://example.com/article` | ✅ Working | Uses BeautifulSoup |

## Key Features

### Content Extraction
- **Google Docs**: Exports to plain text format
- **Webpages**: Extracts main content (articles, posts)
- **Documents**: Downloads and parses supported formats

### AI Analysis
- **Summary**: 2-3 paragraph overview
- **Key Points**: 5-7 main takeaways
- **Credibility**: Scored 1-10 based on indicators
- **Content Type**: Academic, News, Blog, Tutorial, etc.
- **Sentiment**: Positive, Negative, or Neutral
- **Related Topics**: 5-8 relevant topics
- **Suggested Actions**: 4-6 recommendations

### Interactive Features
- **Chat Interface**: Ask questions about content
- **Copy to Clipboard**: Quick content copying
- **Version History**: Track changes (if applicable)
- **Link to Assignment**: Associate with assignments

## Token Usage

| Operation | Estimated Tokens |
|-----------|-----------------|
| Content Extraction | ~200 tokens |
| AI Analysis | ~1000-2000 tokens |
| Chat Message | ~200-500 tokens per message |

## Common Use Cases

### 1. Research Paper Analysis
```
User submits academic paper URL
→ System extracts abstract, content
→ AI identifies key findings
→ User chats to understand methodology
→ Link to research assignment
```

### 2. News Article Processing
```
User submits news article
→ System extracts article text
→ AI summarizes main points
→ Credibility assessment provided
→ User incorporates into assignment
```

### 3. Google Docs Import
```
User shares Google Doc link
→ System exports to text
→ AI analyzes document structure
→ User edits via chat interface
→ Downloads updated version
```

## Frontend Components

### LinkSubmissionForm.tsx
- **Location**: `frontend/src/components/input/LinkSubmissionForm.tsx`
- **Purpose**: Basic link submission with validation
- **Features**: URL validation, token checking, processing status

### Workshop.tsx
- **Location**: `frontend/src/pages/Workshop.tsx`
- **Purpose**: Main workshop interface with link tab
- **Features**: Link input, file uploads, content generation

### EnhancedLinkProcessingInterface.tsx
- **Location**: `frontend/src/components/workshop/EnhancedLinkProcessingInterface.tsx`
- **Purpose**: Comprehensive link analysis display
- **Features**: AI analysis, chat interface, actions

## Backend Services

### WebScrapingService
- **Location**: `backend/app/services/web_scraping.py`
- **Purpose**: Extract content from URLs
- **Methods**: 
  - `extract_content_from_url(url)`
  - `validate_url(url)`

### LinkAnalysisService
- **Location**: `backend/app/services/link_analysis_service.py`
- **Purpose**: AI-powered content analysis
- **Methods**: 
  - `analyze_content_comprehensive(content, url, ai_service)`

## Configuration

### Required Dependencies
```python
# Backend (requirements.txt)
aiohttp
beautifulsoup4
openai
```

```json
// Frontend (package.json)
"@mui/material"
"@mui/icons-material"
"axios"
"zustand"
```

### Environment Variables
```bash
# .env
OPENAI_API_KEY=your_key_here
```

## Troubleshooting

### Link not extracting
1. Check if URL is publicly accessible
2. Verify URL format is correct
3. Check backend logs for errors
4. Test with simple webpage first

### AI analysis failing
1. Check OpenAI API key
2. Verify token limits
3. Check content length (too short/long)
4. Review backend logs for API errors

### Google Docs not loading
1. Ensure "Anyone with link" sharing
2. Try exporting manually to verify access
3. Check if document ID is extracted correctly

## Performance Tips

1. **Caching**: Store extracted content to avoid re-scraping
2. **Async Processing**: Use background jobs for large documents
3. **Rate Limiting**: Implement rate limits for external requests
4. **Content Truncation**: Limit content length for AI processing

## Security Considerations

1. **URL Validation**: Always validate URLs before processing
2. **Content Sanitization**: Clean extracted HTML/text
3. **Rate Limiting**: Prevent abuse of scraping service
4. **User Permissions**: Verify user has access rights
5. **Token Limits**: Enforce subscription limits

## Future Enhancements

- [ ] Support for more document types (EPUB, Markdown)
- [ ] Better PDF extraction (PyPDF2/pdfplumber)
- [ ] Authentication for private links
- [ ] Batch link processing
- [ ] Link preview before processing
- [ ] Advanced filtering options
- [ ] Export analyzed links
- [ ] Share link analysis with others

