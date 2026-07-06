import React, { useState, useEffect, useRef } from 'react';
import { formatLocalDateStr } from '../utils/date';



export default function BatchDetail({ batchId, onBack, onSubtractDose, onSaveRecipe, onDeleteBatch, onEditBatch, showToast }) {
  const [batch, setBatch] = useState(null);
  
  // Form fields
  const [method, setMethod] = useState('V60 (Filtrado)');
  const [rating, setRating] = useState(5);
  
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
        rating: last.rating,
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
      rating,
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

  // R9: Interactive star rating component
  const StarRating = ({ value, onChange }) => (
    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', height: '38px', cursor: 'pointer', backgroundColor: 'var(--bg-card)', border: '2px solid var(--border-color)', borderRadius: '6px' }}>
      {[1, 2, 3, 4, 5].map(star => (
        <span
          key={star}
          onClick={() => onChange(star)}
          style={{
            fontSize: '22px',
            color: star <= value ? 'var(--color-crimson)' : '#D1D5DB',
            transition: 'color 150ms, transform 150ms',
            userSelect: 'none',
          }}
        >
          ★
        </span>
      ))}
    </div>
  );

  return (
    <div style={{ padding: '14px 14px 90px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <button className="btn-candy" onClick={onBack}>← Volver</button>
        {isLowStock && <span className="mono-lbl-tag" style={{ background: '#E53E3E' }}>¡ÚLTIMOS TUBOS!</span>}
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



      {/* Formulario de Bitácora */}
      <h2 style={{ fontFamily: 'var(--font-heading)', marginTop: '24px', textTransform: 'uppercase', fontSize: '15px' }}>Registrar Preparación</h2>
      <div className="candy-card static">
        <form onSubmit={handleRecipeSubmit}>
          <div className="form-group">
            <label>Método de Extracción</label>
            <select className="candy-input" value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="V60 (Filtrado)">V60 (Filtrado)</option>
              <option value="Espresso">Espresso</option>
              <option value="AeroPress">AeroPress</option>
              <option value="Prensa Francesa">Prensa Francesa</option>
            </select>
          </div>
          
          {/* Fila 1: Dosis In y Temperatura (para todos los métodos) */}
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>Dosis Seco In (g)</label>
              <input 
                type="number" 
                step="0.1" 
                className="candy-input" 
                value={doseInG} 
                onChange={(e) => setDoseInG(parseFloat(e.target.value) || 0)} 
                required 
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Temperatura Agua (°C)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '40px' }}>
                <button type="button" className="btn-candy" style={{ margin: 0, padding: '8px 12px', height: '100%', boxSizing: 'border-box' }} onClick={() => setWaterTemp(t => Math.max(80, t - 1))}>-</button>
                <input 
                  type="number" 
                  className="candy-input" 
                  style={{ textAlign: 'center', flex: 1, height: '100%', boxSizing: 'border-box', margin: 0 }} 
                  value={waterTemp} 
                  onChange={(e) => setWaterTemp(parseInt(e.target.value) || 93)} 
                  min="80" 
                  max="100" 
                />
                <button type="button" className="btn-candy" style={{ margin: 0, padding: '8px 12px', height: '100%', boxSizing: 'border-box' }} onClick={() => setWaterTemp(t => Math.min(100, t + 1))}>+</button>
              </div>
            </div>
          </div>

          {/* Fila 2: Ratio (Filtro) o Dosis Out (Espresso) + Molienda */}
          <div className="form-row">
            {method !== 'Espresso' ? (
              <div className="form-group" style={{ flex: '0 0 35%', maxWidth: '35%' }}>
                <label>Ratio (1:X)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '40px' }}>
                  <span style={{ fontFamily: 'var(--font-heading)', fontWeight: '900', fontSize: '14px', flexShrink: 0, lineHeight: 1 }}>1 :</span>
                  <input 
                    type="number"
                    step="0.1"
                    min="1"
                    className="candy-input"
                    style={{ 
                      fontFamily: 'var(--font-mono)', 
                      fontWeight: '900', 
                      fontSize: '13px', 
                      textAlign: 'center',
                      padding: '8px 2px',
                      margin: 0,
                      flex: 1,
                      height: '100%',
                      boxSizing: 'border-box'
                    }}
                    value={ratioVal}
                    onChange={(e) => {
                      const val = e.target.value;
                      setRatioVal(val === '' ? '' : parseFloat(val));
                    }}
                  />
                </div>
                <div style={{ fontSize: '10px', fontWeight: 'bold', marginTop: '6px', textAlign: 'center' }}>
                  H2O: <span style={{ color: '#E53E3E' }}>{(doseInG * (parseFloat(ratioVal) || 0)).toFixed(0)}g</span>
                </div>
              </div>
            ) : (
              <div className="form-group" style={{ flex: '0 0 35%', maxWidth: '35%' }}>
                <label>Yield Out (g)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  className="candy-input" 
                  style={{ height: '40px', boxSizing: 'border-box', margin: 0, padding: '8px 4px', textAlign: 'center', fontSize: '13px' }}
                  value={doseOutG} 
                  onChange={(e) => setDoseOutG(parseFloat(e.target.value) || 0)} 
                  required 
                />
                <div style={{ fontSize: '10px', fontWeight: 'bold', marginTop: '6px', textAlign: 'center' }}>
                  Ratio: <span style={{ color: '#E53E3E' }}>1:{(doseOutG / (doseInG || 1)).toFixed(1)}</span>
                </div>
              </div>
            )}
            
            {/* Molienda (J-Max) */}
            <div className="form-group" style={{ flex: '0 0 62%', maxWidth: '62%' }}>
              <label>Molienda (J-Max: R.N.C)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <select className="candy-input" style={{ flex: 1, padding: '8px 4px', textAlign: 'center', fontSize: '12px', backgroundImage: 'none' }} value={jmaxRot} onChange={(e) => setJmaxRot(parseInt(e.target.value) || 0)}>
                  {[0, 1, 2, 3, 4].map(v => <option key={v} value={v}>R: {v}</option>)}
                </select>
                <span style={{ fontWeight: 'bold', color: 'var(--border-color)' }}>.</span>
                <select className="candy-input" style={{ flex: 1, padding: '8px 4px', textAlign: 'center', fontSize: '12px', backgroundImage: 'none' }} value={jmaxNum} onChange={(e) => setJmaxNum(parseInt(e.target.value) || 0)}>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(v => <option key={v} value={v}>N: {v}</option>)}
                </select>
                <span style={{ fontWeight: 'bold', color: 'var(--border-color)' }}>.</span>
                <select className="candy-input" style={{ flex: 1, padding: '8px 4px', textAlign: 'center', fontSize: '12px', backgroundImage: 'none' }} value={jmaxClick} onChange={(e) => setJmaxClick(parseInt(e.target.value) || 0)}>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(v => <option key={v} value={v}>C: {v}</option>)}
                </select>
              </div>
              <div style={{ fontSize: '10px', textAlign: 'center', fontWeight: 'bold', color: 'var(--color-crimson)', marginTop: '8px' }}>
                Partícula: ~{currentMicrons} µm
              </div>
            </div>
          </div>

          {/* Fila 3: Presión y Preinfusión (Solo para Espresso) */}
          {method === 'Espresso' && (
            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label>Presión Extracción (bar)</label>
                <input 
                  type="number" 
                  step="0.5" 
                  className="candy-input" 
                  value={espressoPressure} 
                  onChange={(e) => setEspressoPressure(parseFloat(e.target.value) || 9)} 
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Preinfusión (seg)</label>
                <input 
                  type="number" 
                  className="candy-input" 
                  value={espressoPreinfusion} 
                  onChange={(e) => setEspressoPreinfusion(parseInt(e.target.value) || 0)} 
                />
              </div>
            </div>
          )}

          <div className="form-row" style={{ alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Tiempo de Extracción</label>
              <input className="candy-input" value={brewTime} onChange={(e) => setBrewTime(e.target.value)} type="text" />
            </div>
            
            {/* Interactive Star Rating */}
            <div className="form-group" style={{ flex: 1 }}>
              <label>Puntuación</label>
              <StarRating value={rating} onChange={setRating} />
            </div>
          </div>

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

          </div>

          <button type="submit" className="btn-candy primary" style={{ width: '100%', marginTop: '8px' }}>Guardar Bitácora</button>
        </form>
      </div>

      {/* Actions footer: Edit & Delete Lote */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
        <button 
          type="button"
          className="btn-candy" 
          onClick={() => onEditBatch(batch)}
          style={{ flex: 1, fontSize: '11px', margin: 0 }}
        >
          📝 Editar Lote
        </button>
        <button 
          type="button"
          className="btn-candy" 
          onClick={() => onDeleteBatch(batch.id, batch.name)}
          style={{ 
            flex: 1, margin: 0,
            color: 'var(--color-crimson)', borderColor: 'var(--color-crimson)',
            fontSize: '11px'
          }}
        >
          🗑️ Eliminar Lote
        </button>
      </div>
    </div>
  );
}
