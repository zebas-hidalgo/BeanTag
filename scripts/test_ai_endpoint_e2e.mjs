import assert from 'node:assert/strict';
import app from '../backend/server.js';

console.log('🧪 Running AI Endpoints Direct Mock Integration Tests...\n');

function mockRequest(app, method, url, headers = {}, body = {}) {
  return new Promise((resolve, reject) => {
    // Find matching route handler in express stack
    let responseStatus = 200;
    let responseHeaders = {};
    let responseData = null;

    const req = {
      method,
      url,
      headers,
      body,
      query: {},
      params: {}
    };

    const res = {
      status(code) {
        responseStatus = code;
        return this;
      },
      setHeader(name, val) {
        responseHeaders[name] = val;
        return this;
      },
      json(data) {
        responseData = data;
        resolve({ status: responseStatus, headers: responseHeaders, json: () => data });
      },
      send(data) {
        responseData = data;
        resolve({ status: responseStatus, headers: responseHeaders, text: () => data });
      }
    };

    app.handle(req, res, (err) => {
      if (err) reject(err);
      else resolve({ status: 404, json: () => ({ error: 'Not found' }) });
    });
  });
}

// Test 1: POST /api/recommend-recipe with NO API key
console.log('Test 1: POST /api/recommend-recipe with NO API key (Offline Barista Mode)');
const res1 = await mockRequest(app, 'POST', '/api/recommend-recipe', {}, {
  origin: 'Huila Colombia',
  variety: 'Pink Bourbon',
  process: 'Lavado',
  altitude: '1850m',
  roast_level: 'Claro',
  method: 'V60 (Filtrado)',
  dose_in_g: 20
});

assert.equal(res1.status, 200, 'Should return HTTP 200 even without API key');
const data1 = res1.json();
assert.equal(data1.method, 'V60 (Filtrado)');
assert.equal(data1.water_total_g, 332, 'Light roast washed dynamically calculates 332g (1:16.6)');
assert.ok(data1.grinders?.jmax, 'Should include J-Max grind dial');
assert.ok(data1.notes.includes('Modo Barista Offline'), 'Notes should indicate offline mode');
console.log('✅ Passed: Offline recipe returned with 200 OK without API key.\n');

// Test 2: POST /api/recommend-recipe with simulated invalid/unreachable API key
console.log('Test 2: POST /api/recommend-recipe with Invalid API key (Graceful Fallback on Upstream Failure)');
const res2 = await mockRequest(app, 'POST', '/api/recommend-recipe', {
  'x-gemini-key': 'AIzaSyFakeKeyInvalid1234567890',
  'x-gemini-model': 'gemini-3.7-flash' // Obsolete model, should be sanitized automatically
}, {
  origin: 'Geisha Hacienda La Esmeralda',
  variety: 'Geisha',
  process: 'Natural',
  altitude: '1900m',
  roast_level: 'Claro',
  method: 'NextLevel Pulsar Mini',
  dose_in_g: 15
});

assert.equal(res2.status, 200, 'Should return HTTP 200 with fallback recipe instead of failing with 500/400');
const data2 = res2.json();
assert.equal(data2.method, 'NextLevel Pulsar Mini');
assert.equal(data2.water_total_g, 240);
assert.equal(data2._source, 'barista_fallback');
assert.ok(data2.grinders?.jmax, 'Should calculate J-Max grind');
console.log('✅ Passed: Graceful fallback recipe returned with 200 OK on invalid upstream key.\n');

// Test 3: POST /api/recommend-recipe for AeroPress Go
console.log('Test 3: POST /api/recommend-recipe for AeroPress Go');
const resGo = await mockRequest(app, 'POST', '/api/recommend-recipe', {}, {
  origin: 'Ethiopia Sidama',
  variety: 'Heirloom',
  process: 'Lavado',
  altitude: '2000m',
  roast_level: 'Claro',
  method: 'AeroPress Go',
  dose_in_g: 14
});
assert.equal(resGo.status, 200);
const dataGo = resGo.json();
assert.equal(dataGo.method, 'AeroPress Go');
assert.equal(dataGo.water_total_g, 203);
assert.ok(dataGo.water_total_g <= 215, 'AeroPress Go water within 220ml chamber');
console.log('✅ Passed: AeroPress Go endpoint test returned with 200 OK.\n');

// Test 4: POST /api/ai/tune-recipe with NO API key
console.log('Test 4: POST /api/ai/tune-recipe with NO API key');
const res3 = await mockRequest(app, 'POST', '/api/ai/tune-recipe', {}, {
  method: 'V60 (Filtrado)',
  dose_in_g: 20,
  ratio: '1:15',
  temperature: 92,
  jmax_rot: 2,
  jmax_num: 5,
  jmax_click: 0,
  sensory_extraction: 'Sub (Agrio)',
  batch_name: 'Huila Pink Bourbon'
});

assert.equal(res3.status, 200, 'Should return HTTP 200 with offline tuning');
const data3 = res3.json();
assert.ok(data3.correction_reason, 'Should provide correction explanation');
assert.ok(data3.temperature >= 93, 'Should adjust temperature');
console.log('✅ Passed: Offline sensory tuning returned with 200 OK.\n');

console.log('🎉 ALL END-TO-END AI ENDPOINT INTEGRATION TESTS PASSED!\n');
