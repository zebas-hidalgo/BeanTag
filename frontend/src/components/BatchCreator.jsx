import React, { useState, useRef } from 'react';
import { Save, X, ClipboardCopy, Camera, Sparkles, Loader2, Key } from 'lucide-react';
import { getScaIcon, stripEmojis, getScaColorForNote } from '../utils/scaIcons';
import { apiUrl } from '../utils/api';
import { compressImageForOcr } from '../utils/imageCompressor';

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
  const [storageType, setStorageType] = useState(batchToEdit ? (batchToEdit.storage_type || 'tubes') : 'tubes');
  const [bagWeight, setBagWeight] = useState(batchToEdit ? (batchToEdit.total_weight_g || 250) : 250);
  const [remainingBagWeight, setRemainingBagWeight] = useState(
    batchToEdit ? (batchToEdit.remaining_weight_g !== null && batchToEdit.remaining_weight_g !== undefined ? batchToEdit.remaining_weight_g : batchToEdit.total_weight_g || 250) : 250
  );
  const [generatedUrl, setGeneratedUrl] = useState('');
  
  const [origin, setOrigin] = useState(batchToEdit ? batchToEdit.origin || '' : '');
  const [roastLevel, setRoastLevel] = useState(batchToEdit ? batchToEdit.roast_level || 'Medio' : 'Medio');
  const [roastDate, setRoastDate] = useState(batchToEdit ? batchToEdit.roast_date || '' : '');
  const [freezeDate, setFreezeDate] = useState(batchToEdit ? batchToEdit.freeze_date || '' : '');
  const [scaScore, setScaScore] = useState(batchToEdit ? (batchToEdit.sca_score !== null && batchToEdit.sca_score !== undefined ? String(batchToEdit.sca_score) : '') : '');
  const [selectedFlavorTags, setSelectedFlavorTags] = useState(getInitialFlavorTags());
  const [activeTab, setActiveTab] = useState('Floral');

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

    const doseWeightNum = parseFloat(doseWeight) || (storageType === 'bag' ? 18.0 : 20.0);
    const totalWeightNum = storageType === 'bag' ? (parseFloat(bagWeight) || 250.0) : (parseInt(totalDoses, 10) * doseWeightNum);
    const calculatedDoses = storageType === 'bag' ? Math.max(1, Math.round(totalWeightNum / doseWeightNum)) : parseInt(totalDoses, 10);

    const payload = {
      name, producer, altitude, variety, process, roaster, roaster_notes: combinedNotes,
      dose_weight: `${doseWeightNum.toFixed(1)}g`,
      total_doses: calculatedDoses,
      total_weight_g: totalWeightNum,
      storage_type: storageType,
      origin, roast_level: roastLevel, roast_date: roastDate, freeze_date: freezeDate,
      sca_score: scaScore ? parseFloat(scaScore) : null
    };

    if (batchToEdit && storageType === 'bag') {
      const remNum = parseFloat(remainingBagWeight);
      if (!isNaN(remNum) && remNum >= 0) {
        payload.remaining_weight_g = remNum;
        payload.remaining_doses = Math.max(0, Math.round(remNum / doseWeightNum));
      }
    }

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
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');
  const [pendingScanFile, setPendingScanFile] = useState(null);

  const handleTriggerScan = () => {
    const aiProvider = localStorage.getItem('beantag-ai-provider') || 'groq';
    const groqKey = localStorage.getItem('groq-key') || '';
    const geminiKey = localStorage.getItem('gemini-api-key') || '';
    const activeKey = aiProvider === 'groq' ? groqKey : geminiKey;
    if (!activeKey) {
      setShowApiKeyModal(true);
      return;
    }
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const processBagScan = async (file, currentApiKey) => {
    const aiProvider = localStorage.getItem('beantag-ai-provider') || 'groq';
    const groqKey = (aiProvider === 'groq' && currentApiKey) ? currentApiKey : (localStorage.getItem('groq-key') || '');
    const geminiKey = (aiProvider === 'gemini' && currentApiKey) ? currentApiKey : (localStorage.getItem('gemini-api-key') || '');
    const activeKey = aiProvider === 'groq' ? groqKey : geminiKey;
    if (!activeKey) {
      setPendingScanFile(file);
      setShowApiKeyModal(true);
      return;
    }

    const geminiModel = localStorage.getItem('gemini-model') || 'gemini-3.8-flash';
    const isThinking = localStorage.getItem('gemini-thinking') === 'true';

    setIsScanning(true);
    if (showToast) showToast(`Optimizando imagen y analizando bolsa con ${aiProvider === 'groq' ? 'Groq Vision (Qwen 3.8)' : 'Gemini Vision'}...`, { type: 'info', duration: 3000 });

    try {
      // 1. High-speed client-side canvas compression (~250KB JPEG, keeping text razor sharp)
      const compressed = await compressImageForOcr(file, 1600, 0.85);

      // 2. Multimodal OCR API Call
      const res = await fetch(apiUrl('api/ai/scan-bag'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-ai-provider': aiProvider,
          'x-groq-key': groqKey,
          'x-gemini-key': geminiKey,
          'x-ai-model': aiProvider === 'groq' ? 'qwen/qwen3.8-27b' : geminiModel,
          'x-gemini-model': geminiModel,
          'x-gemini-thinking': isThinking ? 'true' : 'false'
        },
        body: JSON.stringify({
          imageBase64: compressed.base64Data,
          mimeType: compressed.mimeType || 'image/jpeg'
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        const errorMsg = data.error || `Error ${res.status}: no fue posible analizar la imagen`;
        if (showToast) showToast(`Error al escanear: ${errorMsg}`, { type: 'error', duration: 4000 });
        return;
      }

      // Autopopulate fields from Vision AI
      if (data.name) setName(data.name);
      if (data.producer) setProducer(data.producer);
      if (data.origin) setOrigin(data.origin);
      if (data.altitude) setAltitude(data.altitude);
      if (data.variety) setVariety(data.variety);
      if (data.process) setProcess(data.process);
      if (data.roaster) setRoaster(data.roaster);
      if (data.roast_level) setRoastLevel(data.roast_level);
      if (data.roast_date) setRoastDate(data.roast_date);
      if (data.sca_score) setScaScore(String(data.sca_score));
      if (data.roaster_notes) setNotes(data.roaster_notes);
      if (data.sca_flavor_tags && Array.isArray(data.sca_flavor_tags)) {
        setSelectedFlavorTags(data.sca_flavor_tags);
      }

      if (showToast) showToast('¡Bolsa escaneada y datos extraídos con éxito! ', { type: 'success', duration: 3500 });
    } catch (err) {
      console.error('OCR Error:', err);
      if (showToast) showToast(`Error al procesar: ${err.message || 'Error de conexión'}`, { type: 'error', duration: 3500 });
    } finally {
      setIsScanning(false);
      setPendingScanFile(null);
    }
  };

  const handleImageSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const aiProvider = localStorage.getItem('beantag-ai-provider') || 'groq';
    const groqKey = localStorage.getItem('groq-key') || '';
    const geminiKey = localStorage.getItem('gemini-api-key') || '';
    const activeKey = aiProvider === 'groq' ? groqKey : geminiKey;
    if (!activeKey) {
      setPendingScanFile(file);
      setShowApiKeyModal(true);
      return;
    }

    await processBagScan(file, activeKey);
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(generatedUrl);
    showToast('Enlace copiado al portapapeles.', { type: 'success', duration: 2000 });
  };

  return (
    <div style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
      {/* Hidden File/Camera Input (no capture lock to support both camera and album) */}
      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        onChange={handleImageSelected} 
        onClick={(e) => { e.target.value = null; }}
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
            onClick={handleTriggerScan} 
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

      <h2 className="bt-page-title">
        {batchToEdit ? 'Editar café' : 'Nuevo café'}
      </h2>

      <form onSubmit={handleSubmit}>
        {/* KISS: lo básico a la vista, el resto plegado */}
        <div className="candy-card static" style={{ cursor: 'default', marginBottom: '14px' }}>
          <h4 className="bt-section-title" style={{ margin: '0 0 14px' }}>Lo básico</h4>
          <div className="form-group">
              <label htmlFor="bt-batchcreator-1" className="barista-label">Nombre del Café</label>
              <input id="bt-batchcreator-1" aria-label="Nombre del Café" className="candy-input" value={name} onChange={(e) => setName(e.target.value)} type="text" required placeholder="Ej. Pink Bourbon" style={{ minHeight: '44px', fontSize: '13px' }} />
            </div>
          <div className="form-row">
            <div className="form-group">
                <label htmlFor="bt-batchcreator-3" className="barista-label">Origen</label>
                <input id="bt-batchcreator-3" aria-label="Origen" className="candy-input" value={origin} onChange={(e) => setOrigin(e.target.value)} type="text" placeholder="Ej. Colombia" style={{ minHeight: '44px', fontSize: '13px' }} />
              </div>
            <div className="form-group">
                <label htmlFor="bt-batchcreator-8" className="barista-label">Tueste</label>
                <select id="bt-batchcreator-8" aria-label="Tueste" className="candy-input" value={roastLevel} onChange={(e) => setRoastLevel(e.target.value)} style={{ minHeight: '44px', fontSize: '13px' }}>
                  <option value="Claro">Claro</option>
                  <option value="Medio">Medio</option>
                  <option value="Oscuro">Oscuro</option>
                </select>
              </div>
          </div>
          <div className="form-group">
                <label htmlFor="bt-batchcreator-9" className="barista-label">Fecha de Tueste</label>
                <input id="bt-batchcreator-9" aria-label="Fecha de Tueste" className="candy-input" value={roastDate} onChange={(e) => setRoastDate(e.target.value)} type="date" style={{ minHeight: '44px', fontSize: '13px' }} />
              </div>
        </div>

        <div className="candy-card static" style={{ cursor: 'default', marginBottom: '14px' }}>
              <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '12px', textTransform: 'uppercase', margin: '0 0 10px 0', color: 'var(--color-crimson)', letterSpacing: '0.5px' }}>
                Formato de Almacenamiento
              </h4>

              {/* Segmented Selector: Tubos vs Bolsa */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                <button
                  type="button"
                  onClick={() => setStorageType('tubes')}
                  className={`btn-candy ${storageType === 'tubes' ? 'primary' : ''}`}
                  style={{ minHeight: '40px', padding: '8px', fontSize: '13px', fontWeight: 'bold' }}
                >
                  Tubos
                </button>
                <button
                  type="button"
                  onClick={() => setStorageType('bag')}
                  className={`btn-candy ${storageType === 'bag' ? 'primary' : ''}`}
                  style={{ minHeight: '40px', padding: '8px', fontSize: '13px', fontWeight: 'bold' }}
                >
                  Bolsa
                </button>
              </div>

              {storageType === 'tubes' ? (
                <>
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
                      <label htmlFor="bt-batchcreator-13" className="barista-label">Gramos por Tubo</label>
                      <input id="bt-batchcreator-13" aria-label="Gramos por Tubo" className="candy-input" value={doseWeight} onChange={(e) => setDoseWeight(e.target.value)} type="text" inputMode="decimal" style={{ minHeight: '44px', fontSize: '13px' }} />
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-crimson)', marginTop: '10px', textAlign: 'center' }}>
                    Inventario Inicial: {(totalDoses * (parseFloat(doseWeight) || 20.0)).toFixed(0)}g en {totalDoses} tubos
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label htmlFor="bt-batchcreator-bag" className="barista-label">Peso Inicial de la Bolsa (g)</label>
                    <input
                      id="bt-batchcreator-bag"
                      aria-label="Peso Inicial de la Bolsa (g)"
                      className="candy-input"
                      value={bagWeight}
                      onChange={(e) => setBagWeight(e.target.value)}
                      type="number"
                      inputMode="decimal"
                      style={{ minHeight: '44px', fontSize: '15px', fontWeight: 'bold' }}
                    />
                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                      {[100, 250, 500, 1000].map(preset => (
                        <button
                          key={preset}
                          type="button"
                          className="btn-candy"
                          onClick={() => setBagWeight(preset)}
                          style={{
                            padding: '4px 10px',
                            minHeight: '30px',
                            fontSize: '11px',
                            fontWeight: '700',
                            borderColor: Number(bagWeight) === preset ? 'var(--color-crimson)' : undefined
                          }}
                        >
                          {preset >= 1000 ? `${preset / 1000} kg` : `${preset}g`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {batchToEdit && (
                    <div className="form-group" style={{ marginBottom: '10px' }}>
                      <label htmlFor="bt-batchcreator-rem-bag" className="barista-label">Stock Actual Restante en Bolsa (g)</label>
                      <input
                        id="bt-batchcreator-rem-bag"
                        aria-label="Stock Actual Restante en Bolsa (g)"
                        className="candy-input"
                        value={remainingBagWeight}
                        onChange={(e) => setRemainingBagWeight(e.target.value)}
                        type="number"
                        inputMode="decimal"
                        style={{ minHeight: '44px', fontSize: '15px', fontWeight: 'bold' }}
                      />
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                        Ajusta este valor si pesaste la bolsa en tu balanza para calibrar el stock exacto.
                      </div>
                    </div>
                  )}
                  <div className="form-group" style={{ marginBottom: '6px' }}>
                    <label htmlFor="bt-batchcreator-dose" className="barista-label">Dosis Habitual por Extracción (g)</label>
                    <input
                      id="bt-batchcreator-dose"
                      aria-label="Dosis Habitual (g)"
                      className="candy-input"
                      value={doseWeight}
                      onChange={(e) => setDoseWeight(e.target.value)}
                      type="text"
                      inputMode="decimal"
                      placeholder="18.0g"
                      style={{ minHeight: '44px', fontSize: '13px' }}
                    />
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-crimson)', marginTop: '10px', textAlign: 'center' }}>
                    Inventario Inicial: {bagWeight}g (~{Math.floor((parseFloat(bagWeight) || 0) / (parseFloat(doseWeight) || 18.0))} extracciones estimadas)
                  </div>
                </>
              )}
            </div>

        <details className="bt-more candy-card static" style={{ cursor: 'default', marginBottom: '14px' }}>
          <summary>Más detalles (opcional)</summary>
          <div style={{ paddingTop: '8px' }}>
            <div className="form-row">
              <div className="form-group">
              <label htmlFor="bt-batchcreator-2" className="barista-label">Productor / Finca</label>
              <input id="bt-batchcreator-2" aria-label="Productor / Finca" className="candy-input" value={producer} onChange={(e) => setProducer(e.target.value)} type="text" required placeholder="Ej. Nestor Lasso / El Diviso" style={{ minHeight: '44px', fontSize: '13px' }} />
            </div>
              <div className="form-group">
                <label htmlFor="bt-batchcreator-7" className="barista-label">Tostador</label>
                <input id="bt-batchcreator-7" aria-label="Tostador" className="candy-input" value={roaster} onChange={(e) => setRoaster(e.target.value)} type="text" placeholder="Ej. Coffee Circular" style={{ minHeight: '44px', fontSize: '13px' }} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="bt-batchcreator-4" className="barista-label">Varietal</label>
                <input id="bt-batchcreator-4" aria-label="Varietal" className="candy-input" value={variety} onChange={(e) => setVariety(e.target.value)} type="text" placeholder="Ej. Bourbon" style={{ minHeight: '44px', fontSize: '13px' }} />
              </div>
              <div className="form-group">
                <label htmlFor="bt-batchcreator-6" className="barista-label">Proceso</label>
                <input id="bt-batchcreator-6" aria-label="Proceso" className="candy-input" value={process} onChange={(e) => setProcess(e.target.value)} type="text" placeholder="Ej. Anaeróbico" style={{ minHeight: '44px', fontSize: '13px' }} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="bt-batchcreator-5" className="barista-label">Altitud</label>
                <input id="bt-batchcreator-5" aria-label="Altitud" className="candy-input" value={altitude} onChange={(e) => setAltitude(e.target.value)} type="text" placeholder="Ej. 1800 msnm" style={{ minHeight: '44px', fontSize: '13px' }} />
              </div>
              <div className="form-group">
                <label htmlFor="bt-batchcreator-10" className="barista-label">Fecha de Congelado</label>
                <input id="bt-batchcreator-10" aria-label="Fecha de Congelado" className="candy-input" value={freezeDate} onChange={(e) => setFreezeDate(e.target.value)} type="date" style={{ minHeight: '44px', fontSize: '13px' }} />
              </div>
            </div>
            <div className="form-group">
                <label htmlFor="bt-batchcreator-11" className="barista-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Puntuación SCA / Catación</span>
                  {scaScore && parseFloat(scaScore) >= 80 && (
                    <span style={{ color: 'var(--color-crimson)', fontWeight: '700', fontSize: '12px', letterSpacing: '0.3px' }}>
                      {parseFloat(scaScore) >= 90 ? 'Excepcional (90+)' : (parseFloat(scaScore) >= 85 ? 'Excelente (85-89)' : 'Especialidad (80-84)')}
                    </span>
                  )}
                </label>
                <input id="bt-batchcreator-11" aria-label="Puntuación SCA / Catación"
                  className="candy-input"
                  value={scaScore}
                  onChange={(e) => setScaScore(e.target.value)}
                  type="number"
                  step="0.25"
                  min="0"
                  max="100"
                  placeholder="Ej. 87.5"
                  style={{ minHeight: '44px', fontSize: '13px' }}
                />
              </div>
            <div className="form-group" style={{ marginTop: '0px' }}>
                <label className="barista-label" style={{ marginBottom: '12px' }}>
                  Rueda de Sabores SCA
                </label>
                
                {/* Selection Summary */}
                {selectedFlavorTags.length > 0 && (
                  <div style={{ marginBottom: '14px', padding: '12px', backgroundColor: 'var(--barista-bg-surface)', border: '1.5px solid var(--barista-border-hairline)', borderRadius: 'var(--r-control)', boxShadow: 'var(--barista-shadow-card)' }}>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 'bold', textTransform: 'uppercase', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>
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
                            borderRadius: 'var(--r-control)',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            {getScaIcon(tag, 13, 2.5)}
                            {stripEmojis(tag)}
                            <button 
                              type="button" 
                              aria-label={`Quitar nota ${stripEmojis(tag)}`}
                              onClick={() => toggleFlavorTag(tag)}
                              style={{ background: 'none', border: 'none', color: colors.text, cursor: 'pointer', padding: '0 0 0 4px', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', minWidth: '24px', minHeight: '24px', justifyContent: 'center' }}
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
                          borderRadius: 'var(--r-control)',
                          whiteSpace: 'nowrap',
                          backgroundColor: isActive ? 'var(--bg-header)' : 'var(--bg-card)',
                          color: 'var(--color-text)',
                          cursor: 'pointer',
                          transition: 'var(--transition-ui)',
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
                      backgroundColor: 'var(--barista-bg-surface)',
                      border: '1.5px solid var(--barista-border-hairline)',
                      borderRadius: 'var(--r-control)'
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
                            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 'bold' }}>
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
                                      borderRadius: 'var(--r-control)',
                                      cursor: 'pointer',
                                      backgroundColor: isSelected ? colors.bg : 'var(--bg-card)',
                                      color: isSelected ? colors.text : 'var(--color-text)',
                                      transition: 'var(--transition-ui)',
                                      fontWeight: '600',
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
                <label htmlFor="bt-batchcreator-12" className="barista-label">Notas de Cata Adicionales</label>
                <input id="bt-batchcreator-12" aria-label="Notas de Cata Adicionales" className="candy-input" value={notes} onChange={(e) => setNotes(e.target.value)} type="text" placeholder="Ej. Fresa, chocolate, cuerpo sedoso" style={{ minHeight: '44px', fontSize: '13px' }} />
              </div>
          </div>
        </details>

        <button type="submit" className="btn-candy primary" style={{ width: '100%', minHeight: '48px', marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '15px', fontWeight: 'bold' }}>
          <Save size={20} strokeWidth={2.5} />
          {batchToEdit ? 'Guardar Cambios' : 'Crear Lote y Obtener Link'}
        </button>
      </form>

      {!batchToEdit && generatedUrl && (
        <div className="instr-box" style={{ marginTop: '14px' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '14px', marginTop: 0 }}>Enlace Único de Lote NFC</h3>
          <p style={{ fontSize: '12px', marginTop: 0 }}>Escribe este enlace en tus tags NFC usando la app "NFC Tools":</p>
          
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input className="candy-input" value={generatedUrl} readOnly style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', flex: 1, minWidth: 0 }} />
            <button type="button" className="btn-candy primary" style={{ margin: 0, flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px' }} onClick={copyUrl}>
              <ClipboardCopy size={16} strokeWidth={2.5} />
              Copiar
            </button>
          </div>
        </div>
      )}

      {/* Modal para configurar la API Key de Groq o Gemini en sitio */}
      {showApiKeyModal && (() => {
        const aiProvider = localStorage.getItem('beantag-ai-provider') || 'groq';
        return (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.72)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 'var(--z-sheet)',
            padding: '16px'
          }}>
            <div className="candy-card static" style={{
              maxWidth: '440px',
              width: '100%',
              padding: '24px',
              backgroundColor: 'var(--bg-card)',
              border: '2px solid var(--border-color)',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.35)',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: 'var(--r-control)',
                  background: 'var(--bg-header)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1.5px solid var(--border-color)'
                }}>
                  <Key size={20} color="var(--color-crimson)" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontFamily: 'var(--font-heading)', textTransform: 'uppercase' }}>
                    {aiProvider === 'groq' ? 'Configurar API Key de Groq' : 'Configurar API Key de Gemini'}
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    {aiProvider === 'groq' ? 'Groq Cloud • Visión OCR (Llama 3.2)' : 'Google AI Studio • Visión OCR Multimodal'}
                  </span>
                </div>
              </div>

              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: 1.45, margin: '0 0 14px 0' }}>
                Para que la IA reconozca automáticamente la bolsa de café, varietal, proceso y notas SCA a partir de una foto, introduce tu clave API gratuita.
              </p>

              <div style={{ marginBottom: '14px' }}>
                <label htmlFor="bt-batchcreator-14" className="barista-label" style={{ marginBottom: '6px' }}>
                  {aiProvider === 'groq' ? 'Clave API de Groq (gsk_...)' : 'Clave API de Gemini (AIzaSy...)'}
                </label>
                <input id="bt-batchcreator-14" 
                  type="password"
                  className="candy-input"
                  autoFocus
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  placeholder={aiProvider === 'groq' ? 'gsk_...' : 'AIzaSy...'}
                  style={{ width: '100%', boxSizing: 'border-box', fontFamily: 'var(--font-mono)', fontSize: '13px' }}
                />
                {aiProvider === 'groq' ? (
                  <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    Puedes obtener tu clave gratis en{' '}
                    <a 
                      href="https://console.groq.com/keys" 
                      target="_blank" 
                      rel="noreferrer"
                      style={{ color: 'var(--color-crimson)', fontWeight: 'bold', textDecoration: 'underline' }}
                    >
                      console.groq.com
                    </a>
                  </div>
                ) : (
                  <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    Puedes obtener tu clave gratis en{' '}
                    <a 
                      href="https://aistudio.google.com/app/apikey" 
                      target="_blank" 
                      rel="noreferrer"
                      style={{ color: 'var(--color-crimson)', fontWeight: 'bold', textDecoration: 'underline' }}
                    >
                      aistudio.google.com
                    </a>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-candy"
                  onClick={() => {
                    setShowApiKeyModal(false);
                    setPendingScanFile(null);
                    setTempApiKey('');
                  }}
                  style={{ padding: '8px 14px', fontSize: '12px' }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn-candy primary"
                  onClick={() => {
                    const key = tempApiKey.trim();
                    if (!key) {
                      if (showToast) showToast('Por favor introduce tu clave API.', { type: 'error', duration: 2500 });
                      return;
                    }
                    if (aiProvider === 'groq') {
                      localStorage.setItem('groq-key', key);
                    } else {
                      localStorage.setItem('gemini-api-key', key);
                    }
                    setShowApiKeyModal(false);
                    setTempApiKey('');
                    if (showToast) showToast('Clave API guardada con éxito.', { type: 'success', duration: 2000 });
                    
                    if (pendingScanFile) {
                      processBagScan(pendingScanFile, key);
                    } else if (fileInputRef.current) {
                      fileInputRef.current.click();
                    }
                  }}
                  style={{ padding: '8px 16px', fontSize: '12px', fontWeight: 'bold' }}
                >
                  Guardar y Escanear
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}