/**
 * Fixetta.ai Estimator Service
 * Multi-model pipeline via OpenRouter:
 *   Stage 1 (The "Eyes"):  google/gemini-3.1-flash-lite-preview  – image analysis & damage extraction
 *   Stage 2 (The "Brain"):  anthropic/claude-sonnet-4.6  – visual pricing breakdown synthesis
 *
 * Security:
 *  - VITE_OPENROUTER_API_KEY is read from import.meta.env (Vite requires VITE_ prefix)
 *  - No PII or stack-traces leak to the client
 *  - All inputs are trimmed and sanitized before prompt construction
 *
 * Token Budget Control:
 *  - max_tokens capped at 2000 for Claude scoping (prevents truncation)
 *  - Zero-history mode: each request is stateless - NO conversation history sent
 *
 * Structured Outputs:
 *  - Uses response_format json_schema for strict JSON validation
 *  - Schema enforces VisualPricingBreakdown format with repair zones, coordinates, and totals
 */

// ── Types ───────────────────────────────────────────────────────────────────

export interface RepairZoneCoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RepairZone {
  zone_id: string;
  indicator_number: number;
  title: string;
  damage_type: string;
  severity: "minor" | "moderate" | "major";
  description: string;
  repair_steps: string[];
  zone_price: number;
  price_range_low: number;
  price_range_high: number;
  coordinates: RepairZoneCoordinates;
  ui_label: string;
  ui_tooltip: string;
}

export interface EstimateSummary {
  project_name: string;
  summary_label: string;
  total_price: number;
  price_range_low: number;
  price_range_high: number;
  confidence: "low" | "medium" | "high";
  zip_code_context: string;
}

export interface UIGuidance {
  display_mode: string;
  show_itemized_table: boolean;
  show_total_prominently: boolean;
  show_zone_cards: boolean;
  preferred_card_style: string;
  cta_label: string;
}

export interface EstimatorResult {
  page_type: string;
  hero_image_usage: string;
  estimate_summary: EstimateSummary;
  repair_zones: RepairZone[];
  ui_guidance: UIGuidance;
  detected_items: string[];
  estimated_sqft: number;
}

interface GeminiVisionResponse {
  detected_items: string[];
  damage_severity: "low" | "medium" | "high";
  reference_objects: string[];
  estimated_dimensions: string;
  estimated_sqft: number;
  notes: string;
}

// ── Config ──────────────────────────────────────────────────────────────────

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

const getApiKey = (): string => {
  const key =
    import.meta.env.VITE_OPENROUTER_API_KEY ?? import.meta.env.OPENROUTER_API_KEY;
  if (!key) {
    console.warn("[EstimatorService] OPENROUTER_API_KEY not set – using placeholder");
    return "sk-or-placeholder";
  }
  return key;
};

// Simple input sanitizer – strips control chars, trims length
const sanitize = (input: string, maxLen = 500): string =>
  input.replace(/[\x00-\x1F\x7F]/g, "").slice(0, maxLen);

// Rate-limit guard (client-side soft cap)
const USER_REQUESTS_KEY = "fixetta_usage_count";
const MAX_REQUESTS_PER_HOUR = 20;

