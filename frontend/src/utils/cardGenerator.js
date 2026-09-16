// --- BEANTAG AESTHETIC TICKET & CARD GENERATOR (2026/2027) ---
// High-Fashion Vertical Portrait (540 x 760 px @ 2x Retina = 1080 x 1520 px)
// Supporting both Barista Extraction Tickets ("Con Receta") and
// Specialty Coffee Terroir & Cupping Collector Cards ("Solo Grano").
// Pure high-end typographical minimalism (Zero raster hero PNG images),
// guaranteed async fonts, and strict WCAG AAA contrast.

/**
 * Normalizes template names to the 4 official styles:
 * 'blueprint' | 'neobrutalist' | 'aurora' | 'hangtag'
 */
export function normalizeCardStyle(tpl) {
  if (!tpl) return 'blueprint';
  const lower = String(tpl).toLowerCase();
  if (lower.includes('blue') || lower.includes('cyan') || lower.includes('tech')) return 'blueprint';
  if (lower.includes('neo') || lower.includes('brutal') || lower.includes('pop') || lower.includes('tokyo')) return 'neobrutalist';
  if (lower.includes('aurora') || lower.includes('glass') || lower.includes('holo') || lower.includes('dark')) return 'aurora';
  if (lower.includes('hang') || lower.includes('nord') || lower.includes('vintage') || lower.includes('paper') || lower.includes('minimal')) return 'hangtag';
  return 'blueprint';
}

/**
 * Strips OS emojis from strings for clean typography
 */
export function stripEmojis(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/gu, '')
    .trim();
}

/**
 * Extracts flavor notes into clean tags
 */
export function extractFlavorTags(notes) {
  if (!notes) return [];
  const cleaned = stripEmojis(notes);
  return cleaned
    .split(/[,•|\/\n]+/)
    .map(t => t.trim())
    .filter(t => t.length > 1 && !t.toLowerCase().startsWith('notas:'));
}

/**
 * Translates grind description into approximate microns for technical precision
 */
export function parseGrindToMicrons(grind) {
  if (!grind) return 750;
  const lower = String(grind).toLowerCase();
  const numMatch = lower.match(/(\d{3,4})\s*(?:um|µm|micr)/i);
  if (numMatch) return parseInt(numMatch[1], 10);
  if (lower.includes('espresso') || lower.includes('fino')) return 380;
  if (lower.includes('aeropress')) return 620;
  if (lower.includes('v60') || lower.includes('medio fino') || lower.includes('medio-fino')) return 750;
  if (lower.includes('kalita') || lower.includes('chemex')) return 850;
  if (lower.includes('medio grueso') || lower.includes('medio-grueso')) return 980;
  if (lower.includes('prensa') || lower.includes('french') || lower.includes('grueso') || lower.includes('cupping')) return 1100;
  if (lower.includes('cold brew')) return 1250;
  return 750;
}

/**
 * Asynchronous Font Loading Barrier:
 * Prevents HTML5 Canvas from drawing with fallback system fonts
 */
export async function ensureFontsLoaded() {
  if (typeof document === 'undefined' || !document.fonts) return;
  try {
    await Promise.all([
      document.fonts.load('700 16px "Space Grotesk"'),
      document.fonts.load('900 26px "Space Grotesk"'),
      document.fonts.load('900 32px "Space Grotesk"'),
      document.fonts.load('700 14px "JetBrains Mono"'),
      document.fonts.load('800 20px "JetBrains Mono"'),
      document.fonts.load('900 28px "JetBrains Mono"'),
      document.fonts.load('italic 14px "Playfair Display"'),
      document.fonts.load('700 24px "Playfair Display"'),
      document.fonts.load('bold 30px "Playfair Display"'),
      document.fonts.load('700 16px "Outfit"')
    ]);
    await document.fonts.ready;
  } catch (e) {
    // Graceful fallback
  }
}

/**
 * Utility: Draws rounded rectangle
 */
function drawRoundedRect(ctx, x, y, width, height, radius, fill = false, stroke = true) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

/**
 * Pure vector drafting crosshair for Blueprint precision
 */
function drawBlueprintCross(ctx, cx, cy, size = 5) {
  ctx.strokeStyle = '#38BDF8';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(cx - size, cy);
  ctx.lineTo(cx + size, cy);
  ctx.moveTo(cx, cy - size);
  ctx.lineTo(cx, cy + size);
  ctx.stroke();
}

/**
 * Pure vector embossed seal for Scandinavian Editorial Atelier (Hangtag)
 */
function drawVectorSeal(ctx, cx, cy, radius = 18) {
  ctx.save();
  ctx.strokeStyle = 'rgba(120, 113, 108, 0.45)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(120, 113, 108, 0.25)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 3, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#78716C';
  ctx.font = '700 7px "Playfair Display", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ATELIER', cx, cy - 3);
  ctx.font = 'italic 6px "Playfair Display", Georgia, serif';
  ctx.fillText('CRU', cx, cy + 5);
  ctx.restore();
}

/**
 * Generates an Ultra-Aesthetic Share Card (Portrait 540 x 760 px @ 2x = 1080 x 1520 px)
 * Flawlessly balanced for both "Con Receta" and "Solo Grano" modes with pure minimalist typography.
 */
