import React from 'react';
import { Moon, Sun, Download, Upload } from 'lucide-react';

export default function Settings({ showToast, isDarkMode, setIsDarkMode, theme, setTheme }) {
  const [apiKey, setApiKey] = React.useState(() => {
    return localStorage.getItem('gemini-api-key') || '';
  });

  const saveApiKey = (val) => {
    setApiKey(val);
    localStorage.setItem('gemini-api-key', val);
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
      <h2 style={{ fontFamily: 'var(--font-heading)', textTransform: 'uppercase', margin: '0 0 14px 0', fontSize: '16px' }}>
        Ajustes y Configuración
      </h2>

      {/* Tema Visual */}
      <div className="candy-card static" style={{ padding: '20px', cursor: 'default', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div>
          <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '12px', textTransform: 'uppercase', margin: '0 0 4px 0', color: 'var(--color-text)', letterSpacing: '0.5px' }}>
            Modo Oscuro
          </h4>
          <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: 0 }}>
            Cambia a un diseño de bajo brillo
          </p>
        </div>
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)} 
          className="btn-candy" 
          style={{ padding: '8px', margin: 0, minHeight: 'auto' }}
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      {/* Selector de Tema */}
      <div className="candy-card static" style={{ padding: '20px', cursor: 'default', marginBottom: '14px' }}>
        <div>
          <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '12px', textTransform: 'uppercase', margin: '0 0 4px 0', color: 'var(--color-text)', letterSpacing: '0.5px' }}>
            Temas de Color
          </h4>
          <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: '0 0 12px 0' }}>
            Elige una paleta de colores personalizada
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(105px, 1fr))', gap: '8px' }}>
          {[
            { id: 'tema1', name: 'Mocha Rosé' },
            { id: 'tema2', name: 'Matcha Tonic' },
            { id: 'tema3', name: 'Cyber Geisha' },
            { id: 'tema4', name: 'Tueste Dorado' },
            { id: 'tema5', name: 'Cold Brew Violet' }
          ].map((t) => {
            const isActive = theme === t.id;
            return (
              <button 
                key={t.id}
                onClick={() => setTheme(t.id)} 
                className="btn-candy"
                style={{ 
                  margin: 0, 
                  fontSize: '10px', 
                  padding: '8px 4px', 
                  border: '2px solid var(--border-color)',
                  backgroundColor: isActive ? 'var(--color-crimson)' : 'var(--bg-card)',
                  color: isActive ? '#FFFFFF' : 'var(--color-text)',
                  boxShadow: isActive ? 'none' : '3px 3px 0px var(--border-color)',
                  transform: isActive ? 'translate(2px, 2px)' : 'none',
                  fontWeight: 'bold',
                  lineHeight: '1.2'
                }}
              >
                {t.name}
              </button>
            );
          })}
        </div>
      </div>

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
          <input 
            type="text" 
            className="candy-input" 
            value={apiKey} 
            onChange={(e) => saveApiKey(e.target.value)} 
            placeholder="Introduce tu clave API (AIzaSy...)"
            style={{ width: '100%', boxSizing: 'border-box', fontFamily: 'var(--font-mono)' }}
          />
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
          Copia de Seguridad (JSON)
        </h4>
        <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: '0 0 16px 0', lineHeight: 1.4 }}>
          Descarga una copia local con todos tus lotes de café, recetas y notas, o cárgala para restaurarla en cualquier dispositivo.
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-candy primary" style={{ margin: 0, fontSize: '11.5px', padding: '10px 14px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} onClick={handleExportBackup}>
            <Download size={16} strokeWidth={2.5} />
            Descargar Respaldo
          </button>
          <label className="btn-candy" style={{ margin: 0, fontSize: '11.5px', padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flex: 1, boxSizing: 'border-box' }}>
            <Upload size={16} strokeWidth={2.5} />
            Cargar Respaldo
            <input 
              type="file" 
              accept=".json" 
              onChange={handleImportBackup} 
              style={{ display: 'none' }} 
            />
          </label>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '40px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
        <p style={{ fontWeight: 'bold', margin: 0 }}>BeanTag Coffee Bitácora</p>
        <p style={{ margin: '4px 0 0 0' }}>Versión 1.2.0 • Home Barista Edition</p>
      </div>
    </div>
  );
}
