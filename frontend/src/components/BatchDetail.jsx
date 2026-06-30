import React, { useState, useEffect, useRef } from 'react';

export default function BatchDetail({ batchId, onBack, onSubtractDose, onSaveRecipe }) {
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

  const handleStopTimer = () => {
    setTimerActive(false);
    const mins = Math.floor(timerSeconds / 60);
    const secs = timerSeconds % 60;
    const formattedTime = `${mins}:${secs < 10 ? '0' : ''}${secs} min`;
    setBrewTime(formattedTime);
    alert(`¡Tiempo de extracción registrado: ${formattedTime}!`);
  };

  const handleDoseDeduction = () => {
    onSubtractDose(batch.id, () => {
      setBatch(prev => ({
        ...prev,
        remaining_doses: Math.max(0, prev.remaining_doses - 1)
      }));
    });
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
        notes: `${last.notes || ''} (Repetición rápida)`.trim()
      });
    });
  };

  const handleRecipeSubmit = (e) => {
    e.preventDefault();
    const doseNum = parseFloat(batch.dose_weight) || 20.0;
    const targetWater = (doseNum * ratioVal).toFixed(0);

    onSaveRecipe({
      batch_id: batch.id,
      method,
      ratio: `1:${ratioVal.toFixed(1)} (${targetWater}g)`,
      grind: `J-Max: ${jmaxRot}.${jmaxNum}.${jmaxClick}`,
      temperature: '93°C',
      brew_time: brewTime,
      rating,
      notes
    });
    setNotes('');
  };

  if (!batch) return <div style={{ padding: '30px', textAlign: 'center' }}>Cargando detalles...</div>;

  const doseNum = parseFloat(batch.dose_weight) || 20.0;
  const isLowStock = batch.remaining_doses <= 2;
  const lastRecipe = batch.recipes && batch.recipes.length > 0 ? batch.recipes[0] : null;

  // Calculos de dias
  let restingDays = 'Sin datos';
  let freezeTime = 'Sin datos';
  
  if (batch.roast_date && batch.freeze_date) {
    const roast = new Date(batch.roast_date);
    const freeze = new Date(batch.freeze_date);
    const diffTime = Math.abs(freeze - roast);
    restingDays = `${Math.ceil(diffTime / (1000 * 60 * 60 * 24))} días de reposo`;
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

  return (
    <div style={{ padding: '16px 16px 90px 16px' }}>
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
            <span>Reposado: <strong>{restingDays}</strong></span>
            <span>Estadía: <strong>{freezeTime}</strong></span>
          </div>
        </div>
      </div>

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
            Molido para <strong>{batch.dose_weight}</strong>. Agua requerida: <strong>{(doseNum * ratioVal).toFixed(0)}g</strong>.
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
          
          <div style={{ display: 'flex', gap: '8px' }}>
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
              <div className="jmax-steppers-grid" style={{ marginBottom: 0 }}>
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
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Tiempo de Extracción</label>
              <input className="candy-input" value={brewTime} onChange={(e) => setBrewTime(e.target.value)} type="text" />
            </div>
            
            <div className="form-group" style={{ flex: 1 }}>
              <label>Puntuación (Estrellas)</label>
              <div className="mono-stepper" style={{ width: '100%' }}>
                <button type="button" className="stepper-btn" onClick={() => setRating(r => Math.max(1, r - 1))}>-</button>
                <div className="stepper-value">{rating}</div>
                <button type="button" className="stepper-btn" onClick={() => setRating(r => Math.min(5, r + 1))}>+</button>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Notas Personales / Sabores</label>
            <input className="candy-input" value={notes} onChange={(e) => setNotes(e.target.value)} type="text" placeholder="Ej. Acidez a durazno brillante, final dulce." />
          </div>

          <button type="submit" className="btn-candy primary" style={{ width: '100%', marginTop: '8px' }}>Guardar Bitácora</button>
        </form>
      </div>
    </div>
  );
}
