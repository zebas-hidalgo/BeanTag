# BeanTag UI/UX Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 4 key UI/UX enhancements in BeanTag: SCA flavor wheel colored chips, 1-click Quick Repeat Recipe button, "Espresso Roast" dark theme, and an interactive J-Max grinder dial widget.

**Architecture:** Frontend React updates in `BrewHistory.jsx`, `Inventory.jsx`, `RecipeForm.jsx`, `App.jsx`, `index.css`, and a new utility `src/utils/scaIcons.jsx`.

**Tech Stack:** React, Vanilla CSS variables, Lucide Icons, Vite, PM2.

## Global Constraints

- No external CSS framework dependencies (Vanilla CSS design system).
- Preserve existing API contracts and local state.
- Ensure 0 build errors on `npm run build` and restart PM2 upon completion.

---

### Task 1: SCA Flavor Wheel Color Chips Utility (`src/utils/scaIcons.jsx`)

**Files:**
- Create: `frontend/src/utils/scaIcons.jsx`
- Modify: `frontend/src/components/Inventory.jsx`
- Modify: `frontend/src/components/BrewHistory.jsx`

**Interfaces:**
- Consumes: Raw roaster/tasting notes string (e.g. `"Fresa, Chocolate, Jasmin"`)
- Produces: `getScaColorForNote(noteName)` returning `{ bg, border, text }` and `renderScaChips(notesString)` returning React chip elements.

- [ ] **Step 1: Create `src/utils/scaIcons.jsx` with category matcher and chip styling**

