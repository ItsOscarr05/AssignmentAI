# Link Functionality - Visual Flow Diagrams

## 🎯 Complete User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER ACTIONS                             │
└────────────┬────────────────────────────────────────────────────┘
             │
             ├─── Opens Workshop Page ────────────────────────────┐
             │                                                     │
             ├─── Clicks "Link" Tab ──────────────────────────────┤
             │                                                     │
             ├─── Pastes URL (e.g., Wikipedia article) ───────────┤
             │                                                     │
             ├─── Clicks "Process Link" ─────────────────────────→│
             │                                                     │
             └─────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND PROCESSING                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. URL Validation                                                │
│     - Check format (http/https)                                   │
│     - Validate structure                                          │
│                                                                   │
│  2. Token Check                                                   │
│     - Verify user has enough tokens                               │
│     - Show warning if insufficient                                │
│                                                                   │
│  3. API Call                                                      │
│     POST /api/v1/workshop/links                                   │
│     Body: { "url": "https://..." }                                │
│                                                                   │
└────────────┬────────────────────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND PROCESSING                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Step 1: Receive Request (workshop.py endpoint)                   │
│    └─→ Validate user authentication                               │
│                                                                   │
│  Step 2: Content Extraction (WebScrapingService)                  │
│    ├─→ Detect link type                                           │
│    │   ├─ Google Docs?  → Use export API                          │
│    │   ├─ Document?     → Download and parse                      │
│    │   └─ Webpage?      → Scrape with BeautifulSoup               │
│    │                                                               │
│    └─→ Extract content                                            │
│        ├─ Title                                                    │
│        ├─ Main content (text)                                      │
│        └─ Metadata                                                 │
│                                                                   │
│  Step 3: AI Analysis (LinkAnalysisService)                        │
│    ├─→ Generate summary                                           │
│    ├─→ Extract key points (5-7)                                   │
│    ├─→ Assess credibility (1-10)                                  │
│    ├─→ Analyze sentiment                                          │
│    ├─→ Identify topics                                            │
│    └─→ Generate suggested actions                                 │
│                                                                   │
│  Step 4: Database Storage (file_upload_crud)                      │
│    └─→ Create FileUpload record                                   │
│        ├─ file_type: 'link'                                        │
│        ├─ is_link: true                                            │
│        ├─ link_url: original URL                                   │
│        ├─ extracted_content: full text                             │
│        └─ ai_analysis: JSON analysis                               │
│                                                                   │
│  Step 5: Return Response                                          │
│    └─→ Send back: {                                               │
│           id, file_upload_id,                                      │
│           title, content, analysis                                 │
│        }                                                           │
│                                                                   │
└────────────┬────────────────────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND DISPLAY                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Enhanced Analysis Popup Opens                                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 📄 Link Title                                              │  │
│  │                                                            │  │
│  │ 📊 Summary                                                 │  │
│  │    [AI-generated 2-3 paragraph summary]                   │  │
│  │                                                            │  │
│  │ 🔑 Key Points                                              │  │
│  │    • Point 1                                               │  │
│  │    • Point 2                                               │  │
│  │    • ...                                                   │  │
│  │                                                            │  │
│  │ ⭐ Credibility: 8/10                                       │  │
│  │ 😊 Sentiment: Positive                                     │  │
│  │ ⏱️  Reading Time: 5 minutes                                │  │
│  │                                                            │  │
│  │ 🏷️  Related Topics                                         │  │
│  │    [Topic1] [Topic2] [Topic3]                             │  │
│  │                                                            │  │
│  │ 💡 Suggested Actions                                       │  │
│  │    1. Action 1                                             │  │
│  │    2. Action 2                                             │  │
│  │                                                            │  │
│  │ 💬 Chat Interface                                          │  │
│  │    Ask questions about this content...                    │  │
│  │    [Message input] [Send]                                 │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
             │
             ├─── User can chat with AI ──────────────────────────┐
             │                                                     │
             ├─── User can copy content ──────────────────────────┤
             │                                                     │
             ├─── User can link to assignment ────────────────────┤
             │                                                     │
             └─── User can download content ─────────────────────→│
