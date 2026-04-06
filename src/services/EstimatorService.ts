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
 *  - max_tokens capped at 600 for Claude scoping (protects $10 credit cap)
 *  - Input compression: detected_items passed as comma-separated string
 *  - Zero-history mode: each request is stateless - NO conversation history sent
 */

// ── Types ───────────────────────────────────────────────────────────────────

export interface EstimatorResult {
  detected_items: string[];
  estimated_sqft: number;
  itemized_tasks: { task: string; materials: string[]; estimated_cost: number }[];
  estimated_cost: number;
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
  itemized_tasks: { task: string; materials: string[]; estimated_cost: number }[];
  estimated_cost: number;
  assumptions: string[];
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
    // Regex Strip: Remove any Markdown code blocks (```json ... ``` or ``` ... ```)
    // This handles cases where the model ignores the json_object flag
    let cleaned = text.replace(/```(?:json)?\s*([\s\S]*?)```/g, '$1').trim();
    
    // Fallback: Also remove any stray backticks that might remain
    cleaned = cleaned.replace(/^```|```$/g, '').trim();
    
    return JSON.parse(cleaned) as T;
  } catch {
    console.warn('[EstimatorService] Failed to parse JSON response:', text.slice(0, 200));
    return null;
  }
};

/**
 * Call OpenRouter with the OpenAI-compatible endpoint.
 * Includes mandatory attribution headers required by OpenRouter.
 * 
 * IMPORTANT: This function enforces zero-history mode - only the messages 
 * passed in this call are sent. No conversation history is preserved.
 */
const callOpenRouter = async (params: {
  model: string;
  messages: Array<{ role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }>;
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: string };
}): Promise<string> => {
  const { model, messages, temperature = 0.3, max_tokens = 2048, response_format } = params;
  
  // Zero-history enforcement: Ensure only system + user messages are sent
  // This prevents token bloat from conversation history
  const sanitizedMessages = messages.slice(0, 2); // Only take first 2 messages (system + user)
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
  
  // Add response_format if provided (forces raw JSON output from OpenRouter)
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
      // Validate result is not empty
      if (typeof result === 'string' && !result.trim()) {
        throw new Error('Empty response from API');
      }
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`[EstimatorService] Attempt ${attempt + 1} failed: ${lastError.message}`);

      // Don't delay on the last attempt
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
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

// ── Pipeline Stage 2: Claude Scoping  ───────────────────────────────────────

const generateScopeOfWork = async (
  visionResult: GeminiVisionResponse,
  userNote?: string,
): Promise<ClaudeScopingResponse> => {
  const sanitizedNote = userNote ? sanitize(userNote, 300) : '';

  // Input compression: convert detected_items to comma-separated string
  // This reduces token count vs sending full JSON
  const detectedItemsStr = visionResult.detected_items.join(', ');

  const systemPrompt = `You are a senior general contractor and estimator. Given the vision analysis below, produce a professional, itemized Scope of Work list.

Return ONLY a JSON object with these exact keys:
{
  "itemized_tasks": [
    { "task": "Patch and skim 12 sq ft drywall section", "materials": ["joint compound", "fiberglass tape", "primer"], "estimated_cost": 185 }
  ],
  "estimated_cost": 420,
  "assumptions": ["No structural damage", "Paint matching available"]
}

Rules:
- Each itemized_tasks entry represents one billable task
- materials is an array of material names needed
- estimated_cost is a realistic USD number (materials + labor) for the given sqft
- estimated_cost (top-level) is the SUM of all task estimated_cost values
- Round costs to nearest 5

Output ONLY the JSON.`;

  // Compressed prompt: uses simple string instead of full JSON object
  const userPrompt = `Detected items: ${detectedItemsStr}
Estimated area: ${visionResult.estimated_sqft} sq ft
Damage severity: ${visionResult.damage_severity}
${sanitizedNote ? `Additional user note: ${sanitizedNote}` : ''}

Generate itemized scope of work as JSON only.`;

  const modelId = 'anthropic/claude-sonnet-4.6';
  console.log("[Estimator] Handing off to Claude:", modelId, "| Items:", detectedItemsStr);

  // max_tokens: 600 to protect $10 budget - we only need concise JSON task list
  // response_format: json_object forces OpenRouter to return raw JSON without markdown wrapping
  const raw = await callOpenRouter({
    model: modelId,
    temperature: 0.3,
    max_tokens: 600,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  });

  const parsed = parseJsonResponse<ClaudeScopingResponse>(raw);
  if (!parsed) {
    throw new Error('Claude returned non-parseable response');
  }

  // Ensure estimated_cost matches the sum
  parsed.estimated_cost = parsed.itemized_tasks.reduce(
    (sum, t) => sum + (t.estimated_cost ?? 0),
    0,
  );

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
  // Rate-limit guard
  if (!checkRateLimit()) {
    throw new Error('Rate limit exceeded. Please try again later or contact support.');
  }

  if (images.length === 0) {
    throw new Error('No images provided. Please upload at least one photo.');
  }

  // Stage 1: Vision - compress image first to reduce token load
  const primaryImage = images[0];
  const base64 = await compressImage(primaryImage);

  const visionResult = await analyzeImage(base64, userNote);

  // Stage 2: Scoping
  const scopeResult = await generateScopeOfWork(visionResult, userNote);

  return {
    detected_items: visionResult.detected_items,
    estimated_sqft: visionResult.estimated_sqft,
    itemized_tasks: scopeResult.itemized_tasks,
    estimated_cost: scopeResult.estimated_cost,
  };
};

