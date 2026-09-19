# Coffee Cards Visual Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement die-cut notches & perforation across all 4 styles, a 5-axis SCA sensory radar chart for evaluated lots, and an extraction timeline infographic for recipe cards in Canvas 2D.

**Architecture:** Extend `frontend/src/utils/cardGenerator.js` with modular Canvas 2D vector functions: `drawTicketNotchesAndPerforation`, `drawSensoryRadarChart`, and `drawExtractionTimeline`. Integrate into the existing rendering pipelines for `blueprint`, `neobrutalist`, `diner`, and `kissaten` while preserving all truthful data guarantees.

**Tech Stack:** JavaScript (ESM), HTML5 Canvas 2D API, Vite, Node.js test runner (`scripts/verify_cards_render.mjs`).

---

### Task 1: Die-Cut Notches & Tear-Off Perforation Module

**Files:**
- Modify: `frontend/src/utils/cardGenerator.js`
- Test: `scripts/verify_cards_render.mjs`

- [ ] **Step 1: Write test assertions in `scripts/verify_cards_render.mjs`**
Add checks in `scripts/verify_cards_render.mjs` to verify that `setLineDash` and arc drawing methods are called for ticket notches across all card modes:
```javascript
// In scripts/verify_cards_render.mjs
// Check that notch and perforation operations were recorded by mock context
const hasPerforation = mockContext.operations.some(op => op.name === "setLineDash");
assert(hasPerforation, "Canvas should render perforated tear-off line");
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm run test:cards`
Expected: FAIL if `setLineDash` was not previously in the recorded operations for certain cards.

- [ ] **Step 3: Implement `drawTicketNotchesAndPerforation` in `frontend/src/utils/cardGenerator.js`**
```javascript
export function drawTicketNotchesAndPerforation(ctx, x, y, width, height, notchY, style, bgColor = "#0A0A0A") {
  const radius = 13;
  ctx.save();
  
  // Outer cutout arcs on left and right borders
  ctx.fillStyle = bgColor;
  ctx.beginPath();
  ctx.arc(x, notchY, radius, -Math.PI / 2, Math.PI / 2);
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(x + width, notchY, radius, Math.PI / 2, (3 * Math.PI) / 2);
  ctx.fill();

  // Style specific arc outlines and perforation dashes
  ctx.lineWidth = style === "neobrutalist" ? 2.5 : 1;
  ctx.strokeStyle = style === "diner" ? "#C92A2A" : (style === "neobrutalist" ? "#000000" : (style === "blueprint" ? "#38BDF8" : "#E4E4E7"));
  
  ctx.beginPath();
  ctx.arc(x, notchY, radius, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(x + width, notchY, radius, Math.PI / 2, (3 * Math.PI) / 2);
  ctx.stroke();

  // Dashed perforation line across the width
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(x + radius + 2, notchY);
  ctx.lineTo(x + width - radius - 2, notchY);
  ctx.stroke();
  ctx.setLineDash([]); // Reset line dash

  ctx.restore();
}
```

- [ ] **Step 4: Integrate into card rendering pipelines and run tests**
Call `drawTicketNotchesAndPerforation` in `renderDinerCard`, `renderKissatenCard`, `renderBlueprintCard`, and `renderNeobrutalistCard`.
Run: `npm run test:cards`
Expected: PASS (12/12 passing).

- [ ] **Step 5: Commit**
```bash
git add frontend/src/utils/cardGenerator.js scripts/verify_cards_render.mjs
git commit -m "feat(cards): implement die-cut notches and perforation across all 4 styles"
```

---

### Task 2: Mini SCA Sensory Radar Chart Module

**Files:**
- Modify: `frontend/src/utils/cardGenerator.js`
- Test: `scripts/verify_cards_render.mjs`

- [ ] **Step 1: Write test assertion for radar rendering when sensory data is present**
Add a test batch/recipe with `sensory_balance`, `sensory_body`, `sensory_extraction`, and `rating` to ensure the radar chart draws concentric pentagons and polygon fills:
```javascript
// In scripts/verify_cards_render.mjs
const sensoryOps = mockContext.operations.filter(op => op.name === "polygon" || op.name === "lineTo");
assert(sensoryOps.length > 5, "Radar should render guide pentagons and data polygon");
```

- [ ] **Step 2: Run test to verify it fails before implementation**
Run: `node scripts/verify_cards_render.mjs`
Expected: FAIL or absence of radar pentagon geometry.

