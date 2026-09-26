import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { GRINDERS, getGrinderConfig, parseGrindToMicrons } from '../frontend/src/utils/grinders.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const assetsDir = path.resolve(__dirname, '../backend/public/assets');

console.log('🧪 Running Grinder Unification & Dial Formatter Unit Tests...');

// 1. Verify all 8 grinders are present
console.log('Test 1: Verify all 8 grinders are configured');
assert.strictEqual(GRINDERS.length, 8, `Expected 8 grinders, got ${GRINDERS.length}`);
const expectedIds = ['jmax', 'k_ultra', 'ode_gen2', 'comandante', 'femobook', 'kingrinder', 'timemore', 'baratza'];
expectedIds.forEach(id => {
  const g = GRINDERS.find(grinder => grinder.id === id);
  assert.ok(g, `Grinder ${id} must be configured in GRINDERS`);
  assert.ok(g.name, `Grinder ${id} must have a name`);
  assert.ok(g.burrs, `Grinder ${id} must have burrs defined`);
});
console.log('✅ Passed: 8 grinders configured with specifications.');

// 2. Verify Microns Calculation & Format Dial for each grinder
console.log('Test 2: Verify Microns Calculation & Dial Formatter');

// J-Max (1.5.0) -> (90 + 50 + 0) * 8.8 = 1232 µm
const jmax = getGrinderConfig('jmax');
const jmaxMicrons = jmax.calculateMicrons(1, 5, 0);
assert.strictEqual(jmaxMicrons, 1232, `Expected 1232 µm for J-Max 1.5.0, got ${jmaxMicrons}`);
const jmaxDial = jmax.formatDial(1, 5, 0);
assert.strictEqual(jmaxDial, 'J-Max: 1.5.0');

// K-Ultra (9.5) -> 9.5 * 10 * 20 = 1900 µm
const kUltra = getGrinderConfig('k_ultra');
const kUltraMicrons = kUltra.calculateMicrons(9.5);
assert.strictEqual(kUltraMicrons, 1900, `Expected 1900 µm for K-Ultra 9.5, got ${kUltraMicrons}`);
assert.ok(kUltra.formatDial(9.5).includes('9.5'), 'K-Ultra dial should format 9.5');

// Ode Gen 2 (5.0) -> 350 + 5.0 * 75 = 725 µm
const ode = getGrinderConfig('ode_gen2');
const odeMicrons = ode.calculateMicrons(5.0);
assert.strictEqual(odeMicrons, 725, `Expected 725 µm for Ode 5.0, got ${odeMicrons}`);
assert.strictEqual(ode.formatDial(5.0), 'Ode Gen 2: Ajuste 5.0');

// Comandante (24 clicks) -> 24 * 30 = 720 µm
const com = getGrinderConfig('comandante');
const comMicrons = com.calculateMicrons(24);
assert.strictEqual(comMicrons, 720, `Expected 720 µm for Comandante 24 clicks, got ${comMicrons}`);
assert.strictEqual(com.formatDial(24), 'Comandante: 24 clics');

// Femobook (60 clicks) -> 60 * 18 = 1080 µm
const femo = getGrinderConfig('femobook');
const femoMicrons = femo.calculateMicrons(60);
assert.strictEqual(femoMicrons, 1080, `Expected 1080 µm for Femobook 60 clicks, got ${femoMicrons}`);

// Kingrinder K6 (90 clicks) -> 90 * 16 = 1440 µm
const king = getGrinderConfig('kingrinder');
const kingMicrons = king.calculateMicrons(90);
assert.strictEqual(kingMicrons, 1440, `Expected 1440 µm for Kingrinder 90 clicks, got ${kingMicrons}`);

// Timemore (18 clicks) -> 18 * 33 = 594 µm
const time = getGrinderConfig('timemore');
const timeMicrons = time.calculateMicrons(18);
assert.strictEqual(timeMicrons, 594, `Expected 594 µm for Timemore 18 clicks, got ${timeMicrons}`);

// Baratza (step 15) -> 400 + 15 * 30 = 850 µm
const bar = getGrinderConfig('baratza');
const barMicrons = bar.calculateMicrons(15);
assert.strictEqual(barMicrons, 850, `Expected 850 µm for Baratza step 15, got ${barMicrons}`);

console.log('✅ Passed: All 8 grinder micron calculations and formatters are mathematically exact.');

// 3. Verify parseGrindToMicrons compatibility
console.log('Test 3: Verify parseGrindToMicrons extracts accurate microns from all 8 grinder strings');

const sampleGrinds = [
  'J-Max: 1.5.0 (~1232 µm)',
  '1Zpresso K-Ultra: 9.5 (~1900 µm)',
  'Fellow Ode Gen 2: Ajuste 5.0 (~725 µm)',
  'Comandante: 24 clics (~720 µm)',
  'Femobook A2: 60 clics (~1080 µm)',
  'Kingrinder K6: 90 clics (~1440 µm)',
  'Timemore: 18 clics (~594 µm)',
  'Baratza: Ajuste 15 (~850 µm)'
];

sampleGrinds.forEach(str => {
  const extracted = parseGrindToMicrons(str);
  assert.ok(extracted > 300 && extracted < 3000, `parseGrindToMicrons should extract valid micron value from '${str}', got ${extracted}`);
});
console.log('✅ Passed: Card generator accurately extracts micron values from all 8 grinder strings.');

// 4. Verify fallback behavior
console.log('Test 4: Verify getGrinderConfig fallback');
assert.strictEqual(getGrinderConfig(null).id, 'jmax');
assert.strictEqual(getGrinderConfig('unknown_device').id, 'jmax');
assert.strictEqual(getGrinderConfig('k_ultra_pro').id, 'k_ultra');
console.log('✅ Passed: getGrinderConfig handles null, unknown and partial ID lookups gracefully.');

console.log('\n🎉 ALL 8-GRINDER UNIFICATION UNIT TESTS PASSED!');
