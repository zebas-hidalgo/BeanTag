// --- BEANTAG AESTHETIC SPECIALTY COFFEE CARD & TICKET GENERATOR 2026/2027 ---
import { stripEmojis } from './scaIcons';
import {
  drawBlueprintBean,
  drawBlueprintDripper,
  drawBlueprintScale,
  drawBlueprintTimer,
  drawNeoPopBean,
  drawNeoPopLightning,
  drawNeoPopStar,
  drawNeoPopFlame,
  drawAuroraCrystalBean,
  drawAuroraWaterDrop,
  drawAuroraWave,
  drawBotanicalBranch,
  drawGooseneckKettle,
  drawRoasterySeal,
  drawMetallicEyelet
} from './ticketIconKits';

/**
 * Normalizes template names into one of the 4 official 2026/2027 styles:
 * 1. 'blueprint': 📐 Technical engineering blueprint / patent drafting
 * 2. 'neobrutalist': ⚡ Tokyo/Berlin streetwear pop roastery with hard shadows
 * 3. 'aurora': 🔮 Apple VisionOS dark obsidian glassmorphism
 * 4. 'hangtag': 🏷️ Nordic atelier cotton tag with metallic eyelet & editorial serif
 */
export function normalizeCardStyle(template) {
  if (!template) return 'blueprint';
  const t = String(template).toLowerCase();
  if (t === 'blueprint' || t === 'receipt' || t === 'craft' || t === 'ticket' || t === 'recibo') return 'blueprint';
  if (t === 'neobrutalist' || t === 'neo' || t === 'brutalist' || t === 'boarding' || t === 'pass') return 'neobrutalist';
  if (t === 'aurora' || t === 'holographic' || t === 'archive' || t === 'dark' || t === 'cyber' || t === 'lab') return 'aurora';
  if (t === 'hangtag' || t === 'editorial' || t === 'minimal' || t === 'nordic' || t === 'atelier') return 'hangtag';
  return 'blueprint';
}

function parseGrindToMicrons(grindText) {
  if (!grindText) return null;
  const str = String(grindText);
  const femoMatch = str.match(/femobook.*?(\d+)\s*clic/i);
  if (femoMatch) return Math.round(parseInt(femoMatch[1]) * 18);
  const comMatch = str.match(/comandante.*?(\d+)\s*clic/i);
  if (comMatch) return Math.round(parseInt(comMatch[1]) * 30);
  const jmaxMatch = str.match(/(\d+)\.(\d+)\.(\d+)/);
  if (jmaxMatch) {
    const rot = parseInt(jmaxMatch[1]) || 0;
    const num = parseInt(jmaxMatch[2]) || 0;
    const click = parseInt(jmaxMatch[3]) || 0;
    return Math.round(((rot * 90) + (num * 10) + click) * 8.8);
  }
  return null;
}

function extractFlavorTags(notesStr) {
  if (!notesStr) return [];
  const str = String(notesStr);
  if (str.includes('[Notas: ') && str.includes(']')) {
    const match = str.match(/\[Notas: (.*?)\]/);
    if (match) {
      return match[1].split(',').map(t => stripEmojis(t.trim())).filter(Boolean);
    }
  }
  if (str.includes(' | ')) {
    return str.split(' | ')[0].split(',').map(t => stripEmojis(t.trim())).filter(Boolean);
  }
  return str.split(',').map(t => stripEmojis(t.trim())).filter(Boolean).slice(0, 5);
}

function drawRoundedRect(ctx, x, y, width, height, radius, fill = true, stroke = false) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

/**
 * Generates an Ultra-Aesthetic Share Card (840 x 580 px @ 2x Retina = 1680 x 1160 px)
 * @param {Object} recipe Recipe or batch data
 * @param {string} template 'blueprint' | 'neobrutalist' | 'aurora' | 'hangtag'
 * @param {boolean} incRecipe Include brew recipe parameters or bean-only
 * @returns {string} Base64 PNG data URL
 */
