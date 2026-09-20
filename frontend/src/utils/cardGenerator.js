// --- BEANTAG AESTHETIC TICKET & CARD GENERATOR (2026/2027) ---
// High-Fashion Vertical Portrait (540 x 760 px @ 2x Retina = 1080 x 1520 px)
// Supporting both Barista Extraction Tickets ("Con Receta") and
// Specialty Coffee Terroir & Cupping Collector Cards ("Solo Grano").
// Pure high-end typographical minimalism (Zero raster hero PNG images),
// guaranteed async fonts, and strict WCAG AAA contrast.

/**
 * Normalizes template names to the 4 official styles:
 * 'blueprint' | 'neobrutalist' | 'diner' | 'kissaten'
 * (Preserves 'aurora' -> 'diner' and 'hangtag' -> 'kissaten' for backwards compatibility)
 */
export function normalizeCardStyle(tpl) {
  if (!tpl) return 'blueprint';
  const lower = String(tpl).toLowerCase();
  if (lower.includes('blue') || lower.includes('cyan') || lower.includes('tech') || lower.includes('patent')) return 'blueprint';
  if (lower.includes('neo') || lower.includes('brutal') || lower.includes('pop') || lower.includes('bold')) return 'neobrutalist';
  if (lower.includes('diner') || lower.includes('retro') || lower.includes('1950') || lower.includes('50') || lower.includes('aurora') || lower.includes('glass') || lower.includes('holo') || lower.includes('dark')) return 'diner';
  if (lower.includes('kissa') || lower.includes('washi') || lower.includes('tokyo') || lower.includes('japan') || lower.includes('sumi') || lower.includes('hang') || lower.includes('nord') || lower.includes('vintage') || lower.includes('paper') || lower.includes('minimal')) return 'kissaten';
  return 'blueprint';
}

