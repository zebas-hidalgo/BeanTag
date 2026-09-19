# Specification: Coffee Cards Visual Enhancements (Die-Cut Notches, SCA Sensory Radar, and Extraction Timeline)

## 1. Overview & Objectives

This design specification details the visual and architectural enhancements for the Canvas 2D card rendering engine in BeanTag (`frontend/src/utils/cardGenerator.js`). The goal is to elevate all specialty coffee card formats (Solo Grano, Con Receta, and Menú de Cava) across the 4 official themes:
- **📐 Blueprint Técnico** (`blueprint`)
- **⚡ Neobrutalismo** (`neobrutalist`)
- **📻 Retro 50s Diner** (`diner`)
- **🍵 Tokyo Kissaten 1960** (`kissaten`)

### Core Pillars
1. **Physical Realism & Collectibility**: Die-cut lateral notches and perforated tear-off lines transforming digital cards into authentic tactile tickets.
2. **Technical Barista Precision**: A 5-axis sensory polygon (radar/spider chart) adhering strictly to actual user sensory evaluation data without fabricating false metrics.
3. **Adaptive Extraction Infographic**: A dynamic brew timeline translating static parameters into an intuitive stage-by-stage extraction visualization (Bloom, pulses, drawdown, or espresso pressure ramps).

---

## 2. Feature Specifications

### 2.1 Feature 1: Die-Cut Notches & Tear-Off Perforation (`drawTicketNotchesAndPerforation`)

- **Placement & Geometry**:
  - Positioned at the natural division between the header zone (coffee name, roaster, variety) and the body zone (terroir matrix or extraction specs).
  - Y-coordinate: $Y_{\text{notch}} \approx 180\text{px} - 195\text{px}$ depending on the style layout.
  - Notch radius: $R = 12\text{px} - 14\text{px}$.
  - Two opposing circular cutouts on the card boundaries:
    - Left notch: Arc centered at $(X_{\text{card\_left}}, Y_{\text{notch}})$ spanning angle $[-\pi/2, +\pi/2]$.
    - Right notch: Arc centered at $(X_{\text{card\_right}}, Y_{\text{notch}})$ spanning angle $[+\pi/2, +3\pi/2]$.
  - The cutouts are cleared or filled using the outer environment/overlay background color to create an authentic negative-space die-cut effect.
  - A horizontal dashed divider line connects both notch inner vertices: `ctx.setLineDash([4, 4])`.

- **Style Specialization**:
  - **Retro 50s Diner**: Red cherry border (`#C92A2A`) on the cutout arcs, dashed perforation line with vintage atomic stars `✦` at each terminal.
  - **Neobrutalismo**: Thick 2.5px solid black arc outline, 3px hard offset shadow, bold perforation with a central badge `[ TEAR // CORTE ]`.
  - **Blueprint**: Clean engineering cut lines with technical corner marks and radius callout (`R12 // CUT_LINE`).
  - **Tokyo Kissaten**: Ultra-thin sumi hairline (`0.75px`) dashed line with discreet Japanese incision indicator (`切取り線`).

---

### 2.2 Feature 2: Mini SCA Sensory Radar Chart (`drawSensoryRadarChart`)

- **5 Canonical Evaluation Axes**:
  1. **Acidez** (Top: $-90^\circ$, angle $-\pi/2$)
  2. **Dulzor** (Top-Right: $-18^\circ$, angle $-\pi/10$)
  3. **Cuerpo** (Bottom-Right: $+54^\circ$, angle $+3\pi/10$)
  4. **Balance** (Bottom-Left: $+126^\circ$, angle $+7\pi/10$)
  5. **Final / Aftertaste** (Top-Left: $+198^\circ$, angle $+11\pi/10$)

- **Trigonometric Math & Rendering**:
  - Center: $(C_x, C_y)$, maximum outer radius $R = 40\text{px} - 45\text{px}$.
  - Concentric guide pentagons at $r_1 = 0.33R$, $r_2 = 0.66R$, $r_3 = 1.0R$.
  - 5 radial axis spines connecting $(C_x, C_y)$ to each outer vertex.
  - Data polygon coordinates calculated as:
    $$X_k = C_x + (v_k / 5.0) \cdot R \cdot \cos(\theta_k)$$
    $$Y_k = C_y + (v_k / 5.0) \cdot R \cdot \sin(\theta_k)$$
    where $v_k \in [1, 5]$ represents the normalized attribute value.
  - Polygon filled with themed semi-transparent fill (`alpha \approx 0.20 - 0.25`) and bounded by a solid themed perimeter line.
  - Outer vertex anchors drawn as small solid circles ($r = 2.5\text{px}$).
  - Clean labels drawn radially outward from each vertex in crisp 7px typography.

