# Plan de Implementación: Flujo Cafetero UX Pro (Monocromo)

Este plan detalla los cambios para rediseñar la vista de detalle, integrar el cronómetro de preparación, el botón de repetir última receta y el contador de dosis simplificado.

---

## 1. Modificaciones Propuestas

### A. Estilos CSS (frontend/src/index.css)
Agregar variables de diseño para el banner de referencia, el cronómetro en vivo y los bloques de información compactos:
```css
/* Banner de Referencia de Receta */
.recipe-target-banner {
  background-color: #F8FAFC;
  border: 2px solid var(--color-border);
  padding: 14px;
  margin-bottom: 16px;
}

/* Cronómetro de Extracción */
.timer-container {
  border: 2px solid var(--color-border);
  background-color: #FFFFFF;
  padding: 16px;
  text-align: center;
  margin-bottom: 16px;
}

.timer-display {
  font-family: var(--font-mono);
  font-size: 36px;
  font-weight: 900;
  margin: 10px 0;
  color: var(--color-navy);
}

.timer-controls {
  display: flex;
  justify-content: center;
  gap: 8px;
}

/* Ficha del Grano Simplificada (Sin Bordes Negros Invasivos) */
.grain-details-compact {
  font-size: 13px;
  color: var(--color-text-muted);
  margin-bottom: 16px;
  line-height: 1.6;
}

.grain-details-compact strong {
  color: var(--color-navy);
}
```

### B. Actualización de BatchDetail.jsx (frontend/src/components/BatchDetail.jsx)
Reestructurar completamente el componente para:
1.  **Dosis y Botón Restar Integrados:** Mostrar `Dosis Disponibles: X` y a su lado un botón minimalista `[ Restar 1 Tubo ]`.
2.  **Ficha Técnica Simplificada:** Mostrar productor, altitud, varietal y proceso en un bloque de texto ordenado, sin rejillas complejas.
3.  **Tarjeta del Congelador:** Caja monocromática para mostrar las fechas (Tueste, Congelación), reposo y semanas congelado.
4.  **Banner "Última Extracción":** Si existen recetas previas en `batch.recipes`, mostrar el banner con el método, molienda J-Max, temperatura y ratio de agua objetivo (`dosis * ratio`).
5.  **Botón "Repetir Receta":** Botón de un solo clic que duplica la última receta, resta una dosis en el backend y regresa al inventario.
6.  **Cronómetro en Vivo (Brew Timer):** Un temporizador digital con botones *Iniciar / Pausar / Detener*. Al detenerlo, guarda los segundos en el estado del formulario de bitácora.

---

## 2. Plan de Verificación

1.  Compilar el frontend localmente con Vite.
2.  Ejecutar el despliegue al VPS.
3.  Verificar que el temporizador funciona e incrementa cada segundo.
4.  Confirmar que al hacer clic en "Repetir Receta" se guarda el log y disminuye la cantidad de tubos en el inventario.
