# Especificación de Diseño: Recalibración Integral de Métodos de Extracción, Física del Grano y Molinos para BeanTag V3.0

- **Fecha:** 2026-09-28
- **Estado:** Validado por el Barista / Listo para Plan de Implementación
- **Área:** Motor de Inteligencia Barista, Física de Fluidos y Unificación de Molienda

---

## 1. Contexto y Diagnóstico del Problema

Durante las pruebas con la cafetera de flujo continuo y cero bypass **NextLevel Pulsar Mini** acoplada al molino manual **Femobook A2** (38mm cónicas, 18 µm/clic, 40 clics/rotación):
1. **Intento 1 (~47 clics / ~550 µm):** La molienda resultó **excesivamente fina**. Debido a que la Pulsar Mini posee una base de filtrado pequeña (~45 mm de diámetro / ~16 cm² de área de papel) y 0% de bypass, los microfinos inherentes al corte de muelas cónicas migraron al fondo del lecho, colmatando el papel de filtro (*choking*) y deteniendo la extracción.
2. **Intento 2 (~74 clics / ~820 µm):** Sobrecompensación hacia un tamaño **demasiado grueso** (1.85 rotaciones completas del dial), propio de prensa francesa. Al carecer la receta de instrucciones de modulación de la válvula de control de flujo, el agua atravesó el lecho de café en caída libre sin generar la presión osmótica necesaria, dejando una taza aguada, subextraída y astringente.
3. **Objetivo de este diseño:** Establecer un modelo unificado de micro-física que calcule el tamaño de partícula óptimo ($D_{50}$ en micrones) según el método hidrodinámico, module dicho tamaño de forma no lineal según la naturaleza del grano (proceso, nivel de tueste, altitud/densidad, y días de reposo/desgasificación de CO₂), y traduzca dicho valor con exactitud milimétrica a los 8 molinos soportados en BeanTag, sincronizando tanto el motor de IA (Gemini) como el motor determinista offline y las utilidades del cliente web.

---

## 2. Modelo Físico de Dos Capas

### 2.1 Ecuación de Partícula Objetivo ($D_{50}$)

$$\text{Micrones Finales } (D_{50}) = \text{Base}_{\text{Método}} + \Delta_{\text{Proceso}} + \Delta_{\text{Tueste}} + \Delta_{\text{Altitud}} + \Delta_{\text{Reposo}} + \Delta_{\text{Criogénico}}$$

### 2.2 Línea Base por Método de Extracción

| Método | Hidráulica y Geometría | $D_{50}$ Base | Rango Seguro | Ratio Base | Temp Base | Protocolo de Flujo |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **NextLevel Pulsar Mini** | Cero bypass, lecho cilíndrico (Ø 45mm), dispersor de ducha | **780 µm** | 740 – 830 µm | 1:16.0 | 93°C | **Válvula modulada:** 100% cerrada en bloom, 45-50% en percolación (2-2.5 ml/s), 100% en drenaje final. |
| **V60 / Origami / Cónico** | Cono 60° con estrías, bypass lateral libre | **720 µm** | 680 – 760 µm | 1:15.5 | 93°C | Vertidos concéntricos por pulsos continuos; tiempo meta 2:45–3:15 min. |
| **Espresso** | Lecho compacto bajo 9 bar de presión | **260 µm** | 210 – 310 µm | 1:2.0 – 1:2.4 | 92°C | Tiempo meta 25–30s según densidad y solubilidad. |
| **AeroPress Estándar** | Inmersión total + extrusión manual suave | **620 µm** | 580 – 660 µm | 1:14.5 | 90°C | Inmersión 2:00 min, bajada controlada en 30s. |
| **AeroPress Go** | Cámara compacta (~220ml máx), menor tiempo | **580 µm** | 540 – 620 µm | 1:14.0 | 90°C | Extracción ágil para no saturar cuerpo. |
| **Chemex** | Cono ancho con filtro grueso de triple pliegue | **880 µm** | 820 – 950 µm | 1:16.0 | 94°C | Permite paso de agua sostenido sin retención excesiva. |
| **Prensa Francesa / Cupping** | Inmersión total sin filtro de celulosa | **1050 µm** | 950 – 1150 µm | 1:15.0 | 94°C | Malla metálica o rotura de costra a los 4:00 min. |