```jsx
import React from 'react';

export function getScaColorForNote(note) {
  const n = String(note || '').toLowerCase().trim();
  if (!n) return { bg: 'var(--bg-canvas)', border: 'var(--border-color)', text: 'var(--color-text)' };

  if (/fresa|cereza|mora|frambuesa|arándano|berry|frutos rojos|ciruela/i.test(n)) {
    return { bg: '#FFF5F5', border: '#E53E3E', text: '#C53030' };
  }
  if (/limón|naranja|cítrico|citrico|bergamota|pomelo|mandarina|manzana/i.test(n)) {
    return { bg: '#FFFAF0', border: '#DD6B20', text: '#C05621' };
  }
  if (/jazmín|jazmin|flor|rosa|lavanda|violeta|floral/i.test(n)) {
    return { bg: '#FAF5FF', border: '#805AD5', text: '#6B46C1' };
  }
  if (/chocolate|cacao|caramelo|miel|panela|vainilla|dulce/i.test(n)) {
    return { bg: '#FDF6E2', border: '#795548', text: '#4E342E' };
  }
  if (/avellana|nuez|almendra|frutos secos|canela|especias|clavo/i.test(n)) {
    return { bg: '#FEFCBF', border: '#D69E2E', text: '#B7791F' };
  }
  if (/vino|ron|anaeróbico|anaerobico|maceración|maceracion|fermentado/i.test(n)) {
    return { bg: '#FFF5F7', border: '#9B2C2C', text: '#742A2A' };
  }

  return { bg: '#F7FAFC', border: 'var(--border-color)', text: 'var(--color-text)' };
}

export function RenderScaChips({ notesStr, maxChips = 4 }) {
  if (!notesStr) return null;
  let clean = String(notesStr);
  if (clean.includes('[Notas: ') && clean.includes(']')) {
    const match = clean.match(/\[Notas: (.*?)\]/);
    if (match) clean = match[1];
  }
  if (clean.includes(' | ')) clean = clean.split(' | ')[0];

  const notesList = clean.split(/[,|•]/).map(s => s.trim()).filter(Boolean).slice(0, maxChips);
  if (notesList.length === 0) return null;

  return (
    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
      {notesList.map((note, idx) => {
        const colors = getScaColorForNote(note);
        return (
          <span key={idx} style={{
            fontSize: '9.5px',
            fontWeight: '800',
            padding: '2px 6px',
            borderRadius: '4px',
            backgroundColor: colors.bg,
            border: `1.5px solid ${colors.border}`,
            color: colors.text,
            textTransform: 'uppercase',
            display: 'inline-block'
          }}>
            {note}
          </span>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Render SCA Chips in `Inventory.jsx` coffee batch cards**

In `src/components/Inventory.jsx`, import `RenderScaChips` and render inside batch cards.

- [ ] **Step 3: Render SCA Chips in `BrewHistory.jsx` history cards**

In `src/components/BrewHistory.jsx`, import `RenderScaChips` and render inside history list cards.

- [ ] **Step 4: Test and Commit Task 1**

```bash
cd /var/www/beantag/frontend && npm run build
git add .
git commit -m "feat: add SCA flavor wheel color chips utility and integrate in Inventory and BrewHistory"
```

---

### Task 2: Quick Repeat Recipe Button ("Repetir Última Receta")

**Files:**
- Modify: `frontend/src/components/Inventory.jsx`
- Modify: `frontend/src/components/BatchDetail.jsx`

**Interfaces:**
- Consumes: `batch.recipes[0]`
- Produces: `onSelectBatch(batch, { prefillRecipe: batch.recipes[0] })`

- [ ] **Step 1: Add Quick Repeat button to batch cards in `Inventory.jsx`**

```jsx
{batch.recipes && batch.recipes.length > 0 && (
  <button 
    type="button" 
    className="btn-candy primary" 
    style={{ marginTop: '8px', width: '100%', fontSize: '10px', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
    onClick={(e) => {
      e.stopPropagation();
      onSelectBatch(batch, { prefillRecipe: batch.recipes[0] });
    }}
  >
    <Zap size={12} />
    Repetir Receta (#{batch.recipes[0].id} {batch.recipes[0].method})
  </button>
)}
```

- [ ] **Step 2: Pre-fill `RecipeForm` when `prefillRecipe` is passed to `onSelectBatch`**

In `src/components/BatchDetail.jsx`, pass `prefillRecipe` into `RecipeForm`.

- [ ] **Step 3: Test and Commit Task 2**

```bash
cd /var/www/beantag/frontend && npm run build
git add .
git commit -m "feat: add Quick Repeat Recipe button to Inventory batch cards"
```

---

### Task 3: "Espresso Roast" Dark Theme (`src/index.css` & `App.jsx`)

**Files:**
- Modify: `frontend/src/index.css`
- Modify: `frontend/src/App.jsx`

**Interfaces:**
- Consumes: `theme` state (`'light'` | `'espresso'`)
- Produces: Persistent `localStorage.getItem('beantag-theme')` toggle button in navigation header.

- [ ] **Step 1: Define `.theme-espresso` CSS variables in `src/index.css`**

```css
[data-theme="espresso"] {
  --bg-canvas: #120A08;
  --bg-card: #1E1412;
  --color-text: #F5EBE6;
  --color-text-muted: #A0AEC0;
  --border-color: #000000;
  --color-crimson: #FF5722;
}
```

- [ ] **Step 2: Add Theme Toggle Button to Navigation Header in `src/App.jsx`**

```jsx
const [theme, setTheme] = useState(() => localStorage.getItem('beantag-theme') || 'light');

useEffect(() => {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('beantag-theme', theme);
}, [theme]);

// Render button in top bar:
<button 
  type="button" 
  className="btn-candy" 
  style={{ padding: '4px 8px', fontSize: '11px', margin: 0 }}
  onClick={() => setTheme(t => t === 'light' ? 'espresso' : 'light')}
>
  {theme === 'light' ? '☕ Espresso Dark' : '☀️ Claro'}
</button>
```

- [ ] **Step 3: Test and Commit Task 3**

```bash
cd /var/www/beantag/frontend && npm run build
git add .
git commit -m "feat: add Espresso Roast dark theme and persistent navigation toggle"
```

---

### Task 4: Interactive J-Max Grinder Dial Widget (`src/components/RecipeForm.jsx`)

**Files:**
- Modify: `frontend/src/components/RecipeForm.jsx`

**Interfaces:**
- Consumes: `jmaxRot`, `jmaxNum`, `jmaxClick`
- Produces: Real-time particle spectrum gauge (`< 300µm Espresso` | `600-850µm Filter` | `> 900µm French Press`)

- [ ] **Step 1: Refactor J-Max Grind Widget in `src/components/RecipeForm.jsx`**

Replace dropdowns with stepped Neobrutalist pill selectors and visual spectrum gauge:

```jsx
<div className="bento-widget bento-full-row accent" style={{ padding: '14px' }}>
  <div className="bento-header">
    <span>Molienda 1Zpresso J-Max</span>
    <Coffee size={16} color="var(--color-crimson)" />
  </div>

  {/* Rotations */}
  <div style={{ marginTop: '10px' }}>
    <span style={{ fontSize: '10px', fontWeight: '900', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Rotación (0..4)</span>
    <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
      {[0, 1, 2, 3, 4].map(r => (
        <button key={r} type="button" className={`btn-candy ${jmaxRot === r ? 'primary' : ''}`} onClick={() => setJmaxRot(r)} style={{ flex: 1, padding: '4px', fontSize: '12px', minHeight: '30px', margin: 0 }}>
          {r}
        </button>
      ))}
    </div>
  </div>

  {/* Numbers */}
  <div style={{ marginTop: '8px' }}>
    <span style={{ fontSize: '10px', fontWeight: '900', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Número (0..8)</span>
    <div style={{ display: 'flex', gap: '4px', marginTop: '4px', overflowX: 'auto' }}>
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(n => (
        <button key={n} type="button" className={`btn-candy ${jmaxNum === n ? 'primary' : ''}`} onClick={() => setJmaxNum(n)} style={{ flex: 1, padding: '4px', fontSize: '11px', minHeight: '30px', margin: 0 }}>
          {n}
        </button>
      ))}
    </div>
  </div>

  {/* Clicks */}
  <div style={{ marginTop: '8px' }}>
    <span style={{ fontSize: '10px', fontWeight: '900', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Clic (0..9)</span>
    <div style={{ display: 'flex', gap: '3px', marginTop: '4px', overflowX: 'auto' }}>
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(c => (
        <button key={c} type="button" className={`btn-candy ${jmaxClick === c ? 'primary' : ''}`} onClick={() => setJmaxClick(c)} style={{ flex: 1, padding: '2px', fontSize: '10px', minHeight: '28px', margin: 0 }}>
          {c}
        </button>
      ))}
    </div>
  </div>

  {/* Microns Gauge Spectrum */}
  <div style={{ marginTop: '12px', padding: '10px', backgroundColor: 'var(--bg-canvas)', border: '2px solid var(--border-color)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <div>
      <div style={{ fontSize: '13px', fontWeight: '900', color: 'var(--color-text)' }}>~{currentMicrons} µm</div>
      <div style={{ fontSize: '9.5px', color: 'var(--color-text-muted)', fontWeight: 'bold' }}>
        {currentMicrons < 400 ? '☕ Espresso Fino' : currentMicrons < 850 ? '💧 Filtrado Medio (V60 / Aero)' : '🫖 Prensa Francesa Grueso'}
      </div>
    </div>
    <span style={{ fontSize: '18px' }}>{currentMicrons < 400 ? '⚡' : currentMicrons < 850 ? '☕' : '🫖'}</span>
  </div>
</div>
```

- [ ] **Step 2: Test and Commit Task 4**

```bash
cd /var/www/beantag/frontend && npm run build && pm2 restart beantag
git add .
git commit -m "feat: add interactive step-by-step J-Max grinder dial widget with particle spectrum gauge"
```
