"""
Fixetta.ai FastAPI Backend
Intent Classification & Rebuttal Integration for AI Sales Chat
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

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from backend.services.intent_classifier import classify_intent, IntentClassificationResult
from backend.services.rebuttal_service import get_rebuttal_context
from backend.services.cost_data import fetch_regional_rates, COST_LOOKUP_TOOL_SCHEMA


# ── Pydantic Models ──────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    """A single chat message"""
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    """Request body for the chat endpoint"""
    messages: List[ChatMessage] = Field(..., description="Chat history")
    user_message: str = Field(..., description="The latest user message to respond to")
    photos_count: int = Field(default=0, description="Number of photos uploaded")
    session_id: Optional[str] = Field(default=None, description="Session identifier for rate limiting")
    context_summary: Optional[str] = Field(default=None, description="Project snapshot/context summary for context bridge")


class ChatResponse(BaseModel):
    """Response from the chat endpoint"""
    response: str
    intent_id: str
    intent_confidence: float
    rebuttal_applied: bool


class ClassifyIntentRequest(BaseModel):
    """Request body for the classify-intent endpoint"""
    user_message: str = Field(..., min_length=1, description="The user message to classify")


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    timestamp: float


class RegionalCostRequest(BaseModel):
    """Request body for the regional cost endpoint"""
    zip_code: str = Field(..., min_length=5, max_length=10, description="US ZIP code (5-digit or ZIP+4)")
    category: str = Field(default="general", description="Repair category (e.g., 'flooring', 'plumbing')")


class RegionalCostResponse(BaseModel):
    """Response from the regional cost endpoint"""
    zip_code: str
    category: str
    material_multiplier: float
    labor_multiplier: float
    base_costs: Dict[str, float]
    adjusted_costs: Dict[str, float]
    source: str


# ── Configuration ─────────────────────────────────────────────────────────────

OPENROUTER_API_KEY = os.getenv("VITE_OPENROUTER_API_KEY") or os.getenv("OPENROUTER_API_KEY")
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
CLAUDE_MODEL = "anthropic/claude-sonnet-4.6"

# Rate limiting configuration
RATE_LIMIT_MAX_REQUESTS = 20  # Max requests per user per hour
RATE_LIMIT_WINDOW_SECONDS = 3600  # 1 hour

# In-memory rate limiting store (use Redis in production)
_rate_limit_store: Dict[str, Dict[str, Any]] = {}


# ── Rate Limiting Helper ─────────────────────────────────────────────────────

def check_rate_limit(session_id: str) -> bool:
    """
    Simple in-memory rate limiter.
    Returns True if request is allowed, False if rate limited.
    """
    now = time.time()
    
    if session_id not in _rate_limit_store:
        _rate_limit_store[session_id] = {"count": 0, "reset_at": now + RATE_LIMIT_WINDOW_SECONDS}
    
    record = _rate_limit_store[session_id]
    
    # Reset if window has passed
    if now > record["reset_at"]:
        record["count"] = 0
        record["reset_at"] = now + RATE_LIMIT_WINDOW_SECONDS
    
    # Check limit
    if record["count"] >= RATE_LIMIT_MAX_REQUESTS:
        return False
    
    record["count"] += 1
    return True


# ── Appointment Handoff Helper ────────────────────────────────────────────────

async def trigger_notification_for_appointment(context_summary: Optional[str] = None):
    """
    Trigger a notification (Email/Slack/Webhook) to the team with the Project Snapshot.
    This is a placeholder function — integrate with your notification service of choice.
    """
    project_snapshot = {
        "event": "appointment_ready",
        "context_summary": context_summary,
        "message": "A user is ready to book! Send them a follow-up immediately."
    }
    
    # TODO: Replace with actual notification logic (e.g., Slack webhook, email, etc.)
    print(f"[AppointmentHandoff] NOTIFICATION: {json.dumps(project_snapshot, indent=2)}")
    
    # Example: Slack webhook
    # async with httpx.AsyncClient() as client:
    #     await client.post(os.getenv("SLACK_WEBHOOK_URL"), json={"text": f"New ready-to-book lead: {context_summary}"})

    # Example: Email notification
    # send_email(to="sales@fixetta.ai", subject="Ready to Book!", body=str(context_summary))
    
    return True


# ── Rebuttal Directive Builder ────────────────────────────────────────────────

def build_sales_directive(intent_result: IntentClassificationResult) -> Optional[str]:
    """
    Build a sales directive string to inject into Claude's system prompt.
    Returns None if intent is 'none'.
    """
    if intent_result.intent_id == "none":
        return None
    
    rebuttal_context = get_rebuttal_context(intent_result.intent_id)
    if not rebuttal_context:
        return None
    
    objection_type = rebuttal_context.get("objection_type", "Unknown Objection")
    strategy = rebuttal_context.get("strategy", "")
    example_script = rebuttal_context.get("example_script", "")
    
    directive = f"""
