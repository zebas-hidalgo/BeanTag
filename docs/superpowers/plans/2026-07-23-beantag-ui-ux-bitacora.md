# Sub-proyecto A: UI/UX & Filtros de Bitácora Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar barra de búsqueda en tiempo real, chips de filtrado táctil por Método/Resultado, animación de entrada y estado vacío a `BrewHistory.jsx`.

**Architecture:** Extender el estado interno de `BrewHistory.jsx` con tres nuevos estados (`searchTerm`, `selectedMethod`, `selectedExtractionResult`). Añadir una sección UI de búsqueda y badges horizontales con desplazamiento táctil. Definir reglas CSS de micro-animación en `index.css`.

**Tech Stack:** React, CSS, Lucide-React (`Search`, `X`, `Filter`, `RotateCcw`), Vite.

## Global Constraints

* Nombre del componente: `BrewHistory.jsx` en `beantag/frontend/src/components/BrewHistory.jsx`.
* Estilos CSS: `beantag/frontend/src/index.css`.
* Sin romper la funcionalidad existente de exportación Canvas ni modal de detalle.

---

### Task 1: CSS Animation & Filter Bar Styles

**Files:**
- Modify: `beantag/frontend/src/index.css`

**Interfaces:**
- Produces: Clases CSS `.soft-fade-in`, `.filter-chip`, `.filter-chip.active`, `.filter-scroll-container` para consumo en `BrewHistory.jsx`.

- [ ] **Step 1: Add keyframes and filter styles to index.css**

```css
@keyframes softFadeIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.soft-fade-in {
  animation: softFadeIn 250ms var(--transition-spring, ease-out);
}

.filter-scroll-container {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 4px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.filter-scroll-container::-webkit-scrollbar {
  display: none;
}

.filter-chip {
  flex: 0 0 auto;
  font-family: var(--font-heading);
  font-size: 11px;
  padding: 6px 12px;
  border-radius: 20px;
  border: 2px solid var(--border-color);
  background-color: var(--bg-card);
  color: var(--color-text);
  cursor: pointer;
  font-weight: 700;
  transition: all 150ms ease;
  user-select: none;
}

.filter-chip:hover {
  transform: translateY(-1px);
}

.filter-chip.active {
  background-color: var(--color-crimson);
  color: #FFFFFF;
  border-color: var(--border-color);
  box-shadow: 2px 2px 0px var(--border-color);
}
```

- [ ] **Step 2: Verify CSS builds without error**

Run: `npm run build` in `beantag/frontend`
Expected: PASS with 0 errors.

- [ ] **Step 3: Commit**

```bash
git add beantag/frontend/src/index.css
git commit -m "style: add filter chips and soft fade in animations to index.css"
```

---

### Task 2: Implement Filter Logic and Search UI in BrewHistory.jsx

**Files:**
- Modify: `beantag/frontend/src/components/BrewHistory.jsx`

**Interfaces:**
- Consumes: Clases CSS `.soft-fade-in`, `.filter-chip`, `.filter-scroll-container`
- Produces: `filteredHistory` array renderizado dinámicamente.

- [ ] **Step 1: Add Lucide icons and component states in BrewHistory.jsx**

Import `Search`, `RotateCcw` from `'lucide-react'`:
```javascript
import { Trash2, Image as ImageIcon, Share2, ClipboardCopy, X, Search, RotateCcw } from 'lucide-react';
```

In `BrewHistory`:
```javascript
const [searchTerm, setSearchTerm] = useState('');
const [selectedMethod, setSelectedMethod] = useState('Todos');
const [selectedExtractionResult, setSelectedExtractionResult] = useState('Todos');
```

- [ ] **Step 2: Add filtered history memo logic**

```javascript
const filteredHistory = (history || []).filter(recipe => {
  // 1. Text Search Filter
  if (searchTerm.trim()) {
    const term = searchTerm.toLowerCase();
    const batchName = (recipe.batch_name || '').toLowerCase();
    const roaster = (recipe.batch_roaster || recipe.roaster || '').toLowerCase();
    const origin = (recipe.batch_origin || recipe.origin || '').toLowerCase();
    const notes = (recipe.notes || '').toLowerCase();
    
    const matchesText = batchName.includes(term) || roaster.includes(term) || origin.includes(term) || notes.includes(term);
    if (!matchesText) return false;
  }

  // 2. Method Filter
  if (selectedMethod !== 'Todos') {
    if (recipe.method !== selectedMethod) return false;
  }

  // 3. Extraction Result Filter
  if (selectedExtractionResult !== 'Todos') {
    const ext = recipe.sensory_extraction || '';
    if (selectedExtractionResult === 'En Punto' && ext !== 'En Punto') return false;
    if (selectedExtractionResult === 'Sub' && ext !== 'Sub') return false;
    if (selectedExtractionResult === 'Sobre' && ext !== 'Sobre') return false;
  }

  return true;
});
```

