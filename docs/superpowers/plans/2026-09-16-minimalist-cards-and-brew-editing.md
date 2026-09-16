# Minimalist Image-Free Cards & Brew Log Editing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform all cards into a 100% typography-first minimalist aesthetic (eliminating all raster hero and metric images) and implement full editing of brew logs in BeanTag.

**Architecture:** 
- Backend: Expose `PUT /api/recipes/:id` in `backend/server.js` with authentication/ownership checks to update extraction variables and sensory evaluation.
- Frontend: Add an "Editar" action and comprehensive edit modal in `frontend/src/components/BrewHistory.jsx` with instant state synchronization.
- Canvas Engine: Refactor `frontend/src/utils/cardGenerator.js` to strip `drawHeroAsset` and raster metric icons across all 4 styles (Blueprint, Neobrutalist, Aurora, Hangtag) in Recipe, Solo Grano, and Menu cards, rebalancing negative space and typographic hierarchy.

**Tech Stack:** Node.js, Express, SQLite, React 18, HTML5 Canvas 2D, Lucide React, Vitest/ESM verification scripts.

---

### Task 1: Backend API: Recipe Editing (`PUT /api/recipes/:id`)

**Files:**
- Modify: `backend/server.js:380-405`
- Test: `scripts/test_recipe_put.mjs`

- [ ] **Step 1: Write the failing test script `scripts/test_recipe_put.mjs`**

