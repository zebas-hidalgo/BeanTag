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

export { getScaWheelIcon, cleanNotesString, getScaCategory, STYLE_SCA_ICONS, drawScaCanvasIcon, getScaCanvasPalette, SCA_CANVAS_PALETTE } from './scaIcons';
import { getScaWheelIcon, cleanNotesString, getScaCategory, STYLE_SCA_ICONS, drawScaCanvasIcon, getScaCanvasPalette } from './scaIcons';

export { parseGrindToMicrons } from './grinders';
import { parseGrindToMicrons, GRINDERS } from './grinders';
import { drawCardAsset, drawMetricAsset, ensureCardAssetsLoaded } from './ticketIconKits';
import { TREND_STYLES, TREND_THEMES, drawTrendCard } from './trendCards';

// 2027 trend styles (squishy, stretch, zine, vhs, lata) render their own feed/story cards.
// Menu and sticker formats reuse the closest classic style.
export const TREND_CARD_STYLES = TREND_STYLES;
function legacyStyleOf(style) {
  return TREND_THEMES[style] ? TREND_THEMES[style].legacy : style;
}

// Export formats (Instagram): feed 4:5 = 1080x1350, story 9:16 = 1080x1920
export const CARD_FORMATS = ['feed', 'story'];
export function getPreferredCardFormat() {
  try { return localStorage.getItem('beantag-card-format') === 'story' ? 'story' : 'feed'; } catch (e) { return 'feed'; }
}
export function setPreferredCardFormat(format) {
  try { localStorage.setItem('beantag-card-format', format === 'story' ? 'story' : 'feed'); } catch (e) {}
}

// Per-style illustration art direction (assets live in ticketIconKits)
const STYLE_ART = {
  studio:       { kit: 'aurora',       recipe: 'aurora_dripper',       bean: 'aurora_water',      icons: null },
  blueprint:    { kit: 'blueprint',    recipe: 'blueprint_dripper',    bean: 'blueprint_scale',   icons: 'blueprint' },
  neobrutalist: { kit: 'neobrutalist', recipe: 'neobrutalist_dripper', bean: 'neobrutalist_star', icons: 'neobrutalist' },
  kissaten:     { kit: 'hangtag',      recipe: 'hangtag_kettle',       bean: 'hangtag_seal',      icons: 'kissaten' },
  diner:        { kit: 'hangtag',      recipe: 'hangtag_timer',        bean: 'hangtag_seed',      icons: 'diner' }
};

/**
 * Draws the style's hero illustration with its own art direction.
 * Returns false if the image is not available (caller keeps full-width layout).
 */
function drawStyleHero(ctx, style, assetKey, x, y, w, h) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const r = Math.min(w, h) / 2;
  ctx.save();
  let drawn = false;
  if (style === 'blueprint') {
    // CAD calibration ring behind a technical drawing
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, 'rgba(56, 189, 248, 0.16)');
    g.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.94, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(([dx, dy]) => {
      ctx.beginPath();
      ctx.moveTo(cx + dx * (r * 0.94 - 5), cy + dy * (r * 0.94 - 5));
      ctx.lineTo(cx + dx * (r * 0.94 + 5), cy + dy * (r * 0.94 + 5));
      ctx.stroke();
    });
    drawn = drawCardAsset(ctx, assetKey, x + 6, y + 6, w - 12, h - 12);
  } else if (style === 'neobrutalist') {
    // Die-cut sticker slapped on the card: tilted, hard offset shadow
    drawn = drawCardAsset(ctx, assetKey, x - 6, y - 6, w + 12, h + 12, {
      rotation: -0.14,
      shadowColor: 'rgba(17, 17, 17, 0.95)',
      shadowBlur: 0,
      shadowOffsetX: 4,
      shadowOffsetY: 4
    });
  } else if (style === 'kissaten' || style === 'diner') {
    // Paper hang-tag on a string
    ctx.strokeStyle = style === 'kissaten' ? 'rgba(185, 28, 28, 0.55)' : 'rgba(21, 94, 63, 0.55)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx, y - 14);
    ctx.quadraticCurveTo(cx - 8, y + 2, cx + 2, y + 16);
    ctx.stroke();
    drawn = drawCardAsset(ctx, assetKey, x, y + 4, w, h - 4, {
      rotation: style === 'kissaten' ? 0.06 : -0.05,
      shadowColor: 'rgba(60, 40, 20, 0.28)',
      shadowBlur: 10,
      shadowOffsetY: 4
    });
  } else {
    // Swiss studio: one product shot, soft floor shadow
    drawn = drawCardAsset(ctx, assetKey, x, y, w, h, {
      shadowColor: 'rgba(9, 9, 11, 0.18)',
      shadowBlur: 18,
      shadowOffsetY: 8
    });
  }
  ctx.restore();
  return drawn;
}

/**
 * Wraps a finished 1080x1350 feed card into a 1080x1920 story canvas.
 * The card sits inside Instagram's safe zone (top/bottom ~250px stay clear).
 */
function composeStoryCanvas(feedCanvas, theme, style, footerText) {
  const story = document.createElement('canvas');
  story.width = 1080;
  story.height = 1920;
  const sctx = story.getContext('2d');
  sctx.fillStyle = theme.bg;
  sctx.fillRect(0, 0, 1080, 1920);
  if (style === 'blueprint') {
    sctx.strokeStyle = 'rgba(56, 189, 248, 0.06)';
    sctx.lineWidth = 2;
    for (let gx = 0; gx <= 1080; gx += 48) { sctx.beginPath(); sctx.moveTo(gx, 0); sctx.lineTo(gx, 1920); sctx.stroke(); }
    for (let gy = 0; gy <= 1920; gy += 48) { sctx.beginPath(); sctx.moveTo(0, gy); sctx.lineTo(1080, gy); sctx.stroke(); }
  }
  const top = Math.round((1920 - feedCanvas.height) / 2);
  sctx.drawImage(feedCanvas, 0, top);
  sctx.fillStyle = theme.textSecondary;
  sctx.font = `800 26px ${theme.fontMono}`;
  sctx.textAlign = 'center';
  sctx.textBaseline = 'alphabetic';
  sctx.fillText(footerText, 540, top + feedCanvas.height + 70);
  return story;
}

/**
 * Normalizes template names to the 5 official collector styles:
 * 'blueprint' | 'neobrutalist' | 'diner' | 'kissaten' | 'studio'
 */
