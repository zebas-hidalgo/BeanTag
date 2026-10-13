/**
 * Integration & Unit Tests for Groq Inference Engine and Realistic Timeouts
 * Tests:
 * 1. callGroqWithRetry is exported by backend/aiEngine.js
 * 2. Captures missing or invalid API key throwing a descriptive error
 * 3. Formats text requests correctly: model='llama-3.3-70b-versatile', response_format={ type: 'json_object' }, timeout 12000ms
 * 4. Formats vision requests (isVision=true): model='llama-3.2-11b-vision-preview', image_url payload, timeout 25000ms
 * 5. Extracts and sanitizes structured JSON from content (including markdown blocks and prose wrapper), injecting _source: 'groq' and _model
 * 6. AbortController cancels request on timeout with descriptive error
 */

const assert = require('assert');
const aiEngine = require('../backend/aiEngine.js');

async function run() {
  console.log('🚀 Running Groq Inference Engine Integration Tests...\n');
  let passed = 0;
  let failed = 0;

  // ==========================================
  // Test 1: callGroqWithRetry is defined & exported
  // ==========================================
  try {
    console.log('🧪 Test 1: Checking that callGroqWithRetry is defined and exported...');
    assert.strictEqual(
      typeof aiEngine.callGroqWithRetry,
      'function',
      'callGroqWithRetry must be a function exported by backend/aiEngine.js'
    );
    console.log('✅ Test 1 PASSED: callGroqWithRetry is exported.\n');
    passed++;
  } catch (err) {
    console.error('❌ Test 1 FAILED:', err.message, '\n');
    failed++;
  }

  // ==========================================
  // Test 2: Missing or invalid API key rejection
  // ==========================================
  try {
    console.log('🧪 Test 2: Testing API key validation...');
    const { callGroqWithRetry } = aiEngine;
    if (typeof callGroqWithRetry !== 'function') {
      throw new Error('callGroqWithRetry is not defined');
    }

    // Empty string
    let threwEmpty = false;
    try {
      await callGroqWithRetry('Test prompt', '');
    } catch (e) {
      threwEmpty = true;
      assert.ok(
        e.message.toLowerCase().includes('groq') || e.message.toLowerCase().includes('clave'),
        `Error message should be descriptive: ${e.message}`
      );
    }
    assert.ok(threwEmpty, 'callGroqWithRetry must reject empty API key');

    // Null or undefined
    let threwNull = false;
    try {
      await callGroqWithRetry('Test prompt', null);
    } catch (e) {
      threwNull = true;
    }
    assert.ok(threwNull, 'callGroqWithRetry must reject null API key');

    // Whitespace string
    let threwSpaces = false;
    try {
      await callGroqWithRetry('Test prompt', '   ');
    } catch (e) {
      threwSpaces = true;
    }
    assert.ok(threwSpaces, 'callGroqWithRetry must reject whitespace-only API key');

    console.log('✅ Test 2 PASSED: Missing/invalid API keys rejected with descriptive errors.\n');
    passed++;
  } catch (err) {
    console.error('❌ Test 2 FAILED:', err.message, '\n');
    failed++;
  }

  // ==========================================
  // Test 3: Text Request Formatting (model, response_format, 12000ms timeout)
  // ==========================================
  try {
    console.log('🧪 Test 3: Testing text request formatting and 12000ms timeout...');
    const { callGroqWithRetry } = aiEngine;
    if (typeof callGroqWithRetry !== 'function') {
      throw new Error('callGroqWithRetry is not defined');
    }

    const originalFetch = global.fetch;
    const originalSetTimeout = global.setTimeout;

    let capturedUrl = null;
    let capturedOptions = null;
    let capturedTimeoutDelay = null;

    global.setTimeout = (fn, delay, ...args) => {
      // Capture the timeout registered for AbortController
      if (delay === 12000 || delay === 25000) {
        capturedTimeoutDelay = delay;
      }
      return originalSetTimeout(fn, delay, ...args);
    };

    global.fetch = async (url, options) => {
      capturedUrl = url;
      capturedOptions = options;
      return {
        ok: true,
        status: 200,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({ recipe: 'V60 Pour Over', ratio: '1:16' })
              }
            }
          ]
        })
      };
    };

    try {
      const result = await callGroqWithRetry('Genera receta V60', 'gsk_test_api_key_valid');
      
      assert.strictEqual(
        capturedUrl,
        'https://api.groq.com/openai/v1/chat/completions',
        'Should target the Groq OpenAI-compatible chat completions endpoint'
      );
      assert.strictEqual(
        capturedOptions.headers['Authorization'],
        'Bearer gsk_test_api_key_valid',
        'Authorization header must include Bearer token with clean key'
      );
      assert.strictEqual(
        capturedOptions.headers['Content-Type'],
        'application/json',
        'Content-Type must be application/json'
      );

      const body = JSON.parse(capturedOptions.body);
      assert.strictEqual(body.model, 'llama-3.3-70b-versatile', 'Default text model must be llama-3.3-70b-versatile');
      assert.deepStrictEqual(body.response_format, { type: 'json_object' }, 'response_format must be json_object');
      assert.deepStrictEqual(
        body.messages,
        [{ role: 'user', content: 'Genera receta V60' }],
        'Messages should format prompt into user role'
      );
      assert.ok(capturedOptions.signal, 'Must pass AbortSignal to fetch options');
      assert.strictEqual(capturedTimeoutDelay, 12000, 'AbortController timeout for text must be 12000ms');

      assert.strictEqual(result.recipe, 'V60 Pour Over');
      assert.strictEqual(result._source, 'groq');
      assert.strictEqual(result._model, 'llama-3.3-70b-versatile');
    } finally {
      global.fetch = originalFetch;
      global.setTimeout = originalSetTimeout;
    }

    console.log('✅ Test 3 PASSED: Text request correctly formatted with llama-3.3-70b-versatile, json_object, and 12s timeout.\n');
    passed++;
  } catch (err) {
    console.error('❌ Test 3 FAILED:', err.message, '\n');
    failed++;
  }

  // ==========================================
  // Test 4: Vision Request Formatting (isVision=true, model, image_url, 25000ms timeout)
  // ==========================================
  try {
    console.log('🧪 Test 4: Testing vision request formatting (isVision=true) and 25000ms timeout...');
    const { callGroqWithRetry } = aiEngine;
    if (typeof callGroqWithRetry !== 'function') {
      throw new Error('callGroqWithRetry is not defined');
    }

    const originalFetch = global.fetch;
    const originalSetTimeout = global.setTimeout;

    let capturedUrl = null;
    let capturedOptions = null;
    let capturedTimeoutDelay = null;

    global.setTimeout = (fn, delay, ...args) => {
      if (delay === 12000 || delay === 25000) {
        capturedTimeoutDelay = delay;
      }
      return originalSetTimeout(fn, delay, ...args);
    };

    global.fetch = async (url, options) => {
      capturedUrl = url;
      capturedOptions = options;
      return {
        ok: true,
        status: 200,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({ name: 'Geisha Panama Boquete', roast_level: 'Claro' })
              }
            }
          ]
        })
      };
    };

    const dummyBase64Url = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...';

    try {
      const result = await callGroqWithRetry(
        'Analiza esta bolsa de café',
        'gsk_test_api_key_valid',
        null, // model (defaults to vision model)
        true, // isVision = true
        null, // timeoutMs (defaults to 25000ms)
        dummyBase64Url
      );

      const body = JSON.parse(capturedOptions.body);
      assert.strictEqual(body.model, 'llama-3.2-11b-vision-preview', 'Default vision model must be llama-3.2-11b-vision-preview');
      assert.strictEqual(capturedTimeoutDelay, 25000, 'AbortController timeout for vision must be 25000ms');

      assert.strictEqual(body.messages.length, 1);
      assert.strictEqual(body.messages[0].role, 'user');
      assert.deepStrictEqual(body.messages[0].content, [
        { type: 'text', text: 'Analiza esta bolsa de café' },
        { type: 'image_url', image_url: { url: dummyBase64Url } }
      ]);

      assert.strictEqual(result.name, 'Geisha Panama Boquete');
      assert.strictEqual(result._source, 'groq');
      assert.strictEqual(result._model, 'llama-3.2-11b-vision-preview');
    } finally {
      global.fetch = originalFetch;
      global.setTimeout = originalSetTimeout;
    }

    console.log('✅ Test 4 PASSED: Vision request correctly formatted with llama-3.2-11b-vision-preview and 25s timeout.\n');
    passed++;
  } catch (err) {
    console.error('❌ Test 4 FAILED:', err.message, '\n');
    failed++;
  }

  // ==========================================
  // Test 5: Structured JSON Extraction and Cleaning
  // ==========================================
  try {
    console.log('🧪 Test 5: Testing robust JSON parsing and sanitization...');
    const { callGroqWithRetry } = aiEngine;
    if (typeof callGroqWithRetry !== 'function') {
      throw new Error('callGroqWithRetry is not defined');
    }

    const originalFetch = global.fetch;

    // Sub-case A: Markdown fenced json code block ```json ... ```
    global.fetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [
          {
            message: {
              content: '```json\n{\n  "status": "perfect",\n  "extraction": "optimal"\n}\n```'
            }
          }
        ]
      })
    });

    try {
      const resA = await callGroqWithRetry('Prompt', 'gsk_key');
      assert.strictEqual(resA.status, 'perfect');
      assert.strictEqual(resA.extraction, 'optimal');
      assert.strictEqual(resA._source, 'groq');
      assert.strictEqual(resA._model, 'llama-3.3-70b-versatile');
    } finally {
      global.fetch = originalFetch;
    }

    // Sub-case B: Prose wrapper around JSON
    global.fetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [
          {
            message: {
              content: 'Hola barista, aquí tienes el análisis técnico:\n{\n  "coffee": "Etiopía Yirgacheffe",\n  "notes": "Jazmín y melocotón"\n}\nEspero te sirva!'
            }
          }
        ]
      })
    });

    try {
      const resB = await callGroqWithRetry('Prompt', 'gsk_key');
      assert.strictEqual(resB.coffee, 'Etiopía Yirgacheffe');
      assert.strictEqual(resB.notes, 'Jazmín y melocotón');
      assert.strictEqual(resB._source, 'groq');
    } finally {
      global.fetch = originalFetch;
    }

    console.log('✅ Test 5 PASSED: Robust JSON extraction works across markdown fences and surrounding text.\n');
    passed++;
  } catch (err) {
    console.error('❌ Test 5 FAILED:', err.message, '\n');
    failed++;
  }

  // ==========================================
  // Test 6: AbortController Timeout Cancellation
  // ==========================================
  try {
    console.log('🧪 Test 6: Testing AbortController timeout handling...');
    const { callGroqWithRetry } = aiEngine;
    if (typeof callGroqWithRetry !== 'function') {
      throw new Error('callGroqWithRetry is not defined');
    }

    const originalFetch = global.fetch;

    // Test with explicit small timeout (e.g., 50ms) to ensure timeout abort is caught
    global.fetch = async (url, options) => {
      return new Promise((resolve, reject) => {
        const signal = options?.signal;
        if (signal) {
          signal.addEventListener('abort', () => {
            const err = new Error('The operation was aborted.');
            err.name = 'AbortError';
            reject(err);
          });
        }
      });
    };

    let caughtTimeout = false;
    try {
      await callGroqWithRetry('Prompt hung', 'gsk_key', 'llama-3.3-70b-versatile', false, 50);
    } catch (e) {
      caughtTimeout = true;
      assert.ok(
        e.message.toLowerCase().includes('timeout') || e.message.toLowerCase().includes('abort'),
        `Error should indicate timeout or abort: ${e.message}`
      );
    } finally {
      global.fetch = originalFetch;
    }

    assert.ok(caughtTimeout, 'Hanging request must be aborted and throw timeout error');
    console.log('✅ Test 6 PASSED: AbortController timeout cancels request properly.\n');
    passed++;
  } catch (err) {
    console.error('❌ Test 6 FAILED:', err.message, '\n');
    failed++;
  }

  // ==========================================
  // Test 7: Gemini Quota Exhaustion Cascade Abort
  // ==========================================
  try {
    console.log('🧪 Test 7: Testing callGeminiWithRetry 429 quota immediate cascade abort...');
    const { callGeminiWithRetry } = aiEngine;
    assert.strictEqual(typeof callGeminiWithRetry, 'function', 'callGeminiWithRetry must be defined');

    const originalFetch = global.fetch;
    let fetchAttempts = 0;

    global.fetch = async (url) => {
      fetchAttempts++;
      return {
        ok: false,
        status: 429,
        json: async () => ({
          error: {
            message: 'Quota exceeded for quota metric GenerateContentRequestsPerMinute and limit: 0'
          }
        })
      };
    };

    let caughtQuota = false;
    try {
      await callGeminiWithRetry('prompt test', 'test_gemini_key');
    } catch (err) {
      caughtQuota = true;
      assert.strictEqual(err.status, 429, 'Error status should be 429');
      assert.ok(err.message.toLowerCase().includes('cuota'), `Message should mention cuota: ${err.message}`);
    } finally {
      global.fetch = originalFetch;
    }

    assert.ok(caughtQuota, 'Should catch quota exhaustion error');
    assert.strictEqual(fetchAttempts, 1, 'Should abort immediately on attempt 1 without retrying or cascading other models');
    console.log('✅ Test 7 PASSED: callGeminiWithRetry aborts immediately on 429 quota exhaustion.\n');
    passed++;
  } catch (err) {
    console.error('❌ Test 7 FAILED:', err.message, '\n');
    failed++;
  }

  // ==========================================
  // Test 8: Gemini Realistic Timeouts (12s text, 25s multimodal)
  // ==========================================
  try {
    console.log('🧪 Test 8: Testing callGeminiWithRetry timeouts (12s text, 25s multimodal)...');
    const { callGeminiWithRetry } = aiEngine;

    const originalFetch = global.fetch;
    const originalSetTimeout = global.setTimeout;

    let capturedDelays = [];
    global.setTimeout = (fn, delay, ...args) => {
      if (delay === 12000 || delay === 25000) {
        capturedDelays.push(delay);
      }
      return originalSetTimeout(fn, delay, ...args);
    };

    global.fetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: '{"status":"ok"}' }] } }]
      })
    });

    try {
      // Text request
      await callGeminiWithRetry('prompt text', 'test_key');
      assert.ok(capturedDelays.includes(12000), 'Text request must set 12000ms timeout');

      // Multimodal request
      const multimodalContents = [
        {
          parts: [
            { text: 'Analiza bolsa' },
            { inlineData: { mimeType: 'image/jpeg', data: 'abc...' } }
          ]
        }
      ];
      await callGeminiWithRetry(multimodalContents, 'test_key');
      assert.ok(capturedDelays.includes(25000), 'Multimodal request must set 25000ms timeout');
    } finally {
      global.fetch = originalFetch;
      global.setTimeout = originalSetTimeout;
    }

    console.log('✅ Test 8 PASSED: callGeminiWithRetry configures 12s for text and 25s for multimodal.\n');
    passed++;
  } catch (err) {
    console.error('❌ Test 8 FAILED:', err.message, '\n');
    failed++;
  }

  // Summary
  console.log('-----------------------------------------------');
  console.log(`Results: ${passed} passed, ${failed} failed.`);
  console.log('-----------------------------------------------');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

run().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
