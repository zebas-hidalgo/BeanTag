/**
 * BeanTag stickers — transparent PNG cards to place OVER a coffee photo in an Instagram story.
 *
 * Proportions (story = 1080×1920 px ≈ 390 pt wide on a phone):
 *  - Horizontal 1280×720: meant for the lower part of the story at ~85 % width (≈ 0.27 pt per px).
 *  - Vertical   960×1280: meant for one side at ~55 % width (≈ 0.24 pt per px).
 *  Both leave most of the photo visible (≈ 28 % / ≈ 40 % of the story height).
 *
 * Type floor at those scales (≈ 10 pt labels, ≥ 12 pt values and body):
 *  - Horizontal: labels 38 px, body 46 px, values 44–52 px, title 70–100 px.
 *  - Vertical:   labels 42 px, body 50 px, values 48–58 px, title 84–124 px.
 * Spacing on an 8 px rhythm; the card sits 40 px inside the canvas so its shadow is never cut.
 * Every sticker is measured first (nothing drawn) at decreasing density levels; the first level
 * whose content fits the card is drawn. Never an ellipsis: words wrap, then sizes step down.
 *
 * Styles: stretch (Tipográfica), zine (Collage), lata (Lata), etiqueta (Etiqueta), origen (Origen).
 */

export const STICKER_STYLES = ['stretch', 'zine', 'lata', 'etiqueta', 'origen'];
export const STICKER_SIZES = { horizontal: { w: 1280, h: 720 }, vertical: { w: 960, h: 1280 } };

const SPEC = {
  horizontal: { margin: 40, pad: 56, label: 38, body: 46, vMax: 52, vMin: 44, tMax: 100, tMin: 70, chip: 40, foot: 40, gap: 24 },
  vertical: { margin: 40, pad: 64, label: 44, body: 52, vMax: 60, vMin: 50, tMax: 124, tMin: 84, chip: 46, foot: 44, gap: 28 }
};

const LEVELS = [
  { k: 1, place: true, notes: 3 },
  { k: 0.9, place: true, notes: 3 },
  { k: 0.84, place: true, notes: 2 },
  { k: 0.84, place: false, notes: 2 },
  { k: 0.76, place: false, notes: 0 }
];

const SANS = '"Inter", -apple-system, "Helvetica Neue", Arial, sans-serif';
const DISPLAY = '"Bricolage Grotesque", "Inter", Arial, sans-serif';
const MONO = '"JetBrains Mono", "SF Mono", Menlo, monospace';
const SERIF = '"Playfair Display", Georgia, serif';
const HAND = '"Caveat", "Bradley Hand", "Segoe Print", cursive';
const CEREZA = '#C23B22';
const ROAST = { claro: '#C98A3E', medio: '#8E5226', oscuro: '#4B2A1A' };

