# Especificación de Diseño: Sub-proyecto A - UI/UX y Filtros de Bitácora

Este documento establece el diseño y arquitectura para la barra de búsqueda en tiempo real, badges de filtrado táctil y micro-animaciones en la bitácora de extracciones de BeanTag.

---

## 🎨 Componentes Visuales y Estructura UI

### 1. Control de Filtros en `BrewHistory.jsx`

* **Barra de Búsqueda**:
  * Input con soporte para filtrado dinámico por texto en minúsculas/mayúsculas.
  * Coincidencia contra: `batch_name`, `roaster_name`, `bean_variety`, `bean_origin` y `notes`.
  * Botón de borrado rápido (`X`) cuando `searchTerm` no está vacío.

* **Filtros por Badges Táctiles (Chips)**:
  * **Sección Métodos**: `[ Todos ]`, `[ V60 ]`, `[ Espresso ]`, `[ AeroPress ]`, `[ Prensa ]`.
  * **Sección Resultado**: `[ Todos ]`, `[ 🧪 En Punto ]`, `[ ⚡ Sub-ext ]`, `[ 🔥 Sobre-ext ]`.
  * **Contenedor**: Scroll horizontal `overflow-x: auto` con `white-space: nowrap` para evitar saltos de línea en dispositivos móviles.

* **Indicador de Estado**:
  * Texto monoespaciado en la esquina superior de la bitácora: `MOSTRANDO X DE Y EXTRACCIONES`.

---

## ⚡ Micro-interacciones y Animaciones CSS

* **Entrada de Tarjetas**:
  * Definición en `index.css`: `@keyframes softFadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }`.
  * Aplicada a las tarjetas de la lista cuando cambia el estado de filtrado.

* **Estado Vacío (Empty State)**:
  * Mensaje claro cuando la búsqueda no produce resultados.
  * Botón directo con estilo `btn-candy` para restablecer todos los filtros a su estado predeterminado.

---

## 🧪 Plan de Verificación

1. **Prueba de Búsqueda**: Escribir parte del nombre de un lote u origen y confirmar que se filtran las recetas en tiempo real.
2. **Prueba de Badges**: Pulsar sobre "V60 (Filtrado)" o "En Punto" y verificar el filtrado correcto.
3. **Prueba de Limpieza**: Pulsar "Restablecer Filtros" y verificar que la lista completa de recetas vuelve a mostrarse.
4. **Verificación de Build**: Ejecutar `npm run build` en `beantag/frontend` para garantizar la validez del paquete.
