import React from 'react';
import { Plus, Coffee, MoreVertical, Trash2, Edit3, Layers, Check, X, RefreshCw, AlertCircle, ArrowRight, Zap, Snowflake, FlaskConical } from 'lucide-react';

// Modals of the tube racks screen, moved out of TubeRacksView unchanged.

export function NewRackModal({ handleCreateRack, newRackName, setNewRackName, setShowCreateModal, showCreateModal }) {
  return (
    <>
      {/* Modal: New Rack */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 'var(--z-sticky-cta)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)'
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowCreateModal(false); }}
        >
          <div
            role="dialog"
            aria-modal="true"
            style={{
              width: '100%',
              maxWidth: '440px',
              backgroundColor: 'var(--barista-bg-surface)',
              borderRadius: 'var(--barista-radius-lg)',
              border: '2px solid var(--barista-border-hairline)',
              boxShadow: 'var(--barista-shadow-elevated)',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid var(--barista-border-hairline)',
                backgroundColor: 'var(--barista-bg-elevated)'
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: '16px',
                  fontWeight: '600',
                  fontFamily: 'var(--font-heading)',
                  color: 'var(--color-text)'
                }}
              >
                Nuevo portatubos (2×3)
              </h3>
              <button aria-label="Cerrar"
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--barista-text-secondary)'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateRack} style={{ padding: '20px' }}>
              <label htmlFor="bt-tuberacksview-1"
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '700',
                  marginBottom: '8px',
                  color: 'var(--color-text)'
                }}
              >
                Nombre o ubicación
              </label>
              <input id="bt-tuberacksview-1" aria-label="Nombre o ubicación"
                type="text"
                autoFocus
                placeholder="Ej. Rack Barra Espresso, Rack Congelador..."
                value={newRackName}
                onChange={(e) => setNewRackName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 'var(--barista-radius-md)',
                  border: '2px solid var(--barista-border-hairline)',
                  backgroundColor: 'var(--barista-bg-elevated)',
                  color: 'var(--color-text)',
                  fontSize: '14px',
                  fontWeight: '600',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'var(--font-body)'
                }}
              />
              <p
                style={{
                  margin: '8px 0 20px 0',
                  fontSize: '12px',
                  color: 'var(--barista-text-secondary)'
                }}
              >
                El portatubos se inicializará automáticamente con 6 ranuras numeradas del 1 al 6.
              </p>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 'var(--barista-radius-md)',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--barista-border-hairline)',
                    color: 'var(--barista-text-secondary)',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newRackName.trim()}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 'var(--barista-radius-md)',
                    backgroundColor: 'var(--barista-accent-honey)',
                    color: 'var(--on-accent)',
                    border: 'none',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Crear portatubos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export function RenameRackModal({ editingRack, handleRenameRack, setEditingRack }) {
  return (
    <>
      {/* Modal: Rename Rack */}
      {editingRack && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 'var(--z-sticky-cta)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)'
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setEditingRack(null); }}
        >
          <div
            role="dialog"
            aria-modal="true"
            style={{
              width: '100%',
              maxWidth: '440px',
              backgroundColor: 'var(--barista-bg-surface)',
              borderRadius: 'var(--barista-radius-lg)',
              border: '2px solid var(--barista-border-hairline)',
              padding: '20px'
            }}
          >
            <h3
              style={{
                margin: '0 0 12px 0',
                fontSize: '16px',
                fontWeight: '600',
                fontFamily: 'var(--font-heading)',
                color: 'var(--color-text)'
              }}
            >
              Renombrar portatubos
            </h3>
            <form onSubmit={handleRenameRack}>
              <input
                type="text"
                autoFocus
                value={editingRack.name}
                onChange={(e) => setEditingRack({ ...editingRack, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 'var(--barista-radius-md)',
                  border: '2px solid var(--barista-border-hairline)',
                  backgroundColor: 'var(--barista-bg-elevated)',
                  color: 'var(--color-text)',
                  fontSize: '14px',
                  fontWeight: '600',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setEditingRack(null)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 'var(--r-control)',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--barista-border-hairline)',
                    color: 'var(--barista-text-secondary)'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--r-control)',
                    backgroundColor: 'var(--barista-accent-honey)',
                    color: 'var(--on-accent)',
                    border: 'none',
                    fontWeight: '700'
                  }}
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export function TubeActionsModal({ actionTarget, batches, handleClearSlot, handleConsumeTube, onSelectBatch, setActionTarget }) {
  return (
    <>
      {/* Modal: Filled Tube Quick Actions */}
      {actionTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 'var(--z-sticky-cta)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)'
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setActionTarget(null); }}
        >
          <div
            role="dialog"
            aria-modal="true"
            style={{
              width: '100%',
              maxWidth: '460px',
              backgroundColor: 'var(--barista-bg-surface)',
              borderRadius: 'var(--barista-radius-lg)',
              border: '2px solid var(--barista-border-hairline)',
              boxShadow: 'var(--barista-shadow-elevated)',
              overflow: 'hidden',
              animation: 'fadeInScale 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid var(--barista-border-hairline)',
                backgroundColor: 'var(--barista-bg-elevated)'
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--barista-accent-honey)'
                  }}
                >
                  Tubo #{actionTarget.slot.position} • {actionTarget.rack.name}
                </span>
                <h3
                  style={{
                    margin: '2px 0 0 0',
                    fontSize: '18px',
                    fontWeight: '700',
                    fontFamily: 'var(--font-heading)',
                    color: 'var(--color-text)'
                  }}
                >
                  {actionTarget.slot.batch_name || (actionTarget.batch && actionTarget.batch.name)}
                </h3>
              </div>
              <button aria-label="Cerrar"
                type="button"
                onClick={() => setActionTarget(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '6px',
                  color: 'var(--barista-text-secondary)'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Details */}
            <div style={{ padding: '20px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '10px',
                  padding: '12px',
                  backgroundColor: 'var(--barista-bg-elevated)',
                  borderRadius: 'var(--barista-radius-md)',
                  marginBottom: '20px',
                  border: '1px solid var(--barista-border-hairline)'
                }}
              >
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--barista-text-muted)', display: 'block' }}>Tostador:</span>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-text)' }}>
                    {actionTarget.slot.roaster || (actionTarget.batch && actionTarget.batch.roaster) || 'N/A'}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--barista-text-muted)', display: 'block' }}>Origen:</span>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-text)' }}>
                    {actionTarget.slot.origin || (actionTarget.batch && actionTarget.batch.origin) || 'N/A'}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--barista-text-muted)', display: 'block' }}>Dosis tubo:</span>
                  <span style={{ fontSize: '13px', fontWeight: '700', fontFamily: 'var(--font-mono)', color: 'var(--barista-accent-cryo)' }}>
                    {actionTarget.slot.dose_weight || (actionTarget.batch && actionTarget.batch.dose_weight) || '20.0g'}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--barista-text-muted)', display: 'block' }}>Stock en Lote:</span>
                  <span style={{ fontSize: '13px', fontWeight: '700', fontFamily: 'var(--font-mono)', color: 'var(--barista-accent-honey)' }}>
                    {actionTarget.slot.remaining_doses !== undefined ? actionTarget.slot.remaining_doses : (actionTarget.batch && actionTarget.batch.remaining_doses)} tubos
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => handleConsumeTube(actionTarget.rack, actionTarget.slot)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '14px',
                    borderRadius: 'var(--barista-radius-md)',
                    backgroundColor: 'var(--barista-accent-honey)',
                    color: 'var(--on-accent)',
                    border: 'none',
                    fontWeight: '700',
                    fontSize: '15px',
                    fontFamily: 'var(--font-heading)',
                    cursor: 'pointer',
                    boxShadow: 'var(--barista-shadow-honey)'
                  }}
                >
                  <Coffee size={18} strokeWidth={2.5} />
                  <span>Preparar este café</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const fullBatch = (batches || []).find(b => b.id === actionTarget.slot.batch_id) || actionTarget.batch;
                    if (onSelectBatch && fullBatch) onSelectBatch(fullBatch);
                    setActionTarget(null);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '12px',
                    borderRadius: 'var(--barista-radius-md)',
                    backgroundColor: 'var(--barista-bg-surface)',
                    color: 'var(--barista-text-primary)',
                    border: '1px solid var(--barista-border-hairline)',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  <ArrowRight size={16} />
                  <span>Ver ficha del café</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    await handleClearSlot(actionTarget.rack.id, actionTarget.slot.position);
                    setActionTarget(null);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '10px',
                    borderRadius: 'var(--barista-radius-md)',
                    backgroundColor: 'transparent',
                    color: 'var(--barista-accent-danger)',
                    border: '1px dashed var(--barista-accent-danger)',
                    fontWeight: '700',
                    fontSize: '12px',
                    cursor: 'pointer',
                    marginTop: '4px'
                  }}
                >
                  <Trash2 size={14} />
                  <span>Vaciar tubo (sin descontar del inventario)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