const THEMES = {
  stretch: {
    card: '#F0EEE9', ink: '#111111', muted: '#4A4740', accent: '#2440E6', rule: 'rgba(17,17,17,0.2)',
    title: { family: SANS, weight: 900, upper: true, lh: 0.92, stretch: 1.3, accentLast: true },
    value: { family: SANS, weight: 600 }, notes: 'inline', sca: 'top', mark: [CEREZA, '#F0EEE9']
  },
  zine: {
    card: '#FBF8F1', ink: '#1E1B16', muted: '#4F4A42', accent: '#B3261E', rule: 'rgba(30,27,22,0.22)',
    title: { family: SERIF, weight: 700, lh: 1.04 },
    value: { family: MONO, weight: 500 }, notes: 'hand', sca: 'stamp', mark: [CEREZA, '#FBF8F1']
  },
  lata: {
    card: '#2F6B3F', ink: '#FFF6E6', muted: '#CFE3D3', accent: '#FF6A1A', rule: 'rgba(255,246,230,0.28)',
    title: { family: SANS, weight: 900, upper: true, lh: 0.96 },
    value: { family: SANS, weight: 700 }, notes: 'caps', sca: 'band', mark: ['#FFF6E6', '#2F6B3F']
  },
  etiqueta: {
    card: '#FBFAF8', ink: '#1B1411', muted: '#5C554D', accent: CEREZA, rule: '#D6CFC4',
    title: { family: DISPLAY, weight: 700, lh: 1.0 },
    value: { family: SANS, weight: 600 }, notes: 'chips', chipBg: '#EFEAE2', sca: 'top', mark: [CEREZA, '#FBFAF8']
  },
  origen: {
    card: '#EEE8DC', ink: '#1B1411', muted: '#5C554D', accent: CEREZA, rule: 'rgba(27,20,17,0.16)',
    title: { family: DISPLAY, weight: 700, lh: 1.0 },
    value: { family: SANS, weight: 600 }, notes: 'chips', chipBg: '#E2D9C8', sca: 'top', mark: [CEREZA, '#EEE8DC']
  }
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function font(ctx, weight, size, family, style = '') {
  ctx.font = `${style ? style + ' ' : ''}${weight} ${Math.round(size)}px ${family}`;
}
function spaced(ctx, px) { try { ctx.letterSpacing = `${px}px`; } catch (e) { /* older browsers */ } }

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
  const words = String(text || '').trim().split(/[ \t\n]+/).filter(Boolean);
  const out = [];
  let cur = '';
  words.forEach((w) => {
    const cand = cur ? `${cur} ${w}` : w;
    if (!cur || ctx.measureText(cand).width <= maxW) cur = cand;
    else { out.push(cur); cur = w; }
    // a single word wider than the column is split rather than allowed to overlap its neighbour
    while (ctx.measureText(cur).width > maxW && cur.length > 1) {
      let i = cur.length - 1;
      while (i > 1 && ctx.measureText(cur.slice(0, i)).width > maxW) i--;
      out.push(cur.slice(0, i));
      cur = cur.slice(i);
    }
  });
  if (cur) out.push(cur);
  return out;
}

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

function draw(ctx, f, x, y, align = 'left') {
  ctx.textAlign = align;
  f.lines.forEach((l, i) => ctx.fillText(l, x, y + Math.round(f.size * 0.82) + i * f.lineH));
  ctx.textAlign = 'left';
  return f.height;
}

// One-line uppercase label; drops whole trailing words (never letters) until it fits.
function oneLine(ctx, text, maxW, size, color, x, y, align = 'left', track = 2) {
  let words = String(text || '').toUpperCase().split(/\s+/).filter(Boolean);
  font(ctx, 500, size, MONO);
  spaced(ctx, track);
  while (words.length > 1 && ctx.measureText(words.join(' ')).width > maxW) words = words.slice(0, -1);
  let str = words.join(' ').replace(/[·—,-]$/, '').trim();
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(str, x, y + Math.round(size * 0.8));
  ctx.textAlign = 'left';
  spaced(ctx, 0);
  return size;
}

function seeded(str) {
  let h = 2166136261;
  const s = String(str || 'beantag');
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  let seed = h >>> 0;
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}

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

const first = (v) => String(v || '').split(/[,/]/)[0].trim();
const cap = (t) => { const s = String(t || '').trim(); return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : ''; };

function roastOf(d) {
  const r = String(d.roastLevel || '').toLowerCase();
  if (/oscuro|dark/.test(r)) return { word: 'Oscuro', color: ROAST.oscuro };
  if (/claro|light/.test(r)) return { word: 'Claro', color: ROAST.claro };
  return { word: 'Medio', color: ROAST.medio };
}

