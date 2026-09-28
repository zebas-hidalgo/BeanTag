# Modo Barista: Cronómetro Interactivo en Vivo y Asistente de Calibración Sensorial Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar el Cronómetro Asistente de Extracción en Vivo (`BrewGuideModal`) a pantalla completa con Screen Wake Lock, Web Audio API y alertas dinámicas de válvula (especial para Pulsar Mini), integrado con el Asistente de Calibración Sensorial post-extracción de 3 toques que calcula y guarda micro-correcciones de molienda y temperatura en BeanTag V3.0.

**Architecture:** 
- **Capa Sensorial:** `frontend/src/utils/sensoryTuner.js` calcula deltas físicos deterministas de clics y temperatura según el molino activo ante diagnósticos de sub-extracción o sobre-extracción.
- **Capa Multimedia:** `frontend/src/utils/baristaAudio.js` sintetiza alertas sonoras nativas con Web Audio API y gestiona el Screen Wake Lock.
- **Capa UI:** `frontend/src/components/BrewGuideModal.jsx` renderiza el cronómetro extra grande, fases de vertido, control de válvula y el diálogo post-extracción.
- **Capa de Integración:** `frontend/src/components/BatchDetail.jsx` expone el botón de inicio y persiste recetas afinadas.

**Tech Stack:** React 18, Tailwind CSS, Lucide Icons, Web Audio API, Screen Wake Lock API, Vite, Express.js, SQLite.

---

### Task 1: Sensory Correction Engine (`frontend/src/utils/sensoryTuner.js`) & Test Suite

**Files:**
- Create: `frontend/src/utils/sensoryTuner.js`
- Test: `scripts/test_sensory_tuner.mjs`

- [ ] **Step 1: Write failing test in `scripts/test_sensory_tuner.mjs`**
Write unit test verifying:
1. Sub-extraction feedback (`taste: 'sour'`, `flow: 'fast'`, `body: 'thin'`) on Femobook A2 at 68 clicks:
   - Recommends closing grind by 2 clicks (newDial: 66 clicks) and +1°C to +2°C.
2. Over-extraction feedback (`taste: 'bitter'`, `flow: 'slow'`, `body: 'astringent'`) on Femobook A2 at 68 clicks:
   - Recommends opening grind by 2 clicks (newDial: 70 clicks) and -1°C to -2°C.
3. Perfect extraction (`taste: 'balanced'`, `flow: 'on_time'`, `body: 'balanced'`):
   - Recommends 0 click change and 5-star rating.
4. Correct translations across all 8 grinders (Femobook, J-Max, K-Ultra, Ode, Comandante, Kingrinder, Timemore, Baratza).

- [ ] **Step 2: Run test to verify it fails**
Run: `node scripts/test_sensory_tuner.mjs`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `frontend/src/utils/sensoryTuner.js`**
Create and export `computeSensoryCorrection(grinderId, currentDial, currentTemp, feedback)`.
Implement the deterministic mathematical adjustments per grinder type (`clicks`, `number`, `stepper_3`, `steps`).

- [ ] **Step 4: Run test to verify it passes**
Run: `node scripts/test_sensory_tuner.mjs`
Expected: PASS.

- [ ] **Step 5: Commit changes**
```bash
git add frontend/src/utils/sensoryTuner.js scripts/test_sensory_tuner.mjs
git commit -m "feat(barista): implement sensory correction engine and test suite"
```

---

### Task 2: Barista Audio & Screen Wake Lock Utility (`frontend/src/utils/baristaAudio.js`)

**Files:**
- Create: `frontend/src/utils/baristaAudio.js`

- [ ] **Step 1: Implement `frontend/src/utils/baristaAudio.js`**
Implement:
- `playBeep(frequency = 440, duration = 0.1, type = 'sine')`: Native Web Audio API tone generator.
- `playCountdownBeep()`: 440Hz short pulse for 3-2-1 countdown.
- `playPhaseChime()`: Double chord (587Hz -> 880Hz) on stage completion or valve action.
- `playSuccessChime()`: Harmonious arpeggio (523Hz -> 659Hz -> 784Hz) on extraction complete.
- `requestScreenWakeLock()`: Requests `navigator.wakeLock.request('screen')` with try/catch fallback.
- `releaseScreenWakeLock(sentinel)`: Safely releases sentinel if active.

- [ ] **Step 2: Verification**
Verify no syntax or import errors with a quick node or frontend check.

