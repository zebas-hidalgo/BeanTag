# Design Specification: Truthful, Zero-Hallucination Coffee Cards & Tickets

## 1. Problem Statement
The user requested: *"mejora los tickets, limitate a la info del cafe, no inventes nada, ni puntajes ni cosas asi"*.

An audit of `frontend/src/utils/cardGenerator.js` revealed multiple places where default/dummy data and fabricated marketing claims were hardcoded into generated cards:
1. **Fabricated SCA Scores**: Defaulted to `89.5` (or `88`) when no score was entered by the user, printing `SCA CUPSCORE: 89.5★ [CERTIFIED]` and `SCA 89.5★` across Blueprint, Neobrutalist, Aurora, and Hangtag tickets.
2. **Fabricated Sensory Spectrum Bars**: Hardcoded 4 spectrum bars in Solo Grano mode across Blueprint, Neobrutalist, and Aurora:
   - Acidez: 88% / 90% (`Brillante / Cítrica`)
   - Dulzor: 92% (`Panela & Miel` / `Caramelo & Miel`)
   - Cuerpo: 80% / 82% (`Sedoso / Té`)
   - Balance: 94% / 95% (`Excepcional`)
   In Hangtag mode, hardcoded French cupping sentences (`Corps: Soyeux et velouté...`, `Acidité: Brillante et florale...`, `Douceur: Panela et miel d'oranger...`).
3. **Fabricated Terroir Metadata**:
   - Missing origin defaulted to `'Boquete, Panamá'`.
   - Missing roaster defaulted to `'Tostaduría Artesanal'`.
   - Missing variety defaulted to `'Geisha / Heirloom'`.
   - Missing process defaulted to `'Lavado'`.
   - Missing altitude defaulted to `'1.850m'`.
   - Missing notes defaulted to `'Notas limpias, florales, balance y dulzor'` or `['Notas Limpias', 'Balance', 'Dulzor Natural']`.
   - Subtitles hardcoded fake slogans: `VOLCANIC SOIL / MICROCLIMATE`, `100% ARABICA SPECIALTY`, `CONTROLLED FERMENTATION`, `SHIBUYA DISTRICT`, `[TARGET EXTRACTION: 19.5% - 21.5% EY]`.
4. **Molienda `null µm` Glitch**: If microns could not be computed (e.g. Comandante or grind text without J-Max), it displayed `null µm`.

## 2. Architecture & Design Principles

### Principle 1: Strict Truthfulness & Zero Hallucinations
- **Only display what the user actually entered**.
- If an attribute is absent:
  - If optional (e.g. SCA score, altitude, variety, producer): omit the badge/label cleanly or show a neutral placeholder (`—` or `No registrada`).
  - Never fabricate origin, variety, process, elevation, or scores.

### Principle 2: Genuine Cupping Notes with Line Wrapping
- In place of the fake 4 spectrum bars, dedicate vertical space in Solo Grano mode to the **real cupping notes written by the roaster or barista**:
  - Implement `drawWrappedText` with clean typography and line height.
  - Render discrete tag pills only for actual tags detected in the coffee.
  - If no notes exist, show a clean, quiet state (`Sin notas registradas para este lote`).

### Principle 3: Authentic Recipe Bento Tiles
- **Método**: Real brew method (e.g. `V60 (FILTRADO)`, `NEXTLEVEL PULSAR MINI`, `ESPRESSO`).
- **Ratio & Dosis**: Only calculate ratio if coffee and water grams exist (`${coffeeG}g IN ➔ ${waterG}g OUT`).
- **Molienda**: Display the real grind string as the main title (e.g. `2.4.5 (J-MAX)`, `58 CLICS`, `MEDIO-FINO`). Only display microns as a subtitle if `microns !== null` (e.g. `~1980 µm`).
- **Tiempo & Temp**: Show real `timeStr` and `tempStr`. No fabricated slogans like `• CONSTANT FLOW`.

### Principle 4: Menu Card & Share Text Integrity
- In `generateCoffeeMenuCardImage` and `generateCoffeeMenuText`:
  - Do not default roaster to `'Specialty'`.
  - Do not default variety to `'Variedad Arábica'`.
  - Do not default process to `'Proceso Artesanal'`.
  - Do not default tags to `['Notas Limpias', 'Balance']`.

## 3. Verification Plan
- Automated test `scripts/verify_cards_render.mjs`: Test all 12 variants with headless DOM.
- Add additional test cases with empty / minimal coffee profiles (no SCA score, no roaster, no variety) to verify that zero fake data is injected and rendering remains visually balanced.
- Frontend build: `npm run build` with 0 errors.
- VPS Deployment: Push to `origin/main`, build on VPS `5.189.152.68`, restart PM2, verify live HTTP 200.
