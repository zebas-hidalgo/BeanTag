import React, { useState } from 'react';
import { Moon, Sun, Download, Upload, Nfc, FileSpreadsheet } from 'lucide-react';
import NfcToolsModal from './NfcToolsModal';

export default function Settings({ showToast }) {
  const [showNfcModal, setShowNfcModal] = useState(false);
  const [pendingImportData, setPendingImportData] = useState(null);
  const [importMode, setImportMode] = useState('merge');
  const [apiKey, setApiKey] = React.useState(() => {
    return localStorage.getItem('gemini-api-key') || '';
  });

  const handleSaveKey = () => {
    localStorage.setItem('gemini-api-key', apiKey);
    if (showToast) {
      showToast('Clave API de Gemini guardada correctamente.', { type: 'success', duration: 2500 });
    }
  };

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

  const handleExportCsv = () => {
    window.open('/api/backup/export/csv', '_blank');
    if (showToast) {
      showToast('Generando descarga de bitácora en CSV...', { type: 'success', duration: 2500 });
    }
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
        setPendingImportData(backupData);
      } catch (err) {
        if (showToast) showToast('Error al leer el archivo JSON.', { type: 'error', duration: 3000 });
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // reset input
  };

  const confirmImportWithMode = () => {
    if (!pendingImportData) return;
    fetch('/api/backup/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...pendingImportData, mode: importMode })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        if (showToast) showToast('Respaldo procesado con éxito.', { type: 'success', duration: 3000 });
        setPendingImportData(null);
        window.location.reload();
      } else {
        if (showToast) showToast('Error al importar datos.', { type: 'error', duration: 3000 });
      }
    })
    .catch(() => {
      if (showToast) showToast('Error de conexión con el servidor.', { type: 'error', duration: 3000 });
    });
  };

  return (
    <div style={{ padding: '14px 14px 90px 14px' }}>
      <h2 style={{ fontFamily: 'var(--font-heading)', textTransform: 'uppercase', margin: '0 0 14px 0', fontSize: '16px' }}>
        Ajustes y Configuración
      </h2>

      {/* Inteligencia Artificial (Gemini) */}
      <div className="candy-card static" style={{ padding: '20px', cursor: 'default', marginBottom: '14px' }}>
        <div>
          <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '12px', textTransform: 'uppercase', margin: '0 0 4px 0', color: 'var(--color-text)', letterSpacing: '0.5px' }}>
            Inteligencia Artificial (Gemini)
          </h4>
          <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: '0 0 12px 0' }}>
            Añade tu clave API para habilitar recomendaciones de recetas personalizadas basadas en el origen, variedad y proceso del café.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input 
              type="text" 
              className="candy-input" 
              value={apiKey} 
              onChange={(e) => setApiKey(e.target.value)} 
              placeholder="Introduce tu clave API (AIzaSy...)"
              style={{ flex: 1, boxSizing: 'border-box', fontFamily: 'var(--font-mono)', minWidth: 0 }}
            />
            <button 
              onClick={handleSaveKey} 
              className="btn-candy primary"
              style={{ margin: 0, padding: '10px 14px', fontSize: '11px', whiteSpace: 'nowrap' }}
            >
              Guardar
            </button>
          </div>
          <a 
            href="https://aistudio.google.com/app/apikey" 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{ fontSize: '10px', color: 'var(--color-crimson)', textDecoration: 'underline', fontWeight: 'bold' }}
          >
            Obtener clave API gratuita en Google AI Studio →
          </a>
        </div>
      </div>

      {/* Backup and restore section */}
      <div className="candy-card static" style={{ padding: '20px', cursor: 'default' }}>
        <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '11px', textTransform: 'uppercase', margin: '0 0 12px 0', color: 'var(--color-crimson)', letterSpacing: '0.5px' }}>
          Copia de Seguridad
        </h4>
        <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: '0 0 16px 0', lineHeight: 1.4 }}>
          Exporta tu bitácora o restaura un respaldo en cualquier dispositivo.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-candy" style={{ margin: 0, fontSize: '11px', padding: '10px 14px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} onClick={handleExportBackup}>
              <Download size={14} strokeWidth={2.5} />
              JSON Backup
            </button>
            <button className="btn-candy" style={{ margin: 0, fontSize: '11px', padding: '10px 14px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} onClick={handleExportCsv}>
              <FileSpreadsheet size={14} strokeWidth={2.5} />
              Exportar CSV
            </button>
          </div>
          <label className="btn-candy primary" style={{ margin: 0, fontSize: '11.5px', padding: '12px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%', boxSizing: 'border-box' }}>
            <Upload size={16} strokeWidth={2.5} />
            Cargar Respaldo JSON
            <input 
              type="file" 
              accept=".json" 
              onChange={handleImportBackup} 
              style={{ display: 'none' }} 
            />
          </label>
        </div>
      </div>

      {/* Herramientas WebNFC */}
      <div className="candy-card static" style={{ padding: '20px', cursor: 'default', marginTop: '14px' }}>
        <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '11px', textTransform: 'uppercase', margin: '0 0 4px 0', color: 'var(--color-text)', letterSpacing: '0.5px' }}>
          Gestión Avanzada WebNFC
        </h4>
        <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: '0 0 12px 0', lineHeight: 1.4 }}>
          Diagnostica etiquetas, borra registros nulos o clona lotes en serie a múltiples tubos/frascos.
        </p>
        <button
          type="button"
          className="btn-candy primary"
          onClick={() => setShowNfcModal(true)}
          style={{ width: '100%', margin: 0, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          <Nfc size={16} />
          Abrir Herramientas WebNFC
        </button>
      </div>

      {showNfcModal && (
        <NfcToolsModal onClose={() => setShowNfcModal(false)} showToast={showToast} />
      )}

      {pendingImportData && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div className="candy-card static" style={{ width: '100%', maxWidth: '350px', padding: '20px', cursor: 'default' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', margin: '0 0 16px 0', fontSize: '16px' }}>Importar Respaldo</h3>
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '16px', lineHeight: 1.4 }}>
              ¿Cómo deseas procesar los datos importados?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="importMode" 
                  value="merge" 
                  checked={importMode === 'merge'} 
                  onChange={(e) => setImportMode(e.target.value)} 
                />
                <strong>Fusionar:</strong> Agrega los registros nuevos y mantiene los actuales.
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="importMode" 
                  value="replace" 
                  checked={importMode === 'replace'} 
                  onChange={(e) => setImportMode(e.target.value)} 
                />
                <strong>Reemplazar:</strong> Borra TODO y usa solo los datos del respaldo.
              </label>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="btn-candy" 
                style={{ flex: 1, padding: '10px', margin: 0 }}
                onClick={() => setPendingImportData(null)}
              >
                Cancelar
              </button>
              <button 
                className="btn-candy primary" 
                style={{ flex: 1, padding: '10px', margin: 0 }}
                onClick={confirmImportWithMode}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '40px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
        <p style={{ fontWeight: 'bold', margin: 0 }}>BeanTag Coffee Bitácora</p>
        <p style={{ margin: '4px 0 0 0' }}>Versión 1.2.0 • Home Barista Edition</p>
      </div>
    </div>
  );
}
