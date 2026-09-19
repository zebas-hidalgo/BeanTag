import { computeOfflineRecipe, computeOfflineTuning, sanitizeModel, DEFAULT_GEMINI_MODEL, VALID_GEMINI_MODELS } from '../backend/aiEngine.js';

console.log('🧪 Testing AI Engine & Gemini Fallback Mechanisms...\n');

let failed = false;

// 1. Model Sanitization
console.log('1️⃣ Testing model sanitization...');
if (sanitizeModel('') !== DEFAULT_GEMINI_MODEL) {
  console.error('❌ Empty model did not fallback to default');
  failed = true;
}
if (sanitizeModel('gemini-2.0-flash') !== 'gemini-2.0-flash') {
  console.error('❌ Valid model was not recognized');
  failed = true;
}
console.log('✅ Model sanitization operates correctly');

// 2. Offline Recipe Computation
console.log('\n2️⃣ Testing deterministic offline recipe computation...');
const v60Rec = computeOfflineRecipe({
  origin: 'Etiopía Yirgacheffe',
  variety: 'Heirloom',
  process: 'Lavado',
  altitude: '2000m',
  roast_level: 'Claro',
  roaster_notes: 'Jazmín, Bergamota, Melocotón',
  method: 'V60 (Filtrado)',
  dose_in_g: 15.0
});

if (!v60Rec || !v60Rec.water_total_g || !v60Rec.ratio || !v60Rec.grind) {
  console.error('❌ computeOfflineRecipe failed to generate complete recipe object');
  failed = true;
} else if (v60Rec._source !== 'barista_fallback') {
  console.error('❌ computeOfflineRecipe source tag missing');
  failed = true;
} else {
  console.log(`✅ V60 recipe computed: ${v60Rec.ratio}, ${v60Rec.water_total_g}g water, J-Max: ${v60Rec.jmax_rot}.${v60Rec.jmax_num}.${v60Rec.jmax_click}`);
}

// 3. Offline Sensory Tuning
console.log('\n3️⃣ Testing offline sensory recalibration...');
const tunedRec = computeOfflineTuning({
  method: 'V60 (Filtrado)',
  dose_in_g: 15.0,
  ratio: '1:16',
  temperature: 92,
  jmax_rot: 2,
  jmax_num: 4,
  jmax_click: 5,
  sensory_extraction: 'Sobre',
  sensory_balance: 'Amargo',
  sensory_body: 'Medio',
  user_notes: 'Retrogusto seco y astringente',
  batch_name: 'Etiopía Yirgacheffe'
});

if (!tunedRec || !tunedRec.grind || tunedRec.temperature >= 92) {
  console.error('❌ computeOfflineTuning did not properly adjust parameters for over-extraction');
  failed = true;
} else {
  console.log(`✅ Sensory recalibration adjusted over-extraction: temp reduced to ${tunedRec.temperature}°C, molienda ajustada.`);
}

if (failed) {
  console.error('\n❌ AI Engine tests failed.');
  process.exit(1);
}

console.log('\n🎉 ALL AI ENGINE & RESILIENT FALLBACK TESTS PASSED!\n');
process.exit(0);
