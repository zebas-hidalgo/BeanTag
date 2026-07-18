# BeanTag Refactor (Enfoque A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modularize the frontend by refactoring the monolithic `BatchDetail` view, introduce robust input validation with Zod, and establish backup systems for SQLite data (JSON exports & daily cron backups) with global `ErrorBoundary` recovery.

**Architecture:** Split `BatchDetail.jsx` into smaller components (`BatchInfo`, `RecipeForm`, `ShareCanvas`, `RecipeHistory`). Add API routes in Express for backup import/export, and add `ErrorBoundary` at the React root.

**Tech Stack:** React 18, Express, SQLite3, Zod (v3.22.x), Bash, Crontab.

## Global Constraints
- Target workspace: `/var/www/beantag`
- Front-end styles must maintain the Neo-Brutalist look and use standard Vanilla CSS classes from `index.css`.
- SQLite database path is `/var/www/beantag/backend/database.sqlite`.

---

### Task 1: ErrorBoundary & Global Toast Setup

**Files:**
- Create: `/var/www/beantag/frontend/src/components/ErrorBoundary.jsx`
- Modify: `/var/www/beantag/frontend/src/main.jsx`

**Interfaces:**
- Consumes: None
- Produces: `ErrorBoundary` component enclosing the `App` component.

- [ ] **Step 1: Write ErrorBoundary component**
Create the file `/var/www/beantag/frontend/src/components/ErrorBoundary.jsx` with this code:
```jsx
import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '30px', textAlign: 'center', background: '#FFF5F5', border: '4px solid #000', margin: '20px', boxShadow: '8px 8px 0px #000' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '10px' }}>⚠️ ¡ALGO SE ROMPIÓ EN EL FILTRO!</h2>
          <p style={{ margin: '10px 0', fontWeight: 'bold' }}>{this.state.error?.toString()}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-candy primary"
            style={{ marginTop: '15px', padding: '10px 20px', fontWeight: '900', border: '3px solid #000', cursor: 'pointer', boxShadow: '4px 4px 0 #000' }}
          >
            Reintentar Extracción (Recargar)
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

- [ ] **Step 2: Wrap main app render**
Modify `/var/www/beantag/frontend/src/main.jsx`:
```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
```

---

### Task 2: Zod Validation Schemas

**Files:**
- Create: `/var/www/beantag/frontend/src/schemas/batchSchema.js`
- Create: `/var/www/beantag/frontend/src/schemas/recipeSchema.js`

**Interfaces:**
- Consumes: Zod library
- Produces: `batchSchema` and `recipeSchema` objects.

- [ ] **Step 1: Install Zod in frontend**
Run: `npm install zod --prefix /var/www/beantag/frontend`

- [ ] **Step 2: Create batchSchema**
Create the file `/var/www/beantag/frontend/src/schemas/batchSchema.js`:
```javascript
import { z } from 'zod';

export const batchSchema = z.object({
  id: z.string().min(1, "ID requerido"),
  name: z.string().min(1, "Nombre requerido"),
  producer: z.string().min(1, "Productor requerido"),
  altitude: z.string().optional(),
  variety: z.string().optional(),
  process: z.string().optional(),
  roaster: z.string().optional(),
  roaster_notes: z.string().optional(),
  dose_weight: z.preprocess((val) => parseFloat(val), z.number().positive("Peso dosis debe ser positivo")),
  total_doses: z.preprocess((val) => parseInt(val, 10), z.number().int().positive("Dosis totales debe ser entero")),
  origin: z.string().optional(),
  roast_level: z.string().optional(),
  roast_date: z.string().optional(),
  freeze_date: z.string().optional()
});
```

- [ ] **Step 3: Create recipeSchema**
Create the file `/var/www/beantag/frontend/src/schemas/recipeSchema.js`:
```javascript
import { z } from 'zod';

