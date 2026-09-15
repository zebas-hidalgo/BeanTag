# Specialty Coffee Cards Asset Framing & Visual Integration Specification

## 1. Context & Problem Statement
Following the vertical card architecture refactor (540×760 px @ 2x = 1080×1520 px), a visual audit revealed that the illustrations and metric icons appeared poorly framed ("mal encuadradas") across all 4 styles (`blueprint`, `neobrutalist`, `aurora`, `hangtag`):
1. **Opaque Background Box Mismatch**: Hero images possessed opaque, hard-edged rectangular backgrounds (e.g. dark teal `(2, 28, 51)` on navy `#06162D`, light slate `(235, 240, 244)` on ivory `#FFFDF8`, dark charcoal `(29, 32, 39)` on obsidian `#06070B`), resulting in an awkward "pasted sticker" defect.
2. **Metric Icon Aspect Distortion**: Original icon crops were rectangular (~310×430 px) rather than 1:1 square, causing horizontal pinching when drawn inside square bounding boxes (`size × size`).
3. **Off-Center Mass**: Several icons featured significant asymmetric whitespace, pushing the active glyph near the bottom or side boundaries.

## 2. Selected Approach: Approach A (Pure Alpha + Integrated Geometric Framing)

### 2.1 Asset Processing Pipeline (Python PIL)
- **Heroes (4 assets)**:
  - Detect corner/edge baseline color.
  - Apply clean alpha chroma-key with 1.5px feathering to isolate the central illustration without jagged edges or halos.
  - Crop tightly around active illustration boundaries and center on a 1:1 canvas (500×500 px).
- **Metric & Badge Icons (17 assets)**:
  - Compute precise bounding box of visible graphic content (`getbbox`).
  - Translate the glyph center of mass to exact geometric center `(W/2, H/2)`.
  - Export into high-DPI 1:1 square PNGs (`frontend/src/assets/cards/`).

### 2.2 Canvas 2D Framing Engine (`ticketIconKits.js` & `cardGenerator.js`)
- **Blueprint**:
  - Hero floats over a subtle technical cyan background halo (`radial-gradient`), framed by a dashed circular calibration ring (`setLineDash([3, 3])`) and cardinal CAD crosshairs.
  - Metrics drawn in technical 1:1 square cells with fine coordinate grid lines.
- **Neo-Brutalist**:
  - Hero framed as a die-cut sticker: solid fill backing (`#CBFD3C` or `#FFFFFF`), 2.5px solid black border, and 3px offset hard black drop shadow (`ctx.fillRect`).
  - Metrics drawn in square badges with high-contrast borders and solid shadows.
- **Aurora**:
  - Hero framed with a soft diffuse radial glow (`rgba(168, 85, 247, 0.25) -> transparent`) dissolving naturally into deep obsidian `#06070B`.
  - Metrics drawn inside translucent rounded glass capsules (`rgba(255, 255, 255, 0.06)` fill, `rgba(255, 255, 255, 0.12)` border).
- **Nordic Hangtag**:
  - Hero rendered as a letterpress botanical etching with warm sepia tones, framed by a delicate embossed deboss circle (`rgba(44, 24, 16, 0.08)`).
  - Metrics drawn in circular ivory badges.

## 3. Verification & Deployment Plan
- Headless automated verification script rendering 8 cards (4 styles × 2 modes: Recipe vs Solo Grano).
- Build verification via `npm run build`.
- Remote deployment to VPS `5.189.152.68` via Git + PM2 reload.
