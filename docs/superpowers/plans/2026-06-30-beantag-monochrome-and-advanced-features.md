# BeanTag Monochrome & Advanced Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar BeanTag al estilo suizo Minimalist Monochrome e implementar funciones avanzadas: campos adicionales (Origen, Nivel Tueste, Fecha Tueste, Fecha Congelación), buscador, filtros, calculadora de ratio y alertas de stock bajo.

**Architecture:** 
1. Migración SQLite mediante alteración segura en `database.js`.
2. Actualización de endpoints en `server.js`.
3. Reescritura del stylesheet global `index.css` en blanco y negro con contornos de `2px` y contención absoluta.
4. Actualización de componentes React para soportar los nuevos campos, calculadora de agua, steppers J-Max y buscador.

**Tech Stack:** SQLite, Express, React, CSS, Lucide-style inline SVGs.

---

## Tarea 1: Base de Datos SQLite y Rutas del Servidor

**Files:**
- Modify: `backend/database.js`
- Modify: `backend/server.js`

- [ ] **Step 1: Agregar columnas a batches en database.js**
  
  Inserta las consultas `ALTER TABLE` seguras en `initDb()` para añadir las nuevas columnas de metadatos si no existen.
  
  ```javascript
    // In database.js, inside initDb() after CREATE TABLE batches:
    try {
      await db.exec('ALTER TABLE batches ADD COLUMN origin TEXT;');
    } catch (e) {}
    try {
      await db.exec('ALTER TABLE batches ADD COLUMN roast_level TEXT;');
    } catch (e) {}
    try {
      await db.exec('ALTER TABLE batches ADD COLUMN roast_date TEXT;');
    } catch (e) {}
    try {
      await db.exec('ALTER TABLE batches ADD COLUMN freeze_date TEXT;');
    } catch (e) {}
  ```