export async function generateRecipeCardImage(recipe, template = 'blueprint', incRecipe = true) {
  const style = normalizeCardStyle(template);

  // Guarantee web fonts are fully ready
  await ensureFontsLoaded();

  const canvas = document.createElement('canvas');
  const scaleFactor = 2;
  const baseW = 540;
  const baseH = 760;

  canvas.width = baseW * scaleFactor;
  canvas.height = baseH * scaleFactor;

  const ctx = canvas.getContext('2d');
  ctx.scale(scaleFactor, scaleFactor);

  // Text helpers
  const drawTruncatedText = (text, x, y, maxWidth) => {
    const str = String(text || '');
    if (!maxWidth || ctx.measureText(str).width <= maxWidth) {
      ctx.fillText(str, x, y);
      return;
    }
    let truncated = str;
    while (truncated.length > 0 && ctx.measureText(truncated + '…').width > maxWidth) {
      truncated = truncated.slice(0, -1);
    }
    ctx.fillText(truncated + '…', x, y);
  };

  const drawFittedText = (text, x, y, maxWidth, initialSize = 25, fontName = '"Space Grotesk", sans-serif', weight = '900') => {
    const str = String(text || '');
    let size = initialSize;
    ctx.font = `${weight} ${size}px ${fontName}`;
    while (ctx.measureText(str).width > maxWidth && size > 13) {
      size -= 1;
      ctx.font = `${weight} ${size}px ${fontName}`;
    }
    ctx.fillText(str, x, y);
  };

  // Coffee & recipe attributes
  const coffeeName = stripEmojis(recipe.batch_name || recipe.coffee_name || recipe.name || 'Café de Especialidad');
  const origin = stripEmojis(recipe.origin || recipe.batch_origin || 'Boquete, Panamá');
  const roaster = stripEmojis(recipe.roaster || recipe.batch_roaster || 'Tostaduría Artesanal');
  const producer = stripEmojis(recipe.producer || recipe.batch_producer || 'Productor Artesanal');
  const process = stripEmojis(recipe.process || recipe.batch_process || 'Lavado');
  const variety = stripEmojis(recipe.variety || recipe.batch_variety || 'Geisha / Heirloom');
  const altitude = recipe.altitude || recipe.batch_altitude ? `${stripEmojis(String(recipe.altitude || recipe.batch_altitude)).replace('m', '')}m` : '1.850m';
  const notesStr = recipe.flavor_notes || recipe.notes || recipe.roaster_notes || recipe.batch_roaster_notes || 'Notas limpias, florales, balance y dulzor';
  const flavorTags = extractFlavorTags(notesStr);
  const scaScore = recipe.sca_score || recipe.score || 89.5;
  const dosesStr = recipe.remaining_doses !== undefined ? `${recipe.remaining_doses} TUBOS EN CAVA` : 'LOTE LIMITADO';

  const methodStr = stripEmojis(recipe.method || 'V60 Conical');
  const coffeeG = recipe.coffee_grams || recipe.dose_in_g || 15;
  const waterG = recipe.water_grams || 240;
  const ratioStr = recipe.ratio || `1:${(waterG / (coffeeG || 1)).toFixed(1)}`;
  const grindStr = stripEmojis(recipe.grind_size || recipe.grind || 'Medio-Fino');
  const microns = parseGrindToMicrons(grindStr);
  const tempStr = recipe.temp || recipe.temperature ? `${String(recipe.temp || recipe.temperature).replace('°C', '')}°C` : '93°C';
  const timeStr = recipe.time || recipe.brew_time ? `${stripEmojis(String(recipe.time || recipe.brew_time)).replace(' min', '')}` : '02:45';

  const paddingX = 26;
  const paddingY = 26;
  const availW = baseW - (paddingX * 2); // 488 px

  // =========================================================================
  // 1. STYLE: BLUEPRINT TÉCNICO (SWISS PATENT CYANOTYPE)
  // =========================================================================
  if (style === 'blueprint') {
    // Deep Prussian Blueprint Base
    ctx.fillStyle = '#06162D';
    ctx.fillRect(0, 0, baseW, baseH);

    // Precision Millimeter Grid (Minor + Major)
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.05)';
    ctx.lineWidth = 0.8;
    for (let x = 0; x <= baseW; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, baseH); ctx.stroke(); }
    for (let y = 0; y <= baseH; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(baseW, y); ctx.stroke(); }

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= baseW; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, baseH); ctx.stroke(); }
    for (let y = 0; y <= baseH; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(baseW, y); ctx.stroke(); }

    // Outer Drafting Frame with Coordinate Crosshairs
    const bx = paddingX - 8;
    const by = paddingY - 8;
    const bw = availW + 16;
    const bh = baseH - (paddingY * 2) + 16;

    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1.4;
    ctx.strokeRect(bx, by, bw, bh);

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(bx + 4, by + 4, bw - 8, bh - 8);

    const drawCross = (cx, cy) => {
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx - 7, cy); ctx.lineTo(cx + 7, cy);
      ctx.moveTo(cx, cy - 7); ctx.lineTo(cx + 7, cy);
      ctx.stroke();
    };
    drawCross(bx, by);
    drawCross(bx + bw, by);
    drawCross(bx, by + bh);
    drawCross(bx + bw, by + bh);

    // 1. Header Spec
    ctx.fillStyle = '#38BDF8';
    ctx.font = '700 8.5px "JetBrains Mono", monospace';
    ctx.fillText(incRecipe ? '// SPECIFICATION: EXTRACTION PROTOCOL' : '// SPECIFICATION: BOTANICAL TERROIR', paddingX, paddingY + 14);

    ctx.fillStyle = '#FFFFFF';
    drawFittedText(coffeeName.toUpperCase(), paddingX, paddingY + 44, availW, 28, '"JetBrains Mono", monospace', '900');

    ctx.fillStyle = '#93C5FD';
    ctx.font = '700 10px "JetBrains Mono", monospace';
    drawTruncatedText(`${origin.toUpperCase()} • ${process.toUpperCase()} • ${altitude} • ${roaster.toUpperCase()}`, paddingX, paddingY + 66, availW);

    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(paddingX, paddingY + 78);
    ctx.lineTo(baseW - paddingX, paddingY + 78);
    ctx.stroke();

    // -----------------------------------------------------------------------
    // MODE A: SOLO GRANO (TERROIR & CUPPING SHOWCASE)
    // -----------------------------------------------------------------------
    if (!incRecipe) {
      // 1. Spec Header Strip
      const specBoxY = paddingY + 90;
      const specBoxH = 34;
      ctx.fillStyle = 'rgba(14, 165, 233, 0.08)';
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, paddingX, specBoxY, availW, specBoxH, 4, true, true);

      ctx.fillStyle = '#7DD3FC';
      ctx.font = '800 8.5px "JetBrains Mono", monospace';
      ctx.fillText('FIG. 01 — ARCHIVAL MORPHOLOGY // SECTION A-A', paddingX + 12, specBoxY + 21);

      ctx.fillStyle = '#4ADE80';
      ctx.font = '800 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`SCA CUPSCORE: ${scaScore}★ [CERTIFIED]`, paddingX + availW - 12, specBoxY + 21);
      ctx.textAlign = 'left';

      // 2. Terroir Matrix Boxes (2x2) with generous breathing room
      const matY = specBoxY + specBoxH + 12;
      const matGap = 10;
      const colW = (availW - matGap) / 2;
      const colH = 86;

      const terroirItems = [
        { lbl: 'PRODUCTOR & FINCA', val: producer.toUpperCase(), sub: origin.toUpperCase() },
        { lbl: 'ALTITUD & TERROIR', val: altitude, sub: 'VOLCANIC SOIL / MICROCLIMATE' },
        { lbl: 'VARIEDAD BOTÁNICA', val: variety.toUpperCase(), sub: '100% ARABICA SPECIALTY' },
        { lbl: 'BENEFICIO / PROCESO', val: process.toUpperCase(), sub: 'CONTROLLED FERMENTATION' }
      ];

      terroirItems.forEach((t, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const tx = paddingX + col * (colW + matGap);
        const ty = matY + row * (colH + matGap);

        ctx.fillStyle = 'rgba(14, 165, 233, 0.08)';
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 1;
        drawRoundedRect(ctx, tx, ty, colW, colH, 5, true, true);

        // Technical corner crosshair
        drawBlueprintCross(ctx, tx + colW - 12, ty + 12, 4);

        ctx.fillStyle = '#7DD3FC';
        ctx.font = '800 8px "JetBrains Mono", monospace';
        ctx.fillText(t.lbl, tx + 12, ty + 20);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 13.5px "JetBrains Mono", monospace';
        drawTruncatedText(t.val, tx + 12, ty + 46, colW - 24);

        ctx.fillStyle = '#38BDF8';
        ctx.font = '700 8px "JetBrains Mono", monospace';
        drawTruncatedText(t.sub, tx + 12, ty + 68, colW - 24);
      });

      // 3. Sensory Cupping Spectrum Bars (4 Bars)
      const specY = matY + (colH * 2) + matGap + 12;
      const specH = 126;
      ctx.fillStyle = 'rgba(14, 165, 233, 0.06)';
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, paddingX, specY, availW, specH, 5, true, true);

      ctx.fillStyle = '#7DD3FC';
      ctx.font = '800 8.5px "JetBrains Mono", monospace';
      ctx.fillText('CALIBRATED SENSORY ATTRIBUTES & CUP PROFILE:', paddingX + 12, specY + 20);

      const attrBars = [
        { name: 'ACIDEZ', level: 0.88, desc: 'Brillante / Cítrica' },
        { name: 'DULZOR', level: 0.92, desc: 'Panela & Miel' },
        { name: 'CUERPO', level: 0.80, desc: 'Sedoso / Té' },
        { name: 'BALANCE', level: 0.94, desc: 'Excepcional' }
      ];

      attrBars.forEach((a, i) => {
        const ax = paddingX + 12;
        const ay = specY + 42 + (i * 20);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '700 8.5px "JetBrains Mono", monospace';
        ctx.fillText(a.name, ax, ay);

        // Bar
        const barX = ax + 58;
        const barW = availW - 175;
        ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
        ctx.fillRect(barX, ay - 7, barW, 7);
        ctx.fillStyle = '#38BDF8';
        ctx.fillRect(barX, ay - 7, barW * a.level, 7);

        ctx.fillStyle = '#93C5FD';
        ctx.font = '700 8px "JetBrains Mono", monospace';
        ctx.fillText(a.desc, barX + barW + 10, ay);
      });

      // 4. Cupping Flavor Descriptors Box
      const notesY = specY + specH + 12;
      const notesH = 82;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.05)';
      ctx.fillRect(paddingX, notesY, availW, notesH);
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(paddingX, notesY, 4, notesH);

      ctx.fillStyle = '#7DD3FC';
      ctx.font = '800 8.5px "JetBrains Mono", monospace';
      ctx.fillText('NOTAS DE CATA & DESCRIPTORES SENSORIALES:', paddingX + 12, notesY + 20);

      let pillX = paddingX + 12;
      const pillY = notesY + 34;
      const displayTags = flavorTags.length > 0 ? flavorTags : ['Notas Limpias', 'Balance', 'Dulzor Natural'];
      displayTags.slice(0, 4).forEach((tag) => {
        ctx.font = '800 10px "JetBrains Mono", monospace';
        const tw = ctx.measureText(tag.toUpperCase()).width;
        const pw = tw + 16;
        if (pillX + pw <= paddingX + availW - 12) {
          ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
          ctx.strokeStyle = '#38BDF8';
          ctx.lineWidth = 1;
          drawRoundedRect(ctx, pillX, pillY, pw, 24, 4, true, true);

          ctx.fillStyle = '#E0F2FE';
          ctx.fillText(tag.toUpperCase(), pillX + 8, pillY + 16);
          pillX += pw + 8;
        }
      });

      // 5. Cellar Vault Cryo-Preservation Tag
      const vaultY = notesY + notesH + 10;
      ctx.fillStyle = 'rgba(74, 222, 128, 0.1)';
      ctx.strokeStyle = '#4ADE80';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, paddingX, vaultY, availW, 30, 4, true, true);

      ctx.fillStyle = '#4ADE80';
      ctx.font = '800 8.5px "JetBrains Mono", monospace';
      ctx.fillText(`❄️ CAVA BEANTAG: ${dosesStr} • VACÍO -18°C • ARCHIVAL SPECIMEN`, paddingX + 12, vaultY + 19);
    }

    // -----------------------------------------------------------------------
    // MODE B: CON RECETA (BARISTA EXTRACTION PROTOCOL)
    // -----------------------------------------------------------------------
    else {
      // 1. Protocol Spec Strip
      const specBoxY = paddingY + 90;
      const specBoxH = 34;
      ctx.fillStyle = 'rgba(14, 165, 233, 0.08)';
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, paddingX, specBoxY, availW, specBoxH, 4, true, true);

      ctx.fillStyle = '#7DD3FC';
      ctx.font = '800 8.5px "JetBrains Mono", monospace';
      ctx.fillText('FIG. 01: EXTRACTION PROTOCOL // CALIBRATION SPEC', paddingX + 12, specBoxY + 21);

      ctx.fillStyle = '#4ADE80';
      ctx.font = '800 8.5px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`SCA: ${scaScore}★ [TARGET EXTRACTION: 19.5% - 21.5% EY]`, paddingX + availW - 12, specBoxY + 21);
      ctx.textAlign = 'left';

      // 2. 4 Extraction Parameter Bento Tiles (2x2) with PURE TYPOGRAPHY
      const bentoY = specBoxY + specBoxH + 12;
      const bentoGap = 10;
      const colW = (availW - bentoGap) / 2;
      const colH = 92;

      const metrics = [
        { lbl: 'MÉTODO // EXTRACCIÓN', val: methodStr.toUpperCase(), sub: 'CONICAL 60° // FILTRO' },
        { lbl: 'RATIO & DOSIS', val: `1:${ratioStr.replace('1:', '')}`, sub: `${coffeeG}g IN ➔ ${waterG}g OUT` },
        { lbl: 'MOLIENDA // MICRONS', val: `${microns} µm`, sub: grindStr.toUpperCase() },
        { lbl: 'TIEMPO & TEMPERATURA', val: `${timeStr} MIN`, sub: `${tempStr} • CONSTANT FLOW` }
      ];

      metrics.forEach((m, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const mx = paddingX + col * (colW + bentoGap);
        const my = bentoY + row * (colH + bentoGap);

        ctx.fillStyle = 'rgba(14, 165, 233, 0.08)';
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 1;
        drawRoundedRect(ctx, mx, my, colW, colH, 5, true, true);

        // Technical corner crosshair
        drawBlueprintCross(ctx, mx + colW - 12, my + 12, 4);

        // Top micro-label
        ctx.fillStyle = '#7DD3FC';
        ctx.font = '800 8px "JetBrains Mono", monospace';
        ctx.fillText(m.lbl, mx + 14, my + 22);

        // Large crisp parameter value
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 18px "JetBrains Mono", monospace';
        drawTruncatedText(m.val, mx + 14, my + 52, colW - 28);

        // Subtitle note
        ctx.fillStyle = '#38BDF8';
        ctx.font = '700 8.5px "JetBrains Mono", monospace';
        drawTruncatedText(m.sub, mx + 14, my + 74, colW - 28);
      });

      // 3. Pour Timeline Progress Bar
      const flowY = bentoY + (colH * 2) + bentoGap + 12;
      const flowH = 62;

      ctx.fillStyle = 'rgba(14, 165, 233, 0.05)';
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      drawRoundedRect(ctx, paddingX, flowY, availW, flowH, 5, true, true);
      ctx.setLineDash([]);

      ctx.fillStyle = '#7DD3FC';
      ctx.font = '700 8px "JetBrains Mono", monospace';
      ctx.fillText('BLOOM (0:00): 45g', paddingX + 12, flowY + 18);
      ctx.fillText('VERTIDO 2: +95g', paddingX + (availW / 2) - 35, flowY + 18);
      ctx.fillStyle = '#4ADE80';
      ctx.textAlign = 'right';
      ctx.fillText(`TOTAL: ${waterG}g (RATIO ${ratioStr})`, paddingX + availW - 12, flowY + 18);
      ctx.textAlign = 'left';

      const barY = flowY + 30;
      const barW = availW - 24;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
      drawRoundedRect(ctx, paddingX + 12, barY, barW, 9, 4, true, false);

      ctx.fillStyle = '#38BDF8';
      drawRoundedRect(ctx, paddingX + 12, barY, barW * 0.22, 9, 4, true, false);
      ctx.fillStyle = '#60A5FA';
      drawRoundedRect(ctx, paddingX + 12 + (barW * 0.22), barY, barW * 0.38, 9, 4, true, false);
      ctx.fillStyle = '#93C5FD';
      drawRoundedRect(ctx, paddingX + 12 + (barW * 0.60), barY, barW * 0.40, 9, 4, true, false);

      // 4. Sensory Descriptors & Flavor Pills
      const notesY = flowY + flowH + 12;
      const notesH = 80;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.05)';
      ctx.fillRect(paddingX, notesY, availW, notesH);
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(paddingX, notesY, 4, notesH);

      ctx.fillStyle = '#7DD3FC';
      ctx.font = '800 8px "JetBrains Mono", monospace';
      ctx.fillText('SENSORY PROFILE & CUPPING DESCRIPTORS:', paddingX + 12, notesY + 18);

      let pillX = paddingX + 12;
      const pillY = notesY + 32;
      const displayTags = flavorTags.length > 0 ? flavorTags : ['Notas Limpias', 'Balance', 'Claridad'];
      displayTags.slice(0, 4).forEach((tag) => {
        ctx.font = '800 10px "JetBrains Mono", monospace';
        const tw = ctx.measureText(tag.toUpperCase()).width;
        const pw = tw + 16;
        if (pillX + pw <= paddingX + availW - 12) {
          ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
          ctx.strokeStyle = '#38BDF8';
          ctx.lineWidth = 1;
          drawRoundedRect(ctx, pillX, pillY, pw, 24, 4, true, true);

          ctx.fillStyle = '#E0F2FE';
          ctx.fillText(tag.toUpperCase(), pillX + 8, pillY + 16);
          pillX += pw + 8;
        }
      });
    }

    // Architectural Title Block (Bottom)
    const tbH = 40;
    const tbY = baseH - paddingY - tbH;
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(paddingX, tbY, availW, tbH);

    const cellW = availW / 3;
    ctx.beginPath();
    ctx.moveTo(paddingX + cellW, tbY); ctx.lineTo(paddingX + cellW, tbY + tbH);
    ctx.moveTo(paddingX + cellW * 2, tbY); ctx.lineTo(paddingX + cellW * 2, tbY + tbH);
    ctx.stroke();

    ctx.fillStyle = '#7DD3FC';
    ctx.font = '700 7px "JetBrains Mono", monospace';
    ctx.fillText('DWG NO:', paddingX + 8, tbY + 12);
    ctx.fillText('ROASTER / LAB:', paddingX + cellW + 8, tbY + 12);
    ctx.fillText('ARCHIVE STATUS:', paddingX + cellW * 2 + 8, tbY + 12);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 10.5px "JetBrains Mono", monospace';
    ctx.fillText('BT-2027-V60', paddingX + 8, tbY + 28);
    drawTruncatedText(roaster.toUpperCase(), paddingX + cellW + 8, tbY + 28, cellW - 16);
    ctx.fillText('1:1 CALIBRATED', paddingX + cellW * 2 + 8, tbY + 28);
  }

  // =========================================================================
  // 2. STYLE: NEO-BRUTALIST POP (TOKYO STREETWEAR ROASTERY)
  // =========================================================================
  else if (style === 'neobrutalist') {
    // Warm Ivory Paper Canvas
    ctx.fillStyle = '#FFFDF8';
    ctx.fillRect(0, 0, baseW, baseH);

    // Clean Perforated Receipt Teeth (Top & Bottom)
    const toothW = 16;
    const toothH = 8;
    ctx.fillStyle = '#F4F4F5';

    ctx.beginPath();
    for (let x = 0; x < baseW; x += toothW) {
      ctx.lineTo(x + toothW / 2, toothH);
      ctx.lineTo(Math.min(baseW, x + toothW), 0);
    }
    ctx.lineTo(baseW, toothH);
    ctx.lineTo(0, toothH);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    for (let x = 0; x < baseW; x += toothW) {
      ctx.lineTo(x + toothW / 2, baseH - toothH);
      ctx.lineTo(Math.min(baseW, x + toothW), baseH);
    }
    ctx.lineTo(baseW, baseH - toothH);
    ctx.lineTo(0, baseH - toothH);
    ctx.closePath();
    ctx.fill();

    // 1. Top Acid Lime Header Badge
    const badgeW = availW;
    const badgeH = 26;
    ctx.fillStyle = '#000000';
    ctx.fillRect(paddingX + 3.5, paddingY + 3.5, badgeW, badgeH);
    ctx.fillStyle = '#D4FF00'; // High-voltage Acid Lime
    ctx.fillRect(paddingX, paddingY, badgeW, badgeH);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(paddingX, paddingY, badgeW, badgeH);

    ctx.fillStyle = '#000000';
    ctx.font = '900 10.5px "Space Grotesk", sans-serif';
    ctx.fillText(incRecipe ? '★ TOKYO STREETWEAR // BARISTA RECIPE ★' : '★ TOKYO SPECIALTY // BEAN ARCHIVE ★', paddingX + 12, paddingY + 17);

    // 2. Massive Bold Title
    ctx.fillStyle = '#09090B';
    drawFittedText(coffeeName.toUpperCase(), paddingX, paddingY + 68, availW, 30, '"Space Grotesk", sans-serif', '900');

    // 3. Metadata Tag Pills with Drop Shadows
    const tagY = paddingY + 84;
    const tags = [
      { text: origin.toUpperCase(), bg: '#FF3B14', color: '#FFF' },
      { text: process.toUpperCase(), bg: '#FFFFFF', color: '#000' },
      { text: altitude, bg: '#D8B4FE', color: '#000' },
      { text: roaster.toUpperCase(), bg: '#D4FF00', color: '#000' }
    ];

    let curTagX = paddingX;
    tags.forEach(t => {
      ctx.font = '900 9.5px "Space Grotesk", sans-serif';
      const tw = ctx.measureText(t.text).width + 16;
      if (curTagX + tw < paddingX + availW) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(curTagX + 2.5, tagY + 2.5, tw, 22);
        ctx.fillStyle = t.bg;
        ctx.fillRect(curTagX, tagY, tw, 22);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(curTagX, tagY, tw, 22);

        ctx.fillStyle = t.color;
        ctx.fillText(t.text, curTagX + 8, tagY + 15);
        curTagX += tw + 8;
      }
    });

    // -----------------------------------------------------------------------
    // MODE A: SOLO GRANO (TERROIR & CUPPING SHOWCASE)
    // -----------------------------------------------------------------------
    if (!incRecipe) {
      // 1. Roastery Spec Strip
      const stripY = paddingY + 118;
      const stripH = 40;

      ctx.fillStyle = '#000000';
      ctx.fillRect(paddingX + 3.5, stripY + 3.5, availW, stripH);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(paddingX, stripY, availW, stripH);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(paddingX, stripY, availW, stripH);

      ctx.fillStyle = '#000000';
      ctx.font = '900 11px "Space Grotesk", sans-serif';
      ctx.fillText('SHIBUYA DISTRICT // 100% ARABICA SPECIALTY', paddingX + 14, stripY + 25);

      const sBadgeW = 120;
      const sBadgeH = 26;
      const sBadgeX = paddingX + availW - sBadgeW - 8;
      const sBadgeY = stripY + 7;
      ctx.fillStyle = '#000000';
      ctx.fillRect(sBadgeX + 2, sBadgeY + 2, sBadgeW, sBadgeH);
      ctx.fillStyle = '#D4FF00';
      ctx.fillRect(sBadgeX, sBadgeY, sBadgeW, sBadgeH);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(sBadgeX, sBadgeY, sBadgeW, sBadgeH);

      ctx.fillStyle = '#000000';
      ctx.font = '900 10.5px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`SCA SCORE: ${scaScore}★`, sBadgeX + sBadgeW / 2, sBadgeY + 17);
      ctx.textAlign = 'left';

      // 2. Terroir Bento Grid (2x2)
      const matY = stripY + stripH + 14;
      const matGap = 10;
      const colW = (availW - matGap) / 2;
      const colH = 88;

      const terroirMetrics = [
        { lbl: 'PRODUCTOR & FINCA', val: producer.toUpperCase(), sub: origin.toUpperCase(), bg: '#D4FF00', col: '#000' },
        { lbl: 'ALTITUD & TERROIR', val: altitude, sub: 'VOLCANIC SOIL // HIGH ELEVATION', bg: '#FFFFFF', col: '#000' },
        { lbl: 'VARIEDAD BOTÁNICA', val: variety.toUpperCase(), sub: '100% ARABICA SPECIALTY', bg: '#FF3B14', col: '#FFF' },
        { lbl: 'BENEFICIO / PROCESO', val: process.toUpperCase(), sub: 'CONTROLLED FERMENTATION', bg: '#D8B4FE', col: '#000' }
      ];

      terroirMetrics.forEach((m, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const mx = paddingX + col * (colW + matGap);
        const my = matY + row * (colH + matGap);

        ctx.fillStyle = '#000000';
        ctx.fillRect(mx + 3.5, my + 3.5, colW, colH);

        ctx.fillStyle = m.bg;
        ctx.fillRect(mx, my, colW, colH);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(mx, my, colW, colH);

        ctx.fillStyle = m.col;
        ctx.font = '900 8.5px "Space Grotesk", sans-serif';
        ctx.fillText(m.lbl, mx + 12, my + 20);

        ctx.font = '900 14px "Space Grotesk", sans-serif';
        drawTruncatedText(m.val, mx + 12, my + 48, colW - 24);

        ctx.font = '800 8px monospace';
        drawTruncatedText(m.sub, mx + 12, my + 70, colW - 24);
      });

      // 3. Sensory Pop Bars
      const specY = matY + (colH * 2) + matGap + 12;
      const specH = 106;

      ctx.fillStyle = '#000000';
      ctx.fillRect(paddingX + 3.5, specY + 3.5, availW, specH);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(paddingX, specY, availW, specH);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(paddingX, specY, availW, specH);

      ctx.fillStyle = '#000000';
      ctx.font = '900 10px "Space Grotesk", sans-serif';
      ctx.fillText('⚡ PERFIL SENSORIAL // ATTRIBUTE METERS:', paddingX + 12, specY + 20);

      const neoBars = [
        { name: 'ACIDEZ', level: 0.90, desc: 'Brillante', bg: '#D4FF00' },
        { name: 'DULZOR', level: 0.92, desc: 'Caramelo & Miel', bg: '#FF3B14' },
        { name: 'CUERPO', level: 0.82, desc: 'Sedoso', bg: '#D8B4FE' },
        { name: 'BALANCE', level: 0.95, desc: 'Excepcional', bg: '#67E8F9' }
      ];

      neoBars.forEach((a, i) => {
        const ax = paddingX + 12;
        const ay = specY + 38 + (i * 16);
        ctx.fillStyle = '#000000';
        ctx.font = '900 8.5px "Space Grotesk", sans-serif';
        ctx.fillText(a.name, ax, ay);

        const barX = ax + 56;
        const barW = availW - 170;
        ctx.fillStyle = '#F4F4F5';
        ctx.fillRect(barX, ay - 7, barW, 7);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, ay - 7, barW, 7);

        ctx.fillStyle = a.bg;
        ctx.fillRect(barX, ay - 7, barW * a.level, 7);
        ctx.strokeRect(barX, ay - 7, barW * a.level, 7);

        ctx.fillStyle = '#000000';
        ctx.font = '700 8px "Space Grotesk", sans-serif';
        ctx.fillText(a.desc, barX + barW + 8, ay);
      });

      // 4. Flavor Pop Stickers Bento
      const notesY = specY + specH + 12;
      const notesH = 82;

      ctx.fillStyle = '#000000';
      ctx.fillRect(paddingX + 3.5, notesY + 3.5, availW, notesH);
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(paddingX, notesY, availW, notesH);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(paddingX, notesY, availW, notesH);

      ctx.fillStyle = '#000000';
      ctx.font = '900 10px "Space Grotesk", sans-serif';
      ctx.fillText('⚡ NOTAS DE CATA // POP STICKERS:', paddingX + 12, notesY + 20);

      let pillX = paddingX + 12;
      const pillY = notesY + 34;
      const pillColors = ['#D4FF00', '#FF3B14', '#D8B4FE', '#67E8F9', '#FED7AA'];

      const displayTags = flavorTags.length > 0 ? flavorTags : ['Notas Limpias', 'Balance', 'Dulzor Frutal'];
      displayTags.slice(0, 4).forEach((tag, idx) => {
        const bgCol = pillColors[idx % pillColors.length];
        ctx.font = '900 10px "Space Grotesk", sans-serif';
        const pw = ctx.measureText(tag.toUpperCase()).width + 16;

        if (pillX + pw < paddingX + availW - 12) {
          ctx.fillStyle = '#000000';
          ctx.fillRect(pillX + 2, pillY + 2, pw, 24);
          ctx.fillStyle = bgCol;
          ctx.fillRect(pillX, pillY, pw, 24);
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          ctx.strokeRect(pillX, pillY, pw, 24);

          ctx.fillStyle = bgCol === '#FF3B14' ? '#FFFFFF' : '#000000';
          ctx.fillText(tag.toUpperCase(), pillX + 8, pillY + 16);

          pillX += pw + 10;
        }
      });

      // 5. Cellar vault pill
      const vaultY = notesY + notesH + 10;
      ctx.fillStyle = '#000000';
      ctx.fillRect(paddingX + 2, vaultY + 2, availW, 26);
      ctx.fillStyle = '#D4FF00';
      ctx.fillRect(paddingX, vaultY, availW, 26);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(paddingX, vaultY, availW, 26);

      ctx.fillStyle = '#000000';
      ctx.font = '900 9px "Space Grotesk", sans-serif';
      ctx.fillText(`❄️ BODEGA BEANTAG: ${dosesStr} • VACÍO -18°C`, paddingX + 12, vaultY + 17);
    }

    // -----------------------------------------------------------------------
    // MODE B: CON RECETA (BARISTA EXTRACTION PROTOCOL)
    // -----------------------------------------------------------------------
    else {
      // 1. Barista Order Strip
      const stripY = paddingY + 118;
      const stripH = 40;

      ctx.fillStyle = '#000000';
      ctx.fillRect(paddingX + 3.5, stripY + 3.5, availW, stripH);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(paddingX, stripY, availW, stripH);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(paddingX, stripY, availW, stripH);

      ctx.fillStyle = '#000000';
      ctx.font = '900 11px "Space Grotesk", sans-serif';
      ctx.fillText('SHIBUYA DISTRICT // BARISTA EXTRACTION ORDER', paddingX + 14, stripY + 25);

      const sBadgeW = 120;
      const sBadgeH = 26;
      const sBadgeX = paddingX + availW - sBadgeW - 8;
      const sBadgeY = stripY + 7;
      ctx.fillStyle = '#000000';
      ctx.fillRect(sBadgeX + 2, sBadgeY + 2, sBadgeW, sBadgeH);
      ctx.fillStyle = '#D4FF00';
      ctx.fillRect(sBadgeX, sBadgeY, sBadgeW, sBadgeH);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(sBadgeX, sBadgeY, sBadgeW, sBadgeH);

      ctx.fillStyle = '#000000';
      ctx.font = '900 10.5px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`SCA SCORE: ${scaScore}★`, sBadgeX + sBadgeW / 2, sBadgeY + 17);
      ctx.textAlign = 'left';

      // 2. 4 Extraction Parameter Bento Tiles (2x2) with PURE TYPOGRAPHY
      const bentoY = stripY + stripH + 14;
      const bentoGap = 10;
      const colW = (availW - bentoGap) / 2;
      const colH = 92;

      const metrics = [
        { lbl: 'MÉTODO // EXT', val: methodStr.toUpperCase(), sub: 'CONICAL 60° // ORDER READY', bg: '#D4FF00', valColor: '#000000' },
        { lbl: 'RATIO // FORMULA', val: `1:${ratioStr.replace('1:', '')}`, sub: `${coffeeG}g IN ➔ ${waterG}g OUT`, bg: '#FFFFFF', valColor: '#000000' },
        { lbl: 'MOLIENDA // CALIBRATION', val: `${microns} µm`, sub: grindStr.toUpperCase(), bg: '#FF3B14', valColor: '#FFFFFF' },
        { lbl: 'TIEMPO & TEMPERATURA', val: `${timeStr} MIN`, sub: `${tempStr} • EXTRACCIÓN ACTIVA`, bg: '#FFFFFF', valColor: '#000000' }
      ];

      metrics.forEach((m, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const mx = paddingX + col * (colW + bentoGap);
        const my = bentoY + row * (colH + bentoGap);

        ctx.fillStyle = '#000000';
        ctx.fillRect(mx + 3.5, my + 3.5, colW, colH);

        ctx.fillStyle = m.bg;
        ctx.fillRect(mx, my, colW, colH);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(mx, my, colW, colH);

        ctx.fillStyle = m.valColor;
        ctx.font = '900 8.5px "Space Grotesk", sans-serif';
        ctx.fillText(m.lbl, mx + 14, my + 22);

        ctx.font = '900 18px "Space Grotesk", sans-serif';
        drawTruncatedText(m.val, mx + 14, my + 52, colW - 28);

        ctx.font = '800 8.5px monospace';
        drawTruncatedText(m.sub, mx + 14, my + 74, colW - 28);
      });

      // 3. Flavor Notes Pop Stickers Bento
      const notesY = bentoY + (colH * 2) + bentoGap + 12;
      const notesH = 84;

      ctx.fillStyle = '#000000';
      ctx.fillRect(paddingX + 3.5, notesY + 3.5, availW, notesH);
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(paddingX, notesY, availW, notesH);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(paddingX, notesY, availW, notesH);

      ctx.fillStyle = '#000000';
      ctx.font = '900 10px "Space Grotesk", sans-serif';
      ctx.fillText('⚡ NOTAS DE CATA // SENSORY STICKERS:', paddingX + 12, notesY + 20);

      let pillX = paddingX + 12;
      const pillY = notesY + 34;
      const pillColors = ['#D4FF00', '#FF3B14', '#D8B4FE', '#67E8F9', '#FED7AA'];

      const displayTags = flavorTags.length > 0 ? flavorTags : ['Notas Limpias', 'Balance', 'Dulzor Frutal'];
      displayTags.slice(0, 4).forEach((tag, idx) => {
        const bgCol = pillColors[idx % pillColors.length];
        ctx.font = '900 10px "Space Grotesk", sans-serif';
        const pw = ctx.measureText(tag.toUpperCase()).width + 16;

        if (pillX + pw < paddingX + availW - 12) {
          ctx.fillStyle = '#000000';
          ctx.fillRect(pillX + 2, pillY + 2, pw, 24);
          ctx.fillStyle = bgCol;
          ctx.fillRect(pillX, pillY, pw, 24);
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          ctx.strokeRect(pillX, pillY, pw, 24);

          ctx.fillStyle = bgCol === '#FF3B14' ? '#FFFFFF' : '#000000';
          ctx.fillText(tag.toUpperCase(), pillX + 8, pillY + 16);

          pillX += pw + 10;
        }
      });

      // 4. Barista Pour Timeline Strip
      const flowY = notesY + notesH + 12;
      const flowH = 68;

      ctx.fillStyle = '#000000';
      ctx.fillRect(paddingX + 3.5, flowY + 3.5, availW, flowH);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(paddingX, flowY, availW, flowH);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(paddingX, flowY, availW, flowH);

      ctx.fillStyle = '#000000';
      ctx.font = '900 9px "Space Grotesk", sans-serif';
      ctx.fillText('⏱ PROTOCOLO DE VERTIDO // POUR TIMELINE:', paddingX + 12, flowY + 18);

      const stepW = (availW - 24 - 16) / 3;
      const steps = [
        { title: 'BLOOM (0:00)', desc: '45g • 40 seg' },
        { title: 'EXTRACCIÓN (0:45)', desc: '+95g continuo' },
        { title: 'FINAL (1:30)', desc: `${waterG}g • drawdown` }
      ];

      steps.forEach((s, idx) => {
        const sx = paddingX + 12 + idx * (stepW + 8);
        const sy = flowY + 28;
        ctx.fillStyle = '#F4F4F5';
        ctx.fillRect(sx, sy, stepW, 30);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(sx, sy, stepW, 30);

        ctx.fillStyle = '#000000';
        ctx.font = '900 8px "Space Grotesk", sans-serif';
        ctx.fillText(s.title, sx + 6, sy + 13);
        ctx.font = '700 8px monospace';
        ctx.fillText(s.desc, sx + 6, sy + 24);
      });
    }

    // Authentic POS Barcode (Bottom)
    const bcY = baseH - paddingY - 38;
    const barPattern = [3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 4, 1, 3];
    let curBarX = paddingX;
    ctx.fillStyle = '#000000';
    barPattern.forEach((w, i) => {
      if (i % 2 === 0) {
        ctx.fillRect(curBarX, bcY, w * 2.2, 22);
      }
      curBarX += (w * 2.2) + 2;
    });

    ctx.fillStyle = '#000000';
    ctx.font = '900 9.5px "Space Grotesk", sans-serif';
    ctx.fillText(`BEANTAG SPECIALTY // ARCHIVE 2027`, curBarX + 12, bcY + 15);
  }

  // =========================================================================
  // 3. STYLE: HOLOGRAPHIC AURORA (VISIONOS DARK GLASS)
  // =========================================================================
  else if (style === 'aurora') {
    // Obsidian Deep Space Base
    ctx.fillStyle = '#06070B';
    ctx.fillRect(0, 0, baseW, baseH);

    // Multi-Layered Glowing Nebulas
    const grad1 = ctx.createRadialGradient(baseW * 0.85, 140, 0, baseW * 0.85, 140, 280);
    grad1.addColorStop(0, 'rgba(139, 92, 246, 0.45)');
    grad1.addColorStop(1, 'rgba(139, 92, 246, 0)');
    ctx.fillStyle = grad1;
    ctx.fillRect(0, 0, baseW, baseH);

    const grad2 = ctx.createRadialGradient(baseW * 0.15, baseH * 0.8, 0, baseW * 0.15, baseH * 0.8, 260);
    grad2.addColorStop(0, 'rgba(6, 182, 212, 0.35)');
    grad2.addColorStop(1, 'rgba(6, 182, 212, 0)');
    ctx.fillStyle = grad2;
    ctx.fillRect(0, 0, baseW, baseH);

    const grad3 = ctx.createRadialGradient(baseW * 0.5, baseH * 0.45, 0, baseW * 0.5, baseH * 0.45, 200);
    grad3.addColorStop(0, 'rgba(236, 72, 153, 0.15)');
    grad3.addColorStop(1, 'rgba(236, 72, 153, 0)');
    ctx.fillStyle = grad3;
    ctx.fillRect(0, 0, baseW, baseH);

    // Frosted Glass Outer Shell
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 1.2;
    drawRoundedRect(ctx, paddingX - 8, paddingY - 8, availW + 16, baseH - (paddingY * 2) + 16, 16, true, true);

    // 1. Header Spec
    ctx.fillStyle = '#C084FC';
    ctx.font = '800 8.5px -apple-system, sans-serif';
    ctx.fillText(incRecipe ? 'HOLOGRAPHIC EXTRACTION // BEANTAG VISION' : 'HOLOGRAPHIC TERROIR // BEANTAG VISION', paddingX, paddingY + 14);

    ctx.fillStyle = '#FFFFFF';
    drawFittedText(coffeeName, paddingX, paddingY + 46, availW, 28, '-apple-system, sans-serif', '800');

    ctx.fillStyle = '#CBD5E1';
    ctx.font = '600 10.5px -apple-system, sans-serif';
    drawTruncatedText(`${origin} • ${process} • ${altitude} • ${roaster}`, paddingX, paddingY + 68, availW);

    // -----------------------------------------------------------------------
    // MODE A: SOLO GRANO (TERROIR & CUPPING SHOWCASE)
    // -----------------------------------------------------------------------
    if (!incRecipe) {
      // 1. Luminous Status Capsule
      const specBoxY = paddingY + 84;
      const specBoxH = 36;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.35)';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, paddingX, specBoxY, availW, specBoxH, 10, true, true);

      ctx.fillStyle = '#C084FC';
      ctx.font = '800 9px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`SCA CUPSCORE: ${scaScore}★ • CERTIFIED SENSORIAL CALIBRATION • COFFEA ARABICA`, paddingX + (availW / 2), specBoxY + 22);
      ctx.textAlign = 'left';

      // 2. 4 Terroir Matrix Tiles (2x2)
      const matY = specBoxY + specBoxH + 12;
      const matGap = 10;
      const colW = (availW - matGap) / 2;
      const colH = 88;

      const terroirMetrics = [
        { lbl: 'ORIGEN & PRODUCTOR', val: producer, sub: origin },
        { lbl: 'ALTITUD & TERROIR', val: altitude, sub: 'VOLCANIC SOIL // HIGH ELEVATION' },
        { lbl: 'VARIEDAD BOTÁNICA', val: variety, sub: '100% ARABICA SPECIALTY' },
        { lbl: 'PROCESO DE BENEFICIO', val: process, sub: 'CONTROLLED FERMENTATION' }
      ];

      terroirMetrics.forEach((t, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const mx = paddingX + col * (colW + matGap);
        const my = matY + row * (colH + matGap);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.lineWidth = 1;
        drawRoundedRect(ctx, mx, my, colW, colH, 10, true, true);

        ctx.fillStyle = '#A78BFA';
        ctx.font = '700 8.5px -apple-system, sans-serif';
        ctx.fillText(t.lbl, mx + 14, my + 20);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '800 14px -apple-system, sans-serif';
        drawTruncatedText(t.val, mx + 14, my + 48, colW - 24);

        ctx.fillStyle = '#38BDF8';
        ctx.font = '600 8.5px -apple-system, sans-serif';
        drawTruncatedText(t.sub, mx + 14, my + 70, colW - 24);
      });

      // 3. Sensory Frequency Spectrum Bars
      const specY = matY + (colH * 2) + matGap + 12;
      const specH = 120;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, paddingX, specY, availW, specH, 10, true, true);

      ctx.fillStyle = '#E2E8F0';
      ctx.font = '700 8.5px -apple-system, sans-serif';
      ctx.fillText('ESPECTRO SENSORIAL // FRECUENCIA DE CATA:', paddingX + 14, specY + 20);

      const auroraBars = [
        { name: 'ACIDEZ', level: 0.88, desc: 'Brillante' },
        { name: 'DULZOR', level: 0.92, desc: 'Frutal' },
        { name: 'CUERPO', level: 0.80, desc: 'Sedoso' },
        { name: 'BALANCE', level: 0.94, desc: 'Excepcional' }
      ];

      auroraBars.forEach((a, i) => {
        const ax = paddingX + 14;
        const ay = specY + 40 + (i * 18);
        ctx.fillStyle = '#A78BFA';
        ctx.font = '700 8px -apple-system, sans-serif';
        ctx.fillText(a.name, ax, ay);

        const barX = ax + 54;
        const barW = availW - 170;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.fillRect(barX, ay - 7, barW, 7);

        const barGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
        barGrad.addColorStop(0, '#8B5CF6');
        barGrad.addColorStop(0.5, '#EC4899');
        barGrad.addColorStop(1, '#06B6D4');
        ctx.fillStyle = barGrad;
        ctx.fillRect(barX, ay - 7, barW * a.level, 7);

        ctx.fillStyle = '#CBD5E1';
        ctx.font = '600 8px -apple-system, sans-serif';
        ctx.fillText(a.desc, barX + barW + 8, ay);
      });

      // 4. Aromatic Descriptors Capsule
      const notesY = specY + specH + 12;
      const notesH = 82;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
      drawRoundedRect(ctx, paddingX, notesY, availW, notesH, 10, true, true);

      ctx.fillStyle = '#F472B6';
      ctx.font = '800 8px -apple-system, sans-serif';
      ctx.fillText('NOTAS AROMÁTICAS & DESCRIPTORES:', paddingX + 14, notesY + 18);

      let pillX = paddingX + 14;
      const pillY = notesY + 32;
      const displayTags = flavorTags.length > 0 ? flavorTags : ['Notas Limpias', 'Balance', 'Dulzor Frutal'];
      displayTags.slice(0, 4).forEach((tag) => {
        ctx.font = '700 10px -apple-system, sans-serif';
        const tw = ctx.measureText(tag).width;
        const pw = tw + 18;
        if (pillX + pw <= paddingX + availW - 14) {
          ctx.fillStyle = 'rgba(168, 85, 247, 0.16)';
          ctx.strokeStyle = 'rgba(216, 180, 254, 0.35)';
          ctx.lineWidth = 1;
          drawRoundedRect(ctx, pillX, pillY, pw, 24, 6, true, true);

          ctx.fillStyle = '#F3E8FF';
          ctx.fillText(tag, pillX + 9, pillY + 16);
          pillX += pw + 8;
        }
      });

      // 5. Cryo Vault Bar
      const vaultY = notesY + notesH + 10;
      ctx.fillStyle = 'rgba(6, 182, 212, 0.1)';
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
      drawRoundedRect(ctx, paddingX, vaultY, availW, 30, 8, true, true);

      ctx.fillStyle = '#38BDF8';
      ctx.font = '700 9px -apple-system, sans-serif';
      ctx.fillText(`❄️ CAVA BEANTAG: ${dosesStr} • VACÍO -18°C • CONSERVACIÓN HOLOGRÁFICA`, paddingX + 14, vaultY + 19);
    }

    // -----------------------------------------------------------------------
    // MODE B: CON RECETA (BARISTA EXTRACTION PROTOCOL)
    // -----------------------------------------------------------------------
    else {
      // 1. Extraction Protocol Capsule
      const specBoxY = paddingY + 84;
      const specBoxH = 36;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.35)';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, paddingX, specBoxY, availW, specBoxH, 10, true, true);

      ctx.fillStyle = '#A78BFA';
      ctx.font = '700 9px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`SCA CUPSCORE: ${scaScore}★ • CALIBRACIÓN DE EXTRACCIÓN SENSORIAL`, paddingX + (availW / 2), specBoxY + 22);
      ctx.textAlign = 'left';

      // 2. 4 Frosted Glass Parameter Tiles (2x2) with PURE TYPOGRAPHY
      const bentoY = specBoxY + specBoxH + 12;
      const bentoGap = 10;
      const colW = (availW - bentoGap) / 2;
      const colH = 92;

      const metrics = [
        { lbl: 'MÉTODO // FILTRO', val: methodStr, sub: 'CONICAL 60° // CALIBRACIÓN' },
        { lbl: 'RATIO // DOSIS', val: `1:${ratioStr.replace('1:', '')}`, sub: `${coffeeG}g IN ➔ ${waterG}g AGUA` },
        { lbl: 'MOLIENDA // TAMAÑO', val: `${microns} µm`, sub: grindStr },
        { lbl: 'TIEMPO & TEMPERATURA', val: `${timeStr} MIN`, sub: `${tempStr} • EXTRACCIÓN CLARA` }
      ];

      metrics.forEach((m, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const mx = paddingX + col * (colW + bentoGap);
        const my = bentoY + row * (colH + bentoGap);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.lineWidth = 1;
        drawRoundedRect(ctx, mx, my, colW, colH, 10, true, true);

        ctx.fillStyle = '#A78BFA';
        ctx.font = '700 8px -apple-system, sans-serif';
        ctx.fillText(m.lbl, mx + 14, my + 22);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '800 18px -apple-system, sans-serif';
        drawTruncatedText(m.val, mx + 14, my + 52, colW - 28);

        ctx.fillStyle = '#38BDF8';
        ctx.font = '600 8.5px -apple-system, sans-serif';
        drawTruncatedText(m.sub, mx + 14, my + 74, colW - 28);
      });

      // 3. Waveform Extraction Curve Bar
      const waveY = bentoY + (colH * 2) + bentoGap + 12;
      const waveH = 58;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, paddingX, waveY, availW, waveH, 10, true, true);

      ctx.fillStyle = '#E2E8F0';
      ctx.font = '700 8.5px -apple-system, sans-serif';
      ctx.fillText('CURVA DE EXTRACCIÓN SENSORIAL // CLARIDAD & BALANCE', paddingX + 14, waveY + 18);

      const barX = paddingX + 14;
      const barY = waveY + 28;
      const barW = availW - 28;
      const barGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
      barGrad.addColorStop(0, '#8B5CF6');
      barGrad.addColorStop(0.5, '#EC4899');
      barGrad.addColorStop(1, '#06B6D4');
      ctx.fillStyle = barGrad;
      drawRoundedRect(ctx, barX, barY, barW, 9, 4, true, false);

      // 4. Aromatic Descriptors
      const notesY = waveY + waveH + 12;
      const notesH = 80;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      drawRoundedRect(ctx, paddingX, notesY, availW, notesH, 10, true, true);

      ctx.fillStyle = '#F472B6';
      ctx.font = '800 8px -apple-system, sans-serif';
      ctx.fillText('NOTAS AROMÁTICAS & DESCRIPTORES:', paddingX + 14, notesY + 18);

      let pillX = paddingX + 14;
      const pillY = notesY + 32;
      const displayTags = flavorTags.length > 0 ? flavorTags : ['Notas Limpias', 'Balance', 'Claridad'];
      displayTags.slice(0, 4).forEach((tag) => {
        ctx.font = '700 10px -apple-system, sans-serif';
        const tw = ctx.measureText(tag).width;
        const pw = tw + 18;
        if (pillX + pw <= paddingX + availW - 14) {
          ctx.fillStyle = 'rgba(168, 85, 247, 0.16)';
          ctx.strokeStyle = 'rgba(216, 180, 254, 0.35)';
          ctx.lineWidth = 1;
          drawRoundedRect(ctx, pillX, pillY, pw, 24, 6, true, true);

          ctx.fillStyle = '#F3E8FF';
          ctx.fillText(tag, pillX + 9, pillY + 16);
          pillX += pw + 8;
        }
      });
    }

    // VisionOS Footer
    const footY = baseH - paddingY - 24;
    ctx.fillStyle = '#94A3B8';
    ctx.font = '500 9px -apple-system, sans-serif';
    ctx.fillText(`BEANTAG VISION 2027 • CALIBRACIÓN HOLOGRÁFICA • SPECIALTY COFFEE`, paddingX, footY + 12);
  }

  // =========================================================================
  // 4. STYLE: HANGTAG NÓRDICO (TIM WENDELBOE / SEY ATELIER)
  // =========================================================================
  else if (style === 'hangtag') {
    // Ivory Cotton Textured Paper
    ctx.fillStyle = '#F8F5EE';
    ctx.fillRect(0, 0, baseW, baseH);

    // Natural Cotton Canvas Body
    ctx.fillStyle = '#FAF8F5';
    ctx.fillRect(0, 0, baseW, baseH);

    // Single Refined Hairline Border
    ctx.strokeStyle = '#E5E0D8';
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, paddingX - 8, paddingY - 8, availW + 16, baseH - (paddingY * 2) + 16, 8, false, true);

    // 1. Refined Editorial Top Seal & Micro-Header
    ctx.fillStyle = '#78716C';
    ctx.font = '800 8.5px "Playfair Display", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('BEANTAG SPECIALTY ATELIER // ARCHIVO DE FINCA', baseW / 2, paddingY + 18);
    ctx.textAlign = 'left';

    // 2. Main Serif Title (WCAG AAA High-Contrast Charcoal)
    ctx.fillStyle = '#1C1917';
    drawFittedText(coffeeName, paddingX, paddingY + 48, availW, 28, '"Playfair Display", Georgia, serif', 'bold');

    // Terroir Subtitle
    ctx.fillStyle = '#57534E';
    ctx.font = 'italic 11px "Playfair Display", Georgia, serif';
    drawTruncatedText(`${origin} — ${producer || roaster}${altitude ? ' — ' + altitude : ''}`, paddingX, paddingY + 70, availW);

    ctx.strokeStyle = '#E5E0D8';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(paddingX, paddingY + 80);
    ctx.lineTo(baseW - paddingX, paddingY + 80);
    ctx.stroke();

    // -----------------------------------------------------------------------
    // MODE A: SOLO GRANO (TERROIR & CUPPING SHOWCASE)
    // -----------------------------------------------------------------------
    if (!incRecipe) {
      // 1. Atelier Specification Ledger Strip
      const stripY = paddingY + 90;
      const stripH = 34;

      ctx.fillStyle = '#F5F2EB';
      ctx.strokeStyle = '#E5E0D8';
      ctx.lineWidth = 0.8;
      drawRoundedRect(ctx, paddingX, stripY, availW, stripH, 5, true, true);

      ctx.fillStyle = '#78716C';
      ctx.font = 'italic 8.5px "Playfair Display", Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(`HERBARIUM BOTANIQUE // COFFEA ARABICA VAR. ${variety.toUpperCase()} // SCA ${scaScore}★`, baseW / 2, stripY + 21);
      ctx.textAlign = 'left';

      // 2. Terroir Ledger Matrix (2x2)
      const matY = stripY + stripH + 12;
      const matGap = 8;
      const colW = (availW - matGap) / 2;
      const colH = 86;

      const terroirItems = [
        { lbl: 'ORIGEN & FINCA', val: origin, sub: producer || roaster },
        { lbl: 'ALTITUD & TERROIR', val: altitude || '1800m', sub: 'Terroir de alta montaña' },
        { lbl: 'VARIEDAD BOTÁNICA', val: variety || 'Arábica', sub: 'Lote seleccionado' },
        { lbl: 'PROCESO & BENEFICIO', val: process || 'Lavado', sub: 'Cosecha manual artesanal' }
      ];

      terroirItems.forEach((t, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const mx = paddingX + col * (colW + matGap);
        const my = matY + row * (colH + matGap);

        ctx.fillStyle = '#F5F2EB';
        ctx.strokeStyle = '#E5E0D8';
        ctx.lineWidth = 0.8;
        drawRoundedRect(ctx, mx, my, colW, colH, 5, true, true);

        ctx.fillStyle = '#78716C';
        ctx.font = '700 8px "Playfair Display", Georgia, serif';
        ctx.fillText(t.lbl, mx + 12, my + 18);

        ctx.fillStyle = '#1C1917';
        ctx.font = 'bold 14px "Playfair Display", Georgia, serif';
        drawTruncatedText(t.val, mx + 12, my + 46, colW - 24);

        ctx.fillStyle = '#8C827A';
        ctx.font = 'italic 8.5px "Playfair Display", Georgia, serif';
        drawTruncatedText(t.sub, mx + 12, my + 68, colW - 24);
      });

      // 3. Sensory Notes Pills Section
      const notesBoxY = matY + (colH * 2) + matGap + 10;
      const notesH = 92;
      ctx.fillStyle = '#FAF8F5';
      ctx.strokeStyle = '#E5E0D8';
      ctx.lineWidth = 0.8;
      drawRoundedRect(ctx, paddingX, notesBoxY, availW, notesH, 5, true, true);

      ctx.fillStyle = '#78716C';
      ctx.font = '800 8.5px "Playfair Display", Georgia, serif';
      ctx.fillText('NOTAS SENSORIALES // PERFIL EN TAZA', paddingX + 12, notesBoxY + 20);

      const sensoryPillY = notesBoxY + 34;
      let pillX = paddingX + 12;
      const pillH = 24;
      const displayNotes = flavorTags.length > 0 ? flavorTags.slice(0, 5) : ['Notas Limpias', 'Balance', 'Dulzor Natural'];

      displayNotes.forEach((tag) => {
        ctx.font = 'bold 9.5px "Playfair Display", Georgia, serif';
        const textW = ctx.measureText(tag).width;
        const pillW = textW + 18;
        if (pillX + pillW <= paddingX + availW - 12) {
          ctx.fillStyle = 'rgba(120, 53, 15, 0.06)';
          ctx.strokeStyle = 'rgba(120, 53, 15, 0.2)';
          ctx.lineWidth = 0.8;
          drawRoundedRect(ctx, pillX, sensoryPillY, pillW, pillH, 4, true, true);

          ctx.fillStyle = '#78350F';
          ctx.fillText(tag, pillX + 9, sensoryPillY + 16);

          pillX += pillW + 8;
        }
      });

      // 4. Cupping Balance Ledger
      const specY = notesBoxY + notesH + 10;
      const specH = 76;
      ctx.fillStyle = '#F5F2EB';
      ctx.strokeStyle = '#E5E0D8';
      ctx.lineWidth = 0.8;
      drawRoundedRect(ctx, paddingX, specY, availW, specH, 5, true, true);

      ctx.fillStyle = '#78716C';
      ctx.font = '800 8px "Playfair Display", Georgia, serif';
      ctx.fillText('ANALYSE SENSORIELLE // ÉQUILIBRE DU TERROIR:', paddingX + 12, specY + 18);

      ctx.font = 'italic 8.5px "Playfair Display", Georgia, serif';
      ctx.fillStyle = '#57534E';
      ctx.fillText('Corps: Soyeux et velouté • Texture noble et enveloppante', paddingX + 12, specY + 36);
      ctx.fillText('Acidité: Brillante et florale • Notes d\'agrumes nobles et fruits doux', paddingX + 12, specY + 52);
      ctx.fillText('Douceur: Panela et miel d\'oranger • Finale persistante et propre', paddingX + 12, specY + 68);

      // 5. Cellar Vacuum Sealed Doses Bar
      const cellarY = specY + specH + 10;
      const cellarH = 34;
      ctx.fillStyle = '#F2EFE7';
      ctx.strokeStyle = '#E5E0D8';
      ctx.lineWidth = 0.8;
      drawRoundedRect(ctx, paddingX, cellarY, availW, cellarH, 4, true, true);

      ctx.fillStyle = '#3F6212';
      ctx.font = 'bold 9.5px "Playfair Display", Georgia, serif';
      ctx.fillText(`❄️ CAVA BEANTAG: ${dosesStr} • DOSIS CONGELADAS AL VACÍO`, paddingX + 12, cellarY + 21);

      if (scaScore && scaScore !== '—') {
        ctx.fillStyle = '#78350F';
        ctx.textAlign = 'right';
        ctx.fillText(`SCA ${scaScore}★`, paddingX + availW - 12, cellarY + 21);
        ctx.textAlign = 'left';
      }

      // 6. Vector Seal & Atelier Footer
      const footY = cellarY + cellarH + 12;
      drawVectorSeal(ctx, baseW - paddingX - 28, footY + 14, 18);

      ctx.fillStyle = '#78716C';
      ctx.font = '600 8px "Playfair Display", Georgia, serif';
      ctx.fillText(`BEANTAG SPECIALTY ATELIER // ARCHIVO ${new Date().getFullYear()} // LOT ARTISANAL`, paddingX, footY + 18);
    }

    // -----------------------------------------------------------------------
    // MODE B: CON RECETA (BARISTA EXTRACTION PROTOCOL)
    // -----------------------------------------------------------------------
    else {
      // 1. Extraction Protocol Ledger Strip
      const stripY = paddingY + 90;
      const stripH = 34;

      ctx.fillStyle = '#F5F2EB';
      ctx.strokeStyle = '#E5E0D8';
      ctx.lineWidth = 0.8;
      drawRoundedRect(ctx, paddingX, stripY, availW, stripH, 5, true, true);

      ctx.fillStyle = '#78716C';
      ctx.font = 'italic 8.5px "Playfair Display", Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(`PROTOCOLE BARISTA // CALIBRATION D'EXTRACTION // SCA ${scaScore}★`, baseW / 2, stripY + 21);
      ctx.textAlign = 'left';

      // 2. 4 Metric Tiles (2x2) with PURE TYPOGRAPHY
      const bentoY = stripY + stripH + 12;
      const bentoGap = 8;
      const colW = (availW - bentoGap) / 2;
      const colH = 92;

      const metrics = [
        { lbl: 'MÉTODO // EXTRACTION', val: methodStr, sub: 'Extraction filtre artisanale' },
        { lbl: 'RATIO // PROPORTION', val: `1:${ratioStr.replace('1:', '')}`, sub: `${coffeeG}g café ➔ ${waterG}g eau` },
        { lbl: 'MOUTURE // MICRONS', val: `${microns} µm`, sub: grindStr },
        { lbl: 'TEMPS & TEMPÉRATURE', val: `${timeStr} MIN`, sub: `${tempStr} • Débit régulier` }
      ];

      metrics.forEach((m, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const mx = paddingX + col * (colW + bentoGap);
        const my = bentoY + row * (colH + bentoGap);

        ctx.fillStyle = '#F5F2EB';
        ctx.strokeStyle = '#E5E0D8';
        ctx.lineWidth = 0.8;
        drawRoundedRect(ctx, mx, my, colW, colH, 5, true, true);

        ctx.fillStyle = '#78716C';
        ctx.font = '700 8px "Playfair Display", Georgia, serif';
        ctx.fillText(m.lbl, mx + 12, my + 20);

        ctx.fillStyle = '#1C1917';
        ctx.font = 'bold 18px "Playfair Display", Georgia, serif';
        drawTruncatedText(m.val, mx + 12, my + 50, colW - 24);

        ctx.fillStyle = '#8C827A';
        ctx.font = 'italic 8.5px "Playfair Display", Georgia, serif';
        drawTruncatedText(m.sub, mx + 12, my + 72, colW - 24);
      });

      // 3. Pouring Stages Timeline
      const flowY = bentoY + (colH * 2) + bentoGap + 10;
      const flowH = 64;

      ctx.fillStyle = '#F5F2EB';
      ctx.strokeStyle = '#E5E0D8';
      ctx.lineWidth = 0.8;
      drawRoundedRect(ctx, paddingX, flowY, availW, flowH, 5, true, true);

      ctx.fillStyle = '#78716C';
      ctx.font = '700 8px "Playfair Display", Georgia, serif';
      ctx.fillText('CHRONOLOGIE DE VERSÉE // POUR TIMELINE:', paddingX + 12, flowY + 18);

      const stepW = (availW - 24 - 16) / 3;
      const steps = [
        { title: 'Bloom (0:00)', desc: '45g eau' },
        { title: 'Versée 1 (0:45)', desc: '+95g continu' },
        { title: 'Finale (1:30)', desc: `${waterG}g total` }
      ];

      steps.forEach((s, idx) => {
        const sx = paddingX + 12 + idx * (stepW + 8);
        const sy = flowY + 26;
        ctx.fillStyle = '#FAF8F5';
        ctx.fillRect(sx, sy, stepW, 28);
        ctx.strokeStyle = '#E5E0D8';
        ctx.lineWidth = 0.8;
        ctx.strokeRect(sx, sy, stepW, 28);

        ctx.fillStyle = '#1C1917';
        ctx.font = 'bold 8.5px "Playfair Display", Georgia, serif';
        ctx.fillText(s.title, sx + 6, sy + 12);
        ctx.fillStyle = '#8C827A';
        ctx.font = 'italic 8px "Playfair Display", Georgia, serif';
        ctx.fillText(s.desc, sx + 6, sy + 22);
      });

      // 4. Sensory Notes Pills Section
      const notesBoxY = flowY + flowH + 10;
      const notesH = 80;
      ctx.fillStyle = '#FAF8F5';
      ctx.strokeStyle = '#E5E0D8';
      ctx.lineWidth = 0.8;
      drawRoundedRect(ctx, paddingX, notesBoxY, availW, notesH, 5, true, true);

      ctx.fillStyle = '#78716C';
      ctx.font = '800 8.5px "Playfair Display", Georgia, serif';
      ctx.fillText('NOTAS SENSORIALES // PERFIL EN TAZA', paddingX + 12, notesBoxY + 18);

      const sensoryPillY = notesBoxY + 30;
      let pillX = paddingX + 12;
      const pillH = 24;
      const displayNotes = flavorTags.length > 0 ? flavorTags.slice(0, 5) : ['Notas Limpias', 'Balance', 'Claridad'];

      displayNotes.forEach((tag) => {
        ctx.font = 'bold 9.5px "Playfair Display", Georgia, serif';
        const textW = ctx.measureText(tag).width;
        const pillW = textW + 18;
        if (pillX + pillW <= paddingX + availW - 12) {
          ctx.fillStyle = 'rgba(120, 53, 15, 0.06)';
          ctx.strokeStyle = 'rgba(120, 53, 15, 0.2)';
          ctx.lineWidth = 0.8;
          drawRoundedRect(ctx, pillX, sensoryPillY, pillW, pillH, 4, true, true);

          ctx.fillStyle = '#78350F';
          ctx.fillText(tag, pillX + 9, sensoryPillY + 16);

          pillX += pillW + 8;
        }
      });

      // 5. Tasting Balance
      const specY = notesBoxY + notesH + 10;
      const specH = 46;
      ctx.fillStyle = '#F5F2EB';
      ctx.strokeStyle = '#E5E0D8';
      ctx.lineWidth = 0.8;
      drawRoundedRect(ctx, paddingX, specY, availW, specH, 5, true, true);

      ctx.fillStyle = '#57534E';
      ctx.font = 'italic 8.5px "Playfair Display", Georgia, serif';
      ctx.fillText('Équilibre d\'extraction: Clarté aromatique remarquable et texture soyeuse', paddingX + 12, specY + 20);
      ctx.fillText('Acidité citrique noble et finale sucrée persistante', paddingX + 12, specY + 34);

      // 6. Cellar Stock Bar
      const cellarY = specY + specH + 8;
      const cellarH = 30;
      ctx.fillStyle = '#F2EFE7';
      ctx.strokeStyle = '#E5E0D8';
      ctx.lineWidth = 0.8;
      drawRoundedRect(ctx, paddingX, cellarY, availW, cellarH, 4, true, true);

      ctx.fillStyle = '#3F6212';
      ctx.font = 'bold 9px "Playfair Display", Georgia, serif';
      ctx.fillText(`❄️ CAVA BEANTAG: ${dosesStr} • DOSIS CONGELADAS AL VACÍO`, paddingX + 12, cellarY + 19);

      // 7. Vector Seal & Atelier Footer
      const footY = cellarY + cellarH + 10;
      drawVectorSeal(ctx, baseW - paddingX - 28, footY + 12, 16);

      ctx.fillStyle = '#78716C';
      ctx.font = '600 8px "Playfair Display", Georgia, serif';
      ctx.fillText(`BEANTAG SPECIALTY ATELIER // PROTOCOLE 2027 // LOT ARTISANAL`, paddingX, footY + 16);
    }
  }

  return canvas.toDataURL('image/png', 1.0);
}