export function normalizeCardStyle(tpl) {
  if (!tpl) return 'studio';
  const lower = String(tpl).toLowerCase();
  if (TREND_STYLES.includes(lower)) return lower;
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
    textSecondary: '#27272A',
    textMuted: '#52525B',
    border: '#D4D4D8',
    borderStrong: '#18181B',
    borderSubtle: 'rgba(9, 9, 11, 0.12)',
    accent: '#18181B',
    accentBg: '#18181B',
    accentText: '#FFFFFF',
    accentSoft: '#F4F4F5',
    pillBg: '#FFFFFF',
    pillBorder: '#D4D4D8',
    pillText: '#09090B',
    radarFill: 'rgba(24, 24, 27, 0.14)',
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
    textSecondary: '#292524',
    textMuted: '#57534E',
    border: '#D6CFC1',
    borderStrong: '#1C1917',
    borderSubtle: 'rgba(28, 25, 23, 0.14)',
    accent: '#B91C1C',
    accentBg: '#B91C1C',
    accentText: '#FFFFFF',
    accentSoft: 'rgba(185, 28, 28, 0.10)',
    pillBg: '#FAF7F0',
    pillBorder: '#C7BFAE',
    pillText: '#1C1917',
    radarFill: 'rgba(185, 28, 28, 0.18)',
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
    textSecondary: '#E2E8F0',
    textMuted: '#94A3B8',
    border: 'rgba(56, 189, 248, 0.38)',
    borderStrong: '#38BDF8',
    borderSubtle: 'rgba(56, 189, 248, 0.16)',
    accent: '#38BDF8',
    accentBg: 'rgba(56, 189, 248, 0.20)',
    accentText: '#38BDF8',
    accentSoft: 'rgba(56, 189, 248, 0.14)',
    pillBg: '#131C31',
    pillBorder: '#38BDF8',
    pillText: '#F8FAFC',
    radarFill: 'rgba(56, 189, 248, 0.26)',
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
    textSecondary: '#18181B',
    textMuted: '#3F3F46',
    border: '#18181B',
    borderStrong: '#18181B',
    borderSubtle: 'rgba(24, 24, 27, 0.22)',
    accent: '#EA580C',
    accentBg: '#FDE68A',
    accentText: '#18181B',
    accentSoft: '#FED7AA',
    pillBg: '#FEF3C7',
    pillBorder: '#18181B',
    pillText: '#18181B',
    radarFill: 'rgba(234, 88, 12, 0.24)',
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
    textSecondary: '#143326',
    textMuted: '#355848',
    border: '#B5CBBF',
    borderStrong: '#143326',
    borderSubtle: 'rgba(20, 51, 38, 0.16)',
    accent: '#C2410C',
    accentBg: '#C2410C',
    accentText: '#FFFFFF',
    accentSoft: '#FFEDD5',
    pillBg: '#FCFDFB',
    pillBorder: '#86A797',
    pillText: '#143326',
    radarFill: 'rgba(194, 65, 12, 0.20)',
    radarStroke: '#C2410C',
    fontHeading: '"Outfit", "Space Grotesk", sans-serif',
    fontBody: '"Plus Jakarta Sans", "Space Grotesk", sans-serif',
    fontMono: '"JetBrains Mono", monospace',
    shadowOffset: 0,
    cornerRadius: 16
  }
};

export function getCardTheme(style) {
  const norm = legacyStyleOf(normalizeCardStyle(style));
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
export function drawCanvasTruncatedText(ctx, text, x, y, maxWidth, options = {}) {
  const str = String(text || '');
  if (!maxWidth || ctx.measureText(str).width <= maxWidth) {
    ctx.fillText(str, x, y);
    return;
  }
  // 1) Shrink the font (down to 82% of its size, min 11px) before cutting text
  const originalFont = ctx.font;
  const m = originalFont.match(/(\d+(?:\.\d+)?)px/);
  if (m && options.shrink !== false) {
    const base = parseFloat(m[1]);
    const floor = Math.max(options.minPx || 11, base * (options.minScale || 0.82));
    for (let size = base - 0.5; size >= floor; size -= 0.5) {
      ctx.font = originalFont.replace(m[0], `${size}px`);
      if (ctx.measureText(str).width <= maxWidth) {
        ctx.fillText(str, x, y);
        ctx.font = originalFont;
        return;
      }
    }
    ctx.font = originalFont.replace(m[0], `${floor}px`);
  }
  // 2) Still too long: truncate with ellipsis at the smallest size
  let truncated = str;
  while (truncated.length > 0 && ctx.measureText(truncated + '…').width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  ctx.fillText(truncated.trimEnd() + '…', x, y);
  ctx.font = originalFont;
}

/**
 * Wraps text into up to maxLines lines inside maxWidth. Last line is fitted/truncated.
 */
function drawWrappedText(ctx, text, x, y, maxWidth, lineH, maxLines = 2) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const cand = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(cand).width <= maxWidth || !cur) cur = cand;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) {
    lines[maxLines - 1] = lines.slice(maxLines - 1).join(' ');
    lines.length = maxLines;
  }
  lines.forEach((l, i) => drawCanvasTruncatedText(ctx, l, x, y + i * lineH, maxWidth, { shrink: i === lines.length - 1 }));
  return lines.length;
}

/**
 * Multi-line title wrapper (up to maxLines) with automatic font-size fitting so titles are huge & readable
 */
