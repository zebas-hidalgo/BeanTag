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
      if (totalClicks <= 150) {
        return Math.round(200 + ((totalClicks - 90) / 55) * 180);
      }
      return Math.round(380 + ((totalClicks - 150) / 115) * 620);
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
      const d = parseFloat(dial) || 8.0;
      if (d <= 4.2) {
        return Math.round(200 + ((d - 2.5) / 1.7) * 180);
      }
      return Math.round(380 + ((d - 4.5) / 5.5) * 600);
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
      const d = parseFloat(dial) || 4.2;
      return Math.round(450 + ((d - 1.0) / 8.5) * 750);
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
      const c = parseInt(clicks, 10) || 23;
      if (c <= 12) {
        return Math.round(180 + ((c - 7) / 5) * 200);
      }
      return Math.round(380 + ((c - 12) / 18) * 600);
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
      const c = parseInt(clicks, 10) || 68;
      if (c <= 14) {
        return Math.round(180 + ((c - 8) / 6) * 140);
      }
      if (c <= 50) {
        return Math.round(320 + ((c - 14) / 36) * 300);
      }
      if (c <= 68) {
        return Math.round(620 + ((c - 50) / 18) * 160);
      }
      return Math.round(780 + ((c - 68) / 28) * 370);
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
      const c = parseInt(clicks, 10) || 92;
      if (c <= 35) {
        return Math.round(180 + ((c - 15) / 18) * 170);
      }
      return Math.round(350 + ((c - 45) / 80) * 650);
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
      const c = parseInt(clicks, 10) || 17;
      if (c <= 9) {
        return Math.round(180 + ((c - 6) / 3) * 170);
      }
      return Math.round(350 + ((c - 10) / 15) * 650);
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
      const s = parseInt(step, 10) || 15;
      if (s <= 14) {
        return Math.round(180 + ((s - 6) / 8) * 200);
      }
      return Math.round(450 + ((s - 10) / 17) * 650);
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
