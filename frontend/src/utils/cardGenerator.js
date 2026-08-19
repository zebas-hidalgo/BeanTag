// --- BEANTAG AUTHENTIC POS THERMAL RECEIPT GENERATOR ---
import { stripEmojis } from './scaIcons';

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

/**
 * Renders an authentic high-DPI POS thermal barista receipt (840 x 540 px)
 * @param {Object} recipe Recipe or batch data
 * @param {boolean} incRecipe Whether to include extraction recipe or only coffee bean metadata
 * @returns {string} Base64 PNG data URL
 */
export function generateRecipeCardImage(recipe, template = 'receipt', incRecipe = true) {
  const canvas = document.createElement('canvas');
  // 2x Retina supersampling for ultra-crisp typography and barcode
  const scaleFactor = 2;
  const baseW = 840;
  const baseH = 540;

  canvas.width = baseW * scaleFactor;
  canvas.height = baseH * scaleFactor;

  const ctx = canvas.getContext('2d');
  ctx.scale(scaleFactor, scaleFactor);

  const colorTextDark = '#0F172A';
  const colorTextMuted = '#475569';

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

  const drawFittedText = (text, x, y, maxWidth, initialSize = 22, fontName = 'JetBrains Mono', weight = '800') => {
    const str = String(text || '');
    let size = initialSize;
    ctx.font = `${weight} ${size}px "${fontName}", monospace`;
    while (size > 13 && ctx.measureText(str).width > maxWidth) {
      size -= 1;
      ctx.font = `${weight} ${size}px "${fontName}", monospace`;
    }
    drawTruncatedText(str, x, y, maxWidth);
  };

  ctx.clearRect(0, 0, baseW, baseH);

  // Body with zig-zag cuts top & bottom
  const tLeft = 0;
  const tRight = baseW;
  const toothW = 14;
  const toothH = 10;
  const topY = 0;
  const bottomY = baseH;

  ctx.beginPath();
  ctx.moveTo(tLeft, topY + toothH);

  // Top zig-zag
  for (let x = tLeft; x < tRight; x += toothW) {
    ctx.lineTo(x + toothW / 2, topY);
    ctx.lineTo(Math.min(tRight, x + toothW), topY + toothH);
  }

  // Right border
  ctx.lineTo(tRight, bottomY - toothH);

  // Bottom zig-zag
  for (let x = tRight; x > tLeft; x -= toothW) {
    ctx.lineTo(x - toothW / 2, bottomY);
    ctx.lineTo(Math.max(tLeft, x - toothW), bottomY - toothH);
  }

  // Left border
  ctx.lineTo(tLeft, topY + toothH);
  ctx.closePath();

  // Creamy thermal paper background
  ctx.fillStyle = '#FAF8F5';
  ctx.fill();

  // Outline cut paper
  ctx.strokeStyle = '#D1D5DB';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Central subtle crease
  ctx.save();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.04)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(baseW / 2, 15);
  ctx.lineTo(baseW / 2, baseH - 15);
  ctx.stroke();
  ctx.restore();

  // 1. Receipt Header
  ctx.fillStyle = colorTextDark;
  ctx.font = '800 28px "Space Grotesk", sans-serif';
  const headerTitle = incRecipe ? 'REGISTRO DE EXTRACCIÓN' : 'FICHA TÉCNICA DE LOTE';
  drawTruncatedText(`RECIBO #0${recipe.id || '294'} | ${headerTitle}`, 50, 68, 740);

  ctx.strokeStyle = '#94A3B8';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(50, 95); ctx.lineTo(790, 95); ctx.stroke();

  // 2. Table Header Columns
  ctx.font = '800 18px "JetBrains Mono", monospace';
  ctx.fillStyle = colorTextMuted;
  drawTruncatedText('CANT.', 50, 125, 180);
  drawTruncatedText('DESCRIPCIÓN', 235, 125, 350);
  drawTruncatedText('VALOR', 595, 125, 195);

  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(50, 138); ctx.lineTo(790, 138); ctx.stroke();

  // 3. Table Rows
  ctx.font = '800 21px "JetBrains Mono", monospace';
  ctx.fillStyle = colorTextDark;

  if (incRecipe) {
    // Row 1: Grano
    drawTruncatedText('1x  GRANO', 50, 172, 180);
    drawFittedText(String(recipe.batch_name || 'N/A').toUpperCase(), 235, 172, 350, 21);
    drawTruncatedText((recipe.batch_roaster || 'SPECIALTY').toUpperCase(), 595, 172, 195);

    // Row 2: Método
    drawTruncatedText('1x  MÉTODO', 50, 212, 180);
    drawFittedText(String(recipe.method || 'V60 (FILTRADO)').toUpperCase(), 235, 212, 350, 21);
    drawTruncatedText(`${recipe.dose_in_g ? recipe.dose_in_g + 'G' : '20G'}`, 595, 212, 195);

    // Row 3: Molienda / Molino
    drawTruncatedText('1x  MOLIENDA', 50, 252, 180);
    drawFittedText(String(recipe.grind || 'N/A').toUpperCase(), 235, 252, 350, 21);
    drawTruncatedText(recipe.temperature ? String(recipe.temperature).toUpperCase() : '93°C', 595, 252, 195);

    // Row 4: Ratio
    drawTruncatedText('1x  RATIO', 50, 292, 180);
    drawFittedText(String(recipe.ratio || '1:15').toUpperCase(), 235, 292, 350, 21);
    drawTruncatedText(recipe.brew_time ? String(recipe.brew_time).toUpperCase() : '2:30 MIN', 595, 292, 195);
  } else {
    // Row 1: Grano
    drawTruncatedText('1x  GRANO', 50, 172, 180);
    drawFittedText(String(recipe.batch_name || 'N/A').toUpperCase(), 235, 172, 350, 21);
    drawTruncatedText((recipe.batch_roaster || 'TOSTADOR').toUpperCase(), 595, 172, 195);

    // Row 2: Origen
    drawTruncatedText('1x  ORIGEN', 50, 212, 180);
    drawFittedText(String(recipe.batch_origin || 'N/A').toUpperCase(), 235, 212, 350, 21);
    drawTruncatedText(recipe.batch_altitude ? String(recipe.batch_altitude).toUpperCase() : 'ALTITUD', 595, 212, 195);

    // Row 3: Productor / Finca
    drawTruncatedText('1x  PRODUCTOR', 50, 252, 180);
    drawFittedText(String(recipe.batch_producer || 'N/A').toUpperCase(), 235, 252, 350, 21);
    drawTruncatedText(recipe.batch_variety ? String(recipe.batch_variety).toUpperCase() : 'VARIEDAD', 595, 252, 195);

    // Row 4: Proceso
    drawTruncatedText('1x  PROCESO', 50, 292, 180);
    drawFittedText(String(recipe.batch_process || 'N/A').toUpperCase(), 235, 292, 350, 21);
    drawTruncatedText(recipe.batch_roast_date ? String(recipe.batch_roast_date).toUpperCase() : 'TUESTE', 595, 292, 195);
  }

  // 4. Dashed Divider
  ctx.strokeStyle = '#94A3B8';
  ctx.lineWidth = 1.5;
  ctx.save();
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(50, 330); ctx.lineTo(790, 330); ctx.stroke();
  ctx.restore();

  // 5. Notes & Sensory
  const flavorTags = extractFlavorTags(recipe.batch_roaster_notes || recipe.notes);
  const notesText = flavorTags.join(', ').toUpperCase() || 'ESPECIALIDAD';

  ctx.font = '800 20px "JetBrains Mono", monospace';
  ctx.fillStyle = colorTextDark;
  drawTruncatedText(`NOTAS: ..... ${notesText}`, 50, 358, 740);

  if (incRecipe) {
    const sensorySummary = `TAZA: ...... ${recipe.sensory_balance || 'DULCE'} • ${recipe.sensory_body || 'MEDIO'} • ${recipe.sensory_extraction || 'EN PUNTO ✨'}`;
    drawTruncatedText(sensorySummary.toUpperCase(), 50, 388, 740);
  } else {
    const batchSummary = `PERFIL: .... VARIEDAD ${recipe.batch_variety || 'ESPECIAL'} • PROCESO ${recipe.batch_process || 'LAVADO'}`;
    drawTruncatedText(batchSummary.toUpperCase(), 50, 388, 740);
  }

  const receiptDate = new Date(recipe.created_at || Date.now()).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  drawTruncatedText(`FECHA: ..... ${receiptDate.toUpperCase()}`, 50, 418, 740);

  // 6. Realistic POS Barcode
  ctx.fillStyle = colorTextDark;
  const barPattern = [3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 4, 1, 3, 1, 2, 4, 2, 3, 1, 4];
  let curBarX = 50;
  barPattern.forEach((w, i) => {
    if (i % 2 === 0) {
      ctx.fillRect(curBarX, 442, w * 2.2, 34);
    }
    curBarX += (w * 2.2) + 2.5;
  });

  const microns = parseGrindToMicrons(recipe.grind);
  const grindTag = microns ? `~${microns} µm` : (recipe.grind ? String(recipe.grind).slice(0, 18) : 'PRECISION');

  ctx.font = '700 13px "JetBrains Mono", monospace';
  ctx.fillStyle = colorTextMuted;
  ctx.fillText(`* 0 2 9 4 - B E A N T A G - ${recipe.id || '88'} • ${grindTag.toUpperCase()} *`, 50, 492);

  return canvas.toDataURL('image/png', 1.0);
}