function drawHeroTitleBlock(ctx, text, x, y, maxWidth, options = {}) {
  const {
    maxLines = 2,
    maxFontSize = 44,
    minFontSize = 28,
    fontFamily = '"Space Grotesk", sans-serif',
    fontWeight = '800',
    lineHeightRatio = 1.08,
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
    lineWidth = theme.id === 'neobrutalist' ? 2.4 : 1.4,
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
 * Draws a Flavor Note Pill with a custom-illustrated SCA semantic circular badge icon
 * AND registers the style-specific SCA glyph for automated telemetry verification.
 */
function drawFlavorNotePill(ctx, tag, x, y, w, h, style, theme, options = {}) {
  const pal = getScaCanvasPalette(tag);
  const fontSize = options.fontSize || 17;
  const badgeRadius = options.badgeRadius || Math.min(17, Math.floor((h - 8) / 2));

  // Semantic SCA tinted pill background & border so each note flavor family stands out visually
  const pillFill = style === 'blueprint'
    ? 'rgba(19, 28, 49, 0.96)'
    : pal.bg;
  const pillStroke = style === 'neobrutalist'
    ? '#18181B'
    : pal.border;

  drawStyledBox(ctx, x, y, w, h, theme, {
    fill: pillFill,
    stroke: pillStroke,
    lineWidth: style === 'neobrutalist' ? 2.4 : 1.8,
    radius: style === 'studio' ? 8 : 12,
    shadow: Boolean(options.shadow && style === 'neobrutalist')
  });

  // Left Semantic Circular Vector Icon Badge
  const badgeCX = x + 8 + badgeRadius;
  const badgeCY = y + h / 2;

  drawScaCanvasIcon(ctx, tag, badgeCX, badgeCY, badgeRadius, {
    badgeBg: pal.badgeBg,
    iconColor: '#FFFFFF',
    borderColor: style === 'neobrutalist' ? '#18181B' : 'rgba(255, 255, 255, 0.5)',
    borderWidth: style === 'neobrutalist' ? 2.0 : 1.5
  });

  // Bold High-Contrast Flavor Text
  const textX = badgeCX + badgeRadius + 10;
  const maxTextW = Math.max(24, w - (textX - x) - 10);

  ctx.save();
  ctx.fillStyle = style === 'blueprint' ? '#F8FAFC' : (style === 'neobrutalist' ? '#18181B' : pal.icon);
  ctx.font = `800 ${fontSize}px ${theme.fontBody}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  drawCanvasTruncatedText(ctx, tag.toUpperCase(), textX, y + h / 2 + 0.5, maxTextW);

  // Subtle micro-crest watermark on right corner for style signature
  const glyph = getScaWheelIcon(tag, style);
  ctx.font = `700 10px ${theme.fontMono}`;
  ctx.fillStyle = style === 'blueprint' ? 'rgba(248,250,252,0.16)' : 'rgba(24,24,27,0.14)';
  ctx.textAlign = 'right';
  ctx.fillText(glyph, x + w - 7, y + h - 7);
  ctx.restore();
}

/**
 * Draws a 5-axis SCA Sensory Radar Chart with high-legibility 14px labels
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
    ctx.lineWidth = 1.2;
    ctx.stroke();
  });

  // 2. Radial Spines
  for (let i = 0; i < numAxes; i++) {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / numAxes;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
    ctx.strokeStyle = theme.borderSubtle;
    ctx.lineWidth = 1.2;
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
  ctx.lineWidth = 2.4;
  ctx.fill();
  ctx.stroke();

  // 4. Vertex Dots
  for (let i = 0; i < numAxes; i++) {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / numAxes;
    const normVal = Math.max(1, Math.min(5, values[i])) / 5.0;
    const r = normVal * radius;
    ctx.beginPath();
    ctx.arc(cx + r * Math.cos(angle), cy + r * Math.sin(angle), 3.5, 0, 2 * Math.PI);
    ctx.fillStyle = theme.radarStroke;
    ctx.fill();
  }

  // 5. High-legibility 13.5px Axis Labels
  ctx.font = `800 13.5px ${theme.fontMono}`;
  ctx.fillStyle = theme.text;
  for (let i = 0; i < numAxes; i++) {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / numAxes;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    ctx.textAlign = Math.abs(cosA) < 0.25 ? 'center' : (cosA > 0 ? 'left' : 'right');
    ctx.textBaseline = Math.abs(sinA) < 0.25 ? 'middle' : (sinA > 0 ? 'top' : 'bottom');
    const padDist = 8;
    const lx = cx + (radius + padDist) * cosA;
    const ly = cy + (radius + padDist) * sinA;
    ctx.fillText(labels[i], lx, ly);
  }

  ctx.restore();
  return true;
}

/**
 * Draws High-Contrast Sensory Telemetry Strip (Full-Width, 14px-15px bold gauges)
 * Replaces cramped tiny corner radar inside the full card so flavor pills have 100% width.
 */
function drawSensoryTelemetryStrip(ctx, x, y, width, height, sensoryData, style, theme) {
  if (!sensoryData) return false;
  // Only what the barista actually recorded: no derived/invented scores
  const attrs = [
    { label: 'BALANCE', val: sensoryData.balanceLabel },
    { label: 'CUERPO', val: sensoryData.bodyLabel },
    { label: 'EXTRACCIÓN', val: sensoryData.extractionLabel },
    { label: 'VALORACIÓN', val: sensoryData.ratingLabel }
  ].filter(a => a.val);
  if (!attrs.length) return false;

  const gap = 8;
  const chipW = (width - gap * (attrs.length - 1)) / attrs.length;

  ctx.save();
  attrs.forEach((attr, idx) => {
    const cx = x + idx * (chipW + gap);
    drawStyledBox(ctx, cx, y, chipW, height, theme, {
      fill: theme.cardBg,
      stroke: theme.border,
      lineWidth: style === 'neobrutalist' ? 1.8 : 1.1,
      radius: 8,
      shadow: false
    });

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = `800 10.5px ${theme.fontMono}`;
    ctx.fillStyle = theme.textSecondary;
    drawCanvasTruncatedText(ctx, attr.label, cx + 9, y + 14, chipW - 18);

    ctx.font = `800 14px ${theme.fontBody}`;
    ctx.fillStyle = theme.accent;
    drawCanvasTruncatedText(ctx, String(attr.val).toUpperCase(), cx + 9, y + height - 8, chipW - 18, { minScale: 0.62, minPx: 9 });
  });
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

  const word = (v) => (v === undefined || v === null || v === '' ? null : stripEmojis(String(v)).trim());
  const ratingNum = typeof ratingRaw === 'number' ? ratingRaw : parseFloat(ratingRaw);
  return {
    balance, body, extraction, rating, sweetness,
    balanceLabel: word(balanceRaw),
    bodyLabel: word(bodyRaw),
    extractionLabel: word(extractionRaw),
    ratingLabel: Number.isFinite(ratingNum) && ratingNum > 0 ? `★ ${ratingNum % 1 ? ratingNum.toFixed(1) : ratingNum}/5` : null
  };
}

/**
 * Asynchronous Font Loading Barrier
 */
const CARD_FONTS_HREF = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,400;1,600&family=Space+Grotesk:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Caveat:wght@500;600;700&display=swap';

// Card-only fonts load on demand, not on app start
function injectCardFonts() {
  if (document.getElementById('bt-card-fonts')) return Promise.resolve();
  return new Promise((resolve) => {
    const link = document.createElement('link');
    link.id = 'bt-card-fonts';
    link.rel = 'stylesheet';
    link.href = CARD_FONTS_HREF;
    link.onload = resolve;
    link.onerror = resolve;
    document.head.appendChild(link);
  });
}

export async function ensureFontsLoaded() {
  if (typeof document === 'undefined' || !document.fonts) return;
  try {
    await injectCardFonts();
    await Promise.all([
      document.fonts.load('700 18px "Space Grotesk"'),
      document.fonts.load('800 40px "Space Grotesk"'),
      document.fonts.load('700 16px "JetBrains Mono"'),
      document.fonts.load('800 26px "JetBrains Mono"'),
      document.fonts.load('bold 40px "Playfair Display"'),
      document.fonts.load('800 40px "Outfit"').catch(() => {})
    ]);
    await document.fonts.ready;
  } catch (e) {
    // Graceful fallback
  }
}

/**
 * Pure vector Tokyo Kissaten Hanko Seal (Vermilion stamp)
 */
function drawHankoSeal(ctx, cx, cy, size = 32) {
  ctx.save();
  const s = size;
  const x = cx - s / 2;
  const y = cy - s / 2;
  ctx.fillStyle = 'rgba(185, 28, 28, 0.08)';
  ctx.strokeStyle = '#B91C1C';
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, x, y, s, s, 4, true, true);

  ctx.fillStyle = '#B91C1C';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${Math.round(s * 0.44)}px "Playfair Display", Georgia, serif`;
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
  ctx.lineWidth = theme.id === 'neobrutalist' ? 2.2 : 1.4;
  ctx.strokeStyle = theme.border;
  ctx.beginPath();
  ctx.arc(x, notchY, radius, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(x + width, notchY, radius, Math.PI / 2, (3 * Math.PI) / 2);
  ctx.stroke();

  // Dashed perforation line
  ctx.setLineDash([6, 6]);
  ctx.lineWidth = theme.id === 'neobrutalist' ? 1.8 : 1.3;
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
 * Ultra-Legible Extraction Timeline (16px-18px bold key numbers, Strava-style clarity)
 */
export function drawExtractionTimeline(ctx, x, y, width, height, recipeData, style) {
  if (!recipeData) return;
  const theme = getCardTheme(style);
  const {
    method = recipeData.methodStr || 'V60',
    brew_time = recipeData.time || recipeData.brew_time || '2:30',
    dose_in_g = recipeData.dose_in_g ?? recipeData.coffee_grams ?? 15,
    dose_out_g = recipeData.dose_out_g ?? recipeData.water_grams ?? recipeData.water_total_g ?? 250,
    ratio = recipeData.ratio || (dose_in_g && dose_out_g ? `1:${(dose_out_g / dose_in_g).toFixed(1)}` : '1:16.6')
  } = recipeData;

  const isEspresso = /espresso/i.test(method);
  const isAeropress = /aero/i.test(method);
  const isImmersion = /french|prensa|cupping/i.test(method);

  ctx.save();

  // Header (13.5px bold)
  ctx.font = `800 13.5px ${theme.fontMono}`;
  ctx.fillStyle = theme.accent;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  drawCanvasTruncatedText(ctx, `TIMELINE DE EXTRACCIÓN`, x, y, width * 0.58);

  ctx.font = `800 13.5px ${theme.fontMono}`;
  ctx.fillStyle = theme.textSecondary;
  ctx.textAlign = 'right';
  const ratioClean = ratio ? `1:${String(ratio).replace('1:', '')}` : '1:16.6';
  ctx.fillText(`META: ${dose_out_g || 250}g (${ratioClean})`, x + width, y);

  let stages = [];
  const normalizedPours = normalizeRecipePours(recipeData);

  if (normalizedPours && normalizedPours.length > 0) {
    stages = normalizedPours.slice(0, 4).map((p, idx) => {
      const isBloom = idx === 0;
      const shortTag = isBloom ? 'BLOOM' : `P${idx}`;
      const waterVal = p.totalWater ? `${p.totalWater}g` : (p.stepWater ? `+${p.stepWater}g` : '');
      return {
        heroText: isBloom ? `BLOOM ${waterVal}` : waterVal || shortTag,
        subText: p.time || (isBloom ? '0:00' : `PASO ${idx + 1}`),
        flex: isBloom ? 1.35 : 1.0
      };
    });
  } else if (isEspresso) {
    const outG = dose_out_g ? `${dose_out_g}g` : '36g';
    stages = [
      { heroText: 'BLOOM 4g', subText: '0:00 PRE', flex: 1.25 },
      { heroText: `9 BAR → ${outG}`, subText: '0:06 EXT', flex: 1.45 },
      { heroText: `CORTE ${brew_time || '0:28'}`, subText: 'FINAL', flex: 1.2 }
    ];
  } else if (isAeropress || isImmersion) {
    const outG = dose_out_g ? `${dose_out_g}g` : '200g';
    stages = [
      { heroText: `BLOOM ${outG}`, subText: '0:00 INF', flex: 1.35 },
      { heroText: 'SWIRL', subText: '1:15', flex: 1.0 },
      { heroText: `PRENSA`, subText: brew_time || '1:45', flex: 1.15 }
    ];
  } else {
    const totalW = dose_out_g || (dose_in_g ? Math.round(dose_in_g * 16.6) : 250);
    const bloomW = Math.round(totalW * 0.2);
    const pulse1W = Math.round(totalW * 0.6);
    stages = [
      { heroText: `BLOOM ${bloomW}g`, subText: '0:00', flex: 1.45 },
      { heroText: `${pulse1W}g`, subText: '0:45', flex: 1.0 },
      { heroText: `${totalW}g`, subText: '1:30', flex: 1.0 },
      { heroText: `${brew_time || '2:30'}`, subText: 'FINAL', flex: 1.05 }
    ];
  }

  const pillY = y + 9;
  const pillH = 46;
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
      lineWidth: isFirst ? 2 : 1.3,
      radius: 10,
      shadow: false
    });

    ctx.textAlign = 'center';
    ctx.font = `800 15.5px ${theme.fontHeading}`;
    ctx.fillStyle = isFirst && style !== 'neobrutalist' ? theme.accent : theme.text;
    drawCanvasTruncatedText(ctx, st.heroText, curX + segW / 2, pillY + 21, segW - 8);

    ctx.font = `800 12.5px ${theme.fontMono}`;
    ctx.fillStyle = theme.textSecondary;
    drawCanvasTruncatedText(ctx, st.subText, curX + segW / 2, pillY + 38, segW - 8);

    curX += segW + gap;
  });

  ctx.restore();
}

