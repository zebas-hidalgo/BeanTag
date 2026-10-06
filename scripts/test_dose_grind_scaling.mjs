import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { calculateDoseDeltaMicrons, scaleGrinderSettingForDose } from '../frontend/src/utils/grinders.js';

const require = createRequire(import.meta.url);
const { computeOfflineRecipe } = require('../backend/aiEngine.js');

console.log('🧪 Testing Dose-Grind Scaling Physical Calculations...');

// ============================================================================
// 1. Physical Micron Delta Calculations (calculateDoseDeltaMicrons)
// ============================================================================
console.log('Test 1: Physical micron delta calculations (Darcy law bed depth compensation)');

// Filter methods (+8.0 µm/g): V60, Chemex, Pulsar, etc.
assert.equal(calculateDoseDeltaMicrons('V60 (Filtrado)', 15, 20), 40, '5g increase in V60 should add +40 microns');
assert.equal(calculateDoseDeltaMicrons('Chemex', 15, 20), 40, '5g increase in Chemex should add +40 microns');
assert.equal(calculateDoseDeltaMicrons('NextLevel Pulsar Mini', 15, 20), 40, '5g increase in Pulsar should add +40 microns');
assert.equal(calculateDoseDeltaMicrons('V60', 15, 12), -24, '3g decrease in V60 should subtract -24 microns');
assert.equal(calculateDoseDeltaMicrons('Filtrado', 15, 15), 0, '0g dose change in filter should yield 0 delta');

// Espresso (+5.0 µm/g)
assert.equal(calculateDoseDeltaMicrons('Espresso', 18, 20), 10, '2g increase in espresso should add +10 microns');
assert.equal(calculateDoseDeltaMicrons('espresso', 18, 16), -10, '2g decrease in espresso should subtract -10 microns');
assert.equal(calculateDoseDeltaMicrons('Espresso Doble', 18, 18), 0, '0g dose change in espresso should yield 0 delta');

// Decimal Doses & Fractional Deltas
assert.equal(calculateDoseDeltaMicrons('V60', 15.0, 15.5), 4, '0.5g increase in V60 should yield +4 microns');
assert.equal(calculateDoseDeltaMicrons('Espresso', 18.0, 18.5), 3, '0.5g increase in espresso should round to +3 microns (0.5 * 5 = 2.5 -> 3)');
assert.equal(calculateDoseDeltaMicrons('V60', 20.5, 18.0), -20, '-2.5g decrease in V60 should yield -20 microns');

console.log('✅ Passed Test 1: Micron delta calculations accurate across methods and decimal doses.');

// ============================================================================
// 2. Grinder Adjustments on +5g Filter Dose Increase (15g -> 20g, +40 µm)
// ============================================================================
console.log('Test 2: Grinder scaling for +5g increase in filter (15g -> 20g)');

// Femobook A2: 18 µm/click -> +40 µm / 18 = 2.22 -> +2 clicks (68 -> 70)
const femoAdj = scaleGrinderSettingForDose('femobook', 68, 15, 20, 'V60 (Filtrado)');
assert.equal(femoAdj.newVal, 70, 'Femobook should scale from 68 to 70 clicks');
assert.equal(femoAdj.delta, 2, 'Femobook delta should be +2');
assert.equal(femoAdj.direction, 'coarser', 'Direction should be coarser');

// 1Zpresso J-Max: 8.8 µm/click -> +40 µm / 8.8 = 4.55 -> +5 clicks
const jmaxAdj = scaleGrinderSettingForDose('jmax', { rot: 2, num: 2, click: 0 }, 15, 20, 'V60 (Filtrado)');
assert.deepEqual(jmaxAdj.newVal, { rot: 2, num: 2, click: 5 }, 'J-Max should scale +5 clicks (2.2.0 -> 2.2.5)');
assert.equal(jmaxAdj.delta, 5, 'J-Max delta should be +5');
assert.equal(jmaxAdj.direction, 'coarser', 'Direction should be coarser');

