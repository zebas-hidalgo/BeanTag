import React, { useState, useEffect, useRef } from 'react';

export default function BatchDetail({ batchId, onBack, onSubtractDose, onSaveRecipe }) {
  const [batch, setBatch] = useState(null);
  const [holdPct, setHoldPct] = useState(0);
  const [clicks, setClicks] = useState(22);
  const [method, setMethod] = useState('V60 (Filtrado)');
  const [ratio, setRatio] = useState('300g (1:15)');
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState(5);
  
  const holdTimer = useRef(null);

  useEffect(() => {
    fetch(`/api/batches/${batchId}`)
      .then(res => res.json())
      .then(data => {
        setBatch(data);
      });
  }, [batchId]);

  useEffect(() => {
    return () => {
      if (holdTimer.current) {
        clearInterval(holdTimer.current);
      }
    };
  }, []);

  const startHold = () => {
    if (holdTimer.current) {
      clearInterval(holdTimer.current);
    }
    setHoldPct(0);
    holdTimer.current = setInterval(() => {
      setHoldPct(prev => {
        if (prev >= 100) {
          clearInterval(holdTimer.current);
          holdTimer.current = null;
          handleDoseDeduction();
          return 0;
        }
        return prev + 10;
      });
    }, 80);
  };

  const endHold = () => {
    if (holdTimer.current) {
      clearInterval(holdTimer.current);
      holdTimer.current = null;
    }
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
    onSaveRecipe({
      batch_id: batch.id,
      method,
      ratio,
      grind: `${clicks} clicks`,
      temperature: '93°C',
      brew_time: '2:45 min',
      rating,
      notes
    });
    setNotes('');
  };

  if (!batch) return <div style={{ padding: '30px', textAlign: 'center' }}>Cargando detalles...</div>;

  return (
    <div style={{ padding: '16px 16px 90px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <button className="btn-candy" onClick={onBack}>← Volver</button>
        <span className="candy-badge" id="doses-detail-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '14px', height: '14px' }}><path d="M6 3h12M9 3v11l3 7 3-7V3"/><path d="M12 7h2M12 11h2M12 15h1.5"/></svg>
          <span>{batch.remaining_doses} Dosis</span>
        </span>
      </div>

      <h2 style={{ fontFamily: 'var(--font-heading)' }}>{batch.name}</h2>

      <div className="candy-fields-grid">
        <div className="field-item">
          <div className="field-label">Productor / Finca</div>
          <div className="field-value">{batch.producer}</div>
        </div>
        <div className="field-item">
          <div className="field-label">Tostador</div>
          <div className="field-value">{batch.roaster || 'N/A'}</div>
        </div>
        <div className="field-item">
          <div className="field-label">Altitud</div>
          <div className="field-value">{batch.altitude || 'N/A'}</div>
        </div>
        <div className="field-item">
          <div className="field-label">Varietal</div>
          <div className="field-value">{batch.variety || 'N/A'}</div>
        </div>
        <div className="field-item">
          <div className="field-label">Proceso</div>
          <div className="field-value">{batch.process || 'N/A'}</div>
        </div>
        <div className="field-item">
          <div className="field-label">Gramos</div>
          <div className="field-value">{batch.dose_weight || '20.0g'}</div>
        </div>
        <div className="field-item full-width">
          <div className="field-label">Notas del Tostador</div>
          <div className="field-value" style={{ fontStyle: 'italic' }}>{batch.roaster_notes || 'Sin notas de cata'}</div>
        </div>
      </div>

      {/* Tactile Hold Button Wrapper */}
      <div className="nb-action-wrap">
        <button 
          className="btn-candy" 
          style={{ 
            position: 'relative', 
            width: '100%', 
            height: '60px', 
            backgroundColor: 'var(--color-orange)', 
            borderRadius: '20px', 
            overflow: 'hidden', 
            border: '3.5px solid var(--color-navy)',
            boxShadow: '0px 6px 0px var(--color-navy)'
          }}
          onMouseDown={startHold}
          onMouseUp={endHold}
          onMouseLeave={endHold}
          onTouchStart={startHold}
          onTouchEnd={endHold}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${holdPct}%`, backgroundColor: 'var(--color-green)', transition: 'width 0.1s linear' }}></div>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 'bold', color: 'white', textShadow: '1.5px 1.5px 0px var(--color-navy)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '22px', height: '22px' }}><path d="M18 8h1a3 3 0 0 1 0 6h-1"/><path d="M3 8h15v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z"/><path d="M6 3v2M10 3v2M14 3v2"/></svg>
            <span>Restar Dosis (Mantener)</span>
          </div>
        </button>
      </div>

      {/* Brew Recipe Form */}
      <h2 style={{ fontFamily: 'var(--font-heading)', marginTop: '20px' }}>📝 Bitácora de Extracción</h2>
      <div className="candy-card bg-peach" style={{ cursor: 'default' }}>
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
              <label>Ratio / Agua</label>
              <input className="candy-input" value={ratio} onChange={(e) => setRatio(e.target.value)} type="text" />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Molienda (Clicks)</label>
              <div className="stepper">
                <button type="button" className="stepper-btn" onClick={() => setClicks(c => Math.max(0, c - 1))}>-</button>
                <input className="stepper-value" value={clicks} readOnly />
                <button type="button" className="stepper-btn" onClick={() => setClicks(c => c + 1)}>+</button>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Puntaje (Estrellas)</label>
            <div className="stepper">
              <button type="button" className="stepper-btn" onClick={() => setRating(r => Math.max(1, r - 1))}>-</button>
              <input className="stepper-value" value={rating} readOnly />
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
