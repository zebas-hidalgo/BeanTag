# BeanTag V4 Modular Redesign & Barista Ergonomics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform BeanTag into a modular, high-craft, and barista-ergonomic V4 application by introducing unified semantic design tokens, decomposing the 2,921-line `BatchDetail.jsx` monolith into 5 focused subcomponents, optimizing live brewing glanceability, and ensuring robust touch targets.

**Architecture:** A layered approach separating tokens (`tokens.css`, `barista-ui.css`), modular batch detail views in `frontend/src/components/batch/`, enhanced high-glanceability brewing modals with Web Audio/Haptics, and responsive CSS Grid for tube rack single-dosing. All existing API contracts, physical coffee physics, and card canvas generators remain 100% backward compatible.

**Tech Stack:** React 18, Vite, CSS Native Tokens & Variables, Lucide React, Web Vibration API, Web AudioContext, Express backend, SQLite.

---

## Tareas de Implementación

### Tarea 1: Tokens Semánticos y Clases Utilitarias (`tokens.css` y `barista-ui.css`)
**Archivos:**
- Create: `frontend/src/styles/tokens.css`
- Create: `frontend/src/styles/barista-ui.css`
- Modify: `frontend/src/index.css`

- [ ] **Paso 1:** Crear `frontend/src/styles/tokens.css` con las variables definidas en `DESIGN.md` (paleta *Nature Distilled*, modo OLED `#000000`, escala tipográfica Major Third y estados de válvula).
- [ ] **Paso 2:** Crear `frontend/src/styles/barista-ui.css` con clases atómicas:
  - `.barista-btn`, `.barista-btn-primary`, `.barista-btn-secondary`, `.barista-btn-ghost` (con `min-height: 44px; min-width: 44px;`).
  - `.barista-card`, `.barista-card-elevated`, `.barista-card-subtle`.
  - `.barista-chip`, `.barista-chip-active`, `.barista-chip-honey`.
  - `.barista-chip-valve-closed`, `.barista-chip-valve-half`, `.barista-chip-valve-open`.
  - `.barista-stepper-btn` (área táctil mínima de 44px para incrementos de clics y gramos).
- [ ] **Paso 3:** Importar `tokens.css` y `barista-ui.css` al inicio de `frontend/src/index.css`.
- [ ] **Paso 4:** Verificar que `npm --prefix frontend run build` compile sin advertencias.
- [ ] **Paso 5:** Commit: `git add frontend/src/styles/ frontend/src/index.css && git commit -m "feat(styles): add V4 semantic tokens and barista-ui utility classes"`

---

### Tarea 2: Crear Componentes de Cabecera y Acción (`BatchHeaderCard` y `BatchStickyActionBar`)
**Archivos:**
- Create: `frontend/src/components/batch/BatchHeaderCard.jsx`
- Create: `frontend/src/components/batch/BatchStickyActionBar.jsx`

- [ ] **Paso 1:** Crear `frontend/src/components/batch/BatchHeaderCard.jsx`:
  - Recibe: `batch`, `onSubtractDose`, `onEditBatch`, `onDeleteTrigger`, `isFrozen`, `daysSinceRoast`, `roastDotColor`.
  - Muestra badges de proceso, tueste, origen, finca, altitud y puntuación SCA.
  - Muestra estado de cava/congelado y selector rápido de dosis restantes con botón de deducción táctil de 44px.
- [ ] **Paso 2:** Crear `frontend/src/components/batch/BatchStickyActionBar.jsx`:
  - Recibe: `onStartBrew`, `onSaveRecipe`, `onShareCard`, `isSaving`, `hasChanges`.
  - Se fija en la parte inferior sobre el `BottomNav` con efecto de cristal (*backdrop-filter blur*).
  - Botón primario prominente "Preparar Café" (Play) y secundarios para "Guardar" y "Compartir".
- [ ] **Paso 3:** Verificar compilación de ambos componentes.
- [ ] **Paso 4:** Commit: `git add frontend/src/components/batch/ && git commit -m "feat(batch): add BatchHeaderCard and BatchStickyActionBar components"`

---

### Tarea 3: Crear Componentes de Parámetros, Molienda y Vertidos (`RecipeParamsGrid`, `GrinderSyncMatrix`, `PourSequenceTimeline`)
**Archivos:**
- Create: `frontend/src/components/batch/RecipeParamsGrid.jsx`
- Create: `frontend/src/components/batch/GrinderSyncMatrix.jsx`
- Create: `frontend/src/components/batch/PourSequenceTimeline.jsx`

- [ ] **Paso 1:** Crear `frontend/src/components/batch/RecipeParamsGrid.jsx`:
  - Control segmentado de métodos (V60, Pulsar Mini, AeroPress Go, etc.).
  - Selectores e inputs numéricos táctiles para dosis in (g), dosis out (g), ratio, temperatura y tiempo.
  - Botón selector de recetas legendarias (Scott Rao, Jonathan Gagné con dosis calibrada a 18g para Pulsar Mini).
- [ ] **Paso 2:** Crear `frontend/src/components/batch/GrinderSyncMatrix.jsx`:
  - Control unificado de micrones físicos $D_{50}$ con slider y botones de paso fino.
  - Matriz visual que muestra la configuración sincronizada en tiempo real para los 8 molinos soportados.
  - Resaltado visual del molino activo preferido por el usuario.
