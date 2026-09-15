// --- BEANTAG AESTHETIC TICKET & CARD GENERATOR (2026/2027) ---
// High-Fashion Vertical Portrait (540 x 760 px @ 2x Retina = 1080 x 1520 px)
// Supporting both Barista Extraction Tickets ("Con Receta") and
// Specialty Coffee Terroir & Cupping Collector Cards ("Solo Grano").
// Zero empty space, zero stretching, guaranteed async fonts, and strict WCAG AAA contrast.

import {
  ensureCardAssetsLoaded,
  drawHeroAsset,
  drawMetricAsset,
  drawBadgeAsset,
  drawCardAsset,
  drawContainedImage,
  drawBlueprintBean,
  drawNeobrutalistBean,
  drawNeobrutalistStar,
  drawAuroraBean,
  drawHangtagBotanical,
  drawHangtagSeal
} from './ticketIconKits';

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
      document.fonts.load('700 14px "JetBrains Mono"'),
      document.fonts.load('800 20px "JetBrains Mono"'),
      document.fonts.load('italic 14px "Playfair Display"'),
      document.fonts.load('700 24px "Playfair Display"'),
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
 * Generates an Ultra-Aesthetic Share Card (Portrait 540 x 760 px @ 2x = 1080 x 1520 px)
 * Flawlessly balanced for both "Con Receta" and "Solo Grano" modes.
 */
