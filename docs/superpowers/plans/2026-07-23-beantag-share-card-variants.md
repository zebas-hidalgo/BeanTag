# Share Card Variants (Retro Candy, Barista Receipt, Instagram Story 9:16) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar 3 variantes de tarjetas para compartir (Retro Candy, Ticket Barista, Instagram Story 9:16) con selector interactivo en el modal de compartir de BeanTag.

**Architecture:** Añadir estado `shareTemplate` ('retro' | 'receipt' | 'story') en `BrewHistory.jsx`. Refactorizar `exportRecipeAsImage` para bifurcar las dimensiones del Canvas y dibujado según la plantilla activa.

**Tech Stack:** React, HTML5 Canvas 2D API, Lucide-React (`Image`, `Share2`, `X`, `Download`), Vite.

## Global Constraints

* Archivo principal a modificar: `beantag/frontend/src/components/BrewHistory.jsx`.
* Paletas y tipografías: `Comfortaa`, `Space Grotesk`, `Outfit`, `JetBrains Mono`.
* Soporte nativo para descarga de imágenes en PNG y `navigator.share`.

---

### Task 1: Add shareTemplate state & Template Selector UI

**Files:**
- Modify: `beantag/frontend/src/components/BrewHistory.jsx:15-30`
- Modify: `beantag/frontend/src/components/BrewHistory.jsx:750-800`

**Interfaces:**
- Produces: Estado `shareTemplate` y selector de pestañas en la UI del modal de compartir.

- [ ] **Step 1: Add shareTemplate state in BrewHistory.jsx**

In `BrewHistory.jsx`:
```jsx
const [shareTemplate, setShareTemplate] = useState('retro'); // 'retro' | 'receipt' | 'story'
```

- [ ] **Step 2: Add template tabs selector in Share Modal UI**

In `BrewHistory.jsx` (inside the share modal block):
```jsx
<div className="filter-scroll-container" style={{ margin: '12px 0' }}>
  <button
    type="button"
    className={`filter-chip ${shareTemplate === 'retro' ? 'active' : ''}`}
    onClick={() => { setShareTemplate('retro'); exportRecipeAsImage(selectedRecipe, 'retro'); }}
  >
    🍬 Retro Candy
  </button>
  <button
    type="button"
    className={`filter-chip ${shareTemplate === 'receipt' ? 'active' : ''}`}
    onClick={() => { setShareTemplate('receipt'); exportRecipeAsImage(selectedRecipe, 'receipt'); }}
  >
    🧾 Ticket Barista
  </button>
  <button
    type="button"
    className={`filter-chip ${shareTemplate === 'story' ? 'active' : ''}`}
    onClick={() => { setShareTemplate('story'); exportRecipeAsImage(selectedRecipe, 'story'); }}
  >
    📱 Story 9:16
  </button>
</div>
```

- [ ] **Step 3: Verify build**

Run: `cd /var/www/beantag/frontend && npm run build`
Expected: PASS with 0 errors.

- [ ] **Step 4: Commit**

```bash
git add beantag/frontend/src/components/BrewHistory.jsx
git commit -m "feat: add shareTemplate state and template selector UI in BrewHistory share modal"
```

---

### Task 2: Implement Dynamic Canvas Drawing for 3 Variants

**Files:**
- Modify: `beantag/frontend/src/components/BrewHistory.jsx:84-330`

**Interfaces:**
- Produces: `exportRecipeAsImage(recipe, templateOverride)` con soporte completo para `retro`, `receipt` y `story`.

- [ ] **Step 1: Refactor exportRecipeAsImage with template branching**

Update `exportRecipeAsImage` in `BrewHistory.jsx`:

```javascript
const exportRecipeAsImage = (recipe, templateOverride) => {
  const currentTpl = templateOverride || shareTemplate || 'retro';
  setShareStatus('Generando vista previa...');
  setShareImage(null);
  
  try {
    const canvas = document.createElement('canvas');
    const isVertical = currentTpl === 'story';
    canvas.width = isVertical ? 600 : 840;
    canvas.height = isVertical ? 1066 : 540;
    const ctx = canvas.getContext('2d');

    const style = getComputedStyle(document.documentElement);
    const colorBg = style.getPropertyValue('--bg-canvas').trim() || '#CAE7F7';
    const colorBorder = style.getPropertyValue('--border-color').trim() || '#000000';
    const colorAccent = style.getPropertyValue('--color-crimson').trim() || '#F94C00';
    const colorPrimary = style.getPropertyValue('--color-text').trim() || '#48261D';

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (currentTpl === 'receipt') {
      // --- PLANTILLA 2: TICKET DE BARISTA ---
      ctx.fillStyle = '#F7F5F0';
      ctx.fillRect(0, 0, 840, 540);
      
      // Borde punteado retro ticket
      ctx.strokeStyle = '#2D3748';
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 20, 800, 500);

      ctx.fillStyle = '#1A202C';
      ctx.font = '800 24px "Space Grotesk", sans-serif';
      ctx.fillText('=== BEANTAG SPECIALTY COFFEE ===', 50, 65);
      
      ctx.font = '700 13px "JetBrains Mono", monospace';
      ctx.fillStyle = '#4A5568';
      ctx.fillText(`RECIBO #0${recipe.id || '294'} | REGISTRO DE EXTRACCIÓN`, 50, 90);

      ctx.strokeStyle = '#CBD5E0';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(50, 105); ctx.lineTo(790, 105); ctx.stroke();

      ctx.font = '700 14px "JetBrains Mono", monospace';
      ctx.fillStyle = '#1A202C';
      ctx.fillText(`GRANO: ..... ${String(recipe.batch_name || 'N/A').toUpperCase()}`, 50, 140);
      ctx.fillText(`ORIGEN: .... ${String(recipe.batch_origin || 'N/A').toUpperCase()}`, 50, 175);
      ctx.fillText(`TOSTADOR: .. ${String(recipe.batch_roaster || 'N/A').toUpperCase()}`, 50, 210);
      ctx.fillText(`PROCESO: ... ${String(recipe.batch_process || 'N/A').toUpperCase()}`, 50, 245);

      ctx.fillText(`MÉTOD: .... ${String(recipe.method || 'N/A').toUpperCase()}`, 450, 140);
      ctx.fillText(`DOSIS: ..... ${recipe.dose_in_g || 'N/A'} G`, 450, 175);
      ctx.fillText(`MOLIENDA: .. ${String(recipe.grind || 'N/A').toUpperCase()}`, 450, 210);
      ctx.fillText(`RATIO: ..... ${String(recipe.ratio || 'N/A').toUpperCase()}`, 450, 245);
      ctx.fillText(`TIEMPO: .... ${String(recipe.brew_time || 'N/A').toUpperCase()}`, 450, 280);

      // Sello circular de barista
      ctx.strokeStyle = colorAccent;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(650, 400, 55, 0, Math.PI * 2); ctx.stroke();
      ctx.font = '900 12px "Space Grotesk", sans-serif';
      ctx.fillStyle = colorAccent;
      ctx.textAlign = 'center';
      ctx.fillText('BARISTA SPEC', 650, 395);
      ctx.fillText('VERIFIED', 650, 415);
      ctx.textAlign = 'left';

    } else if (currentTpl === 'story') {
      // --- PLANTILLA 4: INSTAGRAM STORY 9:16 ---
      ctx.fillStyle = colorBg;
      ctx.fillRect(0, 0, 600, 1066);

      // Fondo tarjeta interior
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(30, 40, 540, 986);
      ctx.strokeStyle = colorBorder;
      ctx.lineWidth = 4;
      ctx.strokeRect(30, 40, 540, 986);

      // Header Banner
      ctx.fillStyle = colorAccent;
      ctx.fillRect(50, 60, 500, 70);
      ctx.strokeRect(50, 60, 500, 70);

      ctx.font = '900 28px Comfortaa, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.fillText('BeanTag Story', 300, 105);

      // Grano Title
      ctx.font = '900 30px Outfit, sans-serif';
      ctx.fillStyle = colorPrimary;
      ctx.fillText(recipe.batch_name || 'Café de Especialidad', 300, 200);

      ctx.font = '700 16px "Space Grotesk", sans-serif';
      ctx.fillStyle = colorAccent;
      ctx.fillText(`${recipe.batch_roaster || 'Tostador'} • ${recipe.batch_origin || 'Origen'}`, 300, 235);

      // Método Box
      ctx.fillStyle = colorBg;
      ctx.fillRect(60, 280, 480, 180);
      ctx.strokeRect(60, 280, 480, 180);

      ctx.font = '800 22px "Space Grotesk", sans-serif';
      ctx.fillStyle = colorPrimary;
      ctx.fillText(`☕ ${recipe.method || 'Filtrado'}`, 300, 325);

      ctx.font = '600 16px Outfit, sans-serif';
      ctx.fillText(`Dosis: ${recipe.dose_in_g || 20}g  |  Ratio: ${recipe.ratio || '1:15'}`, 300, 370);
      ctx.fillText(`Molienda: ${recipe.grind || 'J-Max'}  |  Temp: ${recipe.temperature || '93°C'}`, 300, 410);

      // Sensorial Card
      ctx.fillStyle = '#FFF5F5';
      ctx.fillRect(60, 490, 480, 220);
      ctx.strokeRect(60, 490, 480, 220);

      ctx.font = '800 18px "Space Grotesk", sans-serif';
      ctx.fillStyle = colorAccent;
      ctx.fillText('EVALUACIÓN SENSORIAL', 300, 530);

      ctx.font = '600 16px Outfit, sans-serif';
      ctx.fillStyle = colorPrimary;
      ctx.fillText(`Balance: ${recipe.sensory_balance || 'Dulce'}`, 300, 575);
      ctx.fillText(`Cuerpo: ${recipe.sensory_body || 'Medio'}`, 300, 615);
      ctx.fillText(`Extracción: ${recipe.sensory_extraction || 'En Punto'}`, 300, 655);

      // Watermark Footer
      ctx.font = '800 14px "JetBrains Mono", monospace';
      ctx.fillStyle = colorAccent;
      ctx.fillText('• BEANTAG.CAFE •', 300, 980);
      ctx.textAlign = 'left';

    } else {
      // --- PLANTILLA 1: RETRO CANDY (DIBUJADO COMPLETO) ---
      if (textureRef.current) {
        ctx.save(); ctx.globalAlpha = 1.0; ctx.drawImage(textureRef.current, 15, 15, 810, 510); ctx.restore();
      }
      ctx.fillStyle = colorBg; ctx.globalAlpha = 0.8; ctx.fillRect(15, 15, 810, 510); ctx.globalAlpha = 1.0;
      ctx.lineWidth = 4; ctx.strokeStyle = colorBorder; ctx.strokeRect(15, 15, 810, 510);
      ctx.lineWidth = 1.5; ctx.strokeRect(20, 20, 800, 500);

      ctx.fillStyle = colorAccent; ctx.fillRect(50, 45, 6, 46); ctx.lineWidth = 2; ctx.strokeStyle = colorBorder; ctx.strokeRect(50, 45, 6, 46);
      ctx.font = '800 38px Comfortaa, sans-serif'; ctx.fillStyle = colorPrimary; ctx.fillText('BeanTag', 68, 80);

      ctx.font = '700 13px "JetBrains Mono", monospace'; ctx.fillStyle = colorPrimary; ctx.textAlign = 'right';
      const createdDate = new Date(recipe.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
      ctx.fillText(`REGISTRO: #0${recipe.id || '294'}`, 790, 63); ctx.fillText(createdDate.toUpperCase(), 790, 83); ctx.textAlign = 'left';

      ctx.lineWidth = 3.5; ctx.strokeStyle = colorBorder; ctx.beginPath(); ctx.moveTo(50, 105); ctx.lineTo(790, 105); ctx.stroke();

      ctx.font = '800 15px "Space Grotesk", sans-serif'; ctx.fillStyle = colorAccent; ctx.fillText('[ GRANO DE CAFÉ ]', 50, 138);
      ctx.font = '800 30px Outfit, sans-serif'; ctx.fillStyle = colorPrimary; ctx.fillText(recipe.batch_name || 'N/A', 50, 175);

      const batchDetails = [
        { label: 'Origen', val: recipe.batch_origin },
        { label: 'Productor', val: recipe.batch_producer },
        { label: 'Variedad', val: recipe.batch_variety },
        { label: 'Proceso', val: recipe.batch_process },
        { label: 'Tostador', val: recipe.batch_roaster }
      ];
      batchDetails.forEach((item, idx) => {
        const yPos = 215 + idx * 40;
        ctx.font = '800 17px Outfit, sans-serif'; ctx.fillStyle = colorAccent; ctx.fillText(`${item.label}:`, 50, yPos);
        ctx.font = '500 17px Outfit, sans-serif'; ctx.fillStyle = colorPrimary; ctx.fillText(item.val || 'N/A', 150, yPos);
      });

      ctx.font = '800 15px "Space Grotesk", sans-serif'; ctx.fillStyle = colorAccent; ctx.fillText('[ EXTRACCIÓN & CALIBRACIÓN ]', 450, 138);
      ctx.font = '800 30px Outfit, sans-serif'; ctx.fillStyle = colorPrimary; ctx.fillText(recipe.method || 'N/A', 450, 175);

      const recipeDetails = [
        { label: 'Dosis In', val: `${recipe.dose_in_g || 'N/A'} g` },
        { label: 'Molienda', val: recipe.grind || 'N/A' },
        { label: 'Ratio', val: recipe.ratio || 'N/A' },
        { label: 'Agua Temp', val: `${recipe.temperature || '93'} °C` },
        { label: 'Tiempo', val: recipe.brew_time || 'N/A' }
      ];
      recipeDetails.forEach((item, idx) => {
        const yPos = 215 + idx * 40;
        ctx.font = '800 17px Outfit, sans-serif'; ctx.fillStyle = colorAccent; ctx.fillText(`${item.label}:`, 450, yPos);
        ctx.font = '500 17px Outfit, sans-serif'; ctx.fillStyle = colorPrimary; ctx.fillText(item.val || 'N/A', 580, yPos);
      });
    }

    const dataUrl = canvas.toDataURL('image/png');
    setShareImage(dataUrl);
    setShareStatus('✅ Tarjeta generada con éxito');
  } catch (err) {
    setShareStatus('❌ Error al generar tarjeta: ' + err.message);
  }
};
```

- [ ] **Step 2: Verify build**

Run: `cd /var/www/beantag/frontend && npm run build`
Expected: PASS with 0 errors.

- [ ] **Step 3: Commit**

```bash
git add beantag/frontend/src/components/BrewHistory.jsx
git commit -m "feat: implement 3 share card canvas templates (Retro Candy, Barista Receipt, Instagram Story 9:16)"
```

---

### Task 3: Build & PM2 Deployment Verification

**Files:**
- Build artifacts: `beantag/backend/public/`

- [ ] **Step 1: Run production build**

Run: `cd /var/www/beantag/frontend && npm run build`
Expected: PASS with 0 errors.

- [ ] **Step 2: Restart PM2 process**

Run: `pm2 restart beantag`
Expected: `beantag` online in PM2 status.

- [ ] **Step 3: Verify HTTP responses**

Run: `curl -I http://localhost:5000/`
Expected: HTTP 200 OK.