/**
 * Generates an Ultra-Aesthetic Collector Card (Portrait 540 x 760 px @ 2x = 1080 x 1520 px)
 * Strava/Wrapped-grade typography scale + custom Canvas 2D SCA flavor icon badges.
 */
export async function generateRecipeCardImage(recipe, template = 'studio', incRecipe = true, format = getPreferredCardFormat()) {
  const style = normalizeCardStyle(template);
  const theme = getCardTheme(style);

  const isTrend = TREND_STYLES.includes(style);
  const art = STYLE_ART[style] || STYLE_ART.studio;
  await Promise.all([ensureFontsLoaded(), isTrend ? null : ensureCardAssetsLoaded(art.kit)]);

  const canvas = document.createElement('canvas');
  // Feed 4:5: 608x760 logical units rendered at 1080x1350
  const baseW = 608;
  const baseH = 760;
  const scaleFactor = 1080 / baseW;

  canvas.width = 1080;
  canvas.height = 1350;

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
  const methodStr = rawMethodStr.toLowerCase().includes('pulsar')
    ? 'PULSAR'
    : rawMethodStr.replace(/\s*\(filtrado\)/i, '');
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

  // 2027 trend styles: dedicated layouts drawn in 1080x1350 pixel space
  if (isTrend) {
    const note = incRecipe ? stripEmojis(String(rec.notes || rec.user_notes || '')).replace(/\s+/g, ' ').trim() : '';
    const sd = sensoryData || {};
    drawTrendCard(ctx, style, {
      name: coffeeName,
      roaster,
      origin,
      process,
      variety,
      altitude,
      producer,
      roastLevel,
      sca: scaScore,
      method: methodStr,
      coffeeG,
      waterG,
      ratio: cleanRatio,
      grind: grindDisplayVal,
      grinderName,
      time: timeStr,
      temp: tempStr,
      tags: flavorTags,
      note,
      balanceLabel: incRecipe || rec.sensory_balance ? sd.balanceLabel : null,
      bodyLabel: incRecipe || rec.sensory_body ? sd.bodyLabel : null,
      extractionLabel: incRecipe || rec.sensory_extraction ? sd.extractionLabel : null,
      rating: incRecipe ? parsedRating : null,
      ratingLabel: incRecipe && parsedRating ? `★ ${parsedRating % 1 ? parsedRating.toFixed(1) : parsedRating}/5` : null,
      remaining: remainingDoses
    }, incRecipe, baseW / 1080);
    if (format === 'story') {
      return composeStoryCanvas(canvas, TREND_THEMES[style], style, roaster ? `${roaster.toUpperCase()} • BEANTAG` : 'BEANTAG').toDataURL('image/png', 1.0);
    }
    return canvas.toDataURL('image/png', 1.0);
  }

  // 1. Outer Canvas Background
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, baseW, baseH);

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
  const cardX = 18;
  const cardY = 18;
  const cardW = baseW - 36; // 504px
  const cardH = baseH - 36; // 724px
  const innerX = cardX + 24;
  const innerW = cardW - 48; // 456px

  drawStyledBox(ctx, cardX, cardY, cardW, cardH, theme, {
    fill: theme.cardBg,
    stroke: theme.border,
    lineWidth: style === 'neobrutalist' ? 2.5 : (style === 'diner' || style === 'kissaten' ? 2 : 1.5),
    radius: theme.cornerRadius,
    shadow: style === 'neobrutalist'
  });

  // Style-specific architectural framing details
  if (style === 'kissaten') {
    ctx.strokeStyle = 'rgba(185, 28, 28, 0.28)';
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, cardX + 6, cardY + 6, cardW - 12, cardH - 12, Math.max(4, theme.cornerRadius - 4), false, true);
  } else if (style === 'diner') {
    ctx.strokeStyle = 'rgba(194, 65, 12, 0.35)';
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, cardX + 6, cardY + 6, cardW - 12, cardH - 12, Math.max(4, theme.cornerRadius - 4), false, true);
    ctx.fillStyle = '#C2410C';
    ctx.font = `700 13px ${theme.fontMono}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✦', cardX + 15, cardY + 15);
    ctx.fillText('✦', cardX + cardW - 15, cardY + 15);
    ctx.fillText('✦', cardX + 15, cardY + cardH - 15);
    ctx.fillText('✦', cardX + cardW - 15, cardY + cardH - 15);
  } else if (style === 'blueprint') {
    const drawHudCorner = (cx, cy, dx, dy) => {
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2.2;
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
    ctx.fillStyle = '#09090B';
    drawRoundedRect(ctx, cardX, cardY, cardW, 10, theme.cornerRadius, true, false);
    ctx.fillRect(cardX, cardY + 5, cardW, 5);
  }

  // =========================================================================
  // ZONE 1: EDITORIAL HEADER & HERO COFFEE IDENTITY (42px Title + 16px Sub)
  // =========================================================================
  const headerPillY = cardY + 20;
  const headerPillH = 30;
  const roasterBadgeText = (roaster || 'BeanTag').toUpperCase();

  ctx.font = `800 13.5px ${theme.fontMono}`;
  const roasterPillW = Math.min(ctx.measureText(roasterBadgeText).width + 24, innerW - 125);

  const badgeFill = style === 'neobrutalist'
    ? '#FDE68A'
    : (style === 'studio' ? '#09090B' : (style === 'diner' ? '#E2ECE6' : theme.surfaceBg));
  const badgeTextCol = style === 'studio' ? '#FFFFFF' : (style === 'neobrutalist' ? '#18181B' : theme.textSecondary);

  drawStyledBox(ctx, innerX, headerPillY, roasterPillW, headerPillH, theme, {
    fill: badgeFill,
    stroke: style === 'studio' ? '#09090B' : theme.border,
    lineWidth: style === 'neobrutalist' ? 2 : 1.2,
    radius: style === 'studio' ? 5 : 8,
    shadow: style === 'neobrutalist'
  });

  ctx.fillStyle = badgeTextCol;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  drawCanvasTruncatedText(ctx, roasterBadgeText, innerX + 12, headerPillY + headerPillH / 2 + 0.5, roasterPillW - 24);

  // Right Score / Rating Badge
  if (scaScore !== null || parsedRating !== null) {
    const scoreText = scaScore !== null ? `SCA ${scaScore} PTS` : `★ ${parsedRating.toFixed(1)} / 5.0`;
    ctx.font = `800 14px ${theme.fontMono}`;
    const scoreW = ctx.measureText(scoreText).width + 22;
    const scoreX = innerX + innerW - scoreW;

    drawStyledBox(ctx, scoreX, headerPillY, scoreW, headerPillH, theme, {
      fill: theme.accentBg,
      stroke: theme.borderStrong,
      lineWidth: style === 'neobrutalist' ? 2 : 1.2,
      radius: style === 'studio' ? 5 : 8,
      shadow: style === 'neobrutalist'
    });

    ctx.fillStyle = theme.accentText;
    ctx.textAlign = 'center';
    ctx.fillText(scoreText, scoreX + scoreW / 2, headerPillY + headerPillH / 2 + 0.5);
  } else if (style === 'kissaten') {
    drawHankoSeal(ctx, innerX + innerW - 16, headerPillY + 15, 28);
  }

  // Style illustration on the right of the title (each style has its own art direction)
  const heroSize = style === 'neobrutalist' ? 128 : 120;
  const heroX = innerX + innerW - heroSize + (style === 'neobrutalist' ? 6 : 0);
  const heroY = headerPillY + headerPillH + (style === 'kissaten' || style === 'diner' ? 16 : 8);
  const heroDrawn = drawStyleHero(ctx, style, incRecipe ? art.recipe : art.bean, heroX, heroY, heroSize, heroSize);
  const titleMaxW = heroDrawn ? innerW - heroSize - 16 : innerW;

  // Hero Multi-Line Title (Up to 2 lines, 42px bold)
  const titleStartY = cardY + 86;
  const titleFormatted = style === 'kissaten' ? coffeeName : coffeeName.toUpperCase();
  const titleMetrics = drawHeroTitleBlock(ctx, titleFormatted, innerX, titleStartY, titleMaxW, {
    maxLines: 2,
    maxFontSize: 42,
    minFontSize: 28,
    fontFamily: theme.fontHeading,
    fontWeight: style === 'kissaten' ? 'bold' : '800',
    lineHeightRatio: 1.06,
    color: theme.text
  });

  // Terroir Subtitle Line (15.5px bold)
  const subY = titleMetrics.bottomY + 23;
  ctx.font = `800 15.5px ${theme.fontMono}`;
  ctx.fillStyle = theme.accent;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  drawCanvasTruncatedText(ctx, subtitleStr.toUpperCase(), innerX, subY, titleMaxW);

  // Ticket Perforation Divider
  const notchY = cardY + 174;
  drawTicketNotchesAndPerforation(ctx, cardX, cardW, notchY, style, theme.bg);

  // =========================================================================
  // ZONE 2: CORE TELEMETRY BENTO (26px HERO VALUES + 14px LABELS)
  // =========================================================================
  const gridY = notchY + 18;
  const gridGap = 12;
  const tileW = (innerW - gridGap) / 2;
  const tileH = 92;

  const tiles = incRecipe
    ? [
        {
          label: style === 'kissaten' ? '抽出 // MÉTODO' : 'MÉTODO // BREWER',
          value: methodStr.toUpperCase(),
          sub: `RATIO 1:${cleanRatio}`
        },
        {
          label: style === 'kissaten' ? '抽出量 // DOSIS' : 'DOSIS // IN → OUT',
          value: (coffeeG && waterG) ? `${coffeeG}g → ${waterG}g` : `1:${cleanRatio}`,
          sub: coffeeG ? `${coffeeG}g CAFÉ • ${waterG || ''}g AGUA` : 'FÓRMULA CALIBRADA'
        },
        {
          label: grinderName ? `MOLINO // ${grinderName.toUpperCase()}` : 'MOLIENDA // DIAL',
          value: grindDisplayVal.toUpperCase(),
          sub: microns ? `~${microns} µm MICRONES` : 'AJUSTE CALIBRADO'
        },
        {
          label: style === 'kissaten' ? '時間 // TIEMPO & TEMP' : 'TIEMPO & TEMP',
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
          sub: roastDate ? `TOSTADO: ${roastDate}` : (roaster ? `${roaster.toUpperCase()}` : 'TRAZABILIDAD')
        }
      ];

  tiles.forEach((t, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const tx = innerX + col * (tileW + gridGap);
    const ty = gridY + row * (tileH + gridGap);

    const neoTileColors = ['#FDE68A', '#FFFDF9', '#FED7AA', '#E0F2FE'];
    const tileFill = style === 'neobrutalist' ? neoTileColors[idx % neoTileColors.length] : theme.surfaceBg;

    if (style === 'studio') {
      // Swiss grid: no boxes, just a strong rule on top of each cell
      ctx.fillStyle = '#09090B';
      ctx.fillRect(tx, ty, tileW, 2);
    } else {
      drawStyledBox(ctx, tx, ty, tileW, tileH, theme, {
        fill: tileFill,
        stroke: theme.border,
        lineWidth: style === 'neobrutalist' ? 2.2 : 1.3,
        radius: 12,
        shadow: style === 'neobrutalist'
      });
    }

    const metricTypes = ['method', 'dose', 'grind', 'time'];
    const hasIcon = Boolean(incRecipe && art.icons);
    if (hasIcon) {
      drawMetricAsset(ctx, art.icons, metricTypes[idx], tx + tileW - 24, ty + 24, style === 'neobrutalist' ? 34 : 28);
    }
    const tilePad = style === 'studio' ? 0 : 14;
    const textW = tileW - tilePad - 12 - (hasIcon ? 34 : 0);

    // Style-specific tile accent bar
    if (style === 'studio') {
      // (rule drawn above)
    } else if (style === 'diner') {
      ctx.fillStyle = '#C2410C';
      ctx.fillRect(tx + 10, ty, tileW - 20, 3.5);
    } else if (style === 'blueprint') {
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(tx + 8, ty, 44, 3);
    } else if (style === 'kissaten') {
      ctx.fillStyle = '#B91C1C';
      ctx.fillRect(tx, ty + 12, 3.5, 22);
    }

    // Label (13.5px bold)
    ctx.fillStyle = style === 'neobrutalist' ? '#18181B' : theme.textMuted;
    ctx.font = `800 13px ${theme.fontMono}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    drawCanvasTruncatedText(ctx, t.label, tx + tilePad, ty + 23, textW);

    // Hero Value (25px bold)
    ctx.fillStyle = style === 'neobrutalist' ? '#18181B' : theme.text;
    ctx.font = `800 ${style === 'studio' ? 28 : 24.5}px ${theme.fontHeading}`;
    drawCanvasTruncatedText(ctx, t.value, tx + tilePad, ty + 55, tileW - tilePad - 12);

    // Subcaption (13.5px bold)
    ctx.fillStyle = style === 'neobrutalist' ? '#27272A' : theme.textSecondary;
    ctx.font = `700 13.5px ${theme.fontMono}`;
    drawCanvasTruncatedText(ctx, t.sub, tx + tilePad, ty + 78, tileW - tilePad - 12);
  });

  // =========================================================================
  // ZONE 3: EXTRACTION TIMELINE (CON RECETA) OR PASSPORT STRIP (SOLO GRANO)
  // =========================================================================
  const zone3Y = gridY + tileH * 2 + gridGap + 18;

  if (incRecipe) {
    drawExtractionTimeline(ctx, innerX, zone3Y, innerW, 56, rec, style);
  } else {
    const stripH = 54;
    drawStyledBox(ctx, innerX, zone3Y - 6, innerW, stripH, theme, {
      fill: theme.surfaceAlt,
      stroke: theme.border,
      lineWidth: style === 'neobrutalist' ? 2.2 : 1.3,
      radius: style === 'studio' ? 8 : 12,
      shadow: false
    });

    ctx.fillStyle = theme.accent;
    ctx.font = `800 13px ${theme.fontMono}`;
    ctx.textAlign = 'left';
    ctx.fillText(style === 'kissaten' ? '保存状態 // PASAPORTE DE CAVA' : 'PASAPORTE DE CAVA & CONSERVACIÓN', innerX + 16, zone3Y + 13);

    ctx.fillStyle = theme.text;
    ctx.font = `800 16px ${theme.fontBody}`;
    const cellarLine = [
      dosesStr || 'LOTE EN BODEGA',
      roastLevel ? `TUESTE ${roastLevel.toUpperCase()}` : null,
      scaScore ? `SCA ${scaScore} PTS` : null
    ].filter(Boolean).join(' • ');
    drawCanvasTruncatedText(ctx, cellarLine, innerX + 16, zone3Y + 37, innerW - 32);
  }

  // =========================================================================
  // ZONE 4: FULL-WIDTH SCA FLAVOR PILLS WITH VECTOR ICON BADGES + SENSORY STRIP
  // =========================================================================
  const sensoryY = zone3Y + 66;
  const sensoryH = 180;

  if (style === 'studio') {
    ctx.fillStyle = '#09090B';
    ctx.fillRect(innerX, sensoryY, innerW, 2);
  } else {
    drawStyledBox(ctx, innerX, sensoryY, innerW, sensoryH, theme, {
      fill: theme.surfaceBg,
      stroke: theme.border,
      lineWidth: style === 'neobrutalist' ? 2.2 : 1.3,
      radius: 14,
      shadow: style === 'neobrutalist'
    });
  }

  ctx.fillStyle = theme.accent;
  ctx.font = `800 13.5px ${theme.fontMono}`;
  ctx.textAlign = 'left';
  ctx.fillText(style === 'kissaten' ? '風味特性 // NOTAS DE CATA & PERFIL SCA' : 'NOTAS DE CATA & PERFIL SENSORIAL SCA', innerX + (style === 'studio' ? 0 : 16), sensoryY + 23);

  const hasSensoryStrip = incRecipe ? sensoryData !== null : Boolean(rec.sensory_balance || rec.sensory_body || rec.sensory_extraction);
  // The barista's own cup note (recipe cards only) is the most personal data on the card
  const userNote = incRecipe ? stripEmojis(String(rec.notes || rec.user_notes || '')).replace(/\s+/g, ' ').trim() : '';
  const tagsToDraw = flavorTags.slice(0, userNote ? 2 : 4);

  // 2x2 Full-Width Flavor Pills Grid with Vector SCA Icon Badges
  const pillAreaX = innerX + (style === 'studio' ? 0 : 14);
  const pillAreaW = innerW - (style === 'studio' ? 0 : 28);
  const pillGap = 10;
  const pillCols = tagsToDraw.length === 1 ? 1 : 2;
  const pillW = pillCols === 1 ? pillAreaW : (pillAreaW - pillGap) / 2;
  const pillH = hasSensoryStrip ? 42 : 52;
  const pillStartY = sensoryY + 34;

  tagsToDraw.forEach((tag, idx) => {
    const col = idx % pillCols;
    const row = Math.floor(idx / pillCols);
    const px = pillAreaX + col * (pillW + pillGap);
    const py = pillStartY + row * (pillH + 8);

    drawFlavorNotePill(ctx, tag, px, py, pillW, pillH, style, theme, {
      index: idx,
      fontSize: hasSensoryStrip ? 16.5 : 18,
      badgeRadius: hasSensoryStrip ? 13 : 15,
      shadow: false
    });
  });

  const tagRows = tagsToDraw.length ? Math.ceil(tagsToDraw.length / pillCols) : 0;
  const noteTop = pillStartY + tagRows * (pillH + 8);
  const noteBottom = hasSensoryStrip ? sensoryY + sensoryH - 56 : sensoryY + sensoryH - 12;
  if (userNote && noteBottom - noteTop >= 22) {
    ctx.save();
    ctx.fillStyle = theme.text;
    ctx.font = `italic 600 15px ${theme.fontBody}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    const lines = Math.max(1, Math.min(3, Math.floor((noteBottom - noteTop) / 20)));
    drawWrappedText(ctx, `“${userNote}”`, pillAreaX + 4, noteTop + 16, pillAreaW - 8, 20, lines);
    ctx.restore();
  } else if (!tagsToDraw.length) {
    ctx.save();
    ctx.fillStyle = theme.textSecondary;
    ctx.font = `700 15px ${theme.fontBody}`;
    ctx.textAlign = 'left';
    ctx.fillText('Sin notas de cata registradas', pillAreaX + 4, pillStartY + 22);
    ctx.restore();
  }

  if (hasSensoryStrip && sensoryData) {
    const stripY = sensoryY + sensoryH - 50;
    drawSensoryTelemetryStrip(ctx, pillAreaX, stripY, pillAreaW, 42, sensoryData, style, theme);
  }

  // =========================================================================
  // FOOTER SIGNATURE BAR (13.5px bold)
  // =========================================================================
  const footY = cardY + cardH - 16;
  if (style === 'neobrutalist') {
    const barPattern = [3, 1, 2, 3, 1, 2, 1, 3, 2, 1, 2, 3, 1];
    let bx = innerX;
    ctx.fillStyle = '#18181B';
    barPattern.forEach((w, i) => {
      if (i % 2 === 0) ctx.fillRect(bx, footY - 12, w * 2, 14);
      bx += w * 2 + 1.5;
    });
    ctx.font = `800 13px ${theme.fontMono}`;
    ctx.textAlign = 'left';
    ctx.fillText(dosesStr || 'NOMAD ROASTERY LOT', bx + 10, footY);
  } else {
    ctx.fillStyle = theme.textSecondary;
    ctx.font = `800 13px ${theme.fontMono}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    const leftFooter = dosesStr ? `BEANTAG CELLAR • ${dosesStr}` : 'BEANTAG ARCHIVE';
    drawCanvasTruncatedText(ctx, leftFooter, innerX, footY, innerW * 0.68);
  }

  ctx.textAlign = 'right';
  ctx.fillStyle = theme.accent;
  ctx.font = `800 13px ${theme.fontMono}`;
  ctx.fillText(incRecipe ? 'BREW PROTOCOL ✓' : 'ORIGIN LOT ✓', innerX + innerW, footY);
  ctx.textAlign = 'left';

  if (format === 'story') {
    return composeStoryCanvas(canvas, theme, style, roaster ? `${roaster.toUpperCase()} • BEANTAG` : 'BEANTAG').toDataURL('image/png', 1.0);
  }
  return canvas.toDataURL('image/png', 1.0);
}

/**
 * Generates an Ultra-HD Visual Specialty Coffee Menu Card (Cellar Inventory)
 * Upgraded with bigger fonts and custom SCA vector icon badges per note.
 */
export async function generateCoffeeMenuCardImage(batches, template = 'studio') {
  const style = legacyStyleOf(normalizeCardStyle(template));
  const theme = getCardTheme(style);

  await ensureFontsLoaded();

  const validBatches = Array.isArray(batches) ? batches.filter(b => (b.remaining_doses || b.weight_current_g || 0) > 0) : [];
  const displayList = validBatches.length > 0 ? validBatches : (Array.isArray(batches) ? batches.slice(0, 10) : []);

  const canvas = document.createElement('canvas');
  const scaleFactor = 2;
  const baseW = 540;

  const headerH = 152;
  const itemH = 124;
  const footerH = 74;
  const baseH = headerH + (Math.max(1, displayList.length) * itemH) + footerH;

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
  ctx.font = `800 13.5px ${theme.fontMono}`;
  ctx.textAlign = 'left';
  ctx.fillText('BEANTAG CELLAR MENU', innerX, cardY + 34);

  ctx.fillStyle = theme.text;
  ctx.font = `800 32px ${theme.fontHeading}`;
  ctx.fillText('CARTA DE CAFÉS EN CAVA', innerX, cardY + 70);

  ctx.fillStyle = theme.textSecondary;
  ctx.font = `800 14.5px ${theme.fontMono}`;
  ctx.fillText(`${displayList.length} LOTES SELECCIONADOS • CONSERVACIÓN ÓPTIMA`, innerX, cardY + 96);

  ctx.strokeStyle = theme.border;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(innerX, cardY + 112);
  ctx.lineTo(innerX + innerW, cardY + 112);
  ctx.stroke();

  let curY = cardY + 126;

  displayList.forEach((b, idx) => {
    const rowH = itemH - 12;
    drawStyledBox(ctx, innerX, curY, innerW, rowH, theme, {
      fill: theme.surfaceBg,
      stroke: theme.border,
      lineWidth: style === 'neobrutalist' ? 2.2 : 1.2,
      radius: 12,
      shadow: style === 'neobrutalist'
    });

    // Index badge
    const idxStr = String(idx + 1).padStart(2, '0');
    drawStyledBox(ctx, innerX + 12, curY + 14, 36, 36, theme, {
      fill: theme.accentBg,
      stroke: theme.borderStrong,
      lineWidth: 1.4,
      radius: 8,
      shadow: false
    });

    ctx.fillStyle = theme.accentText;
    ctx.font = `800 15px ${theme.fontMono}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(idxStr, innerX + 30, curY + 32);
    ctx.textBaseline = 'alphabetic';

    // Stock badge top right
    const doseCount = b.remaining_doses !== undefined && b.remaining_doses !== null ? b.remaining_doses : 0;
    const doseBadgeText = doseCount > 0
      ? `${doseCount} TUBOS`
      : (b.remaining_weight_g || b.weight_current_g
          ? `~${Math.round(b.remaining_weight_g || b.weight_current_g)}g`
          : `${doseCount} TUBOS`);

    ctx.font = `800 13.5px ${theme.fontMono}`;
    const badgeW = Math.max(92, ctx.measureText(doseBadgeText).width + 22);
    const badgeX = innerX + innerW - badgeW - 12;

    drawStyledBox(ctx, badgeX, curY + 12, badgeW, 28, theme, {
      fill: theme.cardBg,
      stroke: theme.border,
      lineWidth: 1.2,
      radius: 8,
      shadow: false
    });

    ctx.fillStyle = theme.accent;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(doseBadgeText, badgeX + badgeW / 2, curY + 26);
    ctx.textBaseline = 'alphabetic';

    // Coffee Title (22px bold)
    const rawName = stripEmojis(b.batch_name || b.name || b.coffee_name || 'Café');
    ctx.fillStyle = theme.text;
    ctx.font = `800 22px ${theme.fontHeading}`;
    ctx.textAlign = 'left';
    drawCanvasTruncatedText(ctx, rawName, innerX + 58, curY + 32, innerW - badgeW - 84);

    // Metadata line (15px bold)
    const roasterStr = stripEmojis(b.roaster || '');
    const originStr = stripEmojis(b.origin || '');
    const processStr = stripEmojis(b.process || '');
    const varietyStr = stripEmojis(b.variety || '');
    const scaNum = parseFloat(b.sca_score);
    const scaStr = Number.isFinite(scaNum) && scaNum > 0 ? `SCA ${scaNum % 1 ? scaNum.toFixed(1) : scaNum}` : '';
    const metaText = [roasterStr, originStr, processStr, varietyStr, scaStr].filter(Boolean).join(' • ') || 'Origen Único';

    ctx.fillStyle = theme.textSecondary;
    ctx.font = `700 14.5px ${theme.fontBody}`;
    drawCanvasTruncatedText(ctx, metaText, innerX + 58, curY + 55, innerW - 70);

    // Flavor Pills with SCA Vector Badges (14px bold, 32px tall)
    const rawNotes = cleanNotesString(b.flavor_notes || b.roaster_notes || b.notes || b.batch_roaster_notes || '');
    const parsedTags = extractFlavorTags(rawNotes).slice(0, 3);

    if (parsedTags.length > 0) {
      let pillX = innerX + 58;
      const pillY = curY + 68;
      const pillH = 32;

      parsedTags.forEach((tag, pIdx) => {
        ctx.font = `800 14px ${theme.fontBody}`;
        ctx.font = `800 13.5px ${theme.fontBody}`;
        const pw = Math.min(ctx.measureText(tag.toUpperCase()).width + 56, innerW - 70);
        if (pillX + pw <= innerX + innerW - 12) {
          drawFlavorNotePill(ctx, tag, pillX, pillY, pw, pillH, style, theme, {
            index: pIdx,
            fontSize: 13.5,
            badgeRadius: 10,
            shadow: false
          });
          pillX += pw + 8;
        }
      });
    }

    curY += itemH;
  });

  // Footer
  ctx.fillStyle = theme.textSecondary;
  ctx.font = `800 13.5px ${theme.fontMono}`;
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
      ctx.shadowColor = 'rgba(0, 0, 0, 0.32)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 6;
    }

    // White vinyl die-cut rim
    ctx.fillStyle = theme.id === 'blueprint' ? '#1E293B' : '#FFFFFF';
    ctx.strokeStyle = theme.id === 'neobrutalist' ? '#18181B' : '#FFFFFF';
    ctx.lineWidth = 3;
    drawRoundedRect(ctx, x - 3, y - 3, w + 6, h + 6, radius + 3, true, true);
    ctx.restore();
  } else {
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, baseW, baseH);
  }

  drawStyledBox(ctx, x, y, w, h, theme, {
    fill: theme.cardBg,
    stroke: theme.borderStrong,
    lineWidth: theme.id === 'neobrutalist' ? 2.6 : 1.6,
    radius,
    shadow: !transparent && theme.id === 'neobrutalist'
  });
}

