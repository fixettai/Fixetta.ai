#!/usr/bin/env python3
"""
Check environment variables for Fixetta.ai backend.
"""

import os
from dotenv import load_dotenv

def check_env_variables():
    """Check if required environment variables are set."""
    # Load environment variables from backend/.env file
    load_dotenv(dotenv_path="backend/.env")
    
    required_vars = ["SUPABASE_URL", "SUPABASE_KEY", "OPENROUTER_API_KEY"]
    optional_vars = ["HOST", "PORT", "FRONTEND_URL"]
    
    print("🔍 Checking environment variables...")
    
    all_present = True
    for var in required_vars:
        value = os.getenv(var)
        if value:
            # Don't print the actual values for security
            print(f"  ✅ {var}: Found (length: {len(value)} chars)")
        else:
            print(f"  ❌ {var}: MISSING")
            all_present = False
    
    print("\n📋 Optional variables:")
    for var in optional_vars:
        value = os.getenv(var)
        if value:
            print(f"  ✅ {var}: Found (length: {len(value)} chars)")
        else:
            print(f"  ⚠️  {var}: Not set (using default)")
    
    if all_present:
        print("\n🎉 All required environment variables are set!")
        return True
    else:
        print("\n🚨 Some required environment variables are missing!")
        return False

if __name__ == "__main__":
    success = check_env_variables()
    exit(0 if success else 1)