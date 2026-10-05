import assert from 'node:assert/strict';

// Helper function to test extraction and lineage logic
export function processRecipeLineage(recipes = []) {
  if (!Array.isArray(recipes) || recipes.length === 0) return [];

  // Sort ascending by creation time to show chronology (Step 1 -> Step 2 -> ...)
  const sorted = [...recipes].sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));

  return sorted.map((rec, idx) => {
    const prev = idx > 0 ? sorted[idx - 1] : null;
    const isSweetSpot = rec.rating === 5 || (typeof rec.notes === 'string' && rec.notes.toLowerCase().includes('sweet spot'));
    
    let tempDelta = null;
    
    if (prev) {
      const currentTemp = parseInt(String(rec.temperature || '').replace(/[^\d]/g, ''), 10);
      const prevTemp = parseInt(String(prev.temperature || '').replace(/[^\d]/g, ''), 10);
      if (!isNaN(currentTemp) && !isNaN(prevTemp)) {
        tempDelta = currentTemp - prevTemp;
      }
    }

    return {
      iteration: idx + 1,
      id: rec.id,
      method: rec.method || 'V60 (Filtrado)',
      grind: rec.grind || 'Molienda estándar',
      temperature: rec.temperature || '93°C',
      ratio: rec.ratio || '1:16',
      dose_in_g: rec.dose_in_g || 15,
      dose_out_g: rec.dose_out_g || 240,
      rating: rec.rating || 0,
      isSweetSpot,
      tempDelta,
      notes: rec.notes || ''
    };
  });
}

console.log('🧪 Testing Dial-in Lineage Processing Logic...');

// 1. Basic sorting, iteration numbering, and delta extraction
const mockRecipes = [
  {
    id: 1,
    created_at: '2026-10-01T10:00:00Z',
    method: 'V60 (Filtrado)',
    grind: '68 clics (~1.7 Rot.)',
    temperature: '93°C',
    rating: 3,
    notes: 'Sub-extraído, notas agrias'
  },
  {
    id: 2,
    created_at: '2026-10-02T10:00:00Z',
    method: 'V60 (Filtrado)',
    grind: '70 clics (~1.8 Rot.)',
    temperature: '94°C',
    rating: 5,
    notes: 'Sweet spot perfecto, dulzor alto'
  }
];

const lineage = processRecipeLineage(mockRecipes);
assert.equal(lineage.length, 2, 'Should process 2 recipes');
assert.equal(lineage[0].iteration, 1, 'First recipe should be iteration 1');
assert.equal(lineage[0].isSweetSpot, false, 'Rating 3 without sweet spot in notes should not be sweet spot');
assert.equal(lineage[0].tempDelta, null, 'First recipe should have no tempDelta');

assert.equal(lineage[1].iteration, 2, 'Second recipe should be iteration 2');
assert.equal(lineage[1].isSweetSpot, true, 'Rating 5 should be tagged as sweet spot');
assert.equal(lineage[1].tempDelta, 1, 'Temperature delta from 93 to 94 should be +1');

// 2. Unsorted inputs should be sorted ascending by created_at
const unsortedRecipes = [
  { id: 20, created_at: '2026-10-05T12:00:00Z', temperature: '92°C' },
  { id: 10, created_at: '2026-10-01T12:00:00Z', temperature: '95°C' },
  { id: 15, created_at: '2026-10-03T12:00:00Z', temperature: '94°C' }
];
const sortedLineage = processRecipeLineage(unsortedRecipes);
assert.equal(sortedLineage[0].id, 10, 'Earliest recipe should be first');
assert.equal(sortedLineage[0].iteration, 1);
assert.equal(sortedLineage[1].id, 15, 'Second earliest recipe should be second');
assert.equal(sortedLineage[1].iteration, 2);
assert.equal(sortedLineage[1].tempDelta, -1, 'Temp delta from 95 to 94 should be -1');
assert.equal(sortedLineage[2].id, 20, 'Latest recipe should be third');
assert.equal(sortedLineage[2].iteration, 3);
assert.equal(sortedLineage[2].tempDelta, -2, 'Temp delta from 94 to 92 should be -2');

// 3. Sweet spot detection via notes (even when rating < 5)
const notesSweetSpot = [
  { id: 30, created_at: '2026-10-01T10:00:00Z', rating: 4, notes: 'Encontramos el Sweet Spot definitivo' },
  { id: 31, created_at: '2026-10-02T10:00:00Z', rating: 4, notes: 'Ligeramente amargo' }
];
const sweetLineage = processRecipeLineage(notesSweetSpot);
assert.equal(sweetLineage[0].isSweetSpot, true, 'Should detect sweet spot from notes');
assert.equal(sweetLineage[1].isSweetSpot, false, 'Should not detect sweet spot if phrase is absent');

// 4. Edge cases: empty array, non-array, null/undefined fields, missing temperature
assert.deepEqual(processRecipeLineage([]), []);
assert.deepEqual(processRecipeLineage(null), []);
assert.deepEqual(processRecipeLineage(undefined), []);

const robustTest = [
  { id: 40, created_at: null, rating: null, notes: null, temperature: null },
  { id: 41, created_at: '2026-10-01T10:00:00Z', rating: undefined, notes: undefined, temperature: 'sin datos' }
];
const robustLineage = processRecipeLineage(robustTest);
assert.equal(robustLineage.length, 2);
assert.equal(robustLineage[0].rating, 0);
assert.equal(robustLineage[0].isSweetSpot, false);
assert.equal(robustLineage[1].tempDelta, null, 'Invalid temperature strings should result in null tempDelta');

console.log('✅ Passed: Dial-in Lineage logic verified successfully!\n');
