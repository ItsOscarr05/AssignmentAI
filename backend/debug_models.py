#!/usr/bin/env python3
"""
Debug script to check model registration
"""

import os
import sys

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from app.db.base_class import Base
    print("✓ Base imported")
    
    # Import all models
    from app.models import *
    print("✓ All models imported")
    
    # Check what tables are registered
    print(f"Tables registered with Base: {list(Base.metadata.tables.keys())}")
    
    # Check if FileUpload is specifically registered
    if 'file_uploads' in Base.metadata.tables:
        table = Base.metadata.tables['file_uploads']
        print(f"✓ FileUpload table found: {table}")
        print(f"Columns: {list(table.columns.keys())}")
    else:
        print("✗ FileUpload table not found in Base.metadata.tables")
        
    # Try to import FileUpload specifically
    from app.models.file_upload import FileUpload
    print("✓ FileUpload imported directly")
    
    # Check again after direct import
    print(f"Tables after direct import: {list(Base.metadata.tables.keys())}")
    
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()
