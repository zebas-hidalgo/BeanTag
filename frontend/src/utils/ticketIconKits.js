// --- BEANTAG VECTOR TICKET ICON KITS (CANVAS 2D) ---
// High-DPI scalable vector drawing routines for 2026/2027 specialty coffee tickets

/**
 * 1. BLUEPRINT CAD KIT
 * Technical linework with cyan/white strokes, crosshairs, and dimension cotas.
 */
export function drawBlueprintBean(ctx, cx, cy, size = 32, strokeColor = '#38BDF8') {
  ctx.save();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1.5;
  ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';

  // Outer Bean Contour
  ctx.beginPath();
  const rx = size * 0.7;
  const ry = size * 0.45;
  ctx.ellipse(cx, cy, rx, ry, -Math.PI / 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Silverskin S-Crease
  ctx.beginPath();
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  ctx.moveTo(cx - rx * 0.75, cy);
  ctx.bezierCurveTo(cx - rx * 0.2, cy + ry * 0.4, cx + rx * 0.1, cy - ry * 0.4, cx + rx * 0.75, cy);
  ctx.stroke();

  // Technical Dimension Cota
  ctx.lineWidth = 0.8;
  ctx.strokeStyle = '#7DD3FC';
  ctx.setLineDash([2, 2]);
  ctx.beginPath();
  ctx.moveTo(cx - rx, cy - ry - 4);
  ctx.lineTo(cx + rx, cy - ry - 4);
  ctx.stroke();
  ctx.setLineDash([]);

  // End ticks
  ctx.beginPath();
  ctx.moveTo(cx - rx, cy - ry - 7);
  ctx.lineTo(cx - rx, cy - ry - 1);
  ctx.moveTo(cx + rx, cy - ry - 7);
  ctx.lineTo(cx + rx, cy - ry - 1);
  ctx.stroke();

  ctx.restore();
}

export function drawBlueprintDripper(ctx, cx, cy, size = 28, strokeColor = '#38BDF8') {
  ctx.save();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1.4;
  ctx.fillStyle = 'rgba(56, 189, 248, 0.1)';

  const w = size * 0.9;
  const h = size * 0.8;

  // Cone
  ctx.beginPath();
  ctx.moveTo(cx - w / 2, cy - h / 2);
  ctx.lineTo(cx + w / 2, cy - h / 2);
  ctx.lineTo(cx + w * 0.2, cy + h / 2);
  ctx.lineTo(cx - w * 0.2, cy + h / 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Spiral ribs
  ctx.setLineDash([2, 2]);
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.3, cy - h * 0.3);
  ctx.lineTo(cx, cy + h * 0.4);
  ctx.moveTo(cx + w * 0.3, cy - h * 0.3);
  ctx.lineTo(cx, cy + h * 0.4);
  ctx.stroke();
  ctx.setLineDash([]);

  // Base
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.35, cy + h / 2 + 2);
  ctx.lineTo(cx + w * 0.35, cy + h / 2 + 2);
  ctx.stroke();

  ctx.restore();
}

