# File Upload System - Quick Start Guide

## Installation

### 1. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

**Windows Users:** The `python-magic-bin` package will automatically install required DLL files.

**Linux/Mac Users:** You may need to install libmagic:

```bash
# Ubuntu/Debian
sudo apt-get install libmagic1

# macOS
brew install libmagic
```

### 2. Verify Installation

Run this Python command to verify python-magic is working:

```python
import magic
print("Magic library loaded successfully!")
```

---

## What's Changed

### ✅ Word Documents (.doc, .docx)

- **Before:** .doc files weren't read properly, often failed or returned garbled text
- **After:** Full support for both legacy .doc and modern .docx formats
- **Features:**
  - Multi-method extraction for .doc files
  - Table content extraction
  - Fillable blank detection

### ✅ Excel Files (.xls, .xlsx)

- **Before:** Formulas weren't preserved, CSV confusion
- **After:**
  - `.xlsx` files preserve formulas AND calculated values
  - `.xls` legacy files fully supported
  - Clear separation from CSV files
- **Features:**
  - Formula tracking with cell references
  - Multi-sheet support
  - Proper data formatting

### ✅ File Type Validation

- **Before:** Files validated by extension only
- **After:** Magic byte validation ensures correct file types
- **Features:**
  - Detects misnamed files (e.g., Excel file with .csv extension)
  - Helpful error messages with format recommendations
  - Cross-platform support

---

## Testing Your Upload

### Quick Test Commands

```bash
# Test the backend server
cd backend
python -m pytest tests/test_file_upload_import.py -v

# Test file processing
python test_file_types_manual.py
```

### Manual Testing Checklist

#### 1. Word Documents

- [ ] Upload a `.docx` file → Should extract text and tables
- [ ] Upload a legacy `.doc` file → Should extract content
- [ ] Try renaming a `.docx` to `.doc` → Should still work
- [ ] Upload file with fillable blanks (\_\_\_\_) → Should detect them

#### 2. Excel Files

- [ ] Upload `.xlsx` with formulas → Should show formulas and values
- [ ] Upload legacy `.xls` file → Should read data
- [ ] Upload multi-sheet workbook → Should show all sheets
- [ ] Try renaming `.xlsx` to `.csv` → Should reject with helpful message

#### 3. CSV Files

- [ ] Upload actual `.csv` file → Should read as plain text
- [ ] Verify it's NOT treated as Excel

#### 4. Other Formats

- [ ] Upload PDF → Should extract text
- [ ] Upload code file (.py, .js) → Should read content
- [ ] Upload image → Should accept for OCR

---

## Common Issues & Solutions

### Issue: "Failed to initialize python-magic"

**Solution:**

- Windows: Reinstall `python-magic-bin`
- Linux/Mac: Install libmagic system library

### Issue: "Unable to read .doc file"

**Solution:**

- Save file as .docx format
- Check if file is corrupted
- Verify olefile is installed: `pip install olefile`

### Issue: "File appears to be Excel but has .csv extension"

**Solution:**

- Open file in Excel
- Save As → Excel Workbook (.xlsx)
- Upload the new .xlsx file

### Issue: "No formulas detected in Excel file"

**Solution:**

- This is normal for .xls files (formulas are calculated)
- Use .xlsx format to preserve formulas

---

## File Format Recommendations

### For Users

| If you have...            | Upload as...      | Why?                                        |
| ------------------------- | ----------------- | ------------------------------------------- |
| Word document             | `.docx`           | Best compatibility, preserves formatting    |
| Legacy Word               | `.doc`            | Now fully supported!                        |
| Spreadsheet with formulas | `.xlsx`           | Preserves formulas and values               |
| Legacy Excel              | `.xls`            | Supported, but formulas calculated          |
| Simple tabular data       | `.csv` or `.xlsx` | CSV for simple data, Excel for calculations |
| Scanned document          | `.pdf` or image   | OCR will extract text                       |

### Migration Tips

1. **Converting .doc to .docx:**

   - Open in Microsoft Word
   - File → Save As → Word Document (.docx)

2. **Converting .xls to .xlsx:**

   - Open in Microsoft Excel
   - File → Save As → Excel Workbook (.xlsx)

3. **Converting CSV to Excel:**
   - Open CSV in Excel
   - File → Save As → Excel Workbook (.xlsx)

---

## Expected Behavior

### Word Documents

```
Input: assignment.docx with text "Complete the following: ______"
Output: Detects fillable blank, extracts all text including tables
```

### Excel Files

```
Input: grades.xlsx with formula "=SUM(A1:A10)" in cell B1
Output: Shows both formula text and calculated value
```

### CSV Files

```
Input: data.csv with comma-separated values
Output: Reads as plain text, line by line
```

### File Type Mismatch

```
Input: spreadsheet.csv (actually an Excel file)
Output: Error - "File appears to be an Excel file, but has .csv extension.
        Please save as .xlsx or .xls format."
```

---

## API Changes

### New Response Fields

#### Excel Files

```json
{
  "sheets": { ... },
  "formulas": {
    "Sheet1": [
      {
        "cell": "B1",
        "formula": "=SUM(A1:A10)",
        "value": 45
      }
    ]
  },
  "has_formulas": true,
  "file_type": "xlsx"
}
```

#### Word Documents

```json
{
  "text": "...",
  "fillable_blanks": [
    {
      "text": "_____",
      "type": "underline_blank",
      "context": "Complete the following: _____",
      "confidence": 0.9
    }
  ]
}
```

---

## Performance Notes

- `.docx` files: Fast (direct XML parsing)
- `.doc` files: Slower (multiple extraction methods)
- `.xlsx` files: Loaded twice for formula preservation
- `.xls` files: Moderate (pandas with xlrd)
- Large files: May take a few seconds for validation

---

## Security Improvements

1. **Magic byte validation** prevents file type spoofing
2. **Content-based detection** catches misnamed files
3. **Size limits** enforced (100MB default)
4. **Sanitized filenames** prevent path traversal
5. **Error messages** don't expose system paths

---

## Monitoring

### Log Messages to Watch For

**Success:**

```
INFO: File validated: document.docx - MIME: application/vnd.openxmlformats-...
INFO: DOCX content extracted successfully, length: 1234
INFO: Excel content formatted successfully, length: 5678
```

**Warnings:**

```
WARNING: Office file type mismatch: extension=.doc, detected=application/zip
WARNING: docx2txt failed for .doc file: [error]
```

**Errors:**

```
ERROR: File type mismatch: .csv file expected, but detected application/vnd.ms-excel
ERROR: All methods failed for .doc file: [error]
```

---

## Support

For issues or questions:

1. Check `backend/logs/` for detailed error messages
2. Verify file integrity (try opening in respective application)
3. Test with a known-good file of the same type
4. Review the comprehensive summary: `FILE_UPLOAD_SYSTEM_REVISION_SUMMARY.md`

---

## Summary

✅ **Word documents** - Full support for .doc and .docx  
✅ **Excel files** - Formula preservation in .xlsx, proper .xls support  
✅ **File validation** - Magic byte checking prevents misreading  
✅ **User guidance** - Helpful error messages for wrong formats  
✅ **Cross-platform** - Works on Windows, Linux, macOS

Your file upload system is now production-ready with comprehensive format support!
