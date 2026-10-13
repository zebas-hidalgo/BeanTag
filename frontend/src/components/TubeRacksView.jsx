import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Coffee, MoreVertical, Trash2, Edit3, Layers, Check, X, RefreshCw, AlertCircle, ArrowRight, Zap, Snowflake } from 'lucide-react';
import { apiUrl } from '../utils/api';
import SlotAssignModal from './SlotAssignModal';

// Helpers for artisanal Bean Cellar aesthetic
const getRoastStyle = (roast) => {
  const r = String(roast || '').toLowerCase();
  if (r.includes('claro') || r.includes('light') || r.includes('rubio')) {
    return {
      gradient: 'linear-gradient(180deg, rgba(217,119,6,0.15) 0%, #D97706 100%)',
      borderColor: 'rgba(217,119,6,0.4)',
      badgeBg: '#FEF3C7',
      badgeColor: '#D97706',
      label: 'Claro'
    };
  }
  if (r.includes('medio') || r.includes('medium')) {
    return {
      gradient: 'linear-gradient(180deg, rgba(180,83,9,0.15) 0%, #9A3412 100%)',
      borderColor: 'rgba(180,83,9,0.4)',
      badgeBg: '#FED7AA',
      badgeColor: '#C2410C',
      label: 'Medio'
    };
  }
  if (r.includes('oscuro') || r.includes('dark') || r.includes('frances') || r.includes('italiano')) {
    return {
      gradient: 'linear-gradient(180deg, rgba(67,40,24,0.15) 0%, #432818 100%)',
      borderColor: 'rgba(67,40,24,0.4)',
      badgeBg: '#E2E8F0',
      badgeColor: '#334155',
      label: 'Oscuro'
    };
  }
  // Default fill gradient
  return {
    gradient: 'linear-gradient(180deg, rgba(217,119,6,0.15) 0%, #D97706 100%)',
    borderColor: 'rgba(217,119,6,0.4)',
    badgeBg: '#FEF3C7',
    badgeColor: '#D97706',
    label: roast || 'Claro'
  };
};

const getProcessBadge = (proc) => {
  if (!proc || !String(proc).trim()) return null;
  const p = String(proc).toLowerCase();
  if (p.includes('lavad') || p.includes('washed') || p.includes('wet')) {
    return { bg: '#E0F2FE', color: '#0284C7', text: proc };
  }
  if (p.includes('natural') || p.includes('honey') || p.includes('miel') || p.includes('melado')) {
    return { bg: '#FFEDD5', color: '#EA580C', text: proc };
  }
  if (p.includes('anaer') || p.includes('macer') || p.includes('co-ferm') || p.includes('coferm') || p.includes('ferment')) {
    return { bg: '#F3E8FF', color: '#7E22CE', text: proc };
  }
  return { bg: '#F1F5F9', color: '#475569', text: proc };
};

