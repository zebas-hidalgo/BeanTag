import React, { useState, lazy, Suspense } from 'react';
import { Plus, Zap, Snowflake, CheckCircle2, Mountain, X, MoreHorizontal, MapPin, Flag, ClipboardList, Coffee, Flame, Search as SearchIcon, Package, Share2, AlertTriangle } from 'lucide-react';
import { RenderScaChips } from '../utils/scaIcons';
import { getRoast, getDegassing, roastStyle } from '../utils/roast';

const TubeRacksView = lazy(() => import('./TubeRacksView'));

const getRoastDotColor = (roast) => {
  const r = String(roast || '').toLowerCase();
  if (r.includes('oscuro') || r.includes('dark') || r.includes('frances') || r.includes('italiano')) {
    return 'var(--ink-muted)';
  }
  if (r.includes('medio') || r.includes('medium')) {
    return 'var(--accent-strong)';
  }
  return 'var(--accent)';
};

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
      
      {/* Selector segmentado: Lotes vs Portatubos */}
      <div className="bt-seg" role="tablist" aria-label="Vista de inventario" style={{ marginBottom: '14px' }}>
        <button
          type="button"
          role="tab"
          aria-selected={inventorySubView === 'batches'}
          className={`bt-seg-btn${inventorySubView === 'batches' ? ' is-active' : ''}`}
          onClick={() => handleSubViewChange('batches')}
        >
          <Package size={16} aria-hidden="true" />
          <span>Lotes ({availableBatches.length})</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={inventorySubView === 'racks'}
          className={`bt-seg-btn${inventorySubView === 'racks' ? ' is-active' : ''}`}
          onClick={() => handleSubViewChange('racks')}
        >
          <Coffee size={16} aria-hidden="true" />
          <span>Portatubos</span>
        </button>
      </div>

      {inventorySubView === 'racks' ? (
        <Suspense fallback={<div style={{ minHeight: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="barista-spinner" /></div>}>
          <TubeRacksView
            batches={safeBatches}
            onSelectBatch={onSelectBatch}
            onRefreshBatches={onRefreshBatches}
            showToast={showToast}
          />
        </Suspense>
      ) : (
        <>
          {/* 1. Search Bar with Leading Icon & Clear Button */}
          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <SearchIcon
              size={16}
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-muted)',
                pointerEvents: 'none'
              }}
            />
            <input 
              className="candy-input" 
              placeholder="Buscar café, origen, productor o variedad..." 
              aria-label="Buscar café por nombre, origen o variedad"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                margin: 0,
                padding: searchQuery ? '0 48px 0 40px' : '0 16px 0 40px',
                minHeight: '48px',
                fontSize: '16px',
                borderRadius: 'var(--r-tile)',
                background: 'var(--surface)'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Limpiar búsqueda"
                style={{
                  position: 'absolute',
                  right: '2px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  border: 'none',
                  background: 'var(--segmented-bg)',
                  color: 'var(--color-text-muted)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* 2. Unified Counter + Compact Status Filter Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px'
          }}>
            <span style={{ fontSize: 'var(--fs-14)', fontWeight: 500, color: 'var(--ink-muted)', whiteSpace: 'nowrap' }}>
              {filteredBatches.length} {filteredBatches.length === 1 ? 'lote en cava' : 'lotes en cava'}
            </span>

            <div className="inventory-view-selector" role="tablist" aria-label="Estado de lotes">
              <button
                type="button"
                role="tab"
                aria-selected={!showFinished}
                className={`inventory-view-btn ${!showFinished ? 'active' : ''}`}
                onClick={() => {
                  if (navigator.vibrate) {
                    try { navigator.vibrate(8); } catch (e) {}
                  }
                  setShowFinished(false);
                }}
              >
                <Snowflake size={12} strokeWidth={2.3} />
                <span>Congelador ({availableBatches.length})</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={showFinished}
                className={`inventory-view-btn ${showFinished ? 'active' : ''}`}
                onClick={() => {
                  if (navigator.vibrate) {
                    try { navigator.vibrate(8); } catch (e) {}
                  }
                  setShowFinished(true);
                }}
              >
                <CheckCircle2 size={12} strokeWidth={2.3} />
                <span>Agotados ({finishedBatches.length})</span>
              </button>
            </div>
          </div>

          {/* 3. Empty State */}
          {filteredBatches.length === 0 ? (
            <div className="candy-card static" style={{ textAlign: 'center', padding: '40px 20px', borderStyle: 'dashed', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--r-tile)' }}>
              <div style={{ fontSize: '38px', marginBottom: '10px', color: 'var(--color-text-muted)' }}>
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
            /* 🏷️ ESTILO EDITORIAL (Nordic Atelier & Precision Lab) */
            filteredBatches.map(batch => {
              const isLowStock = batch.remaining_doses <= 2 && batch.remaining_doses > 0;
              const currentWeight = parseFloat(batch.remaining_weight_g || 0);
              const hasRecipes = batch.recipes && batch.recipes.length > 0;
              const firstRecipe = hasRecipes ? batch.recipes[0] : null;
              const roast = getRoast(batch.roast_level);
              const degas = getDegassing(batch);
              const degasTone = degas ? (degas.frozen ? 'cryo' : degas.status === 'late' ? 'warn' : degas.status === 'ideal' ? 'ok' : '') : '';
              const metaParts = [batch.origin, batch.process].filter(Boolean);

              return (
                <article
                  key={batch.id}
                  className={`bt-batch${isLowStock ? ' is-low' : ''}`}
                  style={roastStyle(batch.roast_level)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setContextBatch(batch);
                  }}
                >
                  <button
                    type="button"
                    className="bt-batch-main"
                    onClick={() => onSelectBatch(batch.id)}
                    aria-label={batch.storage_type === 'bag' 
                      ? `${batch.name}, tueste ${roast.label.toLowerCase()}, bolsa con ${Math.round(currentWeight)}g`
                      : `${batch.name}, tueste ${roast.label.toLowerCase()}, ${batch.remaining_doses} ${batch.remaining_doses === 1 ? 'tubo' : 'tubos'}`}
                  >
                    <span className="bt-swatch" title={`Tueste ${roast.label}`} aria-hidden="true">
                      <Flame size={18} strokeWidth={2.4} />
                    </span>
                    <span className="bt-batch-text">
                      <span className="bt-batch-name">{batch.name}</span>
                      <span className="bt-batch-meta">
                        {metaParts.length > 0 && <MapPin size={12} strokeWidth={2} aria-hidden="true" />}
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {metaParts.length ? metaParts.join(' · ') : (batch.producer || batch.roaster || 'Sin origen')}
                        </span>
                      </span>
                    </span>
                    {batch.storage_type === 'bag' ? (
                      <span className="bt-doses" aria-hidden="true">
                        <b>{Math.round(currentWeight)}<small style={{ fontSize: '11px', fontWeight: 600, marginLeft: '1px' }}>g</small></b>
                        <small>Bolsa · ~{batch.remaining_doses} {batch.remaining_doses === 1 ? 'taza' : 'tazas'}</small>
                      </span>
                    ) : (
                      <span className="bt-doses" aria-hidden="true">
                        <b>{batch.remaining_doses}</b>
                        <small>{batch.remaining_doses === 1 ? 'tubo' : 'tubos'}{currentWeight > 0 ? ` · ${currentWeight} g` : ''}</small>
                      </span>
                    )}
                  </button>

                  {degas && (
                    <div className="bt-degas">
                      <div className="bt-degas-label">
                        <span className={degasTone ? `is-${degasTone}` : undefined}>{degas.label}</span>
                        <span>ventana 7–21 d</span>
                      </div>
                      <div className="bt-track" aria-hidden="true">
                        <span className="bt-track-win" style={{ left: `${degas.winFrom}%`, width: `${degas.winTo - degas.winFrom}%` }} />
                        <span className={`bt-track-dot${degasTone === 'warn' ? ' is-warn' : degasTone === 'cryo' ? ' is-cryo' : ''}`} style={{ left: `${degas.pos}%` }} />
                      </div>
                    </div>
                  )}

                  <div className="bt-batch-foot">
                    {batch.roaster_notes ? (
                      <RenderScaChips notesStr={batch.roaster_notes} maxChips={3} />
                    ) : (
                      <span className="bt-batch-meta" style={{ color: isLowStock ? 'var(--warn-text)' : undefined }}>
                        {isLowStock && <AlertTriangle size={12} aria-hidden="true" />}
                        {isLowStock ? (batch.storage_type === 'bag' ? 'Poco café en bolsa' : 'Quedan pocos tubos') : (batch.roaster || '')}
                      </span>
                    )}
                    <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto' }}>
                      {firstRecipe && (
                        <button
                          type="button"
                          className="bt-link-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectBatch(batch, { prefillRecipe: firstRecipe });
                          }}
                        >
                          <Zap size={14} aria-hidden="true" />
                          <span>Repetir {(firstRecipe.method || 'V60').replace(' (Filtrado)', '')}</span>
                        </button>
                      )}
                      <button
                        type="button"
                        className="bt-icon-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (navigator.vibrate) {
                            try { navigator.vibrate(8); } catch (err) {}
                          }
                          setContextBatch(batch);
                        }}
                        title="Opciones rápidas"
                        aria-label={`Opciones rápidas de ${batch.name}`}
                      >
                        <MoreHorizontal size={18} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
          {filteredBatches.length > 0 && <div className="bt-batch-list-end" aria-hidden="true" />}
        </>
      )}

      {/* 🍎 CUPERTINO HAPTIC TOUCH CONTEXT MENU */}
      {contextBatch && (
        <div className="cupertino-context-overlay" onClick={() => setContextBatch(null)} role="dialog" aria-modal="true" aria-label={`Acciones rápidas para ${contextBatch.name}`} onKeyDown={(e) => { if (e.key === 'Escape') setContextBatch(null); }} tabIndex={-1} ref={(el) => el && el.focus()}>
          <div className="cupertino-context-menu" onClick={e => e.stopPropagation()}>
            <div style={{ padding: '14px 16px 10px 16px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-canvas)' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-crimson)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>
                Acciones Rápidas • {contextBatch.origin || 'Origen'}
              </div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {contextBatch.name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                {contextBatch.storage_type === 'bag'
                  ? `Bolsa: ${Math.round(contextBatch.remaining_weight_g || 0)}g restantes (~${contextBatch.remaining_doses} tazas)`
                  : `${contextBatch.remaining_doses} tubos restantes (${Math.round(contextBatch.remaining_weight_g || 0)}g)`}
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
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><X size={14} /> Cancelar</span>
              <X size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
