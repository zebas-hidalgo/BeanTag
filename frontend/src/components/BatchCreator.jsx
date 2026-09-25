import React, { useState, useRef } from 'react';
import { Save, X, ClipboardCopy, Camera, Sparkles, Loader2 } from 'lucide-react';
import { getScaIcon, stripEmojis, getScaColorForNote } from '../utils/scaIcons';
import { apiUrl } from '../utils/api';

export default function BatchCreator({ batchToEdit, onBatchCreated, onBack, onCancel, showToast }) {
  const handleCancel = onBack || onCancel;
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
  const [creatorStep, setCreatorStep] = useState(1);

  // Organized Official SCA / World Coffee Research (WCR) Flavor Wheel Structure (9 Main Categories)
  const scaFlavorStructure = [
    {
      category: 'Floral',
      subcategories: [
        {
          name: 'Flores',
          tags: ['Manzanilla', 'Rosa', 'Jazmín', 'Flor de café', 'Lavanda', 'Hibisco']
        },
        {
          name: 'Té',
          tags: ['Té negro', 'Té verde', 'Té de manzanilla', 'Bergamota / Earl Grey']
        }
      ]
    },
    {
      category: 'Afrutado',
      subcategories: [
        {
          name: 'Bayas / Frutos rojos',
          tags: ['Mora', 'Frambuesa', 'Arándano', 'Fresa (Frutilla)', 'Grosella negra', 'Cereza silvestre']
        },
        {
          name: 'Cítricos',
          tags: ['Limón', 'Lima', 'Naranja', 'Mandarina', 'Pomelo (Toronja)', 'Bergamota']
        },
        {
          name: 'Fruta deshidratada',
          tags: ['Uvas pasas', 'Ciruela pasa', 'Higo seco', 'Dátil']
        },
        {
          name: 'Frutas de Hueso (Carozo)',
          tags: ['Melocotón (Durazno)', 'Albaricoque (Damasco)', 'Ciruela', 'Cereza']
        },
        {
          name: 'Frutas Tropicales',
          tags: ['Mango', 'Maracuyá (Parchita)', 'Papaya', 'Piña', 'Guayaba', 'Lichi', 'Coco']
        },
        {
          name: 'Otras Frutas',
          tags: ['Manzana roja', 'Manzana verde', 'Pera', 'Uva verde', 'Uva negra', 'Granada']
        }
      ]
    },
    {
      category: 'Dulce',
      subcategories: [
        {
          name: 'Azúcares integrales',
          tags: ['Melaza', 'Jarabe de arce (Maple)', 'Caramelo', 'Miel de abejas', 'Panela / Chancaca', 'Azúcar moreno', 'Mascabado']
        },
        {
          name: 'Aromas dulces & Confitería',
          tags: ['Vainilla', 'Algodón de azúcar', 'Malvavisco (Marshmallow)', 'Dulce de leche (Arequipe)', 'Turrón']
        }
      ]
    },
    {
      category: 'Frutos Secos y Cacao',
      subcategories: [
        {
          name: 'Frutos secos',
          tags: ['Almendra', 'Avellana', 'Nuez', 'Nuez pecana', 'Anacardo (Castaña de cajú)', 'Pistacho', 'Macadamia', 'Maní (Cacahuate)']
        },
        {
          name: 'Cacao & Chocolate',
          tags: ['Chocolate con leche', 'Chocolate negro (70%+)', 'Cacao en polvo', 'Nibs de cacao', 'Licor de cacao', 'Manteca de cacao']
        }
      ]
    },
    {
      category: 'Especias',
      subcategories: [
        {
          name: 'Especias dulces',
          tags: ['Canela', 'Clavo de olor', 'Nuez moscada', 'Anís estrellado', 'Cardamomo']
        },
        {
          name: 'Picantes / Aromáticos',
          tags: ['Pimienta negra', 'Pimienta blanca', 'Jengibre', 'Curri']
        }
      ]
    },
    {
      category: 'Tostado',
      subcategories: [
        {
          name: 'Cereales',
          tags: ['Malta', 'Cebada', 'Avena', 'Pan tostado', 'Grano tostado', 'Galleta graham']
        },
        {
          name: 'Ahumado / Quemado',
          tags: ['Humo de leña', 'Ceniza', 'Madera quemada', 'Carbón', 'Acre']
        },
        {
          name: 'Tabaco & Cuero',
          tags: ['Tabaco de pipa', 'Hojas secas de tabaco', 'Cuero']
        }
      ]
    },
    {
      category: 'Verde / Vegetal',
      subcategories: [
        {
          name: 'Hierbas & Botánicos',
          tags: ['Hierba fresca cortada', 'Heno', 'Menta', 'Eucalipto', 'Romero', 'Salvia', 'Lúpulo']
        },
        {
          name: 'Vegetales',
          tags: ['Vaina de guisante (Arveja)', 'Aceite de oliva', 'Alcachofa']
        },
        {
          name: 'Tierra & Madera',
          tags: ['Tierra húmeda', 'Madera fresca', 'Cedro', 'Musgo']
        }
      ]
    },
    {
      category: 'Ácido / Fermentado',
      subcategories: [
        {
          name: 'Alcohol & Fermentaciones',
          tags: ['Vino tinto', 'Vino blanco', 'Champagne', 'Whiskey / Bourbon', 'Ron', 'Kombucha', 'Fruta licorosa (Sobremadurada)']
        },
        {
          name: 'Ácidos Aromáticos',
          tags: ['Ácido cítrico', 'Ácido málico (Manzana verde)', 'Ácido acético (Vinagre)', 'Ácido láctico (Yogur / Queso suave)', 'Ácido fosfórico']
        }
      ]
    },
    {
      category: 'Defectos / Desviaciones SCA',
      subcategories: [
        {
          name: 'Papel & Madera Rancia',
          tags: ['Cartón húmedo', 'Papel de filtro', 'Madera rancia']
        },
        {
          name: 'Químico & Medicamento',
          tags: ['Medicamento / Fenol', 'Caucho / Goma quemada', 'Petróleo / Queroseno']
        },
        {
          name: 'Humos & Mohos',
          tags: ['Moho / Enmohecido', 'Sucio / Polvo', 'Tierra seca']
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

    const url = batchToEdit ? apiUrl(`api/batches/${batchToEdit.id}`) : apiUrl('api/batches');
    const method = batchToEdit ? 'PUT' : 'POST';

    // If creating, send the ID in the payload
    if (!batchToEdit) {
      payload.id = id;
    }

    const token = localStorage.getItem('beantag-token');
    const headers = { 
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    fetch(url, {
      method,
      headers,
      body: JSON.stringify(payload)
    })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al guardar el lote');
      }
      return data;
    })
    .then(data => {
      if (data.success) {
        if (batchToEdit) {
          showToast('Lote actualizado con éxito.', { type: 'success', duration: 2500 });
        } else {
          const host = window.location.origin;
          setGeneratedUrl(`${host}/beantag/?batch=${encodeURIComponent(id)}&action=new_brew`);
          showToast('Lote creado con éxito.', { type: 'success', duration: 2500 });
        }
        if (onBatchCreated) onBatchCreated();
      }
    })
    .catch(err => {
      if (showToast) showToast(err.message, { type: 'error', duration: 4000 });
    });
  };

  const fileInputRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);

  const handleImageSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const apiKey = localStorage.getItem('gemini-api-key');
    if (!apiKey) {
      if (showToast) showToast('Configura tu clave API de Gemini en Ajustes para usar el escáner.', { type: 'error', duration: 4000 });
      return;
    }

    const model = localStorage.getItem('gemini-model') || 'gemini-3.6-flash';
    const isThinking = localStorage.getItem('gemini-thinking') === 'true';

    setIsScanning(true);
    if (showToast) showToast('Analizando bolsa de café con Gemini Vision...', { type: 'info', duration: 3000 });

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result;
        try {
          const res = await fetch(apiUrl('api/ai/scan-bag'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-gemini-key': apiKey,
              'x-gemini-model': model,
              'x-gemini-thinking': isThinking ? 'true' : 'false'
            },
            body: JSON.stringify({
              imageBase64: base64Data,
              mimeType: file.type || 'image/jpeg'
            })
          });

          const data = await res.json();
          if (data.error) {
            if (showToast) showToast(`Error al escanear: ${data.error}`, { type: 'error', duration: 4000 });
            return;
          }

          // Autopopulate fields from Gemini Vision
          if (data.name) setName(data.name);
          if (data.producer) setProducer(data.producer);
          if (data.origin) setOrigin(data.origin);
          if (data.altitude) setAltitude(data.altitude);
          if (data.variety) setVariety(data.variety);
          if (data.process) setProcess(data.process);
          if (data.roaster) setRoaster(data.roaster);
          if (data.roast_level) setRoastLevel(data.roast_level);
          if (data.roast_date) setRoastDate(data.roast_date);
          if (data.roaster_notes) setNotes(data.roaster_notes);
          if (data.sca_flavor_tags && Array.isArray(data.sca_flavor_tags)) {
            setSelectedFlavorTags(data.sca_flavor_tags);
          }

          if (showToast) showToast('¡Bolsa escaneada y datos extraídos con éxito! ☕📸', { type: 'success', duration: 3500 });
        } catch (err) {
          if (showToast) showToast('Error al conectar con Gemini.', { type: 'error', duration: 3500 });
        } finally {
          setIsScanning(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setIsScanning(false);
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(generatedUrl);
    showToast('Enlace copiado al portapapeles.', { type: 'success', duration: 2000 });
  };

  return (
    <div style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
      {/* Hidden File/Camera Input */}
      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        ref={fileInputRef} 
        onChange={handleImageSelected} 
        style={{ display: 'none' }} 
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <button 
          className="btn-candy" 
          onClick={handleCancel} 
          aria-label="Cancelar y volver"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', minHeight: '44px', padding: '10px 16px', fontSize: '13px' }}
        >
          <X size={18} strokeWidth={2.5} />
          Cancelar
        </button>

        {/* Gemini Camera Scan Trigger */}
        {!batchToEdit && (
          <button 
            type="button" 
            className="btn-candy primary" 
            disabled={isScanning}
            aria-label="Escanear bolsa de café con cámara"
            onClick={() => fileInputRef.current && fileInputRef.current.click()} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              margin: 0, 
              fontSize: '13px', 
              minHeight: '44px',
              padding: '10px 16px',
              backgroundColor: 'var(--color-crimson)',
              fontWeight: 'bold'
            }}
          >
            {isScanning ? <Loader2 size={16} className="spin" /> : <Camera size={16} />}
            <span>{isScanning ? 'Escaneando...' : 'Escanear Bolsa (IA)'}</span>
          </button>
        )}
      </div>

      <h2 style={{ fontFamily: 'var(--font-heading)', textTransform: 'uppercase', margin: '0 0 16px 0', fontSize: '18px' }}>
        {batchToEdit ? 'Editar Lote' : 'Registrar Lote'}
      </h2>

      {/* Step Navigation */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: 'var(--segmented-bg, rgba(120, 120, 128, 0.12))', borderRadius: '10px', padding: '3px' }}>
        {[{ id: 1, label: '1. Identidad' }, { id: 2, label: '2. Tueste' }, { id: 3, label: '3. Cata & Dosis' }].map(step => (
          <button
            key={step.id}
            type="button"
            onClick={() => setCreatorStep(step.id)}
            aria-label={`Paso ${step.id}: ${step.label}`}
            style={{
              flex: 1,
              padding: '8px 4px',
              minHeight: '36px',
              fontSize: '11px',
              fontWeight: creatorStep === step.id ? '800' : '600',
              fontFamily: 'var(--font-heading)',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              background: creatorStep === step.id ? 'var(--segmented-active, #FFFFFF)' : 'transparent',
              color: creatorStep === step.id ? 'var(--color-crimson)' : 'var(--color-text-muted)',
              boxShadow: creatorStep === step.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            {step.label}
          </button>
        ))}
      </div>
      
      <form onSubmit={handleSubmit}>
        {/* Sección 1 — Identidad del Café */}
        {creatorStep === 1 && (
          <div className="candy-card static" style={{ cursor: 'default', marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '12px', textTransform: 'uppercase', margin: 0, color: 'var(--color-crimson)', letterSpacing: '0.5px' }}>
                Identidad del Café
              </h4>
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 'bold' }}>
                Gemini Vision OCR
              </span>
            </div>
            <div className="form-group">
              <label className="barista-label">Nombre del Café</label>
              <input className="candy-input" value={name} onChange={(e) => setName(e.target.value)} type="text" required placeholder="Ej. Pink Bourbon" style={{ minHeight: '44px', fontSize: '13px' }} />
            </div>
            
            <div className="form-group">
              <label className="barista-label">Productor / Finca</label>
              <input className="candy-input" value={producer} onChange={(e) => setProducer(e.target.value)} type="text" required placeholder="Ej. Nestor Lasso / El Diviso" style={{ minHeight: '44px', fontSize: '13px' }} />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="barista-label">Origen</label>
                <input className="candy-input" value={origin} onChange={(e) => setOrigin(e.target.value)} type="text" placeholder="Ej. Colombia" style={{ minHeight: '44px', fontSize: '13px' }} />
              </div>
              <div className="form-group">
                <label className="barista-label">Varietal</label>
                <input className="candy-input" value={variety} onChange={(e) => setVariety(e.target.value)} type="text" placeholder="Ej. Bourbon" style={{ minHeight: '44px', fontSize: '13px' }} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="barista-label">Altitud</label>
                <input className="candy-input" value={altitude} onChange={(e) => setAltitude(e.target.value)} type="text" placeholder="Ej. 1800 msnm" style={{ minHeight: '44px', fontSize: '13px' }} />
              </div>
              <div className="form-group">
                <label className="barista-label">Proceso</label>
                <input className="candy-input" value={process} onChange={(e) => setProcess(e.target.value)} type="text" placeholder="Ej. Anaeróbico" style={{ minHeight: '44px', fontSize: '13px' }} />
              </div>
            </div>
          </div>
        )}

        {/* Sección 2 — Perfil de Tueste */}
        {creatorStep === 2 && (
          <div className="candy-card static" style={{ cursor: 'default', marginBottom: '14px' }}>
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '12px', textTransform: 'uppercase', margin: '0 0 14px 0', color: 'var(--color-crimson)', letterSpacing: '0.5px' }}>
              Perfil de Tueste
            </h4>
            <div className="form-row">
              <div className="form-group">
                <label className="barista-label">Tostador</label>
                <input className="candy-input" value={roaster} onChange={(e) => setRoaster(e.target.value)} type="text" placeholder="Ej. Coffee Circular" style={{ minHeight: '44px', fontSize: '13px' }} />
              </div>
              <div className="form-group">
                <label className="barista-label">Tueste</label>
                <select className="candy-input" value={roastLevel} onChange={(e) => setRoastLevel(e.target.value)} style={{ minHeight: '44px', fontSize: '13px' }}>
                  <option value="Claro">Claro</option>
                  <option value="Medio">Medio</option>
                  <option value="Oscuro">Oscuro</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="barista-label">Fecha de Tueste</label>
                <input className="candy-input" value={roastDate} onChange={(e) => setRoastDate(e.target.value)} type="date" style={{ minHeight: '44px', fontSize: '13px' }} />
              </div>
              <div className="form-group">
                <label className="barista-label">Fecha de Congelado</label>
                <input className="candy-input" value={freezeDate} onChange={(e) => setFreezeDate(e.target.value)} type="date" style={{ minHeight: '44px', fontSize: '13px' }} />
              </div>
            </div>
          </div>
        )}

        {creatorStep === 3 && (
          <>
            {/* Sección 3 — Cata & Dosis */}
            <div className="candy-card static" style={{ cursor: 'default', marginBottom: '14px' }}>
              <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '12px', textTransform: 'uppercase', margin: '0 0 14px 0', color: 'var(--color-crimson)', letterSpacing: '0.5px' }}>
                Notas de Cata
              </h4>
              <div className="form-group" style={{ marginTop: '0px' }}>
                <label className="barista-label" style={{ marginBottom: '12px' }}>
                  Rueda de Sabores SCA
                </label>
                
                {/* Selection Summary */}
                {selectedFlavorTags.length > 0 && (
                  <div style={{ marginBottom: '14px', padding: '12px', backgroundColor: 'var(--barista-bg-surface, var(--bg-card))', border: '1.5px solid var(--barista-border-hairline, var(--border-color))', borderRadius: '10px', boxShadow: 'var(--barista-shadow-card)' }}>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 'bold', textTransform: 'uppercase', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>
                      Seleccionados ({selectedFlavorTags.length}):
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {(Array.isArray(selectedFlavorTags) ? selectedFlavorTags : []).map((tag, i) => {
                        const colors = getScaColorForNote(tag);
                        return (
                          <span key={i} style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 10px',
                            backgroundColor: colors.bg,
                            color: colors.text,
                            border: `1.5px solid ${colors.border}`,
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '800'
                          }}>
                            {getScaIcon(tag, 13, 2.5)}
                            {stripEmojis(tag)}
                            <button 
                              type="button" 
                              aria-label={`Quitar nota ${stripEmojis(tag)}`}
                              onClick={() => toggleFlavorTag(tag)}
                              style={{ background: 'none', border: 'none', color: colors.text, cursor: 'pointer', padding: '0 0 0 4px', fontWeight: '900', fontSize: '14px', display: 'flex', alignItems: 'center', minWidth: '24px', minHeight: '24px', justifyContent: 'center' }}
                            >
                              ×
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Horizontal Scrollable Tabs */}
                <div style={{ 
                  display: 'flex', 
                  overflowX: 'auto', 
                  overscrollBehaviorX: 'contain',
                  WebkitOverflowScrolling: 'touch',
                  width: '100%',
                  boxSizing: 'border-box',
                  gap: '8px', 
                  marginBottom: '14px', 
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
                          padding: '10px 16px',
                          minHeight: '44px',
                          fontFamily: 'var(--font-heading)',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          border: isActive ? '2px solid var(--color-crimson)' : '1.5px solid var(--border-color)',
                          borderRadius: '10px',
                          whiteSpace: 'nowrap',
                          backgroundColor: isActive ? 'var(--bg-header)' : 'var(--bg-card)',
                          color: 'var(--color-text)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        {getScaIcon(catGroup.category, 14, 2.5)}
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
                      padding: '14px',
                      backgroundColor: 'var(--barista-bg-surface, var(--bg-card))',
                      border: '1.5px solid var(--barista-border-hairline, var(--border-color))',
                      borderRadius: '12px'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {activeCatGroup.subcategories.map((sub, sIdx) => (
                          <div key={sIdx} style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '8px', 
                            paddingTop: sIdx > 0 ? '10px' : '0', 
                            borderTop: sIdx > 0 ? '1px dashed var(--border-color)' : 'none' 
                          }}>
                            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 'bold' }}>
                              {sub.name}
                            </span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                              {sub.tags.map((tag, tIdx) => {
                                const isSelected = selectedFlavorTags.some(t => stripEmojis(t) === tag);
                                const colors = getScaColorForNote(tag);
                                return (
                                  <button
                                    key={tIdx}
                                    type="button"
                                    style={{
                                      padding: '8px 12px',
                                      minHeight: '40px',
                                      fontFamily: 'var(--font-heading)',
                                      fontSize: '12px',
                                      border: isSelected ? `2px solid ${colors.border}` : '1.5px solid var(--border-color)',
                                      borderRadius: '8px',
                                      cursor: 'pointer',
                                      backgroundColor: isSelected ? colors.bg : 'var(--bg-card)',
                                      color: isSelected ? colors.text : 'var(--color-text)',
                                      transition: 'all 0.15s ease',
                                      fontWeight: '800',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '6px'
                                    }}
                                    onClick={() => toggleFlavorTag(tag)}
                                  >
                                    {getScaIcon(tag, 13, 2.5)}
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
                <label className="barista-label">Notas de Cata Adicionales</label>
                <input className="candy-input" value={notes} onChange={(e) => setNotes(e.target.value)} type="text" placeholder="Ej. Fresa, chocolate, cuerpo sedoso" style={{ minHeight: '44px', fontSize: '13px' }} />
              </div>
            </div>

            <div className="candy-card static" style={{ cursor: 'default', marginBottom: '14px' }}>
              <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '12px', textTransform: 'uppercase', margin: '0 0 14px 0', color: 'var(--color-crimson)', letterSpacing: '0.5px' }}>
                Dosificación
              </h4>
              <div className="form-row">
                <div className="form-group">
                  <label className="barista-label">Cantidad de Tubos</label>
                  <div className="mono-stepper compact" style={{ minHeight: '44px' }}>
                    <button type="button" className="stepper-btn" aria-label="Reducir cantidad de tubos" style={{ minHeight: '44px', minWidth: '44px', fontSize: '18px' }} onClick={() => setTotalDoses(d => Math.max(1, d - 1))}>-</button>
                    <div className="stepper-value" style={{ fontSize: '15px', fontWeight: 'bold' }}>{totalDoses}</div>
                    <button type="button" className="stepper-btn" aria-label="Añadir tubo" style={{ minHeight: '44px', minWidth: '44px', fontSize: '18px' }} onClick={() => setTotalDoses(d => d + 1)}>+</button>
                  </div>
                </div>
                <div className="form-group">
                  <label className="barista-label">Gramos por Tubo</label>
                  <input className="candy-input" value={doseWeight} onChange={(e) => setDoseWeight(e.target.value)} type="text" inputMode="decimal" style={{ minHeight: '44px', fontSize: '13px' }} />
                </div>
              </div>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-crimson)', marginTop: '10px', textAlign: 'center' }}>
                Inventario Inicial Calculado: {(totalDoses * (parseFloat(doseWeight) || 20.0)).toFixed(0)}g
              </div>
            </div>
          </>
        )}

        {/* Step Navigation Buttons */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          {creatorStep > 1 && (
            <button type="button" className="btn-candy" onClick={() => setCreatorStep(s => s - 1)} style={{ flex: 1, minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              ← Anterior
            </button>
          )}
          {creatorStep < 3 && (
            <button type="button" className="btn-candy primary" onClick={() => setCreatorStep(s => s + 1)} style={{ flex: 1, minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              Siguiente →
            </button>
          )}
        </div>

        <button type="submit" className="btn-candy primary" style={{ width: '100%', minHeight: '48px', marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '15px', fontWeight: 'bold' }}>
          <Save size={20} strokeWidth={2.5} />
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