# Sub-proyecto B: Hub de Herramientas Avanzadas WebNFC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Crear el componente `NfcToolsModal.jsx` con funciones de diagnóstico RAW, formateo/limpieza de etiquetas, clonación en serie de lotes e integración en `Settings.jsx` y `App.jsx`.

**Architecture:** Crear `NfcToolsModal.jsx` como modal interactivo retro-candy. Manejar la API `window.NDEFReader` para lectura, escritura neutra y escritura en lote. Integrar accesos desde el menú de Ajustes y la navegación principal.

**Tech Stack:** React, Lucide-React (`Nfc`, `RefreshCw`, `Trash2`, `Copy`, `X`, `CheckCircle`, `AlertTriangle`), WebNFC NDEF API.

## Global Constraints

* Componente nuevo: `beantag/frontend/src/components/NfcToolsModal.jsx`.
* Archivos modificados: `beantag/frontend/src/components/Settings.jsx`, `beantag/frontend/src/App.jsx`.
* Soporte fallback para navegadores sin `NDEFReader`.

---

### Task 1: Create NfcToolsModal.jsx Component

**Files:**
- Create: `beantag/frontend/src/components/NfcToolsModal.jsx`

**Interfaces:**
- Produces: Componente `<NfcToolsModal onClose={...} showToast={...} />`.

- [ ] **Step 1: Write NfcToolsModal.jsx code**

