// --- BEANTAG AESTHETIC SPECIALTY COFFEE CARD & TICKET GENERATOR ---
import { stripEmojis, getScaColorForNote } from './scaIcons';

export function normalizeCardStyle(template) {
  if (!template) return 'editorial';
  const t = String(template).toLowerCase();
  if (t === 'craft' || t === 'ticket') return 'ticket';
  if (t === 'minimal' || t === 'editorial') return 'editorial';
  if (t === 'dark' || t === 'archive') return 'archive';
  if (t === 'list') return 'ticket';
  return 'editorial';
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
 * Renders an Ultra-Aesthetic High-DPI Specialty Coffee Share Card (840 x 560 px @ 2x Retina = 1680x1120)
 * Supporting 3 distinct aesthetic styles:
 * - 'editorial': Nordic atelier passport card with clean margins and pastel chips.
 * - 'ticket': Authentic specialty coffee barista calibration receipt with barcode.
 * - 'archive': Tokyo Coffee Lab specimen index sheet with monospace metadata matrix.
 * 
 * @param {Object} recipe Recipe or batch data
 * @param {string} template 'editorial' | 'ticket' | 'archive' (also supports legacy 'craft', 'minimal', 'dark')
 * @param {boolean} incRecipe Whether to include extraction recipe or only coffee bean metadata
 * @returns {string} Base64 PNG data URL
 */
export function generateRecipeCardImage(recipe, template = 'editorial', incRecipe = true) {
  const canvas = document.createElement('canvas');
  const scaleFactor = 2;
  const baseW = 840;
  const baseH = 560;

  canvas.width = baseW * scaleFactor;
  canvas.height = baseH * scaleFactor;

  const ctx = canvas.getContext('2d');
  ctx.scale(scaleFactor, scaleFactor);

  const style = normalizeCardStyle(template);

  // Palette definitions based on style
  const theme = style === 'archive' ? {
    bgPaper: '#12141A',
    borderPaper: '#252B38',
    textMain: '#F8FAFC',
    textMuted: '#94A3B8',
    textLight: '#64748B',
    accent: '#E06C60',
    cardBg: '#1A1E27',
    cardBorder: '#2E3646',
    divider: 'rgba(255, 255, 255, 0.12)',
    stampColor: '#E06C60',
    pillBg: 'rgba(224, 108, 96, 0.15)'
  } : style === 'ticket' ? {
    bgPaper: '#FAF8F5',
    borderPaper: '#E5DFD5',
    textMain: '#1A202C',
    textMuted: '#64748B',
    textLight: '#94A3B8',
    accent: '#C53030',
    cardBg: '#F4EFEB',
    cardBorder: '#E2DAD0',
    divider: 'rgba(0, 0, 0, 0.1)',
    stampColor: '#C53030',
    pillBg: '#EAE3DA'
  } : {
    // 'editorial' (Nordic Atelier)
    bgPaper: '#FDFBF7',
    borderPaper: '#EAE5DD',
    textMain: '#1C1917',
    textMuted: '#78716C',
    textLight: '#A8A29E',
    accent: '#BC5449',
    cardBg: '#FFFFFF',
    cardBorder: '#ECE7DF',
    divider: 'rgba(60, 60, 67, 0.1)',
    stampColor: '#BC5449',
    pillBg: 'rgba(188, 84, 73, 0.08)'
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

  ctx.clearRect(0, 0, baseW, baseH);

  // 1. Frame Silhouette Rendering
  const paddingX = 48;

  if (style === 'ticket') {
    // Authentic Receipt Zig-zag cut
    const tLeft = 0;
    const tRight = baseW;
    const toothW = 14;
    const toothH = 9;
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

    // Center subtle crease
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.03)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(baseW / 2, 14);
    ctx.lineTo(baseW / 2, baseH - 14);
    ctx.stroke();
    ctx.restore();
  } else if (style === 'archive') {
    // Tokyo Lab Specimen Card with Vermilion Left Accent Bar
    ctx.fillStyle = theme.bgPaper;
    ctx.strokeStyle = theme.borderPaper;
    ctx.lineWidth = 1.5;
    drawRoundedRect(ctx, 10, 10, baseW - 20, baseH - 20, 10, true, true);

    // Vermilion Left Bar
    ctx.fillStyle = theme.accent;
    drawRoundedRect(ctx, 10, 10, 7, baseH - 20, 3, true, false);
  } else {
    // 'editorial' Nordic Atelier Card with refined radius and soft border
    ctx.fillStyle = theme.bgPaper;
    ctx.strokeStyle = theme.borderPaper;
    ctx.lineWidth = 1.5;
    drawRoundedRect(ctx, 12, 12, baseW - 24, baseH - 24, 18, true, true);
  }

  // 2. Header
  const curY = 46;

  if (style === 'archive') {
    ctx.fillStyle = theme.accent;
    ctx.font = '800 11px "JetBrains Mono", monospace';
    ctx.fillText('TOKYO COFFEE RESEARCH LAB // CRYO SPECIMEN', paddingX, curY);

    ctx.fillStyle = theme.textMuted;
    ctx.font = '700 10px "JetBrains Mono", monospace';
    const sub = incRecipe ? 'EXTRACTION & CALIBRATION SPEC SHEET' : 'BOTANICAL & ROAST SPEC SHEET';
    ctx.fillText(sub, paddingX, curY + 16);
  } else if (style === 'editorial') {
    ctx.fillStyle = theme.accent;
    ctx.font = '800 11px "JetBrains Mono", monospace';
    ctx.fillText('★ BEANTAG • SPECIALTY COFFEE ATELIER ★', paddingX, curY);

    ctx.fillStyle = theme.textMuted;
    ctx.font = '600 11px "Space Grotesk", sans-serif';
    const sub = incRecipe ? 'Ficha de Cata & Calibración de Barista' : 'Ficha de Origen & Tueste de Especialidad';
    ctx.fillText(sub, paddingX, curY + 16);
  } else {
    // Ticket
    ctx.fillStyle = theme.accent;
    ctx.font = '800 11.5px "JetBrains Mono", monospace';
    ctx.fillText('★ BEANTAG BARISTA CALIBRATION TICKET ★', paddingX, curY);

    ctx.fillStyle = theme.textMuted;
    ctx.font = '700 10px "JetBrains Mono", monospace';
    const sub = incRecipe ? 'POS REGISTRO DE EXTRACCIÓN' : 'REGISTRO TÉRMICO DE LOTE';
    ctx.fillText(sub, paddingX, curY + 16);
  }

  // Header Right Stamp / Seal
  const stampX = baseW - paddingX - 44;
  const stampY = curY + 6;
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

  if (style === 'archive') {
    ctx.font = '800 8px "JetBrains Mono", monospace';
    ctx.fillText('TOKYO LAB', stampX, stampY - 14);
    ctx.font = '800 13px "JetBrains Mono", monospace';
    ctx.fillText('CRYO', stampX, stampY);
    ctx.font = '700 7.5px "JetBrains Mono", monospace';
    ctx.fillText('ARCHIVED', stampX, stampY + 13);
  } else if (style === 'editorial') {
    ctx.font = '800 8.5px "JetBrains Mono", monospace';
    ctx.fillText('ATELIER', stampX, stampY - 14);
    ctx.font = '800 13px "Space Grotesk", sans-serif';
    ctx.fillText(incRecipe ? '88+ SCA' : 'NORDIC', stampX, stampY);
    ctx.font = '700 7.5px "JetBrains Mono", monospace';
    ctx.fillText('PASSPORT', stampX, stampY + 13);
  } else {
    ctx.font = '800 8.5px "JetBrains Mono", monospace';
    ctx.fillText('BARISTA', stampX, stampY - 14);
    ctx.font = '800 13px "Space Grotesk", sans-serif';
    ctx.fillText(incRecipe ? 'CALIB' : 'CRAFT', stampX, stampY);
    ctx.font = '700 7.5px "JetBrains Mono", monospace';
    ctx.fillText('VERIFIED', stampX, stampY + 13);
  }
  ctx.restore();

  // Divider Line
  ctx.strokeStyle = theme.divider;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(paddingX, 90);
  ctx.lineTo(baseW - paddingX, 90);
  ctx.stroke();

  // 3. Hero Coffee Name & Badges
  const heroY = 120;
  ctx.fillStyle = theme.textMain;
  const coffeeName = (recipe.batch_name || 'Café de Especialidad').toUpperCase();
  const fontChoice = style === 'archive' ? 'JetBrains Mono, monospace' : 'Space Grotesk, sans-serif';
  drawFittedText(coffeeName, paddingX, heroY, baseW - (paddingX * 2) - 10, 24, fontChoice, '800');

  // Sub-badges row: Roaster, Origin, Altitude
  const badgeY = heroY + 12;
  let currentBadgeX = paddingX;

  const drawPill = (label, bg, textCol, borderCol) => {
    ctx.font = style === 'archive' ? '700 9.5px "JetBrains Mono", monospace' : '700 10.5px "JetBrains Mono", monospace';
    const textWidth = ctx.measureText(label).width;
    const pillW = textWidth + 16;
    const pillH = 22;

    ctx.fillStyle = bg;
    ctx.strokeStyle = borderCol;
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, currentBadgeX, badgeY, pillW, pillH, style === 'archive' ? 4 : 6, true, true);

    ctx.fillStyle = textCol;
    ctx.fillText(label, currentBadgeX + 8, badgeY + 15);
    currentBadgeX += pillW + 8;
  };

  if (recipe.batch_roaster) {
    drawPill(`🏷️ ${recipe.batch_roaster.toUpperCase()}`, theme.cardBg, theme.textMain, theme.cardBorder);
  }
  if (recipe.batch_origin) {
    drawPill(`📍 ${recipe.batch_origin.toUpperCase()}`, theme.cardBg, theme.textMain, theme.cardBorder);
  }
  if (recipe.batch_altitude) {
    drawPill(`⛰️ ${recipe.batch_altitude}M`, theme.cardBg, theme.accent, theme.cardBorder);
  }

  // 4. Structured Metric Grid (4 Clean Spec Cards)
  const gridY = 175;
  const cardW = (baseW - (paddingX * 2) - 24) / 4;
  const cardH = 76;

  const metrics = incRecipe ? [
    {
      label: 'MÉTODO & DOSIS',
      val: (recipe.method || 'V60').toUpperCase().replace(' (FILTRADO)', ''),
      sub: `${recipe.dose_in_g ? recipe.dose_in_g + 'g In' : '20.0g In'}`
    },
    {
      label: 'RATIO & AGUA',
      val: (recipe.ratio || '1:15').toUpperCase(),
      sub: `~${Math.round((parseFloat(recipe.dose_in_g) || 20) * (parseFloat(String(recipe.ratio).replace('1:', '')) || 15))}g H₂O`
    },
    {
      label: 'MOLIENDA / CAL.',
      val: (recipe.grind ? String(recipe.grind).slice(0, 15) : 'CALIBRADA').toUpperCase(),
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
      val: (recipe.batch_producer || 'SELECCIÓN FINCA').toUpperCase().slice(0, 16),
      sub: recipe.batch_altitude ? `${recipe.batch_altitude}m` : 'Altitud Óptima'
    },
    {
      label: 'TUESTE & ESTADO',
      val: (recipe.batch_roast_date ? recipe.batch_roast_date.slice(0, 10) : 'EN PICO').toUpperCase(),
      sub: 'Dosis Congelada ❄️'
    }
  ];

  metrics.forEach((m, idx) => {
    const x = paddingX + idx * (cardW + 8);
    ctx.fillStyle = theme.cardBg;
    ctx.strokeStyle = theme.cardBorder;
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, x, gridY, cardW, cardH, style === 'archive' ? 5 : 8, true, true);

    // Label
    ctx.fillStyle = theme.textLight;
    ctx.font = '700 9.5px "JetBrains Mono", monospace';
    drawTruncatedText(m.label, x + 10, gridY + 20, cardW - 20);

    // Value
    ctx.fillStyle = theme.textMain;
    ctx.font = style === 'archive' ? '800 13px "JetBrains Mono", monospace' : '800 13.5px "Space Grotesk", sans-serif';
    drawTruncatedText(m.val, x + 10, gridY + 44, cardW - 20);

    // Subtitle
    ctx.fillStyle = theme.accent;
    ctx.font = '700 10.5px "JetBrains Mono", monospace';
    drawTruncatedText(m.sub, x + 10, gridY + 63, cardW - 20);
  });

  // 5. SCA Flavor Chips Section
  const flavorY = 278;
  ctx.fillStyle = theme.textLight;
  ctx.font = '800 10px "JetBrains Mono", monospace';
  ctx.fillText(style === 'archive' ? 'SCA_FLAVOR_TAGS & DESCRIPTORES:' : 'NOTAS DE CATA & PERFIL SENSORIAL (SCA):', paddingX, flavorY);

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
        ctx.fillStyle = style === 'archive' ? '#1C2028' : col.bg;
        ctx.strokeStyle = style === 'archive' ? theme.accent : col.border;
        ctx.lineWidth = 1.2;
        drawRoundedRect(ctx, chipX, chipY, w, h, style === 'archive' ? 4 : 13, true, true);

        ctx.fillStyle = style === 'archive' ? '#FFFFFF' : col.text;
        ctx.fillText(tag, chipX + 10, chipY + 17);
        chipX += w + 8;
      }
    });
  } else {
    ctx.fillStyle = theme.textMuted;
    ctx.font = '700 12px "Space Grotesk", sans-serif';
    ctx.fillText('Equilibrado, notas limpias y dulzura natural de café de especialidad.', paddingX, chipY + 16);
  }

  // 6. Barista Sensory Balance Summary (Taza & Extracción)
  const sensoryY = 346;
  ctx.fillStyle = theme.cardBg;
  ctx.strokeStyle = theme.cardBorder;
  ctx.lineWidth = 1;
  const sensoryBoxH = 58;
  drawRoundedRect(ctx, paddingX, sensoryY, baseW - (paddingX * 2), sensoryBoxH, style === 'archive' ? 5 : 8, true, true);

  ctx.fillStyle = theme.textMuted;
  ctx.font = '700 10px "JetBrains Mono", monospace';
  ctx.fillText(style === 'archive' ? 'EVALUATION_LOG // TAZA & BALANCE:' : 'EVALUACIÓN EN TAZA & BALANCE:', paddingX + 14, sensoryY + 22);

  ctx.fillStyle = theme.textMain;
  ctx.font = style === 'archive' ? '700 12px "JetBrains Mono", monospace' : '800 13px "Space Grotesk", sans-serif';

  if (incRecipe) {
    const balanceStr = `Balance: ${recipe.sensory_balance || 'Dulce'}  •  Cuerpo: ${recipe.sensory_body || 'Medio'}  •  Extracción: ${recipe.sensory_extraction || 'En Punto ✨'}`;
    drawTruncatedText(balanceStr, paddingX + 14, sensoryY + 44, baseW - (paddingX * 2) - 28);
  } else {
    const originSummary = `Lote ${recipe.batch_variety || 'Specialty'}  •  Proceso ${recipe.batch_process || 'Lavado'}  •  ${recipe.batch_altitude ? recipe.batch_altitude + 'm' : 'Alta Altura'}`;
    drawTruncatedText(originSummary, paddingX + 14, sensoryY + 44, baseW - (paddingX * 2) - 28);
  }

  // 7. Footer: Dashed Divider, Barcode or Minimalist Seal
  const footerDividerY = 428;
  ctx.save();
  ctx.strokeStyle = theme.divider;
  ctx.lineWidth = 1.4;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(paddingX, footerDividerY);
  ctx.lineTo(baseW - paddingX, footerDividerY);
  ctx.stroke();
  ctx.restore();

  const receiptDate = new Date(recipe.created_at || Date.now()).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

  if (style === 'editorial') {
    // Elegant Nordic Footer without barcode
    ctx.fillStyle = theme.textMuted;
    ctx.font = '700 11.5px "Space Grotesk", sans-serif';
    ctx.fillText(`☕ BEANTAG COFFEE ATELIER // ${receiptDate.toUpperCase()} // REGISTRO N° ${recipe.id || '01'}`, paddingX, 472);

    ctx.fillStyle = theme.accent;
    ctx.font = '700 10.5px "JetBrains Mono", monospace';
    ctx.fillText('DISFRUTADO CON CAFÉ DE ESPECIALIDAD CONGELADO AL VACÍO • BEANTAG.APP', paddingX, 498);
  } else {
    // Ticket & Archive: Realistic Barcode & Serial Hash
    const barcodeY = 450;
    const barPattern = [3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 4, 1, 3, 1, 2, 4, 2, 3, 1, 4];
    let curBarX = paddingX;
    ctx.fillStyle = theme.textMain;
    barPattern.forEach((w, i) => {
      if (i % 2 === 0) {
        ctx.fillRect(curBarX, barcodeY, w * 2.2, 30);
      }
      curBarX += (w * 2.2) + 2.5;
    });

    const serialText = style === 'archive' 
      ? `★ TOKYO-LAB #BT-0${recipe.id || '01'} // ${receiptDate.toUpperCase()} // ARCHIVE HASH VERIFIED ★`
      : `★ 2026-BT#0${recipe.id || '294'} // ${receiptDate.toUpperCase()} // BEANTAG SPECIALTY BARISTA ★`;
    ctx.fillStyle = theme.textMuted;
    ctx.font = '700 11px "JetBrains Mono", monospace';
    ctx.fillText(serialText, paddingX, 514);
  }

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
 * listing all coffees in inventory in 3 styles: 'editorial' | 'ticket' | 'archive'
 * 
 * @param {Array} batches List of coffee batches
 * @param {string} template 'editorial' | 'ticket' | 'archive'
 * @returns {string} Base64 PNG data URL
 */
