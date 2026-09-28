# Recalibración Integral de Métodos de Extracción, Física del Grano y Molinos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar el modelo físico unificado de dos capas para el cálculo de tamaño de partícula ($D_{50}$), modulación por naturaleza del grano (proceso, tueste, altitud, reposo de CO₂) y traducción mecánica a los 8 molinos en BeanTag V3.0 (especialmente el rango dulce de 64–72 clics para NextLevel Pulsar Mini en Femobook A2 con protocolo de válvula de 3 fases).

**Architecture:** 
- **Capa 1 (Física):** Micrones base por método ($D_{50}$) modulados por deltas vectoriales según proceso de beneficio (Lavado vs Natural/Honey vs Anaeróbico), tueste (Claro vs Medio vs Oscuro), altitud (SHB vs Baja) y edad de reposo (CO₂).
- **Capa 2 (Mecánica):** Conversores exactos por molino en `backend/aiEngine.js` y `frontend/src/utils/grinders.js` (Femobook A2, 1Zpresso J-Max, K-Ultra, Ode Gen 2, Comandante C40, Kingrinder K6, Timemore C2/C3, Baratza Encore/ESP).
- **Capa 3 (IA & UI):** Inyección de la matriz en el System Prompt de Gemini y generación de pasos con protocolo de válvula para Pulsar y advertencias de desgasificación.

**Tech Stack:** Node.js (ES Modules), React 18, Vite, Google Gemini API (`@google/genai`), PM2, Nginx.

---

### Task 1: Update Test Suites with Recalibrated Tolerances and Bean Nature Assertions

**Files:**
- Modify: `scripts/test_pulsar_mini.mjs`
- Modify: `scripts/test_grinders_unification.mjs`

- [ ] **Step 1: Write the updated test assertions in `scripts/test_pulsar_mini.mjs`**
Add verification of the offline engine calculation for Pulsar Mini + Femobook A2, ensuring:
- Light Washed coffee yields between 64 and 67 clicks (~750–765 µm).
- Natural coffee yields between 68 and 72 clicks (~800–825 µm).
- Valve instructions contain explicit 3 phases (closed bloom, 45-50% percolation, 100% drawdown).

- [ ] **Step 2: Run test to verify it fails with current code**
Run: `node scripts/test_pulsar_mini.mjs`
Expected: FAIL or mismatch because current code produces either 47 clicks or 74+ clicks.

- [ ] **Step 3: Update `scripts/test_grinders_unification.mjs`**
Update Femobook A2 test assertions in `scripts/test_grinders_unification.mjs` so that:
- 65 clicks corresponds to ~740–760 µm (V60 / Pour-over).
- 68 clicks corresponds to ~770–795 µm (Pulsar Mini sweet spot).
- All 8 grinders correctly convert V60, Pulsar, Espresso, and French Press target ranges without NaN.

- [ ] **Step 4: Run grinders unification test to verify failure**
Run: `node scripts/test_grinders_unification.mjs`
Expected: Mismatch on line 60 (expecting 800-850 µm for 74 clicks).

- [ ] **Step 5: Commit test updates**
```bash
git add scripts/test_pulsar_mini.mjs scripts/test_grinders_unification.mjs
git commit -m "test: update test suites with recalibrated pulsar and grinders tolerances"
```

---

### Task 2: Implement Recalibrated Physical Engine and Grinder Translation in `backend/aiEngine.js`

**Files:**
- Modify: `backend/aiEngine.js`

- [ ] **Step 1: Update grinder translation functions in `backend/aiEngine.js`**
Adjust:
- `micronsToFemobook(microns)`: 40 clics/rot. 
  - Espresso: 180-320 µm -> 8 to 14 clics.
  - Aeropress: 540-640 µm -> 44 to 54 clics.
  - V60: 680-760 µm -> 58 to 65 clics.
  - Pulsar Mini: 740-830 µm -> 64 to 72 clics.
  - Chemex: 820-950 µm -> 72 to 82 clics.
  - French Press: 950-1150 µm -> 85 to 100 clics.
- Update `micronsToJMax`, `micronsToKUltra`, `micronsToOde`, `micronsToComandante`, `micronsToKingrinder`, `micronsToTimemore`, `micronsToBaratza` with the unified calibration matrix.

- [ ] **Step 2: Update `computeOfflineRecipe` in `backend/aiEngine.js`**
- Base microns:
  - Pulsar Mini: 780 µm, ratio 1:16, temp 93°C, time 3:30 min.
  - V60: 720 µm, ratio 1:15.5 to 1:16.6, temp 93°C, time 2:50 min.
  - Espresso: 260 µm, ratio 1:2.2, temp 92°C, time 28s.
  - AeroPress: 620 µm, ratio 1:14.5, temp 90°C, time 2:15 min.
  - AeroPress Go: 580 µm, ratio 1:14.0, temp 90°C, time 1:45 min.
  - Chemex: 880 µm, ratio 1:16.0, temp 94°C, time 4:00 min.
  - Prensa Francesa: 1050 µm, ratio 1:15.0, temp 94°C, time 4:00 min.
