import React, { useState } from 'react';
import { X, Search, Sparkles, Check, Coffee, Layers, Trash2 } from 'lucide-react';

export default function SlotAssignModal({
  isOpen,
  onClose,
  rack,
  position,
  batches,
  onAssignSlot,
  onFillRack,
  onClearSlot,
  showToast
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !rack) return null;

  const currentSlot = rack.slots ? rack.slots.find(s => s.position === position) : null;
  const isCurrentlyOccupied = Boolean(currentSlot && currentSlot.batch_id);

  // Filter batches by search term and sort available first
  const filteredBatches = (batches || []).filter(batch => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (batch.name && batch.name.toLowerCase().includes(term)) ||
      (batch.roaster && batch.roaster.toLowerCase().includes(term)) ||
      (batch.origin && batch.origin.toLowerCase().includes(term)) ||
      (batch.variety && batch.variety.toLowerCase().includes(term))
    );
  });

  const emptySlotsCount = rack.slots ? rack.slots.filter(s => !s.batch_id).length : 0;

  const handleAssignSingle = async (batchId) => {
    const targetId = batchId || selectedBatchId;
    if (!targetId) return;
    setIsSubmitting(true);
    try {
      await onAssignSlot(targetId);
      onClose();
    } catch (err) {
      if (showToast) showToast('Error al asignar el tubo: ' + err.message, { type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillAll = async (batchId) => {
    const targetId = batchId || selectedBatchId;
    if (!targetId) return;
    setIsSubmitting(true);
    try {
      await onFillRack(targetId);
      onClose();
    } catch (err) {
      if (showToast) showToast('Error al llenar el portatubos: ' + err.message, { type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = async () => {
    if (!onClearSlot) return;
    setIsSubmitting(true);
    try {
      await onClearSlot();
      onClose();
    } catch (err) {
      if (showToast) showToast('Error al vaciar el tubo: ' + err.message, { type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="slot-assign-title"
        style={{
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          backgroundColor: 'var(--barista-bg-surface, var(--bg-card, #FFFFFF))',
          borderRadius: 'var(--barista-radius-lg, 20px)',
          border: '2px solid var(--barista-border-hairline, var(--border-color))',
          boxShadow: 'var(--barista-shadow-elevated, 0 20px 40px rgba(0,0,0,0.3))',
          display: 'flex',
          flexDirection: 'column',
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
            borderBottom: '1px solid var(--barista-border-hairline, var(--border-color))',
            backgroundColor: 'var(--barista-bg-elevated, var(--bg-header))'
          }}
        >
          <div>
            <h2
              id="slot-assign-title"
              style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: '800',
                fontFamily: 'var(--font-heading)',
                color: 'var(--color-text, #0F172A)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>🧪 Tubo #{position}</span>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  backgroundColor: 'var(--barista-bg-surface, #FFFFFF)',
                  border: '1px solid var(--barista-border-hairline, var(--border-color))',
                  color: 'var(--barista-text-secondary, #64748B)'
                }}
              >
                {rack.name}
              </span>
            </h2>
            <p
              style={{
                margin: '4px 0 0 0',
                fontSize: '12px',
                color: 'var(--barista-text-secondary, var(--color-text-muted))'
              }}
            >
              {isCurrentlyOccupied
                ? `Actualmente contiene: ${currentSlot.batch_name || 'Lote de café'}`
                : 'Selecciona el lote de café que deseas colocar en esta posición.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Cerrar modal"
            style={{
              background: 'transparent',
              border: 'none',
              padding: '8px',
              borderRadius: '50%',
              cursor: 'pointer',
              color: 'var(--barista-text-secondary, var(--color-text-muted))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Input */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--barista-border-hairline, var(--border-color))' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--barista-bg-elevated, #F1F5F9)',
              borderRadius: 'var(--barista-radius-md, 12px)',
              padding: '8px 12px',
              border: '1px solid var(--barista-border-hairline, var(--border-color))'
            }}
          >
            <Search size={16} color="var(--barista-text-muted, #94A3B8)" />
            <input
              type="text"
              placeholder="Buscar por café, tostador u origen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '14px',
                color: 'var(--color-text, #0F172A)',
                fontFamily: 'var(--font-body)'
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px',
                  color: 'var(--barista-text-muted)'
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Coffee List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            maxHeight: '380px'
          }}
        >
          {filteredBatches.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '32px 16px',
                color: 'var(--barista-text-muted, #94A3B8)'
              }}
            >
              <Coffee size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
              <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
                No se encontraron cafés disponibles.
              </p>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>
                Crea un nuevo café en Inventario para poder dosificarlo en tubos.
              </p>
            </div>
          ) : (
            filteredBatches.map((batch) => {
              const isSelected = selectedBatchId === batch.id;
              const isLow = (batch.remaining_doses || 0) <= 2;
              const isOutOfStock = (batch.remaining_doses || 0) <= 0;

              return (
                <div
                  key={batch.id}
                  onClick={() => !isSubmitting && setSelectedBatchId(batch.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 'var(--barista-radius-md, 12px)',
                    border: isSelected
                      ? '2px solid var(--barista-accent-honey, #D97706)'
                      : '1px solid var(--barista-border-hairline, var(--border-color))',
                    backgroundColor: isSelected
                      ? 'var(--barista-instr-bg, rgba(217, 119, 6, 0.08))'
                      : 'var(--barista-bg-surface, var(--bg-card))',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? '0 2px 8px rgba(217, 119, 6, 0.15)' : 'none'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: '800',
                          fontFamily: 'var(--font-heading)',
                          color: 'var(--color-text, #0F172A)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {batch.name}
                      </span>
                      {batch.process && (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: '700',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: 'var(--barista-bg-elevated, #F1F5F9)',
                            color: 'var(--barista-text-secondary, #64748B)',
                            textTransform: 'uppercase'
                          }}
                        >
                          {batch.process}
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginTop: '3px',
                        fontSize: '12px',
                        color: 'var(--barista-text-secondary, #64748B)'
                      }}
                    >
                      <span>{batch.roaster || 'Tostador artesanal'}</span>
                      {batch.origin && <span>• {batch.origin}</span>}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', marginLeft: '12px', flexShrink: 0 }}>
                    <span
                      style={{
                        fontSize: '12px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: '700',
                        color: isOutOfStock
                          ? 'var(--barista-accent-danger, #EF4444)'
                          : isLow
                          ? 'var(--barista-accent-honey, #D97706)'
                          : 'var(--barista-accent-cryo, #0284C7)',
                        display: 'block'
                      }}
                    >
                      {batch.remaining_doses || 0} {batch.remaining_doses === 1 ? 'tubo' : 'tubos'}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--barista-text-muted, #94A3B8)'
                      }}
                    >
                      {batch.dose_weight || '20.0g'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--barista-border-hairline, var(--border-color))',
            backgroundColor: 'var(--barista-bg-elevated, var(--bg-header))',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          {selectedBatchId ? (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleAssignSingle()}
                style={{
                  flex: 1,
                  minWidth: '160px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '10px 16px',
                  backgroundColor: 'var(--barista-accent-honey, #D97706)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 'var(--barista-radius-md, 12px)',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'opacity 0.15s ease'
                }}
              >
                <Check size={16} />
                <span>Asignar solo al Tubo #{position}</span>
              </button>

              {emptySlotsCount > 1 && (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleFillAll()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '10px 14px',
                    backgroundColor: 'var(--barista-bg-surface, #FFFFFF)',
                    color: 'var(--barista-text-primary, #0F172A)',
                    border: '1px solid var(--barista-border-hairline, var(--border-color))',
                    borderRadius: 'var(--barista-radius-md, 12px)',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  title="Llenar todas las ranuras vacías de este rack con este café"
                >
                  <Layers size={16} color="var(--barista-accent-honey, #D97706)" />
                  <span>Llenar vacíos ({emptySlotsCount})</span>
                </button>
              )}
            </div>
          ) : (
            <p
              style={{
                margin: 0,
                fontSize: '12px',
                textAlign: 'center',
                color: 'var(--barista-text-muted, #94A3B8)'
              }}
            >
              Selecciona un café de la lista para asignarlo a esta ranura.
            </p>
          )}

          {isCurrentlyOccupied && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleClear}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '8px 12px',
                backgroundColor: 'transparent',
                color: 'var(--barista-accent-danger, #EF4444)',
                border: '1px dashed var(--barista-accent-danger, #EF4444)',
                borderRadius: 'var(--barista-radius-md, 12px)',
                fontWeight: '600',
                fontSize: '12px',
                cursor: 'pointer',
                marginTop: '4px'
              }}
            >
              <Trash2 size={14} />
              <span>Vaciar este tubo (sin descontar dosis)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
