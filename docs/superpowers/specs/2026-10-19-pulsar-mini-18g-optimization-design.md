# Especificación de Diseño: Optimización de Recetas NextLevel Pulsar Mini para 18g

**Fecha:** 2026-10-19  
**Estado:** Aprobado por el usuario  
**Área:** Recetas de especialidad, Motor Barista (IA / Offline), Guiado en vivo, Calibración de Molinos

---

## 1. Resumen Ejecutivo
El método **NextLevel Pulsar Mini** (extractor híbrido de inmersión y percolación no-bypass diseñado junto a Jonathan Gagné y Scott Rao) contaba con recetas y dosis iniciales configuradas en 15g. 

Dado que el flujo de trabajo estándar en BeanTag (incluyendo los tubos de monodosis en portatubos) utiliza dosis de **18g**, se optimizan integralmente todas las recetas de Pulsar Mini para 18g, recalculando los volúmenes de vertido (pours), tiempos de retención/percolación, estados de válvula y granulometría D50 para compensar el aumento del 20% en la profundidad del lecho de café.

---

## 2. Parámetros de Recetas Legendarias (18g)

### A. Scott Rao Pulsar Mini (Protocolo No-Bypass Estándar)
- **Dosis:** 18.0g
- **Ratio:** 1:16.67 (300g agua total)
- **Temperatura:** 94°C
- **Tiempo total:** 3:30 - 3:45 min
- **Molienda D50:** 800 - 820 µm (Media No-Bypass)
- **Fases de Vertido:**
  1. **Paso 1 (Bloom & WWDT):** 60g a 94°C | Válvula: 🔒 `closed` | 0:00 - 0:45 | Agitación suave con aguja WWDT para desgasificación profunda sin compactar.
  2. **Paso 2 (1º Vertido de Percolación):** 120g (hasta 180g) | Válvula: 🔓 `open` | 0:45 - 2:00 | Verter sobre la tapa de dispersión con flujo suave.
  3. **Paso 3 (2º Vertido y Drenaje):** 120g (hasta 300g) | Válvula: 🔓 `open` | 2:00 - 3:45 | Caída final libre hasta lecho completamente plano.
- **Notas sensoriales:** Claridad nítida, balance acidez-dulzor sobresaliente, alta repetibilidad.

### B. Jonathan Gagné High Extraction Mini (Extracción Extrema >23% EY)
- **Dosis:** 18.0g
- **Ratio:** 1:17.0 (306g agua total)
- **Temperatura:** 96°C (casi hirviendo para tuestes nórdicos ultra-claros)
- **Tiempo total:** 4:15 - 4:30 min
- **Molienda D50:** 780 - 800 µm (Media-Fina No-Bypass)
- **Fases de Vertido:**
  1. **Paso 1 (Bloom Prolongado):** 70g a 96°C | Válvula: 🔒 `closed` | 0:00 - 1:00 | Inmersión total de 1 minuto entero.
  2. **Paso 2 (Percolación Lenta Restringida):** 120g (hasta 190g) | Válvula: ⚡ `half` (45-50% flujo) | 1:00 - 2:30 | Restringir caudal a ~2-2.5 ml/s manteniendo ~1 cm de columna de agua.
  3. **Paso 3 (Vertido Final & Drenaje):** 116g (hasta 306g) | Válvula: 🔓 `open` | 2:30 - 4:30 | Abrir válvula al 100% para caída final hasta secar.
- **Notas sensoriales:** Extracción extrema superando 23% EY, acidez brillante y cristalina.

### C. Pulsar Mini Concentrado (Extracción Corta de Alta Densidad)
- **Dosis:** 18.0g
- **Ratio:** 1:14.0 (252g agua total)
- **Temperatura:** 92°C
- **Tiempo total:** 3:15 min
- **Molienda D50:** 840 µm (Media-Gruesa)
- **Fases de Vertido:**
  1. **Paso 1 (Inmersión Saturada):** 60g a 92°C | Válvula: 🔒 `closed` | 0:00 - 0:45 | Saturación densa.
  2. **Paso 2 (Vertido Continuo):** 192g (hasta 252g) | Válvula: 🔓 `open` | 0:45 - 3:15 | Drenaje sostenido.
- **Notas sensoriales:** Cuerpo denso, textura sedosa, notas acarameladas y melosas.

---

## 3. Calibración Física de Granulometría (8 Molinos)
Para el lecho de 18g:
- **Femobook A2:** 68 - 74 clics (~1.7 - 1.8 Rot.)
- **1Zpresso J-Max:** 2.4.2 - 2.5.0 (~220 - 230 clics)
- **Comandante C40:** 24 - 26 clics
- **1Zpresso K-Ultra:** 8.0 - 8.5 (80 - 85 clics)
- **Fellow Ode Gen 2:** Ajuste 4.1 - 5.0 (muelas 64mm planas)
- **Kingrinder K6:** 98 - 108 clics (1 Rot. 38 - 48 Clics)
- **Timemore C2/C3:** 19 - 22 clics
- **Baratza Encore / ESP:** Ajuste 18 - 22

---

## 4. Impacto en Componentes de la Aplicación

1. **`frontend/src/utils/famousRecipes.js`:**
   - Actualizar `defaultDose: 18` en todas las recetas de Pulsar Mini.
   - Actualizar `calculatePours` con las fórmulas de 18g (Rao: 60 + 120 + 120 = 300g; Gagné: 70 + 120 + 116 = 306g; Concentrado: 60 + 192 = 252g).
   - Actualizar textos de los pasos descriptivos para reflejar 18g y los gramos de cada etapa.

2. **`frontend/src/components/BatchDetail.jsx`:**
   - Al seleccionar `NextLevel Pulsar Mini` en el selector de métodos segmentado, establecer `doseInG` en `18.0` (y `baseDoseRef.current = 18.0`).
   - El ratio predeterminado se fija en `16.67` (para un total de 300g de agua con 18g).
   - Carga de recetas de Scott Rao y Gagné aplican 18g por defecto.

3. **`backend/aiEngine.js`:**
   - Actualizar `refDose` para `isPulsar`: `18.0g` (línea ~514).
   - Actualizar `pours` para `isPulsar`:
     - Bloom: `Math.round(dose * (60 / 18))` (~60g)
     - Pulso 1: `Math.round(dose * (120 / 18))` (~120g)
     - Pulso 2: restante hasta alcanzar `totalWaterG` (~300g con ratio 1:16.6)
   - Actualizar los textos de `steps` en `aiEngine.js` para indicar 18g.

4. **Tests de Verificación (`scripts/test_pulsar_mini.mjs`, `scripts/test_ai_reliability.mjs`):**
   - Actualizar las aserciones para verificar dosis de 18g, volúmenes de 300g/306g/252g y consistencia de válvulas.

---

## 5. Criterios de Aceptación
1. Al pulsar el botón "Pulsar Mini" en la ficha de café, el campo de dosis muestra 18.0g y el agua calculada 300g (ratio 1:16.67).
2. Las recetas de Scott Rao y Jonathan Gagné se muestran calibradas para 18g con sus 3 fases de válvula (`closed` -> `open` o `half` -> `open`).
3. El motor offline de IA genera vertidos de 60g, 120g, 120g para 18g en Pulsar Mini.
4. Las pruebas automatizadas `test_pulsar_mini.mjs` y `test_ai_reliability.mjs` pasan al 100%.
5. El bundle del frontend compila sin advertencias ni errores y se despliega en producción en el VPS.
