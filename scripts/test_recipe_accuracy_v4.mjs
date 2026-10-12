import assert from 'node:assert/strict';
import {
  computeOfflineRecipe,
  micronsToJMax,
  micronsToKUltra,
  micronsToOdeGen2,
  micronsToComandante,
  micronsToFemobook,
  micronsToKingrinder,
  micronsToTimemore,
  micronsToBaratza
} from '../backend/aiEngine.js';
import { FAMOUS_RECIPES } from '../frontend/src/utils/famousRecipes.js';

console.log('🧪 Running BeanTag v4 Recipe Normalization & 8-Grinder Calibration Test Suite...\n');

// ---------------------------------------------------------------------------
// Test 1: Math pour consistency (sum of pour water === water_total_g)
// ---------------------------------------------------------------------------
console.log('Test 1: Math pour consistency across brewing methods');
const methodsToTest = [
  'V60 (Filtrado)',
  'NextLevel Pulsar Mini',
  'AeroPress',
  'AeroPress Go',
  'Prensa Francesa',
  'Espresso'
];

for (const method of methodsToTest) {
  const recipe = computeOfflineRecipe({ method, dose_in_g: 15 });
  assert.ok(recipe, `Recipe for ${method} must be generated`);
  assert.ok(Array.isArray(recipe.pours) && recipe.pours.length > 0, `Recipe for ${method} must have pours`);

  const sumPours = recipe.pours.reduce((sum, p) => sum + (Number(p.water_g) || 0), 0);
  assert.strictEqual(
    sumPours,
    recipe.water_total_g,
    `Pour water sum (${sumPours}g) must equal water_total_g (${recipe.water_total_g}g) for method '${method}'`
  );
  console.log(`  ✓ ${method}: ${recipe.pours.length} pours sum to ${sumPours}g === water_total_g (${recipe.water_total_g}g)`);
}
console.log('✅ Test 1 Passed: Math pour consistency holds for all 6 methods.\n');

// ---------------------------------------------------------------------------
// Test 2: Physical safeguards
// ---------------------------------------------------------------------------
console.log('Test 2: Physical safeguards (Pulsar Mini, AeroPress Go, Espresso Ode Gen 2)');

// Safeguard 2A: Pulsar Mini grind >= 740 µm
const pulsarRecipe = computeOfflineRecipe({ method: 'NextLevel Pulsar Mini', dose_in_g: 15 });
const pulsarMicrons = parseInt(pulsarRecipe.grind_microns, 10);
assert.ok(
  pulsarMicrons >= 740,
  `Pulsar Mini grind must be >= 740 µm to prevent no-bypass filter clogging, got ${pulsarMicrons} µm`
);

// Safeguard 2B: Pulsar Mini 3 valve phases (closed, half, open)
assert.strictEqual(pulsarRecipe.pours.length, 3, 'Pulsar Mini recipe must define 3 pour stages');
const valvePhases = pulsarRecipe.pours.map(p => p.valve);
assert.deepStrictEqual(
  valvePhases,
  ['closed', 'half', 'open'],
  `Pulsar Mini pours must have 3 valve phases: closed, half, open; got ${JSON.stringify(valvePhases)}`
);
console.log(`  ✓ Pulsar Mini safeguards verified: grind=${pulsarMicrons}µm (>= 740µm), valves=${valvePhases.join(' -> ')}`);

// Safeguard 2C: AeroPress Go water <= 215g (compact chamber limit)
const apGoDefault = computeOfflineRecipe({ method: 'AeroPress Go', dose_in_g: 14 });
assert.ok(
  apGoDefault.water_total_g <= 215,
  `AeroPress Go default water must be <= 215g, got ${apGoDefault.water_total_g}g`
);

const apGoHighDose = computeOfflineRecipe({ method: 'AeroPress Go', dose_in_g: 22 });
assert.ok(
  apGoHighDose.water_total_g <= 215,
  `AeroPress Go high-dose water must be clamped to <= 215g, got ${apGoHighDose.water_total_g}g`
);
console.log(`  ✓ AeroPress Go chamber limits verified: default=${apGoDefault.water_total_g}g, high-dose=${apGoHighDose.water_total_g}g (both <= 215g)`);

