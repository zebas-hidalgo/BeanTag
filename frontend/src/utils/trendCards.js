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
function fitText(ctx, text, x, y, maxW, max, min, weight, family, style = '') {
  const str = String(text || '');
  fitSize(ctx, str, maxW, max, min, weight, family, style);
  if (ctx.measureText(str).width <= maxW) { ctx.fillText(str, x, y); return; }
  let t = str;
  while (t.length > 1 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1);
  ctx.fillText(t.trimEnd() + '…', x, y);
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
  return [
    { label: 'ORIGEN', value: d.origin || '—' },
    { label: 'PROCESO', value: d.process || '—' },
    { label: 'VARIEDAD', value: d.variety || '—' },
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
// 1. SQUISHY
// ---------------------------------------------------------------------------
function drawSquishy(ctx, d, incRecipe) {
  const bg = ctx.createRadialGradient(216, 0, 0, 216, 0, 1400);
  bg.addColorStop(0, '#E6EEFF');
  bg.addColorStop(0.55, '#F4EFE8');
  bg.addColorStop(1, '#F7E3DC');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Inflated blob
  ctx.save();
  ctx.shadowColor = 'rgba(229, 72, 127, 0.35)';
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 30;
  const blob = ctx.createRadialGradient(900, 380, 10, 960, 440, 200);
  blob.addColorStop(0, '#FFD1E1');
  blob.addColorStop(0.6, '#FF7AA8');
  blob.addColorStop(1, '#E5487F');
  ctx.fillStyle = blob;
  ctx.beginPath();
  ctx.ellipse(975, 440, 190, 175, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const puffy = (x, y, w, h, r, top, bottom, shadow) => {
    ctx.save();
    ctx.shadowColor = shadow;
    ctx.shadowBlur = 28;
    ctx.shadowOffsetY = 14;
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, top);
    g.addColorStop(1, bottom);
    ctx.fillStyle = g;
    rr(ctx, x, y, w, h, r);
    ctx.fill();
    ctx.restore();
    // top gloss
    ctx.save();
    const gl = ctx.createLinearGradient(0, y, 0, y + h * 0.5);
    gl.addColorStop(0, 'rgba(255,255,255,0.55)');
    gl.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gl;
    rr(ctx, x + 6, y + 4, w - 12, h * 0.5, r);
    ctx.fill();
    ctx.restore();
  };

  // Chips
  const chipY = 72;
  setFont(ctx, 800, 28, SANS);
  spaced(ctx, 1);
  const roasterTxt = (d.roaster || 'BeanTag').toUpperCase();
  const rw = Math.min(ctx.measureText(roasterTxt).width + 60, 620);
  puffy(72, chipY, rw, 64, 32, '#FFFFFF', '#EDEAF6', 'rgba(60,40,120,0.14)');
  ctx.fillStyle = '#1A1630';
  ctx.textBaseline = 'middle';
  fitText(ctx, roasterTxt, 102, chipY + 33, rw - 60, 28, 18, 800, SANS);
  if (d.sca) {
    const t = `SCA ${d.sca}`;
    setFont(ctx, 800, 28, SANS);
    const sw = ctx.measureText(t).width + 60;
    puffy(W - 72 - sw, chipY, sw, 64, 32, '#5B8CFF', '#1E4BFF', 'rgba(30,75,255,0.35)');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(t, W - 72 - sw + 30, chipY + 33);
  }
  spaced(ctx, 0);
  ctx.textBaseline = 'alphabetic';

  // Inflated title
  const { size, lines } = fitTitle(ctx, d.name, 650, 3, 124, 64, 900, SANS);
  const lineH = Math.round(size * 0.92);
  let y = 200 + size * 0.8;
  lines.forEach((l, i) => {
    const ly = y + i * lineH;
    ctx.save();
    ctx.shadowColor = 'rgba(30,75,255,0.35)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 14;
    ctx.fillStyle = '#8FA9FF';
    ctx.fillText(l, 72, ly + 6);
    ctx.restore();
    ctx.fillStyle = '#1E4BFF';
    ctx.fillText(l, 72, ly);
  });
  y += (lines.length - 1) * lineH;

  ctx.fillStyle = '#4B4570';
  fitText(ctx, [d.origin, d.process, d.altitude].filter(Boolean).join(' · '), 72, y + 62, 936, 30, 20, 600, SANS);

  // Metric pills
  const gy = y + 112;
  const cells = metricCells(d, incRecipe);
  const pw = (936 - 24) / 2;
  const ph = 142;
  cells.forEach((c, i) => {
    const px = 72 + (i % 2) * (pw + 24);
    const py = gy + Math.floor(i / 2) * (ph + 22);
    puffy(px, py, pw, ph, 44, '#FFFFFF', '#F1EEF9', 'rgba(60,40,120,0.13)');
    ctx.fillStyle = '#8A84AA';
    spaced(ctx, 2);
    fitText(ctx, c.label, px + 34, py + 48, pw - 68, 22, 16, 700, SANS);
    spaced(ctx, 0);
    ctx.fillStyle = '#1A1630';
    fitText(ctx, c.value, px + 34, py + 108, pw - 68, 50, 28, 900, SANS);
  });

  // Note bubbles
  let by = gy + 2 * ph + 22 + 40;
  let bx = 72;
  setFont(ctx, 800, 32, SANS);
  d.tags.slice(0, 4).forEach(tag => {
    const label = tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase();
    setFont(ctx, 800, 32, SANS);
    const bw = ctx.measureText(label).width + 64;
    if (bx + bw > W - 72) return;
    const col = tagColor(tag, '#E5376B');
    puffy(bx, by, bw, 70, 35, col, col, 'rgba(0,0,0,0.14)');
    ctx.fillStyle = '#FFFFFF';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, bx + 32, by + 37);
    ctx.textBaseline = 'alphabetic';
    bx += bw + 16;
  });
  if (d.tags.length) by += 70 + 44;

  if (d.note) {
    ctx.fillStyle = '#4B4570';
    setFont(ctx, 500, 28, SANS);
    drawWrapped(ctx, `“${d.note}”`, 72, by + 10, 900, 38, 3);
  }

  // Footer
  ctx.fillStyle = '#8A84AA';
  const foot = [...sensoryWords(d), d.ratingLabel].filter(Boolean).join(' · ');
  fitText(ctx, foot, 72, H - 56, 760, 24, 16, 700, SANS);
  ctx.textAlign = 'right';
  setFont(ctx, 800, 24, SANS);
  spaced(ctx, 3);
  ctx.fillText('BEANTAG', W - 72, H - 56);
  spaced(ctx, 0);
  ctx.textAlign = 'left';
}

// ---------------------------------------------------------------------------
// 2. STRETCH
// ---------------------------------------------------------------------------
function drawStretch(ctx, d, incRecipe) {
  const BLUE = '#1F4CFF';
  ctx.fillStyle = '#F0EEE9';
  ctx.fillRect(0, 0, W, H);

  // Meta line
  ctx.fillStyle = '#111111';
  spaced(ctx, 3);
  fitText(ctx, [d.roaster, d.origin].filter(Boolean).join(' — ').toUpperCase(), 64, 88, 780, 24, 16, 600, SANS);
  if (d.sca) {
    ctx.fillStyle = BLUE;
    ctx.textAlign = 'right';
    setFont(ctx, 700, 24, SANS);
    ctx.fillText(`SCA ${d.sca}`, W - 64, 88);
    ctx.textAlign = 'left';
  }
  spaced(ctx, 0);

  // Stretched display name: first two words huge, the rest goes to the subtitle
  const rawWords = d.name.split(/\s+/).filter(Boolean);
  const words = rawWords.map(w => w.toUpperCase());
  const big = words.length > 2 ? words.slice(0, 2) : words;
  const rest = rawWords.length > 2 ? rawWords.slice(2).join(' ') : '';
  const STRETCH = 1.75;
  let y = 126;
  big.forEach((word, i) => {
    const s = fitSize(ctx, word, 952, 212, 70, 900, SANS);
    spaced(ctx, -s * 0.05);
    const capH = s * 0.73 * STRETCH;
    // Leave room for accents above capitals (Í, Á, Ñ…)
    if (/[ÁÉÍÓÚÑÜÀÈÌÒÙÂÊÎÔÛ]/.test(word)) y += s * 0.16 * STRETCH;
    y += capH;
    ctx.save();
    ctx.translate(64, y);
    ctx.scale(1, STRETCH);
    if (i === big.length - 1) {
      // Accent: first half of the last big word in Luminous Blue
      const cut = Math.ceil(word.length / 2);
      const a = word.slice(0, cut);
      const b = word.slice(cut);
      ctx.fillStyle = BLUE;
      ctx.fillText(a, 0, 0);
      const aw = ctx.measureText(a).width;
      ctx.fillStyle = '#111111';
      ctx.fillText(b, aw, 0);
    } else {
      ctx.fillStyle = '#111111';
      ctx.fillText(word, 0, 0);
    }
    ctx.restore();
    spaced(ctx, 0);
    y += s * 0.1;
  });

  const subtitle = [rest, d.process, d.altitude].filter(Boolean).join(' · ');
  ctx.fillStyle = '#111111';
  fitText(ctx, subtitle, 64, y + 64, 952, 40, 24, 300, SANS);

  // Metrics row between rules
  const ry = Math.max(y + 110, 800);
  ctx.fillStyle = '#111111';
  ctx.fillRect(64, ry, 952, 3);
  const cells = incRecipe
    ? [
        { label: 'MÉTODO', value: d.method },
        { label: 'RATIO', value: `1:${d.ratio}` },
        { label: 'MOLIENDA', value: d.grind },
        { label: 'TIEMPO', value: d.time }
      ]
    : metricCells(d, false);
  const cw = 952 / 4;
  cells.forEach((c, i) => {
    const cx = 64 + i * cw;
    ctx.fillStyle = '#555555';
    spaced(ctx, 3);
    fitText(ctx, c.label, cx, ry + 44, cw - 16, 20, 14, 600, SANS);
    spaced(ctx, 0);
    ctx.fillStyle = '#111111';
    fitText(ctx, c.value, cx, ry + 112, cw - 20, 56, 26, 800, SANS);
  });
  ctx.fillRect(64, ry + 150, 952, 1);

  // Notes sentence: first tag in blue
  let ny = ry + 216;
  setFont(ctx, 300, 44, SANS);
  const tags = d.tags.slice(0, 4);
  const sentence = [tags.slice(1).join(' / '), d.note].filter(Boolean).join(' — ');
  if (tags.length) {
    setFont(ctx, 800, 44, SANS);
    ctx.fillStyle = BLUE;
    const first = tags[0].charAt(0).toUpperCase() + tags[0].slice(1).toLowerCase();
    ctx.fillText(first, 64, ny);
    const fw = ctx.measureText(first + ' ').width;
    setFont(ctx, 300, 44, SANS);
    ctx.fillStyle = '#111111';
    const restLine = sentence ? `/ ${sentence}` : '';
    const firstLines = wrapLines(ctx, restLine, 952 - fw);
    if (firstLines.length) {
      ctx.fillText(firstLines[0], 64 + fw, ny);
      const remaining = restLine.slice(firstLines[0].length).trim();
      if (remaining) drawWrapped(ctx, remaining, 64, ny + 56, 952, 56, 2);
    }
  } else if (d.note) {
    ctx.fillStyle = '#111111';
    drawWrapped(ctx, d.note, 64, ny, 952, 56, 3);
  }

  // Footer
  ctx.fillStyle = '#111111';
  spaced(ctx, 3);
  const left = incRecipe
    ? [d.coffeeG && d.waterG ? `${d.coffeeG}g → ${d.waterG}g` : '', d.temp].filter(Boolean).join(' · ')
    : [d.variety, d.roastLevel].filter(Boolean).join(' · ');
  fitText(ctx, left.toUpperCase(), 64, H - 52, 600, 22, 14, 600, SANS);
  ctx.textAlign = 'right';
  setFont(ctx, 600, 22, SANS);
  ctx.fillText([d.ratingLabel, 'BEANTAG'].filter(Boolean).join(' · '), W - 64, H - 52);
  ctx.textAlign = 'left';
  spaced(ctx, 0);
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

function blackLabel(ctx, text, x, y) {
  setFont(ctx, 700, 22, MONO);
  spaced(ctx, 2);
  const w = ctx.measureText(text).width + 28;
  ctx.fillStyle = '#1B1B1B';
  ctx.fillRect(x, y, w, 38);
  ctx.fillStyle = '#FBF8F1';
  ctx.fillText(text, x + 14, y + 27);
  spaced(ctx, 0);
}

function drawZine(ctx, d, incRecipe) {
  ctx.fillStyle = '#E9E2D3';
  ctx.fillRect(0, 0, W, H);
  // Photocopy grain
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  for (let gy = 0; gy < H; gy += 6) {
    for (let gx = (gy / 6) % 2 ? 3 : 0; gx < W; gx += 6) ctx.fillRect(gx, gy, 1, 1);
  }

  // Title sheet
  paper(ctx, 50, 70, 780, 460, -0.035, '#FBF8F1', true, 7, () => {
    blackLabel(ctx, `LOTE · ${(d.roaster || 'BEANTAG').toUpperCase()}`.slice(0, 40), 56, 48);
    const { size, lines } = fitTitle(ctx, d.name, 660, 3, 100, 54, 700, SERIF);
    const lh = Math.round(size * 1.0);
    lines.forEach((l, i) => {
      const ly = 110 + size * 0.85 + i * lh;
      if (i === lines.length - 1) {
        // Marker highlight under the last line
        setFont(ctx, 700, size, SERIF);
        const lw = ctx.measureText(l).width;
        ctx.fillStyle = 'rgba(255, 92, 140, 0.55)';
        ctx.fillRect(52, ly - size * 0.32, lw + 10, size * 0.32);
      }
      ctx.fillStyle = '#1B1B1B';
      setFont(ctx, 700, size, SERIF);
      ctx.fillText(l, 56, ly);
    });
    const subY = 110 + size * 0.85 + (lines.length - 1) * lh + 52;
    ctx.fillStyle = '#1B1B1B';
    fitText(ctx, [d.origin, d.process, d.altitude].filter(Boolean).join(' — '), 56, subY, 660, 26, 18, 600, SANS);
  });
  tape(ctx, 420, 76, 200, -0.1);

  // Stamp (SCA or rating)
  ctx.save();
  ctx.translate(912, 232);
  ctx.rotate(-0.24);
  ctx.strokeStyle = '#D2402B';
  ctx.fillStyle = '#D2402B';
  ctx.lineWidth = 6;
  ctx.beginPath(); ctx.arc(0, 0, 112, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 0, 98, 0, Math.PI * 2); ctx.stroke();
  ctx.textAlign = 'center';
  spaced(ctx, 3);
  setFont(ctx, 900, 20, SANS);
  ctx.fillText(d.sca ? 'SCA' : 'BEANTAG', 0, -42);
  ctx.fillText(d.sca ? 'CATADO' : 'BITÁCORA', 0, 64);
  spaced(ctx, 0);
  setFont(ctx, 900, 70, SANS);
  ctx.fillText(d.sca ? String(d.sca) : (d.rating ? `${d.rating}/5` : '✓'), 0, 26);
  ctx.textAlign = 'left';
  ctx.restore();

  // Recipe / origin sheet
  paper(ctx, 110, 570, 560, 430, 0.026, '#FBF8F1', false, 3, () => {
    blackLabel(ctx, incRecipe ? 'RECETA' : 'ORIGEN', 44, 44);
    ctx.fillStyle = '#1B1B1B';
    const rows = incRecipe
      ? [d.method.toUpperCase(),
        d.coffeeG && d.waterG ? `${d.coffeeG}g → ${d.waterG}g  (1:${d.ratio})` : `Ratio 1:${d.ratio}`,
        [d.grinderName, d.grind].filter(Boolean).join(' '),
        `${d.temp} · ${d.time}`]
      : [(d.origin || '').toUpperCase(), d.variety, d.process, [d.altitude, d.roastLevel].filter(Boolean).join(' · ')];
    rows.filter(Boolean).forEach((r, i) => {
      fitText(ctx, r, 44, 140 + i * 62, 470, i === 0 ? 40 : 30, 18, i === 0 ? 800 : 500, MONO);
    });
  });
  tape(ctx, 620, 566, 150, 0.14);

  // Handwritten sticky note
  paper(ctx, 600, 650, 430, 370, -0.05, '#FFF1A8', true, 11, () => {
    ctx.fillStyle = '#1E3FBF';
    setFont(ctx, 600, 44, HAND);
    const tagLine = d.tags.length ? `${d.tags.slice(0, 4).map(t => t.toLowerCase()).join(', ')}…` : '';
    const noteLine = d.note ? `“${d.note}”${d.rating ? ` ★${d.rating}` : ''}` : (d.rating ? `★${d.rating}` : '');
    let used = 0;
    if (tagLine) used = drawWrapped(ctx, tagLine, 40, 78, 350, 48, 3);
    if (noteLine) drawWrapped(ctx, noteLine, 40, 78 + (used ? used * 48 + 30 : 0), 350, 46, Math.max(1, 6 - used));
  });

  // Black profile strip
  paper(ctx, 70, 1066, 940, 190, -0.017, '#1B1B1B', false, 5, () => {
    ctx.fillStyle = '#FF5C8C';
    spaced(ctx, 3);
    setFont(ctx, 700, 24, SANS);
    ctx.fillText('PERFIL', 44, 62);
    spaced(ctx, 0);
    ctx.fillStyle = '#FBF8F1';
    const words = sensoryWords(d);
    const text = words.length ? words.join(' · ') : (d.tags.slice(0, 3).join(' · ') || 'Café de especialidad');
    fitText(ctx, text, 44, 138, 852, 54, 26, 900, SANS);
  });

  ctx.fillStyle = '#1B1B1B';
  ctx.textAlign = 'right';
  setFont(ctx, 500, 22, MONO);
  const dt = new Date();
  ctx.fillText(`beantag / bitácora ${String(dt.getDate()).padStart(2, '0')}.${String(dt.getMonth() + 1).padStart(2, '0')}.${String(dt.getFullYear()).slice(2)}`, W - 60, H - 30);
  ctx.textAlign = 'left';
}

// ---------------------------------------------------------------------------
// 4. VHS
// ---------------------------------------------------------------------------
function drawVhs(ctx, d, incRecipe) {
  const BANDS = ['#FF3D6E', '#FF8A3D', '#FFD23D', '#3DD9FF', '#6E7BFF'];
  ctx.fillStyle = '#0E0B14';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#15111D';
  rr(ctx, 40, 40, W - 80, H - 80, 18);
  ctx.fill();

  const L = 96;
  const R = W - 96;
  // Header
  ctx.fillStyle = '#F4F1EA';
  spaced(ctx, 7);
  setFont(ctx, 900, 34, SANS, 'italic');
  ctx.fillText('BEANTAG ▸▸ HQ', L, 110);
  spaced(ctx, 0);
  ctx.fillStyle = '#FF8A3D';
  ctx.textAlign = 'right';
  setFont(ctx, 500, 30, MONO);
  ctx.fillText(incRecipe ? `REC ● ${d.time}` : 'PLAY ▸', R, 110);
  ctx.textAlign = 'left';

  // Chrome title
  const { size, lines } = fitTitle(ctx, d.name.toUpperCase(), R - L, 2, 120, 60, 900, SANS, 'italic');
  const lh = Math.round(size * 0.92);
  lines.forEach((l, i) => {
    const ly = 196 + size * 0.8 + i * lh;
    const g = ctx.createLinearGradient(0, ly - size * 0.8, 0, ly);
    g.addColorStop(0, '#FFFFFF');
    g.addColorStop(0.45, '#C9D6FF');
    g.addColorStop(0.52, '#6E7BFF');
    g.addColorStop(1, '#F4F1EA');
    ctx.fillStyle = g;
    setFont(ctx, 900, size, SANS, 'italic');
    ctx.fillText(l, L, ly);
  });
  const subY = 196 + size * 0.8 + (lines.length - 1) * lh + 60;
  ctx.fillStyle = '#B9B3C9';
  spaced(ctx, 1.5);
  fitText(ctx, [d.roaster, d.origin, d.process, d.sca ? `SCA ${d.sca}` : ''].filter(Boolean).join(' · ').toUpperCase(), L, subY, R - L, 26, 16, 500, MONO);
  spaced(ctx, 0);

  // Rainbow bands
  const bandY = Math.max(subY + 50, 500);
  BANDS.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(40, bandY + i * 44, W - 80, 44); });

  // Spine grid
  const sy = bandY + 5 * 44 + 56;
  const cells = metricCells(d, incRecipe).map(c => ({ ...c, label: c.label.replace('TIEMPO · TEMP', 'TEMP') }));
  if (incRecipe) cells[3] = { label: 'TEMP', value: d.temp };
  const cw = (R - L) / 4;
  ctx.strokeStyle = '#3A3350';
  ctx.lineWidth = 2;
  ctx.strokeRect(L, sy, R - L, 130);
  cells.forEach((c, i) => {
    const cx = L + i * cw;
    if (i) { ctx.beginPath(); ctx.moveTo(cx, sy); ctx.lineTo(cx, sy + 130); ctx.stroke(); }
    ctx.fillStyle = '#8C84A6';
    spaced(ctx, 2);
    fitText(ctx, c.label, cx + 22, sy + 40, cw - 40, 18, 12, 500, MONO);
    spaced(ctx, 0);
    ctx.fillStyle = '#F4F1EA';
    fitText(ctx, String(c.value).toUpperCase(), cx + 22, sy + 98, cw - 40, 44, 22, 900, SANS, 'italic');
  });

  // Outlined note tags
  let tx = L;
  const ty = sy + 168;
  d.tags.slice(0, 4).forEach((tag, i) => {
    const t = tag.toUpperCase();
    setFont(ctx, 800, 28, SANS, 'italic');
    const tw = ctx.measureText(t).width + 44;
    if (tx + tw > R) return;
    ctx.strokeStyle = BANDS[i % BANDS.length];
    ctx.fillStyle = BANDS[i % BANDS.length];
    ctx.lineWidth = 2;
    ctx.strokeRect(tx, ty, tw, 56);
    ctx.fillText(t, tx + 22, ty + 38);
    tx += tw + 14;
  });

  // Terminal-style notes
  ctx.fillStyle = '#D7D1E6';
  setFont(ctx, 500, 26, MONO);
  let qy = ty + 120;
  if (d.note) qy += 39 * drawWrapped(ctx, `> ${d.note.toUpperCase()}`, L, qy, R - L, 39, 2);
  const sens = [...sensoryWords(d).map(w => w.toUpperCase()), d.rating ? stars(d.rating) : ''].filter(Boolean).join(' · ');
  if (sens) fitText(ctx, `> ${sens}`, L, qy, R - L, 26, 16, 500, MONO);

  // Footer
  ctx.fillStyle = '#8C84A6';
  setFont(ctx, 500, 22, MONO);
  ctx.fillText('SP ▸ T-120', L, H - 96);
  ctx.textAlign = 'right';
  ctx.fillText(incRecipe ? 'SIDE A · BITÁCORA' : 'SIDE B · ORIGEN', R, H - 96);
  ctx.textAlign = 'left';

  // Scanlines
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  for (let y = 40; y < H - 40; y += 5) ctx.fillRect(40, y, W - 80, 2);
}

