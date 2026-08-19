// --- BEANTAG ULTRA-HD CANVAS CARD GENERATOR ---
import { getScaColorForNote, stripEmojis } from './scaIcons';

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

function roundRect(ctx, x, y, width, height, radius) {
  if (typeof radius === 'number') {
    radius = { tl: radius, tr: radius, br: radius, bl: radius };
  }
  ctx.beginPath();
  ctx.moveTo(x + radius.tl, y);
  ctx.lineTo(x + width - radius.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
  ctx.lineTo(x + width, y + height - radius.br);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
  ctx.lineTo(x + radius.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
  ctx.lineTo(x, y + radius.tl);
  ctx.quadraticCurveTo(x, y, x + radius.tl, y);
  ctx.closePath();
}

// 1. INSTAGRAM STORY (9:16 - 1080 x 1920 px)
function renderStoryCard(ctx, recipe) {
  const W = 1080;
  const H = 1920;

  // Deep Specialty Charcoal Background
  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, '#0F172A');
  bgGrad.addColorStop(0.5, '#090D16');
  bgGrad.addColorStop(1, '#05070B');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Subtle crimson ambient glow in top corner
  const glowGrad = ctx.createRadialGradient(900, 200, 10, 900, 200, 600);
  glowGrad.addColorStop(0, 'rgba(249, 76, 0, 0.15)');
  glowGrad.addColorStop(1, 'rgba(249, 76, 0, 0)');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 0, W, H);

  // Decorative border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 2;
  roundRect(ctx, 40, 40, W - 80, H - 80, 28);
  ctx.stroke();

  // Top Header: Brand Tag
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = '800 24px "Space Grotesk", sans-serif';
  ctx.fillText('BEANTAG', 80, 110);

  ctx.fillStyle = '#F94C00';
  ctx.font = '900 22px "JetBrains Mono", monospace';
  ctx.fillText('● SPECIALTY EXTRACTION ARCHIVE', 220, 108);

  const dateStr = new Date(recipe.created_at || Date.now()).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.font = '700 20px "JetBrains Mono", monospace';
  ctx.textAlign = 'right';
  ctx.fillText(dateStr, W - 80, 110);
  ctx.textAlign = 'left';

  // 1. Coffee Identity Hero Card
  const idCardY = 160;
  const idCardH = 440;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  roundRect(ctx, 80, idCardY, W - 160, idCardH, 24);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Roaster & Origin
  ctx.fillStyle = '#F97316';
  ctx.font = '800 22px "JetBrains Mono", monospace';
  const roasterText = (recipe.batch_roaster || 'SPECIALTY ROASTER').toUpperCase();
  ctx.fillText(roasterText, 120, idCardY + 60);

  // Coffee Name
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 52px "Space Grotesk", sans-serif';
  let coffeeName = String(recipe.batch_name || 'Café de Especialidad');
  if (ctx.measureText(coffeeName).width > 800) {
    ctx.font = '900 42px "Space Grotesk", sans-serif';
  }
  ctx.fillText(coffeeName, 120, idCardY + 125);

  // Producer / Origin Subtitle
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.font = '700 28px "Space Grotesk", sans-serif';
  const originText = [recipe.batch_producer, recipe.batch_origin].filter(Boolean).join(' • ') || 'Origen Desconocido';
  ctx.fillText(originText, 120, idCardY + 175);

  // Metadata Badges Row (Altitude, Variety, Process)
  const metaBadges = [
    recipe.batch_altitude ? `⛰️ ${recipe.batch_altitude}` : null,
    recipe.batch_variety ? `🌱 ${recipe.batch_variety}` : null,
    recipe.batch_process ? `⚙️ ${recipe.batch_process}` : null
  ].filter(Boolean);

  let curBadgeX = 120;
  metaBadges.forEach(b => {
    ctx.font = '700 22px "Space Grotesk", sans-serif';
    const textW = ctx.measureText(b).width;
    const badgeW = textW + 36;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    roundRect(ctx, curBadgeX, idCardY + 220, badgeW, 46, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.stroke();

    ctx.fillStyle = '#E2E8F0';
    ctx.fillText(b, curBadgeX + 18, idCardY + 252);
    curBadgeX += badgeW + 16;
  });

  // SCA Flavor Tags Chips
  const flavorTags = extractFlavorTags(recipe.batch_roaster_notes || recipe.notes);
  if (flavorTags.length > 0) {
    let curTagX = 120;
    let tagY = idCardY + 310;
    flavorTags.forEach(t => {
      const colors = getScaColorForNote(t);
      ctx.font = '800 22px "Space Grotesk", sans-serif';
      const tWidth = ctx.measureText(t).width;
      const chipW = tWidth + 34;

      if (curTagX + chipW > W - 120) {
        curTagX = 120;
        tagY += 56;
      }

      ctx.fillStyle = colors.bg;
      roundRect(ctx, curTagX, tagY, chipW, 44, 12);
      ctx.fill();
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = colors.text;
      ctx.fillText(t, curTagX + 17, tagY + 30);
      curTagX += chipW + 14;
    });
  }

  // 2. Extraction Specs Bento Grid
  const brewCardY = 640;
  ctx.fillStyle = '#F94C00';
  ctx.font = '900 24px "JetBrains Mono", monospace';
  ctx.fillText('RECETA & PARÁMETROS DE EXTRACCIÓN', 80, brewCardY - 15);

  const gridItems = [
    { label: 'MÉTODO', val: recipe.method || 'V60 (Filtrado)', icon: '☕' },
    { label: 'RATIO', val: recipe.ratio || '1:15', icon: '⚖️' },
    { label: 'DOSIS IN', val: `${recipe.dose_in_g || 20} g`, icon: '📥' },
    { label: 'SALIDA / TIEMPO', val: `${recipe.dose_out_g ? recipe.dose_out_g + 'g • ' : ''}${recipe.brew_time || '2:30 min'}`, icon: '⏱️' },
    { label: 'TEMPERATURA', val: recipe.temperature || '93°C', icon: '🌡️' }
  ];

  const colW = (W - 160 - 24) / 2;
  gridItems.slice(0, 4).forEach((item, idx) => {
    const row = Math.floor(idx / 2);
    const col = idx % 2;
    const itemX = 80 + col * (colW + 24);
    const itemY = brewCardY + row * 160;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    roundRect(ctx, itemX, itemY, colW, 140, 20);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '800 18px "JetBrains Mono", monospace';
    ctx.fillText(`${item.icon} ${item.label}`, itemX + 24, itemY + 45);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 32px "Space Grotesk", sans-serif';
    ctx.fillText(item.val, itemX + 24, itemY + 100);
  });

  // 3. Grinder Hero Card (Femobook A2 / 1Zpresso J-Max / Comandante C40)
  const grinderCardY = brewCardY + 340;
  ctx.fillStyle = 'rgba(249, 76, 0, 0.06)';
  roundRect(ctx, 80, grinderCardY, W - 160, 200, 24);
  ctx.fill();
  ctx.strokeStyle = '#F94C00';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#F97316';
  ctx.font = '900 20px "JetBrains Mono", monospace';
  ctx.fillText('⚙️ CALIBRACIÓN DEL MOLINO', 120, grinderCardY + 48);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 44px "Space Grotesk", sans-serif';
  const grindText = String(recipe.grind || 'Molienda Media');
  ctx.fillText(grindText, 120, grinderCardY + 115);

  const microns = parseGrindToMicrons(recipe.grind);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = '700 24px "JetBrains Mono", monospace';
  const micronsNote = microns ? `Tamaño estimado de partícula: ~${microns} µm` : 'Calibrado con precisión de barista';
  ctx.fillText(micronsNote, 120, grinderCardY + 162);

  // 4. Sensory Evaluation Card
  const sensoryY = grinderCardY + 240;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  roundRect(ctx, 80, sensoryY, W - 160, 220, 24);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = '900 20px "JetBrains Mono", monospace';
  ctx.fillText('PERFIL SENSORIAL EN TAZA', 120, sensoryY + 50);

  const sMetrics = [
    { label: 'BALANCE', val: recipe.sensory_balance || 'Dulce' },
    { label: 'CUERPO', val: recipe.sensory_body || 'Medio' },
    { label: 'EXTRACCIÓN', val: recipe.sensory_extraction || 'En Punto ✨' }
  ];

  sMetrics.forEach((sm, i) => {
    const sX = 120 + i * 280;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '700 18px "JetBrains Mono", monospace';
    ctx.fillText(sm.label, sX, sensoryY + 110);

    ctx.fillStyle = '#F8FAFC';
    ctx.font = '900 28px "Space Grotesk", sans-serif';
    ctx.fillText(sm.val, sX, sensoryY + 155);
  });

  if (recipe.notes) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = 'italic 700 22px "Space Grotesk", sans-serif';
    let cleanNotes = String(recipe.notes).replace(/\[Receta IA:.*?\]/g, '').trim();
    if (cleanNotes) {
      ctx.fillText(`"${cleanNotes.slice(0, 70)}${cleanNotes.length > 70 ? '...' : ''}"`, 120, sensoryY + 195);
    }
  }

  // 5. Minimalist Footer
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(80, H - 180);
  ctx.lineTo(W - 80, H - 180);
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 26px "Space Grotesk", sans-serif';
  ctx.fillText('BeanTag', 80, H - 120);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.font = '700 20px "JetBrains Mono", monospace';
  ctx.fillText('Precision Single-Dose & Specialty Coffee Log', 210, H - 122);
}