- Moderate bean deltas:
  - Light roast: -20 µm, +2°C.
  - Dark roast: +40 µm, -3°C.
  - Natural/Honey: +30 µm.
  - Anaerobic/Maceration: +25 µm, -2°C.
  - SHB (>1700m): -10 µm, +1°C.
  - Fresh (<7 days): +15 µm, bloom 55-60s.
  - Old (>45 days): -15 µm, +1°C, bloom 30s.
- Protocol for Pulsar Mini:
  - Generate 3 stages with explicit valve actions:
    1. Bloom (3x-4x water): 🔒 Válvula 100% CERRADA (45-60s).
    2. Percolación continua: ⚡ Válvula al 45-50% de flujo (~2-2.5 ml/s).
    3. Drenaje final: 🔓 Válvula 100% ABIERTA.

- [ ] **Step 3: Update Gemini System Prompt in `backend/aiEngine.js`**
In `generateAiRecipe`, update the prompt instructions:
- Provide the exact calibration matrix for all 8 grinders and brew methods.
- Enforce that the output `grind` must strictly match the grinder's manufacturer dialect and click range.
- Enforce the 3-phase valve protocol in recipe steps when method is NextLevel Pulsar Mini.

- [ ] **Step 4: Run unit tests**
Run: `node scripts/test_pulsar_mini.mjs && node scripts/test_grinders_unification.mjs`
Expected: PASS.

- [ ] **Step 5: Commit changes**
```bash
git add backend/aiEngine.js
git commit -m "feat(barista): recalibrate extraction physics, bean nature deltas, and grinder dials in backend"
```

---

### Task 3: Implement Recalibrated Physical Micron Curves in `frontend/src/utils/grinders.js` and `famousRecipes.js`

**Files:**
- Modify: `frontend/src/utils/grinders.js`
- Modify: `frontend/src/utils/famousRecipes.js`

- [ ] **Step 1: Update `frontend/src/utils/grinders.js`**
- Adjust `calculateMicrons` for Femobook A2:
  - Up to 16 clicks: 180 to 320 µm.
  - 16 to 48 clicks: 320 to 620 µm.
  - 48 to 80 clicks: 620 to 900 µm (so 65 clicks = ~750 µm, 68 clicks = ~780 µm).
  - 80 to 120 clicks: 900 to 1200 µm.
- Adjust `calculateMicrons` for J-Max, K-Ultra, Ode Gen 2, Comandante, Kingrinder, Timemore, Baratza to match the table.
- Update `parseGrindToMicrons`:
  - `lower.includes('pulsar')` -> return 780 µm.

- [ ] **Step 2: Update `frontend/src/utils/famousRecipes.js`**
- Ensure Scott Rao, Jonathan Gagné, and Concentrate recipes for Pulsar Mini specify the updated grind settings and valve notes.

- [ ] **Step 3: Verify frontend build**
Run: `npm --prefix frontend run build`
Expected: Build succeeds with 0 errors.

- [ ] **Step 4: Commit changes**
```bash
git add frontend/src/utils/grinders.js frontend/src/utils/famousRecipes.js
git commit -m "feat(frontend): synchronize grinder micron formulas and famous recipes with recalibrated matrix"
```

---

### Task 4: End-to-End Test Suite Verification and Validation of Bean Nature Physics

**Files:**
- Test: `scripts/test_pulsar_mini.mjs`
- Test: `scripts/test_grinders_unification.mjs`
- Test: `scripts/test_ai_reliability.mjs`
- Test: `scripts/verify_cards_render.mjs`

- [ ] **Step 1: Run all test scripts**
Run:
```bash
node scripts/test_pulsar_mini.mjs
node scripts/test_grinders_unification.mjs
node scripts/test_ai_reliability.mjs
node scripts/verify_cards_render.mjs
```
Expected: All tests PASS with exit code 0.

- [ ] **Step 2: Run frontend production build**
Run: `npm --prefix frontend run build`
Expected: Vite build succeeds and generates clean bundle in `frontend/dist`.

- [ ] **Step 3: Commit any adjustments**
```bash
git status
git commit -am "test(e2e): verify all grinder, pulsar mini, and card rendering tests pass" || echo "Clean"
```

---

### Task 5: Production Deployment and Remote VPS Service Verification

**Files:**
- Remote: VPS `5.189.152.68` (`/root/Proyecto_cafe`)

- [ ] **Step 1: Push commits to `origin/main`**
Run: `git push origin main`
Expected: Remote branch updated successfully.

- [ ] **Step 2: Pull and deploy on VPS via SSH**
Run:
```bash
ssh root@5.189.152.68 "cd /root/Proyecto_cafe && git pull origin main && npm --prefix frontend run build && pm2 restart beantag"
```
Expected: PM2 process `beantag` reloaded and online.

- [ ] **Step 3: Verify HTTP status on production**
Run:
```bash
curl -I http://5.189.152.68/
curl -I http://5.189.152.68/api/batches
```
Expected: HTTP 200 OK.
