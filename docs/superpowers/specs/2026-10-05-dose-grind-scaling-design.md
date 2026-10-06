# Especificación de Diseño: Auto-adaptación de Molienda por Dosis en Gramos (Dose-Grind Scaling)

**Fecha:** 2026-10-05  
**Autor:** Antigravity Barista Engine  
**Estado:** Aprobado  

---

## 1. Problema y Contexto Físico
Al variar los gramos de café en una receta (ej. de 15g a 20g o de 18g a 12g), la altura física de la cama de café ($L$) en el portafiltro o dripper se modifica directamente:
- **Mayor dosis ($+g$)**: Cama más profunda $\rightarrow$ aumenta la resistencia hidráulica (Ley de Darcy) y prolonga el tiempo de drenaje. Sin un ajuste de molienda, el flujo se frena y genera sobre-extracción astringente y amarga.
- **Menor dosis ($-g$)**: Cama superficial $\rightarrow$ disminuye la resistencia y el agua drena velozmente sin solubilizar los azúcares y lípidos deseados, provocando sub-extracción débil y ácida.

Actualmente, al cambiar los gramos en `BatchDetail.jsx` o solicitar recetas automáticas, los clics/pasos de los molinos permanecían estáticos. Se requiere que el sistema adapte la molienda automáticamente en tiempo real tanto en la interfaz de usuario como en el motor de cálculo de recetas (offline y Gemini AI).

---

## 2. Modelo Físico y Coeficientes de Compensación

### 2.1. Dosis de Referencia Base ($D_0$) por Método
- **Filtrado Cónico / Plano (V60, Kalita, Origami, etc.)**: $15.0\text{g}$
- **NextLevel Pulsar Mini (No-bypass)**: $15.0\text{g}$
- **AeroPress Go**: $14.0\text{g}$
- **AeroPress Regular**: $15.0\text{g}$
- **Chemex / Lotes Grandes**: $30.0\text{g}$
- **Prensa Francesa**: $20.0\text{g}$
- **Espresso**: $18.0\text{g}$

### 2.2. Sensibilidad en Micrones (D50)
- **Filtrados / Inmersión**: $\Delta \mu\text{m} = (D_{\text{nueva}} - D_{\text{base}}) \times 8.0\ \mu\text{m/g}$
- **Espresso**: $\Delta \mu\text{m} = (D_{\text{nueva}} - D_{\text{base}}) \times 5.0\ \mu\text{m/g}$

### 2.3. Matriz de Conversión para los 8 Molinos Soportados

| Molino ID | Nombre | Paso Axial / Mecánico | Regla de Delta por Dosis |
| :--- | :--- | :--- | :--- |
| `femobook` | Femobook A2 | $18\ \mu\text{m}$ / clic | $\Delta \text{clicks} = \text{round}(\Delta \mu\text{m} / 18)$ ($\approx \pm 1$ clic cada $\pm 2.25\text{g}$) |
| `jmax` | 1Zpresso J-Max | $8.8\ \mu\text{m}$ / clic | $\Delta \text{clicks} = \text{round}(\Delta \mu\text{m} / 8.8)$ ($\approx \pm 1$ clic por cada $\pm 1.0\text{g}$) |
| `k_ultra` | 1Zpresso K-Ultra | $20\ \mu\text{m}$ / clic ($0.1$ dial) | $\Delta \text{dial} = \text{round}(\Delta \mu\text{m} / 20 \times 10) / 10 \times 0.1$ ($\approx \pm 0.1$ dial cada $\pm 2.5\text{g}$) |
| `ode_gen2` | Fellow Ode Gen 2 | $35\ \mu\text{m}$ / división | $\Delta \text{dial} = \text{round}(\Delta \mu\text{m} / 35 \times 10) / 10 \times 0.1$ ($\approx \pm 0.1$ dial cada $\pm 2.5\text{g}$) |
| `comandante` | Comandante C40 | $30\ \mu\text{m}$ / clic | $\Delta \text{clicks} = \text{round}(\Delta \mu\text{m} / 30)$ ($\approx \pm 1$ clic cada $\pm 3.5\text{g}$) |
| `kingrinder` | Kingrinder K6 | $16\ \mu\text{m}$ / clic | $\Delta \text{clicks} = \text{round}(\Delta \mu\text{m} / 16)$ ($\approx \pm 1$ clic cada $\pm 2.0\text{g}$) |
| `timemore` | Timemore C2/C3 | $28\ \mu\text{m}$ / clic | $\Delta \text{clicks} = \text{round}(\Delta \mu\text{m} / 28)$ ($\approx \pm 1$ clic cada $\pm 3.5\text{g}$) |
| `baratza` | Baratza Encore / ESP | $35\ \mu\text{m}$ / paso | $\Delta \text{step} = \text{round}(\Delta \mu\text{m} / 35)$ ($\approx \pm 1$ paso cada $\pm 4.5\text{g}$) |