```

## 🔄 Detailed Backend Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                  WebScrapingService Flow                          │
└──────────────────────────────────────────────────────────────────┘

extract_content_from_url(url)
    │
    ├─→ Parse URL
    │   └─→ Get domain, path, protocol
    │
    ├─→ Determine Link Type
    │   │
    │   ├─→ Contains "docs.google.com"?
    │   │   └─→ YES: _extract_google_docs_content()
    │   │       ├─ Extract document ID
    │   │       ├─ Convert to export URL
    │   │       ├─ Request: /export?format=txt
    │   │       └─ Return plain text
    │   │
    │   ├─→ Ends with .pdf, .doc, .docx, .txt?
    │   │   └─→ YES: _extract_document_content()
    │   │       ├─ Download file
    │   │       ├─ Parse based on type
    │   │       └─ Return extracted text
    │   │
    │   └─→ Otherwise: _extract_webpage_content()
    │       ├─ Fetch HTML
    │       ├─ Parse with BeautifulSoup
    │       ├─ Remove scripts/styles
    │       ├─ Find main content
    │       ├─ Extract title
    │       └─ Return cleaned text
    │
    └─→ Return {
            title: string,
            content: string,
            type: 'google-docs'|'document'|'webpage',
            url: string,
            extracted_at: timestamp
        }
```

```
┌──────────────────────────────────────────────────────────────────┐
│                LinkAnalysisService Flow                           │
└──────────────────────────────────────────────────────────────────┘

analyze_content_comprehensive(content, url, ai_service)
    │
    ├─→ Calculate Metrics
    │   ├─ word_count = len(content.split())
    │   └─ reading_time = word_count / 200 words per min
    │
    ├─→ _analyze_content_type(content, url)
    │   ├─ Check URL patterns (.edu, arxiv, github, etc.)
    │   ├─ Check content patterns (academic, news, blog, etc.)
    │   └─ Return content_type
    │
    ├─→ _assess_credibility(content, url)
    │   ├─ Start with base score: 5
    │   ├─ Check high credibility indicators (+points)
    │   │   • academic, research, university, .edu, .gov
    │   ├─ Check medium credibility indicators (+points)
    │   │   • news, article, analysis
    │   ├─ Check low credibility indicators (-points)
    │   │   • personal blog, unverified
    │   ├─ Check content quality (length, references)
    │   └─ Return score 1-10
    │
    ├─→ _extract_key_points(content, ai_service)
    │   ├─ Create AI prompt
    │   ├─ Ask for 5-7 key points
    │   ├─ Parse AI response
    │   ├─ Clean up formatting
    │   └─ Return list of points
    │
    ├─→ _generate_summary(content, ai_service)
    │   ├─ Create AI prompt
    │   ├─ Ask for 2-3 paragraph summary
    │   ├─ Get AI response
    │   └─ Return summary text
    │
    ├─→ _analyze_sentiment(content, ai_service)
    │   ├─ Create AI prompt
    │   ├─ Ask for positive/negative/neutral
    │   ├─ Parse response
    │   └─ Return sentiment
    │
    ├─→ _identify_related_topics(content, ai_service)
    │   ├─ Create AI prompt
    │   ├─ Ask for 5-8 topics
    │   ├─ Parse and clean topics
    │   ├─ Remove duplicates
    │   └─ Return list of topics
    │
    ├─→ _generate_suggested_actions(content, type, credibility)
    │   ├─ Create contextual prompt
    │   ├─ Ask for 4-6 actionable suggestions
    │   ├─ Parse response
    │   └─ Return list of actions
    │
    └─→ Return {
            summary, keyPoints, contentType,
            credibility, readingTime, wordCount,
            relatedTopics, sentiment,
            suggestedActions, analyzedAt
        }
```

