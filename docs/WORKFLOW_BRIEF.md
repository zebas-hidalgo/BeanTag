# BeanTag — Brief y Proceso Estándar de Trabajo (SOP)

Documento vivo para estandarizar diseño, desarrollo, pruebas y despliegue de **BeanTag** (Web + API + App iOS Capacitor/Sideloadly).

---

## 1. Norte de Producto y Diseño (2027/2028)

- **Ritual principal (Intent-First):** `Abrir → Elegir → Preparar → Ajustar` en el menor número de toques posible.
- **Dirección visual:** *Warm Neo-Tactile Editorial*.
  - **Forma unificada:** Full-Pill (`var(--r-pill)`) en botones, chips, navegación y controles flotantes.
  - **Profundidad:** Elevación tonal (`--bg` → `--surface` → `--fill`) y sombras suaves sin doble borde.
  - **Tipografía:** `Bricolage Grotesque` con eje variable (`font-variation-settings: "opsz" 72`) para títulos + `Inter` para lectura + `JetBrains Mono` con `tabular-nums` para toda cifra.
  - **Temas:** Todo componente debe respetar los 6 temas activos (`Crema`, `Matcha`, `Gesha`, `Nórdico`, `Kissaten`, `Espresso`) y modo oscuro; **prohibido** hardcodear colores/glows `rgba(...)` fuera de tokens.
- **Principio técnico:** Solución mínima y limpia que resuelva el problema real (sin dependencias nuevas ni capas innecesarias).

---

## 2. Mapa Técnico Rápido

| Capa | Ubicación | Notas clave |
| :--- | :--- | :--- |
| **Tokens y Estilos** | `frontend/src/styles/tokens.css`, `barista-ui.css`, `index.css` | Tokens semánticos + utilidades `.bt-*`. |
| **Vistas Core** | `Inventory.jsx`, `BatchDetail.jsx`, `QuickBrewView.jsx`, `BrewGuideModal.jsx`, `BrewHistory.jsx` | Mobile-first (`390×844` iPhone). |
| **Hardware BLE Global** | `frontend/src/context/TimemoreScaleContext.jsx` | Instancia única compartida de Timemore Dot BLE (sin reconexiones entre vistas). |
| **Motor IA y API** | `backend/server.js`, `backend/aiEngine.js` | Cascada Gemini (`2.5-flash-lite` → `2.5-flash` → `3-flash-preview`) + Groq (`openai/gpt-oss-120b`). |
| **App iOS (Sideloadly)** | `frontend/ios/App/App/Info.plist`, `SceneDelegate.swift`, `.github/workflows/build-ios.yml` | Esquema `beantag://batch/<id>` para salto desde Safari iOS/NFC; `.ipa` sin firma generado por GitHub Actions. |
| **Producción (VPS)** | `5.189.152.68` · `/var/www/beantag` · `./deploy.sh` | PM2 proceso `beantag` en puerto `5000`; `.env` en `/var/www/beantag/backend/.env`. |

---

## 3. Proceso Estándar de Trabajo (5 Fases)

### Fase 1 · Definición (Antes de tocar código)
1. Definir el **objetivo en 1 frase** y la pantalla/flujo afectado.
2. Si hay ambigüedad de diseño o flujo, ejecutar **`/grill-me`** (decisiones una por una con opción recomendada).
3. Consultar especialistas solo cuando aporte valor real:
   - **Subagente Barista:** recetas, ratios, molienda/micras, capacidad física/bypass, pasos por método.
   - **Subagente UI / UX:** densidad visual en `390×844`, jerarquía, accesibilidad táctil y consistencia entre temas.

### Fase 2 · Reglas de Implementación (Anti-Bugs iOS / WebKit)
- **Elementos `position: fixed`** (barras sticky, modales): renderizar siempre con `createPortal(..., document.body)` si existe cualquier ancestro con `transform` o animación (`.animate-entrance`), y ocultarlos cuando haya un modal abierto.
- **Acordeones dentro de `<form>`:** usar estado React (`useState` + `<button type="button" aria-expanded>`) en vez de `<details>` nativo para evitar glitches de repaint y envíos accidentales en Safari iOS.
- **Ergonomía de barra (manos mojadas):** controles críticos del cronómetro `≥ 44px`; steppers numéricos en formato píldora compacta `[ − | + ]` (`.bt-stepper-pill`) sin aplastar las cifras.
- **Cálculo seguro:** sanear siempre `parseFloat(...) || fallback` antes de llamar `.toFixed()` o dividir.
- **Hooks de React:** declarar todos los hooks antes de cualquier `return null` temprano.

### Fase 3 · Verificación Obligatoria (Pre-Push)
Ejecutar según los archivos modificados:

```bash
# 1. Siempre (Frontend)
npm run build-frontend

# 2. Si se tocaron molinos, sensoryTuner o motor IA
node scripts/verify_grinders.mjs

# 3. Si se tocaron tarjetas, stickers o cardGenerator
node scripts/verify_cards_render.mjs

# 4. Si se tocó configuración iOS
plutil -lint frontend/ios/App/App/Info.plist
```

### Fase 4 · Commit, Push y Despliegue
1. **Commit convencional:** `feat(scope): ...`, `fix(scope): ...`, `refactor(scope): ...`, `chore(ci): ...`.
2. **Despliegue web + API:**
   ```bash
   git push origin main && ./deploy.sh
   ```
   Confirmar en la salida que el build en VPS terminó sin errores y `pm2` muestra `beantag` en estado **`online`**.
3. **Actualización de `.ipa` en iPhone (Sideloadly):**
   - **Cambios solo web/backend:** **no** requiere reinstalar el `.ipa` (la app carga la URL del VPS en vivo).
   - **Cambios en `frontend/ios/` o plugins Capacitor:** descargar el nuevo `BeanTag.ipa` desde GitHub Releases (`ios-latest`) e instalar con Sideloadly.

### Fase 5 · Smoke Test en iPhone (60 segundos)
- [ ] **Cava:** carga de lotes, tarjeta *Siguiente taza*, toggle *Buscar y filtrar*.
- [ ] **Ficha de Café:** stock + acciones en 1 fila, steppers `[ − | + ]`, *Empezar* sticky sin tapar *Registrar sin cronómetro* ni *Enlace NFC*.
- [ ] **Preparación Rápida:** foto/OCR, modo *Por tazas / Manual*, ajuste rápido post-taza y guardar en Mis Cafés.
- [ ] **Cronómetro:** inicio, toggle *Modo Barra OLED*, y conexión/tara BLE (si aplica).
- [ ] **Temas:** revisar al menos 1 tema claro (`Crema`/`Matcha`) y 1 oscuro (`Espresso`/`Kissaten`).

---

## 4. Plantilla de Brief para Nuevas Tareas (Copy-Paste)

```markdown
### Nueva Tarea / Mejora
- **Objetivo:** [Qué problema resuelve o qué mejora]
- **Pantalla(s):** [Cava / Ficha / Rápida / Cronómetro / Bitácora / Perfil / iOS]
- **Comportamiento esperado:** [Cómo debe verse y funcionar]
- **Restricciones / Notas:** [Ej. no tocar backend, respetar temas claros/oscuros, probar con J-Max]
- **¿Necesita `/grill-me` o subagente?** [Sí (UI / UX / Barista) / No, aplicar directo]
```
