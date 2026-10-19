# Plan de Implementación: Optimización de Recetas NextLevel Pulsar Mini para 18g

> **Para agentes de ejecución:** SUB-HABILIDAD REQUERIDA: Usar `subagent-driven-development` (recomendado) o `executing-plans` para ejecutar este plan tarea por tarea. Cada paso usa sintaxis de checkbox (`- [ ]`) para seguimiento.

**Meta:** Calibrar y optimizar integralmente todas las recetas, motor barista de IA/offline y selectores de NextLevel Pulsar Mini en BeanTag para una dosis estándar de 18g (con ratios 1:16.67 a 300g, 1:17 a 306g y 1:14 a 252g).

**Arquitectura:**
- **Frontend (`famousRecipes.js`, `BatchDetail.jsx`):** Recalibrar `Scott Rao Pulsar Mini`, `Jonathan Gagné High Extraction` y `Pulsar Mini Concentrado` con dosis predeterminada de 18g, fórmulas de vertido para 300g/306g/252g y textos descriptivos adaptados. Configurar `BatchDetail.jsx` para seleccionar 18.0g por defecto al activar Pulsar Mini.
- **Backend (`aiEngine.js`):** Ajustar la dosis de referencia `refDose` a 18.0g para Pulsar Mini y actualizar la descomposición de vertidos (Bloom: 60g, Pulso 1: 120g, Pulso 2: 120g).
- **Pruebas y Despliegue:** Actualizar y ejecutar suites de verificación en `scripts/test_pulsar_mini.mjs` y `scripts/test_ai_reliability.mjs`, compilar frontend y desplegar al VPS con `./deploy.sh`.

**Tech Stack:** React 18, Vite, Node.js / Express, SQLite, KaTeX / Canvas 2D, PM2.

---

## Tareas Detalladas

### Tarea 1: Actualizar pruebas automatizadas para 18g (TDD)
- [ ] Modificar `scripts/test_pulsar_mini.mjs`:
  - Actualizar aserciones de dosis por defecto a `18g` para Scott Rao y Jonathan Gagné.
  - Verificar que `calculatePours(18)` en Scott Rao genere: Bloom 60g (`closed`), Vertido 1 120g (`open`), Vertido 2 120g (`open`), Total 300g.
  - Verificar que `calculatePours(18)` en Jonathan Gagné genere: Bloom 70g (`closed`), Vertido 1 120g (`half`), Vertido 2 116g (`open`), Total 306g.
  - Verificar que `calculatePours(18)` en Concentrado genere: Bloom 60g (`closed`), Vertido 1 192g (`open`), Total 252g.
  - Actualizar `dose_in_g: 18` en las pruebas del motor offline.
- [ ] Modificar `scripts/test_ai_reliability.mjs`:
  - Verificar que `computeOfflineRecipe` con Pulsar Mini y dosis 18g genere `water_total_g: 300` (o ratio 1:16.6).
- [ ] Ejecutar `node scripts/test_pulsar_mini.mjs` para confirmar que las pruebas fallan inicialmente antes de actualizar el código.

### Tarea 2: Recalibrar recetas legendarias en `frontend/src/utils/famousRecipes.js`
- [ ] En `famousRecipes.js`, actualizar receta `scott-rao-pulsar-mini`:
  - `defaultDose: 18`
  - `ratioVal: 16.67` (o 16.6667)
  - `calculatePours`:
    - Total agua: `Math.round(dose * 16.6667)` -> 300g con 18g
    - Bloom: `Math.round(dose * (60 / 18))` -> 60g
    - Vertido 1: `Math.round(dose * (120 / 18))` -> 120g (hasta 180g)
    - Vertido 2: `totalWater - bloom - pour1` -> 120g (hasta 300g)
  - Actualizar array `steps` con gramajes explícitos para 18g (18g café, 60g bloom a 94°C con WWDT, 120g vertido 1, 120g vertido 2).
- [ ] En `famousRecipes.js`, actualizar receta `gagne-high-extraction-mini`:
  - `defaultDose: 18`
  - `ratioVal: 17`
  - `calculatePours`:
    - Total agua: `Math.round(dose * 17)` -> 306g con 18g
    - Bloom: `Math.round(dose * (70 / 18))` -> 70g
    - Vertido 1: `Math.round(dose * (120 / 18))` -> 120g (hasta 190g)
    - Vertido 2: `totalWater - bloom - pour1` -> 116g (hasta 306g)
  - Actualizar array `steps` con gramajes explícitos para 18g (18g café, bloom de 70g a 96°C por 1:00 min, vertido de 120g al 50% de flujo, vertido final de 116g al 100%).
- [ ] En `famousRecipes.js`, verificar y afinar `pulsar-mini-concentrate`:
  - Mantener `defaultDose: 18`, `ratioVal: 14` (252g agua total).
  - Asegurar consistencia en los pasos.

### Tarea 3: Actualizar selector de método y dosis inicial en `frontend/src/components/BatchDetail.jsx`
- [ ] Al seleccionar `NextLevel Pulsar Mini` en el selector de métodos (línea ~1526):
  - Establecer dosis por defecto en `18.0g`:
    `setDoseInG(18.0); baseDoseRef.current = 18.0;`
  - Establecer ratio por defecto en `16.67` (300g agua con 18g).
- [ ] En la carga de lotes nuevos o sin dosis personalizada (línea ~699):
  - `defaultDoseForMethod = loadedMethod === 'NextLevel Pulsar Mini' ? 18.0 : ...`
- [ ] Al aplicar recetas de Scott Rao o Gagné en `handleApplyFamousRecipe`:
  - Asegurar que apliquen `18.0g` automáticamente.

### Tarea 4: Actualizar motor IA y offline en `backend/aiEngine.js`
- [ ] Actualizar `refDose` para `isPulsar`:
  - Cambiar de `15.0` a `18.0` (línea ~514).
- [ ] En el cálculo de vertidos para Pulsar Mini (línea ~755):
  - Calibrar para dosis de 18g:
    - Bloom: `Math.round(dose * (60 / 18))` (60g para 18g)
    - Pulso 1: `Math.round(dose * (120 / 18))` (120g para 18g)
    - Pulso 2: restante hasta `totalWaterG` (120g para 18g a ratio 1:16.67)
  - Actualizar los textos de `steps` generados para mencionar 18g y los vertidos de 60g, 120g, 120g.

### Tarea 5: Verificación integral, pruebas y despliegue
- [ ] Ejecutar `node scripts/test_pulsar_mini.mjs` y confirmar que todas las aserciones pasan.
- [ ] Ejecutar `node scripts/test_ai_reliability.mjs` y confirmar que pasan las pruebas de offline engine.
- [ ] Ejecutar `node scripts/verify_cards_render.mjs` para garantizar que las tarjetas y canvas no sufrieron regresiones.
- [ ] Compilar frontend con `npm --prefix frontend run build`.
- [ ] Desplegar en el VPS con `./deploy.sh` y verificar con cURL en producción.
