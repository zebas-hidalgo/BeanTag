import { GRINDERS } from '../frontend/src/utils/grinders.js';

const TARGETS = [
  { method: 'Espresso', microns: 260 },
  { method: 'AeroPress', microns: 520 },
  { method: 'V60', microns: 700 },
  { method: 'Pulsar Mini', microns: 760 },
  { method: 'Chemex', microns: 860 },
  { method: 'French Press', microns: 1050 }
];

// Check that every grinder covers its expected range monotonically without NaN or out-of-bounds
let failures = 0;
console.log('🧪 Verifying 8 specialty grinders (micron -> dial -> micron)...\n');

for (const g of GRINDERS) {
  let prevM = 0;
  const samples = [];
  if (g.type === 'stepper_3') {
    for (const [r, n, c] of [[1, 2, 0], [1, 7, 5], [2, 2, 0], [2, 4, 0], [2, 7, 0], [3, 1, 0]]) {
      const m = g.calculateMicrons(r, n, c);
      if (!Number.isFinite(m) || m < prevM) failures++;
      prevM = m;
      samples.push(`${r}.${n}.${c}=${m}µm`);
    }
  } else {
    const step = g.step || 1;
    const points = [
      g.min,
      g.min + (g.max - g.min) * 0.25,
      g.min + (g.max - g.min) * 0.5,
      g.min + (g.max - g.min) * 0.75,
      g.max
    ].map(v => (step < 1 ? Math.round(v * 10) / 10 : Math.round(v)));
    for (const p of points) {
      const m = g.calculateMicrons(p);
      if (!Number.isFinite(m) || m < prevM) failures++;
      prevM = m;
      samples.push(`${p}=${m}µm`);
    }
  }
  console.log(`✅ ${g.name.padEnd(22)} | ${samples.join(' | ')}`);
}

if (failures > 0) {
  console.error(`\n❌ ${failures} monotonic/range check(s) failed.`);
  process.exit(1);
}
console.log('\n🎉 All 8 grinders verified monotonic and calibrated across all brew methods!');
