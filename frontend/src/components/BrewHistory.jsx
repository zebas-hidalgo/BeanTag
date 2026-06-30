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
    <div style={{ padding: '16px 16px 90px 16px' }}>
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
        history.map(item => (
          <div key={item.id} className="candy-card" style={{ borderLeft: '6px solid var(--color-crimson)', cursor: 'default' }}>
            <div className="card-header-flex">
              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', margin: '0 0 2px 0', textTransform: 'uppercase' }}>{item.method}</h3>
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>{item.batch_name}</span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#4A5568' }}>
                {new Date(item.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
              </span>
            </div>
            <div style={{ fontSize: '12px', marginTop: '8px', borderTop: '1px solid #E2E8F0', paddingTop: '6px' }}>
              <p style={{ margin: '2px 0' }}><strong>Molienda:</strong> {item.grind || 'N/A'} | <strong>Ratio:</strong> {item.ratio || 'N/A'}</p>
              {item.notes && <p style={{ margin: '2px 0', fontStyle: 'italic' }}><strong>Cata:</strong> {item.notes}</p>}
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', fontWeight: 'bold' }}>
                Puntuación: <span style={{ color: 'var(--color-crimson)' }}>{'★'.repeat(item.rating || 5)}{'☆'.repeat(5 - (item.rating || 5))}</span> ({item.rating || 5}/5)
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