/** The BeanTag mark: a coffee bean with a hang-tag punch. size = box in px. */
function drawMark(ctx, cx, cy, size, fill, cut) {
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
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(50, 31);
  ctx.bezierCurveTo(40, 45, 60, 58, 50, 72);
  ctx.bezierCurveTo(46, 78, 47, 84, 50, 88);
  ctx.stroke();
  ctx.fillStyle = cut;
  ctx.beginPath();
  ctx.arc(50, 21, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Data for a sticker: few facts, chosen per orientation
// ---------------------------------------------------------------------------
const keep = (t) => String(t || '').replace(/ /g, '\u00A0'); // never split inside a name or a unit

function factsOf(d, inc, vertical, style) {
  // grinder name only when it fits with the dial; otherwise the dial alone (no letter-split names)
  const grind = d.grinderName && `${d.grind} · ${d.grinderName}`.length <= 22 ? `${d.grind} · ${keep(d.grinderName)}` : d.grind;
  if (inc) {
    const dose = { k: 'Dosis', v: d.coffeeG && d.waterG ? `${keep(d.coffeeG + ' g')} → ${keep(d.waterG + ' g')}` : `1:${d.ratio}` };
    const water = { k: 'Agua', v: `${keep(d.temp)} · ${keep(d.time)}` };
    return vertical ? [{ k: 'Método', v: d.method || '—' }, dose, { k: 'Molienda', v: grind }, water] : [dose, { k: 'Molienda', v: grind }, water];
  }
  const process = { k: 'Proceso', v: d.process || '—' };
  const variety = { k: 'Variedad', v: first(d.variety) || '—' };
  const roast = { k: 'Tueste', v: roastOf(d).word };
  const alt = { k: 'Altitud', v: d.altitude || '—' };
  if (style === 'origen') return vertical ? [process, variety, roast, { k: 'Tostador', v: d.roaster || '—' }] : [process, variety, roast];
  return vertical ? [process, variety, alt, roast] : [process, variety, alt];
}

function topOf(d, inc) {
  return inc ? [d.method, d.roaster].filter(Boolean).join(' · ') : (d.roaster || 'Café de especialidad');
}

function placeOf(d, inc) {
  return inc ? [first(d.origin), d.process].filter(Boolean).join(' · ') : (d.origin || '');
}

// ---------------------------------------------------------------------------
// Card shapes (draw the card, return the content rectangle)
// ---------------------------------------------------------------------------
function shadowed(ctx, paint) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.28)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 12;
  paint();
  ctx.restore();
}