// J-Max Digit Rollover (click + delta >= 10, e.g. 2.2.8 + 5 clicks -> 2.3.3)
const jmaxRollUp = scaleGrinderSettingForDose('jmax', { rot: 2, num: 2, click: 8 }, 15, 20, 'V60 (Filtrado)');
assert.deepEqual(jmaxRollUp.newVal, { rot: 2, num: 3, click: 3 }, 'J-Max should carry over clicks to number (2.2.8 + 5 -> 2.3.3)');

// 1Zpresso K-Ultra: 20 µm/click (0.1 dial) -> +40 µm / 20 = 2 clicks -> +0.2 dial (8.0 -> 8.2)
const kUltraAdj = scaleGrinderSettingForDose('k_ultra', 8.0, 15, 20, 'V60 (Filtrado)');
assert.equal(Number(kUltraAdj.newVal.toFixed(1)), 8.2, 'K-Ultra should scale from 8.0 to 8.2 dial');
assert.equal(Number(kUltraAdj.delta.toFixed(1)), 0.2, 'K-Ultra delta should be +0.2');
assert.equal(kUltraAdj.direction, 'coarser', 'Direction should be coarser');

// Fellow Ode Gen 2: 35 µm/division -> +40 µm / 35 = 1.14 clicks -> +0.1 or +0.2 dial (4.2 -> 4.3 or 4.4)
const odeAdj = scaleGrinderSettingForDose('ode_gen2', 4.2, 15, 20, 'V60 (Filtrado)');
assert.ok([4.3, 4.4].includes(Number(odeAdj.newVal.toFixed(1))), `Ode Gen 2 should scale to 4.3 or 4.4, got ${odeAdj.newVal}`);
assert.equal(odeAdj.direction, 'coarser', 'Direction should be coarser');

// Comandante C40: 30 µm/click -> +40 µm / 30 = 1.33 -> +1 click (23 -> 24)
const comAdj = scaleGrinderSettingForDose('comandante', 23, 15, 20, 'V60 (Filtrado)');
assert.equal(comAdj.newVal, 24, 'Comandante should scale from 23 to 24 clicks');
assert.equal(comAdj.delta, 1, 'Comandante delta should be +1');
assert.equal(comAdj.direction, 'coarser', 'Direction should be coarser');

// Kingrinder K6: 16 µm/click -> +40 µm / 16 = 2.5 -> +3 clicks (92 -> 95)
const kingAdj = scaleGrinderSettingForDose('kingrinder', 92, 15, 20, 'V60 (Filtrado)');
assert.equal(kingAdj.newVal, 95, 'Kingrinder should scale from 92 to 95 clicks');
assert.equal(kingAdj.delta, 3, 'Kingrinder delta should be +3');
assert.equal(kingAdj.direction, 'coarser', 'Direction should be coarser');

// Timemore C2/C3: 28 µm/click -> +40 µm / 28 = 1.43 -> +1 click (17 -> 18)
const timeAdj = scaleGrinderSettingForDose('timemore', 17, 15, 20, 'V60 (Filtrado)');
assert.equal(timeAdj.newVal, 18, 'Timemore should scale from 17 to 18 clicks');
assert.equal(timeAdj.delta, 1, 'Timemore delta should be +1');
assert.equal(timeAdj.direction, 'coarser', 'Direction should be coarser');

// Baratza Encore/ESP: 35 µm/step -> +40 µm / 35 = 1.14 -> +1 step (15 -> 16)
const barAdj = scaleGrinderSettingForDose('baratza', 15, 15, 20, 'V60 (Filtrado)');
assert.equal(barAdj.newVal, 16, 'Baratza should scale from 15 to 16 steps');
assert.equal(barAdj.delta, 1, 'Baratza delta should be +1');
assert.equal(barAdj.direction, 'coarser', 'Direction should be coarser');

console.log('✅ Passed Test 2: Grinder scaling for +5g filter increase verified across all 8 grinders.');

// ============================================================================
// 3. Scaling Down for -3g Decrease in V60 (15g -> 12g, -24 µm)
// ============================================================================
console.log('Test 3: Grinder scaling for -3g decrease in filter (15g -> 12g)');

