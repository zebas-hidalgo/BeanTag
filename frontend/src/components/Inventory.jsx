import React, { useState, useEffect } from 'react';
import { Plus, Zap, Snowflake, CheckCircle2, Mountain, Sparkles, Loader2, Compass, Share2, ClipboardCopy, X, Layers, FileText, MoreHorizontal, ChevronRight } from 'lucide-react';
import { RenderScaChips } from '../utils/scaIcons';
import { apiUrl } from '../utils/api';
import { generateCoffeeMenuCardImage, generateCoffeeMenuText } from '../utils/cardGenerator';
import { copyToClipboard } from '../utils/clipboard';

export default function Inventory({ batches, onSelectBatch, onCreateTrigger, onSubtractDose, onRefreshBatches, showToast }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFinished, setShowFinished] = useState(false);
  const [sommelierLoading, setSommelierLoading] = useState(false);
  const [sommelierResult, setSommelierResult] = useState(null);

  // Card View Style: 'editorial' | 'list' | 'archive'
  const [cardStyle, setCardStyle] = useState(() => {
    try {
      return localStorage.getItem('beantag-inventory-style') || 'editorial';
    } catch (e) {
      return 'editorial';
    }
  });

  useEffect(() => {
    const handleStyleSync = () => {
      try {
        const saved = localStorage.getItem('beantag-inventory-style') || 'editorial';
        setCardStyle(saved);
      } catch (e) {}
    };

    window.addEventListener('beantag-inventory-style-changed', handleStyleSync);
    window.addEventListener('storage', handleStyleSync);
    return () => {
      window.removeEventListener('beantag-inventory-style-changed', handleStyleSync);
      window.removeEventListener('storage', handleStyleSync);
    };
  }, []);

  const handleCardStyleChange = (style) => {
    setCardStyle(style);
    try {
      localStorage.setItem('beantag-inventory-style', style);
      window.dispatchEvent(new Event('beantag-inventory-style-changed'));
    } catch (e) {}
    if (navigator.vibrate) {
      try { navigator.vibrate(8); } catch (err) {}
    }
  };

  // Quick Action Context Menu State
  const [contextBatch, setContextBatch] = useState(null);

  // Menu Share State
  const [showMenuShareModal, setShowMenuShareModal] = useState(false);
  const [menuShareImage, setMenuShareImage] = useState(null);
  const [menuShareTemplate, setMenuShareTemplate] = useState(() => {
    try {
      const pref = localStorage.getItem('beantag-share-style');
      if (pref === 'neobrutalist') return 'neobrutalist';
      if (pref === 'aurora') return 'aurora';
      if (pref === 'hangtag') return 'hangtag';
      return 'blueprint';
    } catch (e) {
      return 'blueprint';
    }
  });
  const [menuShareStatus, setMenuShareStatus] = useState('');

  const safeBatches = Array.isArray(batches) ? batches : [];

  // Filter available vs finished batches
  const availableBatches = safeBatches.filter(b => b && (b.remaining_doses || 0) > 0);
  const finishedBatches = safeBatches.filter(b => b && (b.remaining_doses || 0) <= 0);

  const currentList = showFinished ? finishedBatches : availableBatches;

  // Search filter
  const filteredBatches = (Array.isArray(currentList) ? currentList : []).filter(batch => {
    if (!batch) return false;
    const name = batch.name || '';
    const producer = batch.producer || '';
    const origin = batch.origin || '';
    const q = (searchQuery || '').toLowerCase();
    return name.toLowerCase().includes(q) || producer.toLowerCase().includes(q) || origin.toLowerCase().includes(q);
  });

  const handleOpenMenuShare = (template = menuShareTemplate) => {
    const targetList = availableBatches.length > 0 ? availableBatches : safeBatches;
    if (targetList.length === 0) {
      if (showToast) showToast('No hay cafés en el inventario para generar la carta.', { type: 'info' });
      return;
    }
    const imgData = generateCoffeeMenuCardImage(targetList, template);
    setMenuShareImage(imgData);
    setMenuShareTemplate(template);
    setShowMenuShareModal(true);
    setMenuShareStatus('');
  };

  const handleCopyMenuText = async () => {
    const targetList = availableBatches.length > 0 ? availableBatches : safeBatches;
    const text = generateCoffeeMenuText(targetList);
    const success = await copyToClipboard(text);
    if (success) {
      setMenuShareStatus('📋 ¡Carta de cafés copiada al portapapeles!');
      if (showToast) showToast('📋 Carta de cafés copiada en formato texto.', { type: 'success' });
    } else {
      setMenuShareStatus('⚠️ No se pudo copiar automáticamente.');
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
        setMenuShareStatus('✅ Compartido con éxito');
        return;
      }

      if (navigator.share) {
        await navigator.share({
          title: 'Carta de Cafés • BeanTag',
          text: text,
          url: window.location.href
        });
        setMenuShareStatus('✅ Carta compartida');
        return;
      }

      // Download Fallback
      const a = document.createElement('a');
      a.href = menuShareImage;
      a.download = `Carta_Cafes_BeanTag_${Date.now()}.png`;
      a.click();
      setMenuShareStatus('📥 Imagen de la carta descargada');
    } catch (err) {
      if (err.name !== 'AbortError') {
        const a = document.createElement('a');
        a.href = menuShareImage;
        a.download = `Carta_Cafes_BeanTag_${Date.now()}.png`;
        a.click();
        setMenuShareStatus('📥 Imagen descargada');
      }
    }
  };

  const handleAskSommelier = async () => {
    const apiKey = localStorage.getItem('gemini-api-key');
    if (!apiKey) {
      if (showToast) showToast('Configura tu clave API de Gemini en Ajustes para consultar al Sommelier.', { type: 'error', duration: 4000 });
      return;
    }
    if (availableBatches.length === 0) {
      if (showToast) showToast('No hay lotes con dosis en el congelador para evaluar.', { type: 'info', duration: 3000 });
      return;
    }

    const model = localStorage.getItem('gemini-model') || 'gemini-3.7-flash';
    const isThinking = localStorage.getItem('gemini-thinking') === 'true';

    setSommelierLoading(true);
    setSommelierResult(null);

    const now = new Date();
    const hour = now.getHours();
    const timeOfDay = hour < 12 ? 'mañana (buscando acidez brillante y claridad)' : (hour < 18 ? 'tarde (buscando dulzor y balance)' : 'noche (buscando cuerpo suave y relajante)');

    try {
      const res = await fetch(apiUrl('api/ai/sommelier'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-key': apiKey,
          'x-gemini-model': model,
          'x-gemini-thinking': isThinking ? 'true' : 'false'
        },
        body: JSON.stringify({
          batches: availableBatches,
          timeOfDay
        })
      });

      const data = await res.json();
      if (data.error) {
        if (showToast) showToast(`Error del sommelier: ${data.error}`, { type: 'error', duration: 4000 });
        return;
      }
      setSommelierResult(data);
      if (showToast) showToast('¡Recomendación del Sommelier lista! ☕✨', { type: 'success', duration: 2500 });
    } catch (err) {
      if (showToast) showToast('Error al conectar con Gemini 3.7.', { type: 'error', duration: 3000 });
    } finally {
      setSommelierLoading(false);
    }
  };

  return (
    <div style={{ padding: '16px 14px 28px 14px' }}>
      
      {/* 1. Search Bar */}
      <div style={{ marginBottom: '10px' }}>
        <input 
          className="candy-input" 
          placeholder="🔍 Buscar café, origen, productor o variedad..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%', boxSizing: 'border-box', margin: 0, padding: '11px 14px', fontSize: '13px' }}
        />
      </div>

      {/* 2. Top Modern Action Toolbar: Sommelier + Share Full Coffee Menu */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
        <button
          type="button"
          className="btn-candy"
          onClick={handleAskSommelier}
          disabled={sommelierLoading}
          style={{
            margin: 0,
            padding: '9px 10px',
            fontSize: '11.5px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            background: '#FFFFFF',
            border: '1px solid var(--border-color)',
            color: 'var(--color-crimson)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          {sommelierLoading ? <Loader2 size={15} className="spin" /> : <Sparkles size={15} />}
          <span>{sommelierLoading ? 'Pensando...' : '✨ Sommelier IA'}</span>
        </button>

        <button
          type="button"
          className="btn-candy"
          onClick={() => handleOpenMenuShare(menuShareTemplate)}
          style={{
            margin: 0,
            padding: '9px 10px',
            fontSize: '11.5px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            background: '#FFFFFF',
            border: '1px solid var(--border-color)',
            color: 'var(--color-text)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <Share2 size={15} color="var(--color-crimson)" strokeWidth={2.2} />
          <span>📋 Compartir Carta ({availableBatches.length})</span>
        </button>
      </div>

      {/* Sommelier Recommendation Card */}
      {sommelierResult && !showFinished && (
        <div className="candy-card animate-entrance" style={{ 
          background: '#FFFFFF', 
          border: '1px solid var(--color-crimson)', 
          padding: '16px', 
          marginBottom: '16px',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(188, 84, 73, 0.08)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: '800', color: 'var(--color-crimson)', textTransform: 'uppercase' }}>
              <Compass size={15} />
              <span>Recomendación Sommelier (Gemini 3.7)</span>
            </div>
            {sommelierResult.badge && (
              <span style={{ fontSize: '10px', background: 'rgba(188, 84, 73, 0.08)', border: '1px solid rgba(188, 84, 73, 0.2)', color: 'var(--color-crimson)', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold' }}>
                {sommelierResult.badge}
              </span>
            )}
          </div>

          <h4 style={{ margin: '4px 0 6px 0', fontSize: '16px', fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
            ☕ {sommelierResult.recommended_batch_name}
          </h4>

          <p style={{ fontSize: '12.5px', color: 'var(--color-text-muted)', margin: '0 0 12px 0', lineHeight: 1.45 }}>
            {sommelierResult.reason}
          </p>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: '600', color: 'var(--color-text)' }}>
              Método: <strong style={{ color: 'var(--color-crimson)' }}>{sommelierResult.suggested_method}</strong>
            </span>
            <button
              type="button"
              className="btn-candy primary"
              style={{ margin: 0, padding: '7px 14px', fontSize: '11.5px', fontWeight: '700' }}
              onClick={() => onSelectBatch(sommelierResult.recommended_batch_id)}
            >
              Preparar Ahora →
            </button>
          </div>
        </div>
      )}

      {/* 2. Cupertino Segmented Status Tabs */}
      <div className="cupertino-segmented" style={{ marginBottom: '14px' }}>
        <button 
          type="button"
          className={`cupertino-segmented-btn ${!showFinished ? 'active' : ''}`}
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(8);
            setShowFinished(false);
          }}
        >
          <Snowflake size={14} strokeWidth={2.5} />
          <span>En Congelador ({availableBatches.length})</span>
        </button>
        <button 
          type="button"
          className={`cupertino-segmented-btn ${showFinished ? 'active' : ''}`}
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(8);
            setShowFinished(true);
          }}
        >
          <CheckCircle2 size={14} strokeWidth={2.5} />
          <span>Agotados ({finishedBatches.length})</span>
        </button>
      </div>

      {/* 2.1 View Style Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', padding: '0 2px' }}>
        <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {filteredBatches.length} {filteredBatches.length === 1 ? 'Lote' : 'Lotes'}
        </span>
        <div className="inventory-view-selector">
          <button 
            type="button"
            className={`inventory-view-btn ${cardStyle === 'editorial' ? 'active' : ''}`}
            onClick={() => handleCardStyleChange('editorial')}
            title="Estilo Editorial (Nordic)"
          >
            🏷️ Editorial
          </button>
          <button 
            type="button"
            className={`inventory-view-btn ${cardStyle === 'list' ? 'active' : ''}`}
            onClick={() => handleCardStyleChange('list')}
            title="Estilo Lista (Compacto)"
          >
            📋 Lista
          </button>
          <button 
            type="button"
            className={`inventory-view-btn ${cardStyle === 'archive' ? 'active' : ''}`}
            onClick={() => handleCardStyleChange('archive')}
            title="Estilo Archivo (Técnico / Lab)"
          >
            📐 Archivo
          </button>
        </div>
      </div>

      {/* 3. Empty State */}
      {filteredBatches.length === 0 ? (
        <div className="candy-card static" style={{ textAlign: 'center', padding: '40px 20px', borderStyle: 'dashed', backgroundColor: 'var(--bg-card)', borderRadius: '14px' }}>
          <div style={{ fontSize: '38px', marginBottom: '10px' }}>
            {showFinished ? '🏁' : '❄️'}
          </div>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', textTransform: 'uppercase', margin: '0 0 6px 0', color: 'var(--color-text)' }}>
            {showFinished ? 'Sin cafés agotados' : 'No hay cafés en el congelador'}
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: '0 0 18px 0', lineHeight: 1.4 }}>
            {!showFinished ? 'Registra tu primer lote de tubos congelados para empezar a preparar.' : 'Los lotes cuyos tubos lleguen a 0 se moverán aquí.'}
          </p>
          {!showFinished && (
            <button className="btn-candy primary" onClick={onCreateTrigger} style={{ margin: '0 auto', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '12px' }}>
              <Plus size={16} strokeWidth={2.5} />
              Registrar Primer Lote
            </button>
          )}
        </div>
      ) : cardStyle === 'list' ? (
        /* 📋 ESTILO 2: LISTA (Cupertino / Linear Table View) */
        <div className="inventory-list-container">
          {filteredBatches.map(batch => {
            const isLowStock = batch.remaining_doses <= 2 && batch.remaining_doses > 0;
            return (
              <div
                key={batch.id}
                className={`card-linear-row ${isLowStock ? 'low-stock' : ''}`}
                onClick={() => onSelectBatch(batch.id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setContextBatch(batch);
                }}
              >
                <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      color: 'var(--color-text)', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap' 
                    }}>
                      {batch.name}
                    </span>
                    {batch.origin && (
                      <span style={{ 
                        fontSize: '10px', 
                        fontFamily: 'var(--font-mono)', 
                        color: 'var(--color-text-muted)',
                        flexShrink: 0
                      }}>
                        ({batch.origin})
                      </span>
                    )}
                  </div>
                  <div style={{ 
                    fontSize: '11.5px', 
                    color: 'var(--color-text-muted)', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    whiteSpace: 'nowrap',
                    marginTop: '2px'
                  }}>
                    {batch.producer || 'Origen'} {batch.variety ? `• ${batch.variety}` : ''} {batch.altitude ? `• ${batch.altitude}m` : ''}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  <span style={{ 
                    fontSize: '11px', 
                    fontFamily: 'var(--font-mono)',
                    fontWeight: '700',
                    padding: '3px 7px',
                    borderRadius: '10px',
                    backgroundColor: isLowStock ? 'rgba(239, 68, 68, 0.12)' : 'var(--segmented-bg, rgba(120, 120, 128, 0.1))',
                    color: isLowStock ? '#DC2626' : 'var(--color-text)',
                    whiteSpace: 'nowrap'
                  }}>
                    {batch.remaining_doses} {batch.remaining_doses === 1 ? 'tubo' : 'tubos'}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (navigator.vibrate) try { navigator.vibrate(8); } catch (err) {}
                      setContextBatch(batch);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--color-text-muted)',
                      padding: '4px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                    title="Opciones rápidas"
                    aria-label="Opciones rápidas"
                  >
                    <MoreHorizontal size={16} />
                  </button>

                  <ChevronRight size={15} color="var(--color-text-muted)" style={{ opacity: 0.5 }} />
                </div>
              </div>
            );
          })}
        </div>
      ) : cardStyle === 'archive' ? (
        /* 📐 ESTILO 3: ARCHIVO (Tokyo Coffee Lab) */
        filteredBatches.map((batch, index) => {
          const isLowStock = batch.remaining_doses <= 2 && batch.remaining_doses > 0;
          const currentWeight = parseFloat(batch.remaining_weight_g || 0);
          const batchCode = `#${String(index + 1).padStart(2, '0')} • LOT-${batch.id ? String(batch.id).slice(-4).toUpperCase() : '0000'}`;

          let restLabel = '—';
          if (batch.roast_date) {
            const roast = new Date(batch.roast_date);
            const end = batch.freeze_date ? new Date(batch.freeze_date) : new Date();
            const diffDays = Math.round((end - roast) / (1000 * 60 * 60 * 24));
            if (!isNaN(diffDays) && diffDays >= 0) {
              restLabel = `${diffDays}d`;
            }
          } else if (batch.roast_level) {
            restLabel = batch.roast_level;
          }

          const hasRecipes = batch.recipes && batch.recipes.length > 0;
          const firstRecipe = hasRecipes ? batch.recipes[0] : null;

          return (
            <div
              key={batch.id}
              className={`card-archive ${isLowStock ? 'low-stock' : ''}`}
              onClick={() => onSelectBatch(batch.id)}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setContextBatch(batch);
              }}
            >
              {/* Archive Header */}
              <div className="archive-header">
                <span>{batchCode}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{batch.origin || 'ESPECIALIDAD'}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (navigator.vibrate) try { navigator.vibrate(8); } catch (err) {}
                      setContextBatch(batch);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--color-text-muted)',
                      padding: '2px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center'
                    }}
                    title="Opciones rápidas"
                    aria-label="Opciones rápidas"
                  >
                    <MoreHorizontal size={14} />
                  </button>
                </div>
              </div>

              {/* Main title & producer */}
              <div>
                <h3 style={{ 
                  margin: '0 0 2px 0', 
                  fontFamily: 'var(--font-mono)', 
                  fontSize: '15px', 
                  fontWeight: '700', 
                  letterSpacing: '-0.02em',
                  color: 'var(--color-text)'
                }}>
                  {batch.name}
                </h3>
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  PROD: {batch.producer || 'LOTE SELECCIONADO'} {batch.variety ? `// VAR: ${batch.variety}` : ''}
                </p>
              </div>

              {/* Technical 2x2 Specs Grid */}
              <div className="archive-meta-grid">
                <div className="archive-meta-item">
                  <span className="archive-meta-label">ORIGEN</span>
                  <span className="archive-meta-value">{batch.origin || '—'}</span>
                </div>
                <div className="archive-meta-item">
                  <span className="archive-meta-label">PROCESO</span>
                  <span className="archive-meta-value">{batch.process || 'LAVADO'}</span>
                </div>
                <div className="archive-meta-item">
                  <span className="archive-meta-label">ALTITUD</span>
                  <span className="archive-meta-value">{batch.altitude ? `${batch.altitude}m` : '—'}</span>
                </div>
                <div className="archive-meta-item">
                  <span className="archive-meta-label">REPOSO</span>
                  <span className="archive-meta-value">{restLabel}</span>
                </div>
              </div>

              {/* Tasting notes in lab mono style */}
              {batch.roaster_notes && (
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <span style={{ color: 'var(--color-crimson)', fontWeight: '700' }}>NOTES: </span>
                  {batch.roaster_notes}
                </div>
              )}

              {/* Archive Footer Tracker */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                paddingTop: '6px', 
                borderTop: '1px dashed var(--border-color)',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px'
              }}>
                <span style={{ fontWeight: '700', color: isLowStock ? '#EF4444' : 'var(--color-text)' }}>
                  {isLowStock ? 'LOW STOCK: ' : 'STOCK: '}
                  {batch.remaining_doses} TUBOS {currentWeight > 0 ? `(${currentWeight}g)` : ''}
                </span>

                {firstRecipe ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectBatch(batch, { prefillRecipe: firstRecipe });
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--color-crimson)',
                      fontWeight: '700',
                      fontSize: '10.5px',
                      fontFamily: 'var(--font-mono)',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    [⚡ REPETIR] →
                  </button>
                ) : (
                  <span style={{ color: 'var(--color-crimson)', fontWeight: '700', fontSize: '10.5px' }}>
                    [FICHA_RECETA] →
                  </span>
                )}
              </div>
            </div>
          );
        })
      ) : (
        /* 🏷️ ESTILO 1: EDITORIAL (Nordic Atelier - Default) */
        filteredBatches.map(batch => {
          const isLowStock = batch.remaining_doses <= 2 && batch.remaining_doses > 0;
          const currentWeight = parseFloat(batch.remaining_weight_g || 0);
          const hasRecipes = batch.recipes && batch.recipes.length > 0;
          const firstRecipe = hasRecipes ? batch.recipes[0] : null;

          return (
            <div 
              key={batch.id} 
              className={`card-editorial ${isLowStock ? 'low-stock' : ''}`}
              onClick={() => onSelectBatch(batch.id)}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setContextBatch(batch);
              }}
            >
              {/* Top Row: Name & Quick Action */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ 
                    margin: '0 0 3px 0', 
                    fontFamily: 'var(--font-heading)', 
                    fontSize: '16.5px', 
                    fontWeight: '600', 
                    lineHeight: 1.25,
                    color: 'var(--color-text)',
                    wordBreak: 'break-word'
                  }}>
                    {batch.name}
                  </h3>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '12px', 
                    color: 'var(--color-text-muted)', 
                    lineHeight: 1.4,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {batch.producer || 'Origen Finca'} {batch.variety ? `• ${batch.variety}` : ''} {batch.process ? `• ${batch.process}` : ''}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (navigator.vibrate) {
                      try { navigator.vibrate(8); } catch (err) {}
                    }
                    setContextBatch(batch);
                  }}
                  style={{
                    background: 'var(--segmented-bg, rgba(120, 120, 128, 0.12))',
                    border: '1px solid var(--border-color)',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--color-text)',
                    padding: 0,
                    flexShrink: 0
                  }}
                  title="Opciones rápidas"
                  aria-label="Opciones rápidas"
                >
                  <MoreHorizontal size={15} />
                </button>
              </div>

              {/* Origin, Altitude & Roast details */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11.5px', color: 'var(--color-text-muted)' }}>
                {batch.origin && (
                  <span style={{ fontWeight: '600', color: 'var(--color-text)' }}>
                    📍 {batch.origin}
                  </span>
                )}
                {batch.altitude && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    <Mountain size={11} color="var(--color-crimson)" /> {batch.altitude}m
                  </span>
                )}
                {batch.roast_level && (
                  <span>• {batch.roast_level}</span>
                )}
              </div>

              {/* Tasting notes chips */}
              {batch.roaster_notes ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <RenderScaChips notesStr={batch.roaster_notes} maxChips={3} />
                </div>
              ) : null}

              {/* Footer: Stock capsule + Quick Action */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                paddingTop: '8px', 
                borderTop: '1px solid var(--border-color)',
                marginTop: '2px'
              }}>
                <span style={{ 
                  fontSize: '11.5px', 
                  fontFamily: 'var(--font-mono)', 
                  fontWeight: '600',
                  color: isLowStock ? '#EF4444' : 'var(--color-text)'
                }}>
                  {isLowStock ? '⚠️ ' : '🧊 '}
                  {batch.remaining_doses} {batch.remaining_doses === 1 ? 'tubo' : 'tubos'}
                  {currentWeight > 0 ? ` (${currentWeight}g)` : ''}
                </span>

                {firstRecipe ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectBatch(batch, { prefillRecipe: firstRecipe });
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--color-crimson)',
                      fontWeight: '700',
                      fontSize: '11.5px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: 0
                    }}
                  >
                    <Zap size={13} strokeWidth={2.5} />
                    <span>Repetir {(firstRecipe.method || 'V60').replace(' (Filtrado)', '')} →</span>
                  </button>
                ) : (
                  <span style={{ 
                    fontSize: '11.5px', 
                    fontWeight: '600', 
                    color: 'var(--color-crimson)', 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '2px' 
                  }}>
                    Ver Ficha →
                  </span>
                )}
              </div>
            </div>
          );
        })
      )}

      {/* MODAL DE COMPARTIR CARTA DE CAFÉS (FREEZER MENU) */}
      {showMenuShareModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 11000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '12px', boxSizing: 'border-box'
        }} onClick={() => { setShowMenuShareModal(false); setMenuShareStatus(''); }}>
          <div className="candy-card static animate-entrance" style={{
            maxWidth: '480px', width: '100%',
            maxHeight: '92vh',
            padding: '16px', boxSizing: 'border-box',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            display: 'flex', flexDirection: 'column', gap: '10px',
            overflowY: 'auto'
          }} onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '14px', margin: 0, fontWeight: '800', color: 'var(--color-text)' }}>
                  📋 Carta de Cafés • Menú en Cava
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  {availableBatches.length > 0 ? availableBatches.length : safeBatches.length} lotes de especialidad disponibles
                </span>
              </div>
              <button 
                type="button" 
                onClick={() => setShowMenuShareModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--color-text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Template Selector */}
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center', background: 'var(--bg-canvas)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-muted)', paddingLeft: '4px' }}>ESTILO:</span>
              {[
                { id: 'blueprint', label: '📐 Blueprint' },
                { id: 'neobrutalist', label: '⚡ Neo-Pop' },
                { id: 'aurora', label: '🔮 Aurora' },
                { id: 'hangtag', label: '🏷️ Hangtag' }
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    try { localStorage.setItem('beantag-share-style', t.id); } catch (e) {}
                    handleOpenMenuShare(t.id);
                  }}
                  style={{
                    flex: 1,
                    padding: '5px 8px',
                    fontSize: '10px',
                    borderRadius: '6px',
                    border: menuShareTemplate === t.id ? '1px solid var(--color-crimson)' : 'none',
                    backgroundColor: menuShareTemplate === t.id ? '#FFFFFF' : 'transparent',
                    fontWeight: menuShareTemplate === t.id ? '800' : '500',
                    color: menuShareTemplate === t.id ? 'var(--color-crimson)' : 'var(--color-text)',
                    boxShadow: menuShareTemplate === t.id ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
                    cursor: 'pointer'
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Live Image Preview */}
            <div style={{ textAlign: 'center', backgroundColor: '#F1F5F9', borderRadius: '10px', padding: '6px', overflow: 'hidden', maxHeight: '52vh', overflowY: 'auto' }}>
              {menuShareImage && (
                <img 
                  src={menuShareImage} 
                  alt="Carta de cafés de especialidad" 
                  style={{
                    maxWidth: '100%',
                    height: 'auto',
                    borderRadius: '4px', 
                    display: 'block',
                    margin: '0 auto',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.12)'
                  }} 
                />
              )}
            </div>

            {/* Status Message */}
            {menuShareStatus && (
              <div style={{
                background: menuShareStatus.includes('❌') ? '#FEE2E2' : '#ECFDF5',
                color: menuShareStatus.includes('❌') ? '#991B1B' : '#065F46',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '11.5px',
                fontWeight: '600',
                textAlign: 'center'
              }}>
                {menuShareStatus}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
              <button 
                type="button" 
                className="btn-candy" 
                style={{ padding: '10px 8px', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11px', fontWeight: '700' }} 
                onClick={handleCopyMenuText}
              >
                <ClipboardCopy size={15} strokeWidth={2.2} />
                Copiar Texto (WhatsApp)
              </button>

              <button 
                type="button" 
                className="btn-candy primary" 
                style={{ padding: '10px 8px', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11px', fontWeight: '700' }} 
                onClick={handleNativeMenuShare}
              >
                <Share2 size={15} strokeWidth={2.2} />
                Compartir PNG (2x)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🍎 CUPERTINO HAPTIC TOUCH CONTEXT MENU */}
      {contextBatch && (
        <div className="cupertino-context-overlay" onClick={() => setContextBatch(null)}>
          <div className="cupertino-context-menu" onClick={e => e.stopPropagation()}>
            <div style={{ padding: '14px 16px 10px 16px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-canvas)' }}>
              <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--color-crimson)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>
                Acciones Rápidas • {contextBatch.origin || 'Origen'}
              </div>
              <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {contextBatch.name}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                {contextBatch.remaining_doses} tubos restantes ({contextBatch.remaining_weight_g || 0}g)
              </div>
            </div>

            <button
              type="button"
              className="cupertino-context-item"
              onClick={() => {
                const b = contextBatch;
                setContextBatch(null);
                if (b.recipes && b.recipes.length > 0) {
                  onSelectBatch(b, { prefillRecipe: b.recipes[0] });
                } else {
                  onSelectBatch(b.id);
                }
              }}
            >
              <span>☕ Preparar / Dial-In</span>
              <Zap size={15} color="var(--color-crimson)" />
            </button>

            {contextBatch.remaining_doses > 0 && onSubtractDose && (
              <button
                type="button"
                className="cupertino-context-item"
                onClick={() => {
                  const b = contextBatch;
                  setContextBatch(null);
                  onSubtractDose(b.id, () => {
                    if (onRefreshBatches) onRefreshBatches();
                  });
                }}
              >
                <span>❄️ Restar 1 Tubo (-1)</span>
                <Snowflake size={15} color="var(--color-crimson)" />
              </button>
            )}

            <button
              type="button"
              className="cupertino-context-item"
              onClick={() => {
                const b = contextBatch;
                setContextBatch(null);
                onSelectBatch(b.id);
              }}
            >
              <span>📋 Ver Ficha & Compartir</span>
              <Share2 size={15} />
            </button>

            <button
              type="button"
              className="cupertino-context-item danger"
              onClick={() => setContextBatch(null)}
            >
              <span>✕ Cancelar</span>
              <X size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
