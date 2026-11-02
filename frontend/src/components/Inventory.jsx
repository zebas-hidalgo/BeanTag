import React, { useState, lazy, Suspense } from 'react';
import { Plus, Zap, Play, Snowflake, CheckCircle2, Mountain, X, MoreHorizontal, MapPin, Flag, ClipboardList, Coffee, Flame, Search as SearchIcon, Package, Share2, AlertTriangle } from 'lucide-react';
import { getRoast, getDegassing, roastStyle } from '../utils/roast';

const TubeRacksView = lazy(() => import('./TubeRacksView'));

export default function Inventory({ batches, currentUser, onRequireAuth, onSelectBatch, onCreateTrigger, onSubtractDose, onRefreshBatches, showToast }) {
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

  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'bags' | 'tubes' | 'finished'
  const showFinished = filterMode === 'finished';

  // Quick Action Context Menu State
  const [contextBatch, setContextBatch] = useState(null);

  const safeBatches = Array.isArray(batches) ? batches : [];

  const isBatchAvailable = (b) => b && (b.storage_type === 'bag'
    ? (parseFloat(b.remaining_weight_g) > 0 || (b.remaining_doses || 0) > 0)
    : (b.remaining_doses || 0) > 0);

  // Filter available vs finished batches
  const availableBatches = safeBatches.filter(isBatchAvailable);
  const bagBatches = availableBatches.filter(b => b.storage_type === 'bag');
  const tubeBatches = availableBatches.filter(b => b.storage_type !== 'bag');
  const finishedBatches = safeBatches.filter(b => b && !isBatchAvailable(b));

  const currentList = filterMode === 'finished'
    ? finishedBatches
    : filterMode === 'bags'
      ? bagBatches
      : filterMode === 'tubes'
        ? tubeBatches
        : availableBatches;

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
            currentUser={currentUser}
            onRequireAuth={onRequireAuth}
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
            marginBottom: '12px',
            flexWrap: 'wrap'
          }}>
            <span style={{ fontSize: 'var(--fs-14)', fontWeight: 500, color: 'var(--ink-muted)', whiteSpace: 'nowrap' }}>
              {filteredBatches.length} {filteredBatches.length === 1 ? 'lote en cava' : 'lotes en cava'}
            </span>

            <div className="inventory-view-selector" role="tablist" aria-label="Estado de lotes" style={{ flexWrap: 'wrap' }}>
              <button
                type="button"
                role="tab"
                aria-selected={filterMode === 'all'}
                className={`inventory-view-btn ${filterMode === 'all' ? 'active' : ''}`}
                onClick={() => setFilterMode('all')}
              >
                <Snowflake size={12} strokeWidth={2.3} />
                <span>Disponibles ({availableBatches.length})</span>
              </button>
              {bagBatches.length > 0 && tubeBatches.length > 0 && (
                <>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={filterMode === 'bags'}
                    className={`inventory-view-btn ${filterMode === 'bags' ? 'active' : ''}`}
                    onClick={() => setFilterMode('bags')}
                  >
                    <Coffee size={12} strokeWidth={2.3} />
                    <span>Bolsas ({bagBatches.length})</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={filterMode === 'tubes'}
                    className={`inventory-view-btn ${filterMode === 'tubes' ? 'active' : ''}`}
                    onClick={() => setFilterMode('tubes')}
                  >
                    <Package size={12} strokeWidth={2.3} />
                    <span>Tubos ({tubeBatches.length})</span>
                  </button>
                </>
              )}
              <button
                type="button"
                role="tab"
                aria-selected={filterMode === 'finished'}
                className={`inventory-view-btn ${filterMode === 'finished' ? 'active' : ''}`}
                onClick={() => setFilterMode('finished')}
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
                {!currentUser
                  ? 'Inicia sesión para ver tu cava'
                  : (showFinished ? 'Sin cafés agotados' : 'No hay cafés en tu inventario')}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: '0 0 18px 0', lineHeight: 1.4 }}>
                {!currentUser
                  ? 'Tus cafés, bolsas, tubos y recetas están vinculados de forma privada a tu cuenta.'
                  : (!showFinished ? 'Registra tu primer lote en tubos o bolsa para empezar a preparar.' : 'Los lotes cuyas dosis o gramos lleguen a 0 se moverán aquí.')}
              </p>
              {!showFinished && (
                <button
                  className="btn-candy primary"
                  onClick={!currentUser && onRequireAuth ? onRequireAuth : onCreateTrigger}
                  style={{ margin: '0 auto', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '12px' }}
                >
                  <Plus size={16} strokeWidth={2.5} />
                  {!currentUser ? 'Iniciar Sesión / Crear Cuenta' : 'Registrar Primer Lote'}
                </button>
              )}
            </div>
          ) : (
            /* 🏷️ ESTILO EDITORIAL (Nordic Atelier & Precision Lab) */
            filteredBatches.map(batch => {
              const isBag = batch.storage_type === 'bag';
              const isLowStock = batch.remaining_doses <= 2 && batch.remaining_doses > 0;
              const grams = Math.round(parseFloat(batch.remaining_weight_g || 0));
              const firstRecipe = batch.recipes && batch.recipes.length > 0 ? batch.recipes[0] : null;
              const roast = getRoast(batch.roast_level);
              const rest = getDegassing(batch);
              const place = batch.origin || batch.producer || batch.roaster || '';
              const stockLabel = isBag
                ? `bolsa con ${grams} g`
                : `${batch.remaining_doses} ${batch.remaining_doses === 1 ? 'tubo' : 'tubos'}`;

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
                    aria-label={`${batch.name}, tueste ${roast.label.toLowerCase()}, ${stockLabel}`}
                  >
                    <span className="bt-batch-text">
                      <span className="bt-batch-name">{batch.name}</span>
                      <span className="bt-batch-meta">
                        <span className="bt-roast-dot" aria-hidden="true" />
                        <span>{roast.label}{place ? ` · ${place}` : ''}</span>
                      </span>
                    </span>
                    <span className="bt-doses" aria-hidden="true">
                      {isBag ? <b>{grams}<small> g</small></b> : <b>{batch.remaining_doses}</b>}
                      <small>{isBag ? 'en bolsa' : (batch.remaining_doses === 1 ? 'tubo' : 'tubos')}</small>
                    </span>
                  </button>

                  <div className="bt-batch-foot">
                    {isLowStock ? (
                      <span className="bt-status is-warn">{isBag ? 'Queda poco' : 'Quedan pocos'}</span>
                    ) : rest ? (
                      <span className={`bt-status${rest.tone ? ` is-${rest.tone}` : ''}`}>{rest.word}</span>
                    ) : <span />}
                    <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto' }}>
                      {firstRecipe && (
                        <button
                          type="button"
                          className="bt-link-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectBatch(batch, { prefillRecipe: firstRecipe, autoStart: true });
                          }}
                        >
                          <Play size={14} fill="currentColor" aria-hidden="true" />
                          <span>Preparar {(firstRecipe.method || 'V60').replace(' (Filtrado)', '')}</span>
                        </button>
                      )}
                      <button
                        type="button"
                        className="bt-icon-btn"
                        onClick={(e) => {
                          e.stopPropagation();
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

            {isBatchAvailable(contextBatch) && onSubtractDose && (
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
                <span>
                  {contextBatch.storage_type === 'bag'
                    ? <><Coffee size={14} style={{marginRight:'6px',verticalAlign:'middle'}} /> Restar 1 Dosis (~{Math.round(parseFloat(contextBatch.dose_weight) || 18)}g)</>
                    : <><Snowflake size={14} style={{marginRight:'6px',verticalAlign:'middle'}} /> Restar 1 Tubo (-1)</>}
                </span>
                {contextBatch.storage_type === 'bag'
                  ? <Coffee size={15} color="var(--color-crimson)" />
                  : <Snowflake size={15} color="var(--color-crimson)" />}
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
