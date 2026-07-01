import React, { useState, useEffect, useRef } from 'react';

export default function BatchDetail({ batchId, onBack, onSubtractDose, onSaveRecipe, onDeleteBatch, showToast }) {
  const [batch, setBatch] = useState(null);
  
  // Form fields
  const [method, setMethod] = useState('V60 (Filtrado)');
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState(5);
  
  // J-Max Steppers (Default: 1.5.0)
  const [jmaxRot, setJmaxRot] = useState(1);
  const [jmaxNum, setJmaxNum] = useState(5);
  const [jmaxClick, setJmaxClick] = useState(0);
  
  // Smart Ratio (Default: 15.0)
  const [ratioVal, setRatioVal] = useState(15.0);

  // Brew Timer states
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef(null);

  // Form input state for brew time
  const [brewTime, setBrewTime] = useState('2:30 min');

  // Sensory Evaluation States (Improvement 5)
  const [sensoryBalance, setSensoryBalance] = useState('Dulce');
  const [sensoryBody, setSensoryBody] = useState('Medio');
  const [sensoryExtraction, setSensoryExtraction] = useState('En Punto');
  const [selectedFlavorTags, setSelectedFlavorTags] = useState([]);

  // Popular Coffee Flavor Tags (SCA Flavor Wheel)
  const flavorWheelTags = [
    { label: '🍒 Cereza', val: 'cereza' },
    { label: '🍋 Cítrico', val: 'cítrico' },
    { label: '🌸 Jazmín', val: 'jazmín' },
    { label: '🍯 Miel', val: 'miel' },
    { label: '🍫 Chocolate', val: 'chocolate' },
    { label: '🍮 Caramelo', val: 'caramelo' },
    { label: '🌰 Avellana', val: 'avellana' },
    { label: '🪵 Canela', val: 'canela' }
  ];

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
          }
        }
      });
    return () => { active = false; };
  }, [batchId]);

  // Brew Timer Effect
  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerActive]);

  const handleStartPauseTimer = () => {
    setTimerActive(active => !active);
  };

  const handleResetTimer = () => {
    setTimerActive(false);
    setTimerSeconds(0);
  };

  // R1: Timer stop uses toast instead of alert
  const handleStopTimer = () => {
    setTimerActive(false);
    const mins = Math.floor(timerSeconds / 60);
    const secs = timerSeconds % 60;
    const formattedTime = `${mins}:${secs < 10 ? '0' : ''}${secs} min`;
    setBrewTime(formattedTime);
    showToast(`Tiempo registrado: ${formattedTime}`, { type: 'success', duration: 2500 });
  };

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
        sensory_extraction: last.sensory_extraction || 'En Punto'
      });
    });
  };

  const handleRecipeSubmit = (e) => {
    e.preventDefault();
    const doseNum = parseFloat(batch.dose_weight) || 20.0;
    const targetWater = (doseNum * ratioVal).toFixed(0);

    // Combine notes text with flavor tags
    const combinedNotes = [
      selectedFlavorTags.length > 0 ? `[Notas: ${selectedFlavorTags.join(', ')}]` : '',
      notes
    ].filter(Boolean).join(' ').trim();

    onSaveRecipe({
      batch_id: batch.id,
      method,
      ratio: `1:${ratioVal.toFixed(1)} (${targetWater}g)`,
      grind: `J-Max: ${jmaxRot}.${jmaxNum}.${jmaxClick}`,
      temperature: '93°C',
      brew_time: brewTime,
      rating,
      notes: combinedNotes,
      sensory_balance: sensoryBalance,
      sensory_body: sensoryBody,
      sensory_extraction: sensoryExtraction
    });
    setNotes('');
    setSelectedFlavorTags([]);
  };

  const toggleFlavorTag = (tagLabel) => {
    if (selectedFlavorTags.includes(tagLabel)) {
      setSelectedFlavorTags(selectedFlavorTags.filter(t => t !== tagLabel));
    } else {
      setSelectedFlavorTags([...selectedFlavorTags, tagLabel]);
    }
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

  // Format Timer Display (MM:SS)
  const timerMins = Math.floor(timerSeconds / 60);
  const timerSecs = timerSeconds % 60;
  const timerFormatted = `${timerMins < 10 ? '0' : ''}${timerMins}:${timerSecs < 10 ? '0' : ''}${timerSecs}`;

  // J-Max calculated microns for current form state
  const currentMicrons = calculateMicrons(jmaxRot, jmaxNum, jmaxClick);

  // R9: Interactive star rating component
  const StarRating = ({ value, onChange }) => (
    <div style={{ display: 'flex', gap: '4px', cursor: 'pointer' }}>
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
      <h2 style={{ fontFamily: 'var(--font-heading)', margin: '0 0 4px 0', textTransform: 'uppercase' }}>{batch.name}</h2>
      <div className="grain-details-compact">
        <strong>Productor:</strong> {batch.producer} <br />
        <strong>Variedad:</strong> {batch.variety || 'N/A'} • <strong>Proceso:</strong> {batch.process || 'N/A'} <br />
        <strong>Altitud:</strong> {batch.altitude || 'N/A'} • <strong>Peso Tubo:</strong> {batch.dose_weight || '20.0g'}
      </div>

      {/* Estado del Congelador y Botón Restar Integrado */}
      <div className="candy-card" style={{ cursor: 'default' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontStyle: 'italic', fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '2px' }}>Estado en Congelador:</div>
            <span style={{ fontSize: '15px', fontWeight: '900' }}>{batch.remaining_doses} / {batch.total_doses} Tubos</span>
          </div>
          {batch.remaining_doses > 0 && (
            <button className="btn-candy primary" onClick={handleDoseDeduction} style={{ margin: 0, padding: '8px 12px', fontSize: '11px' }}>
              - Restar 1 Tubo
            </button>
          )}
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #E2E8F0', fontSize: '11px' }}>
          <div>
            <span style={{ color: 'var(--color-text-muted)' }}>Tueste:</span> <br />
            <strong>{batch.roast_date ? new Date(batch.roast_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Sin fecha'}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--color-text-muted)' }}>Congelado:</span> <br />
            <strong>{batch.freeze_date ? new Date(batch.freeze_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Sin fecha'}</strong>
          </div>
          <div style={{ gridColumn: 'span 2', marginTop: '4px', display: 'flex', gap: '12px', color: 'var(--color-text-muted)' }}>
            <span>Reposado: <strong>{restingDaysText}</strong></span>
            <span>Estadía: <strong>{freezeTime}</strong></span>
          </div>
        </div>
      </div>

      {/* Improvement 2: Semáforo de Desgasificación Box */}
      {batch.roast_date && batch.freeze_date && (
        <div className="candy-card" style={{ cursor: 'default', borderLeft: `6px solid ${degasStatus.color}`, backgroundColor: '#FFFFFF' }}>
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

      {/* Improvement 6: Historial Gráfico de Molienda (Timeline de Micrones) */}
      {batch.recipes && batch.recipes.length > 0 && (
        <div className="candy-card" style={{ cursor: 'default' }}>
          <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '10px', textTransform: 'uppercase', margin: '0 0 12px 0', color: 'var(--color-crimson)', letterSpacing: '0.5px' }}>
            Evolución de Molienda (Micrones)
          </h4>
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px', alignItems: 'flex-end', height: '60px' }}>
            {batch.recipes.slice(0, 6).reverse().map((recipe, index) => {
              const microns = parseGrindToMicrons(recipe.grind);
              if (!microns) return null;
              // Normalize height for visual display (e.g. min 200, max 2500)
              const barHeight = Math.min(100, Math.max(15, (microns / 2000) * 100));
              return (
                <div key={recipe.id || index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1', minWidth: '45px' }}>
                  <span style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--color-text)' }}>{microns}µm</span>
                  <div style={{
                    width: '12px',
                    height: `${barHeight}px`,
                    backgroundColor: recipe.rating >= 4 ? 'var(--color-crimson)' : '#CBD5E0',
                    border: '1.5px solid var(--border-color)',
                    marginTop: '4px',
                    borderRadius: '2px 2px 0 0'
                  }} />
                  <span style={{ fontSize: '8px', color: 'var(--color-text-muted)', marginTop: '2px', textTransform: 'uppercase' }}>
                    {recipe.method.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
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

      {/* Cronómetro Brew Timer */}
      <div className="timer-container">
        <div style={{ fontSize: '9px', fontWeight: '900', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Cronómetro de Extracción
        </div>
        <div className="timer-display">{timerFormatted}</div>
        <div className="timer-controls">
          <button type="button" className="app-bar-btn" onClick={handleStartPauseTimer}>
            {timerActive ? 'Pausar' : 'Iniciar'}
          </button>
          <button type="button" className="app-bar-btn" onClick={handleResetTimer}>
            Reset
          </button>
          {timerSeconds > 0 && (
            <button type="button" className="app-bar-btn" onClick={handleStopTimer} style={{ background: '#000', color: '#FFF' }}>
              Registrar Tiempo
            </button>
          )}
        </div>
      </div>

      {/* Formulario de Bitácora */}
      <h2 style={{ fontFamily: 'var(--font-heading)', marginTop: '24px', textTransform: 'uppercase', fontSize: '15px' }}>Registrar Preparación</h2>
      <div className="candy-card" style={{ cursor: 'default' }}>
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
          
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>Ratio de Extracción</label>
              <div className="mono-stepper" style={{ width: '100%' }}>
                <button type="button" className="stepper-btn" onClick={() => setRatioVal(r => Math.max(1.0, r - 0.5))}>-</button>
                <div className="stepper-value" style={{ width: '48px' }}>{ratioVal.toFixed(1)}</div>
                <button type="button" className="stepper-btn" onClick={() => setRatioVal(r => r + 0.5)}>+</button>
              </div>
              <div style={{ fontSize: '11px', fontWeight: 'bold', marginTop: '6px', textAlign: 'center' }}>
                Agua Objetivo: <span style={{ color: '#E53E3E' }}>{(doseNum * ratioVal).toFixed(0)}g</span>
              </div>
            </div>
            
            <div className="form-group" style={{ flex: 1 }}>
              <label>Molienda (J-Max: R.N.C)</label>
              <div className="jmax-steppers-grid" style={{ marginBottom: 4 }}>
                <div className="jmax-cell">
                  <span className="jmax-hdr-lbl">ROT</span>
                  <div className="mono-stepper">
                    <button type="button" className="stepper-btn" onClick={() => setJmaxRot(r => Math.max(0, r - 1))}>-</button>
                    <div className="stepper-value">{jmaxRot}</div>
                    <button type="button" className="stepper-btn" onClick={() => setJmaxRot(r => Math.min(4, r + 1))}>+</button>
                  </div>
                </div>
                <div className="jmax-cell">
                  <span className="jmax-hdr-lbl">NUM</span>
                  <div className="mono-stepper">
                    <button type="button" className="stepper-btn" onClick={() => setJmaxNum(n => Math.max(0, n - 1))}>-</button>
                    <div className="stepper-value">{jmaxNum}</div>
                    <button type="button" className="stepper-btn" onClick={() => setJmaxNum(n => Math.min(8, n + 1))}>+</button>
                  </div>
                </div>
                <div className="jmax-cell">
                  <span className="jmax-hdr-lbl">CLIC</span>
                  <div className="mono-stepper">
                    <button type="button" className="stepper-btn" onClick={() => setJmaxClick(c => Math.max(0, c - 1))}>-</button>
                    <div className="stepper-value">{jmaxClick}</div>
                    <button type="button" className="stepper-btn" onClick={() => setJmaxClick(c => Math.min(9, c + 1))}>+</button>
                  </div>
                </div>
              </div>
              {/* Improvement 3: Micron Grind Translator text output */}
              <div style={{ fontSize: '10px', textAlign: 'center', fontWeight: 'bold', color: 'var(--color-crimson)' }}>
                Partícula: ~{currentMicrons} µm
              </div>
            </div>
          </div>

          <div className="form-row" style={{ alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Tiempo de Extracción</label>
              <input className="candy-input" value={brewTime} onChange={(e) => setBrewTime(e.target.value)} type="text" />
            </div>
            
            {/* R9: Interactive Star Rating */}
            <div className="form-group" style={{ flex: 1 }}>
              <label>Puntuación</label>
              <StarRating value={rating} onChange={setRating} />
            </div>
          </div>

          {/* Improvement 5: Sensory Sliders and Flavor tags */}
          <div style={{ borderTop: '1.5px solid var(--border-color)', marginTop: '12px', paddingTop: '12px' }}>
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '11px', textTransform: 'uppercase', margin: '0 0 10px 0' }}>
              Evaluación Sensorial (Taza Perfecta)
            </h4>
            
            {/* Balance Selector */}
            <div className="form-group">
              <label style={{ fontSize: '9px' }}>Balance Sensorial (Predominante)</label>
              <div style={{ display: 'flex', gap: '6px' }}>
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
              <div style={{ display: 'flex', gap: '6px' }}>
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

            {/* SCA Flavor Wheel Tags Selector */}
            <div className="form-group">
              <label style={{ fontSize: '9px' }}>Notas de Descriptor (Rueda SCA)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                {flavorWheelTags.map(tag => {
                  const isSelected = selectedFlavorTags.includes(tag.label);
                  return (
                    <button
                      key={tag.val}
                      type="button"
                      onClick={() => toggleFlavorTag(tag.label)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        border: '1.5px solid var(--border-color)',
                        borderRadius: '6px',
                        backgroundColor: isSelected ? 'var(--color-crimson)' : 'var(--bg-card)',
                        color: isSelected ? '#FFF' : 'var(--border-color)',
                        cursor: 'pointer',
                        transition: 'all 100ms'
                      }}
                    >
                      {tag.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '12px' }}>
            <label>Comentarios Adicionales</label>
            <input className="candy-input" value={notes} onChange={(e) => setNotes(e.target.value)} type="text" placeholder="Ej. Retrogusto largo, dulzor a caña." />
          </div>

          <button type="submit" className="btn-candy primary" style={{ width: '100%', marginTop: '8px' }}>Guardar Bitácora</button>
        </form>
      </div>

      {/* R10: Delete batch button */}
      <button 
        className="btn-candy" 
        onClick={() => onDeleteBatch(batch.id, batch.name)}
        style={{ 
          width: '100%', marginTop: '24px', 
          color: 'var(--color-crimson)', borderColor: 'var(--color-crimson)',
          fontSize: '11px'
        }}
      >
        Eliminar Lote
      </button>
    </div>
  );
}