export function generateRecipeCardImage(recipe, template = 'blueprint', incRecipe = true) {
  const canvas = document.createElement('canvas');
  const scaleFactor = 2;
  const baseW = 840;
  const baseH = 580;

  canvas.width = baseW * scaleFactor;
  canvas.height = baseH * scaleFactor;

  const ctx = canvas.getContext('2d');
  ctx.scale(scaleFactor, scaleFactor);

  const style = normalizeCardStyle(template);

  // Helper text fitters
  const drawTruncatedText = (text, x, y, maxWidth) => {
    const str = String(text || '');
    if (!maxWidth || ctx.measureText(str).width <= maxWidth) {
      ctx.fillText(str, x, y);
      return;
    }
    let truncated = str;
    while (truncated.length > 0 && ctx.measureText(truncated + '…').width > maxWidth) {
      truncated = truncated.slice(0, -1);
    }
    ctx.fillText(truncated + '…', x, y);
  };

  const drawFittedText = (text, x, y, maxWidth, initialSize = 24, fontName = 'Space Grotesk, sans-serif', weight = '800') => {
    const str = String(text || '');
    let size = initialSize;
    ctx.font = `${weight} ${size}px ${fontName}`;
    while (ctx.measureText(str).width > maxWidth && size > 14) {
      size -= 1;
      ctx.font = `${weight} ${size}px ${fontName}`;
    }
    ctx.fillText(str, x, y);
  };

  // Extract variables
  const coffeeName = stripEmojis(recipe.batch_name || recipe.coffee_name || 'Café de Especialidad');
  const origin = stripEmojis(recipe.origin || 'Origen Desconocido');
  const roaster = stripEmojis(recipe.roaster || 'Tostaduría Artesanal');
  const process = stripEmojis(recipe.process || 'Lavado');
  const variety = stripEmojis(recipe.variety || 'Heirloom');
  const altitude = recipe.altitude ? `${recipe.altitude}m` : '1.850m';
  const notesStr = recipe.flavor_notes || recipe.notes || 'Notas limpias, balance y dulzor';
  const flavorTags = extractFlavorTags(notesStr);
  const scaScore = recipe.sca_score || recipe.score || 88.5;

  const methodStr = stripEmojis(recipe.method || 'V60');
  const coffeeG = recipe.coffee_grams || 15;
  const waterG = recipe.water_grams || 225;
  const ratioStr = recipe.ratio || `1:${(waterG / (coffeeG || 1)).toFixed(1)}`;
  const grindStr = stripEmojis(recipe.grind_size || 'Medio-Fino');
  const microns = parseGrindToMicrons(grindStr);
  const tempStr = recipe.temp ? `${recipe.temp}°C` : '93°C';
  const timeStr = recipe.time ? `${recipe.time}` : '02:45';

  const paddingX = 36;
  const paddingY = 32;
  const availW = baseW - (paddingX * 2);

  // =========================================================================
  // 1. STYLE: BLUEPRINT TÉCNICO
  // =========================================================================
  if (style === 'blueprint') {
    // Deep Cyanotype Background
    ctx.fillStyle = '#07192F';
    ctx.fillRect(0, 0, baseW, baseH);

    // Millimeter Grid
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.lineWidth = 1;
    const gridSize = 20;
    ctx.beginPath();
    for (let x = 0; x <= baseW; x += gridSize) { ctx.moveTo(x, 0); ctx.lineTo(x, baseH); }
    for (let y = 0; y <= baseH; y += gridSize) { ctx.moveTo(0, y); ctx.lineTo(baseW, y); }
    ctx.stroke();

    // Outer Technical Border
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(paddingX - 10, paddingY - 10, availW + 20, baseH - (paddingY * 2) + 20);

    // Header Left
    ctx.fillStyle = '#38BDF8';
    ctx.font = '700 8.5px "JetBrains Mono", monospace';
    ctx.fillText(`// PATENT SPEC: COFFEA ARABICA VAR. ${variety.toUpperCase()}`, paddingX, paddingY + 12);

    ctx.fillStyle = '#FFFFFF';
    drawFittedText(coffeeName.toUpperCase(), paddingX, paddingY + 40, availW - 140, 24, '"JetBrains Mono", monospace', '900');

    ctx.fillStyle = '#93C5FD';
    ctx.font = '700 11px "JetBrains Mono", monospace';
    ctx.fillText(`${origin.toUpperCase()} • ${process.toUpperCase()} • ${altitude} • ROAST: ${roaster.toUpperCase()}`, paddingX, paddingY + 60);

    // Header Right: Patent Bean Box
    const beanBoxW = 105;
    const beanBoxH = 58;
    const beanBoxX = baseW - paddingX - beanBoxW;
    const beanBoxY = paddingY;

    ctx.fillStyle = 'rgba(56, 189, 248, 0.06)';
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1.2;
    drawRoundedRect(ctx, beanBoxX, beanBoxY, beanBoxW, beanBoxH, 6, true, true);

    drawBlueprintBean(ctx, beanBoxX + 52, beanBoxY + 24, 30, '#38BDF8');

    ctx.fillStyle = '#4ADE80';
    ctx.font = '800 8.5px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`SCA: ${scaScore}★ [PASSED]`, beanBoxX + 52, beanBoxY + 50);
    ctx.textAlign = 'left';

    // Divider
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(paddingX, paddingY + 76);
    ctx.lineTo(baseW - paddingX, paddingY + 76);
    ctx.stroke();

    // Body: Recipe vs Bean Only
    if (incRecipe) {
      // 4 Metric Boxes
      const metricY = paddingY + 92;
      const cols = 4;
      const gap = 12;
      const colW = (availW - (gap * (cols - 1))) / cols;
      const colH = 68;

      const metrics = [
        { lbl: 'MÉTODO CAD', val: methodStr.toUpperCase(), sub: 'CONICAL 60°' },
        { lbl: 'DOSIS IN/OUT', val: `${coffeeG}g → ${waterG}g`, sub: `RATIO ${ratioStr}` },
        { lbl: 'MOLIENDA', val: microns ? `${microns} µm` : grindStr.toUpperCase(), sub: 'CALIBRATED' },
        { lbl: 'TIEMPO/TEMP', val: `${timeStr} min`, sub: tempStr }
      ];

      metrics.forEach((m, i) => {
        const x = paddingX + i * (colW + gap);
        ctx.fillStyle = 'rgba(14, 165, 233, 0.08)';
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 1;
        drawRoundedRect(ctx, x, metricY, colW, colH, 6, true, true);

        ctx.fillStyle = '#7DD3FC';
        ctx.font = '800 8.5px "JetBrains Mono", monospace';
        ctx.fillText(m.lbl, x + 10, metricY + 18);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 13.5px "JetBrains Mono", monospace';
        drawTruncatedText(m.val, x + 10, metricY + 40, colW - 20);

        ctx.fillStyle = '#38BDF8';
        ctx.font = '700 8px "JetBrains Mono", monospace';
        ctx.fillText(m.sub, x + 10, metricY + 56);
      });

      // Pour Timeline Progress Bar
      const flowY = metricY + colH + 16;
      ctx.fillStyle = 'rgba(14, 165, 233, 0.05)';
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      drawRoundedRect(ctx, paddingX, flowY, availW, 56, 6, true, true);
      ctx.setLineDash([]);

      ctx.fillStyle = '#7DD3FC';
      ctx.font = '700 9px "JetBrains Mono", monospace';
      ctx.fillText('BLOOM (0:00): 45g', paddingX + 16, flowY + 18);
      ctx.fillText('VERTIDO 2 (0:45): +90g', paddingX + 180, flowY + 18);
      ctx.fillText('VERTIDO 3 (1:30): +90g', paddingX + 380, flowY + 18);
      ctx.fillStyle = '#4ADE80';
      ctx.fillText(`TOTAL: ${waterG}g (${ratioStr})`, paddingX + availW - 140, flowY + 18);

      // Progress bar
      const barY = flowY + 30;
      const barW = availW - 32;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
      drawRoundedRect(ctx, paddingX + 16, barY, barW, 10, 5, true, false);

      ctx.fillStyle = '#38BDF8';
      drawRoundedRect(ctx, paddingX + 16, barY, barW * 0.2, 10, 5, true, false);
      ctx.fillStyle = '#60A5FA';
      drawRoundedRect(ctx, paddingX + 16 + (barW * 0.2), barY, barW * 0.4, 10, 5, true, false);
      ctx.fillStyle = '#93C5FD';
      drawRoundedRect(ctx, paddingX + 16 + (barW * 0.6), barY, barW * 0.4, 10, 5, true, false);

      // Sensory Descriptors
      const notesY = flowY + 72;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.05)';
      ctx.fillRect(paddingX, notesY, availW, 46);
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(paddingX, notesY, 4, 46);

      ctx.fillStyle = '#7DD3FC';
      ctx.font = '800 8.5px "JetBrains Mono", monospace';
      ctx.fillText('SENSORY DESCRIPTORS & TASTING PROFILE:', paddingX + 14, notesY + 16);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 12.5px "JetBrains Mono", monospace';
      const cleanNotes = flavorTags.length > 0 ? flavorTags.join(' • ') : notesStr;
      drawTruncatedText(cleanNotes, paddingX + 14, notesY + 35, availW - 28);

    } else {
      // Bean Only layout with 4 big blocks
      const specY = paddingY + 100;
      const specH = 80;
      const specW = (availW - 16) / 2;

      const specs = [
        { lbl: 'VARIETAL & TAXONOMY', val: `${variety.toUpperCase()} (ARABICA)`, sub: 'DENSIDAD: 0.72 g/ml' },
        { lbl: 'TERROIR & ALTITUD', val: `${origin.toUpperCase()}`, sub: `ELEVACIÓN: ${altitude}` },
        { lbl: 'BENEFICIO & FERMENTO', val: `${process.toUpperCase()}`, sub: 'REPOSADO CAVA' },
        { lbl: 'PERFIL DE TUESTE', val: `${roaster.toUpperCase()}`, sub: 'DESARROLLO ÓPTIMO' }
      ];

      specs.forEach((s, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const x = paddingX + col * (specW + 16);
        const y = specY + row * (specH + 16);

        ctx.fillStyle = 'rgba(14, 165, 233, 0.08)';
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 1;
        drawRoundedRect(ctx, x, y, specW, specH, 6, true, true);

        ctx.fillStyle = '#7DD3FC';
        ctx.font = '800 9px "JetBrains Mono", monospace';
        ctx.fillText(s.lbl, x + 14, y + 22);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 15px "JetBrains Mono", monospace';
        drawTruncatedText(s.val, x + 14, y + 48, specW - 28);

        ctx.fillStyle = '#38BDF8';
        ctx.font = '700 9.5px "JetBrains Mono", monospace';
        ctx.fillText(s.sub, x + 14, y + 66);
      });

      // Notes
      const notesY = specY + (specH * 2) + 36;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.05)';
      ctx.fillRect(paddingX, notesY, availW, 50);
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(paddingX, notesY, 4, 50);

      ctx.fillStyle = '#7DD3FC';
      ctx.font = '800 9px "JetBrains Mono", monospace';
      ctx.fillText('SENSORY NOTES:', paddingX + 14, notesY + 18);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 13.5px "JetBrains Mono", monospace';
      const cleanNotes = flavorTags.length > 0 ? flavorTags.join(' • ') : notesStr;
      drawTruncatedText(cleanNotes, paddingX + 14, notesY + 38, availW - 28);
    }

    // Architectural Title Block (Cajetín) at Bottom
    const titleBlockY = baseH - paddingY - 46;
    ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1.5;
    drawRoundedRect(ctx, paddingX, titleBlockY, availW, 46, 4, true, true);

    const c1W = availW * 0.52;
    const c2W = availW * 0.28;

    ctx.beginPath();
    ctx.moveTo(paddingX + c1W, titleBlockY);
    ctx.lineTo(paddingX + c1W, titleBlockY + 46);
    ctx.moveTo(paddingX + c1W + c2W, titleBlockY);
    ctx.lineTo(paddingX + c1W + c2W, titleBlockY + 46);
    ctx.stroke();

    ctx.fillStyle = '#7DD3FC';
    ctx.font = '700 8px "JetBrains Mono", monospace';
    ctx.fillText('DRAWING TITLE:', paddingX + 10, titleBlockY + 16);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 11px "JetBrains Mono", monospace';
    ctx.fillText('BEANTAG SPECIALTY BREW CALIBRATION CAD', paddingX + 10, titleBlockY + 34);

    ctx.fillStyle = '#7DD3FC';
    ctx.font = '700 8px "JetBrains Mono", monospace';
    ctx.fillText('DWG CODE:', paddingX + c1W + 10, titleBlockY + 16);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 11px "JetBrains Mono", monospace';
    ctx.fillText(`CAD-BT-${Date.now().toString(36).toUpperCase()}`, paddingX + c1W + 10, titleBlockY + 34);

    ctx.fillStyle = '#7DD3FC';
    ctx.font = '700 8px "JetBrains Mono", monospace';
    ctx.fillText('APPROVED:', paddingX + c1W + c2W + 10, titleBlockY + 16);
    ctx.fillStyle = '#4ADE80';
    ctx.font = '900 11px "JetBrains Mono", monospace';
    ctx.fillText('PASSED ✓', paddingX + c1W + c2W + 10, titleBlockY + 34);
  }

  // =========================================================================
  // 2. STYLE: NEO-BRUTALIST POP
  // =========================================================================
  else if (style === 'neobrutalist') {
    // Canvas background
    ctx.fillStyle = '#E5E7EB';
    ctx.fillRect(0, 0, baseW, baseH);

    // Hard drop shadow for card
    ctx.fillStyle = '#111827';
    drawRoundedRect(ctx, paddingX + 6, paddingY + 6, availW, baseH - (paddingY * 2), 10, true, false);

    // Main Card Body
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2.5;
    drawRoundedRect(ctx, paddingX, paddingY, availW, baseH - (paddingY * 2), 10, true, true);

    // Top Badges
    const badgeY = paddingY + 22;
    // Left Pop Badge: Acid Lime
    ctx.fillStyle = '#111827';
    ctx.fillRect(paddingX + 22, badgeY + 2.5, 145, 26);
    ctx.fillStyle = '#E2F952';
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2;
    ctx.fillRect(paddingX + 20, badgeY, 145, 26);
    ctx.strokeRect(paddingX + 20, badgeY, 145, 26);

    drawNeoPopLightning(ctx, paddingX + 34, badgeY + 13, 18);
    ctx.fillStyle = '#111827';
    ctx.font = '900 10.5px "Space Grotesk", sans-serif';
    ctx.fillText('MICRO-LOTE SPEC', paddingX + 48, badgeY + 17);

    // Right Pop Badge: Safety Orange
    const scoreBadgeW = 125;
    const scoreBadgeX = baseW - paddingX - 20 - scoreBadgeW;
    ctx.fillStyle = '#111827';
    ctx.fillRect(scoreBadgeX + 2.5, badgeY + 2.5, scoreBadgeW, 26);
    ctx.fillStyle = '#FF4B26';
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2;
    ctx.fillRect(scoreBadgeX, badgeY, scoreBadgeW, 26);
    ctx.strokeRect(scoreBadgeX, badgeY, scoreBadgeW, 26);

    drawNeoPopStar(ctx, scoreBadgeX + 18, badgeY + 13, 16);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 11px "Space Grotesk", sans-serif';
    ctx.fillText(`SCA ${scaScore} ★`, scoreBadgeX + 32, badgeY + 17);

    // Main Title
    const titleY = badgeY + 62;
    ctx.fillStyle = '#111827';
    drawFittedText(coffeeName.toUpperCase(), paddingX + 20, titleY, availW - 40, 30, '"Space Grotesk", sans-serif', '900');

    ctx.fillStyle = '#4B5563';
    ctx.font = '800 12.5px "Space Grotesk", sans-serif';
    ctx.fillText(`${origin.toUpperCase()} • ${process.toUpperCase()} • ${roaster.toUpperCase()} • ${altitude}`, paddingX + 20, titleY + 22);

    // Bento Grid Metrics
    const bentoY = titleY + 40;
    if (incRecipe) {
      const bCols = 3;
      const bGap = 14;
      const bColW = (availW - 40 - (bGap * (bCols - 1))) / bCols;
      const bColH = 76;

      const bItems = [
        { lbl: 'RATIO', val: ratioStr, bg: '#F8FAFC' },
        { lbl: 'DOSIS', val: `${coffeeG}g → ${waterG}g`, bg: '#F8FAFC' },
        { lbl: 'TIEMPO', val: `${timeStr} min`, bg: '#E2F952' }
      ];

      bItems.forEach((b, i) => {
        const x = paddingX + 20 + i * (bColW + bGap);
        // Hard shadow
        ctx.fillStyle = '#111827';
        ctx.fillRect(x + 3, bentoY + 3, bColW, bColH);

        // Box
        ctx.fillStyle = b.bg;
        ctx.strokeStyle = '#111827';
        ctx.lineWidth = 2;
        ctx.fillRect(x, bentoY, bColW, bColH);
        ctx.strokeRect(x, bentoY, bColW, bColH);

        ctx.fillStyle = '#64748B';
        ctx.font = '900 9.5px "Space Grotesk", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(b.lbl, x + (bColW / 2), bentoY + 24);

        ctx.fillStyle = '#111827';
        ctx.font = '900 18px "Space Grotesk", sans-serif';
        ctx.fillText(b.val, x + (bColW / 2), bentoY + 54);
        ctx.textAlign = 'left';
      });

      // Flavor Tags (Pop Pills)
      const pillsY = bentoY + bColH + 24;
      let curPillX = paddingX + 20;
      const tags = flavorTags.length > 0 ? flavorTags : ['Fresa Salvaje', 'Melocotón', 'Vainilla Bourbon'];

      tags.forEach((tag, idx) => {
        const tagText = tag.trim();
        ctx.font = '800 11px "Space Grotesk", sans-serif';
        const tw = ctx.measureText(tagText).width + 28;
        if (curPillX + tw > baseW - paddingX - 20) return;

        // Shadow
        ctx.fillStyle = '#111827';
        drawRoundedRect(ctx, curPillX + 2.5, pillsY + 2.5, tw, 28, 14, true, false);

        // Pill
        const colors = ['#FEE2E2', '#FEF3C7', '#EDE9FE', '#DCFCE7'];
        ctx.fillStyle = colors[idx % colors.length];
        ctx.strokeStyle = '#111827';
        ctx.lineWidth = 1.8;
        drawRoundedRect(ctx, curPillX, pillsY, tw, 28, 14, true, true);

        ctx.fillStyle = '#111827';
        ctx.fillText(tagText, curPillX + 14, pillsY + 18);
        curPillX += tw + 10;
      });

    } else {
      // Bean Only Bento
      const bCols = 3;
      const bGap = 14;
      const bColW = (availW - 40 - (bGap * (bCols - 1))) / bCols;
      const bColH = 80;

      const bItems = [
        { lbl: 'VARIETAL', val: variety.toUpperCase(), bg: '#F8FAFC' },
        { lbl: 'BENEFICIO', val: process.toUpperCase(), bg: '#F8FAFC' },
        { lbl: 'ELEVACIÓN', val: altitude, bg: '#E2F952' }
      ];

      bItems.forEach((b, i) => {
        const x = paddingX + 20 + i * (bColW + bGap);
        ctx.fillStyle = '#111827';
        ctx.fillRect(x + 3, bentoY + 3, bColW, bColH);

        ctx.fillStyle = b.bg;
        ctx.strokeStyle = '#111827';
        ctx.lineWidth = 2;
        ctx.fillRect(x, bentoY, bColW, bColH);
        ctx.strokeRect(x, bentoY, bColW, bColH);

        ctx.fillStyle = '#64748B';
        ctx.font = '900 9.5px "Space Grotesk", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(b.lbl, x + (bColW / 2), bentoY + 26);

        ctx.fillStyle = '#111827';
        ctx.font = '900 16px "Space Grotesk", sans-serif';
        ctx.fillText(b.val, x + (bColW / 2), bentoY + 56);
        ctx.textAlign = 'left';
      });

      // Notes
      const notesY = bentoY + bColH + 24;
      ctx.fillStyle = '#F8FAFC';
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 2;
      drawRoundedRect(ctx, paddingX + 20, notesY, availW - 40, 36, 6, true, true);

      ctx.fillStyle = '#111827';
      ctx.font = '800 12px "Space Grotesk", sans-serif';
      drawTruncatedText(`NOTAS: ${notesStr}`, paddingX + 32, notesY + 23, availW - 64);
    }

    // Bottom Barcode Strip
    const footerY = baseH - paddingY - 50;
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(paddingX + 20, footerY);
    ctx.lineTo(baseW - paddingX - 20, footerY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Real POS Barcode
    const barPattern = [3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 4, 1, 3, 1, 2, 4];
    let curBx = paddingX + 20;
    ctx.fillStyle = '#111827';
    barPattern.forEach((w, i) => {
      if (i % 2 === 0) {
        ctx.fillRect(curBx, footerY + 12, w * 2.5, 24);
      }
      curBx += (w * 2.5) + 2;
    });

    ctx.fillStyle = '#64748B';
    ctx.font = '800 8.5px monospace';
    ctx.fillText('BEANTAG • TOKYO SPEC 2027', paddingX + 20, footerY + 44);

    // Certified Badge Right
    const certW = 160;
    const certX = baseW - paddingX - 20 - certW;
    ctx.fillStyle = '#111827';
    ctx.fillRect(certX, footerY + 12, certW, 28);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 10.5px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('AUTHENTIC SPECIALTY ✓', certX + (certW / 2), footerY + 30);
    ctx.textAlign = 'left';
  }

  // =========================================================================
  // 3. STYLE: HOLOGRAPHIC AURORA
  // =========================================================================
  else if (style === 'aurora') {
    // Obsidian Dark Base
    ctx.fillStyle = '#08090E';
    ctx.fillRect(0, 0, baseW, baseH);

    // Radial Aurora Glows
    const grad1 = ctx.createRadialGradient(baseW * 0.85, baseH * 0.2, 0, baseW * 0.85, baseH * 0.2, 320);
    grad1.addColorStop(0, 'rgba(139, 92, 246, 0.38)');
    grad1.addColorStop(1, 'rgba(139, 92, 246, 0)');
    ctx.fillStyle = grad1;
    ctx.fillRect(0, 0, baseW, baseH);

    const grad2 = ctx.createRadialGradient(baseW * 0.15, baseH * 0.8, 0, baseW * 0.15, baseH * 0.8, 280);
    grad2.addColorStop(0, 'rgba(6, 182, 212, 0.28)');
    grad2.addColorStop(1, 'rgba(6, 182, 212, 0)');
    ctx.fillStyle = grad2;
    ctx.fillRect(0, 0, baseW, baseH);

    // Outer Frosted Glass Container
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, paddingX, paddingY, availW, baseH - (paddingY * 2), 12, true, true);

    // Header Left
    drawAuroraCrystalBean(ctx, paddingX + 36, paddingY + 44, 28);

    ctx.fillStyle = '#A5B4FC';
    ctx.font = '800 9px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('SPECIALTY CRYO VAULT // 2027', paddingX + 70, paddingY + 30);

    ctx.fillStyle = '#FFFFFF';
    drawFittedText(coffeeName, paddingX + 70, paddingY + 54, availW - 220, 26, '-apple-system, BlinkMacSystemFont, sans-serif', '800');

    ctx.fillStyle = '#94A3B8';
    ctx.font = '600 11.5px -apple-system, sans-serif';
    ctx.fillText(`${origin} • ${process} • ${altitude}`, paddingX + 70, paddingY + 74);

    // Header Right: Holographic Score Pill
    const pillW = 120;
    const pillH = 32;
    const pillX = baseW - paddingX - 24 - pillW;
    const pillY = paddingY + 32;

    const pillGrad = ctx.createLinearGradient(pillX, pillY, pillX + pillW, pillY + pillH);
    pillGrad.addColorStop(0, '#EC4899');
    pillGrad.addColorStop(1, '#8B5CF6');

    ctx.fillStyle = pillGrad;
    ctx.shadowColor = 'rgba(236, 72, 153, 0.4)';
    ctx.shadowBlur = 14;
    drawRoundedRect(ctx, pillX, pillY, pillW, pillH, 16, true, false);
    ctx.shadowColor = 'transparent';

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 12.5px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${scaScore} PTS ★`, pillX + (pillW / 2), pillY + 20);
    ctx.textAlign = 'left';

    // Body: 3 Glass Cards
    const glassY = paddingY + 112;
    if (incRecipe) {
      const gCols = 3;
      const gGap = 14;
      const gColW = (availW - 48 - (gGap * (gCols - 1))) / gCols;
      const gColH = 92;

      const gItems = [
        { lbl: 'MÉTODO', val: methodStr, sub: `RATIO ${ratioStr}`, color: '#38BDF8' },
        { lbl: 'MOLIENDA', val: microns ? `${microns} µm` : grindStr, sub: 'PRECISIÓN', color: '#F472B6' },
        { lbl: 'AGUA', val: tempStr, sub: '80 PPM MINERAL', color: '#A78BFA' }
      ];

      gItems.forEach((g, i) => {
        const x = paddingX + 24 + i * (gColW + gGap);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1;
        drawRoundedRect(ctx, x, glassY, gColW, gColH, 10, true, true);

        ctx.fillStyle = '#94A3B8';
        ctx.font = '700 8.5px -apple-system, sans-serif';
        ctx.fillText(g.lbl, x + 16, glassY + 22);

        ctx.fillStyle = g.color;
        ctx.font = '800 17px -apple-system, sans-serif';
        drawTruncatedText(g.val, x + 16, glassY + 52, gColW - 32);

        ctx.fillStyle = '#E2E8F0';
        ctx.font = '600 9.5px -apple-system, sans-serif';
        ctx.fillText(g.sub, x + 16, glassY + 74);
      });

      // Sensory Glass Bar
      const sensY = glassY + gColH + 20;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, paddingX + 24, sensY, availW - 48, 54, 8, true, true);

      drawAuroraWave(ctx, paddingX + 44, sensY + 27, 28);

      ctx.fillStyle = '#F1F5F9';
      ctx.font = '600 12.5px -apple-system, sans-serif';
      const cNotes = flavorTags.length > 0 ? flavorTags.join(' • ') : notesStr;
      drawTruncatedText(cNotes, paddingX + 70, sensY + 32, availW - 250);

      ctx.fillStyle = 'rgba(52, 211, 153, 0.15)';
      ctx.strokeStyle = '#34D399';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, baseW - paddingX - 160, sensY + 14, 136, 26, 6, true, true);

      ctx.fillStyle = '#34D399';
      ctx.font = '800 9.5px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('EXTRACCIÓN ÓPTIMA', baseW - paddingX - 92, sensY + 31);
      ctx.textAlign = 'left';

    } else {
      // Bean Only Glass Cards
      const gCols = 3;
      const gGap = 14;
      const gColW = (availW - 48 - (gGap * (gCols - 1))) / gCols;
      const gColH = 92;

      const gItems = [
        { lbl: 'VARIETAL', val: variety, sub: 'ARABICA HEIRLOOM', color: '#38BDF8' },
        { lbl: 'BENEFICIO', val: process, sub: 'CRYO REPOSADO', color: '#F472B6' },
        { lbl: 'ELEVACIÓN', val: altitude, sub: 'HIGH ALTITUDE', color: '#A78BFA' }
      ];

      gItems.forEach((g, i) => {
        const x = paddingX + 24 + i * (gColW + gGap);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1;
        drawRoundedRect(ctx, x, glassY, gColW, gColH, 10, true, true);

        ctx.fillStyle = '#94A3B8';
        ctx.font = '700 8.5px -apple-system, sans-serif';
        ctx.fillText(g.lbl, x + 16, glassY + 22);

        ctx.fillStyle = g.color;
        ctx.font = '800 17px -apple-system, sans-serif';
        drawTruncatedText(g.val, x + 16, glassY + 52, gColW - 32);

        ctx.fillStyle = '#E2E8F0';
        ctx.font = '600 9.5px -apple-system, sans-serif';
        ctx.fillText(g.sub, x + 16, glassY + 74);
      });

      // Notes
      const sensY = glassY + gColH + 20;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, paddingX + 24, sensY, availW - 48, 54, 8, true, true);

      drawAuroraWaterDrop(ctx, paddingX + 44, sensY + 27, 24);

      ctx.fillStyle = '#F1F5F9';
      ctx.font = '600 13px -apple-system, sans-serif';
      drawTruncatedText(`NOTAS: ${notesStr}`, paddingX + 70, sensY + 33, availW - 120);
    }

    // Footer
    const footerY = baseH - paddingY - 34;
    ctx.fillStyle = '#A5B4FC';
    ctx.font = '700 10px "JetBrains Mono", monospace';
    ctx.fillText(`★ BEANTAG AURORA VAULT // ${roaster.toUpperCase()} // HIGH-DPI RETINA ★`, paddingX + 24, footerY + 16);
  }

  // =========================================================================
  // 4. STYLE: HANGTAG NÓRDICO (ATELIER SEY)
  // =========================================================================
  else if (style === 'hangtag') {
    // Ivory cotton paper background
    ctx.fillStyle = '#FAF7F2';
    ctx.fillRect(0, 0, baseW, baseH);

    // Outer subtle card border
    ctx.strokeStyle = '#E7E5E4';
    ctx.lineWidth = 1.5;
    drawRoundedRect(ctx, paddingX, paddingY, availW, baseH - (paddingY * 2), 12, false, true);

    // Realistic Metallic Eyelet Top Center
    drawMetallicEyelet(ctx, baseW / 2, paddingY + 22, 11);

    // Centered Atelier Header
    const headY = paddingY + 54;
    ctx.fillStyle = '#78716C';
    ctx.font = '700 8.5px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SPECIALTY ROASTERY ARCHIVE // NORDIC ATELIER', baseW / 2, headY);

    ctx.fillStyle = '#1C1917';
    ctx.font = 'bold 26px Georgia, serif';
    drawTruncatedText(coffeeName, baseW / 2, headY + 34, availW - 120);

    ctx.fillStyle = '#78716C';
    ctx.font = '600 11.5px -apple-system, sans-serif';
    ctx.fillText(`${origin} • ${variety} • ${altitude} • ${process}`, baseW / 2, headY + 56);
    ctx.textAlign = 'left';

    // Divider
    ctx.strokeStyle = '#E7E5E4';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(paddingX + 36, headY + 74);
    ctx.lineTo(baseW - paddingX - 36, headY + 74);
    ctx.stroke();

    // Body: Recipe vs Bean Only
    const bodyY = headY + 96;

    if (incRecipe) {
      // Horizontal 4-metric columns with vertical dividers
      const mCols = 4;
      const mW = (availW - 72) / mCols;

      const mData = [
        { lbl: 'MÉTODO', val: methodStr },
        { lbl: 'RATIO', val: ratioStr },
        { lbl: 'MOLIENDA', val: microns ? `${microns} µm` : grindStr },
        { lbl: 'EXTRACCIÓN', val: `${timeStr} min` }
      ];

      mData.forEach((m, idx) => {
        const x = paddingX + 36 + idx * mW;
        ctx.fillStyle = '#A8A29E';
        ctx.font = '700 8px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(m.lbl, x + (mW / 2), bodyY + 12);

        ctx.fillStyle = '#44403C';
        ctx.font = '800 15px -apple-system, sans-serif';
        ctx.fillText(m.val, x + (mW / 2), bodyY + 36);

        // Divider
        if (idx < mCols - 1) {
          ctx.strokeStyle = '#E7E5E4';
          ctx.beginPath();
          ctx.moveTo(x + mW, bodyY);
          ctx.lineTo(x + mW, bodyY + 44);
          ctx.stroke();
        }
      });
      ctx.textAlign = 'left';

      // Botanical Quote Box
      const quoteY = bodyY + 66;
      ctx.fillStyle = '#F5F3EF';
      ctx.strokeStyle = '#E7E5E4';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, paddingX + 36, quoteY, availW - 72, 60, 8, true, true);

      drawBotanicalBranch(ctx, paddingX + 58, quoteY + 30, 26, '#44403C');

      ctx.fillStyle = '#57534E';
      ctx.font = 'italic 13px Georgia, serif';
      const cNotes = flavorTags.length > 0 ? `“${flavorTags.join(', ')}”` : `“${notesStr}”`;
      drawTruncatedText(cNotes, paddingX + 86, quoteY + 36, availW - 150);

    } else {
      // Bean Only Specs
      const mCols = 3;
      const mW = (availW - 72) / mCols;

      const mData = [
        { lbl: 'VARIEDAD', val: variety },
        { lbl: 'BENEFICIO', val: process },
        { lbl: 'ELEVACIÓN', val: altitude }
      ];

      mData.forEach((m, idx) => {
        const x = paddingX + 36 + idx * mW;
        ctx.fillStyle = '#A8A29E';
        ctx.font = '700 8px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(m.lbl, x + (mW / 2), bodyY + 14);

        ctx.fillStyle = '#44403C';
        ctx.font = '800 16px -apple-system, sans-serif';
        ctx.fillText(m.val, x + (mW / 2), bodyY + 40);

        if (idx < mCols - 1) {
          ctx.strokeStyle = '#E7E5E4';
          ctx.beginPath();
          ctx.moveTo(x + mW, bodyY);
          ctx.lineTo(x + mW, bodyY + 48);
          ctx.stroke();
        }
      });
      ctx.textAlign = 'left';

      // Botanical Quote Box
      const quoteY = bodyY + 74;
      ctx.fillStyle = '#F5F3EF';
      ctx.strokeStyle = '#E7E5E4';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, paddingX + 36, quoteY, availW - 72, 64, 8, true, true);

      drawBotanicalBranch(ctx, paddingX + 58, quoteY + 32, 28, '#44403C');

      ctx.fillStyle = '#57534E';
      ctx.font = 'italic 13.5px Georgia, serif';
      drawTruncatedText(`“${notesStr}”`, paddingX + 86, quoteY + 38, availW - 150);
    }

    // Footer with Roastery Seal
    const footY = baseH - paddingY - 50;
    ctx.fillStyle = '#78716C';
    ctx.font = '600 9.5px -apple-system, sans-serif';
    ctx.fillText(`SERIE: BT-${Date.now().toString(36).toUpperCase()} // ${roaster}`, paddingX + 36, footY + 28);

    drawRoasterySeal(ctx, baseW - paddingX - 120, footY + 24, 16);

    ctx.fillStyle = '#3F6212';
    ctx.font = '800 10.5px -apple-system, sans-serif';
    ctx.fillText(`SCA ${scaScore} PASSED`, baseW - paddingX - 94, footY + 28);
  }

  return canvas.toDataURL('image/png', 1.0);
}

