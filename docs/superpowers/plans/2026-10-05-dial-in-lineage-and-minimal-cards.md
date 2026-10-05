# Dial-in Lineage Timeline & Minimal Share Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a vertical Dial-in Lineage timeline in `BatchDetail.jsx`, enhance the share ticket generator in `cardGenerator.js` with minimalist barista keys (prominent active grinder dial, dose in/out), and deploy with live verification to the VPS.

**Architecture:** A dedicated, lightweight `DialInTimeline.jsx` component evaluates the batch's recipe history, extracts sensory adjustments, tags sweet spots, and provides one-tap brew actions. `cardGenerator.js` is enriched with prominent active grinder badges and dose in/out readouts for minimalist aesthetic ticket generation.

**Tech Stack:** React 18, Vite 5, Tailwind/CSS variables, HTML5 Canvas 2D, Express, Node.js ES Modules.

---

### Task 1: Unit Test Suite for Dial-in Lineage Logic

**Files:**
- Create: `scripts/test_dialin_timeline.mjs`

- [ ] **Step 1: Write test suite for timeline sorting, sweet-spot detection, and delta extraction**

```javascript
import assert from 'node:assert/strict';

// Helper function to test extraction and lineage logic
export function processRecipeLineage(recipes = []) {
  if (!Array.isArray(recipes) || recipes.length === 0) return [];

  // Sort ascending by creation time to show chronology (Step 1 -> Step 2 -> ...)
  const sorted = [...recipes].sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));

  return sorted.map((rec, idx) => {
    const prev = idx > 0 ? sorted[idx - 1] : null;
    const isSweetSpot = rec.rating === 5 || (rec.notes && rec.notes.toLowerCase().includes('sweet spot'));
    
    let clickDelta = null;
    let tempDelta = null;
    
    if (prev) {
      const currentTemp = parseInt(String(rec.temperature).replace(/[^\d]/g, ''), 10);
      const prevTemp = parseInt(String(prev.temperature).replace(/[^\d]/g, ''), 10);
      if (!isNaN(currentTemp) && !isNaN(prevTemp)) {
        tempDelta = currentTemp - prevTemp;
      }
    }

    return {
      iteration: idx + 1,
      id: rec.id,
      method: rec.method || 'V60 (Filtrado)',
      grind: rec.grind || 'Molienda estándar',
      temperature: rec.temperature || '93°C',
      ratio: rec.ratio || '1:16',
      dose_in_g: rec.dose_in_g || 15,
      dose_out_g: rec.dose_out_g || 240,
      rating: rec.rating || 0,
      isSweetSpot,
      tempDelta,
      notes: rec.notes || ''
    };
  });
}

console.log('🧪 Testing Dial-in Lineage Processing Logic...');

const mockRecipes = [
  {
    id: 1,
    created_at: '2026-10-01T10:00:00Z',
    method: 'V60 (Filtrado)',
    grind: '68 clics (~1.7 Rot.)',
    temperature: '93°C',
    rating: 3,
    notes: 'Sub-extraído, notas agrias'
  },
  {
    id: 2,
    created_at: '2026-10-02T10:00:00Z',
    method: 'V60 (Filtrado)',
    grind: '70 clics (~1.8 Rot.)',
    temperature: '94°C',
    rating: 5,
    notes: 'Sweet spot perfecto, dulzor alto'
  }
];

const lineage = processRecipeLineage(mockRecipes);
assert.equal(lineage.length, 2, 'Should process 2 recipes');
assert.equal(lineage[0].iteration, 1);
assert.equal(lineage[0].isSweetSpot, false);

assert.equal(lineage[1].iteration, 2);
assert.equal(lineage[1].isSweetSpot, true, 'Rating 5 should be tagged as sweet spot');
assert.equal(lineage[1].tempDelta, 1, 'Temperature delta from 93 to 94 should be +1');

console.log('✅ Passed: Dial-in Lineage logic verified successfully!\n');
```

