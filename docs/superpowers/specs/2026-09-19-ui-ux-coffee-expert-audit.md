# ☕ Auditoría Integral de UI/UX & Sistema de Diseño "Precision Barista Tech"
**Proyecto**: BeanTag Specialty Coffee App  
**Fecha**: 19 de Septiembre, 2026  
**Audiencia Objetivo**: Baristas Profesionales, Tostadores y Entusiastas Avanzados de Café de Especialidad  
**Dirección Estética**: *Laboratorio de Precisión & Barista Tech* (Inspirado en Acaia, Decent Espresso y Fellow)  

---

## 1. Perfil del Usuario & Contexto Operacional de Barra

A diferencia de una app generalista, el usuario experto de BeanTag opera en un entorno físico de alta exigencia:
- **Distancia Visual**: El teléfono suele reposar sobre la mesada de café o el drip tray, a una distancia de **50 a 70 cm** con un ángulo oblicuo de visión.
- **Condiciones Táctiles**: Manos mojadas con gotas de agua caliente (88°C - 96°C), residuos de café molido, o una mano ocupada sosteniendo el portafiltro o la pava de cuello de cisne.
- **Presión Temporal / Flujo Activo**: Durante la extracción (pre-infusión, bloom, vertido continuo), cada segundo cuenta. No es viable buscar controles pequeños, descifrar textos diminutos o desplazarse (scroll) por pantallas largas mientras corre el cronómetro.
- **Demanda de Precisión**: Variables numéricas críticas (0.1g de café, 1°C de agua, 1 segundo de tiempo, micrones de molienda y ratios 1:X.X) requieren legibilidad instantánea sin ambigüedades.

---

## 2. Diagnóstico Heurístico & Inventario de Inconsistencias Actuales

### 2.1 Botones y Targets Táctiles (Severidad: 🔴 ALTA)
| Pantalla / Componente | Elemento Actual | Estado en Código | Problema Ergonómico |
| :--- | :--- | :--- | :--- |
| **Inventory.jsx** | Botón menú contextual (3 puntos) | `width: 28px, height: 28px` (L398) | **Infracción crítica de tamaño táctil**. El estándar (Apple HIG / Android Material) exige 44-48px. En barra con dedos húmedos provoca toques fallidos o clics involuntarios en la tarjeta. |
| **RecipeForm.jsx** | Steppers de dosis / ratio / temp | `minHeight: 28px`, `padding: 2-4px` (L509) | Botones `+` y `-` demasiado pequeños; requieren precisión milimétrica incompatible con la velocidad de preparación. |
| **BatchDetail.jsx** | Botón "Repetir Última Receta" | `padding: 6px, fontSize: 10px` (L1560) | Una acción primaria de barista está relegada a un micro-botón con padding insuficiente y texto minúsculo. |
| **App.jsx** | Modal eliminar lote | `<button className="candy-input">` (L517) | **Deuda técnica**. Se utiliza una clase de input (`candy-input`) sobre una etiqueta `<button>`, causando inconsistencia en estados `:hover` y `:active`. |
| **Global** | Mezcla de estilos de botón | `btn-candy`, `bento-btn`, `cupertino-segmented-btn` | No existe un sistema semántico unificado (`Primary`, `Secondary`, `Surface`, `Danger`, `Ghost`). |

### 2.2 Tipografía y Legibilidad (Severidad: 🔴 ALTA)
| Hallazgo | Ubicación en Código | Impacto en Barra |
| :--- | :--- | :--- |
| **Micro-etiquetas ilegibles (9px - 10px)** | `RecipeForm.jsx` L528, L529, L530, L544 (`fontSize: '9px'`) | Imposible de leer a más de 30 cm de distancia bajo la iluminación de una cafetería o cocina. |
| **Falta de números monoespaciados grandes** | Entradas de dosis y tiempo en recetas | Los números cambian de ancho al escribirse o incrementarse, generando parpadeos y fatiga visual al calibrar moliendas y ratios. |
| **Jerarquía desordenada en títulos** | `BatchDetail.jsx` y `Inventory.jsx` | Mezcla de `SF Pro Display`, `Outfit`, `Space Grotesk` y `Playfair Display` sin reglas claras de aplicación semántica. |

### 2.3 Paleta de Colores & Contraste (Severidad: 🟡 MEDIA-ALTA)
| Hallazgo | Ubicación en Código | Impacto |
| :--- | :--- | :--- |
| **Fondo rígido en BottomNav** | `BottomNav.jsx` L20 (`background: rgba(255,255,255,0.95)`) | Barra inferior con fondo blanco fijo que deslumbra o genera conflicto con el Dark Mode. |
| **Acentos desvinculados del mundo cafetero** | `index.css` (temas `cyber`, `sakura`, `matcha`) | Demasiadas variaciones superfluas sin un estándar semántico centrado en extracción (sweet spot, sobre/sub-extracción, cava criogénica). |
| **Tokens hardcodeados** | `#A7F3D0` en `BottomNav.jsx:24`, `#059669` en `App.jsx:490` | Rompen la reactividad de variables CSS y dificultan mantener un tema homogéneo. |