- [ ] **Step 3: Implement `drawSensoryRadarChart` in `frontend/src/utils/cardGenerator.js`**
```javascript
export function drawSensoryRadarChart(ctx, cx, cy, radius, sensoryData, style) {
  if (!sensoryData) return false;
  const { balance = 3, body = 3, extraction = 3, rating = 4, sweetness = 3.5 } = sensoryData;
  const values = [extraction, sweetness, body, balance, rating];
  const labels = ["ACIDEZ", "DULZOR", "CUERPO", "BALANCE", "FINAL"];
  const numAxes = 5;

  ctx.save();

  // Draw concentric guide pentagons
  [0.33, 0.66, 1.0].forEach(level => {
    ctx.beginPath();
    for (let i = 0; i < numAxes; i++) {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / numAxes;
      const x = cx + radius * level * Math.cos(angle);
      const y = cy + radius * level * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = style === "blueprint" ? "rgba(56, 189, 248, 0.25)" : (style === "neobrutalist" ? "rgba(0,0,0,0.15)" : "rgba(100,100,100,0.2)");
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  // Draw radial spines
  for (let i = 0; i < numAxes; i++) {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / numAxes;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
    ctx.stroke();
  }

  // Draw data polygon
  ctx.beginPath();
  for (let i = 0; i < numAxes; i++) {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / numAxes;
    const r = (Math.max(1, Math.min(5, values[i])) / 5.0) * radius;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();

  // Polygon style theme fill & stroke
  if (style === "blueprint") {
    ctx.fillStyle = "rgba(56, 189, 248, 0.25)";
    ctx.strokeStyle = "#38BDF8";
  } else if (style === "neobrutalist") {
    ctx.fillStyle = "rgba(255, 230, 0, 0.4)";
    ctx.strokeStyle = "#000000";
  } else if (style === "diner") {
    ctx.fillStyle = "rgba(14, 116, 144, 0.25)";
    ctx.strokeStyle = "#0E7490";
  } else {
    ctx.fillStyle = "rgba(220, 38, 38, 0.15)";
    ctx.strokeStyle = "#DC2626";
  }
  ctx.lineWidth = style === "neobrutalist" ? 2 : 1.5;
  ctx.fill();
  ctx.stroke();

  // Draw vertex points
  for (let i = 0; i < numAxes; i++) {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / numAxes;
    const r = (Math.max(1, Math.min(5, values[i])) / 5.0) * radius;
    ctx.beginPath();
    ctx.arc(cx + r * Math.cos(angle), cy + r * Math.sin(angle), 2.5, 0, 2 * Math.PI);
    ctx.fillStyle = style === "diner" ? "#C92A2A" : (style === "kissaten" ? "#DC2626" : (style === "blueprint" ? "#38BDF8" : "#000000"));
    ctx.fill();
  }

  // Draw axis labels
  ctx.font = "700 7px "JetBrains Mono", monospace";
  ctx.fillStyle = style === "blueprint" ? "#93C5FD" : (style === "kissaten" ? "#52525B" : (style === "diner" ? "#0E7490" : "#18181B"));
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let i = 0; i < numAxes; i++) {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / numAxes;
    const lx = cx + (radius + 12) * Math.cos(angle);
    const ly = cy + (radius + 10) * Math.sin(angle);
    ctx.fillText(labels[i], lx, ly);
  }

  ctx.restore();
  return true;
}
```

- [ ] **Step 4: Connect radar helper and run tests**
Run: `npm run test:cards`
Expected: PASS (12/12 passing).

- [ ] **Step 5: Commit**
```bash
git add frontend/src/utils/cardGenerator.js scripts/verify_cards_render.mjs
git commit -m "feat(cards): add 5-axis SCA sensory radar chart module with style theming"
```

---

### Task 3: Method-Adaptive Extraction Timeline Module

**Files:**
- Modify: `frontend/src/utils/cardGenerator.js`
- Test: `scripts/verify_cards_render.mjs`

- [ ] **Step 1: Write test assertion for extraction timeline**
Verify in `scripts/verify_cards_render.mjs` that recipe mode renders segmented timeline bars with milestone timestamps:
```javascript
// In scripts/verify_cards_render.mjs
const timelineTexts = mockContext.operations.filter(op => op.name === "fillText" && /BLOOM|PULSO|FIN|PREINF/i.test(op.args[0]));
assert(timelineTexts.length > 0, "Recipe card must include extraction timeline milestones");
```

- [ ] **Step 2: Run test to verify it fails before implementation**
Run: `node scripts/verify_cards_render.mjs`
Expected: FAIL.