export async function generateRecipeCardImage(recipe, template = 'blueprint', incRecipe = true) {
  const style = normalizeCardStyle(template);

  // Guarantee assets and web fonts are fully ready
  await Promise.all([
    ensureCardAssetsLoaded(style),
    ensureFontsLoaded()
  ]);

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
    drawFittedText(coffeeName.toUpperCase(), paddingX, paddingY + 44, availW, 25, '"JetBrains Mono", monospace', '900');

    ctx.fillStyle = '#93C5FD';
    ctx.font = '700 10px "JetBrains Mono", monospace';
    drawTruncatedText(`${origin.toUpperCase()} • ${process.toUpperCase()} • ${altitude} • ${roaster.toUpperCase()}`, paddingX, paddingY + 66, availW);

    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(paddingX, paddingY + 80);
    ctx.lineTo(baseW - paddingX, paddingY + 80);
    ctx.stroke();

    // -----------------------------------------------------------------------
    // MODE A: SOLO GRANO (TERROIR & CUPPING SHOWCASE)
    // -----------------------------------------------------------------------
    if (!incRecipe) {
      // Large Hero CAD Schematic Viewport
      const heroY = paddingY + 92;
      const heroH = 150;
      ctx.fillStyle = 'rgba(14, 165, 233, 0.08)';
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, paddingX, heroY, availW, heroH, 6, true, true);

      ctx.fillStyle = '#7DD3FC';
      ctx.font = '700 8px "JetBrains Mono", monospace';
      ctx.fillText('FIG. 01 — ARCHIVAL MORPHOLOGY // SECTION A-A', paddingX + 12, heroY + 16);

      ctx.fillStyle = '#4ADE80';
      ctx.font = '800 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`SCA CUPSCORE: ${scaScore}★ [CERTIFIED]`, paddingX + availW - 12, heroY + 16);
      ctx.textAlign = 'left';

      // Centered Large CAD Bean Illustration
      drawHeroAsset(ctx, 'blueprint', paddingX + (availW / 2) - 80, heroY + 22, 160, 105);

      // Dimension Cota Lines
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(paddingX + 30, heroY + heroH - 12);
      ctx.lineTo(paddingX + availW - 30, heroY + heroH - 12);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#7DD3FC';
      ctx.font = '700 7.5px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`Ø 11.4 mm ± 0.05 // VAR. ${variety.toUpperCase()}`, paddingX + (availW / 2), heroY + heroH - 8);
      ctx.textAlign = 'left';

      // 4 Terroir Matrix Boxes (2x2)
      const matY = heroY + heroH + 14;
      const matGap = 10;
      const colW = (availW - matGap) / 2;
      const colH = 68;

      const terroirItems = [
        { lbl: 'PRODUCTOR & FINCA', val: producer.toUpperCase(), sub: origin.toUpperCase() },
        { lbl: 'ALTITUD & TERROIR', val: altitude, sub: 'VOLCANIC SOIL / MICROCLIMATE' },
        { lbl: 'VARIEDAD BOTÁNICA', val: variety.toUpperCase(), sub: 'ARABICA SPECIALTY' },
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
        drawRoundedRect(ctx, tx, ty, colW, colH, 6, true, true);

        ctx.fillStyle = '#7DD3FC';
        ctx.font = '800 8px "JetBrains Mono", monospace';
        ctx.fillText(t.lbl, tx + 10, ty + 16);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 12.5px "JetBrains Mono", monospace';
        drawTruncatedText(t.val, tx + 10, ty + 38, colW - 20);

        ctx.fillStyle = '#38BDF8';
        ctx.font = '700 8px "JetBrains Mono", monospace';
        drawTruncatedText(t.sub, tx + 10, ty + 56, colW - 20);
      });

      // Sensory Cupping Spectrum Bars (4 Bars)
      const specY = matY + (colH * 2) + matGap + 12;
      const specH = 92;
      ctx.fillStyle = 'rgba(14, 165, 233, 0.06)';
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, paddingX, specY, availW, specH, 6, true, true);

      ctx.fillStyle = '#7DD3FC';
      ctx.font = '800 8.5px "JetBrains Mono", monospace';
      ctx.fillText('CALIBRATED SENSORY ATTRIBUTES & CUP PROFILE:', paddingX + 12, specY + 16);

      const attrBars = [
        { name: 'ACIDEZ', level: 0.88, desc: 'Brillante / Cítrica' },
        { name: 'DULZOR', level: 0.92, desc: 'Panela & Miel' },
        { name: 'CUERPO', level: 0.80, desc: 'Sedoso / Té' },
        { name: 'BALANCE', level: 0.94, desc: 'Excepcional' }
      ];

      attrBars.forEach((a, i) => {
        const ax = paddingX + 12;
        const ay = specY + 30 + (i * 14);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '700 8px "JetBrains Mono", monospace';
        ctx.fillText(a.name, ax, ay);

        // Bar
        const barX = ax + 56;
        const barW = availW - 170;
        ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
        ctx.fillRect(barX, ay - 6, barW, 6);
        ctx.fillStyle = '#38BDF8';
        ctx.fillRect(barX, ay - 6, barW * a.level, 6);

        ctx.fillStyle = '#93C5FD';
        ctx.font = '700 7.5px "JetBrains Mono", monospace';
        ctx.fillText(a.desc, barX + barW + 10, ay);
      });

      // Cupping Flavor Descriptors Box
      const notesY = specY + specH + 12;
      const notesH = 54;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.05)';
      ctx.fillRect(paddingX, notesY, availW, notesH);
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(paddingX, notesY, 4, notesH);

      ctx.fillStyle = '#7DD3FC';
      ctx.font = '800 8px "JetBrains Mono", monospace';
      ctx.fillText('NOTAS DE CATA & DESCRIPTORES SENSORIALES:', paddingX + 12, notesY + 16);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 12px "JetBrains Mono", monospace';
      const cleanNotes = flavorTags.length > 0 ? flavorTags.join('  •  ') : notesStr;
      drawTruncatedText(cleanNotes, paddingX + 12, notesY + 38, availW - 20);

      // Cellar Vault Cryo-Preservation Tag
      const vaultY = notesY + notesH + 10;
      ctx.fillStyle = 'rgba(74, 222, 128, 0.1)';
      ctx.strokeStyle = '#4ADE80';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, paddingX, vaultY, availW, 26, 4, true, true);

      ctx.fillStyle = '#4ADE80';
      ctx.font = '800 8.5px "JetBrains Mono", monospace';
      ctx.fillText(`❄️ CAVA BEANTAG: ${dosesStr} • VACÍO -18°C`, paddingX + 12, vaultY + 17);
    }

    // -----------------------------------------------------------------------
    // MODE B: CON RECETA (BARISTA EXTRACTION PROTOCOL)
    // -----------------------------------------------------------------------
    else {
      // Hero CAD Viewport
      const heroBoxY = paddingY + 92;
      const heroBoxH = 114;
      ctx.fillStyle = 'rgba(14, 165, 233, 0.08)';
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, paddingX, heroBoxY, availW, heroBoxH, 6, true, true);

      ctx.fillStyle = '#7DD3FC';
      ctx.font = '700 8px "JetBrains Mono", monospace';
      ctx.fillText('FIG. 01: SCHEMATIC CAD CROSS-SECTION', paddingX + 12, heroBoxY + 16);

      ctx.fillStyle = '#4ADE80';
      ctx.font = '800 8.5px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`SCA: ${scaScore}★ [PASSED]`, paddingX + availW - 12, heroBoxY + 16);
      ctx.textAlign = 'left';

      drawHeroAsset(ctx, 'blueprint', paddingX + (availW / 2) - 60, heroBoxY + 22, 120, 80);

      // 4 Extraction Parameter Bento Tiles (2x2) with LARGE ICONS
      const bentoY = heroBoxY + heroBoxH + 14;
      const bentoGap = 10;
      const colW = (availW - bentoGap) / 2;
      const colH = 76;

      const metrics = [
        { type: 'method', lbl: 'MÉTODO CAD', val: methodStr.toUpperCase(), sub: 'CONICAL 60°' },
        { type: 'dose', lbl: 'DOSIS IN / OUT', val: `${coffeeG}g → ${waterG}g`, sub: `RATIO ${ratioStr}` },
        { type: 'grind', lbl: 'MOLIENDA', val: `${microns} µm`, sub: 'CALIBRATED' },
        { type: 'time', lbl: 'TIEMPO / TEMP', val: `${timeStr} min`, sub: tempStr }
      ];

      metrics.forEach((m, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const mx = paddingX + col * (colW + bentoGap);
        const my = bentoY + row * (colH + bentoGap);

        ctx.fillStyle = 'rgba(14, 165, 233, 0.08)';
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 1;
        drawRoundedRect(ctx, mx, my, colW, colH, 6, true, true);

        // Prominent 40px CAD Icon on Left
        drawMetricAsset(ctx, 'blueprint', m.type, mx + 26, my + 38, 40);

        ctx.fillStyle = '#7DD3FC';
        ctx.font = '800 8px "JetBrains Mono", monospace';
        ctx.fillText(m.lbl, mx + 54, my + 20);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 13px "JetBrains Mono", monospace';
        drawTruncatedText(m.val, mx + 54, my + 42, colW - 60);

        ctx.fillStyle = '#38BDF8';
        ctx.font = '700 8.5px "JetBrains Mono", monospace';
        ctx.fillText(m.sub, mx + 54, my + 62);
      });

      // Pour Timeline Progress Bar
      const flowY = bentoY + (colH * 2) + bentoGap + 12;
      const flowH = 50;

      ctx.fillStyle = 'rgba(14, 165, 233, 0.05)';
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      drawRoundedRect(ctx, paddingX, flowY, availW, flowH, 6, true, true);
      ctx.setLineDash([]);

      ctx.fillStyle = '#7DD3FC';
      ctx.font = '700 8px "JetBrains Mono", monospace';
      ctx.fillText('BLOOM (0:00): 45g', paddingX + 12, flowY + 16);
      ctx.fillText('VERTIDO 2: +95g', paddingX + (availW / 2) - 35, flowY + 16);
      ctx.fillStyle = '#4ADE80';
      ctx.textAlign = 'right';
      ctx.fillText(`TOTAL: ${waterG}g (${ratioStr})`, paddingX + availW - 12, flowY + 16);
      ctx.textAlign = 'left';

      const barY = flowY + 26;
      const barW = availW - 24;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
      drawRoundedRect(ctx, paddingX + 12, barY, barW, 8, 4, true, false);

      ctx.fillStyle = '#38BDF8';
      drawRoundedRect(ctx, paddingX + 12, barY, barW * 0.22, 8, 4, true, false);
      ctx.fillStyle = '#60A5FA';
      drawRoundedRect(ctx, paddingX + 12 + (barW * 0.22), barY, barW * 0.38, 8, 4, true, false);
      ctx.fillStyle = '#93C5FD';
      drawRoundedRect(ctx, paddingX + 12 + (barW * 0.60), barY, barW * 0.40, 8, 4, true, false);

      // Sensory Descriptors
      const notesY = flowY + flowH + 12;
      const notesH = 52;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.05)';
      ctx.fillRect(paddingX, notesY, availW, notesH);
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(paddingX, notesY, 4, notesH);

      ctx.fillStyle = '#7DD3FC';
      ctx.font = '800 8px "JetBrains Mono", monospace';
      ctx.fillText('SENSORY PROFILE & CUPPING DESCRIPTORS:', paddingX + 12, notesY + 16);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 12px "JetBrains Mono", monospace';
      const cleanNotes = flavorTags.length > 0 ? flavorTags.join('  •  ') : notesStr;
      drawTruncatedText(cleanNotes, paddingX + 12, notesY + 38, availW - 20);
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
    drawFittedText(coffeeName.toUpperCase(), paddingX, paddingY + 68, availW, 27, '"Space Grotesk", sans-serif', '900');

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
      // Big Mascot & Stamp Box
      const heroY = paddingY + 118;
      const heroH = 145;

      ctx.fillStyle = '#000000';
      ctx.fillRect(paddingX + 4, heroY + 4, availW, heroH);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(paddingX, heroY, availW, heroH);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(paddingX, heroY, availW, heroH);

      // Mascot on Left
      drawHeroAsset(ctx, 'neobrutalist', paddingX + 20, heroY + 15, 115, 115);
      drawBadgeAsset(ctx, 'neobrutalist', 'star', paddingX + 130, heroY + 15, 42);

      // Callout on Right
      ctx.fillStyle = '#000000';
      ctx.font = '900 14px "Space Grotesk", sans-serif';
      ctx.fillText('SPECIALTY ROASTERY', paddingX + 180, heroY + 36);

      ctx.font = '700 10px "Space Grotesk", sans-serif';
      ctx.fillText('SHIBUYA DISTRICT // 100% ARABICA', paddingX + 180, heroY + 54);

      ctx.fillStyle = '#000000';
      ctx.fillRect(paddingX + 182, heroY + 70, 140, 26);
      ctx.fillStyle = '#D4FF00';
      ctx.fillRect(paddingX + 180, heroY + 68, 140, 26);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(paddingX + 180, heroY + 68, 140, 26);

      ctx.fillStyle = '#000000';
      ctx.font = '900 11px "Space Grotesk", sans-serif';
      ctx.fillText(`SCA SCORE: ${scaScore}★`, paddingX + 192, heroY + 85);

      ctx.font = '800 8.5px monospace';
      ctx.fillText('TOP 1% WORLD HARVEST', paddingX + 180, heroY + 116);

      // Terroir Bento Grid (2x2)
      const matY = heroY + heroH + 16;
      const matGap = 10;
      const colW = (availW - matGap) / 2;
      const colH = 72;

      const terroirMetrics = [
        { lbl: 'PRODUCTOR & FINCA', val: producer.toUpperCase(), bg: '#D4FF00', col: '#000' },
        { lbl: 'ALTITUD & TERROIR', val: altitude, bg: '#FFFFFF', col: '#000' },
        { lbl: 'VARIEDAD BOTÁNICA', val: variety.toUpperCase(), bg: '#FF3B14', col: '#FFF' },
        { lbl: 'BENEFICIO / PROCESO', val: process.toUpperCase(), bg: '#D8B4FE', col: '#000' }
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
        ctx.fillText(m.lbl, mx + 10, my + 18);

        ctx.font = '900 12.5px "Space Grotesk", sans-serif';
        drawTruncatedText(m.val, mx + 10, my + 44, colW - 20);

        ctx.font = '800 8px monospace';
        ctx.fillText('SPECIALTY LOT', mx + 10, my + 62);
      });

      // Sensory Pop Bars
      const specY = matY + (colH * 2) + matGap + 14;
      const specH = 92;

      ctx.fillStyle = '#000000';
      ctx.fillRect(paddingX + 3.5, specY + 3.5, availW, specH);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(paddingX, specY, availW, specH);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(paddingX, specY, availW, specH);

      ctx.fillStyle = '#000000';
      ctx.font = '900 9.5px "Space Grotesk", sans-serif';
      ctx.fillText('⚡ PERFIL SENSORIAL // ATTRIBUTE METERS:', paddingX + 12, specY + 18);

      const neoBars = [
        { name: 'ACIDEZ', level: 0.90, desc: 'Brillante', bg: '#D4FF00' },
        { name: 'DULZOR', level: 0.92, desc: 'Caramelo & Miel', bg: '#FF3B14' },
        { name: 'CUERPO', level: 0.82, desc: 'Sedoso', bg: '#D8B4FE' },
        { name: 'BALANCE', level: 0.95, desc: 'Excepcional', bg: '#67E8F9' }
      ];

      neoBars.forEach((a, i) => {
        const ax = paddingX + 12;
        const ay = specY + 32 + (i * 14);
        ctx.fillStyle = '#000000';
        ctx.font = '900 8px "Space Grotesk", sans-serif';
        ctx.fillText(a.name, ax, ay);

        const barX = ax + 54;
        const barW = availW - 165;
        ctx.fillStyle = '#F4F4F5';
        ctx.fillRect(barX, ay - 6, barW, 6);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, ay - 6, barW, 6);

        ctx.fillStyle = a.bg;
        ctx.fillRect(barX, ay - 6, barW * a.level, 6);
        ctx.strokeRect(barX, ay - 6, barW * a.level, 6);

        ctx.fillStyle = '#000000';
        ctx.font = '700 7.5px "Space Grotesk", sans-serif';
        ctx.fillText(a.desc, barX + barW + 8, ay);
      });

      // Flavor Stickers
      const notesY = specY + specH + 12;
      const notesH = 68;

      ctx.fillStyle = '#000000';
      ctx.fillRect(paddingX + 3.5, notesY + 3.5, availW, notesH);
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(paddingX, notesY, availW, notesH);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(paddingX, notesY, availW, notesH);

      ctx.fillStyle = '#000000';
      ctx.font = '900 9.5px "Space Grotesk", sans-serif';
      ctx.fillText('⚡ NOTAS DE CATA // POP STICKERS:', paddingX + 12, notesY + 18);

      let pillX = paddingX + 12;
      const pillY = notesY + 30;
      const pillColors = ['#D4FF00', '#FF3B14', '#D8B4FE', '#67E8F9', '#FED7AA'];

      const displayTags = flavorTags.length > 0 ? flavorTags : ['Notas Limpias', 'Balance', 'Dulzor Frutal'];
      displayTags.slice(0, 4).forEach((tag, idx) => {
        const bgCol = pillColors[idx % pillColors.length];
        ctx.font = '900 10.5px "Space Grotesk", sans-serif';
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

      // Cellar vault pill
      const vaultY = notesY + notesH + 10;
      ctx.fillStyle = '#000000';
      ctx.fillRect(paddingX + 2, vaultY + 2, availW, 24);
      ctx.fillStyle = '#D4FF00';
      ctx.fillRect(paddingX, vaultY, availW, 24);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(paddingX, vaultY, availW, 24);

      ctx.fillStyle = '#000000';
      ctx.font = '900 8.5px "Space Grotesk", sans-serif';
      ctx.fillText(`❄️ BODEGA BEANTAG: ${dosesStr} • VACÍO -18°C`, paddingX + 10, vaultY + 16);
    }

    // -----------------------------------------------------------------------
    // MODE B: CON RECETA (BARISTA EXTRACTION PROTOCOL)
    // -----------------------------------------------------------------------
    else {
      // Hero Mascot Box
      const heroBoxY = paddingY + 118;
      const heroBoxH = 114;

      ctx.fillStyle = '#000000';
      ctx.fillRect(paddingX + 4, heroBoxY + 4, availW, heroBoxH);
      ctx.fillStyle = '#FFFDF5';
      ctx.fillRect(paddingX, heroBoxY, availW, heroBoxH);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(paddingX, heroBoxY, availW, heroBoxH);

      drawHeroAsset(ctx, 'neobrutalist', paddingX + 20, heroBoxY + 8, 100, 100);
      drawBadgeAsset(ctx, 'neobrutalist', 'star', paddingX + 116, heroBoxY + 14, 40);

      ctx.fillStyle = '#000000';
      ctx.font = '900 13px "Space Grotesk", sans-serif';
      ctx.fillText('SPECIALTY ROASTERY', paddingX + 165, heroBoxY + 36);

      ctx.font = '700 10px "Space Grotesk", sans-serif';
      ctx.fillText('SHIBUYA DISTRICT // BARISTA ORDER', paddingX + 165, heroBoxY + 54);

      ctx.fillStyle = '#000000';
      ctx.fillRect(paddingX + 167, heroBoxY + 70, 140, 26);
      ctx.fillStyle = '#D4FF00';
      ctx.fillRect(paddingX + 165, heroBoxY + 68, 140, 26);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(paddingX + 165, heroBoxY + 68, 140, 26);

      ctx.fillStyle = '#000000';
      ctx.font = '900 11px "Space Grotesk", sans-serif';
      ctx.fillText(`SCA SCORE: ${scaScore}★`, paddingX + 176, heroBoxY + 85);

      // 4 Extraction Parameter Bento Tiles (2x2) with LARGE ICONS
      const bentoY = heroBoxY + heroBoxH + 16;
      const bentoGap = 10;
      const colW = (availW - bentoGap) / 2;
      const colH = 76;

      const metrics = [
        { type: 'method', lbl: 'MÉTODO', val: methodStr.toUpperCase(), bg: '#D4FF00', valColor: '#000000' },
        { type: 'dose', lbl: 'DOSIS IN / OUT', val: `${coffeeG}g → ${waterG}g`, bg: '#FFFFFF', valColor: '#000000' },
        { type: 'grind', lbl: 'MOLIENDA', val: `${microns} µm`, bg: '#FF3B14', valColor: '#FFFFFF' },
        { type: 'time', lbl: 'TIEMPO / TEMP', val: `${timeStr} / ${tempStr}`, bg: '#FFFFFF', valColor: '#000000' }
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

        // Prominent 40px Icon on Left
        drawMetricAsset(ctx, 'neobrutalist', m.type, mx + 26, my + 38, 40);

        ctx.fillStyle = m.valColor;
        ctx.font = '900 8px "Space Grotesk", sans-serif';
        ctx.fillText(m.lbl, mx + 54, my + 20);

        ctx.font = '900 13px "Space Grotesk", sans-serif';
        drawTruncatedText(m.val, mx + 54, my + 42, colW - 60);

        ctx.font = '800 8px monospace';
        ctx.fillText(idx === 1 ? `RATIO ${ratioStr}` : 'SPECIALTY', mx + 54, my + 62);
      });

      // Flavor Notes Pop Stickers Bento
      const notesY = bentoY + (colH * 2) + bentoGap + 14;
      const notesH = 80;

      ctx.fillStyle = '#000000';
      ctx.fillRect(paddingX + 3.5, notesY + 3.5, availW, notesH);
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(paddingX, notesY, availW, notesH);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(paddingX, notesY, availW, notesH);

      ctx.fillStyle = '#000000';
      ctx.font = '900 10px "Space Grotesk", sans-serif';
      ctx.fillText('⚡ PERFIL SENSORIAL // POP STICKERS:', paddingX + 12, notesY + 20);

      let pillX = paddingX + 12;
      const pillY = notesY + 34;
      const pillColors = ['#D4FF00', '#FF3B14', '#D8B4FE', '#67E8F9', '#FED7AA'];

      const displayTags = flavorTags.length > 0 ? flavorTags : ['Notas Limpias', 'Balance', 'Dulzor Frutal'];
      displayTags.slice(0, 4).forEach((tag, idx) => {
        const bgCol = pillColors[idx % pillColors.length];
        ctx.font = '900 10.5px "Space Grotesk", sans-serif';
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
    drawFittedText(coffeeName, paddingX, paddingY + 46, availW, 26, '-apple-system, sans-serif', '800');

    ctx.fillStyle = '#CBD5E1';
    ctx.font = '600 10px -apple-system, sans-serif';
    drawTruncatedText(`${origin} • ${process} • ${altitude} • ${roaster}`, paddingX, paddingY + 68, availW);

    // -----------------------------------------------------------------------
    // MODE A: SOLO GRANO (TERROIR & CUPPING SHOWCASE)
    // -----------------------------------------------------------------------
    if (!incRecipe) {
      // Large 3D Glass Hero Capsule
      const heroY = paddingY + 84;
      const heroH = 145;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, paddingX, heroY, availW, heroH, 12, true, true);

      // Centered 3D Glass Bean
      drawHeroAsset(ctx, 'aurora', paddingX + (availW / 2) - 65, heroY + 10, 130, 95);
      drawBadgeAsset(ctx, 'aurora', 'star', paddingX + (availW / 2) + 65, heroY + 20, 38);

      ctx.fillStyle = '#C084FC';
      ctx.font = '700 9px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`SCA CUPSCORE: ${scaScore}★ • CERTIFIED SENSORIAL CALIBRATION`, paddingX + (availW / 2), heroY + heroH - 12);
      ctx.textAlign = 'left';

      // 4 Terroir Matrix Tiles (2x2)
      const matY = heroY + heroH + 14;
      const matGap = 10;
      const colW = (availW - matGap) / 2;
      const colH = 68;

      const terroirMetrics = [
        { lbl: 'ORIGEN & PRODUCTOR', val: producer, sub: origin },
        { lbl: 'ALTITUD & TERROIR', val: altitude, sub: 'TIERRA VOLCÁNICA' },
        { lbl: 'VARIEDAD BOTÁNICA', val: variety, sub: 'ARABICA SPECIALTY' },
        { lbl: 'PROCESO DE BENEFICIO', val: process, sub: 'FERMENTACIÓN CONTROLADA' }
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
        ctx.font = '700 8px -apple-system, sans-serif';
        ctx.fillText(t.lbl, mx + 10, my + 16);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '800 12.5px -apple-system, sans-serif';
        drawTruncatedText(t.val, mx + 10, my + 38, colW - 20);

        ctx.fillStyle = '#38BDF8';
        ctx.font = '600 8px -apple-system, sans-serif';
        drawTruncatedText(t.sub, mx + 10, my + 56, colW - 20);
      });

      // Sensory Equalizer / Frequency Spectrum
      const specY = matY + (colH * 2) + matGap + 12;
      const specH = 92;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, paddingX, specY, availW, specH, 10, true, true);

      ctx.fillStyle = '#E2E8F0';
      ctx.font = '700 8.5px -apple-system, sans-serif';
      ctx.fillText('ESPECTRO SENSORIAL // FRECUENCIA DE CATA:', paddingX + 12, specY + 18);

      const auroraBars = [
        { name: 'ACIDEZ', level: 0.88, desc: 'Brillante' },
        { name: 'DULZOR', level: 0.92, desc: 'Frutal' },
        { name: 'CUERPO', level: 0.80, desc: 'Sedoso' },
        { name: 'BALANCE', level: 0.94, desc: 'Excepcional' }
      ];

      auroraBars.forEach((a, i) => {
        const ax = paddingX + 12;
        const ay = specY + 32 + (i * 14);
        ctx.fillStyle = '#A78BFA';
        ctx.font = '700 8px -apple-system, sans-serif';
        ctx.fillText(a.name, ax, ay);

        const barX = ax + 54;
        const barW = availW - 165;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.fillRect(barX, ay - 6, barW, 6);

        const barGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
        barGrad.addColorStop(0, '#8B5CF6');
        barGrad.addColorStop(0.5, '#EC4899');
        barGrad.addColorStop(1, '#06B6D4');
        ctx.fillStyle = barGrad;
        ctx.fillRect(barX, ay - 6, barW * a.level, 6);

        ctx.fillStyle = '#CBD5E1';
        ctx.font = '600 7.5px -apple-system, sans-serif';
        ctx.fillText(a.desc, barX + barW + 8, ay);
      });

      // Aromatic Descriptors
      const notesY = specY + specH + 12;
      const notesH = 54;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
      drawRoundedRect(ctx, paddingX, notesY, availW, notesH, 10, true, true);

      ctx.fillStyle = '#F472B6';
      ctx.font = '800 8px -apple-system, sans-serif';
      ctx.fillText('NOTAS AROMÁTICAS & DESCRIPTORES:', paddingX + 12, notesY + 16);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '700 12px -apple-system, sans-serif';
      const cleanNotes = flavorTags.length > 0 ? flavorTags.join('   ✦   ') : notesStr;
      drawTruncatedText(cleanNotes, paddingX + 12, notesY + 38, availW - 24);

      // Cryo Vault
      const vaultY = notesY + notesH + 10;
      ctx.fillStyle = 'rgba(6, 182, 212, 0.1)';
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
      drawRoundedRect(ctx, paddingX, vaultY, availW, 26, 6, true, true);

      ctx.fillStyle = '#38BDF8';
      ctx.font = '700 8.5px -apple-system, sans-serif';
      ctx.fillText(`❄️ CAVA BEANTAG: ${dosesStr} • VACÍO -18°C`, paddingX + 12, vaultY + 17);
    }

    // -----------------------------------------------------------------------
    // MODE B: CON RECETA (BARISTA EXTRACTION PROTOCOL)
    // -----------------------------------------------------------------------
    else {
      // Hero 3D Glass Viewport
      const heroBoxY = paddingY + 84;
      const heroBoxH = 114;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, paddingX, heroBoxY, availW, heroBoxH, 12, true, true);

      drawHeroAsset(ctx, 'aurora', paddingX + (availW / 2) - 55, heroBoxY + 10, 110, 80);
      drawBadgeAsset(ctx, 'aurora', 'star', paddingX + (availW / 2) + 50, heroBoxY + 20, 36);

      ctx.fillStyle = '#A78BFA';
      ctx.font = '700 8.5px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`SCA CUPSCORE: ${scaScore}★ • CERTIFIED SENSORIAL CALIBRATION`, paddingX + (availW / 2), heroBoxY + heroBoxH - 10);
      ctx.textAlign = 'left';

      // 4 Frosted Glass Parameter Tiles (2x2) with LARGE ICONS
      const bentoY = heroBoxY + heroBoxH + 14;
      const bentoGap = 10;
      const colW = (availW - bentoGap) / 2;
      const colH = 76;

      const metrics = [
        { type: 'method', lbl: 'MÉTODO', val: methodStr, sub: 'V60 60°' },
        { type: 'dose', lbl: 'DOSIS / RATIO', val: `${coffeeG}g → ${waterG}g`, sub: `RATIO ${ratioStr}` },
        { type: 'grind', lbl: 'MOLIENDA', val: `${microns} µm`, sub: 'CALIBRADA' },
        { type: 'time', lbl: 'TIEMPO / TEMP', val: `${timeStr} min`, sub: tempStr }
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

        // Prominent 40px Icon on Left
        drawMetricAsset(ctx, 'aurora', m.type, mx + 26, my + 38, 40);

        ctx.fillStyle = '#A78BFA';
        ctx.font = '700 8px -apple-system, sans-serif';
        ctx.fillText(m.lbl, mx + 54, my + 20);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '800 13px -apple-system, sans-serif';
        drawTruncatedText(m.val, mx + 54, my + 42, colW - 60);

        ctx.fillStyle = '#38BDF8';
        ctx.font = '600 8.5px -apple-system, sans-serif';
        ctx.fillText(m.sub, mx + 54, my + 62);
      });

      // Waveform Extraction Curve Bar
      const waveY = bentoY + (colH * 2) + bentoGap + 12;
      const waveH = 48;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, paddingX, waveY, availW, waveH, 10, true, true);

      drawBadgeAsset(ctx, 'aurora', 'wave', paddingX + 24, waveY + 24, 32);

      ctx.fillStyle = '#E2E8F0';
      ctx.font = '700 8.5px -apple-system, sans-serif';
      ctx.fillText('CURVA DE EXTRACCIÓN SENSORIAL // CLARIDAD', paddingX + 48, waveY + 16);

      const barX = paddingX + 48;
      const barY = waveY + 26;
      const barW = availW - 64;
      const barGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
      barGrad.addColorStop(0, '#8B5CF6');
      barGrad.addColorStop(0.5, '#EC4899');
      barGrad.addColorStop(1, '#06B6D4');
      ctx.fillStyle = barGrad;
      drawRoundedRect(ctx, barX, barY, barW, 8, 4, true, false);

      // Aromatic Descriptors
      const notesY = waveY + waveH + 12;
      const notesH = 50;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      drawRoundedRect(ctx, paddingX, notesY, availW, notesH, 10, true, true);

      ctx.fillStyle = '#F472B6';
      ctx.font = '800 8px -apple-system, sans-serif';
      ctx.fillText('NOTAS AROMÁTICAS & DESCRIPTORES:', paddingX + 12, notesY + 16);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '700 11.5px -apple-system, sans-serif';
      const cleanNotes = flavorTags.length > 0 ? flavorTags.join('   ✦   ') : notesStr;
      drawTruncatedText(cleanNotes, paddingX + 12, notesY + 36, availW - 24);
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

    // Authentic Chamfered Hangtag Corners
    const chamfer = 24;
    ctx.fillStyle = '#F1EDE4';
    ctx.beginPath();
    ctx.moveTo(chamfer, 0);
    ctx.lineTo(baseW - chamfer, 0);
    ctx.lineTo(baseW, chamfer);
    ctx.lineTo(baseW, baseH);
    ctx.lineTo(0, baseH);
    ctx.lineTo(0, chamfer);
    ctx.closePath();
    ctx.fill();

    // Subtle Double Frame
    ctx.strokeStyle = '#DDD7CD';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(paddingX - 10, paddingY - 10, availW + 20, baseH - (paddingY * 2) + 20);

    ctx.strokeStyle = '#E7E2D8';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(paddingX - 6, paddingY - 6, availW + 12, baseH - (paddingY * 2) + 12);

    // 1. Realistic 3D Metallic Brass Eyelet + String at Top Center
    const eyeletX = baseW / 2;
    const eyeletY = paddingY + 8;
    const eyeletR = 10;

    ctx.save();
    // Hanging loop twine string
    ctx.strokeStyle = '#C4B5A5';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(eyeletX, eyeletY - eyeletR);
    ctx.lineTo(eyeletX, 0);
    ctx.stroke();

    // Drop shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.18)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;

    // Brass outer ring
    ctx.fillStyle = '#A8A29E';
    ctx.beginPath();
    ctx.arc(eyeletX, eyeletY, eyeletR + 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#D6D3D1';
    ctx.beginPath();
    ctx.arc(eyeletX, eyeletY, eyeletR, 0, Math.PI * 2);
    ctx.fill();

    // Central hole
    ctx.fillStyle = '#1C1917';
    ctx.beginPath();
    ctx.arc(eyeletX, eyeletY, eyeletR - 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Editorial Top Label
    ctx.fillStyle = '#57534E';
    ctx.font = '700 8.5px "Playfair Display", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('ATELIER DE CAFÉ // ÉDITION LIMITÉE', baseW / 2, paddingY + 36);
    ctx.textAlign = 'left';

    // 3. Main Serif Title (WCAG AAA High-Contrast Charcoal)
    ctx.fillStyle = '#141210';
    drawFittedText(coffeeName, paddingX, paddingY + 68, availW, 25, '"Playfair Display", Georgia, serif', 'bold');

    ctx.fillStyle = '#44403C';
    ctx.font = 'italic 11px "Playfair Display", Georgia, serif';
    drawTruncatedText(`${origin} — ${producer || roaster} — ${altitude}`, paddingX, paddingY + 90, availW);

    // -----------------------------------------------------------------------
    // MODE A: SOLO GRANO (TERROIR & CUPPING SHOWCASE)
    // -----------------------------------------------------------------------
    if (!incRecipe) {
      // Large Centered Botanical Lithograph
      const heroY = paddingY + 102;
      const heroH = 145;

      ctx.strokeStyle = '#DDD7CD';
      ctx.lineWidth = 1;
      ctx.strokeRect(paddingX, heroY, availW, heroH);

      drawHeroAsset(ctx, 'hangtag', paddingX + (availW / 2) - 65, heroY + 10, 130, 105);

      ctx.fillStyle = '#57534E';
      ctx.font = 'italic 8.5px "Playfair Display", Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(`HERBARIUM // COFFEA ARABICA VAR. ${variety.toUpperCase()} // SCA ${scaScore}★`, baseW / 2, heroY + heroH - 10);
      ctx.textAlign = 'left';

      // Terroir Ledger Matrix (2x2)
      const matY = heroY + heroH + 14;
      const matGap = 10;
      const colW = (availW - matGap) / 2;
      const colH = 68;

      const terroirItems = [
        { lbl: 'DOMAINE & PRODUCTEUR', val: producer, sub: origin },
        { lbl: 'ALTITUDE & TERROIR', val: altitude, sub: 'TERROIR VOLCANIQUE' },
        { lbl: 'VARIÉTÉ BOTANIQUE', val: variety, sub: 'SÉLECTION PARCELLAIRE' },
        { lbl: 'FERMENTATION & MÉTHODE', val: process, sub: 'PROCESSUS NATUREL' }
      ];

      terroirItems.forEach((t, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const mx = paddingX + col * (colW + matGap);
        const my = matY + row * (colH + matGap);

        ctx.strokeStyle = '#DDD7CD';
        ctx.lineWidth = 1;
        ctx.strokeRect(mx, my, colW, colH);

        ctx.fillStyle = '#57534E';
        ctx.font = '700 8px "Playfair Display", Georgia, serif';
        ctx.fillText(t.lbl, mx + 10, my + 16);

        ctx.fillStyle = '#141210';
        ctx.font = 'bold 12px "Playfair Display", Georgia, serif';
        drawTruncatedText(t.val, mx + 10, my + 38, colW - 20);

        ctx.fillStyle = '#78716C';
        ctx.font = 'italic 8px "Playfair Display", Georgia, serif';
        drawTruncatedText(t.sub, mx + 10, my + 56, colW - 20);
      });

      // Poetic Tasting Quote Box
      const quoteY = matY + (colH * 2) + matGap + 12;
      const quoteH = 88;

      ctx.fillStyle = '#F2EFE7';
      ctx.strokeStyle = '#DDD7CD';
      drawRoundedRect(ctx, paddingX, quoteY, availW, quoteH, 6, true, true);

      ctx.fillStyle = '#292524';
      ctx.font = 'italic 11.5px "Playfair Display", Georgia, serif';
      const quoteText = `« Notes de dégustation: ${flavorTags.length > 0 ? flavorTags.join(', ') : notesStr}. Une tasse d'une pureté exceptionnelle et équilibre remarquable. »`;
      drawTruncatedText(quoteText, paddingX + 14, quoteY + 28, availW - 28);

      ctx.fillStyle = '#44403C';
      ctx.font = '700 9px "Playfair Display", Georgia, serif';
      ctx.fillText(`ÉVALUATION SENSORIELLE: SCA ${scaScore}★ // SÉLECTION EXCLUSIVE`, paddingX + 14, quoteY + 54);

      ctx.fillStyle = '#3F6212';
      ctx.font = 'bold 9px "Playfair Display", Georgia, serif';
      ctx.fillText(`❄️ CAVE BEANTAG: ${dosesStr} • EMBALLÉ SOUS VIDE`, paddingX + 14, quoteY + 74);
    }

    // -----------------------------------------------------------------------
    // MODE B: CON RECETA (BARISTA EXTRACTION PROTOCOL)
    // -----------------------------------------------------------------------
    else {
      // Hero Botanical Viewport
      const heroBoxY = paddingY + 104;
      const heroBoxH = 108;

      ctx.strokeStyle = '#DDD7CD';
      ctx.lineWidth = 1;
      ctx.strokeRect(paddingX, heroBoxY, availW, heroBoxH);

      drawHeroAsset(ctx, 'hangtag', paddingX + (availW / 2) - 55, heroBoxY + 8, 110, 80);

      ctx.fillStyle = '#57534E';
      ctx.font = 'italic 8px "Playfair Display", Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(`HERBARIUM // COFFEA ARABICA VAR. ${variety.toUpperCase()}`, baseW / 2, heroBoxY + heroBoxH - 8);
      ctx.textAlign = 'left';

      // 4 Metric Boxes (2x2) with LARGE ICONS
      const bentoY = heroBoxY + heroBoxH + 14;
      const bentoGap = 10;
      const colW = (availW - bentoGap) / 2;
      const colH = 76;

      const metrics = [
        { type: 'method', lbl: 'MÉTHODE', val: methodStr, sub: 'Extraction douce' },
        { type: 'dose', lbl: 'DOSAGE', val: `${coffeeG}g / ${waterG}g`, sub: `Ratio ${ratioStr}` },
        { type: 'grind', lbl: 'MOUTÚRE', val: `${microns} µm`, sub: 'Calibrée' },
        { type: 'time', lbl: 'TEMPS / TEMP', val: `${timeStr}`, sub: tempStr }
      ];

      metrics.forEach((m, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const mx = paddingX + col * (colW + bentoGap);
        const my = bentoY + row * (colH + bentoGap);

        ctx.strokeStyle = '#DDD7CD';
        ctx.lineWidth = 1;
        ctx.strokeRect(mx, my, colW, colH);

        // Prominent 38px Icon on Left
        drawMetricAsset(ctx, 'hangtag', m.type, mx + 24, my + 38, 38);

        ctx.fillStyle = '#57534E';
        ctx.font = '700 8px "Playfair Display", Georgia, serif';
        ctx.fillText(m.lbl, mx + 50, my + 20);

        ctx.fillStyle = '#141210';
        ctx.font = 'bold 12.5px "Playfair Display", Georgia, serif';
        drawTruncatedText(m.val, mx + 50, my + 42, colW - 56);

        ctx.fillStyle = '#78716C';
        ctx.font = 'italic 8.5px "Playfair Display", Georgia, serif';
        ctx.fillText(m.sub, mx + 50, my + 62);
      });

      // Botanical Tasting Quote Box
      const quoteY = bentoY + (colH * 2) + bentoGap + 14;
      const quoteH = 68;

      ctx.fillStyle = '#F2EFE7';
      ctx.strokeStyle = '#DDD7CD';
      drawRoundedRect(ctx, paddingX, quoteY, availW, quoteH, 6, true, true);

      ctx.fillStyle = '#292524';
      ctx.font = 'italic 11px "Playfair Display", Georgia, serif';
      const quoteText = `« Notes de dégustation: ${flavorTags.length > 0 ? flavorTags.join(', ') : notesStr}. Une tasse d'une pureté remarquable. »`;
      drawTruncatedText(quoteText, paddingX + 14, quoteY + 28, availW - 28);

      ctx.fillStyle = '#44403C';
      ctx.font = '700 9px "Playfair Display", Georgia, serif';
      ctx.fillText(`ÉVALUATION SENSORIELLE: SCA ${scaScore}★ // SÉLECTION EXCLUSIVE`, paddingX + 14, quoteY + 52);
    }

    // Roastery Wax Seal Stamp & Atelier Footer
    const sealX = baseW - paddingX - 32;
    const sealY = baseH - paddingY - 32;
    drawBadgeAsset(ctx, 'hangtag', 'seal', sealX, sealY, 46);

    const footY = baseH - paddingY - 26;
    ctx.fillStyle = '#57534E';
    ctx.font = '600 8.5px "Playfair Display", Georgia, serif';
    ctx.fillText(`BEANTAG ATELIER // ARCHIVE ${new Date().getFullYear()} // LOT ARTISANAL`, paddingX, footY + 12);
  }

  return canvas.toDataURL('image/png', 1.0);
}

