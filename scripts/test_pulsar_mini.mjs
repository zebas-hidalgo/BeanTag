import { FAMOUS_RECIPES } from '../frontend/src/utils/famousRecipes.js';
import { computeOfflineRecipe } from '../backend/aiEngine.js';
import assert from 'node:assert';

console.log('🧪 [TEST] Verifying NextLevel Pulsar Mini Recipes & Valve Properties...');

// 1. Verify existence of the 3 Pulsar Mini recipes
const pulsarRecipes = FAMOUS_RECIPES.filter(r => r.method === 'NextLevel Pulsar Mini' || r.id.includes('pulsar'));
assert.strictEqual(pulsarRecipes.length >= 3, true, `Expected >= 3 Pulsar recipes, got ${pulsarRecipes.length}`);

const rao = FAMOUS_RECIPES.find(r => r.id === 'scott-rao-pulsar-mini');
assert(rao, 'Scott Rao recipe must exist');
assert.strictEqual(rao.method, 'NextLevel Pulsar Mini');
assert.strictEqual(rao.ratioVal, 16.6);
const raoPours = rao.calculatePours(15);
assert.strictEqual(raoPours[0].valve, 'closed');
assert.strictEqual(raoPours[1].valve, 'open');
assert.strictEqual(raoPours[2].valve, 'open');
console.log('✅ Scott Rao Pulsar Mini recipe and valve stages verified.');

const gagne = FAMOUS_RECIPES.find(r => r.id === 'gagne-high-extraction-mini');
assert(gagne, 'Jonathan Gagné recipe must exist');
assert.strictEqual(gagne.method, 'NextLevel Pulsar Mini');
const gagnePours = gagne.calculatePours(15);
assert.strictEqual(gagnePours[0].valve, 'closed');
assert.strictEqual(gagnePours[1].valve, 'half');
assert.strictEqual(gagnePours[2].valve, 'open');
console.log('✅ Jonathan Gagné 50% flow recipe and valve stages verified.');

const concentrate = FAMOUS_RECIPES.find(r => r.id === 'pulsar-mini-concentrate');
assert(concentrate, 'Pulsar Mini Concentrado recipe must exist');
const concPours = concentrate.calculatePours(18);
assert.strictEqual(concPours[0].valve, 'closed');
assert.strictEqual(concPours[1].valve, 'open');
console.log('✅ Pulsar Mini Concentrado recipe and valve stages verified.');

// 2. Verify valve sequence note formatting logic
const testStages = [
  { step: 1, label: 'Bloom e Inmersión', water_g: 50, valve: 'closed' },
  { step: 2, label: '1º Vertido Percolación', water_g: 100, valve: 'half' },
  { step: 3, label: '2º Vertido Final', water_g: 100, valve: 'open' }
];

const valveSeq = testStages.map(s => {
  const vText = s.valve === 'closed' ? '🔒 Cerrada' : s.valve === 'half' ? '⚡ 50% Media' : '🔓 100% Abierta';
  const lbl = (s.label || `Paso ${s.step}`).split('(')[0].trim();
  return `${lbl}: ${vText}`;
}).join(' • ');

assert.strictEqual(valveSeq, 'Bloom e Inmersión: 🔒 Cerrada • 1º Vertido Percolación: ⚡ 50% Media • 2º Vertido Final: 🔓 100% Abierta');
console.log('✅ Pulsar Mini valve sequence formatting verified:', valveSeq);

// 3. Verify Offline Barista Physics Engine for Pulsar Mini + Femobook A2
console.log('\nTest 3: Verify Offline Barista Physics Engine (Pulsar Mini + Femobook A2)');

// Test offline recipe with Pulsar Mini + Femobook A2
const washedBatch = {
  origin: 'Colombia Huila',
  process: 'Lavado',
  roast_level: 'Claro',
  altitude: '1850m',
  method: 'NextLevel Pulsar Mini',
  grinder: 'femobook',
  dose_in_g: 15
};

const naturalBatch = {
  origin: 'Etiopía Yirgacheffe',
  process: 'Natural',
  roast_level: 'Medio',
  altitude: '2000m',
  method: 'NextLevel Pulsar Mini',
  grinder: 'femobook',
  dose_in_g: 15
};

const washedRecipe = computeOfflineRecipe(washedBatch);
const washedClicksMatch = (washedRecipe.active_grinder_dial?.dial || washedRecipe.grinders?.femobook_a2 || '').match(/(\d+)\s*clics/);
const washedClicks = washedClicksMatch ? parseInt(washedClicksMatch[1], 10) : 0;
const washedMicrons = parseInt(washedRecipe.grind_microns, 10);

console.log(`Washed Pulsar Mini -> Femobook: ${washedClicks} clicks, ${washedRecipe.grind_microns}`);
assert.ok(
  washedClicks >= 64 && washedClicks <= 67,
  `Expected Light Washed Pulsar Mini on Femobook A2 to be 64-67 clicks (~750-765 µm), got ${washedClicks} clicks (${washedRecipe.grind_microns})`
);
assert.ok(
  washedMicrons >= 750 && washedMicrons <= 765,
  `Expected Light Washed Pulsar Mini microns to be ~750-765 µm, got ${washedMicrons} µm`
);

const naturalRecipe = computeOfflineRecipe(naturalBatch);
const naturalClicksMatch = (naturalRecipe.active_grinder_dial?.dial || naturalRecipe.grinders?.femobook_a2 || '').match(/(\d+)\s*clics/);
const naturalClicks = naturalClicksMatch ? parseInt(naturalClicksMatch[1], 10) : 0;
const naturalMicrons = parseInt(naturalRecipe.grind_microns, 10);

console.log(`Natural Pulsar Mini -> Femobook: ${naturalClicks} clicks, ${naturalRecipe.grind_microns}`);
assert.ok(
  naturalClicks >= 68 && naturalClicks <= 72,
  `Expected Natural Pulsar Mini on Femobook A2 to be 68-72 clicks (~800-825 µm), got ${naturalClicks} clicks (${naturalRecipe.grind_microns})`
);
assert.ok(
  naturalMicrons >= 800 && naturalMicrons <= 825,
  `Expected Natural Pulsar Mini microns to be ~800-825 µm, got ${naturalMicrons} µm`
);

// Verify valve instructions contain explicit 3 phases (closed bloom, 45-50% percolation, 100% drawdown)
assert.strictEqual(washedRecipe.pours.length, 3, 'Pulsar Mini recipe must have 3 pour stages');
assert.ok(
  /cerrada|closed/i.test(washedRecipe.pours[0].label + ' ' + washedRecipe.pours[0].description),
  'Phase 1 must be closed bloom'
);
assert.ok(
  /(45|50)%\s*de\s*flujo|media|50%/i.test(washedRecipe.pours[1].label + ' ' + washedRecipe.pours[1].description),
  'Phase 2 must be 45-50% percolation'
);
assert.ok(
  /100%|abierta/i.test(washedRecipe.pours[2].label + ' ' + washedRecipe.pours[2].description),
  'Phase 3 must be 100% drawdown'
);
console.log('✅ Pulsar Mini offline recipe calculations and 3-phase valve instructions verified.');

console.log('\n🎉 ALL NEXTLEVEL PULSAR MINI TESTS PASSED!');
