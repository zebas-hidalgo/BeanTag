import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { formatLocalDateStr } from '../utils/date';
import { getScaIcon, stripEmojis, getScaColorForNote } from '../utils/scaIcons';
import { Calculator, Scale, Droplet, Thermometer, Gauge, Timer, Coffee, Save, Edit2, Trash2, ArrowLeft, Settings2, X, Edit3, Nfc, Filter, Zap, BookOpen, ListOrdered, Mountain, Play, Share2, Image as ImageIcon, Award, Sparkles, ClipboardCopy, Layers, SlidersHorizontal, Cylinder, Compass, Target, Trophy, Sliders, Lightbulb, Check } from 'lucide-react';
import { copyToClipboard } from '../utils/clipboard';
import { apiUrl } from '../utils/api';
import { generateRecipeCardImage, generateCoffeeMenuCardImage, generateCoffeeMenuText, generateCoffeeStickerImage } from '../utils/cardGenerator';
import { FAMOUS_RECIPES } from '../utils/famousRecipes';
import ScaRadarChart from './ScaRadarChart';
import DialInAssistant from './DialInAssistant';
import DialInTimeline from './DialInTimeline';
import { GRINDERS, getGrinderConfig, scaleGrinderSettingForDose, calculateDoseDeltaMicrons } from '../utils/grinders';

import BatchHeaderCard from './batch/BatchHeaderCard';
import RecipeParamsGrid from './batch/RecipeParamsGrid';
import GrinderSyncMatrix from './batch/GrinderSyncMatrix';

const BrewGuideModal = lazy(() => import('./BrewGuideModal'));

const getRoastDotColor = (roast) => {
  const r = String(roast || '').toLowerCase();
  if (r.includes('oscuro') || r.includes('dark') || r.includes('frances') || r.includes('italiano')) {
    return '#475569';
  }
  if (r.includes('medio') || r.includes('medium')) {
    return '#B45309';
  }
  return '#D97706';
};

