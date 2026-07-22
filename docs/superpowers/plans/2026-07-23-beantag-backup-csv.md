# Sub-proyecto C: Backup Dual (JSON + CSV) & Modo Fusión Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Crear endpoint de exportación CSV para bitácora, actualizar endpoint de importación con modo `merge`, y actualizar `Settings.jsx` con modal de opción de importación y botón de exportar a CSV.

**Architecture:** Añadir ruta `GET /api/backup/export/csv` en `beantag/backend/server.js` con codificación UTF-8 + BOM. Actualizar `POST /api/backup/import` para soportar `mode === 'merge'` con `INSERT OR IGNORE`. Añadir interfaz en `Settings.jsx` para descargar CSV y elegir la estrategia de importación.

**Tech Stack:** Express (Node.js), SQLite, React, Lucide-React (`FileSpreadsheet`, `Download`, `Upload`, `RefreshCw`, `Layers`).

## Global Constraints

* Archivo backend: `beantag/backend/server.js`.
* Archivo frontend: `beantag/frontend/src/components/Settings.jsx`.
* Compatibilidad total con Microsoft Excel en CSV mediante BOM UTF-8 (`\uFEFF`).

---

### Task 1: Backend CSV Export and Merge Import Endpoints

**Files:**
- Modify: `beantag/backend/server.js:218-276`

**Interfaces:**
- Produces: `GET /api/backup/export/csv` y `POST /api/backup/import` (con parámetro `mode`).

- [ ] **Step 1: Add GET /api/backup/export/csv in server.js**

```javascript
// CSV Export: Export all recipes joined with batch information
app.get('/api/backup/export/csv', async (req, res) => {
  try {
    const db = await getDb();
    const rows = await db.all(`
      SELECT 
        r.id, r.created_at, b.name as batch_name, b.roaster, b.origin, b.variety, b.process,
        r.method, r.ratio, r.grind, r.temperature, r.brew_time, r.sensory_balance, r.sensory_body,
        r.sensory_extraction, r.dose_in_g, r.dose_out_g, r.notes
      FROM recipes r
      LEFT JOIN batches b ON r.batch_id = b.id
      ORDER BY r.created_at DESC
    `);

    // CSV Header
    const headers = [
      'ID', 'Fecha', 'Lote', 'Tostador', 'Origen', 'Variedad', 'Proceso',
      'Método', 'Ratio', 'Molienda (J-Max)', 'Temperatura', 'Tiempo Extracción',
      'Balance', 'Cuerpo', 'Resultado Sensorial', 'Dosis Entrada (g)', 'Dosis Salida (g)', 'Notas de Cata'
    ];

    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const cleanStr = String(str).replace(/"/g, '""');
      return `"${cleanStr}"`;
    };

    let csvContent = '\uFEFF'; // UTF-8 BOM for Excel compatibility
    csvContent += headers.map(escapeCsv).join(',') + '\n';

    rows.forEach(r => {
      const rowData = [
        r.id, r.created_at, r.batch_name, r.roaster, r.origin, r.variety, r.process,
        r.method, r.ratio, r.grind, r.temperature, r.brew_time, r.sensory_balance, r.sensory_body,
        r.sensory_extraction, r.dose_in_g, r.dose_out_g, r.notes
      ];
      csvContent += rowData.map(escapeCsv).join(',') + '\n';
    });

    const filename = `beantag_bitacora_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

- [ ] **Step 2: Update POST /api/backup/import in server.js to support merge mode**