### 2.3 Moduladores Físicos por Naturaleza del Grano

1. **Proceso de Beneficio:**
   * **Lavado (Washed):** $\Delta = 0\ \mu\text{m}$. Fractura limpia, flujo uniforme, máxima acidez y brillo.
   * **Natural / Honey:** $\Delta = +30\ \mu\text{m}$. Apertura indispensable para compensar la alta producción de microfinos y azúcares residuales del secado con pulpa. Ratios más concentrados (1:15 a 1:15.5) y cero turbulencia agresiva.
   * **Anaeróbico / Maceración Carbónica / Co-fermentado:** $\Delta = +25\ \mu\text{m}$, Temp nominal $-2^\circ\text{C}$ (89–91°C). Grano ultra-soluble pre-digerido por microorganismos; evita sobre-extraer notas amargas, vinosas o alcohólicas.
2. **Nivel de Tueste:**
   * **Claro (Light / Cinnamon):** $\Delta = -20\ \mu\text{m}$, Temp $+2^\circ\text{C}$ (hasta 95–96°C). Grano denso, fractura dura; exige mayor superficie de contacto.
   * **Medio (Medium / City):** $\Delta = 0\ \mu\text{m}$, Temp nominal.
   * **Oscuro (Dark / French):** $\Delta = +40\ \mu\text{m}$, Temp $-3^\circ\text{C}$ (88–90°C). Grano poroso y quebradizo; requiere molienda abierta para evitar extracción de ceniza o carbón.
3. **Altitud de Cultivo:**
   * **Estrictamente Altura (>1650 msnm / SHB):** $\Delta = -10\ \mu\text{m}$, Temp $+1^\circ\text{C}$.
   * **Baja Altura (<1200 msnm):** $\Delta = +10\ \mu\text{m}$, Temp $-1^\circ\text{C}$.
4. **Días de Reposo y Desgasificación (CO₂):**
   * **< 7 días (Super fresco):** $\Delta = +15\ \mu\text{m}$. Bloom extendido a **55–60 segundos** con ratio de bloom 4:1 para evacuar la alta presión de gas antes de percolar.
   * **8 a 25 días (Ventana óptima):** $\Delta = 0\ \mu\text{m}$. Bloom estándar de 40–45s.
   * **> 40 días (Tueste maduro):** $\Delta = -15\ \mu\text{m}$, Temp $+1^\circ\text{C}$, bloom corto de 30s.
5. **Cava Congelada (-18°C):**
   * $\Delta = -15\ \mu\text{m}$. La fractura a baja temperatura es más elástica y estrecha, produciendo menos polvo residual.

---

## 3. Protocolos Dinámicos de Vertido y Válvula

### 3.1 NextLevel Pulsar Mini (Protocolo de 3 Fases)

1. **Fase 1: Saturación Estática / Bloom (Válvula CERRADA 100%)**
   * Verter 45g – 60g de agua (3x – 4x dosis) a través de la tapa dispersora.
   * Swirl muy suave en los primeros 10s si es necesario para asegurar humectación homogénea sin levantar la cama.
   * Mantener cerrada durante **45 a 60 segundos** según la desgasificación del grano.
2. **Fase 2: Percolación Continua (Válvula al 45% – 50% de flujo)**
   * Abrir la palanca a posición media (caudal objetivo ~2 a 2.5 ml/s).
   * Verter en 2 pulsos continuos y suaves sobre la ducha dispersora, manteniendo ~1 cm de columna de agua por encima del dispersor.
   * El caudal mecánico de la válvula evita que el lecho se compacte prematuramente.
3. **Fase 3: Drenaje y Cierre (Válvula 100% ABIERTA)**
   * Cuando el último vertido ingresa casi en su totalidad al café, abrir la válvula por completo para un drawdown plano y limpio.
   * **Tiempo total objetivo:** 3:15 a 3:45 min.

---

## 4. Matriz de Calibración Unificada de los 8 Molinos