## 🗄️ Database Storage

```
┌──────────────────────────────────────────────────────────────────┐
│                    FileUpload Table Record                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  id: 123                                                          │
│  filename: "Article Title"                                        │
│  original_filename: "Article Title"                               │
│  file_path: "https://example.com/article"                         │
│  file_size: 12345 (bytes)                                         │
│  mime_type: "text/html"                                           │
│  file_type: "link" ← Special identifier                           │
│                                                                   │
│  extracted_content: "Full extracted text content..."              │
│  ai_analysis: '{"summary": "...", "keyPoints": [...], ...}'       │
│  processing_status: "completed"                                   │
│                                                                   │
│  user_id: 456                                                     │
│  assignment_id: null (or linked assignment ID)                    │
│                                                                   │
│  is_link: true ← Flag for link type                               │
│  link_url: "https://example.com/article"                          │
│  link_title: "Article Title"                                      │
│  link_description: "First 500 chars of content..."                │
│                                                                   │
│  upload_metadata: {                                               │
│    "uploaded_via": "workshop",                                    │
│    "timestamp": "2024-01-01T00:00:00"                             │
│  }                                                                │
│                                                                   │
│  created_at: 2024-01-01 00:00:00                                  │
│  updated_at: 2024-01-01 00:00:00                                  │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

## 🔌 API Endpoint Flow

```
POST /api/v1/workshop/links
│
├─→ Request Headers
│   └─ Authorization: Bearer <token>
│
├─→ Request Body
│   └─ { "url": "https://example.com" }
│
├─→ Endpoint Handler (workshop.py)
│   ├─ Authenticate user
│   ├─ Validate URL
│   ├─ Check token limits
│   ├─ Call WebScrapingService
│   ├─ Call LinkAnalysisService
│   ├─ Create FileUpload record
│   └─ Return response
│
└─→ Response (200 OK)
    └─ {
           "id": "uuid",
           "file_upload_id": 123,
           "url": "https://example.com",
           "title": "Article Title",
           "content": "Extracted content...",
           "type": "webpage",
           "analysis": "AI analysis...",
           "extracted_at": "2024-01-01T00:00:00"
       }
```

## 🎨 Frontend State Management

```
┌──────────────────────────────────────────────────────────────────┐
│                    WorkshopStore (Zustand)                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  State:                                                           │
│    links: Link[]                                                  │
│    isLoading: boolean                                             │
│    error: string | null                                           │
│    featureAccessError: FeatureAccessError | null                  │
│                                                                   │
│  Actions:                                                         │
│    addLink(link)                                                  │
│      ├─ Set loading state                                         │
│      ├─ POST to /workshop/links                                   │
│      ├─ Add to links array                                        │
│      ├─ Add to history                                            │
│      └─ Update loading state                                      │
│                                                                   │
│    deleteLink(id)                                                 │
│      ├─ Set loading state                                         │
│      ├─ DELETE /workshop/links/{id}                               │
│      ├─ Remove from links array                                   │
│      └─ Update loading state                                      │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

## ⚡ Performance Timeline

```
T+0s    User clicks "Process Link"
        └─→ Frontend validation (instant)

T+0.1s  API request sent
        └─→ POST /workshop/links

T+0.2s  Backend receives request
        └─→ Authenticate user

T+0.3s  WebScraping starts
        └─→ Fetch URL content

T+2s    Content downloaded
        └─→ Parse and extract

T+2.5s  Content extraction complete
        └─→ Start AI analysis

T+3s    AI generates summary
        └─→ GPT-4 API call

T+8s    AI extracts key points
        └─→ Multiple AI operations

T+10s   AI analysis complete
        └─→ Generate final analysis object

T+10.5s Database save
        └─→ Create FileUpload record

T+11s   Response sent
        └─→ Return to frontend

T+11.5s Frontend updates
        └─→ Open analysis popup

T+12s   User sees results
        └─→ Can interact with content

Total: ~12 seconds (typical)
```