/**
 * Generates an Ultra-Aesthetic Freezer / Cellar Inventory Menu Card
 * @param {Array} batches List of coffee batches
 * @param {string} template 'blueprint' | 'neobrutalist' | 'aurora' | 'hangtag'
 * @returns {string} Base64 PNG data URL
 */
export function generateCoffeeMenuCardImage(batches = [], template = 'blueprint') {
  const canvas = document.createElement('canvas');
  const scaleFactor = 2;
  const baseW = 840;
  const baseH = 580;

  canvas.width = baseW * scaleFactor;
  canvas.height = baseH * scaleFactor;

  const ctx = canvas.getContext('2d');
  ctx.scale(scaleFactor, scaleFactor);

  const style = normalizeCardStyle(template);
  const displayList = batches.slice(0, 7);

  const paddingX = 36;
  const paddingY = 32;
  const availW = baseW - (paddingX * 2);

  // 1. BLUEPRINT MENU
  if (style === 'blueprint') {
    ctx.fillStyle = '#07192F';
    ctx.fillRect(0, 0, baseW, baseH);

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= baseW; x += 20) { ctx.moveTo(x, 0); ctx.lineTo(x, baseH); }
    for (let y = 0; y <= baseH; y += 20) { ctx.moveTo(0, y); ctx.lineTo(baseW, y); }
    ctx.stroke();

    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(paddingX - 8, paddingY - 8, availW + 16, baseH - (paddingY * 2) + 16);

    ctx.fillStyle = '#38BDF8';
    ctx.font = '700 9px "JetBrains Mono", monospace';
    ctx.fillText('// BEANTAG CRYO INVENTORY DWG // CELLAR MENU', paddingX, paddingY + 12);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 22px "JetBrains Mono", monospace';
    ctx.fillText('CARTA DE CAFÉS DE ESPECIALIDAD', paddingX, paddingY + 38);

    // List
    let rowY = paddingY + 70;
    const rowH = 46;

    displayList.forEach((b, i) => {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(56, 189, 248, 0.05)' : 'rgba(56, 189, 248, 0.02)';
      ctx.fillRect(paddingX, rowY, availW, rowH - 6);

      ctx.fillStyle = '#38BDF8';
      ctx.font = '800 11px "JetBrains Mono", monospace';
      ctx.fillText(`0${i + 1}.`, paddingX + 12, rowY + 26);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 13px "JetBrains Mono", monospace';
      const name = stripEmojis(b.batch_name || b.coffee_name || 'Café');
      ctx.fillText(name.toUpperCase(), paddingX + 44, rowY + 26);

      ctx.fillStyle = '#93C5FD';
      ctx.font = '700 9.5px "JetBrains Mono", monospace';
      const meta = `${stripEmojis(b.origin || '')} • ${stripEmojis(b.process || '')} • ${b.weight_current_g || 0}g`;
      ctx.fillText(meta.toUpperCase(), paddingX + 380, rowY + 26);

      ctx.fillStyle = '#4ADE80';
      ctx.font = '800 10.5px "JetBrains Mono", monospace';
      ctx.fillText(`SCA ${b.sca_score || 88.5}★`, paddingX + availW - 90, rowY + 26);

      rowY += rowH;
    });

    // Footer
    const footY = baseH - paddingY - 32;
    ctx.fillStyle = '#7DD3FC';
    ctx.font = '700 9px "JetBrains Mono", monospace';
    ctx.fillText(`TOTAL LOTES EN INVENTARIO: ${displayList.length} // GESTIÓN INTELIGENTE CON BEANTAG.APP`, paddingX, footY + 16);
  }

  // 2. NEO-BRUTALIST MENU
  else if (style === 'neobrutalist') {
    ctx.fillStyle = '#E5E7EB';
    ctx.fillRect(0, 0, baseW, baseH);

    ctx.fillStyle = '#111827';
    drawRoundedRect(ctx, paddingX + 5, paddingY + 5, availW, baseH - (paddingY * 2), 10, true, false);

    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2.5;
    drawRoundedRect(ctx, paddingX, paddingY, availW, baseH - (paddingY * 2), 10, true, true);

    ctx.fillStyle = '#111827';
    ctx.font = '900 24px "Space Grotesk", sans-serif';
    ctx.fillText('CRYO COFFEE VAULT • MENÚ', paddingX + 24, paddingY + 40);

    ctx.fillStyle = '#FF4B26';
    ctx.font = '900 10.5px "Space Grotesk", sans-serif';
    ctx.fillText(`${displayList.length} LOTES REGISTRADOS`, paddingX + 24, paddingY + 60);

    let rowY = paddingY + 80;
    const rowH = 48;

    displayList.forEach((b, i) => {
      ctx.fillStyle = '#F8FAFC';
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 1.5;
      ctx.fillRect(paddingX + 20, rowY, availW - 40, rowH - 8);
      ctx.strokeRect(paddingX + 20, rowY, availW - 40, rowH - 8);

      ctx.fillStyle = '#E2F952';
      ctx.fillRect(paddingX + 26, rowY + 8, 28, 24);
      ctx.strokeRect(paddingX + 26, rowY + 8, 28, 24);

      ctx.fillStyle = '#111827';
      ctx.font = '900 11px "Space Grotesk", sans-serif';
      ctx.fillText(`0${i + 1}`, paddingX + 33, rowY + 24);

      ctx.font = '900 13px "Space Grotesk", sans-serif';
      ctx.fillText(stripEmojis(b.batch_name || b.coffee_name || 'Café').toUpperCase(), paddingX + 66, rowY + 25);

      ctx.fillStyle = '#64748B';
      ctx.font = '700 10px "Space Grotesk", sans-serif';
      ctx.fillText(`${stripEmojis(b.origin || '')} • ${stripEmojis(b.process || '')}`, paddingX + 380, rowY + 25);

      ctx.fillStyle = '#111827';
      ctx.font = '900 11px "Space Grotesk", sans-serif';
      ctx.fillText(`${b.weight_current_g || 0}g`, paddingX + availW - 90, rowY + 25);

      rowY += rowH;
    });

    // Footer
    const footY = baseH - paddingY - 36;
    ctx.fillStyle = '#111827';
    ctx.font = '900 10px "Space Grotesk", sans-serif';
    ctx.fillText('BEANTAG SPECIALTY CELLAR // CERTIFIED SPECIALTY ✓', paddingX + 24, footY + 16);
  }

  // 3. AURORA MENU
  else if (style === 'aurora') {
    ctx.fillStyle = '#08090E';
    ctx.fillRect(0, 0, baseW, baseH);

    const grad = ctx.createRadialGradient(baseW * 0.8, baseH * 0.2, 0, baseW * 0.8, baseH * 0.2, 350);
    grad.addColorStop(0, 'rgba(139, 92, 246, 0.35)');
    grad.addColorStop(1, 'rgba(139, 92, 246, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, baseW, baseH);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, paddingX, paddingY, availW, baseH - (paddingY * 2), 12, true, true);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 24px -apple-system, sans-serif';
    ctx.fillText('CRYO COFFEE VAULT', paddingX + 24, paddingY + 44);

    ctx.fillStyle = '#A5B4FC';
    ctx.font = '600 11px -apple-system, sans-serif';
    ctx.fillText(`CARTA DE CONGELADOR // ${displayList.length} LOTES REGISTRADOS`, paddingX + 24, paddingY + 66);

    let rowY = paddingY + 88;
    const rowH = 46;

    displayList.forEach((b, i) => {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, paddingX + 20, rowY, availW - 40, rowH - 6, 6, true, true);

      ctx.fillStyle = '#38BDF8';
      ctx.font = '800 11px -apple-system, sans-serif';
      ctx.fillText(`0${i + 1}`, paddingX + 34, rowY + 25);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '700 13px -apple-system, sans-serif';
      ctx.fillText(stripEmojis(b.batch_name || b.coffee_name || 'Café'), paddingX + 66, rowY + 25);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '500 10.5px -apple-system, sans-serif';
      ctx.fillText(`${stripEmojis(b.origin || '')} • ${stripEmojis(b.process || '')}`, paddingX + 380, rowY + 25);

      ctx.fillStyle = '#34D399';
      ctx.font = '700 11px -apple-system, sans-serif';
      ctx.fillText(`${b.weight_current_g || 0}g`, paddingX + availW - 90, rowY + 25);

      rowY += rowH;
    });

    const footY = baseH - paddingY - 32;
    ctx.fillStyle = '#A5B4FC';
    ctx.font = '600 9.5px -apple-system, sans-serif';
    ctx.fillText('BEANTAG CRYO VAULT // EXTRACTION INTELLIGENCE', paddingX + 24, footY + 16);
  }

  // 4. HANGTAG MENU
  else {
    ctx.fillStyle = '#FAF7F2';
    ctx.fillRect(0, 0, baseW, baseH);

    ctx.strokeStyle = '#E7E5E4';
    ctx.lineWidth = 1.5;
    drawRoundedRect(ctx, paddingX, paddingY, availW, baseH - (paddingY * 2), 12, false, true);

    drawMetallicEyelet(ctx, baseW / 2, paddingY + 20, 10);

    ctx.fillStyle = '#1C1917';
    ctx.font = 'bold 22px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('CARTA DE CAFÉS DE ESPECIALIDAD', baseW / 2, paddingY + 54);

    ctx.fillStyle = '#78716C';
    ctx.font = '600 9.5px -apple-system, sans-serif';
    ctx.fillText('ROASTERY ARCHIVE // SELECCIÓN EXCLUSIVA', baseW / 2, paddingY + 70);
    ctx.textAlign = 'left';

    let rowY = paddingY + 90;
    const rowH = 46;

    displayList.forEach((b, i) => {
      ctx.strokeStyle = '#E7E5E4';
      ctx.beginPath();
      ctx.moveTo(paddingX + 24, rowY + rowH - 6);
      ctx.lineTo(baseW - paddingX - 24, rowY + rowH - 6);
      ctx.stroke();

      ctx.fillStyle = '#A8A29E';
      ctx.font = '600 10.5px Georgia, serif';
      ctx.fillText(`0${i + 1}.`, paddingX + 28, rowY + 24);

      ctx.fillStyle = '#1C1917';
      ctx.font = 'bold 13px Georgia, serif';
      ctx.fillText(stripEmojis(b.batch_name || b.coffee_name || 'Café'), paddingX + 54, rowY + 24);

      ctx.fillStyle = '#78716C';
      ctx.font = '500 10.5px -apple-system, sans-serif';
      ctx.fillText(`${stripEmojis(b.origin || '')} • ${stripEmojis(b.process || '')}`, paddingX + 380, rowY + 24);

      ctx.fillStyle = '#4D7C0F';
      ctx.font = 'bold 10.5px -apple-system, sans-serif';
      ctx.fillText(`${b.weight_current_g || 0}g`, paddingX + availW - 80, rowY + 24);

      rowY += rowH;
    });

    const footY = baseH - paddingY - 32;
    ctx.fillStyle = '#78716C';
    ctx.font = '600 9.5px -apple-system, sans-serif';
    ctx.fillText(`CATÁLOGO DE BODEGA // ${displayList.length} LOTES // BEANTAG`, paddingX + 24, footY + 16);
  }

  return canvas.toDataURL('image/png', 1.0);
}

