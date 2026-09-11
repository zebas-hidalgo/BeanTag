// --- BEANTAG AESTHETIC TICKET ASSET & ICON KITS (2026/2027) ---
// High-resolution visual assets generated with Nanobanana / Imagen
// with 100% aspect-ratio-preserving (contain) Canvas 2D rendering and vector fallbacks.

// 1. BLUEPRINT CAD ASSETS
import blueprintHeroSrc from '../assets/cards/blueprint_hero.png';
import blueprintDripperSrc from '../assets/cards/blueprint_dripper.png';
import blueprintScaleSrc from '../assets/cards/blueprint_scale.png';
import blueprintWaterSrc from '../assets/cards/blueprint_water.png';
import blueprintTimerSrc from '../assets/cards/blueprint_timer.png';

// 2. NEO-BRUTALIST TOKYO STREETWEAR STICKERS
import neobrutalistHeroSrc from '../assets/cards/neobrutalist_hero.png';
import neobrutalistDripperSrc from '../assets/cards/neobrutalist_dripper.png';
import neobrutalistFlameSrc from '../assets/cards/neobrutalist_flame.png';
import neobrutalistStarSrc from '../assets/cards/neobrutalist_star.png';
import neobrutalistTimerSrc from '../assets/cards/neobrutalist_timer.png';
import neobrutalistCupSrc from '../assets/cards/neobrutalist_cup.png';

// 3. HOLOGRAPHIC AURORA 3D GLASS ASSETS
import auroraHeroSrc from '../assets/cards/aurora_hero.png';
import auroraWaterSrc from '../assets/cards/aurora_water.png';
import auroraDripperSrc from '../assets/cards/aurora_dripper.png';
import auroraWaveSrc from '../assets/cards/aurora_wave.png';
import auroraStarSrc from '../assets/cards/aurora_star.png';

// 4. SCANDINAVIAN HANGTAG BOTANICAL LITHOGRAPHS
import hangtagHeroSrc from '../assets/cards/hangtag_hero.png';
import hangtagKettleSrc from '../assets/cards/hangtag_kettle.png';
import hangtagSeedSrc from '../assets/cards/hangtag_seed.png';
import hangtagSealSrc from '../assets/cards/hangtag_seal.png';
import hangtagTimerSrc from '../assets/cards/hangtag_timer.png';

export const CARD_ASSET_SOURCES = {
  blueprint_hero: blueprintHeroSrc,
  blueprint_dripper: blueprintDripperSrc,
  blueprint_scale: blueprintScaleSrc,
  blueprint_water: blueprintWaterSrc,
  blueprint_timer: blueprintTimerSrc,

  neobrutalist_hero: neobrutalistHeroSrc,
  neobrutalist_dripper: neobrutalistDripperSrc,
  neobrutalist_flame: neobrutalistFlameSrc,
  neobrutalist_star: neobrutalistStarSrc,
  neobrutalist_timer: neobrutalistTimerSrc,
  neobrutalist_cup: neobrutalistCupSrc,

  aurora_hero: auroraHeroSrc,
  aurora_water: auroraWaterSrc,
  aurora_dripper: auroraDripperSrc,
  aurora_wave: auroraWaveSrc,
  aurora_star: auroraStarSrc,

  hangtag_hero: hangtagHeroSrc,
  hangtag_kettle: hangtagKettleSrc,
  hangtag_seed: hangtagSeedSrc,
  hangtag_seal: hangtagSealSrc,
  hangtag_timer: hangtagTimerSrc
};

const loadedImageCache = {};

/**
 * Preload all card visual assets into memory
 */
export function preloadCardAssets() {
  if (typeof window === 'undefined') return;
  Object.entries(CARD_ASSET_SOURCES).forEach(([key, src]) => {
    if (!loadedImageCache[key]) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = src;
      loadedImageCache[key] = img;
    }
  });
}

// Auto-trigger preload on module import in browser
if (typeof window !== 'undefined') {
  preloadCardAssets();
}

/**
 * Ensures all assets for a given style are fully loaded before rendering
 */