/**
 * Generates an Ultra-HD Visual Specialty Coffee Menu Card (Cellar Inventory)
 * Vertical Architecture tailored for mobile sharing with zero dead space.
 */
export async function generateCoffeeMenuCardImage(batches, template = 'blueprint') {
  const style = normalizeCardStyle(template);

  await ensureFontsLoaded();

  const validBatches = Array.isArray(batches) ? batches.filter(b => (b.remaining_doses || b.weight_current_g || 0) > 0) : [];
  const displayList = validBatches.length > 0 ? validBatches : (Array.isArray(batches) ? batches.slice(0, 10) : []);

  const canvas = document.createElement('canvas');
  const scaleFactor = 2;
  const baseW = 540;

  const headerH = 130;
  const itemH = 102;
  const footerH = 70;
  const baseH = Math.max(840, headerH + (displayList.length * itemH) + footerH);

  canvas.width = baseW * scaleFactor;
  canvas.height = baseH * scaleFactor;

  const ctx = canvas.getContext('2d');
  ctx.scale(scaleFactor, scaleFactor);

  const paddingX = 26;
  const paddingY = 26;
  const availW = baseW - (paddingX * 2);

  // 1. BLUEPRINT MENU
  if (style === 'blueprint') {
    ctx.fillStyle = '#06162D';
    ctx.fillRect(0, 0, baseW, baseH);

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.06)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= baseW; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, baseH); ctx.stroke(); }
    for (let y = 0; y <= baseH; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(baseW, y); ctx.stroke(); }

    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(paddingX - 8, paddingY - 8, availW + 16, baseH - (paddingY * 2) + 16);

    // Header corner crosshairs & stamp
    drawBlueprintCross(ctx, baseW - paddingX - 16, paddingY + 20, 8);
    ctx.fillStyle = '#38BDF8';
    ctx.font = '800 8.5px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText('REV 2.4 // COLD VAULT', baseW - paddingX - 30, paddingY + 23);
    ctx.textAlign = 'left';

    ctx.fillStyle = '#38BDF8';
    ctx.font = '800 9px "JetBrains Mono", monospace';
    ctx.fillText('★ BEANTAG SPECIALTY CELLAR // CAVA DE CAFÉ ★', paddingX, paddingY + 18);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 18px "JetBrains Mono", monospace';
    ctx.fillText('CATÁLOGO DE LOTES EN BODEGA', paddingX, paddingY + 42);

    ctx.fillStyle = '#93C5FD';
    ctx.font = '700 9px "JetBrains Mono", monospace';
    ctx.fillText(`TOTAL: ${displayList.length} LOTES // DOSIS CONGELADAS AL VACÍO`, paddingX, paddingY + 62);

    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(paddingX, paddingY + 76);
    ctx.lineTo(baseW - paddingX, paddingY + 76);
    ctx.stroke();

    let curY = paddingY + 92;
    displayList.forEach((b, idx) => {
      const cardH = itemH - 10;
      ctx.fillStyle = 'rgba(14, 165, 233, 0.08)';
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, paddingX, curY, availW, cardH, 6, true, true);

      // Typographic index box
      const idxStr = String(idx + 1).padStart(2, '0');
      ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, paddingX + 10, curY + 12, 28, 28, 4, true, true);
      ctx.fillStyle = '#38BDF8';
      ctx.font = '900 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(idxStr, paddingX + 24, curY + 29);
      ctx.textAlign = 'left';

      // Line 1: Title & Stock Badge
      const rawName = stripEmojis(b.batch_name || b.name || b.coffee_name || 'Café');
      const name = rawName.length > 30 ? rawName.slice(0, 30) + '…' : rawName;

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 13px "JetBrains Mono", monospace';
      ctx.fillText(name, paddingX + 46, curY + 22);

      // Stock Badge in top-right corner
      const doseCount = b.remaining_doses !== undefined && b.remaining_doses !== null ? b.remaining_doses : 0;
      const doseBadgeText = doseCount > 0
        ? `${doseCount} TUBOS`
        : (b.remaining_weight_g || b.weight_current_g
            ? `~${Math.round(b.remaining_weight_g || b.weight_current_g)}g`
            : `${doseCount} TUBOS`);

      const badgeW = 76;
      const badgeH = 22;
      const badgeX = baseW - paddingX - badgeW - 8;
      const badgeY = curY + 8;

      ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 4, true, true);

      ctx.fillStyle = '#38BDF8';
      ctx.font = '900 9.5px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(doseBadgeText, badgeX + badgeW / 2, badgeY + 14.5);
      ctx.textAlign = 'left';

      // Line 2: Roaster, Origin & Altitude
      const roasterStr = stripEmojis(b.roaster || 'Specialty');
      const originStr = stripEmojis(b.origin || '');
      const altStr = b.altitude ? ` (${stripEmojis(String(b.altitude))}${String(b.altitude).toLowerCase().includes('m') ? '' : 'm'})` : '';
      const line2Text = originStr ? `${roasterStr} • ${originStr}${altStr}` : `${roasterStr}${altStr}`;

      ctx.fillStyle = '#93C5FD';
      ctx.font = '700 9.5px "JetBrains Mono", monospace';
      ctx.fillText(line2Text, paddingX + 46, curY + 38);

      // Line 3: Variety, Process & SCA Score
      const varietyStr = stripEmojis(b.variety || 'Variedad Arábica');
      const processStr = stripEmojis(b.process || 'Proceso Artesanal');
      const scaStr = b.sca_score ? ` | SCA ${b.sca_score}` : '';
      const line3Text = `${varietyStr} • ${processStr}${scaStr}`;

      ctx.fillStyle = '#38BDF8';
      ctx.font = '700 9px "JetBrains Mono", monospace';
      ctx.fillText(line3Text, paddingX + 46, curY + 52);

      // Line 4: Flavor Notes Pills
      const rawNotes = b.flavor_notes || b.roaster_notes || b.notes || b.batch_roaster_notes || '';
      const parsedTags = extractFlavorTags(rawNotes).slice(0, 4);
      const tags = parsedTags.length > 0 ? parsedTags : ['Notas Limpias', 'Balance'];

      let pillX = paddingX + 46;
      const pillY = curY + 64;
      const pillH = 18;

      ctx.font = '800 8.5px "JetBrains Mono", monospace';
      tags.forEach(tag => {
        const tw = ctx.measureText(tag).width;
        const pw = tw + 12;
        if (pillX + pw <= baseW - paddingX - 8) {
          ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
          ctx.lineWidth = 1;
          drawRoundedRect(ctx, pillX, pillY, pw, pillH, 4, true, true);
          ctx.fillStyle = '#E0F2FE';
          ctx.fillText(tag, pillX + 6, pillY + 12.5);
          pillX += pw + 6;
        }
      });

      curY += itemH;
    });

    const footY = baseH - paddingY - 24;
    ctx.fillStyle = '#7DD3FC';
    ctx.font = '700 8.5px "JetBrains Mono", monospace';
    ctx.fillText(`BEANTAG ARCHIVE // ${displayList.length} LOTES // FECHA: ${new Date().toLocaleDateString('es-ES')}`, paddingX, footY + 12);
  }

  // 2. NEOBRUTALIST MENU
  else if (style === 'neobrutalist') {
    ctx.fillStyle = '#FFFDF8';
    ctx.fillRect(0, 0, baseW, baseH);

    ctx.fillStyle = '#000000';
    ctx.fillRect(paddingX + 3, paddingY + 3, availW, 22);
    ctx.fillStyle = '#D4FF00';
    ctx.fillRect(paddingX, paddingY, availW, 22);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(paddingX, paddingY, availW, 22);

    ctx.fillStyle = '#000000';
    ctx.font = '900 9.5px "Space Grotesk", sans-serif';
    ctx.fillText('★ BEANTAG SPECIALTY // BARISTA MENU ★', paddingX + 10, paddingY + 15);

    ctx.fillStyle = '#09090B';
    ctx.font = '900 20px "Space Grotesk", sans-serif';
    ctx.fillText('CARTA DE CAFÉS EN BODEGA', paddingX, paddingY + 54);

    // Brutalist badge stamp on top right
    const badgeText = 'MENU // 2027';
    ctx.fillStyle = '#000000';
    ctx.fillRect(baseW - paddingX - 86, paddingY + 36, 86, 24);
    ctx.fillStyle = '#D4FF00';
    ctx.fillRect(baseW - paddingX - 88, paddingY + 34, 86, 24);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(baseW - paddingX - 88, paddingY + 34, 86, 24);
    ctx.fillStyle = '#000000';
    ctx.font = '900 10px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(badgeText, baseW - paddingX - 45, paddingY + 50);
    ctx.textAlign = 'left';

    ctx.fillStyle = '#000000';
    ctx.fillRect(paddingX, paddingY + 72, availW, 3);

    let curY = paddingY + 86;
    displayList.forEach((b, idx) => {
      const cardH = itemH - 12;
      ctx.fillStyle = '#000000';
      ctx.fillRect(paddingX + 3, curY + 3, availW, cardH);
      ctx.fillStyle = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
      ctx.fillRect(paddingX, curY, availW, cardH);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(paddingX, curY, availW, cardH);

      // High-voltage index box
      const idxStr = String(idx + 1).padStart(2, '0');
      ctx.fillStyle = '#000000';
      ctx.fillRect(paddingX + 12, curY + 12, 28, 28);
      ctx.fillStyle = '#D4FF00';
      ctx.fillRect(paddingX + 10, curY + 10, 28, 28);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(paddingX + 10, curY + 10, 28, 28);
      ctx.fillStyle = '#000000';
      ctx.font = '900 12px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(idxStr, paddingX + 24, curY + 28);
      ctx.textAlign = 'left';

      // Line 1: Title & Stock Badge
      const rawName = stripEmojis(b.batch_name || b.name || b.coffee_name || 'Café');
      const name = rawName.length > 30 ? rawName.slice(0, 30) + '…' : rawName;

      ctx.fillStyle = '#000000';
      ctx.font = '900 13px "Space Grotesk", sans-serif';
      ctx.fillText(name, paddingX + 46, curY + 22);

      // Stock Badge in top-right corner
      const doseCount = b.remaining_doses !== undefined && b.remaining_doses !== null ? b.remaining_doses : 0;
      const doseBadgeText = doseCount > 0
        ? `${doseCount} TUBOS`
        : (b.remaining_weight_g || b.weight_current_g
            ? `~${Math.round(b.remaining_weight_g || b.weight_current_g)}g`
            : `${doseCount} TUBOS`);

      const badgeW = 76;
      const badgeH = 22;
      const badgeX = baseW - paddingX - badgeW - 8;
      const badgeY = curY + 8;

      ctx.fillStyle = '#000000';
      ctx.fillRect(badgeX + 2, badgeY + 2, badgeW, badgeH);
      ctx.fillStyle = '#D4FF00';
      ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(badgeX, badgeY, badgeW, badgeH);

      ctx.fillStyle = '#000000';
      ctx.font = '900 9.5px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(doseBadgeText, badgeX + badgeW / 2, badgeY + 15);
      ctx.textAlign = 'left';

      // Line 2: Roaster, Origin & Altitude
      const roasterStr = stripEmojis(b.roaster || 'Specialty');
      const originStr = stripEmojis(b.origin || '');
      const altStr = b.altitude ? ` (${stripEmojis(String(b.altitude))}${String(b.altitude).toLowerCase().includes('m') ? '' : 'm'})` : '';
      const line2Text = originStr ? `${roasterStr} • ${originStr}${altStr}` : `${roasterStr}${altStr}`;

      ctx.fillStyle = '#475569';
      ctx.font = '700 9.5px "Space Grotesk", sans-serif';
      ctx.fillText(line2Text, paddingX + 46, curY + 38);

      // Line 3: Variety, Process & SCA Score
      const varietyStr = stripEmojis(b.variety || 'Variedad Arábica');
      const processStr = stripEmojis(b.process || 'Proceso Artesanal');
      const scaStr = b.sca_score ? ` | SCA ${b.sca_score}` : '';
      const line3Text = `${varietyStr} • ${processStr}${scaStr}`;

      ctx.fillStyle = '#0F172A';
      ctx.font = '700 9px "Space Grotesk", sans-serif';
      ctx.fillText(line3Text, paddingX + 46, curY + 52);

      // Line 4: Flavor Notes Pills
      const rawNotes = b.flavor_notes || b.roaster_notes || b.notes || b.batch_roaster_notes || '';
      const parsedTags = extractFlavorTags(rawNotes).slice(0, 4);
      const tags = parsedTags.length > 0 ? parsedTags : ['Notas Limpias', 'Balance'];
      const pillColors = ['#D4FF00', '#FED7AA', '#E9D5FF', '#BAE6FD'];

      let pillX = paddingX + 46;
      const pillY = curY + 64;
      const pillH = 18;

      ctx.font = '900 8.5px "Space Grotesk", sans-serif';
      tags.forEach((tag, tIdx) => {
        const tagUpper = tag.toUpperCase();
        const tw = ctx.measureText(tagUpper).width;
        const pw = tw + 12;
        if (pillX + pw <= baseW - paddingX - 8) {
          ctx.fillStyle = '#000000';
          ctx.fillRect(pillX + 1.5, pillY + 1.5, pw, pillH);
          ctx.fillStyle = pillColors[tIdx % pillColors.length];
          ctx.fillRect(pillX, pillY, pw, pillH);
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1.2;
          ctx.strokeRect(pillX, pillY, pw, pillH);

          ctx.fillStyle = '#000000';
          ctx.fillText(tagUpper, pillX + 6, pillY + 12.5);
          pillX += pw + 6;
        }
      });

      curY += itemH;
    });

    const footY = baseH - paddingY - 24;
    ctx.fillStyle = '#000000';
    ctx.font = '900 9px "Space Grotesk", sans-serif';
    ctx.fillText(`BEANTAG SPECIALTY // ARCHIVE ${displayList.length} LOTES // 2027`, paddingX, footY + 14);
  }

  // 3. AURORA MENU
  else if (style === 'aurora') {
    ctx.fillStyle = '#06070B';
    ctx.fillRect(0, 0, baseW, baseH);

    const grad1 = ctx.createRadialGradient(baseW * 0.85, 100, 0, baseW * 0.85, 100, 240);
    grad1.addColorStop(0, 'rgba(139, 92, 246, 0.4)');
    grad1.addColorStop(1, 'rgba(139, 92, 246, 0)');
    ctx.fillStyle = grad1;
    ctx.fillRect(0, 0, baseW, baseH);

    // Glowing status capsule on the right
    const pillW = 90;
    const pillH = 24;
    const pillX = baseW - paddingX - pillW;
    const pillY = paddingY + 24;
    ctx.fillStyle = 'rgba(192, 132, 252, 0.15)';
    ctx.strokeStyle = 'rgba(192, 132, 252, 0.4)';
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, pillX, pillY, pillW, pillH, 12, true, true);
    ctx.fillStyle = '#E9D5FF';
    ctx.font = '800 9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('● LIVE CELLAR', pillX + pillW / 2, pillY + 15.5);
    ctx.textAlign = 'left';

    ctx.fillStyle = '#C084FC';
    ctx.font = '800 9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('HOLOGRAPHIC CELLAR // BEANTAG VISION', paddingX, paddingY + 18);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 19px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('CATÁLOGO DE CAFÉS ESPECIALES', paddingX, paddingY + 44);

    let curY = paddingY + 84;
    displayList.forEach((b, idx) => {
      const cardH = itemH - 12;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, paddingX, curY, availW, cardH, 8, true, true);

      // Frosted index tile
      const idxStr = String(idx + 1).padStart(2, '0');
      ctx.fillStyle = 'rgba(192, 132, 252, 0.12)';
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.35)';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, paddingX + 10, curY + 12, 28, 28, 8, true, true);
      ctx.fillStyle = '#C084FC';
      ctx.font = '800 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(idxStr, paddingX + 24, curY + 29);
      ctx.textAlign = 'left';

      // Line 1: Title & Stock Badge
      const rawName = stripEmojis(b.batch_name || b.name || b.coffee_name || 'Café');
      const name = rawName.length > 30 ? rawName.slice(0, 30) + '…' : rawName;

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(name, paddingX + 46, curY + 22);

      // Stock Badge in top-right corner
      const doseCount = b.remaining_doses !== undefined && b.remaining_doses !== null ? b.remaining_doses : 0;
      const doseBadgeText = doseCount > 0
        ? `${doseCount} TUBOS`
        : (b.remaining_weight_g || b.weight_current_g
            ? `~${Math.round(b.remaining_weight_g || b.weight_current_g)}g`
            : `${doseCount} TUBOS`);

      const badgeW = 76;
      const badgeH = 22;
      const badgeX = baseW - paddingX - badgeW - 8;
      const badgeY = curY + 8;

      ctx.fillStyle = 'rgba(192, 132, 252, 0.15)';
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.4)';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 11, true, true);

      ctx.fillStyle = '#E9D5FF';
      ctx.font = '800 9.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(doseBadgeText, badgeX + badgeW / 2, badgeY + 14.5);
      ctx.textAlign = 'left';

      // Line 2: Roaster, Origin & Altitude
      const roasterStr = stripEmojis(b.roaster || 'Specialty');
      const originStr = stripEmojis(b.origin || '');
      const altStr = b.altitude ? ` (${stripEmojis(String(b.altitude))}${String(b.altitude).toLowerCase().includes('m') ? '' : 'm'})` : '';
      const line2Text = originStr ? `${roasterStr} • ${originStr}${altStr}` : `${roasterStr}${altStr}`;

      ctx.fillStyle = '#94A3B8';
      ctx.font = '600 9.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(line2Text, paddingX + 46, curY + 38);

      // Line 3: Variety, Process & SCA Score
      const varietyStr = stripEmojis(b.variety || 'Variedad Arábica');
      const processStr = stripEmojis(b.process || 'Proceso Artesanal');
      const scaStr = b.sca_score ? ` | SCA ${b.sca_score}` : '';
      const line3Text = `${varietyStr} • ${processStr}${scaStr}`;

      ctx.fillStyle = '#CBD5E1';
      ctx.font = '600 9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(line3Text, paddingX + 46, curY + 52);

      // Line 4: Flavor Notes Pills
      const rawNotes = b.flavor_notes || b.roaster_notes || b.notes || b.batch_roaster_notes || '';
      const parsedTags = extractFlavorTags(rawNotes).slice(0, 4);
      const tags = parsedTags.length > 0 ? parsedTags : ['Notas Limpias', 'Balance'];

      let pillX = paddingX + 46;
      const pillY = curY + 64;
      const pillH = 18;

      ctx.font = '700 8.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      tags.forEach(tag => {
        const tw = ctx.measureText(tag).width;
        const pw = tw + 14;
        if (pillX + pw <= baseW - paddingX - 8) {
          ctx.fillStyle = 'rgba(168, 85, 247, 0.16)';
          ctx.strokeStyle = 'rgba(216, 180, 254, 0.3)';
          ctx.lineWidth = 1;
          drawRoundedRect(ctx, pillX, pillY, pw, pillH, 8, true, true);
          ctx.fillStyle = '#F3E8FF';
          ctx.fillText(tag, pillX + 7, pillY + 12.5);
          pillX += pw + 6;
        }
      });

      curY += itemH;
    });

    const footY = baseH - paddingY - 24;
    ctx.fillStyle = '#C084FC';
    ctx.font = '700 8.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`BEANTAG VISION // ARCHIVE ${displayList.length} LOTES`, paddingX, footY + 12);
  }

  // 4. HANGTAG MENU
  else if (style === 'hangtag') {
    ctx.fillStyle = '#F8F5EE';
    ctx.fillRect(0, 0, baseW, baseH);

    // Vector Atelier Seal in header
    drawVectorSeal(ctx, baseW - paddingX - 22, paddingY + 34, 18);

    ctx.fillStyle = '#57534E';
    ctx.font = '700 8.5px "Playfair Display", Georgia, serif';
    ctx.fillText('ATELIER DE CAFÉ // CATALOGUE DES CRUS', paddingX, paddingY + 18);

    ctx.fillStyle = '#141210';
    ctx.font = 'bold 20px "Playfair Display", Georgia, serif';
    ctx.fillText('SÉLECTION DE BODEGA', paddingX, paddingY + 46);

    let curY = paddingY + 84;
    displayList.forEach((b, idx) => {
      const cardH = itemH - 12;
      ctx.strokeStyle = '#DDD7CD';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(paddingX, curY + cardH);
      ctx.lineTo(baseW - paddingX, curY + cardH);
      ctx.stroke();

      // Editorial index indicator
      const idxStr = String(idx + 1).padStart(2, '0');
      ctx.fillStyle = 'rgba(120, 113, 108, 0.08)';
      ctx.strokeStyle = '#DDD7CD';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, paddingX + 6, curY + 12, 28, 28, 4, true, true);
      ctx.fillStyle = '#141210';
      ctx.font = 'bold 12px "Playfair Display", Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(idxStr, paddingX + 20, curY + 29);
      ctx.textAlign = 'left';

      // Line 1: Title & Stock Badge
      const rawName = stripEmojis(b.batch_name || b.name || b.coffee_name || 'Café');
      const name = rawName.length > 30 ? rawName.slice(0, 30) + '…' : rawName;

      ctx.fillStyle = '#141210';
      ctx.font = 'bold 13px "Playfair Display", Georgia, serif';
      ctx.fillText(name, paddingX + 44, curY + 22);

      // Stock Badge in top-right corner
      const doseCount = b.remaining_doses !== undefined && b.remaining_doses !== null ? b.remaining_doses : 0;
      const doseBadgeText = doseCount > 0
        ? `${doseCount} TUBOS`
        : (b.remaining_weight_g || b.weight_current_g
            ? `~${Math.round(b.remaining_weight_g || b.weight_current_g)}g`
            : `${doseCount} TUBOS`);

      const badgeW = 76;
      const badgeH = 20;
      const badgeX = baseW - paddingX - badgeW - 6;
      const badgeY = curY + 8;

      ctx.fillStyle = 'rgba(63, 98, 18, 0.08)';
      ctx.strokeStyle = 'rgba(63, 98, 18, 0.25)';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 4, true, true);

      ctx.fillStyle = '#3F6212';
      ctx.font = 'bold 9px "Playfair Display", Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(doseBadgeText, badgeX + badgeW / 2, badgeY + 13.5);
      ctx.textAlign = 'left';

      // Line 2: Roaster, Origin & Altitude
      const roasterStr = stripEmojis(b.roaster || 'Specialty');
      const originStr = stripEmojis(b.origin || '');
      const altStr = b.altitude ? ` (${stripEmojis(String(b.altitude))}${String(b.altitude).toLowerCase().includes('m') ? '' : 'm'})` : '';
      const line2Text = originStr ? `${roasterStr} • ${originStr}${altStr}` : `${roasterStr}${altStr}`;

      ctx.fillStyle = '#57534E';
      ctx.font = 'italic 9.5px "Playfair Display", Georgia, serif';
      ctx.fillText(line2Text, paddingX + 44, curY + 38);

      // Line 3: Variety, Process & SCA Score
      const varietyStr = stripEmojis(b.variety || 'Variedad Arábica');
      const processStr = stripEmojis(b.process || 'Proceso Artesanal');
      const scaStr = b.sca_score ? ` | SCA ${b.sca_score}` : '';
      const line3Text = `${varietyStr} • ${processStr}${scaStr}`;

      ctx.fillStyle = '#78716C';
      ctx.font = 'bold 9px "Playfair Display", Georgia, serif';
      ctx.fillText(line3Text, paddingX + 44, curY + 52);

      // Line 4: Flavor Notes Pills
      const rawNotes = b.flavor_notes || b.roaster_notes || b.notes || b.batch_roaster_notes || '';
      const parsedTags = extractFlavorTags(rawNotes).slice(0, 4);
      const tags = parsedTags.length > 0 ? parsedTags : ['Notas Limpias', 'Balance'];

      let pillX = paddingX + 44;
      const pillY = curY + 64;
      const pillH = 18;

      ctx.font = 'italic 8.5px "Playfair Display", Georgia, serif';
      tags.forEach(tag => {
        const tw = ctx.measureText(tag).width;
        const pw = tw + 12;
        if (pillX + pw <= baseW - paddingX - 8) {
          ctx.fillStyle = 'rgba(120, 113, 108, 0.1)';
          ctx.strokeStyle = 'rgba(120, 113, 108, 0.25)';
          ctx.lineWidth = 0.8;
          drawRoundedRect(ctx, pillX, pillY, pw, pillH, 4, true, true);
          ctx.fillStyle = '#292524';
          ctx.fillText(tag, pillX + 6, pillY + 12.5);
          pillX += pw + 6;
        }
      });

      curY += itemH;
    });

    const footY = baseH - paddingY - 24;
    ctx.fillStyle = '#78716C';
    ctx.font = '600 8.5px "Playfair Display", Georgia, serif';
    ctx.fillText(`BEANTAG SPECIALTY ATELIER // ${displayList.length} LOTS EN BODEGA // 2027`, paddingX, footY + 12);
    drawVectorSeal(ctx, baseW - paddingX - 20, footY + 10, 16);
  }

  return canvas.toDataURL('image/png', 1.0);
}

