import React, { useState, useEffect, useRef } from 'react';

export default function BatchDetail({ batchId, onBack, onSubtractDose, onSaveRecipe }) {
  const [batch, setBatch] = useState(null);
  const [holdPct, setHoldPct] = useState(0);
  const [method, setMethod] = useState('V60 (Filtrado)');
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState(5);
  
  // J-Max Steppers (Default: 1.5.0)
  const [jmaxRot, setJmaxRot] = useState(1);
  const [jmaxNum, setJmaxNum] = useState(5);
  const [jmaxClick, setJmaxClick] = useState(0);
  
  // Smart Ratio (Default: 15.0)
  const [ratioVal, setRatioVal] = useState(15.0);

  const holdTimer = useRef(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/batches/${batchId}`)
      .then(res => res.json())
      .then(data => {
        if (active) {
          setBatch(data);
        }
      });
    return () => { active = false; };
  }, [batchId]);

  const startHold = () => {
    setHoldPct(0);
    holdTimer.current = setInterval(() => {
      setHoldPct(prev => {
        if (prev >= 100) {
          clearInterval(holdTimer.current);
          handleDoseDeduction();
          return 0;
        }
        return prev + 10;
      });
    }, 80);
  };

  const endHold = () => {
    clearInterval(holdTimer.current);
    setHoldPct(0);
  };

  const handleDoseDeduction = () => {
    onSubtractDose(batch.id, () => {
      setBatch(prev => ({
        ...prev,
        remaining_doses: Math.max(0, prev.remaining_doses - 1)
      }));
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
      brew_time: '2:45 min',
      rating,
      notes
    });
    setNotes('');
  };

  if (!batch) return <div style={{ padding: '30px', textAlign: 'center' }}>Cargando detalles...</div>;

  // Cálculo de Días de Tueste y Congelación
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

  const doseNum = parseFloat(batch.dose_weight) || 20.0;
  const isLowStock = batch.remaining_doses <= 2;

  return (
    <div style={{ padding: '16px 16px 90px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <button className="btn-candy" onClick={onBack}>← Volver</button>
        {isLowStock && <span className="mono-lbl-tag" style={{ background: '#E53E3E' }}>¡ÚLTIMOS TUBOS!</span>}
      </div>

      <h2 style={{ fontFamily: 'var(--font-heading)' }}>{batch.name}</h2>

      <div className="details-grid">
        <div className="grid-cell">
          <div className="grid-lbl">País / Origen</div>
          <div className="grid-val">{batch.origin || 'N/A'}</div>
        </div>
        <div className="grid-cell" style={{ borderLeft: '1px solid #E2E8F0', paddingLeft: '8px' }}>
          <div className="grid-lbl">Tostador</div>
          <div className="grid-val">{batch.roaster || 'N/A'}</div>
        </div>
        <div className="grid-cell">
          <div className="grid-lbl">📅 Tueste</div>
          <div className="grid-val">{batch.roast_date ? new Date(batch.roast_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Sin fecha'}</div>
        </div>
        <div className="grid-cell" style={{ borderLeft: '1px solid #E2E8F0', paddingLeft: '8px' }}>
          <div className="grid-lbl">❄️ Congelación</div>
          <div className="grid-val">{batch.freeze_date ? new Date(batch.freeze_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Sin fecha'}</div>
        </div>
        <div className="grid-cell">
          <div className="grid-lbl">Nivel Tueste</div>
          <div className="grid-val">{batch.roast_level || 'Medio'}</div>
        </div>
        <div className="grid-cell" style={{ borderLeft: '1px solid #E2E8F0', paddingLeft: '8px' }}>
          <div className="grid-lbl">Proceso</div>
          <div className="grid-val">{batch.process || 'N/A'}</div>
        </div>
        <div className="grid-cell">
          <div className="grid-lbl">Reposo Pre-Frío</div>
          <div className="grid-val">{restingDays}</div>
        </div>
        <div className="grid-cell" style={{ borderLeft: '1px solid #E2E8F0', paddingLeft: '8px' }}>
          <div className="grid-lbl">Tiempo Congelado</div>
          <div className="grid-val">{freezeTime}</div>
        </div>
        <div className="grid-cell">
          <div className="grid-lbl">Altitud</div>
          <div className="grid-val">{batch.altitude || 'N/A'}</div>
        </div>
        <div className="grid-cell" style={{ borderLeft: '1px solid #E2E8F0', paddingLeft: '8px' }}>
          <div className="grid-lbl">Dosis Restantes</div>
          <div className="grid-val">{batch.remaining_doses} tubos</div>
        </div>
      </div>

      {/* Hold button */}
      <div className="nb-action-wrap">
        <button 
          className="btn-candy" 
          style={{ 
            position: 'relative', 
            width: '100%', 
            height: '50px', 
            overflow: 'hidden',
            backgroundColor: '#000000',
            color: '#FFFFFF'
          }}
          onMouseDown={startHold}
          onMouseUp={endHold}
          onMouseLeave={endHold}
          onTouchStart={startHold}
          onTouchEnd={endHold}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${holdPct}%`, backgroundColor: '#E53E3E', opacity: 0.8, transition: 'width 0.1s linear' }}></div>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold' }}>
            <span>RESTAR DOSIS (MANTENER)</span>
          </div>
        </button>
      </div>

      {/* Form recipe with Smart Ratio & J-Max RNC */}
      <h2 style={{ fontFamily: 'var(--font-heading)', marginTop: '20px' }}>📝 Bitácora de Extracción</h2>
      <div className="candy-card" style={{ cursor: 'default' }}>
        <form onSubmit={handleRecipeSubmit}>
          <div className="form-group">
            <label>Método</label>
            <select className="candy-input" value={method} onChange={(e) => setMethod(e.target.value)}>
              <option>V60 (Filtrado)</option>
              <option>Espresso</option>
              <option>AeroPress</option>
              <option>Prensa Francesa</option>
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

          <div className="form-group">
            <label>Puntaje (Estrellas)</label>
            <div className="mono-stepper">
              <button type="button" className="stepper-btn" onClick={() => setRating(r => Math.max(1, r - 1))}>-</button>
              <div className="stepper-value">{rating}</div>
              <button type="button" className="stepper-btn" onClick={() => setRating(r => Math.min(5, r + 1))}>+</button>
            </div>
          </div>

          <div className="form-group">
            <label>Notas Personales</label>
            <input className="candy-input" value={notes} onChange={(e) => setNotes(e.target.value)} type="text" placeholder="Ej. Excelente acidez a durazno." />
          </div>

          <button type="submit" className="btn-candy primary" style={{ width: '100%', marginTop: '8px' }}>Guardar Bitácora</button>
        </form>
      </div>
    </div>
  );
}