- [ ] **Paso 3:** Crear `frontend/src/components/batch/PourSequenceTimeline.jsx`:
  - Lista interactiva de etapas de vertido (agua por vertido, agua acumulada, tiempo, caudal).
  - Indicador de estado de válvula para NextLevel Pulsar Mini (🔒 Cerrada, ⚡ 50% Media, 🔓 100% Abierta).
  - Botones táctiles para añadir o reordenar vertidos.
- [ ] **Paso 4:** Verificar compilación del frontend.
- [ ] **Paso 5:** Commit: `git add frontend/src/components/batch/ && git commit -m "feat(batch): add RecipeParamsGrid, GrinderSyncMatrix, and PourSequenceTimeline"`

---

### Tarea 4: Refactorizar `BatchDetail.jsx` en Orquestador Liviano
**Archivos:**
- Modify: `frontend/src/components/BatchDetail.jsx`

- [ ] **Paso 1:** Sustituir la lógica monolítica de renderizado en `BatchDetail.jsx` por los 5 submódulos de `components/batch/`.
- [ ] **Paso 2:** Mantener íntegros todos los hooks de carga de lote, guardado de receta, asistente IA y disparadores de modales (`BrewGuideModal`, generador de tarjetas, modal de eliminación).
- [ ] **Paso 3:** Verificar que el archivo se reduzca de >2,920 líneas a menos de 450 líneas sin romper ninguna propiedad o callback existente.
- [ ] **Paso 4:** Ejecutar pruebas automatizadas: `node scripts/test_pulsar_mini.mjs` y `node scripts/test_ai_reliability.mjs`.
- [ ] **Paso 5:** Commit: `git add frontend/src/components/BatchDetail.jsx && git commit -m "refactor(batch): slim down BatchDetail into clean orchestrator under 450 lines"`

---

### Tarea 5: Ergonomía de Extracción en Vivo (`BrewGuideModal.jsx`)
**Archivos:**
- Modify: `frontend/src/components/BrewGuideModal.jsx`

- [ ] **Paso 1:** Aumentar la tipografía del cronómetro principal a `clamp(3.2rem, 12vw, 4.8rem)` con `font-family: var(--font-metric)` y números tabulares para lectura clara a 1 metro.
- [ ] **Paso 2:** Ampliar las metas de agua (`120g / 300g`) con alto contraste (12:1) y fuente legible.
- [ ] **Paso 3:** Diseñar el badge dinámico de válvula para NextLevel Pulsar Mini:
  - 🔒 Válvula Cerrada (Rojo rubí `#EF4444`, texto blanco).
  - ⚡ Válvula 50% Media (Ámbar flujo `#F59E0B`, texto oscuro).
  - 🔓 Válvula Abierta (Verde esmeralda `#10B981`, texto blanco).
- [ ] **Paso 4:** Aumentar los botones táctiles de control (Play/Pause, Vertido Siguiente) a un mínimo de **56px** de alto con espaciado de 14px.
- [ ] **Paso 5:** Verificar compilación y pruebas: `node scripts/verify_cards_render.mjs`.
- [ ] **Paso 6:** Commit: `git add frontend/src/components/BrewGuideModal.jsx && git commit -m "feat(brew-guide): upgrade glanceability at 1m, 56px touch targets and Pulsar valve badges"`

---

### Tarea 6: Modernizar Portatubos (`TubeRacksView.jsx` y `SlotAssignModal.jsx`)
**Archivos:**
- Modify: `frontend/src/components/TubeRacksView.jsx`
- Modify: `frontend/src/components/SlotAssignModal.jsx`

- [ ] **Paso 1:** En `TubeRacksView.jsx`, reemplazar los anchos manuales inline por CSS Grid auto-fit (`grid-template-columns: repeat(auto-fit, minmax(72px, 1fr)); gap: 10px;`) garantizando cero desbordamiento horizontal en pantallas móviles.
- [ ] **Paso 2:** En `SlotAssignModal.jsx`, ampliar las ranuras y botones de selección a touch targets de 48px+ con números de tubo frontales legibles (#01 al #12).
- [ ] **Paso 3:** Verificar compilación: `npm --prefix frontend run build`.
- [ ] **Paso 4:** Commit: `git add frontend/src/components/TubeRacksView.jsx frontend/src/components/SlotAssignModal.jsx && git commit -m "feat(racks): upgrade tube rack grid to responsive auto-fit and 48px touch targets"`

---

### Tarea 7: Verificación Integral, Despliegue en VPS y Verificación en Producción
**Archivos:**
- System-wide

- [ ] **Paso 1:** Ejecutar suite completa de tests:
  - `node scripts/test_pulsar_mini.mjs`
  - `node scripts/test_ai_reliability.mjs`
  - `node scripts/verify_cards_render.mjs`
- [ ] **Paso 2:** Compilar frontend de producción: `npm --prefix frontend run build`.
- [ ] **Paso 3:** Desplegar en el VPS con `./deploy.sh` y confirmar reinicio de PM2 en el servidor `5.189.152.68`.
- [ ] **Paso 4:** Verificar con cURL respuesta `HTTP/1.1 200 OK` en `https://5.189.152.68.nip.io/beantag/`.
- [ ] **Paso 5:** Sincronizar repositorio remoto: `git push origin main`.
