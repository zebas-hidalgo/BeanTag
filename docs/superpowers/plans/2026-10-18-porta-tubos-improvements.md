# Plan de Implementación: Mejoras en Portatubos (Monodosis) BeanTag

> **Para agentes de ejecución:** Usar `subagent-driven-development` o `executing-plans`. Seguir los pasos con checkboxes (`- [ ]`).

**Meta:** Implementar las 4 mejoras solicitadas para el módulo de Portatubos (2×3):
1. Descuento dinámico en tiempo real de dosis disponibles en el selector al asignar tubos a ranuras.
2. Reordenamiento frontal de ranuras: fila frontal inferior (#01, #02, #03) y fila trasera superior (#04, #05, #06).
3. Corrección de desbordamiento lateral en dispositivos móviles (columnas con `minmax(0, 1fr)`, `minWidth: 0`, paddings proporcionales y truncamiento seguro).
4. Vista general "Todos los Portatubos": pestaña inicial "Todos" que muestra todos los racks apilados verticalmente junto a las pestañas individuales.

**Arquitectura:**
- **Frontend:**
  - En `TubeRacksView.jsx`:
    - Añadir soporte para `selectedRackId === 'all'` con renderizado de todos los racks en lista vertical limpia y responsive.
    - Reordenar la cuadrícula a `[4, 5, 6, 1, 2, 3]` con indicadores visuales discretos de fila trasera ("Atrás") y fila frontal ("Frente").
    - Ajustar estilos CSS Grid (`repeat(3, minmax(0, 1fr))`, `minWidth: 0`, paddings adaptables) para evitar cualquier desbordamiento horizontal.
    - Pasar a `SlotAssignModal` el conteo de dosis ocupadas en todos los racks para calcular en tiempo real `availableForAssignment`.
  - En `SlotAssignModal.jsx`:
    - Calcular `assignedCount` para cada lote sumando los tubos asignados en todos los racks.
    - Calcular `availableForAssignment = Math.max(0, batch.remaining_doses - assignedCount + (currentSlotIsThisBatch ? 1 : 0))`.
    - Mostrar dosis disponibles vs dosis totales de la bolsa (ej: `3 disponibles de 5 en bolsa`).
    - Deshabilitar o bloquear la selección si `availableForAssignment <= 0` con aviso visual "Sin tubos libres".
    - Ajustar "Llenar rack con este café" para que no exceda las dosis disponibles.
- **Backend:**
  - En `backend/server.js`:
    - En `PUT /api/racks/:id/slots/:position`, validar que si se asigna un `batch_id`, las ranuras ocupadas en todos los racks no excedan `batch.remaining_doses`.
    - En `POST /api/racks/:id/fill`, limitar la cantidad de ranuras a rellenar al número de dosis realmente disponibles (`Math.min(emptySlots.length, availableDoses)`).

---

## Tareas Detalladas

### Tarea 1: Backend - Validación de disponibilidad de stock al asignar y llenar
- [ ] Modificar `backend/server.js` en `PUT /api/racks/:id/slots/:position`:
  - Contar cuántos slots en toda la base de datos ya tienen asignado ese `batch_id` (excluyendo el slot actual si ya lo tenía).
  - Verificar que `currentlyAssigned < batch.remaining_doses`. Si ya no hay dosis disponibles, devolver código 400 con mensaje claro: `"No quedan dosis disponibles de este café en inventario."`.
- [ ] Modificar `backend/server.js` en `POST /api/racks/:id/fill`:
  - Obtener `batch.remaining_doses`.
  - Contar tubos ya asignados de ese lote en todos los racks.
  - Calcular cuántas ranuras vacías se pueden llenar sin superar las dosis disponibles.
  - Si es 0, devolver error 400.
  - Asignar solo hasta ese cupo máximo.
- [ ] Crear test o script de verificación automatizado para confirmar el comportamiento de los endpoints.

### Tarea 2: Frontend - Selector de Lotes con descuento dinámico (`SlotAssignModal.jsx`)
- [ ] Actualizar props de `SlotAssignModal.jsx` para recibir `racks` (o un mapa de `tubesAssignedByBatchId`).
- [ ] Calcular para cada café en la lista de asignación:
  - `assignedInRacks`: cantidad de tubos de este lote ya asignados en cualquier rack.
  - `availableToAssign = Math.max(0, (batch.remaining_doses || 0) - assignedInRacks + (isCurrentSlotThisBatch ? 1 : 0))`.
- [ ] Actualizar la interfaz de cada ítem de café:
  - Mostrar badge con `availableToAssign` tubos disponibles (ej. `2 disp. / 5 en bolsa`).
  - Si `availableToAssign === 0`, atenuar visualmente el café, marcarlo como "Agotado en portatubos" y deshabilitar el botón de asignación.
- [ ] En la acción "Llenar rack con este café":
  - Indicar cuántos tubos puede llenar (ej. `Llenar rack (hasta 2 tubos)` si solo quedan 2 disponibles).

### Tarea 3: Frontend - Reordenamiento frontal 2×3 y corrección de desbordamiento lateral (`TubeRacksView.jsx`)
- [ ] En `TubeRacksView.jsx`, cambiar el orden del mapeo de slots a `[4, 5, 6, 1, 2, 3]`:
  - Fila superior visual: tubos #04, #05, #06 (fila trasera).
  - Fila inferior visual: tubos #01, #02, #03 (fila frontal).
  - Agregar etiquetas sutiles para orientación espacial: indicador de fila trasera ("Atrás") y fila frontal ("Frente / Vista frontal").
- [ ] Resolver desbordamiento lateral:
  - En el contenedor de la grilla, aplicar `gridTemplateColumns: 'repeat(3, minmax(0, 1fr))'`.
  - En cada ranura de tubo, asegurar `minWidth: 0`, `boxSizing: 'border-box'`.
  - Reducir paddings anidados en el marco del rack (`padding: '12px'` en vez de `18px`, y stand padding `10px` en vez de `14px`, con gap `8px`).
  - Asegurar que los textos (`batchName`, `subtitle`, `doseWeight`) tengan `overflow: 'hidden'`, `textOverflow: 'ellipsis'`, `whiteSpace: 'nowrap'` y no empujen las columnas.

### Tarea 4: Frontend - Vista unificada "Todos los Portatubos" (`TubeRacksView.jsx`)
- [ ] Añadir pestaña inicial "🗂️ Todos" en la barra de navegación de racks:
  - Mostrar total de racks y tubos ocupados.
  - Cuando está activa (`selectedRackId === 'all'`):
    - Renderizar todos los portatubos apilados verticalmente de forma elegante.
    - Cada rack mantiene su encabezado con nombre, estado de ocupación, menú de opciones (renombrar, vaciar, eliminar) y su grilla 2×3 funcional.
    - Permitir asignar, vaciar o extraer tubos directamente desde cualquier rack de la lista.
  - Cuando se selecciona una pestaña individual, mostrar únicamente ese portatubos (como antes).
  - Si no hay ningún rack seleccionado o al entrar por primera vez, sugerir 'all' o el primer rack según convenga.

### Tarea 5: Verificación integral y despliegue en VPS
- [ ] Probar compilación del frontend con `npm --prefix frontend run build`.
- [ ] Ejecutar suite de pruebas de verificación existente (`node scripts/verify_cards_render.mjs`).
- [ ] Desplegar en el VPS con `./deploy.sh`.
- [ ] Verificar funcionamiento en vivo mediante cURL o navegación web (endpoints `/api/racks`, asignación, consumo y renderizado).
