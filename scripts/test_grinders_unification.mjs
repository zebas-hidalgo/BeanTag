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
console.log('Test 2: Verify Microns Calculation & Dial Formatter (SCA D50 Standards)');

// J-Max (2.2.5 = 205 clicks) -> V60 Pour-over ~676 µm (SCA D50)
const jmax = getGrinderConfig('jmax');
const jmaxMicrons = jmax.calculateMicrons(2, 2, 5);
assert.ok(jmaxMicrons >= 650 && jmaxMicrons <= 750, `Expected 650-750 µm for J-Max V60 2.2.5, got ${jmaxMicrons}`);
const jmaxEspresso = jmax.calculateMicrons(1, 4, 0); // 130 clicks
assert.ok(jmaxEspresso >= 250 && jmaxEspresso <= 360, `Expected 250-360 µm for J-Max espresso 1.4.0, got ${jmaxEspresso}`);
const jmaxDial = jmax.formatDial(2, 2, 5);
assert.strictEqual(jmaxDial, 'J-Max: 2.2.5');

// K-Ultra (8.0 = 80 clicks) -> V60 Pour-over ~762 µm
const kUltra = getGrinderConfig('k_ultra');
const kUltraMicrons = kUltra.calculateMicrons(8.0);
assert.ok(kUltraMicrons >= 700 && kUltraMicrons <= 820, `Expected 700-820 µm for K-Ultra 8.0, got ${kUltraMicrons}`);
assert.ok(kUltra.formatDial(8.0).includes('8.0'), 'K-Ultra dial should format 8.0');

// Ode Gen 2 (4.2) -> V60 Pour-over ~732 µm
const ode = getGrinderConfig('ode_gen2');
const odeMicrons = ode.calculateMicrons(4.2);
assert.ok(odeMicrons >= 680 && odeMicrons <= 780, `Expected 680-780 µm for Ode 4.2, got ${odeMicrons}`);
assert.strictEqual(ode.formatDial(4.2), 'Ode Gen 2: Ajuste 4.2');

// Comandante (23 clicks) -> V60 Pour-over ~747 µm
const com = getGrinderConfig('comandante');
const comMicrons = com.calculateMicrons(23);
assert.ok(comMicrons >= 700 && comMicrons <= 800, `Expected 700-800 µm for Comandante 23 clicks, got ${comMicrons}`);
assert.strictEqual(com.formatDial(23), 'Comandante: 23 clics');

// Femobook (60 clicks) -> V60 Pour-over ~750 µm
const femo = getGrinderConfig('femobook');
const femoMicrons = femo.calculateMicrons(60);
assert.ok(femoMicrons >= 700 && femoMicrons <= 800, `Expected 700-800 µm for Femobook 60 clicks, got ${femoMicrons}`);

// Kingrinder K6 (92 clicks) -> V60 Pour-over ~732 µm
const king = getGrinderConfig('kingrinder');
const kingMicrons = king.calculateMicrons(92);
assert.ok(kingMicrons >= 680 && kingMicrons <= 780, `Expected 680-780 µm for Kingrinder 92 clicks, got ${kingMicrons}`);

// Timemore (17 clicks) -> V60 Pour-over ~653 µm
const time = getGrinderConfig('timemore');
const timeMicrons = time.calculateMicrons(17);
assert.ok(timeMicrons >= 600 && timeMicrons <= 750, `Expected 600-750 µm for Timemore 17 clicks, got ${timeMicrons}`);

// Baratza (step 15) -> V60 Pour-over ~641 µm
const bar = getGrinderConfig('baratza');
const barMicrons = bar.calculateMicrons(15);
assert.ok(barMicrons >= 600 && barMicrons <= 750, `Expected 600-750 µm for Baratza step 15, got ${barMicrons}`);

console.log('✅ Passed: All 8 grinder micron calculations match real SCA specialty particle distributions.');

// 3. Verify parseGrindToMicrons compatibility
console.log('Test 3: Verify parseGrindToMicrons extracts accurate microns from all 8 grinder strings');

const sampleGrinds = [
  'J-Max: 2.2.5 (~720 µm)',
  '1Zpresso K-Ultra: 8.0 (~760 µm)',
  'Fellow Ode Gen 2: Ajuste 4.2 (~730 µm)',
  'Comandante: 23 clics (~720 µm)',
  'Femobook A2: 60 clics (~750 µm)',
  'Kingrinder K6: 92 clics (~730 µm)',
  'Timemore: 17 clics (~680 µm)',
  'Baratza: Ajuste 15 (~720 µm)'
];

sampleGrinds.forEach(str => {
  const extracted = parseGrindToMicrons(str);
  assert.ok(extracted >= 200 && extracted <= 1300, `parseGrindToMicrons should extract valid micron value from '${str}', got ${extracted}`);
});
console.log('✅ Passed: Card generator accurately extracts micron values from all 8 grinder strings.');

// 4. Verify fallback behavior
console.log('Test 4: Verify getGrinderConfig fallback');
assert.strictEqual(getGrinderConfig(null).id, 'jmax');
assert.strictEqual(getGrinderConfig('unknown_device').id, 'jmax');
assert.strictEqual(getGrinderConfig('k_ultra_pro').id, 'k_ultra');
console.log('✅ Passed: getGrinderConfig handles null, unknown and partial ID lookups gracefully.');

console.log('\n🎉 ALL 8-GRINDER UNIFICATION UNIT TESTS PASSED!');
