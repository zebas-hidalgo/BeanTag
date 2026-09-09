import React, { useState, useEffect, useRef } from 'react';
import { formatLocalDateStr } from '../utils/date';
import { getScaIcon, stripEmojis, getScaColorForNote } from '../utils/scaIcons';
import { Calculator, Scale, Droplet, Thermometer, Gauge, Timer, Coffee, Save, Edit2, Trash2, ArrowLeft, Settings2, X, Edit3, Nfc, Filter, Zap, BookOpen, ListOrdered, Mountain, Play, Share2, Image as ImageIcon, Award, Sparkles, ClipboardCopy, Layers } from 'lucide-react';
import { copyToClipboard } from '../utils/clipboard';
import { apiUrl } from '../utils/api';
import { generateRecipeCardImage, generateCoffeeMenuCardImage, generateCoffeeMenuText } from '../utils/cardGenerator';
import { FAMOUS_RECIPES } from '../utils/famousRecipes';
import ScaRadarChart from './ScaRadarChart';
import DialInAssistant from './DialInAssistant';

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

export default function BatchDetail({ batchId, batches = [], currentUser, onRequireAuth, prefillRecipe, onBack, onSubtractDose, onSaveRecipe, onDeleteBatch, onEditBatch, showToast }) {
  const [batch, setBatch] = useState(null);
  const brewFormRef = useRef(null);

  const isOwner = Boolean(
    currentUser && (!batch?.user_id || currentUser.id === batch.user_id)
  );

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
  
  // Grinder Selector State ('jmax' | 'femobook' | 'comandante')
  const [grinderType, setGrinderType] = useState(() => localStorage.getItem('default-grinder') || 'jmax');
  
  // 1Zpresso J-Max Steppers (Default: 1.5.0)
  const [jmaxRot, setJmaxRot] = useState(1);
  const [jmaxNum, setJmaxNum] = useState(5);
  const [jmaxClick, setJmaxClick] = useState(0);

  // Femobook A2 State (0 - 120 clicks, default 60 = 1.5 Rot.)
  const [femobookClicks, setFemobookClicks] = useState(60);

  // Comandante C40 State (0 - 40 clicks, default 24)
  const [comandanteClicks, setComandanteClicks] = useState(24);
  
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

  // Share / Export Card States
  const [shareImage, setShareImage] = useState(null);
  const [shareScope, setShareScope] = useState('single'); // 'single' | 'menu'
  const [shareIncludeRecipe, setShareIncludeRecipe] = useState(false); // Default to bean-only for batch detail
  const [shareTemplate, setShareTemplate] = useState('craft'); // 'craft' | 'minimal' | 'dark'
  const [shareStatus, setShareStatus] = useState('');

  const handleShareBatchCard = (incRecipe = shareIncludeRecipe, templ = shareTemplate, scope = shareScope) => {
    if (!batch) return;
    setShareScope(scope);
    setShareStatus('Generando imagen...');

    if (scope === 'menu') {
      const targetList = Array.isArray(batches) && batches.length > 0 ? batches : [batch];
      try {
        const dataUrl = generateCoffeeMenuCardImage(targetList, templ);
        setShareImage(dataUrl);
        setShareTemplate(templ);
        setShareStatus('✅ Carta de cafés generada con éxito');
      } catch (err) {
        console.error("Menu card generation error:", err);
        setShareStatus('❌ Error: ' + err.message);
      }
      return;
    }
    
    // Construct recipe/batch object
    const syntheticRecipe = {
      id: batch.id,
      batch_name: batch.name,
      batch_roaster: batch.roaster,
      batch_producer: batch.producer,
      batch_origin: batch.origin,
      batch_altitude: batch.altitude,
      batch_variety: batch.variety,
      batch_process: batch.process,
      batch_roast_date: batch.roast_date,
      batch_roaster_notes: batch.roaster_notes,
      method: method || 'V60 (Filtrado)',
      dose_in_g: doseInG,
      ratio: `1:${ratioVal}`,
      grind: getGrindString(),
      temperature: `${waterTemp}°C`,
      brew_time: brewTime || '2:30 min',
      sensory_balance: sensoryBalance,
      sensory_body: sensoryBody,
      sensory_extraction: sensoryExtraction,
      notes: notes,
      created_at: new Date().toISOString()
    };

    try {
      const dataUrl = generateRecipeCardImage(syntheticRecipe, templ, incRecipe);
      setShareImage(dataUrl);
      setShareTemplate(templ);
      setShareIncludeRecipe(incRecipe);
      setShareStatus('✅ Ticket generado con éxito');
    } catch (err) {
      console.error("Card generation error:", err);
      setShareStatus('❌ Error: ' + err.message);
    }
  };

  const handleCopyShareText = async () => {
    if (shareScope === 'menu') {
      const targetList = Array.isArray(batches) && batches.length > 0 ? batches : [batch];
      const text = generateCoffeeMenuText(targetList);
      const success = await copyToClipboard(text);
      if (success) {
        setShareStatus('📋 ¡Carta de cafés copiada al portapapeles!');
        if (showToast) showToast('📋 Carta de cafés copiada en formato texto.', { type: 'success' });
      }
    } else {
      const text = `☕ *${batch.name}* (${batch.roaster || 'Specialty'})\n` +
        `🌍 ${batch.origin || 'Origen'} • ${batch.altitude || ''}\n` +
        `🌾 ${batch.variety || ''} • Proceso: ${batch.process || 'Lavado'}\n` +
        `✨ Notas: ${batch.roaster_notes || 'Café de Especialidad'}\n` +
        (shareIncludeRecipe ? `\n🧾 *Receta:* ${method} • Dosis: ${doseInG}g • Ratio 1:${ratioVal} • Molienda: ${getGrindString()} • Temp: ${waterTemp}°C` : '');
      const success = await copyToClipboard(text);
      if (success) {
        setShareStatus('📋 Ficha copiada al portapapeles');
        if (showToast) showToast('📋 Ficha copiada.', { type: 'success' });
      }
    }
  };

  const handleNativeShare = async () => {
    if (!shareImage || !batch) return;
    setShareStatus('Compartiendo...');

    try {
      const byteCharacters = atob(shareImage.split(',')[1]);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });
      const filename = shareScope === 'menu'
        ? `Carta_Cafes_BeanTag_${Date.now()}.png`
        : `${batch.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}_ficha.png`;
      const file = new File([blob], filename, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: shareScope === 'menu' ? 'Carta de Cafés • BeanTag' : `Ficha de ${batch.name}`,
          text: shareScope === 'menu' ? 'Carta de cafés de especialidad disponibles en cava' : `Ficha de café de especialidad: ${batch.name}`
        });
        setShareStatus('✅ Compartido con éxito');
      } else {
        const link = document.createElement('a');
        link.download = filename;
        link.href = shareImage;
        link.click();
        setShareStatus('📥 Imagen descargada');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        const link = document.createElement('a');
        link.download = shareScope === 'menu' ? `Carta_Cafes_BeanTag_${Date.now()}.png` : `${batch.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}_ficha.png`;
        link.href = shareImage;
        link.click();
        setShareStatus('📥 Imagen descargada');
      }
    }
  };

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

    const model = localStorage.getItem('gemini-model') || 'gemini-3.7-flash';
    const isThinking = localStorage.getItem('gemini-thinking') === 'true';

    setAiLoading(true);
    setAiError('');
    setAiRecommendation(null);

    fetch(apiUrl('api/recommend-recipe'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-gemini-key': apiKey,
        'x-gemini-model': model,
        'x-gemini-thinking': isThinking ? 'true' : 'false'
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

    // Extract Femobook A2 clicks if available
    if (aiRecommendation.grinders?.femobook_a2) {
      const match = String(aiRecommendation.grinders.femobook_a2).match(/(\d+)\s*clic/i);
      if (match) {
        setFemobookClicks(parseInt(match[1]) || 60);
      }
    }

    // Extract Comandante clicks if available
    if (aiRecommendation.grinders?.comandante) {
      const match = String(aiRecommendation.grinders.comandante).match(/(\d+)/);
      if (match) {
        setComandanteClicks(parseInt(match[1]) || 24);
      }
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

    if (showToast) showToast('Receta sugerida por IA aplicada al formulario.', { type: 'success', duration: 3000 });
    setAiRecommendation(null);
  };

  const [selectedFamousRecipe, setSelectedFamousRecipe] = useState(null);

  const handleApplyFamousRecipe = (famous) => {
    setMethod(famous.method);
    if (famous.ratioVal) setRatioVal(famous.ratioVal);
    if (famous.temperature) setWaterTemp(famous.temperature);
    if (famous.brewTime) setBrewTime(famous.brewTime);
    if (famous.grinderSettings?.jmax) {
      setJmaxRot(famous.grinderSettings.jmax.rot);
      setJmaxNum(famous.grinderSettings.jmax.num);
      setJmaxClick(famous.grinderSettings.jmax.click);
    }
    if (famous.grinderSettings?.femobook) {
      setFemobookClicks(famous.grinderSettings.femobook.clicks);
    }
    if (famous.grinderSettings?.comandante) {
      setComandanteClicks(famous.grinderSettings.comandante.clicks);
    }

    const calculatedPours = famous.calculatePours ? famous.calculatePours(doseInG) : [];
    const pourSummary = calculatedPours.length > 0 
      ? ` | Vertidos: ${calculatedPours.map(p => `${p.label} (${p.water_g}g)`).join(' → ')}`
      : '';
    
    setNotes(prev => {
      const clean = prev.replace(/\[Receta.*?:.*?\]/g, '').trim();
      return `[${famous.name} (${famous.author}): ${famous.notes}${pourSummary}] ${clean}`.trim();
    });

    // Populate interactive assistance card so barista can follow live timings, pours and grind
    setAiRecommendation({
      method: famous.method,
      ratio: famous.ratio,
      water_total_g: Math.round(doseInG * (famous.ratioVal || 15)),
      temperature: famous.temperature,
      brew_time: famous.brewTime,
      grind: famous.grind,
      grind_microns: `${famous.grindMicrons} µm`,
      jmax_rot: famous.grinderSettings?.jmax?.rot,
      jmax_num: famous.grinderSettings?.jmax?.num,
      jmax_click: famous.grinderSettings?.jmax?.click,
      grinders: {
        jmax: famous.grinderSettings?.jmax?.text,
        femobook_a2: famous.grinderSettings?.femobook?.text,
        comandante: famous.grinderSettings?.comandante?.text
      },
      pours: calculatedPours,
      steps: famous.steps,
      notes: famous.notes
    });

    setSelectedFamousRecipe(famous.id);
    if (showToast) showToast(`🏆 Receta "${famous.name}" aplicada al formulario.`, { type: 'success', duration: 3000 });
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

  const handleLoadRecipeToForm = (rec) => {
    if (!rec) return;
    if (rec.method) setMethod(rec.method);
    if (rec.dose_in_g) setDoseInG(rec.dose_in_g);
    if (rec.dose_out_g) setDoseOutG(rec.dose_out_g);
    if (rec.temperature) {
      const t = parseInt(rec.temperature);
      if (!isNaN(t)) setWaterTemp(t);
    }
    if (rec.brew_time) setBrewTime(rec.brew_time);
    if (rec.notes) setNotes(rec.notes);
    setActiveTab('brew');
    if (showToast) showToast('Parámetros cargados en el preparador.', { type: 'info', duration: 2000 });
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

  const getGrindString = () => {
    if (grinderType === 'femobook') {
      const rot = (femobookClicks / 40).toFixed(2);
      return `Femobook A2: ${femobookClicks} clics (${rot} Rot.)`;
    } else if (grinderType === 'comandante') {
      return `Comandante: ${comandanteClicks} clics`;
    }
    return `J-Max: ${jmaxRot}.${jmaxNum}.${jmaxClick}`;
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
      grind: getGrindString(),
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



  // Dynamic calculated microns for current form state based on grinder type
  const currentMicrons = grinderType === 'femobook'
    ? Math.round(femobookClicks * 18)
    : (grinderType === 'comandante' ? Math.round(comandanteClicks * 30) : calculateMicrons(jmaxRot, jmaxNum, jmaxClick));

  return (
    <div style={{ padding: '14px 14px 28px 14px' }}>
      {/* Top Header - Row 1: Back Navigation + Status Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <button 
          className="btn-candy" 
          onClick={onBack} 
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', margin: 0, fontSize: '12px' }}
        >
          <ArrowLeft size={16} strokeWidth={2.5} />
          <span>Volver</span>
        </button>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {batch.altitude && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-header)', border: '1px solid var(--border-color)', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '800', color: 'var(--color-crimson)' }}>
              <Mountain size={12} />
              <span>{batch.altitude}</span>
            </div>
          )}
          {isLowStock && <span className="mono-lbl-tag" style={{ background: '#E53E3E', fontSize: '10px', padding: '3px 8px' }}>¡ÚLTIMOS!</span>}
        </div>
      </div>

      {/* Guest Mode Banner */}
      {!isOwner && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.08) 0%, rgba(220, 38, 38, 0.05) 100%)',
          border: '1.5px solid rgba(234, 88, 12, 0.25)',
          borderRadius: '12px',
          padding: '10px 14px',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>👁️</span>
            <div>
              <div style={{ fontSize: '11.5px', fontWeight: '800', color: 'var(--color-text-main)' }}>
                Modo Invitado (NFC)
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--color-text-muted)' }}>
                {currentUser 
                  ? 'Ficha en modo solo lectura.'
                  : 'Ficha pública de solo lectura. Inicia sesión si eres el dueño.'}
              </div>
            </div>
          </div>
          {!currentUser && onRequireAuth && (
            <button 
              className="btn-candy primary"
              onClick={onRequireAuth}
              style={{ padding: '5px 10px', fontSize: '11px', whiteSpace: 'nowrap', margin: 0, fontWeight: 'bold' }}
            >
              Acceder
            </button>
          )}
        </div>
      )}

      {/* Top Header - Row 2: Spacious Action Toolbar */}
      <div style={{ display: 'grid', gridTemplateColumns: isOwner ? '1fr auto auto' : '1fr', gap: '8px', marginBottom: '14px' }}>
        <button 
          className="btn-candy primary" 
          onClick={() => handleShareBatchCard(false)} 
          style={{ padding: '8px 12px', fontSize: '11.5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', margin: 0 }}
        >
          <Share2 size={14} strokeWidth={2.5} />
          <span>Compartir Ticket</span>
        </button>

        {isOwner && (
          <button 
            className="btn-candy" 
            onClick={() => onEditBatch(batch)} 
            style={{ padding: '8px 12px', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '5px', margin: 0 }}
          >
            <Edit2 size={13} strokeWidth={2.5} />
            <span>Editar</span>
          </button>
        )}

        {isOwner && (
          <button 
            className="btn-candy" 
            onClick={() => onDeleteBatch(batch.id, batch.name)} 
            style={{ padding: '8px 12px', fontSize: '11.5px', color: 'var(--color-crimson)', borderColor: 'var(--color-crimson)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 0 }}
            title="Eliminar lote"
          >
            <Trash2 size={14} strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* Hero Ficha del Café */}
      <div className="candy-card static" style={{ marginBottom: '14px', padding: '16px', backgroundColor: 'var(--bg-card)' }}>
        <div style={{ marginBottom: '6px' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', margin: '0 0 4px 0', textTransform: 'uppercase', fontSize: '19px', lineHeight: 1.2 }}>{batch.name}</h2>
          <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', fontWeight: 'bold' }}>
            {batch.roaster || 'Tostador Especialidad'}
          </div>
        </div>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
          <span><strong>Productor:</strong> {batch.producer}</span> •
          <span><strong>Origen:</strong> {batch.origin || 'N/A'}</span> •
          <span><strong>Proceso:</strong> {batch.process || 'N/A'}</span>
        </div>

        {/* Tubos & Congelador Bar */}
        <div style={{ background: 'var(--bg-canvas)', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
          <div>
            <strong>Tubos:</strong> <span style={{ color: 'var(--color-crimson)', fontWeight: '900' }}>{batch.remaining_doses} / {batch.total_doses}</span> ({batch.remaining_weight_g || 0}g rest.)
          </div>
          {isOwner && batch.remaining_doses > 0 && (
            <button className="btn-candy primary" onClick={handleDoseDeduction} style={{ margin: 0, padding: '6px 10px', fontSize: '11px', fontWeight: 'bold' }}>
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

      {/* PESTAÑAS PRINCIPALES (Cupertino Segmented) */}
      <div className="cupertino-segmented" style={{ marginBottom: '16px' }}>
        <button
          type="button"
          className={`cupertino-segmented-btn ${activeTab === 'brew' ? 'active' : ''}`}
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(8);
            setActiveTab('brew');
          }}
        >
          <Coffee size={14} strokeWidth={2.2} />
          <span>Preparar</span>
        </button>
        <button
          type="button"
          className={`cupertino-segmented-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(8);
            setActiveTab('history');
          }}
        >
          <BookOpen size={14} strokeWidth={2.2} />
          <span>Historial ({batch.recipes?.length || 0})</span>
        </button>
        <button
          type="button"
          className={`cupertino-segmented-btn ${activeTab === 'tools' ? 'active' : ''}`}
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(8);
            setActiveTab('tools');
          }}
        >
          <Calculator size={14} strokeWidth={2.2} />
          <span>Ajustes & NFC</span>
        </button>
      </div>

      {/* PESTAÑA 1: PREPARAR CAFÉ */}
      {activeTab === 'brew' && (
        <div ref={brewFormRef} className="animate-entrance">
          <form onSubmit={handleRecipeSubmit}>
            {/* Method Cupertino Segmented Selector */}
            <div className="cupertino-segmented" style={{ padding: '4px', gap: '4px', marginBottom: '16px' }}>
              {[
                { id: 'V60 (Filtrado)', lucide: <Filter size={18} strokeWidth={2.3} />, label: 'V60' },
                { id: 'Espresso', lucide: <Zap size={18} strokeWidth={2.3} />, label: 'Espresso' },
                { id: 'AeroPress', lucide: <Droplet size={18} strokeWidth={2.3} />, label: 'AeroPress' },
                { id: 'Prensa Francesa', lucide: <Coffee size={18} strokeWidth={2.3} />, label: 'Prensa' }
              ].map(m => {
                const isActive = method === m.id;
                return (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => {
                      if (navigator.vibrate) navigator.vibrate(8);
                      setMethod(m.id);
                    }}
                    className={`cupertino-segmented-btn ${isActive ? 'active' : ''}`}
                    style={{
                      flexDirection: 'column',
                      padding: '8px 4px',
                      minHeight: '52px',
                      gap: '4px',
                      borderRadius: '10px'
                    }}
                  >
                    {m.lucide}
                    <span style={{ fontSize: '11px', fontWeight: isActive ? '800' : '600' }}>{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* 🌟 Recetas Legendarias & Técnicas de Baristas Famosos */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--color-text)' }}>
                  <Award size={14} style={{ color: 'var(--color-crimson)' }} />
                  <span>Recetas Legendarias de Baristas</span>
                </div>
                <span style={{ fontSize: '9.5px', color: 'var(--color-text-muted)', fontWeight: 'bold' }}>Carga rápida</span>
              </div>

              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
                {FAMOUS_RECIPES.map((famous) => {
                  const isSelected = selectedFamousRecipe === famous.id;
                  return (
                    <button
                      key={famous.id}
                      type="button"
                      onClick={() => handleApplyFamousRecipe(famous)}
                      style={{
                        flexShrink: 0,
                        padding: '8px 12px',
                        borderRadius: '10px',
                        border: isSelected ? '2px solid var(--color-crimson)' : '1.5px solid var(--border-color)',
                        backgroundColor: isSelected ? 'var(--bg-header)' : 'var(--bg-card)',
                        color: 'var(--color-text)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                        transition: 'all 150ms var(--transition-spring)',
                        minWidth: '135px',
                        boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '900', color: isSelected ? 'var(--color-crimson)' : 'inherit' }}>
                          {famous.name}
                        </span>
                      </div>
                      <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', fontWeight: 'bold' }}>
                        {famous.badge}
                      </span>
                      <div style={{ fontSize: '8.5px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        {famous.ratio} • {famous.temperature}°C
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Receta Recomendada por IA */}
            <div className="candy-card static" style={{ marginBottom: '16px', padding: '14px', backgroundColor: 'var(--bg-card)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '15px' }}>✨</span>
                  <span style={{ fontWeight: '900', fontSize: '12px', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
                    Asistencia IA Barista ({method})
                  </span>
                </div>
                <span style={{ fontSize: '11px', fontWeight: '900', color: 'var(--color-crimson)', background: 'var(--bg-header)', padding: '2px 8px', borderRadius: '6px' }}>{doseInG}g</span>
              </div>

              {aiError && <div style={{ color: '#E53E3E', fontSize: '11px', fontWeight: 'bold', marginTop: '8px' }}>⚠️ {aiError}</div>}

              {aiRecommendation ? (
                <div style={{ marginTop: '12px', padding: '12px', backgroundColor: 'var(--bg-canvas)', border: '1.5px solid var(--border-color)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* Badges de Parámetros Clave */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center' }}>
                    <div style={{ background: 'var(--bg-card)', padding: '8px 6px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Ratio / Agua</div>
                      <strong style={{ fontSize: '12px', color: 'var(--color-crimson)' }}>{aiRecommendation.ratio} ({aiRecommendation.water_total_g || Math.round(doseInG * 15)}g)</strong>
                    </div>
                    <div style={{ background: 'var(--bg-card)', padding: '8px 6px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Temp</div>
                      <strong style={{ fontSize: '12px' }}>{aiRecommendation.temperature}°C</strong>
                    </div>
                    <div style={{ background: 'var(--bg-card)', padding: '8px 6px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Tiempo</div>
                      <strong style={{ fontSize: '12px' }}>{aiRecommendation.brew_time}</strong>
                    </div>
                  </div>

                  {/* Sub-pestañas para organizar Vertidos, Molinos y Pasos */}
                  <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', marginTop: '4px' }}>
                    <button type="button" className={`filter-chip ${aiSubTab === 'pours' ? 'active' : ''}`} onClick={() => setAiSubTab('pours')} style={{ padding: '4px 10px', fontSize: '10.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Droplet size={12} /> Vertidos
                    </button>
                    <button type="button" className={`filter-chip ${aiSubTab === 'grinders' ? 'active' : ''}`} onClick={() => setAiSubTab('grinders')} style={{ padding: '4px 10px', fontSize: '10.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Settings2 size={12} /> Molinos
                    </button>
                    <button type="button" className={`filter-chip ${aiSubTab === 'steps' ? 'active' : ''}`} onClick={() => setAiSubTab('steps')} style={{ padding: '4px 10px', fontSize: '10.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ListOrdered size={12} /> Pasos
                    </button>
                  </div>

                  {/* Sub-Contenido: Vertidos */}
                  {aiSubTab === 'pours' && aiRecommendation.pours && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {aiRecommendation.pours.map((p, idx) => (
                        <div key={idx} style={{ padding: '8px 10px', background: 'var(--bg-card)', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '11px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: 'var(--color-crimson)' }}>
                            <span>{p.step}. {p.label} (+{p.water_g || p.water}g)</span>
                            <span style={{ fontFamily: 'var(--font-mono)' }}>⏱️ {p.time}</span>
                          </div>
                          {p.description && <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{p.description}</div>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Sub-Contenido: Molinos */}
                  {aiSubTab === 'grinders' && (
                    <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-card)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div style={{ padding: '6px 8px', background: 'var(--bg-header)', borderRadius: '6px' }}>
                          <strong style={{ color: 'var(--color-crimson)', display: 'block', fontSize: '10.5px' }}>1Zpresso J-Max:</strong>
                          <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
                            {aiRecommendation.jmax_rot !== undefined ? `${aiRecommendation.jmax_rot}.${aiRecommendation.jmax_num}.${aiRecommendation.jmax_click}` : (aiRecommendation.grinders?.jmax || '1.3.5')}
                          </span>
                          <div style={{ fontSize: '9px', color: 'var(--color-text-muted)' }}>8.8 µm/clic • 90 c/rot</div>
                        </div>

                        <div style={{ padding: '6px 8px', background: 'var(--bg-header)', borderRadius: '6px' }}>
                          <strong style={{ color: 'var(--color-crimson)', display: 'block', fontSize: '10.5px' }}>Femobook A2:</strong>
                          <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
                            {aiRecommendation.grinders?.femobook_a2 || '60 clics (1.5 Rot.)'}
                          </span>
                          <div style={{ fontSize: '9px', color: 'var(--color-text-muted)' }}>18 µm/clic • 40 c/rot</div>
                        </div>
                      </div>

                      {aiRecommendation.grinders && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginTop: '2px', paddingTop: '6px', borderTop: '1px dashed var(--border-color)', fontSize: '9.5px' }}>
                          <div><strong>Comandante:</strong><br/>{aiRecommendation.grinders.comandante}</div>
                          <div><strong>Timemore:</strong><br/>{aiRecommendation.grinders.timemore}</div>
                          <div><strong>Baratza:</strong><br/>{aiRecommendation.grinders.baratza}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sub-Contenido: Pasos */}
                  {aiSubTab === 'steps' && aiRecommendation.steps && (
                    <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                      {aiRecommendation.steps.map((st, i) => <li key={i} style={{ marginBottom: '4px' }}>{st}</li>)}
                    </ol>
                  )}

                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <button type="button" className="btn-candy primary" onClick={handleApplyAiRecipe} style={{ flex: 1, padding: '8px', fontSize: '11px', minHeight: '36px' }}>
                      Aplicar al Formulario
                    </button>
                    <button type="button" className="btn-candy" onClick={() => setAiRecommendation(null)} style={{ padding: '8px 12px', fontSize: '11px', minHeight: '36px', margin: 0 }}>
                      Cerrar
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" className="btn-candy" onClick={handleAiRecommend} disabled={aiLoading} style={{ width: '100%', marginTop: '10px', padding: '8px', fontSize: '11.5px', minHeight: '38px' }}>
                  {aiLoading ? 'Generando receta con Thinking Mode... 🧠' : 'Diseñar Receta IA ✨'}
                </button>
              )}
            </div>

            {/* Formulario Bento Grid con Steppers Cupertino */}
            <div className="bento-grid" style={{ gap: '10px', marginBottom: '16px' }}>
              <div className="bento-widget accent">
                <div className="bento-header">
                  <span>Dosis In</span>
                  <Scale size={14} />
                </div>
                <div className="bento-value-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px', marginTop: '4px' }}>
                  <button
                    type="button"
                    className="cupertino-stepper-btn"
                    onClick={() => {
                      if (navigator.vibrate) navigator.vibrate(8);
                      setDoseInG(d => Math.max(5, parseFloat((d - 0.5).toFixed(1))));
                    }}
                    aria-label="Menos dosis"
                  >
                    -
                  </button>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center' }}>
                    <input
                      type="number"
                      step="0.5"
                      value={doseInG}
                      onChange={(e) => setDoseInG(parseFloat(e.target.value) || 0)}
                      style={{ width: '56px', textAlign: 'center', fontSize: '19px', fontWeight: '800', border: 'none', background: 'transparent', padding: 0 }}
                    />
                    <span className="unit" style={{ marginLeft: '2px' }}>g</span>
                  </div>
                  <button
                    type="button"
                    className="cupertino-stepper-btn"
                    onClick={() => {
                      if (navigator.vibrate) navigator.vibrate(8);
                      setDoseInG(d => Math.min(50, parseFloat((d + 0.5).toFixed(1))));
                    }}
                    aria-label="Más dosis"
                  >
                    +
                  </button>
                </div>
              </div>

              {method === 'Espresso' ? (
                <div className="bento-widget accent">
                  <div className="bento-header">
                    <span>Output</span>
                    <Droplet size={14} />
                  </div>
                  <div className="bento-value-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px', marginTop: '4px' }}>
                    <button
                      type="button"
                      className="cupertino-stepper-btn"
                      onClick={() => {
                        if (navigator.vibrate) navigator.vibrate(8);
                        setDoseOutG(d => Math.max(5, parseFloat((d - 1).toFixed(1))));
                      }}
                      aria-label="Menos output"
                    >
                      -
                    </button>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center' }}>
                      <input
                        type="number"
                        step="0.5"
                        value={doseOutG}
                        onChange={(e) => setDoseOutG(parseFloat(e.target.value) || 0)}
                        style={{ width: '56px', textAlign: 'center', fontSize: '19px', fontWeight: '800', border: 'none', background: 'transparent', padding: 0 }}
                      />
                      <span className="unit" style={{ marginLeft: '2px' }}>g</span>
                    </div>
                    <button
                      type="button"
                      className="cupertino-stepper-btn"
                      onClick={() => {
                        if (navigator.vibrate) navigator.vibrate(8);
                        setDoseOutG(d => Math.min(100, parseFloat((d + 1).toFixed(1))));
                      }}
                      aria-label="Más output"
                    >
                      +
                    </button>
                  </div>
                  <div className="bento-info" style={{ marginTop: '4px' }}>
                    Ratio ~1:{doseInG > 0 ? (doseOutG / doseInG).toFixed(1) : 2}
                  </div>
                </div>
              ) : (
                <div className="bento-widget accent">
                  <div className="bento-header">
                    <span>Ratio 1:</span>
                    <Gauge size={14} />
                  </div>
                  <div className="bento-value-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px', marginTop: '4px' }}>
                    <button
                      type="button"
                      className="cupertino-stepper-btn"
                      onClick={() => {
                        if (navigator.vibrate) navigator.vibrate(8);
                        setRatioVal(r => Math.max(8, parseFloat((r - 0.5).toFixed(1))));
                      }}
                      aria-label="Menos ratio"
                    >
                      -
                    </button>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center' }}>
                      <input
                        type="number"
                        step="0.5"
                        value={ratioVal}
                        onChange={(e) => setRatioVal(parseFloat(e.target.value) || 0)}
                        style={{ width: '56px', textAlign: 'center', fontSize: '19px', fontWeight: '800', border: 'none', background: 'transparent', padding: 0 }}
                      />
                    </div>
                    <button
                      type="button"
                      className="cupertino-stepper-btn"
                      onClick={() => {
                        if (navigator.vibrate) navigator.vibrate(8);
                        setRatioVal(r => Math.min(25, parseFloat((r + 0.5).toFixed(1))));
                      }}
                      aria-label="Más ratio"
                    >
                      +
                    </button>
                  </div>
                  <div className="bento-info" style={{ marginTop: '4px' }}>
                    ~{Math.round(doseInG * ratioVal)}g agua
                  </div>
                </div>
              )}

              <div className="bento-widget">
                <div className="bento-header">
                  <span>Temp Agua</span>
                  <Thermometer size={14} />
                </div>
                <div className="bento-value-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px', marginTop: '4px' }}>
                  <button
                    type="button"
                    className="cupertino-stepper-btn"
                    onClick={() => {
                      if (navigator.vibrate) navigator.vibrate(8);
                      setWaterTemp(t => Math.max(70, t - 1));
                    }}
                    aria-label="Menos temperatura"
                  >
                    -
                  </button>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center' }}>
                    <input
                      type="number"
                      value={waterTemp}
                      onChange={(e) => setWaterTemp(parseInt(e.target.value) || 93)}
                      style={{ width: '52px', textAlign: 'center', fontSize: '19px', fontWeight: '800', border: 'none', background: 'transparent', padding: 0 }}
                    />
                    <span className="unit" style={{ marginLeft: '2px' }}>°C</span>
                  </div>
                  <button
                    type="button"
                    className="cupertino-stepper-btn"
                    onClick={() => {
                      if (navigator.vibrate) navigator.vibrate(8);
                      setWaterTemp(t => Math.min(100, t + 1));
                    }}
                    aria-label="Más temperatura"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="bento-widget">
                <div className="bento-header">
                  <span>Tiempo</span>
                  <Timer size={14} />
                </div>
                <div className="bento-value-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '4px', minHeight: '34px' }}>
                  <input
                    type="text"
                    style={{ fontSize: '19px', fontWeight: '800', textAlign: 'center', width: '90px', border: 'none', background: 'transparent' }}
                    value={brewTime}
                    onChange={(e) => setBrewTime(e.target.value)}
                  />
                </div>
                <div className="bento-info" style={{ marginTop: '4px' }}>
                  mm:ss objetivo
                </div>
              </div>

              {/* Manual Grinder Selector & Dedicated Controls */}
              <div className="bento-widget bento-full-row accent">
                <div className="bento-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Coffee size={15} />
                    <span style={{ fontWeight: '800' }}>Molino</span>
                  </div>
                  {/* Selector Pills */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => setGrinderType('jmax')}
                      style={{
                        padding: '4px 10px',
                        fontSize: '10.5px',
                        fontWeight: '800',
                        borderRadius: '6px',
                        border: grinderType === 'jmax' ? '1.5px solid var(--color-crimson)' : '1px solid var(--border-color)',
                        backgroundColor: grinderType === 'jmax' ? 'var(--color-crimson)' : 'var(--bg-canvas)',
                        color: grinderType === 'jmax' ? '#FFFFFF' : 'var(--color-text)',
                        cursor: 'pointer'
                      }}
                    >
                      J-Max
                    </button>
                    <button
                      type="button"
                      onClick={() => setGrinderType('femobook')}
                      style={{
                        padding: '4px 10px',
                        fontSize: '10.5px',
                        fontWeight: '800',
                        borderRadius: '6px',
                        border: grinderType === 'femobook' ? '1.5px solid var(--color-crimson)' : '1px solid var(--border-color)',
                        backgroundColor: grinderType === 'femobook' ? 'var(--color-crimson)' : 'var(--bg-canvas)',
                        color: grinderType === 'femobook' ? '#FFFFFF' : 'var(--color-text)',
                        cursor: 'pointer'
                      }}
                    >
                      Femobook A2
                    </button>
                    <button
                      type="button"
                      onClick={() => setGrinderType('comandante')}
                      style={{
                        padding: '4px 10px',
                        fontSize: '10.5px',
                        fontWeight: '800',
                        borderRadius: '6px',
                        border: grinderType === 'comandante' ? '1.5px solid var(--color-crimson)' : '1px solid var(--border-color)',
                        backgroundColor: grinderType === 'comandante' ? 'var(--color-crimson)' : 'var(--bg-canvas)',
                        color: grinderType === 'comandante' ? '#FFFFFF' : 'var(--color-text)',
                        cursor: 'pointer'
                      }}
                    >
                      Comandante
                    </button>
                  </div>
                </div>

                {/* 1Zpresso J-Max Controls */}
                {grinderType === 'jmax' && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0' }}>
                      <select className="candy-input" style={{ flex: 1, textAlign: 'center', margin: 0, padding: '8px', fontSize: '12px' }} value={jmaxRot} onChange={(e) => setJmaxRot(parseInt(e.target.value) || 0)}>
                        {[0, 1, 2, 3, 4].map(v => <option key={v} value={v}>Rot: {v}</option>)}
                      </select>
                      <select className="candy-input" style={{ flex: 1, textAlign: 'center', margin: 0, padding: '8px', fontSize: '12px' }} value={jmaxNum} onChange={(e) => setJmaxNum(parseInt(e.target.value) || 0)}>
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(v => <option key={v} value={v}>Num: {v}</option>)}
                      </select>
                      <select className="candy-input" style={{ flex: 1, textAlign: 'center', margin: 0, padding: '8px', fontSize: '12px' }} value={jmaxClick} onChange={(e) => setJmaxClick(parseInt(e.target.value) || 0)}>
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(v => <option key={v} value={v}>Clic: {v}</option>)}
                      </select>
                    </div>
                    <div className="bento-info" style={{ marginTop: '4px', fontSize: '10.5px' }}>1Zpresso J-Max: {jmaxRot}.{jmaxNum}.{jmaxClick} (~{currentMicrons} µm)</div>
                  </>
                )}

                {/* Femobook A2 Controls */}
                {grinderType === 'femobook' && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 0' }}>
                      <button 
                        type="button" 
                        className="btn-candy" 
                        style={{ minWidth: '40px', minHeight: '38px', padding: '6px 10px', margin: 0, fontSize: '12px', fontWeight: 'bold' }} 
                        onClick={() => setFemobookClicks(prev => Math.max(0, prev - 5))}
                      >
                        -5
                      </button>
                      <button 
                        type="button" 
                        className="btn-candy" 
                        style={{ minWidth: '38px', minHeight: '38px', padding: '6px 8px', margin: 0, fontSize: '12px', fontWeight: 'bold' }} 
                        onClick={() => setFemobookClicks(prev => Math.max(0, prev - 1))}
                      >
                        -1
                      </button>
                      <div style={{ flex: 1, textAlign: 'center' }}>
                        <input 
                          type="number" 
                          className="candy-input" 
                          style={{ width: '100%', textAlign: 'center', margin: 0, padding: '8px', fontSize: '16px', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}
                          value={femobookClicks}
                          min="0"
                          max="120"
                          onChange={(e) => setFemobookClicks(Math.max(0, Math.min(120, parseInt(e.target.value) || 0)))}
                        />
                      </div>
                      <button 
                        type="button" 
                        className="btn-candy" 
                        style={{ minWidth: '38px', minHeight: '38px', padding: '6px 8px', margin: 0, fontSize: '12px', fontWeight: 'bold' }} 
                        onClick={() => setFemobookClicks(prev => Math.min(120, prev + 1))}
                      >
                        +1
                      </button>
                      <button 
                        type="button" 
                        className="btn-candy" 
                        style={{ minWidth: '40px', minHeight: '38px', padding: '6px 10px', margin: 0, fontSize: '12px', fontWeight: 'bold' }} 
                        onClick={() => setFemobookClicks(prev => Math.min(120, prev + 5))}
                      >
                        +5
                      </button>
                    </div>
                    <div className="bento-info" style={{ marginTop: '4px', fontSize: '10.5px' }}>
                      Femobook A2: {femobookClicks} clics ({(femobookClicks / 40).toFixed(2)} Rot.) • ~{currentMicrons} µm
                    </div>
                  </>
                )}

                {/* Comandante C40 Controls */}
                {grinderType === 'comandante' && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0' }}>
                      <button 
                        type="button" 
                        className="btn-candy" 
                        style={{ minWidth: '40px', minHeight: '38px', padding: '6px 10px', margin: 0, fontSize: '12px', fontWeight: 'bold' }} 
                        onClick={() => setComandanteClicks(prev => Math.max(0, prev - 1))}
                      >
                        -1
                      </button>
                      <div style={{ flex: 1, textAlign: 'center' }}>
                        <input 
                          type="number" 
                          className="candy-input" 
                          style={{ width: '100%', textAlign: 'center', margin: 0, padding: '8px', fontSize: '16px', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}
                          value={comandanteClicks}
                          min="0"
                          max="45"
                          onChange={(e) => setComandanteClicks(Math.max(0, Math.min(45, parseInt(e.target.value) || 0)))}
                        />
                      </div>
                      <button 
                        type="button" 
                        className="btn-candy" 
                        style={{ minWidth: '40px', minHeight: '38px', padding: '6px 10px', margin: 0, fontSize: '12px', fontWeight: 'bold' }} 
                        onClick={() => setComandanteClicks(prev => Math.min(45, prev + 1))}
                      >
                        +1
                      </button>
                    </div>
                    <div className="bento-info" style={{ marginTop: '4px', fontSize: '10.5px' }}>
                      Comandante C40: {comandanteClicks} clics • ~{currentMicrons} µm
                    </div>
                  </>
                )}
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

            {isOwner ? (
              <button type="submit" className="btn-candy primary" style={{ width: '100%', marginTop: '12px', fontSize: '14px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Save size={18} />
                Guardar Bitácora
              </button>
            ) : (
              <button 
                type="button" 
                onClick={onRequireAuth} 
                className="btn-candy" 
                style={{ width: '100%', marginTop: '12px', fontSize: '12.5px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: 0.9, cursor: 'pointer', background: 'var(--bg-canvas)' }}
              >
                🔒 Solo el propietario puede registrar extracciones {currentUser ? '' : '(Iniciar Sesión)'}
              </button>
            )}
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
              {isOwner ? (
                <button className="btn-candy primary" onClick={handleRepeatLastRecipe} style={{ width: '100%', marginTop: '8px', padding: '6px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <Zap size={12} />
                  ⚡ Repetir y Guardar esta Receta (-1 Tubo)
                </button>
              ) : (
                <button className="btn-candy" onClick={() => handleLoadRecipeToForm(lastRecipe)} style={{ width: '100%', marginTop: '8px', padding: '6px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <Zap size={12} />
                  ⚡ Cargar Parámetros al Preparador
                </button>
              )}
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

          {/* Tabla de Equivalencias de Molinos (J-Max vs Femobook A2 vs Comandante) */}
          <div className="candy-card static" style={{ padding: '14px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '8px', color: 'var(--color-crimson)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              ⚙️ Equivalencias de Molienda
            </div>
            <p style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', margin: '0 0 10px 0' }}>
              Comparativa física entre molinos manuales y eléctricos de precisión:
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: '9.5px', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--color-text-muted)' }}>
                    <th style={{ padding: '4px 6px' }}>Método</th>
                    <th style={{ padding: '4px 6px' }}>1Zpresso J-Max<br/><span style={{ fontWeight: 'normal', fontSize: '8px' }}>(8.8µm)</span></th>
                    <th style={{ padding: '4px 6px' }}>Femobook A2<br/><span style={{ fontWeight: 'normal', fontSize: '8px' }}>(18µm • 40c/r)</span></th>
                    <th style={{ padding: '4px 6px' }}>Comandante C40<br/><span style={{ fontWeight: 'normal', fontSize: '8px' }}>(30µm)</span></th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px dashed var(--border-color)' }}>
                    <td style={{ padding: '6px', fontWeight: 'bold' }}>Espresso</td>
                    <td style={{ padding: '6px' }}>1.2.5 – 1.4.2</td>
                    <td style={{ padding: '6px', color: 'var(--color-crimson)', fontWeight: 'bold' }}>3 – 10 clics</td>
                    <td style={{ padding: '6px' }}>8 – 12 clics</td>
                  </tr>
                  <tr style={{ borderBottom: '1px dashed var(--border-color)' }}>
                    <td style={{ padding: '6px', fontWeight: 'bold' }}>Moka / AeroPress</td>
                    <td style={{ padding: '6px' }}>1.8.0 – 2.1.0</td>
                    <td style={{ padding: '6px', color: 'var(--color-crimson)', fontWeight: 'bold' }}>18 – 45 clics</td>
                    <td style={{ padding: '6px' }}>14 – 18 clics</td>
                  </tr>
                  <tr style={{ borderBottom: '1px dashed var(--border-color)' }}>
                    <td style={{ padding: '6px', fontWeight: 'bold' }}>V60 / Filtrado</td>
                    <td style={{ padding: '6px' }}>2.3.0 – 2.7.0</td>
                    <td style={{ padding: '6px', color: 'var(--color-crimson)', fontWeight: 'bold' }}>50 – 75 clics (1.5R)</td>
                    <td style={{ padding: '6px' }}>22 – 26 clics</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '6px', fontWeight: 'bold' }}>Prensa / Cupping</td>
                    <td style={{ padding: '6px' }}>3.0.0 – 3.5.0</td>
                    <td style={{ padding: '6px', color: 'var(--color-crimson)', fontWeight: 'bold' }}>85 – 110 clics</td>
                    <td style={{ padding: '6px' }}>28 – 34 clics</td>
                  </tr>
                </tbody>
              </table>
            </div>
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

      {/* Modal de Compartir Ticket POS & Carta de Cafés */}
      {shareImage && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 11000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '12px', boxSizing: 'border-box'
        }} onClick={() => { setShareImage(null); setShareStatus(''); }}>
          <div className="candy-card static animate-entrance" style={{
            maxWidth: '480px', width: '100%',
            maxHeight: '92vh',
            padding: '16px', boxSizing: 'border-box',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            display: 'flex', flexDirection: 'column', gap: '10px',
            overflowY: 'auto'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              
              {/* Row 1: Scope Selector (Ficha de este café vs Carta Completa) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShareScope('single');
                      handleShareBatchCard(shareIncludeRecipe, shareTemplate, 'single');
                    }}
                    style={{
                      padding: '5px 10px',
                      fontSize: '11px',
                      borderRadius: '6px',
                      border: shareScope === 'single' ? '1px solid var(--color-crimson)' : '1px solid var(--border-color)',
                      backgroundColor: shareScope === 'single' ? '#FFFFFF' : 'var(--bg-canvas)',
                      fontWeight: shareScope === 'single' ? '800' : '500',
                      color: shareScope === 'single' ? 'var(--color-crimson)' : 'var(--color-text)',
                      cursor: 'pointer'
                    }}
                  >
                    🎫 Ficha de este Café
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShareScope('menu');
                      handleShareBatchCard(shareIncludeRecipe, shareTemplate, 'menu');
                    }}
                    style={{
                      padding: '5px 10px',
                      fontSize: '11px',
                      borderRadius: '6px',
                      border: shareScope === 'menu' ? '1px solid var(--color-crimson)' : '1px solid var(--border-color)',
                      backgroundColor: shareScope === 'menu' ? '#FFFFFF' : 'var(--bg-canvas)',
                      fontWeight: shareScope === 'menu' ? '800' : '500',
                      color: shareScope === 'menu' ? 'var(--color-crimson)' : 'var(--color-text)',
                      cursor: 'pointer'
                    }}
                  >
                    📋 Carta de Cafés ({batches && batches.length > 0 ? batches.length : 1})
                  </button>
                </div>

                <button 
                  type="button" 
                  onClick={() => setShareImage(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--color-text-muted)' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Row 2: Sub-options (Only when scope is single: Solo Grano vs Con Receta) */}
              {shareScope === 'single' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-text)' }}>
                    {batch?.name}
                  </span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button 
                      type="button" 
                      onClick={() => { setShareIncludeRecipe(false); handleShareBatchCard(false, shareTemplate, 'single'); }}
                      style={{ padding: '3px 8px', fontSize: '10px', borderRadius: '4px', border: !shareIncludeRecipe ? '1px solid var(--color-crimson)' : '1px solid var(--border-color)', backgroundColor: !shareIncludeRecipe ? 'rgba(188, 84, 73, 0.08)' : '#FFFFFF', color: !shareIncludeRecipe ? 'var(--color-crimson)' : 'var(--color-text)', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      🌾 Solo Grano
                    </button>
                    <button 
                      type="button" 
                      onClick={() => { setShareIncludeRecipe(true); handleShareBatchCard(true, shareTemplate, 'single'); }}
                      style={{ padding: '3px 8px', fontSize: '10px', borderRadius: '4px', border: shareIncludeRecipe ? '1px solid var(--color-crimson)' : '1px solid var(--border-color)', backgroundColor: shareIncludeRecipe ? 'rgba(188, 84, 73, 0.08)' : '#FFFFFF', color: shareIncludeRecipe ? 'var(--color-crimson)' : 'var(--color-text)', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      🧾 Con Receta
                    </button>
                  </div>
                </div>
              )}

              {/* Aesthetic Template Selector */}
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center', background: 'var(--bg-canvas)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '9.5px', fontWeight: 'bold', color: 'var(--color-text-muted)', paddingLeft: '4px' }}>ESTILO:</span>
                {[
                  { id: 'craft', label: '☕ Artesanal' },
                  { id: 'minimal', label: '🏷️ Nórdico' },
                  { id: 'dark', label: '🌑 Tokyo Dark' }
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => { setShareTemplate(t.id); handleShareBatchCard(shareIncludeRecipe, t.id, shareScope); }}
                    style={{
                      flex: 1,
                      padding: '4px 6px',
                      fontSize: '9.5px',
                      borderRadius: '6px',
                      border: shareTemplate === t.id ? '1px solid var(--color-crimson)' : 'none',
                      backgroundColor: shareTemplate === t.id ? '#FFFFFF' : 'transparent',
                      fontWeight: shareTemplate === t.id ? '800' : '500',
                      color: shareTemplate === t.id ? 'var(--color-crimson)' : 'var(--color-text)',
                      boxShadow: shareTemplate === t.id ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ textAlign: 'center', backgroundColor: '#F1F5F9', borderRadius: '10px', padding: '6px', overflow: 'hidden', maxHeight: '52vh', overflowY: 'auto' }}>
              <img 
                src={shareImage} 
                alt="Ticket de café POS o Carta" 
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                  borderRadius: '4px', 
                  display: 'block',
                  margin: '0 auto',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.12)'
                }} 
              />
            </div>
            
            {shareStatus && (
              <div style={{
                background: shareStatus.includes('❌') ? '#FEE2E2' : '#ECFDF5',
                color: shareStatus.includes('❌') ? '#991B1B' : '#065F46',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '11.5px',
                fontWeight: '600',
                textAlign: 'center'
              }}>
                {shareStatus}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '2px' }}>
              <button 
                type="button" 
                className="btn-candy" 
                style={{ padding: '10px 8px', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11px', fontWeight: '700' }} 
                onClick={handleCopyShareText}
              >
                <ClipboardCopy size={15} strokeWidth={2.2} />
                Copiar Texto (WhatsApp)
              </button>

              <button 
                type="button" 
                className="btn-candy primary" 
                style={{ padding: '10px 8px', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11px', fontWeight: '700' }} 
                onClick={handleNativeShare}
              >
                <Share2 size={15} strokeWidth={2.2} />
                Compartir PNG (2x)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
