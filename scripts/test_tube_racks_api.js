const http = require('http');
const app = require('../backend/server.js');
const { initDb, getDb } = require('../backend/database.js');

async function runTests() {
  console.log('🧪 Starting Tube Racks API Automated Verification...');
  await initDb();
  const db = await getDb();

  // Create an ephemeral HTTP server
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`📡 Test server running on ${baseUrl}`);

  async function request(path, options = {}) {
    const url = `${baseUrl}${path}`;
    const method = options.method || 'GET';
    const body = options.body ? JSON.stringify(options.body) : null;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    return new Promise((resolve, reject) => {
      const req = http.request(url, { method, headers }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = data ? JSON.parse(data) : null;
            resolve({ status: res.statusCode, body: parsed, raw: data });
          } catch (e) {
            resolve({ status: res.statusCode, body: data, raw: data });
          }
        });
      });
      req.on('error', reject);
      if (body) req.write(body);
      req.end();
    });
  }

  try {
    // 1. Create a test coffee batch
    const testBatchId = 'test_batch_' + Date.now();
    await db.run(`
      INSERT INTO batches (id, name, producer, roaster, origin, dose_weight, total_doses, remaining_doses, total_weight_g, remaining_weight_g)
      VALUES (?, 'Geisha Floral', 'Hacienda La Esmeralda', 'Nomad Coffee', 'Panamá', '18.0g', 10, 10, 180, 180)
    `, [testBatchId]);
    console.log('✅ 1. Created test coffee batch');

    // 2. POST /api/racks - Create new rack
    const createRes = await request('/api/racks', {
      method: 'POST',
      body: { name: 'Rack Barra Principal' }
    });
    if (createRes.status !== 201 || !createRes.body.rack) {
      throw new Error(`Failed to create rack: ${JSON.stringify(createRes)}`);
    }
    const rackId = createRes.body.rack.id;
    console.log(`✅ 2. Created rack '${createRes.body.rack.name}' with id ${rackId}`);
    if (createRes.body.rack.slots.length !== 6) {
      throw new Error(`Rack should have 6 slots, got ${createRes.body.rack.slots.length}`);
    }
    console.log('✅ 3. Verified rack automatically initialized with 6 slots (positions 1 to 6)');

    // 3. GET /api/racks
    const listRes = await request('/api/racks');
    if (listRes.status !== 200 || !Array.isArray(listRes.body)) {
      throw new Error(`Failed to list racks: ${JSON.stringify(listRes)}`);
    }
    const foundRack = listRes.body.find(r => r.id === rackId);
    if (!foundRack) throw new Error('Created rack not found in list');
    console.log('✅ 4. GET /api/racks returned list with newly created rack');

    // 4. PUT /api/racks/:id - Rename rack
    const renameRes = await request(`/api/racks/${rackId}`, {
      method: 'PUT',
      body: { name: 'Rack Barra Espresso VIP' }
    });
    if (renameRes.status !== 200 || renameRes.body.name !== 'Rack Barra Espresso VIP') {
      throw new Error(`Failed to rename rack: ${JSON.stringify(renameRes)}`);
    }
    console.log('✅ 5. PUT /api/racks/:id successfully renamed rack');

    // 5. PUT /api/racks/:id/slots/1 - Assign batch to slot 1
    const assignRes = await request(`/api/racks/${rackId}/slots/1`, {
      method: 'PUT',
      body: { batch_id: testBatchId }
    });
    if (assignRes.status !== 200 || !assignRes.body.slot || assignRes.body.slot.batch_id !== testBatchId) {
      throw new Error(`Failed to assign slot 1: ${JSON.stringify(assignRes)}`);
    }
    if (assignRes.body.slot.batch_name !== 'Geisha Floral') {
      throw new Error(`Slot batch_name not joined correctly: ${assignRes.body.slot.batch_name}`);
    }
    console.log('✅ 6. PUT /api/racks/:id/slots/1 assigned batch with joined details');

    // 6. POST /api/racks/:id/fill - Fill remaining slots with the batch
    const fillRes = await request(`/api/racks/${rackId}/fill`, {
      method: 'POST',
      body: { batch_id: testBatchId, only_empty: true }
    });
    if (fillRes.status !== 200 || !fillRes.body.slots) {
      throw new Error(`Failed to bulk fill rack: ${JSON.stringify(fillRes)}`);
    }
    const allFilled = fillRes.body.slots.every(s => s.batch_id === testBatchId);
    if (!allFilled) throw new Error('Not all slots were filled by bulk fill');
    console.log('✅ 7. POST /api/racks/:id/fill filled all 6 slots in the rack');

    // 7. POST /api/racks/:id/slots/1/consume - Consume tube 1
    const consumeRes = await request(`/api/racks/${rackId}/slots/1/consume`, {
      method: 'POST'
    });
    if (consumeRes.status !== 200 || !consumeRes.body.consumed_batch) {
      throw new Error(`Failed to consume slot 1: ${JSON.stringify(consumeRes)}`);
    }
    if (consumeRes.body.consumed_batch.remaining_doses !== 9) {
      throw new Error(`Remaining doses should be 9, got ${consumeRes.body.consumed_batch.remaining_doses}`);
    }
    if (consumeRes.body.consumed_batch.remaining_weight_g !== 162) {
      throw new Error(`Remaining weight should be 162g, got ${consumeRes.body.consumed_batch.remaining_weight_g}`);
    }
    console.log('✅ 8. POST /api/racks/:id/slots/1/consume decremented doses to 9 and weight to 162g');

    // Verify slot 1 is now empty
    const checkSlotRes = await request('/api/racks');
    const checkedRack = checkSlotRes.body.find(r => r.id === rackId);
    const slot1 = checkedRack.slots.find(s => s.position === 1);
    if (slot1.batch_id !== null) {
      throw new Error(`Slot 1 should be null after consume, got ${slot1.batch_id}`);
    }
    console.log('✅ 9. Verified slot 1 is now empty in rack');

    // 8. POST /api/racks/:id/empty - Empty all slots
    const emptyRes = await request(`/api/racks/${rackId}/empty`, { method: 'POST' });
    if (emptyRes.status !== 200) throw new Error(`Failed to empty rack: ${JSON.stringify(emptyRes)}`);
    const checkEmptyRes = await request('/api/racks');
    const emptiedRack = checkEmptyRes.body.find(r => r.id === rackId);
    const allEmpty = emptiedRack.slots.every(s => s.batch_id === null);
    if (!allEmpty) throw new Error('Not all slots were emptied');
    console.log('✅ 10. POST /api/racks/:id/empty emptied all slots');

    // 9. DELETE /api/racks/:id - Delete rack
    const deleteRes = await request(`/api/racks/${rackId}`, { method: 'DELETE' });
    if (deleteRes.status !== 200) throw new Error(`Failed to delete rack: ${JSON.stringify(deleteRes)}`);
    const afterDeleteRes = await request('/api/racks');
    const exists = afterDeleteRes.body.some(r => r.id === rackId);
    if (exists) throw new Error('Rack still exists after delete');
    console.log('✅ 11. DELETE /api/racks/:id deleted rack and its slots in cascade');

    // Clean up test batch
    await db.run('DELETE FROM batches WHERE id = ?', [testBatchId]);
    console.log('✅ 12. Cleaned up test batch');

    console.log('\n🎉 ALL 12 TUBE RACKS API INTEGRATION TESTS PASSED PERFECTLY!\n');
  } finally {
    server.close();
  }
}

runTests().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
