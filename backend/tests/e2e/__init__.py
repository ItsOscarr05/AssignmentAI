"""
End-to-End tests for AssignmentAI.

These tests verify the complete system functionality by testing
real interactions between components, including:
- Database operations
- Cache operations
- API endpoints
- Background tasks
- File operations
"""

import os
import sys
from pathlib import Path

# Add project root to Python path
root_dir = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(root_dir)) 