// Femobook A2: -24 µm / 18 = -1.33 -> -1 click (68 -> 67)
const femoDown = scaleGrinderSettingForDose('femobook', 68, 15, 12, 'V60 (Filtrado)');
assert.equal(femoDown.newVal, 67, 'Femobook should scale down by 1 click for -3g (68 -> 67)');
assert.equal(femoDown.delta, -1, 'Femobook delta should be -1');
assert.equal(femoDown.direction, 'finer', 'Direction should be finer');

// J-Max Borrow Underflow across digits on negative deltas:
// -24 µm / 8.8 = -2.73 -> -3 clicks from 2.0.2 (total clicks: 2*90 + 0*10 + 2 = 182 - 3 = 179 clicks -> 1.8.9)
const jmaxRollDown = scaleGrinderSettingForDose('jmax', { rot: 2, num: 0, click: 2 }, 15, 12, 'V60 (Filtrado)');
assert.deepEqual(jmaxRollDown.newVal, { rot: 1, num: 8, click: 9 }, 'J-Max should borrow across rotations on negative delta (2.0.2 - 3 -> 1.8.9)');

// K-Ultra Float Precision on negative delta (8.0 - 0.1 = 7.9)
const kUltraDown = scaleGrinderSettingForDose('k_ultra', 8.0, 15, 12.5, 'V60 (Filtrado)'); // -2.5g (-20 µm -> -0.1 dial)
assert.equal(kUltraDown.newVal, 7.9, 'K-Ultra should accurately round float on decrement (8.0 -> 7.9)');
assert.equal(kUltraDown.direction, 'finer');

console.log('✅ Passed Test 3: Grinder scaling down & borrow underflows verified.');

// ============================================================================
// 4. Zero Dose Change (15g -> 15g)
// ============================================================================
console.log('Test 4: Zero dose change behavior');

const zeroAdj = scaleGrinderSettingForDose('femobook', 68, 15, 15, 'V60');
assert.equal(zeroAdj.newVal, 68, 'New value should equal current value');
assert.equal(zeroAdj.delta, 0, 'Delta should be 0');
assert.equal(zeroAdj.deltaMicrons, 0, 'Delta microns should be 0');
assert.equal(zeroAdj.direction, 'same', 'Direction should be same');

console.log('✅ Passed Test 4: Zero dose change handled cleanly.');

// ============================================================================
// 5. Boundary Clamping to Min/Max of Each Grinder
// ============================================================================
console.log('Test 5: Boundary clamping for all grinders');

// Femobook: min 4, max 120
const femoMax = scaleGrinderSettingForDose('femobook', 120, 15, 30, 'V60'); // +15g (+120 µm -> +7 clicks)
assert.equal(femoMax.newVal, 120, 'Femobook must clamp at max (120)');

const femoMin = scaleGrinderSettingForDose('femobook', 4, 15, 5, 'V60'); // -10g (-80 µm -> -4 clicks)
assert.equal(femoMin.newVal, 4, 'Femobook must clamp at min (4)');

// J-Max: min 0.0.0 (0 clicks), max 4.0.0 (360 clicks)
const jmaxMin = scaleGrinderSettingForDose('jmax', { rot: 0, num: 0, click: 1 }, 15, 5, 'V60');
assert.deepEqual(jmaxMin.newVal, { rot: 0, num: 0, click: 0 }, 'J-Max must clamp at 0.0.0 minimum');

// K-Ultra: min 2.0, max 13.0
const kUltraMax = scaleGrinderSettingForDose('k_ultra', 12.9, 15, 30, 'V60');
assert.equal(kUltraMax.newVal, 13.0, 'K-Ultra must clamp exactly at max 13.0');

const kUltraMin = scaleGrinderSettingForDose('k_ultra', 2.1, 15, 5, 'V60');
assert.equal(kUltraMin.newVal, 2.0, 'K-Ultra must clamp exactly at min 2.0');

// Ode Gen 2: min 1.0, max 11.0
const odeMax = scaleGrinderSettingForDose('ode_gen2', 10.9, 15, 30, 'V60');
assert.equal(odeMax.newVal, 11.0, 'Ode Gen 2 must clamp exactly at max 11.0');

