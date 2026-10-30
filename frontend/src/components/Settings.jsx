import React, { useState, useEffect } from 'react';
import { Moon, Sun, Download, Upload, Nfc, FileSpreadsheet, Activity, CheckCircle2, AlertTriangle, Loader2, Sparkles, Compass, Share2, ClipboardList, X, Eye, EyeOff, Coffee, Zap, Cpu, Palette, SlidersHorizontal, SunMoon } from 'lucide-react';
import { normalizeTheme } from '../utils/theme';
import NfcToolsModal from './NfcToolsModal';
import { apiUrl } from '../utils/api';
import { GRINDERS } from '../utils/grinders';
import { generateCoffeeMenuCardImage, generateCoffeeMenuText, normalizeCardStyle, DEFAULT_CARD_STYLE } from '../utils/cardGenerator';
import { copyToClipboard } from '../utils/clipboard';

export default function Settings({ theme, setTheme, batches = [], showToast }) {
  const [showNfcModal, setShowNfcModal] = useState(false);
  const [pendingImportData, setPendingImportData] = useState(null);
  const [importMode, setImportMode] = useState('merge');
  // App Theme State
  const [appTheme, setAppTheme] = useState(() => normalizeTheme(localStorage.getItem('beantag-theme')));

  useEffect(() => {
    if (theme && theme !== appTheme) {
      setAppTheme(theme);
    }
  }, [theme]);

  const handleThemeChange = (theme) => {
    setAppTheme(theme);
    localStorage.setItem('beantag-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    if (typeof setTheme === 'function') {
      setTheme(theme);
    }
    try {
      window.dispatchEvent(new Event('beantag-theme-changed'));
    } catch (e) {}
    if (showToast) {
      const names = { auto: 'Automático', light: 'Crema', dark: 'Tueste' };
      showToast(`Apariencia: ${names[theme] || 'Automático'}`, { type: 'success', duration: 2000 });
    }
  };

  // AI Provider & Keys State
  const [aiProvider, setAiProvider] = useState(() => localStorage.getItem('beantag-ai-provider') || 'groq');
  const [groqKey, setGroqKey] = useState(() => localStorage.getItem('groq-key') || '');
  const [groqModel, setGroqModel] = useState(() => {
    const stored = localStorage.getItem('groq-model');
    if (!stored || stored.includes('llama')) {
      localStorage.setItem('groq-model', 'openai/gpt-oss-120b');
      return 'openai/gpt-oss-120b';
    }
    return stored;
  });
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [testGroqLoading, setTestGroqLoading] = useState(false);
  const [testGroqResult, setTestGroqResult] = useState(null);

  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('gemini-api-key') || '';
  });
  const geminiKey = apiKey;
  const [selectedModel, setSelectedModel] = useState(() => {
    const stored = localStorage.getItem('gemini-model');
    if (!stored || stored === 'gemini-2.0-flash' || stored === 'gemini-1.5-flash' || stored === 'gemini-1.5-pro' || stored === 'gemini-2.5-pro') {
      localStorage.setItem('gemini-model', 'gemini-3.8-flash');
      return 'gemini-3.8-flash';
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

  // Sommelier IA & Menu Share State
  const [sommelierLoading, setSommelierLoading] = useState(false);
  const [sommelierResult, setSommelierResult] = useState(null);
  const [showMenuShareModal, setShowMenuShareModal] = useState(false);
  const [menuShareImage, setMenuShareImage] = useState(null);
  const [menuShareTemplate, setMenuShareTemplate] = useState(() => {
    try {
      const pref = localStorage.getItem('beantag-share-style');
      return normalizeCardStyle(pref);
    } catch (e) {
      return DEFAULT_CARD_STYLE;
    }
  });
  const [menuShareStatus, setMenuShareStatus] = useState('');

  const safeBatches = Array.isArray(batches) ? batches : [];
  const availableBatches = safeBatches.filter(b => b && (b.remaining_doses || 0) > 0);

  const handleOpenMenuShare = async (template = menuShareTemplate) => {
    const targetList = availableBatches.length > 0 ? availableBatches : safeBatches;
    if (targetList.length === 0) {
      if (showToast) showToast('No hay cafés en el inventario para generar la carta.', { type: 'info' });
      return;
    }
    try {
      const imgData = await generateCoffeeMenuCardImage(targetList, template);
      setMenuShareImage(imgData);
      setMenuShareTemplate(template);
      setShowMenuShareModal(true);
      setMenuShareStatus('');
    } catch (err) {
      console.error("Menu card generation error:", err);
      if (showToast) showToast('Error al generar la carta: ' + err.message, { type: 'error' });
    }
  };

  const handleCopyMenuText = async () => {
    const targetList = availableBatches.length > 0 ? availableBatches : safeBatches;
    const text = generateCoffeeMenuText(targetList);
    const success = await copyToClipboard(text);
    if (success) {
      setMenuShareStatus('¡Carta de cafés copiada al portapapeles!');
      if (showToast) showToast('Carta de cafés copiada en formato texto.', { type: 'success' });
    } else {
      setMenuShareStatus('No se pudo copiar automáticamente.');
    }
  };

  const handleNativeMenuShare = async () => {
    if (!menuShareImage) return;
    const targetList = availableBatches.length > 0 ? availableBatches : safeBatches;
    const text = generateCoffeeMenuText(targetList);

    try {
      const blob = await (await fetch(menuShareImage)).blob();
      const file = new File([blob], `Carta_Cafes_BeanTag_${Date.now()}.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Carta de Cafés de Especialidad • BeanTag',
          text: `☕ Menú de Cafés congelados en cava (${targetList.length} variedades disponibles)`,
          files: [file]
        });
        setMenuShareStatus('Compartido con éxito');
        return;
      }

      if (navigator.share) {
        await navigator.share({
          title: 'Carta de Cafés • BeanTag',
          text: text,
          url: window.location.href
        });
        setMenuShareStatus('Carta compartida');
        return;
      }

      const a = document.createElement('a');
      a.href = menuShareImage;
      a.download = `Carta_Cafes_BeanTag_${Date.now()}.png`;
      a.click();
      setMenuShareStatus('Imagen de la carta descargada');
    } catch (err) {
      if (err.name !== 'AbortError') {
        const a = document.createElement('a');
        a.href = menuShareImage;
        a.download = `Carta_Cafes_BeanTag_${Date.now()}.png`;
        a.click();
        setMenuShareStatus('Imagen descargada');
      }
    }
  };

  const handleAskSommelier = async () => {
    const targetBatches = availableBatches.length > 0 ? availableBatches : safeBatches;
    if (targetBatches.length === 0) {
      if (showToast) showToast('No hay lotes en el inventario para evaluar.', { type: 'info', duration: 3000 });
      return;
    }

    setSommelierLoading(true);
    setSommelierResult(null);

    const now = new Date();
    const hour = now.getHours();
    const timeOfDay = hour < 12 ? 'mañana (buscando acidez brillante y claridad)' : (hour < 18 ? 'tarde (buscando dulzor y balance)' : 'noche (buscando cuerpo suave y relajante)');

    try {
      const headers = {
        'Content-Type': 'application/json',
        'x-ai-provider': aiProvider,
        'x-groq-key': groqKey,
        'x-gemini-key': geminiKey,
        'x-ai-model': aiProvider === 'groq' ? groqModel : selectedModel
      };
      if (geminiKey) {
        headers['x-gemini-thinking'] = isThinkingEnabled ? 'true' : 'false';
      }

      const res = await fetch(apiUrl('api/ai/sommelier'), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          batches: targetBatches,
          timeOfDay
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.error) {
        if (showToast) showToast(`Error del sommelier: ${data.error}`, { type: 'error', duration: 4000 });
        return;
      }
      setSommelierResult(data);
      if (data.recommended_batch_id === null) {
        if (showToast) showToast('Sin dosis disponibles en inventario. Repón stock para sugerencias.', { type: 'info', duration: 3500 });
      } else if (data._source === 'barista_fallback') {
        if (showToast) showToast('Sommelier Local listo (Modo Cero Desconexión)', { type: 'success', duration: 3000 });
      } else {
        if (showToast) showToast('¡Recomendación del Sommelier lista! ', { type: 'success', duration: 2500 });
      }
    } catch (err) {
      if (showToast) showToast('Error al conectar con el Sommelier IA.', { type: 'error', duration: 3000 });
    } finally {
      setSommelierLoading(false);
    }
  };

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
      editorial: 'Editorial (Nordic)',
      list: 'Lista (Cupertino)',
      archive: 'Archivo (Tokyo Lab)'
    };
    if (showToast) {
      showToast(`Estilo de inventario: ${names[style] || style}`, { type: 'success', duration: 2000 });
    }
  };

  const handleProviderChange = (newProvider) => {
    setAiProvider(newProvider);
    localStorage.setItem('beantag-ai-provider', newProvider);
    if (showToast) {
      showToast(`Proveedor de IA: ${newProvider === 'groq' ? 'Groq (LPU Ultra-Rápido)' : 'Google Gemini'}`, { type: 'info', duration: 2000 });
    }
  };

  const handleGroqKeyChange = (val) => {
    setGroqKey(val);
    localStorage.setItem('groq-key', val);
  };

  const handleGroqModelChange = (newModel) => {
    setGroqModel(newModel);
    localStorage.setItem('groq-model', newModel);
    if (showToast) {
      showToast(`Modelo Groq cambiado a ${newModel}.`, { type: 'info', duration: 2000 });
    }
  };

  const handleSaveKey = () => {
    localStorage.setItem('beantag-ai-provider', aiProvider);
    localStorage.setItem('groq-key', groqKey);
    localStorage.setItem('groq-model', groqModel);
    localStorage.setItem('gemini-api-key', apiKey);
    localStorage.setItem('gemini-model', selectedModel);
    localStorage.setItem('gemini-thinking', isThinkingEnabled ? 'true' : 'false');
    localStorage.setItem('default-grinder', defaultGrinder);
    if (showToast) {
      showToast('Configuración guardada correctamente.', { type: 'success', duration: 2500 });
    }
  };

  const handleTestGroq = async () => {
    setTestGroqLoading(true);
    setTestGroqResult(null);
    try {
      const res = await fetch(apiUrl('api/test-groq'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-ai-provider': 'groq',
          'x-groq-key': groqKey.trim() || undefined,
          'x-ai-model': groqModel || undefined
        },
        body: JSON.stringify({
          groqKey: groqKey.trim() || undefined,
          model: groqModel || undefined
        })
      });
      const data = await res.json();
      setTestGroqResult(data);
      if (data.success) {
        if (showToast) showToast(`Conexión con Groq exitosa (${data.model})`, { type: 'success', duration: 3000 });
      } else {
        if (showToast) showToast(`Error: ${data.message || data.error}`, { type: 'error', duration: 4000 });
      }
    } catch (err) {
      const fail = { success: false, error: 'network_error', message: `Fallo de conexión con el servidor: ${err.message}` };
      setTestGroqResult(fail);
      if (showToast) showToast('Error de conexión con el servidor.', { type: 'error', duration: 3500 });
    } finally {
      setTestGroqLoading(false);
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
        if (showToast) showToast(`Conexión con Gemini exitosa (${data.model})`, { type: 'success', duration: 3000 });
      } else {
        if (showToast) showToast(`Error: ${data.message || data.error}`, { type: 'error', duration: 4000 });
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

  const authHeaders = () => {
    const t = localStorage.getItem('beantag-token');
    return t ? { 'Authorization': `Bearer ${t}` } : {};
  };

  const handleExportBackup = () => {
    fetch(apiUrl('api/backup/export'), { headers: authHeaders() })
      .then(res => {
        if (res.status === 401) throw new Error('auth');
        return res.json();
      })
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
      .catch((err) => {
        const msg = err && err.message === 'auth' ? 'Inicia sesión para exportar tus datos.' : 'Error al conectar con el servidor.';
        if (showToast) showToast(msg, { type: 'error', duration: 2500 });
      });
  };

  const handleExportCsv = () => {
    fetch(apiUrl('api/backup/export/csv'), { headers: authHeaders() })
      .then(res => {
        if (res.status === 401) throw new Error('auth');
        if (!res.ok) throw new Error('fail');
        return res.blob();
      })
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `beantag_bitacora_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        if (showToast) showToast('Bitácora CSV descargada.', { type: 'success', duration: 2500 });
      })
      .catch((err) => {
        const msg = err && err.message === 'auth' ? 'Inicia sesión para exportar tus datos.' : 'Error al generar el CSV.';
        if (showToast) showToast(msg, { type: 'error', duration: 2500 });
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
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ ...pendingImportData, mode: importMode })
    })
    .then(res => res.json())
    .then(data => {
      if (data.error && !data.success) {
        if (showToast) showToast(data.error, { type: 'error', duration: 3500 });
        return;
      }
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
    <div style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
      <h2 className="bt-page-title">
        Ajustes y Configuración
      </h2>

      {/* ✨ Herramientas de Barista (Sommelier IA & Carta de Cafés) */}
      <div className="candy-card static" style={{ padding: '18px', cursor: 'default', marginBottom: '14px' }}>
        <div>
          <h4 className="bt-section-title" style={{ margin: '0 0 4px 0' }}>
            <Sparkles size={15} />
            <span>Herramientas de Barista</span>
          </h4>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: '0 0 14px 0' }}>
            Asistente inteligente y opciones para compartir tu carta de cafés
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px', marginBottom: sommelierResult ? '14px' : 0 }}>
          <button
            type="button"
            className="btn-candy"
            onClick={handleAskSommelier}
            disabled={sommelierLoading}
            style={{
              margin: 0,
              padding: '10px',
              fontSize: '12px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              color: 'var(--color-crimson)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}
          >
            {sommelierLoading ? <Loader2 size={15} className="spin" /> : <Sparkles size={15} />}
            <span>{sommelierLoading ? 'Pensando...' : 'Sommelier IA'}</span>
          </button>

          <button
            type="button"
            className="btn-candy"
            onClick={() => handleOpenMenuShare(menuShareTemplate)}
            style={{
              margin: 0,
              padding: '10px',
              fontSize: '12px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              color: 'var(--color-text)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}
          >
            <Share2 size={15} color="var(--color-crimson)" strokeWidth={2.2} />
            <span>Compartir Carta ({availableBatches.length})</span>
          </button>
        </div>

        {/* Sommelier Recommendation Card */}
        {sommelierResult && (
          <div className="candy-card animate-entrance" style={{ 
            background: 'var(--bg-card)', 
            border: '1px solid var(--color-crimson)', 
            padding: '14px', 
            marginTop: '12px',
            borderRadius: 'var(--r-tile)',
            boxShadow: '0 4px 16px rgba(188, 84, 73, 0.08)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600', color: 'var(--color-crimson)', textTransform: 'uppercase' }}>
                <Compass size={14} />
                <span>Recomendación Sommelier {sommelierResult._source === 'barista_fallback' ? '(Local)' : (sommelierResult._source === 'groq' ? '(Groq)' : '(Gemini)')}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                {sommelierResult._source === 'barista_fallback' && (
                  <span style={{ 
                    fontSize: '12px', 
                    background: 'var(--barista-instr-bg)', 
                    border: '1px solid var(--barista-instr-border)', 
                    color: 'var(--barista-accent-honey)', 
                    padding: '3px 8px', 
                    borderRadius: 'var(--r-control)', 
                    fontWeight: '600',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Zap size={11} />
                    <span>Sommelier Local (Modo Cero Desconexión)</span>
                  </span>
                )}
                {sommelierResult.badge && (
                  <span style={{ fontSize: '12px', background: 'rgba(188, 84, 73, 0.08)', border: '1px solid rgba(188, 84, 73, 0.2)', color: 'var(--color-crimson)', padding: '2px 6px', borderRadius: 'var(--r-xs)', fontWeight: 'bold' }}>
                    {sommelierResult.badge}
                  </span>
                )}
              </div>
            </div>

            {sommelierResult.recommended_batch_id === null ? (
              <div style={{ marginTop: '8px', padding: '10px', background: 'var(--bg-canvas)', borderRadius: 'var(--r-control)', border: '1px dashed var(--border-color)' }}>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
                  Sin dosis disponibles en inventario
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: '0 0 8px 0', lineHeight: 1.4 }}>
                  {sommelierResult.reason || 'Todos los lotes en tu cava tienen 0 dosis restantes. Repón tu stock o registra nuevas dosis para recibir recomendaciones del sommelier.'}
                </p>
                <div style={{ fontSize: '12px', color: 'var(--color-crimson)', fontWeight: '600' }}>
                  Sugerencia: Repón dosis de café en tus lotes para activar la selección experta de cata.
                </div>
              </div>
            ) : (
              <>
                <h4 style={{ margin: '4px 0 6px 0', fontSize: '15px', fontFamily: 'var(--font-heading)', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Coffee size={15} color="var(--color-crimson)" />
                  <span>{sommelierResult.recommended_batch_name}</span>
                </h4>

                <p className="bt-section-desc" style={{ marginBottom: '12px' }}>
                  {sommelierResult.reason}
                </p>

                {sommelierResult.flavor_focus && (
                  <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Perfil:</span>
                    <span style={{ color: 'var(--color-crimson)' }}>{sommelierResult.flavor_focus}</span>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Tema de la Aplicación (V5: Automático / Crema / Tueste) */}
      <section className="bt-section" aria-labelledby="bt-theme-title">
        <div className="bt-section-head">
          <h4 id="bt-theme-title" className="bt-section-title">
            <Palette size={16} aria-hidden="true" />
            <span>Apariencia</span>
          </h4>
          <p className="bt-section-desc">Crema para el día, Tueste para la noche. Las extracciones usan siempre el Modo Barra de alto contraste.</p>
        </div>
        <div className="bt-seg" role="radiogroup" aria-label="Tema de la aplicación">
          {[
            { id: 'auto', label: 'Automático', Icon: SunMoon },
            { id: 'light', label: 'Crema', Icon: Sun },
            { id: 'dark', label: 'Tueste', Icon: Moon }
          ].map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={appTheme === id}
              className={`bt-seg-btn${appTheme === id ? ' is-active' : ''}`}
              onClick={() => handleThemeChange(id)}
            >
              <Icon size={16} aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Configuración de Inteligencia Artificial */}
      <div className="candy-card static" style={{ padding: '18px', cursor: 'default', marginBottom: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
            <h4 className="bt-section-title" style={{ margin: 0 }}>
              Configuración de Inteligencia Artificial
            </h4>
            <span style={{ fontSize: '12px', background: 'var(--bg-header)', color: 'var(--color-crimson)', padding: '3px 8px', borderRadius: 'var(--r-control)', fontWeight: '700', border: '1px solid var(--border-color)' }}>
              {aiProvider === 'groq' ? `GROQ • ${groqModel.replace('openai/', '').toUpperCase()}` : `GEMINI • ${selectedModel.toUpperCase()}`}
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: '0 0 14px 0', lineHeight: 1.4 }}>
            Potencia el escaneo OCR de bolsas con cámara, el sommelier de inventario y la recomendación experta de recetas con fallback offline.
          </p>
        </div>

        {/* Upper segmented pills control */}
        <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-canvas)', padding: '4px', borderRadius: 'var(--r-control)', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
          <button
            type="button"
            onClick={() => handleProviderChange('groq')}
            style={{
              flex: 1,
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: '700',
              border: 'none',
              borderRadius: 'var(--r-control)',
              background: aiProvider === 'groq' ? 'var(--bg-card)' : 'transparent',
              color: aiProvider === 'groq' ? 'var(--color-crimson)' : 'var(--color-text-muted)',
              boxShadow: aiProvider === 'groq' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'var(--transition-ui)'
            }}
          >
            <Zap size={14} strokeWidth={2.2} />
            <span>Groq (LPU Ultra-Rápido)</span>
          </button>
          <button
            type="button"
            onClick={() => handleProviderChange('gemini')}
            style={{
              flex: 1,
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: '700',
              border: 'none',
              borderRadius: 'var(--r-control)',
              background: aiProvider === 'gemini' ? 'var(--bg-card)' : 'transparent',
              color: aiProvider === 'gemini' ? 'var(--color-crimson)' : 'var(--color-text-muted)',
              boxShadow: aiProvider === 'gemini' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'var(--transition-ui)'
            }}
          >
            <Cpu size={14} strokeWidth={2.2} />
            <span>Google Gemini</span>
          </button>
        </div>

        {aiProvider === 'groq' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Groq API Key Input + Action Buttons */}
            <div>
              <label htmlFor="bt-settings-1" className="barista-label" style={{ marginBottom: '6px' }}>Clave API de Groq Cloud</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '180px', display: 'flex', alignItems: 'center' }}>
                  <input id="bt-settings-1" aria-label="Introduce tu clave API (gsk_...)" 
                    type={showGroqKey ? 'text' : 'password'} 
                    className="candy-input" 
                    value={groqKey} 
                    onChange={(e) => handleGroqKeyChange(e.target.value)} 
                    placeholder="Introduce tu clave API (gsk_...)"
                    style={{ width: '100%', boxSizing: 'border-box', fontFamily: 'var(--font-mono)', minHeight: '44px', fontSize: '13px', paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowGroqKey(!showGroqKey)}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '6px',
                      color: 'var(--color-text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title={showGroqKey ? 'Ocultar clave' : 'Mostrar clave'}
                  >
                    {showGroqKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <button 
                  onClick={handleSaveKey} 
                  className="btn-candy primary"
                  style={{ margin: 0, padding: '10px 18px', fontSize: '13px', whiteSpace: 'nowrap', minHeight: '44px', fontWeight: 'bold' }}
                >
                  Guardar
                </button>
                <button 
                  onClick={handleTestGroq} 
                  disabled={testGroqLoading}
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
                  {testGroqLoading ? <Loader2 size={16} className="spin" /> : <Activity size={16} color="var(--color-crimson)" />}
                  <span>{testGroqLoading ? 'Probando...' : 'Probar Conexión con Groq'}</span>
                </button>
              </div>
            </div>

            {/* Test Status Feedback Pill for Groq */}
            {testGroqResult && (
              <div 
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--r-control)',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  backgroundColor: testGroqResult.success ? 'var(--barista-accent-mint-subtle)' : 'var(--barista-accent-danger-subtle)',
                  border: testGroqResult.success ? '1.5px solid #10B981' : '1.5px solid #EF4444',
                  color: testGroqResult.success ? 'var(--ok-text)' : 'var(--bad-text)'
                }}
              >
                {testGroqResult.success ? (
                  <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '1px', color: 'var(--ok)' }} />
                ) : (
                  <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '1px', color: 'var(--bad)' }} />
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                  <span style={{ fontWeight: '600' }}>
                    {testGroqResult.success ? 'Conexión Exitosa con Groq ' : 'Error de Conexión'}
                  </span>
                  <span style={{ fontSize: '12px', lineHeight: 1.35 }}>
                    {testGroqResult.message || testGroqResult.error}
                  </span>
                  {testGroqResult.model && (
                    <span style={{ fontSize: '12px', fontWeight: 'bold', opacity: 0.85, marginTop: '2px' }}>
                      Modelo: {testGroqResult.model}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Model Selector Dropdown for Groq */}
            <div>
              <label htmlFor="bt-settings-2" className="barista-label" style={{ marginBottom: '6px' }}>
                Modelo de Inteligencia Artificial (Groq)
              </label>
              <select id="bt-settings-2" aria-label="Modelo de Inteligencia Artificial (Groq)" 
                className="candy-input" 
                value={groqModel} 
                onChange={(e) => handleGroqModelChange(e.target.value)}
                style={{ fontSize: '12px', padding: '10px 12px', minHeight: '44px', width: '100%' }}
              >
                <option value="openai/gpt-oss-120b">GPT OSS 120B • Razonamiento Avanzado & Barista (Recomendado)</option>
                <option value="openai/gpt-oss-20b">GPT OSS 20B • Ultrarrápido (~140ms)</option>
                <option value="qwen/qwen3.8-27b">Qwen 3.8 27B • Multimodal Visión & Texto (~45ms)</option>
              </select>
            </div>

            <a 
              href="https://console.groq.com/keys" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ fontSize: '12px', color: 'var(--color-crimson)', textDecoration: 'underline', fontWeight: 'bold' }}
            >
              Consigue tu clave gratuita sin tarjeta en console.groq.com →
            </a>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* API Key Input + Action Buttons */}
            <div>
              <label htmlFor="bt-settings-3" className="barista-label" style={{ marginBottom: '6px' }}>Clave API de Google AI Studio</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch', flexWrap: 'wrap' }}>
                <input id="bt-settings-3" aria-label="Introduce tu clave API (AIzaSy...)" 
                  type="password" 
                  className="candy-input" 
                  value={apiKey} 
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    localStorage.setItem('gemini-api-key', e.target.value);
                  }} 
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
                  <span>{testingGemini ? 'Probando...' : 'Probar Conexión con Gemini'}</span>
                </button>
              </div>
            </div>

            {/* Test Status Feedback Pill */}
            {geminiTestResult && (
              <div 
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--r-control)',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  backgroundColor: geminiTestResult.success ? 'var(--barista-accent-mint-subtle)' : 'var(--barista-accent-danger-subtle)',
                  border: geminiTestResult.success ? '1.5px solid #10B981' : '1.5px solid #EF4444',
                  color: geminiTestResult.success ? 'var(--ok-text)' : 'var(--bad-text)'
                }}
              >
                {geminiTestResult.success ? (
                  <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '1px', color: 'var(--ok)' }} />
                ) : (
                  <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '1px', color: 'var(--bad)' }} />
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                  <span style={{ fontWeight: '600' }}>
                    {geminiTestResult.success ? 'Conexión Exitosa con Gemini' : 'Error de Conexión'}
                  </span>
                  <span style={{ fontSize: '12px', lineHeight: 1.35 }}>
                    {geminiTestResult.message || geminiTestResult.error}
                  </span>
                  {geminiTestResult.latency_ms && (
                    <span style={{ fontSize: '12px', fontWeight: 'bold', opacity: 0.85, marginTop: '2px' }}>
                      ⏱️ Latencia: {geminiTestResult.latency_ms}ms • Modelo: {geminiTestResult.model}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Model Selector & Thinking Config */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div>
                <label htmlFor="bt-settings-4" className="barista-label" style={{ marginBottom: '6px' }}>
                  Modelo de Inteligencia Artificial (Gemini)
                </label>
                <select id="bt-settings-4" aria-label="Modelo de Inteligencia Artificial (Gemini)" 
                  className="candy-input" 
                  value={selectedModel} 
                  onChange={(e) => handleModelChange(e.target.value)}
                  style={{ fontSize: '12px', padding: '10px 12px', minHeight: '44px', width: '100%' }}
                >
                  <option value="gemini-3.8-flash">Gemini 3.8 Flash (Recomendado - Multimodal de Alta Precisión)</option>
                  <option value="gemini-3.8-flash-lite">Gemini 3.8 Flash Lite (Ultra Rápido & Ligero)</option>
                  <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro Preview (Máximo Razonamiento)</option>
                  <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash Lite (Eficiente)</option>
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
                    borderRadius: 'var(--r-control)',
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
                  {isThinkingEnabled ? 'Razonamiento: ACTIVO' : 'Modo Rápido (Off)'}
                </button>
              </div>
            </div>

            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ fontSize: '12px', color: 'var(--color-crimson)', textDecoration: 'underline', fontWeight: 'bold' }}
            >
              Obtener clave API gratuita en Google AI Studio →
            </a>
          </div>
        )}
      </div>

      {/* Preferencia de Molino Predeterminado */}
      <div className="candy-card static" style={{ padding: '18px', cursor: 'default', marginBottom: '14px' }}>
        <h4 className="bt-section-title" style={{ margin: '0 0 4px 0' }}>
          Molino Predeterminado
        </h4>
        <p className="bt-section-desc" style={{ marginBottom: '12px' }}>
          Selecciona tu molino principal para precargar sus diales y física en cada nueva receta.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))', gap: '8px' }}>
          {GRINDERS.map((grinder) => {
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
                  minHeight: '52px',
                  padding: '8px 6px',
                  borderRadius: 'var(--r-control)',
                  border: isActive ? '2px solid var(--color-crimson)' : '1.5px solid var(--border-color)',
                  backgroundColor: isActive ? 'var(--bg-header)' : 'var(--bg-card)',
                  color: 'var(--color-text)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  gap: '3px',
                  transition: 'var(--transition-ui)'
                }}
              >
                <strong style={{ fontSize: '12px' }}>{grinder.name}</strong>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{grinder.stepDesc || grinder.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Backup and restore section */}
      <div className="candy-card static" style={{ padding: '18px', cursor: 'default', marginBottom: '14px' }}>
        <h4 className="bt-section-title" style={{ margin: '0 0 8px 0' }}>
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
      <div className="candy-card static" style={{ padding: '18px', cursor: 'default', marginBottom: '14px' }}>
        <h4 className="bt-section-title" style={{ margin: '0 0 4px 0' }}>
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
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 'var(--z-nav)', padding: '20px',
          overflowY: 'auto', WebkitOverflowScrolling: 'touch'
        }}>
          <div className="candy-card static" style={{ width: '100%', maxWidth: '350px', padding: '20px', cursor: 'default', maxHeight: 'calc(100dvh - 32px)', overflowY: 'auto', margin: 'auto' }}>
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

      {/* MODAL DE COMPARTIR CARTA DE CAFÉS (FREEZER MENU) */}
      {showMenuShareModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Compartir carta de cafés"
          onKeyDown={(e) => { if (e.key === 'Escape') setShowMenuShareModal(false); }}
          tabIndex={-1}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 'var(--z-modal)', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'flex-start',
            padding: '16px', 
            boxSizing: 'border-box',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch'
          }}
          onClick={() => { setShowMenuShareModal(false); setMenuShareStatus(''); }}
        >
          <div className="candy-card static animate-entrance" style={{
            maxWidth: '480px', width: '100%',
            maxHeight: 'calc(100dvh - 32px)',
            margin: 'auto',
            padding: '16px', boxSizing: 'border-box',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            display: 'flex', flexDirection: 'column', gap: '10px',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch'
          }} onClick={(e) => e.stopPropagation()}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '14px', margin: 0, fontWeight: '600', color: 'var(--color-text)' }}>
                    Carta de Cafés • Menú en Cava
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    {availableBatches.length > 0 ? availableBatches.length : safeBatches.length} lotes disponibles
                  </span>
                </div>
                <button aria-label="Cerrar" 
                  type="button" 
                  onClick={() => setShowMenuShareModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--color-text-muted)' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Template Selector */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center', background: 'var(--bg-canvas)', padding: '5px', borderRadius: 'var(--r-control)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-muted)', padding: '0 4px', letterSpacing: '0.04em' }}>COLECCIÓN:</span>
                {[
                  { id: 'stretch', label: 'Stretch' },
                  { id: 'squishy', label: 'Squishy' },
                  { id: 'zine', label: 'Zine' },
                  { id: 'vhs', label: 'VHS' },
                  { id: 'lata', label: 'Lata' }
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      try { localStorage.setItem('beantag-share-style', t.id); } catch (e) {}
                      handleOpenMenuShare(t.id);
                    }}
                    style={{
                      flex: '1 1 auto',
                      padding: '5px 8px',
                      fontSize: '12px',
                      fontWeight: menuShareTemplate === t.id ? '800' : '600',
                      border: menuShareTemplate === t.id ? '1px solid var(--color-crimson)' : '1px solid transparent',
                      borderRadius: 'var(--r-control)',
                      background: menuShareTemplate === t.id ? 'var(--bg-card)' : 'transparent',
                      color: menuShareTemplate === t.id ? 'var(--color-crimson)' : 'var(--color-text)',
                      boxShadow: menuShareTemplate === t.id ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Image Preview */}
            <div style={{
              textAlign: 'center',
              backgroundColor: 'var(--bg-canvas)',
              borderRadius: 'var(--r-control)',
              padding: '8px',
              overflow: 'hidden',
              flex: '0 1 auto',
              minHeight: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {menuShareImage && (
                <img 
                  src={menuShareImage} 
                  alt="Carta de cafés de especialidad" 
                  style={{
                    maxWidth: '100%',
                    maxHeight: 'calc(45dvh - 50px)',
                    height: 'auto',
                    objectFit: 'contain',
                    borderRadius: 'var(--r-control)', 
                    display: 'block',
                    margin: '0 auto',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.14)'
                  }} 
                />
              )}
            </div>

            {menuShareStatus && (
              <div style={{
                textAlign: 'center',
                fontSize: '12px',
                fontWeight: 'bold',
                color: 'var(--color-crimson)',
                background: 'rgba(188, 84, 73, 0.08)',
                padding: '6px',
                borderRadius: 'var(--r-control)'
              }}>
                {menuShareStatus}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0, marginTop: '4px' }}>
              <button
                type="button"
                className="btn-candy"
                onClick={handleCopyMenuText}
                style={{
                  flex: 1, margin: 0, padding: '10px 8px', fontSize: '12px', fontWeight: 'bold',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--color-text)'
                }}
              >
                <span>Copiar Texto</span>
              </button>

              <button
                type="button"
                className="btn-candy"
                onClick={handleNativeMenuShare}
                style={{
                  flex: 1.3, margin: 0, padding: '10px 8px', fontSize: '12px', fontWeight: '600',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  background: 'var(--color-crimson)', color: 'var(--on-accent)', border: 'none'
                }}
              >
                <Share2 size={14} />
                <span>Compartir Imagen</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '40px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
        <p style={{ fontWeight: 'bold', margin: 0 }}>BeanTag Coffee Bitácora</p>
        <p style={{ margin: '4px 0 0 0' }}>Versión 1.2.0 • Home Barista Edition</p>
      </div>
    </div>
  );
}
