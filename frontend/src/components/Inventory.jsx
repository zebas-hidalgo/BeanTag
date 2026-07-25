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

          // Degas status
          let degasBadge = null;
          if (batch.roast_date) {
            const rDate = new Date(batch.roast_date);
            const today = new Date();
            const days = Math.floor((today - rDate) / (1000 * 60 * 60 * 24));
            if (!isNaN(days) && days >= 0) {
              if (days < 7) {
                degasBadge = { label: `🟢 ${days}d reposo`, bg: '#FEF9C3', color: '#713F12' };
              } else if (days <= 30) {
                degasBadge = { label: `⚡ ${days}d óptimo`, bg: '#DCFCE7', color: '#14532D' };
              } else {
                degasBadge = { label: `⚠️ ${days}d antiguo`, bg: '#FEE2E2', color: '#7F1D1D' };
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
                  {degasBadge && (
                    <span style={{ fontSize: '9px', fontWeight: '800', backgroundColor: degasBadge.bg, color: degasBadge.color, padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {degasBadge.label}
                    </span>
                  )}
                </div>
              </div>
              <RenderScaChips notesStr={batch.roaster_notes || batch.notes} />
              <div className="mono-badge-row">
                <span className="mono-lbl-tag outline">{batch.remaining_doses} Dosis ({batch.remaining_weight_g || 0}g)</span>
                <span className="mono-lbl-tag outline">{batch.roast_level || 'Medio'}</span>
                {isLowStock && <span className="mono-lbl-tag low-stock">¡Últimos tubos!</span>}
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


