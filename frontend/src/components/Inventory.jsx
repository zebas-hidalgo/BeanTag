import React from 'react';

export default function Inventory({ batches, onSelectBatch, onCreateTrigger }) {
  const cardColors = ['bg-rose', 'bg-peach', 'bg-lime', 'bg-lavender'];

  return (
    <div style={{ padding: '16px 16px 90px 16px' }}>
      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', textTransform: 'uppercase', marginBottom: '14px' }}>
        Mi Congelador
      </h2>

      {batches.length === 0 ? (
        <div className="candy-card bg-rose" style={{ textAlign: 'center', padding: '30px' }} onClick={onCreateTrigger}>
          <p style={{ fontWeight: 'bold' }}>¡No tienes cafés guardados!</p>
          <button className="btn-candy primary" style={{ margin: '10px auto 0 auto' }}>Registrar Primer Lote</button>
        </div>
      ) : (
        batches.map((batch, index) => (
          <div 
            key={batch.id} 
            className={`candy-card ${cardColors[index % cardColors.length]}`}
            onClick={() => onSelectBatch(batch.id)}
          >
            <div className="card-header-flex">
              <div>
                <h3 className="card-title">{batch.name}</h3>
                <p className="card-sub">{batch.producer}</p>
              </div>
              <div className="candy-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" style={{ width: '14px', height: '14px', color: 'var(--color-orange)' }}>
                  <path d="M6 3h12M9 3v11l3 7 3-7V3"/><path d="M12 7h2M12 11h2M12 15h1.5"/>
                </svg>
                <span>{batch.remaining_doses} Dosis</span>
              </div>
            </div>
            <div>
              {batch.altitude && <span className="candy-tag">{batch.altitude}</span>}
              {batch.variety && <span className="candy-tag">{batch.variety}</span>}
              {batch.process && <span className="candy-tag">{batch.process}</span>}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
