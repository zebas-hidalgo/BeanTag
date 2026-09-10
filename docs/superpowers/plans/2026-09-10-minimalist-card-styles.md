# 3 Minimalist Card Styles & View Selector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide 3 distinct minimalist card layouts (Editorial Nordic, Cupertino Linear List, and Tokyo Archive) in the inventory, switchable via an interactive segmented controller, with zero jumpy scale/hover animations.

**Architecture:** Add CSS styling and tokens for the 3 visual variants in `index.css`. In `Inventory.jsx`, introduce `cardStyle` state with `localStorage` persistence and render the corresponding card component variant based on active selection. Maintain full compatibility with batch selection and quick action menus.

**Tech Stack:** React, CSS Variables, Lucide Icons, Vite, SQLite/Express backend.

---

### Task 1: CSS Refactoring & Variant Styling in `index.css`

- [ ] Remove `transform: translateY(-2px)` and `transform: scale(0.985)` from `.candy-card` to eliminate mobile scroll jitter.
- [ ] Add `.inventory-view-selector` segmented control styles.
- [ ] Add `.card-editorial` styles (Nordic Atelier: clean flat layout, hairline borders, muted chips, subtle capsule stock).
- [ ] Add `.card-linear-row` styles (Cupertino / Linear: compact 52px horizontal row, left coffee info, right tubes badge and chevron).
- [ ] Add `.card-archive` styles (Tokyo Coffee Lab: technical indexed card `#01`, monospace grid specs, terracotta accent).
- [ ] Desaturate SCA chips for a calm, aesthetic look.

### Task 2: Implement View Switcher and 3 Card Variants in `Inventory.jsx`

- [ ] Add `cardStyle` state initialized from `localStorage.getItem('beantag-inventory-style') || 'editorial'`.
- [ ] Add handler to persist `cardStyle` and trigger haptic pulse (`navigator.vibrate(8)`).
- [ ] Render the segmented view switcher `[ 🏷️ Editorial ] [ 📋 Lista ] [ 📐 Archivo ]` in the inventory control bar.
- [ ] Implement `renderEditorialCard(batch, index)`.
- [ ] Implement `renderListRow(batch, index)`.
- [ ] Implement `renderArchiveCard(batch, index)`.
- [ ] Ensure all 3 variants support clicking to open batch details, quick action options (`•••`), and low-stock indicators.

### Task 3: Build, Verify and Deploy

- [ ] Run `npm run build` in `frontend` to verify 0 syntax and build errors.
- [ ] Commit all changes and push to `origin main`.
- [ ] Deploy to VPS via Zerker script (`git pull`, `build-frontend`, `pm2 restart beantag`).
- [ ] Verify HTTP 200 and test all 3 views on live production URL.