export { getScaWheelIcon, cleanNotesString } from './scaIcons';
import { getScaWheelIcon, cleanNotesString } from './scaIcons';

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
 * Extracts flavor notes into clean tags, eliminating any bracketed prefixes like [Notas:
 */
export function extractFlavorTags(notes) {
  if (!notes) return [];
  const cleaned = cleanNotesString(notes);
  const notesPart = cleaned.includes(' | ') ? cleaned.split(' | ')[0] : cleaned;
  return notesPart
    .split(/[,•|\/\n]+/)
    .map(t => t.replace(/^\s*\[?\s*(?:notas?|notes?)\s*:?\s*/gi, '').replace(/[\[\]]/g, '').trim())
    .filter(t => t.length > 1 && !/^(?:notas?|notes?):?$/i.test(t));
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
 * Draws a 5-axis Mini SCA Sensory Radar Chart on the given Canvas context
 */
export function drawSensoryRadarChart(ctx, cx, cy, radius, sensoryData, style) {
  if (!sensoryData) return false;
  const s = normalizeCardStyle(style);
  const {
    balance = 3,
    body = 3,
    extraction = 3,
    rating = 4,
    sweetness = 3.5
  } = sensoryData;

  const values = [extraction, sweetness, body, balance, rating];
  const labels = ['ACIDEZ', 'DULZOR', 'CUERPO', 'BALANCE', 'FINAL'];
  const numAxes = 5;

  ctx.save();

  // 1. Concentric Guide Pentagons (33%, 66%, 100%)
  [0.33, 0.66, 1.0].forEach(level => {
    ctx.beginPath();
    for (let i = 0; i < numAxes; i++) {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / numAxes;
      const x = cx + radius * level * Math.cos(angle);
      const y = cy + radius * level * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = s === 'blueprint'
      ? 'rgba(56, 189, 248, 0.3)'
      : (s === 'neobrutalist' ? 'rgba(0,0,0,0.2)' : (s === 'diner' ? 'rgba(14, 116, 144, 0.25)' : 'rgba(24, 24, 27, 0.2)'));
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  // 2. Radial Spines
  for (let i = 0; i < numAxes; i++) {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / numAxes;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
    ctx.stroke();
  }

  // 3. Data Polygon
  ctx.beginPath();
  for (let i = 0; i < numAxes; i++) {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / numAxes;
    const normVal = Math.max(1, Math.min(5, values[i])) / 5.0;
    const r = normVal * radius;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();

  // Themed Fill & Stroke
  if (s === 'blueprint') {
    ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.strokeStyle = '#38BDF8';
  } else if (s === 'neobrutalist') {
    ctx.fillStyle = 'rgba(255, 230, 0, 0.5)';
    ctx.strokeStyle = '#000000';
  } else if (s === 'diner') {
    ctx.fillStyle = 'rgba(14, 116, 144, 0.25)';
    ctx.strokeStyle = '#0E7490';
  } else {
    ctx.fillStyle = 'rgba(220, 38, 38, 0.15)';
    ctx.strokeStyle = '#DC2626';
  }
  ctx.lineWidth = s === 'neobrutalist' ? 2 : 1.5;
  ctx.fill();
  ctx.stroke();

  // 4. Vertex Points
  for (let i = 0; i < numAxes; i++) {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / numAxes;
    const normVal = Math.max(1, Math.min(5, values[i])) / 5.0;
    const r = normVal * radius;
    ctx.beginPath();
    ctx.arc(cx + r * Math.cos(angle), cy + r * Math.sin(angle), 2.5, 0, 2 * Math.PI);
    ctx.fillStyle = s === 'diner'
      ? '#C92A2A'
      : (s === 'kissaten' ? '#DC2626' : (s === 'blueprint' ? '#38BDF8' : '#000000'));
    ctx.fill();
  }

  // 5. Axis Labels with quadrant-aware alignment to prevent vertex collisions
  ctx.font = '700 7px "JetBrains Mono", monospace';
  ctx.fillStyle = s === 'blueprint'
    ? '#93C5FD'
    : (s === 'kissaten' ? '#52525B' : (s === 'diner' ? '#0E7490' : '#18181B'));
  for (let i = 0; i < numAxes; i++) {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / numAxes;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    ctx.textAlign = Math.abs(cosA) < 0.25 ? 'center' : (cosA > 0 ? 'left' : 'right');
    ctx.textBaseline = Math.abs(sinA) < 0.25 ? 'middle' : (sinA > 0 ? 'top' : 'bottom');
    const lx = cx + (radius + 8) * cosA;
    const ly = cy + (radius + 6) * sinA;
    ctx.fillText(labels[i], lx, ly);
  }

  ctx.restore();
  return true;
}

/**
 * Helper to parse sensory evaluation data from batch and recipe
 */
export function parseSensoryEvaluation(batch, recipe) {
  const r = recipe || {};
  const b = batch || {};
  const balanceRaw = r.sensory_balance || b.sensory_balance;
  const bodyRaw = r.sensory_body || b.sensory_body;
  const extractionRaw = r.sensory_extraction || b.sensory_extraction;
  const ratingRaw = r.rating || b.rating;

  // Strict check: At least one actual sensory attribute must be evaluated (rating alone is not sensory!)
  if (!balanceRaw && !bodyRaw && !extractionRaw) {
    return null;
  }

  const mapAttr = (val) => {
    if (typeof val === 'number' && Number.isFinite(val)) return Math.max(1, Math.min(5, val));
    if (!val) return 3;
    const s = String(val).toLowerCase();
    // High / Over / Heavy extraction & body
    if (s.includes('sobre') || s.includes('over') || s.includes('heavy') || s.includes('alta') || s.includes('intenso') || s.includes('pesado')) return 4.5;
    // Sweet / Balanced / Medium / En Punto (gold standard)
    if (s.includes('en punto') || s.includes('balanced') || s.includes('balanceado') || s.includes('medium') || s.includes('medio') || s.includes('dulce')) return 5.0;
    // Silky body
    if (s.includes('sedoso') || s.includes('silky')) return 4.2;
    // Low / Under / Light / Acid
    if (s.includes('sub') || s.includes('under') || s.includes('light') || s.includes('ligero') || s.includes('bajo') || s.includes('ácido') || s.includes('acido')) return 2.5;
    // Bitter
    if (s.includes('amargo') || s.includes('bitter')) return 2.0;

    const n = parseFloat(val);
    return isNaN(n) ? 3 : Math.max(1, Math.min(5, n));
  };

  const balance = mapAttr(balanceRaw);
  const body = mapAttr(bodyRaw);
  const extraction = mapAttr(extractionRaw);
  const rating = typeof ratingRaw === 'number' && Number.isFinite(ratingRaw) ? ratingRaw : (parseFloat(ratingRaw) || 4);
  const sweetness = (balance + rating) / 2;

  return { balance, body, extraction, rating, sweetness };
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
      document.fonts.load('bold 30px "Playfair Display"')
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
 * Method-Adaptive Extraction Timeline Module
 * Visualizes extraction stages, timings, weights, and grind calibration
 */
export function drawExtractionTimeline(ctx, x, y, width, height, recipeData, style) {
  if (!recipeData) return;
  const s = normalizeCardStyle(style);
  const {
    method = recipeData.methodStr || 'V60',
    brew_time = recipeData.time || '2:30',
    dose_in_g = recipeData.coffee_grams ?? 15,
    dose_out_g = recipeData.water_grams ?? 250,
    ratio = '1:16.6',
    temperature = recipeData.temp || '93°C',
    grind = recipeData.grind_size || 'Medio'
  } = recipeData;

  const isEspresso = /espresso/i.test(method);
  const isImmersion = /french|prensa|aeropress|cupping/i.test(method);

  ctx.save();

  // Header of extraction timeline
  ctx.font = '800 8px "JetBrains Mono", monospace';
  ctx.fillStyle = s === 'blueprint'
    ? '#38BDF8'
    : (s === 'diner' ? '#C92A2A' : (s === 'kissaten' ? '#DC2626' : '#000000'));
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const methodLabel = `${(method || 'POUR OVER').toUpperCase()}${temperature ? ' • ' + temperature : ''}`;
  ctx.fillText(`TIMELINE DE EXTRACCIÓN // ${methodLabel}`, x, y);

  // Grind micron chip (truncated defensively to prevent collision with header)
  const microns = parseGrindToMicrons(grind);
  const cleanGrind = grind && String(grind).length > 24 ? String(grind).slice(0, 22) + '…' : grind;
  ctx.font = '700 7.5px "JetBrains Mono", monospace';
  ctx.fillStyle = s === 'blueprint' ? '#93C5FD' : '#64748B';
  ctx.textAlign = 'right';
  ctx.fillText(`MOLIENDA: ${microns}µm (${cleanGrind})`, x + width, y);

  const barY = y + 13;
  const barH = 10;

  // Stages calculation based on method
  let stages = [];
  if (isEspresso) {
    const outG = dose_out_g ? `${dose_out_g}g` : '36g';
    stages = [
      { label: 'PRE-INFUSIÓN', time: '0-6s', weight: 'Baja bar', flex: 1.5, color: '#1E293B' },
      { label: 'RAMPA 9 BAR', time: '6-24s', weight: 'Extracción', flex: 3.5, color: '#0E7490' },
      { label: 'CORTE', time: brew_time || '28s', weight: outG, flex: 1.2, color: '#DC2626' }
    ];
  } else if (isImmersion) {
    stages = [
      { label: 'INFUSIÓN', time: '0:00 - 3:30', weight: `${dose_out_g || 250}g`, flex: 3.5, color: '#1E293B' },
      { label: 'TURBULENCIA', time: '3:30 - 4:00', weight: 'Costra', flex: 1.5, color: '#3B82F6' },
      { label: 'PRENSADO', time: brew_time || '4:30', weight: 'Filtrado', flex: 1.2, color: '#10B981' }
    ];
  } else {
    // Pour-Over / Drip (V60, Chemex, Kalita, Origami, etc.)
    const totalW = dose_out_g || (dose_in_g ? Math.round(dose_in_g * 16.6) : 250);
    const bloomW = Math.round(totalW * 0.2);
    const pulse1W = Math.round(totalW * 0.6);
    stages = [
      { label: 'BLOOM', time: '0:00 - 0:45', weight: `${bloomW}g`, flex: 1.4, color: '#18181B' },
      { label: 'PULSO 1', time: '0:45 - 1:30', weight: `${pulse1W}g`, flex: 2.0, color: '#3B82F6' },
      { label: 'PULSO 2', time: '1:30 - 2:00', weight: `${totalW}g`, flex: 2.0, color: '#10B981' },
      { label: 'CAÍDA', time: brew_time || '2:45', weight: 'Drenaje', flex: 1.3, color: '#64748B' }
    ];
  }

  const totalFlex = stages.reduce((acc, st) => acc + st.flex, 0);
  const gap = 3;
  const availableW = width - (gap * (stages.length - 1));
  let curX = x;

  stages.forEach((st, idx) => {
    const segW = (st.flex / totalFlex) * availableW;

    // Segment background
    let segColor = st.color;
    if (s === 'neobrutalist') {
      const neoColors = ['#FFE600', '#A3E635', '#38BDF8', '#F472B6'];
      segColor = neoColors[idx % neoColors.length];
    } else if (s === 'blueprint') {
      segColor = idx === 0 ? '#38BDF8' : (idx === 1 ? 'rgba(56, 189, 248, 0.7)' : (idx === 2 ? 'rgba(56, 189, 248, 0.45)' : 'rgba(56, 189, 248, 0.25)'));
    } else if (s === 'diner') {
      segColor = idx === 0 ? '#C92A2A' : (idx === 1 ? '#0E7490' : (idx === 2 ? '#F59E0B' : '#64748B'));
    } else if (s === 'kissaten') {
      segColor = idx === 0 ? '#DC2626' : (idx === 1 ? '#27272A' : (idx === 2 ? '#52525B' : '#A1A1AA'));
    }

    ctx.fillStyle = segColor;
    ctx.strokeStyle = s === 'neobrutalist' ? '#000000' : 'transparent';
    ctx.lineWidth = s === 'neobrutalist' ? 1.8 : 0;
    drawRoundedRect(ctx, curX, barY, segW, barH, 2.5, true, s === 'neobrutalist');

    // Time label above
    ctx.font = '700 6.5px "JetBrains Mono", monospace';
    ctx.fillStyle = s === 'blueprint' ? '#93C5FD' : '#64748B';
    ctx.textAlign = 'center';
    ctx.fillText(st.time, curX + segW / 2, barY - 3);

    // Stage + weight label below
    ctx.font = '800 6.5px "JetBrains Mono", monospace';
    ctx.fillStyle = s === 'blueprint' ? '#FFFFFF' : (s === 'neobrutalist' ? '#000000' : '#18181B');
    const stageText = segW >= 72 && st.weight ? `${st.label} (${st.weight})` : st.label;
    ctx.fillText(stageText, curX + segW / 2, barY + barH + 9);

    curX += segW + gap;
  });

  ctx.restore();
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
 * Pure vector 4-pointed diamond starburst for 1950s Americana Diner
 */
function drawDinerAtomicStar(ctx, cx, cy, size = 16, color = '#C92A2A') {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy - size);
  ctx.quadraticCurveTo(cx, cy, cx + size * 0.35, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy + size);
  ctx.quadraticCurveTo(cx, cy, cx - size * 0.35, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy - size);
  ctx.fill();

  // Satellite sparkles
  ctx.beginPath();
  ctx.arc(cx + size * 0.65, cy - size * 0.6, Math.max(1, size * 0.14), 0, Math.PI * 2);
  ctx.arc(cx - size * 0.65, cy + size * 0.6, Math.max(1, size * 0.12), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Pure vector Tokyo Kissaten Hanko Seal (Vermilion stamp)
 */
function drawHankoSeal(ctx, cx, cy, size = 32, kanji = '豆札') {
  ctx.save();
  const s = size;
  const x = cx - s / 2;
  const y = cy - s / 2;
  const rad = Math.max(3, s * 0.12);

  ctx.fillStyle = 'rgba(220, 38, 38, 0.08)';
  ctx.strokeStyle = '#DC2626';
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, x, y, s, s, rad, true, true);

  ctx.strokeStyle = '#DC2626';
  ctx.lineWidth = 0.8;
  drawRoundedRect(ctx, x + 2.5, y + 2.5, s - 5, s - 5, Math.max(2, rad - 2), false, true);

  ctx.fillStyle = '#DC2626';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (kanji === '豆札') {
    ctx.font = `bold ${Math.round(s * 0.36)}px "Hiragino Mincho ProN", "Yu Mincho", serif`;
    ctx.fillText('豆', cx, cy - s * 0.2);
    ctx.fillText('札', cx, cy + s * 0.22);
  } else {
    ctx.font = `bold ${Math.round(s * 0.42)}px "Hiragino Mincho ProN", "Yu Mincho", serif`;
    ctx.fillText(kanji, cx, cy);
  }
  ctx.restore();
}

/**
 * Pure vector Die-Cut Notches & Tear-Off Perforation Module
 * Renders realistic ticket cutouts and dashed perforation line with style-specific accents.
 */
export function drawTicketNotchesAndPerforation(ctx, x, width, notchY, style, bgColor) {
  const s = normalizeCardStyle(style);
  const defaultBgs = {
    blueprint: '#0B192C',
    neobrutalist: '#F1F5F9',
    diner: '#FDFBF7',
    kissaten: '#EFECE6'
  };
  const fillBg = bgColor || defaultBgs[s] || '#FFFDF8';
  const radius = 12;

  ctx.save();

  if (s === 'neobrutalist') {
    // 1. 3px hard black offset shadow for the arc
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(x + 3, notchY + 3, radius, -Math.PI / 2, Math.PI / 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x + width + 3, notchY + 3, radius, Math.PI / 2, (3 * Math.PI) / 2);
    ctx.fill();

    // 2. Cutout arcs
    ctx.fillStyle = fillBg;
    ctx.beginPath();
    ctx.arc(x, notchY, radius, -Math.PI / 2, Math.PI / 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x + width, notchY, radius, Math.PI / 2, (3 * Math.PI) / 2);
    ctx.fill();

    // 3. 2.5px solid black outline
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#000000';
    ctx.beginPath();
    ctx.arc(x, notchY, radius, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x + width, notchY, radius, Math.PI / 2, (3 * Math.PI) / 2);
    ctx.stroke();

    // 4. Chunky perforation dash [5, 4]
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#000000';
    ctx.beginPath();
    ctx.moveTo(x + radius + 2, notchY);
    ctx.lineTo(x + width - radius - 2, notchY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 5. Center badge: [ TEAR // CORTE ]
    const badgeText = '[ TEAR // CORTE ]';
    ctx.font = '900 7px "Space Grotesk", sans-serif';
    const tw = ctx.measureText(badgeText).width;
    const bw = tw + 12;
    const bh = 14;
    const bx = x + width / 2 - bw / 2;
    const by = notchY - bh / 2;

    ctx.fillStyle = '#000000';
    ctx.fillRect(bx + 2, by + 2, bw, bh);

    ctx.fillStyle = '#FFFDF8';
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.8;
    ctx.strokeRect(bx, by, bw, bh);

    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeText, x + width / 2, notchY);
  } else if (s === 'blueprint') {
    // 1. Cutout arcs
    ctx.fillStyle = fillBg;
    ctx.beginPath();
    ctx.arc(x, notchY, radius, -Math.PI / 2, Math.PI / 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x + width, notchY, radius, Math.PI / 2, (3 * Math.PI) / 2);
    ctx.fill();

    // 2. Outlines in cyan
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = '#38BDF8';
    ctx.beginPath();
    ctx.arc(x, notchY, radius, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x + width, notchY, radius, Math.PI / 2, (3 * Math.PI) / 2);
    ctx.stroke();

    // 3. Technical engineering crosshairs at notch apexes
    const drawMiniCross = (cx, cy, arm = 3) => {
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(cx - arm, cy);
      ctx.lineTo(cx + arm, cy);
      ctx.moveTo(cx, cy - arm);
      ctx.lineTo(cx, cy + arm);
      ctx.stroke();
    };
    drawMiniCross(x, notchY - radius, 3);
    drawMiniCross(x, notchY + radius, 3);
    drawMiniCross(x + width, notchY - radius, 3);
    drawMiniCross(x + width, notchY + radius, 3);

    // 4. Dashed perforation line [4, 4] in #38BDF8
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#38BDF8';
    ctx.beginPath();
    ctx.moveTo(x + radius + 2, notchY);
    ctx.lineTo(x + width - radius - 2, notchY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 5. Technical radius annotation: R12 // CUT_LINE in cyan 7px "JetBrains Mono"
    ctx.font = '700 7px "JetBrains Mono", monospace';
    ctx.fillStyle = '#38BDF8';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText('R12 // CUT_LINE', x + radius + 6, notchY - 3);
  } else if (s === 'kissaten') {
    // 1. Cutout arcs
    ctx.fillStyle = fillBg;
    ctx.beginPath();
    ctx.arc(x, notchY, radius, -Math.PI / 2, Math.PI / 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x + width, notchY, radius, Math.PI / 2, (3 * Math.PI) / 2);
    ctx.fill();

    // 2. Ultra-thin sumi hairline: lineWidth = 0.75, strokeStyle = 'rgba(24, 24, 27, 0.4)'
    ctx.lineWidth = 0.75;
    ctx.strokeStyle = 'rgba(24, 24, 27, 0.4)';
    ctx.beginPath();
    ctx.arc(x, notchY, radius, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x + width, notchY, radius, Math.PI / 2, (3 * Math.PI) / 2);
    ctx.stroke();

    // 3. Delicate dash [2, 3]
    ctx.setLineDash([2, 3]);
    ctx.lineWidth = 0.75;
    ctx.strokeStyle = 'rgba(24, 24, 27, 0.4)';
    ctx.beginPath();
    ctx.moveTo(x + radius + 2, notchY);
    ctx.lineTo(x + width - radius - 2, notchY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 4. Clean Japanese incision text: 切取り線 (font: 7px serif / Outfit, color: #71717A)
    const incisionText = '切取り線';
    ctx.font = '7px "Playfair Display", Georgia, serif';
    ctx.fillStyle = '#71717A';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const textW = ctx.measureText(incisionText).width;
    ctx.fillStyle = '#F7F5F0';
    ctx.fillRect(x + width / 2 - textW / 2 - 4, notchY - 5, textW + 8, 10);
    ctx.fillStyle = '#71717A';
    ctx.fillText(incisionText, x + width / 2, notchY);
  } else {
    // Retro 50s Diner
    // 1. Cutout arcs
    ctx.fillStyle = fillBg;
    ctx.beginPath();
    ctx.arc(x, notchY, radius, -Math.PI / 2, Math.PI / 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x + width, notchY, radius, Math.PI / 2, (3 * Math.PI) / 2);
    ctx.fill();

    // 2. Cherry Red outline #C92A2A
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = '#C92A2A';
    ctx.beginPath();
    ctx.arc(x, notchY, radius, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x + width, notchY, radius, Math.PI / 2, (3 * Math.PI) / 2);
    ctx.stroke();

    // 3. Dashed line [4, 4] in #0E7490
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = '#0E7490';
    ctx.beginPath();
    ctx.moveTo(x + radius + 14, notchY);
    ctx.lineTo(x + width - radius - 14, notchY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 4. Atomic stars ✦ at both terminals
    ctx.fillStyle = '#C92A2A';
    ctx.font = '700 8.5px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✦', x + radius + 7, notchY);
    ctx.fillText('✦', x + width - radius - 7, notchY);
  }

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

  const drawWrappedText = (...args) => {
    let text, x, y, maxWidth, lineHeight, maxLines;
    if (args[0] && typeof args[0] === 'object' && typeof args[0].fillText === 'function') {
      [, text, x, y, maxWidth, lineHeight = 15, maxLines = 3] = args;
    } else {
      [text, x, y, maxWidth, lineHeight = 15, maxLines = 3] = args;
    }
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
  const batch = rec.batch || rec;
  const sensoryData = parseSensoryEvaluation(batch, rec);

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
  const notesStr = cleanNotesString(rec.flavor_notes || rec.roaster_notes || rec.batch_roaster_notes || '');
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
  const ratioStr = rec.ratio || (coffeeG && coffeeG > 0 && waterG ? `1:${(waterG / coffeeG).toFixed(1)}` : '1:15');
  const grindStr = stripEmojis(rec.grind_size || rec.grind || 'Medio');
  const microns = parseGrindToMicrons(grindStr);
  const tempStr = rec.temp || rec.temperature ? `${String(rec.temp || rec.temperature).replace('°C', '')}°C` : '93°C';
  const timeStr = rec.time || rec.brew_time ? `${stripEmojis(String(rec.time || rec.brew_time)).replace(' min', '')}` : '2:30';

  const paddingX = 26;
  const paddingY = 26;
  const availW = baseW - (paddingX * 2); // 488 px
  const pad = 18;
  const cardW = baseW - (pad * 2); // 504 px
  const cardH = baseH - (pad * 2); // 724 px

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
    drawFittedText(coffeeName.toUpperCase(), paddingX, paddingY + 42, availW, 26, '"JetBrains Mono", monospace', '900');

    if (subtitleStr) {
      ctx.fillStyle = '#93C5FD';
      ctx.font = '700 9.5px "JetBrains Mono", monospace';
      drawTruncatedText(subtitleStr.toUpperCase(), paddingX, paddingY + 62, availW);
    }

    drawTicketNotchesAndPerforation(ctx, pad, cardW, paddingY + 84, style, '#06162D');

    // -----------------------------------------------------------------------
    // MODE A: SOLO GRANO (TERROIR & CUPPING SHOWCASE)
    // -----------------------------------------------------------------------
    if (!incRecipe) {
      // 1. Spec Header Strip
      const specBoxY = paddingY + 104;
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

      const hasRadar = sensoryData !== null;
      const contentW = hasRadar ? availW - 146 : availW - 24;

      // Authentic Cupping Notes presentation (Render prominent pills or clean text without repeating)
      if (flavorTags.length > 0) {
        let pillX = paddingX + 12;
        let pillY = notesY + 44;
        const pillH = 24;
        ctx.font = '800 9.5px "JetBrains Mono", monospace';

        flavorTags.slice(0, 6).forEach((tag) => {
          const scaIcon = getScaWheelIcon(tag);
          const tagLabel = `${scaIcon} ${tag.toUpperCase()}`;
          const tw = ctx.measureText(tagLabel).width;
          const pw = tw + 18;
          if (pillX + pw > paddingX + contentW && pillX > paddingX + 12) {
            pillX = paddingX + 12;
            pillY += 32;
          }
          if (pillX + pw <= paddingX + contentW && pillY + pillH <= notesY + notesH - 10) {
            ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
            ctx.strokeStyle = '#38BDF8';
            ctx.lineWidth = 1;
            drawRoundedRect(ctx, pillX, pillY, pw, pillH, 4, true, true);

            ctx.fillStyle = '#BAE6FD';
            ctx.fillText(tagLabel, pillX + 9, pillY + 16);
            pillX += pw + 8;
          }
        });
      } else if (notesStr) {
        ctx.fillStyle = '#E0F2FE';
        ctx.font = '700 10.5px "JetBrains Mono", monospace';
        drawWrappedText(notesStr, paddingX + 12, notesY + 44, contentW, 18, 3);
      } else {
        ctx.fillStyle = '#94A3B8';
        ctx.font = 'italic 10px "JetBrains Mono", monospace';
        ctx.fillText('Sin notas de cata descriptivas registradas para este lote.', paddingX + 12, notesY + 44);
      }

      if (hasRadar) {
        drawSensoryRadarChart(ctx, paddingX + availW - 68, notesY + 74, 36, sensoryData, style);
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
      const specBoxY = paddingY + 104;
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
          ctx.fillStyle = '#94A3B8';
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

      const hasRadar = sensoryData !== null;
      const contentW = hasRadar ? availW - 116 : availW - 12;

      if (flavorTags.length > 0) {
        let pillX = paddingX + 12;
        const pillY = notesY + 30;
        flavorTags.slice(0, 4).forEach((tag) => {
          ctx.font = '800 9.5px "JetBrains Mono", monospace';
          const scaIcon = getScaWheelIcon(tag);
          const tagLabel = `${scaIcon} ${tag.toUpperCase()}`;
          const tw = ctx.measureText(tagLabel).width;
          const pw = tw + 16;
          if (pillX + pw <= paddingX + contentW) {
            ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
            ctx.strokeStyle = '#38BDF8';
            ctx.lineWidth = 1;
            drawRoundedRect(ctx, pillX, pillY, pw, 24, 4, true, true);

            ctx.fillStyle = '#E0F2FE';
            ctx.fillText(tagLabel, pillX + 8, pillY + 16);
            pillX += pw + 8;
          }
        });
      } else if (notesStr) {
        ctx.fillStyle = '#BAE6FD';
        ctx.font = '700 9px "JetBrains Mono", monospace';
        drawTruncatedText(notesStr, paddingX + 12, notesY + 44, hasRadar ? availW - 120 : availW - 24);
      } else {
        ctx.fillStyle = '#94A3B8';
        ctx.font = 'italic 8.5px "JetBrains Mono", monospace';
        ctx.fillText('Sin descriptores sensoriales registrados.', paddingX + 12, notesY + 44);
      }

      if (hasRadar) {
        drawSensoryRadarChart(ctx, paddingX + availW - 55, notesY + 38, 23, sensoryData, style);
      }

      // 5. Extraction Timeline
      const timelineY = notesY + notesH + 16;
      drawExtractionTimeline(ctx, paddingX, timelineY, availW, 36, rec, style);
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
    drawFittedText(coffeeName.toUpperCase(), paddingX, paddingY + 62, availW, 28, '"Space Grotesk", sans-serif', '900');

    // 3. Metadata Tag Pills with Drop Shadows (Truthful only)
    const tagY = paddingY + 76;
    const tags = [
      origin ? { text: origin.toUpperCase(), bg: '#FF3B14', color: '#000' } : null,
      process ? { text: process.toUpperCase(), bg: '#FFFFFF', color: '#000' } : null,
      altitude ? { text: altitude, bg: '#D8B4FE', color: '#000' } : null,
      roaster ? { text: roaster.toUpperCase(), bg: '#D4FF00', color: '#000' } : null
    ].filter(Boolean);

    let curTagX = paddingX;
    tags.forEach(t => {
      ctx.font = '900 9px "Space Grotesk", sans-serif';
      const tw = ctx.measureText(t.text).width + 16;
      if (curTagX + tw < paddingX + availW) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(curTagX + 2, tagY + 2, tw, 20);
        ctx.fillStyle = t.bg;
        ctx.fillRect(curTagX, tagY, tw, 20);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.8;
        ctx.strokeRect(curTagX, tagY, tw, 20);

        ctx.fillStyle = t.color;
        ctx.fillText(t.text, curTagX + 8, tagY + 14);
        curTagX += tw + 8;
      }
    });

    // 4. Ticket Notches & Perforation Line (Well separated from tags above and strip below)
    const notchY = paddingY + 114;
    drawTicketNotchesAndPerforation(ctx, 0, baseW, notchY, style, '#FFFDF8');

    // -----------------------------------------------------------------------
    // MODE A: SOLO GRANO (TERROIR & CUPPING SHOWCASE)
    // -----------------------------------------------------------------------
    if (!incRecipe) {
      // 1. Roastery Spec Strip
      const stripY = paddingY + 138;
      const stripH = 38;

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
        { lbl: 'VARIEDAD BOTÁNICA', val: (variety || 'Variedad botánica').toUpperCase(), sub: 'VARIEDAD COFFEA', bg: '#FF3B14', col: '#000' },
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

      const hasRadar = sensoryData !== null;
      const contentW = hasRadar ? availW - 146 : availW - 28;

      // Authentic sensory presentation: Render prominent flavor stickers if tags exist, otherwise clean text
      if (flavorTags.length > 0) {
        let pillX = paddingX + 14;
        let pillY = specY + 44;
        const pillColors = ['#D4FF00', '#FF3B14', '#D8B4FE', '#67E8F9', '#FED7AA'];

        flavorTags.slice(0, 6).forEach((tag, idx) => {
          const bgCol = pillColors[idx % pillColors.length];
          ctx.font = '900 10px "Space Grotesk", sans-serif';
          const scaIcon = getScaWheelIcon(tag);
          const tagLabel = `${scaIcon} ${tag.toUpperCase()}`;
          const pw = ctx.measureText(tagLabel).width + 18;

          // Wrap to next row if needed
          if (pillX + pw > paddingX + contentW && pillX > paddingX + 14) {
            pillX = paddingX + 14;
            pillY += 32;
          }

          if (pillX + pw <= paddingX + contentW && pillY + 24 <= specY + specH - 12) {
            ctx.fillStyle = '#000000';
            ctx.fillRect(pillX + 2, pillY + 2, pw, 24);
            ctx.fillStyle = bgCol;
            ctx.fillRect(pillX, pillY, pw, 24);
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1.8;
            ctx.strokeRect(pillX, pillY, pw, 24);

            ctx.fillStyle = bgCol === '#FF3B14' ? '#FFFFFF' : '#000000';
            ctx.fillText(tagLabel, pillX + 9, pillY + 16);

            pillX += pw + 8;
          }
        });
      } else {
        ctx.fillStyle = '#18181B';
        ctx.font = '700 11px "Space Grotesk", sans-serif';
        const actualNotes = notesStr ? `"${notesStr}"` : 'Sin notas de cata registradas para este lote.';
        drawWrappedText(actualNotes, paddingX + 14, specY + 44, contentW, 18, 3);
      }

      if (hasRadar) {
        drawSensoryRadarChart(ctx, paddingX + availW - 70, specY + 75, 36, sensoryData, style);
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
      const stripY = paddingY + 138;
      const stripH = 38;

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

      const hasRadar = sensoryData !== null;
      const contentW = hasRadar ? availW - 116 : availW - 12;

      let pillX = paddingX + 12;
      const pillY = notesY + 34;
      const pillColors = ['#D4FF00', '#FF3B14', '#D8B4FE', '#67E8F9', '#FED7AA'];

      if (flavorTags.length > 0) {
        flavorTags.slice(0, 5).forEach((tag, idx) => {
          const bgCol = pillColors[idx % pillColors.length];
          ctx.font = '900 9.5px "Space Grotesk", sans-serif';
          const pw = ctx.measureText(tag.toUpperCase()).width + 16;

          if (pillX + pw < paddingX + contentW) {
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
        if (notesStr) {
          drawTruncatedText(`"${notesStr}..."`, pillX, pillY + 16, hasRadar ? contentW - 12 : availW - 24);
        } else {
          ctx.fillText('Sin notas de cata adicionales especificadas', pillX, pillY + 16);
        }
      }

      if (hasRadar) {
        drawSensoryRadarChart(ctx, paddingX + availW - 55, notesY + 40, 24, sensoryData, style);
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
            title: (p.label || p.title || `VERTIDO 0${i + 1}`).toUpperCase(),
            desc: `${p.total_water_g || p.water_g || p.weight ? (p.total_water_g || p.water_g || p.weight) + 'g' : ''}${p.time ? ' • ' + p.time : ''}`.trim() || 'Vertido'
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

      // 5. Extraction Timeline
      const timelineY = flowY + flowH + 16;
      drawExtractionTimeline(ctx, paddingX, timelineY, availW, 36, rec, style);
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
  // =========================================================================
  // 3. STYLE: 1950s AMERICANA DINER (RETRO 50s / CHERRY RED & CREAM)
  // =========================================================================
  else if (style === 'diner' || style === 'aurora') {
    // Warm Retro Diner Cream Base
    ctx.fillStyle = '#FFFDF5';
    ctx.fillRect(0, 0, baseW, baseH);

    // Double Retro Frame Border (Outer Cherry Red + Inner Petrol Teal)
    const bx = paddingX - 8;
    const by = paddingY - 8;
    const bw = availW + 16;
    const bh = baseH - (paddingY * 2) + 16;

    ctx.strokeStyle = '#C92A2A';
    ctx.lineWidth = 2.4;
    drawRoundedRect(ctx, bx, by, bw, bh, 8, false, true);

    ctx.strokeStyle = '#0E7490';
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, bx + 5, by + 5, bw - 10, bh - 10, 5, false, true);

    // Atomic 4-point starburst accents at 4 inner corners
    drawDinerAtomicStar(ctx, bx + 15, by + 15, 6, '#C92A2A');
    drawDinerAtomicStar(ctx, bx + bw - 15, by + 15, 6, '#C92A2A');
    drawDinerAtomicStar(ctx, bx + 15, by + bh - 15, 6, '#C92A2A');
    drawDinerAtomicStar(ctx, bx + bw - 15, by + bh - 15, 6, '#C92A2A');

    // 1. Header Spec
    ctx.fillStyle = '#C92A2A';
    ctx.font = '800 8.5px "Space Grotesk", sans-serif';
    ctx.fillText(incRecipe ? '★ BEANTAG COFFEE ROASTERS // ORDER TICKET // EST. 1950 ★' : '★ BEANTAG COFFEE ROASTERS // CELLAR RESERVE // EST. 1950 ★', paddingX, paddingY + 14);

    ctx.fillStyle = '#1C1917';
    drawFittedText(coffeeName.toUpperCase(), paddingX, paddingY + 42, availW, 26, '"Space Grotesk", sans-serif', '900');

    ctx.fillStyle = '#0E7490';
    ctx.font = '700 9.5px "Space Grotesk", sans-serif';
    drawTruncatedText((subtitleStr || 'Café de Especialidad').toUpperCase(), paddingX, paddingY + 62, availW);

    drawTicketNotchesAndPerforation(ctx, pad, cardW, paddingY + 84, style, '#FFFDF5');

    // -----------------------------------------------------------------------
    // MODE A: SOLO GRANO (TERROIR & CUPPING SHOWCASE)
    // -----------------------------------------------------------------------
    if (!incRecipe) {
      // 1. Table Specification Banner
      const specBoxY = paddingY + 104;
      const specBoxH = 34;

      ctx.fillStyle = '#FFFBEB';
      ctx.strokeStyle = '#C92A2A';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, paddingX, specBoxY, availW, specBoxH, 6, true, true);

      ctx.fillStyle = '#C92A2A';
      ctx.font = '900 9px "Space Grotesk", sans-serif';
      ctx.fillText('TABLE NO. 1 — SPECIALTY BATCH SPECIFICATIONS', paddingX + 12, specBoxY + 21);

      if (scaScore !== null) {
        ctx.fillStyle = '#0E7490';
        ctx.font = '900 9.5px "Space Grotesk", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`★ SCA SCORE: ${scaScore} PTS`, paddingX + availW - 12, specBoxY + 21);
        ctx.textAlign = 'left';
      } else if (roastLevel) {
        ctx.fillStyle = '#0E7490';
        ctx.font = '800 9px "Space Grotesk", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`ROAST: ${roastLevel.toUpperCase()}`, paddingX + availW - 12, specBoxY + 21);
        ctx.textAlign = 'left';
      }

      // 2. 4 Terroir Matrix Tiles (2x2)
      const matY = specBoxY + specBoxH + 10;
      const matGap = 8;
      const colW = (availW - matGap) / 2;
      const colH = 86;

      const terroirItems = [
        { lbl: 'ORIGIN & FARM', val: (origin || 'Single Origin').toUpperCase(), sub: producer ? `Farm: ${producer}` : (roaster ? `Roaster: ${roaster}` : 'Direct Trade') },
        { lbl: 'ELEVATION & TERROIR', val: altitude || 'High Altitude', sub: altitude ? 'Meters Above Sea Level' : 'Volcanic Terroir' },
        { lbl: 'BOTANICAL VARIETY', val: (variety || 'Arabica Lot').toUpperCase(), sub: '100% Coffea Arabica' },
        { lbl: 'PROCESS & HARVEST', val: (process || 'Handpicked').toUpperCase(), sub: roastDate ? `Roasted: ${roastDate}` : 'Artisanal Milling' }
      ];

      terroirItems.forEach((t, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const tx = paddingX + col * (colW + matGap);
        const ty = matY + row * (colH + matGap);

        ctx.fillStyle = '#FFFDF5';
        ctx.strokeStyle = '#E5E7EB';
        ctx.lineWidth = 1;
        drawRoundedRect(ctx, tx, ty, colW, colH, 6, true, true);

        // Cherry red top accent border on each tile
        ctx.fillStyle = '#C92A2A';
        ctx.fillRect(tx + 4, ty + 1, colW - 8, 2.5);

        ctx.fillStyle = '#0E7490';
        ctx.font = '800 8.5px "Space Grotesk", sans-serif';
        ctx.fillText(t.lbl, tx + 12, ty + 18);

        ctx.fillStyle = '#1C1917';
        ctx.font = '900 13.5px "Space Grotesk", sans-serif';
        drawTruncatedText(t.val, tx + 12, ty + 46, colW - 24);

        ctx.fillStyle = '#78716C';
        ctx.font = '600 8.5px "Space Grotesk", sans-serif';
        drawTruncatedText(t.sub, tx + 12, ty + 68, colW - 24);
      });

      // 3. Sensory Cupping Box (Diner Order Pad style)
      const notesBoxY = matY + (colH * 2) + matGap + 10;
      const notesH = 150;

      ctx.fillStyle = '#FFFDF5';
      ctx.strokeStyle = '#C92A2A';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, paddingX, notesBoxY, availW, notesH, 6, true, true);

      ctx.fillStyle = '#C92A2A';
      ctx.font = '800 8.5px "Space Grotesk", sans-serif';
      ctx.fillText('★ SENSORY NOTES // TASTING DESCRIPTORS ★', paddingX + 14, notesBoxY + 20);

      const hasRadar = sensoryData !== null;
      const contentW = hasRadar ? availW - 146 : availW - 28;

      // Authentic tasting presentation: Render flavor pills if tags exist, otherwise clean text
      if (flavorTags.length > 0) {
        let pillX = paddingX + 14;
        let pillY = notesBoxY + 46;
        const pillH = 24;

        flavorTags.slice(0, 6).forEach(tag => {
          ctx.font = '800 9.5px "Space Grotesk", sans-serif';
          const scaIcon = getScaWheelIcon(tag);
          const tagLabel = `${scaIcon} ${tag}`;
          const tw = ctx.measureText(tagLabel).width;
          const pw = tw + 18;
          if (pillX + pw > paddingX + contentW && pillX > paddingX + 14) {
            pillX = paddingX + 14;
            pillY += 32;
          }
          if (pillX + pw <= paddingX + contentW && pillY + pillH <= notesBoxY + notesH - 10) {
            ctx.fillStyle = '#FEF3C7';
            ctx.strokeStyle = '#C92A2A';
            ctx.lineWidth = 1;
            drawRoundedRect(ctx, pillX, pillY, pw, pillH, 5, true, true);

            ctx.fillStyle = '#991B1B';
            ctx.fillText(tagLabel, pillX + 9, pillY + 16);
            pillX += pw + 8;
          }
        });
      } else {
        ctx.fillStyle = '#292524';
        ctx.font = '600 10.5px "Space Grotesk", sans-serif';
        const actualNotes = notesStr ? `"${notesStr}"` : 'Notas de cata tradicionales de café de especialidad.';
        drawWrappedText(actualNotes, paddingX + 14, notesBoxY + 46, contentW, 17, 3);
      }

      if (hasRadar) {
        drawSensoryRadarChart(ctx, paddingX + availW - 70, notesBoxY + 75, 36, sensoryData, style);
      }

      // 4. Vault Stock Bar
      const vaultY = notesBoxY + notesH + 12;
      const vaultH = 34;
      ctx.fillStyle = '#ECFEFF';
      ctx.strokeStyle = '#0E7490';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, paddingX, vaultY, availW, vaultH, 6, true, true);

      ctx.fillStyle = '#0E7490';
      ctx.font = '800 9.5px "Space Grotesk", sans-serif';
      const vaultText = remainingDoses !== null
        ? `❄️ CAVA BEANTAG: ${dosesStr} • CELLAR RESERVE • FRESH DOSES`
        : '☕ BEANTAG SPECIALTY ROASTERS // CELLAR SELECTION';
      ctx.fillText(vaultText, paddingX + 12, vaultY + 21);

      if (scaScore !== null) {
        ctx.fillStyle = '#C92A2A';
        ctx.textAlign = 'right';
        ctx.fillText(`SCA ${scaScore}★`, paddingX + availW - 12, vaultY + 21);
        ctx.textAlign = 'left';
      }

      // 5. Retro Diner Footer
      const footY = vaultY + vaultH + 12;
      ctx.fillStyle = '#78716C';
      ctx.font = '700 8.5px "Space Grotesk", sans-serif';
      ctx.fillText('ALL-DAY SPECIALTY COFFEE • SERVED FRESH DAILY • SATISFACTION GUARANTEED', paddingX, footY + 14);
    }

    // -----------------------------------------------------------------------
    // MODE B: CON RECETA (BARISTA EXTRACTION PROTOCOL)
    // -----------------------------------------------------------------------
    else {
      // 1. Order Ticket Spec Banner
      const specBoxY = paddingY + 104;
      const specBoxH = 34;

      ctx.fillStyle = '#FFFBEB';
      ctx.strokeStyle = '#C92A2A';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, paddingX, specBoxY, availW, specBoxH, 6, true, true);

      ctx.fillStyle = '#C92A2A';
      ctx.font = '900 9px "Space Grotesk", sans-serif';
      ctx.fillText('ORDER TICKET #50 — BARISTA EXTRACTION PROTOCOL', paddingX + 12, specBoxY + 21);

      if (scaScore !== null) {
        ctx.fillStyle = '#0E7490';
        ctx.font = '900 9.5px "Space Grotesk", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`SCA ${scaScore}★`, paddingX + availW - 12, specBoxY + 21);
        ctx.textAlign = 'left';
      }

      // 2. 4 Parameter Tiles (2x2) with Vector Accents
      const bentoY = specBoxY + specBoxH + 10;
      const bentoGap = 8;
      const colW = (availW - bentoGap) / 2;
      const colH = 92;

      const metrics = [
        { lbl: 'MÉTODO // EQUIPMENT', val: methodStr, sub: 'Extracción de especialidad' },
        { lbl: 'RATIO // PROPORTION', val: `1:${ratioStr.replace('1:', '')}`, sub: `${coffeeG}g IN ➔ ${waterG}g WATER` },
        { lbl: 'MOLIENDA // CLICS', val: grindStr, sub: microns ? `~${microns} µm` : 'Molienda ajustada' },
        { lbl: 'TIEMPO & TEMPERATURA', val: timeStr ? `${timeStr} MIN` : 'TIEMPO LIBRE', sub: tempStr ? `${tempStr} • TEMPERATURA` : 'Agua a punto' }
      ];

      metrics.forEach((m, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const mx = paddingX + col * (colW + bentoGap);
        const my = bentoY + row * (colH + bentoGap);

        ctx.fillStyle = '#FFFDF5';
        ctx.strokeStyle = '#E5E7EB';
        ctx.lineWidth = 1;
        drawRoundedRect(ctx, mx, my, colW, colH, 6, true, true);

        // Cherry red top accent
        ctx.fillStyle = '#C92A2A';
        ctx.fillRect(mx + 4, my + 1, colW - 8, 2.5);

        ctx.fillStyle = '#0E7490';
        ctx.font = '800 8.5px "Space Grotesk", sans-serif';
        ctx.fillText(m.lbl, mx + 12, my + 20);

        ctx.fillStyle = '#1C1917';
        ctx.font = '900 17px "Space Grotesk", sans-serif';
        drawTruncatedText(m.val, mx + 12, my + 50, colW - 24);

        ctx.fillStyle = '#78716C';
        ctx.font = '600 8.5px "Space Grotesk", sans-serif';
        drawTruncatedText(m.sub, mx + 12, my + 72, colW - 24);
      });

      // 3. Diner Extraction Gauge Bar
      const gaugeY = bentoY + (colH * 2) + bentoGap + 10;
      const gaugeH = 54;

      ctx.fillStyle = '#FFFDF5';
      ctx.strokeStyle = '#C92A2A';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, paddingX, gaugeY, availW, gaugeH, 6, true, true);

      ctx.fillStyle = '#C92A2A';
      ctx.font = '800 8.5px "Space Grotesk", sans-serif';
      ctx.fillText('★ CALIBRATION GAUGE // EXTRACTION BALANCE ★', paddingX + 14, gaugeY + 18);

      const barX = paddingX + 14;
      const barY = gaugeY + 28;
      const barW = availW - 28;
      ctx.fillStyle = '#E5E7EB';
      drawRoundedRect(ctx, barX, barY, barW, 9, 4, true, false);

      const fillGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
      fillGrad.addColorStop(0, '#C92A2A');
      fillGrad.addColorStop(0.5, '#D97706');
      fillGrad.addColorStop(1, '#0E7490');
      ctx.fillStyle = fillGrad;
      drawRoundedRect(ctx, barX, barY, barW * 0.88, 9, 4, true, false);

      // 4. Flavor Notes Pills
      const notesY = gaugeY + gaugeH + 10;
      const notesH = 80;

      ctx.fillStyle = '#FFFDF5';
      ctx.strokeStyle = '#E5E7EB';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, paddingX, notesY, availW, notesH, 6, true, true);

      ctx.fillStyle = '#0E7490';
      ctx.font = '800 8.5px "Space Grotesk", sans-serif';
      ctx.fillText('CUPPING TASTE NOTES // PERFIL SENSORIAL:', paddingX + 14, notesY + 18);

      const hasRadar = sensoryData !== null;
      const contentW = hasRadar ? availW - 116 : availW - 14;

      let pillX = paddingX + 14;
      const pillY = notesY + 32;

      if (flavorTags.length > 0) {
        flavorTags.slice(0, 5).forEach(tag => {
          ctx.font = '800 9.5px "Space Grotesk", sans-serif';
          const tw = ctx.measureText(tag).width;
          const pw = tw + 18;
          if (pillX + pw <= paddingX + contentW) {
            ctx.fillStyle = '#FEF3C7';
            ctx.strokeStyle = '#C92A2A';
            ctx.lineWidth = 1;
            drawRoundedRect(ctx, pillX, pillY, pw, 24, 5, true, true);

            ctx.fillStyle = '#991B1B';
            ctx.fillText(tag, pillX + 9, pillY + 16);
            pillX += pw + 8;
          }
        });
      } else {
        ctx.fillStyle = '#78716C';
        ctx.font = '600 9.5px "Space Grotesk", sans-serif';
        if (notesStr) {
          drawTruncatedText(`"${notesStr}..."`, pillX, pillY + 16, hasRadar ? contentW - 12 : availW - 24);
        } else {
          ctx.fillText('Sin notas sensoriales adicionales registradas', pillX, pillY + 16);
        }
      }

      if (hasRadar) {
        drawSensoryRadarChart(ctx, paddingX + availW - 55, notesY + 40, 24, sensoryData, style);
      }

      // 5. Stock & Vault bar
      const vaultY = notesY + notesH + 10;
      const vaultH = 34;
      ctx.fillStyle = '#ECFEFF';
      ctx.strokeStyle = '#0E7490';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, paddingX, vaultY, availW, vaultH, 6, true, true);

      ctx.fillStyle = '#0E7490';
      ctx.font = '800 9.5px "Space Grotesk", sans-serif';
      const vaultText = remainingDoses !== null
        ? `❄️ CAVA BEANTAG: ${dosesStr} • DOSIS DISPONIBLES EN CAVA`
        : '☕ BEANTAG SPECIALTY ROASTERS // EXTRACTION SPEC';
      ctx.fillText(vaultText, paddingX + 12, vaultY + 21);

      // 6. Extraction Timeline
      const timelineY = vaultY + vaultH + 14;
      drawExtractionTimeline(ctx, paddingX, timelineY, availW, 36, rec, style);

      // Footer
      const footY = timelineY + 36 + 14;
      ctx.fillStyle = '#78716C';
      ctx.font = '700 8.5px "Space Grotesk", sans-serif';
      ctx.fillText('ALL-DAY SPECIALTY COFFEE • SERVED FRESH DAILY • SATISFACTION GUARANTEED', paddingX, footY + 14);
    }
  }

  // =========================================================================
  // 4. STYLE: TOKYO KISSATEN 1960 (MINIMALIST CRAFT WASHI & HANKO SEAL)
  // =========================================================================
  else if (style === 'kissaten' || style === 'hangtag') {
    // Japanese Craft Washi Ivory Canvas
    ctx.fillStyle = '#F7F5F0';
    ctx.fillRect(0, 0, baseW, baseH);

    // Sumi Hairline Border
    const bx = paddingX - 8;
    const by = paddingY - 8;
    const bw = availW + 16;
    const bh = baseH - (paddingY * 2) + 16;

    ctx.strokeStyle = '#E4E4E7';
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, bx, by, bw, bh, 6, false, true);

    // 1. Authentic Vermilion Hanko Seal in Header (豆札)
    drawHankoSeal(ctx, baseW - paddingX - 16, paddingY + 28, 30, '豆札');

    // Micro-Header
    ctx.fillStyle = '#52525B';
    ctx.font = '700 8.5px "Playfair Display", Georgia, serif';
    ctx.fillText('東京 喫茶店 // TOKYO CRAFT COFFEE ARCHIVE // 1960', paddingX, paddingY + 16);

    // Main Serif Title
    ctx.fillStyle = '#18181B';
    drawFittedText(coffeeName, paddingX, paddingY + 42, availW - 48, 26, '"Playfair Display", Georgia, serif', 'bold');

    // Terroir Subtitle
    ctx.fillStyle = '#52525B';
    ctx.font = 'italic 10.5px "Playfair Display", Georgia, serif';
    const terroirSub = [origin, (producer || roaster), altitude].filter(Boolean).join(' — ');
    drawTruncatedText(terroirSub || '珈琲豆 • Specialty Coffee', paddingX, paddingY + 62, availW - 48);

    drawTicketNotchesAndPerforation(ctx, pad, cardW, paddingY + 84, style, '#F7F5F0');

    // -----------------------------------------------------------------------
    // MODE A: SOLO GRANO (TERROIR & CUPPING SHOWCASE)
    // -----------------------------------------------------------------------
    if (!incRecipe) {
      // 1. Specification Header Strip
      const stripY = paddingY + 104;
      const stripH = 34;

      ctx.fillStyle = '#FBF9F5';
      ctx.strokeStyle = '#E4E4E7';
      ctx.lineWidth = 0.8;
      drawRoundedRect(ctx, paddingX, stripY, availW, stripH, 4, true, true);

      ctx.fillStyle = '#18181B';
      ctx.font = 'bold 9px "Playfair Display", Georgia, serif';
      ctx.fillText('本日の珈琲 // SINGLE ORIGIN CRAFT ARCHIVE', paddingX + 12, stripY + 21);

      if (scaScore !== null) {
        ctx.fillStyle = '#DC2626';
        ctx.font = 'bold 9.5px "Playfair Display", Georgia, serif';
        ctx.textAlign = 'right';
        ctx.fillText(`★ SCA ${scaScore}`, paddingX + availW - 12, stripY + 21);
        ctx.textAlign = 'left';
      }

      // 2. Terroir Ledger Rows / Tiles (2x2)
      const matY = stripY + stripH + 10;
      const matGap = 8;
      const colW = (availW - matGap) / 2;
      const colH = 86;

      const terroirItems = [
        { lbl: '産地 & 農園 // ORIGEN', val: origin || 'Single Origin', sub: producer || roaster || 'Origen Artesanal' },
        { lbl: '標高 // ALTITUD', val: altitude || 'Terroir Volcánico', sub: altitude ? 'Metros sobre el nivel del mar' : 'Cultivo de Altura' },
        { lbl: '品種 // VARIEDAD', val: variety || 'Coffea Arabica', sub: 'Variedad Botánica' },
        { lbl: '精製方法 // PROCESO', val: process || 'Lavado Artesanal', sub: roastDate ? `Tostado: ${roastDate}` : 'Cosecha Manual' }
      ];

      terroirItems.forEach((t, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const mx = paddingX + col * (colW + matGap);
        const my = matY + row * (colH + matGap);

        ctx.fillStyle = '#FBF9F5';
        ctx.strokeStyle = '#E4E4E7';
        ctx.lineWidth = 0.8;
        drawRoundedRect(ctx, mx, my, colW, colH, 4, true, true);

        // Vermilion subtle accent dot
        ctx.fillStyle = '#DC2626';
        ctx.beginPath();
        ctx.arc(mx + 10, my + 17, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#52525B';
        ctx.font = 'bold 8px "Playfair Display", Georgia, serif';
        ctx.fillText(t.lbl, mx + 18, my + 20);

        ctx.fillStyle = '#18181B';
        ctx.font = 'bold 13.5px "Playfair Display", Georgia, serif';
        drawTruncatedText(t.val, mx + 12, my + 48, colW - 24);

        ctx.fillStyle = '#71717A';
        ctx.font = 'italic 8.5px "Playfair Display", Georgia, serif';
        drawTruncatedText(t.sub, mx + 12, my + 70, colW - 24);
      });

      // 3. Sensory Notes & Cupping Profile Ledger
      const notesBoxY = matY + (colH * 2) + matGap + 10;
      const notesH = 150;

      ctx.fillStyle = '#FBF9F5';
      ctx.strokeStyle = '#E4E4E7';
      ctx.lineWidth = 0.8;
      drawRoundedRect(ctx, paddingX, notesBoxY, availW, notesH, 4, true, true);

      ctx.fillStyle = '#18181B';
      ctx.font = 'bold 8.5px "Playfair Display", Georgia, serif';
      ctx.fillText('風味特性 // SENSORY NOTES // PERFIL EN TAZA', paddingX + 14, notesBoxY + 20);

      const hasRadar = sensoryData !== null;
      const contentW = hasRadar ? availW - 146 : availW - 28;

      // Flavor pills in natural rice paper aesthetic (or clean text if no tags)
      if (flavorTags.length > 0) {
        let pillX = paddingX + 14;
        let pillY = notesBoxY + 46;
        const pillH = 24;

        flavorTags.slice(0, 6).forEach(tag => {
          ctx.font = 'bold 9.5px "Playfair Display", Georgia, serif';
          const scaIcon = getScaWheelIcon(tag);
          const tagLabel = `${scaIcon} ${tag}`;
          const textW = ctx.measureText(tagLabel).width;
          const pillW = textW + 18;
          if (pillX + pillW > paddingX + contentW && pillX > paddingX + 14) {
            pillX = paddingX + 14;
            pillY += 32;
          }
          if (pillX + pillW <= paddingX + contentW && pillY + pillH <= notesBoxY + notesH - 10) {
            ctx.fillStyle = 'rgba(24, 24, 27, 0.04)';
            ctx.strokeStyle = '#D4D4D8';
            ctx.lineWidth = 0.8;
            drawRoundedRect(ctx, pillX, pillY, pillW, pillH, 4, true, true);

            ctx.fillStyle = '#18181B';
            ctx.fillText(tagLabel, pillX + 9, pillY + 16);
            pillX += pillW + 8;
          }
        });
      } else {
        ctx.fillStyle = '#27272A';
        ctx.font = 'italic 10.5px "Playfair Display", Georgia, serif';
        const actualNotes = notesStr ? `« ${notesStr} »` : 'Café de especialidad con notas sutiles y balance limpio.';
        drawWrappedText(actualNotes, paddingX + 14, notesBoxY + 46, contentW, 17, 3);
      }

      if (hasRadar) {
        drawSensoryRadarChart(ctx, paddingX + availW - 70, notesBoxY + 75, 36, sensoryData, style);
      }

      // 4. Vault Stock Bar
      const vaultY = notesBoxY + notesH + 12;
      const vaultH = 34;
      ctx.fillStyle = '#F2EFE7';
      ctx.strokeStyle = '#E4E4E7';
      ctx.lineWidth = 0.8;
      drawRoundedRect(ctx, paddingX, vaultY, availW, vaultH, 4, true, true);

      ctx.fillStyle = '#18181B';
      ctx.font = 'bold 9.5px "Playfair Display", Georgia, serif';
      const vaultText = remainingDoses !== null
        ? `❄️ CAVA BEANTAG: ${dosesStr} • 自家焙煎 珈琲 • 保管管理`
        : '☕ 純喫茶 自家焙煎 // BEANTAG CRAFT ARCHIVE';
      ctx.fillText(vaultText, paddingX + 12, vaultY + 21);

      if (scaScore !== null) {
        ctx.fillStyle = '#DC2626';
        ctx.textAlign = 'right';
        ctx.fillText(`SCA ${scaScore}★`, paddingX + availW - 12, vaultY + 21);
        ctx.textAlign = 'left';
      }

      // 5. Tokyo Kissaten Footer
      const footY = vaultY + vaultH + 12;
      drawHankoSeal(ctx, baseW - paddingX - 16, footY + 14, 18, '珈琲');
      ctx.fillStyle = '#52525B';
      ctx.font = '600 8.5px "Playfair Display", Georgia, serif';
      ctx.fillText(`純喫茶 自家焙煎 • BEANTAG ARCHIVE // TOKYO 1960`, paddingX, footY + 16);
    }

    // -----------------------------------------------------------------------
    // MODE B: CON RECETA (BARISTA EXTRACTION PROTOCOL)
    // -----------------------------------------------------------------------
    else {
      // 1. Extraction Protocol Header Strip
      const stripY = paddingY + 104;
      const stripH = 34;

      ctx.fillStyle = '#FBF9F5';
      ctx.strokeStyle = '#E4E4E7';
      ctx.lineWidth = 0.8;
      drawRoundedRect(ctx, paddingX, stripY, availW, stripH, 4, true, true);

      ctx.fillStyle = '#18181B';
      ctx.font = 'bold 9px "Playfair Display", Georgia, serif';
      ctx.fillText('抽出手帳 // BREW EXTRACTION PROTOCOL', paddingX + 12, stripY + 21);

      if (scaScore !== null) {
        ctx.fillStyle = '#DC2626';
        ctx.font = 'bold 9.5px "Playfair Display", Georgia, serif';
        ctx.textAlign = 'right';
        ctx.fillText(`★ SCA ${scaScore}`, paddingX + availW - 12, stripY + 21);
        ctx.textAlign = 'left';
      }

      // 2. 4 Precision Tiles (2x2) with Vector Accents
      const bentoY = stripY + stripH + 10;
      const bentoGap = 8;
      const colW = (availW - bentoGap) / 2;
      const colH = 92;

      const metrics = [
        { lbl: '抽出器具 // MÉTODO', val: methodStr, sub: 'Extracción artesanal' },
        { lbl: '比率 // RATIO', val: `1:${ratioStr.replace('1:', '')}`, sub: `${coffeeG}g ➔ ${waterG}g agua` },
        { lbl: '粒度 // MOLIENDA', val: grindStr, sub: microns ? `~${microns} µm` : 'Calibrado' },
        { lbl: '時間・温度 // TIEMPO & TEMP', val: timeStr ? `${timeStr} MIN` : 'TIEMPO LIBRE', sub: tempStr ? `${tempStr} • Extracción` : 'Agua a punto' }
      ];

      metrics.forEach((m, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const mx = paddingX + col * (colW + bentoGap);
        const my = bentoY + row * (colH + bentoGap);

        ctx.fillStyle = '#FBF9F5';
        ctx.strokeStyle = '#E4E4E7';
        ctx.lineWidth = 0.8;
        drawRoundedRect(ctx, mx, my, colW, colH, 4, true, true);

        // Vermilion accent dot
        ctx.fillStyle = '#DC2626';
        ctx.beginPath();
        ctx.arc(mx + 10, my + 17, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#52525B';
        ctx.font = 'bold 8px "Playfair Display", Georgia, serif';
        ctx.fillText(m.lbl, mx + 18, my + 20);

        ctx.fillStyle = '#18181B';
        ctx.font = 'bold 16px "Playfair Display", Georgia, serif';
        drawTruncatedText(m.val, mx + 12, my + 48, colW - 24);

        ctx.fillStyle = '#71717A';
        ctx.font = 'italic 8.5px "Playfair Display", Georgia, serif';
        drawTruncatedText(m.sub, mx + 12, my + 70, colW - 24);
      });

      // 3. Extraction Timeline / Curve Bar
      const flowY = bentoY + (colH * 2) + bentoGap + 10;
      const flowH = 62;

      ctx.fillStyle = '#FBF9F5';
      ctx.strokeStyle = '#E4E4E7';
      ctx.lineWidth = 0.8;
      drawRoundedRect(ctx, paddingX, flowY, availW, flowH, 4, true, true);

      ctx.fillStyle = '#71717A';
      ctx.font = '700 8px "Playfair Display", Georgia, serif';
      ctx.fillText('注湯工程 // POUR TIMELINE & PROFILE:', paddingX + 12, flowY + 18);

      const stepW = (availW - 24 - 16) / 3;
      const steps = (rec.pours && Array.isArray(rec.pours) && rec.pours.length > 0)
        ? rec.pours.slice(0, 3).map((p, i) => ({
            title: p.label || p.title || `注ぎ 0${i + 1}`,
            desc: `${p.total_water_g || p.water_g || p.weight ? (p.total_water_g || p.water_g || p.weight) + 'g' : ''}${p.time ? ' • ' + p.time : ''}`.trim() || 'Régulier'
          }))
        : [
            { title: '珈琲粉', desc: `${coffeeG}g molienda` },
            { title: '注湯量', desc: `${waterG}g agua total` },
            { title: '比率', desc: `1:${ratioStr.replace('1:', '')}` }
          ];

      steps.forEach((s, idx) => {
        const sx = paddingX + 12 + idx * (stepW + 8);
        const sy = flowY + 26;
        ctx.fillStyle = '#FAF8F5';
        ctx.fillRect(sx, sy, stepW, 28);
        ctx.strokeStyle = '#E4E4E7';
        ctx.lineWidth = 0.8;
        ctx.strokeRect(sx, sy, stepW, 28);

        ctx.fillStyle = '#18181B';
        ctx.font = 'bold 8.5px "Playfair Display", Georgia, serif';
        ctx.fillText(s.title, sx + 6, sy + 12);
        ctx.fillStyle = '#71717A';
        ctx.font = 'italic 8px "Playfair Display", Georgia, serif';
        ctx.fillText(s.desc, sx + 6, sy + 22);
      });

      // 4. Sensory Notes Pills Section
      const notesBoxY = flowY + flowH + 10;
      const notesH = 80;
      ctx.fillStyle = '#FBF9F5';
      ctx.strokeStyle = '#E4E4E7';
      ctx.lineWidth = 0.8;
      drawRoundedRect(ctx, paddingX, notesBoxY, availW, notesH, 4, true, true);

      ctx.fillStyle = '#18181B';
      ctx.font = 'bold 8.5px "Playfair Display", Georgia, serif';
      ctx.fillText('風味特性 // SENSORY NOTES // PERFIL EN TAZA', paddingX + 12, notesBoxY + 18);

      const hasRadar = sensoryData !== null;
      const contentW = hasRadar ? availW - 116 : availW - 12;

      const sensoryPillY = notesBoxY + 30;
      let pillX = paddingX + 12;
      const pillH = 24;

      if (flavorTags.length > 0) {
        flavorTags.slice(0, 5).forEach(tag => {
          ctx.font = 'bold 9.5px "Playfair Display", Georgia, serif';
          const textW = ctx.measureText(tag).width;
          const pillW = textW + 18;
          if (pillX + pillW <= paddingX + contentW) {
            ctx.fillStyle = 'rgba(24, 24, 27, 0.04)';
            ctx.strokeStyle = '#D4D4D8';
            ctx.lineWidth = 0.8;
            drawRoundedRect(ctx, pillX, sensoryPillY, pillW, pillH, 3, true, true);

            ctx.fillStyle = '#18181B';
            ctx.fillText(tag, pillX + 9, sensoryPillY + 16);
            pillX += pillW + 8;
          }
        });
      } else {
        ctx.fillStyle = '#71717A';
        ctx.font = 'italic 9px "Playfair Display", Georgia, serif';
        if (notesStr) {
          drawTruncatedText(`« ${notesStr}... »`, pillX, sensoryPillY + 16, hasRadar ? contentW - 12 : availW - 24);
        } else {
          ctx.fillText('Sin notas sensoriales adicionales especificadas', pillX, sensoryPillY + 16);
        }
      }

      if (hasRadar) {
        drawSensoryRadarChart(ctx, paddingX + availW - 55, notesBoxY + 40, 24, sensoryData, style);
      }

      // 5. Stock & Cellar Bar
      const cellarY = notesBoxY + notesH + 10;
      const cellarH = 34;
      ctx.fillStyle = '#F2EFE7';
      ctx.strokeStyle = '#E4E4E7';
      ctx.lineWidth = 0.8;
      drawRoundedRect(ctx, paddingX, cellarY, availW, cellarH, 4, true, true);

      ctx.fillStyle = '#18181B';
      ctx.font = 'bold 9.5px "Playfair Display", Georgia, serif';
      const cellarText = remainingDoses !== null
        ? `❄️ CAVA BEANTAG: ${dosesStr} • 保管管理 // FRESH`
        : '☕ 純喫茶 自家焙煎 // EXTRACTION SPEC';
      ctx.fillText(cellarText, paddingX + 12, cellarY + 21);

      // 6. Extraction Timeline
      const timelineY = cellarY + cellarH + 14;
      drawExtractionTimeline(ctx, paddingX, timelineY, availW, 36, rec, style);

      // 7. Tokyo Kissaten Footer
      const footY = timelineY + 36 + 14;
      drawHankoSeal(ctx, baseW - paddingX - 16, footY + 12, 18, '珈琲');
      ctx.fillStyle = '#71717A';
      ctx.font = '600 8.5px "Playfair Display", Georgia, serif';
      ctx.fillText(`純喫茶 自家焙煎 • BEANTAG ARCHIVE // TOKYO 1960`, paddingX, footY + 16);
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
      const rawNotes = cleanNotesString(b.flavor_notes || b.roaster_notes || b.notes || b.batch_roaster_notes || '');
      const parsedTags = extractFlavorTags(rawNotes).slice(0, 4);

      if (parsedTags.length > 0) {
        let pillX = paddingX + 46;
        const pillY = curY + 64;
        const pillH = 18;

        ctx.font = '800 8.5px "JetBrains Mono", monospace';
        parsedTags.forEach(tag => {
          const scaIcon = getScaWheelIcon(tag);
          const tagLabel = `${scaIcon} ${tag}`;
          const tw = ctx.measureText(tagLabel).width;
          const pw = tw + 12;
          if (pillX + pw <= baseW - paddingX - 8) {
            ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
            ctx.lineWidth = 1;
            drawRoundedRect(ctx, pillX, pillY, pw, pillH, 4, true, true);
            ctx.fillStyle = '#E0F2FE';
            ctx.fillText(tagLabel, pillX + 6, pillY + 12.5);
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
      const rawNotes = cleanNotesString(b.flavor_notes || b.roaster_notes || b.notes || b.batch_roaster_notes || '');
      const parsedTags = extractFlavorTags(rawNotes).slice(0, 4);

      if (parsedTags.length > 0) {
        const pillColors = ['#D4FF00', '#FED7AA', '#E9D5FF', '#BAE6FD'];
        let pillX = paddingX + 46;
        const pillY = curY + 64;
        const pillH = 18;

        ctx.font = '900 8.5px "Space Grotesk", sans-serif';
        parsedTags.forEach((tag, tIdx) => {
          const scaIcon = getScaWheelIcon(tag);
          const tagLabel = `${scaIcon} ${tag.toUpperCase()}`;
          const tw = ctx.measureText(tagLabel).width;
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
            ctx.fillText(tagLabel, pillX + 6, pillY + 12.5);
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

  // 3. 1950s AMERICANA DINER MENU
  else if (style === 'diner' || style === 'aurora') {
    ctx.fillStyle = '#FFFDF5';
    ctx.fillRect(0, 0, baseW, baseH);

    // Double Retro Frame Border
    const bx = paddingX - 8;
    const by = paddingY - 8;
    const bw = availW + 16;
    const bh = baseH - (paddingY * 2) + 16;

    ctx.strokeStyle = '#C92A2A';
    ctx.lineWidth = 2.4;
    drawRoundedRect(ctx, bx, by, bw, bh, 8, false, true);

    ctx.strokeStyle = '#0E7490';
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, bx + 5, by + 5, bw - 10, bh - 10, 5, false, true);

    // Atomic 4-point stars at corners
    drawDinerAtomicStar(ctx, bx + 14, by + 14, 5, '#C92A2A');
    drawDinerAtomicStar(ctx, bx + bw - 14, by + 14, 5, '#C92A2A');
    drawDinerAtomicStar(ctx, bx + 14, by + bh - 14, 5, '#C92A2A');
    drawDinerAtomicStar(ctx, bx + bw - 14, by + bh - 14, 5, '#C92A2A');

    // Live status pill on right
    const pillW = 90;
    const pillH = 24;
    const pillX = baseW - paddingX - pillW;
    const pillY = paddingY + 24;
    ctx.fillStyle = '#ECFEFF';
    ctx.strokeStyle = '#0E7490';
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, pillX, pillY, pillW, pillH, 12, true, true);
    ctx.fillStyle = '#0E7490';
    ctx.font = '800 9px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('● LIVE CELLAR', pillX + pillW / 2, pillY + 15.5);
    ctx.textAlign = 'left';

    ctx.fillStyle = '#C92A2A';
    ctx.font = '800 8.5px "Space Grotesk", sans-serif';
    ctx.fillText('★ BEANTAG DINER & ROASTERY // ALL-DAY SPECIALTY // EST. 1950 ★', paddingX, paddingY + 18);

    ctx.fillStyle = '#1C1917';
    ctx.font = '900 19px "Space Grotesk", sans-serif';
    ctx.fillText('TODAY’S COFFEE SPECIALS', paddingX, paddingY + 44);

    let curY = paddingY + 84;
    displayList.forEach((b, idx) => {
      const cardH = itemH - 12;
      ctx.fillStyle = '#FFFDF5';
      ctx.strokeStyle = '#E5E7EB';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, paddingX, curY, availW, cardH, 6, true, true);

      // Top cherry accent
      ctx.fillStyle = '#C92A2A';
      ctx.fillRect(paddingX + 4, curY + 1, availW - 8, 2);

      // Retro index tile
      const idxStr = String(idx + 1).padStart(2, '0');
      ctx.fillStyle = '#C92A2A';
      drawRoundedRect(ctx, paddingX + 10, curY + 12, 28, 28, 6, true, false);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 11.5px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(idxStr, paddingX + 24, curY + 29.5);
      ctx.textAlign = 'left';

      // Line 1: Title & Stock Badge
      const rawName = stripEmojis(b.batch_name || b.name || b.coffee_name || 'Café');
      const name = rawName.length > 30 ? rawName.slice(0, 30) + '…' : rawName;

      ctx.fillStyle = '#1C1917';
      ctx.font = '900 13px "Space Grotesk", sans-serif';
      ctx.fillText(name.toUpperCase(), paddingX + 46, curY + 22);

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

      ctx.fillStyle = '#ECFEFF';
      ctx.strokeStyle = '#0E7490';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 11, true, true);

      ctx.fillStyle = '#0E7490';
      ctx.font = '800 9.5px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(doseBadgeText, badgeX + badgeW / 2, badgeY + 14.5);
      ctx.textAlign = 'left';

      // Line 2: Roaster, Origin & Altitude
      const roasterStr = stripEmojis(b.roaster || '');
      const originStr = stripEmojis(b.origin || '');
      const altStr = b.altitude ? `${stripEmojis(String(b.altitude))}${String(b.altitude).toLowerCase().includes('m') ? '' : 'm'}` : '';
      const line2Tokens = [roasterStr, originStr, altStr].filter(Boolean);
      const line2Text = line2Tokens.join(' • ');

      ctx.fillStyle = '#0E7490';
      ctx.font = '700 9.5px "Space Grotesk", sans-serif';
      ctx.fillText(line2Text || 'Origen Único', paddingX + 46, curY + 38);

      // Line 3: Variety, Process & SCA Score
      const varietyStr = stripEmojis(b.variety || '');
      const processStr = stripEmojis(b.process || '');
      const rawSca = b.sca_score;
      const validSca = rawSca && !isNaN(parseFloat(rawSca)) && parseFloat(rawSca) > 0 ? parseFloat(rawSca) : null;
      const scaStr = validSca ? `SCA ${validSca}★` : '';
      const line3Tokens = [varietyStr, processStr, scaStr].filter(Boolean);
      const line3Text = line3Tokens.join(' • ');

      if (line3Text) {
        ctx.fillStyle = '#78716C';
        ctx.font = '600 9px "Space Grotesk", sans-serif';
        ctx.fillText(line3Text, paddingX + 46, curY + 52);
      }

      // Line 4: Flavor Notes Pills
      const rawNotes = cleanNotesString(b.flavor_notes || b.roaster_notes || b.notes || b.batch_roaster_notes || '');
      const parsedTags = extractFlavorTags(rawNotes).slice(0, 4);

      if (parsedTags.length > 0) {
        let pillX = paddingX + 46;
        const pillY = curY + 64;
        const pillH = 18;

        ctx.font = '800 8.5px "Space Grotesk", sans-serif';
        parsedTags.forEach(tag => {
          const scaIcon = getScaWheelIcon(tag);
          const tagLabel = `${scaIcon} ${tag}`;
          const tw = ctx.measureText(tagLabel).width;
          const pw = tw + 14;
          if (pillX + pw <= baseW - paddingX - 8) {
            ctx.fillStyle = '#FEF3C7';
            ctx.strokeStyle = '#C92A2A';
            ctx.lineWidth = 1;
            drawRoundedRect(ctx, pillX, pillY, pw, pillH, 5, true, true);
            ctx.fillStyle = '#991B1B';
            ctx.fillText(tagLabel, pillX + 7, pillY + 12.5);
            pillX += pw + 6;
          }
        });
      }

      curY += itemH;
    });

    const footY = baseH - paddingY - 24;
    ctx.fillStyle = '#78716C';
    ctx.font = '700 8.5px "Space Grotesk", sans-serif';
    ctx.fillText(`BEANTAG ROASTERY // ALL-DAY FRESH COFFEE // ${displayList.length} LOTES DISPONIBLES`, paddingX, footY + 12);
  }

  // 4. TOKYO KISSATEN 1960 MENU
  else if (style === 'kissaten' || style === 'hangtag') {
    ctx.fillStyle = '#F7F5F0';
    ctx.fillRect(0, 0, baseW, baseH);

    // Sumi Hairline Border
    const bx = paddingX - 8;
    const by = paddingY - 8;
    const bw = availW + 16;
    const bh = baseH - (paddingY * 2) + 16;

    ctx.strokeStyle = '#E4E4E7';
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, bx, by, bw, bh, 6, false, true);

    // Authentic Hanko Seal in header (豆札)
    drawHankoSeal(ctx, baseW - paddingX - 16, paddingY + 28, 28, '豆札');

    ctx.fillStyle = '#71717A';
    ctx.font = '700 8.5px "Playfair Display", Georgia, serif';
    ctx.fillText('東京 喫茶店 // COFFEE SELECTION // 本日の珈琲', paddingX, paddingY + 18);

    ctx.fillStyle = '#18181B';
    ctx.font = 'bold 20px "Playfair Display", Georgia, serif';
    ctx.fillText('CRAFT COFFEE MENU // 珈琲品目', paddingX, paddingY + 46);

    let curY = paddingY + 84;
    displayList.forEach((b, idx) => {
      const cardH = itemH - 12;
      ctx.strokeStyle = '#E4E4E7';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(paddingX, curY + cardH);
      ctx.lineTo(baseW - paddingX, curY + cardH);
      ctx.stroke();

      // Minimalist sumi index indicator
      const idxStr = String(idx + 1).padStart(2, '0');
      ctx.fillStyle = '#FBF9F5';
      ctx.strokeStyle = '#E4E4E7';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, paddingX + 6, curY + 12, 28, 28, 4, true, true);

      // Vermilion accent dot
      ctx.fillStyle = '#DC2626';
      ctx.beginPath();
      ctx.arc(paddingX + 13, curY + 19, 1.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#18181B';
      ctx.font = 'bold 11px "Playfair Display", Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(idxStr, paddingX + 22, curY + 29);
      ctx.textAlign = 'left';

      // Line 1: Title & Stock Badge
      const rawName = stripEmojis(b.batch_name || b.name || b.coffee_name || 'Café');
      const name = rawName.length > 30 ? rawName.slice(0, 30) + '…' : rawName;

      ctx.fillStyle = '#18181B';
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

      ctx.fillStyle = '#F2EFE7';
      ctx.strokeStyle = '#E4E4E7';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 4, true, true);

      ctx.fillStyle = '#18181B';
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

      ctx.fillStyle = '#52525B';
      ctx.font = 'italic 9.5px "Playfair Display", Georgia, serif';
      ctx.fillText(line2Text || '産地直送 • Single Origin', paddingX + 44, curY + 38);

      // Line 3: Variety, Process & SCA Score
      const varietyStr = stripEmojis(b.variety || '');
      const processStr = stripEmojis(b.process || '');
      const rawSca = b.sca_score;
      const validSca = rawSca && !isNaN(parseFloat(rawSca)) && parseFloat(rawSca) > 0 ? parseFloat(rawSca) : null;
      const scaStr = validSca ? `SCA ${validSca}` : '';
      const line3Tokens = [varietyStr, processStr, scaStr].filter(Boolean);
      const line3Text = line3Tokens.join(' • ');

      if (line3Text) {
        ctx.fillStyle = '#71717A';
        ctx.font = 'bold 9px "Playfair Display", Georgia, serif';
        ctx.fillText(line3Text, paddingX + 44, curY + 52);
      }

      // Line 4: Flavor Notes Pills
      const rawNotes = cleanNotesString(b.flavor_notes || b.roaster_notes || b.notes || b.batch_roaster_notes || '');
      const parsedTags = extractFlavorTags(rawNotes).slice(0, 4);

      if (parsedTags.length > 0) {
        let pillX = paddingX + 44;
        const pillY = curY + 64;
        const pillH = 18;

        ctx.font = 'bold 8.5px "Playfair Display", Georgia, serif';
        parsedTags.forEach(tag => {
          const scaIcon = getScaWheelIcon(tag);
          const tagLabel = `${scaIcon} ${tag}`;
          const tw = ctx.measureText(tagLabel).width;
          const pw = tw + 12;
          if (pillX + pw <= baseW - paddingX - 8) {
            ctx.fillStyle = 'rgba(24, 24, 27, 0.04)';
            ctx.strokeStyle = '#D4D4D8';
            ctx.lineWidth = 0.8;
            drawRoundedRect(ctx, pillX, pillY, pw, pillH, 3, true, true);
            ctx.fillStyle = '#18181B';
            ctx.fillText(tagLabel, pillX + 6, pillY + 12.5);
            pillX += pw + 6;
          }
        });
      }

      curY += itemH;
    });

    const footY = baseH - paddingY - 24;
    drawHankoSeal(ctx, baseW - paddingX - 16, footY + 10, 16, '珈琲');
    ctx.fillStyle = '#71717A';
    ctx.font = '600 8.5px "Playfair Display", Georgia, serif';
    ctx.fillText(`純喫茶 自家焙煎 • BEANTAG ARCHIVE // TOKYO 1960`, paddingX, footY + 14);
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
    const rawNotes = cleanNotesString(b.flavor_notes || b.roaster_notes || b.notes || b.batch_roaster_notes || '');

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

/**
 * Generates an Ultra-High Legibility Instagram Story Sticker Overlay
 * Supports Horizontal (600 x 260 px) and Vertical (380 x 480 px) @ 2x Retina scale.
 * Designed for micro-interactions and camera overlays with macro typography, aesthetic flavor glyphs, and optional transparency.
 */
export async function generateCoffeeStickerImage(batchOrRecipe, options = {}) {
  // options: { template = 'blueprint', transparent = false, orientation = 'horizontal' }
  const isVertical = String(options.orientation || '').toLowerCase() === 'vertical';
  const baseW = isVertical ? 380 : 600;
  const baseH = isVertical ? 480 : 260;
  const scale = 2;

  const canvas = typeof document !== 'undefined'
    ? document.createElement('canvas')
    : globalThis.createMockCanvas?.(baseW * scale, baseH * scale);
  if (!canvas) throw new Error("Canvas not supported");
  canvas.width = baseW * scale;
  canvas.height = baseH * scale;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);
  await ensureFontsLoaded();

  const style = normalizeCardStyle(options.template);
  const transparent = Boolean(options.transparent);

  // 2. Data Extraction
  const item = batchOrRecipe || {};
  const coffeeName = stripEmojis(item.batch_name || item.coffee_name || item.name || 'Café de Especialidad');
  const roaster = stripEmojis(item.roaster || item.batch_roaster || '');
  const origin = stripEmojis(item.origin || item.batch_origin || '');
  const variety = stripEmojis(item.variety || item.batch_variety || '');
  const process = stripEmojis(item.process || item.batch_process || '');
  const notesStr = cleanNotesString(item.flavor_notes || item.roaster_notes || item.batch_roaster_notes || item.notes || '');
  const flavorTags = extractFlavorTags(notesStr);

  const getAestheticGlyph = (tag) => {
    return getScaWheelIcon(tag);
  };

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

  const drawFittedText = (text, x, y, maxWidth, initialSize = 42, fontName = '"Space Grotesk", sans-serif', weight = '900') => {
    const str = String(text || '');
    let size = initialSize;
    ctx.font = `${weight} ${size}px ${fontName}`;
    while (ctx.measureText(str).width > maxWidth && size > 16) {
      size -= 1;
      ctx.font = `${weight} ${size}px ${fontName}`;
    }
    if (ctx.measureText(str).width > maxWidth) {
      drawTruncatedText(str, x, y, maxWidth);
    } else {
      ctx.fillText(str, x, y);
    }
  };

  // 3. Background & Card Shell
  const margin = transparent ? 8 : 0;
  const cardX = margin, cardY = margin, cardW = baseW - (margin * 2), cardH = baseH - (margin * 2);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  const subStr = [roaster, origin, variety, process].filter(Boolean).map(s => s.toUpperCase()).join(' • ');

  // 4. Style rendering
  if (style === 'blueprint') {
    if (transparent) {
      ctx.clearRect(0, 0, baseW, baseH);
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 4;
      ctx.fillStyle = '#06162D';
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2;
      drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 16, true, true);
      ctx.restore();
    } else {
      ctx.fillStyle = '#06162D';
      ctx.fillRect(0, 0, baseW, baseH);
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2;
      drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 16, false, true);
    }

    // Corner accents
    drawBlueprintCross(ctx, cardX + 14, cardY + 14, 5);
    drawBlueprintCross(ctx, cardX + cardW - 14, cardY + 14, 5);
    drawBlueprintCross(ctx, cardX + 14, cardY + cardH - 14, 5);
    drawBlueprintCross(ctx, cardX + cardW - 14, cardY + cardH - 14, 5);

    // Brand tag
    ctx.fillStyle = '#38BDF8';
    ctx.font = '700 9px "JetBrains Mono", monospace';
    ctx.fillText(isVertical ? 'BEANTAG // COFFEE ARCHIVE' : 'BEANTAG // SPECIALTY COFFEE', cardX + 24, cardY + 34);

    if (isVertical) {
      // VERTICAL LAYOUT
      ctx.fillStyle = '#FFFFFF';
      drawFittedText(coffeeName.toUpperCase(), cardX + 24, cardY + 76, cardW - 48, 38, '"JetBrains Mono", monospace', '900');

      ctx.fillStyle = '#7DD3FC';
      ctx.font = '700 15px "JetBrains Mono", monospace';
      drawTruncatedText(subStr, cardX + 24, cardY + 112, cardW - 48);

      // Tech divider
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cardX + 24, cardY + 134);
      ctx.lineTo(cardX + cardW - 24, cardY + 134);
      ctx.stroke();

      // Section header
      ctx.fillStyle = '#38BDF8';
      ctx.font = '700 9px "JetBrains Mono", monospace';
      ctx.fillText('// DESCRIPTORES SENSORIALES:', cardX + 24, cardY + 154);

      // Stacked large pills
      const pillYStart = cardY + 168;
      const pillH = 44;
      const displayed = flavorTags.length > 0 ? flavorTags.slice(0, 4) : [];
      if (displayed.length > 0) {
        displayed.forEach((tag, idx) => {
          const py = pillYStart + idx * (pillH + 10);
          if (py + pillH > cardY + cardH - 24) return;
          const glyph = getAestheticGlyph(tag, 'blueprint');
          const pillText = `${glyph}   ${tag.toUpperCase()}`;
          ctx.fillStyle = 'rgba(56, 189, 248, 0.14)';
          ctx.strokeStyle = '#38BDF8';
          ctx.lineWidth = 1.5;
          drawRoundedRect(ctx, cardX + 24, py, cardW - 48, pillH, 8, true, true);
          ctx.fillStyle = '#E0F2FE';
          ctx.font = '800 15px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(pillText, cardX + 24 + (cardW - 48) / 2, py + pillH / 2);
          ctx.textAlign = 'left';
          ctx.textBaseline = 'alphabetic';
        });
      } else {
        const py = pillYStart;
        ctx.fillStyle = 'rgba(56, 189, 248, 0.14)';
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 1.5;
        drawRoundedRect(ctx, cardX + 24, py, cardW - 48, pillH, 8, true, true);
        ctx.fillStyle = '#E0F2FE';
        ctx.font = '800 13px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✦   ORIGEN SELECCIONADO', cardX + 24 + (cardW - 48) / 2, py + pillH / 2);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
      }
    } else {
      // HORIZONTAL LAYOUT
      ctx.fillStyle = '#FFFFFF';
      drawFittedText(coffeeName.toUpperCase(), cardX + 24, cardY + 76, cardW - 48, 42, '"JetBrains Mono", monospace', '900');

      ctx.fillStyle = '#7DD3FC';
      ctx.font = '700 16px "JetBrains Mono", monospace';
      drawTruncatedText(subStr, cardX + 24, cardY + 114, cardW - 48);

      const pillY = cardY + 148;
      const pillH = 44;
      if (flavorTags.length > 0) {
        let curX = cardX + 24;
        const displayed = flavorTags.slice(0, 3);
        ctx.font = '800 15px "JetBrains Mono", monospace';
        for (const tag of displayed) {
          const glyph = getAestheticGlyph(tag, 'blueprint');
          const tagText = `${glyph}  ${tag.toUpperCase()}`;
          const pillW = ctx.measureText(tagText).width + 32;
          if (curX + pillW > cardX + cardW - 16) break;
          ctx.fillStyle = 'rgba(56, 189, 248, 0.16)';
          ctx.strokeStyle = '#38BDF8';
          ctx.lineWidth = 1.5;
          drawRoundedRect(ctx, curX, pillY, pillW, pillH, 8, true, true);
          ctx.fillStyle = '#E0F2FE';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(tagText, curX + pillW / 2, pillY + pillH / 2);
          ctx.textAlign = 'left';
          ctx.textBaseline = 'alphabetic';
          curX += pillW + 12;
        }
      } else {
        const fallbackNote = '✦  ORIGEN SELECCIONADO • TOSTADO ARTESANAL';
        ctx.font = '800 14px "JetBrains Mono", monospace';
        const pillW = Math.min(ctx.measureText(fallbackNote).width + 32, cardW - 48);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.16)';
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 1.5;
        drawRoundedRect(ctx, cardX + 24, pillY, pillW, pillH, 8, true, true);
        ctx.fillStyle = '#E0F2FE';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(fallbackNote, cardX + 24 + pillW / 2, pillY + pillH / 2);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
      }
    }
  } else if (style === 'neobrutalist') {
    if (transparent) {
      ctx.clearRect(0, 0, baseW, baseH);
      ctx.fillStyle = '#000000';
      ctx.fillRect(cardX + 6, cardY + 6, cardW, cardH);
      ctx.fillStyle = '#FFFDF8';
      ctx.fillRect(cardX, cardY, cardW, cardH);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3.5;
      ctx.strokeRect(cardX, cardY, cardW, cardH);
    } else {
      ctx.fillStyle = '#FFFDF8';
      ctx.fillRect(0, 0, baseW, baseH);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3.5;
      ctx.strokeRect(cardX, cardY, cardW, cardH);
    }

    // Brand tag
    ctx.fillStyle = '#000000';
    ctx.font = '900 10px "Space Grotesk", sans-serif';
    ctx.fillText('BEANTAG // STICKER', cardX + 24, cardY + 34);

    const neoColors = ['#D4FF00', '#FF3B14', '#D8B4FE', '#38BDF8'];

    if (isVertical) {
      // VERTICAL LAYOUT
      ctx.fillStyle = '#000000';
      drawFittedText(coffeeName.toUpperCase(), cardX + 24, cardY + 76, cardW - 48, 40, '"Space Grotesk", sans-serif', '900');

      ctx.fillStyle = '#FF3B14';
      ctx.font = '800 16px "Space Grotesk", sans-serif';
      drawTruncatedText(subStr, cardX + 24, cardY + 114, cardW - 48);

      // Section divider
      ctx.fillStyle = '#000000';
      ctx.fillRect(cardX + 24, cardY + 134, cardW - 48, 2);

      ctx.fillStyle = '#000000';
      ctx.font = '900 10px "Space Grotesk", sans-serif';
      ctx.fillText('NOTAS DE CATA // FLAVOR PROFILE:', cardX + 24, cardY + 154);

      const pillYStart = cardY + 168;
      const pillH = 46;
      const displayed = flavorTags.length > 0 ? flavorTags.slice(0, 4) : [];
      if (displayed.length > 0) {
        displayed.forEach((tag, idx) => {
          const py = pillYStart + idx * (pillH + 10);
          if (py + pillH > cardY + cardH - 20) return;
          const glyph = getAestheticGlyph(tag, 'neobrutalist');
          const pillText = `${glyph}   ${tag.toUpperCase()}`;
          // Drop shadow
          ctx.fillStyle = '#000000';
          ctx.fillRect(cardX + 24 + 3, py + 3, cardW - 48, pillH);
          // Background
          ctx.fillStyle = neoColors[idx % neoColors.length];
          ctx.fillRect(cardX + 24, py, cardW - 48, pillH);
          // Border
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2.5;
          ctx.strokeRect(cardX + 24, py, cardW - 48, pillH);
          // Text
          ctx.fillStyle = '#000000';
          ctx.font = '900 16px "Space Grotesk", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(pillText, cardX + 24 + (cardW - 48) / 2, py + pillH / 2);
          ctx.textAlign = 'left';
          ctx.textBaseline = 'alphabetic';
        });
      } else {
        const py = pillYStart;
        ctx.fillStyle = '#000000';
        ctx.fillRect(cardX + 24 + 3, py + 3, cardW - 48, pillH);
        ctx.fillStyle = '#D4FF00';
        ctx.fillRect(cardX + 24, py, cardW - 48, pillH);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(cardX + 24, py, cardW - 48, pillH);
        ctx.fillStyle = '#000000';
        ctx.font = '900 15px "Space Grotesk", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★   ORIGEN SELECCIONADO', cardX + 24 + (cardW - 48) / 2, py + pillH / 2);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
      }
    } else {
      // HORIZONTAL LAYOUT
      ctx.fillStyle = '#000000';
      drawFittedText(coffeeName.toUpperCase(), cardX + 24, cardY + 76, cardW - 48, 44, '"Space Grotesk", sans-serif', '900');

      ctx.fillStyle = '#FF3B14';
      ctx.font = '800 16.5px "Space Grotesk", sans-serif';
      drawTruncatedText(subStr, cardX + 24, cardY + 114, cardW - 48);

      const pillY = cardY + 148;
      const pillH = 44;
      if (flavorTags.length > 0) {
        let curX = cardX + 24;
        const displayed = flavorTags.slice(0, 3);
        ctx.font = '900 15px "Space Grotesk", sans-serif';
        displayed.forEach((tag, idx) => {
          const glyph = getAestheticGlyph(tag, 'neobrutalist');
          const tagText = `${glyph}  ${tag.toUpperCase()}`;
          const pillW = ctx.measureText(tagText).width + 30;
          if (curX + pillW > cardX + cardW - 16) return;
          ctx.fillStyle = '#000000';
          ctx.fillRect(curX + 2.5, pillY + 2.5, pillW, pillH);
          ctx.fillStyle = neoColors[idx % neoColors.length];
          ctx.fillRect(curX, pillY, pillW, pillH);
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2.5;
          ctx.strokeRect(curX, pillY, pillW, pillH);
          ctx.fillStyle = '#000000';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(tagText, curX + pillW / 2, pillY + pillH / 2);
          ctx.textAlign = 'left';
          ctx.textBaseline = 'alphabetic';
          curX += pillW + 12;
        });
      } else {
        const fallbackNote = '★  ORIGEN SELECCIONADO • TOSTADO ARTESANAL';
        ctx.font = '900 14px "Space Grotesk", sans-serif';
        const pillW = Math.min(ctx.measureText(fallbackNote).width + 30, cardW - 48);
        ctx.fillStyle = '#000000';
        ctx.fillRect(cardX + 24 + 2.5, pillY + 2.5, pillW, pillH);
        ctx.fillStyle = '#D4FF00';
        ctx.fillRect(cardX + 24, pillY, pillW, pillH);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(cardX + 24, pillY, pillW, pillH);
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(fallbackNote, cardX + 24 + pillW / 2, pillY + pillH / 2);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
      }
    }
  } else if (style === 'diner') {
    if (transparent) {
      ctx.clearRect(0, 0, baseW, baseH);
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 4;
      ctx.fillStyle = '#FFFDF5';
      ctx.strokeStyle = '#C92A2A';
      ctx.lineWidth = 2.5;
      drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 18, true, true);
      ctx.restore();
    } else {
      ctx.fillStyle = '#FFFDF5';
      ctx.fillRect(0, 0, baseW, baseH);
      ctx.strokeStyle = '#C92A2A';
      ctx.lineWidth = 2.5;
      drawRoundedRect(ctx, cardX + 1, cardY + 1, cardW - 2, cardH - 2, 16, false, true);
    }

    // Inner dashed line
    ctx.strokeStyle = '#0E7490';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]);
    drawRoundedRect(ctx, cardX + 6, cardY + 6, cardW - 12, cardH - 12, 14, false, true);
    ctx.setLineDash([]);

    // Corner accent
    drawDinerAtomicStar(ctx, cardX + cardW - 32, cardY + 28, 14, '#C92A2A');

    // Brand tag
    ctx.fillStyle = '#C92A2A';
    ctx.font = '700 9px "Space Grotesk", sans-serif';
    ctx.fillText('★ BEANTAG COFFEE CO. ★', cardX + 24, cardY + 34);

    if (isVertical) {
      // VERTICAL LAYOUT
      ctx.fillStyle = '#1C1917';
      drawFittedText(coffeeName.toUpperCase(), cardX + 24, cardY + 76, cardW - 48, 38, '"Space Grotesk", sans-serif', '900');

      ctx.fillStyle = '#0E7490';
      ctx.font = '700 15px "Space Grotesk", sans-serif';
      drawTruncatedText(subStr, cardX + 24, cardY + 114, cardW - 48);

      ctx.strokeStyle = 'rgba(201, 42, 42, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cardX + 24, cardY + 134);
      ctx.lineTo(cardX + cardW - 24, cardY + 134);
      ctx.stroke();

      ctx.fillStyle = '#C92A2A';
      ctx.font = '800 9.5px "Space Grotesk", sans-serif';
      ctx.fillText('★ TASTING NOTES // SELECCIÓN:', cardX + 24, cardY + 154);

      const pillYStart = cardY + 168;
      const pillH = 44;
      const displayed = flavorTags.length > 0 ? flavorTags.slice(0, 4) : [];
      if (displayed.length > 0) {
        displayed.forEach((tag, idx) => {
          const py = pillYStart + idx * (pillH + 10);
          if (py + pillH > cardY + cardH - 20) return;
          const glyph = getAestheticGlyph(tag, 'diner');
          const pillText = `${glyph}   ${tag.toUpperCase()}`;
          ctx.fillStyle = '#FEE2E2';
          ctx.strokeStyle = '#C92A2A';
          ctx.lineWidth = 1.6;
          drawRoundedRect(ctx, cardX + 24, py, cardW - 48, pillH, 8, true, true);
          ctx.fillStyle = '#991B1B';
          ctx.font = '800 15px "Space Grotesk", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(pillText, cardX + 24 + (cardW - 48) / 2, py + pillH / 2);
          ctx.textAlign = 'left';
          ctx.textBaseline = 'alphabetic';
        });
      } else {
        const py = pillYStart;
        ctx.fillStyle = '#FEE2E2';
        ctx.strokeStyle = '#C92A2A';
        ctx.lineWidth = 1.6;
        drawRoundedRect(ctx, cardX + 24, py, cardW - 48, pillH, 8, true, true);
        ctx.fillStyle = '#991B1B';
        ctx.font = '800 14px "Space Grotesk", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★   SERVIDO FRESCO A DIARIO', cardX + 24 + (cardW - 48) / 2, py + pillH / 2);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
      }
    } else {
      // HORIZONTAL LAYOUT
      ctx.fillStyle = '#1C1917';
      drawFittedText(coffeeName.toUpperCase(), cardX + 24, cardY + 76, cardW - 75, 42, '"Space Grotesk", sans-serif', '900');

      ctx.fillStyle = '#0E7490';
      ctx.font = '700 16px "Space Grotesk", sans-serif';
      drawTruncatedText(subStr, cardX + 24, cardY + 114, cardW - 48);

      const pillY = cardY + 148;
      const pillH = 44;
      if (flavorTags.length > 0) {
        let curX = cardX + 24;
        const displayed = flavorTags.slice(0, 3);
        ctx.font = '800 15px "Space Grotesk", sans-serif';
        for (const tag of displayed) {
          const glyph = getAestheticGlyph(tag, 'diner');
          const tagText = `${glyph}  ${tag.toUpperCase()}`;
          const pillW = ctx.measureText(tagText).width + 30;
          if (curX + pillW > cardX + cardW - 16) break;
          ctx.fillStyle = '#FEE2E2';
          ctx.strokeStyle = '#C92A2A';
          ctx.lineWidth = 1.6;
          drawRoundedRect(ctx, curX, pillY, pillW, pillH, 8, true, true);
          ctx.fillStyle = '#991B1B';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(tagText, curX + pillW / 2, pillY + pillH / 2);
          ctx.textAlign = 'left';
          ctx.textBaseline = 'alphabetic';
          curX += pillW + 12;
        }
      } else {
        const fallbackNote = '★  ORIGEN SELECCIONADO • TOSTADO ARTESANAL';
        ctx.font = '800 14px "Space Grotesk", sans-serif';
        const pillW = Math.min(ctx.measureText(fallbackNote).width + 30, cardW - 48);
        ctx.fillStyle = '#FEE2E2';
        ctx.strokeStyle = '#C92A2A';
        ctx.lineWidth = 1.6;
        drawRoundedRect(ctx, cardX + 24, pillY, pillW, pillH, 8, true, true);
        ctx.fillStyle = '#991B1B';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(fallbackNote, cardX + 24 + pillW / 2, pillY + pillH / 2);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
      }
    }
  } else {
    // Kプレイヤー KISSATEN
    if (transparent) {
      ctx.clearRect(0, 0, baseW, baseH);
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 4;
      ctx.fillStyle = '#F7F5F0';
      ctx.strokeStyle = '#18181B';
      ctx.lineWidth = 1.4;
      drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 16, true, true);
      ctx.restore();
    } else {
      ctx.fillStyle = '#F7F5F0';
      ctx.fillRect(0, 0, baseW, baseH);
      ctx.strokeStyle = '#18181B';
      ctx.lineWidth = 1.4;
      drawRoundedRect(ctx, cardX + 1, cardY + 1, cardW - 2, cardH - 2, 12, false, true);
    }

    // Inner subtle line
    ctx.strokeStyle = '#E4E4E7';
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, cardX + 6, cardY + 6, cardW - 12, cardH - 12, 10, false, true);

    // Stamp
    drawHankoSeal(ctx, cardX + cardW - 36, cardY + 34, 26, '豆札');

    // Brand tag
    ctx.fillStyle = '#52525B';
    ctx.font = '700 9px "Playfair Display", Georgia, serif';
    ctx.fillText('自家焙煎 • BEANTAG ARCHIVE', cardX + 24, cardY + 34);

    if (isVertical) {
      // VERTICAL LAYOUT
      ctx.fillStyle = '#18181B';
      drawFittedText(coffeeName, cardX + 24, cardY + 76, cardW - 48, 38, '"Playfair Display", Georgia, serif', 'bold');

      ctx.fillStyle = '#78716C';
      ctx.font = 'italic 15px "Playfair Display", Georgia, serif';
      drawTruncatedText(subStr, cardX + 24, cardY + 114, cardW - 48);

      ctx.strokeStyle = '#E4E4E7';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cardX + 24, cardY + 134);
      ctx.lineTo(cardX + cardW - 24, cardY + 134);
      ctx.stroke();

      ctx.fillStyle = '#52525B';
      ctx.font = 'bold 9.5px "Playfair Display", Georgia, serif';
      ctx.fillText('珈琲風味 // SENSORY PROFILE:', cardX + 24, cardY + 154);

      const pillYStart = cardY + 168;
      const pillH = 44;
      const displayed = flavorTags.length > 0 ? flavorTags.slice(0, 4) : [];
      if (displayed.length > 0) {
        displayed.forEach((tag, idx) => {
          const py = pillYStart + idx * (pillH + 10);
          if (py + pillH > cardY + cardH - 20) return;
          const glyph = getAestheticGlyph(tag, 'kissaten');
          const pillText = `${glyph}   ${tag.toUpperCase()}`;
          ctx.fillStyle = '#FAF8F5';
          ctx.strokeStyle = '#D4D4D8';
          ctx.lineWidth = 1.2;
          drawRoundedRect(ctx, cardX + 24, py, cardW - 48, pillH, 6, true, true);
          ctx.fillStyle = '#18181B';
          ctx.font = 'bold 15px "Playfair Display", Georgia, serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(pillText, cardX + 24 + (cardW - 48) / 2, py + pillH / 2);
          ctx.textAlign = 'left';
          ctx.textBaseline = 'alphabetic';
        });
      } else {
        const py = pillYStart;
        ctx.fillStyle = '#FAF8F5';
        ctx.strokeStyle = '#D4D4D8';
        ctx.lineWidth = 1.2;
        drawRoundedRect(ctx, cardX + 24, py, cardW - 48, pillH, 6, true, true);
        ctx.fillStyle = '#18181B';
        ctx.font = 'bold 14px "Playfair Display", Georgia, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✿   純喫茶 自家焙煎', cardX + 24 + (cardW - 48) / 2, py + pillH / 2);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
      }
    } else {
      // HORIZONTAL LAYOUT
      ctx.fillStyle = '#18181B';
      drawFittedText(coffeeName, cardX + 24, cardY + 76, cardW - 75, 42, '"Playfair Display", Georgia, serif', 'bold');

      ctx.fillStyle = '#78716C';
      ctx.font = 'italic 16px "Playfair Display", Georgia, serif';
      drawTruncatedText(subStr, cardX + 24, cardY + 114, cardW - 48);

      const pillY = cardY + 148;
      const pillH = 44;
      if (flavorTags.length > 0) {
        let curX = cardX + 24;
        const displayed = flavorTags.slice(0, 3);
        ctx.font = 'bold 15px "Playfair Display", Georgia, serif';
        for (const tag of displayed) {
          const glyph = getAestheticGlyph(tag, 'kissaten');
          const tagText = `${glyph}  ${tag.toUpperCase()}`;
          const pillW = ctx.measureText(tagText).width + 30;
          if (curX + pillW > cardX + cardW - 16) break;
          ctx.fillStyle = '#FAF8F5';
          ctx.strokeStyle = '#D4D4D8';
          ctx.lineWidth = 1.2;
          drawRoundedRect(ctx, curX, pillY, pillW, pillH, 6, true, true);
          ctx.fillStyle = '#18181B';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(tagText, curX + pillW / 2, pillY + pillH / 2);
          ctx.textAlign = 'left';
          ctx.textBaseline = 'alphabetic';
          curX += pillW + 12;
        }
      } else {
        const fallbackNote = '✿  純喫茶 自家焙煎 • BEANTAG';
        ctx.font = 'bold 14px "Playfair Display", Georgia, serif';
        const pillW = Math.min(ctx.measureText(fallbackNote).width + 30, cardW - 48);
        ctx.fillStyle = '#FAF8F5';
        ctx.strokeStyle = '#D4D4D8';
        ctx.lineWidth = 1.2;
        drawRoundedRect(ctx, cardX + 24, pillY, pillW, pillH, 6, true, true);
        ctx.fillStyle = '#52525B';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(fallbackNote, cardX + 24 + pillW / 2, pillY + pillH / 2);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
      }
    }
  }

  return canvas.toDataURL('image/png');
}