export async function ensureCardAssetsLoaded(style = 'blueprint') {
  if (typeof window === 'undefined') return;
  const prefix = style === 'hangtag' ? 'hangtag_' : `${style}_`;
  const keysToLoad = Object.keys(CARD_ASSET_SOURCES).filter(k => k.startsWith(prefix));

  const promises = keysToLoad.map(key => {
    let img = loadedImageCache[key];
    if (!img) {
      img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = CARD_ASSET_SOURCES[key];
      loadedImageCache[key] = img;
    }
    if (img.complete && img.naturalWidth > 0) {
      return Promise.resolve(img);
    }
    return new Promise(resolve => {
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
    });
  });

  await Promise.all(promises);
}

/**
 * Mathematical contain image drawer: NEVER distorts or stretches an image.
 * Maintains natural aspect ratio and centers image within (dx, dy, dWidth, dHeight).
 */
export function drawContainedImage(ctx, img, dx, dy, dWidth, dHeight, options = {}) {
  if (!img || !img.complete || img.naturalWidth === 0) return false;

  const imgW = img.naturalWidth;
  const imgH = img.naturalHeight;
  const scale = Math.min(dWidth / imgW, dHeight / imgH);
  const renderW = imgW * scale;
  const renderH = imgH * scale;
  const renderX = dx + (dWidth - renderW) / 2;
  const renderY = dy + (dHeight - renderH) / 2;

  ctx.save();

  if (options.shadowColor) {
    ctx.shadowColor = options.shadowColor;
    ctx.shadowBlur = options.shadowBlur || 0;
    ctx.shadowOffsetX = options.shadowOffsetX || 0;
    ctx.shadowOffsetY = options.shadowOffsetY || 0;
  }

  if (options.rotation) {
    const cx = renderX + renderW / 2;
    const cy = renderY + renderH / 2;
    ctx.translate(cx, cy);
    ctx.rotate(options.rotation);
    ctx.drawImage(img, -renderW / 2, -renderH / 2, renderW, renderH);
  } else {
    ctx.drawImage(img, renderX, renderY, renderW, renderH);
  }

  ctx.restore();
  return true;
}

/**
 * Draws an asset image if loaded with STRICT aspect ratio preservation
 */
export function drawCardAsset(ctx, assetKey, x, y, width, height, options = {}) {
  const img = loadedImageCache[assetKey];
  if (!img || !img.complete || img.naturalWidth === 0) {
    return false;
  }
  return drawContainedImage(ctx, img, x, y, width, height, options);
}

/**
 * Draws Hero visual illustration with 100% natural proportions (ZERO stretching)
 */
export function drawHeroAsset(ctx, style, x, y, width, height) {
  const heroKey = `${style}_hero`;
  const drawn = drawCardAsset(ctx, heroKey, x, y, width, height, {
    shadowColor: style === 'neobrutalist' ? '#000000' : (style === 'aurora' ? 'rgba(139, 92, 246, 0.4)' : undefined),
    shadowOffsetX: style === 'neobrutalist' ? 4 : 0,
    shadowOffsetY: style === 'neobrutalist' ? 4 : 0,
    shadowBlur: style === 'aurora' ? 14 : 0,
    rotation: style === 'neobrutalist' ? 0.04 : 0
  });

  if (!drawn) {
    // Vector fallback
    if (style === 'blueprint') drawBlueprintBean(ctx, x + width / 2, y + height / 2, Math.min(width, height) * 0.4);
    else if (style === 'neobrutalist') drawNeobrutalistBean(ctx, x + width / 2, y + height / 2, Math.min(width, height) * 0.35);
    else if (style === 'aurora') drawAuroraBean(ctx, x + width / 2, y + height / 2, Math.min(width, height) * 0.4);
    else if (style === 'hangtag') drawHangtagBotanical(ctx, x + width / 2, y + height / 2, Math.min(width, height) * 0.45);
  }
}

/**
 * Draws a dedicated metric icon (method, dose, grind, time) with image or vector fallback
 */
