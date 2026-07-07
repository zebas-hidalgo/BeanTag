import React, { useState } from 'react';
import { Save, X, ClipboardCopy } from 'lucide-react';
import { getScaIcon, stripEmojis } from '../utils/scaIcons';
export default function BatchCreator({ batchToEdit, onBatchCreated, onBack, showToast }) {
  // Parse initial flavor tags and custom notes if editing
  const getInitialFlavorTags = () => {
    if (!batchToEdit || !batchToEdit.roaster_notes) return [];
    const notesStr = String(batchToEdit.roaster_notes);
    if (notesStr.includes('[Notas: ') && notesStr.includes(']')) {
      const match = notesStr.match(/\[Notas: (.*?)\]/);
      if (match) {
        return match[1].split(',').map(t => t.trim());
      }
    }
    return [];
  };

  const getInitialNotes = () => {
    if (!batchToEdit || !batchToEdit.roaster_notes) return '';
    const notesStr = String(batchToEdit.roaster_notes);
    if (notesStr.includes(' | ')) {
      return notesStr.split(' | ')[1] || '';
    } else if (notesStr.includes('[Notas: ') && notesStr.includes(']')) {
      return ''; // only notes tags existed
    }
    return notesStr;
  };

  const [name, setName] = useState(batchToEdit ? batchToEdit.name : '');
  const [producer, setProducer] = useState(batchToEdit ? batchToEdit.producer : '');
  const [altitude, setAltitude] = useState(batchToEdit ? batchToEdit.altitude || '' : '');
  const [variety, setVariety] = useState(batchToEdit ? batchToEdit.variety || '' : '');
  const [process, setProcess] = useState(batchToEdit ? batchToEdit.process || '' : '');
  const [roaster, setRoaster] = useState(batchToEdit ? batchToEdit.roaster || '' : '');
  const [notes, setNotes] = useState(getInitialNotes());
  const [totalDoses, setTotalDoses] = useState(batchToEdit ? batchToEdit.total_doses : 12);
  const [doseWeight, setDoseWeight] = useState(batchToEdit ? batchToEdit.dose_weight || '20.0g' : '20.0g');
  const [generatedUrl, setGeneratedUrl] = useState('');
  
  const [origin, setOrigin] = useState(batchToEdit ? batchToEdit.origin || '' : '');
  const [roastLevel, setRoastLevel] = useState(batchToEdit ? batchToEdit.roast_level || 'Medio' : 'Medio');
  const [roastDate, setRoastDate] = useState(batchToEdit ? batchToEdit.roast_date || '' : '');
  const [freezeDate, setFreezeDate] = useState(batchToEdit ? batchToEdit.freeze_date || '' : '');
  const [selectedFlavorTags, setSelectedFlavorTags] = useState(getInitialFlavorTags());

  // Popular Coffee Flavor Tags (SCA Flavor Wheel Expanded)
  const flavorWheelTags = [
    // Frutales
    { label: '🍒 Cereza', val: 'cereza' },
    { label: '🍋 Cítrico', val: 'cítrico' },
    { label: '🍎 Manzana', val: 'manzana' },
    { label: '🍇 Uva', val: 'uva' },
    { label: '🍑 Durazno', val: 'durazno' },
    { label: '🍓 Frutilla', val: 'frutilla' },
    { label: '🫐 Arándano', val: 'arándano' },
    { label: '🍍 Piña', val: 'piña' },
    // Florales
    { label: '🌸 Jazmín', val: 'jazmín' },
    { label: '🌺 Azahar', val: 'azahar' },
    { label: '🌹 Rosa', val: 'rosa' },
    // Dulces / Caramelos
    { label: '🍯 Miel', val: 'miel' },
    { label: '🍮 Caramelo', val: 'caramelo' },
    { label: '🍨 Vainilla', val: 'vainilla' },
    { label: '🥞 Melaza', val: 'melaza' },
    // Chocolates
    { label: '🍫 Chocolate', val: 'chocolate' },
    { label: '🍫🥛 Choc. Leche', val: 'choc_leche' },
    { label: '🫘 Cacao', val: 'cacao' },
    // Nueces
    { label: '🥜 Maní', val: 'maní' },
    { label: '🌰 Avellana', val: 'avellana' },
    { label: '🥥 Almendra', val: 'almendra' },
    // Especias & Hierbas
    { label: '🍂 Canela', val: 'canela' },
    { label: '🌿 Menta', val: 'menta' },
    { label: '🍵 Té Verde', val: 'te_verde' }
  ];

  const toggleFlavorTag = (tagLabel) => {
    if (selectedFlavorTags.includes(tagLabel)) {
      setSelectedFlavorTags(selectedFlavorTags.filter(t => t !== tagLabel));
    } else {
      setSelectedFlavorTags([...selectedFlavorTags, tagLabel]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const id = batchToEdit ? batchToEdit.id : name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    const combinedNotes = [
      selectedFlavorTags.length > 0 ? `[Notas: ${selectedFlavorTags.join(', ')}]` : '',
      notes
    ].filter(Boolean).join(' | ');

    const payload = {
      name, producer, altitude, variety, process, roaster, roaster_notes: combinedNotes, dose_weight: doseWeight, total_doses: totalDoses,
      origin, roast_level: roastLevel, roast_date: roastDate, freeze_date: freezeDate
    };

    const url = batchToEdit ? `/api/batches/${batchToEdit.id}` : '/api/batches';
    const method = batchToEdit ? 'PUT' : 'POST';

    // If creating, send the ID in the payload
    if (!batchToEdit) {
      payload.id = id;
    }

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        if (batchToEdit) {
          showToast('Lote actualizado con éxito.', { type: 'success', duration: 2500 });
        } else {
          const host = window.location.origin;
          setGeneratedUrl(`${host}/batch/${id}`);
          showToast('Lote creado con éxito.', { type: 'success', duration: 2500 });
        }
        if (onBatchCreated) onBatchCreated();
      }
    });
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(generatedUrl);
    showToast('Enlace copiado al portapapeles.', { type: 'success', duration: 2000 });
  };

  return (
    <div style={{ padding: '14px 14px 90px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <button className="btn-candy" onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <X size={16} strokeWidth={2.5} />
          Cancelar
        </button>
      </div>

      <h2 style={{ fontFamily: 'var(--font-heading)', textTransform: 'uppercase', margin: '0 0 14px 0', fontSize: '16px' }}>
        {batchToEdit ? 'Editar Lote' : 'Registrar Lote'}
      </h2>
      
      <form onSubmit={handleSubmit}>
        {/* Sección 1 — Identidad del Café */}
        <div className="candy-card static" style={{ cursor: 'default' }}>
          <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '10px', textTransform: 'uppercase', margin: '0 0 12px 0', color: 'var(--color-crimson)', letterSpacing: '0.5px' }}>
            Identidad del Café
          </h4>
          <div className="form-group">
            <label>Nombre del Café</label>
            <input className="candy-input" value={name} onChange={(e) => setName(e.target.value)} type="text" required placeholder="Ej. Pink Bourbon" />
          </div>
          
          <div className="form-group">
            <label>Productor / Finca</label>
            <input className="candy-input" value={producer} onChange={(e) => setProducer(e.target.value)} type="text" required placeholder="Ej. Nestor Lasso / El Diviso" />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Origen</label>
              <input className="candy-input" value={origin} onChange={(e) => setOrigin(e.target.value)} type="text" placeholder="Ej. Colombia" />
            </div>
            <div className="form-group">
              <label>Varietal</label>
              <input className="candy-input" value={variety} onChange={(e) => setVariety(e.target.value)} type="text" placeholder="Ej. Bourbon" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Altitud</label>
              <input className="candy-input" value={altitude} onChange={(e) => setAltitude(e.target.value)} type="text" placeholder="Ej. 1800 msnm" />
            </div>
            <div className="form-group">
              <label>Proceso</label>
              <input className="candy-input" value={process} onChange={(e) => setProcess(e.target.value)} type="text" placeholder="Ej. Anaeróbico" />
            </div>
          </div>
        </div>

        {/* Sección 2 — Perfil de Tueste & Notas de Cata */}
        <div className="candy-card static" style={{ cursor: 'default' }}>
          <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '10px', textTransform: 'uppercase', margin: '0 0 12px 0', color: 'var(--color-crimson)', letterSpacing: '0.5px' }}>
            Perfil de Tueste & Notas de Cata
          </h4>
          <div className="form-row">
            <div className="form-group">
              <label>Tostador</label>
              <input className="candy-input" value={roaster} onChange={(e) => setRoaster(e.target.value)} type="text" placeholder="Ej. Coffee Circular" />
            </div>
            <div className="form-group">
              <label>Tueste</label>
              <select className="candy-input" value={roastLevel} onChange={(e) => setRoastLevel(e.target.value)}>
                <option value="Claro">Claro</option>
                <option value="Medio">Medio</option>
                <option value="Oscuro">Oscuro</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Fecha de Tueste</label>
              <input className="candy-input" value={roastDate} onChange={(e) => setRoastDate(e.target.value)} type="date" />
            </div>
            <div className="form-group">
              <label>Fecha de Congelado</label>
              <input className="candy-input" value={freezeDate} onChange={(e) => setFreezeDate(e.target.value)} type="date" />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '10px' }}>
            <label style={{ marginBottom: '8px', display: 'block' }}>Notas de Cata (Rueda SCA)</label>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              marginBottom: '12px'
            }}>
              {flavorWheelTags.map(tag => {
                const isSelected = selectedFlavorTags.includes(tag.label);
                const cleanLabel = stripEmojis(tag.label);
                return (
                  <button
                    key={tag.val}
                    type="button"
                    style={{
                      padding: '6px 10px',
                      fontFamily: 'var(--font-heading)',
                      fontSize: '11px',
                      border: '2px solid #000000',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? 'var(--color-navy)' : '#FFFFFF',
                      color: isSelected ? '#FFFFFF' : 'var(--color-navy)',
                      boxShadow: isSelected ? 'none' : '2px 2px 0px #000000',
                      transition: 'all 0.1s ease',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    onClick={() => toggleFlavorTag(tag.label)}
                  >
                    {getScaIcon(tag.label, 12, 2.5)}
                    {cleanLabel}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="form-group">
            <label>Notas de Cata Adicionales</label>
            <input className="candy-input" value={notes} onChange={(e) => setNotes(e.target.value)} type="text" placeholder="Ej. Fresa, chocolate, cuerpo sedoso" />
          </div>
        </div>

        {/* Sección 3 — Dosificación */}
        <div className="candy-card static" style={{ cursor: 'default' }}>
          <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '10px', textTransform: 'uppercase', margin: '0 0 12px 0', color: 'var(--color-crimson)', letterSpacing: '0.5px' }}>
            Dosificación
          </h4>
          <div className="form-row">
            <div className="form-group">
              <label>Cantidad de Tubos</label>
              <div className="mono-stepper compact">
                <button type="button" className="stepper-btn" onClick={() => setTotalDoses(d => Math.max(1, d - 1))}>-</button>
                <div className="stepper-value">{totalDoses}</div>
                <button type="button" className="stepper-btn" onClick={() => setTotalDoses(d => d + 1)}>+</button>
              </div>
            </div>
            <div className="form-group">
              <label>Gramos por Tubo</label>
              <input className="candy-input" value={doseWeight} onChange={(e) => setDoseWeight(e.target.value)} type="text" />
            </div>
          </div>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-crimson)', marginTop: '8px', textAlign: 'center' }}>
            Inventario Inicial Calculado: {(totalDoses * (parseFloat(doseWeight) || 20.0)).toFixed(0)}g
          </div>
        </div>

        <button type="submit" className="btn-candy primary" style={{ width: '100%', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Save size={18} strokeWidth={2.5} />
          {batchToEdit ? 'Guardar Cambios' : 'Crear Lote y Obtener Link'}
        </button>
      </form>

      {!batchToEdit && generatedUrl && (
        <div className="instr-box" style={{ marginTop: '14px' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '14px', marginTop: 0 }}>Enlace Único de Lote NFC</h3>
          <p style={{ fontSize: '11px', marginTop: 0 }}>Escribe este enlace en tus tags NFC usando la app "NFC Tools":</p>
          
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input className="candy-input" value={generatedUrl} readOnly style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', flex: 1, minWidth: 0 }} />
            <button type="button" className="btn-candy primary" style={{ margin: 0, flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px' }} onClick={copyUrl}>
              <ClipboardCopy size={16} strokeWidth={2.5} />
              Copiar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}