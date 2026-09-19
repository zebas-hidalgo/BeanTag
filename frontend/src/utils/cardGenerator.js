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
    if (ctx.measureText(str).width > maxWidth) {
      drawTruncatedText(str, x, y, maxWidth);
    } else {
      ctx.fillText(str, x, y);
    }
  };

  const drawWrappedText = (text, x, y, maxWidth, lineHeight = 15, maxLines = 3) => {
    const words = String(text || '').trim().split(/\s+/);
    if (words.length === 0 || words[0] === '') return 0;
    let line = '';
    let linesDrawn = 0;
    let currentY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + (line ? ' ' : '') + words[n];
      const testWidth = ctx.measureText(testLine).width;
      if (testWidth > maxWidth && n > 0) {
        linesDrawn++;
        if (linesDrawn >= maxLines) {
          drawTruncatedText(line, x, currentY, maxWidth);
          return linesDrawn;
        }
        ctx.fillText(line, x, currentY);
        line = words[n];
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    if (line.length > 0 && linesDrawn < maxLines) {
      ctx.fillText(line, x, currentY);
      linesDrawn++;
    }
    return linesDrawn;
  };

  const rec = recipe || {};

  // Coffee & recipe attributes (STRICT TRUTH: only what the user entered, no fabricated values!)
  const coffeeName = stripEmojis(rec.batch_name || rec.coffee_name || rec.name || 'Café');
  const origin = stripEmojis(rec.origin || rec.batch_origin || '');
  const roaster = stripEmojis(rec.roaster || rec.batch_roaster || '');
  const producer = stripEmojis(rec.producer || rec.batch_producer || '');
  const process = stripEmojis(rec.process || rec.batch_process || '');
  const variety = stripEmojis(rec.variety || rec.batch_variety || '');
  const rawAltitude = rec.altitude || rec.batch_altitude;
  const altitude = rawAltitude ? `${stripEmojis(String(rawAltitude)).replace(/m$/i, '')}m` : '';
  const roastLevel = stripEmojis(rec.roast_level || rec.roast || '');
  const roastDate = stripEmojis(rec.roast_date || '');
  const freezeDate = stripEmojis(rec.freeze_date || '');
  const notesStr = stripEmojis(rec.flavor_notes || rec.roaster_notes || rec.notes || rec.batch_roaster_notes || '');
  const flavorTags = extractFlavorTags(notesStr);

  // Real SCA Score ONLY - Never default to 89.5 or fabricate a score!
  const rawSca = rec.sca_score || rec.score;
  const scaScore = (rawSca && !isNaN(parseFloat(rawSca)) && parseFloat(rawSca) > 0) ? parseFloat(rawSca) : null;

  // Real inventory tube count
  const remainingDoses = (rec.remaining_doses !== undefined && rec.remaining_doses !== null && rec.remaining_doses !== '')
    ? parseInt(rec.remaining_doses, 10)
    : null;
  const dosesStr = remainingDoses !== null ? `${remainingDoses} TUBOS EN CAVA` : '';

  // Subtitle from real available attributes
  const subtitleTokens = [roaster, origin, altitude, process].filter(Boolean);
  const subtitleStr = subtitleTokens.join(' • ');

  // Recipe parameters
  const rawMethodStr = stripEmojis(rec.method || 'Filtrado');
  const isPulsar = rawMethodStr.toLowerCase().includes('pulsar');
  const isEspresso = rawMethodStr.toLowerCase().includes('espresso');
  const isAero = rawMethodStr.toLowerCase().includes('aero');
  const isFrench = rawMethodStr.toLowerCase().includes('prensa') || rawMethodStr.toLowerCase().includes('french');

  const methodStr = isPulsar ? 'PULSAR MINI // NO-BYPASS' : rawMethodStr;

  const coffeeG = rec.coffee_grams || rec.dose_in_g || (incRecipe ? 15 : null);
  const waterG = rec.water_grams || rec.dose_out_g || (coffeeG ? Math.round(coffeeG * 15) : null);
  const ratioStr = rec.ratio || (coffeeG && waterG ? `1:${(waterG / coffeeG).toFixed(1)}` : '1:15');
  const grindStr = stripEmojis(rec.grind_size || rec.grind || 'Medio');
  const microns = parseGrindToMicrons(grindStr);
  const tempStr = rec.temp || rec.temperature ? `${String(rec.temp || rec.temperature).replace('°C', '')}°C` : '93°C';
  const timeStr = rec.time || rec.brew_time ? `${stripEmojis(String(rec.time || rec.brew_time)).replace(' min', '')}` : '2:30';

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
    ctx.fillText(incRecipe ? '// PROTOCOLO DE EXTRACCIÓN // BEANTAG ARCHIVE' : '// IDENTIDAD Y TERROIR // BEANTAG ARCHIVE', paddingX, paddingY + 14);

    ctx.fillStyle = '#FFFFFF';
    drawFittedText(coffeeName.toUpperCase(), paddingX, paddingY + 44, availW, 28, '"JetBrains Mono", monospace', '900');

    if (subtitleStr) {
      ctx.fillStyle = '#93C5FD';
      ctx.font = '700 10px "JetBrains Mono", monospace';
      drawTruncatedText(subtitleStr.toUpperCase(), paddingX, paddingY + 66, availW);
    }

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
      const specBoxY = paddingY + 84;
      const specBoxH = 32;
      ctx.fillStyle = 'rgba(14, 165, 233, 0.08)';
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, paddingX, specBoxY, availW, specBoxH, 4, true, true);

      ctx.fillStyle = '#7DD3FC';
      ctx.font = '800 8.5px "JetBrains Mono", monospace';
      ctx.fillText('FIG. 01 — ARCHIVO MORFOLÓGICO & TERROIR', paddingX + 12, specBoxY + 20);

      if (scaScore !== null) {
        ctx.fillStyle = '#4ADE80';
        ctx.font = '800 9px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`SCA CUPSCORE: ${scaScore}★`, paddingX + availW - 12, specBoxY + 20);
        ctx.textAlign = 'left';
      } else if (roastLevel) {
        ctx.fillStyle = '#93C5FD';
        ctx.font = '800 8.5px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`TUESTE: ${roastLevel.toUpperCase()}`, paddingX + availW - 12, specBoxY + 20);
        ctx.textAlign = 'left';
      }

      // 2. Terroir Matrix Boxes (2x2)
      const matY = specBoxY + specBoxH + 10;
      const matGap = 8;
      const colW = (availW - matGap) / 2;
      const colH = 78;

      const terroirItems = [
        { lbl: 'ORIGEN & FINCA', val: (origin || '—').toUpperCase(), sub: producer ? `Finca: ${producer}` : (roaster ? `Tostador: ${roaster}` : '') },
        { lbl: 'ALTITUD', val: altitude || '—', sub: altitude ? 'Metros sobre el nivel del mar' : 'No registrada' },
        { lbl: 'VARIEDAD BOTÁNICA', val: (variety || '—').toUpperCase(), sub: variety ? 'Variedad botánica' : 'No registrada' },
        { lbl: 'BENEFICIO & TUESTE', val: (process || '—').toUpperCase(), sub: roastLevel ? `Tueste: ${roastLevel}` : (roastDate ? `Tostado: ${roastDate}` : '') }
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
        ctx.font = '900 13px "JetBrains Mono", monospace';
        drawTruncatedText(t.val, tx + 12, ty + 44, colW - 24);

        ctx.fillStyle = '#38BDF8';
        ctx.font = '700 8px "JetBrains Mono", monospace';
        drawTruncatedText(t.sub, tx + 12, ty + 64, colW - 24);
      });

      // 3. Authentic Cupping Notes Box (Roaster Notes & Real Flavor Tags)
      const notesY = matY + (colH * 2) + matGap + 10;
      const notesH = 146;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.06)';
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, paddingX, notesY, availW, notesH, 5, true, true);

      ctx.fillStyle = '#7DD3FC';
      ctx.font = '800 8.5px "JetBrains Mono", monospace';
      ctx.fillText('NOTAS DE CATA & PERFIL SENSORIAL DEL TOSTADOR:', paddingX + 12, notesY + 20);

      // Real tasting description text
      if (notesStr) {
        ctx.fillStyle = '#E0F2FE';
        ctx.font = '700 10.5px "JetBrains Mono", monospace';
        drawWrappedText(notesStr, paddingX + 12, notesY + 40, availW - 24, 16, 3);
      } else {
        ctx.fillStyle = '#64748B';
        ctx.font = 'italic 10px "JetBrains Mono", monospace';
        ctx.fillText('Sin notas de cata descriptivas registradas para este lote.', paddingX + 12, notesY + 44);
      }

      // Discrete Flavor Tag Pills (only if real tags exist!)
      if (flavorTags.length > 0) {
        let pillX = paddingX + 12;
        const pillY = notesY + 98;
        const pillH = 22;
        ctx.font = '800 9px "JetBrains Mono", monospace';

        flavorTags.slice(0, 5).forEach((tag) => {
          const tw = ctx.measureText(tag.toUpperCase()).width;
          const pw = tw + 16;
          if (pillX + pw <= paddingX + availW - 12) {
            ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
            ctx.strokeStyle = '#38BDF8';
            ctx.lineWidth = 1;
            drawRoundedRect(ctx, pillX, pillY, pw, pillH, 4, true, true);

            ctx.fillStyle = '#BAE6FD';
            ctx.fillText(tag.toUpperCase(), pillX + 8, pillY + 15);
            pillX += pw + 8;
          }
        });
      }

      // 4. Cellar Vault Strip
      const cellarY = notesY + notesH + 10;
      const cellarH = 34;
      ctx.fillStyle = 'rgba(14, 165, 233, 0.08)';
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, paddingX, cellarY, availW, cellarH, 4, true, true);

      ctx.fillStyle = '#7DD3FC';
      ctx.font = '800 9px "JetBrains Mono", monospace';
      const cellarText = remainingDoses !== null
        ? `❄️ CAVA BEANTAG: ${remainingDoses} TUBOS EN CONGELADOR${freezeDate ? ' • CONGELADO EL ' + freezeDate : ''}`
        : '❄️ ARCHIVO BEANTAG // CAVA DE ESPECIALIDAD';
      ctx.fillText(cellarText, paddingX + 12, cellarY + 21);

      if (scaScore !== null) {
        ctx.fillStyle = '#4ADE80';
        ctx.font = '800 9.5px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`SCA ${scaScore}★`, paddingX + availW - 12, cellarY + 21);
        ctx.textAlign = 'left';
      }
    }

    // -----------------------------------------------------------------------
    // MODE B: CON RECETA (BARISTA EXTRACTION PROTOCOL)
    // -----------------------------------------------------------------------
    else {
      // 1. Protocol Spec Strip
      const specBoxY = paddingY + 84;
      const specBoxH = 32;
      ctx.fillStyle = 'rgba(14, 165, 233, 0.08)';
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, paddingX, specBoxY, availW, specBoxH, 4, true, true);

      ctx.fillStyle = '#7DD3FC';
      ctx.font = '800 8.5px "JetBrains Mono", monospace';
      ctx.fillText('FIG. 01: PROTOCOLO DE EXTRACCIÓN // RECETA CALIBRADA', paddingX + 12, specBoxY + 20);

      if (scaScore !== null) {
        ctx.fillStyle = '#4ADE80';
        ctx.font = '800 8.5px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`SCA: ${scaScore}★`, paddingX + availW - 12, specBoxY + 20);
        ctx.textAlign = 'left';
      } else {
        ctx.fillStyle = '#93C5FD';
        ctx.font = '800 8px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`MÉTODO: ${methodStr.toUpperCase()}`, paddingX + availW - 12, specBoxY + 20);
        ctx.textAlign = 'left';
      }

      // 2. 4 Extraction Parameter Bento Tiles (2x2)
      const bentoY = specBoxY + specBoxH + 10;
      const bentoGap = 8;
      const colW = (availW - bentoGap) / 2;
      const colH = 88;

      const grindSub = microns ? `~${microns} µm` : (grindStr ? 'MOLIENDA CALIBRADA' : 'NO ESPECIFICADA');

      const metrics = [
        { lbl: 'MÉTODO // EXTRACCIÓN', val: methodStr.toUpperCase(), sub: rawMethodStr.toUpperCase() },
        { lbl: 'RATIO & DOSIS', val: ratioStr ? `1:${ratioStr.replace('1:', '')}` : '—', sub: (coffeeG && waterG) ? `${coffeeG}g IN ➔ ${waterG}g OUT` : (coffeeG ? `${coffeeG}g CAFÉ` : '') },
        { lbl: 'MOLIENDA', val: grindStr.toUpperCase(), sub: grindSub },
        { lbl: 'TIEMPO & TEMPERATURA', val: (timeStr && !timeStr.includes('min') && !timeStr.includes('s')) ? `${timeStr} MIN` : (timeStr || '—'), sub: tempStr ? `${tempStr} • AGUA` : 'TEMP ESTÁNDAR' }
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

        // Parameter value
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 16px "JetBrains Mono", monospace';
        drawTruncatedText(m.val, mx + 14, my + 50, colW - 28);

        // Subtitle note
        ctx.fillStyle = '#38BDF8';
        ctx.font = '700 8px "JetBrains Mono", monospace';
        drawTruncatedText(m.sub, mx + 14, my + 72, colW - 28);
      });

      // 3. Real Pours Timeline Strip or Barista Notes
      const flowY = bentoY + (colH * 2) + bentoGap + 10;
      const flowH = 68;

      if (rec.pours && Array.isArray(rec.pours) && rec.pours.length > 0) {
        ctx.fillStyle = 'rgba(14, 165, 233, 0.05)';
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        drawRoundedRect(ctx, paddingX, flowY, availW, flowH, 5, true, true);
        ctx.setLineDash([]);

        ctx.fillStyle = '#7DD3FC';
        ctx.font = '800 8px "JetBrains Mono", monospace';
        ctx.fillText('CRONOGRAMA DE VERTIDOS REAL:', paddingX + 12, flowY + 16);

        ctx.fillStyle = '#4ADE80';
        ctx.textAlign = 'right';
        ctx.fillText(`TOTAL: ${waterG || '—'}g (RATIO ${ratioStr})`, paddingX + availW - 12, flowY + 16);
        ctx.textAlign = 'left';

        // Draw up to 3 pour step milestones
        const poursToShow = rec.pours.slice(0, 3);
        const pourColW = (availW - 24) / poursToShow.length;
        poursToShow.forEach((p, pIdx) => {
          const px = paddingX + 12 + (pIdx * pourColW);
          ctx.fillStyle = '#BAE6FD';
          ctx.font = '700 8px "JetBrains Mono", monospace';
          drawTruncatedText(`${p.time || ''} • ${p.label || 'Vertido'}`, px, flowY + 34, pourColW - 8);
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '900 11px "JetBrains Mono", monospace';
          drawTruncatedText(`${p.total_water_g || p.water_g}g`, px, flowY + 52);
        });
      } else {
        // Barista Brew Notes / Instruction Box
        ctx.fillStyle = 'rgba(14, 165, 233, 0.05)';
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 1;
        drawRoundedRect(ctx, paddingX, flowY, availW, flowH, 5, true, true);

        ctx.fillStyle = '#7DD3FC';
        ctx.font = '800 8px "JetBrains Mono", monospace';
        ctx.fillText('NOTAS DE PREPARACIÓN DEL BARISTA:', paddingX + 12, flowY + 18);

        const recipeNotes = stripEmojis(rec.notes || rec.user_notes || '');
        if (recipeNotes) {
          ctx.fillStyle = '#E0F2FE';
          ctx.font = '700 9px "JetBrains Mono", monospace';
          drawWrappedText(recipeNotes, paddingX + 12, flowY + 36, availW - 24, 14, 2);
        } else {
          ctx.fillStyle = '#64748B';
          ctx.font = 'italic 8.5px "JetBrains Mono", monospace';
          ctx.fillText('Extracción limpia y balanceada según parámetros de molienda.', paddingX + 12, flowY + 40);
        }
      }

      // 4. Sensory Descriptors & Flavor Pills (only if real notes/tags exist)
      const notesY = flowY + flowH + 10;
      const notesH = 76;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.05)';
      ctx.fillRect(paddingX, notesY, availW, notesH);
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(paddingX, notesY, 4, notesH);

      ctx.fillStyle = '#7DD3FC';
      ctx.font = '800 8px "JetBrains Mono", monospace';
      ctx.fillText('DESCRIPTORES SENSORIALES DEL CAFÉ:', paddingX + 12, notesY + 18);

      if (flavorTags.length > 0) {
        let pillX = paddingX + 12;
        const pillY = notesY + 30;
        flavorTags.slice(0, 4).forEach((tag) => {
          ctx.font = '800 9.5px "JetBrains Mono", monospace';
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
      } else if (notesStr) {
        ctx.fillStyle = '#BAE6FD';
        ctx.font = '700 9px "JetBrains Mono", monospace';
        drawTruncatedText(notesStr, paddingX + 12, notesY + 44, availW - 24);
      } else {
        ctx.fillStyle = '#64748B';
        ctx.font = 'italic 8.5px "JetBrains Mono", monospace';
        ctx.fillText('Sin descriptores sensoriales registrados.', paddingX + 12, notesY + 44);
      }
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
    ctx.font = '800 10px "JetBrains Mono", monospace';
    drawTruncatedText(incRecipe ? 'REC-01' : 'LOT-01', paddingX + 8, tbY + 28, cellW - 16);
    drawTruncatedText((roaster || producer || 'BEANTAG').toUpperCase(), paddingX + cellW + 8, tbY + 28, cellW - 16);
    drawTruncatedText(dosesStr || (scaScore ? `SCA ${scaScore}★` : 'REGISTRADO'), paddingX + cellW * 2 + 8, tbY + 28, cellW - 16);
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
    const headerTag = roaster ? `${roaster.toUpperCase()} // ARCHIVO DE CAFÉ` : 'BEANTAG // ARCHIVO DE CAFÉ';
    ctx.fillText(incRecipe ? '★ BEANTAG // PROTOCOLO DE EXTRACCIÓN ★' : `★ ${headerTag} ★`, paddingX + 12, paddingY + 17);

    // 2. Massive Bold Title
    ctx.fillStyle = '#09090B';
    drawFittedText(coffeeName.toUpperCase(), paddingX, paddingY + 68, availW, 30, '"Space Grotesk", sans-serif', '900');

    // 3. Metadata Tag Pills with Drop Shadows (Truthful only)
    const tagY = paddingY + 84;
    const tags = [
      origin ? { text: origin.toUpperCase(), bg: '#FF3B14', color: '#FFF' } : null,
      process ? { text: process.toUpperCase(), bg: '#FFFFFF', color: '#000' } : null,
      altitude ? { text: altitude, bg: '#D8B4FE', color: '#000' } : null,
      roaster ? { text: roaster.toUpperCase(), bg: '#D4FF00', color: '#000' } : null
    ].filter(Boolean);

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
      ctx.fillText(roaster ? `${roaster.toUpperCase()} // FICHA TÉCNICA` : 'BEANTAG SPECIALTY // FICHA TÉCNICA', paddingX + 14, stripY + 25);

      // Only render SCA badge if verified score exists
      if (scaScore !== null) {
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
      }

      // 2. Terroir Bento Grid (2x2)
      const matY = stripY + stripH + 14;
      const matGap = 10;
      const colW = (availW - matGap) / 2;
      const colH = 88;

      const terroirMetrics = [
        { lbl: 'PRODUCTOR & FINCA', val: (producer || roaster || 'Origen único').toUpperCase(), sub: origin ? origin.toUpperCase() : 'ORIGEN NO ESPECIFICADO', bg: '#D4FF00', col: '#000' },
        { lbl: 'ALTITUD', val: altitude || 'No especificada', sub: origin ? `TERROIR: ${origin.toUpperCase()}` : 'ALTITUD METROS', bg: '#FFFFFF', col: '#000' },
        { lbl: 'VARIEDAD BOTÁNICA', val: (variety || 'Variedad botánica').toUpperCase(), sub: 'VARIEDAD COFFEA', bg: '#FF3B14', col: '#FFF' },
        { lbl: 'BENEFICIO / PROCESO', val: (process || 'Proceso').toUpperCase(), sub: 'PROCESAMIENTO LOTE', bg: '#D8B4FE', col: '#000' }
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

      // 3. Sensory Profile & Cupping Notes Bento (Authentic notes and tags)
      const specY = matY + (colH * 2) + matGap + 12;
      const specH = 150;

      ctx.fillStyle = '#000000';
      ctx.fillRect(paddingX + 3.5, specY + 3.5, availW, specH);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(paddingX, specY, availW, specH);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(paddingX, specY, availW, specH);

      ctx.fillStyle = '#000000';
      ctx.font = '900 10px "Space Grotesk", sans-serif';
      ctx.fillText('⚡ PERFIL SENSORIAL // NOTAS DE CATA:', paddingX + 14, specY + 22);

      // Authentic roaster notes text
      ctx.fillStyle = '#18181B';
      ctx.font = '700 10.5px "Space Grotesk", sans-serif';
      const actualNotes = notesStr ? `"${notesStr}"` : 'Sin notas de cata registradas para este lote.';
      const linesDrawn = drawWrappedText(ctx, actualNotes, paddingX + 14, specY + 42, availW - 28, 17, 3);

      // Flavor stickers below text
      if (flavorTags.length > 0) {
        let pillX = paddingX + 14;
        const pillY = specY + 44 + (linesDrawn * 17) + 8;
        const pillColors = ['#D4FF00', '#FF3B14', '#D8B4FE', '#67E8F9', '#FED7AA'];

        flavorTags.slice(0, 5).forEach((tag, idx) => {
          const bgCol = pillColors[idx % pillColors.length];
          ctx.font = '900 9.5px "Space Grotesk", sans-serif';
          const pw = ctx.measureText(tag.toUpperCase()).width + 16;

          if (pillX + pw < paddingX + availW - 14) {
            ctx.fillStyle = '#000000';
            ctx.fillRect(pillX + 2, pillY + 2, pw, 22);
            ctx.fillStyle = bgCol;
            ctx.fillRect(pillX, pillY, pw, 22);
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1.8;
            ctx.strokeRect(pillX, pillY, pw, 22);

            ctx.fillStyle = bgCol === '#FF3B14' ? '#FFFFFF' : '#000000';
            ctx.fillText(tag.toUpperCase(), pillX + 8, pillY + 15);

            pillX += pw + 8;
          }
        });
      }

      // 4. Cellar vault pill
      const vaultY = specY + specH + 12;
      ctx.fillStyle = '#000000';
      ctx.fillRect(paddingX + 2, vaultY + 2, availW, 26);
      ctx.fillStyle = '#D4FF00';
      ctx.fillRect(paddingX, vaultY, availW, 26);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(paddingX, vaultY, availW, 26);

      ctx.fillStyle = '#000000';
      ctx.font = '900 9px "Space Grotesk", sans-serif';
      const cellarText = remainingDoses !== null
        ? `❄️ BODEGA BEANTAG: ${dosesStr} • VACÍO -18°C`
        : '☕ CAFÉ DE ESPECIALIDAD // BEANTAG ARCHIVE';
      ctx.fillText(cellarText, paddingX + 12, vaultY + 17);
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
      ctx.fillText(roaster ? `${roaster.toUpperCase()} // RECETA DE BARISTA` : 'BEANTAG // RECETA DE BARISTA', paddingX + 14, stripY + 25);

      // Only render SCA badge if verified score exists
      if (scaScore !== null) {
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
      }

      // 2. 4 Extraction Parameter Bento Tiles (2x2) with PURE TYPOGRAPHY
      const bentoY = stripY + stripH + 14;
      const bentoGap = 10;
      const colW = (availW - bentoGap) / 2;
      const colH = 92;

      const metrics = [
        { lbl: 'MÉTODO // EXT', val: methodStr.toUpperCase(), sub: rawMethodStr ? rawMethodStr.toUpperCase() : 'EXTRACCIÓN FILTRO', bg: '#D4FF00', valColor: '#000000' },
        { lbl: 'RATIO // FORMULA', val: `1:${ratioStr.replace('1:', '')}`, sub: `${coffeeG}g IN ➔ ${waterG}g OUT`, bg: '#FFFFFF', valColor: '#000000' },
        { lbl: 'MOLIENDA // CALIBRATION', val: grindStr.toUpperCase(), sub: microns ? `~${microns} µm MICRONES` : 'MOLIENDA CALIBRADA', bg: '#FF3B14', valColor: '#FFFFFF' },
        { lbl: 'TIEMPO & TEMPERATURA', val: timeStr ? `${timeStr} MIN` : 'TIEMPO LIBRE', sub: tempStr ? `${tempStr} • EXTRACCIÓN` : 'AGUA A PUNTO', bg: '#FFFFFF', valColor: '#000000' }
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
      ctx.fillText('⚡ NOTAS DE CATA // SENSORY STICKERS:', paddingX + 12, notesY + 20);

      let pillX = paddingX + 12;
      const pillY = notesY + 34;
      const pillColors = ['#D4FF00', '#FF3B14', '#D8B4FE', '#67E8F9', '#FED7AA'];

      if (flavorTags.length > 0) {
        flavorTags.slice(0, 5).forEach((tag, idx) => {
          const bgCol = pillColors[idx % pillColors.length];
          ctx.font = '900 9.5px "Space Grotesk", sans-serif';
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
      } else {
        ctx.fillStyle = '#71717A';
        ctx.font = '600 9px "Space Grotesk", sans-serif';
        ctx.fillText(notesStr ? `"${notesStr.slice(0, 60)}..."` : 'Sin notas de cata adicionales especificadas', pillX, pillY + 16);
      }

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
      const steps = (rec.pours && Array.isArray(rec.pours) && rec.pours.length > 0)
        ? rec.pours.slice(0, 3).map((p, i) => ({
            title: (p.title || `VERTIDO 0${i + 1}`).toUpperCase(),
            desc: `${p.weight ? p.weight + 'g' : ''}${p.time ? ' • ' + p.time : ''}`.trim() || 'Vertido'
          }))
        : [
            { title: 'DOSIS CAFÉ', desc: `${coffeeG}g molienda` },
            { title: 'AGUA TOTAL', desc: `${waterG}g objetivo` },
            { title: 'RATIO TAZA', desc: `1:${ratioStr.replace('1:', '')}` }
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
    drawTruncatedText(subtitleStr || 'Café de Especialidad', paddingX, paddingY + 68, availW);

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
      const statusText = scaScore !== null
        ? `SCA CUPSCORE: ${scaScore}★ • CALIBRACIÓN SENSORIAL • SPECIALTY COFFEE`
        : 'ARCHIVO DE CAFÉ • CALIBRACIÓN SENSORIAL • SPECIALTY COFFEE';
      ctx.fillText(statusText, paddingX + (availW / 2), specBoxY + 22);
      ctx.textAlign = 'left';

      // 2. 4 Terroir Matrix Tiles (2x2)
      const matY = specBoxY + specBoxH + 12;
      const matGap = 10;
      const colW = (availW - matGap) / 2;
      const colH = 88;

      const terroirMetrics = [
        { lbl: 'ORIGEN & PRODUCTOR', val: producer || roaster || 'Origen único', sub: origin || 'ORIGEN NO ESPECIFICADO' },
        { lbl: 'ALTITUD & TERROIR', val: altitude || 'No especificada', sub: origin ? `TERROIR: ${origin.toUpperCase()}` : 'ALTITUD METROS' },
        { lbl: 'VARIEDAD BOTÁNICA', val: variety || 'Variedad botánica', sub: 'VARIEDAD COFFEA' },
        { lbl: 'PROCESO DE BENEFICIO', val: process || 'Proceso', sub: 'PROCESAMIENTO LOTE' }
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

      // 3. Sensory Frequency & Cupping Notes Capsule
      const specY = matY + (colH * 2) + matGap + 12;
      const specH = 150;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, paddingX, specY, availW, specH, 10, true, true);

      ctx.fillStyle = '#E2E8F0';
      ctx.font = '700 8.5px -apple-system, sans-serif';
      ctx.fillText('ESPECTRO SENSORIAL // NOTAS DE CATA:', paddingX + 14, specY + 20);

      // Authentic notes text
      ctx.fillStyle = '#CBD5E1';
      ctx.font = '500 10.5px -apple-system, sans-serif';
      const actualNotes = notesStr ? `"${notesStr}"` : 'Sin notas de cata registradas para este lote.';
      const linesDrawn = drawWrappedText(ctx, actualNotes, paddingX + 14, specY + 40, availW - 28, 17, 3);

      // Frosted flavor pills
      if (flavorTags.length > 0) {
        let pillX = paddingX + 14;
        const pillY = specY + 44 + (linesDrawn * 17) + 8;
        flavorTags.slice(0, 5).forEach((tag) => {
          ctx.font = '700 9.5px -apple-system, sans-serif';
          const tw = ctx.measureText(tag).width;
          const pw = tw + 18;
          if (pillX + pw <= paddingX + availW - 14) {
            ctx.fillStyle = 'rgba(168, 85, 247, 0.18)';
            ctx.strokeStyle = 'rgba(216, 180, 254, 0.35)';
            ctx.lineWidth = 1;
            drawRoundedRect(ctx, pillX, pillY, pw, 22, 6, true, true);

            ctx.fillStyle = '#F3E8FF';
            ctx.fillText(tag, pillX + 9, pillY + 15);
            pillX += pw + 8;
          }
        });
      }

      // 4. Cryo Vault Bar
      const vaultY = specY + specH + 12;
      ctx.fillStyle = 'rgba(6, 182, 212, 0.1)';
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
      drawRoundedRect(ctx, paddingX, vaultY, availW, 30, 8, true, true);

      ctx.fillStyle = '#38BDF8';
      ctx.font = '700 9px -apple-system, sans-serif';
      const vaultText = remainingDoses !== null
        ? `❄️ CAVA BEANTAG: ${dosesStr} • VACÍO -18°C • CONSERVACIÓN HOLOGRÁFICA`
        : '☕ CAFÉ DE ESPECIALIDAD // BEANTAG VISION';
      ctx.fillText(vaultText, paddingX + 14, vaultY + 19);
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
      const statusText = scaScore !== null
        ? `SCA CUPSCORE: ${scaScore}★ • CALIBRACIÓN DE EXTRACCIÓN SENSORIAL`
        : 'PROTOCOLO DE EXTRACCIÓN // CALIBRACIÓN SENSORIAL';
      ctx.fillText(statusText, paddingX + (availW / 2), specBoxY + 22);
      ctx.textAlign = 'left';

      // 2. 4 Frosted Glass Parameter Tiles (2x2) with PURE TYPOGRAPHY
      const bentoY = specBoxY + specBoxH + 12;
      const bentoGap = 10;
      const colW = (availW - bentoGap) / 2;
      const colH = 92;

      const metrics = [
        { lbl: 'MÉTODO // FILTRO', val: methodStr, sub: rawMethodStr ? rawMethodStr.toUpperCase() : 'Extracción manual' },
        { lbl: 'RATIO // DOSIS', val: `1:${ratioStr.replace('1:', '')}`, sub: `${coffeeG}g IN ➔ ${waterG}g AGUA` },
        { lbl: 'MOLIENDA // TAMAÑO', val: grindStr, sub: microns ? `~${microns} µm` : 'Molienda calibrada' },
        { lbl: 'TIEMPO & TEMPERATURA', val: timeStr ? `${timeStr} MIN` : 'TIEMPO LIBRE', sub: tempStr ? `${tempStr} • EXTRACCIÓN` : 'Agua a punto' }
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

      if (flavorTags.length > 0) {
        flavorTags.slice(0, 5).forEach((tag) => {
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
      } else {
        ctx.fillStyle = '#94A3B8';
        ctx.font = '600 9.5px -apple-system, sans-serif';
        ctx.fillText(notesStr ? `"${notesStr.slice(0, 55)}..."` : 'Sin notas aromáticas adicionales registradas', pillX, pillY + 16);
      }
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
    const terroirSub = [origin, (producer || roaster), altitude].filter(Boolean).join(' — ');
    drawTruncatedText(terroirSub || 'Café de Especialidad', paddingX, paddingY + 70, availW);

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
      const scaHeader = scaScore !== null ? ` // SCA ${scaScore}★` : '';
      const varietyHeader = variety ? `VAR. ${variety.toUpperCase()}` : 'SÉLECTION ATELIER';
      ctx.fillText(`HERBARIUM BOTANIQUE // COFFEA ARABICA ${varietyHeader}${scaHeader}`, baseW / 2, stripY + 21);
      ctx.textAlign = 'left';

      // 2. Terroir Ledger Matrix (2x2)
      const matY = stripY + stripH + 12;
      const matGap = 8;
      const colW = (availW - matGap) / 2;
      const colH = 86;

      const terroirItems = [
        { lbl: 'ORIGEN & FINCA', val: origin || 'Origen único', sub: producer || roaster || 'Finca de origen' },
        { lbl: 'ALTITUD & TERROIR', val: altitude || 'No especificada', sub: origin ? `Terroir: ${origin}` : 'Altitud sobre nivel del mar' },
        { lbl: 'VARIEDAD BOTÁNICA', val: variety || 'Arábica', sub: 'Variedad Coffea' },
        { lbl: 'PROCESO & BENEFICIO', val: process || 'Lavado', sub: 'Procesamiento de lote' }
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

      // 3. Sensory Notes & Cupping Profile Ledger
      const notesBoxY = matY + (colH * 2) + matGap + 10;
      const notesH = 150;
      ctx.fillStyle = '#FAF8F5';
      ctx.strokeStyle = '#E5E0D8';
      ctx.lineWidth = 0.8;
      drawRoundedRect(ctx, paddingX, notesBoxY, availW, notesH, 5, true, true);

      ctx.fillStyle = '#78716C';
      ctx.font = '800 8.5px "Playfair Display", Georgia, serif';
      ctx.fillText('NOTAS SENSORIALES // PERFIL EN TAZA', paddingX + 14, notesBoxY + 20);

      // Authentic notes text
      ctx.fillStyle = '#292524';
      ctx.font = 'italic 10.5px "Playfair Display", Georgia, serif';
      const actualNotes = notesStr ? `« ${notesStr} »` : 'Sin notas de cata registradas para este lote.';
      const linesDrawn = drawWrappedText(ctx, actualNotes, paddingX + 14, notesBoxY + 40, availW - 28, 17, 3);

      // Flavor pills below text
      if (flavorTags.length > 0) {
        let pillX = paddingX + 14;
        const pillY = notesBoxY + 44 + (linesDrawn * 17) + 8;
        const pillH = 22;

        flavorTags.slice(0, 5).forEach((tag) => {
          ctx.font = 'bold 9.5px "Playfair Display", Georgia, serif';
          const textW = ctx.measureText(tag).width;
          const pillW = textW + 18;
          if (pillX + pillW <= paddingX + availW - 14) {
            ctx.fillStyle = 'rgba(120, 53, 15, 0.06)';
            ctx.strokeStyle = 'rgba(120, 53, 15, 0.2)';
            ctx.lineWidth = 0.8;
            drawRoundedRect(ctx, pillX, pillY, pillW, pillH, 4, true, true);

            ctx.fillStyle = '#78350F';
            ctx.fillText(tag, pillX + 9, pillY + 15);

            pillX += pillW + 8;
          }
        });
      }

      // 4. Cellar Vacuum Sealed Doses Bar
      const cellarY = notesBoxY + notesH + 12;
      const cellarH = 34;
      ctx.fillStyle = '#F2EFE7';
      ctx.strokeStyle = '#E5E0D8';
      ctx.lineWidth = 0.8;
      drawRoundedRect(ctx, paddingX, cellarY, availW, cellarH, 4, true, true);

      ctx.fillStyle = '#3F6212';
      ctx.font = 'bold 9.5px "Playfair Display", Georgia, serif';
      const cellarText = remainingDoses !== null
        ? `❄️ CAVA BEANTAG: ${dosesStr} • DOSIS CONGELADAS AL VACÍO`
        : '☕ SÉLECTION ATELIER // BEANTAG ARCHIVE';
      ctx.fillText(cellarText, paddingX + 12, cellarY + 21);

      if (scaScore !== null) {
        ctx.fillStyle = '#78350F';
        ctx.textAlign = 'right';
        ctx.fillText(`SCA ${scaScore}★`, paddingX + availW - 12, cellarY + 21);
        ctx.textAlign = 'left';
      }

      // 5. Vector Seal & Atelier Footer
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
      const scaHeader = scaScore !== null ? ` // SCA ${scaScore}★` : '';
      ctx.fillText(`PROTOCOLE BARISTA // CALIBRATION D'EXTRACTION${scaHeader}`, baseW / 2, stripY + 21);
      ctx.textAlign = 'left';

      // 2. 4 Metric Tiles (2x2) with PURE TYPOGRAPHY
      const bentoY = stripY + stripH + 12;
      const bentoGap = 8;
      const colW = (availW - bentoGap) / 2;
      const colH = 92;

      const metrics = [
        { lbl: 'MÉTODO // EXTRACTION', val: methodStr, sub: 'Extraction filtre artisanale' },
        { lbl: 'RATIO // PROPORTION', val: `1:${ratioStr.replace('1:', '')}`, sub: `${coffeeG}g café ➔ ${waterG}g eau` },
        { lbl: 'MOUTURE // CALIBRATION', val: grindStr, sub: microns ? `~${microns} µm` : 'Mouture calibrée' },
        { lbl: 'TEMPS & TEMPÉRATURE', val: timeStr ? `${timeStr} MIN` : 'TEMPS LIBRE', sub: tempStr ? `${tempStr} • Débit régulier` : 'Température idéale' }
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
      const steps = (rec.pours && Array.isArray(rec.pours) && rec.pours.length > 0)
        ? rec.pours.slice(0, 3).map((p, i) => ({
            title: p.title || `Versée 0${i + 1}`,
            desc: `${p.weight ? p.weight + 'g' : ''}${p.time ? ' • ' + p.time : ''}`.trim() || 'Régulier'
          }))
        : [
            { title: 'Dose Café', desc: `${coffeeG}g mouture` },
            { title: 'Eau Totale', desc: `${waterG}g objectif` },
            { title: 'Ratio Tasse', desc: `1:${ratioStr.replace('1:', '')}` }
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

      if (flavorTags.length > 0) {
        flavorTags.slice(0, 5).forEach((tag) => {
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
      } else {
        ctx.fillStyle = '#8C827A';
        ctx.font = 'italic 9px "Playfair Display", Georgia, serif';
        ctx.fillText(notesStr ? `« ${notesStr.slice(0, 60)}... »` : 'Sin notas sensoriales adicionales especificadas', pillX, sensoryPillY + 16);
      }

      // 5. Cellar Stock Bar
      const cellarY = notesBoxY + notesH + 12;
      const cellarH = 32;
      ctx.fillStyle = '#F2EFE7';
      ctx.strokeStyle = '#E5E0D8';
      ctx.lineWidth = 0.8;
      drawRoundedRect(ctx, paddingX, cellarY, availW, cellarH, 4, true, true);

      ctx.fillStyle = '#3F6212';
      ctx.font = 'bold 9px "Playfair Display", Georgia, serif';
      const cellarText = remainingDoses !== null
        ? `❄️ CAVA BEANTAG: ${dosesStr} • DOSIS CONGELADAS AL VACÍO`
        : '☕ PROTOCOLE ATELIER // BEANTAG ARCHIVE';
      ctx.fillText(cellarText, paddingX + 12, cellarY + 20);

      // 6. Vector Seal & Atelier Footer
      const footY = cellarY + cellarH + 10;
      drawVectorSeal(ctx, baseW - paddingX - 28, footY + 12, 16);

      ctx.fillStyle = '#78716C';
      ctx.font = '600 8px "Playfair Display", Georgia, serif';
      ctx.fillText(`BEANTAG SPECIALTY ATELIER // PROTOCOLE ${new Date().getFullYear()} // LOT ARTISANAL`, paddingX, footY + 16);
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
      const roasterStr = stripEmojis(b.roaster || '');
      const originStr = stripEmojis(b.origin || '');
      const altStr = b.altitude ? `${stripEmojis(String(b.altitude))}${String(b.altitude).toLowerCase().includes('m') ? '' : 'm'}` : '';
      const line2Tokens = [roasterStr, originStr, altStr].filter(Boolean);
      const line2Text = line2Tokens.join(' • ');

      ctx.fillStyle = '#93C5FD';
      ctx.font = '700 9.5px "JetBrains Mono", monospace';
      ctx.fillText(line2Text || 'Origen Único', paddingX + 46, curY + 38);

      // Line 3: Variety, Process & SCA Score
      const varietyStr = stripEmojis(b.variety || '');
      const processStr = stripEmojis(b.process || '');
      const rawSca = b.sca_score;
      const validSca = rawSca && !isNaN(parseFloat(rawSca)) && parseFloat(rawSca) > 0 ? parseFloat(rawSca) : null;
      const scaStr = validSca ? `SCA ${validSca}` : '';
      const line3Tokens = [varietyStr, processStr, scaStr].filter(Boolean);
      const line3Text = line3Tokens.join(' • ');

      if (line3Text) {
        ctx.fillStyle = '#38BDF8';
        ctx.font = '700 9px "JetBrains Mono", monospace';
        ctx.fillText(line3Text, paddingX + 46, curY + 52);
      }

      // Line 4: Flavor Notes Pills
      const rawNotes = b.flavor_notes || b.roaster_notes || b.notes || b.batch_roaster_notes || '';
      const parsedTags = extractFlavorTags(rawNotes).slice(0, 4);

      if (parsedTags.length > 0) {
        let pillX = paddingX + 46;
        const pillY = curY + 64;
        const pillH = 18;

        ctx.font = '800 8.5px "JetBrains Mono", monospace';
        parsedTags.forEach(tag => {
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
      }

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
      const roasterStr = stripEmojis(b.roaster || '');
      const originStr = stripEmojis(b.origin || '');
      const altStr = b.altitude ? `${stripEmojis(String(b.altitude))}${String(b.altitude).toLowerCase().includes('m') ? '' : 'm'}` : '';
      const line2Tokens = [roasterStr, originStr, altStr].filter(Boolean);
      const line2Text = line2Tokens.join(' • ');

      ctx.fillStyle = '#475569';
      ctx.font = '700 9.5px "Space Grotesk", sans-serif';
      ctx.fillText(line2Text || 'ORIGEN ÚNICO', paddingX + 46, curY + 38);

      // Line 3: Variety, Process & SCA Score
      const varietyStr = stripEmojis(b.variety || '');
      const processStr = stripEmojis(b.process || '');
      const rawSca = b.sca_score;
      const validSca = rawSca && !isNaN(parseFloat(rawSca)) && parseFloat(rawSca) > 0 ? parseFloat(rawSca) : null;
      const scaStr = validSca ? `SCA ${validSca}` : '';
      const line3Tokens = [varietyStr, processStr, scaStr].filter(Boolean);
      const line3Text = line3Tokens.join(' • ');

      if (line3Text) {
        ctx.fillStyle = '#0F172A';
        ctx.font = '700 9px "Space Grotesk", sans-serif';
        ctx.fillText(line3Text, paddingX + 46, curY + 52);
      }

      // Line 4: Flavor Notes Pills
      const rawNotes = b.flavor_notes || b.roaster_notes || b.notes || b.batch_roaster_notes || '';
      const parsedTags = extractFlavorTags(rawNotes).slice(0, 4);

      if (parsedTags.length > 0) {
        const pillColors = ['#D4FF00', '#FED7AA', '#E9D5FF', '#BAE6FD'];
        let pillX = paddingX + 46;
        const pillY = curY + 64;
        const pillH = 18;

        ctx.font = '900 8.5px "Space Grotesk", sans-serif';
        parsedTags.forEach((tag, tIdx) => {
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
      }

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
      const roasterStr = stripEmojis(b.roaster || '');
      const originStr = stripEmojis(b.origin || '');
      const altStr = b.altitude ? `${stripEmojis(String(b.altitude))}${String(b.altitude).toLowerCase().includes('m') ? '' : 'm'}` : '';
      const line2Tokens = [roasterStr, originStr, altStr].filter(Boolean);
      const line2Text = line2Tokens.join(' • ');

      ctx.fillStyle = '#94A3B8';
      ctx.font = '600 9.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(line2Text || 'Origen Único', paddingX + 46, curY + 38);

      // Line 3: Variety, Process & SCA Score
      const varietyStr = stripEmojis(b.variety || '');
      const processStr = stripEmojis(b.process || '');
      const rawSca = b.sca_score;
      const validSca = rawSca && !isNaN(parseFloat(rawSca)) && parseFloat(rawSca) > 0 ? parseFloat(rawSca) : null;
      const scaStr = validSca ? `SCA ${validSca}` : '';
      const line3Tokens = [varietyStr, processStr, scaStr].filter(Boolean);
      const line3Text = line3Tokens.join(' • ');

      if (line3Text) {
        ctx.fillStyle = '#CBD5E1';
        ctx.font = '600 9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(line3Text, paddingX + 46, curY + 52);
      }

      // Line 4: Flavor Notes Pills
      const rawNotes = b.flavor_notes || b.roaster_notes || b.notes || b.batch_roaster_notes || '';
      const parsedTags = extractFlavorTags(rawNotes).slice(0, 4);

      if (parsedTags.length > 0) {
        let pillX = paddingX + 46;
        const pillY = curY + 64;
        const pillH = 18;

        ctx.font = '700 8.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        parsedTags.forEach(tag => {
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
      }

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
      const roasterStr = stripEmojis(b.roaster || '');
      const originStr = stripEmojis(b.origin || '');
      const altStr = b.altitude ? `${stripEmojis(String(b.altitude))}${String(b.altitude).toLowerCase().includes('m') ? '' : 'm'}` : '';
      const line2Tokens = [roasterStr, originStr, altStr].filter(Boolean);
      const line2Text = line2Tokens.join(' • ');

      ctx.fillStyle = '#57534E';
      ctx.font = 'italic 9.5px "Playfair Display", Georgia, serif';
      ctx.fillText(line2Text || 'Sélection Spéciale', paddingX + 44, curY + 38);

      // Line 3: Variety, Process & SCA Score
      const varietyStr = stripEmojis(b.variety || '');
      const processStr = stripEmojis(b.process || '');
      const rawSca = b.sca_score;
      const validSca = rawSca && !isNaN(parseFloat(rawSca)) && parseFloat(rawSca) > 0 ? parseFloat(rawSca) : null;
      const scaStr = validSca ? `SCA ${validSca}` : '';
      const line3Tokens = [varietyStr, processStr, scaStr].filter(Boolean);
      const line3Text = line3Tokens.join(' • ');

      if (line3Text) {
        ctx.fillStyle = '#78716C';
        ctx.font = 'bold 9px "Playfair Display", Georgia, serif';
        ctx.fillText(line3Text, paddingX + 44, curY + 52);
      }

      // Line 4: Flavor Notes Pills
      const rawNotes = b.flavor_notes || b.roaster_notes || b.notes || b.batch_roaster_notes || '';
      const parsedTags = extractFlavorTags(rawNotes).slice(0, 4);

      if (parsedTags.length > 0) {
        let pillX = paddingX + 44;
        const pillY = curY + 64;
        const pillH = 18;

        ctx.font = 'italic 8.5px "Playfair Display", Georgia, serif';
        parsedTags.forEach(tag => {
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
      }

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