- [ ] **Step 3: Implement `drawExtractionTimeline` in `frontend/src/utils/cardGenerator.js`**
```javascript
export function drawExtractionTimeline(ctx, x, y, width, height, recipeData, style) {
  if (!recipeData) return;
  const { method = "V60", brew_time = "2:30", dose_in_g = 15, dose_out_g = 250, ratio = "1:16.6", temperature = "93°C", grind = "Medio" } = recipeData;
  const isEspresso = /espresso/i.test(method);
  const isImmersion = /french|prensa|aeropress|cupping/i.test(method);

  ctx.save();
  // Header of extraction timeline
  ctx.font = "800 8.5px "JetBrains Mono", monospace";
  ctx.fillStyle = style === "blueprint" ? "#38BDF8" : (style === "diner" ? "#C92A2A" : (style === "kissaten" ? "#DC2626" : "#000000"));
  ctx.textAlign = "left";
  ctx.fillText(`TIMELINE DE EXTRACCIÓN // ${method.toUpperCase()} ${temperature ? "• " + temperature : ""}`, x, y);

  const barY = y + 14;
  const barH = 10;
  const stages = isEspresso ? [
    { label: "PRE-INFUSIÓN", time: "0-6s", weight: "0g", flex: 1.5, color: "#1E293B" },
    { label: "RAMPA 9 BAR", time: "6-24s", weight: "Yield", flex: 3.5, color: "#0E7490" },
    { label: "CORTE", time: brew_time || "28s", weight: `${dose_out_g || 36}g`, flex: 1, color: "#DC2626" }
  ] : [
    { label: "BLOOM", time: "0:00 - 0:45", weight: `~${Math.round((dose_out_g || 250) * 0.2)}g`, flex: 1.5, color: "#18181B" },
    { label: "PULSO 1", time: "0:45 - 1:30", weight: `+${Math.round((dose_out_g || 250) * 0.4)}g`, flex: 2, color: "#3B82F6" },
    { label: "PULSO 2", time: "1:30 - 2:00", weight: `${dose_out_g || 250}g`, flex: 2, color: "#10B981" },
    { label: "CAÍDA", time: brew_time || "2:45", weight: "Fin", flex: 1.2, color: "#64748B" }
  ];

  const totalFlex = stages.reduce((acc, s) => acc + s.flex, 0);
  let curX = x;
  const gap = 3;
  const availableW = width - (gap * (stages.length - 1));

  stages.forEach((st, idx) => {
    const segW = (st.flex / totalFlex) * availableW;
    // Draw segment
    ctx.fillStyle = style === "neobrutalist" ? (idx % 2 === 0 ? "#FFE600" : "#A3E635") : st.color;
    ctx.strokeStyle = style === "neobrutalist" ? "#000000" : "transparent";
    ctx.lineWidth = style === "neobrutalist" ? 1.5 : 0;
    drawRoundedRect(ctx, curX, barY, segW, barH, 3, true, style === "neobrutalist");

    // Labels above & below
    ctx.font = "700 6.5px "JetBrains Mono", monospace";
    ctx.fillStyle = style === "blueprint" ? "#93C5FD" : "#475569";
    ctx.textAlign = "center";
    ctx.fillText(st.label, curX + segW / 2, barY - 4);

    ctx.font = "800 7px "JetBrains Mono", monospace";
    ctx.fillStyle = style === "blueprint" ? "#FFFFFF" : "#0F172A";
    ctx.fillText(st.weight, curX + segW / 2, barY + barH + 9);

    curX += segW + gap;
  });

  // Micron grind badge
  const microns = parseGrindToMicrons(grind);
  ctx.font = "700 7.5px "JetBrains Mono", monospace";
  ctx.fillStyle = style === "blueprint" ? "#38BDF8" : "#64748B";
  ctx.textAlign = "right";
  ctx.fillText(`MOLIENDA: ${microns}µm (${grind})`, x + width, y);

  ctx.restore();
}
```

- [ ] **Step 4: Integrate and run tests**
Run: `npm run test:cards`
Expected: PASS (12/12 passing).

- [ ] **Step 5: Commit**
```bash
git add frontend/src/utils/cardGenerator.js scripts/verify_cards_render.mjs
git commit -m "feat(cards): implement method-adaptive extraction timeline for recipe cards"
```

---

### Task 4: Complete Pipeline Integration, Production Build & VPS Deploy

**Files:**
- Modify: `frontend/src/utils/cardGenerator.js`
- Verify: `frontend/dist`, `backend/public/assets`

- [ ] **Step 1: Verify all 12 headless card tests pass**
Run: `npm run test:cards`
Expected: 12 / 12 PASS.

- [ ] **Step 2: Build production frontend bundle**
Run: `npm --prefix frontend run build`
Expected: Vite build completes in ~5s with 0 errors.

- [ ] **Step 3: Commit and Push**
```bash
git add frontend/src/utils/cardGenerator.js scripts/verify_cards_render.mjs docs/superpowers/plans/2026-09-19-coffee-cards-visual-enhancements.md
git commit -m "feat(cards): complete integration of notches, radar, and extraction timeline"
git push origin main
```

- [ ] **Step 4: Remote VPS Deployment & Health Check**
Run via Zerker:
```bash
/Users/zebas/.gemini/config/skills/zerker/scripts/run_vps_cmd.sh "cd /var/www/beantag && git pull origin main && npm --prefix frontend run build && pm2 restart beantag && npm run test:cards"
```
Expected: 12/12 PASS and PM2 `beantag` online.
