/**
 * Centralized Grinder Specifications and Physical Micron (D50) Conversions for BeanTag V3.0
 * Supports 8 specialty coffee grinders with exact SCA/Kruve particle distributions and manufacturer dials.
 */

export const GRINDERS = [
  {
    id: 'jmax',
    shortName: 'J-Max',
    name: '1Zpresso J-Max',
    burrs: 'Cónica 48mm Titanio (Bimodal)',
    stepDesc: 'Paso 8.8 µm/clic axial (90 clics/rot)',
    type: 'stepper_3',
    defaultRot: 2,
    defaultNum: 2,
    defaultClick: 5,
    calculateMicrons: (rot, num, click) => {
      const r = parseInt(rot, 10) || 0;
      const n = parseInt(num, 10) || 0;
      const c = parseInt(click, 10) || 0;
      const totalClicks = (r * 90) + (n * 10) + c;
      if (totalClicks <= 135) return Math.max(180, Math.round(180 + ((totalClicks - 90) / 45) * 140));
      if (totalClicks <= 185) return Math.round(320 + ((totalClicks - 135) / 50) * 300);
      if (totalClicks <= 222) return Math.round(620 + ((totalClicks - 185) / 37) * 160);
      return Math.min(1300, Math.round(780 + ((totalClicks - 222) / 63) * 370));
    },
    formatDial: (rot, num, click) => `J-Max: ${rot}.${num}.${click}`
  },
  {
    id: 'k_ultra',
    shortName: 'K-Ultra',
    name: '1Zpresso K-Ultra',
    burrs: 'Cónica 48mm Heptagonal (Alta Claridad)',
    stepDesc: 'Paso 20 µm/clic axial (Dial 0 - 15)',
    type: 'number',
    min: 2.0,
    max: 13.0,
    step: 0.1,
    defaultVal: 8.0,
    calculateMicrons: (dial) => {
      const d = Number.isFinite(parseFloat(dial)) ? parseFloat(dial) : 8.0;
      if (d <= 4.2) return Math.max(180, Math.round(180 + ((d - 2.5) / 1.7) * 140));
      if (d <= 6.2) return Math.round(320 + ((d - 4.2) / 2.0) * 300);
      if (d <= 8.2) return Math.round(620 + ((d - 6.2) / 2.0) * 160);
      return Math.min(1300, Math.round(780 + ((d - 8.2) / 3.0) * 370));
    },
    formatDial: (dial) => `K-Ultra: ${parseFloat(dial).toFixed(1)} (${Math.round(parseFloat(dial) * 10)} clics)`
  },
  {
    id: 'ode_gen2',
    shortName: 'Ode Gen 2',
    name: 'Fellow Ode Gen 2',
    burrs: 'Planas 64mm Gen 2 (Unimodal)',
    stepDesc: 'Muelas planas 64mm (Ajuste 1.0 - 11.0, solo filtro)',
    type: 'number',
    min: 1.0,
    max: 11.0,
    step: 0.1,
    defaultVal: 4.2,
    calculateMicrons: (dial) => {
      const d = Number.isFinite(parseFloat(dial)) ? parseFloat(dial) : 4.2;
      if (d <= 2.6) return Math.max(450, Math.round(450 + ((d - 1.1) / 1.5) * 170));
      if (d <= 4.6) return Math.round(620 + ((d - 2.6) / 2.0) * 160);
      return Math.min(1300, Math.round(780 + ((d - 4.6) / 4.0) * 370));
    },
    formatDial: (dial) => `Ode Gen 2: Ajuste ${parseFloat(dial).toFixed(1)}`
  },
  {
    id: 'comandante',
    shortName: 'Comandante',
    name: 'Comandante C40',
    burrs: 'Cónica Nitro Blade 39mm',
    stepDesc: 'Paso 30 µm/clic axial (0 - 45 clics)',
    type: 'clicks',
    min: 6,
    max: 45,
    defaultVal: 23,
    calculateMicrons: (clicks) => {
      const c = Number.isFinite(parseInt(clicks, 10)) ? parseInt(clicks, 10) : 23;
      if (c <= 13) return Math.max(180, Math.round(180 + ((c - 8) / 5) * 140));
      if (c <= 17) return Math.round(320 + ((c - 13) / 4) * 300);
      if (c <= 25) return Math.round(620 + ((c - 17) / 8) * 160);
      return Math.min(1300, Math.round(780 + ((c - 25) / 8) * 370));
    },
    formatDial: (clicks) => `Comandante: ${clicks} clics`
  },
  {
    id: 'femobook',
    shortName: 'Femobook',
    name: 'Femobook A2',
    burrs: 'Cónica 48mm Hybrid',
    stepDesc: 'Paso 18 µm/clic axial (40 clics/rot)',
    type: 'clicks',
    min: 4,
    max: 120,
    defaultVal: 68,
    calculateMicrons: (clicks) => {
      const c = Number.isFinite(parseInt(clicks, 10)) ? parseInt(clicks, 10) : 68;
      if (c <= 14) return Math.max(180, Math.round(180 + ((c - 8) / 6) * 140));
      if (c <= 50) return Math.round(320 + ((c - 14) / 36) * 300);
      if (c <= 68) return Math.round(620 + ((c - 50) / 18) * 160);
      return Math.min(1300, Math.round(780 + ((c - 68) / 28) * 370));
    },
    formatDial: (clicks) => `Femobook A2: ${clicks} clics (~${(clicks / 40).toFixed(1)} Rot.)`
  },
  {
    id: 'kingrinder',
    shortName: 'Kingrinder',
    name: 'Kingrinder K6',
    burrs: 'Cónica 48mm Heptagonal (7-Core)',
    stepDesc: 'Paso 16 µm/clic axial (60 clics/rot)',
    type: 'clicks',
    min: 12,
    max: 180,
    defaultVal: 92,
    calculateMicrons: (clicks) => {
      const c = Number.isFinite(parseInt(clicks, 10)) ? parseInt(clicks, 10) : 92;
      if (c <= 38) return Math.max(180, Math.round(180 + ((c - 18) / 20) * 140));
      if (c <= 74) return Math.round(320 + ((c - 38) / 36) * 300);
      if (c <= 102) return Math.round(620 + ((c - 74) / 28) * 160);
      return Math.min(1300, Math.round(780 + ((c - 102) / 40) * 370));
    },
    formatDial: (clicks) => `Kingrinder K6: ${clicks} clics (~${Math.floor(clicks / 60)}.${clicks % 60})`
  },
  {
    id: 'timemore',
    shortName: 'Timemore',
    name: 'Timemore C2/C3',
    burrs: 'Cónica 38mm Acero (S2C)',
    stepDesc: 'Muelas cónicas S2C (6 - 36 clics)',
    type: 'clicks',
    min: 6,
    max: 36,
    defaultVal: 17,
    calculateMicrons: (clicks) => {
      const c = Number.isFinite(parseInt(clicks, 10)) ? parseInt(clicks, 10) : 17;
      if (c <= 9) return Math.max(180, Math.round(180 + ((c - 7) / 2) * 140));
      if (c <= 14) return Math.round(320 + ((c - 9) / 5) * 300);
      if (c <= 19) return Math.round(620 + ((c - 14) / 5) * 160);
      return Math.min(1300, Math.round(780 + ((c - 19) / 7) * 370));
    },
    formatDial: (clicks) => `Timemore: ${clicks} clics`
  },
  {
    id: 'baratza',
    shortName: 'Baratza',
    name: 'Baratza Encore / ESP',
    burrs: 'Cónica M2 40mm',
    stepDesc: '40 Pasos (Classic 1-40 / ESP Micro 1-20 & Macro 21-40)',
    type: 'steps',
    min: 1,
    max: 40,
    defaultVal: 15,
    calculateMicrons: (step) => {
      const s = Number.isFinite(parseInt(step, 10)) ? parseInt(step, 10) : 15;
      if (s <= 9) return Math.max(180, Math.round(180 + ((s - 1) / 8) * 140));
      if (s <= 14) return Math.round(320 + ((s - 10) / 4) * 300);
      if (s <= 18) return Math.round(620 + ((s - 14) / 4) * 160);
      return Math.min(1300, Math.round(780 + ((s - 18) / 10) * 370));
    },
    formatDial: (step) => `Baratza: Ajuste ${step}`
  }
];