/**
 * Generate formatted text for clipboard sharing of coffee menu
 */
export function generateCoffeeMenuText(batches) {
  if (!batches || batches.length === 0) return 'No hay cafés registrados en el inventario.';

  const available = batches.filter(b => (b.remaining_doses || b.weight_current_g || 0) > 0);
  const targetList = available.length > 0 ? available : batches;

  let text = `☕ *CARTA DE CAFÉS DE ESPECIALIDAD • BEANTAG*\n`;
  text += `❄️ _Dosis congeladas al vacío y lotes en bodega:_\n\n`;

  targetList.forEach((b, idx) => {
    const num = (idx + 1).toString().padStart(2, '0');
    const name = b.batch_name || b.name || b.coffee_name || 'Café de Especialidad';
    const roaster = b.roaster ? ` • ${b.roaster}` : '';
    const origin = b.origin ? `🌍 Origen: ${b.origin}` : '';
    const altitude = b.altitude ? ` (${b.altitude}m)` : '';
    const variety = b.variety ? `🌾 Variedad: ${b.variety}` : '';
    const process = b.process ? ` | Proceso: ${b.process}` : '';
    const notes = b.roaster_notes ? `✨ Notas: ${b.roaster_notes}` : '';
    const doses = b.remaining_doses !== undefined ? `📦 Stock: ${b.remaining_doses} tubos (~${Math.round(b.remaining_weight_g || b.remaining_doses * (parseFloat(b.dose_weight) || 20))}g)` : (b.weight_current_g ? `📦 Stock: ${b.weight_current_g}g` : '');

    text += `*${num}. ${name}*${roaster}\n`;
    if (origin || altitude) text += `   ${origin}${altitude}\n`;
    if (variety || process) text += `   ${variety}${process}\n`;
    if (notes) text += `   ${notes}\n`;
    if (doses) text += `   ${doses}\n`;
    text += `\n`;
  });

  text += `─────────────────────\n`;
  text += `📱 _Gestionado con BeanTag Specialty Coffee App_`;
  return text;
}
