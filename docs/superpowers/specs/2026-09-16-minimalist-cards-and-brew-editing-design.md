# Design Specification: Minimalist Image-Free Cards & Brew Log Editing

**Date:** 2026-09-16  
**Status:** Approved  
**Author:** Antigravity  

---

## 1. Objective & Scope

1. **Pure Minimalist Typography-First Cards (Image-Free)**:
   - Completely remove hero PNG illustrations and raster metric icon assets from `cardGenerator.js` across all styles:
     - Blueprint (Técnico / Blueprint)
     - Neo-Brutalist / Neo-Pop
     - Aurora (Holographic Glass)
     - Hangtag / Editorial Atelier
   - Apply to all card types: **Con Receta** (recipe extraction), **Solo Grano** (coffee cellar sheet), and **Carta de Cafés** (menu overview).
   - Establish clean typographic hierarchy, generous whitespace, subtle hairlines, and discrete sensory pills. Zero clashing backgrounds or awkward image crops.

2. **Editable Brew Logs (Bitácoras de Preparación)**:
   - Add `PUT /api/recipes/:id` to `backend/server.js` with authentication & ownership check.
   - Add an **Editar** action and edit modal in `frontend/src/components/BrewHistory.jsx` allowing quick modification of extraction parameters:
     - Method (`method`)
     - Grind (`grind`)
     - Ratio (`ratio`)
     - Brew time (`brew_time`)
     - Temperature (`temperature`)
     - Sensory balance, body, extraction (`sensory_balance`, `sensory_body`, `sensory_extraction`)
     - Notes (`notes`)
     - Rating (`rating`)
     - Dose in / out (`dose_in_g`, `dose_out_g`)

---

## 2. Minimalist Card Architecture (`cardGenerator.js`)

### 2.1 Elimination of Image Assets
- Strip `drawHeroAsset` calls from:
  - `renderBlueprintBeanCard` & `renderBlueprintCard`
  - `renderNeobrutalistBeanCard` & `renderNeobrutalistCard`
  - `renderAuroraBeanCard` & `renderAuroraCard`
  - `renderHangtagBeanCard` & `renderHangtagCard`
  - `generateCoffeeMenuCardImage` (all 4 styles)
- Replace `drawMetricAsset` in recipe cards with crisp, aligned typographic labels and vector hairlines or symbols.

### 2.2 Rebalanced Layouts by Style

#### A. Blueprint (Cyanotype / Engineering Schematic)
- **Background**: Deep blueprint navy `#021C33` with subtle coordinate grid.
- **Header**: Technical schematic header with drawing registration `#BT-REC-XXXX` and monospace date.
- **Hero Area (Replaced)**: Instead of the PNG coffee bean illustration, an architectural title block featuring the Coffee Name in bold technical uppercase, Origin, Roaster, and a sleek vector extraction gauge or dimension line.
- **Metric Grid (4 tiles)**: 
  - Molienda, Ratio, Tiempo, Temperatura.
  - Formatted with small-caps labels, large cyan values, and subtle 1px border frames.
- **Sensory & Terroir**: Monospace flavor tags enclosed in discrete cyan outline pills.

#### B. Neo-Brutalist (Tokyo/Berlin Specialty Roastery)
- **Background**: High-contrast cream/ivory `#FDFBF7` or light grey `#F0F4F8` with solid 2.5px `#111111` borders.
- **Title Block**: Punchy, bold black grotesque headline for the coffee name, paired with an acid lime `#D8FF3E` pill tag for process/origin.
- **Parameters**: High-contrast bento cells with solid offset shadows (+3px, +3px), bold tabular numbers, and clean label headers.
- **Sensory**: Bold, outlined flavor sticker pills.

#### C. Aurora (Holographic Dark Glass)
- **Background**: Obsidian dark `#0D0E12` with subtle violet/cyan radial atmospheric glow.
- **Title Block**: Crisp white geometric sans-serif title with soft ambient underglow, glowing variety/terroir badge.
- **Parameters**: 4 translucent frosted glass tiles with 1px border highlight (`rgba(255, 255, 255, 0.12)`) and gradient accents.
- **Sensory**: Glowing translucent glass pills with discrete pastel text.

