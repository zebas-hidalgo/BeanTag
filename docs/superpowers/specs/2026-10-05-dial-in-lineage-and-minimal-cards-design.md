# Design Spec: Dial-in Lineage Timeline & Minimal Share Cards (2026-10-05)

## 1. Overview & Goals
BeanTag allows specialty coffee baristas to design recipes via Gemini AI (`gemini-3.8-flash`), execute them with a real-time extraction timer (`BrewGuideModal.jsx`), and refine them post-brew with a 3-tap sensory diagnostic engine (`sensoryTuner.js`).

This specification designs two complementary capabilities and a live verification loop:
1. **Dial-in Lineage (Timeline Stepper)**: A visual vertical timeline inside `BatchDetail.jsx` illustrating each brew iteration of a batch, showing sensory diagnosis deltas, adjustments recommended by the tuner, and highlighting the calibrated sweet spot.
2. **Minimalist Barista Share Tickets (`cardGenerator.js`)**: Clean, editorial-style extraction cards emphasizing preparation keys (active grinder dial, dose in/out, ratio, brew time, tasting notes, and star rating).
3. **Live Field Verification Protocol**: Step-by-step verification on the live VPS instance (`5.189.152.68`).

---

## 2. Architecture & Data Flow

### A. Dial-in Lineage Component (`frontend/src/components/DialInTimeline.jsx`)
- **Props**:
  - `recipes`: Array of recipe objects associated with the current batch (`batch.recipes`).
  - `activeGrinderId`: Current active grinder ID (e.g. `'femobook'`, `'jmax'`).
  - `onSelectRecipe`: Callback to load and preview/edit a recipe in the form.
  - `onBrewRecipe`: Callback to launch `BrewGuideModal` directly with that recipe.
- **Data Model per Recipe**:
  - `id`: Unique recipe ID.
  - `created_at`: Timestamp.
  - `method`: Extraction method (e.g. `'V60 (Filtrado)'`, `'NextLevel Pulsar Mini'`).
  - `grind`: Formatted dial text (e.g. `'70 clics (~1.8 Rot.)'`, `'2.4.2'`).
  - `temperature`: Temperature string/number (e.g. `94` or `'94°C'`).
  - `ratio`: Extraction ratio (e.g. `'1:16.6'`).
  - `dose_in_g` & `dose_out_g`: Input and output mass.
  - `brew_time`: Time string.
  - `rating`: 1 to 5 stars.
  - `sensory_extraction`: Sensory evaluation (`'Sub (Agrio)'`, `'Balanceado'`, `'Sobre (Amargo)'`, etc.).
  - `notes`: Barista tasting notes or sensory explanation.
- **Visual Presentation**:
  - Chronological or reverse-chronological vertical stepper with connecting lines (`var(--color-crimson)` or amber for sweet spots).
  - Badge for Sweet Spot: If `rating === 5` or `notes` mentions 'Sweet Spot', renders a gold badge `🏆 Sweet Spot`.
  - Deltas badge: If the recipe was created via tuning, displays the delta applied (e.g. `+2 clics • +1°C`).
  - Action button: `▶ Preparar Esta Versión` to trigger `BrewGuideModal`.

### B. Minimalist Barista Ticket Export (`frontend/src/utils/cardGenerator.js`)
- **Visual Structure**:
  1. **Top Header**: Batch name, origin, variety/process tags.
  2. **Extraction Key Block**:
     - `DOSE IN / OUT`: Large, bold monospace readout (`15.0g ➔ 249g (1:16.6)`).
     - `ACTIVE GRINDER DIAL`: Clear, high-contrast badge (e.g. `FEMOBOOK A2: 70 CLICS (~1.8 Rot.)` or `1ZPRESSO J-MAX: 2.4.2`).
     - `TEMP & TIME`: `94°C • 2:45 min`.
     - `VALVE BADGE`: For Pulsar Mini, shows 3-phase valve summary.
  3. **Sensory & Cupping Footer**:
     - Large italicized flavor notes (e.g. `"Jazmín, durazno maduro, miel de abeja"`).
     - 5-Star rating glyphs.
     - Minimal QR / BeanTag watermark.
  - Renders cleanly across all 4 templates: `blueprint`, `kissaten`, `diner`, `neobrutalist`.

---

## 3. Component Decomposition & File Changes

1. **`frontend/src/components/DialInTimeline.jsx`** (New Component):
   - Standalone, modular React component.
   - Clean CSS using existing BeanTag design system variables (`--bg-card`, `--color-crimson`, `--barista-accent-honey`, etc.).
   - Defensive against missing fields, empty recipe lists, or legacy recipe formats.

2. **`frontend/src/components/BatchDetail.jsx`** (Integration):
   - Import `DialInTimeline`.
   - Embed within the recipes section with tab/toggle: `[ Lista Tradicional ]` vs `[ Línea de Tiempo Dial-in 🎯 ]`.
   - Connect `onBrewRecipe` to existing `handleStartBrewGuide`.

3. **`frontend/src/utils/cardGenerator.js`** (Share Card Updates):
   - Ensure `drawRecipeDetails` renders active grinder name and formatted dial prominently.
   - Format dose in/out in clean high-contrast styling matching the minimalist ticket option.

---

## 4. Verification & Testing Strategy
1. **Unit Tests**:
   - `scripts/test_dialin_timeline.mjs`: Test timeline sorting, sweet-spot detection, delta extraction, and grinder dial formatting.
2. **End-to-End Build**:
   - Run `npm --prefix frontend run build` to verify bundle compilation with 0 errors.
3. **Deployment & VPS Validation**:
   - Push to `origin main`, deploy via Zerker on VPS `5.189.152.68`.
   - Execute live field test via browser on the production instance.
