import React, { useState, useEffect } from 'react';

export default function BrewHistory() {
  const [history, setHistory] = useState([]);

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

  return (
    <div style={{ padding: '16px 16px 90px 16px' }}>
      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', textTransform: 'uppercase', marginBottom: '14px' }}>
        Bitácoras
      </h2>

      {history.length === 0 ? (
        <div className="candy-card" style={{ textAlign: 'center', padding: '20px' }}>
          <p style={{ fontWeight: 'bold' }}>Aún no has registrado ninguna receta.</p>
        </div>
      ) : (
        history.map(item => (
          <div key={item.id} className="candy-card" style={{ borderLeft: '6px solid var(--color-crimson)', cursor: 'default' }}>
            <div className="card-header-flex">
              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', margin: '0 0 2px 0', textTransform: 'uppercase' }}>{item.method}</h3>
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-navy)', textTransform: 'uppercase' }}>{item.batch_name}</span>
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
