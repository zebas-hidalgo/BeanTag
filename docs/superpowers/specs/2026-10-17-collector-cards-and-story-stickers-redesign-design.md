# Specialty Coffee Collector Cards & High-Impact Story Stickers — Design Specification

**Date:** 2026-10-17  
**Project:** BeanTag  
**Design System Reference:** `ui-ux-pro-max` (High-Contrast Editorial Hierarchy + Mobile-First Typography Scale + Curated Specialty Coffee Palettes)

---

## 1. Problem Statement & Goals

1. **Unreadable Micro-Typography on Mobile & Stories:**
   - Previous Story Stickers and Cards used `6.5px` for radar labels, `8.5px` for headers, `9.5px` for subtitles, and `10px` for terroir chips. When shared on Instagram Stories or WhatsApp, these labels were too small to read.
   - Long coffee titles were forced onto a single line and shrunk down instead of wrapping cleanly across 2 lines at a bold editorial size.
2. **Visual Clutter & Harsh Palettes:**
   - Previous cards had over 5,000 lines of repetitive ASCII-style boxes (`FIG. 01 — ARCHIVO MORFOLÓGICO...`) and harsh colors (`#FFE600` construction yellow in `neobrutalist`, retro burger-diner red/cyan in `diner`).
3. **Missing 5th Style in Share Modals:**
   - The `'studio'` style was missing from the template selector buttons in `BatchDetail.jsx` and `Settings.jsx`.

---

## 2. Art Direction: The 5 Curated Specialty Coffee Collections

All 5 internal template keys (`studio`, `kissaten`, `blueprint`, `neobrutalist`, `diner`) are preserved for 100% backward compatibility and test coverage, with upgraded specialty-coffee palettes and typography:

| Key | Collection Name | Aesthetic & Palette | Typography |
| :--- | :--- | :--- | :--- |
| `studio` | **Swiss Studio** *(Onyx / Fellow)* | Gallery White (`#FAFAFA`), Pure Card (`#FFFFFF`), Ink (`#09090B`), Zinc Muted (`#52525B`), Hairline (`#E4E4E7`), Accent (`#18181B`) | `"Outfit", "Space Grotesk", sans-serif` + `"JetBrains Mono", monospace` |
| `kissaten` | **Tokyo Kissaten** *(Koffee Mameya)* | Warm Washi (`#F3EFE6`), Cream Surface (`#FAF8F5`), Sumi Ink (`#1C1917`), Warm Muted (`#57534E`), Vermilion Seal (`#B91C1C`) | `"Playfair Display", Georgia, serif` + `"JetBrains Mono", monospace` |
| `blueprint` | **Dark Espresso Lab** *(Acaia / Night HUD)* | Deep Obsidian (`#090D16`), Slate Surface (`#111827`), Crisp White (`#F8FAFC`), Sky Muted (`#94A3B8`), Electric Cyan (`#38BDF8`) | `"Space Grotesk", sans-serif` + `"JetBrains Mono", monospace` |
| `neobrutalist` | **Nomad Roastery** *(Nomad / Fuglen)* | Warm Oat (`#F7F3EB`), Cream Card (`#FFFDF9`), Bold Ink (`#18181B` with `2.5px` solid borders & `4px` offset shadow), Terracotta/Amber Accents (`#EA580C`, `#FDE68A`) | `"Space Grotesk", sans-serif` + `"JetBrains Mono", monospace` |
| `diner` | **Botanical Terroir** *(La Cabra / Finca)* | Sage Mist (`#EFF5F1`), Alabaster Card (`#FFFFFF`), Forest Ink (`#143326`), Botanical Muted (`#3F6251`), Roasted Copper Accent (`#C2410C`) | `"Outfit", "Space Grotesk", sans-serif` + `"JetBrains Mono", monospace` |

---

## 3. Typography & Layout Architecture

### 3.1 Story Stickers (`generateCoffeeStickerImage`)
- **Canvas Dimensions:**
  - Horizontal: `600 × 300 px @ 2x` (`1200 × 600 px`) — increased height from `270px` to `300px` for generous breathing room.
  - Vertical: `400 × 540 px @ 2x` (`800 × 1080 px`) — 9:12 portrait proportion ideal for Instagram Stories.
- **Typography Scale (+55% to +75% increase):**
  - Roaster / Brand Header Pill: **`13px` bold** (up from `8.5px`).
  - Coffee Title: **`34px–42px` bold**, automatically wrapping up to **2 lines** before scaling down so long names stay huge and legible.
  - Terroir Chips (`ORIGIN • ALTITUDE`, `PROCESS`, `VARIETY`): **`14px` bold** inside `34px` tall pills (up from `9.5px`).
  - Flavor Note Pills: **`17px–18px` extra-bold** inside `46px` tall pills with style-specific SCA glyphs.
  - 5-Axis SCA Radar Chart (in Vertical mode when sensory data exists): Axis labels (`ACIDEZ`, `DULZOR`, `CUERPO`, `BALANCE`, `FINAL`) at **`11.5px` bold** (up from `6.5px`) with `radius = 48px`.

### 3.2 Collector Cards (`generateRecipeCardImage` — `540 × 760 px @ 2x`)
- **4-Zone Editorial Layout (No font smaller than `11.5px`):**
  1. **Header Zone (`y: 28 → 195`):**
     - Top Pill: Roaster name (or `SPECIALTY COFFEE`) + SCA Score / Roast Level badge (`13px` bold).
     - Multi-line Coffee Title (`34px–38px` bold, up to 2 lines).
     - Terroir Subtitle (`14px` medium: `Origin • Process • Variety • Altitude`).
     - Ticket Perforation Divider (`drawTicketNotchesAndPerforation`).
  2. **Core Content Zone (`y: 215 → 475`):**
     - **Mode A (`incRecipe = true` — Extraction Ticket):**
       - Method Banner (`14px` bold) + 2×2 Hero Telemetry Grid (`DOSE / YIELD`, `RATIO`, `GRIND`, `TIME & TEMP`) with **`26px–28px` bold** values and `11.5px` labels.
       - Visual Extraction Timeline (`drawExtractionTimeline`) with `TIMELINE` header and `BLOOM` / pour milestones at **`12.5px`–`13px`**.
     - **Mode B (`incRecipe = false` — Solo Grano Collector Card):**
       - 2×2 Terroir Passport Grid (`ORIGEN & ALTITUD`, `VARIEDAD BOTÁNICA`, `PROCESO DE BENEFICIO`, `PRODUCTOR / TOSTADOR`) with **`18px` bold** values and `12px` labels, plus Roast & Cryo Cellar status bar (`13.5px`).
  3. **Sensory & Flavor Notes Zone (`y: 490 → 685`):**
     - When `sensoryData` is present: Side-by-side layout with large Flavor Note Pills (`15.5px` bold) on the left and the 5-Axis SCA Sensory Radar (`11.5px` axis labels) on the right.
     - When no `sensoryData`: Full-width 2-column grid of large Flavor Note Cards (`16.5px` bold) with SCA category glyphs.
  4. **Footer Zone (`y: 695 → 732`):**
     - Left: `BEANTAG // SPECIALTY COFFEE LAB` (`12px` bold).
     - Right: Remaining tubes in cellar (`12px` bold pill) or rating stars.

### 3.3 Cellar Menu Card (`generateCoffeeMenuCardImage` — `540 × dynamic @ 2x`)
- Clean editorial menu header (`CARTA DE CAFÉS EN CAVA`, `30px` title) and structured batch rows with `20px` coffee names, `13.5px` origin/process subtitles, and `13px` dose badges.
