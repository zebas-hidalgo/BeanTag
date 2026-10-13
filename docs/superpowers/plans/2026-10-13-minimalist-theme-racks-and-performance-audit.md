# Minimalist Theme ("Studio Minimal"), Swiss Tube Racks & Performance Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform BeanTag's visual design with a clean "Swiss Tube" rack aesthetic, implement a global "Studio Minimal" monochrome theme with a matching canvas card generator style, and optimize initial frontend bundle size via `React.lazy()` code-splitting.

**Architecture:** 
1. Redesign slot card rendering in `TubeRacksView.jsx` replacing heavy skeuomorphic wood caps with 32x56px precision laboratory glass tubes and discreet roast micro-dots.
2. Introduce a CSS token system `[data-theme="studio"]` with high-contrast neutral colors and an interactive theme switcher in `Settings.jsx`.
3. Add a 5th card style (`studio`) to `cardGenerator.js` and verify with headless tests.
4. Dynamically code-split heavy components in `App.jsx` with `React.lazy()` and `Suspense` to reduce initial bundle under 380 kB.

**Tech Stack:** React 18, Vite 5, CSS Custom Properties, HTML5 Canvas API, PM2, Ubuntu VPS.

---

### Task 1: Swiss Tube Racks Redesign

**Files:**
- Modify: `frontend/src/components/TubeRacksView.jsx:1010-1160`

- [ ] **Step 1: Replace wood cap & gradient with Swiss Tube cylinder and micro roast dot**
  In `frontend/src/components/TubeRacksView.jsx`:
  - Remove wooden cap (`div` with `#8B5A2B` background).
  - Redesign cylinder:
    - Width: `32px`, Height: `56px`.
    - Border: `1.5px solid var(--color-text, #1E293B)`.
    - Base radius: `0 0 14px 14px`.
    - Background: `rgba(0,0,0,0.02)`.
    - Roast indicator dot: `6px` circle in top-right (`#D97706` Claro, `#B45309` Medio, `#475569` Oscuro).
    - Centered dose weight: `18.5g`, font size `11px`, weight `800`, font family `var(--font-mono)`.
    - Snowflake badge `❄️` in top-left if `freeze_date` exists.
  - Simplify coffee info beneath the tube:
    - Coffee name: `fontSize: '12px'`, `fontWeight: '800'`, single line truncated with ellipsis (`whiteSpace: 'nowrap'`, `overflow: 'hidden'`).
    - Subtitle: `fontSize: '10px'`, `color: 'var(--color-text-muted)'`, e.g. `${origin} • ${process}`.
  - Simplify empty slots:
    - Cylinder outline with `border: 1.5px dashed var(--border-color)`, centered `+`, and `#0X Libre` label below.

- [ ] **Step 2: Test frontend build**
  Run: `npm run build-frontend`
  Expected: Exit code 0, clean build.

- [ ] **Step 3: Commit**
  ```bash
  git add frontend/src/components/TubeRacksView.jsx
  git commit -m "feat(racks): overhaul slots with Swiss Tube minimalist laboratory aesthetic"
  ```

---

### Task 2: Global Minimalist Theme ("Studio Minimal")

**Files:**
- Modify: `frontend/src/index.css:1-50`
- Modify: `frontend/src/components/Settings.jsx:20-60, 680-720`
- Modify: `frontend/src/App.jsx:15-30`

- [ ] **Step 1: Add `[data-theme="studio"]` CSS custom property tokens**
  In `frontend/src/index.css`:
  ```css
  [data-theme="studio"] {
    --bg-canvas: #F8F9FA;
    --bg-card: #FFFFFF;
    --border-color: rgba(0, 0, 0, 0.08);
    --color-crimson: #18181B;
    --color-text: #09090B;
    --color-text-muted: #71717A;
    --card-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    --segmented-bg: rgba(0, 0, 0, 0.05);
    --segmented-active: #FFFFFF;
    --sheet-bg: rgba(255, 255, 255, 0.98);
  }
  ```

