import assert from 'assert';
import { computeSensoryCorrection } from '../frontend/src/utils/sensoryTuner.js';

console.log('🧪 Running Sensory Correction Engine Unit Tests...\n');

// 1. Sub-extraction feedback on Femobook A2
console.log('Test 1: Sub-extraction feedback on Femobook A2');
const subRes = computeSensoryCorrection(
  'femobook',
  '68 clics (~1.7 Rot.)',
  93,
  { taste: 'sour', flow: 'fast', body: 'thin' }
);

assert.strictEqual(subRes.diagnosis, 'sub-extracted', 'Diagnosis should be sub-extracted');
assert.strictEqual(subRes.rating, 3, 'Rating should be 3 for sub-extraction');
assert.strictEqual(subRes.clickDelta, -2, 'Should recommend closing grind by 2 clicks (-2)');
assert.strictEqual(subRes.newGrindText, '66 clics (~1.7 Rot.)', 'Should format new grind as 66 clics (~1.7 Rot.)');
assert.strictEqual(subRes.tempDelta, 1, 'Temperature delta should be +1°C');
assert.strictEqual(subRes.newTemp, 94, 'New temperature should be 94°C');
assert.ok(subRes.explanation && subRes.explanation.length > 10, 'Should include explanation');
console.log('✅ Passed Test 1: Sub-extraction recommendation correct.\n');

// 2. Over-extraction feedback on Femobook A2
console.log('Test 2: Over-extraction feedback on Femobook A2');
const overRes = computeSensoryCorrection(
  'femobook',
  '68 clics (~1.7 Rot.)',
  93,
  { taste: 'bitter', flow: 'slow', body: 'astringent' }
);

assert.strictEqual(overRes.diagnosis, 'over-extracted', 'Diagnosis should be over-extracted');
assert.strictEqual(overRes.rating, 3, 'Rating should be 3 for over-extraction');
assert.strictEqual(overRes.clickDelta, 2, 'Should recommend opening grind by 2 clicks (+2)');
assert.strictEqual(overRes.newGrindText, '70 clics (~1.8 Rot.)', 'Should format new grind as 70 clics (~1.8 Rot.)');
assert.strictEqual(overRes.tempDelta, -1, 'Temperature delta should be -1°C');
assert.strictEqual(overRes.newTemp, 92, 'New temperature should be 92°C');
assert.ok(overRes.explanation && overRes.explanation.length > 10, 'Should include explanation');
console.log('✅ Passed Test 2: Over-extraction recommendation correct.\n');

// 3. Perfect extraction feedback
console.log('Test 3: Perfect extraction feedback');
const perfectRes = computeSensoryCorrection(
  'femobook',
  '68 clics (~1.7 Rot.)',
  93,
  { taste: 'balanced', flow: 'on_time', body: 'balanced' }
);

assert.strictEqual(perfectRes.diagnosis, 'balanced', 'Diagnosis should be balanced');
assert.strictEqual(perfectRes.rating, 5, 'Rating should be 5 for balanced extraction');
assert.strictEqual(perfectRes.clickDelta, 0, 'Click delta should be 0');
assert.strictEqual(perfectRes.tempDelta, 0, 'Temp delta should be 0');
assert.strictEqual(perfectRes.newGrindText, '68 clics (~1.7 Rot.)', 'Grind should remain unchanged');
assert.strictEqual(perfectRes.newTemp, 93, 'Temperature should remain 93°C');
assert.ok(perfectRes.explanation && perfectRes.explanation.length > 10, 'Should include explanation');
console.log('✅ Passed Test 3: Perfect extraction recommendation correct.\n');

// 4. Verification across all 8 grinders
console.log('Test 4: Verification across all 8 grinders');

// Femobook: 68 clics -> 70 clics on bitter, 66 clics on sour
const femoBitter = computeSensoryCorrection('femobook', '68 clics (~1.7 Rot.)', 93, { taste: 'bitter' });
assert.strictEqual(femoBitter.newGrindText, '70 clics (~1.8 Rot.)');
assert.strictEqual(femoBitter.clickDelta, 2);
const femoSour = computeSensoryCorrection('femobook', '68 clics (~1.7 Rot.)', 93, { taste: 'sour' });
assert.strictEqual(femoSour.newGrindText, '66 clics (~1.7 Rot.)');
assert.strictEqual(femoSour.clickDelta, -2);
console.log('  ✓ femobook: 68 -> 70 (bitter), 68 -> 66 (sour)');

