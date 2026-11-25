# BeanTag — Design System & Art Direction (V6 · 2027/2028)

> **Fuente de verdad completa (Logo, Comité de Subagentes y SOP):** [docs/BEANTAG_MASTER_BRIEF.md](./docs/BEANTAG_MASTER_BRIEF.md) · **Guía operativa:** [docs/WORKFLOW_BRIEF.md](./docs/WORKFLOW_BRIEF.md).

---

## 1. Dirección Artística: *Warm Neo-Tactile Editorial*
BeanTag combina la calidez táctil de tostadores de especialidad (Tokio, Copenhague, Melbourne) con la claridad instrumental de una barra profesional:
- **Elevación tonal sin ruido de bordes:** jerarquía por superficies (`--bg` → `--surface` → `--fill`), eliminando "cajas dentro de cajas" y sombras con doble trazo.
- **Gramática Full-Pill orgánica:** `var(--r-pill)` (`9999px`) unificado en botones primarios, secundarios, FAB, chips de estado y barra de navegación flotante.
- **Liquid Glass quirúrgico:** desenfoque con brillo especular superior (`inset 0 1px 0 var(--glass-edge)`) solo en chrome flotante (`.bt-nav`, `.bt-sticky-cta`, `.app-header` sin línea inferior dura).
- **Color dictado por el grano:** auras sutiles (`8–10%`) según el nivel de tueste (`Claro #C98A3E`, `Medio #8E5226`, `Oscuro #4B2A1A`) y notas de cata con colores semánticos SCA (`getScaColorForNote`).
- **Modo Barra OLED bajo demanda:** `BrewGuideModal` respeta el tema activo e incluye un toggle de 1 toque a `.mode-barra` oscuro OLED.

---

## 2. Identidad y Logo Oficial (`BeanTag 2028`)
- **Archivos:** `frontend/public/logo.svg`, `frontend/public/logo-512.png`, `frontend/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` (`1024×1024` RGB sin alfa).
- **Símbolo:** grano de café cereza (`#C23B22`) inclinado `-28°` con surco en S y punto superior NFC/etiqueta en crema (`#FBFAF8`).
- **Iconografía:** `lucide-react` + 13 iconos SVG vectoriales propios en `frontend/src/components/icons/CoffeeIcons.jsx` (sin emojis en UI interactiva).

---

## 3. Tipografía y Escala
- **Display Editorial:** `Bricolage Grotesque` con eje óptico variable (`font-variation-settings: "opsz" 72`, tracking `-0.03em`).
- **Editorial Serif (Tarjetas):** `Playfair Display` en estilos exportables *Kissa*, *Cerámica* y *Collage*.
- **Lectura & UI:** `Inter`.
- **Datos e Instrumentación:** `JetBrains Mono` con `font-variant-numeric: tabular-nums` obligatorio en toda cifra (tiempo, peso, dosis, ratio, clics, micras, SCA).

---

## 4. Temas (17) y Tarjetas Exportables (8)
- **Tokens y paletas:** definidos en `frontend/src/styles/tokens.css` y registrados en `frontend/src/utils/theme.js` (**Automático**, **Crema**, **Terracota**, **Matcha Uji**, **Sakura**, **Yuzu Crema**, **Lavanda**, **Porcelana**, **Gesha Floral**, **Nórdico**, **Tueste**, **Bosque**, **Cobre**, **Borgoña**, **Medianoche**, **Kissaten**, **Espresso OLED**).
- **Regla de tokens:** prohibido hardcodear glows o acentos `rgba(...)` fuera de variables CSS.
- **Tarjetas PNG/Sticker (`stickerCards.js` / `storyCards.js`):** `Kissa`, `Cerámica`, `Botánico`, `Etiqueta`, `Origen`, `Tipográfica`, `Collage`, `Lata` (verificadas con `node scripts/verify_cards_render.mjs`).

---

## 5. Ergonomía Móvil y Reglas WebKit / iOS
- **Viewport base:** iPhone `390×844` con operación a una mano.
- **Manos mojadas en barra:** controles críticos del cronómetro `≥ 44px`; steppers compactos unidos `[ − | + ]` (`.bt-stepper-pill`) debajo o al costado sin aplastar cifras.
- **Thumb-Zone CTA:** botón principal *Empezar* flotante mediante `createPortal(..., document.body)` (`.bt-sticky-cta`) para evitar bugs de `position: fixed` dentro de contenedores con `transform` en Safari iOS.
- **Acordeones en formularios:** usar estado React (`useState` + `<button type="button" aria-expanded>`) en vez de `<details>` nativo dentro de `<form>`.
