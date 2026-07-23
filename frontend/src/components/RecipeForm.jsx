import React, { useState, useEffect } from 'react';
import { Calculator, Scale, Droplet, Thermometer, Gauge, Timer, Coffee, Save, Filter, Zap } from 'lucide-react';

export default function RecipeForm({ batch, onSaveRecipe, showToast, setBatch }) {
  const [method, setMethod] = useState('V60 (Filtrado)');
  const [jmaxRot, setJmaxRot] = useState(1);
  const [jmaxNum, setJmaxNum] = useState(5);
  const [jmaxClick, setJmaxClick] = useState(0);
  const [ratioVal, setRatioVal] = useState(15.0);
  const [doseInG, setDoseInG] = useState(20.0);
  const [doseOutG, setDoseOutG] = useState(36.0);
  const [waterTemp, setWaterTemp] = useState(93);
  const [espressoPressure, setEspressoPressure] = useState(9);
  const [espressoPreinfusion, setEspressoPreinfusion] = useState(5);
  const [brewTime, setBrewTime] = useState('2:30 min');
  const [sensoryBalance, setSensoryBalance] = useState('Dulce');
  const [sensoryBody, setSensoryBody] = useState('Medio');
  const [sensoryExtraction, setSensoryExtraction] = useState('En Punto');
  const [notes, setNotes] = useState('');

  const [calcVisible, setCalcVisible] = useState(false);
  const [calcDose, setCalcDose] = useState(15.0);
  const [calcRatio, setCalcRatio] = useState(16.0);
  const [calcWater, setCalcWater] = useState(240);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState(null);
  const [aiError, setAiError] = useState('');

  useEffect(() => {
    if (batch && batch.recipes && batch.recipes.length > 0) {
      const last = batch.recipes[0];
      setMethod(last.method || 'V60 (Filtrado)');
      if (last.ratio && last.ratio.includes('1:')) {
        const rm = last.ratio.match(/1:([0-9.]+)/);
        if (rm) setRatioVal(parseFloat(rm[1]) || 15.0);
      }
      if (last.grind && last.grind.includes('J-Max:')) {
        const parts = last.grind.replace('J-Max:', '').trim().split('.');
        if (parts.length === 3) {
          setJmaxRot(parseInt(parts[0]) || 1);
          setJmaxNum(parseInt(parts[1]) || 5);
          setJmaxClick(parseInt(parts[2]) || 0);
        }
      }
      setDoseInG(last.dose_in_g !== null && last.dose_in_g !== undefined ? last.dose_in_g : parseFloat(batch.dose_weight) || 20.0);
      setDoseOutG(last.dose_out_g !== null && last.dose_out_g !== undefined ? last.dose_out_g : 36.0);
      setWaterTemp(last.temperature ? parseInt(last.temperature) || 93 : 93);
      setEspressoPressure(last.espresso_pressure !== null && last.espresso_pressure !== undefined ? last.espresso_pressure : 9);
      setEspressoPreinfusion(last.espresso_preinfusion !== null && last.espresso_preinfusion !== undefined ? last.espresso_preinfusion : 5);
      setSensoryBalance(last.sensory_balance || 'Dulce');
      setSensoryBody(last.sensory_body || 'Medio');
      setSensoryExtraction(last.sensory_extraction || 'En Punto');
    } else if (batch) {
      setDoseInG(parseFloat(batch.dose_weight) || 20.0);
    }
  }, [batch]);

  const currentMicrons = Math.round(((jmaxRot * 90) + (jmaxNum * 10) + jmaxClick) * 8.8);

  const handleAiRecommend = () => {
    const apiKey = localStorage.getItem('gemini-api-key');
    if (!apiKey) {
      if (showToast) showToast('Configura tu clave API de Gemini en Ajustes para usar la IA.', { type: 'error', duration: 4000 });
      return;
    }
    setAiLoading(true); setAiError(''); setAiRecommendation(null);
    fetch('api/recommend-recipe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-gemini-key': apiKey },
      body: JSON.stringify({ origin: batch.origin, variety: batch.variety, process: batch.process, altitude: batch.altitude, roast_level: batch.roast_level, roaster_notes: batch.roaster_notes, method: method, dose_in_g: doseInG })
    }).then(async (res) => {
      if (!res.ok) throw new Error((await res.json()).error || 'Error');
      return res.json();
    }).then(data => {
      setAiRecommendation(data);
      if (showToast) showToast('¡Recomendación generada por la IA!', { type: 'success', duration: 2500 });
    }).catch(err => {
      setAiError(err.message);
      if (showToast) showToast('Error al obtener receta de IA.', { type: 'error', duration: 4000 });
    }).finally(() => setAiLoading(false));
  };

  const handleApplyAiRecipe = () => {
    if (!aiRecommendation) return;
    const recMethod = aiRecommendation.method.toLowerCase();
    if (recMethod.includes('v60') || recMethod.includes('filtrado')) setMethod('V60 (Filtrado)');
    else if (recMethod.includes('espresso') || recMethod.includes('expresso')) setMethod('Espresso');
    else if (recMethod.includes('aero') || recMethod.includes('press')) setMethod('AeroPress');
    else if (recMethod.includes('prensa') || recMethod.includes('francesa')) setMethod('Prensa Francesa');

    if (aiRecommendation.ratio && aiRecommendation.ratio.includes('1:')) {
      const rm = aiRecommendation.ratio.match(/1:([0-9.]+)/);
      if (rm) setRatioVal(parseFloat(rm[1]) || 15.0);
    }
    if (aiRecommendation.temperature) setWaterTemp(parseInt(aiRecommendation.temperature) || 93);
    if (aiRecommendation.brew_time) setBrewTime(aiRecommendation.brew_time);
    if (aiRecommendation.notes) setNotes(prev => `[Receta IA: ${aiRecommendation.notes}] ${prev.replace(/\[IA:.*?\]/g, '').trim()}`.trim());
    if (showToast) showToast('Receta sugerida por IA aplicada al borrador.', { type: 'success', duration: 3000 });
    setAiRecommendation(null);
  };

  const handleRecipeSubmit = (e) => {
    e.preventDefault();
    const ratioText = method === 'Espresso' ? `1:${(doseOutG / doseInG).toFixed(1)}` : `1:${ratioVal.toFixed(1)} (${(doseInG * ratioVal).toFixed(0)}g)`;
    onSaveRecipe({
      batch_id: batch.id, method, ratio: ratioText, grind: `J-Max: ${jmaxRot}.${jmaxNum}.${jmaxClick}`, temperature: `${waterTemp}°C`,
      brew_time: brewTime, notes: notes.trim(), sensory_balance: sensoryBalance, sensory_body: sensoryBody, sensory_extraction: sensoryExtraction,
      dose_in_g: parseFloat(doseInG), dose_out_g: method === 'Espresso' ? parseFloat(doseOutG) : null,
      espresso_pressure: method === 'Espresso' ? parseFloat(espressoPressure) : null, espresso_preinfusion: method === 'Espresso' ? parseInt(espressoPreinfusion) : null
    });
    setBatch(prev => ({ ...prev, remaining_weight_g: Math.max(0.0, prev.remaining_weight_g - parseFloat(doseInG)) }));
    setNotes('');
  };

  return (
    <>
      <div className="candy-card static" style={{ marginTop: '24px', backgroundColor: calcVisible ? 'var(--bg-canvas)' : 'var(--bg-card)' }}>
        <div onClick={() => setCalcVisible(!calcVisible)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Calculator size={18} color="var(--color-crimson)" /><span style={{ fontWeight: '700', fontSize: '15px' }}>Calculadora de Ratio</span></div>
          <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{calcVisible ? 'Ocultar' : 'Abrir'}</span>
        </div>
        {calcVisible && (
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }} className="animate-entrance">
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ flex: 1, margin: 0 }}><label style={{ fontSize: '11px' }}>Café (g)</label><input type="number" step="0.1" className="candy-input" value={calcDose} onChange={(e) => { const d = parseFloat(e.target.value) || 0; setCalcDose(d); setCalcWater(Math.round(d * calcRatio)); }} /></div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', paddingBottom: '10px' }}>×</div>
              <div className="form-group" style={{ flex: 1, margin: 0 }}><label style={{ fontSize: '11px' }}>Ratio 1:</label><input type="number" step="0.1" className="candy-input" value={calcRatio} onChange={(e) => { const r = parseFloat(e.target.value) || 0; setCalcRatio(r); setCalcWater(Math.round(calcDose * r)); }} /></div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', paddingBottom: '10px' }}>=</div>
              <div className="form-group" style={{ flex: 1, margin: 0 }}><label style={{ fontSize: '11px' }}>Agua (g)</label><input type="number" className="candy-input" value={calcWater} onChange={(e) => { const w = parseFloat(e.target.value) || 0; setCalcWater(w); if (calcDose > 0) setCalcRatio(parseFloat((w / calcDose).toFixed(1))); }} /></div>
            </div>
            <button type="button" className="btn-candy accent" onClick={() => { setDoseInG(calcDose); setRatioVal(calcRatio); if (method === 'Espresso') setDoseOutG(calcWater); setCalcVisible(false); if (showToast) showToast('Valores transferidos.', { type: 'success', duration: 2000 }); }} style={{ padding: '6px', fontSize: '11px', minHeight: '32px', width: '100%' }}>Transferir datos al formulario</button>
          </div>
        )}
      </div>

      <form onSubmit={handleRecipeSubmit}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', textTransform: 'uppercase', fontSize: '15px', margin: 0 }}>Registrar Preparación</h2>
        </div>
        <div style={{ display: 'flex', gap: '12px', margin: '16px 0', overflowX: 'auto', paddingBottom: '4px' }}>
          {[
            { id: 'V60 (Filtrado)', lucide: <Filter size={24} />, label: 'V60' },
            { id: 'Espresso', lucide: <Zap size={24} />, label: 'Espresso' },
            { id: 'AeroPress', lucide: <Droplet size={24} />, label: 'AeroPress' },
            { id: 'Prensa Francesa', lucide: <Coffee size={24} />, label: 'Prensa' }
          ].map(m => (
            <div key={m.id} onClick={() => { setMethod(m.id); if (navigator.vibrate) navigator.vibrate(40); }} style={{ flex: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <div className="candy-card" style={{ width: '100%', aspectRatio: '1/1', padding: 0, margin: 0, borderColor: method === m.id ? 'var(--color-crimson)' : 'var(--border-color)', borderWidth: method === m.id ? '3px' : '2px', backgroundColor: method === m.id ? 'var(--color-crimson)' : 'var(--bg-card)', boxShadow: method === m.id ? 'none' : '3px 3px 0px var(--border-color)', transform: method === m.id ? 'translate(2px, 2px)' : 'none', transition: 'all 0.15s var(--transition-spring)' }}>
                <div style={{ width: '100%', height: '100%', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: method === m.id ? '#FFFFFF' : 'var(--color-crimson)' }}>
                  {m.lucide}
                </div>
              </div>
              <span style={{ fontSize: '10px', fontWeight: method === m.id ? '900' : '600', color: method === m.id ? 'var(--color-text)' : 'var(--color-text-muted)' }}>{m.label}</span>
            </div>
          ))}
        </div>

        <div className="candy-card static" style={{ margin: '16px 0', padding: '16px', backgroundColor: 'var(--bg-card)', border: '2px solid var(--border-color)', boxShadow: '3px 3px 0px var(--border-color)', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ fontSize: '16px' }}>✨</span><span style={{ fontWeight: '900', fontSize: '12px', textTransform: 'uppercase', fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>Sugerencia IA ({method})</span></div>
            <span style={{ fontSize: '9px', fontWeight: '900', color: 'var(--color-crimson)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{doseInG}g</span>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: '0 0 12px 0', lineHeight: 1.4 }}>Diseña una receta de <strong>{method}</strong> para <strong>{doseInG}g</strong> según el perfil de este grano.</p>
          {aiError && <div style={{ color: '#E53E3E', fontSize: '10px', fontWeight: 'bold', marginBottom: '10px' }}>⚠️ Error: {aiError}</div>}
          {aiRecommendation ? (
            <div style={{ padding: '12px', backgroundColor: 'var(--bg-canvas)', border: '2px solid var(--border-color)', borderRadius: '6px', marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ fontSize: '11px' }}><strong>Ratio:</strong> {aiRecommendation.ratio}</div>
                <div style={{ fontSize: '11px' }}><strong>Molienda:</strong> {aiRecommendation.grind}</div>
                <div style={{ fontSize: '11px' }}><strong>Temperatura:</strong> {aiRecommendation.temperature}°C</div>
                <div style={{ fontSize: '11px' }}><strong>Tiempo:</strong> {aiRecommendation.brew_time}</div>
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--color-text)', borderTop: '1px dashed var(--border-color)', paddingTop: '8px', marginTop: '4px', lineHeight: 1.4 }}><strong>Notas Barista:</strong> {aiRecommendation.notes}</div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button type="button" className="btn-candy primary" onClick={handleApplyAiRecipe} style={{ flex: 1, padding: '6px', fontSize: '10px', minHeight: '30px' }}>Aplicar al Formulario</button>
                <button type="button" className="btn-candy" onClick={() => setAiRecommendation(null)} style={{ padding: '6px 12px', fontSize: '10px', minHeight: '30px', margin: 0 }}>Cerrar</button>
              </div>
            </div>
          ) : (
            <button type="button" className="btn-candy" onClick={handleAiRecommend} disabled={aiLoading} style={{ width: '100%', margin: 0, padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11px', minHeight: '34px' }}>
              {aiLoading ? <span>Diseñando receta para {method}... 🧠</span> : <span>Calcular Receta IA ✨</span>}
            </button>
          )}
        </div>

        <div className="bento-grid">
          <div className="bento-widget accent"><div className="bento-header"><span>Grams</span><Scale size={16} /></div><div className="bento-value-container"><input type="number" step="0.1" value={doseInG} onChange={(e) => setDoseInG(parseFloat(e.target.value) || 0)} /><span className="unit">g</span></div><div className="bento-controls"><button type="button" className="bento-btn" onClick={() => setDoseInG(d => Math.max(0, d - 0.5))}>-</button><div className="bento-info">DOSE</div><button type="button" className="bento-btn" onClick={() => setDoseInG(d => d + 0.5)}>+</button></div></div>
          <div className="bento-widget"><div className="bento-header"><span>{method !== 'Espresso' ? 'Ratio' : 'Yield'}</span><Droplet size={16} color="var(--color-crimson)" /></div><div className="bento-value-container">{method !== 'Espresso' ? (<><span style={{ fontSize: '28px', fontWeight: '900', fontFamily: 'var(--font-mono)' }}>1:</span><input type="number" step="0.1" style={{ textAlign: 'left', color: 'var(--color-crimson)' }} value={ratioVal} onChange={(e) => setRatioVal(parseFloat(e.target.value) || 0)} /></>) : (<><input type="number" step="0.5" style={{ color: 'var(--color-crimson)' }} value={doseOutG} onChange={(e) => setDoseOutG(parseFloat(e.target.value) || 0)} /><span className="unit" style={{ color: 'var(--color-crimson)' }}>g</span></>)}</div><div className="bento-controls"><button type="button" className="bento-btn" onClick={() => method !== 'Espresso' ? setRatioVal(r => Math.max(1, r - 0.5)) : setDoseOutG(d => Math.max(0, d - 1))}>-</button><div className="bento-info">TARGET</div><button type="button" className="bento-btn" onClick={() => method !== 'Espresso' ? setRatioVal(r => r + 0.5) : setDoseOutG(d => d + 1)}>+</button></div><div className="bento-info" style={{ marginTop: '2px', color: 'var(--color-text-muted)' }}>{method !== 'Espresso' ? `OUT: ${(doseInG * (ratioVal || 0)).toFixed(0)} g` : `1:${(doseOutG / (doseInG || 1)).toFixed(1)}`}</div></div>
          <div className="bento-widget"><div className="bento-header"><span>Temp</span><Thermometer size={16} /></div><div className="bento-value-container"><input type="number" style={{ color: 'var(--color-crimson)' }} value={waterTemp} onChange={(e) => setWaterTemp(parseInt(e.target.value) || 93)} /><span className="unit" style={{ color: 'var(--color-crimson)' }}>°C</span></div><div className="bento-controls"><button type="button" className="bento-btn" onClick={() => setWaterTemp(t => Math.max(80, t - 1))}>-</button><div className="bento-info">WATER</div><button type="button" className="bento-btn" onClick={() => setWaterTemp(t => Math.min(100, t + 1))}>+</button></div></div>
          {method === 'Espresso' ? (
            <div className="bento-widget accent"><div className="bento-header"><span>Pressure</span><Gauge size={16} /></div><div className="bento-value-container"><input type="number" step="0.5" value={espressoPressure} onChange={(e) => setEspressoPressure(parseFloat(e.target.value) || 9)} /><span className="unit">bar</span></div><div className="bento-controls"><button type="button" className="bento-btn" onClick={() => setEspressoPressure(p => Math.max(0, p - 0.5))}>-</button><div className="bento-info">EXTRACT</div><button type="button" className="bento-btn" onClick={() => setEspressoPressure(p => p + 0.5)}>+</button></div></div>
          ) : (
            <div className="bento-widget"><div className="bento-header"><span>Timer</span><Timer size={16} /></div><div className="bento-value-container" style={{ position: 'relative' }}><input type="text" style={{ fontSize: '24px' }} value={brewTime} onChange={(e) => setBrewTime(e.target.value)} /></div><div className="bento-controls" style={{ justifyContent: 'center' }}><div className="bento-info">DURATION</div></div></div>
          )}
          <div className="bento-widget bento-full-row accent"><div className="bento-header"><span>Molienda (J-Max)</span><Coffee size={16} /></div><div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 0' }}><select className="candy-input" style={{ flex: 1, textAlign: 'center', fontSize: '14px', margin: 0, padding: '8px' }} value={jmaxRot} onChange={(e) => setJmaxRot(parseInt(e.target.value) || 0)}>{[0, 1, 2, 3, 4].map(v => <option key={v} value={v}>Rot: {v}</option>)}</select><select className="candy-input" style={{ flex: 1, textAlign: 'center', fontSize: '14px', margin: 0, padding: '8px' }} value={jmaxNum} onChange={(e) => setJmaxNum(parseInt(e.target.value) || 0)}>{[0, 1, 2, 3, 4, 5, 6, 7, 8].map(v => <option key={v} value={v}>Num: {v}</option>)}</select><select className="candy-input" style={{ flex: 1, textAlign: 'center', fontSize: '14px', margin: 0, padding: '8px' }} value={jmaxClick} onChange={(e) => setJmaxClick(parseInt(e.target.value) || 0)}>{[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(v => <option key={v} value={v}>Clic: {v}</option>)}</select></div><div className="bento-info">Partícula: ~{currentMicrons} µm</div></div>
          {method === 'Espresso' && (
            <><div className="bento-widget"><div className="bento-header"><span>Pre-Inf</span><Timer size={16} /></div><div className="bento-value-container"><input type="number" value={espressoPreinfusion} onChange={(e) => setEspressoPreinfusion(parseInt(e.target.value) || 0)} /><span className="unit">sec</span></div><div className="bento-controls"><button type="button" className="bento-btn" onClick={() => setEspressoPreinfusion(p => Math.max(0, p - 1))}>-</button><div className="bento-info">BLOOM</div><button type="button" className="bento-btn" onClick={() => setEspressoPreinfusion(p => p + 1)}>+</button></div></div><div className="bento-widget"><div className="bento-header"><span>Timer</span><Timer size={16} /></div><div className="bento-value-container"><input type="text" style={{ fontSize: '24px' }} value={brewTime} onChange={(e) => setBrewTime(e.target.value)} /></div><div className="bento-controls" style={{ justifyContent: 'center' }}><div className="bento-info">DURATION</div></div></div></>
          )}
        </div>

        <div className="candy-card static" style={{ marginTop: '0' }}>
          <div style={{ borderTop: '1.5px solid var(--border-color)', marginTop: '12px', paddingTop: '12px' }}>
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '11px', textTransform: 'uppercase', margin: '0 0 10px 0' }}>Evaluación Sensorial (Taza Perfecta)</h4>
            <div className="form-group"><label style={{ fontSize: '9px' }}>Balance Sensorial (Predominante)</label><div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>{['Ácido', 'Dulce', 'Amargo'].map(b => (<button key={b} type="button" className="btn-candy" onClick={() => setSensoryBalance(b)} style={{ flex: 1, minHeight: '34px', fontSize: '11px', padding: '4px', margin: 0, backgroundColor: sensoryBalance === b ? 'var(--color-text)' : 'var(--bg-card)', color: sensoryBalance === b ? '#FFF' : 'var(--color-text)', boxShadow: sensoryBalance === b ? 'none' : '2px 2px 0px var(--border-color)', transform: sensoryBalance === b ? 'translate(1px, 1px)' : 'none' }}>{b}</button>))}</div></div>
            <div className="form-group"><label style={{ fontSize: '9px' }}>Cuerpo / Textura</label><div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>{['Ligero', 'Medio', 'Sedoso'].map(b => (<button key={b} type="button" className="btn-candy" onClick={() => setSensoryBody(b)} style={{ flex: 1, minHeight: '34px', fontSize: '11px', padding: '4px', margin: 0, backgroundColor: sensoryBody === b ? 'var(--color-text)' : 'var(--bg-card)', color: sensoryBody === b ? '#FFF' : 'var(--color-text)', boxShadow: sensoryBody === b ? 'none' : '2px 2px 0px var(--border-color)', transform: sensoryBody === b ? 'translate(1px, 1px)' : 'none' }}>{b}</button>))}</div></div>
            <div className="form-group"><label style={{ fontSize: '9px' }}>Nivel de Extracción</label><div style={{ display: 'flex', gap: '6px' }}>{['Sub', 'En Punto', 'Sobre'].map(b => (<button key={b} type="button" className="btn-candy" onClick={() => setSensoryExtraction(b)} style={{ flex: 1, minHeight: '34px', fontSize: '11px', padding: '4px', margin: 0, backgroundColor: sensoryExtraction === b ? 'var(--color-text)' : 'var(--bg-card)', color: sensoryExtraction === b ? '#FFF' : 'var(--color-text)', boxShadow: sensoryExtraction === b ? 'none' : '2px 2px 0px var(--border-color)', transform: sensoryExtraction === b ? 'translate(1px, 1px)' : 'none' }}>{b === 'Sub' ? 'Sub (Agrio)' : b === 'Sobre' ? 'Sobre (Amargo)' : 'En Punto'}</button>))}</div></div>
            <div className="form-group" style={{ marginTop: '12px' }}><label style={{ fontSize: '9px' }}>Notas / Comentarios de Extracción</label><input className="candy-input" value={notes} onChange={(e) => setNotes(e.target.value)} type="text" placeholder="Ej. Muy balanceado, dulzor intenso, retrogusto largo" /></div>
          </div>
        </div>

        <button type="submit" className="btn-candy primary" style={{ width: '100%', marginTop: '16px', fontSize: '15px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Save size={20} strokeWidth={2.5} />
          Guardar Bitácora
        </button>
      </form>
    </>
  );
}
