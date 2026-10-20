# Especificación de Diseño: BeanTag V4 Modular Redesign & Barista Ergonomics

> **Fecha:** 2026-10-20  
> **Estado:** Aprobado  
> **Alcance:** Frontend (`styles/`, `components/batch/`, `BrewGuideModal.jsx`, `TubeRacksView.jsx`) y Pruebas  
> **Metodologías:** Impeccable (Craft & Tokens), Ponytail (Simplicidad & Modularidad), UI/UX Pro Max (Ergonomía & A11y)

---

## 1. Motivación y Objetivos

BeanTag V3 ha alcanzado una gran madurez técnica en sus motores físicos y de IA, pero sufre de sobrecarga arquitectónica en el frontend:
- `BatchDetail.jsx` supera las 2,920 líneas de código y contiene más de 310 estilos inline.
- Los diales de molienda sincronizan 8 molinos con 11 estados individuales de React, provocando re-renderizados costosos.
- Ciertos controles táctiles no cumplen con el estándar ergonómico de 44x44px necesario para baristas con manos húmedas en barra.
- La pantalla de extracción en vivo requiere mayor legibilidad a 1 metro de distancia mientras se vierte agua con una tetera de cuello de ganso.

**Objetivo de V4:**
Transformar BeanTag en una aplicación modular, con tokens semánticos claros, componentes de menos de 300 líneas, áreas táctiles cómodas de 44px+ y un flujo de extracción en vivo ultra-legible.

---

## 2. Decisiones Arquitectónicas

### 2.1 Sistema de Tokens (`tokens.css` y `barista-ui.css`)
- **Directorio:** `frontend/src/styles/`
- **Archivos:**
  - `tokens.css`: Variables semánticas normalizadas para modo claro y modo OLED (`#000000`).
  - `barista-ui.css`: Clases utilitarias atómicas para botones, tarjetas, chips, insignias y estados de válvula de Pulsar Mini.
- **Importación:** Directa en `frontend/src/index.css`.

### 2.2 Descomposición de `BatchDetail.jsx`
Se dividirá en `frontend/src/components/batch/`:
1. `BatchHeaderCard.jsx`: Datos de finca, origen, variedad, tueste, días de desgasificación, estado de cava/congelado y deducción rápida.
2. `RecipeParamsGrid.jsx`: Selector de método (con ratio y dosis de 18g para Pulsar Mini), entrada/salida de agua y café, temperatura y recetas legendarias.
3. `GrinderSyncMatrix.jsx`: Control central de molienda en micrones físicos ($D_{50}$) con cálculo derivado $O(1)$ para los 8 molinos soportados.
4. `PourSequenceTimeline.jsx`: Lista editable de vertidos y etapas con indicadores de válvula.
5. `BatchStickyActionBar.jsx`: Barra fija al pulgar con botón primario de "Preparar Café" y accesos directos a "Guardar" y "Compartir Tarjeta".
6. `BatchDetail.jsx`: Actúa exclusivamente como orquestador liviano (~250 líneas), conectando los estados y eventos de la API.

### 2.3 Ergonomía de Extracción (`BrewGuideModal.jsx`)
- Cronómetro gigante con `clamp(3rem, 12vw, 4.8rem)` y números monoespaciados tabulares.
- Chip de válvula Pulsar Mini con colores e íconos inequívocos (🔒 Cerrada, ⚡ 50% Media, 🔓 100% Abierta).
- Botones de control con altura mínima de 48px y espaciado de 12px entre sí.

### 2.4 Cuadrícula de Portatubos (`TubeRacksView.jsx`)
- Sustitución de cálculos inline por `display: grid; grid-template-columns: repeat(auto-fit, minmax(68px, 1fr)); gap: 10px;`.
- Eliminación garantizada de cualquier desbordamiento horizontal en pantallas móviles de 360px a 430px.

---

## 3. Criterios de Aceptación y Verificación

1. Todas las suites de pruebas existentes (`test_pulsar_mini.mjs`, `test_ai_reliability.mjs`, `verify_cards_render.mjs`) deben pasar al 100%.
2. `npm --prefix frontend run build` debe compilar sin errores de sintaxis ni dependencias circulares.
3. El archivo `BatchDetail.jsx` debe reducirse de >2,900 líneas a menos de 450 líneas.
4. Despliegue en el VPS (`5.189.152.68`) completado con proceso PM2 reiniciado y base de datos SQLite intacta.