/**
 * Text-only estimation using Claude for scope generation.
 * Used when user provides a description but no photos.
 * Includes retry logic with exponential backoff for resilience against provider-side issues.
 */
export const generateTextEstimate = async (
  userNote: string,
): Promise<EstimatorResult> => {
  if (!checkRateLimit()) {
    throw new Error('Rate limit exceeded. Please try again later or contact support.');
  }

  const sanitizedNote = sanitize(userNote, 500);

  const systemPrompt = `You are a senior general contractor and estimator. Given the user's description of a home repair issue below, produce a professional, itemized Scope of Work list.

Return ONLY a JSON object with these exact keys:
{
  "detected_items": ["issue1", "issue2", ...],
  "estimated_sqft": 0,
  "itemized_tasks": [
    { "task": "Patch and skim drywall section", "materials": ["joint compound", "fiberglass tape", "primer"], "estimated_cost": 185 }
  ],
  "estimated_cost": 420
}

Rules:
- detected_items should list the issues identified from the description
- estimated_sqft should be an educated guess based on the description (or 0 if impossible to estimate)
- Each itemized_tasks entry represents one billable task
- materials is an array of material names needed for that task
- estimated_cost is realistic USD numbers (materials + labor)
- estimated_cost (top-level) is the SUM of all task estimated_cost values
- Round costs to nearest 5

Output ONLY the JSON.`;

  const makeApiCall = async (): Promise<string> => {
    return callOpenRouter({
      model: 'anthropic/claude-sonnet-4.6',
      temperature: 0.3,
      max_tokens: 600,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Repair request: ${sanitizedNote}` },
      ],
    });
  };

  // Retry up to 3 times with exponential backoff for provider-side issues
  const raw = await retryWithBackoff(makeApiCall, 3, 1500);

  const parsed = parseJsonResponse<EstimatorResult>(raw);
  if (!parsed || !parsed.itemized_tasks || parsed.itemized_tasks.length === 0) {
    throw new Error('Failed to generate estimate from description. Please provide more details.');
  }

  // Ensure estimated_cost matches the sum
  parsed.estimated_cost = parsed.itemized_tasks.reduce(
    (sum, t) => sum + (t.estimated_cost ?? 0),
    0,
  );

  return parsed;
};

/**
 * Dry-run fallback: returns mock estimate when no images or description provided.
 */
export const getFallbackEstimate = (): EstimatorResult => ({
  detected_items: ['General maintenance item'],
  estimated_sqft: 0,
  itemized_tasks: [
    { task: 'Initial assessment', materials: ['N/A'], estimated_cost: 0 },
  ],
  estimated_cost: 0,
});

export default { runEstimatorPipeline, getFallbackEstimate, generateTextEstimate };