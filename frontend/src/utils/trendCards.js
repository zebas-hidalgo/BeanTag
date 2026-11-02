/**
 * BeanTag 2027 trend card styles (feed 4:5, drawn in 1080x1350 pixel space).
 *
 * squishy  – inflated / tactile surfaces, Luminous Blue accent
 * stretch  – expressive stretched display type on Cloud Dancer
 * zine     – lo-fi collage: torn paper, tape, stamp, handwritten note
 * vhs      – retro-future cassette label with chrome type
 * lata     – unrolled craft-can label with round badge
 */
import { getScaCanvasPalette } from './scaIcons';

export const TREND_STYLES = ['squishy', 'stretch', 'zine', 'vhs', 'lata'];

// Minimal theme info used by the story wrapper and by legacy fallbacks
export const TREND_THEMES = {
  squishy: { bg: '#F4EFE8', textSecondary: '#8A84AA', fontMono: '"JetBrains Mono", monospace', legacy: 'studio' },
  stretch: { bg: '#F0EEE9', textSecondary: '#555555', fontMono: '"JetBrains Mono", monospace', legacy: 'studio' },
  zine: { bg: '#E9E2D3', textSecondary: '#3B3B3B', fontMono: '"JetBrains Mono", monospace', legacy: 'kissaten' },
  vhs: { bg: '#0E0B14', textSecondary: '#8C84A6', fontMono: '"JetBrains Mono", monospace', legacy: 'blueprint' },
  lata: { bg: '#2F6B3F', textSecondary: '#FFF6E6', fontMono: '"JetBrains Mono", monospace', legacy: 'diner' }
};

const W = 1080;
const H = 1350;
const SANS = '"Inter", -apple-system, "Helvetica Neue", Arial, sans-serif';
const MONO = '"JetBrains Mono", "SF Mono", Menlo, monospace';
const SERIF = '"Playfair Display", Georgia, serif';
const HAND = '"Caveat", "Bradley Hand", "Segoe Print", cursive';

// ---------------------------------------------------------------------------
// Helpers (only Canvas 2D calls that every browser and the test mock support)
// ---------------------------------------------------------------------------
function rr(ctx, x, y, w, h, r) {
  const k = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + k, y);
  ctx.lineTo(x + w - k, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + k);
  ctx.lineTo(x + w, y + h - k);
  ctx.quadraticCurveTo(x + w, y + h, x + w - k, y + h);
  ctx.lineTo(x + k, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - k);
  ctx.lineTo(x, y + k);
  ctx.quadraticCurveTo(x, y, x + k, y);
  ctx.closePath();
}

function setFont(ctx, weight, size, family, style = '') {
  ctx.font = `${style ? style + ' ' : ''}${weight} ${size}px ${family}`;
}

// Largest font size (<= max, >= min) whose text fits maxW
function fitSize(ctx, text, maxW, max, min, weight, family, style = '') {
  let s = max;
  for (; s > min; s -= 2) {
    setFont(ctx, weight, s, family, style);
    if (ctx.measureText(text).width <= maxW) return s;
  }
  setFont(ctx, weight, min, family, style);
  return min;
}

// Fit by shrinking, then ellipsis
// Legibility floor: nothing below 20px on a 1080px-wide image (~7pt on a phone)
const MIN_PX = 20;

function fitText(ctx, text, x, y, maxW, max, min, weight, family, style = '') {
  const str = String(text || '');
  min = Math.max(min, Math.min(max, MIN_PX));
  fitSize(ctx, str, maxW, max, min, weight, family, style);
  if (ctx.measureText(str).width <= maxW) { ctx.fillText(str, x, y); return; }
  let t = str;
  while (t.length > 1 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1);
  ctx.fillText(t.trimEnd() + '…', x, y);
}

// One line if it fits at >= min size, otherwise two balanced lines. Returns line count.
function fitWrap(ctx, text, x, y, maxW, max, min, weight, family, lineH, style = '') {
  const str = String(text || '').trim();
  if (!str) return 0;
  min = Math.max(min, MIN_PX);
  setFont(ctx, weight, min, family, style);
  if (ctx.measureText(str).width <= maxW) { fitText(ctx, str, x, y, maxW, max, min, weight, family, style); return 1; }
  const parts = str.split(' · ');
  let a = str;
  let b = '';
  if (parts.length > 1) {
    const half = Math.ceil(parts.length / 2);
    a = parts.slice(0, half).join(' · ');
    b = parts.slice(half).join(' · ');
  } else {
    const words = str.split(/\s+/);
    const half = Math.ceil(words.length / 2);
    a = words.slice(0, half).join(' ');
    b = words.slice(half).join(' ');
  }
  // Same size on both lines
  const sz = Math.min(fitSize(ctx, a, maxW, max, min, weight, family, style), fitSize(ctx, b, maxW, max, min, weight, family, style));
  fitText(ctx, a, x, y, maxW, sz, sz, weight, family, style);
  fitText(ctx, b, x, y + lineH, maxW, sz, sz, weight, family, style);
  return 2;
}

function wrapLines(ctx, text, maxW) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = '';
  words.forEach(w => {
    const cand = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(cand).width <= maxW || !cur) cur = cand;
    else { lines.push(cur); cur = w; }
  });
  if (cur) lines.push(cur);
  return lines;
}

