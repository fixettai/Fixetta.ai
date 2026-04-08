"""
Fixetta.ai Triage Service
Calls Gemini 3.0 Flash via OpenRouter to analyze uploaded images and return technical damage descriptions.
"""

import os
import httpx
from pydantic import BaseModel, Field
from typing import Any, List, Optional
from enum import Enum


# ── Configuration ─────────────────────────────────────────────────────────────

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY") or os.getenv("VITE_OPENROUTER_API_KEY")
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
TRIAGE_MODEL = "google/gemini-3.0-flash"

# System prompt for the triage AI
TRIAGE_SYSTEM_PROMPT = """You are a Professional Home Inspection Triage AI. Analyze the uploaded image(s) and provide a concise, technical breakdown of the damage. Do not estimate price.

Output Format:

Material: (e.g., Drywall, Oak Hardwood, Shingles)

Extent: (e.g., 2ft x 4ft area, 3 separate punctures)

Severity: (Minor/Moderate/Structural)

Anomalies: (e.g., Evidence of mold, active water leak, frayed wiring)"""


# ── Pydantic Models ──────────────────────────────────────────────────────────

class SeverityEnum(str, Enum):
    MINOR = "Minor"
    MODERATE = "Moderate"
    STRUCTURAL = "Structural"
    UNKNOWN = "Unknown"

class TriageResult(BaseModel):
    """Result from the triage AI analysis"""
    material: str = Field(default="Unknown", description="Type of material damaged")
    extent: str = Field(default="Unknown", description="Extent of the damage")
    severity: SeverityEnum = Field(default=SeverityEnum.UNKNOWN, description="Minor/Moderate/Structural")
    anomalies: str = Field(default="None observed", description="Additional anomalies detected")
    raw_response: str = Field(default="", description="Raw response from the AI")
    success: bool = Field(default=True, description="Whether the analysis was successful")


# ── Triage Functions ─────────────────────────────────────────────────────────

def _build_image_content(image_base64: str, mime_type: str) -> dict:
    """Build image content object for OpenRouter API."""
    return {
        "type": "image_url",
        "image_url": {
            "url": f"data:{mime_type};base64,{image_base64}"
        }
    }


async def analyze_multiple_images(image_base64_list: List[str], mime_types: Optional[List[str]] = None) -> TriageResult:
    """
    Analyze multiple images using Gemini 3.0 Flash via OpenRouter and return consolidated triage results.
    
    Args:
        image_base64_list: List of base64 encoded image data
        mime_types: Optional list of MIME types for each image
        
    Returns:
        TriageResult with consolidated damage analysis
    """
    if not OPENROUTER_API_KEY:
        return TriageResult(
            success=False,
            raw_response="OPENROUTER_API_KEY not configured",
            material="Unknown",
            extent="Unknown",
            severity="Unknown",
            anomalies="API key not configured"
        )
    
    if mime_types is None:
        mime_types = ["image/jpeg"] * len(image_base64_list)
    
    # Build message content with text prompt and all images
    content: List[Any] = [{"type": "text", "text": TRIAGE_SYSTEM_PROMPT}]
    for img_b64, mime in zip(image_base64_list, mime_types):
        content.append(_build_image_content(img_b64, mime))
    
    payload = {
        "model": TRIAGE_MODEL,
        "messages": [{"role": "user", "content": content}],
        "temperature": 0.1,
        "max_tokens": 512
    }
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                OPENROUTER_API_URL,
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "HTTP-Referer": "http://localhost:8000",
                    "X-Title": "Fixetta Triage AI",
                    "Content-Type": "application/json"
                },
                json=payload
            )
            
            if response.status_code != 200:
                error_text = str(response.text)
                print(f"[TriageService] OpenRouter API error: {response.status_code} - {error_text}")
                return TriageResult(
                    success=False,
                    raw_response=f"API error: {response.status_code}",
                    material="Unknown",
                    extent="Unknown",
                    severity="Unknown",
                    anomalies="Failed to analyze"
                )
            
            data = response.json()
            raw_response = data.get("choices", [{}])[0].get("message", {}).get("content", "")
            
            return parse_triage_response(raw_response)
            
    except httpx.RequestError as e:
        print(f"[TriageService] HTTP error: {e}")
        return TriageResult(
            success=False,
            raw_response=f"HTTP error: {str(e)}",
            material="Unknown",
            extent="Unknown",
            severity="Unknown",
            anomalies="Service unavailable"
        )


def parse_triage_response(raw_response: str) -> TriageResult:
    """
    Parse the structured triage response from Gemini into a TriageResult.
    """
    result = TriageResult(raw_response=raw_response.strip())
    
    lines = raw_response.strip().split("\n")
    for line in lines:
        line = line.strip()
        if line.lower().startswith("material:"):
            result.material = line.split(":", 1)[1].strip()
        elif line.lower().startswith("extent:"):
            result.extent = line.split(":", 1)[1].strip()
        elif line.lower().startswith("severity:"):
            severity_str = line.split(":", 1)[1].strip()
            try:
                result.severity = SeverityEnum(severity_str)
            except ValueError:
                # If the severity string doesn't match any enum value, default to UNKNOWN
                result.severity = SeverityEnum.UNKNOWN
        elif line.lower().startswith("anomalies:"):
            result.anomalies = line.split(":", 1)[1].strip()
    
    return result