/**
 * Generates an Ultra-High Legibility Instagram Story Sticker Overlay
 * Supports Horizontal (640 x 340 px) and Vertical (440 x 580 px) @ 2x Retina scale.
 * Supports both "Perfil & Notas" (includeRecipe: false) and "Telemetría / Receta" (includeRecipe: true).
 */
export async function generateCoffeeStickerImage(batchOrRecipe, options = {}) {
  const isVertical = String(options.orientation || '').toLowerCase() === 'vertical';
  const baseW = isVertical ? 440 : 640;
  const baseH = isVertical ? 580 : 340;
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

  const style = legacyStyleOf(normalizeCardStyle(options.template));
  const theme = getCardTheme(style);
  const transparent = Boolean(options.transparent);
  const includeRecipe = Boolean(options.includeRecipe);

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

  // Recipe telemetry extraction for Sticker Telemetry Mode
  const rawMethodStr = stripEmojis(item.method || (item.recipe && item.recipe.method) || 'V60');
  const methodClean = rawMethodStr.replace(/\s*\(filtrado\)/i, '').toUpperCase();
  const coffeeG = item.coffee_grams || item.dose_in_g || (item.recipe && item.recipe.dose_in_g) || 15;
  const waterG = item.water_grams || item.dose_out_g || item.water_total_g || (coffeeG ? Math.round(coffeeG * 16) : 240);
  const ratioStr = item.ratio || (item.recipe && item.recipe.ratio) || (coffeeG && waterG ? `1:${(waterG / coffeeG).toFixed(1)}` : '1:16');
  const grindRaw = stripEmojis(item.grind_size || item.grind || (item.recipe && item.recipe.grind) || '');
  const tempRaw = item.temp || item.temperature || (item.recipe && item.recipe.temperature) || '93°C';
  const tempClean = `${String(tempRaw).replace('°C', '')}°C`;

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

  // Build Context Chips (either Terroir or Brew Telemetry, 16px bold, 38px tall)
  const contextChips = [];
  if (includeRecipe) {
    contextChips.push({ label: `☕ ${methodClean} • ${ratioStr}` });
    contextChips.push({ label: `⚖ ${coffeeG}g → ${waterG}g` });
    if (grindRaw) {
      contextChips.push({ label: `⚙ ${grindRaw.toUpperCase()}` });
    } else {
      contextChips.push({ label: `🌡 ${tempClean}` });
    }
    if (origin) {
      contextChips.push({ label: `◈ ${origin.toUpperCase()}` });
    }
  } else {
    if (origin) {
      contextChips.push({
        type: 'origin',
        label: `◈ ${origin.toUpperCase()}${altitude ? ' • ' + altitude : ''}`
      });
    }
    if (process) {
      contextChips.push({
        type: 'process',
        label: `⚡ ${process.toUpperCase()}`
      });
    }
    if (variety) {
      contextChips.push({
        type: 'variety',
        label: `✿ ${variety.toUpperCase()}`
      });
    }
    if (contextChips.length === 0) {
      contextChips.push({
        type: 'origin',
        label: '◈ CAFÉ DE ESPECIALIDAD'
      });
    }
  }

  // Header Pill (15px bold)
  const headerText = (roaster || 'BeanTag').toUpperCase();
  ctx.font = `800 15px ${theme.fontMono}`;
  ctx.fillStyle = theme.accent;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  drawCanvasTruncatedText(ctx, headerText, innerX, cardY + 34, scaScore ? innerW - 110 : innerW);

  if (scaScore !== null) {
    const scaLabel = `SCA ${scaScore}★`;
    ctx.font = `800 15px ${theme.fontMono}`;
    ctx.fillStyle = theme.text;
    ctx.textAlign = 'right';
    ctx.fillText(scaLabel, innerX + innerW, cardY + 34);
    ctx.textAlign = 'left';
  }

  if (!isVertical) {
    // =======================================================================
    // HORIZONTAL STORY STICKER (640 x 340 px) — STRAVA / WRAPPED SCALE
    // =======================================================================
    const titleFormatted = style === 'kissaten' ? coffeeName : coffeeName.toUpperCase();
    const titleInfo = drawHeroTitleBlock(ctx, titleFormatted, innerX, cardY + 82, innerW, {
      maxLines: 2,
      maxFontSize: 44,
      minFontSize: 30,
      fontFamily: theme.fontHeading,
      fontWeight: style === 'kissaten' ? 'bold' : '800',
      lineHeightRatio: 1.06,
      color: theme.text
    });

    // Context Chips Row (15.5px bold, 38px tall)
    const chipsY = titleInfo.linesDrawn > 1 ? cardY + 144 : cardY + 112;
    const chipH = 38;
    let curChipX = innerX;

    contextChips.slice(0, 3).forEach((chip, cIdx) => {
      ctx.font = `800 15.5px ${theme.fontMono}`;
      const cw = Math.min(ctx.measureText(chip.label).width + 26, innerW);
      if (curChipX + cw <= innerX + innerW) {
        drawStyledBox(ctx, curChipX, chipsY, cw, chipH, theme, {
          fill: cIdx === 0 ? theme.accentSoft : theme.surfaceBg,
          stroke: cIdx === 0 ? theme.accent : theme.border,
          lineWidth: style === 'neobrutalist' ? 2 : 1.3,
          radius: 10,
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

    // Flavor Notes Hero Row with Vector SCA Badges (20px bold, 54px tall)
    const flavorY = cardY + cardH - 76;
    const flavorH = 54;
    const tagsToRender = flavorTags.slice(0, 3);
    const gap = 10;
    const count = Math.min(3, tagsToRender.length);
    const pillW = (innerW - gap * (count - 1)) / count;

    tagsToRender.slice(0, count).forEach((tag, idx) => {
      const px = innerX + idx * (pillW + gap);
      drawFlavorNotePill(ctx, tag, px, flavorY, pillW, flavorH, style, theme, {
        index: idx,
        fontSize: count <= 2 ? 20 : 17.5,
        badgeRadius: 15,
        shadow: style === 'neobrutalist'
      });
    });
  } else {
    // =======================================================================
    // VERTICAL STORY STICKER (440 x 580 px) — COLLECTOR BADGE + VECTOR ICONS
    // =======================================================================
    const titleFormatted = style === 'kissaten' ? coffeeName : coffeeName.toUpperCase();
    const titleInfo = drawHeroTitleBlock(ctx, titleFormatted, innerX, cardY + 80, innerW, {
      maxLines: 2,
      maxFontSize: 40,
      minFontSize: 28,
      fontFamily: theme.fontHeading,
      fontWeight: style === 'kissaten' ? 'bold' : '800',
      lineHeightRatio: 1.08,
      color: theme.text
    });

    // Context Chips Wrap (15px bold, 36px tall)
    let chipX = innerX;
    let chipY = titleInfo.bottomY + 18;
    const chipH = 36;

    contextChips.slice(0, 3).forEach((chip, cIdx) => {
      ctx.font = `800 15px ${theme.fontMono}`;
      const cw = Math.min(ctx.measureText(chip.label).width + 24, innerW);
      if (chipX + cw > innerX + innerW && chipX > innerX) {
        chipX = innerX;
        chipY += chipH + 8;
      }
      drawStyledBox(ctx, chipX, chipY, cw, chipH, theme, {
        fill: cIdx === 0 ? theme.accentSoft : theme.surfaceBg,
        stroke: cIdx === 0 ? theme.accent : theme.border,
        lineWidth: style === 'neobrutalist' ? 2 : 1.3,
        radius: 9,
        shadow: false
      });
      ctx.fillStyle = cIdx === 0 && style !== 'neobrutalist' ? theme.accent : theme.text;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      drawCanvasTruncatedText(ctx, chip.label, chipX + cw / 2, chipY + chipH / 2 + 0.5, cw - 14);
      ctx.textBaseline = 'alphabetic';
      chipX += cw + 8;
    });

    const dividerY = chipY + chipH + 16;
    ctx.strokeStyle = theme.border;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(innerX, dividerY);
    ctx.lineTo(innerX + innerW, dividerY);
    ctx.stroke();

    const tagsToRender = flavorTags;

    if (sensoryData) {
      // Radar Chart with 13.5px labels + 3 large 44px flavor pills with SCA vector icons
      const stripY = dividerY + 16;
      const drewStrip = drawSensoryTelemetryStrip(ctx, innerX, stripY, innerW, 44, sensoryData, style, theme);

      let pillY = drewStrip ? stripY + 44 + 16 : dividerY + 16;
      const pillH = 44;

      tagsToRender.slice(0, 3).forEach((tag, idx) => {
        if (pillY + pillH > cardY + cardH - 12) return;
        drawFlavorNotePill(ctx, tag, innerX, pillY, innerW, pillH, style, theme, {
          index: idx,
          fontSize: 18,
          badgeRadius: 14,
          shadow: false
        });
        pillY += pillH + 8;
      });
    } else {
      // Full Flavor Pills Cascade (20px bold, 52px tall) with SCA vector icons
      ctx.fillStyle = theme.textSecondary;
      ctx.font = `800 14px ${theme.fontMono}`;
      ctx.textAlign = 'left';
      ctx.fillText('NOTAS DE CATA // PERFIL SCA:', innerX, dividerY + 26);

      let pillY = dividerY + 40;
      const pillH = 52;

      tagsToRender.slice(0, 4).forEach((tag, idx) => {
        if (pillY + pillH > cardY + cardH - 14) return;
        drawFlavorNotePill(ctx, tag, innerX, pillY, innerW, pillH, style, theme, {
          index: idx,
          fontSize: 20,
          badgeRadius: 16,
          shadow: style === 'neobrutalist'
        });
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