const checkRateLimit = (): boolean => {
  try {
    const raw = localStorage.getItem(USER_REQUESTS_KEY);
    const record = raw
      ? JSON.parse(raw)
      : { count: 0, resetAt: Date.now() + 3_600_000 };

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

// ── JSON Schema for VisualPricingBreakdown ──────────────────────────────────

const VISUAL_PRICING_SCHEMA = {
  type: "object" as const,
  properties: {
    page_type: { type: "string" },
    hero_image_usage: { type: "string" },
    estimate_summary: {
      type: "object" as const,
      properties: {
        project_name: { type: "string" },
        summary_label: { type: "string" },
        total_price: { type: "number" },
        price_range_low: { type: "number" },
        price_range_high: { type: "number" },
        confidence: { type: "string", enum: ["low", "medium", "high"] },
        zip_code_context: { type: "string" },
      },
      required: [
        "project_name",
        "summary_label",
        "total_price",
        "price_range_low",
        "price_range_high",
        "confidence",
        "zip_code_context",
      ],
      additionalProperties: false,
    },
    repair_zones: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          zone_id: { type: "string" },
          indicator_number: { type: "number" },
          title: { type: "string" },
          damage_type: { type: "string" },
          severity: { type: "string", enum: ["minor", "moderate", "major"] },
          description: { type: "string" },
          repair_steps: { type: "array", items: { type: "string" } },
          zone_price: { type: "number" },
          price_range_low: { type: "number" },
          price_range_high: { type: "number" },
          coordinates: {
            type: "object" as const,
            properties: {
              x: { type: "number" },
              y: { type: "number" },
              width: { type: "number" },
              height: { type: "number" },
            },
            required: ["x", "y", "width", "height"],
            additionalProperties: false,
          },
          ui_label: { type: "string" },
          ui_tooltip: { type: "string" },
        },
        required: [
          "zone_id",
          "indicator_number",
          "title",
          "damage_type",
          "severity",
          "description",
          "repair_steps",
          "zone_price",
          "price_range_low",
          "price_range_high",
          "coordinates",
          "ui_label",
          "ui_tooltip",
        ],
        additionalProperties: false,
      },
    },
    ui_guidance: {
      type: "object" as const,
      properties: {
        display_mode: { type: "string" },
        show_itemized_table: { type: "boolean" },
        show_total_prominently: { type: "boolean" },
        show_zone_cards: { type: "boolean" },
        preferred_card_style: { type: "string" },
        cta_label: { type: "string" },
      },
      required: [
        "display_mode",
        "show_itemized_table",
        "show_total_prominently",
        "show_zone_cards",
        "preferred_card_style",
        "cta_label",
      ],
      additionalProperties: false,
    },
  },
  required: ["page_type", "hero_image_usage", "estimate_summary", "repair_zones", "ui_guidance"],
  additionalProperties: false,
};

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Compress an image file to reduce token usage (max 1MB, JPEG quality 0.7).
 */
const compressImage = (file: File, maxSizeMB = 1): Promise<string> =>
  new Promise((resolve, reject) => {
    if (file.size <= maxSizeMB * 1024 * 1024 && file.type === "image/jpeg") {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

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
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.7);
      resolve(compressedDataUrl);
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });

/**
 * Parse JSON from a model response with graceful fallback.
 */