```jsx
import React, { useState, useEffect } from 'react';
import { Nfc, RefreshCw, Trash2, Copy, X, CheckCircle, AlertTriangle } from 'lucide-react';

export default function NfcToolsModal({ onClose, showToast }) {
  const [batches, setBatches] = useState([]);
  const [activeTab, setActiveTab] = useState('scan'); // 'scan' | 'format' | 'clone'
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [scannedData, setScannedData] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const hasNfc = typeof window !== 'undefined' && 'NDEFReader' in window;

  useEffect(() => {
    fetch('/api/batches')
      .then(res => res.json())
      .then(data => {
        setBatches(data || []);
        if (data && data.length > 0) {
          setSelectedBatchId(data[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const handleStartScan = async () => {
    if (!hasNfc) {
      showToast('WebNFC no está disponible en este dispositivo.', { type: 'error' });
      return;
    }
    try {
      setIsProcessing(true);
      setStatusMessage('Acerca la etiqueta NFC para diagnosticar...');
      const ndef = new window.NDEFReader();
      await ndef.scan();
      ndef.onreading = (event) => {
        let rawUrl = '';
        for (const record of event.message.records) {
          if (record.recordType === 'url') {
            const decoder = new TextDecoder();
            rawUrl = decoder.decode(record.data);
          }
        }
        setScannedData({
          serialNumber: event.serialNumber || 'N/A',
          rawUrl: rawUrl || 'Registro sin URL legible',
          timestamp: new Date().toLocaleTimeString()
        });
        setStatusMessage('✅ Etiqueta leída con éxito');
        setIsProcessing(false);
      };
    } catch (error) {
      setStatusMessage('❌ Error: ' + error.message);
      setIsProcessing(false);
    }
  };

  const handleFormatTag = async () => {
    if (!hasNfc) {
      showToast('WebNFC no está disponible en este dispositivo.', { type: 'error' });
      return;
    }
    try {
      setIsProcessing(true);
      setStatusMessage('Acerca la etiqueta para limpiar/formatear...');
      const ndef = new window.NDEFReader();
      await ndef.write({
        records: [{ recordType: 'url', data: 'https://beantag.cafe/empty' }]
      });
      setStatusMessage('🎉 Etiqueta formateada y limpiada con éxito.');
      showToast('Etiqueta formateada.', { type: 'success' });
      setIsProcessing(false);
    } catch (error) {
      setStatusMessage('❌ Error al formatear: ' + error.message);
      setIsProcessing(false);
    }
  };

  const handleCloneBatchTag = async () => {
    if (!hasNfc) {
      showToast('WebNFC no disponible.', { type: 'error' });
      return;
    }
    if (!selectedBatchId) {
      showToast('Selecciona un lote para clonar.', { type: 'error' });
      return;
    }
    try {
      setIsProcessing(true);
      setStatusMessage(`Acerca la etiqueta para vincular lote ${selectedBatchId}...`);
      const ndef = new window.NDEFReader();
      await ndef.write({
        records: [{ recordType: 'url', data: `https://beantag.cafe/batch/${selectedBatchId}` }]
      });
      setStatusMessage(`🎉 Tag vinculado con éxito al lote: ${selectedBatchId}`);
      showToast(`Tag grabado con lote ${selectedBatchId}`, { type: 'success' });
      setIsProcessing(false);
    } catch (error) {
      setStatusMessage('❌ Error al clonar: ' + error.message);
      setIsProcessing(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(26, 5, 5, 0.75)',
      zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px', boxSizing: 'border-box'
    }} onClick={onClose}>
      <div className="candy-card static" style={{
        maxWidth: '440px', width: '100%', padding: '20px', boxSizing: 'border-box',
        display: 'flex', flexDirection: 'column', gap: '14px',
        animation: 'softFadeIn 200ms ease-out'
      }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', textTransform: 'uppercase', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Nfc size={18} color="var(--color-crimson)" />
            Herramientas WebNFC
          </h3>
          <button type="button" className="btn-candy" style={{ padding: '4px 8px', margin: 0 }} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Hardware Banner */}
        <div style={{
          padding: '8px 12px', borderRadius: '6px', border: '2px solid var(--border-color)',
          fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px',
          backgroundColor: hasNfc ? '#C6F6D5' : '#FEFCBF',
          color: hasNfc ? '#22543D' : '#744210'
        }}>
          {hasNfc ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
          <span>{hasNfc ? 'WebNFC Disponible (Android Chrome)' : 'WebNFC No disponible en este navegador (Prueba Chrome en Android)'}</span>
        </div>

        {/* Action Tabs */}
        <div className="filter-scroll-container">
          <button
            type="button"
            className={`filter-chip ${activeTab === 'scan' ? 'active' : ''}`}
            onClick={() => { setActiveTab('scan'); setStatusMessage(''); }}
          >
            🔍 Diagnosticar
          </button>
          <button
            type="button"
            className={`filter-chip ${activeTab === 'format' ? 'active' : ''}`}
            onClick={() => { setActiveTab('format'); setStatusMessage(''); }}
          >
            🧹 Formatear / Limpiar
          </button>
          <button
            type="button"
            className={`filter-chip ${activeTab === 'clone' ? 'active' : ''}`}
            onClick={() => { setActiveTab('clone'); setStatusMessage(''); }}
          >
            📋 Clonar a Tag
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'scan' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={{ fontSize: '12px', margin: 0, lineHeight: '1.4' }}>
              Lee el contenido RAW de cualquier etiqueta NFC cercana para inspeccionar su URL o identificador de lote.
            </p>
            <button type="button" className="btn-candy primary" onClick={handleStartScan} disabled={isProcessing} style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <RefreshCw size={14} className={isProcessing ? 'spin' : ''} />
              Iniciar Escaneo Diagnóstico
            </button>
            {scannedData && (
              <div style={{ background: 'var(--bg-canvas)', padding: '10px', border: '2px solid var(--border-color)', borderRadius: '4px', fontSize: '11px', fontFamily: 'monospace' }}>
                <div><strong>Nº Serie:</strong> {scannedData.serialNumber}</div>
                <div><strong>URL RAW:</strong> {scannedData.rawUrl}</div>
                <div><strong>Hora:</strong> {scannedData.timestamp}</div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'format' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={{ fontSize: '12px', margin: 0, lineHeight: '1.4' }}>
              Formatea la etiqueta escribiendo un registro URL neutro (`/empty`) para dejarla lista y reutilizable.
            </p>
            <button type="button" className="btn-candy" onClick={handleFormatTag} disabled={isProcessing} style={{ padding: '10px', color: '#E53E3E', borderColor: '#E53E3E', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Trash2 size={14} />
              Formatear & Limpiar Tag
            </button>
          </div>
        )}

        {activeTab === 'clone' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={{ fontSize: '12px', margin: 0, lineHeight: '1.4' }}>
              Selecciona un lote de tu inventario y grábalo rápidamente a cualquier tag NFC cercano.
            </p>
            <select
              className="candy-input"
              value={selectedBatchId}
              onChange={e => setSelectedBatchId(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box' }}
            >
              {batches.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name || b.coffee_name} ({b.roaster}) - ID: {b.id}
                </option>
              ))}
            </select>
            <button type="button" className="btn-candy primary" onClick={handleCloneBatchTag} disabled={isProcessing} style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Copy size={14} />
              Grabar Lote Seleccionado
            </button>
          </div>
        )}

        {/* Status Message */}
        {statusMessage && (
          <div style={{
            padding: '8px', fontSize: '11px', fontWeight: 'bold', textAlign: 'center',
            border: '2px solid var(--border-color)', borderRadius: '4px',
            backgroundColor: 'var(--bg-card)'
          }}>
            {statusMessage}
          </div>
        )}

      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build` in `beantag/frontend`
Expected: PASS with 0 errors.

- [ ] **Step 3: Commit**

```bash
git add beantag/frontend/src/components/NfcToolsModal.jsx
git commit -m "feat: add NfcToolsModal component for diagnostics, formatting and cloning"
```

---

### Task 2: Integrate NfcToolsModal into Settings.jsx & App.jsx

**Files:**
- Modify: `beantag/frontend/src/components/Settings.jsx`
- Modify: `beantag/frontend/src/App.jsx`

**Interfaces:**
- Consumes: `<NfcToolsModal onClose={...} showToast={...} />`.

- [ ] **Step 1: Add NFC Tools button in Settings.jsx**

In `Settings.jsx`:
Import `Nfc` from `'lucide-react'` and `NfcToolsModal`.
Add state `const [showNfcModal, setShowNfcModal] = useState(false);`.
Add button under NFC section or General settings:
```jsx
<button
  type="button"
  className="btn-candy"
  onClick={() => setShowNfcModal(true)}
  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '10px' }}
>
  <Nfc size={16} color="var(--color-crimson)" />
  Abrir Herramientas & Diagnóstico NFC
</button>

{showNfcModal && (
  <NfcToolsModal onClose={() => setShowNfcModal(false)} showToast={showToast} />
)}
```

- [ ] **Step 2: Add shortcut access in App.jsx**

In `App.jsx`:
Import `NfcToolsModal`. Add state `const [showNfcTools, setShowNfcTools] = useState(false);`.
Render modal conditionally when `showNfcTools` is true.

- [ ] **Step 3: Verify build**

Run: `npm run build` in `beantag/frontend`
Expected: PASS with 0 errors.

- [ ] **Step 4: Commit**

```bash
git add beantag/frontend/src/components/Settings.jsx beantag/frontend/src/App.jsx
git commit -m "feat: integrate NfcToolsModal into Settings and App navigation"
```
