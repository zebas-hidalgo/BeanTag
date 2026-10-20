import React from 'react';
import { Droplet, Plus, Trash2, SlidersHorizontal, Lock, Unlock, Zap } from 'lucide-react';

export default function PourSequenceTimeline({
  pours = [],
  setPours,
  isPulsar = false,
  totalWaterG = 300,
  doseInG = 18
}) {
  const handleValveToggle = (idx) => {
    if (!setPours || !Array.isArray(pours)) return;
    const nextPours = [...pours];
    const current = nextPours[idx]?.valve || 'open';
    const nextState = current === 'closed' ? 'half' : (current === 'half' ? 'open' : 'closed');
    nextPours[idx] = {
      ...nextPours[idx],
      valve: nextState
    };
    setPours(nextPours);
    if (navigator.vibrate) navigator.vibrate(8);
  };

  const handleAddPour = () => {
    if (!setPours || !Array.isArray(pours)) return;
    const stepNum = pours.length + 1;
    const newPour = {
      step: stepNum,
      label: `Vertido ${stepNum}`,
      water_g: 50,
      total_water_g: (pours[pours.length - 1]?.total_water_g || 0) + 50,
      time: '0:00',
      description: 'Verter en círculos concéntricos.',
      valve: isPulsar ? 'open' : undefined
    };
    setPours([...pours, newPour]);
    if (navigator.vibrate) navigator.vibrate(8);
  };

  const handleRemovePour = (idx) => {
    if (!setPours || !Array.isArray(pours) || pours.length <= 1) return;
    const nextPours = pours.filter((_, i) => i !== idx).map((p, i) => ({
      ...p,
      step: i + 1
    }));
    setPours(nextPours);
    if (navigator.vibrate) navigator.vibrate(8);
  };

  return (
    <div className="barista-card" style={{ marginBottom: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Droplet size={16} color="var(--accent-honey)" />
          <h3 style={{
            margin: 0,
            fontSize: 'var(--text-sm)',
            fontWeight: '800',
            fontFamily: 'var(--font-display)',
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
            color: 'var(--text-primary)'
          }}>
            Secuencia de Vertidos {isPulsar && '• Protocolo Válvula'}
          </h3>
        </div>

        <button
          type="button"
          onClick={handleAddPour}
          className="barista-btn barista-btn-secondary"
          style={{ minHeight: '36px', padding: '4px 10px', fontSize: '11px', gap: '4px' }}
        >
          <Plus size={13} />
          <span>Añadir Vertido</span>
        </button>
      </div>

      {/* Timeline Steps */}
      {Array.isArray(pours) && pours.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {pours.map((pour, idx) => {
            const valve = pour.valve || (idx === 0 ? 'closed' : 'open');
            const valveClass = valve === 'closed'
              ? 'barista-valve-closed'
              : (valve === 'half' ? 'barista-valve-half' : 'barista-valve-open');
            const valveText = valve === 'closed'
              ? '🔒 Cerrada (Inmersión)'
              : (valve === 'half' ? '⚡ 50% Media (Caudal)' : '🔓 Abierta (Drawdown)');

            return (
              <div
                key={idx}
                className="barista-card-subtle"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  padding: '10px 12px',
                  borderLeft: isPulsar
                    ? `4px solid ${valve === 'closed' ? 'var(--valve-closed)' : valve === 'half' ? 'var(--valve-half)' : 'var(--valve-open)'}`
                    : '4px solid var(--accent-honey)'
                }}
              >
                {/* Step Row Top: Title, Time and Grams */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--bg-elevated)',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-metric)',
                      fontSize: '11px',
                      fontWeight: '800',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {pour.step || idx + 1}
                    </span>
                    <span style={{ fontWeight: '700', fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>
                      {pour.label || pour.title || `Paso ${idx + 1}`}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-metric)', fontSize: 'var(--text-xs)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{pour.time || '0:00'}</span>
                    <span style={{ fontWeight: '800', color: 'var(--text-primary)' }}>
                      +{pour.water_g}g <span style={{ color: 'var(--text-muted)', fontWeight: '500' }}>({pour.total_water_g}g)</span>
                    </span>
                    {pours.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePour(idx)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                        title="Eliminar etapa"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Pulsar Mini Interactive Valve State Button */}
                {isPulsar && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => handleValveToggle(idx)}
                      className={`barista-chip ${valveClass}`}
                      style={{ cursor: 'pointer', padding: '4px 10px', fontSize: '11px' }}
                      title="Haz clic para alternar estado de válvula"
                    >
                      {valve === 'closed' && <Lock size={12} />}
                      {valve === 'half' && <Zap size={12} />}
                      {valve === 'open' && <Unlock size={12} />}
                      <span>{valveText}</span>
                    </button>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      (Pulsa para alternar)
                    </span>
                  </div>
                )}

                {/* Description tip */}
                {pour.description && (
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                    {pour.description}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
          No hay vertidos configurados para este método.
        </div>
      )}
    </div>
  );
}