export function getGrinderConfig(id) {
  if (!id) return GRINDERS[0];
  const cleanId = String(id).toLowerCase().replace(/[^a-z0-9_]/g, '');
  return GRINDERS.find(g => g.id === cleanId || cleanId.includes(g.id)) || GRINDERS[0];
}

/**
 * Translates grind description or setting text into approximate physical median microns (D50) according to SCA standards
 */
export function parseGrindToMicrons(grind) {
  if (!grind) return 720;
  const lower = String(grind).toLowerCase();
  const numMatch = lower.match(/(\d{3,4})\s*(?:um|µm|micr)/i);
  if (numMatch) return parseInt(numMatch[1], 10);
  if (lower.includes('espresso') || lower.includes('fino')) return 270;
  if (lower.includes('aeropress') || lower.includes('go')) return 580;
  if (lower.includes('pulsar')) return 780;
  if (lower.includes('v60') || lower.includes('medio fino') || lower.includes('medio-fino')) return 720;
  if (lower.includes('kalita') || lower.includes('chemex') || lower.includes('medio')) return 800;
  if (lower.includes('medio grueso') || lower.includes('medio-grueso')) return 900;
  if (lower.includes('prensa') || lower.includes('french') || lower.includes('grueso') || lower.includes('cupping')) return 1000;
  if (lower.includes('cold brew')) return 1150;
  return 720;
}

/**
 * Calculates physical micron delta (D50) based on dose changes according to Darcy's law bed depth resistance.
 * Espresso: ~5.0 µm/g
 * Filter/Pour-Over/Immersion: ~8.0 µm/g
 *
 * @param {string} method - Brew method (e.g., 'V60 (Filtrado)', 'Espresso')
 * @param {number} fromDose - Initial dose in grams
 * @param {number} toDose - Target dose in grams
 * @returns {number} Micron delta (rounded integer)
 */
