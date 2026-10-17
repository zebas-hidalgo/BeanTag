# Precision Coffee Lab & Liquid Glass UI/UX Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevate BeanTag's visual polish across all themes (`Classic`, `Studio Minimal`, `OLED Dark`) with Liquid Glass surfaces, universal WCAG AA contrast tokens, unified Inventory search/filtering, elevated editorial cards, and 100% vector Lucide iconography.

**Architecture:** We update the CSS custom property foundation in `frontend/src/index.css` (`--barista-on-accent`, `.app-header`, `.card-editorial`, `.btn-candy.primary`), upgrade the global shell (`frontend/src/App.jsx`, `frontend/src/components/BottomNav.jsx`) to use theme-adaptive vector emblems and Liquid Glass floating navigation, streamline the Inventory screen (`frontend/src/components/Inventory.jsx`) by fixing the missing `Share2` import, adding a search input with icon + clear button, and merging the status filter with the batch counter, and replace structural emojis in `TubeRacksView.jsx` and `Settings.jsx` with Lucide SVG icons.

**Tech Stack:** React 18, Vite 5, CSS3 Custom Properties, Lucide React SVG Icons.

---

### Task 1: Semantic Contrast Tokens, Liquid Glass Surfaces & Card Polish in `frontend/src/index.css`

**Files:**
- Modify: `frontend/src/index.css`

- [ ] **Step 1: Add `--barista-on-accent` across `:root`, `[data-theme="studio"]`, and dark mode blocks**
  - In `:root`, set `--barista-on-accent: #FFFFFF;`.
  - In `[data-theme="studio"]`, set `--barista-on-accent: #FFFFFF;`, `--barista-accent-honey-bg: #F4F4F5;`, `--barista-accent-honey-text: #18181B;`, `--barista-instr-border: #E4E4E7;`.
  - In `@media (prefers-color-scheme: dark)` and `[data-theme="dark"]`, set `--barista-on-accent: #09090B;`.

- [ ] **Step 2: Refine `.app-header`, `.card-editorial`, and `.btn-candy.primary`**
  - Update `.app-header` to use `backdrop-filter: blur(20px) saturate(180%)` and `-webkit-backdrop-filter: blur(20px) saturate(180%)`.
  - Update `.card-editorial` with refined border, subtle elevation transition (`transition: transform 180ms var(--transition-spring), box-shadow 180ms ease, border-color 180ms ease`), hover lift (`transform: translateY(-1px)`), and active press state (`transform: scale(0.992)`).
  - Update `.btn-candy.primary` to use `color: var(--barista-on-accent, #FFFFFF);` instead of hardcoded `#000000`.

- [ ] **Step 3: Build frontend to verify CSS syntax**
  - Run: `npm run build-frontend`

- [ ] **Step 4: Commit**
  - `git add frontend/src/index.css && git commit -m "style(tokens): add universal contrast tokens, liquid glass header, and editorial card micro-interactions"`

---

### Task 2: Adaptive Vector Header & Liquid Glass Floating Dock (`App.jsx` & `BottomNav.jsx`)

