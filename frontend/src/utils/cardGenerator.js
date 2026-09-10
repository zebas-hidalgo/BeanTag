// --- BEANTAG AESTHETIC SPECIALTY COFFEE CARD & TICKET GENERATOR ---
import { stripEmojis, getScaColorForNote } from './scaIcons';

/**
 * Normalizes any legacy or shorthand template names into one of the 4 aesthetic styles:
 * - 'receipt': Tokyo Kissaten thermal receipt with dotted comanda and red Hanko stamp.
 * - 'editorial': Nordic Atelier passport with sensory balance dots and clean layout.
 * - 'boarding': Coffee Boarding Pass with route [ORIGIN ➔ CRYO CAVA] and airline stub.
 * - 'archive': Cyber Tokyo Lab OLED dark mode with vermilion side bar and crypto hash.
 */
export function normalizeCardStyle(template) {
  if (!template) return 'receipt';
  const t = String(template).toLowerCase();
  if (t === 'receipt' || t === 'craft' || t === 'ticket' || t === 'recibo') return 'receipt';
  if (t === 'editorial' || t === 'minimal' || t === 'nordic') return 'editorial';
  if (t === 'boarding' || t === 'pass' || t === 'flight') return 'boarding';
  if (t === 'archive' || t === 'dark' || t === 'cyber' || t === 'lab') return 'archive';
  return 'receipt';
}

