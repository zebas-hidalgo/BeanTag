import React, { useState, useEffect } from 'react';
import { Calculator, Scale, Droplet, Thermometer, Gauge, Timer, Coffee, Save, Filter, Zap, X, SlidersHorizontal, Check } from 'lucide-react';
import { apiUrl } from '../utils/api';
import { FAMOUS_RECIPES } from '../utils/famousRecipes';

export default function RecipeForm({ batch, onSaveRecipe, showToast, setBatch, prefillRecipe, onBack }) {
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

  // Pulsar Mini interactive 3-state valve configuration
  const [pulsarStages, setPulsarStages] = useState([
    { step: 1, label: 'Bloom e Inmersión + WWDT', water_g: 50, valve: 'closed', time: '0:00 - 0:45', desc: 'Válvula cerrada. 50g agua y agitación WWDT suave para saturar homogéneamente.' },
    { step: 2, label: '1º Vertido de Percolación', water_g: 100, valve: 'open', time: '0:45 - 2:00', desc: 'Válvula abierta al 100% sobre tapa dispersora manteniendo caudal suave.' },
    { step: 3, label: '2º Vertido Final', water_g: 100, valve: 'open', time: '2:00 - 3:30', desc: 'Drenaje continuo hasta alcanzar cama plana sin canalizaciones.' }
  ]);

  const applyPulsarPreset = (presetId) => {
    const recipe = FAMOUS_RECIPES.find(r => r.id === presetId);
    if (!recipe) return;
    const dose = recipe.defaultDose || 15;
    setDoseInG(dose);
    setRatioVal(recipe.ratioVal || 16.6);
    setWaterTemp(recipe.temperature || 94);
    setBrewTime(recipe.brewTime || '3:30 min');
    if (recipe.grinderSettings?.jmax) {
      const s = recipe.grinderSettings.jmax;
      if (s.rot !== undefined) setJmaxRot(s.rot);
      if (s.num !== undefined) setJmaxNum(s.num);
      if (s.click !== undefined) setJmaxClick(s.click);
    }
    const calculated = recipe.calculatePours(dose);
    setPulsarStages(calculated.map((p, i) => ({
      step: p.step || i + 1,
      label: p.label,
      water_g: p.water_g,
      valve: p.valve || 'open',
      time: p.time,
      desc: p.description
    })));
    if (showToast) {
      showToast(`Preset cargado: ${recipe.name}`, { type: 'success', duration: 2500 });
    }
  };

  const handleValveChange = (index, newValve) => {
    setPulsarStages(prev => prev.map((s, i) => i === index ? { ...s, valve: newValve } : s));
    if (navigator.vibrate) {
      try { navigator.vibrate(12); } catch (e) {}
    }
  };

  useEffect(() => {
    const targetRecipe = prefillRecipe || (batch && batch.recipes && batch.recipes.length > 0 ? batch.recipes[0] : null);
    if (targetRecipe) {
      if (targetRecipe.method) {
        const recMethod = targetRecipe.method.toLowerCase();
        if (recMethod.includes('pulsar')) setMethod('NextLevel Pulsar Mini');
        else setMethod(targetRecipe.method);
      } else {
        setMethod('V60 (Filtrado)');
      }
      if (targetRecipe.ratio && targetRecipe.ratio.includes('1:')) {
        const rm = targetRecipe.ratio.match(/1:([0-9.]+)/);
        if (rm) setRatioVal(parseFloat(rm[1]) || 15.0);
      }
      if (targetRecipe.grind && targetRecipe.grind.includes('J-Max:')) {
        const parts = targetRecipe.grind.replace('J-Max:', '').trim().split('.');
        if (parts.length === 3) {
          setJmaxRot(parseInt(parts[0]) || 1);
          setJmaxNum(parseInt(parts[1]) || 5);
          setJmaxClick(parseInt(parts[2]) || 0);
        }
      }
      setDoseInG(targetRecipe.dose_in_g !== null && targetRecipe.dose_in_g !== undefined ? targetRecipe.dose_in_g : parseFloat(batch?.dose_weight) || 20.0);
      setDoseOutG(targetRecipe.dose_out_g !== null && targetRecipe.dose_out_g !== undefined ? targetRecipe.dose_out_g : 36.0);
      setWaterTemp(targetRecipe.temperature ? parseInt(targetRecipe.temperature) || 93 : 93);
      setEspressoPressure(targetRecipe.espresso_pressure !== null && targetRecipe.espresso_pressure !== undefined ? targetRecipe.espresso_pressure : 9);
      setEspressoPreinfusion(targetRecipe.espresso_preinfusion !== null && targetRecipe.espresso_preinfusion !== undefined ? targetRecipe.espresso_preinfusion : 5);
      setSensoryBalance(targetRecipe.sensory_balance || 'Dulce');
      setSensoryBody(targetRecipe.sensory_body || 'Medio');
      setSensoryExtraction(targetRecipe.sensory_extraction || 'En Punto');
      if (targetRecipe.brew_time) setBrewTime(targetRecipe.brew_time);
      if (targetRecipe.notes) setNotes(targetRecipe.notes);
    } else if (batch) {
      setDoseInG(parseFloat(batch.dose_weight) || 20.0);
    }
  }, [batch, prefillRecipe]);

  const currentMicrons = Math.round(((jmaxRot * 90) + (jmaxNum * 10) + jmaxClick) * 8.8);

  const handleAiRecommend = () => {
    const apiKey = localStorage.getItem('gemini-api-key');
    if (!apiKey) {
      if (showToast) showToast('Configura tu clave API de Gemini en Ajustes para usar la IA.', { type: 'error', duration: 4000 });
      return;
    }
    const model = localStorage.getItem('gemini-model') || 'gemini-2.0-flash';
    const isThinking = localStorage.getItem('gemini-thinking') === 'true';

    setAiLoading(true); setAiError(''); setAiRecommendation(null);
    fetch(apiUrl('api/recommend-recipe'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-gemini-key': apiKey,
        'x-gemini-model': model,
        'x-gemini-thinking': isThinking ? 'true' : 'false'
      },
      body: JSON.stringify({ origin: batch.origin, variety: batch.variety, process: batch.process, altitude: batch.altitude, roast_level: batch.roast_level, roaster_notes: batch.roaster_notes, method: method, dose_in_g: doseInG })
    }).then(async (res) => {
      if (!res.ok) throw new Error((await res.json()).error || 'Error');
      return res.json();
    }).then(data => {
      setAiRecommendation(data);
      if (data._source === 'barista_fallback') {
        if (showToast) showToast('Receta calibrada con motor Barista Offline', { type: 'info', duration: 3000 });
      } else {
        if (showToast) showToast('¡Recomendación generada por la IA!', { type: 'success', duration: 2500 });
      }
    }).catch(err => {
      setAiError(err.message);
      if (showToast) showToast('Error al obtener receta de IA.', { type: 'error', duration: 4000 });
    }).finally(() => setAiLoading(false));
  };

  const handleAiTuneRecipe = () => {
    const apiKey = localStorage.getItem('gemini-api-key');
    if (!apiKey) {
      if (showToast) showToast('Configura tu clave API de Gemini en Ajustes para recalibrar.', { type: 'error', duration: 4000 });
      return;
    }
    const model = localStorage.getItem('gemini-model') || 'gemini-2.0-flash';
    const isThinking = localStorage.getItem('gemini-thinking') === 'true';

    setAiLoading(true); setAiError('');
    fetch(apiUrl('api/ai/tune-recipe'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-gemini-key': apiKey,
        'x-gemini-model': model,
        'x-gemini-thinking': isThinking ? 'true' : 'false'
      },
      body: JSON.stringify({
        method, dose_in_g: doseInG, ratio: `1:${ratioVal}`, temperature: waterTemp,
        jmax_rot: jmaxRot, jmax_num: jmaxNum, jmax_click: jmaxClick,
        sensory_extraction: sensoryExtraction, sensory_balance: sensoryBalance,
        sensory_body: sensoryBody, user_notes: notes, batch_name: batch.name
      })
    }).then(async (res) => {
      if (!res.ok) throw new Error((await res.json()).error || 'Error recalibrando');
      return res.json();
    }).then(data => {
      setAiRecommendation(data);
      if (showToast) showToast(`🤖 Recalibración IA lista: ${data.correction_reason || 'Nuevos vertidos y molienda sugeridos'}`, { type: 'success', duration: 4000 });
    }).catch(err => {
      setAiError(err.message);
      if (showToast) showToast('Error al recalibrar con IA.', { type: 'error', duration: 4000 });
    }).finally(() => setAiLoading(false));
  };

  const handleApplyAiRecipe = () => {
    if (!aiRecommendation) return;
    const recMethod = (aiRecommendation.method || '').toLowerCase();
    if (recMethod.includes('v60') || recMethod.includes('filtrado')) setMethod('V60 (Filtrado)');
    else if (recMethod.includes('espresso') || recMethod.includes('expresso')) setMethod('Espresso');
    else if (recMethod.includes('aero') || recMethod.includes('press')) setMethod('AeroPress');
    else if (recMethod.includes('prensa') || recMethod.includes('francesa')) setMethod('Prensa Francesa');
    else if (recMethod.includes('pulsar')) setMethod('NextLevel Pulsar Mini');

    if (recMethod.includes('pulsar') && aiRecommendation.pours && aiRecommendation.pours.length > 0) {
      setPulsarStages(aiRecommendation.pours.map((p, i) => ({
        step: p.step || i + 1,
        label: p.label,
        water_g: p.water_g || p.water,
        valve: p.valve || 'open',
        time: p.time,
        desc: p.description
      })));
    }

    if (aiRecommendation.jmax_rot !== undefined) setJmaxRot(parseInt(aiRecommendation.jmax_rot) || 0);
    if (aiRecommendation.jmax_num !== undefined) setJmaxNum(parseInt(aiRecommendation.jmax_num) || 0);
    if (aiRecommendation.jmax_click !== undefined) setJmaxClick(parseInt(aiRecommendation.jmax_click) || 0);

    if (aiRecommendation.ratio && aiRecommendation.ratio.includes('1:')) {
      const rm = aiRecommendation.ratio.match(/1:([0-9.]+)/);
      if (rm) setRatioVal(parseFloat(rm[1]) || 15.0);
    }
    if (aiRecommendation.temperature) setWaterTemp(parseInt(aiRecommendation.temperature) || 93);
    if (aiRecommendation.brew_time) setBrewTime(aiRecommendation.brew_time);
    if (aiRecommendation.notes) setNotes(prev => `[IA: ${aiRecommendation.notes}] ${prev.replace(/\[IA:.*?\]/g, '').trim()}`.trim());
    if (showToast) showToast('Receta y molienda J-Max de IA aplicadas.', { type: 'success', duration: 3000 });
    setAiRecommendation(null);
  };

  const handleRecipeSubmit = (e) => {
    e.preventDefault();
    const ratioText = method === 'Espresso' ? `1:${(doseOutG / doseInG).toFixed(1)}` : `1:${ratioVal.toFixed(1)} (${(doseInG * ratioVal).toFixed(0)}g)`;
    
    let finalNotes = notes.trim();
    if (method === 'NextLevel Pulsar Mini' && pulsarStages && pulsarStages.length > 0) {
      const valveSeq = pulsarStages.map(s => {
        const vText = s.valve === 'closed' ? '🔒 Cerrada' : s.valve === 'half' ? '⚡ 50% Media' : '🔓 100% Abierta';
        const lbl = (s.label || `Paso ${s.step}`).split('(')[0].trim();
        return `${lbl}: ${vText}`;
      }).join(' • ');
      if (!finalNotes.includes('[Válvula:')) {
        finalNotes = finalNotes ? `${finalNotes} | [Válvula: ${valveSeq}]` : `[Válvula: ${valveSeq}]`;
      }
    }

    onSaveRecipe({
      batch_id: batch.id, method, ratio: ratioText, grind: `J-Max: ${jmaxRot}.${jmaxNum}.${jmaxClick}`, temperature: `${waterTemp}°C`,
      brew_time: brewTime, notes: finalNotes, sensory_balance: sensoryBalance, sensory_body: sensoryBody, sensory_extraction: sensoryExtraction,
      dose_in_g: parseFloat(doseInG), dose_out_g: method === 'Espresso' ? parseFloat(doseOutG) : null,
      espresso_pressure: method === 'Espresso' ? parseFloat(espressoPressure) : null, espresso_preinfusion: method === 'Espresso' ? parseInt(espressoPreinfusion) : null
    });
    setBatch(prev => ({ ...prev, remaining_weight_g: Math.max(0.0, prev.remaining_weight_g - parseFloat(doseInG)) }));
    setNotes('');
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="btn-candy" onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <X size={16} strokeWidth={2.5} />
          Cancelar
        </button>
      </div>

      <div className="candy-card static" style={{ marginTop: '24px', backgroundColor: calcVisible ? 'var(--bg-canvas)' : 'var(--bg-card)' }}>
        <div onClick={() => setCalcVisible(!calcVisible)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calculator size={18} color="var(--color-crimson)" />
            <span style={{ fontWeight: '700', fontSize: '15px' }}>Calculadora de Barista & Vertidos</span>
          </div>
          <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{calcVisible ? 'Ocultar' : 'Abrir Barista Calc ☕'}</span>
        </div>
        {calcVisible && (
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }} className="animate-entrance">
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ flex: 1, margin: 0 }}>
                <label style={{ fontSize: '11px' }}>Dosis Café (g)</label>
                <input type="number" step="0.5" className="candy-input" value={calcDose} onChange={(e) => { const d = parseFloat(e.target.value) || 0; setCalcDose(d); setCalcWater(Math.round(d * calcRatio)); }} />
              </div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', paddingBottom: '10px' }}>×</div>
              <div className="form-group" style={{ flex: 1, margin: 0 }}>
                <label style={{ fontSize: '11px' }}>Ratio 1:</label>
                <input type="number" step="0.5" className="candy-input" value={calcRatio} onChange={(e) => { const r = parseFloat(e.target.value) || 0; setCalcRatio(r); setCalcWater(Math.round(calcDose * r)); }} />
              </div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', paddingBottom: '10px' }}>=</div>
              <div className="form-group" style={{ flex: 1, margin: 0 }}>
                <label style={{ fontSize: '11px' }}>Agua Total (g)</label>
                <input type="number" className="candy-input" value={calcWater} onChange={(e) => { const w = parseFloat(e.target.value) || 0; setCalcWater(w); if (calcDose > 0) setCalcRatio(parseFloat((w / calcDose).toFixed(1))); }} />
              </div>
            </div>

            <div style={{ padding: '12px', backgroundColor: '#FFFFFF', border: '2px solid var(--border-color)', borderRadius: '6px', boxShadow: '2px 2px 0px var(--border-color)' }}>
              <div style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', color: 'var(--color-crimson)', marginBottom: '8px', fontFamily: 'var(--font-heading)' }}>
                💧 Guía de Vertidos por Etapas ({calcDose}g café / {calcWater}g agua)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', textAlign: 'center' }}>
                <div style={{ padding: '6px', backgroundColor: '#FFF5F5', border: '1px solid var(--color-crimson)', borderRadius: '4px' }}>
                  <div style={{ fontSize: '9.5px', fontWeight: 'bold', color: 'var(--color-crimson)' }}>
                    {method === 'NextLevel Pulsar Mini' ? '🔒 Bloom Cerrada' : '🌸 Bloom'}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '900', margin: '2px 0' }}>{Math.round(calcDose * 3)}g</div>
                  <div style={{ fontSize: '8.5px', color: 'var(--color-text-muted)' }}>0s - 45s</div>
                </div>
                <div style={{ padding: '6px', backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                  <div style={{ fontSize: '9.5px', fontWeight: 'bold', color: 'var(--color-text)' }}>
                    {method === 'NextLevel Pulsar Mini' ? '⚡/🔓 Vertido 1' : '🌊 Vertido 1'}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '900', margin: '2px 0' }}>{Math.round(calcDose * 3 + (calcWater - calcDose * 3) * 0.5)}g</div>
                  <div style={{ fontSize: '8.5px', color: 'var(--color-text-muted)' }}>45s - 1m 20s</div>
                </div>
                <div style={{ padding: '6px', backgroundColor: '#F7FAFC', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                  <div style={{ fontSize: '9.5px', fontWeight: 'bold', color: 'var(--color-text)' }}>
                    {method === 'NextLevel Pulsar Mini' ? '🔓 Drenaje 100%' : '☕ Vertido 2'}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '900', margin: '2px 0' }}>{calcWater}g</div>
                  <div style={{ fontSize: '8.5px', color: 'var(--color-text-muted)' }}>1m 20s - 2m 30s</div>
                </div>
              </div>
            </div>

            <button type="button" className="btn-candy accent" onClick={() => { setDoseInG(calcDose); setRatioVal(calcRatio); if (method === 'Espresso') setDoseOutG(calcWater); setCalcVisible(false); if (showToast) showToast('Valores y vertidos transferidos.', { type: 'success', duration: 2000 }); }} style={{ padding: '8px', fontSize: '11px', minHeight: '34px', width: '100%' }}>
              Usar Dosis ({calcDose}g) y Ratio (1:{calcRatio}) en mi Receta
            </button>
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
            { id: 'Prensa Francesa', lucide: <Coffee size={24} />, label: 'Prensa' },
            { id: 'NextLevel Pulsar Mini', lucide: <SlidersHorizontal size={24} />, label: 'Pulsar Mini' }
          ].map(m => (
            <div 
              key={m.id} 
              role="button"
              tabIndex={0}
              aria-pressed={method === m.id}
              aria-label={`Seleccionar método ${m.label}`}
              onClick={() => {
                setMethod(m.id);
                if (m.id === 'NextLevel Pulsar Mini') {
                  if (doseInG === 20.0 || !doseInG) setDoseInG(15.0);
                  if (ratioVal === 15.0 || !ratioVal) setRatioVal(16.6);
                }
                if (navigator.vibrate) navigator.vibrate(40);
              }} 
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setMethod(m.id);
                  if (m.id === 'NextLevel Pulsar Mini') {
                    if (doseInG === 20.0 || !doseInG) setDoseInG(15.0);
                    if (ratioVal === 15.0 || !ratioVal) setRatioVal(16.6);
                  }
                  if (navigator.vibrate) navigator.vibrate(40);
                }
              }}
              style={{ flex: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
            >
              <div className="candy-card" style={{ width: '100%', aspectRatio: '1/1', padding: 0, margin: 0, borderColor: method === m.id ? 'var(--color-crimson)' : 'var(--border-color)', borderWidth: method === m.id ? '3px' : '2px', backgroundColor: method === m.id ? 'var(--color-crimson)' : 'var(--bg-card)', boxShadow: method === m.id ? 'none' : '3px 3px 0px var(--border-color)', transform: method === m.id ? 'translate(2px, 2px)' : 'none', transition: 'all 0.15s var(--transition-spring)' }}>
                <div style={{ width: '100%', height: '100%', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: method === m.id ? '#FFFFFF' : 'var(--color-crimson)' }}>
                  {m.lucide}
                </div>
              </div>
              <span style={{ fontSize: '10px', fontWeight: method === m.id ? '900' : '600', color: method === m.id ? 'var(--color-text)' : 'var(--color-text-muted)' }}>{m.label}</span>
            </div>
          ))}
        </div>

        {/* Control Interactivo de Válvula Pulsar Mini (Scott Rao / Jonathan Gagné) */}
        {method === 'NextLevel Pulsar Mini' && (
          <div className="candy-card static" style={{ margin: '16px 0', padding: '16px', border: '2px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <SlidersHorizontal size={18} color="var(--color-crimson)" />
                <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '13px', textTransform: 'uppercase', margin: 0, color: 'var(--color-text)', letterSpacing: '0.5px' }}>
                  Control de Válvula de Flujo (Pulsar Mini)
                </h4>
              </div>
              <span style={{ fontSize: '10px', background: 'var(--bg-header)', color: 'var(--color-crimson)', padding: '2px 8px', borderRadius: '4px', fontWeight: '900', border: '1px solid var(--border-color)' }}>
                NO-BYPASS
              </span>
            </div>

            {/* Presets Bar */}
            <div style={{ marginBottom: '14px' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-text-muted)', display: 'block', marginBottom: '6px' }}>
                Presets Legendarios Barista:
              </span>
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                {[
                  { id: 'scott-rao-pulsar-mini', label: 'Scott Rao No-Bypass', badge: '1:16.6 • 94°C' },
                  { id: 'gagne-high-extraction-mini', label: 'Jonathan Gagné 50%', badge: '1:17 • 96°C' },
                  { id: 'pulsar-mini-concentrate', label: 'Pulsar Concentrado', badge: '1:14 • 92°C' }
                ].map(preset => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPulsarPreset(preset.id)}
                    className="btn-candy"
                    style={{
                      margin: 0,
                      fontSize: '11px',
                      padding: '8px 12px',
                      minHeight: '44px',
                      flexShrink: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      justifyContent: 'center',
                      gap: '2px'
                    }}
                  >
                    <strong style={{ fontSize: '11.5px' }}>{preset.label}</strong>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{preset.badge}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Etapas y Selector de Válvula de 3 Estados */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label className="barista-label">
                Posición de la Válvula por Etapa de Extracción:
              </label>
              {pulsarStages.map((stage, idx) => (
                <div 
                  key={stage.step || idx}
                  style={{
                    padding: '12px',
                    backgroundColor: 'var(--barista-bg-surface, var(--bg-canvas))',
                    border: '1.5px solid var(--border-color)',
                    borderRadius: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--color-text)' }}>
                      Etapa {stage.step}: {stage.label} (+{stage.water_g}g)
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 'bold' }}>
                      ⏱️ {stage.time}
                    </span>
                  </div>

                  {/* Selector de 3 Estados */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => handleValveChange(idx, 'closed')}
                      style={{
                        minHeight: '44px',
                        padding: '6px 8px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: '800',
                        cursor: 'pointer',
                        border: stage.valve === 'closed' ? '2px solid #EF4444' : '1px solid var(--border-color)',
                        backgroundColor: stage.valve === 'closed' ? '#FEE2E2' : 'var(--bg-card)',
                        color: stage.valve === 'closed' ? '#991B1B' : 'var(--color-text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span>🔒</span>
                      <span>Cerrada</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleValveChange(idx, 'half')}
                      style={{
                        minHeight: '44px',
                        padding: '6px 8px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: '800',
                        cursor: 'pointer',
                        border: stage.valve === 'half' ? '2px solid #F59E0B' : '1px solid var(--border-color)',
                        backgroundColor: stage.valve === 'half' ? '#FEF3C7' : 'var(--bg-card)',
                        color: stage.valve === 'half' ? '#92400E' : 'var(--color-text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span>⚡</span>
                      <span>50% Media</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleValveChange(idx, 'open')}
                      style={{
                        minHeight: '44px',
                        padding: '6px 8px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: '800',
                        cursor: 'pointer',
                        border: stage.valve === 'open' ? '2px solid #10B981' : '1px solid var(--border-color)',
                        backgroundColor: stage.valve === 'open' ? '#D1FAE5' : 'var(--bg-card)',
                        color: stage.valve === 'open' ? '#065F46' : 'var(--color-text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span>🔓</span>
                      <span>100% Abierta</span>
                    </button>
                  </div>

                  {stage.desc && (
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: 1.3 }}>
                      {stage.desc}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <details className="bento-accordion" style={{ margin: '16px 0' }}>
          <summary className="bento-accordion-header" style={{ padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>✨</span>
              <span style={{ fontWeight: '900', fontSize: '12px', textTransform: 'uppercase', fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
                Asistente IA Barista ({method})
              </span>
            </div>
            <span style={{ fontSize: '11px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--barista-accent-honey, var(--color-crimson))', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {doseInG}g ▼
            </span>
          </summary>
          <div style={{ padding: '14px', backgroundColor: 'var(--bg-card)' }}>
          <p style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', margin: '0 0 12px 0', lineHeight: 1.4 }}>Diseña o recalibra una receta completa de <strong>{method}</strong> para <strong>{doseInG}g</strong> con molienda J-Max y secuencia de vertidos.</p>
          {aiError && <div style={{ color: '#E53E3E', fontSize: '11px', fontWeight: 'bold', marginBottom: '10px' }}>⚠️ Error: {aiError}</div>}
          {aiRecommendation ? (
            <div style={{ padding: '14px', backgroundColor: 'var(--barista-bg-surface, #FFFFFF)', border: '1px solid var(--barista-border-hairline, var(--border-color))', borderRadius: 'var(--barista-radius-md, 12px)', marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: 'var(--barista-shadow-card)' }}>
              {aiRecommendation.correction_reason && (
                <div style={{ backgroundColor: 'var(--barista-accent-danger-subtle, #FEF2F2)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#EF4444', padding: '8px 10px', borderRadius: '8px', fontSize: '11.5px', fontWeight: '700' }}>
                  🔧 Diagnóstico Recalibración: {aiRecommendation.correction_reason}
                </div>
              )}

              {/* Badges de Parámetros Clave */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                <div style={{ background: 'var(--barista-bg-canvas, var(--bg-canvas))', padding: '8px', borderRadius: '8px', border: '1px solid var(--barista-border-hairline, var(--border-color))', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em', color: 'var(--color-text-muted)' }}>Ratio / Agua</div>
                  <div style={{ fontSize: '13px', fontWeight: '900', color: 'var(--barista-accent-honey, var(--color-crimson))', fontFamily: 'var(--font-mono)' }}>
                    {aiRecommendation.ratio} ({aiRecommendation.water_total_g || Math.round(doseInG * (parseFloat(aiRecommendation.ratio?.split(':')[1]) || 15))}g)
                  </div>
                </div>
                <div style={{ background: 'var(--barista-bg-canvas, var(--bg-canvas))', padding: '8px', borderRadius: '8px', border: '1px solid var(--barista-border-hairline, var(--border-color))', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em', color: 'var(--color-text-muted)' }}>Temperatura</div>
                  <div style={{ fontSize: '13px', fontWeight: '900', fontFamily: 'var(--font-mono)' }}>{aiRecommendation.temperature}°C</div>
                </div>
                <div style={{ background: 'var(--barista-bg-canvas, var(--bg-canvas))', padding: '8px', borderRadius: '8px', border: '1px solid var(--barista-border-hairline, var(--border-color))', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em', color: 'var(--color-text-muted)' }}>Tiempo Total</div>
                  <div style={{ fontSize: '13px', fontWeight: '900', fontFamily: 'var(--font-mono)' }}>{aiRecommendation.brew_time}</div>
                </div>
              </div>

              {/* Sección Molienda y Molinos */}
              <div style={{ background: 'var(--bg-canvas)', padding: '10px 12px', borderRadius: '6px', border: '1.5px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', color: 'var(--color-crimson)', fontFamily: 'var(--font-heading)' }}>
                    ⚙️ Molienda: {aiRecommendation.grind_microns || aiRecommendation.grind || 'Medio-Fino'}
                  </span>
                  <span style={{ fontSize: '10px', fontWeight: 'bold', background: 'var(--color-crimson)', color: '#FFF', padding: '2px 6px', borderRadius: '4px' }}>
                    J-Max: {aiRecommendation.jmax_rot !== undefined ? `${aiRecommendation.jmax_rot}.${aiRecommendation.jmax_num}.${aiRecommendation.jmax_click}` : (aiRecommendation.grinders?.jmax || '1.5.0')}
                  </span>
                </div>
                {aiRecommendation.grind_adjustment_reason && (
                  <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--color-text-muted)', fontStyle: 'italic', marginTop: '2px' }}>
                    💡 Calibración J-Max: {aiRecommendation.grind_adjustment_reason}
                  </div>
                )}
                {aiRecommendation.grinders && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', fontSize: '9.5px', marginTop: '4px', borderTop: '1px dashed var(--border-color)', paddingTop: '4px' }}>
                    <div><strong>Femobook A2:</strong> {aiRecommendation.grinders.femobook_a2 || '60 clics (1.5 Rot.)'}</div>
                    <div><strong>Comandante C40:</strong> {aiRecommendation.grinders.comandante || '22 clics'}</div>
                    <div><strong>Timemore C2/C3:</strong> {aiRecommendation.grinders.timemore || '16 clics'}</div>
                    <div><strong>Baratza Encore:</strong> {aiRecommendation.grinders.baratza || 'Ajuste 14'}</div>
                  </div>
                )}
              </div>

              {/* Vertidos (Pours) */}
              {aiRecommendation.pours && aiRecommendation.pours.length > 0 && (
                <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '10px' }}>
                  <div style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', color: 'var(--color-crimson)', marginBottom: '6px', fontFamily: 'var(--font-heading)' }}>
                    💧 Guía de Vertidos por Etapas ({doseInG}g café)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {aiRecommendation.pours.map(p => (
                      <div key={p.step || p.label} style={{ padding: '8px 10px', backgroundColor: 'var(--bg-canvas)', border: '1.5px solid var(--border-color)', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {p.valve === 'closed' && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '4px', fontSize: '10.5px', fontWeight: '800', background: '#FED7D7', color: '#9B2C2C', border: '1px solid #FEB2B2', marginBottom: '4px', width: 'fit-content' }}>🔒 VÁLVULA CERRADA (Bloom + Inmersión)</div>
                        )}
                        {p.valve === 'open' && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '4px', fontSize: '10.5px', fontWeight: '800', background: '#C6F6D5', color: '#22543D', border: '1px solid #9AE6B4', marginBottom: '4px', width: 'fit-content' }}>🔓 VÁLVULA ABIERTA (Percolación)</div>
                        )}
                        {p.valve === 'half' && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '4px', fontSize: '10.5px', fontWeight: '800', background: '#FEFCBF', color: '#744210', border: '1px solid #F6E05E', marginBottom: '4px', width: 'fit-content' }}>⚡ VÁLVULA MEDIA (Flujo Regulado 50%)</div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '10.5px', fontWeight: '900', color: 'var(--color-crimson)' }}>
                            Paso {p.step}: {p.label}
                          </span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9.5px', fontWeight: '800', backgroundColor: '#FFFFFF', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                            ⏱️ {p.time}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', fontSize: '10px', fontWeight: 'bold' }}>
                          <span>Vertido: +{p.water_g || p.water}g</span>
                          {p.total_water_g && <span>Acumulado: {p.total_water_g}g</span>}
                        </div>
                        {p.description && <div style={{ fontSize: '9.5px', color: 'var(--color-text-muted)', lineHeight: '1.3' }}>{p.description}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pasos */}
              {aiRecommendation.steps && aiRecommendation.steps.length > 0 && (
                <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '10px' }}>
                  <div style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', color: 'var(--color-text)', marginBottom: '4px', fontFamily: 'var(--font-heading)' }}>
                    📋 Pasos de Preparación:
                  </div>
                  <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '10.5px', color: 'var(--color-text-muted)' }}>
                    {aiRecommendation.steps.map((st, idx) => (
                      <li key={idx} style={{ marginBottom: '2px' }}>{st}</li>
                    ))}
                  </ol>
                </div>
              )}

              <div style={{ fontSize: '10.5px', color: 'var(--color-text)', borderTop: '1px dashed var(--border-color)', paddingTop: '8px', marginTop: '2px', lineHeight: 1.4 }}>
                <strong>Notas Barista / Perfil:</strong> {aiRecommendation.notes}
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button type="button" className="btn-candy primary" onClick={handleApplyAiRecipe} style={{ flex: 1, padding: '8px', fontSize: '11px', minHeight: '34px' }}>
                  Aplicar Receta y Molienda al Formulario
                </button>
                <button type="button" className="btn-candy" onClick={() => setAiRecommendation(null)} style={{ padding: '6px 12px', fontSize: '11px', minHeight: '34px', margin: 0 }}>Cerrar</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" className="btn-candy" onClick={handleAiRecommend} disabled={aiLoading} style={{ flex: 1, margin: 0, padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11px', minHeight: '34px' }}>
                {aiLoading ? <span>Generando... 🧠</span> : <span>Diseñar Receta IA ✨</span>}
              </button>
              <button type="button" className="btn-candy" onClick={handleAiTuneRecipe} disabled={aiLoading} style={{ flex: 1, margin: 0, padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11px', minHeight: '34px' }}>
                {aiLoading ? <span>Recalibrando... 🔧</span> : <span>Recalibrar IA 🔧</span>}
              </button>
            </div>
          )}
        </div>
      </details>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '14px' }}>
          <details className="bento-accordion" open>
            <summary className="bento-accordion-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Scale size={16} color="var(--color-crimson)" />
                <span>Parámetros Base</span>
              </div>
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>▼</span>
            </summary>
            <div className="bento-grid" style={{ marginTop: '12px', marginBottom: 0 }}>
              <div className="bento-widget accent"><div className="bento-header"><span>Grams</span><Scale size={16} /></div><div className="bento-value-container"><input type="number" step="0.1" value={doseInG} onChange={(e) => setDoseInG(parseFloat(e.target.value) || 0)} /><span className="unit">g</span></div><div className="bento-controls"><button type="button" className="bento-btn" onClick={() => setDoseInG(d => Math.max(0, d - 0.5))}>-</button><div className="bento-info">DOSE</div><button type="button" className="bento-btn" onClick={() => setDoseInG(d => d + 0.5)}>+</button></div></div>
              <div className="bento-widget"><div className="bento-header"><span>{method !== 'Espresso' ? 'Ratio' : 'Yield'}</span><Droplet size={16} color="var(--color-crimson)" /></div><div className="bento-value-container">{method !== 'Espresso' ? (<><span style={{ fontSize: '28px', fontWeight: '900', fontFamily: 'var(--font-mono)' }}>1:</span><input type="number" step="0.1" style={{ textAlign: 'left', color: 'var(--color-crimson)' }} value={ratioVal} onChange={(e) => setRatioVal(parseFloat(e.target.value) || 0)} /></>) : (<><input type="number" step="0.5" style={{ color: 'var(--color-crimson)' }} value={doseOutG} onChange={(e) => setDoseOutG(parseFloat(e.target.value) || 0)} /><span className="unit" style={{ color: 'var(--color-crimson)' }}>g</span></>)}</div><div className="bento-controls"><button type="button" className="bento-btn" onClick={() => method !== 'Espresso' ? setRatioVal(r => Math.max(1, r - 0.5)) : setDoseOutG(d => Math.max(0, d - 1))}>-</button><div className="bento-info">TARGET</div><button type="button" className="bento-btn" onClick={() => method !== 'Espresso' ? setRatioVal(r => r + 0.5) : setDoseOutG(d => d + 1)}>+</button></div><div className="bento-info" style={{ marginTop: '2px', color: 'var(--color-text-muted)' }}>{method !== 'Espresso' ? `OUT: ${(doseInG * (ratioVal || 0)).toFixed(0)} g` : `1:${(doseOutG / (doseInG || 1)).toFixed(1)}`}</div></div>
              <div className="bento-widget"><div className="bento-header"><span>Temp</span><Thermometer size={16} /></div><div className="bento-value-container"><input type="number" style={{ color: 'var(--color-crimson)' }} value={waterTemp} onChange={(e) => setWaterTemp(parseInt(e.target.value) || 93)} /><span className="unit" style={{ color: 'var(--color-crimson)' }}>°C</span></div><div className="bento-controls"><button type="button" className="bento-btn" onClick={() => setWaterTemp(t => Math.max(80, t - 1))}>-</button><div className="bento-info">WATER</div><button type="button" className="bento-btn" onClick={() => setWaterTemp(t => Math.min(100, t + 1))}>+</button></div></div>
              {method === 'Espresso' ? (
                <div className="bento-widget accent"><div className="bento-header"><span>Pressure</span><Gauge size={16} /></div><div className="bento-value-container"><input type="number" step="0.5" value={espressoPressure} onChange={(e) => setEspressoPressure(parseFloat(e.target.value) || 9)} /><span className="unit">bar</span></div><div className="bento-controls"><button type="button" className="bento-btn" onClick={() => setEspressoPressure(p => Math.max(0, p - 0.5))}>-</button><div className="bento-info">EXTRACT</div><button type="button" className="bento-btn" onClick={() => setEspressoPressure(p => p + 0.5)}>+</button></div></div>
              ) : (
                <div className="bento-widget"><div className="bento-header"><span>Timer</span><Timer size={16} /></div><div className="bento-value-container" style={{ position: 'relative' }}><input type="text" style={{ fontSize: '24px' }} value={brewTime} onChange={(e) => setBrewTime(e.target.value)} /></div><div className="bento-controls" style={{ justifyContent: 'center' }}><div className="bento-info">DURATION</div></div></div>
              )}
            </div>
          </details>

          {/* Section 2: J-Max Grinder */}
          <details className="bento-accordion" open>
            <summary className="bento-accordion-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Coffee size={16} color="var(--color-crimson)" />
                <span>Molienda 1Zpresso J-Max</span>
              </div>
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>▼</span>
            </summary>
            <div style={{ marginTop: '10px' }}>
              {/* Rotary Dial Visual Gauge */}
              <div className="rotary-dial-gauge-wrapper">
                <div className="rotary-dial-disc">
                  <div className="rotary-dial-ticks" />
                  <div 
                    className="rotary-dial-needle" 
                    style={{ transform: `rotate(${Math.round(jmaxRot * 72 + jmaxNum * 8 + jmaxClick * 0.8)}deg)` }} 
                  />
                  <div className="rotary-dial-center-cap" />
                </div>
                <div className="rotary-dial-readout">
                  <span className="rotary-dial-chip">J-Max {jmaxRot}.{jmaxNum}.{jmaxClick}</span>
                  <span className="rotary-dial-microns">~{currentMicrons} µm ({currentMicrons < 400 ? 'Espresso' : currentMicrons < 850 ? 'Filtrado' : 'Prensa'})</span>
                </div>
              </div>

              {/* Rotations */}
              <div>
                <span style={{ fontSize: '10px', fontWeight: '900', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Rotación (0..4)</span>
                <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                  {[0, 1, 2, 3, 4].map(r => (
                    <button key={r} type="button" className={`btn-candy ${jmaxRot === r ? 'primary' : ''}`} onClick={() => setJmaxRot(r)} style={{ flex: 1, padding: '4px', fontSize: '12px', minHeight: '30px', margin: 0 }}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Numbers */}
              <div style={{ marginTop: '8px' }}>
                <span style={{ fontSize: '10px', fontWeight: '900', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Número (0..8)</span>
                <div style={{ display: 'flex', gap: '4px', marginTop: '4px', overflowX: 'auto' }}>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                    <button key={n} type="button" className={`btn-candy ${jmaxNum === n ? 'primary' : ''}`} onClick={() => setJmaxNum(n)} style={{ flex: 1, padding: '4px', fontSize: '11px', minHeight: '30px', margin: 0 }}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clicks */}
              <div style={{ marginTop: '8px' }}>
                <span style={{ fontSize: '10px', fontWeight: '900', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Clic (0..9)</span>
                <div style={{ display: 'flex', gap: '3px', marginTop: '4px', overflowX: 'auto' }}>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(c => (
                    <button key={c} type="button" className={`btn-candy ${jmaxClick === c ? 'primary' : ''}`} onClick={() => setJmaxClick(c)} style={{ flex: 1, padding: '2px', fontSize: '10px', minHeight: '28px', margin: 0 }}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </details>

          {/* Section 3: Sensory Evaluation */}
          <details className="bento-accordion">
            <summary className="bento-accordion-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px' }}>🧪</span>
                <span>Evaluación Sensorial (Taza Perfecta)</span>
              </div>
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>▼</span>
            </summary>
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label className="barista-label">Balance Sensorial (Predominante)</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['Ácido', 'Dulce', 'Amargo'].map(b => (
                    <button 
                      key={b} 
                      type="button" 
                      className={`btn-candy ${sensoryBalance === b ? 'primary' : ''}`} 
                      onClick={() => setSensoryBalance(b)} 
                      style={{ flex: 1, minHeight: '44px', fontSize: '13px', padding: '6px 12px', margin: 0 }}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="barista-label">Cuerpo / Textura</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['Ligero', 'Medio', 'Sedoso'].map(b => (
                    <button 
                      key={b} 
                      type="button" 
                      className={`btn-candy ${sensoryBody === b ? 'primary' : ''}`} 
                      onClick={() => setSensoryBody(b)} 
                      style={{ flex: 1, minHeight: '44px', fontSize: '13px', padding: '6px 12px', margin: 0 }}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="barista-label">Nivel de Extracción</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['Sub', 'En Punto', 'Sobre'].map(b => (
                    <button 
                      key={b} 
                      type="button" 
                      className={`btn-candy ${sensoryExtraction === b ? 'primary' : ''}`} 
                      onClick={() => setSensoryExtraction(b)} 
                      style={{ flex: 1, minHeight: '44px', fontSize: '12.5px', padding: '6px 10px', margin: 0 }}
                    >
                      {b === 'Sub' ? 'Sub (Agrio)' : b === 'Sobre' ? 'Sobre (Amargo)' : 'En Punto'}
                    </button>
                  ))}
                </div>
              </div>
              
              {sensoryExtraction !== 'En Punto' && (
                <button 
                  type="button" 
                  className="barista-btn-primary" 
                  onClick={handleAiTuneRecipe} 
                  disabled={aiLoading} 
                  style={{ width: '100%', marginTop: '6px', minHeight: '44px', height: '44px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  {aiLoading ? <span>Recalibrando Receta... 🧠</span> : <span>🤖 Recalibrar Receta con Gemini IA</span>}
                </button>
              )}

              <div className="form-group" style={{ marginTop: '4px' }}>
                <label className="barista-label">Notas / Comentarios de Extracción</label>
                <input className="barista-input" value={notes} onChange={(e) => setNotes(e.target.value)} type="text" placeholder="Ej. Muy balanceado, dulzor intenso, retrogusto largo" />
              </div>
            </div>
          </details>
        </div>

        <button type="submit" className="barista-btn-primary" style={{ width: '100%', marginTop: '20px', minHeight: '48px', height: '48px', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Save size={20} strokeWidth={2.5} />
          Guardar Bitácora
        </button>
      </form>
    </>
  );
}
