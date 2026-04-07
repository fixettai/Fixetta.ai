"""
Fixetta Intent Classifier
Uses Gemini 3.1 Flash Lite to classify user messages into sales objection categories.
"""

import os
import json
import httpx
from typing import Optional, Dict, Any
from pydantic import BaseModel

# Intent classification options
INTENT_OPTIONS = {
    "price_too_high": "User mentions cost, expensive pricing, or cheaper competitors",
    "need_other_bids": "User mentions getting quotes, shopping around, or comparing other contractors",
    "spouse_not_present": "User mentions needing to discuss with husband, wife, partner, or family",
    "think_about_it": "User is hesitating, needs time, or being vague about timing",
    "insurance_check": "User mentions adjusters, insurance claims, or checking with insurance",
    "appointment_ready": "User is ready to book, commit, or schedule the appointment",
    "none": "User is asking a general question or taking a positive step forward"
}


class IntentClassificationResult(BaseModel):
    """Result model for intent classification"""
    intent_id: str
    confidence: float = 0.0
    raw_response: Optional[str] = None


class IntentClassifier:
    """Intent classifier using Gemini 3.1 Flash Lite via OpenRouter"""
    
    SYSTEM_PROMPT = """You are a Sales Intent Classifier for Fixetta. Analyze the user's message and return ONLY a JSON object with intent_id.

Detection Logic:

price_too_high: Keywords: 'expensive', 'cheaper', 'budget', 'sticker shock', 'cost'.

need_other_bids: Keywords: 'other quotes', 'shopping around', 'comparison', 'bids'.

spouse_not_present: Keywords: 'husband', 'wife', 'partner', 'talk to family', 'we need to discuss'.

think_about_it: Keywords: 'need time', 'not sure', 'wait', 'later', 'hesitating'.

insurance_check: Keywords: 'adjuster', 'claim', 'deductible', 'insurance check', 'waiting on the carrier'.

appointment_ready: Keywords: 'book it', 'let's do it', 'yes', 'when can you come', 'sounds good', 'schedule'.

none: General questions or neutral statements.

User Message: '{user_input}'"""
    
    def __init__(self, api_key: Optional[str] = None):
        self._api_key = api_key or os.getenv("VITE_OPENROUTER_API_KEY") or os.getenv("OPENROUTER_API_KEY")
        self._openrouter_url = "https://openrouter.ai/api/v1/chat/completions"
        self._model = "google/gemini-3.1-flash-lite-preview"
    
    def _has_api_key(self) -> bool:
        """Check if API key is configured"""
        return bool(self._api_key and self._api_key != "your_key_here" and self._api_key != "sk-or-placeholder")
    
    async def classify_intent(self, user_message: str) -> IntentClassificationResult:
        """
        Classify the user's message into an intent category using Gemini.
        
        Args:
            user_message: The user's text input to classify
            
        Returns:
            IntentClassificationResult with intent_id and confidence
        """
        if not self._has_api_key():
            # Fall back to rule-based classification if no API key
            return self._rule_based_classify(user_message)
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    self._openrouter_url,
                    headers={
                        "Authorization": f"Bearer {self._api_key}",
                        "HTTP-Referer": "http://localhost:8000",
                        "X-Title": "Fixetta Intent Classifier",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self._model,
                        "messages": [
                            {"role": "system", "content": self.SYSTEM_PROMPT},
                            {"role": "user", "content": user_message}
                        ],
                        "temperature": 0.1,
                        "max_tokens": 150
                    }
                )
                
                if response.status_code != 200:
                    print(f"[IntentClassifier] OpenRouter error: {response.status_code}")
                    return self._rule_based_classify(user_message)
                
                data = response.json()
                content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                
                return self._parse_response(content)
                
        except Exception as e:
            print(f"[IntentClassifier] Classification error: {e}")
            return self._rule_based_classify(user_message)
    
    def _parse_response(self, response_text: str) -> IntentClassificationResult:
        """Parse Gemini response into structured result"""
        try:
            # Clean up response
            cleaned = response_text.strip()
            # Remove code blocks if present
            cleaned = cleaned.replace("```json", "").replace("```", "").strip()
            
            parsed = json.loads(cleaned)
            intent_id = parsed.get("intent_id", "none")
            confidence = parsed.get("confidence", 0.0)
            
            # Validate intent_id
            if intent_id not in INTENT_OPTIONS:
                intent_id = "none"
            
            return IntentClassificationResult(
                intent_id=intent_id,
                confidence=float(confidence) if confidence else 0.0,
                raw_response=response_text
            )
            
        except (json.JSONDecodeError, TypeError, ValueError):
            # If parsing fails, try to extract intent_id from text
            for intent_id in INTENT_OPTIONS:
                if intent_id in response_text.lower():
                    return IntentClassificationResult(
                        intent_id=intent_id,
                        confidence=0.7,
                        raw_response=response_text
                    )
            return IntentClassificationResult(
                intent_id="none",
                confidence=0.0,
                raw_response=response_text
            )
    
    def _rule_based_classify(self, user_message: str) -> IntentClassificationResult:
        """
        Fallback rule-based classification when API is unavailable.
        Uses simple keyword matching for intent detection.
        """
        msg = user_message.lower()
        
        # Price/cost keywords
        if any(kw in msg for kw in ["expensive", "cost", "cheap", "price", "pricey", "overpriced", "budget", "afford", "money", "too much", "high", "rates", "fees"]):
            return IntentClassificationResult(intent_id="price_too_high", confidence=0.7)
        
        # Shopping around keywords
        if any(kw in msg for kw in ["quote", "quotes", "estimate", "compare", "competition", "other", "another", "bid", "bid", "shop", "looking around"]):
            return IntentClassificationResult(intent_id="need_other_bids", confidence=0.7)
        
        # Partner/spouse keywords
        if any(kw in msg for kw in ["husband", "wife", "partner", "spouse", "family", "discuss", "talk", "ask", "check with", "decide together"]):
            return IntentClassificationResult(intent_id="spouse_not_present", confidence=0.7)
        
        # Hesitation keywords
        if any(kw in msg for kw in ["think", "think about", "later", "maybe", "not sure", "decide", "time", "not ready", "not yet", "wait", "hold off"]):
            return IntentClassificationResult(intent_id="think_about_it", confidence=0.7)
        
        # Insurance keywords
        if any(kw in msg for kw in ["insurance", "claim", "adjuster", "coverage", "covered", "policy", "deductible"]):
            return IntentClassificationResult(intent_id="insurance_check", confidence=0.7)
        
        # Appointment ready keywords
        if any(kw in msg for kw in ["book it", "let's do it", "lets do it", "yes", "when can you come", "sounds good", "schedule", "book", "ready", "start", "go ahead", "do it"]):
            return IntentClassificationResult(intent_id="appointment_ready", confidence=0.8)
        
        # Default
        return IntentClassificationResult(intent_id="none", confidence=0.0)


# Singleton instance
_classifier = None

def get_intent_classifier() -> IntentClassifier:
    """Get the singleton IntentClassifier instance"""
    global _classifier
    if _classifier is None:
        _classifier = IntentClassifier()
    return _classifier


async def classify_intent(user_message: str) -> IntentClassificationResult:
    """
    Utility function to classify user intent (convenience wrapper).
    """
    return await get_intent_classifier().classify_intent(user_message)