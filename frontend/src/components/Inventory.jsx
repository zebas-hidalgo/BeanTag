import React, { useState } from 'react';
import { Plus, Zap, Snowflake, CheckCircle2, Mountain, X, MoreHorizontal, MapPin, Flag, ClipboardList, Coffee, Flame, Search as SearchIcon, Package } from 'lucide-react';
import { RenderScaChips } from '../utils/scaIcons';
import TubeRacksView from './TubeRacksView';

export default function Inventory({ batches, onSelectBatch, onCreateTrigger, onSubtractDose, onRefreshBatches, showToast }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [inventorySubView, setInventorySubView] = useState(() => {
    try {
      const hash = window.location.hash;
      if (hash === '#racks' || hash === '#portatubos') return 'racks';
      return localStorage.getItem('beantag-inventory-subview') || 'batches';
    } catch (e) {
      return 'batches';
    }
  });

  const handleSubViewChange = (view) => {
    setInventorySubView(view);
    try {
      localStorage.setItem('beantag-inventory-subview', view);
    } catch (e) {}
  };

  const [showFinished, setShowFinished] = useState(false);

  // Quick Action Context Menu State
  const [contextBatch, setContextBatch] = useState(null);

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
    const roaster = batch.roaster || '';
    const q = (searchQuery || '').toLowerCase();
    return name.toLowerCase().includes(q) || producer.toLowerCase().includes(q) || origin.toLowerCase().includes(q) || roaster.toLowerCase().includes(q);
  });

  return (
    <div style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
      
      {/* Selector Segmentado: Lotes vs Portatubos */}
      <div style={{
        display: 'flex',
        backgroundColor: 'var(--segmented-bg, rgba(118, 118, 128, 0.12))',
        padding: '4px',
        borderRadius: 'var(--barista-radius-pill, 9999px)',
        marginBottom: '16px',
        border: '1px solid var(--barista-border-hairline, var(--border-color))'
      }}>
        <button
          type="button"
          onClick={() => handleSubViewChange('batches')}
          style={{
            flex: 1,
            padding: '8px 14px',
            borderRadius: 'var(--barista-radius-pill, 9999px)',
            border: 'none',
            backgroundColor: inventorySubView === 'batches' ? 'var(--segmented-active, #FFFFFF)' : 'transparent',
            color: inventorySubView === 'batches' ? 'var(--color-text, #0F172A)' : 'var(--barista-text-secondary, #64748B)',
            fontWeight: '800',
            fontSize: '13px',
            fontFamily: 'var(--font-heading)',
            cursor: 'pointer',
            boxShadow: inventorySubView === 'batches' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <Package size={15} />
          <span>Lotes ({availableBatches.length})</span>
        </button>

        <button
          type="button"
          onClick={() => handleSubViewChange('racks')}
          style={{
            flex: 1,
            padding: '8px 14px',
            borderRadius: 'var(--barista-radius-pill, 9999px)',
            border: 'none',
            backgroundColor: inventorySubView === 'racks' ? 'var(--segmented-active, #FFFFFF)' : 'transparent',
            color: inventorySubView === 'racks' ? 'var(--barista-accent-honey, #D97706)' : 'var(--barista-text-secondary, #64748B)',
            fontWeight: '800',
            fontSize: '13px',
            fontFamily: 'var(--font-heading)',
            cursor: 'pointer',
            boxShadow: inventorySubView === 'racks' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <Coffee size={15} color={inventorySubView === 'racks' ? 'var(--barista-accent-honey, #D97706)' : undefined} />
          <span>Portatubos (2×3)</span>
        </button>
      </div>

      {inventorySubView === 'racks' ? (
        <TubeRacksView
          batches={safeBatches}
          onSelectBatch={onSelectBatch}
          onRefreshBatches={onRefreshBatches}
          showToast={showToast}
        />
      ) : (
        <>
          {/* 1. Search Bar */}
          <div style={{ marginBottom: '12px' }}>
        <input 
          className="candy-input" 
          placeholder="Buscar café, origen, productor o variedad..." 
          aria-label="Buscar café por nombre, origen o variedad"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%', boxSizing: 'border-box', margin: 0, padding: '12px 16px', fontSize: '13.5px' }}
        />
      </div>

      {/* 2. Cupertino Segmented Status Tabs */}
      <div className="cupertino-segmented" style={{ marginBottom: '14px' }}>
        <button 
          type="button"
          className={`cupertino-segmented-btn ${!showFinished ? 'active' : ''}`}
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(8);
            setShowFinished(false);
          }}
        >
          <Snowflake size={14} strokeWidth={2.5} />
          <span>En Congelador ({availableBatches.length})</span>
        </button>
        <button 
          type="button"
          className={`cupertino-segmented-btn ${showFinished ? 'active' : ''}`}
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(8);
            setShowFinished(true);
          }}
        >
          <CheckCircle2 size={14} strokeWidth={2.5} />
          <span>Agotados ({finishedBatches.length})</span>
        </button>
      </div>

      {/* 2.1 Batch Counter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {filteredBatches.length} {filteredBatches.length === 1 ? 'Lote en bodega' : 'Lotes en bodega'}
        </span>
      </div>

      {/* 3. Empty State */}
      {filteredBatches.length === 0 ? (
        <div className="candy-card static" style={{ textAlign: 'center', padding: '40px 20px', borderStyle: 'dashed', backgroundColor: 'var(--bg-card)', borderRadius: '14px' }}>
          <div style={{ fontSize: '38px', marginBottom: '10px' }}>
            {showFinished ? <Flag size={32} /> : <Snowflake size={32} />}
          </div>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', textTransform: 'uppercase', margin: '0 0 6px 0', color: 'var(--color-text)' }}>
            {showFinished ? 'Sin cafés agotados' : 'No hay cafés en el congelador'}
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: '0 0 18px 0', lineHeight: 1.4 }}>
            {!showFinished ? 'Registra tu primer lote de tubos congelados para empezar a preparar.' : 'Los lotes cuyos tubos lleguen a 0 se moverán aquí.'}
          </p>
          {!showFinished && (
            <button className="btn-candy primary" onClick={onCreateTrigger} style={{ margin: '0 auto', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '12px' }}>
              <Plus size={16} strokeWidth={2.5} />
              Registrar Primer Lote
            </button>
          )}
        </div>
      ) : (
        /* 🏷️ ESTILO EDITORIAL (Nordic Atelier) */
        filteredBatches.map(batch => {
          const isLowStock = batch.remaining_doses <= 2 && batch.remaining_doses > 0;
          const currentWeight = parseFloat(batch.remaining_weight_g || 0);
          const hasRecipes = batch.recipes && batch.recipes.length > 0;
          const firstRecipe = hasRecipes ? batch.recipes[0] : null;

          return (
            <div 
              key={batch.id} 
              className={`card-editorial ${isLowStock ? 'low-stock' : ''}`}
              onClick={() => onSelectBatch(batch.id)}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setContextBatch(batch);
              }}
            >
              {/* Top Row: Name & Quick Action */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '3px' }}>
                    <h3 style={{ 
                      margin: 0, 
                      fontFamily: 'var(--font-heading)', 
                      fontSize: '16.5px', 
                      fontWeight: '700', 
                      lineHeight: 1.25,
                      color: 'var(--color-text)',
                      wordBreak: 'break-word'
                    }}>
                      {batch.name}
                    </h3>
                    {batch.roaster && (
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: '800',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          backgroundColor: 'var(--barista-accent-honey-bg, #FEF3C7)',
                          color: 'var(--barista-accent-honey-text, #92400E)',
                          border: '1px solid #FDE68A',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <Flame size={10} color="#D97706" />
                        {batch.roaster}
                      </span>
                    )}
                  </div>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '12px', 
                    color: 'var(--color-text-muted)', 
                    lineHeight: 1.4,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {batch.producer || 'Origen Finca'} {batch.variety ? `• ${batch.variety}` : ''} {batch.process ? `• ${batch.process}` : ''}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (navigator.vibrate) {
                      try { navigator.vibrate(8); } catch (err) {}
                    }
                    setContextBatch(batch);
                  }}
                  style={{
                    background: 'var(--barista-bg-elevated, var(--segmented-bg, rgba(120, 120, 128, 0.12)))',
                    border: '1px solid var(--barista-border-hairline, var(--border-color))',
                    borderRadius: 'var(--barista-radius-md, 12px)',
                    width: '44px',
                    height: '44px',
                    minWidth: '44px',
                    minHeight: '44px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--barista-text-primary, var(--color-text))',
                    padding: 0,
                    flexShrink: 0,
                    transition: 'all 120ms ease'
                  }}
                  title="Opciones rápidas"
                  aria-label="Opciones rápidas"
                >
                  <MoreHorizontal size={18} />
                </button>
              </div>

              {/* Origin, Altitude & Roast details */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11.5px', color: 'var(--color-text-muted)' }}>
                {batch.origin && (
                  <span style={{ fontWeight: '600', color: 'var(--color-text)' }}>
                    <MapPin size={11} strokeWidth={2.5} style={{ color: 'var(--color-crimson)', flexShrink: 0 }} /> {batch.origin}
                  </span>
                )}
                {batch.altitude && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    <Mountain size={11} color="var(--color-crimson)" /> {batch.altitude}m
                  </span>
                )}
                {batch.roast_level && (
                  <span>• {batch.roast_level}</span>
                )}
              </div>

              {/* Tasting notes chips */}
              {batch.roaster_notes ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <RenderScaChips notesStr={batch.roaster_notes} maxChips={3} />
                </div>
              ) : null}

              {/* Footer: Stock capsule + Quick Action */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                paddingTop: '8px', 
                borderTop: '1px solid var(--border-color)',
                marginTop: '2px'
              }}>
                <span style={{ 
                  fontSize: '12px', 
                  fontFamily: 'var(--font-mono)', 
                  fontWeight: '700',
                  color: isLowStock ? 'var(--barista-accent-danger, #EF4444)' : 'var(--barista-accent-cryo, #38BDF8)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  {isLowStock ? <span style={{color:'var(--barista-accent-danger)'}}>⚠</span> : <Snowflake size={12} />}{' '}
                  {batch.remaining_doses} {batch.remaining_doses === 1 ? 'tubo' : 'tubos'}
                  {currentWeight > 0 ? ` (~${currentWeight}g)` : ''}
                </span>

                {firstRecipe ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectBatch(batch, { prefillRecipe: firstRecipe });
                    }}
                    style={{
                      background: 'var(--barista-bg-elevated, rgba(188, 84, 73, 0.08))',
                      border: '1px solid var(--barista-border-hairline, transparent)',
                      borderRadius: 'var(--barista-radius-sm, 8px)',
                      color: 'var(--barista-accent-honey, var(--color-crimson))',
                      fontWeight: '700',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '6px 10px',
                      minHeight: '36px'
                    }}
                  >
                    <Zap size={14} strokeWidth={2.5} />
                    <span>Repetir {(firstRecipe.method || 'V60').replace(' (Filtrado)', '')} →</span>
                  </button>
                ) : (
                  <span style={{ 
                    fontSize: '11.5px', 
                    fontWeight: '600', 
                    color: 'var(--color-crimson)', 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '2px' 
                  }}>
                    Ver Ficha →
                  </span>
                )}
              </div>
            </div>
          );
        })
      )}
        </>
      )}

      {/* 🍎 CUPERTINO HAPTIC TOUCH CONTEXT MENU */}
      {contextBatch && (
        <div className="cupertino-context-overlay" onClick={() => setContextBatch(null)} role="dialog" aria-modal="true" aria-label={`Acciones rápidas para ${contextBatch.name}`} onKeyDown={(e) => { if (e.key === 'Escape') setContextBatch(null); }} tabIndex={-1} ref={(el) => el && el.focus()}>
          <div className="cupertino-context-menu" onClick={e => e.stopPropagation()}>
            <div style={{ padding: '14px 16px 10px 16px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-canvas)' }}>
              <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--color-crimson)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>
                Acciones Rápidas • {contextBatch.origin || 'Origen'}
              </div>
              <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {contextBatch.name}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                {contextBatch.remaining_doses} tubos restantes ({contextBatch.remaining_weight_g || 0}g)
              </div>
            </div>

            <button
              type="button"
              className="cupertino-context-item"
              onClick={() => {
                const b = contextBatch;
                setContextBatch(null);
                if (b.recipes && b.recipes.length > 0) {
                  onSelectBatch(b, { prefillRecipe: b.recipes[0] });
                } else {
                  onSelectBatch(b.id);
                }
              }}
            >
              <span><Coffee size={14} style={{marginRight:'6px',verticalAlign:'middle'}} /> Preparar / Dial-In</span>
              <Zap size={15} color="var(--color-crimson)" />
            </button>

            {contextBatch.remaining_doses > 0 && onSubtractDose && (
              <button
                type="button"
                className="cupertino-context-item"
                onClick={() => {
                  const b = contextBatch;
                  setContextBatch(null);
                  onSubtractDose(b.id, () => {
                    if (onRefreshBatches) onRefreshBatches();
                  });
                }}
              >
                <span><Snowflake size={14} style={{marginRight:'6px',verticalAlign:'middle'}} /> Restar 1 Tubo (-1)</span>
                <Snowflake size={15} color="var(--color-crimson)" />
              </button>
            )}

            <button
              type="button"
              className="cupertino-context-item"
              onClick={() => {
                const b = contextBatch;
                setContextBatch(null);
                onSelectBatch(b.id);
              }}
            >
              <span><ClipboardList size={14} style={{marginRight:'6px',verticalAlign:'middle'}} /> Ver Ficha & Compartir</span>
              <Share2 size={15} />
            </button>

            <button
              type="button"
              className="cupertino-context-item danger"
              onClick={() => setContextBatch(null)}
              aria-label="Cerrar menú de acciones"
            >
              <span>✕ Cancelar</span>
              <X size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
