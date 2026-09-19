import assert from 'node:assert/strict';
import { FAMOUS_RECIPES } from '../frontend/src/utils/famousRecipes.js';

console.log('🧪 Running NextLevel Pulsar Mini recipes test...');

try {
  // 1. Filter recipes by method 'NextLevel Pulsar Mini'
  const pulsarRecipes = FAMOUS_RECIPES.filter(r => r.method === 'NextLevel Pulsar Mini');
  assert.equal(
    pulsarRecipes.length,
    3,
    `Expected exactly 3 NextLevel Pulsar Mini recipes, but found ${pulsarRecipes.length}`
  );

  // 2. Target recipes definitions to check
  const expectedRecipes = {
    'scott-rao-pulsar-mini': { defaultDose: 15, ratioVal: 16.6, temperature: 94 },
    'gagne-high-extraction-mini': { defaultDose: 15, ratioVal: 17, temperature: 96 },
    'pulsar-mini-concentrate': { defaultDose: 18, ratioVal: 14, temperature: 92 }
  };

  const allowedValveStates = new Set(['closed', 'open', 'half']);

  for (const [id, expected] of Object.entries(expectedRecipes)) {
    const recipe = pulsarRecipes.find(r => r.id === id);
    assert.ok(recipe, `Recipe with id "${id}" was not found`);

    assert.equal(recipe.defaultDose, expected.defaultDose, `[${id}] defaultDose should be ${expected.defaultDose}`);
    assert.equal(recipe.ratioVal, expected.ratioVal, `[${id}] ratioVal should be ${expected.ratioVal}`);
    assert.equal(recipe.temperature, expected.temperature, `[${id}] temperature should be ${expected.temperature}`);

    // Check grinder settings
    assert.ok(recipe.grinderSettings, `[${id}] grinderSettings is missing`);
    const { jmax, comandante, femobook } = recipe.grinderSettings;

    assert.ok(jmax && typeof jmax.text === 'string' && jmax.text.length > 0, `[${id}] jmax setting text missing`);
    assert.ok(typeof jmax.rot === 'number' && typeof jmax.num === 'number' && typeof jmax.click === 'number', `[${id}] jmax rot/num/click values missing`);

    assert.ok(comandante && typeof comandante.text === 'string' && comandante.text.length > 0, `[${id}] comandante setting text missing`);
    assert.ok(typeof comandante.clicks === 'number', `[${id}] comandante clicks missing`);

    assert.ok(femobook && typeof femobook.text === 'string' && femobook.text.length > 0, `[${id}] femobook setting text missing`);
    assert.ok(typeof femobook.clicks === 'number', `[${id}] femobook clicks missing`);

    // Check calculatePours
    assert.equal(typeof recipe.calculatePours, 'function', `[${id}] calculatePours must be a function`);
    const pours = recipe.calculatePours(recipe.defaultDose);
    assert.ok(Array.isArray(pours) && pours.length > 0, `[${id}] calculatePours must return non-empty array`);

    const valveStatesFound = new Set();

    pours.forEach((p, idx) => {
      assert.equal(typeof p.step, 'number', `[${id} - step ${idx + 1}] step property missing or not a number`);
      assert.ok(typeof p.label === 'string' && p.label.length > 0, `[${id} - step ${idx + 1}] label missing`);
      assert.ok(typeof p.water_g === 'number', `[${id} - step ${idx + 1}] water_g missing`);
      assert.ok(typeof p.total_water_g === 'number', `[${id} - step ${idx + 1}] total_water_g missing`);
      assert.ok(typeof p.time === 'string' && p.time.length > 0, `[${id} - step ${idx + 1}] time missing`);
      assert.ok(typeof p.description === 'string' && p.description.length > 0, `[${id} - step ${idx + 1}] description missing`);
      assert.ok(
        allowedValveStates.has(p.valve),
        `[${id} - step ${idx + 1}] invalid valve state: "${p.valve}". Allowed: closed, open, half`
      );

      valveStatesFound.add(p.valve);
    });

    assert.ok(valveStatesFound.has('closed'), `[${id}] Must include 'closed' valve state`);
    assert.ok(valveStatesFound.has('open'), `[${id}] Must include 'open' valve state`);
  }

  console.log('✅ NextLevel Pulsar Mini recipes verified successfully!');
  process.exit(0);
} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}