function shape(ctx, style, d, sp, W, H, vertical) {
  const th = THEMES[style];
  const x = sp.margin, y = sp.margin, w = W - sp.margin * 2, h = H - sp.margin * 2;
  const p = sp.pad;

  if (style === 'zine') {
    const rot = vertical ? -1.0 : -0.8;
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.translate(-W / 2, -H / 2);
    shadowed(ctx, () => { ctx.fillStyle = th.card; rr(ctx, x + 8, y + 8, w - 16, h - 16, 6); ctx.fill(); });
    // paper grain
    const rnd = seeded(d.name);
    ctx.fillStyle = 'rgba(80,60,30,0.06)';
    for (let i = 0; i < 500; i++) ctx.fillRect(x + 12 + rnd() * (w - 24), y + 12 + rnd() * (h - 24), 2 + rnd() * 2, 2 + rnd() * 2);
    ctx.restore();
    // tape (sits over the edge, inside the canvas)
    ctx.save();
    ctx.translate(x + w * 0.5, y + 10);
    ctx.rotate(-0.05);
    ctx.fillStyle = 'rgba(246,214,110,0.85)';
    ctx.fillRect(-110, -18, 220, 40);
    ctx.restore();
    return { x: x + p, y: y + p + 8, w: w - 2 * p, h: h - 2 * p - 8 };
  }

  if (style === 'lata') {
    const band = vertical ? 92 : 80;
    shadowed(ctx, () => { ctx.fillStyle = th.card; rr(ctx, x, y, w, h, 32); ctx.fill(); });
    ctx.save();
    rr(ctx, x, y, w, h, 32); ctx.clip();
    ctx.fillStyle = th.accent; ctx.fillRect(x, y, w, band);
    ctx.fillStyle = th.ink; ctx.fillRect(x, y + band + 8, w, 6);
    ctx.fillStyle = th.accent; ctx.fillRect(x, y + h - 18, w, 18);
    ctx.restore();
    // band text: roaster left, SCA (or roast) right — dark ink on orange (contrast ≈ 6:1)
    const right = d.sca ? `SCA ${d.sca}` : roastOf(d).word;
    font(ctx, 800, sp.label, SANS); spaced(ctx, 2);
    const rw = ctx.measureText(right.toUpperCase()).width;
    spaced(ctx, 0);
    ctx.save();
    font(ctx, 800, sp.label, SANS); spaced(ctx, 2);
    ctx.fillStyle = '#12301C'; ctx.textAlign = 'right';
    ctx.fillText(right.toUpperCase(), x + w - p, y + band / 2 + sp.label * 0.36);
    ctx.restore();
    let words = String(d.roaster || 'Café de especialidad').toUpperCase().split(/\s+/);
    font(ctx, 800, sp.label, SANS); spaced(ctx, 2);
    while (words.length > 1 && ctx.measureText(words.join(' ')).width > w - 2 * p - rw - 40) words = words.slice(0, -1);
    ctx.fillStyle = '#12301C'; ctx.fillText(words.join(' '), x + p, y + band / 2 + sp.label * 0.36);
    spaced(ctx, 0);
    return { x: x + p, y: y + band + 14 + 40, w: w - 2 * p, h: h - band - 14 - 40 - 18 - 40 };
  }

  if (style === 'etiqueta') {
    const roast = roastOf(d);
    const cut = vertical ? 110 : 90;
    const strip = vertical ? 132 : 132;
    const tag = () => {
      ctx.beginPath();
      if (vertical) {
        ctx.moveTo(x + cut, y); ctx.lineTo(x + w - cut, y); ctx.lineTo(x + w, y + cut);
        ctx.lineTo(x + w, y + h - 32); ctx.quadraticCurveTo(x + w, y + h, x + w - 32, y + h);
        ctx.lineTo(x + 32, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - 32); ctx.lineTo(x, y + cut);
      } else {
        ctx.moveTo(x, y + cut); ctx.lineTo(x + cut, y); ctx.lineTo(x + w - 32, y); ctx.quadraticCurveTo(x + w, y, x + w, y + 32);
        ctx.lineTo(x + w, y + h - 32); ctx.quadraticCurveTo(x + w, y + h, x + w - 32, y + h);
        ctx.lineTo(x + cut, y + h); ctx.lineTo(x, y + h - cut);
      }
      ctx.closePath();
    };
    shadowed(ctx, () => { ctx.fillStyle = th.card; tag(); ctx.fill(); });
    ctx.save(); tag(); ctx.clip();
    ctx.fillStyle = roast.color;
    if (vertical) ctx.fillRect(x, y, w, strip); else ctx.fillRect(x, y, strip, h);
    ctx.restore();
    // grommet + punch (transparent hole would hide the photo detail; a ring reads better)
    const gx = vertical ? W / 2 : x + strip / 2, gy = vertical ? y + strip / 2 : H / 2;
    ctx.fillStyle = '#E8E2D8'; ctx.beginPath(); ctx.arc(gx, gy, 30, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = roast.color; ctx.beginPath(); ctx.arc(gx, gy, 17, 0, Math.PI * 2); ctx.fill();
    return vertical
      ? { x: x + p, y: y + strip + 44, w: w - 2 * p, h: h - strip - 44 - p }
      : { x: x + strip + 52, y: y + p, w: w - strip - 52 - p, h: h - 2 * p };
  }

  // stretch & origen: rounded card
  shadowed(ctx, () => { ctx.fillStyle = th.card; rr(ctx, x, y, w, h, 40); ctx.fill(); });
  if (style === 'origen') {
    ctx.save(); rr(ctx, x, y, w, h, 40); ctx.clip();
    const rnd = seeded(`${d.name}${d.origin}`);
    const sx = vertical ? x + w * 0.72 : x + w * 0.8, sy = vertical ? y + 170 : y + h * 0.42;
    const ph = [rnd() * 6.28, rnd() * 6.28, rnd() * 6.28];
    ctx.strokeStyle = 'rgba(120,96,64,0.22)'; ctx.lineWidth = 2.2;
    for (let k = 0; k < 16; k++) {
      const base = 30 + k * 46, amp = 8 + k * 5;
      ctx.beginPath();
      for (let a = 0; a <= 64; a++) {
        const t = (a / 64) * Math.PI * 2;
        const r = base + amp * (Math.sin(3 * t + ph[0]) * 0.5 + Math.sin(5 * t + ph[1]) * 0.3 + Math.sin(2 * t + ph[2]) * 0.4);
        const px = sx + Math.cos(t) * r * 1.15, py = sy + Math.sin(t) * r * 0.9;
        if (a === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(194,59,34,0.18)'; ctx.beginPath(); ctx.arc(sx, sy, 26, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = CEREZA; ctx.beginPath(); ctx.arc(sx, sy, 11, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  return { x: x + p, y: y + p, w: w - 2 * p, h: h - 2 * p };
}

// ---------------------------------------------------------------------------
// Content blocks
// ---------------------------------------------------------------------------
function drawTitle(ctx, th, f, x, y) {
  const t = th.title;
  ctx.save();
  ctx.translate(x, y);
  if (t.stretch) ctx.scale(1, t.stretch);
  font(ctx, t.weight, f.size, t.family);
  spaced(ctx, t.upper ? -1 : -1.5);
  f.lines.forEach((l, i) => {
    ctx.fillStyle = t.accentLast && i === f.lines.length - 1 && f.lines.length > 1 ? th.accent : th.ink;
    ctx.fillText(l, 0, Math.round(f.size * 0.8) + i * f.lineH);
  });
  spaced(ctx, 0);
  ctx.restore();
  return Math.round(f.height * (t.stretch || 1));
}

// Facts: label + value. `cols` per row; both cells in a row share one value size.
function facts(ctx, th, sp, list, x, y, w, cols, k, rule) {
  const gap = 32;
  const colW = Math.floor((w - gap * (cols - 1)) / cols);
  let yy = y;
  let ok = true;
  for (let r = 0; r * cols < list.length; r++) {
    const row = list.slice(r * cols, r * cols + cols);
    const fits = row.map((c) => fit(ctx, c.v, { maxW: colW, maxLines: 2, max: sp.vMax * k, min: sp.vMin, weight: th.value.weight, family: th.value.family, lh: 1.1 }));
    if (fits.some((f) => !f.ok)) ok = false;
    const size = Math.min(...fits.map((f) => f.size));
    const sized = row.map((c) => fit(ctx, c.v, { maxW: colW, maxLines: 9, max: size, min: size, weight: th.value.weight, family: th.value.family, lh: 1.1 }));
    const valH = Math.max(...sized.map((f) => f.height));
    row.forEach((c, i) => {
      const cx = x + i * (colW + gap);
      oneLine(ctx, c.k, colW, sp.label, th.muted, cx, yy, 'left', 1.5);
      ctx.fillStyle = th.ink;
      font(ctx, th.value.weight, size, th.value.family);
      draw(ctx, sized[i], cx, yy + sp.label + 10);
    });
    yy += sp.label + 10 + valH;
    if ((r + 1) * cols < list.length) {
      if (rule) { ctx.fillStyle = th.rule; ctx.fillRect(x, yy + sp.gap - 1, w, 2); }
      yy += sp.gap * 2;
    }
  }
  return { height: yy - y, ok };
}

function notes(ctx, th, sp, tags, x, y, w) {
  if (!tags.length) return 0;
  if (th.notes === 'inline') {
    font(ctx, 600, sp.body, SANS);
    let cx = x, cy = y;
    tags.forEach((tg, i) => {
      const s = (i ? ' / ' : '') + tg;
      const tw = ctx.measureText(s).width;
      if (cx > x && cx + tw > x + w) { cx = x; cy += Math.round(sp.body * 1.25); }
      ctx.fillStyle = i === 0 ? th.accent : th.ink;
      ctx.fillText(s, cx, cy + Math.round(sp.body * 0.82));
      cx += tw;
    });
    return cy - y + Math.round(sp.body * 1.15);
  }
  if (th.notes === 'hand') {
    ctx.fillStyle = '#2B2A8C';
    const f = fit(ctx, tags.map((t) => t.toLowerCase()).join(', '), { maxW: w, maxLines: 2, max: sp.body * 1.3, min: sp.body * 1.05, weight: 600, family: HAND, lh: 1.05 });
    font(ctx, 600, f.size, HAND);
    return draw(ctx, f, x, y);
  }
  if (th.notes === 'caps') {
    ctx.fillStyle = th.ink;
    const f = fit(ctx, tags.map((t) => t.toUpperCase()).join('  •  '), { maxW: w, maxLines: 2, max: sp.body, min: sp.label, weight: 800, family: SANS, lh: 1.2 });
    font(ctx, 800, f.size, SANS);
    return draw(ctx, f, x, y);
  }
  // chips
  const size = sp.chip, padX = 22, h = Math.round(size * 1.8);
  let cx = x, cy = y;
  font(ctx, 500, size, SANS);
  tags.forEach((t) => {
    const cw = Math.ceil(ctx.measureText(t).width) + padX * 2;
    if (cx > x && cx + cw > x + w) { cx = x; cy += h + 10; }
    ctx.fillStyle = th.chipBg; rr(ctx, cx, cy, cw, h, h / 2); ctx.fill();
    ctx.fillStyle = th.ink; ctx.fillText(t, cx + padX, cy + Math.round(h / 2 + size * 0.36));
    cx += cw + 10;
  });
  return cy + h - y;
}

function brand(ctx, th, sp, x, yBottom) {
  const s = sp.foot;
  drawMark(ctx, x + s * 0.62, yBottom - s * 0.36, s * 1.45, th.mark[0], th.mark[1]);
  ctx.fillStyle = th.ink;
  font(ctx, 700, s, DISPLAY); spaced(ctx, -1);
  ctx.fillText('beantag', x + s * 1.5, yBottom);
  spaced(ctx, 0);
  return Math.round(s * 1.3);
}

// SCA stamp: its text uses the same floor as every label (sp.label)
function stamp(ctx, th, sp, sca, cx, cy) {
  const r = Math.round(sp.label * 2.15);
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(0.16);
  ctx.strokeStyle = th.accent; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, r - 13, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = th.accent; ctx.textAlign = 'center';
  font(ctx, 500, sp.label, MONO); ctx.fillText('SCA', 0, -r * 0.12);
  font(ctx, 800, Math.round(sp.label * 1.2), SANS); ctx.fillText(String(sca), 0, r * 0.5);
  ctx.textAlign = 'left'; ctx.restore();
}

function altitudeHero(ctx, th, sp, d, x, y, k, vertical) {
  const alt = String(d.altitude || '').match(/\d[\d.,]*/);
  if (!alt) return 0;
  const hs = Math.round((vertical ? 170 : 128) * Math.max(0.8, k));
  font(ctx, 800, hs, DISPLAY); spaced(ctx, -5);
  ctx.fillStyle = th.ink; ctx.fillText(alt[0], x - 4, y + Math.round(hs * 0.84));
  const aw = ctx.measureText(alt[0]).width; spaced(ctx, 0);
  ctx.fillStyle = th.muted; font(ctx, 500, sp.label, SANS); ctx.fillText('msnm', x + aw + 14, y + Math.round(hs * 0.82));
  return hs;
}

// ---------------------------------------------------------------------------
// Layouts
// ---------------------------------------------------------------------------
function layoutVertical(ctx, style, d, inc, sp, r, lv) {
  const th = THEMES[style];
  let y = r.y;
  const bottomBrand = r.y + r.h;
  const brandH = Math.round(sp.foot * 1.3);

  // top label + SCA
  const scaTop = th.sca === 'top' && d.sca;
  if (style === 'origen') {
    oneLine(ctx, inc ? topOf(d, inc) : `Origen · ${first(d.origin) || '—'}`, r.w - 300, sp.label, th.muted, r.x, y);
  } else if (style !== 'lata') {
    oneLine(ctx, topOf(d, inc), scaTop ? r.w - 300 : th.sca === 'stamp' && d.sca ? r.w - sp.label * 4.8 : r.w, sp.label, th.muted, r.x, y);
  } else {
    oneLine(ctx, inc ? (d.method || 'Mi receta') : `Tueste ${roastOf(d).word}`, r.w, sp.label, th.muted, r.x, y);
  }
  if (scaTop) oneLine(ctx, `SCA ${d.sca}`, 280, sp.label, th.accent, r.x + r.w, y, 'right');
  if (th.sca === 'stamp' && d.sca) stamp(ctx, th, sp, d.sca, r.x + r.w - sp.label * 2.2, r.y + sp.label * 2.1);
  y += sp.label + sp.gap;

  if (style === 'origen') { y += altitudeHero(ctx, th, sp, d, r.x, y, lv.k, true) + sp.gap; }

  const titleW = th.sca === 'stamp' && d.sca ? r.w - sp.label * 4.8 : r.w;
  const stretch = th.title.stretch || 1;
  const tf = fit(ctx, d.name, { maxW: titleW, maxLines: 3, maxH: (380 * lv.k) / stretch, max: sp.tMax * lv.k, min: sp.tMin * 0.8, weight: th.title.weight, family: th.title.family, lh: th.title.lh, upper: th.title.upper });
  y += drawTitle(ctx, th, tf, r.x, y) + 16;

  const place = placeOf(d, inc);
  if (lv.place && place) {
    ctx.fillStyle = th.muted;
    const pf = fit(ctx, place, { maxW: r.w, maxLines: 2, max: sp.body, min: sp.body, weight: 400, family: SANS, lh: 1.25 });
    font(ctx, 400, sp.body, SANS);
    y += draw(ctx, pf, r.x, y);
  }
  y += sp.gap + 8;
  ctx.fillStyle = th.rule; ctx.fillRect(r.x, y, r.w, 2); y += sp.gap + 8;

  const fr = facts(ctx, th, sp, factsOf(d, inc, true, style), r.x, y, r.w, 2, lv.k, true);
  y += fr.height;

  const tags = (d.tags || []).map(cap).filter(Boolean).slice(0, lv.notes);
  if (tags.length) { y += sp.gap + 8; y += notes(ctx, th, sp, tags, r.x, y, r.w); }

  brand(ctx, th, sp, r.x, bottomBrand);
  return { fits: tf.ok && fr.ok && y <= bottomBrand - brandH - sp.gap };
}

function layoutHorizontal(ctx, style, d, inc, sp, r, lv) {
  const th = THEMES[style];
  const leftW = Math.round(r.w * 0.56);
  const rightX = r.x + leftW + 48;
  const rightW = r.w - leftW - 48;
  const brandH = Math.round(sp.foot * 1.3);

  // left column: label, (altitude), title, place, notes, brand
  let y = r.y;
  const scaTop = th.sca === 'top' && d.sca;
  if (style === 'origen') oneLine(ctx, inc ? topOf(d, inc) : `Origen · ${first(d.origin) || '—'}`, leftW, sp.label, th.muted, r.x, y);
  else if (style === 'lata') oneLine(ctx, inc ? (d.method || 'Mi receta') : `Tueste ${roastOf(d).word}`, leftW, sp.label, th.muted, r.x, y);
  else oneLine(ctx, topOf(d, inc), th.sca === 'stamp' && d.sca ? leftW - sp.label * 4.4 : leftW, sp.label, th.muted, r.x, y);
  y += sp.label + sp.gap - 4;

  if (style === 'origen') y += altitudeHero(ctx, th, sp, d, r.x, y, lv.k, false) + 12;

  const stretch = th.title.stretch || 1;
  const titleRoom = (r.y + r.h - brandH - sp.gap) - y;
  const tf = fit(ctx, d.name, { maxW: th.sca === 'stamp' && d.sca ? leftW - sp.label * 4.4 : leftW, maxLines: 3, maxH: Math.min(300 * lv.k, titleRoom * 0.62) / stretch, max: sp.tMax * lv.k, min: sp.tMin * 0.8, weight: th.title.weight, family: th.title.family, lh: th.title.lh, upper: th.title.upper });
  y += drawTitle(ctx, th, tf, r.x, y) + 14;

  const place = placeOf(d, inc);
  if (lv.place && place) {
    ctx.fillStyle = th.muted;
    const pf = fit(ctx, place, { maxW: leftW, maxLines: 1, max: sp.body, min: sp.label, weight: 400, family: SANS, lh: 1.2 });
    font(ctx, 400, pf.size, SANS);
    y += draw(ctx, pf, r.x, y);
  }
  const tags = (d.tags || []).map(cap).filter(Boolean).slice(0, lv.notes);
  if (tags.length) { y += sp.gap; y += notes(ctx, th, sp, tags, r.x, y, leftW); }
  brand(ctx, th, sp, r.x, r.y + r.h);
  const leftOk = tf.ok && y <= r.y + r.h - brandH - sp.gap;

  // right column: SCA (if on top) + facts stacked, separated by rules
  let ry = r.y;
  if (scaTop) { oneLine(ctx, `SCA ${d.sca}`, rightW, sp.label, th.accent, rightX + rightW, ry, 'right'); }
  if (th.sca === 'stamp' && d.sca) stamp(ctx, th, sp, d.sca, r.x + leftW - sp.label * 1.9, r.y + sp.label * 2.0);
  // vertical divider
  ctx.fillStyle = th.rule; ctx.fillRect(rightX - 24, r.y, 2, r.h);
  const list = factsOf(d, inc, false, style);
  const fm = facts(measuring(ctx), th, sp, list, rightX, 0, rightW, 1, lv.k, false);
  const fh = fm.height;
  const top = scaTop ? r.y + sp.label + sp.gap : r.y;
  const avail = r.y + r.h - top;
  ry = top + Math.max(0, Math.round((avail - fh) / 2));
  facts(ctx, th, sp, list, rightX, ry, rightW, 1, lv.k, true);
  return { fits: leftOk && fm.ok && fh <= avail };
}

// ---------------------------------------------------------------------------
export function drawSticker(ctx, style, d, incRecipe, orientation, width, height) {
  const st = STICKER_STYLES.includes(style) ? style : 'stretch';
  const vertical = orientation === 'vertical';
  const sp = SPEC[vertical ? 'vertical' : 'horizontal'];
  const layout = vertical ? layoutVertical : layoutHorizontal;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.clearRect(0, 0, width, height);

  let level = LEVELS[LEVELS.length - 1];
  for (const lv of LEVELS) {
    const probe = measuring(ctx);
    let res = { fits: false };
    try {
      const r = shape(probe, st, d, sp, width, height, vertical);
      res = layout(probe, st, d, incRecipe, sp, r, lv) || res;
    } catch (e) { res = { fits: false }; }
    if (res.fits) { level = lv; break; }
  }
  ctx.save();
  const r = shape(ctx, st, d, sp, width, height, vertical);
  layout(ctx, st, d, incRecipe, sp, r, level);
  spaced(ctx, 0);
  ctx.restore();
}
