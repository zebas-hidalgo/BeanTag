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
