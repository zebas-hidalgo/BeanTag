import React from 'react';
import { Moon, Sun } from 'lucide-react';
import BackupManager from './BackupManager';

export default function Settings({ showToast, isDarkMode, setIsDarkMode, theme, setTheme }) {
  const [apiKey, setApiKey] = React.useState(() => {
    return localStorage.getItem('gemini-api-key') || '';
  });

  const handleSaveKey = () => {
    localStorage.setItem('gemini-api-key', apiKey);
    if (showToast) {
      showToast('Clave API de Gemini guardada correctamente.', { type: 'success', duration: 2500 });
    }
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

      <BackupManager showToast={showToast} />

      {/* Acerca de */}
      <div className="candy-card static" style={{ padding: '20px', cursor: 'default', marginTop: '14px' }}>
        <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '11px', textTransform: 'uppercase', margin: '0 0 10px 0', color: 'var(--color-crimson)', letterSpacing: '0.5px' }}>
          Acerca de BeanTag
        </h4>
        <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: '0 0 12px 0', lineHeight: 1.4 }}>
          BeanTag es una bitácora digital de especialidad para baristas y apasionados del café. Registra tu inventario, calibra tus recetas y comparte tus extracciones. Integra enlaces físicos NFC (tags NTAG213) para automatizar el acceso a cada lote de café.
        </p>
        <div style={{ fontSize: '11px', borderTop: '2px solid var(--border-color)', paddingTop: '10px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div><strong>Versión:</strong> v1.0.0 (Lanzamiento Estable)</div>
          <div><strong>Licencia:</strong> MIT License</div>
          <div>
            <strong>Código Fuente:</strong>{' '}
            <a 
              href="https://github.com/zebas-hidalgo/BeanTag" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ color: 'var(--color-crimson)', textDecoration: 'underline', fontWeight: 'bold' }}
            >
              github.com/zebas-hidalgo/BeanTag
            </a>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '40px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
        <p style={{ fontWeight: 'bold', margin: 0 }}>BeanTag Coffee Bitácora</p>
        <p style={{ margin: '4px 0 0 0' }}>Versión 1.0.0 • Home Barista Edition</p>
      </div>
    </div>
  );
}
