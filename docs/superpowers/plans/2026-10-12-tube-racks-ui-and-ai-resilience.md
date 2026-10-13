# Plan de Implementación: Rediseño Visual de Portatubos (Bean Cellar) y Resiliencia 100% de IA

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar la interfaz de portatubos a una estética skeuomórfica artesanal *Bean Cellar* (madera, vidrio, degradados por tueste y navegación multi-rack por pestañas) y blindar el motor de recetas e IA contra cualquier desconexión con timeouts de 4s, cascada de modelos y fallback determinista local para el Sommelier IA.

**Architecture:** En el backend, introducir timeouts estrictos de 4s con `AbortController` en `callGeminiWithRetry` y un motor determinista `computeOfflineSommelier` en `aiEngine.js` para garantizar cero errores 500. En el frontend, implementar navegación por pestañas en `TubeRacksView.jsx` y renderizado de ranuras 2×3 como tubos de ensayo de vidrio con tapón de nogal, gradientes térmicos y distintivos cromáticos de proceso.

**Tech Stack:** React 18, Vite, Node.js, Express, SQLite, Google Gemini API v1beta (3.8-flash / 3.8-flash-lite), Lucide React, Zerker SSH.

---

### Task 1: Motor de Resiliencia IA y Fallback Offline en Backend

**Files:**
- Modify: `backend/aiEngine.js`
- Modify: `backend/server.js`
- Create: `scripts/test_ai_resilience.js`

- [ ] **Step 1: Escribir el script de prueba de resiliencia automatizada**

Crear `scripts/test_ai_resilience.js` que verifica que:
1. `callGeminiWithRetry` respeta el timeout de 4 segundos con AbortController.
2. `computeOfflineSommelier` genera recomendaciones deterministas válidas para mañana, tarde y noche sin internet.
3. El endpoint `/api/ai/sommelier` responde HTTP 200 y JSON válido incluso con API key inválida o desconectada.

```javascript
// scripts/test_ai_resilience.js
const assert = require('assert');
const { computeOfflineSommelier } = require('../backend/aiEngine');

const mockBatches = [
  { id: 1, name: 'Geisha Huila', roaster: 'Finca El Paraíso', origin: 'Colombia', roast_level: 'Claro', process: 'Lavado', remaining_doses: 5, roast_date: '2026-09-28' },
  { id: 2, name: 'Pink Bourbon', roaster: 'La Palma & El Tucán', origin: 'Colombia', roast_level: 'Medio', process: 'Anaeróbico', remaining_doses: 8, roast_date: '2026-09-20' },
  { id: 3, name: 'Bourbon Sidra', roaster: 'Finca Soledad', origin: 'Ecuador', roast_level: 'Medio', process: 'Natural', remaining_doses: 0, roast_date: '2026-09-15' }
];

console.log('🧪 Probando computeOfflineSommelier...');
const morningRec = computeOfflineSommelier(mockBatches, 'mañana');
assert(morningRec && morningRec.recommended_batch_id, 'Debe recomendar un lote');
assert(morningRec.recommended_batch_id !== 3, 'No debe recomendar lote sin stock');
assert.strictEqual(morningRec._source, 'barista_fallback');

const afternoonRec = computeOfflineSommelier(mockBatches, 'tarde');
assert(afternoonRec && afternoonRec.headline, 'Debe incluir headline');

console.log('✅ computeOfflineSommelier superó todas las pruebas.');
```

- [ ] **Step 2: Ejecutar el test para verificar que falla antes de la implementación**

Run: `node scripts/test_ai_resilience.js`  
Expected: FAIL con `computeOfflineSommelier is not a function`.

- [ ] **Step 3: Implementar `computeOfflineSommelier` y timeout de 4s en `backend/aiEngine.js`**

1. Agregar `computeOfflineSommelier(batches, timeOfDay)` en `backend/aiEngine.js`:
   * Filtrar lotes disponibles con `remaining_doses > 0`.
   * Calcular días de reposo (`daysSinceRoast`).
   * Evaluar momento del día (mañana: prioriza dulzor y balance lavado/medio; tarde: prioriza acidez brillante y fermentaciones exóticas; noche: cafés suaves).
   * Generar JSON con `recommended_batch_id`, `recommended_batch_name`, `badge`, `headline`, `reason`, `suggested_method`, `flavor_highlight`, `_source: 'barista_fallback'`.
