"""
Fixetta.ai FastAPI Backend
Photo Analysis Pipeline with Richmond Baseline Enforcement
"""

import os
import time
import json
import httpx
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()
from typing import List, Optional, Dict, Any
from contextlib import asynccontextmanager
from decimal import Decimal

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from .models.repair_models import (
    ObjectionTypeEnum, 
    ItemizedTask, 
    RepairEstimate,
    PhotoAnalysisRequest,
    PhotoAnalysisResponse,
    RICHMOND_LABOR_FLOOR,
    RICHMOND_WASTE_FACTOR
)
from .services.intent_classifier import classify_intent, IntentClassificationResult
from .services.rebuttal_service import fetch_smart_rebuttal
from .services.cost_data import fetch_regional_rates
from .services.triage_service import analyze_multiple_images, TriageResult

# In-memory cache for contractor list with 5-minute TTL
contractor_cache = {}
CACHE_TTL_SECONDS = 5 * 60  # 5 minutes

# ── FastAPI App Setup ──────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan manager for startup/shutdown events."""
    # Startup
    print("🚀 Fixetta.ai Backend starting up...")
    yield
    # Shutdown
    print("👋 Fixetta.ai Backend shutting down...")

app = FastAPI(
    title="Fixetta.ai API",
    description="AI-powered Home Repair Estimator with Richmond Baseline Pricing",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Helper Functions ───────────────────────────────────────────────────

def map_triage_to_objection(triage_result: Dict[str, Any]) -> ObjectionTypeEnum:
    """
    Map Gemini Flash triage result to standardized objection type.
    This prevents logic gate failures from Gemini Flash variations.
    """
    if not triage_result:
        return ObjectionTypeEnum.NONE
    
    # Extract key phrases from triage result
    triage_text = json.dumps(triage_result).lower()
    
    # Map based on common objection patterns
    if any(phrase in triage_text for phrase in ["price", "expensive", "cost", "budget", "high"]):
        return ObjectionTypeEnum.PRICE_TOO_HIGH
    elif any(phrase in triage_text for phrase in ["compare", "other quotes", "bids", "shopping"]):
        return ObjectionTypeEnum.NEED_OTHER_BIDS
    elif any(phrase in triage_text for phrase in ["spouse", "partner", "wife", "husband", "decision"]):
        return ObjectionTypeEnum.SPOUSE_NOT_PRESENT
    elif any(phrase in triage_text for phrase in ["think", "consider", "later", "wait", "procrastinate"]):
        return ObjectionTypeEnum.THINK_ABOUT_IT
    elif any(phrase in triage_text for phrase in ["insurance", "claim", "adjuster", "financing"]):
        return ObjectionTypeEnum.INSURANCE_CHECK
    elif any(phrase in triage_text for phrase in ["schedule", "book", "appointment", "ready", "commit"]):
        return ObjectionTypeEnum.APPOINTMENT_READY
    else:
        return ObjectionTypeEnum.NONE

async def generate_estimate_from_triage(triage_result: Dict[str, Any], zip_code: Optional[str] = None) -> Optional[RepairEstimate]:
    """
    Generate repair estimate from triage result using ItemizedTask model.
    This is where Sonnet 3.5 would generate the actual estimate.
    For now, we create a mock estimate based on triage data.
    """
    try:
        # Extract repair information from triage
        repair_type = triage_result.get("repair_type", "General Repair")
        severity = triage_result.get("severity", "medium")
        estimated_hours = triage_result.get("estimated_hours", 4.0)
        
        # Calculate costs based on Richmond Baseline
        labor_hours = Decimal(str(estimated_hours))
        material_cost = Decimal("150.00")  # Base material cost
        
        # Create itemized task
        task = ItemizedTask(
            description=f"{repair_type} repair ({severity} severity)",
            labor_hours=labor_hours,
            labor_rate=RICHMOND_LABOR_FLOOR,
            material_cost=material_cost
        )
        
        # Get regional multiplier
        regional_multiplier = Decimal("1.0")
        if zip_code:
            regional_rates = await fetch_regional_rates(zip_code)
            if regional_rates and hasattr(regional_rates, "adjusted_costs"):
                # Use the average of material and labor multipliers
                material_mult = regional_rates.material_multiplier
                labor_mult = regional_rates.labor_multiplier
                regional_multiplier = Decimal(str((material_mult + labor_mult) / 2))
        
        # Create repair estimate
        estimate = RepairEstimate(
            tasks=[task],
            zip_code=zip_code,
            regional_multiplier=regional_multiplier
        )
        
        return estimate
        
    except Exception as e:
        print(f"Error generating estimate: {e}")
        return None

# ── API Endpoints ──────────────────────────────────────────────────────

@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "Fixetta.ai API",
        "version": "1.0.0",
        "status": "operational",
        "richmond_baseline": {
            "labor_floor": str(RICHMOND_LABOR_FLOOR),
            "waste_factor": str(RICHMOND_WASTE_FACTOR)
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": time.time()}

@app.post("/api/analyze-photos", response_model=PhotoAnalysisResponse)
async def analyze_photos(
    photos: List[UploadFile] = File(..., description="Uploaded repair photos"),
    zip_code: Optional[str] = Form(None, description="ZIP code for regional pricing"),
    additional_context: Optional[str] = Form(None, description="Additional context from user")
):
    """
    Main photo analysis endpoint.
    
    Flow:
    1. Receive photos
    2. Call Triage (Gemini Flash)
    3. Fetch Rebuttal using Enum mapping
    4. Generate Estimate using ItemizedTask model
    """
    try:
        # Step 1: Process uploaded photos
        photo_data = []
        for photo in photos:
            content = await photo.read()
            # In production, we would upload to cloud storage or process directly
            # For now, we'll use a placeholder
            photo_data.append({
                "filename": photo.filename,
                "size": len(content),
                "content_type": photo.content_type
            })
        
        print(f"📸 Received {len(photo_data)} photos for analysis")
        
        # Step 2: Call Triage (Gemini Flash)
        print("🔍 Calling Gemini Flash for triage analysis...")
        triage_result = await analyze_multiple_images(photo_data)
        
        if not triage_result:
            raise HTTPException(status_code=500, detail="Triage analysis failed")
        
        # Step 3: Map to ObjectionTypeEnum
        triage_dict = triage_result.dict() if hasattr(triage_result, 'dict') else triage_result
        objection_type = map_triage_to_objection(triage_dict)
        print(f"🎯 Detected objection type: {objection_type}")
        
        # Step 4: Fetch Smart Rebuttal using Enum
        rebuttal = fetch_smart_rebuttal(objection_type)
        # Fallback to Standard Professionalism script if rebuttal is None
        if rebuttal is None:
            rebuttal = {
                "strategy": "Standard Professionalism",
                "example_script": "Thank you for sharing your concerns. We understand the importance of making informed decisions. Our estimates are based on Richmond, VA market rates with transparent pricing that includes a $75/hr minimum labor charge and 15% material waste factor. We're committed to providing fair, competitive pricing while ensuring quality workmanship."
            }
        
        # Step 5: Generate Estimate using ItemizedTask model
        estimate = await generate_estimate_from_triage(triage_dict, zip_code)
        
        # Step 6: Determine confidence level
        confidence = "medium"
        if estimate and rebuttal:
            confidence = "high"
        elif not estimate and not rebuttal:
            confidence = "low"
        
        # Step 7: Prepare response
        response = PhotoAnalysisResponse(
            triage_result=triage_dict,
            objection_type=objection_type,
            rebuttal=rebuttal,
            estimate=estimate,
            confidence=confidence,
            verification_notes="Estimate generated with Richmond Baseline pricing ($75/hr floor, 15% waste)"
        )
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in photo analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/api/chat")
async def chat_endpoint(request: Request):
    """
    Legacy chat endpoint for backward compatibility.
    Maintains existing intent classification and rebuttal integration.
    """
    try:
        data = await request.json()
        message = data.get("message", "")
        
        # Classify intent - check if it's async
        from .services.intent_classifier import IntentClassifier
        classifier = IntentClassifier()
        intent_result = await classifier.classify_intent(message)
        
        # Map to objection type
        objection_type = ObjectionTypeEnum.NONE
        if intent_result and intent_result.intent_id:
            try:
                objection_type = ObjectionTypeEnum(intent_result.intent_id)
            except ValueError:
                # Fallback to string mapping
                objection_type = map_triage_to_objection({"text": intent_result.intent_id})
        
        # Fetch rebuttal
        rebuttal = fetch_smart_rebuttal(objection_type)
        
        return {
            "intent": intent_result.dict() if intent_result else None,
            "objection_type": objection_type.value,
            "rebuttal": rebuttal,
            "timestamp": time.time()
        }
        
    except Exception as e:
        print(f"❌ Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/api/v1/contractors/match")
async def contractor_match(zip: str, category: str):
    """
    Contractor matching endpoint that fetches data from Google Apps Script.
    Filters contractors based on category and zip code.
    Implements caching with 5-minute TTL.
    """
    try:
        # Create cache key
        cache_key = f"{zip}:{category}"
        current_time = time.time()
        
        # Check if we have cached data that's still valid
        if cache_key in contractor_cache:
            cached_data, timestamp = contractor_cache[cache_key]
            if current_time - timestamp < CACHE_TTL_SECONDS:
                print(f"📦 Returning cached contractor data for {cache_key}")
                return cached_data
        
        # Google Apps Script Web App URL
        google_script_url = "[PASTE_YOUR_URL_HERE]"
        
        # Make request to Google Apps Script with parameters
        async with httpx.AsyncClient() as client:
            response = await client.get(
                google_script_url,
                params={
                    "zip": zip,
                    "category": category
                },
                timeout=30.0
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Google Apps Script returned status {response.status_code}"
                )
            
            # Parse the response from Google Apps Script
            data = response.json()
            
            # Filter contractors based on category and zip (though the script should already do this)
            # For now, we'll return what we get from the script
            contractors = data if isinstance(data, list) else []
            
            # Cache the result
            contractor_cache[cache_key] = (contractors, current_time)
            print(f"💾 Cached contractor data for {cache_key}")
            
            # If we want to do additional filtering on the frontend data:
            # filtered_contractors = [
            #     c for c in contractors 
            #     if c.get('category', '').lower() == category.lower() 
            #     and c.get('zip', '').startswith(zip[:5])  # Match first 5 digits of ZIP
            # ]
            # return filtered_contractors
            
            return contractors
        
    except httpx.TimeoutException:
        raise HTTPException(status_code=408, detail="Request to Google Apps Script timed out")
    except Exception as e:
        print(f"❌ Error in contractor match endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "timestamp": time.time()}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    print(f"⚠️ Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "timestamp": time.time()}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)