// Wraps into <= maxLines; the last line gets an ellipsis if needed. Returns lines drawn.
function drawWrapped(ctx, text, x, y, maxW, lineH, maxLines) {
  let lines = wrapLines(ctx, text, maxW);
  if (lines.length > maxLines) {
    const rest = lines.slice(maxLines - 1).join(' ');
    lines = lines.slice(0, maxLines - 1);
    let t = rest;
    while (t.length > 1 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1);
    lines.push(t.trimEnd() + '…');
  }
  lines.forEach((l, i) => ctx.fillText(l, x, y + i * lineH));
  return lines.length;
}

// Title: largest size where text wraps into <= maxLines inside maxW
function fitTitle(ctx, text, maxW, maxLines, max, min, weight, family, style = '') {
  for (let s = max; s >= min; s -= 2) {
    setFont(ctx, weight, s, family, style);
    const lines = wrapLines(ctx, text, maxW);
    if (lines.length <= maxLines && lines.every(l => ctx.measureText(l).width <= maxW)) return { size: s, lines };
  }
  setFont(ctx, weight, min, family, style);
  const lines = wrapLines(ctx, text, maxW).slice(0, maxLines);
  return { size: min, lines };
}

function spaced(ctx, px) {
  try { ctx.letterSpacing = `${px}px`; } catch (e) { /* older browsers */ }
}

function sensoryWords(d) {
  return [d.balanceLabel, d.bodyLabel, d.extractionLabel].filter(Boolean);
}

function stars(n) {
  const r = Math.max(0, Math.min(5, Math.round(n || 0)));
  return '★★★★★'.slice(0, r) + '☆☆☆☆☆'.slice(0, 5 - r);
}

function metricCells(d, incRecipe) {
  if (incRecipe) {
    return [
      { label: 'MÉTODO', value: d.method },
      { label: 'DOSIS', value: d.coffeeG && d.waterG ? `${d.coffeeG}g → ${d.waterG}g` : `1:${d.ratio}` },
      { label: d.grinderName ? `MOLINO ${d.grinderName}`.toUpperCase() : 'MOLIENDA', value: d.grind },
      { label: 'TIEMPO · TEMP', value: `${d.time} · ${d.temp}` }
    ];
  }
  const first = v => String(v || '').split(/[,/]/)[0].trim();
  return [
    { label: 'ORIGEN', value: first(d.origin) || '—' },
    { label: 'PROCESO', value: d.process || '—' },
    { label: 'VARIEDAD', value: first(d.variety) || '—' },
    { label: 'ALTITUD', value: d.altitude || d.roastLevel || '—' }
  ];
}