export function drawMetricAsset(ctx, style, metricType, x, y, size = 32) {
  let assetKey = '';
  if (style === 'blueprint') {
    if (metricType === 'method') assetKey = 'blueprint_dripper';
    else if (metricType === 'dose') assetKey = 'blueprint_scale';
    else if (metricType === 'grind') assetKey = 'blueprint_water';
    else if (metricType === 'time') assetKey = 'blueprint_timer';
  } else if (style === 'neobrutalist') {
    if (metricType === 'method') assetKey = 'neobrutalist_dripper';
    else if (metricType === 'dose') assetKey = 'neobrutalist_cup';
    else if (metricType === 'grind') assetKey = 'neobrutalist_flame';
    else if (metricType === 'time') assetKey = 'neobrutalist_timer';
  } else if (style === 'aurora') {
    if (metricType === 'method') assetKey = 'aurora_dripper';
    else if (metricType === 'dose') assetKey = 'aurora_water';
    else if (metricType === 'grind') assetKey = 'aurora_wave';
    else if (metricType === 'time') assetKey = 'aurora_star';
  } else if (style === 'hangtag') {
    if (metricType === 'method') assetKey = 'hangtag_kettle';
    else if (metricType === 'dose') assetKey = 'hangtag_seed';
    else if (metricType === 'grind') assetKey = 'hangtag_timer';
    else if (metricType === 'time') assetKey = 'hangtag_timer';
  }

  const drawn = assetKey ? drawCardAsset(ctx, assetKey, x - size / 2, y - size / 2, size, size) : false;
  if (!drawn) {
    // Vector fallback
    renderKitIcon(ctx, style, metricType, x, y, size);
  }
}

/**
 * Draws badges (e.g. Star, Seal, Flame) with strict aspect ratio
 */
export function drawBadgeAsset(ctx, style, badgeType, x, y, size = 40) {
  let assetKey = '';
  if (style === 'neobrutalist') {
    if (badgeType === 'star') assetKey = 'neobrutalist_star';
    else if (badgeType === 'flame') assetKey = 'neobrutalist_flame';
  } else if (style === 'aurora') {
    if (badgeType === 'star') assetKey = 'aurora_star';
    else if (badgeType === 'wave') assetKey = 'aurora_wave';
  } else if (style === 'hangtag') {
    if (badgeType === 'seal') assetKey = 'hangtag_seal';
  }

  const drawn = assetKey ? drawCardAsset(ctx, assetKey, x - size / 2, y - size / 2, size, size) : false;
  if (!drawn) {
    if (style === 'neobrutalist' && badgeType === 'star') drawNeobrutalistStar(ctx, x, y, 5, size * 0.45, size * 0.22);
    else if (style === 'hangtag' && badgeType === 'seal') drawHangtagSeal(ctx, x, y, size * 0.45);
  }
}

// =============================================================================
// VECTOR DRAWING FALLBACKS (CANVAS 2D)
// =============================================================================