// Safeguard 2D: Espresso Ode Gen 2 === 'No apto para espresso'
const espressoRecipe = computeOfflineRecipe({ method: 'Espresso', dose_in_g: 18 });
assert.strictEqual(
  espressoRecipe.grinders.ode_gen2,
  'No apto para espresso',
  `Espresso recipe Ode Gen 2 grinder must indicate 'No apto para espresso'`
);
assert.strictEqual(
  micronsToOdeGen2(260),
  'No apto para espresso',
  `micronsToOdeGen2(260) function must return 'No apto para espresso'`
);
console.log(`  ✓ Fellow Ode Gen 2 espresso safety verified: '${espressoRecipe.grinders.ode_gen2}'`);
console.log('✅ Test 2 Passed: Physical safeguards verified.\n');

// ---------------------------------------------------------------------------
// Test 3: All 8 grinders present in sample recipe
// ---------------------------------------------------------------------------
console.log('Test 3: All 8 grinders present in sample recipe');
const sampleRecipe = computeOfflineRecipe({ method: 'V60 (Filtrado)', dose_in_g: 15 });
assert.ok(sampleRecipe.grinders, 'Recipe must contain grinders object');

const expectedBackendGrinders = [
  'jmax',
  'k_ultra',
  'ode_gen2',
  'comandante',
  'femobook_a2',
  'kingrinder_k6',
  'timemore',
  'baratza'
];

for (const grinderKey of expectedBackendGrinders) {
  assert.ok(
    sampleRecipe.grinders[grinderKey],
    `Sample recipe grinders must contain key '${grinderKey}'`
  );
  assert.strictEqual(
    typeof sampleRecipe.grinders[grinderKey],
    'string',
    `Grinder '${grinderKey}' setting must be a string`
  );
  assert.ok(
    sampleRecipe.grinders[grinderKey].trim().length > 0,
    `Grinder '${grinderKey}' setting must not be empty`
  );
  console.log(`  ✓ Grinder '${grinderKey}': "${sampleRecipe.grinders[grinderKey]}"`);
}

// Verify standalone calibration functions for all 8 grinders
assert.ok(micronsToJMax(720).display, 'micronsToJMax must return valid display');
assert.ok(micronsToKUltra(720), 'micronsToKUltra must return valid string');
assert.ok(micronsToOdeGen2(720), 'micronsToOdeGen2 must return valid string');
assert.ok(micronsToComandante(720), 'micronsToComandante must return valid string');
assert.ok(micronsToFemobook(720), 'micronsToFemobook must return valid string');
assert.ok(micronsToKingrinder(720), 'micronsToKingrinder must return valid string');
assert.ok(micronsToTimemore(720), 'micronsToTimemore must return valid string');
assert.ok(micronsToBaratza(720), 'micronsToBaratza must return valid string');
console.log('✅ Test 3 Passed: All 8 grinders present and calibrated in sample recipe.\n');

// ---------------------------------------------------------------------------
// Test 4: Famous recipes include all 8 grinder settings
// ---------------------------------------------------------------------------
console.log('Test 4: Famous recipes include all 8 grinder settings');
assert.ok(Array.isArray(FAMOUS_RECIPES) && FAMOUS_RECIPES.length > 0, 'FAMOUS_RECIPES must not be empty');

const expectedFamousGrinders = [
  'jmax',
  'femobook',
  'k_ultra',
  'ode_gen2',
  'comandante',
  'kingrinder',
  'timemore',
  'baratza'
];

for (const fam of FAMOUS_RECIPES) {
  assert.ok(
    typeof fam.grindMicrons === 'number' && fam.grindMicrons > 0,
    `Famous recipe '${fam.id}' (${fam.name}) must define numeric grindMicrons, got: ${fam.grindMicrons}`
  );
  assert.ok(
    fam.grinderSettings && typeof fam.grinderSettings === 'object',
    `Famous recipe '${fam.id}' must define grinderSettings object`
  );

  for (const g of expectedFamousGrinders) {
    assert.ok(
      fam.grinderSettings[g],
      `Famous recipe '${fam.id}' (${fam.name}) is missing grinder setting for '${g}'`
    );
    assert.ok(
      fam.grinderSettings[g].text && typeof fam.grinderSettings[g].text === 'string',
      `Famous recipe '${fam.id}' grinder '${g}' must have a valid text property`
    );
  }
  console.log(`  ✓ Famous recipe '${fam.id}' (${fam.name}) verified for all 8 grinders.`);
}

console.log('✅ Test 4 Passed: All famous recipes calibrated for 8 grinders.\n');
console.log('🎉 ALL TESTS PASSED SUCCESSFULLY!');