```javascript
// scripts/test_recipe_put.mjs
import { getDb } from '../backend/db.js';

async function run() {
  const db = await getDb();
  // Find or insert a test recipe
  let testBatch = await db.get('SELECT id FROM batches LIMIT 1');
  if (!testBatch) {
    const res = await db.run(`INSERT INTO batches (name, producer, total_doses, remaining_doses) VALUES ('Test Coffee', 'Test Producer', 10, 10)`);
    testBatch = { id: res.lastID };
  }

  const recipeRes = await db.run(
    `INSERT INTO recipes (batch_id, method, ratio, grind, temperature, brew_time, notes, sensory_balance)
     VALUES (?, 'V60 (Filtrado)', '1:16', 'J-Max 2.4.0', '93°C', '2:45', 'Original note', 'Equilibrado')`,
    [testBatch.id]
  );
  const recipeId = recipeRes.lastID;

  // Test fetch PUT to local server endpoint
  const response = await fetch(`http://localhost:3000/api/recipes/${recipeId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      method: 'Kalita Wave',
      ratio: '1:15',
      grind: 'J-Max 2.5.0',
      temperature: '92°C',
      brew_time: '3:00',
      notes: 'Updated note from test',
      sensory_balance: 'Acidez brillante',
      sensory_body: 'Sedoso',
      sensory_extraction: 'En Punto'
    })
  });

  if (!response.ok) {
    console.error('Test failed: status', response.status);
    process.exit(1);
  }

  const updated = await db.get('SELECT * FROM recipes WHERE id = ?', recipeId);
  if (updated.method !== 'Kalita Wave' || updated.notes !== 'Updated note from test') {
    console.error('Test failed: DB not updated properly', updated);
    process.exit(1);
  }

  // Cleanup test recipe
  await db.run('DELETE FROM recipes WHERE id = ?', recipeId);
  console.log('✅ PUT /api/recipes/:id test passed successfully');
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/test_recipe_put.mjs`
Expected: FAIL with status 404 (Cannot PUT /api/recipes/:id)

- [ ] **Step 3: Implement `PUT /api/recipes/:id` in `backend/server.js`**

Add right before `app.delete('/api/recipes/:id')`:

```javascript
// Update brew recipe
app.put('/api/recipes/:id', async (req, res) => {
  const {
    method, ratio, grind, temperature, brew_time, rating, notes,
    sensory_balance, sensory_body, sensory_extraction,
    dose_in_g, dose_out_g, espresso_pressure, espresso_preinfusion
  } = req.body;

  if (!method) {
    return res.status(400).json({ error: 'El método es obligatorio' });
  }

  try {
    const db = await getDb();
    const recipe = await db.get(
      'SELECT r.id, r.batch_id, b.user_id FROM recipes r JOIN batches b ON r.batch_id = b.id WHERE r.id = ?',
      req.params.id
    );

    if (!recipe) {
      return res.status(404).json({ error: 'Receta no encontrada' });
    }

    if (recipe.user_id !== null && (!req.user || req.user.id !== recipe.user_id)) {
      return res.status(403).json({ error: 'Solo el propietario puede editar esta receta.' });
    }

    await db.run(
      `UPDATE recipes 
       SET method = ?, ratio = ?, grind = ?, temperature = ?, brew_time = ?, 
           rating = ?, notes = ?, sensory_balance = ?, sensory_body = ?, sensory_extraction = ?,
           dose_in_g = ?, dose_out_g = ?, espresso_pressure = ?, espresso_preinfusion = ?
       WHERE id = ?`,
      [
        method, ratio, grind, temperature, brew_time,
        rating, notes, sensory_balance, sensory_body, sensory_extraction,
        dose_in_g !== undefined ? parseFloat(dose_in_g) : null,
        dose_out_g !== undefined ? parseFloat(dose_out_g) : null,
        espresso_pressure !== undefined ? parseFloat(espresso_pressure) : null,
        espresso_preinfusion !== undefined ? parseFloat(espresso_preinfusion) : null,
        req.params.id
      ]
    );

    const updatedRecipe = await db.get(`
      SELECT r.*, 
             b.name as batch_name, 
             b.variety as batch_variety,
             b.producer as batch_producer,
             b.altitude as batch_altitude,
             b.origin as batch_origin,
             b.roaster as batch_roaster,
             b.roast_level as batch_roast_level,
             b.roaster_notes as batch_roaster_notes,
             b.roast_date as batch_roast_date,
             b.process as batch_process
      FROM recipes r 
      JOIN batches b ON r.batch_id = b.id 
      WHERE r.id = ?
    `, req.params.id);

    res.json({ success: true, recipe: updatedRecipe });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node scripts/test_recipe_put.mjs`
Expected: PASS with `✅ PUT /api/recipes/:id test passed successfully`

- [ ] **Step 5: Commit changes**

```bash
git add backend/server.js scripts/test_recipe_put.mjs
git commit -m "feat(api): implement PUT /api/recipes/:id endpoint for editing brew logs"
```

---

### Task 2: Frontend Brew History: Recipe Edit Action and Modal

**Files:**
- Modify: `frontend/src/components/BrewHistory.jsx`

- [ ] **Step 1: Add Edit state and Edit Modal handlers to `BrewHistory.jsx`**

Import `Pencil` or `Edit3` from `lucide-react`:
```javascript
import { Trash2, Image as ImageIcon, Share2, ClipboardCopy, X, Search, RotateCcw, Filter, Zap, Droplet, Coffee, Edit3 } from 'lucide-react';
```

Add edit modal state:
```javascript
const [editingRecipe, setEditingRecipe] = useState(null);
const [editForm, setEditForm] = useState({
  method: '',
  grind: '',
  ratio: '',
  brew_time: '',
  temperature: '',
  sensory_balance: '',
  sensory_body: '',
  sensory_extraction: '',
  notes: '',
  rating: 0
});
const [savingEdit, setSavingEdit] = useState(false);
```

Add functions:
```javascript
const handleOpenEdit = (recipe) => {
  setEditingRecipe(recipe);
  setEditForm({
    method: recipe.method || '',
    grind: recipe.grind || '',
    ratio: recipe.ratio || '',
    brew_time: recipe.brew_time || '',
    temperature: recipe.temperature || '',
    sensory_balance: recipe.sensory_balance || '',
    sensory_body: recipe.sensory_body || '',
    sensory_extraction: recipe.sensory_extraction || '',
    notes: recipe.notes || '',
    rating: recipe.rating || 0
  });
};

const handleSaveEdit = async (e) => {
  if (e) e.preventDefault();
  if (!editingRecipe) return;
  setSavingEdit(true);

  try {
    const token = localStorage.getItem('beantag-token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(apiUrl(`api/recipes/${editingRecipe.id}`), {
      method: 'PUT',
      headers,
      body: JSON.stringify(editForm)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al actualizar receta');

    // Update history state immutably
    setHistory(prev => prev.map(r => r.id === editingRecipe.id ? data.recipe : r));
    // Update selectedRecipe so detail view updates immediately
    setSelectedRecipe(data.recipe);
    setEditingRecipe(null);
    if (showToast) showToast('Bitácora actualizada con éxito');
  } catch (err) {
    alert(err.message);
  } finally {
    setSavingEdit(false);
  }
};
```

- [ ] **Step 2: Add "Editar" button to detail modal in `BrewHistory.jsx`**

Inside the actions bar around line 625:
```jsx
<button 
  type="button" 
  className="btn-candy" 
  style={{ padding: '8px 10px', margin: 0, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }} 
  onClick={() => handleOpenEdit(selectedRecipe)}
>
  <Edit3 size={12} strokeWidth={2.5} />
  Editar
</button>
```

- [ ] **Step 3: Render the Edit Modal in `BrewHistory.jsx`**

Render a dedicated edit modal with clean Candy/Atelier styling, allowing user to adjust method, grind, ratio, time, temp, sensory selectors, and notes:

```jsx
{editingRecipe && (
  <div style={{
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(26, 5, 5, 0.55)',
    zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '16px', boxSizing: 'border-box'
  }} onClick={() => setEditingRecipe(null)}>
    <div className="candy-card static" style={{
      maxWidth: '420px', width: '100%', maxHeight: '90vh', overflowY: 'auto',
      padding: '20px', boxSizing: 'border-box',
      boxShadow: '8px 8px 0px var(--border-color)',
      animation: 'soft-pop 250ms var(--transition-spring)'
    }} onClick={(e) => e.stopPropagation()}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', margin: 0, textTransform: 'uppercase' }}>
          ✏️ Editar Bitácora
        </h3>
        <button type="button" onClick={() => setEditingRecipe(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Método</label>
          <input
            type="text"
            className="candy-input"
            value={editForm.method}
            onChange={(e) => setEditForm({ ...editForm, method: e.target.value })}
            required
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Molienda</label>
            <input
              type="text"
              className="candy-input"
              placeholder="Ej: J-Max 2.4.0"
              value={editForm.grind}
              onChange={(e) => setEditForm({ ...editForm, grind: e.target.value })}
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Ratio</label>
            <input
              type="text"
              className="candy-input"
              placeholder="Ej: 1:16"
              value={editForm.ratio}
              onChange={(e) => setEditForm({ ...editForm, ratio: e.target.value })}
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Tiempo</label>
            <input
              type="text"
              className="candy-input"
              placeholder="Ej: 2:45"
              value={editForm.brew_time}
              onChange={(e) => setEditForm({ ...editForm, brew_time: e.target.value })}
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Temperatura</label>
            <input
              type="text"
              className="candy-input"
              placeholder="Ej: 93°C"
              value={editForm.temperature}
              onChange={(e) => setEditForm({ ...editForm, temperature: e.target.value })}
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* Sensory Evaluation Selection */}
        <div>
          <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Extracción</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['Sub', 'En Punto', 'Sobre'].map(ext => (
              <button
                key={ext}
                type="button"
                onClick={() => setEditForm({ ...editForm, sensory_extraction: editForm.sensory_extraction === ext ? '' : ext })}
                style={{
                  flex: 1, padding: '6px', fontSize: '11px', fontWeight: 'bold', borderRadius: '6px',
                  border: editForm.sensory_extraction === ext ? '2px solid var(--color-crimson)' : '1px solid var(--border-color)',
                  background: editForm.sensory_extraction === ext ? 'var(--bg-header)' : '#FFF',
                  cursor: 'pointer'
                }}
              >
                {ext === 'Sub' ? 'Sub-ext' : ext === 'Sobre' ? 'Sobre-ext' : '🧪 En Punto'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Balance Sensorial</label>
          <input
            type="text"
            className="candy-input"
            placeholder="Ej: Acidez brillante, Equilibrado, Dulzor predominante"
            value={editForm.sensory_balance}
            onChange={(e) => setEditForm({ ...editForm, sensory_balance: e.target.value })}
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Cuerpo</label>
          <input
            type="text"
            className="candy-input"
            placeholder="Ej: Sedoso, Jugoso, Ligero, Cremoso"
            value={editForm.sensory_body}
            onChange={(e) => setEditForm({ ...editForm, sensory_body: e.target.value })}
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Notas de Cata / Observaciones</label>
          <textarea
            className="candy-input"
            rows="3"
            placeholder="Observaciones de la extracción y notas de sabor..."
            value={editForm.notes}
            onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
            style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
          <button
            type="button"
            className="btn-candy"
            style={{ flex: 1, padding: '10px' }}
            onClick={() => setEditingRecipe(null)}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={savingEdit}
            className="btn-candy primary"
            style={{ flex: 1, padding: '10px' }}
          >
            {savingEdit ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  </div>
)}
```

- [ ] **Step 4: Verify build with `cd frontend && npm run build`**

Expected: Clean build, 0 errors.

- [ ] **Step 5: Commit changes**

```bash
git add frontend/src/components/BrewHistory.jsx
git commit -m "feat(brew-history): add edit recipe modal with instant state sync"
```

---

### Task 3: Refactor `cardGenerator.js` to Pure Minimalist Typography (Zero Images)

**Files:**
- Modify: `frontend/src/utils/cardGenerator.js`

- [ ] **Step 1: Strip `drawHeroAsset` and raster metric icons across all 4 styles in Recipe & Solo Grano cards**

In `frontend/src/utils/cardGenerator.js`:
- In `renderBlueprintBeanCard` & `renderBlueprintCard`:
  - Remove `drawHeroAsset` call and the hero container box.
  - Reallocate vertical space: Prominent technical schematic header, Coffee Name in bold blueprint uppercase (`32px`), Origin/Producer subtitle, and crisp vector crosshairs & dimension markings.
  - In `renderBlueprintCard`: For the 4 metric boxes (Molienda, Ratio, Tiempo, Temperatura), render a pure technical typographic layout: cyan monospace numbers, crisp small-caps labels, zero blurry raster icons.
- In `renderNeobrutalistBeanCard` & `renderNeobrutalistCard`:
  - Remove `drawHeroAsset` call.
  - Reallocate space: Huge punchy black headline (`34px`), acid lime `#D8FF3E` badge tag, and clean geometric bento metric grid with sharp solid 3px drop shadows.
  - For the 4 recipe parameters: Bold tabular values, clean labels, high-contrast monospace notation.
- In `renderAuroraBeanCard` & `renderAuroraCard`:
  - Remove `drawHeroAsset` call.
  - Reallocate space: Clean luminous white typography, glowing variety pill, 4 frosted glass cards with subtle border highlights (`rgba(255, 255, 255, 0.12)`) and gradient accents.
- In `renderHangtagBeanCard` & `renderHangtagCard` (Editorial Atelier):
  - Remove `drawHeroAsset` call.
  - Reallocate space: Refined Playfair Display serif typography (`34px`), generous optical white space, delicate hairlines (`0.75px #E5E0D8`), and discrete amber flavor pills.
  - Recipe metrics: Minimalist ledger with pure typography (e.g. `MOLIENDA // 2.4.0 (211µm)`, `RATIO // 1:16`, `TIEMPO // 2:45`, `TEMPERATURA // 93°C`), separated only by fine hairlines.

- [ ] **Step 2: Strip hero assets from `generateCoffeeMenuCardImage` across all 4 styles**

In `generateCoffeeMenuCardImage`:
- Remove `drawHeroAsset` calls from lines 1525, 1669, 1795, 1912.
- Remove `drawMetricAsset` calls inside menu card items and render clean, crisp typography and terroir pills.
- Center and balance the menu card header with refined typography.

- [ ] **Step 3: Run card verification script**

Run: `node scripts/verify_cards_render.mjs`
Expected: 12/12 configurations PASS with valid data URLs.

- [ ] **Step 4: Commit changes**

```bash
git add frontend/src/utils/cardGenerator.js
git commit -m "feat(cards): convert all card styles to pure image-free typography minimalism"
```

---

### Task 4: Automated Verification, Build & Deployment

**Files:**
- Modify: N/A (Build & scripts)

- [ ] **Step 1: Run frontend build**

Run: `cd frontend && npm run build`
Expected: 0 errors, production assets emitted to `backend/public/assets/`.

- [ ] **Step 2: Run card rendering verification test**

Run: `npm run test:cards`
Expected: 12/12 tests PASS.

- [ ] **Step 3: Run recipe editing integration test**

Run: `node scripts/test_recipe_put.mjs`
Expected: PASS.

- [ ] **Step 4: Push to origin/main and deploy to remote VPS**

Run git push and deploy commands to VPS `5.189.152.68`, restart PM2 process `beantag`, and verify HTTP 200.
