#!/usr/bin/env python3
"""
Detailed debug script to check model registration
"""

import os
import sys

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from app.db.base_class import Base
    print("✓ Base imported")
    print(f"Base.metadata.tables before imports: {list(Base.metadata.tables.keys())}")
    
    # Import models one by one to see which one causes issues
    print("\n--- Importing models one by one ---")
    
    try:
        from app.models.user import User
        print("✓ User imported")
        print(f"Tables after User: {list(Base.metadata.tables.keys())}")
    except Exception as e:
        print(f"✗ User import failed: {e}")
    
    try:
        from app.models.assignment import Assignment
        print("✓ Assignment imported")
        print(f"Tables after Assignment: {list(Base.metadata.tables.keys())}")
    except Exception as e:
        print(f"✗ Assignment import failed: {e}")
    
    try:
        from app.models.file_upload import FileUpload
        print("✓ FileUpload imported")
        print(f"Tables after FileUpload: {list(Base.metadata.tables.keys())}")
    except Exception as e:
        print(f"✗ FileUpload import failed: {e}")
        import traceback
        traceback.print_exc()
    
    print(f"\nFinal tables: {list(Base.metadata.tables.keys())}")
    
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()
