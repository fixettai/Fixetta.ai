/**
 * Fixetta.ai Estimator Service
 * Multi-model pipeline via OpenRouter:
 *   Stage 1 (The "Eyes"):  google/gemini-3.1-flash-lite-preview  – image analysis & damage extraction
 *   Stage 2 (The "Brain"):  anthropic/claude-sonnet-4.6  – scope-of-work & pricing synthesis (2026 stable workhorse)
 *
 * Security:
 *  - VITE_OPENROUTER_API_KEY is read from import.meta.env (Vite requires VITE_ prefix)
 *  - No PII or stack-traces leak to the client
 *  - All inputs are trimmed and sanitized before prompt construction
 *
 * Token Budget Control:
 *  - max_tokens capped at 2000 for Claude scoping (prevents truncation)
 *  - Input compression: detected_items passed as comma-separated string
 *  - Zero-history mode: each request is stateless - NO conversation history sent
 *
 * Structured Outputs:
 *  - Uses response_format json_schema for strict JSON validation
 *  - Schema enforces ConstructionEstimate format with line items, O&P, totals
 */

// ── Types ───────────────────────────────────────────────────────────────────

export interface EstimatorLineItem {
  trade_code: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  line_total: number;
}

export interface EstimatorResult {
  project_overview: string;
  detected_items: string[];
  estimated_sqft: number;
  line_items: EstimatorLineItem[];
  subtotal: number;
  overhead_profit: number;
  total_estimate: number;
  exclusions: string[];
}

interface GeminiVisionResponse {
  detected_items: string[];
  damage_severity: 'low' | 'medium' | 'high';
  reference_objects: string[];
  estimated_dimensions: string;
  estimated_sqft: number;
  notes: string;
}

interface ClaudeScopingResponse {
  project_overview: string;
  line_items: EstimatorLineItem[];
  subtotal: number;
  overhead_profit: number;
  total_estimate: number;
  exclusions: string[];
}

// ── Config ──────────────────────────────────────────────────────────────────

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

const getApiKey = (): string => {
  const key = import.meta.env.VITE_OPENROUTER_API_KEY ?? import.meta.env.OPENROUTER_API_KEY;
  if (!key) {
    console.warn('[EstimatorService] OPENROUTER_API_KEY not set – using placeholder');
    return 'sk-or-placeholder';
  }
  return key;
};

// Simple input sanitizer – strips control chars, trims length
const sanitize = (input: string, maxLen = 500): string =>
  input.replace(/[\x00-\x1F\x7F]/g, '').slice(0, maxLen);

// Rate-limit guard (client-side soft cap)
const USER_REQUESTS_KEY = 'fixetta_usage_count';
const MAX_REQUESTS_PER_HOUR = 20;

const checkRateLimit = (): boolean => {
  try {
    const raw = localStorage.getItem(USER_REQUESTS_KEY);
    const record = raw ? JSON.parse(raw) : { count: 0, resetAt: Date.now() + 3_600_000 };

    if (Date.now() > record.resetAt) {
      record.count = 0;
      record.resetAt = Date.now() + 3_600_000;
      localStorage.setItem(USER_REQUESTS_KEY, JSON.stringify(record));
    }

    if (record.count >= MAX_REQUESTS_PER_HOUR) return false;

    record.count += 1;
    localStorage.setItem(USER_REQUESTS_KEY, JSON.stringify(record));
    return true;
  } catch {
    return true; // fail open on localStorage error
  }
};

// ── JSON Schema for ConstructionEstimate ─────────────────────────────────────

const CONSTRUCTION_ESTIMATE_SCHEMA = {
  type: "object" as const,
  properties: {
    project_overview: { type: "string" },
    zip_code: { type: "string" },
    line_items: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          trade_code: { type: "string", description: "Xactimate-style code (e.g., DRY, PLM, PNT, DEM, INS, ELE)" },
          description: { type: "string" },
          quantity: { type: "number" },
          unit: { type: "string", enum: ["SF", "LF", "EA", "LS", "HR", "SH"] },
          unit_price: { type: "number" },
          line_total: { type: "number" }
        },
        required: ["trade_code", "description", "quantity", "unit", "unit_price", "line_total"],
        additionalProperties: false
      }
    },
    subtotal: { type: "number" },
    overhead_profit: { type: "number", description: "Combined 20% of subtotal (10/10 split)" },
    total_estimate: { type: "number" },
    exclusions: { type: "array", items: { type: "string" } }
  },
  required: ["project_overview", "line_items", "subtotal", "total_estimate", "exclusions"],
  additionalProperties: false
};

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Compress an image file to reduce token usage (max 1MB, JPEG quality 0.7).
 */
