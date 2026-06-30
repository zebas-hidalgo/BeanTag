# CryoBrew: Sistema de Inventario y Bitácora de Café con NFC

Especificación técnica y de diseño para la aplicación móvil-first de seguimiento de monodosis de café congeladas en tubos de centrífuga.

---

## 1. Objetivos del Proyecto

El objetivo es crear una aplicación web altamente responsiva y optimizada para dispositivos móviles (**"CryoBrew"**) que simplifique la gestión de dosis de café congeladas en tubos de centrífuga utilizando etiquetas NFC.

### Flujo Clave de Experiencia de Usuario:
1. El usuario registra un lote de café (ej. 12 tubos de 20g de "Colombia Pink Bourbon") e ingresa sus 7 campos técnicos.
2. El sistema genera una URL de lote única (ej. `https://tu-vps.com/batch/diviso-pb`).
3. El usuario escribe esta URL en las 12 etiquetas NFC usando su celular (con la app *NFC Tools*).
4. Cada vez que el usuario saca un tubo del congelador, **acerca su celular al tubo NFC**, lo cual abre automáticamente su navegador web en la ficha del lote.
5. El usuario realiza una pulsación larga (Hold) en el botón **"Restar Dosis"** para descontar el tubo del congelador y, opcionalmente, rellena la receta de extracción del café.

---

## 2. Especificación del Stack Tecnológico

*   **Frontend:** React (Vite) para una interfaz ágil, reactiva y modular.
*   **Diseño Visual:** CSS Puro (Vanilla CSS) siguiendo un estilo **Neo-Brutalist 3D** (trazos negros de 3-4px, sombras duras desplazadas sin difuminar, feedback táctil inmediato, botones grandes de mínimo 48px).
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

### 🎨 Tokens de Diseño (Neo-Brutalista)
*   **Fondo General:** Crema Cálido (`#FFFBEB`)
*   **Texto y Bordes:** Negro Carbón (`#0F172A`)
*   **Bordes:** Sólidos de `3px` o `4px` en elementos principales.
*   **Sombras:** Desplazamiento rígido (sin difuminar) de `5px` en X/Y (`box-shadow: 5px 5px 0px #0F172A`).
*   **Tipografía:** `Calistoga` para encabezados (estilo boutique editorial) y `Inter` para texto legible en pantallas pequeñas.
*   **Colores de Tarjetas:** Color-blocking alternado usando tonos pastel saturados: Terracota (`#FBEFEA`), Verde (`#EEFBF2`), Naranja (`#FFF3EB`), Amarillo (`#FFFDE6`).

### 🏷️ Iconos Unificados (SVGs personalizados de CryoBrew)
Para mantener consistencia, se utilizarán exclusivamente los cuatro iconos vectoriales en Neo-Brutalismo:
1.  **Tubo de Centrífuga (Gestión de Inventario/Dosis):** Estructura angular con marcas de graduación.
2.  **Taza de Café (Bitácora/Cata):** Silueta sólida con vapor ascendente.
3.  **Onda de Escaneo NFC (Interacción Física):** Celular esquemático emitiendo ondas concéntricas.
4.  **V60 Dripper (Métodos/Extracción):** Embudo cónico estriado sobre jarra.

---

## 5. Micro-Interacciones y Experiencia Táctil (Fluidez)

1.  **Mantener para Restar (Hold-to-Confirm):**
    Para evitar que el usuario descuente dosis por toques accidentales al sacar el tubo, el botón principal **"Restar Dosis"** requiere mantenerse presionado por `800ms`. Visualmente, una barra de carga verde (`--color-accent`) se llenará de izquierda a derecha. Si se suelta antes de tiempo, regresa a cero.
2.  **Animación Elástica de Contador (Bounce-Pop):**
    Al descontar exitosamente una dosis, el número del contador se encoge y luego rebota con un escalado de `1.3x` y una ligera rotación antes de regresar a su estado original, reforzando la confirmación visual de la acción.
3.  **Haptic Feedback (Vibración del Celular):**
    En navegadores móviles compatibles, la acción de restar dosis genera una vibración de doble pulso físico (`navigator.vibrate([70, 50, 100])`) imitando el tacto de un interruptor mecánico.
4.  **Toast de Deshacer (Undo):**
    Al restar una dosis, aparece un banner inferior durante 6 segundos. Si el usuario se equivocó, puede tocar **"Deshacer"** y el stock se restaura inmediatamente de forma elástica en el cliente y el servidor.
5.  **Fichas Compactas de 2 Columnas:**
    Los 7 campos técnicos se acomodan en una cuadrícula compacta de 2 columnas. Esto asegura que en la pantalla de un celular mediano, el botón de acción y el formulario de la receta queden visibles sin obligar al usuario a hacer scroll infinito.

---

## 6. Plan de Verificación

### Pruebas de Funcionamiento Automatizadas
*   Pruebas de endpoints de la API (Express) usando Jest o Supertest para verificar el incremento y decremento de dosis.
*   Validación de que la base de datos SQLite cree las tablas y persista la información correctamente al reiniciar el backend.

### Pruebas Manuales en Dispositivo Móvil
1.  **Prueba NFC:** Escribir un enlace de lote en una etiqueta física usando *NFC Tools*. Bloquear el celular, acercarlo a la etiqueta y verificar que el navegador web redirija instantáneamente a la ficha correspondiente en el VPS.
2.  **Prueba de una sola mano:** Utilizar el prototipo en un celular real y evaluar si todos los elementos interactivos principales (Botón Hold, Selector de molienda, Barra de navegación inferior) se alcanzan cómodamente con el pulgar.
3.  **Prueba de Deshacer (Undo):** Restar una dosis en la ficha, tocar inmediatamente el botón de deshacer y validar que el stock del lote vuelva a su estado anterior en el inventario.