const calculateMicrons = (rot, num, click) => {
  const r = parseInt(rot) || 0;
  const n = parseInt(num) || 0;
  const c = parseInt(click) || 0;
  const totalClicks = (r * 90) + (n * 10) + c;
  return Math.round(totalClicks * 8.8);
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
        brewFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
      }, 350);
    }
  }, [batchId]);
  
  // Form fields (Default: NextLevel Pulsar Mini)
  const [method, setMethod] = useState('NextLevel Pulsar Mini');
  
  // Grinder Selector State (8 Supported Grinders)
  const [grinderType, setGrinderType] = useState(() => localStorage.getItem('default-grinder') || 'jmax');
  
  // 1Zpresso J-Max Steppers (Default: 1.5.0)
  const [jmaxRot, setJmaxRot] = useState(1);
  const [jmaxNum, setJmaxNum] = useState(5);
  const [jmaxClick, setJmaxClick] = useState(0);

  // 1Zpresso K-Ultra Dial (1.0 - 15.0, default 9.0)
  const [kUltraDial, setKUltraDial] = useState(9.0);

  // Fellow Ode Gen 2 Setting (1.0 - 11.0, default 5.0)
  const [odeDial, setOdeDial] = useState(5.0);

  // Femobook A2 State (0 - 120 clicks, default 60 = 1.5 Rot.)
  const [femobookClicks, setFemobookClicks] = useState(60);

  // Comandante C40 State (0 - 45 clicks, default 24)
  const [comandanteClicks, setComandanteClicks] = useState(24);

  // Kingrinder K6 State (0 - 180 clicks, default 90 = 1.5 Rot.)
  const [kingrinderClicks, setKingrinderClicks] = useState(90);

  // Timemore C2/C3 State (6 - 36 clicks, default 18)
  const [timemoreClicks, setTimemoreClicks] = useState(18);

  // Baratza Encore/ESP State (1 - 40 steps, default 15)
  const [baratzaStep, setBaratzaStep] = useState(15);
  
  // Smart Ratio (Default: 16.67 for ~300g water with 18g dose)
  const [ratioVal, setRatioVal] = useState(16.67);

  // Advanced Coffee Fields (Default: 18.0g for Pulsar Mini)
  const [doseInG, setDoseInG] = useState(18.0);
  const baseDoseRef = useRef(18.0);
  const baseGrinderRef = useRef({
    jmax: { rot: 1, num: 5, click: 0 },
    k_ultra: 9.0,
    ode_gen2: 5.0,
    femobook: 60,
    comandante: 24,
    kingrinder: 90,
    timemore: 18,
    baratza: 15
  });
  const [doseAdjustmentFeedback, setDoseAdjustmentFeedback] = useState(null);
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

  // Interactive Barista Brew Guide Modal States
  const [isBrewGuideOpen, setIsBrewGuideOpen] = useState(false);
  const [activeBrewRecipe, setActiveBrewRecipe] = useState(null);

  // Main Tab Navigation State ('brew' | 'history' | 'tools')
  const [activeTab, setActiveTab] = useState('brew');
  const [aiSubTab, setAiSubTab] = useState('pours');

  // Recipe History View Mode ('timeline' | 'cards')
  const [recipeViewMode, setRecipeViewMode] = useState('timeline');

  // Interactive Calculator State
  const [calcVisible, setCalcVisible] = useState(false);
  const [calcDose, setCalcDose] = useState(15.0);
  const [calcRatio, setCalcRatio] = useState(16.0);
  const [calcWater, setCalcWater] = useState(240);

  // Share / Export Card States
  const [shareImage, setShareImage] = useState(null);
  const [shareScope, setShareScope] = useState('single'); // 'single' | 'sticker' | 'menu'
  const [stickerTransparent, setStickerTransparent] = useState(false);
  const [stickerOrientation, setStickerOrientation] = useState('horizontal'); // 'horizontal' | 'vertical'
  const [shareIncludeRecipe, setShareIncludeRecipe] = useState(false); // Default to bean-only for batch detail
  const [shareTemplate, setShareTemplate] = useState(() => {
    try {
      const pref = localStorage.getItem('beantag-share-style');
      if (pref === 'studio') return 'studio';
      if (pref === 'neobrutalist') return 'neobrutalist';
      if (pref === 'diner' || pref === 'aurora') return 'diner';
      if (pref === 'kissaten' || pref === 'hangtag') return 'kissaten';
      if (pref === 'blueprint') return 'blueprint';
      return 'studio';
    } catch (e) {
      return 'studio';
    }
  });
  const [shareStatus, setShareStatus] = useState('');

  const handleShareBatchCard = async (incRecipe = shareIncludeRecipe, templ = shareTemplate, scope = shareScope, transparent = stickerTransparent, orientation = stickerOrientation) => {
    if (!batch) return;
    setShareScope(scope);
    setShareStatus('Generando imagen...');

    // Construct recipe/batch object with full telemetry & terroir
    const activePours = (aiRecommendation && aiRecommendation.pours && aiRecommendation.pours.length > 0)
      ? aiRecommendation.pours
      : (batch?.recipes && batch.recipes.length > 0 && batch.recipes[0].pours ? batch.recipes[0].pours : undefined);

    const syntheticRecipe = {
      ...batch,
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
      sensory_balance: incRecipe ? sensoryBalance : batch.sensory_balance,
      sensory_body: incRecipe ? sensoryBody : batch.sensory_body,
      sensory_extraction: incRecipe ? sensoryExtraction : batch.sensory_extraction,
      notes: notes,
      pours: activePours,
      created_at: new Date().toISOString()
    };

    if (scope === 'sticker') {
      try {
        const dataUrl = await generateCoffeeStickerImage(syntheticRecipe, { template: templ, transparent, orientation, includeRecipe: incRecipe });
        setShareImage(dataUrl);
        setShareTemplate(templ);
        setShareIncludeRecipe(incRecipe);
        setShareStatus('✅ Sticker Story generado con éxito');
      } catch (err) {
        console.error("Sticker generation error:", err);
        setShareStatus('❌ Error: ' + err.message);
      }
      return;
    }

    if (scope === 'menu') {
      const targetList = Array.isArray(batches) && batches.length > 0 ? batches : [batch];
      try {
        const dataUrl = await generateCoffeeMenuCardImage(targetList, templ);
        setShareImage(dataUrl);
        setShareTemplate(templ);
        setShareStatus('✅ Carta de cafés generada con éxito');
      } catch (err) {
        console.error("Menu card generation error:", err);
        setShareStatus('❌ Error: ' + err.message);
      }
      return;
    }

    try {
      const dataUrl = await generateRecipeCardImage(syntheticRecipe, templ, incRecipe);
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
    const aiProvider = localStorage.getItem('beantag-ai-provider') || 'groq';
    const groqKey = localStorage.getItem('groq-key') || '';
    const rawGroqModel = localStorage.getItem('groq-model');
    const groqModel = (!rawGroqModel || rawGroqModel.includes('llama')) ? 'openai/gpt-oss-120b' : rawGroqModel;
    const geminiKey = localStorage.getItem('gemini-api-key') || '';
    const geminiModel = localStorage.getItem('gemini-model') || 'gemini-3.8-flash';
    const isThinking = localStorage.getItem('gemini-thinking') === 'true';

    setAiLoading(true);
    setAiError('');
    setAiRecommendation(null);

    const headers = {
      'Content-Type': 'application/json',
      'x-ai-provider': aiProvider,
      'x-groq-key': groqKey,
      'x-gemini-key': geminiKey,
      'x-ai-model': aiProvider === 'groq' ? groqModel : geminiModel,
      'x-gemini-model': geminiModel,
      'x-gemini-thinking': isThinking ? 'true' : 'false'
    };

    fetch(apiUrl('api/recommend-recipe'), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        batch_name: batch.name,
        origin: batch.origin,
        producer: batch.producer,
        variety: batch.variety,
        process: batch.process,
        altitude: batch.altitude,
        roast_level: batch.roast_level,
        roaster_notes: batch.roaster_notes || batch.notes || '',
        roast_date: batch.roast_date,
        freeze_date: batch.freeze_date,
        sca_score: batch.sca_score,
        method: method,
        dose_in_g: doseInG,
        grinder: grinderType || localStorage.getItem('default-grinder') || 'jmax'
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
      if (data._source === 'barista_fallback') {
        if (showToast) {
          showToast('⚡ Receta calculada con Motor Barista Físico (sin depender de internet)', { type: 'success', duration: 4500 });
        }
      } else if (data._source === 'groq') {
        if (showToast) showToast('¡Recomendación multivariable generada por Groq AI! ⚡', { type: 'success', duration: 3000 });
      } else {
        if (showToast) showToast('¡Recomendación multivariable generada por Gemini AI! 🧠', { type: 'success', duration: 2500 });
      }
    })
    .catch(err => {
      setAiError(err.message);
      if (showToast) showToast('Error al obtener receta de IA: ' + err.message, { type: 'error', duration: 4000 });
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
    } else if (recMethod.includes('go')) {
      setMethod('AeroPress Go');
    } else if (recMethod.includes('aero') || recMethod.includes('press')) {
      setMethod('AeroPress');
    } else if (recMethod.includes('prensa') || recMethod.includes('francesa')) {
      setMethod('Prensa Francesa');
    } else if (recMethod.includes('pulsar')) {
      setMethod('NextLevel Pulsar Mini');
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

    // Extract J-Max
    if (aiRecommendation.jmax_rot !== undefined && aiRecommendation.jmax_rot !== null) {
      setJmaxRot(parseInt(aiRecommendation.jmax_rot) || 0);
    }
    if (aiRecommendation.jmax_num !== undefined && aiRecommendation.jmax_num !== null) {
      setJmaxNum(parseInt(aiRecommendation.jmax_num) || 0);
    }
    if (aiRecommendation.jmax_click !== undefined && aiRecommendation.jmax_click !== null) {
      setJmaxClick(parseInt(aiRecommendation.jmax_click) || 0);
    }

    // Extract K-Ultra dial
    if (aiRecommendation.grinders?.k_ultra) {
      const match = String(aiRecommendation.grinders.k_ultra).match(/(\d+(?:\.\d+)?)/);
      if (match) setKUltraDial(parseFloat(match[1]) || 9.0);
    }

    // Extract Ode Gen 2 dial
    if (aiRecommendation.grinders?.ode_gen2) {
      const match = String(aiRecommendation.grinders.ode_gen2).match(/(?:Ajuste\s*)?(\d+(?:\.\d+)?)/i);
      if (match) setOdeDial(parseFloat(match[1]) || 5.0);
    }

    // Extract Femobook A2 clicks
    const femoVal = aiRecommendation.grinders?.femobook_a2 || aiRecommendation.grinders?.femobook;
    if (femoVal) {
      const match = String(femoVal).match(/(\d+)\s*clic/i) || String(femoVal).match(/(\d+)/);
      if (match) setFemobookClicks(parseInt(match[1]) || 60);
    }

    // Extract Comandante clicks
    if (aiRecommendation.grinders?.comandante) {
      const match = String(aiRecommendation.grinders.comandante).match(/(\d+)/);
      if (match) setComandanteClicks(parseInt(match[1]) || 24);
    }

    // Extract Kingrinder K6 clicks
    const kingVal = aiRecommendation.grinders?.kingrinder_k6 || aiRecommendation.grinders?.kingrinder;
    if (kingVal) {
      const match = String(kingVal).match(/(\d+)\s*clic/i) || String(kingVal).match(/(\d+)/);
      if (match) setKingrinderClicks(parseInt(match[1]) || 90);
    }

    // Extract Timemore clicks
    if (aiRecommendation.grinders?.timemore) {
      const match = String(aiRecommendation.grinders.timemore).match(/(\d+)\s*clic/i) || String(aiRecommendation.grinders.timemore).match(/(\d+)/);
      if (match) setTimemoreClicks(parseInt(match[1]) || 18);
    }

    // Extract Baratza step
    if (aiRecommendation.grinders?.baratza) {
      const match = String(aiRecommendation.grinders.baratza).match(/(?:Ajuste\s*)?(\d+)/i) || String(aiRecommendation.grinders.baratza).match(/(\d+)/);
      if (match) setBaratzaStep(parseInt(match[1]) || 15);
    }

    // Switch active grinder view if recommended
    if (aiRecommendation.active_grinder_dial?.grinder_id) {
      const gId = aiRecommendation.active_grinder_dial.grinder_id;
      if (gId === 'femobook_a2' || gId === 'femobook') setGrinderType('femobook');
      else if (gId === 'kingrinder_k6' || gId === 'kingrinder') setGrinderType('kingrinder');
      else if (GRINDERS.some(g => g.id === gId)) setGrinderType(gId);
    }

    if (aiRecommendation.notes) {
      setNotes(prev => {
        const cleanPrev = prev.replace(/\[Receta IA:.*?\]/g, '').trim();
        let runningW = 0;
        const pourSummary = aiRecommendation.pours && aiRecommendation.pours.length > 0 
          ? ` | Vertidos: ${aiRecommendation.pours.map(p => {
              const stepW = parseFloat(p.water_g || p.water) || 0;
              const totalW = p.total_water_g !== undefined ? parseFloat(p.total_water_g) : (runningW + stepW);
              runningW = totalW;
              return `${p.label} (+${stepW}g → Acum: ${totalW}g)`;
            }).join(' → ')}`
          : '';
        return `[Receta IA: ${aiRecommendation.notes}${pourSummary}] ${cleanPrev}`.trim();
      });
    }

    baseDoseRef.current = doseInG;
    baseGrinderRef.current = {
      jmax: {
        rot: aiRecommendation.jmax_rot !== undefined ? (parseInt(aiRecommendation.jmax_rot) || 0) : jmaxRot,
        num: aiRecommendation.jmax_num !== undefined ? (parseInt(aiRecommendation.jmax_num) || 0) : jmaxNum,
        click: aiRecommendation.jmax_click !== undefined ? (parseInt(aiRecommendation.jmax_click) || 0) : jmaxClick
      },
      k_ultra: aiRecommendation.grinders?.k_ultra ? (parseFloat(String(aiRecommendation.grinders.k_ultra).match(/(\d+(?:\.\d+)?)/)?.[1]) || kUltraDial) : kUltraDial,
      ode_gen2: aiRecommendation.grinders?.ode_gen2 ? (parseFloat(String(aiRecommendation.grinders.ode_gen2).match(/(?:Ajuste\s*)?(\d+(?:\.\d+)?)/i)?.[1]) || odeDial) : odeDial,
      femobook: femoVal ? (parseInt(String(femoVal).match(/(\d+)/)?.[1]) || femobookClicks) : femobookClicks,
      comandante: aiRecommendation.grinders?.comandante ? (parseInt(String(aiRecommendation.grinders.comandante).match(/(\d+)/)?.[1]) || comandanteClicks) : comandanteClicks,
      kingrinder: kingVal ? (parseInt(String(kingVal).match(/(\d+)/)?.[1]) || kingrinderClicks) : kingrinderClicks,
      timemore: aiRecommendation.grinders?.timemore ? (parseInt(String(aiRecommendation.grinders.timemore).match(/(\d+)/)?.[1]) || timemoreClicks) : timemoreClicks,
      baratza: aiRecommendation.grinders?.baratza ? (parseInt(String(aiRecommendation.grinders.baratza).match(/(?:Ajuste\s*)?(\d+)/i)?.[1]) || baratzaStep) : baratzaStep
    };
    setDoseAdjustmentFeedback(null);

    if (showToast) showToast('Receta sugerida por IA aplicada al formulario.', { type: 'success', duration: 3000 });
    setAiRecommendation(null);
  };

  const [selectedFamousRecipe, setSelectedFamousRecipe] = useState(null);

  const handleApplyFamousRecipe = (famous) => {
    setMethod(famous.method);
    const effectiveDose = famous.defaultDose || (famous.method === 'NextLevel Pulsar Mini' ? 18 : doseInG);
    if (famous.defaultDose || famous.method === 'NextLevel Pulsar Mini') {
      setDoseInG(effectiveDose);
    }
    baseDoseRef.current = effectiveDose;

    const famousFemo = famous.grinderSettings?.femobook?.clicks ?? famous.grinderSettings?.femobook_a2?.clicks ?? femobookClicks;
    const famousComandante = famous.grinderSettings?.comandante?.clicks ?? comandanteClicks;
    const famousKUltra = famous.grinderSettings?.k_ultra?.dial ?? famous.grinderSettings?.k_ultra?.clicks ?? kUltraDial;
    const famousOde = famous.grinderSettings?.ode_gen2?.dial ?? odeDial;
    const famousKing = famous.grinderSettings?.kingrinder?.clicks ?? famous.grinderSettings?.kingrinder_k6?.clicks ?? kingrinderClicks;
    const famousTimemore = famous.grinderSettings?.timemore?.clicks ?? timemoreClicks;
    const famousBaratza = famous.grinderSettings?.baratza?.step ?? famous.grinderSettings?.baratza?.clicks ?? baratzaStep;

    baseGrinderRef.current = {
      jmax: famous.grinderSettings?.jmax ? { ...famous.grinderSettings.jmax } : { rot: jmaxRot, num: jmaxNum, click: jmaxClick },
      femobook: famousFemo,
      comandante: famousComandante,
      k_ultra: famousKUltra,
      ode_gen2: famousOde,
      kingrinder: famousKing,
      timemore: famousTimemore,
      baratza: famousBaratza
    };
    setDoseAdjustmentFeedback(null);
    if (famous.ratioVal) setRatioVal(famous.ratioVal);
    else if (famous.method === 'NextLevel Pulsar Mini') setRatioVal(16.67);
    if (famous.temperature) setWaterTemp(famous.temperature);
    if (famous.brewTime) setBrewTime(famous.brewTime);

    if (famous.grinderSettings?.jmax) {
      setJmaxRot(famous.grinderSettings.jmax.rot ?? 0);
      setJmaxNum(famous.grinderSettings.jmax.num ?? 0);
      setJmaxClick(famous.grinderSettings.jmax.click ?? 0);
    }
    if (famous.grinderSettings?.femobook || famous.grinderSettings?.femobook_a2) {
      setFemobookClicks(famousFemo);
    }
    if (famous.grinderSettings?.comandante) {
      setComandanteClicks(famousComandante);
    }
    if (famous.grinderSettings?.k_ultra) {
      setKUltraDial(famousKUltra);
    }
    if (famous.grinderSettings?.ode_gen2) {
      setOdeDial(famousOde);
    }
    if (famous.grinderSettings?.kingrinder || famous.grinderSettings?.kingrinder_k6) {
      setKingrinderClicks(famousKing);
    }
    if (famous.grinderSettings?.timemore) {
      setTimemoreClicks(famousTimemore);
    }
    if (famous.grinderSettings?.baratza) {
      setBaratzaStep(famousBaratza);
    }

    const calculatedPours = famous.calculatePours ? famous.calculatePours(effectiveDose) : [];
    let runningFamousW = 0;
    const pourSummary = calculatedPours.length > 0 
      ? ` | Vertidos: ${calculatedPours.map(p => {
          const stepW = parseFloat(p.water_g) || 0;
          const totalW = p.total_water_g !== undefined ? parseFloat(p.total_water_g) : (runningFamousW + stepW);
          runningFamousW = totalW;
          return `${p.label} (+${stepW}g → Acum: ${totalW}g)`;
        }).join(' → ')}`
      : '';
    
    setNotes(prev => {
      const clean = prev.replace(/\[Receta.*?:.*?\]/g, '').trim();
      return `[${famous.name} (${famous.author}): ${famous.notes}${pourSummary}] ${clean}`.trim();
    });

    // Populate interactive assistance card so barista can follow live timings, pours and grind
    setAiRecommendation({
      method: famous.method,
      ratio: famous.ratio,
      water_total_g: Math.round(effectiveDose * (famous.ratioVal || 15)),
      temperature: famous.temperature,
      brew_time: famous.brewTime,
      grind: famous.grind,
      grind_microns: `${famous.grindMicrons} µm`,
      jmax_rot: famous.grinderSettings?.jmax?.rot,
      jmax_num: famous.grinderSettings?.jmax?.num,
      jmax_click: famous.grinderSettings?.jmax?.click,
      grinders: {
        jmax: famous.grinderSettings?.jmax?.text || (famous.grinderSettings?.jmax ? `${famous.grinderSettings.jmax.rot}.${famous.grinderSettings.jmax.num}.${famous.grinderSettings.jmax.click}` : undefined),
        k_ultra: famous.grinderSettings?.k_ultra?.text,
        ode_gen2: famous.grinderSettings?.ode_gen2?.text,
        comandante: famous.grinderSettings?.comandante?.text,
        femobook_a2: famous.grinderSettings?.femobook_a2?.text || famous.grinderSettings?.femobook?.text,
        kingrinder_k6: famous.grinderSettings?.kingrinder_k6?.text || famous.grinderSettings?.kingrinder?.text,
        timemore: famous.grinderSettings?.timemore?.text,
        baratza: famous.grinderSettings?.baratza?.text
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
            const loadedMethod = targetRecipe.method || 'V60 (Filtrado)';
            setMethod(loadedMethod);
            
            // Try parsing ratio
            if (targetRecipe.ratio && targetRecipe.ratio.includes('1:')) {
              const ratioMatch = targetRecipe.ratio.match(/1:([0-9.]+)/);
              if (ratioMatch) {
                setRatioVal(parseFloat(ratioMatch[1]) || (loadedMethod === 'NextLevel Pulsar Mini' ? 16.67 : 15.0));
              }
            } else if (loadedMethod === 'NextLevel Pulsar Mini') {
              setRatioVal(16.67);
            }
            
            // Parse grind settings and synchronize initial baseline
            let loadedJmax = { rot: 1, num: 5, click: 0 };
            let loadedFemobook = femobookClicks;
            let loadedKUltra = kUltraDial;
            let loadedOde = odeDial;
            let loadedComandante = comandanteClicks;
            let loadedKingrinder = kingrinderClicks;
            let loadedTimemore = timemoreClicks;
            let loadedBaratza = baratzaStep;

            if (targetRecipe.grind) {
              const gStr = targetRecipe.grind;
              if (gStr.includes('J-Max:')) {
                const grindParts = gStr.replace('J-Max:', '').trim().split('.');
                if (grindParts.length === 3) {
                  loadedJmax = {
                    rot: parseInt(grindParts[0]) || 1,
                    num: parseInt(grindParts[1]) || 5,
                    click: parseInt(grindParts[2]) || 0
                  };
                  setJmaxRot(loadedJmax.rot);
                  setJmaxNum(loadedJmax.num);
                  setJmaxClick(loadedJmax.click);
                }
              }
              const femoMatch = gStr.match(/Femobook(?:\s*A2)?:\s*(\d+)/i);
              if (femoMatch) {
                loadedFemobook = parseInt(femoMatch[1]) || 60;
                setFemobookClicks(loadedFemobook);
              }
              const comMatch = gStr.match(/Comandante:\s*(\d+)/i);
              if (comMatch) {
                loadedComandante = parseInt(comMatch[1]) || 24;
                setComandanteClicks(loadedComandante);
              }
              const kMatch = gStr.match(/1Zpresso K-Ultra:\s*(\d+(?:\.\d+)?)/i);
              if (kMatch) {
                loadedKUltra = parseFloat(kMatch[1]) || 9.0;
                setKUltraDial(loadedKUltra);
              }
              const odeMatch = gStr.match(/Fellow Ode(?:\s*Gen\s*2)?:\s*(?:Ajuste\s*)?(\d+(?:\.\d+)?)/i);
              if (odeMatch) {
                loadedOde = parseFloat(odeMatch[1]) || 5.0;
                setOdeDial(loadedOde);
              }
              const kinMatch = gStr.match(/Kingrinder(?:\s*K6)?:\s*(\d+)/i);
              if (kinMatch) {
                loadedKingrinder = parseInt(kinMatch[1]) || 90;
                setKingrinderClicks(loadedKingrinder);
              }
              const timeMatch = gStr.match(/Timemore:\s*(\d+)/i);
              if (timeMatch) {
                loadedTimemore = parseInt(timeMatch[1]) || 18;
                setTimemoreClicks(loadedTimemore);
              }
              const barMatch = gStr.match(/Baratza:\s*(?:Ajuste\s*)?(\d+)/i);
              if (barMatch) {
                loadedBaratza = parseInt(barMatch[1]) || 15;
                setBaratzaStep(loadedBaratza);
              }
            }

            baseGrinderRef.current = {
              jmax: loadedJmax,
              k_ultra: loadedKUltra,
              ode_gen2: loadedOde,
              femobook: loadedFemobook,
              comandante: loadedComandante,
              kingrinder: loadedKingrinder,
              timemore: loadedTimemore,
              baratza: loadedBaratza
            };

            // Pre-populate new fields
            const defaultDoseForMethod = loadedMethod === 'NextLevel Pulsar Mini' ? 18.0 : (parseFloat(data.dose_weight) || 20.0);
            const initDose = targetRecipe.dose_in_g !== null && targetRecipe.dose_in_g !== undefined ? (parseFloat(targetRecipe.dose_in_g) || defaultDoseForMethod) : defaultDoseForMethod;
            setDoseInG(initDose);
            baseDoseRef.current = initDose;
            setDoseAdjustmentFeedback(null);
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
            const defDose = parseFloat(data.dose_weight) || 20.0;
            setDoseInG(defDose);
            baseDoseRef.current = defDose;
            baseGrinderRef.current = {
              jmax: { rot: 1, num: 5, click: 0 },
              k_ultra: 9.0,
              ode_gen2: 5.0,
              femobook: 60,
              comandante: 24,
              kingrinder: 90,
              timemore: 18,
              baratza: 15
            };
            setDoseAdjustmentFeedback(null);
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
    const loadedMethod = rec.method || method;
    if (rec.method) setMethod(rec.method);
    if (rec.dose_in_g) {
      const parsed = parseFloat(rec.dose_in_g);
      if (Number.isFinite(parsed) && parsed > 0) {
        setDoseInG(parsed);
        baseDoseRef.current = parsed;
      }
    }
    if (rec.dose_out_g) setDoseOutG(rec.dose_out_g);
    if (rec.temperature) {
      const t = parseInt(rec.temperature);
      if (!isNaN(t)) setWaterTemp(t);
    }
    if (rec.brew_time) setBrewTime(rec.brew_time);
    if (rec.notes) setNotes(rec.notes);

    // Parse and set ratio
    if (rec.ratio && String(rec.ratio).includes('1:')) {
      const ratioMatch = String(rec.ratio).match(/1:([0-9.]+)/);
      if (ratioMatch) {
        setRatioVal(parseFloat(ratioMatch[1]) || (loadedMethod === 'NextLevel Pulsar Mini' ? 16.67 : 15.0));
      }
    } else if (loadedMethod === 'NextLevel Pulsar Mini') {
      setRatioVal(16.67);
    }

    // Parse grind settings and synchronize all 8 grinders
    let loadedJmax = { rot: jmaxRot, num: jmaxNum, click: jmaxClick };
    let loadedFemobook = femobookClicks;
    let loadedKUltra = kUltraDial;
    let loadedOde = odeDial;
    let loadedComandante = comandanteClicks;
    let loadedKingrinder = kingrinderClicks;
    let loadedTimemore = timemoreClicks;
    let loadedBaratza = baratzaStep;

    if (rec.grind) {
      const gStr = String(rec.grind);
      if (gStr.includes('J-Max:')) {
        setGrinderType('jmax');
        const grindParts = gStr.replace('J-Max:', '').trim().split('.');
        if (grindParts.length === 3) {
          loadedJmax = {
            rot: parseInt(grindParts[0]) || 1,
            num: parseInt(grindParts[1]) || 5,
            click: parseInt(grindParts[2]) || 0
          };
          setJmaxRot(loadedJmax.rot);
          setJmaxNum(loadedJmax.num);
          setJmaxClick(loadedJmax.click);
        }
      } else if (/Femobook/i.test(gStr)) {
        setGrinderType('femobook');
      } else if (/Comandante/i.test(gStr)) {
        setGrinderType('comandante');
      } else if (/K-Ultra/i.test(gStr)) {
        setGrinderType('k_ultra');
      } else if (/Ode/i.test(gStr)) {
        setGrinderType('ode_gen2');
      } else if (/Kingrinder/i.test(gStr)) {
        setGrinderType('kingrinder');
      } else if (/Timemore/i.test(gStr)) {
        setGrinderType('timemore');
      } else if (/Baratza/i.test(gStr)) {
        setGrinderType('baratza');
      }

      const femoMatch = gStr.match(/Femobook(?:\s*A2)?:\s*(\d+)/i);
      if (femoMatch) {
        loadedFemobook = parseInt(femoMatch[1]) || 60;
        setFemobookClicks(loadedFemobook);
      }
      const comMatch = gStr.match(/Comandante:\s*(\d+)/i);
      if (comMatch) {
        loadedComandante = parseInt(comMatch[1]) || 24;
        setComandanteClicks(loadedComandante);
      }
      const kMatch = gStr.match(/1Zpresso K-Ultra:\s*(\d+(?:\.\d+)?)/i);
      if (kMatch) {
        loadedKUltra = parseFloat(kMatch[1]) || 9.0;
        setKUltraDial(loadedKUltra);
      }
      const odeMatch = gStr.match(/Fellow Ode(?:\s*Gen\s*2)?:\s*(?:Ajuste\s*)?(\d+(?:\.\d+)?)/i);
      if (odeMatch) {
        loadedOde = parseFloat(odeMatch[1]) || 5.0;
        setOdeDial(loadedOde);
      }
      const kinMatch = gStr.match(/Kingrinder(?:\s*K6)?:\s*(\d+)/i);
      if (kinMatch) {
        loadedKingrinder = parseInt(kinMatch[1]) || 90;
        setKingrinderClicks(loadedKingrinder);
      }
      const timeMatch = gStr.match(/Timemore:\s*(\d+)/i);
      if (timeMatch) {
        loadedTimemore = parseInt(timeMatch[1]) || 18;
        setTimemoreClicks(loadedTimemore);
      }
      const barMatch = gStr.match(/Baratza:\s*(?:Ajuste\s*)?(\d+)/i);
      if (barMatch) {
        loadedBaratza = parseInt(barMatch[1]) || 15;
        setBaratzaStep(loadedBaratza);
      }
    }

    baseGrinderRef.current = {
      jmax: loadedJmax,
      k_ultra: loadedKUltra,
      ode_gen2: loadedOde,
      femobook: loadedFemobook,
      comandante: loadedComandante,
      kingrinder: loadedKingrinder,
      timemore: loadedTimemore,
      baratza: loadedBaratza
    };
    setDoseAdjustmentFeedback(null);
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
    switch (grinderType) {
      case 'k_ultra':
        return `1Zpresso K-Ultra: ${parseFloat(kUltraDial).toFixed(1)} (${Math.round(kUltraDial * 10)} clics)`;
      case 'ode_gen2':
        return `Fellow Ode Gen 2: Ajuste ${parseFloat(odeDial).toFixed(1)}`;
      case 'comandante':
        return `Comandante: ${comandanteClicks} clics`;
      case 'femobook': {
        const rot = (femobookClicks / 40).toFixed(2);
        return `Femobook A2: ${femobookClicks} clics (${rot} Rot.)`;
      }
      case 'kingrinder': {
        const rot = Math.floor(kingrinderClicks / 60);
        const sub = kingrinderClicks % 60;
        return `Kingrinder K6: ${kingrinderClicks} clics (~${rot}.${sub})`;
      }
      case 'timemore':
        return `Timemore: ${timemoreClicks} clics`;
      case 'baratza':
        return `Baratza: Ajuste ${baratzaStep}`;
      case 'jmax':
      default:
        return `J-Max: ${jmaxRot}.${jmaxNum}.${jmaxClick}`;
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

  const handleSaveTunedRecipe = async (tunedData) => {
    try {
      const waterTotalG = method === 'Espresso' ? doseOutG : Math.round(doseInG * ratioVal);
      const setTemperature = (t) => {
        const parsed = typeof t === 'number' ? t : parseInt(t, 10);
        if (!isNaN(parsed)) setWaterTemp(parsed);
      };

      const payload = {
        batch_id: batch?.id,
        method: tunedData.method || method,
        ratio: tunedData.ratio || `1:${ratioVal}`,
        grind: tunedData.grind,
        temperature: typeof tunedData.temperature === 'number' ? `${tunedData.temperature}°C` : tunedData.temperature,
        brew_time: tunedData.brew_time,
        notes: tunedData.notes,
        rating: tunedData.rating || 5,
        dose_in_g: tunedData.dose_in_g || doseInG,
        dose_out_g: tunedData.water_total_g || waterTotalG
      };

      if (typeof onSaveRecipe === 'function') {
        await onSaveRecipe(payload);
      } else {
        await fetch(apiUrl('/api/recipes'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (tunedData.temperature) setTemperature(typeof tunedData.temperature === 'number' ? tunedData.temperature : parseInt(tunedData.temperature, 10));
      if (showToast) showToast('¡Receta afinada y guardada con éxito en tu historial!', { type: 'success' });
      setIsBrewGuideOpen(false);
    } catch (err) {
      console.error('Error saving tuned recipe:', err);
      if (showToast) showToast('Error al guardar la receta afinada', { type: 'error' });
    }
  };

  const handleStartBrewGuide = (customRecipe = null) => {
    const waterTotalG = method === 'Espresso' ? doseOutG : Math.round(doseInG * ratioVal);
    const temperature = waterTemp;
    const grinderConfig = getGrinderConfig(grinderType);
    const getFormattedDialString = () => getGrindString();

    let rec = customRecipe || aiRecommendation || {
      method,
      dose_in_g: doseInG,
      water_total_g: waterTotalG,
      ratio: `1:${ratioVal}`,
      temperature: `${temperature}°C`,
      brew_time: brewTime,
      grind: getFormattedDialString ? getFormattedDialString() : (grinderConfig?.formatDial ? grinderConfig.formatDial() : `${jmaxRot}.${jmaxNum}.${jmaxClick}`),
      active_grinder_dial: {
        grinder_id: grinderType,
        dial: getFormattedDialString ? getFormattedDialString() : ''
      }
    };

    if (rec && !rec.water_total_g && (rec.dose_out_g || rec.ratio)) {
      rec = {
        ...rec,
        water_total_g: rec.dose_out_g || Math.round((parseFloat(rec.dose_in_g) || doseInG) * (parseFloat(String(rec.ratio || '').replace('1:', '')) || ratioVal))
      };
    }

    setActiveBrewRecipe(rec);
    setIsBrewGuideOpen(true);
  };



  // R3: Skeleton loading state
  if (!batch) return (
    <div>
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
    <div style={{ textAlign: 'center', paddingTop: '10px' }}>
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

  // Cava Criogénica & Tiempos de Reposo
  const isFrozen = Boolean(batch?.freeze_date && String(batch.freeze_date).trim() !== '');
  let daysSinceRoast = null;
  if (batch?.roast_date) {
    const roast = new Date(batch.roast_date);
    const targetDate = isFrozen ? new Date(batch.freeze_date) : new Date();
    const diffTime = Math.abs(targetDate - roast);
    daysSinceRoast = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

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



  const activeGrinderMeta = getGrinderConfig(grinderType);

  // Dynamic calculated microns for current form state based on calibrated grinder curves
  const currentMicrons = (() => {
    switch (grinderType) {
      case 'k_ultra':
        return activeGrinderMeta.calculateMicrons ? activeGrinderMeta.calculateMicrons(kUltraDial) : Math.round(parseFloat(kUltraDial) * 10 * 20);
      case 'ode_gen2':
        return activeGrinderMeta.calculateMicrons ? activeGrinderMeta.calculateMicrons(odeDial) : Math.round(350 + parseFloat(odeDial) * 75);
      case 'comandante':
        return activeGrinderMeta.calculateMicrons ? activeGrinderMeta.calculateMicrons(comandanteClicks) : Math.round(comandanteClicks * 30);
      case 'femobook':
        return activeGrinderMeta.calculateMicrons ? activeGrinderMeta.calculateMicrons(femobookClicks) : Math.round(femobookClicks * 18);
      case 'kingrinder':
        return activeGrinderMeta.calculateMicrons ? activeGrinderMeta.calculateMicrons(kingrinderClicks) : Math.round(kingrinderClicks * 16);
      case 'timemore':
        return activeGrinderMeta.calculateMicrons ? activeGrinderMeta.calculateMicrons(timemoreClicks) : Math.round(timemoreClicks * 33);
      case 'baratza':
        return activeGrinderMeta.calculateMicrons ? activeGrinderMeta.calculateMicrons(baratzaStep) : Math.round(400 + baratzaStep * 30);
      case 'jmax':
      default:
        return activeGrinderMeta.calculateMicrons ? activeGrinderMeta.calculateMicrons(jmaxRot, jmaxNum, jmaxClick) : calculateMicrons(jmaxRot, jmaxNum, jmaxClick);
    }
  })();

  const updateManualGrinder = (grinderId, val) => {
    baseGrinderRef.current = {
      ...baseGrinderRef.current,
      [grinderId]: val
    };
    const currentValidDose = (Number.isFinite(parseFloat(doseInG)) && parseFloat(doseInG) > 0)
      ? parseFloat(doseInG)
      : (Number.isFinite(baseDoseRef.current) && baseDoseRef.current > 0 ? baseDoseRef.current : 20.0);
    baseDoseRef.current = currentValidDose;
    setDoseAdjustmentFeedback(null);
  };

  const getDoseFeedbackForGrinder = (feedback, gId) => {
    if (!feedback) return null;
    const { fromDose, toDose, deltaMicrons, method: fMethod } = feedback;
    const baseVal = baseGrinderRef.current?.[gId];
    const res = scaleGrinderSettingForDose(gId, baseVal, fromDose, toDose, fMethod || method);
    let deltaText = '';

    if (gId === 'k_ultra' || gId === 'ode_gen2') {
      deltaText = `${res.delta > 0 ? '+' : ''}${res.delta.toFixed(1)} dial`;
    } else if (gId === 'baratza') {
      deltaText = `${res.delta > 0 ? '+' : ''}${res.delta} ${Math.abs(res.delta) === 1 ? 'paso' : 'pasos'}`;
    } else {
      deltaText = `${res.delta > 0 ? '+' : ''}${res.delta} ${Math.abs(res.delta) === 1 ? 'clic' : 'clics'}`;
    }

    return {
      deltaText,
      fromDose,
      toDose,
      deltaMicrons,
      description: toDose > fromDose ? 'Cama más profunda (+resistencia)' : 'Cama menos profunda (-resistencia)'
    };
  };

  const handleDoseChange = (nextDose) => {
    const parsed = typeof nextDose === 'number' ? nextDose : parseFloat(nextDose);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    const toDose = Math.max(1, Math.min(100, parseFloat(parsed.toFixed(1))));
    const fromDose = Number.isFinite(baseDoseRef.current) && baseDoseRef.current > 0 ? baseDoseRef.current : toDose;

    setDoseInG(toDose);

    if (fromDose === toDose) {
      if (baseGrinderRef.current) {
        setJmaxRot(baseGrinderRef.current.jmax.rot);
        setJmaxNum(baseGrinderRef.current.jmax.num);
        setJmaxClick(baseGrinderRef.current.jmax.click);
        setFemobookClicks(baseGrinderRef.current.femobook);
        setKUltraDial(baseGrinderRef.current.k_ultra);
        setOdeDial(baseGrinderRef.current.ode_gen2);
        setComandanteClicks(baseGrinderRef.current.comandante);
        setKingrinderClicks(baseGrinderRef.current.kingrinder);
        setTimemoreClicks(baseGrinderRef.current.timemore);
        setBaratzaStep(baseGrinderRef.current.baratza);
      }
      setDoseAdjustmentFeedback(null);
      return;
    }

    // Scale all 8 grinders relative to the calibrated base dose
    const resJmax = scaleGrinderSettingForDose('jmax', baseGrinderRef.current.jmax, fromDose, toDose, method);
    const resFemobook = scaleGrinderSettingForDose('femobook', baseGrinderRef.current.femobook, fromDose, toDose, method);
    const resKUltra = scaleGrinderSettingForDose('k_ultra', baseGrinderRef.current.k_ultra, fromDose, toDose, method);
    const resOde = scaleGrinderSettingForDose('ode_gen2', baseGrinderRef.current.ode_gen2, fromDose, toDose, method);
    const resComandante = scaleGrinderSettingForDose('comandante', baseGrinderRef.current.comandante, fromDose, toDose, method);
    const resKingrinder = scaleGrinderSettingForDose('kingrinder', baseGrinderRef.current.kingrinder, fromDose, toDose, method);
    const resTimemore = scaleGrinderSettingForDose('timemore', baseGrinderRef.current.timemore, fromDose, toDose, method);
    const resBaratza = scaleGrinderSettingForDose('baratza', baseGrinderRef.current.baratza, fromDose, toDose, method);

    setJmaxRot(resJmax.newVal.rot);
    setJmaxNum(resJmax.newVal.num);
    setJmaxClick(resJmax.newVal.click);
    setFemobookClicks(resFemobook.newVal);
    setKUltraDial(resKUltra.newVal);
    setOdeDial(resOde.newVal);
    setComandanteClicks(resComandante.newVal);
    setKingrinderClicks(resKingrinder.newVal);
    setTimemoreClicks(resTimemore.newVal);
    setBaratzaStep(resBaratza.newVal);

    const deltaMicrons = calculateDoseDeltaMicrons(method, fromDose, toDose);
    setDoseAdjustmentFeedback({
      fromDose,
      toDose,
      deltaMicrons,
      method
    });
  };

  const handleSelectGrinder = (id) => {
    setGrinderType(id);
    localStorage.setItem('default-grinder', id);
  };

  return (
    <div style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
      {/* Top Header - Row 1: Back Navigation + Status Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
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

      {/* V4 Modular Header Card */}
      <BatchHeaderCard
        batch={batch}
        isOwner={isOwner}
        onSubtractDose={handleDoseDeduction}
        onOpenCardModal={() => handleShareBatchCard(false)}
        onEditBatch={() => onEditBatch(batch)}
        onDeleteBatch={() => onDeleteBatch(batch.id, batch.name)}
        isFrozen={isFrozen}
        daysSinceRoast={daysSinceRoast}
        roastDotColor={getRoastDotColor(batch.roast_level)}
        lastRecipe={lastRecipe}
      />

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
            {/* V4 Modular Recipe Parameters Grid */}
            <RecipeParamsGrid
              method={method}
              setMethod={setMethod}
              doseInG={doseInG}
              setDoseInG={handleDoseChange}
              doseOutG={doseOutG}
              setDoseOutG={setDoseOutG}
              ratioVal={ratioVal}
              setRatioVal={setRatioVal}
              waterTemp={waterTemp}
              setWaterTemp={setWaterTemp}
              brewTime={brewTime}
              setBrewTime={setBrewTime}
              onApplyFamousRecipe={handleApplyFamousRecipe}
              selectedFamousRecipe={selectedFamousRecipe}
              doseAdjustmentFeedback={doseAdjustmentFeedback ? getDoseFeedbackForGrinder(doseAdjustmentFeedback, grinderType)?.deltaText : null}
            />

            {/* Receta Recomendada por IA */}
            <div className="candy-card static" style={{ marginBottom: '16px', padding: '14px 12px', backgroundColor: 'var(--bg-card)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '15px' }}>✨</span>
                  <span style={{ fontWeight: '900', fontSize: '12px', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
                    Asistencia IA Barista ({method})
                  </span>
                </div>
                <span style={{ fontSize: '11px', fontWeight: '900', color: 'var(--color-crimson)', background: 'var(--bg-header)', padding: '2px 8px', borderRadius: '6px' }}>{doseInG}g</span>
              </div>

              {aiError && <div style={{ color: 'var(--barista-accent-danger-text, #E53E3E)', fontSize: '11px', fontWeight: 'bold', marginTop: '8px' }}>⚠️ {aiError}</div>}

              {aiRecommendation ? (
                <div style={{ marginTop: '12px', padding: '12px', backgroundColor: 'var(--bg-canvas)', border: '1.5px solid var(--border-color)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* Badges de Parámetros Clave */}
                  {/* Badges de Parámetros Clave */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px', textAlign: 'center' }}>
                    <div style={{ background: 'var(--bg-card)', padding: '8px 6px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Ratio / Agua</div>
                      <strong style={{ fontSize: '12px', color: 'var(--color-crimson)' }}>{aiRecommendation.ratio} ({aiRecommendation.water_total_g || Math.round(doseInG * 15)}g)</strong>
                    </div>
                    <div style={{ background: 'var(--bg-card)', padding: '8px 6px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Temp</div>
                      <strong style={{ fontSize: '12px' }}>{String(aiRecommendation.temperature || 93).replace(/°C/i, '')}°C</strong>
                    </div>
                    <div style={{ background: 'var(--bg-card)', padding: '8px 6px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Tiempo</div>
                      <strong style={{ fontSize: '12px' }}>{aiRecommendation.brew_time}</strong>
                    </div>
                  </div>

                  {/* Chips resumen multivariable */}
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', fontSize: '9.5px' }}>
                    {aiRecommendation.is_frozen && <span style={{ background: 'var(--barista-accent-cryo-bg)', color: 'var(--barista-accent-cryo-text)', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>❄️ Frozen Dosing (-18°C)</span>}
                    {aiRecommendation.days_since_roast !== null && <span style={{ background: 'var(--barista-accent-honey-bg)', color: 'var(--barista-accent-honey-text)', padding: '2px 6px', borderRadius: '4px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '3px' }}><Timer size={10} /> Reposo: Día {aiRecommendation.days_since_roast}</span>}
                    {aiRecommendation.water_profile && <span style={{ background: 'var(--barista-accent-cryo-bg)', color: 'var(--barista-accent-cryo-text)', padding: '2px 6px', borderRadius: '4px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '3px' }}><Droplet size={10} /> {aiRecommendation.water_profile}</span>}
                    {aiRecommendation.active_grinder_dial && <span style={{ background: 'var(--bg-header)', color: 'var(--color-crimson)', padding: '2px 6px', borderRadius: '4px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '3px' }}><SlidersHorizontal size={10} /> {aiRecommendation.active_grinder_dial.grinder_name}: {aiRecommendation.active_grinder_dial.dial}</span>}
                    {aiRecommendation._source === 'barista_fallback' && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--barista-instr-bg, #FEF3C7)', border: '1px solid var(--barista-instr-border, #FDE68A)', color: 'var(--barista-accent-honey, #D97706)', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '800' }}>
                        <Zap size={13} />
                        <span>Motor Barista Físico (Micrones & Clics Calculados)</span>
                      </div>
                    )}
                  </div>

                  {/* Sub-pestañas para organizar Vertidos, Molinos, Física y Pasos */}
                  <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                    <button type="button" className={`filter-chip ${aiSubTab === 'pours' ? 'active' : ''}`} onClick={() => setAiSubTab('pours')} style={{ padding: '4px 10px', fontSize: '10.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Droplet size={12} /> Vertidos
                    </button>
                    <button type="button" className={`filter-chip ${aiSubTab === 'grinders' ? 'active' : ''}`} onClick={() => setAiSubTab('grinders')} style={{ padding: '4px 10px', fontSize: '10.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Settings2 size={12} /> Molinos
                    </button>
                    <button type="button" className={`filter-chip ${aiSubTab === 'physics' ? 'active' : ''}`} onClick={() => setAiSubTab('physics')} style={{ padding: '4px 10px', fontSize: '10.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Sparkles size={12} /> Física
                    </button>
                    <button type="button" className={`filter-chip ${aiSubTab === 'steps' ? 'active' : ''}`} onClick={() => setAiSubTab('steps')} style={{ padding: '4px 10px', fontSize: '10.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ListOrdered size={12} /> Pasos
                    </button>
                  </div>

                  {/* Sub-Contenido: Vertidos */}
                  {aiSubTab === 'pours' && aiRecommendation.pours && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {(() => {
                        let runningInteractive = 0;
                        return aiRecommendation.pours.map((p, idx) => {
                          const stepW = parseFloat(p.water_g || p.water) || 0;
                          const totalW = p.total_water_g !== undefined ? parseFloat(p.total_water_g) : (runningInteractive + stepW);
                          runningInteractive = totalW;
                          return (
                            <div key={idx} style={{ padding: '8px 10px', background: 'var(--bg-card)', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '11px' }}>
                              {p.valve === 'closed' && (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '4px', fontSize: '10.5px', fontWeight: '800', background: 'var(--barista-accent-danger-bg)', color: 'var(--barista-accent-danger-text)', border: '1px solid var(--border-color)', marginBottom: '4px' }}>🔒 VÁLVULA CERRADA (Bloom + Inmersión)</div>
                              )}
                              {p.valve === 'open' && (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '4px', fontSize: '10.5px', fontWeight: '800', background: 'var(--barista-accent-mint-bg)', color: 'var(--barista-accent-mint-text)', border: '1px solid var(--border-color)', marginBottom: '4px' }}>🔓 VÁLVULA ABIERTA (Percolación)</div>
                              )}
                              {p.valve === 'half' && (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '4px', fontSize: '10.5px', fontWeight: '800', background: 'var(--barista-accent-honey-bg)', color: 'var(--barista-accent-honey-text)', border: '1px solid var(--border-color)', marginBottom: '4px' }}>⚡ VÁLVULA MEDIA (Flujo Regulado 50%)</div>
                              )}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                                <span style={{ fontWeight: '800', color: 'var(--color-crimson)', fontSize: '12px', wordBreak: 'break-word', flex: '1 1 180px' }}>
                                  {p.step || idx + 1}. {p.label}
                                </span>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <Timer size={11} /> {p.time}
                                </span>
                              </div>
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                                  Paso: <strong style={{ color: 'var(--color-text)' }}>+{stepW}g</strong>
                                </span>
                                <span style={{
                                  fontSize: '11px',
                                  fontWeight: '900',
                                  color: 'var(--barista-accent-honey, #D97706)',
                                  background: 'var(--barista-bg-elevated, #F1F5F9)',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  border: '1px solid var(--barista-border-hairline, var(--border-color))',
                                  fontFamily: 'var(--font-mono)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}>
                                  <Target size={11} /> Acumulado: {totalW}g
                                </span>
                              </div>
                              {p.description && <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '4px', lineHeight: '1.3' }}>{p.description}</div>}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}

                  {/* Sub-Contenido: Molinos */}
                  {aiSubTab === 'grinders' && (
                    <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-card)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      {aiRecommendation.active_grinder_dial && (
                        <div style={{ background: 'var(--bg-header)', border: '1.5px solid var(--color-crimson)', borderRadius: '6px', padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: '800', color: 'var(--color-crimson)' }}>
                              Tu Molino: {aiRecommendation.active_grinder_dial.grinder_name}
                            </div>
                            <div style={{ fontSize: '13px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}>
                              {aiRecommendation.active_grinder_dial.dial}
                            </div>
                            <div style={{ fontSize: '9.5px', color: 'var(--color-text-muted)' }}>
                              {aiRecommendation.active_grinder_dial.burr_type} • {aiRecommendation.active_grinder_dial.microns}
                            </div>
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: 'bold', background: 'var(--color-crimson)', color: '#FFF', padding: '3px 8px', borderRadius: '4px' }}>
                            Calibrado ✅
                          </span>
                        </div>
                      )}

                      {aiRecommendation.grinders && (
                        <div>
                          <div style={{ fontSize: '9.5px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                            Matriz Multimolino Completa:
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '6px', fontSize: '9.5px', borderTop: '1px dashed var(--border-color)', paddingTop: '6px' }}>
                            {aiRecommendation.grinders.jmax && <div><strong>J-Max:</strong> {String(aiRecommendation.grinders.jmax).split('(')[0]}</div>}
                            {aiRecommendation.grinders.k_ultra && <div><strong>K-Ultra:</strong> {aiRecommendation.grinders.k_ultra}</div>}
                            {aiRecommendation.grinders.ode_gen2 && <div><strong>Fellow Ode:</strong> {aiRecommendation.grinders.ode_gen2}</div>}
                            {aiRecommendation.grinders.comandante && <div><strong>Comandante:</strong> {aiRecommendation.grinders.comandante}</div>}
                            {(aiRecommendation.grinders.femobook_a2 || aiRecommendation.grinders.femobook) && (
                              <div><strong>Femobook:</strong> {aiRecommendation.grinders.femobook_a2 || aiRecommendation.grinders.femobook}</div>
                            )}
                            {(aiRecommendation.grinders.kingrinder_k6 || aiRecommendation.grinders.kingrinder) && (
                              <div><strong>Kingrinder:</strong> {aiRecommendation.grinders.kingrinder_k6 || aiRecommendation.grinders.kingrinder}</div>
                            )}
                            {aiRecommendation.grinders.timemore && <div><strong>Timemore:</strong> {aiRecommendation.grinders.timemore}</div>}
                            {aiRecommendation.grinders.baratza && <div><strong>Baratza:</strong> {aiRecommendation.grinders.baratza}</div>}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sub-Contenido: Física */}
                  {aiSubTab === 'physics' && aiRecommendation.physics_analysis && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '6px', fontSize: '10.5px' }}>
                      {aiRecommendation.physics_analysis.roast_and_density && (
                        <div style={{ background: 'var(--bg-card)', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                          <strong style={{ color: 'var(--color-crimson)', display: 'block', fontSize: '10px' }}>🏔️ Densidad & Tueste:</strong>
                          <span style={{ color: 'var(--color-text-muted)', lineHeight: '1.3' }}>{aiRecommendation.physics_analysis.roast_and_density}</span>
                        </div>
                      )}
                      {aiRecommendation.physics_analysis.degas_and_rest && (
                        <div style={{ background: 'var(--bg-card)', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                          <strong style={{ color: 'var(--color-crimson)', display: 'block', fontSize: '10px' }}>⏳ Desgasificación (CO₂):</strong>
                          <span style={{ color: 'var(--color-text-muted)', lineHeight: '1.3' }}>{aiRecommendation.physics_analysis.degas_and_rest}</span>
                        </div>
                      )}
                      {aiRecommendation.physics_analysis.burr_and_fines && (
                        <div style={{ background: 'var(--bg-card)', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                          <strong style={{ color: 'var(--color-crimson)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px' }}><SlidersHorizontal size={11} /> Muelas & Finos:</strong>
                          <span style={{ color: 'var(--color-text-muted)', lineHeight: '1.3' }}>{aiRecommendation.physics_analysis.burr_and_fines}</span>
                        </div>
                      )}
                      {aiRecommendation.physics_analysis.extraction_strategy && (
                        <div style={{ background: 'var(--bg-card)', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                          <strong style={{ color: 'var(--color-crimson)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px' }}><Target size={11} /> Estrategia Hidrodinámica:</strong>
                          <span style={{ color: 'var(--color-text-muted)', lineHeight: '1.3' }}>{aiRecommendation.physics_analysis.extraction_strategy}</span>
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

                  <button type="button" className="btn-candy primary" onClick={() => handleStartBrewGuide(aiRecommendation)} style={{ width: '100%', marginBottom: '8px', minHeight: '44px', backgroundColor: 'var(--barista-accent-honey, #D97706)', color: '#FFFFFF', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Play size={15} fill="#FFFFFF" />
                    <span>Iniciar Extracción (Modo Barista)</span>
                  </button>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <button type="button" className="btn-candy primary" onClick={handleApplyAiRecipe} style={{ flex: 1, padding: '8px', fontSize: '11px', minHeight: '38px' }}>
                      Aplicar al Formulario
                    </button>
                    <button type="button" className="btn-candy secondary" onClick={() => setAiRecommendation(null)} style={{ padding: '8px 12px', fontSize: '11px', minHeight: '38px', margin: 0 }}>
                      Cerrar
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" className="btn-candy secondary" onClick={handleAiRecommend} disabled={aiLoading} style={{ width: '100%', marginTop: '10px', padding: '8px', fontSize: '11.5px', minHeight: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  {aiLoading ? (
                    <span>Generando receta con Thinking Mode...</span>
                  ) : (
                    <>
                      <Sparkles size={14} color="var(--barista-accent-honey, #D97706)" />
                      <span>Diseñar Receta IA</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* V4 Modular Grinder Sync Matrix */}
            <GrinderSyncMatrix
              grinderType={grinderType}
              setGrinderType={handleSelectGrinder}
              currentMicrons={currentMicrons}
              jmaxRot={jmaxRot}
              setJmaxRot={(v) => { setJmaxRot(v); updateManualGrinder('jmax', { rot: v, num: jmaxNum, click: jmaxClick }); }}
              jmaxNum={jmaxNum}
              setJmaxNum={(v) => { setJmaxNum(v); updateManualGrinder('jmax', { rot: jmaxRot, num: v, click: jmaxClick }); }}
              jmaxClick={jmaxClick}
              setJmaxClick={(v) => { setJmaxClick(v); updateManualGrinder('jmax', { rot: jmaxRot, num: jmaxNum, click: v }); }}
              kUltraDial={kUltraDial}
              setKUltraDial={(v) => { setKUltraDial(v); updateManualGrinder('k_ultra', v); }}
              odeDial={odeDial}
              setOdeDial={(v) => { setOdeDial(v); updateManualGrinder('ode_gen2', v); }}
              comandanteClicks={comandanteClicks}
              setComandanteClicks={(v) => { setComandanteClicks(v); updateManualGrinder('comandante', v); }}
              femobookClicks={femobookClicks}
              setFemobookClicks={(v) => { setFemobookClicks(v); updateManualGrinder('femobook', v); }}
              kingrinderClicks={kingrinderClicks}
              setKingrinderClicks={(v) => { setKingrinderClicks(v); updateManualGrinder('kingrinder', v); }}
              timemoreClicks={timemoreClicks}
              setTimemoreClicks={(v) => { setTimemoreClicks(v); updateManualGrinder('timemore', v); }}
              baratzaStep={baratzaStep}
              setBaratzaStep={(v) => { setBaratzaStep(v); updateManualGrinder('baratza', v); }}
              updateManualGrinder={updateManualGrinder}
              getGrindString={getGrindString}
            />

            {/* Evaluacion Sensorial */}
            <div className="candy-card static" style={{ marginTop: '14px', padding: '14px 12px' }}>
              <div style={{ fontSize: '10.5px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>Evaluación Sensorial</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px', marginBottom: '10px' }}>
                <div>
                  <label className="barista-label">Balance</label>
                  <select className="candy-input" style={{ padding: '6px 8px', fontSize: '12px', minHeight: '38px' }} value={sensoryBalance} onChange={e => setSensoryBalance(e.target.value)}>
                    <option value="Dulce">Dulce</option>
                    <option value="Ácido">Ácido</option>
                    <option value="Amargo">Amargo</option>
                  </select>
                </div>
                <div>
                  <label className="barista-label">Cuerpo</label>
                  <select className="candy-input" style={{ padding: '6px 8px', fontSize: '12px', minHeight: '38px' }} value={sensoryBody} onChange={e => setSensoryBody(e.target.value)}>
                    <option value="Ligero">Ligero</option>
                    <option value="Medio">Medio</option>
                    <option value="Sedoso">Sedoso</option>
                  </select>
                </div>
                <div>
                  <label className="barista-label">Extracción</label>
                  <select className="candy-input" style={{ padding: '6px 8px', fontSize: '12px', minHeight: '38px' }} value={sensoryExtraction} onChange={e => setSensoryExtraction(e.target.value)}>
                    <option value="En Punto">En Punto</option>
                    <option value="Sub">Sub (Agrio)</option>
                    <option value="Sobre">Sobre (Amargo)</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="barista-label">Notas de Cata de Extracción</label>
                <input className="barista-input" value={notes} onChange={(e) => setNotes(e.target.value)} type="text" placeholder="Ej. Muy dulzón, acidez limpia..." />
              </div>
            </div>

            {/* Form Actions (In-Flow, No Floating Sticky Bar) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(10);
                  handleStartBrewGuide({
                    method,
                    dose_in_g: doseInG,
                    water_total_g: method === 'Espresso' ? doseOutG : Math.round(doseInG * ratioVal),
                    ratio: method === 'Espresso' ? `1:${(doseOutG / doseInG).toFixed(1)}` : `1:${ratioVal}`,
                    temperature: `${waterTemp}°C`,
                    brew_time: brewTime,
                    grind: getGrindString(),
                    pours: aiRecommendation?.pours || [],
                    active_grinder_dial: {
                      grinder_id: grinderType,
                      dial: getGrindString()
                    }
                  });
                }}
                style={{
                  width: '100%',
                  minHeight: '48px',
                  height: '48px',
                  backgroundColor: 'var(--accent-honey, #D97706)',
                  color: '#FFFFFF',
                  borderRadius: 'var(--radius-md, 12px)',
                  border: 'none',
                  fontSize: '15px',
                  fontWeight: '800',
                  fontFamily: 'var(--font-display, inherit)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm, 0 2px 8px rgba(217, 119, 6, 0.25))'
                }}
              >
                <Play size={18} fill="#FFFFFF" />
                <span>Iniciar Extracción (Modo Barista)</span>
              </button>

              {isOwner ? (
                <button
                  type="submit"
                  className="barista-btn-primary"
                  style={{
                    width: '100%',
                    minHeight: '48px',
                    height: '48px',
                    fontSize: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Save size={18} />
                  <span>Guardar Bitácora</span>
                </button>
              ) : (
                <button 
                  type="button" 
                  onClick={onRequireAuth} 
                  className="barista-btn-secondary" 
                  style={{ width: '100%', minHeight: '44px', height: '44px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: 0.9, cursor: 'pointer' }}
                >
                  🔒 Solo el propietario puede registrar extracciones {currentUser ? '' : '(Iniciar Sesión)'}
                </button>
              )}
            </div>
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
              <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--barista-accent-honey, #D97706)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px', fontFamily: 'var(--font-heading)' }}>
                Última Configuración Exitosa
              </div>
              <div style={{ fontSize: '14px', fontWeight: '900', fontFamily: 'var(--font-mono)' }}>
                {lastRecipe.method} | {lastRecipe.grind} | {lastRecipe.ratio}
              </div>
              {isOwner ? (
                <button className="barista-btn-primary" onClick={handleRepeatLastRecipe} style={{ width: '100%', marginTop: '10px', minHeight: '44px', height: '44px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <Zap size={14} />
                  ⚡ Repetir y Guardar esta Receta (-1 Tubo)
                </button>
              ) : (
                <button className="barista-btn-secondary" onClick={() => handleLoadRecipeToForm(lastRecipe)} style={{ width: '100%', marginTop: '10px', minHeight: '44px', height: '44px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <Zap size={15} />
                  <span>Cargar Parámetros al Preparador</span>
                </button>
              )}
            </div>
          )}

          {/* Sub-selector de vista: Linaje Dial-in vs Lista de Recetas */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', padding: '4px', backgroundColor: 'var(--bg-card, rgba(0,0,0,0.2))', borderRadius: '10px', border: '1px solid var(--border-color, rgba(255,255,255,0.08))' }}>
            <button
              type="button"
              className={`cupertino-segmented-btn ${recipeViewMode === 'timeline' ? 'active' : ''}`}
              style={{ flex: 1, padding: '8px 12px', minHeight: '38px', fontSize: '12px', fontWeight: '700', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', border: 'none', cursor: 'pointer', transition: 'all 0.15s ease', background: recipeViewMode === 'timeline' ? 'var(--color-crimson, #E11D48)' : 'transparent', color: recipeViewMode === 'timeline' ? '#fff' : 'var(--color-text-muted, #94A3B8)' }}
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(6);
                setRecipeViewMode('timeline');
              }}
            >
              <Target size={14} />
              <span>Linaje Dial-in</span>
            </button>
            <button
              type="button"
              className={`cupertino-segmented-btn ${recipeViewMode === 'cards' ? 'active' : ''}`}
              style={{ flex: 1, padding: '8px 12px', minHeight: '38px', fontSize: '12px', fontWeight: '700', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', border: 'none', cursor: 'pointer', transition: 'all 0.15s ease', background: recipeViewMode === 'cards' ? 'var(--color-crimson, #E11D48)' : 'transparent', color: recipeViewMode === 'cards' ? '#fff' : 'var(--color-text-muted, #94A3B8)' }}
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(6);
                setRecipeViewMode('cards');
              }}
            >
              <ListOrdered size={14} />
              <span>Lista de Recetas</span>
            </button>
          </div>

          {recipeViewMode === 'timeline' ? (
            <DialInTimeline
              recipes={batch?.recipes || []}
              activeGrinderId={grinderType}
              onSelectRecipe={(rec) => handleLoadRecipeToForm(rec)}
              onBrewRecipe={(rec) => handleStartBrewGuide(rec)}
            />
          ) : (
            Array.isArray(batch?.recipes) && batch.recipes.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {batch.recipes.map(r => (
                  <div key={r.id} className="candy-card static" style={{ padding: '12px', fontSize: '11px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold' }}>
                      <span>{r.method} ({r.ratio})</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{r.temperature} • {r.brew_time}</span>
                        <button 
                          type="button"
                          className="btn-candy" 
                          onClick={() => handleStartBrewGuide(r)}
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', fontSize: '11px', margin: 0 }}
                        > 
                          <Play size={12} fill="currentColor" /> Preparar 
                        </button>
                      </div>
                    </div>
                    <div style={{ color: 'var(--color-crimson)', fontWeight: 'bold', marginTop: '2px' }}>
                      Molienda: {r.grind}
                    </div>
                    {r.notes && <div style={{ fontStyle: 'italic', marginTop: '4px', color: 'var(--color-text-muted)', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>"{r.notes}"</div>}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-muted)', fontSize: '12px' }}>
                No hay preparaciones registradas aún para este lote.
              </div>
            )
          )}
        </div>
      )}

      {/* PESTAÑA 3: HERRAMIENTAS BARISTA & NFC */}
      {activeTab === 'tools' && (
        <div className="animate-entrance" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Calculadora de Ratio */}
          <div className="candy-card static" style={{ padding: '18px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calculator size={16} color="var(--color-crimson)" />
              Calculadora de Ratio & Agua
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ flex: 1, margin: 0 }}>
                <label style={{ fontSize: '10px' }}>Café (g)</label>
                <input type="number" inputMode="decimal" step="0.5" className="candy-input" value={calcDose} onChange={(e) => { const d = parseFloat(e.target.value) || 0; setCalcDose(d); setCalcWater(Math.round(d * calcRatio)); }} />
              </div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', paddingBottom: '8px' }}>×</div>
              <div className="form-group" style={{ flex: 1, margin: 0 }}>
                <label style={{ fontSize: '10px' }}>Ratio 1:</label>
                <input type="number" inputMode="decimal" step="0.5" className="candy-input" value={calcRatio} onChange={(e) => { const r = parseFloat(e.target.value) || 0; setCalcRatio(r); setCalcWater(Math.round(calcDose * r)); }} />
              </div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', paddingBottom: '8px' }}>=</div>
              <div className="form-group" style={{ flex: 1, margin: 0 }}>
                <label style={{ fontSize: '10px' }}>Agua (g)</label>
                <input type="number" inputMode="decimal" className="candy-input" value={calcWater} onChange={(e) => { const w = parseFloat(e.target.value) || 0; setCalcWater(w); if (calcDose > 0) setCalcRatio(parseFloat((w / calcDose).toFixed(1))); }} />
              </div>
            </div>
            <button type="button" className="btn-candy accent" style={{ width: '100%', marginTop: '10px', padding: '6px', fontSize: '10.5px' }} onClick={() => { setDoseInG(calcDose); setRatioVal(calcRatio); setActiveTab('brew'); if (showToast) showToast('Valores transferidos a la pestaña de preparación.', { type: 'success' }); }}>
              Transferir a mi receta
            </button>
          </div>

          <div className="candy-card static" style={{ padding: '14px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '8px', color: 'var(--color-crimson)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <SlidersHorizontal size={14} />
              <span>Equivalencias de Molienda</span>
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
          zIndex: 11000, 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'flex-start',
          padding: '16px', 
          boxSizing: 'border-box',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch'
        }} onClick={() => { setShareImage(null); setShareStatus(''); }}>
          <div className="candy-card static animate-entrance" style={{
            maxWidth: '480px', width: '100%',
            maxHeight: 'calc(100dvh - 32px)',
            margin: 'auto',
            padding: '16px', boxSizing: 'border-box',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            display: 'flex', flexDirection: 'column', gap: '10px',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
              
              {/* Row 1: Scope Selector (Ficha de este café vs Sticker Story vs Carta Completa) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShareScope('single');
                      handleShareBatchCard(shareIncludeRecipe, shareTemplate, 'single', stickerTransparent);
                    }}
                    style={{
                      padding: '5px 8px',
                      fontSize: '10.5px',
                      borderRadius: '6px',
                      border: shareScope === 'single' ? '1px solid var(--color-crimson)' : '1px solid var(--border-color)',
                      backgroundColor: shareScope === 'single' ? 'var(--bg-card)' : 'var(--bg-canvas)',
                      fontWeight: shareScope === 'single' ? '800' : '500',
                      color: shareScope === 'single' ? 'var(--color-crimson)' : 'var(--color-text)',
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Share2 size={12} /> Ficha
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShareScope('sticker');
                      handleShareBatchCard(shareIncludeRecipe, shareTemplate, 'sticker', stickerTransparent);
                    }}
                    style={{
                      padding: '5px 8px',
                      fontSize: '10.5px',
                      borderRadius: '6px',
                      border: shareScope === 'sticker' ? '1px solid var(--color-crimson)' : '1px solid var(--border-color)',
                      backgroundColor: shareScope === 'sticker' ? 'var(--bg-card)' : 'var(--bg-canvas)',
                      fontWeight: shareScope === 'sticker' ? '800' : '500',
                      color: shareScope === 'sticker' ? 'var(--color-crimson)' : 'var(--color-text)',
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <ImageIcon size={12} /> Sticker Story
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShareScope('menu');
                      handleShareBatchCard(shareIncludeRecipe, shareTemplate, 'menu', stickerTransparent);
                    }}
                    style={{
                      padding: '5px 8px',
                      fontSize: '10.5px',
                      borderRadius: '6px',
                      border: shareScope === 'menu' ? '1px solid var(--color-crimson)' : '1px solid var(--border-color)',
                      backgroundColor: shareScope === 'menu' ? 'var(--bg-card)' : 'var(--bg-canvas)',
                      fontWeight: shareScope === 'menu' ? '800' : '500',
                      color: shareScope === 'menu' ? 'var(--color-crimson)' : 'var(--color-text)',
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Coffee size={12} /> Carta ({batches && batches.length > 0 ? batches.length : 1})
                    </span>
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

              {/* Row 2: Sub-options (Only when scope is single or sticker) */}
              {shareScope === 'sticker' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '6px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--color-text-muted)' }}>FORMATO:</span>
                    <button 
                      type="button" 
                      onClick={() => {
                        setStickerOrientation('horizontal');
                        handleShareBatchCard(shareIncludeRecipe, shareTemplate, 'sticker', stickerTransparent, 'horizontal');
                      }}
                      style={{
                        padding: '3px 7px',
                        fontSize: '9.5px',
                        borderRadius: '4px',
                        border: stickerOrientation === 'horizontal' ? '1.5px solid var(--color-crimson)' : '1px solid var(--border-color)',
                        backgroundColor: stickerOrientation === 'horizontal' ? 'var(--bg-header)' : 'var(--bg-card)',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        color: stickerOrientation === 'horizontal' ? 'var(--color-crimson)' : 'var(--color-text)'
                      }}
                    >
                      🏷️ Horizontal
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        setStickerOrientation('vertical');
                        handleShareBatchCard(shareIncludeRecipe, shareTemplate, 'sticker', stickerTransparent, 'vertical');
                      }}
                      style={{
                        padding: '3px 7px',
                        fontSize: '9.5px',
                        borderRadius: '4px',
                        border: stickerOrientation === 'vertical' ? '1.5px solid var(--color-crimson)' : '1px solid var(--border-color)',
                        backgroundColor: stickerOrientation === 'vertical' ? 'var(--bg-header)' : 'var(--bg-card)',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        color: stickerOrientation === 'vertical' ? 'var(--color-crimson)' : 'var(--color-text)'
                      }}
                    >
                      📱 Vertical
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--color-text-muted)' }}>FONDO:</span>
                    <button 
                      type="button" 
                      onClick={() => {
                        setStickerTransparent(false);
                        handleShareBatchCard(shareIncludeRecipe, shareTemplate, 'sticker', false, stickerOrientation);
                      }}
                      style={{
                        padding: '3px 7px',
                        fontSize: '9.5px',
                        borderRadius: '4px',
                        border: !stickerTransparent ? '1.5px solid var(--color-crimson)' : '1px solid var(--border-color)',
                        backgroundColor: !stickerTransparent ? 'rgba(188, 84, 73, 0.08)' : 'var(--bg-card)',
                        color: !stickerTransparent ? 'var(--color-crimson)' : 'var(--color-text)',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      ⬛ Sólido
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        setStickerTransparent(true);
                        handleShareBatchCard(shareIncludeRecipe, shareTemplate, 'sticker', true, stickerOrientation);
                      }}
                      style={{
                        padding: '3px 7px',
                        fontSize: '9.5px',
                        borderRadius: '4px',
                        border: stickerTransparent ? '1.5px solid var(--color-crimson)' : '1px solid var(--border-color)',
                        backgroundColor: stickerTransparent ? 'rgba(188, 84, 73, 0.08)' : 'var(--bg-card)',
                        color: stickerTransparent ? 'var(--color-crimson)' : 'var(--color-text)',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      🏁 Transp.
                    </button>
                  </div>
                </div>
              )}

              {(shareScope === 'single' || shareScope === 'sticker') && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10.5px', fontWeight: '700', color: 'var(--color-text)' }}>
                    {shareScope === 'sticker' ? 'CONTENIDO DEL STICKER:' : batch?.name}
                  </span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button 
                      type="button" 
                      onClick={() => { setShareIncludeRecipe(false); handleShareBatchCard(false, shareTemplate, shareScope, stickerTransparent, stickerOrientation); }}
                      style={{ padding: '3px 8px', fontSize: '10px', borderRadius: '4px', border: !shareIncludeRecipe ? '1px solid var(--color-crimson)' : '1px solid var(--border-color)', backgroundColor: !shareIncludeRecipe ? 'rgba(188, 84, 73, 0.08)' : 'var(--bg-card)', color: !shareIncludeRecipe ? 'var(--color-crimson)' : 'var(--color-text)', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      🌾 Perfil & Notas
                    </button>
                    <button 
                      type="button" 
                      onClick={() => { setShareIncludeRecipe(true); handleShareBatchCard(true, shareTemplate, shareScope, stickerTransparent, stickerOrientation); }}
                      style={{ padding: '3px 8px', fontSize: '10px', borderRadius: '4px', border: shareIncludeRecipe ? '1px solid var(--color-crimson)' : '1px solid var(--border-color)', backgroundColor: shareIncludeRecipe ? 'rgba(188, 84, 73, 0.08)' : 'var(--bg-card)', color: shareIncludeRecipe ? 'var(--color-crimson)' : 'var(--color-text)', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      🧾 Telemetría / Receta
                    </button>
                  </div>
                </div>
              )}

              {/* Aesthetic Template Selector */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center', background: 'var(--bg-canvas)', padding: '5px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '9.5px', fontWeight: '800', color: 'var(--color-text-muted)', padding: '0 4px', letterSpacing: '0.04em' }}>COLECCIÓN:</span>
                {[
                  { id: 'studio', label: 'Studio' },
                  { id: 'kissaten', label: 'Kissaten' },
                  { id: 'blueprint', label: 'Dark Lab' },
                  { id: 'neobrutalist', label: 'Nomad' },
                  { id: 'diner', label: 'Botanical' }
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setShareTemplate(t.id);
                      try { localStorage.setItem('beantag-share-style', t.id); } catch (e) {}
                      handleShareBatchCard(shareIncludeRecipe, t.id, shareScope, stickerTransparent, stickerOrientation);
                    }}
                    style={{
                      flex: '1 1 auto',
                      padding: '5px 8px',
                      fontSize: '10.5px',
                      borderRadius: '6px',
                      border: (shareTemplate || 'studio') === t.id ? '1px solid var(--color-crimson)' : '1px solid transparent',
                      backgroundColor: (shareTemplate || 'studio') === t.id ? 'var(--bg-card)' : 'transparent',
                      fontWeight: (shareTemplate || 'studio') === t.id ? '800' : '600',
                      color: (shareTemplate || 'studio') === t.id ? 'var(--color-crimson)' : 'var(--color-text)',
                      cursor: 'pointer'
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{
              textAlign: 'center',
              backgroundColor: 'var(--bg-canvas, #F1F5F9)',
              borderRadius: '12px',
              padding: '8px',
              overflow: 'hidden',
              flex: '0 1 auto',
              minHeight: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img 
                src={shareImage} 
                alt="Ticket de café POS o Carta" 
                style={{
                  maxWidth: '100%',
                  maxHeight: 'calc(45dvh - 50px)',
                  height: 'auto',
                  objectFit: 'contain',
                  borderRadius: '6px', 
                  display: 'block',
                  margin: '0 auto',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.14)'
                }} 
              />
            </div>
            
            {shareStatus && (
              <div style={{
                background: shareStatus.includes('❌') ? 'var(--barista-accent-danger-bg)' : 'var(--barista-accent-mint-bg)',
                color: shareStatus.includes('❌') ? 'var(--barista-accent-danger-text)' : 'var(--barista-accent-mint-text)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '11.5px',
                fontWeight: '600',
                textAlign: 'center',
                flexShrink: 0
              }}>
                {shareStatus}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: 'auto', flexShrink: 0, paddingTop: '4px' }}>
              <button 
                type="button" 
                className="btn-candy" 
                style={{ minHeight: '44px', padding: '10px 8px', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11.5px', fontWeight: '700' }} 
                onClick={handleCopyShareText}
              >
                <ClipboardCopy size={16} strokeWidth={2.2} />
                Copiar Texto (WhatsApp)
              </button>

              <button 
                type="button" 
                className="btn-candy primary" 
                style={{ minHeight: '44px', padding: '10px 8px', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11.5px', fontWeight: '700' }} 
                onClick={handleNativeShare}
              >
                <Share2 size={16} strokeWidth={2.2} />
                Compartir PNG (2x)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Barista Brew Guide Modal */}
      {isBrewGuideOpen && (
        <Suspense fallback={null}>
          <BrewGuideModal
            isOpen={isBrewGuideOpen}
            onClose={() => setIsBrewGuideOpen(false)}
            recipe={activeBrewRecipe}
            batch={batch}
            onSaveTunedRecipe={handleSaveTunedRecipe}
          />
        </Suspense>
      )}
    </div>
  );
}