### 2.4 Márgenes, Espaciado & Elevación (Severidad: 🟡 MEDIA)
| Hallazgo | Ubicación en Código | Impacto |
| :--- | :--- | :--- |
| **Gaps arbitrarios** | `gap: 6px`, `gap: 14px`, `gap: 10px` | Rompe el ritmo modular de múltiplos de 4/8pt. |
| **Sombras desfasadas estilo cómic** | `boxShadow: 3px 3px 0px var(--border-color)` | Choca visualmente con la sobriedad y elegancia técnica requerida por el experto cafetero. |
| **Padding perimetral variable** | Tarjetas con `8px`, modales con `20px`, vistas con `16px` | Sensación de interfaz construida por partes no coordinadas. |

---

## 3. Especificación del Sistema de Diseño: "Precision Barista Tech"

### 3.1 Design Tokens (Tokens CSS Normalizados)

```css
:root {
  /* 🌑 Fondos & Superficies de Laboratorio (Dark Mode OLED por defecto) */
  --barista-bg-canvas: #090D14;      /* Negro Pizarra profundo para ahorro OLED y máximo contraste */
  --barista-bg-surface: #0F172A;     /* Superficie primaria de tarjetas y paneles */
  --barista-bg-elevated: #1E293B;    /* Superficie interactiva elevada (hover / modales) */
  --barista-bg-subtle: rgba(30, 41, 59, 0.5); /* Contenedores de datos secundarios */

  /* ☕ Acentos Semánticos de Café de Especialidad */
  --barista-accent-honey: #D97706;   /* Ámbar Miel Tostado: CTAs principales, dosis de café, estado activo */
  --barista-accent-honey-hover: #B45309;
  --barista-accent-honey-glow: rgba(217, 119, 6, 0.2);

  --barista-accent-mint: #10B981;    /* Verde Menta / Sweet Spot: Ratios óptimos, receta balanceada, notas SCA */
  --barista-accent-mint-subtle: rgba(16, 185, 129, 0.12);

  --barista-accent-cryo: #38BDF8;    /* Cian Criogénico: Cava de tubos a -18°C, nitrógeno, lote congelado */
  --barista-accent-cryo-subtle: rgba(56, 189, 248, 0.12);

  --barista-accent-danger: #EF4444;  /* Rojo Alerta: Sobre-extracción amarga, stock agotado, eliminar */
  --barista-accent-danger-subtle: rgba(239, 68, 68, 0.12);

  /* ✍️ Tipografía & Escala de Contraste WCAG AAA */
  --barista-text-primary: #F8FAFC;   /* Blanco óptico puro para datos numéricos y títulos */
  --barista-text-secondary: #94A3B8; /* Gris pizarra legible para descriptores y metadatos */
  --barista-text-muted: #64748B;     /* Gris tenue para unidades métricas secundarias */
  --barista-text-disabled: #475569;

  /* 📐 Hairlines & Bordes de Precisión */
  --barista-border-hairline: rgba(148, 163, 184, 0.14); /* 0.75px a 1px para separación limpia */
  --barista-border-active: rgba(217, 119, 6, 0.45);
  --barista-border-focus: #D97706;

  /* 🔲 Radios de Borde (Consistencia Geométrica) */
  --barista-radius-xs: 4px;   /* Micro-badges, chips métricos */
  --barista-radius-sm: 8px;   /* Botones secundarios, inputs */
  --barista-radius-md: 12px;  /* Botones primarios, steppers, tarjetas de datos */
  --barista-radius-lg: 16px;  /* Tarjetas principales de lote, modales */
  --barista-radius-pill: 9999px; /* Badges de stock, cápsulas de estado */

  /* 📏 Escala de Espaciado 8pt */
  --barista-space-2: 2px;
  --barista-space-4: 4px;
  --barista-space-8: 8px;
  --barista-space-12: 12px;
  --barista-space-16: 16px;
  --barista-space-20: 20px;
  --barista-space-24: 24px;
  --barista-space-32: 32px;

  /* ⚡ Micro-Sombras y Elevación Técnica (Sin desfases tipo cómic) */
  --barista-shadow-card: 0 4px 16px -2px rgba(0, 0, 0, 0.5), 0 0 0 1px var(--barista-border-hairline);
  --barista-shadow-elevated: 0 10px 30px -4px rgba(0, 0, 0, 0.7), 0 0 0 1px var(--barista-border-hairline);
  --barista-shadow-honey: 0 4px 14px var(--barista-accent-honey-glow);
}
```

---

### 3.2 Escala Tipográfica de Precisión