export function drawBlueprintBean(ctx, cx, cy, size = 32, strokeColor = '#38BDF8') {
  ctx.save();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1.5;
  ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
  ctx.beginPath();
  const rx = size * 0.7;
  const ry = size * 0.45;
  ctx.ellipse(cx, cy, rx, ry, -Math.PI / 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  ctx.moveTo(cx - rx * 0.75, cy);
  ctx.bezierCurveTo(cx - rx * 0.2, cy + ry * 0.4, cx + rx * 0.1, cy - ry * 0.4, cx + rx * 0.75, cy);
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
  ctx.beginPath();
  ctx.moveTo(cx - w / 2, cy - h / 2);
  ctx.lineTo(cx + w / 2, cy - h / 2);
  ctx.lineTo(cx + w * 0.15, cy + h / 2);
  ctx.lineTo(cx - w * 0.15, cy + h / 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function drawBlueprintScale(ctx, cx, cy, size = 28, strokeColor = '#38BDF8') {
  ctx.save();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1.4;
  ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
  const w = size;
  const h = size * 0.65;
  ctx.strokeRect(cx - w / 2, cy - h / 2, w, h);
  ctx.fillRect(cx - w / 2, cy - h / 2, w, h);
  ctx.restore();
}

export function drawBlueprintWater(ctx, cx, cy, size = 26, strokeColor = '#38BDF8') {
  ctx.save();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1.4;
  ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
  const r = size * 0.4;
  ctx.beginPath();
  ctx.moveTo(cx, cy - r * 1.5);
  ctx.bezierCurveTo(cx + r, cy - r * 0.4, cx + r, cy + r, cx, cy + r);
  ctx.bezierCurveTo(cx - r, cy + r, cx - r, cy - r * 0.4, cx, cy - r * 1.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function drawBlueprintTimer(ctx, cx, cy, size = 28, strokeColor = '#38BDF8') {
  ctx.save();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1.5;
  ctx.fillStyle = 'rgba(56, 189, 248, 0.1)';
  const r = size * 0.42;
  ctx.beginPath();
  ctx.arc(cx, cy + 2, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, cy + 2);
  ctx.lineTo(cx, cy - r * 0.6 + 2);
  ctx.lineTo(cx + r * 0.5, cy + 2);
  ctx.stroke();
  ctx.restore();
}

export function drawNeobrutalistBean(ctx, cx, cy, size = 30) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.1);
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.ellipse(3, 3, size * 0.65, size * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#E2F952';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.65, size * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function drawNeobrutalistStar(ctx, cx, cy, spikes = 5, outerRadius = 16, innerRadius = 8) {
  ctx.save();
  let rot = Math.PI / 2 * 3;
  let x = cx;
  let y = cy;
  let step = Math.PI / spikes;
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius + 3);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius + 3;
    ctx.lineTo(x, y);
    rot += step;
    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius + 3;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.closePath();
  ctx.fill();

  rot = Math.PI / 2 * 3;
  ctx.fillStyle = '#FF4B26';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;
    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function drawAuroraBean(ctx, cx, cy, size = 32) {
  ctx.save();
  const grad = ctx.createLinearGradient(cx - size, cy - size, cx + size, cy + size);
  grad.addColorStop(0, '#C084FC');
  grad.addColorStop(1, '#06B6D4');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.strokeStyle = grad;
  ctx.lineWidth = 2;
  ctx.shadowColor = '#8B5CF6';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.ellipse(cx, cy, size * 0.65, size * 0.45, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function drawHangtagBotanical(ctx, cx, cy, size = 32) {
  ctx.save();
  ctx.strokeStyle = '#57534E';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(cx, cy + size * 0.7);
  ctx.bezierCurveTo(cx - size * 0.2, cy + size * 0.2, cx + size * 0.1, cy - size * 0.2, cx, cy - size * 0.7);
  ctx.stroke();
  ctx.fillStyle = '#DC2626';
  ctx.beginPath();
  ctx.arc(cx - size * 0.2, cy, 3.5, 0, Math.PI * 2);
  ctx.arc(cx + size * 0.25, cy - size * 0.2, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawHangtagSeal(ctx, cx, cy, radius = 22) {
  ctx.save();
  ctx.fillStyle = '#991B1B';
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#FCA5A5';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export function renderKitIcon(ctx, style, name, x, y, size = 28) {
  if (style === 'blueprint') {
    if (name === 'method') drawBlueprintDripper(ctx, x, y, size);
    else if (name === 'dose') drawBlueprintScale(ctx, x, y, size);
    else if (name === 'grind') drawBlueprintWater(ctx, x, y, size);
    else if (name === 'time') drawBlueprintTimer(ctx, x, y, size);
    else drawBlueprintBean(ctx, x, y, size);
  } else if (style === 'neobrutalist') {
    if (name === 'method') drawNeobrutalistBean(ctx, x, y, size * 0.8);
    else if (name === 'star') drawNeobrutalistStar(ctx, x, y, 5, size * 0.5, size * 0.25);
    else drawNeobrutalistBean(ctx, x, y, size);
  } else if (style === 'aurora') {
    drawAuroraBean(ctx, x, y, size);
  } else if (style === 'hangtag') {
    if (name === 'seal') drawHangtagSeal(ctx, x, y, size * 0.7);
    else drawHangtagBotanical(ctx, x, y, size);
  }
}