function tagColor(tag, fallback) {
  try {
    const pal = getScaCanvasPalette(tag);
    return (pal && (pal.badgeBg || pal.icon)) || fallback;
  } catch (e) {
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// 3. ZINE
// ---------------------------------------------------------------------------
function tornPath(ctx, w, h, seed) {
  let s = seed;
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const teeth = 18;
  ctx.beginPath();
  ctx.moveTo(0, 6 + rnd() * 8);
  for (let i = 1; i <= teeth; i++) ctx.lineTo((w * i) / teeth, rnd() * 14);
  ctx.lineTo(w, h - rnd() * 14);
  for (let i = teeth - 1; i >= 0; i--) ctx.lineTo((w * i) / teeth, h - rnd() * 14);
  ctx.closePath();
}

function paper(ctx, x, y, w, h, rot, fill, torn, seed, drawContent) {
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(rot);
  ctx.translate(-w / 2, -h / 2);
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.20)';
  ctx.shadowBlur = 22;
  ctx.shadowOffsetY = 10;
  ctx.fillStyle = fill;
  if (torn) tornPath(ctx, w, h, seed); else { ctx.beginPath(); ctx.rect(0, 0, w, h); }
  ctx.fill();
  ctx.restore();
  drawContent();
  ctx.restore();
}

function tape(ctx, x, y, w, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = 'rgba(255, 236, 150, 0.78)';
  ctx.fillRect(-w / 2, -28, w, 56);
  ctx.restore();
}

// =============================================================================
// MENU + STICKER FORMATS FOR THE TREND STYLES
// Shared layouts; each style provides a "skin" (background, type, pills).
// =============================================================================

function titleCase(t) {
  const s = String(t || '');
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function puffyBox(ctx, x, y, w, h, r, top, bottom, shadow) {
  ctx.save();
  ctx.shadowColor = shadow;
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 12;
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  rr(ctx, x, y, w, h, r);
  ctx.fill();
  ctx.restore();
  ctx.save();
  const gl = ctx.createLinearGradient(0, y, 0, y + h * 0.5);
  gl.addColorStop(0, 'rgba(255,255,255,0.5)');
  gl.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gl;
  rr(ctx, x + 5, y + 3, w - 10, h * 0.5, r);
  ctx.fill();
  ctx.restore();
}

const VHS_BANDS = ['#FF3D6E', '#FF8A3D', '#FFD23D', '#3DD9FF', '#6E7BFF'];

const SKINS = {
  // ------------------------------------------------------------------ SQUISHY
  squishy: {
    text: '#1A1630', muted: '#4B4570', faint: '#8A84AA', accent: '#1E4BFF',
    page(ctx, w, h) {
      const g = ctx.createRadialGradient(w * 0.2, 0, 0, w * 0.2, 0, Math.max(w, h) * 1.2);
      g.addColorStop(0, '#E6EEFF'); g.addColorStop(0.55, '#F4EFE8'); g.addColorStop(1, '#F7E3DC');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    },
    shape(ctx, x, y, w, h) {
      ctx.save();
      ctx.shadowColor = 'rgba(60,40,120,0.18)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12;
      const g = ctx.createLinearGradient(x, y, x + w, y + h);
      g.addColorStop(0, '#EEF2FF'); g.addColorStop(0.6, '#F6EFEA'); g.addColorStop(1, '#F9E1DA');
      ctx.fillStyle = g;
      rr(ctx, x, y, w, h, 64);
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 8;
      rr(ctx, x, y, w, h, 64); ctx.stroke();
      // blob
      ctx.save();
      const b = ctx.createRadialGradient(x + w - 90, y + 80, 6, x + w - 60, y + 110, 120);
      b.addColorStop(0, '#FFD1E1'); b.addColorStop(0.6, '#FF7AA8'); b.addColorStop(1, '#E5487F');
      ctx.fillStyle = b;
      ctx.beginPath(); ctx.ellipse(x + w - 70, y + 110, 96, 88, 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    },
    title(ctx, text, x, y, maxW, maxLines, maxSize) {
      const { size, lines } = fitTitle(ctx, text, maxW, maxLines, maxSize, Math.round(maxSize * 0.5), 900, SANS);
      const lh = Math.round(size * 1.02);
      lines.forEach((l, i) => {
        const ly = y + size * 0.8 + i * lh;
        ctx.save();
        ctx.shadowColor = 'rgba(30,75,255,0.30)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 10;
        ctx.fillStyle = '#8FA9FF'; ctx.fillText(l, x, ly + 5);
        ctx.restore();
        ctx.fillStyle = '#1E4BFF'; ctx.fillText(l, x, ly);
      });
      return y + size * 0.8 + (lines.length - 1) * lh;
    },
    meta(ctx, text, x, y, maxW, size = 26) { ctx.fillStyle = '#4B4570'; fitText(ctx, text, x, y, maxW, size, 16, 600, SANS); },
    small(ctx, text, x, y, maxW, size = 22) { ctx.fillStyle = '#8A84AA'; spaced(ctx, 2); fitText(ctx, text.toUpperCase(), x, y, maxW, size, 14, 800, SANS); spaced(ctx, 0); },
    tagH: 60,
    tagW(ctx, tag) { setFont(ctx, 800, 28, SANS); return ctx.measureText(titleCase(tag)).width + 52; },
    tag(ctx, tag, x, y) {
      const w = this.tagW(ctx, tag);
      const c = tagColor(tag, '#E5376B');
      puffyBox(ctx, x, y, w, 60, 30, c, c, 'rgba(0,0,0,0.14)');
      ctx.fillStyle = '#FFFFFF'; setFont(ctx, 800, 28, SANS); ctx.textBaseline = 'middle';
      ctx.fillText(titleCase(tag), x + 26, y + 32); ctx.textBaseline = 'alphabetic';
      return w;
    },
    badge(ctx, text, rightX, y, strong = true) {
      setFont(ctx, 800, 26, SANS);
      const w = ctx.measureText(text).width + 52;
      puffyBox(ctx, rightX - w, y, w, 58, 29, strong ? '#5B8CFF' : '#FFFFFF', strong ? '#1E4BFF' : '#EDEAF6', strong ? 'rgba(30,75,255,0.3)' : 'rgba(60,40,120,0.12)');
      ctx.fillStyle = strong ? '#FFFFFF' : '#1A1630'; ctx.textBaseline = 'middle';
      ctx.fillText(text, rightX - w + 26, y + 30); ctx.textBaseline = 'alphabetic';
      return w;
    },
    row(ctx, x, y, w, h) { puffyBox(ctx, x, y, w, h, 40, '#FFFFFF', '#F1EEF9', 'rgba(60,40,120,0.12)'); },
    index(ctx, i, x, y) {
      puffyBox(ctx, x, y, 64, 64, 32, '#5B8CFF', '#1E4BFF', 'rgba(30,75,255,0.3)');
      ctx.fillStyle = '#FFFFFF'; setFont(ctx, 900, 28, SANS); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), x + 32, y + 34); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    },
    rowName(ctx, text, x, y, maxW) { ctx.fillStyle = '#1A1630'; fitText(ctx, text, x, y, maxW, 42, 24, 900, SANS); },
    header(ctx, w, n) {
      this.badge(ctx, 'CARTA EN CAVA', 72 + 230, 64, false);
      this.title(ctx, 'Cafés en cava', 72, 150, w - 144, 1, 96);
      this.meta(ctx, `${n} ${n === 1 ? 'lote disponible' : 'lotes disponibles'}`, 72, 300, w - 144, 28);
      return 340;
    },
    footer(ctx, w, h) { this.small(ctx, `BeanTag · ${new Date().toLocaleDateString('es-ES')}`, 72, h - 52, w - 144); }
  },

  // ------------------------------------------------------------------ STRETCH
  stretch: {
    text: '#111111', muted: '#555555', accent: '#1F4CFF',
    page(ctx, w, h) { ctx.fillStyle = '#F0EEE9'; ctx.fillRect(0, 0, w, h); },
    shape(ctx, x, y, w, h) {
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.18)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8;
      ctx.fillStyle = '#F0EEE9'; rr(ctx, x, y, w, h, 18); ctx.fill(); ctx.restore();
      ctx.fillStyle = '#1F4CFF'; ctx.fillRect(x, y + h - 14, w, 14);
    },
    title(ctx, text, x, y, maxW, maxLines, maxSize) {
      const { size: s, lines: used } = fitTitle(ctx, String(text).toUpperCase(), maxW, maxLines, maxSize, Math.round(maxSize * 0.4), 900, SANS);
      const S = 1.6;
      let yy = y;
      used.forEach((l, i) => {
        setFont(ctx, 900, s, SANS);
        spaced(ctx, -s * 0.04);
        if (/[ÁÉÍÓÚÑÜ]/.test(l)) yy += s * 0.16 * S; // room for accents above capitals
        yy += s * 0.74 * S;
        ctx.save(); ctx.translate(x, yy); ctx.scale(1, S);
        if (i === used.length - 1) {
          // Accent: first half of the LAST word in Luminous Blue
          const lastSpace = l.lastIndexOf(' ');
          const head = lastSpace >= 0 ? l.slice(0, lastSpace + 1) : '';
          const word = l.slice(lastSpace + 1);
          const cut = Math.ceil(word.length / 2);
          ctx.fillStyle = '#111111'; ctx.fillText(head, 0, 0);
          let ax = ctx.measureText(head).width;
          ctx.fillStyle = '#1F4CFF'; ctx.fillText(word.slice(0, cut), ax, 0);
          ax += ctx.measureText(word.slice(0, cut)).width;
          ctx.fillStyle = '#111111'; ctx.fillText(word.slice(cut), ax, 0);
        } else { ctx.fillStyle = '#111111'; ctx.fillText(l, 0, 0); }
        ctx.restore(); spaced(ctx, 0);
        yy += s * 0.1;
      });
      return yy;
    },
    meta(ctx, text, x, y, maxW, size = 30) { ctx.fillStyle = '#111111'; fitText(ctx, text, x, y, maxW, size, 16, 300, SANS); },
    small(ctx, text, x, y, maxW, size = 22) { ctx.fillStyle = '#555555'; spaced(ctx, 3); fitText(ctx, text.toUpperCase(), x, y, maxW, size, 20, 600, SANS); spaced(ctx, 0); },
    tagH: 44,
    tagW(ctx, tag, i) { setFont(ctx, i === 0 ? 800 : 300, 34, SANS); return ctx.measureText(titleCase(tag) + (i === 0 ? ' ' : ' / ')).width; },
    tag(ctx, tag, x, y, i) {
      setFont(ctx, i === 0 ? 800 : 300, 34, SANS);
      ctx.fillStyle = i === 0 ? '#1F4CFF' : '#111111';
      const t = (i === 0 ? '' : '/ ') + titleCase(tag);
      ctx.fillText(t, x, y + 34);
      return ctx.measureText(t + ' ').width;
    },
    badge(ctx, text, rightX, y) {
      ctx.fillStyle = '#1F4CFF'; spaced(ctx, 3); setFont(ctx, 700, 24, SANS); ctx.textAlign = 'right';
      ctx.fillText(text, rightX, y + 30); ctx.textAlign = 'left'; spaced(ctx, 0);
      return ctx.measureText(text).width;
    },
    row(ctx, x, y, w, h, i) { ctx.fillStyle = '#111111'; ctx.fillRect(x, y, w, i === 0 ? 3 : 1); },
    index(ctx, i, x, y) {
      ctx.save(); ctx.translate(x, y + 58); ctx.scale(1, 1.6);
      ctx.fillStyle = '#1F4CFF'; setFont(ctx, 900, 44, SANS); ctx.fillText(String(i + 1).padStart(2, '0'), 0, 0);
      ctx.restore();
    },
    rowName(ctx, text, x, y, maxW) { ctx.fillStyle = '#111111'; fitText(ctx, text, x, y, maxW, 44, 24, 800, SANS); },
    header(ctx, w, n) {
      this.small(ctx, 'BeanTag — Carta de la cava', 64, 84, w - 128, 22);
      ctx.save(); ctx.translate(64, 84 + 150 * 0.74 * 1.75 + 10); ctx.scale(1, 1.75);
      setFont(ctx, 900, 150, SANS); spaced(ctx, -7);
      ctx.fillStyle = '#111111'; ctx.fillText('CA', 0, 0);
      const a = ctx.measureText('CA').width;
      ctx.fillStyle = '#1F4CFF'; ctx.fillText('VA', a, 0);
      spaced(ctx, 0); ctx.restore();
      this.meta(ctx, `${n} ${n === 1 ? 'lote' : 'lotes'} en conservación`, 64, 330, w - 128, 36);
      return 380;
    },
    footer(ctx, w, h) { this.small(ctx, `BeanTag · ${new Date().toLocaleDateString('es-ES')}`, 64, h - 50, w - 128); }
  },

  // ------------------------------------------------------------------ ZINE
  zine: {
    text: '#1B1B1B', muted: '#3B3B3B', accent: '#D2402B',
    page(ctx, w, h) {
      ctx.fillStyle = '#E9E2D3'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      for (let gy = 0; gy < h; gy += 6) for (let gx = (gy / 6) % 2 ? 3 : 0; gx < w; gx += 6) ctx.fillRect(gx, gy, 1, 1);
    },
    shape(ctx, x, y, w, h) {
      ctx.save(); ctx.translate(x, y);
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.22)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 8;
      ctx.fillStyle = '#FBF8F1'; tornPath(ctx, w, h, 9); ctx.fill(); ctx.restore();
      ctx.restore();
      tape(ctx, x + w / 2, y + 6, 180, -0.06);
    },
    title(ctx, text, x, y, maxW, maxLines, maxSize) {
      const { size, lines } = fitTitle(ctx, text, maxW, maxLines, maxSize, Math.round(maxSize * 0.5), 700, SERIF);
      const lh = Math.round(size * 1.0);
      lines.forEach((l, i) => {
        const ly = y + size * 0.85 + i * lh;
        if (i === lines.length - 1) {
          setFont(ctx, 700, size, SERIF);
          ctx.fillStyle = 'rgba(255, 92, 140, 0.55)';
          ctx.fillRect(x - 4, ly - size * 0.3, ctx.measureText(l).width + 10, size * 0.3);
        }
        ctx.fillStyle = '#1B1B1B'; setFont(ctx, 700, size, SERIF); ctx.fillText(l, x, ly);
      });
      return y + size * 0.85 + (lines.length - 1) * lh;
    },
    meta(ctx, text, x, y, maxW, size = 24) { ctx.fillStyle = '#1B1B1B'; fitText(ctx, text, x, y, maxW, size, 15, 500, MONO); },
    small(ctx, text, x, y, maxW, size = 22) {
      setFont(ctx, 700, size, MONO); spaced(ctx, 2);
      const t = text.toUpperCase();
      const w = Math.min(ctx.measureText(t).width + 24, maxW);
      ctx.fillStyle = '#1B1B1B'; ctx.fillRect(x, y - size - 6, w, size + 16);
      ctx.fillStyle = '#FBF8F1'; fitText(ctx, t, x + 12, y + 2, w - 24, size, 12, 700, MONO);
      spaced(ctx, 0);
    },
    tagH: 48,
    tagW(ctx, tag, i) { setFont(ctx, 600, 40, HAND); return ctx.measureText(tag.toLowerCase() + (i === 0 ? '' : ',') + ' ').width + (i === 0 ? 0 : 0); },
    tag(ctx, tag, x, y, i) {
      setFont(ctx, 600, 40, HAND); ctx.fillStyle = '#1E3FBF';
      const t = (i === 0 ? '' : ', ') + tag.toLowerCase();
      ctx.fillText(t, x, y + 38);
      return ctx.measureText(t).width;
    },
    badge(ctx, text, rightX, y) {
      // round ink stamp
      const r = 62;
      ctx.save(); ctx.translate(rightX - r, y + r - 6); ctx.rotate(-0.22);
      ctx.strokeStyle = '#D2402B'; ctx.fillStyle = '#D2402B'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
      ctx.textAlign = 'center';
      const parts = String(text).split(' ');
      setFont(ctx, 900, 20, SANS); spaced(ctx, 2); ctx.fillText(parts.length > 1 ? parts[0] : 'BEANTAG', 0, -22); spaced(ctx, 0);
      setFont(ctx, 900, 36, SANS); ctx.fillText(parts.length > 1 ? parts.slice(1).join(' ') : text, 0, 22);
      ctx.textAlign = 'left'; ctx.restore();
      return r * 2;
    },
    row(ctx, x, y, w, h, i) {
      ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.rotate(i % 2 ? 0.01 : -0.012); ctx.translate(-w / 2, -h / 2);
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.18)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 6;
      ctx.fillStyle = i % 3 === 2 ? '#FFF1A8' : '#FBF8F1'; tornPath(ctx, w, h, 13 + i); ctx.fill(); ctx.restore();
      ctx.restore();
      if (i % 2 === 0) tape(ctx, x + w - 120, y + 4, 120, 0.12);
    },
    index(ctx, i, x, y) {
      ctx.fillStyle = '#D2402B'; setFont(ctx, 700, 64, SERIF); ctx.fillText(String(i + 1), x + 6, y + 60);
    },
    rowName(ctx, text, x, y, maxW) { ctx.fillStyle = '#1B1B1B'; fitText(ctx, text, x, y, maxW, 42, 24, 700, SERIF); },
    header(ctx, w, n) {
      paper(ctx, 50, 40, w - 100, 270, -0.02, '#FBF8F1', true, 21, () => {
        this.small(ctx, `LA CAVA · ${n} ${n === 1 ? 'LOTE' : 'LOTES'}`, 44, 70, 500);
        this.title(ctx, 'Carta de cafés', 44, 98, w - 340, 1, 96);
      });
      tape(ctx, w / 2, 46, 200, -0.08);
      this.badge(ctx, `CAVA ${n}`, w - 80, 70);
      return 350;
    },
    footer(ctx, w, h) {
      ctx.fillStyle = '#1B1B1B'; ctx.textAlign = 'right'; setFont(ctx, 500, 22, MONO);
      ctx.fillText(`beantag / cava ${new Date().toLocaleDateString('es-ES')}`, w - 60, h - 40); ctx.textAlign = 'left';
    }
  },

  // ------------------------------------------------------------------ VHS
  vhs: {
    text: '#F4F1EA', muted: '#B9B3C9', accent: '#FF8A3D',
    page(ctx, w, h) { ctx.fillStyle = '#0E0B14'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#15111D'; rr(ctx, 30, 30, w - 60, h - 60, 18); ctx.fill(); },
    shape(ctx, x, y, w, h) {
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10;
      ctx.fillStyle = '#15111D'; rr(ctx, x, y, w, h, 22); ctx.fill(); ctx.restore();
      ctx.save(); rr(ctx, x, y, w, h, 22); ctx.clip();
      VHS_BANDS.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(x, y + h - 120 + i * 24, w, 24); });
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      for (let yy = y; yy < y + h; yy += 5) ctx.fillRect(x, yy, w, 2);
      ctx.restore();
    },
    title(ctx, text, x, y, maxW, maxLines, maxSize) {
      const { size, lines } = fitTitle(ctx, String(text).toUpperCase(), maxW, maxLines, maxSize, Math.round(maxSize * 0.5), 900, SANS, 'italic');
      const lh = Math.round(size * 0.92);
      lines.forEach((l, i) => {
        const ly = y + size * 0.8 + i * lh;
        const g = ctx.createLinearGradient(0, ly - size * 0.8, 0, ly);
        g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.45, '#C9D6FF'); g.addColorStop(0.52, '#6E7BFF'); g.addColorStop(1, '#F4F1EA');
        ctx.fillStyle = g; setFont(ctx, 900, size, SANS, 'italic'); ctx.fillText(l, x, ly);
      });
      return y + size * 0.8 + (lines.length - 1) * lh;
    },
    meta(ctx, text, x, y, maxW, size = 22) { ctx.fillStyle = '#B9B3C9'; spaced(ctx, 1); fitText(ctx, text.toUpperCase(), x, y, maxW, size, 13, 500, MONO); spaced(ctx, 0); },
    small(ctx, text, x, y, maxW, size = 24) { ctx.fillStyle = '#F4F1EA'; spaced(ctx, 6); fitText(ctx, text.toUpperCase(), x, y, maxW, size, 14, 900, SANS, 'italic'); spaced(ctx, 0); },
    tagH: 50,
    tagW(ctx, tag) { setFont(ctx, 800, 24, SANS, 'italic'); return ctx.measureText(tag.toUpperCase()).width + 36; },
    tag(ctx, tag, x, y, i) {
      const w = this.tagW(ctx, tag);
      const c = VHS_BANDS[i % VHS_BANDS.length];
      ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, 50);
      setFont(ctx, 800, 24, SANS, 'italic'); ctx.fillText(tag.toUpperCase(), x + 18, y + 34);
      return w;
    },
    badge(ctx, text, rightX, y) {
      ctx.fillStyle = '#FF8A3D'; ctx.textAlign = 'right'; setFont(ctx, 500, 26, MONO);
      ctx.fillText(text, rightX, y + 30); ctx.textAlign = 'left';
      return ctx.measureText(text).width;
    },
    row(ctx, x, y, w, h) { ctx.strokeStyle = '#3A3350'; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h); },
    index(ctx, i, x, y) {
      ctx.fillStyle = VHS_BANDS[i % VHS_BANDS.length]; setFont(ctx, 900, 40, SANS, 'italic');
      ctx.fillText(`${i < 9 ? 'A' : 'B'}${(i % 9) + 1}`, x, y + 48);
    },
    rowName(ctx, text, x, y, maxW) { ctx.fillStyle = '#F4F1EA'; fitText(ctx, String(text).toUpperCase(), x, y, maxW, 40, 22, 900, SANS, 'italic'); },
    header(ctx, w, n) {
      this.small(ctx, 'BEANTAG ▸▸ CAVA', 80, 104, 600, 30);
      this.badge(ctx, `${n} TRACKS`, w - 80, 74);
      this.title(ctx, 'Tracklist de la cava', 80, 140, w - 160, 1, 92);
      VHS_BANDS.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(30, 270 + i * 14, w - 60, 14); });
      return 380;
    },
    footer(ctx, w, h) {
      ctx.fillStyle = '#8C84A6'; setFont(ctx, 500, 22, MONO);
      ctx.fillText('SP ▸ T-120', 80, h - 70);
      ctx.textAlign = 'right'; ctx.fillText(`SIDE A · ${new Date().toLocaleDateString('es-ES')}`, w - 80, h - 70); ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      for (let yy = 30; yy < h - 30; yy += 5) ctx.fillRect(30, yy, w - 60, 2);
    }
  },

  // ------------------------------------------------------------------ LATA
  lata: {
    text: '#1C3A24', muted: '#5C7A62', accent: '#FF6A1A',
    page(ctx, w, h) {
      ctx.fillStyle = '#2F6B3F'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#FF6A1A'; ctx.fillRect(0, 0, w, 130); ctx.fillRect(0, h - 100, w, 100);
      ctx.fillStyle = '#FFF6E6'; ctx.fillRect(0, 130, w, 18);
    },
    shape(ctx, x, y, w, h) {
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 8;
      ctx.fillStyle = '#FFF6E6'; rr(ctx, x - 10, y - 10, w + 20, h + 20, 34); ctx.fill(); ctx.restore();
      ctx.save(); rr(ctx, x, y, w, h, 26); ctx.clip();
      ctx.fillStyle = '#2F6B3F'; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#FF6A1A'; ctx.fillRect(x, y, w, 26); ctx.fillRect(x, y + h - 26, w, 26);
      ctx.restore();
    },
    onDark: true,
    title(ctx, text, x, y, maxW, maxLines, maxSize) {
      const { size, lines } = fitTitle(ctx, String(text).toUpperCase(), maxW, maxLines, maxSize, Math.round(maxSize * 0.5), 900, SANS);
      const lh = size * 0.9 * 1.2;
      lines.forEach((l, i) => {
        ctx.save(); ctx.translate(x, y + (i + 1) * lh - size * 0.18); ctx.scale(1, 1.2);
        ctx.fillStyle = '#FFF6E6'; setFont(ctx, 900, size, SANS); spaced(ctx, -size * 0.03); ctx.fillText(l, 0, 0); spaced(ctx, 0);
        ctx.restore();
      });
      return y + lines.length * lh - size * 0.18;
    },
    meta(ctx, text, x, y, maxW, size = 22) { ctx.fillStyle = '#FFF6E6'; spaced(ctx, 3); fitText(ctx, text.toUpperCase(), x, y, maxW, size, 13, 800, SANS); spaced(ctx, 0); },
    small(ctx, text, x, y, maxW, size = 22) { ctx.fillStyle = '#1C3A24'; spaced(ctx, 3); fitText(ctx, text.toUpperCase(), x, y, maxW, size, 13, 900, SANS); spaced(ctx, 0); },
    tagH: 44,
    tagW(ctx, tag, i) { setFont(ctx, 900, 30, SANS); return ctx.measureText((i ? '✺ ' : '') + tag.toUpperCase() + ' ').width + 6; },
    tag(ctx, tag, x, y, i) {
      setFont(ctx, 900, 30, SANS);
      let cx = x;
      if (i) { ctx.fillStyle = '#FF6A1A'; ctx.fillText('✺ ', cx, y + 34); cx += ctx.measureText('✺ ').width; }
      ctx.fillStyle = '#FFF6E6'; ctx.fillText(tag.toUpperCase(), cx, y + 34);
      return cx - x + ctx.measureText(tag.toUpperCase() + ' ').width + 6;
    },
    badge(ctx, text, rightX, y) {
      setFont(ctx, 900, 26, SANS);
      const w = ctx.measureText(text).width + 40;
      ctx.fillStyle = '#FF6A1A'; rr(ctx, rightX - w, y, w, 50, 25); ctx.fill();
      ctx.fillStyle = '#1C3A24'; ctx.fillText(text, rightX - w + 20, y + 35);
      return w;
    },
    row(ctx, x, y, w, h) { ctx.fillStyle = '#FFF6E6'; rr(ctx, x, y, w, h, 18); ctx.fill(); },
    rowDark: false,
    index(ctx, i, x, y) {
      ctx.fillStyle = '#FF6A1A'; ctx.beginPath(); ctx.arc(x + 34, y + 34, 34, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1C3A24'; setFont(ctx, 900, 30, SANS); ctx.textAlign = 'center';
      ctx.fillText(String(i + 1).padStart(2, '0'), x + 34, y + 45); ctx.textAlign = 'left';
    },
    rowName(ctx, text, x, y, maxW) { ctx.fillStyle = '#1C3A24'; fitText(ctx, String(text).toUpperCase(), x, y, maxW, 40, 22, 900, SANS); },
    header(ctx, w, n) {
      this.small(ctx, 'BeanTag', 60, 84, 400, 40);
      ctx.fillStyle = '#1C3A24'; ctx.textAlign = 'right'; setFont(ctx, 900, 40, SANS);
      ctx.fillText(`${n} ${n === 1 ? 'LOTE' : 'LOTES'}`, w - 60, 84); ctx.textAlign = 'left';
      this.title(ctx, 'Menú de la cava', 60, 180, w - 120, 1, 92);
      return 330;
    },
    footer(ctx, w, h) {
      this.small(ctx, 'Single origin · Specialty coffee', 60, h - 40, 700);
      ctx.fillStyle = '#1C3A24'; ctx.textAlign = 'right'; setFont(ctx, 900, 22, SANS);
      ctx.fillText(new Date().toLocaleDateString('es-ES'), w - 60, h - 40); ctx.textAlign = 'left';
    }
  }
};

