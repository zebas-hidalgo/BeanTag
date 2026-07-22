# Especificación de Diseño: Sub-proyecto C - Backup Dual (JSON + CSV) y Fusión de Datos

Este documento especifica el diseño y la arquitectura para la exportación de bitácoras en formato CSV para Microsoft Excel / Google Sheets, y la importación de respaldos JSON con modo de fusión inteligente (Merge).

---

## 🎨 Backend y Endpoints (`server.js`)

### 1. Endpoint CSV `/api/backup/export/csv`
* **Método**: `GET`
* **Codificación**: UTF-8 con BOM (`\uFEFF`) para apertura directa e impecable en Microsoft Excel sin problemas de tildes o caracteres especiales.
* **Headers HTTP**:
  * `Content-Type`: `text/csv; charset=utf-8`
  * `Content-Disposition`: `attachment; filename="beantag_bitacora_YYYY-MM-DD.csv"`
* **Campos del CSV**:
  1. `ID`
  2. `Fecha`
  3. `Lote`
  4. `Tostador`
  5. `Origen`
  6. `Variedad`
  7. `Proceso`
  8. `Método`
  9. `Ratio`
  10. `Molienda (J-Max)`
  11. `Temperatura`
  12. `Tiempo Extracción`
  13. `Balance`
  14. `Cuerpo`
  15. `Resultado Sensorial`
  16. `Dosis Entrada (g)`
  17. `Dosis Salida (g)`
  18. `Notas de Cata`

### 2. Endpoint Importación `/api/backup/import`
* **Método**: `POST`
* **Parámetros en Body**:
  * `batches`: Array de lotes
  * `recipes`: Array de recetas
  * `mode`: `'replace'` (por defecto, borra y reemplaza) o `'merge'` (conserva datos actuales e inserta con `INSERT OR IGNORE`)

---

## 🎨 Frontend UI (`Settings.jsx`)

* **Nuevos Botones**:
  * `Descargar Respaldo JSON`
  * `Exportar Bitácora CSV (Excel)`
  * `Cargar / Importar Respaldo`
* **Modal de Confirmación de Importación**:
  * Permite al usuario seleccionar el modo antes de procesar el archivo JSON:
    * 🔄 **Reemplazar Todo**
    * ➕ **Fusionar / Conservar Existentes**

---

## 🧪 Plan de Verificación

1. **Prueba de Exportación CSV**: Descargar el CSV desde `Settings.jsx` y verificar que el archivo es legible y tiene la estructura esperada.
2. **Prueba de Importación Merge**: Cargar un respaldo JSON en modo `merge` y confirmar que los lotes y recetas actuales no se eliminan.
3. **Verificación de Build**: Ejecutar `npm run build` en `beantag/frontend` para asegurar 0 errores de empaquetado.