## 🔄 Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     Error Scenarios                              │
└─────────────────────────────────────────────────────────────────┘

Invalid URL Format
    └─→ Frontend validation catches
        └─→ Show error: "Please enter a valid URL"
        └─→ User can retry

Insufficient Tokens
    └─→ Frontend checks before sending
        └─→ Show warning: "Upgrade your plan"
        └─→ Disable submit button

URL Not Accessible (403, 404, 500)
    └─→ WebScrapingService catches
        └─→ Return error to endpoint
        └─→ Frontend shows: "Cannot access URL"
        └─→ User can try different URL

Google Docs Not Public
    └─→ Export API returns 403
        └─→ Catch in _extract_google_docs_content
        └─→ Return error: "Doc not publicly accessible"
        └─→ User shown sharing instructions

AI Service Error
    └─→ OpenAI API fails
        └─→ Catch in analysis methods
        └─→ Return partial results or fallback
        └─→ Log error for debugging

Database Error
    └─→ FileUpload creation fails
        └─→ Rollback transaction
        └─→ Return error to frontend
        └─→ User can retry

Network Timeout
    └─→ Request takes too long
        └─→ Timeout after 30s
        └─→ Return timeout error
        └─→ Suggest trying shorter content
```

## 📱 Mobile vs Desktop Flow

```
┌─────────────────────────────┬──────────────────────────────┐
│          MOBILE             │         DESKTOP              │
├─────────────────────────────┼──────────────────────────────┤
│                             │                              │
│  Stack Layout               │  Side-by-side Layout         │
│  ┌───────────────────┐      │  ┌─────────┬──────────────┐  │
│  │ Link Input        │      │  │ Link    │ Preview/     │  │
│  │                   │      │  │ Input   │ Analysis     │  │
│  │ [URL field]       │      │  │         │              │  │
│  │ [Process]         │      │  │ [Field] │ [Content]    │  │
│  └───────────────────┘      │  │ [Send]  │              │  │
│           ↓                 │  │         │ [Key Points] │  │
│  ┌───────────────────┐      │  └─────────┴──────────────┘  │
│  │ Analysis Results  │      │                              │
│  │                   │      │  Immediate side-by-side      │
│  │ [Summary]         │      │  comparison                  │
│  │ [Key Points]      │      │                              │
│  │ [Actions]         │      │                              │
│  └───────────────────┘      │                              │
│           ↓                 │                              │
│  ┌───────────────────┐      │                              │
│  │ Chat Interface    │      │                              │
│  │                   │      │                              │
│  │ [Messages]        │      │                              │
│  │ [Input]           │      │                              │
│  └───────────────────┘      │                              │
│                             │                              │
│  Vertical scroll required   │  More visible at once        │
│                             │                              │
└─────────────────────────────┴──────────────────────────────┘
```

## 🎯 Quick Reference: What Happens When

| User Action   | Frontend          | Backend          | Result                  |
| ------------- | ----------------- | ---------------- | ----------------------- |
| Paste URL     | Validates format  | -                | Button enabled/disabled |
| Click Process | POST to API       | Receive request  | Loading state           |
| -             | Show loading      | Extract content  | Progress indicator      |
| -             | Wait              | Analyze with AI  | Still loading           |
| -             | Wait              | Save to database | Almost done             |
| -             | Receive response  | Return data      | Display analysis        |
| View Analysis | Open popup        | -                | See full results        |
| Ask Question  | POST chat request | Process with AI  | Get answer              |
| Copy Content  | Copy to clipboard | -                | Content copied          |
| Download      | Create blob       | -                | File downloaded         |

---

**This diagram shows the complete flow of link functionality from user action to final result!**
