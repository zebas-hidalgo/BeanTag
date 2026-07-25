# Dial-In Helper J-Max y Escritura NFC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a Grind Dial-In Helper for the 1Zpresso J-Max grinder and an interactive NFC Writing Card with HTTP backups and QR code generators, fixing router paths for subpath deployments.

**Architecture:** Add React UI cards in `BatchDetail.jsx` and `BatchCreator.jsx` to handle calculations, copy actions, and native NFC NDEF writing. Resolve the routing in `App.jsx` dynamically based on the current base path.

**Tech Stack:** React, Lucide icons, Canvas, Vite environment, NDEFReader Web API, QR Code generator API.

---

### Task 1: Enrutamiento Dinámico y Corrección de pushState en `App.jsx`

**Files:**
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Modificar el hook useEffect de enrutamiento al arrancar**

Replace the path parsing logic in `frontend/src/App.jsx` (lines 64-69) to strip the base path dynamically:
```javascript
    const path = window.location.pathname;
    const basePath = import.meta.env.BASE_URL; // e.g. "/beantag/"
    const relativeRoute = path.startsWith(basePath) ? path.substring(basePath.length - 1) : path;
    const match = relativeRoute.match(/^\/batch\/([^/]+)/) || relativeRoute.match(/^\/nfc\/([^/]+)/);
    if (match) {
      const id = match[1];
      setSelectedBatchId(id);
      setCurrentView('detail');
    }
```

- [ ] **Step 2: Modificar handleBack para usar pushState con el BASE_URL**

Replace the absolute `'/'` pushState call inside `handleBack` (line 78) with:
```javascript
      window.history.pushState({}, '', import.meta.env.BASE_URL);
```

- [ ] **Step 3: Modificar la selección de lote para actualizar la URL en el historial**

Replace `onSelectBatch` inside the rendering of `<Inventory>` (line 257) with:
```javascript
            onSelectBatch={(id) => { 
              window.history.pushState({}, '', `${import.meta.env.BASE_URL}batch/${id}`);
              setSelectedBatchId(id); 
              setCurrentView('detail'); 
            }}
```

- [ ] **Step 4: Confirmar cambios localmente compilando el frontend**

Run command in `frontend`:
`npm run build`
Expected: Exito sin errores.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/App.jsx
git commit -m "feat: resolve subpath routing and browser history navigation in App.jsx"
```

---

### Task 2: Lógica de la API Web NFC y Tarjeta Informativa en `BatchDetail.jsx`

**Files:**
- Modify: `frontend/src/components/BatchDetail.jsx`

- [ ] **Step 1: Actualizar la función handleWriteNfc para usar URL dinámica**

Replace the `handleWriteNfc` function in `frontend/src/components/BatchDetail.jsx` (lines 257-274):
```javascript
  const handleWriteNfc = async () => {
    const isNfcSupported = 'NDEFReader' in window;
    const isHttps = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isNfcSupported && isHttps) {
      try {
        const ndef = new window.NDEFReader();
        await ndef.write({
          records: [{
            recordType: "url",
            data: window.location.origin + import.meta.env.BASE_URL + 'batch/' + batch.id
          }]
        });
        showToast('Etiqueta NFC vinculada con éxito. 🎉', { type: 'success', duration: 3000 });
      } catch (error) {
        showToast('Error al escribir NFC: ' + error.message, { type: 'error', duration: 4000 });
      }
    } else if (!isHttps && isNfcSupported) {
      showToast('Web NFC nativo requiere HTTPS/SSL. Usa el botón de copiado.', { type: 'error', duration: 5000 });
    } else {
      showToast('Escritura NFC no disponible en este dispositivo.', { type: 'error', duration: 5000 });
    }
  };
```

- [ ] **Step 2: Crear el estado de visualización del código QR**

Add near other state definitions inside the `BatchDetail` component:
```javascript
  const [showQr, setShowQr] = useState(false);
