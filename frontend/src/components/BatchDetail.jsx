import React, { useState, useEffect, useRef } from 'react';
import { formatLocalDateStr } from '../utils/date';
import { getScaIcon, stripEmojis, getScaColorForNote } from '../utils/scaIcons';
import { Calculator, Scale, Droplet, Thermometer, Gauge, Timer, Coffee, Save, Edit2, Trash2, ArrowLeft, Settings2, X, Edit3, Nfc, Filter, Zap, BookOpen, ListOrdered, Mountain, Play } from 'lucide-react';
import { copyToClipboard } from '../utils/clipboard';
import { apiUrl } from '../utils/api';
import ScaRadarChart from './ScaRadarChart';
import DialInAssistant from './DialInAssistant';
import BaristaDisplayModal from './BaristaDisplayModal';

const calculateMicrons = (rot, num, click) => {
  const r = parseInt(rot) || 0;
  const n = parseInt(num) || 0;
  const c = parseInt(click) || 0;
  const totalClicks = (r * 90) + (n * 10) + c;
  return Math.round(totalClicks * 8.8);
};

const parseGrindToMicrons = (grindStr) => {
  if (!grindStr || !grindStr.includes('J-Max:')) return null;
  const parts = grindStr.replace('J-Max:', '').trim().split('.');
  if (parts.length === 3) {
    const rot = parseInt(parts[0]) || 0;
    const num = parseInt(parts[1]) || 0;
    const click = parseInt(parts[2]) || 0;
    const totalClicks = (rot * 90) + (num * 10) + click;
    return Math.round(totalClicks * 8.8);
  }
  return null;
};



