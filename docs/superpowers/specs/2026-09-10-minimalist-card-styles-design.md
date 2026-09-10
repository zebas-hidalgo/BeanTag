# Especificación de Diseño: 3 Estilos de Tarjetas Minimalistas & Selector de Vista

**Fecha**: 2026-09-10  
**Estado**: Aprobado por el usuario  
**Módulo**: `frontend/src/components/Inventory.jsx` y `frontend/src/index.css`

---

## 1. Contexto y Objetivos

### El Problema
Las tarjetas actuales del inventario presentaban un comportamiento visual incómodo ("efecto raro") originado por:
- Animaciones CSS con `transform: scale(0.985)` y `translateY(-2px)` que disparaban rebotes al deslizar la pantalla con el dedo en dispositivos móviles.
- Sombras excesivas y cajas anidadas (tarjeta dentro de tarjeta, barra de progreso con gradiente espeso, botones gigantescos dentro de la tarjeta) que saturaban la pantalla.

### El Objetivo
Ofrecer una experiencia **minimalista, limpia y *aesthetic***, permitiendo al usuario elegir entre **3 estilos visuales independientes** según su preferencia de navegación mediante un selector interactivo en el inventario:
1. **Editorial (Nordic Atelier)**: Estilo revista / bolsa de café nórdica de especialidad, espacioso y orgánico.
2. **Lista (Cupertino / Linear)**: Filas horizontales compactas ultra eficientes inspiradas en *Linear* y *Things 3*.
3. **Archivo (Tokyo Coffee Lab)**: Ficha técnica numerada estilo laboratorio barista japonés (*Kurasu / Glitch Coffee*).

---

## 2. Selector de Vistas de Inventario

### Ubicación y Comportamiento
- Ubicado en la parte superior del inventario, justo debajo de la barra de búsqueda / selector de estado.
- Implementado como un control segmentado minimalista con feedback háptico (`navigator.vibrate(8)`):
  - `[ 🏷️ Editorial ]`
  - `[ 📋 Lista ]`
  - `[ 📐 Archivo ]`
- **Persistencia**: La selección se guarda automáticamente en `localStorage.getItem('beantag-inventory-style')` (por defecto: `'editorial'`).

---

## 3. Especificaciones de los 3 Estilos

### Principio Común de Interacción
- **Eliminación total del efecto elástico**: Sin `transform: scale(...)` ni `translateY(...)` en `:hover` o `:active`.
- **Feedback táctil nativo**: Al tocar para abrir un café, se aplica un resalte de fondo sutil (`background-color: var(--card-active-bg)` o ligera opacidad) sin movimiento físico, garantizando un scroll 100% fluido y natural.

---

### Estilo 1: 🏷️ Editorial (Nordic Atelier)
* **Filosofía**: Minimalismo orgánico, tipografía aireada, estética de cafetería de especialidad en Copenhague.
* **Layout**:
  - Tarjeta plana (*flat*) con borde ultrafino (*hairline* `1px solid var(--border-color)`), esquinas con radio suave (16px), sin sombras 3D flotantes.
  - **Encabezado**: Nombre del café como protagonista en tipografía cuidada (`font-size: 17px; font-weight: 700`), acompañado a la derecha por el menú de acciones rápidas `•••`.
  - **Metadatos**: Finca, productor, variedad y altura en una línea sutil:
    `Finca El Paraíso • Geisha • 1.950m`
  - **Notas de Cata**: Chips tipo píldora mate en colores desaturados y armónicos (sin bordes negros gruesos ni emojis agresivos).
  - **Stock**: Píldora sutil en la esquina inferior: `8 de 8 tubos` (o `160g restantes`), eliminando la barra de progreso gruesa.

---

### Estilo 2: 📋 Lista (Cupertino / Linear)
* **Filosofía**: Eficiencia y densidad de información. Permite visualizar entre 6 y 8 cafés en pantalla simultáneamente sin desplazamientos largos.
* **Layout**:
  - Filas horizontales compactas (`min-height: 52px`) con separadores finos entre elementos.
  - **Zona Izquierda**:
    - Nombre del café en negrita compacta (`font-size: 13.5px; font-weight: 700`).
    - Subtexto en gris neutro: `Tostador • Proceso • Origen`.
  - **Zona Derecha**:
    - Indicador numérico sobrio: píldora monocromática con el número de tubos restantes (`8 tubos`).
    - Chevron fino `›` (`ChevronRight`) y botón discreto `•••`.

---

### Estilo 3: 📐 Archivo (Tokyo Coffee Lab)
* **Filosofía**: Precisión técnica milimétrica, estilo catálogo de laboratorio y etiqueta de especialidad suiza/japonesa.
* **Layout**:
  - Estructura geométrica clara con acento monocromático o terracota artesanal (`#BC5449`).
  - **Badge de Archivo**: Número de lote secuencial en tipografía monoespaciada en el borde superior izquierdo:
    `#01 • CO-2026` o `#02 • LOT-GEISHA`
  - **Matriz Técnica**: Cuadrícula de 2x2 o 4 columnas con etiquetas técnicas en mayúsculas pequeñas:
    - `ORIGEN: COLOMBIA`
    - `PROCESO: HONEY`
    - `ALTITUD: 1.950 M`
    - `REPOSO: 14 DÍAS`
  - **Medidor de Tubos Técnico**: Segmentación visual técnica (ej. `[ ▪▪▪▪▪▪▪▪ ] 8/8`).

---

## 4. Adaptabilidad y Compatibilidad
- **Modo Oscuro / Temas**: Los 3 estilos respetan las variables CSS activas (`--bg-card`, `--bg-canvas`, `--color-text`, `--color-crimson`, `--border-color`), luciendo impecables tanto en modo claro como en True OLED Pure Dark Mode (`#000000`).
- **Menú Contextual (Haptic Touch / Pulsación Larga)**: Compatible en los 3 estilos para acceder a preparar café, restar 1 tubo o compartir ticket.
