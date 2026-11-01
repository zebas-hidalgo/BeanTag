/**
 * BeanTag story cards — Instagram 9:16, drawn natively at 1080×1920.
 *
 * Shared layout rules (every style):
 *  - Safe zone: nothing essential above y=250 (profile bar) or below y=1580 (reply bar).
 *  - Side margin 96 px, 8 px rhythm, gaps of 16/24/32/40/48.
 *  - Type floor on a 1080 px image (≈ 0.36 pt per px on a phone):
 *      labels 30 px (≈11 pt), body 40 px (≈14 pt), values 40–52 px, titles 56+ px.
 *  - Never an ellipsis: text wraps first, then shrinks to the floor.
 *  - Vertical budget: each style is measured first (nothing drawn) at decreasing
 *    density levels; the first level that fits its frame is the one drawn.
 *
 * Styles: stretch (Tipográfica), zine (Collage), lata (Lata), etiqueta (Etiqueta), origen (Origen).
 */

export const STORY_STYLES = ['stretch', 'zine', 'lata', 'etiqueta', 'origen'];

const W = 1080;
const H = 1920;
const M = 96;              // side margin
const CW = W - 2 * M;      // content width: 888
const FOOT_Y = 1540;       // footer baseline (inside the safe zone)
const LABEL = 30;
const BODY = 40;
const VALUE_MIN = 40;

const SANS = '"Inter", -apple-system, "Helvetica Neue", Arial, sans-serif';
const DISPLAY = '"Bricolage Grotesque", "Inter", Arial, sans-serif';
const MONO = '"JetBrains Mono", "SF Mono", Menlo, monospace';
const SERIF = '"Playfair Display", Georgia, serif';
const HAND = '"Caveat", "Bradley Hand", "Segoe Print", cursive';

const CEREZA = '#C23B22';
const ROAST = { claro: '#C98A3E', medio: '#8E5226', oscuro: '#4B2A1A' };

// Density levels tried in order: k scales titles and values (floors still apply)
// extra=false hides secondary lines (roaster in subtitles, variety and SCA inside the Lata badge)
const LEVELS = [
  { k: 1, note: true, tags: 3, extra: true },
  { k: 0.88, note: true, tags: 3, extra: true },
  { k: 0.78, note: false, tags: 3, extra: true },
  { k: 0.7, note: false, tags: 2, extra: false },
  { k: 0.62, note: false, tags: 2, extra: false },
  { k: 0.55, note: false, tags: 0, extra: false }
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function font(ctx, weight, size, family, style = '') {
  ctx.font = `${style ? style + ' ' : ''}${weight} ${Math.round(size)}px ${family}`;
}

function spaced(ctx, px) {
  try { ctx.letterSpacing = `${px}px`; } catch (e) { /* older browsers */ }
}

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

function wrap(ctx, text, maxW) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  const out = [];
  let cur = '';
  words.forEach((w) => {
    const cand = cur ? `${cur} ${w}` : w;
    if (!cur || ctx.measureText(cand).width <= maxW) cur = cand;
    else { out.push(cur); cur = w; }
  });
  if (cur) out.push(cur);
  return out;
}

/**
 * Largest size in [min, max] where the text wraps into <= maxLines, every line fits maxW
 * and the block fits maxH. At the floor it keeps wrapping (never cuts). ok=false if it overflowed.
 */
function fit(ctx, text, { maxW, maxLines = 2, maxH = Infinity, max, min, weight, family, style = '', lh = 1.15, upper = false }) {
  const str = upper ? String(text || '').toUpperCase() : String(text || '');
  max = Math.max(min, Math.round(max));
  for (let s = max; s >= min; s -= 2) {
    font(ctx, weight, s, family, style);
    const ls = wrap(ctx, str, maxW);
    if (ls.length <= maxLines && ls.every((l) => ctx.measureText(l).width <= maxW) && ls.length * s * lh <= maxH) {
      return { size: s, lines: ls, lineH: Math.round(s * lh), height: Math.round(ls.length * s * lh), ok: true };
    }
  }
  font(ctx, weight, min, family, style);
  const ls = wrap(ctx, str, maxW);
  return { size: min, lines: ls, lineH: Math.round(min * lh), height: Math.round(ls.length * min * lh), ok: false };
}

// Draws a fitted block with its first baseline at y + size*0.82. Returns the block height.
function draw(ctx, f, x, y, align = 'left') {
  ctx.textAlign = align;
  f.lines.forEach((l, i) => ctx.fillText(l, x, y + Math.round(f.size * 0.82) + i * f.lineH));
  ctx.textAlign = 'left';
  return f.height;
}

function label(ctx, text, x, y, color, align = 'left', track = 2) {
  ctx.fillStyle = color;
  font(ctx, 500, LABEL, MONO);
  spaced(ctx, track);
  ctx.textAlign = align;
  ctx.fillText(String(text).toUpperCase(), x, y + 24);
  ctx.textAlign = 'left';
  spaced(ctx, 0);
  return LABEL;
}