export function drawBlueprintScale(ctx, cx, cy, size = 26, strokeColor = '#38BDF8') {
  ctx.save();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1.4;
  ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';

  const w = size * 0.9;
  const h = size * 0.7;

  // Body
  ctx.beginPath();
  ctx.rect(cx - w / 2, cy - h / 2, w, h);
  ctx.fill();
  ctx.stroke();

  // Display
  ctx.strokeRect(cx - w * 0.35, cy - h * 0.3, w * 0.7, h * 0.35);

  // Crosshair center
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(cx, cy + h * 0.2, 2, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

export function drawBlueprintTimer(ctx, cx, cy, size = 26, strokeColor = '#38BDF8') {
  ctx.save();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1.4;
  ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';

  const r = size * 0.38;

  // Watch body
  ctx.beginPath();
  ctx.arc(cx, cy + 2, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Top crown
  ctx.beginPath();
  ctx.moveTo(cx - 3, cy + 2 - r);
  ctx.lineTo(cx - 3, cy + 2 - r - 4);
  ctx.lineTo(cx + 3, cy + 2 - r - 4);
  ctx.lineTo(cx + 3, cy + 2 - r);
  ctx.stroke();

  // Hands
  ctx.beginPath();
  ctx.moveTo(cx, cy + 2);
  ctx.lineTo(cx, cy + 2 - r * 0.6);
  ctx.moveTo(cx, cy + 2);
  ctx.lineTo(cx + r * 0.45, cy + 2);
  ctx.stroke();

  ctx.restore();
}


/**
 * 2. NEO-BRUTALIST POP KIT
 * Chunky bold black outlines (2.5px), solid offset shadows and vibrant pop fills.
 */
export function drawNeoPopBean(ctx, cx, cy, size = 30) {
  ctx.save();
  const rx = size * 0.65;
  const ry = size * 0.45;

  // Hard offset shadow
  ctx.fillStyle = '#111827';
  ctx.beginPath();
  ctx.ellipse(cx + 3, cy + 3, rx, ry, -Math.PI / 10, 0, Math.PI * 2);
  ctx.fill();

  // Main Bean Body
  ctx.fillStyle = '#E2F952'; // Acid Lime
  ctx.strokeStyle = '#111827';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, -Math.PI / 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Silverskin S-Curve
  ctx.beginPath();
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.moveTo(cx - rx * 0.7, cy);
  ctx.bezierCurveTo(cx - rx * 0.2, cy + ry * 0.35, cx + rx * 0.1, cy - ry * 0.35, cx + rx * 0.7, cy);
  ctx.stroke();

  // Sunglasses bar (Pop style)
  ctx.fillStyle = '#111827';
  ctx.fillRect(cx - rx * 0.4, cy - ry * 0.4, rx * 0.8, ry * 0.35);

  ctx.restore();
}

export function drawNeoPopLightning(ctx, cx, cy, size = 26) {
  ctx.save();
  const s = size / 24;

  // Hard shadow
  ctx.fillStyle = '#111827';
  ctx.beginPath();
  ctx.moveTo(cx + 3 + 1 * s, cy + 3 - 10 * s);
  ctx.lineTo(cx + 3 - 9 * s, cy + 3 + 2 * s);
  ctx.lineTo(cx + 3, cy + 3 + 2 * s);
  ctx.lineTo(cx + 3 - 1 * s, cy + 3 + 10 * s);
  ctx.lineTo(cx + 3 + 9 * s, cy + 3 - 2 * s);
  ctx.lineTo(cx + 3, cy + 3 - 2 * s);
  ctx.closePath();
  ctx.fill();

  // Main shape
  ctx.fillStyle = '#FF4B26'; // Safety Orange
  ctx.strokeStyle = '#111827';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(cx + 1 * s, cy - 10 * s);
  ctx.lineTo(cx - 9 * s, cy + 2 * s);
  ctx.lineTo(cx, cy + 2 * s);
  ctx.lineTo(cx - 1 * s, cy + 10 * s);
  ctx.lineTo(cx + 9 * s, cy - 2 * s);
  ctx.lineTo(cx, cy - 2 * s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

export function drawNeoPopStar(ctx, cx, cy, size = 24) {
  ctx.save();
  const points = 5;
  const outerR = size * 0.5;
  const innerR = size * 0.22;

  // Shadow
  ctx.fillStyle = '#111827';
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const x = cx + 2.5 + Math.cos(angle) * r;
    const y = cy + 2.5 + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();

  // Star
  ctx.fillStyle = '#FF4B26';
  ctx.strokeStyle = '#111827';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

export function drawNeoPopFlame(ctx, cx, cy, size = 24) {
  ctx.save();
  const s = size / 24;

  // Hard shadow
  ctx.fillStyle = '#111827';
  ctx.beginPath();
  ctx.arc(cx + 2.5, cy + 2.5 + 2 * s, 8 * s, 0, Math.PI);
  ctx.fill();

  // Flame
  ctx.fillStyle = '#FF4B26';
  ctx.strokeStyle = '#111827';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 10 * s);
  ctx.bezierCurveTo(cx + 7 * s, cy - 2 * s, cx + 9 * s, cy + 4 * s, cx + 7 * s, cy + 8 * s);
  ctx.bezierCurveTo(cx + 4 * s, cy + 11 * s, cx - 4 * s, cy + 11 * s, cx - 7 * s, cy + 8 * s);
  ctx.bezierCurveTo(cx - 9 * s, cy + 4 * s, cx - 7 * s, cy - 2 * s, cx, cy - 10 * s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Inner flame core
  ctx.fillStyle = '#E2F952';
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.bezierCurveTo(cx + 3 * s, cy + 4 * s, cx + 3 * s, cy + 7 * s, cx, cy + 9 * s);
  ctx.bezierCurveTo(cx - 3 * s, cy + 7 * s, cx - 3 * s, cy + 4 * s, cx, cy);
  ctx.fill();

  ctx.restore();
}


/**
 * 3. HOLOGRAPHIC AURORA GLASS KIT
 * Floating frosted glass elements with neon gradient strokes & radiant glows.
 */
export function drawAuroraCrystalBean(ctx, cx, cy, size = 30) {
  ctx.save();
  const r = size * 0.5;

  // Outer Frosted Glass Tile
  ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1.2;
  const tileR = size * 0.6;
  ctx.beginPath();
  ctx.roundRect(cx - tileR, cy - tileR, tileR * 2, tileR * 2, 8);
  ctx.fill();
  ctx.stroke();

  // Glowing Holographic Bean
  const grad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  grad.addColorStop(0, '#38BDF8');
  grad.addColorStop(0.5, '#A855F7');
  grad.addColorStop(1, '#EC4899');

  ctx.strokeStyle = grad;
  ctx.lineWidth = 1.8;
  ctx.shadowColor = '#A855F7';
  ctx.shadowBlur = 10;

  const rx = r * 0.75;
  const ry = r * 0.5;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, -Math.PI / 10, 0, Math.PI * 2);
  ctx.stroke();

  // Center Crease
  ctx.beginPath();
  ctx.moveTo(cx - rx * 0.7, cy);
  ctx.bezierCurveTo(cx - rx * 0.2, cy + ry * 0.35, cx + rx * 0.1, cy - ry * 0.35, cx + rx * 0.7, cy);
  ctx.stroke();

  ctx.restore();
}

export function drawAuroraWaterDrop(ctx, cx, cy, size = 26) {
  ctx.save();
  const s = size / 24;

  ctx.strokeStyle = '#38BDF8';
  ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
  ctx.lineWidth = 1.6;
  ctx.shadowColor = '#38BDF8';
  ctx.shadowBlur = 8;

  ctx.beginPath();
  ctx.moveTo(cx, cy - 9 * s);
  ctx.bezierCurveTo(cx + 7 * s, cy - 1 * s, cx + 8 * s, cy + 5 * s, cx + 6 * s, cy + 8 * s);
  ctx.bezierCurveTo(cx + 3 * s, cy + 11 * s, cx - 3 * s, cy + 11 * s, cx - 6 * s, cy + 8 * s);
  ctx.bezierCurveTo(cx - 8 * s, cy + 5 * s, cx - 7 * s, cy - 1 * s, cx, cy - 9 * s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Bottom concentric ripple
  ctx.beginPath();
  ctx.ellipse(cx, cy + 12 * s, 6 * s, 2 * s, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

export function drawAuroraWave(ctx, cx, cy, size = 28) {
  ctx.save();
  const w = size * 0.9;

  ctx.strokeStyle = '#34D399';
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = '#34D399';
  ctx.shadowBlur = 8;

  ctx.beginPath();
  ctx.moveTo(cx - w / 2, cy);
  ctx.lineTo(cx - w * 0.25, cy);
  ctx.lineTo(cx - w * 0.12, cy - 7);
  ctx.lineTo(cx + w * 0.08, cy + 8);
  ctx.lineTo(cx + w * 0.25, cy);
  ctx.lineTo(cx + w / 2, cy);
  ctx.stroke();

  ctx.restore();
}


/**
 * 4. HANGTAG BOTÁNICO ESCANDINAVO KIT
 * Vintage lithograph line art in deep charcoal (#44403C) and realistic metallic eyelet.
 */
export function drawBotanicalBranch(ctx, cx, cy, size = 32, strokeColor = '#44403C') {
  ctx.save();
  ctx.strokeStyle = strokeColor;
  ctx.fillStyle = 'rgba(101, 163, 13, 0.12)';
  ctx.lineWidth = 1.3;
  ctx.lineCap = 'round';

  const s = size / 32;

  // Stem
  ctx.beginPath();
  ctx.moveTo(cx, cy + 14 * s);
  ctx.quadraticCurveTo(cx - 2 * s, cy, cx + 2 * s, cy - 14 * s);
  ctx.stroke();

  // Left leaf
  ctx.beginPath();
  ctx.moveTo(cx - 1 * s, cy + 2 * s);
  ctx.quadraticCurveTo(cx - 12 * s, cy - 2 * s, cx - 14 * s, cy - 8 * s);
  ctx.quadraticCurveTo(cx - 6 * s, cy - 10 * s, cx, cy - 4 * s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Right leaf
  ctx.beginPath();
  ctx.moveTo(cx + 1 * s, cy - 2 * s);
  ctx.quadraticCurveTo(cx + 12 * s, cy - 6 * s, cx + 14 * s, cy - 12 * s);
  ctx.quadraticCurveTo(cx + 6 * s, cy - 14 * s, cx + 2 * s, cy - 8 * s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Coffee Cherries
  ctx.fillStyle = '#991B1B';
  ctx.strokeStyle = '#44403C';
  ctx.beginPath();
  ctx.arc(cx + 3 * s, cy + 6 * s, 3.5 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx - 4 * s, cy + 8 * s, 3.5 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

export function drawGooseneckKettle(ctx, cx, cy, size = 28, strokeColor = '#44403C') {
  ctx.save();
  ctx.strokeStyle = strokeColor;
  ctx.fillStyle = 'rgba(217, 119, 6, 0.12)';
  ctx.lineWidth = 1.3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const s = size / 28;

  // Kettle trapezoid body
  ctx.beginPath();
  ctx.moveTo(cx - 8 * s, cy - 5 * s);
  ctx.lineTo(cx + 8 * s, cy - 5 * s);
  ctx.lineTo(cx + 10 * s, cy + 8 * s);
  ctx.lineTo(cx - 10 * s, cy + 8 * s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Lid knob
  ctx.beginPath();
  ctx.arc(cx, cy - 7 * s, 1.8 * s, 0, Math.PI * 2);
  ctx.stroke();

  // Gooseneck spout
  ctx.beginPath();
  ctx.moveTo(cx + 9 * s, cy + 5 * s);
  ctx.quadraticCurveTo(cx + 16 * s, cy - 2 * s, cx + 18 * s, cy - 10 * s);
  ctx.quadraticCurveTo(cx + 19 * s, cy - 11 * s, cx + 21 * s, cy - 8 * s);
  ctx.stroke();

  // Handle
  ctx.beginPath();
  ctx.moveTo(cx - 8 * s, cy - 3 * s);
  ctx.quadraticCurveTo(cx - 16 * s, cy + 2 * s, cx - 10 * s, cy + 7 * s);
  ctx.stroke();

  ctx.restore();
}

export function drawRoasterySeal(ctx, cx, cy, radius = 20) {
  ctx.save();
  ctx.strokeStyle = '#4D7C0F';
  ctx.lineWidth = 1.4;

  // Outer dashed circle
  ctx.setLineDash([3, 2]);
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Inner solid circle
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 3, 0, Math.PI * 2);
  ctx.stroke();

  // Center check / botanical twig
  ctx.beginPath();
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  ctx.moveTo(cx - 4, cy);
  ctx.lineTo(cx - 1, cy + 4);
  ctx.lineTo(cx + 5, cy - 4);
  ctx.stroke();

  ctx.restore();
}

export function drawMetallicEyelet(ctx, cx, cy, radius = 10) {
  ctx.save();

  // Outer drop shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 2;

  // Outer Metallic Bevel Ring
  const grad = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
  grad.addColorStop(0, '#E5E7EB');
  grad.addColorStop(0.5, '#D1D5DB');
  grad.addColorStop(1, '#9CA3AF');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  // Reset shadow for inner hole
  ctx.shadowColor = 'transparent';

  // Inner hole (showing dark depth / cord hole)
  ctx.fillStyle = '#4B5563';
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.55, 0, Math.PI * 2);
  ctx.fill();

  // Inner shadow ring
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}
