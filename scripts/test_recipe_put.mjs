import { createRequire } from 'module';
const require = createRequire(new URL('../backend/package.json', import.meta.url));

const { getDb, initDb } = require('./database.js');
const app = require('./server.js');

async function run() {
  await initDb();
  const db = await getDb();

  // Start ephemeral test server
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  let createdBatchId = null;
  let recipeId = null;
  let forbiddenBatchId = null;
  let forbiddenRecipeId = null;

  try {
    // 1. Find or create unowned test batch (user_id IS NULL)
    let testBatch = await db.get('SELECT id, user_id FROM batches WHERE user_id IS NULL LIMIT 1');
    if (!testBatch) {
      createdBatchId = `test-batch-${Date.now()}`;
      await db.run(
        `INSERT INTO batches (id, name, producer, total_doses, remaining_doses, user_id) VALUES (?, 'Test Coffee', 'Test Producer', 10, 10, NULL)`,
        [createdBatchId]
      );
      testBatch = { id: createdBatchId, user_id: null };
    }

    // Insert a test recipe
    const recipeRes = await db.run(
      `INSERT INTO recipes (batch_id, method, ratio, grind, temperature, brew_time, rating, notes, sensory_balance, sensory_body, sensory_extraction, dose_in_g, dose_out_g, user_id)
       VALUES (?, 'V60 (Filtrado)', '1:16', 'J-Max 2.4.0', '93°C', '2:45', 4, 'Original note', 'Equilibrado', 'Sedoso', 'En Punto', 15.0, 240.0, NULL)`,
      [testBatch.id]
    );
    recipeId = recipeRes.lastID;

    console.log(`Created test recipe ID: ${recipeId} for unowned batch ID: ${testBatch.id}`);

    // Update payload
    const updatePayload = {
      method: 'Kalita Wave',
      ratio: '1:15',
      grind: 'J-Max 2.5.0',
      temperature: '92°C',
      brew_time: '3:00',
      rating: 5,
      notes: 'Updated note from test',
      sensory_balance: 'Acidez brillante',
      sensory_body: 'Cremoso',
      sensory_extraction: 'Sobre-extraído',
      dose_in_g: 16.5,
      dose_out_g: 250.0,
      espresso_pressure: 9.0,
      espresso_preinfusion: 4
    };

    console.log(`Sending PUT ${baseUrl}/api/recipes/${recipeId}...`);
    const response = await fetch(`${baseUrl}/api/recipes/${recipeId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ HTTP request failed with status: ${response.status}: ${errorText}`);
      throw new Error(`Endpoint returned status ${response.status}`);
    }

    const data = await response.json();
    if (!data.success || !data.recipe) {
      console.error('❌ Unexpected response JSON structure:', data);
      throw new Error('Response JSON missing success or recipe field');
    }

    // Verify response content
    if (data.recipe.method !== updatePayload.method ||
        data.recipe.notes !== updatePayload.notes ||
        data.recipe.ratio !== updatePayload.ratio ||
        data.recipe.grind !== updatePayload.grind ||
        data.recipe.dose_in_g !== updatePayload.dose_in_g ||
        data.recipe.dose_out_g !== updatePayload.dose_out_g ||
        data.recipe.rating !== updatePayload.rating ||
        data.recipe.sensory_balance !== updatePayload.sensory_balance ||
        data.recipe.sensory_body !== updatePayload.sensory_body ||
        data.recipe.sensory_extraction !== updatePayload.sensory_extraction) {
      console.error('❌ Response recipe does not match updated payload:', data.recipe);
      throw new Error('Response recipe fields mismatch');
    }

    if (!data.recipe.batch_name) {
      console.error('❌ Joined batch_name missing in response recipe:', data.recipe);
      throw new Error('Response missing joined batch details');
    }

    // Verify directly in SQLite DB
    const updatedRow = await db.get('SELECT * FROM recipes WHERE id = ?', [recipeId]);
    if (!updatedRow) {
      throw new Error('Recipe not found in database after update');
    }

    if (updatedRow.method !== updatePayload.method ||
        updatedRow.notes !== updatePayload.notes ||
        updatedRow.ratio !== updatePayload.ratio ||
        updatedRow.grind !== updatePayload.grind ||
        updatedRow.dose_in_g !== updatePayload.dose_in_g ||
        updatedRow.dose_out_g !== updatePayload.dose_out_g ||
        updatedRow.rating !== updatePayload.rating ||
        updatedRow.sensory_balance !== updatePayload.sensory_balance ||
        updatedRow.sensory_body !== updatePayload.sensory_body ||
        updatedRow.sensory_extraction !== updatePayload.sensory_extraction ||
        updatedRow.espresso_pressure !== updatePayload.espresso_pressure ||
        updatedRow.espresso_preinfusion !== updatePayload.espresso_preinfusion) {
      console.error('❌ Database row does not match updated values:', updatedRow);
      throw new Error('Database row values mismatch');
    }

    // Edge case 1: Missing method returns 400
    const resNoMethod = await fetch(`${baseUrl}/api/recipes/${recipeId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ratio: '1:16' })
    });
    if (resNoMethod.status !== 400) {
      throw new Error(`Expected 400 for missing method, got ${resNoMethod.status}`);
    }

    // Edge case 2: Non-existent recipe returns 404
    const resNotFound = await fetch(`${baseUrl}/api/recipes/9999999`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'Aeropress' })
    });
    if (resNotFound.status !== 404) {
      throw new Error(`Expected 404 for non-existent recipe, got ${resNotFound.status}`);
    }

    // Edge case 3: rating = 0 (unrated recipe) should sanitize to null and avoid SQLite CHECK constraint failure
    console.log('Testing rating: 0 sanitization (avoiding CHECK constraint violation)...');
    const resZeroRating = await fetch(`${baseUrl}/api/recipes/${recipeId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'V60 (Filtrado)',
        rating: 0
      })
    });
    if (!resZeroRating.ok) {
      const errTxt = await resZeroRating.text();
      throw new Error(`Expected rating: 0 to succeed, but got ${resZeroRating.status}: ${errTxt}`);
    }
    const zeroRatingData = await resZeroRating.json();
    if (zeroRatingData.recipe.rating !== null) {
      throw new Error(`Expected recipe rating to be null for rating: 0, got ${zeroRatingData.recipe.rating}`);
    }
    const dbRowZero = await db.get('SELECT rating FROM recipes WHERE id = ?', [recipeId]);
    if (dbRowZero.rating !== null) {
      throw new Error(`Expected database row rating to be null for rating: 0, got ${dbRowZero.rating}`);
    }

    // Edge case 4: 403 Forbidden when batch belongs to another user and request is unauthenticated
    console.log('Testing 403 Forbidden for owned batch recipe without auth...');
    forbiddenBatchId = `forbidden-batch-${Date.now()}`;
    await db.run(
      `INSERT INTO batches (id, name, producer, total_doses, remaining_doses, user_id) VALUES (?, 'Private Coffee', 'Private Producer', 10, 10, 99999)`,
      [forbiddenBatchId]
    );
    const forbiddenRecipeRes = await db.run(
      `INSERT INTO recipes (batch_id, method, ratio, user_id) VALUES (?, 'Espresso', '1:2', 99999)`,
      [forbiddenBatchId]
    );
    forbiddenRecipeId = forbiddenRecipeRes.lastID;

    const resForbidden = await fetch(`${baseUrl}/api/recipes/${forbiddenRecipeId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'Espresso',
        notes: 'Hacked note'
      })
    });
    if (resForbidden.status !== 403) {
      throw new Error(`Expected 403 for unauthorized edit on owned batch, got ${resForbidden.status}`);
    }

    console.log('✅ PUT /api/recipes/:id test passed successfully (including rating: 0 and 403 checks)');
  } finally {
    // Cleanup
    if (recipeId) {
      await db.run('DELETE FROM recipes WHERE id = ?', [recipeId]);
      console.log(`Cleaned up test recipe ID: ${recipeId}`);
    }
    if (createdBatchId) {
      await db.run('DELETE FROM batches WHERE id = ?', [createdBatchId]);
      console.log(`Cleaned up test batch ID: ${createdBatchId}`);
    }
    if (forbiddenRecipeId) {
      await db.run('DELETE FROM recipes WHERE id = ?', [forbiddenRecipeId]);
      console.log(`Cleaned up forbidden test recipe ID: ${forbiddenRecipeId}`);
    }
    if (forbiddenBatchId) {
      await db.run('DELETE FROM batches WHERE id = ?', [forbiddenBatchId]);
      console.log(`Cleaned up forbidden test batch ID: ${forbiddenBatchId}`);
    }
    server.close();
  }
}

run().catch(err => {
  console.error('Test execution failed:', err.message);
  process.exit(1);
});
