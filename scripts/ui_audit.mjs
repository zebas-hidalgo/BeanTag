#!/usr/bin/env node
// BeanTag UI audit: contrast (WCAG AA), unnamed controls, small touch targets
// and sticker text (minimum size, inside the card, no overlaps).
//
// Usage (with the app running, e.g. `npm run dev`):
//   npm i -D playwright && npx playwright install chromium   # once
//   npm run audit:ui                       # http://localhost:5173
//   npm run audit:ui -- http://localhost:3000
// Exit code 1 when something fails, so it can gate a deploy.

import { chromium } from 'playwright';

const BASE = (process.argv[2] || process.env.BEANTAG_URL || 'http://localhost:5173').replace(/\/$/, '');
const VIEWS = [
  { name: 'Cava', nav: null },
  { name: 'Bitácoras', nav: 'Bitácoras' },
  { name: 'Perfil', nav: 'Perfil' }
];
const THEMES = ['light', 'dark'];
const STYLES = ['stretch', 'zine', 'lata', 'etiqueta', 'origen'];
// Stickers are pasted at ~86% (horizontal) / ~58% (vertical) of the story width
const MIN_PX = { horizontal: 38, vertical: 44 };
const MIN_TARGET = 44;

const AUDIT_PAGE = `() => {
  const parse = (c) => { const m = c.match(/rgba?\\(([^)]+)\\)/); if (!m) return null; const p = m[1].split(/[ ,\\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const blend = (top, bot) => ({ r: top.r * top.a + bot.r * (1 - top.a), g: top.g * top.a + bot.g * (1 - top.a), b: top.b * top.a + bot.b * (1 - top.a), a: 1 });
  const bgOf = (el) => {
    const layers = []; let e = el;
    while (e && e.nodeType === 1) {
      const cs = getComputedStyle(e);
      if (cs.backgroundImage && cs.backgroundImage !== 'none' && !cs.backgroundImage.startsWith('url')) return null; // gradient: skip
      const c = parse(cs.backgroundColor); if (c && c.a > 0) { layers.push(c); if (c.a >= 1) break; }
      e = e.parentElement;
    }
    let base = { r: 255, g: 255, b: 255, a: 1 };
    if (layers.length && layers[layers.length - 1].a >= 1) base = layers.pop();
    for (let i = layers.length - 1; i >= 0; i--) base = blend(layers[i], base);
    return base;
  };
  const out = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  while (walker.nextNode()) {
    const t = walker.currentNode; const el = t.parentElement;
    if (!el || seen.has(el) || !t.textContent.trim()) continue; seen.add(el);
    const r = el.getBoundingClientRect(); if (!r.width || !r.height || r.bottom < 0 || r.top > innerHeight * 3) continue;
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || +cs.opacity === 0) continue;
    if (el.closest('[aria-hidden="true"]') || el.closest('input,textarea')) continue;
    let fg = parse(cs.color); const bg = bgOf(el); if (!fg || !bg) continue;
    if (fg.a < 1) fg = blend(fg, bg);
    const L1 = lum(fg), L2 = lum(bg); const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    const size = parseFloat(cs.fontSize), bold = +cs.fontWeight >= 700;
    const need = (size >= 24 || (size >= 18.66 && bold)) ? 3 : 4.5;
    if (ratio < need) out.push({ text: t.textContent.trim().slice(0, 40), ratio: +ratio.toFixed(2), need, size, color: cs.color });
  }
  const ctr = [...document.querySelectorAll('input:not([type=hidden]):not([type=file]),select,textarea')].filter(e => e.getBoundingClientRect().width);
  const unnamed = ctr.filter(e => !(e.labels && e.labels.length) && !e.getAttribute('aria-label') && !e.getAttribute('aria-labelledby')).map(e => e.placeholder || e.name || e.type);
  const btns = [...document.querySelectorAll('button')].filter(b => b.getBoundingClientRect().width && !(b.getAttribute('aria-label') || b.textContent.trim() || b.title));
  const small = [...document.querySelectorAll('button,[role=button],a,input,select')].filter(b => { const r = b.getBoundingClientRect(); return r.width && r.height && (r.width < 24 || r.height < 24); }).length;
  return { controls: ctr.length, unnamedControls: unnamed, unnamedButtons: btns.length, under24px: small, checked: seen.size, fails: out.sort((a, b) => a.ratio - b.ratio).slice(0, 25), failCount: out.length };
}`;

const TARGETS = `() => [...document.querySelectorAll('button,[role=button],a[href],input:not([type=hidden]),select')]
  .filter((el) => { const r = el.getBoundingClientRect(); return r.width && r.height && !el.closest('[aria-hidden="true"]'); })
  .filter((el) => { const r = el.getBoundingClientRect(); return r.height < ${MIN_TARGET} - 0.5 && r.width < ${MIN_TARGET} - 0.5; })
  .map((el) => (el.getAttribute('aria-label') || el.textContent.trim() || el.title || el.name || el.className || el.tagName).trim().slice(0, 40))`;

const SAMPLE = {
  name: 'Finca La Esperanza Gesha Natural Anaeróbico Lote 7', batch_name: 'Finca La Esperanza Gesha Natural Anaeróbico Lote 7',
  origin: 'Boquete, Chiriquí, Panamá', process: 'Natural anaeróbico', variety: 'Gesha, Caturra', roast_level: 'Claro',
  roaster: 'Tostaduría de Especialidad del Norte', altitude: '1950', sca_score: 88.5,
  roaster_notes: '[Notas: Jazmín, Bergamota, Durazno blanco, Panela]', method: 'V60 (Filtrado)', dose_in_g: 15,
  water_total_g: 250, ratio: '1:16.7', grind: 'Clic 24 · rotación 1', grinder: 'Comandante C40', temperature: '93°C',
  brew_time: '3:00', sensory_extraction: 'En Punto', notes: 'Jugoso, final largo a lichi.'
};

