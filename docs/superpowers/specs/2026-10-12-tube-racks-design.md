# Especificación Técnica: Gestión Visual de Portatubos de Café (2x3)

**Fecha:** 2026-10-12  
**Estado:** Propuesto / Aprobado preliminarmente  
**Módulo:** Inventario / Portatubos (Bean Cellar Racks)  

---

## 1. Resumen y Objetivos

BeanTag gestiona lotes de café de especialidad y calcula dosis/tubos restantes por lote (`remaining_doses`). En la práctica de barismo, los tubos monodosis de vidrio/plástico se organizan físicamente en **portatubos** (racks) de **2 filas × 3 columnas (6 tubos por soporte)** colocados en la barra, congelador o estante.

El objetivo de esta funcionalidad es brindar un apartado interactivo dentro de **Inventario** que permita:
1. Mapear de forma visual e intuitiva la ubicación física exacta de cada tubo de café en racks 2x3.
2. Crear, renombrar y gestionar múltiples portatubos personalizados (ej. "Rack Barra Espresso", "Rack Filtrados", "Rack Freezer").
3. Asignar cafés a ranuras individuales o realizar llenado rápido en lote (por fila o rack completo).
4. Ofrecer un flujo táctil de preparación/consumo que descuente dosis del inventario y conecte con el registro de recetas/dial-in.

---

## 2. Modelo de Datos y Base de Datos (SQLite)

Se implementarán dos tablas relacionales en `backend/database.js`:

### Tabla `tube_racks`
Representa cada portatubos físico.
```sql
CREATE TABLE IF NOT EXISTS tube_racks (
  id TEXT PRIMARY KEY,
  user_id INTEGER,
  name TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Tabla `tube_rack_slots`
Representa cada uno de los 6 orificios (posiciones 1 a 6) de un portatubos.
```sql
CREATE TABLE IF NOT EXISTS tube_rack_slots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rack_id TEXT NOT NULL,
  position INTEGER NOT NULL CHECK(position BETWEEN 1 AND 6),
  batch_id TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rack_id) REFERENCES tube_racks(id) ON DELETE CASCADE,
  FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE SET NULL,
  UNIQUE(rack_id, position)
);
```

### Reglas de Inicialización:
- Al crear un `tube_rack`, se inicializan automáticamente 6 registros en `tube_rack_slots` con `position` de 1 a 6 y `batch_id = NULL`.
- Si un lote (`batch`) es eliminado de la base de datos, las ranuras que lo referenciaban quedan vacías automáticamente (`ON DELETE SET NULL`).

---

## 3. Endpoints REST (Backend)

Todos los endpoints soportan usuarios autenticados (asociados a `req.user.id`) y modo libre/unassigned:

1. **`GET /api/racks`**
   - Retorna la lista de portatubos del usuario con sus 6 ranuras y la información unida del lote (`batches.name`, `roaster`, `origin`, `remaining_doses`, `dose_weight`, `roast_date`).
2. **`POST /api/racks`**
   - Crea un nuevo portatubos (`name`) e inserta sus 6 ranuras vacías.
3. **`PUT /api/racks/:id`**
   - Modifica el nombre o el orden del portatubos.
4. **`DELETE /api/racks/:id`**
   - Elimina el portatubos y sus ranuras asociadas en cascada.
5. **`PUT /api/racks/:id/slots/:position`**
   - Asigna o desasigna un lote a una posición específica (`batch_id` o `null`).
6. **`POST /api/racks/:id/fill`**
   - Llenado rápido: Asigna un `batch_id` a todas las ranuras vacías (o a todas las 6 ranuras / filas 1 o 2).
7. **`POST /api/racks/:id/slots/:position/consume`**
   - Acción atómica: Vacía la ranura (`batch_id = null`) y descuenta 1 dosis del lote en `batches` (`remaining_doses = remaining_doses - 1`, reduciendo también `remaining_weight_g` según `dose_weight`). Retorna el lote actualizado para refrescar el estado global de la app.

---

## 4. Diseño de Interfaz y Experiencia de Usuario (UI/UX)

### 4.1 Ubicación en la Navegación
- En la pantalla **Inventario**, en la parte superior se incluye un selector de pestañas Neo-Brutalista con botones estilo píldora:
  - `[📦 Lotes / Bolsas]`
  - `[🧪 Portatubos]` (con badge indicador del total de tubos llenos / disponibles).

### 4.2 Componente del Portatubos (Estilo Neo-Brutalista Táctil)
- Cada portatubos se renderiza como una tarjeta física/soporte:
  - **Cabecera del Rack:** Nombre editable (ej. "Rack Barra Espresso"), contador de ocupación (ej. `5/6 tubos`), botón de opciones rápidas (Llenar rack, Vaciar rack, Eliminar rack).
  - **Grilla 2x3:**
    - Fila 1: Posición 1, Posición 2, Posición 3.
    - Fila 2: Posición 4, Posición 5, Posición 6.
  - **Visual de cada ranura (Tubo):**
    - **Ranura Vacía:** Círculo/cilindro con borde discontinuo (`border: 2px dashed`), número discreto (1..6) y botón táctil `+` para asignar café.
    - **Ranura Ocupada:** Cilindro estilizado con borde grueso brutalista, color temático del café (o color distintivo del tostador), etiqueta clara con:
      - Nombre del café en negrita destacada.
      - Tostador / Origen en pastilla compacta.
      - Indicador numérico de posición física (1..6).

### 4.3 Modal de Asignación / Lote Picker
- Al tocar una ranura vacía, se despliega un selector modal con los lotes activos del inventario (mostrando stock restante).
- Opción de "Asignar a este tubo (Posición X)" o "Llenar todas las ranuras vacías de este rack con este café".

### 4.4 Menú de Acción Rápida al Tocar un Tubo Lleno
Al tocar una ranura ocupada se abre un modal con acciones claras:
1. **☕ Preparar / Consumir:**
   - Descuenta 1 dosis del lote en la base de datos.
   - Vacía la posición en el rack.
   - Ofrece ir a registrar receta en Dial-In / Brew Guide con los datos del lote pre-cargados.
2. **ℹ️ Ver Ficha del Café:**
   - Abre el detalle completo del lote (`onSelectBatch`).
3. **🔄 Vaciar o Cambiar Tubo:**
   - Retira el café del tubo sin descontar dosis de inventario (por si se reubicó físicamente).

---

## 5. Casos Límite y Consideraciones de Robustez

1. **Lotes sin dosis restantes:** Si un lote se queda con `remaining_doses = 0`, los tubos que ya estaban colocados en el rack se mantienen visualmente pero muestran un aviso visual ("Última dosis en tubo").
2. **Eliminación de Lote:** Si el usuario borra un lote en la sección de inventario, el constraint `ON DELETE SET NULL` evita errores de clave foránea y limpia el slot automáticamente.
3. **Modo Sin Conexión / Optimistic Updates:** Las interacciones de asignación y consumo actualizan el estado local inmediatamente en React y sincronizan en segundo plano con la API.
4. **Dispositivos móviles:** La grilla 2x3 se adapta perfectamente a pantallas estrechas (360px+), manteniendo botones con área táctil mínima de 44px para dedos de barista.

---

## 6. Plan de Verificación

1. **Verificación de Base de Datos:**
   - Inicializar el backend y verificar la creación de tablas `tube_racks` y `tube_rack_slots`.
2. **Verificación de Endpoints API:**
   - Crear un rack de prueba, consultar slots, asignar lotes, probar endpoint `/consume`.
3. **Verificación Frontend:**
   - Alternar entre pestaña "Lotes" y "Portatubos".
   - Crear un portatubos nuevo con nombre personalizado.
   - Asignar tubos individuales y probar llenado rápido.
   - Consumir un tubo y comprobar que `remaining_doses` del lote disminuye en 1 tanto en la grilla como en la vista de Lotes y en la base de datos.
   - Cambiar de tema de color (los 5 temas neo-brutalistas) y constatar que el diseño visual del rack se adapta de manera armónica.
