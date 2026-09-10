# Renovación de Tarjetas a Compartir y Selector en Perfil Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar en la pestaña Perfil la selección del estilo visual de inventario (Editorial, Lista, Archivo) y renovar por completo el generador de tarjetas de compartir (`cardGenerator.js`) con los 3 nuevos estilos de alta definición (Editorial, Ticket Barista, Archivo Lab).

**Architecture:** 
- En `Settings.jsx` se agrega la sección interactiva "Estilo Visual del Inventario", guardando en `localStorage('beantag-inventory-style')` y sincronizando con `Inventory.jsx`.
- En `cardGenerator.js` se actualizan las funciones de renderizado Canvas 2D (`generateRecipeCardImage` y `generateCoffeeMenuCardImage`) para producir imágenes nítidas Retina 2x en los 3 estilos estéticos acordados.
- En `BatchDetail.jsx` e `Inventory.jsx` se actualizan los modales de compartir para permitir seleccionar entre los 3 estilos (*🏷️ Editorial*, *🧾 Ticket*, *📐 Archivo*).

**Tech Stack:** React 18, HTML5 Canvas 2D API (Retina scaleFactor 2x), CSS Variables, Vite, Express/Node.js en VPS con PM2.

---

### Task 1: Selector de Estilo en Perfil (`Settings.jsx`) y Sincronización

**Files:**
- Modify: `frontend/src/components/Settings.jsx`
- Modify: `frontend/src/components/Inventory.jsx`

- [ ] **Step 1: Agregar selector con tarjetas interactivas en `Settings.jsx`**
  Insertar la sección `Estilo Visual del Inventario` con 3 tarjetas (`editorial`, `list`, `archive`), con estado `cardStyle`, guardado en `localStorage` y notificación toast.
- [ ] **Step 2: Sincronizar en `Inventory.jsx`**
  Asegurar que `Inventory.jsx` escuche cambios de `localStorage` o evento `storage` y sincronice el estado para que al cambiar de pestaña el estilo sea el seleccionado en el perfil.
- [ ] **Step 3: Verificar visualmente y funcionalmente**

---

### Task 2: Refactorizar Generador de Tarjetas de Ficha/Receta (`generateRecipeCardImage`) en `cardGenerator.js`

**Files:**
- Modify: `frontend/src/utils/cardGenerator.js`

- [ ] **Step 1: Implementar estilo `editorial` (Nordic Pasaporte / Story Card)**
  - Diseño vertical 840 x 1050 px (4:5) o tarjeta limpia.
  - Paleta cálida, respiro tipográfico, chips SCA con `getScaColorForNote`.
  - Bloque de receta editorial con método, dosis, ratio y notas sensoriales.
- [ ] **Step 2: Implementar estilo `ticket` (Ticket Barista 2.0)**
  - Recibo térmico auténtico con borde estilizado, micras de molienda parseadas, ratio, temperatura y código de barras nítido.
- [ ] **Step 3: Implementar estilo `archive` (Tokyo Coffee Lab Spec Sheet)**
  - Ficha técnica de laboratorio con código `#LOT-XXXX`, matriz de especificaciones monoespaciada (ORIGEN, PROCESO, ALTURA, REPOSO) y sello bermellón.

---

### Task 3: Refactorizar Generador de Carta de Cafés (`generateCoffeeMenuCardImage`) en `cardGenerator.js`

**Files:**
- Modify: `frontend/src/utils/cardGenerator.js`

- [ ] **Step 1: Adaptar la carta del menú a los 3 estilos**
  - `editorial`: Roster de cafés con formato de menú de cafetería de especialidad.
  - `ticket`: Recibo de stock detallado con lista de lotes y tubos.
  - `archive`: Registro de catálogo de congelador con lotes numerados y parámetros técnicos.

---

### Task 4: Actualizar Modales de Compartir en `BatchDetail.jsx` e `Inventory.jsx`

**Files:**
- Modify: `frontend/src/components/BatchDetail.jsx`
- Modify: `frontend/src/components/Inventory.jsx`

- [ ] **Step 1: Actualizar selector en `BatchDetail.jsx`**
  Reemplazar los botones de plantilla (`craft`, `minimal`, `dark`) por `[ 🏷️ Editorial ] [ 🧾 Ticket Barista ] [ 📐 Archivo Lab ]`.
- [ ] **Step 2: Actualizar selector en `Inventory.jsx`**
  Reemplazar selector de carta de cafés por los mismos 3 estilos.

---

### Task 5: Compilación, Despliegue en VPS y Verificación

**Files:**
- Run build and deploy

- [ ] **Step 1: Compilar frontend localmente**
  Ejecutar `npm run build` en `frontend/` y asegurar que no haya errores de sintaxis.
- [ ] **Step 2: Commit y push a GitHub**
- [ ] **Step 3: Desplegar en VPS y reiniciar PM2**
- [ ] **Step 4: Verificar URL en vivo y documentar en Walkthrough**
