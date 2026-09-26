/**
 * Centralized Grinder Specifications and Micron Conversions for BeanTag V3.0
 * Supports 8 specialty coffee grinders with exact burr physics, click ranges, and dial formats.
 */

export const GRINDERS = [
  {
    id: 'jmax',
    shortName: 'J-Max',
    name: '1Zpresso J-Max',
    burrs: 'Cónica 48mm Titanio (Bimodal)',
    stepDesc: '8.8 µm / clic (90 clics/rot)',
    type: 'stepper_3',
    defaultRot: 1,
    defaultNum: 5,
    defaultClick: 0,
    calculateMicrons: (rot, num, click) => {
      const r = parseInt(rot, 10) || 0;
      const n = parseInt(num, 10) || 0;
      const c = parseInt(click, 10) || 0;
      return Math.round(((r * 90) + (n * 10) + c) * 8.8);
    },
    formatDial: (rot, num, click) => `J-Max: ${rot}.${num}.${click}`
  },
  {
    id: 'k_ultra',
    shortName: 'K-Ultra',
    name: '1Zpresso K-Ultra',
    burrs: 'Cónica 48mm Heptagonal (Alta Claridad)',
    stepDesc: '20 µm / clic (Dial 0 - 15)',
    type: 'number',
    min: 1.0,
    max: 15.0,
    step: 0.1,
    defaultVal: 9.0,
    calculateMicrons: (dial) => Math.round(parseFloat(dial) * 10 * 20),
    formatDial: (dial) => `K-Ultra: ${parseFloat(dial).toFixed(1)} (${Math.round(parseFloat(dial) * 10)} clics)`
  },
  {
    id: 'ode_gen2',
    shortName: 'Ode Gen 2',
    name: 'Fellow Ode Gen 2',
    burrs: 'Planas 64mm Gen 2 (Unimodal)',
    stepDesc: 'Muelas planas 64mm (Ajuste 1 - 11)',
    type: 'number',
    min: 1.0,
    max: 11.0,
    step: 0.1,
    defaultVal: 5.0,
    calculateMicrons: (dial) => Math.round(350 + parseFloat(dial) * 75),
    formatDial: (dial) => `Ode Gen 2: Ajuste ${parseFloat(dial).toFixed(1)}`
  },
  {
    id: 'comandante',
    shortName: 'Comandante',
    name: 'Comandante C40',
    burrs: 'Cónica Nitro Blade 39mm',
    stepDesc: '30 µm / clic (0 - 45 clics)',
    type: 'clicks',
    min: 0,
    max: 45,
    defaultVal: 24,
    calculateMicrons: (clicks) => Math.round(clicks * 30),
    formatDial: (clicks) => `Comandante: ${clicks} clics`
  },
  {
    id: 'femobook',
    shortName: 'Femobook',
    name: 'Femobook A2',
    burrs: 'Cónica 48mm Hybrid',
    stepDesc: '18 µm / clic (40 clics/rot)',
    type: 'clicks',
    min: 0,
    max: 120,
    defaultVal: 60,
    calculateMicrons: (clicks) => Math.round(clicks * 18),
    formatDial: (clicks) => `Femobook A2: ${clicks} clics (~${(clicks / 40).toFixed(2)} Rot.)`
  },
  {
    id: 'kingrinder',
    shortName: 'Kingrinder',
    name: 'Kingrinder K6',
    burrs: 'Cónica 48mm Heptagonal (7-Core)',
    stepDesc: '16 µm / clic (60 clics/rot)',
    type: 'clicks',
    min: 0,
    max: 180,
    defaultVal: 90,
    calculateMicrons: (clicks) => Math.round(clicks * 16),
    formatDial: (clicks) => `Kingrinder K6: ${clicks} clics (~${Math.floor(clicks / 60)}.${clicks % 60})`
  },
  {
    id: 'timemore',
    shortName: 'Timemore',
    name: 'Timemore C2/C3',
    burrs: 'Cónica 38mm Acero (S2C)',
    stepDesc: '33 µm / clic (6 - 36 clics)',
    type: 'clicks',
    min: 6,
    max: 36,
    defaultVal: 18,
    calculateMicrons: (clicks) => Math.round(clicks * 33),
    formatDial: (clicks) => `Timemore: ${clicks} clics`
  },
  {
    id: 'baratza',
    shortName: 'Baratza',
    name: 'Baratza Encore / ESP',
    burrs: 'Cónica M2 40mm',
    stepDesc: '40 Pasos micro-escalonados',
    type: 'steps',
    min: 1,
    max: 40,
    defaultVal: 15,
    calculateMicrons: (step) => Math.round(400 + step * 30),
    formatDial: (step) => `Baratza: Ajuste ${step}`
  }
];

export function getGrinderConfig(id) {
  if (!id) return GRINDERS[0];
  const cleanId = String(id).toLowerCase().replace(/[^a-z0-9_]/g, '');
  return GRINDERS.find(g => g.id === cleanId || cleanId.includes(g.id)) || GRINDERS[0];
}

/**
 * Translates grind description or setting text into approximate microns for technical precision
 */
export function parseGrindToMicrons(grind) {
  if (!grind) return 750;
  const lower = String(grind).toLowerCase();
  const numMatch = lower.match(/(\d{3,4})\s*(?:um|µm|micr)/i);
  if (numMatch) return parseInt(numMatch[1], 10);
  if (lower.includes('espresso') || lower.includes('fino')) return 380;
  if (lower.includes('aeropress')) return 620;
  if (lower.includes('v60') || lower.includes('medio fino') || lower.includes('medio-fino')) return 750;
  if (lower.includes('kalita') || lower.includes('chemex')) return 850;
  if (lower.includes('medio grueso') || lower.includes('medio-grueso')) return 980;
  if (lower.includes('prensa') || lower.includes('french') || lower.includes('grueso') || lower.includes('cupping')) return 1100;
  if (lower.includes('cold brew')) return 1250;
  return 750;
}
