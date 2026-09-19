# AI Recipe Reliability, Model Cascade & Fallback Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate AI recipe generation failures by fixing invalid Gemini model configurations, preventing unsupported thinkingConfig requests, adding exponential retry & model cascading on 503/429 errors, fixing frontend `apiUrl()` routing in `RecipeForm.jsx`, and providing an algorithmic barista extraction fallback engine.

**Architecture:** 
- In `backend/server.js`: Implement `callGeminiWithRetryAndFallback` with model fallback (`gemini-2.0-flash` -> `gemini-1.5-flash`) and retry delay on 503/429. Implement `computeOfflineRecipe` and `computeOfflineTuning` to guarantee baristas receive an optimal recipe even during external outages.
- In `frontend/src/components/Settings.jsx`: Update Gemini model options to GA models (`gemini-2.0-flash`, `gemini-1.5-flash`, `gemini-1.5-pro`) and auto-migrate obsolete stored models.
- In `frontend/src/components/RecipeForm.jsx`: Wrap endpoints in `apiUrl()` and set default model to `gemini-2.0-flash`.
- In `frontend/src/components/BatchDetail.jsx`, `BatchCreator.jsx`, `Inventory.jsx`: Standardize default model to `gemini-2.0-flash` and improve user toast feedback.

**Tech Stack:** Node.js Express, Google Gemini REST API (v1beta), React / Vite.

---

### Task 1: Backend Extraction Fallback & Resilient Gemini Caller

**Files:**
- Create: `scripts/test_ai_reliability.mjs`
- Modify: `backend/server.js`

- [ ] **Step 1: Write unit test script `scripts/test_ai_reliability.mjs`**
Test offline fallback calculations and model configuration sanitization.

- [ ] **Step 2: Run test to verify initial failure**
Run: `node scripts/test_ai_reliability.mjs`
Expected: FAIL before backend methods are exported or implemented.

- [ ] **Step 3: Implement `computeOfflineRecipe`, `computeOfflineTuning`, model sanitization, and retry/fallback logic in `backend/server.js`**
Add helper functions:
- `sanitizeModel(requestedModel)`: maps invalid models like `gemini-3.7-*` to `gemini-2.0-flash`.
- `computeOfflineRecipe(batchData)`: calculates ratio, grind dial positions (J-Max, Femobook, Comandante, Timemore, Baratza), temperature, pours, and steps.
- `computeOfflineTuning(recipeData)`: applies scientific corrections for under/over extraction.
- `callGeminiWithRetry(prompt, apiKey, model, enableThinking, options)`: handles 1s backoff on 503/429 and secondary model fallback.

- [ ] **Step 4: Run test to verify it passes**
Run: `node scripts/test_ai_reliability.mjs`
Expected: PASS with complete structured recipe output.

- [ ] **Step 5: Commit backend changes**
Run: `git add backend/server.js scripts/test_ai_reliability.mjs && git commit -m "feat(ai): add model cascade, retry engine, and offline barista recipe fallback"`

---

### Task 2: Frontend Route Alignment & Model Dropdown Modernization

**Files:**
- Modify: `frontend/src/components/RecipeForm.jsx`
- Modify: `frontend/src/components/Settings.jsx`
- Modify: `frontend/src/components/BatchDetail.jsx`
- Modify: `frontend/src/components/BatchCreator.jsx`
- Modify: `frontend/src/components/Inventory.jsx`

- [ ] **Step 1: Fix `RecipeForm.jsx` API endpoints and default model**
Wrap `api/recommend-recipe` and `api/ai/tune-recipe` with `apiUrl(...)`.
Update fallback model to `gemini-2.0-flash`.

- [ ] **Step 2: Update `Settings.jsx` model selector and migration**
Update options:
- `gemini-2.0-flash` (Recomendado - Ultrarrápido & Inteligente)
- `gemini-1.5-flash` (Estable & Confiable)
- `gemini-1.5-pro` (Máximo Razonamiento)
Add migration logic in initialization: if current stored model starts with `gemini-3.7` or `gemini-2.5`, reset to `gemini-2.0-flash`.

- [ ] **Step 3: Update `BatchDetail.jsx`, `BatchCreator.jsx`, `Inventory.jsx`**
Align default model to `gemini-2.0-flash`. Provide clear toast notification when fallback recipe is used.

- [ ] **Step 4: Verify frontend build**
Run: `cd frontend && npm run build`
Expected: Build completes with 0 errors.

- [ ] **Step 5: Commit frontend changes**
Run: `git add frontend/src/components/ && git commit -m "fix(frontend): route AI requests via apiUrl and update model defaults to gemini-2.0-flash"`

---

### Task 3: Remote Deployment & Verification

**Files:**
- Execute on VPS `5.189.152.68`

- [ ] **Step 1: Push changes to `origin/main`**
- [ ] **Step 2: Pull and rebuild on VPS**
Execute `git pull origin main`, `cd frontend && npm run build`, and `pm2 restart beantag`.
- [ ] **Step 3: Verify live endpoint health**
Check HTTP 200 on `https://5.189.152.68.nip.io/beantag/` and verify `/api/recommend-recipe` with simulated payload.