- **Data Truthfulness & Fallback Mode**:
  - Only rendered when actual sensory evaluation data exists:
    - `sensory_balance`: maps to Balance axis.
    - `sensory_body`: maps to Cuerpo axis.
    - `sensory_extraction`: maps to Acidez/Extraction axis.
    - `rating`: maps to Final/Quality axis.
    - Dulzor derived proportionally from balance and roast profile.
  - If no sensory data exists or in "Solo Grano" cards, the engine seamlessly displays the full flavor note badge pills (`extractFlavorTags`) and terroir grid, guaranteeing that **no fake scores or synthetic values are ever fabricated**.

- **Style Palettes**:
  - **Blueprint**: Cyan neon `#38BDF8` polygon over navy background with dotted concentric grid rings.
  - **Neobrutalist**: Canary yellow `#FFE600` polygon with bold 2px black stroke and white vertex dots.
  - **Retro 50s Diner**: Petrol teal `#0E7490` translucent polygon with cherry red `#C92A2A` vertex dots.
  - **Tokyo Kissaten**: Translucent washi amber/sumi fill with traditional vermilion Hanko red `#DC2626` accents.

---

### 2.3 Feature 3: Method-Adaptive Extraction Timeline (`drawExtractionTimeline`)

- **Method-Specific Logic**:
  - **Pour-Over / Drip (V60, Kalita, Chemex, Origami)**:
    - Reads `brew_time` (e.g., "2:45" $\rightarrow$ 165s) and total water from `dose_out_g` or `ratio` $\times$ `dose_in_g`.
    - Stage 1: **Bloom** ($0:00 - 0:45$, ~20% total water, e.g. 45g at recorded temperature).
    - Stage 2: **Pulso 1** ($0:45 - 1:30$, ~40% water, e.g. +100g $\rightarrow$ 145g total).
    - Stage 3: **Pulso 2** ($1:30 - 2:00$, ~40% water, up to final brew volume).
    - Stage 4: **Caída Final / Drawdown** ($2:00$ to final `brew_time`).
  - **Espresso**:
    - Pre-infusion stage: $0\text{s} - 6\text{s}$ at low pressure.
    - Extraction ramp: 9 Bar sustained pressure.
    - Yield milestone: target ratio and out-weight in recorded seconds.
  - **Immersion (French Press, Aeropress, Clever)**:
    - Passive steep stage, crust agitation / turbulence stage, and final plunge/drawdown.

- **Graphical Representation in Canvas**:
  - Segmented horizontal progress bar with subtle inner spacing.
  - Milestone indicators above the bar: elapsed times (`0:00`, `0:45`, `1:30`, `2:45`).
  - Water accumulation indicators below the bar: cumulative grams (`45g`, `+100g`, `245g total`).
  - Technical grind badge: micron translation chip using `parseGrindToMicrons(grind)` (e.g., `550µm • Media-Fina`).

---

## 3. Architecture & Code Structure

All vector routines are integrated into `frontend/src/utils/cardGenerator.js`:
1. Helper: `drawTicketNotchesAndPerforation(ctx, x, y, width, height, notchY, style)`
2. Helper: `drawSensoryRadarChart(ctx, cx, cy, radius, sensoryData, style)`
3. Helper: `drawExtractionTimeline(ctx, x, y, width, height, recipeData, style)`
4. Update style rendering pipelines (`diner`, `kissaten`, `blueprint`, `neobrutalist`) to seamlessly invoke these modular helpers.

---

## 4. Verification Plan

1. **Automated Headless Test Suite (`scripts/verify_cards_render.mjs`)**:
   - Verify all 12 card configurations pass (`npm run test:cards`):
     - 4 styles $\times$ 2 card modes (Con Receta & Solo Grano) = 8 tests.
     - 4 styles $\times$ Cellar Menu = 4 tests.
     - Ensure operation counts adhere to quality thresholds and no missing dependencies.
2. **Build Verification**:
   - Run `npm --prefix frontend run build` to verify clean Vite compilation without errors.
3. **Remote Production Deployment**:
   - Push commit to GitHub `origin/main`.
   - Update remote VPS (`5.189.152.68`), rebuild frontend bundle, and restart PM2 process.
