# NextLevel Pulsar Mini Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement NextLevel Pulsar Mini as a first-class brewing method with valve-guided interactive timers, 3 legendary recipes (Scott Rao, Jonathan Gagné, Low Ratio Concentrate), grinder calibrations, and card generator support.

**Architecture:**
- Domain/Presets: Add 3 specialized recipes with valve-tagged pour phases and multi-grinder calibrations to `frontend/src/utils/famousRecipes.js`.
- UI Integration: Add `NextLevel Pulsar Mini` (with `<SlidersHorizontal />` icon) to method selectors across `BatchDetail.jsx`, `RecipeForm.jsx`, and `BrewHistory.jsx`.
- Interactive Timer: Render dynamic valve status badges (🔒 VÁLVULA CERRADA / 🔓 VÁLVULA ABIERTA) in the brew assistant.
- Share Cards & History: Render `PULSAR MINI // NO-BYPASS` in `cardGenerator.js` and add quick filters in `BrewHistory.jsx`.

**Tech Stack:** React 18, Vite, Lucide React (`SlidersHorizontal`), Node.js.

---

### Task 1: Add NextLevel Pulsar Mini Recipes & Presets (`famousRecipes.js`)

**Files:**
- Modify: `frontend/src/utils/famousRecipes.js`
- Test: `scripts/test_pulsar_mini_recipes.mjs`

- [ ] **Step 1: Write test script `scripts/test_pulsar_mini_recipes.mjs`**

```javascript
// scripts/test_pulsar_mini_recipes.mjs
import { FAMOUS_RECIPES } from '../frontend/src/utils/famousRecipes.js';

const pulsarRecipes = FAMOUS_RECIPES.filter(r => r.method === 'NextLevel Pulsar Mini');
if (pulsarRecipes.length !== 3) {
  console.error(`Expected 3 Pulsar Mini recipes, found ${pulsarRecipes.length}`);
  process.exit(1);
}

// Verify Scott Rao recipe
const rao = pulsarRecipes.find(r => r.id === 'scott-rao-pulsar-mini');
if (!rao || rao.defaultDose !== 15 || rao.ratioVal !== 16.6) {
  console.error('Scott Rao recipe missing or invalid defaults', rao);
  process.exit(1);
}

const raoPours = rao.calculatePours(15);
if (!Array.isArray(raoPours) || raoPours.length < 3) {
  console.error('Scott Rao calculatePours invalid', raoPours);
  process.exit(1);
}

// Verify valve metadata is present
const hasClosedValve = raoPours.some(p => p.valve === 'closed');
const hasOpenValve = raoPours.some(p => p.valve === 'open');
if (!hasClosedValve || !hasOpenValve) {
  console.error('Pours missing valve tags (closed/open)', raoPours);
  process.exit(1);
}

// Verify grinder calibrations
if (!rao.grinderSettings?.jmax || !rao.grinderSettings?.comandante || !rao.grinderSettings?.femobook) {
  console.error('Missing grinder calibrations', rao.grinderSettings);
  process.exit(1);
}

console.log('✅ NextLevel Pulsar Mini recipes verified successfully!');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/test_pulsar_mini_recipes.mjs`
Expected: FAIL (`Expected 3 Pulsar Mini recipes, found 0`).

- [ ] **Step 3: Add the 3 Pulsar Mini recipes to `frontend/src/utils/famousRecipes.js`**

Add:
1. `scott-rao-pulsar-mini` (15g : 250g / 1:16.6, 94°C, 3:30 min, valve closed bloom -> open percolation).
2. `gagne-high-extraction-mini` (15g : 255g / 1:17, 96°C, 4:15 min, valve closed long bloom -> half open -> open).
3. `pulsar-mini-concentrate` (18g : 252g / 1:14, 92°C, 3:15 min, valve closed -> open).

- [ ] **Step 4: Run test to verify it passes**

Run: `node scripts/test_pulsar_mini_recipes.mjs`
Expected: PASS (`✅ NextLevel Pulsar Mini recipes verified successfully!`).

- [ ] **Step 5: Commit changes**

```bash
git add frontend/src/utils/famousRecipes.js scripts/test_pulsar_mini_recipes.mjs
git commit -m "feat(recipes): add NextLevel Pulsar Mini recipes with valve stage guides and grinder presets"
```

---

### Task 2: UI Method Selector, Timer Valve Badges & History Integration

**Files:**
- Modify: `frontend/src/components/BatchDetail.jsx`
- Modify: `frontend/src/components/RecipeForm.jsx`
- Modify: `frontend/src/components/BrewHistory.jsx`
- Modify: `frontend/src/utils/cardGenerator.js`

- [ ] **Step 1: Update `BatchDetail.jsx`**
  - Import `SlidersHorizontal` from `lucide-react`.
  - Add `{ id: 'NextLevel Pulsar Mini', lucide: <SlidersHorizontal size={18} strokeWidth={2.3} />, label: 'Pulsar Mini' }` to Cupertino segmented button list.
  - In the interactive timer pour step renderer, check `step.valve`:
    - If `step.valve === 'closed'`: render a badge `🔒 VÁLVULA CERRADA (Bloom + Inmersión)`.
    - If `step.valve === 'open'`: render a badge `🔓 VÁLVULA ABIERTA (Percolación)`.
    - If `step.valve === 'half'`: render a badge `⚡ VÁLVULA MEDIA (Flujo Regulado)`.
  - Set default dose and ratio when `NextLevel Pulsar Mini` is selected.

- [ ] **Step 2: Update `RecipeForm.jsx`**
  - Import `SlidersHorizontal` from `lucide-react`.
  - Add `{ id: 'NextLevel Pulsar Mini', lucide: <SlidersHorizontal size={24} />, label: 'Pulsar Mini' }` to method grid.

- [ ] **Step 3: Update `BrewHistory.jsx`**
  - In `getMethodLucideIcon`: if `method` includes `'pulsar'` return `<SlidersHorizontal size={size} color="var(--color-crimson)" />`.
  - Add `'Pulsar Mini'` to quick-filter buttons (`['Todos', 'V60', 'Espresso', 'AeroPress', 'Pulsar Mini', 'Prensa']`).
  - In edit modal, add `'NextLevel Pulsar Mini'` to method options.

- [ ] **Step 4: Update `cardGenerator.js`**
  - In card header / title block: if method includes `'pulsar'`, format method title as `'PULSAR MINI // NO-BYPASS'`.

- [ ] **Step 5: Verify build with `cd frontend && npm run build` and test cards with `npm run test:cards`**

- [ ] **Step 6: Commit changes**

```bash
git add frontend/src/components/BatchDetail.jsx frontend/src/components/RecipeForm.jsx frontend/src/components/BrewHistory.jsx frontend/src/utils/cardGenerator.js
git commit -m "feat(brew): integrate NextLevel Pulsar Mini across method selectors, timer valve badges, and cards"
```

---

### Task 3: Verification, End-to-End Testing & Remote Deployment

**Files:**
- Modify: N/A

- [ ] **Step 1: Run automated recipe test**
  Run `node scripts/test_pulsar_mini_recipes.mjs`
- [ ] **Step 2: Run card rendering verification**
  Run `npm run test:cards`
- [ ] **Step 3: Run frontend production build**
  Run `cd frontend && npm run build`
- [ ] **Step 4: Push to origin/main and deploy to VPS**
  Push to GitHub `origin/main`, pull on VPS `5.189.152.68`, rebuild, and restart PM2 `beantag`. Verify HTTP 200.
