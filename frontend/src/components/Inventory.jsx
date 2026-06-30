import React, { useState } from 'react';

export default function Inventory({ batches, onSelectBatch, onCreateTrigger, onScanSimulate }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roastFilter, setRoastFilter] = useState('ALL');

  // Filtrado de lotes
  const filteredBatches = batches.filter(batch => {
    const matchesSearch = 
      batch.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      batch.producer.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRoast = 
      roastFilter === 'ALL' || 
      (batch.roast_level || 'Medio').toUpperCase() === roastFilter;
      
    return matchesSearch && matchesRoast;
  });

  return (
    <div style={{ padding: '16px 16px 90px 16px' }}>
      {/* Search bar */}
      <input 
        className="candy-input" 
        placeholder="🔍 Buscar café o productor..." 
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{ marginBottom: '10px' }}
      />

      {/* Roast level filters */}
      <div className="filter-toolbar">
        <button className={`filter-btn ${roastFilter === 'ALL' ? 'active' : ''}`} onClick={() => setRoastFilter('ALL')}>Todos</button>
        <button className={`filter-btn ${roastFilter === 'CLARO' ? 'active' : ''}`} onClick={() => setRoastFilter('CLARO')}>Claro (Light)</button>
        <button className={`filter-btn ${roastFilter === 'MEDIO' ? 'active' : ''}`} onClick={() => setRoastFilter('MEDIO')}>Medio (Medium)</button>
        <button className={`filter-btn ${roastFilter === 'OSCURO' ? 'active' : ''}`} onClick={() => setRoastFilter('OSCURO')}>Oscuro (Dark)</button>
      </div>

      {filteredBatches.length === 0 ? (
        <div className="candy-card" style={{ textAlign: 'center', padding: '30px' }} onClick={onCreateTrigger}>
          <p style={{ fontWeight: 'bold' }}>¡No se encontraron cafés!</p>
          <button className="btn-candy primary" style={{ margin: '10px auto 0 auto' }}>Registrar Primer Lote</button>
        </div>
      ) : (
        filteredBatches.map(batch => {
          const isLowStock = batch.remaining_doses <= 2;
          return (
            <div 
              key={batch.id} 
              className={`candy-card ${isLowStock ? 'low-stock' : ''}`}
              onClick={() => onSelectBatch(batch.id)}
            >
              <div className="card-header-flex">
                <div>
                  <h3 className="card-title">{batch.name}</h3>
                  <p className="card-sub">{batch.producer}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <span className="mono-lbl-tag">{batch.origin || 'N/A'}</span>
                  {batch.roast_date && (
                    <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#718096' }}>
                      Tueste: {new Date(batch.roast_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </div>
              </div>
              <div className="mono-badge-row">
                <span className="mono-lbl-tag outline">{batch.remaining_doses} Dosis</span>
                <span className="mono-lbl-tag outline">{batch.roast_level || 'Medio'}</span>
                {isLowStock && <span className="mono-lbl-tag" style={{ background: '#E53E3E' }}>¡Últimos tubos!</span>}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
