import React from 'react';
import { Snowflake, Mountain, MinusCircle, Edit, Trash2, Share2, MapPin, Sprout, Cog } from 'lucide-react';
import { getScaColorForNote, getScaIcon, stripEmojis } from '../../utils/scaIcons';
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

  const degas = getDegassing({ ...batch, freeze_date: isBatchFrozen ? batch.freeze_date : null });
  const restDays = degas ? degas.day : null; // same source as the inventory card
  const degasTone = degas ? (isBatchFrozen ? 'is-cryo' : degas.status === 'late' ? 'is-warn' : degas.status === 'ideal' ? 'is-ok' : '') : '';
  const degasNote = !degas ? 'Sin fecha de tueste'
    : isBatchFrozen ? 'Pausado en cava a −18 °C'
    : degas.status === 'resting' ? 'Aún desgasificando'
    : degas.status === 'late' ? 'Pasó la ventana ideal'
    : 'En ventana ideal';

  const tubeSlots = Math.min(Math.max(totalDoses, remainingDoses), 24);

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
          {batch.altitude && <span className="bt-hero-chip"><Mountain size={13} aria-hidden="true" />{batch.altitude}</span>}
          {isBatchFrozen && <span className="bt-hero-chip"><Snowflake size={13} aria-hidden="true" />Cava −18 °C</span>}
        </div>
      </header>

      <div className="bt-bento">
        <div className="bt-tile" style={roastStyle(batch.roast_level)}>
          <span className="bt-tile-k">Tueste</span>
          <span className="bt-tile-v">{roast.label}</span>
          <span className="bt-tile-s">Perfil de tueste</span>
          <div className="bt-roast-ramp" aria-hidden="true"><i style={{ left: `${roast.pos}%` }} /></div>
        </div>

        <div className="bt-tile">
          <span className="bt-tile-k">Reposo</span>
          <span className="bt-tile-v">{restDays !== null ? <>{restDays}<small> días</small></> : '—'}</span>
          <span className={`bt-tile-s ${degasTone}`}>{degasNote}</span>
        </div>

        <div className="bt-tile span-2">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span className="bt-tile-k">{isBag ? 'Bolsa de Café' : 'Portatubos'}</span>
              <span className="bt-tile-v">
                {isBag ? (
                  <>{Math.round(remainingGrams)}<small> g / {Math.round(totalGrams)} g · ~{remainingDoses} {remainingDoses === 1 ? 'taza' : 'tazas'}</small></>
                ) : (
                  <>{remainingDoses}<small> / {totalDoses} tubos · {Math.round(remainingGrams)} g</small></>
                )}
              </span>
            </div>
            {isOwner && (isBag ? remainingGrams > 0 : remainingDoses > 0) && (
              <button
                type="button"
                className="barista-btn barista-btn-secondary"
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(8);
                  onSubtractDose();
                }}
              >
                <MinusCircle size={16} aria-hidden="true" />
                <span>{isBag ? `Restar dosis (~${Math.round(doseWeightNum)}g)` : 'Restar 1 tubo'}</span>
              </button>
            )}
          </div>
          {isBag ? (
            <div style={{ marginTop: '12px' }}>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, Math.max(0, totalGrams > 0 ? (remainingGrams / totalGrams) * 100 : 0))}%`,
                    background: 'var(--roast-color, var(--color-crimson))',
                    borderRadius: '999px',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--muted, #888)', marginTop: '4px' }}>
                <span>Quedan {Math.round(remainingGrams)} g en bolsa</span>
                <span>{totalGrams > 0 ? Math.round((remainingGrams / totalGrams) * 100) : 0}%</span>
              </div>
            </div>
          ) : (
            tubeSlots > 0 && (
              <div className="bt-tubes" style={roastStyle(batch.roast_level)} aria-hidden="true">
                {Array.from({ length: tubeSlots }, (_, i) => <i key={i} className={i < remainingDoses ? 'is-full' : ''} />)}
              </div>
            )
          )}
        </div>

        {scaTags.length > 0 && (
          <div className="bt-tile span-2">
            <span className="bt-tile-k">Notas de cata</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {scaTags.map((tag, i) => {
                const colors = getScaColorForNote(tag);
                return (
                  <span
                    key={i}
                    style={{
                      padding: '5px 10px',
                      backgroundColor: colors.bg,
                      border: `1px solid ${colors.border}`,
                      color: colors.text,
                      borderRadius: 'var(--r-pill)',
                      fontSize: 'var(--fs-12)',
                      fontWeight: 500,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    {getScaIcon(tag, 13, 2)} {stripEmojis(tag)}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="bt-actions">
        <button
          type="button"
          className="barista-btn barista-btn-secondary"
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(6);
            onOpenCardModal();
          }}
        >
          <Share2 size={16} aria-hidden="true" />
          <span>Tarjeta</span>
        </button>
        {isOwner && (
          <>
            <button
              type="button"
              className="barista-btn barista-btn-secondary"
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(6);
                onEditBatch();
              }}
            >
              <Edit size={16} aria-hidden="true" />
              <span>Editar</span>
            </button>
            <button
              type="button"
              className="barista-btn barista-btn-ghost"
              aria-label="Eliminar lote"
              title="Eliminar lote"
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(8);
                onDeleteBatch();
              }}
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