function parseGrindToMicrons(grindText) {
  if (!grindText) return null;
  const str = String(grindText);
  // Match Femobook A2
  const femoMatch = str.match(/femobook.*?(\d+)\s*clic/i);
  if (femoMatch) {
    return Math.round(parseInt(femoMatch[1]) * 18);
  }
  // Match Comandante
  const comMatch = str.match(/comandante.*?(\d+)\s*clic/i);
  if (comMatch) {
    return Math.round(parseInt(comMatch[1]) * 30);
  }
  // Match J-Max
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

// Canvas Helper: Draw Rounded Rectangle
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
 * Renders an Ultra-Aesthetic High-DPI Specialty Coffee Share Card (840 x 580 px @ 2x Retina = 1680x1160)
 * Supporting 4 distinct aesthetic styles:
 * 1. 'receipt': 🧾 Tokyo Kissaten thermal ticket with red Hanko stamp & dotted lines
 * 2. 'editorial': 🏷️ Nordic Atelier passport with sensory balance dots & clean layout
 * 3. 'boarding': 🎫 Coffee Boarding Pass with origin-to-cryo expedition route
 * 4. 'archive': 🌑 Cyber Tokyo Lab OLED dark mode with vermilion side bar
 * 
 * @param {Object} recipe Recipe or batch data
 * @param {string} template 'receipt' | 'editorial' | 'boarding' | 'archive'
 * @param {boolean} incRecipe Whether to include extraction recipe or only coffee bean metadata
 * @returns {string} Base64 PNG data URL
 */
export function generateRecipeCardImage(recipe, template = 'receipt', incRecipe = true) {
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
    while (size > 14 && ctx.measureText(str).width > maxWidth) {
      size -= 1;
      ctx.font = `${weight} ${size}px ${fontName}`;
    }
    drawTruncatedText(str, x, y, maxWidth);
  };

  const coffeeName = (recipe.batch_name || 'Café de Especialidad').toUpperCase();
  const roasterName = (recipe.batch_roaster || 'Specialty Roaster').toUpperCase();
  const originStr = (recipe.batch_origin || 'Origen Finca').toUpperCase();
  const altitudeStr = recipe.batch_altitude ? `${recipe.batch_altitude}m` : '1800m';
  const varietyStr = recipe.batch_variety || 'Arabica';
  const processStr = recipe.batch_process || 'Lavado';
  const methodStr = (recipe.method || 'V60').replace(' (Filtrado)', '').toUpperCase();
  const doseStr = recipe.dose_in_g ? `${recipe.dose_in_g}g` : (recipe.dose_weight ? `${recipe.dose_weight}g` : '15.0g');
  const ratioStr = recipe.ratio || '1:15';
  const ratioNum = parseFloat(String(ratioStr).replace('1:', '')) || 15;
  const waterGrams = Math.round((parseFloat(doseStr) || 15) * ratioNum);
  const grindStr = recipe.grind ? String(recipe.grind) : 'Calibrado';
  const microns = parseGrindToMicrons(grindStr);
  const timeStr = recipe.brew_time || '2:30 min';
  const tempStr = recipe.temperature ? `${recipe.temperature}` : '93°C';
  const flavorTags = extractFlavorTags(recipe.batch_roaster_notes || recipe.notes);
  const receiptDate = new Date(recipe.created_at || Date.now()).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  const batchIdStr = String(recipe.id || '24').padStart(3, '0');

  ctx.clearRect(0, 0, baseW, baseH);

  // ==========================================
  // 1. STYLE: RECEIPT (Tokyo Kissaten Thermal)
  // ==========================================
  if (style === 'receipt') {
    const theme = {
      bgPaper: '#FAF8F5',
      borderPaper: '#E5DFD5',
      textMain: '#1A202C',
      textMuted: '#64748B',
      accent: '#C53030',
      stampColor: '#DC2626'
    };

    // Draw thermal receipt with zig-zag cut
    const tLeft = 14;
    const tRight = baseW - 14;
    const toothW = 14;
    const toothH = 8;
    const topY = 12;
    const bottomY = baseH - 12;

    ctx.beginPath();
    ctx.moveTo(tLeft, topY + toothH);
    for (let x = tLeft; x < tRight; x += toothW) {
      ctx.lineTo(x + toothW / 2, topY);
      ctx.lineTo(Math.min(tRight, x + toothW), topY + toothH);
    }
    ctx.lineTo(tRight, bottomY - toothH);
    for (let x = tRight; x > tLeft; x -= toothW) {
      ctx.lineTo(x - toothW / 2, bottomY);
      ctx.lineTo(Math.max(tLeft, x - toothW), bottomY - toothH);
    }
    ctx.lineTo(tLeft, topY + toothH);
    ctx.closePath();

    ctx.fillStyle = theme.bgPaper;
    ctx.fill();
    ctx.strokeStyle = theme.borderPaper;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const paddingX = 48;

    // Header
    ctx.textAlign = 'center';
    ctx.fillStyle = '#64748B';
    ctx.font = '700 10.5px "JetBrains Mono", monospace';
    ctx.fillText('★ BEANTAG COFFEE LAB • TOKYO KISSATEN ★', baseW / 2, 44);

    ctx.fillStyle = '#0F172A';
    ctx.font = '800 19px "Space Grotesk", sans-serif';
    ctx.fillText('BARISTA ORDER TICKET', baseW / 2, 68);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '600 10px "JetBrains Mono", monospace';
    ctx.fillText(`CRYO CAVA ARCHIVE // RECETA #${batchIdStr} // ${receiptDate.toUpperCase()}`, baseW / 2, 85);

    // Red Hanko Stamp (top right corner, tilted)
    ctx.save();
    ctx.translate(baseW - paddingX - 25, 60);
    ctx.rotate((14 * Math.PI) / 180);
    ctx.strokeStyle = theme.stampColor;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = theme.stampColor;
    ctx.font = '800 7px "JetBrains Mono", monospace';
    ctx.fillText('EXTRA', 0, -10);
    ctx.font = '800 12px "Space Grotesk", sans-serif';
    ctx.fillText('88+', 0, 2);
    ctx.font = '700 6.5px "JetBrains Mono", monospace';
    ctx.fillText('PASS', 0, 12);
    ctx.restore();

    ctx.textAlign = 'left';

    // Dashed divider
    ctx.save();
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(paddingX, 102);
    ctx.lineTo(baseW - paddingX, 102);
    ctx.stroke();
    ctx.restore();

    // Coffee Hero
    ctx.fillStyle = '#C53030';
    ctx.font = '800 10.5px "JetBrains Mono", monospace';
    ctx.fillText(`SPECIALTY LOT // ${originStr} • ${altitudeStr}`, paddingX, 126);

    ctx.fillStyle = '#0F172A';
    drawFittedText(coffeeName, paddingX, 154, baseW - (paddingX * 2), 24, 'Space Grotesk', '800');

    ctx.fillStyle = '#64748B';
    ctx.font = '600 12px "Space Grotesk", sans-serif';
    ctx.fillText(`${recipe.batch_producer || 'Productor Finca'} • Variedad ${varietyStr} • Proceso ${processStr}`, paddingX, 176);

    // Dotted Extraction Line Items
    const comandaY = 194;
    ctx.save();
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(paddingX, comandaY);
    ctx.lineTo(baseW - paddingX, comandaY);
    ctx.stroke();
    ctx.restore();

    const drawDottedLine = (lbl, val, y) => {
      ctx.fillStyle = '#64748B';
      ctx.font = '700 11.5px "JetBrains Mono", monospace';
      ctx.fillText(lbl, paddingX, y);
      const textW = ctx.measureText(lbl).width;

      ctx.fillStyle = '#0F172A';
      ctx.font = '800 12px "JetBrains Mono", monospace';
      const valW = ctx.measureText(val).width;
      ctx.fillText(val, baseW - paddingX - valW, y);

      // Dots between
      const dotStartX = paddingX + textW + 10;
      const dotEndX = baseW - paddingX - valW - 10;
      if (dotEndX > dotStartX) {
        ctx.save();
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 4]);
        ctx.beginPath();
        ctx.moveTo(dotStartX, y - 3);
        ctx.lineTo(dotEndX, y - 3);
        ctx.stroke();
        ctx.restore();
      }
    };

    if (incRecipe) {
      drawDottedLine('01. MÉTODO DE PREPARACIÓN:', `${methodStr} (${tempStr})`, comandaY + 24);
      drawDottedLine('02. DOSIS & AGUA DE EXTRACCIÓN:', `${doseStr} In ➔ ${waterGrams}g H₂O`, comandaY + 46);
      drawDottedLine('03. RATIO DE CALIBRACIÓN:', `${ratioStr} • ${microns ? microns + ' µm' : grindStr}`, comandaY + 68);
      drawDottedLine('04. TIEMPO TOTAL DE CONTACTO:', timeStr.toUpperCase(), comandaY + 90);
    } else {
      drawDottedLine('01. ORIGEN & ELEVACIÓN:', `${originStr} • ${altitudeStr}`, comandaY + 24);
      drawDottedLine('02. VARIEDAD BOTÁNICA:', varietyStr.toUpperCase(), comandaY + 46);
      drawDottedLine('03. BENEFICIO & PROCESO:', processStr.toUpperCase(), comandaY + 68);
      drawDottedLine('04. ESTADO DE DOSIS:', 'CONGELADA EN CAVA ❄️', comandaY + 90);
    }

    ctx.save();
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(paddingX, comandaY + 106);
    ctx.lineTo(baseW - paddingX, comandaY + 106);
    ctx.stroke();
    ctx.restore();

    // Tasting Notes Box
    const notesBoxY = comandaY + 120;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
    drawRoundedRect(ctx, paddingX, notesBoxY, baseW - (paddingX * 2), 52, 8, true, false);

    ctx.fillStyle = '#64748B';
    ctx.font = '800 9.5px "JetBrains Mono", monospace';
    ctx.fillText('SCA FLAVOR NOTES:', paddingX + 12, notesBoxY + 18);

    let chipX = paddingX + 12;
    const chipY = notesBoxY + 25;
    if (flavorTags.length > 0) {
      flavorTags.slice(0, 5).forEach((tag) => {
        const col = getScaColorForNote(tag);
        ctx.font = '700 10.5px "Space Grotesk", sans-serif';
        const w = ctx.measureText(tag).width + 16;
        if (chipX + w < baseW - paddingX - 12) {
          ctx.fillStyle = col.bg;
          ctx.strokeStyle = col.border;
          drawRoundedRect(ctx, chipX, chipY, w, 20, 5, true, true);
          ctx.fillStyle = col.text;
          ctx.fillText(tag, chipX + 8, chipY + 14);
          chipX += w + 6;
        }
      });
    } else {
      ctx.fillStyle = '#1A202C';
      ctx.font = '600 11px "Space Grotesk", sans-serif';
      ctx.fillText('Notas limpias, balance brillante y dulzor característico de especialidad.', paddingX + 12, chipY + 14);
    }

    // Barcode & Footer
    const barcodeY = notesBoxY + 68;
    const barPattern = [3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 4, 1, 3, 1, 2, 4, 2, 3, 1, 4];
    let curBarX = paddingX + 80;
    ctx.fillStyle = '#0F172A';
    barPattern.forEach((w, i) => {
      if (i % 2 === 0) {
        ctx.fillRect(curBarX, barcodeY, w * 3, 26);
      }
      curBarX += (w * 3) + 3;
    });

    ctx.textAlign = 'center';
    ctx.fillStyle = '#94A3B8';
    ctx.font = '700 10px "JetBrains Mono", monospace';
    ctx.fillText(`★ 2026-BT#${batchIdStr} • BEANTAG CRYO ARCHIVE • BARISTA APPROVED ★`, baseW / 2, barcodeY + 44);
    ctx.textAlign = 'left';

    return canvas.toDataURL('image/png', 1.0);
  }

  // ==========================================
  // 2. STYLE: EDITORIAL (Nordic Atelier Passport)
  // ==========================================
  if (style === 'editorial') {
    const theme = {
      bgPaper: '#FDFCFA',
      borderPaper: '#EAE5DC',
      textMain: '#1C1917',
      textMuted: '#78716C',
      accent: '#BC5449',
      boxBg: '#F7F4EE'
    };

    // Clean outer card with radius 20
    ctx.fillStyle = theme.bgPaper;
    ctx.strokeStyle = theme.borderPaper;
    ctx.lineWidth = 1.5;
    drawRoundedRect(ctx, 16, 16, baseW - 32, baseH - 32, 20, true, true);

    const paddingX = 52;

    // Header
    ctx.fillStyle = theme.accent;
    ctx.font = '800 10.5px "Space Grotesk", sans-serif';
    ctx.fillText('ATELIER PASSPORT', paddingX, 52);

    ctx.textAlign = 'right';
    ctx.fillStyle = theme.textMuted;
    ctx.font = '700 10px "JetBrains Mono", monospace';
    ctx.fillText(`${receiptDate.toUpperCase()} // N° ${batchIdStr}`, baseW - paddingX, 52);
    ctx.textAlign = 'left';

    // Divider
    ctx.strokeStyle = theme.borderPaper;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(paddingX, 64);
    ctx.lineTo(baseW - paddingX, 64);
    ctx.stroke();

    // Coffee Title
    ctx.fillStyle = theme.textMuted;
    ctx.font = '700 11px "Space Grotesk", sans-serif';
    ctx.fillText(`${originStr} • ${altitudeStr}`, paddingX, 90);

    ctx.fillStyle = theme.textMain;
    drawFittedText(coffeeName, paddingX, 120, baseW - (paddingX * 2), 26, 'Space Grotesk', '700');

    ctx.fillStyle = theme.textMuted;
    ctx.font = '600 12px "Space Grotesk", sans-serif';
    ctx.fillText(`${recipe.batch_producer || 'Productor Finca'} • Variedad ${varietyStr} • Proceso ${processStr}`, paddingX, 142);

    // Visual Sensory Balance Dots Box
    const sensoryBoxY = 160;
    ctx.fillStyle = theme.boxBg;
    drawRoundedRect(ctx, paddingX, sensoryBoxY, baseW - (paddingX * 2), 82, 12, true, false);

    ctx.fillStyle = theme.textMuted;
    ctx.font = '800 9.5px "Space Grotesk", sans-serif';
    ctx.fillText('PERFIL SENSORIAL DE TAZA (BALANCE & CUERPO)', paddingX + 16, sensoryBoxY + 20);

    const drawBalanceRow = (label, dots, y) => {
      ctx.fillStyle = theme.textMain;
      ctx.font = '600 11.5px "Space Grotesk", sans-serif';
      ctx.fillText(label, paddingX + 16, y);

      ctx.fillStyle = theme.accent;
      ctx.font = '800 12px "JetBrains Mono", monospace';
      ctx.fillText(dots, paddingX + 220, y);
    };

    drawBalanceRow('Acidez & Claridad:', '●●●●○ (Brillante & Jugosa)', sensoryBoxY + 42);
    drawBalanceRow('Dulzor & Balance:', '●●●●● (Caramelo & Frutas)', sensoryBoxY + 64);

    // 4 Clean Spec Cards
    const gridY = 256;
    const cardW = (baseW - (paddingX * 2) - 24) / 4;
    const cardH = 74;

    const metrics = incRecipe ? [
      { lbl: 'MÉTODO', val: methodStr, sub: tempStr },
      { lbl: 'DOSIS', val: doseStr, sub: 'Gramos In' },
      { lbl: 'RATIO', val: ratioStr, sub: `~${waterGrams}g H₂O` },
      { lbl: 'MOLIENDA', val: microns ? `${microns} µm` : grindStr.slice(0, 12), sub: timeStr }
    ] : [
      { lbl: 'ORIGEN', val: originStr.slice(0, 12), sub: altitudeStr },
      { lbl: 'VARIEDAD', val: varietyStr.slice(0, 12), sub: 'Specialty' },
      { lbl: 'PROCESO', val: processStr.slice(0, 12), sub: 'Beneficio' },
      { lbl: 'ESTADO', val: 'CONGELADO', sub: 'Cava ❄️' }
    ];

    metrics.forEach((m, idx) => {
      const x = paddingX + idx * (cardW + 8);
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = theme.borderPaper;
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, x, gridY, cardW, cardH, 10, true, true);

      ctx.fillStyle = theme.textMuted;
      ctx.font = '700 9px "Space Grotesk", sans-serif';
      ctx.fillText(m.lbl, x + 12, gridY + 20);

      ctx.fillStyle = theme.textMain;
      ctx.font = '800 13.5px "Space Grotesk", sans-serif';
      drawTruncatedText(m.val, x + 12, gridY + 44, cardW - 24);

      ctx.fillStyle = theme.accent;
      ctx.font = '700 10.5px "JetBrains Mono", monospace';
      drawTruncatedText(m.sub, x + 12, gridY + 63, cardW - 24);
    });

    // SCA Flavor Chips
    const flavorY = 356;
    ctx.fillStyle = theme.textMuted;
    ctx.font = '800 10px "Space Grotesk", sans-serif';
    ctx.fillText('NOTAS DE CATA & PERFIL SENSORIAL (SCA):', paddingX, flavorY);

    let chipX = paddingX;
    const chipY = flavorY + 12;
    if (flavorTags.length > 0) {
      flavorTags.slice(0, 5).forEach((tag) => {
        const col = getScaColorForNote(tag);
        ctx.font = '700 11px "Space Grotesk", sans-serif';
        const w = ctx.measureText(tag).width + 20;
        if (chipX + w < baseW - paddingX) {
          ctx.fillStyle = col.bg;
          ctx.strokeStyle = col.border;
          ctx.lineWidth = 1.2;
          drawRoundedRect(ctx, chipX, chipY, w, 26, 13, true, true);
          ctx.fillStyle = col.text;
          ctx.fillText(tag, chipX + 10, chipY + 17);
          chipX += w + 8;
        }
      });
    }

    // Tasting note summary text
    ctx.fillStyle = theme.textMuted;
    ctx.font = '600 11.5px "Space Grotesk", sans-serif';
    const notesSummary = recipe.batch_roaster_notes || recipe.notes || 'Equilibrio armonioso con notas frutales, acidez estructurada y postgusto prolongado.';
    drawTruncatedText(notesSummary, paddingX, flavorY + 64, baseW - (paddingX * 2));

    // Footer
    ctx.strokeStyle = theme.borderPaper;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(paddingX, 480);
    ctx.lineTo(baseW - paddingX, 480);
    ctx.stroke();

    ctx.fillStyle = theme.textMuted;
    ctx.font = '600 11px "Space Grotesk", sans-serif';
    ctx.fillText('☕ Dosis en Cava Congelada • Calibración de Precisión', paddingX, 514);

    ctx.textAlign = 'right';
    ctx.fillStyle = theme.accent;
    ctx.font = '800 11.5px "Space Grotesk", sans-serif';
    ctx.fillText('BEANTAG.APP • COLD STORAGE ATELIER', baseW - paddingX, 514);
    ctx.textAlign = 'left';

    return canvas.toDataURL('image/png', 1.0);
  }

  // ==========================================
  // 3. STYLE: BOARDING (Coffee Boarding Pass)
  // ==========================================
  if (style === 'boarding') {
    const theme = {
      bgPaper: '#FFFFFF',
      borderPaper: '#CBD5E1',
      textMain: '#0F172A',
      textMuted: '#64748B',
      accent: '#C53030',
      dark: '#0F172A'
    };

    // Rounded Boarding Card
    ctx.fillStyle = theme.bgPaper;
    ctx.strokeStyle = theme.borderPaper;
    ctx.lineWidth = 1.5;
    drawRoundedRect(ctx, 16, 16, baseW - 32, baseH - 32, 16, true, true);

    const paddingX = 48;

    // Header
    ctx.fillStyle = theme.textMain;
    ctx.font = '900 15px "JetBrains Mono", monospace';
    ctx.fillText('BEANTAG // EXPEDITION BOARDING PASS', paddingX, 52);

    ctx.fillStyle = theme.textMuted;
    ctx.font = '700 9.5px "JetBrains Mono", monospace';
    ctx.fillText('SPECIALTY ORIGIN EXTRACTION TICKET', paddingX, 66);

    // Top Right Dark Route Pill
    const routeOriginCode = originStr.slice(0, 3).toUpperCase();
    const routeBadge = `${routeOriginCode} ➔ CRYO`;
    ctx.font = '800 11px "JetBrains Mono", monospace';
    const rW = ctx.measureText(routeBadge).width + 18;
    ctx.fillStyle = theme.dark;
    drawRoundedRect(ctx, baseW - paddingX - rW, 40, rW, 26, 6, true, false);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(routeBadge, baseW - paddingX - rW + 9, 57);

    // Dark solid divider
    ctx.fillStyle = theme.dark;
    ctx.fillRect(paddingX, 78, baseW - (paddingX * 2), 2);

    // Origin -> Destination Flight Section
    const routeY = 114;
    // Origin
    ctx.fillStyle = theme.textMuted;
    ctx.font = '700 9.5px "JetBrains Mono", monospace';
    ctx.fillText('DE: ORIGEN FINCA', paddingX, routeY);
    ctx.fillStyle = theme.textMain;
    ctx.font = '900 22px "Space Grotesk", sans-serif';
    ctx.fillText(routeOriginCode, paddingX, routeY + 25);
    ctx.fillStyle = theme.textMuted;
    ctx.font = '600 11px "Space Grotesk", sans-serif';
    drawTruncatedText(`${originStr} • ${altitudeStr}`, paddingX, routeY + 42, 220);

    // Arrow Center
    ctx.textAlign = 'center';
    ctx.fillStyle = theme.accent;
    ctx.font = '800 20px "Space Grotesk", sans-serif';
    ctx.fillText('✈  ➔', baseW / 2, routeY + 22);
    ctx.font = '700 9.5px "JetBrains Mono", monospace';
    ctx.fillStyle = theme.textMuted;
    ctx.fillText('RUTA DE TAZA', baseW / 2, routeY + 40);
    ctx.textAlign = 'left';

    // Destination
    ctx.textAlign = 'right';
    ctx.fillStyle = theme.textMuted;
    ctx.font = '700 9.5px "JetBrains Mono", monospace';
    ctx.fillText('A: DESTINO FINAL', baseW - paddingX, routeY);
    ctx.fillStyle = theme.textMain;
    ctx.font = '900 22px "Space Grotesk", sans-serif';
    ctx.fillText('CAV', baseW - paddingX, routeY + 25);
    ctx.fillStyle = theme.textMuted;
    ctx.font = '600 11px "Space Grotesk", sans-serif';
    ctx.fillText('Cava Freezer -18°C', baseW - paddingX, routeY + 42);
    ctx.textAlign = 'left';

    // Main Coffee Specs Box
    const specsBoxY = 176;
    ctx.fillStyle = '#F8FAFC';
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, paddingX, specsBoxY, baseW - (paddingX * 2), 126, 10, true, true);

    ctx.fillStyle = theme.textMain;
    drawFittedText(coffeeName, paddingX + 16, specsBoxY + 30, baseW - (paddingX * 2) - 32, 20, 'JetBrains Mono', '900');

    ctx.fillStyle = theme.textMuted;
    ctx.font = '700 10.5px "JetBrains Mono", monospace';
    ctx.fillText(`PRODUCTOR: ${recipe.batch_producer || 'FINCA SELECCIONADA'} // VAR: ${varietyStr} // PROC: ${processStr}`, paddingX + 16, specsBoxY + 52);

    // Boarding Pass Badges
    const badgeRowY = specsBoxY + 70;
    const drawFlightPill = (txt, bg, textCol, x) => {
      ctx.font = '800 10.5px "JetBrains Mono", monospace';
      const w = ctx.measureText(txt).width + 16;
      ctx.fillStyle = bg;
      drawRoundedRect(ctx, x, badgeRowY, w, 22, 4, true, false);
      ctx.fillStyle = textCol;
      ctx.fillText(txt, x + 8, badgeRowY + 15);
      return w + 8;
    };

    let pX = paddingX + 16;
    pX += drawFlightPill(`DOSIS: ${doseStr}`, theme.dark, '#FFFFFF', pX);
    pX += drawFlightPill(`RATIO: ${ratioStr}`, theme.accent, '#FFFFFF', pX);
    pX += drawFlightPill(`MOLIENDA: ${microns ? microns + ' µm' : grindStr}`, '#E2E8F0', theme.textMain, pX);
    pX += drawFlightPill(`TEMP: ${tempStr}`, '#E2E8F0', theme.textMain, pX);
    drawFlightPill(`TIME: ${timeStr}`, '#E2E8F0', theme.textMain, pX);

    // Notes line
    ctx.fillStyle = theme.textMuted;
    ctx.font = '700 10px "JetBrains Mono", monospace';
    ctx.fillText(`NOTAS SENSORIALES: [ ${flavorTags.join(' • ') || 'Frutal, Balance Brillante'} ]`, paddingX + 16, specsBoxY + 112);

    // Perforated Stub Line
    const stubY = 328;
    ctx.save();
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(paddingX, stubY);
    ctx.lineTo(baseW - paddingX, stubY);
    ctx.stroke();
    ctx.restore();

    // Stub Content
    ctx.fillStyle = theme.textMuted;
    ctx.font = '700 9.5px "JetBrains Mono", monospace';
    ctx.fillText('PASSENGER / BARISTA:', paddingX, stubY + 28);
    ctx.fillStyle = theme.textMain;
    ctx.font = '900 13.5px "JetBrains Mono", monospace';
    ctx.fillText(`HOME BARISTA #${batchIdStr}`, paddingX, stubY + 48);

    ctx.textAlign = 'right';
    ctx.fillStyle = theme.accent;
    ctx.font = '900 14px "JetBrains Mono", monospace';
    ctx.fillText(`GATE: ${methodStr} [APPROVED]`, baseW - paddingX, stubY + 36);
    ctx.fillStyle = theme.textMuted;
    ctx.font = '700 9.5px "JetBrains Mono", monospace';
    ctx.fillText(`FLIGHT // BT-2026-${batchIdStr}`, baseW - paddingX, stubY + 52);
    ctx.textAlign = 'left';

    // Barcode at bottom
    const barcodeY = stubY + 70;
    const barPattern = [3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 4, 1, 3, 1, 2, 4, 2, 3, 1, 4];
    let curBarX = paddingX;
    ctx.fillStyle = theme.dark;
    barPattern.forEach((w, i) => {
      if (i % 2 === 0) {
        ctx.fillRect(curBarX, barcodeY, w * 3.5, 24);
      }
      curBarX += (w * 3.5) + 3;
    });

    ctx.fillStyle = theme.textMuted;
    ctx.font = '700 10.5px "JetBrains Mono", monospace';
    ctx.fillText('★ BEANTAG BOARDING PASS // VERIFIED COLD STORAGE CAVA ★', paddingX, barcodeY + 42);

    return canvas.toDataURL('image/png', 1.0);
  }

  // ==========================================
  // 4. STYLE: ARCHIVE (Cyber Tokyo Lab OLED)
  // ==========================================
  {
    const theme = {
      bgPaper: '#0D0F14',
      borderPaper: '#272C36',
      textMain: '#F8FAFC',
      textMuted: '#94A3B8',
      textLight: '#64748B',
      accent: '#E06C60',
      cardBg: '#161A22',
      cardBorder: '#2E3440'
    };

    // Dark Card Base
    ctx.fillStyle = theme.bgPaper;
    ctx.strokeStyle = theme.borderPaper;
    ctx.lineWidth = 1.5;
    drawRoundedRect(ctx, 14, 14, baseW - 28, baseH - 28, 14, true, true);

    // Left Vermilion Accent Bar
    ctx.fillStyle = theme.accent;
    drawRoundedRect(ctx, 14, 14, 6, baseH - 28, 3, true, false);

    const paddingX = 46;

    // Header
    ctx.fillStyle = theme.accent;
    ctx.font = '800 10px "JetBrains Mono", monospace';
    ctx.fillText(`TOKYO CRYO LAB // SPECIMEN #${batchIdStr}`, paddingX, 48);

    ctx.fillStyle = theme.textMain;
    drawFittedText(coffeeName, paddingX, 80, baseW - (paddingX * 2) - 130, 24, 'JetBrains Mono', '900');

    // Right Pill Badge
    ctx.font = '800 9.5px "JetBrains Mono", monospace';
    const badgeText = 'CRYO-PRESERVED';
    const bW = ctx.measureText(badgeText).width + 16;
    ctx.fillStyle = 'rgba(224, 108, 96, 0.15)';
    ctx.strokeStyle = theme.accent;
    drawRoundedRect(ctx, baseW - paddingX - bW, 58, bW, 24, 4, true, true);
    ctx.fillStyle = theme.accent;
    ctx.fillText(badgeText, baseW - paddingX - bW + 8, 74);

    // Subtitle
    ctx.fillStyle = theme.textMuted;
    ctx.font = '600 11px "JetBrains Mono", monospace';
    ctx.fillText(`PRODUCER: ${recipe.batch_producer || 'ESTATE'} // VARIETY: ${varietyStr} // HARVEST LOT`, paddingX, 104);

    // Divider Line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(paddingX, 120);
    ctx.lineTo(baseW - paddingX, 120);
    ctx.stroke();

    // 2x2 Specs Matrix
    const matrixY = 136;
    const mBoxW = (baseW - (paddingX * 2) - 12) / 2;
    const mBoxH = 54;

    const matrixItems = [
      { lbl: 'ORIGIN_ID:', val: `${originStr} // ${altitudeStr}` },
      { lbl: 'PROCESS_CODE:', val: `${processStr.toUpperCase()} FERMENT` },
      { lbl: 'GRIND_TARGET:', val: `${microns ? microns + ' µm' : grindStr} (PRECISION)` },
      { lbl: 'EXTRACTION:', val: `${methodStr} • ${ratioStr} • ${tempStr} • ${timeStr}` }
    ];

    matrixItems.forEach((item, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = paddingX + col * (mBoxW + 12);
      const y = matrixY + row * (mBoxH + 10);

      ctx.fillStyle = theme.cardBg;
      ctx.strokeStyle = theme.cardBorder;
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, x, y, mBoxW, mBoxH, 6, true, true);

      ctx.fillStyle = theme.textLight;
      ctx.font = '700 8.5px "JetBrains Mono", monospace';
      ctx.fillText(item.lbl, x + 10, y + 18);

      ctx.fillStyle = idx === 2 ? theme.accent : theme.textMain;
      ctx.font = '800 11.5px "JetBrains Mono", monospace';
      drawTruncatedText(item.val, x + 10, y + 38, mBoxW - 20);
    });

    // Sensory Notes Box
    const notesBoxY = matrixY + (mBoxH * 2) + 24;
    ctx.fillStyle = theme.cardBg;
    ctx.strokeStyle = theme.cardBorder;
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, paddingX, notesBoxY, baseW - (paddingX * 2), 52, 6, true, true);

    ctx.fillStyle = theme.accent;
    ctx.font = '800 9.5px "JetBrains Mono", monospace';
    ctx.fillText('FLAVOR_TAGS & DESCRIPTORS:', paddingX + 12, notesBoxY + 18);

    ctx.fillStyle = theme.textMuted;
    ctx.font = '700 11px "JetBrains Mono", monospace';
    const tagsStr = flavorTags.length > 0 ? `[ ${flavorTags.join(', ')} ]` : '[ Equilibrado, notas limpias, dulzor natural ]';
    drawTruncatedText(tagsStr, paddingX + 12, notesBoxY + 38, baseW - (paddingX * 2) - 24);

    // Circular Laboratory Seal
    const sealX = baseW - paddingX - 40;
    const sealY = notesBoxY + 100;
    const sealR = 30;

    ctx.save();
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(sealX, sealY, sealR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(sealX, sealY, sealR - 4, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = theme.accent;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '800 7.5px "JetBrains Mono", monospace';
    ctx.fillText('TOKYO LAB', sealX, sealY - 10);
    ctx.font = '800 11px "JetBrains Mono", monospace';
    ctx.fillText('SPEC', sealX, sealY + 2);
    ctx.font = '700 6.5px "JetBrains Mono", monospace';
    ctx.fillText('VERIFIED', sealX, sealY + 12);
    ctx.restore();

    // Footer Barcode
    const footerY = notesBoxY + 76;
    const barPattern = [3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 4, 1, 3, 1, 2, 4, 2, 3, 1, 4];
    let curBarX = paddingX;
    ctx.fillStyle = theme.textMain;
    barPattern.forEach((w, i) => {
      if (i % 2 === 0) {
        ctx.fillRect(curBarX, footerY, w * 2.8, 24);
      }
      curBarX += (w * 2.8) + 2.5;
    });

    ctx.fillStyle = theme.textLight;
    ctx.font = '700 10px "JetBrains Mono", monospace';
    ctx.fillText(`HASH: #BT-SPECIMEN-2026-${batchIdStr} // ${receiptDate.toUpperCase()} // VERIFIED EXTRACTION`, paddingX, footerY + 42);

    return canvas.toDataURL('image/png', 1.0);
  }
}

