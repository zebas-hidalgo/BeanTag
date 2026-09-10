# 4 Estilos Estéticos de Tickets para Compartir Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar en `cardGenerator.js` los 4 nuevos estilos visuales de alta gama para compartir (Recibo Térmico Tokyo Kissaten, Pasaporte Editorial Nórdico, Tarjeta de Embarque Coffee Boarding Pass y Cyber Tokyo Lab OLED Dark) y actualizar los modales de compartir en `BatchDetail.jsx`, `Inventory.jsx` y `BrewHistory.jsx`.

**Architecture:**
- En `cardGenerator.js`, se añaden los renderizadores especializados para cada uno de los 4 estilos tanto en `generateRecipeCardImage` (ficha/receta individual) como en `generateCoffeeMenuCardImage` (carta del congelador).
- En `BatchDetail.jsx`, `Inventory.jsx` y `BrewHistory.jsx`, se actualizan los selectores de plantilla a 4 botones: `[ 🧾 Recibo ] [ 🏷️ Editorial ] [ 🎫 Boarding Pass ] [ 🌑 Cyber Lab ]`.
- Sincronización transparente con persistencia en `localStorage`.

**Tech Stack:** React 18, HTML5 Canvas 2D API (2x Retina rendering), Vite, Express, PM2 en Ubuntu VPS.

---

### Task 1: Implementar los 4 Estilos de Tickets en `cardGenerator.js`

**Files:**
- Modify: `frontend/src/utils/cardGenerator.js`

- [ ] **Step 1: Normalizador de estilos**
  Soportar `receipt`, `editorial`, `boarding`, `archive` (con compatibilidad retroactiva para `craft`, `ticket`, `minimal`, `dark`).
- [ ] **Step 2: Renderizador `generateRecipeCardImage` para los 4 estilos**
  - `receipt`: Recibo térmico Tokyo Kissaten con sello rojo Hanko, comanda punteada y código de barras.
  - `editorial`: Pasaporte Nordic Atelier con balance de taza en puntos visuales (`●●●●○`) y bloques limpios.
  - `boarding`: Tarjeta de embarque con ruta `[ORIGEN] ➔ [CAVA]`, badges de vuelo y cupón recortable.
  - `archive`: Cyber Tokyo Lab en negro OLED con franja bermellón y matriz de especificaciones.
- [ ] **Step 3: Renderizador `generateCoffeeMenuCardImage` para los 4 estilos**
  Adaptar la carta de cafés a los 4 estilos coherentes.

---

### Task 2: Actualizar Modales de Compartir en Componentes

**Files:**
- Modify: `frontend/src/components/BatchDetail.jsx`
- Modify: `frontend/src/components/Inventory.jsx`
- Modify: `frontend/src/components/BrewHistory.jsx`

- [ ] **Step 1: Actualizar `BatchDetail.jsx`**
  Configurar los 4 botones de estilo en el modal de compartir receta/lote.
- [ ] **Step 2: Actualizar `Inventory.jsx`**
  Configurar los 4 botones de estilo en el modal de compartir carta de cafés.
- [ ] **Step 3: Actualizar `BrewHistory.jsx`**
  Configurar los 4 botones de estilo en el modal de exportar calibración.

---

### Task 3: Verificación, Build y Despliegue en VPS

**Files:**
- Run build and deploy

- [ ] **Step 1: Compilar frontend localmente**
  Ejecutar `npm run build` en `frontend/` y verificar 0 errores.
- [ ] **Step 2: Git commit y push a `main`**
- [ ] **Step 3: Desplegar en VPS con Zerker**
  Ejecutar git pull, build y pm2 restart en `5.189.152.68`.
- [ ] **Step 4: Comprobar live URL y documentar en Walkthrough**
