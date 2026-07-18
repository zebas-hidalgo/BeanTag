# Especificación de Diseño: Auditoría y Refactorización de BeanTag (Enfoque A)

**Fecha:** 18 de Julio, 2026  
**Estado:** ✅ Aprobado por el usuario  
**Enfoque seleccionado:** Enfoque A (Arquitectura Modular, Resiliencia y Respaldo)

---

## 1. Contexto y Objetivos

BeanTag es una PWA neo-brutalista de calibración de café construida con React (Vite), Express (Node.js) y SQLite.
Esta especificación define la reestructuración y modularización del frontend, la incorporación de validación estricta y mecanismos de respaldo y recuperación ante errores.

---

## 2. Arquitectura de Componentes (Frontend)

Para eliminar el componente monolítico de `BatchDetail.jsx`, dividiremos la interfaz en sub-componentes especializados:

### Nuevo Flujo de Componentes:
* **`BatchDetail.jsx` (Orquestador)**: Recibe `batchId`, coordina el estado de la vista y orquesta los sub-componentes.
* **`BatchInfo.jsx`**: Renderiza los metadatos del café (origen, productor, variedad, proceso, altitud, tueste y notas SCA).
* **`RecipeForm.jsx`**: Formulario de calibración. Gestiona la molienda (steppers de J-Max), ratios, temperatura y notas sensoriales.
* **`AICalibrator.jsx`**: Componente de recomendación barística inteligente vía Gemini API. Permite generar y aplicar recetas recomendadas.
* **`ShareCanvas.jsx`**: Generación y descarga de tarjetas de compartido Canvas.
* **`RecipeHistory.jsx`**: Renderiza la lista histórica de calibraciones del lote.

---

## 3. Esquemas de Validación (Zod)

Crearemos esquemas de datos utilizando `zod` en `frontend/src/schemas/`:

* **`batchSchema.js`**:
  - `name`: String no vacío.
  - `producer`: String no vacío.
  - `dose_weight`: Coerción a float positivo.
  - `total_doses`: Coerción a entero positivo.
* **`recipeSchema.js`**:
  - `method`: String no vacío.
  - `dose_in_g`: Float positivo.
  - `ratio`: String con formato `1:\d+(\.\d+)?`.
  - `rating`: Entero en el rango `[1, 5]`.

---

## 4. Sistema de Respaldo y Restauración

* **Backend (`backend/server.js`)**:
  - `GET /api/export/json`: Retorna toda la base de datos como backup JSON.
  - `GET /api/export/csv`: Retorna un archivo zip/CSV con la exportación de lotes y recetas.
  - `POST /api/import/json`: Recibe el JSON de backup, lo valida con los esquemas de Zod e inserta los datos en SQLite de forma segura.
* **Frontend (`BackupManager.jsx`)**:
  - Panel visual de importación/exportación integrado en `Settings.jsx`. Muestra confirmaciones e historial.

---

## 5. Resiliencia y Recuperación (Error Boundary)

* **`ErrorBoundary.jsx`**:
  - Componente de captura de errores JavaScript.
  - Muestra una pantalla de contingencia con la misma estética Neo-Brutalista y opción de recarga forzada.
* **Cron Daily Backup (`scripts/backup-daily.sh`)**:
  - Script bash que realiza una copia diaria comprimida de `database.sqlite` a las 3:00 AM.
  - Retención automática de backups durante 30 días.
