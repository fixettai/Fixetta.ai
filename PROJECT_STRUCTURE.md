# Fixetta.ai - Project Structure & Audit Report

## Overview

**Fixetta** is an AI-powered Home Repair Estimator web app. Users can capture/upload photos of home repair issues, get AI-driven cost estimates, and book local professionals. The app uses **vanilla React via Vite** with a **FastAPI backend** for AI chat with intent classification and rebuttal injection.

**Tech Stack:** React 18 (Vite, TypeScript), CSS3 (Tailwind), FastAPI (Python), httpx

**Entry Points:** 
- Frontend: `index.html` → `src/index.jsx` → `src/App.jsx`
- Backend: `backend/main.py` (uvicorn)

---

## Directory Structure

```
/
├── index.html                     # Main HTML entry point (Vite)
├── vite.config.js                 # Vite configuration
├── tailwind.config.js             # Tailwind CSS configuration
├── package.json                   # Frontend dependencies
│
├── data/                          # 🗄️ Data Layer
│   ├── rebuttals.json             # 💬 Sales rebuttal strategies & scripts (NEW)
│   └── mockData.js                # AI analyses, zip rates, pro listings
│
├── backend/                       # 🐍 FastAPI Backend (NEW)
│   ├── __init__.py                # Package init
│   ├── main.py                    # 🚀 FastAPI app with chat endpoint
│   ├── requirements.txt           # Python dependencies
│   ├── .env.example               # Backend environment vars template
│   │
│   └── services/                  # Business logic
│       ├── __init__.py
│       ├── intent_classifier.py   # Gemini-based intent classification
│       └── rebuttal_service.py    # Rebuttal strategy retrieval
│
└── src/
    ├── index.jsx                  # React entry point
    ├── App.jsx                    # Main app with routing
    ├── config.js                  # API endpoints & config constants
    │
    ├── components/                # 🧩 Reusable UI Components
    │   ├── AIChat.jsx/.css        # AI sales chat with rebuttal integration
    │   ├── AIHero.jsx             # Hero section with AI estimator
    │   ├── ScopeInputs.jsx        # Project scope input forms
    │   └── ...                    # Other components
    │
    └── services/                  # 🔧 Frontend services
        ├── EstimatorService.ts    # Multi-model AI pipeline (Gemini + Claude)
        └── index.ts
```

---

## Data Flow

### 1. App Initialization
```
index.html (loads React via Import Map from esm.sh CDN)
    ↓
src/index.js (createRoot → mount <App /> to #app)
    ↓
src/App.js (main state & routing logic)
```

### 2. State Management (Client-Side Only - No Backend)
All state is managed in `App.js` using React `useState`:
- **`flow`** - Current screen identifier (`home`, `camera`, `loading`, `prompts`, `result`, `pros`, `projects`, `profile`, `vitals`)
- **`photos`** - Array of captured/uploaded photo objects `{url, name, type}`
- **`analysis`** - AI analysis result object from `mockData.js`
- **`answers`** - User answers to guided prompt questions
- **`toast`** - Toast notification message
- **`zip`** - ZIP code for local rate calculation

### 3. Screen Navigation Flow
```
HomeScreen
    ↓ (tap "Try Snap AI" or service tile)
MultiPhotoCapture
    ↓ (photos + category key)
AnalysisLoading (simulated 3.5s animation)
    ↓ (complete)
GuidedPrompts (if analysis has questions)
    ↓ (answers)
AIResultScreen (cost estimate, matched pros, booking)
    ↓ (book pro)
ProsScreen / ProjectsScreen
```

### 4. Data Sources
- **`src/data/mockData.js`** - Single source of truth for all mock data:
  - `AI_ANALYSES` - Category-specific repair estimates (plumbing, electrical, drywall, etc.)
  - `PROS` - List of mock professionals with ratings, prices, specialties
  - `ZIP_RATES` - Cost multipliers by ZIP code
  - `SERVICE_TILES` - Service category definitions
  - `MOCK_PROJECTS` - Sample project history
  - `VITALS_DEFAULT` - Default homeowner profile values

### 5. Persistence
- **`src/utils/persistence.js`** - Simple `localStorage` wrapper (`storage.get()`, `storage.set()`)
- Used for persisting user vitals, saved results across sessions
- **`src/utils/persistence.ts`** - **UNUSED** - References non-existent `window.persistentStorage`

### 6. AI Pipeline (Mock)
- `src/utils/aiPipeline.js` provides:
  - `guessCategory(filename)` - Guesses repair category from filename keywords
  - `generateBoundingBoxes(category)` - Returns fake bounding box coords for overlay
  - `matchProsToEstimate(category, pros)` - Filters pros by category
  - `getZipMultiplier(zip)` - Gets cost adjustment from ZIP_RATES

---

## UI Component Architecture

### Routing
No external router. App.js uses a simple `flow` state with conditional rendering to switch between screens.

### Bottom Navigation
Only visible on main screens (`home`, `projects`, `pros`, `profile`). Contains a central "Snap" camera button that floats above the nav bar.