| Molino | Espresso (260 µm) | AeroPress (620 µm) | V60 (720 µm) | **Pulsar Mini (780 µm)** | Chemex (880 µm) | Prensa (1050 µm) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Femobook A2** *(18µm/clic, 40 clics/rot)* | 8 – 14 clics | 48 – 54 clics | 58 – 65 clics | **64 – 72 clics** (~1.6–1.8 Rot.) | 72 – 82 clics | 85 – 100 clics |
| **1Zpresso J-Max** *(8.8µm/clic, 90 clics/rot)* | 1.1.0 – 1.4.5 | 1.8.5 – 2.1.0 | 2.2.0 – 2.4.0 | **2.3.5 – 2.5.5** (~212–230 clics) | 2.6.0 – 2.8.5 | 2.9.0 – 3.2.0 |
| **1Zpresso K-Ultra** *(20µm/clic, 100 clics/rot)* | 3.0 – 4.2 | 5.8 – 6.6 | 7.2 – 8.2 | **7.8 – 8.8** (78–88 clics) | 8.8 – 9.8 | 9.8 – 11.2 |
| **Comandante C40 MK4** *(~30µm/clic)* | 8 – 12 clics | 15 – 18 clics | 20 – 24 clics | **23 – 26 clics** | 25 – 28 clics | 28 – 34 clics |
| **Fellow Ode Gen 2** *(Planas 64mm Gen 2)* | N/A *(solo filtro)* | 2.2 – 3.2 | 3.2 – 4.5 | **4.1 – 5.1** | 5.2 – 7.0 | 7.2 – 9.2 |
| **Kingrinder K6** *(16µm/clic, 60 clics/rot)* | 20 – 36 clics | 68 – 80 clics | 85 – 100 clics | **95 – 108 clics** (1 Rot. 35–48 clics) | 108 – 125 clics | 125 – 145 clics |
| **Timemore C2/C3** *(Cónicas S2C 38mm)* | 7 – 9 clics | 12 – 15 clics | 16 – 20 clics | **18 – 21 clics** | 20 – 24 clics | 23 – 27 clics |
| **Baratza Encore / ESP** *(40 pasos dial)* | ESP 8 – 14 | 12 – 15 (ESP 22–25) | 14 – 17 (ESP 24–27) | **16 – 19** (ESP 26–29) | 20 – 24 (ESP 30–34) | 26 – 32 (ESP 36–40) |

---

## 5. Arquitectura de Implementación y Sincronización

### 5.1 Backend (`backend/aiEngine.js`)
* Actualizar funciones de conversión de micrones a clics (`micronsToFemobook`, `micronsToJMax`, `micronsToKUltra`, `micronsToOde`, `micronsToComandante`, `micronsToKingrinder`, `micronsToTimemore`, `micronsToBaratza`).
* Ajustar `computeOfflineRecipe`:
  - Nuevas bases de micrones (Pulsar Mini = 780 µm, V60 = 720 µm, AeroPress = 620 µm, Chemex = 880 µm, Prensa = 1050 µm).
  - Deltas moderados del grano (Tueste claro -20, oscuro +40, natural +30, anaeróbico +25).
  - Generación de pasos con modulación explícita de válvula para Pulsar Mini y alertas de desgasificación para granos recién tostados (<7 días).
* Inyectar esta matriz estricta en las directivas del *System Prompt* de Gemini, garantizando que el modelo devuelva el formato exacto del fabricante.

### 5.2 Frontend (`frontend/src/utils/grinders.js` & `famousRecipes.js`)
* Sincronizar las fórmulas de cálculo de micrones inversas y directas en `frontend/src/utils/grinders.js`.
* Unificar `parseGrindToMicrons` para que `pulsar` mapee a 780 µm.

### 5.3 Verificación Automatizada
* `scripts/test_pulsar_mini.mjs`: Test unitario específico que corrobora que para Pulsar Mini + Femobook A2 en cafés Lavados y Naturales, los clics estén estrictamente entre **64 y 72 clics**.
* `scripts/test_grinders_unification.mjs`: Validación de los 8 molinos en todos los métodos para asegurar que no se produzcan valores fuera de rango o NaN.
* `scripts/test_ai_reliability.mjs`: Validación de la respuesta de IA y cascada offline.
