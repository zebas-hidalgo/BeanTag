# Collector Cards & High-Impact Story Stickers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul `frontend/src/utils/cardGenerator.js` and the Share Modals (`BatchDetail.jsx`, `Settings.jsx`) to replace cluttered micro-text cards with 5 curated specialty-coffee collector themes (`studio`, `kissaten`, `blueprint`, `neobrutalist`, `diner`) and boost Story Sticker typography by +60% for effortless mobile legibility.

**Architecture:** We replace the repetitive 5,084-line `cardGenerator.js` with a clean, modular, theme-driven Canvas 2D engine that shares unified layout primitives (`drawCollectorShell`, `drawMultiLineTitle`, `drawExtractionTimeline`, `drawSensoryRadarChart`, `drawTicketNotchesAndPerforation`, `drawTerroirBadges`) parameterized by rich `CARD_THEMES`. We also update `BatchDetail.jsx` and `Settings.jsx` so all 5 collections are selectable in the UI.

**Tech Stack:** HTML5 Canvas 2D API, React 18, Lucide React.

---

### Task 1: Overhaul `frontend/src/utils/cardGenerator.js` with Curated Themes, +60% Sticker Typography & 4-Zone Collector Layout

**Files:**
- Modify: `frontend/src/utils/cardGenerator.js`

- [ ] **Step 1: Upgrade `CARD_THEMES` with the 5 Specialty Coffee Collections**
  - `studio`: Swiss Studio (`#FAFAFA` / `#FFFFFF` / `#09090B` / `#18181B`)
  - `kissaten`: Tokyo Kissaten (`#F3EFE6` / `#FAF8F5` / `#1C1917` / `#B91C1C`)
  - `blueprint`: Dark Espresso Lab (`#090D16` / `#111827` / `#F8FAFC` / `#38BDF8`)
  - `neobrutalist`: Nomad Roastery (`#F7F3EB` / `#FFFDF9` / `#18181B` / `#EA580C`)
  - `diner`: Botanical Terroir (`#EFF5F1` / `#FFFFFF` / `#143326` / `#C2410C`)

- [ ] **Step 2: Upgrade `drawSensoryRadarChart` and `drawExtractionTimeline` for high mobile legibility**
  - Increase radar chart axis label font from `6.5px` to `11.5px` bold (`ACIDEZ`, `DULZOR`, `CUERPO`, `BALANCE`, `FINAL`) with clear padding (`radius + 10`).
  - Render `drawExtractionTimeline` with `12.5px`–`13px` bold labels (`TIMELINE`, `BLOOM`, pour weights/times) and smooth progress nodes.

- [ ] **Step 3: Redesign `generateRecipeCardImage` (`540 × 760 @ 2x`)**
  - Implement the 4-zone editorial collector card layout supporting both `incRecipe = true` (Extraction Ticket with 2×2 Hero Telemetry + Pour Timeline) and `incRecipe = false` (Solo Grano Terroir Passport with 2×2 Origin/Variety/Process/Producer cards), plus Sensory Radar + Flavor Pills and Ticket Perforation notches.

- [ ] **Step 4: Redesign `generateCoffeeMenuCardImage` (`540 × dynamic @ 2x`)**
  - Render a high-legibility specialty coffee cellar menu with `28px` title, `20px` coffee names, `13.5px` origin/process metadata, and `13px` tube stock pills.

- [ ] **Step 5: Redesign `generateCoffeeStickerImage` (`600 × 300` Horizontal & `400 × 540` Vertical @ 2x)**
  - Implement multi-line title rendering (`34px–44px` bold, up to 2 lines), `13.5px` roaster header pill, `14px` terroir badges (`34px` height), `17px–18px` flavor pills (`46px` height) with SCA glyphs, and `48px` radius 5-axis SCA sensory radar in vertical mode.

- [ ] **Step 6: Verify all 40 headless card/sticker tests pass**
  - Run: `npm run test:cards`

- [ ] **Step 7: Commit**
  - `git add frontend/src/utils/cardGenerator.js && git commit -m "feat(cards): overhaul card and story sticker generator with 5 collector themes and +60% typography scale"`

---

### Task 2: Update Share Modals in `BatchDetail.jsx` and `Settings.jsx` with All 5 Curated Collection Buttons

**Files:**
- Modify: `frontend/src/components/BatchDetail.jsx`
- Modify: `frontend/src/components/Settings.jsx`

- [ ] **Step 1: Update template selector in `frontend/src/components/BatchDetail.jsx`**
  - Include all 5 styles (`studio`, `kissaten`, `blueprint`, `neobrutalist`, `diner`) with clean collection labels (`Studio`, `Kissaten`, `Dark Lab`, `Nomad`, `Botanical`).
  - Clean up raw emojis in share modal buttons.

- [ ] **Step 2: Update template selector in `frontend/src/components/Settings.jsx`**
  - Include all 5 styles (`studio`, `kissaten`, `blueprint`, `neobrutalist`, `diner`) in the Cellar Menu share modal.

- [ ] **Step 3: Run full verification suite and deploy to VPS**
  - Run: `npm run test:cards && node scripts/test_groq_integration.js && node scripts/test_ai_resilience.js && node scripts/test_tube_racks_api.js`
  - Commit and deploy to Zerker VPS.
