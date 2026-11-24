import React from 'react';
import { Snowflake, MinusCircle, Edit, Trash2, Share2 } from 'lucide-react';
import { getScaIcon, getScaColorForNote, stripEmojis } from '../../utils/scaIcons';
import { getRoast, getDegassing, roastStyle } from '../../utils/roast';

// V6 Editorial Roaster Label Card: theme-integrated card with roast accent bar,
// technical spec grid, colored SCA tasting notes, visual stock bar, and compact actions.
export default function BatchHeaderCard({
  batch,
  isOwner,
  onSubtractDose,
  onOpenCardModal,
  onEditBatch,
  onDeleteBatch,
  isFrozen
}) {
  if (!batch) return null;

  let scaTags = [];
  if (batch.roaster_notes) {
    if (batch.roaster_notes.includes('[Notas: ')) {
      const match = batch.roaster_notes.match(/\[Notas: (.*?)\]/);
      if (match) scaTags = match[1].split(',').map(s => s.trim()).filter(Boolean);
    } else if (batch.roaster_notes.trim()) {
      scaTags = batch.roaster_notes.split(',').map(s => s.trim()).filter(Boolean).slice(0, 6);
    }
  }

  const isBag = batch.storage_type === 'bag';
  const remainingDoses = batch.remaining_doses ?? 0;
  const totalDoses = batch.total_doses ?? 0;
  const doseWeightNum = parseFloat(batch.dose_weight) || (isBag ? 18.0 : 20.0);
  const totalGrams = batch.total_weight_g ?? (doseWeightNum * totalDoses);
  const remainingGrams = batch.remaining_weight_g !== null && batch.remaining_weight_g !== undefined
    ? batch.remaining_weight_g
    : (doseWeightNum * remainingDoses);

  const stockRatio = isBag
    ? (totalGrams > 0 ? Math.max(0, Math.min(1, remainingGrams / totalGrams)) : 0)
    : (totalDoses > 0 ? Math.max(0, Math.min(1, remainingDoses / totalDoses)) : 0);
  const isLowStock = stockRatio > 0 && stockRatio <= 0.22;

  const roast = getRoast(batch.roast_level);
  const isBatchFrozen = isFrozen !== undefined
    ? isFrozen
    : Boolean(batch.freeze_date && String(batch.freeze_date).trim() !== '');
  const rest = getDegassing({ ...batch, freeze_date: isBatchFrozen ? batch.freeze_date : null });

  const specs = [
    batch.origin ? { k: 'Origen', v: batch.origin } : null,
    batch.variety ? { k: 'Variedad', v: batch.variety } : null,
    batch.process ? { k: 'Proceso', v: batch.process } : null,
    batch.altitude ? { k: 'Altitud', v: /m/i.test(String(batch.altitude)) ? batch.altitude : `${batch.altitude} m` } : null,
    batch.roast_date ? { k: 'Tostado', v: batch.roast_date } : null
  ].filter(Boolean);

  const showProducer = batch.producer &&
    batch.producer.trim() &&
    batch.producer.trim().toLowerCase() !== (batch.roaster || '').trim().toLowerCase() &&
    batch.producer.trim().toLowerCase() !== 'especialidad';

  return (
    <section className="bt-label-card" style={roastStyle(batch.roast_level)} aria-label={`Ficha de ${batch.name}`}>
      <div className="bt-label-accent" aria-hidden="true" />

      <div className="bt-label-body">
        {/* Eyebrow: Roaster + Roast level + SCA / Rest badges */}
        <div className="bt-label-eyebrow">
          <div className="bt-label-roaster-wrap">
            <span className="bt-label-roaster">{batch.roaster || 'Tostador de especialidad'}</span>
            <span className="bt-label-roast-pill">
              <span className="bt-roast-dot" aria-hidden="true" />
              {roast.label}
            </span>
          </div>

          <div className="bt-label-badges">
            {rest && (
              <span className={`bt-label-pill${rest.tone ? ` is-${rest.tone}` : ''}`}>
                {rest.frozen && <Snowflake size={11} aria-hidden="true" />}
                {rest.word}
              </span>
            )}
            {batch.sca_score && (
              <span className="bt-label-sca" aria-label={`Puntaje SCA ${parseFloat(batch.sca_score).toFixed(1)}`}>
                {parseFloat(batch.sca_score).toFixed(1)} <small>SCA</small>
              </span>
            )}
          </div>
        </div>

        {/* Hero Title */}
        <div className="bt-label-title-wrap">
          <h2 className="bt-label-name">{batch.name}</h2>
          {showProducer && <div className="bt-label-producer">Prod. {batch.producer}</div>}
        </div>

        {/* Technical Specs Grid */}
        {specs.length > 0 && (
          <dl className="bt-spec-grid">
            {specs.map((item) => (
              <div key={item.k} className="bt-spec-cell">
                <dt className="bt-spec-k">{item.k}</dt>
                <dd className="bt-spec-v">{item.v}</dd>
              </div>
            ))}
          </dl>
        )}

        {/* Tasting Notes with semantic SCA colors */}
        {scaTags.length > 0 && (
          <div className="bt-notes" aria-label="Notas de cata">
            {scaTags.map((rawTag, i) => {
              const label = stripEmojis(rawTag);
              const colors = getScaColorForNote(label);
              return (
                <span
                  key={i}
                  className="bt-note bt-note-sca"
                  style={{ '--note-icon': colors.border }}
                >
                  {getScaIcon(label, 12, 2.2)}
                  <span>{label}</span>
                </span>
              );
            })}
          </div>
        )}

        {/* Visual Stock Bar + Quick Deduction */}
        <div className="bt-stock-row">
          <div className="bt-stock-info">
            <div className="bt-stock-head">
              <span className="bt-spec-k">Stock</span>
              <span className="bt-stock-val">
                {isBag
                  ? <><strong>{Math.round(remainingGrams)} g</strong> <small>/ {Math.round(totalGrams)} g</small></>
                  : <><strong>{remainingDoses}</strong> <small>/ {totalDoses} tubos</small></>}
              </span>
            </div>
            <div className="bt-stock-track" role="progressbar" aria-valuenow={Math.round(stockRatio * 100)} aria-valuemin={0} aria-valuemax={100}>
              <div
                className={`bt-stock-fill${isLowStock ? ' is-low' : ''}`}
                style={{ width: `${Math.round(stockRatio * 100)}%` }}
              />
            </div>
          </div>

          {isOwner && (isBag ? remainingGrams > 0 : remainingDoses > 0) && (
            <button
              type="button"
              className="bt-stock-btn"
              onClick={onSubtractDose}
            >
              <MinusCircle size={15} aria-hidden="true" />
              <span>{isBag ? `-${Math.round(doseWeightNum)}g` : '-1 tubo'}</span>
            </button>
          )}
        </div>

        {/* Compact Action Footer */}
        <div className="bt-label-actions">
          <button
            type="button"
            className="barista-btn barista-btn-secondary bt-action-compact"
            onClick={onOpenCardModal}
          >
            <Share2 size={15} aria-hidden="true" />
            <span>Tarjeta</span>
          </button>
          {isOwner && (
            <>
              <button
                type="button"
                className="barista-btn barista-btn-secondary bt-action-compact"
                onClick={onEditBatch}
              >
                <Edit size={15} aria-hidden="true" />
                <span>Editar</span>
              </button>
              <button
                type="button"
                className="barista-btn barista-btn-ghost bt-action-compact bt-action-danger"
                aria-label="Eliminar lote"
                title="Eliminar lote"
                onClick={onDeleteBatch}
              >
                <Trash2 size={15} aria-hidden="true" />
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
