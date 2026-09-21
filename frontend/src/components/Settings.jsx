import React, { useState } from 'react';
import { Moon, Sun, Download, Upload, Nfc, FileSpreadsheet, Activity, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import NfcToolsModal from './NfcToolsModal';
import { apiUrl } from '../utils/api';

export default function Settings({ theme, setTheme, batches = [], showToast }) {
  const [showNfcModal, setShowNfcModal] = useState(false);
  const [pendingImportData, setPendingImportData] = useState(null);
  const [importMode, setImportMode] = useState('merge');
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('gemini-api-key') || '';
  });
  const [selectedModel, setSelectedModel] = useState(() => {
    const stored = localStorage.getItem('gemini-model');
    if (!stored || stored.includes('2.0') || stored.includes('1.5') || stored.includes('3.7') || stored === 'gemini-2.5-flash') {
      localStorage.setItem('gemini-model', 'gemini-3.6-flash');
      return 'gemini-3.6-flash';
    }
    return stored;
  });
  const [isThinkingEnabled, setIsThinkingEnabled] = useState(() => {
    return localStorage.getItem('gemini-thinking') === 'true';
  });
  const [testingGemini, setTestingGemini] = useState(false);
  const [geminiTestResult, setGeminiTestResult] = useState(null);
  const [defaultGrinder, setDefaultGrinder] = useState(() => {
    return localStorage.getItem('default-grinder') || 'jmax';
  });

  const [cardStyle, setCardStyle] = useState(() => {
    try {
      return localStorage.getItem('beantag-inventory-style') || 'editorial';
    } catch (e) {
      return 'editorial';
    }
  });

  const handleCardStyleChange = (style) => {
    setCardStyle(style);
    try {
      localStorage.setItem('beantag-inventory-style', style);
      window.dispatchEvent(new Event('beantag-inventory-style-changed'));
    } catch (e) {}
    if (navigator.vibrate) {
      try { navigator.vibrate(8); } catch (err) {}
    }
    const names = {
      editorial: '🏷️ Editorial (Nordic)',
      list: '📋 Lista (Cupertino)',
      archive: '📐 Archivo (Tokyo Lab)'
    };
    if (showToast) {
      showToast(`Estilo de inventario: ${names[style] || style}`, { type: 'success', duration: 2000 });
    }
  };

  const handleSaveKey = () => {
    localStorage.setItem('gemini-api-key', apiKey);
    localStorage.setItem('gemini-model', selectedModel);
    localStorage.setItem('gemini-thinking', isThinkingEnabled ? 'true' : 'false');
    localStorage.setItem('default-grinder', defaultGrinder);
    if (showToast) {
      showToast('Configuración guardada correctamente.', { type: 'success', duration: 2500 });
    }
  };

  const handleTestGemini = async () => {
    setTestingGemini(true);
    setGeminiTestResult(null);
    try {
      const res = await fetch(apiUrl('api/test-gemini'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: apiKey.trim() || undefined,
          model: selectedModel || undefined
        })
      });
      const data = await res.json();
      setGeminiTestResult(data);
      if (data.success) {
        if (showToast) showToast(`✅ Conexión con Gemini exitosa (${data.model})`, { type: 'success', duration: 3000 });
      } else {
        if (showToast) showToast(`❌ Error: ${data.message || data.error}`, { type: 'error', duration: 4000 });
      }
    } catch (err) {
      const fail = { success: false, error: 'network_error', message: `Fallo de conexión con el servidor: ${err.message}` };
      setGeminiTestResult(fail);
      if (showToast) showToast('Error de conexión con el servidor.', { type: 'error', duration: 3500 });
    } finally {
      setTestingGemini(false);
    }
  };

  const handleModelChange = (newModel) => {
    setSelectedModel(newModel);
    localStorage.setItem('gemini-model', newModel);
    if (showToast) {
      showToast(`Modelo cambiado a ${newModel}.`, { type: 'info', duration: 2000 });
    }
  };

  const handleToggleThinking = () => {
    const newVal = !isThinkingEnabled;
    setIsThinkingEnabled(newVal);
    localStorage.setItem('gemini-thinking', newVal ? 'true' : 'false');
    if (showToast) {
      showToast(newVal ? 'Modo Pensamiento (Thinking) Activado.' : 'Modo Rápido Activado.', { type: 'info', duration: 2000 });
    }
  };

  const handleExportBackup = () => {
    fetch(apiUrl('api/backup/export'))
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
    window.open(apiUrl('api/backup/export/csv'), '_blank');
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
    fetch(apiUrl('api/backup/import'), {
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
    <div style={{ padding: '12px 12px 0 12px' }}>
      <h2 style={{ fontFamily: 'var(--font-heading)', textTransform: 'uppercase', margin: '0 0 14px 0', fontSize: '16px' }}>
        Ajustes y Configuración
      </h2>

      {/* Estilo Visual del Inventario */}
      <div className="candy-card static" style={{ padding: '20px', cursor: 'default', marginBottom: '14px' }}>
        <div>
          <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '12px', textTransform: 'uppercase', margin: '0 0 4px 0', color: 'var(--color-text)', letterSpacing: '0.5px' }}>
            🎛️ Estilo Visual del Inventario
          </h4>
          <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: '0 0 12px 0' }}>
            Elige cómo se presentan las tarjetas de café en tu congelador por defecto
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
          {[
            { 
              id: 'editorial', 
              name: '🏷️ Editorial', 
              subtitle: 'Nordic Atelier', 
              desc: 'Respiro nórdico, chips pastel, cápsula de stock y botón rápido.' 
            },
            { 
              id: 'list', 
              name: '📋 Lista', 
              subtitle: 'Cupertino Table', 
              desc: 'Filas compactas (~52px), pastilla de stock y flecha indicadora.' 
            },
            { 
              id: 'archive', 
              name: '📐 Archivo', 
              subtitle: 'Tokyo Coffee Lab', 
              desc: 'Ficha técnica monoespaciada, código #01 • LOT y matriz 2x2.' 
            }
          ].map((item) => {
            const isActive = cardStyle === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleCardStyleChange(item.id)}
                style={{
                  margin: 0,
                  fontSize: '11px',
                  padding: '12px 10px',
                  borderRadius: '14px',
                  border: isActive ? '2px solid var(--color-crimson)' : '1.5px solid var(--border-color)',
                  backgroundColor: isActive ? 'var(--bg-header)' : 'var(--bg-card)',
                  color: 'var(--color-text)',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '5px',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <span style={{ fontSize: '12px', fontWeight: '800' }}>{item.name}</span>
                  {isActive && (
                    <span style={{ 
                      fontSize: '9px', 
                      background: 'var(--color-crimson)', 
                      color: '#FFFFFF', 
                      padding: '2px 5px', 
                      borderRadius: '4px', 
                      fontWeight: '800' 
                    }}>
                      ACTIVO
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '10px', color: 'var(--color-crimson)', fontWeight: '700' }}>
                  {item.subtitle}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', lineHeight: 1.3 }}>
                  {item.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Temas Visuales de Fantasía */}
      <div className="candy-card static" style={{ padding: '20px', cursor: 'default', marginBottom: '14px' }}>
        <div>
          <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '12px', textTransform: 'uppercase', margin: '0 0 4px 0', color: 'var(--color-text)', letterSpacing: '0.5px' }}>
            🎨 Temas Visuales de Fantasía
          </h4>
          <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: '0 0 12px 0' }}>
            Elige una paleta Neobrutalista inspirada en el café de especialidad
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
          {[
            { id: 'matcha', name: '🌿 Organic Matcha', desc: 'Menta & Miel', colors: ['#FFFFFF', '#ECFDF5', '#059669', '#D97706'] },
            { id: 'espresso', name: '☕ Espresso Terracotta', desc: 'Terracotta & Caramelo', colors: ['#FFFFFF', '#FFF5F5', '#E76F51', '#F4A261'] },
            { id: 'cyber', name: '⚡ Cyber Kinetic', desc: 'Azul Lab & Cinabrio', colors: ['#FFFFFF', '#EFF6FF', '#2563EB', '#FF5E36'] },
            { id: 'sakura', name: '🌸 Sakura Cold Brew', desc: 'Rosa Cryo & Floral', colors: ['#FFFFFF', '#FDF2F8', '#EC4899', '#D946EF'] },
            { id: 'caramel', name: '🍯 Amber Caramel', desc: 'Ámbar & Avellana', colors: ['#FFFFFF', '#FFFBEB', '#D97706', '#B45309'] },
            { id: 'frost', name: '🧊 Nordic Frost', desc: 'Hielo Ártico & Púrpura', colors: ['#FFFFFF', '#F0F9FF', '#0284C7', '#6366F1'] }
          ].map((t) => {
            const isActive = (theme || 'matcha') === t.id;
            return (
              <button 
                key={t.id}
                type="button"
                onClick={() => {
                  setTheme(t.id);
                  localStorage.setItem('beantag-theme', t.id);
                  document.documentElement.setAttribute('data-theme', t.id);
                  if (showToast) showToast(`Tema ${t.name} aplicado.`, { type: 'success', duration: 2000 });
                }} 
                style={{ 
                  margin: 0, 
                  fontSize: '11px', 
                  padding: '10px 8px', 
                  borderRadius: '14px',
                  border: isActive ? '2px solid var(--color-crimson)' : '1.5px solid var(--border-color)',
                  backgroundColor: isActive ? 'var(--bg-header)' : 'var(--bg-card)',
                  color: 'var(--color-text)',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  transform: isActive ? 'scale(1.03)' : 'scale(1)',
                  fontWeight: 'bold',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span style={{ fontSize: '11.5px', fontWeight: 'bold' }}>{t.name}</span>
                <span style={{ fontSize: '9.5px', color: 'var(--color-text-muted)', fontWeight: 'normal' }}>{t.desc}</span>
                <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                  {t.colors.map((c, idx) => (
                    <span 
                      key={idx} 
                      style={{ 
                        width: '12px', 
                        height: '12px', 
                        borderRadius: '50%', 
                        backgroundColor: c, 
                        border: '1px solid var(--border-color)',
                        display: 'inline-block'
                      }} 
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Inteligencia Artificial (Gemini Core) */}
      <div className="candy-card static" style={{ padding: '20px', cursor: 'default', marginBottom: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '13px', textTransform: 'uppercase', margin: 0, color: 'var(--color-text)', letterSpacing: '0.5px' }}>
              Inteligencia Artificial (Gemini Core)
            </h4>
            <span style={{ fontSize: '10px', background: 'var(--bg-header)', color: 'var(--color-crimson)', padding: '3px 8px', borderRadius: '6px', fontWeight: '900', border: '1px solid var(--border-color)' }}>
              {selectedModel.toUpperCase()}
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: '0 0 14px 0', lineHeight: 1.4 }}>
            Potencia el escaneo OCR de bolsas con cámara, el sommelier de inventario y la recomendación experta de recetas con fallback offline.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* API Key Input + Action Buttons */}
          <div>
            <label className="barista-label" style={{ marginBottom: '6px' }}>Clave API de Google AI Studio</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch', flexWrap: 'wrap' }}>
              <input 
                type="password" 
                className="candy-input" 
                value={apiKey} 
                onChange={(e) => setApiKey(e.target.value)} 
                placeholder="Introduce tu clave API (AIzaSy...)"
                style={{ flex: 1, boxSizing: 'border-box', fontFamily: 'var(--font-mono)', minWidth: '180px', minHeight: '44px', fontSize: '13px' }}
              />
              <button 
                onClick={handleSaveKey} 
                className="btn-candy primary"
                style={{ margin: 0, padding: '10px 18px', fontSize: '13px', whiteSpace: 'nowrap', minHeight: '44px', fontWeight: 'bold' }}
              >
                Guardar
              </button>
              <button 
                onClick={handleTestGemini} 
                disabled={testingGemini}
                className="btn-candy"
                style={{ 
                  margin: 0, 
                  padding: '10px 16px', 
                  fontSize: '13px', 
                  whiteSpace: 'nowrap', 
                  minHeight: '44px', 
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {testingGemini ? <Loader2 size={16} className="spin" /> : <Activity size={16} color="var(--color-crimson)" />}
                <span>{testingGemini ? 'Probando...' : 'Probar Conexión'}</span>
              </button>
            </div>
          </div>

          {/* Test Status Feedback Pill */}
          {geminiTestResult && (
            <div 
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                backgroundColor: geminiTestResult.success ? 'var(--barista-accent-mint-subtle, #ECFDF5)' : 'var(--barista-accent-danger-subtle, #FEF2F2)',
                border: geminiTestResult.success ? '1.5px solid #10B981' : '1.5px solid #EF4444',
                color: geminiTestResult.success ? '#065F46' : '#991B1B'
              }}
            >
              {geminiTestResult.success ? (
                <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '1px', color: '#10B981' }} />
              ) : (
                <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '1px', color: '#EF4444' }} />
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                <span style={{ fontWeight: '800' }}>
                  {geminiTestResult.success ? 'Conexión Exitosa con Gemini' : 'Error de Conexión'}
                </span>
                <span style={{ fontSize: '11px', lineHeight: 1.35 }}>
                  {geminiTestResult.message || geminiTestResult.error}
                </span>
                {geminiTestResult.latency_ms && (
                  <span style={{ fontSize: '10px', fontWeight: 'bold', opacity: 0.85, marginTop: '2px' }}>
                    ⏱️ Latencia: {geminiTestResult.latency_ms}ms • Modelo: {geminiTestResult.model}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Model Selector & Thinking Config */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div>
              <label className="barista-label" style={{ marginBottom: '6px' }}>
                Modelo de Inteligencia Artificial
              </label>
              <select 
                className="candy-input" 
                value={selectedModel} 
                onChange={(e) => handleModelChange(e.target.value)}
                style={{ fontSize: '12px', padding: '10px 12px', minHeight: '44px', width: '100%' }}
              >
                <option value="gemini-3.6-flash">Gemini 3.6 Flash (Recomendado - Máxima Precisión & Velocidad)</option>
                <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash-Lite (Ultra Rápido & Eficiente)</option>
                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro (Máximo Razonamiento & OCR)</option>
              </select>
            </div>

            <div>
              <label className="barista-label" style={{ marginBottom: '6px' }}>
                Modo Pensamiento (Thinking)
              </label>
              <button
                type="button"
                onClick={handleToggleThinking}
                style={{
                  width: '100%',
                  minHeight: '44px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: isThinkingEnabled ? '2px solid var(--color-crimson)' : '1.5px solid var(--border-color)',
                  backgroundColor: isThinkingEnabled ? 'var(--bg-header)' : 'var(--bg-card)',
                  color: 'var(--color-text)',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                {isThinkingEnabled ? '🧠 Razonamiento: ACTIVO' : '⚡ Modo Rápido (Off)'}
              </button>
            </div>
          </div>

          <a 
            href="https://aistudio.google.com/app/apikey" 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{ fontSize: '11px', color: 'var(--color-crimson)', textDecoration: 'underline', fontWeight: 'bold' }}
          >
            Obtener clave API gratuita en Google AI Studio →
          </a>
        </div>
      </div>

      {/* Preferencia de Molino Predeterminado */}
      <div className="candy-card static" style={{ padding: '20px', cursor: 'default', marginBottom: '14px' }}>
        <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '12px', textTransform: 'uppercase', margin: '0 0 4px 0', color: 'var(--color-text)', letterSpacing: '0.5px' }}>
          Molino Predeterminado
        </h4>
        <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: '0 0 12px 0' }}>
          Selecciona tu molino principal para precargar sus diales y física en cada nueva receta.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {[
            { id: 'jmax', name: '1Zpresso J-Max', desc: '8.8 µm / clic' },
            { id: 'femobook', name: 'Femobook A2', desc: '18 µm • 40 c/rot' },
            { id: 'comandante', name: 'Comandante C40', desc: '30 µm / clic' }
          ].map((grinder) => {
            const isActive = defaultGrinder === grinder.id;
            return (
              <button
                key={grinder.id}
                type="button"
                onClick={() => { 
                  setDefaultGrinder(grinder.id); 
                  localStorage.setItem('default-grinder', grinder.id); 
                  if (showToast) showToast(`Molino predeterminado: ${grinder.name}`, { type: 'info', duration: 2000 }); 
                }}
                style={{
                  minHeight: '48px',
                  padding: '10px 8px',
                  borderRadius: '10px',
                  border: isActive ? '2px solid var(--color-crimson)' : '1.5px solid var(--border-color)',
                  backgroundColor: isActive ? 'var(--bg-header)' : 'var(--bg-card)',
                  color: 'var(--color-text)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  gap: '3px',
                  transition: 'all 0.15s ease'
                }}
              >
                <strong style={{ fontSize: '12px' }}>{grinder.name}</strong>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{grinder.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Backup and restore section */}
      <div className="candy-card static" style={{ padding: '20px', cursor: 'default' }}>
        <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '12px', textTransform: 'uppercase', margin: '0 0 8px 0', color: 'var(--color-crimson)', letterSpacing: '0.5px' }}>
          Copia de Seguridad
        </h4>
        <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: '0 0 16px 0', lineHeight: 1.4 }}>
          Exporta tu bitácora o restaura un respaldo en cualquier dispositivo.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button 
              className="btn-candy" 
              style={{ margin: 0, fontSize: '12px', padding: '10px 14px', minHeight: '44px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} 
              onClick={handleExportBackup}
            >
              <Download size={16} strokeWidth={2.5} />
              JSON Backup
            </button>
            <button 
              className="btn-candy" 
              style={{ margin: 0, fontSize: '12px', padding: '10px 14px', minHeight: '44px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} 
              onClick={handleExportCsv}
            >
              <FileSpreadsheet size={16} strokeWidth={2.5} />
              Exportar CSV
            </button>
          </div>
          <label 
            className="btn-candy primary" 
            style={{ margin: 0, fontSize: '12px', padding: '12px 14px', minHeight: '44px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', boxSizing: 'border-box', fontWeight: 'bold' }}
          >
            <Upload size={18} strokeWidth={2.5} />
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
        <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '12px', textTransform: 'uppercase', margin: '0 0 4px 0', color: 'var(--color-text)', letterSpacing: '0.5px' }}>
          Gestión Avanzada WebNFC
        </h4>
        <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: '0 0 14px 0', lineHeight: 1.4 }}>
          Diagnostica etiquetas, borra registros nulos o clona lotes en serie a múltiples tubos/frascos.
        </p>
        <button
          type="button"
          className="btn-candy primary"
          onClick={() => setShowNfcModal(true)}
          style={{ width: '100%', margin: 0, minHeight: '44px', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px', fontWeight: 'bold' }}
        >
          <Nfc size={18} />
          Abrir Herramientas WebNFC
        </button>
      </div>

      {showNfcModal && (
        <NfcToolsModal batches={batches} onClose={() => setShowNfcModal(false)} showToast={showToast} />
      )}

      {pendingImportData && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px',
          overflowY: 'auto', WebkitOverflowScrolling: 'touch'
        }}>
          <div className="candy-card static" style={{ width: '100%', maxWidth: '350px', padding: '20px', cursor: 'default', maxHeight: 'calc(100dvh - 32px)', overflowY: 'auto', margin: 'auto 0' }}>
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
