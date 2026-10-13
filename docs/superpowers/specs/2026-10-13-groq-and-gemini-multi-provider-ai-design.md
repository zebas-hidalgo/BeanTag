# Diseño Técnico: Integración Multi-Proveedor de IA (Groq Llama 3.3 + Google Gemini)

**Fecha:** 2026-10-13  
**Estado:** Aprobado por el usuario  
**Módulos Afectados:**
- Backend: `backend/aiEngine.js`, `backend/server.js`
- Frontend: `frontend/src/components/Settings.jsx`, `frontend/src/components/BatchDetail.jsx`, `frontend/src/components/BatchCreator.jsx`
- Tests: `scripts/test_groq_integration.js`, `scripts/test_ai_resilience.js`

---

## 1. Contexto y Objetivos

Actualmente BeanTag dependía exclusivamente de la API de Google Gemini para las funciones asistidas por IA (recetas multivariables, dial-in adaptativo, Sommelier de Cava y escaneo OCR de bolsas). En cuentas gratuitas de Google AI Studio, las cuotas estrictas de tokens (con bloqueos de hasta 14 horas bajo error 429) y los timeouts de red generaban interrupciones.

El objetivo de esta integración es:
1. **Incorporar Groq como Proveedor de IA de Alta Velocidad:** Groq ofrece inferencia LPU ultrarrápida (~500 tokens/segundo) con **Meta Llama 3.3 70B Versatile** y **Llama 3.2 Vision**, con una capa gratuita generosa y sin los bloqueos de cuota restrictivos de Google.
2. **Selector Multi-Proveedor Conmutable:** Permitir al usuario alternar entre **Groq** y **Google Gemini** desde *Perfil / Ajustes*, almacenando credenciales de forma segura y transparente en el cliente.
3. **Timeouts Realistas y Resiliencia Total:** Ajustar los timeouts a 12s para texto y 25s para escaneo multimodal de fotos, evitando abortos prematuros de peticiones legítimas.
4. **Fallback Barista Offline Permanente:** Ante cuota agotada (429) o fallas de red en cualquiera de los proveedores, activar inmediatamente el motor determinista local de BeanTag sin mostrar errores al usuario.

---

## 2. Arquitectura del Sistema

### 2.1. Backend: Inferencia Unificada de IA (`backend/aiEngine.js` y `backend/server.js`)

#### A. Nuevo Módulo `callGroqWithRetry` (`backend/aiEngine.js`)
* Inferencia nativa vía HTTP `fetch` hacia `https://api.groq.com/openai/v1/chat/completions`.
* Cabeceras:
  * `Authorization: Bearer <GROQ_API_KEY>`
  * `Content-Type: application/json`
* Parámetros de petición:
  * Modelos de texto: `llama-3.3-70b-versatile` (por defecto) o `llama-3.1-8b-instant`.
  * Modelo de visión: `llama-3.2-11b-vision-preview`.
  * Forzado de JSON estructurado: `response_format: { type: "json_object" }`.
* Timeouts con `AbortController`:
  * Texto (recetas, dial-in, sommelier, test): **12.000 ms (12 segundos)**.
  * Visión (escaneo de fotos de bolsa en base64): **25.000 ms (25 segundos)**.

#### B. Despachador Unificado de IA en `backend/server.js`
* Helper `getAiConfig(req)`:
  * Extrae `x-ai-provider` (`'groq'` o `'gemini'`).
  * Extrae claves API (`x-groq-key`, `x-gemini-key`).
  * Extrae modelo deseado (`x-ai-model`).
* Endpoints unificados:
  * `POST /api/test-groq`: Diagnóstico de conexión en 1 clic para Groq.
  * `POST /api/test-gemini`: Diagnóstico de conexión para Gemini.
  * `POST /api/recommend-recipe`: Genera receta con el proveedor activo o fallback offline.
  * `POST /api/ai/tune-recipe`: Recalibración sensorial con el proveedor activo o fallback offline.
  * `POST /api/ai/sommelier`: Sommelier con el proveedor activo o fallback offline.
  * `POST /api/ai/scan-bag`: Escaneo multimodal de bolsas con visión de Groq o Gemini.

---

### 2.2. Frontend: Interfaz de Ajustes y Despacho (`Settings.jsx`, `BatchDetail.jsx`, `BatchCreator.jsx`)

#### A. Configuración de IA en `Settings.jsx`
* Selector segmentado de proveedor:
  * `[ ⚡ Groq (Llama 3.3) ]` | `[ 🧠 Google Gemini ]`
  * Sincronizado en `localStorage.getItem('ai-provider')` (por defecto `'groq'`).
* Panel Dinámico:
  * Si `provider === 'groq'`:
    * Campo de API Key de Groq (`localStorage.getItem('groq-key')`).
    * Enlace de ayuda: *"Obtén tu clave gratis sin tarjeta en console.groq.com"*.
    * Selector de modelos: `llama-3.3-70b-versatile` y `llama-3.1-8b-instant`.
    * Botón *"Probar Conexión con Groq"*.
  * Si `provider === 'gemini'`:
    * Campo de API Key de Gemini (`localStorage.getItem('gemini-key')`).
    * Selector de modelos: `gemini-3.8-flash` y `gemini-3.1-pro-preview`.
    * Botón *"Probar Conexión con Gemini"*.
* Cabeceras compartidas: Las peticiones de la app inyectan automáticamente las credenciales del proveedor activo.

---

## 3. Plan de Verificación

1. **Pruebas Automatizadas de Groq (`scripts/test_groq_integration.js`):**
   * Verificación de generación de JSON estructurado con `callGroqWithRetry`.
   * Verificación de manejo de timeout (12s/25s) y captura de 429 con fallback.
2. **Pruebas de Regresión:**
   * `npm run test:cards` (32/32 cartas renderizadas).
   * `node scripts/test_tube_racks_api.js` (12/12 endpoints de portatubos).
   * `node scripts/test_ai_resilience.js` (fallback determinista offline intacto).
3. **Compilación de Producción:**
   * `npm run build-frontend` con exit code 0.
4. **Despliegue a VPS con Zerker:**
   * `git push origin main`.
   * `git pull`, `build-frontend`, `pm2 restart beantag` en el servidor VPS.
   * Verificación en vivo HTTPS 200.
