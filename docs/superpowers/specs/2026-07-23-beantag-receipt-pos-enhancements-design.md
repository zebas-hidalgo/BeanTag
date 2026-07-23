# Spec: BeanTag Barista Receipt POS Enhancements (Itemized Table & Paper Texture)

**Date:** 2026-07-23  
**Status:** Approved  
**Target Project:** BeanTag Specialty Coffee Web App

---

## Executive Summary
This document specifies the enhancement of the Barista Ticket (`receipt`) share card canvas export in `BrewHistory.jsx` with an itemized POS register table (`CANT. / DESCRIPCIÓN / VALOR`) and realistic thermal paper texture with a subtle central fold crease.

---

## Detailed Specifications

### 1. Itemized POS Register Table Layout (`exportRecipeAsImage` in `BrewHistory.jsx`)
- **Header Columns:**
  `CANT.  DESCRIPCIÓN                        VALOR`
  Divider line: `--------------------------------------------------`
- **Item Rows (Extraction Recipe Mode):**
  - Row 1: `1x     GRANO: GEISHA PANAMÁ              SCA 89`
  - Row 2: `1x     MÉTODO: V60 FILTRADO (20.0G)      93°C`
  - Row 3: `1x     MOLIENDA: J-MAX 1.5.0             ~720 µm`
  - Row 4: `1x     RATIO & TIEMPO: 1:15              2:30 MIN`
- **Item Rows (Solo Grano Technical Sheet Mode):**
  - Row 1: `1x     GRANO: GEISHA PANAMÁ              SPECIALTY`
  - Row 2: `1x     ORIGEN: BOQUETE, PANAMÁ           1800M`
  - Row 3: `1x     PRODUCTOR: FAMILIA PETERSON       LOTE #12`
  - Row 4: `1x     PROCESO & VARIEDAD: NATURAL       GEISHA`
- **Notes Line:**
  `NOTAS:  NOTAS DE CATA DE LA RUEDA SCA`

---

### 2. Thermal Paper Texture & Crease Line (`exportRecipeAsImage` in `BrewHistory.jsx`)
- **Paper Fill:**
  `#FAF8F5` background with micro noise/fiber lines in `#E2E8F0` at 15% opacity.
- **Vertical Crease Line:**
  Draw a subtle vertical crease fold at `x = 420` (center of receipt canvas) using `ctx.save()`, `ctx.strokeStyle = 'rgba(0,0,0,0.04)'`, `ctx.lineWidth = 2`, `ctx.moveTo(420, 10)`, `ctx.lineTo(420, 530)`.
- **Barcode & Seal:**
  Keep the real thermal POS barcode on the bottom left and the circular BEANTAG barista seal on the bottom right.

---

## Verification Criteria
- `npm run build` compiles cleanly with 0 errors.
- Image export in BrewHistory share modal displays crisp POS table layout and paper crease.
- Saved PNG download retains transparent edges around zig-zag teeth.
- Live PM2 deployment verified.
