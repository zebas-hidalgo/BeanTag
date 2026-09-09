// --- BEANTAG AESTHETIC SPECIALTY COFFEE BARISTA TICKET GENERATOR ---
import { stripEmojis, getScaColorForNote } from './scaIcons';

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
 * Renders an Ultra-Aesthetic High-DPI Specialty Coffee Barista Ticket (840 x 560 px @ 2x Retina)
 * @param {Object} recipe Recipe or batch data
 * @param {string} template 'craft' | 'minimal' | 'dark'
 * @param {boolean} incRecipe Whether to include extraction recipe or only coffee bean metadata
 * @returns {string} Base64 PNG data URL
 */
export function generateRecipeCardImage(recipe, template = 'craft', incRecipe = true) {
  const canvas = document.createElement('canvas');
  const scaleFactor = 2;
  const baseW = 840;
  const baseH = 560;

  canvas.width = baseW * scaleFactor;
  canvas.height = baseH * scaleFactor;

  const ctx = canvas.getContext('2d');
  ctx.scale(scaleFactor, scaleFactor);

  // Palette definitions based on template
  const isDark = template === 'dark';
  const isMinimal = template === 'minimal';

  const theme = {
    bgPaper: isDark ? '#14161A' : (isMinimal ? '#FFFFFF' : '#FAF8F5'),
    borderPaper: isDark ? '#2D3748' : (isMinimal ? '#E2E8F0' : '#E5DFD5'),
    textMain: isDark ? '#F7FAFC' : '#1A202C',
    textMuted: isDark ? '#A0AEC0' : '#64748B',
    textLight: isDark ? '#718096' : '#94A3B8',
    accent: isDark ? '#E53E3E' : (isMinimal ? '#0F172A' : '#C53030'),
    cardBg: isDark ? '#1E222A' : (isMinimal ? '#F8FAFC' : '#F4EFEB'),
    cardBorder: isDark ? '#2D3748' : (isMinimal ? '#E2E8F0' : '#E2DAD0'),
    divider: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
    stampColor: isDark ? 'rgba(229,62,62,0.85)' : (isMinimal ? '#334155' : '#C53030')
  };

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

  const drawFittedText = (text, x, y, maxWidth, initialSize = 22, fontName = 'Space Grotesk, Inter, sans-serif', weight = '800') => {
    const str = String(text || '');
    let size = initialSize;
    ctx.font = `${weight} ${size}px ${fontName}`;
    while (size > 12 && ctx.measureText(str).width > maxWidth) {
      size -= 1;
      ctx.font = `${weight} ${size}px ${fontName}`;
    }
    drawTruncatedText(str, x, y, maxWidth);
  };

  ctx.clearRect(0, 0, baseW, baseH);

  // 1. Draw Paper Cut Silhouette (Zig-Zag teeth top & bottom)
  const tLeft = 0;
  const tRight = baseW;
  const toothW = 14;
  const toothH = 9;
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

  // Paper fill & outer border
  ctx.fillStyle = theme.bgPaper;
  ctx.fill();
  ctx.strokeStyle = theme.borderPaper;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Subtle central crease with shadow highlight
  ctx.save();
  ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(baseW / 2, 14);
  ctx.lineTo(baseW / 2, baseH - 14);
  ctx.stroke();
  ctx.restore();

  // 2. Boutique Header with Micro-Labeling
  const paddingX = 48;
  const curY = 46;

  // Header Left: Brand Tag & Log Type
  ctx.fillStyle = theme.accent;
  ctx.font = '800 11px "JetBrains Mono", monospace';
  ctx.fillText('★ BEANTAG CRAFT COFFEE LAB ★', paddingX, curY);

  ctx.fillStyle = theme.textMuted;
  ctx.font = '700 10px "JetBrains Mono", monospace';
  const subtitle = incRecipe ? 'REGISTRO DE EXTRACCIÓN & CALIBRACIÓN' : 'FICHA TÉCNICA DE ORIGEN & TUESTE';
  ctx.fillText(subtitle, paddingX, curY + 16);

  // Header Right: Circular Boutique Coffee Stamp / Wax Seal
  const stampX = baseW - paddingX - 44;
  const stampY = curY + 6;
  const stampR = 34;

  ctx.save();
  ctx.strokeStyle = theme.stampColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(stampX, stampY, stampR, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(stampX, stampY, stampR - 4, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = theme.stampColor;
  ctx.font = '800 8.5px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SPECIALTY', stampX, stampY - 14);
  ctx.font = '800 13px "Space Grotesk", sans-serif';
  ctx.fillText(incRecipe ? '86+' : 'CRAFT', stampX, stampY);
  ctx.font = '700 7.5px "JetBrains Mono", monospace';
  ctx.fillText('FROZEN DOSE', stampX, stampY + 13);
  ctx.restore();

  // Divider Line
  ctx.strokeStyle = theme.divider;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(paddingX, 90);
  ctx.lineTo(baseW - paddingX, 90);
  ctx.stroke();

  // 3. Hero Coffee Name & Roaster / Origin Pill Badges
  const heroY = 120;
  ctx.fillStyle = theme.textMain;
  ctx.font = '800 25px "Space Grotesk", "Inter", sans-serif';
  const coffeeName = (recipe.batch_name || 'Café de Especialidad').toUpperCase();
  drawFittedText(coffeeName, paddingX, heroY, baseW - (paddingX * 2) - 10, 25, 'Space Grotesk', '800');

  // Sub-badges row: Roaster, Origin, Altitude
  const badgeY = heroY + 12;
  let currentBadgeX = paddingX;

  const drawPill = (label, bg, textCol, borderCol) => {
    ctx.font = '700 10.5px "JetBrains Mono", monospace';
    const textWidth = ctx.measureText(label).width;
    const pillW = textWidth + 16;
    const pillH = 22;

    ctx.fillStyle = bg;
    ctx.strokeStyle = borderCol;
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, currentBadgeX, badgeY, pillW, pillH, 6, true, true);

    ctx.fillStyle = textCol;
    ctx.fillText(label, currentBadgeX + 8, badgeY + 15);
    currentBadgeX += pillW + 8;
  };

  if (recipe.batch_roaster) {
    drawPill(`🏷️ ${recipe.batch_roaster.toUpperCase()}`, theme.cardBg, theme.textMain, theme.cardBorder);
  }
  if (recipe.batch_origin) {
    drawPill(`🌍 ${recipe.batch_origin.toUpperCase()}`, theme.cardBg, theme.textMain, theme.cardBorder);
  }
  if (recipe.batch_altitude) {
    drawPill(`⛰️ ${recipe.batch_altitude}`, theme.cardBg, theme.accent, theme.cardBorder);
  }

  // 4. Structured Metric Grid (4 Clean Spec Cards)
  const gridY = 175;
  const cardW = (baseW - (paddingX * 2) - 24) / 4;
  const cardH = 76;

  const metrics = incRecipe ? [
    {
      label: 'MÉTODO & DOSIS',
      val: (recipe.method || 'V60').toUpperCase(),
      sub: `${recipe.dose_in_g ? recipe.dose_in_g + 'g In' : '20.0g In'}`
    },
    {
      label: 'RATIO & AGUA',
      val: (recipe.ratio || '1:15').toUpperCase(),
      sub: `~${Math.round((parseFloat(recipe.dose_in_g) || 20) * (parseFloat(String(recipe.ratio).replace('1:', '')) || 15))}g H₂O`
    },
    {
      label: 'MOLIENDA / CAL.',
      val: (recipe.grind ? String(recipe.grind).slice(0, 15) : 'PRECISIÓN').toUpperCase(),
      sub: parseGrindToMicrons(recipe.grind) ? `~${parseGrindToMicrons(recipe.grind)} µm` : 'Física Barista'
    },
    {
      label: 'EXTRACCIÓN',
      val: (recipe.brew_time || '2:30 MIN').toUpperCase(),
      sub: recipe.temperature ? `${recipe.temperature}` : '93°C'
    }
  ] : [
    {
      label: 'VARIEDAD BOTÁNICA',
      val: (recipe.batch_variety || 'ESPECIALIDAD').toUpperCase(),
      sub: 'Arabica Heirloom'
    },
    {
      label: 'BENEFICIO',
      val: (recipe.batch_process || 'LAVADO').toUpperCase(),
      sub: 'Proceso de Finca'
    },
    {
      label: 'PRODUCTOR / FINCA',
      val: (recipe.batch_producer || 'PEQUEÑOS PRODUCTORES').toUpperCase().slice(0, 16),
      sub: recipe.batch_altitude || 'Altitud Óptima'
    },
    {
      label: 'TUESTE & FECHA',
      val: (recipe.batch_roast_date ? recipe.batch_roast_date.slice(0, 10) : 'EN PICO').toUpperCase(),
      sub: 'Dosis Congelada ❄️'
    }
  ];

  metrics.forEach((m, idx) => {
    const x = paddingX + idx * (cardW + 8);
    ctx.fillStyle = theme.cardBg;
    ctx.strokeStyle = theme.cardBorder;
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, x, gridY, cardW, cardH, 8, true, true);

    // Label
    ctx.fillStyle = theme.textLight;
    ctx.font = '700 9.5px "JetBrains Mono", monospace';
    drawTruncatedText(m.label, x + 10, gridY + 20, cardW - 20);

    // Value
    ctx.fillStyle = theme.textMain;
    ctx.font = '800 13.5px "Space Grotesk", sans-serif';
    drawTruncatedText(m.val, x + 10, gridY + 44, cardW - 20);

    // Subtitle
    ctx.fillStyle = theme.accent;
    ctx.font = '700 10.5px "JetBrains Mono", monospace';
    drawTruncatedText(m.sub, x + 10, gridY + 63, cardW - 20);
  });

  // 5. SCA Flavor Chips Section (Rendered as Real Color Pills)
  const flavorY = 278;
  ctx.fillStyle = theme.textLight;
  ctx.font = '800 10px "JetBrains Mono", monospace';
  ctx.fillText('NOTAS DE CATA & PERFIL SENSORIAL (SCA):', paddingX, flavorY);

  const flavorTags = extractFlavorTags(recipe.batch_roaster_notes || recipe.notes);
  let chipX = paddingX;
  const chipY = flavorY + 12;

  if (flavorTags.length > 0) {
    flavorTags.slice(0, 5).forEach((tag) => {
      const col = getScaColorForNote(tag);
      ctx.font = '700 11px "Space Grotesk", sans-serif';
      const w = ctx.measureText(tag).width + 20;
      const h = 26;

      if (chipX + w < baseW - paddingX) {
        ctx.fillStyle = isDark ? '#1E222A' : col.bg;
        ctx.strokeStyle = isDark ? theme.accent : col.border;
        ctx.lineWidth = 1.2;
        drawRoundedRect(ctx, chipX, chipY, w, h, 13, true, true);

        ctx.fillStyle = isDark ? '#FFFFFF' : col.text;
        ctx.fillText(tag, chipX + 10, chipY + 17);
        chipX += w + 8;
      }
    });
  } else {
    ctx.fillStyle = theme.textMuted;
    ctx.font = '700 12px "Space Grotesk", sans-serif';
    ctx.fillText('Equilibrado, notas limpias y dulzura natural de especialidad.', paddingX, chipY + 16);
  }

  // 6. Barista Sensory Balance Summary (Taza & Extracción)
  const sensoryY = 346;
  ctx.fillStyle = theme.cardBg;
  ctx.strokeStyle = theme.cardBorder;
  ctx.lineWidth = 1;
  const sensoryBoxH = 58;
  drawRoundedRect(ctx, paddingX, sensoryY, baseW - (paddingX * 2), sensoryBoxH, 8, true, true);

  ctx.fillStyle = theme.textMuted;
  ctx.font = '700 10px "JetBrains Mono", monospace';
  ctx.fillText('EVALUACIÓN EN TAZA & BALANCE:', paddingX + 14, sensoryY + 22);

  ctx.fillStyle = theme.textMain;
  ctx.font = '800 13px "Space Grotesk", sans-serif';

  if (incRecipe) {
    const balanceStr = `Balance: ${recipe.sensory_balance || 'Dulce'}  •  Cuerpo: ${recipe.sensory_body || 'Medio'}  •  Extracción: ${recipe.sensory_extraction || 'En Punto ✨'}`;
    drawTruncatedText(balanceStr, paddingX + 14, sensoryY + 44, baseW - (paddingX * 2) - 28);
  } else {
    const originSummary = `Lote ${recipe.batch_variety || 'Specialty'}  •  Proceso ${recipe.batch_process || 'Lavado'}  •  ${recipe.batch_altitude || 'Alta Altura'}`;
    drawTruncatedText(originSummary, paddingX + 14, sensoryY + 44, baseW - (paddingX * 2) - 28);
  }

  // 7. Footer: Dashed Divider, Authentic Barcode & Serial Hash
  const footerDividerY = 428;
  ctx.save();
  ctx.strokeStyle = theme.divider;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(paddingX, footerDividerY);
  ctx.lineTo(baseW - paddingX, footerDividerY);
  ctx.stroke();
  ctx.restore();

  // Realistic POS Barcode
  const barcodeY = 452;
  const barPattern = [3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 4, 1, 3, 1, 2, 4, 2, 3, 1, 4];
  let curBarX = paddingX;
  ctx.fillStyle = theme.textMain;
  barPattern.forEach((w, i) => {
    if (i % 2 === 0) {
      ctx.fillRect(curBarX, barcodeY, w * 2.2, 32);
    }
    curBarX += (w * 2.2) + 2.5;
  });

  // Footer Metadata Serial & Date
  const receiptDate = new Date(recipe.created_at || Date.now()).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  const serialText = `★ 2026-BT#0${recipe.id || '294'} // ${receiptDate.toUpperCase()} // BEANTAG SPECIALTY ARCHIVE ★`;
  ctx.fillStyle = theme.textMuted;
  ctx.font = '700 11.5px "JetBrains Mono", monospace';
  ctx.fillText(serialText, paddingX, 516);

  return canvas.toDataURL('image/png', 1.0);
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
    const altitude = b.altitude ? ` (${b.altitude})` : '';
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
 * Generates an Ultra-HD (840 x Dynamic Height px) visual Specialty Coffee Menu Card listing all coffees in inventory
 * @param {Array} batches List of coffee batches
 * @param {string} template 'craft' | 'minimal' | 'dark'
 * @returns {string} Base64 PNG data URL
 */