### CSS Architecture
- **Centralized in `App.css`** - Global variables, resets, base component styles
- **Component-specific CSS** - Each component has its own `.css` file for screen-specific styles
- **CSS Variables** - Defined in `:root` for theming (teal, orange, gray scales)

---

## BUGS & ISSUES IDENTIFIED

### 🔴 Critical: Missing Import in AIResultScreen.js
- **File:** `src/components/AIResultScreen.js` (line 125)
- **Issue:** `SERVICE_TILES` is used but **not imported** from `../data/mockData`
- **Current import:** `import { PROS, AI_ANALYSES } from '../data/mockData';`
- **Fix:** Add `SERVICE_TILES` to the import statement

### 🔴 Critical: Unused TypeScript Files (Dead Code)
- **`src/App.tsx`** - Exists as an empty React component returning `<>`. Not referenced anywhere.
- **`src/index.tsx`** - Exists as a React entry point. Not referenced in `index.html` (which loads `src/index.js`).
- **`src/utils/persistence.ts`** - References `window.persistentStorage` which doesn't exist. Would crash if executed.

### 🟡 Potential: Import Path in index.html
- **File:** `index.html` (line 21)
- **Issue:** `<script type="module" src="./src/index.js"></script>` uses relative path
- **Impact:** May cause 404 if deployed to a subpath (e.g., GitHub Pages with `/fixetta/` base)
- **Recommendation:** Consider using `<base href="/>` or adjusting paths for deployment

### 🟡 Low: `italic` undefined in ProsScreen.js
- **File:** `src/screens/ProsScreen.js` (line 134)
- **Issue:** `fontStyle: italic` uses variable `italic` instead of string `'italic'`
- **Impact:** Will cause runtime error (undefined variable reference)

### 🟡 Low: Dynamic Import in HomeScreen.js
- **File:** `src/screens/HomeScreen.js` (lines 7, 10)
- **Issue:** `import('../data/mockData.js')` is called at module level and stored as a promise, then awaited in handler
- **Impact:** Works correctly but is unnecessary since the module is already loaded synchronously in `App.js`

---

## Summary

| Category | Count |
|----------|-------|
| Screens | 4 |
| Components | 6 |
| Data files | 1 |
| Utility files (active) | 2 |
| Dead/Unused files | 3 (`App.tsx`, `index.tsx`, `persistence.ts`) |
| Critical bugs | 2 (missing import, undefined variable) |
| Minor issues | 1 (deployment path) |

---

## Security Status

### Framework Alignment (OWASP Top 10 2021/2026 + NIST CSF)

**OWASP Top 10 Mapping:**

| OWASP Category | Status | Finding |
|----------------|--------|---------|
| A01:2021 Broken Access Control | ❌ Not Implemented | No authentication/authorization in frontend or verified backend |
| A02:2021 Cryptographic Failures | ⚠️ Unknown | No evidence of data encryption at rest or in transit (backend unverified) |
| A03:2021 Injection | ⚠️ Partial | No explicit XSS protection in React; no FastAPI input validation verified |
| A04:2021 Insecure Design | ❌ Present | Mock data pipeline with no real AI backend; no threat modeling documented |
| A05:2021 Security Misconfiguration | ⚠️ Partial | React via CDN (esm.sh) - no SRI hashes; CORS config unverified |
| A06:2021 Vulnerable Components | ⚠️ Not Audited | No `package.json` found - dependency versions unknown; no `npm audit` run |
| A07:2021 Auth Failures | ❌ Not Implemented | No login, registration, JWT, or session management |
| A08:2021 Data Integrity | ⚠️ Unknown | No backup strategy or data integrity checks documented |
| A09:2021 Logging Failures | ❌ Not Implemented | No security logging, monitoring, or alerting detected |
| A10:2021 SSRF | ⚠️ Unknown | Backend proxy to OpenRouter not verified for SSRF protections |

**NIST CSF Mapping:**

| NIST Function | Status | Gap |
|---------------|--------|-----|
| Identify (ID) | ⚠️ Partial | Asset inventory incomplete; third-party risk (OpenRouter, Stripe) not assessed |
| Protect (PR) | ❌ Not Implemented | No access control, training, or data security controls in place |
| Detect (DE) | ❌ Not Implemented | No anomaly detection, monitoring, or alerting mechanisms |
| Respond (RS) | ❌ Not Implemented | No incident response plan or procedures documented |
| Recover (RC) | ❌ Not Implemented | No backup or disaster recovery plan documented |

**Low Hanging Fruit Vulnerabilities:**
- `.env` file contains exposed OpenRouter API key (should be rotated immediately)
- No input validation on `zip` code field (could accept arbitrary strings)
- `localStorage` used for persistence - data is accessible to any script on the page
- No Content Security Policy (CSP) headers configured
- React loaded from CDN without Subresource Integrity (SRI) hash verification

---

### Monetization Readiness (PCI-DSS 4.0)

