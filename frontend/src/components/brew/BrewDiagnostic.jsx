import React, { useEffect, useState } from 'react';
import { Check, ClipboardCopy, RotateCcw } from 'lucide-react';
import { generateCoffeeStickerImage } from '../../utils/cardGenerator';
import { copyOrShareImage, STICKER_HINTS } from '../../utils/clipboard';
import { formatTime } from '../../utils/brewStages.js';

// After "Terminar": one tap on the taste saves the brew to the log (and the dose
// comes off the stock). Flow and body are optional, folded away.
const TASTES = [
  { key: 'sour', label: 'Ácido', hint: 'Muele más fino' },
  { key: 'balanced', label: 'Bien', hint: 'Repetir así' },
  { key: 'bitter', label: 'Amargo', hint: 'Muele más grueso' }
];
const FLOWS = [
  { key: 'fast', label: 'Rápido' },
  { key: 'on_time', label: 'A tiempo' },
  { key: 'slow', label: 'Lento' }
];
const BODIES = [
  { key: 'thin', label: 'Aguado' },
  { key: 'balanced', label: 'Sedoso' },
  { key: 'astringent', label: 'Áspero' }
];

const tasteLabel = (key) => (TASTES.find((t) => t.key === key) || TASTES[1]).label;

function readStickerStyle() {
  try { return localStorage.getItem('beantag-share-style') || undefined; } catch (e) { return undefined; }
}

function Segmented({ label, options, value, onChange }) {
  const id = `bt-diag-${label.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div className="bt-diag-row">
      <span id={id} className="bt-diag-row-label">{label}</span>
      <div className="bt-seg" role="radiogroup" aria-labelledby={id}>
        {options.map((o) => (
          <button
            key={o.key}
            type="button"
            role="radio"
            aria-checked={value === o.key}
            className={`bt-seg-btn${value === o.key ? ' is-active' : ''}`}
            onClick={() => onChange(o.key)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function BrewDiagnostic({
  elapsedSeconds,
  recipe,
  batch,
  waterG,
  feedback,
  setFeedback,
  onSave,
  isSaving,
  onBackToTimer,
  onClose
}) {
  const [saved, setSaved] = useState(null);
  const [sticker, setSticker] = useState(null);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const dose = recipe?.dose_in_g || 15;
  const coffeeName = batch?.name || batch?.origin || 'Café';
  const method = String(recipe?.method || 'Filtro').replace(/\s*\(.*\)\s*$/, '');

  // Prepare the sticker as soon as the brew is saved, so "Copiar" runs inside the tap
  useEffect(() => {
    if (!saved) { setSticker(null); return undefined; }
    let alive = true;
    generateCoffeeStickerImage(
      { ...recipe, brew_time: formatTime(elapsedSeconds), batch },
      { template: readStickerStyle(), orientation: 'horizontal', includeRecipe: true }
    )
      .then((url) => { if (alive) setSticker(url); })
      .catch(() => { if (alive) setSticker(null); });
    return () => { alive = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved]);

  const save = async (taste) => {
    const fb = { ...feedback, taste };
    setFeedback(fb);
    setStatus('');
    const res = await onSave(fb);
    if (res) setSaved({ ...res, feedback: fb });
    else setStatus('No se pudo guardar. Revisa tu sesión e inténtalo otra vez.');
  };

  const copySticker = async () => {
    if (!sticker) return;
    try {
      const how = await copyOrShareImage(sticker, `${coffeeName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-sticker.png`);
      if (STICKER_HINTS[how]) setStatus(STICKER_HINTS[how]);
    } catch (err) {
      setStatus('No se pudo copiar ni compartir el sticker.');
    }
  };

  const undo = async () => {
    if (!saved || typeof saved.undo !== 'function') return;
    setBusy(true);
    try {
      await saved.undo();
      setSaved(null);
      setStatus('Deshecho. Puedes valorar otra vez o salir.');
    } catch (err) {
      setStatus(err.message || 'No se pudo deshacer.');
    } finally {
      setBusy(false);
    }
  };

  if (saved) {
    const corr = saved.correction || {};
    const changed = corr.diagnosis && corr.diagnosis !== 'balanced';
    return (
      <div className="bt-diag">
        <div className="bt-diag-done">
          <span className="bt-diag-check" aria-hidden="true"><Check size={28} strokeWidth={2.6} /></span>
          <h2 className="bt-diag-title">Guardado en tu bitácora</h2>
          <p className="bt-diag-sub">
            {tasteLabel(saved.feedback.taste)} · {formatTime(elapsedSeconds)} · se descontaron {dose} g
          </p>
        </div>

        {changed && (
          <div className="bt-diag-next">
            <span className="bt-diag-row-label">La próxima vez</span>
            <strong>{corr.newGrindText}{corr.newTemp ? ` · ${corr.newTemp}°C` : ''}</strong>
            {corr.explanation && <p>{corr.explanation}</p>}
          </div>
        )}

        <div className="bt-diag-actions">
          <button type="button" className="bt-diag-primary" onClick={copySticker} disabled={!sticker}>
            <ClipboardCopy size={18} aria-hidden="true" />
            {sticker ? 'Copiar sticker para la story' : 'Preparando sticker…'}
          </button>
          <div className="bt-diag-pair">
            {typeof saved.undo === 'function' && (
              <button type="button" className="bt-diag-secondary" onClick={undo} disabled={busy}>
                <RotateCcw size={16} aria-hidden="true" />
                Deshacer
              </button>
            )}
            <button type="button" className="bt-diag-secondary" onClick={onClose}>Listo</button>
          </div>
        </div>
        <p className="bt-diag-status" role="status" aria-live="polite">{status}</p>
      </div>
    );
  }

  return (
    <div className="bt-diag">
      <div className="bt-diag-head">
        <span className="bt-diag-time">{formatTime(elapsedSeconds)}</span>
        <span className="bt-diag-sub">{coffeeName} · {method} · {dose} g → {waterG} g</span>
      </div>

      <h2 className="bt-diag-title" id="bt-diag-taste">¿Cómo sabe?</h2>
      <div className="bt-taste bt-diag-taste" role="group" aria-labelledby="bt-diag-taste">
        {TASTES.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`bt-taste-btn${feedback.taste === t.key && isSaving ? ' is-active' : ''}`}
            onClick={() => save(t.key)}
            disabled={isSaving}
          >
            {t.label}
            <small>{t.hint}</small>
          </button>
        ))}
      </div>
      <p className="bt-diag-note">Un toque guarda la extracción y descuenta la dosis.</p>

      <details className="bt-more">
        <summary>Caudal y cuerpo (opcional)</summary>
        <div className="bt-diag-fine">
          <Segmented label="Caudal" options={FLOWS} value={feedback.flow} onChange={(v) => setFeedback((p) => ({ ...p, flow: v }))} />
          <Segmented label="Cuerpo" options={BODIES} value={feedback.body} onChange={(v) => setFeedback((p) => ({ ...p, body: v }))} />
          <p className="bt-diag-note">Elige esto antes de tocar el sabor.</p>
        </div>
      </details>

      <p className="bt-diag-status" role="status" aria-live="polite">{status}</p>

      <div className="bt-diag-pair">
        <button type="button" className="bt-diag-secondary" onClick={onBackToTimer}>Volver al cronómetro</button>
        <button type="button" className="bt-diag-secondary" onClick={onClose}>Salir sin guardar</button>
      </div>
    </div>
  );
}