function seeded(str) {
  let h = 2166136261;
  const s = String(str || 'beantag');
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  let seed = h >>> 0;
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}

const first = (v) => String(v || '').split(/[,/]/)[0].trim();
const cap = (t) => { const s = String(t || '').trim(); return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : ''; };
const placeOf = (d) => [first(d.origin), d.process].filter(Boolean).join(' · ');

function roastOf(d) {
  const r = String(d.roastLevel || '').toLowerCase();
  if (/oscuro|dark/.test(r)) return { word: 'Oscuro', color: ROAST.oscuro, ink: '#FFFFFF' };
  if (/claro|light/.test(r)) return { word: 'Claro', color: ROAST.claro, ink: '#1F1206' };
  return { word: 'Medio', color: ROAST.medio, ink: '#FFFFFF' };
}

function cellsOf(d, inc) {
  if (inc) {
    return [
      { k: 'Método', v: d.method || '—' },
      { k: 'Dosis', v: d.coffeeG && d.waterG ? `${d.coffeeG} g → ${d.waterG} g` : `1:${d.ratio}` },
      { k: 'Molienda', v: d.grinderName ? `${d.grinderName} · ${d.grind}` : d.grind },
      { k: 'Agua · tiempo', v: `${d.temp} · ${d.time}` }
    ];
  }
  return [
    { k: 'Origen', v: first(d.origin) || '—' },
    { k: 'Proceso', v: d.process || '—' },
    { k: 'Variedad', v: first(d.variety) || '—' },
    { k: 'Altitud', v: d.altitude || '—' }
  ];
}

/**
 * 2×2 grid of label/value cells. Both cells of a row share one value size so baselines align.
 * Returns the height used (also when drawing into the measuring context).
 */
function grid(ctx, cells, x, y, w, c) {
  const gap = c.gap || 40;
  const colW = Math.floor((w - gap) / 2);
  const family = c.family || SANS;
  const weight = c.weight || 600;
  const vmax = Math.max(VALUE_MIN, c.value || 52);
  let yy = y;
  for (let r = 0; r < 2; r++) {
    const row = cells.slice(r * 2, r * 2 + 2);
    if (!row.length) break;
    const fits = row.map((cell) => fit(ctx, cell.v, { maxW: colW, maxLines: 2, max: vmax, min: VALUE_MIN, weight, family, lh: 1.12 }));
    const size = Math.min(...fits.map((f) => f.size));
    const sized = row.map((cell) => fit(ctx, cell.v, { maxW: colW, maxLines: 9, max: size, min: size, weight, family, lh: 1.12 }));
    const valH = Math.max(...sized.map((f) => f.height));
    row.forEach((cell, i) => {
      const cx = x + i * (colW + gap);
      label(ctx, cell.k, cx, yy, c.label, 'left', 1.5);
      ctx.fillStyle = c.ink;
      font(ctx, weight, size, family);
      draw(ctx, sized[i], cx, yy + LABEL + 14);
    });
    yy += LABEL + 14 + valH;
    if (r === 0 && cells.length > 2) {
      if (c.rule) { ctx.fillStyle = c.rule; ctx.fillRect(x, yy + 22, w, 2); }
      yy += 48;
    }
  }
  return yy - y;
}

// Pills that wrap onto more rows. Returns the height used.
function pills(ctx, items, x, y, maxW, c) {
  const size = c.size || 36;
  const padX = 24;
  const h = Math.round(size * 1.9);
  let cx = x;
  let cy = y;
  font(ctx, c.weight || 500, size, c.family || SANS);
  items.forEach((t) => {
    const w = Math.ceil(ctx.measureText(t).width) + padX * 2;
    if (cx > x && cx + w > x + maxW) { cx = x; cy += h + 12; }
    ctx.fillStyle = c.bg;
    rr(ctx, cx, cy, w, h, h / 2);
    ctx.fill();
    ctx.fillStyle = c.ink;
    ctx.fillText(t, cx + padX, cy + Math.round(h / 2 + size * 0.36));
    cx += w + 12;
  });
  return items.length ? cy + h - y : 0;
}

