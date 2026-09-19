# Truthful Coffee Cards & Tickets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate all fabricated data, fake SCA scores, hardcoded spectrum bars, and dummy terroir defaults from `frontend/src/utils/cardGenerator.js`, restricting every card to real user-entered coffee information.

**Architecture:** 
- In `frontend/src/utils/cardGenerator.js`:
  - Sanitize root variable extraction to eliminate fake defaults (`Boquete, Panamá`, `Lavado`, `Geisha / Heirloom`, `1.850m`, `89.5`, `Notas limpias...`).
  - Add `drawWrappedText` utility.
  - Remove all fake hardcoded spectrum bars (`attrBars`, `neoBars`, `auroraBars`) and fake French notes.
  - Implement real cupping text rendering + real flavor tag pills.
  - Only render SCA score badges if `scaScore` is a valid positive number.
  - Fix grind tile to display real grind dial and avoid `null µm`.
  - Clean cellar menu cards (`generateCoffeeMenuCardImage`) to only display real attributes.

**Tech Stack:** JavaScript Canvas 2D API, Vite, Node.js headless testing.

---

### Task 1: Refactor `cardGenerator.js` Root Attributes & Helpers

**Files:**
- Modify: `frontend/src/utils/cardGenerator.js:180-265`

- [ ] **Step 1: Implement `drawWrappedText` helper**
- [ ] **Step 2: Strip all dummy fallback assignments from `rec` extractions**
Set `origin`, `roaster`, `producer`, `process`, `variety`, `altitude`, `notesStr` to actual values or empty strings.
Set `scaScore` to `parseFloat(rawSca)` if valid number > 0, else `null`.

---

### Task 2: Refactor Blueprint Style (`style === 'blueprint'`)

**Files:**
- Modify: `frontend/src/utils/cardGenerator.js:300-640`

- [ ] **Step 1: Solo Grano (`!incRecipe`)**:
  - Remove fake `[CERTIFIED]` and fake score.
  - Replace fake terroir matrix subtitles with real metadata.
  - Remove hardcoded `attrBars` (Acidez 88%, etc.).
  - Render real `notesStr` with `drawWrappedText` and real `flavorTags`.
  - Display cellar tube count and real SCA score only if present.
- [ ] **Step 2: Con Receta (`incRecipe`)**:
  - Remove fake `[TARGET EXTRACTION...]`.
  - Render real grind name + microns only if available (no `null µm`).
  - Remove hardcoded pour progress labels. Render real pours or barista notes.

---

### Task 3: Refactor Neobrutalist Style (`style === 'neobrutalist'`)

**Files:**
- Modify: `frontend/src/utils/cardGenerator.js:680-1040`

- [ ] **Step 1: Solo Grano (`!incRecipe`)**:
  - Remove `SHIBUYA DISTRICT` and fake score badge.
  - Remove fake terroir subtitles (`VOLCANIC SOIL`, etc.).
  - Remove hardcoded `neoBars` (Acidez 90%, etc.).
  - Render real `notesStr` and real flavor stickers.
- [ ] **Step 2: Con Receta (`incRecipe`)**:
  - Remove fake slogans and `null µm`.
  - Render real recipe parameters and real tags.

---

### Task 4: Refactor Aurora Style (`style === 'aurora'`)

**Files:**
- Modify: `frontend/src/utils/cardGenerator.js:1060-1360`

- [ ] **Step 1: Solo Grano (`!incRecipe`)**:
  - Remove fake `CERTIFIED SENSORIAL CALIBRATION` and fake score.
  - Remove hardcoded `auroraBars`.
  - Render real cupping notes and real tags.
- [ ] **Step 2: Con Receta (`incRecipe`)**:
  - Render real recipe parameters and real tags.

---

### Task 5: Refactor Scandinavian Editorial Hangtag Style (`style === 'hangtag'`)

**Files:**
- Modify: `frontend/src/utils/cardGenerator.js:1390-1700`

- [ ] **Step 1: Solo Grano (`!incRecipe`)**:
  - Remove fake score in herbarium strip.
  - Remove fake French cupping sentences (`Corps: Soyeux...`).
  - Render real cupping notes and real flavor pills.
- [ ] **Step 2: Con Receta (`incRecipe`)**:
  - Remove fake score in barista strip.
  - Render real grind and extraction metrics.

---

### Task 6: Refactor Cellar Menu Cards (`generateCoffeeMenuCardImage`)

**Files:**
- Modify: `frontend/src/utils/cardGenerator.js:1740-2300`

- [ ] **Step 1: Strip dummy defaults across all 4 menu styles**
Remove `'Specialty'`, `'Variedad Arábica'`, `'Proceso Artesanal'`, and `['Notas Limpias', 'Balance']`.

---

### Task 7: Verification & Deployment

**Files:**
- Test: `scripts/verify_cards_render.mjs`
- Test: Minimal fixture test script `scripts/test_cards_truthful.mjs`

- [ ] **Step 1: Run headless verification tests**
Run: `npm run build && npm run test:cards`
- [ ] **Step 2: Run minimal fixture test**
Verify card rendering with 0 optional fields (no SCA score, no roaster, no notes).
- [ ] **Step 3: Commit and deploy to VPS**
Deploy to `5.189.152.68` and verify live.
