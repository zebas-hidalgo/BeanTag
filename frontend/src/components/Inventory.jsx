import React, { useState } from 'react';
import { formatLocalDateStr } from '../utils/date';
import { Plus } from 'lucide-react';

export default function Inventory({ batches, onSelectBatch, onCreateTrigger }) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrado de lotes solo por buscador
  const filteredBatches = batches.filter(batch => {
    return (
      batch.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      batch.producer.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div style={{ padding: '14px 14px 90px 14px' }}>
      {/* Search bar */}
      <input 
        className="candy-input" 
        placeholder="Buscar café o productor..." 
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{ marginBottom: '16px' }}
      />

      {filteredBatches.length === 0 ? (
        <div className="candy-card" style={{ textAlign: 'center', padding: '30px' }} onClick={onCreateTrigger}>
          <p style={{ fontWeight: 'bold' }}>¡No se encontraron cafés!</p>
          <button className="btn-candy primary" style={{ margin: '10px auto 0 auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} strokeWidth={2.5} />
            Registrar Primer Lote
          </button>
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
                      🔥 Tueste: {formatLocalDateStr(batch.roast_date, true)}
                    </span>
                  )}
                </div>
              </div>
              <div className="mono-badge-row">
                <span className="mono-lbl-tag outline">{batch.remaining_doses} Dosis ({batch.remaining_weight_g || 0}g)</span>
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