/**
 * Generates an Ultra-HD Visual Specialty Coffee Menu Card (Cellar Inventory)
 * Vertical Architecture tailored for mobile sharing with zero dead space.
 */
export async function generateCoffeeMenuCardImage(batches, template = 'blueprint') {
  const style = normalizeCardStyle(template);

  await Promise.all([
    ensureCardAssetsLoaded(style),
    ensureFontsLoaded()
  ]);

  const validBatches = Array.isArray(batches) ? batches.filter(b => (b.remaining_doses || b.weight_current_g || 0) > 0) : [];
  const displayList = validBatches.length > 0 ? validBatches : (Array.isArray(batches) ? batches.slice(0, 10) : []);

  const canvas = document.createElement('canvas');
  const scaleFactor = 2;
  const baseW = 540;

  const headerH = 130;
  const itemH = 76;
  const footerH = 70;
  const baseH = Math.max(760, headerH + (displayList.length * itemH) + footerH);

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

    drawHeroAsset(ctx, 'blueprint', baseW - paddingX - 85, paddingY + 6, 75, 60);

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
      ctx.fillStyle = 'rgba(14, 165, 233, 0.08)';
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, paddingX, curY, availW, itemH - 10, 6, true, true);

      drawMetricAsset(ctx, 'blueprint', 'method', paddingX + 22, curY + (itemH - 10) / 2, 34);

      ctx.fillStyle = '#7DD3FC';
      ctx.font = '900 10.5px "JetBrains Mono", monospace';
      ctx.fillText(`0${idx + 1}.`, paddingX + 46, curY + 22);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 12.5px "JetBrains Mono", monospace';
      const name = stripEmojis(b.batch_name || b.name || b.coffee_name || 'Café');
      ctx.fillText(name.length > 22 ? name.slice(0, 22) + '…' : name, paddingX + 72, curY + 22);

      ctx.fillStyle = '#93C5FD';
      ctx.font = '700 9px "JetBrains Mono", monospace';
      ctx.fillText(`${stripEmojis(b.origin || '')} • ${stripEmojis(b.process || '')}`, paddingX + 46, curY + 44);

      const doseText = `${b.remaining_doses || 0} TUBOS`;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.fillRect(baseW - paddingX - 84, curY + 16, 76, 24);
      ctx.fillStyle = '#38BDF8';
      ctx.font = '900 9.5px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(doseText, baseW - paddingX - 46, curY + 32);
      ctx.textAlign = 'left';

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

    drawHeroAsset(ctx, 'neobrutalist', baseW - paddingX - 70, paddingY + 28, 65, 55);

    ctx.fillStyle = '#000000';
    ctx.fillRect(paddingX, paddingY + 72, availW, 3);

    let curY = paddingY + 86;
    displayList.forEach((b, idx) => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(paddingX + 3, curY + 3, availW, itemH - 12);
      ctx.fillStyle = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
      ctx.fillRect(paddingX, curY, availW, itemH - 12);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(paddingX, curY, availW, itemH - 12);

      drawMetricAsset(ctx, 'neobrutalist', 'method', paddingX + 22, curY + (itemH - 12) / 2, 34);

      ctx.fillStyle = '#000000';
      ctx.font = '900 12px "Space Grotesk", sans-serif';
      const name = stripEmojis(b.batch_name || b.name || b.coffee_name || 'Café');
      ctx.fillText(`${idx + 1}. ${name.length > 20 ? name.slice(0, 20) + '…' : name}`, paddingX + 46, curY + 22);

      ctx.fillStyle = '#64748B';
      ctx.font = '700 9.5px "Space Grotesk", sans-serif';
      ctx.fillText(`${stripEmojis(b.origin || '')} • ${stripEmojis(b.process || '')}`, paddingX + 46, curY + 42);

      ctx.fillStyle = '#000000';
      ctx.fillRect(baseW - paddingX - 82, curY + 14, 76, 24);
      ctx.fillStyle = '#D4FF00';
      ctx.fillRect(baseW - paddingX - 84, curY + 12, 76, 24);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(baseW - paddingX - 84, curY + 12, 76, 24);

      ctx.fillStyle = '#000000';
      ctx.font = '900 9.5px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${b.remaining_doses || 0} TUBOS`, baseW - paddingX - 46, curY + 28);
      ctx.textAlign = 'left';

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

    drawHeroAsset(ctx, 'aurora', baseW - paddingX - 80, paddingY + 6, 75, 60);

    ctx.fillStyle = '#C084FC';
    ctx.font = '800 9px -apple-system, sans-serif';
    ctx.fillText('HOLOGRAPHIC CELLAR // BEANTAG VISION', paddingX, paddingY + 18);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 19px -apple-system, sans-serif';
    ctx.fillText('CATÁLOGO DE CAFÉS ESPECIALES', paddingX, paddingY + 44);

    let curY = paddingY + 84;
    displayList.forEach((b, idx) => {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      drawRoundedRect(ctx, paddingX, curY, availW, itemH - 12, 8, true, true);

      drawMetricAsset(ctx, 'aurora', 'method', paddingX + 22, curY + (itemH - 12) / 2, 34);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 12.5px -apple-system, sans-serif';
      const name = stripEmojis(b.batch_name || b.name || b.coffee_name || 'Café');
      ctx.fillText(`${idx + 1}. ${name.length > 20 ? name.slice(0, 20) + '…' : name}`, paddingX + 46, curY + 22);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '500 9.5px -apple-system, sans-serif';
      ctx.fillText(`${stripEmojis(b.origin || '')} • ${stripEmojis(b.process || '')}`, paddingX + 46, curY + 42);

      ctx.fillStyle = '#C084FC';
      ctx.font = '700 10.5px -apple-system, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${b.remaining_doses || 0} Tubos`, baseW - paddingX - 16, curY + 32);
      ctx.textAlign = 'left';

      curY += itemH;
    });
  }

  // 4. HANGTAG MENU
  else if (style === 'hangtag') {
    ctx.fillStyle = '#F8F5EE';
    ctx.fillRect(0, 0, baseW, baseH);

    drawHeroAsset(ctx, 'hangtag', baseW - paddingX - 80, paddingY + 6, 75, 60);

    ctx.fillStyle = '#57534E';
    ctx.font = '700 8.5px "Playfair Display", Georgia, serif';
    ctx.fillText('ATELIER DE CAFÉ // CATALOGUE DES CRUS', paddingX, paddingY + 18);

    ctx.fillStyle = '#141210';
    ctx.font = 'bold 20px "Playfair Display", Georgia, serif';
    ctx.fillText('SÉLECTION DE BODEGA', paddingX, paddingY + 46);

    let curY = paddingY + 84;
    displayList.forEach((b, idx) => {
      ctx.strokeStyle = '#DDD7CD';
      ctx.beginPath();
      ctx.moveTo(paddingX, curY + itemH - 12);
      ctx.lineTo(baseW - paddingX, curY + itemH - 12);
      ctx.stroke();

      drawMetricAsset(ctx, 'hangtag', 'method', paddingX + 20, curY + 24, 30);

      ctx.fillStyle = '#141210';
      ctx.font = 'bold 12.5px "Playfair Display", Georgia, serif';
      const name = stripEmojis(b.batch_name || b.name || b.coffee_name || 'Café');
      ctx.fillText(`0${idx + 1}. ${name.length > 20 ? name.slice(0, 20) + '…' : name}`, paddingX + 42, curY + 22);

      ctx.fillStyle = '#57534E';
      ctx.font = 'italic 9.5px "Playfair Display", Georgia, serif';
      ctx.fillText(`${stripEmojis(b.origin || '')} — ${stripEmojis(b.process || '')}`, paddingX + 42, curY + 42);

      ctx.fillStyle = '#3F6212';
      ctx.font = 'bold 10.5px "Playfair Display", Georgia, serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${b.remaining_doses || 0} Dosis`, baseW - paddingX - 14, curY + 32);
      ctx.textAlign = 'left';

      curY += itemH;
    });

    drawBadgeAsset(ctx, 'hangtag', 'seal', baseW - paddingX - 28, baseH - paddingY - 20, 36);
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
    const name = b.batch_name || b.name || b.coffee_name || 'Café de Especialidad';
    const roaster = b.roaster ? ` • ${b.roaster}` : '';
    const origin = b.origin ? `🌍 Origen: ${b.origin}` : '';
    const altitude = b.altitude ? ` (${b.altitude}m)` : '';
    const variety = b.variety ? `🌾 Variedad: ${b.variety}` : '';
    const process = b.process ? ` | Proceso: ${b.process}` : '';
    const notes = b.roaster_notes ? `✨ Notas: ${b.roaster_notes}` : '';
    const doses = b.remaining_doses !== undefined ? `📦 Stock: ${b.remaining_doses} tubos (~${Math.round(b.remaining_weight_g || b.remaining_doses * (parseFloat(b.dose_weight) || 20))}g)` : (b.weight_current_g ? `📦 Stock: ${b.weight_current_g}g` : '');

    text += `*${num}. ${name}*${roaster}\n`;
    if (origin || altitude) text += `   ${origin}${altitude}\n`;
    if (variety || process) text += `   ${variety}${process}\n`;
    if (notes) text += `   ${notes}\n`;
    if (doses) text += `   ${doses}\n`;
    text += `\n`;
  });

  text += `─────────────────────\n`;
  text += `📱 _Gestionado con BeanTag Specialty Coffee App_`;
  return text;
}
