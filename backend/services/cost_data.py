"""
Regional Cost Data Service
Integrates with Craftsman National Estimator API for accurate regional pricing.

This service provides:
- Regional material and labor cost lookup by ZIP code and category
- Cost multipliers based on geographic location
- Current market rate averages for residential repairs

API Reference: Craftsman National Estimator API
Documentation: https://www.craftsman-book.com/api (example)
"""

import os
import httpx
from typing import Dict, Optional, Any
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

# ── Configuration ─────────────────────────────────────────────────────────────

CRAFTSMAN_API_KEY = os.getenv("CRAFTSMAN_API_KEY", "")
CRAFTSMAN_API_URL = os.getenv("CRAFTSMAN_API_URL", "https://api.craftsman-book.com/v1")

# Fallback regional multipliers (used when API is unavailable)
# Based on national averages with geographic adjustments
_REGIONAL_MULTIPLIERS: Dict[str, Dict[str, float]] = {
    # High cost regions
    "9": {"materials": 1.25, "labor": 1.35},     # West Coast (CA, WA, OR)
    "1": {"materials": 1.20, "labor": 1.30},     # Northeast (NY, MA, CT, NJ)
    # Medium-high cost regions
    "8": {"materials": 1.10, "labor": 1.15},     # Mountain West (CO, UT, NV)
    "5": {"materials": 1.05, "labor": 1.10},     # Great Lakes (IL, MI, OH)
    "6": {"materials": 1.05, "labor": 1.08},     # Upper Midwest (MN, WI)
    # Medium cost regions
    "7": {"materials": 1.00, "labor": 1.00},     # Plains (KS, NE, IA, MO)
    "3": {"materials": 0.98, "labor": 0.95},     # Southeast (GA, FL, Carolinas)
    "2": {"materials": 0.95, "labor": 0.92},     # Mid-Atlantic (PA, MD, VA, DC)
    # Lower cost regions
    "4": {"materials": 0.90, "labor": 0.88},     # South Central (TX, OK, AR, LA)
    "0": {"materials": 0.92, "labor": 0.90},     # New England (ME, NH, VT, RI)
}

# Category-specific base costs (national averages)
_CATEGORY_BASE_COSTS: Dict[str, Dict[str, object]] = {
    "flooring": {
        "material_per_sqft": 4.50,
        "labor_per_sqft": 3.00,
        "description": "Hardwood/Laminate flooring installation"
    },
    "drywall": {
        "material_per_sqft": 2.00,
        "labor_per_sqft": 3.50,
        "description": "Drywall repair and finishing"
    },
    "plumbing": {
        "material_per_job": 150.00,
        "labor_per_hour": 95.00,
        "description": "General plumbing repair"
    },
    "electrical": {
        "material_per_job": 125.00,
        "labor_per_hour": 100.00,
        "description": "General electrical repair"
    },
    "painting": {
        "material_per_sqft": 0.75,
        "labor_per_sqft": 2.50,
        "description": "Interior painting"
    },
    "roofing": {
        "material_per_sqft": 4.00,
        "labor_per_sqft": 3.50,
        "description": "Roof repair/replacement"
    },
    "hvac": {
        "material_per_job": 500.00,
        "labor_per_hour": 110.00,
        "description": "HVAC repair/service"
    },
    "general": {
        "material_per_hour": 45.00,
        "labor_per_hour": 75.00,
        "description": "General handyman work"
    }
}


# ── Pydantic Models ──────────────────────────────────────────────────────────

class RegionalCostResponse(BaseModel):
    """Response model for regional cost lookup"""
    zip_code: str = Field(..., description="ZIP code used for lookup")
    category: str = Field(..., description="Repair category")
    material_multiplier: float = Field(..., description="Regional material cost multiplier")
    labor_multiplier: float = Field(..., description="Regional labor cost multiplier")
    base_costs: Dict[str, float] = Field(..., description="National base costs for category")
    adjusted_costs: Dict[str, float] = Field(default_factory=dict, description="Regionally adjusted costs")
    source: str = Field(default="fallback", description="Data source: 'api' or 'fallback'")


# ── Helper Functions ──────────────────────────────────────────────────────────

def validate_zip_code(zip_code: str) -> bool:
    """Validate US ZIP code format (5-digit or ZIP+4)"""
    import re
    return bool(re.match(r'^\d{5}(-\d{4})?$', zip_code))


def get_region_from_zip(zip_code: str) -> str:
    """
    Extract the first digit of the ZIP code to determine the region.
    USPS ZIP code regions:
    0 - New England
    1 - New York Metro
    2 - Mid-Atlantic
    3 - Southeast
    4 - South Central
    5 - Great Lakes
    6 - Upper Midwest
    7 - Plains
    8 - Mountain West
    9 - West Coast
    """
    return zip_code[0] if zip_code else "7"  # Default to Plains region