export function generateCoffeeMenuCardImage(batches, template = 'craft') {
  const canvas = document.createElement('canvas');
  const scaleFactor = 2;
  const baseW = 840;

  const validBatches = Array.isArray(batches) ? batches.filter(b => (b.remaining_doses || 0) > 0) : [];
  const displayList = validBatches.length > 0 ? validBatches : (Array.isArray(batches) ? batches.slice(0, 8) : []);
  
  // Calculate dynamic height based on number of items
  const headerH = 140;
  const itemH = 92;
  const footerH = 100;
  const baseH = Math.max(580, headerH + (displayList.length * itemH) + footerH);

  canvas.width = baseW * scaleFactor;
  canvas.height = baseH * scaleFactor;

  const ctx = canvas.getContext('2d');
  ctx.scale(scaleFactor, scaleFactor);

  const isDark = template === 'dark';
  const isMinimal = template === 'minimal';

  const theme = {
    bgPaper: isDark ? '#14161A' : (isMinimal ? '#FFFFFF' : '#FAF8F5'),
    borderPaper: isDark ? '#2D3748' : (isMinimal ? '#E2E8F0' : '#E5DFD5'),
    textMain: isDark ? '#F7FAFC' : '#1A202C',
    textMuted: isDark ? '#A0AEC0' : '#64748B',
    textLight: isDark ? '#718096' : '#94A3B8',
    accent: isDark ? '#E53E3E' : (isMinimal ? '#0F172A' : '#C53030'),
    cardBg: isDark ? '#1E222A' : (isMinimal ? '#F8FAFC' : '#F4EFEB'),
    cardBorder: isDark ? '#2D3748' : (isMinimal ? '#E2E8F0' : '#E2DAD0'),
    divider: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
    stampColor: isDark ? 'rgba(229,62,62,0.85)' : (isMinimal ? '#334155' : '#C53030')
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

  // 1. Draw Paper Cut Silhouette (Zig-Zag teeth top & bottom)
  const tLeft = 0;
  const tRight = baseW;
  const toothW = 14;
  const toothH = 9;
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

  // Fill and stroke
  ctx.fillStyle = theme.bgPaper;
  ctx.fill();
  ctx.strokeStyle = theme.borderPaper;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Subtle central crease
  ctx.save();
  ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(baseW / 2, 14);
  ctx.lineTo(baseW / 2, baseH - 14);
  ctx.stroke();
  ctx.restore();

  // 2. Header
  const paddingX = 48;
  let curY = 46;

  ctx.fillStyle = theme.accent;
  ctx.font = '800 12px "JetBrains Mono", monospace';
  ctx.fillText('★ BEANTAG SPECIALTY COFFEE LAB ★', paddingX, curY);

  ctx.fillStyle = theme.textMuted;
  ctx.font = '700 10.5px "JetBrains Mono", monospace';
  ctx.fillText('CARTA DE CAFÉS & DOSIS CONGELADAS DISPONIBLES', paddingX, curY + 16);

  // Top Right Stamp / Seal
  const stampX = baseW - paddingX - 44;
  const stampY = curY + 10;
  const stampR = 34;

  ctx.save();
  ctx.strokeStyle = theme.stampColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(stampX, stampY, stampR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(stampX, stampY, stampR - 4, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = theme.stampColor;
  ctx.font = '800 8.5px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('BARISTA MENU', stampX, stampY - 14);
  ctx.font = '800 14px "Space Grotesk", sans-serif';
  ctx.fillText(`${displayList.length} LOTES`, stampX, stampY);
  ctx.font = '700 7.5px "JetBrains Mono", monospace';
  ctx.fillText('CRYO CAVA', stampX, stampY + 13);
  ctx.restore();

  // Divider Line
  curY = 96;
  ctx.strokeStyle = theme.divider;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(paddingX, curY);
  ctx.lineTo(baseW - paddingX, curY);
  ctx.stroke();

  // 3. Render Each Coffee Item Card
  curY = 112;

  displayList.forEach((b, idx) => {
    const itemCardY = curY;
    const itemCardW = baseW - (paddingX * 2);
    const itemCardH = 82;

    // Item Container Box
    ctx.fillStyle = theme.cardBg;
    ctx.strokeStyle = theme.cardBorder;
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, paddingX, itemCardY, itemCardW, itemCardH, 8, true, true);

    // Number Badge (e.g. 01, 02)
    const numBadgeW = 28;
    ctx.fillStyle = theme.borderPaper;
    ctx.fillRect(paddingX, itemCardY, numBadgeW, itemCardH);

    ctx.fillStyle = theme.accent;
    ctx.font = '800 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText((idx + 1).toString().padStart(2, '0'), paddingX + (numBadgeW / 2), itemCardY + (itemCardH / 2) + 4);
    ctx.textAlign = 'left';

    const contentX = paddingX + numBadgeW + 12;

    // Line 1: Coffee Name & Roaster Badge
    ctx.fillStyle = theme.textMain;
    ctx.font = '800 15px "Space Grotesk", sans-serif';
    const nameText = (b.name || 'Café Especial').toUpperCase();
    drawTruncatedText(nameText, contentX, itemCardY + 22, itemCardW - numBadgeW - 140);

    // Doses pill on top-right of item card
    const dosesText = `${b.remaining_doses || 0} TUBOS`;
    ctx.font = '700 10.5px "JetBrains Mono", monospace';
    const doseW = ctx.measureText(dosesText).width + 16;
    const doseX = paddingX + itemCardW - doseW - 10;
    ctx.fillStyle = theme.stampColor;
    ctx.fillRect(doseX, itemCardY + 10, doseW, 20);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(dosesText, doseX + 8, itemCardY + 24);

    // Line 2: Origin, Producer & Altitude
    ctx.fillStyle = theme.textMuted;
    ctx.font = '700 10.5px "JetBrains Mono", monospace';
    const originStr = `${b.roaster ? b.roaster.toUpperCase() + ' • ' : ''}${b.origin ? b.origin.toUpperCase() + ' • ' : ''}${b.altitude || 'ALTA ALTITUD'}`;
    drawTruncatedText(originStr, contentX, itemCardY + 42, itemCardW - numBadgeW - 30);

    // Line 3: Variety, Process & Flavor Notes
    const flavorTags = extractFlavorTags(b.roaster_notes);
    ctx.fillStyle = theme.accent;
    ctx.font = '700 11px "Space Grotesk", sans-serif';
    const specStr = `${b.variety || 'Heirloom'} (${b.process || 'Lavado'})${flavorTags.length > 0 ? ' — Notas: ' + flavorTags.slice(0, 3).join(', ') : ''}`;
    drawTruncatedText(specStr, contentX, itemCardY + 64, itemCardW - numBadgeW - 30);

    curY += itemH;
  });

  // 4. Footer: Authentic Barcode & Archive Serial
  const footerY = curY + 12;
  ctx.save();
  ctx.strokeStyle = theme.divider;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(paddingX, footerY);
  ctx.lineTo(baseW - paddingX, footerY);
  ctx.stroke();
  ctx.restore();

  // POS Barcode
  const barcodeY = footerY + 16;
  const barPattern = [3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 4, 1, 3, 1, 2, 4, 2, 3, 1, 4];
  let curBarX = paddingX;
  ctx.fillStyle = theme.textMain;
  barPattern.forEach((w, i) => {
    if (i % 2 === 0) {
      ctx.fillRect(curBarX, barcodeY, w * 2.2, 28);
    }
    curBarX += (w * 2.2) + 2.5;
  });

  const menuDate = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  const serialText = `★ BEANTAG ARCHIVE // ${menuDate.toUpperCase()} // ${displayList.length} LOTES REGISTRADOS ★`;
  ctx.fillStyle = theme.textMuted;
  ctx.font = '700 11.5px "JetBrains Mono", monospace';
  ctx.fillText(serialText, paddingX, barcodeY + 48);

  return canvas.toDataURL('image/png', 1.0);
}

