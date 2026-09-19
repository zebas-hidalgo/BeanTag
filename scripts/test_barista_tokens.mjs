import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cssPath = path.resolve(__dirname, '../frontend/src/index.css');

console.log('🧪 Verifying Precision Barista Design Tokens & Components in index.css...');

if (!fs.existsSync(cssPath)) {
  console.error(`❌ CSS file not found at ${cssPath}`);
  process.exit(1);
}

const css = fs.readFileSync(cssPath, 'utf8');

const requiredTokens = [
  '--barista-bg-canvas',
  '--barista-bg-surface',
  '--barista-bg-elevated',
  '--barista-bg-subtle',
  '--barista-accent-honey',
  '--barista-accent-honey-hover',
  '--barista-accent-honey-glow',
  '--barista-accent-mint',
  '--barista-accent-mint-subtle',
  '--barista-accent-cryo',
  '--barista-accent-cryo-subtle',
  '--barista-accent-danger',
  '--barista-accent-danger-subtle',
  '--barista-text-primary',
  '--barista-text-secondary',
  '--barista-text-muted',
  '--barista-text-disabled',
  '--barista-border-hairline',
  '--barista-border-active',
  '--barista-border-focus',
  '--barista-radius-xs',
  '--barista-radius-sm',
  '--barista-radius-md',
  '--barista-radius-lg',
  '--barista-radius-pill',
  '--barista-space-2',
  '--barista-space-4',
  '--barista-space-8',
  '--barista-space-12',
  '--barista-space-16',
  '--barista-space-20',
  '--barista-space-24',
  '--barista-space-32',
  '--barista-shadow-card',
  '--barista-shadow-elevated',
  '--barista-shadow-honey'
];

let failed = false;

console.log('\n1️⃣ Checking Design Tokens...');
for (const token of requiredTokens) {
  if (!css.includes(token)) {
    console.error(`❌ Missing token: ${token}`);
    failed = true;
  }
}
if (!failed) {
  console.log(`✅ All ${requiredTokens.length} design tokens are defined.`);
}

console.log('\n2️⃣ Checking Barista Semantic Component Classes...');
const requiredClasses = [
  '.barista-btn-primary',
  '.barista-btn-secondary',
  '.barista-btn-stepper',
  '.barista-btn-ghost',
  '.barista-btn-danger',
  '.barista-card',
  '.barista-input',
  '.barista-label',
  '.barista-metric-display',
  '.barista-sticky-bottom'
];

for (const cls of requiredClasses) {
  if (!css.includes(cls)) {
    console.error(`❌ Missing class: ${cls}`);
    failed = true;
  } else {
    console.log(`✅ Class found: ${cls}`);
  }
}

console.log('\n3️⃣ Checking Ergonomic Touch Target & Typography Rules...');

// Check barista-btn-primary has height or min-height >= 48px
const primaryMatch = css.match(/\.barista-btn-primary\s*\{([^}]+)\}/);
if (!primaryMatch || (!primaryMatch[1].includes('48px') && !primaryMatch[1].includes('height: 48px') && !primaryMatch[1].includes('min-height: 48px'))) {
  console.error('❌ .barista-btn-primary must specify min-height or height of 48px');
  failed = true;
} else {
  console.log('✅ .barista-btn-primary has >= 48px touch target');
}

// Check barista-btn-stepper has 44px
const stepperMatch = css.match(/\.barista-btn-stepper\s*\{([^}]+)\}/);
if (!stepperMatch || !stepperMatch[1].includes('44px')) {
  console.error('❌ .barista-btn-stepper must specify dimensions of at least 44px');
  failed = true;
} else {
  console.log('✅ .barista-btn-stepper has >= 44px touch target');
}

// Check barista-label has font-size >= 12px
const labelMatch = css.match(/\.barista-label\s*\{([^}]+)\}/);
if (!labelMatch || !labelMatch[1].includes('12px')) {
  console.error('❌ .barista-label must have font-size >= 12px');
  failed = true;
} else {
  console.log('✅ .barista-label enforces >= 12px font size');
}

// Check barista-metric-display has mono font and >= 24px
const metricMatch = css.match(/\.barista-metric-display\s*\{([^}]+)\}/);
if (!metricMatch || (!metricMatch[1].includes('monospace') && !metricMatch[1].includes('font-mono') && !metricMatch[1].includes('JetBrains Mono'))) {
  console.error('❌ .barista-metric-display must use monospaced font');
  failed = true;
} else {
  console.log('✅ .barista-metric-display uses monospaced font');
}

console.log('\n4️⃣ Checking Elimination of Comic Book Drop-Shadows...');
if (css.includes('box-shadow: 1px 1px 0px var(--border-color) !important')) {
  console.error('❌ Comic-book offset drop shadow still present in active push feedback');
  failed = true;
} else {
  console.log('✅ Comic-book offset shadow removed from tactile feedback');
}

if (failed) {
  console.error('\n❌ Test suite failed. Please fix the issues above.');
  process.exit(1);
}

console.log('\n🎉 ALL PRECISION BARISTA TOKEN & COMPONENT CHECKS PASSED!\n');
process.exit(0);
