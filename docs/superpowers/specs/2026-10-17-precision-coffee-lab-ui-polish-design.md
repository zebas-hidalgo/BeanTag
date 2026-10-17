# Precision Coffee Lab & Liquid Glass UI/UX Polish — Design Specification

**Date:** 2026-10-17  
**Project:** BeanTag  
**Design System Reference:** `ui-ux-pro-max` (Minimal Single Column + Liquid Glass + Vector-Only Iconography + WCAG AA Contrast)

---

## 1. Objectives & Problem Statement

Based on a comprehensive UI/UX audit using `ui-ux-pro-max`, the following visual and interaction issues were identified across BeanTag:
1. **Runtime Crash in Context Menu (`Inventory.jsx#L443`):** `<Share2 size={15} />` is rendered inside the quick-action context menu without being imported from `lucide-react`.
2. **Theme Contrast Failures (`index.css`, `App.jsx`):**
   - `.btn-candy.primary` hardcodes `color: #000000` over `var(--barista-accent-honey)`. In `[data-theme="studio"]`, `--barista-accent-honey` is `#27272A` (dark charcoal), yielding an illegible ~1.4:1 contrast ratio.
   - The Header SVG emblem in `App.jsx` uses hardcoded `stroke="#000000"`, becoming invisible against the `#000000` header in OLED Dark Mode.
   - Roaster badges in `Inventory.jsx` use hardcoded `#FDE68A` borders and `#D97706` icons instead of semantic theme tokens.
3. **Vertical Clutter in Inventory (`Inventory.jsx`):**
   - Two full-width segmented controls (`Lotes / Portatubos` and `En Congelador / Agotados`) stacked with a plain search input consume ~190px of vertical viewport before the first coffee card appears.
   - `SearchIcon` is imported in `Inventory.jsx` but unused; the search bar lacks both a leading search icon and a trailing clear (`X`) button.
4. **Structural Emojis (`Inventory.jsx`, `TubeRacksView.jsx`, `Settings.jsx`):**
   - Raw emojis (`🧪`, `❄️`, `⚠`, `✕`, `☕`, `📐`, `⚡`, `🧠`) are used in navigation controls, status badges, and headers instead of crisp, theme-aware Lucide SVG icons.

---

## 2. Design Architecture

### 2.1 Semantic Theme Tokens & Liquid Glass Surfaces (`frontend/src/index.css`)
- Introduce `--barista-on-accent`:
  - `:root` (Classic): `#FFFFFF`
  - `[data-theme="studio"]`: `#FFFFFF`
  - Dark mode (`@media (prefers-color-scheme: dark)` & `[data-theme="dark"]`): `#09090B`
- Update `.btn-candy.primary` to use `color: var(--barista-on-accent, #FFFFFF)` and refined elevation transitions (`180ms cubic-bezier(0.32, 0.72, 0, 1)`).
- Enhance `.app-header` and `.card-editorial` with subtle inner highlights, smooth hover/press states, and `backdrop-filter: blur(20px) saturate(180%)`.

### 2.2 Adaptive Precision Header & Liquid Glass Bottom Dock (`frontend/src/App.jsx`, `frontend/src/components/BottomNav.jsx`)
- **Header (`App.jsx`):**
  - Replace the cartoon black-stroked SVG with a sleek vector emblem inside a `34×34px` rounded squircle (`border-radius: 10px`) using `var(--barista-bg-elevated)` and `var(--color-crimson)` / `var(--color-text)` strokes so it remains crisp across Classic, Studio Minimal, and OLED Dark modes.
  - Pair the brand title (`BeanTag`) with a subtle mono subtitle badge (`CELLAR LAB`).
  - Standardize the user profile pill and NFC trigger button with consistent `36px` height, `1px solid var(--border-color)`, and smooth press states.
- **BottomNav (`BottomNav.jsx`):**
  - Upgrade to a true **Liquid Glass** floating dock (`backdrop-filter: blur(20px) saturate(180%)`).
  - Remove layout-shifting `transform: scale(1.04)` on active tabs; instead, use a smooth pill background, `var(--color-crimson)` active icon/label tint, and a `4px` top active indicator dot.

### 2.3 Unified Inventory Toolbar & Elevated Editorial Cards (`frontend/src/components/Inventory.jsx`)
- **Import Fix:** Add `Share2` and `AlertTriangle` to the `lucide-react` import list.
- **Search Input with Leading Icon & Clear Button:**
  - Wrap the search input in a relative container with a leading `<SearchIcon size={16} />` and a trailing `<button>` with `<X size={14} />` when `searchQuery` is non-empty.
- **Compact Status Filter + Counter Bar:**
  - Combine the batch counter (`N Lotes en bodega`) and the status filter (`En Congelador` / `Agotados`) into a single horizontal bar between the search input and the card list, saving ~60px of vertical height.
- **Elevated `.card-editorial` Cards:**
  - Add a `6px` roast-level indicator dot (`#D97706` Claro, `#B45309` Medio, `#475569` Oscuro) next to the coffee title.
  - Style the roaster badge using semantic tokens (`var(--barista-accent-honey-bg)`, `var(--barista-accent-honey-text)`, `var(--barista-instr-border)`).
  - Replace raw `⚠` and `✕` characters with `<AlertTriangle size={13} />` and `<X size={15} />`.
  - Format the stock capsule in a clean pill (`background: var(--barista-bg-elevated)`) with tabular mono numerals.

### 2.4 Vector Iconography Polish in Tube Racks & Settings (`frontend/src/components/TubeRacksView.jsx`, `frontend/src/components/Settings.jsx`)
- **`TubeRacksView.jsx`:**
  - Replace raw `🧪` in the header and `❄️` cryo badge in tube slots with Lucide `<FlaskConical size={18} />` and `<Snowflake size={11} />`.
- **`Settings.jsx`:**
  - Replace raw emojis (`☕`, `📐`, `⚡`, `🧠`) in the Theme Switcher and AI Provider segmented controls with Lucide vector icons (`Coffee`, `Compass`, `Zap`, `Cpu`) aligned to the text baseline.

---

## 3. Verification Criteria
1. `npm run build-frontend` compiles with 0 errors and 0 warnings.
2. `npm run test:cards` passes all 40/40 card and sticker rendering tests.
3. Automated backend & API test suites (`test_groq_integration.js`, `test_ai_resilience.js`, `test_tube_racks_api.js`) pass 100%.
4. No raw emojis remain in structural navigation/segmented buttons; `Share2` context menu opens without errors.