const compressImage = (file: File, maxSizeMB = 1): Promise<string> =>
  new Promise((resolve, reject) => {
    // If the image is already small enough, just convert to base64
    if (file.size <= maxSizeMB * 1024 * 1024 && file.type === 'image/jpeg') {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Resize to max 1024px on longest side (reduces token count significantly)
      const MAX_DIMENSION = 1024;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = (height / width) * MAX_DIMENSION;
          width = MAX_DIMENSION;
        } else {
          width = (width / height) * MAX_DIMENSION;
          height = MAX_DIMENSION;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      // Compress to JPEG at 0.7 quality
      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
      resolve(compressedDataUrl);
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });

/**
 * Convert a file/image to base64 data URL.
 */
const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

/**
 * Parse JSON from a model response with graceful fallback.
 * Includes robust regex stripping of Markdown code blocks.
 */
const parseJsonResponse = <T>(text: string): T | null => {
  try {
    let cleaned = text.trim();
    
    // Strategy 1: Remove markdown code blocks (```json ... ``` or ``` ... ```)
    const codeBlockRegex = /```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/g;
    const codeBlockMatch = codeBlockRegex.exec(cleaned);
    if (codeBlockMatch && codeBlockMatch[1]) {
      cleaned = codeBlockMatch[1].trim();
    } else {
      // Strategy 2: Strip any stray backticks from start/end
      cleaned = cleaned.replace(/^```[\s\S]*?\n?|```$/g, '').trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```/, '').trim();
      }
      if (cleaned.endsWith('```')) {
        cleaned = cleaned.replace(/```$/, '').trim();
      }
    }
    
    // Strategy 3: Find JSON object boundaries if still not parsing
    if (!cleaned.startsWith('{')) {
      const jsonStart = cleaned.indexOf('{');
      const jsonEnd = cleaned.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
      }
    }
    
    return JSON.parse(cleaned) as T;
  } catch (e) {
    console.warn('[EstimatorService] Failed to parse JSON response:', text.slice(0, 300));
    console.warn('[EstimatorService] Parse error:', e);
    return null;
  }
};

/**
 * Call OpenRouter with the OpenAI-compatible endpoint.
 * Includes mandatory attribution headers required by OpenRouter.
 * Supports both json_object and json_schema response formats.
 * 
 * IMPORTANT: This function enforces zero-history mode - only the messages 
 * passed in this call are sent. No conversation history is preserved.
 */
const callOpenRouter = async (params: {
  model: string;
  messages: Array<{ role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }>;
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: string; json_schema?: unknown };
}): Promise<string> => {
  const { model, messages, temperature = 0.3, max_tokens = 2048, response_format } = params;
  
  // Zero-history enforcement: Ensure only system + user messages are sent
  const sanitizedMessages = messages.slice(0, 2);
  if (sanitizedMessages.length !== messages.length) {
    console.warn('[EstimatorService] Truncated message array to enforce zero-history mode');
  }
  
  const apiKey = getApiKey();

  // Build request body with optional response_format for structured output
  const requestBody: Record<string, unknown> = { 
    model, 
    messages: sanitizedMessages, 
    temperature, 
    max_tokens 
  };
  
  // Add response_format if provided (forces structured output from OpenRouter)
  if (response_format) {
    requestBody.response_format = response_format;
  }

  const res = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'Fixetta AI Estimator',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => 'unknown error');
    throw new Error(`[EstimatorService] OpenRouter returned ${res.status}: ${errText}`);
  }

  const data = await res.json();

  // Token usage logging for budget monitoring ($10 cap)
  const usage = data.usage || {};
  console.log(`[EstimatorService] Token Usage [${model}]:`, {
    prompt_tokens: usage.prompt_tokens || 0,
    completion_tokens: usage.completion_tokens || 0,
    total_tokens: usage.total_tokens || 0,
  });

  const content = data.choices?.[0]?.message?.content ?? '';
  return content.trim();
};

/**
 * Wrapper that calls OpenRouter with the json_schema response format
 * for strict structured output validation.
 */
const callOpenRouterWithSchema = async (params: {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  max_tokens?: number;
}): Promise<string> => {
  return callOpenRouter({
    ...params,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "ConstructionEstimate",
        strict: true,
        schema: CONSTRUCTION_ESTIMATE_SCHEMA
      }
    }
  });
};

/**
 * Retry wrapper for API calls with exponential backoff.
 */
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
): Promise<T> => {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await fn();
      if (typeof result === 'string' && !result.trim()) {
        throw new Error('Empty response from API');
      }
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`[EstimatorService] Attempt ${attempt + 1} failed: ${lastError.message}`);

      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`[EstimatorService] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Unknown error during retry');
};

// ── Pipeline Stage 1: Gemini Vision  ────────────────────────────────────────

const analyzeImage = async (
  imageBase64: string,
  userNote?: string,
): Promise<GeminiVisionResponse> => {
  const sanitizedNote = userNote ? sanitize(userNote, 300) : '';
  const systemPrompt = `You are an expert home-inspector AI. Analyze the uploaded photo and return ONLY a JSON object (no markdown, no explanation) with these exact keys:

{
  "detected_items": ["cracked drywall", "water stain near outlet"],
  "damage_severity": "low",
  "estimated_sqft": 12,
  "notes": "Brief context"
}

Use reference objects (doors ≈ 80 in, outlets ≈ 4.5 in) to guess dimensions.
Return ONLY the JSON.`;

  const userContent = sanitizedNote
    ? `Photo for analysis. Additional context: ${sanitizedNote}`
    : 'Analyze this photo for home repair estimation.';

  const raw = await callOpenRouter({
    model: 'google/gemini-3.1-flash-lite-preview',
    temperature: 0.2,
    max_tokens: 600,
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          { type: 'text', text: userContent },
          {
            type: 'image_url',
            image_url: { url: imageBase64 },
          },
        ],
      },
    ],
  });

  const parsed = parseJsonResponse<GeminiVisionResponse>(raw);
  if (!parsed) {
    throw new Error('Gemini returned non-parseable response');
  }

  return parsed;
};