#### D. Hangtag / Editorial Atelier (Sey / Tim Wendelboe Style)
- **Background**: Warm ivory cotton paper `#FAF8F5` with fine hairlines (`#E5E0D8`).
- **Header**: Elegant centered micro-header: `BEANTAG ATELIER // ARCHIVO DE ESPECIALIDAD`.
- **Title Block**: Prominent coffee title in refined Editorial Serif (`Playfair Display`, `Cinzel`, `Georgia`), origin & roaster in subtle italic sans.
- **Parameters**: Clean 2x2 or 4x1 ledger divided only by hairline rules (no boxy borders), elegant proportions.
- **Sensory**: Refined terracotta/amber tinted pills (`rgba(120, 53, 15, 0.06)`).

---

## 3. Brew Log Editing Architecture

### 3.1 Backend: `PUT /api/recipes/:id`
- **Location**: `backend/server.js`
- **Security**:
  - Requires valid session or token.
  - Queries `recipes r JOIN batches b ON r.batch_id = b.id WHERE r.id = ?`.
  - Checks `if (recipe.user_id !== null && (!req.user || req.user.id !== recipe.user_id)) => 403 Forbidden`.
- **Updatable fields**:
  - `method` (text, required)
  - `ratio` (text)
  - `grind` (text)
  - `temperature` (text)
  - `brew_time` (text)
  - `rating` (integer/float)
  - `notes` (text)
  - `sensory_balance` (text)
  - `sensory_body` (text)
  - `sensory_extraction` (text)
  - `dose_in_g` (real)
  - `dose_out_g` (real)
  - `espresso_pressure` (real)
  - `espresso_preinfusion` (real)
- **Response**: `{ success: true, recipe: { ... } }` with updated recipe details.

### 3.2 Frontend: `BrewHistory.jsx`
- **Detail View Modal**:
  - Add "Editar" button with `Edit3` / `Pencil` icon next to "Eliminar" and "Exportar Ticket".
- **Edit Modal Component / State**:
  - `editingRecipe`: recipe object being edited (null when closed).
  - Pre-populated form inputs:
    - Método: text/select (V60, Espresso, AeroPress, Prensa Francesa, Kalita, Chemex, etc.)
    - Molienda: text input (e.g. `J-Max: 2.4.0` or `Media`)
    - Ratio: text input (e.g. `1:16`)
    - Tiempo: text input (e.g. `2:45`)
    - Temperatura: text input (e.g. `93°C`)
    - Dosis In / Out: number inputs
    - Sensorial:
      - Balance selector / pills (e.g., 'Acidez marcada', 'Equilibrado', 'Dulzor predominante', 'Amargor suave')
      - Cuerpo selector / pills ('Sedoso', 'Ligero', 'Medio', 'Jugoso', 'Cremoso', 'Pesado')
      - Extracción toggle buttons ('Sub', 'En Punto', 'Sobre')
    - Notas personales: textarea
  - Action buttons: "Cancelar" and "Guardar Cambios".
- **State Synchronization**:
  - On save success, update `history` array immutably.
  - Update `selectedRecipe` with the edited values so the detail view immediately reflects changes.
  - Show confirmation toast.

---

## 4. Verification Plan

1. **Automated Verification**:
   - `npm run test:cards`: verify all 8 card configurations + 4 menu card variants render without throwing errors and produce valid images.
   - `npm run build`: compile frontend bundle cleanly (0 errors).
2. **Backend API Verification**:
   - Test `PUT /api/recipes/:id` with valid payload and verify SQLite update.
   - Test authentication check (reject unauthorized edit).
3. **Manual Verification**:
   - Open Brew History, click recipe detail -> verify new "Editar" button.
   - Open Edit modal, change parameters (e.g., grind, time, notes, sensory balance) -> Save -> verify instant UI update.
   - Open Export Ticket for each of the 4 styles -> verify clean minimalist image-free rendering with crisp typography.