```javascript
// JSON Backup: Import (replace or merge) database tables
app.post('/api/backup/import', async (req, res) => {
  const { batches, recipes, mode = 'replace' } = req.body;
  if (!Array.isArray(batches) || !Array.isArray(recipes)) {
    return res.status(400).json({ error: 'Formato de backup inválido' });
  }
  try {
    const db = await getDb();
    
    if (mode === 'replace') {
      await db.run('DELETE FROM recipes');
      await db.run('DELETE FROM batches');
    }

    const insertBatchSql = mode === 'merge' 
      ? `INSERT OR IGNORE INTO batches (id, name, producer, altitude, variety, process, roaster, roaster_notes, dose_weight, total_doses, remaining_doses, origin, roast_level, roast_date, freeze_date, total_weight_g, remaining_weight_g, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      : `INSERT INTO batches (id, name, producer, altitude, variety, process, roaster, roaster_notes, dose_weight, total_doses, remaining_doses, origin, roast_level, roast_date, freeze_date, total_weight_g, remaining_weight_g, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    for (const b of batches) {
      await db.run(insertBatchSql, [
        b.id, b.name, b.producer, b.altitude, b.variety, b.process, b.roaster, b.roaster_notes, 
        b.dose_weight, b.total_doses, b.remaining_doses, b.origin, b.roast_level, b.roast_date, b.freeze_date,
        b.total_weight_g !== undefined ? b.total_weight_g : 0, 
        b.remaining_weight_g !== undefined ? b.remaining_weight_g : 0,
        b.created_at
      ]);
    }

    const insertRecipeSql = mode === 'merge'
      ? `INSERT OR IGNORE INTO recipes (id, batch_id, method, ratio, grind, temperature, brew_time, rating, notes, sensory_balance, sensory_body, sensory_extraction, dose_in_g, dose_out_g, espresso_pressure, espresso_preinfusion, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      : `INSERT INTO recipes (id, batch_id, method, ratio, grind, temperature, brew_time, rating, notes, sensory_balance, sensory_body, sensory_extraction, dose_in_g, dose_out_g, espresso_pressure, espresso_preinfusion, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    for (const r of recipes) {
      await db.run(insertRecipeSql, [
        r.id, r.batch_id, r.method, r.ratio, r.grind, r.temperature, r.brew_time, r.rating, r.notes, 
        r.sensory_balance, r.sensory_body, r.sensory_extraction,
        r.dose_in_g, r.dose_out_g, r.espresso_pressure, r.espresso_preinfusion,
        r.created_at
      ]);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

- [ ] **Step 3: Commit backend changes**

```bash
git add beantag/backend/server.js
git commit -m "feat: add CSV export and merge import mode to server.js"
```

---

### Task 2: Frontend Import Modal and CSV Export Button in Settings.jsx

**Files:**
- Modify: `beantag/frontend/src/components/Settings.jsx`

**Interfaces:**
- Consumes: Endpoints `/api/backup/export/csv` y `/api/backup/import`.

- [ ] **Step 1: Add Lucide icon FileSpreadsheet and import modal state in Settings.jsx**

Import `FileSpreadsheet` from `'lucide-react'`.
Add state `const [pendingImportData, setPendingImportData] = useState(null);`.
Add state `const [importMode, setImportMode] = useState('merge');`.

- [ ] **Step 2: Add CSV export handler in Settings.jsx**

```javascript
const handleExportCsv = () => {
  window.open('/api/backup/export/csv', '_blank');
  if (showToast) {
    showToast('Generando descarga de bitácora en CSV...', { type: 'success', duration: 2500 });
  }
};
```

- [ ] **Step 3: Update handleImportBackup to store pending file data**

```javascript
const handleImportBackup = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const backupData = JSON.parse(event.target.result);
      if (!backupData.batches || !backupData.recipes) {
        if (showToast) showToast('Formato de archivo de respaldo no válido.', { type: 'error', duration: 3000 });
        return;
      }
      setPendingImportData(backupData);
    } catch (err) {
      if (showToast) showToast('Error al leer el archivo JSON.', { type: 'error', duration: 3000 });
    }
  };
  reader.readAsText(file);
  e.target.value = '';
};

