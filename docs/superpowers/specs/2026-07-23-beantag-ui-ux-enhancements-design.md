# Spec: BeanTag UI/UX Enhancements

**Date:** 2026-07-23  
**Status:** Approved  
**Target Project:** BeanTag Specialty Coffee Web App

---

## Executive Summary
This document specifies four key UI/UX enhancements for the BeanTag Specialty Coffee application to improve sensory visualization, coffee brewing workflow, theme accessibility, and grinder particle calibration.

---

## Detailed Specifications

### 1. SCA Flavor Wheel Color Chips (`src/utils/scaIcons.jsx`)
- **Purpose:** Automatically colorize sensory cupping notes based on official Specialty Coffee Association (SCA) flavor wheel categories.
- **Color Mapping Engine:**
  - **Fruity / Berries** (*fresa, cereza, frambuesa, mora, arándano*) -> Background `#FFF5F5`, Border `#E53E3E`, Text `#C53030`
  - **Citrus / Bright** (*limón, naranja, bergamota, pomelo, mandarina*) -> Background `#FFFAF0`, Border `#DD6B20`, Text `#C05621`
  - **Floral** (*jazmín, flor de azahar, rosa, lavanda*) -> Background `#FAF5FF`, Border `#805AD5`, Text `#6B46C1`
  - **Sweet / Chocolate** (*cacao, chocolate, caramelo, miel, panela, vainilla*) -> Background `#FDF6E2`, Border `#795548`, Text `#4E342E`
  - **Nutty / Spices** (*avellana, nuez, almendra, canela, clavo*) -> Background `#FEFCBF`, Border `#D69E2E`, Text `#B7791F`
  - **Fermented / Winey** (*anaeróbico, vino, ron, maceración*) -> Background `#FFF5F7`, Border `#9B2C2C`, Text `#742A2A`
- **Application Locations:**
  - Inventory coffee batch cards (`Inventory.jsx`, `BatchInfo.jsx`)
  - Recipe history & sensory evaluation (`BrewHistory.jsx`)
  - Share modal preview

---

### 2. Quick Repeat Recipe Button ("Repetir Última Receta")
- **Purpose:** Allow 1-click duplication of the last successful extraction parameters for a given coffee batch.
- **Workflow:**
  - In `Inventory.jsx` and `BatchDetail.jsx`, inspect if `batch.recipes` contains at least 1 entry.
  - Render a prominent Neobrutalist button: `⚡ Repetir Última Receta (#1 V60 • 18g • 1:15)`.
  - Clicking pre-populates `RecipeForm` with:
    - `method`
    - `ratioVal`
    - `doseInG`
    - `waterTemp`
    - `jmaxRot`, `jmaxNum`, `jmaxClick`
    - `sensoryBalance`, `sensoryBody`, `sensoryExtraction`

---

### 3. "Espresso Roast" Dark Theme (`src/index.css`)
- **Purpose:** Provide a dedicated dark mode tailored for early morning or low-light coffee brewing.
- **CSS Color Token Overrides (`.theme-espresso`):**
  - `--bg-canvas`: `#120A08` (Dark roasted coffee bean background)
  - `--bg-card`: `#1E1412` (Dark chocolate paper card)
  - `--color-text`: `#F5EBE6` (Creamy milk foam white)
  - `--color-text-muted`: `#A0AEC0`
  - `--border-color`: `#000000` (Pitch black neobrutalist borders)
  - `--color-crimson`: `#FF5722` (Warm amber flame crimson)
- **UI Toggle:** Persistent theme button in the header/navbar (`☀️ Claro` / `☕ Espresso Roast`).

---

### 4. Interactive J-Max Grinder Dial Widget (`src/components/RecipeForm.jsx`)
- **Purpose:** Provide an intuitive step-by-step dial interface for 1Zpresso J-Max grinder particle size calibration.
- **Features:**
  - **Rotations Selector (0..4)**: Stepped pill buttons.
  - **Numbers Selector (0..8)**: Stepped pill buttons.
  - **Clicks Selector (0..9)**: Stepped pill buttons.
  - **Real-Time Particle Indicator:** Computes `~XXX µm` (Microns) with a visual spectrum bar:
    - `< 300 µm`: Espresso Fine ☕
    - `600 - 850 µm`: Filter Medium 💧
    - `> 900 µm`: French Press Coarse 🫖

---

## Verification Criteria
- All 4 features pass compilation with 0 errors (`npm run build`).
- App runs live via PM2 on `http://5.189.152.68/beantag/`.
- Tested and verified.