// ── Pipeline Stage 2: Claude Scoping (json_schema)  ─────────────────────────

const generateScopeOfWork = async (
  visionResult: GeminiVisionResponse,
  userNote?: string,
): Promise<ClaudeScopingResponse> => {
  const sanitizedNote = userNote ? sanitize(userNote, 300) : '';
  const detectedItemsStr = visionResult.detected_items.join(', ');

  const systemPrompt = `You are a Senior Residential Restoration Estimator with 20 years of experience in Xactimate and RSMeans. Your task is to transform raw visual findings into a professional, itemized Scope of Work (SOW).

Operational Rules:
- Regional Pricing: Adjust all unit prices based on the provided ZIP code using industry-standard labor and material databases.
- Trade-Specific Logic: If a repair is visible (e.g., drywall hole), automatically include the necessary sub-tasks (e.g., debris removal, taping, sanding, and 2 coats of paint).
- Calculation: Total Replacement Cash Value (RCV) for each line item is calculated as RCV = (Quantity x UnitPrice).
- Business Logic: Apply a standard 10/10 split (10% Overhead and 10% Profit) to the subtotal = 20% combined.
- Zero Prose: Output only the raw JSON object. Do not include markdown backticks or conversational filler.

Pricing Rules:
- Each line_item must include: trade_code, description, quantity, unit, unit_price, line_total
- Use Xactimate-style trade codes (e.g., DRY, PLM, PNT, DEM, INS, ELE)
- Valid units: SF (square feet), LF (linear feet), EA (each), LS (lump sum), HR (hours), SH (sheet)
- subtotal is the SUM of all line_total values
- overhead_profit is 20 percent of subtotal (10/10 combined)
- total_estimate = subtotal + overhead_profit

Output ONLY the JSON matching the schema.`;

  const userPrompt = `VISION FINDINGS:
- Detected items: ${detectedItemsStr}
- Estimated area: ${visionResult.estimated_sqft} sq ft
- Damage severity: ${visionResult.damage_severity}
- Analysis notes: ${visionResult.notes}
${sanitizedNote ? `\nAdditional user note: ${sanitizedNote}` : ''}

TASK: Generate a complete repair estimate with all line items needed to fully restore the damaged area. Include logical secondary repairs (e.g., painting after drywall patch, insulation replacement after plumbing).`;

  const modelId = 'anthropic/claude-sonnet-4.6';
  console.log("[Estimator] Handing off to Claude:", modelId, "| Items:", detectedItemsStr);

  // Uses json_schema for strict structured output, 2000 tokens to prevent truncation
  const raw = await callOpenRouterWithSchema({
    model: modelId,
    temperature: 0.1,
    max_tokens: 2000,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  });

  const parsed = parseJsonResponse<ClaudeScopingResponse>(raw);
  if (!parsed) {
    throw new Error('Claude returned non-parseable response');
  }

  // Recalculate totals for accuracy
  parsed.subtotal = parsed.line_items.reduce(
    (sum, item) => sum + (item.line_total ?? 0),
    0,
  );
  parsed.overhead_profit = Math.round(parsed.subtotal * 0.20 / 5) * 5; // 20% combined (10/10)
  parsed.total_estimate = parsed.subtotal + parsed.overhead_profit;

  return parsed;
};

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Run the full estimator pipeline.
 * @param images  – Array of uploaded File objects (1st frame is primary)
 * @param userNote – Optional text description from the user
 * @returns EstimatorResult
 */
