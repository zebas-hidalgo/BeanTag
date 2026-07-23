# Spec: BeanTag 5 Fantasy Themes System

**Date:** 2026-07-23  
**Status:** Approved  
**Target Project:** BeanTag Specialty Coffee Web App

---

## Executive Summary
This document specifies the implementation of a 5-theme fantasy palette selection system for BeanTag. Users can select and persist their favorite fantasy theme from the Settings screen (`Settings.jsx`), updating all CSS custom properties across the application in real-time.

---

## Detailed Specifications

### Theme Definitions (`src/index.css`)

1. **Default Theme (Mocha Sky):**
   - `--bg-canvas`: `#CAE7F7`
   - `--bg-card`: `#FFFFFF`
   - `--color-crimson`: `#F94C00`
   - `--color-text`: `#48261D`
   - `--color-text-muted`: `#765C58`

2. **Sakura Bloom V60 (`data-theme="sakura"`):**
   - `--bg-canvas`: `#FCE4EC`
   - `--bg-card`: `#FFFFFF`
   - `--color-crimson`: `#EC4899`
   - `--color-text`: `#4A154B`
   - `--color-text-muted`: `#8338EC`

3. **Matcha Tonic Ritual (`data-theme="matcha"`):**
   - `--bg-canvas`: `#E8F5E9`
   - `--bg-card`: `#FFFFFF`
   - `--color-crimson`: `#2E7D32`
   - `--color-text`: `#1B4332`
   - `--color-text-muted`: `#40916C`

4. **Cyberpunk Geisha 2077 (`data-theme="cyberpunk"`):**
   - `--bg-canvas`: `#E0F7FA`
   - `--bg-card`: `#FFFFFF`
   - `--color-crimson`: `#9C27B0`
   - `--color-text`: `#102A43`
   - `--color-text-muted`: `#334E68`

5. **Café Miel de Brujas (`data-theme="miel"`):**
   - `--bg-canvas`: `#FFF8E1`
   - `--bg-card`: `#FFFFFF`
   - `--color-crimson`: `#F59E0B`
   - `--color-text`: `#4A2C11`
   - `--color-text-muted`: `#784212`

6. **Cold Brew Velvet Nightmare (`data-theme="velvet"`):**
   - `--bg-canvas`: `#F3E5F5`
   - `--bg-card`: `#FFFFFF`
   - `--color-crimson`: `#8E24AA`
   - `--color-text`: `#3B1046`
   - `--color-text-muted`: `#6A1B9A`

---

## Component Integration

### `App.jsx`
- Manage `theme` state (`'default'`, `'sakura'`, `'matcha'`, `'cyberpunk'`, `'miel'`, `'velvet'`), initialized from `localStorage.getItem('beantag-theme') || 'default'`.
- Synchronize theme state to `document.documentElement.setAttribute('data-theme', theme)` in a `useEffect`.
- Pass `theme` and `setTheme` to `<Settings theme={theme} setTheme={setTheme} showToast={showToast} />`.

### `Settings.jsx`
- Render a Neobrutalist theme selector grid with 6 options (Default + 5 Fantasy Themes).
- Active theme chip highlights with `--color-crimson` background and white text.
- Clicking a theme button invokes `setTheme(themeId)` and shows a toast notification (`"Tema visual aplicado con éxito."`).

---

## Verification Criteria
- `npm run build` compiles clean with 0 errors.
- Theme switching updates `--bg-canvas`, `--color-crimson`, and `--color-text` instantly.
- Theme preference persists across page reloads via `localStorage`.
- Live PM2 deployment verified.
