import React, { useState } from 'react';
import { Plus, Zap, Snowflake, CheckCircle2, Mountain, Sparkles, Loader2, Compass, Share2, ClipboardCopy, X, Layers, FileText, MoreHorizontal } from 'lucide-react';
import { RenderScaChips } from '../utils/scaIcons';
import { apiUrl } from '../utils/api';
import { generateCoffeeMenuCardImage, generateCoffeeMenuText } from '../utils/cardGenerator';
import { copyToClipboard } from '../utils/clipboard';

export default function Inventory({ batches, onSelectBatch, onCreateTrigger, onSubtractDose, onRefreshBatches, showToast }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFinished, setShowFinished] = useState(false);
  const [sommelierLoading, setSommelierLoading] = useState(false);
  const [sommelierResult, setSommelierResult] = useState(null);

  // Quick Action Context Menu State
  const [contextBatch, setContextBatch] = useState(null);

  // Menu Share State
  const [showMenuShareModal, setShowMenuShareModal] = useState(false);
  const [menuShareImage, setMenuShareImage] = useState(null);
  const [menuShareTemplate, setMenuShareTemplate] = useState('craft');
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
      <div className="cupertino-segmented" style={{ marginBottom: '16px' }}>
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
      ) : (

        /* 4. PERFECTLY ALIGNED UNIFORM BENTO CARDS LIST */
        filteredBatches.map(batch => {
          const isLowStock = batch.remaining_doses <= 2 && batch.remaining_doses > 0;
          const hasRecipes = batch.recipes && batch.recipes.length > 0;

          // Weight progress calculations
          const currentWeight = parseFloat(batch.remaining_weight_g || 0);
          const totalWeight = parseFloat(batch.total_weight_g || (batch.total_doses * (parseFloat(batch.dose_weight) || 20)) || 250);
          const weightPct = Math.min(100, Math.max(0, Math.round((currentWeight / totalWeight) * 100)));
          const fillClass = weightPct > 50 ? 'fill-high' : (weightPct > 20 ? 'fill-mid' : 'fill-low');

          return (
            <div 
              key={batch.id} 
              className={`candy-card ${isLowStock ? 'low-stock' : ''}`}
              onClick={() => onSelectBatch(batch.id)}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setContextBatch(batch);
              }}
              style={{ 
                marginBottom: '14px', 
                padding: '16px', 
                borderRadius: '14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '215px',
                boxSizing: 'border-box',
                cursor: 'pointer'
              }}
            >
              {/* Top Segment: Title, Origin, Producer, Altitude */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
                  <h3 className="card-title" style={{ margin: 0, fontSize: '16px', lineHeight: 1.25, flex: 1, wordBreak: 'break-word' }}>
                    {batch.name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <span className="mono-lbl-tag" style={{ fontSize: '10.5px', padding: '3px 7px' }}>
                      {batch.origin || 'N/A'}
                    </span>
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
                        width: '26px',
                        height: '26px',
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
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <p className="card-sub" style={{ margin: 0, fontSize: '11.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {batch.producer || 'Origen Finca'} {batch.variety ? `• ${batch.variety}` : ''}
                  </p>
                  {batch.altitude ? (
                    <span style={{ fontSize: '10.5px', color: 'var(--color-crimson)', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
                      <Mountain size={11} /> {batch.altitude}
                    </span>
                  ) : isLowStock ? (
                    <span className="mono-lbl-tag low-stock" style={{ fontSize: '9px', padding: '2px 5px', flexShrink: 0 }}>
                      ¡Últimos tubos!
                    </span>
                  ) : null}
                </div>

                {/* Flavor Notes Slot (Standardized height) */}
                <div style={{ minHeight: '26px', display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                  {batch.roaster_notes ? (
                    <RenderScaChips notesStr={batch.roaster_notes} maxChips={3} />
                  ) : (
                    <span style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                      Café de Especialidad
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom Segment: Stock Bar + Unified Action Button */}
              <div>
                {/* Liquid Weight Progress Bar */}
                <div className="weight-progress-container" style={{ margin: '0 0 10px 0' }}>
                  <div className="weight-progress-header" style={{ marginBottom: '4px' }}>
                    <span style={{ fontSize: '9.5px', fontWeight: '800' }}>STOCK CONGELADOR</span>
                    <span style={{ fontSize: '10.5px', fontWeight: '800', fontFamily: 'var(--font-mono)' }}>
                      {batch.remaining_doses} Tubos ({currentWeight}g / {totalWeight}g)
                    </span>
                  </div>
                  <div className="weight-progress-track">
                    <div className={`weight-progress-fill ${fillClass}`} style={{ width: `${weightPct}%` }} />
                  </div>
                </div>

                {/* Unified Action Button - Every card has an identical height action button */}
                {hasRecipes ? (() => {
                  const r = batch.recipes[0];
                  const methodLabel = (r.method || 'V60').replace(' (Filtrado)', '');
                  const doseLabel = (r.dose_in_g !== null && r.dose_in_g !== undefined) ? r.dose_in_g : (parseFloat(batch.dose_weight) || 18);
                  const ratioLabel = r.ratio ? r.ratio.split(' ')[0] : '1:15';
                  return (
                    <button 
                      type="button" 
                      className="btn-candy primary" 
                      style={{ 
                        width: '100%', 
                        minHeight: '38px',
                        fontSize: '11.5px', 
                        padding: '9px 12px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '6px',
                        fontWeight: '800',
                        margin: 0
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectBatch(batch, { prefillRecipe: r });
                      }}
                    >
                      <Zap size={14} strokeWidth={2.5} />
                      <span>⚡ Repetir Receta ({methodLabel} • {doseLabel}g • {ratioLabel})</span>
                    </button>
                  );
                })() : (
                  <button 
                    type="button" 
                    className="btn-candy" 
                    style={{ 
                      width: '100%', 
                      minHeight: '38px',
                      fontSize: '11.5px', 
                      padding: '9px 12px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '6px',
                      fontWeight: '700',
                      margin: 0
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectBatch(batch.id);
                    }}
                  >
                    <span>☕ Ver Ficha & Preparar →</span>
                  </button>
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
                { id: 'craft', label: '☕ Artesanal' },
                { id: 'minimal', label: '🏷️ Nórdico' },
                { id: 'dark', label: '🌑 Tokyo Dark' }
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleOpenMenuShare(t.id)}
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
