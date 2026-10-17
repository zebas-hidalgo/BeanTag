// --- BEANTAG COLLECTOR CARDS & STORY STICKERS ENGINE (2026/2027) ---
// High-Legibility Specialty Coffee Collector System:
// 1. studio       -> Swiss Studio (Onyx / Fellow Gallery Minimalist)
// 2. kissaten     -> Tokyo Kissaten (Koffee Mameya Washi & Vermilion Seal)
// 3. blueprint    -> Dark Espresso Lab (Acaia / Strava Night Telemetry HUD)
// 4. neobrutalist -> Nomad Roastery (Nomad / Fuglen Tactile Offset Label)
// 5. diner        -> Botanical Terroir (La Cabra / Finca Herbarium & Copper)
//
// Pure Canvas 2D vector & typography (Zero external raster images),
// +60% larger typography for Instagram Story legibility, and WCAG AAA contrast.

export { getScaWheelIcon, cleanNotesString, getScaCategory, STYLE_SCA_ICONS } from './scaIcons';
import { getScaWheelIcon, cleanNotesString, getScaCategory, STYLE_SCA_ICONS } from './scaIcons';

export { parseGrindToMicrons } from './grinders';
import { parseGrindToMicrons, GRINDERS } from './grinders';

/**
 * Normalizes template names to the 5 official collector styles:
 * 'blueprint' | 'neobrutalist' | 'diner' | 'kissaten' | 'studio'
 */
export function normalizeCardStyle(tpl) {
  if (!tpl) return 'studio';
  const lower = String(tpl).toLowerCase();
  if (lower.includes('studio') || lower.includes('mono') || lower.includes('swiss') || lower.includes('helvetica') || lower.includes('grid')) return 'studio';
  if (lower.includes('blue') || lower.includes('cyan') || lower.includes('tech') || lower.includes('patent') || lower.includes('lab')) return 'blueprint';
  if (lower.includes('neo') || lower.includes('brutal') || lower.includes('pop') || lower.includes('bold') || lower.includes('nomad')) return 'neobrutalist';
  if (lower.includes('diner') || lower.includes('retro') || lower.includes('1950') || lower.includes('50') || lower.includes('aurora') || lower.includes('glass') || lower.includes('holo') || lower.includes('botanic') || lower.includes('terroir')) return 'diner';
  if (lower.includes('kissa') || lower.includes('washi') || lower.includes('tokyo') || lower.includes('japan') || lower.includes('sumi') || lower.includes('hang') || lower.includes('nord') || lower.includes('vintage') || lower.includes('paper') || lower.includes('minimal')) return 'kissaten';
  return 'blueprint';
}

export const CARD_STYLES = ['blueprint', 'neobrutalist', 'diner', 'kissaten', 'studio'];

export const CARD_THEMES = {
  studio: {
    id: 'studio',
    name: 'SWISS STUDIO',
    badgeLabel: 'STUDIO ARCHIVE',
    bg: '#F4F4F5',
    cardBg: '#FFFFFF',
    surfaceBg: '#FAFAFA',
    surfaceAlt: '#F4F4F5',
    text: '#09090B',
    textSecondary: '#3F3F46',
    textMuted: '#71717A',
    border: '#E4E4E7',
    borderStrong: '#18181B',
    borderSubtle: 'rgba(9, 9, 11, 0.08)',
    accent: '#18181B',
    accentBg: '#18181B',
    accentText: '#FFFFFF',
    accentSoft: '#F4F4F5',
    pillBg: '#F4F4F5',
    pillBorder: '#D4D4D8',
    pillText: '#09090B',
    radarFill: 'rgba(24, 24, 27, 0.12)',
    radarStroke: '#18181B',
    fontHeading: '"Outfit", "Space Grotesk", sans-serif',
    fontBody: '"Plus Jakarta Sans", "Space Grotesk", sans-serif',
    fontMono: '"JetBrains Mono", monospace',
    shadowOffset: 0,
    cornerRadius: 16
  },
  kissaten: {
    id: 'kissaten',
    name: 'TOKYO KISSATEN',
    badgeLabel: '自家焙煎 // KISSATEN',
    bg: '#EBE5D9',
    cardBg: '#FAF7F0',
    surfaceBg: '#F3EFE6',
    surfaceAlt: '#EDE7DA',
    text: '#1C1917',
    textSecondary: '#44403C',
    textMuted: '#78716C',
    border: '#D6CFC1',
    borderStrong: '#1C1917',
    borderSubtle: 'rgba(28, 25, 23, 0.12)',
    accent: '#B91C1C',
    accentBg: '#B91C1C',
    accentText: '#FFFFFF',
    accentSoft: 'rgba(185, 28, 28, 0.08)',
    pillBg: '#F3EFE6',
    pillBorder: '#C7BFA E',
    pillText: '#1C1917',
    radarFill: 'rgba(185, 28, 28, 0.16)',
    radarStroke: '#B91C1C',
    fontHeading: '"Playfair Display", Georgia, serif',
    fontBody: '"Plus Jakarta Sans", "Space Grotesk", sans-serif',
    fontMono: '"JetBrains Mono", monospace',
    shadowOffset: 0,
    cornerRadius: 12
  },
  blueprint: {
    id: 'blueprint',
    name: 'DARK ESPRESSO LAB',
    badgeLabel: 'DARK LAB // TELEMETRY',
    bg: '#060911',
    cardBg: '#0D1322',
    surfaceBg: '#131C31',
    surfaceAlt: '#192540',
    text: '#F8FAFC',
    textSecondary: '#CBD5E1',
    textMuted: '#94A3B8',
    border: 'rgba(56, 189, 248, 0.35)',
    borderStrong: '#38BDF8',
    borderSubtle: 'rgba(56, 189, 248, 0.14)',
    accent: '#38BDF8',
    accentBg: 'rgba(56, 189, 248, 0.16)',
    accentText: '#38BDF8',
    accentSoft: 'rgba(56, 189, 248, 0.10)',
    pillBg: 'rgba(56, 189, 248, 0.12)',
    pillBorder: '#38BDF8',
    pillText: '#F0F9FF',
    radarFill: 'rgba(56, 189, 248, 0.24)',
    radarStroke: '#38BDF8',
    fontHeading: '"Space Grotesk", sans-serif',
    fontBody: '"Plus Jakarta Sans", "Space Grotesk", sans-serif',
    fontMono: '"JetBrains Mono", monospace',
    shadowOffset: 0,
    cornerRadius: 16
  },
  neobrutalist: {
    id: 'neobrutalist',
    name: 'NOMAD ROASTERY',
    badgeLabel: 'NOMAD // ROASTERY LOT',
    bg: '#EFECE4',
    cardBg: '#FFFDF9',
    surfaceBg: '#F7F3EB',
    surfaceAlt: '#FEF3C7',
    text: '#18181B',
    textSecondary: '#27272A',
    textMuted: '#52525B',
    border: '#18181B',
    borderStrong: '#18181B',
    borderSubtle: 'rgba(24, 24, 27, 0.2)',
    accent: '#EA580C',
    accentBg: '#FDE68A',
    accentText: '#18181B',
    accentSoft: '#FED7AA',
    pillBg: '#FEF3C7',
    pillBorder: '#18181B',
    pillText: '#18181B',
    radarFill: 'rgba(234, 88, 12, 0.22)',
    radarStroke: '#EA580C',
    fontHeading: '"Space Grotesk", sans-serif',
    fontBody: '"Space Grotesk", sans-serif',
    fontMono: '"JetBrains Mono", monospace',
    shadowOffset: 4,
    cornerRadius: 14
  },
  diner: {
    id: 'diner',
    name: 'BOTANICAL TERROIR',
    badgeLabel: 'BOTANICAL // TERROIR LOT',
    bg: '#E6EFE9',
    cardBg: '#FCFDFB',
    surfaceBg: '#EFF5F1',
    surfaceAlt: '#E2ECE6',
    text: '#143326',
    textSecondary: '#1E4635',
    textMuted: '#4A6B5D',
    border: '#C5D6CC',
    borderStrong: '#143326',
    borderSubtle: 'rgba(20, 51, 38, 0.14)',
    accent: '#C2410C',
    accentBg: '#C2410C',
    accentText: '#FFFFFF',
    accentSoft: '#FFEDD5',
    pillBg: '#EFF5F1',
    pillBorder: '#86A797',
    pillText: '#143326',
    radarFill: 'rgba(194, 65, 12, 0.18)',
    radarStroke: '#C2410C',
    fontHeading: '"Outfit", "Space Grotesk", sans-serif',
    fontBody: '"Plus Jakarta Sans", "Space Grotesk", sans-serif',
    fontMono: '"JetBrains Mono", monospace',
    shadowOffset: 0,
    cornerRadius: 16
  }
};