/**
 * Generate formatted text for clipboard sharing of coffee menu
 */
export function generateCoffeeMenuText(batches) {
  if (!batches || batches.length === 0) return 'No hay cafés registrados en el inventario.';

  const available = batches.filter(b => (b.remaining_doses || b.weight_current_g || 0) > 0);
  const targetList = available.length > 0 ? available : batches;

  let text = `☕ *CARTA DE CAFÉS DE ESPECIALIDAD • BEANTAG*\n`;
  text += `❄️ _Dosis congeladas al vacío y lotes en bodega:_\n\n`;

  targetList.forEach((b, idx) => {
    const num = (idx + 1).toString().padStart(2, '0');
    const name = stripEmojis(b.batch_name || b.name || b.coffee_name || 'Café de Especialidad');
    const roaster = b.roaster ? ` • ${stripEmojis(b.roaster)}` : '';
    const origin = b.origin ? stripEmojis(b.origin) : '';
    const altitude = b.altitude ? ` (${stripEmojis(String(b.altitude))}${String(b.altitude).toLowerCase().includes('m') ? '' : 'm'})` : '';
    const variety = b.variety ? stripEmojis(b.variety) : '';
    const process = b.process ? (variety ? ` • ${stripEmojis(b.process)}` : stripEmojis(b.process)) : '';
    const sca = b.sca_score ? ` | SCA ${b.sca_score}` : '';
    const rawNotes = stripEmojis(b.flavor_notes || b.roaster_notes || b.notes || b.batch_roaster_notes || '');

    const doseCount = b.remaining_doses !== undefined && b.remaining_doses !== null ? b.remaining_doses : 0;
    const estWeight = Math.round(b.remaining_weight_g || (doseCount * (parseFloat(b.dose_weight) || 20)));
    const doses = doseCount > 0
      ? `${doseCount} tubos (~${estWeight}g)`
      : (b.weight_current_g ? `${b.weight_current_g}g` : `${doseCount} tubos (~${estWeight}g)`);

    text += `*${num}. ${name}*${roaster}\n`;
    if (origin || altitude) text += `   🌍 ${origin}${altitude}`.trimEnd() + '\n';
    if (variety || process || sca) text += `   🌾 ${variety}${process}${sca}`.trimEnd() + '\n';
    if (rawNotes) text += `   ✨ Notas: ${rawNotes}\n`;
    if (doses) text += `   📦 Stock: ${doses}\n`;
    text += `\n`;
  });

  text += `─────────────────────\n`;
  text += `📱 _Gestionado con BeanTag Specialty Coffee App_`;
  return text;
}