export const runEstimatorPipeline = async (
  images: File[],
  userNote?: string,
): Promise<EstimatorResult> => {
  if (!checkRateLimit()) {
    throw new Error('Rate limit exceeded. Please try again later or contact support.');
  }

  if (images.length === 0) {
    throw new Error('No images provided. Please upload at least one photo.');
  }

  // Stage 1: Vision
  const primaryImage = images[0];
  const base64 = await compressImage(primaryImage);
  const visionResult = await analyzeImage(base64, userNote);

  // Stage 2: Scoping
  const scopeResult = await generateScopeOfWork(visionResult, userNote);

  return {
    project_overview: scopeResult.project_overview || `Restoration estimate for: ${visionResult.detected_items.join(', ')}`,
    detected_items: visionResult.detected_items,
    estimated_sqft: visionResult.estimated_sqft,
    line_items: scopeResult.line_items,
    subtotal: scopeResult.subtotal,
    overhead_profit: scopeResult.overhead_profit,
    total_estimate: scopeResult.total_estimate,
    exclusions: scopeResult.exclusions || [],
  };
};

/**
 * Text-only estimation using Claude for scope generation.
 * Used when user provides a description but no photos.
 * Includes retry logic with exponential backoff.
 */
export const generateTextEstimate = async (
  userNote: string,
): Promise<EstimatorResult> => {
  if (!checkRateLimit()) {
    throw new Error('Rate limit exceeded. Please try again later or contact support.');
  }

  const sanitizedNote = sanitize(userNote, 500);

  const systemPrompt = `You are a Senior Residential Restoration Estimator with 20 years of experience in Xactimate and RSMeans. Your task is to transform user-reported issues into a professional, itemized Scope of Work (SOW).

Operational Rules:
- Regional Pricing: Adjust all unit prices based on the provided ZIP code using industry-standard labor and material databases.
- Trade-Specific Logic: If a repair is reported, automatically include the necessary sub-tasks.
- Calculation: Total Replacement Cash Value (RCV) for each line item is calculated as RCV = (Quantity x UnitPrice).
- Business Logic: Apply a standard 10/10 split (10% Overhead and 10% Profit) to the subtotal = 20% combined.
- Zero Prose: Output only the raw JSON object. Do not include markdown backticks or conversational filler.

Pricing Rules:
- Each line_item must include: trade_code, description, quantity, unit, unit_price, line_total
- Use Xactimate-style trade codes (e.g., DRY, PLM, PNT, DEM, INS, ELE)
- Valid units: SF (square feet), LF (linear feet), EA (each), LS (lump sum), HR (hours), SH (sheet)
- subtotal is the SUM of all line_total values
- overhead_profit is 20 percent of subtotal (10/10 combined)
- total_estimate = subtotal + overhead_profit

Output ONLY the JSON matching the schema.`;

  const makeApiCall = async (): Promise<string> => {
    return callOpenRouterWithSchema({
      model: 'anthropic/claude-sonnet-4.6',
      temperature: 0.1,
      max_tokens: 2000,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Repair request: ${sanitizedNote}` },
      ],
    });
  };

  const raw = await retryWithBackoff(makeApiCall, 3, 1500);

  const parsed = parseJsonResponse<EstimatorResult>(raw);
  if (!parsed || !parsed.line_items || parsed.line_items.length === 0) {
    throw new Error('Failed to generate estimate from description. Please provide more details.');
  }

  // Recalculate totals for accuracy
  parsed.subtotal = parsed.line_items.reduce(
    (sum, item) => sum + (item.line_total ?? 0),
    0,
  );
  parsed.overhead_profit = Math.round(parsed.subtotal * 0.20 / 5) * 5; // 20% combined (10/10)
  parsed.total_estimate = parsed.subtotal + parsed.overhead_profit;

  return parsed;
};

/**
 * Dry-run fallback: returns mock estimate when no images or description provided.
 */
export const getFallbackEstimate = (): EstimatorResult => ({
  project_overview: 'General maintenance assessment',
  detected_items: ['General maintenance item'],
  estimated_sqft: 0,
  line_items: [
    { trade_code: 'GEN', description: 'Initial assessment', quantity: 1, unit: 'EA', unit_price: 0, line_total: 0 },
  ],
  subtotal: 0,
  overhead_profit: 0,
  total_estimate: 0,
  exclusions: [],
});

export default { runEstimatorPipeline, getFallbackEstimate, generateTextEstimate };