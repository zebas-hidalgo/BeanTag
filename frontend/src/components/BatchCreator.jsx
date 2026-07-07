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
  const [activeTab, setActiveTab] = useState('Floral');

  // Organized SCA Flavor Wheel Structure (Category -> Subcategory -> Descriptors)
  const scaFlavorStructure = [
    {
      category: 'Floral',
      subcategories: [
        {
          name: 'Flores',
          tags: ['Manzanilla', 'Rosa', 'Jazmín', 'Flor de café']
        },
        {
          name: 'Té',
          tags: ['Té negro', 'Té verde', 'Té de manzanilla']
        }
      ]
    },
    {
      category: 'Afrutado',
      subcategories: [
        {
          name: 'Bayas / Frutos rojos',
          tags: ['Mora', 'Frambuesa', 'Arándano', 'Fresa (Frutilla)']
        },
        {
          name: 'Cítricos',
          tags: ['Limón', 'Lima', 'Naranja', 'Pomelo (Toronja)']
        },
        {
          name: 'Fruta deshidratada',
          tags: ['Uvas pasas', 'Ciruela pasa', 'Higo seco']
        },
        {
          name: 'Otras frutas (Hueso/Tropical)',
          tags: ['Cereza', 'Manzana', 'Melocotón (Durazno)', 'Pera', 'Uva', 'Piña', 'Coco', 'Granada']
        }
      ]
    },
    {
      category: 'Dulce',
      subcategories: [
        {
          name: 'Azúcares integrales',
          tags: ['Melaza', 'Jarabe de arce', 'Caramelo', 'Miel', 'Panela']
        },
        {
          name: 'Aromas dulces',
          tags: ['Vainilla', 'Algodón de azúcar', 'Malvavisco']
        }
      ]
    },
    {
      category: 'Frutos Secos y Cacao',
      subcategories: [
        {
          name: 'Frutos secos',
          tags: ['Almendra', 'Avellana', 'Nuez', 'Nuez pecana', 'Maní (Cacahuate)']
        },
        {
          name: 'Cacao',
          tags: ['Chocolate con leche', 'Chocolate negro', 'Cacao en polvo', 'Nibs de cacao']
        }
      ]
    },
    {
      category: 'Especias',
      subcategories: [
        {
          name: 'Especias dulces',
          tags: ['Canela', 'Clavo de olor', 'Nuez moscada', 'Anís']
        },
        {
          name: 'Picantes / Salados',
          tags: ['Pimienta negra', 'Pimienta blanca', 'Curri']
        }
      ]
    },
    {
      category: 'Tostado',
      subcategories: [
        {
          name: 'Cereales',
          tags: ['Malta', 'Cebada', 'Avena', 'Grano tostado']
        },
        {
          name: 'Ahumado / Quemado',
          tags: ['Humo', 'Ceniza', 'Madera quemada', 'Acre']
        },
        {
          name: 'Tabaco',
          tags: ['Tabaco de pipa', 'Hojas secas de tabaco']
        }
      ]
    },
    {
      category: 'Verde / Vegetal',
      subcategories: [
        {
          name: 'Hierbas',
          tags: ['Hierba fresca', 'Heno', 'Menta', 'Romero']
        },
        {
          name: 'Vegetales / Crudos',
          tags: ['Vaina de guisante', 'Aceite de oliva', 'Tierra húmeda', 'Madera fresca']
        }
      ]
    },
    {
      category: 'Ácido / Fermentado',
      subcategories: [
        {
          name: 'Alcohol / Fermentado',
          tags: ['Vino tinto', 'Whiskey', 'Fruta sobremadurada (licorosa)']
        },
        {
          name: 'Ácidos (Aromáticos)',
          tags: ['Ácido cítrico', 'Ácido málico (manzana verde)', 'Ácido acético (ligero toque a vinagre)']
        }
      ]
    }
  ];

  const toggleFlavorTag = (tagLabel) => {
    const cleanLabel = stripEmojis(tagLabel);
    const hasTag = selectedFlavorTags.some(t => stripEmojis(t) === cleanLabel);
    if (hasTag) {
      setSelectedFlavorTags(selectedFlavorTags.filter(t => stripEmojis(t) !== cleanLabel));
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

          <div className="form-group" style={{ marginTop: '16px' }}>
            <label style={{ marginBottom: '12px', display: 'block', fontWeight: '900', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px', color: 'var(--color-crimson)' }}>
              Notas de Cata (Rueda de Sabores SCA)
            </label>
            
            {/* Selection Summary */}
            {selectedFlavorTags.length > 0 && (
              <div style={{ marginBottom: '12px', padding: '10px', backgroundColor: '#F8FAFC', border: '2px solid #000000', borderRadius: '6px', boxShadow: '2px 2px 0px #000000' }}>
                <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', fontWeight: 'bold', textTransform: 'uppercase', display: 'block', marginBottom: '6px', letterSpacing: '0.5px' }}>
                  Seleccionados ({selectedFlavorTags.length}):
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {selectedFlavorTags.map((tag, i) => (
                    <span key={i} style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 6px',
                      backgroundColor: 'var(--color-navy)',
                      color: '#FFFFFF',
                      border: '2px solid #000000',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 'bold'
                    }}>
                      {getScaIcon(tag, 10, 2.5)}
                      {stripEmojis(tag)}
                      <button 
                        type="button" 
                        onClick={() => toggleFlavorTag(tag)}
                        style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', padding: '0 0 0 4px', fontWeight: '900', fontSize: '10px', display: 'flex', alignItems: 'center' }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Horizontal Scrollable Tabs */}
            <div style={{ 
              display: 'flex', 
              overflowX: 'auto', 
              gap: '6px', 
              marginBottom: '12px',
              paddingBottom: '6px',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }} className="hide-scrollbar">
              {scaFlavorStructure.map((catGroup) => {
                const isActive = activeTab === catGroup.category;
                return (
                  <button
                    key={catGroup.category}
                    type="button"
                    onClick={() => setActiveTab(catGroup.category)}
                    style={{
                      padding: '6px 12px',
                      fontFamily: 'var(--font-heading)',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      border: '2px solid #000000',
                      borderRadius: '6px',
                      whiteSpace: 'nowrap',
                      backgroundColor: isActive ? 'var(--color-navy)' : '#FFFFFF',
                      color: isActive ? '#FFFFFF' : 'var(--color-navy)',
                      boxShadow: isActive ? 'none' : '2px 2px 0px #000000',
                      cursor: 'pointer',
                      transition: 'all 0.1s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {getScaIcon(catGroup.category, 11, 2.5)}
                    {catGroup.category}
                  </button>
                );
              })}
            </div>

            {/* Active Tab Panel */}
            {(() => {
              const activeCatGroup = scaFlavorStructure.find(c => c.category === activeTab);
              if (!activeCatGroup) return null;
              return (
                <div style={{
                  padding: '12px',
                  backgroundColor: '#FFFFFF',
                  border: '2px solid #000000',
                  borderRadius: '6px',
                  boxShadow: '3px 3px 0px #000000'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {activeCatGroup.subcategories.map((sub, sIdx) => (
                      <div key={sIdx} style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '6px', 
                        paddingTop: sIdx > 0 ? '8px' : '0', 
                        borderTop: sIdx > 0 ? '1px dashed #E2E8F0' : 'none' 
                      }}>
                        <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 'bold' }}>
                          {sub.name}
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {sub.tags.map((tag, tIdx) => {
                            const isSelected = selectedFlavorTags.some(t => stripEmojis(t) === tag);
                            return (
                              <button
                                key={tIdx}
                                type="button"
                                style={{
                                  padding: '5px 8px',
                                  fontFamily: 'var(--font-heading)',
                                  fontSize: '11px',
                                  border: '2px solid #000000',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  backgroundColor: isSelected ? 'var(--color-navy)' : '#FFFFFF',
                                  color: isSelected ? '#FFFFFF' : 'var(--color-navy)',
                                  boxShadow: isSelected ? 'none' : '1.5px 1.5px 0px #000000',
                                  transition: 'all 0.1s ease',
                                  fontWeight: 'bold',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                                onClick={() => toggleFlavorTag(tag)}
                              >
                                {getScaIcon(tag, 11, 2.5)}
                                {tag}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
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