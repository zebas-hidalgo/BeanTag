import React, { useState } from 'react';

export default function BatchCreator({ onBatchCreated, onBack }) {
  const [name, setName] = useState('');
  const [producer, setProducer] = useState('');
  const [altitude, setAltitude] = useState('');
  const [variety, setVariety] = useState('');
  const [process, setProcess] = useState('');
  const [roaster, setRoaster] = useState('');
  const [notes, setNotes] = useState('');
  const [totalDoses, setTotalDoses] = useState(12);
  const [doseWeight, setDoseWeight] = useState('20.0g');
  const [generatedUrl, setGeneratedUrl] = useState('');
  
  // Nuevos Estados de Metadatos
  const [origin, setOrigin] = useState('');
  const [roastLevel, setRoastLevel] = useState('Medio');
  const [roastDate, setRoastDate] = useState('');
  const [freezeDate, setFreezeDate] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    const payload = {
      id, name, producer, altitude, variety, process, roaster, roaster_notes: notes, dose_weight: doseWeight, total_doses: totalDoses,
      origin, roast_level: roastLevel, roast_date: roastDate, freeze_date: freezeDate
    };

    fetch('/api/batches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        const host = window.location.origin;
        setGeneratedUrl(`${host}/batch/${id}`);
        if (onBatchCreated) onBatchCreated();
      }
    });
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(generatedUrl);
    alert('¡Enlace único copiado al portapapeles!');
  };

  return (
    <div style={{ padding: '16px 16px 90px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <button className="btn-candy" onClick={onBack}>✕ Cancelar</button>
      </div>

      <h2 style={{ fontFamily: 'var(--font-heading)' }}>Registrar Lote</h2>
      <div className="candy-card" style={{ cursor: 'default' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre del Café</label>
            <input className="candy-input" value={name} onChange={(e) => setName(e.target.value)} type="text" required placeholder="Ej. Pink Bourbon" />
          </div>
          
          <div className="form-group">
            <label>Productor / Finca</label>
            <input className="candy-input" value={producer} onChange={(e) => setProducer(e.target.value)} type="text" required placeholder="Ej. Nestor Lasso / El Diviso" />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Origen / País</label>
              <input className="candy-input" value={origin} onChange={(e) => setOrigin(e.target.value)} type="text" placeholder="Ej. Colombia" />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Nivel de Tueste</label>
              <select className="candy-input" style={{ height: '40px' }} value={roastLevel} onChange={(e) => setRoastLevel(e.target.value)}>
                <option value="Claro">Claro (Light)</option>
                <option value="Medio">Medio (Medium)</option>
                <option value="Oscuro">Oscuro (Dark)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Fecha de Tueste</label>
              <input className="candy-input" value={roastDate} onChange={(e) => setRoastDate(e.target.value)} type="date" />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Fecha de Congelado</label>
              <input className="candy-input" value={freezeDate} onChange={(e) => setFreezeDate(e.target.value)} type="date" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Altitud</label>
              <input className="candy-input" value={altitude} onChange={(e) => setAltitude(e.target.value)} type="text" placeholder="Ej. 1800 msnm" />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Varietal</label>
              <input className="candy-input" value={variety} onChange={(e) => setVariety(e.target.value)} type="text" placeholder="Ej. Bourbon" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Proceso</label>
              <input className="candy-input" value={process} onChange={(e) => setProcess(e.target.value)} type="text" placeholder="Ej. Anaeróbico" />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Tostador</label>
              <input className="candy-input" value={roaster} onChange={(e) => setRoaster(e.target.value)} type="text" placeholder="Ej. Coffee Circular" />
            </div>
          </div>

          <div className="form-group">
            <label>Notas de Cata (Tostador)</label>
            <input className="candy-input" value={notes} onChange={(e) => setNotes(e.target.value)} type="text" placeholder="Ej. Fresa, chocolate, cuerpo sedoso" />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Cantidad de Tubos</label>
              <div className="mono-stepper">
                <button type="button" className="stepper-btn" onClick={() => setTotalDoses(d => Math.max(1, d - 1))}>-</button>
                <div className="stepper-value">{totalDoses}</div>
                <button type="button" className="stepper-btn" onClick={() => setTotalDoses(d => d + 1)}>+</button>
              </div>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Gramos por Tubo</label>
              <input className="candy-input" value={doseWeight} onChange={(e) => setDoseWeight(e.target.value)} type="text" />
            </div>
          </div>

          <button type="submit" className="btn-candy primary" style={{ width: '100%', marginTop: '10px' }}>Crear Lote y Obtener Link</button>
        </form>
      </div>

      {generatedUrl && (
        <div className="instr-box" style={{ marginTop: '16px' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '14px', marginTop: 0 }}>Enlace Único de Lote NFC</h3>
          <p style={{ fontSize: '11px', marginTop: 0 }}>Escribe este enlace en tus tags NFC usando la app "NFC Tools":</p>
          
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input className="candy-input" value={generatedUrl} readOnly style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', flex: 1 }} />
            <button type="button" className="btn-candy primary" style={{ margin: 0 }} onClick={copyUrl}>Copiar</button>
          </div>
        </div>
      )}
    </div>
  );
}
