import React from 'react';
import { Snowflake, Mountain, MinusCircle, Edit, Trash2, Share2, MapPin, Sprout, Cog } from 'lucide-react';
import { stripEmojis } from '../../utils/scaIcons';
import { getRoast, getDegassing, roastStyle } from '../../utils/roast';

// V5 «Tueste»: hero tinted by the batch's roast + bento tiles for the key numbers.
export default function BatchHeaderCard({
  batch,
  isOwner,
  onSubtractDose,
  onOpenCardModal,
  onEditBatch,
  onDeleteBatch,
  isFrozen,
  daysSinceRoast,
  lastRecipe
}) {
  if (!batch) return null;

  let scaTags = [];
  if (batch.roaster_notes && batch.roaster_notes.includes('[Notas: ')) {
    const match = batch.roaster_notes.match(/\[Notas: (.*?)\]/);
    if (match) scaTags = match[1].split(',').map(s => s.trim()).filter(Boolean);
  }

  const isBag = batch.storage_type === 'bag';
  const remainingDoses = batch.remaining_doses ?? 0;
  const totalDoses = batch.total_doses ?? 0;
  const doseWeightNum = parseFloat(batch.dose_weight) || (isBag ? 18.0 : 20.0);
  const totalGrams = batch.total_weight_g ?? (doseWeightNum * totalDoses);
  const remainingGrams = batch.remaining_weight_g !== null && batch.remaining_weight_g !== undefined
    ? batch.remaining_weight_g
    : (doseWeightNum * remainingDoses);
  const roast = getRoast(batch.roast_level);

  const isBatchFrozen = isFrozen !== undefined
    ? isFrozen
    : Boolean(batch.freeze_date && String(batch.freeze_date).trim() !== '');

  const rest = getDegassing({ ...batch, freeze_date: isBatchFrozen ? batch.freeze_date : null });


  return (
    <div style={{ marginBottom: '16px' }}>
      <header className="bt-hero" style={roastStyle(batch.roast_level)}>
        <div className="bt-hero-top">
          <div style={{ minWidth: 0 }}>
            <h2 className="bt-hero-name">{batch.name}</h2>
            <div className="bt-hero-sub">{batch.roaster || 'Tostador de especialidad'}</div>
          </div>
          {batch.sca_score && (
            <div className="bt-hero-score" aria-label={`Puntaje SCA ${parseFloat(batch.sca_score).toFixed(1)}`}>
              {parseFloat(batch.sca_score).toFixed(1)}
              <small>SCA</small>
            </div>
          )}
        </div>
        <div className="bt-hero-chips">
          {isBag && <span className="bt-hero-chip">☕ Bolsa {Math.round(totalGrams)}g</span>}
          {batch.origin && <span className="bt-hero-chip"><MapPin size={13} aria-hidden="true" />{batch.origin}</span>}
          {batch.variety && <span className="bt-hero-chip"><Sprout size={13} aria-hidden="true" />{batch.variety}</span>}
          {batch.process && <span className="bt-hero-chip"><Cog size={13} aria-hidden="true" />{batch.process}</span>}
        </div>
      </header>

      <div className="bt-bento">
        <div className="bt-tile" style={roastStyle(batch.roast_level)}>
          <span className="bt-tile-k">Tueste</span>
          <span className="bt-tile-v bt-tile-word"><span className="bt-roast-dot" aria-hidden="true" />{roast.label}</span>
        </div>

        <div className="bt-tile">
          <span className="bt-tile-k">Reposo</span>
          <span className={`bt-tile-v bt-tile-word${rest?.tone ? ` is-${rest.tone}` : ''}`}>{rest ? rest.word : '—'}</span>
          {rest && <span className="bt-tile-s">{rest.frozen ? `congelado al día ${rest.day}` : `día ${rest.day}`}</span>}
        </div>

        <div className="bt-tile span-2">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span className="bt-tile-k">Quedan</span>
              <span className="bt-tile-v">
                {isBag
                  ? <>{Math.round(remainingGrams)} g<small> de {Math.round(totalGrams)} g</small></>
                  : <>{remainingDoses}<small> de {totalDoses} tubos</small></>}
              </span>
            </div>
            {isOwner && (isBag ? remainingGrams > 0 : remainingDoses > 0) && (
              <button type="button" className="barista-btn barista-btn-secondary" onClick={onSubtractDose}>
                <MinusCircle size={16} aria-hidden="true" />
                <span>{isBag ? 'Usé una dosis' : 'Usé un tubo'}</span>
              </button>
            )}
          </div>
        </div>

        {scaTags.length > 0 && (
          <div className="bt-tile span-2">
            <span className="bt-tile-k">Notas</span>
            <div className="bt-notes">
              {scaTags.map((tag, i) => <span key={i} className="bt-note">{stripEmojis(tag)}</span>)}
            </div>
          </div>
        )}
      </div>

      <div className="bt-actions">
        <button
          type="button"
          className="barista-btn barista-btn-secondary"
          onClick={onOpenCardModal}
        >
          <Share2 size={16} aria-hidden="true" />
          <span>Tarjeta</span>
        </button>
        {isOwner && (
          <>
            <button
              type="button"
              className="barista-btn barista-btn-secondary"
              onClick={onEditBatch}
            >
              <Edit size={16} aria-hidden="true" />
              <span>Editar</span>
            </button>
            <button
              type="button"
              className="barista-btn barista-btn-ghost"
              aria-label="Eliminar lote"
              title="Eliminar lote"
              onClick={onDeleteBatch}
              style={{ flex: '0 0 auto', color: 'var(--bad)' }}
            >
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
