# AI Recipe Multivariable Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enriquecer la generación y recalibración de recetas por IA (Gemini) y el motor Barista Offline de BeanTag para que considere integralmente todas las variables físicas del café (fecha de tueste / días de reposo, desgasificación, congelado en cava, puntaje SCA, altitud, proceso, variedad) y del molino (modelo del usuario, muelas cónicas vs planas, resolución exacta de clics en J-Max, K-Ultra, Comandante, Fellow Ode Gen 2, Femobook, Timemore, Baratza).

**Architecture:** Ampliar el motor físico `computeOfflineRecipe` y `computeOfflineTuning` en `backend/aiEngine.js`, expandir los prompts de Gemini en `backend/server.js`, y conectar `RecipeForm.jsx` y `BatchDetail.jsx` para enviar el lote completo con el molino activo y mostrar la calibración multimolino.

**Tech Stack:** JavaScript ES2022, Node.js Express, Google Gemini API (v1beta), React 18, Vite.

---

### Task 1: Ampliar `backend/aiEngine.js` con Días de Reposo, Congelado y Matriz Multimolino

**Files:**
- Modify: `backend/aiEngine.js`
- Test: `scripts/test_ai_reliability.mjs`

- [ ] **Step 1: Agregar helpers de días de reposo y molinos a `backend/aiEngine.js`**
  - Función para calcular días desde la fecha de tueste (`calculateDaysSinceRoast(roastDate)`).
  - Función de detección de molienda de grano congelado (`isFrozenDosing(batch)`).
  - Matriz de cálculo para **1Zpresso K-Ultra / K-Max** (20 µm/clic, dial 0-9) y **Fellow Ode Gen 2** (1-11 con tercios).
  - Compensación física por días de reposo:
    - <7 días: más bloom (+10-15s o 3.5x agua) y molienda ligeramente más gruesa (+1-2 clics) para evitar canalización por $CO_2$.
    - 8-30 días: ventana óptima estándar.
    - >45 días: molienda ligeramente más fina (-1-2 clics) y ratio ligeramente más cerrado.
  - Compensación física por tipo de muela:
    - Planas (Ode Gen 2): extracción más uniforme, menos finos.
    - Cónicas (J-Max, Comandante, Timemore, K-Ultra): más finos, mayor cuerpo.

- [ ] **Step 2: Actualizar `scripts/test_ai_reliability.mjs` con tests de las nuevas variables**
  - Test de días de reposo frescos (<7 días) verificando ajuste en bloom o molienda.
  - Test de molinos adicionales (K-Ultra, Fellow Ode Gen 2).

- [ ] **Step 3: Ejecutar suite de pruebas de IA**
  Run: `node scripts/test_ai_reliability.mjs`
  Expected: Todos los tests pasan.

- [ ] **Step 4: Commit de la Task 1**
  Run: `git add backend/aiEngine.js scripts/test_ai_reliability.mjs && git commit -m "feat(ai): enrich offline barista engine with resting days, freezing and expanded grinders"`

---

### Task 2: Actualizar Prompts de Gemini en `backend/server.js`

**Files:**
- Modify: `backend/server.js:700-865`
- Test: `scripts/test_ai_endpoint_e2e.mjs`

- [ ] **Step 1: Enriquecer el prompt de `/api/recommend-recipe`**
  - Inyectar: `roast_date`, `days_since_roast`, `freeze_date`, `sca_score`, `producer`, `active_grinder`.
  - Explicar las reglas físicas de reposo del café y de geometría de muelas a Gemini.
  - Solicitar en la respuesta el ajuste específico para el molino activo del usuario más la matriz comparativa.

- [ ] **Step 2: Enriquecer el prompt de `/api/ai/tune-recipe`**
  - Aceptar el molino activo del usuario y generar la corrección adaptada a su molino.

- [ ] **Step 3: Ejecutar tests de endpoints de IA**
  Run: `node scripts/test_ai_endpoint_e2e.mjs`
  Expected: Todos los tests pasan con 200 OK.

- [ ] **Step 4: Commit de la Task 2**
  Run: `git add backend/server.js && git commit -m "feat(ai): inject full coffee and grinder physics into Gemini prompts"`

---

### Task 3: Conectar Frontend (`RecipeForm.jsx` y `BatchDetail.jsx`)

**Files:**
- Modify: `frontend/src/components/RecipeForm.jsx`
- Modify: `frontend/src/components/BatchDetail.jsx`
- Test: `npm --prefix frontend run build && npm run test:cards`

- [ ] **Step 1: Enviar payload completo en llamadas a la IA**
  - Enviar `roast_date`, `freeze_date`, `sca_score`, `producer`, `batch_name`, y `grinder: defaultGrinder`.

- [ ] **Step 2: Mejorar la UI de recomendación en `RecipeForm.jsx`**
  - Mostrar la calibración para el molino activo del usuario de forma destacada.
  - Permitir alternar entre molinos (J-Max, K-Ultra, Comandante, Fellow Ode, etc.).
  - Mostrar el badge de la física aplicada (ej. *"Ajustado por grano fresco (Día 5) + Muelas cónicas"*).

- [ ] **Step 3: Compilar y validar tests**
  Run: `npm --prefix frontend run build && npm run test:cards`
  Expected: Build exitoso y 32/32 tests pasan.

- [ ] **Step 4: Commit de la Task 3**
  Run: `git add frontend/src/components/RecipeForm.jsx frontend/src/components/BatchDetail.jsx && git commit -m "feat(ui): display active grinder calibration and multivariable AI rationale in recipe form"`

---

### Task 4: Despliegue en Producción y Verificación en Vivo

**Files:**
- Repository remote: `origin/main`
- VPS Server: `5.189.152.68`

- [ ] **Step 1: Push a GitHub**
  Run: `git push origin main`

- [ ] **Step 2: Despliegue en VPS**
  Run: `run_vps_cmd.sh` ejecutando `git pull`, `npm --prefix frontend run build`, `pm2 restart beantag`.

- [ ] **Step 3: Verificación de salud HTTP**
  Run: `curl -sI http://5.189.152.68:5000/api/health`
  Expected: HTTP 200 OK.
