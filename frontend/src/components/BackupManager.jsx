import React, { useState } from 'react';

export default function BackupManager({ showToast }) {
  const [importing, setImporting] = useState(false);

  const handleExport = () => {
    fetch('api/export/json')
      .then(res => res.json())
      .then(data => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `beantag-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        if (showToast) showToast('Backup JSON descargado con éxito.', { type: 'success' });
      })
      .catch(() => {
        if (showToast) showToast('Error al exportar datos.', { type: 'error' });
      });
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        if (window.confirm("¿Seguro que deseas importar? Esto sobrescribirá todos los datos actuales.")) {
          setImporting(true);
          fetch('api/import/json', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(json)
          })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              if (showToast) showToast(data.message, { type: 'success' });
              setTimeout(() => window.location.reload(), 1500);
            } else {
              throw new Error(data.error);
            }
          })
          .catch(err => {
            if (showToast) showToast('Fallo al importar: ' + err.message, { type: 'error' });
          })
          .finally(() => setImporting(false));
        }
      } catch (err) {
        if (showToast) showToast('Archivo JSON corrupto o inválido.', { type: 'error' });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ marginTop: '20px', borderTop: '3px solid #000', paddingTop: '20px' }}>
      <h3 style={{ fontSize: '18px', fontWeight: '900', marginBottom: '10px' }}>💾 RESPALDO Y RESTAURACIÓN</h3>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button className="btn-candy primary" onClick={handleExport}>
          Exportar JSON
        </button>
        <label className="btn-candy" style={{ cursor: 'pointer', display: 'inline-block' }}>
          {importing ? 'Importando...' : 'Importar JSON'}
          <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} disabled={importing} />
        </label>
      </div>
    </div>
  );
}
