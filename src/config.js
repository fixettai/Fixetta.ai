/**
 * Fixetta.ai Configuration Constants
 * All API endpoints and configuration values are centralized here.
 * Sensitive values must be set in .env file (never commit .env to Git).
 */

// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  OPENROUTER_API_URL: 'https://openrouter.ai/api/v1/chat/completions',
  TIMEOUT_MS: 30000,
};

// OpenRouter Model IDs (kept in sync with EstimatorService.ts)
export const MODEL_CONFIG = {
  VISION_MODEL: 'google/gemini-3.1-flash-lite-preview',
  SCOPING_MODEL: 'anthropic/claude-3.5-sonnet',
};

// API Endpoints
export const ENDPOINTS = {
  ANALYZE: `${API_CONFIG.BASE_URL}/api/v1/analyze`,
  ESTIMATE: `${API_CONFIG.BASE_URL}/api/v1/estimate`,
  PROS: `${API_CONFIG.BASE_URL}/api/v1/pros`,
  BOOKING: `${API_CONFIG.BASE_URL}/api/v1/booking`,
  WEBHOOK: `${API_CONFIG.BASE_URL}/api/v1/webhook`,
};

// App Configuration
export const APP_CONFIG = {
  MAX_PHOTOS: 4,
  MAX_SCOPE_LENGTH: 2000,
  MIN_TOUCH_TARGET: 44,
  BORDER_RADIUS: 12,
  DEFAULT_ZIP: '23219',
  DEFAULT_LOCATION: 'Richmond, VA',
};

// Design Tokens (Silk Neomorphic Theme)
export const DESIGN_TOKENS = {
  colors: {
    primary: '#6366f1',      // Indigo
    background: '#e8eaf0',   // Cool gray surface
    accent: '#7c3aed',       // Violet
    surface: '#e8eaf0',      // Must match background for neomorphic effect
    text: '#1e293b',         // Primary text
    textSecondary: '#64748b', // Secondary text
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
  },
  shadows: {
    raised: '6px 6px 12px rgba(0,0,0,0.08), -6px -6px 12px rgba(255,255,255,0.6)',
    inset: 'inset 4px 4px 8px rgba(0,0,0,0.06), inset -4px -4px 8px rgba(255,255,255,0.5)',
    raisedSm: '3px 3px 6px rgba(0,0,0,0.08), -3px -3px 6px rgba(255,255,255,0.6)',
    insetSm: 'inset 2px 2px 4px rgba(0,0,0,0.06), inset -2px -2px 4px rgba(255,255,255,0.5)',
  },
  radius: 12,
  fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif',
};

export default API_CONFIG;