- [ ] **Step 3: Render Search Bar & Touch Chips Filter UI**

Place above the list rendering in `BrewHistory.jsx`:
```jsx
{/* Control de Filtros */}
<div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
  {/* Search Input */}
  <div style={{ position: 'relative', width: '100%' }}>
    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
    <input
      type="text"
      className="candy-input"
      placeholder="Buscar por lote, tostador u origen..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      style={{ paddingLeft: '36px', paddingRight: searchTerm ? '36px' : '12px', margin: 0, width: '100%', boxSizing: 'border-box' }}
    />
    {searchTerm && (
      <button
        type="button"
        onClick={() => setSearchTerm('')}
        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        <X size={16} color="var(--color-text)" />
      </button>
    )}
  </div>

  {/* Badges por Método */}
  <div className="filter-scroll-container">
    {['Todos', 'V60 (Filtrado)', 'Espresso', 'AeroPress', 'Prensa Francesa'].map(method => (
      <button
        key={method}
        type="button"
        className={`filter-chip ${selectedMethod === method ? 'active' : ''}`}
        onClick={() => setSelectedMethod(method)}
      >
        {method === 'V60 (Filtrado)' ? '☕ V60' : method === 'Espresso' ? '☕ Espresso' : method === 'AeroPress' ? '🧪 AeroPress' : method === 'Prensa Francesa' ? '🫖 Prensa' : 'Todos'}
      </button>
    ))}
  </div>

  {/* Badges por Resultado y Reset */}
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
    <div className="filter-scroll-container" style={{ flex: 1 }}>
      {[
        { label: 'Todos', value: 'Todos' },
        { label: '🎯 En Punto', value: 'En Punto' },
        { label: '⚡ Sub-ext', value: 'Sub' },
        { label: '🔥 Sobre-ext', value: 'Sobre' }
      ].map(res => (
        <button
          key={res.value}
          type="button"
          className={`filter-chip ${selectedExtractionResult === res.value ? 'active' : ''}`}
          onClick={() => setSelectedExtractionResult(res.value)}
        >
          {res.label}
        </button>
      ))}
    </div>

    {(searchTerm || selectedMethod !== 'Todos' || selectedExtractionResult !== 'Todos') && (
      <button
        type="button"
        className="btn-candy"
        onClick={() => {
          setSearchTerm('');
          setSelectedMethod('Todos');
          setSelectedExtractionResult('Todos');
        }}
        style={{ padding: '6px 10px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px', margin: 0 }}
      >
        <RotateCcw size={12} />
        Limpiar
      </button>
    )}
  </div>

  {/* Counter Badge */}
  <div style={{ fontSize: '10px', fontFamily: 'var(--font-heading)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
    Mostrando {filteredHistory.length} de {history?.length || 0} extracciones
  </div>
</div>
```

- [ ] **Step 4: Update Recipe List rendering and Empty State**

Update list mapping from `history.map(...)` to `filteredHistory.map(...)` and apply `.soft-fade-in` class to cards.
Add Empty State if `filteredHistory.length === 0`:
```jsx
{filteredHistory.length === 0 ? (
  <div className="candy-card static soft-fade-in" style={{ textAlign: 'center', padding: '32px 16px' }}>
    <p style={{ fontFamily: 'var(--font-heading)', fontSize: '14px', margin: '0 0 8px 0' }}>
      ☕ No se encontraron extracciones
    </p>
    <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: '0 0 16px 0' }}>
      Intenta cambiar el término de búsqueda o restablecer los filtros.
    </p>
    <button
      type="button"
      className="btn-candy primary"
      onClick={() => {
        setSearchTerm('');
        setSelectedMethod('Todos');
        setSelectedExtractionResult('Todos');
      }}
      style={{ padding: '8px 16px', fontSize: '12px' }}
    >
      Restablecer Filtros
    </button>
  </div>
) : (
  filteredHistory.map(recipe => (
    <div key={recipe.id} className="candy-card soft-fade-in" ...>
      ...
    </div>
  ))
)}
```

- [ ] **Step 5: Verify build**

Run: `npm run build` in `beantag/frontend`
Expected: PASS with 0 errors.

- [ ] **Step 6: Commit**

```bash
git add beantag/frontend/src/components/BrewHistory.jsx
git commit -m "feat: add real-time search, touch filter chips, and empty state to BrewHistory"
```
