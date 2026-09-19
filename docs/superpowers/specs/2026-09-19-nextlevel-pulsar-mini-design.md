# Design Specification: NextLevel Pulsar Mini Integration

**Date:** 2026-09-19  
**Status:** Approved  
**Author:** Antigravity  

---

## 1. Objective & Coffee Methodology

Integrate the **NextLevel Pulsar Mini** as an official, first-class brewing method in BeanTag.

The NextLevel Pulsar (designed in collaboration with Scott Rao) is a revolutionary "no-bypass" cylindrical dripper featuring an integrated steep-and-release flow control valve and a dispersion shower cap. The **Pulsar Mini** is optimized specifically for single-cup specialty extractions (12g–18g doses), achieving high extraction yields (21–24% EY) with exceptional sweetness, clarity, and zero water bypass around the bed.

---

## 2. UI & Interaction Design

### 2.1 Method Selector & Visual Identification
- **Method Identifier:** `'NextLevel Pulsar Mini'`
- **Display Label:** `'Pulsar Mini'`
- **Icon:** `<SlidersHorizontal size={...} strokeWidth={2.3} />` from `lucide-react`, representing the steep-and-release flow control valve.
- **Locations Updated:**
  - `frontend/src/components/BatchDetail.jsx`: In the Cupertino segmented method selector (alongside V60, Espresso, AeroPress, Prensa).
  - `frontend/src/components/RecipeForm.jsx`: In the quick-select cards.
  - `frontend/src/components/BrewHistory.jsx`: In the quick-filter pills row (`['Todos', 'V60', 'Espresso', 'AeroPress', 'Pulsar Mini', 'Prensa']`), method icon renderer `getMethodLucideIcon`, and edit modal.
  - `frontend/src/utils/cardGenerator.js`: Technical method title formatted as `PULSAR MINI // NO-BYPASS`.

### 2.2 Presets & Legendary Recipes (`frontend/src/utils/famousRecipes.js`)
Add 3 specialized recipes for the NextLevel Pulsar Mini:

1. **Scott Rao Standard Mini (`scott-rao-pulsar-mini`)**:
   - **Author:** Scott Rao (Coffee Author & Roasting Consultant)
   - **Badge:** 🏆 Rao No-Bypass Protocol
   - **Method:** `'NextLevel Pulsar Mini'`
   - **Description:** 'Inmersión inicial con válvula cerrada y WWDT suave, seguida de percolación continua con tapa de dispersión.'
   - **Dose:** 15g | **Ratio:** 1:16.6 (250g agua) | **Temp:** 94°C | **Time:** '3:30 min'
   - **Grind:** 'Media (Rao Pulsar Mini)' (~1900 µm)
   - **Grinder Settings:**
     - J-Max: 2.4.5 (~1900 µm)
     - Comandante C40: 24 clics
     - Femobook A68: 62 clics
   - **Pours & Valve Stages:**
     - Paso 1 (0:00 - 0:45): 50g agua con **🔒 Válvula CERRADA**. WWDT suave con aguja para humedecer toda la cama.
     - Paso 2 (0:45 - 2:00): Abrir **🔓 Válvula ABIERTA** al 100%. Verter a través de la tapa de dispersión hasta 150g manteniendo columna constante.
     - Paso 3 (2:00 - 3:30): Verter suavemente hasta 250g. Dejar drenar por completo hasta cama plana.

2. **Alta Extracción No-Bypass (`gagne-high-extraction-mini`)**:
   - **Author:** Jonathan Gagné (Astrofísico & Autor de The Physics of Filter Coffee)
   - **Badge:** 🔬 Max Extraction Yield (23%+)
   - **Method:** `'NextLevel Pulsar Mini'`
   - **Description:** 'Bloom prolongado de 1 minuto en inmersión total y percolación lenta regulada al 50% de flujo para tuestes nórdicos ultra-claros.'
   - **Dose:** 15g | **Ratio:** 1:17 (255g agua) | **Temp:** 96°C | **Time:** '4:15 min'
   - **Grind:** 'Fina-Media (Gagné Micro)' (~1750 µm)
   - **Grinder Settings:**
     - J-Max: 2.3.0 (~1750 µm)
     - Comandante C40: 21 clics
     - Femobook A68: 55 clics
   - **Pours & Valve Stages:**
     - Paso 1 (0:00 - 1:00): 60g con **🔒 Válvula CERRADA**. Bloom largo con WWDT.
     - Paso 2 (1:00 - 2:30): **🔓 Válvula MEDIO ABIERTA (50%)**. Verter hasta 160g.
     - Paso 3 (2:30 - 4:15): **🔓 Válvula ABIERTA 100%**. Verter hasta 255g y dejar asentar.

3. **Concentrado Intenso / Low Ratio (`pulsar-mini-concentrate`)**:
   - **Author:** Técnica Intensa de Baja Dilución
   - **Badge:** 🍯 Dulzor & Textura Sedosa
   - **Method:** `'NextLevel Pulsar Mini'`
   - **Description:** 'Ratio corto 1:14 con mayor tiempo de contacto para resaltar mieles, cuerpo jaraboso y notas dulces profundas.'
   - **Dose:** 18g | **Ratio:** 1:14 (252g agua) | **Temp:** 92°C | **Time:** '3:15 min'
   - **Grind:** 'Media-Gruesa' (~2050 µm)
   - **Grinder Settings:**
     - J-Max: 2.6.0 (~2050 µm)
     - Comandante C40: 26 clics
     - Femobook A68: 68 clics
   - **Pours & Valve Stages:**
     - Paso 1 (0:00 - 0:45): 60g **🔒 Válvula CERRADA**. Bloom e inmersión.
     - Paso 2 (0:45 - 3:15): **🔓 Válvula ABIERTA**. Vertido continuo hasta 252g.

---

## 3. Extraction Timer & Interactive Valve Guide

In `frontend/src/components/BatchDetail.jsx`:
- When viewing recipe steps in the interactive timer:
  - If step contains valve information (or `step.valve`), render a prominent tactile status pill:
    - 🔒 `VÁLVULA CERRADA` (Amber / Red accent, e.g. `#FED7D7` / `#9B2C2C`).
    - 🔓 `VÁLVULA ABIERTA` (Green / Mint accent, e.g. `#C6F6D5` / `#22543D`).

---

## 4. Verification Plan

1. **Unit & Logic Tests**:
   - Verify `famousRecipes.js` exports the 3 new recipes with correct calculations (`calculatePours`).
   - Verify grinder micron mappings.
2. **Build & Headless Verification**:
   - `npm run test:cards` -> passes 12/12 with Pulsar Mini recipes.
   - `npm run build` -> compiles without error.
3. **Manual Flow Verification**:
   - In `BatchDetail.jsx`, select "Pulsar Mini" -> verify presets appear.
   - Select "Scott Rao Standard Mini" -> verify timer renders with valve status badges.
   - Register extraction -> verify appears in `BrewHistory.jsx` with `<SlidersHorizontal />` and can be edited.