// J-Max: 2.4.2 -> 2.5.2 on bitter; 2.4.2 -> 2.3.2 on sour
const jmaxBitter = computeSensoryCorrection('jmax', '2.4.2', 93, { taste: 'bitter' });
assert.strictEqual(jmaxBitter.newGrindText, '2.5.2');
assert.strictEqual(jmaxBitter.clickDelta, 10);
const jmaxSour = computeSensoryCorrection('jmax', '2.4.2', 93, { taste: 'sour' });
assert.strictEqual(jmaxSour.newGrindText, '2.3.2');
assert.strictEqual(jmaxSour.clickDelta, -10);
console.log('  ✓ jmax: 2.4.2 -> 2.5.2 (bitter), 2.4.2 -> 2.3.2 (sour)');

// K-Ultra: 8.0 -> 8.2 on bitter; 8.0 -> 7.8 on sour
const kUltraBitter = computeSensoryCorrection('k_ultra', '8.0', 93, { taste: 'bitter' });
assert.strictEqual(kUltraBitter.newGrindText, '8.2');
assert.strictEqual(kUltraBitter.clickDelta, 2);
const kUltraSour = computeSensoryCorrection('k_ultra', '8.0', 93, { taste: 'sour' });
assert.strictEqual(kUltraSour.newGrindText, '7.8');
assert.strictEqual(kUltraSour.clickDelta, -2);
console.log('  ✓ k_ultra: 8.0 -> 8.2 (bitter), 8.0 -> 7.8 (sour)');

// Ode Gen 2: 4.2 -> 4.4 on bitter; 4.2 -> 4.0 on sour
const odeBitter = computeSensoryCorrection('ode_gen2', '4.2', 93, { taste: 'bitter' });
assert.strictEqual(odeBitter.newGrindText, '4.4');
assert.strictEqual(odeBitter.clickDelta, 2);
const odeSour = computeSensoryCorrection('ode_gen2', '4.2', 93, { taste: 'sour' });
assert.strictEqual(odeSour.newGrindText, '4.0');
assert.strictEqual(odeSour.clickDelta, -2);
console.log('  ✓ ode_gen2: 4.2 -> 4.4 (bitter), 4.2 -> 4.0 (sour)');

// Comandante: 23 clics -> 25 clics on bitter; 23 clics -> 21 clics on sour
const comBitter = computeSensoryCorrection('comandante', '23 clics', 93, { taste: 'bitter' });
assert.strictEqual(comBitter.newGrindText, '25 clics');
assert.strictEqual(comBitter.clickDelta, 2);
const comSour = computeSensoryCorrection('comandante', '23 clics', 93, { taste: 'sour' });
assert.strictEqual(comSour.newGrindText, '21 clics');
assert.strictEqual(comSour.clickDelta, -2);
console.log('  ✓ comandante: 23 clics -> 25 clics (bitter), 23 clics -> 21 clics (sour)');

// Kingrinder: 92 clics -> 94 clics on bitter; 92 clics -> 90 clics on sour
const kingBitter = computeSensoryCorrection('kingrinder', '92 clics', 93, { taste: 'bitter' });
assert.strictEqual(kingBitter.newGrindText, '94 clics');
assert.strictEqual(kingBitter.clickDelta, 2);
const kingSour = computeSensoryCorrection('kingrinder', '92 clics', 93, { taste: 'sour' });
assert.strictEqual(kingSour.newGrindText, '90 clics');
assert.strictEqual(kingSour.clickDelta, -2);
console.log('  ✓ kingrinder: 92 clics -> 94 clics (bitter), 92 clics -> 90 clics (sour)');

// Timemore: 17 clics -> 19 clics on bitter; 17 clics -> 15 clics on sour
const timeBitter = computeSensoryCorrection('timemore', '17 clics', 93, { taste: 'bitter' });
assert.strictEqual(timeBitter.newGrindText, '19 clics');
assert.strictEqual(timeBitter.clickDelta, 2);
const timeSour = computeSensoryCorrection('timemore', '17 clics', 93, { taste: 'sour' });
assert.strictEqual(timeSour.newGrindText, '15 clics');
assert.strictEqual(timeSour.clickDelta, -2);
console.log('  ✓ timemore: 17 clics -> 19 clics (bitter), 17 clics -> 15 clics (sour)');

