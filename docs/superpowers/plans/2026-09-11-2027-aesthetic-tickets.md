# Plan de Implementación: 4 Estilos de Tickets 2026/2027 y Kits de Íconos para BeanTag

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar en Canvas 2D los 4 estilos de tarjetas de alta fidelidad 2026/2027 (Blueprint Técnico, Neo-Brutalist Pop, Holographic Aurora y Hangtag Nórdico) con kits de íconos vectoriales a medida y márgenes holgados, integrándolos en todos los modales de compartición de la app y desplegando en producción.

**Architecture:** Módulo modular de dibujo vectorial `ticketIconKits.js` para iconografía nativa sin emojis genéricos; refactorización del motor de renderizado Retina 2x `cardGenerator.js` con cálculo dinámico de `cursorY` y columnas proporcionales; actualización de los selectores en los componentes de detalle de lote, carta de inventario e historial de recetas.

**Tech Stack:** JavaScript (ES6+), HTML5 Canvas 2D, React 18, Vite 5, Express backend, PM2 en Ubuntu VPS.

---

### Task 1: Módulo de Kits de Íconos Vectoriales (`frontend/src/utils/ticketIconKits.js`)

**Archivos:**
- Crear: `frontend/src/utils/ticketIconKits.js`

- [ ] **Paso 1: Crear las funciones de dibujo vectorial para el Kit Blueprint CAD**
  - `drawBlueprintBean(ctx, x, y, size)`: Corte transversal de grano anatómico, silverskin S-crease, cotas técnicas.
  - `drawBlueprintDripper(ctx, x, y, size)`: Cono V60 en espiral con estrías y ángulo de 60°.
  - `drawBlueprintScale(ctx, x, y, size)`: Báscula digital con cuadrícula milimétrica.
  - `drawBlueprintTimer(ctx, x, y, size)`: Cronómetro analítico con corona y marcas de 60s.

- [ ] **Paso 2: Crear las funciones para el Kit Neo-Brutalist Pop**
  - `drawNeoPopBean(ctx, x, y, size)`: Grano pop con gafas de sol oscuras y contorno negro grueso.
  - `drawNeoPopLightning(ctx, x, y, size)`: Rayo pop fluorescente amarillo lima con borde de 2.5px.
  - `drawNeoPopStar(ctx, x, y, size)`: Medalla estelar SCA 88+ con relleno pop.
  - `drawNeoPopFlame(ctx, x, y, size)`: Llama de tueste con contorno negro sólido.

- [ ] **Paso 3: Crear las funciones para el Kit Holographic Aurora**
  - `drawAuroraCrystalBean(ctx, x, y, size)`: Grano luminiscente con gradiente neón azul/violeta.
  - `drawAuroraWaterDrop(ctx, x, y, size)`: Gota de agua cristalina con ondas refractivas.
  - `drawAuroraWave(ctx, x, y, size)`: Onda espectral de flujo y extracción de TDS.

- [ ] **Paso 4: Crear las funciones para el Kit Hangtag Botánico**
  - `drawBotanicalBranch(ctx, x, y, size)`: Rama de cafeto con cerezas y hojas estriadas.
  - `drawGooseneckKettle(ctx, x, y, size)`: Tetera de cobre clásica con pico cuello de ganso.
  - `drawRoasterySeal(ctx, x, y, size)`: Sello oficial circular de tostaduría artesanal.

- [ ] **Paso 5: Probar importación y verificar sintaxis limpia**

---

### Task 2: Refactorizar Motor Canvas 2D (`frontend/src/utils/cardGenerator.js`)

**Archivos:**
- Modificar: `frontend/src/utils/cardGenerator.js`

- [ ] **Paso 1: Actualizar normalización de estilos (`normalizeCardStyle`)**
  - Mapear `blueprint`, `neobrutalist`, `aurora`, `hangtag` como los 4 estilos oficiales con retrocompatibilidad.
- [ ] **Paso 2: Implementar renderizado de tarjeta individual (`generateRecipeCardImage`)**
  - Estilo 1: `renderBlueprintRecipeCard` con cuadrícula milimétrica, patente de grano, 4 métricas, barra de vertidos y cajetín CAD.
  - Estilo 2: `renderNeoBrutalistRecipeCard` con sombras duras (+4px), bento con gutters de 14px, stickers lima/naranja y código de barras POS.
  - Estilo 3: `renderAuroraRecipeCard` con fondo obsidiana, resplandores radiales, baldosas frosted glass y cápsula de cata.
  - Estilo 4: `renderHangtagRecipeCard` con ojal metálico realista, cartulina marfil, tipografía editorial con serifa y cita botánica.
- [ ] **Paso 3: Implementar renderizado de carta de inventario/congelador (`generateCoffeeMenuCardImage`)**
  - Adaptar la vista de carta de múltiples lotes (hasta 10 cafés) a cada uno de los 4 nuevos estilos visuales.

---

### Task 3: Actualizar Modales en la Interfaz React

**Archivos:**
- Modificar: `frontend/src/components/BatchDetail.jsx`
- Modificar: `frontend/src/components/Inventory.jsx`
- Modificar: `frontend/src/components/BrewHistory.jsx`

- [ ] **Paso 1: Actualizar botones y defaults en `BatchDetail.jsx`**
  - Reemplazar selector con:
    `[ { id: 'blueprint', label: '📐 Blueprint' }, { id: 'neobrutalist', label: '⚡ Neo-Pop' }, { id: 'aurora', label: '🔮 Aurora' }, { id: 'hangtag', label: '🏷️ Hangtag' } ]`
- [ ] **Paso 2: Actualizar botones y defaults en `Inventory.jsx`**
  - Reemplazar selector de la carta con los mismos 4 estilos.
- [ ] **Paso 3: Actualizar botones y defaults en `BrewHistory.jsx`**
  - Reemplazar selector de historial con los mismos 4 estilos.

---

### Task 4: Compilación, Pruebas y Despliegue en VPS

**Archivos:**
- Todos los modificados.

- [ ] **Paso 1: Compilar frontend localmente con `npm run build`**
  - Verificar que no existan errores de sintaxis, imports faltantes o advertencias de Vite.
- [ ] **Paso 2: Git commit y push a `origin main`**
- [ ] **Paso 3: Desplegar en VPS con script de Zerker**
  - `git pull origin main && npm run build-frontend && pm2 restart beantag`.
- [ ] **Paso 4: Verificar endpoint de producción**
  - `curl -k -I https://5.189.152.68.nip.io/beantag/` retornando 200 OK.
