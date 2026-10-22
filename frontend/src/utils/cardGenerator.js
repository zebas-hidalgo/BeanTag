// --- BEANTAG SHARE CARDS ENGINE (2027 collection) ---
// Every image the app shares is drawn here with one of 5 styles:
//   squishy  – inflated / tactile, Luminous Blue accent
//   stretch  – expressive stretched type on Cloud Dancer
//   zine     – lo-fi collage: torn paper, tape, stamp, handwriting
//   vhs      – retro-future cassette label
//   lata     – unrolled craft-can label
// Layouts live in trendCards.js; this module extracts truthful data and
// handles formats (feed 4:5, story 9:16, cellar menu, stickers).

import { cleanNotesString } from './scaIcons';
import { GRINDERS } from './grinders';
import { TREND_STYLES, TREND_THEMES, drawTrendCard, drawTrendMenu, trendMenuSize, drawTrendSticker } from './trendCards';

export { cleanNotesString } from './scaIcons';
export { parseGrindToMicrons } from './grinders';

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
export const CARD_STYLES = TREND_STYLES;
export const TREND_CARD_STYLES = TREND_STYLES;
export const DEFAULT_CARD_STYLE = 'stretch';

// Old style ids (saved preferences, old links) map to their closest 2027 style
const LEGACY_STYLE_MAP = {
  studio: 'stretch',
  blueprint: 'vhs',
  neobrutalist: 'squishy',
  kissaten: 'zine',
  diner: 'lata',
  aurora: 'squishy',
  hangtag: 'zine'
};

export function normalizeCardStyle(tpl) {
  if (!tpl) return DEFAULT_CARD_STYLE;
  const lower = String(tpl).toLowerCase().trim();
  if (TREND_STYLES.includes(lower)) return lower;
  if (LEGACY_STYLE_MAP[lower]) return LEGACY_STYLE_MAP[lower];
  if (/swiss|mono|grid|minimal/.test(lower)) return 'stretch';
  if (/lab|tech|cyan|blue|retro|80/.test(lower)) return 'vhs';
  if (/brutal|pop|bold|nomad|sticker/.test(lower)) return 'squishy';
  if (/kissa|washi|tokyo|paper|vintage|collage/.test(lower)) return 'zine';
  if (/botanic|terroir|can|craft/.test(lower)) return 'lata';
  return DEFAULT_CARD_STYLE;
}

// ---------------------------------------------------------------------------
// Export formats (Instagram): feed 4:5 = 1080x1350, story 9:16 = 1080x1920
// ---------------------------------------------------------------------------
export const CARD_FORMATS = ['feed', 'story'];
export function getPreferredCardFormat() {
  try { return localStorage.getItem('beantag-card-format') === 'story' ? 'story' : 'feed'; } catch (e) { return 'feed'; }
}
export function setPreferredCardFormat(format) {
  try { localStorage.setItem('beantag-card-format', format === 'story' ? 'story' : 'feed'); } catch (e) {}
}

// ---------------------------------------------------------------------------
// Fonts (card-only faces load on demand, not on app start)
// ---------------------------------------------------------------------------
const CARD_FONTS_HREF = 'https://fonts.googleapis.com/css2'
  + '?family=Inter:ital,wght@0,300;0,500;0,600;0,700;0,800;0,900;1,800;1,900'
  + '&family=JetBrains+Mono:wght@500;700'
  + '&family=Playfair+Display:wght@700'
  + '&family=Caveat:wght@600'
  + '&display=swap';

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
      document.fonts.load('900 40px "Inter"'),
      document.fonts.load('300 40px "Inter"'),
      document.fonts.load('italic 900 40px "Inter"'),
      document.fonts.load('500 20px "JetBrains Mono"'),
      document.fonts.load('700 40px "Playfair Display"'),
      document.fonts.load('600 40px "Caveat"')
    ].map(p => p.catch(() => null)));
    await document.fonts.ready;
  } catch (e) {
    // Fallback fonts are fine
  }
}