- [ ] **Step 3: Commit changes**
```bash
git add frontend/src/utils/baristaAudio.js
git commit -m "feat(audio): implement native web audio synthesizer and screen wake lock helper"
```

---

### Task 3: Interactive Barista Mode Modal Component (`frontend/src/components/BrewGuideModal.jsx`)

**Files:**
- Create: `frontend/src/components/BrewGuideModal.jsx`

- [ ] **Step 1: Implement `BrewGuideModal.jsx`**
Build full-screen modal featuring:
1. Header: Method name, mute/unmute audio toggle, close button.
2. Big Timer View:
   - Primary `MM:SS` timer in `font-mono text-7xl font-black`.
   - Secondary countdown for active phase (e.g. `Bloom: 0:45 restantes`).
   - Dynamic Valve Badge:
     - 🔒 `VÁLVULA CERRADA (100%)` (Crimson/amber badge).
     - ⚡ `VÁLVULA AL 45-50%` (Cyan pulse badge).
     - 🔓 `VÁLVULA 100% ABIERTA` (Emerald badge).
   - Target cumulative water (e.g. `Verter hasta 143g (+98g)`).
   - Suggested flow rate (`~2.2 ml/s`).
   - Big touch controls: `Pausar / Reanudar`, `Siguiente Fase`, `Terminar Extracción`.
3. Post-Brew Diagnostic View:
   - Sabor: Agrio, Dulce/Balanceado, Amargo.
   - Tiempo de Drenaje: Rápido, A Tiempo, Lento/Atascado.
   - Cuerpo: Hueco/Aguado, Sedoso/Balanceado, Áspero/Astringente.
   - Instant recommendation banner: shows recommended clicks and temperature for the next brew.
   - Button: `Guardar Receta Afinada` (submits to `onSaveTunedRecipe` prop).

- [ ] **Step 2: Verify component compiles**
Run: `npm --prefix frontend run build`
Expected: Succeeds.

- [ ] **Step 3: Commit component**
```bash
git add frontend/src/components/BrewGuideModal.jsx
git commit -m "feat(ui): implement immersive brew guide modal and post-extraction diagnostic"
```

---

### Task 4: Integration in `BatchDetail.jsx` and Recipe Persistence

**Files:**
- Modify: `frontend/src/components/BatchDetail.jsx`

- [ ] **Step 1: Add "▶ Preparar Ahora (Modo Barista)" button in `BatchDetail.jsx`**
In the active recipe section of `BatchDetail.jsx`:
- Add primary action button: `▶ Preparar Ahora (Modo Barista)` with coffee/timer icon.
- Wire state `isBrewGuideOpen` to mount `BrewGuideModal`.
- Wire `handleSaveTunedRecipe`:
  - Posts tuned recipe to `/api/recipes` with calibrated clicks, temperature, and notes.
  - Updates local state so the new calibrated recipe becomes active immediately.
  - Displays toast: `Receta afinada guardada con éxito`.

- [ ] **Step 2: Run frontend production build**
Run: `npm --prefix frontend run build`
Expected: Vite build succeeds with 0 errors.

- [ ] **Step 3: Commit integration**
```bash
git add frontend/src/components/BatchDetail.jsx
git commit -m "feat(batch-detail): integrate interactive brew guide modal and recipe tuning persistence"
```

---

### Task 5: End-to-End Test Suite Verification and Remote VPS Production Deployment

**Files:**
- Remote: VPS `5.189.152.68` (`/var/www/beantag`)

- [ ] **Step 1: Run all test scripts**
Run:
```bash
node scripts/test_sensory_tuner.mjs
node scripts/test_pulsar_mini.mjs
node scripts/test_grinders_unification.mjs
node scripts/test_ai_reliability.mjs
node scripts/verify_cards_render.mjs
npm --prefix frontend run build
```
Expected: All tests pass with 0 errors.

- [ ] **Step 2: Push commits to `origin/main`**
Run: `git push origin main`
Expected: Remote branch updated.

- [ ] **Step 3: Deploy to VPS server**
Run:
```bash
/Users/zebas/.gemini/config/skills/zerker/scripts/run_vps_cmd.sh "cd /var/www/beantag && git pull origin main && npm --prefix frontend run build && pm2 restart beantag"
```
Expected: PM2 process restarted, status online.

- [ ] **Step 4: Verify production health**
Run:
```bash
curl -I http://5.189.152.68/beantag/
curl -I http://5.189.152.68/beantag/api/batches
```
Expected: HTTP 200 OK.