def get_regional_multiplier(zip_code: str) -> Dict[str, float]:
    """Get regional cost multipliers for a given ZIP code."""
    region = get_region_from_zip(zip_code)
    return _REGIONAL_MULTIPLIERS.get(region, {"materials": 1.0, "labor": 1.0})


def get_category_base_costs(category: str) -> Dict[str, float]:
    """Get national base costs for a repair category (filters out description strings)."""
    normalized_category = category.lower().strip()
    costs = _CATEGORY_BASE_COSTS.get(normalized_category, _CATEGORY_BASE_COSTS["general"])
    # Filter out non-numeric values (like "description")
    return {k: v for k, v in costs.items() if isinstance(v, (int, float))}


def calculate_adjusted_costs(base_costs: Dict[str, float], multipliers: Dict[str, float]) -> Dict[str, float]:
    """Calculate regionally adjusted costs from base costs and multipliers."""
    adjusted = {}
    material_mult = multipliers.get("materials", 1.0)
    labor_mult = multipliers.get("labor", 1.0)
    
    for key, value in base_costs.items():
        if "material" in key.lower():
            adjusted[key] = round(value * material_mult, 2)
        elif "labor" in key.lower():
            adjusted[key] = round(value * labor_mult, 2)
        else:
            adjusted[key] = round(value * ((material_mult + labor_mult) / 2), 2)
    
    return adjusted


# ── Main Service Functions ────────────────────────────────────────────────────

async def fetch_regional_rates(
    zip_code: str,
    category: str = "general"
) -> RegionalCostResponse:
    """
    Fetch regional cost data for a given ZIP code and repair category.
    
    Priority:
    1. Craftsman National Estimator API (if configured)
    2. Local fallback data
    
    Args:
        zip_code: Valid US ZIP code (5-digit or ZIP+4)
        category: Repair category (e.g., 'Flooring', 'Plumbing', 'Drywall')
    
    Returns:
        RegionalCostResponse with material and labor cost data
    
    Raises:
        ValueError: If ZIP code is invalid
    """
    if not validate_zip_code(zip_code):
        raise ValueError(f"Invalid ZIP code format: {zip_code}")
    
    multipliers = get_regional_multiplier(zip_code)
    base_costs = get_category_base_costs(category)
    adjusted_costs = calculate_adjusted_costs(base_costs, multipliers)
    
    # Attempt to fetch from Craftsman API if configured
    source = "fallback"
    if CRAFTSMAN_API_KEY and CRAFTSMAN_API_URL:
        try:
            api_data = await _fetch_from_craftsman_api(zip_code, category)
            if api_data:
                source = "api"
                base_costs = api_data
                adjusted_costs = calculate_adjusted_costs(api_data, multipliers)
        except Exception as e:
            print(f"[CostDataService] Craftsman API fallback due to: {e}")
    
    return RegionalCostResponse(
        zip_code=zip_code,
        category=category,
        material_multiplier=multipliers["materials"],
        labor_multiplier=multipliers["labor"],
        base_costs=base_costs,
        adjusted_costs=adjusted_costs,
        source=source
    )


async def _fetch_from_craftsman_api(
    zip_code: str,
    category: str
) -> Optional[Dict[str, float]]:
    """
    Fetch cost data from the Craftsman National Estimator API.
    
    Returns None if API call fails or is not configured.
    """
    if not CRAFTSMAN_API_KEY:
        return None
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{CRAFTSMAN_API_URL}/costs",
                headers={
                    "Authorization": f"Bearer {CRAFTSMAN_API_KEY}",
                    "Content-Type": "application/json"
                },
                params={
                    "zip_code": zip_code,
                    "category": category.lower()
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "material_per_sqft": data.get("material_cost", 0),
                    "labor_per_sqft": data.get("labor_cost", 0)
                }
            else:
                print(f"[CostDataService] Craftsman API error: {response.status_code}")
                return None
                
    except httpx.RequestError as e:
        print(f"[CostDataService] Craftsman API request failed: {e}")
        return None


# ── JSON Schema for Claude Tool Definition ─────────────────────────────────────

COST_LOOKUP_TOOL_SCHEMA = {
    "type": "function",
    "function": {
        "name": "fetch_regional_rates",
        "description": "Get accurate regional construction cost data for a specific ZIP code and repair category. Returns material and labor cost multipliers based on Craftsman National Estimator data.",
        "parameters": {
            "type": "object",
            "properties": {
                "zip_code": {
                    "type": "string",
                    "description": "The 5-digit ZIP code for the project location (e.g., '10001', '90210')",
                    "pattern": "^\\d{5}(-\\d{4})?$"
                },
                "category": {
                    "type": "string",
                    "description": "The repair category for cost lookup",
                    "enum": [
                        "flooring",
                        "drywall",
                        "plumbing",
                        "electrical",
                        "painting",
                        "roofing",
                        "hvac",
                        "general"
                    ]
                }
            },
            "required": ["zip_code", "category"],
            "additionalProperties": False
        }
    }
}