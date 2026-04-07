"""
Fixetta Rebuttal Service
Handles sales objection detection, response retrieval, and context injection.
"""

import json
import random
import os
from typing import Optional, Dict, Any


class RebuttalService:
    """Service for retrieving rebuttal strategies and scripts from rebuttals.json"""
    
    def __init__(self, rebuttal_file_path: Optional[str] = None):
        if rebuttal_file_path is None:
            # Default to data/rebuttals.json relative to project root
            project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            rebuttal_file_path = os.path.join(project_root, "data", "rebuttals.json")
        
        self._rebuttal_data: Dict[str, Any] = {}
        self._rebuttal_file_path = rebuttal_file_path
        self._load_rebuttals()
    
    def _load_rebuttals(self):
        """Load rebuttals data from JSON file"""
        try:
            with open(self._rebuttal_file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            self._rebuttal_data = {r['id']: r for r in data.get('rebuttals', [])}
        except FileNotFoundError:
            print(f"[RebuttalService] Warning: rebuttals.json not found at {self._rebuttal_file_path}")
            self._rebuttal_data = {}
        except json.JSONDecodeError as e:
            print(f"[RebuttalService] Error: Invalid JSON in rebuttals.json: {e}")
            self._rebuttal_data = {}
    
    def get_rebuttal_context(self, rebuttal_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetch the strategy and a random script from rebuttals.json based on the detected ID.
        
        Args:
            rebuttal_id: The objection type ID (e.g., 'price_too_high', 'think_about_it')
            
        Returns:
            Dict with 'strategy' and 'example_script' keys, or None if ID not found
        """
        rebuttal = self._rebuttal_data.get(rebuttal_id)
        if not rebuttal:
            return None
        
        return {
            "strategy": rebuttal.get("strategy", ""),
            "example_script": random.choice(rebuttal.get("scripts", [""])),
            "objection_type": rebuttal.get("objection_type", "")
        }
    
    def get_all_rebuttal_ids(self):
        """Return a list of all available rebuttal IDs"""
        return list(self._rebuttal_data.keys())


# Singleton instance for reuse across requests
_rebuttal_service = None

def get_rebuttal_service() -> RebuttalService:
    """Get the singleton RebuttalService instance"""
    global _rebuttal_service
    if _rebuttal_service is None:
        _rebuttal_service = RebuttalService()
    return _rebuttal_service


def get_rebuttal_context(rebuttal_id: str) -> Optional[Dict[str, Any]]:
    """
    Utility function to fetch rebuttal context (convenience wrapper).
    Use this for simple imports elsewhere in the codebase.
    """
    return get_rebuttal_service().get_rebuttal_context(rebuttal_id)