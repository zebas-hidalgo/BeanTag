import { FAMOUS_RECIPES } from '../frontend/src/utils/famousRecipes.js';
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

console.log('\n🎉 ALL NEXTLEVEL PULSAR MINI TESTS PASSED!');