const confirmImportWithMode = () => {
  if (!pendingImportData) return;
  fetch('/api/backup/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...pendingImportData, mode: importMode })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      if (showToast) showToast('Respaldo procesado con éxito.', { type: 'success', duration: 3000 });
      setPendingImportData(null);
      window.location.reload();
    } else {
      if (showToast) showToast('Error al importar datos.', { type: 'error', duration: 3000 });
    }
  })
  .catch(() => {
    if (showToast) showToast('Error de conexión con el servidor.', { type: 'error', duration: 3000 });
  });
};
```

- [ ] **Step 4: Update Copia de Seguridad section UI & Render Import Modal**

In `Settings.jsx`:
```jsx
{/* Backup & CSV Section */}
<div className="candy-card static" style={{ padding: '20px', cursor: 'default' }}>
  <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '11px', textTransform: 'uppercase', margin: '0 0 12px 0', color: 'var(--color-crimson)', letterSpacing: '0.5px' }}>
    Copia de Seguridad & Portabilidad
  </h4>
  <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: '0 0 16px 0', lineHeight: 1.4 }}>
    Descarga tus lotes y bitácoras en formato JSON o CSV (Excel), o importa un archivo de respaldo.
  </p>
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
    <div style={{ display: 'flex', gap: '8px' }}>
      <button className="btn-candy primary" style={{ margin: 0, fontSize: '11.5px', padding: '10px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} onClick={handleExportBackup}>
        <Download size={16} strokeWidth={2.5} />
        Respaldo JSON
      </button>
      <button className="btn-candy" style={{ margin: 0, fontSize: '11.5px', padding: '10px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} onClick={handleExportCsv}>
        <FileSpreadsheet size={16} strokeWidth={2.5} />
        Exportar CSV (Excel)
      </button>
    </div>
    <label className="btn-candy" style={{ margin: 0, fontSize: '11.5px', padding: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxSizing: 'border-box' }}>
      <Upload size={16} strokeWidth={2.5} />
      Cargar Respaldo JSON...
      <input type="file" accept=".json" onChange={handleImportBackup} style={{ display: 'none' }} />
    </label>
  </div>
</div>

{/* Import Confirmation Modal */}
{pendingImportData && (
  <div style={{
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(26, 5, 5, 0.75)', zIndex: 130,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
  }} onClick={() => setPendingImportData(null)}>
    <div className="candy-card static" style={{ maxWidth: '420px', width: '100%', padding: '20px' }} onClick={e => e.stopPropagation()}>
      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', textTransform: 'uppercase', margin: '0 0 10px 0' }}>
        📥 Importar Respaldo
      </h3>
      <p style={{ fontSize: '12px', margin: '0 0 14px 0', lineHeight: '1.4' }}>
        El archivo contiene <strong>{pendingImportData.batches?.length || 0} lotes</strong> y <strong>{pendingImportData.recipes?.length || 0} extracciones</strong>. Selecciona la estrategia:
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '12px', padding: '8px', border: '2px solid var(--border-color)', borderRadius: '4px', background: importMode === 'merge' ? 'var(--bg-canvas)' : 'transparent' }}>
          <input type="radio" name="importMode" value="merge" checked={importMode === 'merge'} onChange={() => setImportMode('merge')} />
          <div>
            <strong>➕ Fusionar Datos (Recomendado)</strong>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Mantiene tus lotes actuales e inserta solo los nuevos registros sin borrar nada.</div>
          </div>
        </label>

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '12px', padding: '8px', border: '2px solid var(--border-color)', borderRadius: '4px', background: importMode === 'replace' ? '#FED7D7' : 'transparent' }}>
          <input type="radio" name="importMode" value="replace" checked={importMode === 'replace'} onChange={() => setImportMode('replace')} />
          <div>
            <strong style={{ color: '#9B2C2C' }}>🔄 Reemplazar Todo</strong>
            <div style={{ fontSize: '11px', color: '#9B2C2C' }}>Elimina por completo la base de datos actual y la sustituye por el archivo.</div>
          </div>
        </label>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button type="button" className="btn-candy primary" style={{ flex: 1, padding: '10px', margin: 0 }} onClick={confirmImportWithMode}>
          Confirmar Importación
        </button>
        <button type="button" className="btn-candy" style={{ padding: '10px', margin: 0 }} onClick={() => setPendingImportData(null)}>
          Cancelar
        </button>
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 5: Verify build**

Run: `npm run build` in `beantag/frontend`
Expected: PASS with 0 errors.

- [ ] **Step 6: Commit**

```bash
git add beantag/frontend/src/components/Settings.jsx
git commit -m "feat: add CSV export and merge import strategy modal to Settings.jsx"
```
