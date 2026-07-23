# Spec - Tarjetas de Compartir Multidiseno (Variantes 1, 2 y 4)

## Objetivo
Implementar un selector de plantillas visuales en el modal de compartir de **BeanTag**, permitiendo al usuario generar y descargar tarjetas de extracción en 3 estilos diferentes:
1. **Retro-Candy Neobrutalista** (Horizontal 840x540px, colores contrastantes, bordes gruesos, insignia Certified).
2. **Ticket de Barista / Editorial** (Horizontal 840x540px, textura kraft/papel, tipografia monoespaciada `JetBrains Mono`, diseno limpio escandinavo).
3. **Instagram Story Vertical (9:16)** (Vertical 600x1066px, optimizado para Historias de Instagram / WhatsApp sin recortes).

---

## Arquitectura y Componentes

### 1. `BrewHistory.jsx` (y modal de detalle)
- **Estado Nuevo:** `const [shareTemplate, setShareTemplate] = useState('retro');` // `'retro'` | `'receipt'` | `'story'`
- **Selector de Plantilla en Modal UI:** Pestañas de seleccion rápida (`🍬 Retro Candy`, `🧾 Ticket Barista`, `📱 Story 9:16`).
- **Renderizado Dinámico de Canvas:**
  - `exportRecipeAsImage(recipe, templateName)`:
    - Ajusta las dimensiones del canvas (`840x540` para Horizontal, `600x1066` para Vertical 9:16).
    - Aplica la paleta de colores, tipografías y maquetación de la plantilla seleccionada.
    - Genera la vista previa interactiva en el modal y la prepara para `navigator.share` o descarga directa PNG.

---

## Detalle de las Plantillas Visuales

### Plantilla 1: Retro-Candy Neobrutalista (`'retro'`)
- **Dimensiones:** `840 × 540 px`
- **Paleta:** Colores del tema activo + acento carmesí (`#F94C00`), bordes negros de `4px` y sombras offset `4px`.
- **Elementos:** 
  - Encabezado con logo `BeanTag`, ID de registro `#0xxx` y fecha.
  - Columna Grano: Origen, Productor, Variedad, Proceso, Tostador.
  - Columna Extracción: Método, Dosis, Molienda (con micras $\sim\mu\text{m}$), Ratio, Temp, Tiempo.
  - Bloque inferior: Notas de cata Rueda SCA + insignia *"BEANTAG BATCH CERTIFIED"*.

### Plantilla 2: Ticket de Barista (`'receipt'`)
- **Dimensiones:** `840 × 540 px`
- **Paleta:** Tono papel neutro/kraft (`#F7F5F0`), texto gris oscuro/carbón (`#2D3748`), líneas delgadas y punteadas.
- **Tipografía:** Principalmente `JetBrains Mono` y `Space Grotesk`.
- **Elementos:** 
  - Cabecera estilo ticket de caja: `=== BEANTAG SPECIALTY COFFEE ===`.
  - Lista estructurada con guiones de alineación monoespaciada (`ORIGEN ..... COLOMBIA`).
  - Marca de agua o sello circular de calibración *"BARISTA SPEC"*.

### Plantilla 4: Instagram Story 9:16 (`'story'`)
- **Dimensiones:** `600 × 1066 px` (Proporción 9:16)
- **Paleta:** Gradiente/Fondo suave con acentos de color del tema.
- **Layout Vertical:**
  - Parte Superior: Logo `BeanTag` + Banner `STORIES`.
  - Centro Superior: Nombre del grano en grande (34px bold) + Origen/Tostador.
  - Centro: Tarjeta flotante del Método con icono vectorial, Dosis, Ratio y Molienda en micras.
  - Centro Inferior: Tarjeta de Evaluación Sensorial (Balance, Cuerpo, Extracción) + Emojis SCA.
  - Parte Inferior: Marca de agua `beantag.cafe`.

---

## Verificación y Pruebas
1. Compilar el frontend con `npm run build` sin errores.
2. Comprobar la generación de imágenes para las 3 plantillas desde la interfaz.
3. Verificar que la opción de compartir descarga/abre la vista previa en PNG para cada una de las 3 plantillas.