**Files:**
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/components/BottomNav.jsx`

- [ ] **Step 1: Upgrade Header emblem and controls in `frontend/src/App.jsx`**
  - Replace the hardcoded black-stroked SVG in `<header className="app-header">` with a sleek `34×34px` rounded squircle emblem that adapts to `var(--color-crimson)` and `var(--color-text)`, paired with the `BeanTag` title and a subtle `CELLAR LAB` mono subtitle.
  - Refine user avatar pill and NFC button for visual harmony and consistent `36px` interactive height.

- [ ] **Step 2: Upgrade `frontend/src/components/BottomNav.jsx` to Liquid Glass Dock**
  - Apply `backdropFilter: 'blur(20px) saturate(180%)'` and `WebkitBackdropFilter: 'blur(20px) saturate(180%)'`.
  - Remove layout-shifting `transform: isActive ? 'scale(1.04)' : 'scale(1)'`.
  - Add a subtle `4px` top active pill indicator and crisp color contrast (`var(--color-crimson)`) for the active tab across all themes.

- [ ] **Step 3: Verify build**
  - Run: `npm run build-frontend`

- [ ] **Step 4: Commit**
  - `git add frontend/src/App.jsx frontend/src/components/BottomNav.jsx && git commit -m "feat(ui): upgrade Header with theme-adaptive vector emblem and Liquid Glass BottomNav"`

---

### Task 3: Unified Inventory Search, Compact Status Bar & Elevated Editorial Cards (`Inventory.jsx`)

**Files:**
- Modify: `frontend/src/components/Inventory.jsx`

- [ ] **Step 1: Fix missing `Share2` import and add `AlertTriangle` from `lucide-react`**
  - Import `Share2` and `AlertTriangle` in `frontend/src/components/Inventory.jsx`.

- [ ] **Step 2: Implement Search Input with leading `SearchIcon` and trailing clear (`X`) button**
  - Wrap the search `<input>` in a relative container with `<SearchIcon size={16} />` on the left and a clear `<button>` with `<X size={14} />` when `searchQuery.length > 0`.

- [ ] **Step 3: Merge Status Filter (`En Congelador` / `Agotados`) and Batch Counter into a single compact toolbar row**
  - Display the batch counter on the left (`N Lotes en bodega`) and a sleek segmented pill toggle (`Congelador (N)` / `Agotados (N)`) on the right.

- [ ] **Step 4: Elevate `.card-editorial` cards and context menu**
  - Add a `7px` roast-level indicator dot next to the coffee name (`#D97706` Claro, `#B45309` Medio, `#475569` Oscuro).
  - Use semantic tokens (`var(--barista-instr-border)`) for the roaster badge.
  - Format the stock counter inside a subtle pill badge with `<AlertTriangle size={12} />` for low stock instead of `⚠`.
  - Replace `✕ Cancelar` in the context menu with `<X size={14} /> Cancelar`.

- [ ] **Step 5: Verify build**
  - Run: `npm run build-frontend`

- [ ] **Step 6: Commit**
  - `git add frontend/src/components/Inventory.jsx && git commit -m "feat(inventory): unify search and filter bar, elevate editorial cards, and fix Share2 import"`

---

### Task 4: Vector Iconography Polish in `TubeRacksView.jsx` & `Settings.jsx`

**Files:**
- Modify: `frontend/src/components/TubeRacksView.jsx`
- Modify: `frontend/src/components/Settings.jsx`

- [ ] **Step 1: Replace structural emojis in `TubeRacksView.jsx`**
  - Import `FlaskConical` from `lucide-react`.
  - Replace `🧪 Portatubos (2×3)` with `<FlaskConical size={18} color="var(--barista-accent-honey)" />` next to `Portatubos (2×3)`.
  - Replace the raw `❄️` cryo span inside occupied tube slots with `<Snowflake size={11} color="#0284C7" strokeWidth={2.5} />`.

- [ ] **Step 2: Replace structural emojis in `Settings.jsx` segmented controls**
  - Replace `☕ BeanTag Clásico (Terracotta)` and `📐 Studio Minimal (Monocromo)` with Lucide `<Coffee size={14} />` and `<Compass size={14} />` (or `<Layers size={14} />`).
  - Replace `⚡ Groq (Llama 3.3 / GPT-OSS)` and `🧠 Google Gemini` with Lucide `<Zap size={14} />` and `<Cpu size={14} />`.

- [ ] **Step 3: Run full verification suite**
  - Run: `npm run test:cards && node scripts/test_groq_integration.js && node scripts/test_ai_resilience.js && node scripts/test_tube_racks_api.js`

- [ ] **Step 4: Commit and deploy to Zerker VPS**
  - `git add frontend/src/components/TubeRacksView.jsx frontend/src/components/Settings.jsx && git commit -m "style(icons): replace structural emojis with Lucide vector icons in TubeRacksView and Settings"`
