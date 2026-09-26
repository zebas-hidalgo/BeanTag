import assert from 'assert';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { initDb, getDb } = require('../backend/database.js');

console.log('🧪 Running Batch SCA Score Persistence Verification...');

async function runTest() {
  const db = await initDb();

  // Ensure column exists by running migration logic
  try {
    await db.exec('ALTER TABLE batches ADD COLUMN sca_score REAL;');
  } catch (e) {
    // Column already exists
  }

  const testId = `test-sca-batch-${Date.now()}`;

  try {
    // 1. Insert a test batch with SCA score 88.5
    console.log('Test 1: Insert batch with sca_score = 88.5');
    await db.run(
      `INSERT INTO batches (id, name, producer, altitude, variety, process, roaster, roaster_notes, dose_weight, total_doses, remaining_doses, origin, roast_level, roast_date, freeze_date, total_weight_g, remaining_weight_g, sca_score)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [testId, 'Geisha Panameño Test', 'Hacienda La Esmeralda', '1800m', 'Geisha', 'Lavado', 'Specialty Lab', 'Floral y Jazmín', '20.0g', 10, 10, 'Panamá', 'Claro', '2026-09-01', null, 200, 200, 88.5]
    );

    // 2. Fetch and assert
    const batch = await db.get('SELECT * FROM batches WHERE id = ?', testId);
    assert(batch, 'Batch should be retrieved from database');
    assert.strictEqual(batch.sca_score, 88.5, `Expected sca_score 88.5, got ${batch.sca_score}`);
    console.log(`✅ Passed: sca_score accurately persisted as ${batch.sca_score}`);

    // 3. Update SCA score to 90.25 (Excepcional)
    console.log('Test 2: Update batch with sca_score = 90.25');
    await db.run(
      'UPDATE batches SET sca_score = ? WHERE id = ?',
      [90.25, testId]
    );

    const updatedBatch = await db.get('SELECT * FROM batches WHERE id = ?', testId);
    assert.strictEqual(updatedBatch.sca_score, 90.25, `Expected sca_score 90.25, got ${updatedBatch.sca_score}`);
    console.log(`✅ Passed: sca_score updated to ${updatedBatch.sca_score}`);

    // 4. Test null sca_score
    console.log('Test 3: Update batch with sca_score = null');
    await db.run(
      'UPDATE batches SET sca_score = ? WHERE id = ?',
      [null, testId]
    );

    const nullBatch = await db.get('SELECT * FROM batches WHERE id = ?', testId);
    assert.strictEqual(nullBatch.sca_score, null, `Expected null sca_score, got ${nullBatch.sca_score}`);
    console.log('✅ Passed: nullable sca_score handled cleanly');

    console.log('\n🎉 ALL BATCH SCA PERSISTENCE TESTS PASSED!');
  } finally {
    // Clean up
    await db.run('DELETE FROM batches WHERE id = ?', testId);
    await db.close();
  }
}

runTest().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
