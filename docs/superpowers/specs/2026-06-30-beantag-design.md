# BeanTag: Sistema de Inventario y Bitácora de Café con NFC

Especificación técnica y de diseño para la aplicación móvil-first de seguimiento de monodosis de café congeladas en tubos de centrífuga.

---

## 1. Objetivos del Proyecto

El objetivo es crear una aplicación web altamente responsiva y optimizada para dispositivos móviles (**"BeanTag"**) que simplifique la gestión de dosis de café congeladas en tubos de centrífuga utilizando etiquetas NFC.

### Flujo de Trabajo:
1. El usuario registra un lote de café (ej. 12 tubos de 20g de "Colombia Pink Bourbon") ingresando sus 7 campos técnicos.
2. El sistema guarda el lote en SQLite y genera una URL única de lote (ej. `https://tu-vps.com/batch/diviso-pb`).
3. El usuario escribe esta URL en las 12 etiquetas NFC usando su celular (con la app *NFC Tools*).
4. Al acercar el celular a cualquier tubo del lote, **el chip NFC abre automáticamente el navegador web** en la ficha del lote de BeanTag.
5. El usuario realiza una pulsación larga (Hold) en el botón **"Restar Dosis"** para descontar el tubo del congelador y, opcionalmente, rellena la receta de extracción.

---

## 2. Especificación del Stack Tecnológico

*   **Frontend:** React (Vite) para una interfaz ágil, reactiva y modular.
*   **Diseño Visual:** CSS Puro (Vanilla CSS) siguiendo la estética **Candy Claymorphism (3D Arcilla Vibrante)**:
    *   Formas redondeadas orgánicas (`border-radius: 24px`).
    *   Bordes y contornos gruesos en color azul marino oscuro (`#1A365D`) de `3px`.
    *   Sombras 3D sólidas en la base (`box-shadow: 0px 6px 0px #1A365D`).
    *   Feedback táctil interactivo (las tarjetas y botones se hunden físicamente al presionarlos desplazándose en el eje Y `translateY(6px)` y anulando la sombra de base).
    *   Tipografía: `Comfortaa` para títulos redondeados amigables y `Inter` para texto de lectura técnica.
*   **Backend:** Node.js + Express.js para proveer una API REST sencilla que sirva el frontend y maneje los datos.
*   **Base de Datos:** SQLite (un único archivo local en el VPS, muy liviano y de fácil respaldo).
*   **Despliegue:** Autohospedado en el VPS del usuario.

---

## 3. Modelo de Datos (SQLite)

### Tabla: `batches` (Lotes de Café)
| Campo | Tipo | Restricción | Descripción |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | Identificador único/slug (ej. `diviso-pb`) |
| `name` | TEXT | NOT NULL | Nombre del café |
| `producer` | TEXT | NOT NULL | Productor / Finca |
| `altitude` | TEXT | | Altitud (ej. "1800 msnm") |
| `variety` | TEXT | | Varietal (ej. "Pink Bourbon") |
| `process` | TEXT | | Proceso (ej. "Anaeróbico Natural") |
| `roaster` | TEXT | | Tostador (ej. "Coffee Circular") |
| `roaster_notes` | TEXT | | Notas de cata oficiales del tostador |
| `dose_weight` | TEXT | | Gramos por dosis (ej. "20.0g") |
| `total_doses` | INTEGER | NOT NULL | Cantidad de dosis iniciales registradas |
| `remaining_doses` | INTEGER | NOT NULL | Cantidad de dosis actuales en el congelador |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Fecha de creación del lote |

### Tabla: `recipes` (Bitácora de Extracciones)
| Campo | Tipo | Restricción | Descripción |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | ID único |
| `batch_id` | TEXT | FOREIGN KEY REFERENCES `batches(id)` | Lote al que pertenece la receta |
| `method` | TEXT | NOT NULL | Método (ej. "V60", "Espresso", "AeroPress") |
| `ratio` | TEXT | | Ratio o rendimiento (ej. "1:15", "300g") |
| `grind` | TEXT | | Parámetros de molienda (ej. "22 clicks Comandante") |
| `temperature` | TEXT | | Temperatura del agua en °C |
| `brew_time` | TEXT | | Tiempo de extracción (ej. "2:45 min") |
| `rating` | INTEGER | CHECK(rating BETWEEN 1 AND 5) | Calificación (1 a 5 estrellas) |
| `notes` | TEXT | | Notas personales de cata de la taza preparada |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Fecha de registro |

---

## 4. Diseño de Pantallas e Identidad Visual

### 🎨 Paleta de Colores (Neón Cósmico)
*   **Fondo General:** Lavanda Bruma Pálido (`#F3E8FF`)
*   **Contornos y Texto Principal:** Negro Obsidiana (`#0F081D`)
*   **Tarjetas de Lote:** Blanco con fondos alternados en tonos neón pastel:
    *   Rosa Caramelo: `#FBCFE8`
    *   Durazno Neón: `#FED7AA`
    *   Cian Eléctrico: `#CCFBF1`
    *   Lavanda Claro: `#E9D5FF`