// Row text colors for skins whose rows sit on a light card over a dark page (lata)
function rowSkinText(skin) {
  return skin === SKINS.lata
    ? { meta: (ctx, t, x, y, w) => { ctx.fillStyle = '#5C7A62'; spaced(ctx, 2); fitText(ctx, t.toUpperCase(), x, y, w, 22, 20, 800, SANS); spaced(ctx, 0); },
        tag: (ctx, tag, x, y, i) => {
          setFont(ctx, 900, 24, SANS);
          let cx = x;
          if (i) { ctx.fillStyle = '#FF6A1A'; ctx.fillText('✺ ', cx, y + 28); cx += ctx.measureText('✺ ').width; }
          ctx.fillStyle = '#2F6B3F'; ctx.fillText(tag.toUpperCase(), cx, y + 28);
          return cx - x + ctx.measureText(tag.toUpperCase() + ' ').width + 6;
        },
        tagW: (ctx, tag, i) => { setFont(ctx, 900, 24, SANS); return ctx.measureText((i ? '✺ ' : '') + tag.toUpperCase() + ' ').width + 6; } }
    : null;
}

function drawTagRow(ctx, skin, tags, x, y, maxW, override) {
  let cx = x;
  tags.forEach((tag, i) => {
    const w = override ? override.tagW(ctx, tag, i) : skin.tagW(ctx, tag, i);
    if (cx + w > x + maxW) return;
    if (override) override.tag(ctx, tag, cx, y, i); else skin.tag(ctx, tag, cx, y, i);
    cx += w + (skin === SKINS.squishy || skin === SKINS.vhs ? 12 : 0);
  });
}