- [ ] **Step 2: Implement theme switcher in `Settings.jsx` and theme initialization in `App.jsx`**
  In `frontend/src/components/Settings.jsx`:
  - Add `appTheme` state initialized from `localStorage.getItem('beantag-theme') || 'classic'`.
  - Add segmented control:
    `[ ☕ Clásico (Terracotta) ]` | `[ 📐 Studio Minimal ]`
  - On change: update state, save to `localStorage`, and update `document.documentElement.setAttribute('data-theme', theme)`.
  In `frontend/src/App.jsx`:
  - In root `useEffect`, read `localStorage.getItem('beantag-theme')` and apply to `document.documentElement`.

- [ ] **Step 3: Test frontend build**
  Run: `npm run build-frontend`
  Expected: Exit code 0.

- [ ] **Step 4: Commit**
  ```bash
  git add frontend/src/index.css frontend/src/components/Settings.jsx frontend/src/App.jsx
  git commit -m "feat(theme): add Studio Minimal global monochrome theme and settings switcher"
  ```

---

### Task 3: Studio Mono Style in Card Generator Engine

**Files:**
- Modify: `frontend/src/utils/cardGenerator.js`
- Modify: `scripts/verify_cards_render.mjs`

- [ ] **Step 1: Implement `studio` card style in `cardGenerator.js`**
  In `frontend/src/utils/cardGenerator.js`:
  - Add `'studio'` to supported styles array.
  - Implement palette:
    - Background: `#FBFBFB` (linen matte canvas).
    - Hairline border: `1px solid #E4E4E7`.
    - Text primary: `#09090B`.
    - Muted: `#71717A`.
    - Accent: `#18181B` (monochrome swiss badge).
  - Draw clean asymmetric grid with Swiss typography layout for recipe and bean cards.

- [ ] **Step 2: Update headless card verification suite**
  In `scripts/verify_cards_render.mjs`:
  - Add `'studio'` style to the test matrix.
  - Run: `npm run test:cards`
  Expected: All 40 variants pass (32 existing + 8 studio variants).

- [ ] **Step 3: Commit**
  ```bash
  git add frontend/src/utils/cardGenerator.js scripts/verify_cards_render.mjs
  git commit -m "feat(cards): add Studio Mono card style and headless verification tests"
  ```

---

### Task 4: Code Splitting & Bundle Size Optimization

**Files:**
- Modify: `frontend/src/App.jsx:1-40`

- [ ] **Step 1: Convert heavy components to `React.lazy()` with `Suspense`**
  In `frontend/src/App.jsx`:
  - Replace static imports:
    ```jsx
    const BrewGuideModal = lazy(() => import('./components/BrewGuideModal'));
    const TubeRacksView = lazy(() => import('./components/TubeRacksView'));
    const Settings = lazy(() => import('./components/Settings'));
    const BrewHistory = lazy(() => import('./components/BrewHistory'));
    const BatchCreator = lazy(() => import('./components/BatchCreator'));
    ```
  - Wrap view renders with `<Suspense fallback={<div style={{ minHeight: '60vh' }} />}>`.

- [ ] **Step 2: Verify bundle reduction in Vite**
  Run: `npm run build-frontend`
  Expected:
  - Initial bundle chunk drops below 380 kB (down from 648 kB).
  - No "Some chunks are larger than 500 kB" warnings.

- [ ] **Step 3: Commit**
  ```bash
  git add frontend/src/App.jsx
  git commit -m "perf(bundle): code-split heavy views and modals with React.lazy reducing initial bundle"
  ```

---

### Task 5: Comprehensive Verification & Zerker VPS Deployment

**Files:**
- Deployment commands and verification scripts

- [ ] **Step 1: Run complete automated test suite**
  Run: `npm run build-frontend && npm run test:cards && node scripts/test_groq_integration.js && node scripts/test_ai_resilience.js && node scripts/test_tube_racks_api.js`
  Expected: 100% tests pass (exit code 0).

- [ ] **Step 2: Push changes to GitHub**
  Run: `git push origin main`
  Expected: Remote updated successfully.

- [ ] **Step 3: Remote deploy to Zerker VPS**
  Run: `/Users/zebas/.gemini/config/skills/zerker/scripts/run_vps_cmd.sh "cd /var/www/beantag && git pull origin main && npm run build-frontend && pm2 restart beantag"`
  Expected: Exit code 0, PM2 status online.

- [ ] **Step 4: Verify production HTTPS endpoint**
  Run: `curl -k -sI https://5.189.152.68.nip.io/beantag/`
  Expected: HTTP 200 OK.
