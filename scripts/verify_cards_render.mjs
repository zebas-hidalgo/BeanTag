// --- BEANTAG AUTOMATED CARD RENDERING VERIFICATION SCRIPT ---
// Headless DOM verification of production bundle card generation:
// Tests 4 styles x 2 modes (Con Receta, Solo Grano) = 8 variants
// Tests 4 styles cellar menu cards = 4 variants
// Total: 12 configurations verified against Canvas 2D operations.

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Locate the latest production bundle in backend/public/assets/index-*.js
const assetsDir = path.resolve(__dirname, '../backend/public/assets');
if (!fs.existsSync(assetsDir)) {
  console.error(`❌ Assets directory not found at: ${assetsDir}`);
  process.exit(1);
}

const jsFiles = fs.readdirSync(assetsDir)
  .filter(file => /^index-.*\.js$/.test(file))
  .map(file => {
    const fullPath = path.join(assetsDir, file);
    return {
      file,
      fullPath,
      mtime: fs.statSync(fullPath).mtimeMs
    };
  })
  .sort((a, b) => b.mtime - a.mtime);

if (jsFiles.length === 0) {
  console.error(`❌ No index-*.js bundle found in ${assetsDir}. Please run 'npm run build' in frontend first.`);
  process.exit(1);
}

const latestBundle = jsFiles[0];
console.log('='.repeat(70));
console.log('🧪 BEANTAG HEADLESS CARD RENDERING VERIFICATION');
console.log('='.repeat(70));
console.log(`📦 Production Bundle: ${latestBundle.file}`);
console.log(`📂 Location: ${latestBundle.fullPath}`);

// 2. Setup Headless Mock Browser & DOM Environment
const mockOps = [];
const mockCtx = {
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  font: '',
  textAlign: 'left',
  textBaseline: 'alphabetic',
  globalAlpha: 1.0,
  shadowColor: '',
  shadowBlur: 0,
  shadowOffsetX: 0,
  shadowOffsetY: 0,
  setLineDash: () => {},
  beginPath: () => mockOps.push('beginPath'),
  closePath: () => mockOps.push('closePath'),
  moveTo: (x, y) => mockOps.push(`moveTo(${x},${y})`),
  lineTo: (x, y) => mockOps.push(`lineTo(${x},${y})`),
  quadraticCurveTo: (cpx, cpy, x, y) => mockOps.push(`quadraticCurveTo(${cpx},${cpy},${x},${y})`),
  bezierCurveTo: (cp1x, cp1y, cp2x, cp2y, x, y) => mockOps.push(`bezierCurveTo(${cp1x},${cp1y},${cp2x},${cp2y},${x},${y})`),
  arc: (x, y, r, sa, ea) => mockOps.push(`arc(${x},${y},${r})`),
  ellipse: (x, y, rx, ry, rot, sa, ea) => mockOps.push('ellipse'),
  rect: (x, y, w, h) => mockOps.push(`rect(${x},${y},${w},${h})`),
  fillRect: (x, y, w, h) => mockOps.push(`fillRect(${x},${y},${w},${h})`),
  strokeRect: (x, y, w, h) => mockOps.push(`strokeRect(${x},${y},${w},${h})`),
  clearRect: (x, y, w, h) => mockOps.push(`clearRect(${x},${y},${w},${h})`),
  fill: () => mockOps.push('fill'),
  stroke: () => mockOps.push('stroke'),
  clip: () => mockOps.push('clip'),
  scale: (sx, sy) => mockOps.push(`scale(${sx},${sy})`),
  fillText: (t, x, y) => mockOps.push(`fillText(${String(t).slice(0, 15)},${x},${y})`),
  measureText: (str) => ({ width: (String(str).length * 8) }),
  createRadialGradient: () => ({ addColorStop: () => {} }),
  createLinearGradient: () => ({ addColorStop: () => {} }),
  save: () => mockOps.push('save'),
  restore: () => mockOps.push('restore'),
  translate: (x, y) => mockOps.push(`translate(${x},${y})`),
  rotate: (angle) => mockOps.push(`rotate(${angle})`),
  drawImage: () => mockOps.push('drawImage')
};

global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};

