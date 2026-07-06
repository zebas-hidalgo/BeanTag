import React, { useState } from 'react';
import { formatLocalDateStr } from '../utils/date';


export default function Inventory({ batches, onSelectBatch, onCreateTrigger, showToast }) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrado de lotes solo por buscador
  const filteredBatches = batches.filter(batch => {
    return (
      batch.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      batch.producer.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleExportBackup = () => {
    fetch('/api/backup/export')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `beantag_backup_${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          if (showToast) {
            showToast('Copia de seguridad exportada con éxito.', { type: 'success', duration: 2500 });
          }
        } else {
          if (showToast) showToast('Error al exportar copia de seguridad.', { type: 'error', duration: 2500 });
        }
      })
      .catch(() => {
        if (showToast) showToast('Error al conectar con el servidor.', { type: 'error', duration: 2500 });
      });
  };

  const handleImportBackup = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const backupData = JSON.parse(event.target.result);
        if (!backupData.batches || !backupData.recipes) {
          if (showToast) showToast('Formato de archivo de respaldo no válido.', { type: 'error', duration: 3000 });
          return;
        }

        if (window.confirm('¿Estás seguro de que quieres importar este respaldo? Esto reemplazará TODOS los datos actuales de la aplicación.')) {
          fetch('/api/backup/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(backupData)
          })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              if (showToast) showToast('Respaldo importado con éxito.', { type: 'success', duration: 3000 });
              window.location.reload();
            } else {
              if (showToast) showToast('Error al importar datos en el servidor.', { type: 'error', duration: 3000 });
            }
          })
          .catch(() => {
            if (showToast) showToast('Error al conectar con el servidor.', { type: 'error', duration: 3000 });
          });
        }
      } catch (err) {
        if (showToast) showToast('Error al leer el archivo JSON.', { type: 'error', duration: 3000 });
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // reset input
  };

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

      {/* Backup and restore section */}
      <div className="candy-card static" style={{ marginTop: '24px', padding: '16px', textAlign: 'center', cursor: 'default' }}>
        <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '10px', textTransform: 'uppercase', margin: '0 0 12px 0', color: 'var(--color-crimson)', letterSpacing: '0.5px' }}>
          Copia de Seguridad y Respaldo
        </h4>
        <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: '0 0 12px 0', lineHeight: 1.4 }}>
          Descarga un archivo con tus lotes y recetas o súbelo para restaurar todos tus datos.
        </p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <button className="btn-candy primary" style={{ margin: 0, fontSize: '11px', padding: '8px 12px' }} onClick={handleExportBackup}>
            📥 Descargar JSON
          </button>
          <label className="btn-candy" style={{ margin: 0, fontSize: '11px', padding: '8px 12px', cursor: 'pointer', display: 'inline-block' }}>
            📤 Cargar JSON
            <input 
              type="file" 
              accept=".json" 
              onChange={handleImportBackup} 
              style={{ display: 'none' }} 
            />
          </label>
        </div>
      </div>
    </div>
  );
}