export default function TubeRacksView({ batches, onSelectBatch, onRefreshBatches, showToast }) {
  const [racks, setRacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRackId, setSelectedRackId] = useState(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRackName, setNewRackName] = useState('');
  const [editingRack, setEditingRack] = useState(null); // { id, name }

  // Slot assignment modal: { rack, position }
  const [assignTarget, setAssignTarget] = useState(null);

  // Filled tube action modal: { rack, slot, batch }
  const [actionTarget, setActionTarget] = useState(null);

  // Rack menu dropdown: rackId or null
  const [openRackMenuId, setOpenRackMenuId] = useState(null);

  // Close rack menu on Esc key
  useEffect(() => {
    if (!openRackMenuId) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setOpenRackMenuId(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openRackMenuId]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('beantag-token');
    return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
  };

  const fetchRacks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(apiUrl('api/racks'), { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Error al cargar portatubos (' + res.status + ')');
      const data = await res.json();
      const loadedRacks = Array.isArray(data) ? data : [];
      setRacks(loadedRacks);
      setSelectedRackId(prev => {
        if (!prev || !loadedRacks.some(r => r.id === prev)) {
          return loadedRacks[0]?.id || null;
        }
        return prev;
      });
    } catch (err) {
      console.error('fetchRacks error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRacks();
  }, [fetchRacks]);

  // Synchronize selectedRackId if null or no longer in racks
  useEffect(() => {
    if (racks.length > 0) {
      if (!selectedRackId || !racks.some(r => r.id === selectedRackId)) {
        setSelectedRackId(racks[0].id);
      }
    } else if (selectedRackId !== null) {
      setSelectedRackId(null);
    }
  }, [racks, selectedRackId]);

  // Handle creating a new rack
  const handleCreateRack = async (e) => {
    e.preventDefault();
    if (!newRackName.trim()) return;
    try {
      const res = await fetch(apiUrl('api/racks'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: newRackName.trim() })
      });
      if (!res.ok) throw new Error('No se pudo crear el portatubos');
      const data = await res.json();
      setRacks(prev => [...prev, data.rack]);
      setSelectedRackId(data.rack.id);
      setNewRackName('');
      setShowCreateModal(false);
      if (showToast) showToast(`Portatubos "${data.rack.name}" creado con éxito ✨`, { type: 'success' });
    } catch (err) {
      if (showToast) showToast(err.message, { type: 'error' });
    }
  };

  // Handle renaming rack
  const handleRenameRack = async (e) => {
    e.preventDefault();
    if (!editingRack || !editingRack.name.trim()) return;
    try {
      const res = await fetch(apiUrl(`api/racks/${editingRack.id}`), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: editingRack.name.trim() })
      });
      if (!res.ok) throw new Error('No se pudo renombrar el portatubos');
      setRacks(prev => prev.map(r => r.id === editingRack.id ? { ...r, name: editingRack.name.trim() } : r));
      setEditingRack(null);
      if (showToast) showToast('Nombre actualizado', { type: 'success' });
    } catch (err) {
      if (showToast) showToast(err.message, { type: 'error' });
    }
  };

  // Handle deleting rack
  const handleDeleteRack = async (rackId) => {
    if (!window.confirm('¿Estás seguro de eliminar este portatubos?')) return;
    try {
      const res = await fetch(apiUrl(`api/racks/${rackId}`), {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Error al eliminar');
      setRacks(prev => {
        const remaining = prev.filter(r => r.id !== rackId);
        setSelectedRackId(curr => {
          if (curr === rackId) {
            return remaining[0]?.id || null;
          }
          return curr;
        });
        return remaining;
      });
      setOpenRackMenuId(null);
      if (showToast) showToast('Portatubos eliminado', { type: 'info' });
    } catch (err) {
      if (showToast) showToast(err.message, { type: 'error' });
    }
  };

  // Handle empty rack
  const handleEmptyRack = async (rackId) => {
    if (!window.confirm('¿Vaciar todas las ranuras de este portatubos?')) return;
    try {
      const res = await fetch(apiUrl(`api/racks/${rackId}/empty`), {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Error al vaciar');
      setRacks(prev => prev.map(r => {
        if (r.id !== rackId) return r;
        return {
          ...r,
          slots: r.slots.map(s => ({ ...s, batch_id: null, batch_name: null }))
        };
      }));
      setOpenRackMenuId(null);
      if (showToast) showToast('Portatubos vaciado', { type: 'info' });
    } catch (err) {
      if (showToast) showToast(err.message, { type: 'error' });
    }
  };

  // Handle slot assignment
  const handleAssignSlot = async (batchId) => {
    if (!assignTarget) return;
    const { rack, position } = assignTarget;
    const res = await fetch(apiUrl(`api/racks/${rack.id}/slots/${position}`), {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ batch_id: batchId })
    });
    if (!res.ok) throw new Error('Error al asignar ranura');
    const data = await res.json();
    setRacks(prev => prev.map(r => {
      if (r.id !== rack.id) return r;
      return {
        ...r,
        slots: r.slots.map(s => s.position === position ? data.slot : s)
      };
    }));
    if (showToast) showToast(`Tubo #${position} asignado`, { type: 'success' });
  };

  // Handle filling all empty slots in rack
  const handleFillRack = async (batchId) => {
    if (!assignTarget) return;
    const { rack } = assignTarget;
    const res = await fetch(apiUrl(`api/racks/${rack.id}/fill`), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ batch_id: batchId, only_empty: true })
    });
    if (!res.ok) throw new Error('Error al llenar rack');
    const data = await res.json();
    setRacks(prev => prev.map(r => r.id === rack.id ? { ...r, slots: data.slots } : r));
    if (showToast) showToast(`Ranuras de "${rack.name}" completadas`, { type: 'success' });
  };

  // Handle clearing single slot
  const handleClearSlot = async (rackId, position) => {
    const res = await fetch(apiUrl(`api/racks/${rackId}/slots/${position}`), {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ batch_id: null })
    });
    if (!res.ok) throw new Error('Error al vaciar ranura');
    const data = await res.json();
    setRacks(prev => prev.map(r => {
      if (r.id !== rackId) return r;
      return {
        ...r,
        slots: r.slots.map(s => s.position === position ? data.slot : s)
      };
    }));
    if (showToast) showToast(`Tubo #${position} vaciado`, { type: 'info' });
  };

  // Handle consuming a tube (atomic decrement + empty slot)
  const handleConsumeTube = async (rack, slot) => {
    try {
      const res = await fetch(apiUrl(`api/racks/${rack.id}/slots/${slot.position}/consume`), {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'No se pudo consumir el tubo');
      }
      const data = await res.json();

      // Update slot locally
      setRacks(prev => prev.map(r => {
        if (r.id !== rack.id) return r;
        return {
          ...r,
          slots: r.slots.map(s => s.position === slot.position ? { ...s, batch_id: null, batch_name: null } : s)
        };
      }));

      // Refresh batches in inventory to sync dose subtraction
      if (onRefreshBatches) onRefreshBatches();

      setActionTarget(null);

      if (showToast) {
        showToast(
          `☕ Dosis consumida de "${data.consumed_batch.name}". Quedan ${data.consumed_batch.remaining_doses} tubos.`,
          { type: 'success', duration: 4000 }
        );
      }

      // Find full batch object to open recipe dial-in if user wants
      const fullBatch = (batches || []).find(b => b.id === slot.batch_id) || data.consumed_batch;
      if (onSelectBatch && fullBatch) {
        onSelectBatch(fullBatch);
      }
    } catch (err) {
      if (showToast) showToast(err.message, { type: 'error' });
    }
  };

  // Total stats
  const totalSlots = racks.length * 6;
  const occupiedSlots = racks.reduce((acc, r) => acc + (r.slots ? r.slots.filter(s => s.batch_id).length : 0), 0);
  const activeRack = racks.find(r => r.id === selectedRackId) || racks[0] || null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '90px' }}>
      {/* Top Banner / Summary */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '16px 20px',
          backgroundColor: 'var(--barista-bg-surface, var(--bg-card, #FFFFFF))',
          borderRadius: 'var(--barista-radius-lg, 16px)',
          border: '1px solid var(--barista-border-hairline, var(--border-color))',
          boxShadow: 'var(--barista-shadow-card, 0 2px 8px rgba(0,0,0,0.04))'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2
              style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: '900',
                fontFamily: 'var(--font-heading)',
                color: 'var(--color-text, #0F172A)'
              }}
            >
              🧪 Portatubos (2×3)
            </h2>
            <span
              style={{
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                fontWeight: '800',
                padding: '3px 8px',
                borderRadius: '9999px',
                backgroundColor: 'var(--barista-instr-bg, #FEF3C7)',
                color: 'var(--barista-accent-honey, #D97706)',
                border: '1px solid var(--barista-instr-border, #FDE68A)'
              }}
            >
              {occupiedSlots} / {totalSlots} tubos ocupados en total
            </span>
          </div>
          <p
            style={{
              margin: '4px 0 0 0',
              fontSize: '12px',
              color: 'var(--barista-text-secondary, #64748B)'
            }}
          >
            Mapeo táctil de dosis individuales en soportes de 6 tubos. Toca un tubo para extraer o asignar.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={fetchRacks}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px',
              borderRadius: 'var(--barista-radius-md, 10px)',
              backgroundColor: 'var(--barista-bg-elevated, #F1F5F9)',
              border: '1px solid var(--barista-border-hairline, var(--border-color))',
              color: 'var(--barista-text-secondary, #64748B)',
              cursor: 'pointer'
            }}
            title="Refrescar portatubos"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: 'var(--barista-radius-md, 12px)',
              backgroundColor: 'var(--barista-accent-honey, #D97706)',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: '800',
              fontSize: '13px',
              fontFamily: 'var(--font-heading)',
              cursor: 'pointer',
              boxShadow: 'var(--barista-shadow-honey, 0 4px 12px rgba(217, 119, 6, 0.25))'
            }}
          >
            <Plus size={16} strokeWidth={3} />
            <span>Nuevo Portatubos</span>
          </button>
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && racks.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--barista-text-muted)' }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
          <p style={{ margin: 0, fontWeight: '600' }}>Cargando portatubos...</p>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '16px',
            borderRadius: '12px',
            backgroundColor: 'var(--barista-accent-danger-bg, #FEE2E2)',
            color: 'var(--barista-accent-danger-text, #991B1B)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px'
          }}
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && racks.length === 0 && !error && (
        <div
          style={{
            textAlign: 'center',
            padding: '48px 24px',
            backgroundColor: 'var(--barista-bg-surface, var(--bg-card, #FFFFFF))',
            borderRadius: 'var(--barista-radius-lg, 20px)',
            border: '2px dashed var(--barista-border-hairline, var(--border-color))'
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--barista-bg-elevated, #F1F5F9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              border: '2px solid var(--barista-border-hairline, var(--border-color))'
            }}
          >
            <Coffee size={32} color="var(--barista-accent-honey, #D97706)" />
          </div>
          <h3
            style={{
              margin: '0 0 8px 0',
              fontSize: '18px',
              fontWeight: '900',
              fontFamily: 'var(--font-heading)',
              color: 'var(--color-text, #0F172A)'
            }}
          >
            Aún no tienes portatubos registrados
          </h3>
          <p
            style={{
              margin: '0 0 20px 0',
              fontSize: '14px',
              color: 'var(--barista-text-secondary, #64748B)',
              maxWidth: '380px',
              marginLeft: 'auto',
              marginRight: 'auto'
            }}
          >
            Organiza tus tubos de monodosis en soportes de 2×3 (6 tubos por soporte) para saber exactamente qué café tienes listo para extraer.
          </p>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '12px 24px',
              backgroundColor: 'var(--barista-accent-honey, #D97706)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 'var(--barista-radius-pill, 9999px)',
              fontWeight: '800',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>Crear mi primer Portatubos (2×3)</span>
          </button>
        </div>
      )}

      {/* Horizontal Pill-Tab Navigation Bar */}
      {racks.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            width: '100%'
          }}
        >
          <div
            className="hide-scrollbar"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              overflowX: 'auto',
              padding: '2px 2px 6px 2px',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              flex: 1
            }}
            role="tablist"
            aria-label="Portatubos disponibles"
          >
            {racks.map((rack) => {
              const isSelected = rack.id === activeRack?.id;
              const occupiedInThisRack = rack.slots ? rack.slots.filter(s => s.batch_id).length : 0;

              return (
                <button
                  key={rack.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => {
                    setSelectedRackId(rack.id);
                    setOpenRackMenuId(null);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: 'var(--barista-radius-pill, 9999px)',
                    border: isSelected
                      ? '1.5px solid var(--color-crimson, #E53E3E)'
                      : '1px solid var(--barista-border-hairline, var(--border-color))',
                    backgroundColor: isSelected
                      ? 'var(--color-crimson, #E53E3E)'
                      : 'var(--barista-bg-elevated, #F8FAFC)',
                    color: isSelected ? '#FFFFFF' : 'var(--barista-text-secondary, #64748B)',
                    fontWeight: isSelected ? '800' : '600',
                    fontSize: '13px',
                    fontFamily: 'var(--font-heading)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected
                      ? '0 2px 10px rgba(229, 62, 62, 0.35)'
                      : 'none'
                  }}
                >
                  <span>☕ {rack.name}</span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: '800',
                      padding: '2px 7px',
                      borderRadius: '9999px',
                      backgroundColor: isSelected
                        ? 'rgba(255, 255, 255, 0.25)'
                        : 'var(--barista-bg-surface, #FFFFFF)',
                      color: isSelected ? '#FFFFFF' : 'var(--barista-text-secondary, #64748B)',
                      border: isSelected
                        ? '1px solid rgba(255, 255, 255, 0.4)'
                        : '1px solid var(--barista-border-hairline, var(--border-color))'
                    }}
                  >
                    {occupiedInThisRack}/6
                  </span>
                </button>
              );
            })}
          </div>

          {/* + Nuevo Rack Pill Button */}
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: 'var(--barista-radius-pill, 9999px)',
              border: '1px dashed var(--barista-border-hairline, var(--border-color))',
              backgroundColor: 'transparent',
              color: 'var(--barista-text-secondary, #64748B)',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'all 0.15s ease'
            }}
          >
            <Plus size={15} />
            <span>+ Nuevo Rack</span>
          </button>
        </div>
      )}

      {/* Prominently Displayed Active Rack */}
      {activeRack && (() => {
        const occupiedInRack = activeRack.slots ? activeRack.slots.filter(s => s.batch_id).length : 0;
        const isMenuOpen = openRackMenuId === activeRack.id;

        return (
          <div
            style={{
              backgroundColor: 'var(--barista-bg-surface, var(--bg-card, #FFFFFF))',
              borderRadius: 'var(--barista-radius-lg, 20px)',
              border: '2px solid var(--barista-border-hairline, var(--border-color))',
              boxShadow: 'var(--barista-shadow-elevated, 0 8px 24px rgba(0,0,0,0.06))',
              overflow: 'hidden'
            }}
          >
            {/* Rack Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                backgroundColor: 'var(--barista-bg-elevated, var(--bg-header))',
                borderBottom: '2px solid var(--barista-border-hairline, var(--border-color))',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor:
                      occupiedInRack === 6
                        ? 'var(--barista-accent-mint, #10B981)'
                        : occupiedInRack > 0
                        ? 'var(--barista-accent-honey, #D97706)'
                        : 'var(--barista-text-muted, #94A3B8)'
                  }}
                />
                <h3
                  style={{
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: '800',
                    fontFamily: 'var(--font-heading)',
                    color: 'var(--color-text, #0F172A)'
                  }}
                >
                  {activeRack.name}
                </h3>
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: '700',
                    padding: '2px 7px',
                    borderRadius: '9999px',
                    backgroundColor: 'var(--barista-bg-surface, #FFFFFF)',
                    border: '1px solid var(--barista-border-hairline, var(--border-color))',
                    color: 'var(--barista-text-secondary, #64748B)'
                  }}
                >
                  {occupiedInRack} / 6 tubos
                </span>
              </div>

              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setOpenRackMenuId(isMenuOpen ? null : activeRack.id)}
                  aria-label="Opciones del portatubos"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: '6px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    color: 'var(--barista-text-secondary, #64748B)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <MoreVertical size={18} />
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <>
                    <div
                      style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 40
                      }}
                      onClick={() => setOpenRackMenuId(null)}
                      aria-hidden="true"
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        zIndex: 50,
                        marginTop: '4px',
                        width: '200px',
                        backgroundColor: 'var(--barista-bg-surface, #FFFFFF)',
                        borderRadius: '12px',
                        border: '1px solid var(--barista-border-hairline, var(--border-color))',
                        boxShadow: 'var(--barista-shadow-elevated, 0 10px 25px rgba(0,0,0,0.15))',
                        padding: '6px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px'
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setEditingRack({ id: activeRack.id, name: activeRack.name });
                          setOpenRackMenuId(null);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 10px',
                          background: 'none',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: '600',
                          color: 'var(--barista-text-primary, #0F172A)',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <Edit3 size={15} />
                        <span>Renombrar</span>
                      </button>

                      {occupiedInRack > 0 && (
                        <button
                          type="button"
                          onClick={() => handleEmptyRack(activeRack.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 10px',
                            background: 'none',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: 'var(--barista-accent-danger, #EF4444)',
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                        >
                          <Layers size={15} />
                          <span>Vaciar todo el rack</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteRack(activeRack.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 10px',
                          background: 'none',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: '600',
                          color: 'var(--barista-accent-danger, #EF4444)',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <Trash2 size={15} />
                        <span>Eliminar portatubos</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Physical Neo-Brutalist Rack Base Body (2x3 Grid) */}
            <div
              style={{
                padding: '18px',
                backgroundColor: 'var(--barista-bg-surface, var(--bg-card, #FFFFFF))',
                backgroundImage: 'radial-gradient(var(--barista-border-hairline, rgba(0,0,0,0.06)) 1px, transparent 1px)',
                backgroundSize: '16px 16px'
              }}
            >
              {/* Visual Stand Frame */}
              <div
                style={{
                  backgroundColor: 'var(--barista-bg-elevated, #F8FAFC)',
                  border: '2px solid var(--barista-border-hairline, var(--border-color))',
                  borderRadius: 'var(--barista-radius-lg, 16px)',
                  padding: '14px',
                  boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.04)'
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '12px'
                  }}
                >
                  {[1, 2, 3, 4, 5, 6].map((position) => {
                    const slot = activeRack.slots ? activeRack.slots.find(s => s.position === position) : null;
                    const isFilled = Boolean(slot && slot.batch_id);

                    // Match with batch in batches list for full info if needed
                    const matchedBatch = isFilled ? (batches || []).find(b => b.id === slot.batch_id) : null;
                    const batchName = (slot && slot.batch_name) || (matchedBatch && matchedBatch.name) || 'Café Especialidad';
                    const roaster = (slot && slot.roaster) || (matchedBatch && matchedBatch.roaster) || '';
                    const origin = (slot && slot.origin) || (matchedBatch && matchedBatch.origin) || '';
                    const rawDose = (slot && slot.dose_weight) || (matchedBatch && matchedBatch.dose_weight) || '20.0';
                    const doseWeight = typeof rawDose === 'number'
                      ? `${rawDose}g`
                      : (String(rawDose).endsWith('g') ? rawDose : `${rawDose}g`);

                    const roastLevel = (slot && (slot.roast_level || slot.roast)) || (matchedBatch && (matchedBatch.roast_level || matchedBatch.roast)) || '';
                    const roastStyle = getRoastStyle(roastLevel);

                    const process = (slot && (slot.process || slot.proceso)) || (matchedBatch && (matchedBatch.process || matchedBatch.proceso)) || '';
                    const processBadge = getProcessBadge(process);

                    const freezeDate = (slot && (slot.freeze_date || slot.frozen_date)) || (matchedBatch && (matchedBatch.freeze_date || matchedBatch.frozen_date)) || null;
                    const rackNameLower = (activeRack.name || '').toLowerCase();
                    const isRackFrozen = rackNameLower.includes('cava') || rackNameLower.includes('congelador') || rackNameLower.includes('freezer');
                    const isBatchFrozen = Boolean(freezeDate && String(freezeDate).trim() !== '');
                    const isFrozen = isFilled && (isBatchFrozen || isRackFrozen);

                    return (
                      <div
                        key={position}
                        onClick={() => {
                          if (isFilled) {
                            setActionTarget({ rack: activeRack, slot, batch: matchedBatch || slot });
                          } else {
                            setAssignTarget({ rack: activeRack, position });
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            if (isFilled) {
                              setActionTarget({ rack: activeRack, slot, batch: matchedBatch || slot });
                            } else {
                              setAssignTarget({ rack: activeRack, position });
                            }
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        aria-label={`Tubo ${position}: ${isFilled ? batchName : 'Vacío'}`}
                        style={{
                          minHeight: '185px',
                          backgroundColor: isFilled
                            ? 'var(--barista-bg-surface, #FFFFFF)'
                            : 'var(--barista-bg-subtle, rgba(241, 245, 249, 0.5))',
                          borderRadius: '14px',
                          border: isFilled
                            ? (isFrozen ? '2px solid #38BDF8' : '2px solid var(--barista-accent-honey, #D97706)')
                            : '2px dashed var(--barista-border-hairline, var(--border-color))',
                          boxShadow: isFilled
                            ? (isFrozen
                                ? '0 4px 12px rgba(56, 189, 248, 0.2), inset 0 1px 0 rgba(255,255,255,0.8)'
                                : '0 4px 12px rgba(217, 119, 6, 0.15), inset 0 1px 0 rgba(255,255,255,0.8)')
                            : 'none',
                          padding: '10px 8px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          position: 'relative',
                          boxSizing: 'border-box'
                        }}
                      >
                        {/* Tube Top Aperture & Position Tag */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%',
                            marginBottom: '4px'
                          }}
                        >
                          <span
                            style={{
                              fontSize: '10px',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: '900',
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              backgroundColor: isFilled
                                ? (isFrozen ? '#0284C7' : 'var(--barista-accent-honey, #D97706)')
                                : 'var(--barista-bg-elevated, #E2E8F0)',
                              color: isFilled ? '#FFFFFF' : 'var(--barista-text-secondary, #64748B)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            {position}
                          </span>

                          {isFilled ? (
                            isFrozen ? (
                              <span
                                title="Lote congelado / Cava"
                                style={{
                                  fontSize: '11px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  padding: '1px 4px',
                                  borderRadius: '4px',
                                  backgroundColor: 'rgba(56, 189, 248, 0.15)',
                                  border: '1px solid #38BDF8',
                                  lineHeight: 1
                                }}
                              >
                                ❄️
                              </span>
                            ) : (
                              <span style={{ width: '20px' }} />
                            )
                          ) : (
                            <span
                              style={{
                                fontSize: '9px',
                                fontFamily: 'var(--font-mono)',
                                color: 'var(--barista-text-muted, #94A3B8)',
                                fontWeight: '600'
                              }}
                            >
                              VACÍO
                            </span>
                          )}
                        </div>

                        {/* Slot Center: Tube Content or Plus icon */}
                        {isFilled ? (
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              width: '100%'
                            }}
                          >
                            {/* Artisanal Skeuomorphic Bean Cellar Tube */}
                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                marginBottom: '6px'
                              }}
                            >
                              {/* Wooden / walnut cap at the top */}
                              <div
                                style={{
                                  width: '32px',
                                  height: '8px',
                                  background: '#8B5A2B',
                                  borderRadius: '3px',
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                                  marginBottom: '2px'
                                }}
                              />

                              {/* Glass cylindrical tube body with curved base */}
                              <div
                                style={{
                                  width: '36px',
                                  height: '50px',
                                  borderRadius: '0 0 16px 16px',
                                  border: isFrozen
                                    ? '1.5px solid #38BDF8'
                                    : `1.5px solid ${roastStyle.borderColor}`,
                                  borderTop: 'none',
                                  background: roastStyle.gradient,
                                  display: 'flex',
                                  alignItems: 'flex-end',
                                  justifyContent: 'center',
                                  paddingBottom: '4px',
                                  boxSizing: 'border-box',
                                  boxShadow: isFrozen
                                    ? '0 0 8px rgba(56, 189, 248, 0.35)'
                                    : '0 2px 4px rgba(0,0,0,0.08)'
                                }}
                              >
                                {/* Dose weight pill badge in the base of the glass tube */}
                                <span
                                  style={{
                                    fontSize: '8.5px',
                                    fontWeight: '800',
                                    color: '#FFFFFF',
                                    background: 'rgba(0,0,0,0.35)',
                                    padding: '1px 4px',
                                    borderRadius: '4px',
                                    lineHeight: 1
                                  }}
                                >
                                  {doseWeight}
                                </span>
                              </div>
                            </div>

                            {/* Clean coffee name (truncated if long) */}
                            <div
                              style={{
                                fontSize: '12px',
                                fontWeight: '800',
                                fontFamily: 'var(--font-heading)',
                                color: 'var(--color-text, #0F172A)',
                                lineHeight: 1.25,
                                textAlign: 'center',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                wordBreak: 'break-word',
                                width: '100%',
                                minHeight: '28px'
                              }}
                              title={batchName}
                            >
                              {batchName}
                            </div>

                            {/* Process Badge and Roast Badge below the tube */}
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexWrap: 'wrap',
                                gap: '4px',
                                marginTop: '4px'
                              }}
                            >
                              {processBadge && (
                                <span
                                  style={{
                                    fontSize: '9px',
                                    fontWeight: '800',
                                    padding: '1.5px 5px',
                                    borderRadius: '4px',
                                    backgroundColor: processBadge.bg,
                                    color: processBadge.color,
                                    whiteSpace: 'nowrap',
                                    maxWidth: '100%',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    lineHeight: 1.2
                                  }}
                                >
                                  {processBadge.text}
                                </span>
                              )}
                              {roastLevel && (
                                <span
                                  style={{
                                    fontSize: '9px',
                                    fontWeight: '800',
                                    padding: '1.5px 5px',
                                    borderRadius: '4px',
                                    backgroundColor: roastStyle.badgeBg,
                                    color: roastStyle.badgeColor,
                                    whiteSpace: 'nowrap',
                                    lineHeight: 1.2
                                  }}
                                >
                                  {roastStyle.label}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          /* Empty Slot */
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              margin: 'auto 0',
                              padding: '8px 0',
                              width: '100%'
                            }}
                          >
                            {/* Dotted/dashed outline of a tube */}
                            <div
                              style={{
                                width: '32px',
                                height: '46px',
                                border: '2px dashed var(--barista-border-hairline, var(--border-color))',
                                borderRadius: '0 0 16px 16px',
                                borderTop: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '6px'
                              }}
                            >
                              <Plus size={16} color="var(--barista-text-muted, #94A3B8)" />
                            </div>

                            {/* Label below: Asignar #{position} with muted text */}
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: '700',
                                color: 'var(--barista-text-muted, #94A3B8)',
                                textAlign: 'center'
                              }}
                            >
                              Asignar #{position}
                            </span>
                          </div>
                        )}

                        {/* Tube Bottom Tag: Roaster or Origin */}
                        {isFilled ? (
                          <div
                            style={{
                              fontSize: '10px',
                              fontWeight: '600',
                              color: 'var(--barista-text-secondary, #64748B)',
                              textAlign: 'center',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              borderTop: '1px solid var(--barista-border-hairline, rgba(0,0,0,0.06))',
                              paddingTop: '4px',
                              marginTop: 'auto',
                              width: '100%'
                            }}
                            title={roaster || origin || 'Monodosis'}
                          >
                            {roaster || origin || 'Monodosis'}
                          </div>
                        ) : (
                          <div style={{ height: '18px', marginTop: 'auto' }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal: New Rack */}
      {showCreateModal && (
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
          onClick={(e) => { if (e.target === e.currentTarget) setShowCreateModal(false); }}
        >
          <div
            role="dialog"
            aria-modal="true"
            style={{
              width: '100%',
              maxWidth: '440px',
              backgroundColor: 'var(--barista-bg-surface, var(--bg-card, #FFFFFF))',
              borderRadius: 'var(--barista-radius-lg, 20px)',
              border: '2px solid var(--barista-border-hairline, var(--border-color))',
              boxShadow: 'var(--barista-shadow-elevated, 0 20px 40px rgba(0,0,0,0.3))',
              overflow: 'hidden'
            }}
          >
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
              <h3
                style={{
                  margin: 0,
                  fontSize: '16px',
                  fontWeight: '800',
                  fontFamily: 'var(--font-heading)',
                  color: 'var(--color-text, #0F172A)'
                }}
              >
                🧪 Crear Nuevo Portatubos (2×3)
              </h3>
              <button
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
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '700',
                  marginBottom: '8px',
                  color: 'var(--color-text, #0F172A)'
                }}
              >
                Nombre o Ubicación del Portatubos:
              </label>
              <input
                type="text"
                autoFocus
                placeholder="Ej. Rack Barra Espresso, Rack Congelador..."
                value={newRackName}
                onChange={(e) => setNewRackName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 'var(--barista-radius-md, 12px)',
                  border: '2px solid var(--barista-border-hairline, var(--border-color))',
                  backgroundColor: 'var(--barista-bg-elevated, #F8FAFC)',
                  color: 'var(--color-text, #0F172A)',
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
                  color: 'var(--barista-text-secondary, #64748B)'
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
                    borderRadius: 'var(--barista-radius-md, 12px)',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--barista-border-hairline, var(--border-color))',
                    color: 'var(--barista-text-secondary, #64748B)',
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
                    borderRadius: 'var(--barista-radius-md, 12px)',
                    backgroundColor: 'var(--barista-accent-honey, #D97706)',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: '800',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Crear Portatubos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Rename Rack */}
      {editingRack && (
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
          onClick={(e) => { if (e.target === e.currentTarget) setEditingRack(null); }}
        >
          <div
            role="dialog"
            aria-modal="true"
            style={{
              width: '100%',
              maxWidth: '440px',
              backgroundColor: 'var(--barista-bg-surface, var(--bg-card, #FFFFFF))',
              borderRadius: 'var(--barista-radius-lg, 20px)',
              border: '2px solid var(--barista-border-hairline, var(--border-color))',
              padding: '20px'
            }}
          >
            <h3
              style={{
                margin: '0 0 12px 0',
                fontSize: '16px',
                fontWeight: '800',
                fontFamily: 'var(--font-heading)',
                color: 'var(--color-text, #0F172A)'
              }}
            >
              Renombrar Portatubos
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
                  borderRadius: 'var(--barista-radius-md, 12px)',
                  border: '2px solid var(--barista-border-hairline, var(--border-color))',
                  backgroundColor: 'var(--barista-bg-elevated, #F8FAFC)',
                  color: 'var(--color-text, #0F172A)',
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
                    borderRadius: '10px',
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
                    borderRadius: '10px',
                    backgroundColor: 'var(--barista-accent-honey, #D97706)',
                    color: '#FFFFFF',
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

      {/* Modal: Slot Assignment */}
      {assignTarget && (
        <SlotAssignModal
          isOpen={Boolean(assignTarget)}
          onClose={() => setAssignTarget(null)}
          rack={assignTarget.rack}
          position={assignTarget.position}
          batches={batches}
          onAssignSlot={handleAssignSlot}
          onFillRack={handleFillRack}
          onClearSlot={() => handleClearSlot(assignTarget.rack.id, assignTarget.position)}
          showToast={showToast}
        />
      )}

      {/* Modal: Filled Tube Quick Actions */}
      {actionTarget && (
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
          onClick={(e) => { if (e.target === e.currentTarget) setActionTarget(null); }}
        >
          <div
            role="dialog"
            aria-modal="true"
            style={{
              width: '100%',
              maxWidth: '460px',
              backgroundColor: 'var(--barista-bg-surface, var(--bg-card, #FFFFFF))',
              borderRadius: 'var(--barista-radius-lg, 20px)',
              border: '2px solid var(--barista-border-hairline, var(--border-color))',
              boxShadow: 'var(--barista-shadow-elevated, 0 20px 40px rgba(0,0,0,0.3))',
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
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--barista-accent-honey, #D97706)',
                    textTransform: 'uppercase'
                  }}
                >
                  Tubo #{actionTarget.slot.position} • {actionTarget.rack.name}
                </span>
                <h3
                  style={{
                    margin: '2px 0 0 0',
                    fontSize: '18px',
                    fontWeight: '900',
                    fontFamily: 'var(--font-heading)',
                    color: 'var(--color-text, #0F172A)'
                  }}
                >
                  {actionTarget.slot.batch_name || (actionTarget.batch && actionTarget.batch.name)}
                </h3>
              </div>
              <button
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
                  backgroundColor: 'var(--barista-bg-elevated, #F8FAFC)',
                  borderRadius: 'var(--barista-radius-md, 12px)',
                  marginBottom: '20px',
                  border: '1px solid var(--barista-border-hairline, var(--border-color))'
                }}
              >
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--barista-text-muted)', display: 'block' }}>Tostador:</span>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-text)' }}>
                    {actionTarget.slot.roaster || (actionTarget.batch && actionTarget.batch.roaster) || 'N/A'}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--barista-text-muted)', display: 'block' }}>Origen:</span>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-text)' }}>
                    {actionTarget.slot.origin || (actionTarget.batch && actionTarget.batch.origin) || 'N/A'}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--barista-text-muted)', display: 'block' }}>Dosis tubo:</span>
                  <span style={{ fontSize: '13px', fontWeight: '700', fontFamily: 'var(--font-mono)', color: 'var(--barista-accent-cryo, #0284C7)' }}>
                    {actionTarget.slot.dose_weight || (actionTarget.batch && actionTarget.batch.dose_weight) || '20.0g'}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--barista-text-muted)', display: 'block' }}>Stock en Lote:</span>
                  <span style={{ fontSize: '13px', fontWeight: '700', fontFamily: 'var(--font-mono)', color: 'var(--barista-accent-honey, #D97706)' }}>
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
                    borderRadius: 'var(--barista-radius-md, 14px)',
                    backgroundColor: 'var(--barista-accent-honey, #D97706)',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: '900',
                    fontSize: '15px',
                    fontFamily: 'var(--font-heading)',
                    cursor: 'pointer',
                    boxShadow: 'var(--barista-shadow-honey, 0 4px 14px rgba(217, 119, 6, 0.3))'
                  }}
                >
                  <Coffee size={18} strokeWidth={2.5} />
                  <span>☕ Preparar / Consumir Café</span>
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
                    borderRadius: 'var(--barista-radius-md, 12px)',
                    backgroundColor: 'var(--barista-bg-surface, #FFFFFF)',
                    color: 'var(--barista-text-primary, #0F172A)',
                    border: '1px solid var(--barista-border-hairline, var(--border-color))',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  <ArrowRight size={16} />
                  <span>Ver Ficha Completa del Café</span>
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
                    borderRadius: 'var(--barista-radius-md, 12px)',
                    backgroundColor: 'transparent',
                    color: 'var(--barista-accent-danger, #EF4444)',
                    border: '1px dashed var(--barista-accent-danger, #EF4444)',
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
    </div>
  );
}