// 2. THERMAL RECEIPT (POS 1080 x 1500 px)
function renderReceiptCard(ctx, recipe, incRecipe) {
  const W = 1080;
  const H = 1540;

  // Background canvas dark container
  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, W, H);

  const tLeft = 80;
  const tRight = W - 80;
  const toothW = 20;
  const toothH = 14;
  const topY = 60;
  const bottomY = H - 60;

  ctx.beginPath();
  ctx.moveTo(tLeft, topY + toothH);

  // Top zig-zag
  for (let x = tLeft; x < tRight; x += toothW) {
    ctx.lineTo(x + toothW / 2, topY);
    ctx.lineTo(Math.min(tRight, x + toothW), topY + toothH);
  }

  ctx.lineTo(tRight, bottomY - toothH);

  // Bottom zig-zag
  for (let x = tRight; x > tLeft; x -= toothW) {
    ctx.lineTo(x - toothW / 2, bottomY);
    ctx.lineTo(Math.max(tLeft, x - toothW), bottomY - toothH);
  }

  ctx.lineTo(tLeft, topY + toothH);
  ctx.closePath();

  // Thermal creamy paper fill
  ctx.fillStyle = '#FDFCF7';
  ctx.fill();
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Central paper fold
  ctx.save();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.04)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(W / 2, topY + 20);
  ctx.lineTo(W / 2, bottomY - 20);
  ctx.stroke();
  ctx.restore();

  const colorDark = '#0F172A';
  const colorMuted = '#475569';

  // Receipt Header
  ctx.fillStyle = colorDark;
  ctx.font = '900 36px "Space Grotesk", sans-serif';
  ctx.fillText(`RECIBO #0${recipe.id || '294'} • ${incRecipe ? 'EXTRACCIÓN' : 'LOTE'}`, 140, 160);

  ctx.strokeStyle = '#94A3B8';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(140, 190); ctx.lineTo(W - 140, 190); ctx.stroke();

  // Table Columns Header
  ctx.font = '800 24px "JetBrains Mono", monospace';
  ctx.fillStyle = colorMuted;
  ctx.fillText('CANT.', 140, 235);
  ctx.fillText('DESCRIPCIÓN', 360, 235);
  ctx.fillText('VALOR', W - 320, 235);

  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(140, 255); ctx.lineTo(W - 140, 255); ctx.stroke();

  // Table Rows
  ctx.font = '800 26px "JetBrains Mono", monospace';
  ctx.fillStyle = colorDark;

  const rows = incRecipe ? [
    { cant: '1x GRANO', desc: String(recipe.batch_name || 'N/A').toUpperCase(), val: (recipe.batch_roaster || 'SPECIALTY').toUpperCase() },
    { cant: '1x MÉTODO', desc: String(recipe.method || 'N/A').toUpperCase(), val: `${recipe.dose_in_g || 20}G` },
    { cant: '1x MOLINO', desc: String(recipe.grind || 'N/A').toUpperCase(), val: recipe.temperature || '93°C' },
    { cant: '1x RATIO', desc: String(recipe.ratio || '1:15').toUpperCase(), val: String(recipe.brew_time || '2:30 MIN').toUpperCase() }
  ] : [
    { cant: '1x GRANO', desc: String(recipe.batch_name || 'N/A').toUpperCase(), val: (recipe.batch_roaster || 'TOSTADOR').toUpperCase() },
    { cant: '1x ORIGEN', desc: String(recipe.batch_origin || 'N/A').toUpperCase(), val: (recipe.batch_altitude || 'ALTITUD').toUpperCase() },
    { cant: '1x FINCA', desc: String(recipe.batch_producer || 'N/A').toUpperCase(), val: (recipe.batch_variety || 'VARIEDAD').toUpperCase() },
    { cant: '1x PROCESO', desc: String(recipe.batch_process || 'N/A').toUpperCase(), val: (recipe.batch_roast_date || 'TUESTE').toUpperCase() }
  ];

  let curY = 310;
  rows.forEach(r => {
    ctx.fillText(r.cant, 140, curY);
    ctx.fillText(r.desc.slice(0, 22), 360, curY);
    ctx.fillText(r.val.slice(0, 16), W - 320, curY);
    curY += 65;
  });

  ctx.strokeStyle = '#94A3B8';
  ctx.lineWidth = 2;
  ctx.save();
  ctx.setLineDash([6, 6]);
  ctx.beginPath(); ctx.moveTo(140, curY + 10); ctx.lineTo(W - 140, curY + 10); ctx.stroke();
  ctx.restore();

  curY += 60;
  const flavorTags = extractFlavorTags(recipe.batch_roaster_notes || recipe.notes);
  ctx.font = '800 24px "JetBrains Mono", monospace';
  ctx.fillStyle = colorDark;
  ctx.fillText(`NOTAS: ..... ${flavorTags.join(', ').toUpperCase() || 'ESPECIALIDAD'}`, 140, curY);

  curY += 50;
  ctx.fillText(`TAZA: ...... ${recipe.sensory_balance || 'DULCE'} • ${recipe.sensory_body || 'MEDIO'} • ${recipe.sensory_extraction || 'EN PUNTO ✨'}`.toUpperCase(), 140, curY);

  curY += 50;
  const receiptDate = new Date(recipe.created_at || Date.now()).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  ctx.fillText(`FECHA: ..... ${receiptDate.toUpperCase()}`, 140, curY);

  // Barcode POS
  curY += 60;
  ctx.fillStyle = colorDark;
  const barPattern = [3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 4, 1, 3, 1, 2, 4, 2, 3, 1, 4, 2, 1, 3, 2, 1, 4];
  let curBarX = 140;
  barPattern.forEach((w, i) => {
    if (i % 2 === 0) {
      ctx.fillRect(curBarX, curY, w * 3, 60);
    }
    curBarX += (w * 3) + 3;
  });

  ctx.font = '800 18px "JetBrains Mono", monospace';
  ctx.fillStyle = colorMuted;
  const microns = parseGrindToMicrons(recipe.grind);
  ctx.fillText(`* BEANTAG-ID-${recipe.id || '294'} • ${microns ? `${microns} µm` : 'PRECISION'} *`, 140, curY + 95);
}