// ---------------------------------------------------------------------------
// 5. LATA (craft-can label)
// ---------------------------------------------------------------------------
function drawLata(ctx, d, incRecipe) {
  const GREEN = '#2F6B3F';
  const DARK = '#1C3A24';
  const ORANGE = '#FF6A1A';
  const CREAM = '#FFF6E6';
  ctx.fillStyle = GREEN;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = ORANGE;
  ctx.fillRect(0, 0, W, 150);
  ctx.fillRect(0, H - 110, W, 110);
  ctx.fillStyle = CREAM;
  ctx.fillRect(0, 150, W, 22);

  // Top band
  ctx.fillStyle = DARK;
  spaced(ctx, 3);
  fitText(ctx, (d.roaster || 'BEANTAG').toUpperCase(), 60, 96, 700, 44, 24, 900, SANS);
  if (d.remaining !== null && d.remaining !== undefined) {
    ctx.textAlign = 'right';
    setFont(ctx, 900, 44, SANS);
    ctx.fillText(`N°${String(d.remaining).padStart(2, '0')}`, W - 60, 96);
    ctx.textAlign = 'left';
  }
  spaced(ctx, 0);

  // Vertical side texts
  const vert = (text, x, angle) => {
    ctx.save();
    ctx.translate(x, 560);
    ctx.rotate(angle);
    ctx.fillStyle = 'rgba(255,246,230,0.9)';
    spaced(ctx, 12);
    ctx.textAlign = 'center';
    fitText(ctx, text.toUpperCase(), 0, 14, 620, 40, 22, 900, SANS);
    ctx.textAlign = 'left';
    spaced(ctx, 0);
    ctx.restore();
  };
  vert(incRecipe ? `FILTRO · ${d.method}` : (d.process || 'SINGLE ORIGIN'), 86, Math.PI / 2);
  vert(d.origin || 'SPECIALTY', W - 86, -Math.PI / 2);

  // Round badge
  const cx = 540;
  const cy = 580;
  ctx.fillStyle = CREAM;
  ctx.beginPath(); ctx.arc(cx, cy, 304, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = ORANGE;
  ctx.beginPath(); ctx.arc(cx, cy, 294, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = CREAM;
  ctx.beginPath(); ctx.arc(cx, cy, 280, 0, Math.PI * 2); ctx.fill();

  ctx.textAlign = 'center';
  ctx.fillStyle = GREEN;
  spaced(ctx, 5);
  setFont(ctx, 800, 26, SANS);
  ctx.fillText('SINGLE ORIGIN', cx, cy - 150);
  spaced(ctx, 0);
  const { size, lines } = fitTitle(ctx, d.name.toUpperCase(), 430, 2, 96, 44, 900, SANS);
  const lh = size * 0.9 * 1.2;
  const blockH = lh * lines.length;
  lines.forEach((l, i) => {
    ctx.save();
    ctx.translate(cx, cy - blockH / 2 + 10 + (i + 1) * lh - size * 0.18);
    ctx.scale(1, 1.2);
    setFont(ctx, 900, size, SANS);
    spaced(ctx, -size * 0.04);
    ctx.fillText(l, 0, 0);
    spaced(ctx, 0);
    ctx.restore();
  });
  spaced(ctx, 3);
  fitText(ctx, [d.variety, d.process].filter(Boolean).join(' · ').toUpperCase(), cx, cy + blockH / 2 + 48, 420, 24, 14, 800, SANS);
  spaced(ctx, 0);
  if (d.sca) {
    setFont(ctx, 900, 30, SANS);
    const t = `SCA ${d.sca}`;
    const pw = ctx.measureText(t).width + 44;
    ctx.fillStyle = GREEN;
    rr(ctx, cx - pw / 2, cy + blockH / 2 + 74, pw, 50, 25);
    ctx.fill();
    ctx.fillStyle = CREAM;
    ctx.fillText(t, cx, cy + blockH / 2 + 110);
  }
  ctx.textAlign = 'left';

  // Facts bar
  const fy = 930;
  ctx.fillStyle = CREAM;
  rr(ctx, 60, fy, 960, 128, 14);
  ctx.fill();
  const facts = incRecipe
    ? [
        { label: 'DOSIS', value: d.coffeeG ? `${d.coffeeG}g` : '—' },
        { label: 'AGUA', value: d.waterG ? `${d.waterG}g` : '—' },
        { label: 'DIAL', value: d.grind },
        { label: d.time, value: d.temp }
      ]
    : [
        { label: 'ALTITUD', value: d.altitude || '—' },
        { label: 'VARIEDAD', value: d.variety || '—' },
        { label: 'TUESTE', value: d.roastLevel || '—' },
        { label: 'PRODUCTOR', value: d.producer || '—' }
      ];
  const fw = 960 / 4;
  facts.forEach((f, i) => {
    const fx = 60 + i * fw;
    if (i) {
      ctx.strokeStyle = GREEN;
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 7]);
      ctx.beginPath(); ctx.moveTo(fx, fy + 16); ctx.lineTo(fx, fy + 112); ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.fillStyle = '#5C7A62';
    spaced(ctx, 2);
    fitText(ctx, String(f.label).toUpperCase(), fx + 22, fy + 44, fw - 40, 18, 12, 800, SANS);
    spaced(ctx, 0);
    ctx.fillStyle = DARK;
    fitText(ctx, f.value, fx + 22, fy + 98, fw - 40, 40, 20, 900, SANS);
  });

  // Notes line with orange separators
  const tags = d.tags.slice(0, 4).map(t => t.toUpperCase());
  if (tags.length) {
    const SEP = '  ✺  ';
    let size2 = 40;
    for (; size2 > 22; size2 -= 2) {
      setFont(ctx, 900, size2, SANS);
      if (ctx.measureText(tags.join(SEP)).width <= 960) break;
    }
    setFont(ctx, 900, size2, SANS);
    let x = 540 - ctx.measureText(tags.join(SEP)).width / 2;
    tags.forEach((t, i) => {
      ctx.fillStyle = CREAM;
      ctx.fillText(t, x, 1150);
      x += ctx.measureText(t).width;
      if (i < tags.length - 1) {
        ctx.fillStyle = ORANGE;
        ctx.fillText(SEP, x, 1150);
        x += ctx.measureText(SEP).width;
      }
    });
  } else if (d.note) {
    ctx.fillStyle = CREAM;
    ctx.textAlign = 'center';
    fitText(ctx, d.note, 540, 1150, 960, 32, 18, 700, SANS);
    ctx.textAlign = 'left';
  }

  // Footer on the bottom band
  ctx.fillStyle = DARK;
  spaced(ctx, 3);
  fitText(ctx, [...sensoryWords(d), d.ratingLabel].filter(Boolean).join(' · ').toUpperCase() || 'SPECIALTY COFFEE', 60, H - 44, 760, 22, 14, 800, SANS);
  ctx.textAlign = 'right';
  setFont(ctx, 800, 22, SANS);
  ctx.fillText('BEANTAG', W - 60, H - 44);
  ctx.textAlign = 'left';
  spaced(ctx, 0);
}

/**
 * Entry point. ctx is already scaled so that 1 unit = baseW/1080 pixels;
 * we rescale to raw 1080x1350 pixel space for these designs.
 */
export function drawTrendCard(ctx, style, d, incRecipe, unitsPerPixel) {
  ctx.save();
  ctx.scale(unitsPerPixel, unitsPerPixel);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  if (style === 'squishy') drawSquishy(ctx, d, incRecipe);
  else if (style === 'stretch') drawStretch(ctx, d, incRecipe);
  else if (style === 'zine') drawZine(ctx, d, incRecipe);
  else if (style === 'vhs') drawVhs(ctx, d, incRecipe);
  else drawLata(ctx, d, incRecipe);
  spaced(ctx, 0);
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
      const lh = Math.round(size * 0.94);
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
      const words = String(text).toUpperCase().split(/\s+/).filter(Boolean);
      const lines = [];
      // Greedy: as many words per line as fit at a reasonable size
      let cur = '';
      words.forEach(wd => {
        const cand = cur ? `${cur} ${wd}` : wd;
        setFont(ctx, 900, maxSize * 0.62, SANS);
        if (!cur || ctx.measureText(cand).width <= maxW) cur = cand; else { lines.push(cur); cur = wd; }
      });
      if (cur) lines.push(cur);
      const used = lines.slice(0, maxLines);
      if (lines.length > maxLines) used[maxLines - 1] = lines.slice(maxLines - 1).join(' ');
      const S = 1.6;
      let yy = y;
      used.forEach((l, i) => {
        const s = fitSize(ctx, l, maxW, maxSize, 28, 900, SANS);
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
        yy += s * 0.08;
      });
      return yy;
    },
    meta(ctx, text, x, y, maxW, size = 30) { ctx.fillStyle = '#111111'; fitText(ctx, text, x, y, maxW, size, 16, 300, SANS); },
    small(ctx, text, x, y, maxW, size = 20) { ctx.fillStyle = '#555555'; spaced(ctx, 3); fitText(ctx, text.toUpperCase(), x, y, maxW, size, 13, 600, SANS); spaced(ctx, 0); },
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
    small(ctx, text, x, y, maxW, size = 20) {
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
      setFont(ctx, 900, 16, SANS); spaced(ctx, 2); ctx.fillText(parts.length > 1 ? parts[0] : 'BEANTAG', 0, -20); spaced(ctx, 0);
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
    ? { meta: (ctx, t, x, y, w) => { ctx.fillStyle = '#5C7A62'; spaced(ctx, 2); fitText(ctx, t.toUpperCase(), x, y, w, 20, 12, 800, SANS); spaced(ctx, 0); },
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
        setFont(ctx, 700, 20, MONO);
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
    else if (style === 'vhs' || style === 'zine') skin.meta(ctx, meta, tx, y + 104, rowW - (tx - pad) - 30, 20);
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
        setFont(ctx, 800, 20, SANS, 'italic');
        const bw = ctx.measureText(tag.toUpperCase()).width + 28;
        if (bx + bw > pad + rowW - 24) return;
        ctx.strokeStyle = VHS_BANDS[ti]; ctx.fillStyle = VHS_BANDS[ti]; ctx.lineWidth = 2;
        ctx.strokeRect(bx, y + 122, bw, 38); ctx.fillText(tag.toUpperCase(), bx + 14, y + 148);
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

// ---------------------------------------------------------------------------
// STICKERS (horizontal 1280x680, vertical 880x1160)
// ---------------------------------------------------------------------------
export function drawTrendSticker(ctx, style, d, opts, width, height) {
  const skin = SKINS[style] || SKINS.squishy;
  const { vertical, transparent, includeRecipe } = opts;
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  if (!transparent) skin.page(ctx, width, height);
  const m = transparent ? 24 : 40;
  const bx = m;
  const by = m;
  const bw = width - m * 2;
  const bh = height - m * 2;
  skin.shape(ctx, bx, by, bw, bh);

  const pad = vertical ? 56 : 60;
  const x = bx + pad;
  const innerW = bw - pad * 2;
  let y = by + (style === 'lata' ? 54 : 50);

  // Top row: roaster + score
  if (d.sca) {
    skin.badge(ctx, `SCA ${d.sca}`, bx + bw - pad, y - 6, true);
  }
  if (style === 'zine') skin.small(ctx, (d.roaster || 'BeanTag'), x, y + 28, innerW - 160);
  else if (style === 'lata') skin.meta(ctx, d.roaster || 'BeanTag', x, y + 30, innerW - 220, 24);
  else if (style === 'vhs') skin.small(ctx, d.roaster || 'BeanTag', x, y + 30, innerW - 220, 26);
  else skin.small(ctx, d.roaster || 'BeanTag', x, y + 30, innerW - 220, 24);
  y += 60;

  // Title
  const titleW = style === 'squishy' ? innerW - 170 : (style === 'zine' && d.sca ? innerW - 150 : innerW);
  const titleMax = vertical ? (style === 'stretch' ? 190 : 136) : (style === 'stretch' ? 120 : 92);
  y = skin.title(ctx, d.name, x, y, titleW, vertical ? 4 : 2, titleMax) + (style === 'stretch' ? 50 : 54);

  // Meta + recipe lines
  const metaText = [d.origin, d.process, d.altitude].filter(Boolean).join(' · ');
  skin.meta(ctx, metaText, x, y, innerW);
  y += 46;
  if (includeRecipe) {
    const rec = [d.method, d.coffeeG && d.waterG ? `${d.coffeeG}g → ${d.waterG}g` : '', d.ratio ? `1:${d.ratio}` : '', d.temp].filter(Boolean).join(' · ');
    skin.meta(ctx, rec, x, y, innerW);
    y += 46;
    if (vertical) {
      const sens = [d.balanceLabel, d.bodyLabel, d.extractionLabel, d.ratingLabel].filter(Boolean).join(' · ');
      if (sens) { skin.meta(ctx, sens, x, y, innerW); y += 46; }
    }
  }

  // Tags: horizontal → one row at the bottom; vertical → wrapped rows
  const tags = d.tags.slice(0, vertical ? 5 : 4);
  if (tags.length) {
    if (style === 'zine') {
      setFont(ctx, 600, vertical ? 46 : 40, HAND); ctx.fillStyle = '#1E3FBF';
      const text = tags.map(t => t.toLowerCase()).join(', ') + '…';
      const lines = vertical ? 3 : 1;
      const ty = vertical ? Math.max(y + 30, by + bh - 70 - (lines - 1) * 54) : by + bh - 70;
      drawWrapped(ctx, text, x, ty, innerW, 54, lines);
    } else {
      const rowH = skin.tagH + 14;
      if (vertical) {
        let tx = x;
        let ty = Math.max(y + 10, by + bh - pad - (style === 'vhs' ? 120 : 0) - rowH * 2);
        tags.forEach((tag, i) => {
          const w = skin.tagW(ctx, tag, i);
          if (tx + w > x + innerW) { tx = x; ty += rowH; }
          if (ty + skin.tagH > by + bh - 20) return;
          skin.tag(ctx, tag, tx, ty, i);
          tx += w + (style === 'squishy' || style === 'vhs' ? 12 : 0);
        });
      } else {
        const ty = by + bh - pad - skin.tagH - (style === 'vhs' ? 110 : (style === 'lata' ? 8 : 0)) + 10;
        drawTagRow(ctx, skin, tags, x, ty, innerW);
      }
    }
  }
  spaced(ctx, 0);
  ctx.restore();
}
