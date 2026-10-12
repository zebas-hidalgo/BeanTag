# BeanTag v4 Professional Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform BeanTag into a professional v4 application by enforcing strict specialty coffee physical accuracy for generated recipes across all 8 grinders and establishing universal WCAG AAA color contrast across OLED dark mode, light mode, and all specialty themes.

**Architecture:** 
1. Backend recipe normalization engine (`backend/aiEngine.js` & `backend/server.js`) that enforces mathematical pour water balance ($\sum \text{water\_g} = \text{water\_total\_g}$), safe physical micron limits (NextLevel Pulsar $\ge 740\,\mu\text{m}$, AeroPress Go $\le 215$g, Ode Gen 2 espresso safeguard), and complete calibrated settings for all 8 grinders.
2. Extension of all legendary barista recipes in `frontend/src/utils/famousRecipes.js` to support all 8 grinders via micron interpolation.
3. Centralized theme design tokens in `frontend/src/index.css` supporting dark mode OLED (`#000000`) and the 6 themes (`espresso`, `matcha`, `cyber`, `sakura`, `caramel`, `frost`) with high contrast badges (`--barista-accent-*-bg`, `--barista-accent-*-text`), refactoring hardcoded colors in `BrewHistory.jsx`, `BatchDetail.jsx`, and `DialInTimeline.jsx`.

**Tech Stack:** Node.js (ES Modules), Express.js, React 18, Vite, Lucide React, SQLite.

---

### Task 1: Unit Test Suite for Recipe Normalization & 8-Grinder Calibration

**Files:**
- Create: `scripts/test_recipe_accuracy_v4.mjs`
- Test: `scripts/test_recipe_accuracy_v4.mjs`

- [ ] **Step 1: Write the test suite verifying recipe accuracy, pour math, and all 8 grinders**

```javascript
// scripts/test_recipe_accuracy_v4.mjs
import assert from 'node:assert/strict';
import {
  computeOfflineRecipe,
  micronsToJMax,
  micronsToKUltra,
  micronsToOdeGen2,
  micronsToComandante,
  micronsToFemobook,
  micronsToKingrinder,
  micronsToTimemore,
  micronsToBaratza
} from '../backend/aiEngine.js';
import { FAMOUS_RECIPES } from '../frontend/src/utils/famousRecipes.js';

console.log('🧪 Running BeanTag v4 Recipe Accuracy & 8-Grinder Calibration Test Suite...\n');

// Test 1: Math pour consistency (sum of pour water === total water)
console.log('Test 1: Mathematical pour water integrity');
const methods = ['V60 (Filtrado)', 'NextLevel Pulsar Mini', 'AeroPress', 'AeroPress Go', 'Prensa Francesa', 'Espresso'];
for (const method of methods) {
  const rec = computeOfflineRecipe({ method, dose_in_g: 15 });
  const pourSum = rec.pours.reduce((acc, p) => acc + (parseFloat(p.water_g) || 0), 0);
  assert.equal(pourSum, rec.water_total_g, `Pours sum (${pourSum}g) must equal water_total_g (${rec.water_total_g}g) for ${method}`);
}
console.log('✅ Passed Test 1: Pour sums match water_total_g exactly across all methods.\n');

// Test 2: Physical safeguards
console.log('Test 2: Physical equipment boundaries');
// NextLevel Pulsar Mini no-bypass safe limit
const pulsarRec = computeOfflineRecipe({ method: 'NextLevel Pulsar Mini', dose_in_g: 15 });
const pulsarMicrons = parseInt(pulsarRec.grind_microns, 10);
assert.ok(pulsarMicrons >= 740, `Pulsar Mini grind (${pulsarMicrons} µm) must be >= 740 µm to prevent filter choking`);
assert.ok(pulsarRec.pours.some(p => p.valve === 'closed'), 'Pulsar must include closed valve bloom phase');
assert.ok(pulsarRec.pours.some(p => p.valve === 'half'), 'Pulsar must include half valve percolation phase');
assert.ok(pulsarRec.pours.some(p => p.valve === 'open'), 'Pulsar must include open valve drainage phase');

// AeroPress Go chamber capacity limit (<= 215g)
const goRec = computeOfflineRecipe({ method: 'AeroPress Go', dose_in_g: 20 });
assert.ok(goRec.water_total_g <= 215, `AeroPress Go water (${goRec.water_total_g}g) must fit in 220ml chamber`);

// Ode Gen 2 espresso safety
const espRec = computeOfflineRecipe({ method: 'Espresso', dose_in_g: 18 });
assert.equal(espRec.grinders.ode_gen2, 'No apto para espresso', 'Fellow Ode Gen 2 flat burrs must be marked unsafe for espresso');
console.log('✅ Passed Test 2: Physical safeguards enforced.\n');

// Test 3: All 8 grinders present in offline recipes
console.log('Test 3: Complete 8-grinder coverage in generated recipes');
const sampleRec = computeOfflineRecipe({ method: 'V60 (Filtrado)', dose_in_g: 15 });
const expectedGrinders = ['jmax', 'k_ultra', 'ode_gen2', 'comandante', 'femobook_a2', 'kingrinder_k6', 'timemore', 'baratza'];
for (const g of expectedGrinders) {
  assert.ok(sampleRec.grinders[g], `Grinder "${g}" must be defined in recipe grinders output`);
  assert.notEqual(sampleRec.grinders[g], '', `Grinder "${g}" must not be empty`);
}
console.log('✅ Passed Test 3: All 8 grinders calibrated in recipe output.\n');

// Test 4: Famous recipes contain all 8 grinders
console.log('Test 4: Famous recipes include all 8 grinder settings');
for (const fam of FAMOUS_RECIPES) {
  assert.ok(fam.grindMicrons, `Famous recipe "${fam.name}" must specify grindMicrons`);
  for (const g of ['jmax', 'femobook', 'k_ultra', 'ode_gen2', 'comandante', 'kingrinder', 'timemore', 'baratza']) {
    assert.ok(fam.grinderSettings[g], `Famous recipe "${fam.name}" must define grinder "${g}"`);
    assert.ok(fam.grinderSettings[g].text, `Famous recipe "${fam.name}" grinder "${g}" must have text`);
  }
}
console.log('✅ Passed Test 4: All 8 legendary recipes contain calibrated settings for all 8 grinders.\n');

console.log('🎉 ALL RECIPE ACCURACY & 8-GRINDER CALIBRATION TESTS PASSED!\n');
```

