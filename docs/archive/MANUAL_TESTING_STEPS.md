# Manual Testing Steps for File Completion System

## 🚀 Quick Start Testing

### Option 1: Automated Backend Testing (Recommended)

1. **Run the comprehensive test script:**
   ```bash
   cd backend
   py test_manual_file_completion.py
   ```
   
2. **Choose option 1 or 3** to run automated tests
3. **Check the results** - it will create test documents and show you the results

### Option 2: API Testing

1. **Start the backend server:**
   ```bash
   cd backend
   py -m uvicorn app.main:app --reload
   ```

2. **Run the API test script:**
   ```bash
   py test_api_endpoints.py
   ```

3. **Follow the prompts** to test the API endpoints

### Option 3: Frontend Testing

1. **Start both servers:**
   ```bash
   # Terminal 1 - Backend
   cd backend
   py -m uvicorn app.main:app --reload

   # Terminal 2 - Frontend  
   cd frontend
   pnpm dev
   ```

2. **Open your browser:**
   - Go to http://localhost:5173
   - Log in with your credentials
   - Navigate to file upload/completion features
   - Upload a test document

## 📄 Creating Test Documents

### For DOCX Testing:
Create a Word document with:
- A title/heading
- Some regular text
- A table with empty cells marked with `_____` or `[INSERT ANSWER HERE]`
- Empty paragraphs

### For Text Testing:
Create a .txt file with:
```
Assignment: Complete this analysis

Section 1: Introduction
_____

Section 2: Main Points
[INSERT YOUR ANALYSIS HERE]

Section 3: Conclusion
_____
```

## 🔍 What to Look For

### ✅ Success Indicators:
- File uploads without errors
- Processing completes successfully
- Completed file is created with "filled_" prefix
- Completed file opens in Word without corruption
- Content is properly filled in empty sections
- Original structure is preserved

### ❌ Failure Indicators:
- Word shows "unreadable content" error
- Multiple "filled_" prefixes in filename
- Empty or corrupted output files
- Missing content in completed sections

## 🛠️ Troubleshooting

### If files are still corrupted:
1. Check the logs in the terminal running the backend
2. Verify the file format is supported
3. Try with a simpler test document
4. Check if the file is already processed (look for existing "filled_" files)

### If API tests fail:
1. Make sure the backend server is running
2. Check your login credentials
3. Verify the file path is correct
4. Check the server logs for error messages

## 📊 Expected Results

After successful testing, you should see:
- Clean, professional-looking completed documents
- No corruption errors when opening in Word
- Proper content filling in empty sections
- Maintained document structure and formatting
- Single "filled_" prefix in filenames

## 🎯 Testing Checklist

- [ ] Backend server starts without errors
- [ ] File upload works
- [ ] File processing completes
- [ ] Completed file is generated
- [ ] Completed file opens in Word
- [ ] No corruption errors
- [ ] Content is properly filled
- [ ] Structure is preserved
- [ ] Filename is clean (single "filled_" prefix)

## 📞 Getting Help

If you encounter issues:
1. Check the terminal logs for error messages
2. Try the automated test script first
3. Test with simple documents before complex ones
4. Verify all dependencies are installed
5. Check that the database is running (if applicable)