// ---------------------------------------------------------------------------
// MENU
// ---------------------------------------------------------------------------
export const TREND_MENU_ROW_H = 200;
export function trendMenuSize(style, count) {
  const headers = { squishy: 340, stretch: 380, zine: 350, vhs: 380, lata: 330 };
  const n = Math.max(1, count);
  return { width: 1080, height: (headers[style] || 360) + n * TREND_MENU_ROW_H + 130 };
}

export function drawTrendMenu(ctx, style, items, width, height) {
  const skin = SKINS[style] || SKINS.squishy;
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  skin.page(ctx, width, height);
  const headH = skin.header(ctx, width, items.length);
  const pad = style === 'stretch' ? 64 : 60;
  const rowW = width - pad * 2;
  const over = rowSkinText(skin);
  items.forEach((it, i) => {
    const y = headH + i * TREND_MENU_ROW_H;
    const h = TREND_MENU_ROW_H - 24;
    skin.row(ctx, pad, y, rowW, h, i);
    const ix = pad + 26;
    skin.index(ctx, i, ix, y + 26);
    const tx = ix + (style === 'stretch' ? 96 : 92);
    const stock = it.stock || '';
    let badgeW = 0;
    if (stock) {
      if (style === 'zine') {
        setFont(ctx, 700, 22, MONO);
        badgeW = ctx.measureText(stock).width + 30;
        skin.small(ctx, stock, pad + rowW - 24 - badgeW, y + 58, badgeW);
      } else if (style === 'lata') {
        setFont(ctx, 900, 22, SANS);
        badgeW = ctx.measureText(stock).width + 36;
        ctx.fillStyle = '#2F6B3F'; rr(ctx, pad + rowW - 24 - badgeW, y + 24, badgeW, 44, 22); ctx.fill();
        ctx.fillStyle = '#FFF6E6'; ctx.fillText(stock, pad + rowW - 24 - badgeW + 18, y + 54);
      } else {
        badgeW = skin.badge(ctx, stock, pad + rowW - 24, y + 20, false);
      }
    }
    skin.rowName(ctx, it.name, tx, y + 66, rowW - (tx - pad) - badgeW - 48);
    const meta = [it.roaster, it.origin, it.process, it.sca ? `SCA ${it.sca}` : ''].filter(Boolean).join(' · ');
    if (over) over.meta(ctx, meta, tx, y + 104, rowW - (tx - pad) - 30);
    else if (style === 'vhs' || style === 'zine') skin.meta(ctx, meta, tx, y + 104, rowW - (tx - pad) - 30, 22);
    else skin.meta(ctx, meta, tx, y + 104, rowW - (tx - pad) - 30, 24);
    if (style === 'squishy') {
      // compact bubbles inside the row
      let bx = tx;
      it.tags.slice(0, 3).forEach(tag => {
        setFont(ctx, 800, 22, SANS);
        const bw = ctx.measureText(titleCase(tag)).width + 36;
        if (bx + bw > pad + rowW - 24) return;
        const c = tagColor(tag, '#E5376B');
        puffyBox(ctx, bx, y + 120, bw, 40, 20, c, c, 'rgba(0,0,0,0.12)');
        ctx.fillStyle = '#FFFFFF'; ctx.textBaseline = 'middle'; ctx.fillText(titleCase(tag), bx + 18, y + 141); ctx.textBaseline = 'alphabetic';
        bx += bw + 10;
      });
    } else if (style === 'vhs') {
      let bx = tx;
      it.tags.slice(0, 3).forEach((tag, ti) => {
        setFont(ctx, 800, 22, SANS, 'italic');
        const bw = ctx.measureText(tag.toUpperCase()).width + 28;
        if (bx + bw > pad + rowW - 24) return;
        ctx.strokeStyle = VHS_BANDS[ti]; ctx.fillStyle = VHS_BANDS[ti]; ctx.lineWidth = 2;
        ctx.strokeRect(bx, y + 120, bw, 40); ctx.fillText(tag.toUpperCase(), bx + 14, y + 148);
        bx += bw + 10;
      });
    } else if (style === 'zine') {
      setFont(ctx, 600, 34, HAND); ctx.fillStyle = '#1E3FBF';
      fitText(ctx, it.tags.slice(0, 4).map(t => t.toLowerCase()).join(', '), tx, y + 152, rowW - (tx - pad) - 30, 34, 20, 600, HAND);
    } else {
      drawTagRow(ctx, skin, it.tags.slice(0, 4), tx, y + 112, rowW - (tx - pad) - 30, over || (style === 'stretch' ? {
        tagW: (c, tag, ti) => { setFont(c, ti === 0 ? 800 : 300, 28, SANS); return c.measureText((ti === 0 ? '' : '/ ') + titleCase(tag) + ' ').width; },
        tag: (c, tag, x, yy, ti) => { setFont(c, ti === 0 ? 800 : 300, 28, SANS); c.fillStyle = ti === 0 ? '#1F4CFF' : '#111111'; const t = (ti === 0 ? '' : '/ ') + titleCase(tag); c.fillText(t, x, yy + 34); return c.measureText(t + ' ').width; }
      } : null));
    }
  });
  if (style === 'stretch') skin.row(ctx, pad, headH + items.length * TREND_MENU_ROW_H - 12, rowW, 0, 0);
  skin.footer(ctx, width, height);
  spaced(ctx, 0);
  ctx.restore();
}
