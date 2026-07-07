import React, { useState, useEffect, useRef } from 'react';
import { formatLocalDateStr } from '../utils/date';
import { getScaIcon, stripEmojis } from '../utils/scaIcons';
import { Calculator, Scale, Droplet, Thermometer, Gauge, Timer, Coffee, Save, Edit2, Trash2, ArrowLeft, Settings2, X, Edit3, Nfc } from 'lucide-react';



export default function BatchDetail({ batchId, onBack, onSubtractDose, onSaveRecipe, onDeleteBatch, onEditBatch, showToast }) {
  const [batch, setBatch] = useState(null);
  
  // Form fields
  const [method, setMethod] = useState('V60 (Filtrado)');
  
  // J-Max Steppers (Default: 1.5.0)
  const [jmaxRot, setJmaxRot] = useState(1);
  const [jmaxNum, setJmaxNum] = useState(5);
  const [jmaxClick, setJmaxClick] = useState(0);
  
  // Smart Ratio (Default: 15.0)
  const [ratioVal, setRatioVal] = useState(15.0);

  // Advanced Coffee Fields (Improvement 6 & 8)
  const [doseInG, setDoseInG] = useState(20.0);
  const [doseOutG, setDoseOutG] = useState(36.0);
  const [waterTemp, setWaterTemp] = useState(93);
  const [espressoPressure, setEspressoPressure] = useState(9);
  const [espressoPreinfusion, setEspressoPreinfusion] = useState(5);

  // Form input state for brew time
  const [brewTime, setBrewTime] = useState('2:30 min');

  // Sensory Evaluation States (Improvement 5)
  const [sensoryBalance, setSensoryBalance] = useState('Dulce');
  const [sensoryBody, setSensoryBody] = useState('Medio');
  const [sensoryExtraction, setSensoryExtraction] = useState('En Punto');
  const [notes, setNotes] = useState('');

  // Interactive Calculator State
  const [calcVisible, setCalcVisible] = useState(false);
  const [calcDose, setCalcDose] = useState(15.0);
  const [calcRatio, setCalcRatio] = useState(16.0);
  const [calcWater, setCalcWater] = useState(240);

  useEffect(() => {
    let active = true;
    fetch(`/api/batches/${batchId}`)
      .then(res => res.json())
      .then(data => {
        if (active) {
          setBatch(data);
          // If there is a last recipe, pre-populate parameters for convenience
          if (data.recipes && data.recipes.length > 0) {
            const last = data.recipes[0];
            setMethod(last.method || 'V60 (Filtrado)');
            
            // Try parsing ratio
            if (last.ratio && last.ratio.includes('1:')) {
              const ratioMatch = last.ratio.match(/1:([0-9.]+)/);
              if (ratioMatch) {
                setRatioVal(parseFloat(ratioMatch[1]) || 15.0);
              }
            }
            
            // Try parsing J-Max grind settings (format: "J-Max: R.N.C")
            if (last.grind && last.grind.includes('J-Max:')) {
              const grindParts = last.grind.replace('J-Max:', '').trim().split('.');
              if (grindParts.length === 3) {
                setJmaxRot(parseInt(grindParts[0]) || 1);
                setJmaxNum(parseInt(grindParts[1]) || 5);
                setJmaxClick(parseInt(grindParts[2]) || 0);
              }
            }

            // Pre-populate new fields
            setDoseInG(last.dose_in_g !== null && last.dose_in_g !== undefined ? last.dose_in_g : parseFloat(data.dose_weight) || 20.0);
            setDoseOutG(last.dose_out_g !== null && last.dose_out_g !== undefined ? last.dose_out_g : 36.0);
            setWaterTemp(last.temperature ? parseInt(last.temperature) || 93 : 93);
            setEspressoPressure(last.espresso_pressure !== null && last.espresso_pressure !== undefined ? last.espresso_pressure : 9);
            setEspressoPreinfusion(last.espresso_preinfusion !== null && last.espresso_preinfusion !== undefined ? last.espresso_preinfusion : 5);
            setSensoryBalance(last.sensory_balance || 'Dulce');
            setSensoryBody(last.sensory_body || 'Medio');
            setSensoryExtraction(last.sensory_extraction || 'En Punto');
          } else {
            // Defaults
            setDoseInG(parseFloat(data.dose_weight) || 20.0);
            setDoseOutG(36.0);
            setWaterTemp(93);
            setEspressoPressure(9);
            setEspressoPreinfusion(5);
          }
        }
      });
    return () => { active = false; };
  }, [batchId]);



  const handleDoseDeduction = () => {
    onSubtractDose(batch.id, () => {
      setBatch(prev => ({
        ...prev,
        remaining_doses: Math.max(0, prev.remaining_doses - 1)
      }));
    });
  };

  // Helper formula to translate J-Max grind settings to microns (Improvement 3)
  const calculateMicrons = (rot, num, click) => {
    const totalClicks = (rot * 90) + (num * 10) + click;
    return Math.round(totalClicks * 8.8); // 8.8 microns per click
  };

  // Convert grind text string e.g. "J-Max: 1.5.0" to numeric microns
  const parseGrindToMicrons = (grindStr) => {
    if (!grindStr || !grindStr.includes('J-Max:')) return null;
    const parts = grindStr.replace('J-Max:', '').trim().split('.');
    if (parts.length === 3) {
      return calculateMicrons(
        parseInt(parts[0]) || 0,
        parseInt(parts[1]) || 0,
        parseInt(parts[2]) || 0
      );
    }
    return null;
  };

  // 1-Click logging of last recipe
  const [repeating, setRepeating] = useState(false);

  const handleRepeatLastRecipe = () => {
    if (!batch.recipes || batch.recipes.length === 0) return;
    const last = batch.recipes[0];
    
    // Deduct dose and save recipe
    onSubtractDose(batch.id, () => {
      onSaveRecipe({
        batch_id: batch.id,
        method: last.method,
        ratio: last.ratio,
        grind: last.grind,
        temperature: last.temperature,
        brew_time: last.brew_time,
        notes: `${last.notes || ''} (Repetición rápida)`.trim(),
        sensory_balance: last.sensory_balance || 'Dulce',
        sensory_body: last.sensory_body || 'Medio',
        sensory_extraction: last.sensory_extraction || 'En Punto',
        dose_in_g: last.dose_in_g !== null && last.dose_in_g !== undefined ? last.dose_in_g : parseFloat(batch.dose_weight) || 20.0,
        dose_out_g: last.dose_out_g !== null && last.dose_out_g !== undefined ? last.dose_out_g : null,
        espresso_pressure: last.espresso_pressure !== null && last.espresso_pressure !== undefined ? last.espresso_pressure : null,
        espresso_preinfusion: last.espresso_preinfusion !== null && last.espresso_preinfusion !== undefined ? last.espresso_preinfusion : null
      });
      
      // Update UI remaining weight locally
      const doseInVal = last.dose_in_g !== null && last.dose_in_g !== undefined ? last.dose_in_g : parseFloat(batch.dose_weight) || 20.0;
      setBatch(prev => ({
        ...prev,
        remaining_weight_g: Math.max(0.0, prev.remaining_weight_g - doseInVal)
      }));
    });
  };

  const handleWriteNfc = async () => {
    if ('NDEFReader' in window) {
      try {
        const ndef = new window.NDEFReader();
        await ndef.write({
          records: [{
            recordType: "url",
            data: `https://beantag.cafe/batch/${batch.id}`
          }]
        });
        showToast('Etiqueta NFC vinculada con éxito. 🎉', { type: 'success', duration: 3000 });
      } catch (error) {
        showToast('Error al escribir NFC: ' + error.message, { type: 'error', duration: 4000 });
      }
    } else {
      showToast('Escritura NFC no disponible en este dispositivo (Usa Chrome en Android).', { type: 'error', duration: 5000 });
    }
  };

  const handleRecipeSubmit = (e) => {
    e.preventDefault();
    const ratioText = method === 'Espresso' 
      ? `1:${(doseOutG / doseInG).toFixed(1)}` 
      : `1:${ratioVal.toFixed(1)} (${(doseInG * ratioVal).toFixed(0)}g)`;

    onSaveRecipe({
      batch_id: batch.id,
      method,
      ratio: ratioText,
      grind: `J-Max: ${jmaxRot}.${jmaxNum}.${jmaxClick}`,
      temperature: `${waterTemp}°C`,
      brew_time: brewTime,
      notes: notes.trim(),
      sensory_balance: sensoryBalance,
      sensory_body: sensoryBody,
      sensory_extraction: sensoryExtraction,
      dose_in_g: parseFloat(doseInG),
      dose_out_g: method === 'Espresso' ? parseFloat(doseOutG) : null,
      espresso_pressure: method === 'Espresso' ? parseFloat(espressoPressure) : null,
      espresso_preinfusion: method === 'Espresso' ? parseInt(espressoPreinfusion) : null
    });

    // Update remaining weight locally
    setBatch(prev => ({
      ...prev,
      remaining_weight_g: Math.max(0.0, prev.remaining_weight_g - parseFloat(doseInG))
    }));

    setNotes('');
  };



  // R3: Skeleton loading state
  if (!batch) return (
    <div style={{ padding: '14px 14px 90px 14px' }}>
      {[1, 2, 3].map(i => (
        <div key={i} className="candy-card skeleton-card" style={{ cursor: 'default', height: i === 1 ? '80px' : '120px' }}>
          <div className="skeleton-line" style={{ width: '60%', height: '14px' }} />
          <div className="skeleton-line" style={{ width: '90%', height: '10px', marginTop: '10px' }} />
          <div className="skeleton-line" style={{ width: '40%', height: '10px', marginTop: '6px' }} />
        </div>
      ))}
    </div>
  );

  const doseNum = parseFloat(batch.dose_weight) || 20.0;
  const isLowStock = batch.remaining_doses <= 2;
  const lastRecipe = batch.recipes && batch.recipes.length > 0 ? batch.recipes[0] : null;

  // Improvement 2: Semáforo de Desgasificación Logic & Badge Color
  let restingDays = 0;
  let restingDaysText = 'Sin datos';
  let freezeTime = 'Sin datos';
  let degasStatus = { label: 'Degas Desconocido', color: '#718096', description: 'Sin información de fechas.' };
  
  if (batch.roast_date && batch.freeze_date) {
    const roast = new Date(batch.roast_date);
    const freeze = new Date(batch.freeze_date);
    const diffTime = Math.abs(freeze - roast);
    restingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    restingDaysText = `${restingDays} días de reposo`;

    if (restingDays <= 5) {
      degasStatus = {
        label: 'Degas Insuficiente',
        color: '#E53E3E',
        description: 'Poco reposo. El CO₂ atrapado puede producir sabores metálicos o agrios.'
      };
    } else if (restingDays >= 6 && restingDays <= 20) {
      degasStatus = {
        label: 'Degas Perfecto',
        color: '#38A169',
        description: 'Reposo ideal. Máxima expresión aromática y estabilidad en congelación.'
      };
    } else {
      degasStatus = {
        label: 'Degas Alto',
        color: '#D69E2E',
        description: 'Reposo prolongado. Los aromáticos volátiles pueden estar suavizados.'
      };
    }
  }
  
  if (batch.freeze_date) {
    const freeze = new Date(batch.freeze_date);
    const today = new Date();
    const diffTime = Math.abs(today - freeze);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      freezeTime = `Congelado hace ${diffDays} días`;
    } else {
      freezeTime = `Congelado hace ${Math.floor(diffDays / 7)} semanas`;
    }
  }



  // J-Max calculated microns for current form state
  const currentMicrons = calculateMicrons(jmaxRot, jmaxNum, jmaxClick);

  return (
    <div style={{ padding: '14px 14px 90px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <button className="btn-candy" onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ArrowLeft size={16} strokeWidth={3} />
          Volver
        </button>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="btn-candy" onClick={() => {
            if ('NDEFReader' in window) {
              showToast('Acerca la etiqueta NFC al teléfono...', { type: 'info', duration: 5000 });
            }
            handleWriteNfc();
          }} style={{ padding: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Nfc size={16} strokeWidth={2.5} />
            <span style={{ fontSize: '11px', fontWeight: 'bold' }}>Vincular</span>
          </button>
          {isLowStock && <span className="mono-lbl-tag" style={{ background: '#E53E3E' }}>¡ÚLTIMOS TUBOS!</span>}
        </div>
      </div>

      {/* Título y Ficha Técnica compacta sin bordes negros */}
      <h2 style={{ fontFamily: 'var(--font-heading)', margin: '0 0 4px 0', textTransform: 'uppercase', wordBreak: 'break-word' }}>{batch.name}</h2>
      <div className="grain-details-compact" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div><strong>Productor:</strong> {batch.producer}</div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <span><strong>Variedad:</strong> {batch.variety || 'N/A'}</span>
          <span><strong>Proceso:</strong> {batch.process || 'N/A'}</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <span><strong>Altitud:</strong> {batch.altitude || 'N/A'}</span>
          <span><strong>Tubo:</strong> {batch.dose_weight || '20.0g'}</span>
        </div>
      </div>

      {/* Notas de Cata y Perfil Sensorial */}
      {(() => {
        let scaTags = [];
        let customNotes = '';
        if (batch.roaster_notes) {
          const notesStr = String(batch.roaster_notes);
          if (notesStr.includes('[Notas: ') && notesStr.includes(']')) {
            const match = notesStr.match(/\[Notas: (.*?)\]/);
            if (match) scaTags = match[1].split(',').map(s => s.trim());
            // Get everything after the tags (separated by ' | ')
            if (notesStr.includes(' | ')) {
              customNotes = notesStr.split(' | ')[1].trim();
            }
          } else {
            customNotes = notesStr.trim();
          }
        }
        
        if (scaTags.length === 0 && !customNotes) return null;
        
        return (
          <div style={{ marginTop: '14px', marginBottom: '14px', padding: '12px', backgroundColor: 'var(--bg-card)', border: '2px solid #000000', borderRadius: '8px', boxShadow: '3px 3px 0px #000000' }}>
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '10px', textTransform: 'uppercase', margin: '0 0 10px 0', color: 'var(--color-crimson)', letterSpacing: '0.5px' }}>
              Notas de Cata
            </h4>
            
            {scaTags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: customNotes ? '10px' : '0' }}>
                {scaTags.map((tag, i) => {
                  const cleanLabel = stripEmojis(tag);
                  return (
                    <span key={i} style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 8px',
                      backgroundColor: '#FFFFFF',
                      border: '2px solid #000000',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 'bold',
                      color: 'var(--color-text)',
                      boxShadow: '1px 1px 0px #000000'
                    }}>
                      {getScaIcon(tag, 13, 2.5)}
                      {cleanLabel}
                    </span>
                  );
                })}
              </div>
            )}

            {customNotes && (
              <div style={{ fontSize: '13px', fontStyle: 'italic', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                "{customNotes}"
              </div>
            )}
          </div>
        );
      })()}


      {/* Estado del Congelador y Botón Restar Integrado */}
      <div className="candy-card static">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontStyle: 'italic', fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '2px' }}>Estado en Congelador:</div>
            <span style={{ fontSize: '15px', fontWeight: '900' }}>{batch.remaining_doses} / {batch.total_doses} Tubos ({batch.remaining_weight_g || 0}g rest.)</span>
          </div>
          {batch.remaining_doses > 0 && (
            <button className="btn-candy primary" onClick={handleDoseDeduction} style={{ margin: 0, padding: '8px 12px', fontSize: '11px' }}>
              - Restar 1 Tubo
            </button>
          )}
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #E2E8F0', fontSize: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '15px' }}>🔥</span>
            <span style={{ color: 'var(--color-text-muted)', width: '65px' }}>Tueste:</span>
            <strong>{formatLocalDateStr(batch.roast_date)}</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '15px' }}>❄️</span>
            <span style={{ color: 'var(--color-text-muted)', width: '65px' }}>Congelado:</span>
            <strong>{formatLocalDateStr(batch.freeze_date)}</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '15px' }}>⏳</span>
            <span style={{ color: 'var(--color-text-muted)', width: '65px' }}>Reposado:</span>
            <strong>{restingDaysText}</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '15px' }}>🧊</span>
            <span style={{ color: 'var(--color-text-muted)', width: '65px' }}>Estadía:</span>
            <strong>{freezeTime}</strong>
          </div>
        </div>
      </div>

      {/* Semáforo de Desgasificación Box */}
      {batch.roast_date && batch.freeze_date && (
        <div className="candy-card static" style={{ borderLeft: `6px solid ${degasStatus.color}`, backgroundColor: '#FFFFFF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '11px', fontWeight: '900', color: degasStatus.color, textTransform: 'uppercase' }}>
              {degasStatus.label} ({restingDays} Días)
            </span>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
            {degasStatus.description}
          </p>
        </div>
      )}



      {/* Referencia de Última Configuración Exitosa */}
      {lastRecipe && (
        <div className="recipe-target-banner">
          <div style={{ fontSize: '9px', fontWeight: '900', color: '#E53E3E', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>
            Última Configuración Exitosa (Referencia)
          </div>
          <div style={{ fontSize: '13px', fontWeight: '900' }}>
            {lastRecipe.method} | {lastRecipe.grind} | {lastRecipe.ratio}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            Molido para <strong>{batch.dose_weight}</strong> (~{parseGrindToMicrons(lastRecipe.grind)} µm). Agua: <strong>{(doseNum * ratioVal).toFixed(0)}g</strong>.
          </div>
          {batch.remaining_doses > 0 && (
            <button className="btn-candy primary" onClick={handleRepeatLastRecipe} style={{ width: '100%', marginTop: '10px', padding: '8px', fontSize: '10px' }}>
              Repetir Receta Anterior y Restar Tubo (1-Click)
            </button>
          )}
        </div>
      )}

      {/* Calculadora Interactiva de Ratio */}
      <div className="candy-card static" style={{ marginTop: '24px', backgroundColor: calcVisible ? 'var(--bg-canvas)' : 'var(--bg-card)' }}>
        <div 
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => setCalcVisible(!calcVisible)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calculator size={18} color="var(--color-crimson)" />
            <span style={{ fontWeight: '700', fontSize: '15px' }}>Calculadora de Ratio</span>
          </div>
          <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{calcVisible ? 'Ocultar' : 'Abrir'}</span>
        </div>
        
        {calcVisible && (
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }} className="animate-entrance">
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ flex: 1, margin: 0 }}>
                <label style={{ fontSize: '11px' }}>Café (g)</label>
                <input 
                  type="number" step="0.1" className="candy-input" 
                  value={calcDose} 
                  onChange={(e) => {
                    const dose = parseFloat(e.target.value) || 0;
                    setCalcDose(dose);
                    setCalcWater(Math.round(dose * calcRatio));
                  }} 
                />
              </div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', paddingBottom: '10px' }}>×</div>
              <div className="form-group" style={{ flex: 1, margin: 0 }}>
                <label style={{ fontSize: '11px' }}>Ratio 1:</label>
                <input 
                  type="number" step="0.1" className="candy-input" 
                  value={calcRatio} 
                  onChange={(e) => {
                    const ratio = parseFloat(e.target.value) || 0;
                    setCalcRatio(ratio);
                    setCalcWater(Math.round(calcDose * ratio));
                  }} 
                />
              </div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', paddingBottom: '10px' }}>=</div>
              <div className="form-group" style={{ flex: 1, margin: 0 }}>
                <label style={{ fontSize: '11px' }}>Agua (g)</label>
                <input 
                  type="number" className="candy-input" 
                  value={calcWater} 
                  onChange={(e) => {
                    const water = parseFloat(e.target.value) || 0;
                    setCalcWater(water);
                    if (calcDose > 0) setCalcRatio(parseFloat((water / calcDose).toFixed(1)));
                  }} 
                />
              </div>
            </div>
            <button 
              type="button" 
              className="btn-candy accent" 
              style={{ padding: '6px', fontSize: '11px', minHeight: '32px', width: '100%' }}
              onClick={() => {
                setDoseInG(calcDose);
                setRatioVal(calcRatio);
                if (method === 'Espresso') setDoseOutG(calcWater);
                setCalcVisible(false);
                if (showToast) showToast('Valores transferidos al formulario.', { type: 'success', duration: 2000 });
              }}
            >
              Transferir datos al formulario
            </button>
          </div>
        )}
      </div>

      {/* Formulario de Bitácora */}
      <form onSubmit={handleRecipeSubmit}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', textTransform: 'uppercase', fontSize: '15px', margin: 0 }}>Registrar Preparación</h2>
        </div>

        {/* Method Icon Selector */}
        <div style={{ display: 'flex', gap: '12px', margin: '16px 0', overflowX: 'auto', paddingBottom: '4px' }}>
          {[
            { id: 'V60 (Filtrado)', icon: '/icons/v60.jpg', label: 'V60' },
            { id: 'Espresso', icon: '/icons/espresso.jpg', label: 'Espresso' },
            { id: 'AeroPress', icon: '/icons/aeropress.jpg', label: 'AeroPress' },
            { id: 'Prensa Francesa', icon: '/icons/frenchpress.jpg', label: 'Prensa' }
          ].map(m => (
            <div 
              key={m.id}
              onClick={() => {
                setMethod(m.id);
                if (navigator.vibrate) navigator.vibrate(40);
              }}
              style={{ 
                flex: '1', 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                transform: method === m.id ? 'scale(1.05)' : 'scale(1)',
                transition: 'all 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
              }}
            >
              <div 
                className="candy-card"
                style={{ 
                  width: '100%', 
                  aspectRatio: '1/1', 
                  padding: 0, 
                  margin: 0,
                  overflow: 'hidden',
                  borderColor: method === m.id ? 'var(--color-crimson)' : 'var(--border-color)',
                  borderWidth: method === m.id ? '3px' : '2px',
                  backgroundColor: method === m.id ? 'var(--color-crimson)' : 'var(--bg-card)'
                }}
              >
                <img src={m.icon} alt={m.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <span style={{ 
                fontSize: '10px', 
                fontWeight: method === m.id ? '900' : '600',
                color: method === m.id ? 'var(--color-text)' : 'var(--color-text-muted)'
              }}>
                {m.label}
              </span>
            </div>
          ))}
        </div>

        <div className="bento-grid">
          {/* GRAMS */}
          <div className="bento-widget accent">
            <div className="bento-header">
              <span>Grams</span>
              <Scale size={16} />
            </div>
            <div className="bento-value-container">
              <input 
                type="number" step="0.1" 
                value={doseInG} 
                onChange={(e) => setDoseInG(parseFloat(e.target.value) || 0)} 
              />
              <span className="unit">g</span>
            </div>
            <div className="bento-controls">
              <button type="button" className="bento-btn" onClick={() => setDoseInG(d => Math.max(0, d - 0.5))}>-</button>
              <div className="bento-info">DOSE</div>
              <button type="button" className="bento-btn" onClick={() => setDoseInG(d => d + 0.5)}>+</button>
            </div>
          </div>

          {/* RATIO / YIELD */}
          <div className="bento-widget">
            <div className="bento-header">
              <span>{method !== 'Espresso' ? 'Ratio' : 'Yield'}</span>
              <Droplet size={16} color="var(--color-crimson)" />
            </div>
            <div className="bento-value-container">
              {method !== 'Espresso' ? (
                <>
                  <span style={{ fontSize: '28px', fontWeight: '900', fontFamily: 'var(--font-mono)' }}>1:</span>
                  <input 
                    type="number" step="0.1" 
                    style={{ textAlign: 'left', color: 'var(--color-crimson)' }}
                    value={ratioVal} 
                    onChange={(e) => setRatioVal(parseFloat(e.target.value) || 0)} 
                  />
                </>
              ) : (
                <>
                  <input 
                    type="number" step="0.5" 
                    style={{ color: 'var(--color-crimson)' }}
                    value={doseOutG} 
                    onChange={(e) => setDoseOutG(parseFloat(e.target.value) || 0)} 
                  />
                  <span className="unit" style={{ color: 'var(--color-crimson)' }}>g</span>
                </>
              )}
            </div>
            <div className="bento-controls">
              <button type="button" className="bento-btn" onClick={() => method !== 'Espresso' ? setRatioVal(r => Math.max(1, r - 0.5)) : setDoseOutG(d => Math.max(0, d - 1))}>-</button>
              <div className="bento-info">TARGET</div>
              <button type="button" className="bento-btn" onClick={() => method !== 'Espresso' ? setRatioVal(r => r + 0.5) : setDoseOutG(d => d + 1)}>+</button>
            </div>
            <div className="bento-info" style={{ marginTop: '2px', color: 'var(--color-text-muted)' }}>
              {method !== 'Espresso' ? `OUT: ${(doseInG * (ratioVal || 0)).toFixed(0)} g` : `1:${(doseOutG / (doseInG || 1)).toFixed(1)}`}
            </div>
          </div>

          {/* TEMP */}
          <div className="bento-widget">
            <div className="bento-header">
              <span>Temp</span>
              <Thermometer size={16} />
            </div>
            <div className="bento-value-container">
              <input 
                type="number" 
                style={{ color: 'var(--color-crimson)' }}
                value={waterTemp} 
                onChange={(e) => setWaterTemp(parseInt(e.target.value) || 93)} 
              />
              <span className="unit" style={{ color: 'var(--color-crimson)' }}>°C</span>
            </div>
            <div className="bento-controls">
              <button type="button" className="bento-btn" onClick={() => setWaterTemp(t => Math.max(80, t - 1))}>-</button>
              <div className="bento-info">WATER</div>
              <button type="button" className="bento-btn" onClick={() => setWaterTemp(t => Math.min(100, t + 1))}>+</button>
            </div>
          </div>

          {/* PRESSURE (ESPRESSO) or TIMER (FILTER) */}
          {method === 'Espresso' ? (
            <div className="bento-widget accent">
              <div className="bento-header">
                <span>Pressure</span>
                <Gauge size={16} />
              </div>
              <div className="bento-value-container">
                <input 
                  type="number" step="0.5" 
                  value={espressoPressure} 
                  onChange={(e) => setEspressoPressure(parseFloat(e.target.value) || 9)} 
                />
                <span className="unit">bar</span>
              </div>
              <div className="bento-controls">
                <button type="button" className="bento-btn" onClick={() => setEspressoPressure(p => Math.max(0, p - 0.5))}>-</button>
                <div className="bento-info">EXTRACT</div>
                <button type="button" className="bento-btn" onClick={() => setEspressoPressure(p => p + 0.5)}>+</button>
              </div>
            </div>
          ) : (
            <div className="bento-widget">
              <div className="bento-header">
                <span>Timer</span>
                <Timer size={16} />
              </div>
              <div className="bento-value-container" style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  style={{ fontSize: '24px' }}
                  value={brewTime} 
                  onChange={(e) => setBrewTime(e.target.value)} 
                />
              </div>
              <div className="bento-controls" style={{ justifyContent: 'center' }}>
                <div className="bento-info">DURATION</div>
              </div>
            </div>
          )}

          {/* GRIND SETTINGS (Full Row) */}
          <div className="bento-widget bento-full-row accent">
            <div className="bento-header">
              <span>Molienda (J-Max)</span>
              <Coffee size={16} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 0' }}>
              <select className="candy-input" style={{ flex: 1, textAlign: 'center', fontSize: '14px', margin: 0, padding: '8px' }} value={jmaxRot} onChange={(e) => setJmaxRot(parseInt(e.target.value) || 0)}>
                {[0, 1, 2, 3, 4].map(v => <option key={v} value={v}>Rot: {v}</option>)}
              </select>
              <select className="candy-input" style={{ flex: 1, textAlign: 'center', fontSize: '14px', margin: 0, padding: '8px' }} value={jmaxNum} onChange={(e) => setJmaxNum(parseInt(e.target.value) || 0)}>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(v => <option key={v} value={v}>Num: {v}</option>)}
              </select>
              <select className="candy-input" style={{ flex: 1, textAlign: 'center', fontSize: '14px', margin: 0, padding: '8px' }} value={jmaxClick} onChange={(e) => setJmaxClick(parseInt(e.target.value) || 0)}>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(v => <option key={v} value={v}>Clic: {v}</option>)}
              </select>
            </div>
            <div className="bento-info">Partícula: ~{currentMicrons} µm</div>
          </div>
          
          {/* EXTRA ESPRESSO PARAMS or FILTER RATING */}
          {method === 'Espresso' && (
            <>
              <div className="bento-widget">
                <div className="bento-header">
                  <span>Pre-Inf</span>
                  <Timer size={16} />
                </div>
                <div className="bento-value-container">
                  <input 
                    type="number" 
                    value={espressoPreinfusion} 
                    onChange={(e) => setEspressoPreinfusion(parseInt(e.target.value) || 0)} 
                  />
                  <span className="unit">sec</span>
                </div>
                <div className="bento-controls">
                  <button type="button" className="bento-btn" onClick={() => setEspressoPreinfusion(p => Math.max(0, p - 1))}>-</button>
                  <div className="bento-info">BLOOM</div>
                  <button type="button" className="bento-btn" onClick={() => setEspressoPreinfusion(p => p + 1)}>+</button>
                </div>
              </div>
              <div className="bento-widget">
                <div className="bento-header">
                  <span>Timer</span>
                  <Timer size={16} />
                </div>
                <div className="bento-value-container">
                  <input 
                    type="text" 
                    style={{ fontSize: '24px' }}
                    value={brewTime} 
                    onChange={(e) => setBrewTime(e.target.value)} 
                  />
                </div>
                <div className="bento-controls" style={{ justifyContent: 'center' }}>
                  <div className="bento-info">DURATION</div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="candy-card static" style={{ marginTop: '0' }}>

          {/* Sensory Sliders and Flavor tags */}
          <div style={{ borderTop: '1.5px solid var(--border-color)', marginTop: '12px', paddingTop: '12px' }}>
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '11px', textTransform: 'uppercase', margin: '0 0 10px 0' }}>
              Evaluación Sensorial (Taza Perfecta)
            </h4>
            
            {/* Balance Selector */}
            <div className="form-group">
              <label style={{ fontSize: '9px' }}>Balance Sensorial (Predominante)</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['Ácido', 'Dulce', 'Amargo'].map(b => (
                  <button
                    key={b}
                    type="button"
                    className="btn-candy"
                    onClick={() => setSensoryBalance(b)}
                    style={{
                      flex: 1,
                      minHeight: '34px',
                      fontSize: '11px',
                      padding: '4px',
                      margin: 0,
                      backgroundColor: sensoryBalance === b ? 'var(--color-text)' : 'var(--bg-card)',
                      color: sensoryBalance === b ? '#FFF' : 'var(--color-text)',
                      boxShadow: sensoryBalance === b ? 'none' : '2px 2px 0px var(--border-color)',
                      transform: sensoryBalance === b ? 'translate(1px, 1px)' : 'none'
                    }}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Cuerpo Selector */}
            <div className="form-group">
              <label style={{ fontSize: '9px' }}>Cuerpo / Textura</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['Ligero', 'Medio', 'Sedoso'].map(b => (
                  <button
                    key={b}
                    type="button"
                    className="btn-candy"
                    onClick={() => setSensoryBody(b)}
                    style={{
                      flex: 1,
                      minHeight: '34px',
                      fontSize: '11px',
                      padding: '4px',
                      margin: 0,
                      backgroundColor: sensoryBody === b ? 'var(--color-text)' : 'var(--bg-card)',
                      color: sensoryBody === b ? '#FFF' : 'var(--color-text)',
                      boxShadow: sensoryBody === b ? 'none' : '2px 2px 0px var(--border-color)',
                      transform: sensoryBody === b ? 'translate(1px, 1px)' : 'none'
                    }}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Extracción Selector */}
            <div className="form-group">
              <label style={{ fontSize: '9px' }}>Nivel de Extracción</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {['Sub', 'En Punto', 'Sobre'].map(b => (
                  <button
                    key={b}
                    type="button"
                    className="btn-candy"
                    onClick={() => setSensoryExtraction(b)}
                    style={{
                      flex: 1,
                      minHeight: '34px',
                      fontSize: '11px',
                      padding: '4px',
                      margin: 0,
                      backgroundColor: sensoryExtraction === b ? 'var(--color-text)' : 'var(--bg-card)',
                      color: sensoryExtraction === b ? '#FFF' : 'var(--color-text)',
                      boxShadow: sensoryExtraction === b ? 'none' : '2px 2px 0px var(--border-color)',
                      transform: sensoryExtraction === b ? 'translate(1px, 1px)' : 'none'
                    }}
                  >
                    {b === 'Sub' ? 'Sub (Agrio)' : b === 'Sobre' ? 'Sobre (Amargo)' : 'En Punto'}
                  </button>
                ))}
              </div>
            </div>



            {/* Additional Notes input */}
            <div className="form-group" style={{ marginTop: '12px' }}>
              <label style={{ fontSize: '9px' }}>Notas / Comentarios de Extracción</label>
              <input 
                className="candy-input" 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                type="text" 
                placeholder="Ej. Muy balanceado, dulzor intenso, retrogusto largo" 
              />
            </div>

          </div> {/* end of borderTop div */}
        </div> {/* end of candy-card static */}

        <button type="submit" className="btn-candy primary" style={{ width: '100%', marginTop: '16px', fontSize: '15px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Save size={20} strokeWidth={2.5} />
          Guardar Bitácora
        </button>
      </form>

      {/* Actions footer: Edit & Delete Lote */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
        <button 
          type="button"
          className="btn-candy" 
          onClick={() => onEditBatch(batch)}
          style={{ flex: 1, fontSize: '11px', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          <Edit2 size={14} strokeWidth={2.5} />
          Editar Lote
        </button>
        <button 
          type="button"
          className="btn-candy" 
          onClick={() => onDeleteBatch(batch.id, batch.name)}
          style={{ 
            flex: 1, margin: 0,
            color: 'var(--color-crimson)', borderColor: 'var(--color-crimson)',
            fontSize: '11px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
          }}
        >
          <Trash2 size={14} strokeWidth={2.5} />
          Eliminar Lote
        </button>
      </div>
    </div>
  );
}
