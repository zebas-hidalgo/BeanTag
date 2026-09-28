# Especificación de Diseño: Cronómetro Interactivo en Vivo y Asistente de Calibración Sensorial (Modo Barista)

- **Fecha:** 2026-09-28
- **Estado:** Validado por el Barista / Listo para Plan de Implementación
- **Área:** Experiencia Barista en Barra (UI/UX), Hidrodinámica en Vivo y Bucle de Calibración Sensorial

---

## 1. Visión y Objetivos

BeanTag V3.0 cuenta con un motor físico determinista y de IA capaz de calcular con precisión milimétrica la receta óptima según el grano y el molino.
Sin embargo, en el momento de la preparación real:
1. El barista debe alternar entre mirar la pantalla del móvil y cronometrar en una báscula o temporizador externo.
2. En cafeteras con control de flujo como la **NextLevel Pulsar Mini**, los cambios de fase de válvula (cerrada en bloom, 45-50% en percolación, 100% en caída libre) requieren atención temporal exacta para evitar atascos o subextracciones.
3. Si el resultado en taza es ligeramente ácido o amargo debido a factores externos (agua, técnica de vertido, papel), no existía una forma ágil de recibir una micro-corrección física calculada para la siguiente taza.

Este diseño define dos subsistemas complementarios:
* **Cronómetro Asistente de Extracción en Vivo (`BrewGuideModal`):** Interfaz inmersiva a pantalla completa con Screen Wake Lock, alertas sonoras sintetizadas (Web Audio API), indicador dinámico de estado de válvula y metas de agua/caudal en tiempo real.
* **Asistente de Calibración Sensorial Post-Extracción ("Dial-in Feedback Loop"):** Diagnóstico ágil de 3 toques que evalúa sabor, tiempo de drenaje y cuerpo, calculando automáticamente la micro-corrección física para el molino activo y guardando la receta afinada en la base de datos.

---

## 2. Cronómetro Asistente de Extracción (`BrewGuideModal`)

### 2.1 Punto de Entrada y Activación
* Botón destacado en `frontend/src/components/BatchDetail.jsx`: **"▶ Preparar Ahora (Modo Barista)"** junto a la receta calculada.
* Abre un modal overlay a pantalla completa (`z-50`) con estética oscura de alto contraste (`#090D16` / `#0F172A`) optimizada para legibilidad a más de 1 metro de distancia en la estación de café.

### 2.2 Componentes de la Interfaz
1. **Cronómetro Principal:**
   * Tipografía monospace extra grande (`font-mono text-7xl md:text-8xl font-black text-white`).
   * Cuenta ascendente del tiempo total transcurrido (`MM:SS`).
   * Cuenta regresiva secundaria del paso actual (ej: *Quedan 18s de bloom*).
2. **Indicador de Fase y Objetivos de Peso:**
   * Nombre del paso activo (ej: *Paso 1 de 3: Bloom e Inmersión*).
   * Meta de agua acumulada: *Verter hasta 45g* (y peso del vertido actual: *+45g*).
   * Barra de progreso circular o lineal con porcentaje de avance de la fase.
   * Caudal objetivo de vertido (ej: *Caudal: ~2.2 ml/s*).
3. **Badge Dinámico de Válvula (Especial para NextLevel Pulsar Mini y métodos con válvula):**
   * `valve === 'closed'`: 🔒 **Válvula CERRADA** (Badge carmesí/ámbar brillante de alta atención).
   * `valve === 'half'`: ⚡ **Válvula 45–50% de Flujo** (Badge cian brillante con animación de pulso).
   * `valve === 'open'`: 🔓 **Válvula 100% ABIERTA** (Badge verde esmeralda).
4. **Controles Táctiles de Gran Tamaño:**
   * `Pausar / Reanudar`
   * `Siguiente Fase` (permite avanzar manualmente si el vertido o caída se completó antes)
   * `Terminar Extracción` (finaliza y pasa al diagnóstico sensorial)
   * `Cerrar / Salir` (con confirmación si el cronómetro está en marcha)

### 2.3 Integración de APIs Web Nativas
* **Screen Wake Lock API (`navigator.wakeLock`):**
  * Se solicita un `wakeLock` de tipo `'screen'` al iniciar la preparación.
  * Garantiza que la pantalla del móvil permanezca encendida durante toda la extracción sin necesidad de tocar la pantalla con las manos húmedas.
  * Se libera automáticamente cuando el modal se cierra o el componente se desmonta.