export function generateCoffeeMenuCardImage(batches, template = 'editorial') {
  const canvas = document.createElement('canvas');
  const scaleFactor = 2;
  const baseW = 840;

  const validBatches = Array.isArray(batches) ? batches.filter(b => (b.remaining_doses || 0) > 0) : [];
  const displayList = validBatches.length > 0 ? validBatches : (Array.isArray(batches) ? batches.slice(0, 8) : []);
  
  // Calculate dynamic height based on number of items
  const headerH = 140;
  const itemH = 94;
  const footerH = 100;
  const baseH = Math.max(580, headerH + (displayList.length * itemH) + footerH);

  canvas.width = baseW * scaleFactor;
  canvas.height = baseH * scaleFactor;

  const ctx = canvas.getContext('2d');
  ctx.scale(scaleFactor, scaleFactor);

  const style = normalizeCardStyle(template);

  const theme = style === 'archive' ? {
    bgPaper: '#12141A',
    borderPaper: '#252B38',
    textMain: '#F8FAFC',
    textMuted: '#94A3B8',
    textLight: '#64748B',
    accent: '#E06C60',
    cardBg: '#1A1E27',
    cardBorder: '#2E3646',
    divider: 'rgba(255,255,255,0.12)',
    stampColor: '#E06C60'
  } : style === 'ticket' ? {
    bgPaper: '#FAF8F5',
    borderPaper: '#E5DFD5',
    textMain: '#1A202C',
    textMuted: '#64748B',
    textLight: '#94A3B8',
    accent: '#C53030',
    cardBg: '#F4EFEB',
    cardBorder: '#E2DAD0',
    divider: 'rgba(0,0,0,0.1)',
    stampColor: '#C53030'
  } : {
    // 'editorial'
    bgPaper: '#FDFBF7',
    borderPaper: '#EAE5DD',
    textMain: '#1C1917',
    textMuted: '#78716C',
    textLight: '#A8A29E',
    accent: '#BC5449',
    cardBg: '#FFFFFF',
    cardBorder: '#ECE7DF',
    divider: 'rgba(60, 60, 67, 0.1)',
    stampColor: '#BC5449'
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

  // 1. Draw Outer Frame
  const paddingX = 48;

  if (style === 'ticket') {
    const tLeft = 0;
    const tRight = baseW;
    const toothW = 14;
    const toothH = 9;
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
    drawRoundedRect(ctx, 10, 10, baseW - 20, baseH - 20, 10, true, true);

    ctx.fillStyle = theme.accent;
    drawRoundedRect(ctx, 10, 10, 7, baseH - 20, 3, true, false);
  } else {
    // editorial
    ctx.fillStyle = theme.bgPaper;
    ctx.strokeStyle = theme.borderPaper;
    ctx.lineWidth = 1.5;
    drawRoundedRect(ctx, 12, 12, baseW - 24, baseH - 24, 20, true, true);
  }

  // 2. Header
  let curY = 46;

  if (style === 'archive') {
    ctx.fillStyle = theme.accent;
    ctx.font = '800 12px "JetBrains Mono", monospace';
    ctx.fillText('★ TOKYO COFFEE LAB // CRYO INVENTORY REGISTRY ★', paddingX, curY);

    ctx.fillStyle = theme.textMuted;
    ctx.font = '700 10.5px "JetBrains Mono", monospace';
    ctx.fillText('CATÁLOGO DE VARIEDADES & DOSIS CONGELADAS DISPONIBLES', paddingX, curY + 16);
  } else if (style === 'editorial') {
    ctx.fillStyle = theme.accent;
    ctx.font = '800 12px "JetBrains Mono", monospace';
    ctx.fillText('★ CARTA DE CAFÉS DE ESPECIALIDAD • BEANTAG ★', paddingX, curY);

    ctx.fillStyle = theme.textMuted;
    ctx.font = '600 11px "Space Grotesk", sans-serif';
    ctx.fillText('Colección de Lotes en Cava Congelada • Listas para Calibrar', paddingX, curY + 16);
  } else {
    ctx.fillStyle = theme.accent;
    ctx.font = '800 12px "JetBrains Mono", monospace';
    ctx.fillText('★ BEANTAG SPECIALTY COFFEE BARISTA MANIFEST ★', paddingX, curY);

    ctx.fillStyle = theme.textMuted;
    ctx.font = '700 10.5px "JetBrains Mono", monospace';
    ctx.fillText('CARTA DE CAFÉS & DOSIS CONGELADAS DISPONIBLES', paddingX, curY + 16);
  }

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
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '800 8.5px "JetBrains Mono", monospace';
  ctx.fillText(style === 'archive' ? 'CRYO LAB' : 'BARISTA MENU', stampX, stampY - 14);
  ctx.font = '800 14px "Space Grotesk", sans-serif';
  ctx.fillText(`${displayList.length} LOTES`, stampX, stampY);
  ctx.font = '700 7.5px "JetBrains Mono", monospace';
  ctx.fillText('COLD CAVA', stampX, stampY + 13);
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
    const itemCardH = 84;

    // Item Container Box
    ctx.fillStyle = theme.cardBg;
    ctx.strokeStyle = theme.cardBorder;
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, paddingX, itemCardY, itemCardW, itemCardH, style === 'archive' ? 5 : 8, true, true);

    // Number Badge (e.g. 01, 02)
    const numBadgeW = 32;
    ctx.fillStyle = style === 'archive' ? '#252B38' : theme.borderPaper;
    ctx.fillRect(paddingX, itemCardY, numBadgeW, itemCardH);

    ctx.fillStyle = theme.accent;
    ctx.font = '800 11.5px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText((idx + 1).toString().padStart(2, '0'), paddingX + (numBadgeW / 2), itemCardY + (itemCardH / 2) + 4);
    ctx.textAlign = 'left';

    const contentX = paddingX + numBadgeW + 14;

    // Line 1: Coffee Name & Roaster Badge
    ctx.fillStyle = theme.textMain;
    ctx.font = style === 'archive' ? '800 14.5px "JetBrains Mono", monospace' : '800 15px "Space Grotesk", sans-serif';
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

    // Line 2: Origin, Producer & Altitude
    ctx.fillStyle = theme.textMuted;
    ctx.font = '700 10.5px "JetBrains Mono", monospace';
    const originStr = `${b.roaster ? b.roaster.toUpperCase() + ' • ' : ''}${b.origin ? b.origin.toUpperCase() + ' • ' : ''}${b.altitude ? b.altitude + 'M' : 'ALTA ALTITUD'}`;
    drawTruncatedText(originStr, contentX, itemCardY + 43, itemCardW - numBadgeW - 30);

    // Line 3: Variety, Process & Flavor Notes
    const flavorTags = extractFlavorTags(b.roaster_notes);
    ctx.fillStyle = theme.accent;
    ctx.font = '700 11px "Space Grotesk", sans-serif';
    const specStr = `${b.variety || 'Heirloom'} (${b.process || 'Lavado'})${flavorTags.length > 0 ? ' — Notas: ' + flavorTags.slice(0, 3).join(', ') : ''}`;
    drawTruncatedText(specStr, contentX, itemCardY + 65, itemCardW - numBadgeW - 30);

    curY += itemH;
  });

  // 4. Footer: Authentic Barcode & Archive Serial
  const footerY = curY + 12;
  ctx.save();
  ctx.strokeStyle = theme.divider;
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

    const serialText = style === 'archive'
      ? `★ TOKYO LAB CRYO MANIFEST // ${menuDate.toUpperCase()} // ${displayList.length} LOTES EN INVENTARIO ★`
      : `★ BEANTAG ARCHIVE // ${menuDate.toUpperCase()} // ${displayList.length} LOTES REGISTRADOS ★`;
    ctx.fillStyle = theme.textMuted;
    ctx.font = '700 11px "JetBrains Mono", monospace';
    ctx.fillText(serialText, paddingX, barcodeY + 48);
  }

  return canvas.toDataURL('image/png', 1.0);
}
