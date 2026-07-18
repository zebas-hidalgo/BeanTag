# Especificación de Diseño: BeanTag Monochrome & Funciones Avanzadas

Especificación de la identidad visual de Minimalist Monochrome y las mejoras funcionales avanzadas de BeanTag (Fecha de Tueste, Origen, Nivel de Tueste, Fecha de Congelación, Calculadora de Ratio y Filtros).

---

## 1. Identidad Visual: Minimalist Monochrome (Suizo)

BeanTag adoptará una estética utilitaria minimalista inspirada en la tipografía suiza y Bauhaus:
*   **Fondo:** Blanco Puro (`#FFFFFF`) con texto en Negro Puro (`#000000`).
*   **Contornos:** Todos los componentes, tarjetas e inputs tendrán un borde negro de `2px solid #000000` con esquinas rectas (`border-radius: 0px` para inputs) o esquinas ligeramente redondeadas (`12px` para tarjetas del congelador). Sin relieves ni sombras difusas.
*   **Contraste:** Texto blanco sobre fondo negro para botones primarios e invertidos, y texto negro sobre blanco para elementos generales.

### Iconografía Vectorial (Outline 2px)
*   **Sin Emojis:** Todos los emojis estructurales son reemplazados por iconos SVG con trazos constantes de `2px` y color negro.
*   **Congelador Tab:** Icono de archivador o caja de tubos.
*   **Bitácora Tab:** Icono de cuaderno/libro de recetas.
*   **Scanner:** Acción en la cabecera del congelador con icono de dispositivo móvil de escaneo.

---

## 2. Auditoría UX y Seguridad de Contención

Para garantizar que ningún elemento flote suelto o desborde el marco del teléfono (especialmente en pantallas anchas o de tabletas donde la app se renderiza centrada a `480px`):

### A. Contención Absoluta de Componentes Fijos
*   **Tabbar Inferior (`.nb-tabbar`):** Cambiará de `position: fixed` a `position: absolute; bottom: 0; left: 0; width: 100%;`. Esto fuerza a la barra a mantenerse rígida dentro de los límites físicos del `.app-container` (columna de `480px`), eliminando cualquier desfase horizontal.
*   **Toast de Deshacer (`.undo-toast`):** Cambiará a `position: absolute; bottom: 80px; left: 16px; width: calc(100% - 32px);`. Se deslizará de manera limpia dentro de la columna central de la aplicación, sin desbordarse al viewport del navegador.

### B. Molienda J-Max Fluida (Evitar Desbordamiento en Pantallas Chicas)
*   Para evitar que tres selectores numéricos en línea desborden en teléfonos de baja resolución (como iPhone SE con `320px` de ancho de pantalla), los steppers se configuran con flexbox fluido:
    *   `.mono-stepper { display: flex; width: 100%; }`
    *   `.stepper-btn { flex: 1; min-width: 24px; }`
    *   Los botones y valores se encogerán proporcionalmente de forma dinámica, asegurando que siempre queden contenidos dentro de la tarjeta de extracción sin sangrar hacia los lados.

---


## 2. Cambios en Base de Datos (SQLite)

Se alterará la tabla `batches` para soportar las nuevas variables de información física del grano de café:
*   `origin` TEXT (País/Origen del grano).
*   `roast_level` TEXT (Nivel de tueste: `Claro`, `Medio`, `Oscuro`).
*   `roast_date` TEXT (Fecha de tueste, formato ISO `YYYY-MM-DD`).
*   `freeze_date` TEXT (Fecha de congelación, formato ISO `YYYY-MM-DD`).

---

## 3. Mejoras Funcionales Implementadas

### A. Buscador y Filtros del Congelador
En la parte superior de la pantalla principal (Inventario), debajo de la cabecera, se integrará una barra de búsqueda y filtros rápidos:
*   **Buscador:** Caja de texto con borde negro para buscar por nombre o productor.
*   **Filtros de Tueste:** Tres pequeños botones con el nivel de tueste (Claro / Medio / Oscuro) para filtrar la lista instantáneamente.

### B. Fórmula de Frescura (Resting & Freezer Duration)
En la tarjeta de detalles y en la tarjeta del inventario se mostrará el cálculo de días:
*   **Reposo antes de congelar:** `Fecha de Congelación - Fecha de Tueste` (ej. *14 días de reposo*).
*   **Tiempo en Congelador:** `Fecha Actual - Fecha de Congelación` (ej. *Congelado hace 3 semanas*).

### C. Calculadora Dinámica de Ratio en Bitácora
En el formulario de receta de extracción del detalle del lote:
*   El usuario ingresa la Dosis (ej. `20g`) y el Ratio (ej. `1:15.0`) mediante steppers numéricos de `0.5` en `0.5`.
*   La app calcula en vivo y muestra de manera destacada los gramos de agua objetivo: `Dosis * Ratio` (ej. *Agua Objetivo: 300g*).

### D. Alertas de Stock Bajo
*   Si `remaining_doses <= 2`, el fondo del badge o el borde de la tarjeta del café cambiará a un diseño destacado (ej. borde punteado negro o tag de "ÚLTIMOS TUBOS") para alertar stock crítico.

---

## 4. Plan de Verificación

*   Verificar que la base de datos corre las consultas `ALTER TABLE` seguras en el archivo de inicio.
*   Comprobar que el cálculo de fechas de reposo maneja correctamente valores nulos (si el usuario no ingresa alguna fecha).
*   Compilar y desplegar localmente para probar el flujo completo antes de subirlo al VPS.