global.document = {
  nodeType: 9,
  documentElement: { setAttribute: () => {}, removeAttribute: () => {}, style: {} },
  addEventListener: () => {},
  removeEventListener: () => {},
  fonts: {
    load: async () => true,
    ready: Promise.resolve()
  },
  createElement: (tag) => {
    if (tag === 'canvas') {
      return {
        width: 0,
        height: 0,
        getContext: (type) => (type === '2d' ? mockCtx : null),
        toDataURL: (type) => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      };
    }
    return {
      nodeType: 1,
      tagName: String(tag).toUpperCase(),
      style: {},
      children: [],
      ownerDocument: global.document,
      setAttribute: () => {},
      getAttribute: () => null,
      addEventListener: () => {},
      removeEventListener: () => {},
      appendChild: (child) => child,
      removeChild: () => {},
      insertBefore: () => {}
    };
  },
  querySelectorAll: () => [],
  querySelector: () => null,
  getElementById: (id) => ({
    nodeType: 1,
    tagName: 'DIV',
    id: id || '',
    style: {},
    children: [],
    ownerDocument: global.document,
    setAttribute: () => {},
    getAttribute: () => null,
    addEventListener: () => {},
    removeEventListener: () => {},
    appendChild: (child) => child,
    removeChild: () => {},
    insertBefore: () => {}
  })
};

global.Image = class {
  constructor() {
    this.complete = true;
    this.naturalWidth = 200;
    this.naturalHeight = 200;
    this.width = 200;
    this.height = 200;
  }
  set src(val) {
    this._src = val;
    if (this.onload) setTimeout(() => this.onload(), 0);
  }
  get src() {
    return this._src;
  }
};

global.MutationObserver = class {
  observe() {}
  disconnect() {}
};

global.CustomEvent = class {
  constructor(type, eventInitDict) {
    this.type = type;
    this.detail = eventInitDict?.detail;
  }
};

global.location = {
  href: 'http://localhost/',
  origin: 'http://localhost',
  pathname: '/',
  search: '',
  hash: ''
};
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {}
};
global.fetch = async () => ({ ok: true, json: async () => [] });

// 3. Test Fixtures
const sampleRecipe = {
  batch_name: 'Gesha Finca Deborah Echo',
  coffee_name: 'Gesha Finca Deborah Echo',
  origin: 'Boquete, Panamá',
  roaster: 'Savage Coffees',
  producer: 'Jamison Savage',
  process: 'Maceración Carbónica',
  variety: 'Geisha',
  altitude: '1950m',
  flavor_notes: 'Jazmín, Papaya, Bergamota, Miel silvestre, Melocotón',
  sca_score: 92.5,
  remaining_doses: 12,
  method: 'V60 Conical',
  coffee_grams: 16,
  water_grams: 250,
  ratio: '1:15.6',
  grind_size: 'Medio Fino (750 µm)',
  temp: '93°C',
  time: '02:45'
};

const sampleBatches = [
  { batch_name: 'Gesha Finca Deborah Echo', origin: 'Panamá', process: 'Maceración Carbónica', remaining_doses: 12, roaster: 'Savage Coffees' },
  { batch_name: 'Pink Bourbon El Paraiso', origin: 'Colombia', process: 'Doble Fermentación', remaining_doses: 8, roaster: 'Finca El Paraiso' },
  { batch_name: 'Wush Wush Keffa', origin: 'Etiopía', process: 'Natural Anaeróbico', remaining_doses: 15, roaster: 'Keffa Forest' },
  { batch_name: 'Chiroso Finca Los Alpes', origin: 'Colombia', process: 'Lavado Frío', remaining_doses: 6, roaster: 'Los Alpes' }
];

const STYLES = ['blueprint', 'neobrutalist', 'aurora', 'hangtag'];

