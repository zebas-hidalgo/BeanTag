# Plan de Implementación: Multi-Proveedor de IA (Groq Llama 3.3 + Google Gemini)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrar Groq (Meta Llama 3.3 70B & Llama 3.2 Vision) como proveedor de inferencia ultrarrápida junto a Google Gemini, con selector conmutable en Ajustes, timeouts realistas (12s/25s) y fallback automático al motor barista offline ante errores de cuota (429).

**Architecture:** En `backend/aiEngine.js`, implementar `callGroqWithRetry` vía API compatible con OpenAI (`api.groq.com/openai/v1/chat/completions`) y ajustar timeouts de Gemini a 12s/25s. En `backend/server.js`, unificar la extracción de credenciales (`getAiConfig`) y despachar a Groq o Gemini según la cabecera `x-ai-provider`. En el frontend, añadir selector de proveedor conmutable en `Settings.jsx` y propagar cabeceras en `BatchDetail.jsx` y `BatchCreator.jsx`.

**Tech Stack:** Node.js, Express, Groq API (Llama 3.3 70B / Llama 3.2 Vision), Google Gemini API (3.8-flash), React 18, Vite, Zerker SSH.

---

### Task 1: Motor de Inferencia Groq y Timeouts Realistas en Backend

**Files:**
- Modify: `backend/aiEngine.js`
- Create: `scripts/test_groq_integration.js`

- [ ] **Step 1: Crear script de prueba de integración de Groq**

Crear `scripts/test_groq_integration.js` para validar:
1. `callGroqWithRetry` maneja correctamente payloads de texto y formatea JSON estructurado.
2. Si la clave es inválida o no se proporciona, captura el error adecuadamente.
3. El timeout de 12s para texto y 25s para visión funciona con `AbortController`.

- [ ] **Step 2: Ejecutar el test para comprobar que falla antes de la implementación**

Run: `node scripts/test_groq_integration.js`  
Expected: FAIL con `callGroqWithRetry is not defined`.

- [ ] **Step 3: Implementar `callGroqWithRetry` y timeouts en `backend/aiEngine.js`**

1. Implementar `callGroqWithRetry(promptOrMessages, apiKey, model = 'llama-3.3-70b-versatile', isVision = false, timeoutMs = 12000)`:
   - Endpoint: `https://api.groq.com/openai/v1/chat/completions`.
   - Headers: `Authorization: Bearer ${apiKey.trim()}`, `Content-Type: application/json`.
   - Payload:
     * Si `isVision`: mensajes con `image_url` en base64 y modelo por defecto `llama-3.2-11b-vision-preview`.
     * Si texto: `messages: [{ role: 'user', content: prompt }]`, `response_format: { type: "json_object" }`.
   - Timeout con `AbortController`: 12.000ms por defecto, o 25.000ms si `isVision`.
   - Limpieza y parseo de JSON robusto.
2. En `callGeminiWithRetry`:
   - Aumentar timeout por defecto a **12.000ms** para texto y **25.000ms** si `isVision` o multimodal.
   - En caso de error 429 con mensaje de cuota agotada ("Quota exceeded" o "limit: 0"), no reintentar inútilmente y abortar de inmediato para dar paso al fallback offline.
3. Exportar `callGroqWithRetry`.

- [ ] **Step 4: Ejecutar el test para comprobar que pasa**

Run: `node scripts/test_groq_integration.js`  
Expected: PASS con exit code 0.

- [ ] **Step 5: Commit de Task 1**

```bash
git add backend/aiEngine.js scripts/test_groq_integration.js
git commit -m "feat(ai): add Groq inference engine with Llama 3.3 and realistic 12s/25s timeouts"
```

---

### Task 2: Despachador Multi-Proveedor en `backend/server.js`

**Files:**
- Modify: `backend/server.js`

- [ ] **Step 1: Implementar helper `getAiConfig(req)` y endpoint `/api/test-groq`**

1. En `backend/server.js`:
   * Importar `callGroqWithRetry` desde `./aiEngine`.
   * Crear helper `getAiConfig(req)`:
     - `provider`: `req.headers['x-ai-provider'] || 'groq'` (o gemini si solo hay key de gemini).
     - `groqKey`: `req.headers['x-groq-key'] || req.body?.groqKey || ''`.
     - `geminiKey`: `req.headers['x-gemini-key'] || req.body?.apiKey || ''`.
     - `model`: `req.headers['x-ai-model'] || req.body?.model`.
2. Añadir endpoint de prueba de conexión `POST /api/test-groq`:
   - Llama a `callGroqWithRetry` con prompt corto de prueba.
   - Devuelve `{ success: true, provider: 'groq', model, message: '¡Conexión exitosa con Groq (Llama 3.3)! ⚡' }`.

- [ ] **Step 2: Conectar Groq a los endpoints de recetas, sommelier y scanner**

1. `/api/recommend-recipe`:
   - Si `provider === 'groq'` y hay `groqKey`, llama a `callGroqWithRetry(prompt, groqKey, model)`.
   - Si `provider === 'gemini'`, llama a Gemini.
   - Si cualquiera falla o no hay clave, activa de inmediato `computeOfflineRecipe`.
2. `/api/ai/tune-recipe`:
   - Despacha a Groq o Gemini con fallback determinista `computeOfflineTuning`.
3. `/api/ai/sommelier`:
   - Despacha a Groq o Gemini con fallback determinista `computeOfflineSommelier`.
4. `/api/ai/scan-bag`:
   - Si `provider === 'groq'` y hay `groqKey`, invoca visión de Groq con `llama-3.2-11b-vision-preview` (timeout 25s).
   - Si `provider === 'gemini'`, invoca visión de Gemini (timeout 25s).