- [ ] **Step 2: Run test to verify it passes**
Run: `node scripts/test_dialin_timeline.mjs`
Expected: `✅ Passed: Dial-in Lineage logic verified successfully!`

- [ ] **Step 3: Commit**
```bash
git add scripts/test_dialin_timeline.mjs
git commit -m "test(barista): add unit test suite for dial-in lineage and sweet spot detection"
```

---

### Task 2: Create `frontend/src/components/DialInTimeline.jsx`

**Files:**
- Create: `frontend/src/components/DialInTimeline.jsx`

- [ ] **Step 1: Implement `DialInTimeline.jsx` component**
Write modular React component rendering:
- Step circles connected by vertical track line.
- Badge for iteration `#1, #2...`.
- Gold `🏆 Sweet Spot` badge for rating 5.
- Grinder dial, temperature, ratio, dose in/out chips.
- Sensory feedback notes.
- Action button `▶ Preparar Esta Versión`.

- [ ] **Step 2: Verify component compiles cleanly**
Run: `npm --prefix frontend run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**
```bash
git add frontend/src/components/DialInTimeline.jsx
git commit -m "feat(ui): implement DialInTimeline component for recipe evolution tracking"
```

---

### Task 3: Update `frontend/src/utils/cardGenerator.js` for Minimalist Barista Ticket Export

**Files:**
- Modify: `frontend/src/utils/cardGenerator.js`

- [ ] **Step 1: Enhance `drawRecipeDetails` in `cardGenerator.js`**
Ensure that when `incRecipe` is true:
- The active grinder name and formatted dial are drawn prominently (e.g. `FEMOBOOK A2: 68 CLICS`).
- Dosis In / Dosis Out is displayed in large monospace text (`15.0g IN ➔ 240g OUT`).
- Method and extraction time are cleanly aligned.
- Star rating glyphs and flavor notes are styled with high visual hierarchy.

- [ ] **Step 2: Verify card rendering script passes**
Run: `node scripts/verify_cards_render.mjs`
Expected: 100% pass across all 4 templates.

- [ ] **Step 3: Commit**
```bash
git add frontend/src/utils/cardGenerator.js
git commit -m "feat(cards): enhance cardGenerator with prominent active grinder dial and minimalist dose in/out"
```

---

### Task 4: Integrate `DialInTimeline` in `frontend/src/components/BatchDetail.jsx`

**Files:**
- Modify: `frontend/src/components/BatchDetail.jsx`

- [ ] **Step 1: Add view mode state (`recipeViewMode: 'timeline' | 'cards'`) in `BatchDetail.jsx`**
- Import `DialInTimeline`.
- Render segment controls: `[ 🎯 Linaje Dial-in ]` and `[ 📋 Lista de Recetas ]`.
- Pass `batch.recipes`, `grinderType`, and connect `onBrewRecipe` to `handleStartBrewGuide`.

- [ ] **Step 2: Run build to ensure 0 lint/Vite errors**
Run: `npm --prefix frontend run build`
Expected: Exit code 0.

- [ ] **Step 3: Commit**
```bash
git add frontend/src/components/BatchDetail.jsx
git commit -m "feat(batch-detail): integrate DialInTimeline with direct brew action"
```

---

### Task 5: End-to-End Verification, Push & VPS Deployment

**Files:**
- Test all scripts:
  - `node scripts/test_dialin_timeline.mjs`
  - `node scripts/test_ai_endpoint_e2e.mjs`
  - `node scripts/test_pulsar_mini.mjs`
  - `node scripts/test_grinders_unification.mjs`
  - `node scripts/test_sensory_tuner.mjs`
  - `node scripts/verify_cards_render.mjs`

- [ ] **Step 1: Execute all test suites**
Run: `node scripts/test_dialin_timeline.mjs && node scripts/test_ai_endpoint_e2e.mjs && node scripts/test_pulsar_mini.mjs && node scripts/test_grinders_unification.mjs && node scripts/test_sensory_tuner.mjs && node scripts/verify_cards_render.mjs`
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