- [ ] **Step 2: Actualizar POST /api/batches en server.js**
  
  Destructura los nuevos campos del `req.body` e insértalos en la consulta de inserción.
  
  ```javascript
  // In server.js, modify app.post('/api/batches'):
  app.post('/api/batches', async (req, res) => {
    const { id, name, producer, altitude, variety, process, roaster, roaster_notes, dose_weight, total_doses, origin, roast_level, roast_date, freeze_date } = req.body;
    if (!id || !name || !producer || !total_doses) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }
    try {
      const db = await getDb();
      await db.run(
        `INSERT INTO batches (id, name, producer, altitude, variety, process, roaster, roaster_notes, dose_weight, total_doses, remaining_doses, origin, roast_level, roast_date, freeze_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, name, producer, altitude, variety, process, roaster, roaster_notes, dose_weight, total_doses, total_doses, origin, roast_level, roast_date, freeze_date]
      );
      res.status(201).json({ success: true, id });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  ```

- [ ] **Step 3: Commit**
  
  ```bash
  git add backend/database.js backend/server.js
  git commit -m "feat: migrate SQLite table and update server route with origin, roast level, roast date, and freeze date"
  ```

---

## Tarea 2: Hoja de Estilos Minimalist Monochrome

**Files:**
- Modify: `frontend/src/index.css`

- [ ] **Step 1: Reemplazar el archivo CSS con la nueva especificación monocromática**
  
  Sobrescribir `frontend/src/index.css` para configurar variables monocromáticas, bordes de 2px, contenedores absolutos y J-Max fluido.
  
  ```css
  @import url('https://fonts.googleapis.com/css2?family=Comfortaa:wght@700&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@700&display=swap');

  :root {
    --color-bg: #FFFFFF;
    --color-navy: #000000;
    --color-text-muted: #4A5568;
    --color-border: #000000;
    
    --font-heading: 'Comfortaa', cursive;
    --font-body: 'Inter', sans-serif;
    --font-mono: 'JetBrains Mono', monospace;

    --transition-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
    --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  body {
    margin: 0;
    font-family: var(--font-body);
    background-color: #F7FAFC;
    color: var(--color-navy);
    -webkit-font-smoothing: antialiased;
    touch-action: manipulation;
  }

  .app-container {
    max-width: 480px;
    margin: 0 auto;
    background-color: var(--color-bg);
    min-height: 100dvh;
    position: relative; /* Clave para contención absoluta */
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    overflow-x: hidden;
    border-left: 2px solid var(--color-border);
    border-right: 2px solid var(--color-border);
  }

  /* Monochrome Box (Cards) */
  .candy-card {
    background-color: #FFFFFF;
    border: 2px solid var(--color-border);
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 14px;
    position: relative;
    cursor: pointer;
    transition: all var(--transition-fast);
    box-sizing: border-box;
  }

  .candy-card:active {
    transform: scale(0.98);
    background-color: #F8FAFC;
  }

  /* Alerta de Stock Bajo (Borde Punteado) */
  .candy-card.low-stock {
    border-style: dashed;
    border-color: #E53E3E; /* Rojo de advertencia sutil */
  }

  .bg-rose, .bg-peach, .bg-lime, .bg-lavender {
    background-color: #FFFFFF; /* Forzar blanco en monocromo */
  }

  /* Header */
  .app-header {
    background-color: #FFFFFF;
    border-bottom: 2px solid var(--color-border);
    padding: 16px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .app-header h1 {
    font-family: var(--font-heading);
    font-size: 18px;
    margin: 0;
    text-transform: uppercase;
    color: var(--color-navy);
  }

  /* Buttons */
  .btn-candy {
    background-color: #FFFFFF;
    border: 2px solid var(--color-border);
    border-radius: 0px; /* Esquinas rectas suizas */
    padding: 10px 16px;
    font-family: var(--font-heading);
    font-weight: bold;
    font-size: 12px;
    cursor: pointer;
    transition: all var(--transition-fast);
    color: var(--color-navy);
    text-transform: uppercase;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
  }

  .btn-candy:active {
    transform: scale(0.96);
    background-color: #F8FAFC;
  }

  .btn-candy.primary {
    background-color: #000000;
    color: #FFFFFF;
  }

  .btn-candy.primary:active {
    background-color: #2D3748;
  }

  .btn-candy.accent {
    background-color: #FFFFFF;
    color: #E53E3E;
    border-color: #E53E3E;
  }

  .app-bar-btn {
    border: 2px solid var(--color-border);
    background-color: #FFFFFF;
    padding: 6px 12px;
    font-family: var(--font-heading);
    font-weight: bold;
    font-size: 11px;
    cursor: pointer;
    text-transform: uppercase;
    color: var(--color-navy);
  }

  .app-bar-btn:active {
    background-color: #F8FAFC;
  }

  /* Inputs */
  .form-group {
    margin-bottom: 14px;
    box-sizing: border-box;
  }

  .form-group label {
    display: block;
    font-family: var(--font-heading);
    font-size: 10px;
    text-transform: uppercase;
    margin-bottom: 6px;
    font-weight: bold;
    color: var(--color-navy);
  }

  .candy-input {
    width: 100%;
    background-color: #FFFFFF;
    border: 2px solid var(--color-border);
    border-radius: 0px;
    padding: 10px 14px;
    font-family: var(--font-body);
    font-size: 13px;
    box-sizing: border-box;
    color: var(--color-navy);
    transition: all 0.2s;
  }

  .candy-input:focus {
    outline: none;
    background-color: #F8FAFC;
  }

  /* Steppers Fluid J-Max */
  .jmax-steppers-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-bottom: 14px;
  }

  .jmax-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .jmax-hdr-lbl {
    font-size: 9px;
    font-weight: 900;
    margin-bottom: 4px;
    text-transform: uppercase;
  }

  .mono-stepper {
    display: flex;
    border: 2px solid var(--color-border);
    background-color: #FFFFFF;
    width: 100%;
    align-items: center;
    box-sizing: border-box;
  }

  .stepper-btn {
    flex: 1;
    height: 32px;
    background: #FFFFFF;
    border: none;
    font-weight: bold;
    cursor: pointer;
    font-size: 16px;
    color: var(--color-navy);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.1s;
  }

  .stepper-btn:first-child {
    border-right: 2px solid var(--color-border);
  }

  .stepper-btn:last-child {
    border-left: 2px solid var(--color-border);
  }

  .stepper-btn:active {
    background-color: #F8FAFC;
  }

  .stepper-value {
    width: 32px;
    height: 32px;
    text-align: center;
    border: none;
    background: transparent;
    font-family: var(--font-mono);
    font-weight: bold;
    font-size: 13px;
    color: var(--color-navy);
  }

  /* Absolute Bottom Navigation Tab Bar (Restricted within container) */
  .nb-tabbar {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 64px;
    background-color: #FFFFFF;
    border-top: 2px solid var(--color-border);
    display: flex;
    justify-content: space-around;
    align-items: center;
    z-index: 50;
    box-sizing: border-box;
  }

  .tab-item {
    flex: 1;
    text-align: center;
    background: none;
    border: none;
    font-size: 9px;
    font-family: var(--font-heading);
    font-weight: bold;
    color: var(--color-navy);
    opacity: 0.45;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    text-transform: uppercase;
    padding: 8px 0;
    transition: all var(--transition-fast);
  }

  .tab-item.active {
    opacity: 1;
    border-bottom: 2px solid var(--color-navy);
    padding-bottom: 6px;
  }

  .tab-item svg {
    width: 18px;
    height: 18px;
    stroke: var(--color-navy);
    stroke-width: 2px;
    fill: none;
  }

  /* Absolute Toast Undo */
  .undo-toast {
    position: absolute;
    bottom: 76px;
    left: 16px;
    width: calc(100% - 32px);
    background-color: #000000;
    color: #FFFFFF;
    border: 2px solid var(--color-border);
    padding: 12px 18px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    z-index: 60;
    transform: translateY(150px);
    transition: transform 0.3s var(--transition-spring);
    font-weight: 700;
    box-sizing: border-box;
    font-size: 12px;
  }

  .undo-toast.show {
    transform: translateY(0);
  }

  .undo-btn {
    background-color: #FFFFFF;
    color: #000000;
    border: 2px solid var(--color-border);
    padding: 4px 10px;
    font-family: var(--font-heading);
    font-weight: bold;
    font-size: 10px;
    cursor: pointer;
    text-transform: uppercase;
  }

  .undo-btn:active {
    background-color: #F8FAFC;
  }

  /* Grid of fields */
  .details-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    border: 2px solid var(--color-border);
    padding: 12px;
    margin-bottom: 16px;
  }

  .grid-cell {
    border-bottom: 1px solid #E2E8F0;
    padding: 6px 0;
  }

  .grid-cell:nth-last-child(-n+2) {
    border-bottom: none;
  }

  .grid-lbl {
    font-size: 8px;
    text-transform: uppercase;
    font-weight: 700;
    color: var(--color-text-muted);
  }

  .grid-val {
    font-size: 12px;
    font-weight: 900;
  }

  /* Badges & Tags */
  .mono-badge-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 10px;
  }

  .mono-lbl-tag {
    background: #000000;
    color: #FFFFFF;
    padding: 3px 8px;
    font-size: 9px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .mono-lbl-tag.outline {
    background: #FFFFFF;
    color: #000000;
    border: 1px solid #000000;
  }

  .instr-box {
    border: 2px solid var(--color-border);
    background-color: #FEF3C7;
    padding: 12px;
    font-size: 11px;
    margin-top: 14px;
    color: #000000;
  }

  .nb-action-wrap {
    margin: 18px 0;
    position: relative;
    box-sizing: border-box;
  }

  /* Filter Toolbar */
  .filter-toolbar {
    display: flex;
    gap: 6px;
    margin-bottom: 14px;
    overflow-x: auto;
    padding-bottom: 4px;
  }

  .filter-btn {
    background: #FFFFFF;
    border: 2px solid var(--color-border);
    color: var(--color-navy);
    font-size: 9px;
    font-weight: 900;
    padding: 5px 10px;
    cursor: pointer;
    text-transform: uppercase;
  }

  .filter-btn.active {
    background: #000000;
    color: #FFFFFF;
  }
  ```

- [ ] **Step 2: Commit**
  
  ```bash
  git add frontend/src/index.css
  git commit -m "style: replace visual identity with Swiss Minimalist Monochrome and absolute container alignment"
  ```

---

## Tarea 3: Registro de Lotes con Nuevos Campos (Creador)

**Files:**
- Modify: `frontend/src/components/BatchCreator.jsx`

- [ ] **Step 1: Añadir campos de Origen, Tueste, Congelación y Nivel de Tueste**
  
  Modifica `BatchCreator.jsx` para declarar los nuevos estados React, inputs de formulario y enviar los datos correspondientes en la llamada POST.
  
  ```javascript
  // In BatchCreator.jsx:
  import React, { useState } from 'react';

  export default function BatchCreator({ onBatchCreated, onBack }) {
    const [name, setName] = useState('');
    const [producer, setProducer] = useState('');
    const [altitude, setAltitude] = useState('');
    const [variety, setVariety] = useState('');
    const [process, setProcess] = useState('');
    const [roaster, setRoaster] = useState('');
    const [notes, setNotes] = useState('');
    const [totalDoses, setTotalDoses] = useState(12);
    const [doseWeight, setDoseWeight] = useState('20.0g');
    const [generatedUrl, setGeneratedUrl] = useState('');
    
    // Nuevos Estados
    const [origin, setOrigin] = useState('');
    const [roastLevel, setRoastLevel] = useState('Medio');
    const [roastDate, setRoastDate] = useState('');
    const [freezeDate, setFreezeDate] = useState('');

    const handleSubmit = (e) => {
      e.preventDefault();
      const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      
      const payload = {
        id, name, producer, altitude, variety, process, roaster, roaster_notes: notes, dose_weight: doseWeight, total_doses: totalDoses,
        origin, roast_level: roastLevel, roast_date: roastDate, freeze_date: freezeDate
      };

      fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const host = window.location.origin;
          setGeneratedUrl(`${host}/batch/${id}`);
          if (onBatchCreated) onBatchCreated();
        }
      });
    };

    const copyUrl = () => {
      navigator.clipboard.writeText(generatedUrl);
      alert('¡Enlace único copiado al portapapeles!');
    };

    return (
      <div style={{ padding: '16px 16px 90px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <button className="btn-candy" onClick={onBack}>✕ Cancelar</button>
        </div>

        <h2 style={{ fontFamily: 'var(--font-heading)' }}>Registrar Lote</h2>
        <div className="candy-card" style={{ cursor: 'default' }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nombre del Café</label>
              <input className="candy-input" value={name} onChange={(e) => setName(e.target.value)} type="text" required placeholder="Ej. Pink Bourbon" />
            </div>
            
            <div className="form-group">
              <label>Productor / Finca</label>
              <input className="candy-input" value={producer} onChange={(e) => setProducer(e.target.value)} type="text" required placeholder="Ej. Nestor Lasso / El Diviso" />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Origen / País</label>
                <input className="candy-input" value={origin} onChange={(e) => setOrigin(e.target.value)} type="text" placeholder="Ej. Colombia" />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Nivel de Tueste</label>
                <select className="candy-input" style={{ height: '40px' }} value={roastLevel} onChange={(e) => setRoastLevel(e.target.value)}>
                  <option value="Claro">Claro (Light)</option>
                  <option value="Medio">Medio (Medium)</option>
                  <option value="Oscuro">Oscuro (Dark)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>📅 Fecha de Tueste</label>
                <input className="candy-input" value={roastDate} onChange={(e) => setRoastDate(e.target.value)} type="date" />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>❄️ Fecha de Congelado</label>
                <input className="candy-input" value={freezeDate} onChange={(e) => setFreezeDate(e.target.value)} type="date" />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Altitud</label>
                <input className="candy-input" value={altitude} onChange={(e) => setAltitude(e.target.value)} type="text" placeholder="Ej. 1800 msnm" />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Varietal</label>
                <input className="candy-input" value={variety} onChange={(e) => setVariety(e.target.value)} type="text" placeholder="Ej. Bourbon" />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Proceso</label>
                <input className="candy-input" value={process} onChange={(e) => setProcess(e.target.value)} type="text" placeholder="Ej. Anaeróbico" />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Tostador</label>
                <input className="candy-input" value={roaster} onChange={(e) => setRoaster(e.target.value)} type="text" placeholder="Ej. Coffee Circular" />
              </div>
            </div>

            <div className="form-group">
              <label>Notas de Cata (Tostador)</label>
              <input className="candy-input" value={notes} onChange={(e) => setNotes(e.target.value)} type="text" placeholder="Ej. Fresa, chocolate, cuerpo sedoso" />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Cantidad de Tubos</label>
                <div className="mono-stepper">
                  <button type="button" className="stepper-btn" onClick={() => setTotalDoses(d => Math.max(1, d - 1))}>-</button>
                  <div className="stepper-value">{totalDoses}</div>
                  <button type="button" className="stepper-btn" onClick={() => setTotalDoses(d => d + 1)}>+</button>
                </div>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Gramos por Tubo</label>
                <input className="candy-input" value={doseWeight} onChange={(e) => setDoseWeight(e.target.value)} type="text" />
              </div>
            </div>

            <button type="submit" className="btn-candy primary" style={{ width: '100%', marginTop: '10px' }}>Crear Lote y Obtener Link</button>
          </form>
        </div>

        {generatedUrl && (
          <div className="instr-box" style={{ marginTop: '16px' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '14px', marginTop: 0 }}>Enlace Único de Lote NFC</h3>
            <p style={{ fontSize: '11px', marginTop: 0 }}>Escribe este enlace en tus tags NFC usando la app "NFC Tools":</p>
            
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input className="candy-input" value={generatedUrl} readOnly style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', flex: 1 }} />
              <button type="button" className="btn-candy primary" style={{ margin: 0 }} onClick={copyUrl}>Copiar</button>
            </div>
          </div>
        )}
      </div>
    );
  }
  ```

- [ ] **Step 2: Commit**
  
  ```bash
  git add frontend/src/components/BatchCreator.jsx
  git commit -m "feat: add input fields for origin, roast level, roast date, and freeze date in BatchCreator"
  ```

---

## Tarea 4: Detalles del Lote con J-Max R.N.C y Calculadora Dinámica

**Files:**
- Modify: `frontend/src/components/BatchDetail.jsx`

- [ ] **Step 1: Re-estructurar BatchDetail.jsx**
  
  Integra los 3 selectores de J-Max, los nuevos campos en la rejilla, la visualización de días de reposo y la calculadora de agua dinámica basada en dosis y ratio.
  
  ```javascript
  // In BatchDetail.jsx:
  import React, { useState, useEffect, useRef } from 'react';

  export default function BatchDetail({ batchId, onBack, onSubtractDose, onSaveRecipe }) {
    const [batch, setBatch] = useState(null);
    const [holdPct, setHoldPct] = useState(0);
    const [method, setMethod] = useState('V60 (Filtrado)');
    const [notes, setNotes] = useState('');
    const [rating, setRating] = useState(5);
    
    // J-Max Steppers
    const [jmaxRot, setJmaxRot] = useState(1);
    const [jmaxNum, setJmaxNum] = useState(5);
    const [jmaxClick, setJmaxClick] = useState(0);
    
    // Smart Ratio
    const [ratioVal, setRatioVal] = useState(15.0);

    const holdTimer = useRef(null);

    useEffect(() => {
      let active = true;
      fetch(`/api/batches/${batchId}`)
        .then(res => res.json())
        .then(data => {
          if (active) {
            setBatch(data);
          }
        });
      return () => { active = false; };
    }, [batchId]);

    const startHold = () => {
      setHoldPct(0);
      holdTimer.current = setInterval(() => {
        setHoldPct(prev => {
          if (prev >= 100) {
            clearInterval(holdTimer.current);
            handleDoseDeduction();
            return 0;
          }
          return prev + 10;
        });
      }, 80);
    };

    const endHold = () => {
      clearInterval(holdTimer.current);
      setHoldPct(0);
    };

    const handleDoseDeduction = () => {
      onSubtractDose(batch.id, () => {
        setBatch(prev => ({
          ...prev,
          remaining_doses: Math.max(0, prev.remaining_doses - 1)
        }));
      });
    };

    const handleRecipeSubmit = (e) => {
      e.preventDefault();
      
      const doseNum = parseFloat(batch.dose_weight) || 20.0;
      const targetWater = (doseNum * ratioVal).toFixed(0);

      onSaveRecipe({
        batch_id: batch.id,
        method,
        ratio: `1:${ratioVal.toFixed(1)} (${targetWater}g)`,
        grind: `J-Max: ${jmaxRot}.${jmaxNum}.${jmaxClick}`,
        temperature: '93°C',
        brew_time: '2:45 min',
        rating,
        notes
      });
      setNotes('');
    };

    if (!batch) return <div style={{ padding: '30px', textAlign: 'center' }}>Cargando detalles...</div>;

    // Cálculo de Días de Tueste y Congelación
    let restingDays = 'Sin datos';
    let freezeTime = 'Sin datos';
    
    if (batch.roast_date && batch.freeze_date) {
      const roast = new Date(batch.roast_date);
      const freeze = new Date(batch.freeze_date);
      const diffTime = Math.abs(freeze - roast);
      restingDays = `${Math.ceil(diffTime / (1000 * 60 * 60 * 24))} días de reposo`;
    }
    
    if (batch.freeze_date) {
      const freeze = new Date(batch.freeze_date);
      const today = new Date();
      const diffTime = Math.abs(today - freeze);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays < 7) {
        freezeTime = `Congelado hace ${diffDays} días`;
      } else {
        freezeTime = `Congelado hace ${Math.floor(diffDays / 7)} semanas`;
      }
    }

    const doseNum = parseFloat(batch.dose_weight) || 20.0;
    const isLowStock = batch.remaining_doses <= 2;

    return (
      <div style={{ padding: '16px 16px 90px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <button className="btn-candy" onClick={onBack}>← Volver</button>
          {isLowStock && <span className="mono-lbl-tag" style={{ background: '#E53E3E' }}>¡ÚLTIMOS TUBOS!</span>}
        </div>

        <h2 style={{ fontFamily: 'var(--font-heading)' }}>{batch.name}</h2>

        <div className="details-grid">
          <div className="grid-cell">
            <div class="grid-lbl">País / Origen</div>
            <div class="grid-val">{batch.origin || 'N/A'}</div>
          </div>
          <div className="grid-cell" style={{ border-left: '1px solid #E2E8F0', paddingLeft: '8px' }}>
            <div class="grid-lbl">Tostador</div>
            <div class="grid-val">{batch.roaster || 'N/A'}</div>
          </div>
          <div className="grid-cell">
            <div class="grid-lbl">📅 Tueste</div>
            <div class="grid-val">{batch.roast_date ? new Date(batch.roast_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Sin fecha'}</div>
          </div>
          <div className="grid-cell" style={{ border-left: '1px solid #E2E8F0', paddingLeft: '8px' }}>
            <div class="grid-lbl">❄️ Congelación</div>
            <div class="grid-val">{batch.freeze_date ? new Date(batch.freeze_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Sin fecha'}</div>
          </div>
          <div className="grid-cell">
            <div class="grid-lbl">Nivel Tueste</div>
            <div class="grid-val">{batch.roast_level || 'Medio'}</div>
          </div>
          <div className="grid-cell" style={{ border-left: '1px solid #E2E8F0', paddingLeft: '8px' }}>
            <div class="grid-lbl">Proceso</div>
            <div class="grid-val">{batch.process || 'N/A'}</div>
          </div>
          <div className="grid-cell">
            <div class="grid-lbl">Reposo Pre-Frío</div>
            <div class="grid-val">{restingDays}</div>
          </div>
          <div className="grid-cell" style={{ border-left: '1px solid #E2E8F0', paddingLeft: '8px' }}>
            <div class="grid-lbl">Tiempo Congelado</div>
            <div class="grid-val">{freezeTime}</div>
          </div>
          <div className="grid-cell">
            <div class="grid-lbl">Altitud</div>
            <div class="grid-val">{batch.altitude || 'N/A'}</div>
          </div>
          <div className="grid-cell" style={{ border-left: '1px solid #E2E8F0', paddingLeft: '8px' }}>
            <div class="grid-lbl">Dosis Restantes</div>
            <div class="grid-val">{batch.remaining_doses} tubos</div>
          </div>
        </div>

        {/* Hold button */}
        <div className="nb-action-wrap">
          <button 
            className="btn-candy" 
            style={{ 
              position: 'relative', 
              width: '100%', 
              height: '50px', 
              overflow: 'hidden',
              backgroundColor: '#000000',
              color: '#FFFFFF'
            }}
            onMouseDown={startHold}
            onMouseUp={endHold}
            onMouseLeave={endHold}
            onTouchStart={startHold}
            onTouchEnd={endHold}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${holdPct}%`, backgroundColor: '#E53E3E', opacity: 0.8, transition: 'width 0.1s linear' }}></div>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold' }}>
              <span>RESTAR DOSIS (MANTENER)</span>
            </div>
          </button>
        </div>

        {/* Form recipe with Smart Ratio & J-Max RNC */}
        <h2 style={{ fontFamily: 'var(--font-heading)', marginTop: '20px' }}>📝 Bitácora de Extracción</h2>
        <div className="candy-card" style={{ cursor: 'default' }}>
          <form onSubmit={handleRecipeSubmit}>
            <div className="form-group">
              <label>Método</label>
              <select className="candy-input" value={method} onChange={(e) => setMethod(e.target.value)}>
                <option>V60 (Filtrado)</option>
                <option>Espresso</option>
                <option>AeroPress</option>
                <option>Prensa Francesa</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Ratio de Extracción</label>
                <div className="mono-stepper" style={{ width: '100%' }}>
                  <button type="button" className="stepper-btn" onClick={() => setRatioVal(r => Math.max(1.0, r - 0.5))}>-</button>
                  <div className="stepper-value" style={{ width: '48px' }}>{ratioVal.toFixed(1)}</div>
                  <button type="button" className="stepper-btn" onClick={() => setRatioVal(r => r + 0.5)}>+</button>
                </div>
                <div style={{ fontSize: '11px', fontWeight: 'bold', marginTop: '6px', textAlign: 'center' }}>
                  Agua Objetivo: <span style={{ color: '#E53E3E' }}>{(doseNum * ratioVal).toFixed(0)}g</span>
                </div>
              </div>
              
              <div className="form-group" style={{ flex: 1 }}>
                <label>Molienda (J-Max: R.N.C)</label>
                <div className="jmax-steppers-grid" style={{ marginBottom: 0 }}>
                  <div className="jmax-cell">
                    <span className="jmax-hdr-lbl">ROT</span>
                    <div className="mono-stepper">
                      <button type="button" className="stepper-btn" onClick={() => setJmaxRot(r => Math.max(0, r - 1))}>-</button>
                      <div className="stepper-value">{jmaxRot}</div>
                      <button type="button" className="stepper-btn" onClick={() => setJmaxRot(r => Math.min(4, r + 1))}>+</button>
                    </div>
                  </div>
                  <div className="jmax-cell">
                    <span class="jmax-hdr-lbl">NUM</span>
                    <div className="mono-stepper">
                      <button type="button" className="stepper-btn" onClick={() => setJmaxNum(n => Math.max(0, n - 1))}>-</button>
                      <div className="stepper-value">{jmaxNum}</div>
                      <button type="button" className="stepper-btn" onClick={() => setJmaxNum(n => Math.min(8, n + 1))}>+</button>
                    </div>
                  </div>
                  <div className="jmax-cell">
                    <span class="jmax-hdr-lbl">CLIC</span>
                    <div className="mono-stepper">
                      <button type="button" className="stepper-btn" onClick={() => setJmaxClick(c => Math.max(0, c - 1))}>-</button>
                      <div className="stepper-value">{jmaxClick}</div>
                      <button type="button" className="stepper-btn" onClick={() => setJmaxClick(c => Math.min(9, c + 1))}>+</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Puntaje (Estrellas)</label>
              <div className="mono-stepper">
                <button type="button" className="stepper-btn" onClick={() => setRating(r => Math.max(1, r - 1))}>-</button>
                <div className="stepper-value">{rating}</div>
                <button type="button" className="stepper-btn" onClick={() => setRating(r => Math.min(5, r + 1))}>+</button>
              </div>
            </div>

            <div className="form-group">
              <label>Notas Personales</label>
              <input className="candy-input" value={notes} onChange={(e) => setNotes(e.target.value)} type="text" placeholder="Ej. Excelente acidez a durazno." />
            </div>

            <button type="submit" className="btn-candy primary" style={{ width: '100%', marginTop: '8px' }}>Guardar Bitácora</button>
          </form>
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 2: Commit**
  
  ```bash
  git add frontend/src/components/BatchDetail.jsx
  git commit -m "feat: implement J-Max RNC steppers, smart water weight calculator, low stock alerts, and resting calculations in details"
  ```

---

## Tarea 5: Inventario con Buscador, Filtros de Tueste y Contención

**Files:**
- Modify: `frontend/src/components/Inventory.jsx`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Modificar Inventory.jsx**
  
  Implementa buscador por texto, botones de filtro por tipo de tueste (Claro/Medio/Oscuro), alerta visual para stock bajo (borde de advertencia) e integración del país de origen en las tarjetas.
  
  ```javascript
  // In Inventory.jsx:
  import React, { useState } from 'react';

  export default function Inventory({ batches, onSelectBatch, onCreateTrigger, onScanSimulate }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [roastFilter, setRoastFilter] = useState('ALL');

    // Filtrado de lotes
    const filteredBatches = batches.filter(batch => {
      const matchesSearch = 
        batch.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        batch.producer.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRoast = 
        roastFilter === 'ALL' || 
        (batch.roast_level || 'Medio').toUpperCase() === roastFilter;
        
      return matchesSearch && matchesRoast;
    });

    return (
      <div style={{ padding: '16px 16px 90px 16px' }}>
        {/* Search bar */}
        <input 
          className="candy-input" 
          placeholder="🔍 Buscar café o productor..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ marginBottom: '10px' }}
        />

        {/* Roast level filters */}
        <div className="filter-toolbar">
          <button className={`filter-btn ${roastFilter === 'ALL' ? 'active' : ''}`} onClick={() => setRoastFilter('ALL')}>Todos</button>
          <button className={`filter-btn ${roastFilter === 'CLARO' ? 'active' : ''}`} onClick={() => setRoastFilter('CLARO')}>Claro (Light)</button>
          <button className={`filter-btn ${roastFilter === 'MEDIO' ? 'active' : ''}`} onClick={() => setRoastFilter('MEDIO')}>Medio (Medium)</button>
          <button className={`filter-btn ${roastFilter === 'OSCURO' ? 'active' : ''}`} onClick={() => setRoastFilter('OSCURO')}>Oscuro (Dark)</button>
        </div>

        {filteredBatches.length === 0 ? (
          <div className="candy-card" style={{ textAlign: 'center', padding: '30px' }} onClick={onCreateTrigger}>
            <p style={{ fontWeight: 'bold' }}>¡No se encontraron cafés!</p>
            <button className="btn-candy primary" style={{ margin: '10px auto 0 auto' }}>Registrar Primer Lote</button>
          </div>
        ) : (
          filteredBatches.map(batch => {
            const isLowStock = batch.remaining_doses <= 2;
            return (
              <div 
                key={batch.id} 
                className={`candy-card ${isLowStock ? 'low-stock' : ''}`}
                onClick={() => onSelectBatch(batch.id)}
              >
                <div className="card-header-flex">
                  <div>
                    <h3 className="card-title">{batch.name}</h3>
                    <p className="card-sub">{batch.producer}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <span className="mono-lbl-tag">{batch.origin || 'N/A'}</span>
                    {batch.roast_date && (
                      <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#718096' }}>
                        Tueste: {new Date(batch.roast_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="mono-badge-row">
                  <span className="mono-lbl-tag outline">{batch.remaining_doses} Dosis</span>
                  <span className="mono-lbl-tag outline">{batch.roast_level || 'Medio'}</span>
                  {isLowStock && <span className="mono-lbl-tag" style={{ background: '#E53E3E' }}>¡Últimos tubos!</span>}
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  }
  ```

- [ ] **Step 2: Actualizar App.jsx**
  
  Pasa las nuevas callbacks, actualiza el tabbar inferior a un diseño monocromo de dos pestañas, quita la pestaña central flotante de Scan e integra el trigger NFC en la barra superior.
  
  ```javascript
  // In App.jsx:
  import React, { useState, useEffect } from 'react';
  import Inventory from './components/Inventory';
  import BatchDetail from './components/BatchDetail';
  import BatchCreator from './components/BatchCreator';
  import BrewHistory from './components/BrewHistory';

  export default function App() {
    const [currentView, setCurrentView] = useState('inventory');
    const [batches, setBatches] = useState([]);
    const [selectedBatchId, setSelectedBatchId] = useState(null);
    const [toastMessage, setToastMessage] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [lastSubtractedBatch, setLastSubtractedBatch] = useState(null);

    const fetchBatches = () => {
      fetch('/api/batches')
        .then(res => res.json())
        .then(data => setBatches(data));
    };

    useEffect(() => {
      fetchBatches();
      
      const path = window.location.pathname;
      if (path.startsWith('/batch/')) {
        const id = path.split('/')[2];
        setSelectedBatchId(id);
        setCurrentView('detail');
      }
    }, []);

    const handleBack = () => {
      window.history.pushState({}, '', '/');
      setCurrentView('inventory');
      setSelectedBatchId(null);
      fetchBatches();
    };

    const handleSubtractDose = (id, callback) => {
      fetch(`/api/batches/${id}/doses`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ change: -1 })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          callback();
          setLastSubtractedBatch(id);
          setToastMessage('Dosis restada con éxito.');
          setShowToast(true);
          
          if (navigator.vibrate) {
            navigator.vibrate([70, 50, 100]);
          }

          const badge = document.getElementById('doses-detail-badge');
          if (badge) {
            badge.classList.remove('bounce-pop');
            void badge.offsetWidth;
            badge.classList.add('bounce-pop');
          }
        }
      });
    };

    const handleUndo = () => {
      if (!lastSubtractedBatch) return;
      fetch(`/api/batches/${lastSubtractedBatch}/doses`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ change: 1 })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setShowToast(false);
          if (currentView === 'detail' && selectedBatchId === lastSubtractedBatch) {
            window.location.reload();
          } else {
            fetchBatches();
          }
        }
      });
    };

    const handleSaveRecipe = (recipePayload) => {
      fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recipePayload)
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert('¡Receta guardada en la bitácora!');
          handleBack();
        }
      });
    };

    const triggerNfcScanSimulate = () => {
      if (batches.length > 0) {
        setSelectedBatchId(batches[0].id);
        setCurrentView('detail');
      } else {
        alert('Por favor, registra un lote primero para simular el escaneo.');
      }
    };

    return (
      <div className="app-container">
        <header className="app-header">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg viewBox="0 0 100 100" style={{ width: '28px', height: '28px' }} fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="35" y="10" width="30" height="12" rx="4" fill="#000000" stroke="#000000" strokeWidth="5" />
              <path d="M40 22V72C40 80.28 44.48 87 50 87C55.52 87 60 80.28 60 72V22" fill="#FFFFFF" stroke="#000000" strokeWidth="5" />
              <ellipse cx="50" cy="55" rx="7" ry="11" transform="rotate(-15 50 55)" fill="#000000" stroke="#000000" strokeWidth="4" />
            </svg>
            <span>BeanTag</span>
          </h1>
          <div style={{ display: 'flex', gap: '6px' }}>
            {currentView === 'inventory' && (
              <>
                <button className="app-bar-btn" onClick={triggerNfcScanSimulate}>Escaneo</button>
                <button className="app-bar-btn" onClick={() => setCurrentView('creator')}>Registrar</button>
              </>
            )}
          </div>
        </header>

        <main style={{ flex: 1, position: 'relative' }}>
          {currentView === 'inventory' && (
            <Inventory 
              batches={batches} 
              onSelectBatch={(id) => { setSelectedBatchId(id); setCurrentView('detail'); }} 
              onCreateTrigger={() => setCurrentView('creator')}
            />
          )}

          {currentView === 'detail' && (
            <BatchDetail 
              batchId={selectedBatchId} 
              onBack={handleBack}
              onSubtractDose={handleSubtractDose}
              onSaveRecipe={handleSaveRecipe}
            />
          )}

          {currentView === 'creator' && (
            <BatchCreator 
              onBatchCreated={fetchBatches} 
              onBack={handleBack}
            />
          )}

          {currentView === 'history' && (
            <BrewHistory />
          )}
        </main>

        <div className={`undo-toast ${showToast ? 'show' : ''}`}>
          <span>{toastMessage}</span>
          <button className="undo-btn" onClick={handleUndo}>Deshacer</button>
        </div>

        <nav className="nb-tabbar">
          <button className={`tab-item ${currentView === 'inventory' ? 'active' : ''}`} onClick={() => { setCurrentView('inventory'); setSelectedBatchId(null); }}>
            <svg viewBox="0 0 24 24"><path d="M4 3h16a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm0 8h16a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1zm0 8h16a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1z"/></svg>
            <span>Congelador</span>
          </button>
          
          <button className={`tab-item ${currentView === 'history' ? 'active' : ''}`} onClick={() => { setCurrentView('history'); setSelectedBatchId(null); }}>
            <svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15z"/></svg>
            <span>Bitácoras</span>
          </button>
        </nav>
      </div>
    );
  }
  ```

- [ ] **Step 3: Commit**
  
  ```bash
  git add frontend/src/components/Inventory.jsx frontend/src/App.jsx
  git commit -m "feat: implement text search, roast level filters, header scan trigger, low stock border styling, and tab bar SVG vector icons"
  ```

---

## Tarea 6: Limpieza y Ajustes de Historial y Bitácoras

**Files:**
- Modify: `frontend/src/components/BrewHistory.jsx`
- Modify: `backend/public/index.html`

- [ ] **Step 1: Adaptar BrewHistory.jsx a Monocromo**
  
  ```javascript
  // In BrewHistory.jsx:
  import React, { useState, useEffect } from 'react';

  export default function BrewHistory() {
    const [history, setHistory] = useState([]);

    useEffect(() => {
      let active = true;
      fetch('/api/recipes')
        .then(res => res.json())
        .then(data => {
          if (active) {
            setHistory(data);
          }
        });
      return () => { active = false; };
    }, []);

    return (
      <div style={{ padding: '16px 16px 90px 16px' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', textTransform: 'uppercase', marginBottom: '14px' }}>
          Bitácoras
        </h2>

        {history.length === 0 ? (
          <div className="candy-card" style={{ textAlign: 'center', padding: '20px' }}>
            <p style={{ fontWeight: 'bold' }}>Aún no has registrado ninguna receta.</p>
          </div>
        ) : (
          history.map(item => (
            <div key={item.id} className="candy-card" style={{ borderLeft: '6px solid #000000', cursor: 'default' }}>
              <div className="card-header-flex">
                <div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', margin: '0 0 2px 0', textTransform: 'uppercase' }}>{item.method}</h3>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-navy)', textTransform: 'uppercase' }}>{item.batch_name}</span>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#4A5568' }}>
                  {new Date(item.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                </span>
              </div>
              <div style={{ fontSize: '12px', marginTop: '8px', borderTop: '1px solid #E2E8F0', paddingTop: '6px' }}>
                <p style={{ margin: '2px 0' }}><strong>Molienda:</strong> {item.grind || 'N/A'} | <strong>Ratio:</strong> {item.ratio || 'N/A'}</p>
                {item.notes && <p style={{ margin: '2px 0', fontStyle: 'italic' }}><strong>Cata:</strong> {item.notes}</p>}
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', fontWeight: 'bold' }}>
                  Puntuación: {'★'.repeat(item.rating || 5)}{'☆'.repeat(5 - (item.rating || 5))} ({item.rating || 5}/5)
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    );
  }
  ```

- [ ] **Step 2: Limpiar color de fondo inline en backend/public/index.html**
  
  Reemplaza el fondo violeta residual `#F3E8FF` por el gris de fondo monochrome del body para evitar destellos al cargar.
  
  ```html
  <!-- In backend/public/index.html around line 19: -->
  <body style="margin: 0; padding: 0; background-color: #F7FAFC;">
  ```

- [ ] **Step 3: Commit**
  
  ```bash
  git add frontend/src/components/BrewHistory.jsx backend/public/index.html
  git commit -m "style: adapt BrewHistory list to monochrome style and cleanup index.html body background"
  ```

---

## Tarea 7: Compilación y Despliegue en el VPS

- [ ] **Step 1: Compilar la aplicación React en local**
  
  Run: `npm run build-frontend`
  Expected: Vite compila sin errores.

- [ ] **Step 2: Desplegar en el VPS**
  
  Run: `./deploy.sh`
  Expected: PM2 reinicia el proceso del backend en el VPS.
