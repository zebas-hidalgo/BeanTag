import React, { useState } from 'react';
import { Plus, Zap, Snowflake, CheckCircle2, Mountain } from 'lucide-react';
import { RenderScaChips } from '../utils/scaIcons';

export default function Inventory({ batches, onSelectBatch, onCreateTrigger }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFinished, setShowFinished] = useState(false);

  const safeBatches = Array.isArray(batches) ? batches : [];

  // Filter available vs finished batches
  const availableBatches = safeBatches.filter(b => b && (b.remaining_doses || 0) > 0);
  const finishedBatches = safeBatches.filter(b => b && (b.remaining_doses || 0) <= 0);

  const currentList = showFinished ? finishedBatches : availableBatches;

  // Search filter
  const filteredBatches = (Array.isArray(currentList) ? currentList : []).filter(batch => {
    if (!batch) return false;
    const name = batch.name || '';
    const producer = batch.producer || '';
    const origin = batch.origin || '';
    const q = (searchQuery || '').toLowerCase();
    return name.toLowerCase().includes(q) || producer.toLowerCase().includes(q) || origin.toLowerCase().includes(q);
  });

  return (
    <div style={{ padding: '12px 12px 0 12px' }}>
      
      {/* 1. Search Bar + Filter Toggle */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
        <input 
          className="candy-input" 
          placeholder="Buscar por café, origen o productor..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1, margin: 0 }}
        />
      </div>

      {/* 2. Simple & Clean Status Tabs */}
      <div className="canvas-tab-selector" style={{ marginBottom: '14px' }}>
        <button 
          className={`canvas-tab-btn ${!showFinished ? 'active' : ''}`}
          onClick={() => setShowFinished(false)}
        >
          <Snowflake size={14} strokeWidth={2.5} />
          Cafés en Congelador ({availableBatches.length})
        </button>
        <button 
          className={`canvas-tab-btn ${showFinished ? 'active' : ''}`}
          onClick={() => setShowFinished(true)}
        >
          <CheckCircle2 size={14} strokeWidth={2.5} />
          Agotados ({finishedBatches.length})
        </button>
      </div>

      {/* 3. Empty State */}
      {filteredBatches.length === 0 ? (
        <div className="candy-card static" style={{ textAlign: 'center', padding: '36px 20px', borderStyle: 'dashed', backgroundColor: 'var(--bg-card)' }}>
          <div style={{ fontSize: '36px', marginBottom: '10px' }}>
            {showFinished ? '🏁' : '❄️'}
          </div>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '14px', textTransform: 'uppercase', margin: '0 0 6px 0', color: 'var(--color-text)' }}>
            {showFinished ? 'Sin cafés agotados' : 'No hay cafés en el congelador'}
          </h3>
          <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: '0 0 16px 0', lineHeight: 1.4 }}>
            {!showFinished ? 'Registra tu primer lote de tubos congelados para empezar a preparar.' : 'Los lotes cuyos tubos lleguen a 0 se moverán aquí.'}
          </p>
          {!showFinished && (
            <button className="btn-candy primary" onClick={onCreateTrigger} style={{ margin: '0 auto', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}>
              <Plus size={16} strokeWidth={2.5} />
              Registrar Primer Lote
            </button>
          )}
        </div>
      ) : (

        /* 4. PERFECTLY ALIGNED BENTO CARDS LIST */
        filteredBatches.map(batch => {
          const isLowStock = batch.remaining_doses <= 2 && batch.remaining_doses > 0;
          const hasRecipes = batch.recipes && batch.recipes.length > 0;

          // Weight progress calculations
          const currentWeight = parseFloat(batch.remaining_weight_g || 0);
          const totalWeight = parseFloat(batch.total_weight_g || (batch.total_doses * (parseFloat(batch.dose_weight) || 20)) || 250);
          const weightPct = Math.min(100, Math.max(0, Math.round((currentWeight / totalWeight) * 100)));
          const fillClass = weightPct > 50 ? 'fill-high' : (weightPct > 20 ? 'fill-mid' : 'fill-low');

          return (
            <div 
              key={batch.id} 
              className={`candy-card ${isLowStock ? 'low-stock' : ''}`}
              onClick={() => onSelectBatch(batch.id)}
              style={{ marginBottom: '12px', padding: '14px' }}
            >
              {/* Perfectly Aligned Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '10px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 className="card-title" style={{ margin: '0 0 2px 0', fontSize: '15px', wordBreak: 'break-word' }}>
                    {batch.name}
                  </h3>
                  <p className="card-sub" style={{ margin: '0 0 4px 0', fontSize: '11px' }}>
                    {batch.producer} {batch.variety ? `• ${batch.variety}` : ''}
                  </p>
                  <RenderScaChips notesStr={batch.roaster_notes} maxChips={3} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                  <span className="mono-lbl-tag" style={{ fontSize: '10.5px' }}>
                    {batch.origin || 'N/A'}
                  </span>
                  {batch.altitude && (
                    <span style={{ fontSize: '9.5px', color: 'var(--color-crimson)', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <Mountain size={10} /> {batch.altitude}
                    </span>
                  )}
                  {isLowStock && (
                    <span className="mono-lbl-tag low-stock" style={{ fontSize: '9px', padding: '2px 5px' }}>
                      ¡Últimos tubos!
                    </span>
                  )}
                </div>
              </div>
              
              {/* Liquid Weight Progress Bar */}
              <div className="weight-progress-container" style={{ margin: '8px 0 6px 0' }}>
                <div className="weight-progress-header">
                  <span style={{ fontSize: '9.5px', fontWeight: '800' }}>STOCK EN CONGELADOR</span>
                  <span style={{ fontSize: '10px', fontWeight: '800', fontFamily: 'var(--font-mono)' }}>
                    {batch.remaining_doses} Tubos ({currentWeight}g / {totalWeight}g)
                  </span>
                </div>
                <div className="weight-progress-track">
                  <div className={`weight-progress-fill ${fillClass}`} style={{ width: `${weightPct}%` }} />
                </div>
              </div>

              {/* Quick Repeat Recipe Button */}
              {hasRecipes && (() => {
                const r = batch.recipes[0];
                const methodLabel = (r.method || 'V60').replace(' (Filtrado)', '');
                const doseLabel = (r.dose_in_g !== null && r.dose_in_g !== undefined) ? r.dose_in_g : (parseFloat(batch.dose_weight) || 18);
                const ratioLabel = r.ratio ? r.ratio.split(' ')[0] : '1:15';
                return (
                  <button 
                    type="button" 
                    className="btn-candy primary" 
                    style={{ 
                      marginTop: '10px', 
                      width: '100%', 
                      fontSize: '10.5px', 
                      padding: '8px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justify: 'center', 
                      gap: '5px' 
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectBatch(batch, { prefillRecipe: r });
                    }}
                  >
                    <Zap size={13} strokeWidth={2.5} />
                    ⚡ Repetir Receta ({methodLabel} • {doseLabel}g • {ratioLabel})
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