2. En `callGeminiWithRetry`, configurar `AbortController` con `setTimeout` de 4000ms para cada intento HTTP `fetch`:
   * Si la llamada excede 4s, abortar la petición y saltar de inmediato al siguiente modelo en la cascada.
3. Exportar `computeOfflineSommelier`.

- [ ] **Step 4: Conectar fallback en `/api/ai/sommelier` en `backend/server.js`**

En `backend/server.js`, en la ruta `/api/ai/sommelier`:
* Si no hay API key o si `callGeminiWithRetry` falla por cualquier error de red/timeout/auth, capturar la excepción en el `catch (err)` y responder inmediatamente con:
  ```javascript
  const fallbackResult = computeOfflineSommelier(availableBatches, timeOfDay);
  fallbackResult._error = err.message;
  return res.json(fallbackResult);
  ```
* Garantizar que la ruta **NUNCA devuelva error 500**.

- [ ] **Step 5: Ejecutar el test para verificar que pasa**

Run: `node scripts/test_ai_resilience.js`  
Expected: PASS.

- [ ] **Step 6: Commit de Task 1**

```bash
git add backend/aiEngine.js backend/server.js scripts/test_ai_resilience.js
git commit -m "feat(ai): add 4s AbortController timeout and offline sommelier fallback engine"
```

---

### Task 2: Resiliencia de UI y Badging Positivo en Frontend

**Files:**
- Modify: `frontend/src/components/BatchDetail.jsx`
- Modify: `frontend/src/components/Settings.jsx`

- [ ] **Step 1: Actualizar Badging de Fallback en `BatchDetail.jsx`**

En `frontend/src/components/BatchDetail.jsx`:
* Cuando `aiRecommendation._source === 'barista_fallback'`, no mostrar alertas rojas alarmistas.
* Renderizar una píldora visual estilizada:
  ```jsx
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--barista-instr-bg, #FEF3C7)', border: '1px solid var(--barista-instr-border, #FDE68A)', color: 'var(--barista-accent-honey, #D97706)', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '800' }}>
    <Zap size={13} />
    <span>Motor Barista Físico (Micrones & Clics Calculados)</span>
  </div>
  ```

- [ ] **Step 2: Actualizar Sommelier UI en `Settings.jsx`**

En `frontend/src/components/Settings.jsx`:
* Al recibir el resultado del Sommelier, si `sommelierResult._source === 'barista_fallback'`, mostrar un badge informativo: `⚡ Sommelier Local (Modo Cero Desconexión)`.

- [ ] **Step 3: Compilar frontend para verificar sintaxis**

Run: `npm run build-frontend`  
Expected: Exit code 0.

- [ ] **Step 4: Commit de Task 2**

```bash
git add frontend/src/components/BatchDetail.jsx frontend/src/components/Settings.jsx
git commit -m "feat(ui): add friendly barista engine badging for offline recipe fallback"
```

---

### Task 3: Navegación Multi-Rack por Pestañas en `TubeRacksView.jsx`

**Files:**
- Modify: `frontend/src/components/TubeRacksView.jsx`

- [ ] **Step 1: Añadir estado de rack activo y barra de pestañas**

En `frontend/src/components/TubeRacksView.jsx`:
* Añadir estado `selectedRackId`: por defecto el ID del primer rack de la lista.
* Si se eliminan o crean racks, sincronizar `selectedRackId`.
* Renderizar barra horizontal de tabs con scroll táctil:
  * Tab activo: estilo píldora relleno con contador de tubos ocupados.
  * Tabs inactivos: fondo sutil con texto secundario.
  * Tab `+ Nuevo Rack`: botón dashed con icono `Plus`.

- [ ] **Step 2: Filtrar la vista al rack seleccionado**

