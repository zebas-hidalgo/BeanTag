import React, { useState } from 'react';
import { Plus, Zap, Snowflake, CheckCircle2, Mountain, Sparkles, Loader2, Compass } from 'lucide-react';
import { RenderScaChips } from '../utils/scaIcons';
import { apiUrl } from '../utils/api';

export default function Inventory({ batches, onSelectBatch, onCreateTrigger, showToast }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFinished, setShowFinished] = useState(false);
  const [sommelierLoading, setSommelierLoading] = useState(false);
  const [sommelierResult, setSommelierResult] = useState(null);

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
    <div style={{ padding: '14px 14px 24px 14px' }}>
      
      {/* 1. Search Bar */}
      <div style={{ marginBottom: '10px' }}>
        <input 
          className="candy-input" 
          placeholder="🔍 Buscar café, origen o productor..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%', boxSizing: 'border-box', margin: 0, padding: '10px 14px', fontSize: '12px' }}
        />
      </div>

      {/* Sommelier Quick Action Banner */}
      {availableBatches.length > 0 && !showFinished && (
        <div style={{ marginBottom: '14px' }}>
          <button
            type="button"
            className="btn-candy"
            onClick={handleAskSommelier}
            disabled={sommelierLoading}
            style={{
              width: '100%',
              margin: 0,
              padding: '9px 14px',
              fontSize: '11.5px',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              backgroundColor: 'var(--bg-header)',
              borderColor: 'var(--color-crimson)',
              color: 'var(--color-crimson)'
            }}
          >
            {sommelierLoading ? <Loader2 size={15} className="spin" /> : <Sparkles size={15} />}
            <span>{sommelierLoading ? 'Consultando al Sommelier IA...' : '✨ ¿Qué café preparar hoy? Preguntar al Sommelier'}</span>
          </button>
        </div>
      )}

      {/* Sommelier Recommendation Card */}
      {sommelierResult && !showFinished && (
        <div className="candy-card animate-entrance" style={{ 
          background: 'var(--bg-card)', 
          border: '2px solid var(--color-crimson)', 
          padding: '16px', 
          marginBottom: '16px',
          borderRadius: '14px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.06)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: '900', color: 'var(--color-crimson)', textTransform: 'uppercase' }}>
              <Compass size={15} />
              <span>Recomendación Sommelier (Gemini 3.7)</span>
            </div>
            {sommelierResult.badge && (
              <span style={{ fontSize: '10px', background: 'var(--bg-header)', border: '1px solid var(--border-color)', color: 'var(--color-crimson)', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold' }}>
                {sommelierResult.badge}
              </span>
            )}
          </div>

          <h4 style={{ margin: '4px 0 6px 0', fontSize: '16px', fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
            ☕ {sommelierResult.recommended_batch_name}
          </h4>

          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: '0 0 12px 0', lineHeight: 1.4 }}>
            {sommelierResult.reason}
          </p>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 'bold', color: 'var(--color-text)' }}>
              Método: <strong style={{ color: 'var(--color-crimson)' }}>{sommelierResult.suggested_method}</strong>
            </span>
            <button
              type="button"
              className="btn-candy primary"
              style={{ margin: 0, padding: '7px 14px', fontSize: '11.5px', fontWeight: '800' }}
              onClick={() => onSelectBatch(sommelierResult.recommended_batch_id)}
            >
              Preparar Ahora →
            </button>
          </div>
        </div>
      )}

      {/* 2. Simple & Clean Status Tabs */}
      <div className="canvas-tab-selector" style={{ marginBottom: '16px' }}>
        <button 
          className={`canvas-tab-btn ${!showFinished ? 'active' : ''}`}
          onClick={() => setShowFinished(false)}
          style={{ padding: '8px 12px', fontSize: '11.5px' }}
        >
          <Snowflake size={14} strokeWidth={2.5} />
          En Congelador ({availableBatches.length})
        </button>
        <button 
          className={`canvas-tab-btn ${showFinished ? 'active' : ''}`}
          onClick={() => setShowFinished(true)}
          style={{ padding: '8px 12px', fontSize: '11.5px' }}
        >
          <CheckCircle2 size={14} strokeWidth={2.5} />
          Agotados ({finishedBatches.length})
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

        /* 4. PERFECTLY ALIGNED BENTO CARDS LIST */
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
              style={{ marginBottom: '14px', padding: '16px', borderRadius: '14px' }}
            >
              {/* Perfectly Aligned Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 className="card-title" style={{ margin: '0 0 4px 0', fontSize: '16px', lineHeight: 1.25, wordBreak: 'break-word' }}>
                    {batch.name}
                  </h3>
                  <p className="card-sub" style={{ margin: '0 0 6px 0', fontSize: '12px' }}>
                    {batch.producer} {batch.variety ? `• ${batch.variety}` : ''}
                  </p>
                  <RenderScaChips notesStr={batch.roaster_notes} maxChips={3} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                  <span className="mono-lbl-tag" style={{ fontSize: '11px', padding: '3px 7px' }}>
                    {batch.origin || 'N/A'}
                  </span>
                  {batch.altitude && (
                    <span style={{ fontSize: '10.5px', color: 'var(--color-crimson)', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Mountain size={11} /> {batch.altitude}
                    </span>
                  )}
                  {isLowStock && (
                    <span className="mono-lbl-tag low-stock" style={{ fontSize: '9.5px', padding: '2px 6px' }}>
                      ¡Últimos tubos!
                    </span>
                  )}
                </div>
              </div>
              
              {/* Liquid Weight Progress Bar */}
              <div className="weight-progress-container" style={{ margin: '10px 0 8px 0' }}>
                <div className="weight-progress-header" style={{ marginBottom: '4px' }}>
                  <span style={{ fontSize: '10px', fontWeight: '800' }}>STOCK CONGELADOR</span>
                  <span style={{ fontSize: '10.5px', fontWeight: '800', fontFamily: 'var(--font-mono)' }}>
                    {batch.remaining_doses} Tubos ({currentWeight}g / {totalWeight}g)
                  </span>
                </div>
                <div className="weight-progress-track">
                  <div className={`weight-progress-fill ${fillClass}`} style={{ width: `${weightPct}%` }} />
                </div>
              </div>

              {/* Quick Repeat Recipe Button */}
              {hasRecipes && (() => {
                const r = batch.recipes[0];
                const methodLabel = (r.method || 'V60').replace(' (Filtrado)', '');
                const doseLabel = (r.dose_in_g !== null && r.dose_in_g !== undefined) ? r.dose_in_g : (parseFloat(batch.dose_weight) || 18);
                const ratioLabel = r.ratio ? r.ratio.split(' ')[0] : '1:15';
                return (
                  <button 
                    type="button" 
                    className="btn-candy primary" 
                    style={{ 
                      marginTop: '10px', 
                      width: '100%', 
                      fontSize: '11.5px', 
                      padding: '9px 12px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '6px',
                      fontWeight: '800'
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
              })()}
            </div>
          );
        })
      )}
    </div>
  );
}
