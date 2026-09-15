# Especificación de Diseño: Rediseño Editorial Atelier Nórdico (Tickets, Carta de Cafés e Inventario)

**Fecha:** 2026-09-15  
**Autor:** Antigravity & zebas  
**Estado:** Aprobado por el usuario  

---

## 1. Visión General y Objetivos
Elevar el diseño visual de toda la suite de tarjetas compartibles de BeanTag hacia el estándar **Editorial Atelier Nórdico** (inspirado en tostadurías de culto mundial como Sey Coffee Brooklyn y Tim Wendelboe Oslo):
1. **Limpieza de Inventario**: Eliminar el selector de estilos visuales de la vista de inventario y estandarizar de forma permanente la vista **Editorial Nórdica**, eliminando controles innecesarios.
2. **Rediseño Integral de Todos los Tickets**: Erradicar el aspecto recargado o tosco en todas las tarjetas individuales (tanto *Con Receta* como *Solo Grano*) implementando paleta lino/marfil cálido, tipografía serif contemporánea con kerning generoso, líneas hairline ultrafinas (0.75px) y espaciado negativo (*whitespace*) armónico.
3. **Carta de Cafés de Cava Enriquecida**: Ampliar sustancialmente la información por café al compartir la carta de bodega (imagen Canvas y portapapeles de texto), incorporando de forma legible: nombre completo sin truncamiento tosco, tostador, finca, variedad, proceso, altitud, puntuación SCA y pills con notas sensoriales completas.

---

## 2. Requerimientos Detallados

### 2.1 Inventario (`frontend/src/components/Inventory.jsx`)
- **Remover Selector**: Eliminar la barra de botones `inventory-view-selector` (`[🏷️ Editorial] [📋 Lista] [📐 Archivo]`) y cualquier referencia a cambios de estilo en el inventario.
- **Fijar Modo Editorial**: El inventario renderizará de forma fija la vista Editorial enriquecida (que incluye finca, notas aromáticas, fecha de tueste y contador de tubos/dosis).
- **Consistencia Visual**: Preservar el contador total de lotes (`Lotes en bodega / Agotados`) con tipografía limpia y minimalista.

### 2.2 Rediseño de Tarjetas Individuales (`frontend/src/utils/cardGenerator.js`)
Transformar el motor de dibujo Canvas 2D en las variantes del estilo Editorial Atelier:
- **Lienzo y Proporción**: Vertical 4:5 (840 × 1050 px renderizado en alta resolución a 1680 × 2100 px con DPR 2x).
- **Fondo & Textura**: Marfil cálido/algodón nórdico (`#FAF8F5` / `#F5F2EB`), bordes exteriores finos en tono café tostado tenue (`#E8E3D8`).
- **Tipografía**:
  - Títulos principales y nombre del lote: Serif editorial (`"Playfair Display", "Cinzel", "Georgia", serif`), tamaño 26–30px, con espaciado equilibrado.
  - Subtítulos, origen y terroir: Sans-serif suizo geométrico de alta legibilidad (`-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI"`).
  - Parámetros técnicos y números: Monospace tabular legible (`"JetBrains Mono", monospace`).
- **Notas de Cata Sensoriales**:
  - Extraídas dinámicamente (`extractFlavorTags`).
  - Renderizadas en pills elegantes con fondo traslúcido suave (`rgba(120, 53, 15, 0.06)`), borde sutil de 1px y tipografía nítida en café oscuro (`#78350F`).
- **Grilla de Extracción (Con Receta)**:
  - 4 métricas esenciales (Método, Dosis, Ratio, Tiempo) en una fila horizontal balanceada con iconos centrados 1:1 y etiquetas claras (sin cajitas pesadas).
- **Ficha Terroir (Solo Grano)**:
  - Finca, Variedad, Proceso, Altitud y Productor organizados en un bloque editorial sereno con líneas divisorias micro (0.75px).
- **Integración de Sello/Héroe**:
  - Grabado botánico / sello de lacre integrado sin artefactos, sirviendo como sello de procedencia artesanal.

### 2.3 Carta de Cafés de Bodega (`generateCoffeeMenuCardImage` & `generateCoffeeMenuText`)
- **Canvas Image (`generateCoffeeMenuCardImage`)**:
  - Lienzo vertical 4:5 con cabecera de Cava / Menú de Especialidad.
  - Cada lote en bodega se dibuja como un bloque estructurado que contiene:
    1. Índice (`01.`, `02.`) + Nombre completo del café en tipografía destacada (ajuste de tamaño o salto de línea dinámico para evitar truncamientos innecesarios).
    2. Tostador en acento distintivo + Región/Finca y Altitud (`1950m`).
    3. Variedad (`Geisha`, etc.) + Proceso de fermentación + SCA score (si aplica).
    4. Pills de notas de cata con emojis sutiles (hasta 4 descriptores).
    5. Badge de stock de dosis en cava (`12 tubos (~240g)`).
- **Texto para Portapapeles (`generateCoffeeMenuText`)**:
  - Corrección del selector de notas: `b.flavor_notes || b.roaster_notes || b.notes || ""`.
  - Formateo markdown enriquecido para WhatsApp/Telegram con información completa por café (nombre, tostador, origen, variedad, proceso, notas sensoriales y stock disponible).

---

## 3. Plan de Verificación y Criterios de Éxito
1. **Verificación de Inventario**: Confirmar que no hay selector de estilo visual y que la vista editorial se carga perfectamente.
2. **Verificación Automatizada (`verify_cards_render.mjs`)**:
   - Actualizar y ejecutar la suite para comprobar que todos los renders de tarjetas (Con Receta, Solo Grano y Carta de Cafés) se ejecutan con 0 errores y producen imágenes de alta resolución.
3. **Compilación y Despliegue**:
   - `npm run build` en `frontend` con 0 errores.
   - Sincronización en GitHub y despliegue en VPS `5.189.152.68`.
   - Comprobación HTTP 200 en vivo.
