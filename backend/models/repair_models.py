"""
Fixetta Repair Models
Pydantic models for repair estimation with Richmond Baseline enforcement.
"""

from typing import List, Optional, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field, computed_field
from decimal import Decimal, ROUND_HALF_UP

# Richmond Baseline Constants
RICHMOND_LABOR_FLOOR = Decimal('75.00')  # $75/hr minimum
RICHMOND_WASTE_FACTOR = Decimal('0.15')  # 15% material waste


class ObjectionTypeEnum(str, Enum):
    """Standardized objection types based on rebuttals.json"""
    PRICE_TOO_HIGH = "price_too_high"
    NEED_OTHER_BIDS = "need_other_bids"
    SPOUSE_NOT_PRESENT = "spouse_not_present"
    THINK_ABOUT_IT = "think_about_it"
    INSURANCE_CHECK = "insurance_check"
    APPOINTMENT_READY = "appointment_ready"
    NONE = "none"


class ItemizedTask(BaseModel):
    """
    Individual repair task with Richmond Baseline pricing enforcement.
    # Richmond, VA Market Baseline: $75/hr min, 115% material scaling.
    """
    description: str = Field(..., description="Description of the repair task")
    labor_hours: Decimal = Field(..., ge=0, description="Estimated labor hours")
    labor_rate: Decimal = Field(default=RICHMOND_LABOR_FLOOR, ge=RICHMOND_LABOR_FLOOR, 
                               description=f"Labor rate per hour (minimum ${RICHMOND_LABOR_FLOOR}/hr)")
    material_cost: Decimal = Field(..., ge=0, description="Base material cost")
    
    @computed_field
    @property
    def labor_cost(self) -> Decimal:
        """Calculate labor cost with Richmond floor enforcement."""
        return (self.labor_hours * self.labor_rate).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    
    @computed_field
    @property
    def material_cost_with_waste(self) -> Decimal:
        """Calculate material cost with 15% Richmond waste factor."""
        waste_amount = self.material_cost * RICHMOND_WASTE_FACTOR
        return (self.material_cost + waste_amount).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    
    @computed_field
    @property
    def total_price(self) -> Decimal:
        """Calculate total price (labor + materials with waste)."""
        return (self.labor_cost + self.material_cost_with_waste).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    
    class Config:
        json_encoders = {
            Decimal: lambda v: str(v)
        }


class RepairEstimate(BaseModel):
    """
    Complete repair estimate with multiple itemized tasks.
    """
    tasks: List[ItemizedTask] = Field(..., description="List of itemized repair tasks")
    zip_code: Optional[str] = Field(None, description="ZIP code for regional rate adjustments")
    regional_multiplier: Decimal = Field(default=Decimal('1.0'), ge=0.5, le=2.0, 
                                        description="Regional cost multiplier")
    
    @computed_field
    @property
    def subtotal(self) -> Decimal:
        """Sum of all task totals before regional adjustment."""
        total = Decimal('0.00')
        for task in self.tasks:
            total += task.total_price
        return total.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    
    @computed_field
    @property
    def total_estimate(self) -> Decimal:
        """Final estimate with regional multiplier applied."""
        return (self.subtotal * self.regional_multiplier).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    
    @computed_field
    @property
    def summary(self) -> Dict[str, Any]:
        """Summary of the estimate for API responses."""
        total_labor_hours = Decimal('0.00')
        for task in self.tasks:
            total_labor_hours += task.labor_hours
            
        return {
            "task_count": len(self.tasks),
            "total_labor_hours": str(total_labor_hours),
            "subtotal": str(self.subtotal),
            "regional_multiplier": str(self.regional_multiplier),
            "total_estimate": str(self.total_estimate),
            "richmond_baseline": {
                "labor_floor": str(RICHMOND_LABOR_FLOOR),
                "waste_factor": str(RICHMOND_WASTE_FACTOR)
            }
        }


class PhotoAnalysisRequest(BaseModel):
    """Request model for photo analysis endpoint."""
    photos: List[str] = Field(..., description="Base64 encoded photos or URLs")
    zip_code: Optional[str] = Field(None, description="ZIP code for regional pricing")
    additional_context: Optional[str] = Field(None, description="Additional context from user")


class PhotoAnalysisResponse(BaseModel):
    """Response model for photo analysis endpoint."""
    triage_result: Dict[str, Any] = Field(..., description="Result from Gemini Flash triage")
    objection_type: ObjectionTypeEnum = Field(..., description="Detected objection type")
    rebuttal: Optional[Dict[str, Any]] = Field(None, description="Smart rebuttal strategy")
    estimate: Optional[RepairEstimate] = Field(None, description="Generated repair estimate")
    confidence: str = Field(..., description="Confidence level (low/medium/high)")
    verification_notes: Optional[str] = Field(None, description="Verification notes from Sonnet 3.5")