// Baratza: 15 -> 16 on bitter; 15 -> 14 on sour
const barBitter = computeSensoryCorrection('baratza', '15', 93, { taste: 'bitter' });
assert.strictEqual(barBitter.newGrindText, '16');
assert.strictEqual(barBitter.clickDelta, 1);
const barSour = computeSensoryCorrection('baratza', '15', 93, { taste: 'sour' });
assert.strictEqual(barSour.newGrindText, '14');
assert.strictEqual(barSour.clickDelta, -1);
console.log('  ✓ baratza: 15 -> 16 (bitter), 15 -> 14 (sour)');

// Additional check: formatted strings with full grinder prefixes
console.log('\nTest 4b: Verify preservation of formatted strings with full grinder labels');
const jmaxFormatted = computeSensoryCorrection('jmax', 'J-Max: 2.4.2', 93, { taste: 'bitter' });
assert.strictEqual(jmaxFormatted.newGrindText, 'J-Max: 2.5.2');

const femoFormatted = computeSensoryCorrection('femobook', 'Femobook A2: 68 clics (~1.7 Rot.)', 93, { taste: 'sour' });
assert.strictEqual(femoFormatted.newGrindText, 'Femobook A2: 66 clics (~1.7 Rot.)');

const odeFormatted = computeSensoryCorrection('ode_gen2', 'Fellow Ode Gen 2: Ajuste 4.2', 93, { taste: 'bitter' });
assert.strictEqual(odeFormatted.newGrindText, 'Fellow Ode Gen 2: Ajuste 4.4');

const baratzaFormatted = computeSensoryCorrection('baratza', 'Baratza: Ajuste 15', 93, { taste: 'sour' });
assert.strictEqual(baratzaFormatted.newGrindText, 'Baratza: Ajuste 14');

console.log('✅ Passed Test 4: All 8 grinders correctly calibrated.\n');

// 5. Verification of boundary clamping, safe parsing, and null feedback
console.log('Test 5: Boundary clamping, safe decimal parsing, and null feedback guard');

// Temp at 96°C on sub-extraction remains at 96°C (effectiveTempDelta === 0)
const maxTempRes = computeSensoryCorrection('femobook', '68 clics (~1.7 Rot.)', 96, { taste: 'sour' });
assert.strictEqual(maxTempRes.newTemp, 96, 'Temperature should clamp at 96°C');
assert.strictEqual(maxTempRes.tempDelta, 0, 'effectiveTempDelta should be 0 when at max ceiling');

// Decimal temp string "93.5°C" parses as 94°C
const decimalTempRes = computeSensoryCorrection('femobook', '68 clics (~1.7 Rot.)', '93.5°C', { taste: 'balanced' });
assert.strictEqual(decimalTempRes.newTemp, 94, 'Decimal temp 93.5°C should round to 94°C');

// Grinder at min boundary (Comandante at 6 clicks on sour) does not drop below 6 and reports clickDelta === 0
const minComandante = computeSensoryCorrection('comandante', '6 clics', 93, { taste: 'sour' });
assert.strictEqual(minComandante.newGrindText, '6 clics', 'Comandante at min 6 clicks should remain at 6');
assert.strictEqual(minComandante.clickDelta, 0, 'clickDelta should be 0 when clamped at min boundary');

// computeSensoryCorrection(..., null) handles null safely without throwing
const nullFbRes = computeSensoryCorrection('femobook', '68 clics (~1.7 Rot.)', 93, null);
assert.strictEqual(nullFbRes.diagnosis, 'balanced', 'Null feedback should safely default to balanced');
assert.strictEqual(nullFbRes.rating, 5, 'Null feedback rating should default to 5');
assert.strictEqual(nullFbRes.clickDelta, 0, 'Null feedback clickDelta should be 0');

console.log('✅ Passed Test 5: Boundary clamping and safe null guard verified.\n');

console.log('🎉 ALL SENSORY TUNER TESTS PASSED SUCCESSFULLY!');