export function calculateDoseDeltaMicrons(method, fromDose, toDose) {
  const f = parseFloat(fromDose);
  const t = parseFloat(toDose);
  if (!Number.isFinite(f) || !Number.isFinite(t) || f === t) return 0;
  const isEspresso = typeof method === 'string' && method.toLowerCase().includes('espresso');
  const rate = isEspresso ? 5.0 : 8.0;
  return Math.round((t - f) * rate);
}

/**
 * Scales a grinder's dial or click setting to compensate for a change in dose.
 *
 * @param {string} grinderId - Grinder identifier
 * @param {number|object} currentVal - Current grinder setting (clicks, dial float, or J-Max {rot, num, click})
 * @param {number} fromDose - Initial dose in grams
 * @param {number} toDose - Target dose in grams
 * @param {string} method - Brew method
 * @returns {{ newVal: any, delta: number, deltaMicrons: number, direction: 'coarser'|'finer'|'same', description: string }}
 */
export function scaleGrinderSettingForDose(grinderId, currentVal, fromDose, toDose, method) {
  const grinder = getGrinderConfig(grinderId);
  const gid = grinder ? grinder.id : String(grinderId).toLowerCase();
  const deltaMicrons = calculateDoseDeltaMicrons(method, fromDose, toDose);

  if (deltaMicrons === 0) {
    return {
      newVal: currentVal,
      delta: 0,
      deltaMicrons: 0,
      direction: 'same',
      description: 'Sin variación de dosis'
    };
  }

  const direction = deltaMicrons > 0 ? 'coarser' : (deltaMicrons < 0 ? 'finer' : 'same');
  let newVal = currentVal;
  let delta = 0;

  switch (gid) {
    case 'femobook': {
      delta = Math.round(deltaMicrons / 18);
      const curr = Number.isFinite(parseInt(currentVal, 10)) ? parseInt(currentVal, 10) : 68;
      newVal = Math.max(4, Math.min(120, curr + delta));
      break;
    }
    case 'jmax': {
      delta = Math.round(deltaMicrons / 8.8);
      let totalClicks = 0;
      if (typeof currentVal === 'object' && currentVal !== null) {
        const r = parseInt(currentVal.rot, 10) || 0;
        const n = parseInt(currentVal.num, 10) || 0;
        const c = parseInt(currentVal.click, 10) || 0;
        totalClicks = (r * 90) + (n * 10) + c;
      } else {
        totalClicks = parseInt(currentVal, 10) || 0;
      }
      const clamped = Math.max(0, Math.min(360, totalClicks + delta));
      const rot = Math.floor(clamped / 90);
      const rem = clamped % 90;
      const num = Math.floor(rem / 10);
      const click = rem % 10;
      newVal = { rot, num, click };
      break;
    }
    case 'k_ultra': {
      delta = Number((Math.round(deltaMicrons / 20) * 0.1).toFixed(1));
      const curr = Number.isFinite(parseFloat(currentVal)) ? parseFloat(currentVal) : 8.0;
      const target = curr + delta;
      newVal = Number(Math.max(2.0, Math.min(13.0, target)).toFixed(1));
      break;
    }
    case 'ode_gen2': {
      delta = Number((Math.round(deltaMicrons / 35) * 0.1).toFixed(1));
      const curr = Number.isFinite(parseFloat(currentVal)) ? parseFloat(currentVal) : 4.2;
      const target = curr + delta;
      newVal = Number(Math.max(1.0, Math.min(11.0, target)).toFixed(1));
      break;
    }
    case 'comandante': {
      delta = Math.round(deltaMicrons / 30);
      const curr = Number.isFinite(parseInt(currentVal, 10)) ? parseInt(currentVal, 10) : 23;
      newVal = Math.max(6, Math.min(45, curr + delta));
      break;
    }
    case 'kingrinder': {
      delta = Math.round(deltaMicrons / 16);
      const curr = Number.isFinite(parseInt(currentVal, 10)) ? parseInt(currentVal, 10) : 92;
      newVal = Math.max(12, Math.min(180, curr + delta));
      break;
    }
    case 'timemore': {
      delta = Math.round(deltaMicrons / 28);
      const curr = Number.isFinite(parseInt(currentVal, 10)) ? parseInt(currentVal, 10) : 17;
      newVal = Math.max(6, Math.min(36, curr + delta));
      break;
    }
    case 'baratza': {
      delta = Math.round(deltaMicrons / 35);
      const curr = Number.isFinite(parseInt(currentVal, 10)) ? parseInt(currentVal, 10) : 15;
      newVal = Math.max(1, Math.min(40, curr + delta));
      break;
    }
    default: {
      delta = Math.round(deltaMicrons / 20);
      const curr = Number.isFinite(parseInt(currentVal, 10)) ? parseInt(currentVal, 10) : 0;
      newVal = curr + delta;
      break;
    }
  }

  const description = direction === 'coarser'
    ? `+${deltaMicrons} µm (más grueso por mayor lecho)`
    : `${deltaMicrons} µm (más fino por menor lecho)`;

  return {
    newVal,
    delta,
    deltaMicrons,
    direction,
    description
  };
}