/**
 * Formats a clean, readable text menu of all available coffees for sharing on WhatsApp / Telegram / Notes
 * @param {Array} batches List of coffee batches
 * @returns {string} Formatted text
 */
export function generateCoffeeMenuText(batches) {
  if (!batches || batches.length === 0) return 'No hay cafés registrados en el inventario.';

  const available = batches.filter(b => (b.remaining_doses || 0) > 0);
  const targetList = available.length > 0 ? available : batches;

  let text = `☕ *CARTA DE CAFÉS DE ESPECIALIDAD • BEANTAG*\n`;
  text += `❄️ _Dosis congeladas al vacío listas para calibrar:_\n\n`;

  targetList.forEach((b, idx) => {
    const num = (idx + 1).toString().padStart(2, '0');
    const name = b.name || 'Café sin nombre';
    const roaster = b.roaster ? ` • ${b.roaster}` : '';
    const origin = b.origin ? `🌍 Origen: ${b.origin}` : '';
    const altitude = b.altitude ? ` (${b.altitude}m)` : '';
    const variety = b.variety ? `🌾 Variedad: ${b.variety}` : '';
    const process = b.process ? ` | Proceso: ${b.process}` : '';
    const notes = b.roaster_notes ? `✨ Notas: ${b.roaster_notes}` : '';
    const doses = b.remaining_doses !== undefined ? `📦 Stock: ${b.remaining_doses} tubos (~${Math.round(b.remaining_weight_g || b.remaining_doses * (parseFloat(b.dose_weight) || 20))}g)` : '';

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

/**
 * Generates an Ultra-HD (840 x Dynamic Height px) visual Specialty Coffee Menu Card
 * listing all coffees in inventory in the 4 aesthetic styles:
 * 'receipt' | 'editorial' | 'boarding' | 'archive'
 * 
 * @param {Array} batches List of coffee batches
 * @param {string} template 'receipt' | 'editorial' | 'boarding' | 'archive'
 * @returns {string} Base64 PNG data URL
 */
export function generateCoffeeMenuCardImage(batches, template = 'receipt') {
  const canvas = document.createElement('canvas');
  const scaleFactor = 2;
  const baseW = 840;

  const validBatches = Array.isArray(batches) ? batches.filter(b => (b.remaining_doses || 0) > 0) : [];
  const displayList = validBatches.length > 0 ? validBatches : (Array.isArray(batches) ? batches.slice(0, 8) : []);
  
  const headerH = 140;
  const itemH = 92;
  const footerH = 100;
  const baseH = Math.max(580, headerH + (displayList.length * itemH) + footerH);

  canvas.width = baseW * scaleFactor;
  canvas.height = baseH * scaleFactor;

  const ctx = canvas.getContext('2d');
  ctx.scale(scaleFactor, scaleFactor);

  const style = normalizeCardStyle(template);

  const theme = style === 'archive' ? {
    bgPaper: '#0D0F14',
    borderPaper: '#272C36',
    textMain: '#F8FAFC',
    textMuted: '#94A3B8',
    textLight: '#64748B',
    accent: '#E06C60',
    cardBg: '#161A22',
    cardBorder: '#2E3440',
    stampColor: '#E06C60'
  } : style === 'editorial' ? {
    bgPaper: '#FDFCFA',
    borderPaper: '#EAE5DD',
    textMain: '#1C1917',
    textMuted: '#78716C',
    textLight: '#A8A29E',
    accent: '#BC5449',
    cardBg: '#FFFFFF',
    cardBorder: '#ECE7DF',
    stampColor: '#BC5449'
  } : style === 'boarding' ? {
    bgPaper: '#FFFFFF',
    borderPaper: '#CBD5E1',
    textMain: '#0F172A',
    textMuted: '#64748B',
    textLight: '#94A3B8',
    accent: '#C53030',
    cardBg: '#F8FAFC',
    cardBorder: '#E2E8F0',
    stampColor: '#0F172A'
  } : {
    // receipt
    bgPaper: '#FAF8F5',
    borderPaper: '#E5DFD5',
    textMain: '#1A202C',
    textMuted: '#64748B',
    textLight: '#94A3B8',
    accent: '#C53030',
    cardBg: '#F4EFEB',
    cardBorder: '#E2DAD0',
    stampColor: '#DC2626'
  };

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

  const paddingX = 48;

  // 1. Draw Outer Frame
  if (style === 'receipt') {
    const tLeft = 0;
    const tRight = baseW;
    const toothW = 14;
    const toothH = 8;
    const topY = 0;
    const bottomY = baseH;

    ctx.beginPath();
    ctx.moveTo(tLeft, topY + toothH);
    for (let x = tLeft; x < tRight; x += toothW) {
      ctx.lineTo(x + toothW / 2, topY);
      ctx.lineTo(Math.min(tRight, x + toothW), topY + toothH);
    }
    ctx.lineTo(tRight, bottomY - toothH);
    for (let x = tRight; x > tLeft; x -= toothW) {
      ctx.lineTo(x - toothW / 2, bottomY);
      ctx.lineTo(Math.max(tLeft, x - toothW), bottomY - toothH);
    }
    ctx.lineTo(tLeft, topY + toothH);
    ctx.closePath();

    ctx.fillStyle = theme.bgPaper;
    ctx.fill();
    ctx.strokeStyle = theme.borderPaper;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else if (style === 'archive') {
    ctx.fillStyle = theme.bgPaper;
    ctx.strokeStyle = theme.borderPaper;
    ctx.lineWidth = 1.5;
    drawRoundedRect(ctx, 10, 10, baseW - 20, baseH - 20, 12, true, true);

    ctx.fillStyle = theme.accent;
    drawRoundedRect(ctx, 10, 10, 6, baseH - 20, 3, true, false);
  } else {
    // editorial / boarding
    ctx.fillStyle = theme.bgPaper;
    ctx.strokeStyle = theme.borderPaper;
    ctx.lineWidth = 1.5;
    drawRoundedRect(ctx, 12, 12, baseW - 24, baseH - 24, 18, true, true);
  }

  // 2. Header
  const curY = 46;

  if (style === 'archive') {
    ctx.fillStyle = theme.accent;
    ctx.font = '800 12px "JetBrains Mono", monospace';
    ctx.fillText('★ TOKYO COFFEE LAB // CRYO INVENTORY REGISTRY ★', paddingX, curY);

    ctx.fillStyle = theme.textMuted;
    ctx.font = '700 10.5px "JetBrains Mono", monospace';
    ctx.fillText('CATÁLOGO DE VARIEDADES & DOSIS CONGELADAS DISPONIBLES', paddingX, curY + 16);
  } else if (style === 'editorial') {
    ctx.fillStyle = theme.accent;
    ctx.font = '800 12px "Space Grotesk", sans-serif';
    ctx.fillText('★ CARTA DE CAFÉS DE ESPECIALIDAD • BEANTAG ★', paddingX, curY);

    ctx.fillStyle = theme.textMuted;
    ctx.font = '600 11px "Space Grotesk", sans-serif';
    ctx.fillText('Colección de Lotes en Cava Congelada • Listas para Calibrar', paddingX, curY + 16);
  } else if (style === 'boarding') {
    ctx.fillStyle = theme.accent;
    ctx.font = '900 12px "JetBrains Mono", monospace';
    ctx.fillText('BEANTAG // FREEZER CRYO MANIFEST', paddingX, curY);

    ctx.fillStyle = theme.textMuted;
    ctx.font = '700 10px "JetBrains Mono", monospace';
    ctx.fillText('LISTA DE EXPEDICIÓN DE LOTES LISTOS PARA PREPARAR', paddingX, curY + 16);
  } else {
    // receipt
    ctx.fillStyle = theme.accent;
    ctx.font = '800 12px "JetBrains Mono", monospace';
    ctx.fillText('★ BEANTAG COFFEE LAB • BARISTA MANIFEST ★', paddingX, curY);

    ctx.fillStyle = theme.textMuted;
    ctx.font = '700 10px "JetBrains Mono", monospace';
    ctx.fillText('CARTA DE CAFÉS & DOSIS CONGELADAS DISPONIBLES', paddingX, curY + 16);
  }

  // Top Right Stamp / Seal
  const stampX = baseW - paddingX - 44;
  const stampY = curY + 10;
  const stampR = 34;

  ctx.save();
  ctx.strokeStyle = theme.stampColor;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(stampX, stampY, stampR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(stampX, stampY, stampR - 4, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = theme.stampColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '800 8.5px "JetBrains Mono", monospace';
  ctx.fillText(style === 'archive' ? 'CRYO LAB' : (style === 'boarding' ? 'EXPEDITION' : 'BARISTA'), stampX, stampY - 14);
  ctx.font = '800 14px "Space Grotesk", sans-serif';
  ctx.fillText(`${displayList.length} LOTES`, stampX, stampY);
  ctx.font = '700 7.5px "JetBrains Mono", monospace';
  ctx.fillText('CAVA', stampX, stampY + 13);
  ctx.restore();

  // Divider Line
  ctx.strokeStyle = style === 'archive' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(paddingX, 94);
  ctx.lineTo(baseW - paddingX, 94);
  ctx.stroke();

  // 3. Render Each Coffee Item Card
  let itemY = 110;

  displayList.forEach((b, idx) => {
    const itemCardY = itemY;
    const itemCardW = baseW - (paddingX * 2);
    const itemCardH = 82;

    // Item Container Box
    ctx.fillStyle = theme.cardBg;
    ctx.strokeStyle = theme.cardBorder;
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, paddingX, itemCardY, itemCardW, itemCardH, style === 'archive' ? 5 : 8, true, true);

    // Number Badge
    const numBadgeW = 32;
    ctx.fillStyle = style === 'archive' ? '#252B38' : (style === 'boarding' ? '#0F172A' : '#EAE5DD');
    drawRoundedRect(ctx, paddingX, itemCardY, numBadgeW, itemCardH, style === 'archive' ? 5 : 8, true, false);

    ctx.fillStyle = style === 'boarding' || style === 'archive' ? '#FFFFFF' : theme.accent;
    ctx.font = '800 11.5px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText((idx + 1).toString().padStart(2, '0'), paddingX + (numBadgeW / 2), itemCardY + (itemCardH / 2) + 4);
    ctx.textAlign = 'left';

    const contentX = paddingX + numBadgeW + 14;

    // Coffee Name
    ctx.fillStyle = theme.textMain;
    ctx.font = style === 'archive' || style === 'boarding' ? '800 14px "JetBrains Mono", monospace' : '800 15px "Space Grotesk", sans-serif';
    const nameText = (b.name || 'Café Especial').toUpperCase();
    drawTruncatedText(nameText, contentX, itemCardY + 22, itemCardW - numBadgeW - 145);

    // Doses pill on top-right of item card
    const dosesText = `${b.remaining_doses || 0} TUBOS`;
    ctx.font = '700 10px "JetBrains Mono", monospace';
    const doseW = ctx.measureText(dosesText).width + 16;
    const doseX = paddingX + itemCardW - doseW - 10;
    ctx.fillStyle = theme.stampColor;
    drawRoundedRect(ctx, doseX, itemCardY + 10, doseW, 20, 4, true, false);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(dosesText, doseX + 8, itemCardY + 24);

    // Origin, Producer & Altitude
    ctx.fillStyle = theme.textMuted;
    ctx.font = '700 10.5px "JetBrains Mono", monospace';
    const originLine = `${b.roaster ? b.roaster.toUpperCase() + ' • ' : ''}${b.origin ? b.origin.toUpperCase() + ' • ' : ''}${b.altitude ? b.altitude + 'm' : '1800m'}`;
    drawTruncatedText(originLine, contentX, itemCardY + 43, itemCardW - numBadgeW - 30);

    // Variety, Process & Flavor Notes
    const flavorTags = extractFlavorTags(b.roaster_notes);
    ctx.fillStyle = theme.accent;
    ctx.font = '700 11px "Space Grotesk", sans-serif';
    const specStr = `${b.variety || 'Heirloom'} (${b.process || 'Lavado'})${flavorTags.length > 0 ? ' — ' + flavorTags.slice(0, 3).join(', ') : ''}`;
    drawTruncatedText(specStr, contentX, itemCardY + 64, itemCardW - numBadgeW - 30);

    itemY += itemH;
  });

  // 4. Footer
  const footerY = itemY + 12;
  ctx.save();
  ctx.strokeStyle = style === 'archive' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
  ctx.lineWidth = 1.4;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(paddingX, footerY);
  ctx.lineTo(baseW - paddingX, footerY);
  ctx.stroke();
  ctx.restore();

  const menuDate = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

  if (style === 'editorial') {
    ctx.fillStyle = theme.textMuted;
    ctx.font = '700 11.5px "Space Grotesk", sans-serif';
    ctx.fillText(`☕ BEANTAG SPECIALTY CAVA // ${menuDate.toUpperCase()} // ${displayList.length} LOTES REGISTRADOS`, paddingX, footerY + 28);

    ctx.fillStyle = theme.accent;
    ctx.font = '700 10.5px "JetBrains Mono", monospace';
    ctx.fillText('GESTIONA TU BODEGA Y CALIBRACIÓN DE CAFÉ CON BEANTAG.APP', paddingX, footerY + 48);
  } else {
    const barcodeY = footerY + 16;
    const barPattern = [3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 4, 1, 3, 1, 2, 4, 2, 3, 1, 4];
    let curBarX = paddingX;
    ctx.fillStyle = theme.textMain;
    barPattern.forEach((w, i) => {
      if (i % 2 === 0) {
        ctx.fillRect(curBarX, barcodeY, w * 2.8, 24);
      }
      curBarX += (w * 2.8) + 2.5;
    });

    const serialText = style === 'archive'
      ? `★ TOKYO LAB CRYO MANIFEST // ${menuDate.toUpperCase()} // ${displayList.length} LOTES EN INVENTARIO ★`
      : (style === 'boarding' 
          ? `★ BEANTAG FLIGHT MANIFEST // ${menuDate.toUpperCase()} // ${displayList.length} EXPEDITION PASSES ★`
          : `★ BEANTAG ARCHIVE // ${menuDate.toUpperCase()} // ${displayList.length} LOTES REGISTRADOS ★`);
    ctx.fillStyle = theme.textMuted;
    ctx.font = '700 10.5px "JetBrains Mono", monospace';
    ctx.fillText(serialText, paddingX, barcodeY + 44);
  }

  return canvas.toDataURL('image/png', 1.0);
}