const HOOK = `(() => {
  const of = CanvasRenderingContext2D.prototype.fillText;
  window.__textlog = [];
  CanvasRenderingContext2D.prototype.fillText = function (t, x, y) {
    const c = this.canvas;
    if (c.width === 1280 || c.width === 960) {
      const m = this.getTransform(); const px = parseFloat((this.font.match(/(\\d+(?:\\.\\d+)?)px/) || [])[1]);
      const s = Math.min(Math.hypot(m.a, m.b), Math.hypot(m.c, m.d));
      const w = this.measureText(String(t)).width;
      const ax = m.a * x + m.c * y + m.e, ay = m.b * x + m.d * y + m.f;
      const al = this.textAlign; const left = al === 'right' ? ax - w * s : al === 'center' ? ax - w * s / 2 : ax;
      window.__textlog.push({ t: String(t).slice(0, 24), px: Math.round(px * s), y: Math.round(ay), l: Math.round(left), r: Math.round(left + w * s), W: c.width, H: c.height });
    }
    return of.apply(this, arguments);
  };
})()`;

let failures = 0;
const fail = (msg) => { failures += 1; console.log('  ✗ ' + msg); };
const ok = (msg) => console.log('  ✓ ' + msg);

async function auditScreens(browser) {
  for (const theme of THEMES) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: theme });
    await ctx.addInitScript((t) => { try { localStorage.setItem('beantag-theme', t); } catch (e) {} }, theme);
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    for (const view of VIEWS) {
      if (view.nav) {
        await page.getByRole('button', { name: view.nav }).first().click();
        await page.waitForTimeout(600);
      }
      console.log(`\n${view.name} · ${theme === 'light' ? 'Crema' : 'Tueste'}`);
      const r = await page.evaluate(`(${AUDIT_PAGE})()`);
      const small = await page.evaluate(`(${TARGETS})()`);
      r.failCount ? fail(`${r.failCount} textos con contraste bajo: ` + r.fails.slice(0, 4).map((f) => `"${f.text}" ${f.ratio}:1`).join(', ')) : ok(`contraste AA (${r.checked} textos)`);
      r.unnamedControls.length || r.unnamedButtons ? fail(`controles sin nombre: ${r.unnamedControls.length + r.unnamedButtons}`) : ok('todos los controles tienen nombre');
      small.length ? fail(`${small.length} objetivos < ${MIN_TARGET}px: ` + small.slice(0, 5).join(' | ')) : ok(`objetivos táctiles ≥ ${MIN_TARGET}px`);
    }
    if (errors.length) fail('errores de JS: ' + errors.join(' · '));
    await ctx.close();
  }
}

async function auditStickers(browser) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.addInitScript(HOOK);
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  const has = await page.evaluate(() => typeof window.__generateCoffeeStickerImage === 'function');
  console.log('\nStickers');
  if (!has) { fail('window.__generateCoffeeStickerImage no está expuesto (main.jsx)'); await ctx.close(); return; }
  for (const orientation of ['horizontal', 'vertical']) {
    for (const style of STYLES) {
      for (const includeRecipe of [true, false]) {
        await page.evaluate(() => { window.__textlog = []; });
        await page.evaluate(([r, s, i, o]) => window.__generateCoffeeStickerImage(r, { template: s, includeRecipe: i, orientation: o }), [SAMPLE, style, includeRecipe, orientation]);
        const log = await page.evaluate(() => window.__textlog);
        const tag = `${orientation} ${style} ${includeRecipe ? 'receta' : 'café'}`;
        if (!log.length) { fail(`${tag}: no dibujó texto`); continue; }
        const { W, H } = log[0];
        const minPx = Math.min(...log.map((e) => e.px));
        const outside = log.filter((e) => e.l < 40 || e.r > W - 40 || e.y < 40 || e.y > H - 40);
        const boxes = log.map((e) => [e.l, e.y - e.px * 0.78, e.r, e.y + e.px * 0.12, e.t]);
        const overlaps = [];
        for (let i = 0; i < boxes.length; i += 1) for (let j = i + 1; j < boxes.length; j += 1) {
          const a = boxes[i]; const b = boxes[j];
          if (Math.min(a[2], b[2]) - Math.max(a[0], b[0]) > 4 && Math.min(a[3], b[3]) - Math.max(a[1], b[1]) > 4) overlaps.push(`${a[4]}/${b[4]}`);
        }
        const problems = [];
        if (minPx < MIN_PX[orientation]) problems.push(`texto de ${minPx}px (< ${MIN_PX[orientation]})`);
        if (outside.length) problems.push(`${outside.length} textos fuera del margen`);
        if (overlaps.length) problems.push(`solapes: ${overlaps.slice(0, 2).join(', ')}`);
        problems.length ? fail(`${tag}: ${problems.join('; ')}`) : ok(`${tag}: mín ${minPx}px, sin solapes`);
      }
    }
  }
  await ctx.close();
}

const browser = await chromium.launch();
try {
  console.log(`BeanTag UI audit → ${BASE}`);
  await auditScreens(browser);
  await auditStickers(browser);
} finally {
  await browser.close();
}
console.log(failures ? `\n${failures} problema(s).` : '\nTodo en orden.');
process.exit(failures ? 1 : 0);
