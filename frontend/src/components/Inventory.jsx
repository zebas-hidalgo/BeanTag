import React, { useState } from 'react';
import { RenderScaChips } from '../utils/scaIcons';
import { Plus, Zap, Grid, List, Coffee, Snowflake, CheckCircle2, ChevronRight } from 'lucide-react';

export default function Inventory({ batches, onSelectBatch, onCreateTrigger }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'frozen' | 'finished'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'compact'

  // Tab filtering logic
  const tabFilteredBatches = (batches || []).filter(batch => {
    if (!batch) return false;
    const isFinished = (batch.remaining_doses || 0) <= 0 || (batch.remaining_weight_g || 0) <= 0;
    const isFrozen = !!batch.freeze_date;

    if (activeTab === 'finished') return isFinished;
    if (isFinished) return false; // Hide finished from active & frozen tabs

    if (activeTab === 'frozen') return isFrozen;
    if (activeTab === 'active') return !isFrozen;
    return true;
  });

  // Search filtering logic
  const filteredBatches = tabFilteredBatches.filter(batch => {
    const name = batch.name || '';
    const producer = batch.producer || '';
    const origin = batch.origin || '';
    const q = searchQuery.toLowerCase();
    return name.toLowerCase().includes(q) || producer.toLowerCase().includes(q) || origin.toLowerCase().includes(q);
  });

  // Counts for tabs
  const activeCount = (batches || []).filter(b => b && (b.remaining_doses || 0) > 0 && !b.freeze_date).length;
  const frozenCount = (batches || []).filter(b => b && (b.remaining_doses || 0) > 0 && !!b.freeze_date).length;
  const finishedCount = (batches || []).filter(b => b && (b.remaining_doses || 0) <= 0).length;

  return (
    <div style={{ padding: '12px 12px 0 12px' }}>
      
      {/* 1. Header Control Bar: Search + View Switcher */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
        <input 
          className="candy-input" 
          placeholder="Buscar por café, origen o productor..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1, margin: 0 }}
        />
        
        {/* Toggle Grid vs Compact Minimalist View */}
        <div style={{ display: 'flex', border: '2px solid #000000', borderRadius: '8px', overflow: 'hidden', boxShadow: '2px 2px 0px #000000' }}>
          <button 
            type="button"
            title="Vista Tarjetas (Detallada)"
            onClick={() => setViewMode('grid')}
            style={{ 
              padding: '8px 10px', 
              border: 'none', 
              backgroundColor: viewMode === 'grid' ? '#000000' : 'var(--bg-card)', 
              color: viewMode === 'grid' ? '#FFFFFF' : 'var(--color-text)', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Grid size={15} strokeWidth={2.5} />
          </button>
          <button 
            type="button"
            title="Vista Lista (Minimalista)"
            onClick={() => setViewMode('compact')}
            style={{ 
              padding: '8px 10px', 
              border: 'none', 
              borderLeft: '1.5px solid #000000',
              backgroundColor: viewMode === 'compact' ? '#000000' : 'var(--bg-card)', 
              color: viewMode === 'compact' ? '#FFFFFF' : 'var(--color-text)', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <List size={15} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* 2. Organized Inventory Filter Tabs */}
      <div className="canvas-tab-selector" style={{ marginBottom: '14px' }}>
        <button 
          className={`canvas-tab-btn ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          <Coffee size={13} strokeWidth={2.5} />
          En Barra ({activeCount})
        </button>
        <button 
          className={`canvas-tab-btn ${activeTab === 'frozen' ? 'active' : ''}`}
          onClick={() => setActiveTab('frozen')}
        >
          <Snowflake size={13} strokeWidth={2.5} />
          Congelador ({frozenCount})
        </button>
        <button 
          className={`canvas-tab-btn ${activeTab === 'finished' ? 'active' : ''}`}
          onClick={() => setActiveTab('finished')}
        >
          <CheckCircle2 size={13} strokeWidth={2.5} />
          Agotados ({finishedCount})
        </button>
      </div>

      {/* 3. Empty State */}
      {filteredBatches.length === 0 ? (
        <div className="candy-card static" style={{ textAlign: 'center', padding: '36px 20px', borderStyle: 'dashed', backgroundColor: 'var(--bg-card)' }}>
          <div style={{ fontSize: '36px', marginBottom: '10px' }}>
            {activeTab === 'frozen' ? '❄️' : (activeTab === 'finished' ? '🏁' : '☕')}
          </div>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '14px', textTransform: 'uppercase', margin: '0 0 6px 0', color: 'var(--color-text)' }}>
            {activeTab === 'frozen' ? 'Sin cafés en el congelador' : (activeTab === 'finished' ? 'Sin cafés agotados' : 'No hay cafés en barra')}
          </h3>
          <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: '0 0 16px 0', lineHeight: 1.4 }}>
            {activeTab === 'active' ? 'Registra tu primer café especial para seguir dosis, tueste y recetas.' : 'Los cafés filtrados por esta pestaña aparecerán aquí.'}
          </p>
          {activeTab === 'active' && (
            <button className="btn-candy primary" onClick={onCreateTrigger} style={{ margin: '0 auto', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}>
              <Plus size={16} strokeWidth={2.5} />
              Registrar Primer Lote
            </button>
          )}
        </div>
      ) : (

        /* 4. COMPACT MINIMALIST LIST VIEW MODE */
        viewMode === 'compact' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {filteredBatches.map(batch => {
              const isLowStock = batch.remaining_doses <= 2 && batch.remaining_doses > 0;
              const currentWeight = parseFloat(batch.remaining_weight_g || 0);
              return (
                <div 
                  key={batch.id}
                  onClick={() => onSelectBatch(batch.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'space-between',
                    padding: '10px 12px',
                    backgroundColor: 'var(--bg-card)',
                    border: '2px solid #000000',
                    borderRadius: '8px',
                    boxShadow: '2px 2px 0px #000000',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  className="btn-candy"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '6px', 
                      backgroundColor: isLowStock ? '#FEE2E2' : 'var(--bg-header)', 
                      border: '1.5px solid #000000',
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'center',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      flexShrink: 0
                    }}>
                      {batch.freeze_date ? '❄️' : '☕'}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: '12px', fontWeight: '800', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--color-text)' }}>
                        {batch.name}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {batch.producer} • {batch.origin || 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <span className="mono-lbl-tag" style={{ fontSize: '10px', padding: '2px 6px' }}>
                      {batch.remaining_doses} Tubos ({currentWeight}g)
                    </span>
                    <ChevronRight size={16} strokeWidth={2.5} color="var(--color-text-muted)" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (

          /* 5. BENTO CARDS DETAILED VIEW MODE */
          filteredBatches.map(batch => {
            const isLowStock = batch.remaining_doses <= 2 && batch.remaining_doses > 0;
            const hasRecipes = batch.recipes && batch.recipes.length > 0;

            // Weight progress calculations
            const currentWeight = parseFloat(batch.remaining_weight_g || 0);
            const totalWeight = parseFloat(batch.total_weight_g || (batch.total_doses * (parseFloat(batch.dose_weight) || 20)) || 250);
            const weightPct = Math.min(100, Math.max(0, Math.round((currentWeight / totalWeight) * 100)));
            const fillClass = weightPct > 50 ? 'fill-high' : (weightPct > 20 ? 'fill-mid' : 'fill-low');

            // Roast Freshness Peak meter calculation
            let freshnessBadge = null;
            if (!batch.freeze_date && batch.roast_date) {
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
                style={{ marginBottom: '12px' }}
              >
                <div className="card-header-flex">
                  <div>
                    <h3 className="card-title">{batch.name}</h3>
                    <p className="card-sub">{batch.producer} {batch.variety ? `• ${batch.variety}` : ''}</p>
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
                  <span className="mono-lbl-tag outline">{batch.remaining_doses} Tubos</span>
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
        )
      )}
    </div>
  );
}