const parseJsonResponse = <T>(text: string): T | null => {
  try {
    let cleaned = text.trim();

    const codeBlockRegex = /```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/g;
    const codeBlockMatch = codeBlockRegex.exec(cleaned);
    if (codeBlockMatch && codeBlockMatch[1]) {
      cleaned = codeBlockMatch[1].trim();
    } else {
      cleaned = cleaned.replace(/^```[\s\S]*?\n?|```$/g, "").trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```/, "").trim();
      }
      if (cleaned.endsWith("```")) {
        cleaned = cleaned.replace(/```$/, "").trim();
      }
    }

    if (!cleaned.startsWith("{")) {
      const jsonStart = cleaned.indexOf("{");
      const jsonEnd = cleaned.lastIndexOf("}");
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
      }
    }

    return JSON.parse(cleaned) as T;
  } catch (e) {
    console.warn("[EstimatorService] Failed to parse JSON response:", text.slice(0, 300));
    console.warn("[EstimatorService] Parse error:", e);
    return null;
  }
};

/**
 * Call OpenRouter with the OpenAI-compatible endpoint.
 */
const callOpenRouter = async (params: {
  model: string;
  messages: Array<{
    role: string;
    content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
  }>;
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: string; json_schema?: unknown };
}): Promise<string> => {
  const { model, messages, temperature = 0.3, max_tokens = 2048, response_format } = params;

  const sanitizedMessages = messages.slice(0, 2);
  if (sanitizedMessages.length !== messages.length) {
    console.warn("[EstimatorService] Truncated message array to enforce zero-history mode");
  }

  const apiKey = getApiKey();

  const requestBody: Record<string, unknown> = {
    model,
    messages: sanitizedMessages,
    temperature,
    max_tokens,
  };

  if (response_format) {
    requestBody.response_format = response_format;
  }

  const res = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "Fixetta AI Estimator",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "unknown error");
    throw new Error(`[EstimatorService] OpenRouter returned ${res.status}: ${errText}`);
  }

  const data = await res.json();

  const usage = data.usage || {};
  console.log(`[EstimatorService] Token Usage [${model}]:`, {
    prompt_tokens: usage.prompt_tokens || 0,
    completion_tokens: usage.completion_tokens || 0,
    total_tokens: usage.total_tokens || 0,
  });

  const content = data.choices?.[0]?.message?.content ?? "";
  return content.trim();
};

/**
 * Wrapper that calls OpenRouter with the json_schema response format.
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
        name: "VisualPricingBreakdown",
        strict: true,
        schema: VISUAL_PRICING_SCHEMA,
      },
    },
  });
};

/**
 * Retry wrapper for API calls with exponential backoff.
 */
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await fn();
      if (typeof result === "string" && !result.trim()) {
        throw new Error("Empty response from API");
      }
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`[EstimatorService] Attempt ${attempt + 1} failed: ${lastError.message}`);

      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`[EstimatorService] Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error("Unknown error during retry");
};

// ── Pipeline Stage 1: Gemini Vision  ────────────────────────────────────────

const analyzeImage = async (
  imageBase64: string,
  userNote?: string
): Promise<GeminiVisionResponse> => {
  const sanitizedNote = userNote ? sanitize(userNote, 300) : "";
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
    : "Analyze this photo for home repair estimation.";

  const raw = await callOpenRouter({
    model: "google/gemini-3.1-flash-lite-preview",
    temperature: 0.2,
    max_tokens: 600,
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          { type: "text", text: userContent },
          {
            type: "image_url",
            image_url: { url: imageBase64 },
          },
        ],
      },
    ],
  });

  const parsed = parseJsonResponse<GeminiVisionResponse>(raw);
  if (!parsed) {
    throw new Error("Gemini returned non-parseable response");
  }

  return parsed;
};

// ── Pipeline Stage 2: Visual Pricing Breakdown  ─────────────────────────────

