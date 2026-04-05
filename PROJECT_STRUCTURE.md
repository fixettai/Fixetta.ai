# Fixetta.ai - Project Structure & Audit Report

## Overview

**Fixetta** is an AI-powered Home Repair Estimator web app. Users can capture/upload photos of home repair issues, get AI-driven cost estimates, and book local professionals. The app uses **vanilla React via Import Maps** — no bundler or build step required.

**Tech Stack:** React 18 (ESM/Import Maps), CSS3 (Variables, Flexbox, Grid), Vanilla JS (ES Modules)

**Entry Point:** `index.html` → `src/index.js` → `src/App.js`

---

## Directory Structure

```
/
├── index.html                     # Main HTML entry with Import Map for React
├── README.md                      # Project documentation & setup instructions
├── PROJECT_STRUCTURE.md           # This file
├── repomix-output.xml             # Repomix export (archive of codebase)
│
└── src/
    ├── App.js                     # ⚙️ MAIN APP - State management, screen routing, bottom nav
    ├── App.tsx                    # 🔴 DEAD FILE - Empty placeholder (not used)
    ├── App.css                    # 🎨 GLOBAL STYLES - CSS variables, resets, components
    ├── index.js                   # 🚀 React DOM mount (mounts #app in index.html)
    ├── index.tsx                  # 🔴 DEAD FILE - Unused TypeScript entry (not used)
    │
    ├── components/                # 🧩 Reusable UI Components
    │   ├── AIResultScreen.js      # Result display: cost estimate, pro matching, booking
    │   ├── AIResultScreen.css     # Styles for result screen
    │   ├── AnalysisLoading.js     # Animated loading screen during AI "analysis"
    │   ├── AnalysisLoading.css    # Styles for loading screen
    │   ├── BoundingOverlay.js     # Bounding box overlay for AI vision visualization
    │   ├── BoundingOverlay.css    # Styles for bounding boxes
    │   ├── GuidedPrompts.js       # Multi-step question flow for detail refinement
    │   ├── GuidedPrompts.css      # Styles for guided prompts
    │   ├── MultiPhotoCapture.js   # Photo capture/upload UI (up to 4 photos)
    │   ├── MultiPhotoCapture.css  # Styles for photo capture
    │   ├── VitalsVault.js         # Homeowner profile form (home specs)
    │   └── VitalsVault.css        # Styles for vitals vault
    │
    ├── screens/                   # 📱 Full-page Screen Views
    │   ├── HomeScreen.js          # Landing page: hero, services, featured pros
    │   ├── ProsScreen.js          # Pro listing with map, filters, booking
    │   ├── ProjectsScreen.js      # User's project history & status
    │   └── ProfileScreen.js       # User profile, settings, toggles
    │
    ├── data/                      # 🗄️ Mock Data Layer
    │   └── mockData.js            # AI analyses, zip rates, pro listings, service tiles, vitals defaults
    │
    └── utils/                     # 🔧 Utilities
        ├── aiPipeline.js          # AI helper functions: category guessing, bounding boxes, pro matching
        ├── persistence.js         # ✅ ACTIVE - localStorage wrapper for client-side state
        └── persistence.ts         # 🔴 DEAD FILE - Uses unavailable `window.persistentStorage`
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
- **Recommendation:** Consider using `<base href="/">` or adjusting paths for deployment

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