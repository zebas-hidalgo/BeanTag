# Diseño Técnico: Rediseño Visual de Portatubos (Bean Cellar) y Resiliencia 100% de Recetas IA

**Fecha:** 2026-10-12  
**Estado:** Aprobado por el usuario  
**Módulos Afectados:**
- Frontend: `frontend/src/components/TubeRacksView.jsx`, `frontend/src/components/SlotAssignModal.jsx`, `frontend/src/components/BatchDetail.jsx`, `frontend/src/components/Settings.jsx`
- Backend: `backend/aiEngine.js`, `backend/server.js`

---

## 1. Contexto y Objetivos

BeanTag incorporó soporte para portatubos monodosis (2×3, 6 tubos por soporte) y recetas multivariables asistidas por Google Gemini AI. Tras la primera versión, se identificaron dos oportunidades clave:
1. **Identidad Visual del Portatubos:** Mejorar la experiencia estética transformando los botones genéricos de 2×3 en representaciones skeuomórficas modernas tipo *Bean Cellar* (tubo cilíndrico de ensayo en vidrio, tapa superior de madera, degradado de color según el tueste, píldoras de proceso por color y soporte de navegación por pestañas para múltiples racks).
2. **Garantía 100% de Disponibilidad de IA y Recetas (Zero-Downtime):** Eliminar por completo los errores de desconexión o fallas de Google AI (503, 429, timeouts y deprecación de modelos) implementando un timeout estricto de 4 segundos con `AbortController`, cascada de modelos (`gemini-3.8-flash` -> `gemini-3.8-flash-lite`), motor heurístico determinista local para el Sommelier IA (`computeOfflineSommelier`) y manejo de caché local resiliente en el cliente.

---

## 2. Arquitectura y Componentes

### 2.1. Frontend: Rediseño de Portatubos (`TubeRacksView.jsx`)

#### A. Navegación Multi-Rack (Pestañas estilo Píldora)
* Cuando existen 1 o más portatubos, se renderiza una barra horizontal de pestañas:
  * Pestaña activa: Fondo con color de acento (`var(--color-crimson)` o `var(--accent)`), texto blanco y contador de dosis ocupadas (ej. `☕ Barra Principal (5/6)`).
  * Pestañas inactivas: Fondo neutral elevado con borde fino y texto secundario.
  * Pestaña "+ Nuevo Rack": Botón con borde dashed que dispara el modal de creación.
* Al hacer clic en una pestaña se conmuta el rack activo visible con transición fluida. Si solo hay un rack, se muestra la pestaña con opción de añadir un segundo (ej. Cava / Congelador).
* Resumen global en cabecera: Total de dosis activas en todos los racks combinados.

#### B. Estética "Bean Cellar Artesanal" para cada Ranura (Grilla 2×3)
* Cada una de las 6 ranuras del rack seleccionado se representa con una metáfora visual de tubo de ensayo de monodosis:
  1. **Tapa superior de madera/nogal:** Rectángulo redondeado superior (`width: 34px`, `height: 8px`, fondo `#8B5A2B` con sombra suave).
  2. **Cuerpo de tubo de vidrio cilíndrico:** Contenedor con borde redondeado inferior (`border-radius: 0 0 16px 16px`, `width: 38px`, `height: 52px`).
  3. **Degradado según nivel de tueste (`roast_level`):**
     * Claro / Light Roast: `linear-gradient(180deg, rgba(217,119,6,0.15) 0%, #D97706 100%)` (tono miel/ámbar).
     * Medio / Medium Roast: `linear-gradient(180deg, rgba(180,83,9,0.15) 0%, #9A3412 100%)` (tono caoba cálido).
     * Oscuro / Dark Roast: `linear-gradient(180deg, rgba(67,40,24,0.15) 0%, #432818 100%)` (tono chocolate profundo).
  4. **Píldora de peso de dosis:** En la base del tubo (ej. `19.5g` o `18.0g`) en texto compacto de alta legibilidad.
  5. **Badges de proceso por color (`process`):**
     * Lavado / Washed: Fondo `#E0F2FE`, texto `#0284C7` (Celeste).
     * Natural / Honey: Fondo `#FFEDD5`, texto `#EA580C` (Naranja frutal).
     * Anaeróbico / Maceración / Co-fermentado: Fondo `#F3E8FF`, texto `#7E22CE` (Púrpura / Vino).
     * Otros: Fondo neutro `#F1F5F9`, texto `#475569`.
  6. **Indicador de Congelación:** Si el café tiene fecha `freeze_date` o el rack contiene "cava"/"congelador", se muestra un icono `❄️` y un halo de escarcha cian (`border-color: #38BDF8`).
  7. **Ranuras vacías:** Silueta de tubo punteada y translúcida con icono `+` y etiqueta `"Asignar #N"`.

