#!/usr/bin/env python3
"""Test script to verify imports in backend/main.py"""
import sys
import os

# Add the backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

try:
    import main
    print("✅ Import successful!")
    
    # Check that the FastAPI app is created
    if hasattr(main, 'app'):
        print(f"✅ FastAPI app created: {main.app.title}")
    else:
        print("❌ FastAPI app not found")
        
    # Check that the models are imported
    if hasattr(main, 'ObjectionTypeEnum'):
        print(f"✅ ObjectionTypeEnum imported: {main.ObjectionTypeEnum}")
    else:
        print("❌ ObjectionTypeEnum not imported")
        
    if hasattr(main, 'ItemizedTask'):
        print(f"✅ ItemizedTask imported")
    else:
        print("❌ ItemizedTask not imported")
        
    if hasattr(main, 'RepairEstimate'):
        print(f"✅ RepairEstimate imported")
    else:
        print("❌ RepairEstimate not imported")
        
except Exception as e:
    print(f"❌ Import failed: {e}")
    import traceback
    traceback.print_exc()