- [ ] **Step 2: Run test to verify initial failure**

Run: `node scripts/test_recipe_accuracy_v4.mjs`
Expected: FAIL on Test 4 because `famousRecipes.js` only defines 3 grinders (`jmax`, `femobook`, `comandante`).

- [ ] **Step 3: Commit failing test**

```bash
git add scripts/test_recipe_accuracy_v4.mjs
git commit -m "test: add test suite for recipe accuracy and 8-grinder calibration"
```

---

### Task 2: Backend Recipe Normalization & Physical Consistency Engine

**Files:**
- Modify: `backend/aiEngine.js`
- Modify: `backend/server.js`
- Test: `scripts/test_recipe_accuracy_v4.mjs` & `scripts/test_ai_endpoint_e2e.mjs`

- [ ] **Step 1: Implement `normalizeRecipe` in `backend/aiEngine.js`**

Add helper to normalize any AI or fallback recipe:
```javascript
function normalizeRecipe(rawRec, targetMethod, dose, requestedGrinder = 'femobook') {
  if (!rawRec) return null;
  const method = rawRec.method || targetMethod || 'V60 (Filtrado)';
  const mLower = method.toLowerCase();
  const isEspresso = mLower.includes('espresso');
  const isPulsar = mLower.includes('pulsar');
  const isGo = mLower.includes('go');

  // 1. Water and Ratio normalization
  let waterTotalG = parseInt(rawRec.water_total_g, 10);
  if (!Number.isFinite(waterTotalG) || waterTotalG <= 0) {
    const ratioNum = parseFloat(String(rawRec.ratio || '').replace('1:', '')) || (isEspresso ? 2.2 : (isPulsar ? 16.2 : (isGo ? 14.3 : 16.0)));
    waterTotalG = Math.round(dose * ratioNum);
  }

  if (isGo && waterTotalG > 215) {
    waterTotalG = 210;
  }

  // 2. Pour Math balance
  let pours = Array.isArray(rawRec.pours) ? [...rawRec.pours] : [];
  if (pours.length > 0) {
    let runningWater = 0;
    pours = pours.map((p, idx) => {
      let stepW = Math.round(parseFloat(p.water_g || p.water) || 0);
      if (idx === pours.length - 1 && pours.length > 1) {
        stepW = Math.max(0, waterTotalG - runningWater);
      }
      runningWater += stepW;
      return {
        ...p,
        step: p.step || idx + 1,
        water_g: stepW,
        total_water_g: runningWater,
        valve: isPulsar ? (p.valve || (idx === 0 ? 'closed' : (idx === 1 ? 'half' : 'open'))) : p.valve
      };
    });
  }

  // 3. Extract and enforce physical microns
  let microns = parseInt(rawRec.grind_microns, 10);
  if (!Number.isFinite(microns) || microns <= 0) {
    microns = isEspresso ? 260 : (isPulsar ? 780 : (isGo ? 560 : 720));
  }
  if (isPulsar && microns < 740) microns = 760; // Prevent filter choking

  // 4. Calibrate all 8 grinders
  const jmaxObj = micronsToJMax(microns);
  const grinders = {
    femobook_a2: micronsToFemobook(microns),
    jmax: `${jmaxObj.display} (${jmaxObj.rot} Rot. ${jmaxObj.num} Núm. ${jmaxObj.click} Clics)`,
    k_ultra: micronsToKUltra(microns),
    ode_gen2: isEspresso ? 'No apto para espresso' : micronsToOdeGen2(microns, isPulsar),
    comandante: micronsToComandante(microns),
    kingrinder_k6: micronsToKingrinder(microns),
    timemore: micronsToTimemore(microns),
    baratza: micronsToBaratza(microns, isEspresso)
  };

  const activeGrinderKey = requestedGrinder.includes('femo') ? 'femobook_a2'
    : (requestedGrinder.includes('k_ultra') || requestedGrinder.includes('k-ultra') ? 'k_ultra'
    : (requestedGrinder.includes('ode') ? 'ode_gen2'
    : (requestedGrinder.includes('comandante') ? 'comandante'
    : (requestedGrinder.includes('king') ? 'kingrinder_k6'
    : (requestedGrinder.includes('time') ? 'timemore'
    : (requestedGrinder.includes('baratza') ? 'baratza' : 'jmax'))))));

  const activeGrinderDial = {
    grinder_id: activeGrinderKey,
    dial: grinders[activeGrinderKey],
    microns: `${microns} µm`
  };

  return {
    ...rawRec,
    method,
    water_total_g: waterTotalG,
    temperature: parseInt(String(rawRec.temperature).replace(/[^\d]/g, ''), 10) || 93,
    grind_microns: `${microns} µm`,
    pours,
    grinders,
    active_grinder_dial: activeGrinderDial,
    jmax_rot: jmaxObj.rot,
    jmax_num: jmaxObj.num,
    jmax_click: jmaxObj.click
  };
}
```