/** The BeanTag mark: a coffee bean with a hang-tag punch. size = box in px. */
export function drawMark(ctx, cx, cy, size, fill, cut, hole = true) {
  const s = size / 100;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((-28 * Math.PI) / 180);
  ctx.scale(s, s);
  ctx.translate(-50, -50);
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(50, 52, 29, 40, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = cut;
  ctx.lineWidth = size < 48 ? 8 : 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(50, 31);
  ctx.bezierCurveTo(40, 45, 60, 58, 50, 72);
  ctx.bezierCurveTo(46, 78, 47, 84, 50, 88);
  ctx.stroke();
  if (hole) {
    ctx.fillStyle = cut;
    ctx.beginPath();
    ctx.arc(50, 21, 4.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// Footer: mark + wordmark left, optional label right. Baseline at y.
function footer(ctx, y, c, right) {
  drawMark(ctx, M + 26, y - 14, 60, c.markFill, c.markCut);
  ctx.fillStyle = c.ink;
  font(ctx, 700, 40, DISPLAY);
  spaced(ctx, -1);
  ctx.fillText('beantag', M + 66, y);
  spaced(ctx, 0);
  if (right) {
    ctx.fillStyle = c.muted || c.ink;
    font(ctx, 500, LABEL, MONO);
    spaced(ctx, 1.5);
    ctx.textAlign = 'right';
    ctx.fillText(String(right).toUpperCase(), W - M, y);
    ctx.textAlign = 'left';
    spaced(ctx, 0);
  }
}

function dateLabel() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getFullYear()).slice(2)}`;
}

/** A context that measures text exactly like the real one but draws nothing. */
function measuring(ctx) {
  const noop = () => {};
  return new Proxy(ctx, {
    get(target, prop) {
      if (prop === 'measureText') return target.measureText.bind(target);
      const v = target[prop];
      return typeof v === 'function' ? noop : v;
    },
    set(target, prop, value) {
      if (prop === 'font' || prop === 'letterSpacing') target[prop] = value;
      return true;
    }
  });
}

// ---------------------------------------------------------------------------
// 1. Tipográfica (stretch): type is the image
// ---------------------------------------------------------------------------
function drawStretch(ctx, d, inc, lv) {
  const BG = '#F0EEE9', INK = '#111111', MUTED = '#4A4740', ACCENT = '#2440E6';
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);
  let y = 290;

  const top = [d.roaster, first(d.origin)].filter(Boolean).join(' — ') || 'Café de especialidad';
  const topF = fit(ctx, top, { maxW: d.sca ? CW - 260 : CW, maxLines: 2, max: LABEL, min: LABEL, weight: 500, family: MONO, lh: 1.3, upper: true });
  ctx.fillStyle = MUTED; spaced(ctx, 2); draw(ctx, topF, M, y); spaced(ctx, 0);
  if (d.sca) label(ctx, `SCA ${d.sca}`, W - M, y, ACCENT, 'right');
  y += topF.height + 40;

  // Stretched display title: drawn at size s, scaled 1.5× vertically
  const SY = 1.5;
  const t = fit(ctx, d.name, { maxW: CW, maxLines: 4, maxH: (520 * lv.k) / SY, max: 190 * lv.k, min: 56, weight: 900, family: SANS, lh: 0.92, upper: true });
  ctx.save();
  ctx.translate(M, y);
  ctx.scale(1, SY);
  font(ctx, 900, t.size, SANS);
  spaced(ctx, -2);
  t.lines.forEach((l, i) => {
    ctx.fillStyle = i === t.lines.length - 1 && t.lines.length > 1 ? ACCENT : INK;
    ctx.fillText(l, 0, Math.round(t.size * 0.8) + i * t.lineH);
  });
  spaced(ctx, 0);
  ctx.restore();
  y += Math.round(t.height * SY) + 40;

  const place = placeOf(d);
  if (place) {
    ctx.fillStyle = MUTED;
    const pf = fit(ctx, place, { maxW: CW, maxLines: 2, max: BODY, min: BODY, weight: 400, family: SANS, lh: 1.3 });
    font(ctx, 400, BODY, SANS);
    y += draw(ctx, pf, M, y) + 40;
  }

  ctx.fillStyle = INK; ctx.fillRect(M, y, CW, 4); y += 40;
  y += grid(ctx, cellsOf(d, inc), M, y, CW, { label: MUTED, ink: INK, value: 52 * lv.k, rule: 'rgba(17,17,17,0.18)' }) + 40;
  ctx.fillStyle = INK; ctx.fillRect(M, y, CW, 2); y += 40;

  const tags = (d.tags || []).map(cap).filter(Boolean).slice(0, lv.tags);
  if (tags.length) {
    // first note in accent, the rest in ink: color changes between words, never inside one
    font(ctx, 600, 48, SANS);
    let x = M;
    tags.forEach((tg, i) => {
      const s = (i ? ' / ' : '') + tg;
      const w = ctx.measureText(s).width;
      if (x + w > W - M) { x = M; y += 60; }
      ctx.fillStyle = i === 0 ? ACCENT : INK;
      ctx.fillText(s, x, y + 40);
      x += w;
    });
    y += 72;
  }
  if (inc && d.note && lv.note) {
    ctx.fillStyle = MUTED;
    const nf = fit(ctx, `“${d.note}”`, { maxW: CW, maxLines: 2, max: BODY, min: BODY, weight: 400, family: SANS, style: 'italic', lh: 1.3 });
    font(ctx, 400, BODY, SANS, 'italic');
    y += draw(ctx, nf, M, y + 8) + 8;
  }

  footer(ctx, FOOT_Y, { ink: INK, muted: MUTED, markFill: CEREZA, markCut: BG }, inc ? d.extractionLabel || dateLabel() : d.roastLevel);
  return { fits: t.ok && y <= FOOT_Y - 72 };
}

// ---------------------------------------------------------------------------
// 2. Collage (zine): paper, tape, stamp, handwriting
// ---------------------------------------------------------------------------
function paper(ctx, x, y, w, h, rot, fill) {
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate((rot * Math.PI) / 180);
  ctx.shadowColor = 'rgba(40,30,15,0.22)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 14;
  ctx.fillStyle = fill;
  rr(ctx, -w / 2, -h / 2, w, h, 6);
  ctx.fill();
  ctx.restore();
}

function tape(ctx, cx, cy, w, rot) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((rot * Math.PI) / 180);
  ctx.fillStyle = 'rgba(246,214,110,0.78)';
  ctx.fillRect(-w / 2, -22, w, 44);
  ctx.restore();
}

function chip(ctx, text, x, y, bg, ink) {
  font(ctx, 500, LABEL, MONO);
  spaced(ctx, 1.5);
  const w = ctx.measureText(text).width + 32;
  ctx.fillStyle = bg; ctx.fillRect(x, y, w, 48);
  ctx.fillStyle = ink; ctx.fillText(text, x + 16, y + 35);
  spaced(ctx, 0);
  return 48;
}

function drawZine(ctx, d, inc, lv) {
  const BG = '#E9E2D3', INK = '#1E1B16', MUTED = '#4F4A42', RED = '#B3261E';
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);
  const rnd = seeded(d.name);
  ctx.fillStyle = 'rgba(80,60,30,0.07)';
  for (let i = 0; i < 900; i++) ctx.fillRect(rnd() * W, rnd() * H, 2 + rnd() * 2, 2 + rnd() * 2);

  // Paper 1: the coffee
  const pX = 80, pW = 920, inX = pX + 56, stampW = d.sca ? 190 : 0;
  const t = fit(ctx, d.name, { maxW: pW - 112 - stampW, maxLines: 4, maxH: 340 * lv.k, max: 120 * lv.k, min: 60, weight: 700, family: SERIF, lh: 1.05 });
  const sub = [placeOf(d), d.roaster && lv.extra ? `Tostado por ${d.roaster}` : ''].filter(Boolean).join(' · ');
  const sf = sub ? fit(ctx, sub, { maxW: pW - 112, maxLines: lv.extra ? 3 : 2, max: BODY, min: BODY, weight: 400, family: SANS, lh: 1.3 }) : null;
  const p1Y = 290;
  const p1H = 56 + 48 + 32 + t.height + (sf ? 24 + sf.height : 0) + 56;
  paper(ctx, pX, p1Y, pW, p1H, -1.4, '#FBF8F1');
  tape(ctx, pX + pW / 2, p1Y + 4, 220, -3);
  let y = p1Y + 56;
  y += chip(ctx, inc ? 'MI RECETA' : 'FICHA DEL LOTE', inX, y, INK, '#FBF8F1') + 32;
  ctx.fillStyle = INK; font(ctx, 700, t.size, SERIF);
  draw(ctx, t, inX, y);
  font(ctx, 700, t.size, SERIF);
  const lastW = ctx.measureText(t.lines[t.lines.length - 1] || '').width;
  ctx.fillStyle = 'rgba(232,90,120,0.28)';
  ctx.fillRect(inX, y + (t.lines.length - 1) * t.lineH + t.size * 0.62, lastW, t.size * 0.28);
  y += t.height;
  if (sf) { y += 24; ctx.fillStyle = MUTED; font(ctx, 400, BODY, SANS); draw(ctx, sf, inX, y); }
  if (d.sca) {
    const sx = pX + pW - 116, sy = p1Y + 132;
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(0.18);
    ctx.strokeStyle = RED; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(0, 0, 86, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 72, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = RED; ctx.textAlign = 'center';
    font(ctx, 500, LABEL, MONO); ctx.fillText('SCA', 0, -22);
    font(ctx, 800, 48, SANS); ctx.fillText(String(d.sca), 0, 30);
    ctx.textAlign = 'left'; ctx.restore();
  }

  // Paper 2: recipe / bean data (measured first, then drawn on its paper)
  const p2X = 116, p2W = 848, p2Y = p1Y + p1H + 48;
  const cells = cellsOf(d, inc);
  const gc = { label: MUTED, ink: INK, family: MONO, weight: 500, value: 46 * lv.k };
  const gH = grid(measuring(ctx), cells, p2X + 56, 0, p2W - 112, gc);
  const p2H = 48 + 48 + 32 + gH + 56;
  paper(ctx, p2X, p2Y, p2W, p2H, 1.2, '#FFFFFF');
  tape(ctx, p2X + 90, p2Y + 6, 160, -12);
  let y2 = p2Y + 48;
  y2 += chip(ctx, inc ? 'RECETA' : 'DATOS', p2X + 56, y2, INK, '#FFFFFF') + 32;
  grid(ctx, cells, p2X + 56, y2, p2W - 112, gc);
  let bottom = p2Y + p2H;

  // Sticky note in handwriting: tasting notes (+ the brewer's note)
  const tags = (d.tags || []).map((s) => String(s).toLowerCase()).filter(Boolean).slice(0, lv.tags);
  const lines = [tags.join(', '), inc && d.note && lv.note ? `“${d.note}”` : ''].filter(Boolean);
  if (lines.length) {
    const nW = 760, nX = W - M - nW + 24, nY = bottom - 40; // overlaps the recipe paper, like a real collage
    const parts = lines.map((p) => fit(ctx, p, { maxW: nW - 96, maxLines: 3, max: 56, min: 48, weight: 600, family: HAND, lh: 1.08 }));
    const nH = 48 + parts.reduce((a, f) => a + f.height, 0) + (parts.length - 1) * 16 + 40;
    ctx.save(); ctx.translate(nX + nW / 2, nY + nH / 2); ctx.rotate(0.03);
    ctx.shadowColor = 'rgba(40,30,15,0.2)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10;
    ctx.fillStyle = '#FFE885'; ctx.fillRect(-nW / 2, -nH / 2, nW, nH);
    ctx.shadowColor = 'transparent';
    let ny = -nH / 2 + 48;
    ctx.fillStyle = '#2B2A8C';
    parts.forEach((f) => { font(ctx, 600, f.size, HAND); ny += draw(ctx, f, -nW / 2 + 48, ny) + 16; });
    ctx.restore();
    bottom = nY + nH;
  }

  footer(ctx, FOOT_Y, { ink: INK, muted: MUTED, markFill: CEREZA, markCut: BG }, `bitácora ${dateLabel()}`);
  return { fits: t.ok && bottom <= FOOT_Y - 70 };
}

// ---------------------------------------------------------------------------
// 3. Lata: unrolled craft-can label
// ---------------------------------------------------------------------------
function drawLata(ctx, d, inc, lv) {
  const GREEN = '#2F6B3F', ORANGE = '#FF6A1A', CREAM = '#FFF6E6', DARK = '#12301C';
  const BAND = 1478;
  ctx.fillStyle = GREEN;
  ctx.fillRect(0, 0, W, H);

  // top band
  ctx.fillStyle = ORANGE; ctx.fillRect(0, 250, W, 104);
  ctx.fillStyle = CREAM; ctx.fillRect(0, 366, W, 6);
  const right = String(inc ? d.method : roastOf(d).word).toUpperCase();
  font(ctx, 800, 34, SANS); spaced(ctx, 1.5);
  const rightW = ctx.measureText(right).width;
  const rf = fit(ctx, d.roaster || 'Café de especialidad', { maxW: CW - rightW - 48, maxLines: 1, max: 34, min: LABEL, weight: 800, family: SANS, upper: true });
  if (!rf.ok) {
    const short = fit(ctx, String(d.roaster || '').split(/\s+/).slice(0, 3).join(' '), { maxW: CW - rightW - 48, maxLines: 1, max: 34, min: LABEL, weight: 800, family: SANS, upper: true });
    rf.lines = short.lines; rf.size = short.size;
  }
  ctx.fillStyle = DARK; font(ctx, 800, rf.size, SANS);
  ctx.fillText(rf.lines[0] || '', M, 250 + 64);
  font(ctx, 800, 34, SANS); ctx.textAlign = 'right';
  ctx.fillText(right, W - M, 250 + 64);
  ctx.textAlign = 'left'; spaced(ctx, 0);

  // badge
  const R = Math.round(270 * Math.max(0.9, lv.k));
  const cx = W / 2, cy = 384 + R + 16;
  // side texts (vertical, never longer than the badge)
  const side = (text, x, rot) => {
    let str = String(text || '').toUpperCase();
    font(ctx, 600, LABEL, MONO); spaced(ctx, 6);
    while (str.includes(' ') && ctx.measureText(str).width > 2 * R) str = str.split(' ').slice(0, -1).join(' ');
    ctx.save(); ctx.translate(x, cy); ctx.rotate(rot);
    ctx.fillStyle = CREAM; ctx.textAlign = 'center';
    ctx.fillText(str, 0, 10);
    ctx.restore(); spaced(ctx, 0);
  };
  side(d.process || roastOf(d).word, 58, -Math.PI / 2);
  side(first(d.origin) || 'Origen', W - 58, Math.PI / 2);

  ctx.fillStyle = CREAM; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = ORANGE; ctx.lineWidth = 16; ctx.beginPath(); ctx.arc(cx, cy, R - 26, 0, Math.PI * 2); ctx.stroke();
  const inner = Math.round((R - 44) * 1.42); // usable width inside the ring
  const nf = fit(ctx, d.name, { maxW: inner, maxLines: 4, maxH: R * 0.95 * lv.k, max: 84 * lv.k, min: 44, weight: 900, family: SANS, lh: 0.98, upper: true });
  const sub = lv.extra ? [first(d.variety), d.process].filter(Boolean).join(' · ') : '';
  const sf = sub ? fit(ctx, sub, { maxW: inner - 40, maxLines: 2, max: LABEL, min: LABEL, weight: 600, family: SANS, lh: 1.2 }) : null;
  const pillH = 0; // SCA lives in the bottom band, so the badge only carries the coffee
  const blockH = LABEL + 20 + nf.height + (sf ? 20 + sf.height : 0) + (pillH ? 24 + pillH : 0);
  let by = cy - blockH / 2;
  ctx.textAlign = 'center';
  ctx.fillStyle = GREEN; font(ctx, 600, LABEL, MONO); spaced(ctx, 3);
  ctx.fillText(`TUESTE ${roastOf(d).word.toUpperCase()}`, cx, by + 24); spaced(ctx, 0);
  by += LABEL + 20;
  ctx.fillStyle = DARK; font(ctx, 900, nf.size, SANS); by += draw(ctx, nf, cx, by, 'center');
  if (sf) { by += 20; ctx.fillStyle = GREEN; font(ctx, 600, LABEL, SANS); by += draw(ctx, sf, cx, by, 'center'); }
  if (pillH) {
    by += 24;
    font(ctx, 800, 32, SANS);
    const s = `SCA ${d.sca}`; const w = ctx.measureText(s).width + 56;
    ctx.fillStyle = GREEN; rr(ctx, cx - w / 2, by, w, pillH, pillH / 2); ctx.fill();
    ctx.fillStyle = CREAM; ctx.textAlign = 'center'; ctx.fillText(s, cx, by + 40);
    by += pillH;
  }
  ctx.textAlign = 'left';
  const badgeFits = nf.ok && blockH <= (R - 40) * 2 * 0.86;

  // info strip
  const sY = cy + R + 40;
  const cells = cellsOf(d, inc);
  const gc = { label: '#3E6B4A', ink: DARK, weight: 700, value: 44 * lv.k, rule: 'rgba(18,48,28,0.2)' };
  const gH = grid(measuring(ctx), cells, M + 40, 0, CW - 80, gc);
  const sH = gH + 64;
  ctx.fillStyle = CREAM; rr(ctx, M, sY, CW, sH, 18); ctx.fill();
  grid(ctx, cells, M + 40, sY + 32, CW - 80, gc);
  let bottom = sY + sH;

  // tags (only when there is room above the band)
  const tags = (d.tags || []).map((t) => String(t).toUpperCase()).filter(Boolean).slice(0, lv.tags);
  if (tags.length) {
    const tf = fit(ctx, tags.join('  •  '), { maxW: CW, maxLines: 1, max: 44, min: BODY, weight: 800, family: SANS });
    if (tf.ok && bottom + 36 + tf.height <= BAND - 24) {
      ctx.fillStyle = CREAM; font(ctx, 800, tf.size, SANS);
      draw(ctx, tf, W / 2, bottom + 36, 'center');
      bottom += 36 + tf.height;
    }
  }

  // bottom band
  ctx.fillStyle = ORANGE; ctx.fillRect(0, BAND, W, 110);
  drawMark(ctx, M + 26, BAND + 53, 60, DARK, ORANGE);
  ctx.fillStyle = DARK; font(ctx, 700, 40, DISPLAY); spaced(ctx, -1); ctx.fillText('beantag', M + 66, BAND + 68); spaced(ctx, 0);
  font(ctx, 600, LABEL, MONO); spaced(ctx, 1.5); ctx.textAlign = 'right';
  ctx.fillText((d.sca ? `SCA ${d.sca}` : inc ? (d.extractionLabel || 'Mi receta') : 'Café de especialidad').toUpperCase(), W - M, BAND + 66);
  ctx.textAlign = 'left'; spaced(ctx, 0);
  return { fits: badgeFits && bottom <= BAND - 24 };
}

// ---------------------------------------------------------------------------
// 4. Etiqueta: a hang tag on a roast-colored ground (the brand's own form)
// ---------------------------------------------------------------------------
function drawEtiqueta(ctx, d, inc, lv) {
  const roast = roastOf(d);
  const TAG = '#FBFAF8', INK = '#1B1411', MUTED = '#5C554D', LINE = '#E3DDD4';
  ctx.fillStyle = roast.color;
  ctx.fillRect(0, 0, W, H);

  const tx = 112, tw = W - 224, ty = 300, tb = 1500, cut = 120;
  ctx.strokeStyle = 'rgba(255,248,236,0.85)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(470, 0); ctx.bezierCurveTo(500, 150, 560, 230, W / 2, 386); ctx.stroke();

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.28)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 24;
  ctx.fillStyle = TAG;
  ctx.beginPath();
  ctx.moveTo(tx + cut, ty);
  ctx.lineTo(tx + tw - cut, ty);
  ctx.lineTo(tx + tw, ty + cut);
  ctx.lineTo(tx + tw, tb - 40);
  ctx.quadraticCurveTo(tx + tw, tb, tx + tw - 40, tb);
  ctx.lineTo(tx + 40, tb);
  ctx.quadraticCurveTo(tx, tb, tx, tb - 40);
  ctx.lineTo(tx, ty + cut);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = LINE; ctx.beginPath(); ctx.arc(W / 2, 386, 38, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = roast.color; ctx.beginPath(); ctx.arc(W / 2, 386, 24, 0, Math.PI * 2); ctx.fill();

  const x = tx + 72, w = tw - 144;
  let y = 470;
  drawMark(ctx, x + 22, y + 20, 52, CEREZA, TAG);
  ctx.fillStyle = INK; font(ctx, 700, 36, DISPLAY); spaced(ctx, -1); ctx.fillText('beantag', x + 58, y + 34); spaced(ctx, 0);
  font(ctx, 500, LABEL, SANS);
  const pw = ctx.measureText(roast.word).width + 76;
  ctx.fillStyle = '#EFEAE2'; rr(ctx, x + w - pw, y, pw, 52, 26); ctx.fill();
  ctx.fillStyle = roast.color; ctx.beginPath(); ctx.arc(x + w - pw + 30, y + 26, 10, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = INK; ctx.fillText(roast.word, x + w - pw + 50, y + 37);
  y += 52 + 56;

  const t = fit(ctx, d.name, { maxW: w, maxLines: 4, maxH: 300 * lv.k, max: 110 * lv.k, min: 56, weight: 700, family: DISPLAY, lh: 1.0 });
  ctx.fillStyle = INK; font(ctx, 700, t.size, DISPLAY); spaced(ctx, -2); draw(ctx, t, x, y); spaced(ctx, 0);
  y += t.height + 24;
  const place = placeOf(d);
  if (place) {
    ctx.fillStyle = MUTED;
    const pf = fit(ctx, place, { maxW: w, maxLines: 2, max: BODY, min: BODY, weight: 400, family: SANS, lh: 1.3 });
    font(ctx, 400, BODY, SANS);
    y += draw(ctx, pf, x, y);
  }
  y += 40;

  const dash = (yy) => { ctx.fillStyle = '#CFC8BE'; for (let i = x; i < x + w; i += 24) ctx.fillRect(i, yy, 12, 3); };
  dash(y); y += 36;

  // label / value rows like a garment tag
  const cells = cellsOf(d, inc);
  cells.forEach((c, i) => {
    label(ctx, c.k, x, y + 6, MUTED, 'left', 1.5);
    ctx.fillStyle = INK;
    const vf = fit(ctx, c.v, { maxW: w - 300, maxLines: 2, max: 44 * lv.k, min: VALUE_MIN, weight: 600, family: SANS, lh: 1.12 });
    font(ctx, 600, vf.size, SANS);
    draw(ctx, vf, x + w, y, 'right');
    y += Math.max(LABEL + 12, vf.height) + (i < cells.length - 1 ? 28 : 0);
  });
  y += 36; dash(y); y += 36;

  const tags = (d.tags || []).map(cap).filter(Boolean).slice(0, lv.tags);
  if (tags.length) y += pills(ctx, tags, x, y, w, { bg: '#EFEAE2', ink: INK, size: 36 }) + 32;
  if (inc && d.note && lv.note) {
    ctx.fillStyle = MUTED;
    const nf = fit(ctx, `“${d.note}”`, { maxW: w, maxLines: 2, max: BODY, min: BODY, weight: 400, family: SANS, style: 'italic', lh: 1.3 });
    font(ctx, 400, BODY, SANS, 'italic');
    y += draw(ctx, nf, x, y);
  }
  if (d.sca) {
    ctx.fillStyle = MUTED; font(ctx, 500, LABEL, MONO); spaced(ctx, 1.5); ctx.textAlign = 'right';
    ctx.fillText(`SCA ${d.sca}`, x + w, tb - 56); ctx.textAlign = 'left'; spaced(ctx, 0);
  }
  return { fits: t.ok && y <= tb - (d.sca ? 112 : 64) };
}

// ---------------------------------------------------------------------------
// 5. Origen: contour lines from the farm's altitude
// ---------------------------------------------------------------------------
function drawOrigen(ctx, d, inc, lv) {
  const BG = '#EEE8DC', INK = '#1B1411', MUTED = '#5C554D', LINE = 'rgba(120,96,64,0.28)';
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  const rnd = seeded(`${d.name}${d.origin}`);
  const sx = 640 + rnd() * 220, sy = 560 + rnd() * 160;
  const phases = [rnd() * 6.28, rnd() * 6.28, rnd() * 6.28];
  ctx.strokeStyle = LINE; ctx.lineWidth = 2.4;
  for (let k = 0; k < 22; k++) {
    const base = 46 + k * 52;
    const amp = 10 + k * 5.5;
    ctx.beginPath();
    for (let a = 0; a <= 64; a++) {
      const th = (a / 64) * Math.PI * 2;
      const r = base + amp * (Math.sin(3 * th + phases[0]) * 0.5 + Math.sin(5 * th + phases[1]) * 0.3 + Math.sin(2 * th + phases[2]) * 0.4);
      const px = sx + Math.cos(th) * r * 1.15, py = sy + Math.sin(th) * r * 0.9;
      if (a === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.stroke();
  }
  ctx.fillStyle = 'rgba(194,59,34,0.18)'; ctx.beginPath(); ctx.arc(sx, sy, 34, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = CEREZA; ctx.beginPath(); ctx.arc(sx, sy, 15, 0, Math.PI * 2); ctx.fill();

  let y = 290;
  label(ctx, 'Origen', M, y, MUTED); y += LABEL + 16;
  const region = first(d.origin) || 'Café de especialidad';
  const rf = fit(ctx, region, { maxW: 620, maxLines: 2, maxH: 230 * lv.k, max: 104 * lv.k, min: 60, weight: 700, family: DISPLAY, lh: 1.0 });
  ctx.fillStyle = INK; font(ctx, 700, rf.size, DISPLAY); spaced(ctx, -2); y += draw(ctx, rf, M, y); spaced(ctx, 0);
  y += 48;

  // hero: the altitude number (data, not decoration)
  const alt = String(d.altitude || '').match(/\d[\d.,]*/);
  if (alt) {
    const hs = Math.round(220 * Math.max(0.75, lv.k));
    font(ctx, 800, hs, DISPLAY); spaced(ctx, -8);
    ctx.fillStyle = INK; ctx.fillText(alt[0], M - 8, y + Math.round(hs * 0.86));
    const aw = ctx.measureText(alt[0]).width; spaced(ctx, 0);
    ctx.fillStyle = MUTED; font(ctx, 500, BODY, SANS); ctx.fillText('msnm', M + aw + 20, y + Math.round(hs * 0.84));
    y += hs + 40;
  }

  const cells = inc ? cellsOf(d, true) : [
    { k: 'Proceso', v: d.process || '—' },
    { k: 'Variedad', v: first(d.variety) || '—' },
    { k: 'Tueste', v: roastOf(d).word },
    { k: 'Tostador', v: d.roaster || '—' }
  ];
  const nf = fit(ctx, d.name, { maxW: CW - 48, maxLines: 3, max: 64 * lv.k, min: 48, weight: 700, family: SANS, lh: 1.08 });
  const gc = { label: MUTED, ink: INK, value: 46 * lv.k, rule: 'rgba(27,20,17,0.12)' };
  const gH = grid(measuring(ctx), cells, M + 24, 0, CW - 48, gc);
  const tags = (d.tags || []).map(cap).filter(Boolean).slice(0, lv.tags);
  const tagsH = tags.length ? pills(measuring(ctx), tags, M + 24, 0, CW - 48, { bg: '#EFE9DF', ink: INK, size: 34 }) : 0;
  const panelH = 48 + nf.height + 40 + gH + (tagsH ? 40 + tagsH : 0) + 48;
  const py = Math.min(y, FOOT_Y - 96 - panelH);
  ctx.save(); ctx.shadowColor = 'rgba(60,40,20,0.16)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 16;
  ctx.fillStyle = 'rgba(251,250,248,0.94)'; rr(ctx, M - 24, py, CW + 48, panelH, 32); ctx.fill(); ctx.restore();
  let yy = py + 48;
  ctx.fillStyle = INK; font(ctx, 700, nf.size, SANS); yy += draw(ctx, nf, M + 24, yy) + 40;
  yy += grid(ctx, cells, M + 24, yy, CW - 48, gc);
  if (tagsH) { yy += 40; pills(ctx, tags, M + 24, yy, CW - 48, { bg: '#EFE9DF', ink: INK, size: 34 }); }

  footer(ctx, FOOT_Y, { ink: INK, muted: MUTED, markFill: CEREZA, markCut: BG }, d.sca ? `SCA ${d.sca}` : '');
  // fits when the panel did not have to climb over the altitude number
  return { fits: rf.ok && py >= y - 8 };
}

// ---------------------------------------------------------------------------
const DRAW = { stretch: drawStretch, zine: drawZine, lata: drawLata, etiqueta: drawEtiqueta, origen: drawOrigen };

export function drawStoryCard(ctx, style, d, incRecipe) {
  const fn = DRAW[style] || drawStretch;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  let level = LEVELS[LEVELS.length - 1];
  for (const lv of LEVELS) {
    const probe = measuring(ctx);
    let res = { fits: false };
    try { res = fn(probe, d, incRecipe, lv) || res; } catch (e) { res = { fits: false }; }
    if (res.fits) { level = lv; break; }
  }
  ctx.save();
  fn(ctx, d, incRecipe, level);
  spaced(ctx, 0);
  ctx.restore();
}