// ---------------------------------------------------------------------------
// Truthful data helpers
// ---------------------------------------------------------------------------
export function stripEmojis(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/gu, '')
    .trim();
}

export function extractFlavorTags(notes) {
  if (!notes) return [];
  const cleaned = cleanNotesString(notes);
  const notesPart = cleaned.includes(' | ') ? cleaned.split(' | ')[0] : cleaned;
  return notesPart
    .split(/[,•|\/\n]+/)
    .map(t => t.replace(/^\s*\[?\s*(?:notas?|notes?)\s*:?\s*/gi, '').replace(/[\[\]]/g, '').trim())
    .filter(t => t.length > 1 && !/^(?:notas?|notes?):?$/i.test(t));
}

// Only what the barista recorded: words, never invented scores
export function parseSensoryEvaluation(batch, recipe) {
  const r = recipe || {};
  const b = batch || {};
  const word = (v) => (v === undefined || v === null || v === '' ? null : stripEmojis(String(v)).trim() || null);
  const ratingNum = parseFloat(r.rating !== undefined && r.rating !== null ? r.rating : b.rating);
  const out = {
    balanceLabel: word(r.sensory_balance || b.sensory_balance),
    bodyLabel: word(r.sensory_body || b.sensory_body),
    extractionLabel: word(r.sensory_extraction || b.sensory_extraction),
    rating: Number.isFinite(ratingNum) && ratingNum > 0 ? ratingNum : null
  };
  out.ratingLabel = out.rating ? `★ ${out.rating % 1 ? out.rating.toFixed(1) : out.rating}/5` : null;
  if (!out.balanceLabel && !out.bodyLabel && !out.extractionLabel && !out.rating) return null;
  return out;
}

function scaOf(item) {
  const n = parseFloat(item.sca_score || item.score);
  return Number.isFinite(n) && n > 0 ? (n % 1 ? Number(n.toFixed(2)) : n) : null;
}

function cleanMethod(raw) {
  const m = stripEmojis(String(raw || 'V60'));
  if (m.toLowerCase().includes('pulsar')) return 'Pulsar';
  return m.replace(/\s*\(filtrado\)/i, '').trim();
}

/**
 * Normalizes a batch or recipe object into the card data model.
 */
function buildCardData(input, incRecipe) {
  const rec = input || {};
  const batch = rec.batch || rec;
  const pick = (...keys) => {
    for (const k of keys) {
      const v = rec[k] !== undefined && rec[k] !== null && rec[k] !== '' ? rec[k] : batch[k];
      if (v !== undefined && v !== null && v !== '') return v;
    }
    return '';
  };

  const rawAltitude = pick('altitude', 'batch_altitude');
  const altitude = rawAltitude
    ? (/[a-z]/i.test(String(rawAltitude)) ? stripEmojis(String(rawAltitude)) : `${stripEmojis(String(rawAltitude))} msnm`)
    : '';

  const coffeeG = parseFloat(pick('coffee_grams', 'dose_in_g')) || null;
  const waterG = parseFloat(pick('water_grams', 'dose_out_g', 'water_total_g')) || (coffeeG ? Math.round(coffeeG * 16) : null);
  const ratioRaw = pick('ratio') || (coffeeG && waterG ? `1:${(waterG / coffeeG).toFixed(1)}` : '1:16');
  const ratio = String(ratioRaw).replace(/^1:/, '');

  // Grinder name + dial without repeating the grinder
  const activeGrinder = rec.active_grinder_dial || (rec.grinder_id ? { grinder_id: rec.grinder_id, dial: rec.grind } : null);
  const grinderId = (activeGrinder && activeGrinder.grinder_id) || rec.grinder_id || rec.grinder || batch.grinder || null;
  const grinderCfg = Array.isArray(GRINDERS) && grinderId
    ? GRINDERS.find(g => g.id === grinderId || String(grinderId).includes(g.id) || g.id.includes(String(grinderId))) || null
    : null;
  const grinderName = (activeGrinder && activeGrinder.grinder_name)
    || (grinderCfg ? (grinderCfg.shortName || grinderCfg.name) : null)
    || (typeof rec.grinder === 'string' && rec.grinder ? rec.grinder : null);
  let dial = String((activeGrinder && activeGrinder.dial) || pick('grind_size', 'grind') || '');
  if (grinderName && dial.toLowerCase().startsWith(String(grinderName).toLowerCase())) {
    dial = dial.slice(String(grinderName).length).replace(/^[:\s-]+/, '');
  }

  const tempRaw = pick('temp', 'temperature');
  const timeRaw = pick('time', 'brew_time');
  const sens = parseSensoryEvaluation(batch, rec) || {};
  const remaining = rec.remaining_doses !== undefined && rec.remaining_doses !== null && rec.remaining_doses !== ''
    ? parseInt(rec.remaining_doses, 10)
    : null;

  return {
    name: stripEmojis(String(pick('batch_name', 'coffee_name', 'name') || 'Café de especialidad')),
    roaster: stripEmojis(String(pick('roaster', 'batch_roaster'))),
    producer: stripEmojis(String(pick('producer', 'batch_producer'))),
    origin: stripEmojis(String(pick('origin', 'batch_origin'))),
    process: stripEmojis(String(pick('process', 'batch_process'))),
    variety: stripEmojis(String(pick('variety', 'batch_variety'))),
    altitude,
    roastLevel: stripEmojis(String(pick('roast_level', 'roast'))),
    sca: scaOf(rec.sca_score || rec.score ? rec : batch),
    method: cleanMethod(pick('method')),
    coffeeG,
    waterG,
    ratio,
    grind: stripEmojis(dial) || 'Medio',
    grinderName,
    temp: tempRaw ? `${String(tempRaw).replace(/\s*°?C$/i, '')}°C` : '93°C',
    time: timeRaw ? stripEmojis(String(timeRaw)).replace(/\s*min$/i, '') : '2:30',
    tags: extractFlavorTags(cleanNotesString(pick('flavor_notes', 'roaster_notes', 'batch_roaster_notes'))),
    note: incRecipe ? stripEmojis(String(rec.notes || rec.user_notes || '')).replace(/\s+/g, ' ').trim() : '',
    balanceLabel: sens.balanceLabel || null,
    bodyLabel: sens.bodyLabel || null,
    extractionLabel: sens.extractionLabel || null,
    rating: incRecipe ? sens.rating || null : null,
    ratingLabel: incRecipe ? sens.ratingLabel || null : null,
    remaining
  };
}

function createCanvas(w, h) {
  const canvas = typeof document !== 'undefined' && document.createElement
    ? document.createElement('canvas')
    : globalThis.createMockCanvas?.(w, h);
  if (!canvas) throw new Error('Canvas not supported');
  canvas.width = w;
  canvas.height = h;
  return canvas;
}

/**
 * Wraps a finished 1080x1350 feed card into a 1080x1920 story canvas.
 * The card sits inside Instagram's safe zone (top/bottom ~250px stay clear).
 */
function composeStoryCanvas(feedCanvas, style, footerText) {
  const theme = TREND_THEMES[style] || TREND_THEMES[DEFAULT_CARD_STYLE];
  const story = createCanvas(1080, 1920);
  const sctx = story.getContext('2d');
  sctx.fillStyle = theme.bg;
  sctx.fillRect(0, 0, 1080, 1920);
  const top = Math.round((1920 - 1350) / 2);
  sctx.drawImage(feedCanvas, 0, top);
  sctx.fillStyle = theme.textSecondary;
  sctx.font = `800 26px ${theme.fontMono}`;
  sctx.textAlign = 'center';
  sctx.textBaseline = 'alphabetic';
  sctx.fillText(footerText, 540, top + 1350 + 70);
  return story;
}

// ---------------------------------------------------------------------------
// Public generators
// ---------------------------------------------------------------------------

/**
 * Recipe card (incRecipe = true) or bean card (false), feed 4:5 or story 9:16.
 */
export async function generateRecipeCardImage(recipe, template = DEFAULT_CARD_STYLE, incRecipe = true, format = getPreferredCardFormat()) {
  const style = normalizeCardStyle(template);
  await ensureFontsLoaded();
  const canvas = createCanvas(1080, 1350);
  const ctx = canvas.getContext('2d');
  const d = buildCardData(recipe, incRecipe);
  drawTrendCard(ctx, style, d, incRecipe, 1);
  if (format === 'story') {
    return composeStoryCanvas(canvas, style, d.roaster ? `${d.roaster.toUpperCase()} • BEANTAG` : 'BEANTAG').toDataURL('image/png', 1.0);
  }
  return canvas.toDataURL('image/png', 1.0);
}

/**
 * Cellar menu: every coffee with stock, height adapts to the list.
 */
export async function generateCoffeeMenuCardImage(batches, template = DEFAULT_CARD_STYLE) {
  const style = normalizeCardStyle(template);
  await ensureFontsLoaded();
  const all = Array.isArray(batches) ? batches : [];
  const withStock = all.filter(b => (b.remaining_doses || b.weight_current_g || 0) > 0);
  const list = withStock.length > 0 ? withStock : all.slice(0, 10);

  const items = list.map(b => {
    const doses = b.remaining_doses !== undefined && b.remaining_doses !== null ? b.remaining_doses : 0;
    const grams = b.remaining_weight_g || b.weight_current_g;
    return {
      name: stripEmojis(b.batch_name || b.name || b.coffee_name || 'Café'),
      roaster: stripEmojis(b.roaster || ''),
      origin: stripEmojis(b.origin || ''),
      process: stripEmojis(b.process || ''),
      sca: scaOf(b),
      tags: extractFlavorTags(cleanNotesString(b.flavor_notes || b.roaster_notes || b.notes || b.batch_roaster_notes || '')),
      stock: doses > 0 ? `${doses} ${doses === 1 ? 'TUBO' : 'TUBOS'}` : (grams ? `~${Math.round(grams)}g` : '')
    };
  });

  const size = trendMenuSize(style, items.length);
  const canvas = createCanvas(size.width, size.height);
  drawTrendMenu(canvas.getContext('2d'), style, items, size.width, size.height);
  return canvas.toDataURL('image/png', 1.0);
}

/**
 * Plain-text menu for WhatsApp / clipboard.
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
 * Stickers for stories: horizontal 1280x680 or vertical 880x1160, optional transparent die-cut.
 */
export async function generateCoffeeStickerImage(batchOrRecipe, options = {}) {
  const style = normalizeCardStyle(options.template);
  const vertical = String(options.orientation || '').toLowerCase() === 'vertical';
  const includeRecipe = Boolean(options.includeRecipe);
  const w = vertical ? 880 : 1280;
  const h = vertical ? 1160 : 680;
  await ensureFontsLoaded();
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  const item = batchOrRecipe || {};
  const d = buildCardData(item.recipe ? { ...item.recipe, ...item } : item, includeRecipe);
  drawTrendSticker(ctx, style, d, { vertical, transparent: Boolean(options.transparent), includeRecipe }, w, h);
  return canvas.toDataURL('image/png', 1.0);
}

// Aliases kept for older call sites
export const generateBeanCardImage = (recipe, template = DEFAULT_CARD_STYLE) => generateRecipeCardImage(recipe, template, false);
export const generateMenuCardImage = generateCoffeeMenuCardImage;
export const generateStickerImage = generateCoffeeStickerImage;