// 3. SQUARE BENTO (1:1 - 1080 x 1080 px)
function renderBentoCard(ctx, recipe) {
  const W = 1080;
  const H = 1080;

  // Background
  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, '#0F172A');
  bgGrad.addColorStop(1, '#05070B');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Outer frame
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 2;
  roundRect(ctx, 36, 36, W - 72, H - 72, 24);
  ctx.stroke();

  // Top header
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 28px "Space Grotesk", sans-serif';
  ctx.fillText('BeanTag', 70, 95);

  ctx.fillStyle = '#F94C00';
  ctx.font = '900 20px "JetBrains Mono", monospace';
  ctx.fillText('● SINGLE DOSE LOG', 200, 93);

  // 1. Top Card: Coffee Hero
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  roundRect(ctx, 70, 130, W - 140, 320, 20);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.stroke();

  ctx.fillStyle = '#F97316';
  ctx.font = '800 20px "JetBrains Mono", monospace';
  ctx.fillText((recipe.batch_roaster || 'SPECIALTY ROASTER').toUpperCase(), 105, 175);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 44px "Space Grotesk", sans-serif';
  ctx.fillText(String(recipe.batch_name || 'Café Especialidad').slice(0, 32), 105, 235);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = '700 24px "Space Grotesk", sans-serif';
  ctx.fillText([recipe.batch_producer, recipe.batch_origin, recipe.batch_altitude ? `⛰️ ${recipe.batch_altitude}` : ''].filter(Boolean).join(' • '), 105, 280);

  // Flavor tags in Hero
  const flavorTags = extractFlavorTags(recipe.batch_roaster_notes || recipe.notes);
  let tagX = 105;
  flavorTags.slice(0, 4).forEach(t => {
    const colors = getScaColorForNote(t);
    ctx.font = '800 18px "Space Grotesk", sans-serif';
    const tw = ctx.measureText(t).width;
    ctx.fillStyle = colors.bg;
    roundRect(ctx, tagX, 325, tw + 28, 38, 10);
    ctx.fill();
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = colors.text;
    ctx.fillText(t, tagX + 14, 350);
    tagX += tw + 40;
  });

  // 2. Bottom Left Card: Extraction
  const boxW = (W - 140 - 24) / 2;
  const boxH = 480;
  const boxY = 480;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  roundRect(ctx, 70, boxY, boxW, boxH, 20);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.stroke();

  ctx.fillStyle = '#F94C00';
  ctx.font = '900 20px "JetBrains Mono", monospace';
  ctx.fillText('☕ EXTRACCIÓN', 105, boxY + 50);

  const eData = [
    { k: 'Método:', v: recipe.method || 'V60' },
    { k: 'Dosis:', v: `${recipe.dose_in_g || 20}g` },
    { k: 'Ratio:', v: recipe.ratio || '1:15' },
    { k: 'Agua Temp:', v: recipe.temperature || '93°C' },
    { k: 'Tiempo:', v: recipe.brew_time || '2:30 min' }
  ];

  let ey = boxY + 110;
  eData.forEach(d => {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '700 20px "JetBrains Mono", monospace';
    ctx.fillText(d.k, 105, ey);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 22px "Space Grotesk", sans-serif';
    ctx.fillText(d.v, 250, ey);
    ey += 60;
  });

  // 3. Bottom Right Card: Grinder & Profile
  const rX = 70 + boxW + 24;
  ctx.fillStyle = 'rgba(249, 76, 0, 0.04)';
  roundRect(ctx, rX, boxY, boxW, boxH, 20);
  ctx.fill();
  ctx.strokeStyle = 'rgba(249, 76, 0, 0.4)';
  ctx.stroke();

  ctx.fillStyle = '#F97316';
  ctx.font = '900 20px "JetBrains Mono", monospace';
  ctx.fillText('⚙️ MOLINO & PERFIL', rX + 35, boxY + 50);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 32px "Space Grotesk", sans-serif';
  ctx.fillText(String(recipe.grind || 'Molienda Media').slice(0, 20), rX + 35, boxY + 115);

  const microns = parseGrindToMicrons(recipe.grind);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = '700 20px "JetBrains Mono", monospace';
  ctx.fillText(microns ? `~${microns} µm` : 'Precisión Barista', rX + 35, boxY + 155);

  // Sensory items
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.beginPath(); ctx.moveTo(rX + 35, boxY + 195); ctx.lineTo(rX + boxW - 35, boxY + 195); ctx.stroke();

  const sData = [
    { k: 'Balance:', v: recipe.sensory_balance || 'Dulce' },
    { k: 'Cuerpo:', v: recipe.sensory_body || 'Medio' },
    { k: 'Extracción:', v: recipe.sensory_extraction || 'En Punto ✨' }
  ];

  let sy = boxY + 250;
  sData.forEach(d => {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '700 19px "JetBrains Mono", monospace';
    ctx.fillText(d.k, rX + 35, sy);
    ctx.fillStyle = '#F8FAFC';
    ctx.font = '900 22px "Space Grotesk", sans-serif';
    ctx.fillText(d.v, rX + 175, sy);
    sy += 55;
  });

  // Footer date
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.font = '700 18px "JetBrains Mono", monospace';
  ctx.fillText(new Date(recipe.created_at || Date.now()).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase(), 70, H - 40);
}

/**
 * Main export function returning a high-resolution data URL
 * @param {Object} recipe Recipe and batch data
 * @param {string} template 'story' (9:16) | 'ticket' (POS) | 'bento' (1:1)
 * @param {boolean} incRecipe Whether to include recipe or batch only
 * @returns {string} Base64 image data URL
 */
export function generateRecipeCardImage(recipe, template = 'story', incRecipe = true) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  let width = 1080;
  let height = 1920;

  if (template === 'ticket') {
    width = 1080;
    height = 1540;
  } else if (template === 'bento') {
    width = 1080;
    height = 1080;
  }

  canvas.width = width;
  canvas.height = height;

  if (template === 'ticket') {
    renderReceiptCard(ctx, recipe, incRecipe);
  } else if (template === 'bento') {
    renderBentoCard(ctx, recipe);
  } else {
    renderStoryCard(ctx, recipe);
  }

  return canvas.toDataURL('image/png', 1.0);
}
