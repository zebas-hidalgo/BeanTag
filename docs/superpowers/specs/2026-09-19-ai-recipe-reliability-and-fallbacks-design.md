# Design Specification: AI Recipe Engine Reliability, Model Cascade & Fallback System

## 1. Problem Statement
Users experience frequent errors when generating or recalibrating AI recipes:
- `404 Not Found`: Model `gemini-3.7-flash` does not exist on Google AI Studio (`v1beta`).
- `400 Bad Request`: `thinkingConfig` injected in request body on standard models causes schema validation failure.
- Connection failure in production: In `RecipeForm.jsx`, requests call `api/recommend-recipe` and `api/ai/tune-recipe` instead of using `apiUrl()`. On the VPS, Nginx routes non-beantag `/api/` to port 5050 (a different service), while BeanTag runs on port 5000 under `/beantag/`.
- `503 Service Unavailable` / `429 Too Many Requests`: Google AI Studio free tier frequently gets overloaded or rate limited, causing uncaught single-attempt failures.
- When Google AI Studio is down or an API key is invalid/missing, baristas are left with a broken screen and no extraction recipe.

## 2. Architecture & Design Decisions

### A. Valid Model Tiering & Automatic Sanitization
- **Primary Recommended Model**: `gemini-2.0-flash` (fastest, high intelligence, official GA model).
- **Secondary Fallback Model**: `gemini-1.5-flash` (hyper-stable, battle-tested across free tier).
- **Deep Reasoning Model**: `gemini-1.5-pro`.
- **Model Sanitizer**: Any legacy stored preference (such as `gemini-3.7-flash`, `gemini-3.7-pro`, `gemini-2.5-flash`) is transparently mapped to `gemini-2.0-flash`.
- **Thinking Config Guard**: Only inject `generationConfig.thinkingConfig` if the model specifically supports it (e.g., `gemini-2.0-flash-thinking-exp`). Never on standard models.

### B. Resilience: Automatic Retries & Cascading Fallback
When a request to Google returns 503 (Overloaded) or 429 (Rate Limit):
1. **Immediate Retry**: Wait 1000ms with jitter and retry the primary model.
2. **Model Cascade**: If primary model fails or remains overloaded, attempt the same prompt with `gemini-1.5-flash`.
3. **Graceful Algorithmic Fallback**: If Google returns 503 after retries, 429, 403/401/404, or network timeout occurs, invoke the built-in Barista Extraction Engine.

### C. Algorithmic Barista Extraction Fallback Engine (`computeOfflineRecipe`)
Computes an expert-level recipe deterministically based on coffee science:
- **Ratio**:
  - Espresso: 1:2.2
  - Pulsar Mini / Immersion: 1:16
  - V60 / Filter / Chemex: 1:15
  - French Press: 1:14
- **Grind Dial Calculations**:
  - Exact formulas for 1Zpresso J-Max (Rot.Num.Clic), Femobook A2, Comandante C40, Timemore C2/C3, Baratza Encore.
  - Adjustments for Roast Level:
    - Light: -4 clicks J-Max, -3 clicks Femobook (finer, dense bean).
    - Dark: +5 clicks J-Max, +4 clicks Femobook (coarser, porous bean).
  - Adjustments for Process:
    - Natural / Anaerobic: +4 clicks J-Max, +3 clicks Femobook (more fines produced).
    - Washed: baseline.
  - Adjustments for Altitude:
    - >1600m: -2 clicks J-Max, -2 clicks Femobook.
- **Pours & Timers**:
  - Multi-stage pour schedule tailored to method (e.g. Bloom + 2 pulses for V60; Valve shut bloom + open drip for Pulsar Mini; Pre-infusion + rampa for Espresso).
- **Sensory Tuning Fallback**:
  - For `tune-recipe`: Adjusts temperature (+/- 1-2°C), grind click (+/- 3-5 clicks), or ratio based on extraction diagnosis (`Sub (Agrio)` -> grind finer + hotter water; `Sobre (Amargo)` -> grind coarser + cooler water).
- **Feedback Flag**:
  - Returns `_source: 'gemini'` or `_source: 'fallback'` with a clean barista explanation notice.

### D. Production API Routing
- All frontend calls in `RecipeForm.jsx`, `BatchDetail.jsx`, `BatchCreator.jsx`, and `Inventory.jsx` must consistently use `apiUrl(...)`.
- `apiUrl('api/recommend-recipe')` resolves to `https://5.189.152.68.nip.io/beantag/api/recommend-recipe` in production, correctly routed by Nginx to the BeanTag Express backend.

## 3. Verification Strategy
- Automated unit test script `scripts/test_ai_reliability.mjs` verifying:
  1. Sanitization of invalid models.
  2. Algorithmic fallback producing valid JSON recipe with grind conversions and pour steps.
  3. Algorithmic fallback producing valid recipe tuning JSON when given sensory defect inputs.
- Frontend build check: `npm run build`.
- VPS Deployment verification: restart PM2, verify live HTTP 200 and test the API endpoint.
