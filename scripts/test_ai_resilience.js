/**
 * Automated Verification Script for AI Resilience & Offline Fallback Engine
 * Tests:
 * 1. computeOfflineSommelier generates valid deterministic recommendations for morning, afternoon, night (_source: 'barista_fallback')
 * 2. computeOfflineSommelier ignores out-of-stock batches (remaining_doses <= 0)
 * 3. callGeminiWithRetry aborts with AbortController after 4000ms
 * 4. POST /api/ai/sommelier endpoint returns HTTP 200 and valid JSON even with invalid API key or offline
 */

const http = require('http');
const assert = require('assert');
const { computeOfflineSommelier, callGeminiWithRetry } = require('../backend/aiEngine.js');
const app = require('../backend/server.js');

async function run() {
  console.log('🚀 Starting AI Resilience and Offline Sommelier Fallback Verification...\n');
  let passed = 0;
  let failed = 0;

  const mockBatches = [
    {
      id: 'batch_colombia',
      name: 'Colombia Huila Supremo',
      producer: 'Finca El Paraiso',
      origin: 'Colombia',
      variety: 'Caturra',
      process: 'Lavado',
      altitude: '1750m',
      roast_level: 'Medio',
      roast_date: new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0], // 14 days rest
      remaining_doses: 6,
      roaster_notes: 'Chocolate con leche, caramelo, dulce, balance impecable'
    },
    {
      id: 'batch_ethiopia',
      name: 'Etiopía Yirgacheffe Anaeróbico',
      producer: 'Asefa Dukamo',
      origin: 'Etiopía',
      variety: 'Geisha / Heirloom',
      process: 'Anaeróbico Natural',
      altitude: '2100m',
      roast_level: 'Claro',
      roast_date: new Date(Date.now() - 18 * 86400000).toISOString().split('T')[0], // 18 days rest
      remaining_doses: 4,
      roaster_notes: 'Jazmín, bergamota, alta acidez cítrica, frutas tropicales'
    },
    {
      id: 'batch_decaf',
      name: 'Perú Swiss Water Decaf',
      producer: 'Cooperativa Cecovasa',
      origin: 'Perú',
      variety: 'Typica Descafeinado',
      process: 'Lavado Descafeinado',
      altitude: '1500m',
      roast_level: 'Claro',
      roast_date: new Date(Date.now() - 12 * 86400000).toISOString().split('T')[0],
      remaining_doses: 5,
      roaster_notes: 'Miel suave, té negro, frutos secos, descafeinado ligero y sereno'
    }
  ];

  // ==========================================
  // Test 1: computeOfflineSommelier for morning, afternoon, night
  // ==========================================
  try {
    console.log('🧪 Test 1: Testing computeOfflineSommelier for mañana, tarde y noche...');
    assert.strictEqual(typeof computeOfflineSommelier, 'function', 'computeOfflineSommelier must be a function exported by aiEngine.js');

    // Morning: prefers washed, balanced, medium roast
    const morningRec = computeOfflineSommelier(mockBatches, 'mañana');
    assert.ok(morningRec, 'Morning recommendation should not be null');
    assert.strictEqual(morningRec._source, 'barista_fallback', 'Must have _source: barista_fallback');
    assert.strictEqual(morningRec.recommended_batch_id, 'batch_colombia', 'Morning should prefer washed balanced medium roast');
    ['recommended_batch_id', 'recommended_batch_name', 'badge', 'headline', 'reason', 'suggested_method', 'flavor_highlight'].forEach(field => {
      assert.ok(typeof morningRec[field] === 'string' && morningRec[field].trim().length > 0, `Morning field ${field} must be a non-empty string`);
    });

    // Afternoon: prefers light roast, floral, high acidity, anaerobic
    const afternoonRec = computeOfflineSommelier(mockBatches, 'tarde');
    assert.ok(afternoonRec, 'Afternoon recommendation should not be null');
    assert.strictEqual(afternoonRec._source, 'barista_fallback', 'Must have _source: barista_fallback');
    assert.strictEqual(afternoonRec.recommended_batch_id, 'batch_ethiopia', 'Afternoon should prefer light floral anaerobic');
    ['recommended_batch_id', 'recommended_batch_name', 'badge', 'headline', 'reason', 'suggested_method', 'flavor_highlight'].forEach(field => {
      assert.ok(typeof afternoonRec[field] === 'string' && afternoonRec[field].trim().length > 0, `Afternoon field ${field} must be a non-empty string`);
    });

    // Night: prefers decaf, soft, light
    const nightRec = computeOfflineSommelier(mockBatches, 'noche');
    assert.ok(nightRec, 'Night recommendation should not be null');
    assert.strictEqual(nightRec._source, 'barista_fallback', 'Must have _source: barista_fallback');
    assert.strictEqual(nightRec.recommended_batch_id, 'batch_decaf', 'Night should prefer decaf / soft coffee');
    ['recommended_batch_id', 'recommended_batch_name', 'badge', 'headline', 'reason', 'suggested_method', 'flavor_highlight'].forEach(field => {
      assert.ok(typeof nightRec[field] === 'string' && nightRec[field].trim().length > 0, `Night field ${field} must be a non-empty string`);
    });

    console.log('✅ Test 1 PASSED: computeOfflineSommelier provides valid deterministic recommendations with _source: barista_fallback.\n');
    passed++;
  } catch (err) {
    console.error('❌ Test 1 FAILED:', err.message, '\n');
    failed++;
  }

  // ==========================================
  // Test 2: computeOfflineSommelier stock filtering
  // ==========================================
  try {
    console.log('🧪 Test 2: Testing stock filtering (remaining_doses <= 0)...');
    assert.strictEqual(typeof computeOfflineSommelier, 'function', 'computeOfflineSommelier must be a function exported by aiEngine.js');

    const stockTestBatches = [
      {
        id: 'out_of_stock_colombia',
        name: 'Colombia Huila Supremo (Agotado)',
        process: 'Lavado',
        roast_level: 'Medio',
        remaining_doses: 0, // Out of stock!
        roaster_notes: 'Caramelo dulce balance'
      },
      {
        id: 'in_stock_guatemala',
        name: 'Guatemala Antigua',
        process: 'Lavado',
        roast_level: 'Medio',
        remaining_doses: 3, // In stock
        roaster_notes: 'Cacao y avellana'
      }
    ];

    const rec = computeOfflineSommelier(stockTestBatches, 'mañana');
    assert.ok(rec, 'Recommendation should pick the available batch');
    assert.strictEqual(rec.recommended_batch_id, 'in_stock_guatemala', 'Must never recommend an out-of-stock batch (remaining_doses = 0)');

    // When all batches are out of stock
    const allZeroBatches = [
      { id: 'zero_1', name: 'Zero 1', remaining_doses: 0 },
      { id: 'zero_2', name: 'Zero 2', remaining_doses: -1 }
    ];
    const recZero = computeOfflineSommelier(allZeroBatches, 'mañana');
    assert.strictEqual(recZero, null, 'Must return null when all batches have remaining_doses <= 0');

    console.log('✅ Test 2 PASSED: computeOfflineSommelier strictly filters out batches with remaining_doses <= 0.\n');
    passed++;
  } catch (err) {
    console.error('❌ Test 2 FAILED:', err.message, '\n');
    failed++;
  }

  // ==========================================
  // Test 3: callGeminiWithRetry 4000ms AbortController cancellation
  // ==========================================
  try {
    console.log('🧪 Test 3: Testing callGeminiWithRetry 4000ms AbortController cancellation...');
    const originalFetch = global.fetch;
    let recordedSignal = null;
    let signalAborted = false;
    let startTime = 0;
    let elapsed = 0;
    let callCount = 0;

    global.fetch = async (url, options) => {
      callCount++;
      if (callCount === 1) {
        recordedSignal = options?.signal;
        startTime = Date.now();
        if (!recordedSignal) {
          throw new Error('fetch called without AbortSignal in options');
        }
        return new Promise((resolve, reject) => {
          const safetyTimeout = setTimeout(() => {
            reject(new Error('Safety timeout: fetch was not aborted within 6000ms'));
          }, 6000);

          recordedSignal.addEventListener('abort', () => {
            clearTimeout(safetyTimeout);
            signalAborted = true;
            elapsed = Date.now() - startTime;
            const err = new Error('This operation was aborted');
            err.name = 'AbortError';
            reject(err);
          });
        });
      } else {
        // Subsequent cascaded models fail immediately to keep test fast
        const err = new Error('Cascade fast fail');
        throw err;
      }
    };

    try {
      await callGeminiWithRetry('prompt test', 'test_dummy_key_123', 'gemini-3.8-flash', false, 4000);
    } catch (e) {
      // Expected to throw after cascade completes
    } finally {
      global.fetch = originalFetch;
    }

    assert.ok(recordedSignal, 'callGeminiWithRetry must pass an AbortSignal to fetch options');
    assert.ok(signalAborted, 'AbortController must have aborted the hung request');
    assert.ok(elapsed >= 3800 && elapsed <= 5500, `Abort should occur after ~4000ms (actual: ${elapsed}ms)`);

    console.log(`✅ Test 3 PASSED: callGeminiWithRetry cancelled hanging request via AbortController in ${elapsed}ms.\n`);
    passed++;
  } catch (err) {
    console.error('❌ Test 3 FAILED:', err.message, '\n');
    failed++;
  }

  // ==========================================
  // Test 4: /api/ai/sommelier HTTP 200 fallback behavior
  // ==========================================
  try {
    console.log('🧪 Test 4: Testing /api/ai/sommelier HTTP 200 with invalid API key or offline...');
    const server = http.createServer(app);
    await new Promise(resolve => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    async function postJson(path, body, headers = {}) {
      return new Promise((resolve, reject) => {
        const payload = JSON.stringify(body);
        const req = http.request(`${baseUrl}${path}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
            ...headers
          }
        }, res => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              resolve({ status: res.statusCode, body: JSON.parse(data) });
            } catch (e) {
              resolve({ status: res.statusCode, raw: data });
            }
          });
        });
        req.on('error', reject);
        req.write(payload);
        req.end();
      });
    }

    // Case A: No API key header
    const resNoKey = await postJson('/api/ai/sommelier', {
      batches: mockBatches,
      timeOfDay: 'mañana'
    });
    assert.strictEqual(resNoKey.status, 200, `Expected HTTP 200 when no API key provided, got ${resNoKey.status}`);
    assert.strictEqual(resNoKey.body._source, 'barista_fallback', 'Response must be from barista_fallback');
    assert.strictEqual(resNoKey.body.recommended_batch_id, 'batch_colombia', 'Should select morning batch');

    // Case B: Invalid API key header (simulating Google AI auth/connection rejection)
    const resBadKey = await postJson('/api/ai/sommelier', {
      batches: mockBatches,
      timeOfDay: 'tarde'
    }, {
      'x-gemini-key': 'INVALID_EXPIRED_KEY_XYZ999'
    });
    assert.strictEqual(resBadKey.status, 200, `Expected HTTP 200 when invalid API key provided, got ${resBadKey.status}`);
    assert.strictEqual(resBadKey.body._source, 'barista_fallback', 'Response must fall back to barista_fallback');
    assert.strictEqual(resBadKey.body.recommended_batch_id, 'batch_ethiopia', 'Should select afternoon batch');

    await new Promise(resolve => server.close(resolve));
    console.log('✅ Test 4 PASSED: /api/ai/sommelier always responds with HTTP 200 and offline sommelier fallback.\n');
    passed++;
  } catch (err) {
    console.error('❌ Test 4 FAILED:', err.message, '\n');
    failed++;
  }

  // Summary
  console.log(`-----------------------------------------------`);
  console.log(`Results: ${passed} passed, ${failed} failed.`);
  console.log(`-----------------------------------------------`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

run().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
