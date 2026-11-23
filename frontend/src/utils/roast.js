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

function getDegassingWindow(roastLevel) {
  const r = String(roastLevel || '').toLowerCase();
  if (/oscuro|dark|franc|italian/.test(r)) {
    return { readyFrom: 4, peakUntil: 21 };
  }
  if (/claro|light|n[oó]rdico|nordic|filtr/.test(r)) {
    return { readyFrom: 10, peakUntil: 35 };
  }
  return { readyFrom: 7, peakUntil: 28 };
}

// Rest status with roast-aware degassing curve and exact day count. Freezing pauses aging.
export function getDegassing(batch, now = new Date()) {
  if (!batch || !batch.roast_date) return null;
  const roast = new Date(batch.roast_date);
  if (Number.isNaN(roast.getTime())) return null;
  const frozen = Boolean(batch.freeze_date && String(batch.freeze_date).trim());
  const freeze = frozen ? new Date(batch.freeze_date) : null;
  const end = frozen && !Number.isNaN(freeze?.getTime()) ? freeze : now;
  const day = Math.max(0, Math.floor((end - roast) / DAY));
  const { readyFrom, peakUntil } = getDegassingWindow(batch.roast_level);

  if (frozen) return { day, frozen, tone: 'cryo', word: `Congelado · d${day}` };
  if (day < readyFrom) {
    const left = Math.max(1, readyFrom - day);
    return { day, frozen, tone: '', word: `Reposo · d${day} (+${left}d)` };
  }
  if (day > peakUntil) return { day, frozen, tone: 'warn', word: `Pasado · d${day}` };
  return { day, frozen, tone: 'ok', word: `En pico · d${day}` };
}
