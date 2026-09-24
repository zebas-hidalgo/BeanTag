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

// 2. Test Offline Recipe Computation for V60 (Dynamic Terroir & Roast Adaptive)
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
assert.equal(v60Recipe.ratio, '1:16.6', 'Light roast washed specialty should adapt ratio to 1:16.6');
assert.equal(v60Recipe.water_total_g, 332, 'Water should be 20 * 16.6 = 332g');
assert.equal(v60Recipe._source, 'barista_fallback');
assert.ok(v60Recipe.grinders.jmax, 'Should include J-Max grind dial');
assert.ok(v60Recipe.grinders.femobook_a2, 'Should include Femobook A2 grind');
assert.ok(v60Recipe.grinders.comandante, 'Should include Comandante grind');
assert.equal(v60Recipe.pours.length, 4, 'Light roast washed should use 4-pour high extraction method');
assert.equal(v60Recipe.temperature, 96, 'High altitude light roast should extract at 96°C');
console.log('✅ V60 light washed offline calculation passed:', v60Recipe.grind, '| Ratio:', v60Recipe.ratio, '| Temp:', v60Recipe.temperature + '°C');

// Test 2b: Dark Roast Contrast Test
console.log('\nTest 2b: Offline Recipe Dynamic Parameter Contrast (Dark Roast)');
const darkRecipe = computeOfflineRecipe({
  origin: 'Sumatra Mandheling',
  variety: 'Typica',
  process: 'Húmedo',
  altitude: '1200m',
  roast_level: 'Oscuro',
  method: 'V60 (Filtrado)',
  dose_in_g: 20
});
assert.equal(darkRecipe.ratio, '1:14.5', 'Dark roast should use shorter 1:14.5 ratio to prevent bitterness');
assert.equal(darkRecipe.water_total_g, 290, 'Water should be 290g for dark roast');
assert.equal(darkRecipe.temperature, 89, 'Dark roast should drop temperature to 89°C');
assert.ok(darkRecipe.jmax_rot > v60Recipe.jmax_rot || darkRecipe.jmax_num > v60Recipe.jmax_num, 'Dark roast should grind coarser than light roast');
console.log('✅ Dark roast parameter contrast passed:', darkRecipe.grind, '| Ratio:', darkRecipe.ratio, '| Temp:', darkRecipe.temperature + '°C');

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

// 4. Test Offline Recipe Computation for AeroPress Go
console.log('\nTest 4: Offline Recipe Computation (AeroPress Go Compact Chamber)');
const goRecipe = computeOfflineRecipe({
  origin: 'Kenya Nyeri',
  variety: 'SL28',
  process: 'Lavado',
  altitude: '1800m',
  roast_level: 'Claro',
  method: 'AeroPress Go',
  dose_in_g: 14
});

assert.equal(goRecipe.method, 'AeroPress Go');
assert.equal(goRecipe.ratio, '1:14.5', 'AeroPress Go light roast ratio');
assert.equal(goRecipe.water_total_g, 203, 'AeroPress Go water within 220ml chamber');
assert.ok(goRecipe.water_total_g <= 215, 'Must respect AeroPress Go chamber capacity limit');
assert.equal(goRecipe.brew_time, '1:45 min', 'AeroPress Go extraction time');
assert.ok(goRecipe.pours.some(p => p.label.toLowerCase().includes('cámara go') || p.description.toLowerCase().includes('paleta')), 'Should feature Go chamber instructions');
console.log('✅ AeroPress Go offline calculation passed:', goRecipe.grind, '| Water:', goRecipe.water_total_g + 'g | Time:', goRecipe.brew_time);

// 5. Test Offline Recipe Tuning (Under-extracted / Sour)
console.log('\nTest 5: Offline Sensory Tuning (Correcting Sub-extraction)');
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