---

## 3. Arquitectura y Componentes Afectados

### 3.1. Utilidades Centrales (`frontend/src/utils/grinders.js`)
- Exportar `calculateDoseDeltaMicrons(method, fromDose, toDose)`:
  Calcula el cambio de micrones físicos basado en el método y la variación de masa de café.
- Exportar `scaleGrinderSettingForDose(grinderId, currentVal, fromDose, toDose, method)`:
  Recibe el estado actual del molino (ej. clics numéricos o dial flotante) y retorna:
  ```javascript
  {
    newVal,       // Nuevo valor clamp al rango del molino
    delta,        // Diferencia numérica aplicada (+2, -1, +0.2, etc.)
    deltaMicrons, // Cambio estimado en micrones D50
    direction,    // 'coarser' | 'finer' | 'same'
    description   // Texto explicativo para el barista
  }
  ```

### 3.2. Interfaz de Preparación (`frontend/src/components/BatchDetail.jsx`)
- Mantener un ref de la dosis previa (`prevDoseRef`) para capturar la diferencia al incrementar o decrementar la dosis.
- Al cambiar `doseInG` (vía stepper `+ / -` o entrada directa en el input):
  - Calcular el ajuste para el molino activo y actualizar sus estados (`setFemobookClicks`, `setJmaxRot/Num/Click`, etc.).
  - Mostrar un chip/banner interactivo de calibración:
    `⚖️ Auto-ajuste por dosis: +2 clics al subir a 20.0g (Cama más profunda)`
  - Permitir al barista modificar manualmente el molino en cualquier momento sin perder la libertad de ajuste fino.

### 3.3. Motor de Cálculo Offline y Prompt de IA (`backend/aiEngine.js`)
- En `computeOfflineRecipe`:
  - Leer `dose = parseFloat(batch.dose_in_g) || 20.0;`
  - Determinar `refDose` según método.
  - Calcular `doseDeltaMicrons = Math.round((dose - refDose) * (isEspresso ? 5.0 : 8.0));`
  - Añadir `doseDeltaMicrons` a `deltaMicrons`.
  - Registrar en `reasons`:
    `Escalado de dosis (${dose}g vs base ${refDose}g: cama de café ${dose > refDose ? 'más profunda, molienda +' : 'menos profunda, molienda -'}${Math.abs(doseDeltaMicrons)}µm para regular tiempo de contacto)`
- En `generateAiRecipePrompt`:
  - Instruir a Google Gemini a modular el tamaño de molienda y los clics de cada molino según los gramos de café especificados.

---

## 4. Pruebas y Criterios de Aceptación
1. **Pruebas Unitarias (`scripts/test_dose_grind_scaling.mjs`)**:
   - V60 de 15g a 20g (+5g) en Femobook A2 $\rightarrow$ debe sumar +2 clics (molienda más gruesa).
   - V60 de 15g a 12g (-3g) en Femobook A2 $\rightarrow$ debe restar -1 clic (molienda más fina).
   - V60 de 15g a 20g en J-Max $\rightarrow$ debe sumar +5 clics.
   - V60 de 15g a 20g en K-Ultra $\rightarrow$ debe sumar +0.2 en dial.
   - V60 de 15g a 20g en Ode Gen 2 $\rightarrow$ debe sumar +0.2 en dial.
   - Espresso de 18g a 20g (+2g) en Femobook A2 $\rightarrow$ debe sumar +1 clic.
   - Dosis idéntica (15g a 15g) $\rightarrow$ delta 0.
2. **Pruebas en UI (`BatchDetail.jsx`)**:
   - Modificar dosis con stepper en vivo actualiza el molino seleccionado en pantalla y muestra el chip explicativo.
   - Cambiar de molino preserva la calibración adaptada.
3. **Pruebas de Bundle y Despliegue en VPS**:
   - `npm --prefix frontend run build` exitoso (0 errores).
   - Despliegue en `5.189.152.68` con recarga limpia de PM2.