Export `normalizeRecipe` and use it in `backend/server.js` in `/api/recommend-recipe` before sending JSON.

- [ ] **Step 2: Run tests to verify backend normalization passes**

Run: `node scripts/test_ai_endpoint_e2e.mjs`
Expected: PASS with 0 errors.

- [ ] **Step 3: Commit changes**

```bash
git add backend/aiEngine.js backend/server.js
git commit -m "feat(backend): add comprehensive recipe normalization and 8-grinder physical consistency engine"
```

---

### Task 3: Full 8-Grinder Expansion for Legendary Recipes

**Files:**
- Modify: `frontend/src/utils/famousRecipes.js`
- Test: `scripts/test_recipe_accuracy_v4.mjs`

- [ ] **Step 1: Add generator helper and extend all recipes in `frontend/src/utils/famousRecipes.js`**

Implement helper `get8GrinderSettingsForMicrons(microns, isEspresso, isPulsar)` and use it across all recipes in `FAMOUS_RECIPES`:
- Tetsu Kasuya 4:6 (950 µm)
- Hoffmann Ultimate V60 (700 µm)
- 10 Vertidos Micro (740 µm)
- Lance Hedrick 1-2 Pour (720 µm)
- Turbo Shot (360 µm)
- AeroPress Campeón (900 µm)
- AeroPress Go (560 µm)
- Scott Rao Pulsar Mini (800 µm)
- Jonathan Gagné (780 µm)
- Pulsar Mini Concentrado (840 µm)

Each recipe now populates `femobook`, `jmax`, `k_ultra`, `ode_gen2`, `comandante`, `kingrinder`, `timemore`, `baratza`.

- [ ] **Step 2: Run test suite to verify Test 4 passes**

Run: `node scripts/test_recipe_accuracy_v4.mjs`
Expected: All 4 test groups PASS with exit code 0.

- [ ] **Step 3: Commit changes**

```bash
git add frontend/src/utils/famousRecipes.js
git commit -m "feat(recipes): expand all legendary recipes with calibrated settings for 8 grinders"
```

---

### Task 4: Universal Color Contrast & Adaptive Theme Tokens in `index.css`

**Files:**
- Modify: `frontend/src/index.css:80-165`

- [ ] **Step 1: Add adaptive badge and text tokens for dark mode and all 6 themes**

Add to `:root`:
```css
  --barista-accent-mint-bg: #D1FAE5;
  --barista-accent-mint-text: #065F46;
  --barista-accent-honey-bg: #FEF3C7;
  --barista-accent-honey-text: #92400E;
  --barista-accent-danger-bg: #FEE2E2;
  --barista-accent-danger-text: #991B1B;
  --barista-accent-cryo-bg: #E0F2FE;
  --barista-accent-cryo-text: #0369A1;
```

