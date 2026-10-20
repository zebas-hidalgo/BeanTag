import React from 'react';
import { Snowflake, Flame, Mountain, Award, MinusCircle, Edit, Trash2, Share2, Tag } from 'lucide-react';
import ScaRadarChart from '../ScaRadarChart';
import { getScaColorForNote, getScaIcon, stripEmojis } from '../../utils/scaIcons';

export default function BatchHeaderCard({
  batch,
  isOwner,
  onSubtractDose,
  onOpenCardModal,
  onEditBatch,
  onDeleteBatch,
  isFrozen,
  daysSinceRoast,
  roastDotColor,
  lastRecipe
}) {
  if (!batch) return null;

  // Extract SCA tasting notes tags
  let scaTags = [];
  if (batch.roaster_notes && batch.roaster_notes.includes('[Notas: ')) {
    const match = batch.roaster_notes.match(/\[Notas: (.*?)\]/);
    if (match) scaTags = match[1].split(',').map(s => s.trim());
  }

  const remainingDoses = batch.remaining_doses ?? 0;
  const totalDoses = batch.total_doses ?? 0;
  const remainingGrams = batch.remaining_weight_g ?? 0;

  const isBatchFrozen = isFrozen !== undefined
    ? isFrozen
    : Boolean(batch.freeze_date && String(batch.freeze_date).trim() !== '');

  const effectiveDaysSinceRoast = daysSinceRoast !== undefined
    ? daysSinceRoast
    : (() => {
        if (!batch.roast_date) return null;
        const roast = new Date(batch.roast_date);
        const target = isBatchFrozen ? new Date(batch.freeze_date) : new Date();
        return Math.ceil(Math.abs(target - roast) / (1000 * 60 * 60 * 24));
      })();

  return (
    <div className="barista-card" style={{ marginBottom: '16px', position: 'relative' }}>
      {/* Top Header: Title, Roaster and SCA Score */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
        <div style={{ flex: '1 1 200px' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            margin: '0 0 4px 0',
            textTransform: 'uppercase',
            fontSize: 'var(--text-lg)',
            fontWeight: '800',
            letterSpacing: '-0.02em',
            color: 'var(--text-primary)',
            lineHeight: 1.2
          }}>
            {batch.name}
          </h2>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: '600' }}>
            {batch.roaster || 'Tostador Especialidad'}
          </div>
        </div>

        {/* SCA Score Badge */}
        {batch.sca_score && (
          <div className="barista-chip" style={{
            borderColor: 'var(--accent-terracotta)',
            color: 'var(--accent-terracotta)',
            backgroundColor: 'var(--bg-elevated)',
            fontWeight: '800',
            fontSize: 'var(--text-xs)',
            padding: '6px 10px',
            fontFamily: 'var(--font-metric)'
          }}>
            <Award size={14} />
            <span>SCA {parseFloat(batch.sca_score).toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Terroir & Origin Meta Pill Row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
        {batch.origin && (
          <span className="barista-chip" title="Origen">
            📍 {batch.origin}
          </span>
        )}
        {batch.variety && (
          <span className="barista-chip" title="Variedad">
            🌱 {batch.variety}
          </span>
        )}
        {batch.process && (
          <span className="barista-chip" title="Proceso">
            ⚙️ {batch.process}
          </span>
        )}
        {batch.altitude && (
          <span className="barista-chip" title="Altitud">
            <Mountain size={12} /> {batch.altitude}
          </span>
        )}
        {batch.roast_level && (
          <span className="barista-chip" title="Nivel de Tueste">
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: roastDotColor, display: 'inline-block' }} />
            {batch.roast_level}
          </span>
        )}
        {effectiveDaysSinceRoast !== null && (
          <span className="barista-chip" title="Días desde el tueste">
            <Flame size={12} /> {effectiveDaysSinceRoast} días de reposo
          </span>
        )}
        {isBatchFrozen && (
          <span className="barista-chip" style={{ borderColor: 'var(--accent-cryo)', color: 'var(--accent-cryo)' }} title="Preservado en Cava Criogénica">
            <Snowflake size={12} /> Cava Criogénica (-18°C)
          </span>
        )}
      </div>

      {/* Single Dose Tube Stock Bar */}
      <div className="barista-card-subtle" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
        padding: '10px 14px'
      }}>
        <div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: '600', display: 'block' }}>
            Stock en Portatubos
          </span>
          <span style={{ fontSize: 'var(--text-base)', fontWeight: '800', fontFamily: 'var(--font-metric)', color: 'var(--text-primary)' }}>
            <span style={{ color: 'var(--accent-terracotta)' }}>{remainingDoses}</span> / {totalDoses} tubos
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: '500', color: 'var(--text-muted)', marginLeft: '6px' }}>
              ({remainingGrams}g disponibles)
            </span>
          </span>
        </div>

        {isOwner && remainingDoses > 0 && (
          <button
            type="button"
            className="barista-btn barista-btn-secondary"
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(8);
              onSubtractDose();
            }}
            style={{ minHeight: '44px', padding: '8px 14px', fontSize: 'var(--text-xs)' }}
          >
            <MinusCircle size={15} />
            <span>Restar 1 Tubo</span>
          </button>
        )}
      </div>

      {/* SCA Tasting Notes Chips */}
      {scaTags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
          {scaTags.map((tag, i) => {
            const colors = getScaColorForNote(tag);
            return (
              <span
                key={i}
                style={{
                  padding: '4px 10px',
                  backgroundColor: colors.bg,
                  border: `1.5px solid ${colors.border}`,
                  color: colors.text,
                  borderRadius: 'var(--radius-pill)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: '700',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {getScaIcon(tag, 13)} {stripEmojis(tag)}
              </span>
            );
          })}
        </div>
      )}

      {/* SCA Sensory Radar Chart */}
      <ScaRadarChart
        sweetness={8}
        acidity={lastRecipe ? 8 : 7}
        body={lastRecipe ? 7 : 6}
        aroma={9}
        balance={lastRecipe ? 8 : 7}
      />

      {/* Quick Action Utilities Row (Edit, Share Card, Delete) */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '12px', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
        <button
          type="button"
          className="barista-btn barista-btn-ghost"
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(6);
            onOpenCardModal();
          }}
          style={{ flex: 1, minHeight: '44px', fontSize: 'var(--text-xs)' }}
        >
          <Share2 size={15} />
          <span>Tarjeta</span>
        </button>

        {isOwner && (
          <>
            <button
              type="button"
              className="barista-btn barista-btn-ghost"
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(6);
                onEditBatch();
              }}
              style={{ flex: 1, minHeight: '44px', fontSize: 'var(--text-xs)' }}
            >
              <Edit size={15} />
              <span>Editar</span>
            </button>
            <button
              type="button"
              className="barista-btn barista-btn-ghost"
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(8);
                onDeleteBatch();
              }}
              style={{ minHeight: '44px', color: 'var(--accent-danger)', padding: '0 12px' }}
              title="Eliminar lote"
            >
              <Trash2 size={15} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