export function getCardTheme(style) {
  const norm = normalizeCardStyle(style);
  return CARD_THEMES[norm] || CARD_THEMES.studio;
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
 * Robust text truncation utility that guarantees text never bleeds past maxWidth
 */
export function drawCanvasTruncatedText(ctx, text, x, y, maxWidth) {
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
}

/**
 * Multi-line title wrapper (up to maxLines) with automatic font-size fitting so titles are huge & readable
 */
function drawHeroTitleBlock(ctx, text, x, y, maxWidth, options = {}) {
  const {
    maxLines = 2,
    maxFontSize = 36,
    minFontSize = 24,
    fontFamily = '"Space Grotesk", sans-serif',
    fontWeight = '800',
    lineHeightRatio = 1.12,
    color = '#09090B'
  } = options;

  const clean = String(text || 'Café de Especialidad').trim();
  const words = clean.split(/\s+/).filter(Boolean);

  ctx.save();
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  let fontSize = maxFontSize;
  let finalLines = [clean];

  const computeLines = (size) => {
    ctx.font = `${fontWeight} ${size}px ${fontFamily}`;
    const lines = [];
    let current = '';
    for (let i = 0; i < words.length; i++) {
      const candidate = current ? `${current} ${words[i]}` : words[i];
      if (ctx.measureText(candidate).width <= maxWidth || !current) {
        current = candidate;
      } else {
        lines.push(current);
        current = words[i];
      }
    }
    if (current) lines.push(current);
    return lines;
  };

  while (fontSize >= minFontSize) {
    const candidateLines = computeLines(fontSize);
    const fitsWidth = candidateLines.every(l => ctx.measureText(l).width <= maxWidth);
    if (candidateLines.length <= maxLines && fitsWidth) {
      finalLines = candidateLines;
      break;
    }
    fontSize -= 2;
    finalLines = candidateLines;
  }

  ctx.font = `${fontWeight} ${Math.max(minFontSize, fontSize)}px ${fontFamily}`;
  const lineH = Math.round(Math.max(minFontSize, fontSize) * lineHeightRatio);

  if (finalLines.length > maxLines) {
    const clipped = finalLines.slice(0, maxLines);
    const remainingWords = finalLines.slice(maxLines - 1).join(' ');
    clipped[maxLines - 1] = remainingWords;
    finalLines = clipped;
  }

  finalLines.forEach((line, idx) => {
    const drawY = y + idx * lineH;
    drawCanvasTruncatedText(ctx, line, x, drawY, maxWidth);
  });

  ctx.restore();
  return {
    linesDrawn: finalLines.length,
    bottomY: y + (finalLines.length - 1) * lineH,
    fontSize: Math.max(minFontSize, fontSize),
    lineHeight: lineH
  };
}

/**
 * Utility: Draws rounded rectangle with optional brutalist offset shadow
 */
function drawRoundedRect(ctx, x, y, width, height, radius, fill = false, stroke = true) {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

function drawStyledBox(ctx, x, y, w, h, theme, options = {}) {
  const {
    fill = theme.surfaceBg,
    stroke = theme.border,
    lineWidth = theme.id === 'neobrutalist' ? 2.2 : 1.2,
    radius = 12,
    shadow = theme.shadowOffset > 0
  } = options;

  ctx.save();
  if (shadow && theme.shadowOffset > 0) {
    ctx.fillStyle = theme.borderStrong;
    drawRoundedRect(ctx, x + theme.shadowOffset, y + theme.shadowOffset, w, h, radius, true, false);
  }
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  drawRoundedRect(ctx, x, y, w, h, radius, Boolean(fill), Boolean(stroke && lineWidth > 0));
  ctx.restore();
}

/**
 * Draws a 5-axis SCA Sensory Radar Chart with high-legibility 11.5px labels
 */
export function drawSensoryRadarChart(ctx, cx, cy, radius, sensoryData, style) {
  if (!sensoryData) return false;
  const theme = getCardTheme(style);
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
    ctx.strokeStyle = theme.borderSubtle;
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  // 2. Radial Spines
  for (let i = 0; i < numAxes; i++) {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / numAxes;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
    ctx.strokeStyle = theme.borderSubtle;
    ctx.lineWidth = 1;
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

  ctx.fillStyle = theme.radarFill;
  ctx.strokeStyle = theme.radarStroke;
  ctx.lineWidth = 2;
  ctx.fill();
  ctx.stroke();

  // 4. Vertex Dots
  for (let i = 0; i < numAxes; i++) {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / numAxes;
    const normVal = Math.max(1, Math.min(5, values[i])) / 5.0;
    const r = normVal * radius;
    ctx.beginPath();
    ctx.arc(cx + r * Math.cos(angle), cy + r * Math.sin(angle), 3, 0, 2 * Math.PI);
    ctx.fillStyle = theme.radarStroke;
    ctx.fill();
  }

  // 5. High-legibility 11.5px Axis Labels
  ctx.font = `800 11.5px ${theme.fontMono}`;
  ctx.fillStyle = theme.textSecondary;
  for (let i = 0; i < numAxes; i++) {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / numAxes;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    ctx.textAlign = Math.abs(cosA) < 0.25 ? 'center' : (cosA > 0 ? 'left' : 'right');
    ctx.textBaseline = Math.abs(sinA) < 0.25 ? 'middle' : (sinA > 0 ? 'top' : 'bottom');
    const padDist = 7;
    const lx = cx + (radius + padDist) * cosA;
    const ly = cy + (radius + padDist) * sinA;
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

  if (!balanceRaw && !bodyRaw && !extractionRaw) {
    return null;
  }

  const mapAttr = (val) => {
    if (typeof val === 'number' && Number.isFinite(val)) return Math.max(1, Math.min(5, val));
    if (!val) return 3;
    const s = String(val).toLowerCase();
    if (s.includes('sobre') || s.includes('over') || s.includes('heavy') || s.includes('alta') || s.includes('intenso') || s.includes('pesado')) return 4.5;
    if (s.includes('en punto') || s.includes('balanced') || s.includes('balanceado') || s.includes('medium') || s.includes('medio') || s.includes('dulce')) return 5.0;
    if (s.includes('sedoso') || s.includes('silky')) return 4.2;
    if (s.includes('sub') || s.includes('under') || s.includes('light') || s.includes('ligero') || s.includes('bajo') || s.includes('ácido') || s.includes('acido')) return 2.5;
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
 * Asynchronous Font Loading Barrier
 */
export async function ensureFontsLoaded() {
  if (typeof document === 'undefined' || !document.fonts) return;
  try {
    await Promise.all([
      document.fonts.load('700 16px "Space Grotesk"'),
      document.fonts.load('800 32px "Space Grotesk"'),
      document.fonts.load('700 14px "JetBrains Mono"'),
      document.fonts.load('800 22px "JetBrains Mono"'),
      document.fonts.load('bold 32px "Playfair Display"'),
      document.fonts.load('800 32px "Outfit"').catch(() => {})
    ]);
    await document.fonts.ready;
  } catch (e) {
    // Graceful fallback
  }
}

/**
 * Pure vector Tokyo Kissaten Hanko Seal (Vermilion stamp)
 */
function drawHankoSeal(ctx, cx, cy, size = 30) {
  ctx.save();
  const s = size;
  const x = cx - s / 2;
  const y = cy - s / 2;
  ctx.fillStyle = 'rgba(185, 28, 28, 0.08)';
  ctx.strokeStyle = '#B91C1C';
  ctx.lineWidth = 1.8;
  drawRoundedRect(ctx, x, y, s, s, 4, true, true);

  ctx.fillStyle = '#B91C1C';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${Math.round(s * 0.42)}px "Playfair Display", Georgia, serif`;
  ctx.fillText('珈琲', cx, cy);
  ctx.restore();
}

/**
 * Pure vector Die-Cut Notches & Tear-Off Perforation Module
 */
export function drawTicketNotchesAndPerforation(ctx, x, width, notchY, style, bgColor) {
  const theme = getCardTheme(style);
  const fillBg = bgColor || theme.bg;
  const radius = 11;

  ctx.save();

  // Left & Right semi-circular notches
  ctx.fillStyle = fillBg;
  ctx.beginPath();
  ctx.arc(x, notchY, radius, -Math.PI / 2, Math.PI / 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x + width, notchY, radius, Math.PI / 2, (3 * Math.PI) / 2);
  ctx.fill();

  // Notch borders
  ctx.lineWidth = theme.id === 'neobrutalist' ? 2.2 : 1.2;
  ctx.strokeStyle = theme.border;
  ctx.beginPath();
  ctx.arc(x, notchY, radius, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(x + width, notchY, radius, Math.PI / 2, (3 * Math.PI) / 2);
  ctx.stroke();

  // Dashed perforation line
  ctx.setLineDash([5, 5]);
  ctx.lineWidth = theme.id === 'neobrutalist' ? 1.8 : 1.2;
  ctx.strokeStyle = theme.border;
  ctx.beginPath();
  ctx.moveTo(x + radius + 6, notchY);
  ctx.lineTo(x + width - radius - 6, notchY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.restore();
}

/**
 * Normalizes recipe pours and calculates cumulative target water (en balanza) for each stage.
 */
export function normalizeRecipePours(rec) {
  if (!rec) return [];
  let list = Array.isArray(rec.pours) ? [...rec.pours] : [];

  const notesText = rec.notes || rec.user_notes || '';
  if (list.length === 0 && notesText && typeof notesText === 'string' && notesText.includes('Vertidos:')) {
    try {
      const match = notesText.match(/Vertidos:\s*([^\]]+)/i);
      if (match && match[1]) {
        const parts = match[1].split('→').map(s => s.trim()).filter(Boolean);
        list = parts.map((part, idx) => {
          const label = part.split('(')[0].trim();
          const accumMatch = part.match(/Acum:\s*(\d+(\.\d+)?)/i) || part.match(/→\s*(\d+(\.\d+)?)/);
          const stepMatch = part.match(/\+?(\d+(\.\d+)?)g/);
          const stepW = stepMatch ? parseFloat(stepMatch[1]) : 0;
          const totalW = accumMatch ? parseFloat(accumMatch[1]) : undefined;
          return {
            step: idx + 1,
            label,
            water_g: stepW,
            total_water_g: totalW
          };
        });
      }
    } catch (e) {
      // Graceful fallback
    }
  }

  let running = 0;
  return list.map((p, idx) => {
    const stepW = parseFloat(p.water_g || p.water || p.weight) || 0;
    let totalW = 0;
    if (p.total_water_g !== undefined && p.total_water_g !== null && !isNaN(parseFloat(p.total_water_g))) {
      totalW = parseFloat(p.total_water_g);
      running = totalW;
    } else {
      running += stepW;
      totalW = running;
    }
    return {
      ...p,
      step: p.step || idx + 1,
      label: p.label || p.title || `Vertido 0${idx + 1}`,
      time: p.time || '',
      stepWater: stepW,
      totalWater: totalW
    };
  });
}

/**
 * High-Legibility Extraction Timeline (12px-13px bold milestones)
 */
export function drawExtractionTimeline(ctx, x, y, width, height, recipeData, style) {
  if (!recipeData) return;
  const theme = getCardTheme(style);
  const {
    method = recipeData.methodStr || 'V60',
    brew_time = recipeData.time || recipeData.brew_time || '2:30',
    dose_in_g = recipeData.dose_in_g ?? recipeData.coffee_grams ?? 15,
    dose_out_g = recipeData.dose_out_g ?? recipeData.water_grams ?? recipeData.water_total_g ?? 250,
    ratio = recipeData.ratio || (dose_in_g && dose_out_g ? `1:${(dose_out_g / dose_in_g).toFixed(1)}` : '1:16.6'),
    temperature = recipeData.temp || recipeData.temperature || '93°C'
  } = recipeData;

  const isEspresso = /espresso/i.test(method);
  const isAeropress = /aero/i.test(method);
  const isImmersion = /french|prensa|cupping/i.test(method);

  ctx.save();

  // Header
  ctx.font = `800 12px ${theme.fontMono}`;
  ctx.fillStyle = theme.accent;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const methodLabel = `${(method || 'POUR OVER').toUpperCase()}${temperature ? ' • ' + String(temperature).replace('°C', '') + '°C' : ''}`;
  drawCanvasTruncatedText(ctx, `TIMELINE // ${methodLabel}`, x, y, width * 0.62);

  ctx.font = `700 11.5px ${theme.fontMono}`;
  ctx.fillStyle = theme.textMuted;
  ctx.textAlign = 'right';
  const ratioClean = ratio ? `1:${String(ratio).replace('1:', '')}` : '1:16.6';
  ctx.fillText(`FINAL: ${dose_out_g || 250}g (${ratioClean})`, x + width, y);

  let stages = [];
  const normalizedPours = normalizeRecipePours(recipeData);

  if (normalizedPours && normalizedPours.length > 0) {
    stages = normalizedPours.slice(0, 4).map((p, idx) => {
      const isBloom = idx === 0;
      let label = (p.label || (isBloom ? 'BLOOM' : `VERTIDO ${idx}`)).toUpperCase();
      if (isBloom && !label.includes('BLOOM')) label = 'BLOOM';
      return {
        label,
        time: p.time || (idx === 0 ? '0:00' : ''),
        targetScale: p.totalWater ? `${p.totalWater}g` : (p.stepWater ? `+${p.stepWater}g` : ''),
        flex: Math.max(1, p.stepWater || 1.5)
      };
    });
  } else if (isEspresso) {
    const outG = dose_out_g ? `${dose_out_g}g` : '36g';
    stages = [
      { label: 'BLOOM / PRE', time: '0:00', targetScale: '4g', flex: 1.4 },
      { label: '9 BAR', time: '0:06', targetScale: outG, flex: 2.6 },
      { label: 'CORTE', time: brew_time || '0:28', targetScale: outG, flex: 1.2 }
    ];
  } else if (isAeropress || isImmersion) {
    const outG = dose_out_g ? `${dose_out_g}g` : '200g';
    stages = [
      { label: 'BLOOM / INF', time: '0:00', targetScale: outG, flex: 2.4 },
      { label: 'SWIRL', time: '1:15', targetScale: outG, flex: 1.3 },
      { label: 'PRENSADO', time: brew_time || '1:45', targetScale: 'TAZA', flex: 1.5 }
    ];
  } else {
    const totalW = dose_out_g || (dose_in_g ? Math.round(dose_in_g * 16.6) : 250);
    const bloomW = Math.round(totalW * 0.2);
    const pulse1W = Math.round(totalW * 0.6);
    stages = [
      { label: 'BLOOM', time: '0:00', targetScale: `${bloomW}g`, flex: 1.3 },
      { label: 'PULSO 1', time: '0:45', targetScale: `${pulse1W}g`, flex: 1.8 },
      { label: 'PULSO 2', time: '1:30', targetScale: `${totalW}g`, flex: 1.8 },
      { label: 'FINAL', time: brew_time || '2:30', targetScale: `${totalW}g`, flex: 1.3 }
    ];
  }

  const pillY = y + 10;
  const pillH = 42;
  const gap = 8;
  const totalFlex = stages.reduce((acc, st) => acc + st.flex, 0);
  const availW = width - gap * (stages.length - 1);
  let curX = x;

  stages.forEach((st, idx) => {
    const segW = (st.flex / totalFlex) * availW;
    const isFirst = idx === 0;

    drawStyledBox(ctx, curX, pillY, segW, pillH, theme, {
      fill: isFirst ? theme.accentSoft : theme.cardBg,
      stroke: isFirst ? theme.accent : theme.border,
      lineWidth: isFirst ? 1.6 : 1.1,
      radius: 10,
      shadow: false
    });

    ctx.textAlign = 'center';
    ctx.font = `800 12px ${theme.fontMono}`;
    ctx.fillStyle = isFirst ? theme.accent : theme.text;
    drawCanvasTruncatedText(ctx, st.label, curX + segW / 2, pillY + 18, segW - 8);

    const subLabel = [st.time, st.targetScale].filter(Boolean).join(' → ');
    ctx.font = `700 11.5px ${theme.fontMono}`;
    ctx.fillStyle = theme.textMuted;
    drawCanvasTruncatedText(ctx, subLabel, curX + segW / 2, pillY + 34, segW - 8);

    curX += segW + gap;
  });

  ctx.restore();
}

/**
 * Generates an Ultra-Aesthetic Collector Card (Portrait 540 x 760 px @ 2x = 1080 x 1520 px)
 * Supports both "Con Receta" (Barista Telemetry) and "Solo Grano" (Terroir Passport).
 */
export async function generateRecipeCardImage(recipe, template = 'studio', incRecipe = true) {
  const style = normalizeCardStyle(template);
  const theme = getCardTheme(style);

  await ensureFontsLoaded();

  const canvas = document.createElement('canvas');
  const scaleFactor = 2;
  const baseW = 540;
  const baseH = 760;

  canvas.width = baseW * scaleFactor;
  canvas.height = baseH * scaleFactor;

  const ctx = canvas.getContext('2d');
  ctx.scale(scaleFactor, scaleFactor);

  const rec = recipe || {};
  const batch = rec.batch || rec;
  const sensoryData = parseSensoryEvaluation(batch, rec);

  // Strict Truth Data Extraction
  const coffeeName = stripEmojis(rec.batch_name || rec.coffee_name || rec.name || 'Café de Especialidad');
  const origin = stripEmojis(rec.origin || rec.batch_origin || '');
  const roaster = stripEmojis(rec.roaster || rec.batch_roaster || '');
  const producer = stripEmojis(rec.producer || rec.batch_producer || '');
  const process = stripEmojis(rec.process || rec.batch_process || '');
  const variety = stripEmojis(rec.variety || rec.batch_variety || '');
  const rawAltitude = rec.altitude || rec.batch_altitude;
  const altitude = rawAltitude ? `${stripEmojis(String(rawAltitude)).replace(/m$/i, '')}m` : '';
  const roastLevel = stripEmojis(rec.roast_level || rec.roast || '');
  const roastDate = stripEmojis(rec.roast_date || '');
  const notesStr = cleanNotesString(rec.flavor_notes || rec.roaster_notes || rec.batch_roaster_notes || '');
  const flavorTags = extractFlavorTags(notesStr);

  const rawSca = rec.sca_score || rec.score;
  const scaScore = (rawSca && !isNaN(parseFloat(rawSca)) && parseFloat(rawSca) > 0) ? parseFloat(rawSca) : null;

  const remainingDoses = (rec.remaining_doses !== undefined && rec.remaining_doses !== null && rec.remaining_doses !== '')
    ? parseInt(rec.remaining_doses, 10)
    : null;
  const dosesStr = remainingDoses !== null ? `${remainingDoses} TUBOS EN CAVA` : '';

  const subtitleTokens = [origin, process, variety, altitude].filter(Boolean);
  const subtitleStr = subtitleTokens.join(' • ') || 'CAFÉ DE ESPECIALIDAD';

  // Recipe parameters
  const rawMethodStr = stripEmojis(rec.method || 'V60');
  const methodStr = rawMethodStr.toLowerCase().includes('pulsar') ? 'PULSAR NO-BYPASS' : rawMethodStr;
  const coffeeG = rec.coffee_grams || rec.dose_in_g || (incRecipe ? 15 : null);
  const waterG = rec.water_grams || rec.dose_out_g || rec.water_total_g || (coffeeG ? Math.round(coffeeG * 16) : null);
  const ratioStr = rec.ratio || (coffeeG && coffeeG > 0 && waterG ? `1:${(waterG / coffeeG).toFixed(1)}` : '1:16');
  const cleanRatio = String(ratioStr || '1:16').replace('1:', '');
  const grindStr = stripEmojis(rec.grind_size || rec.grind || 'Medio');
  const microns = parseGrindToMicrons(grindStr);
  const tempStr = rec.temp || rec.temperature ? `${String(rec.temp || rec.temperature).replace('°C', '')}°C` : '93°C';
  const timeStr = rec.time || rec.brew_time ? `${stripEmojis(String(rec.time || rec.brew_time)).replace(' min', '')}` : '2:30';

  const activeGrinderObj = rec.active_grinder_dial || (rec.grinder_id ? { grinder_id: rec.grinder_id, dial: rec.grind } : null);
  const grinderId = (activeGrinderObj && activeGrinderObj.grinder_id) || rec.grinder_id || rec.grinder || batch.grinder || null;
  const grinderConfig = (GRINDERS && Array.isArray(GRINDERS)) ? (GRINDERS.find(g => g.id === grinderId || (grinderId && String(grinderId).includes(g.id)) || (grinderId && g.id.includes(String(grinderId)))) || null) : null;
  const grinderName = (activeGrinderObj && activeGrinderObj.grinder_name)
    || (grinderConfig ? (grinderConfig.shortName || grinderConfig.name) : null)
    || (typeof rec.grinder === 'string' && rec.grinder ? rec.grinder : (typeof batch.grinder === 'string' && batch.grinder ? batch.grinder : null));

  let rawDial = (activeGrinderObj && activeGrinderObj.dial) || rec.grind_size || rec.grind || '';
  if (grinderName && rawDial.toLowerCase().startsWith(grinderName.toLowerCase())) {
    rawDial = rawDial.slice(grinderName.length).replace(/^[:\s-]+/, '');
  }
  const grindDisplayVal = stripEmojis(rawDial || 'Medio');
  const parsedRating = (rec.rating !== undefined && rec.rating !== null && Number.isFinite(parseFloat(rec.rating))) ? parseFloat(rec.rating) : null;

  // 1. Outer Canvas Background
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, baseW, baseH);

  // Subtle grid on Dark Espresso Lab
  if (style === 'blueprint') {
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.05)';
    ctx.lineWidth = 1;
    for (let gx = 0; gx <= baseW; gx += 24) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, baseH); ctx.stroke();
    }
    for (let gy = 0; gy <= baseH; gy += 24) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(baseW, gy); ctx.stroke();
    }
  }

  // 2. Main Collector Card Container
  const cardX = 20;
  const cardY = 20;
  const cardW = baseW - 40; // 500px
  const cardH = baseH - 40; // 720px
  const innerX = cardX + 26;
  const innerW = cardW - 52; // 448px

  drawStyledBox(ctx, cardX, cardY, cardW, cardH, theme, {
    fill: theme.cardBg,
    stroke: theme.border,
    lineWidth: style === 'neobrutalist' ? 2.5 : (style === 'diner' || style === 'kissaten' ? 2 : 1.5),
    radius: theme.cornerRadius,
    shadow: style === 'neobrutalist'
  });

  // Style-specific architectural framing details
  if (style === 'kissaten') {
    // Inner traditional sumi/vermilion hairline frame
    ctx.strokeStyle = 'rgba(185, 28, 28, 0.28)';
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, cardX + 6, cardY + 6, cardW - 12, cardH - 12, Math.max(4, theme.cornerRadius - 4), false, true);
  } else if (style === 'diner') {
    // Inner botanical herbarium frame + corner diamond stars
    ctx.strokeStyle = 'rgba(194, 65, 12, 0.35)';
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, cardX + 6, cardY + 6, cardW - 12, cardH - 12, Math.max(4, theme.cornerRadius - 4), false, true);
    ctx.fillStyle = '#C2410C';
    ctx.font = `700 12px ${theme.fontMono}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✦', cardX + 15, cardY + 15);
    ctx.fillText('✦', cardX + cardW - 15, cardY + 15);
    ctx.fillText('✦', cardX + 15, cardY + cardH - 15);
    ctx.fillText('✦', cardX + cardW - 15, cardY + cardH - 15);
  } else if (style === 'blueprint') {
    // Corner HUD targeting reticles
    const drawHudCorner = (cx, cy, dx, dy) => {
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy + dy * 12);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx + dx * 12, cy);
      ctx.stroke();
    };
    drawHudCorner(cardX + 8, cardY + 8, 1, 1);
    drawHudCorner(cardX + cardW - 8, cardY + 8, -1, 1);
    drawHudCorner(cardX + 8, cardY + cardH - 8, 1, -1);
    drawHudCorner(cardX + cardW - 8, cardY + cardH - 8, -1, -1);
  } else if (style === 'studio') {
    // Top solid Swiss architectural bar
    ctx.fillStyle = '#09090B';
    drawRoundedRect(ctx, cardX, cardY, cardW, 10, theme.cornerRadius, true, false);
    ctx.fillRect(cardX, cardY + 5, cardW, 5);
  }

  // =========================================================================
  // ZONE 1: EDITORIAL HEADER & HERO COFFEE IDENTITY
  // =========================================================================
  const headerPillY = cardY + 24;
  const headerPillH = 28;
  const roasterBadgeText = (roaster ? `${roaster} • ${theme.name}` : `BEANTAG • ${theme.badgeLabel}`).toUpperCase();

  ctx.font = `800 12px ${theme.fontMono}`;
  const roasterPillW = Math.min(ctx.measureText(roasterBadgeText).width + 24, innerW - 115);

  const badgeFill = style === 'neobrutalist'
    ? '#FDE68A'
    : (style === 'studio' ? '#09090B' : (style === 'diner' ? '#E2ECE6' : theme.surfaceBg));
  const badgeTextCol = style === 'studio' ? '#FFFFFF' : (style === 'neobrutalist' ? '#18181B' : theme.textSecondary);

  drawStyledBox(ctx, innerX, headerPillY, roasterPillW, headerPillH, theme, {
    fill: badgeFill,
    stroke: style === 'studio' ? '#09090B' : theme.border,
    lineWidth: style === 'neobrutalist' ? 1.8 : 1,
    radius: style === 'studio' ? 4 : 8,
    shadow: style === 'neobrutalist'
  });

  ctx.fillStyle = badgeTextCol;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  drawCanvasTruncatedText(ctx, roasterBadgeText, innerX + 12, headerPillY + headerPillH / 2 + 0.5, roasterPillW - 24);

  // Right Score / Rating Badge (only if real data exists)
  if (scaScore !== null || parsedRating !== null) {
    const scoreText = scaScore !== null ? `SCA ${scaScore} PTS` : `★ ${parsedRating.toFixed(1)} / 5.0`;
    ctx.font = `800 12.5px ${theme.fontMono}`;
    const scoreW = ctx.measureText(scoreText).width + 22;
    const scoreX = innerX + innerW - scoreW;

    drawStyledBox(ctx, scoreX, headerPillY, scoreW, headerPillH, theme, {
      fill: theme.accentBg,
      stroke: theme.borderStrong,
      lineWidth: style === 'neobrutalist' ? 1.8 : 1,
      radius: style === 'studio' ? 4 : 8,
      shadow: style === 'neobrutalist'
    });

    ctx.fillStyle = theme.accentText;
    ctx.textAlign = 'center';
    ctx.fillText(scoreText, scoreX + scoreW / 2, headerPillY + headerPillH / 2 + 0.5);
  } else if (style === 'kissaten') {
    drawHankoSeal(ctx, innerX + innerW - 16, headerPillY + 14, 28);
  }

  // Hero Multi-Line Title (Up to 2 lines, 34px-38px bold)
  const titleStartY = cardY + 86;
  const titleFormatted = style === 'kissaten' ? coffeeName : coffeeName.toUpperCase();
  const titleMetrics = drawHeroTitleBlock(ctx, titleFormatted, innerX, titleStartY, innerW, {
    maxLines: 2,
    maxFontSize: 36,
    minFontSize: 25,
    fontFamily: theme.fontHeading,
    fontWeight: style === 'kissaten' ? 'bold' : '800',
    lineHeightRatio: 1.12,
    color: theme.text
  });

  // Terroir Subtitle Line (14px bold)
  const subY = titleMetrics.bottomY + 24;
  ctx.font = `700 13.5px ${theme.fontMono}`;
  ctx.fillStyle = theme.accent;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  drawCanvasTruncatedText(ctx, subtitleStr.toUpperCase(), innerX, subY, innerW);

  // Ticket Perforation Divider
  const notchY = cardY + 172;
  drawTicketNotchesAndPerforation(ctx, cardX, cardW, notchY, style, theme.bg);

  // =========================================================================
  // ZONE 2: CORE TELEMETRY BENTO (CON RECETA) OR TERROIR PASSPORT (SOLO GRANO)
  // =========================================================================
  const gridY = notchY + 22;
  const gridGap = 12;
  const tileW = (innerW - gridGap) / 2;
  const tileH = 92;

  const tiles = incRecipe
    ? [
        {
          label: style === 'kissaten' ? '抽出器具 // MÉTODO' : 'MÉTODO // BREWER',
          value: methodStr.toUpperCase(),
          sub: `RATIO 1:${cleanRatio}`
        },
        {
          label: style === 'kissaten' ? '抽出量 // DOSIS' : 'DOSIS // IN → OUT',
          value: (coffeeG && waterG) ? `${coffeeG}g → ${waterG}g` : `1:${cleanRatio}`,
          sub: coffeeG ? `${coffeeG}g CAFÉ • ${waterG || ''}g AGUA` : 'FÓRMULA CALIBRADA'
        },
        {
          label: grinderName ? `MOLINO // ${grinderName.toUpperCase()}` : (style === 'kissaten' ? '挽き目 // MOLIENDA' : 'MOLIENDA // DIAL'),
          value: grindDisplayVal.toUpperCase(),
          sub: microns ? `~${microns} µm MICRONES` : 'AJUSTE DE MOLIENDA'
        },
        {
          label: style === 'kissaten' ? '時間・温度 // TIEMPO' : 'TIEMPO & TEMP',
          value: `${timeStr} • ${tempStr}`,
          sub: 'EXTRACCIÓN OBJETIVO'
        }
      ]
    : [
        {
          label: style === 'kissaten' ? '産地 // ORIGEN' : 'ORIGEN & TERROIR',
          value: (origin || 'ORIGEN ÚNICO').toUpperCase(),
          sub: altitude ? `ALTITUD: ${altitude}` : 'TERROIR DE ESPECIALIDAD'
        },
        {
          label: style === 'kissaten' ? '精製 // PROCESO' : 'BENEFICIO / PROCESO',
          value: (process || 'LAVADO / NATURAL').toUpperCase(),
          sub: roastLevel ? `TUESTE: ${roastLevel.toUpperCase()}` : 'BENEFICIO SELECTO'
        },
        {
          label: style === 'kissaten' ? '品種 // VARIEDAD' : 'VARIEDAD BOTÁNICA',
          value: (variety || 'ARABICA').toUpperCase(),
          sub: 'ESPECIE BOTÁNICA'
        },
        {
          label: style === 'kissaten' ? '焙煎所 // TOSTADOR' : 'PRODUCTOR / TOSTADOR',
          value: (producer || roaster || 'LOTE ESPECIAL').toUpperCase(),
          sub: roastDate ? `TOSTADO: ${roastDate}` : (roaster ? `TOSTADOR: ${roaster.toUpperCase()}` : 'TRAZABILIDAD')
        }
      ];

  tiles.forEach((t, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const tx = innerX + col * (tileW + gridGap);
    const ty = gridY + row * (tileH + gridGap);

    const neoTileColors = ['#FDE68A', '#FFFDF9', '#FED7AA', '#E0F2FE'];
    const tileFill = style === 'neobrutalist' ? neoTileColors[idx % neoTileColors.length] : theme.surfaceBg;

    drawStyledBox(ctx, tx, ty, tileW, tileH, theme, {
      fill: tileFill,
      stroke: theme.border,
      lineWidth: style === 'neobrutalist' ? 2.2 : 1.2,
      radius: style === 'studio' ? 6 : 12,
      shadow: style === 'neobrutalist'
    });

    // Style-specific tile accent indicator
    if (style === 'studio') {
      ctx.fillStyle = '#09090B';
      ctx.fillRect(tx, ty + 8, 3.5, tileH - 16);
    } else if (style === 'diner') {
      ctx.fillStyle = '#C2410C';
      ctx.fillRect(tx + 10, ty, tileW - 20, 3);
    } else if (style === 'blueprint') {
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(tx + 8, ty, 36, 2.5);
    } else if (style === 'kissaten') {
      ctx.fillStyle = '#B91C1C';
      ctx.fillRect(tx, ty + 12, 3, 20);
    }

    // Label (12px bold)
    ctx.fillStyle = style === 'neobrutalist' ? '#18181B' : theme.textMuted;
    ctx.font = `800 11.5px ${theme.fontMono}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    drawCanvasTruncatedText(ctx, t.label, tx + 14, ty + 24, tileW - 28);

    // Hero Value (22px bold)
    ctx.fillStyle = style === 'neobrutalist' ? '#18181B' : theme.text;
    ctx.font = `800 21px ${theme.fontHeading}`;
    drawCanvasTruncatedText(ctx, t.value, tx + 14, ty + 54, tileW - 28);

    // Subcaption (12px)
    ctx.fillStyle = style === 'neobrutalist' ? '#3F3F46' : theme.textSecondary;
    ctx.font = `700 11.5px ${theme.fontMono}`;
    drawCanvasTruncatedText(ctx, t.sub, tx + 14, ty + 76, tileW - 28);
  });

  // =========================================================================
  // ZONE 3: TIMELINE (CON RECETA) OR LOTE PASSPORT STRIP (SOLO GRANO)
  // =========================================================================
  const zone3Y = gridY + tileH * 2 + gridGap + 22;

  if (incRecipe) {
    drawExtractionTimeline(ctx, innerX, zone3Y, innerW, 56, rec, style);
  } else {
    const stripH = 54;
    drawStyledBox(ctx, innerX, zone3Y - 6, innerW, stripH, theme, {
      fill: theme.surfaceAlt,
      stroke: theme.border,
      lineWidth: style === 'neobrutalist' ? 2 : 1.2,
      radius: style === 'studio' ? 6 : 12,
      shadow: false
    });

    ctx.fillStyle = theme.accent;
    ctx.font = `800 12px ${theme.fontMono}`;
    ctx.textAlign = 'left';
    ctx.fillText(style === 'kissaten' ? '保存状態 // PASAPORTE DE CAVA' : 'PASAPORTE DE CAVA & CONSERVACIÓN', innerX + 16, zone3Y + 14);

    ctx.fillStyle = theme.text;
    ctx.font = `700 13.5px ${theme.fontBody}`;
    const cellarLine = [
      dosesStr || 'LOTE REGISTRADO EN BODEGA',
      roastLevel ? `TUESTE ${roastLevel.toUpperCase()}` : null,
      scaScore ? `SCA ${scaScore} PTS` : null
    ].filter(Boolean).join(' • ');
    drawCanvasTruncatedText(ctx, cellarLine, innerX + 16, zone3Y + 35, innerW - 32);
  }

  // =========================================================================
  // ZONE 4: SENSORY TASTING PILLS & SCA RADAR CHART
  // =========================================================================
  const sensoryY = zone3Y + 68;
  const sensoryH = 156;

  drawStyledBox(ctx, innerX, sensoryY, innerW, sensoryH, theme, {
    fill: theme.surfaceBg,
    stroke: theme.border,
    lineWidth: style === 'neobrutalist' ? 2.2 : 1.2,
    radius: style === 'studio' ? 8 : 14,
    shadow: style === 'neobrutalist'
  });

  ctx.fillStyle = theme.accent;
  ctx.font = `800 12px ${theme.fontMono}`;
  ctx.textAlign = 'left';
  ctx.fillText(style === 'kissaten' ? '風味特性 // PERFIL SENSORIAL & NOTAS' : 'PERFIL SENSORIAL & NOTAS DE CATA', innerX + 16, sensoryY + 24);

  const hasRadar = incRecipe ? sensoryData !== null : Boolean(rec.sensory_balance || rec.sensory_body || rec.sensory_extraction);
  const pillsAreaW = hasRadar ? innerW - 175 : innerW - 32;

  if (flavorTags.length > 0) {
    let px = innerX + 16;
    let py = sensoryY + 38;
    const pillH = 34;

    flavorTags.slice(0, 6).forEach((tag, idx) => {
      const icon = getScaWheelIcon(tag, style);
      const label = `${icon} ${tag.toUpperCase()}`;
      ctx.font = `800 13.5px ${theme.fontBody}`;
      const pw = Math.min(ctx.measureText(label).width + 24, pillsAreaW);

      if (px + pw > innerX + 16 + pillsAreaW && px > innerX + 16) {
        px = innerX + 16;
        py += pillH + 8;
      }

      if (py + pillH <= sensoryY + sensoryH - 12) {
        const neoPalette = ['#FDE68A', '#FED7AA', '#E9D5FF', '#BAE6FD'];
        const pillFill = style === 'neobrutalist' ? neoPalette[idx % neoPalette.length] : theme.cardBg;

        drawStyledBox(ctx, px, py, pw, pillH, theme, {
          fill: pillFill,
          stroke: style === 'neobrutalist' ? '#18181B' : theme.pillBorder,
          lineWidth: style === 'neobrutalist' ? 1.8 : 1.2,
          radius: style === 'studio' ? 4 : 9,
          shadow: false
        });

        ctx.fillStyle = style === 'neobrutalist' ? '#18181B' : theme.pillText;
        ctx.font = `800 13.5px ${theme.fontBody}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        drawCanvasTruncatedText(ctx, label, px + 12, py + pillH / 2 + 0.5, pw - 20);
        ctx.textBaseline = 'alphabetic';

        px += pw + 8;
      }
    });
  } else {
    ctx.fillStyle = theme.textSecondary;
    ctx.font = `700 14px ${theme.fontBody}`;
    const fallbackNote = notesStr || 'Café de especialidad seleccionado y calibrado en BeanTag.';
    drawCanvasTruncatedText(ctx, fallbackNote, innerX + 16, sensoryY + 64, pillsAreaW);
  }

  if (hasRadar && sensoryData) {
    drawSensoryRadarChart(ctx, innerX + innerW - 84, sensoryY + 84, 38, sensoryData, style);
  }

  // =========================================================================
  // FOOTER SIGNATURE BAR
  // =========================================================================
  const footY = cardY + cardH - 22;
  if (style === 'neobrutalist') {
    // Roastery vector barcode + Nomad stamp
    const barPattern = [3, 1, 2, 3, 1, 2, 1, 3, 2, 1, 2, 3, 1];
    let bx = innerX;
    ctx.fillStyle = '#18181B';
    barPattern.forEach((w, i) => {
      if (i % 2 === 0) ctx.fillRect(bx, footY - 12, w * 2, 14);
      bx += w * 2 + 1.5;
    });
    ctx.font = `800 11.5px ${theme.fontMono}`;
    ctx.textAlign = 'left';
    ctx.fillText(dosesStr || 'NOMAD ROASTERY LOT', bx + 10, footY);
  } else {
    ctx.fillStyle = theme.textMuted;
    ctx.font = `700 11.5px ${theme.fontMono}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    const leftFooter = dosesStr ? `BEANTAG CELLAR • ${dosesStr}` : `BEANTAG SPECIALTY ARCHIVE • ${theme.name}`;
    drawCanvasTruncatedText(ctx, leftFooter, innerX, footY, innerW * 0.68);
  }

  ctx.textAlign = 'right';
  ctx.fillStyle = theme.accent;
  ctx.font = `800 11.5px ${theme.fontMono}`;
  ctx.fillText(incRecipe ? 'BREW PROTOCOL ✓' : 'ORIGIN LOT ✓', innerX + innerW, footY);
  ctx.textAlign = 'left';

  return canvas.toDataURL('image/png', 1.0);
}

/**
 * Generates an Ultra-HD Visual Specialty Coffee Menu Card (Cellar Inventory)
 */
export async function generateCoffeeMenuCardImage(batches, template = 'studio') {
  const style = normalizeCardStyle(template);
  const theme = getCardTheme(style);

  await ensureFontsLoaded();

  const validBatches = Array.isArray(batches) ? batches.filter(b => (b.remaining_doses || b.weight_current_g || 0) > 0) : [];
  const displayList = validBatches.length > 0 ? validBatches : (Array.isArray(batches) ? batches.slice(0, 10) : []);

  const canvas = document.createElement('canvas');
  const scaleFactor = 2;
  const baseW = 540;

  const headerH = 148;
  const itemH = 114;
  const footerH = 74;
  const baseH = Math.max(840, headerH + (displayList.length * itemH) + footerH);

  canvas.width = baseW * scaleFactor;
  canvas.height = baseH * scaleFactor;

  const ctx = canvas.getContext('2d');
  ctx.scale(scaleFactor, scaleFactor);

  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, baseW, baseH);

  const cardX = 20;
  const cardY = 20;
  const cardW = baseW - 40;
  const cardH = baseH - 40;
  const innerX = cardX + 24;
  const innerW = cardW - 48;

  drawStyledBox(ctx, cardX, cardY, cardW, cardH, theme, {
    fill: theme.cardBg,
    stroke: theme.border,
    lineWidth: style === 'neobrutalist' ? 2.5 : 1.5,
    radius: theme.cornerRadius,
    shadow: style === 'neobrutalist'
  });

  // Header
  ctx.fillStyle = theme.accent;
  ctx.font = `800 12px ${theme.fontMono}`;
  ctx.textAlign = 'left';
  ctx.fillText(`BEANTAG CELLAR MENU // ${theme.name}`, innerX, cardY + 34);

  ctx.fillStyle = theme.text;
  ctx.font = `800 28px ${theme.fontHeading}`;
  ctx.fillText('CARTA DE CAFÉS EN CAVA', innerX, cardY + 68);

  ctx.fillStyle = theme.textMuted;
  ctx.font = `700 13px ${theme.fontMono}`;
  ctx.fillText(`${displayList.length} LOTES SELECCIONADOS • CONSERVACIÓN ÓPTIMA`, innerX, cardY + 92);

  ctx.strokeStyle = theme.border;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(innerX, cardY + 108);
  ctx.lineTo(innerX + innerW, cardY + 108);
  ctx.stroke();

  let curY = cardY + 124;

  displayList.forEach((b, idx) => {
    const rowH = itemH - 12;
    drawStyledBox(ctx, innerX, curY, innerW, rowH, theme, {
      fill: theme.surfaceBg,
      stroke: theme.border,
      lineWidth: style === 'neobrutalist' ? 2 : 1.1,
      radius: 12,
      shadow: style === 'neobrutalist'
    });

    // Index badge
    const idxStr = String(idx + 1).padStart(2, '0');
    drawStyledBox(ctx, innerX + 12, curY + 14, 34, 34, theme, {
      fill: theme.accentBg,
      stroke: theme.borderStrong,
      lineWidth: 1.2,
      radius: 8,
      shadow: false
    });

    ctx.fillStyle = theme.accentText;
    ctx.font = `800 14px ${theme.fontMono}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(idxStr, innerX + 29, curY + 31);
    ctx.textBaseline = 'alphabetic';

    // Stock badge top right
    const doseCount = b.remaining_doses !== undefined && b.remaining_doses !== null ? b.remaining_doses : 0;
    const doseBadgeText = doseCount > 0
      ? `${doseCount} TUBOS`
      : (b.remaining_weight_g || b.weight_current_g
          ? `~${Math.round(b.remaining_weight_g || b.weight_current_g)}g`
          : `${doseCount} TUBOS`);

    ctx.font = `800 12px ${theme.fontMono}`;
    const badgeW = Math.max(84, ctx.measureText(doseBadgeText).width + 20);
    const badgeX = innerX + innerW - badgeW - 12;

    drawStyledBox(ctx, badgeX, curY + 12, badgeW, 26, theme, {
      fill: theme.cardBg,
      stroke: theme.border,
      lineWidth: 1,
      radius: 8,
      shadow: false
    });

    ctx.fillStyle = theme.accent;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(doseBadgeText, badgeX + badgeW / 2, curY + 25);
    ctx.textBaseline = 'alphabetic';

    // Coffee Title (20px bold)
    const rawName = stripEmojis(b.batch_name || b.name || b.coffee_name || 'Café');
    ctx.fillStyle = theme.text;
    ctx.font = `800 19px ${theme.fontHeading}`;
    ctx.textAlign = 'left';
    drawCanvasTruncatedText(ctx, rawName, innerX + 56, curY + 30, innerW - badgeW - 80);

    // Metadata line (13px)
    const roasterStr = stripEmojis(b.roaster || '');
    const originStr = stripEmojis(b.origin || '');
    const processStr = stripEmojis(b.process || '');
    const varietyStr = stripEmojis(b.variety || '');
    const metaText = [roasterStr, originStr, processStr, varietyStr].filter(Boolean).join(' • ') || 'Origen Único';

    ctx.fillStyle = theme.textSecondary;
    ctx.font = `700 13px ${theme.fontBody}`;
    drawCanvasTruncatedText(ctx, metaText, innerX + 56, curY + 52, innerW - 70);

    // Flavor Pills (12.5px)
    const rawNotes = cleanNotesString(b.flavor_notes || b.roaster_notes || b.notes || b.batch_roaster_notes || '');
    const parsedTags = extractFlavorTags(rawNotes).slice(0, 3);

    if (parsedTags.length > 0) {
      let pillX = innerX + 56;
      const pillY = curY + 64;
      const pillH = 26;

      parsedTags.forEach((tag) => {
        const scaIcon = getScaWheelIcon(tag, style);
        const tagLabel = `${scaIcon} ${tag.toUpperCase()}`;
        ctx.font = `800 12px ${theme.fontBody}`;
        const pw = ctx.measureText(tagLabel).width + 18;
        if (pillX + pw <= innerX + innerW - 12) {
          drawStyledBox(ctx, pillX, pillY, pw, pillH, theme, {
            fill: theme.cardBg,
            stroke: theme.border,
            lineWidth: 1,
            radius: 7,
            shadow: false
          });
          ctx.fillStyle = theme.text;
          ctx.textBaseline = 'middle';
          ctx.fillText(tagLabel, pillX + 9, pillY + pillH / 2 + 0.5);
          ctx.textBaseline = 'alphabetic';
          pillX += pw + 8;
        }
      });
    }

    curY += itemH;
  });

  // Footer
  ctx.fillStyle = theme.textMuted;
  ctx.font = `700 12px ${theme.fontMono}`;
  ctx.textAlign = 'left';
  ctx.fillText(`BEANTAG SPECIALTY COFFEE // ${new Date().toLocaleDateString('es-ES')}`, innerX, cardY + cardH - 20);

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
 * Renders the Die-Cut Vinyl Sticker Shell with drop-shadow & contour
 */
function drawStickerShell(ctx, x, y, w, h, theme, transparent, baseW, baseH) {
  const radius = theme.cornerRadius + 2;

  if (transparent) {
    ctx.clearRect(0, 0, baseW, baseH);
    ctx.save();
    if (theme.id === 'neobrutalist') {
      ctx.fillStyle = '#18181B';
      drawRoundedRect(ctx, x + 5, y + 5, w + 4, h + 4, radius + 2, true, false);
    } else {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.28)';
      ctx.shadowBlur = 16;
      ctx.shadowOffsetY = 6;
    }

    // White vinyl die-cut rim
    ctx.fillStyle = theme.id === 'blueprint' ? '#1E293B' : '#FFFFFF';
    ctx.strokeStyle = theme.id === 'neobrutalist' ? '#18181B' : '#FFFFFF';
    ctx.lineWidth = 2.5;
    drawRoundedRect(ctx, x - 3, y - 3, w + 6, h + 6, radius + 3, true, true);
    ctx.restore();
  } else {
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, baseW, baseH);
  }

  drawStyledBox(ctx, x, y, w, h, theme, {
    fill: theme.cardBg,
    stroke: theme.borderStrong,
    lineWidth: theme.id === 'neobrutalist' ? 2.5 : 1.5,
    radius,
    shadow: !transparent && theme.id === 'neobrutalist'
  });
}

/**
 * Generates an Ultra-High Legibility Instagram Story Sticker Overlay
 * Supports Horizontal (600 x 300 px) and Vertical (400 x 540 px) @ 2x Retina scale.
 * +60% larger text across all elements for mobile Story readability.
 */
export async function generateCoffeeStickerImage(batchOrRecipe, options = {}) {
  const isVertical = String(options.orientation || '').toLowerCase() === 'vertical';
  const baseW = isVertical ? 400 : 600;
  const baseH = isVertical ? 540 : 300;
  const scale = 2;

  const canvas = typeof document !== 'undefined'
    ? document.createElement('canvas')
    : globalThis.createMockCanvas?.(baseW * scale, baseH * scale);
  if (!canvas) throw new Error('Canvas not supported');
  canvas.width = baseW * scale;
  canvas.height = baseH * scale;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);
  await ensureFontsLoaded();

  const style = normalizeCardStyle(options.template);
  const theme = getCardTheme(style);
  const transparent = Boolean(options.transparent);

  const item = batchOrRecipe || {};
  const coffeeName = stripEmojis(item.batch_name || item.coffee_name || item.name || 'Café de Especialidad');
  const roaster = stripEmojis(item.roaster || item.batch_roaster || '');
  const origin = stripEmojis(item.origin || item.batch_origin || '');
  const variety = stripEmojis(item.variety || item.batch_variety || '');
  const process = stripEmojis(item.process || item.batch_process || '');
  const rawAltitude = stripEmojis(item.altitude || item.batch_altitude || '');
  const altitude = rawAltitude ? `${rawAltitude.replace(/m$/i, '')}m` : '';
  const notesStr = cleanNotesString(item.flavor_notes || item.roaster_notes || item.batch_roaster_notes || item.notes || '');
  const flavorTags = extractFlavorTags(notesStr);
  const sensoryData = parseSensoryEvaluation(item, item.recipe || item);

  const rawSca = item.sca_score || item.score;
  const scaScore = (rawSca && !isNaN(parseFloat(rawSca)) && parseFloat(rawSca) > 0) ? parseFloat(rawSca) : null;

  const pad = transparent ? 14 : 16;
  const cardX = pad;
  const cardY = pad;
  const cardW = baseW - pad * 2;
  const cardH = baseH - pad * 2;
  const innerX = cardX + 24;
  const innerW = cardW - 48;

  drawStickerShell(ctx, cardX, cardY, cardW, cardH, theme, transparent, baseW, baseH);

  // Build Terroir Chips (14px bold, 34px tall)
  const terroirChips = [];
  if (origin) {
    terroirChips.push({
      type: 'origin',
      label: `◈ ${origin.toUpperCase()}${altitude ? ' • ' + altitude : ''}`
    });
  }
  if (process) {
    terroirChips.push({
      type: 'process',
      label: `⚡ ${process.toUpperCase()}`
    });
  }
  if (variety) {
    terroirChips.push({
      type: 'variety',
      label: `✿ ${variety.toUpperCase()}`
    });
  }
  if (terroirChips.length === 0) {
    terroirChips.push({
      type: 'origin',
      label: '◈ CAFÉ DE ESPECIALIDAD'
    });
  }

  // Header Pill (13.5px bold)
  const headerText = (roaster ? `${roaster} // ${theme.name}` : `BEANTAG // ${theme.name}`).toUpperCase();
  ctx.font = `800 13px ${theme.fontMono}`;
  ctx.fillStyle = theme.accent;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  drawCanvasTruncatedText(ctx, headerText, innerX, cardY + 34, scaScore ? innerW - 95 : innerW);

  if (scaScore !== null) {
    const scaLabel = `SCA ${scaScore}★`;
    ctx.font = `800 13px ${theme.fontMono}`;
    ctx.fillStyle = theme.text;
    ctx.textAlign = 'right';
    ctx.fillText(scaLabel, innerX + innerW, cardY + 34);
    ctx.textAlign = 'left';
  }

  if (!isVertical) {
    // =======================================================================
    // HORIZONTAL STORY STICKER (600 x 300 px) — HUGE READABLE TYPOGRAPHY
    // =======================================================================
    const titleFormatted = style === 'kissaten' ? coffeeName : coffeeName.toUpperCase();
    const titleInfo = drawHeroTitleBlock(ctx, titleFormatted, innerX, cardY + 76, innerW, {
      maxLines: 2,
      maxFontSize: 38,
      minFontSize: 26,
      fontFamily: theme.fontHeading,
      fontWeight: style === 'kissaten' ? 'bold' : '800',
      lineHeightRatio: 1.08,
      color: theme.text
    });

    // Terroir Chips Row (14px bold, 34px tall)
    const chipsY = titleInfo.linesDrawn > 1 ? cardY + 132 : cardY + 104;
    const chipH = 34;
    let curChipX = innerX;

    terroirChips.slice(0, 3).forEach((chip, cIdx) => {
      ctx.font = `800 14px ${theme.fontMono}`;
      const cw = Math.min(ctx.measureText(chip.label).width + 24, innerW);
      if (curChipX + cw <= innerX + innerW) {
        drawStyledBox(ctx, curChipX, chipsY, cw, chipH, theme, {
          fill: cIdx === 0 ? theme.accentSoft : theme.surfaceBg,
          stroke: cIdx === 0 ? theme.accent : theme.border,
          lineWidth: style === 'neobrutalist' ? 1.8 : 1.2,
          radius: 9,
          shadow: false
        });
        ctx.fillStyle = cIdx === 0 && style !== 'neobrutalist' ? theme.accent : theme.text;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(chip.label, curChipX + cw / 2, chipsY + chipH / 2 + 0.5);
        ctx.textBaseline = 'alphabetic';
        curChipX += cw + 10;
      }
    });

    // Flavor Notes Hero Row (17.5px bold, 46px tall)
    const flavorY = cardY + cardH - 68;
    const flavorH = 46;
    const tagsToRender = flavorTags.length > 0 ? flavorTags.slice(0, 3) : ['ORIGEN SELECCIONADO'];
    let curFlavorX = innerX;

    tagsToRender.forEach((tag, idx) => {
      const glyph = getScaWheelIcon(tag, style);
      const pillLabel = `${glyph}  ${tag.toUpperCase()}`;
      ctx.font = `800 17px ${theme.fontBody}`;
      const pw = Math.min(ctx.measureText(pillLabel).width + 30, innerW);

      if (curFlavorX + pw <= innerX + innerW) {
        const neoColors = ['#FDE68A', '#FED7AA', '#BAE6FD'];
        const fillCol = style === 'neobrutalist' ? neoColors[idx % neoColors.length] : theme.surfaceBg;

        drawStyledBox(ctx, curFlavorX, flavorY, pw, flavorH, theme, {
          fill: fillCol,
          stroke: style === 'neobrutalist' ? '#18181B' : theme.borderStrong,
          lineWidth: style === 'neobrutalist' ? 2 : 1.3,
          radius: 12,
          shadow: style === 'neobrutalist'
        });

        ctx.fillStyle = style === 'neobrutalist' ? '#18181B' : theme.text;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pillLabel, curFlavorX + pw / 2, flavorY + flavorH / 2 + 0.5);
        ctx.textBaseline = 'alphabetic';

        curFlavorX += pw + 12;
      }
    });
  } else {
    // =======================================================================
    // VERTICAL STORY STICKER (400 x 540 px) — COLLECTOR BADGE + RADAR
    // =======================================================================
    const titleFormatted = style === 'kissaten' ? coffeeName : coffeeName.toUpperCase();
    const titleInfo = drawHeroTitleBlock(ctx, titleFormatted, innerX, cardY + 74, innerW, {
      maxLines: 2,
      maxFontSize: 34,
      minFontSize: 24,
      fontFamily: theme.fontHeading,
      fontWeight: style === 'kissaten' ? 'bold' : '800',
      lineHeightRatio: 1.1,
      color: theme.text
    });

    // Terroir Chips Wrap (14px bold, 34px tall)
    let chipX = innerX;
    let chipY = titleInfo.bottomY + 18;
    const chipH = 32;

    terroirChips.slice(0, 3).forEach((chip, cIdx) => {
      ctx.font = `800 13.5px ${theme.fontMono}`;
      const cw = Math.min(ctx.measureText(chip.label).width + 22, innerW);
      if (chipX + cw > innerX + innerW && chipX > innerX) {
        chipX = innerX;
        chipY += chipH + 8;
      }
      drawStyledBox(ctx, chipX, chipY, cw, chipH, theme, {
        fill: cIdx === 0 ? theme.accentSoft : theme.surfaceBg,
        stroke: cIdx === 0 ? theme.accent : theme.border,
        lineWidth: style === 'neobrutalist' ? 1.8 : 1.2,
        radius: 8,
        shadow: false
      });
      ctx.fillStyle = cIdx === 0 && style !== 'neobrutalist' ? theme.accent : theme.text;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      drawCanvasTruncatedText(ctx, chip.label, chipX + cw / 2, chipY + chipH / 2 + 0.5, cw - 12);
      ctx.textBaseline = 'alphabetic';
      chipX += cw + 8;
    });

    const dividerY = chipY + chipH + 16;
    ctx.strokeStyle = theme.border;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(innerX, dividerY);
    ctx.lineTo(innerX + innerW, dividerY);
    ctx.stroke();

    const tagsToRender = flavorTags.length > 0 ? flavorTags : ['ORIGEN SELECCIONADO'];

    if (sensoryData) {
      // Radar Chart with 11.5px labels + 3 large 38px flavor pills
      const radarCY = dividerY + 78;
      const radarR = 44;
      drawSensoryRadarChart(ctx, cardX + cardW / 2, radarCY, radarR, sensoryData, style);

      let pillY = radarCY + radarR + 28;
      const pillH = 38;

      tagsToRender.slice(0, 3).forEach((tag, idx) => {
        if (pillY + pillH > cardY + cardH - 14) return;
        const glyph = getScaWheelIcon(tag, style);
        const pillText = `${glyph}   ${tag.toUpperCase()}`;
        const neoColors = ['#FDE68A', '#FED7AA', '#BAE6FD'];
        const fillCol = style === 'neobrutalist' ? neoColors[idx % neoColors.length] : theme.surfaceBg;

        drawStyledBox(ctx, innerX, pillY, innerW, pillH, theme, {
          fill: fillCol,
          stroke: style === 'neobrutalist' ? '#18181B' : theme.border,
          lineWidth: style === 'neobrutalist' ? 1.8 : 1.2,
          radius: 10,
          shadow: false
        });

        ctx.fillStyle = style === 'neobrutalist' ? '#18181B' : theme.text;
        ctx.font = `800 16px ${theme.fontBody}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        drawCanvasTruncatedText(ctx, pillText, innerX + innerW / 2, pillY + pillH / 2 + 0.5, innerW - 24);
        ctx.textBaseline = 'alphabetic';

        pillY += pillH + 8;
      });
    } else {
      // Full Flavor Pills Cascade (18px bold, 46px tall)
      ctx.fillStyle = theme.textMuted;
      ctx.font = `800 12px ${theme.fontMono}`;
      ctx.textAlign = 'left';
      ctx.fillText('NOTAS DE CATA // SENSORY PROFILE:', innerX, dividerY + 24);

      let pillY = dividerY + 38;
      const pillH = 46;

      tagsToRender.slice(0, 4).forEach((tag, idx) => {
        if (pillY + pillH > cardY + cardH - 16) return;
        const glyph = getScaWheelIcon(tag, style);
        const pillText = `${glyph}   ${tag.toUpperCase()}`;
        const neoColors = ['#FDE68A', '#FED7AA', '#E9D5FF', '#BAE6FD'];
        const fillCol = style === 'neobrutalist' ? neoColors[idx % neoColors.length] : theme.surfaceBg;

        drawStyledBox(ctx, innerX, pillY, innerW, pillH, theme, {
          fill: fillCol,
          stroke: style === 'neobrutalist' ? '#18181B' : theme.borderStrong,
          lineWidth: style === 'neobrutalist' ? 2 : 1.2,
          radius: 12,
          shadow: style === 'neobrutalist'
        });

        ctx.fillStyle = style === 'neobrutalist' ? '#18181B' : theme.text;
        ctx.font = `800 17.5px ${theme.fontBody}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        drawCanvasTruncatedText(ctx, pillText, innerX + innerW / 2, pillY + pillH / 2 + 0.5, innerW - 24);
        ctx.textBaseline = 'alphabetic';

        pillY += pillH + 12;
      });
    }
  }

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  return canvas.toDataURL('image/png', 1.0);
}

export const generateBeanCardImage = (recipe, template = 'studio') => generateRecipeCardImage(recipe, template, false);
export const generateMenuCardImage = generateCoffeeMenuCardImage;
export const generateStickerImage = generateCoffeeStickerImage;
