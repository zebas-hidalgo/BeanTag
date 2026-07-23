# BeanTag Barista Receipt POS Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor `exportRecipeAsImage` canvas drawing routine in `BrewHistory.jsx` to render an itemized POS register table (`CANT. / DESCRIPCIÓN / VALOR`) and a realistic paper texture with a subtle central fold crease.

**Architecture:** Canvas 2D text layout and drawing routines in `frontend/src/components/BrewHistory.jsx`.

**Tech Stack:** React, Canvas 2D API, Vite, PM2.

## Global Constraints

- Retain 2X High-DPI resolution scaling (`scaleFactor = 2`).
- Retain transparent outer PNG background around top/bottom zig-zag cut teeth.
- 0 build errors on `npm run build` and PM2 restart.

---

### Task 1: Refactor Canvas Export Routine in `BrewHistory.jsx`

**Files:**
- Modify: `frontend/src/components/BrewHistory.jsx`

- [ ] **Step 1: Add Paper Texture & Fold Crease Drawing**

```javascript
// Central paper fold crease
ctx.save();
ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
ctx.lineWidth = 2;
ctx.beginPath();
ctx.moveTo(420, 15);
ctx.lineTo(420, 525);
ctx.stroke();
ctx.restore();
```

- [ ] **Step 2: Implement Itemized POS Register Table Layout**

```javascript
// Header Table Columns
ctx.font = '800 17px "JetBrains Mono", monospace';
ctx.fillStyle = colorTextMuted;
drawTruncatedText('CANT.  DESCRIPCIÓN                        VALOR', 50, 125, 740);

ctx.strokeStyle = '#CBD5E1';
ctx.lineWidth = 1.5;
ctx.beginPath(); ctx.moveTo(50, 138); ctx.lineTo(790, 138); ctx.stroke();

// Table Rows
ctx.font = '800 20px "JetBrains Mono", monospace';
ctx.fillStyle = colorTextDark;

if (incRecipe) {
  drawTruncatedText('1x     GRANO:', 50, 175, 220);
  drawTruncatedText(String(recipe.batch_name || 'N/A').toUpperCase(), 230, 175, 360);
  drawTruncatedText(recipe.batch_roaster ? String(recipe.batch_roaster).toUpperCase() : 'SPECIALTY', 610, 175, 180);

  drawTruncatedText('1x     MÉTODO:', 50, 215, 220);
  drawTruncatedText(String(recipe.method || 'N/A').toUpperCase(), 230, 215, 360);
  drawTruncatedText(`${recipe.dose_in_g || 20}G`, 610, 215, 180);

  drawTruncatedText('1x     MOLIENDA:', 50, 255, 220);
  drawTruncatedText(String(recipe.grind || 'N/A').toUpperCase(), 230, 255, 360);
  drawTruncatedText(recipe.temperature || '93°C', 610, 255, 180);

  drawTruncatedText('1x     RATIO/TIEMPO:', 50, 295, 220);
  drawTruncatedText(String(recipe.ratio || '1:15').toUpperCase(), 230, 295, 360);
  drawTruncatedText(String(recipe.brew_time || '2:30').toUpperCase(), 610, 295, 180);
} else {
  drawTruncatedText('1x     GRANO:', 50, 175, 220);
  drawTruncatedText(String(recipe.batch_name || 'N/A').toUpperCase(), 230, 175, 360);
  drawTruncatedText(recipe.batch_origin ? String(recipe.batch_origin).toUpperCase() : 'ORIGEN', 610, 175, 180);

  drawTruncatedText('1x     PRODUCTOR:', 50, 215, 220);
  drawTruncatedText(String(recipe.batch_producer || 'N/A').toUpperCase(), 230, 215, 360);
  drawTruncatedText('LOTE', 610, 215, 180);

  drawTruncatedText('1x     VARIEDAD:', 50, 255, 220);
  drawTruncatedText(String(recipe.batch_variety || 'N/A').toUpperCase(), 230, 255, 360);
  drawTruncatedText(recipe.batch_altitude ? String(recipe.batch_altitude).toUpperCase() : 'ALTITUD', 610, 255, 180);

  drawTruncatedText('1x     PROCESO:', 50, 295, 220);
  drawTruncatedText(String(recipe.batch_process || 'N/A').toUpperCase(), 230, 295, 360);
  drawTruncatedText(recipe.batch_roast_date ? String(recipe.batch_roast_date).toUpperCase() : 'TUESTE', 610, 295, 180);
}
```

- [ ] **Step 3: Test Build & Restart PM2**

```bash
cd /var/www/beantag/frontend && npm run build && pm2 restart beantag
git add .
git commit -m "feat: implement itemized POS register table and paper crease texture on Barista Ticket share card"
```