| Nivel | Fuente | Tamaño | Peso | Interletraje | Uso en BeanTag |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display Metric** | JetBrains Mono | **28px** | 800 (Bold) | `-0.03em` | Lecturas críticas en vivo: Gramos dosis (`15.0 g`), Segundos (`2:45`), Micrones (`~650 µm`). |
| **Title Primary** | Inter / SF Pro | **18px** | 700 (Bold) | `-0.015em` | Nombres de café en catálogo y encabezados de pantalla. |
| **Title Section** | Inter / SF Pro | **14px** | 700 (Bold) | `+0.04em` | Secciones de bento: `MÉTRICAS DE EXTRACCIÓN`, `TERROIR & ORIGEN`. |
| **Body Regular** | Inter / SF Pro | **13.5px**| 500 (Medium)| `normal` | Notas de cata completas, historial de extracciones. |
| **Caption / Label** | Inter / SF Pro | **12px** | 600 (Semibold)| `+0.02em` | **Límite mínimo de legibilidad**. Etiquetas de formulario (sustituye las de 9px). |
| **Mono Badge** | JetBrains Mono | **11px** | 700 (Bold) | `+0.05em` | Insignias técnicas: `SCA 89.5★`, `J-MAX 2.4.0`, `1:16.0`. |

---

### 3.3 Sistema de Botones & Targets Táctiles (4 Niveles)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. BOTÓN PRIMARIO (CTA de Barra)                            │
│ Altura: 48px | Fondo: #D97706 (Ámbar) | Texto: #000 800     │
│ [ ☕ INICIAR PREPARACIÓN ]                                   │
├─────────────────────────────────────────────────────────────┤
│ 2. BOTÓN SECUNDARIO / SUPERFICIE                            │
│ Altura: 44px | Fondo: #1E293B | Borde: 1px hairline | #FFF │
│ [ ⚖️ Calcular Ratio ]                                        │
├─────────────────────────────────────────────────────────────┤
│ 3. STEPPER TÁCTIL DEDICADO                                  │
│ Dimensión: 44x44px | Centro: #0F172A | Háptica: scale(0.96) │
│ [  -  ]       15.0 g       [  +  ]                          │
├─────────────────────────────────────────────────────────────┤
│ 4. STICKY MOBILE BOTTOM BAR                                 │
│ Barra fija a 16px del borde inferior con CTA siempre visible│
│ [ 💾 GUARDAR RECETA (1 tubo) ]                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Comparativa de Componentes: "Antes vs Después"

### Componente 1: Tarjeta de Lote en Inventario
- **Antes**:
  - Botón de 3 puntos diminuto (`28x28px`).
  - Textos apretados con truncamiento agresivo.
  - Sombra cómic desfasada `3px 3px 0px`.
- **Después**:
  - Target de acción rápida aumentado a **44x44px** (área de clic táctil real con padding transparente).
  - Título con peso 700 de 16.5px y píldora de stock en Cava Criogénica (`❄️ 6 TUBOS`) en tipografía monoespaciada de alto contraste.
  - Borde hairline de 1px a 14% de opacidad y micro-elevación limpia.

### Componente 2: Formulario de Métricas de Extracción (`RecipeForm.jsx`)
- **Antes**:
  - Etiquetas diminutas de **9px** (`Balance Sensorial`, `Cuerpo`, `Nivel de Extracción`).
  - Botones de selección de 28-30px de alto.
  - Scroll vertical necesario para alcanzar el botón final de guardar.
- **Después**:
  - Etiquetas normalizadas a **12px** en mayúsculas técnicas legibles a 60 cm.
  - Steppers de dosis, temperatura y ratio de **44x44px**, operables con un solo dedo.
  - **Sticky Bottom Bar** flotante fija en pantalla: el barista puede pulsar "Guardar Receta" en cualquier momento sin tener que scrollear.

---

## 5. Roadmap Priorizado de Refactorización

1. **Fase 1: Tokens & Fundaciones** (Base global en `index.css`)
   - Incorporación de tokens `--barista-*`.
   - Normalización de fuentes (Inter + JetBrains Mono).
   - Clases maestras de botones (`btn-primary`, `btn-secondary`, `btn-stepper`, `btn-ghost`).
2. **Fase 2: Rediseño de Pantallas Críticas**
   - Refactor de `RecipeForm.jsx` (steppers 44px, eliminación de etiquetas 9px, Sticky Bar).
   - Refactor de `Inventory.jsx` (tarjetas limpias, target de opciones a 44px, píldoras de stock claras).
   - Refactor de `BatchDetail.jsx` (dosis, visualización de recetas previas y sommelier).
3. **Fase 3: Navegación & Ergonomía**
   - Refactor de `BottomNav.jsx` con fondo adaptativo oscuro en Dark Mode y tokens semánticos.
   - Verificación de contraste en todas las pantallas con herramientas automatizadas.

---

## 6. Criterios de Aceptación & Verificación

1. **Cumplimiento WCAG AAA**: Todo texto sobre fondo oscuro debe mantener un ratio de contraste de al menos `7:1` para texto normal y `4.5:1` para texto grande/numérico.
2. **Ergonomía Táctil**: Cero botones interactivos por debajo de `44x44px` en viewport móvil.
3. **Escala Tipográfica**: Ningún elemento de texto en toda la aplicación podrá tener un `font-size` inferior a `11px` (microbadges) o `12px` (etiquetas de formulario).
4. **Cero Clases Obsoletas**: Eliminación definitiva de las clases heredadas `btn-candy`, `candy-card`, `candy-input` en favor de la nomenclatura semántica del sistema `barista-*`.
