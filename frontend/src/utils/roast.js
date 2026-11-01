// KISS: roast is a word (Claro / Medio / Oscuro) and rest is a word.
// No Agtron numbers, no scales: the app doesn't measure them.

const ROASTS = {
  claro:  { label: 'Claro',  color: 'var(--roast-light)',  ink: '#1F1206' },
  medio:  { label: 'Medio',  color: 'var(--roast-medium)', ink: '#FFFFFF' },
  oscuro: { label: 'Oscuro', color: 'var(--roast-dark)',   ink: '#FFFFFF' },
};

export function getRoast(level) {
  const r = String(level || '').toLowerCase();
  if (/oscuro|dark|franc|italian/.test(r)) return ROASTS.oscuro;
  if (/claro|light|n[oó]rdico|nordic|filtr/.test(r)) return ROASTS.claro;
  return ROASTS.medio;
}

export function roastStyle(level) {
  const r = getRoast(level);
  return { '--roast': r.color, '--roast-ink': r.ink };
}

const DAY = 86400000;
const READY_FROM = 7;   // days after roast
const READY_UNTIL = 30; // after this, "Pasado"

// Rest status in one word. Freezing pauses it.
export function getDegassing(batch, now = new Date()) {
  if (!batch || !batch.roast_date) return null;
  const roast = new Date(batch.roast_date);
  if (Number.isNaN(roast.getTime())) return null;
  const frozen = Boolean(batch.freeze_date && String(batch.freeze_date).trim());
  const freeze = frozen ? new Date(batch.freeze_date) : null;
  const end = frozen && !Number.isNaN(freeze?.getTime()) ? freeze : now;
  const day = Math.max(0, Math.floor((end - roast) / DAY));
  if (frozen) return { day, frozen, tone: 'cryo', word: 'Congelado' };
  if (day < READY_FROM) return { day, frozen, tone: '', word: 'Descansando' };
  if (day > READY_UNTIL) return { day, frozen, tone: 'warn', word: 'Pasado' };
  return { day, frozen, tone: 'ok', word: 'Listo' };
}
