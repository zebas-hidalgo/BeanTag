# Nordic Editorial Tickets & Enriched Coffee Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate visual clunkiness and info scarcity by fixing the Inventory to a single Nordic Editorial view, enriching the shared Coffee Menu with full terroir & sensory notes, and elevating all ticket renders into a high-end Editorial Atelier standard.

**Architecture:** 
1. `Inventory.jsx`: Strip the visual style switcher (`inventory-view-selector`), locking the layout to the refined Nordic Editorial card design.
2. `cardGenerator.js`: Re-architect `generateCoffeeMenuCardImage` and `generateCoffeeMenuText` to render comprehensive coffee metadata (full title, roaster, origin + altitude, variety, process, SCA score, flavor notes pills, and tube stock).
3. `cardGenerator.js`: Overhaul the Editorial Atelier ticket rendering engines (`renderHangtagCard` & `renderHangtagBeanCard`) with fine hairlines, serif typography, and generous negative space, ensuring all card variants pass strict visual checks.
4. Comprehensive automated testing via `verify_cards_render.mjs`, followed by production build and VPS deployment on `5.189.152.68`.

**Tech Stack:** JavaScript (React, HTML5 Canvas 2D, Vite), Node.js ESM, Zerker / PM2 / Nginx.

---

### Task 1: Inventory UI Clean-up (`frontend/src/components/Inventory.jsx`)

**Files:**
- Modify: `frontend/src/components/Inventory.jsx:345-385`

- [ ] **Step 1: Remove `inventory-view-selector` and lock `cardStyle` to `editorial`**

In `frontend/src/components/Inventory.jsx`:
- Remove the `div.inventory-view-selector` buttons (`[🏷️ Editorial] [📋 Lista] [📐 Archivo]`).
- Hardcode the active view state to `editorial`.
- Remove `handleCardStyleChange` and unnecessary localStorage reading for view switching.
- Retain the clean batch counter: `{filteredBatches.length} {filteredBatches.length === 1 ? "Lote en bodega" : "Lotes en bodega"}`.

- [ ] **Step 2: Verify frontend compilation**

Run: `cd frontend && npm run build`
Expected: Build succeeds with 0 errors.

- [ ] **Step 3: Commit changes**

```bash
git add frontend/src/components/Inventory.jsx
git commit -m "refactor(inventory): remove visual style selector and lock to editorial layout"
```

---

### Task 2: Enriched Coffee Menu Card & Clipboard Generator (`frontend/src/utils/cardGenerator.js`)

**Files:**
- Modify: `frontend/src/utils/cardGenerator.js:1520-1803`

- [ ] **Step 1: Enrich `generateCoffeeMenuCardImage` layout**

In `frontend/src/utils/cardGenerator.js`:
- In the item rendering loop for each coffee batch:
  - Extract full name without truncating aggressively; adjust font size if length > 26.
  - Render Roaster prominently alongside Finca / Origin and Altitude (`${b.roaster || "Specialty"} • ${b.origin} (${b.altitude}m)`).
  - Render Variety and Process cleanly (`${b.variety || "Variedad Arábica"} • ${b.process || "Proceso de Finca"}${b.sca_score ? " | SCA " + b.sca_score : ""}`).
  - Render Flavor Notes as discrete pills with soft background: parse notes via `extractFlavorTags(b.flavor_notes || b.roaster_notes || b.notes || "")` and draw rounded tag badges.
  - Draw remaining tube doses badge in the top-right of the coffee item box.
  - Ensure adaptive item height (`itemH = 110` or dynamic calculation based on batch count) so cards never overlap.

- [ ] **Step 2: Enrich `generateCoffeeMenuText` for WhatsApp/Telegram sharing**

In `frontend/src/utils/cardGenerator.js`:
- Fix flavor notes extraction:
  `const rawNotes = b.flavor_notes || b.roaster_notes || b.notes || b.batch_roaster_notes || "";`
- Include complete structured information:
  - Name and Roaster
  - Origin and Altitude
  - Variety and Process
  - Flavor Notes (with emoji `✨`)
  - Stock in tubes and estimated grams

- [ ] **Step 3: Test execution and verify syntax**

Run: `node -e "import(./frontend/src/utils/cardGenerator.js)"`
Expected: Imports cleanly without syntax errors.

- [ ] **Step 4: Commit changes**

```bash
git add frontend/src/utils/cardGenerator.js
git commit -m "feat(cards): enrich coffee menu card and text share with full terroir and flavor notes"
```

---

### Task 3: Refactor Editorial Atelier Ticket Renders (`frontend/src/utils/cardGenerator.js`)

**Files:**
- Modify: `frontend/src/utils/cardGenerator.js:1250-1490`

- [ ] **Step 1: Refactor `renderHangtagBeanCard` (Solo Grano)**

In `frontend/src/utils/cardGenerator.js`:
- Canvas background: Warm ivory `#FAF8F5`.
- Outer border: Ultra-fine 0.75px hairline in `#E8E3D8`.
- Header: Minimal roastery atelier seal with refined letter-spacing.
- Batch Name: Serif editorial font (`"Playfair Display", "Cinzel", "Georgia", serif`), 28px, centered with generous breathing room.
- Terroir section: Clean two-column or stacked metadata with hairlines, displaying Origin, Farm/Producer, Variety, Process, and Elevation.
- Sensory pills: Prominent flavor notes with rounded badges in soft amber-tinted background (`rgba(120, 53, 15, 0.06)`).
- Cellar status: Clean tube count badge at bottom.

- [ ] **Step 2: Refactor `renderHangtagCard` (Con Receta)**

In `frontend/src/utils/cardGenerator.js`:
- Maintain the identical refined Editorial Atelier visual language.
- Extraction parameters grid: 4 horizontal tiles with 1:1 metric icons, clear labels (MÉTODO, DOSIS, RATIO, TIEMPO), and exact vertical centering without boxy clunkiness.
- Sensory notes: Full flavor tags displayed prominently below the recipe parameters.

- [ ] **Step 3: Run frontend build**

Run: `cd frontend && npm run build`
Expected: Build succeeds with 0 errors.

- [ ] **Step 4: Commit changes**

```bash
git add frontend/src/utils/cardGenerator.js
git commit -m "feat(cards): elevate editorial atelier tickets with refined hairlines and balanced typography"
```

---

### Task 4: Automated Verification Script & Quality Gate

**Files:**
- Modify: `scripts/verify_cards_render.mjs`

- [ ] **Step 1: Update verification assertions for enriched menu and editorial cards**

Update `scripts/verify_cards_render.mjs` to ensure the new rendering elements (notes pills, full metadata text lines) execute and produce high-resolution data URLs for all 12 card configurations.

- [ ] **Step 2: Run verification test suite**

Run: `npm run test:cards`
Expected: 12 / 12 tests PASS.

- [ ] **Step 3: Commit verification test updates**

```bash
git add scripts/verify_cards_render.mjs
git commit -m "test(cards): update verification suite for enriched menu and editorial cards"
```

---

### Task 5: Remote VPS Deployment & Live Verification

- [ ] **Step 1: Push changes to GitHub repository**

Run: `git push origin main`

- [ ] **Step 2: Pull and build on VPS (`5.189.152.68`)**

Connect via Zerker, run `cd /var/www/beantag && git pull`, `cd frontend && npm run build`, and `pm2 restart beantag`.

- [ ] **Step 3: Verify live endpoint**

Verify HTTP 200 status on `http://5.189.152.68/beantag/`.