> ALERT: The user has expressed an objection regarding {objection_type}.
> STRATEGY: {strategy}
> GUIDELINE: Use the following phrasing as inspiration to humanize the response: "{example_script}"
> Do not copy verbatim; adapt to the current conversation vibe.
> IMPORTANT: Keep the Fixetta tone: minimalist, helpful, and high-utility. Avoid corporate speak."""
    
    return directive


# ── Claude API Caller ─────────────────────────────────────────────────────────

async def call_claude_with_context(
    messages: List[ChatMessage],
    sales_directive: Optional[str] = None,
    photos_count: int = 0,
    context_summary: Optional[str] = None
) -> str:
    """
    Call Claude via OpenRouter with the appropriate system prompt and context.
    """
    # Build the base system prompt
    system_prompt = """You are a senior project lead at Fixetta. Your goal is to be helpful, human, and persuasive.

STRICT FORMATING RULE: > Do NOT use any Markdown.

No bold text (**word**).
No bullet points (- or *).
No headers (#).
No numbered lists.

Communication Style:
Write like a human in a professional chat window. Use standard capitalization and punctuation. If you need to separate points, use a simple line break (Enter) or a new paragraph. Keep it clean, sleek, and minimalist to match the Fixetta brand.

Sales Strategy:
Incorporate the provided rebuttals.json logic, but adapt the scripts into natural, unformatted sentences. End every message with a clear, low-pressure question to keep the conversation moving toward an appointment.

Cost Lookup Tool:
You have access to a regional cost database (Craftsman National Estimator) that provides accurate material and labor pricing based on the user's ZIP code.
IMPORTANT: Do not guess prices. If a zip code is provided, use the fetch_regional_rates tool to get accurate data before finalizing the itemized scope.
Always reference the regional multipliers when discussing costs - this shows professionalism and builds trust.

Knowledge Base:
Current labor rates: $75-$125 per hour (adjusted by region)
Material costs vary depending on the project and ZIP code
Fixetta provides a 30-day satisfaction guarantee
Users can upload up to 4 photos for AI analysis

Instructions:
Answer technical questions about the repair process
If the user has uploaded photos, reference what you can see and provide helpful suggestions
Always pivot back to completing the submission and getting an estimate
Maintain a friendly, helpful, but sales-oriented persona
Keep responses concise and action-oriented
Encourage users to submit their inquiry for a formal estimate
IMPORTANT: Keep the Fixetta tone: minimalist, helpful, and high-utility. Avoid corporate speak - be real and conversational.

Remember: No markdown. Plain text only."""

    # Prepend Memory Block if context_summary is provided
    if context_summary:
        import json
        try:
            ctx = json.loads(context_summary)
            summary = ctx.get("summary", "")
            estimate_total = ctx.get("estimate_total", "N/A")
            last_action = ctx.get("last_action", "")
            
            memory_block = (
                f"CONTEXT: The user has already uploaded photos showing {summary}. "
                f"You have provided an estimate of ${estimate_total}. "
                f"Current Status: {last_action}."
            )
        except (json.JSONDecodeError, AttributeError):
            memory_block = f"CONTEXT: Project summary available - {context_summary}"
        
        system_prompt = f"{memory_block}\n\n{system_prompt}"
        
        # Add instruction to reference context naturally
        system_prompt += "\n\nIMPORTANT: Reference the uploaded photos and the current estimate naturally in your conversation to prove you are paying attention."

    # Append sales directive if present
    if sales_directive:
        system_prompt += f"\n\n--- SALES DIRECTIVE ---\n{sales_directive}"

    # Add photo context if applicable
    if photos_count > 0:
        system_prompt += f"\n\nNote: The user has uploaded {photos_count} photo(s) for analysis. Reference this context when relevant."

    # Build messages for Claude (only system + last user message for statelessness)
    claude_messages = [{"role": "system", "content": system_prompt}]
    
    # Include recent conversation context (last 6 messages max for token efficiency)
    recent_messages = messages[-6:] if len(messages) > 6 else messages
    for msg in recent_messages:
        claude_messages.append({"role": msg.role, "content": msg.content})

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                OPENROUTER_API_URL,
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "HTTP-Referer": "http://localhost:8000",
                    "X-Title": "Fixetta AI Chat",
                    "Content-Type": "application/json"
                },
                json={
                    "model": CLAUDE_MODEL,
                    "messages": claude_messages,
                    "temperature": 0.7,
                    "max_tokens": 1024
                }
            )
            
            if response.status_code != 200:
                # httpx Response.text is a property (str), not a method
                error_text = str(response.text)
                print(f"[ChatEndpoint] Claude API error: {response.status_code} - {error_text}")
                raise HTTPException(status_code=502, detail="Failed to get response from AI")
            
            data = response.json()
            return data.get("choices", [{}])[0].get("message", {}).get("content", "")
            
    except httpx.RequestError as e:
        print(f"[ChatEndpoint] HTTP error: {e}")
        raise HTTPException(status_code=503, detail="AI service unavailable")


# ── App Lifecycle ─────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    print("[Fixetta API] Starting up...")
    yield
    print("[Fixetta API] Shutting down...")


# ── FastAPI App ───────────────────────────────────────────────────────────────

app = FastAPI(
    title="Fixetta AI Chat API",
    description="Intent Classification & Rebuttal Integration for Fixetta Sales Chat",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware - allow frontend on localhost:3000/5173 and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8080",
        "https://fixetta.ai",
        "https://www.fixetta.ai"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="ok",
        timestamp=time.time()
    )


@app.post("/api/v1/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Main chat endpoint with intent classification and rebuttal injection.
    
    Flow:
    1. User message comes in
    2. Gemini 3.1 Flash Lite classifies the intent (~200ms)
    3. FastAPI fetches matching strategy from rebuttals.json
    4. Claude 4.6 receives the chat history + Sales Directive
    5. Claude generates a humanized, sales-optimized response
    """
    # Rate limiting
    session_id = request.session_id or "anonymous"
    if not check_rate_limit(session_id):
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Please try again later."
        )
    
    user_message = request.user_message
    
    # Step 1: Classify user intent using Gemini (fast & cheap)
    intent_result = await classify_intent(user_message)
    print(f"[ChatEndpoint] Intent classified: {intent_result.intent_id} (confidence: {intent_result.confidence})")
    
    # Step 2: Build sales directive if intent is not 'none'
    sales_directive = build_sales_directive(intent_result)
    rebuttal_applied = sales_directive is not None
    
    if rebuttal_applied:
        print(f"[ChatEndpoint] Sales directive applied for: {intent_result.intent_id}")
    
    # Step 2b: Check for appointment_ready — trigger handoff notification
    if intent_result.intent_id == "appointment_ready":
        print(f"[ChatEndpoint] APPOINTMENT READY! Triggering team notification...")
        await trigger_notification_for_appointment(context_summary=request.context_summary)
    
    # Step 3: Get response from Claude with context
    claude_response = await call_claude_with_context(
        messages=request.messages,
        sales_directive=sales_directive,
        photos_count=request.photos_count,
        context_summary=request.context_summary
    )
    
    return ChatResponse(
        response=claude_response,
        intent_id=intent_result.intent_id,
        intent_confidence=intent_result.confidence,
        rebuttal_applied=rebuttal_applied
    )


