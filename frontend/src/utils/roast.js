// Roast & degassing helpers — the batch's own data drives its color.
// BeanTag stores roast_level as Claro / Medio / Oscuro (no Agtron reading),
// so Agtron here is a reference value for the level, labeled as approximate in the UI.

const ROASTS = {
  claro:  { label: 'Claro',  agtron: 75, color: 'var(--roast-light)',  ink: '#1F1206', pos: 30 },
  medio:  { label: 'Medio',  agtron: 60, color: 'var(--roast-medium)', ink: '#FFFFFF', pos: 55 },
  oscuro: { label: 'Oscuro', agtron: 45, color: 'var(--roast-dark)',   ink: '#FFFFFF', pos: 82 },
};

export function getRoast(level) {
  const r = String(level || '').toLowerCase();
  if (/oscuro|dark|franc|italian/.test(r)) return ROASTS.oscuro;
  if (/claro|light|nordic|n[oó]rdico|filtr/.test(r)) return ROASTS.claro;
  return ROASTS.medio;
}

// CSS custom properties for an element tinted by its roast
export function roastStyle(level) {
  const r = getRoast(level);
  return { '--roast': r.color, '--roast-ink': r.ink };
}

const DAY = 86400000;

// Rest window for filter brewing (days after roast). Freezing pauses degassing.
export const REST_WINDOW = { from: 7, to: 21, scaleMax: 30 };

export function getDegassing(batch, now = new Date()) {
  if (!batch || !batch.roast_date) return null;
  const roast = new Date(batch.roast_date);
  if (Number.isNaN(roast.getTime())) return null;
  const frozen = Boolean(batch.freeze_date && String(batch.freeze_date).trim());
  const freeze = frozen ? new Date(batch.freeze_date) : null;
  const end = frozen && !Number.isNaN(freeze?.getTime()) ? freeze : now;
  const day = Math.max(0, Math.floor((end - roast) / DAY));
  let status = 'ideal';
  if (day < REST_WINDOW.from) status = 'resting';
  else if (day > REST_WINDOW.to) status = 'late';
  const label = frozen
    ? `Congelado al día ${day}`
    : status === 'resting' ? `Reposo · día ${day}` : status === 'late' ? `Día ${day} · pasó la ventana` : `Día ${day} · en ventana`;
  return {
    day, frozen, status, label,
    pos: Math.min(100, (day / REST_WINDOW.scaleMax) * 100),
    winFrom: (REST_WINDOW.from / REST_WINDOW.scaleMax) * 100,
    winTo: (REST_WINDOW.to / REST_WINDOW.scaleMax) * 100,
  };
}
