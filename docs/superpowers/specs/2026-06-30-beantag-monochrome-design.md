# Especificación de Diseño: BeanTag Minimalist Monochrome & Roast Date

Especificación de la identidad visual de Minimalist Monochrome en español e integración del campo Fecha de Tueste para BeanTag.

---

## 1. Dirección Estética: Minimalist Monochrome (Suizo Moderno)

Inspirado en el diseño suizo clásico y Bauhaus. Utiliza contrastes puros en blanco y negro, retículas ortogonales rígidas, tipografía sans-serif fuerte (Inter) y bordes de contorno rectos y limpios sin sombras.

### Colores de Diseño (Monocromo):
*   **Fondo General:** Blanco Puro (`#FFFFFF`).
*   **Contenedor / Tarjetas:** Fondo Blanco (`#FFFFFF`) con bordes negros gruesos (`2px solid #000000`). Sin sombras difusas ni relieves 3D.
*   **Texto Principal:** Negro Puro (`#000000`) en fuente Inter.
*   **Texto Secundario (Muted):** Gris Carbón (`#4A5568`).
*   **Acciones Principales (Invertidas):** Botones en fondo negro (`#000000`) con texto en blanco (`#FFFFFF`).
*   **Esquinas:** Esquinas ligeramente redondeadas en tarjetas (`12px`) y rectas en inputs para mantener consistencia física.

---

## 2. Iconografía: Vectorial y Monocroma

De acuerdo con las guías de calidad, **se prohíbe el uso de emojis** para controles o navegación. Se integrarán iconos SVG limpios de un solo trazo:
*   **Estilo:** Solo contorno (Outline), sin rellenos.
*   **Grosor del Trazo (Stroke-width):** Rígido en `2px` para mantener equilibrio óptimo con el borde negro del contenedor.
*   **Color:** Negro puro (`currentColor` / `#000000`).

Iconos a usar:
- **Congelador (Tab):** Icono de cubeta o tubo de ensayo en SVG.
- **Escaneo (Tab):** Icono de teléfono/escáner minimalista.
- **Bitácora (Tab):** Icono de taza o cuaderno en SVG.
- **Volver (Acción):** Flecha izquierda lineal.
- **Dosis (Badge):** Icono de dosis minimalista.

---

## 3. Integración de la Fecha de Tueste (Roast Date)

### A. Base de Datos (SQLite)
Se añade una columna de fecha en formato texto para soportar la fecha de tueste:
*   Tabla: `batches`
*   Columna: `roast_date TEXT` (Formato ISO `YYYY-MM-DD` para ordenamiento seguro).

### B. Formularios e Interfaces
*   **Creador de Café (`BatchCreator.jsx`):** Se añade un campo `<input type="date">` bajo la etiqueta **Fecha de Tueste**. El valor es opcional pero recomendado.
*   **Detalle del Café (`BatchDetail.jsx`):** Se visualiza en la rejilla de campos como "Tostado el" formateado en español (ej. *12 jun. 2026* o *Sin fecha* si es nulo).
*   **Historial de Bitácoras (`BrewHistory.jsx`):** Se muestra la fecha de tueste junto con los detalles del lote si está disponible.

---

## 4. Plan de Verificación

*   Verificar que la migración de SQLite se ejecuta al iniciar el servidor Express.
*   Confirmar que el formulario guarda la fecha de tueste correctamente y se recupera en la API `/api/batches/:id`.
*   Asegurar que la navegación flotante se reemplaza por el menú plano de bordes negros y la interfaz móvil se visualiza correctamente sin desbordamientos.
