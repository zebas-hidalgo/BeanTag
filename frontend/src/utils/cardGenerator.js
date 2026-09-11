// --- BEANTAG AESTHETIC TICKET & CARD GENERATOR (2026/2027) ---
// Retina 2x Canvas rendering with authentic AI-generated Nanobanana/Imagen
// visual asset kits (Blueprint, Neo-Brutalist, Holographic Aurora, Nordic Hangtag).

import {
  ensureCardAssetsLoaded,
  drawHeroAsset,
  drawMetricAsset,
  drawBadgeAsset,
  drawCardAsset,
  drawBlueprintBean,
  drawNeobrutalistBean,
  drawNeobrutalistStar,
  drawAuroraBean,
  drawHangtagBotanical,
  drawHangtagSeal
} from './ticketIconKits';

/**
 * Normalizes template names to the 4 official 2026/2027 styles:
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
 * Extracts flavor notes into tags array
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
  if (!grind) return 850;
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
  return 850;
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
 * Generates an Ultra-Aesthetic Share Card (840 x 580 px @ 2x Retina = 1680 x 1160 px)
 * incorporating authentic Nanobanana visual asset kits.
 */
export async function generateRecipeCardImage(recipe, template = 'blueprint', incRecipe = true) {
  const style = normalizeCardStyle(template);

  // Ensure all image assets for this style are loaded in memory
  await ensureCardAssetsLoaded(style);

  const canvas = document.createElement('canvas');
  const scaleFactor = 2;
  const baseW = 840;
  const baseH = 580;

  canvas.width = baseW * scaleFactor;
  canvas.height = baseH * scaleFactor;

  const ctx = canvas.getContext('2d');
  ctx.scale(scaleFactor, scaleFactor);

  // Helper text fitters
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

  const drawFittedText = (text, x, y, maxWidth, initialSize = 24, fontName = 'Space Grotesk, sans-serif', weight = '800') => {
    const str = String(text || '');
    let size = initialSize;
    ctx.font = `${weight} ${size}px ${fontName}`;
    while (ctx.measureText(str).width > maxWidth && size > 14) {
      size -= 1;
      ctx.font = `${weight} ${size}px ${fontName}`;
    }
    ctx.fillText(str, x, y);
  };

  // Extract variables
  const coffeeName = stripEmojis(recipe.batch_name || recipe.coffee_name || 'Café de Especialidad');
  const origin = stripEmojis(recipe.origin || 'Origen Desconocido');
  const roaster = stripEmojis(recipe.roaster || 'Tostaduría Artesanal');
  const producer = stripEmojis(recipe.producer || recipe.batch_producer || '');
  const process = stripEmojis(recipe.process || 'Lavado');
  const variety = stripEmojis(recipe.variety || 'Heirloom');
  const altitude = recipe.altitude ? `${recipe.altitude}m` : '1.850m';
  const notesStr = recipe.flavor_notes || recipe.notes || 'Notas limpias, balance y dulzor';
  const flavorTags = extractFlavorTags(notesStr);
  const scaScore = recipe.sca_score || recipe.score || 88.5;

  const methodStr = stripEmojis(recipe.method || 'V60');
  const coffeeG = recipe.coffee_grams || 15;
  const waterG = recipe.water_grams || 225;
  const ratioStr = recipe.ratio || `1:${(waterG / (coffeeG || 1)).toFixed(1)}`;
  const grindStr = stripEmojis(recipe.grind_size || 'Medio-Fino');
  const microns = parseGrindToMicrons(grindStr);
  const tempStr = recipe.temp ? `${recipe.temp}°C` : '93°C';
  const timeStr = recipe.time ? `${recipe.time}` : '02:45';

  const paddingX = 36;
  const paddingY = 32;
  const availW = baseW - (paddingX * 2);

  // =========================================================================
  // 1. STYLE: BLUEPRINT TÉCNICO
  // =========================================================================
  if (style === 'blueprint') {
    // Deep Cyanotype Background
    ctx.fillStyle = '#07192F';
    ctx.fillRect(0, 0, baseW, baseH);

    // Millimeter Grid
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.lineWidth = 1;
    const gridSize = 20;
    ctx.beginPath();
    for (let x = 0; x <= baseW; x += gridSize) { ctx.moveTo(x, 0); ctx.lineTo(x, baseH); }
    for (let y = 0; y <= baseH; y += gridSize) { ctx.moveTo(0, y); ctx.lineTo(baseW, y); }
    ctx.stroke();

    // Outer Technical Border with corner registration marks
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1.5;
    const bx = paddingX - 10;
    const by = paddingY - 10;
    const bw = availW + 20;
    const bh = baseH - (paddingY * 2) + 20;
    ctx.strokeRect(bx, by, bw, bh);

    // Corner crosshairs (+)
    const drawCross = (cx, cy) => {
      ctx.beginPath();
      ctx.moveTo(cx - 6, cy); ctx.lineTo(cx + 6, cy);
      ctx.moveTo(cx, cy - 6); ctx.lineTo(cx, cy + 6);
      ctx.stroke();
    };
    drawCross(bx, by);
    drawCross(bx + bw, by);
    drawCross(bx, by + bh);
    drawCross(bx + bw, by + bh);

    // Header Left
    ctx.fillStyle = '#38BDF8';
    ctx.font = '700 8.5px "JetBrains Mono", monospace';
    ctx.fillText(`// PATENT SPEC: COFFEA ARABICA VAR. ${variety.toUpperCase()}`, paddingX, paddingY + 12);

    ctx.fillStyle = '#FFFFFF';
    drawFittedText(coffeeName.toUpperCase(), paddingX, paddingY + 40, availW - 190, 24, '"JetBrains Mono", monospace', '900');

    ctx.fillStyle = '#93C5FD';
    ctx.font = '700 10.5px "JetBrains Mono", monospace';
    ctx.fillText(`${origin.toUpperCase()} • ${process.toUpperCase()} • ${altitude} • ROAST: ${roaster.toUpperCase()}`, paddingX, paddingY + 62);

    // Header Right: HERO CAD SCHEMATIC CONTAINER
    const heroBoxW = 160;
    const heroBoxH = 88;
    const heroBoxX = baseW - paddingX - heroBoxW;
    const heroBoxY = paddingY - 4;

    ctx.fillStyle = 'rgba(14, 165, 233, 0.08)';
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1.2;
    drawRoundedRect(ctx, heroBoxX, heroBoxY, heroBoxW, heroBoxH, 6, true, true);

    // Draw the authentic CAD Bean cross-section schematic
    drawHeroAsset(ctx, 'blueprint', heroBoxX + 15, heroBoxY + 4, 130, 60);

    ctx.fillStyle = '#4ADE80';
    ctx.font = '800 8.5px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`SCA: ${scaScore}★ // PASSED`, heroBoxX + (heroBoxW / 2), heroBoxY + heroBoxH - 8);
    ctx.textAlign = 'left';

    // Divider Line
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(paddingX, paddingY + 92);
    ctx.lineTo(baseW - paddingX, paddingY + 92);
    ctx.stroke();

    // Body: Recipe vs Bean Only
    if (incRecipe) {
      // 4 Metric Boxes with Authentic CAD Icons
      const metricY = paddingY + 104;
      const cols = 4;
      const gap = 12;
      const colW = (availW - (gap * (cols - 1))) / cols;
      const colH = 76;

      const metrics = [
        { type: 'method', lbl: 'MÉTODO CAD', val: methodStr.toUpperCase(), sub: 'CONICAL 60°' },
        { type: 'dose', lbl: 'DOSIS IN/OUT', val: `${coffeeG}g → ${waterG}g`, sub: `RATIO ${ratioStr}` },
        { type: 'grind', lbl: 'MOLIENDA', val: microns ? `${microns} µm` : grindStr.toUpperCase(), sub: 'CALIBRATED' },
        { type: 'time', lbl: 'TIEMPO/TEMP', val: `${timeStr} min`, sub: tempStr }
      ];

      metrics.forEach((m, i) => {
        const x = paddingX + i * (colW + gap);
        ctx.fillStyle = 'rgba(14, 165, 233, 0.08)';
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 1;
        drawRoundedRect(ctx, x, metricY, colW, colH, 6, true, true);

        // Draw dedicated CAD icon in top-right of box
        drawMetricAsset(ctx, 'blueprint', m.type, x + colW - 22, metricY + 22, 34);

        ctx.fillStyle = '#7DD3FC';
        ctx.font = '800 8.5px "JetBrains Mono", monospace';
        ctx.fillText(m.lbl, x + 10, metricY + 18);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 13px "JetBrains Mono", monospace';
        drawTruncatedText(m.val, x + 10, metricY + 42, colW - 44);

        ctx.fillStyle = '#38BDF8';
        ctx.font = '700 8px "JetBrains Mono", monospace';
        ctx.fillText(m.sub, x + 10, metricY + 62);
      });

      // Pour Timeline Progress Bar
      const flowY = metricY + colH + 16;
      ctx.fillStyle = 'rgba(14, 165, 233, 0.05)';
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      drawRoundedRect(ctx, paddingX, flowY, availW, 52, 6, true, true);
      ctx.setLineDash([]);

      ctx.fillStyle = '#7DD3FC';
      ctx.font = '700 8.5px "JetBrains Mono", monospace';
      ctx.fillText('BLOOM (0:00): 45g', paddingX + 16, flowY + 16);
      ctx.fillText('VERTIDO 2 (0:45): +90g', paddingX + 180, flowY + 16);
      ctx.fillText('VERTIDO 3 (1:30): +90g', paddingX + 380, flowY + 16);
      ctx.fillStyle = '#4ADE80';
      ctx.fillText(`TOTAL: ${waterG}g (${ratioStr})`, paddingX + availW - 140, flowY + 16);

      // Progress bar
      const barY = flowY + 26;
      const barW = availW - 32;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
      drawRoundedRect(ctx, paddingX + 16, barY, barW, 10, 5, true, false);

      ctx.fillStyle = '#38BDF8';
      drawRoundedRect(ctx, paddingX + 16, barY, barW * 0.2, 10, 5, true, false);
      ctx.fillStyle = '#60A5FA';
      drawRoundedRect(ctx, paddingX + 16 + (barW * 0.2), barY, barW * 0.4, 10, 5, true, false);
      ctx.fillStyle = '#93C5FD';
      drawRoundedRect(ctx, paddingX + 16 + (barW * 0.6), barY, barW * 0.4, 10, 5, true, false);

      // Sensory Descriptors
      const notesY = flowY + 68;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.05)';
      ctx.fillRect(paddingX, notesY, availW, 44);
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(paddingX, notesY, 4, 44);

      ctx.fillStyle = '#7DD3FC';
      ctx.font = '800 8.5px "JetBrains Mono", monospace';
      ctx.fillText('SENSORY DESCRIPTORS & TASTING PROFILE:', paddingX + 14, notesY + 15);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 12px "JetBrains Mono", monospace';
      const cleanNotes = flavorTags.length > 0 ? flavorTags.join(' • ') : notesStr;
      drawTruncatedText(cleanNotes, paddingX + 14, notesY + 33, availW - 28);

    } else {
      // Bean Only layout with 4 big blocks & CAD illustrations
      const bodyY = paddingY + 110;
      const bodyH = 220;
      const colW = (availW - 16) / 2;

      // Left Box: Origin & Terroir
      ctx.fillStyle = 'rgba(14, 165, 233, 0.08)';
      ctx.strokeStyle = '#38BDF8';
      drawRoundedRect(ctx, paddingX, bodyY, colW, bodyH, 8, true, true);
      ctx.fillStyle = '#38BDF8';
      ctx.font = '800 9.5px "JetBrains Mono", monospace';
      ctx.fillText('// TERROIR & HARVEST SPEC', paddingX + 16, bodyY + 24);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 13px "JetBrains Mono", monospace';
      ctx.fillText(`VARIEDAD: ${variety.toUpperCase()}`, paddingX + 16, bodyY + 54);
      ctx.fillText(`PROCESO: ${process.toUpperCase()}`, paddingX + 16, bodyY + 80);
      ctx.fillText(`ALTITUD: ${altitude}`, paddingX + 16, bodyY + 106);
      ctx.fillText(`ORIGEN: ${origin.toUpperCase()}`, paddingX + 16, bodyY + 132);
      ctx.fillText(`TOSTADOR: ${roaster.toUpperCase()}`, paddingX + 16, bodyY + 158);

      // Right Box: Sensory Notes & CAD Scale
      const rX = paddingX + colW + 16;
      ctx.fillStyle = 'rgba(14, 165, 233, 0.08)';
      ctx.strokeStyle = '#38BDF8';
      drawRoundedRect(ctx, rX, bodyY, colW, bodyH, 8, true, true);
      ctx.fillStyle = '#38BDF8';
      ctx.font = '800 9.5px "JetBrains Mono", monospace';
      ctx.fillText('// SENSORY CUPPING EVALUATION', rX + 16, bodyY + 24);

      ctx.fillStyle = '#4ADE80';
      ctx.font = '900 16px "JetBrains Mono", monospace';
      ctx.fillText(`CALIDAD: SCA ${scaScore}★ PASSED`, rX + 16, bodyY + 58);

      // Draw CAD dripper & water in sensory box
      drawMetricAsset(ctx, 'blueprint', 'method', rX + colW - 40, bodyY + 58, 48);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 12px "JetBrains Mono", monospace';
      flavorTags.slice(0, 4).forEach((t, i) => {
        ctx.fillText(`[✓] ${t.toUpperCase()}`, rX + 16, bodyY + 94 + (i * 26));
      });
    }

    // Architectural Title Block (Bottom)
    const tbY = baseH - paddingY - 42;
    const tbH = 42;
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(paddingX, tbY, availW, tbH);

    const b1W = 160;
    const b2W = 200;
    const b3W = 160;

    ctx.beginPath();
    ctx.moveTo(paddingX + b1W, tbY); ctx.lineTo(paddingX + b1W, tbY + tbH);
    ctx.moveTo(paddingX + b1W + b2W, tbY); ctx.lineTo(paddingX + b1W + b2W, tbY + tbH);
    ctx.moveTo(paddingX + b1W + b2W + b3W, tbY); ctx.lineTo(paddingX + b1W + b2W + b3W, tbY + tbH);
    ctx.stroke();

    ctx.fillStyle = '#7DD3FC';
    ctx.font = '700 7px "JetBrains Mono", monospace';
    ctx.fillText('DWG NO:', paddingX + 8, tbY + 12);
    ctx.fillText('ROASTER / LAB:', paddingX + b1W + 8, tbY + 12);
    ctx.fillText('SCALE / STATUS:', paddingX + b1W + b2W + 8, tbY + 12);
    ctx.fillText('ARCHIVE SYSTEM:', paddingX + b1W + b2W + b3W + 8, tbY + 12);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 10.5px "JetBrains Mono", monospace';
    ctx.fillText('BT-2027-CAD', paddingX + 8, tbY + 30);
    drawTruncatedText(roaster.toUpperCase(), paddingX + b1W + 8, tbY + 30, b2W - 16);
    ctx.fillText('1:1 CALIBRATED', paddingX + b1W + b2W + 8, tbY + 30);
    ctx.fillText('BEANTAG SPECIALTY', paddingX + b1W + b2W + b3W + 8, tbY + 30);
  }

  // =========================================================================
  // 2. STYLE: NEO-BRUTALIST POP (TOKYO STREETWEAR)
  // =========================================================================
  else if (style === 'neobrutalist') {
    // Pure White Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, baseW, baseH);

    // Header Pill Badge (Top Left)
    const badgeW = 260;
    const badgeH = 26;
    ctx.fillStyle = '#000000';
    ctx.fillRect(paddingX + 3, paddingY + 3, badgeW, badgeH);
    ctx.fillStyle = '#E2F952'; // Acid Lime
    ctx.fillRect(paddingX, paddingY, badgeW, badgeH);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(paddingX, paddingY, badgeW, badgeH);

    ctx.fillStyle = '#000000';
    ctx.font = '900 10.5px "Space Grotesk", sans-serif';
    ctx.fillText('★ TOKYO STREETWEAR // ROASTERY ★', paddingX + 12, paddingY + 17);

    // Huge Brutalist Title
    ctx.fillStyle = '#111827';
    drawFittedText(coffeeName.toUpperCase(), paddingX, paddingY + 68, availW - 200, 32, '"Space Grotesk", sans-serif', '900');

    // Tags Bar
    const tagY = paddingY + 84;
    const tags = [
      { text: origin.toUpperCase(), bg: '#FF4B26', color: '#FFF' },
      { text: process.toUpperCase(), bg: '#FFFFFF', color: '#000' },
      { text: altitude, bg: '#D8B4FE', color: '#000' },
      { text: roaster.toUpperCase(), bg: '#E2F952', color: '#000' }
    ];

    let curTagX = paddingX;
    tags.forEach(t => {
      ctx.font = '900 10px "Space Grotesk", sans-serif';
      const tw = ctx.measureText(t.text).width + 16;
      ctx.fillStyle = '#000000';
      ctx.fillRect(curTagX + 2, tagY + 2, tw, 22);
      ctx.fillStyle = t.bg;
      ctx.fillRect(curTagX, tagY, tw, 22);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(curTagX, tagY, tw, 22);

      ctx.fillStyle = t.color;
      ctx.fillText(t.text, curTagX + 8, tagY + 15);
      curTagX += tw + 10;
    });

    // HERO STICKER RIGHT: Cool Bean with Sunglasses + Star Badge
    const heroBoxX = baseW - paddingX - 160;
    const heroBoxY = paddingY - 6;
    drawHeroAsset(ctx, 'neobrutalist', heroBoxX, heroBoxY, 110, 100);
    drawBadgeAsset(ctx, 'neobrutalist', 'star', heroBoxX + 130, heroBoxY + 36, 48);

    // Thick Divider
    ctx.fillStyle = '#000000';
    ctx.fillRect(paddingX, paddingY + 118, availW, 3.5);

    // Body
    if (incRecipe) {
      // 4 Bento Metric Boxes with Hard Black Drop Shadows & Pop Stickers
      const metricY = paddingY + 132;
      const cols = 4;
      const gap = 14;
      const colW = (availW - (gap * (cols - 1))) / cols;
      const colH = 88;

      const metrics = [
        { type: 'method', lbl: 'MÉTODO', val: methodStr.toUpperCase(), bg: '#E2F952' },
        { type: 'dose', lbl: 'DOSIS IN/OUT', val: `${coffeeG}g → ${waterG}g`, bg: '#FFFFFF' },
        { type: 'grind', lbl: 'MOLIENDA', val: microns ? `${microns} µm` : grindStr.toUpperCase(), bg: '#FF4B26', valColor: '#FFF' },
        { type: 'time', lbl: 'TIEMPO/TEMP', val: `${timeStr} / ${tempStr}`, bg: '#FFFFFF' }
      ];

      metrics.forEach((m, i) => {
        const x = paddingX + i * (colW + gap);
        // Hard 4px shadow
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + 4, metricY + 4, colW, colH);

        // Box background
        ctx.fillStyle = m.bg;
        ctx.fillRect(x, metricY, colW, colH);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(x, metricY, colW, colH);

        // Draw dedicated sticker icon inside each box
        drawMetricAsset(ctx, 'neobrutalist', m.type, x + colW - 24, metricY + 26, 38);

        ctx.fillStyle = m.valColor || '#000000';
        ctx.font = '900 9px "Space Grotesk", sans-serif';
        ctx.fillText(m.lbl, x + 10, metricY + 20);

        ctx.font = '900 13px "Space Grotesk", sans-serif';
        drawTruncatedText(m.val, x + 10, metricY + 50, colW - 36);

        // Little bottom badge
        ctx.fillStyle = '#000000';
        ctx.font = '800 8.5px monospace';
        ctx.fillText(i === 1 ? `RATIO ${ratioStr}` : 'SPECIALTY', x + 10, metricY + 74);
      });

      // Flavor Notes Stickers Bento
      const notesY = metricY + colH + 16;
      const notesH = 80;

      ctx.fillStyle = '#000000';
      ctx.fillRect(paddingX + 4, notesY + 4, availW, notesH);
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(paddingX, notesY, availW, notesH);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(paddingX, notesY, availW, notesH);

      ctx.fillStyle = '#000000';
      ctx.font = '900 10.5px "Space Grotesk", sans-serif';
      ctx.fillText('⚡ PERFIL SENSORIAL // POP STICKERS:', paddingX + 16, notesY + 24);

      // Render flavor pills
      let pillX = paddingX + 16;
      const pillY = notesY + 38;
      const pillColors = ['#E2F952', '#FF4B26', '#D8B4FE', '#67E8F9', '#FED7AA'];

      const displayTags = flavorTags.length > 0 ? flavorTags : ['Notas Limpias', 'Balance', 'Dulzor Frutal'];
      displayTags.slice(0, 5).forEach((tag, idx) => {
        const bgCol = pillColors[idx % pillColors.length];
        ctx.font = '900 11px "Space Grotesk", sans-serif';
        const pw = ctx.measureText(tag.toUpperCase()).width + 20;

        if (pillX + pw < paddingX + availW - 20) {
          ctx.fillStyle = '#000000';
          ctx.fillRect(pillX + 2, pillY + 2, pw, 26);
          ctx.fillStyle = bgCol;
          ctx.fillRect(pillX, pillY, pw, 26);
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          ctx.strokeRect(pillX, pillY, pw, 26);

          ctx.fillStyle = bgCol === '#FF4B26' ? '#FFFFFF' : '#000000';
          ctx.fillText(tag.toUpperCase(), pillX + 10, pillY + 17);

          pillX += pw + 12;
        }
      });
    }

    // Authentic POS Barcode (Bottom)
    const bcY = baseH - paddingY - 42;
    const barPattern = [3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 4, 1, 3, 1, 2, 4, 2, 3, 1, 4];
    let curBarX = paddingX;
    ctx.fillStyle = '#000000';
    barPattern.forEach((w, i) => {
      if (i % 2 === 0) {
        ctx.fillRect(curBarX, bcY, w * 2.6, 26);
      }
      curBarX += (w * 2.6) + 2.5;
    });

    ctx.fillStyle = '#000000';
    ctx.font = '900 9.5px "Space Grotesk", sans-serif';
    ctx.fillText(`BEANTAG SPECIALTY // ARCHIVE 2027 // SCA: ${scaScore}★`, curBarX + 18, bcY + 17);
  }

  // =========================================================================
  // 3. STYLE: HOLOGRAPHIC AURORA (VISIONOS DARK GLASS)
  // =========================================================================
  else if (style === 'aurora') {
    // Obsidian Dark Base
    ctx.fillStyle = '#08090E';
    ctx.fillRect(0, 0, baseW, baseH);

    // Radial Aurora Glows
    const grad1 = ctx.createRadialGradient(baseW * 0.82, baseH * 0.22, 0, baseW * 0.82, baseH * 0.22, 340);
    grad1.addColorStop(0, 'rgba(139, 92, 246, 0.45)');
    grad1.addColorStop(1, 'rgba(139, 92, 246, 0)');
    ctx.fillStyle = grad1;
    ctx.fillRect(0, 0, baseW, baseH);

    const grad2 = ctx.createRadialGradient(baseW * 0.18, baseH * 0.78, 0, baseW * 0.18, baseH * 0.78, 300);
    grad2.addColorStop(0, 'rgba(6, 182, 212, 0.35)');
    grad2.addColorStop(1, 'rgba(6, 182, 212, 0)');
    ctx.fillStyle = grad2;
    ctx.fillRect(0, 0, baseW, baseH);

    // Frosted Glass Outer Container
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1.2;
    drawRoundedRect(ctx, paddingX - 8, paddingY - 8, availW + 16, baseH - (paddingY * 2) + 16, 16, true, true);

    // Header Left
    ctx.fillStyle = '#C084FC';
    ctx.font = '800 9px -apple-system, sans-serif';
    ctx.fillText('HOLOGRAPHIC EXTRACTION // BEANTAG VISION', paddingX, paddingY + 12);

    ctx.fillStyle = '#FFFFFF';
    drawFittedText(coffeeName, paddingX, paddingY + 44, availW - 220, 28, '-apple-system, sans-serif', '800');

    ctx.fillStyle = '#94A3B8';
    ctx.font = '500 11px -apple-system, sans-serif';
    ctx.fillText(`${origin} • ${process} • ${altitude} • ${roaster}`, paddingX, paddingY + 68);

    // HERO 3D HOLOGRAPHIC GLASS BEAN (Top Right)
    const heroBoxX = baseW - paddingX - 160;
    const heroBoxY = paddingY - 4;
    drawHeroAsset(ctx, 'aurora', heroBoxX, heroBoxY, 105, 95);
    drawBadgeAsset(ctx, 'aurora', 'star', heroBoxX + 115, heroBoxY + 36, 44);

    // Body
    if (incRecipe) {
      // 4 Frosted Glass Metric Tiles with Glowing Neon Icons
      const metricY = paddingY + 98;
      const cols = 4;
      const gap = 12;
      const colW = (availW - (gap * (cols - 1))) / cols;
      const colH = 82;

      const metrics = [
        { type: 'method', lbl: 'MÉTODO', val: methodStr, sub: 'V60 60°' },
        { type: 'dose', lbl: 'DOSIS / RATIO', val: `${coffeeG}g → ${waterG}g`, sub: `RATIO ${ratioStr}` },
        { type: 'grind', lbl: 'MOLIENDA', val: microns ? `${microns} µm` : grindStr, sub: 'CALIBRADA' },
        { type: 'time', lbl: 'TIEMPO / TEMP', val: `${timeStr} min`, sub: tempStr }
      ];

      metrics.forEach((m, i) => {
        const x = paddingX + i * (colW + gap);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.lineWidth = 1;
        drawRoundedRect(ctx, x, metricY, colW, colH, 10, true, true);

        // Draw dedicated 3D aurora icon
        drawMetricAsset(ctx, 'aurora', m.type, x + colW - 24, metricY + 24, 38);

        ctx.fillStyle = '#A78BFA';
        ctx.font = '700 8.5px -apple-system, sans-serif';
        ctx.fillText(m.lbl, x + 12, metricY + 20);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '800 13px -apple-system, sans-serif';
        drawTruncatedText(m.val, x + 12, metricY + 44, colW - 40);

        ctx.fillStyle = '#38BDF8';
        ctx.font = '600 8.5px -apple-system, sans-serif';
        ctx.fillText(m.sub, x + 12, metricY + 66);
      });

      // Waveform Extraction Spectrum Bar
      const waveY = metricY + colH + 16;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, paddingX, waveY, availW, 54, 10, true, true);

      // Draw Waveform visual
      drawBadgeAsset(ctx, 'aurora', 'wave', paddingX + 50, waveY + 27, 44);

      ctx.fillStyle = '#E2E8F0';
      ctx.font = '700 9px -apple-system, sans-serif';
      ctx.fillText('CURVA DE EXTRACCIÓN SENSORIAL // CLARIDAD & DULZOR', paddingX + 90, waveY + 24);

      // Mini gradient bars
      const barX = paddingX + 90;
      const barY = waveY + 34;
      const barW = availW - 110;
      const barGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
      barGrad.addColorStop(0, '#8B5CF6');
      barGrad.addColorStop(0.5, '#EC4899');
      barGrad.addColorStop(1, '#06B6D4');
      ctx.fillStyle = barGrad;
      drawRoundedRect(ctx, barX, barY, barW, 8, 4, true, false);

      // Sensory Descriptors
      const notesY = waveY + 70;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      drawRoundedRect(ctx, paddingX, notesY, availW, 52, 10, true, true);

      ctx.fillStyle = '#F472B6';
      ctx.font = '800 8.5px -apple-system, sans-serif';
      ctx.fillText('NOTAS AROMÁTICAS & DESCRIPTORES:', paddingX + 14, notesY + 18);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '700 12px -apple-system, sans-serif';
      const cleanNotes = flavorTags.length > 0 ? flavorTags.join('   ✦   ') : notesStr;
      drawTruncatedText(cleanNotes, paddingX + 14, notesY + 38, availW - 28);
    }

    // Footer
    const footY = baseH - paddingY - 24;
    ctx.fillStyle = '#94A3B8';
    ctx.font = '500 9px -apple-system, sans-serif';
    ctx.fillText(`SCA CUPSCORE: ${scaScore}★ • CALIBRACIÓN HOLOGRÁFICA 2027 • BEANTAG`, paddingX, footY + 12);
  }

  // =========================================================================
  // 4. STYLE: HANGTAG NÓRDICO (SEY / TIM WENDELBOE ATELIER)
  // =========================================================================
  else if (style === 'hangtag') {
    // Ivory Cotton Paper Background
    ctx.fillStyle = '#FAF7F2';
    ctx.fillRect(0, 0, baseW, baseH);

    // Outer subtle border
    ctx.strokeStyle = '#E7E5E4';
    ctx.lineWidth = 1.2;
    drawRoundedRect(ctx, paddingX - 10, paddingY - 10, availW + 20, baseH - (paddingY * 2) + 20, 8, false, true);

    // Realistic Metallic Bronze Eyelet at Top Center
    const eyeletX = baseW / 2;
    const eyeletY = paddingY + 2;
    const eyeletR = 10;

    ctx.save();
    ctx.fillStyle = '#78716C';
    ctx.beginPath();
    ctx.arc(eyeletX, eyeletY, eyeletR + 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#D6D3D1';
    ctx.beginPath();
    ctx.arc(eyeletX, eyeletY, eyeletR, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1C1917';
    ctx.beginPath();
    ctx.arc(eyeletX, eyeletY, eyeletR - 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Top Label
    ctx.fillStyle = '#78716C';
    ctx.font = '600 8.5px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('ATELIER DE CAFÉ // ÉDITION LIMITÉE', baseW / 2, paddingY + 30);
    ctx.textAlign = 'left';

    // Main Serif Title
    ctx.fillStyle = '#1C1917';
    drawFittedText(coffeeName, paddingX, paddingY + 68, availW - 220, 26, 'Georgia, serif', 'bold');

    ctx.fillStyle = '#78716C';
    ctx.font = 'italic 11.5px Georgia, serif';
    ctx.fillText(`${origin} — ${producer || roaster} — ${altitude}`, paddingX, paddingY + 92);

    // HERO BOTANICAL ENGRAVING (Top Right)
    const heroBoxX = baseW - paddingX - 170;
    const heroBoxY = paddingY + 12;
    drawHeroAsset(ctx, 'hangtag', heroBoxX, heroBoxY, 130, 95);

    // Delicate Divider
    ctx.strokeStyle = '#D6D3D1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(paddingX, paddingY + 112);
    ctx.lineTo(baseW - paddingX, paddingY + 112);
    ctx.stroke();

    // Body
    if (incRecipe) {
      // 4 Metric Columns with Delicate Engravings
      const metricY = paddingY + 126;
      const cols = 4;
      const gap = 16;
      const colW = (availW - (gap * (cols - 1))) / cols;
      const colH = 82;

      const metrics = [
        { type: 'method', lbl: 'MÉTHODE', val: methodStr, sub: 'Extraction douce' },
        { type: 'dose', lbl: 'DOSAGE', val: `${coffeeG}g / ${waterG}g`, sub: `Ratio ${ratioStr}` },
        { type: 'grind', lbl: 'MOUTÚRE', val: microns ? `${microns} µm` : grindStr, sub: 'Calibrée' },
        { type: 'time', lbl: 'TEMPS / TEMP', val: `${timeStr}`, sub: tempStr }
      ];

      metrics.forEach((m, i) => {
        const x = paddingX + i * (colW + gap);
        ctx.strokeStyle = '#E7E5E4';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, metricY, colW, colH);

        // Draw dedicated vintage engraving icon
        drawMetricAsset(ctx, 'hangtag', m.type, x + colW - 24, metricY + 24, 34);

        ctx.fillStyle = '#78716C';
        ctx.font = '600 8.5px Georgia, serif';
        ctx.fillText(m.lbl, x + 10, metricY + 18);

        ctx.fillStyle = '#1C1917';
        ctx.font = 'bold 12.5px Georgia, serif';
        drawTruncatedText(m.val, x + 10, metricY + 44, colW - 36);

        ctx.fillStyle = '#A8A29E';
        ctx.font = 'italic 8.5px Georgia, serif';
        ctx.fillText(m.sub, x + 10, metricY + 68);
      });

      // Botanical Tasting Quote
      const quoteY = metricY + colH + 20;
      ctx.fillStyle = '#F5F5F4';
      ctx.strokeStyle = '#E7E5E4';
      drawRoundedRect(ctx, paddingX, quoteY, availW, 64, 6, true, true);

      ctx.fillStyle = '#44403C';
      ctx.font = 'italic 12px Georgia, serif';
      const quoteText = `« Notes de dégustation: ${flavorTags.length > 0 ? flavorTags.join(', ') : notesStr}. Une tasse d'une grande pureté et équilibre remarquable. »`;
      drawTruncatedText(quoteText, paddingX + 16, quoteY + 28, availW - 32);

      ctx.fillStyle = '#78716C';
      ctx.font = '600 9px Georgia, serif';
      ctx.fillText(`ÉVALUATION SENSORIAL: SCA ${scaScore}★ // SÉLECTION EXCLUSIVE`, paddingX + 16, quoteY + 50);
    }

    // ROASTERY WAX SEAL STAMP (Bottom Right)
    const sealX = baseW - paddingX - 40;
    const sealY = baseH - paddingY - 36;
    drawBadgeAsset(ctx, 'hangtag', 'seal', sealX, sealY, 48);

    // Footer Left
    const footY = baseH - paddingY - 30;
    ctx.fillStyle = '#78716C';
    ctx.font = '600 9px Georgia, serif';
    ctx.fillText(`BEANTAG ATELIER // ARCHIVE ${new Date().getFullYear()} // LOT ARTISANAL`, paddingX, footY + 14);
  }

  return canvas.toDataURL('image/png', 1.0);
}

/**
 * Generates an Ultra-HD visual Specialty Coffee Menu Card (Cellar Inventory)
 * incorporating authentic Nanobanana visual asset kits.
 */
export async function generateCoffeeMenuCardImage(batches, template = 'blueprint') {
  const style = normalizeCardStyle(template);

  // Ensure assets are ready
  await ensureCardAssetsLoaded(style);

  const canvas = document.createElement('canvas');
  const scaleFactor = 2;
  const baseW = 840;

  const validBatches = Array.isArray(batches) ? batches.filter(b => (b.remaining_doses || b.weight_current_g || 0) > 0) : [];
  const displayList = validBatches.length > 0 ? validBatches : (Array.isArray(batches) ? batches.slice(0, 10) : []);

  const headerH = 150;
  const itemH = 68;
  const footerH = 90;
  const baseH = Math.max(580, headerH + (displayList.length * itemH) + footerH);

  canvas.width = baseW * scaleFactor;
  canvas.height = baseH * scaleFactor;

  const ctx = canvas.getContext('2d');
  ctx.scale(scaleFactor, scaleFactor);

  const paddingX = 40;
  const paddingY = 32;
  const availW = baseW - (paddingX * 2);

  // 1. BLUEPRINT MENU
  if (style === 'blueprint') {
    ctx.fillStyle = '#07192F';
    ctx.fillRect(0, 0, baseW, baseH);

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= baseW; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, baseH); ctx.stroke(); }
    for (let y = 0; y <= baseH; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(baseW, y); ctx.stroke(); }

    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(paddingX - 10, paddingY - 10, availW + 20, baseH - (paddingY * 2) + 20);

    // Hero Schematic in Header
    drawHeroAsset(ctx, 'blueprint', baseW - paddingX - 130, paddingY + 6, 110, 64);

    ctx.fillStyle = '#38BDF8';
    ctx.font = '800 11px "JetBrains Mono", monospace';
    ctx.fillText('★ BEANTAG SPECIALTY CELLAR // CAVA DE CAFÉ ★', paddingX, paddingY + 20);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 20px "JetBrains Mono", monospace';
    ctx.fillText('CATÁLOGO DE LOTES DISPONIBLES', paddingX, paddingY + 48);

    ctx.fillStyle = '#93C5FD';
    ctx.font = '700 9.5px "JetBrains Mono", monospace';
    ctx.fillText(`TOTAL: ${displayList.length} LOTES REGISTRADOS // DOSIS CONGELADAS AL VACÍO`, paddingX, paddingY + 70);

    // Divider
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(paddingX, paddingY + 86);
    ctx.lineTo(baseW - paddingX, paddingY + 86);
    ctx.stroke();

    let curY = paddingY + 104;
    displayList.forEach((b, idx) => {
      ctx.fillStyle = 'rgba(14, 165, 233, 0.06)';
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, paddingX, curY, availW, itemH - 8, 6, true, true);

      // CAD icon
      drawMetricAsset(ctx, 'blueprint', 'method', paddingX + 22, curY + (itemH - 8) / 2, 28);

      ctx.fillStyle = '#7DD3FC';
      ctx.font = '900 11px "JetBrains Mono", monospace';
      ctx.fillText(`0${idx + 1}.`, paddingX + 46, curY + 22);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 13px "JetBrains Mono", monospace';
      ctx.fillText(stripEmojis(b.batch_name || b.name || b.coffee_name || 'Café'), paddingX + 74, curY + 22);

      ctx.fillStyle = '#93C5FD';
      ctx.font = '700 9.5px "JetBrains Mono", monospace';
      ctx.fillText(`${stripEmojis(b.origin || '')} • ${stripEmojis(b.variety || '')} (${stripEmojis(b.process || '')})`, paddingX + 74, curY + 44);

      // Doses Pill
      const doseText = `${b.remaining_doses || 0} TUBOS`;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.fillRect(baseW - paddingX - 110, curY + 14, 96, 26);
      ctx.fillStyle = '#38BDF8';
      ctx.font = '900 10.5px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(doseText, baseW - paddingX - 62, curY + 31);
      ctx.textAlign = 'left';

      curY += itemH;
    });

    // Footer
    const footY = baseH - paddingY - 30;
    ctx.fillStyle = '#7DD3FC';
    ctx.font = '700 9px "JetBrains Mono", monospace';
    ctx.fillText(`BEANTAG ARCHIVE // ${displayList.length} LOTES // FECHA: ${new Date().toLocaleDateString('es-ES')}`, paddingX, footY + 14);
  }

  // 2. NEOBRUTALIST MENU
  else if (style === 'neobrutalist') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, baseW, baseH);

    // Header Badge
    ctx.fillStyle = '#000000';
    ctx.fillRect(paddingX + 3, paddingY + 3, 240, 24);
    ctx.fillStyle = '#E2F952';
    ctx.fillRect(paddingX, paddingY, 240, 24);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(paddingX, paddingY, 240, 24);

    ctx.fillStyle = '#000000';
    ctx.font = '900 10px "Space Grotesk", sans-serif';
    ctx.fillText('★ BEANTAG SPECIALTY // BARISTA MENU ★', paddingX + 10, paddingY + 16);

    ctx.fillStyle = '#111827';
    ctx.font = '900 24px "Space Grotesk", sans-serif';
    ctx.fillText('CARTA DE CAFÉS & BODEGA', paddingX, paddingY + 60);

    // Hero Sticker Right
    drawHeroAsset(ctx, 'neobrutalist', baseW - paddingX - 120, paddingY - 4, 100, 90);

    ctx.fillStyle = '#000000';
    ctx.fillRect(paddingX, paddingY + 82, availW, 3.5);

    let curY = paddingY + 100;
    displayList.forEach((b, idx) => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(paddingX + 3, curY + 3, availW, itemH - 10);
      ctx.fillStyle = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
      ctx.fillRect(paddingX, curY, availW, itemH - 10);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(paddingX, curY, availW, itemH - 10);

      // Mini sticker
      drawMetricAsset(ctx, 'neobrutalist', 'method', paddingX + 22, curY + (itemH - 10) / 2, 28);

      ctx.fillStyle = '#000000';
      ctx.font = '900 13px "Space Grotesk", sans-serif';
      ctx.fillText(`${idx + 1}. ${stripEmojis(b.batch_name || b.name || b.coffee_name || 'Café')}`, paddingX + 46, curY + 22);

      ctx.fillStyle = '#64748B';
      ctx.font = '700 10px "Space Grotesk", sans-serif';
      ctx.fillText(`${stripEmojis(b.origin || '')} • ${stripEmojis(b.process || '')}`, paddingX + 46, curY + 42);

      // Stock badge
      ctx.fillStyle = '#000000';
      ctx.fillRect(baseW - paddingX - 106, curY + 12, 92, 26);
      ctx.fillStyle = '#E2F952';
      ctx.fillRect(baseW - paddingX - 108, curY + 10, 92, 26);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(baseW - paddingX - 108, curY + 10, 92, 26);

      ctx.fillStyle = '#000000';
      ctx.font = '900 10px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${b.remaining_doses || 0} TUBOS`, baseW - paddingX - 62, curY + 27);
      ctx.textAlign = 'left';

      curY += itemH;
    });

    // Barcode footer
    const footY = baseH - paddingY - 32;
    ctx.fillStyle = '#000000';
    ctx.font = '900 9.5px "Space Grotesk", sans-serif';
    ctx.fillText(`BEANTAG SPECIALTY // ARCHIVE ${displayList.length} LOTES // 2027`, paddingX, footY + 16);
  }

  // 3. AURORA MENU
  else if (style === 'aurora') {
    ctx.fillStyle = '#08090E';
    ctx.fillRect(0, 0, baseW, baseH);

    const grad1 = ctx.createRadialGradient(baseW * 0.85, 100, 0, baseW * 0.85, 100, 280);
    grad1.addColorStop(0, 'rgba(139, 92, 246, 0.4)');
    grad1.addColorStop(1, 'rgba(139, 92, 246, 0)');
    ctx.fillStyle = grad1;
    ctx.fillRect(0, 0, baseW, baseH);

    drawHeroAsset(ctx, 'aurora', baseW - paddingX - 120, paddingY, 100, 90);

    ctx.fillStyle = '#C084FC';
    ctx.font = '800 10px -apple-system, sans-serif';
    ctx.fillText('HOLOGRAPHIC CELLAR // BEANTAG VISION', paddingX, paddingY + 20);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 22px -apple-system, sans-serif';
    ctx.fillText('CATÁLOGO DE CAFÉS DE ESPECIALIDAD', paddingX, paddingY + 54);

    let curY = paddingY + 96;
    displayList.forEach((b, idx) => {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      drawRoundedRect(ctx, paddingX, curY, availW, itemH - 8, 8, true, true);

      drawMetricAsset(ctx, 'aurora', 'method', paddingX + 24, curY + (itemH - 8) / 2, 28);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 13px -apple-system, sans-serif';
      ctx.fillText(`${idx + 1}. ${stripEmojis(b.batch_name || b.name || b.coffee_name || 'Café')}`, paddingX + 48, curY + 22);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '500 10px -apple-system, sans-serif';
      ctx.fillText(`${stripEmojis(b.origin || '')} • ${stripEmojis(b.process || '')}`, paddingX + 48, curY + 42);

      ctx.fillStyle = '#C084FC';
      ctx.font = '700 11px -apple-system, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${b.remaining_doses || 0} Tubos`, baseW - paddingX - 20, curY + 34);
      ctx.textAlign = 'left';

      curY += itemH;
    });
  }

  // 4. HANGTAG MENU
  else if (style === 'hangtag') {
    ctx.fillStyle = '#FAF7F2';
    ctx.fillRect(0, 0, baseW, baseH);

    drawHeroAsset(ctx, 'hangtag', baseW - paddingX - 130, paddingY + 4, 110, 80);

    ctx.fillStyle = '#78716C';
    ctx.font = '600 9px Georgia, serif';
    ctx.fillText('ATELIER DE CAFÉ // CATALOGUE DES CRUS', paddingX, paddingY + 20);

    ctx.fillStyle = '#1C1917';
    ctx.font = 'bold 22px Georgia, serif';
    ctx.fillText('SÉLECTION DE BODEGA', paddingX, paddingY + 54);

    let curY = paddingY + 96;
    displayList.forEach((b, idx) => {
      ctx.strokeStyle = '#E7E5E4';
      ctx.beginPath();
      ctx.moveTo(paddingX, curY + itemH - 10);
      ctx.lineTo(baseW - paddingX, curY + itemH - 10);
      ctx.stroke();

      drawMetricAsset(ctx, 'hangtag', 'method', paddingX + 16, curY + 24, 24);

      ctx.fillStyle = '#1C1917';
      ctx.font = 'bold 13px Georgia, serif';
      ctx.fillText(`0${idx + 1}. ${stripEmojis(b.batch_name || b.name || b.coffee_name || 'Café')}`, paddingX + 38, curY + 24);

      ctx.fillStyle = '#78716C';
      ctx.font = 'italic 10.5px Georgia, serif';
      ctx.fillText(`${stripEmojis(b.origin || '')} — ${stripEmojis(b.process || '')}`, paddingX + 38, curY + 44);

      ctx.fillStyle = '#4D7C0F';
      ctx.font = 'bold 11px Georgia, serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${b.remaining_doses || 0} Dosis`, baseW - paddingX - 16, curY + 32);
      ctx.textAlign = 'left';

      curY += itemH;
    });

    drawBadgeAsset(ctx, 'hangtag', 'seal', baseW - paddingX - 34, baseH - paddingY - 24, 38);
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