@app.post("/api/v1/classify-intent", response_model=IntentClassificationResult)
async def classify_intent_endpoint(request: ClassifyIntentRequest):
    """
    Standalone intent classification endpoint (useful for debugging/testing).
    """
    return await classify_intent(request.user_message)


@app.post("/api/v1/regional-costs", response_model=RegionalCostResponse)
async def get_regional_costs(request: RegionalCostRequest):
    """
    Get regional cost data for a given ZIP code and repair category.
    
    Returns material and labor cost multipliers based on Craftsman National
    Estimator data (or fallback regional averages).
    """
    try:
        result = await fetch_regional_rates(
            zip_code=request.zip_code,
            category=request.category
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"[RegionalCostEndpoint] Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch regional costs")


@app.get("/api/v1/cost-tool-schema")
async def get_cost_tool_schema():
    """
    Return the JSON schema for the Cost Lookup Tool.
    Used to configure Claude's function calling capabilities.
    """
    return {"tools": [COST_LOOKUP_TOOL_SCHEMA]}


# ── Error Handlers ────────────────────────────────────────────────────────────

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Generic HTTP exception handler - avoids leaking stack traces"""
    response = JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )
    # Add CORS headers to error responses
    origin = request.headers.get("origin")
    if origin in ["http://localhost:3000", "http://localhost:5173", "http://localhost:8080", "https://fixetta.ai", "https://www.fixetta.ai"]:
        response.headers["access-control-allow-origin"] = origin
        response.headers["access-control-allow-credentials"] = "true"
    return response


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """Catch-all exception handler - returns generic error to client"""
    print(f"[Fixetta API] Unhandled error: {exc}")
    response = JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )
    # Add CORS headers to error responses
    origin = request.headers.get("origin")
    if origin in ["http://localhost:3000", "http://localhost:5173", "http://localhost:8080", "https://fixetta.ai", "https://www.fixetta.ai"]:
        response.headers["access-control-allow-origin"] = origin
        response.headers["access-control-allow-credentials"] = "true"
    return response


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)