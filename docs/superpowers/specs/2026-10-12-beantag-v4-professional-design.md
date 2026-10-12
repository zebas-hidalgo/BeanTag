# Especificación de Diseño: BeanTag v4 Profesional
**Fecha**: 2026-10-12  
**Estado**: Validado y Aprobado  
**Objetivo**: Elevar la aplicación a la versión **v4 Profesional** garantizando:
1. **Precisión Física y Validación de Recetas**: Rigor de extracción SCA, consistencia matemática de vertidos y calibración exacta para los 8 molinos soportados (en motor IA, motor offline y recetas famosas).
2. **Jerarquía Tipográfica y Contraste Universal (WCAG AAA)**: Legibilidad absoluta en modo claro, modo oscuro OLED (#000000) y los 6 temas de especialidad, eliminando colores fijos y tokens inconsistentes.

---

## 1. Arquitectura y Física de Recetas Generadas

### 1.1 Matriz de Calibración de los 8 Molinos Soportados
BeanTag v4 soporta de manera nativa y homogénea los siguientes molinos de especialidad:

| ID Interno | Nombre Comercial | Geometría de Muelas | Especificación de Paso / Clic |
| :--- | :--- | :--- | :--- |
| `femobook` / `femobook_a2` | Femobook A2 | Cónica 40mm | 18 µm / clic (40 clics/rotación) |
| `jmax` | 1Zpresso J-Max | Cónica 48mm Titanio | 8.8 µm / clic (90 clics/rotación, 10 clics/número) |
| `k_ultra` | 1Zpresso K-Ultra | Cónica 48mm Heptagonal | 20 µm / clic (100 clics/rotación, 10 clics/número) |
| `ode_gen2` | Fellow Ode Gen 2 | Plana 64mm Gen 2 | 35 µm / micropaso (~0.1 dial) • No apto para espresso |
| `comandante` | Comandante C40 MK4 | Cónica 39mm Nitro Blade | ~30 µm / clic |
| `kingrinder` / `kingrinder_k6` | Kingrinder K6 | Cónica 48mm Heptagonal | 16 µm / clic (60 clics/rotación) |
| `timemore` | Timemore C2/C3 | Cónica 38mm | ~28 µm / clic |
| `baratza` | Baratza Encore / ESP | Cónica 40mm M2 | ~35 µm / paso (1-40) |

### 1.2 Reglas Físicas de Normalización en Backend (`backend/aiEngine.js` y `backend/server.js`)
Para cualquier receta generada por **Gemini AI** o por el **motor offline (`computeOfflineRecipe`)**:
1. **Consistencia de Agua**:
   * $\text{water\_total\_g} = \sum_{p \in \text{pours}} p.\text{water\_g}$. Si hay discrepancia por redondeo de la IA, el último vertido de drenaje se reajusta automáticamente para cuadrar exactamente con el total.
2. **Salvaguardas de Extracción por Método**:
   * **NextLevel Pulsar Mini (Cero-Bypass)**:
     * La granulometría nunca podrá ser inferior a $740\,\mu\text{m}$ (evita colapso del lecho cilíndrico de 45mm y compactación de filtro).
     * Los vertidos deben contener la asignación de válvula de 3 fases: `closed` (bloom e inmersión), `half` (percolación regulada ~2 ml/s), y `open` (caída libre y secado de lecho).
   * **AeroPress Go**:
     * Capacidad física de la cámara limitada a $\le 215$g de agua. Si la dosis calculada supera este valor, se fija en 210g y se recalcula el ratio.
   * **Espresso**:
     * Fellow Ode Gen 2 debe marcarse explícitamente como `"No apto para espresso"`.
3. **Normalización de Todos los Molinos**:
   * El objeto `grinders` contendrá siempre las 8 claves normalizadas: `femobook_a2`, `jmax`, `k_ultra`, `ode_gen2`, `comandante`, `kingrinder_k6`, `timemore`, `baratza`.

### 1.3 Recetas Famosas (`frontend/src/utils/famousRecipes.js`)
* Cada una de las 8 recetas legendarias (Tetsu Kasuya 4:6, James Hoffmann Ultimate V60, 10 Vertidos Micro, Lance Hedrick 1-2 Pour, Turbo Shot 6 Bar, Campeón AeroPress Inverted, AeroPress Go Travel, Scott Rao Pulsar Mini, Jonathan Gagné High Extraction, Pulsar Mini Concentrado) incluirá la configuración de los **8 molinos** calculada a partir de su `grindMicrons`.

---

## 2. Sistema de Diseño Tipográfico y Contraste Adaptativo v4

### 2.1 Principios de Contraste y Accesibilidad (WCAG AAA)
* **Texto Primario**: Ratio de contraste $\ge 7:1$ (mínimo legal $4.5:1$).
  * Modo claro: `#000000` o `#0F172A` sobre canvas `#F2F2F7` / `#FFFFFF`.
  * Modo oscuro OLED: `#FFFFFF` sobre canvas `#000000` / tarjeta `#121214`.
* **Texto Secundario**: Ratio de contraste $\ge 4.5:1$ (mínimo legal $3:1$).
  * Modo claro: `#475569` / `#64748B`.
  * Modo oscuro OLED: `#D4D4D8` / `#A1A1AA`.
* **Metadatos y Etiquetas Suaves**:
  * Modo claro: `#8E8E93`.
  * Modo oscuro OLED: `#A1A1AA`.

### 2.2 Tokens Semánticos de Badges y Estados en `frontend/src/index.css`
Se definen variantes de tema adaptativas para evitar fondos pastel cegadores en modo oscuro:

```css
/* Modo Claro (Predeterminado) */
:root {
  --barista-accent-mint-bg: #D1FAE5;
  --barista-accent-mint-text: #065F46;
  --barista-accent-honey-bg: #FEF3C7;
  --barista-accent-honey-text: #92400E;
  --barista-accent-danger-bg: #FEE2E2;
  --barista-accent-danger-text: #991B1B;
  --barista-accent-cryo-bg: #E0F2FE;
  --barista-accent-cryo-text: #0369A1;
}

/* Modo Oscuro OLED (#000000) */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]):not([data-theme="espresso"]):not([data-theme="matcha"]):not([data-theme="cyber"]):not([data-theme="sakura"]):not([data-theme="caramel"]):not([data-theme="frost"]) {
    --barista-accent-mint-bg: rgba(16, 185, 129, 0.18);
    --barista-accent-mint-text: #34D399;
    --barista-accent-honey-bg: rgba(245, 158, 11, 0.18);
    --barista-accent-honey-text: #FBBF24;
    --barista-accent-danger-bg: rgba(239, 68, 68, 0.18);
    --barista-accent-danger-text: #F87171;
    --barista-accent-cryo-bg: rgba(56, 189, 248, 0.18);
    --barista-accent-cryo-text: #38BDF8;
  }
}

[data-theme="dark"] {
  --barista-accent-mint-bg: rgba(16, 185, 129, 0.18) !important;
  --barista-accent-mint-text: #34D399 !important;
  --barista-accent-honey-bg: rgba(245, 158, 11, 0.18) !important;
  --barista-accent-honey-text: #FBBF24 !important;
  --barista-accent-danger-bg: rgba(239, 68, 68, 0.18) !important;
  --barista-accent-danger-text: #F87171 !important;
  --barista-accent-cryo-bg: rgba(56, 189, 248, 0.18) !important;
  --barista-accent-cryo-text: #38BDF8 !important;
}
```

### 2.3 Refactorización de Componentes de Frontend
* **`BrewHistory.jsx`**:
  * Eliminar `#4A5568` en fechas y metadatos -> usar `var(--color-text-muted)`.
  * Eliminar `#E2E8F0` en bordes -> usar `var(--border-color)`.
  * Usar `--barista-accent-*-bg` y `--barista-accent-*-text` en los chips sensoriales (`Balance`, `Cuerpo`, `Extracción`).
* **`BatchDetail.jsx`**:
  * Sustituir chips duros (`#DBEAFE`, `#FEF3C7`, `#E0F2FE`, `#FEE2E2`) en la tarjeta de recomendación de IA por variables semánticas.
  * Sustituir badges de válvulas (`#FED7D7`, `#C6F6D5`, `#FEFCBF`) por tokens temáticos.
  * Mejorar el mapeo en `handleApplyAiRecipe` para leer sin fallos tanto nombres con sufijo (`femobook_a2`, `kingrinder_k6`) como sin sufijo (`femobook`, `kingrinder`).
* **`DialInTimeline.jsx`**:
  * Asegurar contraste de conectores de línea de tiempo y chips de parámetros en modo oscuro.

---

## 3. Plan de Verificación y Criterios de Aceptación
1. **Tests Automatizados**:
   * Pruebas de físicas de escalado de dosis y molienda: `node scripts/test_dose_grind_scaling.mjs`.
   * Pruebas de integración E2E del backend y normalización de IA: `node scripts/test_ai_endpoint_e2e.mjs`.
   * Pruebas de renderizado de tarjetas y stickers: `node scripts/verify_cards_render.mjs` (32/32 tests).
   * Pruebas de linaje cronológico: `node scripts/test_dialin_timeline.mjs`.
2. **Compilación Frontend**:
   * `npm --prefix frontend run build` con código de salida 0.
3. **Despliegue y Verificación en Producción**:
   * Despliegue en VPS `5.189.152.68` con `pm2 reload beantag`.
   * Verificación de respuesta HTTP 200 OK en `https://5.189.152.68.nip.io/beantag/`.