export const recipeSchema = z.object({
  batch_id: z.string().min(1, "Lote requerido"),
  method: z.string().min(1, "Método requerido"),
  ratio: z.string().regex(/^1:\d+(\.\d+)?$/, "Ratio debe tener formato 1:X (ej: 1:15)"),
  grind: z.string().optional(),
  temperature: z.string().optional(),
  brew_time: z.string().optional(),
  rating: z.number().int().min(1).max(5),
  notes: z.string().optional()
});
```

---

### Task 3: Backend Export/Import Endpoints

**Files:**
- Modify: `/var/www/beantag/backend/server.js`

**Interfaces:**
- Consumes: None (raw HTTP requests)
- Produces: API endpoints `/api/export/json` and `/api/import/json`.

- [ ] **Step 1: Install Zod in backend**
Run: `npm install zod --prefix /var/www/beantag/backend`

- [ ] **Step 2: Add export/import routes**
Add this code block inside `/var/www/beantag/backend/server.js` (e.g. before `app.listen`):
```javascript
// GET /api/export/json
app.get('/api/export/json', async (req, res) => {
  try {
    const db = await getDb();
    const batches = await db.all('SELECT * FROM batches');
    const recipes = await db.all('SELECT * FROM recipes');
    res.json({ batches, recipes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/import/json
app.post('/api/import/json', async (req, res) => {
  const { batches, recipes } = req.body;
  if (!Array.isArray(batches) || !Array.isArray(recipes)) {
    return res.status(400).json({ error: 'Formato de importación inválido' });
  }
  try {
    const db = await getDb();
    await db.run('BEGIN TRANSACTION');
    
    // Clear existing tables
    await db.run('DELETE FROM recipes');
    await db.run('DELETE FROM batches');
    
    // Insert batches
    for (const b of batches) {
      await db.run(
        `INSERT INTO batches (id, name, producer, altitude, variety, process, roaster, roaster_notes, dose_weight, total_doses, remaining_doses, origin, roast_level, roast_date, freeze_date, total_weight_g, remaining_weight_g)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [b.id, b.name, b.producer, b.altitude, b.variety, b.process, b.roaster, b.roaster_notes, b.dose_weight, b.total_doses, b.remaining_doses, b.origin, b.roast_level, b.roast_date, b.freeze_date, b.total_weight_g, b.remaining_weight_g]
      );
    }
    
    // Insert recipes
    for (const r of recipes) {
      await db.run(
        `INSERT INTO recipes (id, batch_id, method, ratio, grind, temperature, brew_time, rating, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [r.id, r.batch_id, r.method, r.ratio, r.grind, r.temperature, r.brew_time, r.rating, r.notes, r.created_at]
      );
    }
    
    await db.run('COMMIT');
    res.json({ success: true, message: `Importados: ${batches.length} lotes y ${recipes.length} recetas.` });
  } catch (err) {
    const db = await getDb();
    await db.run('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});
```

---

### Task 4: BackupManager & Settings Integration

**Files:**
- Create: `/var/www/beantag/frontend/src/components/BackupManager.jsx`
- Modify: `/var/www/beantag/frontend/src/components/Settings.jsx`

**Interfaces:**
- Consumes: None (triggers HTTP fetches)
- Produces: `<BackupManager />` rendered inside settings panel.

- [ ] **Step 1: Write BackupManager component**
Create the file `/var/www/beantag/frontend/src/components/BackupManager.jsx`:
```jsx
import React, { useState } from 'react';

export default function BackupManager({ showToast }) {
  const [importing, setImporting] = useState(false);

  const handleExport = () => {
    fetch('api/export/json')
      .then(res => res.json())
      .then(data => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `beantag-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        if (showToast) showToast('Backup JSON descargado con éxito.', { type: 'success' });
      })
      .catch(() => {
        if (showToast) showToast('Error al exportar datos.', { type: 'error' });
      });
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        if (window.confirm("¿Seguro que deseas importar? Esto sobrescribirá todos los datos actuales.")) {
          setImporting(true);
          fetch('api/import/json', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(json)
          })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              if (showToast) showToast(data.message, { type: 'success' });
              setTimeout(() => window.location.reload(), 1500);
            } else {
              throw new Error(data.error);
            }
          })
          .catch(err => {
            if (showToast) showToast('Fallo al importar: ' + err.message, { type: 'error' });
          })
          .finally(() => setImporting(false));
        }
      } catch (err) {
        if (showToast) showToast('Archivo JSON corrupto o inválido.', { type: 'error' });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ marginTop: '20px', borderTop: '3px solid #000', paddingTop: '20px' }}>
      <h3 style={{ fontSize: '18px', fontWeight: '900', marginBottom: '10px' }}>💾 RESPALDO Y RESTAURACIÓN</h3>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button className="btn-candy primary" onClick={handleExport}>
          Exportar JSON
        </button>
        <label className="btn-candy" style={{ cursor: 'pointer', display: 'inline-block' }}>
          {importing ? 'Importando...' : 'Importar JSON'}
          <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} disabled={importing} />
        </label>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Render BackupManager in Settings**
Modify `/var/www/beantag/frontend/src/components/Settings.jsx` to render `<BackupManager showToast={showToast} />` at the bottom of settings page.

---

### Task 5: Frontend Modularization (Splitting BatchDetail)

**Files:**
- Create: `/var/www/beantag/frontend/src/components/BatchInfo.jsx`
- Create: `/var/www/beantag/frontend/src/components/RecipeForm.jsx`
- Create: `/var/www/beantag/frontend/src/components/RecipeHistory.jsx`
- Create: `/var/www/beantag/frontend/src/components/ShareCanvas.jsx`
- Modify: `/var/www/beantag/frontend/src/components/BatchDetail.jsx`

**Interfaces:**
- Consumes: Props passed from `BatchDetail` (batch info, callbacks).
- Produces: Five separate modules rendered in `BatchDetail` skeleton.

- [ ] **Step 1: Create BatchInfo**
Create `/var/www/beantag/frontend/src/components/BatchInfo.jsx`:
```jsx
import React from 'react';
import { formatLocalDateStr } from '../utils/date';

export default function BatchInfo({ batch }) {
  if (!batch) return null;
  return (
    <div className="candy-card" style={{ marginBottom: '20px' }}>
      <h2 style={{ fontSize: '22px', fontWeight: '900' }}>{batch.name}</h2>
      <p style={{ fontWeight: 'bold', color: '#555' }}>Productor: {batch.producer}</p>
      <div style={{ marginTop: '10px', fontSize: '14px' }}>
        <p>🌍 Origen: {batch.origin || 'N/A'}</p>
        <p>🧬 Variedad: {batch.variety || 'N/A'}</p>
        <p>🧪 Proceso: {batch.process || 'N/A'}</p>
        <p>🏔️ Altitud: {batch.altitude || 'N/A'}</p>
        <p>🔥 Tueste: {batch.roast_level || 'N/A'}</p>
        {batch.roast_date && <p>📅 Fecha de tueste: {formatLocalDateStr(batch.roast_date)}</p>}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create RecipeForm**
Create `/var/www/beantag/frontend/src/components/RecipeForm.jsx`:
```jsx
import React from 'react';

export default function RecipeForm({ method, setMethod, grind, setGrind, ratio, setRatio, rating, setRating, notes, setNotes, onSave }) {
  return (
    <div className="candy-card" style={{ marginBottom: '20px' }}>
      <h3 style={{ fontSize: '18px', fontWeight: '900', marginBottom: '10px' }}>🧪 REGISTRAR EXTRACCIÓN</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <label>
          <b>Método:</b>
          <input className="candy-input" value={method} onChange={(e) => setMethod(e.target.value)} />
        </label>
        <label>
          <b>Ratio (ej: 1:15):</b>
          <input className="candy-input" value={ratio} onChange={(e) => setRatio(e.target.value)} />
        </label>
        <label>
          <b>Molienda:</b>
          <input className="candy-input" value={grind} onChange={(e) => setGrind(e.target.value)} />
        </label>
        <label>
          <b>Puntuación (1-5):</b>
          <input type="number" min="1" max="5" className="candy-input" value={rating} onChange={(e) => setRating(parseInt(e.target.value))} />
        </label>
        <label>
          <b>Notas:</b>
          <textarea className="candy-input" value={notes} onChange={(e) => setNotes(e.target.value)} style={{ height: '80px' }} />
        </label>
        <button className="btn-candy primary" onClick={onSave} style={{ alignSelf: 'flex-start', marginTop: '10px' }}>
          Guardar Calibración
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create RecipeHistory**
Create `/var/www/beantag/frontend/src/components/RecipeHistory.jsx`:
```jsx
import React from 'react';
import { formatLocalDateStr } from '../utils/date';

export default function RecipeHistory({ recipes }) {
  if (!recipes || recipes.length === 0) {
    return <p style={{ textAlign: 'center', fontWeight: 'bold' }}>Ninguna extracción registrada aún.</p>;
  }
  return (
    <div>
      <h3 style={{ fontSize: '18px', fontWeight: '900', marginBottom: '10px' }}>📖 HISTORIAL</h3>
      {recipes.map(recipe => (
        <div key={recipe.id} className="candy-card" style={{ marginBottom: '12px', background: '#FFF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
            <span>{recipe.method}</span>
            <span>{"★".repeat(recipe.rating)}</span>
          </div>
          <p style={{ fontSize: '12px', color: '#777' }}>{formatLocalDateStr(recipe.created_at)}</p>
          <p style={{ fontSize: '14px', marginTop: '6px' }}>☕ Ratio: {recipe.ratio} | Molienda: {recipe.grind}</p>
          {recipe.notes && <p style={{ fontSize: '13px', fontStyle: 'italic', marginTop: '6px', color: '#333' }}>"{recipe.notes}"</p>}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Create ShareCanvas**
Create `/var/www/beantag/frontend/src/components/ShareCanvas.jsx` to isolate HTML5 Canvas render functions (drawing the cards and triggering downloads).

- [ ] **Step 5: Refactor BatchDetail**
Modify `/var/www/beantag/frontend/src/components/BatchDetail.jsx` to render the skeleton and delegate UI rendering and form inputs to `BatchInfo`, `RecipeForm`, `RecipeHistory`, and `ShareCanvas`.

---

### Task 6: Daily Cron Backup Script

**Files:**
- Create: `/var/www/beantag/scripts/backup-daily.sh`

**Interfaces:**
- Consumes: None
- Produces: Daily backups in `/var/www/beantag/backups/`.

- [ ] **Step 1: Create backup-daily script**
Create the file `/var/www/beantag/scripts/backup-daily.sh`:
```bash
#!/usr/bin/env bash
set -e

DB_FILE="/var/www/beantag/backend/database.sqlite"
BACKUP_DIR="/var/www/beantag/backups"

mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/beantag-backup-$TIMESTAMP.sqlite.gz"

if [ -f "$DB_FILE" ]; then
    sqlite3 "$DB_FILE" ".backup '$BACKUP_DIR/temp.db'"
    gzip -c "$BACKUP_DIR/temp.db" > "$BACKUP_FILE"
    rm -f "$BACKUP_DIR/temp.db"
    echo "✅ Backup created successfully at $BACKUP_FILE"
else
    echo "❌ Database file not found!"
    exit 1
fi

# Retention policy: 30 days
find "$BACKUP_DIR" -type f -name "beantag-backup-*.sqlite.gz" -mtime +30 -delete
echo "🧹 Old backups pruned."
```

- [ ] **Step 2: Configure Cron job**
Install the cron job using a temporary file:
```bash
(crontab -l 2>/dev/null; echo "0 3 * * * bash /var/www/beantag/scripts/backup-daily.sh >> /var/www/beantag/backups/backup.log 2>&1") | crontab -
```