* **Web Audio API (Alertas Sonoras Sintetizadas):**
  * Utiliza un `AudioContext` nativo sin cargar archivos de audio externos (cero latencia y funcionamiento 100% offline).
  * *Tono de advertencia:* Tres pulsos suaves a 440 Hz (3s, 2s, 1s antes de terminar la fase).
  * *Tono de cambio de fase:* Acorde armonioso doble (587 Hz $\rightarrow$ 880 Hz) para avisar el cambio de paso o modulación de válvula.
  * Toggle de *Mute / Sonido* accesible en la barra superior.

---

## 3. Asistente de Calibración Sensorial Post-Extracción

### 3.1 Flujo de Diagnóstico (3 Toques en 5 Segundos)
Al detener el cronómetro o alcanzar el tiempo final, la vista transiciona a la pantalla de diagnóstico:

1. **Sabor General:**
   * `[ 🍋 Agrio / Ácido Punzante ]` *(Sub-extracción)*
   * `[ ✨ Dulce / Balanceado ]` *(Punto Dulce Óptimo)*
   * `[ ☕ Amargo / Seco ]` *(Sobre-extracción)*
2. **Tiempo Real de Drenaje:**
   * `[ ⏩ Drenó muy rápido (< tiempo meta) ]`
   * `[ 🎯 A tiempo (±15s del estimado) ]`
   * `[ 🛑 Lento o atascado (> +30s) ]`
3. **Sensación en Boca (Cuerpo / Textura):**
   * `[ 💧 Aguado / Hueco ]`
   * `[ 🍯 Sedoso / Jugoso ]`
   * `[ 🍂 Áspero / Astringente ]`

### 3.2 Lógica de Micro-Ajuste Físico
El algoritmo calcula la recomendación para la siguiente taza según el molino activo del lote:

```javascript
export function computeSensoryCorrection(activeGrinderId, currentDial, feedback) {
  // feedback: { taste: 'sour'|'balanced'|'bitter', flow: 'fast'|'on_time'|'slow', body: 'thin'|'balanced'|'astringent' }
  // Retorna: { clickDelta, tempDelta, explanation, newDialText }
}
```

* **Si Sub-extraído (Agrio / Rápido / Aguado):**
  * Molienda: $-2$ clics en Femobook A2, Comandante, Timemore o K6 (`-0.2` en Ode/K-Ultra, `-0.1.0` en J-Max).
  * Temperatura: $+1^\circ\text{C}$ o $+2^\circ\text{C}$.
  * Razón: *"El agua atravesó el lecho sin disolver suficientes azúcares y componentes dulces internos. Cerramos 2 clics la molienda e incrementamos temperatura para mayor solubilidad y cuerpo."*
* **Si Sobre-extraído (Amargo / Lento / Áspero):**
  * Molienda: $+2$ clics en Femobook A2, Comandante, Timemore o K6 (`+0.2` en Ode/K-Ultra, `+0.1.0` en J-Max).
  * Temperatura: $-1^\circ\text{C}$ o $-2^\circ\text{C}$.
  * Razón: *"El lecho acumuló excesiva resistencia hidráulica o los microfinos restringieron el flujo, extrayendo taninos y notas amargas pesadas. Abrimos 2 clics la molienda para restaurar fluidez y dulzor limpio."*
* **Si Perfecto (Dulce / A tiempo / Sedoso):**
  * Molienda: $0$ ajuste.
  * Razón: *"¡Extracción impecable! Esta receta ha alcanzado el equilibrio óptimo de dulzor, acidez y claridad para este lote."*

### 3.3 Persistencia y Actualización
* Botón **"Guardar como Receta Afinada"**:
  * Envía `POST /api/recipes` registrando el brew con el tiempo real medido, la calificación y la nueva molienda afinada.
  * Actualiza la receta activa en la vista de detalle del lote para que las futuras preparaciones comiencen directamente con la calibración perfeccionada.

---

## 4. Plan de Archivos y Arquitectura

* **Nuevo componente:** `frontend/src/components/BrewGuideModal.jsx` (Modal inmersivo, cronómetro, Wake Lock, Web Audio y diagnóstico sensorial).
* **Nuevo utilitario de lógica:** `frontend/src/utils/sensoryTuner.js` (Función determinista de micro-ajuste de molienda y temperatura según molino).
* **Modificación:** `frontend/src/components/BatchDetail.jsx` (Integración del botón *"Preparar Ahora"* y manejo de estado para abrir `BrewGuideModal`).
* **Test automatizado:** `scripts/test_sensory_tuner.mjs` (Verificación de los deltas de afinación y cálculo de dial para los 8 molinos).