const generateVisualPricingBreakdown = async (
  visionResult: GeminiVisionResponse,
  userNote?: string
): Promise<EstimatorResult> => {
  const sanitizedNote = userNote ? sanitize(userNote, 300) : "";
  const detectedItemsStr = visionResult.detected_items.join(", ");

  const systemPrompt = `You are the final structured-output model for Fixetta.com's AI Repair Estimator.

You are operating inside a decoupled Planner-Actor pipeline:
- Vision ("Eyes") has already analyzed the uploaded image(s) and may provide visual findings, damaged areas, and scene context.
- Logic/Pricing ("Brain") must interpret those findings using professional contractor reasoning and generate a homeowner-friendly estimate with regionalized pricing based on ZIP code context.
- This system is stateless. Treat every request as a fresh estimate.
- Your output must be valid, parseable JSON only.

PRIMARY OBJECTIVE:
Preserve the original professional estimating logic, but change the final presentation contract.

IMPORTANT PRESENTATION CHANGE:
Do NOT return a traditional itemized pricing page, invoice table, or long line-item estimate.
Do NOT structure the output around a spreadsheet-like list of charges.

Instead, the final product page must use the user-submitted image as the main visual canvas and present a VISUAL PRICING BREAKDOWN:
- identify meaningful repair zones from the photo
- determine the repair logic for each zone
- assign pricing for each zone
- provide normalized coordinates so the frontend can place numbered indicators or hotspots directly on the image
- show a clear total estimate
- make the estimate feel visually tied to the damage shown in the image

Your output should feel like:
- a large uploaded photo
- on-image numbered markers
- each marker opens a concise repair card
- each repair card shows the issue, short scope, repair steps, and price
- a prominent total estimate summary
- no traditional itemized table

PRICING LOGIC RULES:
- Use realistic contractor logic, not generic captions.
- Think through the actual repair workflow for what is visible.
- Include appropriate prep, repair, finishing, texture matching, priming, painting, and blending where applicable.
- If drywall is damaged, reason through likely steps such as: protect the area, remove damaged material if needed, patch or replace drywall, tape, mud, sand, and finish, match texture if needed, prime and paint/blend.
- If assumptions are required because the image is incomplete, reflect that in confidence and price range.
- Prices should be believable, professional, and useful for a homeowner-facing estimate.

REPAIR ZONE RULES:
- A repair zone is a meaningful visible area that maps to one logical repair workflow.
- Merge overlapping or related issues into one zone if they would normally be repaired together.
- Do not create unnecessary micro-zones.
- If there is only one main issue, still return one repair zone and a full estimate summary.
- If there is visible damage but exact dimensions are uncertain, estimate the visual region reasonably for UI placement.
- If there is no clearly visible damage, return an empty repair_zones array and set the summary accordingly.

COORDINATE RULES:
- Use normalized values from 0 to 100.
- x and y represent the top-left corner of the zone.
- width and height represent the approximate damaged area.
- Clamp all coordinate values to the 0 to 100 range.
- Coordinates are for UI placement, not exact construction measurement.

UI/PRESENTATION RULES:
- The uploaded image is the hero element.
- The frontend should render numbered hotspots, pins, or markers using your coordinates.
- Each zone should have a short visible label and a short tooltip/card summary.
- Keep labels concise and clean.
- The total estimate must be visually prominent.
- The estimate should feel modern, visual-first, transparent, and easy to understand.

STRICT OUTPUT RULES:
- Return JSON only.
- Return one single JSON object.
- Do not output markdown.
- Do not use code fences.
- Do not include commentary before or after the JSON.
- Do not include apologies, explanations, notes, or headings.
- Do not wrap the JSON in backticks.
- Do not include trailing commas.
- Do not include invalid JSON.
- Ensure the response starts with { and ends with }.
- All required fields must be present.
- Use arrays, strings, numbers, and booleans correctly.
- If a value is unknown, make a reasonable estimate rather than breaking the schema.

CONSISTENCY RULES:
- total_price should be consistent with the sum of the zone prices.
- price_range_low should be less than or equal to total_price.
- price_range_high should be greater than or equal to total_price.
- Each zone_price should be consistent with that zone's low/high range.
- indicator_number values must be unique and sequential starting at 1.
- zone_id values must be unique.
- show_itemized_table must always be false.
- display_mode must always be "image_with_hotspots".

Output ONLY the JSON matching the schema.`;

  const userPrompt = `VISION FINDINGS:
- Detected items: ${detectedItemsStr}
- Estimated area: ${visionResult.estimated_sqft} sq ft
- Damage severity: ${visionResult.damage_severity}
- Analysis notes: ${visionResult.notes}
${sanitizedNote ? `\nAdditional user note: ${sanitizedNote}` : ""}

TASK: Generate a visual pricing breakdown with repair zones mapped to the image. Provide normalized coordinates (0-100) for each zone so the frontend can place numbered hotspots on the photo.`;

  const modelId = "anthropic/claude-sonnet-4.6";
  console.log("[Estimator] Handing off to Claude:", modelId, "| Items:", detectedItemsStr);

  const raw = await callOpenRouterWithSchema({
    model: modelId,
    temperature: 0.1,
    max_tokens: 2000,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const parsed = parseJsonResponse<EstimatorResult>(raw);
  if (!parsed) {
    throw new Error("Claude returned non-parseable response");
  }

  // Ensure consistency
  const totalPrice = parsed.repair_zones.reduce(
    (sum, zone) => sum + (zone.zone_price ?? 0),
    0
  );
  parsed.estimate_summary.total_price = totalPrice;
  parsed.estimate_summary.price_range_low = parsed.repair_zones.reduce(
    (sum, zone) => sum + (zone.price_range_low ?? 0),
    0
  );
  parsed.estimate_summary.price_range_high = parsed.repair_zones.reduce(
    (sum, zone) => sum + (zone.price_range_high ?? 0),
    0
  );

  // Ensure UI guidance is set
  parsed.ui_guidance = parsed.ui_guidance || {
    display_mode: "image_with_hotspots",
    show_itemized_table: false,
    show_total_prominently: true,
    show_zone_cards: true,
    preferred_card_style: "clean_modern_minimal",
    cta_label: "Book This Repair",
  };

  parsed.hero_image_usage = "use_uploaded_image_as_main_canvas";
  parsed.page_type = "visual_pricing_breakdown";

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
  userNote?: string
): Promise<EstimatorResult> => {
  if (!checkRateLimit()) {
    throw new Error("Rate limit exceeded. Please try again later or contact support.");
  }

  if (images.length === 0) {
    throw new Error("No images provided. Please upload at least one photo.");
  }

  // Stage 1: Vision
  const primaryImage = images[0];
  const base64 = await compressImage(primaryImage);
  const visionResult = await analyzeImage(base64, userNote);

  // Stage 2: Visual Pricing Breakdown
  const pricingResult = await generateVisualPricingBreakdown(visionResult, userNote);

  return {
    ...pricingResult,
    detected_items: visionResult.detected_items,
    estimated_sqft: visionResult.estimated_sqft,
  };
};

/**
 * Text-only estimation using Claude for visual pricing breakdown.
 * Used when user provides a description but no photos.
 */
export const generateTextEstimate = async (userNote: string): Promise<EstimatorResult> => {
  if (!checkRateLimit()) {
    throw new Error("Rate limit exceeded. Please try again later or contact support.");
  }

  const sanitizedNote = sanitize(userNote, 500);

  const systemPrompt = `You are the final structured-output model for Fixetta.com's AI Repair Estimator.

You are operating inside a decoupled Planner-Actor pipeline:
- Vision ("Eyes") has already analyzed the uploaded image(s) and may provide visual findings, damaged areas, and scene context.
- Logic/Pricing ("Brain") must interpret those findings using professional contractor reasoning and generate a homeowner-friendly estimate with regionalized pricing based on ZIP code context.
- This system is stateless. Treat every request as a fresh estimate.
- Your output must be valid, parseable JSON only.

PRIMARY OBJECTIVE:
Preserve the original professional estimating logic, but change the final presentation contract.

IMPORTANT PRESENTATION CHANGE:
Do NOT return a traditional itemized pricing page, invoice table, or long line-item estimate.
Do NOT structure the output around a spreadsheet-like list of charges.

Instead, the final product page must use the user-submitted image as the main visual canvas and present a VISUAL PRICING BREAKDOWN:
- identify meaningful repair zones from the photo
- determine the repair logic for each zone
- assign pricing for each zone
- provide normalized coordinates so the frontend can place numbered indicators or hotspots directly on the image
- show a clear total estimate
- make the estimate feel visually tied to the damage shown in the image

Your output should feel like:
- a large uploaded photo
- on-image numbered markers
- each marker opens a concise repair card
- each repair card shows the issue, short scope, repair steps, and price
- a prominent total estimate summary
- no traditional itemized table

PRICING LOGIC RULES:
- Use realistic contractor logic, not generic captions.
- Think through the actual repair workflow for what is visible.
- Include appropriate prep, repair, finishing, texture matching, priming, painting, and blending where applicable.
- If drywall is damaged, reason through likely steps such as: protect the area, remove damaged material if needed, patch or replace drywall, tape, mud, sand, and finish, match texture if needed, prime and paint/blend.
- If assumptions are required because the image is incomplete, reflect that in confidence and price range.
- Prices should be believable, professional, and useful for a homeowner-facing estimate.

REPAIR ZONE RULES:
- A repair zone is a meaningful visible area that maps to one logical repair workflow.
- Merge overlapping or related issues into one zone if they would normally be repaired together.
- Do not create unnecessary micro-zones.
- If there is only one main issue, still return one repair zone and a full estimate summary.
- If there is visible damage but exact dimensions are uncertain, estimate the visual region reasonably for UI placement.
- If there is no clearly visible damage, return an empty repair_zones array and set the summary accordingly.

COORDINATE RULES:
- Use normalized values from 0 to 100.
- x and y represent the top-left corner of the zone.
- width and height represent the approximate damaged area.
- Clamp all coordinate values to the 0 to 100 range.
- Coordinates are for UI placement, not exact construction measurement.

UI/PRESENTATION RULES:
- The uploaded image is the hero element.
- The frontend should render numbered hotspots, pins, or markers using your coordinates.
- Each zone should have a short visible label and a short tooltip/card summary.
- Keep labels concise and clean.
- The total estimate must be visually prominent.
- The estimate should feel modern, visual-first, transparent, and easy to understand.

STRICT OUTPUT RULES:
- Return JSON only.
- Return one single JSON object.
- Do not output markdown.
- Do not use code fences.
- Do not include commentary before or after the JSON.
- Do not include apologies, explanations, notes, or headings.
- Do not wrap the JSON in backticks.
- Do not include trailing commas.
- Do not include invalid JSON.
- Ensure the response starts with { and ends with }.
- All required fields must be present.
- Use arrays, strings, numbers, and booleans correctly.
- If a value is unknown, make a reasonable estimate rather than breaking the schema.

CONSISTENCY RULES:
- total_price should be consistent with the sum of the zone prices.
- price_range_low should be less than or equal to total_price.
- price_range_high should be greater than or equal to total_price.
- Each zone_price should be consistent with that zone's low/high range.
- indicator_number values must be unique and sequential starting at 1.
- zone_id values must be unique.
- show_itemized_table must always be false.
- display_mode must always be "image_with_hotspots".

Output ONLY the JSON matching the schema.`;

  const makeApiCall = async (): Promise<string> => {
    return callOpenRouterWithSchema({
      model: "anthropic/claude-sonnet-4.6",
      temperature: 0.1,
      max_tokens: 2000,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Repair request: ${sanitizedNote}` },
      ],
    });
  };

  const raw = await retryWithBackoff(makeApiCall, 3, 1500);

  const parsed = parseJsonResponse<EstimatorResult>(raw);
  if (!parsed) {
    throw new Error("Failed to generate estimate from description. Please provide more details.");
  }

  // Ensure consistency
  const totalPrice = parsed.repair_zones.reduce(
    (sum, zone) => sum + (zone.zone_price ?? 0),
    0
  );
  parsed.estimate_summary.total_price = totalPrice;
  parsed.estimate_summary.price_range_low = parsed.repair_zones.reduce(
    (sum, zone) => sum + (zone.price_range_low ?? 0),
    0
  );
  parsed.estimate_summary.price_range_high = parsed.repair_zones.reduce(
    (sum, zone) => sum + (zone.price_range_high ?? 0),
    0
  );

  // Ensure UI guidance is set
  parsed.ui_guidance = parsed.ui_guidance || {
    display_mode: "image_with_hotspots",
    show_itemized_table: false,
    show_total_prominently: true,
    show_zone_cards: true,
    preferred_card_style: "clean_modern_minimal",
    cta_label: "Book This Repair",
  };

  parsed.hero_image_usage = "use_uploaded_image_as_main_canvas";
  parsed.page_type = "visual_pricing_breakdown";

  return parsed;
};

/**
 * Dry-run fallback: returns mock estimate when no images or description provided.
 */
export const getFallbackEstimate = (): EstimatorResult => ({
  page_type: "visual_pricing_breakdown",
  hero_image_usage: "use_uploaded_image_as_main_canvas",
  estimate_summary: {
    project_name: "General Maintenance",
    summary_label: "Initial Assessment",
    total_price: 0,
    price_range_low: 0,
    price_range_high: 0,
    confidence: "low",
    zip_code_context: "",
  },
  repair_zones: [],
  ui_guidance: {
    display_mode: "image_with_hotspots",
    show_itemized_table: false,
    show_total_prominently: true,
    show_zone_cards: true,
    preferred_card_style: "clean_modern_minimal",
    cta_label: "Book This Repair",
  },
  detected_items: ["General maintenance item"],
  estimated_sqft: 0,
});

export default { runEstimatorPipeline, getFallbackEstimate, generateTextEstimate };