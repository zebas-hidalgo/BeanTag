import assert from 'node:assert/strict';
import { sanitizeModel, computeOfflineRecipe, computeOfflineTuning } from '../backend/aiEngine.js';

console.log('🧪 Running AI Reliability & Fallback Engine Unit Tests...\n');

// 1. Test Model Sanitization
console.log('Test 1: Model Sanitization');
assert.equal(sanitizeModel('gemini-3.7-flash'), 'gemini-3.6-flash', 'Should map gemini-3.7-flash to gemini-3.6-flash');
assert.equal(sanitizeModel('gemini-3.7-pro'), 'gemini-2.5-pro', 'Should map gemini-3.7-pro to gemini-2.5-pro');
assert.equal(sanitizeModel('gemini-3.6-flash'), 'gemini-3.6-flash', 'Should preserve valid gemini-3.6-flash');
assert.equal(sanitizeModel('gemini-3.5-flash-lite'), 'gemini-3.5-flash-lite', 'Should preserve valid gemini-3.5-flash-lite');
assert.equal(sanitizeModel('gemini-2.5-flash'), 'gemini-2.5-flash', 'Should preserve valid gemini-2.5-flash');
assert.equal(sanitizeModel('gemini-2.0-flash'), 'gemini-3.6-flash', 'Should map deprecated gemini-2.0-flash to gemini-3.6-flash');
assert.equal(sanitizeModel('gemini-2.0-flash-lite'), 'gemini-3.5-flash-lite', 'Should map deprecated gemini-2.0-flash-lite to gemini-3.5-flash-lite');
assert.equal(sanitizeModel('gemini-1.5-flash'), 'gemini-3.6-flash', 'Should map deprecated gemini-1.5-flash to gemini-3.6-flash');
assert.equal(sanitizeModel('gemini-1.5-pro'), 'gemini-2.5-pro', 'Should map deprecated gemini-1.5-pro to gemini-2.5-pro');
assert.equal(sanitizeModel(null), 'gemini-3.6-flash', 'Should default null to gemini-3.6-flash');
assert.equal(sanitizeModel(''), 'gemini-3.6-flash', 'Should default empty to gemini-3.6-flash');
console.log('✅ Model sanitization tests passed.\n');

// 2. Test Offline Recipe Computation for V60
console.log('Test 2: Offline Recipe Computation (V60 Light Roast High Altitude)');
const v60Recipe = computeOfflineRecipe({
  origin: 'Colombia Huila',
  variety: 'Pink Bourbon',
  process: 'Lavado',
  altitude: '1850m',
  roast_level: 'Claro',
  roaster_notes: 'Jazmín, melocotón, bergamota',
  method: 'V60 (Filtrado)',
  dose_in_g: 20
});

assert.equal(v60Recipe.method, 'V60 (Filtrado)');
assert.equal(v60Recipe.water_total_g, 300);
assert.equal(v60Recipe._source, 'barista_fallback');
assert.ok(v60Recipe.grinders.jmax, 'Should include J-Max grind dial');
assert.ok(v60Recipe.grinders.femobook_a2, 'Should include Femobook A2 grind');
assert.ok(v60Recipe.grinders.comandante, 'Should include Comandante grind');
assert.ok(Array.isArray(v60Recipe.pours) && v60Recipe.pours.length >= 2, 'Should generate at least 2 pours');
assert.ok(v60Recipe.temperature >= 90 && v60Recipe.temperature <= 96, 'Temperature should be in specialty range');
console.log('✅ V60 offline calculation passed:', v60Recipe.grind, '| Temp:', v60Recipe.temperature + '°C');

// 3. Test Offline Recipe for NextLevel Pulsar Mini
console.log('\nTest 3: Offline Recipe Computation (NextLevel Pulsar Mini)');
const pulsarRecipe = computeOfflineRecipe({
  origin: 'Etiopía Yirgacheffe',
  variety: 'Heirloom',
  process: 'Natural',
  altitude: '2100m',
  roast_level: 'Claro',
  method: 'NextLevel Pulsar Mini',
  dose_in_g: 15
});

assert.equal(pulsarRecipe.method, 'NextLevel Pulsar Mini');
assert.equal(pulsarRecipe.water_total_g, 240); // 1:16 ratio
assert.ok(pulsarRecipe.pours.some(p => p.description.toLowerCase().includes('válvula') || p.label.toLowerCase().includes('bloom')), 'Should mention valve instructions');
console.log('✅ Pulsar Mini offline calculation passed:', pulsarRecipe.grinders.jmax, '| Ratio:', pulsarRecipe.ratio);

// 4. Test Offline Recipe Tuning (Under-extracted / Sour)
console.log('\nTest 4: Offline Sensory Tuning (Correcting Sub-extraction)');
const tunedRecipe = computeOfflineTuning({
  method: 'V60 (Filtrado)',
  dose_in_g: 20,
  ratio: '1:15',
  temperature: 92,
  jmax_rot: 2,
  jmax_num: 5,
  jmax_click: 0,
  sensory_extraction: 'Sub (Agrio)',
  sensory_balance: 'Desbalanceado',
  sensory_body: 'Ligero',
  user_notes: 'Acidez punzante, poco dulzor',
  batch_name: 'Pink Bourbon Huila'
});

assert.ok(tunedRecipe.correction_reason, 'Should provide correction explanation');
assert.ok(tunedRecipe.temperature >= 93, 'Should increase temperature for sub-extraction');
assert.equal(tunedRecipe._source, 'barista_fallback');
console.log('✅ Sensory tuning passed. Reason:', tunedRecipe.correction_reason);

console.log('\n🎉 ALL AI RELIABILITY & FALLBACK ENGINE TESTS PASSED!\n');
