import React, { useState, useEffect } from 'react';

export default function BrewHistory({ onNavigateToInventory }) {
  const [history, setHistory] = useState(null); // null = loading, [] = empty

  useEffect(() => {
    let active = true;
    fetch('/api/recipes')
      .then(res => res.json())
      .then(data => {
        if (active) {
          setHistory(data);
        }
      });
    return () => { active = false; };
  }, []);

  // J-Max microns calculator helper
  const parseGrindToMicrons = (grindStr) => {
    if (!grindStr || !grindStr.includes('J-Max:')) return null;
    const parts = grindStr.replace('J-Max:', '').trim().split('.');
    if (parts.length === 3) {
      const rot = parseInt(parts[0]) || 0;
      const num = parseInt(parts[1]) || 0;
      const click = parseInt(parts[2]) || 0;
      const totalClicks = (rot * 90) + (num * 10) + click;
      return Math.round(totalClicks * 8.8); // 8.8 microns per click
    }
    return null;
  };

  // R3: Skeleton loading state
  if (history === null) return (
    <div style={{ padding: '14px 14px 90px 14px' }}>
      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', textTransform: 'uppercase', marginBottom: '14px' }}>
        Bitácoras
      </h2>
      {[1, 2, 3].map(i => (
        <div key={i} className="candy-card skeleton-card" style={{ cursor: 'default', height: '90px' }}>
          <div className="skeleton-line" style={{ width: '50%', height: '14px' }} />
          <div className="skeleton-line" style={{ width: '80%', height: '10px', marginTop: '10px' }} />
          <div className="skeleton-line" style={{ width: '30%', height: '10px', marginTop: '6px' }} />
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ padding: '14px 14px 90px 14px' }}>
      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', textTransform: 'uppercase', marginBottom: '14px' }}>
        Bitácoras
      </h2>

      {history.length === 0 ? (
        /* R8: Empty state CTA with guidance */
        <div className="candy-card" style={{ textAlign: 'center', padding: '30px', cursor: 'default' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>☕</div>
          <p style={{ fontWeight: 'bold', margin: '0 0 6px 0' }}>Aún no has registrado ninguna receta.</p>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: '0 0 16px 0' }}>
            Selecciona un café del congelador y registra tu primera preparación.
          </p>
          <button className="btn-candy primary" style={{ margin: '0 auto' }} onClick={onNavigateToInventory}>
            Ir al Congelador
          </button>
        </div>
      ) : (
        history.map(item => {
          const microns = parseGrindToMicrons(item.grind);
          return (
            <div key={item.id} className="candy-card" style={{ borderLeft: '6px solid var(--color-crimson)', cursor: 'default' }}>
              <div className="card-header-flex">
                <div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '14px', margin: '0 0 2px 0', textTransform: 'uppercase' }}>{item.method}</h3>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>{item.batch_name}</span>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#4A5568' }}>
                  {new Date(item.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                </span>
              </div>
              <div style={{ fontSize: '12px', marginTop: '8px', borderTop: '1px solid #E2E8F0', paddingTop: '6px' }}>
                <p style={{ margin: '2px 0' }}>
                  <strong>Molienda:</strong> {item.grind || 'N/A'} {microns ? `(~${microns} µm)` : ''} | <strong>Ratio:</strong> {item.ratio || 'N/A'}
                </p>
                
                {/* Sensory properties tag row (Balance, Body, Extraction) */}
                {(item.sensory_balance || item.sensory_body || item.sensory_extraction) && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', margin: '6px 0' }}>
                    {item.sensory_balance && (
                      <span style={{ fontSize: '9px', fontWeight: 'bold', background: '#FEEBC8', color: '#C05621', padding: '2px 6px', borderRadius: '4px', border: '1px solid #FBD38D' }}>
                        ⚖️ {item.sensory_balance}
                      </span>
                    )}
                    {item.sensory_body && (
                      <span style={{ fontSize: '9px', fontWeight: 'bold', background: '#EBF8FF', color: '#2B6CB0', padding: '2px 6px', borderRadius: '4px', border: '1px solid #BEE3F8' }}>
                        🍯 {item.sensory_body}
                      </span>
                    )}
                    {item.sensory_extraction && (
                      <span style={{
                        fontSize: '9px', fontWeight: 'bold',
                        background: item.sensory_extraction === 'En Punto' ? '#C6F6D5' : '#FED7D7',
                        color: item.sensory_extraction === 'En Punto' ? '#22543D' : '#9B2C2C',
                        padding: '2px 6px', borderRadius: '4px',
                        border: item.sensory_extraction === 'En Punto' ? '1px solid #9AE6B4' : '1px solid #FEB2B2'
                      }}>
                        🧪 {item.sensory_extraction === 'Sub' ? 'Sub-ext' : item.sensory_extraction === 'Sobre' ? 'Sobre-ext' : 'En Punto'}
                      </span>
                    )}
                  </div>
                )}

                {item.notes && <p style={{ margin: '4px 0 2px 0', fontStyle: 'italic', color: 'var(--color-text)' }}><strong>Notas:</strong> {item.notes}</p>}
                
                <p style={{ margin: '6px 0 0 0', fontSize: '12px', fontWeight: 'bold' }}>
                  Puntuación: <span style={{ color: 'var(--color-crimson)' }}>{'★'.repeat(item.rating || 5)}{'☆'.repeat(5 - (item.rating || 5))}</span> ({item.rating || 5}/5)
                </p>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
