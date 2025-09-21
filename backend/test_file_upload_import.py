#!/usr/bin/env python3
"""
Test script to check if FileUpload model can be imported and registered
"""

import os
import sys

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from app.models.file_upload import FileUpload
    print("✓ FileUpload model imported successfully")
    
    from app.db.base_class import Base
    print("✓ Base imported successfully")
    
    # Check if FileUpload is registered with Base
    if hasattr(Base, 'metadata'):
        tables = Base.metadata.tables.keys()
        print(f"Tables in Base.metadata: {list(tables)}")
        
        if 'file_uploads' in tables:
            print("✓ file_uploads table is registered with Base")
        else:
            print("✗ file_uploads table is NOT registered with Base")
    else:
        print("✗ Base.metadata not found")
        
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()