export default function BatchDetail({ batchId, prefillRecipe, onBack, onSubtractDose, onSaveRecipe, onDeleteBatch, onEditBatch, showToast }) {
  const [batch, setBatch] = useState(null);
  const brewFormRef = useRef(null);

  useEffect(() => {
    const isNewBrew = window.location.search.includes('action=new_brew') || window.location.pathname.includes('/batch/');
    if (isNewBrew && brewFormRef.current) {
      setTimeout(() => {
        brewFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 350);
    }
  }, [batchId]);
  
  // Form fields
  const [method, setMethod] = useState('V60 (Filtrado)');
  
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
  const [showBaristaDisplay, setShowBaristaDisplay] = useState(false);

  // Sensory Evaluation States (Improvement 5)
  const [sensoryBalance, setSensoryBalance] = useState('Dulce');
  const [sensoryBody, setSensoryBody] = useState('Medio');
  const [sensoryExtraction, setSensoryExtraction] = useState('En Punto');
  const [notes, setNotes] = useState('');

  // Main Tab Navigation State ('brew' | 'history' | 'tools')
  const [activeTab, setActiveTab] = useState('brew');
  const [aiSubTab, setAiSubTab] = useState('pours');

  // Interactive Calculator State
  const [calcVisible, setCalcVisible] = useState(false);
  const [calcDose, setCalcDose] = useState(15.0);
  const [calcRatio, setCalcRatio] = useState(16.0);
  const [calcWater, setCalcWater] = useState(240);

  // AI Recommendation States
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState(null);
  const [aiError, setAiError] = useState('');

  const handleAiRecommend = () => {
    const apiKey = localStorage.getItem('gemini-api-key');
    if (!apiKey) {
      if (showToast) {
        showToast('Configura tu clave API de Gemini en Ajustes para usar la IA.', { type: 'error', duration: 4000 });
      }
      return;
    }

    setAiLoading(true);
    setAiError('');
    setAiRecommendation(null);

    fetch(apiUrl('api/recommend-recipe'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-gemini-key': apiKey
      },
      body: JSON.stringify({
        origin: batch.origin,
        variety: batch.variety,
        process: batch.process,
        altitude: batch.altitude,
        roast_level: batch.roast_level,
        roaster_notes: batch.roaster_notes,
        method: method,
        dose_in_g: doseInG
      })
    })
    .then(async (res) => {
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error del servidor al obtener recomendación.');
      }
      return res.json();
    })
    .then(data => {
      setAiRecommendation(data);
      if (showToast) showToast('¡Recomendación generada por la IA!', { type: 'success', duration: 2500 });
    })
    .catch(err => {
      setAiError(err.message);
      if (showToast) showToast('Error al obtener receta de IA.', { type: 'error', duration: 4000 });
    })
    .finally(() => {
      setAiLoading(false);
    });
  };

  const handleApplyAiRecipe = () => {
    if (!aiRecommendation) return;
    
    const recMethod = aiRecommendation.method.toLowerCase();
    if (recMethod.includes('v60') || recMethod.includes('filtrado')) {
      setMethod('V60 (Filtrado)');
    } else if (recMethod.includes('espresso') || recMethod.includes('expresso')) {
      setMethod('Espresso');
    } else if (recMethod.includes('aero') || recMethod.includes('press')) {
      setMethod('AeroPress');
    } else if (recMethod.includes('prensa') || recMethod.includes('francesa')) {
      setMethod('Prensa Francesa');
    }

    if (aiRecommendation.ratio && aiRecommendation.ratio.includes('1:')) {
      const ratioMatch = aiRecommendation.ratio.match(/1:([0-9.]+)/);
      if (ratioMatch) {
        setRatioVal(parseFloat(ratioMatch[1]) || 15.0);
      }
    }

    if (aiRecommendation.temperature) {
      setWaterTemp(parseInt(aiRecommendation.temperature) || 93);
    }

    if (aiRecommendation.brew_time) {
      setBrewTime(aiRecommendation.brew_time);
    }

    if (aiRecommendation.jmax_rot !== undefined && aiRecommendation.jmax_rot !== null) {
      setJmaxRot(parseInt(aiRecommendation.jmax_rot) || 0);
    }
    if (aiRecommendation.jmax_num !== undefined && aiRecommendation.jmax_num !== null) {
      setJmaxNum(parseInt(aiRecommendation.jmax_num) || 0);
    }
    if (aiRecommendation.jmax_click !== undefined && aiRecommendation.jmax_click !== null) {
      setJmaxClick(parseInt(aiRecommendation.jmax_click) || 0);
    }

    if (aiRecommendation.notes) {
      setNotes(prev => {
        const cleanPrev = prev.replace(/\[Receta IA:.*?\]/g, '').trim();
        const pourSummary = aiRecommendation.pours && aiRecommendation.pours.length > 0 
          ? ` | Vertidos: ${aiRecommendation.pours.map(p => `${p.label} (${p.water_g || p.water}g)`).join(' → ')}`
          : '';
        return `[Receta IA: ${aiRecommendation.notes}${pourSummary}] ${cleanPrev}`.trim();
      });
    }

    if (showToast) showToast('Receta sugerida por IA (parámetros y molino J-Max) aplicada al formulario.', { type: 'success', duration: 3000 });
    setAiRecommendation(null);
  };

  useEffect(() => {
    let active = true;
    fetch(apiUrl(`api/batches/${batchId}`))
      .then(res => res.json())
      .then(data => {
        if (!active) return;
        if (data && !data.error) {
          setBatch(data);
          // If prefillRecipe or last recipe is available, pre-populate parameters
          const targetRecipe = prefillRecipe || (data.recipes && data.recipes.length > 0 ? data.recipes[0] : null);
          if (targetRecipe) {
            setMethod(targetRecipe.method || 'V60 (Filtrado)');
            
            // Try parsing ratio
            if (targetRecipe.ratio && targetRecipe.ratio.includes('1:')) {
              const ratioMatch = targetRecipe.ratio.match(/1:([0-9.]+)/);
              if (ratioMatch) {
                setRatioVal(parseFloat(ratioMatch[1]) || 15.0);
              }
            }
            
            // Try parsing J-Max grind settings (format: "J-Max: R.N.C")
            if (targetRecipe.grind && targetRecipe.grind.includes('J-Max:')) {
              const grindParts = targetRecipe.grind.replace('J-Max:', '').trim().split('.');
              if (grindParts.length === 3) {
                setJmaxRot(parseInt(grindParts[0]) || 1);
                setJmaxNum(parseInt(grindParts[1]) || 5);
                setJmaxClick(parseInt(grindParts[2]) || 0);
              }
            }

            // Pre-populate new fields
            setDoseInG(targetRecipe.dose_in_g !== null && targetRecipe.dose_in_g !== undefined ? targetRecipe.dose_in_g : parseFloat(data.dose_weight) || 20.0);
            setDoseOutG(targetRecipe.dose_out_g !== null && targetRecipe.dose_out_g !== undefined ? targetRecipe.dose_out_g : 36.0);
            setWaterTemp(targetRecipe.temperature ? parseInt(targetRecipe.temperature) || 93 : 93);
            setEspressoPressure(targetRecipe.espresso_pressure !== null && targetRecipe.espresso_pressure !== undefined ? targetRecipe.espresso_pressure : 9);
            setEspressoPreinfusion(targetRecipe.espresso_preinfusion !== null && targetRecipe.espresso_preinfusion !== undefined ? targetRecipe.espresso_preinfusion : 5);
            setSensoryBalance(targetRecipe.sensory_balance || 'Dulce');
            setSensoryBody(targetRecipe.sensory_body || 'Medio');
            setSensoryExtraction(targetRecipe.sensory_extraction || 'En Punto');
            if (targetRecipe.brew_time) setBrewTime(targetRecipe.brew_time);
            if (targetRecipe.notes) setNotes(targetRecipe.notes);
          } else {
            // Defaults
            setDoseInG(parseFloat(data.dose_weight) || 20.0);
            setDoseOutG(36.0);
            setWaterTemp(93);
            setEspressoPressure(9);
            setEspressoPreinfusion(5);
          }
        } else {
          setBatch({ error: data?.error || 'Lote no encontrado' });
        }
      })
      .catch(err => {
        if (active) setBatch({ error: err.message || 'Error de conexión al cargar lote' });
      });
    return () => { active = false; };
  }, [batchId, prefillRecipe]);



  const handleDoseDeduction = () => {
    onSubtractDose(batch.id, () => {
      setBatch(prev => ({
        ...prev,
        remaining_doses: Math.max(0, prev.remaining_doses - 1)
      }));
    });
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

  const handleWriteNfc = async () => {
    if (!batch || !batch.id) return;
    const batchUrl = `${window.location.origin}/beantag/?batch=${encodeURIComponent(batch.id)}&action=new_brew`;
    
    // Always copy URL to clipboard first
    const copied = await copyToClipboard(batchUrl);
    
    if ('NDEFReader' in window && window.isSecureContext) {
      try {
        const ndef = new window.NDEFReader();
        await ndef.write({
          records: [{
            recordType: "url",
            data: batchUrl
          }]
        });
        showToast('🎉 Etiqueta NFC vinculada y URL copiada al portapapeles.', { type: 'success', duration: 3500 });
        return;
      } catch (error) {
        // Fallback handled below
      }
    }

    if (copied) {
      showToast(`📋 URL del lote copiada al portapapeles: ${batchUrl}`, { type: 'success', duration: 4000 });
    } else {
      showToast(`URL del lote: ${batchUrl}`, { type: 'info', duration: 4000 });
    }
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

  if (batch.error) return (
    <div style={{ padding: '24px 14px', textAlign: 'center' }}>
      <div className="candy-card static" style={{ padding: '20px' }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-crimson)', textTransform: 'uppercase', margin: '0 0 8px 0' }}>⚠️ {batch.error}</h3>
        <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
          No pudimos encontrar los detalles del café especificado.
        </p>
        <button className="btn-candy primary" onClick={onBack} style={{ margin: '0 auto', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}>
          <ArrowLeft size={16} /> Volver al Inicio
        </button>
      </div>
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

  return (
    <div style={{ padding: '12px 12px 24px 12px' }}>
      <BaristaDisplayModal
        isOpen={showBaristaDisplay}
        onClose={() => setShowBaristaDisplay(false)}
        batch={batch}
        recipe={lastRecipe}
      />

      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <button className="btn-candy" onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ArrowLeft size={16} strokeWidth={3} />
          Volver
        </button>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn-candy primary" onClick={() => setShowBaristaDisplay(true)} style={{ padding: '6px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', margin: 0 }}>
            <Play size={13} /> Barista Standby
          </button>
          <button className="btn-candy" onClick={() => onEditBatch(batch)} style={{ padding: '6px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', margin: 0 }}>
            <Edit2 size={13} />
            Editar
          </button>
          <button className="btn-candy" onClick={() => onDeleteBatch(batch.id, batch.name)} style={{ padding: '6px 10px', fontSize: '11px', color: 'var(--color-crimson)', borderColor: 'var(--color-crimson)', display: 'flex', alignItems: 'center', gap: '4px', margin: 0 }}>
            <Trash2 size={13} />
          </button>
          {isLowStock && <span className="mono-lbl-tag" style={{ background: '#E53E3E' }}>¡ÚLTIMOS!</span>}
        </div>
      </div>

      {/* Hero Ficha del Café */}
      <div className="candy-card static" style={{ marginBottom: '14px', padding: '14px', backgroundColor: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', margin: '0 0 6px 0', textTransform: 'uppercase', fontSize: '18px' }}>{batch.name}</h2>
          {batch.altitude && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-header)', border: '1px solid var(--border-color)', padding: '3px 8px', borderRadius: '12px', fontSize: '10.5px', fontWeight: 'bold', color: 'var(--color-crimson)' }}>
              <Mountain size={12} />
              <span>{batch.altitude}</span>
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '11.5px', color: 'var(--color-text-muted)', marginBottom: '10px' }}>
          <span><strong>Productor:</strong> {batch.producer}</span> •
          <span><strong>Origen:</strong> {batch.origin || 'N/A'}</span> •
          <span><strong>Proceso:</strong> {batch.process || 'N/A'}</span>
        </div>

        {/* Tubos & Congelador Bar */}
        <div style={{ background: 'var(--bg-canvas)', padding: '8px 10px', borderRadius: '6px', border: '1.5px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px' }}>
          <div>
            <strong>Tubos:</strong> <span style={{ color: 'var(--color-crimson)', fontWeight: '900' }}>{batch.remaining_doses} / {batch.total_doses}</span> ({batch.remaining_weight_g || 0}g rest.)
          </div>
          {batch.remaining_doses > 0 && (
            <button className="btn-candy primary" onClick={handleDoseDeduction} style={{ margin: 0, padding: '4px 8px', fontSize: '10.5px' }}>
              - Restar 1 Tubo
            </button>
          )}
        </div>

        {/* Color-coded SCA Tags */}
        {(() => {
          let scaTags = [];
          if (batch.roaster_notes && batch.roaster_notes.includes('[Notas: ')) {
            const match = batch.roaster_notes.match(/\[Notas: (.*?)\]/);
            if (match) scaTags = match[1].split(',').map(s => s.trim());
          }
          if (scaTags.length === 0) return null;
          return (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '10px' }}>
              {scaTags.map((tag, i) => {
                const colors = getScaColorForNote(tag);
                return (
                  <span key={i} style={{ padding: '3px 8px', backgroundColor: colors.bg, border: `1.5px solid ${colors.border}`, color: colors.text, borderRadius: '6px', fontSize: '10.5px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {getScaIcon(tag, 12)} {stripEmojis(tag)}
                  </span>
                );
              })}
            </div>
          );
        })()}

        {/* Sensory Radar Spider Chart */}
        <ScaRadarChart
          sweetness={8}
          acidity={lastRecipe ? 8 : 7}
          body={lastRecipe ? 7 : 6}
          aroma={9}
          balance={lastRecipe ? 8 : 7}
        />
      </div>

      {/* PESTAÑAS PRINCIPALES (Main Tabs) */}
      <div className="filter-scroll-container" style={{ marginBottom: '14px' }}>
        <button
          type="button"
          className={`filter-chip ${activeTab === 'brew' ? 'active' : ''}`}
          onClick={() => setActiveTab('brew')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Coffee size={14} />
          Preparar Café
        </button>
        <button
          type="button"
          className={`filter-chip ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <BookOpen size={14} />
          Historial ({batch.recipes?.length || 0})
        </button>
        <button
          type="button"
          className={`filter-chip ${activeTab === 'tools' ? 'active' : ''}`}
          onClick={() => setActiveTab('tools')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Calculator size={14} />
          Herramientas & NFC
        </button>
      </div>

      {/* PESTAÑA 1: PREPARAR CAFÉ */}
      {activeTab === 'brew' && (
        <div ref={brewFormRef} className="animate-entrance">
          <form onSubmit={handleRecipeSubmit}>
            {/* Method Icon Selector */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              {[
                { id: 'V60 (Filtrado)', lucide: <Filter size={20} />, label: 'V60' },
                { id: 'Espresso', lucide: <Zap size={20} />, label: 'Espresso' },
                { id: 'AeroPress', lucide: <Droplet size={20} />, label: 'AeroPress' },
                { id: 'Prensa Francesa', lucide: <Coffee size={20} />, label: 'Prensa' }
              ].map(m => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  style={{
                    flex: 1, padding: '8px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                    borderRadius: '6px', border: '2px solid var(--border-color)',
                    backgroundColor: method === m.id ? 'var(--color-crimson)' : 'var(--bg-card)',
                    color: method === m.id ? '#FFF' : 'var(--color-text)',
                    boxShadow: method === m.id ? 'none' : '2px 2px 0px var(--border-color)',
                    transform: method === m.id ? 'translate(1px, 1px)' : 'none',
                    cursor: 'pointer'
                  }}
                >
                  {m.lucide}
                  <span style={{ fontSize: '10px', fontWeight: 'bold' }}>{m.label}</span>
                </button>
              ))}
            </div>

            {/* Receta Recomendada por IA (Bloque estético e interactivo) */}
            <div className="candy-card static" style={{ marginBottom: '14px', padding: '12px', backgroundColor: 'var(--bg-card)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '14px' }}>✨</span>
                  <span style={{ fontWeight: '900', fontSize: '11px', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
                    Asistencia IA Barista ({method})
                  </span>
                </div>
                <span style={{ fontSize: '9px', fontWeight: '900', color: 'var(--color-crimson)' }}>{doseInG}g</span>
              </div>

              {aiError && <div style={{ color: '#E53E3E', fontSize: '10px', fontWeight: 'bold', marginTop: '6px' }}>⚠️ {aiError}</div>}

              {aiRecommendation ? (
                <div style={{ marginTop: '10px', padding: '10px', backgroundColor: 'var(--bg-canvas)', border: '1.5px solid var(--border-color)', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Badges de Parámetros Clave */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', textAlign: 'center', fontSize: '10px' }}>
                    <div style={{ background: 'var(--bg-card)', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '8.5px', color: 'var(--color-text-muted)' }}>Ratio / Agua</div>
                      <strong style={{ color: 'var(--color-crimson)' }}>{aiRecommendation.ratio} ({aiRecommendation.water_total_g || Math.round(doseInG * 15)}g)</strong>
                    </div>
                    <div style={{ background: 'var(--bg-card)', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '8.5px', color: 'var(--color-text-muted)' }}>Temp</div>
                      <strong>{aiRecommendation.temperature}°C</strong>
                    </div>
                    <div style={{ background: 'var(--bg-card)', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '8.5px', color: 'var(--color-text-muted)' }}>Tiempo</div>
                      <strong>{aiRecommendation.brew_time}</strong>
                    </div>
                  </div>

                  {/* Sub-pestañas para organizar Vertidos, Molinos y Pasos */}
                  <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', marginTop: '4px' }}>
                    <button type="button" className={`filter-chip ${aiSubTab === 'pours' ? 'active' : ''}`} onClick={() => setAiSubTab('pours')} style={{ padding: '2px 8px', fontSize: '9.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Droplet size={10} /> Vertidos
                    </button>
                    <button type="button" className={`filter-chip ${aiSubTab === 'grinders' ? 'active' : ''}`} onClick={() => setAiSubTab('grinders')} style={{ padding: '2px 8px', fontSize: '9.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Settings2 size={10} /> Molino J-Max
                    </button>
                    <button type="button" className={`filter-chip ${aiSubTab === 'steps' ? 'active' : ''}`} onClick={() => setAiSubTab('steps')} style={{ padding: '2px 8px', fontSize: '9.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ListOrdered size={10} /> Pasos
                    </button>
                  </div>

                  {/* Sub-Contenido: Vertidos */}
                  {aiSubTab === 'pours' && aiRecommendation.pours && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {aiRecommendation.pours.map((p, idx) => (
                        <div key={idx} style={{ padding: '6px 8px', background: 'var(--bg-card)', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: 'var(--color-crimson)' }}>
                            <span>{p.step}. {p.label} (+{p.water_g || p.water}g)</span>
                            <span style={{ fontFamily: 'var(--font-mono)' }}>⏱️ {p.time}</span>
                          </div>
                          {p.description && <div style={{ fontSize: '9px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{p.description}</div>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Sub-Contenido: Molinos */}
                  {aiSubTab === 'grinders' && (
                    <div style={{ fontSize: '10px', display: 'flex', flexDirection: 'column', gap: '4px', background: 'var(--bg-card)', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                      <div><strong style={{ color: 'var(--color-crimson)' }}>1Zpresso J-Max:</strong> {aiRecommendation.jmax_rot !== undefined ? `${aiRecommendation.jmax_rot}.${aiRecommendation.jmax_num}.${aiRecommendation.jmax_click}` : (aiRecommendation.grinders?.jmax || '1.3.5')} ({aiRecommendation.grind_microns || 'Molienda Fina'})</div>
                      {aiRecommendation.grinders && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', marginTop: '4px', paddingTop: '4px', borderTop: '1px dashed var(--border-color)', fontSize: '9px' }}>
                          <div><strong>Comandante:</strong> {aiRecommendation.grinders.comandante}</div>
                          <div><strong>Timemore:</strong> {aiRecommendation.grinders.timemore}</div>
                          <div><strong>Baratza:</strong> {aiRecommendation.grinders.baratza}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sub-Contenido: Pasos */}
                  {aiSubTab === 'steps' && aiRecommendation.steps && (
                    <ol style={{ margin: 0, paddingLeft: '16px', fontSize: '10px', color: 'var(--color-text-muted)' }}>
                      {aiRecommendation.steps.map((st, i) => <li key={i}>{st}</li>)}
                    </ol>
                  )}

                  <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                    <button type="button" className="btn-candy primary" onClick={handleApplyAiRecipe} style={{ flex: 1, padding: '6px', fontSize: '10px', minHeight: '30px' }}>
                      Aplicar al Formulario
                    </button>
                    <button type="button" className="btn-candy" onClick={() => setAiRecommendation(null)} style={{ padding: '6px 10px', fontSize: '10px', minHeight: '30px', margin: 0 }}>
                      Cerrar
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" className="btn-candy" onClick={handleAiRecommend} disabled={aiLoading} style={{ width: '100%', marginTop: '8px', padding: '6px', fontSize: '10.5px', minHeight: '32px' }}>
                  {aiLoading ? 'Generando receta... 🧠' : 'Diseñar Receta IA ✨'}
                </button>
              )}
            </div>

            {/* Formulario Bento Grid */}
            <div className="bento-grid">
              <div className="bento-widget accent">
                <div className="bento-header"><span>Grams</span><Scale size={14} /></div>
                <div className="bento-value-container">
                  <input type="number" step="0.5" value={doseInG} onChange={(e) => setDoseInG(parseFloat(e.target.value) || 0)} />
                  <span className="unit">g</span>
                </div>
              </div>

              {method === 'Espresso' ? (
                <div className="bento-widget accent">
                  <div className="bento-header"><span>Output</span><Droplet size={14} /></div>
                  <div className="bento-value-container">
                    <input type="number" step="0.5" value={doseOutG} onChange={(e) => setDoseOutG(parseFloat(e.target.value) || 0)} />
                    <span className="unit">g</span>
                  </div>
                </div>
              ) : (
                <div className="bento-widget accent">
                  <div className="bento-header"><span>Ratio 1:</span><Gauge size={14} /></div>
                  <div className="bento-value-container">
                    <input type="number" step="0.5" value={ratioVal} onChange={(e) => setRatioVal(parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="bento-info">~{Math.round(doseInG * ratioVal)}g agua</div>
                </div>
              )}

              <div className="bento-widget">
                <div className="bento-header"><span>Water Temp</span><Thermometer size={14} /></div>
                <div className="bento-value-container">
                  <input type="number" value={waterTemp} onChange={(e) => setWaterTemp(parseInt(e.target.value) || 93)} />
                  <span className="unit">°C</span>
                </div>
              </div>

              <div className="bento-widget">
                <div className="bento-header"><span>Time</span><Timer size={14} /></div>
                <div className="bento-value-container">
                  <input type="text" style={{ fontSize: '20px' }} value={brewTime} onChange={(e) => setBrewTime(e.target.value)} />
                </div>
              </div>

              {/* J-Max Steppers */}
              <div className="bento-widget bento-full-row accent">
                <div className="bento-header"><span>Molino 1Zpresso J-Max</span><Coffee size={14} /></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 0' }}>
                  <select className="candy-input" style={{ flex: 1, textAlign: 'center', margin: 0, padding: '6px' }} value={jmaxRot} onChange={(e) => setJmaxRot(parseInt(e.target.value) || 0)}>
                    {[0, 1, 2, 3, 4].map(v => <option key={v} value={v}>Rot: {v}</option>)}
                  </select>
                  <select className="candy-input" style={{ flex: 1, textAlign: 'center', margin: 0, padding: '6px' }} value={jmaxNum} onChange={(e) => setJmaxNum(parseInt(e.target.value) || 0)}>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(v => <option key={v} value={v}>Num: {v}</option>)}
                  </select>
                  <select className="candy-input" style={{ flex: 1, textAlign: 'center', margin: 0, padding: '6px' }} value={jmaxClick} onChange={(e) => setJmaxClick(parseInt(e.target.value) || 0)}>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(v => <option key={v} value={v}>Clic: {v}</option>)}
                  </select>
                </div>
                <div className="bento-info">Calibrado: {jmaxRot}.{jmaxNum}.{jmaxClick} (~{currentMicrons} µm)</div>
              </div>
            </div>

            {/* Evaluacion Sensorial */}
            <div className="candy-card static" style={{ marginTop: '12px', padding: '12px' }}>
              <div style={{ fontSize: '10.5px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>Evaluación Sensorial</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '10px' }}>
                <div>
                  <label style={{ fontSize: '9px' }}>Balance</label>
                  <select className="candy-input" style={{ padding: '4px', fontSize: '11px' }} value={sensoryBalance} onChange={e => setSensoryBalance(e.target.value)}>
                    <option value="Dulce">Dulce</option>
                    <option value="Ácido">Ácido</option>
                    <option value="Amargo">Amargo</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '9px' }}>Cuerpo</label>
                  <select className="candy-input" style={{ padding: '4px', fontSize: '11px' }} value={sensoryBody} onChange={e => setSensoryBody(e.target.value)}>
                    <option value="Ligero">Ligero</option>
                    <option value="Medio">Medio</option>
                    <option value="Sedoso">Sedoso</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '9px' }}>Extracción</label>
                  <select className="candy-input" style={{ padding: '4px', fontSize: '11px' }} value={sensoryExtraction} onChange={e => setSensoryExtraction(e.target.value)}>
                    <option value="En Punto">En Punto</option>
                    <option value="Sub">Sub (Agrio)</option>
                    <option value="Sobre">Sobre (Amargo)</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '9px' }}>Notas de Cata de Extracción</label>
                <input className="candy-input" value={notes} onChange={(e) => setNotes(e.target.value)} type="text" placeholder="Ej. Muy dulzón, acidez limpia..." />
              </div>
            </div>

            <button type="submit" className="btn-candy primary" style={{ width: '100%', marginTop: '12px', fontSize: '14px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Save size={18} />
              Guardar Bitácora
            </button>
          </form>

          {/* Dial-in Calibration Assistant */}
          <DialInAssistant />
        </div>
      )}

      {/* PESTAÑA 2: HISTORIAL DE RECETAS */}
      {activeTab === 'history' && (
        <div className="animate-entrance">
          {/* Banner Última Configuración Exitosa */}
          {lastRecipe && (
            <div className="recipe-target-banner" style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '9px', fontWeight: '900', color: '#E53E3E', textTransform: 'uppercase', marginBottom: '4px' }}>
                Última Configuración Exitosa
              </div>
              <div style={{ fontSize: '13px', fontWeight: '900' }}>
                {lastRecipe.method} | {lastRecipe.grind} | {lastRecipe.ratio}
              </div>
              <button className="btn-candy primary" onClick={handleRepeatLastRecipe} style={{ width: '100%', marginTop: '8px', padding: '6px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                <Zap size={12} />
                ⚡ Cargar esta Receta al Formulario
              </button>
            </div>
          )}

          {Array.isArray(batch?.recipes) && batch.recipes.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {batch.recipes.map(r => (
                <div key={r.id} className="candy-card static" style={{ padding: '12px', fontSize: '11px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                    <span>{r.method} ({r.ratio})</span>
                    <span>{r.temperature} • {r.brew_time}</span>
                  </div>
                  <div style={{ color: 'var(--color-crimson)', fontWeight: 'bold', marginTop: '2px' }}>
                    Molienda: {r.grind}
                  </div>
                  {r.notes && <div style={{ fontStyle: 'italic', marginTop: '4px', color: 'var(--color-text-muted)' }}>"{r.notes}"</div>}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-muted)', fontSize: '12px' }}>
              No hay preparaciones registradas aún para este lote.
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA 3: HERRAMIENTAS BARISTA & NFC */}
      {activeTab === 'tools' && (
        <div className="animate-entrance" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Calculadora de Ratio */}
          <div className="candy-card static" style={{ padding: '14px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calculator size={16} color="var(--color-crimson)" />
              Calculadora de Ratio & Agua
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ flex: 1, margin: 0 }}>
                <label style={{ fontSize: '10px' }}>Café (g)</label>
                <input type="number" step="0.5" className="candy-input" value={calcDose} onChange={(e) => { const d = parseFloat(e.target.value) || 0; setCalcDose(d); setCalcWater(Math.round(d * calcRatio)); }} />
              </div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', paddingBottom: '8px' }}>×</div>
              <div className="form-group" style={{ flex: 1, margin: 0 }}>
                <label style={{ fontSize: '10px' }}>Ratio 1:</label>
                <input type="number" step="0.5" className="candy-input" value={calcRatio} onChange={(e) => { const r = parseFloat(e.target.value) || 0; setCalcRatio(r); setCalcWater(Math.round(calcDose * r)); }} />
              </div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', paddingBottom: '8px' }}>=</div>
              <div className="form-group" style={{ flex: 1, margin: 0 }}>
                <label style={{ fontSize: '10px' }}>Agua (g)</label>
                <input type="number" className="candy-input" value={calcWater} onChange={(e) => { const w = parseFloat(e.target.value) || 0; setCalcWater(w); if (calcDose > 0) setCalcRatio(parseFloat((w / calcDose).toFixed(1))); }} />
              </div>
            </div>
            <button type="button" className="btn-candy accent" style={{ width: '100%', marginTop: '10px', padding: '6px', fontSize: '10.5px' }} onClick={() => { setDoseInG(calcDose); setRatioVal(calcRatio); setActiveTab('brew'); if (showToast) showToast('Valores transferidos a la pestaña de preparación.', { type: 'success' }); }}>
              Transferir a mi receta
            </button>
          </div>

          {/* Semáforo Desgasificación */}
          {batch.roast_date && batch.freeze_date && (
            <div className="candy-card static" style={{ padding: '12px', borderLeft: `4px solid ${degasStatus.color}` }}>
              <div style={{ fontWeight: 'bold', fontSize: '11.5px', color: degasStatus.color }}>
                {degasStatus.label} ({restingDays} Días de Reposo)
              </div>
              <p style={{ fontSize: '10.5px', margin: '4px 0 0 0', color: 'var(--color-text-muted)' }}>
                {degasStatus.description}
              </p>
            </div>
          )}

          {/* Tarjeta Vincular NFC & Copiar URL */}
          <div className="candy-card static" style={{ padding: '14px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Nfc size={16} color="var(--color-crimson)" />
              Vinculación NFC & URL Directa
            </div>
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: '0 0 10px 0' }}>
              URL directa de <strong>{batch.name}</strong> para Atajos de iOS o etiquetas NFC:
            </p>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
              <input 
                type="text" 
                readOnly 
                className="candy-input" 
                style={{ flex: 1, fontSize: '10px', margin: 0, padding: '6px' }}
                value={`${window.location.origin}/beantag/?batch=${encodeURIComponent(batch.id)}&action=new_brew`}
                onClick={(e) => e.target.select()}
              />
              <button 
                type="button" 
                className="btn-candy primary" 
                style={{ padding: '6px 12px', fontSize: '10.5px', whiteSpace: 'nowrap' }}
                onClick={handleWriteNfc}
              >
                Copiar URL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