- [ ] **Step 3: Ejecutar pruebas de regresión en backend**

Run: `node scripts/test_ai_resilience.js && node scripts/test_tube_racks_api.js`  
Expected: Todos pasan con exit code 0.

- [ ] **Step 4: Commit de Task 2**

```bash
git add backend/server.js
git commit -m "feat(ai): unified multi-provider AI dispatcher supporting Groq and Gemini"
```

---

### Task 3: Selector de Proveedor e Interfaz en `frontend/src/components/Settings.jsx`

**Files:**
- Modify: `frontend/src/components/Settings.jsx`

- [ ] **Step 1: Añadir estado de proveedor y almacenamiento local**

1. En `Settings.jsx`:
   - `const [aiProvider, setAiProvider] = useState(() => localStorage.getItem('beantag-ai-provider') || 'groq');`
   - `const [groqKey, setGroqKey] = useState(() => localStorage.getItem('groq-key') || '');`
   - `const [groqModel, setGroqModel] = useState(() => localStorage.getItem('groq-model') || 'llama-3.3-70b-versatile');`
   - Sincronizar cambios en `localStorage`.

- [ ] **Step 2: Renderizar selector segmentado de proveedor y paneles dedicados**

1. Selector superior con diseño estilo píldora:
   `[ ⚡ Groq (Llama 3.3) ]` | `[ 🧠 Google Gemini ]`
2. Panel de Groq:
   - Input de API Key (`gsk_...`) con toggle de visibilidad.
   - Enlace directo a `https://console.groq.com/keys` ("Consigue tu clave gratuita sin tarjeta").
   - Selector de modelos:
     * `llama-3.3-70b-versatile` (Recomendado • Razonamiento Barista 70B)
     * `llama-3.1-8b-instant` (Ultrarrápido • ~200ms)
   - Botón "Probar Conexión con Groq".
3. Panel de Gemini:
   - Conserva la configuración actual de Gemini y botón "Probar Conexión con Gemini".
4. En `handleAskSommelier`:
   - Inyectar cabeceras `x-ai-provider`, `x-groq-key`, `x-gemini-key`, `x-ai-model`.

- [ ] **Step 3: Compilar frontend con Vite**

Run: `npm run build-frontend`  
Expected: Exit code 0.

- [ ] **Step 4: Commit de Task 3**

```bash
git add frontend/src/components/Settings.jsx
git commit -m "feat(ui): add AI provider selector for Groq and Gemini in Settings"
```

---

### Task 4: Propagación de Cabeceras en `BatchDetail.jsx` y `BatchCreator.jsx`

**Files:**
- Modify: `frontend/src/components/BatchDetail.jsx`
- Modify: `frontend/src/components/BatchCreator.jsx`

- [ ] **Step 1: Propagar cabeceras en `BatchDetail.jsx`**

En `frontend/src/components/BatchDetail.jsx`:
- En `handleAskAi` y `handleRecalibrate`:
  * Leer `provider = localStorage.getItem('beantag-ai-provider') || 'groq'`.
  * Leer `groqKey = localStorage.getItem('groq-key') || ''`.
  * Leer `geminiKey = localStorage.getItem('gemini-key') || ''`.
  * Inyectar:
    ```javascript
    headers['x-ai-provider'] = provider;
    headers['x-groq-key'] = groqKey;
    headers['x-gemini-key'] = geminiKey;
    headers['x-ai-model'] = provider === 'groq' ? (localStorage.getItem('groq-model') || 'llama-3.3-70b-versatile') : (localStorage.getItem('gemini-model') || 'gemini-3.8-flash');
    ```

- [ ] **Step 2: Propagar cabeceras en `BatchCreator.jsx` (Escaneo OCR)**

En `frontend/src/components/BatchCreator.jsx`:
- En `handleScanBag`:
  * Inyectar `x-ai-provider`, `x-groq-key`, `x-gemini-key` en la petición a `api/ai/scan-bag`.

- [ ] **Step 3: Compilar frontend y verificar generación de tarjetas**

Run: `npm run build-frontend && npm run test:cards`  
Expected: Exit code 0, 32/32 tests pass.

- [ ] **Step 4: Commit de Task 4**

```bash
git add frontend/src/components/BatchDetail.jsx frontend/src/components/BatchCreator.jsx
git commit -m "feat(ui): propagate multi-provider headers in recipe assistant and bag scanner"
```

---

### Task 5: Verificación Integral y Despliegue en VPS (Zerker)

**Files:**
- Test suites: `test_ai_resilience.js`, `test_groq_integration.js`, `test_tube_racks_api.js`, `verify_cards_render.mjs`
- Deployment: VPS `/var/www/beantag`

- [ ] **Step 1: Ejecutar suite de pruebas local completa**

Run: `npm run build-frontend && npm run test:cards && node scripts/test_tube_racks_api.js && node scripts/test_ai_resilience.js && node scripts/test_groq_integration.js`  
Expected: Todos pasan con exit code 0.

- [ ] **Step 2: Push a origin/main**

Run: `git push origin main`  
Expected: Push completado a GitHub.

- [ ] **Step 3: Despliegue en VPS con Zerker**

```bash
/Users/zebas/.gemini/config/skills/zerker/scripts/run_vps_cmd.sh "cd /var/www/beantag && git pull origin main && npm run build-frontend && pm2 restart beantag"
```
Expected: Fast-forward pull, Vite build exitoso y PM2 status `online`.

- [ ] **Step 4: Verificación en vivo**

```bash
/Users/zebas/.gemini/config/skills/zerker/scripts/run_vps_cmd.sh "pm2 logs beantag --lines 15 --nostream"
curl -k -sI https://5.189.152.68.nip.io/beantag/
```
Expected: HTTP 200 OK y cero errores.
