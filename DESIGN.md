# 🎨 BeanTag — Design System & Craft Guidelines (V4)
> Documented under the [Impeccable](https://github.com/pbakaus/impeccable) & [UI/UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) standards.

## 1. Aesthetic Identity: Nature Distilled & Technical OLED
BeanTag combina dos universos:
- **La Calidez Orgánica del Café de Especialidad:** Terracota quemada, arenas suaves, cremas y notas miel.
- **La Precisión Quirúrgica del Laboratorio Barista:** Negro OLED puro (#000000), tipografía monoespaciada para datos técnicos y diagramas vectoriales limpios.

---

## 2. Color Palette & Semantic Tokens

### 2.1 Tokens Globales
```css
:root {
  /* Lienzo y Superficies */
  --bg-canvas: #F8F9FA;
  --bg-surface: #FFFFFF;
  --bg-elevated: #F1F3F5;
  --bg-subtle: rgba(241, 245, 249, 0.85);

  /* Texto */
  --text-primary: #09090B;
  --text-secondary: #52525B;
  --text-muted: #71717A;

  /* Identidad & Acentos */
  --accent-terracotta: #C2410C;
  --accent-honey: #D97706;
  --accent-mint: #10B981;
  --accent-cryo: #0284C7;
  --accent-danger: #EF4444;

  /* Estados de Válvula NextLevel Pulsar Mini */
  --valve-closed: #EF4444;   /* Inmersión estática */
  --valve-half: #F59E0B;     /* 50% Caudal controlado */
  --valve-open: #10B981;     /* Drawdown / caída libre */

  /* Bordes y Separadores */
  --border-subtle: rgba(0, 0, 0, 0.08);
  --border-strong: rgba(0, 0, 0, 0.16);
  --border-focus: #C2410C;
}

/* Modo Oscuro True OLED (Pitch Black) */
[data-theme="dark"],
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]):not([data-theme="studio"]):not([data-theme="kissaten"]) {
    --bg-canvas: #000000;
    --bg-surface: #121214;
    --bg-elevated: #1C1C1E;
    --bg-subtle: rgba(255, 255, 255, 0.06);

    --text-primary: #F4F4F5;
    --text-secondary: #A1A1AA;
    --text-muted: #8E8E93;

    --accent-terracotta: #F97316;
    --accent-honey: #FBBF24;

    --border-subtle: rgba(255, 255, 255, 0.12);
    --border-strong: rgba(255, 255, 255, 0.24);
  }
}
```

---

## 3. Typography & Modular Scale

### 3.1 Familias Tipográficas
- **Titulares & Editorial:** `Outfit`, `-apple-system`, `sans-serif` (Carácter geométrico amigable).
- **Cuerpo & Formularios:** `Inter`, `-apple-system`, `sans-serif` (Claridad suiza, alta legibilidad).
- **Métricas, Cronómetros y Diales:** `JetBrains Mono`, `SF Mono`, `monospace` (Tabular numbers obligatorios).

### 3.2 Escala Modular (Ratio 1.250 - Major Third)
- **Timer Gigante:** `clamp(2.8rem, 11vw, 4.2rem)` — *Legible a 1 metro de distancia*.
- **Display XL (25px):** Nombres de cafés y orígenes principales.
- **Heading L (20px):** Secciones de configuración y nombres de métodos.
- **Body Regular (16px):** Textos descriptivos, pasos de vertido.
- **Body Small (14px):** Etiquetas secundarias, notas sensoriales.
- **Caption (12px):** Metadatos de molienda y fecha de tueste (mínimo absoluto permitido).

---

## 4. Layout, Spacing & Touch Ergonomics

### 4.1 Sistema Espacial de 8 Puntos
Todos los márgenes y paddings deben ser múltiplos de 4px o 8px:
- `4px` (Micro gap)
- `8px` (Espaciado interno entre elementos hermanos)
- `12px` (Padding interno compacto)
- `16px` (Padding estándar de tarjetas)
- `24px` (Separación entre secciones)
- `32px` (Márgenes de pantalla)

### 4.2 Regla de los 44x44px (Barista Touch Standard)
- Todo elemento accionable (botones, chips seleccionables, botones de incremento `+` y `-`, ranuras de tubos) DEBE tener una caja de colisión de al menos **44x44 píxeles**.
- Separación mínima entre botones adyacentes: **8px**.

### 4.3 Thumb-Zone Optimization
- Los botones primarios de acción (ej. *"Iniciar Extracción"* o *"Guardar Lote"*) se ubican en la parte inferior de la pantalla mediante una barra fija flotante (*Sticky Bar*), accesible con una sola mano sin forzar el agarre.

---

## 5. Micro-Interactions & Sensory Feedback
- **Retroalimentación Háptica:**
  - `navigator.vibrate(6)` al pulsar pestañas y botones segmentados.
  - `navigator.vibrate(12)` al completar un vertido o cambiar de fase de válvula.
  - `navigator.vibrate([20, 50, 20])` en alertas de extracción o errores.
- **Transiciones:**
  - Rápidas y naturales: `150ms cubic-bezier(0.4, 0, 0.2, 1)`.
  - Expansión de modales tipo Cupertino sheet: `cubic-bezier(0.32, 0.72, 0, 1)`.
- **Accesibilidad de Movimiento:**
  - `@media (prefers-reduced-motion: reduce)` debe desactivar oscilaciones y zooms bruscos.

---

## 6. Anti-Patrones Prohibidos (Eliminando "AI-Slop")
❌ **NUNCA usar estilos inline `style={{...}}` para reglas repetitivas:** Utilizar clases semánticas reutilizables.  
❌ **NUNCA usar emojis como íconos principales de la interfaz:** Usar íconos SVG de `lucide-react` con trazo uniforme (1.8 a 2.4).  
❌ **NUNCA usar border-radius aleatorios:** Apegarse estrictamente a `--radius-sm (8px)`, `--radius-md (12px)`, `--radius-lg (16px)` o `--radius-pill (9999px)`.  
❌ **NUNCA permitir texto con contraste inferior a 4.5:1** en información de molienda o balanza.  
