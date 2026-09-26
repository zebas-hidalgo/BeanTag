# Unificación del Master Extraction Timeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unificar las dos secciones redundantes de timeline en las tarjetas de receta de BeanTag (Modo Con Receta) en una sola barra continua de alta densidad "Master Extraction Timeline" que integra vertidos reales, pesos acumulados en balanza y calibración de molienda en los 4 estilos (`blueprint`, `neobrutalist`, `diner`, `kissaten`).

**Architecture:** Evolucionar `drawExtractionTimeline` en `frontend/src/utils/cardGenerator.js` para consumir directamente `normalizeRecipePours(rec)`. Eliminar los bloques intermedios duplicados en los 4 estilos y reordenar el canvas para dar espacio limpio al Radar Sensorial SCA y a las notas del barista.

**Tech Stack:** JavaScript ES2022, HTML5 Canvas 2D API, Node.js test runner headless canvas mock, Vite build system.

---

### Task 1: Enriquecer `drawExtractionTimeline` con Vertidos Reales y Acumulados en Balanza

**Files:**
- Modify: `frontend/src/utils/cardGenerator.js:287-410`
- Test: `scripts/verify_cards_render.mjs`

- [ ] **Step 1: Modificar `drawExtractionTimeline` para consumir `normalizeRecipePours`**
  - Leer vertidos normalizados de `recipeData`.
  - Si existen vertidos personalizados, construir los segmentos a partir de cada vertido (`time`, `stepWater`, `totalWater`, `label`).
  - Si no existen, usar las etapas adaptativas estándar (Espresso, Aeropress, Inmersión, Pour-Over).
  - Incluir en cada segmento el tiempo arriba (`0:00`, `0:45`), y abajo la etiqueta con el delta y la lectura de balanza (`BLOOM (+50g ➔ 50g)`).
  - Incluir en el encabezado la meta total en balanza: `BALANZA: ${dose_out_g}g (${ratio})`.

- [ ] **Step 2: Probar compilación del frontend**
  Run: `npm --prefix frontend run build`
  Expected: Build exitoso sin errores de sintaxis.

- [ ] **Step 3: Ejecutar suite de pruebas de tarjetas**
  Run: `npm run test:cards`
  Expected: 32/32 tests pasan.

- [ ] **Step 4: Commit de la Task 1**
  Run: `git add frontend/src/utils/cardGenerator.js && git commit -m "feat(cards): empower drawExtractionTimeline with real pours and scale targets"`

---

### Task 2: Reorganizar el Layout en Blueprint y Neobrutalist

**Files:**
- Modify: `frontend/src/utils/cardGenerator.js:1145-1310` (Blueprint)
- Modify: `frontend/src/utils/cardGenerator.js:1620-1770` (Neobrutalist)
- Test: `scripts/verify_cards_render.mjs`

- [ ] **Step 1: Reorganizar Blueprint Modo B**
  - Ubicar el Master Timeline inmediatamente después de los Bento tiles (2x2).
  - Eliminar el bloque anterior `flowY` duplicado.
  - Asignar el espacio liberado al bloque sensorial con Radar SCA y a un bloque dedicado para Notas de Preparación del Barista (`rec.notes`).

- [ ] **Step 2: Reorganizar Neobrutalist Modo B**
  - Eliminar la fila de 3 cajas de vertido de `flowY`.
  - Colocar el Master Timeline con estilo neobrutalista pop.
  - Asegurar espacio holgado para los stickers sensoriales, radar SCA y notas.

- [ ] **Step 3: Compilar y validar tests**
  Run: `npm --prefix frontend run build && npm run test:cards`
  Expected: 32/32 tests pasan.

- [ ] **Step 4: Commit de la Task 2**
  Run: `git add frontend/src/utils/cardGenerator.js && git commit -m "feat(cards): unify extraction timeline and declutter layout in blueprint and neobrutalist styles"`

---

### Task 3: Reorganizar el Layout en 1950s Diner y Tokyo Kissaten

**Files:**
- Modify: `frontend/src/utils/cardGenerator.js:2010-2150` (Diner)
- Modify: `frontend/src/utils/cardGenerator.js:2370-2525` (Kissaten)
- Test: `scripts/verify_cards_render.mjs`

- [ ] **Step 1: Reorganizar Diner Modo B**
  - Ajustar la jerarquía entre el Calibration Gauge y el Master Extraction Timeline para que no compitan verticalmente.

- [ ] **Step 2: Reorganizar Kissaten Modo B**
  - Eliminar el bloque redundante `注湯工程 // POUR TIMELINE & PROFILE`.
  - Integrar el Master Timeline con estética artesanal Washi y acentos bermellón.

- [ ] **Step 3: Ejecutar suite de pruebas completa**
  Run: `npm --prefix frontend run build && npm run test:cards && node scripts/test_ai_reliability.mjs`
  Expected: Todos los tests pasan.

- [ ] **Step 4: Commit de la Task 3**
  Run: `git add frontend/src/utils/cardGenerator.js && git commit -m "feat(cards): harmonize extraction timeline in diner and kissaten styles"`

---

### Task 4: Despliegue en Producción y Verificación en Vivo

**Files:**
- Repository remote: `origin/main`
- VPS Server: `5.189.152.68`

- [ ] **Step 1: Push a GitHub**
  Run: `git push origin main`

- [ ] **Step 2: Despliegue en VPS**
  Run: Zerker deployment script en el servidor remoto.
  Expected: PM2 reiniciado, servicio `beantag` online.

- [ ] **Step 3: Verificación de salud HTTP**
  Run: `curl -sI http://5.189.152.68:5000/api/health`
  Expected: HTTP 200 OK.
