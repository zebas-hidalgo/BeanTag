# Design Specification: Minimalist Theme ("Studio Minimal"), Swiss Tube Racks Redesign & Performance Optimization

## 1. Overview & Context

This design specification addresses three interconnected improvements identified during the BeanTag application audit:
1. **Tube Racks Visual Redesign:** Replacing the crowded skeuomorphic wooden cap and gradient fluid rendering with an artisanal, ultra-clean "Swiss Tube" laboratory capsule aesthetic.
2. **Global Minimalist Theme ("Studio Minimal"):** Providing a monochrome, distraction-free aesthetic with high-contrast typography, hairline borders, and neutral canvas, complemented by a new "Studio Mono" exportable recipe/bean card style in the canvas generator.
3. **Frontend Performance Optimization (Code Splitting):** Eliminating the monolithic 648 kB initial bundle warning by dynamically code-splitting heavy secondary views and modals (`BrewGuideModal`, `TubeRacksView`, `Settings`, `BatchCreator`, `BrewHistory`) via `React.lazy()` and `Suspense`.

---

## 2. Architecture & Design Details

### 2.1 Component 1: Swiss Tube Racks Redesign (`frontend/src/components/TubeRacksView.jsx`)

#### Current Issues
- Heavy brown wooden cap (`#8B5A2B`) with dropshadow.
- Jarring gradient fills inside a 36px tube.
- Overcrowded micro-pills (`8.5px` and `9px` fonts) beneath the tube creating visual dissonance in a 2-column mobile grid.

#### New Visual Specification
- **Tube Cylinder Geometry:**
  - Width: `32px`, Height: `56px`.
  - Border: `1.5px solid var(--color-text, #1E293B)`, base radius `0 0 14px 14px`, top border open or closed with hairline border.
  - Background: Neutral translucent fill (`rgba(0, 0, 0, 0.02)` in light mode, `rgba(255, 255, 255, 0.03)` in dark/studio mode).
  - No wooden cap.
- **Micro Roast Indicator:**
  - Discrete 6px circular dot positioned in the top-right corner of the slot:
    - Light Roast (`Claro`): Amber `#D97706`
    - Medium Roast (`Medio`): Roasted Caramel `#B45309`
    - Dark Roast (`Oscuro`): Slate Graphite `#475569`
- **Dose Weight:**
  - Centered at the base of the cylinder with mono typography: `18.5g`, font size `11px`, weight `800`, font family `var(--font-mono)`.
- **Freeze Badge:**
  - If `freeze_date` is present, display subtle snowflake `❄️` indicator in top-left without layout distortion.
- **Coffee Metadata (Below Tube):**
  - **Batch Name:** Clean 12px, weight `800`, single-line truncated with ellipsis (`whiteSpace: 'nowrap'`, `overflow: 'hidden'`).
  - **Origin & Process:** Single subdued secondary line (`"Colombia • Lavado"`), 10px, weight `600`, color `var(--color-text-muted)`.
- **Empty Slot State:**
  - Dashed cylinder outline: `border: 1.5px dashed var(--border-color)`.
  - Subtle `+` icon centered.
  - Caption: `#0X Libre` in muted 10px text.

---

### 2.2 Component 2: Global Minimalist Theme ("Studio Minimal")

#### Design Tokens (`frontend/src/index.css`)
Activated via root attribute `[data-theme="studio"]`:
- `--bg-canvas`: `#F8F9FA` (pure soft matte white-gray)
- `--bg-card`: `#FFFFFF`
- `--border-color`: `rgba(0, 0, 0, 0.08)` (hairline 1px borders)
- `--color-crimson`: `#18181B` (replaces saturated terracotta with Swiss Bauhaus matte black for primary action buttons)
- `--color-text`: `#09090B` (crisp deep black)
- `--color-text-muted`: `#71717A` (balanced neutral zinc)
- `--card-shadow`: `0 1px 2px rgba(0, 0, 0, 0.04)` (flatter, shadowless look)
- `--segmented-bg`: `rgba(0, 0, 0, 0.05)`
- `--segmented-active`: `#FFFFFF`

#### Theme Management & Settings UI (`frontend/src/components/Settings.jsx`)
- New setting stored in `localStorage.getItem('beantag-theme')` defaulting to `'classic'`.
- Segmented selector control in *Ajustes*:
  `[ ☕ BeanTag Clásico (Terracotta) ]` | `[ 📐 Studio Minimal (Monocromo) ]`
- Dynamic sync: Immediately applies `document.documentElement.setAttribute('data-theme', theme)` and emits `beantag-theme-changed` window event.

#### Canvas Card Generator Style: "Studio Mono" (`frontend/src/utils/cardGenerator.js`)
- Add 5th card style: `studio` alongside `blueprint`, `neobrutalist`, `diner`, `kissaten`.
- Background: `#FBFBFB` matte linen canvas.
- Typography: Swiss editorial layout, asymmetric grid with bold header labels and clean mono tabular numbers for ratio, grind microns, and pours.
- Verification: Tested and passing across headless canvas test suite (`verify_cards_render.mjs`).

---

### 2.3 Component 3: Performance Optimization & Code Splitting (`frontend/src/App.jsx`)

#### Dynamic Code Splitting
Replace static imports of heavy modals and secondary views with `React.lazy()`:
- `const BrewGuideModal = lazy(() => import('./components/BrewGuideModal'));`
- `const TubeRacksView = lazy(() => import('./components/TubeRacksView'));`
- `const Settings = lazy(() => import('./components/Settings'));`
- `const BrewHistory = lazy(() => import('./components/BrewHistory'));`
- `const BatchCreator = lazy(() => import('./components/BatchCreator'));`

#### Suspense Fallback
- Lightweight minimalist loading indicator (`Suspense fallback={<div className="view-loading-skeleton" />}`) ensuring Cumulative Layout Shift (`CLS = 0`) and instant transition.

#### Target Metrics
- Reduce initial bundle from 648 kB to `< 380 kB`.
- Eliminate Vite production build warning `Some chunks are larger than 500 kB`.

---

## 3. Verification & Testing Strategy

1. **Frontend Compilation & Bundle Size:**
   - Run `npm run build-frontend`.
   - Confirm Vite compiles without chunks > 500 kB warnings.
2. **Headless Card Generator Verification:**
   - Run `npm run test:cards`.
   - All existing 32 variants + new studio variants render with 100% pass rate.
3. **Backend API Regression:**
   - Run `node scripts/test_tube_racks_api.js` (12/12 pass).
   - Run `node scripts/test_groq_integration.js` (8/8 pass).
   - Run `node scripts/test_ai_resilience.js` (4/4 pass).
4. **VPS Production Deployment:**
   - Git push and automated deploy to Zerker VPS.
   - Live verification of HTTP 200 and visual verification.