*   **Botón Principal de Acción:** Violeta Eléctrico (`#8B5CF6`) con barra de progreso en Cian Eléctrico (`#06B6D4`).
*   **Elementos Auxiliares:** Rosa brillante (`#EC4899`) y Cian neón (`#06B6D4`).

### 🏷️ Identidad de Marca e Iconos (3D Candy Claymorphism)

#### Logo Oficial: El Tubo Tecnológico (Opción B)
Representa un tubo de centrífuga de café de especialidad con un chip/grano emitiendo ondas NFC. Se renderizará en el header mediante el siguiente SVG vectorial:

```html
<svg viewBox="0 0 100 100" style="width: 30px; height: 30px;" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="35" y="10" width="30" height="12" rx="4" fill="#1D4ED8" stroke="#1A365D" stroke-width="5" />
  <path d="M40 22V72C40 80.28 44.48 87 50 87C55.52 87 60 80.28 60 72V22" fill="#93C5FD" stroke="#1A365D" stroke-width="5" />
  <ellipse cx="50" cy="55" rx="7" ry="11" transform="rotate(-15 50 55)" fill="#B45309" stroke="#1A365D" stroke-width="4" />
  <path d="M48.5 45C50 49 50 59 51.5 63" stroke="#1A365D" stroke-width="2.5" stroke-linecap="round" />
  <path d="M43 38a10 10 0 0 1 14 0" stroke="#1A365D" stroke-width="3" stroke-linecap="round" />
  <path d="M37 31a18 18 0 0 1 26 0" stroke="#1A365D" stroke-width="3" stroke-linecap="round" />
</svg>
```

#### Iconografía del Sistema
Se utilizarán los iconos vectoriales recreados en este estilo:
1.  **Tubo de Centrífuga (Inventario/Dosis):** Representa las dosis congeladas. Tubo con tapa azul e indicador de stock.
2.  **Taza de Café (Bitácora/Cata):** Taza redondeada amarilla con espuma latte art 3D para calificar tazas.
3.  **Onda de Escaneo NFC (Interacción):** Teléfono móvil 3D verde neón emitiendo ondas de radio.
4.  **V60 Dripper (Métodos/Extracción):** Extractor cónico estriado en naranja y jarra de cristal 3D para el recetario.

---

## 5. Micro-Interacciones y Experiencia Táctil (Fluidez)

1.  **Mantener para Restar (Hold-to-Confirm):**
    Para evitar que el usuario descuente dosis por toques accidentales, el botón **"Restar Dosis"** requiere mantenerse presionado por `800ms`. Durante este lapso, una barra verde (`#00E676`) avanza fluidamente de izquierda a derecha. Si se suelta antes de tiempo, regresa a cero.
2.  **Animación Elástica de Contador (Bounce-Pop):**
    Al descontar una dosis, el número del contador se encoge y luego rebota con un escalado de `1.3x` y una ligera rotación antes de regresar a su tamaño original, dando un feedback visual muy orgánico.
3.  **Haptic Feedback (Vibración del Celular):**
    En navegadores móviles compatibles, la acción de restar dosis genera una vibración de doble pulso físico (`navigator.vibrate([70, 50, 100])`) imitando el tacto de un botón de juguete.
4.  **Toast de Deshacer (Undo):**
    Al restar una dosis, aparece un banner inferior durante 6 segundos. Si el usuario se equivocó, puede tocar **"Deshacer"** y el stock se restaura inmediatamente en el cliente y el servidor.
5.  **Selector de Molienda con Stepper:**
    El campo de clicks de molienda se maneja con un control stepper 3D táctil (`+` y `-`) grande, facilitando el cambio de parámetros con una sola mano sin necesidad de abrir el teclado numérico.

---

## 6. Plan de Verificación

### Pruebas de Funcionamiento Automatizadas
*   Pruebas de endpoints de la API (Express) usando Jest o Supertest para verificar el incremento y decremento de dosis.
*   Validación de que la base de datos SQLite cree las tablas y persista la información correctamente al reiniciar el backend.

### Pruebas Manuales en Dispositivo Móvil
1.  **Prueba NFC:** Escribir un enlace de lote en una etiqueta física usando *NFC Tools*. Bloquear el celular, acercarlo a la etiqueta y verificar que el navegador web redirija instantáneamente a la ficha correspondiente en el VPS.
2.  **Prueba de una sola mano:** Utilizar el prototipo en un celular real y evaluar si todos los elementos interactivos principales (Botón Hold, Selector de molienda, Barra de navegación inferior) se alcanzan cómodamente con el pulgar.
3.  **Prueba de Deshacer (Undo):** Restar una dosis en la ficha, tocar inmediatamente el botón de deshacer y validar que el stock del lote vuelva a su estado anterior en el inventario.