Add dark mode overrides in `@media (prefers-color-scheme: dark)` and `[data-theme="dark"]`:
```css
  --barista-accent-mint-bg: rgba(16, 185, 129, 0.18) !important;
  --barista-accent-mint-text: #34D399 !important;
  --barista-accent-honey-bg: rgba(245, 158, 11, 0.18) !important;
  --barista-accent-honey-text: #FBBF24 !important;
  --barista-accent-danger-bg: rgba(239, 68, 68, 0.18) !important;
  --barista-accent-danger-text: #F87171 !important;
  --barista-accent-cryo-bg: rgba(56, 189, 248, 0.18) !important;
  --barista-accent-cryo-text: #38BDF8 !important;
```

And ensure each themed preset (`espresso`, `matcha`, `cyber`, `sakura`, `caramel`, `frost`) has high contrast text and border definitions.

- [ ] **Step 2: Compile frontend to verify CSS validity**

Run: `npm --prefix frontend run build`
Expected: PASS with 0 errors.

- [ ] **Step 3: Commit changes**

```bash
git add frontend/src/index.css
git commit -m "feat(theme): define universal WCAG AAA contrast tokens for dark mode and specialty palettes"
```

---

### Task 5: Frontend UI/UX Polish & Form Synchronization

**Files:**
- Modify: `frontend/src/components/BrewHistory.jsx`
- Modify: `frontend/src/components/BatchDetail.jsx`
- Modify: `frontend/src/components/DialInTimeline.jsx`

- [ ] **Step 1: Refactor `BrewHistory.jsx` hardcoded colors to CSS tokens**
Replace `#4A5568`, `#E2E8F0`, `#FEEBC8`, `#C05621`, `#EBF8FF`, `#2B6CB0`, `#C6F6D5`, `#FED7D7` with `var(--color-text-muted)`, `var(--border-color)`, `var(--barista-accent-honey-bg)`, `var(--barista-accent-honey-text)`, `var(--barista-accent-mint-bg)`, `var(--barista-accent-mint-text)`, `var(--barista-accent-danger-bg)`, `var(--barista-accent-danger-text)`.

- [ ] **Step 2: Refactor `BatchDetail.jsx` AI cards, valve pills, and grinder apply handler**
- In `handleApplyAiRecipe`: support aliases `femobook_a2 || femobook`, `kingrinder_k6 || kingrinder`.
- In AI recommendation chips: replace hardcoded `#DBEAFE`, `#FEF3C7`, `#E0F2FE`, `#FEE2E2` with adaptive variables.
- In valve pills: replace `#FED7D7`, `#C6F6D5`, `#FEFCBF` with adaptive variables.

- [ ] **Step 3: Refactor `DialInTimeline.jsx` color contrast**
Ensure node connectors, dial badges, and temperature deltas maintain $\ge 4.5:1$ contrast against card backgrounds in all themes.

- [ ] **Step 4: Build frontend and run verification scripts**

Run:
```bash
npm --prefix frontend run build && node scripts/verify_cards_render.mjs && node scripts/test_dialin_timeline.mjs && node scripts/test_recipe_accuracy_v4.mjs
```
Expected: PASS with 0 errors.

- [ ] **Step 5: Commit changes**

```bash
git add frontend/src/components/BrewHistory.jsx frontend/src/components/BatchDetail.jsx frontend/src/components/DialInTimeline.jsx
git commit -m "feat(ui): eliminate low-contrast hardcoded colors and harmonize grinder synchronization"
```

---

### Task 6: Full Verification Test Suite & Live Production VPS Deployment

**Files:**
- Execute: local verification test suites
- Deploy: VPS `5.189.152.68` via `/Users/zebas/.gemini/config/skills/zerker/scripts/run_vps_cmd.sh`

- [ ] **Step 1: Run all test suites locally**
```bash
node scripts/test_dose_grind_scaling.mjs && \
node scripts/test_ai_endpoint_e2e.mjs && \
node scripts/test_recipe_accuracy_v4.mjs && \
node scripts/test_dialin_timeline.mjs && \
node scripts/verify_cards_render.mjs
```
Expected: All 5 test suites PASS with exit code 0.

- [ ] **Step 2: Push changes to GitHub**
```bash
git push origin main
```

- [ ] **Step 3: Deploy to production VPS**
```bash
/Users/zebas/.gemini/config/skills/zerker/scripts/run_vps_cmd.sh "cd /var/www/beantag && git pull origin main && npm --prefix frontend run build && pm2 reload beantag"
```
Expected: SSH exit code 0, PM2 reloaded process `beantag`.

- [ ] **Step 4: Verify production health**
```bash
curl -sk -I https://5.189.152.68.nip.io/beantag/
```
Expected: `HTTP/1.1 200 OK`.