async function verify() {
  const bundleUrl = pathToFileURL(latestBundle.fullPath).href;
  console.log(`\n🔄 Dynamically importing production bundle...`);
  await import(bundleUrl);

  if (typeof window.__generateRecipeCardImage !== 'function') {
    throw new Error('window.__generateRecipeCardImage is not exposed or not a function!');
  }
  if (typeof window.__generateCoffeeMenuCardImage !== 'function') {
    throw new Error('window.__generateCoffeeMenuCardImage is not exposed or not a function!');
  }

  console.log('✅ Bundle loaded successfully! Exposed generator functions detected.\n');

  const results = [];
  let hasFailure = false;

  console.log('┌─────────────────┬──────────────┬──────────────┬────────────┬────────┐');
  console.log('│ Style           │ Variant Type │ Mode / Brew  │ Canvas Ops │ Status │');
  console.log('├─────────────────┼──────────────┼──────────────┼────────────┼────────┤');

  // A. Verify 8 Card Configurations: 4 styles x 2 modes (Con Receta, Solo Grano)
  for (const style of STYLES) {
    // Mode 1: Con Receta (includeBrew = true)
    try {
      mockOps.length = 0;
      const dataUrl = await window.__generateRecipeCardImage(sampleRecipe, style, true);
      const isValidDataUrl = typeof dataUrl === 'string' && dataUrl.startsWith('data:image/png;base64,');
      const opsCount = mockOps.length;
      const hasNoDrawImage = !mockOps.includes('drawImage');
      const passed = isValidDataUrl && opsCount > 20 && hasNoDrawImage;

      if (!passed) hasFailure = true;

      results.push({
        style,
        type: 'Recipe Card',
        mode: 'Con Receta',
        ops: opsCount,
        status: passed ? 'PASS' : 'FAIL'
      });

      console.log(
        `│ ${style.padEnd(15)} │ ${'Recipe Card'.padEnd(12)} │ ${'Con Receta'.padEnd(12)} │ ${String(opsCount).padStart(10)} │ ${passed ? '✅ PASS' : '❌ FAIL'} │`
      );
    } catch (err) {
      hasFailure = true;
      results.push({ style, type: 'Recipe Card', mode: 'Con Receta', ops: 0, status: 'ERROR' });
      console.log(`│ ${style.padEnd(15)} │ ${'Recipe Card'.padEnd(12)} │ ${'Con Receta'.padEnd(12)} │ ${'0'.padStart(10)} │ ❌ ERR  │`);
      console.error(`   ⚠️ Error details (${style} Con Receta):`, err.message);
    }

    // Mode 2: Solo Grano (includeBrew = false)
    try {
      mockOps.length = 0;
      const dataUrl = await window.__generateRecipeCardImage(sampleRecipe, style, false);
      const isValidDataUrl = typeof dataUrl === 'string' && dataUrl.startsWith('data:image/png;base64,');
      const opsCount = mockOps.length;
      const hasNoDrawImage = !mockOps.includes('drawImage');
      const passed = isValidDataUrl && opsCount > 20 && hasNoDrawImage;

      if (!passed) hasFailure = true;

      results.push({
        style,
        type: 'Bean Card',
        mode: 'Solo Grano',
        ops: opsCount,
        status: passed ? 'PASS' : 'FAIL'
      });

      console.log(
        `│ ${style.padEnd(15)} │ ${'Bean Card'.padEnd(12)} │ ${'Solo Grano'.padEnd(12)} │ ${String(opsCount).padStart(10)} │ ${passed ? '✅ PASS' : '❌ FAIL'} │`
      );
    } catch (err) {
      hasFailure = true;
      results.push({ style, type: 'Bean Card', mode: 'Solo Grano', ops: 0, status: 'ERROR' });
      console.log(`│ ${style.padEnd(15)} │ ${'Bean Card'.padEnd(12)} │ ${'Solo Grano'.padEnd(12)} │ ${'0'.padStart(10)} │ ❌ ERR  │`);
      console.error(`   ⚠️ Error details (${style} Solo Grano):`, err.message);
    }
  }

  // B. Verify 4 Cellar Menu Variants
  for (const style of STYLES) {
    try {
      mockOps.length = 0;
      const dataUrl = await window.__generateCoffeeMenuCardImage(sampleBatches, style);
      const isValidDataUrl = typeof dataUrl === 'string' && dataUrl.startsWith('data:image/png;base64,');
      const opsCount = mockOps.length;
      const hasNoDrawImage = !mockOps.includes('drawImage');
      const passed = isValidDataUrl && opsCount > 20 && hasNoDrawImage;

      if (!passed) hasFailure = true;

      results.push({
        style,
        type: 'Cellar Menu',
        mode: 'Full Stock',
        ops: opsCount,
        status: passed ? 'PASS' : 'FAIL'
      });

      console.log(
        `│ ${style.padEnd(15)} │ ${'Cellar Menu'.padEnd(12)} │ ${'Full Stock'.padEnd(12)} │ ${String(opsCount).padStart(10)} │ ${passed ? '✅ PASS' : '❌ FAIL'} │`
      );
    } catch (err) {
      hasFailure = true;
      results.push({ style, type: 'Cellar Menu', mode: 'Full Stock', ops: 0, status: 'ERROR' });
      console.log(`│ ${style.padEnd(15)} │ ${'Cellar Menu'.padEnd(12)} │ ${'Full Stock'.padEnd(12)} │ ${'0'.padStart(10)} │ ❌ ERR  │`);
      console.error(`   ⚠️ Error details (${style} Cellar Menu):`, err.message);
    }
  }

  console.log('└─────────────────┴──────────────┴──────────────┴────────────┴────────┘');

  const totalPassed = results.filter(r => r.status === 'PASS').length;
  console.log(`\n📊 Summary: ${totalPassed} / ${results.length} tests passed successfully.`);

  if (hasFailure || totalPassed !== 12) {
    console.error('❌ Verification failed: Not all card variants rendered cleanly.');
    process.exit(1);
  }

  console.log('🎉 ALL 8 CARD VARIANTS + 4 CELLAR MENUS RENDERED PERFECTLY (12/12 PASS)!\n');
  process.exit(0);
}

verify().catch(err => {
  console.error('💥 Fatal error during verification execution:', err);
  process.exit(1);
});
