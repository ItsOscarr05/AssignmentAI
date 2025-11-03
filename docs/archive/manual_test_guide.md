# Manual Testing Guide for File Completion System

## Method 1: API Testing with curl/Postman

### Step 1: Start the Backend Server

```bash
cd backend
py -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Step 2: Get Authentication Token

```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your_email@example.com",
    "password": "your_password"
  }'
```

### Step 3: Upload and Fill a File

```bash
# Replace YOUR_TOKEN with the token from step 2
curl -X POST "http://localhost:8000/api/v1/file-processing/fill" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/your/test_document.docx"
```

### Step 4: Download the Completed File

```bash
# Use the file_id from the response
curl -X GET "http://localhost:8000/api/v1/file-processing/download/FILE_ID" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o "completed_document.docx"
```

## Method 2: Frontend Testing

### Step 1: Start Frontend

```bash
cd frontend
pnpm dev
```

### Step 2: Access the Application

1. Open http://localhost:5173
2. Log in with your credentials
3. Navigate to the file upload section
4. Upload a test document
5. Use the file completion feature

## Method 3: Direct Backend Testing

### Create a Test Script

```python
# test_manual_completion.py
import asyncio
import tempfile
from pathlib import Path
from app.services.file_processing_service import FileProcessingService

async def test_file_completion():
    # Create a test document
    with tempfile.TemporaryDirectory() as temp_dir:
        # Your test code here
        pass

if __name__ == "__main__":
    asyncio.run(test_file_completion())
```

## Method 4: Database Testing

### Check File Records

```python
# Check what files are in the database
from app.core.deps import get_db
from app.models.file_upload import FileUpload

db = next(get_db())
files = db.query(FileUpload).all()
for file in files:
    print(f"File: {file.filename}, Status: {file.processing_status}")
```