| PCI-DSS Requirement | Status | Gap |
|---------------------|--------|-----|
| Req 1: Network Security | ❌ Unknown | No firewall/WAF configuration for payment endpoints |
| Req 2: Default Credentials | ✅ Likely OK | Environment variables used for secrets |
| Req 3: Protect Stored Data | ⚠️ Unknown | No encryption strategy for stored user data (localStorage is plaintext) |
| Req 4: Encrypt Transmission | ⚠️ Unknown | HTTPS enforcement not verified; no HSTS header found |
| Req 6: Secure Systems | ⚠️ Unknown | No vulnerability management process documented |
| Req 7: Restrict Access | ❌ Not Implemented | No role-based access control (RBAC) |
| Req 8: Identify Users | ❌ Not Implemented | No unique user identification system |
| Req 10: Log & Monitor | ❌ Not Implemented | No audit logging for payment events |
| Req 11: Test Security | ❌ Not Implemented | No penetration testing or vulnerability scanning |
| Req 12: Security Policy | ❌ Not Implemented | No documented security policies or procedures |

**SAQ-A Readiness Assessment:**
- **Current Status: NOT READY**
- **Gap:** No Stripe Elements or Stripe Checkout integration found. Frontend uses mock data only.
- **Requirement:** To qualify for SAQ-A, payment forms must be fully hosted by Stripe (redirect or iframe). Your servers must NEVER receive, process, or store cardholder data.
- **Action Needed:** Implement Stripe Checkout (redirect) or Stripe Elements (iframe tokenization) so card data bypasses your servers entirely.

---

### API Integrity & Credit Protection (OpenRouter)

| Control | Status | Finding |
|---------|--------|---------|
| Server-Side Rate Limiter | ❌ Not Found | No rate limiting middleware detected in the codebase |
| Kill Switch | ❌ Not Found | No mechanism to disable OpenRouter API calls if abnormal usage detected |
| Usage Cap per User | ❌ Not Found | No per-user request tracking or quota system implemented |
| API Key Exposure | ⚠️ Risk Present | If OpenRouter key is used client-side, it can be extracted and abused |
| Request Validation | ❌ Unknown | No input sanitization found for AI prompt construction (potential prompt injection) |
| Response Validation | ❌ Unknown | No output filtering for AI responses (potential malicious content) |

**Excessive Agency Risk Assessment:**
- **Risk Level: HIGH**
- **Finding:** The AI pipeline (`aiPipeline.js`) is currently mock-based. When connected to OpenRouter, without rate limiting or kill switches, a compromised frontend could trigger unlimited API calls, leading to significant credit drain.
- **Recommendation:** Implement `slowapi` middleware in FastAPI with configurable rate limits (e.g., 10 requests/minute per user). Add a kill switch via environment variable (`OPENROUTER_ENABLED=false`).

---

### Risk Summary

| Severity | Risk ID | Description | OWASP Ref |
|----------|---------|-------------|-----------|
| **Critical** | CR-01 | **Exposed API Key in .env:** The `.env` file contains a live OpenRouter API key that was committed to the repository. This key should be considered compromised and rotated immediately. | A02:2021 |
| **Critical** | CR-02 | **No Backend Security Verified:** Backend FastAPI implementation is minimal/missing. Authentication, authorization, and input validation cannot be verified. | A01:2021, A07:2021 |
| **Critical** | CR-03 | **PCI-DSS Non-Compliance:** No payment processing infrastructure found. If raw card data touches your servers, you lose SAQ-A eligibility and face significant compliance penalties. | Req 3, Req 4 |
| **Critical** | CR-04 | **No Rate Limiting / Kill Switch:** OpenRouter API calls have no server-side rate limiting or emergency kill switch, exposing the project to unlimited credit drain. | A04:2021 |
| **High** | HI-01 | **No Input Validation:** React components render user input without sanitization. FastAPI endpoints lack Pydantic model validation. XSS and injection attacks are possible. | A03:2021 |
| **High** | HI-02 | **No Authentication System:** No user registration, login, or session management. All user data is stored in plaintext localStorage with no access controls. | A07:2021 |
| **High** | HI-03 | **Plaintext Data in localStorage:** User vitals, project history, and saved results are stored in browser localStorage, accessible to any script running on the page. | A02:2021 |
| **Medium** | ME-01 | **Unused TypeScript Files:** Dead code (`App.tsx`, `index.tsx`, `persistence.ts`) increases attack surface and can hide vulnerabilities. | A06:2021 |
| **Medium** | ME-02 | **No Content Security Policy:** No CSP meta tag or header found. This increases risk of XSS and data injection attacks. | A05:2021 |
| **Medium** | ME-03 | **CDN Without SRI:** React loaded from esm.sh CDN without Subresource Integrity hash verification. A compromised CDN could serve malicious code. | A06:2021 |
| **Medium** | ME-04 | **Deployment Path Issue:** Relative import paths in `index.html` may cause 404 errors when deployed to subpaths. | A05:2021 |