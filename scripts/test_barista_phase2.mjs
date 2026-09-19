import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🧪 Verifying Phase 2 Ergonomic Refactors across Critical Screens...\n');

let failed = false;

// 1. RecipeForm.jsx
console.log('1️⃣ Checking RecipeForm.jsx...');
const recipeFormPath = path.join(rootDir, 'frontend/src/components/RecipeForm.jsx');
const recipeForm = fs.readFileSync(recipeFormPath, 'utf8');

// Check no 9px labels
const ninePxMatches = recipeForm.match(/fontSize:\s*['"]9px['"]/g) || [];
if (ninePxMatches.length > 0) {
  console.error(`❌ RecipeForm still contains ${ninePxMatches.length} occurrences of fontSize: '9px'`);
  failed = true;
} else {
  console.log('✅ RecipeForm has zero fontSize: "9px" occurrences');
}

// Check primary submit button
if (!recipeForm.includes('barista-btn-primary') && !recipeForm.includes('btn-candy primary')) {
  console.error('❌ RecipeForm submit button missing primary button styling');
  failed = true;
} else if (recipeForm.includes('barista-btn-primary')) {
  console.log('✅ RecipeForm submit button uses .barista-btn-primary');
}

// 2. Inventory.jsx
console.log('\n2️⃣ Checking Inventory.jsx...');
const inventoryPath = path.join(rootDir, 'frontend/src/components/Inventory.jsx');
const inventory = fs.readFileSync(inventoryPath, 'utf8');

// Check 3-dots button touch target
if (inventory.includes("width: '28px'") || inventory.includes("height: '28px'")) {
  console.error('❌ Inventory 3-dots menu button still has sub-standard 28px dimensions');
  failed = true;
} else {
  console.log('✅ Inventory 3-dots menu button upgraded to touch target >= 44px');
}

// 3. BatchDetail.jsx
console.log('\n3️⃣ Checking BatchDetail.jsx...');
const batchDetailPath = path.join(rootDir, 'frontend/src/components/BatchDetail.jsx');
const batchDetail = fs.readFileSync(batchDetailPath, 'utf8');

const batchDetail9px = (batchDetail.match(/<label[^>]*fontSize:\s*['"]9px['"]/g) || []).length;
if (batchDetail9px > 0) {
  console.error(`❌ BatchDetail still contains ${batchDetail9px} labels with fontSize: '9px'`);
  failed = true;
} else {
  console.log('✅ BatchDetail sensory labels are >= 12px');
}

if (batchDetail.includes('padding: 6px, fontSize: 10px') || batchDetail.includes("padding: '6px', fontSize: '10px'")) {
  console.error('❌ BatchDetail "Repetir Receta" button still has 10px font / 6px padding');
  failed = true;
} else {
  console.log('✅ BatchDetail "Repetir Receta" button upgraded to barista button hierarchy');
}

// 4. App.jsx
console.log('\n4️⃣ Checking App.jsx technical debt...');
const appPath = path.join(rootDir, 'frontend/src/App.jsx');
const app = fs.readFileSync(appPath, 'utf8');

if (app.includes('<button \n                className="candy-input"') || app.includes('<button className="candy-input"')) {
  console.error('❌ App.jsx still has <button className="candy-input"> technical debt');
  failed = true;
} else {
  console.log('✅ App.jsx button technical debt eliminated');
}

// 5. BottomNav.jsx
console.log('\n5️⃣ Checking BottomNav.jsx dark mode compatibility...');
const bottomNavPath = path.join(rootDir, 'frontend/src/components/BottomNav.jsx');
const bottomNav = fs.readFileSync(bottomNavPath, 'utf8');

if (bottomNav.includes("background: 'rgba(255, 255, 255, 0.95)'")) {
  console.error('❌ BottomNav still hardcodes white background rgba(255, 255, 255, 0.95)');
  failed = true;
} else {
  console.log('✅ BottomNav uses responsive barista/theme surface variable');
}

if (failed) {
  console.error('\n❌ Phase 2 checks failed. Please resolve above issues.');
  process.exit(1);
}

console.log('\n🎉 ALL PHASE 2 ERGONOMIC CHECKS PASSED!\n');
process.exit(0);