---

### 2.2. Backend: Arquitectura Resiliente de IA (`aiEngine.js` y `server.js`)

#### A. Timeout Activo con `AbortController` en `callGeminiWithRetry`
* En cada intento de llamada a Google AI Studio (`generateContent`), se instancia un `AbortController` con un límite estricto de **4.000 ms (4 segundos)**.
* Si el servidor de Google tarda más de 4s (por congestión de red, problemas de ruta o latencia transcontinental), el fetch se cancela de inmediato y salta al siguiente modelo en la cascada sin congelar la interfaz del usuario.

#### B. Cascada Optimizada de Modelos
* Orden de prioridad:
  1. Modelo solicitado/configurado (sanitizado a la versión vigente, por defecto `gemini-3.8-flash`).
  2. Modelo ultrarrápido de baja latencia (`gemini-3.8-flash-lite`).
  3. Si la clave es inválida (400/401/403) o no hay conexión de red, aborta la cascada externa y transiciona inmediatamente a la capa local determinista.

#### C. Motor Barista Determinista Local para el Sommelier IA (`computeOfflineSommelier`)
* Actualmente `/api/ai/sommelier` devolvía error 500 si la API externa fallaba.
* Se añade la función `computeOfflineSommelier(batches, timeOfDay)` en `backend/aiEngine.js`:
  1. Analiza los lotes con stock disponible (`remaining_doses > 0`).
  2. Calcula los días de reposo (`daysSinceRoast`) para cada lote.
  3. Aplica heurísticas de curva de degas y ventana horaria:
     * **Mañana (06:00 - 12:00):** Prioriza cafés balanceados, tueste medio, procesos lavados con buen dulzor y cuerpo para el primer café del día.
     * **Tarde (12:00 - 18:00):** Prioriza perfiles de alta complejidad aromática, tuestes claros, variedades exóticas (Geisha, Pink Bourbon) o anaeróbicos frutales.
     * **Noche (18:00+):** Prioriza dosis moderadas o perfiles dulces suaves.
  4. Genera exactamente el mismo schema JSON que espera el frontend:
     `{ recommended_batch_id, recommended_batch_name, badge, headline, reason, suggested_method, flavor_highlight, _source: 'barista_fallback' }`.
* En `server.js`, el endpoint `/api/ai/sommelier` captura cualquier excepción de red y responde con `computeOfflineSommelier(...)`, garantizando **0% de respuestas 500 y 100% de uptime**.

#### D. Experiencia de Usuario Resiliente en Frontend (`BatchDetail.jsx`)
* Cuando una receta o recalibración proviene del motor offline (`_source === 'barista_fallback'`), la interfaz muestra un badge informativo positivo:
  * `⚡ Motor Barista Local (Física de fluidos y molienda calculada)`
  * Permite al usuario continuar su extracción sin interrupciones ni pantallas rojas de error.

---

## 3. Plan de Pruebas y Criterios de Aceptación

1. **Pruebas de Componentes Frontend (Vite Build):**
   * Compilación sin errores de JSX o CSS en `frontend/src/components/TubeRacksView.jsx` y `BatchDetail.jsx`.
2. **Pruebas de Integración de Racks (`test_tube_racks_api.js`):**
   * Creación, conmutación de pestañas, asignación de slots, llenado masivo y consumo atómico con 100% de éxito.
3. **Pruebas del Motor de IA Offline:**
   * Simular desconexión de red o API key inválida en `/api/ai/sommelier` y `/api/recommend-recipe`. Verificar que ambos devuelven JSON válido (HTTP 200) con receta/sommelier calculado localmente.
4. **Despliegue a Producción (VPS Zerker):**
   * `git push` a `origin/main`.
   * Ejecución remota vía `run_vps_cmd.sh`: `git pull`, `npm run build-frontend`, `pm2 restart beantag`.
   * Verificación en vivo de logs PM2 y HTTPS 200 en `https://5.189.152.68.nip.io/beantag/`.