```

- [ ] **Step 3: Agregar la tarjeta bento "Configuración NFC" al layout**

Add the card JSX inside the return statement of `BatchDetail.jsx` (below the Degas status card, around line 526):
```javascript
      {/* Tarjeta Bento Configuración NFC */}
      {(() => {
        const nfcUrl = window.location.origin + import.meta.env.BASE_URL + 'batch/' + batch.id;
        const isHttps = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const isNfcSupported = 'NDEFReader' in window;

        return (
          <div className="candy-card static" style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Nfc size={18} color="var(--color-crimson)" />
              <span style={{ fontWeight: '700', fontSize: '15px', fontFamily: 'var(--font-heading)' }}>Configuración NFC</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: '0 0 10px 0', lineHeight: '1.4' }}>
              {isNfcSupported && isHttps 
                ? 'Vincula este lote directamente a una etiqueta NFC física (NTAG213) acercándola al teléfono.'
                : 'El navegador requiere conexión segura (HTTPS) para grabar tags nativos. Copia el enlace abajo para usarlo en la app NFC Tools:'}
            </p>
            
            {isNfcSupported && isHttps ? (
              <button className="btn-candy primary" onClick={handleWriteNfc} style={{ width: '100%', padding: '10px', fontSize: '12px' }}>
                🏷️ Vincular Tag NFC
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input type="text" readOnly className="candy-input" value={nfcUrl} style={{ flex: 1, fontSize: '11px', padding: '6px', margin: 0 }} />
                  <button className="btn-candy" onClick={() => {
                    navigator.clipboard.writeText(nfcUrl);
                    showToast('Enlace NFC copiado al portapapeles.', { type: 'success', duration: 2500 });
                  }} style={{ padding: '6px 12px', fontSize: '11px', margin: 0, fontWeight: 'bold' }}>
                    Copiar
                  </button>
                </div>
                <button className="btn-candy" onClick={() => setShowQr(!showQr)} style={{ width: '100%', padding: '6px', fontSize: '11px', margin: 0, fontWeight: 'bold' }}>
                  {showQr ? 'Ocultar Código QR' : '📱 Mostrar Código QR'}
                </button>
                {showQr && (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '10px', background: '#fff', border: '2px solid #000', borderRadius: '4px', marginTop: '4px' }} className="animate-entrance">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(nfcUrl)}`} alt="NFC QR Code" style={{ width: '150px', height: '150px' }} />
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/BatchDetail.jsx
git commit -m "feat: implement native Web NFC writing and HTTP QR code fallbacks in BatchDetail"
```

---

### Task 3: Implementación del Asistente J-Max (Dial-In Helper) en `BatchDetail.jsx`

**Files:**
- Modify: `frontend/src/components/BatchDetail.jsx`

- [ ] **Step 1: Agregar los estados del asistente de calibración**

Add states at the top of the `BatchDetail` component:
```javascript
  const [dialInVisible, setDialInVisible] = useState(false);
  const [dialInRecipeId, setDialInRecipeId] = useState('');
  const [dialInTaste, setDialInTaste] = useState(''); // 'acid' or 'bitter'
  const [dialInUseTime, setDialInUseTime] = useState(false);
  const [dialInTargetTime, setDialInTargetTime] = useState(25);
  const [dialInRealTime, setDialInRealTime] = useState(25);
  const [dialInRecommendation, setDialInRecommendation] = useState(null);
```

- [ ] **Step 2: Inicializar el recipeId por defecto al obtener recetas**

Add inside the recipe fetching effect (where `setRecipes(data)` occurs):
```javascript
        if (data && data.length > 0) {
          setDialInRecipeId(data[0].id.toString());
        }
```

- [ ] **Step 3: Agregar la función de cálculo matemático de Dial-In**

Add the J-Max wrapping clicks logic inside `BatchDetail.jsx`:
```javascript
  const calculateDialIn = () => {
    if (!dialInRecipeId || !dialInTaste) {
      setDialInRecommendation(null);
      return;
    }

    const recipe = recipes.find(r => r.id === parseInt(dialInRecipeId));
    if (!recipe || !recipe.grind || !recipe.grind.includes('J-Max:')) {
      setDialInRecommendation(null);
      return;
    }

    const grindParts = recipe.grind.replace('J-Max:', '').trim().split('.');
    if (grindParts.length !== 3) return;

    const r = parseInt(grindParts[0]) || 0;
    const n = parseInt(grindParts[1]) || 0;
    const c = parseInt(grindParts[2]) || 0;
    
    let totalClicks = (r * 90) + (n * 10) + c;
    let adjustment = 0;

    if (dialInTaste === 'acid') {
      // Acid/Under-extracted -> Finer grind (subtract clicks)
      adjustment = -4;
      if (dialInUseTime) {
        const diff = dialInTargetTime - dialInRealTime;
        if (diff > 0) {
          adjustment -= Math.floor(diff / 2);
        }
      }
      adjustment = Math.max(-10, adjustment);
    } else if (dialInTaste === 'bitter') {
      // Bitter/Over-extracted -> Coarser grind (add clicks)
      adjustment = 4;
      if (dialInUseTime) {
        const diff = dialInRealTime - dialInTargetTime;
        if (diff > 0) {
          adjustment += Math.floor(diff / 2);
        }
      }
      adjustment = Math.min(10, adjustment);
    }

    const newTotalClicks = Math.max(0, totalClicks + adjustment);
    const newR = Math.floor(newTotalClicks / 90);
    const rem = newTotalClicks % 90;
    const newN = Math.floor(rem / 10);
    const newC = rem % 10;

    setDialInRecommendation({
      clicks: adjustment,
      direction: adjustment > 0 ? 'engrosar' : 'afinar',
      formatted: `J-Max: ${newR}.${newN}.${newC}`,
      microns: Math.round(newTotalClicks * 8.8)
    });
  };
```

- [ ] **Step 4: Añadir trigger useEffect para recalcular automáticamente al cambiar datos**

```javascript
  useEffect(() => {
    calculateDialIn();
  }, [dialInRecipeId, dialInTaste, dialInUseTime, dialInTargetTime, dialInRealTime]);
```

- [ ] **Step 5: Diseñar el botón de aplicación de la sugerencia**

Add the handler to copy settings to the form:
```javascript
  const handleApplyDialIn = () => {
    if (!dialInRecommendation) return;
    const parts = dialInRecommendation.formatted.replace('J-Max:', '').trim().split('.');
    setJmaxRot(parseInt(parts[0]));
    setJmaxNum(parseInt(parts[1]));
    setJmaxClick(parseInt(parts[2]));
    
    // Smooth scroll to new recipe form
    const form = document.getElementById('new-recipe-form');
    if (form) {
      form.scrollIntoView({ behavior: 'smooth' });
    }
    showToast('Ajuste de molienda cargado en el formulario.', { type: 'success', duration: 2500 });
  };
```

- [ ] **Step 6: Renderizar la tarjeta Bento del Dial-In Helper**

Add the card HTML to the details grid in `BatchDetail.jsx` (below the NFC card):
```javascript
      {/* Tarjeta Bento Dial-In Helper */}
      {recipes && recipes.length > 0 && (
        <div className="candy-card static" style={{ marginTop: '16px', backgroundColor: dialInVisible ? 'var(--bg-canvas)' : 'var(--bg-card)' }}>
          <div 
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
            onClick={() => setDialInVisible(!dialInVisible)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Settings2 size={18} color="var(--color-crimson)" />
              <span style={{ fontWeight: '700', fontSize: '15px', fontFamily: 'var(--font-heading)' }}>Asistente Dial-In J-Max</span>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{dialInVisible ? 'Ocultar' : 'Abrir'}</span>
          </div>

          {dialInVisible && (
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }} className="animate-entrance">
              
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '11px' }}>Receta a Calibrar</label>
                <select 
                  className="candy-input" 
                  value={dialInRecipeId} 
                  onChange={(e) => setDialInRecipeId(e.target.value)}
                  style={{ width: '100%' }}
                >
                  {recipes.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.method} ({r.grind}) - {formatLocalDateStr(r.created_at)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', display: 'block', marginBottom: '6px' }}>¿Cómo quedó la taza?</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className={`btn-candy ${dialInTaste === 'acid' ? 'primary' : ''}`}
                    onClick={() => setDialInTaste('acid')}
                    style={{ flex: 1, padding: '8px 4px', fontSize: '11px', margin: 0, fontWeight: 'bold' }}
                  >
                    🍋 Ácido / Rápido
                  </button>
                  <button 
                    className={`btn-candy ${dialInTaste === 'bitter' ? 'primary' : ''}`}
                    onClick={() => setDialInTaste('bitter')}
                    style={{ flex: 1, padding: '8px 4px', fontSize: '11px', margin: 0, fontWeight: 'bold' }}
                  >
                    🔥 Amargo / Lento
                  </button>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '10px' }}>
                <label style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={dialInUseTime} 
                    onChange={(e) => setDialInUseTime(e.target.checked)} 
                  />
                  Ajustar detalladamente por tiempo
                </label>

                {dialInUseTime && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }} className="animate-entrance">
                    <div className="form-group" style={{ flex: 1, margin: 0 }}>
                      <label style={{ fontSize: '10px' }}>Objetivo (s)</label>
                      <input 
                        type="number" className="candy-input" 
                        value={dialInTargetTime} 
                        onChange={(e) => setDialInTargetTime(parseInt(e.target.value) || 0)} 
                      />
                    </div>
                    <div className="form-group" style={{ flex: 1, margin: 0 }}>
                      <label style={{ fontSize: '10px' }}>Real (s)</label>
                      <input 
                        type="number" className="candy-input" 
                        value={dialInRealTime} 
                        onChange={(e) => setDialInRealTime(parseInt(e.target.value) || 0)} 
                      />
                    </div>
                  </div>
                )}
              </div>

              {dialInRecommendation && (
                <div style={{ background: '#FFF5F5', border: '2px solid #000', borderRadius: '6px', padding: '10px', marginTop: '6px' }} className="animate-entrance">
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-crimson)', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Ajuste Sugerido:
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: '900', color: '#000' }}>
                    {dialInRecommendation.clicks > 0 ? '+' : ''}{dialInRecommendation.clicks} Clics ({dialInRecommendation.direction})
                  </div>
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>
                    Nueva Molienda: <strong>{dialInRecommendation.formatted}</strong> (~{dialInRecommendation.microns} µm)
                  </div>
                  
                  <button 
                    className="btn-candy primary" 
                    onClick={handleApplyDialIn} 
                    style={{ width: '100%', marginTop: '10px', padding: '8px', fontSize: '11px', fontWeight: 'bold', margin: '10px 0 0 0' }}
                  >
                    💡 Aplicar y Preparar
                  </button>
                </div>
              )}

            </div>
          )}
        </div>
      )}
```

- [ ] **Step 7: Enlazar el ID del formulario de nueva receta**

Add `id="new-recipe-form"` to the new recipe form container around line 830:
```javascript
      <form id="new-recipe-form" onSubmit={handleRecipeSubmit} ...>
```

- [ ] **Step 8: Commit**

```bash
git add frontend/src/components/BatchDetail.jsx
git commit -m "feat: implement J-Max Dial-In Helper with wrap clicks calculations in BatchDetail"
```

---

### Task 4: Integración en `BatchCreator.jsx` de vinculación NFC rápida

**Files:**
- Modify: `frontend/src/components/BatchCreator.jsx`

- [ ] **Step 1: Agregar el estado para el ID del lote recién creado**

Add near states inside `BatchCreator.jsx`:
```javascript
  const [createdBatchId, setCreatedBatchId] = useState(null);
```

- [ ] **Step 2: Capturar el ID retornado del API al guardar lote con éxito**

Modify the success handler of the create API response (around lines 190-210):
```javascript
      if (data.success) {
        showToast(batchToEdit ? 'Lote actualizado con éxito.' : '¡Lote registrado con éxito! 🎉', { type: 'success', duration: 3000 });
        if (!batchToEdit && data.id) {
          // Guardar ID y no cerrar instantáneamente para poder vincular NFC
          setCreatedBatchId(data.id);
        } else {
          onBatchCreated();
        }
      }
```

- [ ] **Step 3: Agregar la tarjeta interactiva de vinculación NFC en la pantalla de éxito**

Add a conditional view inside `BatchCreator.jsx` when `createdBatchId` is present, showing the NFC vinculation options before going back:
```javascript
  if (createdBatchId) {
    const nfcUrl = window.location.origin + import.meta.env.BASE_URL + 'batch/' + createdBatchId;
    const isHttps = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isNfcSupported = 'NDEFReader' in window;

    const handleWriteCreatorNfc = async () => {
      try {
        const ndef = new window.NDEFReader();
        await ndef.write({
          records: [{
            recordType: "url",
            data: nfcUrl
          }]
        });
        showToast('Etiqueta NFC vinculada con éxito. 🎉', { type: 'success', duration: 3000 });
        onBatchCreated();
      } catch (error) {
        showToast('Error al escribir NFC: ' + error.message, { type: 'error', duration: 4000 });
      }
    };

    return (
      <div style={{ padding: '24px 14px' }} className="animate-entrance">
        <div className="candy-card static" style={{ textAlign: 'center', padding: '24px 16px' }}>
          <span style={{ fontSize: '40px' }}>🎉</span>
          <h2 style={{ fontFamily: 'var(--font-heading)', margin: '12px 0 6px 0' }}>¡Lote Creado!</h2>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '0 0 20px 0' }}>
            Tu lote ha sido guardado. ¿Quieres vincular una etiqueta NFC adhesiva en este momento?
          </p>

          {isNfcSupported && isHttps ? (
            <button className="btn-candy primary" onClick={handleWriteCreatorNfc} style={{ width: '100%', padding: '12px', fontSize: '13px', marginBottom: '10px' }}>
              🏷️ Grabar Tag NFC Ahora
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input type="text" readOnly className="candy-input" value={nfcUrl} style={{ flex: 1, fontSize: '11px', padding: '6px', margin: 0 }} />
                <button className="btn-candy" onClick={() => {
                  navigator.clipboard.writeText(nfcUrl);
                  showToast('Enlace copiado.', { type: 'success', duration: 2000 });
                }} style={{ padding: '6px 12px', fontSize: '11px', margin: 0, fontWeight: 'bold' }}>
                  Copiar
                </button>
              </div>
            </div>
          )}

          <button className="btn-candy" onClick={onBatchCreated} style={{ width: '100%', padding: '10px', fontSize: '12px', margin: 0 }}>
            Terminar y ver Inventario
          </button>
        </div>
      </div>
    );
  }
```

- [ ] **Step 4: Asegurar que el API de backend retorne el ID del nuevo lote**

Verify `/Users/zebas/Desktop/Proyecto_cafe/backend/server.js` (around line 120, batch create endpoint) returns the created batch ID in json. If not, modify it to return `{ success: true, id: result.lastID }`. Let's verify by viewing the backend creation endpoint first.
Related tools:
- `grep_search`
I will search for the batch insert route.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/BatchCreator.jsx
git commit -m "feat: add immediate NFC binding card upon batch creation in BatchCreator"
```
