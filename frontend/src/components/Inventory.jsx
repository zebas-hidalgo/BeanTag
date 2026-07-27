import React, { useState } from 'react';
import { formatLocalDateStr } from '../utils/date';
import { RenderScaChips } from '../utils/scaIcons';
import { Plus, Zap } from 'lucide-react';

export default function Inventory({ batches, onSelectBatch, onCreateTrigger }) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrado de lotes solo por buscador
  const filteredBatches = (batches || []).filter(batch => {
    if (!batch) return false;
    const name = batch.name || '';
    const producer = batch.producer || '';
    return (
      name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      producer.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div style={{ padding: '12px 12px 0 12px' }}>
      {/* Search bar */}
      <input 
        className="candy-input" 
        placeholder="Buscar café o productor..." 
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{ marginBottom: '16px' }}
      />

      {filteredBatches.length === 0 ? (
        <div className="candy-card static" style={{ textAlign: 'center', padding: '36px 20px', borderStyle: 'dashed', backgroundColor: 'var(--bg-card)' }}>
          <div style={{ fontSize: '36px', marginBottom: '10px' }}>☕</div>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', textTransform: 'uppercase', margin: '0 0 6px 0', color: 'var(--color-text)' }}>
            ¡No hay lotes en el inventario!
          </h3>
          <p style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', margin: '0 0 16px 0', lineHeight: 1.4 }}>
            Registra tu primer café especial para seguir dosis, tueste y recetas.
          </p>
          <button className="btn-candy primary" onClick={onCreateTrigger} style={{ margin: '0 auto', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}>
            <Plus size={16} strokeWidth={2.5} />
            Registrar Primer Lote
          </button>
        </div>
      ) : (
        filteredBatches.map(batch => {
          const isLowStock = batch.remaining_doses <= 2;
          const hasRecipes = batch.recipes && batch.recipes.length > 0;

          // Weight progress calculations
          const currentWeight = parseFloat(batch.remaining_weight_g || 0);
          const totalWeight = parseFloat(batch.total_weight_g || (batch.total_doses * (parseFloat(batch.dose_weight) || 20)) || 250);
          const weightPct = Math.min(100, Math.max(0, Math.round((currentWeight / totalWeight) * 100)));
          const fillClass = weightPct > 50 ? 'fill-high' : (weightPct > 20 ? 'fill-mid' : 'fill-low');

          // Roast Freshness Peak meter calculation
          let freshnessBadge = null;
          if (batch.freeze_date) {
            freshnessBadge = { label: '❄️ CONGELADO', class: 'freshness-frozen' };
          } else if (batch.roast_date) {
            const rDate = new Date(batch.roast_date);
            const today = new Date();
            const days = Math.floor((today - rDate) / (1000 * 60 * 60 * 24));
            if (!isNaN(days) && days >= 0) {
              if (days < 5) {
                freshnessBadge = { label: `💨 REPOSO (${days}D)`, class: 'freshness-degassing' };
              } else if (days <= 25) {
                freshnessBadge = { label: `✨ ÓPTIMO (${days}D)`, class: 'freshness-peak' };
              } else {
                freshnessBadge = { label: `⚠️ MADURO (${days}D)`, class: 'freshness-madure' };
              }
            }
          }

          return (
            <div 
              key={batch.id} 
              className={`candy-card ${isLowStock ? 'low-stock' : ''}`}
              onClick={() => onSelectBatch(batch.id)}
            >
              <div className="card-header-flex">
                <div>
                  <h3 className="card-title">{batch.name}</h3>
                  <p className="card-sub">{batch.producer}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <span className="mono-lbl-tag">{batch.origin || 'N/A'}</span>
                  {freshnessBadge && (
                    <span className={`roast-freshness-badge ${freshnessBadge.class}`}>
                      {freshnessBadge.label}
                    </span>
                  )}
                </div>
              </div>
              {/* Render tasting notes only if not frozen */}
              {!batch.freeze_date && <RenderScaChips notesStr={batch.roaster_notes || batch.notes} />}
              
              {/* Liquid Weight Progress Bar */}
              <div className="weight-progress-container">
                <div className="weight-progress-header">
                  <span>PESO RESTANTE</span>
                  <span>{currentWeight}g / {totalWeight}g ({weightPct}%)</span>
                </div>
                <div className="weight-progress-track">
                  <div className={`weight-progress-fill ${fillClass}`} style={{ width: `${weightPct}%` }} />
                </div>
              </div>

              <div className="mono-badge-row" style={{ marginTop: '8px' }}>
                <span className="mono-lbl-tag outline">{batch.remaining_doses} Dosis</span>
                <span className="mono-lbl-tag outline">{batch.roast_level || 'Medio'}</span>
                {isLowStock && <span className="mono-lbl-tag low-stock">¡Últimas dosis!</span>}
              </div>
              {hasRecipes && (() => {
                const r = batch.recipes[0];
                const methodLabel = (r.method || 'V60').replace(' (Filtrado)', '');
                const doseLabel = (r.dose_in_g !== null && r.dose_in_g !== undefined) ? r.dose_in_g : (parseFloat(batch.dose_weight) || 18);
                const ratioLabel = r.ratio ? r.ratio.split(' ')[0] : '1:15';
                return (
                  <button 
                    type="button" 
                    className="btn-candy primary" 
                    style={{ marginTop: '8px', width: '100%', fontSize: '10px', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectBatch(batch, { prefillRecipe: r });
                    }}
                  >
                    <Zap size={12} />
                    ⚡ Repetir Receta (#{r.id || 1} {methodLabel} • {doseLabel}g • {ratioLabel})
                  </button>
                );
              })()}
            </div>
          );
        })
      )}
    </div>
  );
}