const odeMin = scaleGrinderSettingForDose('ode_gen2', 1.1, 15, 5, 'V60');
assert.equal(odeMin.newVal, 1.0, 'Ode Gen 2 must clamp exactly at min 1.0');

// Comandante: min 6, max 45
const comMax = scaleGrinderSettingForDose('comandante', 45, 15, 30, 'V60');
assert.equal(comMax.newVal, 45, 'Comandante must clamp at max 45');

const comMin = scaleGrinderSettingForDose('comandante', 6, 15, 5, 'V60');
assert.equal(comMin.newVal, 6, 'Comandante must clamp at min 6');

// Kingrinder: min 12, max 180
const kingMax = scaleGrinderSettingForDose('kingrinder', 180, 15, 30, 'V60');
assert.equal(kingMax.newVal, 180, 'Kingrinder must clamp at max 180');

const kingMin = scaleGrinderSettingForDose('kingrinder', 12, 15, 5, 'V60');
assert.equal(kingMin.newVal, 12, 'Kingrinder must clamp at min 12');

// Timemore: min 6, max 36
const timeMax = scaleGrinderSettingForDose('timemore', 36, 15, 30, 'V60');
assert.equal(timeMax.newVal, 36, 'Timemore must clamp at max 36');

const timeMin = scaleGrinderSettingForDose('timemore', 6, 15, 5, 'V60');
assert.equal(timeMin.newVal, 6, 'Timemore must clamp at min 6');

// Baratza: min 1, max 40
const barMax = scaleGrinderSettingForDose('baratza', 40, 15, 30, 'V60');
assert.equal(barMax.newVal, 40, 'Baratza must clamp at max 40');

const barMin = scaleGrinderSettingForDose('baratza', 1, 15, 5, 'V60');
assert.equal(barMin.newVal, 1, 'Baratza must clamp at min 1');

console.log('✅ Passed Test 5: Boundary clamping verified across all 8 grinders.');

// ============================================================================
// 6. Backend computeOfflineRecipe Physical Bed Depth Compensation
// ============================================================================
console.log('Test 6: Backend computeOfflineRecipe Physical Bed Depth Compensation');

// Compare V60 at 15g vs V60 at 20g
const recipe15g = computeOfflineRecipe({
  origin: 'Colombia Huila',
  roast_level: 'Medio',
  method: 'V60 (Filtrado)',
  dose_in_g: 15
});

const recipe20g = computeOfflineRecipe({
  origin: 'Colombia Huila',
  roast_level: 'Medio',
  method: 'V60 (Filtrado)',
  dose_in_g: 20
});

const m15 = parseInt(recipe15g.grind_microns, 10);
const m20 = parseInt(recipe20g.grind_microns, 10);
assert.equal(m20 - m15, 40, `Increasing V60 dose by +5g should add exactly +40 microns in offline engine (got ${m15} -> ${m20})`);
assert.ok(recipe20g.notes.includes('Escalado de dosis') || recipe20g.notes.includes('cama de café'), 'Recipe notes should mention dose scaling reason');

// Compare Espresso at 18g vs Espresso at 20g
const esp18 = computeOfflineRecipe({
  origin: 'Colombia Huila',
  roast_level: 'Medio',
  method: 'Espresso',
  dose_in_g: 18
});

const esp20 = computeOfflineRecipe({
  origin: 'Colombia Huila',
  roast_level: 'Medio',
  method: 'Espresso',
  dose_in_g: 20
});

const espM18 = parseInt(esp18.grind_microns, 10);
const espM20 = parseInt(esp20.grind_microns, 10);
assert.equal(espM20 - espM18, 10, `Increasing Espresso dose by +2g should add exactly +10 microns in offline engine (got ${espM18} -> ${espM20})`);
console.log('✅ Passed Test 6: Backend computeOfflineRecipe physical bed depth scaling verified.');

console.log('\n🎉 ALL DOSE-GRIND SCALING UNIT TESTS PASSED!');
