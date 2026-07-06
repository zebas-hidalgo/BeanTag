# Especificación de Diseño: Tarjeta de Compartición de Receta (Opción B)

Este documento detalla el diseño final aprobado para la tarjeta visual generada en el portapapeles y descargas para compartir recetas de preparación de café.

## 🎨 Parámetros Visuales

* **Formato**: Tarjeta horizontal compacta (proporción 4:3, dimensiones de renderizado 840x540px en Canvas).
* **Fondo**: Textura de papel arrugado (`paper_texture.jpg`) con un filtro de opacidad blanco del 55% (`rgba(255, 255, 255, 0.55)`) para garantizar una legibilidad impecable manteniendo las fibras y arrugas del papel.
* **Tipografías**:
  * **Títulos**: `Fredoka` (redondeada, estilo cafetería orgánica).
  * **Textos de Datos**: `Outfit` (moderna, geométrica y de alta legibilidad).
  * **Subtítulos/Secciones**: `JetBrains Mono` (para los tags de sección).
* **Color de Texto**: Negro puro (`#000000`) para máximo contraste.
* **Color de Acento**: Naranja vibrante (`#F94C00`).

---

## 📐 Distribución de Elementos (Layout)

### 1. Encabezado (Header)
* **Izquierda**: Logo de marca **BeanTag** (sin emoji de taza de café) precedido por una línea vertical naranja de acento (`width: 6px`, color `#F94C00` con borde negro). Subtítulo inferior: `BITÁCORA DE PREPARACIÓN NFC`.
* **Derecha**: Número de Orden y Fecha de Extracción en tipografía monoespaciada negra.

### 2. Contenido (Cuerpo en 2 Columnas)
* **Columna Izquierda (Detalle del Café)**:
  * Etiqueta superior: `[ GRANO SELECCIONADO ]` en JetBrains Mono.
  * Título destacado: Nombre del Lote (ej. *Geisha Volcán Azul*) en Fredoka Bold.
  * Lista de datos (Outfit):
    * `Origen: [País]`
    * `Tostador: [Nombre del Tostador]`
    * `Variedad: [Variedad del Grano]`
    * `Proceso: [Método de Proceso]`
    * `Tueste: [Nivel de Tueste (Fecha)]`
* **Columna Derecha (Detalle de Extracción)**:
  * Etiqueta superior: `[ EXTRACCIÓN ]` en JetBrains Mono.
  * Título de método: Método (ej. *V60 (Filtrado)*) en Fredoka Bold.
  * Lista de datos (Outfit):
    * `Molienda J-Max: [R.N.C (Micrones)]`
    * `Ratio: [1:X (Agua Objetivo)]`
    * `Tiempo: [M:SS min]`
    * `Taza: [Balance | Cuerpo]`
    * `Resultado: [Badge "EN PUNTO" / "SUB" / "SOBRE"]` (Fondo naranja `#F94C00`, texto blanco).

### 3. Pie de Tarjeta (Footer)
* **Izquierda**: Comentarios y notas de taza escritos en cursiva.
* **Derecha**: Firma de la plataforma `BEANTAG.CAFE`.

---

## 🧪 Plan de Verificación

* **Visualización en Navegador**: Generar una vista previa interactiva en el modal de compartir de `BrewHistory.jsx`.
* **Copiado al Portapapeles**: Confirmar que la imagen generada en el canvas se copia al portapapeles y se descarga como archivo PNG manteniendo la textura de papel y el diseño de 2 columnas.
* **Sin Puntuación**: Verificar que no aparezca ninguna estrella o calificación numérica de puntuación en el diseño final de la tarjeta de compartir.
