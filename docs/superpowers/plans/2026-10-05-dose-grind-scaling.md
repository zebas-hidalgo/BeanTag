# Dose-Grind Scaling Auto-Adaptation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement real-time physical dose-grind scaling (calibrating grinder clicks and particle size when coffee dose grams change) across the frontend, the offline barista engine, and AI prompts, with live VPS deployment.

**Architecture:** A centralized physical scaling engine in `frontend/src/utils/grinders.js` computes micron deltas based on bed depth resistance (Darcy's Law) and adapts grinder settings across all 8 supported grinders. `BatchDetail.jsx` synchronizes stepper/input dose changes with active grinder states and displays a real-time barista calibration chip. `backend/aiEngine.js` incorporates dose scaling into offline calculations and Gemini prompts.

**Tech Stack:** React 18, Vite 5, Node.js ES Modules, Express, Tailwind/CSS variables.

---

### Task 1: Unit Test Suite for Dose-Grind Scaling Logic

**Files:**
- Create: `scripts/test_dose_grind_scaling.mjs`

- [ ] **Step 1: Write test suite verifying physical dose scaling across all 8 grinders**

```javascript
import assert from 'node:assert/strict';
import { calculateDoseDeltaMicrons, scaleGrinderSettingForDose } from '../frontend/src/utils/grinders.js';

console.log('🧪 Testing Dose-Grind Scaling Physical Calculations...');

// 1. Physical micron delta calculations
assert.equal(calculateDoseDeltaMicrons('V60 (Filtrado)', 15, 20), 40, '5g increase in filter should add +40 microns');
assert.equal(calculateDoseDeltaMicrons('V60 (Filtrado)', 15, 12), -24, '3g decrease in filter should subtract -24 microns');
assert.equal(calculateDoseDeltaMicrons('Espresso', 18, 20), 10, '2g increase in espresso should add +10 microns');
assert.equal(calculateDoseDeltaMicrons('V60 (Filtrado)', 15, 15), 0, 'No dose change should yield 0 delta');

// 2. Grinder adjustments for +5g increase in V60 (15g -> 20g)
const femoAdj = scaleGrinderSettingForDose('femobook', 68, 15, 20, 'V60 (Filtrado)');
assert.equal(femoAdj.newVal, 70, 'Femobook should scale from 68 to 70 clicks (+2 clicks)');
assert.equal(femoAdj.delta, 2);

const jmaxAdj = scaleGrinderSettingForDose('jmax', { rot: 2, num: 2, click: 0 }, 15, 20, 'V60 (Filtrado)');
assert.equal(jmaxAdj.newVal.click, 5, 'J-Max should scale +5 clicks (2.2.0 -> 2.2.5)');

const kUltraAdj = scaleGrinderSettingForDose('k_ultra', 8.0, 15, 20, 'V60 (Filtrado)');
assert.equal(kUltraAdj.newVal, 8.2, 'K-Ultra should scale +0.2 dial (8.0 -> 8.2)');

const odeAdj = scaleGrinderSettingForDose('ode_gen2', 4.2, 15, 20, 'V60 (Filtrado)');
assert.equal(odeAdj.newVal, 4.3, 'Ode Gen 2 should scale +0.1 to +0.2 dial');

const comAdj = scaleGrinderSettingForDose('comandante', 23, 15, 20, 'V60 (Filtrado)');
assert.equal(comAdj.newVal, 24, 'Comandante should scale +1 click (23 -> 24)');

const kingAdj = scaleGrinderSettingForDose('kingrinder', 92, 15, 20, 'V60 (Filtrado)');
assert.equal(kingAdj.newVal, 95, 'Kingrinder should scale +3 clicks (92 -> 95)');

// 3. Scaling down for -3g decrease in V60 (15g -> 12g)
const femoDown = scaleGrinderSettingForDose('femobook', 68, 15, 12, 'V60 (Filtrado)');
assert.equal(femoDown.newVal, 67, 'Femobook should scale down by 1 click for -3g');

console.log('✅ Passed: Dose-Grind scaling calculations verified successfully!\n');
```

- [ ] **Step 2: Run test to verify it fails (module not implemented)**
Run: `node scripts/test_dose_grind_scaling.mjs`
Expected: FAIL (functions not exported).

- [ ] **Step 3: Commit**
```bash
git add scripts/test_dose_grind_scaling.mjs
git commit -m "test(grinders): add unit test suite for dose-grind physical scaling"
```

---

### Task 2: Implement Physical Scaling Engine in `frontend/src/utils/grinders.js`

**Files:**
- Modify: `frontend/src/utils/grinders.js`

- [ ] **Step 1: Implement `calculateDoseDeltaMicrons` and `scaleGrinderSettingForDose`**
- Export:
  - `calculateDoseDeltaMicrons(method, fromDose, toDose)`
  - `scaleGrinderSettingForDose(grinderId, currentVal, fromDose, toDose, method)`
- Support J-Max object `{ rot, num, click }` or total clicks.
- Clamp values to each grinder's minimum and maximum boundaries.

- [ ] **Step 2: Run unit test to verify it passes**
Run: `node scripts/test_dose_grind_scaling.mjs`
Expected: PASS with 0 errors.

- [ ] **Step 3: Commit**
```bash
git add frontend/src/utils/grinders.js
git commit -m "feat(grinders): implement physical dose-grind scaling calculation engine"
```

---

### Task 3: Backend Physical Dose Compensation in `backend/aiEngine.js`

**Files:**
- Modify: `backend/aiEngine.js`

- [ ] **Step 1: Update `computeOfflineRecipe` to scale particle size by dose**
- Read `dose = parseFloat(batch.dose_in_g) || 20.0`.
- Compute `doseDeltaMicrons = Math.round((dose - refDose) * (isEspresso ? 5.0 : 8.0))`.
- Add `doseDeltaMicrons` to `deltaMicrons`.
- Push explanation to `reasons`.

- [ ] **Step 2: Update `generateAiRecipePrompt`**
- Emphasize hydraulic bed resistance and dose-dependent particle size in prompt to Gemini.

- [ ] **Step 3: Verify existing AI endpoints test suite**
Run: `node scripts/test_ai_endpoint_e2e.mjs`
Expected: PASS with 0 errors.

- [ ] **Step 4: Commit**
```bash
git add backend/aiEngine.js
git commit -m "feat(ai): integrate physical dose-grind bed depth compensation in offline engine and prompt"
```

---

### Task 4: Real-time UI Dose-Grind Auto-adaptation in `frontend/src/components/BatchDetail.jsx`

**Files:**
- Modify: `frontend/src/components/BatchDetail.jsx`

- [ ] **Step 1: Integrate dose-grind scaling on dose change in `BatchDetail.jsx`**
- Track `prevDoseRef` to know previous dose.
- When `doseInG` changes via stepper or input:
  - Calculate delta with `scaleGrinderSettingForDose`.
  - Update grinder states (`setFemobookClicks`, `setJmaxRot`, `setKUltraDial`, `setOdeDial`, `setComandanteClicks`, `setKingrinderClicks`, `setTimemoreClicks`, `setBaratzaStep`).
  - Store dose calibration state (`doseAdjustmentInfo`: e.g. `{ deltaClicks: 2, fromDose: 15, toDose: 20 }`).
- Render chip beneath the grinder selector:
  `⚖️ Auto-ajuste por dosis: +2 clics al subir a 20.0g (Cama más profunda)`
  With an option to dismiss or reset.

- [ ] **Step 2: Build production frontend bundle**
Run: `npm --prefix frontend run build`
Expected: 0 errors.

- [ ] **Step 3: Commit**
```bash
git add frontend/src/components/BatchDetail.jsx
git commit -m "feat(batch-detail): auto-adapt grinder clicks and dials in real-time when recipe dose changes"
```

---

### Task 5: End-to-End Verification, Push & VPS Deployment

**Files:**
- Test all scripts:
  - `node scripts/test_dose_grind_scaling.mjs`
  - `node scripts/test_dialin_timeline.mjs`
  - `node scripts/test_pulsar_mini.mjs`
  - `node scripts/test_grinders_unification.mjs`
  - `node scripts/test_sensory_tuner.mjs`
  - `node scripts/verify_cards_render.mjs`
  - `node scripts/test_ai_endpoint_e2e.mjs`

- [ ] **Step 1: Execute all test suites**
Run: `node scripts/test_dose_grind_scaling.mjs && node scripts/test_dialin_timeline.mjs && node scripts/test_pulsar_mini.mjs && node scripts/test_grinders_unification.mjs && node scripts/test_sensory_tuner.mjs && node scripts/verify_cards_render.mjs && node scripts/test_ai_endpoint_e2e.mjs`
Expected: ALL PASS.

- [ ] **Step 2: Build production frontend bundle**
Run: `npm --prefix frontend run build`
Expected: Clean build.

- [ ] **Step 3: Push to GitHub `main`**
Run: `git push origin main`
Expected: Successful push.

- [ ] **Step 4: Deploy to VPS `5.189.152.68` and reload PM2**
Run: `/Users/zebas/.gemini/config/skills/zerker/scripts/run_vps_cmd.sh "cd /var/www/beantag && git pull origin main && npm --prefix frontend run build && pm2 reload beantag"`
Expected: PM2 reload success, status online.

- [ ] **Step 5: Verify live service status**
Run: `/Users/zebas/.gemini/config/skills/zerker/scripts/run_vps_cmd.sh "pm2 status beantag"`
Expected: PID online.
