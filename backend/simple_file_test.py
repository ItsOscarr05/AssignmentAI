#!/usr/bin/env python3
"""
Simple test script to check file processing without complex imports
"""

import os
import sys
import tempfile
import json

def test_basic_file_operations():
    """Test basic file operations to see what works"""
    print("Testing basic file operations...")
    
    # Create a temporary directory
    test_dir = tempfile.mkdtemp(prefix="file_test_")
    print(f"Created test directory: {test_dir}")
    
    # Test creating different file types
    file_tests = {
        'txt': 'test.txt',
        'csv': 'test.csv', 
        'json': 'test.json',
        'xml': 'test.xml',
        'html': 'test.html',
        'css': 'test.css',
        'js': 'test.js',
        'py': 'test.py'
    }
    
    results = {}
    
    # Create test files
    for file_type, filename in file_tests.items():
        file_path = os.path.join(test_dir, filename)
        try:
            if file_type == 'txt':
                content = "Test document with blanks: _____ and _____"
            elif file_type == 'csv':
                content = "Question,Answer\nWhat is gravity?,_____\nWho is Einstein?,_____"
            elif file_type == 'json':
                content = '{"questions": [{"q": "What is gravity?", "a": ""}, {"q": "Who is Einstein?", "a": ""}]}'
            elif file_type == 'xml':
                content = '<quiz><question answer="">What is gravity?</question><question answer="">Who is Einstein?</question></quiz>'
            elif file_type == 'html':
                content = '<html><body><p>What is gravity? _____</p><p>Who is Einstein? _____</p></body></html>'
            elif file_type == 'css':
                content = '/* TODO: Add styles */\nbody { /* _____ */ }'
            elif file_type == 'js':
                content = '// TODO: Add functionality\nfunction test() {\n    // _____\n}'
            elif file_type == 'py':
                content = '# TODO: Add functionality\ndef test():\n    # _____\n    pass'
            
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            # Test reading the file
            with open(file_path, 'r', encoding='utf-8') as f:
                read_content = f.read()
            
            results[file_type] = {
                'status': 'success',
                'file_created': True,
                'file_read': True,
                'content_length': len(read_content),
                'has_blanks': '_____' in read_content,
                'has_todos': 'TODO' in read_content
            }
            
            print(f"✓ {file_type.upper()}: Created and read successfully")
            
        except Exception as e:
            results[file_type] = {
                'status': 'failed',
                'error': str(e)
            }
            print(f"✗ {file_type.upper()}: Failed - {e}")
    
    # Test file processing libraries
    print("\nTesting file processing libraries...")
    
    library_tests = {
        'pandas': 'CSV/Excel processing',
        'openpyxl': 'Excel processing', 
        'docx': 'Word document processing',
        'PyPDF2': 'PDF processing',
        'PIL': 'Image processing',
        'pytesseract': 'OCR processing'
    }
    
    for library, description in library_tests.items():
        try:
            __import__(library)
            print(f"✓ {library}: Available - {description}")
        except ImportError:
            print(f"✗ {library}: Not available - {description}")
    
    # Generate report
    print(f"\n{'='*60}")
    print("FILE PROCESSING TEST REPORT")
    print(f"{'='*60}")
    
    successful_files = sum(1 for r in results.values() if r.get('status') == 'success')
    failed_files = sum(1 for r in results.values() if r.get('status') == 'failed')
    
    print(f"File Creation Tests:")
    print(f"  Successful: {successful_files}")
    print(f"  Failed: {failed_files}")
    print(f"  Total: {len(results)}")
    
    print(f"\nDetailed Results:")
    for file_type, result in results.items():
        if result['status'] == 'success':
            print(f"  {file_type.upper()}: ✓ Created ({result['content_length']} chars, blanks: {result['has_blanks']}, todos: {result['has_todos']})")
        else:
            print(f"  {file_type.upper()}: ✗ Failed - {result['error']}")
    
    # Save results
    report_file = os.path.join(test_dir, "test_report.json")
    with open(report_file, 'w', encoding='utf-8') as f:
        json.dump({
            'timestamp': '2024-01-01T00:00:00Z',
            'results': results,
            'test_directory': test_dir
        }, f, indent=2)
    
    print(f"\nTest files saved in: {test_dir}")
    print(f"Report saved to: {report_file}")
    
    return results

if __name__ == "__main__":
    test_basic_file_operations()
