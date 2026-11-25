# BeanTag — Product Specification & North Star (V6 · 2027/2028)

> **Biblia de Marca y Comité de Subagentes:** [docs/BEANTAG_MASTER_BRIEF.md](./docs/BEANTAG_MASTER_BRIEF.md) · **Proceso estándar (SOP):** [docs/WORKFLOW_BRIEF.md](./docs/WORKFLOW_BRIEF.md).

---

## 1. Visión y Ritual Norte (*Intent-First*)
**BeanTag** es el copiloto móvil-first para baristas de especialidad, coleccionistas de café y cafeterías que buscan unir rigor físico de extracción con estética artesanal sin fricción.

**Ritual principal:** `Abrir → Elegir → Preparar → Ajustar`

---

## 2. Módulos y Capacidades Actuales
1. **Cava *Intent-First* (`Inventory.jsx` + `TubeRacksView.jsx`):**
   - Tarjeta superior **Siguiente taza / Retomar** con inicio en 1 toque y filtros/buscador colapsados por defecto (*Progressive Disclosure*).
   - Gestión de bolsas (`g` restantes con barra visual) y portatubos criogénicos (`-18°C`) con cálculo de curvas de desgasificación por tueste.
2. **Ficha Editorial de Café (`BatchDetail.jsx` + `BatchHeaderCard.jsx`):**
   - Ficha técnica limpia (`Origen`, `Variedad`, `Proceso`, `Altitud`, `Tostado`), notas de cata SCA con color semántico, stock y acciones en 1 fila.
   - Calibración física en micras ($D_{50}$) sincronizada entre **8 molinos** (`1Zpresso J-Max`, `K-Ultra`, `Fellow Ode Gen 2`, `Comandante C40`, `Femobook A2`, `Kingrinder K6`, `Timemore C2/C3`, `Baratza Encore/ESP`).
   - CTA sticky al pulgar para lanzar el cronómetro + registro manual plegado.
3. **Preparación Rápida con IA (`QuickBrewView.jsx` + `aiEngine.js`):**
   - Escaneo de foto de bolsa/tarjeta (OCR) + recomendación de receta con dosis optimizada al mínimo consumo mediante cascada **Gemini** (`2.5-flash-lite` → `2.5-flash` → `3-flash-preview`) + **Groq** (`openai/gpt-oss-120b`) y fallback físico offline.
   - Salida **Por tazas (200 ml)** o **Manual (ml / g)** con control de capacidad física de cámara y receta concentrada + **Bypass** automático (AeroPress Go `210 ml`, AeroPress `250 ml`, Pulsar Mini `400 ml`).
   - Preparación previa *Antes de 0:00*, pasos detallados con técnica por método y válvula, **Cronómetro guiado** directo, **Ajuste rápido post-taza** (`sensoryTuner.js`) y **Guardar en Mis Cafés** en 1 toque.
4. **Cockpit de Barra y Hardware Ambiental (`BrewGuideModal.jsx` + `TimemoreScaleContext.jsx`):**
   - Context global de balanza **Timemore Dot BLE** (sin reconexiones entre vistas, pill en vivo en el header con tara en 1 toque, auto-start al verter y sincronización por peso).
   - Toggle rápido de **Modo Barra OLED**, alertas duales audio/hápticas, voz opcional y diagnóstico post-taza en 1 tap con detección de canalización.
5. **Bitácora Accionable y Tarjetas (`BrewHistory.jsx` + `StickerShareModal.jsx`):**
   - Botón **Repetir** en 1 toque en cualquier extracción pasada.
   - Exportación de tarjetas y stickers transparentes en **8 estilos** (`Kissa`, `Cerámica`, `Botánico`, `Etiqueta`, `Origen`, `Tipográfica`, `Collage`, `Lata`), con o sin receta.
6. **NFC y App iOS (Capacitor / Sideloadly):**
   - Acceso público sin muro de login para invitados que escanean `/batch/:id`.
   - Esquema nativo `beantag://batch/<id>` en `Info.plist` y `SceneDelegate.swift` para saltar desde Safari iOS directo a la app instalada con Sideloadly, con preferencia opcional *Abrir siempre automáticamente* dentro de *Enlace, etiqueta NFC y App iOS*.

---

## 3. Pilares y No-Objetivos
- **Pilares:** rigor físico barista, artesanía editorial 2027/2028, operación offline garantizada y filosofía minimalista (*código mínimo que resuelve el problema real*).
- **No-Objetivos:** no es una red social con feeds adictivos, no es un POS de facturación masiva ni requiere suscripciones cerradas.