* Mostrar el rack seleccionado en el contenedor principal con cabecera de opciones (Renombrar, Vaciar, Eliminar).
* Resumen superior: Mostrar el conteo global de todos los racks combinados (ej. `11 / 12 tubos listos en total`).

- [ ] **Step 3: Compilar frontend y verificar**

Run: `npm run build-frontend`  
Expected: Exit code 0.

- [ ] **Step 4: Commit de Task 3**

```bash
git add frontend/src/components/TubeRacksView.jsx
git commit -m "feat(racks): add pill-tab multi-rack navigation and global dose counter"
```

---

### Task 4: Rediseño Visual de Tubos Bean Cellar (Madera + Vidrio + Tueste)

**Files:**
- Modify: `frontend/src/components/TubeRacksView.jsx`

- [ ] **Step 1: Implementar la silueta y degradados del tubo de ensayo**

En `frontend/src/components/TubeRacksView.jsx`:
* Reemplazar las cajas de slots con la estética Bean Cellar aprobada:
  1. Tapón de madera/nogal superior (`background: #8B5A2B`, borde redondeado 3px, sombra).
  2. Tubo de ensayo con base curva (`border-radius: 0 0 16px 16px`, ancho 36px, alto 50px).
  3. Degradado dinámico según `roast_level`:
     * Claro: Ámbar (`rgba(217,119,6,0.15)` a `#D97706`).
     * Medio: Caoba (`rgba(180,83,9,0.15)` a `#9A3412`).
     * Oscuro: Chocolate (`rgba(67,40,24,0.15)` a `#432818`).
  4. Píldora de peso de dosis en la base del tubo (ej. `19.5g`).

- [ ] **Step 2: Badges cromáticos de proceso e indicador de congelado**

* Badge de proceso según `process`:
  * Lavado: `#E0F2FE` / `#0284C7` (Celeste).
  * Natural: `#FFEDD5` / `#EA580C` (Naranja).
  * Anaeróbico: `#F3E8FF` / `#7E22CE` (Púrpura).
* Indicador de frío `❄️` con borde escarcha cian `#38BDF8` si el lote tiene `freeze_date` o el rack es de congelador.
* Ranuras vacías: Silueta translúcida con borde punteado suave, número de posición y botón `+ Asignar`.

- [ ] **Step 3: Compilar frontend y ejecutar pruebas de tarjetas**

Run: `npm run build-frontend && npm run test:cards`  
Expected: Exit code 0, 32/32 tests passed.

- [ ] **Step 4: Commit de Task 4**

```bash
git add frontend/src/components/TubeRacksView.jsx
git commit -m "feat(racks): overhaul 2x3 slots with artisanal wooden/glass bean cellar skeuomorphism"
```

---

### Task 5: Verificación Integral y Despliegue en VPS (Zerker)

**Files:**
- Test: `scripts/test_tube_racks_api.js`
- Test: `scripts/test_ai_resilience.js`
- Deployment: VPS `/var/www/beantag`

- [ ] **Step 1: Ejecutar suite de pruebas local completa**

Run: `npm run build-frontend && npm run test:cards && node scripts/test_tube_racks_api.js && node scripts/test_ai_resilience.js`  
Expected: Todos los comandos retornan exit code 0.

- [ ] **Step 2: Push de commits a origin/main**

Run: `git push origin main`  
Expected: Push completado con éxito a GitHub.

- [ ] **Step 3: Despliegue en VPS mediante Zerker**

Ejecutar mediante el script seguro de Zerker:
```bash
/Users/zebas/.gemini/config/skills/zerker/scripts/run_vps_cmd.sh "cd /var/www/beantag && git pull origin main && npm run build-frontend && pm2 restart beantag"
```
Expected: Fast-forward pull, Vite build exitoso y PM2 status `online`.

- [ ] **Step 4: Verificación en vivo de logs y HTTPS**

Ejecutar:
```bash
/Users/zebas/.gemini/config/skills/zerker/scripts/run_vps_cmd.sh "pm2 logs beantag --lines 15 --nostream"
curl -k -sI https://5.189.152.68.nip.io/beantag/
```
Expected: HTTP 200 OK y cero excepciones en los logs.
